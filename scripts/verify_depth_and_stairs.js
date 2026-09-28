const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  console.log('=== Starting browser integration test ===');
  const port = 9225;
  const tempDir = 'C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_test_' + Date.now();
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

  // Start campaign mode
  console.log('Starting campaign mode...');
  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1500));

  // Turn on collision debug hitboxes
  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.showCollisionDebug = false;
      s.toggleCollisionDebug();
      if (s.obstacleDebugGfx) s.obstacleDebugGfx.setDepth(99999);
      if (s.characterDebugGfx) s.characterDebugGfx.setDepth(99999);

      // Check House 3 obstacles
      const house3Obs = (s.mapObstacles || []).filter(o => o.source && o.source.includes('prop_2_'));
      
      // Check building depths in scene
      const buildings = (s.campaignObjectSprites || []).filter(spr => {
        return spr.texture && ['House_Hay_1', 'House_Hay_2', 'House_Hay_3', 'House_Hay_4_Purple'].some(h => spr.texture.key.includes(h));
      }).map(b => ({ key: b.texture.key.split('/').pop().replace('.png', ''), x: b.x, y: b.y, depth: b.depth }));

      // Move player in front of House 2 (x: 412, y: 440)
      s.player.setPosition(412, 440);
      if (s.player.body) s.player.body.reset(412, 440);
      s.update();
      const playerFrontHouse2Depth = s.player.depth;

      // Move player onto House 3 stone stairs (x: 265, y: 125)
      s.player.setPosition(265, 125);
      if (s.player.body) s.player.body.reset(265, 125);
      s.update();
      const playerStairsDepth = s.player.depth;

      return {
        house3Obs,
        buildings,
        playerFrontHouse2Depth,
        playerStairsDepth
      };
    })()`,
    returnByValue: true
  });

  console.log('Diagnostics from game:');
  console.log('Building depths:', diag.result.value.buildings);
  console.log('House 3 colliders:', diag.result.value.house3Obs);
  console.log('Player depth in front of House 2:', diag.result.value.playerFrontHouse2Depth);
  console.log('Player depth on House 3 stone stairs:', diag.result.value.playerStairsDepth);

  // Position camera on House 3 stairs & capture screenshot
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(268, 128);
      s.cameras.main.centerOn(290, 130);
      s.update();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const outDir = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/campaign_stairs_depth_debug.png`, Buffer.from(shot1.data, 'base64'));
  console.log('Saved campaign_stairs_depth_debug.png');

  // Position camera on House 2 in front & capture screenshot
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(412, 436);
      s.cameras.main.centerOn(412, 410);
      s.update();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/campaign_house_front_depth_debug.png`, Buffer.from(shot2.data, 'base64'));
  console.log('Saved campaign_house_front_depth_debug.png');

  ws.close();
  chrome.kill();
  console.log('All tests and screenshots completed successfully!');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
