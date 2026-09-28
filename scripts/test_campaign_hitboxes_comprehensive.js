const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function run() {
  console.log('=== Starting Comprehensive Campaign Hitbox Test ===');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_hitbox_comp',
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
  await new Promise(r => setTimeout(r, 1500));

  // 1. Start Campaign Mode
  console.log('1. Starting Campaign Mode...');
  await send('Runtime.evaluate', { expression: 'window.activeGameScene.startCampaign()' });
  await new Promise(r => setTimeout(r, 1500));

  // 2. Check Active Colliders
  console.log('2. Inspecting Physics Colliders...');
  const collCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const colliders = s.physics.world.colliders.getActive();
      const summary = colliders.map(c => {
        let o1 = 'other';
        if (c.object1 === s.player) o1 = 'player';
        else if (c.object1 === s.enemies) o1 = 'enemies';
        else if (c.object1 === s.projectiles) o1 = 'projectiles';

        let o2 = 'other';
        if (c.object2 === s.obstacles) o2 = 'obstacles';
        else if (c.object2 === s.waterObstacles) o2 = 'waterObstacles';
        else if (c.object2 === s.lowObstacles) o2 = 'lowObstacles';
        else if (c.object2 === s.hazardZones) o2 = 'hazardZones';
        else if (c.object2 === s.slowZones) o2 = 'slowZones';
        else if (c.object2 === s.enemies) o2 = 'enemies';

        return { o1, o2, active: c.active };
      });
      return {
        totalActiveColliders: colliders.length,
        hasPlayerObstacles: colliders.some(c => c.object1 === s.player && c.object2 === s.obstacles),
        hasPlayerWater: colliders.some(c => c.object1 === s.player && c.object2 === s.waterObstacles),
        hasPlayerLow: colliders.some(c => c.object1 === s.player && c.object2 === s.lowObstacles),
        hasEnemyObstacles: colliders.some(c => c.object1 === s.enemies && c.object2 === s.obstacles),
        hasEnemyWater: colliders.some(c => c.object1 === s.enemies && c.object2 === s.waterObstacles),
        hasEnemyLow: colliders.some(c => c.object1 === s.enemies && c.object2 === s.lowObstacles),
        hasArrowObstacles: colliders.some(c => c.object1 === s.projectiles && c.object2 === s.obstacles),
        hasPlayerHazard: colliders.some(c => c.object1 === s.player && c.object2 === s.hazardZones),
        obstacleCount: s.obstacles.getChildren().length,
        waterCount: s.waterObstacles.getChildren().length,
        lowCount: s.lowObstacles.getChildren().length,
        hazardCount: s.hazardZones.getChildren().length
      };
    })()`,
    returnByValue: true
  });
  console.log('Colliders Status:', JSON.stringify(collCheck.result.value, null, 2));

  // 3. Test Physical Collision Against House 1 (Walking UP into the house)
  console.log('3. Testing Physical Collision: Walking UP into House 1 foundation...');
  const houseTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Position player just in front of House 1 door (x: 112, y: 345)
      s.player.setPosition(112, 345);
      s.player.setVelocity(0, -180);

      // Step physics 25 frames
      const initialY = s.player.y;
      for (let i = 0; i < 25; i++) {
        s.physics.world.step(1/60);
      }
      s.player.setVelocity(0, 0);
      const finalY = s.player.y;
      return {
        initialY,
        finalY,
        blockedByWall: finalY > 328, // House foundation stops player at y >= 329
        deltaY: finalY - initialY
      };
    })()`,
    returnByValue: true
  });
  console.log('House Collision Test Result:', JSON.stringify(houseTest.result.value, null, 2));

  // 4. Test Physical Collision: Walking Down the Stone Stairs
  console.log('4. Testing Physical Navigation: Walking DOWN through the Stone Stairs...');
  const stairsTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Position player at top of stairs (x: 488, y: 310)
      s.player.setPosition(488, 310);
      s.player.setVelocity(0, 160);

      const initialY = s.player.y;
      for (let i = 0; i < 35; i++) {
        s.physics.world.step(1/60);
      }
      s.player.setVelocity(0, 0);
      const finalY = s.player.y;
      return {
        initialY,
        finalY,
        stairsWalkable: finalY > 375, // Player freely walked down through the entire flight of stairs
        deltaY: finalY - initialY
      };
    })()`,
    returnByValue: true
  });
  console.log('Stairs Navigation Test Result:', JSON.stringify(stairsTest.result.value, null, 2));

  // 5. Test Physical Collision: Walking into Water Pond
  console.log('5. Testing Physical Collision: Walking into Water Pond...');
  const waterTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Position player right above bottom pond (x: 100, y: 470) and walk DOWN into water (starts at y: 480)
      s.player.setPosition(100, 465);
      s.player.setVelocity(0, 160);

      const initialY = s.player.y;
      for (let i = 0; i < 30; i++) {
        s.physics.world.step(1/60);
      }
      s.player.setVelocity(0, 0);
      const finalY = s.player.y;
      return {
        initialY,
        finalY,
        stoppedByWater: finalY <= 480, // Player cannot enter the pond
        deltaY: finalY - initialY
      };
    })()`,
    returnByValue: true
  });
  console.log('Water Barrier Test Result:', JSON.stringify(waterTest.result.value, null, 2));

  // 6. Test Arrow Flying Over Water
  console.log('6. Testing Arrow Flying Over Water...');
  const arrowTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      // Spawn an arrow at (100, 460) flying DOWN over the pond (y: 480..560)
      const arrow = s.projectiles.create(100, 460, 'arrow');
      arrow.setVelocity(0, 400);

      // Step physics 20 frames
      for (let i = 0; i < 20; i++) {
        s.physics.world.step(1/60);
      }
      const aliveOverWater = arrow.active && arrow.y > 500;
      arrow.destroy();
      return {
        arrowAliveOverWater: aliveOverWater
      };
    })()`,
    returnByValue: true
  });
  console.log('Arrow Flying Over Water Result:', JSON.stringify(arrowTest.result.value, null, 2));

  // 7. Enable Visual Collision Debug & Take High-Res Screenshot
  console.log('7. Capturing visual collision debug screenshot...');
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
  const outPath = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage\\campaign_hitboxes_perfect.png';
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved campaign_hitboxes_perfect.png');

  ws.close();
  chrome.kill();
  console.log('=== All tests finished ===');
}

run().catch(e => { console.error(e); process.exit(1); });
