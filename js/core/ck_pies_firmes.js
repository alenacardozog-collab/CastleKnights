'use strict';
/* Pies firmes (10/11, pedido del dueño: "cuidá minuciosamente las hitboxes de todo el escenario, que el personaje ni los
   NPC traspasen cosas que no deben; la fauna a veces se para donde no debe o atraviesa cosas").
   - Aldeanos de la aldea: su recorrido de siempre iba en línea recta de un punto al otro, aunque en el medio hubiera una
     casa, un árbol o el agua. Ahora, si la recta está tapada, rodean por la grilla de navegación (la misma que usan las
     bestias y la gente del castillo). Si no hay forma de llegar, pasan al punto siguiente.
   - Bestias: si aparecen arriba de algo (una casa, un árbol, el agua) o en un lugar cerrado al que el héroe no puede
     llegar, se corren al lugar libre más cercano del lado del héroe. Las que vuelan (murciélagos, fantasmas) no.
   (Los bichos de la fauna — pájaros, ranas, gallinas, el gato — se arreglaron en ck_fauna.js.)
   Borrar su línea de index.html vuelve a como estaba. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const C = typeof NAV_CELL !== 'undefined' ? NAV_CELL : 8;

  // ------------------------------------------------------------------ fuegos que se pisaban
  // la fogata de la aldea (ck_aldea.js) no tenía choque: el héroe y la gente caminaban por arriba del fuego
  const FUEGOS_ALDEA = [[258, 482, 28, 14]];
  const fuegosAldea = S => {
    const al = S._ckAldea;
    if (!al || al._ckFuegos || !S.obstacles || !S.physics) return;
    al._ckFuegos = FUEGOS_ALDEA.map(([x, y, w, h]) => {
      const z = S.add.zone(x + w / 2, y + h / 2, w, h);
      S.physics.add.existing(z, true);
      S.obstacles.add(z);
      al.objs && al.objs.push(z);
      return z;
    });
  };

  // ------------------------------------------------------------------ aldeanos en su recorrido
  const npcs0 = P.updateNPCs;
  P.updateNPCs = function () {
    try { if (!this.currentInterior) fuegosAldea(this); } catch (e) {}
    if (this._gameMode !== 'campaign' || !this.campaignNPCs || !this.navLineFree || this.currentInterior) return npcs0.apply(this, arguments);
    const antes = this.campaignNPCs.map(n => (n.sprite ? [n.sprite.x, n.sprite.y] : null));
    const r = npcs0.apply(this, arguments);
    try {
      const dt = this.game.loop.delta;
      this.campaignNPCs.forEach((npc, i) => {
        const sp = npc.sprite, a = antes[i];
        if (!sp || !sp.active || !a || npc.state !== 'walking' || !npc.waypoints) return;
        if (npc.vida && npc.vida.modo !== 'ruta') return;          // ck_vida.js ya los lleva por su camino
        if (sp.x === a[0] && sp.y === a[1]) return;
        const t = npc.waypoints[npc.currentWaypoint]; if (!t) return;
        const st = npc._ckNav || (npc._ckNav = {});
        if (!st.path && this.navLineFree(a[0], a[1], t.x, t.y)) return;   // la recta está libre: como siempre
        sp.setPosition(a[0], a[1]);
        const res = this.navFollow(st, sp, t.x, t.y, npc.speed || 30, dt);
        if (res === 'arrived') { st.path = null; sp.setPosition(t.x, t.y); }
        else if (res === 'stuck') { st.path = null; npc.state = 'idle'; npc.idleTimer = 600; }
      });
    } catch (e) { console.warn('[pies firmes]', e); }
    return r;
  };

  // ------------------------------------------------------------------ bestias que aparecen en mal lugar
  const VUELA = /bat|ghost|wisp|spirit|murci|fantasma|crow|cuervo/i;
  // parte alcanzable desde el héroe (grilla grande, la de los cuerpos con física)
  let comp = null;
  const alcanzable = S => {
    const G = S.navGrid(true), pb = S.player && S.player.body; if (!pb) return null;
    const hx = Math.floor((pb.center.x - G.x) / C), hy = Math.floor((pb.bottom - 2 - G.y) / C);
    const key = G.sig + ':' + hx + ':' + hy;
    if (comp && comp.key === key) return comp;
    let ini = S.navFreeCell(G, hx, hy) ? [hx, hy] : S.navNearestCell(G, pb.center.x, pb.bottom - 2, 4);
    const m = new Uint8Array(G.gw * G.gh);
    if (ini) {
      const q = [ini[1] * G.gw + ini[0]]; m[q[0]] = 1;
      for (let qi = 0; qi < q.length; qi++) {
        const n = q[qi], x = n % G.gw, y = (n - x) / G.gw;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (!S.navFreeCell(G, nx, ny)) continue;
          const k = ny * G.gw + nx; if (m[k]) continue; m[k] = 1; q.push(k);
        }
      }
    }
    return (comp = { key, G, m, ok: !!ini });
  };
  const acomodar = (S, e) => {
    if (!e || !e.body || !e.active || VUELA.test(e.type || '')) return;
    const A = alcanzable(S); if (!A || !A.ok) return;
    // los pies (el cuerpo recién creado todavía no siguió al dibujo: se calcula como lo hará la física)
    const b = e.body, fx = e.x + e.scaleX * (b.offset.x - e.displayOriginX) + b.width / 2, fy = e.y + e.scaleY * (b.offset.y - e.displayOriginY) + b.height - 2;
    const G = A.G;
    const cx = Math.floor((fx - G.x) / C), cy = Math.floor((fy - G.y) / C);
    if (cx < 0 || cy < 0 || cx >= G.gw || cy >= G.gh) return;      // de otra zona: no se toca
    const bien = (x, y) => x >= 0 && y >= 0 && x < G.gw && y < G.gh && A.m[y * G.gw + x];
    if (bien(cx, cy)) return;
    for (let r = 1; r <= 60; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !bien(cx + dx, cy + dy)) continue;
          const nx = G.x + (cx + dx) * C + C / 2, ny = G.y + (cy + dy) * C + C / 2;
          e.setPosition(e.x + (nx - fx), e.y + (ny - fy));
          if (e.ckSpawnPos) e.ckSpawnPos = { x: e.x, y: e.y };
          return;
        }
  };
  const sp0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = sp0.apply(this, arguments);
    try { if (e && this.navGrid && this.player) acomodar(this, e); } catch (err) { console.warn('[pies firmes]', err); }
    return e;
  };

  window.CK_PIES_FIRMES = { alcanzable, acomodar };
})();
