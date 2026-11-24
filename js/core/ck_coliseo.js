'use strict';
/* Coliseo Orco: los tres campeones y el Rey Orco en la tribuna (10/11, pedido del dueño: "vamos a pelear contra 3 enemigos
   únicos: primero un orco élite, luego una bestia tipo gorila monstruo y el último un cazador orco montado en un huargo, cada
   uno con sus habilidades y patrones de pelea; el rey orco sentado en la tribuna junto a una de las hijas raptadas del rey;
   ataques donde tengamos que esquivar o cubrirnos"). Arte de PixelLab en ck_coliseo_arte.js.

   CÓMO SE LEEN LOS ATAQUES (igual para los tres):
   - ROJO en el piso = no se puede parar: hay que salir de ahí o pasar con el paso rápido (ESPACIO, que es invulnerable).
   - AMARILLO = se puede parar con la parada (C) justo cuando llega, o esquivar.
   - Antes de cada ataque especial el jefe brilla y aparece "!" sobre su cabeza.

   1) GORVAK, CAMPEÓN DE LA ARENA (orco élite, 40 de vida, golpe de 2):
      - Tajo: el golpe común (amarillo, se para).
      - SALTO APLASTANTE (rojo): marca un círculo donde estás, salta y cae ahí 0,9 s después.
      - MURO DE ESCUDO: levanta el escudo 2,2 s; de frente no le entra nada ("¡BLOQUEA!"), por la espalda recibe el doble.
      - Desde la mitad de la vida: CUCHILLA GIRATORIA (amarillo): tira la cuchilla, que va y vuelve.
   2) KRAGMOR, LA BESTIA (gorila monstruo, 55 de vida, golpe de 2):
      - Puñetazo (amarillo).
      - EMBESTIDA (rojo): marca una franja hacia vos y carga en línea recta. Si la esquivás y se da contra la pared queda
        ATONTADO 2 s y recibe 50 % más de daño.
      - GOLPE SÍSMICO (rojo): golpea el piso y salen tres ondas; cada una lastima al pasar: se saltan con el paso rápido o
        alejándose.
      - Desde la mitad: LLUVIA DE PIEDRAS (rojo): 4 círculos alrededor tuyo, caen piedras 1,1 s después.
   3) ULRAK EL CAZADOR Y COLMILLO (jinete sobre huargo, 48 de vida, golpe de 2, rápido):
      - Lanzazo (amarillo).
      - ANDANADA (amarillo): se aleja, apunta (tres líneas) y tira tres flechas en abanico: se paran con C o se esquivan.
      - CARGA DEL HUARGO (rojo): cruza la arena de punta a punta dos veces.
      - Desde la mitad: AULLIDO: llama a dos huargos (una vez cada 15 s, como mucho 2 vivos).
   - EL REY ORCO es GRUSHAK (el mismo diseño del jefe orco que ya estaba), sentado en su trono de huesos en la tribuna con la princesa encadenada (CK_COLISEO.tribuna): mira, se ríe cuando te pegan y grita
     al caer cada campeón. (La pelea con él queda para cuando esté el mapa del coliseo.)
   Probar: CK_COLISEO.probar(escena, 'campeon' | 'bestia' | 'cazador') pone al jefe al lado del héroe en cualquier mapa.
   (21/11, notas del dueño en el editor de habilidades, ver PEDIDOS_HABILIDADES.md):
   - Gorvak: el SALTO tiene 1 s más de anticipación y al caer parte el piso con polvo (pixelfx); el MURO DE ESCUDO se pone
     en guardia 1,2 s y arremete con el escudo; la CUCHILLA es una cuchilla de verdad (hoja curva, filo y mango).
   - Kragmor: la EMBESTIDA deja pisadas que quiebran el piso y polvo; el GOLPE SÍSMICO larga ondas de piedras y polvo (no el
     anillo rojo) y el piso se parte (pixelfx); la LLUVIA DE PIEDRAS: se carga, golpea el piso, salen rocas y las arroja.
   - (v10) Kragmor: la LLUVIA DE PIEDRAS con su animación de PixelLab (ck_jefes_anims_arte.js): golpea el piso, sale una roca,
     la agarra, la sube al pecho y la arroja donde estás; al caer se parte y tres pedazos caen alrededor.
   - Ulrak: la ANDANADA son lanzas; la CARGA DEL HUARGO deja un eco de velocidad; el AULLIDO ya no llama huargos: se pone
     más rápido y más duro unos segundos (contorno, la mitad del daño).
   Borrar sus dos líneas de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_COLISEO_ARTE) return;
  const P = MainGameScene.prototype, ARTE = window.CK_COLISEO_ARTE;
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const ROJO = 0xff3030, AMARILLO = 0xffd23a;
  const FX = () => window.CK_JEFES_FX;   // partículas y proyectiles a píxel (ck_jefes_fx.js); sin él, como antes

  // ------------------------------------------------------------------ los tres jefes
  const JEFES = {
    orc_campeon: { hoja: 'elite', nombre: 'Gorvak, Campeón de la Arena', hp: 40, speed: 78, dmg: 2, reach: 66, cd: 1500, hitAt: 360, xp: 260, coins: 90, escala: 0.7,
      cuerpo: [28, 12, 31, 72], cada: [3800, 5600], fx: ['orc_attack', 'orc_hurt', 'orc_death', 0.75] },
    bestia_kragmor: { hoja: 'gorila', nombre: 'Kragmor, la Bestia', hp: 55, speed: 72, dmg: 2, reach: 76, cd: 1700, hitAt: 420, xp: 300, coins: 110, escala: 0.54,
      cuerpo: [46, 14, 32, 106], cada: [3600, 5200], fx: ['werebear_attack', 'werebear_hurt', 'werebear_death', 0.6] },
    cazador_ulrak: { hoja: 'jinete', nombre: 'Ulrak el Cazador y Colmillo', hp: 48, speed: 118, dmg: 2, reach: 72, cd: 1400, hitAt: 380, xp: 340, coins: 130, escala: 0.6,
      cuerpo: [50, 12, 30, 101], cada: [3200, 4800], fx: ['warg_attack', 'warg_hurt', 'warg_death', 0.9] }
  };
  const ATAJO = { campeon: 'orc_campeon', bestia: 'bestia_kragmor', cazador: 'cazador_ulrak' };

  // las hojas se cargan con el resto del elenco; los tipos se suman después (así roster.js no busca archivos que no hay)
  const pr0 = P.preloadRoster;
  P.preloadRoster = function () {
    const r = pr0.apply(this, arguments);
    try {
      Object.keys(ARTE).forEach(k => {
        const a = ARTE[k];
        if (k === 'princesa') { this.load.image('ckc_princesa', a.img); return; }
        this.load.spritesheet('ckc_' + k, a.img, { frameWidth: a.t, frameHeight: a.t });
      });
      // tamaños parejos (pedido del dueño): el héroe mide 25 px; los jefes, de 2 a 2,5 veces (Grushak medía 77: ahora 62)
      if (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.orc_warlord) ENEMY_TYPES.orc_warlord.scale = 0.97;
      if (typeof ENEMY_TYPES !== 'undefined') Object.keys(JEFES).forEach(id => {
        const J = JEFES[id];
        if (ENEMY_TYPES[id]) return;
        ENEMY_TYPES[id] = { name: J.nombre, frames: {}, hp: J.hp, speed: J.speed, dmg: J.dmg, reach: J.reach, cd: J.cd, hitAt: J.hitAt, xp: J.xp, coins: J.coins,
          scale: J.escala, boss: true, meleeToo: true, sfx: J.fx, ckColiseo: true };
      });
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };
  // animaciones: <tipo>_<anim> con la textura de su hoja (idle, walk, attack1, hurt, death y las propias)
  const cra0 = P.createRosterAnimations;
  P.createRosterAnimations = function () {
    const r = cra0.apply(this, arguments);
    try {
      const RATE = { windup: [12, 0], attack2: [15, 0], idle: [6, -1], walk: [10, -1], walk_front: [10, -1], walk_back: [10, -1], attack1: [16, 0], death: [9, 0], salto: [12, 0], block: [10, 0], slam: [12, 0], charge: [14, -1], arco: [14, 0], aullido: [10, 0] };
      Object.keys(JEFES).forEach(id => {
        const h = JEFES[id].hoja;
        Object.keys(ARTE).filter(k => k.indexOf(h + '_') === 0).forEach(k => {
          const an = k.slice(h.length + 1), key = id + '_' + an, tex = 'ckc_' + k;
          if (this.anims.exists(key) || !this.textures.exists(tex)) return;
          const n = this.textures.get(tex).frameTotal - 1, [fr, rep] = RATE[an] || [12, 0];
          this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: n - 1 }), frameRate: fr, repeat: rep });
        });
        // herido: dos cuadros del quieto (el golpe lo marca el tinte)
        if (!this.anims.exists(id + '_hurt') && this.textures.exists('ckc_' + h + '_idle'))
          this.anims.create({ key: id + '_hurt', frames: this.anims.generateFrameNumbers('ckc_' + h + '_idle', { start: 0, end: 1 }), frameRate: 10, repeat: 0 });
        // spawnEnemy arranca con la textura <tipo>_idle
        if (!this.textures.exists(id + '_idle') && this.textures.exists('ckc_' + h + '_idle')) {
          const src = this.textures.get('ckc_' + h + '_idle').getSourceImage(), t = ARTE[h + '_idle'].t;
          this.textures.addSpriteSheet(id + '_idle', src, { frameWidth: t, frameHeight: t });
        }
      });
      if (this.textures.exists('ckc_rey_idle') && !this.anims.exists('ckc_rey_idle'))
        this.anims.create({ key: 'ckc_rey_idle', frames: this.anims.generateFrameNumbers('ckc_rey_idle', { start: 0, end: ARTE.rey_idle.n - 1 }), frameRate: 4, repeat: -1 });
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };

  // ------------------------------------------------------------------ al aparecer
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, tipo) {
    const e = se0.apply(this, arguments);
    try {
      const J = e && JEFES[e.type];
      if (J) {
        const [w, h, ox, oy] = J.cuerpo;
        e.body.setSize(w, h); e.body.setOffset(ox, oy);
        e.phase2 = true;                         // sin la segunda fase genérica (llamaba orcos sueltos): la nuestra va abajo
        e._ckc = { prox: this.time.now + R(2500, 3500), mitad: false, ultimo: '' };
        e.play(e.type + '_idle');
      }
    } catch (er) { console.warn('[coliseo]', er); }
    return e;
  };

  // ------------------------------------------------------------------ dibujos en el piso
  const marca = (S, x, y, r, col, ms) => {
    if (FX() && FX().zona) { FX().zona(S, x, y, r, col, ms); return; }   // (11/11) aviso a píxel, con aro que gira y relleno que crece
    const g = S.add.ellipse(x, y, r * 2, r * 1.24, col, 0.18).setStrokeStyle(2, col, 0.95).setDepth(9);
    const n = S.add.ellipse(x, y, 4, 3, col, 0.35).setDepth(9);
    S.tweens.add({ targets: n, width: r * 2, height: r * 1.24, duration: ms, ease: 'Linear' });
    S.tweens.add({ targets: g, alpha: { from: 0.5, to: 1 }, duration: 160, yoyo: true, repeat: Math.max(0, Math.floor(ms / 320)) });
    S.time.delayedCall(ms, () => { g.destroy(); n.destroy(); });
  };
  const franja = (S, x0, y0, x1, y1, ancho, col, ms) => {
    if (FX() && FX().franjaViva) { FX().franjaViva(S, x0, y0, x1, y1, ancho, col, ms); return; }
    const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    const g = S.add.rectangle((x0 + x1) / 2, (y0 + y1) / 2, L, ancho, col, 0.2).setStrokeStyle(2, col, 0.9).setRotation(a).setDepth(9);
    S.tweens.add({ targets: g, alpha: { from: 0.45, to: 1 }, duration: 150, yoyo: true, repeat: Math.max(0, Math.floor(ms / 300)) });
    S.time.delayedCall(ms, () => g.destroy());
  };
  const aviso = (S, e, col) => {
    e.setTint(col === ROJO ? 0xff8080 : 0xffe08a);
    if (FX()) FX().carga(S, e, col, 500);
    // (11/11) anticipación: la animación de carga del jefe (PixelLab) si la tiene, y si no, se agacha y se tensa
    const wu = e.type + '_windup';
    if (S.anims.exists(wu)) { e.play({ key: wu, repeat: -1 }, true); e._ckWindup = S.time.now + 420; }
    else if (FX() && FX().anticipar) FX().anticipar(S, e, 420);
    const t = S.add.text(e.x, e.y - 62, '!', { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: col === ROJO ? '#ff4040' : '#ffd23a', stroke: '#1b0f0a', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(26002);
    S.tweens.add({ targets: t, y: t.y - 8, duration: 220, yoyo: true, repeat: 2, onComplete: () => t.destroy() });
    (col === ROJO && son('ck_aviso_carga', 0.6)) || son('alert', 0.6) || (typeof sfx !== 'undefined' && sfx.playAlert && sfx.playAlert());
  };
  /** Pies del héroe. */
  const pies = S => { const b = S.player.body; return { x: b.center.x, y: b.bottom - 3 }; };
  /** Daño que no se para (rojo): la parada no cuenta; el paso rápido sí (invulnerable). */
  const golpeRojo = (S, n) => { const pu = S.parryUntil; S.parryUntil = 0; S.damagePlayer(n); S.parryUntil = pu; };
  const empujar = (S, desdeX, desdeY, f) => {
    const p = S.player, a = Math.atan2(p.y - desdeY, p.x - desdeX);
    if (p.body && !S.isDead) { p.body.setVelocity(Math.cos(a) * f, Math.sin(a) * f); S.time.delayedCall(160, () => p.body && p.body.setVelocity(0, 0)); }
  };
  const polvo = (S, x, y, r) => { if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', x, y, r, 420); S.cameras.main.shake(220, 0.01); };
  // (21/11) efectos de pixelfx y del código de los héroes (ck_heroes_pedidos.js): canalizar, contorno, chispas
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };   // (lo que lee el editor)
  const pfx = (S, k, x, y, o) => { const V = window.CK_VFX; if (!V || !V.fx) return null; S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return V.fx(S, k, x, y, o || {}); } finally { S._ckPedCrea--; } };
  const HP = () => window.CK_HEROES_PEDIDOS;
  const canal = (S, e, col, ms, r) => { const H = HP(); if (H && H.canalizar) H.canalizar(S, e, col, ms, r || 50); };
  const brillo = (S, e, col, ms) => { const H = HP(); if (H && H.contorno) H.contorno(S, e, col, ms); };
  const chispas2 = (S, x, y, col, n, r) => { const H = HP(); if (H && H.estallar) H.estallar(S, x, y, col, n, r); };

  // ------------------------------------------------------------------ manejar el turno especial
  const empezar = (S, e) => { e._ckc.ocupado = true; e.state = 'ck_especial'; e.isAttacking = true; e.setVelocity(0, 0); };
  const terminar = (S, e, pausa) => {
    if (!vivo(e)) return;
    e.clearTint(); e._ckc.ocupado = false; e.isAttacking = false; e.state = 'chase';
    e._ckc.prox = S.time.now + (pausa || R(...JEFES[e.type].cada));
    e.play(e.type + '_idle', true);
  };
  const mirar = (S, e, x) => { e.facing = x < e.x ? 'left' : 'right'; e.setFlipX(x < e.x); };

  // ---------- GORVAK
  const salto = (S, e) => {
    // (21/11) un segundo más de anticipación: se agacha juntando polvo; al caer, el piso se parte (pixelfx)
    empezar(S, e); const t = pies(S); mirar(S, e, t.x);
    aviso(S, e, ROJO); marca(S, t.x, t.y, 64, ROJO, 1900);
    canal(S, e, [220, 200, 170], 1200, 46); brillo(S, e, 0xff8a6a, 1250);
    const sx = e.scaleX, sy = e.scaleY;
    S.tweens.add({ targets: e, scaleY: sy * 0.88, scaleX: sx * 1.05, duration: 1000, ease: 'Sine.easeOut' });
    S.time.delayedCall(1000, () => { if (vivo(e) && FX()) FX().sombraCaida(S, t.x, t.y, 64, 900); });
    S.time.delayedCall(1250, () => {
      if (!vivo(e)) return;
      S.tweens.killTweensOf(e); e.setScale(sx, sy);
      e.play('orc_campeon_salto', true);
      const fx = e.x, fy = e.y, dx = t.x - e.body.center.x, dy = t.y - (e.body.bottom - 3), k = { t: 0 };
      e.body.enable = false;
      S.tweens.add({ targets: k, t: 1, duration: 650, ease: 'Sine.easeInOut',
        onUpdate: () => { e.setPosition(fx + dx * k.t, fy + dy * k.t - Math.sin(k.t * Math.PI) * 70); e.setDepth(fy + dy * k.t + 60); },
        onComplete: () => {
          if (!vivo(e)) return;
          e.body.enable = true; e.body.reset(e.x, e.y);
          polvo(S, t.x, t.y, 64); if (FX()) { FX().grieta(S, t.x, t.y, 60); FX().escombros(S, t.x, t.y, 60, 18); } son('ck_aterriza', 0.9) || son('bone_hit', 0.9, { rate: 0.6 });
          pfx(S, 'pfx_impacto', t.x, t.y, { escala: 0.8, prof: Math.round(t.y) - 6 }); pfx(S, 'pfx_aterrizaje', t.x, t.y, { escala: 1.3, prof: Math.round(t.y) - 5 });
          const p = pies(S);
          if (Math.hypot((p.x - t.x) / 64, (p.y - t.y) / 40) < 1) { golpeRojo(S, 2); empujar(S, t.x, t.y, 260); }
          S.time.delayedCall(450, () => terminar(S, e));
        } });
    });
  };
  const escudo = (S, e) => {
    // (21/11) "que se ponga en pose defensiva y luego arremeta con una embestida": guardia 1,2 s (de frente no le entra
    // nada) y sale con el escudo adelante
    empezar(S, e); mirar(S, e, S.player.x);
    e.play('orc_campeon_block', true);
    S.createFloatingText(e.x, e.y - 66, '¡MURO DE ESCUDO!', 0xcbd5e1);
    e._ckc.escudo = S.time.now + 2000;
    brillo(S, e, 0xcbd5e1, 1200);
    if (FX()) FX().chispas(S, e.body.center.x + (e.flipX ? -16 : 16), e.body.bottom - 30, 6, 0xffffff);
    S.time.delayedCall(1200, () => {
      if (!vivo(e)) return;
      const p = pies(S), ox = e.body.center.x, oy = e.body.bottom - 4, a = Math.atan2(p.y - oy, p.x - ox), v = 400, L = Math.min(260, Math.hypot(p.x - ox, p.y - oy) + 60);
      mirar(S, e, p.x); e.play('orc_campeon_block', true);
      son('ck_embestida', 0.8) || son('dash', 0.7, { rate: 0.7 });
      if (FX()) FX().rastro(S, e, L / v * 1000 + 200);
      let pego = false; const t0 = S.time.now;
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        if (!vivo(e)) { ev.remove(); return; }
        e.body.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
        const q = pies(S);
        if (!pego && Math.hypot(q.x - e.body.center.x, q.y - (e.body.bottom - 4)) < 34) {
          pego = true; golpeRojo(S, 2); empujar(S, e.body.center.x, e.body.bottom, 340);
          if (FX()) FX().chispas(S, q.x, q.y - 14, 10, 0xffffff); S.cameras.main.shake(160, 0.008); son('ck_escudo_bloquea', 0.8) || son('sword_hit', 0.9, { rate: 0.6 });
        }
        if (S.time.now - t0 > L / v * 1000) { ev.remove(); e.body.setVelocity(0, 0); e._ckc.escudo = 0; terminar(S, e, R(2400, 3600)); }
      } });
    });
  };
  const cuchilla = (S, e) => {
    empezar(S, e); const t = pies(S); mirar(S, e, t.x);
    aviso(S, e, AMARILLO); franja(S, e.body.center.x, e.body.bottom - 20, t.x, t.y, 22, AMARILLO, 600);
    e.play('orc_campeon_attack1', true);
    S.time.delayedCall(600, () => {
      if (!vivo(e)) return;
      const ox = e.body.center.x, oy = e.body.bottom - 22, a = Math.atan2(t.y - oy, t.x - ox), L = Math.min(300, Math.hypot(t.x - ox, t.y - oy) + 80);
      const c = S.add.image(ox, oy, texCuchilla(S)).setDepth(26000).setScale(1.5);
      if (FX()) FX().estela(S, c, 200);
      let pego = false; const k = { t: 0 };
      son('sword_swing2', 0.7, { rate: 0.7 });
      S.tweens.add({ targets: k, t: 1, duration: 1300, ease: 'Linear',
        onUpdate: () => {
          const s = Math.sin(k.t * Math.PI), x = ox + Math.cos(a) * L * s, y = oy + Math.sin(a) * L * s;
          c.setPosition(x, y).setRotation(k.t * 26);
          const p = pies(S);
          if (!pego && Math.hypot(p.x - x, p.y - 10 - y) < 20) { pego = true; S.damagePlayer(2); }
        },
        onComplete: () => { c.destroy(); terminar(S, e); } });
    });
  };
  // (21/11, "mejorar el diseño del cuchillo arrojadizo") una cuchilla orca: hoja curva con filo claro, lomo oscuro, muesca y
  // mango envuelto en cuero, con su contorno
  const texCuchilla = S => {
    if (S.textures.exists('ckc_cuchilla2')) return 'ckc_cuchilla2';
    const t = S.textures.createCanvas('ckc_cuchilla2', 22, 22), g = t.getContext();
    const p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
    p('#1b0f0a', 4, 3, 13, 2); p('#1b0f0a', 2, 5, 17, 2); p('#1b0f0a', 1, 7, 19, 4); p('#1b0f0a', 2, 11, 17, 2); p('#1b0f0a', 5, 13, 10, 2); p('#1b0f0a', 8, 15, 5, 6);
    p('#4a4f56', 5, 4, 11, 1); p('#6c727a', 3, 6, 15, 1); p('#8c929a', 2, 7, 17, 3); p('#b8bec6', 3, 10, 15, 1); p('#e6ebf0', 4, 11, 13, 1); p('#ffffff', 7, 11, 5, 1); p('#e6ebf0', 6, 13, 8, 1);
    p('#1b0f0a', 15, 7, 2, 2); p('#3a1010', 6, 7, 2, 1);
    p('#5a3a24', 9, 15, 3, 5); p('#8a5a32', 9, 16, 3, 1); p('#8a5a32', 9, 18, 3, 1); p('#c8a060', 10, 20, 1, 1);
    t.refresh(); return 'ckc_cuchilla2';
  };

  // ---------- KRAGMOR
  const embestida = (S, e, cazador) => {
    empezar(S, e); const p = pies(S); mirar(S, e, p.x);
    const ox = e.body.center.x, oy = e.body.bottom - 6, a = Math.atan2(p.y - oy, p.x - ox), L = cazador ? 640 : 420;
    const x1 = ox + Math.cos(a) * L, y1 = oy + Math.sin(a) * L;
    aviso(S, e, ROJO); franja(S, ox, oy, x1, y1, 46, ROJO, 850);
    S.time.delayedCall(850, () => {
      if (!vivo(e)) return;
      const anim = cazador ? 'cazador_ulrak_walk' : 'bestia_kragmor_charge';
      const v = cazador ? 520 : 430, t0 = S.time.now;
      if (cazador) { andar(S, e, Math.cos(a) * v, Math.sin(a) * v); e.anims.timeScale = 2; }   // el huargo corre mirando hacia donde va
      else { e.play(anim, true); e.setFlipX(Math.cos(a) < 0); }
      e.body.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
      son(cazador ? 'ck_silbido' : 'ck_embestida', cazador ? 0.5 : 0.85);
      if (FX()) FX().rastro(S, e, L / v * 1000 + 300);
      let pego = false, ultimo = { x: e.x, y: e.y, t: t0 };
      let paso = 0;
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        if (!vivo(e)) { ev.remove(); return; }
        e.body.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
        // (21/11) Kragmor deja pisadas que quiebran el piso y polvo; el huargo, un eco de velocidad
        if (++paso % 4 === 0) {
          const fx0 = e.body.center.x, fy0 = e.body.bottom - 2;
          if (!cazador) { if (FX()) { FX().grieta(S, fx0 + R(-6, 6), fy0, 14); FX().escombros(S, fx0, fy0, 12, 3); } pfx(S, 'pfx_polvo', fx0, fy0, { escala: 0.6, prof: Math.round(fy0) - 4 }); }
          else { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { const c = S.add.sprite(e.x, e.y, e.texture.key, e.frame.name).setFlipX(e.flipX).setScale(e.scaleX, e.scaleY).setTintFill(0xd8e8ff).setAlpha(0.45).setBlendMode(1).setDepth(e.depth - 1); S.tweens.add({ targets: c, alpha: 0, duration: 260, onComplete: () => c.destroy() }); } finally { S._ckPedCrea--; } chispas2(S, fx0 - Math.cos(a) * 20, fy0 - 20, [220, 235, 255], 3, 14); }
        }
        const q = pies(S);
        if (!pego && Math.hypot(q.x - e.body.center.x, q.y - (e.body.bottom - 4)) < (cazador ? 34 : 40)) { pego = true; golpeRojo(S, 2); empujar(S, e.body.center.x, e.body.bottom, 320); }
        const ahora = S.time.now, quieto = Math.hypot(e.x - ultimo.x, e.y - ultimo.y) < 2 && ahora - t0 > 160;
        ultimo = { x: e.x, y: e.y, t: ahora };
        const lejos = Math.hypot(e.body.center.x - ox, e.body.bottom - 6 - oy) >= L || ahora - t0 > L / v * 1000 + 200;
        if (quieto || lejos) {
          ev.remove(); e.body.setVelocity(0, 0); e.anims.timeScale = 1;
          if (quieto && !cazador) {                 // contra la pared: atontado
            polvo(S, e.body.center.x, e.body.bottom, 40); son('bone_hit', 0.8, { rate: 0.5 });
            if (FX()) { FX().escombros(S, e.body.center.x + (e.flipX ? -20 : 20), e.body.bottom - 10, 34, 12); FX().chispas(S, e.body.center.x, e.body.bottom - 40, 6, 0xffe08a); }
            S.createFloatingText(e.x, e.y - 66, '¡ATONTADO!', 0xfde68a);
            e._ckVulnerable = S.time.now + 2000; e.setTint(0xb0b0b0); e.play('bestia_kragmor_idle', true); e.anims.timeScale = 0.4;
            const est = S.add.text(e.x, e.y - 74, '✦ ✦ ✦', { fontFamily: 'Georgia', fontSize: '13px', color: '#ffe08a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(26002);
            S.tweens.add({ targets: est, angle: 360, duration: 2000, onUpdate: () => est.setPosition(e.x, e.y - 74), onComplete: () => est.destroy() });
            S.time.delayedCall(2000, () => { if (vivo(e)) e.anims.timeScale = 1; terminar(S, e, R(1800, 2600)); });
          } else if (cazador && !e._ckc.vuelta) {   // el huargo da la vuelta y vuelve a cruzar
            e._ckc.vuelta = true; e._ckc.ocupado = false;
            S.time.delayedCall(350, () => vivo(e) && embestida(S, e, true));
          } else { e._ckc.vuelta = false; terminar(S, e); }
        }
      } });
    });
  };
  const sismo = (S, e) => {
    // (21/11) "las ondas expansivas que sean de piedras y polvo con partículas y las roturas del piso más elaboradas"
    empezar(S, e); mirar(S, e, S.player.x); aviso(S, e, ROJO);
    e.play('bestia_kragmor_slam', true);
    const cx = e.body.center.x, cy = e.body.bottom - 4;
    marca(S, cx, cy, 40, ROJO, 700);
    canal(S, e, [200, 180, 150], 700, 50);
    S.time.delayedCall(700, () => {
      if (!vivo(e)) return;
      polvo(S, cx, cy, 50); if (FX()) { FX().grieta(S, cx, cy, 70); FX().escombros(S, cx, cy, 50, 18); } son('ck_pisoton_jefe', 1) || son('bone_hit', 1, { rate: 0.45 });
      pfx(S, 'pfx_impacto', cx, cy, { escala: 0.85, prof: Math.round(cy) - 6 });
      pfx(S, 'pfx_sismo', cx, cy, { escala: 0.9, prof: Math.round(cy) - 7 });
      [0, 380, 760].forEach((d, i) => S.time.delayedCall(d, () => {
        const k = { r: 10 }, golpeados = new Set();
        if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', cx, cy, 190, 900);
        S.tweens.add({ targets: k, r: 190, duration: 900, ease: 'Sine.easeOut',
          onUpdate: () => {
            // la onda son piedras y polvo que saltan por donde pasa
            if (FX()) for (let j = 0; j < 2; j++) { const aa = R(0, Math.PI * 2); FX().escombros(S, cx + Math.cos(aa) * k.r, cy + Math.sin(aa) * k.r * 0.62, 8, 2); }
            if (Math.random() < 0.5) { const aa = R(0, Math.PI * 2); chispas2(S, cx + Math.cos(aa) * k.r, cy + Math.sin(aa) * k.r * 0.62, [200, 180, 150], 3, 12); }
            const p = pies(S), dd = Math.hypot(p.x - cx, (p.y - cy) / 0.62);
            if (!golpeados.has(i) && Math.abs(dd - k.r) < 10) { golpeados.add(i); golpeRojo(S, 1); }
          } });
      }));
      S.time.delayedCall(1500, () => terminar(S, e));
    });
  };
  // (v10) Kragmor tira la roca con su animación de PixelLab (ck_jefes_anims_arte.js: la agarra del piso, la sube al pecho y la
  // arroja). Sus cuadros son más altos (100x130, para que entre parado): mientras dura, el pivote va en los pies y su cuerpo
  // físico se corre lo mismo (offset), así no se mueve nada; cualquier otra animación lo vuelve a lo normal.
  const tiroK = (S, e, AK, alSoltar) => {
    const d = AK.fh * AK.piv[1] - 50;
    const fin = () => { if (!e._ckTiro) return; if (e.body) e.body.offset.y -= e._ckTiro; e._ckTiro = 0; e.setOrigin(0.5, 0.5); };
    if (!e._ckTiroPlay) {
      const play0 = e.play; e._ckTiroPlay = true;
      e.play = function (key) { try { const k = typeof key === 'string' ? key : key && key.key; if (this._ckTiro && k !== 'bestia_kragmor_tiro') fin(); } catch (er) {} return play0.apply(this, arguments); };
    }
    if (!e._ckTiro) { e._ckTiro = d; if (e.body) e.body.offset.y += d; }
    e.play('bestia_kragmor_tiro', true);
    let solto = false;
    const upd = (an, fr) => { if (!solto && an.key === 'bestia_kragmor_tiro' && fr.index - 1 >= AK.suelta) { solto = true; try { alSoltar(); } catch (er) { console.warn('[coliseo] tiro', er); } } };
    e.on('animationupdate', upd);
    e.once('animationcomplete', an => { e.off('animationupdate', upd); if (an && an.key !== 'bestia_kragmor_tiro') return; fin(); if (vivo(e)) e.play('bestia_kragmor_idle', true); });
    S.time.delayedCall(2500, () => { e.off('animationupdate', upd); if (vivo(e) && e._ckTiro && !(e.anims.currentAnim && e.anims.currentAnim.key === 'bestia_kragmor_tiro' && e.anims.isPlaying)) fin(); });
  };
  const caeRoca = (S, r, x, y, ms, alto, radio, alCaer) => {
    marca(S, x, y, radio, ROJO, ms); if (FX()) FX().sombraCaida(S, x, y, radio, ms);
    const x0 = r.x, y0 = r.y, k = { t: 0 }, giro = R(300, 520) * (Math.random() < 0.5 ? -1 : 1);
    S.tweens.add({ targets: k, t: 1, duration: ms, ease: 'Sine.easeIn', onUpdate: () => { if (r.active) r.setPosition(x0 + (x - x0) * k.t, y0 + (y - 6 - y0) * k.t - Math.sin(k.t * Math.PI) * alto).setAngle(k.t * giro).setDepth(26000); },
      onComplete: () => {
        if (r.active) r.destroy();
        polvo(S, x, y, radio * 0.9); if (FX()) { FX().escombros(S, x, y, radio * 0.9, 10); FX().grieta(S, x, y, radio * 0.8); }
        pfx(S, 'pfx_aterrizaje', x, y, { escala: radio / 38, prof: Math.round(y) - 4 });
        son('ck_piedra', 0.5, { rate: 0.9 + Math.random() * 0.2 }) || son('bone_hit', 0.6, { rate: 0.7 });
        const q = pies(S); if (Math.hypot((q.x - x) / radio, (q.y - y) / (radio * 0.62)) < 1) golpeRojo(S, 1);
        if (alCaer) alCaer();
      } });
  };
  const piedras = (S, e) => {
    const AK = window.CK_JEFES_ANIMS_ARTE && window.CK_JEFES_ANIMS_ARTE.kragmor_tiro;
    if (AK && FX() && S.anims.exists('bestia_kragmor_tiro')) return piedrasTiro(S, e, AK);
    return piedrasViejo(S, e);
  };
  // golpea el piso, sale UNA roca, la agarra y la arroja donde estás; al caer se parte y los pedazos caen alrededor
  const piedrasTiro = (S, e, AK) => {
    empezar(S, e); aviso(S, e, ROJO); e.play('bestia_kragmor_slam', true);
    canal(S, e, [200, 180, 150], 900, 50); brillo(S, e, 0xffb070, 900);
    S.time.delayedCall(900, () => {
      if (!vivo(e)) return;
      const lado = e.flipX ? -1 : 1, sx = Math.abs(e.scaleX), sy = Math.abs(e.scaleY);
      const fx0 = e.body.center.x + lado * 30, fy0 = e.body.bottom - 4;
      polvo(S, fx0, fy0, 40); pfx(S, 'pfx_impacto', fx0, fy0, { escala: 0.6, prof: Math.round(fy0) - 6 }); if (FX()) FX().grieta(S, fx0, fy0, 40);
      son('ck_pisoton_jefe', 0.9) || son('bone_hit', 0.9, { rate: 0.5 });
      // sale la roca del piso, justo donde la va a agarrar
      const rx = e.x + AK.roca0[0] * sx * lado, ry = e.y + AK.roca0[1] * sy;
      const r = crea(S, () => FX().roca(S, rx, ry + 8)).setScale(AK.rocaEsc * sx, AK.rocaEsc * sy * 0.3).setFlipX(lado < 0).setDepth(e.depth + 1);
      S.tweens.add({ targets: r, y: ry, scaleY: AK.rocaEsc * sy, duration: 240, ease: 'Back.easeOut' });
      if (FX()) FX().escombros(S, rx, ry + 6, 16, 6);
      S.time.delayedCall(260, () => {
        if (!vivo(e)) { r.destroy(); terminar(S, e); return; }
        r.setVisible(false);                                               // (la agarra: desde acá la roca es la de su dibujo)
        tiroK(S, e, AK, () => {
          // la suelta: la roca vuela desde sus manos hasta donde estás
          const l2 = e.flipX ? -1 : 1, q = pies(S);
          r.setPosition(e.x + AK.rocaSuelta[0] * sx * l2, e.y + AK.rocaSuelta[1] * sy).setScale(AK.rocaEsc * sx * 1.15).setVisible(true).setDepth(26000);
          son('sword_swing2', 0.6, { rate: 0.45 });
          caeRoca(S, r, q.x, q.y, 620, 70, 34, () => {
            // y se parte: tres pedazos caen alrededor
            const lejos = Math.atan2(q.y - e.y, q.x - e.x);              // (hacia el lado contrario a él)
            for (let i = 0; i < 3; i++) {
              const a = lejos + (i - 1) * 0.9 + R(-0.3, 0.3), dd = R(55, 105), px = q.x + Math.cos(a) * dd, py = q.y + Math.sin(a) * dd * 0.62;
              const f = FX() ? FX().roca(S, q.x, q.y - 6) : S.add.circle(q.x, q.y - 6, 6, 0x6b5a4a).setDepth(26000);
              caeRoca(S, f, px, py, 460 + i * 60, 46, 24);
            }
          });
        });
      });
      S.time.delayedCall(260 + 900 + 620 + 640 + 300, () => terminar(S, e));
    });
  };
  const piedrasViejo = (S, e) => {
    // (21/11) "que haga una anticipación: golpea el piso, sale una roca y luego la arroja"
    empezar(S, e); aviso(S, e, ROJO); e.play('bestia_kragmor_slam', true);
    canal(S, e, [200, 180, 150], 900, 50); brillo(S, e, 0xffb070, 900);
    const p = pies(S), pts = [[p.x, p.y]];
    for (let i = 0; i < 3; i++) pts.push([p.x + R(-110, 110), p.y + R(-60, 60)]);
    S.time.delayedCall(900, () => {
      if (!vivo(e)) return;
      const fx0 = e.body.center.x + (e.flipX ? -30 : 30), fy0 = e.body.bottom - 4;
      polvo(S, fx0, fy0, 40); pfx(S, 'pfx_impacto', fx0, fy0, { escala: 0.6, prof: Math.round(fy0) - 6 }); if (FX()) FX().grieta(S, fx0, fy0, 40);
      son('ck_pisoton_jefe', 0.9) || son('bone_hit', 0.9, { rate: 0.5 });
      pts.forEach(([x, y], i) => {
        const ox = fx0 + R(-16, 16), oy = fy0 - 4;
        const r = FX() ? FX().roca(S, ox, oy) : S.add.circle(ox, oy, 9, 0x6b5a4a).setStrokeStyle(2, 0x1b0f0a).setDepth(26000);
        r.setScale(r.scaleX * 1.4);
        S.tweens.add({ targets: r, y: oy - 34 - i * 6, duration: 260, ease: 'Quad.easeOut' });          // sale del piso
        S.time.delayedCall(300 + i * 160, () => {
          if (!r.active) return;
          marca(S, x, y, 30, ROJO, 560); if (FX()) FX().sombraCaida(S, x, y, 30, 560);
          const x0 = r.x, y0 = r.y, k = { t: 0 };
          son('sword_swing2', 0.5, { rate: 0.5 });
          S.tweens.add({ targets: k, t: 1, duration: 560, ease: 'Sine.easeIn', onUpdate: () => { r.setPosition(x0 + (x - x0) * k.t, y0 + (y - 6 - y0) * k.t - Math.sin(k.t * Math.PI) * 90).setAngle(k.t * 400); },
            onComplete: () => {
              r.destroy(); polvo(S, x, y, 26); if (FX()) { FX().escombros(S, x, y, 26, 10); FX().grieta(S, x, y, 24); }
              pfx(S, 'pfx_aterrizaje', x, y, { escala: 0.8, prof: Math.round(y) - 4 });
              son('ck_piedra', 0.5, { rate: 0.9 + Math.random() * 0.2 }) || son('bone_hit', 0.6, { rate: 0.7 });
              const q = pies(S); if (Math.hypot((q.x - x) / 30, (q.y - y) / 19) < 1) golpeRojo(S, 1);
            } });
        });
      });
      S.time.delayedCall(300 + pts.length * 160 + 700, () => terminar(S, e));
    });
  };

  // ---------- ULRAK
  const andanada = (S, e) => {
    empezar(S, e);
    // primero se aleja un poco
    const p = pies(S), a0 = Math.atan2(e.body.bottom - p.y, e.body.center.x - p.x);
    andar(S, e, Math.cos(a0) * 170, Math.sin(a0) * 170);     // se aleja dándose vuelta, no caminando para atrás
    e.body.setVelocity(Math.cos(a0) * 170, Math.sin(a0) * 170);
    S.time.delayedCall(450, () => {
      if (!vivo(e)) return;
      e.body.setVelocity(0, 0); const t = pies(S); mirar(S, e, t.x);
      aviso(S, e, AMARILLO); e.play('cazador_ulrak_arco', true);
      const ox = e.body.center.x + (e.flipX ? -30 : 30), oy = e.body.bottom - 52, a = Math.atan2(t.y - 10 - oy, t.x - ox);
      [-0.28, 0, 0.28].forEach(d => franja(S, ox + Math.cos(a + d) * 160, oy + Math.sin(a + d) * 160, ox, oy, 6, AMARILLO, 650));
      S.time.delayedCall(650, () => {
        if (!vivo(e)) return;
        son('bow_shot', 0.8) || son('sword_swing2', 0.6, { rate: 1.8 }); S.time.delayedCall(90, () => son('ck_silbido', 0.45));
        [-0.28, 0, 0.28].forEach(d => {
          const ang = a + d, f = S.add.image(ox, oy, texLanza(S)).setRotation(ang).setDepth(26000).setScale(1.3);   // (21/11) lanzas, no flechas
          if (FX() && FX().estela) FX().estela(S, f, 160);
          let pego = false; const v = 360, t0 = S.time.now;
          const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
            const dt = (S.time.now - t0) / 1000, x = ox + Math.cos(ang) * v * dt, y = oy + Math.sin(ang) * v * dt;
            f.setPosition(x, y);
            const q = pies(S);
            if (!pego && Math.hypot(q.x - x, q.y - 14 - y) < 14) { pego = true; S.damagePlayer(1); f.destroy(); ev.remove(); return; }
            if (dt > 1.4) { f.destroy(); ev.remove(); }
          } });
        });
        S.time.delayedCall(500, () => terminar(S, e));
      });
    });
  };
  const texLanza = S => {
    if (S.textures.exists('ckc_lanza')) return 'ckc_lanza';
    const t = S.textures.createCanvas('ckc_lanza', 34, 7), g = t.getContext(), p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
    // apunta a la derecha: el regatón, el asta de madera, una tira de cuero y la punta de hierro
    p('#1b0f0a', 0, 2, 3, 3); p('#6c727a', 1, 3, 1, 1);
    p('#1b0f0a', 2, 2, 24, 3); p('#6b4426', 3, 3, 22, 1); p('#8a5a32', 3, 2, 22, 1);
    p('#c8a060', 16, 2, 2, 3); p('#8a2a1a', 18, 2, 1, 3);
    p('#1b0f0a', 25, 1, 7, 5); p('#1b0f0a', 32, 3, 2, 1); p('#8c929a', 26, 2, 5, 3); p('#d5dbe1', 27, 3, 5, 1);
    t.refresh(); return 'ckc_lanza';
  };
  const cargaHuargo = (S, e) => embestida(S, e, true);
  const aullido = (S, e) => {
    // (21/11) "con el aullido no invoca lobos, sólo se vuelve más rápido y resistente unos segundos"
    empezar(S, e); mirar(S, e, S.player.x);
    e.play('cazador_ulrak_aullido', true);
    S.createFloatingText(e.x, e.y - 70, '¡AUUUUU!', 0xcbd5e1); if (FX()) FX().ondaVoz(S, e.x + (e.flipX ? -26 : 26), e.y - 30, e.flipX); son('warg_howl', 0.9) || son('necro_cast', 0.6, { rate: 0.6 });
    S.cameras.main.shake(300, 0.006);
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'hielo', e.body.center.x, e.body.bottom, 80, 500);
    S.time.delayedCall(700, () => {
      if (!vivo(e)) return;
      const MS = 6000;
      e._ckFuria = S.time.now + MS;
      if (!e._ckc.velFuria) { e._ckc.velFuria = e.def.speed; e._ckc.cdFuria = e.def.cd; e.def = Object.assign({}, e.def, { speed: e.def.speed * 1.35, cd: Math.round(e.def.cd * 0.8) }); }
      brillo(S, e, 0xbfe0ff, MS);
      S.createFloatingText(e.x, e.y - 76, '¡MÁS RÁPIDO Y DURO!', 0xbfe0ff);
      S.time.delayedCall(MS, () => { if (vivo(e) && e._ckc.velFuria) { e.def = Object.assign({}, e.def, { speed: e._ckc.velFuria, cd: e._ckc.cdFuria }); e._ckc.velFuria = 0; } });
      S.time.delayedCall(300, () => terminar(S, e));
    });
  };

  // (21/11) el aullido de Ulrak: mientras dura, recibe la mitad del daño
  const deF0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    try { if (enemy && enemy._ckFuria > this.time.now && amount > 0) arguments[1] = Math.max(1, Math.floor(amount / 2)); } catch (er) {}
    return deF0.apply(this, arguments);
  };
  // qué hace cada uno (con peso) según la vida
  const TURNOS = {
    orc_campeon: (e, mitad) => mitad ? [[salto, 3], [escudo, 2], [cuchilla, 3]] : [[salto, 3], [escudo, 2]],
    bestia_kragmor: (e, mitad) => mitad ? [[embestida, 3], [sismo, 2], [piedras, 3]] : [[embestida, 3], [sismo, 2]],
    cazador_ulrak: (e, mitad) => mitad ? [[andanada, 3], [cargaHuargo, 2], [aullido, e._ckc.aullo ? 0 : 2]] : [[andanada, 3], [cargaHuargo, 2]]
  };
  const elegir = (e, l) => {
    l = l.filter(([f, w]) => w > 0 && f.name !== e._ckc.ultimo);
    const tot = l.reduce((a, [, w]) => a + w, 0); let r = Math.random() * tot;
    for (const [f, w] of l) { if ((r -= w) <= 0) return f; }
    return l[0] && l[0][0];
  };
  const pensar = S => {
    if (!S.enemies) return;
    S.enemies.getChildren().forEach(e => {
      if (!vivo(e) || !JEFES[e.type] || !e._ckc) return;
      const c = e._ckc, now = S.time.now;
      if (c.lento && e.body) e.body.velocity.scale(0.45);
      if (c.ocupado || e.state !== 'chase' || e.isAttacking || now < c.prox || S.isDead || S.dialogOpen) return;
      const mitad = e.hp <= e.maxHp / 2;
      if (mitad && !c.mitad) {
        c.mitad = true;
        S.createFloatingText(e.x, e.y - 74, '¡SE ENFURECE!', 0xff6b6b); S.cameras.main.shake(350, 0.008);
        e.def = Object.assign({}, e.def, { cd: Math.round(e.def.cd * 0.8), speed: e.def.speed * 1.12 });
      }
      const f = elegir(e, TURNOS[e.type](e, mitad));
      if (!f) return;
      c.ultimo = f.name;
      if (f === aullido) { c.aullo = true; S.time.delayedCall(15000, () => { c.aullo = false; }); }
      f(S, e);
      if (window.CK_COLISEO && CK_COLISEO.reyMira) CK_COLISEO.reyMira(S, e);
    });
  };
  // de frente y de espaldas al caminar (pedido del dueño: "las vistas frontales y de espaldas de los enemigos")
  const vistas = S => S.enemies.getChildren().forEach(e => {
    if (!vivo(e) || !JEFES[e.type] || !e.body || (e._ckc && e._ckc.ocupado)) return;
    const k = e.anims.currentAnim && e.anims.currentAnim.key, t = e.type;
    if (k !== t + '_walk' && k !== t + '_walk_front' && k !== t + '_walk_back') return;
    const vx = e.body.velocity.x, vy = e.body.velocity.y, ax = Math.abs(vx), ay = Math.abs(vy), lado = k === t + '_walk';
    // (11/11, "a veces con la vista de espaldas camina hacia atrás") antes, una vez que se ponía de espaldas o de frente
    // ya no podía volver a la vista de costado (el play de abajo lo frenaba): seguía de espaldas caminando para el costado
    // o parado. Ahora la vista sale siempre de hacia dónde se mueve de verdad, y si se queda quieto pasa a estar parado.
    if (ax < 8 && ay < 8) { if (!lado && !e.isAttacking && S.anims.exists(t + '_idle')) play0.call(e, t + '_idle', true); return; }
    let q = t + '_walk';
    if (ay > ax * (lado ? 1.3 : 0.9)) q = t + (vy > 0 ? '_walk_front' : '_walk_back');
    if (q !== k && S.anims.exists(q)) play0.call(e, q, true);
    if (q !== t + '_walk') e.setFlipX(false); else if (ax > 5) { e.facing = vx < 0 ? 'left' : 'right'; e.setFlipX(vx < 0); }
  });
  // para los movimientos especiales (embestidas, alejarse): la vista que corresponde a esa dirección
  const andar = (S, e, vx, vy) => {
    const t = e.type; let q = t + '_walk';
    if (Math.abs(vy) > Math.abs(vx) * 1.3) q = t + (vy > 0 ? '_walk_front' : '_walk_back');
    if (!S.anims.exists(q)) q = t + '_walk';
    play0.call(e, q, true);
    if (q === t + '_walk') { e.facing = vx < 0 ? 'left' : 'right'; e.setFlipX(vx < 0); } else e.setFlipX(false);
  };
  // el juego vuelve a poner <tipo>_walk en cada paso; si ya iba de frente o de espaldas, no se corta
  const play0 = Phaser.GameObjects.Sprite.prototype.play;
  Phaser.GameObjects.Sprite.prototype.play = function (key, ignoreIfPlaying) {
    if (this._ckc && !this._ckc.ocupado && typeof key === 'string' && key === this.type + '_walk') {
      const k = this.anims.currentAnim && this.anims.currentAnim.key;
      if (k === key + '_front' || k === key + '_back') return this;
    }
    return play0.apply(this, arguments);
  };
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try { pensar(this); vistas(this); } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };

  // muro de escudo: de frente no entra; por la espalda, el doble
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    try {
      const c = enemy && enemy._ckc;
      if (c && c.escudo > this.time.now && !enemy.isDead) {
        const x = sx !== undefined ? sx : this.player.x, frente = enemy.flipX ? x < enemy.x : x > enemy.x;
        if (frente) {
          this.createFloatingText(enemy.x, enemy.y - 50, '¡BLOQUEA!', 0xcbd5e1); if (FX()) FX().chispas(this, enemy.x + (enemy.flipX ? -14 : 14), enemy.y - 6, 10); son('sword_hit', 0.7, { rate: 1.6, minGap: 120 });
          return;
        }
        arguments[1] = amount * 2;
        this.createFloatingText(enemy.x, enemy.y - 50, '¡POR LA ESPALDA!', 0xfde68a);
      }
    } catch (e) {}
    return de0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ el Rey Orco en la tribuna con la princesa
  // (14/11) la silla a cuadros del dibujo del mapa, abajo del trono: se tapa con la alfombra roja de abajo (columna por columna)
  const SILLA = [700, 127, 737, 145];
  const sinSilla = S => {
    try {
      const c = S.currentInterior, a = c && c.area; if (!a) return;
      const fl = S.children.list.find(o => o.texture && o.depth === 7 && Math.abs(o.x - a.x) < 2 && Math.abs(o.y - a.y) < 2);
      if (!fl || fl._ckcSinSilla) return;
      const img = fl.texture.getSourceImage(); if (!img || !img.width) return;
      const k = 'ckc_suelo_sin_silla_' + (S._ckcSs = (S._ckcSs || 0) + 1);
      const t = S.textures.createCanvas(k, img.width, img.height), g = t.getContext();
      g.drawImage(img, 0, 0);
      const [x0, y0, x1, y1] = SILLA, W = x1 - x0, H = y1 - y0;
      const im = g.getImageData(x0, y0, W, H + 8), d = im.data;
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
        const ys = H + (y % 8), i = (y * W + x) * 4, j = (ys * W + x) * 4;
        d[i] = d[j]; d[i + 1] = d[j + 1]; d[i + 2] = d[j + 2]; d[i + 3] = 255;
      }
      g.putImageData(im, x0, y0); t.refresh();
      fl.setTexture(k); fl._ckcSinSilla = true;
    } catch (e) { console.warn('[coliseo] silla', e); }
  };
  /** Pone al Rey Orco sentado y a la princesa encadenada en (x, y) del área actual (la base del trono). */
  const tribuna = (S, x, y) => {
    const c = S.currentInterior, ox = c ? c.area.x : 0, oy = c ? c.area.y : 0, objs = c ? (c.area.objs || (c.area.objs = [])) : [];
    if (S._ckcRey && S._ckcRey.active) S._ckcRey.destroy();
    if (S._ckcPrin && S._ckcPrin.active) S._ckcPrin.destroy();
    // (13/11) el caudillo sentado en su trono de huesos, al tamaño de la gente del coliseo (el héroe va a 1,25 acá), y la
    // princesa con su dibujo chico de siempre, a la misma escala que los demás personajes del mapa
    // (14/11, nota 129: "ajusta al jefe quita la silla de abajo y la princesa es el modelo que esta en el castillo de aldric"):
    // el trono apoya en la tarima, entre los colmillos (más abajo y un poco más grande); la silla a cuadros que traía el dibujo
    // del mapa abajo del trono se tapa con la alfombra; la princesa es la del castillo del Rey (npc8), encadenada al costado.
    sinSilla(S);
    const rey = S.add.sprite(ox + x, oy + y + 20, 'ckc_rey_idle').setOrigin(0.5, 0.9).setScale(1.2).setDepth(oy + y + 20);   // (15/11) +20 %
    S.tweens.add({ targets: rey, scaleY: 1.218, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // respira
    let pr;
    if (S.textures.exists('npc8_villager')) {
      pr = S.add.sprite(ox + x + 56, oy + y + 22, 'npc8_villager').setOrigin(0.5, 1).setScale(1.55).setFlipX(true).setDepth(oy + y + 22);
      if (S.anims.exists('npc8_idle')) pr.play('npc8_idle');
      const cad = S.add.graphics().setDepth(oy + y + 22.5);     // la cadena, del tobillo a la argolla del trono
      cad.lineStyle(1, 0x6b6f7a, 1);
      for (let i = 0; i < 6; i++) cad.strokeEllipse(ox + x + 50 - i * 3, oy + y + 20 - (i % 2), 3, 2);
      objs.push(cad);
    } else {
      pr = S.add.image(ox + x + 46, oy + y + 2, 'ckc_princesa').setOrigin(0.5, 1).setScale(1.25).setDepth(oy + y + 1);
      S.tweens.add({ targets: pr, y: pr.y - 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    objs.push(rey, pr);
    S._ckcRey = rey; S._ckcPrin = pr;
    return { rey, princesa: pr };
  };
  const FRASES = ['¡JA! ¡Más fuerte!', '¡Que corra la sangre!', '¡Aplastalo!', '¡Esa es mi bestia!'];
  const reyMira = (S, e) => {
    const rey = S._ckcRey; if (!rey || !rey.active || Math.random() > 0.35) return;
    S.createFloatingText(rey.x, rey.y - 100, FRASES[Math.floor(Math.random() * FRASES.length)], 0xfca5a5);
  };
  // al caer un campeón, el rey grita y la princesa pide ayuda
  const od0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = od0 ? od0.apply(this, arguments) : undefined;
    try {
      if (enemy && JEFES[enemy.type]) {
        const rey = this._ckcRey, pr = this._ckcPrin;
        if (rey && rey.active) this.createFloatingText(rey.x, rey.y - 104, '¡GRRR! ¡Que salga el siguiente!', 0xff6b6b);
        if (pr && pr.active) this.time.delayedCall(1300, () => pr.active && this.createFloatingText(pr.x, pr.y - 40, '¡Por favor, sacame de acá!', 0xbfdbfe));
        this.cameras.main.shake(400, 0.01);
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ probar
  const probar = (S, quien) => {
    const id = ATAJO[quien] || quien, p = S.player;
    const e = S.spawnEnemy(p.x + 150, p.y, id);
    if (e) { e.zone = S.currentZoneKey ? S.currentZoneKey() : ''; S.alertEnemy(e); }
    return e;
  };
  window.CK_COLISEO = { JEFES, probar, tribuna, reyMira, hab: { salto, escudo, cuchilla, embestida, sismo, piedras, andanada, cargaHuargo, aullido } };
})();
