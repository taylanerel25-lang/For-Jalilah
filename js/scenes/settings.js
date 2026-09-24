/* Superstar World - Grown-ups (STUB - replaced by the real scene) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('settings', {
        place: true,
        enter(root) {
            RF.ui.topBar(root);
            root.appendChild(el('div', { className: 'stub' }, el('h1', { text: 'Grown-ups' }), el('p', { text: 'Coming soon!' })));
        }
    });
})(window.RF);
