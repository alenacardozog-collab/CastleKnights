'use strict';
/* Retoques visuales de la segunda tanda de notas (15/11). Cada parte dice el número de nota del dueño.
   - (19) Sin el cartel "Rey Aldric" sobre la cabeza del Rey (en el salón del trono y donde aparezca).
   - (26) El agua del Claro de las Bestias se mueve: la cascada cae (brillos que bajan rápido) y el pozo tiembla en ondas
          que salen de donde cae el agua. Por código, con los colores del mismo dibujo (como el río del camino).
   - (27) Las cuencas de la calavera gigante del Claro brillan en un rojo leve que respira.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const zonaDe = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const CLARO = 'ed_claro_de_las_bestias.main';

  // ------------------------------------------------------------------ (19) sin el nombre sobre el Rey
  const sinNombreRey = S => {
    S.children.list.forEach(o => { if (o.type === 'Text' && o.visible && o.text === 'Rey Aldric' && !o._ckNV2) { o._ckNV2 = true; o.setVisible(false); } });
  };

  // ------------------------------------------------------------------ (26) el agua del Claro
  // cajas en coordenadas del mapa; tipo: 'cae' (cascada) u 'ondas' (pozo, desde el pie de la cascada)
  const AGUAS = {
    [CLARO]: [
      { caja: [726, 40, 40, 58], tipo: 'cae' },
      { caja: [684, 92, 106, 96], tipo: 'ondas', centro: [746, 98] }
    ]
  };
  const esAgua = (r, g, b) => Math.abs(r - b) < 12 && g <= r + 4 && r - g < 16 && (r + g + b) / 3 > 70;   // el gris lila del agua (no las rocas marrones)
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const mezcla = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));
  const armarAgua = (S, zona) => {
    const defs = AGUAS[zona], A = S.currentInterior && S.currentInterior.area; if (!defs || !A) return null;
    const suelo = (A.objs || []).find(o => o && o.texture && /^ed_suelo_/.test(o.texture.key)); if (!suelo) return null;
    const fr = suelo.frame, src = fr.source.image || fr.source.canvas, tl = suelo.getTopLeft(), sx = suelo.scaleX || 1, sy = suelo.scaleY || 1;
    return defs.map(d => {
      const [mx, my, mw, mh] = d.caja, tx = Math.round((A.x + mx - tl.x) / sx), ty = Math.round((A.y + my - tl.y) / sy), w = Math.round(mw / sx), h = Math.round(mh / sy);
      const cv0 = document.createElement('canvas'); cv0.width = w; cv0.height = h;
      const g0 = cv0.getContext('2d', { willReadFrequently: true });
      g0.drawImage(src, fr.cutX + tx, fr.cutY + ty, w, h, 0, 0, w, h);
      const B = g0.getImageData(0, 0, w, h).data, pts = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (B[i + 3] > 200 && esAgua(B[i], B[i + 1], B[i + 2])) pts.push(y * w + x); }
      if (pts.length < 40) return null;
      const ls = pts.map(i => lum(B[i * 4], B[i * 4 + 1], B[i * 4 + 2])).sort((a, b) => a - b);
      const tono = p => { const L = ls[Math.floor(p * (ls.length - 1))]; const i = pts.find(j => Math.abs(lum(B[j * 4], B[j * 4 + 1], B[j * 4 + 2]) - L) < 1.5) || pts[0]; return [B[i * 4], B[i * 4 + 1], B[i * 4 + 2]]; };
      const claro = mezcla(tono(0.98), [255, 255, 255], 0.25), oscuro = tono(0.04);
      const n = pts.length, PX = new Int16Array(n), PY = new Int16Array(n), C2 = new Uint8Array(n * 3), C1 = new Uint8Array(n * 3), C0 = new Uint8Array(n * 3);
      pts.forEach((i, k) => {
        const x = i % w, y = (i - x) / w, c = [B[i * 4], B[i * 4 + 1], B[i * 4 + 2]];
        PX[k] = x; PY[k] = y; C2.set(mezcla(c, claro, 0.6), k * 3); C1.set(mezcla(c, claro, 0.3), k * 3); C0.set(mezcla(c, oscuro, 0.4), k * 3);
      });
      const key = 'ck_nv2_agua_' + zona.replace(/\W/g, '_') + '_' + d.tipo;
      if (S.textures.exists(key)) S.textures.remove(key);
      const tex = S.textures.createCanvas(key, w, h), ctx = tex.getContext(), img = ctx.createImageData(w, h), D = img.data;
      const im = S.add.image(A.x + mx, A.y + my, key).setOrigin(0, 0).setScale(sx, sy).setDepth(suelo.depth + 0.016);
      (A.objs = A.objs || []).push(im);
      const cx = d.centro ? (A.x + d.centro[0] - (A.x + mx)) / sx : 0, cy = d.centro ? (A.y + d.centro[1] - (A.y + my)) / sy : 0;
      const cuadro = t => {
        D.fill(0);
        for (let k = 0; k < n; k++) {
          const x = PX[k], y = PY[k];
          let f;
          if (d.tipo === 'cae') f = Math.sin(y * 0.55 - t * 0.016 + Math.sin(x * 1.7) * 2.2 + x * 0.4);
          else { const r = Math.hypot((x - cx) * 0.8, (y - cy) * 1.5); f = Math.sin(r * 0.42 - t * 0.0045 + Math.sin(x * 0.23 + y * 0.31) * 1.3) * (r < 70 ? 1 : 0.85); }
          const C = f > 0.9 ? C2 : f > 0.68 ? C1 : f < -0.93 ? C0 : null;
          if (!C) continue;
          const o = (y * w + x) * 4, j = k * 3;
          D[o] = C[j]; D[o + 1] = C[j + 1]; D[o + 2] = C[j + 2]; D[o + 3] = 255;
        }
        ctx.putImageData(img, 0, 0); tex.refresh();
      };
      cuadro(performance.now());
      return { im, cuadro, ultimo: 0, cada: d.tipo === 'cae' ? 70 : 110 };
    }).filter(Boolean);
  };

  // ------------------------------------------------------------------ (27) los ojos de la calavera
  const OJOS = { [CLARO]: [[275, 78, 34, 19], [357, 59, 18, 10]] };   // centro y tamaño de cada cuenca (mapa)
  const armarOjos = (S, zona) => {
    const L = OJOS[zona], A = S.currentInterior && S.currentInterior.area; if (!L || !A) return null;
    const cal = S.children.list.find(o => o.texture && o.texture.key === 'ed_cb_objeto' && o.getBounds().contains(A.x + L[0][0], A.y + L[0][1]));
    const dep = cal ? cal.depth + 0.02 : A.y + 126;
    return L.map(([x, y, w, h]) => {
      const g = S.add.graphics().setDepth(dep).setBlendMode(Phaser.BlendModes.ADD);
      [[1, 0.06], [0.7, 0.07], [0.4, 0.09]].forEach(([k, al]) => { g.fillStyle(0xff2a1a, al); g.fillEllipse(A.x + x, A.y + y, w * k, h * k); });
      (A.objs = A.objs || []).push(g);
      return g;
    });
  };

  // ------------------------------------------------------------------ armar al entrar y animar
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    const S = this;
    try {
      S._ckNV2agua = null; S._ckNV2ojos = null;
      const z = zonaDe(S);
      S.time.delayedCall(90, () => {
        if (zonaDe(S) !== z || !S.currentInterior) return;
        try { S._ckNV2agua = armarAgua(S, z); } catch (e) { console.warn('[notas visual 2: agua]', e); }
        try { S._ckNV2ojos = armarOjos(S, z); } catch (e) { console.warn('[notas visual 2: ojos]', e); }
      });
    } catch (e) {}
    return r;
  };
  const u0 = P.update;
  P.update = function (time) {
    const r = u0.apply(this, arguments);
    try {
      if ((this._ckNV2n = (this._ckNV2n || 0) + 1) % 30 === 0) sinNombreRey(this);
      (this._ckNV2agua || []).forEach(v => {
        if (!v.im.active || !v.im.visible) return;
        const helado = window.CK_NIEVE && CK_NIEVE.hielo && CK_NIEVE.hielo() > 0.6;
        if (helado || time - v.ultimo < v.cada) return;
        v.ultimo = time; v.cuadro(time);
      });
      if (this._ckNV2ojos) { const k = 0.7 + 0.3 * Math.sin(time / 900); this._ckNV2ojos.forEach(g => g.active && g.setAlpha(k)); }
    } catch (e) {}
    return r;
  };
  window.CK_NOTAS_VISUAL_2 = { AGUAS, OJOS, armarAgua, armarOjos };
})();
