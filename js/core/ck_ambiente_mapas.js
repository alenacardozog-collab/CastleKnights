'use strict';
/* Vida, luces y sonido de cada lugar (13/11, pedido del dueño: "animaciones a todo el mapa de lo que falte, fuego, viento,
   hierba, agua, acorde a lo que represente el mapa"; "agrega sonidos a interiores y esas cosas, sonidos específicos a las
   zonas explorables"; "recuerda poner luces donde deben ir, si es de noche también en los interiores afecta";
   "chequea todo el juego a ver dónde se necesita, las fogatas anímalas, pero no dejes un png por debajo").
   Se revisaron todos los mapas que se recorren (afuera y adentro, de día y de noche). Lo que faltaba:
   - FUEGOS PINTADOS DE ADENTRO: la fragua de las dos herrerías, el hogar de la cocina del castillo, el fogón de la choza
     orca, la chimenea de la posada y la de los granjeros, el fuego del caldero del chamán, el fogón del jefe orco y las
     antorchas de la tienda ahora son llamas que se mueven, y lo pintado de abajo queda en brasas (ck_fuegos_vivos.js v2,
     con las cajas de CK_FUEGOS_SALAS: adentro sólo se busca fuego donde se dijo). Los fogones de los orcos del Sendero y
     de las Afueras el brasero de la derecha de la muralla y uno de la puerta del Patio de la Fortaleza (de un naranja más apagado)
     también.
   - LUZ DE LAS LLAMAS: las llamas animadas de los mapas del Taller (antorchas del patio, braseros de la muralla y del
     coliseo, fogones…) no alumbraban: ahora tiran luz de fuego y titilan.
   - VENTANAS que se prenden al anochecer (San Roque, los Campos, el Norte del Roble, el patio del castillo) y luces que
     faltaban: la fragua por la puerta de la herrería de San Roque, el altar del camino y el farol del Norte, el anillo de
     hongos del Bosque Embrujado, los faroles verdes del árbol y el círculo de runas del Cementerio, los hornos de la
     cocina y el caldero verde del chamán.
   - HUMO de las chimeneas de San Roque (y de la herrería) y de los fogones de los orcos; se lo lleva el viento del clima.
   - AGUA: el río de San Roque corre (ck_rio_vivo.js) y la rueda del molino gira y salpica; el agua quieta (el estanque y
     la fuente del Jardín Real, la fuente del patio, el pozo de San Roque) tiene destellos que van y vienen, y las fuentes,
     chorritos.
   - NIEBLA que se arrastra en el pantano del Norte del Roble, el Bosque Embrujado y el Cementerio; burbujas en el
     caldero del chamán.
   - BICHOS (ck_fauna.js) donde no había: cuervos, murciélagos, luciérnagas y ranas en el Norte del Roble, el Bosque
     Embrujado y el Cementerio; pájaros, mariposas, peces, ranas y luciérnagas en San Roque.
   - SONIDO por lugar (assets/audio/sfx, ElevenLabs): río, pantano, campo, viento de la muralla, gentío del coliseo,
     capilla, casa embrujada, molino, fragua, caldero; cerca del río, la fuente o el fuego se oyen más fuerte. De noche,
     afuera, se callan los pájaros y salen los grillos (también se oyen, bajito, desde adentro de las casas). Sonidos
     sueltos: la campana de la capilla de San Roque, el yunque, las páginas de la biblioteca, la vaca del granero, risas
     en la posada, cuervos, búhos y susurros en el Bosque Embrujado de noche.
   (13/11, v2) `window.CK_AMB_EXTRA(escena, zona)` deja que otro archivo sume capas de ambiente (el reino en llamas).
   Va después de ck_fuegos_vivos.js, ck_rio_vivo.js, ck_fauna.js y ck_luz.js. Borrar su línea de index.html lo saca
   (ck_fuegos_vivos.js sin la tabla vuelve a ser como antes). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const zonaDe = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const noche = S => { try { return !!(S.isNight && S.isNight()); } catch (e) { return false; } };
  // cuánto se encienden las luces (0 de día, 1 de noche, con el atardecer y el amanecer de por medio): como ck_luz.js
  const encendido = S => { const p = S.dayPhase ? S.dayPhase() : 0; return Math.max(0, Math.min(1, p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.1 : p < 0.92 ? 1 : (1 - p) / 0.08)); };
  const pies = S => { const b = S.player && S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y }; };

  // ================================================================== 1. FUEGOS PINTADOS DE ADENTRO (ck_fuegos_vivos.js v2)
  // id del mapa → cajas (coordenadas del mapa) donde está el fuego pintado; suave = llama de naranja apagado
  window.CK_FUEGOS_SALAS = Object.assign(window.CK_FUEGOS_SALAS || {}, {
    herreria: { cajas: [[70, 118, 42, 32]], suave: true },
    muralla: { cajas: [[580, 180, 50, 40]], suave: true },          // el brasero de la derecha (el de la izquierda ya lo encuentra solo)
    patio_fortaleza_orca: { cajas: [[262, 56, 34, 32]], suave: true },  // el brasero de la puerta que quedaba quieto
    tienda_de_viveres: { cajas: [[338, 178, 42, 32]] },
    cocina_real: { cajas: [[212, 72, 56, 30]] },
    choza_orca: { cajas: [[218, 118, 44, 36]] },
    posada_san_roque: { cajas: [[410, 168, 26, 26]] },
    herreria_san_roque: { cajas: [[204, 74, 70, 34]] },
    casa_granjeros_san_roque: { cajas: [[86, 110, 38, 28]] },
    choza_chaman: { cajas: [[204, 138, 64, 30]] },
    casa_jefe_orco: { cajas: [[224, 124, 88, 46]] },
    sendero_orco: { cajas: [[764, 384, 42, 34]], suave: true },
    afueras_orcas: { cajas: [[144, 368, 40, 34]], suave: true }
  });
  // fuegos anchos: una sola llama animada no los cubre; se suman llamitas a los costados [dx, escala relativa]
  const ANCHOS = {
    'ed_casa_jefe_orco.main': [[-17, 0.8], [17, 0.85], [-8, 0.6], [9, 0.65]],
    'ed_herreria_san_roque.main': [[-10, 0.75], [10, 0.7]],
    'ed_cocina_real.main': [[-8, 0.7], [8, 0.75]]
  };
  const LLAMA = 'ckfv_llama_fuego';
  const ensanchar = S => {
    const z = zonaDe(S), extra = ANCHOS[z], L = S._ckfv;
    if (!extra || !L || S._ckamAncho === L) return;
    const llamas = L.filter(o => o && o.active && o.type === 'Sprite' && !o._ckamExtra);
    if (!llamas.length) return;
    S._ckamAncho = L;
    llamas.forEach(ll => extra.forEach(([dx, k], i) => {
      try {
        const s = S.add.sprite(ll.x + dx * ll.scaleX, ll.y + (i % 2), LLAMA).setOrigin(0.5, 1).setScale(ll.scaleX * k).setDepth(ll.depth - 0.001 * (i + 1));
        s._ckfv = true; s._ckamExtra = true;
        s.play({ key: LLAMA, startFrame: (i * 3 + 2) % 8 }); s.anims.timeScale = 0.8 + i * 0.07;
        L.push(s);
      } catch (e) {}
    }));
  };

  // ================================================================== 2. AGUA (ck_rio_vivo.js) y BICHOS (ck_fauna.js)
  const RIO = window.CK_RIO_VIVO && window.CK_RIO_VIVO.RIOS;
  if (RIO) {
    // (el agua quieta —estanques, fuentes, pozos— no va acá: con corriente parecía lluvia; tiene sus destellos, más abajo)
    RIO['ed_san_roque.main'] = RIO['ed_san_roque.main'] || { cajas: [[1050, 0, 210, 802]], corriente: [0.12, 1] };
  }
  const FA = window.CK_FAUNA && window.CK_FAUNA.FAUNA;
  if (FA) {
    const poner = (z, c) => { if (!FA[z]) FA[z] = c; };
    // (ck_fauna.js ubica a los bichos con el dibujo del minimapa: sólo en las zonas que lo tienen)
    poner('ed_san_roque.main', { aves: 2, mariposas: 6, luciernagas: 14, peces: 5, ranas: 3 });
    poner('ed_norte_del_roble.main', { cuervos: 2, murcielagos: 4, luciernagas: 10, ranas: 4 });
    poner('ed_bosque_embrujado.main', { cuervos: 3, murcielagos: 6, luciernagas: 12, ranas: 3 });
    poner('ed_cementerio_real.main', { cuervos: 4, murcielagos: 6 });
  }

  // ================================================================== 3. SONIDO
  // [archivo, volumen, cerca, cuándo]. cerca = {p: [[x, y]…], r, min}: se oye más fuerte cerca de esos puntos del mapa
  // (y = null: sólo cuenta la distancia de lado, para un río que cruza el mapa); cuándo = 'dia' | 'noche'.
  // Volúmenes medidos para que los archivos nuevos (más fuertes o más bajos de origen) queden parejos con los de siempre.
  const SON = {
    // ---- afuera
    'ed_san_roque.main': { l: [['amb_aldea_dia', 0.45], ['amb_rio', 0.2, { p: [[1150, null]], r: 420, min: 0.06 }], ['amb_fire', 0.25, { p: [[825, 330]], r: 120 }]],
      ev: [['ck_campana_lejos', 80, 170, 0.32, 'dia'], ['ev_pajaro', 7, 15, 0.26, 'dia'], ['ev_buho', 16, 32, 0.26, 'noche'], ['anvil_hit', 5, 11, 0.12, 'dia', { p: [825, 330], r: 220 }]] },
    'ed_campos_del_roble.main': { l: [['amb_campo', 0.08], ['amb_rio', 0.15, { p: [[380, 300]], r: 230 }], ['amb_pantano', 0.22, { p: [[330, 80]], r: 220 }, 'noche']],
      ev: [['ev_pajaro', 8, 16, 0.26, 'dia'], ['ev_buho', 18, 34, 0.24, 'noche']] },
    'ed_camino_al_castillo.main': { l: [['amb_forest', 0.55], ['amb_rio', 0.17, { p: [[480, null]], r: 300, min: 0.03 }]] },
    'ed_patio_del_castillo.main': { l: [['amb_courtyard', 0.5], ['amb_rio', 0.11, { p: [[483, 280]], r: 200 }]] },
    'ed_muralla.main': { l: [['amb_viento_muralla', 0.08], ['amb_fire', 0.32, { p: [[404, 211], [602, 211]], r: 230, min: 0.05 }]], ev: [['ev_cuervo', 14, 30, 0.24]] },
    'ed_jardin_real.main': { l: [['amb_courtyard', 0.3], ['amb_forest', 0.3], ['amb_rio', 0.12, { p: [[470, 250]], r: 210 }], ['amb_pantano', 0.16, { p: [[705, 180]], r: 220 }, 'noche']],
      ev: [['ev_pajaro', 8, 16, 0.24, 'dia']] },
    'ed_norte_del_roble.main': { l: [['amb_forest', 0.3, null, 'dia'], ['amb_pantano', 0.3, { p: [[718, 150]], r: 560, min: 0.08 }]],
      ev: [['ev_cuervo', 12, 26, 0.26], ['ev_buho', 16, 30, 0.26, 'noche']] },
    'ed_bosque_embrujado.main': { l: [['amb_embrujado', 0.75], ['amb_pantano', 0.24, { p: [[260, 520], [1170, 650], [920, 160]], r: 360, min: 0.08 }]],
      ev: [['ev_cuervo', 10, 22, 0.28], ['ev_buho', 14, 28, 0.26, 'noche'], ['ck_fantasma_susurro', 40, 80, 0.12, 'noche']] },
    'ed_cementerio_real.main': { l: [['amb_embrujado', 0.6], ['amb_forest', 0.12, null, 'dia']],
      ev: [['ev_cuervo', 10, 22, 0.3], ['ev_buho', 16, 30, 0.24, 'noche'], ['bat_screech', 28, 55, 0.1, 'noche']] },
    'ed_sendero_orco.main': { l: [['amb_tierras_orcas', 0.5], ['amb_fire', 0.35, { p: [[785, 405]], r: 200 }]], ev: [['ev_cuervo', 14, 30, 0.24]] },
    'ed_afueras_orcas.main': { l: [['amb_tierras_orcas', 0.45], ['amb_pueblo_orco', 0.2], ['amb_fire', 0.35, { p: [[164, 390]], r: 190 }]], ev: [['ev_cuervo', 14, 30, 0.24]] },
    'ed_patio_fortaleza_orca.main': { l: [['amb_fortaleza_orca', 0.55], ['amb_fire', 0.32, { p: [[268, 431], [833, 130], [164, 77], [278, 78]], r: 200, min: 0.06 }]] },
    'ed_coliseo_orco.main': { l: [['amb_coliseo', 0.15], ['amb_fire', 0.14]], grillos: false },
    // ---- adentro
    'ed_capilla_brumavieja.main': { l: [['amb_embrujado', 0.9]] },
    'ed_casa_peste.main': { l: [['amb_embrujado', 0.8]] },
    'ed_casa_quemada_norte.main': { l: [['amb_embrujado', 0.7], ['amb_viento_muralla', 0.025]] },
    'ed_herreria.main': { l: [['amb_fragua', 0.55], ['amb_fire', 0.28]], ev: [['anvil_hit', 4, 9, 0.2]] },
    'ed_herreria_san_roque.main': { l: [['amb_fragua', 0.55], ['amb_fire', 0.3]], ev: [['anvil_hit', 4, 9, 0.2]] },
    'ed_capilla_san_roque.main': { l: [['amb_capilla', 1], ['amb_fire', 0.05]] },
    'ed_molino_san_roque.main': { l: [['amb_molino', 0.14]] },
    'ed_choza_chaman.main': { l: [['amb_caldero', 0.25], ['amb_fire', 0.15]] },
    'ed_biblioteca.main': { l: [['amb_hall', 0.35]], ev: [['page_flip', 12, 26, 0.14]] },
    'ed_granero.main': { l: [['amb_granero', 0.5]], ev: [['ev_vaca', 14, 30, 0.28]] },
    'ed_posada_san_roque.main': { l: [['amb_taberna', 0.3], ['amb_fire', 0.3]], ev: [['ev_risa', 16, 34, 0.2]] }
  };
  // casas desde donde de noche se oyen, bajito, los grillos de afuera
  const NOCHE_CASA = new Set(['ed_casa_grande.main', 'ed_casa_de_arriba.main', 'ed_granero.main', 'ed_tienda_de_viveres.main', 'ed_posada_san_roque.main',
    'ed_posada_san_roque_arriba.main', 'ed_casita_cerco_san_roque.main', 'ed_casa_granjeros_san_roque.main', 'ed_casa_pastor_san_roque.main',
    'ed_molino_san_roque.main', 'ed_capilla_san_roque.main', 'ed_herreria_san_roque.main']);
  // ambientes con pájaros: de noche, afuera, casi se callan y entran los grillos
  const PAJAROS = /^(amb_forest|amb_aldea_dia|amb_campo|amb_courtyard|amb_bosque_frontera)$/;
  const cercania = (S, a, c) => {
    if (!c) return 1;
    const p = pies(S), px = p.x - a.x, py = p.y - a.y;
    let m = 0;
    c.p.forEach(([x, y]) => { const d = y === null ? Math.abs(px - x) : Math.hypot(px - x, py - y); m = Math.max(m, 1 - d / c.r); });
    return Math.max(c.min || 0, Math.min(1, m));
  };
  const listaDe = (S, z, a) => {
    const d = SON[z], N = noche(S), afuera = window.CK_AFUERA ? window.CK_AFUERA(S) : !!a.outdoor;
    const base = d ? d.l : (a.ambient || []), vol = {};
    base.forEach(([n, v, c, cu]) => {
      if ((cu === 'dia' && N) || (cu === 'noche' && !N)) return;
      let k = cercania(S, a, c);
      if (N && afuera && PAJAROS.test(n)) k *= 0.3;
      const q = Math.round(v * k * 50) / 50;
      if (q > 0.005) vol[n] = Math.max(vol[n] || 0, q);
    });
    if (N && afuera && !(d && d.grillos === false) && !/^ed_cueva_/.test(z)) vol.amb_aldea_noche = Math.max(vol.amb_aldea_noche || 0, 0.42);
    if (N && NOCHE_CASA.has(z)) vol.amb_aldea_noche = Math.max(vol.amb_aldea_noche || 0, 0.13);
    // (v2) otros archivos suman capas (el reino en llamas de ck_capitulo3.js): fn(escena, zona) -> [[archivo, volumen]…]
    if (window.CK_AMB_EXTRA) try { (window.CK_AMB_EXTRA(S, z) || []).forEach(([n, v]) => { vol[n] = Math.max(vol[n] || 0, v); }); } catch (e) {}
    return Object.keys(vol).map(n => [n, vol[n]]);
  };
  const tocar = (clip, vol) => {
    try {
      if (/^ev_/.test(clip) && window.CK_SONIDO && window.CK_SONIDO.tocar) { window.CK_SONIDO.tocar(clip, { vol, rate: R(0.94, 1.06), pan: R(-0.6, 0.6) }); return; }
      if (typeof sfx !== 'undefined' && sfx.fx) sfx.fx(clip, vol, { rate: R(0.95, 1.05) });
    } catch (e) {}
  };
  const sonar = (S, now) => {
    if (typeof ambience === 'undefined') return;
    const z = zonaDe(S), c = S.currentInterior, a = c && c.area;
    if (!a || !/^ed_/.test(z) || S._gameMode !== 'campaign') { S._ckamSon = null; return; }
    if (S._doorTransition) return;
    const d = SON[z], afuera = window.CK_AFUERA ? window.CK_AFUERA(S) : !!a.outdoor;
    if (!d && !afuera && !NOCHE_CASA.has(z) && !window.CK_AMB_EXTRA) { S._ckamSon = null; return; }
    const st = S._ckamSon && S._ckamSon.z === z ? S._ckamSon : (S._ckamSon = { z, k: '', prox: {} });
    const L = listaDe(S, z, a), k = JSON.stringify(L);
    if (st.k !== k) { st.k = k; ambience.set(L); }
    // sonidos sueltos
    const N = noche(S);
    ((d && d.ev) || []).forEach((e, i) => {
      const [clip, a0, a1, vol, cu, cerca] = e;
      if ((cu === 'dia' && N) || (cu === 'noche' && !N)) return;
      if (!st.prox[i]) { st.prox[i] = now + R(a0 * 0.4, a1) * 1000; return; }
      if (now < st.prox[i]) return;
      st.prox[i] = now + R(a0, a1) * 1000;
      const k = cerca ? cercania(S, a, { p: [cerca.p], r: cerca.r }) : 1;
      if (!S.isGamePaused && !S.dialogOpen && k > 0.05) tocar(clip, vol * k);
    });
  };

  // ================================================================== 4. LUCES, HUMO, NIEBLA, RUEDA, FUENTES, BURBUJAS
  const COL = { ventana: [255, 196, 118], fuego: [255, 138, 56], fragua: [255, 112, 40], vela: [255, 186, 104], farol: [255, 206, 128],
    verde: [120, 255, 170], hongo: [170, 255, 205], caldero: [120, 255, 120] };
  // por zona: ventanas [x, y, w, h] (centro del vidrio), luces [x, y, color, radio, fuerza, 'noche'?], humo [x, y, escala],
  // niebla {cajas, n, tinte, alfa}, rueda, chorros [x, y], burbujas [x, y]
  const VIDA = {
    'ed_san_roque.main': {
      destellos: [[552, 384, 54, 34]],
      ventanas: [[547, 171, 14, 12], [638, 171, 14, 12], [546, 209, 12, 14], [639, 209, 12, 14], [538, 254, 14, 14], [638, 252, 30, 16],
        [997, 115, 16, 12], [987, 529, 14, 12], [705, 662, 14, 12], [1313, 544, 10, 12], [257, 401, 10, 22], [297, 401, 10, 22], [336, 401, 10, 22]],
      luces: [[825, 330, 'fragua', 46, 0.85]],
      humo: [[653, 100, 1], [1004, 34, 0.9], [995, 430, 0.9], [515, 564, 0.9], [706, 564, 0.9], [852, 208, 1.3]],
      rueda: { x: 1215, y: 488, w: 20, h: 80, paso: 8 }
    },
    'ed_campos_del_roble.main': { ventanas: [[581, 404, 14, 12]] },
    'ed_norte_del_roble.main': {
      ventanas: [[400, 601, 18, 16], [522, 601, 18, 16], [985, 619, 18, 14]],
      luces: [[822, 440, 'vela', 46, 0.9, 'noche'], [985, 656, 'farol', 40, 0.9, 'noche']],
      niebla: { cajas: [[0, 20, 1436, 300]], n: 9, tinte: 0xc8d8c8, alfa: 0.13 }
    },
    'ed_bosque_embrujado.main': {
      luces: [[330, 262, 'hongo', 95, 0.5]],
      niebla: { cajas: [[0, 0, 1436, 802]], n: 12, tinte: 0xb8ccbc, alfa: 0.12 }
    },
    'ed_cementerio_real.main': {
      luces: [[1077, 183, 'verde', 30, 0.8], [1111, 212, 'verde', 28, 0.8], [1141, 213, 'verde', 28, 0.8], [1167, 209, 'verde', 28, 0.8], [1197, 192, 'verde', 30, 0.8],
        [712, 432, 'verde', 120, 0.35]],
      niebla: { cajas: [[0, 0, 1436, 330], [0, 560, 1436, 242]], n: 10, tinte: 0xc0d0c8, alfa: 0.11 }
    },
    'ed_patio_del_castillo.main': { ventanas: [[325, 85, 24, 42], [632, 85, 24, 42]], chorros: [[483, 262]], destellos: [[436, 250, 96, 60]] },
    'ed_jardin_real.main': { chorros: [[471, 210]], destellos: [[572, 88, 266, 176], [422, 214, 100, 80]] },
    'ed_sendero_orco.main': { humo: [[785, 396, 1.1]] },
    'ed_afueras_orcas.main': { humo: [[164, 380, 1]] },
    'ed_patio_fortaleza_orca.main': { humo: [[268, 410, 1.2], [833, 112, 1.1]] },
    'ed_cocina_real.main': { luces: [[372, 152, 'fragua', 30, 0.7], [412, 154, 'fragua', 30, 0.7]] },
    'ed_choza_chaman.main': { luces: [[243, 136, 'caldero', 64, 0.65]], burbujas: [[243, 136]] }
  };

  // texturas hechas por código
  const texturas = S => {
    const hacer = (k, w, h, fn) => { if (S.textures.exists(k)) return; const t = S.textures.createCanvas(k, w, h); fn(t.getContext(), w, h); t.refresh(); };
    hacer('ckam_humo', 16, 16, (g, w, h) => { const r = g.createRadialGradient(8, 8, 0, 8, 8, 8); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.6, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    hacer('ckam_niebla', 128, 64, (g, w, h) => { g.save(); g.scale(1, 0.5); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0.85)'); r.addColorStop(0.55, 'rgba(255,255,255,0.4)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); g.restore(); });
    hacer('ckam_vidrio', 8, 8, (g) => { g.fillStyle = '#fff'; g.fillRect(1, 1, 6, 6); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 1, 8, 6); g.fillRect(1, 0, 6, 8); });
    hacer('ckam_gota', 2, 2, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });
    hacer('ckam_burbuja', 5, 5, (g) => { g.fillStyle = '#fff'; g.fillRect(1, 0, 3, 5); g.fillRect(0, 1, 5, 3); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(2, 2, 1, 1); });
  };
  // la pieza del mapa más de arriba que tiene el punto (para dibujar justo encima de ella)
  const piezaEn = (S, x, y) => {
    let mejor = null;
    S.children.list.forEach(o => {
      if (!o.active || !o.visible || (o.type !== 'Image' && o.type !== 'Sprite') || !o.texture || !/^ed_/.test(o.texture.key) || o.rotation) return;
      const b = o.getBounds(); if (!b.contains(x, y)) return;
      if (!mejor || o.depth > mejor.depth) mejor = o;
    });
    return mejor;
  };
  // color del mapa en un punto del mundo (la pieza de más arriba que lo tiene)
  const colorEn = (S, x, y) => {
    const o = piezaEn(S, x, y); if (!o || o.flipX) return null;
    const fr = o.frame, lx = Math.floor((x - o.x) / o.scaleX + o.originX * fr.cutWidth), ly = Math.floor((y - o.y) / o.scaleY + o.originY * fr.cutHeight);
    if (lx < 0 || ly < 0 || lx >= fr.cutWidth || ly >= fr.cutHeight) return null;
    const c = S.textures.getPixel(fr.cutX + lx, fr.cutY + ly, o.texture.key);
    return c && c.alpha > 200 ? c : null;
  };
  const esAgua = c => c && c.blue > c.red + 25 && c.blue > c.green - 6 && c.blue > 80;
  const viento = () => {
    try { const C = window.CK_CLIMA; const v = C && C.C && C.C[C.actual()] ? C.C[C.actual()].viento : 10; return Math.max(-60, Math.min(60, v * 0.35 + 8)); } catch (e) { return 12; }
  };

  const limpiar = S => {
    const V = S._ckamVida; if (!V) return;
    V.objs.forEach(o => { try { if (o && o.active) o.destroy(); } catch (e) {} });
    V.parts.forEach(p => { try { if (p.s && p.s.active) p.s.destroy(); } catch (e) {} });
    if (V.ruedaKey && S.textures.exists(V.ruedaKey)) S.textures.remove(V.ruedaKey);
    S._ckamVida = null;
  };

  // la rueda del molino de San Roque (se ve de costado: las paletas pasan de arriba abajo)
  const armarRueda = (S, a, d, V) => {
    const cx = a.x + d.x + d.w / 2, cy = a.y + d.y + d.h / 2, o = piezaEn(S, cx, cy);
    if (!o || o.flipX) return;
    const fr = o.frame, sx = o.scaleX, sy = o.scaleY, ox = o.originX * fr.cutWidth, oy = o.originY * fr.cutHeight;
    const lx0 = Math.round((a.x + d.x - o.x) / sx + ox), ly0 = Math.round((a.y + d.y - o.y) / sy + oy);
    const W = Math.round(d.w / sx), H = Math.round(d.h / sy), Pp = Math.max(4, Math.round(d.paso / sy));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(o.texture.getSourceImage(), fr.cutX + lx0, fr.cutY + ly0, W, H, 0, 0, W, H);
    const src = g.getImageData(0, 0, W, H).data;
    const lum = new Float32Array(H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; s += src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11; } lum[y] = s / W; }
    // la luz de cada fila (sin el dibujo de las paletas): promedio de un paso
    const luz = new Float32Array(H);
    for (let y = 0; y < H; y++) { let s = 0, n = 0; for (let k = -Pp; k <= Pp; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += lum[yy]; n++; } } luz[y] = s / n; }
    const p0 = Math.max(0, Math.round(H / 2 - Pp / 2)); let pm = 0; for (let k = 0; k < Pp; k++) pm += lum[p0 + k]; pm /= Pp;
    const key = 'ckam_rueda_' + (S._ckamN = (S._ckamN || 0) + 1);
    const tex = S.textures.createCanvas(key, W, H), ctx = tex.getContext(), img = ctx.createImageData(W, H), D = img.data;
    const im = S.add.image(a.x + d.x, a.y + d.y, key).setOrigin(0, 0).setScale(sx, sy).setDepth(o.depth + 0.02);
    V.objs.push(im); V.ruedaKey = key;
    V.rueda = {
      f: 0, t: 0, dib: () => {
        const f = V.rueda.f;
        for (let y = 0; y < H; y++) {
          const sr = p0 + (((y - f) % Pp) + Pp) % Pp, k = Math.max(0.55, Math.min(1.35, luz[y] / (pm || 1)));
          for (let x = 0; x < W; x++) {
            const di = (y * W + x) * 4, si = (sr * W + x) * 4;
            D[di] = Math.min(255, src[si] * k); D[di + 1] = Math.min(255, src[si + 1] * k); D[di + 2] = Math.min(255, src[si + 2] * k); D[di + 3] = src[di + 3];
          }
        }
        ctx.putImageData(img, 0, 0); tex.refresh();
      }
    };
    V.rueda.dib();
    V.salpica = { x: a.x + d.x, y: a.y + d.y + d.h, w: d.w, t: 0 };
  };

  const armar = S => {
    limpiar(S);
    const z = zonaDe(S), c = S.currentInterior, a = c && c.area, d = VIDA[z];
    if (!a || !d || S._gameMode !== 'campaign') return;
    texturas(S);
    const V = S._ckamVida = { z, objs: [], parts: [], vent: [], humo: [], niebla: [], chorros: [], burbujas: [], agua: [], t: 0 };
    // destellos del agua quieta: puntos de agua de verdad dentro de cada caja (se miran una vez)
    (d.destellos || []).forEach(([x, y, w, h]) => {
      for (let i = 0; i < 260; i++) { const px = a.x + x + R(0, w), py = a.y + y + R(0, h); if (esAgua(colorEn(S, px, py))) { const o = piezaEn(S, px, py); V.agua.push([Math.round(px), Math.round(py), o ? o.depth + 0.05 : py]); } }
    });
    V.aguaT = 0;
    (d.ventanas || []).forEach(([x, y, w, h]) => {
      const wx = a.x + x, wy = a.y + y, o = piezaEn(S, wx, wy);
      const g = S.add.image(wx, wy, 'ckam_vidrio').setDisplaySize(w, h).setTint(0xffc46e).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
        .setDepth(o ? o.depth + 0.03 : 5);
      V.objs.push(g); V.vent.push({ g, x: wx, y: wy, w, h, fase: Math.random() * 6 });
    });
    (d.humo || []).forEach(([x, y, e]) => V.humo.push({ x: a.x + x, y: a.y + y, e: e || 1, t: Math.random() * 400 }));
    (d.chorros || []).forEach(([x, y]) => V.chorros.push({ x: a.x + x, y: a.y + y, t: 0 }));
    (d.burbujas || []).forEach(([x, y]) => V.burbujas.push({ x: a.x + x, y: a.y + y, t: 0 }));
    if (d.niebla) {
      const nb = d.niebla;
      for (let i = 0; i < nb.n; i++) {
        const cj = nb.cajas[i % nb.cajas.length], esc = R(2.2, 4.2);
        const s = S.add.image(a.x + cj[0] + R(0, cj[2]), a.y + cj[1] + R(0, cj[3]), 'ckam_niebla').setScale(esc, esc * R(0.8, 1.1)).setTint(nb.tinte)
          .setAlpha(0).setDepth(27400);
        V.objs.push(s); V.niebla.push({ s, cj, a, vx: R(4, 11) * (Math.random() < 0.5 ? -1 : 1), alfa: nb.alfa * R(0.6, 1.2), ph: R(0, 6), y0: s.y });
      }
    }
    if (d.rueda) try { armarRueda(S, a, d.rueda, V); } catch (e) { console.warn('[ambiente] rueda', e); }
    V.luces = (d.luces || []).map(([x, y, col, r, f, cu]) => ({ x: a.x + x, y: a.y + y, c: COL[col] || COL.fuego, r, f, cu }));
  };

  const parte = (V, s, o) => { V.parts.push(Object.assign({ s, t: 0 }, o)); };
  const vivir = (S, dt) => {
    const V = S._ckamVida; if (!V || V.z !== zonaDe(S)) return;
    V.t += dt;
    const k = encendido(S), t = V.t;
    // ventanas: se prenden al anochecer (alguna titila un poco, como una vela adentro)
    V.vent.forEach(v => v.g.setAlpha(k * (0.5 + 0.06 * Math.sin(t * 0.002 + v.fase) + 0.03 * Math.sin(t * 0.0053 + v.fase * 2))));
    // humo
    const vi = viento();
    V.humo.forEach(h => {
      h.t -= dt; if (h.t > 0) return; h.t = R(380, 620);
      const s = S.add.image(h.x + R(-1.5, 1.5), h.y, 'ckam_humo').setTint(0xc4c2c0).setAlpha(0.42).setScale(0.32 * h.e).setDepth(27380);
      parte(V, s, { vx: vi * R(0.5, 1) + R(-3, 3), vy: R(-16, -11) * h.e, vida: R(3000, 4200), e0: 0.32 * h.e, e1: R(1.3, 1.8) * h.e, a0: 0.42 });
    });
    // chorritos de las fuentes
    V.chorros.forEach(c => {
      c.t -= dt; if (c.t > 0) return; c.t = R(40, 90);
      const s = S.add.image(c.x + R(-2, 2), c.y, 'ckam_gota').setTint(Math.random() < 0.5 ? 0xe8f6ff : 0x9fd2f0).setAlpha(0.9).setDepth(27300);
      parte(V, s, { vx: R(-14, 14), vy: R(-30, -18), g: 70, vida: R(600, 900), a0: 0.9 });
    });
    // destellos del agua quieta
    if (V.agua.length) {
      V.aguaT -= dt;
      if (V.aguaT <= 0) {
        V.aguaT = R(70, 160) * Math.max(0.5, 60 / V.agua.length);
        const [x, y, dp] = V.agua[Math.floor(Math.random() * V.agua.length)], largo = Math.random() < 0.6;
        const s = S.add.image(x, y, 'ckam_gota').setTint(0xffffff).setAlpha(0).setScale(largo ? 1.6 : 1, 0.5).setDepth(dp);
        parte(V, s, { vx: R(-2, 2), vy: 0, vida: R(500, 900), a0: R(0.55, 0.85) });
      }
    }
    // burbujas del caldero
    V.burbujas.forEach(c => {
      c.t -= dt; if (c.t > 0) return; c.t = R(140, 300);
      const s = S.add.image(c.x + R(-9, 9), c.y + R(-1, 3), 'ckam_burbuja').setTint(Math.random() < 0.5 ? 0x8dff8a : 0xc9ffb0).setAlpha(0.9).setScale(R(0.5, 1)).setDepth(27300);
      parte(V, s, { vx: R(-2, 2), vy: R(-12, -6), vida: R(400, 800), a0: 0.9, crece: 0.4 });
    });
    // la rueda del molino y su salpicadura
    if (V.rueda) {
      V.rueda.t += dt; if (V.rueda.t > 115) { V.rueda.t = 0; V.rueda.f++; V.rueda.dib(); }
      const sp = V.salpica; sp.t -= dt;
      if (sp.t <= 0) {
        sp.t = R(60, 130);
        const s = S.add.image(sp.x + R(0, sp.w), sp.y + R(-2, 3), 'ckam_gota').setTint(0xeaf6ff).setAlpha(0.85).setDepth(sp.y + 1);
        parte(V, s, { vx: R(-10, 10), vy: R(-26, -12), g: 80, vida: R(400, 650), a0: 0.85 });
      }
    }
    // niebla que se arrastra
    V.niebla.forEach(n => {
      const s = n.s, A = n.a, [cx, cy, cw, ch] = n.cj;
      s.x += n.vx * dt / 1000;
      const x0 = A.x + cx - 120, x1 = A.x + cx + cw + 120;
      if (s.x > x1) s.x = x0; else if (s.x < x0) s.x = x1;
      s.y = n.y0 + Math.sin(t * 0.0004 + n.ph) * 8;
      // aparece y se va de a poco (y menos sobre el héroe, para no taparlo)
      const borde = Math.min(1, Math.min(s.x - x0, x1 - s.x) / 140);
      s.setAlpha(n.alfa * borde * (0.75 + 0.25 * Math.sin(t * 0.0007 + n.ph)));
    });
    // partículas
    for (let i = V.parts.length - 1; i >= 0; i--) {
      const p = V.parts[i], s = p.s; p.t += dt;
      if (!s.active || p.t >= p.vida) { if (s.active) s.destroy(); V.parts.splice(i, 1); continue; }
      const e = p.t / p.vida;
      if (p.g) p.vy += p.g * dt / 1000;
      s.x += p.vx * dt / 1000; s.y += p.vy * dt / 1000;
      if (p.e0 !== undefined) s.setScale(p.e0 + (p.e1 - p.e0) * Math.sqrt(e));
      if (p.crece) s.setScale(s.scaleX + p.crece * dt / 1000);
      s.setAlpha(p.a0 * (e < 0.12 ? e / 0.12 : 1 - (e - 0.12) / 0.88));
    }
  };

  // luz de las llamas animadas, ventanas y luces sueltas
  if (window.CK_LUZ && window.CK_LUZ.fuente) {
    window.CK_LUZ.fuente((S, out) => {
      const at = window.CK_CLIMA && window.CK_CLIMA.atenuar, t = S.time ? S.time.now : 0;
      (S._ckfv || []).forEach((o, i) => {
        if (!o || !o.active || !o.visible || o.type !== 'Sprite' || o.alpha < 0.1) return;
        const h = o.displayHeight, ll = 0.93 + 0.07 * (0.5 * Math.sin(t * 0.0021 + o.x) + 0.3 * Math.sin(t * 0.0047 + o.x * 1.7) + 0.2 * Math.sin(t * 0.0089 + i * 2.3));
        const l = { x: o.x, y: o.y - h * 0.35, c: COL.fuego, r: (o._ckamExtra ? 18 : 30) + h * (o._ckamExtra ? 1.2 : 2.6), f: (o._ckamExtra ? 0.5 : 0.95) * ll * o.alpha };
        if (at) l.f *= at(l.x, l.y);
        out.push(l);
      });
      const V = S._ckamVida;
      if (!V || V.z !== zonaDe(S)) return;
      const k = encendido(S);
      V.vent.forEach(v => { if (k > 0.02) { out.push({ x: v.x, y: v.y + 4, c: COL.ventana, r: Math.max(26, v.w * 2.2), f: 0.62 * k }); out.push({ x: v.x, y: v.y, c: COL.ventana, r: Math.max(10, v.w * 0.9), f: 0.9 * k }); } });
      (V.luces || []).forEach(l => {
        if (l.cu === 'noche' && k < 0.02) return;
        const ti = 0.94 + 0.06 * Math.sin(t * 0.003 + l.x);
        out.push({ x: l.x, y: l.y, c: l.c, r: l.r * (0.98 + 0.02 * ti), f: l.f * ti * (l.cu === 'noche' ? k : 1) });
      });
    });
  }

  // ================================================================== 5. ENGANCHES
  const cuando = S => {
    limpiar(S); S._ckamAncho = null;
    const z = zonaDe(S), t0 = Date.now();
    const iv = setInterval(() => {
      if (!S.player || zonaDe(S) !== z || Date.now() - t0 > 12000) { clearInterval(iv); return; }
      if (S._doorTransition || document.querySelector('.ck-carga.on, #ck-carga.on')) return;
      clearInterval(iv);
      setTimeout(() => { if (zonaDe(S) === z) { try { armar(S); } catch (e) { console.warn('[ambiente]', e); } } }, 350);
    }, 300);
  };
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    if (f0) P[k] = function () { const r = f0.apply(this, arguments); try { cuando(this); } catch (e) {} return r; };
  });
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode === 'campaign' && this.player) {
        const dt = Math.min(100, delta || 16), now = Date.now();
        if (!this._ckamSonT || now - this._ckamSonT > 280) { this._ckamSonT = now; sonar(this, now); ensanchar(this); }
        vivir(this, dt);
      } else if (this._ckamVida) limpiar(this);
    } catch (e) { if (!P._ckamAv) { P._ckamAv = 1; console.warn('[ambiente]', e); } }
    return r;
  };
  window.CK_AMBIENTE_MAPAS = { SON, VIDA, NOCHE_CASA, listaDe, armar, limpiar };
})();
