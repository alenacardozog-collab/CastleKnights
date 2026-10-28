'use strict';
/* Patio de Armas, Aldea en Ruinas y el piso de arriba de la Casa grande, nuevos desde Google Flow (27/10, noche).
   - Patio de Armas y Aldea en Ruinas: el dibujo, las piezas (se pasa por detrás) y los choques de pie vienen de sus mapas
     del Taller (patio_de_armas, aldea_en_ruinas), pero el lugar sigue siendo el mismo para el juego (zonas castle.training y
     ruins.village): la historia (Capitán Bruno, Tobías, el Gran Esqueleto, el Nigromante), las bestias, la luz, el clima,
     la fauna y las partidas guardadas no cambian. Sólo se ponen la gente, las salidas y las bestias en su nuevo lugar.
   - Patio de Armas: se llega desde el portón oeste del Patio del Castillo por el portón del ESTE (entre las dos torres) y
     se vuelve por ahí. Reemplaza al parche del portón de ck_porton_armas.js.
   - Aldea en Ruinas: se llega desde la aldea por el sendero del sur y se vuelve por ahí. La capilla (y el Nigromante) está
     arriba al centro; el cementerio con el Gran Esqueleto, arriba a la derecha (se entra por el hueco de la cerca);
     Tobías junto a la fogata, al lado de la casita del huerto. El camino del este está anegado.
   - Casa grande: la escalera sube al piso de arriba nuevo (casa_de_arriba) y el hueco de la escalera baja otra vez.
   Si un mapa no está en el Taller, ese lugar queda como antes. Borrar la línea de index.html lo apaga entero. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen && INTERIOR_LAYOUTS['ed_' + id]);
  const PATIO_ID = 'patio_de_armas', RUINAS_ID = 'aldea_en_ruinas', ARRIBA_ID = 'casa_de_arriba', CASA_ID = 'casa_grande';
  // dibujos del minimapa (foto del mapa -> siluetas planas, estilizar3.py; en las ruinas el pantano se pintó de agua)
  const MINI = {
    training: 'data:image/png;base64,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',
    ruins: 'data:image/png;base64,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',
    casa_de_arriba: 'data:image/png;base64,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'
  };

  // el área de un mapa del Taller armada con el mismo kit (las piezas ya vienen partidas por ck_profundidad.js)
  const delTaller = (kit, id) => {
    const sub = Object.assign({}, kit, { areas: {} });
    INTERIOR_LAYOUTS['ed_' + id].call(null, sub);
    return sub.areas.main;
  };
  // el dibujo y los choques del Taller sobre un lugar viejo: queda su zona; la gente, las salidas y los efectos se ponen de nuevo
  const pasar = (a, n) => {
    ['w', 'h', 'groundKey', 'items', 'colliders', 'lights'].forEach(k => (a[k] = n[k] || []));
    a.w = n.w; a.h = n.h; a.groundKey = n.groundKey;
    a.rects = []; a.polys = []; a.doors = []; a.portals = []; a.exits = []; a.talkers = []; a.actors = []; a.fx = [];
  };
  const npc = id => (typeof STORY_NPCS !== 'undefined' ? STORY_NPCS.find(n => n.id === id) : null);

  // ================================================================== PATIO DE ARMAS (castle.training)
  const PA = {
    llegada: { x: 838, y: 264 }, // al venir del patio, del otro lado del portón del este
    salida: { x: 930, y: 256, w: 28, h: 17 }, // el paso entre las dos torres
    capitan: { x: 548, y: 214 } // frente al armero de las espadas
  };
  const patio = hay(PATIO_ID);
  if (patio) {
    const L0 = INTERIOR_LAYOUTS.castle;
    INTERIOR_LAYOUTS.castle = function (kit) {
      const r = L0.apply(this, arguments);
      try {
        const A = kit.areas || {}, t = A.training, yard = A.courtyard;
        if (t) {
          pasar(t, delTaller(kit, PATIO_ID));
          const habla = (x, y, lines, rr) => t.talkers.push({ x, y, lines, r: rr || 40 });
          // el Capitán Bruno junto a los armeros, un recluta con los muñecos, otro en la arena y una arquera en el tiro
          kit.person(t, 'g_knight_idle', 'g_knight_idle', PA.capitan.x, PA.capitan.y, { scale: 1.2 });
          habla(PA.capitan.x, PA.capitan.y + 4, ['¡Postura firme, recluta! 🛡️', 'Cien golpes al muñeco antes de comer', 'Las armas están en los armeros; cuidadlas'], 44);
          t.actors.push({ type: 'walker', key: 'g_axeman_idle', idle: 'g_axeman_idle', walk: 'g_axeman_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 30,
            pts: [[470, 140, 2400], [516, 140, 2200], [560, 140, 1400]], lines: ['¡Uno, dos... estocada!', 'Este muñeco no se rinde 😅'] });
          t.actors.push({ type: 'walker', key: 'g_templar_idle', idle: 'g_templar_idle', walk: 'g_templar_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 26,
            pts: [[560, 300, 1200], [640, 300, 1200], [600, 340, 1800]], lines: ['Entrad a la arena si os atrevéis ⚔️', 'Aquí se entrena cuerpo a cuerpo'] });
          kit.person(t, 'g_archer_idle', 'g_archer_idle', 704, 134, { scale: 1.2 });
          habla(704, 138, ['No crucéis la línea mientras disparan 🏹', 'A cincuenta pasos, siempre al centro'], 40);
          habla(338, 196, ['Carpas del armero: afilado y reparación 🔧'], 36);
          habla(116, 366, ['Depósito de la intendencia. Cerrado.'], 28);
          habla(376, 304, ['El pozo de la guarnición. El agua está fría como el acero'], 30);
          habla(345, 486, ['Carpa de la enfermería: vendas, hierbas y un catre'], 30);
          habla(902, 264, ['▶ Al Patio del Castillo'], 26);
          t.fx.push({ type: 'dust', x: 500, y: 250, w: 200, h: 130 });
          t.exits.push({ x: PA.salida.x, y: PA.salida.y, w: PA.salida.w, h: PA.salida.h, key: 'walk', to: 'courtyard', arrive: { x: 30, y: 300 }, hint: '▶ Volver al patio' });
          t.spawn = { x: PA.llegada.x, y: PA.llegada.y };
        }
        if (yard) yard.exits.forEach(e => { if (e.to === 'training') e.arrive = { x: PA.llegada.x, y: PA.llegada.y }; });
      } catch (e) { console.warn('[patio de armas nuevo]', e); }
      return r;
    };
    const cap = npc('captain');
    if (cap) Object.assign(cap, { x: PA.capitan.x, y: PA.capitan.y });
  }

  // ================================================================== ALDEA EN RUINAS (ruins.village)
  const RU = {
    llegada: { x: 552, y: 505 }, // al venir de la aldea, al pie del sendero del sur
    salida: { x: 526, y: 520, w: 54, h: 14 },
    fogata: { x: 378, y: 278 }, // sobre la fogata dibujada
    ermitano: { x: 350, y: 272 },
    capilla: { x: 522, y: 220 } // frente a la puerta (de acá sale el Nigromante: story.js y ck_historia.js leen CK_CAPILLA)
  };
  const ruinas = hay(RUINAS_ID);
  if (ruinas) {
    window.CK_CAPILLA = RU.capilla;
    const FUEGO = 0xff8a3c, FRIO = 0x9fb8d8;
    const L0 = INTERIOR_LAYOUTS.ruins;
    INTERIOR_LAYOUTS.ruins = function (kit) {
      const r = L0.apply(this, arguments);
      try {
        const v = kit.areas && kit.areas.village;
        if (!v) return r;
        pasar(v, delTaller(kit, RUINAS_ID));
        const habla = (x, y, lines, rr) => v.talkers.push({ x, y, lines, r: rr || 40 });
        // la fogata de Tobías (encendida sobre la del dibujo) y él, al lado
        v.items.push({ key: 'campfire_anim', anim: 'campfire_burn', x: RU.fogata.x, baseY: RU.fogata.y, scale: 1, shadow: 26, embers: [0, -20] });
        v.colliders.push({ x: RU.fogata.x - 12, y: RU.fogata.y - 12, w: 24, h: 12 });
        kit.light(v, RU.fogata.x, RU.fogata.y - 8, 60, FUEGO, 0.3); kit.light(v, RU.fogata.x, RU.fogata.y - 22, 16, FUEGO, 0.36, { halo: true });
        v.items.push({ key: 'npc2_villager', anim: 'npc2_idle', x: RU.ermitano.x, baseY: RU.ermitano.y, scale: 1.3 });
        v.colliders.push({ x: RU.ermitano.x - 7, y: RU.ermitano.y - 8, w: 14, h: 8 });
        habla(RU.ermitano.x, RU.ermitano.y - 4, ['No queda nadie más… 🕯️', 'La niebla llegó una noche y no se fue', 'No entres a la capilla de noche ⛪', 'El pantano se tragó el camino del este']);
        habla(600, 508, ['«Aldea de Brumavieja»', 'El cartel está roto: «…no pas…»'], 30);
        habla(522, 186, ['La puerta de la capilla está trabada ⛪', 'Algo se mueve adentro…'], 30);
        habla(132, 150, ['La torre vigía se derrumbó por dentro'], 34);
        habla(566, 420, ['La fuente está seca'], 26);
        habla(196, 470, ['Las aspas crujen con el viento 🌬️'], 34);
        habla(724, 140, ['Tumbas sin nombre…', 'Alguien dejó flores hace poco'], 46);
        habla(920, 244, ['El pantano se tragó el camino del este. No se puede seguir'], 30);
        // agua fría del pantano, la ventana de la capilla, la torre
        v.fx.push({ type: 'glints', x: 830, y: 300, w: 120, h: 200, n: 12 }, { type: 'glints', x: 0, y: 240, w: 40, h: 260, n: 6 });
        kit.light(v, 522, 94, 22, FRIO, 0.3, { halo: true });
        kit.light(v, 132, 60, 18, FRIO, 0.16, { halo: true });
        // ceniza con viento, bancos de niebla, tormenta lejana
        v.fx.push({ type: 'ash', x: -60, y: -40, w: v.w + 60, h: v.h });
        v.fx.push({ type: 'fog', x: 0, y: 0, w: v.w, h: v.h, n: 12 });
        v.fx.push({ type: 'storm', x: 0, y: 0, w: v.w, h: v.h });
        // el pantano respira; cuervos en techos y árboles secos que vuelan cuando se acerca el héroe
        v.fx.push({ type: 'bubbles', x: 830, y: 300, w: 120, h: 200 }, { type: 'bubbles', x: 0, y: 240, w: 40, h: 260, slow: true });
        v.fx.push({ type: 'crows', pts: [[316, 172], [500, 40], [732, 282], [382, 348], [118, 82], [826, 104], [830, 222], [690, 446], [200, 334], [610, 92]] });
        v.exits.push({ x: RU.salida.x, y: RU.salida.y, w: RU.salida.w, h: RU.salida.h, key: 'down', to: 'outside', hint: '▼ Volver a la aldea' });
        v.spawn = { x: RU.llegada.x, y: RU.llegada.y };
      } catch (e) { console.warn('[aldea en ruinas nueva]', e); }
      return r;
    };
    const ermitano = npc('hermit');
    if (ermitano) Object.assign(ermitano, { x: RU.ermitano.x, y: RU.ermitano.y });
    // los muertos caminan por el nuevo dibujo (el Gran Esqueleto, adentro del cementerio)
    if (typeof ZONE_ENEMIES !== 'undefined')
      ZONE_ENEMIES['ruins.village'] = [
        ['skeleton', 470, 250, 40], ['skeleton', 640, 236, 40], ['skeleton', 560, 456, 36],
        ['skeleton_archer', 300, 322, 30], ['skeleton_archer', 700, 214, 26],
        ['skeleton_armored', 214, 300, 36], ['skeleton_armored', 666, 446, 30],
        ['bat', 160, 200, 50], ['bat', 870, 170, 36], ['bat', 380, 196, 40],
        ['slime', 884, 244, 26], ['slime', 760, 252, 30], ['slime', 520, 476, 30],
        ['skeleton_great', 726, 134, 22],
        ['skeleton_armored', 520, 470, 36, 'night'], ['skeleton_archer', 610, 226, 36, 'night'], ['bat', 560, 470, 50, 'night']
      ];
  }

  // ================================================================== PISO DE ARRIBA DE LA CASA GRANDE
  const arriba = hay(ARRIBA_ID) && hay(CASA_ID);
  const ABAJO = { x: 419, y: 62 }; // arriba de la escalera de la casa grande
  if (arriba) {
    const zona = 'ed_' + ARRIBA_ID + '.main', m = D.mapas[ARRIBA_ID];
    if (!(m.sonido && m.sonido.length)) m.sonido = [['amb_fire', 0.12]];
    window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + ARRIBA_ID]: 'casa' });
    const L = window.CK_LUZ;
    if (L && L.INTERIORES) L.INTERIORES.add(zona);
    if (L && L.AMB_SALA) L.AMB_SALA[zona] = [196, 184, 168];
    // la escalera de la casa grande sube acá; el hueco de la escalera de acá baja a la casa grande
    const cambiar0 = P.switchInteriorArea;
    P.switchInteriorArea = function (nombre) {
      const c = this.currentInterior;
      if (c && nombre === 'upper' && !this._doorTransition && this._gameMode === 'campaign' && c.building.kind === 'ed_' + CASA_ID && this.ckEntrar(ARRIBA_ID, 'Entrada')) return;
      return cambiar0.apply(this, arguments);
    };
    const salir0 = P.exitInterior;
    P.exitInterior = function () {
      const c = this.currentInterior;
      if (c && !this._doorTransition && c.building.kind === 'ed_' + ARRIBA_ID && this.ckEntrar(CASA_ID, ABAJO)) return;
      return salir0.apply(this, arguments);
    };
    // al continuar una partida guardada arriba: la vuelta a la aldea es la puerta de la casa
    const entrar0 = P.ckEntrar;
    P.ckEntrar = function (id) {
      const afuera = !this.currentInterior;
      const r = entrar0.apply(this, arguments);
      if (r && afuera && id === ARRIBA_ID) {
        const p = (this.doorSprites || []).find(d => d._interiorKind === 'casa');
        if (p) this._interiorReturn = { x: p.x, y: p.y + 10, zoom: this._interiorReturn ? this._interiorReturn.zoom : this.cameras.main.zoom };
      }
      return r;
    };
    const L1 = INTERIOR_LAYOUTS['ed_' + ARRIBA_ID];
    INTERIOR_LAYOUTS['ed_' + ARRIBA_ID] = function (kit) {
      const r = L1.apply(this, arguments), a = kit.areas && kit.areas.main;
      if (a) {
        a.talkers = a.talkers || [];
        a.talkers.push({ x: 180, y: 196, r: 30, lines: ['Dos camas tendidas, como si alguien fuera a volver esta noche'] });
        a.talkers.push({ x: 332, y: 132, r: 26, lines: ['El ropero huele a lavanda y a lana'] });
        a.talkers.push({ x: 306, y: 196, r: 22, lines: ['▼ Bajar'] });
      }
      return r;
    };
  }

  // ================================================================== si una partida vieja quedó guardada fuera del mapa nuevo
  const mostrar0 = P.onAreaShown;
  if (mostrar0)
    P.onAreaShown = function () {
      const r = mostrar0.apply(this, arguments);
      try {
        const c = this.currentInterior, a = c && c.area, b = this.player && this.player.body;
        const nuevo = c && ((patio && c.building.kind === 'castle' && c.areaName === 'training') || (ruinas && c.building.kind === 'ruins'));
        if (nuevo && b && (b.center.x - a.x > a.w - 4 || b.bottom - a.y > a.h - 2 || b.center.x < a.x || b.bottom < a.y))
          this.placePlayerFeetAt(a.x + a.spawn.x, a.y + a.spawn.y);
      } catch (e) {}
      return r;
    };

  // ================================================================== minimapa
  const MM = window.CK_MINIMAPA;
  if (MM && MM.Z && MM.L) {
    const PATIO = 'castle.courtyard', RUINAS = 'ruins.village', ALDEA = 'village';
    const metas = (zona, xy) => (MM.META_PASO || []).forEach(t => { if (t[0] === zona && t[1] !== null) xy(t); });
    if (patio) {
      Object.assign(MM.Z['castle.training'], { w: D.mapas[PATIO_ID].w, h: D.mapas[PATIO_ID].h });
      MM.L['castle.training'] = [
        { n: 'Capitán Bruno', x: PA.capitan.x, y: PA.capitan.y, ic: 'espada' },
        { n: 'Arena', x: 604, y: 312, ic: 'estrella' },
        { n: 'Volver al patio', x: 950, y: 264, ic: 'flecha', d: 'e', va: PATIO }
      ];
      metas('castle.training', t => { t[1] = PA.capitan.x; t[2] = PA.capitan.y; });
      if (MM.dibujo && MINI.training) MM.dibujo('training', MINI.training);
    }
    if (ruinas) {
      Object.assign(MM.Z[RUINAS], { w: D.mapas[RUINAS_ID].w, h: D.mapas[RUINAS_ID].h });
      MM.L[RUINAS] = [
        { n: 'Tobías el ermitaño', x: RU.ermitano.x, y: RU.ermitano.y, ic: 'persona' },
        { n: 'Capilla', x: 522, y: 120, ic: 'cruz' },
        { n: 'Cementerio', x: 724, y: 130, ic: 'tumba' },
        { n: 'Torre caída', x: 132, y: 80, ic: 'torre' },
        { n: 'Plaza', x: 566, y: 380, ic: 'fuente' },
        { n: 'Molino', x: 196, y: 400, ic: 'estrella' },
        { n: 'Salida a la aldea', x: 552, y: 530, ic: 'flecha', d: 's', va: ALDEA }
      ];
      // pasos de la historia en las ruinas: Tobías, el cementerio, la capilla
      const nuevos = [[RU.ermitano.x, RU.ermitano.y], [724, 134], [RU.capilla.x, RU.capilla.y]];
      let i = 0;
      metas(RUINAS, t => { const p = nuevos[Math.min(i++, nuevos.length - 1)]; t[1] = p[0]; t[2] = p[1]; });
      if (MM.dibujo && MINI.ruins) MM.dibujo('ruins', MINI.ruins);
    }
    if (arriba) {
      const zona = 'ed_' + ARRIBA_ID + '.main', m = D.mapas[ARRIBA_ID];
      if (!MM.Z[zona]) MM.Z[zona] = { img: ARRIBA_ID, esc: 2, w: m.w, h: m.h, n: 'Casa grande · arriba', g: 'Aldea del Roble' };
      if (!MM.L[zona]) MM.L[zona] = [{ n: 'Bajar la escalera', x: 306, y: 190, ic: 'flecha', d: 's', va: 'ed_' + CASA_ID + '.main' }];
      if (MM.dibujo && MINI[ARRIBA_ID]) MM.dibujo(ARRIBA_ID, MINI[ARRIBA_ID]);
    }
  }

  window.CK_LUGARES_FLOW = { PA, RU, patio, ruinas, arriba };
})();
