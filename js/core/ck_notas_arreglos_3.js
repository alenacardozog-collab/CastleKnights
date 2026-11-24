'use strict';
/* Arreglos de las notas del dueño del 23/11 (archivo "notas para corregir", tanda 8a):
   - nota 30, Sendero Orco: "haz q el daño de los npc aliados sea relativamente mas bajo que el de los enemigos asi nosotros
     tenemos q poner mas de nuestra parte, el capitan bruno si tiene mas": los golpes y flechas de los soldados aliados
     entran 4 de cada 10 veces (las otras el enemigo los ataja) y no suman las piedras de afilar del héroe; el Capitán Bruno
     (el caballero) pega 2.
   - nota 29: "a veces se satura el sonido de los npc enemigos cuando ve q nos acercamos al tener tantos en el mapa se vuelve
     loco todo, en las partes de cinematica los npc no se sorprenden sino q atacan y ya": el pitido de alerta suena como mucho
     una vez cada 300 ms y los gruñidos y gritos de los enemigos, cada uno como mucho cada 160 ms (y no más de 5 en medio
     segundo). En las batallas (los orcos que bajan con la batalla de Bruno, los demonios del reino), el enemigo no hace el "!"
     ni se para a gritar: va directo a pelear. (Lo de los cadáveres está en ck_cadaveres.js v3.)
   - nota 35, Brumavieja: "el gran esqueleto ... es un minibos, hazlo un poco mas fuerte": 12 de vida en vez de 7.
   - nota 18, Bosque de la Frontera: "en esta parte no aparecen enemigos despues de la batalla": del portón al este (donde están
     los caídos de la batalla) no aparece ninguna bestia, nunca (los demonios del Capítulo 3 y lo del panel de pruebas, sí).
   - nota 32, Sendero Orco: "aca los npc aliados no pueden pasar por encima de la grieta tienen q usar los puentes o
     escaleras": la grieta tenía huecos adentro (entre los choques del dibujo) donde un soldado podía quedar parado; se
     rellena por dentro, fila por fila, de orilla a orilla (el puente y las escaleras siguen abiertos: las escaleras cortan
     el relleno igual que cortan los choques).
   - nota 21, Coliseo: "cuando los npc hacen embestidas a veces atraviesan geometria y se bugean en el final del mapa": cada
     enemigo que ya pisó la arena no puede salir de ella; si una embestida o un empujón lo saca (a las gradas, detrás de la
     pared), vuelve al último lugar de la arena donde estuvo y la embestida se corta (Kragmor queda atontado, como contra la
     pared).
   Va al final de los arreglos (después de ck_notas_arreglos_2.js). Borrar su línea de index.html lo deja como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const zona = S => { try { return (S.currentZoneKey && S.currentZoneKey()) || ''; } catch (e) { return ''; } };
  const vivo = e => e && e.active && !e.isDead;
  const area = S => (S.currentInterior && S.currentInterior.area) || null;
  const pies = e => (e.body ? { x: e.body.center.x, y: e.body.bottom - 2 } : { x: e.x, y: e.y });
  const delPanel = () => { try { return /ck_panel_pruebas|ck_pruebas/.test(new Error().stack || ''); } catch (e) { return false; } };

  // ------------------------------------------------------------------ nota 35: el Gran Esqueleto, un poco más fuerte
  if (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.skeleton_great && ENEMY_TYPES.skeleton_great.hp < 12) {
    ENEMY_TYPES.skeleton_great.hp = 12;
    ENEMY_TYPES.skeleton_great.xp = Math.max(ENEMY_TYPES.skeleton_great.xp || 0, 50);
  }

  // ------------------------------------------------------------------ nota 18: el este del Bosque de la Frontera, sin bestias
  const ZB = 'ed_bosque_de_la_frontera.main', BOSQUE_ESTE = 1040;
  const sp0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, tipo) {
    try {
      if (this._gameMode === 'campaign' && zona(this) === ZB && !/^demonio_/.test(tipo || '') && !this._ckPermitirBestias && !this._ckBat && !delPanel()) {
        const a = area(this);
        if (a && x - a.x >= BOSQUE_ESTE) return null;
      }
    } catch (e) {}
    return sp0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ nota 30: los aliados pegan menos; Bruno, más
  const ACIERTA = 0.4;
  /** El soldado aliado que dio este golpe (por el punto de donde sale: el golpe, del pie; la flecha, de la mano). */
  const aliadoDe = (S, sx, sy) => {
    if (!S.player || (sx === S.player.x && sy === S.player.y)) return null;
    const a = area(S), lista = (a && a.actors) || [];
    for (const t of lista) {
      const sp = t && t.sprite;
      if (!sp || !sp.active || (t.role !== 'guard' && t.role !== 'archer')) continue;
      if ((sx === sp.x && sy === sp.y) || (Math.abs(sx - sp.x) <= 11 && Math.abs(sy - (sp.y - 22)) <= 2)) return t;
    }
    return null;
  };
  const esBruno = t => /^g_knight/.test(String(t.idle || (t.sprite && t.sprite.texture && t.sprite.texture.key) || ''));
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    let t = null;
    try { if (vivo(enemy) && !this._ckFuente && !this._ckGolpeAjeno) t = aliadoDe(this, sx, sy); } catch (e) { t = null; }
    if (!t) return de0.apply(this, arguments);
    const s = this.story, up = s && s.up, atk = up ? up.atk : 0;
    if (up) up.atk = 0;                                   // (las piedras de afilar son del héroe)
    try {
      if (esBruno(t)) return de0.call(this, enemy, Math.max(2, amount), sx, sy);
      if (Math.random() >= ACIERTA) {                     // atajado: un ruidito y nada más
        try { sfx.fx('sword_hit', 0.18, { minGap: 160, rate: 1.4 }); } catch (e) {}
        return;
      }
      return de0.apply(this, arguments);
    } finally { if (up) up.atk = atk; }
  };

  // ------------------------------------------------------------------ nota 29: menos ruido con muchos enemigos
  const VOCES = /^(orc|beast|warg|wolf|bat|slime|skeleton|bone|goblin|ck_demonio|necro|spider|ghost|ck_grito|ck_cuerno|ev_aullido|ev_cuerno)/;
  const limitar = () => {
    if (typeof sfx === 'undefined' || sfx._ck2311) return !!(typeof sfx !== 'undefined' && sfx._ck2311);
    sfx._ck2311 = true;
    const al0 = sfx.playAlert && sfx.playAlert.bind(sfx);
    let ultAl = 0;
    if (al0) sfx.playAlert = function () { const n = Date.now(); if (n - ultAl < 300) return; ultAl = n; return al0(); };
    const fx0 = sfx.fx.bind(sfx), ult = {};
    let ventana = 0, cuenta = 0;
    sfx.fx = function (name, vol, opts) {
      if (VOCES.test(name || '')) {
        const n = Date.now();
        if (n - (ult[name] || 0) < 160) return true;
        if (n - ventana > 500) { ventana = n; cuenta = 0; }
        if (++cuenta > 5) return true;
        ult[name] = n;
      }
      return fx0(name, vol, opts);
    };
    return true;
  };
  const enBatalla = (S, e) => !!(e._ckBatalla || e._c3Ritual || e._c3slot || e._ckiv || e._ckSinSusto || (S._ckBat && /^orc/.test(e.type || '')));
  const ae0 = P.alertEnemy;
  P.alertEnemy = function (enemy) {
    try {
      if (vivo(enemy) && enBatalla(this, enemy) && enemy.state !== 'chase' && enemy.state !== 'dormant' && enemy.state !== 'rising'
        && !(typeof enemy.state === 'string' && enemy.state.indexOf('ck_') === 0)) {
        enemy._ckAullo = true; enemy._ckLlamadas = true;      // ni grito de guerra ni llamado de refuerzos
        enemy.state = 'chase'; enemy.reactionDelay = 0;
        const tx = enemy._target && enemy._target.sprite ? enemy._target.sprite.x : this.player.x;
        enemy.facing = tx < enemy.x ? 'left' : 'right'; enemy.setFlipX(tx < enemy.x);
        return;
      }
    } catch (e) {}
    return ae0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ nota 32: la grieta del Sendero, rellena por dentro
  const ZS = 'ed_sendero_orco.main', GRIETA = { x0: 380, x1: 548 };
  // el puente (siempre abierto) y las dos escaleras de guerra (abiertas desde que se tienden; ck_batalla_sendero.js)
  const PUENTE = [252, 314], ESCALERAS = [[155, 175], [380, 400]];
  const rellenar = S => {
    const a = area(S); if (!a || zona(S) !== ZS || !S.interiorObstacles) return;
    if (a._ckGrietaLlena) return;
    const cuerpos = [S.interiorObstacles, S.obstacles].filter(Boolean).reduce((l, g) => l.concat(g.getChildren()), [])
      .map(o => o.body).filter(b => b && b.enable && b.right > a.x + GRIETA.x0 && b.x < a.x + GRIETA.x1);
    if (!cuerpos.length) return;
    a._ckGrietaLlena = true;
    const FILA = 4, alto = a.h || 640, f = S.story && S.story.flags, esc = !!(f && f.batalla_orca && f.batalla_orca.escaleras);
    const abierto = y => (y + FILA > PUENTE[0] && y < PUENTE[1]) || (esc && ESCALERAS.some(([q0, q1]) => y + FILA > q0 && y < q1));
    let n = 0;
    for (let y = 0; y < alto; y += FILA) {
      if (abierto(y)) continue;
      const y0 = a.y + y, y1 = y0 + FILA;
      const fila = cuerpos.filter(b => b.bottom > y0 && b.y < y1);
      if (fila.length < 2) continue;
      const x0 = Math.min(...fila.map(b => b.x)), x1 = Math.max(...fila.map(b => b.right));
      if (x1 - x0 < 24 || x1 - x0 > 150) continue;
      const z = S.add.zone(x0, y0, x1 - x0, FILA).setOrigin(0, 0);
      S.physics.add.existing(z, true); z._ckGrieta = true;
      S.interiorObstacles.add(z);
      (S.currentInterior.objects = S.currentInterior.objects || []).push(z);
      n++;
    }
    S._navGrids = {};
  };

  // ------------------------------------------------------------------ nota 21: nadie sale de la arena del Coliseo
  const ZC = 'ed_coliseo_orco.main', CENTRO = [718, 470];
  const mascara = S => {
    const a = area(S); if (!a || !S.navGrid) return null;
    const G = S.navGrid(false), C = 8, M = new Uint8Array(G.gw * G.gh);
    const cx = Math.floor((a.x + CENTRO[0] - G.x) / C), cy = Math.floor((a.y + CENTRO[1] - G.y) / C);
    if (!S.navFreeCell(G, cx, cy)) return null;
    const cola = [cx + cy * G.gw]; M[cola[0]] = 1;
    while (cola.length) {
      const i = cola.pop(), x = i % G.gw, y = (i - x) / G.gw;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, j = nx + ny * G.gw;
        if (nx >= 0 && ny >= 0 && nx < G.gw && ny < G.gh && !M[j] && S.navFreeCell(G, nx, ny)) { M[j] = 1; cola.push(j); }
      });
    }
    return { G, M, sig: G.sig };
  };
  const enArena = (A, x, y) => {
    const G = A.G, cx = Math.floor((x - G.x) / 8), cy = Math.floor((y - G.y) / 8);
    return cx >= 0 && cy >= 0 && cx < G.gw && cy < G.gh && !!A.M[cx + cy * G.gw];
  };
  const cuidarArena = S => {
    if (zona(S) !== ZC || !S.enemies) return;
    let A = S._ckArena;
    if (!A || (S.time.now > (A.prox || 0) && S.navGrid(false).sig !== A.sig)) { A = S._ckArena = mascara(S); if (!A) return; }
    A.prox = S.time.now + 2000;
    S.enemies.getChildren().forEach(e => {
      if (!vivo(e) || !e.body || !e.body.enable) return;
      const p = pies(e);
      if (enArena(A, p.x, p.y)) { e._ckArenaOk = [e.x, e.y]; return; }
      if (!e._ckArenaOk) return;                          // todavía entrando por su reja
      e.body.reset(e._ckArenaOk[0], e._ckArenaOk[1]); e.body.setVelocity(0, 0);
    });
  };

  // ------------------------------------------------------------------ enganches
  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0 ? area0.apply(this, arguments) : undefined;
    try {
      const S = this; S._ckArena = null;
      if (zona(S) === ZS) { S.time.delayedCall(200, () => { try { rellenar(S); } catch (e) { console.warn('[notas 23/11] grieta', e); } }); }
    } catch (e) {}
    return r;
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      limitar();
      if (this.player && zona(this) === ZC) cuidarArena(this);
    } catch (e) { if (!P._ck2311Av) { P._ck2311Av = 1; console.warn('[notas 23/11]', e); } }
    return r;
  };
  window.CK_NOTAS_2311 = { aliadoDe, rellenar, mascara, ACIERTA };
})();
