'use strict';
/* IA de combate que no se traba (10/11, pedido del dueño: "mejorá la IA de combate, muchos NPC se enredan con las hitbox
   de las cosas, es un poco frustrante").
   Lo que pasaba: cuando una bestia no encontraba camino hasta el héroe (una empalizada en el medio, un pasillo angosto
   que la grilla gruesa daba por cerrado), seguía caminando derecho contra el obstáculo y se quedaba "enredada", y los
   empujones entre compañeras las metían en las paredes. Ahora (reemplaza moveEnemyTo de enemies.js):
   - si la grilla de las bestias no encuentra camino, prueba con la grilla fina (pasa por pasillos y arcos angostos);
   - si de verdad no hay camino, no empuja contra la pared: se queda mirando al héroe, y a los 3,5 s abandona la
     persecución y vuelve a su lugar (si el héroe se le acerca por otro lado, lo vuelve a ver);
   - el camino se recalcula cada 0,6 s o cuando el héroe se mueve, y saltea los puntos que ya puede cortar en línea recta;
   - los empujones entre compañeras sólo van hacia lugares libres;
   - trabada contra algo: busca de nuevo el camino y da un paso al costado hacia el lado que está libre (o retrocede);
   - la velocidad nunca pasa la suya (lo que hacía ck_balance.js).
   La gente que pelea o huye (guardias, aldeanos: navFollow) ya no recalcula un camino imposible en cada cuadro: espera
   0,8 s antes de volver a probar (eso además hacía caer los cuadros por segundo).
   Borrar la línea de index.html vuelve a la IA de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const RECALC = 600, RINDE = 3500, CERCA = 5, ESPERA = 46;

  // quiénes persiguen al héroe, de la más cercana a la más lejana (se rehace cada 250 ms)
  P._ckTurnos = function (now, hx, hy) {
    const T = this._ckTurno;
    if (T && now - T.t < 250) return T.l;
    const l = this.enemies.getChildren().filter(e => e.active && !e.isDead && e.state === 'chase' && !e._target && e.body && !(e.def && e.def.ranged && !e.def.meleeToo) &&
      Math.hypot(e.body.center.x - hx, e.body.bottom - hy) < 170);
    l.sort((a, b) => Math.hypot(a.body.center.x - hx, a.body.bottom - hy) - Math.hypot(b.body.center.x - hx, b.body.bottom - hy));
    // las grandes y los jefes nunca esperan
    const g = l.filter(e => e.def && (e.def.boss || (e.scale || 1) > 1.3)), c = l.filter(e => g.indexOf(e) < 0);
    this._ckTurno = { t: now, l: g.concat(c) };
    return this._ckTurno.l;
  };

  P.moveEnemyTo = function (enemy, gx, gy, speed, stopShort) {
    const b = enemy.body;
    if (!b) return 'blocked';
    const now = this.time.now, fx = b.center.x, fy = b.bottom - 2, nav = enemy._nav || (enemy._nav = {});
    if (Math.hypot(gx - fx, gy - fy) < (stopShort ? 6 : 3)) { enemy.setVelocity(0, 0); nav.path = null; return 'arrived'; }
    // una ronda alrededor del héroe: las primeras van a pegar, las demás esperan su turno a un paso, repartidas
    if (!stopShort && enemy.state === 'chase' && this.player && this.player.body) {
      const pb = this.player.body, hx = pb.center.x, hy = pb.bottom - 2;
      if (Math.hypot(gx - hx, gy - hy) < 6) {
        const turno = this._ckTurnos(now, hx, hy), k = turno.indexOf(enemy);
        if (k >= CERCA) {
          const a0 = Math.atan2(fy - hy, fx - hx), a = a0 + ((k % 2) ? 1 : -1) * 0.18 * (k - CERCA + 1) / 2;
          const R = ESPERA + (enemy.def && enemy.def.reach || 30), sx = hx + Math.cos(a) * R, sy = hy + Math.sin(a) * R * 0.8;
          if (this.navIsFree(sx, sy, true) || (enemy.def && enemy.def.flying)) {
            if (Math.hypot(sx - fx, sy - fy) < 10) {
              enemy.setVelocity(0, 0); nav.stuck = null;
              const idle = `${enemy.type}_idle`;
              if (!enemy.isAttacking && enemy.anims.currentAnim?.key !== idle && this.anims.exists(idle)) enemy.play(idle);
              enemy.facing = hx < fx ? 'left' : 'right'; enemy.setFlipX(hx < fx);
              return 'arrived';
            }
            gx = sx; gy = sy;
          }
        }
      }
    }
    let tx = gx, ty = gy;
    const flying = enemy.def && enemy.def.flying;
    if (!flying && this.navPath && !this.navLineFree(fx, fy, gx, gy, true)) {
      if (!nav.path || now - nav.at > RECALC || Math.hypot(nav.goal[0] - gx, nav.goal[1] - gy) > 24) {
        nav.path = this.navPath(fx, fy, gx, gy, 9000, true) || this.navPath(fx, fy, gx, gy, 9000, false);
        nav.goal = [gx, gy]; nav.at = now; nav.i = 0;
      }
      if (!nav.path) {
        // no hay por dónde: quieta, mirando, y si sigue así se rinde
        enemy.setVelocity(0, 0);
        const idle = `${enemy.type}_idle`;
        if (!enemy.isAttacking && enemy.anims.currentAnim?.key !== idle && this.anims.exists(idle)) enemy.play(idle);
        if (Math.abs(gx - fx) > 4) { enemy.facing = gx < fx ? 'left' : 'right'; enemy.setFlipX(gx < fx); }
        nav.sinRuta = nav.sinRuta || now;
        if (!stopShort && enemy.state === 'chase' && now - nav.sinRuta > RINDE && this.enemyLoseTrack) { nav.sinRuta = 0; this.enemyLoseTrack(enemy); }
        return 'blocked';
      }
      let p = nav.path[nav.i];
      while (p && Math.hypot(p[0] - fx, p[1] - fy) < 6 && nav.i < nav.path.length - 1) p = nav.path[++nav.i];
      // cortar camino: si ya ve un punto más adelante en línea recta, va directo
      for (let j = Math.min(nav.path.length - 1, nav.i + 3); j > nav.i; j--)
        if (this.navLineFree(fx, fy, nav.path[j][0], nav.path[j][1], true)) { nav.i = j; break; }
      p = nav.path[nav.i];
      if (p) { tx = p[0]; ty = p[1]; }
    } else nav.path = null;
    nav.sinRuta = 0;

    const dx = tx - fx, dy = ty - fy, d = Math.hypot(dx, dy) || 1;
    let vx = dx / d * speed, vy = dy / d * speed;
    // un poco de lugar entre compañeras, pero nunca empujando contra una pared
    this.enemies.getChildren().forEach(o => {
      if (o === enemy || !o.active || o.isDead) return;
      const ox = enemy.x - o.x, oy = enemy.y - o.y, od = Math.hypot(ox, oy);
      if (od > 0 && od < 20 && (flying || this.navIsFree(fx + ox / od * 8, fy + oy / od * 8, true))) { vx += ox / od * speed * 0.35; vy += oy / od * speed * 0.35; }
    });
    // trabada: camino nuevo y un paso hacia el costado libre (o para atrás si los dos están tapados)
    const st = nav.stuck || (nav.stuck = { x: fx, y: fy, t: now });
    if (Math.hypot(fx - st.x, fy - st.y) > 4) { st.x = fx; st.y = fy; st.t = now; }
    else if (now - st.t > 600) {
      st.t = now; nav.at = 0;
      const px = -dy / d, py = dx / d;
      const libre = s => flying || this.navIsFree(fx + px * s * 12, fy + py * s * 12, true);
      const s = libre(1) && libre(-1) ? (Math.random() < 0.5 ? 1 : -1) : libre(1) ? 1 : libre(-1) ? -1 : 0;
      nav.side = s ? { until: now + 300, vx: px * s * speed, vy: py * s * speed } : { until: now + 240, vx: -dx / d * speed * 0.7, vy: -dy / d * speed * 0.7 };
      if (stopShort) { enemy.setVelocity(0, 0); return 'blocked'; }
    }
    if (nav.side && now < nav.side.until) { vx = nav.side.vx; vy = nav.side.vy; }
    const m = Math.hypot(vx, vy), mx = speed * 1.08;
    if (m > mx) { vx *= mx / m; vy *= mx / m; }
    enemy.setVelocity(vx, vy);
    if (Math.abs(vx) > 5) { enemy.facing = vx < 0 ? 'left' : 'right'; enemy.setFlipX(vx < 0); }
    const walkAnim = `${enemy.type}_walk`;
    if (enemy.anims.currentAnim?.key !== walkAnim) enemy.play(walkAnim);
    return 'walking';
  };

  // la gente: un camino imposible no se vuelve a buscar en cada cuadro
  const nf0 = P.navFollow;
  if (nf0) P.navFollow = function (st, sp, gx, gy) {
    const now = this.time.now;
    if (st && st._ckFalla && now - st._ckFalla.t < 800 && Math.hypot(st._ckFalla.gx - gx, st._ckFalla.gy - gy) < 16) return 'stuck';
    const r = nf0.apply(this, arguments);
    if (st) st._ckFalla = r === 'stuck' ? { t: now, gx, gy } : null;
    return r;
  };
  window.CK_IA_COMBATE = true;
})();
