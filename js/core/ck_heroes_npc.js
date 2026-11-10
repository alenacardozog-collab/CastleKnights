'use strict';
/* Los otros héroes (02/11, cambiado el 03/11 a pedido del dueño): los dos que no elegiste andan por el mundo, pero ya no
   están siempre en el mismo lugar: te los cruzás de casualidad y te piden ayuda con misiones secundarias.
   - ENCUENTROS: cada vez que entrás a una zona donde ese héroe puede andar en ese momento de la historia (ETAPAS),
     hay chance de que esté (60% si todavía no lo conocés, 40% después). Como mucho uno por zona. Si lo viste, por
     2 minutos no vuelve a aparecer en otro lado. A medida que avanza la historia cambian los lugares donde anda
     (Horos se va a las Torres de Escarcha después del epílogo, salvo que te deba una misión).
   - MISIONES (MISIONES): dos por héroe. Te la ofrece al hablarle (T) y la aceptás solo. Mientras la hacés, una línea
     chica en el pergamino del objetivo dice qué falta. Al terminarla, el héroe te espera en un lugar fijo (cita) hasta
     que vuelvas a cobrar.
       Lancent: el escudo de su padre (camino) · seis orcos en el Capítulo 2.
       Horos:   tres matas de ruda (camino) · las runas de tres lápidas de Brumavieja.
       Aby:     la medalla del abuelo (Brumavieja, por el molino) · una carta para la Abuela Mirta (aldea).
   - Un "!" chico arriba del héroe = tiene una misión para vos; "?" = ya la cumpliste, andá a cobrar.
   Borrar su línea de index.html los saca (y sus misiones). Usa ck_escenas.js; la carta para Mirta usa ck_gente.js. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype;
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const c2 = s => (s.flags && s.flags.c2) || 0;
  const Z = { patio: 'castle.training', camino: 'ed_camino_al_castillo.main', salon: 'ed_salon_del_trono_3.main', biblio: 'ed_biblioteca.main',
    ruinas: 'ruins.village', posada: 'ed_taberna_2.main', bosque: 'ed_bosque_de_la_frontera.main', aldea: 'village' };
  const NOMBRE = { soldier: 'Lancent, el caballero', wizard: 'Horos, el mago', swordsman: 'Aby, la espadachina' };
  const CORTO = { soldier: 'Lancent', wizard: 'Horos', swordsman: 'Aby' };
  const HEROES_ = ['soldier', 'wizard', 'swordsman'];
  const COOL = 120000;

  // lugares donde se los puede cruzar (pies del personaje, coordenadas de la zona; en la aldea, del mundo)
  const T = (z, x, y, o) => Object.assign({ z, x, y }, o || {});
  const SIT = {
    patio: T(Z.patio, 440, 165, { ensaya: true }), salon: T(Z.salon, 205, 235), biblio: T(Z.biblio, 110, 225), posada: T(Z.posada, 200, 240),
    puente: T(Z.camino, 1150, 460), fogon: T(Z.camino, 735, 420), fuente: T(Z.ruinas, 600, 470), tumba: T(Z.ruinas, 735, 240),
    carreta: T(Z.bosque, 600, 600), huellas: T(Z.bosque, 1000, 440),   // (10/11) bosque grande: junto a lo que quedó del mercader, en el campamento
    tablon: T(Z.aldea, 250, 245), plaza: T(Z.aldea, 470, 330), sur: T(Z.aldea, 380, 460), oeste: T(Z.aldea, 120, 365), norte: T(Z.aldea, 455, 200)
  };

  // por dónde anda cada uno según la historia, y qué cuenta si no tiene misión para darte
  const ETAPAS = {
    soldier: [
      { si: s => s.step <= 1 && !c2(s), sitios: [SIT.patio, SIT.tablon], l: [
        'Lancent, caballero. Sin tierras, sin escudero y sin un cobre, pero con buena espada.',
        'Llegué ayer con el mismo pergamino que vos. El Capitán dice que espere mi turno. A mí no me gusta esperar.'] },
      { si: s => s.step >= 2 && s.step <= 6 && !c2(s), sitios: [SIT.puente, SIT.plaza, SIT.patio], l: [
        'Ando de acá para allá cuidando lo que nadie cuida: puentes, cruces, gallineros.',
        'Si ves un lobizón con cara de vivo, ese es el jefe. Dale primero a ese.'] },
      { si: s => s.step >= 7 && !c2(s), sitios: [SIT.salon, SIT.patio, SIT.sur], l: [
        'Mientras vos le dabas al Nigromante, yo limpiaba la ruta del oeste de bandidos. No es lo mismo, ya sé.',
        'El Rey me ofreció tierras. Le dije que primero quiero ver qué hay en esas Torres de Escarcha.'] },
      { si: s => c2(s) >= 1 && c2(s) <= 2, sitios: [SIT.patio, SIT.plaza], l: [
        'Dicen que en la frontera del este andan orcos. Yo ya afilé la espada. Dos veces, por las dudas.'] },
      { si: s => c2(s) >= 3 && c2(s) <= 8, sitios: [SIT.carreta, SIT.plaza, SIT.patio], l: [
        'El mercader me contó lo de su hija. Yo le cuido la carreta; vos andá por los orcos.',
        'Si ves a Grushak, decile que hay un caballero esperándolo. Bueno, mejor no le digas nada.'] },
      { si: s => c2(s) >= 9, sitios: [SIT.patio, SIT.salon], l: [
        'Volviste de la frontera. Me alegra. Ahora el Rey quiere mandar a alguien al norte… adiviná a quién.'] }
    ],
    wizard: [
      { si: s => s.step <= 3 && !c2(s), sitios: [SIT.biblio, SIT.norte, SIT.posada], l: [
        'Horos. Mago, viejo y con poca paciencia, en ese orden.',
        'Eloy, el de la biblioteca, y yo estudiamos juntos hace cuarenta inviernos. Él se quedó con los libros; yo, con los caminos.',
        'Esta niebla ya la vi una vez, en el sur. Aquella vez tardamos tres lunas en sacarla.'] },
      { si: s => s.step >= 4 && s.step <= 6, sitios: [SIT.fuente, SIT.biblio], l: [
        'Brumavieja… La niebla allá es más espesa que en el sur. Alguien la alimenta desde la capilla.',
        'No entres a la capilla sin la llave del sepulturero. Y si podés, sin miedo. Lo segundo es más difícil.'] },
      { si: s => s.step >= 7 && !(s.flags && s.flags.epilogo), sitios: [SIT.posada, SIT.biblio, SIT.norte], l: [
        'Si el Nigromante tenía el Códice, alguien se lo dio. Esos libros no se encuentran en una feria.',
        'Me voy a las Torres de Escarcha a averiguar quién. Si no vuelvo en dos lunas, no me esperes: vení a buscarme.'] }
    ],
    swordsman: [
      { si: s => s.step <= 1 && !c2(s), sitios: [SIT.posada, SIT.oeste], l: [
        'Soy de Brumavieja. O era. La noche de las luces me salvé porque estaba en la feria del Roble.',
        'Si vas al castillo, decile al Rey que yo voy a Brumavieja con o sin su permiso.'] },
      { si: s => s.step >= 2 && s.step <= 3 && !c2(s), sitios: [SIT.fogon, SIT.posada, SIT.oeste], l: [
        'El buhonero dice que las luces de Brumavieja se ven todas las noches desde el cerro. Todas.',
        'Cuando termines con los lobos, avisame. Conozco un atajo a Brumavieja.'] },
      { si: s => s.step >= 4 && s.step <= 6, sitios: [SIT.tumba, SIT.oeste], l: [
        'Fui a ver la tumba de mi abuelo, en Brumavieja. Hasta los muertos se fueron de ahí.',
        'Si el esqueleto grande anda con la llave de la capilla, te ayudo. Pero el último golpe es tuyo: no quiero manchar el apellido.'] },
      { si: s => s.step >= 7 && c2(s) <= 2, sitios: [SIT.fuente, SIT.sur, SIT.posada], l: [
        'Brumavieja va a volver a tener gente. Yo voy a ser la primera.',
        'Tobías y yo empezamos a arreglar la fuente. Él dice que no hay apuro. Yo digo que sí.'] },
      { si: s => c2(s) >= 3 && c2(s) <= 8, sitios: [SIT.huellas, SIT.fuente], l: [
        'Los orcos que quemaron la carreta del mercader dejaron huellas hasta el bosque. Las vengo siguiendo desde Brumavieja.',
        'Los tótems marcan su tierra. De ahí para allá, cuidado: no avisan antes de tirar.'] },
      { si: s => c2(s) >= 9, sitios: [SIT.fuente, SIT.oeste], l: [
        'Ya hay tres familias viviendo en Brumavieja. Y una cabra. La cabra manda.'] }
    ]
  };

  // ------------------------------------------------------------------ misiones secundarias
  const MISIONES = [
    { id: 'escudo', h: 'soldier', titulo: 'El escudo de Lancent', si: s => s.step >= 2, tipo: 'buscar', icono: 'escudo',
      cosas: [T(Z.camino, 573, 570)], cita: SIT.puente, premio: { monedas: 30, xp: 40 },
      falta: () => 'Buscá el escudo en el camino del castillo, cerca del arroyo',
      ofrece: ['Che, ¿vos andás por el camino del castillo? Te pido un favor de caballero a… lo que seas.',
        'Peleando con un lobizón cerca del arroyo se me cayó el escudo de mi viejo. Redondo, con un roble pintado. Es lo único que me dejó.',
        'Si lo ves, traémelo. Yo voy a estar por el puente, mirando el agua como un sonso.'],
      recuerda: 'El escudo, ¿lo viste? Redondo, con un roble. En el camino, cerca del arroyo.',
      listo: 'Encontraste el escudo de Lancent. Te espera en el puente del camino.',
      gracias: ['¡Mi escudo! Mirá cómo lo dejó el barro… Igual se ve el roble.',
        'Mi viejo decía que un escudo sin dueño termina de leña. Gracias por no dejarlo hacer leña. Tomá, algo es algo.'] },
    { id: 'orcos', h: 'soldier', titulo: 'Seis orcos para Lancent', si: s => c2(s) >= 3, previa: 'escudo', tipo: 'matar', meta: 6, cual: t => /^orc/.test(t),
      cita: SIT.carreta, premio: { monedas: 60, xp: 80 },
      falta: e => `Derribá orcos en la frontera (${Math.min(e.n || 0, 6)}/6)`,
      ofrece: ['Los orcos de la frontera vienen de a cinco, como los dedos. El Rey quiere que alguien les baje los humos.',
        'Hagamos así: vos volteás seis orcos y yo cuido la carreta. Después partimos lo que pague el Rey. Bueno, te doy más a vos.'],
      recuerda: 'Seis orcos, ¿eh? No vale contar el mismo dos veces.',
      listo: 'Seis orcos menos. Lancent te espera junto a la carreta, en el bosque de la frontera.',
      gracias: ['¡Seis! Y yo acá cuidando una carreta que no se mueve. Tomá tu parte, que te la ganaste.',
        'Cuando lo cuenten en la pulpería van a decir que fueron veinte. Dejalos.'] },
    { id: 'ruda', h: 'wizard', titulo: 'Ruda para Horos', si: s => s.step >= 2, tipo: 'buscar', icono: 'ruda',
      cosas: [T(Z.camino, 250, 300), T(Z.camino, 980, 300), T(Z.camino, 870, 605)], cita: SIT.biblio, premio: { monedas: 25, xp: 40, inv: { elixir: 1 } },
      falta: e => `Juntá ruda macho en el camino del castillo (${(e.got || []).length}/3)`,
      ofrece: ['Vení, vení, que no muerdo. Bueno, a veces.',
        'Para el conjuro que espanta la niebla necesito ruda macho. Crece al costado del camino del castillo, donde pega el sol.',
        'Traeme tres matas. Y no las arranques con la mano izquierda, que pierden la fuerza. O eso decía mi maestra.'],
      recuerda: 'Tres matas de ruda, del camino del castillo. Con la derecha.',
      listo: 'Tenés las tres matas de ruda. Horos te espera en la biblioteca.',
      gracias: ['Ruda macho, fresquita. Ahora sí la niebla va a tener que pensarlo dos veces.',
        'Tomá: un elixir que hice con lo que sobró. Sabe a yuyo, pero levanta un muerto. Bueno, no literalmente.'] },
    { id: 'runas', h: 'wizard', titulo: 'Las runas de Brumavieja', si: s => s.step >= 4, previa: 'ruda', tipo: 'mirar',
      cosas: [T(Z.ruinas, 671, 178, { mx: 671, my: 128 }), T(Z.ruinas, 734, 178, { mx: 734, my: 106 }), T(Z.ruinas, 777, 178, { mx: 777, my: 114 })],
      cita: SIT.posada, premio: { monedas: 40, xp: 60 },
      falta: e => `Mirá las runas de las lápidas de Brumavieja (${(e.got || []).length}/3)`,
      ofrece: ['Las lápidas del cementerio de Brumavieja tienen runas que nadie talló. Aparecieron con la niebla.',
        'Andá y miralas: tres, con eso me alcanza. No las toques ni las leas en voz alta, por las dudas.'],
      recuerda: 'Tres lápidas de Brumavieja. Mirarlas nomás, ¿eh?',
      mirar: ['Las runas brillan apenas, como brasas bajo la ceniza. Las copiás en un papelito sin tocar la piedra.',
        'Otra lápida, otras runas. Estas parecen más nuevas. Las copiás debajo de las otras.',
        'La última. Las runas se apagan apenas terminás de copiarlas, como si supieran que ya las viste.'],
      listo: 'Copiaste las runas de tres lápidas. Horos te espera en la posada.',
      gracias: ['A ver… Esto no es lengua de muertos: es letra de vivo. Alguien escribió esto con pulso firme.',
        'Me lo guardo para las Torres de Escarcha. Tomá, por el mandado. Y lavate las manos.'] },
    { id: 'medalla', h: 'swordsman', titulo: 'La medalla del abuelo', si: s => s.step >= 4, tipo: 'buscar', icono: 'medalla',
      cosas: [T(Z.ruinas, 240, 470)], cita: SIT.tumba, premio: { monedas: 30, xp: 50 },
      falta: () => 'Buscá la medalla en Brumavieja, por el lado del molino',
      ofrece: ['Mi abuelo peleó en la guerra del río. Tenía una medalla con cinta celeste y blanca que no se sacaba ni para dormir.',
        'La niebla se llevó todo, pero capaz quedó en Brumavieja, por el lado del molino. Yo no puedo ir sin ponerme a llorar como una boba.',
        'Si la encontrás, traémela. Te espero en la tumba del abuelo, en el cementerio.'],
      recuerda: 'La medalla del abuelo: cinta celeste y blanca. Por el molino de Brumavieja.',
      listo: 'Encontraste la medalla del abuelo de Aby. Te espera en el cementerio de Brumavieja.',
      gracias: ['Es esta. Mirá la cinta, toda descolorida… como él al final.',
        'Gracias. De verdad. Tomá, no es mucho, pero es lo que había en la alcancía.'] },
    { id: 'carta', h: 'swordsman', titulo: 'Una carta para Mirta', si: s => s.step >= 5, previa: 'medalla', tipo: 'llevar', a: 'npc7',
      cita: SIT.posada, premio: { monedas: 35, xp: 50, inv: { potion: 2 } },
      falta: () => 'Llevale la carta de Aby a la Abuela Mirta, en la aldea',
      ofrece: ['La Abuela Mirta, la de la aldea, conocía a mi abuela Rosaura. Eran comadres.',
        'Le escribí una carta y no me animo a dársela. Llevásela vos, que tenés más cara.'],
      recuerda: 'La carta para la Abuela Mirta. Vive en la aldea; la vas a reconocer por el olor a tortas fritas.',
      mirta: ['¿Una carta? ¿Para mí? A ver, que me pongo los anteojos…',
        '¡La letra de la nieta de la Rosaura! Igualita a la abuela, con las colitas en las eles.',
        'Decile a la nena que la espero a tomar mate. Que no me haga esperar, que a mi edad uno no tiene tanto tiempo.'],
      listo: 'Mirta leyó la carta. Aby te espera en la posada.',
      gracias: ['¿Eso dijo? ¿Que vaya a tomar mate? …Bueno. Voy a ir.',
        'Tomá, para el camino. Y si ves a la Mirta antes que yo, decile que llevo bizcochitos.'] }
  ];
  const MIS = {}; MISIONES.forEach(m => { MIS[m.id] = m; });

  const ICONOS = {
    escudo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/UlEQVR4nMWTMWuDQBTHfwbJkCE4OJQgGV2adlMOCiGz9EP4kfoN6qdwdglILB1asziLZMggjlnSQZTzPEMhQ/7Lce/+73fv8e7gThm64PNqedXFj1Uz8pu6RC8IAfCFAOCQpq0hjq4qyJCTvSDEF4LF94e23OTSArM46iEz1dQlF2XNp2XytXUoyhqA3TwdQWfy7Z2hKGv2G5uX1ycA9ht7APGCsG/XHCEl/f6cAFpQftZ6Ri0AuI7Fm5TQgXSarMB1LMjPFFWDu1q2+/9WMIBI6yTgWDVGFkf9mG4puYjbY1Qh7/568gyUp6y+RFVZHNFVrAWoIFW6v/B4/QF+e137Fji8jwAAAABJRU5ErkJggg==',
    ruda: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA5ElEQVR4nLWSIQ7CQBREXwm6mlSSupIGTXDYCmo4ACfoUXqCHgBDBRZH0E0BRxCIBt0LFEG23d0uCwJGbbJ5M/N/PvxLgec2preuwTt4v5ko4OMwa0xGRoNLVTuL1ZlLVTu29J5B4LltioD9JARgND86VoPAc5s4i4izqDez3ET/UxqcyjsAfhIaF2cKGMoppGVD0gF+ElLkN8VEhAj15hLuYnaAIr8xXY4BuKblK0xvIMNxFgGwXe9ao2tadk0lDWVYgHpNZUxNSgMZFIk2WDFol6hBPlgPSWmgp3y6wq/0ExObnlo7ay6Ni18jAAAAAElFTkSuQmCC',
    medalla: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmUlEQVR4nGNgoBAwogtoS/H9x6fh6rNPGHowDCjZ/OD/nTc/MGhshjOR7GZiADZXEPIaXkPwacYaINg04Ao8rLGQH8DH4OGtgCK+Y+sDhokbPmEYxIRLs4i6HYOIuh1czsNbgSE/gA/DdVhjQUTdjuHNzUMMb24egtuOC2A1AKaRGMCCTxJmM3p4IAOKA5HoaGRgICIfDAgAAEs8ZI1WNgjvAAAAAElFTkSuQmCC'
  };

  // ------------------------------------------------------------------ estado (en story.flags, se guarda con la partida)
  const est = (S, id) => {
    const f = (S.story.flags = S.story.flags || {});
    f.sq = f.sq || {};
    return f.sq[id];
  };
  const poner_est = (S, id, e) => { est(S, id); S.story.flags.sq[id] = e; return e; };
  const hecha = (S, id) => { const e = est(S, id); return !!(e && e.e === 'hecha'); };
  /** La misión de ese héroe que está en curso, o la próxima que puede ofrecer. */
  const misionDe = (S, h) => {
    if (!S || !S.story) return null;
    for (const m of MISIONES) {
      if (m.h !== h) continue;
      const e = est(S, m.id);
      if (e && (e.e === 'activa' || e.e === 'lista')) return { m, e };
    }
    for (const m of MISIONES) {
      if (m.h !== h || est(S, m.id)) continue;
      if (m.previa && !hecha(S, m.previa)) continue;
      if (m.si(S.story)) return { m, e: null };
    }
    return null;
  };
  const enCurso = S => MISIONES.filter(m => { const e = S && S.story && est(S, m.id); return e && (e.e === 'activa' || e.e === 'lista'); });
  const siguen = (S, h) => {
    if (!(h === 'wizard' && S.story && S.story.flags && S.story.flags.epilogo)) return true;
    return enCurso(S).some(m => m.h === h);   // Horos no se va a las Torres si te debe algo
  };
  const etapa = (S, h) => (S && S.story ? ETAPAS[h].find(r => r.si(S.story)) || null : null);
  const disponibles = S => (S && S.story && S._gameMode === 'campaign' ? HEROES_.filter(h => h !== S.playerHero && siguen(S, h)) : []);

  const nota = txt => {
    const api = window.CK_SIN_CARTELES_API;
    if (api && api.nota) api.nota(txt);
    else { const S = escena(); if (S && S.player) S.createFloatingText(S.player.x, S.player.y - 40, txt, 0xfde68a); }
  };
  const guardar = S => { try { if (S.updateObjective) S.updateObjective(); if (S.saveStory) S.saveStory(); } catch (e) {} };
  const cumplir = (S, m) => {
    const e = est(S, m.id);
    if (!e || e.e !== 'activa') return;
    e.e = 'lista';
    try { sfx.fx('page_flip', 0.6, { rate: 0.9 }); } catch (er) {}
    nota(m.listo);
    guardar(S);
  };
  const premiar = (S, m) => {
    const e = est(S, m.id); if (!e) return;
    e.e = 'hecha';
    const pr = m.premio || {};
    let t = [];
    if (pr.monedas) { S.story.coins += pr.monedas; t.push(`+${pr.monedas} monedas`); try { sfx.fx('coin', 0.5); } catch (er) {} }
    if (pr.inv) {
      S.story.inv = S.story.inv || {};
      Object.keys(pr.inv).forEach(k => { S.story.inv[k] = (S.story.inv[k] || 0) + pr.inv[k]; t.push(`+${pr.inv[k]} ${k === 'elixir' ? 'elixir' : pr.inv[k] > 1 ? 'pociones' : 'poción'}`); });
    }
    if (S.player && t.length) S.createFloatingText(S.player.x + 16, S.player.y - 30, t.join(' · '), 0xfcd34d);
    if (pr.xp && S.gainXP) S.gainXP(pr.xp);
    try { if (S.updateQuickBar) S.updateQuickBar(); if (S.updateHUD) S.updateHUD(); } catch (er) {}
    nota('Misión cumplida: ' + m.titulo);
    guardar(S);
  };
  const aceptar = (S, m) => {
    if (est(S, m.id)) return;
    poner_est(S, m.id, { e: 'activa', n: 0, got: [] });
    try { sfx.fx('page_flip', 0.6); } catch (er) {}
    nota('Misión secundaria: ' + m.titulo);
    guardar(S);
    S._ckCosasFirma = '';   // que aparezcan ya las cosas a buscar si están en esta zona
  };

  // ------------------------------------------------------------------ hablarles
  HEROES_.forEach(h => {
    const enc = () => { const S = escena(); const o = S && S._ckEnc && S._ckEnc.lista.find(x => x.h === h); return o && S._ckEnc.zona === S.currentZoneKey() ? o : null; };
    STORY_NPCS.push({
      id: 'h_' + h, r: 34, name: NOMBRE[h], face: h + '_idle',
      get zone() { const o = enc(); return o ? o.sitio.z : '-'; },
      get x() { const o = enc(); return o ? o.sitio.x : -99999; },
      get y() { const o = enc(); return o ? o.sitio.y - 6 : -99999; },
      lines: () => {
        const S = escena();
        S._ckHeroeAccion = null;
        const f = (S.story.flags = S.story.flags || {}), r = etapa(S, h) || { l: ['…'] };
        const q = misionDe(S, h);
        const conocido = !!f['hn_' + h];
        f['hn_' + h] = 1;
        if (q && q.e && q.e.e === 'lista') { S._ckHeroeAccion = { h, tipo: 'premio', m: q.m }; return q.m.gracias; }
        if (q && q.e && q.e.e === 'activa') return [q.m.recuerda];
        if (q && !q.e) { S._ckHeroeAccion = { h, tipo: 'aceptar', m: q.m }; return (conocido ? [] : [r.l[0]]).concat(q.m.ofrece); }
        const k = 'hn_' + h + '_' + ETAPAS[h].indexOf(r);
        if (!f[k]) { f[k] = 1; return r.l; }
        f[k]++;
        return [r.l[(f[k] - 2) % r.l.length]];
      }
    });
  });

  // las lápidas de las runas (se miran con T)
  MIS.runas.cosas.forEach((c, i) => {
    STORY_NPCS.push({
      id: 'mq_runas_' + i, r: 30, name: 'Lápida', etiqueta: 'Mirar la lápida', face: null,
      get zone() { const S = escena(), e = S && S.story && est(S, 'runas'); return e && e.e === 'activa' && !(e.got || []).includes(i) ? c.z : '-'; },
      x: c.x, y: c.y,
      lines: () => { const S = escena(), e = est(S, 'runas'); return [MIS.runas.mirar[Math.min((e.got || []).length, 2)]]; }
    });
  });

  // la carta: hablar con la Abuela Mirta mientras la llevás
  const mirta = STORY_NPCS.find(n => n.id === 'g_npc7');
  if (mirta) {
    const l0 = mirta.lines;
    mirta.lines = function () {
      const S = escena(), e = S && S.story && est(S, 'carta');
      if (e && e.e === 'activa') { S._ckCartaMirta = true; return MIS.carta.mirta; }
      return l0.apply(this, arguments);
    };
  }

  const hablado0 = P.onTalked;
  P.onTalked = function (id) {
    try {
      if (typeof id === 'string' && id.indexOf('h_') === 0) {
        const a = this._ckHeroeAccion; this._ckHeroeAccion = null;
        if (a && 'h_' + a.h === id) { if (a.tipo === 'aceptar') aceptar(this, a.m); else premiar(this, a.m); }
        else guardar(this);
        return;
      }
      if (typeof id === 'string' && id.indexOf('mq_runas_') === 0) {
        const i = +id.slice(9), e = est(this, 'runas');
        if (e && e.e === 'activa' && !(e.got = e.got || []).includes(i)) {
          e.got.push(i);
          try { sfx.fx('page_flip', 0.5, { rate: 1.2 }); } catch (er) {}
          if (e.got.length >= MIS.runas.cosas.length) cumplir(this, MIS.runas); else guardar(this);
        }
        return;
      }
      if (id === 'g_npc7' && this._ckCartaMirta) { this._ckCartaMirta = false; cumplir(this, MIS.carta); }
    } catch (er) { console.warn('[héroes npc]', er); }
    return hablado0 ? hablado0.apply(this, arguments) : undefined;
  };

  // contar orcos
  const derrota0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = derrota0 ? derrota0.apply(this, arguments) : undefined;
    try {
      if (this._gameMode === 'campaign' && this.story && enemy) {
        MISIONES.forEach(m => {
          if (m.tipo !== 'matar') return;
          const e = est(this, m.id);
          if (!e || e.e !== 'activa' || !m.cual(enemy.type || '')) return;
          e.n = (e.n || 0) + 1;
          if (e.n >= m.meta) cumplir(this, m); else if (this.updateObjective) this.updateObjective();
        });
      }
    } catch (er) { console.warn('[héroes npc]', er); }
    return r;
  };

  // ------------------------------------------------------------------ línea chica en el pergamino del objetivo
  const css = () => {
    if (document.getElementById('ck-sq-css')) return;
    const st = document.createElement('style'); st.id = 'ck-sq-css';
    st.textContent = `#ck-objective .ck-obj-side { margin: 5px 0 3px; font-size: 13px; line-height: 1.2; font-weight: 600; color: #5a3a24; font-family: var(--ck2-f, inherit); }
#ck-objective .ck-obj-side:empty { display: none; }
#ck-objective .ck-obj-side div::before { content: '◆ '; color: #8a5a2c; }`;
    document.head.appendChild(st);
  };
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const box = document.getElementById('ck-objective');
      if (box && this.story && this._gameMode === 'campaign') {
        css();
        let el = box.querySelector('.ck-obj-side');
        if (!el) { el = document.createElement('div'); el.className = 'ck-obj-side'; box.insertBefore(el, box.querySelector('.ck-obj-purse')); }
        const txt = enCurso(this).map(m => { const e = est(this, m.id); return e.e === 'lista' ? `Volvé con ${CORTO[m.h]}: ${m.titulo}` : m.falta(e); });
        const html = txt.map(t => `<div>${t}</div>`).join('');
        if (el.innerHTML !== html) el.innerHTML = html;
      }
    } catch (er) {}
    return r;
  };

  // ------------------------------------------------------------------ que se vean (encuentros)
  const decidir = (S, zona) => {
    const out = [], now = S.time.now, vistos = (S._ckHeroeVisto = S._ckHeroeVisto || {});
    disponibles(S).forEach(h => {
      const q = misionDe(S, h);
      if (q && q.e && q.e.e === 'lista' && q.m.cita.z === zona) out.push({ h, sitio: q.m.cita });
    });
    if (out.length) return out;
    const cand = disponibles(S).map(h => [h, etapa(S, h)]).filter(([h, e]) => e && e.sitios.some(t => t.z === zona));
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    for (const [h, e] of cand) {
      if (S._ckHeroesForzar !== h) {
        if (S._ckHeroesForzar) continue;
        if (vistos[h] && now - vistos[h] < COOL) continue;
        if (Math.random() > (S.story.flags['hn_' + h] ? 0.4 : 0.6)) continue;
      }
      const ss = e.sitios.filter(t => t.z === zona);
      out.push({ h, sitio: ss[Math.floor(Math.random() * ss.length)] });
      break;
    }
    return out;
  };

  const quitar = S => {
    (S._ckHeroesNpc || []).forEach(o => { try { o.sp.destroy(); o.zona.destroy(); if (o.col) o.col.destroy(); if (o.marca) o.marca.destroy(); } catch (e) {} });
    S._ckHeroesNpc = [];
  };
  const poner = (S, h, sitio) => {
    const a = S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 };
    const k = h + '_idle', an = S.anims.get(k);
    if (!an || !an.frames.length || !S.player || !S.player.body) return null;
    const pl = S.player, dx = pl.body.center.x - pl.x, dy = pl.body.bottom - pl.y;
    const sp = S.add.sprite(a.x + sitio.x - dx, a.y + sitio.y - dy, an.frames[0].textureKey, an.frames[0].frame.name)
      .setOrigin(pl.originX, pl.originY).setScale(pl.scaleX).setDepth(a.y + sitio.y);
    sp.play(k);
    const zona = S.add.zone(a.x + sitio.x, a.y + sitio.y - 4, 16, 8);
    S.physics.add.existing(zona, true);
    const col = S.physics.add.collider(S.player, zona);
    const marca = S.add.text(a.x + sitio.x, a.y + sitio.y - 44, '!', { fontFamily: 'MedievalSharp, monospace', fontSize: '15px', fontStyle: 'bold', fill: '#fde047', stroke: '#3b2a05', strokeThickness: 4 })
      .setOrigin(0.5, 1).setDepth(29400).setResolution(3).setVisible(false);
    S.tweens.add({ targets: marca, y: marca.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { h, sitio, sp, zona, col, marca, t: Math.random() * 3000 };
  };

  // las cosas para buscar (escudo, ruda, medalla) y el brillito de las lápidas
  const texturas = S => {
    let listo = true;
    Object.keys(ICONOS).forEach(k => {
      const key = 'ck_sq_' + k;
      if (!ICONOS[k] || S.textures.exists(key)) return;
      listo = false;
      if (!S._ckSqCargando) S._ckSqCargando = {};
      if (!S._ckSqCargando[k]) { S._ckSqCargando[k] = 1; S.textures.addBase64(key, ICONOS[k]); }
    });
    if (!S.textures.exists('ck_sq_brillo')) {
      const g = S.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xfff3b0, 1); g.fillRect(3, 0, 1, 7); g.fillRect(0, 3, 7, 1); g.fillStyle(0xffffff, 1); g.fillRect(2, 2, 3, 3);
      g.generateTexture('ck_sq_brillo', 7, 7); g.destroy();
    }
    return listo;
  };
  const quitarCosas = S => {
    (S._ckCosas || []).forEach(o => { try { S.tweens.killTweensOf(o.objs); o.objs.forEach(x => x.destroy()); } catch (e) {} });
    S._ckCosas = []; S._ckCosasFirma = '';
  };
  const cosas = S => {
    const zona = S.currentZoneKey ? S.currentZoneKey() : '';
    const quiero = [];
    MISIONES.forEach(m => {
      if (m.tipo !== 'buscar' && m.tipo !== 'mirar') return;
      const e = est(S, m.id);
      if (!e || e.e !== 'activa') return;
      m.cosas.forEach((c, i) => { if (c.z === zona && !(e.got || []).includes(i)) quiero.push([m, i, c]); });
    });
    const firma = zona + '|' + quiero.map(([m, i]) => m.id + i).join(',');
    if (firma === S._ckCosasFirma) return;
    if (!texturas(S)) return;
    quitarCosas(S);
    S._ckCosasFirma = firma;
    const a = S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 };
    S._ckCosas = quiero.map(([m, i, c]) => {
      const objs = [];
      const bx = a.x + (c.mx !== undefined ? c.mx : c.x), by = a.y + (c.my !== undefined ? c.my : c.y);
      if (m.tipo === 'buscar') {
        const it = S.add.image(a.x + c.x, a.y + c.y - 6, 'ck_sq_' + m.icono).setOrigin(0.5, 1).setDepth(a.y + c.y - 1);
        S.tweens.add({ targets: it, y: it.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        objs.push(it);
      }
      const br = S.add.image(bx + 5, by - 14, 'ck_sq_brillo').setDepth(a.y + c.y + 1).setAlpha(0);
      S.tweens.add({ targets: br, alpha: 1, scale: 1.3, duration: 500, yoyo: true, repeat: -1, repeatDelay: 900, ease: 'Sine.easeInOut' });
      objs.push(br);
      return { m, i, c, x: a.x + c.x, y: a.y + c.y, objs };
    });
  };
  const levantar = S => {
    if (!S._ckCosas || !S._ckCosas.length || !S.player || !S.player.body || S.dialogOpen) return;
    const b = S.player.body;
    S._ckCosas.slice().forEach(o => {
      if (o.m.tipo !== 'buscar') return;
      if (Phaser.Math.Distance.Between(b.center.x, b.bottom, o.x, o.y) > 18) return;
      const e = est(S, o.m.id);
      if (!e || e.e !== 'activa') return;
      (e.got = e.got || []).push(o.i);
      try { sfx.fx('coin', 0.45, { rate: 0.8 }); } catch (er) {}
      const nombre = { escudo: 'El escudo de Lancent', ruda: 'Ruda macho', medalla: 'La medalla del abuelo' }[o.m.icono] || o.m.titulo;
      S.createFloatingText(o.x, o.y - 24, nombre, 0xfde68a);
      S.tweens.killTweensOf(o.objs); o.objs.forEach(x => x.destroy());
      S._ckCosas = S._ckCosas.filter(x => x !== o);
      S._ckCosasFirma = S._ckCosasFirma.replace(o.m.id + o.i, '·');
      if (e.got.length >= o.m.cosas.length) cumplir(S, o.m); else guardar(S);
    });
  };

  const repasar = S => {
    const zona = S.currentZoneKey ? S.currentZoneKey() : '';
    if (!S._ckEnc || S._ckEnc.zona !== zona) {
      if (S._ckEnc) S._ckEnc.lista.forEach(o => { (S._ckHeroeVisto = S._ckHeroeVisto || {})[o.h] = S.time.now; });
      quitar(S);
      S._ckEnc = { zona, lista: decidir(S, zona) };
    } else {
      // terminaste la misión acá mismo: el héroe aparece en la cita si es en esta zona
      disponibles(S).forEach(h => {
        if (S._ckEnc.lista.some(o => o.h === h)) return;
        const q = misionDe(S, h);
        if (q && q.e && q.e.e === 'lista' && q.m.cita.z === zona && !S._ckEnc.lista.some(o => o.sitio === q.m.cita)) S._ckEnc.lista.push({ h, sitio: q.m.cita });
      });
      S._ckEnc.lista = S._ckEnc.lista.filter(o => disponibles(S).includes(o.h));
    }
    const hay = S._ckHeroesNpc || [];
    const igual = hay.length === S._ckEnc.lista.length && S._ckEnc.lista.every(o => hay.some(x => x.h === o.h && x.sitio === o.sitio && x.sp.active));
    if (!igual && !S._doorTransition) {
      quitar(S);
      S._ckHeroesNpc = S._ckEnc.lista.map(o => poner(S, o.h, o.sitio)).filter(Boolean);
    }
    (S._ckHeroesNpc || []).forEach(o => {
      const q = misionDe(S, o.h);
      const m = q && (!q.e ? '!' : q.e.e === 'lista' ? '?' : '');
      o.marca.setText(m || '!').setVisible(!!m);
    });
    cosas(S);
  };

  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    P[k] = function () {
      const r = f0 ? f0.apply(this, arguments) : undefined;
      try { quitar(this); quitarCosas(this); this._ckHeroesT = 9999; } catch (e) {}
      return r;
    };
  });
  const fin0 = P.endStory;
  P.endStory = function () { try { quitar(this); quitarCosas(this); this._ckEnc = null; } catch (e) {} return fin0 ? fin0.apply(this, arguments) : undefined; };
  const upd0 = P.update;
  P.update = function () {
    const res = upd0.apply(this, arguments);
    if (this._gameMode !== 'campaign' || !this.story) return res;
    try {
      const dt = this.game.loop.delta;
      this._ckHeroesT = (this._ckHeroesT || 0) + dt;
      if (this._ckHeroesT > 700 && !this._doorTransition) { this._ckHeroesT = 0; repasar(this); }
      levantar(this);
      (this._ckHeroesNpc || []).forEach(o => {
        if (!o.sp.active || !this.player) return;
        const cerca = Phaser.Math.Distance.Between(o.sp.x, o.sp.y, this.player.x, this.player.y) < 90;
        if (cerca) o.sp.setFlipX(this.player.x < o.sp.x);
        // Lancent practica con el muñeco cuando no lo miran
        if (o.sitio.ensaya && !cerca) {
          o.t -= dt;
          const golpe = o.h + '_attack1';
          if (o.t <= 0 && this.anims.exists(golpe)) {
            o.t = 2200 + Math.random() * 2500;
            o.sp.setFlipX(false);
            o.sp.play(golpe);
            o.sp.once('animationcomplete', () => o.sp.active && o.sp.play(o.h + '_idle'));
          }
        }
      });
    } catch (e) { console.warn('[héroes npc]', e); }
    return res;
  };

  window.CK_HEROES_NPC = { ETAPAS, MISIONES, SIT, misionDe, enCurso, etapa, siguen: (S, h) => siguen(S, h),
    actual: (S, h) => { const o = S && S._ckEnc && S._ckEnc.lista.find(x => x.h === h); return o ? o.sitio : null; } };
})();
