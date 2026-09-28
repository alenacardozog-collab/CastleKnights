const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_file_profile2',
    'file:///D:/prueba/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const tab = await new Promise(res => http.get('http://127.0.0.1:9222/json', r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d).find(x => x.type === 'page')));
  }));

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const mid = id++;
    const h = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === mid) {
        ws.removeEventListener('message', h);
        res(msg.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await new Promise(r => setTimeout(r, 3000));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      if (s) s.startCampaign();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  const shot = await send('Page.captureScreenshot');
  if (shot?.data) {
    fs.writeFileSync('file_screen.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot file_screen.png on file:// protocol!');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
