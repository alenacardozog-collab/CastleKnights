/* The ruined village north of the village (one big outdoor map; the layout data is in js/maps/data/ruins_map.js). Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.ruins = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ================================================ THE RUINED VILLAGE (outdoor, one big explorable map)
    // South gate -> plaza with the dry fountain -> main stairs up to the terrace (chapel, graveyard, watchtower);
    // west quarter with the mill, east quarter drowned by the marsh. Every district loops back to the plaza.
    title = 'Aldea en Ruinas';
    start = 'village';
    const M = (typeof window !== 'undefined' && window.RUINS_MAP) || { w: 1120, h: 880, items: [], cols: [], sizes: {} };
    const FIRE = 0xff8a3c, COLD = 0x9fb8d8;
    const v = { w: M.w, h: M.h, outdoor: true, groundKey: 'ru_ground', surface: 'dirt', title: 'Aldea en Ruinas',
      rects: [], items: [], colliders: [], doors: [], exits: [], actors: [], portals: [], lights: [], polys: [], fx: [], talkers: [],
      spawn: { x: 560, y: M.h - 36 }, ambient: [['amb_forest', 0.18]], grade: RUINS_DAYLIGHT };
    // the layout (props, shadows and solid footprints) is composed with the ground painting and shipped as data
    fromData(v, { items: M.items.map(([k, x, y, f, anim]) => ['ru_' + k, x, y, f, anim]), cols: M.cols }, /^ru_(tree1|tree2|bush)$/);
    const talk = (x, y, lines, r) => v.talkers.push({ x, y, lines, r: r || 40 });
    // the last villager, camped against the terrace wall
    v.items.push({ key: 'campfire_anim', anim: 'campfire_burn', x: 410, baseY: 398, scale: 1, shadow: 26, embers: [0, -20] });
    v.colliders.push({ x: 398, y: 386, w: 24, h: 12 });
    light(v, 410, 390, 60, FIRE, 0.30); light(v, 410, 376, 16, FIRE, 0.36, { halo: true });
    v.items.push({ key: 'npc2_villager', anim: 'npc2_idle', x: 440, baseY: 388, scale: 1.3, flipX: true });
    v.colliders.push({ x: 433, y: 380, w: 14, h: 8 });
    talk(440, 384, ['No queda nadie más… 🕯️', 'La niebla llegó una noche y no se fue', 'No entres a la capilla de noche ⛪', 'El pantano se tragó el barrio del este']);
    talk(606, 842, ['«Aldea de Brumavieja»', 'El cartel está roto: «…no pas…»'], 30);
    talk(560, 262, ['La puerta de la capilla está trabada ⛪', 'Algo se mueve adentro…'], 30);
    talk(132, 252, ['La torre vigía se derrumbó por dentro'], 30);
    talk(444, 620, ['El pozo está seco'], 26);
    talk(150, 472, ['Las aspas crujen con el viento 🌬️'], 34);
    talk(756, 232, ['Tumbas sin nombre…', 'Alguien dejó flores hace poco'], 46);
    // cold glints on the marsh and the pool, a pale glow in the chapel window
    v.fx.push({ type: 'glints', x: 800, y: 480, w: 270, h: 250, n: 16 }, { type: 'glints', x: 100, y: 706, w: 100, h: 40, n: 4 });
    light(v, 560, 196, 22, COLD, 0.30, { halo: true });
    light(v, 132, 226, 18, COLD, 0.16, { halo: true });
    // hostile weather: wind-driven ash, banks of fog that drift across, distant lightning
    v.fx.push({ type: 'ash', x: -60, y: -40, w: M.w + 60, h: M.h });
    v.fx.push({ type: 'fog', x: 0, y: 0, w: M.w, h: M.h, n: 16 });
    v.fx.push({ type: 'storm', x: 0, y: 0, w: M.w, h: M.h });
    // the marsh breathes; crows sit on the ruins and take off when the hero comes close
    v.fx.push({ type: 'bubbles', x: 800, y: 480, w: 270, h: 250 }, { type: 'bubbles', x: 100, y: 706, w: 100, h: 40, slow: true });
    v.fx.push({ type: 'crows', pts: [[588, 300], [352, 398], [706, 346], [404, 630], [132, 108], [760, 196], [968, 392], [664, 676], [214, 572], [470, 372]] });
    v.exits.push({ x: 528, y: M.h - 24, w: 64, h: 24, key: 'down', to: 'outside', hint: '▼ Volver a la aldea' });
    areas.village = v;
  return { title, start };
};
