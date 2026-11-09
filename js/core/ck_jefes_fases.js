'use strict';
/* Jefes con fases (07/11, pedido del dueño: "agregá todo eso"). Antes los tres peleaban igual de principio a fin (el
   Nigromante tenía una segunda fase genérica que también usaba Grushak, con el cartel "¡La niebla se cierra!").
   - EL NIGROMANTE: al 50 % (además de lo de siempre: tira más rápido y levanta más muertos) se vuelve INTANGIBLE mientras
     sus muertos estén en pie: los golpes lo atraviesan. Cuando cae el último (o a los 12 s), el velo se rompe y queda
     aturdido 2,5 s, con +50 % de daño. Al 20 % lo vuelve a hacer.
   - GRUSHAK, EL CAUDILLO: al 50 % se enfurece (rojo, 25 % más rápido, pega más seguido), llama a dos orcos y empieza a
     EMBESTIR como el jabalí (ck_roles.js), con más fuerza. Al 25 % suma el PISOTÓN: marca el piso alrededor en rojo
     durante 0,9 s y golpea todo lo que esté a menos de 80 px (2 corazones). Cada 7 s.
   - GARRA NEGRA (el hombre oso de la misión de Urso): al 50 % RUGE (te empuja lejos), llama a dos huargos y entra en
     frenesí: ataca 40 % más seguido.
   Borrar la línea de index.html vuelve a los jefes de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const hab = (k, v, o) => { const H = window.CK_SONIDOS; if (!H || !H.son) return false; H.son(k, v, o); return true; };   // clips de ElevenLabs (ck_sonidos_hab.js)
  const NIGRO = { cortes: [0.5, 0.2], maximo: 12000, aturde: 2500 };
  const GRUSHAK = { enojo: 0.5, pisoton: 0.25, cada: 7000, aviso: 900, radio: 80, dano: 2 };
  const GARRA = { enojo: 0.5 };

  const cartel = (S, e, txt, col) => { S.createFloatingText(e.x, e.y - 74, txt, col); S.cameras.main.shake(400, 0.009); };
  const llamar = (S, e, tipo, n) => {
    if (!ENEMY_TYPES[tipo]) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, m = S.spawnEnemy(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 50, tipo);
      if (!m) continue;
      if (S.placeEnemyClear && !S.placeEnemyClear(m)) { m.destroy(); continue; }
      m.zone = e.zone; S.time.delayedCall(200 + i * 150, () => vivo(m) && S.alertEnemy(m));
      if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', m.x, m.y + 20, 22, 380);
    }
  };

  // los que manejamos acá no usan la segunda fase genérica
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, type) {
    const e = se0.apply(this, arguments);
    try { if (e && (type === 'orc_warlord' || type === 'werebear_jefe')) { e.phase2 = true; e._ckFases = {}; } else if (e && type === 'necromancer') e._ckFases = {}; } catch (er) {}
    return e;
  };

  // intangible: los golpes no entran (salvo los que limpian el mapa)
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    if (enemy && !enemy.isDead && enemy._ckIntangible && amount < 10) {
      const now = this.time.now;
      if (now > (enemy._ckIntAviso || 0)) { enemy._ckIntAviso = now + 700; this.createFloatingText(enemy.x, enemy.y - 40, '¡INTANGIBLE!', 0xc4b5fd); son('necro_cast', 0.4, { rate: 1.6, minGap: 300 }); }
      return;
    }
    return de0.apply(this, arguments);
  };

  const nigromante = (S, e, now) => {
    const F = e._ckFases, frac = e.hp / e.maxHp, tipo = (e.def.summon && e.def.summon.type) || 'skeleton';
    NIGRO.cortes.forEach((c, i) => {
      if (F['velo' + i] || frac > c || e._ckIntangible) return;
      F['velo' + i] = true;
      e._ckIntangible = true; e._ckIntDesde = now; e._ckVioMuertos = false;
      cartel(S, e, '¡UN VELO DE NIEBLA LO CUBRE!', 0xc4b5fd);
      son('necro_cast', 0.8, { rate: 0.6 });
      llamar(S, e, tipo, 3);
    });
    if (!e._ckIntangible) return;
    e.setAlpha(0.45 + 0.15 * Math.sin(now / 120)); e.setTint(0xc4b5fd);
    const muertos = S.enemies.getChildren().filter(o => vivo(o) && o !== e && o.type === tipo).length;
    if (muertos) e._ckVioMuertos = true;
    if ((e._ckVioMuertos && !muertos && now - e._ckIntDesde > 1200) || now - e._ckIntDesde > NIGRO.maximo) {
      e._ckIntangible = false; e.setAlpha(1); e.clearTint();
      cartel(S, e, '¡EL VELO SE ROMPE!', 0xfde68a);
      son('necro_death', 0.6, { rate: 1.6 });
      if (window.CK_ROLES) CK_ROLES.aturdir(S, e, NIGRO.aturde);
    }
  };

  const grushak = (S, e, now) => {
    const F = e._ckFases, frac = e.hp / e.maxHp;
    if (!F.enojo && frac <= GRUSHAK.enojo) {
      F.enojo = true;
      e.def = Object.assign({}, e.def, { speed: e.def.speed * 1.25, cd: Math.round(e.def.cd * 0.7) });
      e._rol = 'carga';
      cartel(S, e, '¡GRUSHAK SE ENFURECE!', 0xfca5a5);
      hab('ev_cuerno_orco', 0.8) || son('orc_attack', 0.9, { rate: 0.6 });
      S.cameras.main.flash(300, 200, 40, 30);
      llamar(S, e, 'orc', 2);
    }
    if (F.enojo && !e._ckIntangible && e.state !== 'ck_carga') e.setTint(Math.floor(now / 400) % 2 ? 0xff8a7a : 0xffb0a0);
    if (!F.pisoton && frac <= GRUSHAK.pisoton) { F.pisoton = true; e._ckPisoAt = now + 1500; cartel(S, e, '¡LA TIERRA TIEMBLA!', 0xfdba74); }
    if (F.pisoton && now >= (e._ckPisoAt || 0) && e.state === 'chase' && !e.isAttacking) {
      e._ckPisoAt = now + GRUSHAK.cada;
      e.state = 'ck_aturdido'; e._ckRolHasta = now + GRUSHAK.aviso + 300; e.setVelocity(0, 0);   // se planta (sin estrellas)
      const x = e.body ? e.body.center.x : e.x, y = e.body ? e.body.center.y : e.y + 20;
      const g = S.add.graphics().setDepth(9);
      g.fillStyle(0xff3b2f, 0.22); g.fillEllipse(x, y, GRUSHAK.radio * 2, GRUSHAK.radio * 1.2);
      g.lineStyle(2, 0xff3b2f, 0.8); g.strokeEllipse(x, y, GRUSHAK.radio * 2, GRUSHAK.radio * 1.2);
      S.tweens.add({ targets: g, alpha: { from: 0.3, to: 1 }, duration: GRUSHAK.aviso, yoyo: false });
      son('beast_growl', 0.7, { rate: 0.5 });
      S.time.delayedCall(GRUSHAK.aviso, () => {
        g.destroy();
        if (!vivo(e)) return;
        if (S.anims.exists('orc_warlord_attack2')) e.play('orc_warlord_attack2');
        if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', x, y, GRUSHAK.radio, 450);
        S.cameras.main.shake(300, 0.014); son('sword_hit', 0.9, { rate: 0.5 });
        const p = S.player; if (!p || !p.body) return;
        const dx = (p.body.center.x - x) / GRUSHAK.radio, dy = (p.body.center.y - y) / (GRUSHAK.radio * 0.6);
        if (dx * dx + dy * dy <= 1) S.damagePlayer(GRUSHAK.dano);
      });
    }
  };

  const garra = (S, e, now) => {
    const F = e._ckFases;
    if (F.enojo || e.hp / e.maxHp > GARRA.enojo) return;
    F.enojo = true;
    e.def = Object.assign({}, e.def, { cd: Math.round(e.def.cd * 0.6), speed: e.def.speed * 1.15 });
    cartel(S, e, '¡GARRA NEGRA RUGE!', 0xfca5a5);
    son('beast_growl', 1, { rate: 0.55 });
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'hielo', e.x, e.y + 20, 90, 500);
    const p = S.player;
    if (p && p.body) { const a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y); p.body.setVelocity(Math.cos(a) * 380, Math.sin(a) * 380); }
    llamar(S, e, ENEMY_TYPES.warg ? 'warg' : 'werewolf', 2);
    e.setTint(0xff9a8a); S.time.delayedCall(1500, () => vivo(e) && e.clearTint());
  };

  const u0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = u0.apply(this, arguments);
    try {
      const now = this.time.now;
      if (this.enemies) this.enemies.getChildren().forEach(e => {
        if (!vivo(e) || !e._ckFases) return;
        if (e.type === 'necromancer') nigromante(this, e, now);
        else if (e.type === 'orc_warlord') grushak(this, e, now);
        else if (e.type === 'werebear_jefe') garra(this, e, now);
      });
    } catch (er) { if (!P._ckJefAv) { P._ckJefAv = 1; console.warn('[jefes]', er); } }
    return r;
  };
  window.CK_JEFES_FASES = { NIGRO, GRUSHAK, GARRA };
})();
