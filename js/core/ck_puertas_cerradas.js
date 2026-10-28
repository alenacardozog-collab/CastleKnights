'use strict';
/* Puertas laterales del Gran Salón del Trono (23/10, el dueño dejó decidir "lo más simple"): están cerradas con llave y al
   acercarse se avisa, así no parece que el juego se trabó. Borrar la línea de index.html las deja mudas como antes. */
(function () {
  const KIND = 'ed_salon_del_trono_3';
  if (typeof INTERIOR_LAYOUTS === 'undefined' || !INTERIOR_LAYOUTS[KIND]) return;
  const PUERTAS = [[48, 128], [48, 312], [432, 128], [432, 312]];
  const FRASES = ['Cerrada con llave 🔒', 'Esta puerta no se abre', 'Del otro lado se oyen pasos… pero está cerrada 🔒'];
  const L0 = INTERIOR_LAYOUTS[KIND];
  INTERIOR_LAYOUTS[KIND] = function (kit) {
    const r = L0.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.main;
      if (a) PUERTAS.forEach(([x, y]) => (a.talkers = a.talkers || []).push({ x, y, lines: FRASES, r: 24 }));
    } catch (e) { console.warn('[puertas cerradas]', e); }
    return r;
  };
})();
