'use strict';
/* Orcos más grandes y sus bestias (03/11, pedido del dueño).
   - Los orcos se ven un poco más grandes que los héroes (afuera el héroe es 1,2): orco 1,45, acorazado 1,5, jinete 1,55 y
     élite 1,62. El cuerpo de choque queda del tamaño de antes, así pasan por los mismos lugares.
   - Bestias de los orcos hechas con PixelLab (ck_frontera_bestias_arte.js): huargos y jabalíes de guerra, que salen en la
     Frontera Orca junto a los orcos. Gorak y los orcos quietos de los mapas también se agrandan.
   Borrar las 2 líneas de index.html lo deshace. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof ENEMY_TYPES === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCALA = { orc: 1.45, orc_armored: 1.5, orc_rider: 1.55, orc_elite: 1.62 };
  const ARTE = window.CK_BESTIAS_ARTE;

  // ------------------------------------------------------------------ bestias nuevas
  if (ARTE && ARTE.cuadros) {
    if (ARTE.cuadros.warg && !ENEMY_TYPES.warg)
      ENEMY_TYPES.warg = { name: 'Huargo', frames: ARTE.cuadros.warg, hp: 3, speed: 140, dmg: 1, reach: 48, cd: 1100, hitAt: 240, xp: 16, coins: 3,
        scale: 1.3, sfx: ['beast_growl', 'beast_hurt', 'beast_death', 1.15] };
    if (ARTE.cuadros.boar && !ENEMY_TYPES.boar)
      ENEMY_TYPES.boar = { name: 'Jabalí de guerra', frames: ARTE.cuadros.boar, hp: 4, speed: 112, dmg: 1, reach: 46, cd: 1500, hitAt: 260, xp: 18, coins: 3,
        scale: 1.25, block: 0, sfx: ['beast_growl', 'beast_hurt', 'beast_death', 0.8] };
    Object.keys(ARTE.cuadros).forEach(t => ESCALA[t] = ENEMY_TYPES[t] && ENEMY_TYPES[t].scale);
  }
  const ORIG = {};
  Object.keys(ESCALA).forEach(t => { if (ENEMY_TYPES[t]) ORIG[t] = ENEMY_TYPES[t].scale || 1.2; });

  const crear0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = crear0.apply(this, arguments);
    try {
      const s = e && !e.def.boss && ESCALA[e.type];
      if (s) {
        // más grande de dibujo, mismo pie en el mundo (como antes a su escala vieja)
        const k = ARTE && ARTE.cuadros && ARTE.cuadros[e.type] ? 1.2 / s : ORIG[e.type] / s, w = 16 * k, h = 8 * k;
        const pie = (ARTE && ARTE.pies && ARTE.pies[e.type]) || 60;
        e.setScale(s);
        e.body.setSize(w, h);
        e.body.setOffset(50 - w / 2, pie - h);
      }
    } catch (er) { console.warn('[orcos grandes]', er); }
    return e;
  };

  // las bestias salen en la Frontera Orca, de día; a la noche, más huargos
  const ZB = 'ed_bosque_de_la_frontera.main', ZT = 'ed_tierras_orcas.main', ZP = 'ed_pueblo_orco.main', ZF = 'ed_fortaleza_orca.main';
  if (typeof ZONE_ENEMIES !== 'undefined' && ARTE && ARTE.cuadros) {
    const sumar = (z, l) => { if (ZONE_ENEMIES[z]) ZONE_ENEMIES[z] = ZONE_ENEMIES[z].concat(l.filter(q => ENEMY_TYPES[q[0]])); };
    sumar(ZB, [['warg', 760, 420, 40], ['boar', 600, 330, 36], ['warg', 860, 260, 40, 'night']]);
    sumar(ZT, [['warg', 380, 380, 40], ['warg', 820, 200, 40], ['boar', 560, 470, 30], ['warg', 300, 200, 40, 'night']]);
    sumar(ZP, [['boar', 760, 430, 30], ['warg', 470, 250, 30]]);
    sumar(ZF, [['warg', 420, 470, 30], ['warg', 640, 460, 30]]);
  }

  // los orcos quietos de los mapas (Gorak y los que miran) al mismo tamaño
  ['ed_bosque_de_la_frontera', 'ed_tierras_orcas', 'ed_pueblo_orco', 'ed_fortaleza_orca'].forEach(k => {
    const L0 = INTERIOR_LAYOUTS && INTERIOR_LAYOUTS[k];
    if (!L0) return;
    INTERIOR_LAYOUTS[k] = function (kit) {
      const r = L0.apply(this, arguments);
      try {
        const a = kit.areas && kit.areas.main;
        if (a) (a.items || []).forEach(it => { if (it.key && /^orc_(idle|armored_idle|elite_idle)$/.test(it.key) && (it.scale || 1) < 1.3) it.scale = 1.45; });
      } catch (e) {}
      return r;
    };
  });

  window.CK_FRONTERA_BESTIAS = { ESCALA };
})();
