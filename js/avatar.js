/* Superstar World - draws each girl: her real photo face on a cute cartoon body wearing her outfit.
   PLACEHOLDER VERSION (simple shapes) - the full dress-up drawing replaces this file.

   API (keep these the same):
     RF.avatar.init()
     RF.avatar.draw(ctx, girlId, x, y, h, opts)   (x, y) = between her feet, h = full height in px
        opts: { pose: 'stand'|'walk'|'fly'|'dance'|'wave'|'sit', t: seconds, facing: 1|-1, outfit: {...} (optional override) }
     RF.avatar.drawHead(ctx, girlId, cx, cy, r, opts)   round photo face (opts: { ring: true, hat: true, outfit })
     RF.avatar.headURL(girlId, px)  -> data URL of the round face (cached) for <img>
     RF.avatar.itemIconURL(itemId, px) -> data URL picture of a clothes item (or null)
     RF.avatar.layout(h) -> { headR, headCy, shoulderY, hipY, handY } offsets from the feet (negative = up) */
(function (RF) {
    'use strict';
    const TAU = Math.PI * 2;
    const headCache = new Map();

    function faceOf(girlId) {
        const g = RF.data.girl(girlId) || RF.data.GIRLS[0];
        return { g, img: RF.assets.img('girl-' + g.id), face: g.face || { x: 0.5, y: 0.42, r: 0.42 } };
    }

    const A = {};
    A.init = function () { headCache.clear(); };

    A.layout = function (h) {
        const headR = h * 0.2;
        return { headR, headCy: -h + headR, shoulderY: -h * 0.58, hipY: -h * 0.3, handY: -h * 0.36 };
    };

    A.drawHead = function (ctx, girlId, cx, cy, r, { ring = true } = {}) {
        const { g, img, face } = faceOf(girlId);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.fillStyle = g.color;
        ctx.fill();
        if (img) {
            ctx.clip();
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            const srcR = face.r * iw;
            const s = r / srcR;
            ctx.drawImage(img, cx - face.x * iw * s, cy - face.y * ih * s, iw * s, ih * s);
        }
        ctx.restore();
        if (ring) {
            ctx.lineWidth = Math.max(2, r * 0.1);
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, TAU);
            ctx.stroke();
        }
    };

    A.draw = function (ctx, girlId, x, y, h, { pose = 'stand', t = 0, facing = 1, outfit = null } = {}) {
        const { g } = faceOf(girlId);
        const L = A.layout(h);
        const bob = pose === 'walk' ? Math.abs(Math.sin(t * 8)) * h * 0.03 : pose === 'dance' ? Math.abs(Math.sin(t * 6)) * h * 0.05 : 0;
        const legSwing = pose === 'walk' ? Math.sin(t * 8) * h * 0.06 : 0;
        const skin = g.skin || '#f1c7a8';
        const o = outfit || (RF.store.profile(girlId) || {}).outfit || {};
        const dressColor = (o.dress && o.dress.color) || (o.top && o.top.color) || g.color;
        ctx.save();
        ctx.translate(x, y - bob);
        ctx.scale(facing, 1);
        if (pose === 'fly') ctx.rotate(0.18);
        // legs
        ctx.strokeStyle = skin;
        ctx.lineCap = 'round';
        ctx.lineWidth = h * 0.06;
        ctx.beginPath();
        ctx.moveTo(-h * 0.06, L.hipY);
        ctx.lineTo(-h * 0.06 + legSwing, -h * 0.03);
        ctx.moveTo(h * 0.06, L.hipY);
        ctx.lineTo(h * 0.06 - legSwing, -h * 0.03);
        ctx.stroke();
        // shoes
        ctx.fillStyle = (o.shoes && o.shoes.color) || '#ff5fa2';
        ctx.beginPath();
        ctx.ellipse(-h * 0.06 + legSwing, -h * 0.02, h * 0.05, h * 0.03, 0, 0, TAU);
        ctx.ellipse(h * 0.06 - legSwing, -h * 0.02, h * 0.05, h * 0.03, 0, 0, TAU);
        ctx.fill();
        // arms
        const wave = pose === 'wave' ? Math.sin(t * 10) * 0.4 - 1.2 : pose === 'dance' ? Math.sin(t * 6) * 0.8 - 0.6 : 0.25;
        ctx.lineWidth = h * 0.05;
        [-1, 1].forEach((side) => {
            const a = side === 1 ? wave : 0.25;
            ctx.beginPath();
            ctx.moveTo(side * h * 0.1, L.shoulderY + h * 0.03);
            ctx.lineTo(side * h * 0.1 + side * Math.sin(a + 0.3) * h * 0.2, L.shoulderY + Math.cos(a + 0.3) * h * 0.2);
            ctx.stroke();
        });
        // dress
        ctx.fillStyle = dressColor;
        ctx.beginPath();
        ctx.moveTo(-h * 0.1, L.shoulderY);
        ctx.lineTo(h * 0.1, L.shoulderY);
        ctx.lineTo(h * 0.2, L.hipY + h * 0.04);
        ctx.lineTo(-h * 0.2, L.hipY + h * 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // head (not flipped so the photo is never mirrored)
        A.drawHead(ctx, girlId, x, y - bob + L.headCy, L.headR, { ring: true });
    };

    A.headURL = function (girlId, px = 128) {
        const key = girlId + '|' + px;
        if (headCache.has(key)) return headCache.get(key);
        const c = document.createElement('canvas');
        c.width = c.height = px;
        A.drawHead(c.getContext('2d'), girlId, px / 2, px / 2, px / 2 - 2, { ring: false });
        let url = '';
        try { url = c.toDataURL('image/png'); } catch (e) { url = (RF.data.girl(girlId) || {}).photo || ''; }
        if (RF.assets.has('girl-' + girlId)) headCache.set(key, url);
        return url;
    };

    A.itemIconURL = function () { return null; };

    RF.avatar = A;
})(window.RF);
