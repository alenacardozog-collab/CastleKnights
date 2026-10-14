'use strict';
/* Aposentos del Rey y Biblioteca nuevos (mapas del Taller hechos desde imágenes de Google Flow):
   - los arcos del Gran Salón (Salón del Trono 3) llevan a estos mapas en vez de a las salas viejas del castillo;
   - su salida de abajo vuelve al Gran Salón, frente al arco por el que se entró;
   - el Maestre Eloy pasa a la biblioteca nueva, al lado de su escritorio;
   - luz de sala, eco de madera y sonido de ambiente como las salas viejas.
   Va fuera del bloque del Taller en index.html. Si un mapa no está, todo queda como antes. Borrar su línea en index.html lo apaga. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen);
  const TRONO = 'salon_del_trono_3';
  // sala vieja -> mapa nuevo, y dónde aparece uno en el Gran Salón al volver (frente a su arco)
  const SALAS = {
    kingroom: { id: 'aposentos_del_rey', vuelta: { x: 64, y: 86 }, sala: [196, 184, 170], sonido: [['amb_fire', 0.5]] },
    library: { id: 'biblioteca', vuelta: { x: 416, y: 86 }, sala: [192, 182, 170], sonido: [['amb_hall', 0.35]] }
  };
  const activas = Object.keys(SALAS).filter(k => hay(SALAS[k].id));
  if (!activas.length || !hay(TRONO)) return;
  const kind = k => 'ed_' + SALAS[k].id;
  const deKind = kd => activas.find(k => kind(k) === kd);
  window.CK_SALAS_CASTILLO = { SALAS, activas };

  // sonido de ambiente, eco y luz de sala (los mapas del Taller vienen todos marcados "afuera")
  activas.forEach(k => {
    const s = SALAS[k], m = D.mapas[s.id], zona = kind(k) + '.main';
    if (!(m.sonido && m.sonido.length)) m.sonido = s.sonido;
    window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { [kind(k)]: 'madera' });
    const L = window.CK_LUZ;
    if (L && L.INTERIORES) L.INTERIORES.add(zona);
    if (L && L.AMB_SALA) L.AMB_SALA[zona] = s.sala;
  });

  // minimapa: las dos zonas nuevas (sin dibujo propio: se ve el retrato del mapa o el fondo) y los arcos del salón hacia ellas
  const MM = window.CK_MINIMAPA;
  if (MM && MM.Z && MM.L) {
    const SALON = 'ed_' + TRONO + '.main';
    const DATOS = {
      kingroom: { n: 'Aposentos del Rey', lugares: [{ n: 'Hogar', x: 352, y: 250, ic: 'fuego' }, { n: 'Volver al salón', x: 201, y: 368, ic: 'flecha', d: 's', va: SALON }] },
      library: { n: 'Biblioteca', lugares: [{ n: 'Maestre Eloy', x: 262, y: 150, ic: 'libro' }, { n: 'Volver al salón', x: 200, y: 396, ic: 'flecha', d: 's', va: SALON }] }
    };
    activas.forEach(k => {
      const zona = kind(k) + '.main', m = D.mapas[SALAS[k].id];
      if (!MM.Z[zona]) MM.Z[zona] = { img: SALAS[k].id, esc: 2, w: m.w, h: m.h, n: DATOS[k].n, g: 'Castillo' };
      if (!MM.L[zona]) MM.L[zona] = DATOS[k].lugares;
      (MM.L[SALON] || []).forEach(l => {
        if (l.va === 'castle.' + k) l.va = zona;
      });
    });
  }

  // del Gran Salón a la sala nueva
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    const c = this.currentInterior;
    if (c && !this._doorTransition && this._gameMode === 'campaign' && c.building.kind === 'ed_' + TRONO && activas.includes(nombre))
      if (this.ckEntrar(SALAS[nombre].id, 'Entrada')) return;
    return cambiar0.apply(this, arguments);
  };
  // de la sala nueva al Gran Salón (la puerta de abajo)
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior, k = c && deKind(c.building.kind);
    if (k && !this._doorTransition && this.ckEntrar(TRONO, SALAS[k].vuelta)) return;
    return salir0.apply(this, arguments);
  };

  // los objetos de pie finos (candelabros, atril, globo) solo tenían colisión en la base: el héroe podía pararse
  // "adentro" del poste. Una colisión un poco más honda lo deja siempre delante o detrás, nunca encima.
  const MAS_COLISION = {
    kingroom: [[143, 338, 16, 15], [241, 338, 17, 15], [149, 150, 18, 13], [257, 150, 18, 13]],
    library: [[121, 197, 22, 18], [256, 199, 22, 17]]
  };
  const envolver = (k, extra) => {
    const L = typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS[kind(k)];
    if (!L) return;
    INTERIOR_LAYOUTS[kind(k)] = function (kit) {
      const r = L.apply(this, arguments),
        a = kit.areas && kit.areas.main;
      if (a) {
        (MAS_COLISION[k] || []).forEach(([x, y, w, h]) => a.colliders.push({ x, y, w, h }));
        if (extra) extra(a);
      }
      return r;
    };
  };

  // el Maestre Eloy, en la biblioteca nueva (a la derecha del escritorio, sobre la tarima). Se habla con él desde lo
  // alto de la escalera, frente al escritorio. A la altura del héroe: con 1.3 se veía como un niño.
  if (activas.includes('library') && typeof STORY_NPCS !== 'undefined') {
    const eloy = STORY_NPCS.find(n => n.id === 'eloy');
    if (eloy) Object.assign(eloy, { zone: kind('library') + '.main', x: 262, y: 150, r: 58, marca: 34 });
  }
  activas.forEach(k =>
    envolver(k, k === 'library' && typeof STORY_NPCS !== 'undefined' ? a => {
      // mirando hacia el escritorio
      a.items.push({ key: 'npc6_villager', anim: 'npc6_idle', x: 262, baseY: 150, scale: 1.85, oy: 1, ox: 0.5, flipX: true });
      a.colliders.push({ x: 253, y: 142, w: 18, h: 9 });
    } : null)
  );

  // ------------------------------------------------------------------ objetos con los que se interactúa (T)
  // x, y = dónde se para el héroe para usarlo (pie), r = cuán cerca. accion: 'texto' (lineas), 'cofre', 'descansar',
  // 'calentarse', 'mapa', 'pista'. Los cofres se abren una sola vez por partida (story.flags).
  const OBJETOS = {
    kingroom: [
      { id: 'baules', verbo: 'Abrir', n: 'los baúles del Rey', x: 201, y: 219, r: 16, accion: 'cofre',
        premio: { monedas: 30, elixir: 1 }, lineas: ['Ropa de gala, un cetro de repuesto… y una bolsa olvidada al fondo.'] },
      { id: 'cama', verbo: 'Descansar en', n: 'la cama del Rey', x: 201, y: 219, r: 30, accion: 'descansar' },
      { id: 'cama_der', verbo: 'Descansar en', n: 'la cama del Rey', x: 244, y: 196, r: 18, accion: 'descansar' },
      { id: 'hogar', verbo: 'Calentarse en', n: 'el hogar', x: 326, y: 240, r: 28, accion: 'calentarse' },
      { id: 'ventana', verbo: 'Mirar por', n: 'la ventana', x: 332, y: 192, r: 22, accion: 'ventana' },
      { id: 'ropero', verbo: 'Revisar', n: 'el ropero', x: 122, y: 260, r: 20, accion: 'texto',
        lineas: ['Capas de armiño, botas de montar y una nota doblada:', '«Para el cumpleaños de Lía: una espada de madera. NO le digas a la Reina.»'] },
      { id: 'armadura', verbo: 'Mirar', n: 'la armadura', x: 82, y: 258, r: 20, accion: 'texto',
        lineas: ['La armadura de la coronación del Rey Aldric.', 'Tiene una abolladura en el yelmo. Dicen que fue un dragón; el Rey dice que fue una puerta.'] },
      { id: 'tocador', verbo: 'Mirar', n: 'el espejo', x: 117, y: 323, r: 20, accion: 'texto',
        lineas: ['Tu reflejo te devuelve una mirada cansada.', 'Un poco de barro en la cara, sí. Pero el porte es de héroe.'] },
      { id: 'mesa', verbo: 'Leer', n: 'la carta de la mesa', x: 310, y: 326, r: 24, accion: 'pista' }
    ],
    library: [
      { id: 'atril', verbo: 'Leer', n: 'el libro del atril', x: 133, y: 228, r: 20, accion: 'libro' },
      { id: 'globo', verbo: 'Mirar', n: 'el globo del reino', x: 267, y: 228, r: 20, accion: 'mapa' },
      { id: 'pergaminos', verbo: 'Leer', n: 'los pergaminos', x: 250, y: 318, r: 26, accion: 'pista' },
      { id: 'estante', verbo: 'Hojear', n: 'los libros', x: 110, y: 318, r: 20, accion: 'relato' },
      { id: 'banco', verbo: 'Hojear', n: 'los libros apilados', x: 134, y: 340, r: 22, accion: 'relato' },
      { id: 'cofre_bi', verbo: 'Abrir', n: 'el cofre', x: 69, y: 340, r: 20, accion: 'cofre',
        premio: { monedas: 15, potion: 1 }, lineas: ['Entre mapas viejos hay una poción que alguien guardó para emergencias.'] },
      { id: 'baul_sello', verbo: 'Abrir', n: 'el baúl', x: 340, y: 300, r: 20, accion: 'texto',
        lineas: ['Cerrado con el sello del Maestre. Mejor no tocar lo que Eloy guarda bajo llave.'] },
      { id: 'escalera', verbo: 'Subir', n: 'a la torre', x: 297, y: 276, r: 24, accion: 'texto',
        lineas: ['La escalera sube a la torre del Maestre.', 'Una reja la cierra con candado. Eloy debe tener la llave.'] }
    ]
  };
  const RELATOS = [
    ['«Crónica del Roble»', 'La aldea nació alrededor de un roble que ningún hacha pudo talar. Todavía está ahí, cerca del pozo.'],
    ['«Bestiario del Norte»', 'El hombre lobo teme al fuego y a la plata. El hombre oso no teme a nada, pero se cansa rápido.'],
    ['«Tratado de esgrima»', 'Quien bloquea en el momento justo convierte el golpe del enemigo en su oportunidad.'],
    ['«Las Torres de Escarcha»', 'Más allá del paso del norte hay torres de hielo que nadie construyó. Los viejos dicen que respiran.'],
    ['«Recetario de la cocina real»', 'Guiso del Rey: dos zanahorias, una cebolla, y que nadie le cuente al cocinero que el Rey odia el apio.']
  ];
  const libroDelAtril = s => {
    const p = window.CK_HISTORIA && window.CK_HISTORIA.parte(s);
    if (p === 'codice' || (s.step >= 7 && !(s.flags || {}).epilogo))
      return ['El libro está abierto en una página sobre los Códices perdidos:', '«Un Códice nunca se destruye: se guarda, se vigila y se teme.»'];
    if (s.step >= 8) return ['Alguien marcó una página con una pluma de cuervo:', '«…y la niebla bajó de las Torres de Escarcha, como el aliento de algo que despierta.»'];
    if (p === 'eloy' || p === 'taberna' || p === 'ruy' || s.step === 3)
      return ['«Sobre la nigromancia»:', '«Requiere velas negras, sal gruesa y huesos. Quien la practica deja olor a cera y tierra removida.»'];
    return ['«Historia del reino»:', '«El Rey Aldric subió al trono el año de la gran helada, y desde entonces la niebla nunca pasó del monte.»'];
  };
  const objetivoActual = s => {
    const p = window.CK_HISTORIA && window.CK_HISTORIA.parte(s);
    if (p) return window.CK_HISTORIA.OBJ[p];
    const q = typeof QUESTS !== 'undefined' && QUESTS[Math.min(s.step || 0, QUESTS.length - 1)];
    return q ? q.goal : '';
  };
  const salaDe = S => {
    const c = S.currentInterior;
    return c && deKind(c.building.kind);
  };
  /** El objeto que el héroe tiene al alcance (o null); los cofres ya abiertos dejan lugar a lo que haya debajo. */
  const objetoCerca = S => {
    const k = salaDe(S);
    if (!k || !S.player || !S.player.body || !S.story) return null;
    const a = S.currentInterior.area, b = S.player.body, fl = S.story.flags || {};
    let mejor = null, md = 1e9;
    (OBJETOS[k] || []).forEach(o => {
      if (o.accion === 'cofre' && fl['cofre_' + o.id]) return;
      const d = Math.hypot(b.center.x - (a.x + o.x), b.bottom - (a.y + o.y));
      if (d <= o.r && d < md) { md = d; mejor = o; }
    });
    return mejor;
  };
  const usar = (S, o) => {
    const s = S.story, fl = (s.flags = s.flags || {});
    const nombre = o.n.charAt(0).toUpperCase() + o.n.slice(1);
    if (o.accion === 'texto') return S.openDialog(nombre, o.lineas, null, null);
    if (o.accion === 'relato') { const r = RELATOS[(fl.relato = ((fl.relato || 0) + 1) % RELATOS.length)]; return S.openDialog(r[0], [r[1]], null, null); }
    if (o.accion === 'libro') return S.openDialog('Libro del atril', libroDelAtril(s), null, null);
    if (o.accion === 'pista') {
      const obj = objetivoActual(s);
      return S.openDialog(nombre, o.id === 'mesa'
        ? ['Una carta con el sello real, a medio escribir:', '«…y que el próximo valiente que llegue al castillo sepa esto: ' + obj.charAt(0).toLowerCase() + obj.slice(1) + '»']
        : ['Notas del Maestre, con letra apurada:', '«Pendiente: ' + obj + '.»'], null, null);
    }
    if (o.accion === 'mapa') {
      S.openDialog('Globo del reino', ['Girás el globo: el Roble, el castillo, Brumavieja… y al norte, nada más que blanco.'], () => {
        if (window.CK_MINIMAPA && window.CK_MINIMAPA.abrir) S.time.delayedCall(250, () => window.CK_MINIMAPA.abrir());
      }, null);
      return;
    }
    if (o.accion === 'ventana') {
      const clima = window.CK_CLIMA ? window.CK_CLIMA.actual() : 'despejado', noche = S.isNight && S.isNight();
      const vista = noche ? 'Las luces de la aldea titilan a lo lejos, y más allá, el monte oscuro.' :
        clima === 'tormenta' ? 'Los relámpagos iluminan el foso. Hoy nadie sale de patrulla.' :
        clima === 'lluvia' ? 'La lluvia corre por los vidrios. Abajo, los guardias se cubren bajo los aleros.' :
        clima === 'nieve' ? 'Todo el patio está blanco. Un paje intenta hacer un muñeco de nieve.' :
        clima === 'niebla' ? 'La niebla tapa el camino. Desde acá no se ve ni el puente.' :
        'Se ve todo el camino del castillo, el río y, a lo lejos, el humo de la aldea.';
      return S.openDialog('La ventana', [vista], null, null);
    }
    if (o.accion === 'cofre') {
      fl['cofre_' + o.id] = true;
      const p = o.premio || {}, partes = [];
      if (p.monedas) { s.coins = (s.coins || 0) + p.monedas; partes.push('+' + p.monedas + ' monedas'); }
      s.inv = s.inv || { potion: 0, elixir: 0 };
      if (p.potion) { s.inv.potion = (s.inv.potion || 0) + p.potion; partes.push('+' + p.potion + ' poción'); }
      if (p.elixir) { s.inv.elixir = (s.inv.elixir || 0) + p.elixir; partes.push('+' + p.elixir + ' elixir'); }
      if (typeof sfx !== 'undefined') sfx.fx('chest_open', 0.6) || sfx.fx('coin', 0.6) || sfx.fx('book_clasp', 0.6);
      S.createFloatingText(S.player.x, S.player.y - 46, partes.join(' · '), 0xfde68a);
      if (S.updateQuickBar) S.updateQuickBar();
      S.updateHUD(); S.updateObjective(); S.saveStory();
      return S.openDialog(nombre, o.lineas, null, null);
    }
    if (o.accion === 'calentarse') {
      const ahora = S.time.now;
      if (S.health < S.maxHealth && ahora > (S._ckHogarEn || 0)) {
        S._ckHogarEn = ahora + 60000;
        S.health = Math.min(S.maxHealth, S.health + 1);
        S.updateHUD();
        S.createFloatingText(S.player.x, S.player.y - 40, '+1 VIDA', 0x22c55e);
        return S.openDialog('El hogar', ['El calor del fuego te afloja los hombros. Te sentís un poco mejor.'], null, null);
      }
      return S.openDialog('El hogar', ['Las brasas crujen. Es el lugar más cálido del castillo.'], null, null);
    }
    if (o.accion === 'descansar') {
      const noche = S.isNight && S.isNight();
      S.openDialog('La cama del Rey', ['Te tirás un rato sobre la cama del Rey… solo un ratito.', 'Si alguien pregunta, estabas revisando que no hubiera arañas.'], () => {
        const cam = S.cameras.main;
        S.dialogOpen = true;
        cam.fadeOut(600, 0, 0, 0);
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          S.health = S.maxHealth;
          if (noche) S.dayClock = Math.floor((S.dayClock || 0) / 300000 + 1) * 300000 + 0.03 * 300000;   // al amanecer
          S.updateHUD(); S.updateObjective(); S.saveStory();
          cam.fadeIn(700, 0, 0, 0);
          S.dialogOpen = false;
          S.showZoneTitle(noche ? 'Amanece' : 'Descansaste', 'Vida completa · partida guardada');
        });
      }, null);
    }
  };

  // T: primero la gente de la historia (Eloy), después los objetos de la sala
  const interact0 = P.interact;
  P.interact = function () {
    if (!this._overlay && !this.dialogOpen && this._gameMode === 'campaign' && !this.isDead && !this._doorTransition && !this.nearbyStoryNPC()) {
      const o = objetoCerca(this);
      if (o) { usar(this, o); return; }
    }
    return interact0.apply(this, arguments);
  };
  // cartel "T · …" cuando hay un objeto al alcance
  const historia0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = historia0.apply(this, arguments);
    const pr = document.getElementById('ck-prompt');
    if (pr && salaDe(this) && !this.dialogOpen && !this._overlay && !this.nearbyStoryNPC()) {
      const o = objetoCerca(this);
      if (o) { const t = 'T · ' + o.verbo + ' ' + o.n; if (pr.textContent !== t) pr.textContent = t; pr.classList.add('on'); }
      else if (/^T · (Abrir|Descansar|Calentarse|Mirar|Revisar|Leer|Hojear|Subir) /.test(pr.textContent)) pr.classList.remove('on');
    }
    return r;
  };
  window.CK_SALAS_CASTILLO.OBJETOS = OBJETOS;
  window.CK_SALAS_CASTILLO.cerca = () => { const S = window.activeGameScene; const o = S && objetoCerca(S); return o && o.id; };
})();
