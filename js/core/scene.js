/* Superstar World - screens ("scenes") and the things every scene needs.
   A scene is registered once:  RF.register('balloons', { enter(root, params) {...}, exit() {...}, music: 'ambient' })
   and opened with            RF.go('balloons', { players: ['lilah'] })
   Anything a scene sets up through RF.scope (listeners, timers, loops, canvases) is cleaned up
   automatically when the scene closes, so nothing keeps running in the background. */
(function (RF) {
    'use strict';
    const U = RF.util;
    const registry = {};
    let current = null;       // { name, def, root, cleanups, params, token }
    let busy = false;
    let queued = null;
    let stage = null;
    let curtain = null;

    RF.register = (name, def) => { registry[name] = def; };
    RF.hasScene = (name) => !!registry[name];
    RF.sceneNames = () => Object.keys(registry);
    Object.defineProperty(RF, 'currentScene', { get: () => (current ? current.name : null) });
    Object.defineProperty(RF, 'currentParams', { get: () => (current ? current.params : null) });

    // ---------------- Scene-scoped helpers ----------------
    const scope = {
        // Runs fn when the current scene closes
        add(fn) {
            if (current) current.cleanups.push(fn);
        },
        // addEventListener that is removed automatically
        listen(target, type, fn, opts) {
            target.addEventListener(type, fn, opts);
            scope.add(() => target.removeEventListener(type, fn, opts));
        },
        // RF.events.on that is removed automatically
        on(event, fn) {
            scope.add(RF.events.on(event, fn));
        },
        timeout(fn, ms) {
            const id = setTimeout(fn, ms);
            scope.add(() => clearTimeout(id));
            return id;
        },
        interval(fn, ms) {
            const id = setInterval(fn, ms);
            scope.add(() => clearInterval(id));
            return id;
        },
        // True while the scene that called this is still open (use in async callbacks)
        token() {
            return current ? current.token : { alive: false };
        },
        /* Game loop at a steady 60 steps a second (the same speed on every screen).
           update(dt) gets dt = 1/60 s. render(alpha) draws. Pauses when the app is hidden. */
        loop({ update, render, step = 1 / 60 }) {
            let last = 0;
            let acc = 0;
            let raf = 0;
            let paused = false;
            let stopped = false;
            function frame(t) {
                if (stopped) return;
                raf = requestAnimationFrame(frame);
                if (paused || document.hidden) {
                    last = t;
                    return;
                }
                let dt = last ? (t - last) / 1000 : step;
                last = t;
                if (dt > 0.1) dt = 0.1; // after a hiccup, don't fast-forward
                if (update) {
                    acc += dt;
                    let n = 0;
                    while (acc >= step && n < 6) {
                        update(step);
                        acc -= step;
                        n++;
                    }
                    if (n >= 6) acc = 0;
                }
                if (render) render(acc / step);
            }
            raf = requestAnimationFrame(frame);
            const handle = {
                stop() { stopped = true; cancelAnimationFrame(raf); },
                pause() { paused = true; },
                resume() { paused = false; last = 0; },
                get paused() { return paused; }
            };
            scope.add(handle.stop);
            return handle;
        },
        /* A full-size canvas inside parent, sharp on retina screens.
           Draw in CSS pixels: view.W x view.H. view.onResize(fn) is called on every size change. */
        canvas(parent, { dprMax = 2, className = '' } = {}) {
            const canvas = U.el('canvas', { className: 'scene-canvas ' + className });
            parent.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const view = {
                canvas, ctx, W: 1, H: 1, dpr: 1, handlers: [],
                onResize(fn) { view.handlers.push(fn); },
                // Converts a pointer/mouse event to canvas coordinates
                toLocal(e) {
                    const r = canvas.getBoundingClientRect();
                    return { x: e.clientX - r.left, y: e.clientY - r.top };
                },
                resize
            };
            function resize() {
                const r = canvas.getBoundingClientRect();
                const W = Math.max(1, Math.round(r.width || parent.clientWidth || window.innerWidth));
                const H = Math.max(1, Math.round(r.height || parent.clientHeight || window.innerHeight));
                const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
                if (W === view.W && H === view.H && dpr === view.dpr && canvas.width) return;
                view.W = W;
                view.H = H;
                view.dpr = dpr;
                canvas.width = Math.round(W * dpr);
                canvas.height = Math.round(H * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                view.handlers.forEach((fn) => fn(W, H));
            }
            view.W = 0;
            resize();
            scope.listen(window, 'resize', resize);
            scope.listen(window, 'orientationchange', () => setTimeout(resize, 250));
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => resize());
                ro.observe(canvas);
                scope.add(() => ro.disconnect());
            }
            return view;
        },
        /* Multi-touch friendly pointer handling for a canvas or element.
           handlers: { down(p), move(p), up(p) } where p = { id, x, y, e } in local coordinates. */
        pointer(target, handlers) {
            const toLocal = (e) => {
                const r = target.getBoundingClientRect();
                return { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top, e };
            };
            const active = new Set();
            scope.listen(target, 'pointerdown', (e) => {
                if (e.button !== undefined && e.button > 0) return;
                active.add(e.pointerId);
                try { target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
                if (handlers.down) handlers.down(toLocal(e));
                e.preventDefault();
            });
            scope.listen(target, 'pointermove', (e) => {
                if (handlers.move) handlers.move(Object.assign(toLocal(e), { pressed: active.has(e.pointerId) }));
            });
            const end = (e) => {
                if (!active.has(e.pointerId)) return;
                active.delete(e.pointerId);
                if (handlers.up) handlers.up(toLocal(e));
            };
            scope.listen(target, 'pointerup', end);
            scope.listen(target, 'pointercancel', end);
        }
    };
    RF.scope = scope;

    // ---------------- Changing scenes ----------------
    function closeCurrent() {
        if (!current) return;
        const c = current;
        c.token.alive = false;
        try { if (c.def.exit) c.def.exit(); } catch (e) { console.error(e); }
        for (let i = c.cleanups.length - 1; i >= 0; i--) {
            try { c.cleanups[i](); } catch (e) { console.error(e); }
        }
        c.root.remove();
        current = null;
    }

    function openScene(name, params) {
        const def = registry[name];
        const root = U.el('div', { className: 'scene scene-' + name });
        stage.appendChild(root);
        current = { name, def, root, cleanups: [], params, token: { alive: true } };
        document.body.dataset.scene = name;
        const music = def.music === undefined ? 'ambient' : def.music;
        if (music === 'ambient') RF.music.ambient();
        else if (music === 'none') RF.music.stop();
        // 'keep' leaves whatever is playing
        try {
            def.enter(root, params || {});
        } catch (e) {
            console.error(e);
            if (name !== 'town' && registry.town && RF.store.current) {
                RF.ui.toast('Oops! Let’s go back to town.', { icon: '🙈' });
                setTimeout(() => RF.go('town'), 50);
            }
        }
        if (def.place && RF.store.current) RF.store.trackDistinct('visit', name);
    }

    // Opens a scene with a quick colourful fade
    RF.go = function (name, params = {}, { instant = false } = {}) {
        if (!registry[name]) {
            console.warn('No scene called', name);
            name = registry.town && RF.store.current ? 'town' : 'select';
        }
        if (busy) {
            queued = [name, params];
            return;
        }
        busy = true;
        if (RF.ui && RF.ui.closeModals) RF.ui.closeModals();
        if (RF.voice) RF.voice.cancel();
        const swap = () => {
            closeCurrent();
            openScene(name, params);
            requestAnimationFrame(() => {
                curtain.classList.remove('show');
                setTimeout(() => {
                    busy = false;
                    if (queued) {
                        const q = queued;
                        queued = null;
                        RF.go(q[0], q[1]);
                    }
                }, instant ? 0 : 180);
            });
        };
        if (instant || !current) {
            swap();
        } else {
            curtain.classList.add('show');
            setTimeout(swap, 180);
        }
    };

    // Android back button / iPhone swipe-back: close a pop-up, or go back towards the town
    RF.back = function () {
        if (RF.ui && RF.ui.isModalOpen && RF.ui.isModalOpen()) {
            RF.ui.closeTopModal();
            return;
        }
        if (!current) return;
        if (current.def.back) {
            current.def.back();
            return;
        }
        if (current.name === 'town') RF.go('select');
        else if (current.name !== 'select' && current.name !== 'loading') RF.go(registry.town && RF.store.current ? 'town' : 'select');
    };

    RF.initScenes = function () {
        stage = document.getElementById('stage');
        curtain = document.getElementById('curtain');
        try {
            history.replaceState({ rf: 'root' }, '');
            history.pushState({ rf: 'app' }, '');
        } catch (e) { /* ignore */ }
        window.addEventListener('popstate', () => {
            try { history.pushState({ rf: 'app' }, ''); } catch (e) { /* ignore */ }
            RF.back();
        });
    };
})(window.RF);
