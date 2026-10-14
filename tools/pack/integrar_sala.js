/* Integra la imagen original de una sala del Taller (Google Flow) en el juego. Corre en la página del juego
   (consola del navegador, con el juego abierto desde npm start), porque necesita decodificar el JPG/PNG original.

   Qué hace:
   1. Reduce el original al tamaño del mapa (2000 px -> 400 px = bloques de 5x5) con la mediana de cada bloque: limpia el
      ruido del JPG y deja el píxel nítido. Ese es el piso nuevo, CON los muebles (no se borra nada).
   2. Cada mueble recortado del mapa (items del editor) se alinea con su silueta en el original (busca el corrimiento de
      hasta 10 px que mejor coincide) y se vuelve a recortar del original en ese lugar: el mueble y el piso coinciden
      píxel por píxel, así que no quedan huecos ni bordes dobles.
   3. Capas delanteras (opcional): rectángulos del original que tapan al héroe cuando pasa detrás. Solo sirven para cosas
      altas por delante de un lugar caminable (un arco, una columna): una baranda baja nunca tapa a quien está detrás, y el
      rectángulo le pondría piso encima.

   Uso (consola):  await integrarSala({ mapa: 'aposentos_del_rey', original: 'assets/fuentes/salas/aposentos_del_rey.jpg' })
   El resultado se guarda como assets/fuentes/salas/sala_<mapa>.json y se empaqueta con npm run build:salas.
   Devuelve un objeto que tools/pack/pack_salas.js convierte en js/maps/data/salas_castillo_assets.js. */
window.integrarSala = async function (o) {
  const A = window.EDITOR_ASSETS, D = window.EDITOR_DATA, m = D.mapas[o.mapa];
  const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // 1. original reducido con la mediana de cada bloque
  const im = await cargar(o.original), f = Math.round(im.width / m.w);
  const big = lienzo(im.width, im.height), gb = big.getContext('2d');
  gb.drawImage(im, 0, 0);
  const src = gb.getImageData(0, 0, im.width, im.height).data, W = m.w, H = m.h;
  const suelo = lienzo(W, H), gs = suelo.getContext('2d'), out = gs.createImageData(W, H), mid = Math.floor(f * f / 2), v = new Array(f * f);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      for (let c = 0; c < 3; c++) {
        let n = 0;
        for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) v[n++] = src[((y * f + j) * im.width + x * f + i) * 4 + c];
        v.sort((p, q) => p - q);
        out.data[(y * W + x) * 4 + c] = v[mid];
      }
      out.data[(y * W + x) * 4 + 3] = 255;
    }
  gs.putImageData(out, 0, 0);
  const O = out.data;

  // 2. cada mueble, alineado con el original y recortado de él
  const piezas = [], informe = [];
  for (const it of m.items || []) {
    const [key, x, y] = it;
    if (!A[key]) continue;
    const pic = await cargar(A[key]), w = pic.width, h = pic.height;
    const cm = lienzo(w, h), gm = cm.getContext('2d');
    gm.drawImage(pic, 0, 0);
    const P = gm.getImageData(0, 0, w, h).data, x0 = Math.round(x - w / 2), y0 = Math.round(y - h);
    let mejor = { d: 1e9, dx: 0, dy: 0 };
    for (let dy = -10; dy <= 10; dy++)
      for (let dx = -10; dx <= 10; dx++) {
        let s = 0, n = 0;
        for (let j = 0; j < h; j += 1)
          for (let i = 0; i < w; i += 1) {
            const k = (j * w + i) * 4;
            if (P[k + 3] < 128) continue;
            const X = x0 + dx + i, Y = y0 + dy + j;
            if (X < 0 || Y < 0 || X >= W || Y >= H) { s += 255; n++; continue; }
            const q = (Y * W + X) * 4;
            s += Math.abs(P[k] - O[q]) + Math.abs(P[k + 1] - O[q + 1]) + Math.abs(P[k + 2] - O[q + 2]);
            n++;
          }
        const d = n ? s / n : 1e9;
        if (d < mejor.d) mejor = { d, dx, dy };
      }
    const cut = lienzo(w, h), gc = cut.getContext('2d'), C = gc.createImageData(w, h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = (j * w + i) * 4, X = x0 + mejor.dx + i, Y = y0 + mejor.dy + j;
        if (P[k + 3] < 128 || X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const q = (Y * W + X) * 4;
        C.data[k] = O[q]; C.data[k + 1] = O[q + 1]; C.data[k + 2] = O[q + 2]; C.data[k + 3] = 255;
      }
    gc.putImageData(C, 0, 0);
    piezas.push({ key, x: x + mejor.dx, y: y + mejor.dy, img: cut.toDataURL('image/png') });
    informe.push(key + ': corrido ' + mejor.dx + ',' + mejor.dy + ' (diferencia ' + mejor.d.toFixed(0) + ')');
  }

  // 3. capas delanteras (rectángulos del original con su línea de pie abajo)
  const capas = (o.capas || []).map(c => {
    const cc = lienzo(c.w, c.h);
    cc.getContext('2d').drawImage(suelo, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    return { key: 'ck_' + o.mapa + '_' + c.nombre, x: c.x + c.w / 2, y: c.y + c.h, img: cc.toDataURL('image/png') };
  });

  const g0 = A['ed_suelo_' + o.mapa] || '';
  return { mapa: o.mapa, base: g0.length + ':' + g0.slice(-40), suelo: suelo.toDataURL('image/png'), piezas, capas, informe };
};
