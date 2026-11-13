'use strict';
/* Peso del golpe (12/11, de la lista "haz todo eso": "hitstop de 40 ms y sacudida").
   El golpe cuerpo a cuerpo ya frenaba 40/70 ms y sacudía (combat.js). Esto suma lo que faltaba:
   - flechas, bolas de fuego y habilidades que pegan: freno de 30 ms y una sacudida chiquita;
   - pegarle a un jefe: freno un poco más largo (55 ms);
   - el golpe que voltea a un jefe o a un enemigo fuerte: freno de 110 ms, sacudida fuerte y un destello blanco.
   No se suma al freno del golpe cuerpo a cuerpo (si ese ya frenó, éste no hace nada).
   Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const JEFES = { orc_campeon: 1, bestia_kragmor: 1, cazador_ulrak: 1, orc_warlord: 1, werebear_jefe: 1, nigromante: 1, garra_negra: 1, grushak: 1 };
  const esJefe = e => !!((e.def && e.def.boss) || JEFES[e.type] || (window.CK_JEFES_FX && CK_JEFES_FX.JEFES && CK_JEFES_FX.JEFES[e.type]));
  const fuerte = e => esJefe(e) || (e.maxHp || 0) >= 8;

  const flash = (S, e) => {
    try {
      e.setTintFill && e.setTintFill(0xffffff);
      S.time.delayedCall(70, () => { if (e.active) e.clearTint(); });
    } catch (er) {}
  };

  // el freno se puede alargar: si ya está frenado y llega uno más largo, termina cuando termina el más largo
  P.hitStop = function (ms) {
    if (!this.physics || !this.physics.world) return;
    const fin = performance.now() + ms;
    if (this._hitStop) { if (fin > (this._ckStopFin || 0)) this._ckStopFin = fin; return; }
    this._hitStop = true; this._ckStopFin = fin;
    this.physics.world.pause(); this.anims.pauseAll();
    const soltar = () => {
      const q = this._ckStopFin - performance.now();
      if (q > 2) return setTimeout(soltar, q);
      this._hitStop = false;
      // igual que combat.js: el menú de pausa y las tiendas dejan el mundo quieto
      if (!this.isGamePaused && !this._overlay) { this.physics.world.resume(); this.anims.resumeAll(); }
    };
    setTimeout(soltar, ms);
  };

  const dmg0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    const vivo = enemy && !enemy.isDead, hp0 = enemy ? enemy.hp : 0;
    const r = dmg0.apply(this, arguments);
    try {
      if (!vivo || !enemy || enemy.hp >= hp0) return r;                 // bloqueado o sin daño
      const S = this, mato = enemy.isDead, jefe = esJefe(enemy), grande = fuerte(enemy);
      // después del golpe cuerpo a cuerpo (que llama a hitStop justo al volver): si ése ya frenó, acá no se suma
      queueMicrotask(() => {
        if (!S.physics || !S.physics.world || S.combatLocked && S.combatLocked()) return;
        if (mato && grande) {                                            // el final siempre pesa (alarga el freno si ya había)
          flash(S, enemy);
          S.hitStop(110);
          S.cameras.main.shake(220, jefe ? 0.008 : 0.005);
          return;
        }
        if (S._hitStop) return;
        S.hitStop(jefe ? 55 : 30);
        S.cameras.main.shake(jefe ? 110 : 70, jefe ? 0.0035 : 0.002);
      });
    } catch (e) {}
    return r;
  };
  window.CK_PESO_GOLPE = { esJefe, fuerte };
})();
