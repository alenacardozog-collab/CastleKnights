'use strict';
/* Braseros de la muralla sin la llama pintada debajo (15/11, nota 18 del dueño: "arreglar los png por debajo de la animación").
   Los dos braseros de la muralla traen el fuego dibujado. ck_fuegos_vivos.js lo tapa y pone encima la llama animada, pero
   su búsqueda (sólo el naranja fuerte con centro blanco) dejaba a la vista los naranjas y amarillos más apagados de la llama
   pintada, que se veían quietos alrededor de la que se mueve. Acá, en esas piezas, todo lo que es llama pasa a carbón y
   brasas dentro del cuenco (y lo que asomaba por arriba del borde se borra): queda sólo la llama animada.
   Va después de ck_fuegos_vivos.js. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PIEZA = /^ed_mu_brasero_(\d+)(_p\d+)?(_rc\d+)?$/;
  // por brasero: hasta qué fila (del dibujo) llega la llama, y desde qué fila empieza el cuenco (arriba de eso, se borra)
  const LLAMA = { 1: { hasta: 20, borde: 5 }, 2: { hasta: 19, borde: 4 } };
  const calido = (r, g, b) => (r >= 150 && r > g + 20 && b < 125) || (r > 215 && g > 150 && b < 160 && r > b + 60);

  const tapar = (S, o) => {
    const m = PIEZA.exec(o.texture.key), L = m && LLAMA[m[1]]; if (!L) return null;
    const f = o.frame, w = f.cutWidth, h = f.cutHeight, src = f.source.image || f.source.canvas; if (!src) return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, f.cutX, f.cutY, w, h, 0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    let n = 0;
    for (let y = 0; y < Math.min(h, L.hasta); y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (d[i + 3] < 40 || !calido(d[i], d[i + 1], d[i + 2])) continue;
      n++;
      if (y < L.borde) { d[i + 3] = 0; continue; }                        // lo que asomaba por arriba del borde
      const v = (d[i] + d[i + 1] + d[i + 2]) / 3, abajo = y >= L.hasta - 5;
      if (abajo && v > 150) { d[i] = 168; d[i + 1] = 54; d[i + 2] = 26; }  // brasas
      else if (abajo) { d[i] = 96; d[i + 1] = 34; d[i + 2] = 22; }
      else { d[i] = 44 + ((x * 7 + y * 3) % 3) * 6; d[i + 1] = 30; d[i + 2] = 28; }   // carbón al fondo del cuenco
    }
    if (!n) return null;
    g.putImageData(im, 0, 0);
    const key = 'ckbm_' + o.texture.key + '_' + Math.round(o.x) + '_' + Math.round(o.y);
    if (S.textures.exists(key)) S.textures.remove(key);
    S.textures.addCanvas(key, c);
    const t = S.add.image(o.x, o.y, key).setOrigin(o.originX, o.originY).setScale(o.scaleX, o.scaleY).setFlipX(!!o.flipX)
      .setDepth(o.depth + 0.015).setAlpha(o.alpha);
    t._ckfv = true;                                                        // (que ck_fuegos_vivos no lo tome por fuego)
    return t;
  };
  // el suelo también trae la llama dibujada donde la pieza recortada no llega: ahí cada tramo de llama de cada fila se rellena
  // con lo que tiene a los costados (la pared, el borde del cuenco)
  const SUELO = [[376, 174, 434, 222], [576, 174, 632, 222]], BOCA = 196;   // (BOCA: la fila del mapa donde empieza el cuenco)
  const suelo = (S, a) => {
    const gs = S.children.list.filter(o => o.type === 'Image' && o.visible && o.texture && o.frame && o.displayWidth > 600 && o.depth < a.y);
    const g0 = gs.find(o => /suelo/.test(o.texture.key)) || gs.sort((p, q) => q.depth - p.depth)[0];
    if (!g0) return [];
    const f = g0.frame, src = f.source.image || f.source.canvas; if (!src) return [];
    const sx = Math.abs(g0.scaleX) || 1, sy = Math.abs(g0.scaleY) || 1, left = g0.x - g0.displayWidth * g0.originX, top = g0.y - g0.displayHeight * g0.originY;
    return SUELO.map(([x0, y0, x1, y1]) => {
      const tx = Math.round((a.x + x0 - left) / sx), ty = Math.round((a.y + y0 - top) / sy), w = Math.round((x1 - x0) / sx), h = Math.round((y1 - y0) / sy);
      if (tx < 0 || ty < 0 || tx + w > f.cutWidth || ty + h > f.cutHeight) return null;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(src, f.cutX + tx, f.cutY + ty, w, h, 0, 0, w, h);
      const im = g.getImageData(0, 0, w, h), d = im.data, out = new Uint8ClampedArray(d.length);
      let n = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4; if (!calido(d[i], d[i + 1], d[i + 2])) continue;
          let e = x; while (e + 1 < w && calido(d[(y * w + e + 1) * 4], d[(y * w + e + 1) * 4 + 1], d[(y * w + e + 1) * 4 + 2])) e++;
          const i0 = (y * w + Math.max(0, x - 1)) * 4, i1 = (y * w + Math.min(w - 1, e + 1)) * 4;
          for (let q = x; q <= e; q++) {
            const k = (y * w + q) * 4, t = (q - x + 1) / (e - x + 2);
            if (y0 + y * sy >= BOCA) { out[k] = 44 + ((q * 7 + y * 3) % 3) * 6; out[k + 1] = 30; out[k + 2] = 28; }   // adentro del cuenco: carbón
            else for (let ch = 0; ch < 3; ch++) out[k + ch] = Math.round(d[i0 + ch] * (1 - t) + d[i1 + ch] * t);
            out[k + 3] = 255; n++;
          }
          x = e;
        }
      }
      if (!n) return null;
      const oi = g.createImageData(w, h); oi.data.set(out); g.clearRect(0, 0, w, h); g.putImageData(oi, 0, 0);
      const key = 'ckbm_suelo_' + x0 + '_' + y0;
      if (S.textures.exists(key)) S.textures.remove(key);
      S.textures.addCanvas(key, c);
      const t = S.add.image(a.x + x0, a.y + y0, key).setOrigin(0, 0).setScale(sx, sy).setDepth(g0.depth + 0.015);
      t._ckfv = true;
      return t;
    }).filter(Boolean);
  };
  const poner = S => {
    (S._ckBM || []).forEach(o => { try { o.destroy(); } catch (e) {} });
    S._ckBM = [];
    const a = S.currentInterior && S.currentInterior.area; if (!a) return;
    S.children.list.slice().forEach(o => {
      if (!o || !o.active || !o.visible || o.type !== 'Image' || !o.texture || !PIEZA.test(o.texture.key)) return;
      try { const t = tapar(S, o); if (t) { S._ckBM.push(t); (a.objs = a.objs || []).push(t); } } catch (e) { console.warn('[braseros]', e); }
    });
    try { suelo(S, a).forEach(t => { S._ckBM.push(t); (a.objs = a.objs || []).push(t); }); } catch (e) { console.warn('[braseros: suelo]', e); }
  };
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0 ? a0.apply(this, arguments) : undefined;
    try {
      const S = this, z = S.currentZoneKey && S.currentZoneKey();
      if (/muralla|castle\.walls/.test(z || '')) S.time.delayedCall(60, () => { if (S.currentZoneKey() === z) poner(S); });
    } catch (e) {}
    return r;
  };
  window.CK_BRASEROS_MURALLA = { poner, LLAMA };
})();
