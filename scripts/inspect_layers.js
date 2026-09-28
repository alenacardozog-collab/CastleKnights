const http = require('http');

async function check() {
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

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.activeGameScene;
      if (!s) return 'no scene';
      return {
        gameMode: s._gameMode,
        layers: ['layerGround','layerWater','layerRoad','layerFlowers','layerRockSlopes','layerShadows'].map(k => {
          const l = s[k];
          if (!l) return { key: k, exists: false };
          return {
            key: k,
            visible: l.visible,
            depth: l.depth,
            alpha: l.alpha,
            width: l.width,
            height: l.height,
            tilesets: l.tileset ? l.tileset.map(t => ({ name: t.name, total: t.total, imageKey: t.image ? t.image.key : null })) : []
          };
        }),
        allChildrenDepths: s.children.list.map(c => ({
          type: c.type,
          depth: c.depth,
          visible: c.visible,
          alpha: c.alpha,
          texture: c.texture ? c.texture.key : null
        })).slice(0, 30)
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  process.exit(0);
}

check();
