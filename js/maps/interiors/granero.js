/* Barn with the cow (House_Hay_1). Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.granero = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ------------------------------------------------ BARN
    title = 'Granero';
    const a = makeArea(448, 300, THEMES.granero, { frontDoorX: 118 });
    put(a, 'farm_tools', 44, 96, { foot: 0.2 });
    put(a, 'milk', 96, 88);
    put(a, 'milk', 118, 92, { flipX: true });
    put(a, 'wheelbarrow', 72, 186);
    prop(a, 'HayStack_2', 36, 274, 29, 32);
    prop(a, 'HayStack_2', 76, 280, 29, 32);
    prop(a, 'Sack_3', 178, 86, 16, 14);
    prop(a, 'Barrel_Small_Empty', 28, 136, 16, 20);

    // Cow pen on the right: back wall + hay-bale side + a fence row; the cow never leaves it
    const PEN_L = 238, PEN_B = 184;
    a.rects.push(R(PEN_L + 14, WALL + 6, 448 - SIDE - PEN_L - 18, PEN_B - WALL - 30, 0xd9b44a, 0.28));
    prop(a, 'HayStack_2', PEN_L, 104, 29, 32);
    prop(a, 'HayStack_2', PEN_L, 146, 29, 32);
    prop(a, 'HayStack_2', PEN_L, 186, 29, 32);
    put(a, 'fence', 403, PEN_B, { solid: false });
    put(a, 'fence', 292, PEN_B, { solid: false });
    put(a, 'fence', 360, PEN_B, { solid: false });
    a.colliders.push({ x: PEN_L - 20, y: WALL, w: 40, h: PEN_B - WALL });
    a.colliders.push({ x: PEN_L, y: PEN_B - 14, w: 448 - SIDE - PEN_L, h: 14 });
    put(a, 'trough', 398, 106, { solid: false });
    a.actors.push({ type: 'cow', x0: 284, x1: 352, y: 146 });
    areas.main = a;
  return { title, start };
};
