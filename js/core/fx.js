/* Superstar World - drawing helpers and sparkly particle effects for canvas scenes. */
(function (RF) {
    'use strict';
    const U = RF.util;
    const TAU = Math.PI * 2;
    const fx = {};

    // ---------- Emoji as pictures (drawn once, then reused - much faster than fillText every frame) ----------
    const emojiCache = new Map();
    fx.emojiCanvas = function (emoji, size) {
        const bucket = Math.max(8, Math.ceil(size / 8) * 8);
        const key = emoji + '|' + bucket;
        let c = emojiCache.get(key);
        if (c) return c;
        const scale = 2; // extra sharp
        c = document.createElement('canvas');
        const px = Math.ceil(bucket * 1.3 * scale);
        c.width = c.height = px;
        const x = c.getContext('2d');
        x.font = U.emojiFont(bucket * scale);
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(emoji, px / 2, px / 2 + bucket * scale * 0.07);
        c.logicalSize = bucket * 1.3;
        emojiCache.set(key, c);
        return c;
    };
    // Draws an emoji centred on (x, y), about `size` pixels tall
    fx.emoji = function (ctx, emoji, x, y, size, { rotate = 0, alpha = 1, flip = false, scaleY = 1 } = {}) {
        const c = fx.emojiCanvas(emoji, size);
        const s = (size * 1.3) / c.width;
        const w = c.width * s;
        ctx.save();
        ctx.translate(x, y);
        if (rotate) ctx.rotate(rotate);
        if (flip) ctx.scale(-1, 1);
        if (scaleY !== 1) ctx.scale(1, scaleY);
        if (alpha !== 1) ctx.globalAlpha *= alpha;
        ctx.drawImage(c, -w / 2, -w / 2, w, w);
        ctx.restore();
    };

    // ---------- Shapes ----------
    // Heart centred on (x, y), `size` wide
    fx.heart = function (ctx, x, y, size, color) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.95);
        ctx.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.95, y - s * 0.95, x, y - s * 0.4);
        ctx.bezierCurveTo(x + s * 0.95, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.95);
        ctx.closePath();
        if (color) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    };
    fx.star = function (ctx, x, y, r, color, points = 5, inner = 0.48, rotation = -Math.PI / 2) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const a = rotation + (i * Math.PI) / points;
            const rr = i % 2 ? r * inner : r;
            ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        if (color) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    };
    // Four-pointed twinkle
    fx.twinkle = function (ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.quadraticCurveTo(x, y, x, y + r);
        ctx.quadraticCurveTo(x, y, x - r, y);
        ctx.quadraticCurveTo(x, y, x, y - r);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };
    fx.cloud = function (ctx, x, y, s, color = 'rgba(255,255,255,0.9)') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 28 * s, 0, TAU);
        ctx.arc(x + 30 * s, y - 14 * s, 34 * s, 0, TAU);
        ctx.arc(x + 64 * s, y, 26 * s, 0, TAU);
        ctx.arc(x + 32 * s, y + 8 * s, 26 * s, 0, TAU);
        ctx.fill();
    };
    // Text with a thick outline so it reads on any background
    fx.text = function (ctx, str, x, y, { size = 28, color = '#fff', stroke = '#5b2a86', weight = 700, align = 'center', baseline = 'middle', lineWidth = null } = {}) {
        ctx.font = U.font(size, weight);
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.lineJoin = 'round';
        if (stroke) {
            ctx.lineWidth = lineWidth || Math.max(3, size * 0.18);
            ctx.strokeStyle = stroke;
            ctx.strokeText(str, x, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
    };
    // Soft round shadow on the ground under someone
    fx.shadow = function (ctx, x, y, w, alpha = 0.18) {
        ctx.save();
        ctx.fillStyle = `rgba(60,30,90,${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, w / 7, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
    };

    // Calm mode (grown-ups setting): fewer sparkles, no shaking
    fx.calm = () => !!(RF.store && RF.store.data && RF.store.settings.calm);

    fx.RAINBOW = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#3ddc84', '#4cc9f0', '#9b5de5'];
    fx.CONFETTI = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#3ddc84', '#4cc9f0', '#9b5de5', '#ff5fa2', '#ffffff'];

    // ---------- Particles ----------
    /* const p = new RF.fx.Particles();
       p.burst(x, y, { count: 20, kind: 'sparkle' | 'star' | 'heart' | 'confetti' | 'dot' | 'emoji' | 'ring', colors, emoji, speed, gravity, size, life })
       p.floatText(x, y, '+1', { color })
       in update: p.update(dt)    in render: p.draw(ctx) */
    class Particles {
        constructor(max = 500) {
            this.max = max;
            this.list = [];
        }
        get count() { return this.list.length; }
        clear() { this.list.length = 0; }
        add(p) {
            if (this.list.length >= this.max) this.list.shift();
            this.list.push(p);
            return p;
        }
        burst(x, y, { count = 16, kind = 'sparkle', colors = fx.CONFETTI, emoji = null, speed = 220, gravity = 300, size = 6, life = 0.9, spread = TAU, angle = -Math.PI / 2, drag = 0.98 } = {}) {
            if (fx.calm()) count = Math.max(1, Math.round(count * 0.35));
            for (let i = 0; i < count; i++) {
                const a = spread >= TAU ? Math.random() * TAU : angle + (Math.random() - 0.5) * spread;
                const v = speed * (0.35 + Math.random() * 0.8);
                const l = life * (0.7 + Math.random() * 0.6);
                this.add({
                    kind, x, y,
                    vx: Math.cos(a) * v,
                    vy: Math.sin(a) * v,
                    g: gravity,
                    drag,
                    life: l, max: l,
                    size: size * (0.6 + Math.random() * 0.8),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    emoji,
                    rot: Math.random() * TAU,
                    vr: (Math.random() - 0.5) * 10
                });
            }
        }
        floatText(x, y, text, { color = '#fff', stroke = '#5b2a86', size = 26, life = 0.9 } = {}) {
            this.add({ kind: 'text', x, y, vx: 0, vy: -70, g: 0, drag: 1, life, max: life, size, color, stroke, text, rot: 0, vr: 0 });
        }
        ring(x, y, { color = '#fff', size = 40, life = 0.45 } = {}) {
            this.add({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 1, life, max: life, size, color, rot: 0, vr: 0 });
        }
        update(dt) {
            const list = this.list;
            for (let i = list.length - 1; i >= 0; i--) {
                const p = list[i];
                p.life -= dt;
                if (p.life <= 0) {
                    list.splice(i, 1);
                    continue;
                }
                p.vy += p.g * dt;
                p.vx *= p.drag;
                p.vy *= p.drag;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rot += p.vr * dt;
            }
        }
        draw(ctx) {
            for (const p of this.list) {
                const k = p.life / p.max;
                ctx.globalAlpha = Math.min(1, k * 1.6);
                switch (p.kind) {
                    case 'sparkle':
                        fx.twinkle(ctx, p.x, p.y, p.size * (0.5 + k), p.color);
                        break;
                    case 'star':
                        fx.star(ctx, p.x, p.y, p.size, p.color, 5, 0.5, p.rot);
                        break;
                    case 'heart':
                        fx.heart(ctx, p.x, p.y, p.size * 2, p.color);
                        break;
                    case 'confetti':
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rot);
                        ctx.fillStyle = p.color;
                        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * (0.4 + Math.abs(Math.sin(p.rot * 2))));
                        ctx.restore();
                        break;
                    case 'emoji':
                        fx.emoji(ctx, p.emoji, p.x, p.y, p.size * 3, { rotate: p.rot * 0.2 });
                        break;
                    case 'ring':
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 4 * k;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * (1.6 - k), 0, TAU);
                        ctx.stroke();
                        break;
                    case 'text':
                        fx.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color, stroke: p.stroke });
                        break;
                    default:
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * k), 0, TAU);
                        ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
        }
    }
    fx.Particles = Particles;

    RF.fx = fx;
})(window.RF);
