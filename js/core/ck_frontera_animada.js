'use strict';
/* La Frontera Orca con vida (03/11, pedido del dueño: "las animaciones necesarias al mapa de los orcos, del agua, el follaje").
   - Bosque de la Frontera: la laguna brilla y de vez en cuando hace ondas (un pez, una gota); los árboles verdes se mecen
     apenas con el viento; caen hojas y hay mariposas de día; luciérnagas, ranas y pájaros (ck_fauna.js).
   - Tierras Orcas: el fogón de piedras humea y tira chispas; polvo en el aire; cuervos.
   - Pueblo Orco: los cerdos ya no están pintados quietos en el suelo: andan de verdad (2 junto a la choza de Gorak y 4 en
     el corral; sprites de PixelLab en ck_frontera_bestias_arte.js). Moscas y polvo.
   - Fortaleza Orca: ceniza que cae de los braseros y murciélagos.
   Borrar la línea de index.html lo saca (los cerdos pintados ya no vuelven: se sacaron del suelo del Taller). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZB = 'ed_bosque_de_la_frontera', ZT = 'ed_tierras_orcas', ZP = 'ed_pueblo_orco', ZF = 'ed_fortaleza_orca';
  const FUEGO = 0xff8a3c;
  const ARTE = window.CK_BESTIAS_ARTE;
  const LAGUNA = { x: 352, y: 177, rx: 58, ry: 30 }; // la laguna del bosque (elipse adentro del agua)
  const ARBOLES = /^ed_ob_(arbol_del_claro|pino|roble)/; // los árboles verdes del bosque (los secos no se mecen)

  const envolver = (k, fn) => {
    const L0 = INTERIOR_LAYOUTS[k];
    if (!L0) return;
    INTERIOR_LAYOUTS[k] = function (kit) {
      const r = L0.apply(this, arguments);
      try { const a = kit.areas && kit.areas.main; if (a) fn(a, kit); } catch (e) { console.warn('[frontera animada]', k, e); }
      return r;
    };
  };
  const fx = (a, f) => (a.fx = a.fx || []).push(f);

  envolver(ZB, a => {
    fx(a, { type: 'glints', x: LAGUNA.x - 48, y: LAGUNA.y - 24, w: 96, h: 46, n: 7 });
    fx(a, { type: 'leaves', x: 0, y: -10, w: 480, h: 360 });
    fx(a, { type: 'butterflies', x: 40, y: 220, w: 380, h: 200, n: 6 });
  });
  envolver(ZT, (a, kit) => {
    // el fogón de piedras: humo, chispas y una luz que titila
    a.items.push({ key: 'fx_px', x: 785, baseY: 418, scale: 0.01, embers: [0, -4] });
    fx(a, { type: 'steam', x: 785, y: 410 });
    if (kit.light) { kit.light(a, 785, 420, 40, FUEGO, 0.22); kit.light(a, 785, 414, 10, FUEGO, 0.32, { halo: true }); }
    fx(a, { type: 'dust', x: 0, y: 0, w: a.w || 958, h: a.h || 534 });
  });
  envolver(ZP, a => {
    fx(a, { type: 'dust', x: 0, y: 60, w: a.w || 958, h: (a.h || 534) - 60 });
    // los cerdos de verdad: junto a la choza de Gorak y en el corral
    if (ARTE && ARTE.cerdo) {
      const oy = ARTE.cerdo.pie / 40, cerdo = (pts, sc) => a.actors.push({ type: 'walker', key: 'ck_cerdo_idle', idle: 'ck_cerdo_idle', walk: 'ck_cerdo_walk',
        scale: sc || 0.95, ox: 0.5, oy, speed: 12, pts, lines: ['Oinc 🐷', 'El cerdo te mira y sigue hozando'] });
      cerdo([[62, 338, 3200], [92, 344, 2600], [70, 352, 2200]]);
      cerdo([[118, 342, 2400], [100, 332, 3000], [132, 350, 2000]]);
      cerdo([[152, 472, 2600], [196, 466, 3000], [170, 480, 1800]], 0.9);
      cerdo([[206, 466, 3400], [248, 474, 2200], [226, 460, 2600]], 0.9);
      cerdo([[250, 480, 2000], [214, 488, 2800], [262, 472, 2400]], 0.9);
      cerdo([[176, 498, 3000], [146, 492, 2200], [196, 496, 2600]], 0.9);
    }
  });
  envolver(ZF, a => {
    fx(a, { type: 'ash', x: -40, y: -40, w: (a.w || 958) + 40, h: (a.h || 534) });
  });

  // bichos (ck_fauna.js)
  const F = window.CK_FAUNA && window.CK_FAUNA.FAUNA;
  if (F) {
    F[ZB + '.main'] = Object.assign({ aves: 2, mariposas: 5, luciernagas: 14, peces: 2, ranas: 3, cuervos: 1 }, F[ZB + '.main'] || {});
    F[ZT + '.main'] = Object.assign({ cuervos: 3, murcielagos: 2 }, F[ZT + '.main'] || {});
    F[ZP + '.main'] = Object.assign({ cuervos: 2, murcielagos: 2 }, F[ZP + '.main'] || {});
    F[ZF + '.main'] = Object.assign({ murcielagos: 5, cuervos: 1 }, F[ZF + '.main'] || {});
  }

  // hojas de los cerdos
  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    if (!ARTE || !ARTE.cerdo) return;
    ['idle', 'walk'].forEach(k => { if (!this.textures.exists('ck_cerdo_' + k)) this.load.spritesheet('ck_cerdo_' + k, ARTE.cerdo[k].img, { frameWidth: 40, frameHeight: 40 }); });
  };
  const create0 = P.create;
  P.create = function () {
    const r = create0.apply(this, arguments);
    try {
      if (ARTE && ARTE.cerdo) [['idle', 5], ['walk', 9]].forEach(([k, fr]) => {
        const key = 'ck_cerdo_' + k;
        if (!this.anims.exists(key) && this.textures.exists(key))
          this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: ARTE.cerdo[k].n - 1 }), frameRate: fr, repeat: -1 });
      });
    } catch (e) { console.warn('[cerdos]', e); }
    return r;
  };

  // al entrar al bosque: los árboles verdes se mecen apenas (girando sobre su pie) y la laguna hace ondas
  const zona = s => (s.currentZoneKey ? s.currentZoneKey() : '');
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      if (area && zona(this) === ZB + '.main') {
        this.children.list.forEach(o => {
          if (o._ckMece || !o.texture || !ARBOLES.test(o.texture.key) || !o.visible) return;
          o._ckMece = true;
          this.tweens.add({ targets: o, angle: { from: -0.45, to: 0.55 }, duration: 2200 + (o.x * 7) % 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (o.y * 13) % 800 });
        });
        this._ckLaguna = { x: area.x + LAGUNA.x, y: area.y + LAGUNA.y, prox: 0 };
      } else this._ckLaguna = null;
    } catch (e) {}
    return r;
  };
  const update0 = P.update;
  P.update = function (time, delta) {
    const r = update0.apply(this, arguments);
    const L = this._ckLaguna;
    if (!L) return r;
    try {
      L.prox -= delta || 16;
      if (L.prox <= 0) {
        L.prox = 1400 + Math.random() * 2600;
        const t = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random()) * 0.8;
        const x = L.x + Math.cos(t) * LAGUNA.rx * k, y = L.y + Math.sin(t) * LAGUNA.ry * k;
        const g = this.add.graphics().setDepth(7.4), o = { k: 0 };
        this.tweens.add({ targets: o, k: 1, duration: 1600, ease: 'Sine.easeOut',
          onUpdate: () => { g.clear(); g.lineStyle(1, 0xd8f0ff, 0.55 * (1 - o.k)); g.strokeEllipse(x, y, 4 + o.k * 18, 2 + o.k * 8); if (o.k > 0.3) g.strokeEllipse(x, y, (o.k - 0.3) * 18, (o.k - 0.3) * 8); },
          onComplete: () => g.destroy() });
      }
    } catch (e) {}
    return r;
  };
  window.CK_FRONTERA_ANIMADA = { LAGUNA };
})();
