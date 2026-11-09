'use strict';
/* Arranque suave y habilidades que se ganan (10/11, pedido del dueño: "que los primeros enemigos sean solo murciélagos y
   slimes; el jugador al empezar no va a tener muchas habilidades, solo caminar y golpe básico, pero puede mejorar al ir
   subiendo de nivel e ir desbloqueando; al principio enemigos débiles para ir practicando").
   Sólo en las partidas NUEVAS de campaña (story.flags.v2). Las partidas que ya existían siguen como estaban.
   - Al empezar: caminar y golpe básico (J / clic).
   - Correr (Shift) y el paso rápido (dash, Espacio): te los enseña el Capitán Bruno en el entrenamiento (ck_prologo.js).
   - Parada (C): nivel 2. Golpe fuerte (K / clic derecho): nivel 3. Ranuras Q, E, R y F: niveles 4, 5, 6 y 7.
     (el árbol H se puede usar desde el principio: lo que se aprende se equipa cuando la ranura se abre)
   - Al ganar una, sale el cartel "¡Nueva habilidad!" con su tecla. Si apretás una que todavía no tenés, una nota chica
     dice cuándo se aprende. En la barra de abajo las ranuras cerradas muestran un candado y el nivel.
   - Bestias: hasta terminar el entrenamiento no aparece ninguna (el prólogo es tranquilo). Después, hasta salir para
     Brumavieja (paso 4), sólo murciélagos y limos: las más fuertes se cambian por ellos.
   Borrar su línea de index.html saca todo esto (se juega con todo desde el principio). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PRUEBAS = /[?&]pruebas=1/.test(location.search);

  const NIVEL = { parada: 2, especial: 3, q: 4, e: 5, r: 6, f: 7 };
  const NOMBRE = {
    correr: ['Correr', 'mantené SHIFT'], dash: ['Paso rápido', 'ESPACIO'], parada: ['Parada', 'C, justo antes del golpe'],
    especial: ['Golpe fuerte', 'K o clic derecho'], q: ['Primera ranura', 'Q'], e: ['Segunda ranura', 'E'], r: ['Tercera ranura', 'R'], f: ['Cuarta ranura', 'F']
  };
  const RANURA = ['q', 'e', 'r', 'f'];

  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const nueva = S => { const s = st(S); return !!(s && s.flags && s.flags.v2); };
  const nivel = S => (st(S) && st(S).level) || 1;
  /** true si la habilidad todavía no se aprendió (sólo en partidas nuevas). */
  const bloqueado = (S, k) => {
    if (!nueva(S)) return false;
    const f = st(S).flags;
    if (k === 'correr' || k === 'dash') return !f.dash;
    return NIVEL[k] ? nivel(S) < NIVEL[k] : false;
  };
  const nota = t => { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(t); } catch (e) {} };
  const avisos = {};
  const avisar = (S, k) => {
    const now = performance.now();
    if (avisos[k] && now - avisos[k] < 2500) return;
    avisos[k] = now;
    const n = NOMBRE[k] || [k, ''];
    nota(k === 'correr' || k === 'dash' ? `${n[0]}: te lo enseña el Capitán Bruno en el Patio de Armas` : `${n[0]} (${n[1].split(',')[0]}): se aprende en el nivel ${NIVEL[k]}`);
  };

  // ------------------------------------------------------------------ partida nueva = v2
  const ini0 = P.initStory;
  P.initStory = function () {
    let nuevaPartida = false;
    try { nuevaPartida = !this.loadSave()[this.playerHero]; } catch (e) {}
    const r = ini0.apply(this, arguments);
    try {
      const s = this.story;
      if (s && nuevaPartida && !PRUEBAS && this._gameMode === 'campaign') {
        s.flags = s.flags || {};
        s.flags.v2 = true;
        s.flags.hab_vistas = s.flags.hab_vistas || {};
        this.saveStory && this.saveStory();
      }
    } catch (e) { console.warn('[progreso]', e); }
    return r;
  };

  // ------------------------------------------------------------------ candados
  const da0 = P.performDash;
  P.performDash = function () {
    if (bloqueado(this, 'dash')) { if (!this.isDead && !this.dialogOpen) avisar(this, 'dash'); return; }
    return da0.apply(this, arguments);
  };
  const sp0 = P.performSpecialAttack;
  P.performSpecialAttack = function () {
    if (bloqueado(this, 'especial')) { if (!this.isDead && !this.dialogOpen && !this._ckEscena) avisar(this, 'especial'); return; }
    return sp0.apply(this, arguments);
  };
  const pa0 = P.performParry;
  if (pa0) P.performParry = function () {
    if (bloqueado(this, 'parada')) { if (!this.isDead && !this.dialogOpen) avisar(this, 'parada'); return; }
    return pa0.apply(this, arguments);
  };
  // correr: mientras no se aprende, Shift no cuenta
  const mov0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    const kr = this.keyRun;
    if (kr && kr.isDown && bloqueado(this, 'correr')) {
      const d = kr.isDown;
      kr.isDown = false;
      try { return mov0.apply(this, arguments); } finally { kr.isDown = d; if (!this.dialogOpen && !this._ckEscena && this.player && this.player.body && this.player.body.speed > 1) avisar(this, 'correr'); }
    }
    return mov0.apply(this, arguments);
  };
  // ranuras Q E R F (las arma ck_habilidades_equipo.js en rebindControls): antes de usarlas se mira el nivel
  const envolverRanuras = S => {
    (S._ckRanTeclas || []).forEach((k, i) => {
      if (!k || k.listeners('down').some(f => f._ckProg)) return;
      const orig = k.listeners('down');
      k.removeAllListeners('down');
      const fn = function () {
        const id = RANURA[i];
        if (bloqueado(S, id)) { if (!S.dialogOpen && !S.isDead) avisar(S, id); return; }
        orig.forEach(f => f.apply(this, arguments));
      };
      fn._ckProg = true;
      k.on('down', fn);
    });
  };
  const rb0 = P.rebindControls;
  P.rebindControls = function () {
    const r = rb0.apply(this, arguments);
    try { envolverRanuras(this); } catch (e) { console.warn('[progreso]', e); }
    return r;
  };

  // ------------------------------------------------------------------ "¡Nueva habilidad!"
  const cartel = (S, k) => {
    const n = NOMBRE[k]; if (!n) return;
    try {
      S.showZoneTitle && S.showZoneTitle('¡Nueva habilidad!', n[0] + ' · ' + n[1].toUpperCase());
      S.player && S.createFloatingText(S.player.x, S.player.y - 58, '✦ ' + n[0].toUpperCase() + ' ✦', 0x93c5fd);
      typeof sfx !== 'undefined' && (sfx.fx('level_up', 0.6, { rate: 1.2 }) || sfx.fx('book_clasp', 0.6));
    } catch (e) {}
  };
  const revisar = S => {
    if (!nueva(S)) return;
    const f = st(S).flags, vistas = (f.hab_vistas = f.hab_vistas || {});
    const nuevas = Object.keys(NIVEL).filter(k => !vistas[k] && !bloqueado(S, k));
    nuevas.forEach((k, i) => { vistas[k] = true; S.time.delayedCall(1200 + i * 3600, () => cartel(S, k)); });
    if (nuevas.length) S.saveStory && S.saveStory();
  };
  const xp0 = P.gainXP;
  P.gainXP = function () {
    const r = xp0.apply(this, arguments);
    try { revisar(this); } catch (e) {}
    return r;
  };

  /** El entrenamiento llama a esto: correr y paso rápido. */
  const darDash = S => {
    const s = st(S); if (!s) return;
    s.flags.dash = true;
    cartel(S, 'dash');
    S.time.delayedCall(3800, () => cartel(S, 'correr'));
    S.saveStory && S.saveStory();
  };

  // ------------------------------------------------------------------ candados en la barra de abajo
  const css = () => {
    if (document.getElementById('ck-progreso-css')) return;
    const s = document.createElement('style'); s.id = 'ck-progreso-css';
    s.textContent = `
#ckh .ran.ck-bloq img { filter: grayscale(1) brightness(.35); }
#ckh .ran.ck-bloq::after { content: attr(data-nv) !important; position: absolute !important; left: 0 !important; right: 0 !important; top: 56% !important; width: auto !important; height: auto !important;
  background: none !important; transform: translateY(-50%) !important; text-align: center; font: 700 12px var(--ck2-f, Georgia, serif); color: #f3ead9; text-shadow: 0 1px 0 #000, 0 0 3px #000; pointer-events: none; }
#ckh .ran.ck-bloq::before { content: ''; position: absolute; inset: auto; left: 50%; top: 20%; box-shadow: 0 1px 0 #000; width: 10px; height: 8px; transform: translateX(-50%);
  border: 2px solid #d8c9a8; border-bottom: none; border-radius: 6px 6px 0 0; pointer-events: none; box-shadow: 0 1px 0 #000; }`;
    document.head.appendChild(s);
  };
  setInterval(() => {
    try {
      const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(x => x.startCampaign));
      const caja = document.getElementById('ckh'); if (!caja) return;
      css();
      caja.querySelectorAll('.ran.hab').forEach(r => {
        const id = RANURA[+r.dataset.i], b = S && bloqueado(S, id);
        r.classList.toggle('ck-bloq', !!b);
        if (b) r.dataset.nv = 'Nv ' + NIVEL[id]; else delete r.dataset.nv;
      });
      const pr = caja.querySelector('.ran.it[data-k="parada"]');
      if (pr) { const b = S && bloqueado(S, 'parada'); pr.classList.toggle('ck-bloq', !!b); if (b) pr.dataset.nv = 'Nv ' + NIVEL.parada; else delete pr.dataset.nv; }
    } catch (e) {}
  }, 400);

  // ------------------------------------------------------------------ bestias del principio
  const FUERTES = /^(werewolf|werebear|orc|skeleton|warg|boar)/;
  const sp_0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, tipo) {
    try {
      const s = st(this);
      if (s && nueva(this) && !this._ckPermitirBestias) {
        const def = typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[tipo];
        if (!s.flags.entrenado) return null;                       // el prólogo es tranquilo
        if (s.step < 4 && def && !def.boss && FUERTES.test(tipo)) arguments[2] = Math.random() < 0.5 ? 'slime' : 'bat';
      }
    } catch (e) {}
    return sp_0.apply(this, arguments);
  };

  // las ayudas de una sola vez (ck_ayudas.js) no nombran lo que todavía no se aprendió
  const AY = window.CK_AYUDAS && window.CK_AYUDAS.AYUDAS;
  if (AY) {
    const tecla = id => { try { return KeybindsManager.formatKeyDisplay(KeybindsManager.get(id)); } catch (e) { return id; } };
    const escena = () => window.activeGameScene;
    const m0 = AY.mover, p0 = AY.pelear;
    if (m0) AY.mover = () => (bloqueado(escena(), 'correr') ? 'Moverse: <b>flechas</b> o <b>WASD</b>' : m0());
    if (p0) AY.pelear = () => {
      const S = escena(); if (!nueva(S)) return p0();
      const l = [`Atacar: <b>${tecla('attack')}</b> o clic`];
      if (!bloqueado(S, 'especial')) l.push(`Especial: <b>${tecla('special')}</b>`);
      if (!bloqueado(S, 'dash')) l.push(`Esquivar: <b>${tecla('dash')}</b>`);
      return '¡Una bestia! ' + l.join(' · ');
    };
  }

  window.CK_PROGRESO = { NIVEL, NOMBRE, nueva, bloqueado, darDash, revisar, cartel };
})();
