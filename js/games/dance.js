/* Superstar World - Copy My Dance (STUB - replaced by the real scene) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('dance', {
        place: true,
        enter(root) {
            RF.ui.topBar(root);
            root.appendChild(el('div', { className: 'stub' }, el('h1', { text: 'Copy My Dance' }), el('p', { text: 'Coming soon!' })));
        }
    });
})(window.RF);
