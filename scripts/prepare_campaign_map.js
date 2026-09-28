const fs = require('fs');
const path = require('path');

// 1. Read the original map1.json from assets/map2
const rawData = fs.readFileSync(path.join(__dirname, '../assets/map2/map1.json'), 'utf8');
const map = JSON.parse(rawData);

console.log('Original map loaded:');
console.log('  Dimensions:', map.width, 'x', map.height);
console.log('  Layers:', map.layers.length);
console.log('  Tilesets:', map.tilesets.length);

// 2. Flatten layers: Group layers like 'Shadows' need their sublayers lifted to top-level
const flattenedLayers = [];
map.layers.forEach(l => {
  if (l.type === 'group' && Array.isArray(l.layers)) {
    console.log(`  Unpacking group layer "${l.name}" with ${l.layers.length} sublayers...`);
    l.layers.forEach(sub => {
      // Inherit group opacity/properties if helpful
      if (l.opacity !== undefined && sub.opacity === undefined) {
        sub.opacity = l.opacity;
      }
      flattenedLayers.push(sub);
    });
  } else {
    flattenedLayers.push(l);
  }
});

map.layers = flattenedLayers;

// 3. Fix all image paths: map any path containing 'Art/...' to 'assets/map2/Art/...'
// Also collect all image files to verify their existence
let totalImages = 0;
let validImages = 0;
let missingImages = [];

function fixImagePath(origPath) {
  if (!origPath) return origPath;
  totalImages++;
  const norm = origPath.replace(/\\/g, '/');
  const artIndex = norm.indexOf('Art/');
  if (artIndex !== -1) {
    const relFromArt = norm.substring(artIndex); // e.g. 'Art/Buildings/Atlas/Buildings.png'
    const fullLocalPath = 'assets/map2/' + relFromArt;
    const diskPath = path.join(__dirname, '..', fullLocalPath);
    if (fs.existsSync(diskPath)) {
      validImages++;
      return fullLocalPath;
    } else {
      missingImages.push({ origPath, tried: fullLocalPath });
      return fullLocalPath;
    }
  }
  missingImages.push({ origPath, reason: 'No Art/ segment' });
  return origPath;
}

map.tilesets.forEach(ts => {
  if (ts.image) {
    ts.image = fixImagePath(ts.image);
  }
  if (Array.isArray(ts.tiles)) {
    ts.tiles.forEach(t => {
      if (t.image) {
        t.image = fixImagePath(t.image);
      }
    });
  }
});

console.log(`Path normalization complete: ${validImages} / ${totalImages} image paths verified.`);
if (missingImages.length > 0) {
  console.warn('Missing images:', missingImages);
}

// 4. Save normalized JSON back to assets/map2/map1.json
const outputJson = JSON.stringify(map, null, 2);
fs.writeFileSync(path.join(__dirname, '../assets/map2/map1.json'), outputJson, 'utf8');
console.log('Saved normalized assets/map2/map1.json successfully.');

// 5. Also write js/map2_data.js (window.CAMPAIGN_MAP_DATA) for instant offline & zero-latency loading
const jsContent = 'window.CAMPAIGN_MAP_DATA = ' + JSON.stringify(map) + ';\n';
fs.writeFileSync(path.join(__dirname, '../js/map2_data.js'), jsContent, 'utf8');
console.log('Generated js/map2_data.js successfully (' + Math.round(jsContent.length / 1024) + ' KB).');
