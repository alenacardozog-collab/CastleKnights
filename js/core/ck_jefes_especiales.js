'use strict';
/* Ataques especiales (12/11, pedidos del dueño: "a Garra Negra ponerle más habilidades y animaciones, que aúlle y te ralentice,
   cosas así" y "casi todos los enemigos fuertes tienen los mismos patrones de ataque: añadir animaciones y ataques especiales").
   Cada ataque avisa antes (se agacha, brilla, marca el piso) para que se pueda esquivar con el dash o corriéndose.
   - GARRA NEGRA (además del rugido al 50 % de ck_jefes_fases.js):
       · AULLIDO: se planta, junta aire y aúlla. Si estás cerca (menos de 200 px) quedás LENTO 3 s (te movés a la mitad,
         el héroe se ve azulado). Cada 9 s (6,5 s cuando está enojado).
       · SALTO: si te alejás, se agacha y salta hacia donde estás; la sombra en el piso marca dónde cae. Al caer, 2 corazones
         y grietas. Cada 10 s.
       · ZARPAZO DOBLE: de cerca, se echa atrás y tira dos zarpazos seguidos avanzando. Cada 5 s.
   - OSO (el común): ZARPAZO con avance, cada 6 s.
   - GRAN ESQUELETO: GOLPE DE TIERRA: levanta el arma y la clava; aro rojo en el piso alrededor, 0,8 s para salir. Cada 7 s.
   - ORCO DE ÉLITE: GIRO: gira con el hacha; aro alrededor, 0,6 s para salir. Cada 8 s.
   El héroe lento usa la marca _ckLentoHasta (la puede usar cualquiera). Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const hab = (k, v, o) => { const H = window.CK_SONIDOS; if (!H || !H.son) return false; try { H.son(k, v, o); return true; } catch (e) { return false; } };
  const FX = () => window.CK_JEFES_FX;
  const pies = e => (e.body ? { x: e.body.center.x, y: e.body.center.y } : { x: e.x, y: e.y + 20 });
  const piesH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.center.y } : { x: S.player.x, y: S.player.y }; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const anim = (S, e, k, rep) => { const key = e.type + '_' + k; if (S.anims.exists(key)) { e.play(rep ? { key, repeat: -1 } : key, true); return true; } return false; };
  const idle = (S, e) => anim(S, e, 'idle');
  // quieto mientras dura el especial (ck_roles.js también lo respeta: 'ck_aulla' = quieto hasta _ckRolHasta)
  const plantar = (S, e, ms) => { e.state = 'ck_aulla'; e._ckRolHasta = S.time.now + ms; e._ckEsp = S.time.now + ms; e.isAttacking = false; e.swingId = (e.swingId || 0) + 1; e.setVelocity(0, 0); };
  const soltar = (S, e) => { if (!vivo(e)) return; e._ckEsp = 0; e.state = 'chase'; e.attackCooldown = Math.max(e.attackCooldown || 0, S.time.now + 450); idle(S, e); };
  const mirar = (S, e) => e.setFlipX(S.player.x < e.x);
  const aro = (S, x, y, r, col, ms) => {
    const F = FX();
    if (F && F.zona) return F.zona(S, x, y, r, col, ms);
    const g = S.add.graphics().setDepth(9); g.fillStyle(col, 0.22); g.fillEllipse(x, y, r * 2, r * 1.2); g.lineStyle(2, col, 0.85); g.strokeEllipse(x, y, r * 2, r * 1.2);
    S.time.delayedCall(ms, () => g.destroy());
  };
  const enElipse = (S, x, y, r) => { const h = piesH(S), dx = (h.x - x) / r, dy = (h.y - y) / (r * 0.6); return dx * dx + dy * dy <= 1; };

  // ------------------------------------------------------------------ el héroe lento
  const lento = (S, ms) => {
    const nuevo = !(S._ckLentoHasta > S.time.now);
    S._ckLentoHasta = S.time.now + ms;
    if (nuevo) {
      S.createFloatingText(S.player.x, S.player.y - 34, '¡Lento!', 0x9ab8ff);
      hab('hab_st_lento', 0.6);
    }
  };
  const mov0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    const r = mov0.apply(this, arguments);
    try {
      const p = this.player;
      if (p && p.body && this._ckLentoHasta) {
        if (this.time.now < this._ckLentoHasta && !this.isDead) {
          p.body.velocity.x *= 0.5; p.body.velocity.y *= 0.5;
          p.setTint(Math.floor(this.time.now / 160) % 2 ? 0x9ab8ff : 0xc4d8ff); p._ckLentoTint = true;
          if (p.anims) p.anims.timeScale = 0.6;
        } else {
          this._ckLentoHasta = 0;
          if (p._ckLentoTint) { p._ckLentoTint = false; p.clearTint(); if (p.anims) p.anims.timeScale = 1; }
        }
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ los ataques
  const aullido = (S, e) => {
    const AV = 750;
    plantar(S, e, AV + 900); mirar(S, e);
    if (!anim(S, e, 'windup', true) && FX() && FX().anticipar) FX().anticipar(S, e, AV);
    if (FX()) FX().carga(S, e, 0x8ab4ff, AV);
    son('beast_growl', 0.55, { rate: 0.6 });
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      anim(S, e, 'aullido') || anim(S, e, 'attack2');      // la animación nueva (ck_jefes_vistas.js) si está
      son('ck_f_garra_aullido', 0.9) || hab('hab_rugido_oso', 0.9) || son('warg_howl', 0.9, { rate: 0.7 });
      const a = pies(e);
      if (FX()) { FX().ondaVoz(S, e.x + (e.flipX ? -20 : 20), e.y - 22, e.flipX); if (FX().onda) FX().onda(S, a.x, a.y, 200, 0x8ab4ff, 700); }
      if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'hielo', a.x, a.y, 70, 500);
      S.cameras.main.shake(350, 0.006);
      if (dist(a, piesH(S)) < 200) lento(S, 3000);
      S.time.delayedCall(900, () => soltar(S, e));
    });
  };
  const salto = (S, e) => {
    const AG = 420, VUELO = 850, h = piesH(S), a = pies(e);
    plantar(S, e, AG + VUELO + 600); mirar(S, e);
    if (FX() && FX().anticipar) FX().anticipar(S, e, AG); else anim(S, e, 'windup', true);
    son('beast_growl', 0.6, { rate: 0.8 });
    // donde va a caer: donde estabas (los pies del jefe quedan ahí)
    const dx = h.x - a.x, dy = h.y - a.y;
    S.time.delayedCall(AG, () => {
      if (!vivo(e)) return;
      if (FX()) FX().sombraCaida(S, h.x, h.y, 46, VUELO); else aro(S, h.x, h.y, 46, 0xff3b2f, VUELO);
      hab('hab_salto_golpe', 0.7) || son('dash', 0.6, { rate: 0.7 });
      anim(S, e, 'salto') || anim(S, e, 'attack1');
      const x0 = e.x, y0 = e.y, k = { t: 0 };
      if (e.body) e.body.checkCollision.none = true;
      S.tweens.add({ targets: k, t: 1, duration: VUELO, ease: 'Sine.easeInOut',
        onUpdate: () => { if (!vivo(e)) return; e.setPosition(x0 + dx * k.t, y0 + dy * k.t - Math.sin(k.t * Math.PI) * 70); e.setVelocity(0, 0); e.setDepth(h.y + 60); },
        onComplete: () => {
          if (e.body) e.body.checkCollision.none = false;
          if (!vivo(e)) return;
          e.setPosition(x0 + dx, y0 + dy);
          S.cameras.main.shake(320, 0.013);
          son('ck_f_garra_cae', 0.9) || son('ck_pisoton_jefe', 0.85);
          if (FX()) { FX().grieta(S, h.x, h.y, 56); FX().escombros(S, h.x, h.y, 44, 14); }
          if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', h.x, h.y, 60, 450);
          if (enElipse(S, h.x, h.y, 58)) S.damagePlayer(2);
          S.time.delayedCall(550, () => soltar(S, e));
        } });
    });
  };
  // zarpazo: n golpes seguidos avanzando hacia el héroe
  const zarpazo = (S, e, n, dano) => {
    const AV = 380, ENTRE = 300;
    plantar(S, e, AV + n * ENTRE + 400); mirar(S, e);
    if (FX() && FX().anticipar) FX().anticipar(S, e, AV); else anim(S, e, 'windup', true);
    if (FX()) FX().carga(S, e, 0xff6a3a, AV);
    son('beast_growl', 0.45, { rate: 1.1, minGap: 200 });
    for (let i = 0; i < n; i++) S.time.delayedCall(AV + i * ENTRE, () => {
      if (!vivo(e)) return;
      mirar(S, e);
      anim(S, e, i % 2 ? 'attack2' : 'attack1');
      const a = pies(e), h = piesH(S), ang = Math.atan2(h.y - a.y, h.x - a.x);
      S.tweens.add({ targets: e, x: e.x + Math.cos(ang) * 22, y: e.y + Math.sin(ang) * 14, duration: 120, ease: 'Quad.easeOut' });
      if (FX() && FX().tajo) FX().tajo(S, e, 60, 0xffb08a);
      hab('hab_garras', 0.6) || son('sword_swing2', 0.7, { rate: 0.7 });
      S.time.delayedCall(110, () => { if (vivo(e) && dist(pies(e), piesH(S)) < 64) S.damagePlayer(dano); });
    });
    S.time.delayedCall(AV + n * ENTRE + 300, () => soltar(S, e));
  };
  const golpeTierra = (S, e) => {
    const AV = 800, R = 64, a = pies(e);
    plantar(S, e, AV + 700); mirar(S, e);
    anim(S, e, 'attack3') ? e.anims.pause(e.anims.currentAnim.frames[Math.min(1, e.anims.currentAnim.frames.length - 1)]) : (FX() && FX().anticipar && FX().anticipar(S, e, AV));
    aro(S, a.x, a.y, R, 0xff3b2f, AV);
    son('ck_paso_armadura', 0.6, { rate: 0.8 }) || son('bone_hit', 0.5, { rate: 0.6 });
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      if (e.anims.isPaused) e.anims.resume(); else anim(S, e, 'attack2');
      S.cameras.main.shake(260, 0.01);
      son('ck_f_esqueleto_golpe', 0.8) || son('ck_pisoton_jefe', 0.6, { rate: 1.15 });
      if (FX()) { FX().grieta(S, a.x, a.y, R); FX().escombros(S, a.x, a.y, R * 0.7, 10); }
      if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', a.x, a.y, R, 420);
      if (enElipse(S, a.x, a.y, R)) S.damagePlayer(e.def.damage || e.def.dmg || 1);
      S.time.delayedCall(600, () => soltar(S, e));
    });
  };
  const giro = (S, e) => {
    const AV = 600, R = 58, a = pies(e);
    plantar(S, e, AV + 900); mirar(S, e);
    if (FX() && FX().anticipar) FX().anticipar(S, e, AV);
    aro(S, a.x, a.y, R, 0xff8a2a, AV);
    son('ck_f_orco_grito', 0.6) || son('orc_attack', 0.6, { rate: 0.8 });
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      anim(S, e, 'attack3') || anim(S, e, 'attack1');
      hab('hab_giro', 0.7) || son('spin', 0.8);
      son('ck_giro_hacha', 0.5);
      // da la vuelta: se da vuelta varias veces y deja estela
      let n = 0; const ev = S.time.addEvent({ delay: 90, repeat: 7, callback: () => { if (vivo(e)) { e.setFlipX(!e.flipX); if (n++ % 2 === 0 && FX() && FX().tajo) FX().tajo(S, e, R, 0xffc080); } } });
      if (FX() && FX().estela) FX().estela(S, e);
      const pega = () => { if (vivo(e) && enElipse(S, pies(e).x, pies(e).y, R)) S.damagePlayer(e.def.damage || e.def.dmg || 1); };
      S.time.delayedCall(120, pega); S.time.delayedCall(450, pega);
      S.time.delayedCall(800, () => { ev.remove(); soltar(S, e); });
    });
  };

  // ------------------------------------------------------------------ quién hace qué y cada cuánto
  // [ataque, cada (ms), distancia mínima, distancia máxima]
  const PLAN = {
    werebear_jefe: [['aullido', 9000, 0, 210], ['salto', 10000, 150, 330], ['zarpazo2', 5000, 0, 80]],
    werebear: [['zarpazo1', 6000, 40, 120]],
    skeleton_great: [['tierra', 7000, 0, 85]],
    orc_elite: [['giro', 8000, 0, 75]]
  };
  const HACER = {
    aullido: aullido, salto: salto,
    zarpazo2: (S, e) => zarpazo(S, e, 2, 1), zarpazo1: (S, e) => zarpazo(S, e, 1, e.def.damage || e.def.dmg || 1),
    tierra: golpeTierra, giro: giro
  };

  const u0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = u0.apply(this, arguments);
    try {
      if (!this.enemies || !this.player || !this.player.body || this.isDead || this._ckEscena || this.dialogOpen) return r;
      const now = this.time.now, h = piesH(this);
      this.enemies.getChildren().forEach(e => {
        if (!vivo(e)) return;
        if (e._ckEsp) { if (now > e._ckEsp + 1500) soltar(this, e); else e.setVelocity(0, 0); return; }   // seguro por si algo se cortó
        const plan = PLAN[e.type]; if (!plan) return;
        if (e.state !== 'chase' || e.isAttacking || e._ckIntangible) return;
        const cd = e._ckEspCd || (e._ckEspCd = {});
        if (!e._ckEspVio) { e._ckEspVio = now; plan.forEach(([k, cada]) => { cd[k] = now + cada * 0.5; }); return; }   // el primero, a mitad de tiempo
        const d = dist(pies(e), h), enojo = e._ckFases && e._ckFases.enojo;
        for (const [k, cada, dmin, dmax] of plan) {
          if (now < (cd[k] || 0) || d < dmin || d > dmax) continue;
          cd[k] = now + (enojo ? cada * 0.72 : cada);
          // entre especial y especial, un respiro
          plan.forEach(([k2]) => { if (k2 !== k) cd[k2] = Math.max(cd[k2] || 0, now + 1800); });
          HACER[k](this, e);
          break;
        }
      });
    } catch (er) { if (!P._ckEspAv) { P._ckEspAv = 1; console.warn('[especiales]', er); } }
    return r;
  };
  // si el héroe cae o se va de la partida, se le pasa lo lento
  ['campaignDefeat', 'startCampaign', 'returnToStartMenu'].forEach(k => {
    const f0 = P[k];
    if (typeof f0 === 'function') P[k] = function () { this._ckLentoHasta = 0; return f0.apply(this, arguments); };
  });
  window.CK_ESPECIALES = { PLAN, HACER, lento };
})();
