/* Superstar World - Keepy Uppy (STUB - replaced by the real scene) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('keepy', {
        place: true,
        enter(root) {
            RF.ui.topBar(root);
            root.appendChild(el('div', { className: 'stub' }, el('h1', { text: 'Keepy Uppy' }), el('p', { text: 'Coming soon!' })));
        }
    });
})(window.RF);
