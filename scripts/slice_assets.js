const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpeg = 'C:\\Users\\alen_\\AppData\\Local\\JDownloader 2\\tools\\Windows\\ffmpeg\\x64\\ffmpeg.exe';
const outDir = 'd:/prueba/assets/UI/icons';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read whole fantasyUI.png into raw RGBA buffer (1024x1560)
console.log('Loading fantasyUI.png into memory...');
const rawBuf = execSync(`"${ffmpeg}" -i "d:/prueba/assets/UI/fantasyUI.png" -f rawvideo -pix_fmt rgba pipe:1`, { maxBuffer: 30 * 1024 * 1024 });
const W = 1024;
const H = 1560;

function findExactBox(approxX, approxY, searchRadiusX = 30, searchRadiusY = 30, minAlpha = 35) {
  let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
  const x1 = Math.max(0, approxX - searchRadiusX);
  const x2 = Math.min(W - 1, approxX + searchRadiusX);
  const y1 = Math.max(0, approxY - searchRadiusY);
  const y2 = Math.min(H - 1, approxY + searchRadiusY);

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const idx = (y * W + x) * 4;
      const a = rawBuf[idx + 3];
      if (a >= minAlpha) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

const targets = [
  // Hearts
  { name: 'heart_full.png', box: findExactBox(928, 18, 12, 12) },
  { name: 'heart_half.png', box: findExactBox(960, 18, 12, 12) },
  { name: 'heart_empty.png', box: findExactBox(992, 18, 12, 12) },

  // Swords
  { name: 'sword_purple.png', box: findExactBox(404, 150, 10, 26) },
  { name: 'sword_blue.png', box: findExactBox(419, 150, 10, 26) },
  { name: 'sword_gold.png', box: findExactBox(439, 150, 10, 26) },

  // Potions & Coins
  { name: 'potion_red.png', box: findExactBox(48, 1007, 16, 20) },
  { name: 'potion_blue.png', box: findExactBox(213, 1007, 16, 20) },
  { name: 'coin_sack.png', box: findExactBox(18, 1147, 16, 20) },

  // Icons from square buttons (row 1: play, pause, check, close)
  { name: 'icon_play.png', box: findExactBox(371, 991, 10, 10) },
  { name: 'icon_pause.png', box: findExactBox(402, 991, 10, 10) },
  { name: 'icon_check.png', box: findExactBox(433, 991, 10, 10) },
  { name: 'icon_close.png', box: findExactBox(464, 991, 10, 10) },

  // Icons (gear, sound, sound off, home)
  { name: 'icon_gear.png', box: findExactBox(622, 1051, 10, 10) },
  { name: 'icon_sound_on.png', box: findExactBox(652, 1051, 10, 10) },
  { name: 'icon_sound_off.png', box: findExactBox(682, 1051, 10, 10) },
  { name: 'icon_home.png', box: findExactBox(592, 1051, 10, 10) },

  // Scroll icon
  { name: 'scroll_icon.png', box: findExactBox(350, 90, 25, 30) },
  { name: 'lantern_icon.png', box: findExactBox(418, 80, 15, 20) },

  // Ornate frames for character selection
  { name: 'card_frame_soldier.png', box: { x: 818, y: 448, w: 74, h: 100 } },
  { name: 'card_frame_wizard.png', box: { x: 914, y: 448, w: 74, h: 100 } },
  { name: 'modal_frame_ornate.png', box: { x: 531, y: 440, w: 122, h: 108 } },
  { name: 'icon_map.png', box: { x: 531, y: 401, w: 22, h: 23 } },
  { name: 'icon_sword_menu.png', box: { x: 418, y: 125, w: 16, h: 44 } },
  { name: 'card_frame_gold.png', box: findExactBox(592, 375, 60, 80) },
  { name: 'card_frame_dark.png', box: findExactBox(742, 375, 60, 80) },
  { name: 'hud_bar_player.png', box: { x: 164, y: 84, w: 150, h: 42 } },
  { name: 'ornate_hp_bar.png', box: { x: 954, y: 1152, w: 68, h: 18 } }
];

targets.forEach(t => {
  if (!t.box) {
    console.warn('Could not find box for:', t.name);
    return;
  }
  const dest = path.join(outDir, t.name);
  const cropStr = `${t.box.w}:${t.box.h}:${t.box.x}:${t.box.y}`;
  const cmd = `"${ffmpeg}" -i "d:/prueba/assets/UI/fantasyUI.png" -vf "crop=${cropStr}" "${dest}" -y`;
  execSync(cmd, { stdio: 'ignore' });
  console.log(`Sliced: ${t.name} -> crop=${cropStr}`);
});
console.log('All icons extracted cleanly!');
