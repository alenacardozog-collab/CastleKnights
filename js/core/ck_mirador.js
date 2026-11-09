'use strict';
/* Camino al Castillo: el camino de abajo a la derecha ahora se camina (23/10, el dueño dejó decidir "lo más simple").
   Al final del sendero del medio (junto a la cerca) baja una escalera de piedra por el risco hasta el camino de abajo, y allí
   hay un mirador con un banco. La escalera es la misma del mapa, copiada y dada vuelta, así queda con el mismo dibujo. Desde el 02/11 lleva sólo
   los escalones (sin el recuadro de rocas que se veía pegado), con un borde oscuro y sombra sobre el risco del mapa.
   Borrar la línea de index.html lo deshace. */
(function () {
  const KIND = 'ed_camino_al_castillo';
  if (typeof INTERIOR_LAYOUTS === 'undefined' || !INTERIOR_LAYOUTS[KIND] || typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const KEY = 'ck_mirador_escalera',
    IMG = 'data:image/png;base64,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',
    PARCHE = { x: 984, y: 604 },
    BANDA = [[1000, 591, 8, 48], [1008, 599, 8, 42], [1016, 603, 8, 40], [1024, 610, 8, 40], [1032, 618, 8, 40], [1040, 626, 8, 40], [1048, 633, 8, 40], [1056, 641, 8, 40], [1064, 648, 8, 40], [1072, 656, 8, 40], [1080, 664, 8, 40], [1088, 671, 8, 40], [1096, 679, 8, 40], [1092, 700, 22, 46]];      // por dónde se baja: columnas de 8 px en diagonal
  const cruza = (a, b) => a.x < b[0] + b[2] && a.x + a.w > b[0] && a.y < b[1] + b[3] && a.y + a.h > b[1];

  const L0 = INTERIOR_LAYOUTS[KIND];
  INTERIOR_LAYOUTS[KIND] = function (kit) {
    const r = L0.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.main;
      if (!a) return r;
      a.items.push({ key: KEY, x: PARCHE.x, baseY: PARCHE.y, ox: 0, oy: 0, floor: true, shadow: 0 });
      // se abre la banda de la escalera y se cierran sus costados (menos arriba, que da al sendero, y abajo, al camino)
      a.colliders = a.colliders.filter(c => !BANDA.some(b => cruza(c, b)));
      BANDA.forEach(([x, y, w, h], i) => {
        if (i >= 2 && i < BANDA.length - 1) a.colliders.push({ x, y: y - 10, w, h: 10 });
        if (i >= 2 && i < BANDA.length - 1) a.colliders.push({ x, y: y + h, w, h: 10 });
      });
      a.colliders.push({ x: 1114, y: 640, w: 8, h: 58 });                 // el risco a la derecha de la escalera
      // el mirador: un banco y alguien que lo comenta
      a.items.push({ key: 'cs_t_bench_h', x: 1360, baseY: 716, scale: 1, shadow: 0 });
      a.colliders.push({ x: 1334, y: 708, w: 52, h: 8 });
      (a.talkers = a.talkers || []).push({ x: 1360, y: 724, lines: ['Desde el mirador se ve todo el valle 🌄', 'Un buen lugar para descansar las piernas'], r: 40 });
      (a.talkers = a.talkers || []).push({ x: 998, y: 610, lines: ['▼ Escalera al mirador'], r: 22 });
    } catch (e) { console.warn('[mirador]', e); }
    return r;
  };
  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    if (!this.textures.exists(KEY)) this.load.image(KEY, IMG);
  };
  // la escalera es parte del risco: pegada al suelo, debajo de las luces
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    if (area && area.key === KIND + '.main') this.children.list.forEach(o => { if (o.texture && o.texture.key === KEY) o.setDepth(7.05); });
    return r;
  };
  window.CK_MIRADOR = { BANDA };
})();
