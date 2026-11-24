'use strict';
/* Sonido de los jefes, imponente (22/11, pedido del dueño: "los sonidos de los jefes finales están bien pero algunos suenan
   muy bajitos a veces, quiero que sean imponentes en su foley y leitmotiv, que sus ataques tengan sonidos acorde a lo que
   hacen, que los estruendos al caer o moverse se sientan bien, para los personajes más pesados, y así los gruñidos y
   furias también").
   Sonidos nuevos de ElevenLabs (ck_sonidos_jefes_arte.js, embebidos) y una mezcla propia para los jefes: cada sonido va
   nivelado (todos con el mismo peso), pasa por un compresor y un limitador (más fuerte sin romperse) y por el eco del lugar.
   Sólo cuando hay un jefe peleando cerca (el resto del juego suena igual que antes):
   - LO QUE YA SONABA BAJITO (mordiscos, huesos, piedras, armadura, gruñidos, aullidos): suena la copia nivelada.
   - GOLPES AL PISO (pisotón, derrumbe, caer de un salto, explosión, rayo): además un estruendo grave y un retumbe (un
     bajo sintetizado que se siente, no sólo se oye).
   - CADA ATAQUE con su sonido: al cargar el golpe el jefe gruñe según su raza (orco, bestia, demonio; los esqueletos
     castañetean) y los acorazados hacen sonar la armadura; al soltarlo, el zarpazo (bestias) o el tajo pesado del arma;
     los hechizos (manos, sombra, estrellas, rayos, raíces, espinas) con su sonido oscuro, el fuego (aliento, meteoro,
     brasa) con su llamarada, las rocas con su roca.
   - LOS PESADOS (Garra Negra, Kragmor, Grushak, el Campeón, el Gran Esqueleto, Taurax, Gromm, Morvane, Azrath...): cada
     paso retumba.
   - AL EMPEZAR LA PELEA: un golpe de orquesta y su rugido; el leitmotiv suena más fuerte mientras dura la pelea.
   - A LA MITAD DE LA VIDA: la furia (un rugido según su raza), retumbe y temblor.
   - AL MORIR: su último rugido, retumbe y, los pesados, el golpe del cuerpo al caer.
   Los que se oyen lejos suenan más bajos y del lado en que están.
   API: CK_SONIDOS_JEFES.tocar(clave, vol, {rate, pan, retraso}) y retumbe(vol, {dura, retraso}); log (lo último que sonó).
   Borrar su línea de index.html (y la de _arte) deja los sonidos de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof sfx === 'undefined') return;
  const P = MainGameScene.prototype, ARTE = window.CK_SONIDOS_JEFES_ARTE || {};
  const R = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const JP = () => window.CK_JEFES_PELEA;
  const vivo = e => e && e.active && !e.isDead;
  // (el Gran Esqueleto también: se presenta como jefe aunque el juego lo cuente como enemigo fuerte)
  const esJefe = e => { const J = JP(); try { return !!(e && ((J && J.esJefe(e)) || e.type === 'skeleton_great')); } catch (er) { return false; } };
  // raza: 'orco' | 'bestia' | 'muerto' | 'demonio' (la misma que elige el leitmotiv)
  const raza = e => { const J = JP(); try { return ((J && J.temaDe(e)) || 'jefe_orco').replace('jefe_', ''); } catch (er) { return 'orco'; } };
  const nombre = e => (e.type || '') + ' ' + (((e.def && e.def.name) || (e.ckDef && e.ckDef.name)) || '').toLowerCase();
  const PESADOS = /werebear_jefe|kragmor|warlord|campeon|skeleton_great|minotauro|martillo|caballero|golem|azrath|rey_demonio|demonio_rey|gorvak|grushak|garra/;
  const pesado = e => { if (e._ckJfPesado === undefined) { const F = window.CK_SONIDOS_FUERTES; e._ckJfPesado = !!((F && F.PESADO && F.PESADO[e.type]) || PESADOS.test(nombre(e)) || (e.def && e.def.scale >= 1.9 && !/ojo|brujo|necro|warlock|sabueso|segadora/.test(nombre(e)))); } return e._ckJfPesado; };
  const ARMADOS = /warlord|campeon|skeleton_armored|caballero|gorvak|grushak|martillo|cazador_ulrak/;
  const armado = e => ARMADOS.test(nombre(e));
  const nivel = () => (sfx.enabled ? sfx.level : 0);

  // ------------------------------------------------------------------ motor (WebAudio)
  const M = { buf: {}, ctx: null, bus: null, ult: {}, log: [], n: 0, S: null, ataque: null, enJefe: null, tArmar: 0, tipoVisto: {} };
  function armar() {
    if (M.bus) return true;
    try {
      try { sfx.init(); } catch (e) {}
      const C = window.CK_SONIDO;
      if (C && !C.iniciado && C.iniciar) { try { C.iniciar(); } catch (e) {} }
      const ctx = (C && C.ctx) || sfx.ctx; if (!ctx) return false;
      M.ctx = ctx;
      // compresor (todo junto, con peso) → subida → limitador (que no rompa) → el eco del lugar (ck_sonido.js) o la salida
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.22;
      const sube = ctx.createGain(); sube.gain.value = 1.6;
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
      comp.connect(sube); sube.connect(lim);
      if (C && C.entrada) { lim.connect(C.entrada); M.master = C.master; }
      else { const g = ctx.createGain(); lim.connect(g); g.connect(ctx.destination); M.master = g; }
      M.bus = comp;
      Object.keys(ARTE).forEach(k => {
        try {
          const bin = atob(ARTE[k].d), u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          ctx.decodeAudioData(u.buffer, b => { M.buf[k] = b; }, () => {});
        } catch (e) {}
      });
      return true;
    } catch (e) { return false; }
  }
  const alNivel = t => { try { if (M.master) M.master.gain.setTargetAtTime(nivel(), t, 0.02); } catch (e) {} };
  const separado = (k, gap) => { const now = performance.now(); if (now - (M.ult[k] || 0) < gap) return false; M.ult[k] = now; return true; };
  const anotar = k => { M.log.push(k); if (M.log.length > 40) M.log.shift(); M.n++; };
  /** Toca un sonido de ck_sonidos_jefes_arte.js. o: {rate, pan, retraso (ms), gap (ms sin repetirse)}. */
  function tocar(k, vol, o) {
    o = o || {};
    try {
      if (!armar() || !nivel()) return false;
      const b = M.buf[k], A = ARTE[k]; if (!b || !A) return false;
      if (!separado(k, o.gap !== undefined ? o.gap : 70)) return true;
      const ctx = M.ctx, t = ctx.currentTime + (o.retraso || 0) / 1000;
      alNivel(ctx.currentTime);
      const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = o.rate || R(0.96, 1.04);
      const g = ctx.createGain(); g.gain.value = (vol === undefined ? 0.8 : vol) * (A.g || 1);
      src.connect(g); let n = g;
      if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -0.8, 0.8); g.connect(p); n = p; }
      n.connect(M.bus); src.start(t);
      anotar(k);
      return true;
    } catch (e) { return false; }
  }
  // el retumbe: un bajo que cae (se siente en el pecho) y un golpe de aire grave
  let ruido = null;
  function retumbe(vol, o) {
    o = o || {};
    try {
      if (!armar() || !nivel() || !(vol > 0)) return false;
      if (!separado('retumbe', o.gap !== undefined ? o.gap : 150)) return true;
      const ctx = M.ctx, t = ctx.currentTime + (o.retraso || 0) / 1000, d = o.dura || 0.6, f0 = o.f0 || 64, f1 = o.f1 || 34;
      alNivel(ctx.currentTime);
      const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(Math.max(0.002, vol), t + 0.008); out.gain.exponentialRampToValueAtTime(0.0006, t + d);
      out.connect(M.bus);
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(f0, t); o1.frequency.exponentialRampToValueAtTime(f1, t + d * 0.85); o1.connect(out);
      // el armónico: para que se oiga también en parlantes chicos
      const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'triangle'; g2.gain.value = 0.32;
      o2.frequency.setValueAtTime(f0 * 2, t); o2.frequency.exponentialRampToValueAtTime(f1 * 2, t + d * 0.6); o2.connect(g2); g2.connect(out);
      if (!ruido) { ruido = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate); const dd = ruido.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
      const ns = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), gn = ctx.createGain();
      ns.buffer = ruido; lp.type = 'lowpass'; lp.frequency.value = 230;
      gn.gain.setValueAtTime(Math.max(0.002, vol * 0.9), t); gn.gain.exponentialRampToValueAtTime(0.0006, t + 0.24);
      ns.connect(lp); lp.connect(gn); gn.connect(M.bus);
      o1.start(t); o2.start(t); ns.start(t); o1.stop(t + d + 0.05); o2.stop(t + d + 0.05);
      anotar('retumbe');
      return true;
    } catch (e) { return false; }
  }
  // cuán lejos está (más bajo) y de qué lado
  const lugar = (S, e) => {
    if (!S || !S.player || !e) return { k: 1, pan: 0 };
    const dx = e.x - S.player.x, d = Math.hypot(dx, e.y - S.player.y);
    return { k: clamp(1.15 - d / 650, 0.35, 1), pan: clamp(dx / 420, -0.6, 0.6) };
  };
  const VOZ = {
    gru: { orco: 'jf_gru_orco', bestia: 'jf_gru_bestia', demonio: 'jf_gru_demonio', muerto: 'jq_ck_f_huesos' },
    furia: { orco: 'jf_furia_orco', bestia: 'jf_furia_bestia', demonio: 'jf_furia_demonio', muerto: 'jf_furia_muerto' }
  };
  const voz = (e, tipo, vol, o) => {
    const r = raza(e);
    if (tipo === 'gru' && /necro/.test(nombre(e))) return tocar('jf_magia', vol * 0.6, o);   // el Nigromante no gruñe: murmura sombra
    return tocar(VOZ[tipo][r] || VOZ[tipo].orco, vol, Object.assign({ rate: pesado(e) ? R(0.88, 0.97) : R(0.96, 1.06), gap: 400 }, o || {}));
  };

  // ------------------------------------------------------------------ ¿hay un jefe peleando?
  const pelea = S => {
    if (!S || !S.time) return null;
    const now = S.time.now;
    if (S._ckJfT !== undefined && now - S._ckJfT < 200 && now >= S._ckJfT) return vivo(S._ckJfE) ? S._ckJfE : null;
    S._ckJfT = now;
    // (como CK_JEFES_PELEA.jefeEnPelea: el jefe más cerca que te persigue o está a menos de 320 px)
    let mejor = null, d0 = 1e9;
    try {
      if (S.enemies && S.player) S.enemies.getChildren().forEach(e => {
        if (!vivo(e) || !e.visible || e.state === 'dormant' || !esJefe(e)) return;
        const d = Math.hypot(e.x - S.player.x, e.y - S.player.y);
        if (d < 620 && (e.state === 'chase' || d < 320) && d < d0) { d0 = d; mejor = e; }
      });
    } catch (er) {}
    S._ckJfE = mejor;
    return mejor;
  };
  // el sonido (o el efecto) lo pidió el código de un jefe: se mira QUIÉN LLAMA (el primer archivo que no es de sonido ni
  // de efectos), no toda la pila (por ahí pasan las envolturas de updateEnemies de los jefes aunque suene otro enemigo)
  const DESDE_JEFE = /ck_jefes_|ck_garra_sombra|ck_mazmorra_final|ck_mazmorra_sello|ck_reino_criaturas|ck_coliseo|ck_capitulo2|ck_capitulo3|ck_infierno_vivo|ck_batalla_orca|ck_bestias_chibi/;
  const DE_PASO = /ck_sonidos_jefes|ck_sonido\.js|audio\.js|ck_vfx|ck_pixelfx|ck_grietas|phaser|^Error/;
  const desdeJefe = () => {
    const L = Error.stackTraceLimit;
    try {
      Error.stackTraceLimit = 12;
      const fr = String(new Error().stack || '').split('\n').map(x => x.trim()).filter(x => x && !DE_PASO.test(x));
      return !!fr.length && DESDE_JEFE.test(fr[0]);
    } catch (e) { return false; } finally { Error.stackTraceLimit = L; }
  };

  // ------------------------------------------------------------------ 1. los sonidos de los jefes, más fuertes y con cuerpo
  const fx0 = sfx.fx.bind(sfx);
  const orig = (n, v, o, mas) => fx0(n, Math.min(1, v * (mas || 1.25)), o);
  const copia = (n, v, o) => {   // la copia nivelada (si no está lista todavía, el original un poco más fuerte)
    if (o && o.minGap && !separado('mg_' + n, o.minGap)) return true;
    return tocar('jq_' + n, v, { rate: o && o.rate, gap: 40 }) || orig(n, v, o);
  };
  const capa = (k, v, o) => tocar(k, v, Object.assign({ gap: 220 }, o || {}));   // (la misma capa dos veces seguidas suena doble)
  const GOLPE_PISO = (n, v, o, L) => { const r = orig(n, v, o); capa('jf_estruendo', 0.5 * v * L.k, { pan: L.pan, gap: 200 }); retumbe(0.55 * v * L.k); return r; };
  const REFUERZO = {
    ck_pisoton_jefe: GOLPE_PISO,
    ck_derrumbe: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_roca', 0.45 * v * L.k, { pan: L.pan }); retumbe(0.4 * v * L.k); return r; },
    ck_aterriza: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_cae', 0.55 * v * L.k, { pan: L.pan, gap: 200 }); retumbe(0.6 * v * L.k); return r; },
    ck_f_garra_cae: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_cae', 0.55 * v * L.k, { pan: L.pan, gap: 200 }); retumbe(0.6 * v * L.k); return r; },
    ck_explosion: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_fuego', 0.35 * v * L.k, { pan: L.pan }); retumbe(0.45 * v * L.k); return r; },
    thunder_strike: (n, v, o, L) => { const r = orig(n, v, o); retumbe(0.4 * v * L.k, { f0: 70, f1: 40 }); return r; },
    ck_demonio_rugido: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_gru_demonio', 0.4 * v * L.k, { pan: L.pan, gap: 300 }); retumbe(0.3 * v * L.k, { dura: 0.8 }); return r; },
    ck_f_esqueleto_golpe: (n, v, o, L) => { const r = orig(n, v, o); capa('jq_bone_hit', 0.4 * v * L.k, { pan: L.pan }); retumbe(0.35 * v * L.k, { dura: 0.4 }); return r; },
    ck_giro_hacha: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_swoosh', 0.4 * v * L.k, { pan: L.pan }); return r; },
    sword_swing1: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_swoosh', 0.35 * v * L.k, { pan: L.pan }); return r; },
    sword_swing2: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_swoosh', 0.35 * v * L.k, { pan: L.pan }); return r; },
    ck_f_zarpazo: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_garras', 0.45 * v * L.k, { pan: L.pan }); return r; },
    ck_f_zarpazo2: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_garras', 0.45 * v * L.k, { pan: L.pan }); return r; },
    fire_cast: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_fuego', 0.35 * v * L.k, { pan: L.pan }); return r; },
    fire_hit: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_fuego', 0.3 * v * L.k, { pan: L.pan }); return r; },
    necro_cast: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_magia', 0.35 * v * L.k, { pan: L.pan }); return r; },
    ice_cast: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_magia', 0.3 * v * L.k, { pan: L.pan }); return r; },
    ck_nova: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_magia', 0.35 * v * L.k, { pan: L.pan }); retumbe(0.3 * v * L.k); return r; },
    ck_f_nigro: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_magia', 0.3 * v * L.k, { pan: L.pan }); return r; },
    orc_attack: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_gru_orco', 0.35 * v * L.k, { pan: L.pan, gap: 300 }); return r; },
    ck_f_orco_grito: (n, v, o, L) => { const r = orig(n, v, o); capa('jf_gru_orco', 0.35 * v * L.k, { pan: L.pan, gap: 300 }); return r; },
    // los que sonaban bajito: la copia nivelada
    beast_growl: (n, v, o) => copia(n, v, o), ck_f_mordisco: (n, v, o) => copia(n, v, o), ck_f_huesos: (n, v, o) => copia(n, v, o),
    bone_hit: (n, v, o) => copia(n, v, o), warg_howl: (n, v, o) => copia(n, v, o), ck_f_lobo: (n, v, o) => copia(n, v, o),
    ck_piedra: (n, v, o) => copia(n, v, o), ck_f_armadura: (n, v, o) => copia(n, v, o), ck_paso_armadura: (n, v, o) => copia(n, v, o),
    ck_piedra_pesada: (n, v, o, L) => { const r = copia(n, v, o); retumbe(0.4 * v * L.k); return r; }
  };
  sfx.fx = function (name, volume, opts) {
    const A = REFUERZO[name];
    if (!A || !this.enabled || !M.S) return fx0(name, volume, opts);
    try {
      let e = null;
      if (M.enJefe) e = M.enJefe;                                           // dentro de un golpe a un jefe (su queja, su muerte)
      else if (M.ataque && M.ataque.n === name) { e = M.ataque.e; M.ataque = null; }   // el sonido de su ataque
      else { const p = pelea(M.S); if (p && desdeJefe()) e = p; }           // lo pidió el código de un jefe en pelea
      if (!e) return fx0(name, volume, opts);
      return A(name, volume === undefined ? 0.8 : volume, opts, lugar(M.S, e));
    } catch (er) { return fx0(name, volume, opts); }
  };

  // ------------------------------------------------------------------ 2. cada ataque: gruñido al cargar, tajo o zarpazo al soltar
  const ag0 = P.ckAvisoGolpe;
  if (ag0) P.ckAvisoGolpe = function (enemy, def, heavy, hitAt, anim, swing) {
    const warn = ag0.apply(this, arguments);
    try {
      if (esJefe(enemy)) {
        M.ataque = { n: def && def.sfx && def.sfx[0], e: enemy }; Promise.resolve().then(() => { M.ataque = null; });
        const S = this, now = S.time.now, L = lugar(S, enemy);
        if (now > (enemy._ckJfVoz || 0) && (heavy || Math.random() < 0.75)) { enemy._ckJfVoz = now + R(2200, 3600); voz(enemy, 'gru', (heavy ? 0.6 : 0.45) * L.k, { pan: L.pan }); }
        if (armado(enemy)) capa('jf_armadura', 0.4 * L.k, { pan: L.pan });
        const suelta = (warn || 0) + Math.max(0, (hitAt || 0) - 70);
        S.time.delayedCall(Math.max(0, suelta - 50), () => {
          if (!vivo(enemy) || enemy.swingId !== swing) return;
          const L2 = lugar(S, enemy), bestia = raza(enemy) === 'bestia';
          capa(bestia ? 'jf_garras' : 'jf_swoosh', (heavy ? 0.6 : 0.42) * L2.k, { pan: L2.pan, rate: pesado(enemy) ? R(0.82, 0.92) : R(0.95, 1.08) });
          if (heavy && pesado(enemy)) retumbe(0.3 * L2.k, { retraso: 90, dura: 0.45 });
        });
      }
    } catch (er) {}
    return warn;
  };
  // la queja y la muerte de un jefe (combat.js las toca dentro del golpe)
  const de0 = P.damageEnemy;
  if (de0) P.damageEnemy = function (enemy) {
    if (!esJefe(enemy)) return de0.apply(this, arguments);
    const antes = M.enJefe; M.enJefe = enemy;
    try { return de0.apply(this, arguments); } finally { M.enJefe = antes; }
  };

  // ------------------------------------------------------------------ 3. los efectos de sus habilidades (pixelfx)
  const EFECTO = {
    ckfx_pfx_impacto: 'piso', ckfx_pfx_aterrizaje: 'cae', ckfx_pfx_pisoton: 'piso', ckfx_pfx_sismo: 'piso',
    ckfx_pfx_roca: 'jf_roca', ckfx_pfx_aliento: 'jf_fuego', ckfx_pfx_meteoro: 'jf_fuego', ckfx_pfx_anillo_fuego: 'jf_fuego',
    ckfx_pfx_manos: 'jf_magia', ckfx_pfx_oscura: 'jf_magia', ckfx_pfx_estrellas: 'jf_magia', ckfx_pfx_rayos: 'jf_magia',
    ckfx_pfx_raices: 'jf_magia', ckfx_pfx_espina: 'jf_magia', ckfx_pfx_siega: 'jf_swoosh'
  };
  const F = Phaser.GameObjects.GameObjectFactory.prototype, sp0 = F.sprite;
  F.sprite = function (x, y, key) {
    const s = sp0.apply(this, arguments);
    try {
      const k = typeof key === 'string' && EFECTO[key];
      if (k && this.scene) {
        const S = this.scene, e = pelea(S);
        if (e && desdeJefe()) {
          const L = lugar(S, { x, y });
          if (k === 'piso') { capa('jf_estruendo', 0.55 * L.k, { pan: L.pan, gap: 200 }); retumbe(0.5 * L.k); }
          else if (k === 'cae') { capa('jf_cae', 0.55 * L.k, { pan: L.pan, gap: 200 }); retumbe(0.55 * L.k); }
          else capa(k, 0.5 * L.k, { pan: L.pan, gap: 220 });
        }
      }
    } catch (er) {}
    return s;
  };

  // ------------------------------------------------------------------ 4. pasos, el comienzo, la furia, el leitmotiv
  const paso = (S, e, par) => {
    const L = lugar(S, e);
    tocar('jf_pisada', (par ? 0.5 : 0.38) * L.k, { pan: L.pan, rate: R(0.86, 1.0), gap: 120 });
    if (par) retumbe(0.22 * L.k, { dura: 0.35, f0: 58, f1: 36, gap: 120 });
  };
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      M.S = this;
      const now = this.time.now;
      if (!M.bus && now > M.tArmar) { M.tArmar = now + 1000; armar(); }
      if (!this.player || this._ckEscena) return r;
      const PR = window.CK_PRESENTACIONES; if (PR && PR.activa && PR.activa()) return r;
      const e = pelea(this);
      if (e) {
        (this._ckJfVistos = this._ckJfVistos || []).indexOf(e) < 0 && this._ckJfVistos.push(e);
        // el comienzo: golpe de orquesta y su rugido (una vez cada 5 min por jefe)
        if (!e._ckJfInicio) {
          e._ckJfInicio = true;
          const t = Date.now(), L = lugar(this, e);
          if (t - (M.tipoVisto[e.type] || 0) > 300000) { M.tipoVisto[e.type] = t; tocar('jf_inicio', 0.7, { rate: 1, gap: 2000 }); voz(e, 'furia', 0.6 * L.k, { pan: L.pan, retraso: 420 }); retumbe(0.4, { retraso: 60, dura: 0.9 }); }
          else voz(e, 'gru', 0.55 * L.k, { pan: L.pan });
        }
        // los pesados: cada paso retumba (al ritmo de los pasos de ck_sonidos_fuertes.js si los tiene)
        if (pesado(e) && e.body) {
          const FU = window.CK_SONIDOS_FUERTES;
          if (FU && FU.PESADO && FU.PESADO[e.type]) {
            if (e._ckPasoT !== e._ckJfPasoVisto) { if (e._ckJfPasoVisto !== undefined) paso(this, e, e._ckPasoPar); e._ckJfPasoVisto = e._ckPasoT; }
          } else {
            const vel = Math.hypot(e.body.velocity.x, e.body.velocity.y);
            if (vel > 18 && now >= (e._ckJfPasoT || 0)) { e._ckJfPasoT = now + clamp(26000 / vel, 260, 620) * 1.25; e._ckJfPar = !e._ckJfPar; paso(this, e, e._ckJfPar); }
          }
        }
      }
      // la furia a la mitad de la vida (si se cura o se reintenta, vuelve a poder)
      (this._ckJfVistos || []).forEach(b => {
        if (!vivo(b)) return;
        const max = b.maxHp || (b.def && b.def.hp) || 0; if (!max) return;
        const f = b.hp / max;
        if (b._ckJfFuria && f > 0.75) b._ckJfFuria = false;
        if (!b._ckJfFuria && f <= 0.5 && f > 0) {
          b._ckJfFuria = true;
          const L = lugar(this, b);
          voz(b, 'furia', 0.8 * L.k, { pan: L.pan, gap: 1000 }); retumbe(0.5 * L.k, { dura: 0.9, f0: 55, f1: 30 });
          try { this.cameras.main.shake(320, 0.005); } catch (er) {}
        }
      });
      if (this._ckJfVistos && this._ckJfVistos.length > 8) this._ckJfVistos = this._ckJfVistos.filter(vivo);
      // el leitmotiv más fuerte mientras dura la pelea (si nadie más lo está bajando)
      if (typeof music !== 'undefined' && music.enabled && music.audioElements && /^jefe_/.test(music.currentTrack || '')) {
        const a = music.audioElements[music.currentTrack];
        if (a && !a.paused && Math.abs(a.volume - music.volume) < 0.02) a.volume = Math.min(1, music.volume * 1.35);
      }
    } catch (er) {}
    return r;
  };

  // ------------------------------------------------------------------ 5. al morir
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    try {
      if (enemy && esJefe(enemy) && !enemy._ckJfMuerte) {
        enemy._ckJfMuerte = true;
        const L = lugar(this, enemy);
        tocar('jf_muerte', 0.75 * L.k, { pan: L.pan, rate: pesado(enemy) ? 0.92 : 1, gap: 500 });
        retumbe(0.6 * L.k, { dura: 1.1, f0: 52, f1: 28, gap: 0 });
        if (pesado(enemy)) { capa('jf_cae', 0.6 * L.k, { pan: L.pan, retraso: 650, gap: 0 }); retumbe(0.45 * L.k, { retraso: 650, dura: 0.6, gap: 0 }); }
      }
    } catch (er) {}
    return ve0 ? ve0.apply(this, arguments) : undefined;
  };
  // si se reintenta la pelea, el jefe vuelve a poder morir con su sonido
  const sp1 = P.spawnEnemy;
  if (sp1) P.spawnEnemy = function () { const e = sp1.apply(this, arguments); try { if (e) { e._ckJfMuerte = false; e._ckJfInicio = false; } } catch (er) {} return e; };

  window.CK_SONIDOS_JEFES = { tocar, retumbe, armar, log: M.log, M, REFUERZO, EFECTO, pelea };
})();
