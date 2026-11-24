'use strict';
/* Las habilidades de los héroes como las pidió el dueño en el editor (21/11, notas del archivo ajustes_habilidades.json; ver
   D:\Editor\PEDIDOS_HABILIDADES.md). Pixelfx (CK_VFX.fx, CK_ONDAS) y código; las animaciones nuevas de Urso y Lancent son de
   PixelLab (ck_heroes_anims_arte.js). Cada habilidad envuelve a la del juego (o la reemplaza) sin tocar su archivo:
   LANCENT
   - Grito de guerra: canaliza 1 s (partículas doradas que llegan a su figura), estallan alrededor (empuja como antes) y queda
     5 s con un contorno dorado (rimlight). Sin las rayas verticales del estado (st_mejora).
   - Salto aplastante: 1 s de anticipación (se agacha, junta polvo) y al caer empuja a los de alrededor.
   - Onda de acero: se carga manteniendo la tecla, hasta 2 s: cuanto más, más grande, más rápida y más lejos llega (y pega más).
   - Golpe de escudo: embiste con el hombro (animación de PixelLab y un envión adelante); aturde 2 s como antes.
   HOROS (además de ck_horos_baculo.js)
   - Misiles arcanos: se cargan manteniendo la tecla (uno más cada 0,4 s, hasta 6; cada uno extra gasta 8 de maná); vuelan
     con el efecto de pixelfx y dejan una estela de partículas que flotan.
   - Drenaje vital: le succiona partículas verdes a la bestia hasta el báculo y lo cura (sin las líneas).
   - Meteoro: cae casi derecho, más grande, con estela de fuego; al golpear deja un cráter, una onda de fuego con partículas y
     brasas. Sin la onda violeta.
   URSO
   - Pisotón: 1 s de anticipación (se alza, animación de PixelLab), golpe, grietas y empuja alrededor.
   - Mordisco: animación de mordisco (PixelLab), colmillos que se cierran sobre la bestia y la deja sangrando.
   - Remolino de garras: sin el torbellino; gira (se da vuelta rápido) y salen zarpazos alrededor.
   - Desgarro: abrazo de oso de 1,5 s (PixelLab): la agarra, la estruja (3 de daño en tres apretones), la suelta lejos.
   - Avalancha: 1 s de anticipación; los picos y las rocas salen cuando golpea el piso.
   - Espíritu del bosque: ruge (PixelLab), canaliza partículas verdes y queda 5 s con contorno verde: más rápido, +1 de daño y
     la mitad del daño recibido. Cura 2 en 4 s como antes. Sin el aura animada del estado (st_bosque).
   v2 (21/11, "que las habilidades se casteen bien en las direcciones que se usen, la dirección y animación acorde"):
   - Urso: el pisotón y la avalancha de frente y de espaldas con su golpe al piso de esas direcciones (attack3_front/back
     sostenido: DIR_EXTRA); antes se quedaba quieto mirando para arriba o abajo.
   - Lancent: el golpe de escudo de frente y de espaldas es el envión (dash) de esa dirección, no la estocada; la carga de la
     onda se junta en la punta de la espada según hacia dónde mira.
   - Aby: el relámpago cruza con su tajo hacia donde mira (antes cruzaba quieta).
   v3 (21/11): con el espíritu del bosque Urso se agranda un poco (×1,2, ESP_GRANDE) mientras dura y al terminar vuelve a su tamaño.
   v4 (22/11, notas de ajustes_habilidades (2).json):
   - Lancent, lluvia de flechas: 1 s de anticipación apuntando arriba; la flecha sube con partículas, se divide y caen varias al
     azar alrededor de él (LL). Sin el sello del piso.
   - Horos, anillo de llamas: las llamas son de pixelfx (pfx_anillo_fuego y pfx_llama, ANI) en vez de los dibujos.
   - Horos, trueno: carga hasta 2 s (TR), aura de chispas eléctricas con onda que se cierra; rayos de pixelfx limpios (sin el
     halo redondo) y, al máximo, una onda de mini rayos en el piso que se agranda y se apaga.
   - Urso, mordisco: colmillos de oso solos, sin encías (DIENTES).
   - Urso, remolino de garras: 1 s de anticipación (REM) y los zarpazos salen derechos, siguiendo el giro.
   - Horos, meteoro: el cráter es el de pixelfx de ck_grietas.js (si está).
   Lo que dibuja este archivo lo lee el editor de habilidades (S._ckPedCrea), y DEMORA le dice cuándo arrancan las capas
   editables de las que ahora tienen anticipación. Borrar sus líneas de index.html (y la de ck_heroes_anims_arte.js) lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype, ARTE = window.CK_HEROES_ANIMS_ARTE || {};
  const HB = () => window.CK_HABILIDADES, EQ = () => window.CK_EQUIPO, EP = () => window.CK_EPICO || {}, VX = () => window.CK_VFX;
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const luz = (x, y, c, r, ms, curva) => { try { window.CK_LUZ && window.CK_LUZ.agregar({ x, y, c, r, f: 1, ms, curva: curva || 'cae' }); } catch (e) {} };
  // todo lo que se dibuja acá pasa por crea(): el editor lo lee como parte de la habilidad
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };
  const fx = (S, k, x, y, o) => {
    const V = VX(); if (!V || !V.fx) return null; o = o || {};
    if (o.sigue) { x = o.sigue.x + (o.dx || 0); y = o.sigue.y + (o.dy || 0); }      // (nace ya donde va: el editor lo encuentra)
    return crea(S, () => V.fx(S, k, x, y, o));
  };
  const onda = (S, t, x, y, r, ms) => { try { window.CK_ONDAS && crea(S, () => CK_ONDAS.estallido(S, t, x, y, r, ms)); } catch (e) {} };
  const dir = S => { const H = HB(); return H && H.dirV ? H.dirV(S) : [S.facingDirection === 'left' ? -1 : 1, 0]; };
  const pie = o => (o.body ? { x: o.body.center.x, y: o.body.bottom } : { x: o.x, y: o.y + 12 });
  const cerca = (S, x, y, r) => { const E = EQ(); if (E && E.cerca) return E.cerca(S, x, y, r); return S.enemies.getChildren().filter(e => vivo(e) && Phaser.Math.Distance.Between(x, y, e.x, e.y) < r); };
  const pegar = (S, e, n, x, y, f) => { const E = EQ(); if (E && E.pegar) return E.pegar(S, e, n, x, y, f); const fa = S._ckFuente; S._ckFuente = f; S.damageEnemy(e, n, x, y); S._ckFuente = fa; };
  const esJefe = e => !!(e && ((e.def && e.def.boss) || (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[e.type] && ENEMY_TYPES[e.type].boss)));
  // empujar de verdad: la velocidad se sostiene unos cuadros (la IA de las bestias la pisa cada cuadro, y el aturdido la frena)
  const empuje = (S, e, a, v, ms) => {
    if (!e || !e.body) return; if (esJefe(e)) v *= 0.25;
    const t0 = S.time.now, cx = Math.cos(a), cy = Math.sin(a);
    const f = () => { const t = S.time.now - t0; if (t > ms || !e.active || e.isDead || !e.body) { S.events.off('postupdate', f); return; } const k = 1 - t / ms; e.body.setVelocity(cx * v * k, cy * v * k); };
    S.events.on('postupdate', f);
  };
  const empujar = (S, x, y, r, v) => cerca(S, x, y, r).forEach(e => empuje(S, e, Math.atan2(e.y - y, e.x - x), v, 260));
  const curar = (S, n, txt) => { if (S.health < S.maxHealth) { S.health = Math.min(S.maxHealth, S.health + n); S.updateHUD && S.updateHUD(); S.createFloatingText(S.player.x, S.player.y - 40, txt || '+' + n + ' VIDA', 0x22c55e); } };
  const idle = S => { try { const k = S.heroAnim ? S.heroAnim(S.playerHero + '_idle') : S.playerHero + '_idle'; if (S.anims.exists(k)) S.player.play(k, true); } catch (e) {} };
  // quieto mientras dura (como el bloqueo que pone el juego cuando una habilidad devuelve ms)
  const quieto = (S, ms, alFin) => {
    S.isAttacking = true; S.player.setVelocity(0, 0);
    const m = S._ckQuietoN = (S._ckQuietoN || 0) + 1;
    S.time.delayedCall(ms, () => { if (S._ckQuietoN !== m) return; S.isAttacking = false; if (alFin && !S.isDead && S.player.active) idle(S); });
  };
  // la habilidad del juego sin su "después" de ck_vfx.js (sus capas editables): se lo llama aparte, cuando corresponde
  const sinDesp = (id, fn) => { const V = VX(), D = V && V.DESPUES; if (!D || !D[id]) return fn(); const d0 = D[id]; D[id] = () => {}; try { return fn(); } finally { D[id] = d0; } };
  const desp = (S, id) => { try { const D = VX() && VX().DESPUES; if (D && D[id] && S.player) D[id](S); } catch (e) { console.warn('[héroes] después', id, e); } };
  // cuánto después del comienzo corren las capas editables (el editor las dibuja corridas eso)
  const DEMORA = { grito: 1000, salto: 1000, golpe_escudo: 150, pisoton: 660, avalancha: 770, b_remolino: 1000 };

  // ------------------------------------------------------------------ las animaciones nuevas (PixelLab)
  const ANIMS = { bear_mordisco: [14, 'bear_attack_mordisco'], bear_pisoton: [10, 'bear_attack_pisoton'], bear_rugido: [10, 'bear_attack_rugido'], bear_abrazo: [9, 'bear_attack_abrazo'], soldier_hombro: [16, 'soldier_attack_hombro'] };
  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    try { Object.keys(ANIMS).forEach(k => { const a = ARTE[k], key = ANIMS[k][1]; if (a && a.png && !this.textures.exists(key)) this.load.spritesheet(key, a.png, { frameWidth: 100, frameHeight: 100 }); }); } catch (e) { console.warn('[héroes]', e); }
  };
  // (los nombres empiezan con <héroe>_attack: así el juego no los pisa con el quieto)
  const EXTRA = {
    bear_attack_pisoton_lento: ['bear_attack_pisoton', [0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 7, 8], 12],      // se alza ~0,9 s y pisa
    bear_attack_rugido_largo: ['bear_attack_rugido', [0, 1, 2, 3, 3, 4, 4, 5, 5, 4, 4, 5, 6, 7, 8], 12],
    bear_attack3_ava: ['bear_attack3', [0, 1, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 6, 7, 8], 14],                // golpea el piso a 1 s
    bear_attack2_carga: ['bear_attack2', [0, 1, 2].concat(Array(15).fill(3)), 18],                             // (v4) el remolino: 1 s con la garra atrás
    soldier_attack_lluvia_carga: ['soldier_arrowrain', [0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5], 12],             // (v4) la lluvia: 1 s apuntando arriba
    soldier_attack_lluvia_tiro: ['soldier_arrowrain', [6, 7, 8], 12]
  };
  const SOST = n => Array(n).fill(2);
  const DIR_EXTRA = {
    bear_attack3_front_pis: ['bear_attack3_front', [0, 1].concat(SOST(9), [3, 4, 5, 6, 7]), 12],          // pisa a los ~920 ms
    bear_attack3_back_pis: ['bear_attack3_back', [0, 1].concat(SOST(9), [3, 4, 5, 6, 7]), 12],
    bear_attack3_front_ava: ['bear_attack3_front', [0, 1].concat(SOST(10), [3, 4, 5, 6, 7]), 12],         // golpea el piso a 1 s
    bear_attack3_back_ava: ['bear_attack3_back', [0, 1].concat(SOST(10), [3, 4, 5, 6, 7]), 12],
    bear_attack2_front_carga: ['bear_attack2_front', [0].concat(Array(11).fill(1)), 12],                         // (v4) el remolino de frente y de espaldas
    bear_attack2_back_carga: ['bear_attack2_back', [0].concat(Array(11).fill(1)), 12]
  };
  const registrar = S => {
    if (S._ckPedAnims) return;
    let faltan = 0;
    Object.keys(ANIMS).forEach(k => {
      const [fps, key] = ANIMS[k]; if (S.anims.exists(key)) return; if (!S.textures.exists(key)) { faltan++; return; }
      S.anims.create({ key, frames: S.anims.generateFrameNumbers(key, { start: 0, end: S.textures.get(key).frameTotal - 2 }), frameRate: fps, repeat: 0 });
    });
    Object.keys(EXTRA).forEach(key => {
      const [tx, fr, fps] = EXTRA[key]; if (S.anims.exists(key)) return; if (!S.textures.exists(tx)) { faltan++; return; }
      const n = S.textures.get(tx).frameTotal - 1;
      S.anims.create({ key, frames: S.anims.generateFrameNumbers(tx, { frames: fr.map(i => Math.min(i, n - 1)) }), frameRate: fps, repeat: 0 });
    });
    // (v2) de frente y de espaldas (21/11, "que las habilidades se casteen bien en la dirección que se usen"): el pisotón y la
    // avalancha de Urso con su golpe al piso de frente y de espaldas (attack3_front/back: levanta los brazos, los sostiene y golpea)
    Object.keys(DIR_EXTRA).forEach(key => {
      const [base, fr, fps] = DIR_EXTRA[key]; if (S.anims.exists(key)) return; const A = S.anims.get(base); if (!A) { faltan++; return; }
      S.anims.create({ key, frames: fr.map(i => { const f = A.frames[Math.min(i, A.frames.length - 1)]; return { key: f.textureKey, frame: f.textureFrame }; }), frameRate: fps, repeat: 0 });
    });
    if (!faltan) S._ckPedAnims = true;
  };
  // mientras dura una animación propia, el código de la habilidad no la pisa con otra
  const fijar = (S, key, ms) => {
    const p = S.player; if (!p || !S.anims.exists(key)) return false;
    if (!p._ckPedPlay) { p._ckPedPlay = true; const play0 = p.play; p.play = function (k) { if (S._ckAnimFija > S.time.now && (typeof k === 'string' ? k : k && k.key) !== S._ckAnimKey) return this; return play0.apply(this, arguments); }; }
    S._ckAnimKey = key; S._ckAnimFija = S.time.now + ms; p.play(key, false); return true;
  };
  const soltarAnim = S => { S._ckAnimFija = 0; };
  const animDe = (S, k) => (S.heroAnim ? S.heroAnim(k) : k);

  // ------------------------------------------------------------------ efectos de código
  const color = c => Phaser.Display.Color.GetColor(...c.map(v => Math.max(0, Math.min(255, Math.round(v)))));
  // partículas que llegan a un punto (canalizar) o salen de él (estallar)
  const canalizar = (S, o, col, ms, r, cada) => {
    const t0 = S.time.now, ev = S.time.addEvent({ delay: 45, loop: true, callback: () => {
      if (S.time.now - t0 > ms || !o.active) { ev.remove(); return; }
      crea(S, () => { for (let i = 0; i < (cada || 3); i++) {
        const a = R(0, 6.28), d = R(r * 0.7, r), q = S.add.rectangle(o.x + Math.cos(a) * d, o.y - 6 + Math.sin(a) * d * 0.7, 2, 2, color(col.map(c => c + R(-20, 40))), 1).setBlendMode(1).setDepth(o.depth + 2).setAlpha(0);
        S.tweens.add({ targets: q, x: o.x + R(-3, 3), y: o.y - 8 + R(-3, 3), alpha: { from: 0, to: 1 }, duration: R(280, 420), ease: 'Quad.easeIn', onComplete: () => q.destroy() });
      } });
    } });
  };
  const estallar = (S, x, y, col, n, r, prof) => crea(S, () => {
    for (let i = 0; i < n; i++) {
      const a = R(0, 6.28), d = R(r * 0.5, r), s = R(1.5, 3), q = S.add.rectangle(x, y, s, s, color(col.map(c => c + R(-30, 50))), 1).setBlendMode(1).setDepth(prof || 30000);
      S.tweens.add({ targets: q, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7 - R(0, 10), alpha: 0, duration: R(350, 650), ease: 'Quad.easeOut', onComplete: () => q.destroy() });
    }
  });
  // polvo que se junta en el piso (para las anticipaciones)
  const polvo = (S, p, col, ms, r) => canalizar(S, { get x() { return pie(p).x; }, get y() { return pie(p).y + 6; }, get depth() { return p.depth - 4; }, get active() { return p.active; } }, col, ms, r, 2);
  // el contorno de luz (rimlight) que sigue al dibujo del personaje: de cada cuadro de su hoja se arma (una vez) un dibujo con
  // la luz en el borde de la figura (sin la sombra del piso, que es semitransparente): el borde de adentro aclarado, un píxel
  // de color afuera y otro más tenue. Va pegado a él, con su animación, y late mientras dura.
  const RIM = {};
  const rimTex = (S, o, col) => {
    const fr = o.frame, key = 'ckrim_' + col.toString(16) + '_' + o.texture.key + '_' + fr.name;
    if (RIM[key] || S.textures.exists(key)) return key;
    const w = fr.cutWidth, h = fr.cutHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(fr.source.image, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, M = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] > 200 ? 1 : 0;               // la figura (la sombra no llega)
    const en = (x, y) => x >= 0 && y >= 0 && x < w && y < h && M[y * w + x] === 1;
    const out = g.createImageData(w, h), q = out.data, r = (col >> 16) & 255, gg = (col >> 8) & 255, b = col & 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; let a = 0;
      if (M[i]) { if (!en(x - 1, y) || !en(x + 1, y) || !en(x, y - 1) || !en(x, y + 1)) a = 105; }            // el borde de adentro
      else if (en(x - 1, y) || en(x + 1, y) || en(x, y - 1) || en(x, y + 1)) a = 235;                           // un píxel afuera
      else if (en(x - 2, y) || en(x + 2, y) || en(x, y - 2) || en(x, y + 2) || en(x - 1, y - 1) || en(x + 1, y - 1) || en(x - 1, y + 1) || en(x + 1, y + 1)) a = 80;
      if (a) { q[i * 4] = r; q[i * 4 + 1] = gg; q[i * 4 + 2] = b; q[i * 4 + 3] = a; }
    }
    g.putImageData(out, 0, 0);
    S.textures.addCanvas(key, c); RIM[key] = 1;
    return key;
  };
  const contorno = (S, o, col, ms) => {
    if (!o || !o.texture) return;
    if (o._ckRimFin) o._ckRimFin();
    const t0 = S.time.now;
    let L = [], fin = 0;
    try { L = crea(S, () => [S.add.image(o.x, o.y, rimTex(S, o, col)), S.add.image(o.x, o.y, rimTex(S, o, col)).setBlendMode(1)]); } catch (e) { console.warn('[héroes] contorno', e); return; }
    const upd = () => {
      const t = S.time.now - t0;
      if (!o.active || !L[0].active || (fin && S.time.now > fin)) { S.events.off('postupdate', upd); L.forEach(s => s.active && s.destroy()); if (o._ckRimFin === cortar) o._ckRimFin = null; return; }
      const late = 0.78 + Math.sin(t / 150) * 0.22, apaga = fin ? Math.max(0, (fin - S.time.now) / 300) : Math.min(1, t / 200);
      let k = null; try { k = rimTex(S, o, col); } catch (e) {}
      L.forEach((s, i) => { if (k) s.setTexture(k); s.setOrigin(o.originX, o.originY).setFlipX(o.flipX).setVisible(o.visible).setPosition(o.x, o.y).setScale(o.scaleX, o.scaleY).setAlpha(late * apaga * (i ? 0.55 : 1)).setDepth(o.depth + 0.1 + i * 0.01); });   // (el segundo suma luz: brilla)
    };
    const cortar = () => { if (!fin) fin = S.time.now + 300; };
    o._ckRimFin = cortar;
    S.events.on('postupdate', upd); upd();
    S.time.delayedCall(ms, cortar);
  };
  // la tecla donde está puesta una habilidad (para cargarla manteniendo)
  const tecla = (S, id) => { try { const F = S._ckCargaPrueba; if (F && F.id === id) return F.k;       // (v2: el panel de pruebas la "mantiene")
    const i = EQ().ranuras(S).indexOf(id); return i >= 0 && S._ckRanTeclas ? S._ckRanTeclas[i] : null; } catch (e) { return null; } };
  const tex = (S, k, w, h, pinta) => { if (S.textures.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d')); S.textures.addCanvas(k, c); };
  const texturas = S => {
    // (v4, nota del 22/11: "que estos dientes se vean como colmillos de oso, y sólo los dientes sin las encías") dos colmillos
    // largos y tres dientes chicos en el medio, color hueso con su borde; la fila de abajo, al revés
    const DIENTES = ['ohaaso.ohsohsohso.ohaaso', 'ohaaso.ohsohsohso.ohaaso', 'ohaaso.ohsohsohso.ohaaso', 'ohaaso.ohsohsohso.ohaaso', 'ohaaso.ohoohsoho..ohaaso', '.ohaso.oho.ohoho...ohaso', '.ohaso..o..ohoo....ohaso', '.ohaso......o......ohaso', '.ohso..............ohso.', '.ohso..............ohso.', '.oho...............oho..', '.oho...............oho..', '..o.................o...'];
    const COL = { o: '#2a1a12', a: '#efe4cc', h: '#fffdf6', s: '#c4ad86' };
    const fila = (g, abajo) => DIENTES.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = COL[r[x]]; if (c) { g.fillStyle = c; g.fillRect(x, abajo ? DIENTES.length - 1 - y : y, 1, 1); } } });
    tex(S, 'ckh_colmillo_arr', 24, 13, g => fila(g, false));
    tex(S, 'ckh_colmillo_aba', 24, 13, g => fila(g, true));
    tex(S, 'ckh_colm_arr', 18, 8, g => { g.fillStyle = '#1b0f0a'; g.fillRect(0, 0, 18, 3); for (let i = 0; i < 5; i++) { g.fillStyle = '#1b0f0a'; g.fillRect(1 + i * 3.4, 2, 4, 6); g.fillStyle = '#fff8ec'; g.fillRect(2 + i * 3.4, 2, 2, 4 - (i % 2)); } g.fillStyle = '#c0303a'; g.fillRect(0, 0, 18, 2); });
    tex(S, 'ckh_colm_aba', 18, 8, g => { g.fillStyle = '#1b0f0a'; g.fillRect(0, 5, 18, 3); for (let i = 0; i < 5; i++) { g.fillStyle = '#1b0f0a'; g.fillRect(2 + i * 3.4, 0, 4, 6); g.fillStyle = '#fff8ec'; g.fillRect(3 + i * 3.4, 2 + (i % 2), 2, 4); } g.fillStyle = '#c0303a'; g.fillRect(0, 6, 18, 2); });
    tex(S, 'ckh_roca', 20, 18, g => { g.fillStyle = '#1b0f0a'; g.fillRect(4, 1, 12, 16); g.fillRect(1, 4, 18, 10); g.fillStyle = '#5a2a14'; g.fillRect(5, 2, 10, 14); g.fillRect(2, 5, 16, 8); g.fillStyle = '#c0501c'; g.fillRect(6, 4, 8, 9); g.fillRect(4, 6, 12, 5); g.fillStyle = '#ffb04a'; g.fillRect(8, 6, 4, 4); g.fillStyle = '#fff0a0'; g.fillRect(9, 7, 2, 2); });
  };

  // ================================================================== LANCENT
  const H_LANCENT = {
    grito(S, f0, yo, args) {
      const p = S.player; quieto(S, 1150, true);
      if (fijar(S, animDe(S, 'soldier_attack2'), 1000)) { try { p.anims.pause(p.anims.currentAnim.frames[1]); } catch (e) {} }
      canalizar(S, p, [255, 210, 120], 950, 60);
      fx(S, 'carga', 0, 0, { escala: 0.9, tinte: 0xffd27a, suma: true, sigue: p, dy: -8, dura: 900 });
      luz(p.x, p.y, [255, 210, 120], 110, 1000, 'sube'); son('ck_carga', 0.5) || son('thunder_hold', 0.3, { rate: 1.6 });
      S.time.delayedCall(1000, () => {
        if (!p.active || S.isDead) return;
        try { p.anims.resume(); } catch (e) {} soltarAnim(S);
        sinDesp('grito', () => f0.apply(yo, args)); desp(S, 'grito');
        p.clearTint();                                                   // (el contorno reemplaza al tinte)
        const f = pie(p); estallar(S, p.x, p.y - 6, [255, 210, 120], 34, 70, p.depth + 3); onda(S, 'luz', f.x, f.y, 95, 420);
        fx(S, 'golpe', p.x, p.y - 6, { escala: 1.2, tinte: 0xffd27a, suma: true });
        contorno(S, p, 0xffc83a, 5000);
      });
      return 0;
    },
    salto(S, f0, yo, args) {
      const p = S.player, sy = p.scaleY; quieto(S, 1600, true);
      if (fijar(S, animDe(S, 'soldier_attack2'), 1000)) { try { p.anims.pause(p.anims.currentAnim.frames[0]); } catch (e) {} }
      S.tweens.add({ targets: p, scaleY: sy * 0.86, duration: 700, ease: 'Sine.easeOut' });
      polvo(S, p, [200, 180, 140], 900, 40);
      fx(S, 'carga', 0, 0, { escala: 0.7, tinte: 0xe0c090, suma: true, sigue: p, dy: 4, dura: 850 });
      S.time.delayedCall(1000, () => {
        if (!p.active || S.isDead) return;
        S.tweens.killTweensOf(p); p.setScale(p.scaleX, sy); try { p.anims.resume(); } catch (e) {} soltarAnim(S);
        sinDesp('salto', () => f0.apply(yo, args)); desp(S, 'salto');
        S.time.delayedCall(395, () => { const f = pie(p); empujar(S, f.x, f.y, 96, 300); });
      });
      return 0;
    },
    onda(S, f0, yo, args) {
      const p = S.player, k = tecla(S, 'onda');
      const tirar = pot => {
        soltarAnim(S); const antes = new Set(S.projectiles ? S.projectiles.getChildren() : []);
        f0.apply(yo, args);
        if (pot <= 0.05) return;
        S.time.delayedCall(180, () => {
          (S.projectiles ? S.projectiles.getChildren() : []).forEach(o => {
            if (antes.has(o) || !o.active || !o._ck || o._ck.fuente !== 'onda') return;
            const k2 = 1 + pot;
            o.setScale(o.scaleX * k2, o.scaleY * k2); if (o.body) o.body.velocity.scale(1 + pot * 0.7);
            if (o._ck) o._ck.dmg = 2 + Math.round(pot * 2);
            // su efecto de pixelfx (viaja pegado a ella): más grande y que dure hasta donde llega (se agranda por propiedad:
            // ck_pixelfx agranda de más lo que pasa por setScale)
            S.children.list.forEach(s => { if (s.texture && s.texture.key === 'ckfx_onda' && Math.abs(s.x - o.x) < 3 && Math.abs(s.y - o.y) < 3) { s.scaleX *= k2; s.scaleY *= k2; if (s.anims) s.anims.timeScale = 1 / (1 + pot * 0.9); } });
          });
        });
      };
      if (!k || !k.isDown) { quieto(S, 450, true); tirar(0); return 0; }
      S.isAttacking = true; p.setVelocity(0, 0);
      if (fijar(S, animDe(S, 'soldier_attack2'), 2200)) { try { p.anims.pause(p.anims.currentAnim.frames[1]); } catch (e) {} }
      const izq = S.facingDirection === 'left', t0 = S.time.now;
      // (v2) la energía va en la punta de la espada según hacia dónde mira (de frente, abajo; de espaldas, arriba y detrás de él)
      const [cx, cy] = S.facingV === 'front' ? [0, 4] : S.facingV === 'back' ? [0, -10] : [izq ? -10 : 10, -4];
      const carga = fx(S, 'carga', 0, 0, { escala: 0.5, tinte: 0x9fd8ff, suma: true, sigue: p, dx: cx, dy: cy, vel: 0.5, dura: 2100, detras: S.facingV === 'back' });
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        const t = S.time.now - t0, pot = Math.min(1, t / 2000);
        if (carga && carga.active) carga.setScale(0.5 + pot * 0.8);
        if (Math.random() < 0.3 + pot * 0.4) estallar(S, p.x + cx, p.y + cy, [160, 210, 255], 1, 8 + pot * 14, p.depth + (S.facingV === 'back' ? -2 : 2));
        if (pot >= 1 && !S._ckOndaLlena) { S._ckOndaLlena = 1; son('ck_carga', 0.4, { rate: 1.5 }); luz(p.x, p.y, [160, 210, 255], 90, 300); }
        if (!k.isDown || t >= 2000 || S.isDead) {
          ev.remove(); S._ckOndaLlena = 0;
          try { p.anims.resume(); } catch (e) {} if (carga && carga.active) carga.destroy();
          if (!S.isDead) { quieto(S, 450, true); tirar(pot); } else S.isAttacking = false;
        }
      } });
      return 0;
    },
    golpe_escudo(S, f0, yo, args) {
      const p = S.player, [dx, dy] = dir(S); quieto(S, 640, true);
      if (!S.facingV) fijar(S, 'soldier_attack_hombro', 580);
      else fijar(S, 'soldier_dash_' + S.facingV, 580);                 // (v2) de frente y de espaldas: el envión con el cuerpo, no la estocada
      son('sword_swing2', 0.5, { rate: 0.6 });
      // se echa atrás y embiste con el hombro (el golpe cae a los 290 ms, cuando el hombro llega adelante)
      S.time.delayedCall(150, () => {
        if (!p.active || S.isDead) return;
        const x0 = p.x, y0 = p.y;
        sinDesp('golpe_escudo', () => f0.apply(yo, args)); desp(S, 'golpe_escudo');
        S.tweens.add({ targets: p, x: x0 + dx * 18, y: y0 + dy * 14, duration: 140, ease: 'Quad.easeIn', yoyo: true, hold: 120 });
        for (let i = 1; i <= 3; i++) S.time.delayedCall(i * 40, () => crea(S, () => { const g = S.add.sprite(p.x, p.y, p.texture.key, p.frame.name).setOrigin(p.originX, p.originY).setFlipX(p.flipX).setScale(p.scaleX, p.scaleY).setTintFill(0xbfdbfe).setAlpha(0.35).setBlendMode(1).setDepth(p.depth - 1); S.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() }); }));
      });
      return 0;
    }
  };

  // ================================================================== HOROS
  const misilFx = () => { try { const ED = window.CK_EDITOR_HAB, a = (ED && ED.AJ && ED.AJ().proyectiles && ED.AJ().proyectiles.ck_misil) || {}; return [a.ef || 'arcano_misil', a.esc != null ? a.esc : 0.55]; } catch (e) { return ['arcano_misil', 0.55]; } };
  const H_HOROS = {
    misiles(S) {
      const p = S.player, k = tecla(S, 'misiles'), t0 = S.time.now, orbes = [];
      S._ckBaculo = 'violeta'; p.play(animDe(S, 'wizard_attack1'));
      S.isAttacking = true; p.setVelocity(0, 0); desp(S, 'misiles');
      const lanzar = n => {
        orbes.forEach(o => o.destroy()); soltarAnim(S);
        son('ck_nova', 0.5, { rate: 1.6 }) || son('ice_cast', 0.6, { rate: 1.5 });
        const blancos = cerca(S, p.x, p.y, 320).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y));
        for (let i = 0; i < n; i++) S.time.delayedCall(i * 80, () => misil(S, p, blancos.length ? blancos[i % blancos.length] : null, (i - (n - 1) / 2) * (1.2 / Math.max(2, n - 1))));
        S.time.delayedCall(Math.max(260, n * 80), () => { S.isAttacking = false; S._ckBaculo = null; idle(S); });
      };
      if (!k || !k.isDown) { lanzar(3); return 0; }
      let n = 3;
      fijar(S, !S.facingV && S.anims.exists('wizard_attack1_hb_violeta_carga') ? 'wizard_attack1_hb_violeta_carga' : animDe(S, 'wizard_attack1'), 2700);
      const orbe = () => { const o = fx(S, misilFx()[0], p.x, p.y - 14, { escala: 0.34, prof: p.depth + 2 }); if (o) orbes.push(o); };
      for (let i = 0; i < 3; i++) orbe();
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        const t = S.time.now - t0;
        orbes.forEach((o, i) => { if (!o.active) return; const a = S.time.now / 260 + i / orbes.length * 6.28; o.setPosition(p.x + Math.cos(a) * 14, p.y - 12 + Math.sin(a) * 6).setRotation(a + Math.PI / 2).setDepth(p.depth + (Math.sin(a) > 0 ? 2 : -2)); });
        if (t > (n - 2) * 400 && n < 6 && S.stamina >= 8) { n++; S.stamina -= 8; S.updateStaminaBar && S.updateStaminaBar(); orbe(); son('ck_nova', 0.3, { rate: 2 }); estallar(S, p.x, p.y - 12, [200, 150, 255], 6, 14, p.depth + 3); }
        if (!k.isDown || t > 2600 || S.isDead) { ev.remove(); if (!S.isDead) lanzar(n); else S.isAttacking = false; }
      } });
      return 0;
    },
    drenaje(S) {
      const p = S.player, e = cerca(S, p.x, p.y, 200).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y))[0];
      if (!e) { window.CK_SIN_CARTELES_API && window.CK_SIN_CARTELES_API.nota('No hay ninguna bestia cerca'); return -1; }
      S._ckBaculo = 'verde'; p.play(animDe(S, 'wizard_attack1')); desp(S, 'drenaje');
      son('ck_nova', 0.6, { rate: 0.6 }) || son('ice_cast', 0.6, { rate: 0.5 });
      const t0 = S.time.now, punta = () => ({ x: p.x + (p.flipX ? -7 : 7), y: p.y - 16 });
      const ev = S.time.addEvent({ delay: 22, loop: true, callback: () => {
        if (S.time.now - t0 > 480 || !e.active) { ev.remove(); return; }
        crea(S, () => { for (let i = 0; i < 3; i++) {
          const x = e.x + R(-8, 8), y = e.y - 6 + R(-10, 8), c = [0x7dff9a, 0x3ad46a, 0xd8ffd8, 0xb0ff60][Math.floor(R(0, 4))];
          const q = S.add.rectangle(x, y, R(1.5, 3), R(1.5, 3), c, 1).setBlendMode(1).setDepth(30000), m = { t: 0 }, a0 = punta(), cx = (x + a0.x) / 2 + R(-14, 14), cy = Math.min(y, a0.y) - R(10, 26);
          S.tweens.add({ targets: m, t: 1, duration: R(260, 380), ease: 'Sine.easeIn', onUpdate: () => { const u = m.t, a = punta(); q.setPosition((1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * a.x, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * a.y); }, onComplete: () => q.destroy() });
        } });
      } });
      if (e.setTintFill) { e.setTintFill(0x7dff9a); S.time.delayedCall(90, () => e.active && e.clearTint()); }
      S.time.delayedCall(470, () => {
        if (vivo(e)) pegar(S, e, 2, p.x, p.y);
        curar(S, 1);
        fx(S, 'curar', p.x, p.y + 10, { escala: 1.1 }); contorno(S, p, 0x7dff9a, 600); luz(p.x, p.y, [120, 255, 150], 120, 300);
      });
      S.time.delayedCall(560, () => { if (S._ckBaculo === 'verde') S._ckBaculo = null; });
      return 520;
    },
    meteoro(S) {
      const p = S.player, [dx, dy] = dir(S), tx = p.x + dx * 110, ty = p.y + 12 + dy * 90, CAE = 760;
      S._ckBaculo = 'fuego'; p.play(animDe(S, 'wizard_attack1')); son('fire_cast', 0.9, { rate: 0.6 }); texturas(S); desp(S, 'meteoro');   // (levanta el báculo: lo llama del cielo)
      S.time.delayedCall(500, () => { if (S._ckBaculo === 'fuego') S._ckBaculo = null; });
      crea(S, () => {
        // dónde cae: la sombra que crece y el círculo de fuego
        const som = S.add.ellipse(tx, ty, 10, 5, 0x000000, 0.4).setDepth(Math.round(ty) - 20);
        S.tweens.add({ targets: som, scaleX: 7, scaleY: 7, duration: CAE });
        fx(S, 'runas', tx, ty, { escala: 0.85, tinte: 0xff6a2a, alfa: 0.75, suma: true, dura: CAE - 100, prof: Math.round(ty) - 19 });
        // la roca: casi derecha desde arriba, más grande, envuelta en fuego y con estela
        // (nacen en el blanco y van arriba enseguida: así el editor las encuentra)
        const x0 = tx - dx * 30 - 18, y0 = ty - 340, r = S.add.image(tx, ty, 'ckh_roca').setScale(3.2).setDepth(30000).setPosition(x0, y0);
        const llama = fx(S, 'fuego_bola', tx, ty, { escala: 1.7, suma: true, prof: 30001, giro: Math.atan2(ty - y0, tx - x0) }); if (llama) llama.setPosition(x0, y0);
        const m = { t: 0 };
        S.tweens.add({ targets: m, t: 1, duration: CAE, ease: 'Quad.easeIn', onUpdate: () => crea(S, () => {
          const x = x0 + (tx - x0) * m.t, y = y0 + (ty - 8 - y0) * m.t; r.setPosition(x, y).setAngle(m.t * 280); if (llama && llama.active) llama.setPosition(x, y - 4);
          for (let i = 0; i < 2; i++) { const q = S.add.rectangle(x + R(-6, 6), y + R(-10, 2), R(2, 4), R(2, 4), [0xffb04a, 0xff6a1a, 0xffe08a, 0x5a2a14][Math.floor(R(0, 4))], 1).setBlendMode(1).setDepth(29999); S.tweens.add({ targets: q, y: q.y - R(10, 24), x: q.x + R(-8, 8), alpha: 0, duration: R(260, 480), onComplete: () => q.destroy() }); }
        }), onComplete: () => crea(S, () => {
          r.destroy(); som.destroy(); if (llama && llama.active) llama.destroy();
          // el golpe: cráter, onda de fuego con partículas, brasas
          crater(S, tx, ty);
          fx(S, 'fuego_explosion', tx, ty - 12, { escala: 1.7 }); fx(S, 'suelo', tx, ty, { escala: 1.25, tinte: 0x3a2014, prof: Math.round(ty) - 17 });
          onda(S, 'fuego', tx, ty, 100, 520);
          for (let i = 0; i < 34; i++) { const a = R(0, 6.28), d = R(30, 95), q = S.add.rectangle(tx, ty - 4, R(2, 4), R(2, 4), [0xffb04a, 0xff6a1a, 0xffe08a][Math.floor(R(0, 3))], 1).setBlendMode(1).setDepth(Math.round(ty) + 20); S.tweens.add({ targets: q, x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d * 0.6 - R(4, 30), alpha: 0, duration: R(420, 820), ease: 'Quad.easeOut', onComplete: () => q.destroy() }); }
          S.cameras.main.shake(300, 0.014); luz(tx, ty, [255, 150, 60], 220, 500); son('ck_explosion', 0.9) || son('fire_hit', 0.9, { rate: 0.7 });
          cerca(S, tx, ty, 76).forEach(e => { pegar(S, e, 3, tx, ty, 'fuego'); EP().quemar && EP().quemar(S, e, 2500); });
          empujar(S, tx, ty, 80, 220);
          const H = HB(); H && H.brasas && H.brasas(S, tx, ty + 6);
        }) });
      });
      return 450;
    }
  };
  // (v4) con ck_grietas.js el cráter es el de pixelfx (al rojo, con grietas que se enfrían); sin él, el dibujo de antes
  const crater = (S, x, y) => (window.CK_GRIETAS && CK_GRIETAS.romper(S, x, y, 'fuego', { escala: 1 })) || crea(S, () => {
    const g = S.add.graphics().setDepth(Math.round(y) - 18);
    g.fillStyle(0x1b0f0a, 0.55); g.fillEllipse(x, y + 1, 70, 34);
    g.fillStyle(0x2a1810, 0.75); g.fillEllipse(x, y, 54, 25);
    g.fillStyle(0x4a2414, 0.9); g.fillEllipse(x, y - 1, 34, 15);
    g.fillStyle(0xff7a2a, 0.55); g.fillEllipse(x, y - 1, 18, 7);
    g.lineStyle(2, 0x6a4a30, 0.8); g.strokeEllipse(x, y + 1, 70, 34);
    S.tweens.add({ targets: g, alpha: 0, delay: 5000, duration: 1500, onComplete: () => g.destroy() });
  });
  const misil = (S, p, e0, ang) => {
    const izq = S.facingDirection === 'left', [ef, esc] = misilFx(), o = fx(S, ef, p.x, p.y - 12, { escala: esc, suma: true, prof: 30000 }); if (!o) return;
    let vx = Math.cos(ang - Math.PI / 2) * 170 * (izq ? -1 : 1), vy = Math.sin(ang - Math.PI / 2) * 170, vida = 0, n = 0;
    const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
      vida += 16; const e = vivo(e0) ? e0 : cerca(S, o.x, o.y, 260)[0];
      // vuela hacia la bestia doblando de a poco (primero sale abierto, después se cierra sobre ella)
      if (e) { const a = Math.atan2(e.y - 6 - o.y, e.x - o.x), sp = Math.min(330, 170 + vida * 0.45), k = Math.min(0.2, 0.03 + vida / 4000); vx += (Math.cos(a) * sp - vx) * k; vy += (Math.sin(a) * sp - vy) * k; }
      o.x += vx * 0.016; o.y += vy * 0.016; o.setRotation(Math.atan2(vy, vx));
      // la estela: chispitas que quedan flotando, suben un poco y se apagan
      if (n++ % 2 === 0) crea(S, () => { const q = S.add.rectangle(o.x + R(-2, 2), o.y + R(-2, 2), R(1.5, 2.5), R(1.5, 2.5), [0xd8a0ff, 0xb070ff, 0xffffff, 0x8a4aff][Math.floor(R(0, 4))], 1).setBlendMode(1).setDepth(29999); S.tweens.add({ targets: q, x: q.x - vx * 0.03 + R(-5, 5), y: q.y - vy * 0.03 + R(-6, 2), alpha: 0, scale: 0.3, duration: R(260, 420), onComplete: () => q.destroy() }); });
      const h = e && Phaser.Math.Distance.Between(o.x, o.y, e.x, e.y - 6) < 12;
      if (h || vida > 2200 || !o.active) { ev.remove(); if (h) { pegar(S, e, 1, o.x, o.y, 'nova'); fx(S, 'golpe', o.x, o.y, { escala: 0.7, tinte: 0xc89cff, suma: true }); estallar(S, o.x, o.y, [200, 150, 255], 10, 18); } if (o.active) o.destroy(); }
    } });
  };

  // ================================================================== URSO
  const delante = (S, d) => { const p = S.player, [dx, dy] = dir(S); return { x: p.x + dx * d, y: p.y + 6 + dy * d * 0.8 }; };
  const H_URSO = {
    pisoton(S, f0, yo, args) {
      const p = S.player; quieto(S, 1400, true);
      const lento = fijar(S, S.facingV ? 'bear_attack3_' + S.facingV + '_pis' : 'bear_attack_pisoton_lento', 1340);      // (v2) también de frente y de espaldas
      if (!lento) S.tweens.add({ targets: p, y: p.y - 4, duration: 700, ease: 'Sine.easeOut', yoyo: true, hold: 100 });
      polvo(S, p, [220, 200, 170], 850, 46);
      son('beast_growl', 0.6, { rate: 0.55 });
      // se alza ~0,9 s; el golpe (el del juego: daño y aturdido a los 420 ms) cae con el pisotón de la animación
      S.time.delayedCall(500, () => { if (!p.active || S.isDead) return; sinDesp('pisoton', () => f0.apply(yo, args)); });
      S.time.delayedCall(DEMORA.pisoton, () => { if (p.active && !S.isDead) desp(S, 'pisoton'); });
      S.time.delayedCall(925, () => {
        if (!p.active || S.isDead) return;
        const f = pie(p); empujar(S, f.x, f.y, 104, 320); estallar(S, f.x, f.y, [200, 180, 150], 20, 60, Math.round(f.y) + 2);
      });
      return 0;
    },
    mordisco(S) {
      const p = S.player, [dx, dy] = dir(S); texturas(S); desp(S, 'mordisco');
      const anim = !S.facingV && fijar(S, 'bear_attack_mordisco', 640);
      if (!anim) p.play(animDe(S, 'bear_attack1'));
      son('beast_growl', 0.9, { rate: 1.1 });
      S.tweens.add({ targets: p, x: p.x + dx * 12, y: p.y + dy * 10, duration: 150, delay: 150, ease: 'Quad.easeOut', yoyo: true, hold: 90 });
      S.time.delayedCall(320, () => {
        const f = delante(S, 26), e = cerca(S, f.x, f.y, 40)[0], c = e ? { x: e.x, y: e.y - 4 } : f;
        colmillos(S, c.x, c.y, dx < 0);
        if (e) { pegar(S, e, 2, p.x, p.y); EP().sangrar && EP().sangrar(S, e, 3500); fx(S, 'sangre', c.x, c.y + 2, { escala: 1.1 }); curar(S, 1); S.cameras.main.shake(90, 0.005); son('sword_hit', 0.7, { rate: 0.6 }); }
      });
      S.time.delayedCall(640, () => soltarAnim(S));
      return 640;
    },
    desgarro(S) {
      const p = S.player, [dx, dy] = dir(S), f = delante(S, 30); desp(S, 'desgarro');
      const e = cerca(S, f.x, f.y, 60).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y))[0];
      const anim = !S.facingV && fijar(S, 'bear_attack_abrazo', 1520);
      if (!anim) p.play(animDe(S, 'bear_attack2'));
      son('beast_growl', 1, { rate: 0.7 });
      if (e) {
        S.tweens.add({ targets: p, x: e.x - dx * 18, y: e.y - dy * 14, duration: 160, ease: 'Quad.easeOut' });
        EP().aturdir && EP().aturdir(S, e, 1700);
        const sx = e.scaleX, sy = e.scaleY, x0 = e.x, y0 = e.y;
        const apretar = S.tweens.add({ targets: e, scaleX: sx * 0.84, scaleY: sy * 1.06, duration: 120, yoyo: true, repeat: 5, delay: 260 });
        const temblar = S.time.addEvent({ delay: 40, repeat: 34, callback: () => { if (vivo(e)) { e.x = x0 + R(-1.2, 1.2); e.y = y0; if (e.body) e.body.setVelocity(0, 0); } } });
        [500, 900, 1300].forEach((t, i) => S.time.delayedCall(t, () => {
          if (!vivo(e)) return;
          pegar(S, e, 1, p.x, p.y); e.x = x0; e.y = y0; if (e.setTintFill) { e.setTintFill(0xff6a5a); S.time.delayedCall(70, () => e.active && e.clearTint()); }
          estallar(S, e.x, e.y - 6, [255, 120, 100], 8 + i * 4, 18 + i * 6); S.cameras.main.shake(80 + i * 40, 0.004 + i * 0.002); son('bone_hit', 0.6, { rate: 0.7 + i * 0.1 }) || son('sword_hit', 0.6, { rate: 0.6 });
        }));
        S.time.delayedCall(1450, () => {
          temblar.remove(); apretar.stop(); if (!e.active) return; e.setScale(sx, sy);
          if (vivo(e)) { EP().sangrar && EP().sangrar(S, e, 2500); fx(S, 'sangre', e.x, e.y, { escala: 1.3 }); fx(S, 'golpe', e.x, e.y - 6, { escala: 1, tinte: 0xffb0a0 }); e._ckAturdido = 0; empuje(S, e, Math.atan2(dy, dx), 300, 300); }
        });
      }
      S.time.delayedCall(1520, () => soltarAnim(S));
      return 1520;
    },
    avalancha(S, f0, yo, args) {
      const p = S.player; quieto(S, 1700, true);
      const ok = fijar(S, S.facingV ? 'bear_attack3_' + S.facingV + '_ava' : 'bear_attack3_ava', 1300);      // (v2) también de frente y de espaldas
      if (!ok) S.tweens.add({ targets: p, y: p.y - 3, duration: 600, ease: 'Sine.easeOut', yoyo: true, hold: 200 });
      canalizar(S, p, [190, 230, 255], 900, 56); fx(S, 'carga', 0, 0, { escala: 0.9, tinte: 0xbfe9ff, suma: true, sigue: p, dy: -6, dura: 900 });
      son('beast_growl', 0.8, { rate: 0.5 });
      // golpea el piso a 1 s: las rocas del juego salen 380 ms después de arrancar y los picos de pixelfx 230 ms después de sus capas
      S.time.delayedCall(ok ? 640 : 1000, () => { if (!p.active || S.isDead) return; sinDesp('avalancha', () => f0.apply(yo, args)); });
      S.time.delayedCall(ok ? DEMORA.avalancha : 1130, () => { if (p.active && !S.isDead) desp(S, 'avalancha'); });
      return 0;
    },
    espiritu(S) {
      const p = S.player; quieto(S, 1100, true); desp(S, 'espiritu');
      const ok = !S.facingV && fijar(S, 'bear_attack_rugido_largo', 1250);
      if (!ok) p.play(animDe(S, 'bear_attack3'));
      son('beast_growl', 1, { rate: 0.6 }); S.cameras.main.shake(260, 0.006);
      const EQx = EQ(); [0, 160].forEach(t => S.time.delayedCall(250 + t, () => EQx && EQx.anilloFx && crea(S, () => EQx.anilloFx(S, p.x, p.y - 4, 0x9dffb0, 10, 90, 420, 3))));
      canalizar(S, p, [125, 255, 154], 1000, 70);
      fx(S, 'carga', 0, 0, { escala: 0.9, tinte: 0x7dff9a, suma: true, sigue: p, dy: -6, dura: 950 });
      S.time.delayedCall(1000, () => {
        if (!p.active || S.isDead) return;
        const now = S.time.now;
        S._ckEspiritu = now + 5000; S._ckEspAguante = now + 5000;
        contorno(S, p, 0x7dff9a, 5000); estallar(S, p.x, p.y - 6, [125, 255, 154], 26, 60, p.depth + 3);
        S.createFloatingText(p.x, p.y - 44, '¡ESPÍRITU DEL BOSQUE!', 0x7dff9a);
        S.time.addEvent({ delay: 2000, repeat: 1, callback: () => { if (!S.isDead && S.playerHero === 'bear') { curar(S, 1); luz(p.x, p.y, [130, 255, 150], 120, 300); } } });
      });
      return 0;
    }
  };
  const colmillos = (S, x, y, izq) => crea(S, () => {
    const a = S.add.image(x, y - 11, 'ckh_colmillo_arr').setScale(1.2).setDepth(30001).setFlipX(izq), b = S.add.image(x, y + 11, 'ckh_colmillo_aba').setScale(1.2).setDepth(30001).setFlipX(izq);
    S.tweens.add({ targets: a, y: y - 5, duration: 90, ease: 'Quad.easeIn' }); S.tweens.add({ targets: b, y: y + 5, duration: 90, ease: 'Quad.easeIn' });
    S.tweens.add({ targets: [a, b], alpha: 0, delay: 220, duration: 200, onComplete: () => { a.destroy(); b.destroy(); } });
  });
  // el remolino de garras (base de Urso, tecla E): gira y salen zarpazos alrededor
  // (v4, notas del 22/11: "esta habilidad tiene 1 segundo de anticipación" y "los efectos de zarpazos están torcidos, van hacia
  // afuera") se carga 1 s con las garras atrás (viento que se junta, contorno claro) y después gira; los zarpazos van de costado,
  // siguiendo el giro (la hoja de garras es casi vertical: se la gira a la tangente del óvalo, no al radio)
  const REM = { carga: 1000 };
  const remolino = S => {
    const p = S.player; quieto(S, REM.carga + 720, true);
    fijar(S, S.facingV ? 'bear_attack2_' + S.facingV + '_carga' : 'bear_attack2_carga', REM.carga);
    contorno(S, p, 0xe6eef6, REM.carga); canalizar(S, p, [225, 235, 245], REM.carga - 120, 42);
    fx(S, 'carga', 0, 0, { escala: 0.7, tinte: 0xe6f0ff, suma: true, sigue: p, dy: -4, dura: REM.carga - 80 });
    son('beast_growl', 0.6, { rate: 1.1 });
    S.time.delayedCall(REM.carga, () => { if (!p.active || S.isDead || S.playerHero !== 'bear') return; soltarAnim(S); girar(S); });
    return REM.carga + 700;
  };
  const girar = S => {
    const p = S.player, flip0 = p.flipX; p.play(animDe(S, 'bear_attack2')); p.anims.timeScale = 1.4; desp(S, 'b_remolino');
    let n = 0; const ev = S.time.addEvent({ delay: 75, repeat: 8, callback: () => { if (p.active) p.setFlipX(n++ % 2 === 0 ? !flip0 : flip0); } });
    for (let i = 0; i < 3; i++) S.time.delayedCall(120 + i * 200, () => {
      son('sword_swing1', 0.6, { rate: 0.7 + i * 0.1 });
      const f = pie(p);
      for (let k = 0; k < 4; k++) { const a = i * 0.8 + k * Math.PI / 2, x = f.x + Math.cos(a) * 26, y = f.y - 12 + Math.sin(a) * 16, tg = Math.atan2(16 * Math.cos(a), -26 * Math.sin(a)); fx(S, 'garras', x, y, { escala: 0.75, giro: tg - Math.PI / 2 }); }
      estallar(S, f.x, f.y - 2, [220, 230, 240], 6, 34, Math.round(f.y) + 2);
      cerca(S, p.x, p.y, 56).forEach(e => pegar(S, e, 1, p.x, p.y));
    });
    S.time.delayedCall(720, () => { p.anims.timeScale = 1; ev.remove(); if (p.active) p.setFlipX(flip0); });
  };

  // ------------------------------------------------------------------ el espíritu del bosque: más rápido, +1 de daño, la mitad del daño
  const esp = S => S._ckEspAguante > S.time.now && S.playerHero === 'bear';
  const dp0 = P.damagePlayer;
  P.damagePlayer = function (amount) {
    if (esp(this) && amount > 1) arguments[0] = Math.ceil(amount / 2);
    else if (esp(this) && amount === 1 && (this._ckEspMedio = !this._ckEspMedio)) return;     // de a 1: uno sí y uno no
    return dp0.apply(this, arguments);
  };
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    if (esp(this) && amount > 0) arguments[1] = amount + 1;
    return de0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ (v2) Aby: el relámpago cruzaba quieta; ahora con su tajo hacia donde mira
  const H_ABY = {
    relampago(S, f0, yo, args) {
      const r = f0.apply(yo, args);
      if (r !== -1 && S.player) { const k = animDe(S, 'swordsman_attack1'); if (S.anims.exists(k)) S.player.play(k, true); }
      return r;
    }
  };

  // ================================================================== (v4) NOTAS DEL 22/11: LLUVIA, ANILLO Y TRUENO
  const dorado = () => Phaser.Display.Color.GetColor(255, Math.round(R(190, 235)), Math.round(R(90, 150)));
  const rastro = (S, o, col, prof) => crea(S, () => {             // chispitas que deja algo que vuela
    for (let i = 0; i < 2; i++) {
      const q = S.add.rectangle(Math.round(o.x + R(-1.5, 1.5)), Math.round(o.y + R(2, 6)), 2, 2, col(), 1).setBlendMode(1).setDepth(prof);
      S.tweens.add({ targets: q, x: q.x + R(-4, 4), y: q.y + R(4, 12), alpha: 0, duration: R(220, 420), onComplete: () => q.destroy() });
    }
  });

  // ------------------------------------------------------------------ LANCENT · LLUVIA DE FLECHAS
  // "cuando carga hacia arriba anticipa un segundo y al lanzar la flecha esta sale con partículas y luego se divide y caen
  // varias, pero quitale el sello del piso; que caigan sólo las flechas en un área aleatoria alrededor de él"
  const LL = { carga: 1000, sube: 280, alto: 78, n: 16, rad: 66, rmin: 16, caen: 760, hit: 15, cd: 3000, costo: 45 };
  const ar0 = P.performArrowRain;
  P.performArrowRain = function () {
    const S = this;
    if (S.playerHero !== 'soldier') return ar0.apply(this, arguments);
    if (!S.anims.exists('soldier_attack_lluvia_carga')) { registrar(S); if (!S.anims.exists('soldier_attack_lluvia_carga')) return ar0.apply(this, arguments); }
    if (S.isDead || S.isCastingRain || S.isDashing || S.isSpinning || S.isAttacking || S._doorTransition || S.isGamePaused) return;
    const now = S.time.now;
    if (now - (S.lastRainTime || -99999) < LL.cd) return;
    if (S.stamina < LL.costo) { S.showLowStaminaWarning && S.showLowStaminaWarning('Lluvia de flechas'); return; }
    S.stamina = Math.max(0, S.stamina - LL.costo); S.updateStaminaBar && S.updateStaminaBar();
    S.lastRainTime = now; S.isCastingRain = true; S.isAttacking = true; S.isInvulnerable = true;
    const p = S.player, k = Math.abs(p.scaleX) / 1.2, lv = (HB() && HB().rg) ? HB().rg(S, 'lluvia', 'soldier') : 0;
    p.setVelocity(0, 0);
    const punta = () => ({ x: p.x + (p.flipX ? -5 : 5) * k, y: p.y - 27 * k });
    const fin = () => { S.isCastingRain = false; S.isAttacking = false; S.isInvulnerable = false; if (!S.isDead && p.active && S.playerHero === 'soldier') idle(S); };
    // 1 s apuntando al cielo: el arco tenso, chispas doradas que se juntan en la punta de la flecha
    fijar(S, 'soldier_attack_lluvia_carga', LL.carga);
    contorno(S, p, 0xffd25a, LL.carga); canalizar(S, p, [255, 215, 110], LL.carga - 120, 44);
    const c0 = punta(); fx(S, 'carga', 0, 0, { escala: 0.5, tinte: 0xffe08a, suma: true, sigue: p, dx: c0.x - p.x, dy: c0.y - p.y, dura: LL.carga - 60 });
    luz(p.x, p.y - 20, [255, 210, 120], 90, LL.carga, 'sube');
    son('ice_cast', 0.35, { rate: 0.7 });
    S.time.delayedCall(LL.carga, () => {
      if (S.isDead || !p.active || S.playerHero !== 'soldier') { fin(); return; }
      soltarAnim(S); fijar(S, 'soldier_attack_lluvia_tiro', 280);
      tirarFlecha(S, p, punta(), k, lv);
    });
    S.time.delayedCall(LL.carga + 260, fin);
  };
  // la flecha sube con su estela, arriba se abre en un destello y se divide
  const tirarFlecha = (S, p, o, k, lv) => {
    const conFlecha = S.textures.exists('arrow');
    son('bow_shot', 0.9) || son('sword_swing1', 0.6, { rate: 1.4 });
    fx(S, 'golpe', o.x, o.y, { escala: 0.4, tinte: 0xffe08a, suma: true, prof: p.depth + 6 });
    const f = crea(S, () => (conFlecha ? S.add.image(o.x, o.y, 'arrow').setRotation(-Math.PI / 2) : S.add.rectangle(o.x, o.y, 2, 12, 0xfde68a)).setDepth(p.depth + 5));
    const brillo = crea(S, () => S.add.ellipse(o.x, o.y, 7, 7, 0xffe08a, 0.75).setBlendMode(1).setDepth(p.depth + 4));
    const ev = S.time.addEvent({ delay: 18, loop: true, callback: () => { if (!f.active) { ev.remove(); brillo.destroy(); return; } brillo.setPosition(f.x, f.y + 3); rastro(S, f, dorado, f.depth - 1); rastro(S, f, dorado, f.depth - 1); } });
    const top = { x: o.x, y: o.y - LL.alto * k };
    S.tweens.add({ targets: f, y: top.y, duration: LL.sube, ease: 'Quad.easeOut', onComplete: () => { ev.remove(); f.destroy(); dividir(S, top, k, lv); } });
  };
  const dividir = (S, top, k, lv) => {
    const conFlecha = S.textures.exists('arrow');
    fx(S, 'golpe', top.x, top.y, { escala: 0.85, tinte: 0xffe08a, suma: true, prof: 30000 });
    estallar(S, top.x, top.y, [255, 220, 120], 16, 26, 30000);
    luz(top.x, top.y, [255, 220, 140], 130, 320);
    son('sword_hit', 0.35, { rate: 1.8 });
    for (let i = 0; i < 7; i++) crea(S, () => {                    // se abre en abanico y se pierde para arriba
      const a = -Math.PI / 2 + (i - 3) * 0.34, q = (conFlecha ? S.add.image(top.x, top.y, 'arrow').setRotation(a) : S.add.rectangle(top.x, top.y, 2, 10, 0xfde68a).setRotation(a + Math.PI / 2)).setDepth(30000).setScale(0.8);
      S.tweens.add({ targets: q, x: top.x + Math.cos(a) * 44, y: top.y + Math.sin(a) * 44, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => q.destroy() });
    });
    S.time.delayedCall(200, () => caenFlechas(S, k, lv));
  };
  // y caen alrededor de él (donde estaba al tirar), sin sello en el piso: sólo las flechas, su sombra y el polvito
  const caenFlechas = (S, k, lv) => {
    const p = S.player; if (!p || !p.active) return;
    const c = pie(p), N = LL.n + lv * 5, RAD = LL.rad * k * (1 + lv * 0.25), r0 = LL.rmin / RAD;
    son('arrow_rain', 0.9) || (window.CK_SONIDOS && CK_SONIDOS.son && CK_SONIDOS.son('lluvia_flechas', 0.9));
    for (let i = 0; i < N; i++) S.time.delayedCall(i * (LL.caen / N) + R(0, 40), () => {
      const a = R(0, Math.PI * 2), d = Math.sqrt(R(r0 * r0, 1)) * RAD;
      flecha(S, Math.round(c.x + Math.cos(a) * d), Math.round(c.y + Math.sin(a) * d * 0.62));
    });
  };
  const flecha = (S, tx, ty) => crea(S, () => {
    const conFlecha = S.textures.exists('arrow'), CAE = 230;
    const som = S.add.ellipse(tx, ty, 4, 2, 0x000000, 0.3).setDepth(Math.max(8, ty - 6));
    S.tweens.add({ targets: som, scaleX: 2.4, scaleY: 2.4, duration: CAE });
    const sx = tx - 22, sy = ty - 200, rot = Math.atan2(ty - sy, tx - sx);
    const f = (conFlecha ? S.add.image(sx, sy, 'arrow').setRotation(rot) : S.add.rectangle(sx, sy, 12, 2, 0xfde68a).setRotation(rot)).setDepth(ty + 40);
    S.tweens.add({ targets: f, x: tx - 3, y: ty - 7, duration: CAE, ease: 'Quad.easeIn', onComplete: () => {
      f.setDepth(ty);
      for (let j = 0; j < 4; j++) { const a = j * 1.57 + 0.4, q = S.add.rectangle(tx, ty, 2, 2, 0xe7d7b0, 0.85).setDepth(ty + 1); S.tweens.add({ targets: q, x: tx + Math.cos(a) * R(5, 9), y: ty + Math.sin(a) * R(3, 5) - 3, alpha: 0, duration: 220, onComplete: () => q.destroy() }); }
      if (S.enemies && !S.isDead) S.enemies.getChildren().slice().forEach(e => { if (!vivo(e)) return; const q = pie(e); if (Math.hypot(q.x - tx, (q.y - ty) / 0.75) <= LL.hit) S.damageEnemy(e, 1, tx, ty - 20); });
      S.tweens.add({ targets: [f, som], alpha: 0, delay: 450, duration: 250, onComplete: () => { f.destroy(); som.destroy(); } });
    } });
  });

  // ------------------------------------------------------------------ HOROS · ANILLO DE LLAMAS
  // "hazle partículas con pixelfx al fuego del anillo de llamas": el anillo del juego sigue quemando lo que entra, pero en vez de
  // sus llamitas de código van llamas de pixelfx (pfx_llama) girando, el anillo de fuego que se abre y brasas que suben
  const ANI = { dura: 3000, radio: 70, llamas: 14 };
  const H_HOROS2 = {
    anillo(S, f0, yo, args) {
      const fab = S.add, propia = Object.prototype.hasOwnProperty.call(fab, 'graphics'), g0 = fab.graphics, gs = [];
      fab.graphics = function () { const g = g0.apply(this, arguments); gs.push(g); return g; };
      let r; try { r = f0.apply(yo, args); } finally { if (propia) fab.graphics = g0; else delete fab.graphics; }
      if (r === -1) return r;
      gs.forEach(g => { try { g.setVisible(false); } catch (e) {} });
      llamas(S);
      return r;
    }
  };
  const llamas = S => {
    const p = S.player, t0 = S.time.now, f = pie(p), L = [];
    fx(S, 'pfx_anillo_fuego', f.x, f.y, { escala: 0.75, prof: Math.round(f.y) - 4 });
    for (let i = 0; i < ANI.llamas; i++) {
      const s = fx(S, 'pfx_llama', f.x, f.y, { escala: 0.85 + (i % 3) * 0.12 });
      if (s) { try { s.anims.setProgress(Math.random()); } catch (e) {} s.setAlpha(0); L.push(s); }
    }
    const apagar = () => L.forEach(s => { if (s && s.active) S.tweens.add({ targets: s, alpha: 0, scaleY: s.scaleY * 0.4, duration: 240, onComplete: () => s.destroy() }); });
    const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
      const t = S.time.now - t0; if (t > ANI.dura || !p.active || S.isDead) { ev.remove(); apagar(); return; }
      const c = pie(p), abre = Math.min(1, t / 260);
      L.forEach((s, i) => { if (!s.active) return; const a = i / L.length * Math.PI * 2 + t / 500, r = ANI.radio * abre; s.setPosition(Math.round(c.x + Math.cos(a) * r), Math.round(c.y - 4 + Math.sin(a) * r * 0.6)); s.setDepth(Math.round(s.y) + 2); s.setAlpha(abre); });
      if (Math.random() < 0.7) crea(S, () => {                     // brasas que suben del anillo
        const a = R(0, Math.PI * 2), x = c.x + Math.cos(a) * ANI.radio, y = c.y - 4 + Math.sin(a) * ANI.radio * 0.6;
        const q = S.add.rectangle(Math.round(x), Math.round(y - R(4, 12)), 2, 2, Phaser.Display.Color.GetColor(255, Math.round(R(120, 220)), Math.round(R(30, 80))), 1).setBlendMode(1).setDepth(Math.round(y) + 3);
        S.tweens.add({ targets: q, x: q.x + R(-5, 5), y: q.y - R(16, 34), alpha: 0, duration: R(450, 800), onComplete: () => q.destroy() });
      });
    } });
  };

  // ------------------------------------------------------------------ HOROS · TRUENO (base, mantener la tecla)
  // "mejorale el aura de recarga: las partículas eléctricas y la onda expansiva", "haz estos rayos con pixelfx más limpios,
  // pulidos, más imponentes" y "el máximo se carga en 2 segundos, y al máximo los truenos hacen una onda expansiva de mini
  // rayos en el piso que se disipan a medida que se agranda la onda".
  // Lo de siempre (carga, nivel por tiempo, guardia arcana, daño) es igual que en combat.js; cambian los tiempos y el dibujo.
  const TR = { l2: 1000, l3: 2000, auto: 3400, minimo: 380 };
  const uc0 = P.updateThunderCharge, ts0 = P.thunderStrike;
  // la carga en la punta del báculo: chispas que se juntan (pfx_carga_rayo, sin el estallido del final), en bucle
  const cargaRayo = S => {
    const V = VX(), H = window.CK_PIXELFX_ARTE && CK_PIXELFX_ARTE.hojas.pfx_carga_rayo; if (!V || !V.listo || !H) return null;
    const key = V.listo(S, 'pfx_carga_rayo'); if (!key) return null;
    if (!S.anims.exists(key + '_bucle')) S.anims.create({ key: key + '_bucle', frames: S.anims.generateFrameNumbers(key, { start: 0, end: Math.min(14, H.n - 1) }), frameRate: H.fps, repeat: -1 });
    return crea(S, () => S.add.sprite(0, 0, key, 0).setOrigin(H.ax / H.fw, H.ay / H.fh).setBlendMode(1).play(key + '_bucle'));
  };
  const rayito = (g, x0, y0, x1, y1, n, j, col, al) => {           // un rayo chiquito de píxeles: brillo y centro blanco
    const pts = [[x0, y0]]; for (let i = 1; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + R(-j, j), y0 + (y1 - y0) * t + R(-j, j)]); } pts.push([x1, y1]);
    [[3, 0x0b2a52, 0.35 * al], [2, col, 0.8 * al], [1, 0xffffff, al]].forEach(([w, c, a]) => { g.lineStyle(w, c, a); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(Math.round(x), Math.round(y)) : g.moveTo(Math.round(x), Math.round(y)))); g.strokePath(); });
  };
  // la onda: un anillo de mini rayos sobre el piso que se agranda y se apaga mientras crece (+ chispas de pixelfx en el borde)
  const ondaRayitos = (S, cx, cy, R1, ms, n, col) => {
    const g = crea(S, () => S.add.graphics().setDepth(Math.round(cy) - 3)), t0 = S.time.now, SQ = 0.62;      // (sin sumar luz: se ve igual sobre la arena)
    let ult = 0;
    const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
      const u = (S.time.now - t0) / ms; if (u >= 1 || !g.active) { ev.remove(); g.destroy(); return; }
      const e = 1 - (1 - u) * (1 - u), r = 8 + (R1 - 8) * e, al = Math.pow(1 - u, 1.3);
      g.clear();
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + (i % 2) * 0.12 + u * 0.3, b = a + R(0.08, 0.18);
        rayito(g, cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8) * SQ, cx + Math.cos(b) * (r + 7), cy + Math.sin(b) * (r + 7) * SQ, 4, 2.5, col, al);
      }
      g.lineStyle(1, 0xcfeaff, 0.3 * al); g.strokeEllipse(cx, cy, r * 2, r * 2 * SQ);
      if (S.time.now - ult > 90) { ult = S.time.now; for (let i = 0; i < 2; i++) { const a = R(0, Math.PI * 2); fx(S, 'chispa_rayo', cx + Math.cos(a) * r, cy + Math.sin(a) * r * SQ, { escala: 0.25 + 0.2 * (1 - u), suma: true, giro: R(0, 6.28), alfa: al }); } }
    } });
  };
  // el pulso al subir de nivel: el trueno chico en el piso, un aro blanco que se abre y chispas
  const pulsoCarga = (S, p, nivel, col) => {
    const f = pie(p);
    fx(S, 'pfx_trueno_onda', f.x, f.y, { escala: nivel === 3 ? 0.5 : 0.36, suma: true, prof: Math.round(f.y) - 2 });
    ondaRayitos(S, f.x, f.y, nivel === 3 ? 46 : 34, 360, nivel === 3 ? 12 : 8, col);
    estallar(S, p.x, p.y - 10, [200, 235, 255], nivel === 3 ? 16 : 10, 26, p.depth + 3);
    luz(p.x, p.y - 10, [170, 220, 255], 120, 300);
  };
  P.updateThunderCharge = function () {
    const c = this.thunderCharge; if (!c) return;
    if (this.playerHero !== 'wizard' || !(window.CK_PIXELFX_ARTE && CK_PIXELFX_ARTE.hojas.pfx_trueno)) return uc0.apply(this, arguments);
    const S = this, p = S.player;
    const end = () => {
      try { c.glow.destroy(); c.ring.destroy(); } catch (e) {} (c.ck || []).forEach(o => { try { o.destroy(); } catch (e) {} });
      if (c.rim && p._ckRimFin) p._ckRimFin();
      try { sfx.fxStop('thunder_hold'); } catch (e) {}
      S.thunderCharge = null;
    };
    if (S.isDead || S._doorTransition) { end(); S.isCastingThunder = false; S.isAttacking = false; return; }
    const now = S.time.now, held = now - c.start;
    const cur = p.anims.currentAnim && p.anims.currentAnim.key;
    if (cur !== 'wizard_thunder_raise' && S.anims.exists('wizard_thunder_raise')) { p.play('wizard_thunder_raise'); p.anims.setProgress && p.anims.setProgress(1); }
    const keyDown = (S.keySpin && S.keySpin.isDown) || (S.keyUltimate && S.keyUltimate.isDown) || (S._thunderTestHold && held < S._thunderTestHold);
    const level = held >= TR.l3 ? 3 : held >= TR.l2 ? 2 : 1;
    const k = p.scaleX, dir = p.flipX ? -1 : 1, gx = p.x + dir * 6.5 * k, gy = p.y - 18 * k;
    if (!c.ck) { c.ck = []; const s = cargaRayo(S); if (s) c.ck.push(s); c.chispa = 0; }
    if (level > c.level) {
      c.level = level; const info = S.thunderLevelInfo(level);
      S.createFloatingText(p.x, p.y - 46, level === 3 ? '¡CARGA MÁXIMA!' : 'CARGA 2', info.color);
      S.cameras.main.shake(90, level === 3 ? 0.004 : 0.002);
      try { sfx.fx('ice_cast', 0.5, { rate: level === 3 ? 1.5 : 1.2 }); } catch (e) {}
      c.pulse = now; pulsoCarga(S, p, level, level === 3 ? 0xfde68a : 0x38bdf8);
      if (level === 3 && !c.rim) { contorno(S, p, 0xfde68a, TR.auto); c.rim = true; }
    }
    const info = S.thunderLevelInfo(c.level), prog = Math.min(1, held / TR.l3);
    // la carga del báculo: crece con la carga
    const s = c.ck[0]; if (s && s.active) { s.setPosition(Math.round(gx), Math.round(gy)).setDepth(p.depth + 3).setScale(0.45 + prog * 0.45 + (c.level - 1) * 0.08); if (c.level === 3) s.setTint(0xfff3b0); }
    // partículas eléctricas: arcos chiquitos que saltan alrededor de Horos (más cuanto más carga) y chispas de pixelfx
    const g = c.glow; g.clear();
    const fl = 0.85 + Math.random() * 0.3, r0 = (2 + prog * 3 + (c.level - 1)) * Math.abs(k) / 1.2 * fl;
    g.fillStyle(info.color, 0.45); g.fillCircle(gx, gy, r0 * 1.6); g.fillStyle(0xffffff, 0.95); g.fillCircle(gx, gy, r0 * 0.7);
    for (let i = 0; i < 1 + c.level * 2; i++) {
      const a = R(0, Math.PI * 2), d = R(10, 20) * Math.abs(k) / 1.2, x0 = p.x + Math.cos(a) * d, y0 = p.y - 6 + Math.sin(a) * d * 0.8, b = a + R(-1.2, 1.2), l = R(5, 9) + c.level * 2;
      rayito(g, x0, y0, x0 + Math.cos(b) * l, y0 + Math.sin(b) * l, 3, 1.5, c.level === 3 ? 0xfde68a : 0x38bdf8, R(0.5, 1));
    }
    if (Math.random() < 0.25 + c.level * 0.12) rayito(g, gx, gy, gx + R(-14, 14), gy + R(-16, 6), 3, 2, info.color, 0.9);
    if (now - c.chispa > 300 - c.level * 70) { c.chispa = now; const a = R(0, Math.PI * 2), d = R(10, 22); fx(S, 'chispa_rayo', p.x + Math.cos(a) * d, p.y - 6 + Math.sin(a) * d * 0.8, { escala: 0.22 + c.level * 0.04, suma: true, giro: R(0, 6.28), prof: p.depth + 2 }); }
    // la guardia arcana (como en el juego)
    const gf = c.guardFlash ? Math.max(0, 1 - (now - c.guardFlash) / 350) : 0;
    if (!c.guardUsed || gf > 0) { g.lineStyle(gf > 0 ? 3 : 1, 0xbae6fd, gf > 0 ? gf : 0.22 + 0.1 * Math.sin(now / 120)); g.strokeEllipse(p.x, p.y + 2 * k, 26 * k + gf * 8, 30 * k + gf * 8); }
    if (c.level === 3) { g.fillStyle(0xfef08a, 0.08 + 0.06 * Math.sin(now / 60)); g.fillCircle(p.x, p.y, 20 * k); }
    // el alcance en el piso: un aro eléctrico (trazos que titilan) y uno de afuera que se cierra cada medio segundo
    const cx = p.body ? p.body.center.x : p.x, cy = p.body ? p.body.bottom : p.y + 12, SQ = 0.72, RR = info.radius;
    const pulse = c.pulse ? Math.max(0, 1 - (now - c.pulse) / 300) : 0, rg = c.ring; rg.clear();
    const N = 30;
    for (let i = 0; i < N; i++) {
      if ((i + Math.floor(now / 90)) % 3 === 0) continue;
      const a0 = i / N * Math.PI * 2 + now / 2400, a1 = a0 + Math.PI * 2 / N * 0.7;
      rg.lineStyle(1 + Math.round(pulse * 2), info.color, (0.35 + 0.3 * Math.random()) + pulse * 0.4);
      rg.beginPath(); rg.moveTo(Math.round(cx + Math.cos(a0) * RR), Math.round(cy + Math.sin(a0) * RR * SQ)); rg.lineTo(Math.round(cx + Math.cos(a1) * RR), Math.round(cy + Math.sin(a1) * RR * SQ)); rg.strokePath();
    }
    const v = (now % 500) / 500; rg.lineStyle(1, 0xe0f2fe, 0.5 * v); rg.strokeEllipse(cx, cy, RR * 2 * (1.25 - 0.25 * v * v), RR * 2 * SQ * (1.25 - 0.25 * v * v));
    // soltar (como en el juego)
    if ((!keyDown && held >= TR.minimo) || held >= TR.auto) {
      const lvl = c.level; end();
      if (S.anims.exists('wizard_thunder_slam')) p.play('wizard_thunder_slam');
      S.isInvulnerable = true;
      S.time.delayedCall(110, () => S.thunderStrike(lvl));
      S.time.delayedCall(lvl === 3 ? 900 : 560, () => { S.isCastingThunder = false; S.isAttacking = false; S.isInvulnerable = false; if (!S.isDead && p.active && S.playerHero === 'wizard') p.play('wizard_idle', true); });
    }
  };
  P.thunderStrike = function (level) {
    if (this.playerHero !== 'wizard' || !(window.CK_PIXELFX_ARTE && CK_PIXELFX_ARTE.hojas.pfx_trueno)) return ts0.apply(this, arguments);
    const S = this, p = S.player; if (S.isDead || !p.active) return;
    const info = S.thunderLevelInfo(level), RAD = info.radius, SQ = 0.72, big = level === 3;
    S.lastThunderTime = S.time.now;
    const cx = p.body ? p.body.center.x : p.x, cy = p.body ? p.body.bottom : p.y + 12, cam = S.cameras.main;
    try { if (big) { sfx.fx('thunder_epic', 1) || sfx.fx('thunder_strike', 1); sfx.fx('thunder_strike', 0.8, { rate: 0.8 }); } else sfx.fx('thunder_strike', level === 2 ? 1 : 0.8, { rate: level === 2 ? 0.92 : 1.08 }); } catch (e) {}
    try { window.CK_SONIDOS && CK_SONIDOS.son && CK_SONIDOS.son('trueno_ulti', big ? 1 : 0.55 + level * 0.1, { rate: big ? 0.92 : 1.05 }); } catch (e) {}
    // el destello (al máximo, doble, como un rayo de verdad) y el temblor
    const fl = crea(S, () => S.add.rectangle(cam.worldView.centerX, cam.worldView.centerY, cam.worldView.width + 60, cam.worldView.height + 60, big ? 0xfffbeb : 0xdbeafe, [0, 0.12, 0.18, 0.26][level]).setDepth(99990));
    S.tweens.add({ targets: fl, alpha: 0, duration: big ? 160 : 200, onComplete: () => { if (!big) fl.destroy(); } });
    if (big) S.time.delayedCall(210, () => { if (fl.active) { fl.setAlpha(0.2); S.tweens.add({ targets: fl, alpha: 0, duration: 380, onComplete: () => fl.destroy() }); } });
    cam.shake([0, 200, 320, 750][level], [0, 0.005, 0.011, 0.024][level]);
    luz(cx, cy - 30, big ? [255, 240, 190] : [190, 225, 255], 150 + level * 60, 650);
    // los rayos: el del medio sobre Horos y, con más carga, otros alrededor (de a uno, rápido)
    // (el rayo va normal, que se vea igual en la arena o en el pasto, y encima una copia sumada que lo hace brillar sin quemar todo)
    const esc = [0, 0.9, 1.1, 1.5][level];
    fx(S, 'pfx_trueno', cx, cy, { escala: esc, prof: Math.round(cy) + 40 });
    fx(S, 'pfx_trueno', cx, cy, { escala: esc, suma: true, alfa: big ? 0.55 : 0.4, prof: Math.round(cy) + 41 });
    if (big) S.time.delayedCall(60, () => fx(S, 'pfx_trueno', cx + 3, cy, { escala: 1.25, alfa: 0.85, flip: true, prof: Math.round(cy) + 39 }));     // (dos, cruzados: más grueso)
    const alrededor = [[], [], [-1, 1], [0, 1, 2, 3]][level];
    alrededor.forEach((q, i) => S.time.delayedCall(80 + i * 85, () => {
      const a = level === 2 ? (q < 0 ? Math.PI : 0) : Math.PI / 4 + q * Math.PI / 2, x = cx + Math.cos(a) * RAD * 0.7, y = cy + Math.sin(a) * RAD * 0.7 * SQ;
      fx(S, 'pfx_trueno', x, y, { escala: big ? 0.95 : 0.75, prof: Math.round(y) + 40 }); fx(S, 'pfx_trueno', x, y, { escala: big ? 0.95 : 0.75, suma: true, alfa: 0.35, prof: Math.round(y) + 41 });
      fx(S, 'chispa_rayo', x, y - 4, { escala: 0.5, suma: true });
    }));
    // la onda en el piso: al máximo, el trueno que estalla y el anillo de mini rayos que se agranda y se apaga
    if (big) {
      fx(S, 'pfx_trueno_onda', cx, cy, { escala: 1.05, prof: Math.round(cy) - 2 });
      ondaRayitos(S, cx, cy, RAD * 1.4, 900, 22, 0xfde68a);
      S.time.delayedCall(150, () => ondaRayitos(S, cx, cy, RAD * 1.1, 700, 14, 0x38bdf8));
      for (let i = 0; i < 8; i++) S.time.delayedCall(250 + i * 90, () => { const a = R(0, Math.PI * 2), d = R(0.2, 1) * RAD; fx(S, 'chispa_rayo', cx + Math.cos(a) * d, cy + Math.sin(a) * d * SQ, { escala: R(0.3, 0.5), suma: true, giro: R(0, 6.28) }); });
    } else ondaRayitos(S, cx, cy, RAD, level === 2 ? 600 : 480, level === 2 ? 12 : 9, 0x38bdf8);
    // el daño (como en el juego: todo lo que está dentro del aro, nunca Horos)
    if (S.enemies) S.enemies.getChildren().slice().forEach(e => {
      if (!e.active || e.isDead) return;
      const dx = e.x - cx, dy = (e.y + 10 - cy) / SQ;
      if (Math.hypot(dx, dy) <= RAD + 10) { S.damageEnemy(e, info.damage, cx, cy); if (e.active && e.setTint) { e.setTint(0x7dd3fc); S.time.delayedCall(180, () => e.active && e.clearTint()); } }
    });
  };

  // ------------------------------------------------------------------ envolver
  const REHECHAS = ['misiles', 'drenaje', 'meteoro', 'mordisco', 'desgarro', 'espiritu', 'grito', 'b_remolino'];   // sus efectos están acá
  const envolver = () => {
    const H = HB() && HB().HACER, E = EQ(), V = VX(); if (!H) return;
    const poner = (T, id, nuevo, heroe) => {
      const f0 = T && T[id]; if (!f0 || f0._ckPed) return;
      const f = function (S) { if (!S || !S.player || (heroe && S.playerHero !== heroe)) return f0.apply(this, arguments); try { registrar(S); texturas(S); return nuevo.call(this, S, f0, this, arguments); } catch (e) { console.warn('[héroes]', id, e); return f0.apply(this, arguments); } };
      Object.keys(f0).forEach(k => (f[k] = f0[k])); f._ckPed = true; f._ckFx = f0._ckFx; f._ckBac = f0._ckBac; T[id] = f;
    };
    Object.keys(H_LANCENT).forEach(id => poner(H, id, H_LANCENT[id], 'soldier'));
    Object.keys(H_HOROS).forEach(id => poner(H, id, H_HOROS[id], 'wizard'));
    Object.keys(H_URSO).forEach(id => poner(H, id, H_URSO[id], 'bear'));
    if (E && E.hacerBase) poner(E.hacerBase, 'b_remolino', S => remolino(S), 'bear');
    [H, E && E.hacerBase].forEach(T => { if (T) Object.keys(H_ABY).forEach(id => poner(T, id, H_ABY[id], 'swordsman')); });
    [H, E && E.hacerBase].forEach(T => { if (T) Object.keys(H_HOROS2).forEach(id => poner(T, id, H_HOROS2[id], 'wizard')); });      // (v4) el anillo de llamas
    try { const B = E && E.BASE && E.BASE.b_trueno; if (B && B.d) B.d = B.d.replace('(hasta 3 s)', '(hasta 2 s)'); } catch (e) {}
    const ED = window.CK_EDITOR_HAB;
    if (V && V.DESPUES) {
      // las rehechas: sus efectos de siempre ya no (si el dueño les suma capas en el editor, esas sí corren)
      REHECHAS.forEach(id => { const AJh = ED && ED.AJ && ED.AJ().heroes[id]; if (AJh && AJh.capas) return; const n = () => {}; n._ckPed = true; V.DESPUES[id] = n; });
      // avalancha: el destello fuerte (ulti) junto con el primer pico, cuando golpea el piso
      const ava = V.DESPUES.avalancha; if (ava && !ava._ckPed && !(ED && ED.AJ && ED.AJ().heroes.avalancha)) {
        const a = S => {
          const p = S.player, [dx, dy] = dir(S);
          S.time.delayedCall(230, () => V.ulti && V.ulti(S, 'bear', p.x, V.pie(p).y, 1.1));
          for (let i = 1; i <= 5; i++) S.time.delayedCall(120 + i * 110, () => { const x = p.x + dx * i * 34, y = V.pie(p).y + dy * i * 28; V.fx(S, 'pinchos', x, y + 4, { escala: 0.9 + i * 0.08 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'hielo', x, y, 30 + i * 6, 300); if (i === 5) V.fx(S, 'suelo', x, y, { escala: 0.9, prof: Math.round(y) - 6 }); });
        };
        a._ckPed = true; V.DESPUES.avalancha = a;
        try { if (ED && ED.DESP && ED.DESP.avalancha && ED.DESP.avalancha[0] && ED.DESP.avalancha[0].ef === '@ulti') ED.DESP.avalancha[0].ret = 230; } catch (e) {}
      }
    }
    // estados: sin las rayas del grito ni el aura del espíritu (ahora son el contorno)
    try { const ES = window.CK_ESTADOS; if (ES && ES.BUF) { if (ES.BUF.grito) ES.BUF.grito.fx = null; if (ES.BUF.bosque) { ES.BUF.bosque.fx = null; ES.BUF.bosque.total = 5000; } } } catch (e) {}
    // el editor: las rehechas se ven leídas enteras del juego (sus efectos ya no son capas)
    try { if (ED && ED.DESP) REHECHAS.forEach(id => { ED.DESP[id] = []; }); } catch (e) {}
  };
  // (v3) el espíritu del bosque lo agranda un poco mientras dura y al terminar vuelve a su tamaño ("cuando usa la fuerza de la
  // naturaleza se vuelve un poco más grande y cuando termina el efecto vuelve a su tamaño original"). Crece y se achica suave.
  // Si mientras tanto otro cambia su escala (al cambiar de mapa), esa pasa a ser su tamaño de siempre.
  const ESP_GRANDE = { k: 1.2, crece: 260, achica: 380 };
  const agrandar = S => {
    const p = S.player; if (!p || !p.active) return;
    const quiere = esp(S) ? ESP_GRANDE.k : 1, k0 = p._ckEspK || 1;
    if (quiere === 1 && k0 === 1) { p._ckEspAp = null; return; }
    if (p._ckEspAp == null || Math.abs(p.scaleY - p._ckEspAp) > 1e-4) { p._ckEspBase = p.scaleY; p._ckEspRx = p.scaleX / (p.scaleY || 1); }
    const ms = quiere > k0 ? ESP_GRANDE.crece : ESP_GRANDE.achica, paso = Math.abs(ESP_GRANDE.k - 1) * Math.min(1, (S.game.loop.delta || 16) / ms);
    let k = quiere > k0 ? Math.min(quiere, k0 + paso) : Math.max(quiere, k0 - paso);
    if (Math.abs(k - quiere) < 1e-3) k = quiere;
    if (k !== k0 && k === quiere) {                              // llegó: un soplo de partículas verdes
      try { estallar(S, p.x, p.y - 4, [125, 255, 154], quiere > 1 ? 10 : 14, quiere > 1 ? 30 : 40, p.depth + 2); } catch (e) {}
    }
    p._ckEspK = k;
    p.setScale(p._ckEspBase * k * (p._ckEspRx || 1), p._ckEspBase * k);
    p._ckEspAp = k === 1 ? null : p.scaleY;
  };
  const up0 = P.update;
  P.update = function (time) {
    const r = up0.apply(this, arguments);
    try {
      registrar(this);
      const H = window.CK_HABILIDADES && window.CK_HABILIDADES.HACER;
      if (H && H.nova && H.nova._ckFx && (H.nova._ckBac || !window.CK_HOROS_BACULO) && !(H.grito && H.grito._ckPed)) envolver();
      // el espíritu del bosque: más rápido (como el frenesí)
      if (esp(this) && this.player && this.player.body && !this.isDashing && !this.isAttacking) { const v = this.player.body.velocity; this.player.body.setVelocity(v.x * 1.3, v.y * 1.3); }
      agrandar(this);
    } catch (e) {}
    return r;
  };
  window.CK_HEROES_PEDIDOS = { contorno, canalizar, estallar, empuje, H_LANCENT, H_HOROS, H_URSO, H_ABY, H_HOROS2, REHECHAS, DEMORA, DIR_EXTRA, ESP_GRANDE, LL, ANI, TR, REM, fijar, soltarAnim, registrar, animDe, ondaRayitos, rayito };
})();
