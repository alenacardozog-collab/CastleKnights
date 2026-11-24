'use strict';
/* El final del juego (24/11, pedido del dueño: "hoy nos ponemos con eso para terminarlo"; elegido: "Elia lo juzga" y "seguir
   jugando" después del FIN).
   1. LA VUELTA (Camino al Castillo, Capítulo 3 paso 8 con la Mazmorra terminada): el héroe sale del portal de Oswin, Elia sale
      detrás; Bruno, en el portón, los recibe. Elia pide al Rey en el Gran Salón → paso 9.
   2. EL JUICIO (Gran Salón, paso 9): Elia frente al trono; traen al Rey Aldric entre dos guardias; Eloy y Bruno a los costados.
      Elia lo despoja de la corona y lo destierra; Bruno grita "¡Larga vida a la reina Elia!"; Elia nombra al héroe Caballero
      (o Dama) de Valcairn; Eloy cuenta que el Sello duerme otra vez. Queda flags.cap3_fin: el rojo se apaga en todo el reino.
   3. EL EPÍLOGO: textos sobre negro (San Roque, Bruno, Eloy, Gaspar según lo que se eligió, el viejo Rey) y la pantalla de FIN
      con el resumen de la partida y los créditos. "Seguir jugando": el héroe queda en el Gran Salón, con la reina Elia en el
      estrado (se le puede hablar), y el reino en paz para recorrer.
   Si se corta en el medio (se cierra el juego), al volver: con el paso 9 sin terminar se va directo al Gran Salón y el juicio
   empieza de nuevo. Después del final, en el Gran Salón ya no está el Rey: está Elia; la Reina Elara (su madre) y la corte
   vuelven, y en la puerta hay guardias del reino en lugar de los mercenarios. El objetivo dice que el reino está en paz.
   Va después de ck_capitulo3_castillo.js y de ck_mazmorra_final.js. Borrar su línea de index.html lo saca.
   v2 (24/11, revisión final): EL FINAL GUARDA SOLO. La partida se guarda únicamente en los carteles (ck_partidas.js v2) y
   el último cartel antes del final es el de la Mazmorra del Sello: sin esto, si se cerraba el juego después del FIN había
   que volver a pelear contra Malakar y Azrath. Ahora se guarda la ranura dos veces, siempre en el Gran Salón:
   · al terminar la vuelta (paso 9): si se corta en el medio, al CONTINUAR se aparece en el Gran Salón y el juicio empieza
     de nuevo;
   · al mostrarse el FIN: al CONTINUAR se sigue con el reino en paz y la reina Elia en el estrado.
   En una partida de prueba (PRUEBAS, F4) no se escribe nada.
   También en v2: el resumen del FIN muestra los logros ganados (de CK_LOGROS) en lugar de la experiencia. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => (S.currentInterior ? S.currentInterior.area : null);
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const c3 = s => (s && s.flags && s.flags.c3) || 0;
  const E = () => window.CK_ESCENA;
  const sonar = (k, v, o) => { try { if (typeof sfx !== 'undefined') return sfx.fx(k, v, o); } catch (e) {} return false; };
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const ZCAM = 'ed_camino_al_castillo.main', SALON = 'ed_salon_del_trono_3.main';
  const nombre = S => { const h = (typeof HEROES !== 'undefined' && (HEROES[S.playerHero] || HEROES.soldier)) || { name: 'HÉROE' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  const dama = S => S.playerHero === 'swordsman';
  const titulo = S => (dama(S) ? 'Dama ' : 'Sir ') + nombre(S);
  const mzFinal = s => !!(s && s.flags && s.flags.mz && s.flags.mz.final);
  const terminado = s => !!(s && s.flags && s.flags.cap3_fin);
  // (v2) guarda la ranura con el héroe en el Gran Salón, delante de la alfombra (el lugar va como lo guarda un cartel)
  const guardarFin = S => {
    try { const PA = window.CK_PARTIDAS; if (PA && PA.guardarAqui) return PA.guardarAqui(S, { zona: SALON, x: 240, y: 350 }); } catch (e) { console.warn('[final] guardar', e); }
    return false;
  };

  // ------------------------------------------------------------------ créditos (pedido: "Valcairn" en lugar de CastleKnight)
  const AUTOR = 'Valcairn';
  const CREDITOS = [
    ['Un juego de', AUTOR],
    ['Hecho con', 'el Taller de Valcairn y Phaser 3'],
    ['Arte', 'packs de pixel art del proyecto, retocados y animados con PixelLab'],
    ['Voces y sonidos', 'ElevenLabs'],
    ['Letra', 'Grenze, de Omnibus-Type (licencia OFL)'],
    ['', 'Gracias por jugar']
  ];
  // la pantalla del Capítulo 1 usa la misma lista
  try {
    const FC = window.CK_FIN_CAPITULO;
    if (FC && Array.isArray(FC.CREDITOS)) { FC.CREDITOS.length = 0; CREDITOS.forEach(c => FC.CREDITOS.push(c)); }
  } catch (e) {}

  // ------------------------------------------------------------------ 1. la vuelta, en el Camino
  const vuelta = async S => {
    const e = E(), s = st(S); if (!e || !s || S._ckFinVuelta) return;
    S._ckFinVuelta = true;
    const a = area(S), p = { x: S.player.x - a.x, y: S.player.y - a.y };
    let elia = null, bruno = S._c3Bruno && S._c3Bruno.active ? S._c3Bruno : null, propio = false;
    const ok = await e.correr(S, async () => {
      await e.camara(S, p.x, p.y - 30, 700);
      // Elia sale del portal detrás del héroe
      elia = e.actor(S, 'npc8_villager', p.x - 26, p.y + 4, { escala: 1.3 });
      elia.setAlpha(0); S.tweens.add({ targets: elia, alpha: 1, duration: 600 });
      S.cameras.main.flash(260, 200, 140, 255);
      sonar('ck_portal_abre', 0.5, { rate: 1.2 });
      await e.esperar(900);
      if (!bruno) { bruno = e.actor(S, 'g_knight_idle', p.x + 120, p.y - 30, { escala: 1.2, anim: 'g_knight' }); propio = true; }
      // (si quedó lejos, en el portón, se acerca desde un poco más allá: que no camine medio mapa)
      else if (Math.hypot(bruno.x - S.player.x, bruno.y - S.player.y) > 220) bruno.setPosition(S.player.x + 150, S.player.y - 20);
      bruno.setFlipX(bruno.x > S.player.x);
      await e.caminar(S, bruno, p.x + 44, p.y - 6, 70);
      bruno.setFlipX(true);
      await e.dialogo(S, 'Capitán Bruno', ['¡Alteza! ¡' + nombre(S) + '!', '…Pensé que no los volvía a ver. Cuando el portal se cerró, pensé lo peor.'], 'g_knight_idle');
      await e.dialogo(S, 'Princesa Elia', ['Bruno. ¿Dónde está mi padre?'], 'npc8_villager');
      await e.dialogo(S, 'Capitán Bruno', ['Encerrado en sus aposentos desde que se fueron. Mis hombres cuidan la puerta: no salió ni a comer.'], 'g_knight_idle');
      await e.dialogo(S, 'Princesa Elia', ['Traelo al Gran Salón. Y llamá al Maestre Eloy.', 'Esto se termina hoy.'], 'npc8_villager');
      e.globo(S, bruno, '¡A la orden, Alteza!', 1500);
      await e.esperar(900);
    });
    S._ckFinVuelta = false;
    if (!ok || !st(S)) return;
    const f = fl(s); f.c3 = 9; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
    guardarFin(S);   // (v2)
    try { if (elia && elia.active) elia.destroy(); if (propio && bruno && bruno.active) bruno.destroy(); } catch (er) {}
    alSalon(S, 'Esa misma tarde, en el Gran Salón…');
  };

  // ------------------------------------------------------------------ al Gran Salón (con un cartel sobre negro)
  const cartel = (texto, ms) => new Promise(r => {
    const d = document.createElement('div');
    d.className = 'ck-final-cartel';
    d.style.cssText = 'position:fixed;inset:0;z-index:99990;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .6s;pointer-events:none';
    d.innerHTML = `<div style="font:italic 26px Grenze,Georgia,serif;color:#e8d8b0;text-align:center;padding:0 24px;max-width:760px;line-height:1.5">${esc(texto)}</div>`;
    (document.fullscreenElement || document.getElementById('game-wrapper') || document.body).append(d);
    requestAnimationFrame(() => { d.style.opacity = '1'; });
    setTimeout(() => r(d), ms || 2200);
  });
  const quitar = d => { if (!d) return; d.style.opacity = '0'; setTimeout(() => d.remove(), 700); };
  const alSalon = async (S, texto) => {
    if (S._ckFinViaje) return;
    S._ckFinViaje = true;
    const d = await cartel(texto, 2200);
    try { if (S.ckEntrar) S.ckEntrar('salon_del_trono_3', { x: 240, y: 340 }); } catch (e) { console.warn('[final]', e); }
    setTimeout(() => { quitar(d); S._ckFinViaje = false; }, 1500);
  };

  // ------------------------------------------------------------------ 2. el juicio, en el Gran Salón
  // el salón vacío para la escena: sin el Rey del trono ni la corte (ck_mapas_nuevos.js), sin nadie más
  const vaciar = S => {
    const k = S._ckRey; if (k) { [k.sentado, k.de_pie, k.cartel].forEach(o => { try { if (o) o.destroy(); } catch (e) {} }); S._ckRey = null; }
    (S._ckCorte || []).forEach(o => { try { if (o) o.destroy(); } catch (e) {} }); S._ckCorte = null;
    const a = area(S); if (!a) return;
    a.talkers = (a.talkers || []).filter(t => !t.ck);
    a.actors = (a.actors || []).filter(t => { if (!t.ck) return true; try { if (t.sprite) t.sprite.destroy(); } catch (e) {} return false; });
    a.actors.forEach(t => { if (t.sprite && t.sprite.active && t.sprite.visible) { t.sprite.setVisible(false); t._ckFinOculto = true; t.lines = []; } });
  };
  const juicio = async S => {
    const e = E(), s = st(S); if (!e || !s || S._ckFinJuicio) return;
    S._ckFinJuicio = true;
    vaciar(S);
    const a = area(S), objs = [];
    const pon = (k, x, y, o) => { const sp = e.actor(S, k, x, y, o); objs.push(sp); return sp; };
    // la escena: Elia frente al trono, Eloy y Bruno a los costados; el héroe abajo, en la alfombra
    const elia = pon('npc8_villager', 240, 112, { escala: 1.3 });
    const eloy = pon(S.textures.exists('npc6_villager') ? 'npc6_villager' : 'npc1_villager', 176, 200, { escala: 1.3 });
    const bruno = pon('g_knight_idle', 302, 200, { escala: 1.2, anim: 'g_knight', flip: true });
    S.placePlayerFeetAt && S.placePlayerFeetAt(a.x + 240, a.y + 330);
    S.player.setFlipX(false);
    let rey = null, g1 = null, g2 = null;
    const ok = await e.correr(S, async () => {
      await e.camara(S, 240, 220, 10);
      S.cameras.main.fadeIn(500, 0, 0, 0);
      await e.esperar(700);
      // traen al Rey
      rey = pon('king_idle', 240, 470, { escala: 1.2, anim: 'kingprueba' });
      g1 = pon('g_templar_idle', 214, 486, { escala: 1.2, anim: 'g_templar' });
      g2 = pon('g_templar_idle', 266, 486, { escala: 1.2, anim: 'g_templar', flip: true });
      sonar('ck_paso_armadura', 0.5, { rate: 0.9 });
      await Promise.all([e.caminar(S, rey, 240, 262, 34), e.caminar(S, g1, 212, 276, 34), e.caminar(S, g2, 268, 276, 34)]);
      g2.setFlipX(true); g1.setFlipX(false);
      rey.setTint(0xd8d0d0);
      await e.camara(S, 240, 190, 700);
      await e.dialogo(S, 'Rey Aldric', ['Hija… ¡hija! Estás viva. Sabía que… yo nunca quise que…'], 'king_idle');
      await e.dialogo(S, 'Princesa Elia', ['Me tiraste al portal, padre. Con tus propias manos.'], 'npc8_villager');
      await e.dialogo(S, 'Rey Aldric', ['¡Era poder! Para el reino, para nosotros… Lo que hay del otro lado iba a obedecerme.'], 'king_idle');
      await e.dialogo(S, 'Maestre Eloy', ['Lo que hay del otro lado no obedece a nadie, Majestad.', 'Casi lo aprendemos todos a la fuerza.'], 'npc6_villager');
      await e.dialogo(S, 'Princesa Elia', ['Medio reino ardió por tu ambición. San Roque, la aldea, los campos… el claro del bosque todavía arde.'], 'npc8_villager');
      await e.dialogo(S, 'Rey Aldric', ['…¿Y qué vas a hacer? ¿Matar a tu propio padre?'], 'king_idle');
      e.globo(S, elia, '…', 1200); await e.esperar(1400);
      await e.dialogo(S, 'Princesa Elia', ['No. No voy a ser como vos.',
        'Aldric de Valcairn: la corona ya no tiene gema, y tampoco va a tener rey.',
        'Salís del reino al amanecer. Sin escolta, sin oro y sin nombre. Y no volvés nunca.'], 'npc8_villager');
      e.globo(S, rey, '…', 1600); await e.esperar(1200);
      // se lo llevan
      rey.setFlipX(true);
      await Promise.all([e.caminar(S, rey, 240, 480, 30), e.caminar(S, g1, 214, 494, 30), e.caminar(S, g2, 266, 494, 30)]);
      [rey, g1, g2].forEach(o => o && o.active && o.setVisible(false));
      await e.esperar(400);
      await e.camara(S, 240, 200, 600);
      e.globo(S, bruno, '¡LARGA VIDA A LA REINA ELIA!', 2200);
      S.createFloatingText(a.x + 302, a.y + 150, '¡LARGA VIDA A LA REINA ELIA!', 0xfde68a);
      sonar('quest_done', 0.6, { rate: 0.8 });
      await e.esperar(2000);
      // el héroe, nombrado
      await e.dialogo(S, 'Reina Elia', ['Y vos. Cruzaste el Sello por mí, cuando nadie más se animó.', 'Arrodillate.'], 'npc8_villager');
      await e.caminar(S, elia, 240, 270, 36);
      S.tweens.add({ targets: S.player, scaleY: S.player.scaleY * 0.88, duration: 300, yoyo: true, hold: 1600 });
      sonar('sword_swing2', 0.5, { rate: 0.7 });
      await e.esperar(700);
      await e.dialogo(S, 'Reina Elia', ['Desde hoy sos ' + titulo(S) + ', ' + (dama(S) ? 'Dama' : 'Caballero') + ' de Valcairn y protector' + (dama(S) ? 'a' : '') + ' de la corona.'], 'npc8_villager');
      S.createFloatingText(S.player.x, S.player.y - 60, '✦ ' + (dama(S) ? 'DAMA' : 'CABALLERO') + ' DE VALCAIRN ✦', 0xfde68a);
      sonar('ck_logro', 0.7) || sonar('quest_done', 0.8);
      await e.esperar(1200);
      await e.dialogo(S, 'Maestre Eloy', ['El Sello está cerrado otra vez. Sin las tres llaves juntas, la puerta duerme.',
        'El rojo se va a ir apagando. Va a llevar tiempo… pero se va a apagar.'], 'npc6_villager');
      await e.esperar(500);
    });
    S._ckFinJuicio = false;
    if (!ok || !st(S)) { objs.forEach(o => { try { o.destroy(); } catch (er) {} }); return; }
    const f = fl(s); f.cap3_fin = true; f.c3 = 9; f.final_juego = true; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
    epilogo(S, objs);
  };

  // ------------------------------------------------------------------ 3. el epílogo y el FIN
  const TEXTOS = S => {
    const f = fl(S.story);
    return [
      'El rojo se apagó en tres días. En San Roque volvieron a sonar las campanas.',
      'Bruno juntó a los soldados que quedaban y empezó a levantar de nuevo la guardia del reino.',
      'El Maestre Eloy guardó el cristal del portal en lo más hondo de la biblioteca, donde nadie lo vaya a buscar.',
      f.gaspar_fin === 'derrotado' ? 'A Sir Gaspar lo despertaron dos días después, todavía con estrellitas. Lo mandaron a limpiar los establos.'
        : 'De Sir Gaspar nadie supo más. Dicen que cruzó la frontera orca a pie, tropezando con su propia capa.',
      'Y del viejo rey sólo se sabe que una mañana de niebla tomó el camino del norte. Solo.',
      'Valcairn tenía una reina. Y la reina, ' + (dama(S) ? 'a su dama' : 'a su caballero') + '.'
    ];
  };
  const epilogo = async (S, objs) => {
    const negro = await cartel('', 900);
    objs.forEach(o => { try { o.destroy(); } catch (er) {} });
    // detrás del negro: el salón ya con la reina en el estrado (el juego sigue después del FIN)
    try { if (S.ckEntrar) S.ckEntrar('salon_del_trono_3', { x: 240, y: 330 }); } catch (e) {}
    const caja = negro.firstElementChild;
    for (const t of TEXTOS(S)) {
      caja.style.transition = 'opacity .7s'; caja.style.opacity = '0';
      await new Promise(r => setTimeout(r, 750));
      caja.textContent = t; caja.style.opacity = '1';
      await new Promise(r => setTimeout(r, 3600));
    }
    caja.style.opacity = '0';
    await new Promise(r => setTimeout(r, 800));
    finJuego(S, () => quitar(negro));
  };
  // (v2) en el FIN, los logros ganados en vez de la experiencia (que es la del nivel en curso y al final suele dar casi 0)
  const logros = () => { try { const L = window.CK_LOGROS; if (L && L.LOGROS && L.datos) return Object.keys(L.datos().hechos || {}).length + ' / ' + L.LOGROS.length; } catch (e) {} return ''; };
  const duracion = seg => { seg = Math.max(0, Math.round(seg || 0)); const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
  const jugado = S => {
    try { const PA = window.CK_PARTIDAS, i = PA && PA.activa(); const slot = i !== null && i !== undefined ? PA.leer()[i] : null; return (slot && slot.tiempo || 0) + (S._ckJugado || 0); }
    catch (e) { return S._ckJugado || 0; }
  };
  const css = () => {
    if (document.getElementById('ck-finj-css')) return;
    const x = document.createElement('style'); x.id = 'ck-finj-css';
    x.textContent = `#ck-finj{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(24,16,6,.9),rgba(4,3,1,.98));
      opacity:0;transition:opacity 1s;padding:16px;box-sizing:border-box}
      #ck-finj.on{opacity:1}
      #ck-finj .c{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:28px 30px 22px;background:linear-gradient(180deg,#3a2614,#1e1208);
        border:3px solid #b08a48;border-radius:8px;box-shadow:0 18px 60px rgba(0,0,0,.7);color:#f3e6c8;font:16px Grenze,Georgia,serif;text-align:center}
      #ck-finj h1{margin:0;font-size:56px;letter-spacing:6px;color:#ffd77a;text-shadow:0 2px 0 #6b4a1c,0 0 24px rgba(255,200,90,.35)}
      #ck-finj h2{margin:2px 0 4px;font-size:22px;color:#e8c98a;letter-spacing:2px}
      #ck-finj .sub{margin:2px 0 18px;color:#d9c39a;font-style:italic}
      #ck-finj .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:10px;margin:0 0 18px}
      #ck-finj .stats div{background:rgba(0,0,0,.28);border:1px solid #6b5230;border-radius:6px;padding:8px 6px}
      #ck-finj .stats b{display:block;font-size:21px;color:#ffe9b0}
      #ck-finj .stats span{font-size:13px;color:#cdb68d}
      #ck-finj .cred{font-size:14px;line-height:1.6;color:#d9c39a;margin-bottom:18px;padding-top:12px;border-top:1px solid #6b5230}
      #ck-finj .cred i{color:#a8916a;font-style:normal}
      #ck-finj button{font:600 17px Grenze,Georgia,serif;color:#2a1a0a;background:linear-gradient(180deg,#ffd77a,#d9a441);border:2px solid #6b4a1c;border-radius:6px;padding:8px 22px;cursor:pointer}`;
    document.head.append(x);
  };
  const finJuego = (S, alCerrar) => {
    const s = S.story, f = fl(s);
    f.fin_juego_visto = true; S.saveStory && S.saveStory();
    css();
    const d = document.createElement('div'); d.id = 'ck-finj';
    const stat = (v, n) => `<div><b>${esc(v)}</b><span>${esc(n)}</span></div>`;
    d.innerHTML = `<div class="c">
      <h1>FIN</h1>
      <h2>VALCAIRN</h2>
      <div class="sub">${esc(titulo(S))}, ${dama(S) ? 'Dama' : 'Caballero'} de Valcairn. El reino está a salvo.</div>
      <div class="stats">${stat(duracion(jugado(S)), 'jugado')}${stat(f.bestias || S.kills || 0, 'bestias vencidas')}${stat(s.coins || 0, 'monedas')}${stat(s.level || 1, 'nivel')}${logros() ? stat(logros(), 'logros') : stat(s.xp || 0, 'experiencia')}</div>
      <div class="cred">${CREDITOS.map(([a, b]) => (a ? `<i>${esc(a)}:</i> ` : '') + esc(b)).join('<br>')}</div>
      <button type="button">Seguir jugando</button></div>`;
    (document.fullscreenElement || document.getElementById('game-wrapper') || document.body).append(d);
    S._overlay = 'fin';
    guardarFin(S);   // (v2) después de armar el resumen (el tiempo jugado ya está sumado)
    try { S.physics.pause(); } catch (e) {}
    sonar('quest_done', 0.7, { rate: 0.7 });
    requestAnimationFrame(() => d.classList.add('on'));
    const cerrar = () => {
      d.classList.remove('on'); setTimeout(() => d.remove(), 900);
      if (S._overlay === 'fin') S._overlay = null;
      try { S.physics.resume(); } catch (e) {}
      document.removeEventListener('keydown', tecla, true);
      if (alCerrar) alCerrar();
      S.time.delayedCall(900, () => S.player && S.showZoneTitle && S.showZoneTitle('Valcairn', 'El reino está en paz'));
    };
    const tecla = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cerrar(); } };
    d.querySelector('button').onclick = cerrar;
    document.addEventListener('keydown', tecla, true);
  };

  // ------------------------------------------------------------------ después del final: la reina en el Gran Salón
  const REY = typeof STORY_NPCS !== 'undefined' ? STORY_NPCS.find(n => n.id === 'king') : null;
  if (REY) {
    const d = Object.getOwnPropertyDescriptor(REY, 'zone'), z0 = d && d.get ? d.get : null;
    let zv = d && !d.get ? d.value : undefined;
    Object.defineProperty(REY, 'zone', { configurable: true,
      get() { const S = window.activeGameScene, s = st(S); if (s && (terminado(s) || c3(s) === 9)) return '-'; return z0 ? z0.call(REY) : zv; },
      set(v) { zv = v; } });
  }
  const BRUNO = typeof STORY_NPCS !== 'undefined' ? STORY_NPCS.find(n => n.id === 'bruno_c3') : null;
  if (BRUNO && typeof BRUNO.lines === 'function') {
    const l0 = BRUNO.lines;
    BRUNO.lines = (s, h) => terminado(s) ? ['¡' + (window.activeGameScene ? titulo(window.activeGameScene) : 'Elegido') + '! La guardia ya tiene veinte hombres nuevos.',
      'Todavía me cuesta decir "la reina". Pero le queda bien la corona, ¿no?'] : l0(s, h);
  }
  const corteNueva = S => {
    const a = area(S); if (!a) return;
    const k = S._ckRey; if (k) { [k.sentado, k.de_pie, k.cartel].forEach(o => { try { if (o) o.destroy(); } catch (e) {} }); S._ckRey = null; }
    // la princesa de la corte (npc8) pasa a ser la reina en el estrado; los mercenarios de la puerta, guardias del reino
    (S._ckCorte || []).forEach(o => {
      if (!o || !o.active || o.type !== 'Sprite') return;
      const kk = o.texture && o.texture.key;
      if (kk === 'npc8_villager') { o.setPosition(a.x + 240, a.y + 104).setDepth(a.y + 104).setFlipX(false); }
      else if (kk === 'g_axeman_idle' && S.textures.exists('g_templar_idle')) { o.setTexture('g_templar_idle'); if (S.anims.exists('g_templar_idle')) o.play('g_templar_idle'); }
    });
    (a.talkers || []).forEach(t => {
      if (!t.ck || !t.lines || !t.lines.length) return;
      const l = String(t.lines[0]);
      if (/^Reina Elara/.test(l)) t.lines = ['Reina Elara: Mi hija… la reina. Nunca pensé que lo vería tan pronto.', 'Reina Elara: Gracias por traérmela de vuelta.'];
      else if (/^Princesa Lía/.test(l)) { t.x = a.x + 240; t.y = a.y + 110; t.lines = ['Reina Elia: Valcairn te debe todo, ' + titulo(S) + '.', 'Reina Elia: Mi padre tomó el camino del norte. No sé si quiero saber adónde.', 'Reina Elia: El Coliseo sigue abierto, por si extrañás pelear.']; }
      else if (/rey 👑|Su Majestad/.test(l)) t.lines = ['Inclinaos ante Su Majestad, la reina Elia.', 'La reina recibe a todos, hasta a los que vienen embarrados 👑'];
    });
  };

  // ------------------------------------------------------------------ enganches
  const ar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ar0 ? ar0.apply(this, arguments) : undefined;
    try {
      const S = this, s = st(S), z = zona(S); if (!s) return r;
      if (terminado(s)) { if (z === SALON) corteNueva(S); return r; }
      if (z === ZCAM && c3(s) === 8 && mzFinal(s)) S.time.delayedCall(1200, () => { if (zona(S) === ZCAM && c3(s) === 8) vuelta(S); });
      else if (c3(s) === 9) {
        if (z === SALON) { vaciar(S); S.time.delayedCall(500, () => { if (zona(S) === SALON && !terminado(s)) juicio(S); }); }
        // se cortó en el medio: directo al Gran Salón
        else S.time.delayedCall(1200, () => { if (c3(s) === 9 && !terminado(s) && zona(S) !== SALON && !S._doorTransition) alSalon(S, 'En el Gran Salón, Elia te espera…'); });
      }
    } catch (e) { console.warn('[final]', e); }
    return r;
  };
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0 ? ob0.apply(this, arguments) : undefined;
    try {
      const s = st(this), t = document.querySelector('#ck-objective .ck-obj-text'); if (!s || !t) return r;
      if (terminado(s)) t.textContent = 'Valcairn está en paz. Recorré el reino: el Coliseo, los secretos y los jefes que te falten';
      else if (c3(s) === 9) t.textContent = 'El Gran Salón: Elia va a juzgar a su padre';
    } catch (e) {}
    return r;
  };
  window.CK_FINAL = { vuelta, juicio, epilogo, finJuego, corteNueva, CREDITOS, TEXTOS };
})();
