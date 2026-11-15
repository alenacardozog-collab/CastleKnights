'use strict';
/* Visuales de las notas de prueba (14/11, pedido del dueño: "te deje todas las notas de los arreglos del juego, terminalas").
   Un archivo con todo lo que se ve (no toca choques ni historia); cada parte dice de qué nota viene:
   - suelos retocados (ck_notas_suelos_arte.js): el Norte sin la niebla pintada (9); el Bosque Embrujado con el humo del
     dibujo original donde había quedado una textura rara (14, 16);
   - Campos del Roble: sin los óvalos de luz que corrían por el trigo; el trigo tiene cuerpo (tapa las piernas del que lo
     cruza) y se mueve al pasar: se abre, suelta pajitas y suena (2);
   - Bosque Embrujado: velas que titilan (12); el agua con brillos y ondas, y más niebla que se arrastra (13);
   - Cementerio Real: las runas del círculo brillan y laten (20);
   - Jardín Real: la fuente con agua que cae de un piso al otro y ondas abajo (36);
   - Patio del castillo: sin palomas (41);
   - La muralla: los braseros pintados con llama viva (48);
   - San Roque: faroles de noche en las puertas, como en el Norte (49);
   - Casa de los granjeros: el caldero burbujea (53);
   - Galerías: una sola fogata y más chica (74);
   - Claro de las Bestias: la paleta de las Tierras Orcas (92);
   - Afueras y Pueblo Orco: antorchas repartidas que de noche alumbran y de día están apagadas (99, 110);
   - Mazmorra del Sello: en cada brasero queda sólo la llama animada; la pintada de abajo se apaga y la tapa la viva (141).
   Borrar sus dos líneas de index.html (ck_notas_suelos_arte.js y este) deja todo como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype;
  const zonaDe = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const R = (a, b) => a + Math.random() * (b - a);
  const noche = S => { const p = S.dayPhase ? S.dayPhase() : 0; return Math.max(0, Math.min(1, p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.1 : p < 0.92 ? 1 : (1 - p) / 0.08)); };
  const son = (k, v, o) => { try { const S = window.activeGameScene; if (S && S.cache.audio.exists(k)) { S.sound.play(k, Object.assign({ volume: v }, o || {})); return true; } } catch (e) {} return false; };
  const lienzo = (S, key) => {                      // la textura como lienzo (si ya lo es, la misma)
    const t = S.textures.get(key); if (!t || t.key === '__MISSING') return null;
    if (t.getContext) return t;
    const img = t.getSourceImage(), c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    S.textures.remove(key);
    return S.textures.addCanvas(key, c);
  };
  const sueloDe = (S, a) => {                       // la clave del suelo del lugar (algunos mapas no la dejan en groundKey)
    if (a.groundKey && S.textures.exists(a.groundKey)) return a.groundKey;
    const o = S.children.list.find(q => q.texture && q.depth === 7 && q.visible && Math.abs(q.x - a.x) < 2 && Math.abs(q.y - a.y) < 2);
    if (o) return o.texture.key;
    const m = /^ed_(\w+)\.main$/.exec(zonaDe(S)), D = window.EDITOR_DATA;
    return m && D && D.mapas && D.mapas[m[1]] ? D.mapas[m[1]].suelo : null;
  };
  const pixeles = (S, key) => {
    const f = S.textures.getFrame(key); if (!f) return null;
    const c = document.createElement('canvas'); c.width = f.cutWidth; c.height = f.cutHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(f.source.image || f.source.canvas, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
    return { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data, c };
  };

  // ================================================================== 1. suelos retocados (9, 14, 16)
  const PARCHES = window.CK_NOTAS_SUELOS || {};
  const imgs = {};
  Object.keys(PARCHES).forEach(k => { imgs[k] = PARCHES[k].map(([x, y, src]) => { const im = new Image(); im.src = src; return { x, y, im }; }); });
  const hechos = new Set();
  const parchar = S => {
    Object.keys(imgs).forEach(k => {
      if (hechos.has(k) || !S.textures.exists(k)) return;
      const t = lienzo(S, k); if (!t) return;
      hechos.add(k);
      const g = t.getContext(), pal = PALETA_()[k];
      imgs[k].forEach(p => {
        const dib = () => {
          try {
            if (!pal) { g.drawImage(p.im, p.x, p.y); t.refresh(); return; }
            // el suelo ya está con la paleta nueva: el parche se pasa a esa paleta antes de pegarlo
            const c = document.createElement('canvas'); c.width = p.im.width; c.height = p.im.height;
            const q = c.getContext('2d', { willReadFrequently: true }); q.drawImage(p.im, 0, 0);
            const d = q.getImageData(0, 0, c.width, c.height), px = d.data, cache = new Map();
            for (let i = 0; i < px.length; i += 4) {
              if (!px[i + 3]) continue;
              const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
              let o = cache.get(key); if (!o) { o = pasarPaleta(pal, px[i], px[i + 1], px[i + 2]); cache.set(key, o); }
              px[i] = o[0]; px[i + 1] = o[1]; px[i + 2] = o[2];
            }
            q.putImageData(d, 0, 0); g.drawImage(c, p.x, p.y); t.refresh();
          } catch (e) {}
        };
        if (p.im.complete && p.im.naturalWidth) dib(); else p.im.addEventListener('load', dib, { once: true });
      });
    });
  };
  // al armar el mapa (antes de que se dibuje el suelo)
  Object.keys(INTERIOR_LAYOUTS).forEach(kind => {
    const L0 = INTERIOR_LAYOUTS[kind];
    // (los mapas que tienen parches: norte, bosque embrujado, claro y, desde ck_fosa_suelo_arte.js, la Fosa)
    if (typeof L0 !== 'function' || !PARCHES['ed_suelo_' + kind.replace(/^ed_/, '')]) return;
    INTERIOR_LAYOUTS[kind] = function () {
      const r = L0.apply(this, arguments);   // después: ck_zona_brumavieja limpia la niebla del bosque al armar el mapa
      try { const s = window.activeGameScene || (window.game && game.scene.scenes.find(x => x.startCampaign)); if (s) parchar(s); } catch (e) {}
      return r;
    };
  });

  // ================================================================== 2. Claro de las Bestias con la paleta de las Tierras Orcas (92)
  // medias y desvíos Lab medidos: el suelo del Claro y el de las Tierras como se ven en el juego
  const PAL_CLARO = { mu: [41.94, -2.96, 13.12], sd: [13.42, 11.88, 14.51], tmu: [36, 5.9, 13], tsd: [15.5, 2.6, 7] };
  // Lab (D65) como en ck_frontera_viva.js; acá la mezcla es completa salvo en los colores muy fuertes (banderas, sangre)
  const lin = c => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92), gam = c => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c);
  const fL = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116), fiL = t => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
  const aLab = (r, g, b) => {
    r = lin(r / 255); g = lin(g / 255); b = lin(b / 255);
    const x = (0.412453 * r + 0.357580 * g + 0.180423 * b) / 0.95047, y = 0.212671 * r + 0.715160 * g + 0.072169 * b, z = (0.019334 * r + 0.119193 * g + 0.950227 * b) / 1.08883;
    return [116 * fL(y) - 16, 500 * (fL(x) - fL(y)), 200 * (fL(y) - fL(z))];
  };
  const aRgb = (L, a, b) => {
    const fy = (L + 16) / 116, x = fiL(fy + a / 500) * 0.95047, y = fiL(fy), z = fiL(fy - b / 200) * 1.08883;
    const c = v => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, v))) * 255)));
    return [c(3.240481 * x - 1.537151 * y - 0.498536 * z), c(-0.969256 * x + 1.875991 * y + 0.041556 * z), c(0.055648 * x - 0.204043 * y + 1.057311 * z)];
  };
  const PALETA_ = () => ({ ed_suelo_claro_de_las_bestias: /[?&]ck_sin_paleta=1/.test(location.search) ? null : PAL_CLARO });
  const pasarPaleta = (p, r, g, b) => {
    const L = aLab(r, g, b), C = Math.hypot(L[1], L[2]);
    const w = Math.max(0, Math.min(1, 1 - (C - 45) / 25));
    if (!w) return [r, g, b];
    const o = [0, 1, 2].map(i => L[i] * (1 - w) + ((L[i] - p.mu[i]) * (p.tsd[i] / p.sd[i]) + p.tmu[i]) * w);
    return aRgb(Math.max(0, Math.min(100, o[0])), o[1], o[2]);
  };
  const create0 = P.create;
  P.create = function () {
    try {
      const A = window.EDITOR_ASSETS || {};
      if (!/[?&]ck_sin_paleta=1/.test(location.search)) {
        const keys = Object.keys(A).filter(k => /^ed_(cb_|suelo_claro_de_las_bestias)/.test(k));
        keys.forEach(k => {
          if (!this.textures.exists(k)) return;
          const t = this.textures.get(k), img = t.getSourceImage(); if (!img || !img.width) return;
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
          const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, c.width, c.height), px = d.data, cache = new Map();
          for (let i = 0; i < px.length; i += 4) {
            if (!px[i + 3]) continue;
            const q = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
            let o = cache.get(q); if (!o) { o = pasarPaleta(PAL_CLARO, px[i], px[i + 1], px[i + 2]); cache.set(q, o); }
            px[i] = o[0]; px[i + 1] = o[1]; px[i + 2] = o[2];
          }
          g.putImageData(d, 0, 0);
          const D = window.EDITOR_DATA, cu = D && D.assets && D.assets[k] && D.assets[k].cuadros;
          this.textures.remove(k);
          if (cu) this.textures.addSpriteSheet(k, c, { frameWidth: cu.fw, frameHeight: cu.fh }); else this.textures.addCanvas(k, c);
        });
      }
    } catch (e) { console.warn('[notas visual] paleta del claro', e); }
    return create0.apply(this, arguments);
  };

  // ================================================================== 3. tablas de ck_ambiente_mapas (49, 53, 13)
  const ponerVida = () => {
    const V = window.CK_AMBIENTE_MAPAS && window.CK_AMBIENTE_MAPAS.VIDA; if (!V || ponerVida.ok) return; ponerVida.ok = true;
    // San Roque: un farol en cada puerta que se prende de noche (como el Norte del Roble)
    const sr = V['ed_san_roque.main'] = V['ed_san_roque.main'] || {};
    sr.luces = (sr.luces || []).concat([[586, 270], [824, 330], [392, 374], [961, 124], [953, 540], [486, 672], [1284, 554], [705, 652]]
      .map(([x, y]) => [x, y, 'farol', 40, 0.85, 'noche']));
    // casa de los granjeros: el caldero
    const cg = V['ed_casa_granjeros_san_roque.main'] = V['ed_casa_granjeros_san_roque.main'] || {};
    cg.burbujas = (cg.burbujas || []).concat([[107, 88]]);
    // Bosque Embrujado: más niebla que se arrastra (la pintada se fue)
    const be = V['ed_bosque_embrujado.main'];
    if (be && be.niebla) { be.niebla.n = 18; be.niebla.alfa = 0.16; }
    // Jardín: la fuente nueva reemplaza los chorritos
    const jr = V['ed_jardin_real.main']; if (jr) jr.chorros = [];
  };
  ponerVida();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerVida);
  // la muralla: los braseros del parapeto
  try {
    const FS = window.CK_FUEGOS_SALAS = window.CK_FUEGOS_SALAS || {};
    FS.muralla = FS.muralla || { cajas: [], suave: true };
    FS.muralla.cajas = (FS.muralla.cajas || []).concat([[385, 168, 236, 58]]);
  } catch (e) {}

  // ================================================================== 4. lo de cada lugar, al entrar
  const Z = {
    campos: 'ed_campos_del_roble.main', bosque: 'ed_bosque_embrujado.main', cementerio: 'ed_cementerio_real.main',
    jardin: 'ed_jardin_real.main', patio: 'castle.courtyard', muralla: 'castle.walls', galerias: 'ed_cueva_galerias.main',
    afueras: 'ed_afueras_orcas.main', pueblo: 'ed_pueblo_orco.main', mazmorra: 'ed_mazmorra_sello.main', sendero: 'ed_sendero_orco.main'
  };
  const limpiar = S => { (S._ckNV || []).forEach(o => { try { o && o.destroy && o.destroy(); } catch (e) {} }); S._ckNV = []; S._ckNVz = null; };
  const add = (S, o) => { S._ckNV.push(o); return o; };
  const texturas = S => {
    if (S.textures.exists('ckna_punto')) return;
    const c = S.textures.createCanvas('ckna_punto', 8, 8), g = c.getContext();
    const r = g.createRadialGradient(4, 4, 0, 4, 4, 4); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 8, 8); c.refresh();
    const p = S.textures.createCanvas('ckna_paja', 2, 1), q = p.getContext(); q.fillStyle = '#e9c66a'; q.fillRect(0, 0, 2, 1); p.refresh();
  };

  // --- Campos: trigo con cuerpo (2)
  const TRIGO = [[582, 14, 168, 58], [638, 72, 112, 76]];
  const armarCampos = (S, a) => {
    if (S._ckTrigo) { S._ckTrigo.forEach(o => o.destroy()); S._ckTrigo = null; }   // los óvalos de luz que corrían
    const sk = sueloDe(S, a); if (!sk || !S.textures.exists(sk)) return;
    const ov = add(S, S.add.image(a.x, a.y, sk).setOrigin(0, 0).setVisible(false));
    S._ckNVtrigo = { ov, a, paso: 0, ult: null };
  };
  const enTrigo = (x, y) => TRIGO.some(([tx, ty, tw, th]) => x >= tx + 2 && x <= tx + tw - 2 && y >= ty + 6 && y <= ty + th + 4);
  const vivirCampos = (S, dt) => {
    const T = S._ckNVtrigo, p = S.player; if (!T || !p || !p.body) return;
    const a = T.a, fx = p.body.center.x - a.x, fy = p.body.bottom - a.y;
    if (!enTrigo(fx, fy)) { T.ov.setVisible(false); return; }
    // el trigo de delante de los pies tapa las piernas (una franja recortada del mismo suelo)
    const sx = Math.round(fx - 13), sy = Math.round(fy - 9), mov = Math.abs(p.body.velocity.x) + Math.abs(p.body.velocity.y) > 5;
    const vaiven = mov ? Math.round(Math.sin(S.time.now / 70)) : 0;
    T.ov.setVisible(true).setCrop(sx, sy, 26, 11).setPosition(a.x + vaiven, a.y).setDepth(p.depth + 0.6);
    if (!mov) return;
    T.paso -= dt;
    if (T.paso <= 0) {
      T.paso = 140;
      for (let i = 0; i < 2; i++) {
        const s = add(S, S.add.image(p.body.center.x + R(-8, 8), p.body.bottom - R(2, 10), 'ckna_paja').setDepth(p.depth + 0.7).setAngle(R(0, 180)));
        S.tweens.add({ targets: s, x: s.x + R(-10, 10), y: s.y - R(6, 14), angle: s.angle + R(-120, 120), alpha: 0, duration: R(500, 800), ease: 'Quad.easeOut', onComplete: () => s.destroy() });
      }
      if (Math.random() < 0.35) son('grass_step', 0.18, { rate: R(0.8, 1.1) }) || son('step_grass', 0.18);
    }
  };

  // --- Bosque: velas (12) y agua (13)
  const armarBosque = (S, a) => {
    texturas(S);
    // velas: los píxeles de llama de la pieza de las velas
    const vel = S.children.list.find(o => o.texture && /^ed_be_velas/.test(o.texture.key));
    const B = S._ckNVbosque = { velas: [], agua: [], prox: 0, a };
    if (vel) {
      const px = pixeles(S, vel.texture.key);
      if (px) {
        const left = vel.x - vel.displayWidth * vel.originX, top = vel.y - vel.displayHeight * vel.originY, pts = [];
        for (let y = 0; y < px.h; y++) for (let x = 0; x < px.w; x++) {
          const i = (y * px.w + x) * 4; if (px.d[i + 3] < 200) continue;
          if (px.d[i] > 215 && px.d[i + 1] > 150 && px.d[i + 2] < 150 && !pts.some(q => Math.abs(q[0] - x) < 4 && Math.abs(q[1] - y) < 6)) pts.push([x, y]);
        }
        pts.slice(0, 10).forEach(([x, y], i) => {
          const g = add(S, S.add.image(left + x * vel.scaleX, top + y * vel.scaleY, 'ckna_punto').setTint(0xffc060).setBlendMode(Phaser.BlendModes.ADD).setDepth(vel.depth + 0.1).setScale(1.2));
          B.velas.push({ g, f: R(0, 6), v: R(0.006, 0.011) });
        });
      }
    }
    // agua: puntos de agua oscura del suelo (en las tres zonas grandes)
    const sk = sueloDe(S, a), px = sk && pixeles(S, sk);
    if (px) {
      [[682, 158, 308, 259], [996, 563, 363, 239], [139, 374, 551, 428]].forEach(([bx, by, bw, bh]) => {
        for (let k = 0; k < 900; k++) {
          const x = Math.floor(bx + Math.random() * bw), y = Math.floor(by + Math.random() * bh), i = (y * px.w + x) * 4;
          const r = px.d[i], g = px.d[i + 1], b = px.d[i + 2], L = 0.3 * r + 0.59 * g + 0.11 * b;
          if (L < 40 && b >= r && g >= r - 2) B.agua.push([x, y]);
        }
      });
    }
  };
  const vivirBosque = (S, dt) => {
    const B = S._ckNVbosque; if (!B) return;
    const t = S.time.now;
    B.velas.forEach(v => { v.g.setAlpha(0.55 + 0.3 * Math.sin(t * v.v + v.f) + 0.15 * Math.sin(t * v.v * 2.7 + v.f)).setScale(1.1 + 0.25 * Math.sin(t * v.v * 1.9 + v.f)); });
    B.prox -= dt;
    if (B.prox <= 0 && B.agua.length) {
      B.prox = 90;
      const [x, y] = B.agua[(Math.random() * B.agua.length) | 0], a = B.a;
      if (Math.random() < 0.8) {                      // brillo
        const s = add(S, S.add.rectangle(a.x + x, a.y + y, R(2, 4), 1, 0xbfe8e0).setAlpha(0).setDepth(7.45));
        S.tweens.add({ targets: s, alpha: R(0.35, 0.6), duration: 400, yoyo: true, onComplete: () => s.destroy() });
      } else {                                        // onda
        const g = add(S, S.add.graphics().setDepth(7.44)), o = { k: 0 };
        S.tweens.add({ targets: o, k: 1, duration: 1500, ease: 'Sine.easeOut', onUpdate: () => { g.clear(); g.lineStyle(1, 0xa8d8d0, 0.4 * (1 - o.k)); g.strokeEllipse(a.x + x, a.y + y, 4 + o.k * 14, 2 + o.k * 6); }, onComplete: () => g.destroy() });
      }
    }
  };

  // --- Cementerio: runas que brillan (20)
  const armarCementerio = (S, a) => {
    const sk = sueloDe(S, a), px = sk && pixeles(S, sk); if (!px) return;
    const x0 = 590, y0 = 350, w = 260, h = 190, k = 'ckna_runas';
    if (!S.textures.exists(k)) {
      const c = S.textures.createCanvas(k, w, h), g = c.getContext(), out = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = ((y0 + y) * px.w + x0 + x) * 4, r = px.d[i], gg = px.d[i + 1], b = px.d[i + 2], o = (y * w + x) * 4;
        if (gg > r + 14 && gg > b + 4 && gg > 70) { out.data[o] = 90; out.data[o + 1] = 255; out.data[o + 2] = 150; out.data[o + 3] = 255; }
      }
      g.putImageData(out, 0, 0); c.refresh();
    }
    const im = add(S, S.add.image(a.x + x0, a.y + y0, k).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.42).setAlpha(0.2));
    S._ckNVrunas = { im, a };
  };
  const vivirCementerio = S => {
    const R0 = S._ckNVrunas; if (!R0) return;
    const t = S.time.now, n = noche(S);
    R0.im.setAlpha((0.16 + 0.22 * n) * (0.65 + 0.35 * Math.sin(t / 700)) + 0.06 * Math.sin(t / 173));
  };

  // --- Jardín: la fuente (36)
  const FUENTE = { tope: [476, 206], caidas: [[461, 226, 236], [491, 226, 236], [452, 246, 264], [500, 246, 264], [476, 248, 266]], pileta: [476, 264, 30, 9] };
  const armarJardin = (S, a) => {
    const fu = S.children.list.find(o => o.texture && /fuente/.test(o.texture.key) && Math.abs(o.x - a.x - 476) < 40);
    const dep = fu ? fu.depth + 0.5 : a.y + 300;
    const g = add(S, S.add.graphics().setDepth(dep));
    S._ckNVfuente = { g, a, prox: 0, dep };
  };
  const vivirJardin = (S, dt) => {
    const F = S._ckNVfuente; if (!F) return;
    const g = F.g, a = F.a, t = S.time.now / 1000;
    g.clear();
    // el chorro de arriba: un arco de gotas
    for (let i = 0; i < 7; i++) {
      const k = ((t * 1.6 + i / 7) % 1), [x, y] = FUENTE.tope;
      g.fillStyle(0xdff6ff, 0.75 * (1 - k)); g.fillRect(a.x + x - 1 + (i % 2 ? -1 : 1) * k * 7, a.y + y - 6 * Math.sin(k * Math.PI) + k * 12, 1, 2);
    }
    // las caídas de un piso al otro: rayitas que bajan
    FUENTE.caidas.forEach(([x, y0, y1], j) => {
      g.fillStyle(0xbfe6ff, 0.35); g.fillRect(a.x + x - 1, a.y + y0, 2, y1 - y0);
      for (let i = 0; i < 3; i++) { const k = ((t * 2.2 + i / 3 + j * 0.17) % 1); g.fillStyle(0xffffff, 0.8 * (1 - k)); g.fillRect(a.x + x - 1, a.y + y0 + k * (y1 - y0), 2, 2); }
    });
    // ondas en la pileta
    F.prox -= dt;
    if (F.prox <= 0) {
      F.prox = 380;
      const [cx, cy, rx, ry] = FUENTE.pileta, an = Math.random() * Math.PI * 2, kk = Math.sqrt(Math.random()) * 0.85;
      const x = a.x + cx + Math.cos(an) * rx * kk, y = a.y + cy + Math.sin(an) * ry * kk, o = { k: 0 }, gg = add(S, S.add.graphics().setDepth(F.dep - 0.1));
      S.tweens.add({ targets: o, k: 1, duration: 1100, onUpdate: () => { gg.clear(); gg.lineStyle(1, 0xe8f8ff, 0.6 * (1 - o.k)); gg.strokeEllipse(x, y, 3 + o.k * 12, 1 + o.k * 4); }, onComplete: () => gg.destroy() });
    }
  };

  // --- Afueras y Pueblo Orco: antorchas (99, 110)
  const ANTORCHAS = { afueras: { n: 8, sem: 31 }, pueblo: { n: 10, sem: 57 }, sendero: { n: 7, sem: 89 } };   // (15/11, nota 29: también el Sendero Orco)
  const azar = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const armarAntorchas = (S, a, cual) => {
    const c = ANTORCHAS[cual]; if (!S.textures.exists('ed_pa_antorcha_pie')) return;
    const rnd = azar(c.sem), cajas = [];
    [S.interiorObstacles, S.obstacles, S.waterObstacles].filter(Boolean).forEach(gr => gr.getChildren().forEach(z => { const b = z.body; if (b && b.enable) cajas.push([b.x - a.x, b.y - a.y, b.right - a.x, b.bottom - a.y]); }));
    const fuegos = (S._ckfv || []).filter(o => o.type === 'Sprite').map(o => [o.x - a.x, o.y - a.y]);
    const libre = (x, y) => !cajas.some(([x0, y0, x1, y1]) => x > x0 - 12 && x < x1 + 12 && y > y0 - 6 && y < y1 + 14) &&
      !(a.exits || []).some(e => x > e.x - a.x - 40 && x < e.x - a.x + e.w + 40 && y > e.y - a.y - 40 && y < e.y - a.y + e.h + 40);
    const pts = [];
    for (let k = 0; k < 600 && pts.length < c.n; k++) {
      const x = 40 + rnd() * (a.w - 80), y = 50 + rnd() * (a.h - 90);
      if (!libre(x, y) || pts.some(([px, py]) => Math.hypot(px - x, py - y) < 130) || fuegos.some(([px, py]) => Math.hypot(px - x, py - y) < 90)) continue;
      pts.push([x, y]);
    }
    const L = S._ckNVantorchas = [];
    pts.forEach(([x, y]) => {
      const palo = add(S, S.add.image(a.x + x, a.y + y, 'ed_pa_antorcha_pie').setOrigin(0.5, 1).setDepth(a.y + y));
      const ll = add(S, S.add.sprite(a.x + x, a.y + y - 32, 'ed_st_llama_antorcha_1').setOrigin(0.5, 1).setDepth(a.y + y + 0.1).setScale(0.8));
      if (S.anims.exists('ed_st_llama_antorcha_1')) ll.play({ key: 'ed_st_llama_antorcha_1', startFrame: (x | 0) % 6 });
      const z = add(S, S.add.zone(a.x + x, a.y + y - 3, 8, 6)); S.physics.add.existing(z, true); if (S.interiorObstacles) S.interiorObstacles.add(z);
      L.push({ palo, ll, x: a.x + x, y: a.y + y });
    });
    vivirAntorchas(S);
  };
  const vivirAntorchas = S => {
    const L = S._ckNVantorchas; if (!L) return;
    const n = noche(S), on = n > 0.15;
    L.forEach(t => {
      t.ll.setVisible(on).setAlpha(Math.min(1, n * 1.4));
      if (on) t.palo.setCrop(); else t.palo.setCrop(0, 9, 15, 32);   // de día, sin la llama pintada de la punta
    });
  };
  if (window.CK_LUZ && window.CK_LUZ.fuente) window.CK_LUZ.fuente((S, out) => {
    const L = S._ckNVantorchas; if (!L || !L.length) return;
    const n = noche(S); if (n < 0.15) return;
    const t = S.time ? S.time.now : 0;
    L.forEach((o, i) => { const ll = 0.92 + 0.08 * Math.sin(t * 0.004 + i * 1.7); out.push({ x: o.x, y: o.y - 34, c: [255, 150, 70], r: 70 * ll, f: 0.85 * n * ll }); });
  });
  if (window.CK_LUZ && window.CK_LUZ.fuente) window.CK_LUZ.fuente((S, out) => {   // las velas del bosque alumbran un poco
    const B = S._ckNVbosque; if (!B || zonaDe(S) !== Z.bosque) return;
    B.velas.forEach(v => out.push({ x: v.g.x, y: v.g.y, c: [255, 186, 104], r: 26, f: 0.55 * v.g.alpha }));
  });

  // --- arreglos de llamas (74, 141) y braseros de la muralla (48)
  const llamas = S => (S._ckfv || []).filter(o => o && o.active && o.type === 'Sprite');
  const arreglarLlamas = (S, z, a) => {
    if (z === Z.galerias) {
      llamas(S).forEach(o => { if (Math.abs(o.x - a.x - 969) < 30 && Math.abs(o.y - a.y - 645) < 30) o.destroy(); });
      (S._ckBraseros || []).forEach(b => { if (Math.abs(b.x - a.x - 968) < 4 && b.sp && b.sp.setScale) b.sp.setScale(0.72); });
    }
    if (z === Z.mazmorra) {                         // la llama pintada de cada brasero queda tapada por la animada, un poco más grande
      llamas(S).forEach(o => { if (!o._ckNVgrande) { o._ckNVgrande = true; o.setScale(o.scaleX * 1.3); } });
    }
  };
  const muralla = S => {                              // ck_fuegos_vivos sólo mira los mapas "ed_": se le muestra la muralla con ese nombre
    const FV = window.CK_FUEGOS_VIVOS; if (!FV || !FV.poner) return;
    const z0 = S.currentZoneKey;
    try { S.currentZoneKey = () => 'ed_muralla.main'; FV.poner(S); } catch (e) {} finally { S.currentZoneKey = z0; }
  };

  // ================================================================== 5. enganches
  const armar = S => {
    limpiar(S);
    const z = zonaDe(S), c = S.currentInterior, a = c && c.area; if (!a) return;
    S._ckNV = []; S._ckNVz = z;
    S._ckNVtrigo = S._ckNVbosque = S._ckNVrunas = S._ckNVfuente = S._ckNVantorchas = null;
    texturas(S);
    try {
      if (z === Z.campos) armarCampos(S, a);
      if (z === Z.bosque) armarBosque(S, a);
      if (z === Z.cementerio) armarCementerio(S, a);
      if (z === Z.jardin) armarJardin(S, a);
      if (z === Z.afueras) armarAntorchas(S, a, 'afueras');
      if (z === Z.pueblo) armarAntorchas(S, a, 'pueblo');
      if (z === Z.sendero) armarAntorchas(S, a, 'sendero');
    } catch (e) { console.warn('[notas visual]', z, e); }
    // las llamas vivas se ponen un rato después de entrar (ck_fuegos_vivos): se miran unas veces
    [1500, 3000, 5000].forEach(ms => S.time.delayedCall(ms, () => {
      if (zonaDe(S) !== z || !S.currentInterior) return;
      try { arreglarLlamas(S, z, S.currentInterior.area); } catch (e) {}
      if (z === Z.muralla && !(S._ckfv && S._ckfv.length)) muralla(S);   // ck_fuegos_vivos borra las suyas al mirar el lugar
    }));
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { const S = this; S.time.delayedCall(80, () => { if (S.currentInterior) armar(S); }); } catch (e) {}
    return r;
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0 ? u0.apply(this, arguments) : undefined;
    try {
      const S = this, z = zonaDe(S);
      if (S._ckNVz && S._ckNVz !== z) limpiar(S);
      if (S._ckNVz) {
        const dt = delta || 16;
        if (z === Z.campos) { if (S._ckTrigo) { S._ckTrigo.forEach(o => o.destroy()); S._ckTrigo = null; } vivirCampos(S, dt); }
        else if (z === Z.bosque) vivirBosque(S, dt);
        else if (z === Z.cementerio) vivirCementerio(S);
        else if (z === Z.jardin) vivirJardin(S, dt);
        else if (z === Z.afueras || z === Z.pueblo || z === Z.sendero) { if ((S._ckNVcuenta = (S._ckNVcuenta || 0) + 1) % 30 === 0) vivirAntorchas(S); }
      }
      if (z === Z.patio && (S._ckNVpal = (S._ckNVpal || 0) + 1) % 30 === 0)   // sin palomas en el patio (41)
        S.children.list.slice().forEach(o => { if (o.texture && /^ckf_ave_paloma/.test(o.texture.key)) o.destroy(); });
    } catch (e) {}
    return r;
  };
  window.CK_NOTAS_VISUAL = { Z, TRIGO, FUENTE, ANTORCHAS, PAL_CLARO, armar };
})();
