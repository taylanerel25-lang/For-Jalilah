/* Superstar World - Cupcake Bakery (STUB - replaced by the real scene) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('bakery', {
        place: true,
        enter(root) {
            RF.ui.topBar(root);
            root.appendChild(el('div', { className: 'stub' }, el('h1', { text: 'Cupcake Bakery' }), el('p', { text: 'Coming soon!' })));
        }
    });
})(window.RF);
