/* Superstar World - draws the pets (used in town, flying, house and pet care).
   PLACEHOLDER VERSION - the full kawaii drawings replace this file.

   API (keep these the same):
     RF.pets.draw(ctx, petId, x, y, size, opts)   (x, y) = bottom-centre (where its feet touch the ground), size = height in px
        opts: { t: seconds, pose: 'idle'|'walk'|'fly'|'happy'|'eat'|'sleep'|'bath', facing: 1|-1 }
     RF.pets.iconURL(petId, px) -> data URL picture for <img> (cached)
     RF.pets.sound(petId) -> plays its happy sound */
(function (RF) {
    'use strict';
    const iconCache = new Map();
    const P = {};

    P.draw = function (ctx, petId, x, y, size, { t = 0, pose = 'idle', facing = 1 } = {}) {
        const item = RF.data.item(petId);
        if (!item) return;
        const hop = pose === 'walk' || pose === 'happy' ? Math.abs(Math.sin(t * 9)) * size * 0.12 : pose === 'fly' ? Math.sin(t * 5) * size * 0.06 : 0;
        const img = item.image ? RF.assets.img(item.image) : null;
        ctx.save();
        ctx.translate(x, y - hop);
        if (facing < 0) ctx.scale(-1, 1);
        if (pose === 'sleep') ctx.globalAlpha = 0.85;
        if (img) {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            const s = size / Math.max(iw, ih);
            ctx.drawImage(img, -iw * s / 2, -ih * s, iw * s, ih * s);
        } else {
            RF.fx.emoji(ctx, item.emoji || '🐾', 0, -size / 2, size);
        }
        ctx.restore();
        if (pose === 'sleep') RF.fx.text(ctx, 'z', x + size * 0.4, y - size - Math.sin(t * 2) * 6, { size: size * 0.3, color: '#fff' });
    };

    P.iconURL = function (petId, px = 128) {
        const key = petId + '|' + px;
        if (iconCache.has(key)) return iconCache.get(key);
        const c = document.createElement('canvas');
        c.width = c.height = px;
        P.draw(c.getContext('2d'), petId, px / 2, px * 0.95, px * 0.9);
        let url = '';
        try { url = c.toDataURL('image/png'); } catch (e) { url = ''; }
        iconCache.set(key, url);
        return url;
    };

    P.sound = function (petId) {
        const item = RF.data.item(petId);
        RF.sfx.play((item && item.sound) || 'squeak');
    };

    RF.pets = P;
})(window.RF);
