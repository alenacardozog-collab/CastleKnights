const http = require('http');
const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_hitbox_diag',
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

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const obsCount = s.obstacles ? s.obstacles.getChildren().length : 0;
      const lowCount = s.lowObstacles ? s.lowObstacles.getChildren().length : 0;
      const mapObsCount = s.mapObstacles ? s.mapObstacles.length : 0;
      const colliders = s.physics.world.colliders.getActive();
      
      const p = s.player;
      const samples = (s.mapObstacles || []).slice(0, 15);

      return {
        mode: s._gameMode,
        obsCount,
        lowCount,
        mapObsCount,
        activeCollidersCount: colliders.length,
        playerPos: { x: p.x, y: p.y, bodyW: p.body.width, bodyH: p.body.height, bodyX: p.body.x, bodyY: p.body.y },
        samples
      };
    })()`,
    returnByValue: true
  });

  console.log('Campaign Hitbox Diag:\n', JSON.stringify(diag.result.value, null, 2));

  // Also check if collision between player and obstacles is active:
  // Try moving player towards an obstacle and see if velocity is blocked
  const moveTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Find nearest obstacle to player
      let nearest = null, minDist = Infinity;
      s.mapObstacles.forEach(o => {
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const d = Math.hypot(cx - s.player.x, cy - s.player.y);
        if (d < minDist) { minDist = d; nearest = o; }
      });
      return { nearest, minDist };
    })()`,
    returnByValue: true
  });
  console.log('Nearest obstacle to player (250, 340):', moveTest.result.value);

  ws.close();
  chrome.kill();
}
test().catch(e => { console.error(e); process.exit(1); });
