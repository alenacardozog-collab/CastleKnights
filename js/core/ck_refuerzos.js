'use strict';
/* Llamadores de refuerzos (10/11, pedido del dueño: "que de los orcos haya uno que destaque, que haga una animación de
   llamar refuerzos y ahí se llene de más enemigos, y así por especie, pero no tan igual").
   En cada zona, del grupo más numeroso de una especie (3 o más) uno se vuelve LLAMADOR: un poco más grande, más vida
   (×1,5). La primera vez que te ve se planta y llama (1,3 s: anima, ondas
   de color, sonido). Si le pegás mientras llama, LO INTERRUMPÍS y no viene nadie. Si termina, llegan los refuerzos,
   distinto según la especie:
   - Orco del cuerno (orcos): sopla el cuerno de guerra; 4 orcos llegan corriendo desde fuera de la pantalla.
   - Alfa de la manada (huargos, hombres lobo): aúlla; la manada llega de a uno, desde dos o tres lados distintos.
   - Oso rugidor (hombre oso): ruge, tiembla el piso y caen piedritas; llegan dos huargos y un jabalí.
   - Alzahuesos (esqueletos): golpea el piso; tres muertos salen de la tierra a su alrededor.
   - Limo madre: se infla y se parte; tres limos brotan de ella y saltan para los costados.
   - Murciélago chillón: chilla; cuatro murciélagos bajan volando desde arriba.
   - Jabalí viejo: gruñe y escarba; dos jabalíes llegan embistiendo.
   (10/11) El de los orcos es uno en especial, el ORCO DEL CUERNO (orc_corneta, ck_bestias_chibi.js): en la zona, uno de los
   orcos se cambia por él. Nada de carteles: se entiende por lo que hace (sopla el cuerno y salen las ondas del sonido).
   Un llamador llama una vez; si pasa de la mitad de la vida y sigue en pie, puede llamar otra vez (con la mitad).
   Nunca hay más de TOPE bestias a la vez (los refuerzos que sobran no vienen). Los refuerzos no llaman a nadie.
   CK_REFUERZOS.hacer(escena, bestia, 'orco') convierte a una bestia en llamador (lo usa el panel de pruebas);
   CK_REFUERZOS.SIN.add('ed_<mapa>.main') saca los llamadores de una zona. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const TOPE = 30, LLAMA_MS = 1300, GRUPO = 3;
  const ESPECIES = {
    orco: { tipos: /^(orc|orc_armored|orc_elite|orc_corneta)$/, prefiere: ['orc_corneta', 'orc', 'orc_armored'], nombre: 'Corneta orca', color: 0xf97316,
      llamador: 'orc_corneta', anim: 'attack2', cuerno: true,
      grito: '¡CUERNO DE GUERRA!', sonido: [['ck_cuerno_orco', 0.85, 1], ['ev_cuerno_orco', 0.75], ['orc_attack', 0.8, 0.6]], llegaSon: 'ck_refuerzos_llegan', llegan: 'corriendo', refuerzos: ['orc', 'orc', 'orc_armored', 'orc'],
      aviso: '¡Vienen más orcos!' },
    lobo: { tipos: /^(warg|werewolf)$/, prefiere: ['werewolf', 'warg'], nombre: 'Alfa de la manada', color: 0x93c5fd,
      grito: '¡AÚÚÚÚÚÚ!', sonido: [['warg_howl', 0.85, 1], ['ev_aullido', 0.8], ['beast_growl', 0.8, 0.6]], llegan: 'manada', refuerzos: ['warg', 'warg', 'warg', 'werewolf'],
      aviso: 'La manada contesta' },
    oso: { tipos: /^werebear$/, prefiere: ['werebear'], grupo: 1, nombre: 'Oso rugidor', color: 0xf59e0b,
      grito: '¡GRRRAAAAAH!', sonido: [['rugido_oso', 0.85], ['beast_growl', 0.9, 0.5]], llegan: 'corriendo', refuerzos: ['warg', 'warg', 'boar'], temblor: true,
      aviso: 'El rugido despierta a las bestias' },
    hueso: { tipos: /^(skeleton|skeleton_armored|skeleton_great|skeleton_archer)$/, prefiere: ['skeleton_great', 'skeleton_armored', 'skeleton'], nombre: 'Alzahuesos', color: 0x86efac,
      grito: '¡LEVÁNTENSE!', sonido: [['runas', 0.7], ['necro_cast', 0.7, 0.8]], llegan: 'suelo', refuerzos: ['skeleton', 'skeleton', 'skeleton_archer'],
      aviso: 'Los muertos salen de la tierra' },
    limo: { tipos: /^slime$/, prefiere: ['slime'], nombre: 'Limo madre', color: 0x4ade80,
      grito: '¡BLUB… BLUB!', sonido: [['drenaje', 0.6], ['necro_cast', 0.5, 1.6]], llegan: 'brota', refuerzos: ['slime', 'slime', 'slime'], vida: 3,
      aviso: '¡Se parte en pedazos!' },
    murcielago: { tipos: /^bat$/, prefiere: ['bat'], nombre: 'Murciélago chillón', color: 0xc084fc,
      grito: '¡IIIIIIK!', sonido: [['critico', 0.5], ['beast_hurt', 0.6, 1.8]], llegan: 'cielo', refuerzos: ['bat', 'bat', 'bat', 'bat'], vida: 2,
      aviso: '¡Bajan del techo!' },
    jabali: { tipos: /^boar$/, prefiere: ['boar'], nombre: 'Jabalí viejo', color: 0xfca5a5,
      grito: '¡GRUOOOINK!', sonido: [['beast_growl', 0.8, 1.3]], llegan: 'corriendo', refuerzos: ['boar', 'boar'],
      aviso: '¡Embestida!' }
  };
  const SIN = new Set();
  const vivo = e => e && e.active && !e.isDead;
  const hab = (k, v, o) => { const H = window.CK_SONIDOS; if (!H || !H.son) return false; H.son(k, v, o); return true; };
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const especieDe = t => Object.keys(ESPECIES).find(k => ESPECIES[k].tipos.test(t)) || null;
  const activos = S => S.enemies ? S.enemies.getChildren().filter(vivo).length : 0;
  const colorCss = c => '#' + c.toString(16).padStart(6, '0');

  // ------------------------------------------------------------------ hacer llamador
  const hacer = (S, e, esp) => {
    esp = esp || especieDe(e.type); const E = ESPECIES[esp];
    if (!E || !vivo(e) || e._ckLlama || (e.def && e.def.boss)) return false;
    e._ckLlama = esp; e._ckLlamadas = 0;
    // (10/11) sin cartel con el nombre: se entiende por lo que hace. El que no tiene dibujo propio se ve un poco más grande
    if (e.type !== E.llamador) { e.setScale(e.scaleX * 1.15); e.maxHp = Math.ceil(e.maxHp * 1.5); e.hp = Math.ceil(e.hp * 1.5); }
    return true;
  };
  // al entrar a una zona: del grupo más numeroso de una especie, uno se vuelve llamador
  const elegir = S => {
    if (S._gameMode !== 'campaign' || !S.enemies) return;
    const z = S.currentZoneKey ? S.currentZoneKey() : ''; if (SIN.has(z)) return;
    const grupos = {};
    S.enemies.getChildren().forEach(e => { if (!vivo(e) || e._ckRefuerzo || (e.def && e.def.boss)) return; const k = especieDe(e.type); if (k) (grupos[k] = grupos[k] || []).push(e); });
    const ks = Object.keys(grupos).filter(k => grupos[k].length >= (ESPECIES[k].grupo || GRUPO)).sort((a, b) => grupos[b].length - grupos[a].length);
    if (!ks.length) return;
    const k = ks[0], E = ESPECIES[k], g = grupos[k];
    g.sort((a, b) => E.prefiere.indexOf(a.type) - E.prefiere.indexOf(b.type));
    const mejores = g.filter(e => e.type === g[0].type);
    let elegido = Phaser.Utils.Array.GetRandom(mejores);
    // la especie con su propio llamador (el orco del cuerno): uno del grupo se cambia por él, en el mismo lugar
    if (E.llamador && elegido.type !== E.llamador && ENEMY_TYPES[E.llamador] && S.textures.exists(E.llamador + '_idle')) {
      const x = elegido.x, y = elegido.y, z = elegido.zone, home = elegido.home;
      const n = S.spawnEnemy(x, y, E.llamador);
      if (n) { n.zone = z; n.home = home; n.setAlpha(1); try { if (elegido.hpBar) elegido.hpBar.destroy(); elegido.destroy(); } catch (er) {} elegido = n; }
    }
    hacer(S, elegido, k);
  };

  // ------------------------------------------------------------------ dónde aparecen
  const libre = (S, x, y, r) => {
    try {
      const G = S.navGrid && S.navGrid(true);
      if (G && S.navNearestCell) { const c = S.navNearestCell(G, x, y, r || 20); if (c) return { x: G.x + c[0] * 8 + 4, y: G.y + c[1] * 8 + 4 }; return null; }
    } catch (e) {}
    return { x, y };
  };
  const dentro = (S, x, y) => { const c = S.currentInterior; if (!c) return true; const a = c.area; return x > a.x + 16 && y > a.y + 24 && x < a.x + a.w - 16 && y < a.y + a.h - 12; };
  const lejos = (S, ang, extra) => {   // un lugar caminable fuera de la pantalla, hacia ese lado
    const cam = S.cameras.main, v = cam.worldView, p = S.player, D = Math.hypot(v.width, v.height) / 2 + (extra || 30);
    for (let i = 0; i < 10; i++) {
      const a = ang + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.35, d = D - i * 18;
      const q = libre(S, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 26);
      if (q && dentro(S, q.x, q.y) && Math.hypot(q.x - p.x, q.y - p.y) > 160) return q;
    }
    return null;
  };
  const traer = (S, tipo, x, y, quien) => {
    if (!ENEMY_TYPES[tipo] || activos(S) >= TOPE) return null;
    const e = S.spawnEnemy(x, y - 26, tipo); if (!e) return null;
    e._ckRefuerzo = true; e._ckAullo = true;
    if (S.currentInterior) e.zone = S.currentInterior.area.key;
    if (S.placeEnemyClear && !S.placeEnemyClear(e)) { e.destroy(); return null; }
    e.home = { x: quien ? quien.x : x, y: quien ? quien.y : y };
    S.time.delayedCall(120, () => { if (vivo(e)) { S.alertEnemy(e); } });
    return e;
  };

  // ------------------------------------------------------------------ la llamada
  const ondas = (S, e, color) => {
    for (let i = 0; i < 3; i++) S.time.delayedCall(i * 220, () => {
      if (!e.active) return;
      const g = S.add.ellipse(e.x, e.y + 22, 20, 9).setStrokeStyle(2, color, 0.9).setDepth(e.y + 30);
      S.tweens.add({ targets: g, scaleX: 9, scaleY: 9, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    });
    try { if (window.CK_LUZ) CK_LUZ.agregar({ x: e.x, y: e.y, c: [(color >> 16) & 255, (color >> 8) & 255, color & 255], r: 120, f: 0.9, ms: LLAMA_MS, curva: 'crece' }); } catch (er) {}
  };
  const cuerno = (S, e, color) => {
    const dir = e.flipX ? -1 : 1, t0 = S.time.now;
    for (let i = 0; i < 7; i++) S.time.delayedCall(i * 130, () => {
      if (!vivo(e) || !e._ckLlamando) return;
      const k = e.scaleX / 1.45, x = e.x + dir * 15 * k, y = e.y - 3 * k;
      const g = S.add.graphics().setDepth(e.y + 60).setPosition(x, y);
      g.lineStyle(2, i % 2 ? 0xfff1c2 : color, 0.95); g.beginPath(); g.arc(0, 0, 6, -0.7, 0.7); g.strokePath();
      g.setRotation(dir < 0 ? Math.PI : 0);
      S.tweens.add({ targets: g, scaleX: 6, scaleY: 6, x: x + dir * 46, alpha: 0, duration: 620, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
      // el aire sacude el polvo del piso delante del cuerno
      const d = S.add.circle(x + dir * Phaser.Math.Between(10, 40), e.y + 22, Phaser.Math.Between(1, 3), 0x9a8a70, 0.8).setDepth(e.y + 20);
      S.tweens.add({ targets: d, x: d.x + dir * Phaser.Math.Between(10, 30), y: d.y - Phaser.Math.Between(2, 8), alpha: 0, duration: 520, onComplete: () => d.destroy() });
    });
    try { if (window.CK_LUZ) CK_LUZ.agregar({ x: e.x, y: e.y, c: [255, 190, 110], r: 90, f: 0.7, ms: 900, curva: 'crece' }); } catch (er) {}
    S.cameras.main.shake(500, 0.0025);
  };
  const llamar = (S, e) => {
    const E = ESPECIES[e._ckLlama]; if (!E || !vivo(e)) return;
    e._ckLlamadas++; e._ckLlamando = true; e._ckLlamaHp = e.hp;
    e.state = 'ck_aulla'; e._ckRolHasta = S.time.now + LLAMA_MS; e.setVelocity(0, 0);
    e.isAttacking = false; e.swingId = (e.swingId || 0) + 1;
    const propia = E.anim && S.anims.exists(e.type + '_' + E.anim) ? e.type + '_' + E.anim : null;
    const clave = propia || (S.anims.exists(e.type + '_attack1') ? e.type + '_attack1' : null);
    if (clave) {
      if (propia) { const a = S.anims.get(propia); e.play({ key: propia, timeScale: a ? (a.frames.length / a.frameRate * 1000) / (LLAMA_MS - 150) : 1 }); }
      else e.play({ key: clave, timeScale: 0.6 });
      e.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { if (vivo(e) && S.anims.exists(e.type + '_idle')) e.play(e.type + '_idle'); });
    }
    if (!propia) { const sy = e.scaleY; S.tweens.add({ targets: e, scaleY: sy * 1.1, duration: 260, yoyo: true, repeat: 1, onComplete: () => { if (e.active) e.setScale(e.scaleX, sy); } }); }
    E.sonido.some(([k, v, r]) => (r ? son(k, v, { rate: r }) : hab(k, v, { gap: 400 }) || son(k, v)));
    if (E.cuerno) S.time.delayedCall(320, () => vivo(e) && e._ckLlamando && cuerno(S, e, E.color)); else ondas(S, e, E.color);
    if (E.temblor) { S.cameras.main.shake(LLAMA_MS * 0.7, 0.006); piedritas(S, e); }
    S.time.delayedCall(LLAMA_MS - 60, () => {
      e._ckLlamando = false;
      if (!vivo(e) || e._ckInterrumpido) { e._ckInterrumpido = false; return; }
      llegan(S, e, E);
    });
  };
  const piedritas = (S, e) => {
    for (let i = 0; i < 7; i++) S.time.delayedCall(i * 140, () => {
      const x = e.x + Phaser.Math.Between(-140, 140), y = e.y + Phaser.Math.Between(-40, 90);
      const r = S.add.circle(x, y - 160, Phaser.Math.Between(2, 4), 0x8a8077).setDepth(y + 1);
      S.tweens.add({ targets: r, y, duration: 280, ease: 'Quad.easeIn', onComplete: () => { S.tweens.add({ targets: r, alpha: 0, delay: 500, duration: 300, onComplete: () => r.destroy() }); } });
    });
  };
  const llegan = (S, e, E) => {
    const lista = E.refuerzos.slice(0, e._ckLlamadas > 1 ? Math.ceil(E.refuerzos.length / 2) : E.refuerzos.length);
    const p = S.player, base = Math.atan2(e.y - p.y, e.x - p.x);
    let n = 0;
    if (E.llegaSon) son(E.llegaSon, 0.7);
    if (E.llegan === 'corriendo' || E.llegan === 'manada') {
      const lados = E.llegan === 'manada' ? [base, base + 2.1, base - 2.1] : [base];
      lista.forEach((t, i) => S.time.delayedCall(E.llegan === 'manada' ? i * 380 : i * 120, () => {
        const q = lejos(S, lados[i % lados.length] + (Math.random() - 0.5) * 0.4); if (!q) return;
        if (traer(S, t, q.x, q.y, e)) n++;
      }));
    } else if (E.llegan === 'suelo') {
      lista.forEach((t, i) => S.time.delayedCall(i * 260, () => {
        const a = Math.random() * Math.PI * 2, q = libre(S, e.x + Math.cos(a) * 60, e.y + 26 + Math.sin(a) * 34, 24); if (!q) return;
        const r = traer(S, t, q.x, q.y, e); if (!r) return; n++;
        if (S.anims.exists(t + '_summon') && S.enemyMakeDormant && S.enemyRise) { S.enemyMakeDormant(r); S.time.delayedCall(60, () => vivo(r) && S.enemyRise(r, true)); }
        else { r.setAlpha(0); r.y += 20; S.tweens.add({ targets: r, y: r.y - 20, alpha: 1, duration: 500, ease: 'Quad.easeOut' }); }
        for (let k = 0; k < 6; k++) { const d = S.add.circle(q.x + Phaser.Math.Between(-10, 10), q.y, 2, 0x6b5a45).setDepth(q.y + 2); S.tweens.add({ targets: d, y: q.y - Phaser.Math.Between(6, 18), alpha: 0, duration: 500, onComplete: () => d.destroy() }); }
      }));
    } else if (E.llegan === 'brota') {
      lista.forEach((t, i) => {
        const a = (i / lista.length) * Math.PI * 2 + Math.random() * 0.5, q = libre(S, e.x + Math.cos(a) * 46, e.y + 26 + Math.sin(a) * 30, 20) || { x: e.x, y: e.y + 26 };
        const r = traer(S, t, e.x, e.y + 26, e); if (!r) return; n++;
        const sx = r.scaleX; r.setScale(sx * 0.35);
        S.tweens.add({ targets: r, x: q.x, y: q.y - 26, scaleX: sx, scaleY: sx, duration: 420, ease: 'Back.easeOut' });
      });
      S.tweens.add({ targets: e, scaleX: e.scaleX * 0.85, scaleY: e.scaleY * 0.85, duration: 200 });
    } else if (E.llegan === 'cielo') {
      const v = S.cameras.main.worldView;
      lista.forEach((t, i) => S.time.delayedCall(i * 200, () => {
        const x = p.x + Phaser.Math.Between(-180, 180), y = v.y - 20;
        const r = traer(S, t, x, y + 26, e); if (!r) return; n++;
        S.tweens.add({ targets: r, y: p.y - 60 + Phaser.Math.Between(-30, 30), duration: 700, ease: 'Sine.easeOut' });
      }));
    }
  };

  // ------------------------------------------------------------------ enganches
  const a0 = P.alertEnemy;
  P.alertEnemy = function (enemy) {
    const quiere = enemy && enemy._ckLlama && !enemy._ckLlamadas && vivo(enemy) && enemy.state !== 'chase' && enemy.state !== 'alerting';
    if (quiere) enemy._ckAullo = true;       // el aullido de ck_roles.js no: el llamador hace lo suyo
    const r = a0.apply(this, arguments);
    if (quiere && enemy.state === 'alerting') this.time.delayedCall(320, () => { if (vivo(enemy) && !enemy._ckLlamadas) llamar(this, enemy); });
    return r;
  };
  const d0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const r = d0.apply(this, arguments);
    try {
      if (enemy && enemy._ckLlama && vivo(enemy)) {
        if (enemy._ckLlamando && !enemy._ckInterrumpido) {
          enemy._ckInterrumpido = true; enemy._ckLlamando = false; enemy._ckRolHasta = this.time.now + 500;
          // se le corta: el cuerno se le cae de la boca (se ve en su golpe) y queda un momento aturdido, sin cartel
          if (this.anims.exists(enemy.type + '_hurt')) enemy.play(enemy.type + '_hurt');
          for (let i = 0; i < 5; i++) { const c = this.add.circle(enemy.x + Phaser.Math.Between(-8, 8), enemy.y - 14, 2, 0xfde68a).setDepth(enemy.y + 40);
            this.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(8, 16), x: c.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: 420, onComplete: () => c.destroy() }); }
        } else if (enemy._ckLlamadas === 1 && !enemy._ckLlamando && enemy.hp <= enemy.maxHp / 2 && enemy.state === 'chase' && !enemy.isAttacking && Math.random() < 0.6) {
          this.time.delayedCall(200, () => { if (vivo(enemy) && enemy._ckLlamadas === 1) llamar(this, enemy); });
        }
      }
    } catch (e) {}
    return r;
  };
  const u0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = u0.apply(this, arguments);
    try {
      this.enemies && this.enemies.getChildren().forEach(e => {
        const t = e._ckLlamaTag; if (!t) return;
        if (!vivo(e)) { t.destroy(); e._ckLlamaTag = null; return; }
        const pie = e.body ? e.body.bottom : e.y + 26, alto = (e.def && e.def.flying ? 34 : /werebear/.test(e.type) ? 62 : 50) * e.scaleY / 1.2;
        t.setPosition(e.x, pie - alto).setAlpha(e.alpha).setVisible(e.visible);
      });
    } catch (e) {}
    return r;
  };
  const s0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = s0.apply(this, arguments);
    this.time.delayedCall(700, () => { try { elegir(this); } catch (e) { console.warn('[refuerzos]', e); } });
    return r;
  };
  window.CK_REFUERZOS = { ESPECIES, SIN, TOPE, hacer, llamar, especieDe };
})();
