'use strict';
/* Mapas nuevos del Taller dentro de la campaña:
   - la puerta de la taberna de la aldea lleva a "Taberna 2";
   - la puerta del Gran Salón (en el patio del castillo) lleva al "Salón del Trono 3", y su salida vuelve al patio;
   - el Rey Aldric espera sentado en el trono; al hablarle se levanta, baja del estrado y después recorre el salón.
   Va fuera del bloque del Taller en index.html: las exportaciones del editor no lo pisan. Si un mapa no está, todo queda como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const TABERNA = 'taberna_2',
    TRONO = 'salon_del_trono_3',
    hay = id => !!(D.mapas[id] && !D.mapas[id].origen),
    kindTrono = 'ed_' + TRONO,
    zonaTrono = kindTrono + '.main';

  // ------------------------------------------------------------------ taberna
  // la puerta de la taberna sigue siendo la misma (con su sonido y su vuelta a la aldea): solo cambia lo que se arma adentro
  const armar0 = P.buildInterior;
  P.buildInterior = function (door) {
    if (
      door &&
      door._interiorKind === 'bar' &&
      hay(TABERNA) &&
      this._gameMode === 'campaign' &&
      window.CK_EDITOR &&
      window.CK_EDITOR.indice
    )
      return armar0.call(this, {
        _houseName: 'Ed_' + TABERNA,
        _interiorIndex: window.CK_EDITOR.indice[TABERNA],
        _interiorKind: 'ed_' + TABERNA
      });
    return armar0.apply(this, arguments);
  };
  // ambiente y eco de los salones viejos para los mapas nuevos
  const AMBIENTE = {
    [TABERNA]: [
      ['amb_taberna', 0.55],
      ['amb_fire', 0.15]
    ],
    [TRONO]: [
      ['amb_hall', 0.6],
      ['amb_fire', 0.16]
    ]
  };
  Object.keys(AMBIENTE).forEach(id => {
    if (hay(id) && !(D.mapas[id].sonido && D.mapas[id].sonido.length)) D.mapas[id].sonido = AMBIENTE[id];
  });
  window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + TABERNA]: 'taberna', ['ed_' + TRONO]: 'salon' });

  // ------------------------------------------------------------------ salón del trono
  // del castillo al salón nuevo (y de vuelta): la puerta del patio, y los arcos de los Aposentos y la Biblioteca
  const ARCOS = [
    { x: 64, to: 'kingroom', hint: '▲ Aposentos del Rey', llegada: { x: 64, y: 86 } },
    { x: 416, to: 'library', hint: '▲ Biblioteca', llegada: { x: 416, y: 86 } }
  ];
  const irAlCastillo = (s, nombre, llegada) => {
    s.fadeTransition(() => {
      s.setInteriorVisible(null);
      const b = s.buildInterior({ _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle' }),
        area = b.areas[nombre];
      s.currentInterior = { building: b, areaName: nombre, area };
      s._areaSwitchHold = true;
      const at = llegada ? { x: area.x + llegada.x, y: area.y + llegada.y } : area.spawn;
      s.showInteriorArea(area, at);
      if (area.title) s.createFloatingText(at.x, at.y - 46, area.title, 0xfde68a);
    });
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre, llegada) {
    const c = this.currentInterior;
    if (c && !this._doorTransition && hay(TRONO) && this._gameMode === 'campaign') {
      if (nombre === 'throne' && c.building.kind === 'castle') {
        // desde los Aposentos o la Biblioteca se llega por su arco; desde el patio, por la entrada de abajo
        const arco = ARCOS.find(a => a.to === c.areaName);
        if (this.ckEntrar(TRONO, arco ? arco.llegada : undefined)) return;
      }
      if (c.building.kind === kindTrono && ARCOS.some(a => a.to === nombre)) {
        irAlCastillo(this, nombre);
        return;
      }
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior;
    if (c && c.building.kind === kindTrono && !this._doorTransition) {
      // la salida del salón vuelve al patio del castillo, frente a la puerta del Gran Salón
      irAlCastillo(this, 'courtyard', { x: 320, y: 182 });
      return;
    }
    return salir0.apply(this, arguments);
  };

  // la corte del salón viejo, tal cual (con sus textos), en el salón nuevo
  const CORTE = {
    personas: [
      ['npc9_villager', 'npc9_idle', 212, 100, { escala: 1.3, oy: 1 }],
      ['npc8_villager', 'npc8_idle', 268, 102, { escala: 1.3, oy: 1, flip: true }],
      ['npc5_villager', 'npc5_idle', 128, 250, { escala: 1.3, oy: 1 }],
      ['g_templar_idle', 'g_templar_idle', 176, 112, { escala: 1.2 }],
      ['g_templar_idle', 'g_templar_idle', 304, 112, { escala: 1.2, flip: true }],
      ['g_knight_idle', 'g_knight_idle', 208, 500, { escala: 1.2 }],
      ['g_knight_idle', 'g_knight_idle', 272, 500, { escala: 1.2, flip: true }]
    ],
    charlas: [
      [212, 106, ['Reina Elara: Bienvenido a nuestra casa 👑', 'Reina Elara: El jardín ya no huele igual desde que llegó la niebla…'], 30],
      [268, 108, ['Princesa Lía: ¿Es cierto que viste las ruinas? 😮', 'Princesa Lía: ¡Yo también quiero aprender a usar la espada!'], 30],
      [
        128,
        254,
        ['Lady Mirena: Llevo horas esperando audiencia…', 'Lady Mirena: Mis tierras lindan con Brumavieja. Ya nadie quiere trabajarlas.'],
        34
      ],
      [240, 150, ['Inclinaos ante Su Majestad.', 'Hablad con respeto al rey 👑'], 44]
    ],
    // el paje cruza el salón con mensajes (su ronda va por los bordes de la alfombra)
    paje: {
      key: 'npc4_villager',
      idle: 'npc4_idle',
      walk: 'npc4_walk',
      escala: 1.3,
      vel: 30,
      pts: [
        [220, 470, 2400],
        [220, 170, 1800],
        [260, 170, 2400],
        [260, 470, 1800]
      ],
      lines: ['¡Paso, paso! Mensaje para el rey 📜', 'Hoy hay banquete en el salón 🍗']
    }
  };
  const borrarCorte = s => {
    (s._ckCorte || []).forEach(o => o && o.destroy());
    s._ckCorte = null;
  };
  const crearCorte = (s, area) => {
    borrarCorte(s);
    const ox = area.x,
      oy = area.y,
      objs = (s._ckCorte = []);
    ['talkers', 'actors', 'portals'].forEach(k => (area[k] = (area[k] || []).filter(o => !o.ck)));
    const solido = (x, y) => {
      if (!s.interiorObstacles) return;
      const z = s.add.zone(ox + x, oy + y - 4, 16, 8);
      s.physics.add.existing(z, true);
      s.interiorObstacles.add(z);
      objs.push(z);
    };
    CORTE.personas.forEach(([key, an, x, y, o]) => {
      if (!s.textures.exists(key)) return;
      const sp = s.add
        .sprite(ox + x, oy + y, key)
        .setOrigin(0.5, o.oy === undefined ? 0.61 : o.oy)
        .setScale(o.escala)
        .setFlipX(!!o.flip)
        .setDepth(oy + y);
      if (s.anims.exists(an)) sp.play(an);
      objs.push(sp);
      solido(x, y);
    });
    CORTE.charlas.forEach(([x, y, lines, r]) => area.talkers.push({ x: ox + x, y: oy + y, lines, r, talkAt: 0, ck: true }));
    const pj = CORTE.paje;
    if (s.textures.exists(pj.key)) {
      const p0 = pj.pts[0],
        sp = s.add
          .sprite(ox + p0[0], oy + p0[1], pj.key)
          .setOrigin(0.5, 1)
          .setScale(pj.escala)
          .setDepth(oy + p0[1]);
      if (s.anims.exists(pj.idle)) sp.play(pj.idle);
      objs.push(sp);
      area.actors.push({
        type: 'walker',
        ck: true,
        sprite: sp,
        pts: pj.pts.map(p => [ox + p[0], oy + p[1], p[2] || 0]),
        i: 1,
        wait: p0[2] || 0,
        speed: pj.vel,
        idle: pj.idle,
        walk: pj.walk,
        lines: pj.lines,
        talkAt: 0,
        moving: false
      });
    }
    // arcos en la pared del fondo: ARRIBA para pasar
    ARCOS.forEach(a => area.portals.push({ x: ox + a.x, y: oy + 58, half: 16, to: a.to, hint: a.hint, hintAt: 0, ck: true }));
  };

  // la historia: el Rey vive ahora en el salón nuevo; el mapa del diario reconoce los dos mapas
  const REY = typeof STORY_NPCS !== 'undefined' ? STORY_NPCS.find(n => n.id === 'king') : null;
  const TRONO_X = 240,
    TRONO_Y = 73, // pie del trono en el mapa
    PIE_ESTRADO = { x: 240, y: 104 };
  if (REY && hay(TRONO)) Object.assign(REY, { zone: zonaTrono, x: TRONO_X, y: 92, r: 58 });
  if (typeof WORLD_MAP !== 'undefined') {
    const cas = WORLD_MAP.find(m => m.id === 'castle'),
      ald = WORLD_MAP.find(m => m.id === 'village');
    if (cas && hay(TRONO)) cas.zones.push(kindTrono + '.');
    if (ald && hay(TABERNA)) ald.zones.push('ed_' + TABERNA + '.');
  }

  // ------------------------------------------------------------------ el Rey
  const SENTADO = window.CK_REY_SENTADO; // { datos, fw, fh, n } (ck_rey_assets.js)
  const precargar0 = P.preload;
  P.preload = function () {
    precargar0.apply(this, arguments);
    if (SENTADO && !this.textures.exists('ck_rey_sentado'))
      this.load.spritesheet('ck_rey_sentado', SENTADO.datos, { frameWidth: SENTADO.fw, frameHeight: SENTADO.fh });
  };
  const crear0 = P.create;
  P.create = function () {
    const r = crear0.apply(this, arguments);
    if (SENTADO && this.textures.exists('ck_rey_sentado') && !this.anims.exists('ck_rey_sentado'))
      this.anims.create({
        key: 'ck_rey_sentado',
        frames: SENTADO.sentado.map(i => ({ key: 'ck_rey_sentado', frame: i })),
        frameRate: 2,
        repeat: -1,
        yoyo: true
      });
    return r;
  };

  const ESCALA = 1.2, // como el resto de la gente en los mapas del Taller
    VEL = 26; // píxeles por segundo al caminar
  // recorrido por la nave (sobre la alfombra, entre la guardia): [x, y, espera en ms]
  const RONDA = [
    [240, 104, 2600],
    [236, 190, 1800],
    [244, 290, 2200],
    [240, 420, 2600],
    [244, 290, 1600],
    [236, 190, 1800]
  ];
  const borrarRey = s => {
    const k = s._ckRey;
    if (!k) return;
    [k.sentado, k.de_pie, k.cartel].forEach(o => o && o.destroy());
    s._ckRey = null;
  };
  const crearRey = (s, area) => {
    borrarRey(s);
    const ox = area.x,
      oy = area.y,
      k = { ox, oy, estado: 'sentado', t: 0, i: 0, espera: 0 };
    if (s.textures.exists('ck_rey_sentado')) {
      k.sentado = s.add
        .sprite(ox + TRONO_X, oy + TRONO_Y - SENTADO.alto, 'ck_rey_sentado', SENTADO.sentado[0])
        .setOrigin(0.5, 1)
        .setScale(SENTADO.escala || 1)
        .setDepth(oy + TRONO_Y + 3);
      if (s.anims.exists('ck_rey_sentado')) k.sentado.play('ck_rey_sentado');
    }
    k.de_pie = s.add
      .sprite(ox + TRONO_X, oy + PIE_ESTRADO.y, 'king_idle')
      .setOrigin(0.54, 0.61)
      .setScale(ESCALA)
      .setVisible(!k.sentado);
    if (s.anims.exists('kingprueba_idle')) k.de_pie.play('kingprueba_idle');
    if (!k.sentado) k.estado = 'parado';
    k.cartel = s.add
      .text(0, 0, REY ? REY.name : 'Rey', {
        fontFamily: 'Pixuf, MedievalSharp, monospace',
        fontSize: '8px',
        fill: '#fde68a',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5, 1);
    s._ckRey = k;
    ponerRey(s, k, TRONO_X, k.sentado ? TRONO_Y : PIE_ESTRADO.y);
  };
  /** Mueve al Rey (coordenadas del mapa) y lleva con él el punto de charla de la historia. */
  const ponerRey = (s, k, x, y) => {
    k.x = x;
    k.y = y;
    k.de_pie.setPosition(k.ox + x, k.oy + y).setDepth(k.oy + y);
    const arriba = k.estado === 'sentado' ? SENTADO.alto + SENTADO.fh * (SENTADO.escala || 1) - 2 : 32;
    k.cartel.setPosition(k.ox + x, k.oy + y - arriba).setDepth(k.oy + y + 200);
    if (REY) {
      REY.x = x;
      REY.y = k.estado === 'sentado' ? 92 : y;
    }
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    if (mostrar0) mostrar0.apply(this, arguments);
    if (area && area.key === zonaTrono && this._gameMode === 'campaign') {
      crearRey(this, area);
      crearCorte(this, area);
    } else {
      borrarRey(this);
      borrarCorte(this);
    }
  };
  const aldea0 = P.onVillageShown;
  P.onVillageShown = function () {
    borrarRey(this);
    borrarCorte(this);
    if (aldea0) return aldea0.apply(this, arguments);
  };

  // al empezar a hablarle: se levanta del trono y baja hasta el pie del estrado
  const dialogo0 = P.openDialog;
  P.openDialog = function (nombre) {
    const k = this._ckRey;
    if (k && REY && nombre === REY.name && this.currentZoneKey() === zonaTrono) {
      if (k.estado === 'sentado') levantar(this, k);
      else if (k.estado === 'paseando') {
        k.estado = 'hablando';
        k.de_pie.play('kingprueba_idle', true);
      }
    }
    return dialogo0.apply(this, arguments);
  };
  const levantar = (s, k) => {
    k.estado = 'levantandose';
    const pasos = SENTADO.levantarse || [];
    let n = 0;
    const siguiente = () => {
      if (!k.sentado || !k.sentado.active) return;
      if (n < pasos.length) {
        k.sentado.anims.stop();
        k.sentado.setFrame(pasos[n++]);
        s.time.delayedCall(170, siguiente);
        return;
      }
      // ya de pie: aparece la versión que camina, sobre el asiento, y baja los escalones
      k.sentado.setVisible(false);
      k.de_pie.setVisible(true);
      ponerRey(s, k, TRONO_X, TRONO_Y + 6);
      if (s.anims.exists('kingprueba_walk')) k.de_pie.play('kingprueba_walk', true);
      s.tweens.addCounter({
        from: TRONO_Y + 6,
        to: PIE_ESTRADO.y,
        duration: ((PIE_ESTRADO.y - TRONO_Y - 6) / VEL) * 1000,
        onUpdate: tw => ponerRey(s, k, TRONO_X, tw.getValue()),
        onComplete: () => {
          k.estado = 'hablando';
          if (s.anims.exists('kingprueba_idle')) k.de_pie.play('kingprueba_idle', true);
        }
      });
    };
    siguiente();
  };

  // cada cuadro: mira al héroe, y cuando termina la charla recorre el salón
  const actualizar0 = P.update;
  P.update = function (time, delta) {
    const r = actualizar0.apply(this, arguments);
    const k = this._ckRey;
    if (!k || !k.de_pie || !k.de_pie.active || !this.player || !this.player.body) return r;
    const fx = this.player.body.center.x,
      fy = this.player.body.center.y,
      cerca = Phaser.Math.Distance.Between(fx, fy, k.ox + k.x, k.oy + k.y) < 40;
    if (k.estado === 'hablando') {
      k.de_pie.setFlipX(fx < k.ox + k.x - 4);
      if (!this.dialogOpen) {
        k.estado = 'paseando';
        k.i = 1;
        k.espera = 900;
      }
    } else if (k.estado === 'paseando') {
      if (this.dialogOpen || cerca) {
        // se detiene a mirar a quien se le acerca
        if (k.de_pie.anims.currentAnim && k.de_pie.anims.currentAnim.key !== 'kingprueba_idle') k.de_pie.play('kingprueba_idle', true);
        k.de_pie.setFlipX(fx < k.ox + k.x - 4);
        return r;
      }
      if (k.espera > 0) {
        k.espera -= delta;
        if (k.de_pie.anims.currentAnim && k.de_pie.anims.currentAnim.key !== 'kingprueba_idle') k.de_pie.play('kingprueba_idle', true);
        return r;
      }
      const p = RONDA[k.i],
        dx = p[0] - k.x,
        dy = p[1] - k.y,
        d = Math.hypot(dx, dy),
        paso = (VEL * delta) / 1000;
      if (d <= paso) {
        ponerRey(this, k, p[0], p[1]);
        k.espera = p[2];
        k.i = (k.i + 1) % RONDA.length;
        // en las pausas mira a los costados de la sala
        k.de_pie.setFlipX(k.i % 2 === 0);
      } else {
        if (k.de_pie.anims.currentAnim && k.de_pie.anims.currentAnim.key !== 'kingprueba_walk') k.de_pie.play('kingprueba_walk', true);
        if (Math.abs(dx) > 0.5) k.de_pie.setFlipX(dx < 0);
        ponerRey(this, k, k.x + (dx / d) * paso, k.y + (dy / d) * paso);
      }
    }
    return r;
  };
})();
