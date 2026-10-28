'use strict';
/* Ataques y dash de Lancent y Aby de frente y de espaldas (23/10, hechos con PixelLab a partir de su quieto de frente / espaldas).
   Antes, mirando arriba o abajo, el ataque 2, el ataque 3 y el dash de Lancent y los ataques 2 y 3 de Aby se veían de costado.
   Las hojas están en js/hero_dir3_assets.js (window.GAME_ASSETS_BASE64.<héroe>_<animación>_<front|back>).
   El dash de Aby usa su caminar, que ya tenía las cuatro direcciones.
   Borrar la línea de este archivo (y la de hero_dir3_assets.js) en index.html deja todo como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  // clave: [cuadros, velocidad] — duran lo mismo que la versión de costado, así los golpes caen a tiempo
  const ANIMS = {
    soldier_attack2: [8, 18],
    soldier_attack3: [8, 16],
    soldier_dash: [8, 18],
    swordsman_attack2: [15, 16],
    swordsman_attack3: [12, 16]
  };
  const B = () => window.GAME_ASSETS_BASE64 || {};
  const claves = () => Object.keys(ANIMS).flatMap(a => ['front', 'back'].map(v => [a + '_' + v, ANIMS[a]])).filter(([k]) => B()[k]);

  const p0 = P.preloadRoster;
  P.preloadRoster = function (getAsset) {
    const r = p0.apply(this, arguments);
    claves().forEach(([k]) => { if (!this.textures.exists(k)) this.load.spritesheet(k, getAsset(k, k), { frameWidth: 100, frameHeight: 100 }); });
    return r;
  };

  const c0 = P.createRosterAnimations;
  P.createRosterAnimations = function () {
    // antes que el original: el segundo golpe de Lancent ya no reusa el primero
    claves().forEach(([k, [n, rate]]) => {
      if (this.anims.exists(k) || !this.textures.exists(k)) return;
      const total = this.textures.get(k).frameTotal - 1;
      this.anims.create({ key: k, frames: this.anims.generateFrameNumbers(k, { start: 0, end: Math.min(n, total) - 1 }), frameRate: rate, repeat: 0 });
    });
    return c0.apply(this, arguments);
  };

  const h0 = P.heroAnim;
  P.heroAnim = function (key) {
    if (this.facingV && typeof key === 'string' && ANIMS[key]) {
      const k = key + '_' + this.facingV;
      if (this.anims.exists(k)) return k;
    }
    return h0.apply(this, arguments);
  };
  window.CK_DIRECCIONES_ATAQUES = { ANIMS };
})();
