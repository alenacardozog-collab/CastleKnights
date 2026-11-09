'use strict';
/* Vida más fina (07/11, pedido del dueño: "agregá todo eso"). Hasta ahora todo se contaba en corazones enteros: un golpe
   sacaba 1, la piedra de afilar sumaba +1 (¡+100 % de daño la primera!) y las mejoras saltaban de a escalones.
   Ahora el daño a las bestias se cuenta en cuartos de corazón:
   - la vida de las bestias sigue igual (un orco aguanta 2 corazones), pero el daño puede ser 1, 1¼, 1½…;
   - los números que saltan al pegar se muestran en PUNTOS (4 por corazón): el golpe básico muestra "-4";
   - la piedra de afilar suma medio corazón (+50 % del golpe básico, "+2"), no uno entero; el equipo (ck_equipo.js) suma
     de a cuartos. Los demás bonus (grito, críticos, habilidades) siguen igual que antes;
   - las bestias que crecen con el nivel (ck_balance.js) ya no se redondean a corazones enteros.
   La vida del héroe sigue en corazones enteros. Borrar la línea de index.html vuelve a lo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PUNTOS = 4, PIEDRA = 0.5;
  const q = v => Math.round(v * PUNTOS) / PUNTOS;
  let dentro = 0;

  // bonus de daño en corazones: piedras (medio cada una) + lo que sume el equipo
  const piedras = S => (S._gameMode === 'campaign' && S.story && S.story.up && S.story.up.atk) || 0;
  const bonus = S => {
    if (S._gameMode !== 'campaign' || !S.story) return 0;
    const eq = window.CK_EQUIPO_NIVELES ? window.CK_EQUIPO_NIVELES.dano(S) : 0;
    return PIEDRA * piedras(S) + eq;
  };
  // la base (combat.js) suma la piedra entera al golpe: se le pasa el golpe ya con el bonus nuevo y sin esa piedra
  // (así la partida guardada nunca ve las piedras tocadas)
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    if (!enemy || enemy.isDead || amount >= 10) return de0.apply(this, arguments);
    const a = q((amount || 0) + bonus(this)) - piedras(this);
    dentro++;
    try { return de0.call(this, enemy, a, sx, sy); } finally { dentro--; }
  };
  // dentro de un golpe, "-1.5" se muestra "-6" (se pone al final: ck_ui_castillo.js reemplaza createFloatingText entero)
  const textoPuntos = () => {
    if (P.createFloatingText._ckPuntos) return;
    const ft0 = P.createFloatingText;
    P.createFloatingText = function (x, y, txt) {
      if (dentro && typeof txt === 'string' && /^-\d+(\.\d+)?$/.test(txt)) arguments[2] = '-' + Math.round(parseFloat(txt.slice(1)) * PUNTOS);
      return ft0.apply(this, arguments);
    };
    P.createFloatingText._ckPuntos = true;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', textoPuntos); else textoPuntos();
  // las bestias que crecen: sin redondear a corazones enteros
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = se0.apply(this, arguments);
    try {
      if (e && e.def && e._ckGrado && !e._ckFina) {
        e._ckFina = true;
        const base = (ENEMY_TYPES[e.type] || e.def).hp, jefe = !!e.def.boss, t = e._ckGrado;
        const mv = jefe ? Math.min(1.35, 1 + 0.035 * t) : Math.min(1.7, 1 + 0.07 * t);
        e.hp = e.maxHp = Math.max(base, q(base * mv * (e._ckVeterana ? 1.5 : 1)));
      }
    } catch (er) {}
    return e;
  };
  // textos de la tienda
  const textos = () => {
    if (typeof SHOP_ITEMS === 'undefined') return;
    const w = SHOP_ITEMS.find(i => i.id === 'whet'); if (w) w.desc = '+50 % de daño en cada golpe, para siempre (máx. 2).';
    const F = window.CK_ECONOMIA_FRONTERA; if (F && F.EXTRA && F.EXTRA.whet) F.EXTRA.whet.desc = '+50 % de daño en cada golpe (máx. 3). La tercera la trae Tomás.';
  };
  textos(); setTimeout(textos, 0);
  window.CK_VIDA_FINA = { PUNTOS, PIEDRA, bonus };
})();
