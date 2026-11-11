'use strict';
/* Bestias en el estilo de los héroes (10/11, pedido del dueño: "los enemigos están con mucho más detalle que los
   protagonistas y quedan raros; hacelos más tiny, a los jefes no tanto pero que encajen con el estilo").
   Las hojas nuevas (ck_bestias_chibi_arte.js, PixelLab) reemplazan a las viejas con la misma clave, así todo lo que
   ya las usa sigue andando:
   - HUARGO: chico como el hombre lobo, a la escala de los héroes (1,2).
   - GRUSHAK, el Caudillo: chibi, más grande y pesado que un orco (escala 1,15: unas 2 veces el héroe). Ataque 1: hachazo
     desde arriba; ataque 2: giro con el hacha.
   - JABALÍ chico (1,25) y GARRA NEGRA chibi (1; ataque 2: los dos puños contra el piso).
   - JEFES DEL COLISEO (Gorvak, Kragmor, Ulrak y Colmillo): hojas nuevas en lugar de las del coliseo, al píxel de los
     héroes (escala 1: unas 2 veces el héroe); caminan de costado (las vistas de frente y espalda eran del dibujo grande).
   - ORCO DEL CUERNO (nuevo, orc_corneta): el orco que llama refuerzos (ck_refuerzos.js). Lleva un cuerno de guerra de
     hueso: pega con el cuerno (ataque 1) y lo sopla para llamar (ataque 2). Mismo tamaño que los orcos.
   Las fotos de presentación no cambian. Borrar las dos líneas de index.html vuelve a las hojas de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof ENEMY_TYPES === 'undefined' || !window.CK_CHIBI_ARTE) return;
  const P = MainGameScene.prototype, A = window.CK_CHIBI_ARTE;
  window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
  const cuadros = t => { const f = {}; Object.keys(A[t]).forEach(a => { f[a] = A[t][a].n; window.GAME_ASSETS_BASE64[t + '_' + a] = A[t][a].img; }); return f; };

  if (A.warg && ENEMY_TYPES.warg) {
    Object.assign(ENEMY_TYPES.warg, { frames: cuadros('warg'), scale: 1.2, hitAt: 260 });
    const FB = window.CK_FRONTERA_BESTIAS; if (FB && FB.ESCALA) FB.ESCALA.warg = 1.2;
  }
  if (A.orc_corneta) {
    const o = ENEMY_TYPES.orc;
    ENEMY_TYPES.orc_corneta = { name: 'Orco del cuerno', frames: cuadros('orc_corneta'), hp: 3, speed: 90, dmg: 1, reach: 46, cd: 1500, hitAt: 260,
      xp: 14, coins: 3, scale: 1.45, sfx: (o && o.sfx) || ['orc_attack', 'orc_hurt', 'orc_death', 1] };
  }
  // jabalí (chico, como el huargo) y Garra Negra (jefe de los osos, chibi como Grushak; suma ataque 2: puñetazo al piso)
  if (A.boar && ENEMY_TYPES.boar) {
    Object.assign(ENEMY_TYPES.boar, { frames: cuadros('boar'), scale: 1.25, hitAt: 300 });
    const FB = window.CK_FRONTERA_BESTIAS; if (FB && FB.ESCALA) FB.ESCALA.boar = 1.25;
  }
  if (A.werebear_jefe && ENEMY_TYPES.werebear_jefe) Object.assign(ENEMY_TYPES.werebear_jefe, { frames: cuadros('werebear_jefe'), scale: 1, hitAt: 480 });

  // jefes del coliseo: sus hojas nuevas reemplazan a las del coliseo con el mismo nombre (elite_*, gorila_*, jinete_*),
  // de 100x100; las vistas de frente y de espaldas viejas se sacan (eran del dibujo grande); desde el 10/11 tienen las suyas
  // nuevas (walk_front, walk_back, al final de ck_bestias_chibi_arte.js) y caminan de frente o de espaldas cuando van arriba/abajo
  const CA = window.CK_COLISEO_ARTE, CC = A.coliseo;
  // (11/11) Gorvak, el campeón del escudo, rediseñado más chiquito ("quedó muy grande, rediseñalo más tiny"): dibujo nuevo
  // de PixelLab de unos 40 px de alto (el de antes, 54), a escala 1 como los otros dos
  const COL = { orc_campeon: { h: 'elite', w: 20, s: 1 }, bestia_kragmor: { h: 'gorila', w: 34, s: 1 }, cazador_ulrak: { h: 'jinete', w: 36, s: 1 } };
  if (CA && CC) Object.keys(CC).forEach(h => {
    Object.keys(CA).filter(k => k.indexOf(h + '_') === 0).forEach(k => delete CA[k]);
    Object.keys(CC[h]).forEach(an => { CA[h + '_' + an] = { img: CC[h][an].img, t: 100, n: CC[h][an].n }; });
  });
  const JEFE = 'orc_warlord';
  if (A[JEFE] && ENEMY_TYPES[JEFE]) Object.assign(ENEMY_TYPES[JEFE], { frames: cuadros(JEFE), scale: 1.15, hitAt: 400 });
  window.CK_CAUDILLO_CUADROS && A[JEFE] && Object.assign(window.CK_CAUDILLO_CUADROS, ENEMY_TYPES[JEFE] ? ENEMY_TYPES[JEFE].frames : {});

  // el coliseo pone a Grushak en 0,97 al cargar (sus cuadros viejos eran grandes): con los nuevos, 1,15
  const pr0 = P.preloadRoster;
  P.preloadRoster = function () {
    const r = pr0.apply(this, arguments);
    try {
      if (A[JEFE] && ENEMY_TYPES[JEFE]) ENEMY_TYPES[JEFE].scale = 1.15;
      if (CC) Object.keys(COL).forEach(id => { if (ENEMY_TYPES[id]) ENEMY_TYPES[id].scale = COL[id].s; }); // unas 2 veces el héroe (Gorvak, 1,5)
      if (CC && ENEMY_TYPES.orc_campeon) ENEMY_TYPES.orc_campeon.reach = 52;   // más chico, el brazo llega menos
    } catch (e) {}
    return r;
  };
  // cuerpos de choque: el orco del cuerno como los orcos (más grande de dibujo, mismo pie); Grushak con los pies en y=60
  const c0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = c0.apply(this, arguments);
    try {
      if (e && e.type === 'orc_corneta') { const k = 1.2 / 1.45, w = 16 * k, h = 8 * k; e.setScale(1.45); e.body.setSize(w, h); e.body.setOffset(50 - w / 2, 60 - h); }
      if (e && e.type === JEFE && A[JEFE]) { e.setScale(1.15); e.body.setSize(20, 8); e.body.setOffset(40, 52); }
      const C = e && CC && COL[e.type];
      if (C) { e.setScale(C.s); e.body.setSize(C.w, 10); e.body.setOffset(50 - C.w / 2, 50); }
      if (e && e.type === 'werebear_jefe' && A.werebear_jefe) { e.setScale(1); e.body.setSize(22, 9); e.body.setOffset(39, 51); }
    } catch (er) {}
    return e;
  };
  // el golpe de Grushak suena cuando el hacha baja (hachazo contra el piso) o gira (dos silbidos): ElevenLabs
  const SON_JEFE = { 1: ['ck_hachazo', 100], 2: ['ck_giro_hacha', 120] };
  const m0 = P.enemyMeleeAttack;
  if (m0) P.enemyMeleeAttack = function (enemy, def) {
    const m = m0.apply(this, arguments);
    try {
      const s = enemy && enemy.type === JEFE && SON_JEFE[m.n];
      if (s && typeof sfx !== 'undefined') {
        const warn = def.dmg > 1 || m.n === 3 ? 380 : 0, sw = enemy.swingId; // ya numerado: si lo frenan, cambia y no suena
        this.time.delayedCall(Math.max(0, m.hitAt + warn - s[1]), () => { if (enemy.active && !enemy.isDead && enemy.swingId === sw) sfx.fx(s[0], 0.75, { rate: 0.95 + Math.random() * 0.1 }); });
      }
    } catch (er) {}
    return m;
  };
  window.CK_BESTIAS_CHIBI = { A };
})();
