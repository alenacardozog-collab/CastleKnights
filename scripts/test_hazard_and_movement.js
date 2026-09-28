const http = require('http');
const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_haz_test_' + Date.now(),
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:3000/?t=' + Date.now()
  ]);
  await new Promise(r => setTimeout(r, 2200));
  const tab = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).find(t => t.type === 'page')));
    });
  });
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const i = id++;
    const h = e => { const msg = JSON.parse(e.data); if (msg.id === i) { ws.removeEventListener('message', h); res(msg.result); } };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1200));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const initialHp = s.health;
      s.player.setPosition(262, 460); // Feet body at (272, 480), center of campfire
      s.isInvulnerable = false;
      s._lastHazardHit = 0;
      s.physics.world.step(1/60);
      s.physics.world.step(1/60);
      const damagedHp = s.health;
      return {
        initialHp,
        damagedHp,
        tookFireDamage: damagedHp < initialHp
      };
    })()`,
    returnByValue: true
  });
  console.log('Hazard Test Result:', res.result.value);

  ws.close();
  chrome.kill();
}
test().catch(console.error);
