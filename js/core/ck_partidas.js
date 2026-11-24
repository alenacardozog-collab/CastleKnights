'use strict';
/* Partidas guardadas: 3 ranuras con nombre.
   - CONTINUAR en el menú principal (si hay alguna partida): sigue la última, en el lugar donde quedaste.
   - CAMPAÑA abre las ranuras: continuar, empezar una nueva (pide un nombre) o borrar.
   - Se guarda solo: cada avance de la historia, y el lugar y el tiempo jugado cada pocos segundos.
   - Las partidas viejas (una por héroe) pasan solas a las ranuras la primera vez.
   Sacar la línea de index.html vuelve al guardado de antes (las partidas viejas siguen ahí).
   v2 (22/11, pedido del dueño: "necesito tótems de checkpoint para guardar partida… cuando recargo una partida igual me deja
   en un punto avanzado al que dejé guardado o las animaciones no cargan o se bugea; pulí el sistema de guardado acorde al
   mapa y al juego, que carguen las cosas, y para cuando necesitamos reintentar"):
   - YA NO SE GUARDA SOLO. La partida se guarda en los TÓTEMS (ck_totems.js) con CK_PARTIDAS.guardarAqui: la historia
     entera (una copia), el lugar del tótem, el héroe, la vida y las pociones. Al empezar una partida nueva se guarda el
     arranque. Antes se guardaban la historia en cada avance y el lugar cada 5 s por separado: al cargar, el lugar podía ser
     de más adelante que la historia (o de la mitad de una escena) y se rompían cosas.
   - CONTINUAR (y "Reiniciar" en la pausa) vuelve al último guardado: la historia de ese momento y frente a su tótem.
   - LA LLEGADA: mientras se carga el lugar guardado la pantalla queda negra y no arrancan escenas ni charlas de la aldea
     (antes, en el medio segundo en la aldea podía empezar la payada de Don Anselmo y seguir en otro mapa).
   - El tiempo jugado se suma al guardar. CK_PARTIDAS: guardarAqui, activa, ranura, lugarActual, sinGuardar.
   - Sin ck_totems.js (si se borra su línea) se guarda solo como antes (la historia en cada avance y el lugar cada 5 s);
     la llegada con pantalla negra queda igual. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof SAVE_KEY === 'undefined') return;
  const P = MainGameScene.prototype;
  const K = 'castleknight_ranuras_v1',
    N = 3;

  // ------------------------------------------------------------------ almacenamiento
  const leer = () => {
    try {
      const a = JSON.parse(localStorage.getItem(K) || 'null');
      if (Array.isArray(a)) return a.concat([null, null, null]).slice(0, N);
    } catch (e) {}
    return [null, null, null];
  };
  const escribir = a => {
    try {
      localStorage.setItem(K, JSON.stringify(a));
    } catch (e) {}
  };
  const nombreHeroe = h => {
    const x = (typeof HEROES !== 'undefined' && HEROES[h]) || null;
    return x ? x.name.charAt(0) + x.name.slice(1).toLowerCase() : h || '';
  };
  const llena = r => !!(r && r.story && r.heroe);
  // la primera vez: las partidas viejas (una por héroe) pasan a las ranuras
  (function migrar() {
    try {
      if (localStorage.getItem(K)) return;
      const v = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {};
      const hs = Object.keys(v)
        .filter(h => h[0] !== '_' && v[h] && typeof v[h] === 'object' && v[h].step !== undefined)
        .sort((a, b) => (v[b].savedAt || 0) - (v[a].savedAt || 0))
        .slice(0, N);
      if (!hs.length) return;
      const r = [null, null, null];
      hs.forEach((h, i) => (r[i] = { nombre: 'Partida de ' + nombreHeroe(h), heroe: h, story: v[h], fecha: v[h].savedAt || Date.now(), tiempo: 0, lugar: null }));
      escribir(r);
    } catch (e) {}
  })();

  let activa = null, // ranura en uso
    nueva = null; // { i, nombre } mientras se elige héroe para una partida nueva

  // ------------------------------------------------------------------ el juego guarda en la ranura
  const cargar0 = P.loadSave;
  P.loadSave = function () {
    const o = cargar0.apply(this, arguments);
    if (activa === null || this._ckSinRanuras) return o;
    const r = leer()[activa],
      out = Object.assign({}, o);
    // con una ranura en uso sólo cuenta lo de esa ranura: antes, al elegir otro héroe en una partida nueva aparecían las
    // partidas viejas de ese héroe (botón "¡CONTINUAR AVENTURA!" y "NUEVA PARTIDA (nivel…)") aunque empezaras de cero
    Object.keys(out).forEach(h => { if (h[0] !== '_') out[h] = undefined; });
    if (!nueva && r && r.heroe && r.story) out[r.heroe] = r.story;
    out[this.playerHero] = !nueva && r && r.heroe === this.playerHero && r.story ? r.story : undefined;
    return out;
  };
  // desbloquear al orco guarda "todo lo de loadSave": que use lo de verdad y no borre las partidas viejas
  const desbloquear0 = P.unlockHero;
  if (desbloquear0)
    P.unlockHero = function () {
      this._ckSinRanuras = true;
      try {
        return desbloquear0.apply(this, arguments);
      } finally {
        this._ckSinRanuras = false;
      }
    };
  const lugarActual = s => {
    if (!s.player || !s.player.body) return null;
    const z = s.currentZoneKey(),
      c = s.currentInterior,
      b = s.player.body,
      x = Math.round(b.center.x),
      y = Math.round(b.bottom);
    if (!c) return { zona: 'village', x, y };
    if (/^(ed_.+\.main|castle\.\w+|ruins\.\w+)$/.test(z)) return { zona: z, x: x - c.area.x, y: y - c.area.y };
    const ret = s._interiorReturn; // casas por dentro: volvés frente a la puerta
    return ret ? { zona: 'village', x: Math.round(ret.x), y: Math.round(ret.y) } : null;
  };
  // sinLugar: guardar la historia sin tocar el lugar (al continuar, el héroe todavía no llegó adonde había quedado)
  const guardar = (s, conHistoria, sinLugar) => {
    if (activa === null || s._gameMode !== 'campaign' || !s.story) return;
    const r = leer();
    let slot = r[activa];
    if (nueva) {
      slot = { nombre: nueva.nombre, heroe: s.playerHero, story: null, fecha: Date.now(), tiempo: 0, lugar: null };
      nueva = null;
    }
    if (!slot) return;
    if (conHistoria || !slot.story) slot.story = Object.assign({}, s.story, { savedAt: Date.now() });
    slot.heroe = s.playerHero;
    slot.fecha = Date.now();
    const l = sinLugar ? null : lugarActual(s);
    if (l) slot.lugar = l;
    slot.tiempo = Math.round((slot.tiempo || 0) + (s._ckJugado || 0));
    s._ckJugado = 0;
    r[activa] = slot;
    escribir(r);
  };
  const guardarHistoria0 = P.saveStory;
  const conTotems = () => !!window.CK_TOTEMS;   // (v2) sin tótems, el guardado de antes
  // (v2) ¿hay algo sin guardar? Se compara lo que importa de la historia (paso, nivel, monedas, pociones, misiones, cofres
  // abiertos...) con lo del último guardado. No cuentan lo que el juego anota solo al llegar o al caminar (dónde van los
  // cofres y las notas, el mapa descubierto, las ayudas vistas): si no, siempre diría que hay cosas sin guardar.
  const AUTO = /(_pos\d*|_rev)$|^(ayudas|hab_vistas|gente|notas_cofre|carga_vistos|terrenoRoto|presentados)$/;
  // (lo vacío tampoco: {} o ceros o false que el juego arma al llegar a un lugar)
  const vacio = v => v == null || v === false || v === 0 || v === '' ||
    (Array.isArray(v) ? v.every(vacio) : typeof v === 'object' ? Object.keys(v).every(k => vacio(v[k])) : false);
  const firma = st => {
    try {
      if (!st) return '';
      const f = {}; Object.keys(st.flags || {}).sort().forEach(k => { if (!AUTO.test(k) && !vacio(st.flags[k])) f[k] = st.flags[k]; });
      return JSON.stringify([st.step, st.count, st.level, st.xp, st.coins, st.maxHealth, st.inv, st.up, f]);
    } catch (e) { return ''; }
  };
  const marcarGuardado = s => { s._ckFirma = firma(s.story); s._ckSinGuardar = false; };
  const sinGuardar = s => !!(s && s.story && (s._ckFirma !== undefined ? firma(s.story) !== s._ckFirma : s._ckSinGuardar));
  P.saveStory = function () {
    if (activa === null) return guardarHistoria0.apply(this, arguments);
    // (v2) no se escribe: la partida se guarda en los tótems. Sólo la partida nueva guarda su arranque.
    if (!conTotems()) { guardar(this, true); return; }
    if (nueva) { guardar(this, true, true); return; }
    this._ckSinGuardar = true;
  };
  // (v2) guardar acá (los tótems): la historia entera (copia), el lugar dado y el resto. true si se guardó.
  const guardarAqui = (s, lugar) => {
    if (activa === null || s._gameMode !== 'campaign' || !s.story) return false;
    const r = leer();
    const slot = r[activa] || { nombre: 'Partida ' + (activa + 1), heroe: s.playerHero, tiempo: 0 };
    let copia; try { copia = JSON.parse(JSON.stringify(s.story)); } catch (e) { return false; }
    copia.savedAt = Date.now(); copia.maxHealth = s.maxHealth || copia.maxHealth;
    slot.story = copia; slot.heroe = s.playerHero; slot.fecha = Date.now();
    slot.lugar = lugar || lugarActual(s);
    slot.hora = s.dayClock || 0;
    slot.tiempo = Math.round((slot.tiempo || 0) + (s._ckJugado || 0)); s._ckJugado = 0;
    r[activa] = slot; escribir(r);
    // (si una prueba del panel no deja escribir, no quedó guardado)
    const ok = (() => { const x = leer()[activa]; return !!(x && x.story && x.story.savedAt === copia.savedAt); })();
    if (ok) marcarGuardado(s);
    return ok;
  };
  const borrar0 = P.deleteSave;
  P.deleteSave = function (hero) {
    if (activa === null) return borrar0.apply(this, arguments);
    const r = leer();
    if (r[activa] && r[activa].heroe === hero) {
      r[activa].story = null;
      escribir(r);
    }
  };

  // al empezar: la ranura queda atada al héroe y, si venías a continuar, vas al lugar donde quedaste
  const iniciar0 = P.initStory;
  P.initStory = function () {
    const r = iniciar0.apply(this, arguments);
    if (activa === null) return r;
    const lugar = this._ckIrA;
    this._ckIrA = null;
    const esNueva = !!nueva;
    if (!conTotems()) guardar(this, true, !!lugar);
    else if (esNueva) guardar(this, true, true);       // (v2) la partida nueva guarda su arranque; al continuar no se escribe nada
    marcarGuardado(this); this._ckJugado = 0;
    const slot = leer()[activa];
    if (slot && slot.hora && !esNueva) this.dayClock = slot.hora;
    if (slot) this.time.delayedCall(1600, () => this.story && this.showZoneTitle(esNueva ? 'Capítulo 1 · La niebla del norte' : 'Partida recuperada', '«' + slot.nombre + '»'));
    if (lugar && lugar.zona !== 'village' && lugar.zona) { llegada(this, true); this.time.delayedCall(300, () => irA(this, lugar, 0)); }
    else if (lugar) { llegada(this, true); this.time.delayedCall(100, () => {
      if (!this.currentInterior) { this.placePlayerFeetAt(lugar.x, lugar.y - 10); this.cameras.main.centerOn(this.player.x, this.player.y); }
      this.time.delayedCall(500, () => llegada(this, false));
    }); }
    return r;
  };
  const RETORNO = { camino_al_castillo: { x: 540, y: 610 }, taberna_2: { x: 454, y: 435 }, castle: { x: 540, y: 610 }, ruins: { x: 24, y: 168 } };
  // (v2) la llegada a lo guardado: pantalla negra y sin escenas ni charlas hasta estar ahí (y un ratito más)
  let negro = null;
  const llegada = (s, on) => {
    try {
      if (!negro) {
        negro = document.createElement('div'); negro.id = 'ck-llegada';
        negro.style.cssText = 'position:absolute;inset:0;z-index:7990;background:#000;pointer-events:none;opacity:0;transition:opacity .35s';
      }
      const h = document.getElementById('game-wrapper') || document.body; if (negro.parentElement !== h) h.appendChild(negro);
      if (on) { s._ckLlegando = true; negro.style.transition = 'none'; negro.style.opacity = '1'; }
      else { s._ckLlegando = false; negro.style.transition = 'opacity .45s'; negro.style.opacity = '0'; }
    } catch (e) {}
  };
  const llegue = (s, z, intento) => {
    if (!s.story) return llegada(s, false);
    if ((s.currentZoneKey() !== z || s._doorTransition) && intento < 40) { s.time.delayedCall(150, () => llegue(s, z, intento + 1)); return; }
    s.time.delayedCall(450, () => llegada(s, false));
  };
  const engancharEscenas = () => {
    const E = window.CK_ESCENA;
    if (E && E.correr && !E.correr._ckLleg) {
      const c0 = E.correr; E.correr = function (S) { if (S && S._ckLlegando) return Promise.resolve(false); return c0.apply(this, arguments); }; E.correr._ckLleg = true;
    }
  };
  const dlg0 = P.openDialog;
  if (dlg0) P.openDialog = function () { if (this._ckLlegando) return; return dlg0.apply(this, arguments); };
  const irA = (s, l, intento) => {
    if (!s.story || s._gameMode !== 'campaign') return llegada(s, false);
    engancharEscenas();
    if (s._doorTransition) {
      if (intento < 20) s.time.delayedCall(250, () => irA(s, l, intento + 1));
      else llegada(s, false);
      return;
    }
    llegue(s, l.zona, 0);
    let m = /^ed_(.+)\.main$/.exec(l.zona);
    if (m) {
      if (!s.ckEntrar || !s.ckEntrar(m[1], { x: l.x, y: l.y - 10 })) return;
      const ret = RETORNO[m[1]] || (/trono/.test(m[1]) ? RETORNO.castle : null);
      if (ret) s._interiorReturn = { x: ret.x, y: ret.y, zoom: 1.5 };
      return;
    }
    m = /^(castle|ruins)\.(\w+)$/.exec(l.zona);
    if (!m) return;
    const tipo = m[1],
      nombre = m[2];
    if (tipo === 'castle' && nombre === 'road' && window.CK_CAMINO) return irA(s, { zona: 'ed_camino_al_castillo.main', x: 60, y: 444 }, intento);
    s._interiorReturn = { x: RETORNO[tipo].x, y: RETORNO[tipo].y, zoom: 1.5 };
    s.fadeTransition(() => {
      const b = s.buildInterior(tipo === 'castle' ? { _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle', _ck: true } : { _houseName: 'Ruins', _interiorIndex: 7, _interiorKind: 'ruins' }),
        a = b.areas[nombre] || b.areas[b.start];
      s.currentInterior = { building: b, areaName: b.areas[nombre] ? nombre : b.start, area: a };
      s._areaSwitchHold = true;
      s.showInteriorArea(a, b.areas[nombre] ? { x: a.x + l.x, y: a.y + l.y - 10 } : a.spawn);
    });
  };

  // el tiempo jugado se cuenta (se suma al guardar en un tótem). (v2) El lugar ya no se guarda solo.
  const update0 = P.update;
  P.update = function (time, delta) {
    const r = update0.apply(this, arguments);
    if (activa !== null && this._gameMode === 'campaign' && this.story && !this.isGamePaused) {
      this._ckJugado = (this._ckJugado || 0) + (delta || 16) / 1000;
      // sin tótems: el lugar y el tiempo se guardan solos cada 5 s, como antes
      if (!conTotems()) {
        this._ckGuardaEn = (this._ckGuardaEn || 0) - (delta || 16);
        if (this._ckGuardaEn <= 0 && !this._doorTransition && !this.isDead) { this._ckGuardaEn = 5000; guardar(this, false); }
      }
    }
    return r;
  };
  // (v2) "Reiniciar" (pausa) en la campaña: vuelve al último guardado, frente a su tótem
  const camp0 = P.startCampaign;
  P.startCampaign = function () {
    try {
      if (conTotems() && activa !== null && !nueva && !this._ckIrA && !this._ckPruebaArranca) {
        const x = leer()[activa];
        if (llena(x)) { this.playerHero = x.heroe; this._ckIrA = x.lugar || null; }
      }
    } catch (e) {}
    return camp0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ pantalla de ranuras
  const css = `
#ck-ranuras .modal-card{max-width:760px;width:94%;padding:26px 28px}
.ckr-lista{display:flex;flex-direction:column;gap:12px;margin:14px 0 18px}
.ckr-slot{display:flex;align-items:center;gap:14px;text-align:left;background:linear-gradient(180deg,#4a2a14,#2e180a);border:4px solid #140803;
  box-shadow:inset 0 0 0 2px #7a4a22;padding:10px 12px;color:var(--ui-cream,#f6e6c2);font-family:var(--ui-font,monospace)}
.ckr-slot.vacia{opacity:.85;border-style:dashed}
.ckr-cara{width:56px;height:56px;flex:0 0 56px;image-rendering:pixelated;background:#1b0d06;border:3px solid #140803;object-fit:cover}
.ckr-info{flex:1;min-width:0}
.ckr-nombre{font-size:16px;color:var(--ui-gold,#ffd77a);text-shadow:0 2px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ckr-det{font-size:11px;line-height:1.5;color:var(--ui-cream-dim,#c9b28a);margin-top:3px}
.ckr-acc{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.ckr-btn{font-family:var(--ui-font,monospace);font-size:12px;padding:8px 10px;cursor:pointer;color:#ffe6a8;background:linear-gradient(180deg,#7a4a1e,#4a2810);
  border:3px solid #140803;box-shadow:inset 0 0 0 1px #b07a3c;text-shadow:0 1px 0 #000}
.ckr-btn:hover,.ckr-btn:focus{filter:brightness(1.25);outline:none}
.ckr-btn.oro{background:linear-gradient(180deg,#c48a22,#7c5210);color:#fff4cf}
.ckr-btn.rojo{background:linear-gradient(180deg,#8a2a1e,#4e130c)}
.ckr-input{font-family:var(--ui-font,monospace);font-size:14px;width:100%;box-sizing:border-box;padding:8px;margin-top:6px;background:#f3e2bd;color:#2b1206;border:3px solid #140803}
.ckr-pie{display:flex;justify-content:center}
#btn-menu-continuar{border-image-source:url('assets/UI/theme/plank_gold.png') !important}
#btn-hero-newgame{display:none !important}
`;
  const estilo = () => {
    if (document.getElementById('ck-ranuras-css')) return;
    const st = document.createElement('style');
    st.id = 'ck-ranuras-css';
    st.textContent = css;
    document.head.appendChild(st);
  };
  const hace = ms => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return 'recién';
    const m = Math.floor(s / 60);
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    const d = Math.floor(h / 24);
    return d === 1 ? 'ayer' : 'hace ' + d + ' días';
  };
  const duracion = seg => {
    const m = Math.floor((seg || 0) / 60);
    return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  };
  const lugarTexto = l => {
    if (!l || !l.zona || l.zona === 'village') return 'Aldea del Roble';
    const t = {
      'ed_camino_al_castillo.main': 'Camino al Castillo',
      'ed_taberna_2.main': 'Taberna del Roble',
      'ed_salon_del_trono_3.main': 'Gran Salón del Trono',
      'castle.courtyard': 'Patio del Castillo',
      'castle.training': 'Patio de Armas',
      'castle.library': 'Biblioteca',
      'castle.kingroom': 'Aposentos del Rey',
      'castle.kitchen': 'Cocina Real',
      'castle.armory': 'Armería',
      'castle.garden': 'Jardín Real',
      'castle.walls': 'Adarve'
    }[l.zona];
    // las zonas que conoce el minimapa (también las salas nuevas del editor) tienen su nombre ahí
    const mm = window.CK_MINIMAPA && window.CK_MINIMAPA.Z && window.CK_MINIMAPA.Z[l.zona];
    return t || (mm && mm.n) || (/^ruins\./.test(l.zona) ? 'Aldea en Ruinas' : /^castle\./.test(l.zona) ? 'Castillo' : 'Aldea del Roble');
  };
  const objetivo = st => {
    if (!st || typeof QUESTS === 'undefined') return '';
    const q = QUESTS[Math.min(st.step || 0, QUESTS.length - 1)];
    const p = window.CK_HISTORIA && window.CK_HISTORIA.parte(st);
    return p ? window.CK_HISTORIA.OBJ[p] : q ? q.goal : '';
  };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let escena = null;
  const cerrar = () => {
    const m = document.getElementById('ck-ranuras');
    if (m) m.classList.remove('active');
  };
  const abrir = s => {
    escena = s;
    estilo();
    let m = document.getElementById('ck-ranuras');
    if (!m) {
      m = document.createElement('div');
      m.id = 'ck-ranuras';
      m.className = 'modal-overlay';
      m.innerHTML = '<div class="modal-card"><div class="epitaph-header">✦ CAMPAÑA ✦</div><h2 class="modal-title">PARTIDAS GUARDADAS</h2>' +
        '<p class="modal-subtitle">Elegí una ranura para seguir donde quedaste o empezar una aventura nueva</p><div class="ckr-lista"></div>' +
        '<div class="ckr-pie"><button class="ckr-btn" data-acc="volver">◂ VOLVER</button></div></div>';
      (document.getElementById('game-wrapper') || document.body).appendChild(m);
      m.addEventListener('click', e => {
        const b = e.target.closest('[data-acc]');
        if (!b) return;
        if (typeof sfx !== 'undefined') sfx.fx('ui_click', 0.8, { minGap: 120 });
        accion(b.dataset.acc, +b.dataset.i);
      });
      m.addEventListener('keydown', e => {
        e.stopPropagation();
        if (/^Arrow/.test(e.key) && !e.target.classList.contains('ckr-input')) {
          const bs = Array.from(m.querySelectorAll('.ckr-btn')),
            k = bs.indexOf(document.activeElement),
            d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
          if (bs.length) bs[(k + d + bs.length) % bs.length].focus();
          e.preventDefault();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          cerrar();
        }
        if (e.key === 'Enter' && e.target.classList.contains('ckr-input')) {
          e.preventDefault();
          accion('crear', +e.target.dataset.i);
        }
      });
    }
    activa = null;
    nueva = null;
    pidiendo = -1;
    confirmando = null;
    pintar();
    m.classList.add('active');
    const f = m.querySelector('.ckr-btn.oro, .ckr-btn');
    if (f) f.focus({ preventScroll: true });
  };
  let pidiendo = -1,
    confirmando = null; // { i, acc }
  const pintar = () => {
    const m = document.getElementById('ck-ranuras');
    if (!m) return;
    const r = leer(),
      ahora = Date.now();
    m.querySelector('.ckr-lista').innerHTML = r
      .map((x, i) => {
        if (confirmando && confirmando.i === i)
          return `<div class="ckr-slot"><div class="ckr-info"><div class="ckr-nombre">${esc(x.nombre)}</div>
            <div class="ckr-det">${confirmando.acc === 'borrar' ? '¿Borrar esta partida? No se puede deshacer.' : '¿Empezar una partida nueva acá? Esta se pierde.'}</div></div>
            <div class="ckr-acc"><button class="ckr-btn rojo" data-acc="si" data-i="${i}">SÍ</button><button class="ckr-btn" data-acc="no" data-i="${i}">NO</button></div></div>`;
        if (pidiendo === i)
          return `<div class="ckr-slot"><div class="ckr-info"><div class="ckr-nombre">Ranura ${i + 1} · Nueva partida</div>
            <div class="ckr-det">¿Cómo se llama tu partida?</div><input class="ckr-input" maxlength="24" data-i="${i}" value="${esc(llena(x) ? x.nombre : 'Partida ' + (i + 1))}"></div>
            <div class="ckr-acc"><button class="ckr-btn oro" data-acc="crear" data-i="${i}">EMPEZAR ▸</button><button class="ckr-btn" data-acc="cancelar" data-i="${i}">CANCELAR</button></div></div>`;
        if (!llena(x))
          return `<div class="ckr-slot vacia"><div class="ckr-cara"></div><div class="ckr-info"><div class="ckr-nombre">Ranura ${i + 1} · vacía</div>
            <div class="ckr-det">Sin partida guardada</div></div><div class="ckr-acc"><button class="ckr-btn oro" data-acc="nueva" data-i="${i}">NUEVA PARTIDA</button></div></div>`;
        const st = x.story || {};
        let cara = '';
        try {
          cara = escena && escena.portraitFor && escena.textures.exists(x.heroe + '_idle') ? escena.portraitFor(x.heroe + '_idle') : '';
        } catch (e) {}
        return `<div class="ckr-slot">${cara ? `<img class="ckr-cara" alt="" src="${cara}">` : '<div class="ckr-cara"></div>'}<div class="ckr-info">
          <div class="ckr-nombre">${esc(x.nombre)}</div>
          <div class="ckr-det">${esc(nombreHeroe(x.heroe))} · Nivel ${st.level || 1} · ${st.coins || 0} monedas · ${esc(lugarTexto(x.lugar))}<br>
          ${esc(objetivo(st))}<br>Jugado ${duracion(x.tiempo)} · ${hace(ahora - (x.fecha || ahora))}</div></div>
          <div class="ckr-acc"><button class="ckr-btn oro" data-acc="seguir" data-i="${i}">CONTINUAR</button>
          <button class="ckr-btn" data-acc="nueva" data-i="${i}">NUEVA</button><button class="ckr-btn rojo" data-acc="borrar" data-i="${i}">BORRAR</button></div></div>`;
      })
      .join('');
    const inp = m.querySelector('.ckr-input');
    if (inp) {
      inp.focus();
      inp.select();
    }
  };
  const seguir = i => {
    const x = leer()[i];
    if (!llena(x) || !escena) return;
    cerrar();
    activa = i;
    nueva = null;
    escena.playerHero = x.heroe;
    escena._ckIrA = x.lugar || null;
    if (typeof escena.closeHeroSelectionModal === 'function') escena.closeHeroSelectionModal();
    escena.startCampaign();
  };
  const accion = (a, i) => {
    const r = leer();
    if (a === 'volver') return cerrar();
    if (a === 'seguir') return seguir(i);
    if (a === 'no') {
      confirmando = null;
      return pintar();
    }
    if (a === 'si' && confirmando) {
      const c = confirmando;
      confirmando = null;
      if (c.acc === 'borrar') {
        r[i] = null;
        escribir(r);
        ponerContinuar();
        return pintar();
      }
      pidiendo = i;
      return pintar();
    }
    if (a === 'nueva') {
      if (llena(r[i])) {
        confirmando = { i, acc: 'nueva' };
        return pintar();
      }
      pidiendo = i;
      return pintar();
    }
    if (a === 'cancelar') {
      pidiendo = -1;
      return pintar();
    }
    if (a === 'crear') {
      const inp = document.querySelector('#ck-ranuras .ckr-input');
      const nombre = ((inp && inp.value) || '').trim().slice(0, 24) || 'Partida ' + (i + 1);
      pidiendo = -1;
      cerrar();
      activa = i;
      nueva = { i, nombre };
      escena._ckIrA = null;
      escena.openHeroSelectionModal('campaign');
      return;
    }
    if (a === 'borrar' && llena(r[i])) {
      confirmando = { i, acc: 'borrar' };
      pintar();
    }
  };

  // ------------------------------------------------------------------ menú principal
  const ultima = () => {
    const r = leer();
    let mejor = -1;
    r.forEach((x, i) => {
      if (llena(x) && (mejor < 0 || (x.fecha || 0) > (r[mejor].fecha || 0))) mejor = i;
    });
    return mejor;
  };
  const ponerContinuar = () => {
    const camp = document.getElementById('btn-menu-campaign');
    if (!camp) return;
    let b = document.getElementById('btn-menu-continuar');
    const i = ultima();
    if (i < 0) {
      if (b) b.remove();
      return;
    }
    if (!b) {
      b = document.createElement('button');
      b.id = 'btn-menu-continuar';
      b.className = 'start-menu-btn sm-primary';
      camp.parentNode.insertBefore(b, camp);
    }
    const x = leer()[i];
    b.title = 'Seguir «' + x.nombre + '» donde quedaste';
    b.innerHTML = '<span><img src="assets/UI/pix/play.png" class="px-ico sm-ico" alt="">CONTINUAR</span>';
  };
  const escenaActual = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  window.addEventListener(
    'click',
    e => {
      const t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      if (t.closest('#btn-menu-campaign')) {
        const s = escenaActual();
        if (!s) return;
        e.stopPropagation();
        e.preventDefault();
        if (typeof sfx !== 'undefined') {
          sfx.init();
          sfx.fx('ui_click', 0.8, { minGap: 150 });
        }
        abrir(s);
      } else if (t.closest('#btn-menu-continuar')) {
        const s = escenaActual(),
          i = ultima();
        e.stopPropagation();
        e.preventDefault();
        if (!s || i < 0) return;
        if (typeof sfx !== 'undefined') {
          sfx.init();
          sfx.fx('ui_click', 0.8, { minGap: 150 });
        }
        escena = s;
        seguir(i);
      }
    },
    true
  );
  // si cancelás la elección de héroe de una partida nueva, no queda nada a medias
  window.addEventListener(
    'click',
    e => {
      if (e.target && e.target.closest && e.target.closest('#btn-hero-cancel') && nueva) {
        nueva = null;
        activa = null;
      }
    },
    true
  );
  const vigilar = () => {
    estilo();
    ponerContinuar();
    const ov = document.getElementById('start-menu-overlay');
    if (ov && window.MutationObserver) new MutationObserver(ponerContinuar).observe(ov, { attributes: true, attributeFilter: ['class', 'style'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilar);
  else vigilar();

  // (v2) suma lo de los tótems: guardarAqui, ranura, lugarActual, sinGuardar, llegada
  window.CK_PARTIDAS = { leer, ultima, activa: () => activa, abrir: () => abrir(escenaActual()),
    guardarAqui, ranura: () => (activa === null ? null : leer()[activa]), lugarActual, sinGuardar, llegada, firma };
})();
