/* Superstar World - the town (STUB - replaced by the real walk-around town) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('town', {
        enter(root) {
            RF.ui.topBar(root, { onHome: () => RF.go('select'), homeIcon: '👭' });
            const box = el('div', { className: 'stub' }, el('h1', { text: 'Town' }));
            RF.data.PLACES.forEach((p) => box.appendChild(RF.ui.btn(p.name, () => RF.go(p.scene), { icon: p.emoji, kind: 'white', size: 'm' })));
            root.appendChild(box);
        }
    });
})(window.RF);
