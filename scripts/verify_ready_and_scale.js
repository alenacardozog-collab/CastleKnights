const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alen_\\.gemini\\antigravity-ide\\brain\\ba07de83-dfb9-4127-a1bb-3479cacbabab\\.tempmediaStorage';

async function verify() {
  console.log('=== Starting Ready Button & Character Scale Verification ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_ready_scale_test',
    '--disable-gpu',
    '--window-size=1280,720',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2200));

  const tab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = ''; res.on('data', c => d += c);
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
  await new Promise(r => setTimeout(r, 2000));

  async function takeScreenshot(name) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(fullPath, Buffer.from(shot.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${name}`);
    return fullPath;
  }

  // --- TEST 1: PRACTICE MODE ---
  console.log('\n--- 1. Testing Practice Mode ---');
  await send('Runtime.evaluate', {
    expression: 'window.activeGameScene.startPractice()'
  });
  await new Promise(r => setTimeout(r, 600));

  const practiceInit = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const readyEl = document.getElementById('ready-prompt-container');
      return {
        readyForCombat: s.readyForCombat,
        enemiesCount: s.enemies.countActive(),
        playerScale: s.player.scaleX,
        promptHidden: readyEl.classList.contains('hidden'),
        btnText: document.getElementById('btn-ready-combat')?.textContent.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('Practice Init State:', practiceInit.result.value);
  if (practiceInit.result.value.readyForCombat !== false) throw new Error('readyForCombat should be false!');
  if (practiceInit.result.value.enemiesCount !== 0) throw new Error('enemiesCount should be 0 before clicking ready!');
  if (practiceInit.result.value.promptHidden !== false) throw new Error('Prompt should be visible!');
  if (practiceInit.result.value.playerScale !== 1.2) throw new Error('Player scale should be 1.20!');

  await takeScreenshot('test_practice_ready_prompt.png');

  // Click "¡ESTOY LISTO!" button in Practice
  console.log('Clicking #btn-ready-combat in Practice...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-ready-combat').click()`
  });
  await new Promise(r => setTimeout(r, 600));

  const practiceAfterClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const readyEl = document.getElementById('ready-prompt-container');
      return {
        readyForCombat: s.readyForCombat,
        enemiesCount: s.enemies.countActive(),
        promptHidden: readyEl.classList.contains('hidden')
      };
    })()`,
    returnByValue: true
  });
  console.log('Practice After Click State:', practiceAfterClick.result.value);
  if (practiceAfterClick.result.value.readyForCombat !== true) throw new Error('readyForCombat should be true!');
  if (practiceAfterClick.result.value.enemiesCount !== 2) throw new Error('enemiesCount should be 2 after clicking ready!');
  if (practiceAfterClick.result.value.promptHidden !== true) throw new Error('Prompt should be hidden!');

  await takeScreenshot('test_practice_combat_active.png');

  // --- TEST 2: CAMPAIGN MODE ---
  console.log('\n--- 2. Testing Campaign Mode ---');
  await send('Runtime.evaluate', {
    expression: 'window.activeGameScene.startCampaign()'
  });
  await new Promise(r => setTimeout(r, 1200));

  const campaignInit = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const readyEl = document.getElementById('ready-prompt-container');
      return {
        mode: s._gameMode,
        readyForCombat: s.readyForCombat,
        enemiesCount: s.enemies.countActive(),
        playerScale: s.player.scaleX,
        promptHidden: readyEl.classList.contains('hidden'),
        btnText: document.getElementById('btn-ready-combat')?.textContent.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('Campaign Init State:', campaignInit.result.value);
  if (campaignInit.result.value.readyForCombat !== false) throw new Error('Campaign readyForCombat should be false!');
  if (campaignInit.result.value.enemiesCount !== 0) throw new Error('Campaign enemiesCount should be 0 before clicking ready!');
  if (campaignInit.result.value.promptHidden !== false) throw new Error('Campaign prompt should be visible!');
  if (campaignInit.result.value.playerScale !== 1.2) throw new Error('Campaign player scale should be 1.20!');

  await takeScreenshot('test_campaign_ready_prompt.png');

  // Click "¡ESTOY LISTO!" in Campaign
  console.log('Clicking #btn-ready-combat in Campaign...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-ready-combat').click()`
  });
  await new Promise(r => setTimeout(r, 600));

  const campaignAfterClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const readyEl = document.getElementById('ready-prompt-container');
      const enemies = s.enemies.getChildren().map(e => ({
        type: e.type,
        x: Math.round(e.x),
        y: Math.round(e.y),
        scale: e.scaleX
      }));
      return {
        readyForCombat: s.readyForCombat,
        enemiesCount: s.enemies.countActive(),
        promptHidden: readyEl.classList.contains('hidden'),
        enemies
      };
    })()`,
    returnByValue: true
  });
  console.log('Campaign After Click State:', campaignAfterClick.result.value);
  if (campaignAfterClick.result.value.readyForCombat !== true) throw new Error('Campaign readyForCombat should be true!');
  if (campaignAfterClick.result.value.enemiesCount < 2) throw new Error('Campaign enemiesCount should be at least 2!');
  if (campaignAfterClick.result.value.enemies[0].scale !== 1.2) throw new Error('Enemy scale should be 1.20!');

  await takeScreenshot('test_campaign_combat_active.png');

  // --- TEST 3: HERO SWITCHING & SCALING ---
  console.log('\n--- 3. Testing Hero Switching (Soldier -> Orc) ---');
  await send('Runtime.evaluate', {
    expression: `window.activeGameScene.switchHero('orc')`
  });
  await new Promise(r => setTimeout(r, 500));

  const orcState = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      return {
        hero: s.playerHero,
        scale: s.player.scaleX,
        bodyW: s.player.body.width,
        bodyH: s.player.body.height
      };
    })()`,
    returnByValue: true
  });
  console.log('Orc Hero State:', orcState.result.value);
  if (orcState.result.value.hero !== 'orc') throw new Error('Hero should be orc!');
  if (orcState.result.value.scale !== 1.2) throw new Error('Orc scale should be 1.20!');

  await takeScreenshot('test_campaign_orc_hero.png');

  console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===');
  ws.close();
  chrome.kill();
}

verify().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
