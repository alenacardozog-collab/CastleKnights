'use strict';
/* Río con corriente en los mapas del Taller (10/11, pedido del dueño: "falta animación del río que estaba en el mapa pasado
   del Camino al Castillo").
   El agua del dibujo del suelo se anima por código, como el agua de las pantallas de carga (ck_fondo_vivo.js): brillos y
   sombras que bajan con la corriente, con los mismos colores del río (luces = el agua más clara del dibujo, sombras = la
   más oscura). No gasta créditos y sigue al dibujo: si el suelo cambia, el agua animada cambia con él.
   - RIOS: zona → cajas (en coordenadas del mapa) donde buscar el agua y hacia dónde corre. El foso del camino no va:
     ya tiene su animación de siempre.
   - Va justo encima del suelo (debajo de los peces, la nieve, el hielo, el foso y todo lo demás).
   - Con el río congelado (ck_nieve.js) se queda quieto.
   Borrar su línea de index.html deja el agua quieta. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  const RIOS = {
    // [x, y, w, h] de la zona del río; corriente [dx, dy] (hacia dónde bajan los brillos)
    'ed_camino_al_castillo.main': { cajas: [[330, 0, 300, 758]], corriente: [0.18, 1] }
  };
  const CADA = 90;                         // ms entre cuadros (~11 por segundo)
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const mezcla = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));

  const armar = (S, zona, def) => {
    const c = S.currentInterior; if (!c || !c.area) return null;
    const A = c.area, objs = A.objs || [];
    const suelo = objs.find(o => o && o.texture && /^ed_suelo_/.test(o.texture.key));
    if (!suelo) return null;
    const src = suelo.texture.getSourceImage(), fr = suelo.frame;
    const W = fr.cutWidth, H = fr.cutHeight;
    const cv0 = document.createElement('canvas'); cv0.width = W; cv0.height = H;
    const g0 = cv0.getContext('2d', { willReadFrequently: true });
    g0.drawImage(src, fr.cutX, fr.cutY, W, H, 0, 0, W, H);
    const B = g0.getImageData(0, 0, W, H).data;
    const tl = suelo.getTopLeft(), sx = suelo.scaleX || 1, sy = suelo.scaleY || 1;
    // cajas del mapa → píxeles del dibujo
    const enCaja = (tx, ty) => def.cajas.some(([x, y, w, h]) => {
      const mx = tl.x + tx * sx - A.x, my = tl.y + ty * sy - A.y;
      return mx >= x && mx < x + w && my >= y && my < y + h;
    });
    const agua = [];
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, r = B[i], g = B[i + 1], b = B[i + 2];
      if (B[i + 3] < 200 || !(b > r + 25 && b > g - 6 && b > 80)) continue;
      if (!enCaja(x, y)) continue;
      agua.push(y * W + x);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (agua.length < 50) return null;
    // las luces y sombras del mismo río
    const lums = agua.map(i => lum(B[i * 4], B[i * 4 + 1], B[i * 4 + 2])).sort((a, b) => a - b);
    const cerca = (p) => { const L = lums[Math.floor(p * (lums.length - 1))]; const i = agua.find(j => Math.abs(lum(B[j * 4], B[j * 4 + 1], B[j * 4 + 2]) - L) < 1.5) || agua[0]; return [B[i * 4], B[i * 4 + 1], B[i * 4 + 2]]; };
    const claro = cerca(0.97), oscuro = cerca(0.06);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const n = agua.length, PX = new Int32Array(n), PY = new Int32Array(n), O = new Int32Array(n);
    const C1 = new Uint8Array(n * 3), C2 = new Uint8Array(n * 3), C0 = new Uint8Array(n * 3);
    agua.forEach((i, k) => {
      const x = i % W, y = (i - x) / W, c = [B[i * 4], B[i * 4 + 1], B[i * 4 + 2]];
      PX[k] = x; PY[k] = y; O[k] = ((y - y0) * w + (x - x0)) * 4;
      const a = mezcla(c, claro, 0.55), m = mezcla(c, claro, 0.28), d = mezcla(c, oscuro, 0.35);
      C2.set(a, k * 3); C1.set(m, k * 3); C0.set(d, k * 3);
    });
    const key = 'ck_rio_vivo_' + zona.replace(/\W/g, '_');
    if (S.textures.exists(key)) S.textures.remove(key);
    const tex = S.textures.createCanvas(key, w, h);
    const ctx = tex.getContext(), img = ctx.createImageData(w, h), D = img.data;
    const im = S.add.image(tl.x + x0 * sx, tl.y + y0 * sy, key).setOrigin(0, 0).setScale(sx, sy).setDepth(suelo.depth + 0.015);
    objs.push(im);
    const [dx, dy] = def.corriente;
    const cuadro = t => {
      D.fill(0);
      for (let k = 0; k < n; k++) {
        const x = PX[k], y = PY[k];
        const f = Math.sin(x * dx * 0.55 + y * dy * 0.55 - t * 0.0062 + Math.sin(x * 0.21 + y * 0.13) * 1.6);
        const C = f > 0.86 ? C2 : f > 0.6 ? C1 : f < -0.9 ? C0 : null;
        if (!C) continue;
        const o = O[k], j = k * 3;
        D[o] = C[j]; D[o + 1] = C[j + 1]; D[o + 2] = C[j + 2]; D[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
    };
    cuadro(performance.now());
    return { im, cuadro, tex, ultimo: 0 };
  };

  const vivos = {};
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      const zona = this.currentZoneKey ? this.currentZoneKey() : '', def = RIOS[zona];
      if (def) this.time.delayedCall(80, () => {
        const v = vivos[zona];
        if (v && v.im && v.im.active && v.im.scene === this) return;
        const nv = armar(this, zona, def);
        if (nv) vivos[zona] = nv;
      });
    } catch (e) { console.warn('[río vivo]', e); }
    return r;
  };

  const upd0 = P.update;
  P.update = function (time) {
    const r = upd0.apply(this, arguments);
    try {
      for (const zona in vivos) {
        const v = vivos[zona];
        if (!v.im || !v.im.active || !v.im.visible) continue;
        const helado = window.CK_NIEVE && CK_NIEVE.hielo && CK_NIEVE.hielo() > 0.6;
        if (helado || time - v.ultimo < CADA) continue;
        v.ultimo = time;
        v.cuadro(time);
      }
    } catch (e) {}
    return r;
  };

  window.CK_RIO_VIVO = { RIOS, vivos };
})();
