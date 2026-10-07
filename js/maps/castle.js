/* The castle: road with drawbridge, courtyard, wall walk, royal garden, great hall, kitchen, king's chamber, library, armory. Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.castle = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ================================================ THE CASTLE
    // road (forest) -> drawbridge -> courtyard -> great hall / kitchen / armory,
    // and beyond the dais of the great hall: the king's chamber and the library.
    // Laid out like a real castle: the hall is long, you enter at the "low" end through a
    // timber screen and walk up to the dais; private rooms lie behind it, the kitchen is apart.
    title = 'Camino al Castillo';
    start = 'road';
    const forest = (typeof window !== 'undefined' && window.CASTLE_FOREST) || { trees: [], bushes: [] };
    const WARM = 0xffb45e, FIRE = 0xff8a3c, DAY = 0xfff0c0;
    // torch on a back wall + its pool of light on the floor
    const torch = (a, x, wallBase) => {
      const wb = wallBase === undefined ? WALL : wallBase;
      putc(a, 'torch', x, wb - 12, { solid: false, flame: true });
      light(a, x, wb + 16, 46, WARM, 0.20);
      light(a, x, wb - 46, 15, WARM, 0.34, { halo: true });
    };
    // stained glass on a back wall + the shaft of daylight it throws on the floor
    const glass = (a, x, lean) => {
      putc(a, 'glass', x, WALL - 7, { solid: false, scale: 0.82 });
      const k = lean || 0;
      a.polys.push({ pts: [x - 12, WALL + 4, x + 12, WALL + 4, x + 22 + k, WALL + 78, x - 22 + k, WALL + 78], color: DAY, alpha: 0.10 });
      a.polys.push({ pts: [x - 7, WALL + 4, x + 7, WALL + 4, x + 12 + k, WALL + 78, x - 12 + k, WALL + 78], color: DAY, alpha: 0.07 });
      a.fx.push({ type: 'dust', x: x - 16 + k / 2, y: WALL + 6, w: 32, h: 70 });
    };
    const candle = (a, x, y) => { putc(a, 'candelabra', x, y, { scale: 1.2, foot: 0.2 }); light(a, x, y + 2, 34, WARM, 0.16); };
    const brazier = (a, x, y, r) => { putc(a, 'brazier', x, y, { foot: 0.22, footW: 0.8, flame: true }); light(a, x, y + 2, r || 44, FIRE, 0.20); light(a, x, y - 34, 14, FIRE, 0.36, { halo: true }); };
    const archAt = (a, x) => putc(a, 'arch', x, WALL + 3, { solid: false });
    const SF = THEMES.hall.sideFace;                              // width of the side wall faces
    // someone who says a line when the hero comes close
    const talker = (a, x, y, lines, r) => a.talkers.push({ x, y, lines, r: r || 40 });
    // animated wild flowers from the village set: kind 'red' | 'white', v 0 = scattered patch, 1 = clump, 2 = single
    const flowers = (a, kind, x, y, v) => a.items.push({ flowers: kind, x, y, v: v || 0, baseY: y });

    // ---------------- ROAD TO THE CASTLE (outdoor, 960x720)
    // Composed offline with the SpriteLab tiles: the village path winds down through the forest, a stream falls off the
    // ledge (two ways across: footbridge above, stone bridge + steps below), and the castle rises behind its moat.
    const CM = (typeof window !== 'undefined' && window.CASTLE_MAPS && window.CASTLE_MAPS.maps) || {};
    const outdoorArea = (M, o) => Object.assign({ w: M.w, h: M.h, outdoor: true, rects: [], items: [], colliders: [], doors: [], exits: [], actors: [], portals: [],
      lights: [], polys: [], fx: [], talkers: [], grade: CASTLE_DAYLIGHT }, o);
    const banner = (a, x, y) => a.items.push({ key: 'cs_banner_anim', anim: 'cs_banner_wave', x, baseY: y + 1, scale: 1, shadow: 10, flipX: false });
    const RM = CM.road || { w: 960, h: 720, items: [], cols: [] };
    const road = outdoorArea(RM, { groundKey: 'cs_ground_road', surface: 'dirt', title: 'Camino al Castillo', spawn: { x: 120, y: 34 }, ambient: [['amb_forest', 0.55]] });
    fromData(road, RM);
    const GX = (RM.bridge && RM.bridge.x) || 660;
    [[84, 236], [232, 560], [610, 420], [716, 600]].forEach(([x, y]) => light(road, x + 10, y + 2, 34, WARM, 0.14));
    // the gate: banners, braziers and two sentries at the foot of the drawbridge
    banner(road, GX - 84, 296); banner(road, GX + 84, 296);
    brazier(road, GX - 56, 298, 40); brazier(road, GX + 56, 298, 40);
    person(road, 'soldier_idle', 'soldier_idle', GX - 34, 312, { scale: 1.2 });
    person(road, 'soldier_idle', 'soldier_idle', GX + 34, 312, { scale: 1.2, flipX: true });
    talker(road, GX, 316, ['¡Bajad el puente! Viene un viajero 🏰', 'Bienvenido al castillo del rey', 'Cruzad con cuidado, el foso es hondo'], 50);
    // a travellers' camp in the clearing by the pond
    road.items.push({ key: 'campfire_anim', anim: 'campfire_burn', x: 270, baseY: 676, scale: 1, shadow: 26, embers: [0, -20] });
    road.colliders.push({ x: 258, y: 664, w: 24, h: 12 });
    light(road, 270, 668, 54, FIRE, 0.24); light(road, 270, 654, 16, FIRE, 0.34, { halo: true });
    putc(road, 'log', 316, 682, { foot: 0.6, footW: 0.9 });
    putc(road, 'log', 224, 686, { foot: 0.6, footW: 0.9, flipX: true });
    road.items.push({ key: 'npc2_villager', anim: 'npc2_idle', x: 300, baseY: 664, scale: 1.3, flipX: true });
    talker(road, 300, 660, ['El castillo está cruzando el foso 🏰', 'Buen fuego para descansar 🔥', 'Dicen que el rey busca héroes ⚔️']);
    putc(road, 'cart', 742, 318, { scale: 1.3, foot: 0.35, footW: 0.8 });
    talker(road, 890, 344, ['Linda vista del foso desde aquí 🌊'], 34);
    [['red', 196, 120, 0], ['white', 262, 260, 0], ['red', 60, 330, 1], ['white', 470, 396, 0], ['red', 540, 300, 0], ['white', 740, 400, 1], ['red', 760, 640, 0],
     ['white', 470, 680, 0], ['red', 196, 470, 2], ['white', 250, 110, 1], ['red', 470, 560, 0], ['white', 590, 664, 1], ['red', 836, 300, 0], ['white', 300, 400, 2]]
      .forEach(([k, x, y, v]) => flowers(road, k, x, y, v));
    // life: falling leaves, glints on the moat and the stream, the waterfall
    road.fx.push({ type: 'leaves', x: 0, y: -10, w: RM.w, h: RM.h });
    (RM.water || []).forEach(([x, y, w, h]) => road.fx.push({ type: 'glints', x, y, w, h, n: Math.max(4, Math.round(w * h / 2600)) }));
    if (RM.fall) road.fx.push({ type: 'waterfall', x: RM.fall[0], y: RM.fall[1], w: RM.fall[2], h: RM.fall[3] });
    road.bridge = RM.bridge || { x: 660, y0: 206, y1: 274, w: 44 };
    portal(road, GX, 'courtyard', { y: 206, sprite: false, hint: '▲ Entrar al castillo' });
    road.exits.push({ x: 92, y: 0, w: 56, h: 18, key: 'up', to: 'outside', hint: '▲ Volver a la aldea' });
    areas.road = road;

    // ---------------- COURTYARD (outdoor, 640x560)
    const CW = 152;                                               // height of the keep wall
    const yard = { w: 640, h: 560, outdoor: true, groundKey: 'cs_ground_courtyard', surface: 'stone', title: 'Patio del Castillo',
      rects: [], items: [], colliders: [], doors: [], exits: [], actors: [], portals: [], lights: [], polys: [], fx: [], talkers: [], spawn: { x: 320, y: 520 },
      ambient: [['amb_courtyard', 0.5]], grade: CASTLE_DAYLIGHT };
    yard.colliders.push({ x: 0, y: 0, w: 640, h: CW + 2 });
    yard.colliders.push({ x: 0, y: 0, w: 76, h: 164 });           // corner towers
    yard.colliders.push({ x: 564, y: 0, w: 76, h: 164 });
    yard.colliders.push({ x: 0, y: 0, w: 14, h: 270 });           // west wall, with the gate to the training yard
    yard.colliders.push({ x: 0, y: 316, w: 14, h: 244 });
    yard.exits.push({ x: 0, y: 270, w: 12, h: 46, key: 'walk', to: 'training', arrive: { x: 440, y: 436 } });
    talker(yard, 30, 292, ['← Patio de armas ⚔️'], 30);
    yard.colliders.push({ x: 626, y: 0, w: 14, h: 200 });         // east wall, with the garden gate
    yard.colliders.push({ x: 626, y: 248, w: 14, h: 312 });
    yard.exits.push({ x: 628, y: 200, w: 12, h: 48, key: 'walk', to: 'garden', arrive: { x: 46, y: 342 } });
    talker(yard, 610, 224, ['→ Jardín Real 🌹'], 30);
    // the corner towers have volume now, and a door each: stairs up to the wall walk
    putc(yard, 'tower', 38, 164, { scale: 1.15, solid: false, shadow: false });
    putc(yard, 'tower', 602, 164, { scale: 1.15, solid: false, shadow: false, flipX: true });
    portal(yard, 38, 'walls', { y: 166, sprite: false, hint: '▲ Subir a la torre oeste', arrive: { x: 96, y: 184 } });
    portal(yard, 602, 'walls', { y: 166, sprite: false, hint: '▲ Subir a la torre este', arrive: { x: 864, y: 184 } });
    yard.colliders.push({ x: 0, y: 546, w: 294, h: 14 });
    yard.colliders.push({ x: 346, y: 546, w: 294, h: 14 });
    yard.exits.push({ x: 296, y: 534, w: 48, h: 22, key: 'down', to: 'road', arrive: { x: GX, y: 292 }, hint: '▼ Salir del castillo' });
    portal(yard, 130, 'kitchen', { y: CW + 2, scale: 1.2, door: 'door', hint: '▲ Cocina Real' });
    portal(yard, 320, 'throne', { y: CW + 2, scale: 1, door: 'gate', hint: '▲ Gran Salón' });
    portal(yard, 510, 'armory', { y: CW + 2, scale: 1.2, door: 'door', hint: '▲ Armería' });
    // on the keep wall
    [196, 444].forEach(x => putc(yard, 'glass', x, CW - 24, { solid: false }));
    [228, 412].forEach(x => yard.items.push({ key: 'cs_banner_anim', anim: 'cs_banner_wave', x, baseY: CW - 20, scale: 1.25, shadow: 0 }));
    [98, 162, 280, 360, 478, 542].forEach(x => torch(yard, x, CW - 14));
    [196, 444].forEach(x => putc(yard, 'planter', x, CW + 22, { foot: 0.5 }));
    // guards at the hall door, lions along the avenue
    person(yard, 'soldier_idle', 'soldier_idle', 284, 176, { scale: 1.2 });
    person(yard, 'soldier_idle', 'soldier_idle', 356, 176, { scale: 1.2, flipX: true });
    talker(yard, 320, 182, ['El rey os espera en el Gran Salón 👑', '¡Alto! ...Ah, sois vos. Pasad.', 'Mantened la espada envainada aquí ⚔️'], 46);
    // a guard walks his round about the fountain
    yard.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 24,
      pts: [[196, 300, 1400], [444, 300, 600], [444, 458, 1400], [196, 458, 600]],
      lines: ['Todo en orden en el patio.', 'Linda tarde para una guardia 🌤️', 'No os acerquéis al foso de noche...'] });
    putc(yard, 'lion', 266, 262, { foot: 0.22, footW: 0.8 });
    putc(yard, 'lion', 374, 262, { foot: 0.22, footW: 0.8, flipX: true });
    // middle: fountain, benches, braziers by the gate
    putc(yard, 'fountain', 320, 398, { scale: 1.5, foot: 0.62, footW: 0.9 });
    yard.fx.push({ type: 'fountain', x: 320, y: 332 }, { type: 'glints', x: 296, y: 356, w: 48, h: 22, n: 5 });
    place(yard, 'Bench_1', 226, 374, 12, 18);
    place(yard, 'Bench_1', 414, 374, 12, 18);
    brazier(yard, 270, 506);
    brazier(yard, 370, 506);
    // service side (kitchen door): well, market stall, delivery cart, supplies
    place(yard, 'Well_Hay_1', 52, 248, 44, 22);
    putc(yard, 'stall', 128, 326, { scale: 1.25, foot: 0.4, footW: 0.9 });
    yard.items.push({ key: 'npc3_villager', anim: 'npc3_idle', x: 178, baseY: 330, scale: 1.3, flipX: true });
    talker(yard, 176, 326, ['¡Pan recién horneado! 🍞', 'Fruta fresca de la aldea 🍎', 'El cocinero real compra aquí 😉']);
    putc(yard, 'cart', 226, 232, { scale: 1.3, foot: 0.35, footW: 0.8, flipX: true });
    place(yard, 'Crate_Large_Empty', 190, 196, 22, 12);
    place(yard, 'Barrel_Small_Empty', 92, 186, 14, 8);
    place(yard, 'Barrel_Small_Empty', 106, 196, 14, 8);
    place(yard, 'Sack_3', 166, 190, 14, 6);
    // garden (left lawn)
    place(yard, 'Tree_Emerald_2', 62, 430, 14, 9);
    place(yard, 'Tree_Emerald_1', 132, 496, 14, 9);
    place(yard, 'Bush_Emerald_3', 48, 506, 18, 10);
    place(yard, 'Bush_Emerald_1', 124, 384, 26, 10);
    place(yard, 'Bush_Emerald_5', 96, 462, 0, 0);
    place(yard, 'Bench_3', 100, 416, 12, 8);
    flowers(yard, 'red', 40, 446, 0); flowers(yard, 'white', 120, 352, 1); flowers(yard, 'white', 76, 486, 1); flowers(yard, 'red', 476, 196, 2); flowers(yard, 'white', 590, 250, 2);
    // stables on the right lawn, training ground below
    putc(yard, 'stable', 540, 286, { foot: 0.3, footW: 0.66 });
    place(yard, 'Bush_Emerald_3', 600, 286, 18, 10);
    place(yard, 'HayStack_2', 486, 262, 24, 12);
    putc(yard, 'dummy', 496, 410, { scale: 1.3, foot: 0.2, footW: 0.6 });
    putc(yard, 'dummy', 548, 462, { scale: 1.3, foot: 0.2, footW: 0.6 });
    putc(yard, 'dummy', 590, 396, { scale: 1.3, foot: 0.2, footW: 0.6, flipX: true });
    put(yard, 'weapon_rack', 584, 338, { scale: 1.1, foot: 0.2 });
    putc(yard, 'workbench', 474, 328, { foot: 0.5 });
    // a recruit drills between the dummies
    yard.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 30,
      pts: [[520, 424, 2600], [566, 478, 2200], [520, 484, 1200]], lines: ['¡Uno, dos... estocada!', 'Algún día seré caballero 🛡️'] });
    place(yard, 'Crate_Medium_Closed', 468, 498, 14, 9);
    areas.courtyard = yard;

    // ---------------- WALL WALK AND WATCHTOWERS (outdoor, 960x420)
    // North of the parapet you look down on the keep and the garden; south, on the moat and the road you came by.
    const WM = CM.walls || { w: 960, h: 420, items: [], cols: [] };
    const walls = outdoorArea(WM, { groundKey: 'cs_ground_walls', surface: 'stone', title: 'Adarve y Torres de Vigilancia', spawn: { x: 96, y: 184 }, ambient: [['amb_courtyard', 0.28]] });
    fromData(walls, WM);
    [[36, 106], [156, 106], [406, 106], [554, 106], [804, 106], [924, 106]].forEach(([x, y]) => walls.items.push({ key: 'cs_banner_anim', anim: 'cs_banner_wave', x, baseY: y, scale: 1, shadow: 0 }));
    brazier(walls, 200, 244, 40); brazier(walls, 760, 244, 40); brazier(walls, 424, 150, 40); brazier(walls, 536, 150, 40);
    person(walls, 'soldier_idle', 'soldier_idle', 480, 150, { scale: 1.2 });
    talker(walls, 480, 156, ['Desde aquí se domina todo el valle 🏞️', 'El puente se baja cuando alguien se acerca', 'Nada se mueve en el camino… por ahora'], 44);
    walls.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 22,
      pts: [[196, 204, 1600], [372, 204, 900], [372, 176, 400], [196, 176, 900]], lines: ['Sin novedad en el muro oeste.', 'El viento trae olor a lluvia 🌧️'] });
    walls.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 22,
      pts: [[588, 190, 1200], [772, 190, 1800], [772, 222, 400], [588, 222, 900]], lines: ['Muro este, todo en calma.', 'Desde la torre se ven las ruinas del norte…'] });
    talker(walls, 906, 238, ['🔭 Se ve la aldea, pequeña entre los árboles', '🔭 Hay humo gris sobre las ruinas del norte…'], 34);
    talker(walls, 480, 262, ['Una balista apuntando al camino'], 30);
    walls.fx.push({ type: 'glints', x: 0, y: 346, w: 960, h: 26, n: 14 }, { type: 'leaves', x: 0, y: 0, w: 960, h: 120 });
    (WM.hatch || [[96, 156], [864, 156]]).forEach(([x, y], i) =>
      walls.exits.push({ x: x - 16, y: y - 8, w: 32, h: 18, key: 'up', to: 'courtyard', arrive: { x: i ? 602 : 38, y: 188 }, hint: '▲ Bajar al patio' }));
    areas.walls = walls;

    // ---------------- ROYAL GARDEN (outdoor, 800x640) — palette: lawn greens, rose pink, white marble, gold, royal purple
    const GM = CM.garden || { w: 800, h: 640, items: [], cols: [] };
    const garden = outdoorArea(GM, { groundKey: 'cs_ground_garden', surface: 'stone', title: 'Jardín Real', spawn: { x: 46, y: 342 },
      ambient: [['amb_courtyard', 0.3], ['amb_forest', 0.3]], grade: 0xfff3e2 });
    fromData(garden, GM);
    garden.fx.push({ type: 'petals', x: 440, y: 60, w: 340, h: 420 }, { type: 'petals', x: 480, y: 520, w: 260, h: 80 });
    garden.fx.push({ type: 'butterflies', x: 100, y: 150, w: 620, h: 430, n: 8 });
    garden.fx.push({ type: 'fountain', x: 400, y: 304 });
    (GM.water || []).forEach(([x, y, w, h]) => garden.fx.push({ type: 'glints', x, y, w, h, n: 8 }));
    [['red', 150, 400, 0], ['white', 210, 520, 1], ['red', 60, 560, 2], ['white', 300, 600, 0], ['red', 520, 430, 1], ['white', 690, 300, 2], ['red', 560, 130, 0], ['white', 700, 600, 1], ['red', 330, 250, 2]]
      .forEach(([k, x, y, v]) => flowers(garden, k, x, y, v));
    place(garden, 'LampPost_3', 250, 326, 8, 6); place(garden, 'LampPost_3', 540, 470, 8, 6);
    [[250, 326], [540, 470]].forEach(([x, y]) => light(garden, x + 10, y + 2, 34, WARM, 0.12));
    garden.items.push({ key: 'npc3_villager', anim: 'npc3_idle', x: 210, baseY: 228, scale: 1.3 });
    garden.colliders.push({ x: 203, y: 220, w: 14, h: 8 });
    talker(garden, 210, 224, ['Las rosas de la reina, mis favoritas 🌹', 'Cuido este jardín desde niño', 'No piséis los canteros, por favor 🙏']);
    person(garden, 'soldier_idle', 'soldier_idle', 112, 316, { scale: 1.2 });
    talker(garden, 112, 320, ['El Jardín Real. Disfrutad el paseo.', 'El rey toma el té en el templete 🫖'], 40);
    talker(garden, 400, 148, ['«A la Reina Elara, que plantó este jardín»'], 34);
    talker(garden, 180, 562, ['El reloj de sol marca la tarde ☀️'], 30);
    talker(garden, 610, 244, ['Un templete fresco junto al estanque'], 36);
    garden.exits.push({ x: 0, y: 318, w: 12, h: 52, key: 'walk', to: 'courtyard', arrive: { x: 606, y: 226 } });
    areas.garden = garden;

    // ---------------- TRAINING YARD (outdoor, 832x464) — laid out after the reference picture of the user:
    // dummies' pen and sparring rings on the left, archery range on the right, armoury tents and racks under the north wall.
    const TM = CM.training || { w: 832, h: 464, items: [], cols: [] };
    const training = outdoorArea(TM, { groundKey: 'cs_ground_training', surface: 'dirt', title: 'Patio de Armas', spawn: { x: 440, y: 436 },
      ambient: [['amb_courtyard', 0.45]], grade: 0xffffff });      // plain daylight: the colours are the ones of the reference
    fromData(training, TM);
    training.items.push({ key: 'cs_banner_red_anim', anim: 'cs_banner_red_wave', x: 393, baseY: 462, scale: 1, shadow: 10 });
    training.items.push({ key: 'cs_banner_blue_anim', anim: 'cs_banner_blue_wave', x: 492, baseY: 462, scale: 1, shadow: 10 });
    [172, 390, 455, 664].forEach(x => torch(training, x, 106));        // torches on the north wall
    // the master-at-arms by the racks, recruits drilling in the pen and in the ring, an archer at the line
    person(training, 'soldier_idle', 'soldier_idle', 452, 168, { scale: 1.2 });
    talker(training, 452, 172, ['¡Postura firme, recluta! 🛡️', 'Cien golpes al muñeco antes de comer', 'Las armas están en los armeros; cuidadlas'], 44);
    training.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 30,
      pts: [[112, 250, 2400], [150, 300, 2200], [112, 302, 1400]], lines: ['¡Uno, dos... estocada!', 'Este muñeco no se rinde 😅'] });
    training.actors.push({ type: 'walker', key: 'soldier_idle', idle: 'soldier_idle', walk: 'soldier_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 26,
      pts: [[270, 262, 1200], [314, 262, 1200], [292, 284, 1800]], lines: ['Entrad al círculo si os atrevéis ⚔️', 'Aquí se entrena cuerpo a cuerpo'] });
    person(training, 'soldier_idle', 'soldier_idle', 616, 330, { scale: 1.2 });
    talker(training, 616, 334, ['No crucéis la línea mientras disparan 🏹', 'A cincuenta pasos, siempre al centro'], 40);
    talker(training, 422, 118, ['La puerta de los barracones está cerrada'], 30);
    talker(training, 198, 118, ['Depósito de la intendencia. Cerrado.'], 26);
    talker(training, 250, 170, ['Carpas del armero: afilado y reparación 🔧'], 40);
    training.fx.push({ type: 'dust', x: 60, y: 180, w: 300, h: 240 });
    training.exits.push({ x: 380, y: 448, w: 126, h: 16, key: 'down', to: 'courtyard', arrive: { x: 30, y: 300 }, hint: '▼ Volver al patio' });
    areas.training = training;

    // ---------------- GREAT HALL / THRONE ROOM (long room: the camera follows the hero)
    const th = makeArea(480, 560, THEMES.hall, { frontDoorX: 226, exitTo: 'courtyard', exitArrive: { x: 320, y: 182 } });
    th.title = 'Gran Salón del Trono'; th.surface = 'stone'; th.scroll = true; th.ambient = [['amb_hall', 0.6], ['amb_fire', 0.16]];
    archAt(th, 52); archAt(th, 428);
    portal(th, 52, 'kingroom', { scale: 1, door: 'door', hint: '▲ Aposentos del Rey' });
    portal(th, 428, 'library', { scale: 1, door: 'door', hint: '▲ Biblioteca' });
    // high end: dais with three steps, throne, king
    // (each step: a dark riser showing under a lighter tread, so the platform reads as raised)
    th.rects.push(R(158, WALL, 164, 80, 0x4f483f));
    th.rects.push(R(160, WALL, 160, 78, 0x6e665a), R(160, WALL, 160, 73, 0xb9af9c));
    th.rects.push(R(167, WALL, 146, 68, 0x756c60), R(167, WALL, 146, 63, 0xc3b9a5));
    th.rects.push(R(174, WALL, 132, 58, 0x7c7366), R(174, WALL, 132, 53, 0xcec4af));
    th.rects.push(R(158, WALL + 80, 164, 5, 0x000000, 0.18));
    putc(th, 'carpet', 240, 540, { floor: true });
    putc(th, 'throne', 240, 106, { scale: 1.35, foot: 0.3, footW: 0.8 });
    th.actors.push({ type: 'king', x: 240, y: 142 });
    torch(th, 92); torch(th, 388);
    glass(th, 134, 10); glass(th, 346, -10);
    [186, 294].forEach(x => putc(th, 'banner', x, WALL - 4, { solid: false, scale: 1.1, sway: true }));
    candle(th, 188, 124); candle(th, 292, 124);
    person(th, 'soldier_idle', 'soldier_idle', 182, 188, { scale: 1.75 });
    person(th, 'soldier_idle', 'soldier_idle', 298, 188, { scale: 1.75, flipX: true });
    putc(th, 'chest', 136, 96, { scale: 1.2 });
    putc(th, 'chest', 344, 96, { scale: 1.2 });
    // colonnade and side aisles: statues, trestle tables with benches, braziers
    [[124, 206], [124, 296], [124, 386], [356, 206], [356, 296], [356, 386]].forEach(([x, y]) => putc(th, 'pillar', x, y, { scale: 1.15, foot: 0.14, footW: 0.8 }));
    putc(th, 'statue', 50, 178, { foot: 0.2, footW: 0.9 });
    putc(th, 'statue', 430, 178, { foot: 0.2, footW: 0.9, flipX: true });
    talker(th, 240, 196, ['Inclinaos ante Su Majestad.', 'Hablad con respeto al rey 👑'], 44);
    [72, 408].forEach(x => {
      putc(th, 'bench', x, 252, { foot: 0.7 });
      putc(th, 'banquet', x, 298, { foot: 0.7 });
      putc(th, 'bench', x, 320, { foot: 0.7 });
    });
    brazier(th, 84, 392); brazier(th, 396, 392);
    putc(th, 'armor', 46, 404, { scale: 1.3, foot: 0.25 });
    putc(th, 'armor', 434, 404, { scale: 1.3, foot: 0.25, flipX: true });
    // low end: timber screen with a single opening (the "screens passage" of a medieval hall)
    const SCR_Y = 428, SCR_H = 44;
    [[SIDE + SF, 190], [290, 480 - SIDE - SF]].forEach(([x0, x1]) => {
      th.items.push({ baseY: SCR_Y + SCR_H, wallTex: 'int_wall_wood', x0, x1, y: SCR_Y, h: SCR_H });
      th.colliders.push({ x: x0, y: SCR_Y + SCR_H - 14, w: x1 - x0, h: 14 });
    });
    th.rects.push(R(SIDE + SF, SCR_Y + SCR_H, 190 - SIDE - SF, 4, 0x000000, 0.22), R(290, SCR_Y + SCR_H, 480 - SIDE - SF - 290, 4, 0x000000, 0.22));
    [70, 146, 334, 410].forEach(x => putc(th, 'shields', x, SCR_Y + SCR_H + 1, { solid: false, scale: 0.8, lift: 7 }));
    person(th, 'soldier_idle', 'soldier_idle', 198, 500, { scale: 1.75 });
    person(th, 'soldier_idle', 'soldier_idle', 282, 500, { scale: 1.75, flipX: true });
    candle(th, 46, 536); candle(th, 434, 536);
    // a page crosses the hall with messages
    th.actors.push({ type: 'walker', key: 'npc4_villager', idle: 'npc4_idle', walk: 'npc4_walk', scale: 2.0, speed: 30,
      pts: [[160, 420, 2400], [160, 236, 1800], [320, 236, 2400], [320, 420, 1800]], lines: ['¡Paso, paso! Mensaje para el rey 📜', 'Hoy hay banquete en el salón 🍗'] });
    putc(th, 'bench', 110, 536, { foot: 0.7 });
    putc(th, 'bench', 370, 536, { foot: 0.7 });
    areas.throne = th;

    // ---------------- ROYAL KITCHEN
    const kt = makeArea(400, 300, THEMES.hall, { frontDoorX: 186, exitTo: 'courtyard', exitArrive: { x: 130, y: 182 } });
    kt.title = 'Cocina Real'; kt.surface = 'stone'; kt.ambient = [['amb_kitchen', 0.6]];
    putc(kt, 'oven', 70, 106, { scale: 1.5, foot: 0.4, flame: true });
    light(kt, 70, 112, 60, FIRE, 0.22);
    torch(kt, 122);
    put(kt, 'kitchen', 160, 96, { foot: 0.5 });
    putc(kt, 'meatrack', 246, WALL - 10, { solid: false, scale: 1.1 });
    putc(kt, 'preptable', 246, 108, { scale: 1.15, foot: 0.5 });
    torch(kt, 296);
    put(kt, 'shelf_jars', 346, 92, { foot: 0.25 });
    kt.actors.push({ type: 'walker', key: 'npc3_villager', idle: 'npc3_idle', walk: 'npc3_walk', scale: 2.0, speed: 34,
      pts: [[178, 136, 2400], [126, 132, 2800], [246, 132, 2800]], lines: ['¡No toquéis el guiso! 🍲', 'El rey quiere jabalí esta noche 🐗', 'Probad el pan, está tibio 🍞'] });
    putc(kt, 'cauldron', 100, 176, { scale: 1.3, foot: 0.3, footW: 0.8, flame: true });
    kt.fx.push({ type: 'steam', x: 100, y: 128 });
    light(kt, 100, 176, 40, FIRE, 0.18);
    putc(kt, 'banquet', 208, 216, { scale: 1.35, foot: 0.7 });
    put(kt, 'stool', 132, 208); put(kt, 'stool', 284, 208);
    put(kt, 'stool', 168, 242); put(kt, 'stool', 248, 242);
    put(kt, 'keg', 50, 214);
    put(kt, 'veg_crates', 346, 160); put(kt, 'veg_crates', 346, 196, { flipX: true });
    put(kt, 'apple_barrel', 46, 256); put(kt, 'apple_barrel', 82, 270);
    prop(kt, 'Sack_3', 340, 256, 16, 14); prop(kt, 'Sack_3', 364, 264, 16, 14);
    prop(kt, 'Basket_Empty', 308, 268, 22, 17);
    areas.kitchen = kt;

    // ---------------- KING'S CHAMBER (the "solar": private, warm, wood and cloth)
    const kr = makeArea(400, 300, THEMES.royal, { frontDoorX: 186, exitTo: 'throne', exitArrive: { x: 52, y: 100 } });
    kr.title = 'Aposentos del Rey'; kr.surface = 'wood'; kr.ambient = [['amb_fire', 0.5]];
    put(kr, 'wardrobe', 50, 96, { foot: 0.25 });
    putc(kr, 'tapestry', 110, WALL - 8, { solid: false, scale: 0.8 });
    putc(kr, 'royal_bed', 180, 172, { scale: 1.35, foot: 0.82, footW: 0.94 });
    candle(kr, 130, 112); candle(kr, 230, 112);
    putc(kr, 'hearth', 298, 104, { foot: 0.3, flame: true });
    light(kr, 302, 124, 78, FIRE, 0.24); light(kr, 302, 86, 22, FIRE, 0.30, { halo: true });
    putc(kr, 'armor', 362, 112, { scale: 1.25, foot: 0.25, flipX: true });
    putc(kr, 'rug_royal', 292, 232, { floor: true });
    putc(kr, 'bench', 180, 196, { foot: 0.7 });
    putc(kr, 'desk', 62, 206, { scale: 1.35, foot: 0.6 });
    put(kr, 'stool', 62, 232);
    putc(kr, 'chest', 356, 250, { scale: 1.35 });
    putc(kr, 'chest', 356, 278, { scale: 1.35 });
    put(kr, 'vanity', 116, 282, { foot: 0.3 });
    prop(kr, 'Plant_2', 40, 276, 15, 11);
    areas.kingroom = kr;

    // ---------------- LIBRARY
    const lb = makeArea(400, 300, THEMES.study, { frontDoorX: 186, exitTo: 'throne', exitArrive: { x: 428, y: 100 } });
    lb.title = 'Biblioteca'; lb.surface = 'wood'; lb.ambient = [['amb_hall', 0.35]];
    [52, 104, 156, 244, 296, 348].forEach(x => put(lb, 'bookshelf', x, 94, { foot: 0.25 }));
    glass(lb, 200, 0);
    rug(lb, 'rug_blue', 200, 196, { scale: 1.7 });
    putc(lb, 'desk', 200, 176, { scale: 1.45, foot: 0.6 });
    put(lb, 'stool', 200, 198);
    lb.actors.push({ type: 'walker', key: 'npc4_villager', idle: 'npc4_idle', walk: 'npc4_walk', scale: 2.0, speed: 26,
      pts: [[262, 174, 3600], [300, 108, 2600], [104, 108, 2600]], lines: ['Silencio, por favor... 📚', 'Aquí está la historia del reino.', '¿Buscáis el tomo de hechizos? 🔮'] });
    putc(lb, 'lectern', 132, 168, { scale: 1.25, foot: 0.3 });
    candle(lb, 96, 168); candle(lb, 310, 168);
    put(lb, 'round_table', 92, 244); put(lb, 'stool', 54, 238); put(lb, 'stool', 130, 238);
    put(lb, 'bookshelf', 50, 180, { foot: 0.25 });
    put(lb, 'bookshelf', 350, 180, { foot: 0.25 });
    putc(lb, 'globe', 300, 250, { scale: 1.15, foot: 0.3 });
    putc(lb, 'chest', 340, 270, { scale: 1.3 });
    prop(lb, 'Plant_2', 362, 276, 15, 11);
    areas.library = lb;

    // ---------------- ARMORY
    const ar = makeArea(400, 300, THEMES.hall, { frontDoorX: 186, exitTo: 'courtyard', exitArrive: { x: 510, y: 182 } });
    ar.title = 'Armería'; ar.surface = 'stone'; ar.ambient = [['amb_fire', 0.4]];
    put(ar, 'weapon_rack', 56, 80, { foot: 0.25 });
    put(ar, 'weapon_rack', 110, 80, { foot: 0.25 });
    torch(ar, 150);
    putc(ar, 'shields', 196, 78, { scale: 1.3, foot: 0.18 });
    putc(ar, 'shields', 258, 78, { scale: 1.3, foot: 0.18, flipX: true });
    torch(ar, 300);
    // the forge corner: forge, anvil, quenching barrel and the smith at work
    putc(ar, 'forge', 342, 106, { scale: 1.1, foot: 0.35, flame: true });
    light(ar, 342, 112, 64, FIRE, 0.24);
    putc(ar, 'anvil', 318, 158, { scale: 1.2, foot: 0.45, footW: 0.8 });
    prop(ar, 'Barrel_Small_Empty', 362, 152, 16, 20);
    ar.actors.push({ type: 'smith', key: 'npc1_villager', idle: 'npc1_idle', scale: 2.0, x: 290, y: 160, hitX: 318, hitY: 136,
      lines: ['El acero del rey no se templa solo 🔨', '¿Una espada nueva? Volved mañana.', 'Cuidado, que quema 🔥'] });
    [[48, 150], [48, 200], [352, 214], [352, 258]].forEach(([x, y], i) => putc(ar, 'armor', x, y, { scale: 1.3, foot: 0.25, flipX: i > 1 }));
    putc(ar, 'workbench', 120, 150, { scale: 1.2, foot: 0.5 });
    putc(ar, 'dummy', 150, 214, { scale: 1.4, foot: 0.2, footW: 0.6 });
    putc(ar, 'dummy', 236, 214, { scale: 1.4, foot: 0.2, footW: 0.6, flipX: true });
    rug(ar, 'rug_red', 194, 240, { scale: 1.2 });
    putc(ar, 'statue', 200, 132, { foot: 0.2, footW: 0.9 });
    putc(ar, 'chest', 48, 262, { scale: 1.3 });
    putc(ar, 'chest', 84, 272, { scale: 1.3 });
    prop(ar, 'Crate_Medium_Closed', 300, 276, 16, 21);
    prop(ar, 'Crate_Large_Empty', 270, 278, 24, 29);
    areas.armory = ar;
  return { title, start };
};
