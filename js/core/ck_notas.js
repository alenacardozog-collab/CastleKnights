'use strict';
/* Notas escondidas (10/11, pedido del dueño: "añade por el mapa easter eggs, cosas o notas que nos podamos encontrar y nos
   den pistas de la historia del juego o sus personajes y zonas").
   - Una nota (un papelito en el piso que brilla de vez en cuando) en cada uno de 14 lugares. Se lee con T.
   - Cuentan cosas de Varek y el Códice, el monolito, la llave de la Frontera, los héroes, Grushak, las Torres de Escarcha
     y algo más oscuro para el final (el Abismo).
   - El lugar de cada nota se elige solo la primera vez que entrás a ese mapa: un rincón al que se llega caminando, lejos
     de la entrada y de los cofres. Queda guardado en la partida (story.flags.notas_pos) y las leídas en story.flags.notas.
   - El diario (tecla del diario) dice "Notas encontradas: N de 14".
   Borrar su línea de index.html las saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;

  const NOTAS = {
    village: { t: 'Un cartel arrancado', l: ['«SE BUSCA: Varek, aprendiz del Maestre Eloy. Flaco, encapuchado, habla bonito. Recompensa: 10 de plata.»', 'Alguien tachó la recompensa y escribió abajo: «que lo busque el Rey».'] },
    'ed_taberna_2.main': { t: 'La cuenta de la taberna', l: ['«Ruy el buhonero: debe 3 jarras, un guiso y una disculpa.»', '«Anselmo: debe la payada que prometió en el 18. Y 2 jarras.»'] },
    'ed_campos_del_roble.main': { t: 'Una hoja de diario', l: ['«Martes. Otra vez la niebla. Las ovejas no quieren salir del corral y el perro le ladra al norte toda la noche.»', '«Hoy escuché mi nombre en el viento. Mañana voy a mirar las piedras viejas.» — R.'] },
    'ed_camino_al_castillo.main': { t: 'Carta de un soldado', l: ['«Mamá: me mandan al paso del este, a cuidar la Frontera.»', '«Dicen que en el bosque hay una piedra verde, alta como tres hombres, que de noche canta bajito. Yo no le creo a nadie. No te preocupes.»'] },
    'castle.courtyard': { t: 'Orden de la guardia', l: ['«Ningún soldado cruza el portón de la Frontera sin la llave de hierro negro.»', '«La llave queda en la sala del Rey. Que nadie la toque.» — Capitán Bruno', 'Debajo, con otra letra: «¿Y si ya no está?»'] },
    'castle.training': { t: 'Lista de forasteros', l: ['«Lancent: caballero sin tierras. Pide pelear adelante. Ojo, se cree invencible.»', '«Aby: de Brumavieja. No habla de su familia. Pelea como si quisiera que le duela.»', '«Horos: mago. Edad: no la dice. Dice que esta niebla ya la vio, hace cien años.»'] },
    'ed_biblioteca.main': { t: 'Ficha de préstamo', l: ['«Códice de las Brumas. Retirado por: V. Fecha de devolución: —»', 'En el margen, con letra temblorosa: «No es un libro. Es una puerta con tapas.»'] },
    'ed_aposentos_del_rey.main': { t: 'Una carta de la Reina', l: ['«Aldric: Lía volvió a soñar con torres de hielo, más allá del paso del norte. Dice que alguien la llama desde arriba.»', '«No me gusta. Esos sueños los tenía mi abuela antes del Invierno Largo.» — Elara'] },
    'ruins.village': { t: 'Páginas del diario de Varek', l: ['«El Códice me habla de noche. Dice que lo que duerme bajo el monolito del este tiene hambre, y que puede darme lo que el viejo Eloy nunca quiso enseñarme.»', '«Me hace falta la llave de hierro negro. El Rey la guarda como si fuera una muela.»'] },
    'ed_bosque_de_la_frontera.main': { t: 'Un mapa manchado de sangre', l: ['Un mapa del bosque con el monolito marcado en rojo. Alguien escribió encima, apretando la pluma:', '«No es una piedra. Es una cerradura. Y del otro lado hay algo empujando.»'] },
    'ed_tierras_orcas.main': { t: 'Una tablilla orca', l: ['Marcas talladas en un hueso. Algunas se entienden:', '«Grushak no manda. Grushak escucha a la voz verde. La voz verde quiere el castillo de los hombres.»'] },
    'ed_pueblo_orco.main': { t: 'Un dibujo de chico', l: ['Un dibujo hecho con carbón: un orquito y un nene humano jugando a la taba.', 'Abajo, en letra de orco: «Gorak y yo». Parece viejo.'] },
    'ed_fortaleza_orca.main': { t: 'Un pergamino con sello rojo', l: ['El sello es un cuerno retorcido. No es orco.', '«Cuando la cerradura del monolito se rompa, abriremos el Abismo. Los hombres y los orcos serán nuestros por igual.»'] },
    'ed_granero.main': { t: 'Un papel entre la paja', l: ['«Garufa: no se come los ratones, los junta. Tiene siete en el altillo, en fila. No sé qué está tramando.» — Tobi'] }
  };
  const IDS = Object.keys(NOTAS), TOTAL = IDS.length;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };

  // ------------------------------------------------------------------ el papelito
  const textura = S => {
    if (S.textures.exists('ck_nota')) return;
    const c = document.createElement('canvas'); c.width = 12; c.height = 9;
    const g = c.getContext('2d');
    const px = (col, r) => { g.fillStyle = col; r.forEach(([x, y, w = 1, h = 1]) => g.fillRect(x, y, w, h)); };
    px('#3a2412', [[1, 1, 10, 1], [0, 2, 1, 6], [11, 2, 1, 5], [1, 8, 9, 1], [10, 7, 1, 1]]);
    px('#f1e2bf', [[1, 2, 10, 5], [1, 7, 9, 1]]);
    px('#c9a873', [[2, 3, 7, 1], [2, 5, 6, 1], [9, 6, 2, 1], [10, 2, 1, 1]]);
    px('#8a2a1a', [[8, 6, 2, 2]]);   // el sello
    S.textures.addCanvas('ck_nota', c);
  };

  // ------------------------------------------------------------------ dónde: un rincón al que se llega caminando
  const elegir = (S, zona) => {
    if (!S.navGrid) return null;
    S._navGrids = {};                                   // la grilla de este lugar, recién hecha
    const G = S.navGrid(false); if (!G) return null;
    const c = S.currentInterior, a = c ? c.area : null;
    const sp = a && a.spawn ? a.spawn : { x: 250, y: 340 };
    const ini = S.navNearestCell(G, sp.x, sp.y); if (!ini) return null;
    const W = G.gw, H = G.gh, dist = new Int32Array(W * H).fill(-1), cola = [ini[1] * W + ini[0]];
    dist[cola[0]] = 0;
    for (let q = 0; q < cola.length; q++) {
      const n = cola[q], x = n % W, y = (n / W) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (S.navFreeCell(G, nx, ny)) { const m = ny * W + nx; if (dist[m] < 0) { dist[m] = dist[n] + 1; cola.push(m); } } });
    }
    // evitar los cofres de este lugar
    const cofres = [];
    try { const cp = (fl(st(S)).cofres_pos2 || {})[zona]; (cp || []).forEach(p => p && cofres.push([(a ? a.x : 0) + (p.x || p[0]), (a ? a.y : 0) + (p.y || p[1])])); } catch (e) {}
    // ni al lado de la gente de la historia (que con T hablen ellos)
    const gente = [];
    try { (typeof STORY_NPCS !== 'undefined' ? STORY_NPCS : []).forEach(n => { if (n.zone === zona) gente.push([(a ? a.x : 0) + n.x, (a ? a.y : 0) + n.y]); }); } catch (e) {}
    try { ((a && a.talkers) || []).forEach(t => gente.push([t.x, t.y])); } catch (e) {}
    const ok = [];
    let max = 0;
    cola.forEach(n => {
      const x = n % W, y = (n / W) | 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!S.navFreeCell(G, x + i, y + j)) return;   // con lugar alrededor
      const wx = G.x + x * 8 + 4, wy = G.y + y * 8 + 4;
      if (cofres.some(([cx, cy]) => Math.hypot(cx - wx, cy - wy) < 70)) return;
      if (gente.some(([cx, cy]) => Math.hypot(cx - wx, cy - wy) < 64)) return;
      ok.push([wx, wy, dist[n]]); if (dist[n] > max) max = dist[n];
    });
    const lejos = ok.filter(p => p[2] >= max * 0.7);
    if (!lejos.length) return null;
    let h = 0; for (const ch of zona) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const p = lejos[(h + Math.floor(Math.random() * 7)) % lejos.length];
    const r = { x: Math.round(p[0] - (a ? a.x : 0)), y: Math.round(p[1] - (a ? a.y : 0)) };
    if (a && (r.x < 0 || r.y < 0 || r.x > a.w || r.y > a.h)) return null;   // la grilla no era de este lugar
    return r;
  };

  const quitar = S => { if (S._ckNota) { [S._ckNota.sp, S._ckNota.brillo].forEach(o => o && o.active && o.destroy()); if (S._ckNota.ev) S._ckNota.ev.remove(); } S._ckNota = null; };
  const poner = S => {
    quitar(S);
    const s = st(S); if (!s || !S.player) return;
    const zona = S.currentZoneKey(); if (!NOTAS[zona]) return;
    const f = fl(s), leidas = (f.notas = f.notas || {}), pos = (f.notas_pos = f.notas_pos || {});
    if (leidas[zona]) return;
    if (!pos[zona]) { const p = elegir(S, zona); if (!p) return; pos[zona] = p; S.saveStory && S.saveStory(); }
    textura(S);
    const a = S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 }, x = a.x + pos[zona].x, y = a.y + pos[zona].y;
    const sp = S.add.image(x, y, 'ck_nota').setOrigin(0.5, 1).setDepth(y - 3).setScale(S.currentInterior ? 1 : 0.9).setAngle(-8);
    const brillo = S.add.star(x + 2, y - 7, 4, 1, 3.5, 0xfff6c0).setDepth(y - 2).setAlpha(0).setBlendMode(1);
    const ev = S.time.addEvent({ delay: 2600, loop: true, callback: () => { if (brillo.active) S.tweens.add({ targets: brillo, alpha: { from: 0, to: 0.95 }, angle: 90, duration: 380, yoyo: true }); } });
    S._ckNota = { zona, x, y, sp, brillo, ev };
  };
  const cerca = S => {
    const n = S._ckNota, b = S.player && S.player.body;
    return n && b && Math.hypot(n.x - b.center.x, n.y - b.bottom) < 24 ? n : null;
  };
  const leer = (S, n) => {
    const s = st(S), f = fl(s), N = NOTAS[n.zona];
    f.notas = f.notas || {}; f.notas[n.zona] = true;
    const cuantas = Object.keys(f.notas).filter(k => NOTAS[k]).length;
    son('page_flip', 0.7);
    quitar(S);
    S.openDialog(N.t, N.l.concat([`(Notas encontradas: ${cuantas} de ${TOTAL})`]), null, null);
    if (s.flags) { s.coins = (s.coins || 0) + 5; S.gainXP && S.gainXP(5); }
    S.saveStory && S.saveStory();
  };

  const i0 = P.interact;
  P.interact = function () {
    try { const n = !this.dialogOpen && !this._overlay && cerca(this); if (n && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) { leer(this, n); return; } } catch (e) { console.warn('[notas]', e); }
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const n = !this.dialogOpen && cerca(this), pr = document.getElementById('ck-prompt');
      if (n && pr) { pr.textContent = 'T · Leer'; pr.classList.add('on'); this._ckNotaPrompt = true; }
      else if (this._ckNotaPrompt && pr) { this._ckNotaPrompt = false; if (pr.textContent === 'T · Leer') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };
  // se pone cuando terminó de entrar (puerta, pantalla de carga) y sigue en el mismo lugar
  const cuando = S => {
    quitar(S);
    const z = S.currentZoneKey(), t0 = Date.now();
    const iv = setInterval(() => {
      if (!S.player || S.currentZoneKey() !== z || Date.now() - t0 > 12000) { clearInterval(iv); return; }
      if (S._doorTransition || document.querySelector('.ck-carga.on, #ck-carga.on')) return;
      clearInterval(iv);
      try { poner(S); } catch (e) { console.warn('[notas]', e); }
    }, 350);
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () { const r = area0.apply(this, arguments); try { cuando(this); } catch (e) {} return r; };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () { const r = ald0.apply(this, arguments); try { cuando(this); } catch (e) {} return r; };

  // el diario las cuenta
  const j0 = P.toggleJournal;
  if (j0) P.toggleJournal = function () {
    const r = j0.apply(this, arguments);
    try {
      const el = document.getElementById('ck-journal');
      if (this._overlay === 'ck-journal' && el && this.story) {
        let p = el.querySelector('.ck-jr-notas');
        if (!p) { p = document.createElement('p'); p.className = 'ck-jr-notas'; const ref = el.querySelector('.ck-jr-cofres') || el.querySelector('.ck-jr-map'); (ref && ref.parentNode ? ref.parentNode : el.querySelector('.ck-win') || el).appendChild(p); }
        const n = Object.keys((this.story.flags && this.story.flags.notas) || {}).filter(k => NOTAS[k]).length;
        p.textContent = `Notas encontradas: ${n} de ${TOTAL}`;
      }
    } catch (e) {}
    return r;
  };

  window.CK_NOTAS = { NOTAS, TOTAL, poner, elegir };
})();
