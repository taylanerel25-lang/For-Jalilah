/* Superstar World - "Who's playing?" (STUB - replaced by the real screen) */
(function (RF) {
    'use strict';
    const el = RF.util.el;
    RF.register('select', {
        enter(root) {
            const box = el('div', { className: 'stub' }, el('h1', { text: 'Who is playing?' }));
            RF.data.GIRLS.forEach((g) => {
                box.appendChild(RF.ui.btn(g.name, () => { RF.store.setCurrent(g.id); RF.go('town'); }, { icon: RF.ui.head(g.id, 48), kind: 'white' }));
            });
            root.appendChild(box);
        }
    });
})(window.RF);
