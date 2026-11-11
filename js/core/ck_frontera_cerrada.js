'use strict';
/* La Frontera cerrada hasta terminar el Capítulo 1 (10/11, pedido del dueño: "que la zona del monolito antes de cruzar
   a la zona orca no sea accesible hasta terminar el capítulo uno; que donde esté el monolito haya soldados humanos
   cerrando el paso y digan que por el momento no es seguro pasar, y del otro lado veamos cadáveres de soldados y
   barricadas").
   - Camino al Castillo, salida del este (desde el 10/11, el camino al lado del castillo; la que va al Bosque de la Frontera, donde está el monolito): una barricada de
     estacas y dos soldados. Hasta que el Rey cierra el capítulo (paso 8) no se pasa: el sargento lo explica (T).
     Con el capítulo terminado, la barricada se corre, los soldados se hacen a un lado y te dejan pasar.
   - Bosque de la Frontera, apenas se entra: soldados del reino caídos, sangre, escudos tirados y barricadas rotas.
     Se miran con T.
   Para todas las partidas. Borrar su línea de index.html lo saca (el paso queda abierto como antes). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;
  const ZC = 'ed_camino_al_castillo.main', ZB = 'ed_bosque_de_la_frontera.main';
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const abierto = s => !!(s && s.step >= 8);
  const S0 = () => window.activeGameScene || null;

  // ------------------------------------------------------------------ el paso (camino al castillo, borde este)
  // (10/11) el paso se mudó: ya no se baja por la escalera del mirador; se sale por el camino del este, al lado del castillo
  const PASO = { x: 1410, y: 324, w: 26, h: 60 };
  const SOLDADOS = [['g_templar', 1398, 344, true], ['g_archer', 1400, 384, true]];   // (10/11) soldados leales: lanceros y arqueros
  const A_UN_LADO = [[1396, 296], [1404, 412]];
  STORY_NPCS.push({
    id: 'sargento_paso', x: 1398, y: 344, r: 48, name: 'Sargento del paso', face: 'g_templar_idle',
    get zone() { const s = st(S0()); return s ? ZC : '-'; },
    lines: s => {
      if (abierto(s)) return ['El Rey dio la orden: el paso es tuyo.', 'Del otro lado… preparate para lo que vas a ver. Ahí cayeron los nuestros.', 'Que los dioses te acompañen.'];
      if (s.flags && s.flags.llave_frontera) return ['¿Ésa es la llave de la Frontera? Primero llevásela al Rey. Sin su orden, de acá no pasa nadie.'];
      return [
        '¡Alto ahí! Por orden del Rey, nadie cruza a la Frontera.',
        'Por ahora no es seguro pasar. Del otro lado, en el bosque del monolito, cayó media guardia del este.',
        'Cuando el Rey dé la orden, te abrimos. Ni un minuto antes.'
      ];
    }
  });

  const cuerpoFijo = (S, x, y, w, h) => {
    const z = S.add.zone(x + w / 2, y + h / 2, w, h);
    S.physics.add.existing(z, true);
    if (S.interiorObstacles) S.interiorObstacles.add(z);
    return z;
  };
  const sprite = (S, tex, anim, x, y, o = {}) => {
    if (!S.textures.exists(tex)) return null;
    const sp = S.add.sprite(x, y, tex).setOrigin(0.5, 1).setScale(o.escala || 1.4).setDepth(o.prof !== undefined ? o.prof : y);
    if (anim && S.anims.exists(anim)) sp.play(anim);
    if (o.flip) sp.setFlipX(true);
    return sp;
  };
  const ultimoCuadro = (S, anim) => { const a = S.anims.get(anim); return a && a.frames.length ? a.frames[a.frames.length - 1].frame.name : 0; };

  const quitar = S => { (S._ckFront || []).forEach(o => { try { o && o.active && o.destroy(); } catch (e) {} }); S._ckFront = []; };
  const armarPaso = S => {
    const s = st(S), a = S.currentInterior.area, L = S._ckFront;
    const libre = abierto(s);
    // la barricada: cerrando el paso, o corrida contra el borde de abajo
    const bx = libre ? 1428 : 1424, by = libre ? 420 : 386;
    const b = sprite(S, 'ed_ot_estacas_1', null, a.x + bx, a.y + by, { escala: libre ? 0.62 : 0.82 });
    if (b) { if (!libre) b.setFlipX(true); L.push(b); }
    if (!libre) L.push(cuerpoFijo(S, a.x + PASO.x, a.y + PASO.y, PASO.w, PASO.h));
    SOLDADOS.forEach(([g, x, y, flip], i) => {
      const [px, py] = libre ? A_UN_LADO[i] : [x, y];
      const sp = sprite(S, g + '_idle', g + '_idle', a.x + px, a.y + py, { flip });
      if (sp) { L.push(sp); L.push(cuerpoFijo(S, sp.x - 7, sp.y - 8, 14, 8)); }
    });
  };

  // el borde: sin la orden del Rey, no se cruza
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'c2_bosque' && this._gameMode === 'campaign' && !abierto(st(this)) && !this._doorTransition) {
      if (!this._ckFrontAviso || this.time.now - this._ckFrontAviso > 2500) {
        this._ckFrontAviso = this.time.now;
        const sar = (this._ckFront || []).find(o => o && o.texture && o.texture.key === 'g_templar_idle');
        const t = '¡Alto! Por ahora no es seguro pasar.';
        if (sar && E) E.globo(this, sar, t, 2200); else this.createFloatingText(this.player.x, this.player.y - 46, t, 0xfca5a5);
      }
      try { if (this.player && this.player.body) this.player.body.reset(this.player.x - 18, this.player.y); } catch (e) {}
      return;
    }
    return cambiar0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ del otro lado: los que cayeron
  const CAIDOS = [
    // [hoja, x, y, mirando a la izquierda, qué dice con T]
    // (10/11) en el bosque grande, del otro lado de la cuarentena: los que cayeron antes de que se levantara la empalizada
    ['g_templar', 1150, 378, false, 'Un soldado del Roble. Todavía aprieta el escudo.'],
    ['g_templar', 1214, 520, true, 'Un lancero. La lanza está partida en dos, como mordida.'],
    ['g_archer', 1290, 470, false, 'Un arquero con la aljaba vacía. Disparó hasta la última flecha.'],
    ['g_templar', 1170, 600, true, 'Un recluta. Lleva una carta en el cinto: «Para mi madre, en el Roble».']
  ];
  const BARRICADAS = [['ed_ot_estacas_2', 1160, 330, 0.7, false], ['ed_ot_estacas_6', 1250, 600, 0.7, true], ['ed_ot_estacas_3', 1340, 520, 0.62, false]];
  const armarCaidos = S => {
    const a = S.currentInterior.area, L = S._ckFront;
    BARRICADAS.forEach(([k, x, y, e, flip]) => {
      const b = sprite(S, k, null, a.x + x, a.y + y, { escala: e, flip });
      if (b) { b.setTint(0xb8a890); L.push(b); L.push(cuerpoFijo(S, b.x - b.displayWidth * 0.32, b.y - 10, b.displayWidth * 0.64, 9)); }
    });
    CAIDOS.forEach(([g, x, y, flip]) => {
      const tex = g + '_death';
      if (!S.textures.exists(tex)) return;
      const sangre = S.add.ellipse(a.x + x + (flip ? -4 : 4), a.y + y - 2, 26, 8, 0x5a0d0d, 0.55).setDepth(a.y + y - 6);
      L.push(sangre);
      const sp = S.add.sprite(a.x + x, a.y + y, tex, ultimoCuadro(S, tex)).setOrigin(0.5, 1).setScale(1.4).setDepth(a.y + y - 4).setTint(0xc8c0b8);
      if (flip) sp.setFlipX(true);
      L.push(sp);
    });
  };
  const pistaCerca = S => {
    if (!S.currentInterior || S.currentZoneKey() !== ZB || !S.player || !S.player.body) return null;
    const a = S.currentInterior.area, b = S.player.body;
    return CAIDOS.find(([, x, y]) => Math.hypot(a.x + x - b.center.x, a.y + y - b.bottom) < 30) || null;
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const q = !this.dialogOpen && !this._overlay && pistaCerca(this);
      if (q) { if (E) E.globo(this, this.player, q[4], 3600, 50); return; }
    } catch (e) {}
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const q = !this.dialogOpen && pistaCerca(this), pr = document.getElementById('ck-prompt');
      if (q && pr && !pr.classList.contains('on')) { pr.textContent = 'T · Mirar'; pr.classList.add('on'); this._ckFrontPrompt = true; }
      else if (!q && this._ckFrontPrompt && pr) { this._ckFrontPrompt = false; if (pr.textContent === 'T · Mirar') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };

  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0.apply(this, arguments);
    try {
      quitar(this);
      if (this._gameMode === 'campaign' && this.currentInterior) {
        const z = this.currentZoneKey();
        if (z === ZC) armarPaso(this);
        if (z === ZB) armarCaidos(this);
      }
    } catch (e) { console.warn('[frontera cerrada]', e); }
    return r;
  };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () { quitar(this); return ald0.apply(this, arguments); };

  // cuando el Rey cierra el capítulo con el héroe todavía en el camino, el paso se abre en el momento
  const adv0 = P.advanceQuest;
  P.advanceQuest = function () {
    const r = adv0.apply(this, arguments);
    try { if (this.currentZoneKey && this.currentZoneKey() === ZC && abierto(st(this))) { quitar(this); armarPaso(this); } } catch (e) {}
    return r;
  };

  window.CK_FRONTERA_CERRADA = { PASO, SOLDADOS, CAIDOS, BARRICADAS, abierto };
})();
