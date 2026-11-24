'use strict';
/* Arreglos de las notas del 23/11, tanda 9a (notas_para_corregir (5).json, 14 notas del dueño). Este archivo junta los chicos;
   los demás van en su propio archivo (ver TRASPASO 6.164).
   - Nota 7 ("si hay animación con diálogos u otra cosa, haz que los enemigos no nos ataquen hasta que acabe la animación"):
     mientras corre una escena (CK_ESCENA), los enemigos se quedan quietos y no empiezan golpes, y nada lastima al héroe.
   - Nota 8 ("acá está repetida Aby, poné sólo la que nos habla"): cuando toca la escena de Aby (o Lancent) en la aldea, el
     encuentro de ese mismo héroe (ck_heroes_npc.js) no se pone en esa visita a la aldea.
   - Nota 12 ("arreglar la transición al otro mapa, que sea desde esta zona"): la salida del Patio del Castillo al Patio de
     Armas es el arco del muro oeste, más abajo (x 22, y 232 a 298); se vuelve por el mismo arco.
   - Nota 13 ("el NPC que nos guía se queda parado aquí y nos dice que hasta ahí nos acompaña"): en el Gran Salón Pipo se queda
     a la entrada, al costado de la alfombra (284, 451), y dice que hasta ahí acompaña.
   - Nota 14 ("el NPC que nos guía se ve más pequeño en este mapa de lo que debería"): en la aldea, Pipo del mismo tamaño,
     al lado del héroe, que en el Camino y en el castillo (antes quedaba a la escala chica de los aldeanos de la aldea).
   - Nota 4 ("los aliados y enemigos no respetan el paso de las escaleras y el puente y atraviesan el foso"): el relleno de la
     grieta del Sendero (ck_notas_arreglos_3.js) se hacía al llegar, y si las escaleras se tendían después (la escena de la
     primera vez) quedaba cerrado justo donde están: ahora, apenas están las escaleras, la grieta se vuelve a rellenar con
     los dos pasos abiertos (y el puente), y el camino de todos se recalcula. Además la escalera de arriba apoyaba sus
     puntas sobre el borde de piedra de la grieta, que choca, y nadie llegaba a pisarla: se abre de orilla a orilla.
   Va después de ck_notas_arreglos_3.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => S.currentInterior && S.currentInterior.area;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});

  // ------------------------------------------------------------------ nota 7: en las escenas nadie ataca
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      if (this._ckEscena && this.enemies) {
        const now = this.time.now;
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead) return;
          if (e.body && e.body.enable && !e._ckMueveEscena) e.setVelocity(0, 0);
          if ((e.attackCooldown || 0) < now + 700) e.attackCooldown = now + 700;
        });
      }
    } catch (e) {}
    return r;
  };
  const dp0 = P.damagePlayer;
  P.damagePlayer = function () {
    if (this._ckEscena && !this._ckDanioEnEscena) return;
    return dp0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ nota 8: una sola Aby
  const quien = S => (S.playerHero === 'swordsman' ? 'soldier' : 'swordsman');
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      const S = this, s = st(S);
      if (s && zona(S) === 'village') {
        const f = fl(s);
        if (f.bruma_noche && !f.aby_interrumpe) S._ckAbyVisita = true;          // la escena va a salir en esta visita
        if (S._ckAbyVisita && S._ckEnc && S._ckEnc.lista && S._ckEnc.lista.some(o => o.h === quien(S))) {
          S._ckEnc.lista = S._ckEnc.lista.filter(o => o.h !== quien(S));
          S._ckHeroesT = 701;                                                  // que ck_heroes_npc.js la saque ya, no en 0,7 s
        }
      }
      sendero(S);
    } catch (e) { if (!P._ck4Err) { P._ck4Err = 1; console.warn('[arreglos 4]', e); } }
    return r;
  };
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    P[k] = function () {
      this._ckAbyVisita = false;
      const r = f0 ? f0.apply(this, arguments) : undefined;
      try { if (k === 'onVillageShown' || zona(this) === 'village') { const s = st(this); if (s && fl(s).bruma_noche && !fl(s).aby_interrumpe) this._ckAbyVisita = true; } } catch (e) {}
      return r;
    };
  });

  // ------------------------------------------------------------------ nota 12: el arco del oeste del patio
  try {
    const PM = window.CK_PATIO_MURO;
    if (PM && PM.PC && PM.PC.salidaO) Object.assign(PM.PC.salidaO, { x: 22, y: 232, w: 18, h: 66 });
    if (PM && PM.DESDE && PM.DESDE.training) Object.assign(PM.DESDE.training, { x: 58, y: 268 });
  } catch (e) {}

  // ------------------------------------------------------------------ notas 13 y 14: Pipo
  try {
    const PR = window.CK_PROLOGO;
    if (PR && PR.RUTA) {
      const ZS = 'ed_salon_del_trono_3.main';
      if (PR.RUTA[ZS]) PR.RUTA[ZS] = [[284, 451, 'Hasta acá te acompaño. Andá, que el Rey te espera.']];
    }
    const G = PR && PR.guia;
    if (G && G.empezar) {
      const em0 = G.empezar;
      G.empezar = function (S, zona) {
        const r = em0.apply(this, arguments);
        try {
          if (zona === 'village' && this.sp && this.sp.active) {
            // en el Camino y en el castillo Pipo queda ~1,5 veces la escala del héroe (ck_escala_mapas.js lo lleva al alto de
            // la gente de esos mapas); en la aldea nadie lo agranda y quedaba a 1,3, chiquito al lado del héroe
            const h = Math.abs((S.player && S.player.scaleX) || 1.2);
            this.sp.setScale(Math.max(1.3, Math.min(2.2, h * 1.52)));
          }
        } catch (e) {}
        return r;
      };
    }
  } catch (e) {}

  // ------------------------------------------------------------------ nota 4: la grieta del Sendero, con las escaleras abiertas
  const ZSEND = 'ed_sendero_orco.main';
  const sendero = S => {
    if (zona(S) !== ZSEND) return;
    const a = area(S), s = st(S), N = window.CK_NOTAS_2311;
    if (!a || !s || !N || !N.rellenar || !a._ckGrietaLlena || a._ck4Esc) return;
    const b = fl(s).batalla_orca; if (!b || !b.escaleras) return;
    const lad = S.children.list.some(o => o && o.active && o.texture && /^ck_escalera_guerra_/.test(o.texture.key) && !o.angle);
    if (!lad) return;                        // todavía no están echadas sobre la grieta
    a._ck4Esc = true;
    const g = S.interiorObstacles; if (!g) return;
    // las filas que se cerraron sin las escaleras se sacan y se vuelve a rellenar con los pasos abiertos
    const PASOS = [[155, 175], [380, 400]];   // las filas de las dos escaleras (ck_notas_arreglos_3.js)
    const tapa = g.getChildren().some(z => z && z._ckGrieta && PASOS.some(([q0, q1]) => z.y - a.y + 4 > q0 && z.y - a.y < q1));
    if (tapa) {
      g.getChildren().slice().forEach(z => { if (z && z._ckGrieta) { try { g.remove(z, true, true); } catch (e) { try { z.destroy(); } catch (er) {} } } });
      if (S.currentInterior && Array.isArray(S.currentInterior.objects)) S.currentInterior.objects = S.currentInterior.objects.filter(o => o && o.active);
      a._ckGrietaLlena = false;
      N.rellenar(S);
    }
    // la escalera de arriba (y 165) apoya sus puntas sobre el borde de piedra de la grieta (x 389 a 423 y 495 a 509), que
    // choca: nadie llegaba a pisarla. Se abre la franja de la escalera de orilla a orilla
    abrir(S, a, [385, 157, 513, 173]);
    S._navGrids = {}; S._navGrid = null;
    // los que ya venían caminando por un camino viejo, que lo recalculen
    (S.enemies ? S.enemies.getChildren() : []).forEach(e => { if (e && e.active) e._nav = {}; });
    (a.actors || []).forEach(t => { if (t) t.nav = {}; });
  };
  // corta los choques (zonas) en un rectángulo del área, como las escaleras de ck_batalla_sendero.js
  const abrir = (S, a, q) => {
    const Q = { x0: a.x + q[0], y0: a.y + q[1], x1: a.x + q[2], y1: a.y + q[3] };
    const zonas = [S.interiorObstacles, S.obstacles].filter(Boolean).reduce((l, g) => l.concat(g.getChildren()), []);
    zonas.forEach(z => {
      const b = z && z.body; if (!b || z.type !== 'Zone' || !z.active || !b.enable) return;
      if (b.right <= Q.x0 || b.x >= Q.x1 || b.bottom <= Q.y0 || b.y >= Q.y1) return;
      const partes = [];
      if (b.x < Q.x0) partes.push([b.x, b.y, Q.x0, b.bottom]);
      if (b.right > Q.x1) partes.push([Q.x1, b.y, b.right, b.bottom]);
      const mx0 = Math.max(b.x, Q.x0), mx1 = Math.min(b.right, Q.x1);
      if (b.y < Q.y0) partes.push([mx0, b.y, mx1, Q.y0]);
      if (b.bottom > Q.y1) partes.push([mx0, Q.y1, mx1, b.bottom]);
      partes.forEach(([x0, y0, x1, y1]) => {
        if (x1 - x0 < 1 || y1 - y0 < 1) return;
        const zn = S.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);
        S.physics.add.existing(zn, true); zn._ckNA = z._ckNA; zn._ckCorte = true; if (z._ckGrieta) zn._ckGrieta = true;
        S.interiorObstacles.add(zn); (a.objs = a.objs || []).push(zn);
      });
      try { b.enable = false; S.interiorObstacles && S.interiorObstacles.remove(z); S.obstacles && S.obstacles.remove(z); z.destroy(); } catch (e) {}
    });
  };

  window.CK_NOTAS_2311B = { sendero };
})();
