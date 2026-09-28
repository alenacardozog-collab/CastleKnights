const fs = require('fs');

const map = JSON.parse(fs.readFileSync('assets/map2/map1.json', 'utf8'));

console.log('=== TILED JSON TILESETS ===');
map.tilesets.forEach(ts => {
  console.log(`name: "${ts.name}", firstgid: ${ts.firstgid}, image: "${ts.image}"`);
});

console.log('\n=== TILED JSON LAYERS ===');
map.layers.forEach((l, i) => {
  const nonZero = l.data ? l.data.filter(g => g > 0).length : (l.objects ? l.objects.length : 0);
  console.log(`Layer ${i}: "${l.name}", type: ${l.type}, visible: ${l.visible}, count: ${nonZero}`);
});

console.log('\n=== CHECK FILE EXISTENCE FOR TILESET IMAGES ===');
map.tilesets.forEach(ts => {
  if (ts.image) {
    console.log(`Tileset "${ts.name}": "${ts.image}" -> exists: ${fs.existsSync(ts.image)}`);
  }
});
