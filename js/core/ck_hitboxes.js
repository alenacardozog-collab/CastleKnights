'use strict';
/* Hitboxes de verdad (06/11, pedido del dueño: "testeá las hitbox y si están mal corregilas").
   Lo que se midió (scripts en 15_arreglos\\qa\\medir_hitbox.py y probar_golpes.py):
   - Los golpes del héroe pegaban por distancia al centro del enemigo desde un punto a 42 px, con radio 50: Lancent
     pegaba a un orco a 80 px (la espada llega a 24) y a 45 px de desnivel; Aby y Horos a 100 px y 60 de desnivel;
     Horos pegaba hasta para atrás.
   - Las flechas, bolas de fuego y proyectiles de las habilidades chocaban con el cuerpo de física del enemigo, que es
     una cajita de 16x8 en los pies: con 8 px de desnivel la flecha pasaba por el pecho del orco y no le pegaba.
   - Los disparos enemigos chocaban con los pies del héroe, igual.
   Cómo queda:
   - Cada personaje tiene una "caja de carne": el rectángulo de píxeles visibles de su animación quieta (se mide del
     dibujo una sola vez y se guarda), con la escala y el espejo del sprite.
   - El golpe del héroe es un rectángulo que sale de su cuerpo hasta la punta visible del arma en ese ataque (medida del
     dibujo de la animación que está haciendo) más 14 px de tolerancia; de alto, la franja del torso (-22..+18) y pega
     si toca la caja de carne. Mirando al frente o a la espalda, lo mismo hacia abajo o arriba.
   - Los golpes en círculo (torbellino, el remate de la danza, el remolino) miden la distancia al borde de la caja, no al
     centro: a un enemigo grande se le pega igual.
   - Los proyectiles (de los dos lados) pegan cuando su cuerpo toca la caja de carne del otro, además de los pies.
   Se hace filtrando qué enemigos ve cada chequeo original, así siguen andando los envoltorios de ck_habilidades
   (fuente del daño, danza amplia). Borrar la línea de index.html vuelve a lo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  const TOL = 14;

  // ------------------------------------------------------------------ píxeles visibles de un cuadro (cache por textura+cuadro)
  const crudo = new Map();
  const visibles = (S, texKey, frameName) => {
    const k = texKey + '|' + frameName;
    if (crudo.has(k)) return crudo.get(k);
    let r = null;
    try {
      const fr = S.textures.getFrame(texKey, frameName);
      const src = fr.source.image || fr.source.canvas;
      const c = document.createElement('canvas'); c.width = fr.cutWidth; c.height = fr.cutHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(src, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 >= 0) r = { x0: x0 + (fr.x || 0), y0: y0 + (fr.y || 0), x1: x1 + 1 + (fr.x || 0), y1: y1 + 1 + (fr.y || 0), w: fr.realWidth, h: fr.realHeight };
    } catch (e) { r = null; }
    crudo.set(k, r);
    return r;
  };
  // unión de los cuadros de una animación, relativa al origen del sprite (en px de textura, sin escala)
  const uniones = new Map();
  const unionAnim = (S, animKey, ox, oy) => {
    const k = animKey + '|' + ox + '|' + oy;
    if (uniones.has(k)) return uniones.get(k);
    let u = null;
    try {
      const an = S.anims.get(animKey);
      if (an) an.frames.forEach(f => {
        const v = visibles(S, f.textureKey, f.textureFrame); if (!v) return;
        const b = { x0: v.x0 - ox * v.w, y0: v.y0 - oy * v.h, x1: v.x1 - ox * v.w, y1: v.y1 - oy * v.h };
        u = u ? { x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) } : b;
      });
    } catch (e) { u = null; }
    uniones.set(k, u);
    return u;
  };
  // caja en el mundo a partir de una unión relativa, con la escala y el espejo del sprite
  const aMundo = (sp, u) => {
    const s = Math.abs(sp.scaleX), t = sp.scaleY, f = sp.flipX ? -1 : 1;
    const xa = sp.x + u.x0 * s * f, xb = sp.x + u.x1 * s * f;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: sp.y + u.y0 * t, y1: sp.y + u.y1 * t };
  };
  /** La caja de carne de un sprite (héroe o enemigo): sus píxeles visibles quieto. */
  const carne = (S, sp) => {
    const tipo = sp === S.player ? S.playerHero : sp.type;
    const u = tipo ? unionAnim(S, tipo + '_idle', sp.originX, sp.originY) : null;
    if (u) return aMundo(sp, u);
    const s = Math.abs(sp.scaleX) / 1.2;
    return { x0: sp.x - 12 * s, x1: sp.x + 12 * s, y0: sp.y - 14 * s, y1: sp.y + 12 * s };
  };
  const tocan = (a, b, tol) => a.x0 - (tol || 0) < b.x1 && a.x1 + (tol || 0) > b.x0 && a.y0 - (tol || 0) < b.y1 && a.y1 + (tol || 0) > b.y0;
  const distCaja = (x, y, b) => { const dx = Math.max(b.x0 - x, 0, x - b.x1), dy = Math.max(b.y0 - y, 0, y - b.y1); return Math.hypot(dx, dy); };

  // ------------------------------------------------------------------ el rectángulo del golpe del héroe
  /** Punta visible del arma del ataque que está haciendo el héroe: cuánto sale del origen hacia donde mira. */
  const puntas = (S, animKey, p) => {
    const u = unionAnim(S, animKey, p.originX, p.originY) || { x0: -12, x1: 24, y0: -14, y1: 12 };
    const s = Math.abs(p.scaleX), t = p.scaleY;
    return { lado: Math.max(20, u.x1 * s), atras: Math.max(0, -u.x0 * s), abajo: Math.max(20, u.y1 * t), arriba: Math.max(20, -u.y0 * t), ancho: Math.max(12, Math.max(-u.x0, u.x1) * s) };
  };
  const rectoGolpe = (S, extra) => {
    const p = S.player, an = p.anims.currentAnim ? p.anims.currentAnim.key : S.playerHero + '_attack1';
    const v = S.facingV && S.anims.exists(`${S.playerHero}_attack1_${S.facingV}`) ? S.facingV : null;
    const pt = puntas(S, an, p), e = (extra || 0) + TOL;
    if (v === 'front') return { x0: p.x - pt.ancho - 8, x1: p.x + pt.ancho + 8, y0: p.y + 2, y1: p.y + pt.abajo + e };
    if (v === 'back') return { x0: p.x - pt.ancho - 8, x1: p.x + pt.ancho + 8, y0: p.y - pt.arriba - e, y1: p.y - 2 };
    const izq = S.facingDirection === 'left';
    return izq ? { x0: p.x - pt.lado - e, x1: p.x + 8, y0: p.y - 22, y1: p.y + 18 } : { x0: p.x - 8, x1: p.x + pt.lado + e, y0: p.y - 22, y1: p.y + 18 };
  };
  const vivos = S => S.enemies.getChildren().filter(e => e.active && !e.isDead);
  /** Corre un chequeo original dejándole ver sólo los enemigos elegidos. */
  const conSeleccion = (S, sel, f) => {
    const g0 = S.enemies.getChildren;
    S.enemies.getChildren = () => sel;
    try { return f(); } finally { S.enemies.getChildren = g0; }
  };

  // melee común (J de Lancent y Aby, golpes de la danza, embestida) — reach 0 = en círculo alrededor
  const cm0 = P.checkMeleeHits;
  P.checkMeleeHits = function (o) {
    const S = this; if (!S.player || !S.enemies) return cm0.apply(this, arguments);
    const opt = o || {};
    let sel;
    if (opt.reach === 0) {
      const r = (opt.radius || 60) - 12, cx = S.player.x, cy = S.player.y + 6;      // al borde de la caja, no al centro
      sel = vivos(S).filter(e => distCaja(cx, cy, carne(S, e)) <= r);
    } else {
      const extra = Math.max(0, (opt.radius || 50) - 50) + Math.max(0, (opt.reach === undefined ? 42 : opt.reach) - 42);
      const R = rectoGolpe(S, extra);
      sel = vivos(S).filter(e => tocan(R, carne(S, e), 0));
    }
    return conSeleccion(S, sel, () => cm0.call(S, Object.assign({}, opt, { reach: 0, radius: 9999 })));
  };
  // estocadas de Aby (K): un pasillo angosto hasta la punta
  const ct0 = P.checkThrustHits;
  P.checkThrustHits = function (dmg) {
    const S = this; if (!S.player || !S.enemies) return ct0.apply(this, arguments);
    const p = S.player, pt = puntas(S, p.anims.currentAnim ? p.anims.currentAnim.key : 'swordsman_attack3', p), izq = S.facingDirection === 'left';
    const R = izq ? { x0: p.x - pt.lado - TOL, x1: p.x + 6, y0: p.y - 16, y1: p.y + 14 } : { x0: p.x - 6, x1: p.x + pt.lado + TOL, y0: p.y - 16, y1: p.y + 14 };
    const sel = vivos(S).filter(e => tocan(R, carne(S, e), 0));
    return conSeleccion(S, sel, () => ct0.apply(S, arguments));
  };
  // la ráfaga de Horos (J): la nube de magia que se ve en el dibujo
  const cw0 = P.checkWizardMagicHits;
  P.checkWizardMagicHits = function () {
    const S = this; if (!S.player || !S.enemies) return cw0.apply(this, arguments);
    const p = S.player, pt = puntas(S, p.anims.currentAnim ? p.anims.currentAnim.key : 'wizard_attack1', p), v = S.facingV;
    let R;
    if (v === 'front') R = { x0: p.x - 34, x1: p.x + 34, y0: p.y + 2, y1: p.y + Math.max(pt.abajo, 44) + TOL };
    else if (v === 'back') R = { x0: p.x - 34, x1: p.x + 34, y0: p.y - Math.max(pt.arriba, 40) - TOL, y1: p.y - 2 };
    else R = S.facingDirection === 'left' ? { x0: p.x - pt.lado - TOL, x1: p.x + 4, y0: p.y - 44, y1: p.y + 44 } : { x0: p.x - 4, x1: p.x + pt.lado + TOL, y0: p.y - 44, y1: p.y + 44 };
    const sel = vivos(S).filter(e => tocan(R, carne(S, e), 0));
    return conSeleccion(S, sel, () => cw0.apply(S, arguments));
  };
  // torbellino de Lancent: al borde de la caja
  const cs0 = P.checkSpinHits;
  if (cs0) P.checkSpinHits = function () {
    const S = this; if (!S.player || !S.enemies) return cs0.apply(this, arguments);
    const sel = vivos(S).filter(e => distCaja(S.player.x, S.player.y + 6, carne(S, e)) <= 62);
    return conSeleccion(S, sel, () => cs0.apply(S, arguments));
  };

  // ------------------------------------------------------------------ proyectiles contra la caja de carne
  const rectoCuerpo = o => (o.body ? { x0: o.body.x, x1: o.body.x + o.body.width, y0: o.body.y, y1: o.body.y + o.body.height } : { x0: o.x - 6, x1: o.x + 6, y0: o.y - 6, y1: o.y + 6 });
  const proyectiles = S => {
    if (S.projectiles) {
      const ls = S.projectiles.getChildren();
      for (let i = 0; i < ls.length; i++) {
        const pr = ls[i]; if (!pr.active) continue;
        const R = rectoCuerpo(pr);
        const en = S.enemies.getChildren();
        for (let j = 0; j < en.length; j++) {
          const e = en[j]; if (!e.active || e.isDead) continue;
          if (pr._ckGolpeados && pr._ckGolpeados.has(e)) continue;
          const C = carne(S, e); if (window.CK_HITBOXES && CK_HITBOXES.espia) CK_HITBOXES.espia(pr, e, R, C);
          if (tocan(R, C, 0)) { S.handleProjectileHitEnemy(pr, e); if (!pr.active) break; }
        }
      }
    }
    if (S.enemyShots && S.player && !S.isDead) {
      const C = carne(S, S.player), ls = S.enemyShots.getChildren();
      for (let i = 0; i < ls.length; i++) {
        const sh = ls[i]; if (!sh.active) continue;
        if (tocan(rectoCuerpo(sh), C, 0)) { const dmg = sh.dmg || 1; sh.destroy(); S.damagePlayer(dmg); }
      }
    }
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try { if (this.gameStarted && this.player && this.enemies && !this.isGamePaused) proyectiles(this); } catch (e) { if (!P._ckHitAv) { P._ckHitAv = 1; console.warn('[hitboxes]', e); } }
    return r;
  };

  window.CK_HITBOXES = { carne, rectoGolpe, puntas, tocan, distCaja, visibles, unionAnim, TOL };
})();
