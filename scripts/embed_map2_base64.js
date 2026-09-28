const fs = require('fs');
const path = require('path');

// 1. Read existing MAP_ASSETS_BASE64 from js/map_assets_base64.js
const mapAssetsJsPath = path.join(__dirname, '../js/map_assets_base64.js');
let existingContent = fs.readFileSync(mapAssetsJsPath, 'utf8');

global.window = {};
try {
  eval(existingContent);
} catch (e) {
  console.error('Error evaluating existing map_assets_base64:', e);
}
const dict = global.window.MAP_ASSETS_BASE64 || {};

console.log('Existing base64 keys count:', Object.keys(dict).length);

// 2. Scan assets/map2/Art recursively
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (item.name.toLowerCase().endsWith('.png')) {
      results.push(fullPath);
    }
  }
  return results;
}

const map2ArtDir = path.join(__dirname, '../assets/map2/Art');
const pngFiles = walk(map2ArtDir);
console.log('Found PNG files in map2/Art:', pngFiles.length);

let addedCount = 0;

for (const file of pngFiles) {
  const relFromRoot = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  const buf = fs.readFileSync(file);
  const dataUri = 'data:image/png;base64,' + buf.toString('base64');

  const fileName = path.basename(file, '.png');
  const normName = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // Register all possible variations & aliases
  const keys = new Set();
  keys.add(relFromRoot); // e.g. "assets/map2/Art/Ground Tileset/Tileset_Ground.png"
  keys.add(relFromRoot.replace('assets/map2/Art/', 'assets/map/Art/'));
  keys.add(relFromRoot.replace('assets/map2/', ''));
  keys.add(relFromRoot.replace('assets/map2/Art/', ''));
  keys.add(fileName);
  keys.add(normName);
  keys.add('obj_' + normName);
  keys.add('shd_' + normName);

  // Specific semantic tileset aliases for Tiled JSON linking
  if (fileName === 'Tileset_Ground') {
    keys.add('Tileset_Ground');
    keys.add('tileset_ground');
    keys.add('Ground');
    keys.add('ground');
  }
  if (fileName === 'Tileset_Road') {
    keys.add('Road');
    keys.add('road');
    keys.add('Tileset_Road');
    keys.add('tileset_road');
  }
  if (fileName === 'Tileset_Water') {
    keys.add('Tileset_Water');
    keys.add('tileset_water');
    keys.add('Water');
    keys.add('water');
  }
  if (fileName === 'Tileset_RockSlope') {
    keys.add('Tileset_RockSlope');
    keys.add('tileset_rockslope');
  }
  if (fileName === 'Tileset_RockSlope_Simple') {
    keys.add('Tileset_RockSlope_Simple');
    keys.add('tileset_rockslope_simple');
  }
  if (fileName === 'Flowers_Red') {
    keys.add('Animation_Flowers_Red');
    keys.add('animation_flowers_red');
  }
  if (fileName === 'Flowers_White') {
    keys.add('Animation_Flowers_White');
    keys.add('animation_flowers_white');
  }
  if (fileName === 'Tileset_Shadow') {
    keys.add('Tileset_Shadow');
    keys.add('tileset_shadow');
  }
  if (fileName === 'Animation_Campfire') {
    keys.add('Campfire');
    keys.add('campfire');
    keys.add('campfire_anim');
    keys.add('Animation_Campfire');
  }
  if (fileName === 'Buildings') {
    keys.add('Atlas_Buildings');
    keys.add('atlas_buildings');
  }
  if (fileName === 'Props') {
    keys.add('Atlas_Props');
    keys.add('atlas_props');
  }
  if (fileName === 'Rocks') {
    keys.add('Atlas_Rocks');
    keys.add('atlas_rocks');
  }
  if (fileName === 'Trees_Bushes') {
    keys.add('Atlas_Trees_Bushes');
    keys.add('atlas_trees_bushes');
  }

  for (const k of keys) {
    dict[k] = dataUri;
    addedCount++;
  }
}

console.log('Total keys in dictionary after adding map2 assets:', Object.keys(dict).length);

// Write updated dictionary to js/map_assets_base64.js
const newJsContent = 'if (typeof window !== "undefined") {\n  window.MAP_ASSETS_BASE64 = ' + JSON.stringify(dict, null, 2) + ';\n}\n';
fs.writeFileSync(mapAssetsJsPath, newJsContent, 'utf8');

console.log('Successfully updated js/map_assets_base64.js!');
console.log('New file size:', (fs.statSync(mapAssetsJsPath).size / 1024 / 1024).toFixed(2), 'MB');
