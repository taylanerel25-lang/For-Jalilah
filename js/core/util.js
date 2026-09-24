/* Superstar World - small helpers shared by everything. */
window.RF = window.RF || {};
(function (RF) {
    'use strict';

    const U = {};

    U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    U.lerp = (a, b, t) => a + (b - a) * t;
    U.rand = (a = 0, b = 1) => a + Math.random() * (b - a);
    U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    U.choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
    U.shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    };
    U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
    U.clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
    U.uid = () => Math.random().toString(36).slice(2, 9);

    // Easing curves, t in 0..1
    U.ease = {
        outCubic: (t) => 1 - Math.pow(1 - t, 3),
        inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
        outBack: (t) => {
            const c1 = 1.70158, c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
        outElastic: (t) => {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
        },
        outBounce: (t) => {
            const n1 = 7.5625, d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    };

    // Local calendar day, e.g. "2026-09-24" (used for the daily present)
    U.todayKey = (d = new Date()) => {
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };

    U.EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji","EmojiSymbols",sans-serif';
    U.emojiFont = (px) => `${px}px ${U.EMOJI_FONT}`;
    U.FONT = '"Fredoka","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
    U.font = (px, weight = 700) => `${weight} ${px}px ${U.FONT}`;

    // Canvas path for a rounded rectangle (caller fills/strokes)
    U.roundRect = (ctx, x, y, w, h, r) => {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    // Tiny DOM builder: U.el('div', { className: 'x', text: 'hi', on: { click: fn }, style: {...}, attrs: {...} }, child, ...)
    U.el = (tag, props, ...children) => {
        const node = document.createElement(tag);
        if (props) {
            for (const k in props) {
                const v = props[k];
                if (v === undefined || v === null) continue;
                if (k === 'className') node.className = v;
                else if (k === 'text') node.textContent = v;
                else if (k === 'html') node.innerHTML = v; // only ever used with our own static strings
                else if (k === 'style') Object.assign(node.style, v);
                else if (k === 'on') for (const ev in v) node.addEventListener(ev, v[ev]);
                else if (k === 'attrs') for (const a in v) node.setAttribute(a, v[a]);
                else if (k === 'dataset') Object.assign(node.dataset, v);
                else node[k] = v;
            }
        }
        for (const c of children.flat()) {
            if (c === null || c === undefined || c === false) continue;
            node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
        }
        return node;
    };

    U.isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Query-string options, e.g. ?scene=balloons&girl=lilah&players=lilah,alayna&mute=1
    U.params = (() => {
        const out = {};
        try {
            new URLSearchParams(location.search).forEach((v, k) => { out[k] = v; });
        } catch (e) { /* very old browser */ }
        return out;
    })();

    RF.util = U;
})(window.RF);
