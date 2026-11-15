'use strict';
/* Orcos en el Claro de las Bestias (14/11, nota 93 del dueño: "aca tambien aparecen algunos orcos q pelean contra las bestias
   pero en menor cantidad, y tambien nos atacan").
   - Junto al estandarte orco de la entrada (abajo a la derecha) salen orcos: dos al llegar y, cada tanto, otro, siempre
     menos que las bestias (como mucho 3 a la vez).
   - Van por la bestia más cercana y las bestias les contestan: se pelean entre ellos (cada golpe es el de siempre, con su
     animación y su daño). Si el héroe se les acerca, van por él (el juego ya hace eso con los guardias: el más cercano).
   Cómo: cada bestia u orco del claro tiene un "doble" que el juego trata como a un guardia que pelea (npcTakeHit); el golpe
   que recibe ese doble se pasa al enemigo de verdad (damageEnemy), sin el freno ni la sacudida del golpe del héroe.
   Borrar su línea de index.html los saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = 'ed_claro_de_las_bestias.main';
  const SALEN = [[1150, 640], [1180, 600], [1120, 560], [1200, 540]];   // al pie del estandarte de la calavera
  const LEJOS = [[1310, 480], [1270, 560]];                          // si el héroe está encima del estandarte, por la torre
  const MAX = 3, CADA = 32000;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const vivo = e => e && e.active && !e.isDead && e.body;
  const esOrco = e => /^orc/.test(e.type || '');
  const azar = (a, b) => a + Math.random() * (b - a);

  /** El "doble" de un enemigo: el juego lo trata como a un guardia (sprite con los pies en y). */
  const doble = e => e._ckDoble || (e._ckDoble = {
    _ckEnemigo: e, role: 'guard', hp: 99, maxHp: 99, fight: true,
    get down() { return !vivo(e); },
    sprite: {
      get x() { return e.x; }, get y() { return e.y + 26; }, get active() { return vivo(e); },
      setFlipX() { return this; }, setTint() { return this; }, clearTint() { return this; }, setPosition() { return this; }, play() { return this; }
    }
  });
  const nh0 = P.npcTakeHit;
  P.npcTakeHit = function (a, dmg, enemy) {
    if (a && a._ckEnemigo) {
      const v = a._ckEnemigo;
      if (vivo(v) && v !== enemy) {
        this._ckGolpeAjeno = true;
        try { this.damageEnemy(v, dmg || 1, enemy ? enemy.x : v.x, enemy ? enemy.y : v.y); } finally { this._ckGolpeAjeno = false; }
      }
      return;
    }
    return nh0 ? nh0.apply(this, arguments) : undefined;
  };

  // lo que se matan entre ellos no es del héroe: ni experiencia, ni monedas, ni logros
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    if (this._ckGolpeAjeno && zona(this) === Z) return;
    return ve0 ? ve0.apply(this, arguments) : undefined;
  };

  const traer = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a) return null;
    const lejos = SALEN.every(([x, y]) => Phaser.Math.Distance.Between(S.player.x, S.player.y, a.x + x, a.y + y) < 160);
    const [x, y] = (lejos ? LEJOS : SALEN)[Math.floor(Math.random() * (lejos ? LEJOS : SALEN).length)];
    const t = Math.random() < 0.3 && ENEMY_TYPES.orc_armored ? 'orc_armored' : 'orc';
    const e = S.spawnEnemy(a.x + x + azar(-8, 8), a.y + y - 26 + azar(-6, 6), t);
    if (!e) return null;
    e.zone = Z; e._ckClaroOrco = true; e._ckRefuerzo = true;      // (no llaman refuerzos con el cuerno)
    e.hp = e.maxHp = (e.maxHp || 2) * 2;                          // que la pelea con las bestias dure un poco
    e.setAlpha(0); S.tweens.add({ targets: e, alpha: 1, duration: 400 });
    return e;
  };
  const cerca = (S, e, lista, r) => {
    let m = null, md = r;
    lista.forEach(o => { const d = Phaser.Math.Distance.Between(e.x, e.y, o.x, o.y); if (d < md) { md = d; m = o; } });
    return m;
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      if (S._gameMode !== 'campaign' || zona(S) !== Z || !S.currentInterior || !S.enemies || S.isDead || S._ckEscena) { if (S._ckClaro && zona(S) !== Z) S._ckClaro = null; return r; }
      const a = S.currentInterior.area, now = S.time.now;
      if (!S._ckClaro || S._ckClaro.area !== a) S._ckClaro = { area: a, prox: now + 3000, n0: 2, mando: 0 };
      const C = S._ckClaro;
      if (now < C.mando) return r;
      C.mando = now + 600;
      const todos = S.enemies.getChildren().filter(e => vivo(e) && e.zone === Z);
      const orcos = todos.filter(e => e._ckClaroOrco), bestias = todos.filter(e => !esOrco(e));
      // que salgan: al llegar dos y después de a uno, siempre menos que las bestias
      const tope = Math.min(MAX, Math.max(1, Math.floor(bestias.length / 2)));
      if (now > C.prox && orcos.length < tope && bestias.length) {
        C.prox = now + (C.n0 > 1 ? 1200 : CADA);
        if (C.n0 > 0) C.n0--;
        traer(S);
      }
      // los orcos van por la bestia más cercana; las bestias que tienen un orco cerca le contestan
      orcos.forEach(o => {
        if (o._target && o._target.sprite && o._target.sprite.active) return;
        const b = cerca(S, o, bestias, 520); if (!b) return;
        o._target = doble(b); if (o.state !== 'chase' && S.alertEnemy) S.alertEnemy(o);
      });
      bestias.forEach(b => {
        if (b._target && b._target.sprite && b._target.sprite.active) return;
        const o = cerca(S, b, orcos, 240); if (!o) return;
        if (Phaser.Math.Distance.Between(b.x, b.y, S.player.x, S.player.y) < 140) return;   // con el héroe encima, van por él
        b._target = doble(o); if (b.state !== 'chase' && S.alertEnemy) S.alertEnemy(b);
      });
    } catch (e) { if (!P._ckClaroAv) { P._ckClaroAv = 1; console.warn('[claro orcos]', e); } }
    return r;
  };
  window.CK_CLARO_ORCOS = { doble, SALEN, MAX };
})();
