'use strict';
/* Los jefes como los pidió el dueño en el editor de habilidades (21/11, notas del archivo ajustes_habilidades.json; ver
   D:\Editor\PEDIDOS_HABILIDADES.md). Pixelfx (hojas pfx_ de ck_pixelfx_arte.js) y código; envuelve o reemplaza sin tocar
   los archivos de cada jefe (los del Coliseo y Azrath, en su archivo):
   - GOLPES DE SIEMPRE (con ck_jefes_fx.js: GOLPE y ANTICIPA): Gorvak, un tajo limpio sin la onda roja; Ulrak, la estocada
     de la lanza con su destello, sin la onda; Kragmor, el puñetazo parte el piso (polvo, grietas, piedritas y su onda);
     Garra Negra, más anticipación, zarpazos de garra y una onda de polvo; Fauces, sólo zarpazos (sin la onda roja).
   - GRUSHAK (al 25 %): en vez del pisotón, ARROJA EL HACHA: avisa donde va a caer, la tira girando, se clava en el piso
     (golpe al piso de pixelfx: grietas, polvo, rocas) y va a buscarla caminando; mientras tanto no ataca.
   - GARRA NEGRA: el salto cae con el quiebre del piso centrado en sus pies (golpe de pixelfx); el zarpazo fuerte se carga,
     pesa (frena un instante al pegar) y deja zarpazos y polvo; a la mitad de la vida RUGE 2 s (ondas), te empuja, llama a
     los huargos y recién después ataca.
   - GRAN ESQUELETO · golpe a la tierra: 1,1 s levantando el arma, polvo de hueso que se junta; al golpear, golpe al piso de
     pixelfx, grietas, escombros y astillas de hueso.
   - ORBATH · corona: se carga 1,6 s (energía, contorno rojo, el aro que se cierra) y dispara rayos largos (380 px) que
     cruzan el lugar, con chispas; recarga un momento antes de seguir.
   - FAUCES: no llama perros; a medida que lo lastimás (al 66 % y al 33 %) se le desprende un perro más chico, y cada uno de
     esos, al morir, se parte en dos más chicos todavía. La embestida termina con un mordisco (la boca que se cierra).
   - TAURAX · embestida: si te alcanza, te empuja lejos.
   - GROMM · martillazo: levanta el martillo y lo sostiene; al golpear, el anillo de fuego de pixelfx y la onda que se abre
     son partículas de fuego (sin el círculo).
   - MORVANE · pilares: sin los círculos del piso (brasas que avisan).
   v2 (21/11, "usa pixellab también para los sprites de los npc jefes si hace falta"):
   - GRUSHAK sin el hacha en la mano mientras la tiene clavada: de sus propias hojas se borra el hacha (quieto, caminar, dolor y
     el final del hachazo, armadas al empezar); el hacha que vuela y se clava es la suya, recortada de su cuadro quieto.
   - Carga las hojas de PixelLab de ck_jefes_anims_arte.js (pisotón de Taurax, tiro de roca de Kragmor) y arma sus animaciones.
   - Fuera del reino (pruebas, editor) mira si la embestida te alcanza (Taurax te empuja también ahí).
   v3 (22/11): Garra Negra cae justo sobre su marca (su animación de salto se corría para abajo: saltoDerecho).
   Lo que dibuja pasa por S._ckPedCrea (el editor lo lee). Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (er) { return false; } };
  const FX = () => window.CK_JEFES_FX, VX = () => window.CK_VFX, HP = () => window.CK_HEROES_PEDIDOS;
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };
  const fx = (S, k, x, y, o) => { const V = VX(); return V && V.fx ? crea(S, () => V.fx(S, k, x, y, o || {})) : null; };
  const pies = e => (e.body ? { x: e.body.center.x, y: e.body.bottom } : { x: e.x, y: e.y + 20 });
  const piesH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y + 12 }; };
  const centroH = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.center.y } : { x: S.player.x, y: S.player.y }; };
  const frente = (e, d) => { const a = pies(e); return { x: a.x + (e.flipX ? -d : d), y: a.y }; };
  const luz = (x, y, c, r, ms) => { try { window.CK_LUZ && CK_LUZ.agregar({ x, y, c, r, f: 1, ms, curva: 'cae' }); } catch (er) {} };
  const ondas = (S, t, x, y, r, ms) => { try { window.CK_ONDAS && crea(S, () => CK_ONDAS.estallido(S, t, x, y, r, ms)); } catch (er) {} };
  const grieta = (S, x, y, r) => { const F = FX(); if (F && F.grieta) crea(S, () => F.grieta(S, x, y, r)); };
  const escombros = (S, x, y, r, n) => { const F = FX(); if (F && F.escombros) crea(S, () => F.escombros(S, x, y, r, n)); };
  const canal = (S, e, col, ms, r) => { const H = HP(); if (H && H.canalizar) crea(S, () => H.canalizar(S, e, col, ms, r || 50)); };
  const brillo = (S, e, col, ms) => { const H = HP(); if (H && H.contorno) crea(S, () => H.contorno(S, e, col, ms)); };
  const chispas = (S, x, y, col, n, r, prof) => { const H = HP(); if (H && H.estallar) H.estallar(S, x, y, col, n, r, prof); };
  const anim = (S, e, ...ks) => { for (const k of ks) { const key = e.type + '_' + k; if (S.anims.exists(key)) { e.play(key, true); return key; } } return null; };
  const sostener = (S, e, ms, cuadro) => S.time.delayedCall(ms, () => { try { if (vivo(e) && e.anims && e.anims.isPlaying) { if (cuadro != null && e.anims.currentAnim) e.anims.pause(e.anims.currentAnim.frames[Math.min(cuadro, e.anims.currentAnim.frames.length - 1)]); else e.anims.pause(); } } catch (er) {} });
  const soltarAnim = e => { try { if (e.anims && e.anims.isPaused) e.anims.resume(); } catch (er) {} };
  const elipse = (S, x, y, r) => { const h = piesH(S), dx = (h.x - x) / r, dy = (h.y - y) / (r * 0.6); return dx * dx + dy * dy <= 1; };
  const pega = (S, n) => { if (!S.isDead && !S.isDashing) S.damagePlayer(n); };
  // el héroe empujado (la velocidad se sostiene: el movimiento la pisaría)
  const empujarH = (S, ang, v, ms) => { S._ckEmpJ = { t0: S.time.now, ms, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v }; };
  const plantar = (S, e, ms) => { e.state = 'ck_aulla'; e._ckRolHasta = S.time.now + ms; e.isAttacking = false; e.swingId = (e.swingId || 0) + 1; e.setVelocity(0, 0); };
  const idle = (S, e) => { if (vivo(e) && S.anims.exists(e.type + '_idle')) e.play(e.type + '_idle', true); };

  // ================================================================== 1. LOS GOLPES DE SIEMPRE (ck_jefes_fx.js)
  const GOLPE = {
    orc_campeon: (S, e, def) => {                 // Gorvak: tajo de espada limpio, sin la onda
      const a = frente(e, (def.reach || 60) * 0.55);
      fx(S, 'tajo_x', a.x, a.y - 22, { escala: 0.85, flip: e.flipX, prof: Math.round(a.y) + 30 });
      chispas(S, a.x + (e.flipX ? -8 : 8), a.y - 22, [235, 240, 255], 6, 14);
    },
    cazador_ulrak: (S, e, def) => {               // Ulrak: la estocada de la lanza, con su destello y chispas, sin la onda
      const a = pies(e), h = centroH(S), ang = Math.atan2(h.y - (a.y - 30), h.x - a.x), L = (def.reach || 70) * 0.75;
      fx(S, 'tajo_veloz', a.x + Math.cos(ang) * L, a.y - 30 + Math.sin(ang) * L, { escala: 0.9, giro: ang, suma: true, tinte: 0xfff0c8, prof: Math.round(a.y) + 30 });
      chispas(S, a.x + Math.cos(ang) * (L + 14), a.y - 30 + Math.sin(ang) * (L + 14), [255, 230, 170], 8, 16);
    },
    bestia_kragmor: (S, e, def) => {              // Kragmor: el puñetazo parte el piso
      const a = frente(e, (def.reach || 70) * 0.55);
      fx(S, 'pfx_aterrizaje', a.x, a.y, { escala: 1.1, prof: Math.round(a.y) - 4 });
      grieta(S, a.x, a.y, 34); escombros(S, a.x, a.y, 30, 10); ondas(S, 'tierra', a.x, a.y, 48, 380);
      S.cameras.main.shake(160, 0.006); son('ck_pisoton_jefe', 0.45, { rate: 1.3 });
    },
    werebear_jefe: (S, e, def) => {               // Garra Negra: zarpazo de garra y una onda de polvo
      const a = frente(e, (def.reach || 60) * 0.5);
      fx(S, 'garras', a.x, a.y - 26, { escala: 1.1, flip: e.flipX, tinte: 0xffb0a0, prof: Math.round(a.y) + 30 });
      ondas(S, 'tierra', a.x, a.y, 40, 320); grieta(S, a.x, a.y, 20);
    },
    demonio_j_sabueso: (S, e, def) => {           // Fauces: sólo zarpazos, sin la onda roja
      const a = frente(e, (def.reach || 60) * 0.5);
      fx(S, 'garras', a.x, a.y - 16, { escala: 0.9, flip: e.flipX, tinte: 0xffa070, prof: Math.round(a.y) + 30 });
    }
  };
  const ANTICIPA = { werebear_jefe: 250 };
  const ponerGolpes = () => { const F = FX(); if (!F || !F.GOLPE || F.GOLPE._ckPed) return; Object.assign(F.GOLPE, GOLPE); Object.assign(F.ANTICIPA, ANTICIPA); F.GOLPE._ckPed = true; };
  // Fauces (y los perros que se le desprenden) pegan sólo con los zarpazos (su ataque 2)
  const ma0 = P.enemyMeleeAttack;
  if (ma0) P.enemyMeleeAttack = function (enemy, def) {
    const r = ma0.apply(this, arguments);
    try {
      if (enemy && (enemy.type === 'demonio_j_sabueso' || enemy._ckFauces) && r) {
        const t = enemy._ckFauces ? 'demonio_sabueso' : enemy.type, k = t + '_attack2';
        if (this.anims.exists(k)) return Object.assign({}, r, { key: k, n: 2 });
      }
    } catch (er) {}
    return r;
  };

  // ================================================================== 2. GRUSHAK: ARROJA EL HACHA
  const GR = { cada: 7000, aviso: 900, radio: 52, dano: 2, busca: 4500 };
  const texHacha = S => {
    if (S.textures.exists('ckj_hacha_g')) return 'ckj_hacha_g';
    const t = S.textures.createCanvas('ckj_hacha_g', 22, 22), g = t.getContext(), p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
    // el mango (de abajo a arriba, en diagonal) y la hoja doble arriba
    for (let i = 0; i < 14; i++) { p('#1b0f0a', 4 + i, 17 - i, 3, 3); }
    for (let i = 0; i < 14; i++) { p('#6b4426', 5 + i, 17 - i, 1, 1); p('#8a5a32', 5 + i, 18 - i, 1, 1); }
    p('#1b0f0a', 11, 0, 11, 11); p('#5d646c', 12, 1, 9, 9); p('#9aa2ab', 13, 2, 7, 6); p('#d5dbe1', 14, 2, 5, 2); p('#3a3f45', 12, 8, 9, 2); p('#b02020', 16, 5, 2, 2);
    t.refresh(); return 'ckj_hacha_g';
  };
  // (v2) SIN EL HACHA EN LA MANO: de sus propias hojas (quieto, caminar, dolor y el final del hachazo) se borra el hacha:
  // en cada cuadro, la primera columna a la derecha de la mano por donde sólo pasa el mango (6 píxeles o menos) y todo lo que
  // está a su derecha; la mano queda con su borde oscuro. El hacha que vuela es la suya, recortada del cuadro quieto.
  // Mientras no la tiene, lo que el juego le pida (quieto, caminar, dolor) se cambia por la versión sin hacha.
  const SH = { idle: 'idle', walk: 'walk', walk_front: 'walk', walk_back: 'walk', hurt: 'hurt', attack1: 'idle', attack2: 'idle', windup: 'idle' };
  const corte = d => { for (let x = 50; x <= 58; x++) { let n = 0; for (let y = 0; y < 100; y++) if (d[(y * 100 + x) * 4 + 3] > 100) n++; if (n <= 6) return x; } return -1; };
  const sinHacha = S => {
    if (S._ckSinHacha !== undefined) return S._ckSinHacha;
    S._ckSinHacha = false;
    try {
      const cuadro = (key, i) => { const f = S.textures.getFrame(key, i); if (!f) return null; const c = document.createElement('canvas'); c.width = 100; c.height = 100; c.getContext('2d', { willReadFrequently: true }).drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight); return c; };
      const limpiar = c => {
        const g = c.getContext('2d'), img = g.getImageData(0, 0, 100, 100), d = img.data, x0 = corte(d); if (x0 < 0) return -1;
        for (let y = 0; y < 100; y++) for (let x = x0; x < 100; x++) d[(y * 100 + x) * 4 + 3] = 0;
        for (let y = 0; y < 100; y++) { const i = (y * 100 + x0 - 1) * 4; if (d[i + 3] > 100 && d[i] + d[i + 1] + d[i + 2] > 150) { const j = i + 4; d[j] = 24; d[j + 1] = 14; d[j + 2] = 12; d[j + 3] = 255; } }
        g.putImageData(img, 0, 0); return x0;
      };
      const armar = (key, base, idx, armados) => {
        const A = S.anims.get('orc_warlord_' + base); if (!A) return false;
        const L = (idx || A.frames.map((f, i) => i)).map(i => A.frames[Math.min(i, A.frames.length - 1)]).map(f => { const c = cuadro(f.textureKey, f.textureFrame); if (c && !(armados && armados.indexOf(f.index - 1) >= 0)) limpiar(c); return c; }).filter(Boolean);
        if (!L.length) return false;
        const hoja = document.createElement('canvas'); hoja.width = 100 * L.length; hoja.height = 100; L.forEach((c, i) => hoja.getContext('2d').drawImage(c, i * 100, 0));
        const tk = 'orc_warlord_sh_' + key; if (S.textures.exists(tk)) S.textures.remove(tk);
        S.textures.addSpriteSheet(tk, hoja, { frameWidth: 100, frameHeight: 100 });
        if (!S.anims.exists(tk)) S.anims.create({ key: tk, frames: S.anims.generateFrameNumbers(tk, { start: 0, end: L.length - 1 }), frameRate: key === 'suelta' ? 14 : A.frameRate, repeat: key === 'suelta' || key === 'hurt' ? 0 : -1 });
        return true;
      };
      if (!armar('idle', 'idle') || !armar('walk', 'walk')) return false;
      armar('hurt', 'hurt'); armar('suelta', 'attack1', [4, 5, 6, 7], [4]);           // (el 4: con el hacha arriba; del 5 en adelante, ya la soltó)
      // el hacha, del cuadro quieto
      const c = cuadro('orc_warlord_idle', 0), d = c.getContext('2d').getImageData(0, 0, 100, 100).data, x0 = corte(d);
      if (x0 > 0) {
        let x1 = 0, y0 = 100, y1 = 0; for (let y = 0; y < 100; y++) for (let x = x0; x < 100; x++) if (d[(y * 100 + x) * 4 + 3] > 20) { x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        if (w > 4 && h > 4) {
          if (S.textures.exists('ckj_hacha_g2')) S.textures.remove('ckj_hacha_g2');
          const t = S.textures.createCanvas('ckj_hacha_g2', w, h); t.getContext().drawImage(c, x0, y0, w, h, 0, 0, w, h); t.refresh();
        }
      }
      S._ckSinHacha = true;
    } catch (er) { console.warn('[jefes pedidos] sin hacha', er); }
    return S._ckSinHacha;
  };
  const conHacha = (S, e, tiene) => {
    if (!e._ckShPlay) {
      const play0 = e.play; e._ckShPlay = true;
      e.play = function (key, ignorar) {
        try {
          if (this._ckManoVacia) {
            const k = typeof key === 'string' ? key : key && key.key, m = k && k.indexOf('orc_warlord_') === 0 && !/_sh_/.test(k) ? SH[k.slice(12)] : null;
            if (m && S.anims.exists('orc_warlord_sh_' + m)) return play0.call(this, typeof key === 'string' ? 'orc_warlord_sh_' + m : Object.assign({}, key, { key: 'orc_warlord_sh_' + m }), ignorar);
          }
        } catch (er) {}
        return play0.apply(this, arguments);
      };
    }
    e._ckManoVacia = !tiene;
  };
  const hacha = (S, e) => {
    const AV = GR.aviso, t = piesH(S); texHacha(S); sinHacha(S);
    plantar(S, e, AV + 2000); e.setFlipX(t.x < e.x);
    if (S.anims.exists('orc_warlord_windup')) { e.play('orc_warlord_windup', true); sostener(S, e, Math.min(AV - 60, 560), 6); }      // (sube el hacha y la sostiene arriba)
    canal(S, e, [255, 120, 90], AV, 50); brillo(S, e, 0xff6a4a, AV);
    son('beast_growl', 0.7, { rate: 0.5 });
    const F = FX(); if (F && F.zona) crea(S, () => F.zona(S, t.x, t.y, GR.radio, 0xff3b2f, AV + 480));
    S.time.delayedCall(AV, () => {
      if (!vivo(e)) return;
      soltarAnim(e);
      const tex = S.textures.exists('ckj_hacha_g2') ? 'ckj_hacha_g2' : 'ckj_hacha_g', esc = tex === 'ckj_hacha_g2' ? (e.scaleX || 1.38) : 1.6;
      if (S.anims.exists('orc_warlord_sh_suelta')) { conHacha(S, e, false); e.play('orc_warlord_sh_suelta', true); } else anim(S, e, 'attack2', 'attack1');
      son('ck_giro_hacha', 0.8) || son('sword_swing2', 0.8, { rate: 0.6 });
      const o = { x: e.x + (e.flipX ? -14 : 14), y: e.y - 20 }, h = crea(S, () => S.add.image(o.x, o.y, tex).setScale(esc).setDepth(30000)), k = { t: 0 };
      S.tweens.add({ targets: k, t: 1, duration: 480, ease: 'Sine.easeIn', onUpdate: () => {
        const x = o.x + (t.x - o.x) * k.t, y = o.y + (t.y - 6 - o.y) * k.t - Math.sin(k.t * Math.PI) * 55; h.setPosition(x, y).setRotation(k.t * 14);
        if (Math.random() < 0.6) crea(S, () => { const q = S.add.image(x, y, tex).setScale(esc).setRotation(k.t * 14).setAlpha(0.3).setTintFill(0xffd0b0).setDepth(29999); S.tweens.add({ targets: q, alpha: 0, duration: 140, onComplete: () => q.destroy() }); });
      }, onComplete: () => {
        if (!h.active) return;
        // clavada en el piso, inclinada
        h.setPosition(t.x + 2, t.y - 12).setRotation(e.flipX ? -0.5 : 0.5).setDepth(Math.round(t.y) + 2);
        fx(S, 'pfx_impacto', t.x, t.y, { escala: 0.8, prof: Math.round(t.y) - 6 });
        grieta(S, t.x, t.y, GR.radio); escombros(S, t.x, t.y, GR.radio * 0.7, 14); ondas(S, 'tierra', t.x, t.y, GR.radio * 1.1, 450);
        S.cameras.main.shake(320, 0.013); son('ck_pisoton_jefe', 0.8) || son('bone_hit', 0.9, { rate: 0.5 }); luz(t.x, t.y, [255, 200, 140], 120, 300);
        if (elipse(S, t.x, t.y, GR.radio)) { pega(S, GR.dano); empujarH(S, Math.atan2(piesH(S).y - t.y, piesH(S).x - t.x), 260, 220); }
        // y va a buscarla
        if (!vivo(e)) { h.destroy(); conHacha(S, e, true); return; }
        e._ckHacha = { x: t.x, y: t.y, img: h, t0: S.time.now };
        e.state = 'ck_busca'; anim(S, e, 'walk');
        S.createFloatingText(e.x, e.y - 60, '¡SU HACHA!', 0xfca5a5);
      } });
    });
  };
  const buscar = (S, e, now) => {
    const H = e._ckHacha, a = pies(e), d = Math.hypot(H.x - a.x, H.y - a.y);
    if (d < 20 || now - H.t0 > GR.busca) {
      e.setVelocity(0, 0); e.state = 'ck_aulla'; e._ckRolHasta = now + 450;
      // (v2) se agacha a sacarla (el final del hachazo, sin hacha) y la vuelve a tener en la mano
      if (S.anims.exists('orc_warlord_sh_suelta')) { e.play('orc_warlord_sh_suelta', true); sostener(S, e, 160, 2); }
      S.time.delayedCall(330, () => { if (H.img && H.img.active) H.img.destroy(); conHacha(S, e, true); soltarAnim(e); if (vivo(e)) idle(S, e); son('sword_hit', 0.5, { rate: 0.8 }); });
      e._ckHacha = null; e._ckHachaAt = now + GR.cada; return;
    }
    const v = (e.def.speed || 70) * 1.15, ang = Math.atan2(H.y - a.y, H.x - a.x);
    e.setVelocity(Math.cos(ang) * v, Math.sin(ang) * v); e.setFlipX(Math.cos(ang) < 0);
    if (!(e.anims.currentAnim && /_walk/.test(e.anims.currentAnim.key))) anim(S, e, 'walk');
  };

  // ================================================================== 3. GARRA NEGRA, GRAN ESQUELETO (especiales)
  // (v3, nota del 22/11: "está desencajado del área donde impacta al caer") su animación de SALTO (PixelLab, ck_jefes_vistas.js)
  // se va corriendo para abajo en la hoja: cae con los pies 29 píxeles más abajo que en las demás, y queda debajo de la marca y
  // del quiebre del piso. Se arma una copia con cada cuadro subido hasta los pies de siempre (sin cortar las garras de arriba).
  const saltoDerecho = S => {
    const K = 'werebear_jefe_salto', N = K + '_c';
    if (S.anims.exists(N)) return true;
    const T = S.textures.exists(K) && S.textures.get(K), A = S.anims.get(K); if (!T || !A) return false;
    try {
      const fr = A.frames, hoja = document.createElement('canvas'); hoja.width = 100 * fr.length; hoja.height = 100;
      const g = hoja.getContext('2d', { willReadFrequently: true });
      // los pies de siempre: los del quieto
      const baja = (key, i) => { const f = S.textures.getFrame(key, i); if (!f) return null; const c = document.createElement('canvas'); c.width = 100; c.height = 100; const q = c.getContext('2d', { willReadFrequently: true }); q.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight); const d = q.getImageData(0, 0, 100, 100).data; let y0 = 100, y1 = -1; for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (d[(y * 100 + x) * 4 + 3] > 100) { if (y < y0) y0 = y; y1 = y; } return { c, y0, y1 }; };
      const q0 = baja('werebear_jefe_idle', 0), PIE = q0 && q0.y1 > 0 ? q0.y1 : 59;
      fr.forEach((f, i) => { const q = baja(f.textureKey, f.textureFrame); if (!q) return; const d = Math.max(0, Math.min(q.y1 - PIE, q.y0)); g.drawImage(q.c, i * 100, -d); });
      if (S.textures.exists(N)) S.textures.remove(N);
      S.textures.addSpriteSheet(N, hoja, { frameWidth: 100, frameHeight: 100 });
      S.anims.create({ key: N, frames: S.anims.generateFrameNumbers(N, { start: 0, end: fr.length - 1 }), frameRate: A.frameRate || 9, repeat: 0 });
      return true;
    } catch (er) { console.warn('[jefes pedidos] salto', er); return false; }
  };
  const ESPECIALES = {
    salto: (S, e) => {
      const AG = 520, VUELO = 850, h = piesH(S), a = pies(e);
      plantar(S, e, AG + VUELO + 700); e.setFlipX(h.x < a.x); e._ckEsp = S.time.now + AG + VUELO + 700;
      const F = FX(); if (F && F.anticipar) F.anticipar(S, e, AG); else anim(S, e, 'windup');
      canal(S, e, [220, 200, 170], AG, 40);
      son('beast_growl', 0.6, { rate: 0.8 });
      const dx = h.x - a.x, dy = h.y - a.y;
      S.time.delayedCall(AG, () => {
        if (!vivo(e)) return;
        if (F && F.sombraCaida) crea(S, () => F.sombraCaida(S, h.x, h.y, 46, VUELO));
        son('dash', 0.6, { rate: 0.7 });
        if (e.type === 'werebear_jefe') saltoDerecho(S);
        anim(S, e, 'salto_c', 'salto', 'attack1');
        const x0 = e.x, y0 = e.y, k = { t: 0 };
        if (e.body) e.body.checkCollision.none = true;
        S.tweens.add({ targets: k, t: 1, duration: VUELO, ease: 'Sine.easeInOut',
          onUpdate: () => { if (!vivo(e)) return; e.setPosition(x0 + dx * k.t, y0 + dy * k.t - Math.sin(k.t * Math.PI) * 70); e.setVelocity(0, 0); e.setDepth(h.y + 60); },
          onComplete: () => {
            if (e.body) e.body.checkCollision.none = false;
            if (!vivo(e)) return;
            e.setPosition(x0 + dx, y0 + dy);
            // (21/11) el quiebre del piso, centrado en sus pies de verdad
            const c = pies(e);
            S.cameras.main.shake(320, 0.013);
            son('ck_f_garra_cae', 0.9) || son('ck_pisoton_jefe', 0.85);
            fx(S, 'pfx_impacto', c.x, c.y, { escala: 0.8, prof: Math.round(c.y) - 6 });
            grieta(S, c.x, c.y, 56); escombros(S, c.x, c.y, 44, 14); ondas(S, 'tierra', c.x, c.y, 60, 450);
            if (elipse(S, c.x, c.y, 58)) S.damagePlayer(2);
            S.time.delayedCall(600, () => { if (vivo(e)) { e._ckEsp = 0; e.state = 'chase'; idle(S, e); } });
          } });
      });
    },
    zarpazo2: (S, e) => {
      const AV = 700, ENTRE = 380, n = 2;
      plantar(S, e, AV + n * ENTRE + 500); e._ckEsp = S.time.now + AV + n * ENTRE + 500; e.setFlipX(S.player.x < e.x);
      // se agacha y se carga (peso): el cuadro de carga sostenido, el contorno y la energía que llega
      if (!anim(S, e, 'windup')) { const F = FX(); if (F && F.anticipar) F.anticipar(S, e, AV); }
      sostener(S, e, 200);
      canal(S, e, [255, 120, 90], AV, 50); brillo(S, e, 0xff6a4a, AV);
      son('beast_growl', 0.6, { rate: 0.9 });
      for (let i = 0; i < n; i++) S.time.delayedCall(AV + i * ENTRE, () => {
        if (!vivo(e)) return;
        soltarAnim(e); e.setFlipX(S.player.x < e.x);
        anim(S, e, i % 2 ? 'attack2' : 'attack1');
        const a = pies(e), h = piesH(S), ang = Math.atan2(h.y - a.y, h.x - a.x);
        S.tweens.add({ targets: e, x: e.x + Math.cos(ang) * 30, y: e.y + Math.sin(ang) * 18, duration: 110, ease: 'Quad.easeOut' });
        son('ck_f_zarpazo', 0.7) || son('sword_swing2', 0.7, { rate: 0.7 });
        S.time.delayedCall(120, () => {
          if (!vivo(e)) return;
          const f = frente(e, 34);
          fx(S, 'garras', f.x, f.y - 26, { escala: 1.35, flip: e.flipX, tinte: 0xff8a70, prof: Math.round(f.y) + 30 });
          ondas(S, 'tierra', f.x, f.y, 44, 300); grieta(S, f.x, f.y, 24);
          // pesa: frena un instante al pegar
          try { e.anims.pause(); S.time.delayedCall(80, () => soltarAnim(e)); } catch (er) {}
          S.cameras.main.shake(140, 0.007);
          if (Math.hypot(f.x - piesH(S).x, f.y - piesH(S).y) < 56) S.damagePlayer(1);
        });
      });
      S.time.delayedCall(AV + n * ENTRE + 500, () => { if (vivo(e)) { e._ckEsp = 0; e.state = 'chase'; idle(S, e); } });
    },
    tierra: (S, e) => {
      const AV = 1100, RAD = 64, a = pies(e);
      plantar(S, e, AV + 800); e._ckEsp = S.time.now + AV + 800; e.setFlipX(S.player.x < e.x);
      if (anim(S, e, 'attack3', 'attack2')) sostener(S, e, 120, 1);
      canal(S, e, [235, 225, 200], AV, 46); brillo(S, e, 0xfff0d0, AV);
      const F = FX(); if (F && F.zona) crea(S, () => F.zona(S, a.x, a.y, RAD, 0xff3b2f, AV));
      son('ck_paso_armadura', 0.6, { rate: 0.8 }) || son('bone_hit', 0.5, { rate: 0.6 });
      S.time.delayedCall(AV, () => {
        if (!vivo(e)) return;
        soltarAnim(e);
        S.cameras.main.shake(300, 0.012);
        son('ck_f_esqueleto_golpe', 0.8) || son('ck_pisoton_jefe', 0.6, { rate: 1.15 });
        fx(S, 'pfx_impacto', a.x, a.y, { escala: 0.75, prof: Math.round(a.y) - 6 });
        grieta(S, a.x, a.y, RAD); escombros(S, a.x, a.y, RAD * 0.7, 16); ondas(S, 'tierra', a.x, a.y, RAD, 420);
        chispas(S, a.x, a.y - 6, [235, 225, 200], 18, 40);
        if (elipse(S, a.x, a.y, RAD)) S.damagePlayer(e.def.damage || e.def.dmg || 1);
        S.time.delayedCall(700, () => { if (vivo(e)) { e._ckEsp = 0; e.state = 'chase'; idle(S, e); } });
      });
    }
  };
  // a la mitad de la vida: ruge 2 s, te empuja, llama a los huargos y recién después ataca
  const rugido = (S, e) => {
    const MS = 2200;
    plantar(S, e, MS); e._ckEsp = S.time.now + MS;
    e.def = Object.assign({}, e.def, { cd: Math.round(e.def.cd * 0.6), speed: e.def.speed * 1.15 });
    anim(S, e, 'aullido', 'attack2'); sostener(S, e, 350);
    S.createFloatingText(e.x, e.y - 74, '¡GARRA NEGRA RUGE!', 0xfca5a5);
    son('beast_growl', 1, { rate: 0.55 }); S.time.delayedCall(700, () => son('beast_growl', 0.8, { rate: 0.5 }));
    brillo(S, e, 0xff5a4a, MS);
    const F = FX();
    for (let i = 0; i < 5; i++) S.time.delayedCall(i * 420, () => {
      if (!vivo(e)) return;
      if (F && F.ondaVoz) crea(S, () => { F.ondaVoz(S, e.x + (e.flipX ? -20 : 20), e.y - 20, e.flipX); F.ondaVoz(S, e.x + (e.flipX ? 20 : -20), e.y - 20, !e.flipX); });
      ondas(S, 'hielo', pies(e).x, pies(e).y, 70 + i * 12, 500); S.cameras.main.shake(260, 0.007);
    });
    S.time.delayedCall(900, () => { if (vivo(e) && S.player.body) { const a = Math.atan2(S.player.y - e.y, S.player.x - e.x); empujarH(S, a, 380, 300); } });
    S.time.delayedCall(1700, () => {
      if (!vivo(e) || typeof ENEMY_TYPES === 'undefined') return;
      const tipo = ENEMY_TYPES.warg ? 'warg' : 'werewolf';
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2, m = S.spawnEnemy(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 50, tipo);
        if (!m) continue;
        if (S.placeEnemyClear && !S.placeEnemyClear(m)) { m.destroy(); continue; }
        m.zone = e.zone; S.time.delayedCall(200 + i * 150, () => vivo(m) && S.alertEnemy && S.alertEnemy(m));
        ondas(S, 'tierra', m.x, m.y + 20, 22, 380);
      }
    });
    S.time.delayedCall(MS, () => { if (vivo(e)) { soltarAnim(e); e._ckEsp = 0; e.state = 'chase'; idle(S, e); e.setTint(0xff9a8a); S.time.delayedCall(1200, () => vivo(e) && e.clearTint()); } });
  };

  // ================================================================== 4. LOS DEMONIOS (ck_reino_criaturas.js)
  const libre = (S, e, ms) => S.time.delayedCall(ms, () => { if (!vivo(e)) return; soltarAnim(e); e.isAttacking = false; if (e.state === 'ckrc') e.state = 'chase'; idle(S, e); });
  const distSeg = (px, py, x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / L)); return Math.hypot(px - (x0 + vx * t), py - (y0 + vy * t)); };
  const RC = {
    // Orbath: se carga 1,6 s y dispara rayos largos para todos lados
    corona: (S, e) => {
      const CARGA = 1600, n = e.phase2 ? 12 : 8, LARGO = 380;
      e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
      if (anim(S, e, 'attack3', 'attack2')) sostener(S, e, 260);
      son('necro_cast', 0.7, { rate: 0.6 });
      const o = pies(e), c = { x: o.x, y: o.y - 30 * (e.scaleY / 2.6) - 26 };
      canal(S, e, [255, 110, 110], CARGA, 80); brillo(S, e, 0xff5a5a, CARGA + 200); luz(c.x, c.y, [255, 120, 120], 140, CARGA);
      // las líneas por donde van a salir, finitas, que se encienden de a poco
      const g = crea(S, () => S.add.graphics().setDepth(30000).setBlendMode(1)), giro = R(0, 6.28), t0 = S.time.now;
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        const t = (S.time.now - t0) / CARGA; if (t >= 1 || !g.active) { ev.remove(); return; }
        g.clear(); for (let k = 0; k < n; k++) { const a = giro + k / n * Math.PI * 2; g.lineStyle(1 + t * 1.5, 0xff6060, 0.15 + 0.35 * t); g.lineBetween(c.x, c.y, c.x + Math.cos(a) * LARGO * t, c.y + Math.sin(a) * LARGO * t * 0.62); }
        g.fillStyle(0xffd0d0, 0.3 + 0.5 * t); g.fillCircle(c.x, c.y, 4 + 10 * t);
      } });
      S.time.delayedCall(CARGA, () => {
        if (g.active) g.destroy();
        if (!vivo(e)) return;
        soltarAnim(e); son('fire_cast', 0.8, { rate: 0.6 }); son('thunder_strike', 0.5, { rate: 0.7 });
        S.cameras.main.shake(380, 0.011); S.cameras.main.flash(80, 255, 120, 120, true); luz(c.x, c.y, [255, 120, 120], 320, 500);
        const R2 = crea(S, () => S.add.graphics().setDepth(30000).setBlendMode(1)), t1 = S.time.now; let pego = false;
        const ev2 = S.time.addEvent({ delay: 16, loop: true, callback: () => {
          const t = (S.time.now - t1) / 520; if (t >= 1) { ev2.remove(); R2.destroy(); return; }
          R2.clear();
          for (let k = 0; k < n; k++) {
            const a = giro + k / n * Math.PI * 2, x1 = c.x + Math.cos(a) * LARGO, y1 = c.y + Math.sin(a) * LARGO * 0.62;
            [[14, 0xff3030, 0.35], [7, 0xff8a8a, 0.7], [3, 0xffffff, 0.95]].forEach(([w, col, al]) => { R2.lineStyle(w * (1 - t * 0.6), col, al * (1 - t)); R2.lineBetween(c.x, c.y, x1, y1); });
            if (Math.random() < 0.5) { const u = R(0.1, 1); chispas(S, c.x + (x1 - c.x) * u, c.y + (y1 - c.y) * u, [255, 150, 150], 1, 8, 30001); }
            const h = centroH(S);
            if (!pego && t < 0.6 && distSeg(h.x, h.y, c.x, c.y, x1, y1) < 13) { pego = true; pega(S, 1); }
          }
        } });
      });
      libre(S, e, CARGA + 1100);        // (y recarga un momento)
    },
    // Fauces y Taurax: la embestida de siempre; Fauces termina con un mordisco y Taurax, si te alcanza, te empuja lejos
    embestida: null,
    // Gromm: levanta el martillo y lo sostiene; al golpear, anillo de fuego y una onda hecha de llamas
    onda: (S, e) => {
      e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
      const ms = e.phase2 ? 950 : 1200, o = pies(e);
      if (anim(S, e, 'attack2', 'attack1')) sostener(S, e, 250);       // (el martillo en alto, antes del barrido dibujado en su hoja)
      canal(S, e, [255, 140, 60], ms, 60); brillo(S, e, 0xff7a2a, ms);
      son('ck_demonio_rugido', 0.7, { rate: 0.6 });
      S.time.delayedCall(ms, () => {
        if (!vivo(e)) return;
        soltarAnim(e);
        S.cameras.main.shake(420, 0.01); son('ck_pisoton_jefe', 0.9) || son('ck_derrumbe', 0.8);
        const f = frente(e, 26);
        fx(S, 'pfx_impacto', f.x, f.y, { escala: 0.7, prof: Math.round(f.y) - 6 });
        fx(S, 'pfx_anillo_fuego', o.x, o.y, { escala: 1.2, prof: Math.round(o.y) - 5 });
        grieta(S, f.x, f.y, 40); luz(o.x, o.y, [255, 130, 50], 220, 600);
        const anillos = e.phase2 ? 2 : 1;
        for (let k = 0; k < anillos; k++) S.time.delayedCall(k * 420, () => {
          const q = { r: 10 }; let pego = false;
          S.tweens.add({ targets: q, r: 230, duration: 1100, ease: 'Sine.easeOut', onUpdate: () => {
            const n = Math.round(6 + q.r / 20);
            crea(S, () => { for (let i = 0; i < n; i++) { if (Math.random() > 0.55) continue; const a = R(0, 6.28), x = o.x + Math.cos(a) * q.r, y = o.y + Math.sin(a) * q.r * 0.62, c = S.add.rectangle(x, y, R(2, 4), R(2, 5), [0xffb04a, 0xff6a1a, 0xffe08a, 0xff3a1a][Math.floor(R(0, 4))], 1).setBlendMode(1).setDepth(Math.round(y) + 8); S.tweens.add({ targets: c, y: y - R(6, 22), alpha: 0, duration: R(260, 520), onComplete: () => c.destroy() }); } });
            const p = piesH(S), d = Math.hypot(p.x - o.x, (p.y - o.y) / 0.62);
            if (!pego && !S.isDashing && !S.isDead && Math.abs(d - q.r) < 10) { pego = true; S.damagePlayer(1); }
          } });
        });
      });
      libre(S, e, ms + 800);
    },
    // Morvane: los pilares de fuego, sin los círculos del piso (avisan unas brasas)
    pilares: (S, e) => {
      e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
      const an = S.anims.exists(e.type + '_attack3') ? e.type + '_attack3' : e.type + '_attack1';
      const p = piesH(S), o = pies(e);
      e.setFlipX(p.x < o.x); e.play(an, true);
      son('sword_swing2', 0.7, { rate: 0.6 });
      const ang = Math.atan2(p.y - o.y, p.x - o.x), d = Math.min(Math.hypot(p.x - o.x, p.y - o.y) + 40, 320);
      const n = Math.max(3, Math.round(d / 52)), pts = [];
      for (let i = 1; i <= n; i++) pts.push([o.x + Math.cos(ang) * (d * i / n), o.y + Math.sin(ang) * (d * i / n)]);
      if (e.phase2) pts.push([p.x + R(-50, 50), p.y + R(-30, 30)], [p.x + R(-50, 50), p.y + R(-30, 30)]);
      pts.forEach(([x, y], i) => {
        const t0 = 380 + i * 150;
        S.time.delayedCall(t0 - 380, () => { for (let k = 0; k < 4; k++) S.time.delayedCall(k * 90, () => chispas(S, x + R(-8, 8), y, [255, 120, 50], 3, 10, Math.round(y) + 4)); });
        S.time.delayedCall(t0, () => {
          if (!vivo(e)) return;
          if (S.anims.exists('ckrc_pilar')) crea(S, () => {
            const pl = S.add.sprite(x, y + 4, 'ckrc_pilar', 0).setOrigin(0.5, 0.6).setScale(1.1).setDepth(y + 3);
            pl.play('ckrc_pilar'); pl.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pl.destroy());
            S.time.delayedCall(900, () => pl.active && pl.destroy());
          }); else chispas(S, x, y, [255, 80, 40], 14, 40);
          son('fire_hit', 0.45, { rate: R(0.7, 0.9), minGap: 60 }) || son('fire_cast', 0.4);
          luz(x, y - 10, [255, 90, 40], 60, 600);
          const h = piesH(S); if (!S.isDashing && !S.isDead && Math.hypot((h.x - x) / 22, (h.y - y) / 14) <= 1) S.damagePlayer(1);
        });
      });
      libre(S, e, 380 + pts.length * 150 + 400);
    }
  };
  // el mordisco del final de la embestida de Fauces: la boca que se abre y se cierra, y los colmillos
  const texColm = S => {
    if (S.textures.exists('ckj_colm_a')) return;
    const mk = (k, abajo) => { const t = S.textures.createCanvas(k, 20, 8), g = t.getContext(), p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      p('#1b0f0a', 0, abajo ? 5 : 0, 20, 3); for (let i = 0; i < 5; i++) { p('#1b0f0a', 1 + i * 4, abajo ? 0 : 2, 4, 6); p('#fff2e0', 2 + i * 4, abajo ? 1 + (i % 2) : 2, 2, 4 - (i % 2)); } p('#a01818', 0, abajo ? 6 : 0, 20, 2); t.refresh(); };
    mk('ckj_colm_a', false); mk('ckj_colm_b', true);
  };
  const mordisco = (S, e) => {
    texColm(S); e.setFlipX(S.player.x < e.x);
    if (anim(S, e, 'attack1')) sostener(S, e, 260, 3);
    son('ck_f_mordisco', 0.8) || son('beast_growl', 0.7, { rate: 1.2 });
    const f = frente(e, 30 * (e.scaleX / 2.1) + 14), y = f.y - 18;
    crea(S, () => {
      const a = S.add.image(f.x, y - 12, 'ckj_colm_a').setScale(1.5).setDepth(30001).setFlipX(e.flipX), b = S.add.image(f.x, y + 12, 'ckj_colm_b').setScale(1.5).setDepth(30001).setFlipX(e.flipX);
      S.tweens.add({ targets: a, y: y - 3, duration: 110, delay: 150, ease: 'Quad.easeIn' }); S.tweens.add({ targets: b, y: y + 3, duration: 110, delay: 150, ease: 'Quad.easeIn' });
      S.tweens.add({ targets: [a, b], alpha: 0, delay: 420, duration: 200, onComplete: () => { a.destroy(); b.destroy(); } });
    });
    S.time.delayedCall(260, () => {
      soltarAnim(e); S.cameras.main.shake(100, 0.005);
      if (Math.hypot(f.x - piesH(S).x, f.y - piesH(S).y) < 44) fx(S, 'sangre', f.x, y, { escala: 1 });
    });
  };
  // Fauces se divide: perros más chicos que se desprenden; cada uno, al morir, en dos más chicos
  const PERRO = [null, { esc: 1.55, hp: 6, dmg: 1, vel: 130 }, { esc: 1.05, hp: 2, dmg: 1, vel: 150 }];
  const desprender = (S, de, gen, n) => {
    if (typeof ENEMY_TYPES === 'undefined' || !ENEMY_TYPES.demonio_sabueso) return;
    const D = PERRO[gen];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, pv = S._ckPermitirBestias; S._ckPermitirBestias = true;
      const m = S.spawnEnemy(de.x + Math.cos(a) * 26, de.y + Math.sin(a) * 18, 'demonio_sabueso'); S._ckPermitirBestias = pv;
      if (!m) continue;
      m._ckFauces = gen; m.hp = m.maxHp = D.hp; m.def = Object.assign({}, m.def, { dmg: D.dmg, speed: D.vel });
      const b = ENEMY_TYPES.demonio_sabueso.scale || 1.2; m.setScale(D.esc * (b / 1.2) * (m.scaleX / b));
      m.zone = de.zone; m.setTint(0xffb0a0); S.time.delayedCall(300, () => vivo(m) && m.clearTint());
      S.time.delayedCall(120, () => vivo(m) && S.alertEnemy && S.alertEnemy(m));
      crea(S, () => { const V = VX(); if (V) V.fx(S, 'humo', m.x, m.y + 6, { escala: 0.7, tinte: 0xff7060 }); });
      chispas(S, m.x, m.y - 4, [255, 90, 60], 10, 22);
    }
    son('beast_growl', 0.7, { rate: 1.3 });
  };

  // ================================================================== 4b. ANIMACIONES DE PIXELLAB (ck_jefes_anims_arte.js)
  // (v2) Taurax: se alza y pisa (pis_sube: hasta arriba; pis_baja: pisa y vuelve). Kragmor: agarra la roca y la tira (sus
  // cuadros son más altos, 100x130: el pivote queda en los pies y su cuerpo se corre lo mismo mientras dura, ver ck_coliseo.js).
  const ARTE = () => window.CK_JEFES_ANIMS_ARTE || {};
  const HOJAS = { taurax_pisoton: 'ckj_taurax_pisoton', kragmor_tiro: 'ckj_kragmor_tiro' };
  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    try { const A = ARTE(); Object.keys(HOJAS).forEach(k => { const a = A[k]; if (a && a.png && !this.textures.exists(HOJAS[k])) this.load.spritesheet(HOJAS[k], a.png, { frameWidth: a.fw, frameHeight: a.fh }); }); } catch (er) { console.warn('[jefes pedidos] hojas', er); }
  };
  const animsJefes = S => {
    if (S._ckJefAnims) return true;
    const A = ARTE(), T = HOJAS; let faltan = 0;
    // (si la escena ya había cargado cuando se sumó este archivo, las hojas se arman acá, desde su base64)
    Object.keys(T).forEach(k => { const a = A[k]; if (!a || !a.png || S.textures.exists(T[k]) || (S._ckJefPidio || {})[k]) return; (S._ckJefPidio = S._ckJefPidio || {})[k] = 1; const im = new Image(); im.onload = () => { try { if (!S.textures.exists(T[k])) S.textures.addSpriteSheet(T[k], im, { frameWidth: a.fw, frameHeight: a.fh }); } catch (er) {} }; im.src = a.png; });
    const hacer = (key, tx, fr, fps) => { if (S.anims.exists(key)) return; if (!S.textures.exists(tx)) { faltan++; return; } S.anims.create({ key, frames: S.anims.generateFrameNumbers(tx, { frames: fr }), frameRate: fps, repeat: 0 }); };
    if (A.taurax_pisoton) { hacer('demonio_j_minotauro_pis_sube', T.taurax_pisoton, [0, 1, 2], 9); hacer('demonio_j_minotauro_pis_baja', T.taurax_pisoton, [3, 4, 5, 6, 7, 8], 12); }
    if (A.kragmor_tiro) {
      hacer('bestia_kragmor_tiro', T.kragmor_tiro, [0, 1, 2, 3, 4, 5, 6, 7, 8], 10);
      if (S.textures.exists(T.kragmor_tiro)) { const tx = S.textures.get(T.kragmor_tiro), pv = A.kragmor_tiro.piv; tx.getFrameNames().forEach(n => { const f = tx.get(n); f.customPivot = true; f.pivotX = pv[0]; f.pivotY = pv[1]; }); }
    }
    if (!faltan) S._ckJefAnims = true;
    return S._ckJefAnims;
  };

  // ================================================================== 5. ENGANCHAR
  let listo = false;
  const enganchar = () => {
    const E = window.CK_ESPECIALES, RCx = window.CK_REINO_CRIATURAS;
    if (listo || !E || !E.HACER || !FX()) return;
    listo = true;
    ponerGolpes();
    Object.keys(ESPECIALES).forEach(k => { if (E.HACER[k]) { const f0 = E.HACER[k]; E.HACER[k] = function (S, e) { try { if (e && (e.type === 'werebear_jefe' || e.type === 'skeleton_great')) return ESPECIALES[k](S, e); } catch (er) { console.warn('[jefes pedidos]', k, er); } return f0.apply(this, arguments); }; } });
    if (RCx && RCx.ESP) {
      const emb0 = RCx.ESP.embestida;
      RC.embestida = (S, e) => { const r = emb0(S, e); if (r !== false) e._ckEmbPed = { tipo: e.type }; return r; };
      Object.keys(RC).forEach(k => { if (RC[k] && RCx.ESP[k]) RCx.ESP[k] = RC[k]; });
      if (RCx.JEFES && RCx.JEFES.demonio_j_sabueso) RCx.JEFES.demonio_j_sabueso.summon = null;
    }
    if (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.demonio_j_sabueso) ENEMY_TYPES.demonio_j_sabueso.summon = null;
  };
  // el daño: Garra Negra ruge a la mitad (antes que ck_jefes_fases.js), Fauces se divide
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const r = de0.apply(this, arguments);
    try {
      const e = enemy, S = this; if (!e) return r;
      if (e.type === 'werebear_jefe' && e._ckFases && !e._ckFases.enojo && !e.isDead && e.hp / e.maxHp <= 0.5) { e._ckFases.enojo = true; rugido(S, e); }
      if (e.type === 'demonio_j_sabueso' && !e._ckFauces) {
        e._ckDiv = e._ckDiv || 0;
        const fr = e.hp / e.maxHp, toca = fr <= 0.33 ? 2 : fr <= 0.66 ? 1 : 0;
        while (e._ckDiv < toca) { e._ckDiv++; desprender(S, e, 1, 1); S.createFloatingText(e.x, e.y - 60, '¡SE DIVIDE!', 0xff9a7a); }
      }
      if (e._ckFauces === 1 && e.isDead && !e._ckPartido) { e._ckPartido = true; desprender(S, e, 2, 2); }
    } catch (er) {}
    return r;
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      if (!listo) enganchar();
      const S = this, now = S.time.now, p = S.player;
      if (!S._ckJefAnims) animsJefes(S);
      // el héroe empujado
      const EJ = S._ckEmpJ; if (EJ && p && p.body) { const t = now - EJ.t0; if (t > EJ.ms) S._ckEmpJ = null; else { const k = 1 - t / EJ.ms; p.body.setVelocity(EJ.vx * k, EJ.vy * k); } }
      if (!S.enemies || !p) return r;
      S.enemies.getChildren().forEach(e => {
        if (!vivo(e)) return;
        // Grushak: su pisotón ahora es el hacha
        if (e.type === 'orc_warlord' && e._ckFases && e._ckFases.pisoton) {
          e._ckPisoAt = 1e15;
          if (e._ckHacha) { if (e.state === 'ck_busca') buscar(S, e, now); }
          else if (now > (e._ckHachaAt || 0) && e.state === 'chase' && !e.isAttacking) {
            const d = Math.hypot(piesH(S).x - pies(e).x, piesH(S).y - pies(e).y);
            if (d > 50 && d < 300) { e._ckHachaAt = now + GR.cada; hacha(S, e); }
          }
        }
        // la embestida de Fauces y Taurax
        const EB = e._ckEmbPed;
        if (EB) {
          // (fuera del reino, en las pruebas, nadie mira si la embestida te alcanza: se mira acá, con la misma cuenta que el reino)
          if (e._rcCarga && !e._rcCarga.pego) { const h = piesH(S), o = pies(e); if (Math.hypot(h.x - o.x, (h.y - o.y) * 1.4) < 16 + 12 * e.scaleX) { e._rcCarga.pego = true; pega(S, (e.def && e.def.dmg) || 2); } }
          if (e._rcCarga) { EB.vio = true; if (e._rcCarga.pego && !EB.empujo && e.type === 'demonio_j_minotauro') { EB.empujo = true; empujarH(S, e._rcCarga.ang, 480, 380); son('ck_f_impacto', 0.7) || son('bone_hit', 0.7, { rate: 0.6 }); } }
          else if (EB.vio) { e._ckEmbPed = null; if (e.type === 'demonio_j_sabueso') mordisco(S, e); }
        }
      });
    } catch (er) {}
    return r;
  };
  window.CK_JEFES_PEDIDOS = { GOLPE, ANTICIPA, GR, hacha, sinHacha, ESPECIALES, rugido, RC, mordisco, desprender, animsJefes };
})();
