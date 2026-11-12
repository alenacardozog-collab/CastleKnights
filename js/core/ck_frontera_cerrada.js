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

  // la barricada del paso (PixelLab, 27x95): se carga con el resto de las imágenes
  const BARR = 'ck_barricada_paso', BARR_IMG = 'data:image/png;base64,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';
  const pre0 = P.preload;
  P.preload = function () {
    const r = pre0.apply(this, arguments);
    try { if (!this.textures.exists(BARR)) this.load.image(BARR, BARR_IMG); } catch (e) {}
    return r;
  };
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
    // la barricada (11/11, pedido: "en la barricada hacia la tierra orca generá una con PixelLab en la posición que se
    // espera"): antes eran unas estacas orcas sueltas, cortadas por el borde del mapa. Ahora es una barricada del reino
    // hecha para este lugar (PixelLab): cuatro tramos de troncos cruzados con su banderín, de arriba abajo contra el
    // borde del este, cerrando justo la salida del camino. Con el capítulo terminado se abre como un portón: dos tramos
    // corridos hacia arriba y dos hacia abajo, y el camino queda libre.
    if (S.textures.exists(BARR)) {
      const tx = S.textures.get(BARR);
      if (!tx.has('arriba')) { tx.add('arriba', 0, 0, 0, 27, 48); tx.add('abajo', 0, 0, 48, 27, 47); }
      const X = a.x + 1422;
      if (!libre) {
        L.push(S.add.image(X, a.y + 404, BARR, '__BASE').setOrigin(0.5, 1).setDepth(a.y + 318));
        L.push(cuerpoFijo(S, a.x + 1408, a.y + 312, 28, 92));
      } else {
        L.push(S.add.image(X, a.y + 322, BARR, 'arriba').setOrigin(0.5, 1).setDepth(a.y + 290));
        L.push(S.add.image(X, a.y + 434, BARR, 'abajo').setOrigin(0.5, 1).setDepth(a.y + 400));
        L.push(cuerpoFijo(S, a.x + 1408, a.y + 278, 28, 44)); L.push(cuerpoFijo(S, a.x + 1408, a.y + 390, 28, 44));
      }
    } else {
      const bx = libre ? 1428 : 1424, by = libre ? 420 : 386;
      const b = sprite(S, 'ed_ot_estacas_1', null, a.x + bx, a.y + by, { escala: libre ? 0.62 : 0.82 });
      if (b) { if (!libre) b.setFlipX(true); L.push(b); }
      if (!libre) L.push(cuerpoFijo(S, a.x + PASO.x, a.y + PASO.y, PASO.w, PASO.h));
    }
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
