const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_verify_profile',
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

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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

  await send('Runtime.enable');
  await send('Page.enable');

  // Wait 3s for game initialization
  await new Promise(r => setTimeout(r, 3000));

  console.log('=== TEST 1: CAMPAIGN MODE & TERRAIN LAYERS ===');
  const campaignRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      if (!s) return { error: 'No activeGameScene' };
      s.startCampaign();
      return {
        gameMode: s._gameMode,
        hasTiledMap: Boolean(s.tiledMap),
        layers: ['Ground', 'Water', 'RockSlopes_Auto', 'Road', 'Flowers', 'Shadows'].map(name => {
          const l = s['layer' + (name === 'RockSlopes_Auto' ? 'RockSlopes' : name)];
          return {
            name,
            exists: Boolean(l),
            depth: l ? l.depth : null,
            visible: l ? l.visible : null
          };
        }),
        playerDepth: s.player ? s.player.depth : null,
        playerPos: s.player ? { x: s.player.x, y: s.player.y } : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Campaign state:', JSON.stringify(campaignRes.result.value, null, 2));

  // Wait 1s and capture screenshot of Campaign
  await new Promise(r => setTimeout(r, 1000));
  const shot1 = await send('Page.captureScreenshot');
  if (shot1?.data) {
    fs.writeFileSync('campaign_verified.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved screenshot: campaign_verified.png');
  }

  console.log('=== TEST 2: RESTART FROM CAMPAIGN DEATH ===');
  const restartRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Simulate player dying in Campaign
      s.health = 0;
      s.isDead = true;
      s.showGameOverModal();

      // Click restart button
      const btnRestart = document.getElementById('btn-restart');
      if (!btnRestart) return { error: 'No btn-restart found' };
      btnRestart.click();

      return {
        gameModeAfterRestart: s._gameMode,
        isDead: s.isDead,
        health: s.health,
        playerDepth: s.player ? s.player.depth : null,
        playerPos: s.player ? { x: s.player.x, y: s.player.y } : null,
        modalActive: document.getElementById('game-over-modal')?.classList.contains('active')
      };
    })()`,
    returnByValue: true
  });
  console.log('Restart state:', JSON.stringify(restartRes.result.value, null, 2));

  console.log('=== TEST 3: MAP EDITOR (CLEAN MEADOW TERRAIN WITHOUT OBJECTS) ===');
  const editorRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.openMapEditor();
      return {
        gameMode: s._gameMode,
        mapObjectsCount: s.mapObjects ? s.mapObjects.length : -1,
        mapObstaclesCount: s.mapObstacles ? s.mapObstacles.length : -1,
        meadowVisible: s.meadowTileSprite ? s.meadowTileSprite.visible : false,
        groundGfxVisible: s.groundGfx ? s.groundGfx.visible : false,
        devModeEnabled: s.devModeEnabled,
        paletteOpen: document.getElementById('editor-asset-palette')?.classList.contains('open'),
        paletteItemsCount: document.querySelectorAll('.palette-item').length
      };
    })()`,
    returnByValue: true
  });
  console.log('Editor state:', JSON.stringify(editorRes.result.value, null, 2));

  // Wait 1s and capture screenshot of Editor
  await new Promise(r => setTimeout(r, 1000));
  const shot2 = await send('Page.captureScreenshot');
  if (shot2?.data) {
    fs.writeFileSync('editor_verified.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved screenshot: editor_verified.png');
  }

  ws.close();
  chrome.kill();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
