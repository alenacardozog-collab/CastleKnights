/* Family home with two floors (House_Hay_3 and any unknown house). Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.casa = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ------------------------------------------------ FAMILY HOME (two floors)
    title = 'Casa';
    const t = THEMES.casa;

    // Ground floor: kitchen, fireplace, dining table and the staircase
    const g = makeArea(400, 288, t, { frontDoorX: 186 });
    windowAt(g, 128);
    put(g, 'kitchen', 60, 96, { foot: 0.5 });
    put(g, 'fireplace', 200, 92, { foot: 0.3, flame: true });
    light(g, 200, 104, 56, 0xff8a3c, 0.18);
    put(g, 'bookshelf', 280, 94, { foot: 0.25 });
    rug(g, 'rug_red', 196, 176);
    prop(g, 'Table_Medium_1', 82, 226, 42, 39);
    put(g, 'stool', 40, 216);
    put(g, 'stool', 124, 216);
    prop(g, 'Plant_2', 24, 272, 15, 11);
    prop(g, 'Basket_Empty', 290, 266, 22, 17);
    // Staircase against the right wall; walk UP into its first step to climb
    put(g, 'stairs', 350, 152, { solid: false });
    g.colliders.push({ x: 316, y: WALL, w: 8, h: 86 });
    g.colliders.push({ x: 376, y: WALL, w: 14, h: 86 });
    g.exits.push({ x: 324, y: 132, w: 52, h: 28, key: 'up', to: 'upper', arrive: { x: 390, y: 244 }, hint: '▲ Subir' });
    areas.main = g;

    // Upper floor: two bedrooms (his / hers) opening onto a landing
    const UW = 448, UH = 336, PART_Y = 180, PART_H = 46, MID = 224, D1 = 122, D2 = 326;
    const u = makeArea(UW, UH, t, {});
    windowAt(u, 150);
    windowAt(u, 288);
    // wall between the two bedrooms
    u.items.push({ baseY: PART_Y + PART_H - 1, rects: [R(MID - 5, WALL - 6, 10, PART_Y + PART_H - WALL + 6, t.wallDark), R(MID - 3, WALL - 6, 2, PART_Y + PART_H - WALL + 6, t.trim)] });
    u.colliders.push({ x: MID - 5, y: 0, w: 10, h: PART_Y + PART_H });
    // wall between bedrooms and landing, with one doorway per room
    [[SIDE, D1 - DOORWAY / 2], [D1 + DOORWAY / 2, D2 - DOORWAY / 2], [D2 + DOORWAY / 2, UW - SIDE]].forEach(([x0, x1]) => {
      u.items.push({ baseY: PART_Y + PART_H, wallTex: t.wallTex, x0, x1, y: PART_Y, h: PART_H });
      u.colliders.push({ x: x0, y: PART_Y + 12, w: x1 - x0, h: PART_H - 12 });
    });
    [D1, D2].forEach(dx => {
      // door frame + the pushable door itself
      u.rects.push(R(dx - DOORWAY / 2, PART_Y, DOORWAY, PART_H, 0x241408));
      u.doors.push({ x: dx, y: PART_Y + PART_H, w: DOORWAY, top: PART_Y + 12 });
    });

    // His room (left): straight bed with a blue blanket, weapon rack, wardrobe, blue rug
    rug(u, 'rug_blue', 104, 134);
    put(u, 'wardrobe', 42, 96, { foot: 0.25 });
    put(u, 'weapon_rack', 104, 78, { foot: 0.25 });
    put(u, 'bed_man', 188, 152, { foot: 0.8 });
    prop(u, 'Crate_Medium_Closed', 28, 172, 16, 21);

    // Her room (right): bed with a pink blanket, vanity with mirror, wardrobe, flowers, pink rug
    rug(u, 'rug_pink', 344, 134);
    put(u, 'wardrobe', 406, 96, { foot: 0.25 });
    put(u, 'vanity', 344, 80, { foot: 0.3 });
    put(u, 'bed_woman', 258, 152, { foot: 0.8 });
    prop(u, 'Plant_2', 420, 172, 15, 11);
    prop(u, 'Basket_Empty', 388, 174, 22, 17);

    // Landing: stairwell on the right, a few things along the wall
    rug(u, 'rug_red', 180, 276, { scale: 1.3 });
    prop(u, 'Plant_2', 26, 318, 15, 11);
    prop(u, 'Barrel_Small_Empty', 28, 262, 16, 20);
    const SX = 352, SY = 262, SW = 76, SH = 54;
    u.rects.push(R(SX - 4, SY - 4, SW + 8, SH + 8, t.trim));
    u.rects.push(R(SX, SY, SW, SH, 0x1c120b));
    for (let i = 0; i < 7; i++) u.rects.push(R(SX + 3, SY + 3 + i * 7, SW - 6 - i * 5, 5, i % 2 ? 0x6b4526 : 0x8c5d33));
    u.colliders.push({ x: SX - 4, y: SY + 18, w: SW + 8, h: SH - 8 });
    u.exits.push({ x: SX, y: SY - 16, w: SW, h: 30, key: 'down', to: 'main', arrive: { x: 350, y: 170 }, hint: '▼ Bajar' });
    u.spawn = { x: 390, y: 244 };
    areas.upper = u;
  return { title, start };
};
