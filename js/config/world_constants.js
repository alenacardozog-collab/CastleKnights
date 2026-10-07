/* Constants of the campaign world: which house is what, asset key lists, sprite sheets, light tints and map exits. */

// ==========================================
// INTERIOR LAYOUTS (tavern / two-floor house / grocery store / barn)
// ==========================================
/**
 * Which interior belongs to each house of the campaign village.
 */
const HOUSE_INTERIORS = {
  House_Hay_2: 'bar',          // L-shaped house (south)      -> tavern
  House_Hay_3: 'casa',         // big house with terrace       -> family home, two floors
  House_Hay_4_Purple: 'tienda',// house with the market awning -> grocery store
  House_Hay_1: 'granero'       // small thatched house         -> barn with a cow
};

/** Castle map art (keys are loaded as 'cs_<name>'): ground paintings, facade, bridge and furniture. */
const CASTLE_ASSET_KEYS = [
  'ground_road', 'ground_courtyard', 'facade', 'bridge', 'carpet', 'fountain', 'dummy', 'throne', 'royal_bed', 'oven',
  'banquet', 'armor', 'desk', 'pillar', 'banner', 'candelabra', 'chest', 'shields',
  // calm materials shared by every castle room
  'floor_stone', 'floor_plank', 'floor_dark', 'wall_stone', 'wall_panel', 'arch', 'rug_royal',
  // detail props
  'torch', 'tapestry', 'glass', 'hearth', 'statue', 'bench', 'cauldron', 'meatrack', 'preptable', 'anvil', 'globe', 'lectern',
  'brazier', 'stable', 'cart', 'planter', 'log', 'reeds', 'lion', 'stall', 'forge', 'workbench',
  'wall_side_l', 'wall_side_r',
  // castle grounds v4 (SpriteLab): wall walk and royal garden paintings, drawbridge deck, towers, garden and rampart props
  'ground_walls', 'ground_garden', 'drawdeck', 'tower', 'hedge', 'rose_pink', 'rose_white', 'urn', 'topiary_ball', 'topiary_cone', 'sundial', 'cherry',
  'queen', 'rosearch', 'gazebo', 'gbench', 'telescope', 'arrowbarrel', 'arrowcrates', 'spears', 'ballista', 'cannonballs', 'stool',
  // training yard (SpriteLab props + wooden pieces drawn by the map generator)
  'ground_training', 't_armor', 't_arrowpost', 't_barrel', 't_bench_h', 't_bench_v', 't_bowrack', 't_bows', 't_crates', 't_dummy', 't_fence_h', 't_fence_v',
  't_hay', 't_hay3', 't_log_d1', 't_log_d2', 't_log_h', 't_log_v', 't_quintain', 't_spears', 't_swords', 't_target', 't_target2', 't_tent', 't_tripod'
];

/** Castle sprite sheets ('cs_<name>'): [frame width, frame height]. The flame size comes with the art (CASTLE_FIRE). */
const CASTLE_SHEETS = { door: [30, 46], gate: [46, 74], fl_red: [96, 32], fl_white: [96, 32] };

/** Late-afternoon light over the castle grounds (multiplied over the scene). 0xffffff = plain daylight. */
const CASTLE_DAYLIGHT = 0xffe9cf;

/** Stretch of the village's south edge (in map pixels) that leads to the castle road. */
const CASTLE_ROAD_EXIT = { x0: 500, x1: 580, depth: 26 };

/** Animated map props: sprite sheets (key -> file and frame size) with their animations. Frames are generated with PixelLab from the SpriteLab sprite. */
const MAP_SHEETS = {
  ru_mill_anim: { file: 'assets/ruins/mill_anim.png', fw: 112, fh: 160, anims: { ru_mill_turn: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], fps: 4, yoyo: true } } },
  ru_scarecrow_anim: { file: 'assets/ruins/scarecrow_anim.png', fw: 64, fh: 64, anims: { ru_scarecrow_flap: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], fps: 8 } } },
  cs_banner_anim: { file: 'assets/castle/banner_anim.png', fw: 28, fh: 44, anims: { cs_banner_wave: { frames: [0, 1, 2, 3], fps: 6, yoyo: true } } },
  cs_banner_red_anim: { file: 'assets/castle/banner_red_anim.png', fw: 28, fh: 44, anims: { cs_banner_red_wave: { frames: [0, 1, 2, 3], fps: 6, yoyo: true } } },
  cs_banner_blue_anim: { file: 'assets/castle/banner_blue_anim.png', fw: 28, fh: 44, anims: { cs_banner_blue_wave: { frames: [0, 1, 2, 3], fps: 6, yoyo: true } } },
  cs_gfountain_anim: { file: 'assets/castle/gfountain_anim.png', fw: 96, fh: 96, anims: { cs_gfountain_flow: { frames: [1, 2, 3, 2], fps: 6 } } }
};

/** Ruined village art (keys are loaded as 'ru_<name>'); the list comes with the map data (window.RUINS_MAP). */
const RUINS_ASSET_KEYS = ['ground'].concat(Object.keys((typeof window !== 'undefined' && window.RUINS_MAP && window.RUINS_MAP.sizes) || {}).filter(k => !/_anim$/.test(k)));

/** Cold, overcast light over the ruined village. */
const RUINS_DAYLIGHT = 0xc3cbdc;

/** Top of the stone steps in the north-west of the village: the old path that leaves towards the ruined village. */
const RUINS_ROAD_EXIT = { x0: 126, x1: 170, y: 76, hintY: 104 };

/** Textures generated with PixelLab (keys are loaded as 'int_<name>'). */
const INTERIOR_ASSET_KEYS = [
  'apple_barrel', 'bar_counter', 'bar_shelf', 'bed_man', 'bed_woman', 'bookshelf', 'farm_tools', 'fence',
  'fireplace', 'keg', 'kitchen', 'milk', 'round_table', 'shelf_food', 'shelf_jars', 'shop_counter', 'stairs',
  'stool', 'trough', 'vanity', 'veg_crates', 'wardrobe', 'weapon_rack', 'wheelbarrow', 'window',
  'floor_wood', 'floor_dark', 'floor_stone', 'floor_dirt',
  'wall_plaster', 'wall_wood', 'wall_stone', 'wall_barn',
  'rug_red', 'rug_blue', 'rug_pink', 'rug_green'
];

/**
 * Scale of each piece relative to its PNG. The hero is about 20x26 px on screen, so furniture
 * is sized against that: a bed is longer than a person, a stool reaches the knee, a bucket the shin.
 */
const INTERIOR_SCALE = {
  bar_counter: 1.4, bar_shelf: 1.5, keg: 1.3, round_table: 1.2, stool: 0.85,
  fireplace: 1.4, kitchen: 1.4, bookshelf: 1.3, stairs: 1.5,
  bed_man: 1.1, bed_woman: 1.15, wardrobe: 1.3, vanity: 1.3, weapon_rack: 1.3,
  shop_counter: 1.4, shelf_food: 1.4, shelf_jars: 1.4, veg_crates: 1.1, apple_barrel: 1.1,
  trough: 1.4, fence: 1.3, farm_tools: 1.0, milk: 0.8, wheelbarrow: 1.3, window: 1.1,
  rug_red: 1.5, rug_blue: 1.5, rug_pink: 1.5, rug_green: 1.4
};

const INTERIOR_DOOR_SCALE = 1.75;

   // 16x26 door sheet -> 28x45, a bit taller than the hero
const INTERIOR_COW_SCALE = 2.0;
