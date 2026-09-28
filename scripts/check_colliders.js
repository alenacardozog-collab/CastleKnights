const http = require('http');
const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_coll_check',
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:3000/'
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
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 2000));

  await send('Runtime.evaluate', {
    expression: 'window.activeGameScene.startCampaign()'
  });
  await new Promise(r => setTimeout(r, 1200));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const colliders = s.physics.world.colliders.getActive();
      const collInfo = colliders.map(c => ({
        object1: c.object1 === s.player ? 'player' : (c.object1 === s.enemies ? 'enemies' : (c.object1 === s.projectiles ? 'projectiles' : 'other')),
        object2: c.object2 === s.obstacles ? 'CURRENT_obstacles' : (c.object2 === s.lowObstacles ? 'CURRENT_low' : (c.object2 === s.hazardZones ? 'CURRENT_hazard' : (c.object2 === s.slowZones ? 'CURRENT_slow' : 'OLD_GROUP'))),
        active: c.active
      }));
      return {
        collInfo,
        playerObstaclesCollisionWorking: s.physics.world.colliders.getActive().some(c => c.object1 === s.player && c.object2 === s.obstacles)
      };
    })()`,
    returnByValue: true
  });

  console.log('Active Colliders in Campaign:\n', JSON.stringify(check.result.value, null, 2));

  ws.close();
  chrome.kill();
}
test().catch(e => { console.error(e); process.exit(1); });
