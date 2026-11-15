'use strict';
/* El final de la Mazmorra del Sello (14/11, nota 142 del dueño: "al otro lado encontramos a la princesa pricionera en un domo
   de energia, y aparece el walocck q este es el ayudante del demonio peleamos contra el y luego aparece el demonio").
   - Arriba, en el altar del Sello, Elia (la princesa del castillo) está encerrada en un DOMO DE ENERGÍA (ya no en la jaula).
   - Al entrar a la arena después de las baldosas: escena. La luz del Sello late, Elia grita y en una nube violeta aparece
     MALAKAR, EL BRUJO DEL SELLO (el Warlock del pack de demonios del dueño): hechizos que caen donde estás (como el Nigromante), diablillos que llama y,
     cada tanto, desaparece en humo y aparece en otro lado de la arena.
   - Al caer el brujo, el Sello se raja del todo y sale AZRATH, EL SEÑOR DEL SELLO (el Demon_E del mismo pack, grande): zarpazos que se
     avisan, LLUVIA DE FUEGO (marcas en el piso donde caen brasas) y ONDA DE FUEGO (un aro que se abre: hay que saltarlo
     con el dash o alejarse).
   - Al vencerlo: el domo se rompe, Elia sale y habla; abajo, en la llegada, vuelve a abrirse el portal de Oswin, que lleva
     al Camino al Castillo (story.flags.mz.final).
   Presentaciones (retratos de PixelLab) y música de jefe demonio (jefe_demonio, de ck_jefes_pelea.js).
   Va después de ck_mazmorra_runas.js y ck_mazmorra_final_arte.js. Borrar su línea de index.html deja a Elia en la jaula. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_MAZMORRA || !window.CK_MAZMORRA._t) return;
  const P = MainGameScene.prototype, MZ = window.CK_MAZMORRA, T = MZ._t, Z = MZ.Z;
  const ART = window.CK_MZ_FINAL_ARTE || {};
  const ADD = () => Phaser.BlendModes.ADD;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const aqui = S => !!(S && zona(S) === Z && S.currentInterior && S.currentInterior.area);
  const fl = S => MZ.fl(S);
  const guardar = S => { try { S.saveStory && S.saveStory(); } catch (e) {} };
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const E = () => window.CK_ESCENA;
  const BRUJO = 'brujo_sello', DEMONIO = 'demonio_sello';
  const N_BRUJO = 'Malakar, el Brujo del Sello', N_DEMONIO = 'Azrath, el Rey Demonio';
  const ALTAR = { x: 720, y: 150 }, DOMO = { x: 720, y: 128, rx: 30, ry: 40 }, CENTRO = { x: 720, y: 230 };
  const ARENA = [492, 120, 948, 292];

  // ================================================================== el brujo y el demonio (del pack del dueño: Warlock y Demon_E, hojas de 100 px)
  window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
  const hojas = (id, an) => an.forEach(a => { if (ART[id + '_' + a]) window.GAME_ASSETS_BASE64[id + '_' + a] = ART[id + '_' + a]; });
  if (typeof ENEMY_TYPES !== 'undefined' && ART.brujo_sello_idle && !ENEMY_TYPES[BRUJO]) {
    hojas(BRUJO, ['idle', 'walk', 'attack1', 'attack2', 'hurt', 'death']);
    // de cerca, el bastonazo (ataque 1); de lejos, el hechizo que cae donde estás (ataque 2), como el Nigromante
    ENEMY_TYPES[BRUJO] = { name: N_BRUJO, frames: { idle: 6, walk: 8, attack1: 7, attack2: 6, hurt: 4, death: 11 }, hp: 30, speed: 62, dmg: 1, reach: 46,
      cd: 2000, hitAt: 420, xp: 260, coins: 90, scale: 1.45, boss: true, meleeToo: true, rangedAnim: 'attack2', rangedHitAt: 380,
      sfx: ['necro_cast', 'wizard_hurt', 'ck_demonio_muere', 0.9], ranged: { key: 'necro_bolt', frames: 6, mode: 'drop', range: 320, radius: 26, fall: 520 },
      summon: { type: 'demonio_menor', every: 11000, max: 3 } };
  }
  const DEF_DEMONIO = { name: N_DEMONIO, frames: { idle: 6, walk: 8, attack1: 8, attack2: 8, hurt: 4, death: 4 }, hp: 48, speed: 64, dmg: 2, reach: 58,
    cd: 2100, hitAt: 360, xp: 600, coins: 250, scale: 2.0, boss: true, sfx: ['ck_demonio_rugido', 'beast_hurt', 'ck_demonio_muere', 0.7] };
  if (typeof ENEMY_TYPES !== 'undefined' && ART.demonio_sello_idle && !ENEMY_TYPES[DEMONIO]) {
    hojas(DEMONIO, ['idle', 'walk', 'attack1', 'attack2', 'hurt', 'death']);
    ENEMY_TYPES[DEMONIO] = Object.assign({}, DEF_DEMONIO);
  }
  const cargarDemonio = () => {};

  // ================================================================== presentaciones
  const presentar = () => {
    try {
      const PR = window.CK_PRESENTACIONES, A = window.CK_PRES_ARTE;
      if (!PR || !PR.ELENCO || !A || !A.retratos || PR.POR_ID.brujo) return;
      const nuevos = [
        { id: 'brujo', nombre: 'MALAKAR', etiqueta: 'Jefe', titulo: 'El Brujo del Sello', lado: 'enemigo', fuente: 'hueso', tema: 'niebla',
          dialogo: /^Malakar/, tipos: [BRUJO], colores: ['#f6e8ff', '#c05cff', '#7a0f2a'], contorno: '#12041c', banda: ['#12061c', '#3d1460'], acento: '#ff3a4a', resp: 'necro_cast' },
        { id: 'demonio', nombre: 'AZRATH', etiqueta: 'Jefe final', titulo: 'El Rey Demonio', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
          dialogo: /^Azrath/, tipos: [DEMONIO], colores: ['#fff2b0', '#ff6a1f', '#8c0d0d'], contorno: '#1a0303', banda: ['#200404', '#6a0d0d'], acento: '#ff5a1f', resp: 'ck_demonio_rugido' }
      ];
      nuevos.forEach(c => { PR.ELENCO.push(c); PR.POR_ID[c.id] = c; c.tipos.forEach(t => { PR.POR_TIPO[t] = c; }); });
      if (ART.ret_brujo) A.retratos.brujo = ART.ret_brujo;
      if (ART.ret_demonio) A.retratos.demonio = ART.ret_demonio;
    } catch (e) { console.warn('[mazmorra final]', e); }
  };
  presentar(); window.addEventListener('load', presentar);

  // ================================================================== el domo y Elia
  const armar = S => {
    const M = S._mz, F = fl(S), a = M.a;
    M._fin = { t0: S.time.now };
    cargarDemonio(S);
    // fuera la jaula y el dibujo chico de la princesa
    try { if (M.ents.jaula) M.ents.jaula.setVisible(false); } catch (e) {}
    try { M.objs.forEach(o => { if (o && o.texture && /^(ckmzr_jaula_barras|ckc_princesa)$/.test(o.texture.key)) o.setVisible(false); }); } catch (e) {}
    try { M.objs.forEach(o => { if (o && o.texture && o.texture.key === 'ckmz_halo' && Math.abs(o.x - a.x - 720) < 2 && Math.abs(o.y - a.y - 132) < 2) o.setVisible(false); }); } catch (e) {}
    M.elia = null;
    if (F.final) return;                                        // ya salió: en el altar no queda nadie
    const key = S.textures.exists('npc8_villager') ? 'npc8_villager' : 'ckc_princesa';
    const el = S.add.sprite(a.x + ALTAR.x, a.y + ALTAR.y, key).setOrigin(0.5, 1).setScale(key === 'npc8_villager' ? 1.55 : 1.15).setDepth(a.y + 160);
    if (key === 'npc8_villager' && S.anims.exists('npc8_idle')) el.play('npc8_idle');
    const g = S.add.graphics().setDepth(a.y + 161).setBlendMode(ADD());
    const z = S.add.zone(a.x + DOMO.x, a.y + ALTAR.y - 6, DOMO.rx * 2, 16); S.physics.add.existing(z, true); S.interiorObstacles.add(z);
    M.objs.push(el, g, z);
    M._fin.elia = el; M._fin.domo = g; M._fin.domoZ = z;
  };
  const pintarDomo = (S, t) => {
    const M = S._mz, U = M._fin, g = U.domo; if (!g || !g.active) return;
    const a = M.a, cx = a.x + DOMO.x, cy = a.y + DOMO.y, k = U.romper ? U.romper.k : 1;
    g.clear(); if (k <= 0) return;
    const late = 0.75 + 0.25 * Math.sin(t / 260);
    g.fillStyle(0xd06aff, 0.12 * late * k).fillEllipse(cx, cy, DOMO.rx * 2, DOMO.ry * 2);
    g.lineStyle(2, 0xe8a0ff, 0.75 * late * k).strokeEllipse(cx, cy, DOMO.rx * 2, DOMO.ry * 2);
    g.lineStyle(1, 0xffd0ff, 0.35 * k);
    for (let i = 0; i < 6; i++) {                               // la trama de energía que gira
      const an = t / 900 + i * Math.PI / 3, x = cx + Math.cos(an) * DOMO.rx * 0.85, y = cy + Math.sin(an) * DOMO.ry * 0.3;
      g.lineBetween(x, cy - DOMO.ry * 0.92, x, cy + DOMO.ry * 0.92 * Math.abs(Math.cos(an)) * 0.2 + y - cy);
    }
    for (let i = 0; i < 4; i++) { const an = t / 400 + i * 1.7; g.fillStyle(0xfff0ff, 0.8 * k).fillRect(cx + Math.cos(an) * DOMO.rx - 1, cy + Math.sin(an * 1.3) * DOMO.ry - 1, 2, 2); }
  };

  // ================================================================== las escenas y las peleas
  const jefeVivo = (S, tipo) => S.enemies && S.enemies.getChildren().find(e => vivo(e) && e.type === tipo);
  const aparecerBrujo = S => {
    const M = S._mz, a = M.a, F = fl(S), es = E(), U = M._fin;
    if (U.escena) return; U.escena = 'brujo';
    const pelear = () => {
      if (!aqui(S) || jefeVivo(S, BRUJO)) return;
      const e = S.spawnEnemy(a.x + CENTRO.x, a.y + CENTRO.y - 30, BRUJO);
      if (e) { e._mz = true; e.zone = Z; e._tp = S.time.now + 7000; S.time.delayedCall(500, () => vivo(e) && S.alertEnemy(e)); }
      U.escena = null;
    };
    const humo = (x, y, n) => { for (let i = 0; i < (n || 22); i++) { const c = S.add.circle(x + R(-16, 16), y + R(-26, 6), R(3, 7), Math.random() < 0.6 ? 0x6a2a9a : 0x2a0f3a, 0.85).setDepth(y + 60);
      S.tweens.add({ targets: c, x: c.x + R(-30, 30), y: c.y - R(10, 40), scale: R(1.6, 2.6), alpha: 0, duration: R(600, 1100), onComplete: () => c.destroy() }); } };
    if (!es || !es.correr) { pelear(); return; }
    es.correr(S, async () => {
      await es.camara(S, 720, 170, 900);
      S.cameras.main.shake(600, 0.004); son('ck_demonio_rugido', 0.5, { rate: 0.6 });
      if (U.elia) await es.globo(S, U.elia, '¡Cuidado! ¡Él está acá!', 1800, 50);
      son('ck_portal_abre', 0.6, { rate: 1.4 }) || son('necro_cast', 0.7);
      humo(a.x + CENTRO.x, a.y + CENTRO.y, 30);
      const k = S.textures.exists(BRUJO + '_idle') ? BRUJO + '_idle' : null;
      const b = k ? S.add.sprite(a.x + CENTRO.x, a.y + CENTRO.y - 30, k).setScale(ENEMY_TYPES[BRUJO].scale).setDepth(a.y + CENTRO.y + 30).setAlpha(0) : null;
      if (b) { if (S.anims.exists(k)) b.play(k); b.setFlipX(S.player.x < b.x); S.tweens.add({ targets: b, alpha: 1, duration: 600 }); }
      await es.esperar(800);
      await es.dialogo(S, N_BRUJO, ['Así que el perro del Rey llegó hasta el Sello…', 'La sangre de la niña ya abrió la primera grieta. Cuando el domo se cierre del todo, el Amo despierta.', 'Y vos no vas a estar para verlo.'], BRUJO + '_idle');
      if (b) { humo(b.x, b.y + 30, 14); b.destroy(); }
      es.seguir(S);
    }).then(pelear).catch(pelear);
  };
  // el brujo se esfuma y aparece en otro lado de la arena
  const teletransporte = (S, b) => {
    const M = S._mz, a = M.a;
    let x = 0, y = 0;
    for (let i = 0; i < 12; i++) { x = a.x + R(ARENA[0] + 30, ARENA[2] - 30); y = a.y + R(ARENA[1] + 60, ARENA[3] - 10); if (!S.navIsFree || S.navIsFree(x, y)) break; }
    const puff = (px, py) => { for (let i = 0; i < 16; i++) { const c = S.add.circle(px + R(-12, 12), py + R(-20, 8), R(3, 6), 0x5a1f8a, 0.8).setDepth(py + 60);
      S.tweens.add({ targets: c, y: c.y - R(10, 30), scale: 2, alpha: 0, duration: R(500, 800), onComplete: () => c.destroy() }); } };
    puff(b.x, b.y + 20); son('necro_cast', 0.5, { rate: 1.3 });
    b.setAlpha(0);
    try { b.body.reset(x, y); } catch (e) { b.setPosition(x, y); }
    S.time.delayedCall(250, () => { if (!vivo(b)) return; puff(b.x, b.y + 20); S.tweens.add({ targets: b, alpha: 1, duration: 250 }); });
  };
  const aparecerDemonio = S => {
    const M = S._mz, a = M.a, es = E(), U = M._fin;
    if (U.escena === 'demonio') return; U.escena = 'demonio';
    cargarDemonio(S);
    const pelear = () => {
      if (!aqui(S) || jefeVivo(S, DEMONIO)) return;
      if (!ENEMY_TYPES[DEMONIO]) { S.time.delayedCall(300, pelear); return; }
      const e = S.spawnEnemy(a.x + CENTRO.x, a.y + CENTRO.y - 20, DEMONIO);
      if (e) { e._mz = true; e.zone = Z; e._esp = S.time.now + 6000; e._espN = 0; S.time.delayedCall(500, () => vivo(e) && S.alertEnemy(e)); }
      U.escena = null;
    };
    if (!es || !es.correr) { S.time.delayedCall(1500, pelear); return; }
    es.correr(S, async () => {
      await es.esperar(900);
      await es.camara(S, 720, 120, 900);
      for (let i = 0; i < 3; i++) { S.cameras.main.flash(180, 255, 40, 30); S.cameras.main.shake(350, 0.006 + i * 0.003); son('ck_derrumbe', 0.6 + i * 0.15); await es.esperar(520); }
      son('ck_demonio_rugido', 1, { rate: 0.55 });
      const k = S.textures.exists(DEMONIO + '_idle') ? DEMONIO + '_idle' : null;
      const d = k ? S.add.sprite(a.x + 720, a.y + 120, k).setScale(DEF_DEMONIO.scale * 0.4).setDepth(a.y + 250).setAlpha(0) : null;
      try { T.chispas(S, a.x + 720, a.y + 110, 30, 0xff5020, 80); } catch (e) {}
      if (d) {
        if (S.anims.exists(k)) d.play(k);
        await new Promise(r => S.tweens.add({ targets: d, alpha: 1, scale: DEF_DEMONIO.scale, y: a.y + CENTRO.y - 20, duration: 1400, ease: 'Quad.easeOut', onComplete: r }));
      }
      S.cameras.main.shake(700, 0.012); son('ck_pisoton_jefe', 1) || son('ck_derrumbe_pesado', 0.9);
      await es.dialogo(S, N_DEMONIO, ['Mil años encerrado detrás de esta piedra…', '¿Y el Reino me manda a un solo guerrero? Qué ofensa.', 'Primero tu alma. Después… la de ella.'], DEMONIO + '_idle');
      if (d) d.destroy();
      es.seguir(S);
    }).then(pelear).catch(pelear);
  };
  // los golpes especiales de Azrath
  const marca = (S, x, y, r, ms) => {
    const g = S.add.ellipse(x, y, r * 2, r * 1.24).setStrokeStyle(2, 0xff4020, 0.95).setFillStyle(0xff3010, 0.18).setDepth(y - 1);
    S.tweens.add({ targets: g, scaleX: 0.85, scaleY: 0.85, alpha: { from: 0.5, to: 1 }, duration: ms, onComplete: () => g.destroy() });
  };
  const golpeFuego = (S, n) => { const pu = S.parryUntil; S.parryUntil = 0; try { S.damagePlayer(n); } catch (e) {} S.parryUntil = pu; };
  const lluvia = (S, e) => {
    e.isAttacking = true; e.setVelocity && e.setVelocity(0, 0);
    if (S.anims.exists(DEMONIO + '_attack1')) e.play(DEMONIO + '_attack1', true);
    son('ck_demonio_rugido', 0.6, { rate: 0.8 });
    const p = pies(S), pts = [[p.x, p.y]];
    for (let i = 0; i < 4; i++) pts.push([p.x + R(-120, 120), p.y + R(-70, 70)]);
    pts.forEach(([x, y]) => marca(S, x, y, 26, 1100));
    S.time.delayedCall(1100, () => {
      pts.forEach(([x, y], i) => {
        const b = S.add.circle(x, y - 170, 7, 0xffa040, 1).setDepth(30000).setBlendMode(ADD());
        S.tweens.add({ targets: b, y: y - 4, duration: 200, delay: i * 50, ease: 'Quad.easeIn', onComplete: () => {
          b.destroy(); try { T.chispas(S, x, y, 10, 0xff6020, 30); T.polvo(S, x, y, 8, 0x3a2420); } catch (er) {}
          son('fireball', 0.4, { rate: 0.8 }) || son('ck_piedra', 0.4);
          const q = pies(S); if (!S.isDashing && Math.hypot((q.x - x) / 26, (q.y - y) / 16) < 1) golpeFuego(S, 1);
        } });
      });
    });
    S.time.delayedCall(1500, () => { if (vivo(e)) { e.isAttacking = false; if (S.anims.exists(DEMONIO + '_idle')) e.play(DEMONIO + '_idle', true); } });
  };
  const onda = (S, e) => {
    e.isAttacking = true; e.setVelocity && e.setVelocity(0, 0);
    if (S.anims.exists(DEMONIO + '_attack1')) e.play(DEMONIO + '_attack1', true);
    const cx = e.body.center.x, cy = e.body.bottom - 2;
    marca(S, cx, cy, 44, 650);
    son('ck_demonio_rugido', 0.8, { rate: 0.6 });
    S.time.delayedCall(650, () => {
      if (!vivo(e)) return;
      S.cameras.main.shake(400, 0.008); son('ck_pisoton_jefe', 0.9) || son('ck_derrumbe', 0.8);
      const ring = S.add.ellipse(cx, cy, 20, 12).setStrokeStyle(6, 0xff6020, 0.95).setDepth(9).setBlendMode(ADD()), k = { r: 10 };
      let pego = false;
      S.tweens.add({ targets: k, r: 210, duration: 1000, ease: 'Sine.easeOut', onUpdate: () => {
        ring.setDisplaySize(k.r * 2, k.r * 1.24); ring.setAlpha(1 - k.r / 240);
        const p = pies(S), d = Math.hypot(p.x - cx, (p.y - cy) / 0.62);
        if (!pego && !S.isDashing && Math.abs(d - k.r) < 10) { pego = true; golpeFuego(S, 1); }
      }, onComplete: () => ring.destroy() });
      S.time.delayedCall(700, () => { if (vivo(e)) { e.isAttacking = false; if (S.anims.exists(DEMONIO + '_idle')) e.play(DEMONIO + '_idle', true); } });
    });
  };
  // el final: se rompe el domo, Elia sale y vuelve el portal
  const finale = S => {
    const M = S._mz, a = M.a, F = fl(S), U = M._fin, es = E();
    if (U.escena === 'final' || F.final) return; U.escena = 'final';
    const cerrar = () => {
      F.final = 1; guardar(S);
      try { if (U.domoZ) { U.domoZ.body.enable = false; S.interiorObstacles.remove(U.domoZ); U.domoZ.destroy(); } } catch (e) {}
      M.portal.oculto = false; F.portalCerrado = 0;
      salida(S);
      S.showZoneTitle && S.showZoneTitle('El Sello ha caído', 'Elia está a salvo');
      try { T.nota('El portal de Oswin volvió a abrirse abajo, en la llegada: lleva de vuelta al Camino al Castillo'); } catch (e) {}
      S.updateObjective && S.updateObjective();
    };
    const romper = () => {
      U.romper = { k: 1 };
      son('ck_vidrio', 0.8) || son('magic_cast', 0.8, { rate: 0.6 });
      S.cameras.main.flash(300, 230, 160, 255);
      for (let i = 0; i < 26; i++) {
        const an = R(0, Math.PI * 2), x = a.x + DOMO.x + Math.cos(an) * DOMO.rx, y = a.y + DOMO.y + Math.sin(an) * DOMO.ry;
        const s = S.add.rectangle(x, y, R(2, 5), R(2, 4), 0xe8a0ff, 0.9).setDepth(a.y + 170).setBlendMode(ADD()).setAngle(R(0, 90));
        S.tweens.add({ targets: s, x: x + Math.cos(an) * R(20, 60), y: y + Math.sin(an) * R(10, 40) + 20, alpha: 0, duration: R(500, 900), onComplete: () => s.destroy() });
      }
      S.tweens.add({ targets: U.romper, k: 0, duration: 500 });
    };
    if (!es || !es.correr) { romper(); cerrar(); return; }
    es.correr(S, async () => {
      await es.esperar(1600);
      await es.camara(S, DOMO.x, DOMO.y + 20, 900);
      romper();
      await es.esperar(700);
      const el = U.elia;
      if (el && el.active) {
        const p = pies(S), tx = Math.max(a.x + 650, Math.min(a.x + 790, p.x + (p.x < el.x ? 26 : -26))), ty = a.y + 200;
        if (S.anims.exists('npc8_walk')) el.play('npc8_walk', true);
        el.setFlipX(tx < el.x);
        await new Promise(r => S.tweens.add({ targets: el, x: tx, y: ty, duration: 1200, onUpdate: () => el.setDepth(el.y), onComplete: r }));
        if (S.anims.exists('npc8_idle')) el.play('npc8_idle', true);
        el.setFlipX(S.player.x < el.x);
      }
      await es.dialogo(S, 'Princesa Elia', ['¡Lo venciste!… Pensé que me iba a quedar acá para siempre.',
        'Ese brujo repetía que mi sangre abre el Sello. Que alguien me trajo hasta acá a propósito… alguien del castillo.',
        'Sacame de acá. Hay alguien que tiene que dar muchas explicaciones.'], 'npc8_villager');
      es.seguir(S);
    }).then(cerrar).catch(cerrar);
  };
  // el portal de vuelta, en la llegada
  const salida = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a) return;
    a.exits = a.exits || [];
    if (!a.exits.some(e => e.to === 'mz_salida')) a.exits.push({ x: MZ.PORTAL.x - 30, y: MZ.PORTAL.y - 6, w: 60, h: 26, key: 'walk', to: 'mz_salida', hint: '◆ El portal de Oswin' });
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'mz_salida' && !this._doorTransition && this.ckEntrar) {
      this.ckEntrar('camino_al_castillo', { x: 1189, y: 470 });
      this.time.delayedCall(1900, () => this.player && this.showZoneTitle && this.showZoneTitle('De vuelta en el Reino', 'Elia está a salvo'));
      return;
    }
    return cambiar0.apply(this, arguments);
  };

  // ================================================================== cada cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const S = this, M = S._mz;
      if (!M || !aqui(S) || !S.player || !S.gameStarted) return r;
      if (!M._fin) armar(S);
      const U = M._fin, F = fl(S), a = M.a, now = S.time.now;
      pintarDomo(S, now);
      if (F.final) { if (!U.salida) { U.salida = 1; salida(S); } return r; }
      const p = pies(S), q = { x: p.x - a.x, y: p.y - a.y };
      const enArena = q.x > ARENA[0] && q.x < ARENA[2] && q.y > ARENA[1] && q.y < ARENA[3];
      if (S.dialogOpen || S._ckEscena || S.isDead) return r;
      // las peleas, en orden: el brujo, el demonio, el final
      if (enArena && F.reja && !F.brujo && !U.escena && !jefeVivo(S, BRUJO)) aparecerBrujo(S);
      if (F.brujo && !F.demonio && !U.escena && !jefeVivo(S, DEMONIO) && enArena) aparecerDemonio(S);
      const b = jefeVivo(S, BRUJO);
      if (b && now > (b._tp || 0) && !b.isAttacking && b.state === 'chase') { b._tp = now + R(8000, 11000); teletransporte(S, b); }
      const d = jefeVivo(S, DEMONIO);
      if (d && now > (d._esp || 0) && !d.isAttacking && d.state === 'chase') {
        d._esp = now + (d.phase2 ? R(5000, 6500) : R(7000, 9000));
        (d._espN++ % 2 ? onda : lluvia)(S, d);
      }
    } catch (e) { if (!P._mzFinErr) { P._mzFinErr = 1; console.warn('[mazmorra final]', e); } }
    return r;
  };
  // al caer cada uno
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const jefe = enemy && (enemy.type === BRUJO || enemy.type === DEMONIO) && aqui(this) ? enemy.type : null;
    this._mzJefeCae = jefe;
    let r;
    try { r = ve0 ? ve0.apply(this, arguments) : undefined; } finally { this._mzJefeCae = null; }
    try {
      if (jefe === BRUJO) {
        fl(this).brujo = 1; guardar(this);
        const S = this, U = S._mz && S._mz._fin, suelta = () => { if (S._mz && S._mz._fin && S._mz._fin.escena === 'muere') S._mz._fin.escena = null; };
        if (U) U.escena = 'muere';                               // el demonio sale después de sus últimas palabras
        this.time.delayedCall(1300, () => {
          if (!aqui(S)) { suelta(); return; }
          const es = E();
          if (es && es.correr) es.correr(S, async () => {
            await es.dialogo(S, N_BRUJO, ['Je… je… Llegaste tarde, perro del Rey…', 'La sangre de la niña ya alimentó el Sello… ¡AMO, DESPERTÁ!'], BRUJO + '_idle');
          }).then(suelta).catch(suelta);
          else suelta();
        });
      }
      if (jefe === DEMONIO) { fl(this).demonio = 1; guardar(this); this.time.delayedCall(800, () => aqui(this) && finale(this)); }
    } catch (e) { console.warn('[mazmorra final]', e); }
    return r;
  };
  // los carteles del juego que eran del Nigromante
  const zt0 = P.showZoneTitle;
  P.showZoneTitle = function (t, sub) {
    if (this._mzJefeCae && t === 'El Nigromante ha caído') {
      return zt0.call(this, this._mzJefeCae === BRUJO ? 'Malakar ha caído' : 'Azrath ha caído', this._mzJefeCae === BRUJO ? 'El Sello se raja del todo…' : 'El Rey Demonio vuelve a la oscuridad');
    }
    return zt0.apply(this, arguments);
  };
  const ft0 = P.createFloatingText;
  P.createFloatingText = function (x, y, txt) {
    if (txt === '¡LA NIEBLA SE CIERRA!' && aqui(this)) arguments[2] = jefeVivo(this, DEMONIO) ? '¡AZRATH ARDE DE FURIA!' : '¡EL BRUJO LLAMA AL SELLO!';
    return ft0.apply(this, arguments);
  };
  // el objetivo, adentro de la mazmorra
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0 ? ob0.apply(this, arguments) : undefined;
    try {
      if (!aqui(this)) return r;
      const F = fl(this), box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text'); if (!t) return r;
      const n = window.CK_MZ_RUNAS ? CK_MZ_RUNAS.ORDEN.filter(k => (CK_MZ_RUNAS.runas(this)[k] || 0) >= 1).length : 0;
      t.textContent = F.final ? 'Mazmorra del Sello: volvé con Elia por el portal de Oswin (abajo)'
        : F.brujo ? 'Mazmorra del Sello: vencé a Azrath, el Rey Demonio'
        : F.reja ? 'Mazmorra del Sello: subí por las baldosas hasta el Sello y rescatá a Elia'
        : `Mazmorra del Sello: reuní las siete runas del portón de huesos (${n}/7)`;
    } catch (e) {}
    return r;
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () { const r = ms0 ? ms0.apply(this, arguments) : undefined; try { if (aqui(this)) { cargarDemonio(this); this.time.delayedCall(400, () => this.updateObjective && this.updateObjective()); } } catch (e) {} return r; };
  window.CK_MZ_FINAL = { BRUJO, DEMONIO, aparecerBrujo, aparecerDemonio, finale, lluvia, onda, cargarDemonio };
})();
