'use strict';
/* Motor de luz.
   Cada cuadro se pinta un "mapa de luz": la oscuridad del momento (noche, clima, sala interior) con las luces sumadas,
   cada una con su color y un halo suave, y eso se multiplica sobre la escena. El héroe, los aldeanos y las bestias toman
   el color de la luz que tienen cerca.
   Fuentes (todas automáticas, también las que se agreguen después):
   - las luces del editor (`CK_EDITOR.lucesVivas`, con su color);
   - todo brillo aditivo del juego (`fx_glow` y parecidos: antorchas, braseros, candelabros, faroles del castillo y las ruinas),
     con el color de su tinte y su parpadeo;
   - ventanas, faroles y fogata de la aldea;
   - sprites por textura (`POR_TEXTURA`: bolas de fuego, rayos del nigromante, fogatas, braseros, velas);
   - habilidades: carga y rayo del mago (con destello de toda la escena), golpes;
   - lo que sume otro archivo con `CK_LUZ.agregar(...)`.
   Afuera manda la hora y el clima (`ck_clima.js`); adentro, `AMB_SALA` (cada sala un poco en penumbra, más de noche).
   ?ck_sin_luz=1 lo apaga. Sacar la línea de index.html vuelve a lo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  if (/[?&]ck_sin_luz=1/.test(location.search)) return;
  const P = MainGameScene.prototype;

  // ------------------------------------------------------------------ ajustes
  const NOCHE = [58, 70, 128]; // color de la oscuridad a medianoche (más bajo = más oscuro)
  const BANDAS = 0; // 0 = luz suave (degradé continuo); 5-8 = anillos escalonados estilo pixel art
  const ALCANCE = 1.3; // la luz suave se estira un poco para que el borde se pierda despacio
  const COL = {
    ventana: [255, 196, 118],
    farol: [255, 206, 128],
    fogata: [255, 138, 56],
    antorcha: [255, 150, 66],
    rayo: [150, 205, 255],
    rayoGrande: [255, 246, 206],
    fuego: [255, 128, 44],
    nigro: [178, 96, 255],
    golpe: [255, 236, 190]
  };
  // salas interiores: color de la penumbra de día (de noche se oscurece un poco más hacia NOCHE_SALA)
  const AMB_SALA = {
    'ed_taberna_2.main': [196, 178, 158],
    'ed_salon_del_trono_3.main': [206, 196, 184],
    'castle.kingroom': [196, 184, 170],
    'castle.library': [192, 182, 170],
    'castle.kitchen': [206, 194, 178],
    'castle.armory': [200, 192, 182],
    'granero.main': [210, 198, 180],
    'casa.main': [212, 200, 184],
    'tienda.main': [212, 200, 184],
    '*': [214, 206, 194]
  };
  const NOCHE_SALA = 0.4; // cuánto más oscura queda una sala de noche (0 = igual que de día)
  // zonas de afuera con penumbra propia aunque sea de día (la maldición de las ruinas)
  const PENUMBRA = { 'ruins.village': [176, 176, 196] };
  // sprites que dan luz por su textura
  const POR_TEXTURA = [
    [/fireball/, { c: COL.fuego, r: 74, f: 1, titila: 1, sigue: 1, final: { c: COL.fuego, r: 96, ms: 320 } }],
    [/necro_bolt/, { c: COL.nigro, r: 62, f: 0.95, titila: 0.5, sigue: 1 }],
    [/campfire|fogata/, { c: COL.fogata, r: 120, f: 1, titila: 1, sigue: 1, fijo: 1 }],
    [/antorcha|brasero|vela|candle/, { c: COL.antorcha, r: 80, f: 0.95, titila: 1, sigue: 1, fijo: 1 }]
  ];

  // brillos aditivos que se toman como luz (tinte = color, transparencia = fuerza)
  const BRILLO = /glow|brillo|resplandor|halo/;

  // la luz se dibuja a media resolución (cada punto = 2x2 píxeles del mundo): más liviano y con aire de pixel art
  const ESC = 2;
  const KEY = 'ck_luz_mapa';

  // ------------------------------------------------------------------ luces de paso (habilidades, golpes)
  // {x, y, sigue, c, r, f, ms, t0, titila, curva}
  const pasajeras = [];
  const fuentes = [];
  let ultimas = [];
  // reloj propio: respeta la cámara lenta del juego (timeScale)
  const reloj = s => s._ckLuzT || 0;
  const agregar = (s, l) => { l.t0 = reloj(s); pasajeras.push(l); return l; };
  let destello = null; // {t0, ms, k}: el rayo ilumina toda la escena

  // ------------------------------------------------------------------ juntar las luces del cuadro
  const hex = h => { const n = parseInt(String(h || '#ffc46b').replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const juntar = s => {
    const t = reloj(s), out = [];
    // luces fijas (fogatas, antorchas, luces del mapa): el clima puede tenerlas apagadas (lluvia)
    const at = window.CK_CLIMA && window.CK_CLIMA.atenuar;
    const fijas = (l) => { if (at) l.f *= at(l.x, l.y); out.push(l); };
    // aldea: ventanas, faroles y fogata
    const al = s._ckAldea;
    if (al && al.vid && al.vid.active && al.vid.visible !== false && !s.currentInterior) {
      al.halos.forEach((h, i) => {
        if (!h.active) return;
        const farol = h.displayWidth <= 40;
        fijas({ x: h.x, y: h.y + (farol ? 10 : 18), r: farol ? 62 : Math.max(46, h.displayWidth * 0.75), c: farol ? COL.farol : COL.ventana,
          f: Math.min(1, al.luz) * (0.92 + 0.08 * Math.sin(t / 300 + i)) });
      });
      if (al.fogNoche && al.fogNoche.active) {
        const ll = 0.86 + 0.14 * Math.sin(t / 90) * Math.sin(t / 233);
        fijas({ x: al.fogNoche.x, y: al.fogNoche.y + 6, r: 150 * (0.96 + 0.04 * ll), c: COL.fogata, f: ll });
      }
    }
    // luces del editor
    const ED = window.CK_EDITOR;
    if (ED && ED.lucesVivas)
      ED.lucesVivas.forEach(v => {
        if (!v.im || !v.im.active || !v.im.visible) return;
        fijas({ x: v.im.x, y: v.im.y, r: v.im.displayWidth * 0.62, c: hex(v.l.color), f: Math.min(1, v.im.alpha * 1.7) });
      });
    // sprites que alumbran (bolas de fuego, fogatas, antorchas...) y brillos aditivos del juego (fx_glow...)
    s.children.list.forEach(o => {
      if (!o.active || !o.visible || !o.texture || o._ckLuzNo) return;
      let d = o._ckLuz;
      if (d === undefined && o.blendMode === 1 && BRILLO.test(o.texture.key || '') && !/^ck_aldea_|^ckluz|^ck_luz/.test(o.texture.key)) d = o._ckLuz = 'brillo';
      if (d === 'brillo') {
        if (o.alpha < 0.02) return;
        const tt = o.tintTopLeft, c = tt === undefined || tt === 0xffffff ? COL.antorcha : [(tt >> 16) & 255, (tt >> 8) & 255, tt & 255];
        fijas({ x: o.x, y: o.y, r: Math.max(o.displayWidth, o.displayHeight) * 0.85, c, f: Math.min(1, o.alpha * 3.2) });
        return;
      }
      if (d === undefined) {
        const k = o.texture.key || '';
        const m = k.indexOf('ck_luz') === 0 || k.indexOf('ckluz') === 0 ? null : POR_TEXTURA.find(p => p[0].test(k));
        d = o._ckLuz = m ? m[1] : null;
        if (!d) { o._ckLuzNo = true; return; }
        if (d.final) o.once('destroy', () => agregar(s, { x: o.x, y: o.y, c: d.final.c, r: d.final.r, f: 1, ms: d.final.ms, curva: 'cae' }));
      }
      if (!d) return;
      const ti = d.titila ? 1 - d.titila * 0.12 * (0.5 + 0.5 * Math.sin(t / 70 + o.x) * Math.sin(t / 157)) : 1;
      (d.fijo ? fijas : l => out.push(l))({ x: o.x, y: o.y, r: d.r * (0.97 + 0.03 * ti), c: d.c, f: d.f * ti * (o.alpha === undefined ? 1 : o.alpha) });
    });
    // luces que suman otros archivos (luciérnagas, reflejos...): CK_LUZ.fuente(fn), fn(escena, lista)
    fuentes.forEach(fn => { try { fn(s, out); } catch (e) {} });
    // carga del trueno: el mago se va encendiendo de azul
    const tc = s.thunderCharge;
    if (tc && s.player && s.player.active) {
      const lv = tc.level || 1, b = s.player.body;
      out.push({ x: b ? b.center.x : s.player.x, y: b ? b.center.y : s.player.y, r: 46 + lv * 26 + Math.random() * 6, c: COL.rayo, f: 0.6 + lv * 0.13 });
    }
    // de paso
    for (let i = pasajeras.length - 1; i >= 0; i--) {
      const l = pasajeras[i], e = (t - l.t0) / l.ms;
      if (e >= 1 || (l.sigue && !l.sigue.active)) { pasajeras.splice(i, 1); continue; }
      // 'crece': a warning that gets brighter until it goes off (the Necromancer's spell mark)
      let k = l.curva === 'rayo' ? (e < 0.2 ? 1 : Math.pow(1 - e, 0.7) * (0.7 + 0.3 * Math.random())) : l.curva === 'crece' ? 0.35 + 0.65 * e : 1 - e * e;
      if (l.sigue) { l.x = l.sigue.x; l.y = l.sigue.y; }
      out.push({ x: l.x, y: l.y, r: l.r * (l.curva === 'rayo' ? 1 : 0.8 + 0.2 * (1 - e)), c: l.c, f: l.f * k });
    }
    return out;
  };

  // ------------------------------------------------------------------ el mapa de luz
  const fase = s => {
    const p = s.dayPhase ? s.dayPhase() : 0;
    const k = p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.1 : p < 0.92 ? 1 : (1 - p) / 0.08;
    return Math.max(0, Math.min(1, k));
  };
  const mezclar = (a, b, q) => a.map((x, i) => Math.round(x + (b[i] - x) * q));
  // ¿la zona es de afuera? Los mapas del editor vienen todos marcados como "afuera": las salas se reconocen por esta
  // lista, por estar en AMB_SALA o por tener `interior: true` en su mapa del editor.
  const INTERIORES = new Set(['ed_taberna_2.main', 'ed_salon_del_trono_3.main', 'ed_taberna_nueva.main', 'ed_salon_del_trono_nuevo.main']);
  const esAfuera = s => {
    const c = s.currentInterior;
    if (!c) return true;
    const zona = s.currentZoneKey ? s.currentZoneKey() : '';
    if (INTERIORES.has(zona) || (AMB_SALA[zona] && zona !== '*')) return false;
    const m = /^ed_(.+)\.main$/.exec(zona), D = window.EDITOR_DATA;
    if (m && D && D.mapas && D.mapas[m[1]] && D.mapas[m[1]].interior) return false;
    return !!c.area.outdoor;
  };
  window.CK_AFUERA = esAfuera;
  const pintar = s => {
    const c = s.currentInterior, afuera = esAfuera(s);
    const k = fase(s), zona = s.currentZoneKey ? s.currentZoneKey() : 'village';
    let L = s._ckLuzMapa;
    // oscuridad del momento y cuánto se encienden las luces
    let amb, kl;
    if (afuera) {
      amb = NOCHE.map(n => Math.round(255 + (n - 255) * k));
      kl = k;
      const pen = PENUMBRA[zona];
      if (pen) { amb = amb.map((a, i) => Math.round(a * pen[i] / 255)); kl = Math.max(kl, 0.55); }
      const cl = window.CK_CLIMA && window.CK_CLIMA.efecto ? window.CK_CLIMA.efecto(s) : null;
      if (cl) { amb = amb.map((a, i) => Math.round(a * cl.amb[i] / 255)); kl = Math.max(kl, cl.luces); }
    } else {
      const sala = AMB_SALA[zona] || AMB_SALA['*'];
      amb = mezclar(sala, NOCHE, k * NOCHE_SALA);
      kl = 1;
    }
    const usar = !s.studioOn && (amb[0] < 253 || amb[1] < 253 || amb[2] < 253 || destello);
    if (!usar) { ultimas = []; if (L) L.im.setVisible(false); return false; }
    const cam = s.cameras.main, v = cam.worldView;
    const M = 32, W = Math.ceil((v.width + M * 2) / ESC), H = Math.ceil((v.height + M * 2) / ESC);
    if (!L || !L.im.active || L.W < W || L.H < H) {
      if (L && L.im.active) L.im.destroy();
      if (s.textures.exists(KEY)) s.textures.remove(KEY);
      const RW = Math.max(W, 400), RH = Math.max(H, 260);
      const tex = s.textures.createCanvas(KEY, RW, RH);
      const im = s.add.image(0, 0, KEY).setOrigin(0, 0).setScale(ESC).setDepth(27500).setBlendMode(Phaser.BlendModes.MULTIPLY);
      // suave: el mapa de luz se estira con filtro lineal (sin los cuadraditos de media resolución)
      if (!BANDAS && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
      L = s._ckLuzMapa = { tex, g: tex.getContext(), im, W: RW, H: RH };
    }
    const x0 = Math.floor((v.x - M) / ESC) * ESC, y0 = Math.floor((v.y - M) / ESC) * ESC;
    L.im.setVisible(true).setPosition(x0, y0);
    // el rayo (o un relámpago de tormenta) levanta la oscuridad de golpe
    if (destello) {
      const e = (reloj(s) - destello.t0) / destello.ms;
      if (e >= 1) destello = null;
      else {
        const q = (e < 0.15 ? 1 : (1 - e) * (Math.random() < 0.25 ? 0.4 : 1)) * destello.k;
        amb = amb.map((a, i) => Math.round(a + (destello.c[i] - a) * q));
      }
    }
    const g = L.g;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgb(' + amb.join(',') + ')';
    g.fillRect(0, 0, L.W, L.H);
    g.globalCompositeOperation = 'lighter';
    ultimas = juntar(s);
    ultimas.forEach(l => {
      if (l.f <= 0.01 || l.r <= 1) return;
      const lx = (l.x - x0) / ESC, ly = (l.y - y0) / ESC, r = (l.r * (BANDAS ? 1 : ALCANCE)) / ESC;
      if (lx < -r || ly < -r || lx > L.W + r || ly > L.H + r) return;
      const f = Math.min(1, l.f) * kl, gr = g.createRadialGradient(lx, ly, 0, lx, ly, r);
      if (BANDAS) {
        // escalones: cada anillo un poco más apagado (como luz de pixel art)
        for (let b = 0; b < BANDAS; b++) {
          const d0 = b / BANDAS, d1 = (b + 1) / BANDAS, val = Math.pow(1 - d0, 1.6) * f;
          const col = 'rgb(' + l.c.map(x => Math.round(x * val)).join(',') + ')';
          gr.addColorStop(d0, col);
          gr.addColorStop(Math.min(1, d1 - 0.0001), col);
        }
      } else {
        // suave: cae como (1-d)², el centro apenas más blanco y el borde se funde con la noche
        for (let i = 0; i <= 16; i++) {
          const d = i / 16, val = Math.pow(1 - d, 2) * f, blanco = Math.max(0, 0.2 - d) * 1.2;
          gr.addColorStop(d, 'rgb(' + l.c.map(x => Math.round(Math.min(255, (x + (255 - x) * blanco) * val))).join(',') + ')');
        }
      }
      gr.addColorStop(1, 'rgb(0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(lx, ly, r, 0, Math.PI * 2); g.fill();
    });
    L.tex.refresh();
    return true;
  };

  // ------------------------------------------------------------------ enganches
  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    const r = dn0.apply(this, arguments);
    this._ckLuzT = (this._ckLuzT || 0) + Math.min(100, this.game.loop.delta || 16) * (this.time.timeScale === undefined ? 1 : this.time.timeScale);
    try {
      if (pintar(this) && this.nightShade) this.nightShade.setVisible(false);
    } catch (e) {
      if (!this._ckLuzError) { this._ckLuzError = true; console.warn('[luz]', e); }
    }
    return r;
  };
  // rayo del mago: fogonazo en el lugar y toda la escena iluminada un instante
  const rayo0 = P.thunderStrike;
  if (rayo0)
    P.thunderStrike = function (level) {
      const p = this.player, b = p && p.body, big = level === 3;
      const r = rayo0.apply(this, arguments);
      if (p && p.active) {
        const info = this.thunderLevelInfo ? this.thunderLevelInfo(level) : { radius: 90 };
        agregar(this, { x: b ? b.center.x : p.x, y: b ? b.bottom - 8 : p.y, c: big ? COL.rayoGrande : COL.rayo, r: (info.radius || 90) * 1.9 + 40, f: 1, ms: big ? 1700 : 1000, curva: 'rayo' });
        destello = { t0: reloj(this), ms: big ? 520 : 300, k: [0, 0.45, 0.6, 0.85][level] || 0.5, c: big ? [255, 250, 230] : [205, 228, 255] };
        if (big) this.time.delayedCall(210, () => { destello = { t0: reloj(this), ms: 420, k: 0.6, c: [255, 250, 230] }; });
      }
      return r;
    };
  // golpes: chispa corta donde pega
  const dano0 = P.damageEnemy;
  if (dano0)
    P.damageEnemy = function (enemy) {
      const r = dano0.apply(this, arguments);
      if (enemy && enemy.active !== false) agregar(this, { x: enemy.x, y: enemy.y - 6, c: COL.golpe, r: 44, f: 0.9, ms: 180 });
      return r;
    };

  window.CK_LUZ = {
    afuera: esAfuera, INTERIORES,
    agregar: l => window.game && agregar(window.game.scene.scenes.find(s => s.startCampaign), l),
    COL, NOCHE, AMB_SALA, PENUMBRA,
    /** Suma una fuente de luz que se consulta cada cuadro: fn(escena, lista) agrega {x,y,c,r,f} a la lista. */
    fuente: fn => fuentes.push(fn),
    /** Las luces del último cuadro (para reflejos). */
    ultimas: () => ultimas,
    /** Relámpago: toda la escena se aclara un instante hacia el color c ([r,g,b]); k = fuerza 0..1. */
    destello: (c, k, ms) => { const s = window.game && window.game.scene.scenes.find(x => x.startCampaign); if (s) destello = { t0: reloj(s), ms: ms || 300, k: k || 0.8, c: c || [220, 230, 255] }; },
    cuantas: () => { const s = window.game && window.game.scene.scenes.find(x => x.startCampaign); return s ? juntar(s).length : 0; }
  };
})();
