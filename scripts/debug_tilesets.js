const http = require('http');
const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\alen_\\AppData\\Local\\Temp\\chrome_ts_debug5',
    'http://localhost:3000/'
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
  await new Promise(r => setTimeout(r, 2500));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const s = window.activeGameScene;
        s.startCampaign();
        const map = s.tiledMap;

        const tsGround = map.tilesets.find(t => t.name === 'Tileset_Ground');
        const tsRoad = map.tilesets.find(t => t.name === 'Road');
        const tsWater = map.tilesets.find(t => t.name === 'Tileset_Water');

        return {
          tsGround: tsGround ? {
            name: tsGround.name,
            firstgid: tsGround.firstgid,
            total: tsGround.total,
            tileWidth: tsGround.tileWidth,
            tileHeight: tsGround.tileHeight,
            rows: tsGround.rows,
            columns: tsGround.columns,
            imageWidth: tsGround.image ? tsGround.image.width : null,
            imageHeight: tsGround.image ? tsGround.image.height : null,
            contains753: tsGround.containsTileIndex ? tsGround.containsTileIndex(753) : (753 >= tsGround.firstgid && 753 < tsGround.firstgid + tsGround.total)
          } : null,
          tsRoad: tsRoad ? {
            name: tsRoad.name,
            firstgid: tsRoad.firstgid,
            total: tsRoad.total,
            contains5397: (5397 >= tsRoad.firstgid && 5397 < tsRoad.firstgid + tsRoad.total)
          } : null,
          tsWater: tsWater ? {
            name: tsWater.name,
            firstgid: tsWater.firstgid,
            total: tsWater.total,
            contains5211: (5211 >= tsWater.firstgid && 5211 < tsWater.firstgid + tsWater.total)
          } : null,
          firstgid720Tilesets: map.tilesets.filter(t => t.firstgid <= 753 && t.firstgid + t.total > 753).map(t => ({ name: t.name, firstgid: t.firstgid, total: t.total }))
        };
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(res.result.value, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
