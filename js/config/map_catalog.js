/* Practice-map editor data: asset catalog, hitbox metadata, default/random meadow layouts and stored map config. */

// ==========================================
// 1.4 MAP CONFIGURATION & 41 ASSETS CATALOG (ASSETS/MAP)
// ==========================================
const MAP_ASSETS_CATALOG = [
  // EDIFICIOS (Buildings)
  { key: 'House_Hay_1', file: 'House_Hay_1.png', w: 88, h: 103, cat: 'buildings', name: 'Casa de Paja 1' },
  { key: 'House_Hay_2', file: 'House_Hay_2.png', w: 157, h: 112, cat: 'buildings', name: 'Casa de Paja 2' },
  { key: 'House_Hay_3', file: 'House_Hay_3.png', w: 180, h: 128, cat: 'buildings', name: 'Gran Casa Hay 3' },
  { key: 'House_Hay_4_Purple', file: 'House_Hay_4_Purple.png', w: 128, h: 128, cat: 'buildings', name: 'Mansión Real Púrpura' },
  { key: 'CityWall_Gate_1', file: 'CityWall_Gate_1.png', w: 80, h: 96, cat: 'buildings', name: 'Portón de Muralla' },
  { key: 'Well_Hay_1', file: 'Well_Hay_1.png', w: 56, h: 75, cat: 'buildings', name: 'Pozo de Agua' },

  // ÁRBOLES & PLANTAS (Trees & Foliage)
  { key: 'Tree_Emerald_1', file: 'Tree_Emerald_1.png', w: 64, h: 63, cat: 'trees', name: 'Árbol Esmeralda 1' },
  { key: 'Tree_Emerald_2', file: 'Tree_Emerald_2.png', w: 46, h: 63, cat: 'trees', name: 'Árbol Esmeralda 2' },
  { key: 'Tree_Emerald_3', file: 'Tree_Emerald_3.png', w: 52, h: 92, cat: 'trees', name: 'Gran Roble 3' },
  { key: 'Tree_Emerald_4', file: 'Tree_Emerald_4.png', w: 48, h: 93, cat: 'trees', name: 'Pino Imperial 4' },
  { key: 'Bush_Emerald_1', file: 'Bush_Emerald_1.png', w: 40, h: 29, cat: 'trees', name: 'Arbusto Esmeralda 1' },
  { key: 'Bush_Emerald_2', file: 'Bush_Emerald_2.png', w: 48, h: 16, cat: 'trees', name: 'Arbusto Ancho 2' },
  { key: 'Bush_Emerald_3', file: 'Bush_Emerald_3.png', w: 28, h: 28, cat: 'trees', name: 'Arbusto Esmeralda 3' },
  { key: 'Bush_Emerald_4', file: 'Bush_Emerald_4.png', w: 16, h: 28, cat: 'trees', name: 'Arbusto Fino 4' },
  { key: 'Bush_Emerald_5', file: 'Bush_Emerald_5.png', w: 14, h: 14, cat: 'trees', name: 'Arbusto Pequeño 5' },
  { key: 'Bush_Emerald_6', file: 'Bush_Emerald_6.png', w: 15, h: 10, cat: 'trees', name: 'Arbusto Pequeño 6' },
  { key: 'Bush_Emerald_7', file: 'Bush_Emerald_7.png', w: 12, h: 9, cat: 'trees', name: 'Hierba Pequeña 7' },
  { key: 'Chopped_Tree_1', file: 'Chopped_Tree_1.png', w: 32, h: 31, cat: 'trees', name: 'Tronco Cortado' },
  { key: 'Plant_2', file: 'Plant_2.png', w: 15, h: 11, cat: 'trees', name: 'Planta Silvestre' },

  // ROCAS (Rocks)
  { key: 'Rock_Brown_1', file: 'Rock_Brown_1.png', w: 28, h: 13, cat: 'rocks', name: 'Roca Café Plana' },
  { key: 'Rock_Brown_2', file: 'Rock_Brown_2.png', w: 15, h: 29, cat: 'rocks', name: 'Roca Café Alta' },
  { key: 'Rock_Brown_4', file: 'Rock_Brown_4.png', w: 27, h: 26, cat: 'rocks', name: 'Roca Café Mediana' },
  { key: 'Rock_Brown_6', file: 'Rock_Brown_6.png', w: 14, h: 13, cat: 'rocks', name: 'Roca Café Pequeña' },
  { key: 'Rock_Brown_9', file: 'Rock_Brown_9.png', w: 9, h: 11, cat: 'rocks', name: 'Piedra Diminuta' },

  // MUEBLES & PROPS (Furniture & Scenery Props)
  { key: 'Barrel_Small_Empty', file: 'Barrel_Small_Empty.png', w: 16, h: 20, cat: 'props', name: 'Barril de Madera' },
  { key: 'Basket_Empty', file: 'Basket_Empty.png', w: 22, h: 17, cat: 'props', name: 'Cesta Vacía' },
  { key: 'Bench_1', file: 'Bench_1.png', w: 14, h: 30, cat: 'props', name: 'Banco Largo' },
  { key: 'Bench_3', file: 'Bench_3.png', w: 14, h: 14, cat: 'props', name: 'Banco Pequeño' },
  { key: 'BulletinBoard_1', file: 'BulletinBoard_1.png', w: 44, h: 42, cat: 'props', name: 'Tablón de Anuncios' },
  { key: 'Crate_Large_Empty', file: 'Crate_Large_Empty.png', w: 24, h: 29, cat: 'props', name: 'Cajón Grande' },
  { key: 'Crate_Medium_Closed', file: 'Crate_Medium_Closed.png', w: 16, h: 21, cat: 'props', name: 'Cajón Cerrado' },
  { key: 'Crate_Water_1', file: 'Crate_Water_1.png', w: 30, h: 22, cat: 'props', name: 'Caja con Agua' },
  { key: 'HayStack_2', file: 'HayStack_2.png', w: 29, h: 32, cat: 'props', name: 'Pajar de Heno' },
  { key: 'Sack_3', file: 'Sack_3.png', w: 16, h: 14, cat: 'props', name: 'Saco de Harina' },
  { key: 'Sign_1', file: 'Sign_1.png', w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 1' },
  { key: 'Sign_2', file: 'Sign_2.png', w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 2' },
  { key: 'Table_Medium_1', file: 'Table_Medium_1.png', w: 42, h: 39, cat: 'props', name: 'Mesa de Madera' },
  { key: 'Banner_Stick_1_Purple', file: 'Banner_Stick_1_Purple.png', w: 24, h: 59, cat: 'props', name: 'Estandarte Púrpura' },

  // LUCES & FUEGO (Lights & Fire)
  { key: 'Animation_Campfire', file: 'Animation_Campfire.png', w: 32, h: 32, cat: 'lights', name: 'Hoguera de Aldea' },
  { key: 'Fireplace_1', file: 'Fireplace_1.png', w: 30, h: 26, cat: 'lights', name: 'Chimenea de Piedra' },
  { key: 'LampPost_3', file: 'LampPost_3.png', w: 46, h: 62, cat: 'lights', name: 'Farol de Hierro' }
];

// Pixel-perfect collision metadata for each asset (guarantees hitboxes never spill over)
const MAP_ASSET_METADATA = {
  'House_Hay_1': {
    w: 88, h: 103, cat: 'buildings', name: 'Casa de Paja 1',
    // Single solid wall base. The doorway is NOT left open any more: with it open the
    // player could walk straight through the house. Doors are entered via enterInterior().
    // Footprint starts 30px below the roof ridge: you can walk behind the top of the roof
    // but not "inside" the house.
    boxes: [
      { offX: 5, offY: 30, hitW: 78, hitH: 73 }
    ],
    hitW: 78, hitH: 45, hitOffsetY: 58, hitOffsetX: 5
  },
  'House_Hay_2': {
    w: 157, h: 112, cat: 'buildings', name: 'Casa de Paja 2',
    // L-shaped house: dual foundations (left wing wall + right wing ground floor)
    boxes: [
      { offX: 4, offY: 26, hitW: 150, hitH: 52 },
      { offX: 56, offY: 78, hitW: 98, hitH: 34 }
    ],
    hitW: 148, hitH: 30, hitOffsetY: 82, hitOffsetX: 5
  },
  'House_Hay_3': {
    w: 180, h: 128, cat: 'buildings', name: 'Gran Casa Hay 3',
    // Left stone stairs (offX: 0..46) are completely open for climbing up to the terrace
    boxes: [
      { offX: 24, offY: 28, hitW: 152, hitH: 52 },
      { offX: 46, offY: 76, hitW: 30, hitH: 52 },
      { offX: 76, offY: 80, hitW: 98, hitH: 48 }
    ],
    hitW: 128, hitH: 50, hitOffsetY: 78, hitOffsetX: 46
  },
  'House_Hay_4_Purple': {
    w: 128, h: 128, cat: 'buildings', name: 'Mansión Real Púrpura',
    // Market stall (left) + ground floor wall (right) form one continuous solid base
    boxes: [
      { offX: 8, offY: 30, hitW: 116, hitH: 60 },
      { offX: 8, offY: 86, hitW: 62, hitH: 42 },
      { offX: 70, offY: 92, hitW: 54, hitH: 36 }
    ],
    hitW: 116, hitH: 40, hitOffsetY: 88, hitOffsetX: 8
  },
  'CityWall_Gate_1': { w: 80, h: 96, cat: 'buildings', name: 'Portón de Muralla', hitW: 76, hitH: 44, hitOffsetY: 52, hitOffsetX: 2 },
  'Well_Hay_1': { w: 56, h: 75, cat: 'buildings', name: 'Pozo de Agua', hitW: 46, hitH: 26, hitOffsetY: 48, hitOffsetX: 5 },

  'Tree_Emerald_1': { w: 64, h: 63, cat: 'trees', name: 'Árbol Esmeralda 1', hitW: 20, hitH: 12, hitOffsetY: 51, hitOffsetX: 22 },
  'Tree_Emerald_2': { w: 46, h: 63, cat: 'trees', name: 'Árbol Esmeralda 2', hitW: 18, hitH: 12, hitOffsetY: 51, hitOffsetX: 14 },
  'Tree_Emerald_3': { w: 52, h: 92, cat: 'trees', name: 'Gran Roble 3', hitW: 20, hitH: 14, hitOffsetY: 78, hitOffsetX: 16 },
  'Tree_Emerald_4': { w: 48, h: 93, cat: 'trees', name: 'Pino Imperial 4', hitW: 18, hitH: 14, hitOffsetY: 79, hitOffsetX: 15 },
  'Bush_Emerald_1': { w: 40, h: 29, cat: 'trees', name: 'Arbusto Esmeralda 1', hitW: 34, hitH: 18, hitOffsetY: 11, hitOffsetX: 3 },
  'Bush_Emerald_2': { w: 48, h: 16, cat: 'trees', name: 'Arbusto Ancho 2', hitW: 42, hitH: 12, hitOffsetY: 4, hitOffsetX: 3 },
  'Bush_Emerald_3': { w: 28, h: 28, cat: 'trees', name: 'Arbusto Esmeralda 3', hitW: 24, hitH: 16, hitOffsetY: 12, hitOffsetX: 2 },
  'Bush_Emerald_4': { w: 16, h: 28, cat: 'trees', name: 'Arbusto Fino 4', hitW: 14, hitH: 14, hitOffsetY: 14, hitOffsetX: 1 },
  'Bush_Emerald_5': { w: 14, h: 14, cat: 'trees', name: 'Arbusto Pequeño 5', hitW: 12, hitH: 10, hitOffsetY: 4, hitOffsetX: 1 },
  'Bush_Emerald_6': { w: 15, h: 10, cat: 'trees', name: 'Arbusto Pequeño 6', hitW: 12, hitH: 8, hitOffsetY: 2, hitOffsetX: 1 },
  'Bush_Emerald_7': { w: 12, h: 9, cat: 'trees', name: 'Hierba Pequeña 7', hitW: 10, hitH: 7, hitOffsetY: 2, hitOffsetX: 1 },
  'Chopped_Tree_1': { w: 32, h: 31, cat: 'trees', name: 'Tronco Cortado', hitW: 26, hitH: 18, hitOffsetY: 13, hitOffsetX: 3 },
  'Plant_2': { w: 15, h: 11, cat: 'trees', name: 'Planta Silvestre', hitW: 12, hitH: 8, hitOffsetY: 3, hitOffsetX: 1 },

  'Rock_Brown_1': { w: 28, h: 13, cat: 'rocks', name: 'Roca Café Plana', hitW: 26, hitH: 11, hitOffsetY: 2, hitOffsetX: 1 },
  'Rock_Brown_2': { w: 15, h: 29, cat: 'rocks', name: 'Roca Café Alta', hitW: 13, hitH: 18, hitOffsetY: 11, hitOffsetX: 1 },
  'Rock_Brown_4': { w: 27, h: 26, cat: 'rocks', name: 'Roca Café Mediana', hitW: 24, hitH: 18, hitOffsetY: 8, hitOffsetX: 2 },
  'Rock_Brown_6': { w: 14, h: 13, cat: 'rocks', name: 'Roca Café Pequeña', hitW: 12, hitH: 10, hitOffsetY: 3, hitOffsetX: 1 },
  'Rock_Brown_9': { w: 9, h: 11, cat: 'rocks', name: 'Piedra Diminuta', hitW: 8, hitH: 8, hitOffsetY: 3, hitOffsetX: 1 },

  'Barrel_Small_Empty': { w: 16, h: 20, cat: 'props', name: 'Barril de Madera', hitW: 14, hitH: 14, hitOffsetY: 6, hitOffsetX: 1 },
  'Basket_Empty': { w: 22, h: 17, cat: 'props', name: 'Cesta Vacía', hitW: 18, hitH: 12, hitOffsetY: 5, hitOffsetX: 2 },
  'Bench_1': { w: 14, h: 30, cat: 'props', name: 'Banco Largo', hitW: 12, hitH: 24, hitOffsetY: 6, hitOffsetX: 1 },
  'Bench_3': { w: 14, h: 14, cat: 'props', name: 'Banco Pequeño', hitW: 12, hitH: 12, hitOffsetY: 2, hitOffsetX: 1 },
  'BulletinBoard_1': { w: 44, h: 42, cat: 'props', name: 'Tablón de Anuncios', hitW: 38, hitH: 18, hitOffsetY: 24, hitOffsetX: 3 },
  'Crate_Large_Empty': { w: 24, h: 29, cat: 'props', name: 'Cajón Grande', hitW: 22, hitH: 20, hitOffsetY: 9, hitOffsetX: 1 },
  'Crate_Medium_Closed': { w: 16, h: 21, cat: 'props', name: 'Cajón Cerrado', hitW: 14, hitH: 14, hitOffsetY: 7, hitOffsetX: 1 },
  'Crate_Water_1': { w: 30, h: 22, cat: 'props', name: 'Caja con Agua', hitW: 26, hitH: 16, hitOffsetY: 6, hitOffsetX: 2 },
  'HayStack_2': { w: 29, h: 32, cat: 'props', name: 'Pajar de Heno', hitW: 24, hitH: 20, hitOffsetY: 12, hitOffsetX: 2 },
  'Sack_3': { w: 16, h: 14, cat: 'props', name: 'Saco de Harina', hitW: 14, hitH: 12, hitOffsetY: 2, hitOffsetX: 1 },
  'Sign_1': { w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 1', hitW: 12, hitH: 12, hitOffsetY: 10, hitOffsetX: 6 },
  'Sign_2': { w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 2', hitW: 12, hitH: 12, hitOffsetY: 10, hitOffsetX: 6 },
  'Table_Medium_1': { w: 42, h: 39, cat: 'props', name: 'Mesa de Madera', hitW: 38, hitH: 24, hitOffsetY: 15, hitOffsetX: 2 },
  'Banner_Stick_1_Purple': { w: 24, h: 59, cat: 'props', name: 'Estandarte Púrpura', hitW: 12, hitH: 14, hitOffsetY: 45, hitOffsetX: 6 },

  'Animation_Campfire': { w: 32, h: 32, cat: 'lights', name: 'Hoguera de Aldea', hitW: 26, hitH: 18, hitOffsetY: 14, hitOffsetX: 3 },
  'Fireplace_1': { w: 30, h: 26, cat: 'lights', name: 'Chimenea de Piedra', hitW: 28, hitH: 20, hitOffsetY: 6, hitOffsetX: 1 },
  'LampPost_3': { w: 46, h: 62, cat: 'lights', name: 'Farol de Hierro', hitW: 14, hitH: 14, hitOffsetY: 48, hitOffsetX: 16 }
};

/**
 * Calculate pixel-tight collision box for any placed prop or object
 * Guarantees hitbox matches the solid foundation without spilling over the sprite pixels
 */
function calculateFitHitboxStatic(prop) {
  if (!prop) return null;
  const key = prop.assetKey || prop.type;
  if (key === 'player_spawn' || key === 'enemy_spawn') return null;

  const meta = MAP_ASSET_METADATA[key];
  const originX = prop.originX !== undefined ? prop.originX : 0.5;
  const originY = prop.originY !== undefined ? prop.originY : 1;

  const w = prop.w || (meta ? meta.w : 32);
  const h = prop.h || (meta ? meta.h : 32);

  const left = Math.round(prop.x - originX * w);
  const top = Math.round(prop.y - originY * h);

  let hitW, hitH, hitX, hitY;

  if (meta) {
    hitW = meta.hitW;
    hitH = meta.hitH;
    hitX = left + meta.hitOffsetX;
    hitY = top + meta.hitOffsetY;
  } else {
    const nameLower = (prop.name || key).toLowerCase();
    if (nameLower.includes('tree') || nameLower.includes('roble') || nameLower.includes('pino')) {
      hitW = Math.max(16, Math.round(w * 0.42));
      hitH = Math.max(12, Math.round(h * 0.20));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    } else if (nameLower.includes('house') || nameLower.includes('casa') || nameLower.includes('wall') || nameLower.includes('gate')) {
      hitW = Math.max(24, Math.round(w * 0.88));
      hitH = Math.max(20, Math.round(h * 0.44));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    } else {
      hitW = Math.max(10, Math.round(w * 0.85));
      hitH = Math.max(10, Math.round(h * 0.60));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    }
  }

  // Strict clamp ensuring zero spill over
  hitX = Math.max(left, Math.min(hitX, left + w - hitW));
  hitY = Math.max(top, Math.min(hitY, top + h - hitH));
  hitW = Math.min(hitW, w);
  hitH = Math.min(hitH, h);

  return {
    x: hitX,
    y: hitY,
    w: hitW,
    h: hitH,
    type: 'solid',
    source: prop.id
  };
}

/**
 * Pre-made default medieval village on green meadow grass
 */
function generateDefaultMeadowObjects() {
  return [
    // Player Spawn in Central Courtyard
    { id: 'player_spawn', type: 'player_spawn', name: 'Inicio Jugador', x: 700, y: 740, w: 24, h: 24 },

    // Central Plaza: Campfire, Well, Benches, Board, Lanterns
    { id: 'prop_campfire', type: 'Animation_Campfire', assetKey: 'Animation_Campfire', name: 'Hoguera Central', x: 700, y: 720, w: 32, h: 32, originX: 0.5, originY: 1 },
    { id: 'prop_well', type: 'Well_Hay_1', assetKey: 'Well_Hay_1', name: 'Pozo del Pueblo', x: 620, y: 700, w: 56, h: 75, originX: 0.5, originY: 1 },
    { id: 'prop_bench_1', type: 'Bench_1', assetKey: 'Bench_1', name: 'Banco Este', x: 760, y: 720, w: 14, h: 30, originX: 0.5, originY: 1 },
    { id: 'prop_bench_2', type: 'Bench_3', assetKey: 'Bench_3', name: 'Banco Sur', x: 670, y: 750, w: 14, h: 14, originX: 0.5, originY: 1 },
    { id: 'prop_board', type: 'BulletinBoard_1', assetKey: 'BulletinBoard_1', name: 'Tablón del Pueblo', x: 780, y: 680, w: 44, h: 42, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_1', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Plaza 1', x: 630, y: 640, w: 46, h: 62, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_2', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Plaza 2', x: 770, y: 640, w: 46, h: 62, originX: 0.5, originY: 1 },

    // North Manor & Farm
    { id: 'prop_house_north', type: 'House_Hay_3', assetKey: 'House_Hay_3', name: 'Gran Casa del Jefe', x: 700, y: 440, w: 180, h: 128, originX: 0.5, originY: 1 },
    { id: 'prop_banner_n1', type: 'Banner_Stick_1_Purple', assetKey: 'Banner_Stick_1_Purple', name: 'Estandarte Norte 1', x: 600, y: 440, w: 24, h: 59, originX: 0.5, originY: 1 },
    { id: 'prop_banner_n2', type: 'Banner_Stick_1_Purple', assetKey: 'Banner_Stick_1_Purple', name: 'Estandarte Norte 2', x: 800, y: 440, w: 24, h: 59, originX: 0.5, originY: 1 },
    { id: 'prop_crate_n1', type: 'Crate_Large_Empty', assetKey: 'Crate_Large_Empty', name: 'Cajón Granero', x: 795, y: 460, w: 24, h: 29, originX: 0.5, originY: 1 },
    { id: 'prop_barrel_n1', type: 'Barrel_Small_Empty', assetKey: 'Barrel_Small_Empty', name: 'Barril Entrada', x: 815, y: 460, w: 16, h: 20, originX: 0.5, originY: 1 },

    // Northwest Cottage
    { id: 'prop_house_nw', type: 'House_Hay_1', assetKey: 'House_Hay_1', name: 'Cabaña de Paja', x: 440, y: 480, w: 88, h: 103, originX: 0.5, originY: 1 },
    { id: 'prop_table_nw', type: 'Table_Medium_1', assetKey: 'Table_Medium_1', name: 'Mesa Rústica', x: 505, y: 530, w: 42, h: 39, originX: 0.5, originY: 1 },
    { id: 'prop_bench_nw', type: 'Bench_3', assetKey: 'Bench_3', name: 'Taburete', x: 535, y: 530, w: 14, h: 14, originX: 0.5, originY: 1 },

    // Northeast Royal Villa
    { id: 'prop_house_ne', type: 'House_Hay_4_Purple', assetKey: 'House_Hay_4_Purple', name: 'Mansión Real Púrpura', x: 960, y: 480, w: 128, h: 128, originX: 0.5, originY: 1 },
    { id: 'prop_hay_ne', type: 'HayStack_2', assetKey: 'HayStack_2', name: 'Pajar Real', x: 1040, y: 520, w: 29, h: 32, originX: 0.5, originY: 1 },

    // Southwest Farmstead
    { id: 'prop_house_sw', type: 'House_Hay_2', assetKey: 'House_Hay_2', name: 'Casona de Campo', x: 420, y: 880, w: 157, h: 112, originX: 0.5, originY: 1 },
    { id: 'prop_chopped', type: 'Chopped_Tree_1', assetKey: 'Chopped_Tree_1', name: 'Talar Leña', x: 530, y: 880, w: 32, h: 31, originX: 0.5, originY: 1 },
    { id: 'prop_fireplace', type: 'Fireplace_1', assetKey: 'Fireplace_1', name: 'Horno de Campo', x: 320, y: 890, w: 30, h: 26, originX: 0.5, originY: 1 },
    { id: 'prop_crate_sw1', type: 'Crate_Water_1', assetKey: 'Crate_Water_1', name: 'Agua para Cultivos', x: 350, y: 920, w: 30, h: 22, originX: 0.5, originY: 1 },
    { id: 'prop_sack_sw', type: 'Sack_3', assetKey: 'Sack_3', name: 'Sacos de Cereal', x: 380, y: 925, w: 16, h: 14, originX: 0.5, originY: 1 },

    // South Gate & Wall
    { id: 'prop_gate_south', type: 'CityWall_Gate_1', assetKey: 'CityWall_Gate_1', name: 'Portón Sur', x: 700, y: 1100, w: 80, h: 96, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_s1', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Portón 1', x: 650, y: 1100, w: 46, h: 62, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_s2', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Portón 2', x: 750, y: 1100, w: 46, h: 62, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (North)
    { id: 'tree_n1', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Norte 1', x: 360, y: 220, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_n2', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Norte 2', x: 520, y: 200, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_n3', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Norte 3', x: 700, y: 180, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_n4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Norte 4', x: 880, y: 200, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_n5', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Norte 5', x: 1040, y: 220, w: 52, h: 92, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (West)
    { id: 'tree_w1', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Oeste 1', x: 220, y: 380, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_w2', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Oeste 2', x: 180, y: 540, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_w3', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Oeste 3', x: 230, y: 700, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_w4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Oeste 4', x: 180, y: 880, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_w5', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Oeste 5', x: 220, y: 1060, w: 52, h: 92, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (East)
    { id: 'tree_e1', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Este 1', x: 1180, y: 360, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_e2', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Este 2', x: 1220, y: 520, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_e3', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Este 3', x: 1170, y: 700, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_e4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Este 4', x: 1220, y: 880, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_e5', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Este 5', x: 1180, y: 1060, w: 48, h: 93, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (South)
    { id: 'tree_s1', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Sur 1', x: 380, y: 1240, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_s2', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Sur 2', x: 540, y: 1260, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_s3', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Sur 3', x: 860, y: 1260, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_s4', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Sur 4', x: 1020, y: 1240, w: 48, h: 93, originX: 0.5, originY: 1 },

    // Bushes & Foliage
    { id: 'bush_1', type: 'Bush_Emerald_1', assetKey: 'Bush_Emerald_1', name: 'Arbusto 1', x: 310, y: 460, w: 40, h: 29, originX: 0.5, originY: 1 },
    { id: 'bush_2', type: 'Bush_Emerald_2', assetKey: 'Bush_Emerald_2', name: 'Arbusto 2', x: 840, y: 460, w: 48, h: 16, originX: 0.5, originY: 1 },
    { id: 'bush_3', type: 'Bush_Emerald_3', assetKey: 'Bush_Emerald_3', name: 'Arbusto 3', x: 480, y: 660, w: 28, h: 28, originX: 0.5, originY: 1 },
    { id: 'bush_4', type: 'Bush_Emerald_4', assetKey: 'Bush_Emerald_4', name: 'Arbusto 4', x: 920, y: 660, w: 16, h: 28, originX: 0.5, originY: 1 },
    { id: 'bush_5', type: 'Bush_Emerald_5', assetKey: 'Bush_Emerald_5', name: 'Hierba 5', x: 620, y: 820, w: 14, h: 14, originX: 0.5, originY: 1 },
    { id: 'bush_6', type: 'Bush_Emerald_6', assetKey: 'Bush_Emerald_6', name: 'Hierba 6', x: 780, y: 820, w: 15, h: 10, originX: 0.5, originY: 1 },

    // Rocks
    { id: 'rock_1', type: 'Rock_Brown_1', assetKey: 'Rock_Brown_1', name: 'Roca Café 1', x: 340, y: 620, w: 28, h: 13, originX: 0.5, originY: 1 },
    { id: 'rock_2', type: 'Rock_Brown_4', assetKey: 'Rock_Brown_4', name: 'Roca Café 2', x: 1050, y: 640, w: 27, h: 26, originX: 0.5, originY: 1 },
    { id: 'rock_3', type: 'Rock_Brown_2', assetKey: 'Rock_Brown_2', name: 'Roca Café 3', x: 580, y: 1060, w: 15, h: 29, originX: 0.5, originY: 1 },
    { id: 'rock_4', type: 'Rock_Brown_6', assetKey: 'Rock_Brown_6', name: 'Roca Café 4', x: 820, y: 1060, w: 14, h: 13, originX: 0.5, originY: 1 }
  ];
}

/**
 * Generate pixel-fitted solid collision boxes for every prop in objects
 */
function generateDefaultMeadowObstacles(objects) {
  const colliders = [];
  objects.forEach(obj => {
    if (obj.type === 'player_spawn' || obj.type === 'enemy_spawn') return;
    const hit = calculateFitHitboxStatic(obj);
    if (hit) colliders.push(hit);
  });
  return colliders;
}

const DEFAULT_MEADOW_ENEMY_SPAWNS = [
  { id: 'spawn_north_forest', name: 'Bosque Norte', x: 700, y: 300, enemyType: 'soldier', minWave: 1, radius: 48, active: true },
  { id: 'spawn_east_path', name: 'Sendero Este', x: 1080, y: 720, enemyType: 'clash', minWave: 1, radius: 48, active: true },
  { id: 'spawn_south_gate', name: 'Muralla Sur', x: 700, y: 1180, enemyType: 'orc', minWave: 2, radius: 48, active: true },
  { id: 'spawn_west_clearing', name: 'Claro Oeste', x: 320, y: 720, enemyType: 'mixed', minWave: 2, radius: 48, active: true }
];

/**
 * Generates a randomized village & nature layout on the green grass meadow
 * with auto-generated pixel hitboxes for instant quick-play
 */
function generateRandomMeadowLayout(width = 1400, height = 1400) {
  const objects = [];
  const obstacles = [];
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  // 1. Safe central player spawn & campfire
  objects.push({
    id: 'player_spawn',
    type: 'player_spawn',
    name: 'Inicio Jugador',
    x: cx,
    y: cy + 30,
    w: 24,
    h: 24
  });

  const campfire = {
    id: `campfire_${Date.now()}`,
    type: 'Animation_Campfire',
    assetKey: 'Animation_Campfire',
    name: 'Hoguera de Campamento',
    x: cx,
    y: cy,
    w: 32,
    h: 32,
    originX: 0.5,
    originY: 1
  };
  objects.push(campfire);
  const campHit = calculateFitHitboxStatic(campfire);
  if (campHit) obstacles.push(campHit);

  const isNearCenter = (x, y, radius = 90) => Math.hypot(x - cx, y - cy) < radius;

  // 2. Random Houses (3 to 5)
  const houseKeys = ['House_Hay_1', 'House_Hay_2', 'House_Hay_3', 'House_Hay_4_Purple'];
  const numHouses = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numHouses; i++) {
    const key = houseKeys[i % houseKeys.length];
    const meta = MAP_ASSET_METADATA[key];
    const angle = (i / numHouses) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const dist = 240 + Math.random() * 180;
    const hx = Math.round(Math.max(120, Math.min(width - 120, cx + Math.cos(angle) * dist)));
    const hy = Math.round(Math.max(160, Math.min(height - 160, cy + Math.sin(angle) * dist)));

    const houseObj = {
      id: `house_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: hx,
      y: hy,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(houseObj);
    const hit = calculateFitHitboxStatic(houseObj);
    if (hit) obstacles.push(hit);
  }

  // 3. Stone Well
  const wellAngle = Math.random() * Math.PI * 2;
  const wx = Math.round(cx + Math.cos(wellAngle) * 90);
  const wy = Math.round(cy + Math.sin(wellAngle) * 90);
  const wellObj = {
    id: `well_${Date.now()}`,
    type: 'Well_Hay_1',
    assetKey: 'Well_Hay_1',
    name: 'Pozo del Pueblo',
    x: wx,
    y: wy,
    w: 56,
    h: 75,
    originX: 0.5,
    originY: 1
  };
  objects.push(wellObj);
  const wellHit = calculateFitHitboxStatic(wellObj);
  if (wellHit) obstacles.push(wellHit);

  // 4. Random Trees (26 to 34)
  const treeKeys = ['Tree_Emerald_1', 'Tree_Emerald_2', 'Tree_Emerald_3', 'Tree_Emerald_4'];
  const numTrees = 26 + Math.floor(Math.random() * 9);
  for (let i = 0; i < numTrees; i++) {
    const key = treeKeys[Math.floor(Math.random() * treeKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    let tx, ty;
    for (let attempts = 0; attempts < 10; attempts++) {
      tx = Math.round(80 + Math.random() * (width - 160));
      ty = Math.round(80 + Math.random() * (height - 160));
      if (!isNearCenter(tx, ty, 140)) break;
    }
    const treeObj = {
      id: `tree_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: tx,
      y: ty,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(treeObj);
    const hit = calculateFitHitboxStatic(treeObj);
    if (hit) obstacles.push(hit);
  }

  // 5. Random Rocks (8 to 12)
  const rockKeys = ['Rock_Brown_1', 'Rock_Brown_2', 'Rock_Brown_4', 'Rock_Brown_6', 'Rock_Brown_9'];
  const numRocks = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numRocks; i++) {
    const key = rockKeys[Math.floor(Math.random() * rockKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    let rx, ry;
    for (let attempts = 0; attempts < 10; attempts++) {
      rx = Math.round(70 + Math.random() * (width - 140));
      ry = Math.round(70 + Math.random() * (height - 140));
      if (!isNearCenter(rx, ry, 110)) break;
    }
    const rockObj = {
      id: `rock_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: rx,
      y: ry,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(rockObj);
    const hit = calculateFitHitboxStatic(rockObj);
    if (hit) obstacles.push(hit);
  }

  // 6. Random Village Props (12 to 16)
  const propKeys = ['Barrel_Small_Empty', 'Bench_1', 'Bench_3', 'Crate_Large_Empty', 'Crate_Medium_Closed', 'HayStack_2', 'LampPost_3', 'Table_Medium_1', 'Banner_Stick_1_Purple'];
  const numProps = 12 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numProps; i++) {
    const key = propKeys[Math.floor(Math.random() * propKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    const px = Math.round(90 + Math.random() * (width - 180));
    const py = Math.round(90 + Math.random() * (height - 180));
    const propObj = {
      id: `prop_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: px,
      y: py,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(propObj);
    const hit = calculateFitHitboxStatic(propObj);
    if (hit) obstacles.push(hit);
  }

  // 7. Enemy Spawns at 4 quadrants
  const enemySpawns = [
    { id: 'spawn_n', name: 'Norte', x: cx, y: cy - 350, enemyType: 'soldier', minWave: 1, radius: 48, active: true },
    { id: 'spawn_e', name: 'Este', x: cx + 380, y: cy, enemyType: 'clash', minWave: 1, radius: 48, active: true },
    { id: 'spawn_s', name: 'Sur', x: cx, y: cy + 380, enemyType: 'orc', minWave: 2, radius: 48, active: true },
    { id: 'spawn_w', name: 'Oeste', x: cx - 380, y: cy, enemyType: 'mixed', minWave: 2, radius: 48, active: true }
  ];

  return { objects, obstacles, enemySpawns };
}

const DEFAULT_MAP_OBJECTS = [];

const DEFAULT_MAP_OBSTACLES = [];

const DEFAULT_ENEMY_SPAWNS = DEFAULT_MEADOW_ENEMY_SPAWNS;

const MAP_CONFIG_STORAGE_KEY = 'CASTLEKNIGHT_MEADOW_MAP_V2';

function loadStoredMapData() {
  try {
    const raw = localStorage.getItem(MAP_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles : [],
          objects: Array.isArray(parsed.objects) ? parsed.objects : [],
          enemySpawns: Array.isArray(parsed.enemySpawns) ? parsed.enemySpawns : JSON.parse(JSON.stringify(DEFAULT_ENEMY_SPAWNS))
        };
      }
    }
  } catch (e) {
    console.warn('Error reading map config from localStorage:', e);
  }
  return {
    obstacles: [],
    objects: [],
    enemySpawns: JSON.parse(JSON.stringify(DEFAULT_ENEMY_SPAWNS))
  };
}

let MAP_OBSTACLES = [];
