'use strict';
/* Misiones y eventos en el panel de PRUEBAS (F4) (22/11, pedido del dueño: "quiero que la sección de pruebas añadas para
   probar eventos del juego como misiones específicas incluyendo sus cinemáticas, como la batalla del capitán Bruno y eso,
   así también puedo hacer notas sobre qué cambiar y qué modificar").
   Una parte nueva arriba del panel, MISIONES Y EVENTOS: se elige un momento de la historia (por capítulo) y "Probar":
   - Arranca una PARTIDA DE PRUEBA (la misma de "Probar un mapa": mientras dura NO SE GUARDA NADA, ni la historia, ni las
     ranuras, ni Urso libre, ni los logros) con la historia puesta justo antes de ese momento (el paso y las banderas que hacen falta),
     nivel 8 (todas las ranuras), 6 corazones, pociones y monedas, y el árbol de habilidades que ya tenías.
   - Lleva al héroe al lugar (de noche si el evento es de noche) y el evento sale solo como en la campaña: la cinemática al
     entrar, o se le habla al personaje (si hace falta hablar, el héroe queda delante y la charla arranca sola). En
     algunos se ayuda un poco: en la Fortaleza se saca a la guardia para que Grushak hable enseguida.
   - Con N se anota como siempre (ck_notas_prueba.js): la nota queda con el mapa y el lugar.
   - "Volver a la práctica" (en PROBAR UN MAPA, abajo) termina la prueba.
   Lo que se puede probar está en EVENTOS (cada uno: capítulo, nombre, qué pasa, la historia, a dónde va y qué hace al
   llegar). Necesita ck_panel_pruebas.js. Borrar su línea de index.html lo saca.
   (23/11, v2) Brumavieja y el Cementerio Real rehechos (la capilla con el diario, el Gran Esqueleto al salir, el Nigromante en el
   Cementerio Real) y los textos de las batallas, la Fosa y la Fortaleza con sus cinemáticas nuevas.
   (23/11, v3) El Capítulo 3 rehecho: el campamento, la emboscada y el ritual, los cuatro lugares del reino en orden, el castillo
   (patio, Gran Salón, aposentos y biblioteca) y la mazmorra con Azrath en el Abismo (con el número de paso nuevo).
   (23/11, v4) El Cementerio Real con las tumbas y las reliquias: dos eventos en vez del Nigromante de antes (las tumbas, y
   las cuatro reliquias ya halladas para ponerlas en el círculo).
   (23/11, v5) El Rey y la llave del portón del norte, el portón con cadena y la emboscada del Norte del Roble (en vez de la de
   Brumavieja de noche).
   (23/11, v6) La emboscada y el ritual del Capítulo 3, al día con ck_capitulo3.js v9 (sólo el texto del evento).
   (23/11, v7) El Camino al Castillo y el castillo infestado, al día con ck_notas_arreglos_5.js y _6.js (sólo el texto).
   (24/11, v8) Dos eventos nuevos del final (ck_final.js): la vuelta con Elia y el juicio del Rey con el FIN. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const DIA = 300000, NOCHE = 0.74, MANANA = 0.32;
  const PP = () => window.CK_PANEL_PRUEBAS;
  const vivo = e => e && e.active && !e.isDead;
  const copia = o => JSON.parse(JSON.stringify(o || {}));

  // ------------------------------------------------------------------ la historia de cada momento
  // banderas de una partida nueva con el prólogo hecho, y con el Capítulo 1 terminado
  const PROLOGO = { v2: 1, intro: true, festejo: true, guia: true, entrenado: true, dash: 1, limos: 'hecho' };
  // (los libros de la historia ya leídos y el resumen del capítulo ya visto: si no, se abren solos encima del evento)
  const LEIDOS = { lb_sello: 1, lb_codice: 1 };
  const CAP1 = Object.assign({}, PROLOGO, { bruma_vecinos: 1, bruma_noche: 1, aby_interrumpe: true, rey_gesto: true, key: true, libro_sello: true, codice: 1, codice_ok: 1, epilogo: 1, fin_visto: true, lecturas: LEIDOS });
  const CAP2 = Object.assign({}, CAP1, { c2: 9, grushak: 1, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 }, col: { capturado: true, ronda: 3, libre: true }, cristales: { rojo: true, entregados: true }, expulsado: true });
  const con = (base, mas) => Object.assign(copia(base), copia(mas));
  // (v3) el reino limpio (los cuatro lugares del Capítulo 3) y el castillo limpio (sus cuatro lugares)
  const INF_LIMPIO = { 'ed_san_roque.main': { g: [], m: [], s: 20, x: 0, ok: true }, 'ed_camino_al_castillo.main': { g: [], m: [], s: 0, x: 0, ok: true },
    village: { g: [], m: [], s: 20, x: 0, ok: true }, 'ed_campos_del_roble.main': { g: [], m: [], s: 20, x: 0, ok: true } };
  const CASTILLO_LIMPIO = { patio: { m: [], ok: true }, jardin: { m: [], ok: true }, muro: { m: [], ok: true }, armas: { m: [], ok: true } };
  // hablar con alguien de la historia (STORY_NPCS): el héroe queda delante y arranca la charla
  const hablar = (id, ms) => S => S.time.delayedCall(ms || 700, () => {
    try {
      if (typeof STORY_NPCS === 'undefined') return;
      const z = S.currentZoneKey(), n = STORY_NPCS.find(q => q.id === id && q.zone === z && q.x > -9000);
      if (!n) return;
      const c = S.currentInterior, ox = c ? c.area.x : 0, oy = c ? c.area.y : 0;
      poner(S, ox + n.x, oy + n.y + Math.min(26, (n.r || 40) * 0.5));
      S.time.delayedCall(250, () => { if (!S.dialogOpen && !S._ckEscena) S.interact(); });
    } catch (e) { console.warn('[pruebas eventos]', e); }
  });
  const poner = (S, x, y) => { try { S._areaSwitchHold = false; if (S.placePlayerFeetAt) S.placePlayerFeetAt(x, y); else S.player.body.reset(x, y); } catch (e) {} };
  const enArea = (x, y) => S => { const c = S.currentInterior; if (c) poner(S, c.area.x + x, c.area.y + y); };
  // en la mazmorra: la llegada por el portal ya pasó; cuando no hay escena, el héroe a la arena del Sello
  const alSello = S => { const t0 = S.time.now, ev = S.time.addEvent({ delay: 200, loop: true, callback: () => { if (S._ckEscena && S.time.now - t0 < 15000) return; ev.remove(); enArea(720, 230)(S); } }); };
  const sinGuardia = S => S.time.delayedCall(1500, () => {
    (S.enemies ? S.enemies.getChildren().slice() : []).forEach(e => { if (vivo(e) && !e._c2Jefe && e.zone === S.currentZoneKey()) try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} });
  });

  // [capítulo, nombre, qué pasa / cómo se prueba, historia {step, flags}, adónde (como en PROBAR UN MAPA), zona de llegada, noche, al llegar]
  const EVENTOS = [
    { c: 'Capítulo 1', n: 'El arranque: la fiesta del pueblo y la taberna', d: 'De noche en la aldea: fogón, fuegos artificiales, el tabernero los lleva a la taberna, el brindis, pasa la noche y Pipo despierta al héroe y lo guía hasta el Rey (son varias escenas seguidas: para cortarlas, "Volver a la práctica").',
      h: { step: 0, flags: { v2: 1 } }, ir: '_aldea', z: 'village', noche: true,
      luego: S => S.time.delayedCall(600, () => { try { const I = window.CK_INTRO, PR = window.CK_PROLOGO; if (PR && PR.trasIntro) PR.trasIntro(S, (I && I.despertar) || (() => {})); } catch (e) { console.warn(e); } }) },
    { c: 'Capítulo 1', n: 'El entrenamiento con el Capitán Bruno', d: 'En el Patio de Armas: Bruno lo lleva al campo de práctica (golpes, combo, paso rápido, correr, limos y la charla final).',
      h: { step: 1, flags: { v2: 1, intro: true, festejo: true, guia: true } }, ir: '@castle:training', z: 'castle.training', luego: hablar('captain', 900) },
    { c: 'Capítulo 1', n: 'La noche de los limos (la Limo madre)', d: 'De noche en el Camino al Castillo: tres oleadas de limos y la Limo madre; al final Pipo trae el mensaje de Bruno.',
      h: { step: 2, flags: con(PROLOGO, { limos: 'pendiente' }) }, ir: 'camino_al_castillo', z: 'ed_camino_al_castillo.main', noche: true, luego: S => S.time.delayedCall(500, () => enArea(640, 420)(S)) },
    { c: 'Capítulo 1', n: 'Los aldeanos desaparecidos (Campos del Roble)', d: 'Juana, Nina y Don Rufino en los Campos: se habla con T a cada uno (la marca dorada sobre el más cercano).',
      h: { step: 2, flags: con(PROLOGO) }, ir: 'campos_del_roble', z: 'ed_campos_del_roble.main' },
    // (23/11, v5) el Rey después de los desaparecidos y la emboscada en el Norte del Roble (ck_norte_roble.js, ck_brumavieja.js v2)
    { c: 'Capítulo 1', n: 'El Rey y la llave del portón del norte', d: 'Con los tres desaparecidos a salvo: Bruno manda a contarle al Rey; el Rey da la llave del portón del norte y el permiso de investigar. Después, Bruno y el Maestre Eloy como siempre.',
      h: { step: 3, flags: con(PROLOGO, { desap: { juana: 1, nico: 1, rufino: 1 } }) }, ir: 'salon_del_trono_3', z: 'ed_salon_del_trono_3.main', luego: hablar('king', 1200) },
    { c: 'Capítulo 1', n: 'El portón del norte (cadena y candado)', d: 'En el Norte del Roble, con la llave del Rey: al acercarse al portón la cadena se abre y se pasa al Bosque Embrujado (sin la llave, no se pasa).',
      h: { step: 3, flags: con(PROLOGO, { desap: { juana: 1, nico: 1, rufino: 1 }, rey_norte: true, h: 'eloy' }) }, ir: 'norte_del_roble', z: 'ed_norte_del_roble.main', luego: S => S.time.delayedCall(600, () => enArea(743, 200)(S)) },
    { c: 'Capítulo 1', n: 'La emboscada del Norte del Roble', d: 'Ya habló con los vecinos y miró la casa quemada: al volver al cruce, Marta, Ciro y Doña Inés se acercan ("Quedate con nosotros…"), se transforman en esqueletos y suben seis más.',
      h: { step: 4, flags: con(PROLOGO, { desap: { juana: 1, nico: 1, rufino: 1 }, rey_norte: true, norte_abierto: true, bruma_vecinos: { bv_marta: true }, norte_inv: true }) }, ir: 'norte_del_roble', z: 'ed_norte_del_roble.main',
      luego: S => S.time.delayedCall(700, () => enArea(800, 480)(S)) },
    { c: 'Capítulo 1', n: 'Aby interrumpe (vuelta a la aldea)', d: 'Después de la emboscada del Norte del Roble: al volver a la aldea llega Aby corriendo (si jugás con Aby, la escena la hace Lancent).',
      h: { step: 5, flags: con(PROLOGO, { bruma_vecinos: 1, bruma_noche: 1 }) }, ir: '_aldea', z: 'village' },
    // (23/11, v2) Brumavieja y el Cementerio Real rehechos (ck_brumavieja_historia.js, notas 33 a 35)
    { c: 'Capítulo 1', n: 'La capilla: los muertos y el diario de Varek (Brumavieja)', d: 'Al acercarse a la capilla los muertos se levantan a cuidarla; vencidos, la puerta cede (T para entrar) y adentro brilla el diario de Varek.',
      h: { step: 5, flags: con(PROLOGO, { bruma_vecinos: 1, bruma_noche: 1, aby_interrumpe: true, libro_sello: true, lecturas: { lb_sello: 1 } }) }, ir: '@ruins', z: 'ruins.village',
      luego: S => S.time.delayedCall(600, () => { const c = window.CK_CAPILLA || { x: 522, y: 220 }; enArea(c.x, c.y + 170)(S); }) },
    { c: 'Capítulo 1', n: 'El Gran Esqueleto (al salir de la capilla)', d: 'Con el diario leído, al salir de la capilla el Gran Esqueleto sube de la tierra frente a la escalinata (con el doble de vida) y lleva la llave del Cementerio Real.',
      h: { step: 5, flags: con(PROLOGO, { bruma_vecinos: 1, bruma_noche: 1, aby_interrumpe: true, libro_sello: true, lecturas: { lb_sello: 1, lb_diario_varek: 1 }, bv: { capilla: true, libro: true } }) },
      ir: '@ruins', z: 'ruins.village', luego: S => S.time.delayedCall(300, () => { const c = window.CK_CAPILLA || { x: 522, y: 220 }; enArea(c.x, c.y)(S); }) },
    // (23/11, v4) el Cementerio Real con las tumbas y las cuatro reliquias (ck_brumavieja_historia.js v3, nota 5)
    { c: 'Capítulo 1', n: 'El Cementerio Real: las tumbas y las reliquias', d: 'Sin bestias, la voz de Varek y el círculo grabado del piso que titila. Las tumbas se rompen a golpes: en cuatro están las reliquias de los reyes (las que largan aliento verde); las otras a veces largan veneno, muertos o monedas. Cada reliquia prende la estatua de su rey.',
      h: { step: 6, flags: con(PROLOGO, { bruma_vecinos: 1, bruma_noche: 1, aby_interrumpe: true, key: true, libro_sello: true, lecturas: { lb_sello: 1, lb_diario_varek: 1 }, bv: { capilla: true, libro: true } }) },
      ir: 'cementerio_real', z: 'ed_cementerio_real.main', luego: S => S.time.delayedCall(600, () => enArea(718, 530)(S)) },
    { c: 'Capítulo 1', n: 'El Nigromante (las cuatro reliquias en el círculo)', d: 'Con las cuatro reliquias halladas: al pisar el círculo van a sus puntas, el círculo se prende entero, la voz grita, tres rayos, el cuadro de impacto y el Nigromante con seis esqueletos. Al sellarlo, el cristal verde queda en el piso.',
      h: { step: 6, flags: con(PROLOGO, { bruma_vecinos: 1, bruma_noche: 1, aby_interrumpe: true, key: true, libro_sello: true, lecturas: { lb_sello: 1, lb_diario_varek: 1 }, bv: { capilla: true, libro: true, voz1: true, halladas: { corona: 1, anillo: 1, espada: 1, sonajero: 1 } } }) },
      ir: 'cementerio_real', z: 'ed_cementerio_real.main', luego: S => S.time.delayedCall(900, () => enArea(719, 450)(S)) },

    { c: 'Capítulo 2', n: 'La batalla con el Capitán Bruno (Sendero Orco)', d: 'La línea entra marchando, Bruno arenga, la horda se junta del otro lado de la grieta, "¡por Valcairn y por el Rey!", los soldados tienden las escaleras y empieza la batalla. Arriba, la cuenta de orcos caídos.',
      h: { step: 8, flags: con(CAP1, { c2: 4, batalla_orca: { n: 0, g: 0, fin: 0 } }) }, ir: 'sendero_orco', z: 'ed_sendero_orco.main' },
    { c: 'Capítulo 2', n: 'La batalla: Gorvak y sus legiones (Afueras)', d: 'Con 300 orcos caídos: Bruno al frente, "¡alto!", la horda se abre para Gorvak, que salta sobre la línea y voltea a todos; su presentación y la pelea. Las catapultas orcas tiran piedras (la sombra marca dónde caen).',
      h: { step: 8, flags: con(CAP1, { c2: 4, batalla_orca: { n: 300, g: 0, fin: 0, escaleras: 1 } }) }, ir: 'afueras_orcas', z: 'ed_afueras_orcas.main' },
    { c: 'Capítulo 2', n: 'La batalla: Bruno cae herido (retirada)', d: 'A 478 orcos caídos: vencé dos más y Bruno cae herido; retirada.',
      h: { step: 8, flags: con(CAP1, { c2: 4, batalla_orca: { n: 478, g: 1, fin: 0, escaleras: 1 } }) }, ir: 'afueras_orcas', z: 'ed_afueras_orcas.main' },
    { c: 'Capítulo 2', n: 'Urso: la jaula y Garra Negra (la Fosa)', d: 'Con la llave de hueso: T en la jaula, Urso sale, el rugido lejano y los pasos; los ojos de Garra Negra entre las sombras, el dash, el aullido y su cartel; se pelea con Urso al lado.',
      h: { step: 8, flags: con(CAP1, { c2: 5, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 }, oso: 2, oso_llave: 1 }) }, ir: 'cueva_fosa', z: 'ed_cueva_fosa.main', luego: S => S.time.delayedCall(700, () => enArea(226, 640)(S)) },
    { c: 'Capítulo 2', n: 'La Fortaleza: Grushak te captura', d: 'En la Fortaleza Orca (se saca a la guardia sola): Grushak, parado delante del trono, habla, muestra a la princesa y te rodean sus orcos.',
      h: { step: 8, flags: con(CAP1, { c2: 6, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 } }) }, ir: 'fortaleza_orca', z: 'ed_fortaleza_orca.main', luego: sinGuardia },
    { c: 'Capítulo 2', n: 'El Coliseo: las tres rondas', d: 'Grushak en la tribuna con Elia; presenta a Gorvak, después a Ulrak y Colmillo y después a Kragmor.',
      h: { step: 8, flags: con(CAP1, { c2: 6, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 }, col: { capturado: true, ronda: 0, libre: false } }) }, ir: 'coliseo_orco', z: 'ed_coliseo_orco.main' },
    { c: 'Capítulo 2', n: 'El Coliseo: Grushak salta a la arena', d: 'Después de la tercera ronda: Grushak se enfurece, salta de la tribuna y pelea; al caer, sus últimas palabras.',
      h: { step: 8, flags: con(CAP1, { c2: 6, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 }, col: { capturado: true, ronda: 3, libre: false } }) }, ir: 'coliseo_orco', z: 'ed_coliseo_orco.main' },
    { c: 'Capítulo 2', n: 'La expulsión (el Rey y Sir Gaspar)', d: 'Al hablarle al Rey con el capítulo cerrado: Gaspar pide las piedras, los mercenarios te rodean y te echan del castillo.',
      h: { step: 8, flags: con(CAP1, { c2: 8, grushak: 1, batalla_orca: { n: 480, g: 1, fin: 1, escaleras: 1 }, col: { capturado: true, ronda: 3, libre: true }, cristales: { rojo: true } }) }, ir: 'salon_del_trono_3', z: null, luego: hablar('king', 1200) },

    // (23/11, v3) el Capítulo 3 rehecho (ck_capitulo3.js v8, ck_capitulo3_castillo.js, ck_mazmorra_lava.js)
    { c: 'Capítulo 3', n: 'El campamento de Bruno', d: 'Bruno espera en el camino del Bosque de la Frontera y habla del Rey traidor; al terminar la charla, de noche, sigue la emboscada.',
      h: { step: 8, flags: con(CAP2, { c3: 1 }) }, ir: 'bosque_de_la_frontera', z: 'ed_bosque_de_la_frontera.main', luego: hablar('bruno_c3', 2200) },
    { c: 'Capítulo 3', n: 'La emboscada y el ritual del monolito', d: 'De noche junto al fogón: los caballeros negros de Gaspar salen de las carpas y voltean a los soldados; se pelea con Bruno hasta caer (32 s) mientras los soldados de la cuarentena pelean y caen; atados, el ritual: la verde, la roja y la gema de la corona se juntan, el monolito despierta (cinco latidos), el portal se lleva a Elia, la columna de luz, el claro en llamas y las tres oleadas desde portales del campamento.',
      h: { step: 8, flags: con(CAP2, { c3: 2 }) }, ir: 'bosque_de_la_frontera', z: 'ed_bosque_de_la_frontera.main', noche: true },
    { c: 'Capítulo 3', n: 'El reino en llamas: San Roque (el primero)', d: 'Gromm, los demonios y 20 vecinos que corren a las casas: hay que salvar 15; con 6 muertos el lugar empieza de nuevo.',
      h: { step: 8, flags: con(CAP2, { c3: 3, infierno: true }) }, ir: 'san_roque', z: 'ed_san_roque.main' },
    { c: 'Capítulo 3', n: 'El reino en llamas: el Camino al Castillo', d: 'Con San Roque limpio: cada soldado de Bruno sale a pelear con un demonio (la cámara lo recorre), tres caballeros negros pelean frente al portón (alzado) y Fauces sale en el cruce de abajo.',
      h: { step: 8, flags: con(CAP2, { c3: 3, infierno: true, inf: { 'ed_san_roque.main': { g: [], m: [], s: 20, x: 0, ok: true } } }) }, ir: 'camino_al_castillo', z: 'ed_camino_al_castillo.main' },
    { c: 'Capítulo 3', n: 'El reino en llamas: la Aldea', d: 'Con San Roque y el Camino limpios: Seravel, los demonios y los 20 vecinos.',
      h: { step: 8, flags: con(CAP2, { c3: 3, infierno: true, inf: { 'ed_san_roque.main': { g: [], m: [], s: 20, x: 0, ok: true }, 'ed_camino_al_castillo.main': { g: [], m: [], s: 0, x: 0, ok: true } } }) }, ir: '_aldea', z: 'village' },
    { c: 'Capítulo 3', n: 'El reino en llamas: los Campos (el último)', d: 'Con los otros tres limpios: Taurax, el último jefe, y los 20 vecinos. Al terminar, el portón del castillo se abre.',
      h: { step: 8, flags: con(CAP2, { c3: 3, infierno: true, inf: { 'ed_san_roque.main': { g: [], m: [], s: 20, x: 0, ok: true }, 'ed_camino_al_castillo.main': { g: [], m: [], s: 0, x: 0, ok: true }, village: { g: [], m: [], s: 20, x: 0, ok: true } } }) }, ir: 'campos_del_roble', z: 'ed_campos_del_roble.main' },
    { c: 'Capítulo 3', n: 'El castillo infestado (el patio)', d: 'El portón abierto: el patio, el jardín, la muralla y el patio de armas tienen demonios (cartel "CASTILLO n/4"); la primera vez, la gente del patio corre a la cocina y a la herrería, que quedan trancadas; los lanceros de la escalinata bajan a pelear.',
      h: { step: 8, flags: con(CAP2, { c3: 4, infierno: true, inf: INF_LIMPIO }) }, ir: '@castle:courtyard', z: 'castle.courtyard' },
    { c: 'Capítulo 3', n: 'El Gran Salón: Gaspar y Morvane', d: 'Los caballeros negros caídos, Gaspar pide ayuda, Morvane y su escolta; al vencerlos se elige: derrotarlo de un golpe o dejarlo ir humillado.',
      h: { step: 8, flags: con(CAP2, { c3: 5, infierno: true, inf: INF_LIMPIO, castillo: CASTILLO_LIMPIO }) }, ir: 'salon_del_trono_3', z: 'ed_salon_del_trono_3.main' },
    { c: 'Capítulo 3', n: 'Los aposentos del Rey: el cristal del portal', d: 'El Rey escondido se sorprende, adula, da el cristal del portal y entra el Maestre Eloy.',
      h: { step: 8, flags: con(CAP2, { c3: 6, infierno: true, inf: INF_LIMPIO, castillo: CASTILLO_LIMPIO, gaspar_fin: 'derrotado' }) }, ir: 'aposentos_del_rey', z: 'ed_aposentos_del_rey.main' },
    { c: 'Capítulo 3', n: 'La biblioteca: el ritual de Eloy', d: 'Con el cristal: T a Eloy, el anillo de runas, el portal y la columna de luz, y a la Mazmorra del Sello.',
      h: { step: 8, flags: con(CAP2, { c3: 7, infierno: true, inf: INF_LIMPIO, castillo: CASTILLO_LIMPIO, gaspar_fin: 'derrotado', cristales: { rojo: true, entregados: true, portal: true } }) }, ir: 'biblioteca', z: 'ed_biblioteca.main', luego: hablar('eloy', 1500) },
    { c: 'Capítulo 3', n: 'La Mazmorra del Sello: Malakar', d: 'En la arena del Sello: la luz late, Elia grita en su domo y aparece Malakar, el Brujo del Sello.',
      h: { step: 8, flags: con(CAP2, { c3: 8, infierno: true, mz: { llego: 1, portalCerrado: 1, reja: 1 } }) }, ir: 'mazmorra_sello', z: 'ed_mazmorra_sello.main', luego: alSello },
    { c: 'Capítulo 3', n: 'La Mazmorra del Sello: Azrath en el Abismo', d: 'Con Malakar vencido: un destello y Azrath, el Rey Demonio, en una isla de roca en medio de un mar de lava.',
      h: { step: 8, flags: con(CAP2, { c3: 8, infierno: true, mz: { llego: 1, portalCerrado: 1, reja: 1, brujo: 1 } }) }, ir: 'mazmorra_sello', z: 'ed_mazmorra_sello.main', luego: alSello },
    // (24/11, v8) el final del juego (ck_final.js)
    { c: 'Final', n: 'El final: la vuelta con Elia', d: 'Con Azrath vencido, de vuelta por el portal de Oswin: Elia sale detrás, Bruno los recibe en el portón y Elia pide a su padre en el Gran Salón.',
      h: { step: 8, flags: con(CAP2, { c3: 8, infierno: true, inf: INF_LIMPIO, castillo: CASTILLO_LIMPIO, gaspar_fin: 'perdonado', cristales: { rojo: true, entregados: true, portal: true }, mz: { llego: 1, reja: 1, brujo: 1, demonio: 1, final: 1 } }) }, ir: 'camino_al_castillo', z: 'ed_camino_al_castillo.main' },
    { c: 'Final', n: 'El final: el juicio del Rey y el FIN', d: 'En el Gran Salón: traen al Rey, Elia lo destierra, Bruno grita por la reina, el héroe es nombrado Caballero de Valcairn; el epílogo y la pantalla de FIN con los créditos.',
      h: { step: 8, flags: con(CAP2, { c3: 9, infierno: true, inf: INF_LIMPIO, castillo: CASTILLO_LIMPIO, gaspar_fin: 'derrotado', cristales: { rojo: true, entregados: true, portal: true }, mz: { llego: 1, reja: 1, brujo: 1, demonio: 1, final: 1 } }) }, ir: 'salon_del_trono_3', z: 'ed_salon_del_trono_3.main' }
  ];

  // ------------------------------------------------------------------ probar
  const st = { ev: 0, corriendo: null };
  const aplicar = (S, ev) => {
    const viejo = S.story || {}, h = copia(ev.h);
    // lo demás de la partida queda (el árbol de habilidades, las mejoras de la tienda…); la historia, el nivel y la vida, los del evento
    const s = Object.assign(copia(viejo), { step: h.step || 0, count: 0, xp: 0, level: 8, coins: Math.max(viejo.coins || 0, 300), maxHealth: 6, inv: { potion: 3, elixir: 1 }, flags: h.flags || {} });
    s.up = Object.assign({ atk: 0, sta: 0, hp: 0 }, viejo.up || {});      // (sin esto, el daño de la tienda queda NaN)
    S.story = s; S.maxHealth = s.maxHealth; S.health = S.maxHealth;
    S.maxStamina = 100 + (s.level - 1) * 5 + (s.up.sta || 0) * 20; S.stamina = S.maxStamina;
    S.dayClock = (Math.floor((S.dayClock || 0) / DIA) + 1) * DIA + (ev.noche ? NOCHE : MANANA) * DIA;
    try { S.updateObjective && S.updateObjective(); S.updateHUD && S.updateHUD(); } catch (e) {}
  };
  const llegar = (S, ev, n) => {
    const t0 = S.time.now, ok = () => !S._doorTransition && S.player && (!ev.z ? S.time.now - t0 > 2600 : S.currentZoneKey && S.currentZoneKey() === ev.z);
    const ev2 = S.time.addEvent({ delay: 120, loop: true, callback: () => {
      if (st.corriendo !== n) { ev2.remove(); return; }
      if (S.time.now - t0 > 20000) { ev2.remove(); return; }
      if (!ok()) return;
      ev2.remove();
      if (ev.noche) S.dayClock = Math.floor((S.dayClock || 0) / DIA) * DIA + NOCHE * DIA;
      try { S.createFloatingText(S.player.x, S.player.y - 56, 'PRUEBA · ' + ev.n, 0xfde68a); } catch (e) {}
      try { ev.luego && ev.luego(S); } catch (e) { console.warn('[pruebas eventos]', e); }
    } });
  };
  const probar = (S, i) => {
    const ev = EVENTOS[i], P = PP(); if (!ev || !P || !S) return;
    // (con una escena andando, la escena vieja podría seguir sola en el medio de la nueva)
    if (S._ckEscena) { try { S.createFloatingText(S.player.x, S.player.y - 50, 'Esperá que termine la escena (o "Volver a la práctica")', 0xfca5a5); } catch (e) {} return; }
    const n = st.corriendo = (st.corriendo || 0) + 1;
    P.st.prueba = true;
    const seguir = () => {
      if (st.corriendo !== n) return;
      try { if (S._ckEscena) S._ckEscena = false; if (S.dialogOpen && S.closeDialog) S.closeDialog(); } catch (e) {}
      aplicar(S, ev);
      P.irMapa(S, ev.ir);
      llegar(S, ev, n);
    };
    if (S._gameMode !== 'campaign') {
      S._ckPruebaArranca = true;
      try { S.startCampaign(); } finally { S._ckPruebaArranca = false; }
      S.time.delayedCall(1400, () => {
        try { if (S.endIntro) S.endIntro(); } catch (e) {}
        document.querySelectorAll('.ck-intro,#ck-intro').forEach(el => el.remove());
        S.time.delayedCall(300, seguir);
      });
    } else seguir();
  };
  // en la prueba tampoco quedan Urso libre ni los logros para siempre (eso se guarda aparte de la partida)
  const set0 = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    try { const P = PP(); if (st.corriendo && P && P.st.prueba && /oso_libre|ck_logros/.test(k)) return; } catch (e) {}
    return set0.apply(this, arguments);
  };
  const c0 = MainGameScene.prototype.startCampaign;
  MainGameScene.prototype.startCampaign = function () { if (!this._ckPruebaArranca) st.corriendo = null; return c0.apply(this, arguments); };

  // ------------------------------------------------------------------ la parte del panel
  const opc = (lista, sel) => lista.map(([v, t]) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${t}</option>`).join('');
  const html = () => {
    const caps = []; EVENTOS.forEach((e, i) => { let g = caps.find(x => x[0] === e.c); if (!g) caps.push(g = [e.c, []]); g[1].push([i, e.n]); });
    const e = EVENTOS[st.ev] || {};
    return `<h3>MISIONES Y EVENTOS</h3><select id="ckpe-ev">${caps.map(([c, l]) => `<optgroup label="${c}">${opc(l, st.ev)}</optgroup>`).join('')}</select>
      <div class="nota">${e.d || ''}${e.noche ? ' (de noche)' : ''}</div>
      <div class="fila"><button data-pe="probar">Probar</button></div>
      <div class="nota">Partida de prueba con la historia justo antes de ese momento: no se guarda nada. Con N anotás lo que haya que cambiar. "Volver a la práctica" está abajo, en PROBAR UN MAPA.</div>`;
  };
  const poner2 = p => {
    if (!p || p.querySelector('#ckpe')) return;
    const d = document.createElement('div'); d.id = 'ckpe'; d.innerHTML = html();
    const info = p.querySelector('#ckpp-info'); if (info && info.nextSibling) p.insertBefore(d, info.nextSibling); else p.appendChild(d);
    const s = d.querySelector('#ckpe-ev'); if (s) s.addEventListener('change', () => { st.ev = +s.value; const q = d.parentNode; d.remove(); poner2(q); });
    d.querySelectorAll('[data-pe]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const S = escena(); if (!S || !S.player) return;
      if (b.dataset.pe === 'probar') probar(S, st.ev);
      try { b.blur(); S.game.canvas.focus(); } catch (er) {}
    }));
  };
  const mirarPanel = () => {
    const p = document.getElementById('ckpp');
    if (!p) { setTimeout(mirarPanel, 500); return; }
    poner2(p);
    new MutationObserver(() => { if (!p.querySelector('#ckpe')) poner2(p); }).observe(p, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mirarPanel); else mirarPanel();
  window.CK_PRUEBAS_EVENTOS = { EVENTOS, st, probar, aplicar };
})();
