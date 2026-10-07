/* Grocery store (House_Hay_4_Purple). Written with the kit from js/maps/layout_kit.js (areas are in area-local pixels). */

INTERIOR_LAYOUTS.tienda = function (kit) {
  const { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas } = kit;
  let title = 'Casa';
  let start = 'main';
    // ------------------------------------------------ GROCERY STORE
    title = 'Tienda de Víveres';
    const a = makeArea(400, 288, THEMES.tienda, { frontDoorX: 186 });
    put(a, 'shelf_food', 58, 92, { foot: 0.25 });
    put(a, 'shelf_jars', 142, 92, { foot: 0.25 });
    put(a, 'shelf_food', 342, 92, { foot: 0.25, flipX: true });
    // Shopkeeper behind the counter
    a.items.push({ key: 'npc3_villager', anim: 'npc3_idle', x: 246, baseY: 126, scale: 1.8 });
    put(a, 'shop_counter', 246, 166, { foot: 0.6 });
    a.colliders.push({ x: 188, y: 92, w: 116, h: 40 });
    put(a, 'veg_crates', 52, 150);
    put(a, 'veg_crates', 52, 186, { flipX: true });
    put(a, 'apple_barrel', 112, 196);
    put(a, 'apple_barrel', 36, 244);
    prop(a, 'Sack_3', 344, 250, 16, 14);
    prop(a, 'Sack_3', 366, 256, 16, 14);
    prop(a, 'Sack_3', 356, 240, 16, 14);
    prop(a, 'Crate_Medium_Closed', 366, 196, 16, 21);
    prop(a, 'Basket_Empty', 300, 262, 22, 17);
    rug(a, 'rug_green', 200, 236);
    areas.main = a;
  return { title, start };
};
