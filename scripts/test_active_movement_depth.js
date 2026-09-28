const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  console.log('=== Capturing clean screenshots without ready banner ===');
  const port = 9227;
  const tempDir = 'C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_clean_' + Date.now();
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--window-size=1280,720',
    `http://localhost:3000/?nocache=${Date.now()}`
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const tab = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const list = JSON.parse(d);
        const p = list.find(t => t.type === 'page');
        if (p) resolve(p);
        else reject(new Error('No page found'));
      });
    }).on('error', reject);
  });

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const i = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === i) {
        ws.removeEventListener('message', h);
        res(msg.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  await send('Network.enable');
  await send('Network.clearBrowserCache');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1200));

  // 1. Start campaign
  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1200));

  // 2. Click button to dismiss banner and start combat
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-ready-combat');
      if (btn) btn.click();
      const prompt = document.getElementById('ready-prompt-container');
      if (prompt) prompt.classList.add('hidden');
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  const outDir = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 3. Move player in front of House 2 (x: 412, y: 432)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(412, 432);
      if (s.player.body) s.player.body.reset(412, 432);
      s.cameras.main.centerOn(412, 410);
      s.cameras.main.setZoom(1.6);
      s.update();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/clean_player_in_front_house2.png`, Buffer.from(shot1.data, 'base64'));
  console.log('Saved clean_player_in_front_house2.png');

  // 4. Move player onto House 3 stone stairs (x: 260, y: 115)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(260, 115);
      if (s.player.body) s.player.body.reset(260, 115);
      s.cameras.main.centerOn(280, 120);
      s.cameras.main.setZoom(1.6);
      s.update();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/clean_player_stairs_house3.png`, Buffer.from(shot2.data, 'base64'));
  console.log('Saved clean_player_stairs_house3.png');

  // 5. Move player in front of House 1 (x: 546, y: 206)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(546, 206);
      if (s.player.body) s.player.body.reset(546, 206);
      s.cameras.main.centerOn(546, 180);
      s.cameras.main.setZoom(1.6);
      s.update();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/clean_player_in_front_house1.png`, Buffer.from(shot3.data, 'base64'));
  console.log('Saved clean_player_in_front_house1.png');

  ws.close();
  chrome.kill();
  console.log('All clean screenshots completed successfully!');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
