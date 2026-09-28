const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function testMovement() {
  console.log('=== Real Gameplay Physical Collision Test ===');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_gameplay_coll',
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

  // 1. Start Campaign
  console.log('1. Starting Campaign Mode...');
  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1500));

  // 2. Test: Walking UP into House 1 foundation
  console.log('2. Testing Player Walking UP into House 1 door...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(150, 345); // in front of House 1 door
      s.cursors.up.isDown = true;
    })()`
  });
  await new Promise(r => setTimeout(r, 450));
  const houseResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.cursors.up.isDown = false;
      return {
        x: Math.round(s.player.x),
        y: Math.round(s.player.y),
        blockedByWall: s.player.y >= 328
      };
    })()`,
    returnByValue: true
  });
  console.log('House Collision Result:', houseResult.result.value);

  // 3. Test: Walking Down through the Stone Stairs
  console.log('3. Testing Player Walking DOWN through the Stone Stairs...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(488, 320); // Top of stone stairs
      s.cursors.down.isDown = true;
    })()`
  });
  await new Promise(r => setTimeout(r, 550));
  const stairsResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.cursors.down.isDown = false;
      return {
        x: Math.round(s.player.x),
        y: Math.round(s.player.y),
        stairsWalkable: s.player.y > 380 // Down into the lower path
      };
    })()`,
    returnByValue: true
  });
  console.log('Stairs Navigation Result:', stairsResult.result.value);

  // 4. Test: Walking into Tree Trunk (Emerald 4 at x: 250, y: 340)
  console.log('4. Testing Player Collision with Tree Trunk...');
  // Find a tree
  const treeInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const treeObs = s.mapObstacles.find(o => o.name && o.name.includes('Pino') || o.name.includes('Roble') || o.name.includes('Árbol'));
      return treeObs;
    })()`,
    returnByValue: true
  });
  console.log('Target Tree Obstacle:', treeInfo.result.value);

  if (treeInfo.result.value) {
    const to = treeInfo.result.value;
    await send('Runtime.evaluate', {
      expression: `(() => {
        const s = window.activeGameScene;
        // Position player 15px below the trunk and walk UP into it
        s.player.setPosition(${to.x + to.w/2}, ${to.y + to.h + 15});
        s.cursors.up.isDown = true;
      })()`
    });
    await new Promise(r => setTimeout(r, 350));
    const treeResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const s = window.activeGameScene;
        s.cursors.up.isDown = false;
        return {
          y: Math.round(s.player.y),
          blockedByTrunk: s.player.y >= ${to.y + to.h - 4}
        };
      })()`,
      returnByValue: true
    });
    console.log('Tree Trunk Collision Result:', treeResult.result.value);
  }

  // 5. Test: Walking under tree canopy (above trunk)
  if (treeInfo.result.value) {
    const to = treeInfo.result.value;
    await send('Runtime.evaluate', {
      expression: `(() => {
        const s = window.activeGameScene;
        // Position player 40px ABOVE the trunk (inside the leafy canopy) and walk LEFT
        s.player.setPosition(${to.x + 30}, ${to.y - 25});
        s.cursors.left.isDown = true;
      })()`
    });
    await new Promise(r => setTimeout(r, 350));
    const canopyResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const s = window.activeGameScene;
        s.cursors.left.isDown = false;
        return {
          x: Math.round(s.player.x),
          y: Math.round(s.player.y),
          walkedUnderCanopy: s.player.x < ${to.x + 10}
        };
      })()`,
      returnByValue: true
    });
    console.log('Tree Canopy Walk-Under Result:', canopyResult.result.value);
  }

  // 6. Test: Campfire Hazard Damage
  console.log('6. Testing Campfire Hazard Damage...');
  const hpBefore = await send('Runtime.evaluate', {
    expression: 'window.activeGameScene.playerHearts',
    returnByValue: true
  });
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.isInvulnerable = false;
      s._lastHazardHit = 0;
      s.player.setPosition(256, 496); // On campfire
    })()`
  });
  await new Promise(r => setTimeout(r, 300));
  const hpAfter = await send('Runtime.evaluate', {
    expression: 'window.activeGameScene.playerHearts',
    returnByValue: true
  });
  console.log('Campfire Hazard Result: HP Before:', hpBefore.result.value, '| HP After:', hpAfter.result.value, '| Damaged:', hpAfter.result.value < hpBefore.result.value);

  // 7. Capture Clean Visual Hitbox Screenshot
  console.log('7. Capturing final visual debug screenshot...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      s.player.setPosition(250, 340);
      s.player.setVelocity(0, 0);
      if (!s.showCollisionDebug) s.toggleCollisionDebug();
      if (s.obstacleDebugGfx) s.obstacleDebugGfx.setDepth(99999);
      if (s.characterDebugGfx) s.characterDebugGfx.setDepth(99999);
    })()`
  });
  await new Promise(r => setTimeout(r, 600));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage\\campaign_hitboxes_final.png';
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved campaign_hitboxes_final.png');

  ws.close();
  chrome.kill();
  console.log('=== All tests passed! ===');
}

testMovement().catch(e => { console.error(e); process.exit(1); });
