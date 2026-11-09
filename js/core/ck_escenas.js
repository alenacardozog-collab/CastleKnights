'use strict';
/* Escenas cortas (02/11): lo que usan la intro de la posada, los eventos de la aldea y las charlas.
   - CK_ESCENA.correr(S, async () => {...}): franjas negras arriba y abajo, el HUD se esconde, el héroe no se mueve ni pelea.
   - actor / caminar / globo / dialogo / camara / esperar: piezas para armar la escena.
   - globo(): un globito chico sobre la cabeza (no los carteles grandes que el dueño sacó en ck_sin_carteles.js).
   No cambia nada por sí solo: lo usan ck_intro.js, ck_gente.js y ck_heroes_npc.js. Borrar su línea apaga esos tres. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  // ------------------------------------------------------------------ franjas y HUD
  const css = () => {
    if (document.getElementById('ck-escena-css')) return;
    const st = document.createElement('style');
    st.id = 'ck-escena-css';
    st.textContent = `
.ck-franja { position: absolute; left: 0; right: 0; height: 0; background: #000; z-index: 8000; pointer-events: none; transition: height .45s ease; }
.ck-franja.arriba { top: 0; } .ck-franja.abajo { bottom: 0; }
.ck-franja.on { height: min(7vh, 60px); }
/* el cuadro de diálogo queda arriba de la franja de abajo, entero (antes la franja le tapaba el último renglón) */
body.ck-escena #ck-dialog { bottom: calc(min(7vh, 60px) + 8px) !important; z-index: 8001 !important; transition: bottom .45s ease, opacity .2s; }
body.ck-escena .ck2-hud, body.ck-escena #ck-minimapa, body.ck-escena #ck-objective, body.ck-escena .in-game-hud,
body.ck-escena #ck-prompt, body.ck-escena #ck-ayuda, body.ck-escena #ck-nota { opacity: 0 !important; transition: opacity .3s; }`;
    document.head.appendChild(st);
  };
  const anfitrion = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const franjas = on => {
    css();
    ['arriba', 'abajo'].forEach(k => {
      let f = document.querySelector('.ck-franja.' + k);
      if (!f) { f = document.createElement('div'); f.className = 'ck-franja ' + k; }
      if (f.parentElement !== anfitrion()) anfitrion().appendChild(f);
      requestAnimationFrame(() => f.classList.toggle('on', on));
    });
  };

  // mientras corre una escena el héroe se queda quieto y no pelea
  const mov0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    if (this._ckEscena && this.player) {
      this.player.setVelocity(0, 0);
      if (!this._ckEscenaAnim) {
        const k = this.playerHero + '_idle';
        if (this.anims.exists(k)) this.player.play(k, true);
      }
      return;
    }
    return mov0.apply(this, arguments);
  };
  const lock0 = P.combatLocked;
  P.combatLocked = function () { return !!this._ckEscena || lock0.apply(this, arguments); };

  // ------------------------------------------------------------------ piezas
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const area = S => (S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 });
  /** Animaciones idle/walk para una textura recoloreada a partir de las de otra (mismos cuadros). */
  const animsDe = (S, tex, base) => {
    ['idle', 'walk'].forEach(q => {
      const k = tex + '_' + q, b = S.anims.get(base + '_' + q);
      if (S.anims.exists(k) || !b) return;
      S.anims.create({ key: k, frames: b.frames.map(f => ({ key: tex, frame: f.frame.name })), frameRate: b.frameRate, repeat: -1 });
    });
  };
  /** Copia una hoja de 32×32 cambiando colores (fn(r,g,b) -> [r,g,b] o null). */
  const recolor = (S, de, a, fn) => {
    if (S.textures.exists(a) || !S.textures.exists(de)) return;
    const img = S.textures.get(de).getSourceImage();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) if (px[i + 3]) { const o = fn(px[i], px[i + 1], px[i + 2]); if (o) { px[i] = o[0]; px[i + 1] = o[1]; px[i + 2] = o[2]; } }
    g.putImageData(d, 0, 0);
    S.textures.addSpriteSheet(a, c, { frameWidth: 32, frameHeight: 32 });
  };
  /** Un personaje de la aldea (hoja npcN de 32×32) parado con los pies en (x, y) del área actual. */
  const actor = (S, tex, x, y, o = {}) => {
    const a = o.mundo ? { x: 0, y: 0 } : area(S);
    const sp = S.add.sprite(a.x + x, a.y + y, tex).setOrigin(0.5, 1).setScale(o.escala || (S.currentInterior ? 1.5 : 1.3)).setDepth(a.y + y);
    const base = o.anim || tex.replace(/_villager$/, '');
    sp._ckAnim = base;
    if (S.anims.exists(base + '_idle')) sp.play(base + '_idle');
    if (o.flip) sp.setFlipX(true);
    return sp;
  };
  /** Camina hasta (x, y) del área (o del mundo con o.mundo). */
  const caminar = (S, sp, x, y, vel = 42, o = {}) => new Promise(r => {
    if (!sp || !sp.active) return r();
    const a = o.mundo ? { x: 0, y: 0 } : area(S), tx = a.x + x, ty = a.y + y;
    const d = Phaser.Math.Distance.Between(sp.x, sp.y, tx, ty);
    if (Math.abs(tx - sp.x) > 1) sp.setFlipX(tx < sp.x);
    const b = sp._ckAnim;
    if (b && S.anims.exists(b + '_walk')) sp.play(b + '_walk', true);
    S.tweens.add({
      targets: sp, x: tx, y: ty, duration: Math.max(60, (d / vel) * 1000),
      onUpdate: () => sp.setDepth(sp.y),
      onComplete: () => { if (b && S.anims.exists(b + '_idle')) sp.play(b + '_idle', true); r(); }
    });
  });
  /** Globito chico arriba de alguien (sprite con los pies en su y). Se va solo. */
  const globo = (S, sp, texto, ms = 2600, alto) => new Promise(r => {
    if (!sp || !sp.active) return r();
    const t = S.add.text(0, 0, texto, {
      fontFamily: "'CK Grenze', Georgia, serif", fontSize: '10px', fontStyle: '600', color: '#2b1a0e',
      backgroundColor: 'rgba(243,230,200,0.93)', padding: { x: 4, y: 2 }, wordWrap: { width: 130 }, align: 'center'
    }).setOrigin(0.5, 1).setDepth(29400).setResolution(4).setAlpha(0);
    const h = alto || (sp.displayHeight ? sp.displayHeight * 0.92 : 40);
    const pos = () => { if (sp.active) t.setPosition(Math.round(sp.x), Math.round(sp.y - h)); };
    pos();
    const ev = S.time.addEvent({ delay: 30, loop: true, callback: pos });
    S.tweens.add({ targets: t, alpha: 1, duration: 140 });
    S.time.delayedCall(ms, () => {
      S.tweens.add({ targets: t, alpha: 0, duration: 200, onComplete: () => { ev.remove(); t.destroy(); r(); } });
    });
  });
  /** Diálogo de la historia: termina cuando el jugador lo cierra. */
  const dialogo = (S, nombre, lineas, cara) => new Promise(r => {
    let listo = false;
    const fin = () => { if (!listo) { listo = true; clearInterval(iv); r(); } };
    S.openDialog(nombre, lineas, fin, cara);
    // si el diálogo se cierra sin terminar (cambio de zona, menú), la escena sigue igual
    const iv = setInterval(() => { if (!S.dialogOpen || !S._dlg) fin(); }, 300);
  });
  /** Lleva la cámara a (x, y) del área; seguir(S) la devuelve al héroe. */
  const camara = (S, x, y, ms = 900) => new Promise(r => {
    const a = area(S), cam = S.cameras.main;
    cam.stopFollow();
    let listo = false;
    const fin = () => { if (!listo) { listo = true; r(); } };
    cam.pan(a.x + x, a.y + y, ms, 'Sine.easeInOut', false, (c, p) => { if (p >= 1) fin(); });
    setTimeout(fin, ms + 400);
  });
  const seguir = S => { if (S.player) S.cameras.main.startFollow(S.player, true, 0.09, 0.09); };

  const correr = async (S, fn) => {
    if (!S || S._ckEscena) return false;
    S._ckEscena = true;
    css();
    document.body.classList.add('ck-escena');
    franjas(true);
    // seguro: si algo de la escena se cuelga (se cambió de zona a la mitad, por ejemplo), a los 90 s se suelta sola
    // y si el héroe cambia de zona en el medio, la escena se corta ahí (no queda congelado en otro mapa)
    const z0 = S.currentZoneKey ? S.currentZoneKey() : '';
    let iv;
    const cambio = new Promise(r => { iv = setInterval(() => { if (S.currentZoneKey && S.currentZoneKey() !== z0) r(); }, 250); });
    let completa = false;
    try { await Promise.race([fn().then(() => { completa = true; }), cambio, new Promise(r => setTimeout(r, 90000))]); } catch (e) { console.warn('[escena]', e); }
    clearInterval(iv);
    franjas(false);
    document.body.classList.remove('ck-escena');
    if (S.dialogOpen && S._dlg) { /* el diálogo se cierra solo */ }
    seguir(S);
    S._ckEscena = false;
    S._ckEscenaAnim = false;
    return completa;
  };

  // si la escena se corta por cambiar de zona o salir al menú, no queda trabada
  const fin0 = P.endStory;
  P.endStory = function () { this._ckEscena = false; document.body.classList.remove('ck-escena'); franjas(false); return fin0 ? fin0.apply(this, arguments) : undefined; };

  // sin cara (un cartel, un objeto): el retrato del diálogo queda vacío en vez de mostrar la cara del anterior
  const VACIA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';
  const abrir0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    const r = abrir0.apply(this, arguments);
    if (!face) { const im = document.querySelector('#ck-dialog .ck-dlg-portrait'); if (im) im.src = VACIA; }
    return r;
  };

  window.CK_ESCENA = { correr, esperar, actor, caminar, globo, dialogo, camara, seguir, recolor, animsDe, franjas, area };
})();
