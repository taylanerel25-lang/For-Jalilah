/* Superstar World - pictures. Everything is loaded once at the start (with a progress bar).
   RF.assets.img('coin') -> <img> ready to draw,   RF.assets.src('coin') -> file path for <img src>. */
(function (RF) {
    'use strict';
    const LIST = {
        coin: 'assets/img/coin.png',
        jewel: 'assets/img/jewel.png',
        kitten: 'assets/img/kitten.png',
        puppy: 'assets/img/puppy.png',
        crown: 'assets/img/crown.png',
        house: 'assets/img/house.jpg'
    };
    const images = {};

    RF.assets = {
        list: LIST,
        // Adds the girls' photos to the list and loads everything. Never fails: a missing picture just stays missing.
        load(onProgress) {
            RF.data.GIRLS.forEach((g) => { LIST['girl-' + g.id] = g.photo; });
            const keys = Object.keys(LIST);
            let done = 0;
            const fontsReady = document.fonts && document.fonts.load
                ? Promise.all([document.fonts.load('700 24px Fredoka'), document.fonts.load('500 24px Fredoka')]).catch(() => {})
                : Promise.resolve();
            const loads = keys.map((key) => new Promise((resolve) => {
                const img = new Image();
                img.decoding = 'async';
                const finish = (ok) => {
                    if (ok) images[key] = img;
                    else console.warn('Could not load picture', LIST[key]);
                    done++;
                    if (onProgress) onProgress(done / keys.length);
                    resolve();
                };
                img.onload = () => {
                    if (img.decode) img.decode().then(() => finish(true), () => finish(true));
                    else finish(true);
                };
                img.onerror = () => finish(false);
                img.src = LIST[key];
            }));
            const timeout = new Promise((res) => setTimeout(res, 12000));
            return Promise.race([Promise.all(loads.concat([fontsReady])), timeout]);
        },
        img: (key) => images[key] || null,
        has: (key) => !!images[key],
        src: (key) => LIST[key] || ''
    };
})(window.RF);
