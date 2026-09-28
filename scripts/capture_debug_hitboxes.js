const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function shot() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_debug_vis',
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
      s.showCollisionDebug = false;
      s.toggleCollisionDebug();
      if (s.obstacleDebugGfx) s.obstacleDebugGfx.setDepth(99999);
      if (s.characterDebugGfx) s.characterDebugGfx.setDepth(99999);
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage\\campaign_hitboxes_debug_visible.png';
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved campaign_hitboxes_debug_visible.png');

  ws.close();
  chrome.kill();
}
shot().catch(console.error);
