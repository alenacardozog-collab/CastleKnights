'use strict';
/* Fuegos pintados que ahora se mueven (12/11 tarde, pedido del dueño: "animaciones del mapa con PixelLab: fogatas, antorchas…
   reemplazá lo que está pintado, no pegues encima").
   Muchos mapas de Flow traen fogatas, braseros y antorchas DIBUJADOS en el suelo o en las piezas: quedaban quietos.
   Al entrar a una zona se buscan las llamas pintadas (píxeles de fuego: naranja/amarillo con centro casi blanco) en lo que
   se ve del lugar y, por cada una:
     1. se tapa SÓLO la llama con un parche del mismo dibujo donde los píxeles de fuego pasan a brasas (rojo oscuro y
        carbón): los troncos, las piedras y el brasero quedan como estaban;
     2. encima va una llama animada de PixelLab (8 cuadros) del tamaño de la pintada, con los pies en la base del fuego.
   No se toca lo que ya se mueve (si hay una fogata o un brasero animado al lado, se deja). Lo muy grande (más de 64 px)
   no se toma por fuego (la luz de la entrada de la cueva, por ejemplo). Con lluvia, ck_clima.js apaga estas llamas como
   a las demás (la textura se llama "llama").
   (13/11, v2) Salas y fuegos sueltos: `window.CK_FUEGOS_SALAS[id] = { cajas: [[x, y, w, h]…], suave }` (lo arma
   ck_ambiente_mapas.js) suma fuegos de adentro (hogares, fraguas, fogones) y los de afuera de color más apagado, buscando
   SÓLO dentro de esas cajas (adentro el oro y las velas se confunden con fuego); `suave` acepta llamas de naranja más
   pálido y sin centro blanco. Sin esa tabla todo queda como antes.
   Borrar su línea de index.html deja los fuegos pintados quietos. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof document === 'undefined') return;
  const P = MainGameScene.prototype;
  const LLAMA = 'ckfv_llama_fuego';
  const ARTE = 'data:image/png;base64,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';
  const N = 8;
  const AFUERA = { aldea_en_ruinas: 1, bosque_de_la_frontera: 1, muralla: 1, patio_fortaleza_orca: 1, coliseo_orco: 1, patio_del_castillo: 1,
    claro_de_las_bestias: 1, fortaleza_orca: 1, pueblo_orco: 1, tierras_orcas: 1, sendero_orco: 1, afueras_orcas: 1, campos_del_roble: 1,
    camino_al_castillo: 1, patio_de_armas: 1, jardin_real: 1, cementerio_real: 1, aldea_norte: 1 };

  const esFuego = (d, i) => { const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3]; return a > 200 && r >= 230 && g >= 100 && g <= 240 && b <= 130 && r - b > 120 && r - g > 15; };
  const esNucleo = (d, i) => { const r = d[i], g = d[i + 1], b = d[i + 2]; return r >= 250 && g >= 210 && b >= 90 && b <= 200; };
  // (v2) llamas pintadas más apagadas (las de los fogones de los orcos): sólo dentro de las cajas de CK_FUEGOS_SALAS
  const esFuegoSuave = (d, i) => { const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3]; return a > 200 && r >= 215 && g >= 90 && g <= 236 && b <= 165 && r - b > 70 && r >= g + 8; };
  const ANIM_FUEGO = /fog|llama|bras|fire|flame|antor|hoguer|campfire|fogon/i;

  const cargar = S => {
    if (S.textures.exists(LLAMA)) return Promise.resolve(true);
    if (S._ckfvCargando) return S._ckfvCargando;
    S._ckfvCargando = new Promise(res => {
      const im = new Image();
      im.onload = () => {
        try {
          if (!S.textures.exists(LLAMA)) S.textures.addSpriteSheet(LLAMA, im, { frameWidth: 32, frameHeight: 32 });
          if (!S.anims.exists(LLAMA)) S.anims.create({ key: LLAMA, frames: S.anims.generateFrameNumbers(LLAMA, { start: 0, end: N - 1 }), frameRate: 10, repeat: -1 });
          res(true);
        } catch (e) { res(false); }
      };
      im.onerror = () => res(false);
      im.src = ARTE;
    });
    return S._ckfvCargando;
  };

  const pixeles = (cache, key, S) => {
    if (cache[key] !== undefined) return cache[key];
    const t = S.textures.get(key), src = t && t.getSourceImage();
    if (!src || !src.width || src.width * src.height > 6e6) return (cache[key] = null);
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0);
    try { return (cache[key] = { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }); } catch (e) { return (cache[key] = null); }
  };

  const buscar = (S, cajas, suave) => {
    const A = S.currentInterior ? S.currentInterior.area : { x: 0, y: 0, w: S.physics.world.bounds.width, h: S.physics.world.bounds.height };
    const AR = new Phaser.Geom.Rectangle(A.x, A.y, A.w || A.width, A.h || A.height);
    // (v2) con cajas: sólo lo que cae adentro de alguna (coordenadas del mapa)
    const CJ = cajas ? cajas.map(([x, y, w, h]) => new Phaser.Geom.Rectangle(A.x + x, A.y + y, w, h)) : null;
    const fuego = suave ? esFuegoSuave : esFuego;
    const cache = {}, out = [];
    const vivos = S.children.list.filter(o => o.anims && o.anims.isPlaying && o.visible && ANIM_FUEGO.test((o.anims.currentAnim && o.anims.currentAnim.key) || ''));
    S.children.list.forEach(o => {
      if (!o.active || !o.visible || !o.texture || !o.frame || o._ckfv) return;
      if (o.type !== 'Image' && o.type !== 'Sprite') return;
      if (o.anims && o.anims.isPlaying) return;
      if (o.scrollFactorX !== 1 || o.rotation) return;
      const bb = o.getBounds(); if (!Phaser.Geom.Rectangle.Overlaps(AR, bb)) return;
      if (CJ && !CJ.some(c => Phaser.Geom.Rectangle.Overlaps(c, bb))) return;
      const Px = pixeles(cache, o.texture.key, S); if (!Px) return;
      const f = o.frame, fx = f.cutX, fy = f.cutY, fw = f.cutWidth, fh = f.cutHeight;
      if (fw * fh > 4e6) return;
      const vis = new Uint8Array(fw * fh);
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        const k = y * fw + x; if (vis[k]) continue;
        if (!fuego(Px.d, ((fy + y) * Px.w + fx + x) * 4)) continue;
        const q = [k], pts = []; vis[k] = 1; let core = 0, x0 = x, x1 = x, y0 = y, y1 = y;
        while (q.length) {
          const c = q.pop(); pts.push(c); const cx = c % fw, cy = (c / fw) | 0;
          if (esNucleo(Px.d, ((fy + cy) * Px.w + fx + cx) * 4)) core++;
          x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
            const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= fw || ny >= fh) continue;
            const nk = ny * fw + nx; if (vis[nk]) continue;
            if (fuego(Px.d, ((fy + ny) * Px.w + fx + nx) * 4)) { vis[nk] = 1; q.push(nk); }
          }
        }
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        if (pts.length < (suave ? 20 : 6) || (core < 2 && !suave) || h < 3 || w > 64 || h > 64) continue;   // (v2) suave: sin las chispas sueltas
        // posición en el mundo (con origen, escala y espejo)
        const sx = o.scaleX, sy = o.scaleY, ox = o.originX * fw, oy = o.originY * fh;
        const mx = (lx) => o.x + ((o.flipX ? fw - lx : lx) - ox) * sx, my = (ly) => o.y + (ly - oy) * sy;
        const cxw = mx((x0 + x1 + 1) / 2), bot = my(y1 + 1), top = my(y0);
        if (CJ && !CJ.some(c => c.contains(cxw, bot - 1))) continue;
        if (vivos.some(v => Math.hypot(v.x - cxw, v.y - (top + bot) / 2) < 30 || Math.hypot(v.x - cxw, v.y - bot) < 30)) continue;
        out.push({ o, Px, fx, fy, fw, x0, y0, x1, y1, pts, cxw, bot, top, wW: w * Math.abs(sx), hW: h * Math.abs(sy) });
      }
    });
    return out;
  };

  // el parche: el mismo pedazo de dibujo, con el fuego hecho brasas
  const parche = (S, g, i) => {
    const { o, Px, fx, fy, fw, x0, y0, x1, y1, pts } = g;
    const w = x1 - x0 + 3, h = y1 - y0 + 3;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'), img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sxp = fx + x0 - 1 + x, syp = fy + y0 - 1 + y;
      if (sxp < 0 || syp < 0 || sxp >= Px.w || syp >= Px.h) continue;
      const si = (syp * Px.w + sxp) * 4, di = (y * w + x) * 4;
      img.data[di] = Px.d[si]; img.data[di + 1] = Px.d[si + 1]; img.data[di + 2] = Px.d[si + 2]; img.data[di + 3] = Px.d[si + 3];
    }
    // la llama pintada: abajo queda como brasas; arriba se rellena con lo que la rodea (fila por fila, de borde a borde)
    const marca = new Uint8Array(w * h);
    pts.forEach(k => { marca[(((k / fw) | 0) - y0 + 1) * w + (k % fw) - x0 + 1] = 1; });
    for (let y = 0; y < h; y++) {
      const base = y > (h - 2) * 0.62;
      for (let x = 0; x < w; x++) {
        if (!marca[y * w + x]) continue;
        let e = x; while (e + 1 < w && marca[y * w + e + 1]) e++;
        const di0 = (y * w + Math.max(0, x - 1)) * 4, di1 = (y * w + Math.min(w - 1, e + 1)) * 4;
        for (let q = x; q <= e; q++) {
          const di = (y * w + q) * 4, v = (img.data[di] + img.data[di + 1] + img.data[di + 2]) / 3;
          if (base) {   // brasas
            if (v > 200) { img.data[di] = 176; img.data[di + 1] = 56; img.data[di + 2] = 26; } else { img.data[di] = 98; img.data[di + 1] = 36; img.data[di + 2] = 22; }
          } else {      // el fondo de alrededor
            const t = e > x ? (q - x + 1) / (e - x + 2) : 0.5;
            for (let ch = 0; ch < 3; ch++) img.data[di + ch] = Math.round(img.data[di0 + ch] * (1 - t) + img.data[di1 + ch] * t);
            img.data[di + 3] = Math.max(img.data[di0 + 3], img.data[di1 + 3]);
          }
        }
        x = e;
      }
    }
    ctx.putImageData(img, 0, 0);
    const key = 'ckfv_p_' + (S._ckfvN = (S._ckfvN || 0) + 1);
    S.textures.addCanvas(key, c);
    const sx = o.scaleX, sy = o.scaleY, ox = o.originX * o.frame.cutWidth, oy = o.originY * o.frame.cutHeight;
    const lx = o.flipX ? o.frame.cutWidth - (x0 - 1) - w : x0 - 1;
    const im = S.add.image(o.x + (lx - ox) * sx, o.y + (y0 - 1 - oy) * sy, key).setOrigin(0, 0).setScale(Math.abs(sx), Math.abs(sy)).setFlipX(!!o.flipX).setDepth(o.depth + 0.01);
    im._ckfv = true; im._ckfvKey = key;
    if (o.isTinted) im.setTint(o.tintTopLeft, o.tintTopRight, o.tintBottomLeft, o.tintBottomRight);
    im.setAlpha(o.alpha);
    return im;
  };

  const poner = S => {
    quitar(S);
    // sólo los mapas del Taller (los de Flow): la aldea vieja tiene techos de paja del mismo color que el fuego
    // y sólo los de afuera (y las cuevas): adentro, el oro de los cofres y las velas se confundían con fuego
    const zk = (S.currentZoneKey && S.currentZoneKey()) || '';
    const id = zk.replace(/^ed_/, '').replace(/\.\w+$/, '');
    const sala = window.CK_FUEGOS_SALAS && window.CK_FUEGOS_SALAS[id];   // (v2)
    if (!/^ed_/.test(zk) || !(AFUERA[id] || /^cueva_/.test(id) || sala)) return;
    let gs = [];
    try {
      if (AFUERA[id] || /^cueva_/.test(id)) gs = buscar(S);
      if (sala && sala.cajas) gs = gs.concat(buscar(S, sala.cajas, sala.suave).filter(g => !gs.some(u => u.o === g.o && Math.abs(u.cxw - g.cxw) < 6 && Math.abs(u.bot - g.bot) < 6)));
    } catch (e) { console.warn('[fuegos]', e); return; }
    if (!gs.length) return;
    cargar(S).then(ok => {
      if (!ok) return;
      const lista = S._ckfv = [];
      // la misma llama puede estar en el suelo y en la pieza recortada de encima: se tapan las dos, pero va una sola llama
      const unicas = [];
      gs.slice().sort((a, b) => b.o.depth - a.o.depth).forEach(g => { if (!unicas.some(u => Math.abs(u.cxw - g.cxw) < 12 && Math.abs(u.bot - g.bot) < 12)) unicas.push(g); });
      gs.forEach((g, i) => { try { lista.push(parche(S, g, i)); } catch (e) {} });
      unicas.forEach((g, i) => {
        try {
          // la llama nueva: un poco más alta que la pintada (la animada respira), con la base donde estaba la de antes
          const alto = Math.max(8, g.hW * 1.25), k = alto / 28;
          const ll = S.add.sprite(Math.round(g.cxw), Math.round(g.bot + 2 * k), LLAMA).setOrigin(0.5, 1).setScale(Math.max(0.3, k)).setDepth(g.o.depth + 0.02);
          ll._ckfv = true;
          ll.play({ key: LLAMA, startFrame: i % N });
          ll.anims.timeScale = 0.85 + (i % 5) * 0.06;
          lista.push(ll);
        } catch (e) {}
      });
    });
  };
  const quitar = S => {
    (S._ckfv || []).forEach(o => { if (o && o.active) { const k = o._ckfvKey; o.destroy(); if (k && S.textures.exists(k)) S.textures.remove(k); } });
    S._ckfv = null;
  };

  // al entrar a un lugar (cuando terminó de armarse)
  const cuando = S => {
    quitar(S);
    const z = S.currentZoneKey && S.currentZoneKey(), t0 = Date.now();
    const iv = setInterval(() => {
      if (!S.player || (S.currentZoneKey && S.currentZoneKey() !== z) || Date.now() - t0 > 12000) { clearInterval(iv); return; }
      if (S._doorTransition || document.querySelector('.ck-carga.on, #ck-carga.on')) return;
      clearInterval(iv);
      setTimeout(() => { if (S.currentZoneKey && S.currentZoneKey() === z) poner(S); }, 300);
    }, 400);
  };
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    if (f0) P[k] = function () { const r = f0.apply(this, arguments); try { cuando(this); } catch (e) {} return r; };
  });
  // si al lado aparece un fuego animado del juego (la fogata de la aldea de noche, por ejemplo), la llama nueva se esconde
  setInterval(() => {
    const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(x => x.startCampaign));
    if (!S || !S._ckfv) return;
    try {
      const vivos = S.children.list.filter(o => !o._ckfv && o.anims && o.anims.isPlaying && o.visible && ANIM_FUEGO.test((o.anims.currentAnim && o.anims.currentAnim.key) || ''));
      S._ckfv.forEach(o => { if (o.type === 'Sprite' && o.active) o.setVisible(!vivos.some(v => Math.hypot(v.x - o.x, v.y - o.y) < 34)); });
    } catch (e) {}
  }, 1000);
  window.CK_FUEGOS_VIVOS = { poner, quitar, buscar, cargar, LLAMA, N };   // (v3) cargar/LLAMA: para las llamas sueltas de ck_capitulo3.js
})();
