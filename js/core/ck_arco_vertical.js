'use strict';
/* Lancent tira flechas hacia abajo y hacia arriba (24/10, pedido del dueño).
   Antes, mirando abajo/arriba, el disparo con arco (ataque especial) mostraba una estocada y la flecha salía de costado.
   Ahora: disparo con el arco de frente (arco cruzado delante del cuerpo, flecha hacia abajo) y de espaldas (arco detrás
   de la cabeza, flecha hacia arriba), dibujados píxel a píxel sobre su quieto (8 cuadros, suelta en el 5.º, como de costado).
   La flecha vuela derecho hacia abajo o hacia arriba, con el choque girado.
   Hojas también en assets/characters/soldier/bow_front.png y bow_back.png. Borrar la línea de index.html lo deshace. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const HOJAS = {
    soldier_bow_front: 'data:image/png;base64,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',
    soldier_bow_back: 'data:image/png;base64,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'
  };
  const pr0 = P.preload;
  P.preload = function () {
    Object.keys(HOJAS).forEach(k => { if (!this.textures.exists(k)) this.load.spritesheet(k, HOJAS[k], { frameWidth: 100, frameHeight: 100 }); });
    return pr0.apply(this, arguments);
  };
  const anims = S => Object.keys(HOJAS).forEach(k => {
    if (S.anims.exists(k) || !S.textures.exists(k)) return;
    S.anims.create({ key: k, frames: S.anims.generateFrameNumbers(k, { start: 0, end: 7 }), frameRate: 16, repeat: 0 });
  });
  const h0 = P.heroAnim;
  P.heroAnim = function (key) {
    if (key === 'soldier_attack3' && this.facingV) {
      anims(this);
      const k = 'soldier_bow_' + this.facingV;
      if (this.anims.exists(k)) return k;
    }
    return h0.apply(this, arguments);
  };

  const s0 = P.shootArrow;
  P.shootArrow = function () {
    const v = this.facingV;
    if (!v || !this.player) return s0.apply(this, arguments);
    const p = this.player, k = Math.abs(p.scaleY) || 1;
    const abajo = v === 'front';
    const x = p.x, y = p.y + (abajo ? 18 : -6) * k;   // hacia arriba sale detrás del cuerpo, a la altura de los pies (choca con lo mismo que el héroe)
    const arrow = this.projectiles.create(x, y, 'arrow');
    arrow.isFireball = false;
    arrow.setScale(1.2);
    arrow.setAngle(abajo ? 90 : -90);
    arrow.setDepth(abajo ? Math.max(10, Math.round(y + 16)) : Math.max(10, Math.round(p.depth - 1)));
    arrow.body.setAllowGravity(false);
    arrow.body.setSize(10, 22);
    arrow.setVelocityY(abajo ? 460 : -460);
    if (!abajo) this.time.delayedCall(110, () => { if (arrow.active) arrow.setDepth(Math.max(10, Math.round(arrow.y + 16))); });
    this.time.delayedCall(2000, () => { if (arrow && arrow.active) arrow.destroy(); });
    return arrow;
  };
  window.CK_ARCO_VERTICAL = { HOJAS };
})();
