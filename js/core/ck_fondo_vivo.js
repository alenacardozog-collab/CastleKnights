'use strict';
/* Fondos vivos para las pantallas de carga (08/11, pedido del dueño: "probá hacer una tipo animación de fondo para pantalla de
   carga"). Toma una imagen quieta (un concepto de Flow pasado a píxel, 480x270) y la anima por código, sin gastar créditos:
   - NUBES: el cielo (se lo encuentra solo: lo claro conectado con el borde de arriba) corre despacio; lo de adelante
     (torres, riscos) queda quieto y tapa.
   - AGUA: los píxeles azules titilan como corriente (los brillos bajan en diagonal), con los mismos colores del agua.
   - BANDERAS: la tela roja ondea (luces y sombras que pasan).
   - FUEGO: en los puntos que se le pasan, una llama de píxeles que baila, su resplandor que late y humo que sube.
   - RAYOS: haces de sol finos que respiran desde una esquina.
   Uso: CK_FONDO_VIVO.crear(imagen, opciones) devuelve { canvas, cuadro(ms) }. Lo usa ck_pantalla_carga.js; los fondos y
   sus opciones están en ck_pantalla_carga_arte.js. Sin ese archivo no hace nada. */
(function () {
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const crear = (img, op) => {
    op = op || {};
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const base = g.getImageData(0, 0, W, H), B = base.data, out = g.createImageData(W, H), O = out.data;

    // ---------------------------------------------------------------- máscaras
    const cielo = new Uint8Array(W * H), agua = [], tela = [];
    if (op.nubes) {
      // el cielo: claro y parecido a su vecino, conectado con el borde de arriba (las líneas oscuras lo frenan)
      const cola = [], lim = op.cieloHasta || Math.round(H * 0.6);
      for (let x = 0; x < W; x++) { const i = x; if (lum(B[i * 4], B[i * 4 + 1], B[i * 4 + 2]) > 120) { cielo[i] = 1; cola.push(i); } }
      let qi = 0;
      while (qi < cola.length) {
        const i = cola[qi++], x = i % W, y = (i - x) / W;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= lim) return;
          const j = ny * W + nx; if (cielo[j]) return;
          const d = Math.abs(B[i * 4] - B[j * 4]) + Math.abs(B[i * 4 + 1] - B[j * 4 + 1]) + Math.abs(B[i * 4 + 2] - B[j * 4 + 2]);
          if (d < 36 && lum(B[j * 4], B[j * 4 + 1], B[j * 4 + 2]) > 110) { cielo[j] = 1; cola.push(j); }
        });
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, r = B[i * 4], gg = B[i * 4 + 1], b = B[i * 4 + 2];
      if (op.agua !== false && !cielo[i] && b > r + 25 && b > gg - 6 && b > 80) agua.push(i);
      if (op.banderas !== false && r > 140 && r > gg * 1.7 && r > b * 1.7 && (!op.fuego || !op.fuego.some(([fx, fy]) => Math.abs(fx - x) < 16 && Math.abs(fy - y) < 22))) tela.push(i);
    }
    // la rampa del agua: sus colores de oscuro a claro (para subir o bajar un paso)
    const colAgua = new Map();
    agua.forEach(i => { const k = (B[i * 4] << 16) | (B[i * 4 + 1] << 8) | B[i * 4 + 2]; colAgua.set(k, lum(B[i * 4], B[i * 4 + 1], B[i * 4 + 2])); });
    const rampa = [...colAgua.entries()].sort((a, b) => a[1] - b[1]).map(e => e[0]);
    const pos = new Map(rampa.map((k, n) => [k, n]));
    const paso = (i, d) => { const k = (B[i * 4] << 16) | (B[i * 4 + 1] << 8) | B[i * 4 + 2], n = Math.max(0, Math.min(rampa.length - 1, pos.get(k) + d)); return rampa[n]; };
    // el cielo para correr: cada fila de cielo, con los huecos (torres, riscos) rellenos con el último color de cielo
    let capaCielo = null, mascara = null;
    if (op.nubes) {
      capaCielo = document.createElement('canvas'); capaCielo.width = W; capaCielo.height = H;
      const gc = capaCielo.getContext('2d'), id = gc.createImageData(W, H), D = id.data;
      // los huecos se rellenan con el cielo de al lado espejado (como si las nubes siguieran detrás de la torre): al correr
      // no aparecen rayas
      for (let y = 0; y < H; y++) {
        let hay = false;
        for (let x = 0; x < W; x++) if (cielo[y * W + x]) { hay = true; break; }
        if (!hay) continue;
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          let s = i;
          if (!cielo[i]) {
            let izq = x; while (izq >= 0 && !cielo[y * W + izq]) izq--;
            let der = x; while (der < W && !cielo[y * W + der]) der++;
            const k = izq >= 0 ? x - izq : der - x, desde = izq >= 0 ? izq : der, dir = izq >= 0 ? -1 : 1;
            let sx = desde + dir * (k - 1), n = 0;
            while ((sx < 0 || sx >= W || !cielo[y * W + sx]) && n++ < 6) sx = desde + dir * ((k - 1) % Math.max(1, n * 7));
            if (sx < 0 || sx >= W || !cielo[y * W + sx]) sx = desde;
            s = y * W + sx;
          }
          D[i * 4] = B[s * 4]; D[i * 4 + 1] = B[s * 4 + 1]; D[i * 4 + 2] = B[s * 4 + 2]; D[i * 4 + 3] = 255;
        }
      }
      gc.putImageData(id, 0, 0);
      mascara = document.createElement('canvas'); mascara.width = W; mascara.height = H;
      const gm = mascara.getContext('2d'), im = gm.createImageData(W, H);
      for (let i = 0; i < W * H; i++) if (cielo[i]) im.data[i * 4 + 3] = 255;
      gm.putImageData(im, 0, 0);
    }
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const gt = tmp.getContext('2d');

    // ---------------------------------------------------------------- fuego: llama de píxeles por código
    const humo = [];
    const llama = (x0, y0, t, k) => {
      const ancho = 7 * k, alto = 13 * k;
      for (let dx = -ancho; dx <= ancho; dx++) {
        const f = 1 - Math.abs(dx) / (ancho + 1), ruido = 0.7 + 0.3 * Math.sin(t * 0.023 + dx * 1.7) * Math.sin(t * 0.011 + dx * 0.9);
        const h = Math.round(alto * f * f * ruido + 2);
        for (let dy = 0; dy < h; dy++) {
          const q = dy / h, x = x0 + dx, y = y0 - dy;
          const c = q < 0.35 && Math.abs(dx) < ancho * 0.45 ? '#fff4c2' : q < 0.6 ? '#ffd25a' : q < 0.85 ? '#ff8a2a' : '#c8341a';
          g.fillStyle = c; g.fillRect(x, y, 1, 1);
        }
      }
    };

    const cuadro = t => {
      O.set(B);
      // agua: brillos que corren en diagonal
      if (agua.length) {
        const dx = (op.corriente || [0.45, 0.9])[0], dy = (op.corriente || [0.45, 0.9])[1];
        agua.forEach(i => {
          const x = i % W, y = (i - x) / W, f = Math.sin(x * dx * 0.55 + y * dy * 0.55 - t * 0.0075 + Math.sin(x * 0.21 + y * 0.13) * 1.6);
          const d = f > 0.82 ? 2 : f > 0.55 ? 1 : f < -0.88 ? -1 : 0;
          if (d) { const c = paso(i, d); O[i * 4] = c >> 16; O[i * 4 + 1] = (c >> 8) & 255; O[i * 4 + 2] = c & 255; }
        });
      }
      // banderas: luz que pasa por la tela
      tela.forEach(i => {
        const x = i % W, y = (i - x) / W, m = 1 + 0.18 * Math.sin(t * 0.006 + y * 0.55 - x * 0.4);
        O[i * 4] = Math.min(255, B[i * 4] * m); O[i * 4 + 1] = Math.min(255, B[i * 4 + 1] * m); O[i * 4 + 2] = Math.min(255, B[i * 4 + 2] * m);
      });
      g.putImageData(out, 0, 0);
      // nubes: el cielo corre y lo de adelante lo tapa
      if (capaCielo) {
        const off = ((t * (op.nubes || 0.006)) % W + W) % W;
        gt.clearRect(0, 0, W, H);
        gt.globalCompositeOperation = 'source-over';
        gt.drawImage(capaCielo, -off, 0); gt.drawImage(capaCielo, W - off, 0);
        gt.globalCompositeOperation = 'destination-in'; gt.drawImage(mascara, 0, 0);
        g.drawImage(tmp, 0, 0);
      }
      // rayos de sol
      if (op.rayos) {
        const [sx, sy] = op.rayos.desde || [0, 0];
        g.save(); g.globalCompositeOperation = 'lighter';
        (op.rayos.angulos || [0.55, 0.72, 0.9]).forEach((a, n) => {
          const al = (0.05 + 0.035 * Math.sin(t * 0.0014 + n * 2.1)) * (op.rayos.fuerza || 1);
          g.fillStyle = `rgba(255,214,150,${al.toFixed(3)})`;
          g.beginPath(); g.moveTo(sx, sy);
          const L = W * 1.4, w = 0.035 + n * 0.012;
          g.lineTo(sx + Math.cos(a - w) * L, sy + Math.sin(a - w) * L); g.lineTo(sx + Math.cos(a + w) * L, sy + Math.sin(a + w) * L);
          g.closePath(); g.fill();
        });
        g.restore();
      }
      // fuego: resplandor, llama y humo
      (op.fuego || []).forEach(([fx, fy, k], n) => {
        k = k || 1;
        const late = 0.75 + 0.25 * Math.sin(t * 0.017 + n) * Math.sin(t * 0.007);
        g.save(); g.globalCompositeOperation = 'lighter';
        const gr = g.createRadialGradient(fx, fy - 4, 1, fx, fy - 4, 34 * k);
        gr.addColorStop(0, `rgba(255,170,70,${(0.35 * late).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = gr; g.fillRect(fx - 40 * k, fy - 44 * k, 80 * k, 80 * k);
        g.restore();
        llama(fx, fy, t, k);
        if (Math.random() < 0.12) humo.push({ x: fx + (Math.random() - 0.5) * 3, y: fy - 12 * k, t0: t, v: 0.012 + Math.random() * 0.008 });
        if (Math.random() < 0.3) humo.push({ x: fx + (Math.random() - 0.5) * 8, y: fy - 6, t0: t, v: 0.03, chispa: true });
      });
      for (let n = humo.length - 1; n >= 0; n--) {
        const h = humo[n], e = t - h.t0, vida = h.chispa ? 700 : 2600;
        if (e > vida || e < 0) { humo.splice(n, 1); continue; }
        const y = h.y - e * h.v, x = h.x + Math.sin(e * 0.004 + h.t0) * (h.chispa ? 2 : 4) * (e / vida), a = 1 - e / vida;
        g.fillStyle = h.chispa ? `rgba(255,200,90,${a.toFixed(2)})` : `rgba(190,185,180,${(a * 0.5).toFixed(2)})`;
        const s = h.chispa ? 1 : 2 + Math.floor(e / 900);
        g.fillRect(Math.round(x), Math.round(y), s, s);
      }
    };
    cuadro(0);
    return { canvas: cv, cuadro, W, H, info: { cielo: cielo.reduce((a, v) => a + v, 0), agua: agua.length, tela: tela.length } };
  };
  window.CK_FONDO_VIVO = { crear };
})();
