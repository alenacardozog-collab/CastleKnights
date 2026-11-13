'use strict';
/* La batalla de las Tierras Orcas (12/11, pedido del dueño: "hacé que la batalla contra los orcos sea masiva, soldados contra
   orcos, pero que los orcos sean más, y que el Capitán Bruno nos ayude; el jefe de esa batalla es el orco que tiene escudo,
   que aparezca cuando llevemos 300 orcos liquidados; cuando peleemos, él se retira, y llegando casi a los 500 pasa que
   Bruno está herido y nos retiramos").
   Reemplaza el paso 4 del Capítulo 2 ("vencé a los orcos que vigilan el camino") cuando se llega a las Tierras Orcas:
   - El Capitán Bruno (el caballero) y diez soldados del reino forman la línea en el camino del oeste y el de abajo
     (templarios, lanceros, hacheros y dos arqueros). Pelean solos con el sistema de los guardias (se caen y se levantan).
     Cada tanto llegan dos soldados más desde el sur, si quedan pocos en pie.
   - Los orcos bajan sin parar desde el norte y el este (orcos, acorazados, de élite y algún jinete), siempre más que los
     soldados: 14 a la vez al principio y hasta 22 al final. La mitad va por los soldados y la mitad por el héroe.
   - Arriba, la cuenta: "ORCOS CAÍDOS" (cuentan los del héroe y los de los soldados). Se guarda en la partida.
   - A los 300: suena el cuerno y baja GORVAK, el campeón del escudo (el del Coliseo, con su muro de escudo, su salto y su
     cuchilla). Cuando le sacás casi la mitad de la vida (o al minuto), levanta el escudo, se ríe y se retira por el norte:
     "te espero en la arena".
   - A los 480: a Bruno le dan; cae herido. "¡Retirada!": la pantalla se oscurece, los soldados se lo llevan y el héroe
     queda a la entrada de las Tierras. El capítulo sigue (paso 5: el Pueblo Orco y Gorak).
   Va después de ck_capitulo2.js, ck_coliseo.js y ck_ajustes_juego.js. Borrar su línea de index.html vuelve al paso 4 de antes (4 orcos). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype, ID = 'tierras_orcas', Z = 'ed_' + ID + '.main';
  if (!INTERIOR_LAYOUTS['ed_' + ID]) return;
  const GORVAK_EN = 300, FIN_EN = 480;
  const VIVOS = [14, 22];
  const ESCALA_SOLDADO = 1.2;
  // la línea del reino (coordenadas del mapa): [guardia, x, y]
  const SOLDADOS = [['templar', 252, 330], ['lancer', 292, 296], ['axeman', 230, 380], ['templar', 300, 432], ['lancer', 360, 452],
    ['axeman', 370, 430], ['templar', 206, 424], ['lancer', 262, 462], ['archer', 160, 384], ['archer', 182, 452]];
  const BRUNO = { x: 244, y: 404 };
  const ENTRAN = [[880, 140], [760, 112], [470, 64], [870, 252], [620, 72], [300, 64]];
  const SUR = [198, 520];
  const LLEGADA = { x: 198, y: 496 };
  const MEZCLA = [['orc', 62], ['orc_armored', 20], ['orc_elite', 12], ['orc_rider', 6]];
  const azar = (a, b) => a + Math.random() * (b - a);
  const uno = l => l[Math.floor(Math.random() * l.length)];
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const fl = S => { const s = S.story; if (!s) return null; s.flags = s.flags || {}; return s.flags; };
  const B = S => { const f = fl(S); if (!f) return { n: 0 }; return (f.batalla_orca = f.batalla_orca || { n: 0, g: 0, fin: 0 }); };
  const activa = S => { const f = fl(S); return !!f && (f.c2 || 0) === 4 && !B(S).fin; };
  const aqui = S => !!(S.currentZoneKey && S.currentZoneKey() === Z && S.currentInterior && S.currentInterior.area);
  const globo = (S, o, t, ms) => { try { if (window.CK_ESCENA && CK_ESCENA.globo) return CK_ESCENA.globo(S, o, t, ms || 2400, 46); } catch (e) {} S.createFloatingText(o.x, o.y - 50, t, 0xfde68a); };

  // ------------------------------------------------------------------ la línea del reino (actores del área: pelean solos)
  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    try {
      const S = window.activeGameScene || (window.game && game.scene.scenes.find(s => s.startCampaign));
      if (a && S && activa(S)) {
        a.actors = a.actors || [];
        SOLDADOS.forEach(([g, x, y]) => a.actors.push(soldado(g, x, y)));
        a.actors.push(Object.assign(soldado('knight', BRUNO.x, BRUNO.y), { lines: ['¡Mantengan la línea!', '¡Por el Rey y por el Roble!', '¡No retrocedan!'] }));
      }
    } catch (e) { console.warn('[batalla]', e); }
    return r;
  };
  function soldado(g, x, y) {
    return { type: 'walker', key: 'g_' + g + '_idle', idle: 'g_' + g + '_idle', walk: 'g_' + g + '_walk', scale: ESCALA_SOLDADO, speed: 30,
      pts: [[x, y, 600000], [x + 1, y, 600000]], lines: ['¡Por el Rey!', '¡Son demasiados!', '¡Aguanten!', '¡Otro más!'] };
  }
  const brunoDe = S => ((S.currentInterior.area.actors) || []).find(t => t.sprite && t.sprite.active && t.sprite.texture && t.sprite.texture.key === 'g_knight_idle');
  const soldadosDe = S => ((S.currentInterior.area.actors) || []).filter(t => t.role === 'guard' || t.role === 'archer');
  // dos soldados más desde el sur (un actor nuevo, igual que los del área)
  const refuerzo = (S, g, px, py) => {
    const a = S.currentInterior.area, x = a.x + SUR[0] + azar(-14, 14), y = a.y + SUR[1];
    const key = 'g_' + g + '_idle'; if (!S.textures.exists(key)) return;
    const sp = S.add.sprite(x, y, key).setOrigin(0.5, 1).setScale(ESCALA_SOLDADO).setDepth(y);
    if (S.anims.exists(key)) sp.play(key);
    const act = { type: 'walker', sprite: sp, pts: [[a.x + px, a.y + py, 600000], [a.x + px + 1, a.y + py, 600000]], i: 0, wait: 0, speed: 30,
      idle: key, walk: 'g_' + g + '_walk', lines: ['¡Llegamos!', '¡Refuerzos del Roble!'], talkAt: 0, moving: false, role: S.actorRole(key), hp: 5, maxHp: 5 };
    a.actors.push(act);
    if (Array.isArray(S.currentInterior.objects)) S.currentInterior.objects.push(sp);
    if (S._ckBat) S._ckBat.extra.push(sp);
  };

  // ------------------------------------------------------------------ los orcos
  const tipoOrco = () => { let r = Math.random() * 100; for (const [t, w] of MEZCLA) { if ((r -= w) <= 0 && typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[t]) return t; } return 'orc'; };
  const vivosBatalla = S => S.enemies ? S.enemies.getChildren().filter(e => vivo(e) && e._ckBatalla).length : 0;
  const entrada = S => {
    const a = S.currentInterior.area, cam = S.cameras.main.worldView;
    const libres = ENTRAN.map(([x, y]) => [a.x + x, a.y + y]).filter(([x, y]) => !S.navIsFree || S.navIsFree(x, y));
    const fuera = libres.filter(([x, y]) => !Phaser.Geom.Rectangle.Contains(cam, x, y));
    return uno(fuera.length ? fuera : libres);
  };
  const traerOrco = (S, tipo, punto) => {
    const p = punto || entrada(S); if (!p) return null;
    const e = S.spawnEnemy(p[0] + azar(-10, 10), p[1] - 26 + azar(-6, 6), tipo || tipoOrco()); if (!e) return null;
    e.zone = S.currentInterior.area.key; e._ckBatalla = true; e._ckAullo = true; e._ckRefuerzo = true;   // (no llaman refuerzos: ya son muchos)
    e.home = { x: p[0], y: p[1] };
    if (Math.random() < 0.5) {
      const ss = soldadosDe(S).filter(t => !t.down && t.sprite.active);
      if (ss.length) { let m = null, md = 1e9; ss.forEach(t => { const d = Phaser.Math.Distance.Between(e.x, e.y, t.sprite.x, t.sprite.y); if (d < md) { md = d; m = t; } }); e._target = m; }
    }
    S.time.delayedCall(100, () => { if (vivo(e) && S.alertEnemy) S.alertEnemy(e); });
    return e;
  };

  // ------------------------------------------------------------------ Gorvak, el del escudo
  const gorvak = S => {
    const b = B(S); b.g = 1; S.saveStory && S.saveStory();
    son('ck_cuerno_orco', 1) || son('warg_howl', 0.8, { rate: 0.6 });
    S.cameras.main.shake(700, 0.008);
    const tipo = (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.orc_campeon) ? 'orc_campeon' : 'orc_elite';
    const a = S.currentInterior.area, e = traerOrco(S, tipo, [a.x + 880, a.y + 140]); if (!e) { b.g = 0; return; }
    e._target = null; e._ckGorvak = S.time.now;
    if (tipo !== 'orc_campeon') { e.hp = e.maxHp = 30; e.setScale(e.scaleX * 1.5).setTint(0x9aa4b2); }
    S.createFloatingText(S.player.x, S.player.y - 70, '¡GORVAK, EL DEL ESCUDO!', 0xff6b6b);
    const br = brunoDe(S); if (br) S.time.delayedCall(900, () => globo(S, br.sprite, '¡Cuidado! ¡Es el campeón de la arena!', 2600));
  };
  const retirarGorvak = (S, e) => {
    if (e._ckSeVa) return; e._ckSeVa = true;
    B(S).g = 2; S.saveStory && S.saveStory();
    if (e._ckc) e._ckc.ocupado = true;
    e._ckIntangible = true; e.state = 'ck_retira'; e.isAttacking = false; e.setVelocity && e.setVelocity(0, 0);
    if (e.body) e.body.enable = false;
    if (S.anims.exists(e.type + '_block')) e.play(e.type + '_block', true);
    globo(S, e, '¡Ja! Esto no termina acá, humanito… Te espero en la arena', 3200);
    const a = S.currentInterior.area, sale = [a.x + 900, a.y + 110];
    S.time.delayedCall(1400, () => {
      if (!e.active) return;
      if (S.anims.exists(e.type + '_walk')) e.play(e.type + '_walk', true);
      e.setFlipX(sale[0] < e.x);
      const d = Phaser.Math.Distance.Between(e.x, e.y, sale[0], sale[1]);
      S.tweens.add({ targets: e, x: sale[0], y: sale[1], duration: Math.max(1200, d / 80 * 1000), onUpdate: () => { e.setDepth(e.y + 26); if (e.hpBar) e.hpBar.setVisible(false); },
        onComplete: () => S.tweens.add({ targets: e, alpha: 0, duration: 500, onComplete: () => { try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} } }) });
    });
    S.time.delayedCall(2600, () => { const br = brunoDe(S); if (br) globo(S, br.sprite, '¡Se va! ¡No aflojen, que siguen bajando!', 2600); });
  };

  // ------------------------------------------------------------------ el final: Bruno herido, retirada
  const final = S => {
    const b = B(S); if (b.fin || !S._ckBat || S._ckBat.final) return;
    S._ckBat.final = true;
    const br = brunoDe(S);
    if (br) {
      br.down = true; br.downUntil = S.time.now + 1e9; br.fight = null;
      br.sprite.setTint(0xd68a8a); S.tweens.add({ targets: br.sprite, angle: br.sprite.flipX ? 80 : -80, duration: 300 });
      S.createFloatingText(br.sprite.x, br.sprite.y - 46, '¡Me dieron!', 0xfca5a5);
    }
    son('ck_f_garra_cae', 0.5) || son('sword_hit', 0.8, { rate: 0.6 });
    S.time.delayedCall(1200, () => {
      const fin = () => {
        S.cameras.main.fadeOut(700, 0, 0, 0);
        S.time.delayedCall(750, () => {
          (S.enemies ? S.enemies.getChildren() : []).filter(e => e._ckBatalla).forEach(e => { try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} });
          b.fin = 1;
          const f = fl(S); f.c2 = 5; f.c2n = 0;
          S.story.coins = (S.story.coins || 0) + 60; try { S.gainXP && S.gainXP(150); } catch (e) {}
          S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
          quitarHud();
          // los soldados se llevan a Bruno: se van de la línea; el héroe queda a la entrada de las Tierras
          const a = S.currentInterior.area;
          a.actors = (a.actors || []).filter(t => { if (t.role === 'guard' || t.role === 'archer') { try { t.sprite.destroy(); } catch (e) {} return false; } return true; });
          limpiar(S);
          try { if (S.placePlayerFeetAt) S.placePlayerFeetAt(a.x + LLEGADA.x, a.y + LLEGADA.y); else S.player.setPosition(a.x + LLEGADA.x, a.y + LLEGADA.y); } catch (e) {}
          S.time.delayedCall(400, () => { try { S.cameras.main.resetFX(); S.cameras.main.fadeIn(600, 0, 0, 0); } catch (e) {} });
          S.time.delayedCall(2600, () => {
            S.createFloatingText(S.player.x, S.player.y - 56, 'LA LÍNEA RESISTIÓ · ' + b.n + ' ORCOS', 0xfde68a);
            if (S.openDialog) S.openDialog('Soldado del Roble', [
              'Lo sacamos a tiempo. El Capitán va a vivir… pero esa flecha negra no era orca: era de ballesta, de las nuestras.',
              'Nos llevamos a Bruno al castillo. Él dijo que vos sigas: que busques a Mira en el Pueblo Orco, al este.',
              'Y que tengas cuidado con el del escudo. Ese no pelea como los demás.'
            ], null, 'g_templar_idle');
          });
        });
      };
      if (S.openDialog) S.openDialog('Capitán Bruno', ['¡Argh! Me… me alcanzó una flecha negra…', '¡Son demasiados! ¡RETIRADA! ¡A la empalizada del sur!',
        '(Los soldados levantan al Capitán y retroceden. Cubrís la retirada hasta la entrada de las Tierras.)'], fin, 'g_knight_idle');
      else fin();
    });
  };

  // ------------------------------------------------------------------ la cuenta en pantalla
  const hud = () => {
    let d = document.getElementById('ck-batalla');
    if (!d) {
      d = document.createElement('div'); d.id = 'ck-batalla';
      d.style.cssText = "position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:45;pointer-events:none;padding:5px 16px 4px;" +
        "font:700 18px 'CK Grenze','Grenze',Georgia,serif;letter-spacing:2px;color:#f3e6c8;background:rgba(20,12,8,.82);border:2px solid #8a6a3a;" +
        "box-shadow:0 0 0 2px #1b0f0a,0 4px 0 rgba(0,0,0,.4);text-shadow:0 2px 0 #1b0f0a;text-align:center;white-space:nowrap";
      (document.getElementById('game-wrapper') || document.body).appendChild(d);   // con el resto del HUD (encima del juego)
    }
    return d;
  };
  const quitarHud = () => { const d = document.getElementById('ck-batalla'); if (d) d.remove(); };
  const pintarHud = S => {
    const b = B(S), d = hud();
    const meta = b.g ? (b.g === 1 ? ' · ¡GORVAK!' : '') : '';
    d.innerHTML = '⚔ ORCOS CAÍDOS <span style="color:#fca5a5">' + b.n + '</span>' + meta;
  };

  // los soldados que llegaron de refuerzo y el nombre de Bruno no son del área: se borran al irse
  const limpiar = S => { const B2 = S._ckBat; if (!B2) return; (B2.extra || []).concat(B2.nombre ? [B2.nombre] : []).forEach(o => { try { o.destroy(); } catch (e) {} }); S._ckBat = null; };
  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      if (!aqui(S) || S._gameMode !== 'campaign' || !activa(S)) { if (S._ckBat) { limpiar(S); quitarHud(); } return r; }
      const a = S.currentInterior.area, now = S.time.now, b = B(S);
      if (!S._ckBat || S._ckBat.area !== a) {
        if (S._ckBat) limpiar(S);
        S._ckBat = { area: a, prox: now + 2500, refuerzo: now + 45000, extra: [], hablo: false };
        pintarHud(S);
        S.time.delayedCall(1200, () => {
          const br = aqui(S) && brunoDe(S);
          if (!br || !activa(S)) return;
          globo(S, br.sprite, b.n ? '¡Volviste! ¡Siguen bajando, a la línea!' : '¡Llegaste justo! ¡Bajan del norte! ¡Formen la línea, por el Rey!', 3000);
          if (!b.n) { son('ck_cuerno_orco', 0.8); S.cameras.main.shake(400, 0.004); }
        });
      }
      const B2 = S._ckBat;
      if (B2.final || S.dialogOpen || S.isDead || S._ckEscena) return r;
      if (b.n >= FIN_EN) { final(S); return r; }
      // Gorvak
      if (b.n >= GORVAK_EN && !b.g) gorvak(S);
      S.enemies.getChildren().forEach(e => {
        if (!vivo(e) || e._ckGorvak === undefined || e._ckSeVa) return;
        if (e.hp <= e.maxHp * 0.55 || now - e._ckGorvak > 60000) retirarGorvak(S, e);
      });
      // que nunca falten orcos (y siempre más que los soldados)
      if (now > B2.prox) {
        B2.prox = now + 650;
        const meta = Math.round(VIVOS[0] + (VIVOS[1] - VIVOS[0]) * Math.min(1, b.n / FIN_EN));
        if (vivosBatalla(S) < meta) traerOrco(S);
      }
      // los soldados no esperan a ver al orco: van por el más cercano (hasta 320 px), como si alguien los hubiera llamado
      if (now > (B2.mando || 0)) {
        B2.mando = now + 500;
        const orcos = S.enemies.getChildren().filter(e => vivo(e) && e.body && e._ckGorvak === undefined && /^orc/.test(e.type || ''));
        soldadosDe(S).forEach(t => {
          if (t.down || !t.sprite.active || (t.fight && vivo(t.fight.enemy))) return;
          let m = null, md = 320;
          orcos.forEach(e => { const d = Phaser.Math.Distance.Between(t.sprite.x, t.sprite.y, e.body.center.x, e.body.bottom); if (d < md) { md = d; m = e; } });
          if (m) { t.fight = { enemy: m, called: true }; t.hitAt = now + 350; }
        });
      }
      // refuerzos del reino: si quedan pocos en pie
      if (now > B2.refuerzo) {
        B2.refuerzo = now + 45000;
        const enPie = soldadosDe(S).filter(t => !t.down).length;
        if (enPie < 7) { const [g1, x1, y1] = uno(SOLDADOS), [g2, x2, y2] = uno(SOLDADOS); refuerzo(S, g1, x1, y1); refuerzo(S, g2, x2, y2); S.createFloatingText(S.player.x, S.player.y - 60, '¡Llegan refuerzos del Roble!', 0xbfdbfe); }
      }
      // el nombre de Bruno sobre su cabeza
      const br = brunoDe(S);
      if (br) {
        if (!B2.nombre || !B2.nombre.active) B2.nombre = S.add.text(0, 0, 'Capitán Bruno', { fontFamily: "'CK Grenze', serif", fontSize: '11px', fontStyle: 'bold', color: '#bfdbfe', stroke: '#0b111c', strokeThickness: 3 }).setOrigin(0.5).setDepth(30000);
        B2.nombre.setPosition(br.sprite.x, br.sprite.y - br.sprite.displayHeight * 0.62);
      }
    } catch (e) { if (!P._ckBatAv) { P._ckBatAv = 1; console.warn('[batalla]', e); } }
    return r;
  };
  // la cuenta: todos los orcos que caen en las Tierras durante la batalla (los del héroe y los de los soldados)
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    let cuenta = false;
    try {
      if (enemy && aqui(this) && activa(this) && /^orc/.test(enemy.type || '') && !enemy._ckContado) {
        enemy._ckContado = true; cuenta = true;
        fl(this).c2n = 0;                                   // el paso 4 viejo (4 orcos) no se cumple solo: lo cierra la batalla
      }
    } catch (e) {}
    const r = ve0 ? ve0.apply(this, arguments) : undefined;
    try {
      if (cuenta) {
        const b = B(this); b.n++;
        if (b.n % 10 === 0) this.saveStory && this.saveStory();
        pintarHud(this); this.updateObjective && this.updateObjective();
      }
    } catch (e) {}
    return r;
  };
  // ck_ajustes_juego.js no deja que los guardias salgan a pelear en la campaña (pedido viejo del dueño); en la batalla sí:
  // para los soldados de la línea, la rutina de los guardias corre como fuera de la campaña (sólo esa llamada)
  const da0 = P.updateActorDanger;
  if (da0) P.updateActorDanger = function (a) {
    if (a && (a.role === 'guard' || a.role === 'archer') && aqui(this) && activa(this) && this._gameMode === 'campaign') {
      this._gameMode = 'ck_batalla';
      try { return da0.apply(this, arguments); } finally { this._gameMode = 'campaign'; }
    }
    return da0.apply(this, arguments);
  };
  // el objetivo, mientras dura
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0.apply(this, arguments);
    try {
      if (activa(this)) { const box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text'); if (t) t.textContent = 'Tierras Orcas: resistí junto al Capitán Bruno (' + B(this).n + ' orcos caídos)'; }
    } catch (e) {}
    return r;
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () { const r = ms0 ? ms0.apply(this, arguments) : undefined; try { if (!aqui(this)) quitarHud(); } catch (e) {} return r; };
  window.CK_BATALLA_ORCA = { B, activa, GORVAK_EN, FIN_EN, SOLDADOS, ENTRAN };
})();
