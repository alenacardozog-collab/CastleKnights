'use strict';
/* Gradas y rejas del Coliseo Orco (10/11, pedido del dueño: "que las puertas del coliseo tengan alguna animación de abrirse así
   entran los enemigos" y "que haya público en las gradas y el orco ahí sentado").
   - El público: grupos de orcos (PixelLab, ck_coliseo_gradas_arte.js) sentados en los bancos, alentando cada uno a su ritmo.
     Los de abajo, de espaldas, miran la arena. Cuando sale un campeón, cuando cae uno o cuando pegás fuerte, se alborotan.
   - Las rejas: los barrotes de las cuatro rejas son los del dibujo del mapa, recortados; para que entre un enemigo la reja
     se levanta (cadenas, polvo, temblor), el enemigo sale de lo oscuro caminando hasta la arena y la reja baja detrás.
     Al final, la reja de abajo se levanta para salir.
   - API para ck_coliseo_historia.js: CK_COLISEO_GRADAS.entrar(S, 'izq'|'der'|'arr', tipo, listo), abrir, cerrar, alboroto.
   Borrar su línea de index.html: el coliseo sin público y los campeones aparecen como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_COLISEO_GRADAS_ARTE) return;
  const P = MainGameScene.prototype, A = window.CK_COLISEO_GRADAS_ARTE, G = A.GRADAS;
  // (13/11, pedido: "los espectadores están muy pequeños y mal puestos con la perspectiva"): los grupos se dibujan casi al tamaño
  // del dibujo (0,92: un orco sentado mide como el héroe) y van pegados uno al lado del otro a lo largo de cada banco
  const COL = 'ed_coliseo_orco.main', W = 1436, ESC = 0.92, ANCHO_GRUPO = 82;
  const GRUPOS = ['frente', 'frente2', 'espalda'];
  const PUERTA = {                    // de dónde sale (adentro de lo oscuro) y hasta dónde camina (ya en la arena)
    izq: { de: [342, 334], a: [356, 382] },
    der: { de: [1093, 328], a: [1086, 374] },
    arr: { de: [718, 268], a: [718, 322] },
    aba: { de: [718, 700], a: [718, 610] }
  };
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  // ------------------------------------------------------------------ cargar
  const pre0 = P.preloadRoster;
  P.preloadRoster = function () {
    const r = pre0 ? pre0.apply(this, arguments) : undefined;
    try {
      GRUPOS.forEach(k => { if (A[k] && !this.textures.exists('ckg_' + k)) this.load.spritesheet('ckg_' + k, A[k].img, { frameWidth: A[k].w, frameHeight: A[k].h }); });
      Object.keys(A).forEach(k => { if (/^(reja|hueco)_/.test(k) && !this.textures.exists('ckg_' + k)) this.load.image('ckg_' + k, A[k].img); });
    } catch (e) { console.warn('[gradas]', e); }
    return r;
  };
  const anim0 = P.createRosterAnimations;
  P.createRosterAnimations = function () {
    const r = anim0 ? anim0.apply(this, arguments) : undefined;
    try {
      GRUPOS.forEach(k => {
        if (this.textures.exists('ckg_' + k) && !this.anims.exists('ckg_' + k))
          this.anims.create({ key: 'ckg_' + k, frames: this.anims.generateFrameNumbers('ckg_' + k, { start: 0, end: A[k].n - 1 }), frameRate: 8, repeat: -1, yoyo: true });
      });
    } catch (e) { console.warn('[gradas]', e); }
    return r;
  };

  // (13/11, pedido: "al abrirse las rejas borrá lo negro que queda, o que aparezca la entrada negra y no la silueta de las
  // rejas"): el hueco de cada reja se rehace como una boca oscura pareja (la unión de lo que tapan el hueco y los barrotes,
  // rellena de negro con un leve degradé), así al subir la reja queda la entrada negra y no quedan dibujados los barrotes
  const huecoLleno = (S, n, R, H) => {
    const k = 'ckg_hueco_' + n + '_lleno';
    if (S.textures.exists(k)) return k;
    try {
      const T = S.textures, w = H.w, h = H.h;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d', { willReadFrequently: true });
      const pinta = (key, dx, dy) => { const fr = T.getFrame(key); const src = fr.source.image || fr.source.canvas; g.drawImage(src, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, dx, dy, fr.cutWidth, fr.cutHeight); };
      pinta('ckg_hueco_' + n, 0, 0); pinta('ckg_reja_' + n, R.x - H.x, R.y - H.y);
      const d = g.getImageData(0, 0, w, h), px = d.data;
      // la unión de lo opaco, rellena: cada columna, del primer píxel opaco al último (las rayas entre barrotes también)
      for (let x = 0; x < w; x++) {
        let y0 = -1, y1 = -1;
        for (let y = 0; y < h; y++) if (px[(y * w + x) * 4 + 3] > 30) { if (y0 < 0) y0 = y; y1 = y; }
        for (let y = 0; y < h; y++) { const i = (y * w + x) * 4; const dentro = y0 >= 0 && y >= y0 && y <= y1; const t = h > 1 ? y / (h - 1) : 0; px[i] = 9 + 6 * t; px[i + 1] = 6 + 4 * t; px[i + 2] = 12 + 6 * t; px[i + 3] = dentro ? 255 : 0; }
      }
      g.putImageData(d, 0, 0);
      T.addCanvas(k, cv);
      return k;
    } catch (e) { return 'ckg_hueco_' + n; }
  };

  // ------------------------------------------------------------------ armar el coliseo
  const armar = S => {
    const a = S.currentInterior.area, objs = a.objs || (a.objs = []);
    // las rejas: el hueco oscuro abajo y los barrotes encima (los dos sobre el suelo, debajo de todo lo demás)
    S._ckgRejas = {};
    ['izq', 'der', 'arr', 'aba'].forEach(n => {
      const R = A['reja_' + n], H = A['hueco_' + n];
      if (!R || !S.textures.exists('ckg_reja_' + n)) return;
      const kh = huecoLleno(S, n, R, H);
      const hu = S.add.image(a.x + H.x, a.y + H.y, kh).setOrigin(0, 0).setDepth(8);
      const re = S.add.image(a.x + R.x, a.y + R.y, 'ckg_reja_' + n).setOrigin(0, 0).setDepth(9);
      // los barrotes sólo se ven dentro del hueco (al subir se meten en la piedra, no asoman por encima del arco)
      try {
        if (S.renderer && S.renderer.type === Phaser.WEBGL) {
          const mk = S.make.image({ x: a.x + H.x, y: a.y + H.y, key: kh, add: false }).setOrigin(0, 0);
          re.setMask(mk.createBitmapMask()); re._ckgMk = mk;
        }
      } catch (e) {}
      objs.push(hu, re);
      S._ckgRejas[n] = { re, hu, R, y0: a.y + R.y, abierta: 0, tw: null };
    });
    // el público
    const gente = S._ckgGente = [];
    let semilla = 7; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    ['frente', 'espalda'].forEach(lado => (G[lado] || []).forEach(([x0, x1, y0, y1]) => [false, true].forEach(espejo => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / ANCHO_GRUPO));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n; let x = x0 + (x1 - x0) * t; const y = y0 + (y1 - y0) * t;
        if (espejo) x = W - x;
        if (azar() < 0.12) continue;                                  // algún lugar vacío
        const k = lado === 'espalda' ? 'espalda' : (azar() < 0.5 ? 'frente' : 'frente2');
        if (!S.textures.exists('ckg_' + k)) continue;
        const g = S.add.sprite(a.x + x + (azar() - 0.5) * 6, a.y + y, 'ckg_' + k).setOrigin(0.5, 0.92).setScale(ESC).setDepth(10 + y / 1000).setFlipX(azar() < 0.5);
        if (S.anims.exists('ckg_' + k)) { g.play({ key: 'ckg_' + k, startFrame: Math.floor(azar() * 7) }); g.anims.timeScale = 0.55 + azar() * 0.5; }
        g._ckgRitmo = g.anims.timeScale; g._ckgY = g.y;
        objs.push(g); gente.push(g);
      }
    })));
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try { if (zona(this) === COL) armar(this); else { this._ckgRejas = null; this._ckgGente = null; } } catch (e) { console.warn('[gradas]', e); }
    return r;
  };

  // ------------------------------------------------------------------ el público se alborota
  const alboroto = (S, fuerza = 1, ms = 2400) => {
    (S._ckgGente || []).forEach((g, i) => {
      if (!g.active) return;
      g.anims.timeScale = g._ckgRitmo * (1.6 + fuerza * 0.6);
      S.tweens.killTweensOf(g); g.y = g._ckgY;
      S.tweens.add({ targets: g, y: g._ckgY - 2 - fuerza * 2, duration: 140 + (i % 5) * 20, yoyo: true, repeat: Math.round(2 + fuerza * 3), delay: (i % 7) * 40, ease: 'Sine.easeOut' });
    });
    clearTimeout(S._ckgCalma);
    S._ckgCalma = setTimeout(() => (S._ckgGente || []).forEach(g => { if (g.active) g.anims.timeScale = g._ckgRitmo; }), ms);
  };

  // ------------------------------------------------------------------ rejas
  const mover = (S, n, hasta, ms, fin) => {
    const q = S._ckgRejas && S._ckgRejas[n]; if (!q || !q.re.active) { fin && fin(); return; }
    if (q.tw) q.tw.stop();
    const H = q.R.h, poner = d => { q.abierta = d; const v = Math.min(H - 1, Math.round(d)); q.re.setCrop(0, v, q.R.w, H - v); q.re.y = q.y0 - v; };
    const o = { d: q.abierta };
    q.tw = S.tweens.add({ targets: o, d: hasta * H, duration: ms, ease: hasta ? 'Sine.easeInOut' : 'Quad.easeIn', onUpdate: () => poner(o.d), onComplete: () => { q.tw = null; fin && fin(); } });
  };
  const polvo = (S, n) => {
    const q = S._ckgRejas && S._ckgRejas[n]; if (!q) return;
    const x = q.re.x + q.R.w / 2, y = q.y0 + q.R.h - 4;
    // polvito chico al golpear el suelo (no la nube grande de los golpes)
    for (let i = 0; i < 7; i++) {
      const p = S.add.rectangle(x + (Math.random() - 0.5) * q.R.w * 0.8, y + Math.random() * 3, 2, 2, 0xb8a888, 0.9).setDepth(y + 1);
      S.tweens.add({ targets: p, x: p.x + (Math.random() - 0.5) * 14, y: p.y - 3 - Math.random() * 5, alpha: 0, duration: 420 + Math.random() * 260, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  };
  const abrir = (S, n, fin) => {
    son('bridge_move', 0.8, { rate: 0.85 });
    S.cameras.main.shake(260, 0.002);
    mover(S, n, 1, 1100, fin);
  };
  const cerrar = (S, n, fin) => {
    son('bridge_move', 0.6, { rate: 1.1 });
    mover(S, n, 0, 420, () => { son('door_gate', 0.8, { rate: 0.8 }); S.cameras.main.shake(180, 0.004); polvo(S, n); fin && fin(); });
  };

  /** Sube la reja n, el enemigo sale de lo oscuro caminando hasta la arena, la reja baja y empieza a pelear. */
  const entrar = (S, n, tipo, listo) => {
    const a = S.currentInterior && S.currentInterior.area, pu = PUERTA[n];
    if (!a || !pu) return null;
    const e = S.spawnEnemy(a.x + pu.a[0], a.y + pu.a[1], tipo);
    if (!e) return null;
    e.zone = zona(S);
    const st = e.state; e.state = 'ck_entrando';
    if (e.body) { e.body.enable = false; e.setVelocity && e.setVelocity(0, 0); }
    S.tweens.killTweensOf(e);                                      // otros módulos lo hacen aparecer con un fundido: acá no
    e.setPosition(a.x + pu.de[0], a.y + pu.de[1]).setAlpha(0).setTint(0x2a2a33).setVisible(false);
    const ocultar = S.time.addEvent({ delay: 50, loop: true, callback: () => e.active && e.state === 'ck_entrando' && !e._ckgSale && e.setAlpha(0) });
    S.time.delayedCall(250, () => alboroto(S, 1.4, 3200));
    abrir(S, n, () => {
      if (!e.active) { ocultar.remove(); return; }
      e._ckgSale = true; ocultar.remove(); e.setVisible(true);
      const walk = e.type + '_walk_front', walk2 = e.type + '_walk';
      e.play(S.anims.exists(walk) ? walk : walk2, true);
      const t = { k: 0 };
      S.tweens.add({ targets: e, x: a.x + pu.a[0], y: a.y + pu.a[1], duration: 1500, ease: 'Sine.easeOut' });
      S.tweens.add({ targets: t, k: 1, duration: 900, onUpdate: () => {
        if (!e.active) return;
        e.setAlpha(Math.min(1, t.k * 1.6));
        const c = Math.round(0x2a + (0xff - 0x2a) * t.k); e.setTint(Phaser.Display.Color.GetColor(c, c, Math.min(255, c + 9)));
      }, onComplete: () => e.active && e.clearTint() });
      S.time.delayedCall(1550, () => {
        if (!e.active) return;
        e.clearTint().setAlpha(1).setDepth(e.y);
        if (e.body) { e.body.enable = true; e.body.reset(e.x, e.y); }
        e.state = st === 'ck_entrando' ? 'idle' : st;
        cerrar(S, n);
        listo && listo(e);
      });
    });
    return e;
  };

  // el público reacciona a la pelea en el coliseo
  const ven0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = ven0 ? ven0.apply(this, arguments) : undefined;
    try { if (zona(this) === COL && this._ckgGente) alboroto(this, enemy && ENEMY_TYPES[enemy.type] && ENEMY_TYPES[enemy.type].boss ? 2 : 1, 4000); } catch (e) {}
    return r;
  };
  const dano0 = P.damagePlayer;
  P.damagePlayer = function () {
    const r = dano0.apply(this, arguments);
    try { if (this._ckgGente && zona(this) === COL && Math.random() < 0.5) alboroto(this, 0.6, 1500); } catch (e) {}
    return r;
  };

  window.CK_COLISEO_GRADAS = { entrar, abrir, cerrar, alboroto, PUERTA };
})();
