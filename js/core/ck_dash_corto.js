'use strict';
/* Dash más corto (10/11, pedido del dueño: "haz que el dash no sea tan largo, siento que recorre mucho").
   Antes: 440-480 px/s durante 340 ms (unos 150 px; el oso, 120). Ahora: 85 % de esa velocidad y se corta a los 240 ms
   (unos 90 px, el 60 %). La estela, el golpe a mitad de camino, el costo y la espera no cambian.
   Borrar su línea de index.html lo deja como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const VEL = 0.85, MS = 240;
  const da0 = P.performDash;
  P.performDash = function () {
    const antes = this.lastDashTime;
    const r = da0.apply(this, arguments);
    try {
      if (!this.isDashing || this.lastDashTime === antes || !this.player || !this.player.body) return r;
      const tok = this.lastDashTime, v = this.player.body.velocity;
      this.player.setVelocity(v.x * VEL, v.y * VEL);
      this.time.delayedCall(MS, () => {
        if (!this.isDashing || this.lastDashTime !== tok) return;
        this.isDashing = false;
        this.isInvulnerable = false;
        if (this.player && this.player.anims) this.player.anims.timeScale = 1;
        if (!this.isDead && this.player && this.player.body) {
          this.player.setVelocity(0, 0);
          const k = this.heroAnim ? this.heroAnim(this.playerHero + '_idle') : this.playerHero + '_idle';
          if (this.anims.exists(k)) this.player.play(k);
          else if (this.anims.exists(this.playerHero + '_idle')) this.player.play(this.playerHero + '_idle');
        }
      });
    } catch (e) { console.warn('[dash corto]', e); }
    return r;
  };
  window.CK_DASH_CORTO = { VEL, MS };
})();
