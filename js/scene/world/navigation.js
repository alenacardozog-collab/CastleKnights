'use strict';
/* Navigation: a walkable grid of the zone on screen, built from its real colliders, and A* paths over it.
   Enemies, castle people and guards use it so they walk around walls, water and props instead of into them.
   The grid is rebuilt by itself when the zone (or its set of colliders) changes. (methods of MainGameScene) */

const NAV_CELL = 8;

Object.assign(MainGameScene.prototype, {
  /** Rectangle of the zone on screen, in world pixels. */
  navZoneRect() {
    const c = this.currentInterior;
    if (c && c.area) return { x: c.area.x, y: c.area.y, w: c.area.w, h: c.area.h, key: this.currentZoneKey() };
    return { x: 0, y: 0, w: this.mapWidth || 640, h: this.mapHeight || 640, key: 'village' };
  },

  /**
   * Walkable grid of the current zone (cached). A cell is blocked when a walker's feet, centred on the cell, would
   * touch a collider. Two sizes: the people moved by hand (feet about 16x8) and, with big = true, the bodies with
   * physics (enemies up to about 22x10), which need wider gaps. Colliders that open and close (the drawbridge)
   * count as open.
   */
  navGrid(big) {
    const k = big ? 'b' : 's', cache = this._navGrids || (this._navGrids = {});
    // checked at most once per frame (many walkers ask every frame)
    const frame = this.game.loop.frame;
    if (cache[k] && cache[k].frame === frame) return cache[k];
    const z = this.navZoneRect();
    const groups = [this.obstacles, this.waterObstacles, this.lowObstacles, this.interiorObstacles].filter(Boolean);
    const skip = this._ckPuente && this._ckPuente.blocker;
    const bodies = [];
    groups.forEach(g => g.getChildren().forEach(o => {
      const b = o.body;
      // people's own feet boxes move with them: they are not part of the map
      if (!b || o === skip || o._navSkip || !b.enable) return;
      if (b.right < z.x || b.x > z.x + z.w || b.bottom < z.y || b.y > z.y + z.h) return;
      bodies.push(b);
    }));
    const sig = z.key + ':' + z.x + ':' + z.y + ':' + bodies.length;
    if (cache[k] && cache[k].sig === sig) { cache[k].frame = frame; return cache[k]; }

    const C = NAV_CELL, gw = Math.max(1, Math.ceil(z.w / C)), gh = Math.max(1, Math.ceil(z.h / C));
    const g = new Uint8Array(gw * gh);
    const HX = big ? 11 : 7, HY = big ? 5 : 3;  // half of a walker's feet
    bodies.forEach(b => {
      const x0 = Math.max(0, Math.ceil((b.x - z.x - HX - C / 2) / C)), x1 = Math.min(gw - 1, Math.floor((b.right - z.x + HX - C / 2) / C));
      const y0 = Math.max(0, Math.ceil((b.y - z.y - HY - C / 2) / C)), y1 = Math.min(gh - 1, Math.floor((b.bottom - z.y + HY - C / 2) / C));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y * gw + x] = 1;
    });
    // the edge of the zone is a wall too
    for (let x = 0; x < gw; x++) g[x] = g[(gh - 1) * gw + x] = 1;
    for (let y = 0; y < gh; y++) g[y * gw] = g[y * gw + gw - 1] = 1;
    return (cache[k] = { sig, frame, x: z.x, y: z.y, gw, gh, g });
  },

  navFreeCell(G, cx, cy) {
    return cx >= 0 && cy >= 0 && cx < G.gw && cy < G.gh && !G.g[cy * G.gw + cx];
  },

  /** Is the world point (feet) on a walkable cell? */
  navIsFree(x, y, big) {
    const G = this.navGrid(big);
    return this.navFreeCell(G, Math.floor((x - G.x) / NAV_CELL), Math.floor((y - G.y) / NAV_CELL));
  },

  /** Nearest walkable cell to a world point, as [cx, cy], or null. */
  navNearestCell(G, x, y, maxR = 10) {
    const cx = Math.floor((x - G.x) / NAV_CELL), cy = Math.floor((y - G.y) / NAV_CELL);
    for (let r = 0; r <= maxR; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.navFreeCell(G, cx + dx, cy + dy)) return [cx + dx, cy + dy];
        }
    return null;
  },

  /** Straight walk from one world point to another without crossing a blocked cell. */
  navLineFree(x0, y0, x1, y1, big) {
    const G = this.navGrid(big), C = NAV_CELL;
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (C / 2)));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      if (!this.navFreeCell(G, Math.floor((x - G.x) / C), Math.floor((y - G.y) / C))) return false;
    }
    return true;
  },

  /** Line of sight: like navLineFree, but whoever stands with their feet against a wall can still see and be seen. */
  navSightFree(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (d < 24) return true;
    const k0 = 8 / d, k1 = 1 - 12 / d;
    return this.navLineFree(x0 + (x1 - x0) * k0, y0 + (y1 - y0) * k0, x0 + (x1 - x0) * k1, y0 + (y1 - y0) * k1);
  },

  /**
   * Path between two world points (feet): list of [x, y] points ending at the goal, or null when there is none.
   * A* over the grid (8 directions, no corner cutting), then the corners that can be skipped in a straight
   * line are removed so walkers move naturally.
   */
  navPath(x0, y0, x1, y1, maxNodes = 12000, big = false) {
    const G = this.navGrid(big), C = NAV_CELL;
    const a = this.navNearestCell(G, x0, y0), b = this.navNearestCell(G, x1, y1);
    if (!a || !b) return null;
    const W = G.gw, N = W * G.gh, start = a[1] * W + a[0], goal = b[1] * W + b[0];
    if (start === goal) return [[x1, y1]];
    const cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    // binary heap of [f, node]
    const heap = [];
    const push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last; let i = 0;
        for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; }
      }
      return top;
    };
    const h = n => { const dx = Math.abs((n % W) - b[0]), dy = Math.abs(((n / W) | 0) - b[1]); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    cost[start] = 0; push(h(start), start);
    let found = false, expanded = 0;
    while (heap.length && expanded++ < maxNodes) {
      const cur = pop()[1];
      if (closed[cur]) continue;
      if (cur === goal) { found = true; break; }
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (!this.navFreeCell(G, nx, ny)) continue;
          if (dx && dy && (!this.navFreeCell(G, cx + dx, cy) || !this.navFreeCell(G, cx, cy + dy))) continue;
          const n = ny * W + nx;
          if (closed[n]) continue;
          const c = cost[cur] + (dx && dy ? 1.414 : 1);
          if (c < cost[n]) { cost[n] = c; from[n] = cur; push(c + h(n), n); }
        }
    }
    if (!found) return null;
    const cells = [];
    for (let n = goal; n !== -1 && n !== start; n = from[n]) cells.push([G.x + (n % W) * C + C / 2, G.y + ((n / W) | 0) * C + C / 2]);
    cells.reverse();
    cells.push([x1, y1]);
    // string pulling: keep only the points that a straight line cannot skip
    const out = [];
    let px = x0, py = y0, i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && !this.navLineFree(px, py, cells[j][0], cells[j][1], big)) j--;
      out.push(cells[j]);
      px = cells[j][0]; py = cells[j][1];
      i = j + 1;
    }
    return out;
  },

  /**
   * Walk a sprite moved by hand (castle people, guards) along a path. st keeps {path, i, goal, at} between frames.
   * Returns 'arrived', 'walking' or 'stuck' (no way there). The path is recomputed when the goal moves.
   */
  navFollow(st, sp, gx, gy, speed, dt, feetOff = 0) {
    const fx = sp.x, fy = sp.y + feetOff;
    if (Math.hypot(gx - fx, gy - fy) <= Math.max(2, speed * dt / 1000)) { sp.setPosition(gx, gy - feetOff); st.path = null; return 'arrived'; }
    const now = this.time.now;
    if (!st.path || Math.hypot(st.goal[0] - gx, st.goal[1] - gy) > 12 || (now - st.at > 1500 && !this.navLineFree(fx, fy, gx, gy))) {
      st.goal = [gx, gy]; st.at = now;
      st.path = this.navLineFree(fx, fy, gx, gy) ? [[gx, gy]] : this.navPath(fx, fy, gx, gy);
      st.i = 0;
      if (!st.path) return 'stuck';
    }
    const p = st.path[st.i];
    if (!p) { st.path = null; return 'arrived'; }
    const dx = p[0] - fx, dy = p[1] - fy, d = Math.hypot(dx, dy), step = speed * dt / 1000;
    if (d <= step) { sp.setPosition(p[0], p[1] - feetOff); st.i++; return st.i >= st.path.length ? 'arrived' : 'walking'; }
    sp.x += dx / d * step; sp.y += dy / d * step;
    if (Math.abs(dx) > 0.4) sp.setFlipX(dx < 0);
    return 'walking';
  }
});
