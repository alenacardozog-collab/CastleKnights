/* PRUEBAS DEL JUEGO: se abren con doble clic en pruebas.html (que abre index.html?pruebas=1).
   Recorren el juego solas: campaña, noche, taberna, castillo, ruinas y práctica, y revisan música, ambiente,
   eco por lugar, pasos, puertas, voces de diálogo y efectos con contorno. No guardan partida ni tocan nada.
   Necesitan un clic al empezar (el navegador no deja sonar audio sin un clic). Resultado en window.__resultado. */
'use strict';
(function () {
  if (!/[?&]pruebas=1/.test(location.search)) return;
  const lista = [], errores = [];
  const prueba = (nombre, fn) => lista.push({ nombre, fn });
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumplió'); };
  let actual = '';   // la prueba que está corriendo: cada error dice en cuál pasó
  window.addEventListener('error', e => errores.push((actual ? '[' + actual.slice(0, 40) + '] ' : '') + e.message));
  const escena = () => game.scene.scenes.find(s => s.startCampaign);
  const S = () => window.CK_SONIDO || {};
  const hasta = async (cond, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await esperar(80); } return false; };
  const sonaron = desde => (S().log || []).slice(desde);

  prueba('El juego arranca y la campaña empieza', async () => { const s = escena(); ok(s, 'no está la escena principal'); s.startCampaign(); ok(await hasta(() => s._gameMode === 'campaign' && s.player), 'no arrancó la campaña'); await esperar(800); });
  prueba('Música de la aldea (día) y de noche', async () => {
    const s = escena(); s.dayClock = 0.1 * 300000; ok(await hasta(() => s._zoneMusic === 'village'), 'de día no suena la aldea (' + s._zoneMusic + ')');
    s.dayClock = 0.7 * 300000; ok(await hasta(() => s._zoneMusic === 'noche'), 'de noche no cambia a "noche"'); s.dayClock = 0.1 * 300000; await hasta(() => s._zoneMusic === 'village');
  });
  prueba('Archivos de música cargados', async () => { const E = music.audioElements, faltan = ['village', 'intro', 'castle', 'ruins', 'boss', 'taberna', 'noche', 'practica'].filter(k => !E[k] || E[k].error); ok(!faltan.length, 'no cargan: ' + faltan.join(', ')); });
  prueba('Sonido del Taller listo (54 sonidos)', async () => { ok(await hasta(() => S().listo, 6000), 'no terminó de cargar'); ok(Object.keys(S().buf).length >= 50, 'faltan sonidos: ' + Object.keys(S().buf || {}).length); });
  prueba('Voz y pluma al hablar con un NPC', async () => {
    const s = escena(), d = (S().log || []).length; s.openDialog('Rey Aldric', ['Bienvenido a mi reino, valiente guerrero. Hay mucho por hacer en estas tierras.'], null, 'king_idle'); await esperar(1500);
    const l = sonaron(d); ok(l.some(n => n === 'voz_rey'), 'no sonó la voz del rey'); ok(l.filter(n => n.indexOf('pluma') === 0).length > 3, 'casi no sonó la pluma');
    s._dlg.shown = 999; s._dlg.at = 0; s.advanceDialog(); await esperar(300); ok(!s._dlg, 'el diálogo no cerró'); s.dialogOpen = false;
  });
  prueba('Casa grande: ajustes viejos del Estudio no la agrandan y se entra por la puerta', async () => {
    const s = escena(), casa = s.campaignObjectSprites.find(o => o.texture && /House_Hay_3/.test(o.texture.key));
    ok(casa, 'no encontré la casa');
    s.studioProps(); const z = s.studioZone(), prev = z.moves[casa._sid];
    z.moves[casa._sid] = { s: 1.6, dx: -40, dy: 10 }; s.studioApplyMoves();
    const bien = casa.scaleX === 1 && casa.x === casa._st0.x;
    if (prev) z.moves[casa._sid] = prev; else delete z.moves[casa._sid]; s.studioApplyMoves();
    ok(bien, 'la casa quedó escalada o corrida: ' + casa.scaleX);
    const puerta = s.doorSprites.find(d => d._interiorKind === 'casa');
    s.enterInterior(puerta); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === 'casa'), 'no entró a la casa');
    await hasta(() => !s._doorTransition); s.switchInteriorArea('upper'); ok(await hasta(() => s.currentInterior.areaName === 'upper'), 'no subió a los cuartos');
    await hasta(() => !s._doorTransition); s.exitInterior(); ok(await hasta(() => !s.currentInterior, 6000), 'no salió'); await esperar(400);
  });
  prueba('Taberna: puertas, música, ambiente y eco', async () => {
    const s = escena(), d = (S().log || []).length, puerta = s.children.list.find(o => o._interiorKind === 'bar'); ok(puerta, 'no encontré la puerta de la taberna');
    const tab = window.CK_SALA_ED && window.CK_SALA_ED.ed_taberna_2 ? 'ed_taberna_2' : 'bar'; // la taberna nueva del Taller, si está
    s.enterInterior(puerta); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === tab), 'no entró'); await esperar(600);
    ok(s._zoneMusic === 'taberna', 'música: ' + s._zoneMusic); ok(S().sala === 'taberna', 'eco: ' + S().sala); ok(ambience.want.amb_taberna > 0, 'sin ambiente de taberna');
    const l = sonaron(d); ok(l.includes('puerta_abre') && l.includes('puerta_cierra'), 'no sonaron las puertas');
    await hasta(() => !s._doorTransition); s.exitInterior(); ok(await hasta(() => !s.currentInterior), 'no salió'); await esperar(500);
  });
  prueba('Castillo: salón del trono con eco grande y pasos de piedra', async () => {
    const s = escena(); s.enterCastle(); ok(await hasta(() => s.currentInterior && !s._doorTransition && /^(castle|ed_camino_al_castillo)$/.test(s.currentInterior.building.kind)), 'no entró al castillo'); await esperar(500);
    s.switchInteriorArea('courtyard'); await hasta(() => s.currentInterior.areaName === 'courtyard' && !s._doorTransition); await esperar(500); s.switchInteriorArea('throne'); ok(await hasta(() => s.currentInterior.areaName === 'throne' || s.currentZoneKey() === 'ed_salon_del_trono_3.main'), 'no llegó al salón'); await esperar(500);
    ok(S().sala === 'salon', 'eco: ' + S().sala); ok(s._zoneMusic === 'castle', 'música: ' + s._zoneMusic);
    const d = (S().log || []).length; sfx.fx('step_stone1', 0.5); ok(sonaron(d).some(n => n.indexOf('step_stone_') === 0), 'el paso de piedra no usa los sonidos nuevos');
  });
  prueba('Camino nuevo al castillo: el puente baja, el portón lleva al patio y el patio vuelve al puente', async () => {
    const s = escena(); if (!window.CK_CAMINO) return;
    for (let i = 0; i < 3 && s.currentInterior; i++) { await hasta(() => !s._doorTransition); s.exitInterior(); await esperar(900); await hasta(() => !s._doorTransition); }
    ok(!s.currentInterior, 'no volvió a la aldea');
    s.enterCastle(); ok(await hasta(() => s.currentZoneKey() === CK_CAMINO.ZONA && !s._doorTransition && s._ckPuente), 'no llegó al camino nuevo'); await esperar(300);
    ok(s._ckPuente.t === 0 && s._ckPuente.blocker.body.enable, 'el puente no empieza alzado');
    const a = s.currentInterior.area; s.player.body.reset(a.x + 1189, a.y + 448);
    ok(await hasta(() => s._ckPuente && s._ckPuente.t === 1, 4000), 'el puente no bajó'); ok(!s._ckPuente.blocker.body.enable, 'el puente bajó pero sigue bloqueado');
    s.switchInteriorArea('courtyard'); ok(await hasta(() => s.currentZoneKey() === 'castle.courtyard' && !s._doorTransition), 'el portón no lleva al patio'); await esperar(300);
    s.switchInteriorArea('road'); ok(await hasta(() => s.currentZoneKey() === CK_CAMINO.ZONA && !s._doorTransition), 'el patio no vuelve al camino'); await esperar(300);
    const b = s.player.body, c = s.currentInterior.area; ok(Math.abs(b.center.x - c.x - 1189) < 20, 'no quedó frente al puente');
  });
  prueba('Salón nuevo: el Rey espera sentado, se levanta al hablarle y sale al patio', async () => {
    const s = escena(); if (!(window.CK_SALA_ED && window.CK_SALA_ED.ed_salon_del_trono_3)) return;
    if (s.currentZoneKey() !== 'ed_salon_del_trono_3.main') { s.enterCastle(); await hasta(() => s.currentInterior && !s._doorTransition); await esperar(300); s.switchInteriorArea('courtyard'); await hasta(() => s.currentInterior.areaName === 'courtyard' && !s._doorTransition); await esperar(300); s.switchInteriorArea('throne'); }
    ok(await hasta(() => s.currentZoneKey() === 'ed_salon_del_trono_3.main' && s._ckRey), 'no llegó al salón nuevo'); await esperar(400);
    ok(s._ckRey.estado === 'sentado', 'el Rey no está sentado: ' + s._ckRey.estado);
    const a = s.currentInterior.area; s.player.body.reset(a.x + 240, a.y + 128); await esperar(300);
    s.interact(); ok(s.dialogOpen, 'no se abrió la charla'); ok(await hasta(() => s._ckRey.estado === 'hablando', 4000), 'no se levantó');
    for (let i = 0; i < 12 && s.dialogOpen; i++) { s.interact(); await esperar(250); }
    ok(await hasta(() => s._ckRey.estado === 'paseando'), 'no salió a caminar');
    s.player.body.reset(a.x + 240, a.y + 562); ok(await hasta(() => s.currentZoneKey() === 'castle.courtyard', 6000), 'la salida no lleva al patio'); await esperar(400);
    await hasta(() => !s._doorTransition); s.exitInterior(); await hasta(() => !s.currentInterior, 6000); await esperar(400);
  });
  prueba('Aldea viva: caminos a las puertas, la taberna por dentro y huida de una bestia', async () => {
    const s = escena(); if (!window.CK_VIDA) return;
    if (s.currentInterior) { s.exitInterior(); await hasta(() => !s.currentInterior, 6000); await esperar(400); }
    const V = window.CK_VIDA, G = V.grillaAldea(s), bar = s.doorSprites.find(d => d._interiorKind === 'bar');
    ok(s.doorSprites.every(d => V.camino(G, 305, 509, d.x, d.y + 12)), 'hay una puerta a la que no se llega caminando');
    const n = s.campaignNPCs.find(x => x.id === 'npc10'); n.vida.prox = 1e12;
    Object.assign(n.vida, { modo: 'ir', ruta: V.camino(G, n.sprite.x, n.sprite.y, bar.x, bar.y + 12), i: 0, puerta: bar, motivo: 'taberna', vel: 140 });
    ok(await hasta(() => n.vida.modo === 'adentro', 8000), 'no llegó a la taberna');
    s.enterInterior(bar); ok(await hasta(() => s.currentInterior && n._ckDentro, 5000), 'no se lo ve adentro de la taberna');
    n.vida.hasta = 0; ok(await hasta(() => n.vida.modo === 'volver', 4000), 'no salió de la taberna');
    await hasta(() => !s._doorTransition); s.exitInterior(); await hasta(() => !s.currentInterior, 6000); await esperar(500);
    const m = s.campaignNPCs.find(x => x.vida && x.vida.modo === 'ruta' && x.id !== 'npc2'); ok(m, 'no hay aldeanos en su ruta');
    const e = s.spawnEnemy(m.sprite.x + 60, m.sprite.y - 26, 'slime'); ok(await hasta(() => m.vida.modo === 'ir' && m.vida.motivo === 'refugio', 3000), 'el aldeano no huyó de la bestia');
    if (e) e.destroy();
  });
  prueba('Ruinas: música, viento y eco', async () => {
    const s = escena(); s.currentInterior = null; s.enterRuins(); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === 'ruins'), 'no entró a las ruinas'); await esperar(600);
    ok(s._zoneMusic === 'ruins', 'música: ' + s._zoneMusic); ok(S().sala === 'ruinas', 'eco: ' + S().sala); ok(ambience.want.amb_ruinas > 0, 'sin viento de ruinas');
  });
  prueba('Práctica: música y ambiente de campo', async () => { const s = escena(); s.startPractice(); ok(await hasta(() => s._zoneMusic === 'practica'), 'música: ' + s._zoneMusic); ok(await hasta(() => ambience.want.amb_aldea_dia > 0), 'sin ambiente'); });
  prueba('Efectos con contorno (ck_fx)', async () => {
    const f = Object.assign(JSON.parse(JSON.stringify(CKFx.plantillas.humo)), { contorno: { grosor: 2, color: '#ff00ff' } }), s = CKFx.crear(f, { semilla: 3 }); for (let i = 0; i < 60; i++) s.paso(1 / 60);
    const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d'); s.dibujar(x, 60, 90, null); const d = x.getImageData(0, 0, 120, 120).data; let m = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200) m++; ok(m > 20, 'no se ve el contorno');
  });
  prueba('Eventos por cuadro de una animación del editor (sonido y golpe)', async () => {
    const s = escena(), c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d');
    for (let i = 0; i < 4; i++) { x.fillStyle = ['#c33', '#3c3', '#33c', '#cc3'][i]; x.fillRect(i * 16 + 2, 2, 12, 12); }
    if (!s.textures.exists('ed_prueba_ev')) s.textures.addSpriteSheet('ed_prueba_ev', c, { frameWidth: 16, frameHeight: 16 });
    if (!s.anims.exists('ed_prueba_ev')) s.anims.create({ key: 'ed_prueba_ev', frames: s.anims.generateFrameNumbers('ed_prueba_ev', { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
    CK_EDITOR.datos.eventos = Object.assign(CK_EDITOR.datos.eventos || {}, { ed_prueba_ev: [null, [{ t: 'golpe' }], [{ t: 'sonido', n: 'sword_swing1', v: 0.3 }], null] });
    let golpes = 0; const oir = () => golpes++; s.events.on('ck_golpe', oir);
    window.CK_EVENTOS.length = 0; const sp = s.add.sprite(s.player.x, s.player.y - 30, 'ed_prueba_ev'); sp.play('ed_prueba_ev');
    ok(await hasta(() => window.CK_EVENTOS.length >= 2, 2000), 'no llegaron los eventos: ' + JSON.stringify(window.CK_EVENTOS));
    s.events.off('ck_golpe', oir); sp.destroy();
    ok(golpes === 1, 'el golpe sonó ' + golpes + ' veces'); ok(window.CK_EVENTOS[0].cuadro === 1 && window.CK_EVENTOS[1].t === 'sonido', 'orden raro: ' + JSON.stringify(window.CK_EVENTOS));
  });
  prueba('Luces nuevas del editor (foco, anillo, sigue al héroe)', async () => {
    const s = escena(), pl = s.player, ED = CK_EDITOR;
    ED.luces._prueba = [
      { x: 60, y: 60, forma: 'foco', radio: 70, apertura: 40, dir: 0, color: '#fff4d6', fuerza: 0.6 },
      { x: 120, y: 60, forma: 'anillo', radio: 30, grosor: 35, color: '#7fb2ff', pulso: 2, escalones: 3 },
      { x: 0, y: 0, forma: 'punto', radio: 30, color: '#ffe9b0', fuerza: 0.4, sigue: 'heroe' }
    ];
    s.ckLuces({ key: '_prueba', x: pl.x - 100, y: pl.y - 100, w: 200, h: 200 });
    ok(ED.lucesVivas.length === 3 && ED.lucesVivas.every(v => v.im.active && s.textures.exists(v.im.texture.key)), 'no se crearon las 3 luces');
    const d = ED.lucesVivas[0].im.texture.getSourceImage().getContext('2d').getImageData(0, 0, 4, 4).data;
    await esperar(300);
    const v3 = ED.lucesVivas[2].im, b = pl.body;
    ok(Math.abs(v3.x - b.center.x) < 2 && Math.abs(v3.y - (b.center.y - 4)) < 2, 'la luz no sigue al héroe');
    ok(d[3] === 0, 'el foco no debería iluminar detrás');
    ED.lucesVivas.forEach(v => v.im.destroy()); ED.lucesVivas = []; delete ED.luces._prueba;
  });
  // ------------------------------------------------------------------ campaña y conexiones
  // Estas dos pruebas juegan la campaña de verdad (guardan partida): copian todo lo guardado antes y lo restauran después.
  const conGuardadoIntacto = async fn => {
    const copia = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); copia[k] = localStorage.getItem(k); }
    try { await fn(); } finally {
      Object.keys(localStorage).forEach(k => { if (!(k in copia)) localStorage.removeItem(k); });
      Object.keys(copia).forEach(k => localStorage.setItem(k, copia[k]));
    }
  };
  /** Lleva al héroe a una zona como lo hace el juego (mapas del editor, castillo, ruinas). */
  const irZona = async (s, zona) => {
    if (s.currentZoneKey() === zona) return;
    let m = /^ed_(.+)\.main$/.exec(zona);
    if (m) { ok(s.ckEntrar(m[1]), 'no pude entrar a ' + zona); }
    else {
      m = /^(castle|ruins)\.(\w+)$/.exec(zona);
      ok(m, 'zona desconocida ' + zona);
      const b = s.buildInterior(m[1] === 'castle' ? { _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle', _ck: true } : { _houseName: 'Ruins', _interiorIndex: 7, _interiorKind: 'ruins' });
      const a = b.areas[m[2]];
      s.currentInterior = { building: b, areaName: m[2], area: a }; s._areaSwitchHold = true; s.showInteriorArea(a, a.spawn);
    }
    ok(await hasta(() => s.currentZoneKey() === zona && !s._doorTransition, 5000), 'no llegó a ' + zona);
    await esperar(500);
  };
  /** Celda caminable más cercana a (x, y) que se alcance a pie desde donde está el héroe (o null). */
  const alcanzable = (s, x, y, r) => {
    const G = s.navGrid(true), W = G.gw, b = s.player.body, st = s.navNearestCell(G, b.center.x, b.bottom);
    if (!st) return null;
    const vis = new Uint8Array(W * G.gh), q = [st[1] * W + st[0]]; vis[q[0]] = 1;
    let mejor = null, md = 1e9;
    while (q.length) {
      const c = q.pop(), cx = c % W, cy = (c / W) | 0, px = G.x + cx * 8 + 4, py = G.y + cy * 8 + 4, d = Math.hypot(px - x, py - 5 - y);
      if (d < r && d < md) { md = d; mejor = [px, py]; }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = cx + dx, ny = cy + dy, n = ny * W + nx; if (s.navFreeCell(G, nx, ny) && !vis[n]) { vis[n] = 1; q.push(n); } });
    }
    return mejor;
  };
  const cerrarDialogo = async s => { for (let i = 0; i < 30 && s._dlg; i++) { s._dlg.shown = 999; s._dlg.at = 0; s.advanceDialog(); await esperar(40); } await esperar(250); };
  /** Va hasta un personaje de la historia (a un lugar al que se llega caminando) y le habla con T. */
  const hablar = async (s, id) => {
    const n = STORY_NPCS.find(x => x.id === id);
    ok(n, 'no existe ' + id);
    await irZona(s, n.zone);
    const a = s.currentInterior.area, p = alcanzable(s, a.x + n.x, a.y + n.y, n.r - 4);
    ok(p, 'no se llega caminando a ' + n.name + ' (' + n.zone + ')');
    s.placePlayerFeetAt(p[0], p[1]); s.player.setVelocity(0, 0); await esperar(200);
    await cerrarDialogo(s);
    s.interact(); await esperar(250);
    ok(s._dlg && s._dlg.name === n.name, 'T no abrió la charla con ' + n.name + ' (' + (s._dlg ? s._dlg.name : 'nada') + ')');
    await cerrarDialogo(s);
  };
  const vencer = async (s, filtro, cuantos) => {
    const e = s.enemies.getChildren().filter(x => x.active && !x.isDead && filtro(x)).slice(0, cuantos);
    ok(e.length >= cuantos, 'faltan bestias: hay ' + e.length + ' de ' + cuantos);
    for (const x of e) { s.damageEnemy(x, 99, x.x, x.y); await esperar(150); }
    await esperar(600);
  };
  prueba('Capítulo 1 completo: del Rey al epílogo, caminando hasta cada uno y hablando con T', async () => conGuardadoIntacto(async () => {
    const s = escena(), paso = () => s.story.step, fl = () => s.story.flags;
    s.startCampaign(); await hasta(() => s.story && s.player, 4000); await esperar(800);
    Object.assign(s.story, { step: 0, count: 0, flags: {} }); s.updateObjective();
    const guardia = setInterval(() => { s.isInvulnerable = true; s.health = s.maxHealth; }, 100);
    try {
      await hablar(s, 'king'); ok(paso() === 1, 'el Rey no dio la misión (paso ' + paso() + ')');
      await hablar(s, 'captain'); ok(paso() === 2, 'el Capitán no mandó al camino (paso ' + paso() + ')');
      await irZona(s, 'ed_camino_al_castillo.main');
      await vencer(s, x => !(x.def && x.def.flying), 3); ok(await hasta(() => paso() === 3, 2000), 'las 3 bestias del camino no contaron (paso ' + paso() + ', cuenta ' + s.story.count + ')');
      await hablar(s, 'captain'); ok(fl().h === 'eloy', 'el Capitán no mandó con Eloy (' + fl().h + ')');
      await hablar(s, 'eloy'); ok(fl().h === 'taberna', 'Eloy no mandó a la taberna (' + fl().h + ')');
      await hablar(s, 'tabernero'); ok(fl().h === 'ruy', 'el tabernero no mandó con Ruy (' + fl().h + ')');
      await hablar(s, 'ruy'); ok(paso() === 4 && fl().sal, 'Ruy no dio la sal ni el paso a Brumavieja (paso ' + paso() + ')');
      await hablar(s, 'hermit'); ok(paso() === 5, 'Tobías no mandó al cementerio (paso ' + paso() + ')');
      await irZona(s, 'ruins.village');
      await vencer(s, x => x.type === 'skeleton_great', 1); ok(await hasta(() => paso() === 6 && fl().key, 2000), 'el Gran Esqueleto no dejó la llave (paso ' + paso() + ')');
      // la capilla: al acercarse sale el Nigromante (antes habla Varek)
      const a = s.currentInterior.area;
      s.placePlayerFeetAt(a.x + 560, a.y + 380); await esperar(400); await cerrarDialogo(s);
      s.placePlayerFeetAt(a.x + 560, a.y + 330); await esperar(300); await cerrarDialogo(s);
      ok(await hasta(() => s.enemies.getChildren().some(x => x.active && x.type === 'necromancer'), 4000), 'el Nigromante no salió de la capilla');
      await vencer(s, x => x.type === 'necromancer', 1);
      ok(await hasta(() => paso() === 7 && fl().codice, 3000), 'vencer al Nigromante no dio el Códice ni el paso 7 (paso ' + paso() + ')');
      await hablar(s, 'eloy'); ok(fl().codice_ok, 'Eloy no recibió el Códice');
      await hablar(s, 'king'); ok(paso() === 8, 'el Rey no cerró el capítulo (paso ' + paso() + ')');
      await hablar(s, 'eloy'); ok(fl().epilogo, 'Eloy no dio el epílogo');
    } finally { clearInterval(guardia); s.isInvulnerable = false; s.clearZoneEnemies(); }
  }));
  // salida -> [zona a la que lleva, x, y del lugar donde aparece el héroe] (los mapas del Taller, el castillo y las ruinas)
  const CONEXIONES = [
    ['ed_camino_al_castillo.main', 'puerta', 'courtyard', 'castle.courtyard', 320, 530],
    ['castle.courtyard', 'salida', 'training', 'castle.training', 440, 446],     // ojo: portón oeste -> portón sur (así está dibujado)
    ['castle.courtyard', 'salida', 'garden', 'ed_jardin_real.main', 26, 270],   // Jardín Real nuevo (ck_salas_castillo.js)
    ['castle.courtyard', 'salida', 'road', 'ed_camino_al_castillo.main', 1189, 452],
    ['castle.courtyard', 'puerta', 'kitchen', 'castle.kitchen', 202, 287],
    ['castle.courtyard', 'puerta', 'armory', 'ed_herreria.main', 204, 340],    // Herrería nueva, en lugar de la Armería
    ['castle.courtyard', 'puerta', 'throne', 'ed_salon_del_trono_3.main', 240, 565],
    ['castle.training', 'salida', 'courtyard', 'castle.courtyard', 29, 312],
    ['ed_jardin_real.main', 'salida', 'outside', 'castle.courtyard', 606, 226],
    ['castle.kitchen', 'salida', 'courtyard', 'castle.courtyard', 125, 188],
    ['ed_herreria.main', 'salida', 'outside', 'castle.courtyard', 510, 182],
    ['ed_salon_del_trono_3.main', 'salida', 'outside', 'castle.courtyard', 320, 192],
    ['ed_salon_del_trono_3.main', 'puerta', 'kingroom', 'ed_aposentos_del_rey.main', 200, 352],
    ['ed_salon_del_trono_3.main', 'puerta', 'library', 'ed_biblioteca.main', 200, 386]
  ];
  prueba('Conexiones entre mapas: cada salida lleva adonde debe y el héroe aparece en su lugar', async () => conGuardadoIntacto(async () => {
    const s = escena(), K = s.cursors, mal = [];
    if (!s.story) { s.startCampaign(); await hasta(() => s.story && s.player, 4000); await esperar(800); }
    for (const [desde, tipo, to, llega, x, y] of CONEXIONES) {
      await irZona(s, desde); await cerrarDialogo(s);
      const a = s.currentInterior.area, z0 = s.currentZoneKey();
      const e = tipo === 'salida' ? (a.exits || []).find(v => v.to === to) : (a.portals || []).find(v => v.to === to);
      if (!e) { mal.push(desde + ': no hay ' + tipo + ' a ' + to); continue; }
      if (tipo === 'salida') s.placePlayerFeetAt(e.x + e.w / 2, e.y + e.h / 2 + 4); else s.placePlayerFeetAt(e.x, e.y + 14);
      await esperar(150);
      const tecla = tipo === 'puerta' || e.key === 'up' ? 'up' : e.key === 'down' ? 'down' : null;
      if (tecla) K[tecla].isDown = true;
      const fue = await hasta(() => s.currentZoneKey() !== z0 && !s._doorTransition, 4000);
      if (tecla) K[tecla].isDown = false;
      await esperar(300);
      const b = s.player.body, c = s.currentInterior, ox = c ? c.area.x : 0, oy = c ? c.area.y : 0;
      const d = Math.hypot(b.center.x - ox - x, b.bottom - oy - y);
      if (!fue || s.currentZoneKey() !== llega) mal.push(desde + ' → ' + to + ': llegó a ' + s.currentZoneKey());
      else if (d > 40) mal.push(desde + ' → ' + to + ': apareció a ' + Math.round(d) + ' px de donde debía');
    }
    ok(!mal.length, mal.join(' / '));
  }));
  prueba('Sin errores en la consola', async () => ok(!errores.length, errores.join(' / ')));

  const correr = async () => {
    const caja = document.createElement('div'); caja.style.cssText = 'position:fixed;right:12px;top:12px;width:440px;max-height:80vh;overflow:auto;z-index:99999;background:#24272c;color:#e9e7e2;border:1px solid #4a505a;border-radius:10px;padding:12px;font:13px Segoe UI,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
    caja.innerHTML = '<b>Pruebas del juego…</b>'; document.body.append(caja); const res = [];
    for (const t of lista) { actual = t.nombre; const f = document.createElement('div'); f.style.padding = '3px 0'; f.textContent = '… ' + t.nombre; caja.append(f);
      try { await t.fn(); res.push({ nombre: t.nombre, ok: true }); f.textContent = '✔ ' + t.nombre; f.style.color = '#5fc27e'; }
      catch (e) { res.push({ nombre: t.nombre, ok: false, error: e.message }); f.textContent = '✘ ' + t.nombre + ' — ' + e.message; f.style.color = '#e8644f'; } }
    const mal = res.filter(r => !r.ok).length; caja.firstChild.textContent = mal ? mal + ' prueba(s) fallaron de ' + res.length : 'Todo bien: ' + res.length + ' pruebas'; caja.firstChild.style.color = mal ? '#e8644f' : '#5fc27e';
    window.__resultado = { total: res.length, fallas: mal, res };
  };
  // un clic para que el navegador deje sonar el audio; después corre solo
  window.addEventListener('load', () => {
    const b = document.createElement('button'); b.textContent = 'Clic acá para empezar las pruebas del juego'; b.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:99999;padding:18px 28px;font:600 18px Segoe UI,sans-serif;background:#e8b83a;color:#1d1a10;border:0;border-radius:10px;cursor:pointer';
    b.id = 'ck-empezar-pruebas'; b.onclick = () => { b.remove(); try { sfx.init(); if (window.CK_SONIDO && CK_SONIDO.iniciar) CK_SONIDO.iniciar(); } catch (e) { } setTimeout(correr, 300); };
    setTimeout(() => document.body.append(b), 1500);
  });
})();
