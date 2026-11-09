'use strict';
/* Cadáveres (03/11, pedido del dueño): los enemigos muertos quedan tirados en el piso un rato largo en vez de
   desaparecer al segundo.
   - Cuando un enemigo muere se deja que termine su animación de muerte, y ahí se cambia por una figura quieta
     (el último cuadro) que ya no es enemigo: no cuenta para "quedan enemigos", no choca y no se puede pegar.
   - Queda DURA ms y después se desvanece despacio. Como mucho MAX en pantalla (los más viejos se van primero).
   - Al cambiar de zona se limpian.
   Borrar su línea de index.html vuelve a como estaba (se iban al segundo). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const DURA = 25000, DESVANECE = 3000, MAX = 30;

  const quitarTodos = S => {
    (S._ckCadaveres || []).forEach(c => { try { S.tweens.killTweensOf(c); c.destroy(); } catch (e) {} });
    S._ckCadaveres = [];
  };
  const desvanecer = (S, c, ms) => {
    if (!c.active || c._ckYendo) return;
    c._ckYendo = true;
    S.tweens.add({ targets: c, alpha: 0, duration: ms, onComplete: () => {
      c.destroy();
      S._ckCadaveres = (S._ckCadaveres || []).filter(o => o !== c);
    } });
  };

  const tirar = (S, e) => {
    if (!e.active || e._ckTirado) return;
    e._ckTirado = true;
    const c = S.add.sprite(e.x, e.y, e.texture.key, e.frame.name)
      .setOrigin(e.originX, e.originY).setScale(e.scaleX, e.scaleY).setFlipX(e.flipX).setFlipY(e.flipY)
      .setDepth(Math.max(5, (e.depth || 0) - 4));
    if (e.isTinted && e.tintTopLeft !== 0xff3333) c.setTint(e.tintTopLeft);
    e.destroy();
    S._ckCadaveres = S._ckCadaveres || [];
    S._ckCadaveres.push(c);
    const vivos = S._ckCadaveres.filter(o => !o._ckYendo);
    if (vivos.length > MAX) desvanecer(S, vivos[0], 600);
    S.time.delayedCall(DURA, () => desvanecer(S, c, DESVANECE));
  };

  const dmg0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const vivo = !!(enemy && enemy.active && !enemy.isDead);
    const r = dmg0.apply(this, arguments);
    if (vivo && enemy.isDead && enemy.active) {
      try {
        // se cancela el "desvanecer y borrar" de siempre; el enemigo termina de caerse y queda el cadáver
        this.tweens.killTweensOf(enemy);
        enemy.setAlpha(1);
        const listo = () => tirar(this, enemy);
        const anim = enemy.anims && enemy.anims.currentAnim;
        if (anim && /_death$/.test(anim.key) && enemy.anims.isPlaying) enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, listo);
        this.time.delayedCall(2200, listo);   // por si la animación no avisa (o no hay animación de muerte)
      } catch (e) { console.warn('[cadáveres]', e); }
    }
    return r;
  };

  ['onAreaShown', 'onVillageShown', 'endStory'].forEach(k => {
    const f0 = P[k];
    P[k] = function () {
      try { quitarTodos(this); } catch (e) {}
      return f0 ? f0.apply(this, arguments) : undefined;
    };
  });

  window.CK_CADAVERES = { DURA, MAX, quitarTodos };
})();
