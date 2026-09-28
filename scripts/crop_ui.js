const { execSync } = require('child_process');
const ffmpeg = 'C:\\Users\\alen_\\AppData\\Local\\JDownloader 2\\tools\\Windows\\ffmpeg\\x64\\ffmpeg.exe';
const crops = [
  { name: 'ui_top_bars.png', crop: '520:220:0:0' },
  { name: 'ui_hearts.png', crop: '150:120:874:0' },
  { name: 'ui_frames_ornate.png', crop: '520:350:505:280' },
  { name: 'ui_wood_boards.png', crop: '500:360:0:160' },
  { name: 'ui_icons_grid.png', crop: '530:260:325:640' },
  { name: 'ui_bottom_bars.png', crop: '200:150:824:680' }
];

crops.forEach(c => {
  const cmd = `"${ffmpeg}" -i "d:/prueba/assets/UI/fantasyUI.png" -vf "crop=${c.crop}" "d:/prueba/assets/UI/${c.name}" -y`;
  execSync(cmd);
  console.log('Generated:', c.name);
});
