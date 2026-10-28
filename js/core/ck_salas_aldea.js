'use strict';
/* Casas de la aldea y Cocina Real nuevas (27/10, imágenes de Google Flow del dueño, armadas como mapas del Taller):
   - Casa grande, Tienda de Víveres y Granero: la puerta de cada casa de la aldea lleva al mapa nuevo (como la Taberna);
     la salida de abajo es un paso abierto (sin puerta dibujada) y vuelve a la aldea, frente a la puerta.
   - Cocina Real: la puerta de la cocina en el patio del castillo lleva al mapa nuevo; su salida vuelve al patio.
   - Se pasa por detrás de las cosas (cada mueble es una pieza que tapa al héroe cuando está más arriba) y los choques
     son sólo la base de cada cosa.
   - Casa grande: la escalera se sube de verdad y arriba lleva al piso de arriba (el de antes, hasta que haya uno nuevo).
   - Granero: el altillo se sube por la escalera de mano y se camina arriba y por debajo; la vaca está en su corral.
   - Tienda: el tendero atiende detrás del mostrador y T abre la tienda (lo mismo que vendía antes).
   - Cocina: el cocinero va y viene entre el fogón y las mesas; la despensa de arriba se sube por sus escalones.
   - Luz de sala, eco, sonido de ambiente y dibujo del minimapa como los demás lugares nuevos.
   Si un mapa no está, todo queda como antes. Borrar la línea de index.html lo apaga. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen);

  // tipo de casa del juego viejo -> mapa nuevo
  const CASAS = {
    casa: { id: 'casa_grande', zonaVieja: 'casa.main', n: 'Casa grande', eco: 'casa', sala: [200, 188, 172], sonido: [['amb_fire', 0.3]] },
    tienda: { id: 'tienda_de_viveres', zonaVieja: 'tienda.main', n: 'Tienda de Víveres', eco: 'casa', sala: [200, 188, 172], sonido: [['amb_fire', 0.15]] },
    granero: { id: 'granero', zonaVieja: 'granero.main', n: 'Granero', eco: 'granero', sala: [196, 186, 168], sonido: [['amb_granero', 0.5]] }
  };
  const COCINA = { id: 'cocina_real', zonaVieja: 'castle.kitchen', n: 'Cocina Real', eco: 'cocina', sala: [204, 190, 176], sonido: [['amb_kitchen', 0.6], ['amb_fire', 0.2]], patio: { x: 130, y: 182 } };
  const activas = Object.keys(CASAS).filter(k => hay(CASAS[k].id));
  const cocina = hay(COCINA.id);
  if (!activas.length && !cocina) return;
  const kindDe = id => 'ed_' + id;
  const casaDeKind = kd => activas.find(k => kindDe(CASAS[k].id) === kd);
  const esCocina = kd => cocina && kd === kindDe(COCINA.id);

  // ------------------------------------------------------------------ ambiente, eco, luz de sala
  const todas = activas.map(k => CASAS[k]).concat(cocina ? [COCINA] : []);
  todas.forEach(s => {
    const m = D.mapas[s.id], zona = kindDe(s.id) + '.main';
    if (!(m.sonido && m.sonido.length)) m.sonido = s.sonido;
    window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { [kindDe(s.id)]: s.eco });
    const L = window.CK_LUZ;
    if (L && L.INTERIORES) L.INTERIORES.add(zona);
    if (L && L.AMB_SALA) L.AMB_SALA[zona] = s.sala;
  });

  // ------------------------------------------------------------------ entrar y salir
  // la puerta de la casa sigue siendo la misma (sonido y vuelta a la aldea): solo cambia lo que se arma adentro
  const armar0 = P.buildInterior;
  P.buildInterior = function (door) {
    const k = door && door._interiorKind;
    if (k && CASAS[k] && activas.includes(k) && !this._ckCasaVieja && this._gameMode === 'campaign' && window.CK_EDITOR && window.CK_EDITOR.indice) {
      const id = CASAS[k].id;
      return armar0.call(this, { _houseName: 'Ed_' + id, _interiorIndex: window.CK_EDITOR.indice[id], _interiorKind: kindDe(id) });
    }
    return armar0.apply(this, arguments);
  };
  // al continuar una partida guardada adentro de una casa: la vuelta es la puerta de esa casa
  const entrar0 = P.ckEntrar;
  P.ckEntrar = function (id) {
    const afuera = !this.currentInterior;
    const r = entrar0.apply(this, arguments);
    if (r && afuera) {
      const k = activas.find(c => CASAS[c].id === id);
      const p = k && (this.doorSprites || []).find(d => d._interiorKind === k);
      if (p) this._interiorReturn = { x: p.x, y: p.y + 10, zoom: this._interiorReturn ? this._interiorReturn.zoom : this.cameras.main.zoom };
    }
    return r;
  };
  // volver a una zona vieja del castillo (como ck_salas_castillo.js)
  const irAlCastillo = (S, nombre, llegada) => {
    S.fadeTransition(() => {
      S.setInteriorVisible(null);
      const b = S.buildInterior({ _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle' }),
        area = b.areas[nombre];
      S.currentInterior = { building: b, areaName: nombre, area };
      S._areaSwitchHold = true;
      const at = llegada ? { x: area.x + llegada.x, y: area.y + llegada.y } : area.spawn;
      S.showInteriorArea(area, at);
      if (area.title) S.createFloatingText(at.x, at.y - 46, area.title, 0xfde68a);
    });
  };
  // el piso de arriba de la casa (el de antes) y la vuelta a la escalera nueva
  const arriba = S => {
    S.fadeTransition(() => {
      S.setInteriorVisible(null);
      S._ckCasaVieja = true;
      let b;
      try { b = S.buildInterior({ _houseName: 'Casa_vieja_arriba', _interiorIndex: 92, _interiorKind: 'casa' }); } finally { S._ckCasaVieja = false; }
      const area = b.areas.upper;
      S.currentInterior = { building: b, areaName: 'upper', area };
      S._areaSwitchHold = true;
      S.showInteriorArea(area, area.spawn);
      S.createFloatingText(area.spawn.x, area.spawn.y - 46, 'Piso de arriba', 0xfde68a);
    });
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    const c = this.currentInterior;
    if (c && !this._doorTransition && this._gameMode === 'campaign') {
      // cocina del patio -> cocina nueva
      if (cocina && nombre === 'kitchen' && c.building.kind === 'castle' && c.areaName === 'courtyard' && this.ckEntrar(COCINA.id, 'Entrada')) return;
      // escalera de la casa nueva -> piso de arriba; y de arriba, la escalera baja a la casa nueva
      if (nombre === 'upper' && casaDeKind(c.building.kind) === 'casa') return arriba(this);
      if (nombre === 'main' && c.building.kind === 'casa' && c.areaName === 'upper' && activas.includes('casa') && this.ckEntrar(CASAS.casa.id, { x: 419, y: 62 })) return;
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior;
    if (c && !this._doorTransition && esCocina(c.building.kind)) return irAlCastillo(this, 'courtyard', COCINA.patio);
    return salir0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ gente, animales y pasos especiales
  const EXTRA = {
    casa: a => {
      // arriba de la escalera: al piso de arriba
      a.exits.push({ x: 404, y: 36, w: 32, h: 10, key: 'walk', to: 'upper', hint: '▲ Subir' });
      a.talkers.push({ x: 160, y: 186, r: 26, lines: ['La cuna todavía se mece sola 👶', 'Huele a pan y a lana'] });
    },
    tienda: a => {
      // el tendero, detrás del mostrador (el mostrador lo tapa de la cintura para abajo)
      a.items.push({ key: 'npc3_villager', anim: 'npc3_idle', x: 228, baseY: 110, scale: 1.85, oy: 1, ox: 0.5 });
      a.talkers.push({ x: 236, y: 160, r: 40, lines: ['¡Bienvenido! Apretá T para comprar 🧺', 'Pociones frescas, antorchas, piedras de afilar…', 'De noche, llevá una antorcha: el monte no perdona'] });
    },
    granero: a => {
      // la vaca, en el corral de la paja (el de la derecha)
      a.actors.push({ type: 'cow', x0: 197, x1: 212, y: 104 });
      a.talkers.push({ x: 204, y: 140, r: 24, lines: ['Muuu 🐄'] });
    },
    cocina: a => {
      a.actors.push({ type: 'walker', key: 'npc3_villager', idle: 'npc3_idle', walk: 'npc3_walk', scale: 1.85, speed: 30,
        pts: [[160, 196, 2400], [240, 196, 1600], [240, 114, 3400], [300, 132, 2200], [240, 160, 1500]],
        lines: ['¡No toquéis el guiso! 🍲', 'El rey quiere jabalí esta noche 🐗', 'Probad el pan, está tibio 🍞'] });
      a.fx.push({ type: 'steam', x: 242, y: 74 });
    }
  };
  const envolver = (id, extra) => {
    const L = typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS[kindDe(id)];
    if (!L) return;
    INTERIOR_LAYOUTS[kindDe(id)] = function (kit) {
      const r = L.apply(this, arguments), a = kit.areas && kit.areas.main;
      if (a) { a.exits = a.exits || []; a.talkers = a.talkers || []; a.actors = a.actors || []; a.items = a.items || []; a.fx = a.fx || []; extra(a); }
      return r;
    };
  };
  activas.forEach(k => envolver(CASAS[k].id, EXTRA[k]));
  if (cocina) envolver(COCINA.id, EXTRA.cocina);
  // la vaca del granero nuevo, a la medida del corral
  const armar1 = P.buildInterior;
  P.buildInterior = function () {
    const b = armar1.apply(this, arguments);
    try {
      if (b && b.kind === kindDe(CASAS.granero.id) && !b._ckVaca) {
        b._ckVaca = true;
        Object.values(b.areas).forEach(ar => (ar.actors || []).forEach(x => { if (x.type === 'cow' && x.sprite) x.sprite.setScale(1.5); }));
      }
    } catch (e) {}
    return b;
  };

  // ------------------------------------------------------------------ tienda: T compra lo mismo que en la tienda vieja
  const T = window.CK_TIENDAS && window.CK_TIENDAS.TIENDAS;
  if (T && activas.includes('tienda')) {
    const vieja = T.find(t => /Víveres/.test(t.nombre));
    if (vieja) T.unshift({ zona: new RegExp('^' + kindDe(CASAS.tienda.id) + '\\.'), nombre: vieja.nombre, vende: vieja.vende, x: 270, y: 166, r: 80 });
  }

  // ------------------------------------------------------------------ minimapa
  // dibujos planos (foto del mapa -> siluetas planas, estilizar3.py), como los demás lugares
  const MINI = {
    casa_grande: 'data:image/png;base64,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',
    granero: 'data:image/png;base64,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',
    tienda_de_viveres: 'data:image/png;base64,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',
    cocina_real: 'data:image/png;base64,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'
  };
  const MM = window.CK_MINIMAPA;
  if (MM && MM.Z && MM.L) {
    const ALDEA = 'village', PATIO = 'castle.courtyard';
    const DATOS = {
      casa: { lugares: [{ n: 'Hogar', x: 354, y: 120, ic: 'fuego' }, { n: 'Escalera', x: 419, y: 60, ic: 'flecha', d: 'n' }, { n: 'Salida a la aldea', x: 240, y: 248, ic: 'flecha', d: 's', va: ALDEA }] },
      tienda: { lugares: [{ n: 'Mostrador', x: 270, y: 140, ic: 'moneda' }, { n: 'Salida a la aldea', x: 240, y: 238, ic: 'flecha', d: 's', va: ALDEA }] },
      granero: { lugares: [{ n: 'Altillo', x: 350, y: 56, ic: 'estrella' }, { n: 'Salida a la aldea', x: 240, y: 248, ic: 'flecha', d: 's', va: ALDEA }] }
    };
    const sumar = (s, lugares, grupo, vuelve) => {
      const zona = kindDe(s.id) + '.main', m = D.mapas[s.id];
      if (!MM.Z[zona]) MM.Z[zona] = { img: s.id, esc: 2, w: m.w, h: m.h, n: s.n, g: grupo };
      if (!MM.L[zona]) MM.L[zona] = lugares;
      (MM.L[vuelve] || []).forEach(l => { if (l.va === s.zonaVieja) l.va = zona; });
      [MM.META_PASO, MM.META_PARTE].forEach(tabla => tabla && Object.values(tabla).forEach(t => { if (t[0] === s.zonaVieja) t[0] = zona; }));
    };
    activas.forEach(k => sumar(CASAS[k], DATOS[k].lugares, 'Aldea del Roble', ALDEA));
    if (cocina) sumar(COCINA, [{ n: 'Fogón', x: 242, y: 100, ic: 'fuego' }, { n: 'Despensa', x: 370, y: 92, ic: 'olla' }, { n: 'Salida al patio', x: 240, y: 254, ic: 'flecha', d: 's', va: PATIO }], 'Castillo', PATIO);
    if (MM.dibujo) {
      const DIB = MINI;
      todas.forEach(s => { if (DIB[s.id]) MM.dibujo(s.id, DIB[s.id]); });
    }
  }

  window.CK_SALAS_ALDEA = { CASAS, COCINA, activas, cocina };
})();
