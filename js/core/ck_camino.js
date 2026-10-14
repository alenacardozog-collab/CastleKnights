'use strict';
/* Camino al Castillo nuevo (mapa del Taller "camino_al_castillo") en lugar del camino viejo:
   - desde la aldea (camino del sur) se llega acá; la salida del oeste vuelve a la aldea;
   - el puente levadizo sube y baja como antes (el tablero es el del dibujo nuevo, con sus cadenas);
   - el portón lleva al patio, y la salida del patio vuelve frente al puente;
   - los guardias del portón, el viajero de la fogata y el mirador, con sus textos de siempre;
   - las bestias del camino cuentan para la misión igual que antes.
   Va fuera del bloque del Taller en index.html. Si el mapa no está, todo queda como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  const ID = 'camino_al_castillo',
    KIND = 'ed_' + ID,
    ZONA = KIND + '.main';
  if (!D || !D.mapas || !D.mapas[ID] || D.mapas[ID].origen) return;
  const PUENTE = { x: 1189, y0: 357, y1: 425, w: 46, agua0: 372, agua1: 418, cadena: 303 },
    TABLERO =
      'data:image/png;base64,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',
    FRENTE_PUENTE = { x: 1189, y: 440 },
    usar = s => s._gameMode === 'campaign' && window.CK_EDITOR && window.CK_EDITOR.indice && window.CK_EDITOR.indice[ID] !== undefined;

  if (!D.mapas[ID].sonido || !D.mapas[ID].sonido.length) D.mapas[ID].sonido = [['amb_forest', 0.55]];

  // ------------------------------------------------------------------ entrar y salir
  // la aldea sigue llamando a enterCastle (con su sonido): solo cambia lo que se arma
  const armar0 = P.buildInterior;
  P.buildInterior = function (door) {
    if (this._ckCaminoPendiente && door && door._interiorKind === 'castle' && !door._ck) {
      this._ckCaminoPendiente = false;
      return armar0.call(this, { _houseName: 'Ed_' + ID, _interiorIndex: window.CK_EDITOR.indice[ID], _interiorKind: KIND });
    }
    return armar0.apply(this, arguments);
  };
  const entrar0 = P.enterCastle;
  P.enterCastle = function () {
    if (usar(this) && !this._doorTransition && !this.currentInterior) this._ckCaminoPendiente = true;
    return entrar0.apply(this, arguments);
  };
  const irAlPatio = s => {
    s.fadeTransition(() => {
      s.setInteriorVisible(null);
      const b = s.buildInterior({ _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle', _ck: true }),
        area = b.areas.courtyard;
      s.currentInterior = { building: b, areaName: 'courtyard', area };
      s._areaSwitchHold = true;
      s.showInteriorArea(area, area.spawn);
      if (area.title) s.createFloatingText(area.spawn.x, area.spawn.y - 46, area.title, 0xfde68a);
    });
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    const c = this.currentInterior;
    if (c && !this._doorTransition && usar(this)) {
      if (c.building.kind === KIND && nombre === 'courtyard') return irAlPatio(this);
      if (c.building.kind === 'castle' && nombre === 'road' && this.ckEntrar(ID, FRENTE_PUENTE)) return;
    }
    return cambiar0.apply(this, arguments);
  };

  // la misión del camino cuenta las bestias de este mapa como las del camino viejo
  const vencido0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    if (enemy && enemy.zone === ZONA) enemy.zone = 'castle.road';
    return vencido0.apply(this, arguments);
  };
  if (typeof WORLD_MAP !== 'undefined') {
    const road = WORLD_MAP.find(m => m.id === 'road');
    if (road) road.zones.push(ZONA);
  }

  // ------------------------------------------------------------------ gente del camino
  const GENTE = {
    personas: [
      ['g_templar_idle', 'g_templar_idle', 1153, 452, { escala: 1.2 }],
      ['g_templar_idle', 'g_templar_idle', 1225, 452, { escala: 1.2, flip: true }],
      ['npc2_villager', 'npc2_idle', 690, 404, { escala: 1.3, oy: 1, flip: true }]
    ],
    charlas: [
      [1189, 456, ['¡Bajad el puente! Viene un viajero 🏰', 'Bienvenido al castillo del rey', 'Cruzad con cuidado, el foso es hondo'], 50],
      [690, 400, ['El castillo está cruzando el foso 🏰', 'Buen fuego para descansar 🔥', 'Dicen que el rey busca héroes ⚔️'], 40],
      [808, 596, ['Linda vista desde el mirador 🌄', 'Desde acá se ve todo el camino del castillo'], 40]
    ]
  };
  const borrar = s => {
    (s._ckCamino || []).forEach(o => o && o.destroy && o.destroy());
    s._ckCamino = null;
    s._ckPuente = null;
    s._ckCabana = null;
    s._ckPajaros = null;
  };
  const crear = (s, area) => {
    borrar(s);
    const ox = area.x,
      oy = area.y,
      objs = (s._ckCamino = []);
    ['talkers', 'portals', 'actors'].forEach(k => (area[k] = (area[k] || []).filter(o => !o.ck)));
    const solido = (x, y, w, h) => {
      if (!s.interiorObstacles) return null;
      const z = s.add.zone(ox + x + w / 2, oy + y + h / 2, w, h);
      s.physics.add.existing(z, true);
      s.interiorObstacles.add(z);
      objs.push(z);
      return z;
    };
    GENTE.personas.forEach(([key, an, x, y, o]) => {
      if (!s.textures.exists(key)) return;
      const sp = s.add
        .sprite(ox + x, oy + y, key)
        .setOrigin(0.5, o.oy === undefined ? 0.61 : o.oy)
        .setScale(o.escala)
        .setFlipX(!!o.flip)
        .setDepth(oy + y);
      if (s.anims.exists(an)) sp.play(an);
      objs.push(sp);
      const pie = solido(x - 8, y - 8, 16, 8);
      if (pie) pie._navSkip = true;
      // they stand at their post, but react to beasts like the castle people (guards fight, Ruy runs away)
      if (s.actorRole)
        area.actors.push({ type: 'walker', ck: true, sprite: sp, pts: [[ox + x, oy + y, 1e12]], i: 0, wait: 1e12, speed: 30, solid: pie,
          idle: an, walk: an.replace(/_idle$/, '_walk'),
          lines: null, talkAt: 0, moving: false, role: s.actorRole(key), hp: 5, maxHp: 5 });
    });
    GENTE.charlas.forEach(([x, y, lines, r]) => area.talkers.push({ x: ox + x, y: oy + y, lines, r, talkAt: 0, ck: true }));
    // el portón: ARRIBA para pasar al patio
    area.portals.push({ x: ox + PUENTE.x, y: oy + 352, half: 14, to: 'courtyard', hint: '▲ Entrar al castillo', hintAt: 0, ck: true });

    // puente levadizo: alzado (tapa el portón) hasta que el héroe se acerca
    const b = PUENTE,
      len = b.y1 - b.y0,
      blocker = solido(b.x - b.w / 2, b.agua0, b.w, b.agua1 - b.agua0);
    let img = null;
    if (s.textures.exists('ck_camino_tablero')) {
      img = s.add
        .image(ox + b.x, oy + b.y0, 'ck_camino_tablero')
        .setOrigin(0.5, 0)
        .setDepth(7.6);
      img._sy = 1;
      img.setScale(1, -0.9).setTint(0x8f7f72);
      objs.push(img);
    }
    const chains = s.add.graphics().setDepth(7.7);
    objs.push(chains);
    s._ckPuente = { img, chains, blocker, t: 0, x: ox + b.x, y0: oy + b.y0, y1: oy + b.y1, w: b.w, len, cad: oy + b.cadena, moving: false };
    dibujarCadenas(s._ckPuente, -0.9);
    crearCabana(s, area, objs);
    crearPajaros(s, area, objs);
  };

  // ------------------------------------------------------------------ la cabaña: humo de la chimenea y luz en la ventana de noche
  const CABANA = {
    chimenea: { x: 184, y: 78 },
    vidrios: [
      [209, 136, 6, 4],
      [216, 136, 7, 4],
      [209, 142, 6, 5],
      [216, 142, 7, 5]
    ],
    ventana: { x: 216, y: 141 },
    piso: { x: 216, y: 206 }
  };
  /** 0 de día, sube al atardecer, 1 de noche, baja al amanecer (igual que la sombra de la noche del juego). */
  const noche = s => {
    if (!s.dayPhase) return 0;
    const p = s.dayPhase();
    return Phaser.Math.Clamp(p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.1 : p < 0.92 ? 1 : (1 - p) / 0.08, 0, 1);
  };
  const texturas = s => {
    if (!s.textures.exists('ck_humo')) {
      const t = s.textures.createCanvas('ck_humo', 12, 12),
        c = t.getContext(),
        g = c.createRadialGradient(6, 6, 0, 6, 6, 6);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 12, 12);
      t.refresh();
    }
    if (!s.textures.exists('ck_brillo')) {
      const t = s.textures.createCanvas('ck_brillo', 64, 64),
        c = t.getContext(),
        g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,214,140,1)');
      g.addColorStop(0.35, 'rgba(255,170,80,0.45)');
      g.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      t.refresh();
    }
  };
  const crearCabana = (s, area, objs) => {
    texturas(s);
    const ox = area.x,
      oy = area.y,
      arriba = oy + area.h + 40,
      ch = CABANA.chimenea;
    // humo que sube y se va con el viento
    const humo = s.add
      .particles(ox + ch.x, oy + ch.y, 'ck_humo', {
        x: { min: -2, max: 2 },
        speedY: { min: -16, max: -9 },
        speedX: { min: 2, max: 9 },
        accelerationX: 3,
        lifespan: { min: 2600, max: 3800 },
        scale: { start: 0.5, end: 1.9 },
        alpha: { start: 0.55, end: 0 },
        tint: [0xd8d4cc, 0xbfb9b0, 0xa8a29a],
        frequency: 240,
        quantity: 1
      })
      .setDepth(arriba);
    objs.push(humo);
    // ventana: vidrios encendidos + resplandor (por encima de la sombra de la noche, así ilumina)
    const vid = s.add.graphics().setDepth(27501).setAlpha(0);
    CABANA.vidrios.forEach(([x, y, w, h]) => {
      vid.fillStyle(0xffd27a, 1).fillRect(ox + x, oy + y, w, h);
      vid.fillStyle(0xfff0b8, 1).fillRect(ox + x + 1, oy + y + 1, Math.max(1, w - 3), Math.max(1, h - 3));
    });
    const halo = s.add
      .image(ox + CABANA.ventana.x, oy + CABANA.ventana.y, 'ck_brillo')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(70, 70)
      .setDepth(27502)
      .setAlpha(0);
    const charco = s.add
      .image(ox + CABANA.piso.x, oy + CABANA.piso.y, 'ck_brillo')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(90, 40)
      .setDepth(27502)
      .setAlpha(0);
    objs.push(vid, halo, charco);
    s._ckCabana = { vid, halo, charco, luz: 0 };
  };
  const actualizarCabana = s => {
    const k = s._ckCabana;
    if (!k || !k.vid.active) return;
    // la luz se prende cuando ya oscureció bastante y se apaga al amanecer, de a poco
    const meta = noche(s) > 0.35 ? 1 : 0;
    k.luz += (meta - k.luz) * Math.min(1, s.game.loop.delta / 900);
    const tit = 0.92 + 0.08 * Math.sin(s.time.now / 170) * Math.sin(s.time.now / 530);
    k.vid.setAlpha(k.luz * (0.85 + 0.15 * tit));
    k.halo.setAlpha(k.luz * 0.5 * tit);
    k.charco.setAlpha(k.luz * 0.22 * tit);
  };

  // ------------------------------------------------------------------ pajaritos: picotean, saltan, cantan y se van volando a otro lado si el héroe se acerca
  const POSADEROS = [
    [236, 236],
    [196, 262],
    [262, 300],
    [344, 372],
    [214, 360],
    [528, 296],
    [560, 290],
    [606, 286],
    [760, 372],
    [690, 290],
    [948, 300],
    [978, 196],
    [920, 120],
    [1100, 430],
    [1290, 452],
    [1248, 470],
    [612, 520],
    [700, 540],
    [880, 552],
    [90, 404]
  ];
  const ESPECIES = [
    { cuerpo: '#3f6fc4', panza: '#f0a656', ala: '#2b4f94', pico: '#2a2a2a' }, // azulejo
    { cuerpo: '#7a5a40', panza: '#e0603a', ala: '#5c4230', pico: '#3a2a20' }, // petirrojo
    { cuerpo: '#f2d23c', panza: '#fbe98a', ala: '#2a2a2a', pico: '#c87a2a' }, // jilguero
    { cuerpo: '#c8b49a', panza: '#f4ece0', ala: '#8e7a62', pico: '#4a3a2a' } // gorrión
  ];
  const texPajaro = (s, i) => {
    const key = 'ck_pajaro' + i;
    if (s.textures.exists(key)) return key;
    const e = ESPECIES[i],
      t = s.textures.createCanvas(key, 40, 8),
      c = t.getContext();
    const P = (f, col, pts) => {
      c.fillStyle = col;
      pts.forEach(([x, y, w, h]) => c.fillRect(f * 10 + x, y, w || 1, h || 1));
    };
    // 0 parado, 1 picoteando, 2 alas arriba, 3 alas abajo (mira a la derecha)
    P(0, e.cuerpo, [
      [3, 3, 4, 3],
      [6, 2, 2, 2],
      [2, 4, 1, 1]
    ]);
    P(0, e.panza, [
      [4, 5, 3, 1],
      [6, 4, 1, 1]
    ]);
    P(0, e.ala, [[3, 3, 2, 2]]);
    P(0, e.pico, [
      [8, 3],
      [7, 2],
      [4, 6, 1, 2],
      [6, 6, 1, 2]
    ]);
    P(1, e.cuerpo, [
      [2, 3, 4, 3],
      [6, 4, 2, 2],
      [1, 3, 1, 1]
    ]);
    P(1, e.panza, [[3, 5, 3, 1]]);
    P(1, e.ala, [[2, 3, 2, 2]]);
    P(1, e.pico, [
      [8, 6],
      [7, 5],
      [3, 6, 1, 2],
      [5, 6, 1, 2]
    ]);
    P(2, e.cuerpo, [
      [3, 4, 4, 2],
      [7, 3, 2, 2],
      [1, 4, 2, 1]
    ]);
    P(2, e.ala, [
      [3, 1, 2, 3],
      [5, 0, 2, 3]
    ]);
    P(2, e.panza, [[4, 5, 3, 1]]);
    P(2, e.pico, [[9, 4]]);
    P(3, e.cuerpo, [
      [3, 3, 4, 2],
      [7, 2, 2, 2],
      [1, 3, 2, 1]
    ]);
    P(3, e.ala, [
      [3, 5, 2, 2],
      [5, 5, 2, 3]
    ]);
    P(3, e.panza, [[4, 4, 3, 1]]);
    P(3, e.pico, [[9, 3]]);
    t.refresh();
    [0, 1, 2, 3].forEach(f => t.add(f, 0, f * 10, 0, 10, 8));
    if (!s.anims.exists(key + '_vuela'))
      s.anims.create({
        key: key + '_vuela',
        frames: [
          { key, frame: 2 },
          { key, frame: 3 }
        ],
        frameRate: 12,
        repeat: -1
      });
    return key;
  };
  const crearPajaros = (s, area, objs) => {
    const ox = area.x,
      oy = area.y,
      lista = [];
    const libres = POSADEROS.map(p => [ox + p[0], oy + p[1]]);
    Phaser.Utils.Array.Shuffle(libres);
    libres.slice(0, 13).forEach(([x, y], i) => {
      const esp = i % ESPECIES.length,
        key = texPajaro(s, esp),
        sp = s.add
          .sprite(x, y, key, 0)
          .setOrigin(0.5, 1)
          .setScale(1.4)
          .setDepth(y)
          .setFlipX(Math.random() < 0.5);
      objs.push(sp);
      lista.push({ sp, key, x, y, estado: 'suelo', t: Phaser.Math.Between(500, 3000), vuelo: Phaser.Math.Between(15000, 40000) });
    });
    s._ckPajaros = { lista, puntos: libres, canto: s.time.now + 3000, area };
  };
  const volar = (s, b, hx, hy) => {
    const P = s._ckPajaros;
    // otro posadero que no esté al lado del héroe ni ocupado
    const opciones = P.puntos.filter(
      ([x, y]) =>
        Phaser.Math.Distance.Between(x, y, hx, hy) > 110 &&
        Phaser.Math.Distance.Between(x, y, b.x, b.y) < 380 &&
        !P.lista.some(o => o !== b && Phaser.Math.Distance.Between(o.x, o.y, x, y) < 8)
    );
    if (!opciones.length) return;
    const [nx, ny] = Phaser.Utils.Array.GetRandom(opciones),
      x0 = b.sp.x,
      y0 = b.sp.y,
      dur = Phaser.Math.Clamp(Phaser.Math.Distance.Between(x0, y0, nx, ny) * 6, 900, 2600),
      alto = Phaser.Math.Between(30, 60);
    b.estado = 'vuela';
    b.sp
      .setFlipX(nx < x0)
      .setDepth(P.area.y + P.area.h + 30)
      .play(b.key + '_vuela');
    const k = { t: 0 };
    s.tweens.add({
      targets: k,
      t: 1,
      duration: dur,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!b.sp.active) return;
        b.sp.setPosition(x0 + (nx - x0) * k.t, y0 + (ny - y0) * k.t - Math.sin(k.t * Math.PI) * alto);
      },
      onComplete: () => {
        if (!b.sp.active) return;
        b.x = nx;
        b.y = ny;
        b.sp.stop().setFrame(0).setPosition(nx, ny).setDepth(ny);
        b.estado = 'suelo';
        b.t = Phaser.Math.Between(600, 2000);
        b.vuelo = Phaser.Math.Between(15000, 40000);
      }
    });
  };
  const actualizarPajaros = s => {
    const P = s._ckPajaros;
    if (!P || !s.player) return;
    const dt = s.game.loop.delta,
      body = s.player.body,
      hx = body.center.x,
      hy = body.center.y,
      dormidos = noche(s) > 0.5;
    let cerca = false;
    P.lista.forEach(b => {
      if (!b.sp.active) return;
      // de noche duermen (no se ven); a la mañana vuelven
      const alfa = dormidos ? 0 : 1;
      if (b.sp.alpha !== alfa && b.estado === 'suelo') b.sp.setAlpha(Phaser.Math.Linear(b.sp.alpha, alfa, Math.min(1, dt / 600)));
      if (dormidos || b.estado !== 'suelo') return;
      const d = Phaser.Math.Distance.Between(hx, hy, b.x, b.y);
      if (d < 200) cerca = true;
      if (d < 44) return volar(s, b, hx, hy);
      b.vuelo -= dt;
      if (b.vuelo <= 0) return volar(s, b, b.x, b.y);
      b.t -= dt;
      if (b.t > 0) return;
      const r = Math.random();
      if (r < 0.45) {
        b.sp.setFrame(1);
        s.time.delayedCall(Phaser.Math.Between(180, 320), () => b.sp.active && b.estado === 'suelo' && b.sp.setFrame(0));
      } else if (r < 0.75) {
        const dx = Phaser.Math.Between(-7, 7);
        b.sp.setFlipX(dx < 0);
        b.x += dx;
        s.tweens.add({ targets: b.sp, x: b.x, duration: 180 });
        s.tweens.add({ targets: b.sp, y: b.y - 3, duration: 90, yoyo: true });
      } else b.sp.setFlipX(!b.sp.flipX);
      b.t = Phaser.Math.Between(500, 2200);
    });
    // cantan de vez en cuando si el héroe anda cerca
    if (cerca && !dormidos && s.time.now > P.canto) {
      P.canto = s.time.now + Phaser.Math.Between(4000, 9000);
      if (window.CK_SONIDO && CK_SONIDO.tocar)
        CK_SONIDO.tocar('ev_pajaro', { vol: 0.2, rate: Phaser.Math.FloatBetween(1.05, 1.3), pan: Phaser.Math.FloatBetween(-0.5, 0.5) });
    }
  };
  const dibujarCadenas = (br, k) => {
    const tipY = br.y0 + br.len * k;
    br.chains.clear();
    br.chains.lineStyle(1, 0x30303a, 0.95);
    br.chains.lineBetween(br.x - br.w / 2 + 3, br.cad, br.x - br.w / 2 + 3, tipY);
    br.chains.lineBetween(br.x + br.w / 2 - 3, br.cad, br.x + br.w / 2 - 3, tipY);
  };
  const actualizarPuente = s => {
    const br = s._ckPuente;
    if (!br || !s.player) return;
    const body = s.player.body,
      fx = body.center.x,
      fy = body.center.y;
    const sobre = body.right > br.x - br.w / 2 && body.left < br.x + br.w / 2 && body.bottom > br.y0 && body.top < br.y1;
    const cerca = sobre || Phaser.Math.Distance.Between(fx, fy, br.x, br.y1 + 6) <= 78 || (fy <= br.y0 + 4 && Math.abs(fx - br.x) < 60);
    const meta = cerca ? 1 : 0;
    if (br.t === meta) return;
    if (!br.moving) {
      br.moving = true;
      if (typeof sfx !== 'undefined') sfx.fx('bridge_move', 0.8, { minGap: 600 });
    }
    const paso = s.game.loop.delta / 1100;
    br.t = meta > br.t ? Math.min(1, br.t + paso) : Math.max(0, br.t - paso);
    const k = -0.9 + 1.9 * Phaser.Math.Easing.Quadratic.In(br.t);
    if (br.img) {
      br.img.setScale(1, k);
      const sh = Math.round(143 + 112 * Phaser.Math.Clamp((k + 0.9) / 1.9, 0, 1));
      br.img.setTint(Phaser.Display.Color.GetColor(sh, sh, sh));
    }
    if (br.blocker && br.blocker.body) br.blocker.body.enable = br.t < 0.97;
    dibujarCadenas(br, k);
    if (br.t === meta) {
      br.moving = false;
      if (meta === 1) {
        s.cameras.main.shake(140, 0.004);
        if (typeof sfx !== 'undefined') sfx.fx('door_gate', 0.5, { minGap: 500 });
        if (s.textures.exists('fx_px')) {
          const polvo = s.add
            .particles(br.x, br.y1, 'fx_px', {
              speedX: { min: -40, max: 40 },
              speedY: { min: -18, max: 4 },
              lifespan: 600,
              alpha: { start: 0.7, end: 0 },
              scale: { start: 1.2, end: 3 },
              tint: [0xd9c9a8, 0xb8a888],
              emitting: false
            })
            .setDepth(br.y1 + 4);
          polvo.explode(14);
          s.time.delayedCall(900, () => polvo.destroy());
        }
      }
    }
  };

  const precarga0 = P.preload;
  P.preload = function () {
    if (precarga0) precarga0.apply(this, arguments);
    if (!this.textures.exists('ck_camino_tablero')) this.load.image('ck_camino_tablero', TABLERO);
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    if (mostrar0) mostrar0.apply(this, arguments);
    if (area && area.key === ZONA && this._gameMode === 'campaign') {
      if (!this.textures.exists('ck_camino_tablero')) {
        this.textures.once('addtexture-ck_camino_tablero', () => this._ckCamino && crear(this, area));
        this.textures.addBase64('ck_camino_tablero', TABLERO);
      }
      crear(this, area);
    } else borrar(this);
  };
  const aldea0 = P.onVillageShown;
  P.onVillageShown = function () {
    borrar(this);
    if (aldea0) return aldea0.apply(this, arguments);
  };
  const interior0 = P.updateInterior;
  P.updateInterior = function () {
    const r = interior0.apply(this, arguments);
    if (this._ckPuente && this.currentZoneKey && this.currentZoneKey() === ZONA) {
      actualizarPuente(this);
      actualizarCabana(this);
      actualizarPajaros(this);
    }
    return r;
  };
  window.CK_CAMINO = { ID, ZONA, PUENTE, FRENTE_PUENTE };
})();
