'use strict';
/* Sonidos de habilidades, ultis, estados y regiones (03/11, pedido del dueño: "agregales sonidos acordes a las
   habilidades, que suene realmente a lo que están haciendo; añadí también los sonidos de las regiones nuevas").
   - 44 sonidos cortos de ElevenLabs (ck_sonidos_hab_arte.js, embebidos para que anden con doble clic) que pasan por la
     reverberación del lugar de ck_sonido.js. Cada habilidad de los 4 héroes tiene el suyo (lluvia de flechas, grito,
     escudazo, danza de filos, tajo cruzado, paso de sombra, trueno, bola de fuego, explosión, lanza y ráfaga de hielo,
     ventisca, meteoro, misiles, escudo arcano, drenaje, rugido, garras, pisotón, avalancha, mordisco, frenesí...).
   - Las ultis suman un impacto cinematográfico grave; los críticos, un golpe seco.
   - Estados: al prenderse, congelarse, aturdirse, sangrar o frenarse una bestia suena su estado (con espera, para no
     saturar); los buffs del héroe suenan al empezar.
   - Regiones: ambientes propios en assets/audio/sfx (amb_bosque_frontera, amb_tierras_orcas, amb_pueblo_orco,
     amb_fortaleza_orca y amb_claro_bestias, listo para el mapa que viene) y sonidos sueltos de lejos: cuerno de guerra
     orco, orcos gritando y un lobo aullando.
   Borrar las 2 líneas de index.html lo saca (los ambientes vuelven a los de antes). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const CL = window.CK_SONIDOS_HAB || {};
  const azar = (a, b) => a + Math.random() * (b - a);
  // sumarlos a los clips del Taller antes de que ck_sonido.js los decodifique (o decodificarlos si ya arrancó)
  const S0 = () => window.CK_SONIDO;
  if (window.EDITOR_SONIDOS && window.EDITOR_SONIDOS.clips) Object.assign(window.EDITOR_SONIDOS.clips, CL);
  const decodificarTarde = () => {
    const S = S0(); if (!S || !S.iniciado || !S.ctx) return false;
    Object.keys(CL).forEach(n => {
      if (S.buf[n] || CL[n]._dec) return; CL[n]._dec = 1;
      try { const bin = atob(CL[n].d), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); S.ctx.decodeAudioData(u.buffer, b => { S.buf[n] = b; }, () => {}); } catch (e) {}
    });
    return true;
  };
  const ultimo = {};
  const son = (n, vol, o) => {
    try {
      const S = S0(); if (!S) return;
      const k = 'hab_' + n; if (!S.buf[k]) decodificarTarde();
      const now = performance.now(); if (o && o.gap && now - (ultimo[n] || 0) < o.gap) return; ultimo[n] = now;
      S.tocar(k, Object.assign({ vol: vol === undefined ? 0.8 : vol, rate: azar(0.96, 1.04) }, o || {}));
    } catch (e) {}
  };
  const luego = (S, ms, f) => S.time.delayedCall(ms, f);

  // ------------------------------------------------------------------ habilidades
  const DESPUES = {
    // Lancent
    b_torbellino: S => son('giro', 0.8), onda: S => luego(S, 150, () => son('onda_corte', 0.8)),
    grito: S => { son('grito_guerra', 0.9); luego(S, 250, () => son('st_mejora', 0.5)); },
    cargado: S => son('flecha_cargada', 0.85), explosiva: S => son('flecha_cargada', 0.7, { rate: 1.1 }),
    salto: S => luego(S, 380, () => son('salto_golpe', 0.9)), golpe_escudo: S => luego(S, 120, () => son('golpe_escudo', 0.9)),
    // Aby
    b_pirueta: S => son('giro', 0.7, { rate: 1.3 }), remolino: S => son('danza_filos', 0.7, { rate: 1.1 }),
    dagas: S => luego(S, 130, () => son('dagas', 0.8)), paso: S => son('paso_sombra', 0.85),
    tajo: S => luego(S, 80, () => son('tajo_cruzado', 0.85)), marca: S => son('marca_muerte', 0.8), relampago: S => son('relampago', 0.85),
    // Horos
    b_escarcha: S => son('hielo_lanza', 0.75, { rate: 1.15 }), triple_fuego: S => luego(S, 220, () => son('fuego_bola', 0.85)),
    lanza: S => luego(S, 170, () => son('hielo_lanza', 0.85, { rate: 0.85 })), nova: S => { son('runas', 0.7, { rate: 1.2 }); son('hielo_rompe', 0.6, { rate: 0.8 }); },
    anillo: S => { son('fuego_bola', 0.7, { rate: 0.8 }); son('runas', 0.5); }, meteoro: S => son('meteoro', 0.95),
    ventisca: S => son('ventisca', 0.75), prision: S => { son('hielo_rompe', 0.85, { rate: 0.8 }); luego(S, 200, () => son('st_congelado', 0.7)); },
    tormenta: S => son('tormenta', 0.85), misiles: S => son('misiles', 0.8), escudo_arcano: S => son('escudo_arcano', 0.85),
    drenaje: S => son('drenaje', 0.85),
    // Urso
    b_rugido: S => son('rugido_oso', 1), b_remolino: S => { [0, 260, 520].forEach((t, i) => luego(S, t, () => son('garras', 0.7, { rate: 1 + i * 0.08 }))); },
    frenesi: S => son('frenesi', 0.9), desgarro: S => luego(S, 100, () => son('garras', 0.95, { rate: 0.85 })),
    pisoton: S => luego(S, 240, () => son('pisoton', 1)), avalancha: S => son('avalancha', 0.95),
    mordisco: S => luego(S, 120, () => son('mordisco', 0.95)), espiritu: S => son('espiritu', 0.85)
  };
  const envolverHacer = () => {
    const H = window.CK_HABILIDADES && window.CK_HABILIDADES.HACER, E = window.CK_EQUIPO && window.CK_EQUIPO.hacerBase;
    [H, E].forEach(T => {
      if (!T) return;
      Object.keys(DESPUES).forEach(id => {
        const f0 = T[id]; if (!f0 || f0._ckSon) return;
        const f = function (S) { const r = f0.apply(this, arguments); try { if (r !== -1 && S && S.player) DESPUES[id](S); } catch (e) {} return r; };
        Object.keys(f0).forEach(k => (f[k] = f0[k])); f._ckSon = true; T[id] = f;
      });
    });
  };
  const envolver = (n, antes, despues) => { const f0 = P[n]; if (!f0) return; P[n] = function () { let a; try { a = antes ? antes.call(this) : 0; } catch (e) {} const r = f0.apply(this, arguments); try { despues.call(this, a, arguments); } catch (e) {} return r; }; };
  envolver('performArrowRain', function () { return this.lastRainTime; }, function (a) { if (this.lastRainTime === a || this.playerHero !== 'soldier') return; luego(this, 880, () => son('lluvia_flechas', 0.9)); });
  envolver('performBladeDance', function () { return this.lastSpinTime; }, function (a) { if (this.lastSpinTime === a) return; son('danza_filos', 0.9); });
  envolver('performSpin', function () { return this.lastSpinTime; }, function (a) { if (this.lastSpinTime === a || this.playerHero !== 'soldier') return; son('giro', 0.8); });
  envolver('thunderStrike', null, function (a, args) { const lv = args[0] || 1; son('trueno_ulti', lv >= 3 ? 1 : 0.55 + lv * 0.1, { rate: lv >= 3 ? 0.92 : 1.05 }); });

  // ultis: un impacto grave encima de todo (ck_vfx.js avisa con 'ck-ulti')
  window.addEventListener('ck-ulti', () => { son('ulti_carga', 0.55, { gap: 300 }); son('ulti_impacto', 0.85, { gap: 300 }); });

  // críticos y garras del oso
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    const vivo = enemy && enemy.active && !enemy.isDead;
    const r = de0.apply(this, arguments);
    try {
      if (vivo && amount >= 3) son('critico', 0.8, { gap: 90 });
      else if (vivo && amount > 0 && this.playerHero === 'bear' && !this._ckFuente) son('garras', 0.45, { gap: 140, rate: azar(1.05, 1.25) });
      if (vivo && amount > 0 && this._ckFuente === 'fuego') son('explosion_fuego', 0.45, { gap: 200, rate: azar(1.1, 1.3) });
      if (vivo && amount > 0 && this._ckFuente === 'hielo') son('hielo_rompe', 0.4, { gap: 200, rate: azar(1.1, 1.3) });
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ estados: suenan al empezar
  const EST = [['quemado', e => e._ckFuego && e._ckFuego.hasta], ['congelado', e => e._ckHielo], ['aturdido', e => e._ckAturdido], ['sangrado', e => e._ckSangre], ['lento', e => e._ckLento]];
  const BUF = [['_ckGrito', null], ['_ckFrenesi', 'st_mejora'], ['_ckEspiritu', 'st_mejora']];
  const estados = S => {
    const now = S.time.now;
    if (S.enemies) S.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const m = e._ckSonEst || (e._ckSonEst = {});
      EST.forEach(([k, f]) => { const on = (f(e) || 0) > now; if (on && !m[k]) son('st_' + k, 0.45, { gap: 350 }); m[k] = on; });
    });
    const b = S._ckSonBuf || (S._ckSonBuf = {});
    BUF.forEach(([k, n]) => { const on = (S[k] || 0) > now; if (on && !b[k] && n) son(n, 0.5, { gap: 300 }); b[k] = on; });
  };

  // ------------------------------------------------------------------ regiones: ambiente propio y sonidos de lejos
  const AMB = {
    bosque_de_la_frontera: [['amb_bosque_frontera', 0.5], ['amb_forest', 0.18]],
    tierras_orcas: [['amb_tierras_orcas', 0.5]],
    pueblo_orco: [['amb_pueblo_orco', 0.5], ['amb_fire', 0.12]],
    fortaleza_orca: [['amb_fortaleza_orca', 0.55]],
    claro_de_las_bestias: [['amb_claro_bestias', 0.55]]
  };
  const EV = {
    ed_bosque_de_la_frontera: [['ev_aullido', 0.22], ['ev_orcos_lejos', 0.15]],
    ed_tierras_orcas: [['ev_cuerno_orco', 0.25], ['ev_orcos_lejos', 0.22], ['ev_aullido', 0.16]],
    ed_pueblo_orco: [['ev_orcos_lejos', 0.25]],
    ed_fortaleza_orca: [['ev_cuerno_orco', 0.3], ['ev_orcos_lejos', 0.2]],
    ed_claro_de_las_bestias: [['ev_aullido', 0.3], ['ev_cuerno_orco', 0.18]]
  };
  const D = window.EDITOR_DATA;
  if (D && D.mapas) Object.keys(AMB).forEach(id => { if (D.mapas[id]) D.mapas[id].sonido = AMB[id]; });
  let prox = 0;
  const eventos = S => {
    const c = S.currentInterior, k = c && c.building && c.building.kind, L = k && EV[k];
    const now = performance.now();
    if (!L || S.isGamePaused) { prox = Math.max(prox, now + 6000); return; }
    if (now < prox) return;
    prox = now + azar(14000, 30000);
    const e = L[Math.floor(Math.random() * L.length)];
    son(e[0].replace(/^ev_/, 'ev_'), e[1] * azar(0.8, 1.1), { pan: azar(-0.8, 0.8), rate: azar(0.94, 1.04) });
  };

  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try { if (!P._ckSonEnv) { P._ckSonEnv = 1; envolverHacer(); } if (this.gameStarted && this.player) { estados(this); eventos(this); } } catch (e) {}
    return r;
  };
  ['startCampaign', 'startPractice'].forEach(fn => { const f0 = P[fn]; if (!f0) return; P[fn] = function () { const r = f0.apply(this, arguments); try { envolverHacer(); } catch (e) {} return r; }; });
  window.CK_SONIDOS = { son, DESPUES, AMB, EV };
})();
