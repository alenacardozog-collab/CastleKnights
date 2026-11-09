'use strict';
/* Bestias con roles (07/11, pedido del dueño: "agregá todo eso"). Antes casi todas hacían lo mismo: te ven, caminan hasta
   vos y pegan. Ahora cada tipo tiene un papel, y el dash (Espacio), la parada (C) y el moverse importan:
   - EMBESTIDA (jabalí, orco jinete; Grushak enojado): de lejos se planta, rasca el piso y brilla en naranja (0,65 s),
     y sale disparado en línea recta. Si te agarra, pega; si choca contra una pared o un árbol queda ATURDIDO 1,4 s
     y recibe +50 % de daño. Se esquiva con el dash o corriéndose de la línea.
   - ESCUDO (orco acorazado, esqueleto acorazado): para todos los golpes que le vienen de frente. Cada golpe parado le
     gasta la guardia; al tercero, a un golpe pesado (2 corazones o más) o a una parada tuya (C) justo antes de su
     golpe, la GUARDIA SE ROMPE: 0,8 s quieto y 2,5 s sin poder parar y con +50 % de daño. Por la espalda no para nada.
     La guardia vuelve sola a los 4 s sin recibir golpes.
   - TIRADOR (esqueleto arquero y los que tiran): si te acercás a menos de 100 px, retrocede para volver a tirarte.
   - AULLADOR (hombre lobo, huargo) y GRITO DE GUERRA (orco de élite): la primera vez que te ve se frena, aúlla y
     avisa a todos los de su clase en 420 px, que van un 20 % más rápido por 5 s.
   Los números de cada rol están en ROLES. Borrar la línea de index.html vuelve a las bestias de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ROLES = {
    boar: 'carga', orc_rider: 'carga',
    orc_armored: 'escudo', skeleton_armored: 'escudo',
    skeleton_archer: 'tirador',
    werewolf: 'aullido', warg: 'aullido', orc_elite: 'grito'
  };
  const CARGA = { min: 80, max: 230, prep: 650, corre: 560, vel: 330, cd: 4500, aturde: 1400 };
  const ESCUDO = { aguante: 3, rota: 2500, quieto: 800, vuelve: 4000 };
  const TIRADOR = { cerca: 100 };
  const AULLA = { radio: 420, quieto: 800, mas: 1.2, dura: 5000 };
  const VULNERABLE = 1.5;

  const rol = e => e && (e._rol || ROLES[e.type]);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const hab = (k, v, o) => { const H = window.CK_SONIDOS; if (!H || !H.son) return false; H.son(k, v, o); return true; };   // clips de ElevenLabs (ck_sonidos_hab.js)
  const pies = e => (e.body ? { x: e.body.center.x, y: e.body.center.y } : { x: e.x, y: e.y + 20 });
  const idle = (S, e) => { if (S.anims.exists(e.type + '_idle') && e.anims.currentAnim?.key !== e.type + '_idle') e.play(e.type + '_idle'); };
  const aturdir = (S, e, ms) => {
    e.state = 'ck_aturdido'; e._ckRolHasta = S.time.now + ms; e._ckAturdido = S.time.now + ms;   // ck_estados.js le pone las estrellas
    e._ckVulnerable = S.time.now + ms + 600;
    e.isAttacking = false; e.swingId = (e.swingId || 0) + 1; e.setVelocity(0, 0); idle(S, e);
  };

  // ------------------------------------------------------------------ embestida
  const empezarCarga = (S, e) => {
    const p = S.player, a = pies(e), b = { x: p.body.center.x, y: p.body.center.y };
    e.state = 'ck_carga'; e._fase = 'prep'; e._ckRolHasta = S.time.now + CARGA.prep;
    e._dir = Phaser.Math.Angle.Between(a.x, a.y, b.x, b.y);
    e.setVelocity(0, 0); e.isAttacking = false; idle(S, e);
    e.setFlipX(b.x < a.x);
    // aviso: tinte naranja que titila, polvo en las patas y una huella en el piso hacia donde va a salir
    const largo = CARGA.vel * CARGA.corre / 1000;
    const g = S.add.graphics().setDepth(Math.max(9, e.depth - 1));
    for (let i = 1; i <= 7; i++) {
      const d = largo * i / 7, x = a.x + Math.cos(e._dir) * d, y = a.y + Math.sin(e._dir) * d;
      g.fillStyle(0xff5a2a, 0.28 - i * 0.025); g.fillEllipse(x, y, 14 - i, 6 - i * 0.4);
    }
    e._ckAviso = g;
    S.tweens.add({ targets: g, alpha: { from: 0.2, to: 1 }, duration: CARGA.prep, ease: 'Quad.easeIn' });
    son('beast_growl', 0.6, { rate: e.type === 'boar' ? 1.25 : 0.85, minGap: 200 });
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', a.x - Math.cos(e._dir) * 10, a.y, 18, 400);
  };
  const cuadroCarga = (S, e, now) => {
    if (e._fase === 'prep') {
      e.setVelocity(0, 0);
      e.setTint(Math.floor(now / 90) % 2 ? 0xffb07a : 0xffffff);
      if (now >= e._ckRolHasta) {
        e._fase = 'corre'; e._ckRolHasta = now + CARGA.corre; e._ckCorreDesde = now; e._pego = false; e._px = e.x; e._py = e.y; e._trabas = 0;
        e.clearTint();
        if (S.anims.exists(e.type + '_walk')) { e.play(e.type + '_walk'); e.anims.timeScale = 2.2; }
        son(e.type === 'boar' ? 'beast_hurt' : 'orc_attack', 0.6, { rate: 1.3 });
      }
      return;
    }
    if (e._fase === 'corre') {
      e.setVelocity(Math.cos(e._dir) * CARGA.vel, Math.sin(e._dir) * CARGA.vel);
      // ¿agarró al héroe?
      const p = S.player, a = pies(e);
      if (!e._pego && p.body && Math.abs(p.body.center.x - a.x) < 24 && Math.abs(p.body.center.y - a.y) < 18) {
        e._pego = true;
        S.damagePlayer((e.def && e.def.dmg) || 1);
        if (!S.isDead && p.body) p.body.setVelocity(Math.cos(e._dir) * 240, Math.sin(e._dir) * 240);
        S.cameras.main.shake(160, 0.008);
      }
      // ¿chocó? (la física lo frena: si casi no avanzó dos cuadros seguidos)
      const mov = Math.hypot(e.x - e._px, e.y - e._py); e._px = e.x; e._py = e.y;
      const traba = (e.body && e.body.blocked && (e.body.blocked.left || e.body.blocked.right || e.body.blocked.up || e.body.blocked.down)) || mov < 1.2;
      e._trabas = traba && now - e._ckCorreDesde > 120 ? e._trabas + 1 : 0;
      if (e._trabas >= 2) {
        if (e.anims) e.anims.timeScale = 1;
        S.cameras.main.shake(140, 0.006); son('sword_hit', 0.6, { rate: 0.6 });
        if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', a.x + Math.cos(e._dir) * 12, a.y, 24, 360);
        S.createFloatingText(e.x, e.y - 40, '¡ATURDIDO!', 0xfde68a);
        aturdir(S, e, CARGA.aturde); e._cargaCd = now + CARGA.cd;
        if (e._ckAviso) { e._ckAviso.destroy(); e._ckAviso = null; }
        return;
      }
      if (now >= e._ckRolHasta) {
        if (e.anims) e.anims.timeScale = 1;
        e._fase = 'frena'; e._ckRolHasta = now + 320;
        if (e._ckAviso) { e._ckAviso.destroy(); e._ckAviso = null; }
      }
      return;
    }
    // frena
    const f = Math.max(0, (e._ckRolHasta - now) / 320);
    e.setVelocity(Math.cos(e._dir) * CARGA.vel * 0.35 * f, Math.sin(e._dir) * CARGA.vel * 0.35 * f);
    if (now >= e._ckRolHasta) { e.state = 'chase'; e._cargaCd = now + CARGA.cd; e.setVelocity(0, 0); idle(S, e); }
  };

  // ------------------------------------------------------------------ cuadro: los estados propios y los roles
  const u0 = P.updateEnemies;
  P.updateEnemies = function () {
    const now = this.time.now;
    const r = u0.apply(this, arguments);
    try {
      if (!this.enemies || !this.player || !this.player.body) return r;
      this.enemies.getChildren().forEach(e => {
        if (!e.active) return;
        if (e.isDead) { if (e._ckAviso) { e._ckAviso.destroy(); e._ckAviso = null; } return; }
        const k = rol(e);
        if (e.state === 'ck_carga') { cuadroCarga(this, e, now); return; }
        if (e.state === 'ck_retrocede') {
          const p = this.player, ang = Phaser.Math.Angle.Between(p.x, p.y, e.x, e.y), sp = (e.def.speed || 60) * 0.9;
          const res = this.moveEnemyTo(e, e.x + Math.cos(ang) * 60, e.y + 26 + Math.sin(ang) * 60, sp, true);
          if (res !== 'walking') e.setVelocity(Math.cos(ang) * sp * 0.6, Math.sin(ang) * sp * 0.6);
          e.setFlipX(p.x < e.x);
          if (now >= e._ckRolHasta) { e.state = 'chase'; idle(this, e); }
          return;
        }
        if (e.state === 'ck_aturdido' || e.state === 'ck_aulla') {
          e.setVelocity(0, 0);
          if (now >= e._ckRolHasta) { e.state = 'chase'; e.attackCooldown = Math.max(e.attackCooldown || 0, now + 300); }
          return;
        }
        if (!k || e.state !== 'chase' || e.isAttacking) return;
        const p = this.player, dist = Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y);
        if (k === 'carga' && now > (e._cargaCd || 0) && dist > CARGA.min && dist < CARGA.max && !e._target &&
          this.enemySees && this.enemySees(e, p.body.center.x, p.body.bottom)) empezarCarga(this, e);
        else if (k === 'tirador' && e.def && e.def.ranged && dist < TIRADOR.cerca && !e._target) {
          e.state = 'ck_retrocede'; e._ckRolHasta = now + 550;
          if (this.anims.exists(e.type + '_walk')) e.play(e.type + '_walk');
        }
        // la guardia vuelve sola
        if (k === 'escudo' && e._guardia !== undefined && e._guardia < ESCUDO.aguante && now > (e._guardiaAt || 0) + ESCUDO.vuelve && now > (e._guardiaRota || 0)) e._guardia = ESCUDO.aguante;
      });
    } catch (er) { if (!P._ckRolAv) { P._ckRolAv = 1; console.warn('[roles]', er); } }
    return r;
  };

  // ------------------------------------------------------------------ escudo
  const romper = (S, e) => {
    e._guardia = 0; e._guardiaRota = S.time.now + ESCUDO.rota; e._ckVulnerable = S.time.now + ESCUDO.rota;
    S.createFloatingText(e.x, e.y - 40, '¡GUARDIA ROTA!', 0xfca5a5);
    son('sword_hit', 0.8, { rate: 0.6 });
    S.cameras.main.shake(120, 0.006);
    aturdir(S, e, ESCUDO.quieto); e._ckVulnerable = S.time.now + ESCUDO.rota;
  };
  const tb0 = P.enemyTryBlock;
  P.enemyTryBlock = function (enemy, sx, sy, amount) {
    if (rol(enemy) !== 'escudo' || this._ckDot) return tb0.apply(this, arguments);
    const now = this.time.now;
    if (amount >= 10 || now < (enemy._guardiaRota || 0) || enemy.isAttacking) return false;
    if (enemy.state !== 'chase' && enemy.state !== 'alerting') return false;
    if ((sx < enemy.x) !== enemy.flipX) return false;   // por la espalda no para
    if (enemy._guardia === undefined) enemy._guardia = ESCUDO.aguante;
    enemy._guardiaAt = now;
    const V = window.CK_VIDA_FINA, B = V ? V.bonus(this) : 0, tot = amount + (V && this._gameMode === 'campaign' && this.story && this.story.up ? this.story.up.atk || 0 : 0);
    if (tot >= 2 + B || this._ckFuente === 'pesado') { romper(this, enemy); return true; }   // el golpe pesado rompe (y no entra)
    enemy._guardia--;
    if (enemy._guardia <= 0) { romper(this, enemy); return true; }
    const key = enemy.type + '_block';
    if (this.anims.exists(key)) {
      enemy.isAttacking = true; enemy.setVelocity(0, 0); enemy.play(key);
      enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { enemy.isAttacking = false; if (vivo(enemy)) idle(this, enemy); });
    } else { enemy.setTint(0xcbd5e1); this.time.delayedCall(140, () => vivo(enemy) && enemy.clearTint()); }
    this.createFloatingText(enemy.x, enemy.y - 24, '¡BLOQUEO! ' + '◆'.repeat(enemy._guardia), 0xcbd5e1);
    son('sword_hit', 0.6, { minGap: 100, rate: 1.6 });
    const ang = Phaser.Math.Angle.Between(sx, sy, enemy.x, enemy.y);
    enemy.body.setVelocity(Math.cos(ang) * 50, Math.sin(ang) * 50);
    return true;
  };
  // la parada (C) rompe la guardia del que pegaba
  const tp0 = P.tryParry;
  P.tryParry = function () {
    const p = this.player;
    let cerca = null, bd = 90;
    if (p && this.enemies) this.enemies.getChildren().forEach(e => { if (!vivo(e)) return; const d = Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; cerca = e; } });
    const ok = tp0.apply(this, arguments);
    try { if (ok && cerca && vivo(cerca) && rol(cerca) === 'escudo' && this.time.now >= (cerca._guardiaRota || 0)) romper(this, cerca); } catch (e) {}
    return ok;
  };
  // aturdidos y con la guardia rota reciben más
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    if (enemy && !enemy.isDead && amount < 10 && (enemy._ckVulnerable || 0) > this.time.now) arguments[1] = Math.round(amount * VULNERABLE * 4) / 4;
    return de0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ aullido / grito de guerra
  const a0 = P.alertEnemy;
  P.alertEnemy = function (enemy) {
    if (enemy && typeof enemy.state === 'string' && enemy.state.indexOf('ck_') === 0) return;   // embistiendo, aturdido o aullando
    const antes = enemy && enemy.state;
    const r = a0.apply(this, arguments);
    try {
      const k = rol(enemy);
      if ((k === 'aullido' || k === 'grito') && !enemy._ckAullo && antes !== 'chase' && antes !== 'alerting' && enemy.state === 'alerting') {
        enemy._ckAullo = true;
        this.time.delayedCall(280, () => {
          if (!vivo(enemy)) return;
          enemy.state = 'ck_aulla'; enemy._ckRolHasta = this.time.now + AULLA.quieto; enemy.setVelocity(0, 0);
          if (this.anims.exists(enemy.type + '_attack1')) { enemy.play(enemy.type + '_attack1'); enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => vivo(enemy) && idle(this, enemy)); }
          if (k === 'aullido') hab('ev_aullido', 0.7, { gap: 600 }) || son('beast_growl', 0.8, { rate: 0.7 });
          else hab('ev_cuerno_orco', 0.6, { gap: 600 }) || son('orc_attack', 0.8, { rate: 0.7 });
          this.createFloatingText(enemy.x, enemy.y - 46, k === 'aullido' ? '¡AÚÚÚ!' : '¡GRITO DE GUERRA!', 0xfca5a5);
          const familia = k === 'aullido' ? /^(werewolf|warg|werebear)/ : /^orc/;
          this.enemies.getChildren().forEach(o => {
            if (!vivo(o) || !familia.test(o.type) || Phaser.Math.Distance.Between(o.x, o.y, enemy.x, enemy.y) > AULLA.radio) return;
            if (o !== enemy && o.state !== 'chase' && o.state !== 'alerting') { o._ckAullo = true; this.alertEnemy(o); }
            if (!o._ckApurado) {
              const d0 = o.def; o._ckApurado = true; o.def = Object.assign({}, d0, { speed: d0.speed * AULLA.mas });
              this.time.delayedCall(AULLA.dura, () => { if (o.active && o.def) { o.def = Object.assign({}, o.def, { speed: d0.speed }); o._ckApurado = false; } });
            }
          });
        });
      }
    } catch (e) {}
    return r;
  };
  window.CK_ROLES = { ROLES, CARGA, ESCUDO, TIRADOR, AULLA, rol, aturdir, empezarCarga };
})();
