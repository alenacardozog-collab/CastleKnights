/* Tavern (House_Hay_2). Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.bar = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ------------------------------------------------ TAVERN
    title = 'Taberna';
    const a = makeArea(400, 288, THEMES.bar, { frontDoorX: 186 });
    put(a, 'bar_shelf', 200, WALL + 6, { solid: false });
    put(a, 'keg', 46, 108);
    put(a, 'keg', 354, 108, { flipX: true });
    // Bartender stands between the shelf and the counter
    a.items.push({ key: 'npc2_villager', anim: 'npc2_idle', x: 200, baseY: 104, scale: 1.8 });
    put(a, 'bar_counter', 140, 140, { foot: 0.62 });
    put(a, 'bar_counter', 260, 140, { foot: 0.62, flipX: true });
    a.colliders.push({ x: 80, y: 84, w: 240, h: 26 }); // nobody walks behind the bar
    put(a, 'stool', 150, 162);
    put(a, 'stool', 250, 162);
    [[92, 232], [308, 232]].forEach(([tx, ty]) => {
      put(a, 'round_table', tx, ty);
      put(a, 'stool', tx - 38, ty - 6);
      put(a, 'stool', tx + 38, ty - 6);
    });
    rug(a, 'rug_red', 200, 226, { scale: 1.2 });
    prop(a, 'Banner_Stick_1_Purple', 26, 190, 24, 59, false);
    prop(a, 'Banner_Stick_1_Purple', 374, 190, 24, 59, false);
    areas.main = a;
  return { title, start };
};
