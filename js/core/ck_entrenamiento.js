'use strict';
/* Entrenamiento del Capitán Bruno en el campo de práctica (11/11, pedido del dueño: "cuando el capitán Bruno nos entrena
   que sea en el campo de práctica que está en el medio, onda la cinemática empieza ahí mientras nos entrena y nos va
   mandando qué hacer… hacé que dure un poco más la secuencia… cuando él nos explique qué hacer remarcá las teclas
   importantes o las acciones importantes con mayúsculas y en un rojo más llamativo").
   Cambia el entrenamiento de ck_prologo.js (mismas recompensas y el mismo final):
   - Al hablarle a Bruno la pantalla se va a negro y la escena empieza ADENTRO del campo de práctica (la arena cercada
     del medio del Patio de Armas): Bruno parado en la arena, dos muñecos de práctica puestos para la ocasión y el héroe
     enfrente. Bruno manda desde ahí cada ejercicio; mientras dura, se le habla ahí mismo.
   - Más largo, 6 ejercicios: ATACAR (5 golpes a un muñeco) → COMBO (tres golpes seguidos, dos veces) → PASO RÁPIDO
     (3) → CORRER (una vuelta larga) → tres limos sueltos en la arena → la charla final. Al terminar, Bruno vuelve a
     su puesto y los muñecos se guardan.
   - RESALTADO: en los diálogos, lo que va entre [[dobles corchetes]] sale en MAYÚSCULAS y en rojo fuerte. A Bruno,
     mientras entrena, además se le resaltan solas las teclas que nombra (J, K, ESPACIO, SHIFT, H, Q, E, R, F, C, Z, X,
     M, L, TAB, clic). El objetivo del entrenamiento también las marca. Lo puede usar cualquier diálogo del juego.
   Borrar la línea de index.html vuelve al entrenamiento de antes (con los muñecos de arriba). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_PROLOGO || !window.CK_ESCENA) return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA, ent = window.CK_PROLOGO.entreno;
  const ZE = 'castle.training';
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = S => (S.story.flags = S.story.flags || {});
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const CAP = typeof STORY_NPCS !== 'undefined' && STORY_NPCS.find(n => n.id === 'captain');
  // el campo de práctica (la arena cercada del medio; coordenadas del mapa)
  const CAMPO = { heroe: [582, 338], bruno: [634, 302], munecos: [[540, 296], [676, 296]], limos: [[536, 262], [680, 262], [606, 250]] };

  // ================================================================== resaltado de teclas y acciones
  const css = document.createElement('style'); css.id = 'ck-clave-css';
  css.textContent = '.ck-clave { color: #e0180a; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; text-shadow: 0 1px 0 rgba(255, 240, 210, .55); }\n' +
    '#ck-objective .ck-clave { color: #c8140a; }';
  document.head.append(css);
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /** Texto con [[marcas]] (puede estar a medio escribir) → HTML con lo marcado en rojo y mayúsculas. */
  const marcar = t => {
    let h = esc(t).replace(/\[\[([^\[\]]*)\]\]/g, '<b class="ck-clave">$1</b>');
    h = h.replace(/\[\[([^\[\]]*)\]?$/, '<b class="ck-clave">$1</b>');   // una marca todavía sin cerrar
    return h.replace(/\[$/, '');
  };
  const TECLAS = /(^|[^\[\wáéíóúñ])(ESPACIO|SHIFT|TAB|J|K|H|Q|E|R|F|C|Z|X|M|L)(?![\wáéíóúñ\]])/g;
  /** Marca solas las teclas que se nombran sueltas y los clics. */
  const auto = t => String(t).replace(/\bclic derecho\b/gi, '[[clic derecho]]').replace(/\bclic\b(?! derecho)(?!\]\])/gi, '[[clic]]').replace(TECLAS, '$1[[$2]]');
  const rd0 = P.renderDialog;
  P.renderDialog = function () {
    const r = rd0.apply(this, arguments);
    try {
      const d = this._dlg, box = document.getElementById('ck-dialog'), el = box && box.querySelector('.ck-dlg-text');
      if (d && el) { const t = d.lines[d.i].slice(0, d.shown); if (t.indexOf('[') >= 0) el.innerHTML = marcar(t); }
    } catch (e) {}
    return r;
  };
  const od0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    try {
      const s = st(this);
      if (s && name === 'Capitán Bruno' && s.step === 1 && !fl(this).entrenado && Array.isArray(lines)) lines = lines.map(auto);
    } catch (e) {}
    return od0.call(this, name, lines, onEnd, face);
  };
  window.CK_RESALTE = { marcar, auto };
  if (!ent) return;

  // ================================================================== la escena en el campo
  const area = S => S.currentInterior && S.currentInterior.area;
  const bruno = S => {
    const a = area(S); if (!a) return null;
    const q = S._ckEnt && S._ckEnt.bruno; if (q && q.sp && q.sp.active) return q.sp;
    let m = null, md = 90;
    S.children.list.forEach(o => {
      if (!o.active || !o.visible || o.type !== 'Sprite' || !/^g_knight/.test((o.texture && o.texture.key) || '')) return;
      const d = Math.hypot(o.x - (a.x + (CAP ? CAP.x : 452)), o.y - (a.y + (CAP ? CAP.y : 168))); if (d < md) { md = d; m = o; }
    });
    return m;
  };
  const munecos0 = ent.muñecos.bind(ent);
  const cuerpo = (S, x, y, w, h) => { const z = S.add.zone(x, y, w, h); S.physics.add.existing(z, true); if (S.interiorObstacles) S.interiorObstacles.add(z); return z; };
  const armarCampo = S => {
    const a = area(S); if (!a) return;
    const T = (S._ckEnt = { clones: [], cuerpos: [], bruno: null, cap: null });
    // Bruno a la arena
    const sp = bruno(S);
    if (sp) {
      T.bruno = { sp, x: sp.x, y: sp.y, d: sp.depth, flip: sp.flipX };
      sp.setPosition(a.x + CAMPO.bruno[0], a.y + CAMPO.bruno[1]).setDepth(a.y + CAMPO.bruno[1]).setFlipX(true);
    }
    if (CAP) { T.cap = { x: CAP.x, y: CAP.y }; try { CAP.x = CAMPO.bruno[0]; CAP.y = CAMPO.bruno[1]; } catch (e) {} }
    // dos muñecos de práctica (copias del primero de los de arriba)
    const g = munecos0(S)[0];
    if (g) CAMPO.munecos.forEach(([mx, my]) => {
      const dx = a.x + mx - g.x, dy = a.y + my - g.y, piezas = [];
      g.piezas.forEach(o => {
        const c = S.add.image(o.x + dx, o.y + dy, o.texture.key, o.frame.name).setOrigin(o.originX, o.originY).setScale(o.scaleX, o.scaleY).setDepth(o.depth + dy).setFlipX(o.flipX).setAlpha(0);
        S.tweens.add({ targets: c, alpha: 1, duration: 300 });
        piezas.push(c);
      });
      T.clones.push({ piezas, x: a.x + mx, y: a.y + my, y0: g.y0 + dy });
      T.cuerpos.push(cuerpo(S, a.x + mx, a.y + my - 3, 12, 7));
    });
  };
  const desarmarCampo = S => {
    const T = S._ckEnt; if (!T) return; S._ckEnt = null;
    T.clones.forEach(q => q.piezas.forEach(o => { try { o.destroy(); } catch (e) {} }));
    T.cuerpos.forEach(z => { try { z.destroy(); } catch (e) {} });
    if (T.bruno && T.bruno.sp && T.bruno.sp.active) T.bruno.sp.setPosition(T.bruno.x, T.bruno.y).setDepth(T.bruno.d).setFlipX(T.bruno.flip);
    if (T.cap && CAP) { try { CAP.x = T.cap.x; CAP.y = T.cap.y; } catch (e) {} }
  };
  ent.muñecos = S => (S._ckEnt ? S._ckEnt.clones : munecos0(S));

  // ------------------------------------------------------------------ los ejercicios
  ent.texto = {
    ida: () => 'Entrenamiento: al campo de práctica',
    golpes: e => `Entrenamiento: [[atacar]] un muñeco ([[J]] o [[clic]]) · ${e.n}/5`,
    combo: e => `Entrenamiento: [[combo]] de tres golpes seguidos ([[J]] [[J]] [[J]]) · ${e.n}/2`,
    dash: e => `Entrenamiento: [[paso rápido]] ([[espacio]]) · ${e.n}/3`,
    correr: () => 'Entrenamiento: [[correr]] una vuelta al campo (mantené [[shift]])',
    limos: e => `Entrenamiento: vencé a los limos del campo · ${e.n}/3`,
    charla: () => 'Entrenamiento: escuchá al Capitán Bruno'
  };
  ent.recordatorio = S => {
    const f = S._ckEntreno && S._ckEntreno.fase;
    return { golpes: 'Dale, pegale al muñeco: [[J]] o [[clic]]. No muerde.', combo: 'Tres seguidos, sin frenar: [[J]], [[J]], [[J]].', dash: 'El [[paso rápido]]: [[espacio]], para el lado que quieras.',
      correr: 'Mantené [[shift]] mientras caminás. ¡Más rápido, recluta!', limos: 'Los limos son lentos, pero si te tocan, duele. ¡Dale!', charla: 'Vení, que te cuento lo que falta.' }[f] || '¡Atento!';
  };
  ent.empezar = function (S) {
    if (S._ckEntreno) return;
    const a = area(S); if (!a) return;
    S._ckEntreno = { fase: 'ida', n: 0, ultimo: 0, corre: 0, racha: 0 };
    S.updateObjective();
    E.correr(S, async () => {
      const cam = S.cameras.main;
      cam.fadeOut(450, 0, 0, 0);
      await E.esperar(560);
      armarCampo(S);
      S.placePlayerFeetAt(a.x + CAMPO.heroe[0], a.y + CAMPO.heroe[1]);
      if (S.player) { S.player.setFlipX(false); S.facingDirection = 'right'; S.facingV = null; }
      cam.centerOn(S.player.x, S.player.y - 20);
      await E.esperar(250);
      cam.fadeIn(700, 0, 0, 0);
      await E.esperar(800);
      const b = bruno(S);
      if (b) await E.globo(S, b, '¡Al campo de práctica, recluta!', 1700);
      await E.dialogo(S, 'Capitán Bruno', [
        'Éste es el campo de práctica. Acá adentro nadie te mira… salvo yo.',
        'Te voy a ir diciendo qué hacer. Vos hacelo. Si te sale, pasamos a lo siguiente.',
        'Primero: [[atacar]]. Pegale a uno de los muñecos con la espada: J o clic. Cinco golpes.'
      ], 'g_knight_idle');
    }).then(() => { const e = S._ckEntreno; if (e && e.fase === 'ida') { e.fase = 'golpes'; e.n = 0; S.updateObjective(); } });
  };
  ent.golpe = function (S) {
    const e = S._ckEntreno; if (!e || (e.fase !== 'golpes' && e.fase !== 'combo')) return;
    const now = S.time.now;
    if (now - e.ultimo < 240) return;
    const b = S.player.body; if (!b) return;
    const m = this.muñecos(S).find(q => Math.abs(q.x - b.center.x) < 32 && b.center.y - q.y < 42 && b.center.y - q.y > -28);
    if (!m) { e.racha = 0; return; }
    const seguido = now - e.ultimo < 900;
    e.ultimo = now;
    m.piezas.forEach(o => { const x0 = o.x; S.tweens.add({ targets: o, x: x0 + 1.5, duration: 45, yoyo: true, repeat: 2, onComplete: () => o.setX(x0) }); });
    son('bone_hit', 0.5, { rate: 0.6 });
    if (e.fase === 'golpes') {
      e.n++; S.createFloatingText(m.x, m.y0 + 4, '¡Toc!', 0xfde68a); S.updateObjective();
      if (e.n >= 5) this.avanzar(S, 'combo', [
        '¡Eso! Pegás como un herrero enojado. Bien.',
        'Ahora el [[combo]]: tres golpes seguidos, sin frenar. J, J, J. Así no les das respiro.',
        'Haceme dos combos enteros.'
      ], () => { e.racha = 0; });
      return;
    }
    e.racha = seguido ? e.racha + 1 : 1;
    S.createFloatingText(m.x, m.y0 + 4, e.racha >= 3 ? '¡COMBO!' : String(e.racha), e.racha >= 3 ? 0xfca5a5 : 0xfde68a);
    if (e.racha >= 3) {
      e.racha = 0; e.n++; S.updateObjective();
      if (e.n >= 2) this.avanzar(S, 'dash', [
        'Bien. Ahora lo importante: no quedarte quieto.',
        'El [[paso rápido]]: con ESPACIO saltás un trecho para el lado que estés yendo, y mientras dura no te pegan.',
        'Cansa: gasta [[aguante]], la barra amarilla. Hacé tres, para donde quieras.'
      ], () => { try { window.CK_PROGRESO && CK_PROGRESO.darDash(S); } catch (er) {} });
    }
  };
  ent.dash = function (S) {
    const e = S._ckEntreno; if (!e || e.fase !== 'dash') return;
    e.n++; S.updateObjective();
    if (e.n >= 3) this.avanzar(S, 'correr', [
      'Bien. Y para ir lejos, [[correr]]: mantené SHIFT mientras caminás.',
      'Dale una vuelta al campo. Correr no cansa, pero se escucha: las bestias te ven venir.'
    ]);
  };
  ent.cuadro = function (S, dt) {
    const e = S._ckEntreno; if (!e || S.currentZoneKey() !== ZE) return;
    if (e.fase === 'correr' && !S.dialogOpen) {
      const b = S.player.body;
      if (S.isRunning && b && b.speed > 60) e.corre += dt;
      if (e.corre > 2400) this.avanzar(S, 'limos', [
        '¡Así se corre! Ahora, de verdad.',
        'Tenemos tres limos del pantano para que practiquen los reclutas. Son lentos, pero si te tocan, duele.',
        'Acordate: [[atacar]] con J y [[paso rápido]] con ESPACIO para salir de abajo. ¡Larguen los limos!'
      ], () => this.limos(S));
    }
    if (e.fase === 'limos') {
      const todos = S._ckEntrenoLimos || [], vivos = todos.filter(x => x && x.active && !x.isDead);
      const n = todos.length - vivos.length; if (n !== e.n) { e.n = n; S.updateObjective(); }
      if (S._ckEntrenoLimos && !vivos.length && !e.cerrando) {
        e.cerrando = true;
        this.avanzar(S, 'charla', ['¡Muy bien, recluta! Ahora escuchá, que te cuento lo que falta.'], () => { e.cerrando = false; this.charla(S); });
      }
    }
  };
  ent.limos = function (S) {
    const a = area(S); if (!a) return;
    S._ckPermitirBestias = true;
    try {
      S._ckEntrenoLimos = CAMPO.limos.map(([x, y]) => {
        const en = S.spawnEnemy(a.x + x, a.y + y - 26, 'slime');
        if (en) { en.zone = ZE; en._ckEntreno = true; S.time.delayedCall(800, () => en.active && S.alertEnemy && S.alertEnemy(en)); }
        return en;
      }).filter(Boolean);
    } finally { S._ckPermitirBestias = false; }
    const b = bruno(S); if (b) E.globo(S, b, '¡Larguen los limos!', 1500);
  };
  // al terminar: Bruno vuelve a su puesto y los muñecos se guardan
  const term0 = ent.terminar.bind(ent);
  ent.terminar = function (S) {
    const r = term0(S);
    try {
      if (S._ckEnt) {
        const cam = S.cameras.main;
        S.time.delayedCall(1400, () => {
          if (!S._ckEnt) return;
          cam.fadeOut(350, 0, 0, 0);
          S.time.delayedCall(420, () => { desarmarCampo(S); cam.fadeIn(450, 0, 0, 0); });
        });
      }
    } catch (e) { desarmarCampo(S); }
    return r;
  };
  // si se va del Patio de Armas a la mitad: todo vuelve a su lugar (el entrenamiento se retoma de cero)
  const cambio0 = ent.cambio.bind(ent);
  ent.cambio = function (S) {
    const antes = !!S._ckEntreno, r = cambio0(S);
    try { if (S._ckEnt && (!S._ckEntreno || !antes) && S.currentZoneKey() !== ZE) desarmarCampo(S); } catch (e) {}
    return r;
  };
  // lo que dice Bruno la primera vez (ya no manda a los muñecos de arriba)
  if (CAP) {
    const l0 = CAP.lines;
    CAP.lines = function (s, hero) {
      const r = l0.apply(this, arguments);
      try {
        if (s && s.flags && s.flags.v2 && s.step === 1 && !s.flags.entrenado && Array.isArray(r) && r.length === 3 && /muñecos de allá arriba/.test(r[2]))
          r[2] = 'Vamos al campo de práctica, el del medio del patio. Ahí te quiero ver.';
      } catch (e) {}
      return r;
    };
  }
  // el objetivo del entrenamiento, con las teclas marcadas
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text');
      if (t && this._ckEntreno && t.textContent.indexOf('[[') >= 0) t.innerHTML = marcar(t.textContent);
    } catch (e) {}
    return r;
  };
  window.CK_ENTRENAMIENTO = { CAMPO, armarCampo, desarmarCampo };
})();
