'use strict';
/* Garra Negra se esconde en la oscuridad (12/11, pedido del dueño: "cuando luchamos contra él tiene ataques de ocultarse en la
   oscuridad y aparecer en otro lado").
   Un especial más de Garra Negra (werebear_jefe), en la lista de ck_jefes_especiales.js:
   - SOMBRA: se agacha y gruñe bajo (aviso), se funde con la oscuridad (casi invisible y sin recibir daño: _ckIntangible);
     sólo se ven dos ojos rojos que se mueven por la penumbra; reaparece de golpe a un costado o detrás del héroe y se tira
     encima con un zarpazo (si estás cerca, 2 corazones). Cada 11 s (8 s cuando está enojado), a media o larga distancia.
     Prefiere los lugares lejos de las luces (las de CK_LUZ); si no encuentra, aparece donde puede.
   Sólo donde hay penumbra (la cueva, o de noche): a pleno día no lo hace.
   Va DESPUÉS de ck_jefes_especiales.js y de ck_oscuridad.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESPECIALES) return;
  const ES = window.CK_ESPECIALES;
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const piesH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.center.y } : { x: S.player.x, y: S.player.y }; };
  const luces = S => { try { const L = window.CK_LUZ; return (L && L.ultimas && L.ultimas()) || []; } catch (e) { return []; } };
  const lugar = (S, e) => {
    const h = piesH(S), atras = S.player.flipX ? 1 : -1, cand = [];
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2, d = 95 + (i % 3) * 18, x = h.x + Math.cos(ang) * d, y = h.y + Math.sin(ang) * d * 0.75;
      if (S.navIsFree && !S.navIsFree(x, y)) continue;
      let p = Math.random() * 0.4;
      if (Math.sign(Math.cos(ang)) === atras) p += 1;                       // mejor por detrás
      luces(S).forEach(l => { const dl = Math.hypot(l.x - x, l.y - y); if (dl < (l.r || 80)) p -= 0.8 * (1 - dl / (l.r || 80)); });
      cand.push({ x, y, p });
    }
    cand.sort((a, b) => b.p - a.p);
    return cand[0] || null;
  };
  const ojos = (S, x, y, ms) => {
    const g = S.add.graphics().setDepth(40000).setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(0xff3030, 0.95); g.fillCircle(-5, 0, 2); g.fillCircle(5, 0, 2);
    g.fillStyle(0xff8080, 0.35); g.fillCircle(-5, 0, 4); g.fillCircle(5, 0, 4);
    g.setPosition(x, y); g.setAlpha(0);
    S.tweens.add({ targets: g, alpha: 1, duration: 160, yoyo: true, hold: ms, onComplete: () => g.destroy() });
    return g;
  };
  const sombra = (S, e) => {
    if (!luces(S).length) return;                     // a pleno día no hay sombra donde esconderse
    const total = 2300; e.state = 'ck_aulla'; e._ckRolHasta = S.time.now + total; e._ckEsp = S.time.now + total;
    e.isAttacking = false; e.swingId = (e.swingId || 0) + 1; e.setVelocity(0, 0);
    const sx = e.scaleX, sy = e.scaleY;
    // 1) aviso: se agacha y gruñe bajo
    S.tweens.add({ targets: e, scaleY: sy * 0.88, duration: 260, yoyo: true });
    e.setTint(0x30304a); son('beast_growl', 0.8, { rate: 0.6 }) || son('warg_howl', 0.5, { rate: 0.5 });
    // 2) se funde con la oscuridad
    S.time.delayedCall(420, () => {
      if (!vivo(e)) return;
      e._ckIntangible = true; e._ckIntDesde = S.time.now; e._ckSombra = true;
      S.tweens.add({ targets: e, alpha: 0.05, duration: 320 });
      ojos(S, e.x, e.y - e.displayHeight * 0.32, 260);
    });
    // 3) se mueve por la penumbra: los ojos aparecen donde va a salir
    S.time.delayedCall(900, () => {
      if (!vivo(e)) return;
      const q = lugar(S, e); if (!q) return;
      e.setPosition(q.x, q.y - (e.body ? e.body.height / 2 : 0)); if (e.body && e.body.reset) e.body.reset(e.x, e.y);
      e.setFlipX(S.player.x < e.x);
      ojos(S, e.x, e.y - e.displayHeight * 0.32, 600);
      son('ck_f_garra_aullido', 0.25, { rate: 1.4 });
    });
    // 4) aparece de golpe y salta encima
    S.time.delayedCall(1750, () => {
      if (!vivo(e)) return;
      e._ckIntangible = false; e._ckSombra = false; e.clearTint(); e.setScale(sx, sy);
      S.tweens.add({ targets: e, alpha: 1, duration: 120 });
      const h = piesH(S), dx = h.x - e.x, dy = h.y - (e.y + (e.body ? e.body.height / 2 : 20)), d = Math.hypot(dx, dy) || 1, paso = Math.min(70, d - 10);
      const tx = e.x + dx / d * paso, ty = e.y + dy / d * paso;
      const ok = !S.navIsFree || S.navIsFree(tx, ty + (e.body ? e.body.height / 2 : 20));
      son('beast_growl', 1, { rate: 0.9 }) || son('sword_hit', 0.6);
      try { if (window.CK_ESCENA && CK_ESCENA.globo) CK_ESCENA.globo(S, e, '¡GRAAH!', 800); } catch (er) {}
      if (S.anims.exists(e.type + '_attack')) e.play(e.type + '_attack', true);
      if (ok) S.tweens.add({ targets: e, x: tx, y: ty, duration: 200, ease: 'Quad.easeIn', onComplete: () => { if (e.body && e.body.reset) e.body.reset(e.x, e.y); } });
      S.time.delayedCall(210, () => {
        if (!vivo(e)) return;
        const hh = piesH(S), ee = e.body ? { x: e.body.center.x, y: e.body.center.y } : { x: e.x, y: e.y };
        if (Math.hypot(hh.x - ee.x, hh.y - ee.y) < 52) { S.damagePlayer(2); S.cameras.main.shake(160, 0.007); }
      });
    });
    // 5) vuelve a perseguir
    S.time.delayedCall(total, () => { if (!vivo(e)) return; e._ckEsp = 0; e.state = 'chase'; e.setAlpha(1); e.clearTint(); e._ckIntangible = false; e.attackCooldown = Math.max(e.attackCooldown || 0, S.time.now + 500); });
  };
  ES.HACER.sombra = sombra;
  (ES.PLAN.werebear_jefe = ES.PLAN.werebear_jefe || []).push(['sombra', 11000, 60, 420]);
  // si la pelea se corta (muere el héroe, cambia de mapa), que no quede invisible
  const P = MainGameScene.prototype, ms0 = P.onAreaShown;
  P.onAreaShown = function () { const r = ms0 ? ms0.apply(this, arguments) : undefined; try { (this.enemies ? this.enemies.getChildren() : []).forEach(e => { if (e._ckSombra) { e._ckSombra = false; e._ckIntangible = false; e.setAlpha(1); } }); } catch (er) {} return r; };
  // (v2) en la cueva (ck_oscuridad.js con `tinte`) cada cuadro se le vuelve a poner alpha 1 y sus ojos de la penumbra:
  // mientras está en la sombra, manda esto (va después en index.html, así corre último)
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (this.enemies) this.enemies.getChildren().forEach(e => {
        if (!e._ckSombra || !vivo(e)) return;
        e.setAlpha(0.05); if (e.hpBar) e.hpBar.setAlpha(0); if (e._ckOjos && e._ckOjos.clear) e._ckOjos.clear();
      });
    } catch (er) {}
    return r;
  };
  window.CK_GARRA_SOMBRA = { sombra };
})();
