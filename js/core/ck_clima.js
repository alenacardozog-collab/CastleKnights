'use strict';
/* Clima: despejado, nublado, lluvia, tormenta, nieve y niebla.
   - Cambia solo cada un par de minutos (con transición suave); las ruinas tiran a niebla y tormenta.
   - Lluvia con gotas y salpicaduras, nieve que cae despacio, niebla que se mueve; todo por debajo del mapa de luz, así que de
     noche la lluvia brilla solo cerca de los faroles y la fogata.
   - Nubes y tormenta oscurecen la escena y prenden las luces aunque sea de día (`ck_luz.js`).
   - Tormenta: relámpagos que iluminan todo y truenos con demora. Sonido de lluvia y viento hecho por código.
   - Adentro no se ve, pero se oye apagado. El clima se muestra en el recuadro del objetivo.
   Probar: ?ck_clima=lluvia|tormenta|nieve|niebla|nublado|despejado (fijo), F8 pasa al siguiente.
   Sacar la línea de index.html lo quita sin tocar nada más. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  // ------------------------------------------------------------------ climas
  // amb = color que multiplica la escena afuera; luces = cuánto se prenden de día; el resto, 0..1
  const C = {
    despejado: { n: 'Despejado', ico: '☀', amb: [255, 255, 255], luces: 0, lluvia: 0, nieve: 0, niebla: 0, viento: 0, rayos: 0 },
    nublado: { n: 'Nublado', ico: '☁', amb: [210, 213, 222], luces: 0.2, lluvia: 0, nieve: 0, niebla: 0.12, viento: 10, rayos: 0 },
    lluvia: { n: 'Lluvia', ico: '☂', amb: [170, 177, 196], luces: 0.45, lluvia: 0.6, nieve: 0, niebla: 0.15, viento: -50, rayos: 0 },
    tormenta: { n: 'Tormenta', ico: '⚡', amb: [118, 125, 152], luces: 0.75, lluvia: 1, nieve: 0, niebla: 0.2, viento: -170, rayos: 1 },
    nieve: { n: 'Nieve', ico: '❄', amb: [222, 228, 244], luces: 0.2, lluvia: 0, nieve: 1, niebla: 0.1, viento: -18, rayos: 0 },
    niebla: { n: 'Niebla', ico: '≋', amb: [196, 198, 208], luces: 0.35, lluvia: 0, nieve: 0, niebla: 1, viento: 6, rayos: 0 }
  };
  const ORDEN = Object.keys(C);
  const CAMPOS = ['luces', 'lluvia', 'nieve', 'niebla', 'viento', 'rayos'];
  // probabilidad de cada clima según la zona (peso)
  const PESOS = {
    normal: { despejado: 44, nublado: 18, lluvia: 16, tormenta: 8, nieve: 7, niebla: 7 },
    ruinas: { despejado: 0, nublado: 15, lluvia: 22, tormenta: 25, nieve: 3, niebla: 35 }
  };
  const DURA = [80000, 170000]; // cuánto dura cada clima (ms)
  const NF = 14, VEL = 560, CAIDA = 200; // franjas de profundidad de la lluvia; velocidad y tiempo de caída de cada gota
  const R0 = () => 3000 + Math.random() * 6000;
  const TRANSICION = 7000; // cuánto tarda en pasar de uno a otro

  const fijo = (/[?&]ck_clima=(\w+)/.exec(location.search) || [])[1];
  const E = {
    tipo: C[fijo] ? fijo : 'despejado',
    act: Object.assign({}, C[C[fijo] ? fijo : 'despejado'], { amb: (C[fijo] || C.despejado).amb.slice() }),
    hasta: 60000, // el primer cambio llega al minuto
    rayoEn: 4000,
    forzado: C[fijo] ? fijo : null
  };

  const elegir = zona => {
    const p = PESOS[/^ruins\./.test(zona) ? 'ruinas' : 'normal'];
    let tot = 0;
    ORDEN.forEach(k => (tot += p[k] || 0));
    let r = Math.random() * tot;
    for (const k of ORDEN) if ((r -= p[k] || 0) <= 0) return k;
    return 'despejado';
  };
  const poner = (S, tipo, aviso) => {
    if (!C[tipo] || tipo === E.tipo) return;
    E.tipo = tipo;
    E.hasta = DURA[0] + Math.random() * (DURA[1] - DURA[0]);
    if (S && S.updateObjective && S.story) S.updateObjective();
    if (aviso && S && S.player && S.createFloatingText && afuera(S)) {
      const t = { despejado: 'El cielo se despeja', nublado: 'Se nubla', lluvia: 'Empieza a llover', tormenta: 'Se larga una tormenta', nieve: 'Empieza a nevar', niebla: 'Baja la niebla' }[tipo];
      S.createFloatingText(S.player.x, S.player.y - 54, t, 0xdbeafe);
    }
  };
  const afuera = S => (window.CK_AFUERA ? window.CK_AFUERA(S) : !S.currentInterior || S.currentInterior.area.outdoor);

  // ------------------------------------------------------------------ texturas (por código)
  const texturas = S => {
    const T = S.textures;
    if (T.exists('ck_niebla') && S.anims.exists('ck_onda_a')) return;
    const mk = (key, w, h, fn) => { if (T.exists(key)) return; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); T.addCanvas(key, cv); };
    mk('ck_gota', 2, 16, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(200,220,255,0)'); gr.addColorStop(1, 'rgba(225,238,255,0.95)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // gota que rompe en el piso: 4 cuadros de 9x7 (impacto, corona, gotitas que saltan, anillo que se borra)
    if (!T.exists('ck_salpica')) {
      const F = [
        ['.........', '.........', '.........', '.........', '....#....', '...#.#...', '....#....'],
        ['.........', '.........', '..#...#..', '.........', '..#...#..', '.#.....#.', '..#####..'],
        ['.#.....#.', '.........', '.........', '.........', '.........', '#.......#', '.#######.'],
        ['.........', '.........', '.........', '.........', '.........', '.#.#.#.#.', '.........']
      ];
      const cv = document.createElement('canvas'); cv.width = 9 * 4; cv.height = 7;
      const g = cv.getContext('2d');
      F.forEach((f, i) => f.forEach((fila, y) => fila.split('').forEach((ch, x) => {
        if (ch !== '#') return;
        g.fillStyle = i === 3 ? 'rgba(210,228,250,0.55)' : 'rgba(222,236,255,0.95)'; g.fillRect(i * 9 + x, y, 1, 1);
      })));
      const t = T.addCanvas('ck_salpica', cv);
      F.forEach((f, i) => t.add('s' + i, 0, i * 9, 0, 9, 7));
    }
    // en el agua: anillos que se abren (4 cuadros de 13x6)
    if (!T.exists('ck_onda')) {
      const cv = document.createElement('canvas'); cv.width = 13 * 4; cv.height = 6;
      const g = cv.getContext('2d');
      [[1.6, 0.8, 0.9], [3.4, 1.4, 0.8], [5, 2, 0.6], [6, 2.5, 0.35]].forEach(([rx, ry, al], i) => {
        g.fillStyle = 'rgba(214,232,255,' + al + ')';
        for (let y = 0; y < 6; y++) for (let x = 0; x < 13; x++) {
          const dx = (x + 0.5 - 6.5) / rx, dy = (y + 0.5 - 3) / ry, d = dx * dx + dy * dy;
          if (Math.abs(d - 1) < 0.45 / Math.max(1, rx / 2)) g.fillRect(i * 13 + x, y, 1, 1);
        }
      });
      const t = T.addCanvas('ck_onda', cv);
      [0, 1, 2, 3].forEach(i => t.add('o' + i, 0, i * 13, 0, 13, 6));
    }
    mk('ck_humo2', 16, 16, g => {
      const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8);
      gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 16, 16);
    });
    if (!S.anims.exists('ck_salpica_a')) S.anims.create({ key: 'ck_salpica_a', frames: [0, 1, 2, 3].map(i => ({ key: 'ck_salpica', frame: 's' + i })), frameRate: 16 });
    if (!S.anims.exists('ck_onda_a')) S.anims.create({ key: 'ck_onda_a', frames: [0, 1, 2, 3].map(i => ({ key: 'ck_onda', frame: 'o' + i })), frameRate: 9 });
    mk('ck_copo', 5, 5, g => {
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 1, 5, 3); g.fillRect(1, 0, 3, 5);
      g.fillStyle = '#ffffff'; g.fillRect(1, 1, 3, 3);
    });
    mk('ck_niebla', 256, 256, (g, w, h) => {
      // ruido suave que se repite sin cortes (varias octavas de valores al azar interpolados)
      const im = g.createImageData(w, h), cap = [], N = [8, 16, 32];
      N.forEach(n => { const a = []; for (let i = 0; i < n * n; i++) a.push(Math.random()); cap.push({ n, a }); });
      const lisa = t => t * t * (3 - 2 * t);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          let v = 0, peso = 0;
          cap.forEach(({ n, a }, o) => {
            const fx = (x / w) * n, fy = (y / h) * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = lisa(fx - x0), ty = lisa(fy - y0);
            const q = (i, j) => a[((j % n) * n) + (i % n)];
            const top = q(x0, y0) + (q(x0 + 1, y0) - q(x0, y0)) * tx, bot = q(x0, y0 + 1) + (q(x0 + 1, y0 + 1) - q(x0, y0 + 1)) * tx;
            const pw = 1 / (o + 1); v += (top + (bot - top) * ty) * pw; peso += pw;
          });
          v /= peso;
          const o = (y * w + x) * 4;
          im.data[o] = 226; im.data[o + 1] = 230; im.data[o + 2] = 238;
          im.data[o + 3] = Math.round(Math.max(0, Math.min(1, (v - 0.35) * 1.9)) * 200);
        }
      g.putImageData(im, 0, 0);
    });
  };

  // ------------------------------------------------------------------ piezas en la escena
  const armar = S => {
    if (S._ckClima && S._ckClima.franjas[0].g.active) return S._ckClima;
    texturas(S);
    const zona = new Phaser.Geom.Rectangle(0, 0, 960, 600);
    const D = { viento: 0 };
    // la lluvia va en franjas de profundidad: cada gota cae hasta un punto del piso y se dibuja con la profundidad de ese
    // punto (una casa tapa las gotas que caen detrás); las que caen en un techo van encima de todo
    const franja = prof => {
      const g = S.add.particles(0, 0, 'ck_gota', {
        lifespan: CAIDA, speedY: VEL, speedX: { onEmit: () => D.viento },
        rotate: { onEmit: () => -Math.atan2(D.viento, VEL) * 180 / Math.PI },
        scaleY: { min: 0.7, max: 1.15 }, alpha: { min: 0.5, max: 0.85 }, emitting: false
      }).setDepth(prof);
      const sp = S.add.particles(0, 0, 'ck_salpica', { anim: 'ck_salpica_a', lifespan: 250, scale: { min: 0.7, max: 1.1 }, alpha: { min: 0.3, max: 0.6 }, emitting: false }).setDepth(prof);
      const on = S.add.particles(0, 0, 'ck_onda', { anim: 'ck_onda_a', lifespan: 440, scale: { min: 0.8, max: 1.2 }, alpha: { min: 0.3, max: 0.6 }, emitting: false }).setDepth(prof);
      const f = { g, sp, on };
      g.onParticleDeath(pt => impacto(S, f, pt.x, pt.y));
      return f;
    };
    const franjas = [];
    for (let i = 0; i < NF; i++) franjas.push(franja(1));
    const techo = franja(27400);
    // chorritos que caen del borde de los techos
    const chorro = S.add.particles(0, 0, 'ck_gota', { lifespan: 150, speedY: 150, scale: { min: 0.5, max: 0.7 }, alpha: 0.8, emitting: false }).setDepth(27396);
    chorro.onParticleDeath(pt => { if (Math.random() < 0.7) techo.sp.emitParticleAt(pt.x, pt.y, 1); });
    const nieve = S.add.particles(0, 0, 'ck_copo', {
      emitZone: { type: 'random', source: zona },
      lifespan: { min: 4500, max: 7500 },
      speedY: { min: 22, max: 52 },
      speedX: { onEmit: () => D.viento + (Math.random() * 2 - 1) * 16 },
      scale: { min: 0.6, max: 1.3 },
      alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(Math.PI * t) * 0.9 },
      frequency: 40, quantity: 1, emitting: false
    }).setDepth(27400);
    const niebla1 = S.add.tileSprite(0, 0, 960, 600, 'ck_niebla').setOrigin(0, 0).setDepth(27450).setAlpha(0).setTileScale(3, 3);
    const niebla2 = S.add.tileSprite(0, 0, 960, 600, 'ck_niebla').setOrigin(0, 0).setDepth(27451).setAlpha(0).setTileScale(2, 2);
    [niebla1, niebla2].forEach(t => { if (t.texture && t.texture.setFilter) t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); });
    return (S._ckClima = { franjas, techo, chorro, nieve, niebla1, niebla2, zona, D, deriva: 0, nGotas: 0, v0: 0, bh: 60, aleros: {}, goteras: null, rayoSuelo: R0(), onda: techo.on, salpica: techo.sp });
  };

  // ------------------------------------------------------------------ sonido de lluvia y viento (ruido filtrado)
  const S0 = { ok: false };
  const sonido = (lluvia, viento, adentro) => {
    if (typeof sfx === 'undefined' || !sfx.ctx) return;
    const ctx = sfx.ctx;
    if (!S0.ok) {
      try {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
        let b = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 2.2; }
        const fuente = () => { const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; n.start(0, Math.random() * 2); return n; };
        // lluvia: siseo
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
        const gl = ctx.createGain(); gl.gain.value = 0;
        fuente().connect(hp); hp.connect(lp); lp.connect(gl); gl.connect(ctx.destination);
        // viento: rumor grave que sube y baja
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 0.7;
        const gv = ctx.createGain(); gv.gain.value = 0;
        fuente().connect(bp); bp.connect(gv); gv.connect(ctx.destination);
        Object.assign(S0, { ok: true, lp, gl, gv, bp });
      } catch (e) { S0.ok = 'no'; return; }
    }
    if (S0.ok !== true) return;
    const vol = (typeof ambience !== 'undefined' ? ambience.master : 1) * (sfx.enabled === false ? 0 : 1);
    const t = ctx.currentTime;
    S0.gl.gain.setTargetAtTime(lluvia * 0.16 * vol * (adentro ? 0.45 : 1), t, 0.4);
    S0.lp.frequency.setTargetAtTime(adentro ? 700 : 2600, t, 0.3);
    S0.gv.gain.setTargetAtTime(viento * 0.1 * vol * (adentro ? 0.3 : 1) * (0.7 + 0.3 * Math.sin(t / 3.1)), t, 0.6);
    S0.bp.frequency.setTargetAtTime(260 + 120 * Math.sin(t / 4.3), t, 0.8);
  };

  // ------------------------------------------------------------------ fuegos que se apagan con la lluvia
  // fogatas, braseros y antorchas de afuera: con lluvia fuerte se apagan (cada uno a su tiempo), echan humo y dejan
  // de dar luz; cuando para, se vuelven a prender. Adentro no pasa nada.
  const FUEGO = /fogata|campfire|cs_flame|flame|llama|hoguera/;
  const NO_FUEGO = /fireball|fire_hit|fire_cast|bolt|proj|brillo|glow|apagado|humo/;
  const BRILLO = /glow|brillo|resplandor|halo/;
  const fuegos = []; // {o, zona, f, meta, demora, apagado, carbon, brillos, extra, cx, cy, r}
  let buscarEn = 0;
  const claveFuego = o => (o.texture ? o.texture.key : '') + ' ' + (o.anims && o.anims.currentAnim ? o.anims.currentAnim.key : '');
  const registrar = (S, zona) => {
    const lista = S.children.list, c = S.currentInterior, a = c && c.area;
    // solo lo que está dentro de la zona que se ve (la aldea queda armada aunque estés en otro mapa)
    const dentro = o => (a ? o.x >= a.x && o.x <= a.x + a.w && o.y >= a.y && o.y <= a.y + a.h + 40 : o.x < 4000 && o.y < 4000);
    lista.forEach(o => {
      if (!o || !o.active || o._ckFuego || !o.visible || !o.texture || o.blendMode !== 0 || !dentro(o)) return;
      const k = claveFuego(o);
      if (!FUEGO.test(k) || NO_FUEGO.test(k) || (S.projectiles && S.projectiles.contains && S.projectiles.contains(o))) return;
      const b = o.getBounds(), cx = b.centerX, cy = b.centerY;
      const st = { o, zona, f: 1, meta: 1, demora: 0, apagado: false, carbon: undefined, cx, cy, top: b.top, r: Math.max(40, Math.max(b.width, b.height) * 1.6), brillos: [], extra: [] };
      // brillos aditivos pegados a este fuego (los del castillo, las ruinas)
      lista.forEach(g => {
        if (g && g.blendMode === 1 && g.texture && BRILLO.test(g.texture.key) && !/^ck_aldea_/.test(g.texture.key) && Math.hypot(g.x - cx, g.y - cy) < 46) st.brillos.push(g);
      });
      // la fogata de la aldea: su resplandor y su luz de noche
      const al = S._ckAldea;
      if (o.texture.key === 'ck_aldea_fogata' && al) st.extra = [al.resplandor, al.fogNoche].filter(Boolean);
      // y las luces del editor puestas sobre este fuego (su brillo dibujado también se apaga)
      const ED = window.CK_EDITOR;
      if (ED && ED.lucesVivas) ED.lucesVivas.forEach(v => { if (v.im && Math.hypot(v.im.x - cx, v.im.y - cy) < st.r) st.extra.push(v.im); });
      o._ckFuego = st;
      fuegos.push(st);
    });
  };
  /** Cuánto alumbra una luz en (x, y) según los fuegos apagados cerca (lo usa ck_luz.js). */
  const atenuar = (x, y) => {
    let m = 1;
    for (const st of fuegos) if (st.f < 1 && Math.abs(st.cx - x) < st.r && Math.abs(st.cy - y) < st.r && Math.hypot(st.cx - x, st.cy - y) < st.r) m = Math.min(m, st.f);
    return m;
  };
  /** Dibujo del fuego apagado, por código: lo que es llama arriba se borra, la llama de abajo queda como carbón con alguna brasa. */
  const carbon = (S, o) => {
    const fr = o.frame, key = 'ck_apagado_' + o.texture.key + '_' + fr.name;
    if (S.textures.exists(key)) return key;
    try {
      const w = fr.cutWidth, h = fr.cutHeight, cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      g.drawImage(fr.source.image, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const im = g.getImageData(0, 0, w, h), d = im.data;
      let y0 = h, y1 = 0, antes = 0, despues = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); antes++; }
      const corte = y0 + (y1 - y0) * 0.55;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const o4 = (y * w + x) * 4, r = d[o4], gg = d[o4 + 1], b = d[o4 + 2];
          if (d[o4 + 3] <= 40) continue;
          const llama = (r > 165 && r - b > 85 && gg > 50) || (r > 225 && gg > 190 && b < 170);
          if (llama) {
            if (y < corte) d[o4 + 3] = 0;
            else if (Math.random() < 0.06) { d[o4] = 150; d[o4 + 1] = 52; d[o4 + 2] = 30; }
            else { const n = Math.random() * 12; d[o4] = 52 + n; d[o4 + 1] = 46 + n; d[o4 + 2] = 44 + n; }
          }
          if (d[o4 + 3] > 40) despues++;
        }
      // si casi no queda nada era solo la llama (antorchas, braseros): se apaga y listo
      if (despues < antes * 0.18) { S.textures.addCanvas(key, document.createElement('canvas')); S.textures.get(key)._ckVacio = true; return key; }
      g.putImageData(im, 0, 0);
      S.textures.addCanvas(key, cv);
      return key;
    } catch (e) {
      return null; // imagen de archivo (file://) que no deja leer sus píxeles: se apaga sin dibujo de carbón
    }
  };
  const humo = (S, st, mucho) => {
    const em = S.add.particles(st.cx, st.top + 6, 'ck_humo2', {
      x: { min: -4, max: 4 }, speedY: { min: -30, max: -14 }, speedX: { min: -5, max: 5 },
      accelerationX: { onEmit: () => E.act.viento * 0.08 },
      lifespan: { min: 1400, max: 2600 }, scale: { start: 0.35, end: 1.5 }, alpha: { start: mucho ? 0.5 : 0.3, end: 0 },
      tint: [0x8c8c92, 0x6e6e74, 0xa0a0a6], frequency: mucho ? 70 : 160, quantity: 1
    }).setDepth(st.o.depth + 1);
    S.time.delayedCall(mucho ? 3800 : 1500, () => em.active && (em.emitting = false));
    S.time.delayedCall(mucho ? 7000 : 4500, () => em.active && em.destroy());
  };
  const fuegosPaso = (S, dt, zona, lluviaAfuera) => {
    buscarEn -= dt;
    if (buscarEn <= 0) {
      buscarEn = 1000;
      for (let i = fuegos.length - 1; i >= 0; i--) if (!fuegos[i].o.active) { const c = fuegos[i].carbon; if (c && c.destroy) c.destroy(); fuegos.splice(i, 1); }
      registrar(S, zona);
    }
    const apagar = lluviaAfuera > 0.35, prender = lluviaAfuera < 0.12;
    fuegos.forEach(st => {
      // solo los fuegos de afuera, y solo cuando su zona es la que se ve
      const aca = st.zona === zona;
      if (aca && apagar && st.meta === 1) { st.meta = 0; st.demora = 500 + Math.random() * 4000; }
      if (aca && prender && st.meta === 0) { st.meta = 1; st.demora = 1500 + Math.random() * 5000; }
      if (!aca && st.meta === 0 && !E.act.lluvia) { st.meta = 1; st.f = 1; st.demora = 0; }
      if (st.demora > 0) { st.demora -= dt; return; }
      st.f += Math.sign(st.meta - st.f) * Math.min(Math.abs(st.meta - st.f), dt / 1600);
      const o = st.o;
      if (!st.apagado && st.f < 0.3) {
        st.apagado = true;
        if (o.anims) o.anims.pause();
        if (st.carbon === undefined) {
          const k = carbon(S, o);
          st.carbon = k && !S.textures.get(k)._ckVacio
            ? S.add.image(o.x, o.y, k).setOrigin(o.originX, o.originY).setScale(o.scaleX, o.scaleY).setFlip(o.flipX, o.flipY).setDepth(o.depth)
            : null;
          if (!k) st.tinte = true; // sin dibujo: se oscurece el mismo sprite
        }
        if (aca) humo(S, st, true);
      } else if (st.apagado && st.f > 0.3) {
        st.apagado = false;
        if (o.anims) o.anims.resume();
        if (st.tinte) o.clearTint();
        if (aca) humo(S, st, false);
      }
    });
  };
  // cada cuadro, después de que todos pusieron sus valores: esconder llamas apagadas y bajar sus brillos
  const alfa = (g, m) => {
    if (!g || !g.active) return;
    if (g._ckA === undefined || Math.abs(g.alpha - g._ckAPuesta) > 1e-4) g._ckA = g.alpha; // alguien la cambió: nueva base
    g.alpha = g._ckA * m;
    g._ckAPuesta = g.alpha;
  };
  const despues = S => {
    const zona = S.currentZoneKey ? S.currentZoneKey() : 'village';
    fuegos.forEach(st => {
      const o = st.o, aca = st.zona === zona;
      if (!o.active) return;
      if (st.apagado) {
        if (st.tinte) { o.setTint(0x3c3634); }
        else if (o.visible) o.setVisible(false), (st.ocultoPorMi = true);
      } else if (st.ocultoPorMi && aca) { o.setVisible(true); st.ocultoPorMi = false; }
      if (st.carbon) st.carbon.setVisible(st.apagado && aca);
      if (st.f < 1 || st.brillos.some(g => g._ckA !== undefined)) {
        const m = Math.max(0, st.f);
        if (!st.apagado && !st.tinte) alfa(o, 0.35 + 0.65 * m);
        st.brillos.forEach(g => alfa(g, m));
        st.extra.forEach(g => alfa(g, m));
      }
    });
  };

  // ------------------------------------------------------------------ lluvia que pega en las cosas
  const ter = (zona, x, y) => (window.CK_MINIMAPA && window.CK_MINIMAPA.terreno ? window.CK_MINIMAPA.terreno(zona, x, y) : null);
  const helado = () => (window.CK_NIEVE && window.CK_NIEVE.hielo ? window.CK_NIEVE.hielo() : 0) > 0.5;
  const A0 = S => { const c = S.currentInterior; return c ? { w: c.area.w, h: c.area.h } : { w: 640, h: 640 }; };
  /** Dónde rompe la gota: anillo en el agua, corona en el piso y en los techos (solo algunas, para que no se vea cargado). */
  const impacto = (S, f, x, y) => {
    const K = S._ckClima;
    if (!K || Math.random() > 0.3) return;
    const t = ter(K.zonaAct, x - K.ox, y - K.oy);
    if (t === 'bosque' || t === 'muro' || t === 'borde') return;
    if (t === 'agua' && !helado()) f.on.emitParticleAt(Math.round(x), Math.round(y), 1);
    else f.sp.emitParticleAt(Math.round(x), Math.round(y), 1);
  };
  /** Bordes de abajo de los techos de la zona (por donde chorrea el agua), sacados del dibujo del minimapa. */
  const aleros = (K, zona, A) => {
    if (K.aleros[zona]) return K.aleros[zona];
    const out = [];
    for (let y = 8; y < A.h - 8; y += 4)
      for (let x = 4; x < A.w - 4; x += 6)
        if (ter(zona, x, y) === 'techo' && ter(zona, x, y + 5) !== 'techo' && !out.some(([a, b]) => Math.abs(a - x) < 14 && Math.abs(b - y) < 10)) out.push([x, y + 2]);
    Phaser.Utils.Array.Shuffle(out);
    return (K.aleros[zona] = out.slice(0, 40));
  };
  /** Goteras: adentro, mientras llueve afuera, 2 o 3 lugares donde gotea del techo y se junta un charquito. */
  const goteras = (S, K, zona, activa, dt) => {
    let G = K.goteras;
    if (G && G.zona !== zona) { G.puntos.forEach(p => { p.ch.destroy(); }); G = K.goteras = null; }
    if (!G) {
      if (!activa || !S.currentInterior) return;
      const a = S.currentInterior.area, pts = [];
      for (let i = 0; i < 80 && pts.length < 3; i++) {
        const x = 30 + Math.random() * (a.w - 60), y = 70 + Math.random() * (a.h - 100), t = ter(zona, x, y);
        if (t && t !== 'muro' && t !== 'borde' && t !== 'agua' && !pts.some(p => Math.hypot(p.ax - x, p.ay - y) < 70)) pts.push({ ax: x, ay: y });
      }
      if (!S.textures.exists('ck_charquito')) {
        const cv = document.createElement('canvas'); cv.width = 16; cv.height = 7;
        const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(8, 3.5, 7.5, 3.2, 0, 0, Math.PI * 2); g.fill();
        S.textures.addCanvas('ck_charquito', cv);
      }
      pts.forEach(p => { p.x = a.x + p.ax; p.y = a.y + p.ay; p.t = 400 + Math.random() * 1500; p.ch = S.add.image(p.x, p.y + 1, 'ck_charquito').setTint(0x30405a).setAlpha(0).setDepth(p.y - 30); p.m = 0; });
      G = K.goteras = { zona, puntos: pts };
    }
    G.puntos.forEach(p => {
      p.m = Math.max(0, Math.min(1, p.m + (activa ? dt / 40000 : -dt / 30000)));
      p.ch.setAlpha(0.38 * p.m).setScale(0.6 + p.m * 0.7);
      if (!activa) return;
      p.t -= dt;
      if (p.t > 0) return;
      p.t = 900 + Math.random() * 2200;
      const gota = S.add.image(p.x, p.y - 46, 'ck_gota').setScale(0.6, 0.7).setAlpha(0.9).setDepth(p.y + 1);
      S.tweens.add({ targets: gota, y: p.y, duration: 300, ease: 'Quad.easeIn', onComplete: () => {
        gota.destroy();
        K.techo.sp.emitParticleAt(Math.round(p.x), Math.round(p.y), 1);
        if (window.CK_SINTE && window.CK_SINTE.gota) window.CK_SINTE.gota(S, p.x, p.y);
      } });
    });
  };
  /** Rayo que cae en un lugar por donde se camina: aviso, descarga, luz, chispas y una marca quemada que se borra. */
  const rayoAlSuelo = (S, zona, v, ox, oy) => {
    const b = S.player && S.player.body;
    let pt = null;
    for (let i = 0; i < 40 && !pt; i++) {
      const x = v.x + 30 + Math.random() * (v.width - 60), y = v.y + 40 + Math.random() * (v.height - 60), t = ter(zona, x - ox, y - oy);
      if ((t === 'pasto' || t === 'camino' || t === 'piedra') && (!b || Math.hypot(b.center.x - x, b.bottom - y) > 60)) pt = [x, y];
    }
    if (!pt) return;
    const [x, y] = pt, T = S.textures;
    if (!T.exists('ck_quemado')) {
      const cv = document.createElement('canvas'); cv.width = 28; cv.height = 12;
      const g = cv.getContext('2d'); g.save(); g.scale(1, 12 / 28);
      const gr = g.createRadialGradient(14, 14, 0, 14, 14, 14); gr.addColorStop(0, 'rgba(20,14,10,0.95)'); gr.addColorStop(0.6, 'rgba(30,22,16,0.6)'); gr.addColorStop(1, 'rgba(30,22,16,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 28, 28); g.restore(); T.addCanvas('ck_quemado', cv);
    }
    // aviso: el piso se carga de luz medio segundo antes
    const aviso = S.add.image(x, y, 'ck_humo2').setTint(0xbfdcff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(0.6, 0.3).setDepth(27515);
    S.tweens.add({ targets: aviso, alpha: 0.9, scaleX: 2.2, scaleY: 1, duration: 520, onComplete: () => {
      aviso.destroy();
      // la descarga, quebrada, del cielo al piso (y alguna rama)
      const g = S.add.graphics().setDepth(27520), top = v.y - 20;
      const linea = (x0, y0, x1, y1, ancho, col, al) => {
        g.lineStyle(ancho, col, al); g.beginPath(); g.moveTo(x0, y0);
        const n = Math.max(4, Math.round((y1 - y0) / 14));
        for (let i = 1; i < n; i++) g.lineTo(Math.round(x0 + (x1 - x0) * i / n + (Math.random() * 2 - 1) * 9), Math.round(y0 + (y1 - y0) * i / n));
        g.lineTo(x1, y1); g.strokePath();
      };
      const dibujar = () => {
        g.clear();
        const sx = x + (Math.random() * 2 - 1) * 40;
        linea(sx, top, x, y, 7, 0x6fb6ff, 0.35); linea(sx, top, x, y, 3, 0xbfe2ff, 0.9); linea(sx, top, x, y, 1, 0xffffff, 1);
        const by = top + (y - top) * (0.4 + Math.random() * 0.3);
        linea(sx + (x - sx) * 0.5, by, sx + (x - sx) * 0.5 + (Math.random() < 0.5 ? -1 : 1) * 30, by + 40, 1, 0xd8ecff, 0.8);
      };
      dibujar();
      S.time.delayedCall(70, dibujar);
      S.tweens.add({ targets: g, alpha: 0, delay: 140, duration: 160, onComplete: () => g.destroy() });
      if (window.CK_LUZ) { window.CK_LUZ.agregar({ x, y: y - 6, c: [200, 222, 255], r: 190, f: 1, ms: 700, curva: 'rayo' }); window.CK_LUZ.destello([220, 230, 255], 0.6, 220); }
      S.cameras.main.shake(140, 0.004);
      // marca quemada en el piso
      const q = S.add.image(x, y, 'ck_quemado').setDepth(y - 40).setAlpha(0.75).setScale(1.3);
      S.tweens.add({ targets: q, alpha: 0, delay: 4000, duration: 8000, onComplete: () => q.destroy() });
      // chispas
      const ch = S.add.particles(x, y - 2, 'ck_copo', { speed: { min: 40, max: 120 }, angle: { min: 200, max: 340 }, gravityY: 300, lifespan: { min: 200, max: 450 }, scale: { start: 0.8, end: 0 }, tint: [0xffffff, 0xbfe2ff, 0xfff2a8], blendMode: 'ADD', emitting: false }).setDepth(27521);
      ch.explode(14); S.time.delayedCall(600, () => ch.destroy());
      // el trueno, fuerte porque fue cerca; a las bestias de al lado les duele
      if (typeof sfx !== 'undefined') sfx.fx('thunder_strike', 0.55, { rate: 0.85 + Math.random() * 0.2 }) || sfx.fx('thunder_epic', 0.5);
      if (S.enemies && S.damageEnemy) S.enemies.getChildren().forEach(e => { if (e.active && !e.isDead && Math.hypot(e.x - x, e.y - y) < 32) S.damageEnemy(e, 2, x, y); });
    } });
  };

  // ------------------------------------------------------------------ cada cuadro
  const paso = (S, dt) => {
    const zona = S.currentZoneKey ? S.currentZoneKey() : 'village';
    // ¿toca cambiar?
    if (!E.forzado) {
      // historia: la capilla de las ruinas siempre con tormenta mientras está el Nigromante
      const st = S.story;
      if (st && st.step === 6 && /^ruins\./.test(zona)) poner(S, 'tormenta', true);
      else {
        E.hasta -= dt;
        if (E.hasta <= 0) {
          let nuevo = elegir(zona);
          if (nuevo === E.tipo) nuevo = elegir(zona);
          poner(S, nuevo, true);
          E.hasta = DURA[0] + Math.random() * (DURA[1] - DURA[0]);
        }
        // las ruinas nunca están del todo claras
        if (/^ruins\./.test(zona) && (E.tipo === 'despejado' || E.tipo === 'nublado')) poner(S, 'niebla', false);
      }
    }
    // transición suave hacia el clima elegido
    const meta = C[E.tipo], q = Math.min(1, dt / TRANSICION * 3);
    CAMPOS.forEach(k => (E.act[k] += (meta[k] - E.act[k]) * q));
    E.act.amb = E.act.amb.map((a, i) => a + (meta.amb[i] - a) * q);

    const fuera = afuera(S);
    const K = armar(S), v = S.cameras.main.worldView, a = E.act;
    if (!K.post) { K.post = true; S.events.on('postupdate', () => { try { despues(S); } catch (e) {} }); }
    fuegosPaso(S, dt, zona, fuera ? a.lluvia : 0);
    K.D.viento = a.viento;
    // dónde nace la nieve: toda la vista, con margen arriba y del lado del viento
    K.zona.setTo(v.x - 80 - Math.max(0, a.viento) * 0.3, v.y - 100, v.width + 160 + Math.abs(a.viento) * 0.4, v.height + 40);
    const ll = fuera ? a.lluvia : 0, ni = fuera ? a.nieve : 0, ne = fuera ? a.niebla : 0;
    // franjas de profundidad de la vista (cada una cubre bh píxeles de alto)
    K.v0 = v.y; K.bh = (v.height + 40) / NF;
    K.franjas.forEach((f, i) => { const d = v.y + (i + 1) * K.bh; f.g.setDepth(d); f.sp.setDepth(d); f.on.setDepth(d); });
    const c = S.currentInterior, ox = c ? c.area.x : 0, oy = c ? c.area.y : 0;
    K.ox = ox; K.oy = oy; K.zonaAct = zona;
    if (ll > 0.03) {
      // cada gota elige dónde pega: piso, techo, agua o copa de árbol (la copa ataja la mitad)
      K.nGotas += ll * dt * 1.3;
      while (K.nGotas >= 1) {
        K.nGotas--;
        const x = v.x - 20 + Math.random() * (v.width + 40), y = v.y + Math.random() * (v.height + 30);
        const t = ter(zona, x - ox, y - oy);
        if (t === 'bosque' && Math.random() < 0.55) continue;
        const f = t === 'techo' ? K.techo : K.franjas[Math.max(0, Math.min(NF - 1, Math.floor((y - K.v0) / K.bh)))];
        f.g.emitParticleAt(x - a.viento * CAIDA / 1000, y - VEL * CAIDA / 1000, 1);
      }
      // chorritos del borde de los techos
      const al = aleros(K, zona, A0(S));
      al.forEach(([ax, ay]) => {
        const x = ax + ox, y = ay + oy;
        if (x > v.x && x < v.right && y > v.y && y < v.bottom && Math.random() < ll * dt / 260) K.chorro.emitParticleAt(x + Math.random() * 2, y, 1);
      });
    } else K.nGotas = 0;
    // adentro: alguna gotera si llueve afuera
    goteras(S, K, zona, !fuera && a.lluvia > 0.3, dt);
    // tormenta: rayos que caen en lugares por donde se camina
    if (fuera && a.rayos > 0.5) {
      K.rayoSuelo -= dt;
      if (K.rayoSuelo <= 0) { K.rayoSuelo = 4000 + Math.random() * 7000; rayoAlSuelo(S, zona, v, ox, oy); }
    }
    if (ni > 0.03) { K.nieve.emitting = true; K.nieve.frequency = Math.max(5, 40 - ni * 35); } else K.nieve.emitting = false;
    if (!fuera) { K.franjas.concat([K.techo]).forEach(f => { f.g.killAll(); f.sp.killAll(); f.on.killAll(); }); K.chorro.killAll(); K.nieve.killAll(); }
    // niebla: pegada al mundo y corriéndose despacio con el viento
    K.deriva += dt * (0.006 + Math.abs(a.viento) * 0.00005);
    [[K.niebla1, 3, 1, 0.7], [K.niebla2, 2, 1.6, 0.5]].forEach(([t, esc, vel, al]) => {
      const M = 40, w = Math.ceil(v.width + M * 2), h = Math.ceil(v.height + M * 2);
      if (t.width !== w || t.height !== h) t.setSize(w, h);
      t.setPosition(v.x - M, v.y - M);
      t.tilePositionX = (v.x - M + K.deriva * vel) / esc;
      t.tilePositionY = (v.y - M + K.deriva * vel * 0.25) / esc;
      t.setAlpha(ne * al);
      t.setVisible(ne > 0.01);
    });
    // relámpagos
    if (a.rayos > 0.5) {
      E.rayoEn -= dt;
      if (E.rayoEn <= 0) {
        E.rayoEn = 5000 + Math.random() * 9000;
        if (fuera && window.CK_LUZ && window.CK_LUZ.destello) {
          window.CK_LUZ.destello([215, 225, 255], 0.9, 260);
          S.time.delayedCall(130 + Math.random() * 120, () => window.CK_LUZ.destello([215, 225, 255], 0.55, 320));
        }
        S.time.delayedCall(400 + Math.random() * 1400, () => {
          if (typeof sfx === 'undefined') return;
          const vol = fuera ? 0.45 : 0.22;
          sfx.fx('thunder_epic', vol, { rate: 0.55 + Math.random() * 0.15 }) || sfx.fx('thunder_strike', vol, { rate: 0.6 });
        });
      }
    }
    sonido(Math.max(a.lluvia, a.rayos * 0.6), Math.min(1, Math.abs(a.viento) / 170) * (a.lluvia > 0.1 || a.nieve > 0.1 ? 1 : 0.4), !fuera);
  };

  // ------------------------------------------------------------------ enganches
  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    try { if (this._gameMode === 'campaign' && !this.isGamePaused) paso(this, Math.min(100, dt || 16)); }
    catch (e) { if (!this._ckClimaError) { this._ckClimaError = true; console.warn('[clima]', e); } }
    return dn0.apply(this, arguments);
  };
  const fin0 = P.endStory;
  if (fin0) P.endStory = function () {
    const K = this._ckClima;
    if (K) { K.nieve.emitting = false; K.niebla1.setVisible(false); K.niebla2.setVisible(false); }
    sonido(0, 0, false);
    return fin0.apply(this, arguments);
  };
  // el clima en el recuadro del objetivo
  const obj0 = P.updateObjective;
  if (obj0) P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    const box = document.getElementById('ck-objective'), b = box && box.querySelector('.ck-obj-purse');
    if (b && this.story) {
      let el = b.querySelector('.ck-clima');
      if (!el) { el = document.createElement('span'); el.className = 'ck-clima'; b.appendChild(el); }
      el.textContent = C[E.tipo].ico + ' ' + C[E.tipo].n;
    }
    return r;
  };
  window.addEventListener('keydown', e => {
    if (e.code !== 'F8' || e.repeat) return;
    const S = window.game && window.game.scene.scenes.find(x => x.startCampaign);
    if (!S || S._gameMode !== 'campaign') return;
    e.preventDefault();
    E.forzado = ORDEN[(ORDEN.indexOf(E.tipo) + 1) % ORDEN.length];
    poner(S, E.forzado, true);
  });

  window.CK_CLIMA = {
    C,
    /** Lo que usa el motor de luz: color que multiplica afuera y cuánto se prenden las luces. */
    efecto: () => ({ amb: E.act.amb, luces: E.act.luces }),
    actual: () => E.tipo,
    /** Fija un clima (o null para volver al azar). */
    poner: (tipo, inmediato) => {
      const S = window.game && window.game.scene.scenes.find(x => x.startCampaign);
      E.forzado = C[tipo] ? tipo : null;
      if (C[tipo]) { poner(S, tipo, false); if (inmediato) { Object.assign(E.act, C[tipo]); E.act.amb = C[tipo].amb.slice(); } }
    },
    estado: E,
    atenuar,
    fuegos: () => fuegos.map(st => ({ k: st.o.texture.key, zona: st.zona, f: +st.f.toFixed(2), apagado: st.apagado, carbon: !!st.carbon }))
  };
})();
