/**
 * generate_campaign_map.js
 * Generates a full campaign map JSON for CastleKnight using map2/Art assets.
 * Run: node generate_campaign_map.js
 *
 * Map concept: "The Kingdom's Outpost"
 *   - 80x60 tile map (1280x960 pixels at 16x16)
 *   - Lush green meadow base
 *   - Central river running north-south with bridges
 *   - Village plaza with roads connecting N/S/E/W gates
 *   - Scattered trees, rocks, bushes around the perimeter
 *   - Camp with campfire in the south
 *   - RockSlope cliffs along the northern border
 *   - Flower patches across meadow
 *   - Water edges and sand transitions
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// MAP DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────
const W = 80;   // width in tiles
const H = 60;   // height in tiles
const TILE = 16; // tile size in pixels

// ─────────────────────────────────────────────────────────────────────────────
// TILESET firstgids (from mapa1.json patched)
// ─────────────────────────────────────────────────────────────────────────────
const GID = {
  // Atlas_Buildings: 1-476
  BUILDINGS_ATLAS: 1,
  // Objects_Buildings: 477-482
  OBJ_BUILDINGS: 477,
  // Objects_Props: 483-501
  OBJ_PROPS: 483,
  // Objects_Rocks: 502-506
  OBJ_ROCKS: 502,
  // Objects_Trees: 507-517
  OBJ_TREES: 507,
  // Atlas_Props: 518-697 (cols=18)
  PROPS: 518,
  // Atlas_Rocks: 698-719 (cols=11)
  ROCKS: 698,
  // Tileset_Ground: 720-887 (cols=12)
  GROUND: 720,
  // Tileset_RockSlope: 888-4983 (cols=64)
  ROCKSLOPE: 888,
  // Tileset_RockSlope_Simple: 4984-5037 (cols=6)
  ROCKSLOPE_SIMPLE: 4984,
  // Tileset_Water: 5038-5349 (cols=24)
  WATER: 5038,
  // Road: 5350-5433 (cols=6)
  ROAD: 5350,
  // Atlas_Trees_Bushes: 5434-5577 (cols=24)
  TREES: 5434,
  // Animation_Flowers_Red: 5578-5673 (cols=48)
  FLOWERS_RED: 5578,
  // Animation_Flowers_White: 5674-5769 (cols=48)
  FLOWERS_WHITE: 5674,
  // Campfire: 5770-5801 (cols=16)
  CAMPFIRE: 5770,
  // Tileset_Shadow: 5802-5849 (cols=6)
  SHADOW: 5802,
};

// ─────────────────────────────────────────────────────────────────────────────
// GROUND TILES (Tileset_Ground, firstgid=720, cols=12)
// Row 0 (720-731): Base grass variants
// Row 6 (792-803): Dirt/path base
// Row 7 (804-815): Cliff top transitions
// Row 11 (852-863): Rocky ground
// ─────────────────────────────────────────────────────────────────────────────
const G = {
  // Grass variants (rows 0-2, varied)
  GRASS:    [726, 727, 728, 729, 734, 738, 739, 740, 741, 742, 750, 751, 752, 753],
  // More grass mid-tones
  GRASS2:   [765, 774, 775, 779, 786, 787, 788, 790, 791, 798, 815, 816, 817, 818],
  // Cliff/cliff-edge tiles (used for north border cliffs)
  CLIFF:    [888, 889, 890, 891],
  // Water tiles (Tileset_Water, cols=24)
  WATER_MID:    [5039, 5040, 5041, 5063, 5064, 5065],   // deep water
  WATER_EDGE_N: [5134, 5135, 5136],                     // north edge water→grass
  WATER_EDGE_S: [5158, 5159, 5160],                     // south edge
  WATER_EDGE_W: [5087, 5088, 5111, 5112],               // west edge
  WATER_EDGE_E: [5090, 5091, 5114, 5115],               // east edge
  WATER_CORNER: [5086, 5092, 5110, 5116],               // corners
  SAND:         [5211, 5212, 5230, 5231],               // sand transition
  // Road tiles (Road, firstgid=5350, cols=6)
  ROAD_H:   [5356, 5357, 5358],  // horizontal road
  ROAD_V:   [5350, 5351, 5352],  // vertical road (col 0-2)
  ROAD_X:   [5374],              // crossroad
  ROAD_T_N: [5380],              // T junction facing N
  ROAD_T_S: [5386],              // T junction facing S
  ROAD_T_W: [5363],              // T junction facing W
  ROAD_T_E: [5365],              // T junction facing E
  ROAD_CR_NW: [5396],            // corner NW
  ROAD_CR_NE: [5397],            // corner NE
  ROAD_CR_SW: [5402],            // corner SW
  ROAD_CR_SE: [5403],            // corner SE
  ROAD_END_N: [5392],
  ROAD_END_S: [5404],
  // Flowers
  FLOWER_R:  [5578, 5579, 5581, 5583],   // red flowers
  FLOWER_W:  [5674, 5675, 5677, 5679],   // white flowers
  // Shadows
  SHADOW_SM: [5832, 5833, 5834],
  SHADOW_MD: [5838, 5839, 5840],
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function makeLayer(W, H, fill = 0) {
  return new Array(W * H).fill(fill);
}

function idx(x, y) { return y * W + x; }

function inBounds(x, y) { return x >= 0 && x < W && y >= 0 && y < H; }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// seeded random for reproducibility
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
function randInt(min, max) { return min + Math.floor(rand() * (max - min + 1)); }
function randPick(arr) { return arr[Math.floor(rand() * arr.length)]; }

// ─────────────────────────────────────────────────────────────────────────────
// LAYER DATA
// ─────────────────────────────────────────────────────────────────────────────
const layerGround   = makeLayer(W, H, 0);
const layerRoad     = makeLayer(W, H, 0);
const layerWater    = makeLayer(W, H, 0);
const layerFlowers  = makeLayer(W, H, 0);
const layerRockSlope = makeLayer(W, H, 0);
const layerShadows  = makeLayer(W, H, 0);

// ─────────────────────────────────────────────────────────────────────────────
// 1. GROUND — fill entire map with varied grass
// ─────────────────────────────────────────────────────────────────────────────
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const r = rand();
    let tile;
    if (r < 0.55)      tile = randPick(G.GRASS);
    else if (r < 0.85) tile = randPick(G.GRASS2);
    else               tile = randPick([726, 738, 750, 765, 779]);
    layerGround[idx(x, y)] = tile;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CLIFF BORDER — north 3 rows get rock slope tiles
// ─────────────────────────────────────────────────────────────────────────────
const CLIFF_TILES = [888, 889, 890, 891];
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < W; x++) {
    layerRockSlope[idx(x, y)] = CLIFF_TILES[(x + y) % CLIFF_TILES.length];
  }
}
// south border too
for (let y = H - 2; y < H; y++) {
  for (let x = 0; x < W; x++) {
    layerRockSlope[idx(x, y)] = CLIFF_TILES[(x + y + 2) % CLIFF_TILES.length];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RIVER — vertical river in the center (x = 35-39)
// ─────────────────────────────────────────────────────────────────────────────
const RIVER_LEFT  = 34;
const RIVER_RIGHT = 41;

for (let y = 3; y < H - 2; y++) {
  for (let x = RIVER_LEFT; x <= RIVER_RIGHT; x++) {
    let tile;
    if (x === RIVER_LEFT)  tile = randPick([5087, 5088, 5111, 5112]); // west bank
    else if (x === RIVER_RIGHT) tile = randPick([5090, 5091, 5114, 5115]); // east bank
    else tile = randPick(G.WATER_MID); // deep water
    layerWater[idx(x, y)] = tile;
    // Override ground under river with sand
    layerGround[idx(x, y)] = randPick(G.SAND);
  }
  // Sand transition alongside river banks
  if (y > 3 && y < H - 3) {
    layerGround[idx(RIVER_LEFT - 1, y)] = randPick(G.SAND);
    layerGround[idx(RIVER_RIGHT + 1, y)] = randPick(G.SAND);
  }
}

// River mouth (north) — water narrows to a source
for (let y = 0; y < 4; y++) {
  for (let x = 36; x <= 39; x++) {
    layerWater[idx(x, y)] = randPick(G.WATER_MID);
    layerGround[idx(x, y)] = randPick(G.SAND);
  }
}

// Small lake in the SW corner
const LAKE_CX = 12, LAKE_CY = 44, LAKE_R = 6;
for (let y = LAKE_CY - LAKE_R; y <= LAKE_CY + LAKE_R; y++) {
  for (let x = LAKE_CX - LAKE_R; x <= LAKE_CX + LAKE_R; x++) {
    if (!inBounds(x, y)) continue;
    const dx = x - LAKE_CX, dy = y - LAKE_CY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < LAKE_R - 1.5) {
      layerWater[idx(x, y)] = randPick(G.WATER_MID);
      layerGround[idx(x, y)] = randPick(G.SAND);
    } else if (dist < LAKE_R + 0.5) {
      layerGround[idx(x, y)] = randPick(G.SAND);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROADS — cross pattern through map center + perimeter gates
// Main road H: y=30, from x=0..W  (with bridge over river)
// Main road V: x=20 from y=3..H-2  (west side)
// Secondary V: x=60 from y=3..H-2  (east side)
// ─────────────────────────────────────────────────────────────────────────────
function placeRoadH(y, x0, x1) {
  for (let x = x0; x <= x1; x++) {
    if (layerWater[idx(x, y)]) continue; // bridge handled separately
    layerRoad[idx(x, y)] = randPick(G.ROAD_H);
  }
}
function placeRoadV(x, y0, y1) {
  for (let y = y0; y <= y1; y++) {
    if (layerWater[idx(x, y)]) continue;
    layerRoad[idx(x, y)] = randPick(G.ROAD_V);
  }
}

// Main horizontal road at y=29-31 (3-wide)
for (let ry = 29; ry <= 31; ry++) placeRoadH(ry, 1, W - 2);

// Bridges over river on main road
for (let bx = RIVER_LEFT; bx <= RIVER_RIGHT; bx++) {
  for (let by = 29; by <= 31; by++) {
    layerRoad[idx(bx, by)] = randPick(G.ROAD_H);
  }
}

// North-south road, west of river (x=18-19)
for (let vx = 18; vx <= 19; vx++) placeRoadV(vx, 3, H - 3);

// North-south road, east of river (x=60-61)
for (let vx = 60; vx <= 61; vx++) placeRoadV(vx, 3, H - 3);

// Small village plaza road (central left 8x8 at x=8-16, y=25-35)
for (let py = 25; py <= 35; py++) {
  for (let px = 8; px <= 16; px++) {
    layerRoad[idx(px, py)] = G.ROAD_H[0];
  }
}

// Village plaza road NE (central right: x=62-70, y=20-30)
for (let py = 20; py <= 30; py++) {
  for (let px = 62; px <= 70; px++) {
    layerRoad[idx(px, py)] = G.ROAD_H[0];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FLOWERS — scattered across meadow
// ─────────────────────────────────────────────────────────────────────────────
const FLOWER_COUNT = 180;
for (let f = 0; f < FLOWER_COUNT; f++) {
  const fx = randInt(2, W - 3);
  const fy = randInt(4, H - 4);
  if (layerWater[idx(fx, fy)] || layerRoad[idx(fx, fy)]) continue;
  const tile = rand() < 0.6 ? randPick(G.FLOWER_R) : randPick(G.FLOWER_W);
  layerFlowers[idx(fx, fy)] = tile;
}

// Dense flower patches near the lake
for (let pf = 0; pf < 40; pf++) {
  const fx = randInt(LAKE_CX - 9, LAKE_CX + 9);
  const fy = randInt(LAKE_CY - 9, LAKE_CY + 9);
  if (!inBounds(fx, fy) || layerWater[idx(fx, fy)]) continue;
  layerFlowers[idx(fx, fy)] = randPick(G.FLOWER_R);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SHADOW layer — light shadow marks on ground (decorative)
// ─────────────────────────────────────────────────────────────────────────────
const SHADOW_COUNT = 60;
for (let s = 0; s < SHADOW_COUNT; s++) {
  const sx = randInt(3, W - 4);
  const sy = randInt(4, H - 5);
  if (layerWater[idx(sx, sy)] || layerRoad[idx(sx, sy)]) continue;
  layerShadows[idx(sx, sy)] = randPick(G.SHADOW_SM);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. OBJECT LAYER — trees, rocks, props, campfire, buildings
// ─────────────────────────────────────────────────────────────────────────────
const objects = [];
let objId = 1;

// Helper: place an object tile (from object tileset)
function placeObj(gid, x, y, w, h) {
  objects.push({ id: objId++, gid, x: x * TILE, y: y * TILE, width: w, height: h });
}

// Trees around perimeter and scattered
const TREE_POSITIONS = [];
// Dense forest border (west, east sides) and NE/NW corners
// West forest (x=0-5, y=4-55)
for (let t = 0; t < 35; t++) {
  TREE_POSITIONS.push([randInt(1, 5), randInt(4, H - 4)]);
}
// East forest (x=72-78, y=4-55)
for (let t = 0; t < 35; t++) {
  TREE_POSITIONS.push([randInt(73, W - 2), randInt(4, H - 4)]);
}
// Scattered trees
for (let t = 0; t < 40; t++) {
  TREE_POSITIONS.push([randInt(6, W - 7), randInt(4, H - 4)]);
}

// Tree object GIDs (Objects_Trees: firstgid=507, 11 tiles)
// Bush GIDs (Objects_Trees: 507+0 to 507+10)
const TREE_GIDS = [507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517];
const BUSH_GID_START = GID.OBJ_TREES;

TREE_POSITIONS.forEach(([tx, ty]) => {
  if (!inBounds(tx, ty)) return;
  if (layerWater[idx(tx, ty)] || layerRoad[idx(tx, ty)]) return;
  // Avoid roads and river
  const gid = randPick(TREE_GIDS);
  placeObj(gid, tx, ty, 64, 93);
});

// Rocks scattered in open areas
// Objects_Rocks: firstgid=502, 5 tiles
const ROCK_GIDS = [502, 503, 504, 505, 506];
for (let r = 0; r < 30; r++) {
  const rx = randInt(6, W - 6);
  const ry = randInt(4, H - 4);
  if (!inBounds(rx, ry)) return;
  if (layerWater[idx(rx, ry)] || layerRoad[idx(rx, ry)]) continue;
  placeObj(randPick(ROCK_GIDS), rx, ry, 28, 30);
}

// Props: Objects_Props firstgid=483, 18 tiles
// Place props in village plazas
const PROP_GIDS = Array.from({length: 18}, (_, i) => 483 + i);
const PROPS_WEST = [[10,26],[11,26],[12,26],[13,27],[14,27],[10,32],[12,33],[13,33]];
PROPS_WEST.forEach(([px, py]) => {
  if (!inBounds(px, py)) return;
  placeObj(randPick(PROP_GIDS.slice(0, 12)), px, py, 46, 63);
});
const PROPS_EAST = [[64,21],[65,21],[66,22],[68,23],[64,27],[66,27],[68,27],[65,29]];
PROPS_EAST.forEach(([px, py]) => {
  if (!inBounds(px, py)) return;
  placeObj(randPick(PROP_GIDS.slice(0, 12)), px, py, 46, 63);
});

// Buildings (Objects_Buildings: firstgid=477, 6 tiles)
const BUILDING_GIDS = [477, 478, 479, 480, 481, 482];
// West village buildings
[[8, 24], [15, 24], [8, 34], [15, 34]].forEach(([bx, by]) => {
  placeObj(randPick(BUILDING_GIDS), bx, by, 175, 128);
});
// East village buildings
[[62, 19], [70, 19], [62, 29], [70, 29]].forEach(([bx, by]) => {
  placeObj(randPick(BUILDING_GIDS), bx, by, 175, 128);
});

// Campfire south camp area (x=40-50, y=48)
placeObj(GID.CAMPFIRE, 45, 48, 32, 32);
placeObj(GID.CAMPFIRE, 47, 50, 32, 32);

// ─────────────────────────────────────────────────────────────────────────────
// 8. BUILD TILESETS from patched mapa1.json (reuse exact definitions)
// ─────────────────────────────────────────────────────────────────────────────
const sourceTilesets = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/map2/mapa1.json'), 'utf8')).tilesets;

// ─────────────────────────────────────────────────────────────────────────────
// 9. ASSEMBLE FINAL MAP JSON
// ─────────────────────────────────────────────────────────────────────────────
const campaignMap = {
  compressionlevel: -1,
  height: H,
  infinite: false,
  layers: [
    {
      data: layerGround,
      height: H,
      id: 1,
      name: "Ground",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      data: layerFlowers,
      height: H,
      id: 2,
      name: "Flowers",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      data: layerRoad,
      height: H,
      id: 3,
      name: "Road",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      data: layerShadows,
      height: H,
      id: 4,
      name: "Shadows",
      opacity: 0.35,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      data: layerRockSlope,
      height: H,
      id: 5,
      name: "RockSlopes",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      data: layerWater,
      height: H,
      id: 6,
      name: "Water",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0
    },
    {
      draworder: "topdown",
      id: 7,
      name: "Object Layer 1",
      objects: objects,
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0
    }
  ],
  nextlayerid: 8,
  nextobjectid: objId,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: TILE,
  tilesets: sourceTilesets,
  tilewidth: TILE,
  type: "map",
  version: "1.10",
  width: W
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. WRITE OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '../assets/map2/campaign_map.json');
fs.writeFileSync(outPath, JSON.stringify(campaignMap), 'utf8');

const totalTiles = layerGround.filter(v => v > 0).length
  + layerRoad.filter(v => v > 0).length
  + layerWater.filter(v => v > 0).length
  + layerFlowers.filter(v => v > 0).length;

console.log('✅ campaign_map.json generated!');
console.log(`   Size: ${W}x${H} tiles (${W*TILE}x${H*TILE}px)`);
console.log(`   Ground tiles: ${layerGround.filter(v=>v>0).length}`);
console.log(`   Road tiles:   ${layerRoad.filter(v=>v>0).length}`);
console.log(`   Water tiles:  ${layerWater.filter(v=>v>0).length}`);
console.log(`   Flower tiles: ${layerFlowers.filter(v=>v>0).length}`);
console.log(`   RockSlope:    ${layerRockSlope.filter(v=>v>0).length}`);
console.log(`   Objects:      ${objects.length}`);
console.log(`   Tilesets:     ${sourceTilesets.length}`);
console.log(`   Output: ${outPath}`);
