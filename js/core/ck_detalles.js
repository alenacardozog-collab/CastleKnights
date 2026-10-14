'use strict';
/* Detalles del mundo, todo por código:
   - Huellas del héroe: en la nieve, en el barro cuando llovió y en los caminos de tierra; se borran solas.
   - Charcos en los caminos cuando llueve un rato (se secan después): reflejan la luz de faroles y fogatas, les caen
     gotas y salpican si los pisás.
   - Viento visible: hojas que vuelan con las ráfagas y polvo en los caminos secos.
   - Humo en las chimeneas que ya vienen dibujadas en los mapas (`CHIMENEAS`), de noche, de mañana y con frío.
   - Agua viva: destellos sobre el agua con sol (y cerca de las luces de noche) y bruma sobre el agua al amanecer y con frío.
   - Sombras del sol bajo los personajes: largas a la mañana (hacia el oeste) y a la tarde (hacia el este), cortas al
     mediodía; con nubes se apagan y de noche no hay.
   Sacar la línea de index.html lo quita. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = a => a[Math.floor(Math.random() * a.length)];
  const sat = x => Math.max(0, Math.min(1, x));

  const zonaDe = S => (S.currentZoneKey ? S.currentZoneKey() : 'village');
  const areaDe = S => { const c = S.currentInterior; return c ? { x: c.area.x, y: c.area.y, w: c.area.w, h: c.area.h, out: window.CK_AFUERA ? window.CK_AFUERA(S) : c.area.outdoor } : { x: 0, y: 0, w: 640, h: 640, out: true }; };
  const ter = (zona, x, y) => (window.CK_MINIMAPA && window.CK_MINIMAPA.terreno ? window.CK_MINIMAPA.terreno(zona, x, y) : null);
  const clima = () => (window.CK_CLIMA && window.CK_CLIMA.estado ? window.CK_CLIMA.estado.act : { lluvia: 0, nieve: 0, viento: 0, amb: [255, 255, 255] });
  // profundidad del piso de cada zona (encima de la nieve del piso, debajo del agua animada y de todo lo demás)
  const PISO = { village: 0.58 };
  // chimeneas que vienen en el dibujo de cada mapa (boca de la chimenea, en píxeles del área)
  const CHIMENEAS = { 'ed_camino_al_castillo.main': [[184, 77]] };
  const profPiso = zona => (PISO[zona] !== undefined ? PISO[zona] : /^ed_/.test(zona) ? 7.29 : null);
  const nevado = zona => window.CK_NIEVE && window.CK_NIEVE.cuanta() > 0.25 && window.CK_NIEVE.zonas().some(z => z[0] === zona && z[1]);

  // ------------------------------------------------------------------ texturas
  const tex = (S, key, w, h, fn) => {
    if (S.textures.exists(key)) return key;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h);
    S.textures.addCanvas(key, cv); return key;
  };
  const texturas = S => {
    tex(S, 'ckd_huella', 4, 2, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); g.fillRect(3, 0, 1, 2); }); // pisada chiquita: punta y talón
    tex(S, 'ckd_hoja', 3, 2, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 1); g.fillRect(1, 1, 2, 1); });
    tex(S, 'ckd_punto', 2, 2, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });
    tex(S, 'ckd_destello', 5, 5, g => { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(2, 0, 1, 5); g.fillRect(0, 2, 5, 1); g.fillStyle = '#fff'; g.fillRect(2, 2, 1, 1); });
    tex(S, 'ckd_humo', 16, 16, g => { const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 16, 16); });
    tex(S, 'ckd_sombra', 32, 12, g => { g.save(); g.scale(1, 12 / 32); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.restore(); });
  };
  // charco: manchas de 3-4 elipses unidas (oscuro) y su máscara blanca para el reflejo
  const texCharco = (S, i) => {
    const key = 'ckd_charco' + i;
    if (S.textures.exists(key)) return key;
    const w = 44, h = 18, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), bl = [];
    for (let k = 0; k < 4; k++) bl.push([R(10, 34), R(6, 12), R(7, 13), R(3, 5.5)]);
    const dentro = (x, y) => bl.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1);
    const im = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!dentro(x + 0.5, y + 0.5)) continue;
      const borde = !dentro(x + 0.5, y - 0.5) || !dentro(x + 0.5, y + 1.5) || !dentro(x - 0.5, y + 0.5) || !dentro(x + 1.5, y + 0.5);
      const o = (y * w + x) * 4;
      im.data[o] = 255; im.data[o + 1] = 255; im.data[o + 2] = 255; im.data[o + 3] = borde ? 150 : 255;
    }
    g.putImageData(im, 0, 0);
    S.textures.addCanvas(key, cv);
    return key;
  };

  // ------------------------------------------------------------------ estado por zona
  const nuevaZona = (S, zona) => {
    const A = areaDe(S), Z = { zona, A, huellas: [], charcos: [], chimeneas: [], sombras: new Map(), paso: 0, ultimo: null, lado: 1 };
    const prof = profPiso(zona);
    // charcos en los caminos de tierra
    if (prof !== null && A.out && window.CK_MINIMAPA) {
      for (let i = 0, n = 0; i < 300 && n < 14; i++) {
        const x = R(20, A.w - 20), y = R(30, A.h - 20);
        if (ter(zona, x, y) !== 'camino' || ter(zona, x + 14, y) !== 'camino' || ter(zona, x - 14, y) !== 'camino') continue;
        if (Z.charcos.some(c => Math.hypot(c.ax - x, c.ay - y) < 60)) continue;
        const key = texCharco(S, n % 8), esc = R(0.8, 1.3);
        const fondo = S.add.image(A.x + x, A.y + y, key).setTint(0x2c3c58).setAlpha(0).setDepth(prof - 0.005).setScale(esc, esc * R(0.85, 1.1)).setVisible(false);
        const brillo = S.add.image(A.x + x, A.y + y, key).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(prof - 0.004).setScale(fondo.scaleX, fondo.scaleY).setVisible(false);
        Z.charcos.push({ ax: x, ay: y, x: A.x + x, y: A.y + y, fondo, brillo, rx: 20 * esc, ry: 8 * esc, salpico: 0 });
        n++;
      }
    }
    // humo de las chimeneas que ya están dibujadas en los mapas (x / y en píxeles del área: la boca de la chimenea)
    (CHIMENEAS[zona] || []).forEach(([x, y]) => {
      const humo = S.add.particles(A.x + x, A.y + y, 'ckd_humo', {
        x: { min: -1.5, max: 1.5 }, speedY: { min: -22, max: -12 }, speedX: { min: -2, max: 3 },
        accelerationX: { onEmit: () => clima().viento * 0.18 + 2 },
        lifespan: { min: 2400, max: 3800 }, scale: { start: 0.3, end: 1.6 }, alpha: { start: 0.3, end: 0 },
        tint: [0xc8ccd6, 0xb4b8c4, 0xd8dce4], frequency: 260, emitting: false
      }).setDepth(27505); // encima de la oscuridad: el humo se ve de noche
      Z.chimeneas.push({ humo });
    });
    return Z;
  };
  const limpiar = Z => {
    if (!Z) return;
    Z.huellas.forEach(h => h.s.destroy());
    Z.charcos.forEach(c => { c.fondo.destroy(); c.brillo.destroy(); });
    Z.chimeneas.forEach(c => { if (c.ch) c.ch.destroy(); c.humo.destroy(); });
    Z.sombras.forEach(s => s.destroy());
  };

  // ------------------------------------------------------------------ partículas compartidas
  const piezas = S => {
    if (S._ckDet && S._ckDet.hojas && S._ckDet.hojas.active) return S._ckDet;
    texturas(S);
    const hojas = S.add.particles(0, 0, 'ckd_hoja', {
      lifespan: { min: 2600, max: 4200 }, speedX: { onEmit: () => G.vx * R(0.8, 1.2) }, speedY: { min: -12, max: 16 },
      rotate: { start: 0, end: { onEmit: () => R(-540, 540) } }, scale: { min: 1, max: 1.6 }, alpha: { start: 0.95, end: 0 },
      tint: [0x6f9a3e, 0x8bb14a, 0xc58a2e, 0xa8622a, 0x5c8a34], emitting: false
    }).setDepth(27350);
    const polvo = S.add.particles(0, 0, 'ckd_humo', {
      lifespan: { min: 1200, max: 2000 }, speedX: { onEmit: () => G.vx * 0.6 }, speedY: { min: -6, max: 4 },
      scale: { start: 0.6, end: 2.6 }, alpha: { start: 0.22, end: 0 }, tint: [0xcab48a, 0xbca47a], emitting: false
    }).setDepth(27340);
    const destellos = S.add.particles(0, 0, 'ckd_destello', {
      lifespan: { min: 260, max: 520 }, scale: { start: 0.4, end: 1.1 }, alpha: { start: 0.9, end: 0 }, emitting: false
    }).setBlendMode(Phaser.BlendModes.ADD);
    const bruma = S.add.particles(0, 0, 'ckd_humo', {
      lifespan: { min: 5000, max: 8000 }, speedX: { min: 2, max: 7 }, speedY: { min: -2, max: 1 },
      scale: { start: 2.5, end: 5 }, alpha: { start: 0, end: 0, onUpdate: (p, k, t) => Math.sin(Math.PI * t) * 0.16 }, tint: 0xeef2f8, emitting: false
    });
    const gotas = S.add.particles(0, 0, 'ckd_punto', {
      lifespan: { min: 260, max: 420 }, speedX: { min: -40, max: 40 }, speedY: { min: -70, max: -30 }, gravityY: 260,
      scale: { min: 0.5, max: 1 }, alpha: { start: 0.85, end: 0 }, tint: 0xcfe0f4, emitting: false
    }).setDepth(27330);
    return (S._ckDet = { hojas, polvo, destellos, bruma, gotas });
  };
  const G = { vx: 0, rafaga: 0, proxima: 8000 };

  // ------------------------------------------------------------------ cada cuadro
  const paso = (S, Z, dt) => {
    const D = piezas(S), A = Z.A, zona = Z.zona, cl = clima(), v = S.cameras.main.worldView;
    const p = S.dayPhase ? S.dayPhase() : 0.2, noche = p > 0.6 && p < 0.94;
    const prof = profPiso(zona), b = S.player && S.player.body;
    const det = window.CK_DETALLES;
    // mojado del piso: sube con lluvia, baja despacio
    det.mojado = sat(det.mojado + (cl.lluvia > 0.3 ? dt / 25000 : -dt / 60000));

    // --- huellas
    if (b && prof !== null && A.out) {
      const fx = b.center.x, fy = b.bottom - 1;
      if (!Z.ultimo) Z.ultimo = [fx, fy];
      const d = Math.hypot(fx - Z.ultimo[0], fy - Z.ultimo[1]);
      if (d > 30) Z.ultimo = [fx, fy];
      else if (d >= 9) {
        const ang = Math.atan2(fy - Z.ultimo[1], fx - Z.ultimo[0]);
        Z.ultimo = [fx, fy];
        const t = ter(zona, fx - A.x, fy - A.y), nieve = nevado(zona);
        let tipo = null;
        if (nieve) tipo = 'nieve';
        else if (det.mojado > 0.3 && (t === 'pasto' || t === 'camino' || t === 'bosque')) tipo = 'barro';
        else if (t === 'camino') tipo = 'tierra';
        if (tipo) {
          Z.lado = -Z.lado;
          const ox = Math.cos(ang + Math.PI / 2) * 1.6 * Z.lado, oy = Math.sin(ang + Math.PI / 2) * 1.6 * Z.lado;
          const col = { nieve: 0x8090b4, barro: 0x3a2a1c, tierra: 0x6a5434 }[tipo], al = { nieve: 0.42, barro: 0.28, tierra: 0.12 }[tipo];
          const vida = { nieve: 22000, barro: 12000, tierra: 6000 }[tipo];
          const s = S.add.image(fx + ox, fy + oy, 'ckd_huella').setTint(col).setAlpha(al).setRotation(ang).setDepth(prof + 0.004);
          Z.huellas.push({ s, al, vida, t: 0 });
          if (Z.huellas.length > 90) Z.huellas.shift().s.destroy();
        }
      }
    }
    for (let i = Z.huellas.length - 1; i >= 0; i--) {
      const h = Z.huellas[i];
      h.t += dt;
      // la lluvia borra las huellas de tierra y la nieve que cae tapa las de nieve
      const rapido = (cl.lluvia > 0.3 ? 2 : 1) * (cl.nieve > 0.5 ? 1.6 : 1);
      const k = 1 - (h.t * rapido) / h.vida;
      if (k <= 0) { h.s.destroy(); Z.huellas.splice(i, 1); continue; }
      h.s.setAlpha(h.al * Math.min(1, k * 2.5));
    }

    // --- charcos
    const luces = det.mojado > 0.05 && window.CK_LUZ && window.CK_LUZ.ultimas ? window.CK_LUZ.ultimas() : [];
    Z.charcos.forEach(c => {
      const w = det.mojado * (nevado(zona) ? 0 : 1);
      c.fondo.setVisible(w > 0.02).setAlpha(0.66 * sat(w * 1.6));
      // reflejo: la luz más fuerte cerca, con su color, más un poco de cielo
      let mejor = null, fm = 0;
      luces.forEach(l => { const d = Math.hypot(l.x - c.x, l.y - c.y); const f = (l.f || 0) * Math.max(0, 1 - d / (l.r * 1.4 + 40)); if (f > fm) { fm = f; mejor = l; } });
      const cielo = noche ? 0 : 0.3;
      const fr = sat(fm * 0.85) * sat(w * 1.6);
      if (mejor && fr > 0.03) c.brillo.setTint(Phaser.Display.Color.GetColor(mejor.c[0], mejor.c[1], mejor.c[2])).setAlpha(fr).setVisible(true);
      else c.brillo.setTint(0xa8c0e0).setAlpha(cielo * sat(w * 1.6)).setVisible(w > 0.02 && cielo > 0);
      // gotas cayendo en el charco
      if (w > 0.3 && cl.lluvia > 0.3 && Math.random() < dt / 260 && v.contains(c.x, c.y)) {
        const em = S._ckClima && S._ckClima.onda;
        if (em) em.emitParticleAt(c.x + R(-c.rx * 0.7, c.rx * 0.7), c.y + R(-c.ry * 0.5, c.ry * 0.5), 1);
      }
      // salpica si lo pisás
      c.salpico -= dt;
      if (b && w > 0.3 && c.salpico <= 0 && ((b.center.x - c.x) / c.rx) ** 2 + ((b.bottom - c.y) / c.ry) ** 2 < 1 && Math.abs(b.velocity.x) + Math.abs(b.velocity.y) > 20) {
        c.salpico = 320;
        D.gotas.setDepth(b.bottom + 1);
        D.gotas.emitParticleAt(b.center.x, b.bottom - 1, S.isRunning ? 7 : 4);
        if (window.CK_SINTE) window.CK_SINTE.chapuzon(S, b.center.x, b.bottom, S.isRunning ? 0.7 : 0.45);
      }
    });

    // --- viento: hojas en las ráfagas y polvo en los caminos secos
    G.proxima -= dt;
    if (G.proxima <= 0) { G.rafaga = R(1800, 4200); G.proxima = R(7000, 20000); }
    G.rafaga = Math.max(0, G.rafaga - dt);
    const fuerza = sat(Math.abs(cl.viento) / 150) + (G.rafaga > 0 ? 0.55 : 0);
    const sentido = cl.viento ? Math.sign(cl.viento) : 1;
    G.vx = sentido * (40 + fuerza * 120);
    if (A.out && cl.nieve < 0.5 && fuerza > 0.3 && Math.random() < dt / 1000 * fuerza * 6) {
      const x = sentido > 0 ? v.x - 10 : v.right + 10, y = v.y + R(0, v.height);
      D.hojas.emitParticleAt(x, y, 1);
      if (Math.random() < 0.5) D.hojas.emitParticleAt(v.x + R(0, v.width), v.y + R(0, v.height), 1);
    }
    if (A.out && cl.lluvia < 0.1 && cl.nieve < 0.1 && det.mojado < 0.1 && G.rafaga > 0 && Math.random() < dt / 300) {
      const x = v.x + R(0, v.width), y = v.y + R(20, v.height);
      if (ter(zona, x - A.x, y - A.y) === 'camino') D.polvo.emitParticleAt(x, y, 1);
    }

    // --- chimeneas
    const frio = noche || p < 0.14 || p > 0.9 || cl.nieve > 0.2 || (window.CK_NIEVE && window.CK_NIEVE.cuanta() > 0.2);
    Z.chimeneas.forEach(c => { c.humo.emitting = frio; c.humo.frequency = cl.nieve > 0.2 ? 170 : 260; });

    // --- agua: destellos de sol (o de las luces) y bruma al amanecer y con frío
    if (A.out) {
      const sol = !noche && p < 0.55 ? sat(1 - (255 - ((cl.amb[0] + cl.amb[1] + cl.amb[2]) / 3)) / 60) : 0;
      const prob = dt / 1000 * (sol * 14 + (noche ? 3 : 0));
      if (prob > 0 && Math.random() < prob) {
        const x = v.x + R(0, v.width), y = v.y + R(0, v.height), ax = x - A.x, ay = y - A.y;
        if (ter(zona, ax, ay) === 'agua') {
          let ok = sol > 0;
          if (!ok) ok = luces.some(l => Math.hypot(l.x - x, l.y - y) < l.r);
          if (ok) { D.destellos.setDepth(zona === 'village' ? 0.63 : 7.03); D.destellos.emitParticleAt(Math.round(x), Math.round(y), 1); }
        }
      }
      const amanecer = p > 0.9 || p < 0.13;
      if ((amanecer || cl.nieve > 0.3) && Math.random() < dt / 700) {
        const x = v.x + R(0, v.width), y = v.y + R(0, v.height);
        if (ter(zona, x - A.x, y - A.y) === 'agua') { D.bruma.setDepth(zona === 'village' ? 0.64 : 7.295); D.bruma.emitParticleAt(x, y, 1); }
      }
    }

    // --- sombras del sol bajo los personajes
    sombras(S, Z, p, cl);
  };

  // personajes que llevan sombra: el héroe, las bestias y la gente
  const GENTE = /villager|npc|king|_idle|_walk|_run|_attack|skeleton|goblin|slime|orc|bandit|wolf|necro|boss/;
  const sombras = (S, Z, p, cl) => {
    const dia = p < 0.56 || p > 0.94;
    const t = sat(((p + 0.06) % 1) / 0.62); // 0 amanecer, 0.5 mediodía, 1 atardecer
    const sx = (t - 0.5) * 2;
    const nubes = sat((255 - (cl.amb[0] + cl.amb[1] + cl.amb[2]) / 3) / 70);
    const luzSol = dia && Z.A.out ? sat(Math.sin(t * Math.PI) * 3) * (1 - nubes) : 0;
    const vistos = new Set();
    if (luzSol > 0.02) {
      const v = S.cameras.main.worldView, largo = 0.35 + 1.9 * Math.abs(sx);
      const dx = sx, dy = -0.32, n = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
      const lista = [];
      if (S.player && S.player.active && S.player.visible) lista.push(S.player);
      S.children.list.forEach(o => {
        if (o === S.player || !o.active || !o.visible || o.type !== 'Sprite' || !o.texture || o.alpha < 0.5 || o.blendMode !== 0) return;
        if (!GENTE.test(o.texture.key) || !v.contains(o.x, o.y)) return;
        lista.push(o);
      });
      lista.forEach(o => {
        let s = Z.sombras.get(o);
        if (!s) { s = S.add.image(0, 0, 'ckd_sombra').setOrigin(0, 0.5); Z.sombras.set(o, s); }
        vistos.add(o);
        const pies = o === S.player && o.body ? [o.body.center.x, o.body.bottom - 1] : [o.x, o.y + o.displayHeight * (1 - o.originY) - 2];
        const ancho = Math.min(26, Math.max(10, (o === S.player && o.body ? o.body.width * 1.4 : o.displayWidth * 0.45)));
        s.setPosition(pies[0] - Math.cos(ang) * ancho * 0.3, pies[1] - Math.sin(ang) * ancho * 0.3)
          .setRotation(ang).setScale(ancho * largo / 32 + ancho / 64, ancho * 0.42 / 12)
          .setAlpha(0.4 * luzSol).setDepth(profPiso(Z.zona) !== null ? profPiso(Z.zona) + 0.006 : o.depth - 0.5).setVisible(true);
      });
    }
    Z.sombras.forEach((s, o) => { if (!vistos.has(o)) { if (!o.active) { s.destroy(); Z.sombras.delete(o); } else s.setVisible(false); } });
  };

  // ------------------------------------------------------------------ enganche
  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    try {
      if (this._gameMode === 'campaign' && !this.isGamePaused && this.player) {
        const zona = zonaDe(this);
        let Z = this._ckDetZona;
        if (!Z || Z.zona !== zona) {
          // zona nueva: se espera medio segundo a que termine de armarse
          if (Z) { limpiar(Z); this._ckDetZona = Z = null; this._ckDetEspera = 500; }
          if (this._ckDetEspera === undefined) this._ckDetEspera = 500;
          this._ckDetEspera -= Math.min(100, dt || 16);
          if (this._ckDetEspera <= 0 && !this._doorTransition) { this._ckDetZona = Z = nuevaZona(this, zona); this._ckDetEspera = undefined; }
        }
        if (Z) paso(this, Z, Math.min(100, dt || 16));
      }
    } catch (e) { if (!this._ckDetError) { this._ckDetError = true; console.warn('[detalles]', e); } }
    return dn0.apply(this, arguments);
  };
  const fin0 = P.endStory;
  if (fin0) P.endStory = function () { limpiar(this._ckDetZona); this._ckDetZona = null; return fin0.apply(this, arguments); };

  window.CK_DETALLES = {
    mojado: 0,
    zona: () => { const S = window.game && window.game.scene.scenes.find(x => x.startCampaign); const Z = S && S._ckDetZona; return Z ? { zona: Z.zona, huellas: Z.huellas.length, charcos: Z.charcos.length, chimeneas: Z.chimeneas.length, sombras: Z.sombras.size } : null; }
  };
})();
