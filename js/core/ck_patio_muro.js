'use strict';
/* Patio del Castillo y Muralla nuevos desde Google Flow (03/11, pedido del dueño).
   - El dibujo, las piezas (se pasa por detrás) y los choques de pie vienen de los mapas del Taller patio_del_castillo y
     muralla, pero para el juego siguen siendo las zonas castle.courtyard y castle.walls: la historia, la luz, el clima, la
     fauna, las tiendas y las partidas no cambian. Acá se ponen la gente, las puertas y las salidas en su lugar nuevo.
   - Patio: puertas de la Cocina (izq.), del Gran Salón (escalinata del centro) y de la Herrería (der.); la torre de cada
     esquina sube a la muralla; el arco del oeste va al Patio de Armas, el del este al Jardín Real y el portón de abajo al
     camino. Los otros archivos que vuelven al patio con las coordenadas viejas (640x560) caen en su lugar nuevo (DESDE).
   - Muralla: la puerta de cada torre y la escalera de cada hueco bajan al patio. Arriba de las almenas se ve el paisaje
     (ck_patio_muro_arte.js) en 3 capas que se mueven a distinta velocidad (paralaje): las montañas casi quietas, el
     bosque un poco más y el valle con la aldea más rápido. Pasan nubes y pájaros y sale humo de la aldea. En la muralla
     la cámara mira un poco más arriba para que se vea el paisaje.
   Si un mapa no está en el Taller, ese lugar queda como antes. Borrar las 2 líneas de index.html lo apaga entero. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA,
    ARTE = window.CK_PATIO_MURO_ARTE || {};
  if (!D || !D.mapas) return;
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen && INTERIOR_LAYOUTS['ed_' + id]);
  const PATIO_ID = 'patio_del_castillo', MURO_ID = 'muralla';
  const patio = hay(PATIO_ID), muro = hay(MURO_ID);
  if (!patio && !muro) return;
  const FUEGO = 0xff8a3c;

  // el área de un mapa del Taller armada con el mismo kit (las piezas ya vienen partidas por ck_profundidad.js)
  const delTaller = (kit, id) => {
    const sub = Object.assign({}, kit, { areas: {} });
    INTERIOR_LAYOUTS['ed_' + id].call(null, sub);
    return sub.areas.main;
  };
  // el dibujo y los choques del Taller sobre el lugar viejo: queda su zona; la gente, las salidas y los efectos se ponen de nuevo
  const pasar = (a, n) => {
    ['items', 'colliders', 'lights'].forEach(k => (a[k] = (n[k] || []).slice()));
    a.w = n.w; a.h = n.h; a.groundKey = n.groundKey;
    a.rects = []; a.polys = []; a.doors = []; a.portals = []; a.exits = []; a.talkers = []; a.actors = []; a.fx = [];
  };
  // las piezas altas se ordenan enteras por su base (no en franjas): el árbol y el estandarte
  const PARTES = (window.CK_PARTES = window.CK_PARTES || {});
  ['ed_pc_arbol_del_jardin', 'ed_mu_estandarte', 'ed_pc_leon_izq', 'ed_pc_leon_der'].forEach(k => { PARTES[k] = null; PARTES[k + '_esp'] = null; });

  // ================================================================== PATIO DEL CASTILLO (castle.courtyard, 958x534)
  const PC = {
    spawn: { x: 480, y: 504 }, // al entrar por el portón de abajo
    cocina: { x: 232, y: 148 }, trono: { x: 480, y: 132 }, herreria: { x: 727, y: 148 }, // puertas de la fachada
    torreO: { x: 130, y: 186 }, torreE: { x: 826, y: 182 }, // puertas de las torres (suben a la muralla)
    salidaO: { x: 24, y: 196, w: 14, h: 54 }, // arco del oeste -> Patio de Armas
    salidaE: { x: 922, y: 198, w: 14, h: 60 }, // arco del este -> Jardín Real
    salidaS: { x: 455, y: 522, w: 50, h: 12 }, // portón -> camino
    puesto: { x: 262, y: 292 }, // el puesto del mercado (T para comprar)
    vendedor: { x: 332, y: 266 }
  };
  // dónde aparece el héroe al volver de cada lugar (el resto de los archivos usa las coordenadas del patio viejo)
  const DESDE = {
    kitchen: { x: 232, y: 162 }, armory: { x: 727, y: 162 }, throne: { x: 480, y: 196 }, training: { x: 52, y: 240 },
    garden: { x: 888, y: 236 }, torreO: { x: 130, y: 198 }, torreE: { x: 826, y: 196 }, road: { x: 480, y: 504 }
  };
  const VIEJO = [
    [130, 182, 'kitchen'], [510, 182, 'armory'], [320, 182, 'throne'], [320, 192, 'throne'], [606, 226, 'garden'],
    [30, 300, 'training'], [38, 188, 'torreO'], [602, 188, 'torreE'], [320, 520, 'road'], [320, 530, 'road']
  ];

  // ================================================================== MURALLA (castle.walls, 958x534)
  const MU = {
    spawn: { x: 92, y: 270 },
    torreO: { x: 92, y: 258 }, torreE: { x: 865, y: 258 }, // puertas de las torres (bajan al patio)
    escO: { x: 200, y: 356, w: 12, h: 52 }, escE: { x: 746, y: 356, w: 12, h: 52 }, // escaleras de los huecos
    llegaO: { x: 92, y: 272 }, llegaE: { x: 865, y: 272 }
  };
  const EXTRA = 140;
  const ESC_MURO = 1.75; // la gente de la muralla, del tamaño de adentro de las casas (afuera es 1,2)

  const L0 = INTERIOR_LAYOUTS.castle;
  INTERIOR_LAYOUTS.castle = function (kit) {
    const r = L0.apply(this, arguments);
    const A = kit.areas || {};
    if (patio && A.courtyard) {
      try {
        const y = A.courtyard;
        // de las salidas viejas se conserva adónde llevan (los otros archivos las redirigen por nombre)
        const llega = {};
        (y.exits || []).forEach(e => { llega[e.to] = e.arrive; });
        (y.portals || []).forEach(p => { if (!llega[p.to]) llega[p.to] = p.arrive; });
        pasar(y, delTaller(kit, PATIO_ID));
        LAY.courtyard = y;
        y.title = 'Patio del Castillo';
        y.spawn = { x: PC.spawn.x, y: PC.spawn.y };
        const habla = (x, yy, lines, rr) => y.talkers.push({ x, y: yy, lines, r: rr || 40 });
        // salidas a pie
        y.exits.push(Object.assign({}, PC.salidaO, { key: 'walk', to: 'training', arrive: llega.training || { x: 838, y: 264 }, hint: '◀ Patio de Armas' }));
        y.exits.push(Object.assign({}, PC.salidaE, { key: 'walk', to: 'garden', arrive: llega.garden || { x: 46, y: 342 }, hint: '▶ Jardín Real' }));
        y.exits.push(Object.assign({}, PC.salidaS, { key: 'down', to: 'road', arrive: llega.road, hint: '▼ Salir del castillo' }));
        // puertas pintadas en la fachada y en las torres (▲ para pasar)
        const puerta = (p, to, hint, arrive) => y.portals.push({ x: p.x, y: p.y, to, arrive, scale: 1.75, hint, sprite: false });
        puerta(PC.cocina, 'kitchen', '▲ Cocina Real', llega.kitchen);
        puerta(PC.trono, 'throne', '▲ Gran Salón', llega.throne);
        puerta(PC.herreria, 'armory', '▲ Herrería', llega.armory);
        puerta(PC.torreO, 'walls', '▲ Subir a la muralla', MU.llegaO);
        puerta(PC.torreE, 'walls', '▲ Subir a la muralla', MU.llegaE);
        // guardias en la escalinata del Gran Salón
        kit.person(y, 'g_knight_idle', 'g_knight_idle', 446, 202, { scale: 1.2 });
        kit.person(y, 'g_knight_idle', 'g_knight_idle', 514, 202, { scale: 1.2, flipX: true });
        habla(480, 198, ['El rey os espera en el Gran Salón 👑', '¡Alto! ...Ah, sois vos. Pasad.', 'Mantened la espada envainada aquí ⚔️'], 46);
        // un guardia hace la ronda alrededor de la fuente; un albañil va y viene junto a la fachada
        y.actors.push({ type: 'walker', key: 'g_lancer_idle', idle: 'g_lancer_idle', walk: 'g_lancer_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 24,
          pts: [[372, 238, 1400], [590, 238, 600], [590, 352, 1400], [372, 352, 600]],
          lines: ['Todo en orden en el patio.', 'Linda tarde para una guardia 🌤️', 'Desde la muralla se ve todo el valle'] });
        y.actors.push({ type: 'walker', key: 'npc10_villager', idle: 'npc10_idle', walk: 'npc10_walk', scale: 1.3, speed: 26,
          pts: [[606, 188, 2600], [756, 188, 2600]], lines: ['Esta muralla no se arregla sola 🧱', 'Piedra va, piedra viene…', 'Dicen que hay que reforzar la puerta norte'] });
        // el puesto del mercado
        y.items.push({ key: 'npc3_villager', anim: 'npc3_idle', x: PC.vendedor.x, baseY: PC.vendedor.y, scale: 1.3, flipX: true });
        y.colliders.push({ x: PC.vendedor.x - 7, y: PC.vendedor.y - 8, w: 14, h: 8 });
        habla(PC.vendedor.x - 20, PC.vendedor.y + 6, ['¡Pan recién horneado! 🍞', 'Fruta fresca de la aldea 🍎', 'El cocinero real compra aquí 😉']);
        // un recluta entre los muñecos del patio de entrenamiento
        y.actors.push({ type: 'walker', key: 'g_axeman_idle', idle: 'g_axeman_idle', walk: 'g_axeman_walk', scale: 1.2, ox: 0.5, oy: 0.61, speed: 30,
          pts: [[772, 468, 2600], [880, 480, 2200], [822, 500, 1200]], lines: ['¡Uno, dos... estocada!', 'Algún día seré caballero 🛡️'] });
        habla(52, 224, ['◀ Patio de Armas ⚔️'], 30);
        habla(900, 230, ['▶ Jardín Real 🌹'], 30);
        habla(155, 314, ['El agua del pozo está fresca 💧'], 28);
        habla(832, 308, ['Los caballos del rey descansan en el establo 🐴'], 34);
        habla(150, 392, ['El jardincito de la reina. No se pisa 🌷'], 30);
        habla(810, 392, ['Aquí entrenan los reclutas con los muñecos'], 34);
        // antorchas de la fachada, la fuente
        [277, 415, 541, 680].forEach(x => { kit.light(y, x, 100, 40, FUEGO, 0.2); kit.light(y, x, 78, 12, FUEGO, 0.34, { halo: true }); });
        y.fx.push({ type: 'fountain', x: 480, y: 252 }, { type: 'glints', x: 452, y: 272, w: 56, h: 24, n: 5 });
      } catch (e) { console.warn('[patio nuevo]', e); }
    }
    if (muro && A.walls) {
      try {
        const w = A.walls;
        pasar(w, delTaller(kit, MURO_ID));
        if (window._ckSueloMuro) w.groundKey = 'ck_suelo_muralla'; // el suelo con el cielo transparente (ver create)
        LAY.walls = w;
        w.title = 'Muralla';
        w.spawn = { x: MU.spawn.x, y: MU.spawn.y };
        const habla = (x, yy, lines, rr) => w.talkers.push({ x, y: yy, lines, r: rr || 40 });
        const destO = patio ? DESDE.torreO : { x: 38, y: 188 }, destE = patio ? DESDE.torreE : { x: 602, y: 188 };
        w.portals.push({ x: MU.torreO.x, y: MU.torreO.y, to: 'courtyard', arrive: destO, scale: 1.75, hint: '▲ Bajar por la torre', sprite: false });
        w.portals.push({ x: MU.torreE.x, y: MU.torreE.y, to: 'courtyard', arrive: destE, scale: 1.75, hint: '▲ Bajar por la torre', sprite: false });
        w.exits.push(Object.assign({}, MU.escO, { key: 'walk', to: 'courtyard', arrive: destO, hint: '▼ Bajar al patio' }));
        w.exits.push(Object.assign({}, MU.escE, { key: 'walk', to: 'courtyard', arrive: destE, hint: '▼ Bajar al patio' }));
        // vigías
        kit.person(w, 'g_archer_idle', 'g_archer_idle', 470, 258, { scale: ESC_MURO });
        habla(470, 262, ['Desde aquí se domina todo el valle 🏞️', 'El puente se baja cuando alguien se acerca', 'Nada se mueve en el camino… por ahora'], 44);
        w.actors.push({ type: 'walker', key: 'g_archer_idle', idle: 'g_archer_idle', walk: 'g_archer_walk', scale: ESC_MURO, ox: 0.5, oy: 0.61, speed: 22,
          pts: [[240, 300, 1600], [520, 300, 900], [520, 330, 400], [240, 330, 900]], lines: ['Sin novedad en el muro oeste.', 'El viento trae olor a lluvia 🌧️'] });
        w.actors.push({ type: 'walker', key: 'g_templar_idle', idle: 'g_templar_idle', walk: 'g_templar_walk', scale: ESC_MURO, ox: 0.5, oy: 0.61, speed: 22,
          pts: [[560, 300, 1200], [720, 300, 1800], [720, 470, 400], [560, 470, 900]], lines: ['Muro este, todo en calma.', 'Allá abajo, la aldea y el río…'] });
        habla(700, 234, ['🔭 Se ve la aldea entre los campos, y el río que baja de las montañas', '🔭 Del otro lado del bosque empiezan las montañas nevadas'], 36);
        habla(276, 284, ['Una balista apuntando al camino'], 30);
        // braseros encendidos
        [403, 601].forEach(x => { kit.light(w, x, 214, 56, FUEGO, 0.26); kit.light(w, x, 194, 14, FUEGO, 0.36, { halo: true }); });
      } catch (e) { console.warn('[muralla nueva]', e); }
    }
    // las vueltas al patio desde el Patio de Armas
    if (patio && A.training) (A.training.exits || []).forEach(e => { if (e.to === 'courtyard') e.arrive = { x: DESDE.training.x, y: DESDE.training.y }; });
    return r;
  };

  // ================================================================== llegar al patio: las coordenadas viejas caen en su lugar nuevo
  // (el área del juego es otro objeto que la del layout: se reconoce por el edificio y el nombre; los choques salen del layout)
  const LAY = {};
  const zonaDe = (s, area) => {
    const c = s.currentInterior;
    return c && c.area === area && c.building && c.building.kind === 'castle' ? c.areaName : null;
  };
  const libre = (cual, x, y) => {
    const a = LAY[cual];
    if (!a) return true;
    if (cual === 'courtyard') {
      const esc = x >= 437 && x <= 522 && y >= 132;
      if (x < 24 || x > 936 || y > 532 || (y < 148 && !esc)) return false;
    } else if (x < 10 || x > a.w - 10 || y < 198 || y > a.h - 16) return false;
    return !(a.colliders || []).some(c => x >= c.x && x <= c.x + c.w && y - 2 >= c.y && y - 2 <= c.y + c.h);
  };
  const mostrar0 = P.showInteriorArea;
  P.showInteriorArea = function (area, at) {
    let cual = null;
    try {
      cual = zonaDe(this, area);
      if (!((cual === 'courtyard' && patio) || (cual === 'walls' && muro))) cual = null;
      if (cual && at && at !== area.spawn) {
        const lx = at.x - area.x, ly = at.y - area.y;
        let n = null;
        if (cual === 'courtyard') {
          const v = VIEJO.find(q => Math.abs(q[0] - lx) <= 4 && Math.abs(q[1] - ly) <= 4);
          if (v) n = DESDE[v[2]];
        }
        if (n) at = { x: area.x + n.x, y: area.y + n.y };
        else if (!libre(cual, lx, ly)) at = area.spawn; // partida vieja o punto que quedó dentro de algo
      }
    } catch (e) {}
    const r = mostrar0.call(this, area, at);
    try {
      if (cual === 'walls') {
        this.cameras.main.setBounds(area.x, area.y - EXTRA, area.w, area.h + EXTRA);
        this.setPlayerIndoorScale(true); // el dibujo de la muralla es más grande: el héroe se ve como adentro de las casas
      }
    } catch (e) {}
    return r;
  };

  // ================================================================== el paisaje de la muralla (paralaje)
  const PA = ARTE.paisaje;
  // f: cuánto se mueve de costado respecto del mapa (0 = quieto, 1 = como el mapa); fy: lo mismo para arriba/abajo;
  // dy: dónde queda cada fila de la capa en el mapa cuando la cámara mira a la altura de referencia (REF)
  // (todo entre el fondo negro de alrededor del mapa, profundidad 6.5, y el suelo del mapa, 7)
  const REF = -75;
  const CAPAS = [
    { k: 'A', f: 0.06, fy: 0.1, dy: -135, prof: 6.6 },
    { k: 'B', f: 0.22, fy: 0.4, dy: -190, prof: 6.7 },
    { k: 'C', f: 0.42, fy: 0.62, dy: -255, prof: 6.76 }
  ];
  const HUMO = [[467, 352], [567, 386], [503, 404]]; // chimeneas de la aldea (en la capa C)
  const enMuro = s => {
    const c = s.currentInterior;
    return !!(muro && c && c.area && c.building && c.building.kind === 'castle' && c.areaName === 'walls');
  };
  const texturas = s => {
    // las capas se cargan en preload; acá van las chiquitas que se dibujan
    if (!s.textures.exists('ck_muro_humo')) {
      const t = s.textures.createCanvas('ck_muro_humo', 8, 8), g = t.getContext();
      const gr = g.createRadialGradient(4, 4, 0, 4, 4, 4); gr.addColorStop(0, 'rgba(226,222,214,0.9)'); gr.addColorStop(1, 'rgba(226,222,214,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 8, 8); t.refresh();
    }
  };
  const aves = s => {
    ['ck_muro_ave0', 'ck_muro_ave1'].forEach((k, i) => {
      if (s.textures.exists(k)) return;
      const t = s.textures.createCanvas(k, 7, 4), g = t.getContext(); g.fillStyle = '#3a3a44';
      if (i === 0) { g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 2, 1); g.fillRect(3, 2, 1, 1); g.fillRect(4, 1, 2, 1); g.fillRect(6, 0, 1, 1); }
      else { g.fillRect(0, 2, 1, 1); g.fillRect(1, 1, 2, 1); g.fillRect(3, 2, 1, 1); g.fillRect(4, 1, 2, 1); g.fillRect(6, 2, 1, 1); }
      t.refresh();
    });
  };
  const armar = s => {
    const M = s._ckMuro;
    if (M && M.ok) return M;
    if (!PA || !['A', 'B', 'C'].every(k => s.textures.exists('ck_muro_' + k))) return null;
    texturas(s); aves(s);
    const capas = CAPAS.map(c => Object.assign({}, c, { img: s.add.image(0, 0, 'ck_muro_' + c.k).setOrigin(0, 0).setDepth(c.prof).setVisible(false), y0: PA['y' + c.k] || 0 }));
    const nubes = (PA.nubes || []).map((n, i) => ({
      x: n.x, y: n.y, w: n.w, v: 2 + (i % 3) * 1.3,
      img: s.add.image(0, 0, 'ck_muro_nube' + i).setOrigin(0, 0).setDepth(6.65).setVisible(false).setAlpha(0.95)
    }));
    s._ckMuro = { ok: true, capas, nubes, humo: [], aves: [], proxAve: 4000, proxHumo: 0, off: 0 };
    s.events.once('shutdown', () => { s._ckMuro = null; });
    return s._ckMuro;
  };
  const mostrarPaisaje = (s, on) => {
    const M = s._ckMuro;
    if (!M) return;
    M.capas.forEach(c => c.img.setVisible(on));
    M.nubes.forEach(n => n.img.setVisible(on));
    M.humo.forEach(h => h.img.setVisible(on));
    M.aves.forEach(a => a.img.setVisible(on));
    M.on = on;
  };
  // capa (f, fy, dy) -> posición en el mundo de su píxel (0, 0) según la cámara
  const origen = (s, a, f, fy, dy) => {
    const cam = s.cameras.main, vw = cam.width / cam.zoom, X0 = -((a.w - vw) / 2) * (1 - f);
    return {
      x: a.x + X0 + (cam.scrollX + (cam.width - vw) / 2 - a.x) * (1 - f),
      y: a.y + dy + (cam.scrollY + (cam.height - cam.height / cam.zoom) / 2 - (a.y + REF)) * (1 - fy)
    };
  };
  const colocar = s => {
    const M = s._ckMuro;
    if (!M || !M.on) return;
    const a = s.currentInterior && s.currentInterior.area;
    if (!a) return;
    M.capas.forEach(c => { const o = origen(s, a, c.f, c.fy, c.dy); c.img.setPosition(Math.round(o.x), Math.round(o.y + c.y0)); });
    const oA = origen(s, a, 0.04, 0.09, -135);
    M.nubes.forEach(n => n.img.setPosition(Math.round(oA.x + n.x), Math.round(oA.y + n.y)));
    const oC = origen(s, a, CAPAS[2].f, CAPAS[2].fy, CAPAS[2].dy);
    M.humo.forEach(h => h.img.setPosition(oC.x + h.x, oC.y + h.y));
    const oB = origen(s, a, CAPAS[1].f, CAPAS[1].fy, CAPAS[1].dy);
    M.aves.forEach(v => v.img.setPosition(Math.round(oB.x + v.x), Math.round(oB.y + v.y)));
  };
  const vivir = (s, dt) => {
    const M = s._ckMuro, W = (PA && PA.w) || 958;
    if (!M || !M.on) return;
    const t = dt / 1000;
    // nubes: pasan despacio y vuelven a entrar por la izquierda
    M.nubes.forEach(n => { n.x += n.v * t; if (n.x > W + 40) n.x = -n.w - 40; });
    // humo de las chimeneas
    M.proxHumo -= dt;
    if (M.proxHumo <= 0) {
      M.proxHumo = 260;
      const [hx, hy] = HUMO[(Math.random() * HUMO.length) | 0];
      const img = s.add.image(0, 0, 'ck_muro_humo').setDepth(6.8).setScale(0.6).setAlpha(0.55);
      M.humo.push({ img, x: hx + Math.random() * 2 - 1, y: hy, vida: 0 });
    }
    M.humo = M.humo.filter(h => {
      h.vida += dt; h.y -= 4.5 * t; h.x += (1.5 + Math.sin(h.vida / 400) * 0.8) * t;
      const k = h.vida / 3200;
      if (k >= 1) { h.img.destroy(); return false; }
      h.img.setAlpha(0.55 * (1 - k)).setScale(0.6 + k * 1.1);
      return true;
    });
    // de vez en cuando cruza una bandada
    M.proxAve -= dt;
    if (M.proxAve <= 0 && !M.aves.length) {
      M.proxAve = 14000 + Math.random() * 16000;
      const izq = Math.random() < 0.5, y0 = 40 + Math.random() * 70, n = 3 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const img = s.add.image(0, 0, 'ck_muro_ave0').setDepth(6.72).setFlipX(!izq);
        M.aves.push({ img, x: izq ? -20 - i * 9 : W + 20 + i * 9, y: y0 + (i % 2) * 5 + i * 2, v: (izq ? 1 : -1) * (16 + Math.random() * 4), fase: Math.random() * 400 });
      }
    }
    M.aves = M.aves.filter(v => {
      v.x += v.v * t; v.fase += dt;
      v.img.setTexture((v.fase % 360) < 180 ? 'ck_muro_ave0' : 'ck_muro_ave1');
      if (v.x < -60 || v.x > W + 60) { v.img.destroy(); return false; }
      return true;
    });
  };

  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    if (!muro || !PA) return;
    ['A', 'B', 'C'].forEach(k => { if (!this.textures.exists('ck_muro_' + k)) this.load.image('ck_muro_' + k, PA[k]); });
    (PA.nubes || []).forEach((n, i) => { if (!this.textures.exists('ck_muro_nube' + i)) this.load.image('ck_muro_nube' + i, n.img); });
    if (ARTE.mascara_muro && !this.textures.exists('ck_muro_mascara')) this.load.image('ck_muro_mascara', ARTE.mascara_muro);
  };
  // el Taller exporta el suelo de la muralla con su color de fondo donde va el cielo: se vuelve a hacer transparente
  const sueloMuro = s => {
    const k = 'ck_suelo_muralla', src = D.mapas[MURO_ID] && D.mapas[MURO_ID].suelo;
    if (s.textures.exists(k) || !src || !s.textures.exists(src) || !s.textures.exists('ck_muro_mascara')) return;
    const im = s.textures.get(src).getSourceImage(), ma = s.textures.get('ck_muro_mascara').getSourceImage();
    const t = s.textures.createCanvas(k, im.width, im.height), g = t.getContext();
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(ma, 0, 0); g.globalCompositeOperation = 'source-over';
    t.refresh(); window._ckSueloMuro = true;
  };
  const create0 = P.create;
  P.create = function () {
    const r = create0.apply(this, arguments);
    if (muro) try { sueloMuro(this); this.cameras.main.on('followupdate', () => { if (enMuro(this)) colocar(this); }); } catch (e) { console.warn('[muralla]', e); }
    return r;
  };
  const update0 = P.update;
  P.update = function (time, delta) {
    const r = update0.apply(this, arguments);
    if (!muro) return r;
    try {
      const on = enMuro(this);
      if (on && !(this._ckMuro && this._ckMuro.on)) { armar(this); mostrarPaisaje(this, true); }
      else if (!on && this._ckMuro && this._ckMuro.on) { mostrarPaisaje(this, false); this._ckMuro.off = 0; this.cameras.main.setFollowOffset(0, 0); }
      if (on) {
        // la cámara mira más arriba cuando el héroe está cerca de las almenas (así se ve el paisaje) y baja de a poco
        const a = this.currentInterior.area, b = this.player && this.player.body;
        if (b) {
          const fy = b.bottom - a.y, quiero = Phaser.Math.Clamp(115 * (1 - (fy - 250) / 170), 0, 115);
          const M = this._ckMuro; M.off += (quiero - M.off) * Math.min(1, delta / 400);
          this.cameras.main.setFollowOffset(0, Math.round(M.off));
        }
        vivir(this, delta || 16);
        colocar(this);
      }
    } catch (e) { console.warn('[muralla, paisaje]', e); }
    return r;
  };

  // ================================================================== minimapa, tienda del puesto y pruebas
  const MM = window.CK_MINIMAPA, PATIO = 'castle.courtyard', MURO = 'castle.walls';
  if (MM && MM.Z && MM.L) {
    if (patio && MM.Z[PATIO]) {
      Object.assign(MM.Z[PATIO], { w: D.mapas[PATIO_ID].w, h: D.mapas[PATIO_ID].h });
      const donde = [[/sal[oó]n|trono/i, 480, 132], [/cocina/i, 232, 148], [/armer|herr/i, 727, 148], [/torre oeste/i, 130, 180], [/torre este/i, 826, 176],
        [/fuente/i, 480, 285], [/patio de armas/i, 26, 222], [/jard/i, 930, 228], [/salida/i, 480, 530]];
      (MM.L[PATIO] || []).forEach(l => {
        const d = donde.find(q => q[0].test(l.n || ''));
        if (d) { l.x = d[1]; l.y = d[2]; } else { l.x = Math.round(l.x * 958 / 640); l.y = Math.round(l.y * 534 / 560); }
      });
      if (!(MM.L[PATIO] || []).some(l => /puesto/i.test(l.n || ''))) (MM.L[PATIO] = MM.L[PATIO] || []).push({ n: 'Puesto del mercado', x: 262, y: 232, ic: 'estrella' });
      if (MM.dibujo && ARTE.mini && ARTE.mini.courtyard) MM.dibujo('courtyard', ARTE.mini.courtyard);
    }
    if (muro && MM.Z[MURO]) {
      Object.assign(MM.Z[MURO], { w: D.mapas[MURO_ID].w, h: D.mapas[MURO_ID].h, n: 'Muralla' });
      MM.L[MURO] = [
        { n: 'Torre oeste', x: MU.torreO.x, y: 250, ic: 'torre', va: PATIO },
        { n: 'Torre este', x: MU.torreE.x, y: 250, ic: 'torre', va: PATIO },
        { n: 'Escalera oeste', x: 206, y: 382, ic: 'flecha', d: 's', va: PATIO },
        { n: 'Escalera este', x: 752, y: 382, ic: 'flecha', d: 's', va: PATIO },
        { n: 'Balista', x: 276, y: 250, ic: 'estrella' }
      ];
      if (MM.dibujo && ARTE.mini && ARTE.mini.walls) MM.dibujo('walls', ARTE.mini.walls);
    }
  }
  const TI = window.CK_TIENDAS;
  if (patio && TI && TI.TIENDAS) TI.TIENDAS.forEach(t => { if (String(t.zona) === String(/^castle\.courtyard$/)) Object.assign(t, { x: PC.puesto.x, y: PC.puesto.y, r: 46 }); });
  if (window.CK_PARTIDAS && window.CK_PARTIDAS.NOMBRES) window.CK_PARTIDAS.NOMBRES[MURO] = 'Muralla';

  // ck_pruebas.js: adónde lleva cada salida con el patio y la muralla nuevos
  const conexiones = lista => {
    const out = lista.map(c => c.slice());
    out.forEach(c => {
      if (c[3] !== PATIO || !patio) return;
      const de = c[0] === 'ed_camino_al_castillo.main' ? 'road' : c[0] === 'castle.training' ? 'training' : /jardin/.test(c[0]) ? 'garden'
        : /cocina/.test(c[0]) ? 'kitchen' : /herreria/.test(c[0]) ? 'armory' : /salon_del_trono/.test(c[0]) ? 'throne' : null;
      if (de && DESDE[de]) { c[4] = DESDE[de].x; c[5] = DESDE[de].y; }
    });
    if (patio && muro)
      out.push([PATIO, 'puerta', 'walls', MURO, MU.llegaO.x, MU.llegaO.y], [MURO, 'puerta', 'courtyard', PATIO, DESDE.torreO.x, DESDE.torreO.y],
        [MURO, 'salida', 'courtyard', PATIO, DESDE.torreO.x, DESDE.torreO.y]);
    return out;
  };
  window.CK_PATIO_MURO = { PC, MU, DESDE, patio, muro, EXTRA, conexiones };
})();
