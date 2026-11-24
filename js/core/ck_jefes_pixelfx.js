'use strict';
/* Habilidades nuevas de los jefes con efectos de pixelfx (20/11, pedido del dueño: "crea para los jefes habilidades con
   esto, y pónselas, ten criterio para cada personaje que la requiera").
   Se las dimos a los jefes que tenían uno o dos golpes especiales; los que ya tienen muchos (Garra Negra, Grushak, Gorvak,
   Kragmor, Ulrak y Colmillo, Gromm y Morvane) quedan como estaban. Cada una avisa antes con la marca roja de siempre
   (ck_jefes_fx.js: el aro que se llena o la franja), el jefe se planta mientras la hace, y se esquiva con el paso
   rápido o saliendo de la marca:
   - EL NIGROMANTE · MANOS DE LA TUMBA: marca el piso donde estás; 0,9 s después salen manos de sombra. 1 corazón y
     quedás lento 2 s. Cada 9 s.
   - EL GRAN ESQUELETO · ESPINAS DE HUESO: desde lejos, clava el arma y una fila de espinas de hueso sale del piso
     hacia vos (franja roja 0,65 s). 1 corazón. Cada 9 s.
   - MALAKAR, EL BRUJO DEL SELLO · RAYOS DEL SELLO: tres círculos que te siguen, cada uno cae como un rayo 0,8 s después
     de marcarse. 1 corazón cada uno. Cada 8,5 s.
   - AZRATH, EL REY DEMONIO · ESTALLIDO OSCURO (desde la mitad de su vida): junta oscuridad 1,3 s con un aro grande
     alrededor y estalla. 2 corazones si no saliste. Cada 10 s.
   - ORBATH, EL OJO DEL PORTAL · LLUVIA DE ESTRELLAS: marca un círculo donde estás y caen estrellas. 1 corazón. Cada 9 s.
   - FAUCES, EL SABUESO MAYOR · ALIENTO DE FUEGO: de cerca, se agacha (franja roja hacia vos) y escupe fuego. 1 corazón.
     Cada 8 s.
   - SERAVEL, LA SEGADORA · SIEGA: de cerca, levanta la guadaña (marca adelante) y siega. 2 corazones. Cada 7 s.
   - TAURAX, EL MINOTAURO DE BRASA · PISOTÓN DE BRASA: junta fuego 0,9 s (aro alrededor) y pisa: onda de brasa.
     2 corazones si no saliste. Cada 9 s.
   Usa el planificador de ck_jefes_especiales.js (CK_ESPECIALES: los tiempos entre especiales, el enojo, lo que se cortó)
   y las hojas pfx_ de ck_pixelfx_arte.js. Sin esos archivos no hace nada. Borrar su línea de index.html lo saca.
   (21/11) Todos los números de cada habilidad están en DEF (aviso, radio, daño, cada cuánto, efecto, tamaño, de dónde
   sale, capas extra). El editor de habilidades (ck_editor_habilidades.js) los cambia en vivo con CK_JEFES_PIXELFX.poner().
   (21/11, tarde) "lado": 'delante' o 'detras' del personaje (el héroe en las que caen donde estás, el jefe en las que salen de
   él); sin "lado", la profundidad de siempre. Las capas extra también lo tienen. "corte" (ms) apaga antes el efecto principal
   y "dura" las capas extra (la línea de tiempo del editor).
   v6 (21/11, notas del dueño en el editor, ver PEDIDOS_HABILIDADES.md):
   - MANOS (Nigromante): canaliza 1,3 s con el bastón en alto (su animación de invocar, sin el proyectil verde dibujado en su
     hoja), partículas verdes que llegan a él y un contorno verde; la marca del piso verde; las manos verdes salen por
     detrás del héroe; si te agarran: raíces que te atrapan 1,2 s, veneno (1 corazón más a los 2 s) y lento 3 s.
   - ESPINAS (Gran Esqueleto): 1,1 s de anticipación (se planta con el arma en alto) y si te alcanzan te empujan.
   - RAYOS (Malakar): con sus propias hojas: levanta el báculo encendido (attack2) mientras marca y lo apunta (attack1, el
     del destello) en cada rayo.
   - ESTALLIDO (Azrath): de fuego (hoja horneada de nuevo con colores cálidos); la anticipación sin el círculo rojo: runas de
     fuego en el piso, calor que sube y brasas que se juntan en él; al estallar, grietas y escombros (sin la onda del piso).
   - OJOS (Orbath, reemplaza la lluvia de estrellas): se carga 1 s y suelta tres ojos que te persiguen; se rompen de un
     golpe; si te tocan, 1 corazón. Viven 7 s.
   - ALIENTO (Fauces): 1 s abriendo la boca (sin el zarpazo de su hoja), la marca es un cono de calor con brasas (no la
     franja), y escupe fuego con la boca abierta.
   - SIEGA (Seravel): sin la onda del piso; si te alcanza te congela 1 s.
   - PISOTÓN DE BRASA (Taurax): se alza y pisa (no el hachazo de su hoja).
   v7 (21/11): el pisotón de Taurax con su animación de PixelLab (ck_jefes_anims_arte.js: se alza y pisa de verdad).
   Lo que dibujan pasa por S._ckPedCrea: el editor lo lee como parte de la habilidad. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const FX = () => window.CK_JEFES_FX;
  const VX = () => window.CK_VFX;
  const PFX = () => window.CK_PIXELFX;
  const R = (a, b) => a + Math.random() * (b - a);
  const pies = e => (e.body ? { x: e.body.center.x, y: e.body.bottom } : { x: e.x, y: e.y + 20 });
  const piesH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y + 12 }; };
  const centroH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.center.y } : { x: S.player.x, y: S.player.y }; };
  const anim = (S, e, ...ks) => { for (const k of ks) { const key = e.type + '_' + k; if (S.anims.exists(key)) { e.play(key, true); return true; } } return false; };
  const plantar = (S, e, ms) => { e.state = 'ck_aulla'; e._ckRolHasta = S.time.now + ms; e._ckEsp = S.time.now + ms; e.isAttacking = false; e.swingId = (e.swingId || 0) + 1; e.setVelocity(0, 0); };
  const soltar = (S, e) => { if (!vivo(e)) return; e._ckEsp = 0; e.state = 'chase'; e.attackCooldown = Math.max(e.attackCooldown || 0, S.time.now + 450); anim(S, e, 'idle'); };
  const mirar = (S, e) => e.setFlipX(S.player.x < e.x);
  const luz = (x, y, c, r, ms) => { try { window.CK_LUZ && CK_LUZ.agregar({ x, y, c, r, f: 1, ms, curva: 'cae' }); } catch (er) {} };
  const zona = (S, x, y, r, col, ms) => { const F = FX(); if (F && F.zona) F.zona(S, x, y, r, col, ms); };
  const franja = (S, x0, y0, x1, y1, w, col, ms) => { const F = FX(); if (F && F.franjaViva) F.franjaViva(S, x0, y0, x1, y1, w, col, ms); };
  // el círculo de runas rojo debajo de la marca (los que hacen magia)
  const sello = (S, x, y, r, ms, tinte) => {
    const V = VX(), A = window.CK_PIXELFX_ARTE; if (!V || !A || !A.hojas.runas) return;
    return V.fx(S, 'runas', x, y, { escala: r / (46 * (A.hojas.runas.esc || 1)), tinte: tinte || 0xff4a3a, suma: true, alfa: 0.7, dura: ms, prof: Math.round(y) - 40 });
  };
  const efecto = (S, k, x, y, o) => { const V = VX(); return V ? crea(S, () => V.fx(S, k, x, y, o || {})) : null; };
  // ¿el héroe está dentro del óvalo (el piso, visto de arriba, a 0,6)?
  const dentro = (S, x, y, r) => { const h = centroH(S), dx = (h.x - x) / r, dy = (h.y - y) / (r * 0.6); return dx * dx + dy * dy <= 1; };
  const pega = (S, n) => { if (!S.isDead) S.damagePlayer(n); };
  const ROJO = 0xff3030, VERDE = 0x3fe06a;
  // (v6) lo que se dibuja acá lo lee el editor (como en ck_heroes_pedidos.js)
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };
  const HP = () => window.CK_HEROES_PEDIDOS;
  const canal = (S, e, col, ms, r) => { const H = HP(); if (H && H.canalizar) crea(S, () => H.canalizar(S, e, col, ms, r || 50)); };
  const brillo = (S, e, col, ms) => { const H = HP(); if (H && H.contorno) crea(S, () => H.contorno(S, e, col, ms)); };
  const chispas = (S, x, y, col, n, r, prof) => { const H = HP(); if (H && H.estallar) H.estallar(S, x, y, col, n, r, prof); };
  // el héroe: atrapado (no se mueve), congelado (igual, celeste), envenenado y empujado
  const quieto = (S, ms, txt, col) => {
    const now = S.time.now, nuevo = !(S._ckAtrapado > now);
    S._ckAtrapado = Math.max(S._ckAtrapado || 0, now + ms); S._ckAtrapadoCol = col;
    if (nuevo) S.createFloatingText(S.player.x, S.player.y - 46, txt, col);
  };
  const veneno = (S, ms) => {
    if (S._ckVenenoJ > S.time.now) return;
    S._ckVenenoJ = S.time.now + ms; S.createFloatingText(S.player.x, S.player.y - 58, '¡Envenenado!', 0x86efac);
    S.time.delayedCall(Math.round(ms * 0.66), () => { if (!S.isDead && S._ckVenenoJ) pega(S, 1); });
  };
  const empujarH = (S, ang, v, ms) => { S._ckEmpH = { t0: S.time.now, ms, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v }; };
  P.update = (u0 => function () {
    const r = u0.apply(this, arguments);
    try {
      const p = this.player, now = this.time.now; if (!p || !p.body) return r;
      if (this._ckAtrapado > now) { p.body.setVelocity(0, 0); if (Math.floor(now / 120) % 2) p.setTint(this._ckAtrapadoCol || VERDE); else p.clearTint(); this._ckAtrapadoTinte = true; }
      else if (this._ckAtrapadoTinte) { this._ckAtrapadoTinte = false; p.clearTint(); }
      if (this._ckVenenoJ > now && !(this._ckAtrapado > now)) { if (Math.floor(now / 200) % 3 === 0) p.setTint(0x9cf0a0); else if (!(this._ckLentoHasta > now)) p.clearTint(); }
      else if (this._ckVenenoJ && this._ckVenenoJ <= now) { this._ckVenenoJ = 0; p.clearTint(); }
      const E = this._ckEmpH; if (E) { const t = now - E.t0; if (t > E.ms) this._ckEmpH = null; else { const k = 1 - t / E.ms; p.body.setVelocity(E.vx * k, E.vy * k); } }
    } catch (e) {}
    return r;
  })(P.update);

  // ------------------------------------------------------------------ los números de cada habilidad (el editor los cambia)
  // origen: de dónde sale, respecto de los pies del jefe mirando a la derecha (si mira a la izquierda, dx se da vuelta).
  // extras: capas de efecto que se suman: { efecto, retraso (ms desde el golpe), donde: 'golpe' | 'jefe', dx, dy, escala, tinte, suma, alfa }
  const DEF = {
    pfx_manos:     { jefe: 'necromancer', nombre: 'Manos de la tumba', cada: 9000, dmin: 0, dmax: 320, aviso: 1300, radio: 34, dano: 1, efecto: 'pfx_manos', escala: 0.62, lento: 3000, atrapa: 1200, veneno: 3000, sello: true, lado: 'detras', extras: [] },
    pfx_espinas:   { jefe: 'skeleton_great', nombre: 'Espinas de hueso', cada: 9000, dmin: 90, dmax: 260, aviso: 1100, radio: 24, dano: 1, efecto: 'pfx_espina', escala: 0.62, cantidad: 5, paso: 34, entre: 110, ancho: 34, origen: { dx: 31, dy: -5 }, empuje: 260, extras: [] },
    pfx_rayos:     { jefe: 'brujo_sello', nombre: 'Rayos del Sello', cada: 8500, dmin: 0, dmax: 380, aviso: 800, radio: 32, dano: 1, efecto: 'rayo', escala: 0.75, cantidad: 3, entre: 330, sello: true, extras: [] },
    pfx_oscura:    { jefe: 'demonio_sello', nombre: 'Estallido oscuro', cada: 10000, dmin: 0, dmax: 240, aviso: 1270, radio: 110, dano: 2, efecto: 'pfx_oscura', escala: 0.85, desdeVida: 0.5, origen: { dx: 38, dy: 22 }, extras: [] },
    pfx_estrellas: { jefe: 'demonio_j_ojo', nombre: 'Ojos que persiguen', cada: 9000, dmin: 0, dmax: 380, aviso: 1000, radio: 14, dano: 1, efecto: 'golpe', escala: 0.9, cantidad: 3, vel: 105, vida: 7000, extras: [] },
    pfx_aliento:   { jefe: 'demonio_j_sabueso', nombre: 'Aliento de fuego', cada: 8000, dmin: 40, dmax: 170, aviso: 1000, radio: 150, dano: 1, efecto: 'pfx_aliento', escala: 1, dura: 1100, ancho: 46, origen: { dx: 30, dy: -20 }, extras: [] },
    pfx_siega:     { jefe: 'demonio_j_segadora', nombre: 'Siega', cada: 7000, dmin: 0, dmax: 110, aviso: 600, radio: 18, dano: 2, efecto: 'pfx_siega', escala: 1.25, alcance: 42, origen: { dx: 50, dy: 16 }, congela: 1000, extras: [] },
    pfx_pisoton:   { jefe: 'demonio_j_minotauro', nombre: 'Pisotón de brasa', cada: 9000, dmin: 0, dmax: 140, aviso: 800, radio: 95, dano: 2, efecto: 'pfx_pisoton', escala: 1.05, origen: { dx: 0, dy: 2 }, extras: [] }   // (21/11) los números que dejó el dueño en el editor
  };
  const AJUSTES = {};                                         // lo que cambió el editor, por habilidad
  const AJ = k => Object.assign({ deHeroe: !!{ pfx_manos: 1, pfx_espinas: 1, pfx_rayos: 1, pfx_estrellas: 1 }[k] }, DEF[k], AJUSTES[k] || {});
  // delante o detrás del personaje (el editor): las que caen donde estás van con el héroe; las que salen del jefe, con el jefe
  const DEL_HEROE = { pfx_manos: 1, pfx_espinas: 1, pfx_rayos: 1, pfx_estrellas: 1 };
  // "corte" (el editor): el efecto principal se apaga a esa altura de su animación (ms); las capas extra, con "dura"
  const conCorte = (A, o) => (A.corte ? Object.assign(o, { dura: o.dura ? Math.min(o.dura, A.corte) : A.corte }) : o);
  const prof = (S, e, lado, deHeroe, d0) => {
    if (lado !== 'delante' && lado !== 'detras') return d0;
    const r = deHeroe ? S.player : e, d = r && r.depth != null ? r.depth : d0;
    return lado === 'delante' ? d + 3 : d - 3;
  };
  const orig = (e, o) => { const a = pies(e), izq = e.flipX; o = o || { dx: 0, dy: 0 }; return { x: a.x + (izq ? -1 : 1) * (o.dx || 0), y: a.y + (o.dy || 0), izq }; };
  // las capas extra: en el punto del golpe o en el jefe
  const extras = (S, e, A, gx, gy) => {
    (A.extras || []).forEach(c => {
      if (!c || !c.efecto) return;
      S.time.delayedCall(Math.max(0, c.retraso || 0), () => {
        if (!vivo(e)) return;
        const base = c.donde === 'jefe' ? orig(e, A.origen) : { x: gx, y: gy, izq: e.flipX };
        const x = base.x + (base.izq ? -1 : 1) * (c.dx || 0), y = base.y + (c.dy || 0), deH = c.donde === 'jefe' ? false : !!A.deHeroe;
        efecto(S, c.efecto, x, y, { escala: c.escala || 1, tinte: c.tinte != null ? c.tinte : undefined, suma: !!c.suma, alfa: c.alfa != null ? c.alfa : 1, flip: base.izq, prof: prof(S, e, c.lado, deH, Math.round(y) + 30), dura: c.dura || undefined });
      });
    });
  };

  // ------------------------------------------------------------------ las habilidades
  const manos = (S, e) => {
    const A = AJ('pfx_manos'), AV = A.aviso;
    plantar(S, e, AV + 700); mirar(S, e);
    // (v6) levanta el bastón (su animación de invocar: la de ataque 2 trae dibujado un proyectil verde que se quitó)
    if (anim(S, e, 'summon', 'cast', 'attack1', 'attack') && e.anims && e.anims.currentAnim) { const n = e.anims.currentAnim.frames.length; S.time.delayedCall(Math.min(AV - 100, n * 90), () => { try { if (vivo(e) && e.anims.isPlaying) e.anims.pause(); } catch (er) {} }); }
    son('necro_cast', 0.8) || son('ck_fantasma_susurro', 0.7);
    canal(S, e, [110, 255, 140], AV, 52); brillo(S, e, 0x5dff7a, AV + 200);
    luz(e.x, e.y - 10, [110, 255, 150], 90, AV);
    const h = piesH(S);
    crea(S, () => { zona(S, h.x, h.y, A.radio, VERDE, AV); if (A.sello) sello(S, h.x, h.y, A.radio, AV, 0x4aff78); });
    S.time.delayedCall(AV, () => {
      try { if (e.anims && e.anims.isPaused) e.anims.resume(); } catch (er) {}
      if (!vivo(e)) return;
      efecto(S, A.efecto, h.x, h.y + 2, conCorte(A, { escala: A.escala, prof: prof(S, e, A.lado, true, Math.round(h.y) + 4) }));
      son('ck_f_huesos', 0.7) || son('bone_hit', 0.7);
      son('ck_fantasma_aparece', 0.6);
      luz(h.x, h.y, [90, 255, 130], 110, 700);
      extras(S, e, A, h.x, h.y);
      S.time.delayedCall(140, () => {
        if (!dentro(S, h.x, h.y, A.radio)) return;
        pega(S, A.dano);
        // te agarran: raíces que te atrapan, veneno y lento
        if (A.atrapa > 0) { quieto(S, A.atrapa, '¡Atrapado!', VERDE); const q = piesH(S); efecto(S, 'pfx_raices', q.x, q.y + 1, { escala: 0.8, prof: S.player.depth + 2 }); }
        if (A.veneno > 0) veneno(S, A.veneno);
        const E = window.CK_ESPECIALES; if (E && E.lento && A.lento > 0) E.lento(S, A.lento);
      });
    });
    S.time.delayedCall(AV + 700, () => soltar(S, e));
  };

  const espinas = (S, e) => {
    const A = AJ('pfx_espinas'), AV = A.aviso, N = Math.max(1, Math.round(A.cantidad)), PASO = A.paso, ENT = A.entre;
    plantar(S, e, AV + N * ENT + 450); mirar(S, e);
    // (v6) más anticipación: se planta con el arma en alto (sostiene el cuadro de arriba) y junta polvo de hueso
    if (anim(S, e, 'windup', 'attack2', 'attack') && e.anims && e.anims.currentAnim) S.time.delayedCall(260, () => { try { if (vivo(e) && e.anims.isPlaying) e.anims.pause(); } catch (er) {} });
    canal(S, e, [235, 225, 200], AV - 150, 44);
    son('ck_f_esqueleto_golpe', 0.8) || son('bone_hit', 0.8);
    const o = orig(e, { dx: 0, dy: (A.origen || {}).dy || 0 }), h = piesH(S), ang = Math.atan2(h.y - o.y, h.x - o.x);
    const cx = Math.cos(ang), cy = Math.sin(ang), d0 = (A.origen || {}).dx || 0;
    crea(S, () => franja(S, o.x + cx * d0, o.y + cy * d0, o.x + cx * (d0 + PASO * N), o.y + cy * (d0 + PASO * N), A.ancho, ROJO, AV));
    S.time.delayedCall(AV - 60, () => { try { if (vivo(e) && e.anims.isPaused) e.anims.resume(); } catch (er) {} });
    let pego = false;
    for (let i = 0; i < N; i++) {
      S.time.delayedCall(AV + i * ENT, () => {
        if (!vivo(e)) return;
        const x = o.x + cx * (d0 + PASO * (i + 0.5)), y = o.y + cy * (d0 + PASO * (i + 0.5));
        efecto(S, A.efecto, x, y + 2, conCorte(A, { escala: A.escala + i * 0.05, prof: prof(S, e, A.lado, true, Math.round(y) + 3) }));
        son('bone_hit', 0.45, { rate: 0.8 + i * 0.06 });
        if (i === 0 && S.cameras) S.cameras.main.shake(140, 0.004);
        if (i === 0) extras(S, e, A, x, y);
        if (!pego && dentro(S, x, y, A.radio)) { pego = true; pega(S, A.dano); if (A.empuje > 0) empujarH(S, ang, A.empuje, 280); }   // (v6) te empuja
      });
    }
    S.time.delayedCall(AV + N * ENT + 450, () => soltar(S, e));
  };

  const rayos = (S, e) => {
    const A = AJ('pfx_rayos'), AV = A.aviso, N = Math.max(1, Math.round(A.cantidad)), CADA = A.entre;
    plantar(S, e, N * CADA + AV + 400); mirar(S, e);
    // (v6, "usar sus sprites") Malakar levanta el báculo encendido (su ataque 2) mientras marca, y lo apunta (su ataque 1,
    // el del destello) cuando cae cada rayo
    anim(S, e, 'attack2', 'cast', 'attack');
    if (e.anims && e.anims.currentAnim) S.time.delayedCall(330, () => { try { if (vivo(e) && e.anims.isPlaying) e.anims.pause(); } catch (er) {} });
    brillo(S, e, 0xff4a5a, N * CADA + AV);
    son('necro_cast', 0.7, { rate: 1.2 });
    for (let i = 0; i < N; i++) {
      S.time.delayedCall(i * CADA, () => {
        if (!vivo(e)) return;
        const h = piesH(S), x = h.x + R(-10, 10), y = h.y + R(-6, 6);
        crea(S, () => { zona(S, x, y, A.radio, ROJO, AV); if (A.sello) sello(S, x, y, A.radio, AV); });
        son('ck_nova', 0.25, { rate: 1.6 });
        S.time.delayedCall(Math.max(0, AV - 330), () => { if (vivo(e)) { mirar(S, e); try { e.anims.resume(); } catch (er) {} anim(S, e, 'attack1', 'attack'); } });
        S.time.delayedCall(AV, () => {
          if (!vivo(e)) return;
          efecto(S, A.efecto, x, y, conCorte(A, { escala: A.escala, suma: true, prof: prof(S, e, A.lado, true, Math.round(y) + 4) }));
          efecto(S, 'chispa_rayo', x, y - 8, { escala: 0.9, suma: true, prof: prof(S, e, A.lado, true, Math.round(y - 8) + 30) });
          son('thunder_strike', 0.55) || son('ck_explosion', 0.4);
          luz(x, y, [150, 205, 255], 140, 360);
          if (S.cameras) S.cameras.main.shake(120, 0.005);
          extras(S, e, A, x, y);
          if (dentro(S, x, y, A.radio)) pega(S, A.dano);
        });
      });
    }
    S.time.delayedCall(N * CADA + AV + 400, () => soltar(S, e));
  };

  const oscura = (S, e) => {
    const A = AJ('pfx_oscura');
    if (!(e.hp <= (e.maxHp || e.hp) * A.desdeVida) && !e._ckEdPrueba) { (e._ckEspCd || {}).pfx_oscura = S.time.now + 1500; return; }
    const AV = A.aviso, RAD = A.radio;
    plantar(S, e, AV + 900); mirar(S, e);
    anim(S, e, 'windup', 'attack2', 'attack');
    son('ck_demonio_rugido', 0.8, { rate: 0.8 });
    const a = orig(e, A.origen);
    // (v6) la anticipación sin el círculo rojo: runas de fuego en el piso, calor que sube y brasas que se juntan en él
    canal(S, e, [255, 150, 60], AV, 70); brillo(S, e, 0xff7a2a, AV + 150);
    crea(S, () => {
      sello(S, a.x, a.y, RAD * 0.92, AV, 0xff7a2a);
      const g = S.add.graphics().setDepth(Math.round(a.y) - 41), t0 = S.time.now;
      const ev = S.time.addEvent({ delay: 40, loop: true, callback: () => {
        const t = (S.time.now - t0) / AV; if (t >= 1 || !g.active) { ev.remove(); g.destroy(); return; }
        g.clear(); g.fillStyle(0xff5a1a, 0.05 + 0.13 * t); g.fillEllipse(a.x, a.y, RAD * 2 * (0.4 + 0.6 * t), RAD * 1.2 * (0.4 + 0.6 * t));
        g.fillStyle(0xffb04a, 0.05 + 0.1 * t); g.fillEllipse(a.x, a.y, RAD * 1.1 * (0.4 + 0.6 * t), RAD * 0.66 * (0.4 + 0.6 * t));
        for (let i = 0; i < 2; i++) { const an = R(0, 6.28), d = R(0.2, 1) * RAD, q = S.add.rectangle(a.x + Math.cos(an) * d, a.y + Math.sin(an) * d * 0.6, 2, 2, [0xffb04a, 0xff6a1a, 0xffe08a][Math.floor(R(0, 3))], 1).setBlendMode(1).setDepth(Math.round(a.y) + 30); S.tweens.add({ targets: q, y: q.y - R(18, 40), alpha: 0, duration: R(500, 900), onComplete: () => q.destroy() }); }
      } });
    });
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      efecto(S, A.efecto, a.x, a.y, conCorte(A, { escala: A.escala, prof: prof(S, e, A.lado, false, Math.round(a.y) + 30) }));
      son('ck_explosion', 0.8, { rate: 0.7 });
      luz(a.x, a.y - 30, [255, 140, 60], 260, 900);
      if (S.cameras) { S.cameras.main.shake(420, 0.012); S.cameras.main.flash(90, 255, 120, 40, true); }
      // el piso se quiebra (sin la onda roja)
      const F = FX(); crea(S, () => { if (F && F.grieta) F.grieta(S, a.x, a.y, RAD * 0.7); if (F && F.escombros) F.escombros(S, a.x, a.y, RAD * 0.5, 14); });
      efecto(S, 'pfx_impacto', a.x, a.y, { escala: 0.75, prof: Math.round(a.y) - 6 });
      extras(S, e, A, a.x, a.y);
      if (dentro(S, a.x, a.y, RAD)) pega(S, A.dano);
    });
    S.time.delayedCall(AV + 900, () => soltar(S, e));
  };

  // (v6, "cambiala: hace una anticipación y tira unos ojos parecidos a él como proyectiles que nos persiguen, y los podemos
  // romper si los golpeamos") los ojos son ojos vigía chiquitos (su misma hoja): vuelan hacia vos, se rompen de un golpe
  const estrellas = (S, e) => {
    const A = AJ('pfx_estrellas'), AV = A.aviso, N = Math.max(1, Math.round(A.cantidad));
    plantar(S, e, AV + 700); mirar(S, e);
    anim(S, e, 'attack3', 'attack2', 'attack');
    if (e.anims && e.anims.currentAnim) S.time.delayedCall(250, () => { try { if (vivo(e) && e.anims.isPlaying) e.anims.pause(); } catch (er) {} });
    son('teleport', 0.5, { rate: 0.7 }) || son('ck_nova', 0.4);
    canal(S, e, [220, 150, 255], AV, 70); brillo(S, e, 0xd08cff, AV + 100);
    luz(e.x, e.y - 20, [200, 140, 255], 120, AV);
    S.time.delayedCall(AV, () => {
      try { if (e.anims && e.anims.isPaused) e.anims.resume(); } catch (er) {}
      if (!vivo(e)) return;
      son('necro_cast', 0.6, { rate: 1.5 });
      for (let i = 0; i < N; i++) S.time.delayedCall(i * 160, () => { if (vivo(e)) ojo(S, e, A, (i - (N - 1) / 2) * 0.9); });
    });
    S.time.delayedCall(AV + 700, () => soltar(S, e));
  };
  const ojo = (S, e, A, abre) => {
    if (typeof ENEMY_TYPES === 'undefined' || !ENEMY_TYPES.demonio_ojo) return;
    const a0 = Math.atan2(S.player.y - e.y, S.player.x - e.x) + abre, x = e.x + Math.cos(a0) * 26, y = e.y - 12 + Math.sin(a0) * 18;
    const pv = S._ckPermitirBestias; S._ckPermitirBestias = true;
    const o = crea(S, () => S.spawnEnemy(x, y, 'demonio_ojo')); S._ckPermitirBestias = pv;
    if (!o) return;
    o._ckOjito = { t0: S.time.now, vida: A.vida, vel: A.vel, dano: A.dano, radio: A.radio, vx: Math.cos(a0) * A.vel * 1.4, vy: Math.sin(a0) * A.vel * 1.4 };
    o.hp = o.maxHp = 1; o.def = Object.assign({}, o.def, { ranged: null, meleeToo: false, summon: null, xp: 0, coins: 0, reach: 0 });
    o.attackCooldown = 1e12; o.state = 'ck_ojito'; o.zone = e.zone;
    o.setScale(o.scaleX * 0.8, o.scaleY * 0.8); brillo(S, o, 0xd08cff, A.vida + 500); if (o.nameTag) o.nameTag.setVisible(false); if (o.hpBar) o.hpBar.setVisible(false);
    crea(S, () => { efecto(S, 'golpe', x, y, { escala: 0.6, tinte: 0xd08cff, suma: true }); });
  };
  // los ojos: vuelan hacia el héroe doblando de a poco; si lo tocan, pegan y revientan; a los 7 s revientan solos
  P.update = (u1 => function () {
    const r = u1.apply(this, arguments);
    try {
      if (!this.enemies || !this.player) return r;
      const now = this.time.now, h = centroH(this);
      this.enemies.getChildren().forEach(o => {
        const J = o._ckOjito; if (!J || !o.active) return;
        if (o.isDead) { if (!J.roto) { J.roto = true; crea(this, () => { efecto(this, 'golpe', o.x, o.y - 6, { escala: 0.8, tinte: 0xd08cff, suma: true }); chispas(this, o.x, o.y - 6, [200, 140, 255], 12, 18); }); } return; }
        o.state = 'ck_ojito'; o.attackCooldown = 1e12;
        const a = Math.atan2(h.y - (o.y - 4), h.x - o.x), k = 0.12; J.vx += (Math.cos(a) * J.vel - J.vx) * k; J.vy += (Math.sin(a) * J.vel - J.vy) * k;
        if (o.body) o.body.setVelocity(J.vx, J.vy); o.setFlipX(J.vx < 0); o.y += Math.sin(now / 140 + J.t0) * 0.15;
        if (Math.random() < 0.3) crea(this, () => { const q = this.add.rectangle(o.x + R(-3, 3), o.y - 4 + R(-3, 3), 2, 2, [0xd08cff, 0xff6ad0, 0xffffff][Math.floor(R(0, 3))], 1).setBlendMode(1).setDepth(o.depth - 1); this.tweens.add({ targets: q, alpha: 0, y: q.y - 6, duration: 300, onComplete: () => q.destroy() }); });
        const toca = Math.hypot(h.x - o.x, h.y - (o.y - 4)) < J.radio + 12;
        if (toca || now - J.t0 > J.vida) {
          if (toca) pega(this, J.dano);
          crea(this, () => { efecto(this, 'golpe', o.x, o.y - 4, { escala: 0.9, tinte: 0xd08cff, suma: true }); chispas(this, o.x, o.y - 4, [200, 140, 255], 14, 22); });
          son('slime_death', 0.4, { rate: 1.6 });
          o.isDead = true; if (o.hpBar) o.hpBar.destroy(); if (o.nameTag) o.nameTag.destroy(); o.destroy();
        }
      });
    } catch (er) {}
    return r;
  })(P.update);

  // (v6) la boca abierta: los cuadros de su ataque 1 hasta que abre la boca (sin el zarpazo que trae después), sostenida
  const boca = (S, e, ms) => {
    const k = e.type + '_aliento', base = e.type + '_attack1';
    if (!S.anims.exists(k) && S.anims.exists(base)) {
      const n = S.anims.get(base).frames.length, fr = S.anims.get(base).frames.map(f => f.frame.name);
      S.anims.create({ key: k, frames: [0, 1, 2, 3].filter(i => i < n).map(i => ({ key: S.anims.get(base).frames[i].textureKey, frame: fr[i] })), frameRate: 6, repeat: 0 });
    }
    if (!S.anims.exists(k)) return false;
    e.play(k, true); return true;
  };
  // la marca: un cono de calor que se llena, con brasas que corren hacia afuera (en vez de la franja)
  const cono = (S, x, y, ang, largo, ancho, ms) => crea(S, () => {
    const g = S.add.graphics().setDepth(Math.round(y) - 2), t0 = S.time.now, ab = Math.atan2(ancho * 0.5, largo) * 1.5;
    const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
      const t = Math.min(1, (S.time.now - t0) / ms); if (S.time.now - t0 > ms || !g.active) { ev.remove(); S.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() }); return; }
      g.clear();
      [[1, 0.08 + 0.1 * t, 0xff5a1a], [0.75, 0.08 + 0.12 * t, 0xff8a2a], [0.5 * t + 0.1, 0.12 + 0.2 * t, 0xffc04a]].forEach(([k, al, c]) => {
        const L = largo * k, a1 = ang - ab * (0.6 + 0.4 * k), a2 = ang + ab * (0.6 + 0.4 * k);
        g.fillStyle(c, al); g.beginPath(); g.moveTo(x, y);
        for (let i = 0; i <= 10; i++) { const aa = a1 + (a2 - a1) * i / 10, rr = L * (0.92 + Math.sin(S.time.now / 90 + i) * 0.04); g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.62); }
        g.closePath(); g.fillPath();
      });
      if (Math.random() < 0.7) { const aa = ang + R(-ab, ab), q = S.add.rectangle(x + Math.cos(aa) * 10, y + Math.sin(aa) * 6, 2, 2, [0xffb04a, 0xff6a1a, 0xffe08a][Math.floor(R(0, 3))], 1).setBlendMode(1).setDepth(Math.round(y) + 2);
        S.tweens.add({ targets: q, x: x + Math.cos(aa) * largo * R(0.5, 1), y: y + Math.sin(aa) * largo * R(0.5, 1) * 0.62 - R(2, 8), alpha: 0, duration: R(400, 700), onComplete: () => q.destroy() }); }
    } });
  });
  const aliento = (S, e) => {
    const A = AJ('pfx_aliento'), AV = A.aviso, LARGO = A.radio, DURA = A.dura;
    plantar(S, e, AV + DURA + 300); mirar(S, e);
    if (!boca(S, e, AV)) anim(S, e, 'windup', 'attack2', 'attack');
    son('beast_growl', 0.7, { rate: 0.7 });
    const b = orig(e, A.origen), bx = b.x, by = b.y;
    const c = centroH(S), ang = Math.atan2(c.y - by, c.x - bx);
    canal(S, { x: bx, y: by + 6, depth: e.depth + 2, get active() { return e.active; } }, [255, 150, 60], AV, 30);
    cono(S, bx, by + 14, ang, LARGO, A.ancho, AV);
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      try { if (e.anims && e.anims.currentAnim && /_aliento$/.test(e.anims.currentAnim.key)) e.anims.pause(e.anims.currentAnim.frames[e.anims.currentAnim.frames.length - 1]); } catch (er) {}   // con la boca abierta mientras escupe
      const s = efecto(S, A.efecto, bx, by, conCorte(A, { escala: A.escala, giro: ang, dura: DURA, prof: prof(S, e, A.lado, false, Math.round(by) + 40) }));
      if (s && Math.cos(ang) < 0) s.setFlipY(true);       // que el humo suba también hacia la izquierda
      son('fire_cast', 0.8, { rate: 0.8 }); son('ck_demonio_chillido', 0.5, { rate: 0.7 });
      extras(S, e, A, bx + Math.cos(ang) * LARGO * 0.6, by + Math.sin(ang) * LARGO * 0.6);
      let pego = false;
      const mira = () => {
        if (pego || !vivo(e) || S.isDead) return;
        const h = centroH(S), d = Math.hypot(h.x - bx, h.y - by), a2 = Math.atan2(h.y - by, h.x - bx), da = Math.abs(Math.atan2(Math.sin(a2 - ang), Math.cos(a2 - ang)));
        if (d < LARGO && da < Math.atan2(A.ancho * 0.5, LARGO * 0.5) + 0.12) { pego = true; pega(S, A.dano); }
      };
      [150, 450, 800].filter(t => t < DURA).forEach(t => S.time.delayedCall(t, mira));
      for (let i = 0; i < 4; i++) S.time.delayedCall(i * 250, () => luz(bx + Math.cos(ang) * 70, by + Math.sin(ang) * 70, [255, 130, 50], 130, 300));
      S.time.delayedCall(DURA, () => { try { if (vivo(e) && e.anims.isPaused) e.anims.resume(); } catch (er) {} });
    });
    S.time.delayedCall(AV + DURA + 300, () => soltar(S, e));
  };

  const siega = (S, e) => {
    const A = AJ('pfx_siega'), AV = A.aviso, RAD = A.radio;
    plantar(S, e, AV + 800); mirar(S, e);
    anim(S, e, 'windup', 'attack2', 'attack');
    son('ck_f_zarpazo', 0.6, { rate: 0.7 }) || son('sword_swing2', 0.6, { rate: 0.6 });
    const a = pies(e), izq = e.flipX, fx = a.x + (izq ? -1 : 1) * A.alcance;
    // (v6) sin la onda del piso: la marca es un brillo frío que se junta donde va a segar
    canal(S, { x: fx, y: a.y - 4, depth: Math.round(a.y) + 10, get active() { return e.active; } }, [170, 220, 255], AV, RAD + 14);
    brillo(S, e, 0x9fd8ff, AV + 200);
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      anim(S, e, 'attack', 'attack2');
      const o = orig(e, A.origen);
      efecto(S, A.efecto, o.x, o.y, conCorte(A, { escala: A.escala, flip: izq, prof: prof(S, e, A.lado, false, Math.round(o.y) + 30) }));
      son('spin', 0.6, { rate: 0.7 }); son('sword_swing1', 0.6, { rate: 0.6 });
      extras(S, e, A, fx, a.y);
      S.time.delayedCall(180, () => {
        if (!dentro(S, fx, a.y, RAD)) return;
        pega(S, A.dano);
        if (A.congela > 0) { quieto(S, A.congela, '¡Congelado!', 0x9fd8ff); const q = centroH(S); efecto(S, 'hielo_roto', q.x, q.y, { escala: 0.9, suma: true, prof: S.player.depth + 2 }); son('ice_cast', 0.6, { rate: 1.3 }); }
      });
    });
    S.time.delayedCall(AV + 800, () => soltar(S, e));
  };

  const pisoton = (S, e) => {
    const A = AJ('pfx_pisoton'), AV = A.aviso, RAD = A.radio;
    plantar(S, e, AV + 800); mirar(S, e);
    // (v6, "no la animación del golpe, que sea como el pisotón") se queda en su pose de pie, se alza estirándose y pisa
    anim(S, e, 'idle');
    const sx = e.scaleX, sy = e.scaleY, y0 = e.y;
    // (v7) con la animación de PixelLab (ck_jefes_anims_arte.js) se alza de verdad y pisa; si no está, se estira como antes
    const SUBE = e.type + '_pis_sube', BAJA = e.type + '_pis_baja', conAnim = S.anims.exists(SUBE) && S.anims.exists(BAJA);
    if (conAnim) S.time.delayedCall(Math.max(0, AV - 90 - 340 - 260), () => { if (vivo(e)) e.play(SUBE, true); });
    else S.tweens.add({ targets: e, scaleY: sy * 1.12, scaleX: sx * 0.94, y: y0 - 7, duration: AV * 0.85, ease: 'Sine.easeOut' });
    son('beast_growl', 0.7, { rate: 0.6 });
    canal(S, e, [255, 140, 50], AV, 60); brillo(S, e, 0xff7a2a, AV);
    const a = orig(e, A.origen);
    crea(S, () => zona(S, a.x, a.y, RAD, ROJO, AV));
    S.time.delayedCall(AV - 90, () => { if (!vivo(e)) return; if (conAnim) e.play(BAJA, true); else S.tweens.add({ targets: e, scaleY: sy * 0.84, scaleX: sx * 1.08, y: y0 + 1, duration: 90, ease: 'Quad.easeIn' }); });
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      if (!conAnim) S.tweens.add({ targets: e, scaleY: sy, scaleX: sx, y: y0, duration: 260, ease: 'Back.easeOut' });
      efecto(S, A.efecto, a.x, a.y, conCorte(A, { escala: A.escala, prof: prof(S, e, A.lado, false, Math.round(a.y) + 30) }));
      efecto(S, 'pfx_aterrizaje', a.x, a.y, { escala: 1.2, prof: Math.round(a.y) - 4 });
      son('ck_pisoton_jefe', 0.85) || son('ck_derrumbe', 0.7);
      son('ck_explosion', 0.45, { rate: 0.6 });
      luz(a.x, a.y, [255, 120, 40], 200, 700);
      if (S.cameras) S.cameras.main.shake(320, 0.011);
      if (window.CK_ONDAS) crea(S, () => { CK_ONDAS.estallido(S, 'fuego', a.x, a.y, RAD, 450); CK_ONDAS.estallido(S, 'tierra', a.x, a.y, RAD * 0.8, 380); });
      extras(S, e, A, a.x, a.y);
      if (dentro(S, a.x, a.y, RAD)) pega(S, A.dano);
    });
    S.time.delayedCall(AV + 800, () => { if (vivo(e) && !conAnim) { e.setScale(sx, sy); } soltar(S, e); });
  };

  // ------------------------------------------------------------------ quién usa qué: [habilidad, cada (ms), distancia mín., máx.]
  const PLAN = {};
  Object.keys(DEF).forEach(k => { const d = DEF[k]; (PLAN[d.jefe] = PLAN[d.jefe] || []).push([k, d.cada, d.dmin, d.dmax]); });
  const HACER = { pfx_manos: manos, pfx_espinas: espinas, pfx_rayos: rayos, pfx_oscura: oscura, pfx_estrellas: estrellas, pfx_aliento: aliento, pfx_siega: siega, pfx_pisoton: pisoton };
  // los jefes de los demonios tienen su propio golpe especial: después de uno nuestro, el suyo espera un poco
  const respiro = (S, e) => { const t = S.time.now + 2200; if (e._rcEsp !== undefined) e._rcEsp = Math.max(e._rcEsp || 0, t); if (e._esp !== undefined) e._esp = Math.max(e._esp || 0, t); };
  // el editor cambia los números en vivo: cada cuánto y las distancias van en el plan de ck_jefes_especiales.js
  const sincronizar = () => {
    Object.keys(PLAN).forEach(t => PLAN[t].forEach(f => { const A = AJ(f[0]); f[1] = A.cada; f[2] = A.dmin; f[3] = A.dmax; }));
  };
  const poner = (k, obj) => { if (!DEF[k]) return; if (obj) AJUSTES[k] = obj; else delete AJUSTES[k]; sincronizar(); };

  let listo = false;
  const enganchar = () => {
    const E = window.CK_ESPECIALES, Ar = window.CK_PIXELFX_ARTE;
    if (listo || !E || !E.PLAN || !E.HACER || !Ar || !window.CK_PIXELFX) return;
    listo = true;
    Object.keys(PLAN).forEach(t => { E.PLAN[t] = (E.PLAN[t] || []).concat(PLAN[t]); });
    Object.keys(HACER).forEach(k => { E.HACER[k] = function (S, e) { try { respiro(S, e); HACER[k](S, e); } catch (er) { console.warn('[jefes pixelfx]', k, er); soltar(S, e); } }; });
  };
  const up0 = P.update;
  P.update = function () { const r = up0.apply(this, arguments); if (!listo) { try { enganchar(); } catch (e) {} } return r; };
  window.CK_JEFES_PIXELFX = { PLAN, HACER, DEF, AJUSTES, AJ, poner, sincronizar, soltar, DEL_HEROE };
})();
