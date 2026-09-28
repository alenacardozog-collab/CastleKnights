/**
 * patch_map2.js
 * Patches assets/map2/mapa1.json to replace .tsx external references
 * with inline tileset definitions (using map2/Art/ image paths).
 * Run once: node patch_map2.js
 */
const fs = require('fs');
const path = require('path');

// ── 1. Load map2 raw JSON (has .tsx external refs) ──────────────────────────
const map2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/map2/mapa1.json'), 'utf8'));

// ── 2. Load map1 inline data (working reference with full tileset defs) ──────
const m1src = fs.readFileSync(path.join(__dirname, '../js/mapa1_data.js'), 'utf8');
const fakeWindow = {};
(new Function('window', m1src))(fakeWindow);
const map1 = fakeWindow.TILED_MAP_DATA;

// ── 3. Build lookup: tsx filename → map1 tileset definition ─────────────────
//    The tsx filename stem maps to the map1 tileset by index (same order, same firstgid)
const tsxToMap1Index = {
  'Atlas_Buildings.tsx':       0,   // Atlas_Buildings
  'Objects_Buildings.tsx':     1,   // Buildings (Objects)
  'Objects_Props.tsx':         2,   // Objects_Props
  'Objects_Rocks.tsx':         3,   // Objects_Rocks
  'Objects_Trees.tsx':         4,   // Objects_Trees
  'Atlas_Props.tsx':           5,   // Atlas_Props
  'Atlas_Rocks.tsx':           6,   // Atlas_Rocks
  'Tileset_Ground.tsx':        7,   // Tileset_Ground
  'Tileset_RockSlope.tsx':     8,   // Tileset_RockSlope
  'Tileset_RockSlope_Simple.tsx': 9, // Tileset_RockSlope_Simple
  'Tileset_Water.tsx':         10,  // Tileset_Water
  'Tilesets_Road.tsx':         11,  // Road
  'Atlas_Trees_Bushes.tsx':    12,  // Atlas_Trees_Bushes
  'Animation_Flowers_Red.tsx': 13,  // Animation_Flowers_Red
  'Animation_Flowers_White.tsx': 14, // Animation_Flowers_White
  'Animation_Campfire.tsx':    15,  // Campfire
  'Tileset_Shadow.tsx':        16,  // Tileset_Shadow
  'Objects_Shadows.tsx':       17,  // Objects_Shadows
};

// ── 4. Image path remap: assets/map/Art/ → assets/map2/Art/ ─────────────────
const remapImagePath = (imgPath) => {
  if (!imgPath) return imgPath;
  return imgPath.replace('assets/map/Art/', 'assets/map2/Art/');
};

// ── 5. Remap tile image refs inside a tileset (for object tilesets) ──────────
const remapTilesetImages = (ts) => {
  const remapped = JSON.parse(JSON.stringify(ts)); // deep clone
  if (remapped.image) {
    remapped.image = remapImagePath(remapped.image);
  }
  if (remapped.tiles && Array.isArray(remapped.tiles)) {
    remapped.tiles = remapped.tiles.map(tile => {
      if (tile.image) tile.image = remapImagePath(tile.image);
      return tile;
    });
  }
  return remapped;
};

// ── 6. Patch each tileset in map2 ────────────────────────────────────────────
const patchedTilesets = map2.tilesets.map((ts2) => {
  const tsxFile = ts2.source.split('/').pop(); // e.g. "Atlas_Buildings.tsx"
  const m1Idx = tsxToMap1Index[tsxFile];
  
  if (m1Idx === undefined) {
    console.warn(`⚠️  No mapping found for: ${tsxFile} — keeping as-is`);
    return ts2;
  }

  const m1ts = map1.tilesets[m1Idx];
  if (!m1ts) {
    console.warn(`⚠️  map1 tileset index ${m1Idx} not found for: ${tsxFile}`);
    return ts2;
  }

  // Merge: take all map1 definition but use map2's firstgid and remap image paths
  const patched = remapTilesetImages({ ...m1ts, firstgid: ts2.firstgid });
  
  console.log(`✓ ${tsxFile.replace('.tsx','')} (firstgid=${ts2.firstgid})`
    + ` → name="${patched.name}" img="${(patched.image || 'object-tileset').split('/').pop()}"`);
  
  return patched;
});

// ── 7. Write patched map2 JSON ────────────────────────────────────────────────
const patched = { ...map2, tilesets: patchedTilesets };
// Remove any .source references that might confuse Phaser
fs.writeFileSync(path.join(__dirname, '../assets/map2/mapa1.json'), JSON.stringify(patched), 'utf8');
console.log('\n✅ Patched map2/mapa1.json written successfully.');
console.log(`   ${patchedTilesets.length} tilesets inline, ${patched.layers.length} layers.`);
