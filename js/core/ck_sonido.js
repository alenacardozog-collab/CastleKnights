'use strict';
/* SONIDO DEL TALLER (D:\Editor): reverberación según el lugar, voces balbuceadas en los diálogos, pluma que
   escribe, respiraciones del héroe, pasos de piedra, puertas y transiciones, ambientes por zona con sonidos sueltos.
   Los sonidos cortos vienen embebidos en js/maps/data/editor_sonidos.js (desde file:// el juego no puede leer
   archivos de audio con Web Audio) y los ambientes largos son mp3 en assets/audio/sfx/amb_*.mp3.
   No cambia los archivos del juego: envuelve métodos de MainGameScene y sfx.fx. Si se quita, todo vuelve a como era. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof sfx === 'undefined') return;
  const P = MainGameScene.prototype;
  const S = window.CK_SONIDO = { buf: {}, iniciado: false, listo: false, sala: null, salas: {}, ultimo: {}, voz: null };
  const clips = () => (window.EDITOR_SONIDOS && window.EDITOR_SONIDOS.clips) || {};
  const azar = (a, b) => a + Math.random() * (b - a);
  const uno = arr => arr[Math.floor(Math.random() * arr.length)];

  // ------------------------------------------------------------------ salas (reverberación)
  // t = segundos de cola, w = cuánto se mezcla, d = brillo (1 = piedra, 0.3 = madera/tela)
  const SALAS = {
    aire: { t: 0.35, w: 0.05, d: 0.6 }, bosque: { t: 0.7, w: 0.08, d: 0.5 }, casa: { t: 0.45, w: 0.16, d: 0.35 },
    taberna: { t: 0.8, w: 0.2, d: 0.4 }, granero: { t: 0.9, w: 0.2, d: 0.3 }, piedra: { t: 0.9, w: 0.22, d: 0.8 },
    patio: { t: 1.3, w: 0.16, d: 0.8 }, salon: { t: 2.8, w: 0.34, d: 0.9 }, cocina: { t: 1.1, w: 0.22, d: 0.75 },
    madera: { t: 0.6, w: 0.14, d: 0.4 }, ruinas: { t: 1.8, w: 0.17, d: 0.6 }
  };
  const CASTILLO = { road: 'bosque', courtyard: 'patio', walls: 'patio', garden: 'patio', training: 'patio', throne: 'salon', kitchen: 'cocina', armory: 'piedra', kingroom: 'madera', library: 'madera' };
  function salaDe(s) {
    const c = s.currentInterior;
    if (s._gameMode !== 'campaign' || !c) return 'aire';
    const k = c.building.kind;
    if (k === 'castle') return CASTILLO[c.areaName] || 'piedra';
    return { ruins: 'ruinas', bar: 'taberna', granero: 'granero', tienda: 'piedra', casa: 'casa' }[k] || 'casa';
  }
  function respuesta(ctx, p) {
    const sr = ctx.sampleRate, pre = Math.floor(sr * 0.012), n = pre + Math.floor(sr * p.t), b = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = pre; i < n; i++) {
        const t = (i - pre) / sr, k = Math.exp(-6.9 * t / p.t);
        const a = Math.max(0.04, p.d * Math.exp(-3 * t / p.t));      // la cola se oscurece con el tiempo
        lp += a * ((Math.random() * 2 - 1) - lp); d[i] = lp * k;
      }
    }
    return b;
  }

  // ------------------------------------------------------------------ motor
  function iniciar() {
    if (S.iniciado) return; sfx.init(); const ctx = sfx.ctx; if (!ctx) return;
    S.iniciado = true; S.ctx = ctx;
    S.master = ctx.createGain(); S.master.connect(ctx.destination);
    S.entrada = ctx.createGain(); S.seco = ctx.createGain(); S.entrada.connect(S.seco); S.seco.connect(S.master);
    const C = clips(), nombres = Object.keys(C); let faltan = nombres.length;
    nombres.forEach(n => {
      try {
        const bin = atob(C[n].d), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        ctx.decodeAudioData(u.buffer, b => { S.buf[n] = b; if (--faltan === 0) S.listo = true; }, () => { if (--faltan === 0) S.listo = true; });
      } catch (e) { faltan--; }
    });
    if (!nombres.length) S.listo = true;
  }
  function nivel() { return sfx.enabled ? sfx.level : 0; }
  function ponerSala(nombre) {
    if (!S.iniciado || S.sala === nombre) return; S.sala = nombre;
    const ctx = S.ctx, t = ctx.currentTime;
    if (!S.salas[nombre]) {
      const cv = ctx.createConvolver(), g = ctx.createGain(); cv.buffer = respuesta(ctx, SALAS[nombre]); g.gain.value = 0;
      S.entrada.connect(cv); cv.connect(g); g.connect(S.master); S.salas[nombre] = { cv, g };
    }
    Object.keys(S.salas).forEach(k => S.salas[k].g.gain.setTargetAtTime(k === nombre ? SALAS[k].w * 2.2 : 0, t, 0.15));
  }
  /** Toca un sonido embebido. o: {vol, rate, pan, desde, dura, entra, sale}. Devuelve un control con .parar(seg). */
  function tocar(n, o) {
    o = o || {}; const b = S.buf[n]; if (!b || !S.iniciado || !nivel()) return null;
    S.log = (S.log || []).slice(-40); S.log.push(n);                    // últimos sonidos (para revisar)
    const ctx = S.ctx, t = ctx.currentTime;
    S.master.gain.setTargetAtTime(nivel(), t, 0.02);
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.playbackRate.value = o.rate || 1;
    let nodo = g;
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); nodo = p; }
    nodo.connect(S.entrada); src.connect(g);
    const v = o.vol === undefined ? 0.8 : o.vol, desde = o.desde || 0;
    if (o.entra) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + o.entra); } else g.gain.value = v;
    if (o.dura) {
      const fin = t + o.dura / (o.rate || 1), sale = o.sale || 0.12;
      g.gain.setValueAtTime(v, Math.max(t, fin - sale)); g.gain.linearRampToValueAtTime(0, fin);
      src.start(t, desde, o.dura + 0.05);
    } else src.start(t, desde);
    return { src, g, parar(seg) { try { const k = ctx.currentTime; g.gain.cancelScheduledValues(k); g.gain.setValueAtTime(g.gain.value, k); g.gain.linearRampToValueAtTime(0, k + (seg || 0.08)); src.stop(k + (seg || 0.08) + 0.02); } catch (e) { } } };
  }
  const variantes = {};
  function variante(pref) {
    if (!variantes[pref]) variantes[pref] = Object.keys(clips()).filter(k => k.indexOf(pref) === 0);
    const v = variantes[pref].filter(k => S.buf[k]); return v.length ? uno(v) : null;
  }
  S.tocar = tocar; S.variante = variante; S.iniciar = iniciar;

  // ------------------------------------------------------------------ 1. sfx.fx: pasos y puertas pasan por la sala
  const MAPA = {
    step_stone1: () => variante('step_stone_'), step_grass1: 'step_grass1', step_grass2: 'step_grass2',
    step_wood1: 'step_wood1', step_wood2: 'step_wood2', step_dirt1: 'step_dirt1',
    door_open: 'puerta_abre', door_close: 'puerta_cierra'
  };
  const fx0 = sfx.fx.bind(sfx);
  sfx.fx = function (name, volume, opts) {
    const m = MAPA[name];
    if (m && S.listo && this.enabled) {
      const n = typeof m === 'function' ? m() : m;
      if (n && S.buf[n]) {
        const now = Date.now();
        if (opts && opts.minGap && now - (S.ultimo[name] || 0) < opts.minGap) return true;
        S.ultimo[name] = now;
        tocar(n, { vol: volume === undefined ? 0.8 : volume, rate: opts && opts.rate ? opts.rate : azar(0.95, 1.05) });
        return true;
      }
    }
    return fx0(name, volume, opts);
  };

  // ------------------------------------------------------------------ 2. diálogos: voz balbuceada + pluma
  const VOCES = [
    [/rey\b|king/i, 'rey'], [/reina|npc9_/i, 'reina'], [/princesa|npc8_/i, 'princesa'],
    [/hermano|priest|monje|sacerdote/i, 'monje'], [/capit|guardia|caballero|soldad|templario|lancero|recluta|arquero|g_\w+_idle/i, 'soldado'],
    [/abuela|anciana|npc7_/i, 'vieja'], [/anciano|abuelo|don |tob[ií]as|ermita|npc6_/i, 'viejo'],
    [/posadero|cociner|panader|tabern|npc3_/i, 'jovial'], [/paje|niño|chico|npc4_/i, 'joven'],
    [/dama|boticaria|señora|mujer|campesina|npc5_/i, 'mujer']
  ];
  function vozDe(nombre, cara) {
    const txt = (nombre || '') + ' ' + (cara || '');
    for (let i = 0; i < VOCES.length; i++) if (VOCES[i][0].test(txt)) return 'voz_' + VOCES[i][1];
    return 'voz_aldeano';
  }
  function callarVoz(seg) { if (S.voz) { S.voz.parar(seg || 0.12); S.voz = null; } }
  function hablar(d) {
    callarVoz(0.06);
    const n = d._ckVoz, b = S.buf[n], C = clips()[n]; if (!b) return;
    const resto = d.lines[d.i].length - d.shown;
    const dura = Math.max(0.35, Math.min(2.6, resto * 0.024 + 0.15));
    const ini = (C.on || [0]).filter(o => o + dura <= b.duration);
    S.voz = tocar(n, { vol: 0.75, rate: d._ckTono, desde: ini.length ? uno(ini) : 0, dura: Math.min(dura, b.duration), entra: 0.015, sale: 0.18 });
  }
  const abrir0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    S._ultimaCara = face; S._ultimoNombre = name;
    return abrir0.apply(this, arguments);
  };
  const pintar0 = P.renderDialog;
  P.renderDialog = function () {
    const r = pintar0.apply(this, arguments);
    try {
      const d = this._dlg; if (!d || !S.listo) return r;
      if (!d._ckVoz) { d._ckVoz = vozDe(d.name, S._ultimaCara); d._ckTono = azar(0.97, 1.04); d._ckI = -1; d._ckVisto = 0; }
      const linea = d.lines[d.i] || '';
      if (d._ckI !== d.i) { d._ckI = d.i; d._ckVisto = d.shown; if (d.shown < linea.length) hablar(d); }
      if (d.shown > d._ckVisto) {
        const nuevo = linea.slice(d._ckVisto, d.shown), now = performance.now();
        if (/\S/.test(nuevo) && now - (S._pluma || 0) > 55 && d.shown < linea.length) {
          S._pluma = now; const p = variante('pluma_'); if (p) tocar(p, { vol: 0.16, rate: azar(0.9, 1.2), pan: azar(-0.15, 0.15) });
        }
        d._ckVisto = d.shown;
      }
      if (d.shown >= linea.length && S.voz) callarVoz(0.2);
    } catch (e) { }
    return r;
  };

  // ------------------------------------------------------------------ 3. puertas y cambios de mapa
  const tras = (ms, f) => setTimeout(() => { try { f(); } catch (e) { } }, ms);
  const envolver = (nombre, antes) => { const f0 = P[nombre]; if (!f0) return; P[nombre] = function () { try { antes.apply(this, arguments); } catch (e) { } return f0.apply(this, arguments); }; };
  envolver('enterInterior', function (door) {
    if (this._doorTransition || this.currentInterior || !door || !S.listo) return;
    tocar('puerta_abre', { vol: 0.7, rate: azar(0.95, 1.05) }); tras(520, () => tocar('puerta_cierra', { vol: 0.55 }));
  });
  envolver('exitInterior', function () {
    if (this._doorTransition || !this.currentInterior || !S.listo) return;
    const k = this.currentInterior.building.kind;
    if (k === 'castle' || k === 'ruins') tocar('transicion', { vol: 0.55 });
    else { tocar('puerta_abre', { vol: 0.65, rate: azar(0.95, 1.05) }); tras(520, () => tocar('puerta_cierra', { vol: 0.5 })); }
  });
  ['enterCastle', 'enterRuins'].forEach(n => envolver(n, function () { if (!this._doorTransition && !this.currentInterior && S.listo) tocar('transicion', { vol: 0.6 }); }));
  envolver('switchInteriorArea', function (areaName) {
    const c = this.currentInterior; if (this._doorTransition || !c || !c.building.areas[areaName] || !S.listo) return;
    if (c.area.outdoor || c.building.areas[areaName].outdoor) tocar('transicion', { vol: 0.4, rate: azar(1, 1.1) });
  });

  // ------------------------------------------------------------------ 4. ambientes por zona y sonidos sueltos
  // lista de ambiente (archivos en assets/audio/sfx) + eventos [clip, cada min s, cada max s, volumen]
  function ambienteDe(s) {
    if (!s.gameStarted) return { clave: 'menu', lista: [] };
    const noche = s.isNight && s._gameMode === 'campaign' && s.isNight();
    if (s._gameMode !== 'campaign') return { clave: 'practica', lista: [['amb_aldea_dia', 0.5]], ev: [['ev_pajaro', 7, 16, 0.3]] };
    const c = s.currentInterior;
    if (!c) return noche ? { clave: 'aldea_noche', lista: [['amb_aldea_noche', 0.5]], ev: [['ev_buho', 14, 30, 0.3]] }
      : { clave: 'aldea_dia', lista: [['amb_aldea_dia', 0.55]], ev: [['ev_pajaro', 6, 14, 0.32]] };
    const k = c.building.kind, a = c.area || {}, clave = k + '.' + c.areaName;
    if (k.indexOf('ed_') === 0) return { clave, nada: true };                       // mapas del editor: su propio ambiente
    if (k === 'ruins') return { clave, lista: (a.ambient || []).concat([['amb_ruinas', 0.5]]), ev: [['ev_cuervo', 12, 26, 0.3]] };
    if (a.ambient && a.ambient.length) return { clave, lista: a.ambient };
    if (k === 'bar') return { clave, lista: [['amb_taberna', 0.55], ['amb_fire', 0.15]], ev: [['ev_risa', 10, 22, 0.28]] };
    if (k === 'granero') return { clave, lista: [['amb_granero', 0.6]], ev: [['ev_vaca', 14, 30, 0.3]] };
    if (k === 'tienda') return { clave, lista: [['amb_fire', 0.16]] };
    return { clave, lista: [['amb_fire', 0.3]] };
  }
  function cuadroAmbiente(s, now) {
    const A = ambienteDe(s);
    if (A.clave !== S.ambClave) {
      S.ambClave = A.clave; S.ev = A.ev || []; S.evProx = now + azar(3, 8) * 1000;
      if (!A.nada && typeof ambience !== 'undefined') ambience.set(A.lista);
    }
    if (S.ev && S.ev.length && now > S.evProx && s.gameStarted && !s.isGamePaused) {
      const e = uno(S.ev); S.evProx = now + azar(e[1], e[2]) * 1000;
      tocar(e[0], { vol: e[3] * azar(0.7, 1.1), rate: azar(0.94, 1.06), pan: azar(-0.7, 0.7) });
    }
  }

  // ------------------------------------------------------------------ 5. respiración del héroe
  const RESP = { soldier: ['resp_joven', 1], swordsman: ['resp_joven', 1.12], wizard: ['resp_viejo', 1], orc: ['resp_orco', 1] };
  function cuadroRespiracion(s, now) {
    if (!s.gameStarted || s.isDead || s.isGamePaused || !s.player) return;
    if (now < (S.respHasta || 0)) return;
    const st = s.maxStamina ? s.stamina / s.maxStamina : 1, herido = s.health <= 1 && s.maxHealth > 1;
    if (st > 0.3 && !herido) return;
    const r = RESP[s.playerHero] || RESP.soldier, b = S.buf[r[0]]; if (!b) return;
    tocar(r[0], { vol: st <= 0.3 ? 0.5 : 0.32, rate: r[1] * azar(0.97, 1.03) });
    S.respHasta = now + (b.duration / r[1]) * 1000 + (st <= 0.3 ? 900 : 4500);
  }

  // ------------------------------------------------------------------ 6. cada cuadro
  const update0 = P.update;
  P.update = function () {
    const r = update0.apply(this, arguments);
    try {
      if (!S.iniciado) { const ua = navigator.userActivation; if (sfx.ctx || (ua && ua.hasBeenActive)) iniciar(); }
      if (!S.iniciado) return r;
      const now = performance.now();
      ponerSala(salaDe(this));
      if (S.master) S.master.gain.setTargetAtTime(nivel(), S.ctx.currentTime, 0.05);
      cuadroAmbiente(this, now);
      if (!S.listo) return r;
      cuadroRespiracion(this, now);
      if (!this._dlg && S.voz) callarVoz(0.15);
      // puertas entre salas sin chirrido propio: se oye la madera al abrir y al cerrar
      const c = this.currentInterior;
      if (c && c.area && c.area.portals) c.area.portals.forEach(pt => {
        if (!pt.sprite || pt.creak) return;
        if (pt._ckAbierta === undefined) { pt._ckAbierta = !!pt.open; return; }
        if (pt._ckAbierta !== !!pt.open) { pt._ckAbierta = !!pt.open; tocar(pt.open ? 'puerta_abre' : 'puerta_cierra', { vol: 0.45, rate: azar(0.95, 1.05) }); }
      });
    } catch (e) { }
    return r;
  };
})();
