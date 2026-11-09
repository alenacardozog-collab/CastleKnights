'use strict';
/* Daño inicial medido y emparejado (06/11, pedido del dueño: "mide el daño inicial del personaje").
   Medido en práctica (nivel 1, sin piedras de afilar), apretando J o K sin parar contra un orco que no se muere:
     héroe     J (daño × golpes/s = daño por segundo)      K
     Lancent   1 × 2,0 = 2,0                               flecha 1 × 1,6 = 1,6
     Horos     1 × 1,0 = 1,0  ← la mitad que los demás      bola de fuego 2 × 1,0 = 2,0 (+1 alrededor)
     Gork      1 × 2,0 = 2,0                               golpe de tierra 2 × 2,1 = 4,2 en área, gratis ← J no servía
     Aby       1,1,2 × 2,2 = 3,0                           estocadas 1,1,2 cada 1,1 s = 5,0 (en línea)
     Urso      1,1,2 × 1,4 = 1,75                          garras 2 + 2 cada 1,2 s (la segunda no salía: arreglado en ck_heroe_oso.js)
   Lo que cambia acá (dos cosas, chicas):
   - Horos: el ataque básico (la ráfaga de hielo) dura 1 s porque son 15 cuadros a 15 por segundo; ahora corre a 1,5×
     (0,67 s), así da 1,5 por segundo. Sigue siendo el más lento cuerpo a cuerpo, pero pega en área y de lejos.
   - Gork: el golpe de tierra cuesta 20 de aguante (como el dash cuesta 50 y las habilidades lo suyo). Son cinco seguidos
     y después uno por segundo; apretando sólo K ya no se saca 4,2 por segundo en área sin pagar nada.
   Lo demás queda igual: 1 corazón por golpe de J (Aby y Urso 2 cada tres), y las bestias del capítulo 1 aguantan de 1
   (limo, murciélago) a 7 (hombre oso, gran esqueleto); el Nigromante 24 y Grushak 30. El héroe arranca con 3 corazones:
   tres golpes de orco, o dos de hombre oso. Borrar la línea de index.html vuelve a lo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const HOROS = 1.5, TIERRA = 20;

  const pa0 = P.performAttack;
  P.performAttack = function () {
    const antes = this.isAttacking;
    const r = pa0.apply(this, arguments);
    try {
      if (!antes && this.isAttacking && this.playerHero === 'wizard' && this.player && this.player.anims) {
        const k = this.player.anims.currentAnim && this.player.anims.currentAnim.key;
        if (k === 'wizard_attack1') {
          this._ckHorosRapido = true;
          this.player.anims.timeScale = HOROS;
          this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { this._ckHorosRapido = false; if (this.player && this.player.anims) this.player.anims.timeScale = 1; });
        }
      }
    } catch (e) {}
    return r;
  };

  // updateFootsteps() vuelve el ritmo a 1 en cada cuadro para todo lo que no sea caminar: se lo vuelve a poner
  const uf0 = P.updateFootsteps;
  if (uf0)
    P.updateFootsteps = function () {
      const r = uf0.apply(this, arguments);
      try {
        const p = this.player;
        if (this._ckHorosRapido && p && p.anims && this.isAttacking && p.anims.currentAnim && p.anims.currentAnim.key === 'wizard_attack1') p.anims.timeScale = HOROS;
        else if (this._ckHorosRapido && !this.isAttacking) this._ckHorosRapido = false;
      } catch (e) {}
      return r;
    };

  const ps0 = P.performSpecialAttack;
  P.performSpecialAttack = function () {
    if (this.playerHero === 'orc' && !this.isAttacking && !this.isDead && !(this.combatLocked && this.combatLocked())) {
      if (this.stamina < TIERRA) { if (this.showLowStaminaWarning) this.showLowStaminaWarning('Golpe de tierra'); return; }
      const r = ps0.apply(this, arguments);
      if (this.isAttacking) { this.stamina = Math.max(0, this.stamina - TIERRA); if (this.updateStaminaBar) this.updateStaminaBar(); }
      return r;
    }
    return ps0.apply(this, arguments);
  };
  window.CK_BALANCE_DANO = { HOROS, TIERRA };
})();
