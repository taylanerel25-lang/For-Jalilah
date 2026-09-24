/* Superstar World - starts everything up. */
(function (RF) {
    'use strict';
    const P = RF.util.params;

    function boot() {
        RF.store.load();
        RF.initScenes();
        RF.ui.init();
        const fill = document.querySelector('.loading-fill');
        RF.assets.load((k) => { if (fill) fill.style.width = Math.round(k * 100) + '%'; }).then(start, start);
    }

    function start() {
        if (RF.avatar && RF.avatar.init) {
            try { RF.avatar.init(); } catch (e) { console.error(e); }
        }
        const loading = document.getElementById('loading');
        loading.classList.add('hide');
        setTimeout(() => loading.remove(), 400);

        // Handy for testing: index.html?girl=lilah&scene=balloons&players=lilah,alayna
        if (P.girl && RF.data.girl(P.girl)) RF.store.setCurrent(P.girl);
        const params = {};
        if (P.players) params.players = P.players.split(',').filter((id) => RF.data.girl(id));
        Object.keys(P).forEach((k) => { if (!(k in params) && k !== 'scene' && k !== 'girl') params[k] = P[k]; });
        if (P.scene && RF.hasScene(P.scene) && RF.store.current) RF.go(P.scene, params, { instant: true });
        else RF.go('select', {}, { instant: true });

        if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !P.nosw && !P.test) {
            navigator.serviceWorker.register('sw.js').catch(() => { /* offline play just won't be available */ });
        }
    }

    window.addEventListener('error', (e) => console.error('Oops:', e.message));
    // Lets buttons show their pressed look straight away on iPhone/iPad
    document.addEventListener('touchstart', () => {}, { passive: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window.RF);
