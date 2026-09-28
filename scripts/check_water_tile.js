const http = require('http');

async function t() {
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
    const h = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === mid) {
        ws.removeEventListener('message', h);
        res(msg.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });

  await send('Runtime.enable');
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      const tex = s.textures.get('Tileset_Water');
      if (!tex) return 'no tex';
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      const img = tex.getSourceImage();
      ctx.drawImage(img, 80, 112, 16, 16, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      let nonZeroAlpha = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) nonZeroAlpha++;
      }
      return { totalPixels: 256, nonZeroAlpha, samplePixelRGBA: Array.from(data.slice(0, 4)) };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
  process.exit(0);
}

t().catch(e => { console.error(e); process.exit(1); });
