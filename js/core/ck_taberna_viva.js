'use strict';
/* Taberna viva (24/10, pedido del dueño):
   - El tabernero ahora se ve: está detrás de la barra (camisa blanca y delantal verde), se mueve por adentro, mira al héroe
     cuando se acerca y atiende a los que piden. Hablarle con T sigue siendo lo de la historia.
   - Parroquianos: además de los aldeanos que vienen de la aldea (ck_vida.js), siempre hay gente: 3 de día, 5 de noche.
     Entran por la puerta, piden en la barra (el tabernero se acerca y les sirve una jarra), van a una mesa o junto al fuego,
     toman, charlan entre ellos y brindan; al rato se van y entra otro.
   - Lo que dicen va en globitos chicos con dibujos (jarra, charla, risa, música), no en letras grandes.
   Borrar la línea de index.html lo saca (el tabernero vuelve a ser solo un punto para hablar). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZONA = 'ed_taberna_2.main';
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const PUERTA = [240, 252];
  // dónde se paran (pies) y para dónde miran (-1 izquierda, 1 derecha, 0 arriba/abajo: se queda como venía)
  const BARRA = [[227, 141, -1], [227, 163, -1], [227, 183, -1], [154, 219, 0], [190, 219, 0]];
  const MESAS = [[198, 122, 0], [226, 122, 0], [256, 122, 0], [284, 122, 0], [290, 210, 0], [320, 210, 0], [292, 152, 0], [322, 152, 0], [230, 150, 1], [272, 150, -1]];
  // dónde atiende el tabernero según el banquito
  const ATIENDE = [[188, 146], [188, 166], [188, 180], [158, 184], [186, 184]];
  const CASA_TAB = [[176, 156], [186, 170], [166, 176]];
  const PROF_BARRA = 201.5;
  const PIEL = ['npc5_villager', 'npc11_villager', 'ck_par_azul', 'ck_par_rojo', 'ck_par_gris', 'ck_par_verde'];

  // ------------------------------------------------------------------ texturas por código
  const recolor = (S, de, a, fn) => {
    if (S.textures.exists(a) || !S.textures.exists(de)) return;
    const img = S.textures.get(de).getSourceImage();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) if (px[i + 3]) { const o = fn(px[i], px[i + 1], px[i + 2]); if (o) { px[i] = o[0]; px[i + 1] = o[1]; px[i + 2] = o[2]; } }
    g.putImageData(d, 0, 0);
    S.textures.addSpriteSheet(a, c, { frameWidth: 32, frameHeight: 32 });
  };
  // marrones del chaleco / ropa (176,112,64) (200,136,80) (112,80,48) → otro color
  const marron = (r, g, b) => r > g + 25 && g > b + 10 && r < 215 && !(r > 235 && g > 180);
  const tono = col => (r, g, b) => { if (!marron(r, g, b)) return null; const l = (r + g + b) / 3 / 150; return col.map(v => Math.min(255, Math.round(v * l))); };
  const texturas = S => {
    recolor(S, 'npc1_villager', 'ck_tabernero', tono([70, 120, 78]));
    recolor(S, 'npc13_villager', 'ck_par_azul', tono([70, 96, 160]));
    recolor(S, 'npc14_villager', 'ck_par_rojo', tono([170, 64, 60]));
    recolor(S, 'npc1_villager', 'ck_par_gris', tono([120, 118, 112]));
    recolor(S, 'npc4_villager', 'ck_par_verde', tono([96, 130, 60]));
    ['ck_tabernero', 'ck_par_azul', 'ck_par_rojo', 'ck_par_gris', 'ck_par_verde'].forEach(k => {
      if (!S.textures.exists(k)) return;
      if (!S.anims.exists(k + '_idle')) S.anims.create({ key: k + '_idle', frames: S.anims.generateFrameNumbers(k, { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
      if (!S.anims.exists(k + '_walk')) S.anims.create({ key: k + '_walk', frames: S.anims.generateFrameNumbers(k, { start: 6, end: 11 }), frameRate: 9, repeat: -1 });
    });
    const mk = (k, w, h, fn) => { if (S.textures.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); S.textures.addCanvas(k, c); };
    const globo = (k, dibujo) => mk(k, 13, 12, g => {
      g.fillStyle = '#2b1d14'; g.fillRect(1, 0, 11, 1); g.fillRect(0, 1, 13, 7); g.fillRect(1, 8, 11, 1); g.fillRect(4, 9, 3, 1); g.fillRect(4, 10, 2, 1); g.fillRect(4, 11, 1, 1);
      g.fillStyle = '#f6ecd6'; g.fillRect(1, 1, 11, 7); g.fillRect(5, 9, 1, 1);
      dibujo(g);
    });
    const p = (g, c, pts) => { g.fillStyle = c; pts.forEach(([x, y, w = 1, h = 1]) => g.fillRect(x, y, w, h)); };
    globo('ck_g_jarra', g => { p(g, '#8a5a2b', [[4, 3, 4, 4], [8, 4, 1, 2]]); p(g, '#f2b33d', [[5, 4, 2, 2]]); p(g, '#ffffff', [[4, 2, 4, 1]]); });
    globo('ck_g_charla', g => p(g, '#5a4636', [[3, 4], [6, 4], [9, 4]]));
    globo('ck_g_risa', g => { p(g, '#5a4636', [[3, 3], [4, 2], [5, 3], [7, 3], [8, 2], [9, 3]]); p(g, '#c0503c', [[4, 5, 5, 1], [5, 6, 3, 1]]); });
    globo('ck_g_nota', g => p(g, '#5a4636', [[7, 2, 1, 4], [8, 2, 2, 1], [5, 5, 2, 2]]));
    globo('ck_g_brindis', g => { p(g, '#8a5a2b', [[2, 3, 3, 4], [8, 3, 3, 4]]); p(g, '#f2b33d', [[3, 4, 1, 2], [9, 4, 1, 2]]); p(g, '#ffffff', [[5, 2], [7, 2], [6, 1]]); });
    mk('ck_jarrita', 4, 5, g => { p(g, '#3a2414', [[0, 0, 3, 5]]); p(g, '#8a5a2b', [[0, 1, 3, 4]]); p(g, '#f2b33d', [[1, 2, 1, 2]]); p(g, '#ffffff', [[0, 0, 3, 1]]); p(g, '#3a2414', [[3, 2, 1, 2]]); });
  };

  // ------------------------------------------------------------------ helpers
  const tab = S => S._ckTab;
  const globo = (S, sp, k, ms = 1600) => {
    if (!sp || !sp.active || !S.textures.exists(k)) return;
    if (sp._ckGlobo && sp._ckGlobo.active) sp._ckGlobo.destroy();
    const g = S.add.image(sp.x + 3, sp.y - sp.displayHeight * 0.62, k).setOrigin(0.5, 1).setDepth(sp.depth + 1000).setAlpha(0);
    sp._ckGlobo = g;
    S.tweens.add({ targets: g, alpha: 1, y: g.y - 2, duration: 160 });
    S.time.delayedCall(ms, () => { if (g.active) S.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() }); });
  };
  const animar = (sp, que) => { const k = sp.texture.key.replace('_villager', '') + '_' + que; const kk = sp.scene.anims.exists(k) ? k : sp.texture.key + '_' + que; if (sp.scene.anims.exists(kk)) sp.play(kk, true); };
  const grillaDe = (S, area) => {
    if (area._ckGrillaViva) return area._ckGrillaViva;
    const V = window.CK_VIDA;
    if (!V || !V.grilla) return null;
    return (area._ckGrillaViva = V.grilla(area.w, area.h, (area.solids || []).map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })), 4));
  };
  const ocupado = (T, spot) => T.gente.some(p => p.spot === spot);

  // ------------------------------------------------------------------ armar / desarmar
  const armar = S => {
    const area = S.currentInterior && S.currentInterior.area;
    if (!area) return;
    texturas(S);
    const T = (S._ckTab = { area, gente: [], prox: S.time.now + R(3000, 7000), barman: null, cola: [] });
    // el tabernero
    const [bx, by] = CASA_TAB[0];
    // la barra es una sola pieza que ordena por su borde de abajo (y 200): el tabernero va justo encima, si no queda tapado
    const b = S.add.sprite(area.x + bx, area.y + by, 'ck_tabernero').setOrigin(0.5, 1).setScale(1.3).setDepth(area.y + PROF_BARRA);
    animar(b, 'idle');
    T.barman = { sp: b, x: bx, y: by, ruta: null, espera: R(3000, 6000), sirve: null };
    // gente que ya estaba
    const n = (S.isNight && S.isNight()) ? 4 : 2;
    for (let i = 0; i < n; i++) entraUno(S, false);
  };
  const desarmar = S => {
    const T = tab(S);
    if (!T) return;
    [T.barman && T.barman.sp].concat(T.gente.map(p => p.sp)).forEach(sp => { if (sp) { if (sp._ckGlobo) sp._ckGlobo.destroy(); if (sp._ckJarra) sp._ckJarra.destroy(); sp.destroy(); } });
    S._ckTab = null;
  };

  const libres = (T, lista) => lista.filter(s => !ocupado(T, s));
  const entraUno = (S, porLaPuerta) => {
    const T = tab(S), area = T.area;
    const usados = T.gente.map(p => p.sp.texture.key);
    const piel = UNO(PIEL.filter(k => S.textures.exists(k) && !usados.includes(k)).concat(['ck_par_gris']));
    const mesa = UNO(libres(T, MESAS));
    if (!mesa) return;
    const desde = porLaPuerta ? PUERTA : mesa;
    const sp = S.add.sprite(area.x + desde[0], area.y + desde[1], piel).setOrigin(0.5, 1).setScale(1.3).setDepth(area.y + desde[1]);
    const p = { sp, x: desde[0], y: desde[1], ruta: null, i: 0, estado: 'quieto', espera: R(800, 3000), spot: porLaPuerta ? null : mesa,
      jarra: !porLaPuerta, hasta: S.time.now + R(50000, 110000), vel: R(22, 30) };
    T.gente.push(p);
    if (!porLaPuerta) { mirar(p, mesa); jarra(S, p, true); animar(sp, 'idle'); }
    else { const b = UNO(libres(T, BARRA)) || BARRA[0]; ir(S, p, b, 'pedir'); }
  };
  const mirar = (p, spot) => { if (spot && spot[2]) p.sp.setFlipX(spot[2] < 0); };
  const jarra = (S, p, si) => {
    p.jarra = si;
    if (si && !p.sp._ckJarra && S.textures.exists('ck_jarrita')) p.sp._ckJarra = S.add.image(p.sp.x, p.sp.y, 'ck_jarrita').setOrigin(0.5, 1);
    if (!si && p.sp._ckJarra) { p.sp._ckJarra.destroy(); p.sp._ckJarra = null; }
  };
  const ir = (S, p, spot, para) => {
    const G = grillaDe(S, tab(S).area), V = window.CK_VIDA;
    const ruta = G && V.camino(G, p.x, p.y, spot[0], spot[1]);
    p.spot = spot; p.para = para; p.estado = 'camina';
    p.ruta = ruta && ruta.length ? ruta : [[spot[0], spot[1]]]; p.i = 0;
    animar(p.sp, 'walk');
  };

  // ------------------------------------------------------------------ cada cuadro
  const paso = (S, dt) => {
    const T = tab(S), area = T.area, now = S.time.now;
    const pl = S.player && S.player.body;
    // ¿entra alguien?
    const meta = (S.isNight && S.isNight()) ? 5 : 3;
    const deLaAldea = (S.campaignNPCs || []).filter(n => n._ckDentro && n._ckDentro.sp && n._ckDentro.sp.active).length;
    if (now > T.prox) {
      T.prox = now + R(9000, 20000);
      if (T.gente.length + deLaAldea < meta) entraUno(S, true);
    }
    // el tabernero
    const B = T.barman;
    if (B && B.sp.active) {
      if (B.ruta) {
        const [tx, ty] = B.ruta, dx = tx - B.x, dy = ty - B.y, d = Math.hypot(dx, dy), st = 34 * dt / 1000;
        if (d <= st) { B.x = tx; B.y = ty; B.ruta = null; animar(B.sp, 'idle'); if (B.sirve) { B.espera = 1400; globo(S, B.sp, 'ck_g_jarra', 1300); } }
        else { B.x += dx / d * st; B.y += dy / d * st; if (Math.abs(dx) > 0.3) B.sp.setFlipX(dx < 0); }
        B.sp.setPosition(area.x + B.x, area.y + B.y);
      } else if (B.sirve) {
        B.espera -= dt;
        B.sp.setFlipX(B.sirve.x < B.x);
        if (B.espera <= 0) {
          const c = B.sirve; B.sirve = null; B.espera = R(2500, 5000);
          if (c.sp.active) { jarra(S, c, true); globo(S, c.sp, UNO(['ck_g_risa', 'ck_g_jarra']), 1200); c.estado = 'servido'; c.espera = 700; }
        }
      } else {
        const espera = T.gente.find(p => p.estado === 'espera');
        if (espera) {
          const k = BARRA.indexOf(espera.spot);
          B.sirve = espera; espera.estado = 'atendido';
          B.ruta = ATIENDE[Math.max(0, k)]; animar(B.sp, 'walk');
        } else if (pl && Phaser.Math.Distance.Between(pl.center.x, pl.center.y, B.sp.x, B.sp.y) < 70) {
          B.sp.setFlipX(pl.center.x < B.sp.x);
        } else if ((B.espera -= dt) <= 0) {
          B.espera = R(4000, 9000);
          B.ruta = UNO(CASA_TAB); animar(B.sp, 'walk');
          if (Math.random() < 0.25) globo(S, B.sp, 'ck_g_nota', 1500);
        }
      }
    }
    // los parroquianos
    T.gente.slice().forEach(p => {
      const sp = p.sp;
      if (!sp.active) return;
      if (p.estado === 'camina') {
        const pt = p.ruta[p.i];
        if (!pt) {
          animar(sp, 'idle'); mirar(p, p.spot);
          if (p.para === 'pedir') { p.estado = 'espera'; globo(S, sp, 'ck_g_jarra', 1500); }
          else if (p.para === 'salir') { if (sp._ckGlobo) sp._ckGlobo.destroy(); jarra(S, p, false); sp.destroy(); T.gente.splice(T.gente.indexOf(p), 1); return; }
          else { p.estado = 'quieto'; p.espera = R(2000, 5000); }
        } else {
          const dx = pt[0] - p.x, dy = pt[1] - p.y, d = Math.hypot(dx, dy), st = p.vel * dt / 1000;
          if (d <= st) { p.x = pt[0]; p.y = pt[1]; p.i++; } else { p.x += dx / d * st; p.y += dy / d * st; if (Math.abs(dx) > 0.3) sp.setFlipX(dx < 0); }
        }
      } else if (p.estado === 'servido') {
        p.espera -= dt;
        if (p.espera <= 0) { const m = UNO(libres(T, MESAS)) || MESAS[0]; ir(S, p, m, 'mesa'); }
      } else if (p.estado === 'quieto') {
        // el héroe cerca: lo mira
        if (pl && Phaser.Math.Distance.Between(pl.center.x, pl.center.y, sp.x, sp.y) < 30) sp.setFlipX(pl.center.x < sp.x);
        p.espera -= dt;
        if (p.espera <= 0) {
          p.espera = R(3500, 8000);
          if (now > p.hasta) { ir(S, p, PUERTA, 'salir'); return; }
          // con quién charlar
          const otro = T.gente.find(o => o !== p && o.estado === 'quieto' && Math.hypot(o.x - p.x, o.y - p.y) < 46);
          const r = Math.random();
          if (otro && r < 0.55) {
            sp.setFlipX(otro.x < p.x); otro.sp.setFlipX(p.x < otro.x);
            if (p.jarra && otro.jarra && Math.random() < 0.35) {
              globo(S, sp, 'ck_g_brindis', 1400); globo(S, otro.sp, 'ck_g_brindis', 1400);
              S.tweens.add({ targets: [sp, otro.sp], y: '-=3', duration: 120, yoyo: true });
              try { if (typeof sfx !== 'undefined') sfx.fx('ck_jarras', 0.5, { minGap: 800 }); } catch (e) {}
            } else {
              globo(S, sp, 'ck_g_charla', 1500);
              S.time.delayedCall(1300, () => { if (otro.sp.active) globo(S, otro.sp, UNO(['ck_g_risa', 'ck_g_charla', 'ck_g_risa']), 1400); });
            }
            otro.espera = Math.max(otro.espera, 3000);
          } else if (p.jarra && r < 0.75) {
            globo(S, sp, 'ck_g_jarra', 1100);                  // un trago
            S.tweens.add({ targets: sp, y: '-=1', duration: 160, yoyo: true });
          } else if (!p.jarra || r < 0.85) {
            const b = UNO(libres(T, BARRA)); if (b) ir(S, p, b, 'pedir');
          } else {
            const m = UNO(libres(T, MESAS)); if (m) ir(S, p, m, 'mesa');
          }
        }
      }
      sp.setPosition(area.x + p.x, area.y + p.y).setDepth(area.y + p.y);
      if (sp._ckJarra) sp._ckJarra.setPosition(sp.x + (sp.flipX ? -6 : 6), sp.y - 9).setDepth(sp.depth + 0.5);
      if (sp._ckGlobo && sp._ckGlobo.active) sp._ckGlobo.x = sp.x + 3;
    });
    // los aldeanos que vinieron de la aldea también charlan
    (S.campaignNPCs || []).forEach(n => {
      const d = n._ckDentro;
      if (!d || !d.sp || !d.sp.active || d.ruta) return;
      if (!d._ckGloboAt || now > d._ckGloboAt) { d._ckGloboAt = now + R(6000, 14000); if (Math.random() < 0.7) globo(S, d.sp, UNO(['ck_g_charla', 'ck_g_risa', 'ck_g_jarra', 'ck_g_nota']), 1500); }
    });
  };

  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      desarmar(this);
      if (area && area.key === ZONA && this._gameMode === 'campaign') armar(this);
    } catch (e) { console.warn('[taberna viva]', e); }
    return r;
  };
  const aldea0 = P.onVillageShown;
  P.onVillageShown = function () { try { desarmar(this); } catch (e) {} return aldea0 ? aldea0.apply(this, arguments) : undefined; };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const T = this._ckTab;
      if (T) {
        if (!this.currentInterior || this.currentInterior.area !== T.area) desarmar(this);
        else if (!this.dialogOpen && !this._overlay) paso(this, Math.min(delta || 16, 50));
      }
    } catch (e) { if (!this._ckTabErr) { this._ckTabErr = true; console.warn('[taberna viva]', e); } }
    return r;
  };
  window.CK_TABERNA_VIVA = { BARRA, MESAS, armar, desarmar };
})();
