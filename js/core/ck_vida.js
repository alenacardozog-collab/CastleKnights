'use strict';
/* VIDA: los aldeanos tienen rutinas y reaccionan a lo que pasa.
   - Cada tanto van a la taberna o a su casa (caminan hasta la puerta esquivando casas y agua, entran y al rato salen).
   - De noche casi todos se guardan; a la mañana vuelven a salir.
   - Si una bestia se les acerca gritan y corren a esconderse en la puerta más cercana; salen cuando ya no hay peligro.
   - Se sobresaltan si el héroe pelea al lado de ellos y festejan cuando cae una bestia cerca.
   - Los que están en la taberna se ven adentro de "Taberna 2" (entran y salen por la puerta de verdad).
   - Algunas noches, después de la primera misión, una bestia merodea por la aldea.
   Va fuera del bloque del Taller en index.html (las exportaciones del editor no lo pisan). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const TABERNA = 'taberna_2',
    zonaTaberna = 'ed_' + TABERNA + '.main';
  const azar = (a, b) => a + Math.random() * (b - a);
  const uno = l => l[Math.floor(Math.random() * l.length)];

  // casa de cada aldeano (tipo de puerta de la aldea) y quiénes no se mueven de su puesto
  const CASA = { npc1: 'casa', npc3: 'tienda', npc4: 'granero', npc7: 'casa', npc6: 'casa', npc10: 'granero' };
  const FIJOS = ['npc2']; // el posadero atiende su puesto (abre la tienda)
  const DIALOGO = {
    huir: ['¡Auxilio!', '¡Una bestia!', '¡Corran!', '¡Socorro, socorro!', '¡A las casas!'],
    susto: ['¡Ey! ¡Cuidado con eso!', '¡Casi me das!', '¡Más despacio con la espada!', '¡Uy!'],
    festejo: ['¡Bien hecho!', '¡Eso es, héroe!', '¡Gracias!', '¡Así se hace!'],
    noche: ['Qué noche fría…', 'Mejor me guardo temprano', 'De noche se oyen cosas raras…'],
    herido: ['¡Estás herido! Descansá un poco', 'Esa herida no se ve bien…'],
    vuelta: ['Uf, ya pasó…', '¿Se fue la bestia?', 'Qué susto…']
  };

  // ------------------------------------------------------------------ caminos (A* sobre una grilla de 8 px)
  const C = 8;
  /** Grilla de lo que se puede pisar. rects: [{x,y,w,h}] en coordenadas de la grilla (mundo o sala). */
  const grilla = (w, h, rects, holgura = 4) => {
    const gw = Math.ceil(w / C),
      gh = Math.ceil(h / C),
      g = new Uint8Array(gw * gh);
    // una celda está tapada si su centro cae dentro de un obstáculo (agrandado un poco: los pies del aldeano)
    rects.forEach(r => {
      const x0 = Math.max(0, Math.ceil((r.x - holgura - C / 2) / C)),
        x1 = Math.min(gw - 1, Math.floor((r.x + r.w + holgura - C / 2) / C)),
        y0 = Math.max(0, Math.ceil((r.y - 2 - C / 2) / C)),
        y1 = Math.min(gh - 1, Math.floor((r.y + r.h + 2 - C / 2) / C));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y * gw + x] = 1;
    });
    for (let x = 0; x < gw; x++) g[x] = g[(gh - 1) * gw + x] = 1;
    for (let y = 0; y < gh; y++) g[y * gw] = g[y * gw + gw - 1] = 1;
    return { gw, gh, g };
  };
  const libre = (G, cx, cy) => cx >= 0 && cy >= 0 && cx < G.gw && cy < G.gh && !G.g[cy * G.gw + cx];
  /** Celda libre más cercana a (x, y). */
  const cercana = (G, x, y) => {
    const cx = Math.floor(x / C),
      cy = Math.floor(y / C);
    for (let r = 0; r < 12; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (libre(G, cx + dx, cy + dy)) return [cx + dx, cy + dy];
        }
    return null;
  };
  /** Camino de (x0,y0) a (x1,y1): lista de puntos [x, y] o null. */
  const camino = (G, x0, y0, x1, y1) => {
    const a = cercana(G, x0, y0),
      b = cercana(G, x1, y1);
    if (!a || !b) return null;
    const N = G.gw * G.gh,
      ini = a[1] * G.gw + a[0],
      fin = b[1] * G.gw + b[0],
      costo = new Float32Array(N).fill(1e9),
      de = new Int32Array(N).fill(-1),
      cerrado = new Uint8Array(N),
      abiertos = [ini];
    costo[ini] = 0;
    const h = i => Math.hypot((i % G.gw) - b[0], Math.floor(i / G.gw) - b[1]);
    let vueltas = 0;
    while (abiertos.length && vueltas++ < 9000) {
      let k = 0;
      for (let i = 1; i < abiertos.length; i++) if (costo[abiertos[i]] + h(abiertos[i]) < costo[abiertos[k]] + h(abiertos[k])) k = i;
      const cur = abiertos.splice(k, 1)[0];
      if (cur === fin) break;
      cerrado[cur] = 1;
      const cx = cur % G.gw,
        cy = Math.floor(cur / G.gw);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx,
            ny = cy + dy;
          if (!libre(G, nx, ny) || (dx && dy && (!libre(G, cx + dx, cy) || !libre(G, cx, cy + dy)))) continue;
          const n = ny * G.gw + nx;
          if (cerrado[n]) continue;
          const c = costo[cur] + (dx && dy ? 1.414 : 1);
          if (c < costo[n]) {
            if (costo[n] >= 1e9) abiertos.push(n);
            costo[n] = c;
            de[n] = cur;
          }
        }
    }
    if (de[fin] < 0 && fin !== ini) return null;
    const pts = [];
    for (let i = fin; i !== -1 && i !== ini; i = de[i]) pts.push([(i % G.gw) * C + C / 2, Math.floor(i / G.gw) * C + C / 2]);
    pts.reverse();
    // se sacan los puntos intermedios de las rectas (camina más natural)
    const corto = [];
    pts.forEach((p, i) => {
      const q = pts[i - 1],
        r = pts[i + 1];
      if (!q || !r || (p[0] - q[0]) * (r[1] - p[1]) !== (p[1] - q[1]) * (r[0] - p[0])) corto.push(p);
    });
    corto.push([x1, y1]);
    return corto;
  };
  const grillaAldea = s => {
    if (s._ckGrillaAldea) return s._ckGrillaAldea;
    const rects = [];
    [s.obstacles, s.waterObstacles, s.lowObstacles].forEach(gr => {
      if (!gr) return;
      gr.getChildren().forEach(o => {
        const b = o.body;
        if (b) rects.push({ x: b.x, y: b.y, w: b.width, h: b.height });
      });
    });
    s._ckGrillaAldea = grilla(s.mapWidth || 640, s.mapHeight || 640, rects);
    return s._ckGrillaAldea;
  };

  // ------------------------------------------------------------------ helpers de los aldeanos
  const anim = (s, npc, que) => {
    const k = npc.id + '_' + que,
      alt = 'npc1_' + que;
    if (s.anims.exists(k)) npc.sprite.play(k, true);
    else if (s.anims.exists(alt)) npc.sprite.play(alt, true);
  };
  const decir = (s, npc, lista, color) => {
    const v = npc.vida;
    if (s.time.now - (v.dijo || 0) < 4500) return;
    v.dijo = s.time.now;
    s.createFloatingText(npc.sprite.x, npc.sprite.y - 38, uno(lista), color || 0xffffff);
  };
  const puertaDe = (s, tipo) => (s.doorSprites || []).find(d => d.active && d._interiorKind === tipo);
  /** Puerta para esconderse: la más cercana que no quede del lado de la bestia. */
  const puertaRefugio = (s, x, y, e) => {
    const ex = e.x,
      ey = e.y + 26,
      ds = (s.doorSprites || []).filter(d => d.active);
    const buenas = ds.filter(
      d => Phaser.Math.Distance.Between(d.x, d.y + 12, ex, ey) > Phaser.Math.Distance.Between(d.x, d.y + 12, x, y) + 20
    );
    return puertaCercanaDe(buenas.length ? buenas : ds, x, y);
  };
  const puertaCercanaDe = (lista, x, y) => {
    let m = null,
      md = 1e9;
    lista.forEach(d => {
      const dd = Phaser.Math.Distance.Between(x, y, d.x, d.y + 12);
      if (dd < md) {
        md = dd;
        m = d;
      }
    });
    return m;
  };
  const abrirPuerta = (s, d) => {
    if (!d) return;
    const ok = s.anims.exists(d._doorName + '_open');
    if (!d._doorOpen) {
      if (ok) d.play(d._doorName + '_open');
      else d.setFrame(3);
      s.time.delayedCall(800, () => {
        const pl = s.player;
        if (d.active && !d._doorOpen && !(pl && Phaser.Math.Distance.Between(pl.x, pl.y, d.x, d.y) < (d._triggerR || 36))) {
          if (s.anims.exists(d._doorName + '_close')) d.play(d._doorName + '_close');
          else d.setFrame(0);
        }
      });
    }
  };
  /** Manda al aldeano a una puerta: modo 'ir' con el motivo (casa, taberna, refugio). */
  const irA = (s, npc, puerta, motivo, rapido) => {
    const v = npc.vida,
      G = grillaAldea(s),
      ruta = camino(G, npc.sprite.x, npc.sprite.y, puerta.x, puerta.y + 12);
    if (!ruta) return false;
    Object.assign(v, { modo: 'ir', ruta, i: 0, puerta, motivo, vel: npc.speed * (rapido ? 2.3 : 1.05) });
    anim(s, npc, 'walk');
    return true;
  };
  const entrar = (s, npc) => {
    const v = npc.vida,
      sp = npc.sprite;
    abrirPuerta(s, v.puerta);
    v.modo = 'adentro';
    v.lugar = v.motivo === 'taberna' ? 'taberna' : v.motivo === 'refugio' ? 'refugio' : 'casa';
    const noche = s.isNight && s.isNight();
    v.hasta =
      s.time.now + (v.lugar === 'refugio' ? 8000 : v.lugar === 'casa' && noche ? 1e12 : azar(25000, v.lugar === 'taberna' ? 60000 : 45000));
    s.tweens.add({ targets: sp, alpha: 0, duration: 260, onComplete: () => sp.setVisible(false).setPosition(-400, -400) }); // lejos: nadie le habla a un aldeano que no está
    if (sp.body) sp.body.enable = false;
    if (npc.nameTag) npc.nameTag.setVisible(false);
    if (v.lugar === 'taberna') llegaATaberna(s, npc, true);
  };
  const salir = (s, npc) => {
    const v = npc.vida,
      sp = npc.sprite,
      d = v.puerta || puertaDe(s, CASA[npc.id] || 'bar');
    if (v.lugar === 'taberna') seVaDeLaTaberna(s, npc);
    abrirPuerta(s, d);
    sp.setPosition(d.x, d.y + 14)
      .setVisible(true)
      .setAlpha(0);
    s.tweens.add({ targets: sp, alpha: 1, duration: 260 });
    if (sp.body) sp.body.enable = true;
    if (npc.nameTag) npc.nameTag.setVisible(true);
    if (v.lugar === 'refugio') decir(s, npc, DIALOGO.vuelta, 0xfde68a);
    // vuelve al punto de su recorrido más cercano
    let k = 0,
      md = 1e9;
    npc.waypoints.forEach((w, i) => {
      const dd = Phaser.Math.Distance.Between(w.x, w.y, sp.x, sp.y);
      if (dd < md) {
        md = dd;
        k = i;
      }
    });
    const ruta = camino(grillaAldea(s), sp.x, sp.y, npc.waypoints[k].x, npc.waypoints[k].y);
    Object.assign(v, {
      modo: 'volver',
      ruta: ruta || [[npc.waypoints[k].x, npc.waypoints[k].y]],
      i: 0,
      wp: k,
      vel: npc.speed,
      lugar: null
    });
    anim(s, npc, 'walk');
  };
  /** Avanza por la ruta; devuelve true al llegar. */
  const avanzar = (s, npc, dt) => {
    const v = npc.vida,
      sp = npc.sprite,
      p = v.ruta[v.i];
    if (!p) return true;
    const dx = p[0] - sp.x,
      dy = p[1] - sp.y,
      d = Math.hypot(dx, dy),
      paso = (v.vel * dt) / 1000;
    if (d <= paso) {
      sp.setPosition(p[0], p[1]);
      v.i++;
      return v.i >= v.ruta.length;
    }
    sp.x += (dx / d) * paso;
    sp.y += (dy / d) * paso;
    if (Math.abs(dx) > 0.4) sp.setFlipX(dx < 0);
    return false;
  };
  const enemigosCerca = (s, x, y, r) =>
    s.enemies ? s.enemies.getChildren().filter(e => e.active && !e.isDead && Phaser.Math.Distance.Between(e.x, e.y + 26, x, y) < r) : [];

  // ------------------------------------------------------------------ cada cuadro, en la aldea
  const npcs0 = P.updateNPCs;
  P.updateNPCs = function () {
    if (this._gameMode !== 'campaign' || !this.campaignNPCs) return npcs0.apply(this, arguments);
    const now = this.time.now,
      propios = [];
    this.campaignNPCs.forEach((npc, idx) => {
      if (!npc.sprite || !npc.sprite.active) return;
      const v = (npc.vida = npc.vida || { modo: 'ruta', prox: now + azar(20000, 60000) + idx * 3000 });
      if (v.modo !== 'ruta') propios.push(npc);
    });
    // el recorrido original para los que están en su ruta (los demás se apagan un instante para que no los mueva)
    propios.forEach(n => (n.sprite.active = false));
    const r = npcs0.apply(this, arguments);
    propios.forEach(n => (n.sprite.active = true));
    vida(this);
    return r;
  };
  /** Rutinas y reacciones. Corre también mientras el héroe está en un interior (la aldea sigue viva). */
  const vida = s => {
    const now = s.time.now,
      dt = s.game.loop.delta,
      enAldea = !s.currentInterior,
      noche = !!(s.isNight && s.isNight());
    let adentroDeDia = s.campaignNPCs.filter(n => n.vida && n.vida.modo === 'adentro' && n.vida.lugar !== 'refugio').length;
    s.campaignNPCs.forEach(npc => {
      const v = npc.vida,
        sp = npc.sprite;
      if (!v || !sp || !sp.active) return;
      const fijo = FIJOS.includes(npc.id);
      // peligro: una bestia cerca -> a la puerta más cercana, corriendo
      if (enAldea && (v.modo === 'ruta' || v.modo === 'volver' || (v.modo === 'ir' && v.motivo !== 'refugio'))) {
        const ene = enemigosCerca(s, sp.x, sp.y, 130);
        if (ene.length) {
          decir(s, npc, DIALOGO.huir, 0xfca5a5);
          const d = puertaRefugio(s, sp.x, sp.y, ene[0]);
          if (!d || !irA(s, npc, d, 'refugio', true)) {
            // sin camino: se aleja de la bestia
            const e = ene[0],
              a = Math.atan2(sp.y - e.y - 26, sp.x - e.x);
            sp.x = Phaser.Math.Clamp(sp.x + Math.cos(a) * npc.speed * 2 * (dt / 1000), 24, (s.mapWidth || 640) - 24);
            sp.y = Phaser.Math.Clamp(sp.y + Math.sin(a) * npc.speed * 2 * (dt / 1000), 24, (s.mapHeight || 640) - 24);
          }
          return;
        }
      }
      if (v.modo === 'ruta') {
        if (fijo) return;
        // reacciones al héroe
        if (enAldea && s.player && s.player.active) {
          const dh = Phaser.Math.Distance.Between(sp.x, sp.y, s.player.x, s.player.y + 20);
          if (dh < 56 && s.isAttacking && !enemigosCerca(s, s.player.x, s.player.y, 90).length) {
            decir(s, npc, DIALOGO.susto, 0xfde68a);
            if (!v.salto) {
              v.salto = true;
              s.tweens.add({ targets: sp, y: sp.y - 5, duration: 110, yoyo: true, onComplete: () => (v.salto = false) });
            }
          } else if (dh < 46 && s.health <= Math.max(1, s.maxHealth * 0.34)) decir(s, npc, DIALOGO.herido, 0x6ee7b7);
        }
        // rutina: de noche se guardan; de día, cada tanto, taberna o casa
        if (now < v.prox || s.dialogOpen) return;
        v.prox = now + azar(45000, 100000);
        let tipo = null;
        if (noche) tipo = Math.random() < 0.72 ? CASA[npc.id] : 'bar';
        else if (adentroDeDia < 2) {
          const t = Math.random();
          tipo = t < 0.35 ? 'bar' : t < 0.6 ? CASA[npc.id] : null;
        }
        if (noche && Math.random() < 0.3) decir(s, npc, DIALOGO.noche, 0xc7d2fe);
        const d = tipo && puertaDe(s, tipo);
        if (d && irA(s, npc, d, tipo === 'bar' ? 'taberna' : 'casa')) adentroDeDia++;
      } else if (v.modo === 'ir') {
        if (avanzar(s, npc, dt)) entrar(s, npc);
      } else if (v.modo === 'adentro') {
        // sale cuando se cumple el tiempo; de la casa, a la mañana; del refugio, cuando no hay peligro
        let listo = now >= v.hasta;
        if (v.lugar === 'casa' && v.hasta > 1e11) listo = !noche && now > (v.manana || (v.manana = now + azar(1000, 15000)));
        if (v.lugar === 'refugio' && listo && enemigosCerca(s, v.puerta.x, v.puerta.y + 12, 260).length) {
          v.hasta = now + 4000;
          listo = false;
        }
        if (v.lugar === 'taberna' && listo && noche && Math.random() < 0.6) {
          // de la taberna a la casa a dormir
          v.hasta = now + 1e12;
          seVaDeLaTaberna(s, npc);
          v.lugar = 'casa';
          v.puerta = puertaDe(s, CASA[npc.id]) || v.puerta;
          listo = false;
        }
        if (listo) {
          v.manana = 0;
          salir(s, npc);
        }
      } else if (v.modo === 'volver') {
        if (avanzar(s, npc, dt)) {
          v.modo = 'ruta';
          v.prox = now + azar(40000, 90000);
          npc.currentWaypoint = v.wp;
          npc.state = 'idle';
          npc.idleTimer = 800;
          anim(s, npc, 'idle');
        }
      }
      sp.setDepth(Math.round(sp.y));
      if (npc.nameTag) npc.nameTag.setPosition(Math.round(sp.x), Math.round(sp.y) - 28);
    });

    // festejo cuando cae una bestia cerca de alguien
    if (enAldea && s.enemies)
      s.enemies.getChildren().forEach(e => {
        if (!e.isDead || e._ckFestejo) return;
        e._ckFestejo = true;
        s.campaignNPCs.forEach(n => {
          if (n.vida && n.vida.modo === 'ruta' && Phaser.Math.Distance.Between(n.sprite.x, n.sprite.y, e.x, e.y + 26) < 220)
            decir(s, n, DIALOGO.festejo, 0x86efac);
        });
      });
    if (enAldea) merodeador(s, now, noche);
  };

  // ------------------------------------------------------------------ bestia que merodea de noche
  const BORDES = [
    { x: 520, y: 320 },
    { x: 120, y: 440 },
    { x: 440, y: 520 },
    { x: 160, y: 120 }
  ];
  const merodeador = (s, now, noche) => {
    if (!noche || !s.story || s.story.step < 1 || s.isDead || s._doorTransition || !s.enemies) {
      s._ckMerodea = now + azar(60000, 120000);
      return;
    }
    if (!s._ckMerodea) s._ckMerodea = now + azar(60000, 120000);
    if (now < s._ckMerodea) return;
    s._ckMerodea = now + azar(150000, 260000);
    if (s.enemies.getChildren().some(e => e.active && !e.isDead)) return;
    const pl = s.player,
      lejos = BORDES.filter(p => Phaser.Math.Distance.Between(p.x, p.y, pl.x, pl.y) > 230);
    if (!lejos.length) return;
    const p = uno(lejos),
      e = s.spawnEnemy(p.x, p.y, uno(['bat', 'slime', 'werewolf']));
    if (e) {
      e.zone = 'village';
      s.createFloatingText(pl.x, pl.y - 52, 'Algo se mueve entre las casas…', 0xc4b5fd);
    }
  };

  // ------------------------------------------------------------------ los que están en la taberna, adentro de "Taberna 2"
  const LUGARES_TABERNA = [
    [168, 122],
    [312, 122],
    [232, 175],
    [300, 210],
    [120, 214],
    [350, 150],
    [262, 222],
    [196, 226]
  ];
  const ENTRADA_TABERNA = [240, 258];
  const enTaberna = s => s.currentInterior && s.currentZoneKey() === zonaTaberna;
  const grillaSala = area => {
    if (area._ckGrilla) return area._ckGrilla;
    area._ckGrilla = grilla(
      area.w,
      area.h,
      (area.solids || []).map(c => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
      6
    );
    return area._ckGrilla;
  };
  const nombres = {};
  /** Dibuja adentro a un aldeano que está en la taberna. entrando = aparece por la puerta y camina hacia adentro. */
  const llegaATaberna = (s, npc, entrando) => {
    if (!enTaberna(s)) return;
    const area = s.currentInterior.area;
    if (npc._ckDentro && npc._ckDentro.sp.active) return;
    const G = grillaSala(area),
      lugar = uno(LUGARES_TABERNA),
      desde = entrando ? ENTRADA_TABERNA : lugar,
      sp = s.add
        .sprite(area.x + desde[0], area.y + desde[1], npc.textureKey)
        .setOrigin(0.5, 1)
        .setScale(npc.sprite.scaleX)
        .setDepth(area.y + desde[1]);
    const act = { type: 'ck_vecino', sprite: sp, lines: (npc.greetings || []).slice(0, 4), npc };
    (area.actors = area.actors || []).push(act);
    nombres[npc.textureKey] = npc.name;
    const d = { sp, area, G, act, ruta: null, i: 0, espera: entrando ? 0 : azar(500, 4000), destino: lugar, x: desde[0], y: desde[1] };
    npc._ckDentro = d;
    if (entrando) {
      d.ruta = camino(G, desde[0], desde[1], lugar[0], lugar[1]);
      d.i = 0;
    }
    anim(s, { id: npc.id, sprite: sp }, entrando ? 'walk' : 'idle');
  };
  const seVaDeLaTaberna = (s, npc) => {
    const d = npc._ckDentro;
    if (!d || !d.sp.active) return;
    if (!enTaberna(s)) {
      quitarDentro(npc);
      return;
    }
    d.saliendo = true;
    d.ruta = camino(d.G, d.x, d.y, ENTRADA_TABERNA[0], ENTRADA_TABERNA[1]) || [ENTRADA_TABERNA];
    d.i = 0;
    d.espera = 0;
    anim(s, { id: npc.id, sprite: d.sp }, 'walk');
  };
  const quitarDentro = npc => {
    const d = npc._ckDentro;
    if (!d) return;
    if (d.sp && d.sp.active) d.sp.destroy();
    const l = d.area.actors || [];
    const i = l.indexOf(d.act);
    if (i >= 0) l.splice(i, 1);
    npc._ckDentro = null;
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    if (mostrar0) mostrar0.apply(this, arguments);
    (this.campaignNPCs || []).forEach(n => n._ckDentro && quitarDentro(n));
    if (area && area.key === zonaTaberna && this._gameMode === 'campaign')
      (this.campaignNPCs || []).forEach(n => {
        if (n.vida && n.vida.modo === 'adentro' && n.vida.lugar === 'taberna') llegaATaberna(this, n, false);
      });
  };
  const aldea0 = P.onVillageShown;
  P.onVillageShown = function () {
    (this.campaignNPCs || []).forEach(n => n._ckDentro && quitarDentro(n));
    if (aldea0) return aldea0.apply(this, arguments);
  };
  const nombre0 = P.nameForTexture;
  P.nameForTexture = function (key) {
    if (enTaberna(this) && nombres[key]) return nombres[key];
    return nombre0.apply(this, arguments);
  };
  // adentro: caminan de mesa en mesa, miran al héroe si se acerca, y se van por la puerta
  const upd0 = P.update;
  P.update = function (time, delta) {
    const r = upd0.apply(this, arguments);
    if (this.currentInterior && this._gameMode === 'campaign' && this.campaignNPCs && this.campaignNPCs.every(n => n.vida)) vida(this);
    if (!enTaberna(this) || !this.campaignNPCs) return r;
    const pl = this.player && this.player.body;
    this.campaignNPCs.forEach(npc => {
      const d = npc._ckDentro;
      if (!d || !d.sp.active) return;
      const fake = { id: npc.id, sprite: d.sp };
      const cerca = pl && Phaser.Math.Distance.Between(pl.center.x, pl.center.y, d.sp.x, d.sp.y) < 34;
      if (cerca && !d.saliendo) {
        d.sp.setFlipX(pl.center.x < d.sp.x);
        if (d.ruta) anim(this, fake, 'idle');
        return;
      }
      if (d.ruta) {
        const p = d.ruta[d.i];
        if (!p) {
          d.ruta = null;
          if (d.saliendo) {
            quitarDentro(npc);
            return;
          }
          d.espera = azar(4000, 11000);
          anim(this, fake, 'idle');
          return;
        }
        const dx = p[0] - d.x,
          dy = p[1] - d.y,
          dist = Math.hypot(dx, dy),
          paso = (npc.speed * delta) / 1000;
        if (dist <= paso) {
          d.x = p[0];
          d.y = p[1];
          d.i++;
        } else {
          d.x += (dx / dist) * paso;
          d.y += (dy / dist) * paso;
          if (Math.abs(dx) > 0.4) d.sp.setFlipX(dx < 0);
        }
        d.sp.setPosition(d.area.x + d.x, d.area.y + d.y).setDepth(d.area.y + d.y);
        return;
      }
      d.espera -= delta;
      if (d.espera <= 0) {
        d.destino = uno(LUGARES_TABERNA);
        d.ruta = camino(d.G, d.x, d.y, d.destino[0], d.destino[1]);
        d.i = 0;
        if (d.ruta) anim(this, fake, 'walk');
        else d.espera = 3000;
      }
    });
    return r;
  };
  window.CK_VIDA = { grillaAldea, camino, cercana }; // para probar
})();
