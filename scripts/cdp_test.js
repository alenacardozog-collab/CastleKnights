const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_dev_profile2',
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const tab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).find(t => t.type === 'page')));
    }).on('error', reject);
  });

  console.log('Tab URL:', tab.url);
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value !== undefined ? (typeof a.value === 'object' ? JSON.stringify(a.value) : a.value) : a.description).join(' ');
      console.log(`[CONSOLE ${msg.params.type}]`, args);
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');

  // Wait 2.5s for initial game load
  await new Promise(r => setTimeout(r, 2500));

  console.log('--- Calling activeGameScene.startCampaign() directly ---');
  const callRes = await send('Runtime.evaluate', {
    expression: `(() => {
      if (!window.activeGameScene) return 'no activeGameScene';
      window.activeGameScene.startCampaign();
      return 'startCampaign called';
    })()`,
    returnByValue: true
  });
  console.log('Call result:', callRes.result.value);

  // Wait 2.5s after startCampaign
  await new Promise(r => setTimeout(r, 2500));

  // Inspect Phaser scene state
  const state = await send('Runtime.evaluate', {
    expression: `(() => {
      const scene = window.activeGameScene;
      if (!scene) return 'no scene';
      return {
        gameMode: scene._gameMode,
        hasTiledMap: Boolean(scene.tiledMap),
        layers: scene.tiledMap ? scene.tiledMap.layers.map(l => ({
          name: l.name,
          visible: l.visible,
          alpha: l.alpha,
          tilemapLayer: Boolean(l.tilemapLayer),
          tilesLength: l.data ? l.data.length : 0
        })) : null,
        tilesets: scene.tiledMap ? scene.tiledMap.tilesets.map(t => ({
          name: t.name,
          firstgid: t.firstgid,
          total: t.total,
          image: Boolean(t.image),
          texKey: t.image ? t.image.key : null
        })) : null,
        layerGround: Boolean(scene.layerGround),
        layerWater: Boolean(scene.layerWater),
        layerRoad: Boolean(scene.layerRoad),
        layerFlowers: Boolean(scene.layerFlowers),
        layerRockSlopes: Boolean(scene.layerRockSlopes),
        playerPos: scene.player ? { x: scene.player.x, y: scene.player.y, depth: scene.player.depth } : null
      };
    })()`,
    returnByValue: true
  });

  console.log('--- PHASER STATE AFTER CAMPAIGN START ---');
  console.log(JSON.stringify(state.result.value, null, 2));

  // Capture screenshot
  const shot = await send('Page.captureScreenshot');
  if (shot && shot.data) {
    fs.writeFileSync('campaign_live_screen.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot campaign_live_screen.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
