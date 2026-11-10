'use strict';
/* Delante / detrás por columnas en los mapas del Taller (23/10, pedido del dueño: "el personaje queda entre la imagen").
   Cada mueble se ordenaba por el borde de abajo de TODA su imagen. En los que no tienen el pie derecho (el asiento de la
   ventana en diagonal, un banco en L, una mesa con sillas corridas) el héroe parado delante de la parte de arriba quedaba
   "detrás" y la madera le tapaba las piernas.
   Ahora cada mueble se parte en franjas verticales y cada franja ordena por dónde apoya en esas columnas (el píxel opaco
   más bajo, suavizado para que los brazos finitos de un candelabro sigan al poste). Los que apoyan derecho quedan igual.
   No toca los datos del editor: se aplica al armar el mapa. Borrar la línea de index.html lo deshace.
   (09/11) Las piezas que vienen recortadas enteras de una capa de croma (árboles, casas: CK_PROF_ENTEROS, la pone
   ck_campos.js) NO se parten: se ordenan enteras por su base; partidas se veían cortadas en vertical. */
(function () {
  if (typeof INTERIOR_LAYOUTS === 'undefined') return;
  const VENTANA = 3, // columnas de cada lado que se miran para suavizar (brazos finos siguen al poste)
    PASO = 3; // franjas cada 3 px de diferencia de apoyo
  const cache = (window.CK_PARTES = window.CK_PARTES || {}); // la nieve (ck_nieve.js) lo usa para no marcar los cortes

  // lienzo de la imagen (espejada si hace falta), registrado como textura propia para poder partirla
  const fuente = (s, key, flip) => {
    const img = s.textures.get(key).getSourceImage(), w = img.width, h = img.height;
    const k = flip ? key + '_esp' : key;
    if (flip && !s.textures.exists(k)) {
      const t = s.textures.createCanvas(k, w, h), g = t.getContext();
      g.translate(w, 0); g.scale(-1, 1); g.drawImage(img, 0, 0); t.refresh();
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    if (flip) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(img, 0, 0);
    return { k, w, h, px: g.getImageData(0, 0, w, h).data };
  };

  const partir = (s, key, flip) => {
    const ck = flip ? key + '_esp' : key;
    if (cache[ck] !== undefined) return cache[ck];
    let f;
    try { f = fuente(s, key, flip); } catch (e) { return (cache[ck] = null); }
    const { k, w, h, px } = f;
    if (w < 12 || h < 8) return (cache[ck] = null);
    const pie = new Int16Array(w).fill(-1);
    for (let x = 0; x < w; x++)
      for (let y = h - 1; y >= 0; y--) if (px[(y * w + x) * 4 + 3] > 8) { pie[x] = y; break; }
    const suave = new Int16Array(w).fill(-1);
    for (let x = 0; x < w; x++) {
      if (pie[x] < 0) continue;
      let m = -1;
      for (let d = -VENTANA; d <= VENTANA; d++) { const v = pie[x + d]; if (v !== undefined && v > m) m = v; }
      suave[x] = m;
    }
    // tramos de columnas con el mismo apoyo (en pasos de PASO px)
    const tramos = [];
    for (let x = 0; x < w; x++) {
      if (suave[x] < 0) continue;
      const g = Math.floor(suave[x] / PASO), t = tramos[tramos.length - 1];
      if (t && t.g === g && t.x1 === x - 1) { t.x1 = x; if (suave[x] > t.base) t.base = suave[x]; }
      else tramos.push({ g, x0: x, x1: x, base: suave[x] });
    }
    const bajo = Math.max(...tramos.map(t => t.base));
    // derecho (todo apoya a menos de 4 px del borde de abajo): queda entero
    if (tramos.every(t => bajo - t.base < 4)) return (cache[ck] = null);
    // (10/11) cada franja lleva además la columna de al lado (1 px de solape): con el zoom de la cámara (2,2) los bordes
    // de dos franjas caían a veces en medio píxel y quedaba una rayita vertical del suelo entre ellas al moverse
    const partes = tramos.map((t, i) => {
      const x0 = Math.max(0, t.x0 - 1), x1 = Math.min(w - 1, t.x1 + 1);
      const pw = x1 - x0 + 1, pk = k + '_p' + i;
      if (!s.textures.exists(pk)) {
        const tx = s.textures.createCanvas(pk, pw, h), g = tx.getContext(), out = g.createImageData(pw, h), o = out.data;
        for (let y = 0; y < h; y++)
          for (let x = x0; x <= x1; x++) {
            const a = (y * w + x) * 4, b = (y * pw + (x - x0)) * 4;
            o[b] = px[a]; o[b + 1] = px[a + 1]; o[b + 2] = px[a + 2]; o[b + 3] = px[a + 3];
          }
        g.putImageData(out, 0, 0); tx.refresh();
      }
      return { key: pk, x0, y0: 0, w: pw, h, base: t.base };
    });
    return (cache[ck] = cache[k] = { w, h, partes });
  };

  const envolver = kind => {
    const L = INTERIOR_LAYOUTS[kind];
    INTERIOR_LAYOUTS[kind] = function (kit) {
      const r = L.apply(this, arguments);
      try {
        const a = kit.areas && kit.areas.main, s = window.activeGameScene;
        if (!a || !s || !a.items) return r;
        const items = [];
        a.items.forEach(it => {
          const apto = it.key && /^ed_/.test(it.key) && !/^ed_suelo_|_p\d+$/.test(it.key) && !it.anim && !it.floor &&
            !(window.CK_PROF_ENTEROS && window.CK_PROF_ENTEROS.test(it.key)) &&
            (it.scale || 1) === 1 && it.ox === undefined && it.oy === undefined && s.textures.exists(it.key);
          const p = apto && partir(s, it.key, !!it.flipX);
          if (!p) { items.push(it); return; }
          const izq = it.x - p.w / 2, arr = it.baseY - p.h;
          p.partes.forEach(q => items.push({ key: q.key, x: izq + q.x0, baseY: arr + q.base + 1, ox: 0, oy: (q.base + 1) / q.h, scale: 1, shadow: 0 }));
        });
        a.items = items;
      } catch (e) { console.warn('[profundidad]', e); }
      return r;
    };
  };
  Object.keys(INTERIOR_LAYOUTS).filter(k => /^ed_/.test(k)).forEach(envolver);
  window.CK_PROFUNDIDAD = { partir, cache };
})();
