/* Superstar World - buttons, top bar, pop-ups, celebrations, confetti and the results screen.
   All of it is big, colourful, talks out loud, and works with little fingers. */
(function (RF) {
    'use strict';
    const U = RF.util;
    const el = U.el;
    const ui = {};
    let overlay = null;
    let toastBox = null;
    let fxView = null;
    let fxParticles = null;
    let fxRaf = 0;
    const modals = [];

    // ---------------- Set-up ----------------
    ui.init = function () {
        overlay = document.getElementById('overlay');
        toastBox = document.getElementById('toasts');
        const canvas = document.getElementById('fx');
        const ctx = canvas.getContext('2d');
        fxView = { canvas, ctx, W: 0, H: 0 };
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            fxView.W = window.innerWidth;
            fxView.H = window.innerHeight;
            canvas.width = Math.round(fxView.W * dpr);
            canvas.height = Math.round(fxView.H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);
        fxParticles = new RF.fx.Particles(700);
        RF.events.on('wallet', ui.updateWallet);
        RF.events.on('girl', ui.updateWallet);
        RF.events.on('mission', onMission);
    };

    // ---------------- Little pictures ----------------
    // The girl's round face, ready for an <img>
    ui.head = function (girlId, size = 64, { className = '' } = {}) {
        const src = RF.avatar && RF.avatar.headURL ? RF.avatar.headURL(girlId, size * 2) : (RF.data.girl(girlId) || {}).photo;
        return el('img', { className: 'head ' + className, src, alt: (RF.data.girl(girlId) || {}).name || '', draggable: false, style: { width: size + 'px', height: size + 'px' } });
    };
    // Picture for a shop item: its image, a drawing, or its emoji
    ui.itemIcon = function (item, size = 64) {
        if (!item) return el('span');
        if (RF.avatar && RF.avatar.itemIconURL && RF.data.isClothes(item)) {
            const url = RF.avatar.itemIconURL(item.id, size * 2);
            if (url) return el('img', { className: 'item-icon', src: url, draggable: false, style: { width: size + 'px', height: size + 'px' } });
        }
        if (item.image && RF.assets.has(item.image)) {
            return el('img', { className: 'item-icon', src: RF.assets.src(item.image), draggable: false, style: { width: size + 'px', height: size + 'px' } });
        }
        return el('span', { className: 'item-icon emoji', text: item.emoji || '🎁', style: { fontSize: Math.round(size * 0.78) + 'px', width: size + 'px', height: size + 'px' } });
    };
    ui.currencyIcon = function (currency, size = 28) {
        if (currency === 'stars') return el('span', { className: 'cur-icon emoji', text: '⭐', style: { fontSize: Math.round(size * 0.85) + 'px' } });
        const key = currency === 'jewels' ? 'jewel' : 'coin';
        return el('img', { className: 'cur-icon', src: RF.assets.src(key), alt: currency, draggable: false, style: { width: size + 'px', height: size + 'px' } });
    };

    // ---------------- Buttons ----------------
    /* ui.btn('Play!', onClick, { icon: '🚀', kind: 'pink'|'yellow'|'blue'|'green'|'purple'|'white'|'ghost', size: 's'|'m'|'l'|'xl', say, sound, round }) */
    ui.btn = function (label, onClick, { icon = null, kind = 'yellow', size = 'l', say = null, sound = 'tap', round = false, className = '', title = null, disabled = false } = {}) {
        let last = 0;
        const b = el('button', {
            className: `btn btn-${kind} btn-${size}${round ? ' btn-round' : ''} ${className}`,
            type: 'button',
            disabled,
            attrs: { 'aria-label': title || label || icon || 'button' }
        },
        icon ? (icon instanceof Node ? el('span', { className: 'btn-icon' }, icon) : el('span', { className: 'btn-icon', text: icon })) : null,
        label ? el('span', { className: 'btn-label', text: label }) : null);
        b.addEventListener('click', (e) => {
            const t = performance.now();
            if (t - last < 350) return; // double taps count once
            last = t;
            if (sound) RF.sfx.play(sound);
            if (say) RF.voice.say(say);
            if (onClick) onClick(e);
        });
        return b;
    };

    // ---------------- Wallet chips & top bar ----------------
    ui.walletChip = function (currency, girlId = null) {
        const chip = el('div', { className: 'chip wallet-chip', dataset: { currency, girl: girlId || '' } },
            ui.currencyIcon(currency, 30),
            el('span', { className: 'chip-num', text: String(RF.store.get(currency, girlId || RF.store.current)) }));
        return chip;
    };
    ui.updateWallet = function () {
        document.querySelectorAll('.wallet-chip').forEach((chip) => {
            const girl = chip.dataset.girl || RF.store.current;
            const num = chip.querySelector('.chip-num');
            const value = String(RF.store.get(chip.dataset.currency, girl));
            if (num.textContent !== value) {
                num.textContent = value;
                chip.classList.remove('bump');
                void chip.offsetWidth;
                chip.classList.add('bump');
            }
        });
    };
    /* Top bar for a scene: home button on the left, wallet on the right.
       ui.topBar(root, { home: true, onHome, title, wallet: ['coins','jewels','stars'], right: [nodes], left: [nodes] }) */
    /* Extra options: hint: 'Pop the balloons!' adds a 🔊 "say it again" button (hint can be a function returning the line).
       pause: fn adds a ⏸️ button. */
    ui.topBar = function (root, { home = true, onHome = null, homeIcon = '🏠', title = null, wallet = ['coins', 'jewels', 'stars'], right = [], left = [], hint = null, pause = null } = {}) {
        const bar = el('div', { className: 'topbar' });
        const l = el('div', { className: 'topbar-side' });
        if (home) {
            l.appendChild(ui.btn('', onHome || (() => RF.go('town')), { icon: homeIcon, kind: 'white', size: 'm', round: true, title: 'Home', sound: 'swish' }));
        }
        if (pause) l.appendChild(ui.btn('', pause, { icon: '⏸️', kind: 'white', size: 'm', round: true, title: 'Pause' }));
        if (hint) {
            l.appendChild(ui.btn('', () => ui.speak(typeof hint === 'function' ? hint() : hint), { icon: '🔊', kind: 'white', size: 'm', round: true, title: 'Say it again', sound: null }));
        }
        left.forEach((n) => l.appendChild(n));
        const r = el('div', { className: 'topbar-side right' });
        right.forEach((n) => r.appendChild(n));
        if (wallet && wallet.length) {
            const w = el('div', { className: 'wallet' });
            wallet.forEach((c) => w.appendChild(ui.walletChip(c)));
            r.appendChild(w);
        }
        bar.appendChild(l);
        if (title) bar.appendChild(el('div', { className: 'topbar-title', text: title }));
        bar.appendChild(r);
        root.appendChild(bar);
        return bar;
    };

    // ---------------- Messages ----------------
    ui.toast = function (text, { icon = null, ms = 2200, say = false } = {}) {
        const t = el('div', { className: 'toast' }, icon ? el('span', { className: 'toast-icon', text: icon }) : null, el('span', { text }));
        toastBox.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, ms);
        if (say) RF.voice.say(typeof say === 'string' ? say : text);
        return t;
    };
    // Slides in from the top without stopping the game
    const bannerQueue = [];
    let bannerBusy = false;
    ui.banner = function (text, { icon = '⭐', ms = 2800 } = {}) {
        bannerQueue.push({ text, icon, ms });
        if (!bannerBusy) nextBanner();
    };
    function nextBanner() {
        const b = bannerQueue.shift();
        if (!b) { bannerBusy = false; return; }
        bannerBusy = true;
        const node = el('div', { className: 'banner' }, el('span', { className: 'banner-icon', text: b.icon }), el('span', { text: b.text }));
        overlay.appendChild(node);
        requestAnimationFrame(() => node.classList.add('show'));
        setTimeout(() => {
            node.classList.remove('show');
            setTimeout(() => { node.remove(); nextBanner(); }, 350);
        }, b.ms);
    }
    function onMission({ girl, mission }) {
        const g = RF.data.girl(girl);
        RF.sfx.play('star');
        ui.banner(`${g.name} got a sticker: ${mission.sticker.name}!`, { icon: mission.sticker.emoji });
        RF.voice.say(`Well done ${g.say || g.name}! You got a new sticker!`, { interrupt: false });
        ui.confetti(window.innerWidth / 2, 40, { count: 40 });
    }

    // ---------------- Confetti & flying coins (drawn on a see-through layer over everything) ----------------
    function runFx() {
        if (fxRaf) return;
        let last = performance.now();
        const frame = (t) => {
            const dt = Math.min(0.05, (t - last) / 1000);
            last = t;
            fxParticles.update(dt);
            updateFlyers(dt);
            const ctx = fxView.ctx;
            ctx.clearRect(0, 0, fxView.W, fxView.H);
            fxParticles.draw(ctx);
            drawFlyers(ctx);
            if (fxParticles.count || flyers.length) fxRaf = requestAnimationFrame(frame);
            else {
                fxRaf = 0;
                ctx.clearRect(0, 0, fxView.W, fxView.H);
            }
        };
        fxRaf = requestAnimationFrame(frame);
    }
    // Burst of confetti at a screen position
    ui.confetti = function (x = window.innerWidth / 2, y = window.innerHeight / 3, { count = 50, kind = 'confetti', colors = RF.fx.CONFETTI, emoji = null, speed = 520 } = {}) {
        fxParticles.burst(x, y, { count, kind, colors, emoji, speed, gravity: 700, size: kind === 'confetti' ? 12 : 8, life: 1.6, drag: 0.985 });
        runFx();
    };
    // Confetti falling from the top of the screen
    ui.confettiRain = function (count = 120) {
        if (RF.fx.calm()) count = Math.round(count * 0.3);
        for (let i = 0; i < count; i++) {
            const l = U.rand(1.6, 3.2);
            fxParticles.add({
                kind: Math.random() < 0.15 ? 'star' : 'confetti',
                x: Math.random() * window.innerWidth, y: U.rand(-200, -10),
                vx: U.rand(-40, 40), vy: U.rand(120, 280), g: 60, drag: 1,
                life: l, max: l, size: U.rand(8, 14),
                color: U.choice(RF.fx.CONFETTI), rot: Math.random() * 6, vr: U.rand(-6, 6)
            });
        }
        runFx();
    };
    // Coins/jewels/stars zooming from (x, y) into the wallet at the top
    const flyers = [];
    const flyImgs = {};
    ui.flyTo = function (x, y, currency = 'coins', count = 5) {
        const chip = document.querySelector(`.wallet-chip[data-currency="${currency}"]`);
        let tx = window.innerWidth - 60;
        let ty = 30;
        if (chip) {
            const r = chip.getBoundingClientRect();
            tx = r.left + 20;
            ty = r.top + r.height / 2;
        }
        for (let i = 0; i < Math.min(count, 12); i++) {
            flyers.push({ currency, x0: x + U.rand(-20, 20), y0: y + U.rand(-20, 20), tx, ty, t: -i * 0.06, dur: 0.7 });
        }
        runFx();
    };
    function updateFlyers(dt) {
        for (let i = flyers.length - 1; i >= 0; i--) {
            const f = flyers[i];
            f.t += dt;
            if (f.t >= f.dur) {
                flyers.splice(i, 1);
                const chip = document.querySelector(`.wallet-chip[data-currency="${f.currency}"]`);
                if (chip) {
                    chip.classList.remove('bump');
                    void chip.offsetWidth;
                    chip.classList.add('bump');
                }
            }
        }
    }
    function drawFlyers(ctx) {
        flyers.forEach((f) => {
            if (f.t < 0) return;
            const k = U.ease.inOutSine(Math.min(1, f.t / f.dur));
            const x = U.lerp(f.x0, f.tx, k);
            const y = U.lerp(f.y0, f.ty, k) - Math.sin(k * Math.PI) * 80;
            const s = 30 * (1 - k * 0.3);
            if (f.currency === 'stars') {
                RF.fx.star(ctx, x, y, s / 2, '#ffd23f');
            } else {
                const key = f.currency === 'jewels' ? 'jewel' : 'coin';
                const img = flyImgs[key] || (flyImgs[key] = RF.assets.img(key));
                if (img) ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
                else RF.fx.star(ctx, x, y, s / 2, '#ffd23f');
            }
        });
    }

    // ---------------- Pop-up windows ----------------
    /* ui.modal({ title, icon, body: Node|string, buttons: [{ label, icon, kind, onClick, keepOpen }], onClose, dismissable, className })
       returns { el, close } */
    ui.modal = function ({ title = null, icon = null, body = null, buttons = [], onClose = null, dismissable = true, className = '', say = null } = {}) {
        const backdrop = el('div', { className: 'modal-backdrop' });
        const card = el('div', { className: 'modal ' + className, attrs: { role: 'dialog' } });
        let closed = false;
        const handle = {
            el: card,
            close(silent) {
                if (closed) return;
                closed = true;
                const i = modals.indexOf(handle);
                if (i >= 0) modals.splice(i, 1);
                backdrop.classList.remove('show');
                setTimeout(() => backdrop.remove(), 220);
                if (!silent && onClose) onClose();
            }
        };
        if (dismissable) {
            card.appendChild(el('button', {
                className: 'modal-x', type: 'button', text: '✖', attrs: { 'aria-label': 'Close' },
                on: { click: () => { RF.sfx.play('swish'); handle.close(); } }
            }));
        }
        if (icon) card.appendChild(icon instanceof Node ? el('div', { className: 'modal-icon' }, icon) : el('div', { className: 'modal-icon', text: icon }));
        if (title) card.appendChild(el('h2', { className: 'modal-title', text: title }));
        if (body) card.appendChild(body instanceof Node ? body : el('p', { className: 'modal-text', text: body }));
        if (buttons.length) {
            const row = el('div', { className: 'modal-buttons' });
            buttons.forEach((b) => {
                row.appendChild(ui.btn(b.label, () => {
                    if (!b.keepOpen) handle.close(true);
                    if (b.onClick) b.onClick();
                }, { icon: b.icon, kind: b.kind || 'yellow', size: b.size || 'l', sound: b.sound || 'tap' }));
            });
            card.appendChild(row);
        }
        backdrop.appendChild(card);
        if (dismissable) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) handle.close();
            });
        }
        overlay.appendChild(backdrop);
        requestAnimationFrame(() => backdrop.classList.add('show'));
        modals.push(handle);
        if (say) RF.voice.say(say);
        return handle;
    };
    ui.isModalOpen = () => modals.length > 0;
    ui.closeTopModal = () => { if (modals.length) modals[modals.length - 1].close(); };
    ui.closeModals = () => { modals.slice().forEach((m) => m.close(true)); };

    // ---------------- Celebrations ----------------
    /* Big "Hooray!" pop-up with confetti. rewards: { coins, jewels, stars } are only SHOWN (add them with RF.store.add). */
    ui.celebrate = function ({ title = 'Hooray!', text = null, icon = '🎉', rewards = null, say = null, button = 'Yay!', onClose = null, sound = 'fanfare' } = {}) {
        const body = el('div', { className: 'celebrate-body' });
        if (text) body.appendChild(el('p', { className: 'modal-text', text }));
        if (rewards) body.appendChild(rewardRow(rewards));
        RF.sfx.play(sound);
        ui.confettiRain(90);
        return ui.modal({
            title, icon, body, className: 'modal-celebrate', say: say || title,
            buttons: [{ label: button, icon: '👍', kind: 'pink', size: 'xl', onClick: onClose }],
            onClose
        });
    };
    function rewardRow(rewards) {
        const row = el('div', { className: 'reward-row' });
        ['coins', 'jewels', 'stars'].forEach((c) => {
            if (rewards[c]) row.appendChild(el('div', { className: 'reward' }, ui.currencyIcon(c, 40), el('span', { text: '+' + rewards[c] })));
        });
        return row;
    }

    // ---------------- Buying things ----------------
    /* Asks "Buy it?" with the price. Handles "not enough coins" kindly. */
    ui.confirmBuy = function (itemId, { girl = RF.store.current, onBought = null, onCancel = null } = {}) {
        const item = RF.data.item(itemId);
        if (!item) return;
        if (RF.store.owns(itemId, girl)) {
            if (onBought) onBought(item);
            return;
        }
        const cur = item.cur || 'coins';
        const have = RF.store.get(cur, girl);
        const iconBox = el('div', { className: 'buy-icon' }, ui.itemIcon(item, 110));
        if (have < item.price) {
            const need = item.price - have;
            const word = cur === 'jewels' ? (need === 1 ? 'jewel' : 'jewels') : (need === 1 ? 'coin' : 'coins');
            RF.sfx.play('nope');
            return ui.modal({
                title: item.name,
                icon: iconBox,
                body: el('div', { className: 'price-line' }, el('span', { text: 'You need ' + need + ' more ' }), ui.currencyIcon(cur, 34)),
                say: `You need ${need} more ${word}. Play games to earn more!`,
                buttons: [
                    { label: 'Play games', icon: '🎮', kind: 'green', onClick: () => RF.go('town', { focus: 'games' }) },
                    { label: 'OK', icon: '👍', kind: 'white', onClick: onCancel }
                ],
                onClose: onCancel
            });
        }
        return ui.modal({
            title: item.name,
            icon: iconBox,
            body: el('div', { className: 'price-line' }, ui.currencyIcon(cur, 40), el('span', { className: 'price-num', text: String(item.price) })),
            say: `${item.name}. Do you want to buy it?`,
            buttons: [
                {
                    label: 'Buy it!', icon: '🛍️', kind: 'pink', sound: null,
                    onClick: () => {
                        const res = RF.store.buy(itemId, girl);
                        if (res.ok) {
                            RF.sfx.play('tada');
                            ui.confetti(window.innerWidth / 2, window.innerHeight / 2, { count: 60 });
                            RF.voice.say(U.choice(['Yay! It’s yours!', 'Wonderful choice!', 'Ooh, lovely!', 'It’s all yours!']));
                            if (onBought) onBought(item);
                        }
                    }
                },
                { label: 'Not now', kind: 'white', onClick: onCancel }
            ],
            onClose: onCancel
        });
    };

    // ---------------- Who is playing? ----------------
    /* ui.pickPlayers({ title, max: 3, min: 1, onDone(ids), onCancel }) - tap faces, then Go! */
    ui.pickPlayers = function ({ title = 'Who is playing?', max = 3, min = 1, onDone, onCancel = null, say = null } = {}) {
        const chosen = [RF.store.current].filter(Boolean);
        const grid = el('div', { className: 'pick-grid' });
        const go = ui.btn('Let’s go!', () => {
            if (chosen.length < min) return;
            m.close(true);
            onDone(chosen.slice());
        }, { icon: '🚀', kind: 'pink', size: 'xl' });
        const refresh = () => {
            grid.querySelectorAll('.pick-face').forEach((n) => {
                const i = chosen.indexOf(n.dataset.girl);
                n.classList.toggle('on', i >= 0);
                n.querySelector('.pick-num').textContent = i >= 0 ? String(i + 1) : '';
            });
            go.disabled = chosen.length < min;
        };
        RF.data.GIRLS.forEach((g) => {
            const face = el('button', { className: 'pick-face', type: 'button', dataset: { girl: g.id }, style: { '--girl': g.color } },
                ui.head(g.id, 84), el('span', { className: 'pick-name', text: g.name }), el('span', { className: 'pick-num' }));
            face.addEventListener('click', () => {
                const i = chosen.indexOf(g.id);
                if (i >= 0) {
                    chosen.splice(i, 1);
                    RF.sfx.play('click');
                } else {
                    if (chosen.length >= max) chosen.shift();
                    chosen.push(g.id);
                    RF.sfx.play('pop');
                    RF.voice.say(g.say || g.name);
                }
                refresh();
            });
            grid.appendChild(face);
        });
        const body = el('div', { className: 'pick-body' },
            el('p', { className: 'modal-text small', text: max > 1 ? `Tap up to ${max} faces` : 'Tap your face' }), grid, go);
        const m = ui.modal({ title, icon: '👭', body, onClose: onCancel, say: say || (max > 1 ? 'Who is playing? Tap your faces!' : 'Who is playing?') });
        refresh();
        return m;
    };

    // ---------------- End of a round ----------------
    /* ui.results({ title, players: [{ girl, score, scoreIcon, coins, jewels, best }], say, onAgain, onHome })
       Coins should already have been added by the game while playing; this only shows them. */
    ui.results = function ({ title = 'Amazing!', players = [], say = null, onAgain = null, onHome = null, homeLabel = 'Town', message = null } = {}) {
        const list = el('div', { className: 'results-list' });
        players.forEach((p) => {
            const g = RF.data.girl(p.girl);
            const row = el('div', { className: 'results-row', style: { '--girl': g.color } },
                ui.head(p.girl, 64),
                el('div', { className: 'results-name', text: g.name }),
                p.score !== undefined ? el('div', { className: 'results-score' }, el('span', { text: p.scoreIcon || '⭐' }), el('span', { text: String(p.score) })) : null,
                p.coins ? el('div', { className: 'results-coins' }, ui.currencyIcon('coins', 30), el('span', { text: '+' + p.coins })) : null,
                p.jewels ? el('div', { className: 'results-coins' }, ui.currencyIcon('jewels', 30), el('span', { text: '+' + p.jewels })) : null,
                p.best ? el('div', { className: 'results-best', text: 'New best!' }) : null);
            list.appendChild(row);
        });
        const body = el('div', { className: 'results-body' }, message ? el('p', { className: 'modal-text', text: message }) : null, list);
        RF.sfx.play('fanfare');
        ui.confettiRain(110);
        const names = players.map((p) => (RF.data.girl(p.girl).say || RF.data.girl(p.girl).name));
        const praise = say || `${U.choice(['Amazing', 'Fantastic', 'Brilliant', 'Super', 'Wonderful'])} ${names.join(' and ')}!`;
        const buttons = [];
        if (onAgain) buttons.push({ label: 'Again!', icon: '🔁', kind: 'pink', size: 'xl', onClick: onAgain });
        buttons.push({ label: homeLabel, icon: '🏠', kind: 'blue', size: 'xl', onClick: onHome || (() => RF.go('town')) });
        return ui.modal({ title, icon: '🏆', body, buttons, dismissable: false, className: 'modal-results', say: praise });
    };

    // ---------------- Grown-ups only ----------------
    ui.parentGate = function (onPass) {
        const a = U.randInt(3, 9);
        const b = U.randInt(4, 9);
        let typed = '';
        const display = el('div', { className: 'gate-display', text: '?' });
        const pad = el('div', { className: 'gate-pad' });
        const m = ui.modal({
            title: 'Grown-ups only',
            icon: '🔒',
            body: el('div', { className: 'gate-body' },
                el('p', { className: 'modal-text', text: `What is ${a} × ${b}?` }), display, pad)
        });
        const press = (d) => {
            if (d === 'del') typed = typed.slice(0, -1);
            else if (typed.length < 3) typed += d;
            display.textContent = typed || '?';
            if (typed.length >= String(a * b).length) {
                if (Number(typed) === a * b) {
                    m.close(true);
                    onPass();
                } else {
                    RF.sfx.play('nope');
                    display.classList.add('shake');
                    setTimeout(() => { display.classList.remove('shake'); typed = ''; display.textContent = '?'; }, 450);
                }
            }
        };
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0'].forEach((d) => {
            pad.appendChild(el('button', { className: 'gate-key', type: 'button', text: d === 'del' ? '⌫' : d, on: { click: () => { RF.sfx.play('click'); press(d); } } }));
        });
        return m;
    };

    // ---------------- Talking with a speech bubble ----------------
    /* Says a line out loud AND shows it in a bubble (for children still learning to read, and for when the sound is off). */
    let bubble = null;
    let bubbleTimer = null;
    ui.speak = function (text, { ms = null, icon = '💬' } = {}) {
        if (!text) return;
        RF.voice.say(text);
        if (!bubble) {
            bubble = el('div', { className: 'speech' }, el('span', { className: 'speech-icon' }), el('span', { className: 'speech-text' }));
            overlay.appendChild(bubble);
        }
        bubble.querySelector('.speech-icon').textContent = icon;
        bubble.querySelector('.speech-text').textContent = text;
        bubble.classList.remove('show');
        void bubble.offsetWidth;
        bubble.classList.add('show');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms || Math.max(2200, text.length * 85));
    };
    // Kind words with her name, never more than one every 4 seconds
    let lastPraise = 0;
    ui.praise = function (girlId = RF.store.current, { force = false, bubble: showBubble = false } = {}) {
        const t = performance.now();
        if (!force && t - lastPraise < 4000) return false;
        lastPraise = t;
        const line = RF.data.praise(girlId);
        if (showBubble) ui.speak(line, { icon: '🌟' });
        else RF.voice.say(line, { interrupt: false });
        return true;
    };

    // ---------------- Showing what to do ----------------
    /* A friendly pointing hand at screen position (x, y). to: { x, y } makes it slide (for dragging).
       Returns { stop }. It also stops by itself after `times` taps. */
    ui.ghostHand = function (x, y, { to = null, times = 2 } = {}) {
        const hand = el('div', { className: 'ghost-hand', text: '👆' });
        hand.style.left = x + 'px';
        hand.style.top = y + 'px';
        overlay.appendChild(hand);
        let n = 0;
        let stopped = false;
        const run = () => {
            if (stopped) return;
            if (n >= times) { stop(); return; }
            n++;
            hand.style.transition = 'none';
            hand.style.left = x + 'px';
            hand.style.top = y + 'px';
            hand.classList.remove('tap');
            void hand.offsetWidth;
            hand.classList.add('tap');
            if (to) {
                setTimeout(() => {
                    if (stopped) return;
                    hand.style.transition = 'left 0.8s ease-in-out, top 0.8s ease-in-out';
                    hand.style.left = to.x + 'px';
                    hand.style.top = to.y + 'px';
                }, 350);
            }
            setTimeout(run, to ? 1700 : 1100);
        };
        const stop = () => {
            if (stopped) return;
            stopped = true;
            hand.classList.add('bye');
            setTimeout(() => hand.remove(), 300);
        };
        requestAnimationFrame(run);
        RF.scope.add(stop);
        return { stop };
    };
    /* Calls onIdle(count) after `ms` with no touches in the current scene (count = 1, 2...), at most `max` times
       in a row, then stays quiet until the next touch. Cleaned up automatically. */
    ui.idle = function (onIdle, { ms = 7000, max = 2 } = {}) {
        let timer = null;
        let count = 0;
        const arm = () => {
            clearTimeout(timer);
            if (count >= max) return;
            timer = setTimeout(() => {
                count++;
                try { onIdle(count); } catch (e) { console.error(e); }
                arm();
            }, ms);
        };
        const touched = () => { count = 0; arm(); };
        RF.scope.listen(window, 'pointerdown', touched, true);
        RF.scope.add(() => clearTimeout(timer));
        arm();
        return { reset: touched };
    };

    // ---------------- Pause ----------------
    /* ui.pauseMenu({ onResume, onHome }) - big Play / Home choice */
    ui.pauseMenu = function ({ onResume, onHome = null } = {}) {
        return ui.modal({
            title: 'Paused', icon: '⏸️', say: 'Paused. Play or go home?',
            buttons: [
                { label: 'Play', icon: '▶️', kind: 'green', size: 'xl', onClick: onResume },
                { label: 'Home', icon: '🏠', kind: 'blue', size: 'xl', onClick: onHome || (() => RF.go('town')) }
            ],
            onClose: onResume
        });
    };

    // One-off helpful tip for the current girl (said out loud the first time only)
    ui.tip = function (key, text, { icon = '💡', ms = 3200 } = {}) {
        const p = RF.store.profile();
        if (!p || p.seen[key]) return;
        p.seen[key] = true;
        RF.store.save();
        ui.toast(text, { icon, ms, say: true });
    };

    RF.ui = ui;
})(window.RF);
