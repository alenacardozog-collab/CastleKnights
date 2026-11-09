'use strict';
/* La Frontera Orca, más viva y con un mismo color (03/11, pedido del dueño).
   1) PALETA: las Tierras Orcas (arena clara), el Pueblo Orco (barro marrón) y la Fortaleza (piedra azulada) parecían de
      tres juegos distintos. Al arrancar, el suelo y las piezas de esos tres mapas (ed_suelo_*, ed_ot_*, ed_op_*, ed_of_*)
      se llevan a un mismo tono de tierra cálida: cada mapa mueve su luz y su color medios hacia uno común (en Lab), y los
      colores fuertes (estandartes rojos, fuego, oro) casi no se tocan. Los números salen de orcos/paleta (par.json).
   2) ANIMACIONES (PixelLab, a partir de cada pieza): fogón del pueblo, braseros de la fortaleza y estandartes que se
      mueven con el viento. Las hojas están en ck_frontera_viva_arte.js; acá se les dice al Taller que son animadas.
   3) HUMO Y CHISPAS (dibujados por código): humo del fogón del pueblo y de la carreta quemada del bosque, chispas de la fragua.
   Borrar sus dos líneas de index.html (esta y la del arte) deja los mapas como estaban. Los PNG del Taller no cambian. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const A = window.EDITOR_ASSETS || {}, D = window.EDITOR_DATA || {};
  const ARTE = window.CK_FRONTERA_ARTE || {};

  // ------------------------------------------------------------------ 2) piezas animadas: se las registra en el Taller
  try {
    Object.keys(ARTE).forEach(key => {
      const h = ARTE[key];
      if (!A[key] || !D.assets || !D.assets[key]) return;
      A[key] = h.img;
      D.assets[key] = Object.assign({}, D.assets[key], { w: h.fw * h.n, h: h.fh,
        cuadros: { fw: h.fw, fh: h.fh, fps: h.fps || 8, bucle: true, vaiven: !!h.vaiven, orden: h.orden || null, dur: null, ev: null } });
      Object.keys(D.mapas || {}).forEach(m => (D.mapas[m].items || []).forEach(it => { if (it[0] === key && !it[4]) it[4] = key; }));
    });
  } catch (e) { console.warn('[frontera viva] arte', e); }
  // el velo de color de cada mapa también va al mismo tono (la fortaleza lo tenía azul)
  try {
    const M = D.mapas || {};
    [['tierras_orcas', '#2a2018', 0.1], ['pueblo_orco', '#2a1e16', 0.12], ['fortaleza_orca', '#261c18', 0.16]].forEach(([m, c, f]) => {
      if (M[m]) M[m].ambiente = { color: c, fuerza: f };
    });
  } catch (e) {}

  // ------------------------------------------------------------------ 1) paleta común
  const PAR = {
    ot: { mu: [48.93, 4.85, 12.77], sd: [23.6, 2.98, 8.43], tmu: [34, 6, 13], tsd: [17, 3, 7] },
    op: { mu: [31.62, 5.19, 7.88], sd: [13.67, 2.27, 6.0], tmu: [34, 5.5, 10], tsd: [15, 2.5, 6] },
    of: { mu: [24.07, 0.73, -2.64], sd: [15.75, 2.57, 5.3], tmu: [30, 4.5, 7], tsd: [16, 2.6, 5] }
  };
  const SUELO = { ed_suelo_tierras_orcas: 'ot', ed_suelo_pueblo_orco: 'op', ed_suelo_fortaleza_orca: 'of' };
  const grupo = k => SUELO[k] || (/^ed_(ot|op|of)_/.test(k) ? k.slice(3, 5) : null);
  // sRGB <-> Lab (D65), como skimage
  const lin = c => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92);
  const gam = c => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c);
  const XN = 0.95047, ZN = 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fi = t => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
  const aLab = (r, g, b) => {
    r = lin(r / 255); g = lin(g / 255); b = lin(b / 255);
    const x = (0.412453 * r + 0.357580 * g + 0.180423 * b) / XN, y = 0.212671 * r + 0.715160 * g + 0.072169 * b, z = (0.019334 * r + 0.119193 * g + 0.950227 * b) / ZN;
    const fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const aRgb = (L, a, b) => {
    const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
    const x = fi(fx) * XN, y = fi(fy), z = fi(fz) * ZN;
    const r = 3.240481 * x - 1.537151 * y - 0.498536 * z, g = -0.969256 * x + 1.875991 * y + 0.041556 * z, bb = 0.055648 * x - 0.204043 * y + 1.057311 * z;
    const c = v => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, v))) * 255)));
    return [c(r), c(g), c(bb)];
  };
  const transformar = (p, r, g, b) => {
    const L = aLab(r, g, b), C = Math.hypot(L[1], L[2]);
    const w = Math.max(0, Math.min(1, 1 - (C - 25) / 30));   // los colores fuertes casi no se tocan
    if (!w) return [r, g, b];
    const o = [0, 1, 2].map(i => L[i] * (1 - w) + ((L[i] - p.mu[i]) * (p.tsd[i] / p.sd[i]) + p.tmu[i]) * w);
    o[0] = Math.max(0, Math.min(100, o[0]));
    return aRgb(o[0], o[1], o[2]);
  };
  const HECHAS = (window.CK_FRONTERA_HECHAS = window.CK_FRONTERA_HECHAS || new Set());
  const recolorear = (S, key, p) => {
    if (HECHAS.has(key) || !S.textures.exists(key)) return;
    const t = S.textures.get(key), img = t.getSourceImage();
    if (!img || !img.width) return;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), px = d.data, cache = new Map();
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const k = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
      let o = cache.get(k);
      if (!o) { o = transformar(p, px[i], px[i + 1], px[i + 2]); cache.set(k, o); }
      px[i] = o[0]; px[i + 1] = o[1]; px[i + 2] = o[2];
    }
    g.putImageData(d, 0, 0);
    const cu = D.assets && D.assets[key] && D.assets[key].cuadros;
    S.textures.remove(key);
    if (cu) S.textures.addSpriteSheet(key, c, { frameWidth: cu.fw, frameHeight: cu.fh });
    else S.textures.addCanvas(key, c);
    HECHAS.add(key);
  };
  const create0 = P.create;
  // index.html?ck_sin_paleta=1 muestra los colores originales (para comparar)
  const SIN = /[?&]ck_sin_paleta=1/.test(location.search) || !!window.CK_SIN_PALETA;
  P.create = function () {
    if (SIN) return create0.apply(this, arguments);
    try {
      const t0 = performance.now();
      Object.keys(A).forEach(k => { const gk = grupo(k); if (gk) recolorear(this, k, PAR[gk]); });
      if (window.CK_DEBUG) console.log('[frontera viva] paleta en', Math.round(performance.now() - t0), 'ms');
    } catch (e) { console.warn('[frontera viva] paleta', e); }
    return create0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ 3) humo y chispas
  const FX = {
    'ed_pueblo_orco.main': [{ tipo: 'humo', x: 503, y: 268, cada: 520 }, { tipo: 'chispa', x: 800, y: 214, cada: 900 }],
    'ed_bosque_de_la_frontera.main': [{ tipo: 'humo', x: 566, y: 292, cada: 760 }],
    'ed_fortaleza_orca.main': [{ tipo: 'chispa', x: 612, y: 186, cada: 1300 }, { tipo: 'chispa', x: 736, y: 256, cada: 1400 }]
  };
  const texturas = S => {
    if (!S.textures.exists('ck_fv_humo')) {
      const g = S.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(1, 0, 2, 4); g.fillRect(0, 1, 4, 2);
      g.generateTexture('ck_fv_humo', 4, 4); g.destroy();
    }
    if (!S.textures.exists('ck_fv_chispa')) {
      const g = S.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 1, 1);
      g.generateTexture('ck_fv_chispa', 1, 1); g.destroy();
    }
  };
  const soltar = (S, a, e) => {
    const R = Phaser.Math.Between;
    if (e.tipo === 'humo') {
      const sp = S.add.image(a.x + e.x + R(-3, 3), a.y + e.y, 'ck_fv_humo').setTint(R(0, 1) ? 0x6b625a : 0x847a70).setAlpha(0.55).setScale(R(1, 2)).setDepth(a.y + 600);
      S.tweens.add({ targets: sp, y: sp.y - R(34, 52), x: sp.x + R(4, 14), alpha: 0, scale: sp.scale + 1.2, duration: R(2600, 3600), ease: 'Sine.easeOut', onComplete: () => sp.destroy() });
    } else {
      const sp = S.add.image(a.x + e.x + R(-4, 4), a.y + e.y, 'ck_fv_chispa').setTint(R(0, 1) ? 0xffc45a : 0xff7a2a).setDepth(a.y + 600).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: sp, y: sp.y - R(10, 22), x: sp.x + R(-6, 6), alpha: 0, duration: R(600, 1100), onComplete: () => sp.destroy() });
    }
  };
  const parar = S => { (S._ckFvEv || []).forEach(ev => ev.remove()); S._ckFvEv = []; };
  const mostrada0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrada0 ? mostrada0.apply(this, arguments) : undefined;
    try {
      parar(this);
      const z = this.currentZoneKey ? this.currentZoneKey() : '', lista = FX[z];
      if (lista && this.currentInterior) {
        texturas(this);
        const a = this.currentInterior.area;
        this._ckFvEv = lista.map(e => this.time.addEvent({ delay: e.cada, loop: true, callback: () => { if (this.currentZoneKey() === z) soltar(this, a, e); } }));
      }
    } catch (e) { console.warn('[frontera viva] fx', e); }
    return r;
  };
  ['onVillageShown', 'endStory'].forEach(k => {
    const f0 = P[k];
    P[k] = function () { try { parar(this); } catch (e) {} return f0 ? f0.apply(this, arguments) : undefined; };
  });

  window.CK_FRONTERA_VIVA = { PAR, transformar, FX };
})();
