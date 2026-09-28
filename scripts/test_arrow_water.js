const http = require('http');
const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_arrow_water',
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
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(470, 180); // In front of House 1 wall (hitbox starts at x: 515)
      s.facingDirection = 'right';
      s.shootArrow();
    })()`
  });

  await new Promise(r => setTimeout(r, 200));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const arrow = s.projectiles.getChildren().find(a => a.active);
      return {
        arrowDestroyedOnWall: !arrow
      };
    })()`,
    returnByValue: true
  });
  console.log('Arrow against solid wall result:', check.result.value);

  ws.close();
  chrome.kill();
}
test().catch(console.error);
