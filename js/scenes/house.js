/* Superstar World - My House (STUB - replaced by the real scene) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('house', {
        place: true,
        enter(root) {
            RF.ui.topBar(root);
            root.appendChild(el('div', { className: 'stub' }, el('h1', { text: 'My House' }), el('p', { text: 'Coming soon!' })));
        }
    });
})(window.RF);
