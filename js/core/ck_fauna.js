'use strict';
/* Fauna: bichos que viven en los mapas de afuera, todos dibujados y animados por código.
   - Pájaros (y palomas en el patio) que picotean y salen volando si te acercás corriendo o peleás; con lluvia y de noche
     no están. Los del Camino al Castillo ya los tiene ck_camino.js.
   - Mariposas de día cerca de las flores y el pasto; luciérnagas de noche junto al agua y el bosque (alumbran un poco con
     el motor de luz).
   - Peces (sombras bajo el agua; alguno salta) y ranas en la orilla que croan de noche o con lluvia y se tiran al agua.
   - Gallinas en la aldea (escapan, cacarean; con lluvia y de noche se juntan junto al granero) y un gato que duerme al sol,
     se muda bajo el alero cuando llueve y junto a la fogata de noche.
   - Murciélagos al anochecer en el castillo y las ruinas; cuervos en las ruinas y el adarve.
   - Sonidos hechos por código y ubicados (izquierda/derecha y distancia): grillos de noche, ranas, cacareos, maullido,
     chillido de murciélago, chapuzones. `CK_SINTE` queda para otros archivos.
   Dónde va cada bicho lo dice el dibujo del minimapa (`CK_MINIMAPA.terreno`). Sacar la línea de index.html lo quita. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const RI = (a, b) => Math.floor(R(a, b + 1));
  const UNO = a => a[Math.floor(Math.random() * a.length)];

  // ------------------------------------------------------------------ qué vive en cada zona
  const FAUNA = {
    village: { aves: 2, mariposas: 6, luciernagas: 16, peces: 5, ranas: 4, gallinas: 4, gato: 1 },
    'ed_camino_al_castillo.main': { mariposas: 7, luciernagas: 20, peces: 6, ranas: 5 },
    'castle.courtyard': { palomas: 2, murcielagos: 3 },
    'castle.garden': { aves: 1, mariposas: 9, luciernagas: 12, peces: 3, ranas: 2 },
    'castle.training': { aves: 1, murcielagos: 2 },
    'castle.walls': { murcielagos: 5, cuervos: 1 },
    'ruins.village': { cuervos: 3, murcielagos: 6 }
  };
  // aldea: dónde andan las gallinas y dónde duerme el gato (píxeles de la aldea)
  const ALDEA = {
    corral: [[470, 205, 130, 95], [420, 425, 110, 50], [160, 330, 120, 60]],
    gallinero: [560, 214],
    gatoSol: [[470, 262], [262, 418], [120, 352]],
    gatoAlero: [96, 314],
    gatoFogata: [292, 500]
  };

  // ------------------------------------------------------------------ utilidades del mapa
  const zonaDe = S => (S.currentZoneKey ? S.currentZoneKey() : 'village');
  const areaDe = S => { const c = S.currentInterior; return c ? { x: c.area.x, y: c.area.y, w: c.area.w, h: c.area.h, out: window.CK_AFUERA ? window.CK_AFUERA(S) : c.area.outdoor } : { x: 0, y: 0, w: 640, h: 640, out: true }; };
  const ter = (zona, x, y) => (window.CK_MINIMAPA && window.CK_MINIMAPA.terreno ? window.CK_MINIMAPA.terreno(zona, x, y) : null);
  const juntoAlAgua = (zona, x, y, r) => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; if (ter(zona, x + Math.cos(a) * r, y + Math.sin(a) * r) === 'agua') return true; } return false; };
  const buscar = (zona, A, ok, intentos) => {
    for (let i = 0; i < (intentos || 80); i++) {
      const x = R(16, A.w - 16), y = R(24, A.h - 16);
      if (ok(ter(zona, x, y), x, y)) return [x, y];
    }
    return null;
  };
  const momento = S => {
    const p = S.dayPhase ? S.dayPhase() : 0.2;
    const noche = p > 0.6 && p < 0.94, oscurece = p > 0.5 && p < 0.97 && !(p > 0.62 && p < 0.9);
    const cl = window.CK_CLIMA && window.CK_CLIMA.estado ? window.CK_CLIMA.estado.act : { lluvia: 0, nieve: 0, viento: 0 };
    return { p, noche, dia: !noche, oscurece: p > 0.5 && p < 0.97, lluvia: cl.lluvia || 0, nieve: cl.nieve || 0, viento: cl.viento || 0 };
  };
  const heroe = S => { const b = S.player && S.player.body; return b ? { x: b.center.x, y: b.bottom, apura: !!(S.isRunning || S.isDashing || S.isAttacking) } : null; };

  // ------------------------------------------------------------------ sonidos por código (Web Audio)
  const SINTE = (() => {
    const ctx = () => (typeof sfx !== 'undefined' && sfx.ctx) || null;
    const vol = () => (typeof ambience !== 'undefined' ? ambience.master : 1) * (typeof sfx !== 'undefined' && sfx.enabled === false ? 0 : 1);
    let ruidoBuf = null;
    const ruido = c => {
      if (ruidoBuf) return ruidoBuf;
      ruidoBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = ruidoBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return ruidoBuf;
    };
    /** salida con volumen y lado; S, x, y (mundo) para ubicarlo respecto de la cámara */
    const salida = (S, x, y, v) => {
      const c = ctx(); if (!c) return null;
      const g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
      let pan = 0, k = 1;
      if (S && x !== undefined) {
        const w = S.cameras.main.worldView;
        pan = Math.max(-1, Math.min(1, (x - w.centerX) / (w.width * 0.6)));
        const d = Math.hypot(x - w.centerX, (y - w.centerY) * 1.3) / Math.max(w.width, 1);
        k = Math.max(0, 1 - d * 0.9);
      }
      g.gain.value = v * vol() * k;
      if (p) { p.pan.value = pan; g.connect(p); p.connect(c.destination); } else g.connect(c.destination);
      return { c, g, t: c.currentTime + 0.01 };
    };
    const env = (g, t, a, d, pico) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    return {
      grillo(S, x, y, tono) {
        const o = salida(S, x, y, 0.05); if (!o || o.g.gain.value < 0.002) return;
        for (let i = 0; i < 3; i++) {
          const os = o.c.createOscillator(), e = o.c.createGain();
          os.type = 'sine'; os.frequency.value = 4300 * (tono || 1); os.connect(e); e.connect(o.g);
          const t = o.t + i * 0.05; env(e, t, 0.005, 0.03, 1); os.start(t); os.stop(t + 0.05);
        }
      },
      rana(S, x, y) {
        const o = salida(S, x, y, 0.16); if (!o) return;
        [0, 0.2].forEach((d, i) => {
          const os = o.c.createOscillator(), lp = o.c.createBiquadFilter(), am = o.c.createOscillator(), ag = o.c.createGain(), e = o.c.createGain();
          os.type = 'sawtooth'; os.frequency.setValueAtTime(i ? 150 : 120, o.t + d); os.frequency.linearRampToValueAtTime(i ? 105 : 90, o.t + d + 0.16);
          lp.type = 'lowpass'; lp.frequency.value = 700; am.frequency.value = 28; ag.gain.value = 0.5;
          am.connect(ag); ag.connect(e.gain);
          os.connect(lp); lp.connect(e); e.connect(o.g);
          env(e, o.t + d, 0.01, 0.16, 0.9); os.start(o.t + d); am.start(o.t + d); os.stop(o.t + d + 0.2); am.stop(o.t + d + 0.2);
        });
      },
      cacareo(S, x, y) {
        const o = salida(S, x, y, 0.12); if (!o) return;
        const n = RI(2, 4);
        for (let i = 0; i < n; i++) {
          const os = o.c.createOscillator(), bp = o.c.createBiquadFilter(), e = o.c.createGain(), t = o.t + i * R(0.09, 0.14);
          os.type = 'square'; os.frequency.setValueAtTime(R(520, 700), t); os.frequency.exponentialRampToValueAtTime(R(300, 380), t + 0.07);
          bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 2;
          os.connect(bp); bp.connect(e); e.connect(o.g); env(e, t, 0.005, 0.07, 1); os.start(t); os.stop(t + 0.09);
        }
      },
      maullido(S, x, y) {
        const o = salida(S, x, y, 0.12); if (!o) return;
        const os = o.c.createOscillator(), bp = o.c.createBiquadFilter(), e = o.c.createGain(), t = o.t;
        os.type = 'sawtooth'; os.frequency.setValueAtTime(520, t); os.frequency.linearRampToValueAtTime(820, t + 0.18); os.frequency.linearRampToValueAtTime(480, t + 0.55);
        bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(1600, t + 0.2); bp.frequency.linearRampToValueAtTime(700, t + 0.55); bp.Q.value = 3;
        os.connect(bp); bp.connect(e); e.connect(o.g); env(e, t, 0.04, 0.5, 1); os.start(t); os.stop(t + 0.6);
      },
      chillido(S, x, y) {
        const o = salida(S, x, y, 0.05); if (!o) return;
        for (let i = 0; i < RI(2, 3); i++) {
          const os = o.c.createOscillator(), e = o.c.createGain(), t = o.t + i * 0.07;
          os.type = 'sine'; os.frequency.setValueAtTime(R(7000, 9000), t); os.frequency.exponentialRampToValueAtTime(R(4500, 5500), t + 0.04);
          os.connect(e); e.connect(o.g); env(e, t, 0.003, 0.04, 1); os.start(t); os.stop(t + 0.05);
        }
      },
      chapuzon(S, x, y, fuerza) {
        const o = salida(S, x, y, 0.12 * (fuerza || 1)); if (!o) return;
        const n = o.c.createBufferSource(), bp = o.c.createBiquadFilter(), e = o.c.createGain(), t = o.t;
        n.buffer = ruido(o.c); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(600, t + 0.18); bp.Q.value = 1.2;
        n.connect(bp); bp.connect(e); e.connect(o.g); env(e, t, 0.005, 0.2, 1); n.start(t, Math.random() * 0.5); n.stop(t + 0.25);
      },
      gota(S, x, y) {
        const o = salida(S, x, y, 0.07); if (!o) return;
        const os = o.c.createOscillator(), e = o.c.createGain(), t = o.t;
        os.type = 'sine'; os.frequency.setValueAtTime(R(1300, 1700), t); os.frequency.exponentialRampToValueAtTime(R(500, 650), t + 0.06);
        os.connect(e); e.connect(o.g); env(e, t, 0.002, 0.08, 1); os.start(t); os.stop(t + 0.1);
      },
      pajaros(S, x, y) {
        if (window.CK_SONIDO && window.CK_SONIDO.tocar) {
          const w = S.cameras.main.worldView;
          window.CK_SONIDO.tocar('ev_pajaro', { vol: 0.22, rate: R(1.05, 1.3), pan: Math.max(-1, Math.min(1, (x - w.centerX) / (w.width * 0.6))) });
        }
      },
      cuervo(S, x, y) {
        if (window.CK_SONIDO && window.CK_SONIDO.tocar) {
          const w = S.cameras.main.worldView;
          window.CK_SONIDO.tocar('ev_cuervo', { vol: 0.25, rate: R(0.9, 1.1), pan: Math.max(-1, Math.min(1, (x - w.centerX) / (w.width * 0.6))) });
        }
      }
    };
  })();
  window.CK_SINTE = SINTE;

  // ------------------------------------------------------------------ dibujos por código
  const lienzo = (S, key, w, h, n, dibujar) => {
    if (S.textures.exists(key)) return key;
    const cv = document.createElement('canvas'); cv.width = w * n; cv.height = h;
    const g = cv.getContext('2d');
    const px = (f, col, pts) => { g.fillStyle = col; pts.forEach(([x, y, a, b]) => g.fillRect(f * w + x, y, a || 1, b || 1)); };
    dibujar(px, g);
    const t = S.textures.addCanvas(key, cv);
    for (let i = 0; i < n; i++) t.add(i, 0, i * w, 0, w, h);
    return key;
  };
  // pájaros: 0 parado, 1 picotea, 2 alas arriba, 3 alas abajo (mira a la derecha)
  const AVES = {
    gorrion: { c: '#b49a7a', p: '#efe4d2', a: '#7c6650', b: '#3a2a20' },
    petirrojo: { c: '#7a5a40', p: '#e0603a', a: '#5c4230', b: '#3a2a20' },
    azulejo: { c: '#3f6fc4', p: '#f0a656', a: '#2b4f94', b: '#2a2a2a' },
    paloma: { c: '#9aa0ac', p: '#c8ccd6', a: '#6e7480', b: '#d27a7a' },
    cuervo: { c: '#1e1c24', p: '#2e2c36', a: '#121018', b: '#3a3640' }
  };
  const texAve = (S, sp) => lienzo(S, 'ckf_ave_' + sp, 10, 8, 4, px => {
    const e = AVES[sp];
    px(0, e.c, [[3, 3, 4, 3], [6, 2, 2, 2], [2, 4, 1, 1]]); px(0, e.p, [[4, 5, 3, 1], [6, 4, 1, 1]]); px(0, e.a, [[3, 3, 2, 2]]); px(0, e.b, [[8, 3], [4, 6, 1, 2], [6, 6, 1, 2]]); px(0, '#111', [[7, 2]]);
    px(1, e.c, [[2, 3, 4, 3], [6, 4, 2, 2], [1, 3, 1, 1]]); px(1, e.p, [[3, 5, 3, 1]]); px(1, e.a, [[2, 3, 2, 2]]); px(1, e.b, [[8, 6], [3, 6, 1, 2], [5, 6, 1, 2]]);
    px(2, e.c, [[3, 4, 4, 2], [7, 3, 2, 2], [1, 4, 2, 1]]); px(2, e.a, [[3, 1, 2, 3], [5, 0, 2, 3]]); px(2, e.p, [[4, 5, 3, 1]]); px(2, e.b, [[9, 4]]);
    px(3, e.c, [[3, 3, 4, 2], [7, 2, 2, 2], [1, 3, 2, 1]]); px(3, e.a, [[3, 5, 2, 2], [5, 5, 2, 3]]); px(3, e.p, [[4, 4, 3, 1]]); px(3, e.b, [[9, 3]]);
  });
  const texMariposa = S => lienzo(S, 'ckf_mariposa', 5, 4, 2, px => {
    px(0, '#ffffff', [[0, 0, 2, 2], [3, 0, 2, 2], [0, 2, 2, 1], [3, 2, 2, 1]]); px(0, '#2a2018', [[2, 0, 1, 4]]);
    px(1, '#ffffff', [[1, 0, 1, 2], [3, 0, 1, 2]]); px(1, '#2a2018', [[2, 0, 1, 4]]);
  });
  const texLuciernaga = S => lienzo(S, 'ckf_luciernaga', 3, 3, 1, px => { px(0, 'rgba(220,255,140,0.55)', [[0, 1, 3, 1], [1, 0, 1, 3]]); px(0, '#f6ffc8', [[1, 1]]); });
  const texPez = S => lienzo(S, 'ckf_pez', 12, 5, 2, px => {
    const c = 'rgba(14,26,40,0.9)';
    px(0, c, [[3, 1, 6, 3], [9, 2, 2, 1], [2, 2, 1, 1], [0, 1, 2, 1], [0, 3, 2, 1]]);
    px(1, c, [[3, 1, 6, 3], [9, 2, 2, 1], [2, 2, 1, 1], [1, 0, 1, 2], [0, 2, 2, 1]]);
  });
  const texPezSalto = S => lienzo(S, 'ckf_pez_salto', 7, 3, 1, px => { px(0, '#c8d4e0', [[1, 0, 4, 3], [5, 1, 1, 1], [0, 0, 1, 1], [0, 2, 1, 1]]); px(0, '#7a8ea4', [[1, 2, 4, 1]]); px(0, '#111', [[4, 1]]); });
  const texRana = S => lienzo(S, 'ckf_rana', 7, 6, 3, px => {
    const v = '#5a9a3a', o = '#3e7426', p = '#c8e08a';
    px(0, v, [[1, 2, 5, 3], [2, 1, 3, 1]]); px(0, o, [[0, 4, 2, 2], [5, 4, 2, 2]]); px(0, p, [[2, 4, 3, 1]]); px(0, '#111', [[2, 1], [4, 1]]);
    px(1, v, [[1, 2, 5, 3], [2, 1, 3, 1]]); px(1, o, [[0, 4, 2, 2], [5, 4, 2, 2]]); px(1, '#e8f4b8', [[2, 4, 3, 2]]); px(1, '#111', [[2, 1], [4, 1]]);
    px(2, v, [[1, 1, 5, 2], [2, 0, 3, 1]]); px(2, o, [[0, 3, 1, 3], [6, 3, 1, 3], [1, 3, 1, 1], [5, 3, 1, 1]]); px(2, '#111', [[2, 0], [4, 0]]);
  });
  // gallinas: 0 parada, 1 picotea, 2 camina, 3 corre con alas
  const texGallina = (S, marron) => lienzo(S, 'ckf_gallina' + (marron ? 'M' : 'B'), 9, 9, 4, px => {
    const c = marron ? '#a8683a' : '#f2efe6', s = marron ? '#7c4a26' : '#c8c2b4', r = '#d8342a', a = '#e8b030';
    const cuerpo = (f, dy, cab) => {
      px(f, c, [[1, 3 + dy, 6, 4], [0, 2 + dy, 2, 2]]); px(f, s, [[2, 4 + dy, 3, 2]]);
      px(f, c, cab); px(f, r, [[cab[0][0], cab[0][1] - 1, 2, 1], [cab[0][0] + 1, cab[0][1] + 2, 1, 1]]);
    };
    cuerpo(0, 0, [[6, 0, 2, 3]]); px(0, a, [[8, 1], [3, 7, 1, 2], [5, 7, 1, 2]]); px(0, '#111', [[7, 1]]);
    cuerpo(1, 1, [[7, 3, 2, 3]]); px(1, a, [[8, 6], [3, 8, 1, 1], [5, 8, 1, 1]]); px(1, '#111', [[8, 4]]);
    cuerpo(2, 0, [[6, 0, 2, 3]]); px(2, a, [[8, 1], [2, 7, 1, 2], [6, 7, 1, 2]]); px(2, '#111', [[7, 1]]);
    cuerpo(3, -1, [[6, 0, 2, 2]]); px(3, s, [[1, 0, 3, 2], [0, 1, 2, 1]]); px(3, a, [[8, 1], [3, 6, 1, 2], [6, 7, 1, 2]]); px(3, '#111', [[7, 0]]);
  });
  // gato atigrado: 0-1 dormido (respira), 2 sentado, 3-4 camina
  const texGato = S => lienzo(S, 'ckf_gato', 13, 9, 5, px => {
    const n = '#d8862e', o = '#a85a1a', cl = '#f4c890';
    px(0, n, [[2, 4, 9, 4], [9, 3, 3, 3]]); px(0, o, [[4, 4, 1, 4], [6, 4, 1, 4], [8, 4, 1, 3], [1, 6, 2, 2], [0, 7, 3, 1]]); px(0, cl, [[3, 7, 7, 1]]); px(0, n, [[9, 2], [11, 2]]); px(0, '#3a2210', [[10, 4], [11, 4]]);
    px(1, n, [[2, 3, 9, 5], [9, 3, 3, 3]]); px(1, o, [[4, 3, 1, 5], [6, 3, 1, 5], [8, 3, 1, 4], [1, 6, 2, 2], [0, 7, 3, 1]]); px(1, cl, [[3, 7, 7, 1]]); px(1, n, [[9, 2], [11, 2]]); px(1, '#3a2210', [[10, 4], [11, 4]]);
    px(2, n, [[5, 3, 4, 6], [8, 0, 4, 4]]); px(2, o, [[6, 4, 1, 4], [3, 6, 2, 3], [2, 5, 1, 2]]); px(2, cl, [[9, 5, 2, 3]]); px(2, n, [[8, 0], [11, 0]]); px(2, '#2a1a08', [[9, 2], [11, 2]]); px(2, '#f4a0a0', [[10, 3]]);
    px(3, n, [[2, 3, 8, 3], [9, 1, 4, 3]]); px(3, o, [[4, 3, 1, 3], [6, 3, 1, 3], [0, 2, 2, 1], [1, 1, 1, 1]]); px(3, n, [[2, 6, 1, 3], [8, 6, 1, 2], [4, 6, 1, 2], [6, 6, 1, 3]]); px(3, '#2a1a08', [[11, 2]]);
    px(4, n, [[2, 3, 8, 3], [9, 1, 4, 3]]); px(4, o, [[4, 3, 1, 3], [6, 3, 1, 3], [0, 3, 2, 1], [0, 2, 1, 1]]); px(4, n, [[3, 6, 1, 2], [7, 6, 1, 3], [5, 6, 1, 3], [9, 6, 1, 2]]); px(4, '#2a1a08', [[11, 2]]);
  });
  const texMurcielago = S => lienzo(S, 'ckf_murcielago', 9, 5, 2, px => {
    const c = '#2a1e30', a = '#3e2c48';
    px(0, c, [[3, 1, 3, 3], [4, 0, 1, 1]]); px(0, a, [[0, 0, 3, 1], [6, 0, 3, 1], [1, 1, 2, 1], [6, 1, 2, 1]]); px(0, '#d84a4a', [[3, 2], [5, 2]]);
    px(1, c, [[3, 1, 3, 3], [4, 0, 1, 1]]); px(1, a, [[0, 3, 3, 1], [6, 3, 3, 1], [1, 2, 2, 1], [6, 2, 2, 1]]); px(1, '#d84a4a', [[3, 2], [5, 2]]);
  });
  const texOnda = S => {
    if (S.textures.exists('ck_onda')) return 'ck_onda';
    return lienzo(S, 'ckf_onda', 13, 6, 4, (px, g) => {
      [[1.6, 0.8, 0.9], [3.4, 1.4, 0.8], [5, 2, 0.6], [6, 2.5, 0.35]].forEach(([rx, ry, al], i) => {
        for (let y = 0; y < 6; y++) for (let x = 0; x < 13; x++) {
          const dx = (x + 0.5 - 6.5) / rx, dy = (y + 0.5 - 3) / ry, d = dx * dx + dy * dy;
          if (Math.abs(d - 1) < 0.45 / Math.max(1, rx / 2)) px(i, 'rgba(214,232,255,' + al + ')', [[x, y]]);
        }
      });
    });
  };
  const onda = (S, x, y) => {
    const key = texOnda(S), fr = key === 'ck_onda' ? ['o0', 'o1', 'o2', 'o3'] : [0, 1, 2, 3];
    const sp = S.add.sprite(x, y, key, fr[0]).setDepth(Math.max(1, y - 40));
    let i = 0;
    S.time.addEvent({ delay: 110, repeat: 3, callback: () => { i++; if (!sp.active) return; if (i > 3) sp.destroy(); else sp.setFrame(fr[i]); } });
    S.time.delayedCall(520, () => sp.active && sp.destroy());
  };

  // ------------------------------------------------------------------ cada bicho
  const profAgua = (S, zona) => (zona === 'village' ? 0.62 : 7.02);
  const nuevo = (S, A, zona, tipo, cant) => {
    const out = [];
    const mundo = (x, y) => [A.x + x, A.y + y];
    if (tipo === 'aves' || tipo === 'palomas' || tipo === 'cuervos') {
      // bandadas: cant = cuántas bandadas
      for (let b = 0; b < cant; b++) {
        const sp0 = tipo === 'palomas' ? 'paloma' : tipo === 'cuervos' ? 'cuervo' : UNO(['gorrion', 'petirrojo', 'azulejo', 'gorrion']);
        const pt = buscar(zona, A, (t) => tipo === 'aves' ? t === 'pasto' || t === 'camino' : t && t !== 'agua' && t !== 'techo' && t !== 'muro' && t !== 'borde');
        if (!pt) continue;
        const banda = { tipo, sp0, x: pt[0], y: pt[1], estado: 'suelo', vuelve: 0, miembros: [] };
        const n = tipo === 'cuervos' ? RI(2, 4) : RI(3, 5);
        for (let i = 0; i < n; i++) {
          const [x, y] = mundo(pt[0] + R(-16, 16), pt[1] + R(-10, 10));
          const s = S.add.sprite(x, y, texAve(S, sp0), 0).setOrigin(0.5, 1).setScale(sp0 === 'paloma' || sp0 === 'cuervo' ? 1.7 : 1.5).setDepth(y).setFlipX(Math.random() < 0.5);
          banda.miembros.push({ s, t: R(300, 2000), vx: 0, vy: 0 });
        }
        out.push(banda);
      }
    } else if (tipo === 'mariposas') {
      for (let i = 0; i < cant; i++) {
        const pt = buscar(zona, A, (t, x, y) => t === 'pasto' && y > 50); if (!pt) continue;
        const [x, y] = mundo(pt[0], pt[1]);
        const s = S.add.sprite(x, y, texMariposa(S), 0).setScale(1.4).setTint(UNO([0xffffff, 0xffd34d, 0x8ec5ff, 0xff9ad5, 0xffa14d, 0xc6f07a]));
        out.push({ tipo, s, cx: x, cy: y, fase: R(0, 9), vel: R(0.6, 1.2), alto: R(10, 22) });
      }
    } else if (tipo === 'luciernagas') {
      for (let i = 0; i < cant; i++) {
        const pt = buscar(zona, A, (t, x, y) => (t === 'pasto' || t === 'bosque') && (juntoAlAgua(zona, x, y, 40) || t === 'bosque' || Math.random() < 0.3), 120); if (!pt) continue;
        const [x, y] = mundo(pt[0], pt[1]);
        const s = S.add.image(x, y, texLuciernaga(S)).setBlendMode(Phaser.BlendModes.ADD).setDepth(27510).setScale(1.5); // encima de la oscuridad: brillan
        out.push({ tipo, s, cx: x, cy: y, fase: R(0, 20), ritmo: R(0.6, 1.2), luz: 0 });
      }
    } else if (tipo === 'peces') {
      for (let i = 0; i < cant; i++) {
        const pt = buscar(zona, A, (t, x, y) => t === 'agua' && ter(zona, x + 10, y) === 'agua' && ter(zona, x - 10, y) === 'agua', 200); if (!pt) continue;
        const [x, y] = mundo(pt[0], pt[1]);
        const s = S.add.sprite(x, y, texPez(S), 0).setAlpha(0.32).setDepth(profAgua(S, zona)).setScale(R(0.9, 1.3));
        const a = R(0, Math.PI * 2);
        out.push({ tipo, s, ang: a, vel: R(10, 22), giro: 0, salto: R(6000, 25000), t: 0 });
      }
    } else if (tipo === 'ranas') {
      for (let i = 0; i < cant; i++) {
        const pt = buscar(zona, A, (t, x, y) => (t === 'pasto' || t === 'piedra' || t === 'camino') && juntoAlAgua(zona, x, y, 14), 220); if (!pt) continue;
        const [x, y] = mundo(pt[0], pt[1]);
        const s = S.add.sprite(x, y, texRana(S), 0).setOrigin(0.5, 1).setScale(1.3).setDepth(y).setFlipX(Math.random() < 0.5);
        out.push({ tipo, s, estado: 'quieta', croa: R(2000, 9000), t: 0 });
      }
    } else if (tipo === 'gallinas' && zona === 'village') {
      for (let i = 0; i < cant; i++) {
        const r = UNO(ALDEA.corral), x = R(r[0], r[0] + r[2]), y = R(r[1], r[1] + r[3]);
        const s = S.add.sprite(x, y, texGallina(S, i % 2 === 1), 0).setOrigin(0.5, 1).setScale(1.3).setDepth(y);
        out.push({ tipo, s, corral: r, estado: 'pica', t: R(500, 2000), vx: 0, vy: 0, ani: 0 });
      }
    } else if (tipo === 'gato' && zona === 'village') {
      const [x, y] = UNO(ALDEA.gatoSol);
      const s = S.add.sprite(x, y, texGato(S), 0).setOrigin(0.5, 1).setScale(1.3).setDepth(y);
      out.push({ tipo, s, estado: 'duerme', destino: null, t: 0, maulla: 0 });
    } else if (tipo === 'murcielagos') {
      for (let i = 0; i < cant; i++) {
        const s = S.add.sprite(A.x + R(0, A.w), A.y + R(0, A.h * 0.6), texMurcielago(S), 0).setScale(1.4).setDepth(27300).setAlpha(0);
        out.push({ tipo, s, cx: R(0.2, 0.8), cy: R(0.15, 0.55), fx: R(0.3, 0.7), fy: R(0.5, 1.1), fase: R(0, 10), radio: R(60, 160), chilla: R(3000, 12000) });
      }
    }
    return out;
  };

  // ------------------------------------------------------------------ comportamiento
  const cerca = (h, x, y, r) => h && Math.hypot(h.x - x, h.y - y) < r;
  const espantar = (S, b, h) => {
    b.estado = 'vuela'; b.vuelve = R(14000, 30000);
    const m0 = b.miembros[0] && b.miembros[0].s;
    if (m0) (b.sp0 === 'cuervo' ? SINTE.cuervo : SINTE.pajaros)(S, m0.x, m0.y);
    b.miembros.forEach(m => {
      const dx = m.s.x - (h ? h.x : m.s.x - 1), dir = Math.sign(dx) || 1;
      m.vx = dir * R(70, 130); m.vy = R(-95, -55); m.s.setFlipX(dir < 0).setDepth(27300); m.t = 0;
    });
  };
  const posar = (S, A, zona, b) => {
    const pt = buscar(zona, A, (t) => b.tipo === 'aves' ? t === 'pasto' || t === 'camino' : t && t !== 'agua' && t !== 'techo' && t !== 'muro' && t !== 'borde');
    if (!pt) return;
    b.estado = 'suelo';
    b.miembros.forEach(m => {
      const x = A.x + pt[0] + R(-16, 16), y = A.y + pt[1] + R(-10, 10);
      m.s.setPosition(x, y).setDepth(y).setAlpha(0).setFrame(0); m.t = R(300, 1500);
      S.tweens.add({ targets: m.s, alpha: 1, duration: 600 });
    });
  };
  const paso = (S, F, dt) => {
    const A = F.A, zona = F.zona, h = heroe(S), M = momento(S), t = S.time.now;
    const hayLluvia = M.lluvia > 0.3 || M.nieve > 0.5;
    F.lista.forEach(b => {
      if (b.tipo === 'aves' || b.tipo === 'palomas' || b.tipo === 'cuervos') {
        const deDia = b.tipo === 'cuervos' ? true : M.dia;
        if (b.estado === 'suelo') {
          if (!deDia || hayLluvia) { espantar(S, b, null); b.vuelve = 20000; return; }
          const m0 = b.miembros[0] && b.miembros[0].s;
          if (m0 && cerca(h, m0.x, m0.y, h.apura ? 110 : 55)) { espantar(S, b, h); return; }
          b.miembros.forEach(m => {
            m.t -= dt;
            if (m.t <= 0) {
              const r = Math.random();
              if (r < 0.45) { m.s.setFrame(m.s.frame.name == 1 ? 0 : 1); m.t = R(200, 700); }
              else if (r < 0.8) { const d = R(-8, 8); m.s.setFlipX(d < 0); m.s.x += d; m.s.y += R(-3, 3); m.s.setDepth(m.s.y); m.s.setFrame(0); m.t = R(400, 1500); }
              else { m.s.setFlipX(!m.s.flipX); m.t = R(500, 1800); }
            }
          });
        } else {
          b.miembros.forEach(m => {
            m.t += dt; m.s.x += m.vx * dt / 1000; m.s.y += m.vy * dt / 1000; m.vy -= 12 * dt / 1000;
            m.s.setFrame(Math.floor(t / 70 + m.vx) % 2 ? 2 : 3);
            if (m.t > 1500) m.s.setAlpha(Math.max(0, m.s.alpha - dt / 600));
          });
          b.vuelve -= dt;
          if (b.vuelve <= 0 && deDia && !hayLluvia) posar(S, A, zona, b);
        }
      } else if (b.tipo === 'mariposas') {
        const ver = M.dia && !hayLluvia && M.viento > -100;
        b.s.setAlpha(Math.max(0, Math.min(1, b.s.alpha + (ver ? 1 : -1) * dt / 800)));
        b.fase += dt / 1000 * b.vel;
        let x = b.cx + Math.sin(b.fase * 0.7) * 34 + Math.sin(b.fase * 1.9) * 9, y = b.cy + Math.cos(b.fase * 0.5) * 18 - b.alto - Math.abs(Math.sin(b.fase * 3)) * 6;
        if (h && cerca(h, x, y + b.alto, 30)) { b.cx += Math.sign(b.cx - h.x || 1) * dt / 30; }
        b.s.setPosition(x, y).setDepth(y + b.alto + 30).setFrame(Math.floor(t / 90 + b.fase * 10) % 2).setFlipX(Math.cos(b.fase * 0.7) < 0);
      } else if (b.tipo === 'luciernagas') {
        const ver = M.noche && !hayLluvia;
        b.fase += dt / 1000;
        const on = Math.max(0, Math.sin(b.fase * b.ritmo * 2.2)) ** 2;
        b.luz = (ver ? 1 : 0) * on;
        b.s.setAlpha(b.luz).setPosition(b.cx + Math.sin(b.fase * 0.4) * 26 + Math.sin(b.fase * 1.3) * 6, b.cy - 10 + Math.cos(b.fase * 0.33) * 14);
      } else if (b.tipo === 'peces') {
        b.t += dt; b.giro -= dt;
        if (b.giro <= 0) { b.ang += R(-0.8, 0.8); b.giro = R(800, 2600); b.vel = R(8, 24); }
        const nx = b.s.x + Math.cos(b.ang) * b.vel * dt / 1000, ny = b.s.y + Math.sin(b.ang) * b.vel * 0.5 * dt / 1000;
        const ax = nx - A.x + Math.cos(b.ang) * 8, ay = ny - A.y + Math.sin(b.ang) * 4;
        if (ter(zona, ax, ay) === 'agua') b.s.setPosition(nx, ny); else { b.ang += Math.PI + R(-0.5, 0.5); }
        b.s.setRotation(b.ang + Math.PI).setFrame(Math.floor(t / 220 + b.vel) % 2);
        const hielo = window.CK_NIEVE && window.CK_NIEVE.hielo ? window.CK_NIEVE.hielo() : 0;
        b.s.setAlpha((hayLluvia ? 0.2 : 0.32) * (1 - hielo));
        if (hielo > 0.4) return;
        b.salto -= dt;
        if (b.salto <= 0) {
          b.salto = R(15000, 40000);
          if (S.cameras.main.worldView.contains(b.s.x, b.s.y)) {
            const sp = S.add.image(b.s.x, b.s.y, texPezSalto(S)).setScale(1.3).setDepth(b.s.y + 20).setFlipX(Math.cos(b.ang) < 0);
            const x0 = b.s.x, y0 = b.s.y, dx = Math.cos(b.ang) * 18, k = { t: 0 };
            onda(S, x0, y0); SINTE.chapuzon(S, x0, y0, 0.5);
            S.tweens.add({ targets: k, t: 1, duration: 520, onUpdate: () => sp.setPosition(x0 + dx * k.t, y0 - Math.sin(k.t * Math.PI) * 14).setRotation((k.t - 0.5) * (dx > 0 ? 1.4 : -1.4)), onComplete: () => { sp.destroy(); onda(S, x0 + dx, y0); SINTE.chapuzon(S, x0 + dx, y0, 0.6); } });
          }
        }
      } else if (b.tipo === 'ranas') {
        // con el agua congelada se esconden
        const fria = window.CK_NIEVE && window.CK_NIEVE.hielo ? window.CK_NIEVE.hielo() > 0.4 : false;
        b.s.setVisible(!fria && b.estado !== 'agua');
        if (fria) return;
        if (b.estado === 'quieta') {
          if (cerca(h, b.s.x, b.s.y, h && h.apura ? 80 : 48)) {
            // se tira al agua
            b.estado = 'salta';
            let tx = b.s.x, ty = b.s.y;
            for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; if (ter(zona, b.s.x - A.x + Math.cos(a) * 22, b.s.y - A.y + Math.sin(a) * 22) === 'agua') { tx = b.s.x + Math.cos(a) * 22; ty = b.s.y + Math.sin(a) * 22; break; } }
            const x0 = b.s.x, y0 = b.s.y, k = { t: 0 };
            b.s.setFrame(2).setFlipX(tx < x0);
            S.tweens.add({ targets: k, t: 1, duration: 340, onUpdate: () => b.s.setPosition(x0 + (tx - x0) * k.t, y0 + (ty - y0) * k.t - Math.sin(k.t * Math.PI) * 12), onComplete: () => { onda(S, tx, ty); SINTE.chapuzon(S, tx, ty, 0.8); b.s.setVisible(false); b.estado = 'agua'; b.t = R(15000, 30000); } });
            return;
          }
          b.croa -= dt;
          if (b.croa <= 0) {
            b.croa = R(3000, 11000);
            if (M.noche || M.lluvia > 0.2) { b.s.setFrame(1); S.time.delayedCall(420, () => b.s.active && b.estado === 'quieta' && b.s.setFrame(0)); if (S.cameras.main.worldView.contains(b.s.x, b.s.y) || Math.random() < 0.3) SINTE.rana(S, b.s.x, b.s.y); }
          }
        } else if (b.estado === 'agua') {
          b.t -= dt;
          if (b.t <= 0 && !cerca(h, b.s.x, b.s.y, 160)) {
            const pt = buscar(zona, A, (tt, x, y) => (tt === 'pasto' || tt === 'piedra' || tt === 'camino') && juntoAlAgua(zona, x, y, 14), 120);
            if (pt) { b.s.setPosition(A.x + pt[0], A.y + pt[1]).setDepth(A.y + pt[1]).setFrame(0).setVisible(true); b.estado = 'quieta'; }
            else b.t = 5000;
          }
        }
      } else if (b.tipo === 'gallinas') {
        const resguardo = hayLluvia || M.noche;
        b.t -= dt;
        if (resguardo) {
          const [gx, gy] = ALDEA.gallinero, d = Math.hypot(gx - b.s.x, gy - b.s.y);
          if (d > 14 + (b.s.frame.name % 3) * 4) { b.s.x += (gx - b.s.x) / d * 26 * dt / 1000; b.s.y += (gy - b.s.y) / d * 26 * dt / 1000; b.s.setFlipX(gx < b.s.x).setFrame(Math.floor(t / 160) % 2 ? 2 : 0); }
          else b.s.setFrame(0);
        } else if (cerca(h, b.s.x, b.s.y, h && h.apura ? 70 : 38) && b.estado !== 'huye') {
          b.estado = 'huye'; b.t = R(700, 1100);
          const a = Math.atan2(b.s.y - h.y, b.s.x - h.x) + R(-0.5, 0.5);
          b.vx = Math.cos(a) * 95; b.vy = Math.sin(a) * 70;
          if (Math.random() < 0.7) SINTE.cacareo(S, b.s.x, b.s.y);
        } else if (b.estado === 'huye') {
          b.s.x += b.vx * dt / 1000; b.s.y += b.vy * dt / 1000; b.s.setFlipX(b.vx < 0).setFrame(3);
          if (b.t <= 0) { b.estado = 'pica'; b.t = R(500, 1500); }
        } else if (b.estado === 'camina') {
          b.s.x += b.vx * dt / 1000; b.s.y += b.vy * dt / 1000; b.s.setFrame(Math.floor(t / 150) % 2 ? 2 : 0);
          const r = b.corral;
          if (b.s.x < r[0] || b.s.x > r[0] + r[2] || b.s.y < r[1] || b.s.y > r[1] + r[3]) { b.vx = -b.vx; b.vy = -b.vy; b.s.setFlipX(b.vx < 0); }
          if (b.t <= 0) { b.estado = 'pica'; b.t = R(600, 2200); }
        } else {
          if (b.t <= 0) {
            if (Math.random() < 0.55) { b.estado = 'camina'; const a = R(0, Math.PI * 2); b.vx = Math.cos(a) * 20; b.vy = Math.sin(a) * 14; b.s.setFlipX(b.vx < 0); b.t = R(600, 1600); }
            else { b.s.setFrame(b.s.frame.name == 1 ? 0 : 1); b.t = R(250, 900); if (Math.random() < 0.06 && S.cameras.main.worldView.contains(b.s.x, b.s.y)) SINTE.cacareo(S, b.s.x, b.s.y); }
          }
        }
        b.s.setDepth(b.s.y);
      } else if (b.tipo === 'gato') {
        // dónde quiere estar: alero con lluvia, fogata de noche (si está prendida), al sol de día
        const fog = window.CK_CLIMA && window.CK_CLIMA.fuegos ? window.CK_CLIMA.fuegos().find(f => f.k === 'ck_aldea_fogata') : null;
        let quiere = hayLluvia ? ALDEA.gatoAlero : M.noche && !(fog && fog.apagado) ? ALDEA.gatoFogata : (b.sol || (b.sol = UNO(ALDEA.gatoSol)));
        if (!b.destino || b.destino[0] !== quiere[0] || b.destino[1] !== quiere[1]) { b.destino = quiere; if (Math.hypot(quiere[0] - b.s.x, quiere[1] - b.s.y) > 6) b.estado = 'camina'; }
        if (b.estado === 'camina') {
          const d = Math.hypot(b.destino[0] - b.s.x, b.destino[1] - b.s.y);
          if (d < 3) { b.estado = 'sienta'; b.t = R(1500, 3000); }
          else { const v = hayLluvia ? 46 : 26; b.s.x += (b.destino[0] - b.s.x) / d * v * dt / 1000; b.s.y += (b.destino[1] - b.s.y) / d * v * dt / 1000; b.s.setFlipX(b.destino[0] < b.s.x).setFrame(Math.floor(t / 170) % 2 ? 3 : 4); }
        } else if (b.estado === 'sienta') { b.s.setFrame(2); b.t -= dt; if (b.t <= 0) b.estado = 'duerme'; }
        else b.s.setFrame(Math.floor(t / 1400) % 2);
        b.maulla -= dt;
        if (cerca(h, b.s.x, b.s.y, 36) && b.maulla <= 0) { b.maulla = 25000; SINTE.maullido(S, b.s.x, b.s.y); if (b.estado === 'duerme') { b.estado = 'sienta'; b.t = 2500; } }
        b.s.setDepth(b.s.y);
      } else if (b.tipo === 'murcielagos') {
        const ver = M.oscurece && !(M.lluvia > 0.5);
        b.s.setAlpha(Math.max(0, Math.min(1, b.s.alpha + (ver ? 1 : -1) * dt / 1200)));
        if (b.s.alpha <= 0) return;
        b.fase += dt / 1000;
        const w = S.cameras.main.worldView;
        const x = w.x + w.width * b.cx + Math.sin(b.fase * b.fx * 2) * b.radio + Math.sin(b.fase * 3.1) * 12;
        const y = w.y + w.height * b.cy + Math.sin(b.fase * b.fy * 2 + 1) * b.radio * 0.45 + Math.cos(b.fase * 4.3) * 8;
        b.s.setFlipX(x < b.s.x).setPosition(x, y).setFrame(Math.floor(t / 60 + b.fase * 7) % 2);
        b.chilla -= dt;
        if (b.chilla <= 0) { b.chilla = R(4000, 14000); SINTE.chillido(S, x, y); }
      }
    });
  };

  // ------------------------------------------------------------------ grillos (de noche, afuera, sin lluvia)
  const grillos = (S, F, dt) => {
    const M = momento(S);
    if (!F.A.out || !M.noche || M.lluvia > 0.2 || M.nieve > 0.2 || !F.pasto) return;
    F.grillo = (F.grillo || 0) - dt;
    if (F.grillo > 0) return;
    F.grillo = R(250, 700);
    if (!F.voces) F.voces = [0, 1, 2, 3].map(() => ({ dx: R(-0.6, 0.6), dy: R(-0.4, 0.4), tono: R(0.92, 1.08) }));
    const v = UNO(F.voces), w = S.cameras.main.worldView;
    SINTE.grillo(S, w.centerX + v.dx * w.width, w.centerY + v.dy * w.height, v.tono);
  };

  // ------------------------------------------------------------------ armar y desarmar por zona
  const limpiar = F => {
    if (!F) return;
    F.lista.forEach(b => { (b.miembros ? b.miembros.map(m => m.s) : [b.s]).forEach(s => s && s.destroy && s.destroy()); });
    F.lista = [];
  };
  const armar = (S, zona) => {
    const A = areaDe(S), cfg = FAUNA[zona];
    const F = { zona, A, lista: [], pasto: false };
    if (!cfg || !A.out || !window.CK_MINIMAPA || !window.CK_MINIMAPA.terreno || ter(zona, 10, 10) === null) return F;
    Object.keys(cfg).forEach(tipo => { F.lista = F.lista.concat(nuevo(S, A, zona, tipo, cfg[tipo])); });
    F.pasto = !!buscar(zona, A, t => t === 'pasto', 30);
    return F;
  };

  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    try {
      if (this._gameMode === 'campaign' && !this.isGamePaused && this.player) {
        const zona = zonaDe(this);
        let F = this._ckFauna;
        if (!F || F.zona !== zona) {
          limpiar(F);
          // esperar a que la zona termine de armarse
          this._ckFaunaEspera = (F && F.zona !== zona) || !F ? 500 : 0;
          F = this._ckFauna = { zona, A: areaDe(this), lista: [], armado: false };
        }
        if (!F.armado) {
          this._ckFaunaEspera -= Math.min(100, dt || 16);
          if (this._ckFaunaEspera <= 0 && !this._doorTransition) { const n = armar(this, zona); Object.assign(F, n, { armado: true }); }
        } else {
          paso(this, F, Math.min(100, dt || 16));
          grillos(this, F, Math.min(100, dt || 16));
        }
      }
    } catch (e) { if (!this._ckFaunaError) { this._ckFaunaError = true; console.warn('[fauna]', e); } }
    return dn0.apply(this, arguments);
  };
  const fin0 = P.endStory;
  if (fin0) P.endStory = function () { limpiar(this._ckFauna); this._ckFauna = null; return fin0.apply(this, arguments); };

  // las luciérnagas alumbran un poquito
  if (window.CK_LUZ && window.CK_LUZ.fuente)
    window.CK_LUZ.fuente((S, out) => {
      const F = S._ckFauna;
      if (!F || !F.lista) return;
      F.lista.forEach(b => { if (b.tipo === 'luciernagas' && b.luz > 0.05) out.push({ x: b.s.x, y: b.s.y, r: 26, c: [190, 255, 110], f: b.luz * 0.85 }); });
    });

  window.CK_FAUNA = {
    FAUNA, ALDEA,
    lista: () => { const S = window.game && window.game.scene.scenes.find(x => x.startCampaign); const F = S && S._ckFauna; return F && F.lista ? F.lista.map(b => b.tipo + ':' + (b.estado || '') + (b.miembros ? '×' + b.miembros.length : '')) : []; }
  };
})();
