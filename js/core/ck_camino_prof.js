'use strict';
/* Camino al Castillo: pasar por delante y por detrás de forma natural.
   - Cada objeto ordena por su punto de apoyo (ruedas, raíces, pie de la cerca), no por el borde de abajo
     de su imagen (que incluía la sombra): el héroe ya no queda "debajo de la sombra".
   - Los bosques grandes se parten en franjas según dónde apoya cada árbol: se puede pasar delante de los
     árboles de atrás y detrás de los de adelante.
   - La carreta y el roble chocan sólo en su huella (ruedas/base y tronco): se puede pasar detrás.
   No toca los datos del editor: se aplica al armar el mapa en el juego. Sacar la línea de index.html lo deshace. */
(function () {
  if (typeof INTERIOR_LAYOUTS === 'undefined') return;
  const KIND = 'ed_camino_al_castillo';
  const orig = INTERIOR_LAYOUTS[KIND];
  if (!orig) return;

  // punto de apoyo (fila de la imagen, desde arriba) de cada objeto
  const APOYO = {
    ed_cc_carreta: 57,
    ed_cc_roble: 134,
    ed_cc_arbol_escalera: 119,
    ed_cc_tronco_arriba: 22,
    ed_cc_tronco_izq: 58,
    ed_cc_tronco_der: 64,
    ed_cc_barriles: 39,
    ed_cc_cerca: 95
  };
  const BOSQUES = ['ed_cc_bosque_cabana', 'ed_cc_bosque_norte', 'ed_cc_bosque_sur'];
  // colisiones viejas que tapaban la caja de la carreta y la copa del roble
  const QUITAR = [
    [336, 184, 8, 56], [328, 208, 8, 56], [296, 224, 8, 32], [304, 232, 8, 16], [288, 240, 8, 24], [312, 240, 16, 24],
    [344, 240, 8, 16], [336, 248, 8, 24], [352, 248, 32, 16], [280, 256, 8, 32], [272, 264, 8, 8], [304, 264, 16, 8],
    [288, 272, 8, 32], [312, 272, 16, 24], [352, 280, 16, 24], [296, 288, 8, 16], [336, 288, 8, 16], [320, 296, 16, 16],
    [344, 296, 8, 8], [328, 312, 24, 8], [336, 320, 32, 8],
    [744, 440, 48, 16], [736, 448, 8, 16], [712, 456, 24, 16], [784, 456, 8, 40], [712, 472, 16, 24], [728, 480, 56, 16]
  ];
  // huellas nuevas: ruedas y base de la carreta, tronco del roble
  const AGREGAR = [
    [737, 476, 60, 19],
    [316, 322, 24, 14]
  ];
  const ALTO_COPA = 44, // de una fila de copa a la base de su árbol, como mucho
    PASO = 10; // franjas de 10 px de profundidad

  const cache = (window.CK_PARTES = window.CK_PARTES || {}); // la nieve (ck_nieve.js) lo usa para no marcar los cortes de las franjas
  // parte un bosque en franjas: cada píxel ordena por la base del árbol al que pertenece
  // (el final del tramo opaco que tiene debajo, pero no más de ALTO_COPA más abajo)
  const partir = (s, key) => {
    if (cache[key]) return cache[key];
    if (!s || !s.textures.exists(key)) return null;
    const img = s.textures.get(key).getSourceImage(),
      w = img.width,
      h = img.height;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, w, h).data;
    const grupo = new Int16Array(w * h).fill(-1);
    const cajas = {};
    for (let x = 0; x < w; x++) {
      let fin = -1;
      for (let y = h - 1; y >= 0; y--) {
        const i = y * w + x;
        if (px[i * 4 + 3] > 8) {
          if (fin < 0) fin = y;
          const base = Math.min(fin, y + ALTO_COPA),
            g = Math.floor(base / PASO);
          grupo[i] = g;
          const c = cajas[g] || (cajas[g] = { x0: x, y0: y, x1: x, y1: y, base: 0 });
          if (x < c.x0) c.x0 = x;
          if (x > c.x1) c.x1 = x;
          if (y < c.y0) c.y0 = y;
          if (y > c.y1) c.y1 = y;
          if (base > c.base) c.base = base;
        } else fin = -1;
      }
    }
    const partes = [];
    Object.keys(cajas).forEach(g => {
      const c = cajas[g],
        pw = c.x1 - c.x0 + 1,
        ph = c.y1 - c.y0 + 1,
        k = key + '_p' + g;
      if (!s.textures.exists(k)) {
        const t = s.textures.createCanvas(k, pw, ph),
          tc = t.getContext(),
          out = tc.createImageData(pw, ph),
          o = out.data,
          gi = +g;
        for (let y = c.y0; y <= c.y1; y++)
          for (let x = c.x0; x <= c.x1; x++) {
            const i = y * w + x;
            if (grupo[i] !== gi) continue;
            const j = ((y - c.y0) * pw + (x - c.x0)) * 4;
            o[j] = px[i * 4];
            o[j + 1] = px[i * 4 + 1];
            o[j + 2] = px[i * 4 + 2];
            o[j + 3] = px[i * 4 + 3];
          }
        tc.putImageData(out, 0, 0);
        t.refresh();
      }
      partes.push({ key: k, x0: c.x0, y0: c.y0, w: pw, h: ph, base: c.base });
    });
    return (cache[key] = { w, h, partes });
  };

  const igual = (a, b) => a.x === b[0] && a.y === b[1] && a.w === b[2] && a.h === b[3];

  INTERIOR_LAYOUTS[KIND] = function (kit) {
    const r = orig.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.main,
        s = window.activeGameScene;
      if (!a || !s) return r;
      const items = [];
      a.items.forEach(it => {
        const tex = it.key && s.textures.exists(it.key) ? s.textures.get(it.key).getSourceImage() : null;
        if (tex && BOSQUES.indexOf(it.key) >= 0 && !it.flipX && (it.scale || 1) === 1 && it.ox === undefined) {
          const p = partir(s, it.key);
          if (p) {
            const izq = it.x - p.w / 2,
              arr = it.baseY - p.h;
            p.partes.forEach(q =>
              items.push({ key: q.key, x: izq + q.x0, baseY: arr + q.base, ox: 0, oy: (q.base - q.y0) / q.h, scale: 1, shadow: 0 })
            );
            return;
          }
        }
        const ap = APOYO[it.key];
        if (tex && ap !== undefined && !it.flipX && (it.scale || 1) === 1 && it.ox === undefined && it.oy === undefined) {
          const hgt = tex.height;
          it.baseY = it.baseY - hgt + ap;
          it.oy = ap / hgt;
        }
        items.push(it);
      });
      a.items = items;
      a.colliders = a.colliders.filter(c => !QUITAR.some(q => igual(c, q)));
      AGREGAR.forEach(([x, y, w, h]) => a.colliders.push({ x, y, w, h }));
    } catch (e) {
      console.warn('[ck_camino_prof]', e);
    }
    return r;
  };
})();
