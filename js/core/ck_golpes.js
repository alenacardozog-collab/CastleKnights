'use strict';
/* Sensación de golpe (23/10, pulido del Capítulo 1):
   - al pegar: chispa blanca en el enemigo y el número de daño "salta" (aparece grande y se achica);
   - al recibir daño: el héroe muestra su "-1" en rojo, además del parpadeo y la sacudida que ya tenía;
   - al vencer una bestia: las monedas saltan del suelo y vuelan hacia el héroe, con su "+N monedas".
   La micro-pausa al pegar (hitStop) ya estaba en combat.js. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);

  const texturas = S => {
    const T = S.textures;
    if (!T.exists('ckg_moneda')) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 7;
      const g = cv.getContext('2d');
      g.fillStyle = '#7a4a12'; g.fillRect(1, 0, 5, 7); g.fillRect(0, 1, 7, 5);
      g.fillStyle = '#f2b33d'; g.fillRect(1, 1, 5, 5);
      g.fillStyle = '#ffe28a'; g.fillRect(2, 1, 2, 2);
      g.fillStyle = '#c9861f'; g.fillRect(4, 4, 2, 2);
      T.addCanvas('ckg_moneda', cv);
    }
    if (!T.exists('ckg_chispa')) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 3;
      const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(1, 0, 1, 3); g.fillRect(0, 1, 3, 1);
      T.addCanvas('ckg_chispa', cv);
    }
  };

  // el número de daño salta: lo último que se escribió con createFloatingText, si es un número.
  // Se instala cuando ya cargaron todos los archivos: la UI nueva (ck_ui_castillo.js, más abajo en index.html) reemplaza createFloatingText.
  const instalarSalto = () => {
  const flot0 = P.createFloatingText;
  P.createFloatingText = function (x, y, msg) {
    const r = flot0.apply(this, arguments);
    try {
      if (/^[-+]\d/.test(String(msg))) {
        const t = this.children.list[this.children.list.length - 1];
        if (t && t.type === 'Text' && t.text === String(msg)) {
          t.setScale(1.5);
          this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
        }
      }
    } catch (e) {}
    return r;
  };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarSalto); else instalarSalto();

  const chispa = (S, x, y) => {
    texturas(S);
    const p = S.add.particles(x, y, 'ckg_chispa', {
      speed: { min: 60, max: 140 }, angle: { min: 0, max: 360 }, lifespan: { min: 120, max: 240 },
      scale: { start: 1.4, end: 0.4 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xfff1b8, 0xffd36b], blendMode: 'ADD', emitting: false
    }).setDepth(30000);
    p.explode(7);
    S.time.delayedCall(400, () => p.destroy());
  };

  const dano0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const vivo = enemy && !enemy.isDead, hp = enemy && enemy.hp;
    const r = dano0.apply(this, arguments);
    try { if (vivo && enemy.hp < hp) chispa(this, enemy.x, enemy.y - 14); } catch (e) {}
    return r;
  };

  const heroe0 = P.damagePlayer;
  P.damagePlayer = function (amount) {
    const antes = this.health;
    const r = heroe0.apply(this, arguments);
    try {
      if (this.health < antes && this.player) this.createFloatingText(this.player.x, this.player.y - 46, '-' + (antes - this.health), 0xff5a4f);
    } catch (e) {}
    return r;
  };

  // las monedas saltan y vuelan al héroe
  const vencido0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy, def) {
    const r = vencido0 ? vencido0.apply(this, arguments) : undefined;
    try {
      if (this._gameMode !== 'campaign' || !enemy || !def || !def.coins || !this.player) return r;
      texturas(this);
      // (13/11, pedido: "quitá los íconos de monedas que salen arriba de algunas criaturas"): ya no saltan monedas dibujadas
      // sobre la bestia vencida; queda el aviso de "+N monedas" y el sonido
      const n = 0, pl = this.player;
      if (typeof sfx !== 'undefined') sfx.fx('coin', 0.35, { minGap: 120 });
      for (let i = 0; i < n; i++) {
        const m = this.add.image(enemy.x, enemy.y - 6, 'ckg_moneda').setDepth(29999);
        const dx = R(-22, 22), alto = R(18, 30), espera = 260 + i * 50;
        this.tweens.add({ targets: m, x: enemy.x + dx, duration: espera, ease: 'Linear' });
        this.tweens.add({ targets: m, y: enemy.y - 6 - alto, duration: espera / 2, ease: 'Quad.easeOut', yoyo: true });
        this.time.delayedCall(espera + 120, () => {
          if (!m.active) return;
          this.tweens.add({
            targets: m, x: pl.x, y: pl.y - 12, scale: 0.6, duration: 260, ease: 'Quad.easeIn',
            onComplete: () => { m.destroy(); if (i === 0 && typeof sfx !== 'undefined') sfx.fx('coin', 0.35, { minGap: 120 }); }
          });
        });
      }
      this.time.delayedCall(520, () => { if (this.player) this.createFloatingText(this.player.x + 18, this.player.y - 30, `+${def.coins} monedas`, 0xfcd34d); });
    } catch (e) { console.warn('[golpes]', e); }
    return r;
  };
})();
