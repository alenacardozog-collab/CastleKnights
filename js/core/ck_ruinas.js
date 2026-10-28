'use strict';
/* Ruinas (23/10, pedido del dueño): en el pantano del este había una casa en ruinas, árboles, una cruz y una cerca
   parados en medio del agua (así venía el mapa viejo). Se sacan; quedan las rocas y los escombros, que sí pueden asomar
   del agua. El agua sigue sin poder cruzarse (sus choques no se tocan). Borrar la línea de index.html los vuelve a poner. */
(function () {
  if (typeof INTERIOR_LAYOUTS === 'undefined' || !INTERIOR_LAYOUTS.ruins) return;
  const EN_EL_AGUA = [['ru_stonewall', 950, 660], ['ru_tree2', 870, 600], ['ru_tree2', 1010, 590], ['ru_tree1', 900, 720], ['ru_cross', 1030, 660], ['ru_fence', 860, 668]];
  const L0 = INTERIOR_LAYOUTS.ruins;
  INTERIOR_LAYOUTS.ruins = function (kit) {
    const r = L0.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.village;
      if (a) a.items = a.items.filter(it => !EN_EL_AGUA.some(([k, x, y]) => it.key === k && it.x === x && it.baseY === y));
    } catch (e) { console.warn('[ruinas]', e); }
    return r;
  };
})();
