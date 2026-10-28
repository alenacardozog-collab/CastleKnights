'use strict';
/* Balance de velocidad y bestias que crecen con el héroe (24/10).
   VELOCIDAD
   - El héroe camina a 105 (antes 115) y corre a 160 (antes 180). "Pies ligeros" de Aby sigue sumando encima.
   - Las bestias van un 14% más lento y ninguna pasa de 106 al perseguir (el lobo, el murciélago y el jinete se sentían
     como flechas). Al caminar en grupo se empujaban entre ellas y sumaban velocidad: ahora no pasan de su velocidad.
   BESTIAS QUE CRECEN (sólo en la campaña)
   - Cada nivel del héroe después del primero es un "grado" (máximo 10; las piedras de afilar suman medio grado).
     Por grado: +7% de vida (máx. +70%), +1,2% de velocidad (máx. +12%), atacan 2,5% más seguido (máx. 22%)
     y dan 6% más de experiencia. El daño que hacen NO cambia: nunca te sacan más corazones por golpe.
   - Desde el nivel 4 algunas salen VETERANAS (4% por grado, máx. 25%): un poco más grandes, 50% más de vida,
     más experiencia y una marca dorada sobre la cabeza.
   - El jefe crece la mitad y nunca es veterano.
   Sacar la línea de index.html vuelve a todo como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  const VEL = { caminar: 105, correr: 160, antes: [115, 180] };
  const BESTIA = { factor: 0.86, tope: 106 };

  // ------------------------------------------------------------------ velocidad de las bestias (tabla de characters.js)
  try {
    if (typeof ENEMY_TYPES !== 'undefined')
      Object.keys(ENEMY_TYPES).forEach(k => {
        const d = ENEMY_TYPES[k];
        if (d && typeof d.speed === 'number' && !d._ckVel) { d._ckVel = d.speed; d.speed = Math.min(BESTIA.tope, Math.round(d.speed * BESTIA.factor)); }
      });
  } catch (e) {}

  // al perseguir en grupo se empujaban entre ellas y la suma las hacía correr de más
  const me0 = P.moveEnemyTo;
  if (me0)
    P.moveEnemyTo = function (enemy, gx, gy, speed) {
      const r = me0.apply(this, arguments);
      try {
        if (r === 'walking' && enemy.body && speed > 0) {
          const v = enemy.body.velocity, m = Math.hypot(v.x, v.y), mx = speed * 1.08;
          if (m > mx) enemy.body.setVelocity(v.x * mx / m, v.y * mx / m);
        }
      } catch (e) {}
      return r;
    };

  // ------------------------------------------------------------------ velocidad del héroe
  const ajustarHeroe = S => {
    if (S._ckVelOk) return;
    S._ckVelOk = true;
    if (S.playerSpeed === VEL.antes[0]) S.playerSpeed = VEL.caminar;
    if (S.playerRunSpeed === VEL.antes[1]) S.playerRunSpeed = VEL.correr;
    const b = S._ckBase;   // lo que guarda ck_habilidades para "Pies ligeros"
    if (b) { if (b.walk === VEL.antes[0]) b.walk = VEL.caminar; if (b.run === VEL.antes[1]) b.run = VEL.correr; }
  };

  // ------------------------------------------------------------------ bestias que crecen con el héroe
  const grado = S => {
    const s = S.story;
    if (S._gameMode !== 'campaign' || !s) return 0;
    return Math.min(10, Math.max(0, (s.level || 1) - 1 + 0.5 * ((s.up && s.up.atk) || 0)));
  };
  const escalar = (S, e) => {
    const t = grado(S), d = e.def;
    if (!t || !d || e._ckGrado !== undefined) return;
    e._ckGrado = t;
    const jefe = !!d.boss;
    const vet = !jefe && t >= 3 && Math.random() < Math.min(0.25, 0.04 * t);
    const mv = jefe ? Math.min(1.35, 1 + 0.035 * t) : Math.min(1.7, 1 + 0.07 * t);
    const hp = Math.max(d.hp, Math.round(d.hp * mv * (vet ? 1.5 : 1)));
    e.def = Object.assign({}, d, {
      speed: d.speed * Math.min(1.12, 1 + 0.012 * t * (jefe ? 0.5 : 1)),
      cd: Math.round(d.cd * Math.max(0.78, 1 - 0.025 * t * (jefe ? 0.5 : 1))),
      xp: Math.round(d.xp * (1 + 0.06 * t) * (vet ? 1.6 : 1)),
      block: d.block ? Math.min(0.45, d.block + 0.015 * t) : d.block
    });
    e.hp = e.maxHp = hp;
    if (hp > 2 && !e.hpBar) {   // con más vida también lleva barra
      e.hpBar = S.add.graphics().setDepth(26000);
      e.once('destroy', () => { if (e.hpBar) e.hpBar.destroy(); if (e.nameTag) e.nameTag.destroy(); });
    }
    if (vet) { e._ckVeterana = true; e.setScale(e.scaleX * 1.08, e.scaleY * 1.08); }
  };
  const se0 = P.spawnEnemy;
  if (se0)
    P.spawnEnemy = function () {
      const e = se0.apply(this, arguments);
      try { if (e && e.active) escalar(this, e); } catch (er) {}
      return e;
    };

  // marca dorada de las veteranas (sobre la barra de vida) y algún brillo
  let marca = null;
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      ajustarHeroe(this);
      if (!this.enemies) return r;
      if (!marca || !marca.active || marca.scene !== this) marca = this.add.graphics().setDepth(26002);
      marca.clear();
      if (this._gameMode !== 'campaign') return r;
      const t = this.time.now;
      this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || !e._ckVeterana) return;
        const x = Math.round(e.body ? e.body.center.x : e.x), y = Math.round((e.body ? e.body.bottom : e.y + 12) - 24 * (e.scaleY || 1.2) / 1.2 - 5);   // sobre la cabeza
        marca.fillStyle(0x2a1a06, 0.9); marca.fillRect(x - 3, y - 2, 7, 5); marca.fillRect(x - 2, y - 3, 5, 7);
        marca.fillStyle(0xffd27a, 1); marca.fillRect(x - 2, y - 1, 5, 3); marca.fillRect(x - 1, y - 2, 3, 5);
        marca.fillStyle(0xfff4c2, 1); marca.fillRect(x, y - 1, 1, 1);
        if (Math.floor(t / 120 + e.x) % 9 === 0) { marca.fillStyle(0xffffff, 0.9); marca.fillRect(x + 4, y - 4, 1, 3); marca.fillRect(x + 3, y - 3, 3, 1); }
      });
    } catch (e) {}
    return r;
  };

  // aviso suave al subir de nivel en los grados pares
  const g0 = P.gainXP;
  if (g0)
    P.gainXP = function () {
      const n0 = this.story && this.story.level;
      const r = g0.apply(this, arguments);
      try {
        const n1 = this.story && this.story.level;
        if (n1 > n0 && [3, 5, 7, 9].indexOf(n1) >= 0 && window.CK_SIN_CARTELES_API)
          this.time.delayedCall(1800, () => window.CK_SIN_CARTELES_API.nota('Las bestias del norte se vuelven más fuertes…'));
      } catch (e) {}
      return r;
    };

  window.CK_BALANCE = { VEL, BESTIA, grado };
})();
