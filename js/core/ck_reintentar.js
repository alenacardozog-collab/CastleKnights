'use strict';
/* Punto de control antes de cada jefe y "Reintentar" (12/11, de la lista "haz todo eso").
   - Cuando empieza la pelea con un jefe (aparece su barra grande, ck_barras.js) se guarda el punto de control: dónde
     estaba el héroe unos segundos antes, lejos del jefe, y dónde estaba el jefe.
   - Si el héroe cae en esa pelea, en vez de despertar al principio de la zona sale un cartel:
       · REINTENTAR: vuelve al punto de control con la vida llena; el jefe vuelve a su lugar con la vida llena.
       · Volver al inicio de la zona: lo de siempre (con la pérdida de monedas de siempre).
   - Reintentar no cobra monedas: la pelea se repite tal cual.
   Necesita ck_barras.js. Borrar su línea de index.html deja la caída de siempre.
   v2 (22/11, pedido del dueño: "pulí eso para cuando necesitamos reintentar"): la pelea vuelve a quedar como al empezar.
   - EL JEFE: vuelve entero (vida, tamaño, giro, transparencia, color), sin la furia de la segunda mitad (su velocidad y su
     ritmo de antes, sin el velo del Nigromante), sin el golpe ni la habilidad que tenía a medio hacer, quieto y mirándote,
     y te persigue recién al segundo.
   - LOS QUE LLAMÓ durante la pelea (esqueletos, lobos, orcos) se van; los flechazos y hechizos que quedaban volando también
     (antes no se borraban).
   - EL HÉROE: vida y aguante llenos, sin lentitud, raíces ni veneno, sin una animación trabada, y con las pociones y elixires
     que tenía al empezar la pelea (si juntaste más en el medio, te quedás con las que tengas).
   v3 (23/11, nota 3 del dueño: "cuando caemos y reintentamos, volvemos al último checkpoint o se repite la cinemática de las
   cosas; si esto amerita, los personajes vuelven a las posiciones del principio; esto para todas las instancias del juego que
   lo necesiten"): EL PUNTO DE CONTROL DE CADA ZONA.
   - Al entrar a cada mapa (los del Taller, el castillo y las ruinas) se guarda una foto de la historia tal como estaba.
   - Si en esa visita corrió una escena (una cinemática: la marcha de Bruno, Gorvak que salta, Garra Negra, el Gran
     Esqueleto…) o hay una batalla de las de Bruno, al caer el cartel ofrece REINTENTAR: la historia vuelve a como estaba al
     entrar y se entra de nuevo al mapa por donde se había entrado, así la escena se repite y todos (aliados, enemigos,
     el jefe) vuelven a sus lugares del principio. Con la vida y el aguante llenos, sin veneno; las pociones y elixires como
     al entrar (o las que tengas, si juntaste más). No cobra monedas.
   - Si además había un jefe peleando, sigue la opción de antes ("Seguir desde el punto de control": al lado del jefe, sin
     repetir la escena). Sin escena ni batalla, el cartel de jefe es el de antes; sin jefe, la caída de siempre. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof document === 'undefined') return;
  const P = MainGameScene.prototype;
  const LEJOS = 150;
  const jefeActivo = () => { const B = window.CK_BARRAS, j = B && B.activa && B.activa(); return j && j.active && !j.isDead ? j : null; };
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');

  // ------------------------------------------------------------------ el rastro del héroe y el punto de control
  const rastro = (S) => {
    const now = S.time.now;
    if (!S.player || S.isDead || S._ckEscena) return;
    const r = S._ckRastro || (S._ckRastro = []);
    if (!r.length || now - r[r.length - 1].t > 500) {
      r.push({ t: now, x: S.player.x, y: S.player.y, z: zona(S) });
      while (r.length > 16) r.shift();
    }
  };
  const elegirPunto = (S, j) => {
    const z = zona(S), r = (S._ckRastro || []).filter(p => p.z === z);
    // el más reciente que quede lejos del jefe; si ninguno, el más lejano
    let mejor = null;
    for (let i = r.length - 1; i >= 0; i--) if (Math.hypot(r[i].x - j.x, r[i].y - j.y) >= LEJOS) { mejor = r[i]; break; }
    if (!mejor && r.length) mejor = r.reduce((a, b) => (Math.hypot(b.x - j.x, b.y - j.y) > Math.hypot(a.x - j.x, a.y - j.y) ? b : a));
    return mejor ? { x: mejor.x, y: mejor.y } : { x: S.player.x, y: S.player.y };
  };
  // (v2) cómo estaba todo al empezar la pelea
  const foto = (S, j) => {
    const inv = (S.story && S.story.inv) || {};
    return {
      jefe: { def: j.def, rol: j._rol, sx: j.scaleX, sy: j.scaleY, ang: j.angle, flip: j.flipX, fases: j._ckFases ? JSON.parse(JSON.stringify(j._ckFases)) : undefined },
      enemigos: (S.enemies && S.enemies.getChildren ? S.enemies.getChildren() : []).slice(),
      inv: { potion: inv.potion || 0, elixir: inv.elixir || 0 }
    };
  };
  // (v3) la foto de la historia al entrar a cada mapa (antes de que los archivos de la zona toquen nada) y por dónde se entró
  const reentrable = z => /^ed_.+\.main$/.test(z) || /^(castle|ruins)\.\w+$/.test(z);
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    P[k] = function () {
      let F = null;
      try {
        const S = this; S._ckrZona = null;
        if (S._gameMode === 'campaign' && S.story && k === 'onAreaShown') F = { story: JSON.stringify(S.story), cine: false, batalla: false };
      } catch (e) { F = null; }
      const r = f0 ? f0.apply(this, arguments) : undefined;
      try {
        const S = this, z = zona(S), a = S.currentInterior && S.currentInterior.area;
        if (F && reentrable(z) && a) { F.z = z; F.pos = null; S._ckrZona = F; }      // por dónde se entró: en el primer cuadro
      } catch (e) {}
      return r;
    };
  });
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign') return r;
      rastro(this);
      const F = this._ckrZona;                                   // (v3) en esta visita hubo escena o batalla
      if (F && F.z === zona(this)) {
        if (this._ckEscena) F.cine = true; if (this._ckBat) F.batalla = true;
        const a = this.currentInterior && this.currentInterior.area, b = this.player && this.player.body;
        if (!F.pos && a && b && b.center.x > a.x && b.center.x < a.x + (a.w || 4000) && b.bottom > a.y && b.bottom < a.y + (a.h || 4000))
          F.pos = { x: Math.round(b.center.x - a.x), y: Math.round(b.bottom - a.y) };
      }
      const j = jefeActivo();
      if (j && (!this._ckControl || this._ckControl.jefe !== j)) {
        this._ckControl = { jefe: j, zona: zona(this), heroe: elegirPunto(this, j), jx: j.x, jy: j.y, foto: foto(this, j) };
      }
      if (this._ckControl && (!this._ckControl.jefe.active || this._ckControl.jefe.isDead || this._ckControl.zona !== zona(this))) this._ckControl = null;
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ el cartel
  const css = `
body.ckr-on #ck-ayuda, body.ckr-on #ck-nota, body.ckr-on #ck-recoge { display: none !important; }
#ck-reintentar { position: absolute; inset: 0; z-index: 90; display: none; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, rgba(40,4,4,.55), rgba(6,2,2,.88)); }
#ck-reintentar.on { display: flex; animation: ckrFondo .5s ease-out; }
@keyframes ckrFondo { from { opacity: 0; } to { opacity: 1; } }
#ck-reintentar .caja { text-align: center; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); color: #f3ead9; padding: 22px 34px 24px; min-width: 300px;
  background: linear-gradient(180deg, rgba(26,12,12,.94), rgba(14,8,8,.94)); box-shadow: inset 0 0 0 1px #8a2a1c, 0 0 0 2px #0b0607, 0 10px 30px rgba(0,0,0,.6); }
#ck-reintentar h2 { margin: 0; font-size: 34px; letter-spacing: 3px; color: #ff6a50; text-shadow: 0 3px 0 #2a0606; font-weight: 700; }
#ck-reintentar .ante { margin: 4px 0 18px; font-size: 17px; color: #d8c4a8; }
#ck-reintentar .ante b { color: #ffd6a8; }
#ck-reintentar button { display: block; width: 100%; margin: 8px 0 0; padding: 9px 18px; font: 700 19px var(--ck2-f, 'CK Grenze', Grenze, serif); cursor: pointer; letter-spacing: 1px;
  color: #2a1606; background: linear-gradient(180deg, #ffe08a, #e2a83a); border: 0; box-shadow: inset 0 -3px 0 #a0661a, 0 0 0 2px #2a1606; }
#ck-reintentar button.otro { color: #e6d8bc; background: linear-gradient(180deg, #4a3428, #2e2018); box-shadow: inset 0 -3px 0 #1a100a, 0 0 0 2px #0b0607; font-size: 16px; font-weight: 600; }
#ck-reintentar button:hover, #ck-reintentar button:focus-visible { filter: brightness(1.12); outline: 2px solid #fff3c8; outline-offset: 2px; }
#ck-reintentar .tecla { margin-top: 12px; font-size: 13px; color: #a89878; }
`;
  let caja = null;
  const host = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const armar = () => {
    if (!caja) {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      caja = document.createElement('div'); caja.id = 'ck-reintentar';   // (v3) con el botón del punto de control y una nota
      caja.innerHTML = '<div class="caja"><h2>CAÍSTE</h2><div class="ante"></div><button class="si">Reintentar</button><button class="otro pc">Seguir desde el punto de control</button><button class="otro sale">Volver al inicio de la zona</button><div class="tecla nota"></div><div class="tecla">Enter: reintentar</div></div>';
    }
    if (caja.parentElement !== host()) host().appendChild(caja);
    return caja;
  };
  const nombreJefe = () => { const n = document.querySelector('#ckb-jefe .ckb-nom'); return (n && (n.getAttribute('aria-label') || n.textContent || '').trim()) || ''; };

  let abierto = null;
  const cerrar = () => { if (caja) caja.classList.remove('on'); document.body.classList.remove('ckr-on'); document.removeEventListener('keydown', tecla, true); abierto = null; };
  const tecla = e => { if (!abierto) return; if (e.code === 'Enter' || e.code === 'KeyR') { e.preventDefault(); e.stopPropagation(); abierto.si(); } };

  // (v3) volver a entrar al mapa de la foto, por donde se había entrado (sin la llegada callada de una partida cargada)
  const volverAEntrar = (S, F) => {
    let m = /^ed_(.+)\.main$/.exec(F.z);
    if (m) return !!(S.ckEntrar && S.ckEntrar(m[1], F.pos ? { x: F.pos.x, y: F.pos.y - 10 } : undefined));
    m = /^(castle|ruins)\.(\w+)$/.exec(F.z);
    if (!m || !S.buildInterior || !S.showInteriorArea) return false;
    const tipo = m[1], nombre = m[2];
    S.fadeTransition(() => {
      if (S.setInteriorVisible) S.setInteriorVisible(null);
      const b = S.buildInterior(tipo === 'castle' ? { _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle', _ck: true } : { _houseName: 'Ruins', _interiorIndex: 7, _interiorKind: 'ruins' }),
        a = b.areas[nombre] || b.areas[b.start];
      S.currentInterior = { building: b, areaName: b.areas[nombre] ? nombre : b.start, area: a };
      S._areaSwitchHold = true;
      S.showInteriorArea(a, b.areas[nombre] && F.pos ? { x: a.x + F.pos.x, y: a.y + F.pos.y - 10 } : a.spawn);
    });
    return true;
  };
  const restaurar = (S, json) => {
    S._ckrPendiente = null;
    try {
      const inv = (S.story && S.story.inv) || {}, pot = inv.potion || 0, eli = inv.elixir || 0;   // las pociones: las de entonces o las que tengas
      const nueva = JSON.parse(json);
      Object.keys(S.story).forEach(k => { delete S.story[k]; });
      Object.assign(S.story, nueva);
      // el mapa se vuelve a armar con el mismo dibujo (el Taller lo guarda) y lo que cada archivo arma "al llegar" a un área
      // se rehace sólo si se fue de ella. Acá no se sale: la batalla de Bruno (ck_batalla_orca.js) se suelta a mano
      try { const B2 = S._ckBat; if (B2) { (B2.extra || []).concat(B2.nombre ? [B2.nombre] : []).forEach(o => { try { o.destroy(); } catch (e) {} }); S._ckBat = null; } } catch (e) {}
      if (S.story.inv) { S.story.inv.potion = Math.max(S.story.inv.potion || 0, pot); S.story.inv.elixir = Math.max(S.story.inv.elixir || 0, eli); }
      S.saveStory && S.saveStory();
      S.updateQuickBar && S.updateQuickBar(); S.updateObjective && S.updateObjective();
    } catch (e) { console.warn('[reintentar] historia', e); }
  };
  const ft0 = P.fadeTransition;
  if (ft0) P.fadeTransition = function (cb) {
    const S = this;
    if (S._ckrPendiente && typeof cb === 'function') {
      const json = S._ckrPendiente, args = Array.prototype.slice.call(arguments);
      args[0] = function () { if (S._ckrPendiente === json) restaurar(S, json); return cb.apply(this, arguments); };
      return ft0.apply(this, args);
    }
    return ft0.apply(this, arguments);
  };
  const revivir = S => {
    S.health = S.maxHealth;
    S.isDead = false; S.isAttacking = false; S.isInvulnerable = false; S.isDashing = false; S.isSpinning = false;
    S.player.setAlpha(1).clearTint();
    S.player.play(`${S.playerHero}_idle`);
    S.player.setVelocity && S.player.setVelocity(0, 0);
  };
  const repetir = (S, F) => {
    const cam = S.cameras.main;
    // (la entrada al mapa ya oscurece y aclara la pantalla: acá no se hace otro fundido)
    {
      revivir(S);
      // la historia como al entrar: se pone justo al cambiar de mapa (en el fundido), así lo que todavía corre en el mapa
      // de ahora (la batalla, sus contadores) no la vuelve a tocar antes de entrar; si no hay fundido, enseguida
      S._ckrPendiente = F.story;
      S.time.delayedCall(1500, () => { if (S._ckrPendiente) restaurar(S, S._ckrPendiente); });
      try { limpiarHeroe(S, null); } catch (e) {}
      ['enemyShots', 'enemyProjectiles'].forEach(k => { try { const g = S[k]; if (g && g.getChildren) g.getChildren().slice().forEach(p => p.destroy()); } catch (e) {} });
      S._ckControl = null; S._ckRastro = [];
      if (S.physics.world.isPaused) S.physics.world.resume();
      if (S.anims.paused) S.anims.resumeAll();
      S.isInvulnerable = true; S.time.delayedCall(2500, () => { S.isInvulnerable = false; });
      S.updateHUD && S.updateHUD(); S.updateQuickBar && S.updateQuickBar();
      let ok = false;
      try { ok = volverAEntrar(S, F); } catch (e) { console.warn('[reintentar] entrar', e); }
      if (!ok) { cam.centerOn(S.player.x, S.player.y); d0.apply(S); }          // no se pudo volver a entrar: la caída de siempre
    }
  };
  const reintentar = (S, c) => {
    const cam = S.cameras.main;
    cam.fadeOut(350, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      S.health = S.maxHealth;
      S.isDead = false; S.isAttacking = false; S.isInvulnerable = false; S.isDashing = false; S.isSpinning = false;
      S.player.setAlpha(1).clearTint();
      S.player.play(`${S.playerHero}_idle`);
      S.player.setPosition(c.heroe.x, c.heroe.y); S.player.setVelocity && S.player.setVelocity(0, 0);
      const j = c.jefe;
      if (j && j.active && !j.isDead) {
        j.hp = j.maxHp; j.setPosition(c.jx, c.jy); j.body && j.body.setVelocity(0, 0);
        j.state = 'idle'; j.clearTint && j.clearTint();
        try { limpiarJefe(S, j, c.foto && c.foto.jefe); } catch (e) {}
      }
      // fuera los proyectiles enemigos que quedaron volando ((v2) el grupo se llama enemyShots)
      ['enemyShots', 'enemyProjectiles'].forEach(k => { try { const g = S[k]; if (g && g.getChildren) g.getChildren().slice().forEach(p => p.destroy()); } catch (e) {} });
      // (v2) los que el jefe llamó durante la pelea se van
      try {
        const antes = (c.foto && c.foto.enemigos) || null;
        if (antes && S.enemies) S.enemies.getChildren().slice().forEach(e => {
          if (e === j || antes.indexOf(e) >= 0 || !e.active || e.isDead) return;
          e.destroy();                                   // (su barra y su nombre se van con él)
        });
      } catch (e) {}
      // (v2) el héroe como al empezar
      try { limpiarHeroe(S, c.foto); } catch (e) {}
      S.isInvulnerable = true; S.time.delayedCall(1500, () => { S.isInvulnerable = false; });
      if (S.physics.world.isPaused) S.physics.world.resume();
      if (S.anims.paused) S.anims.resumeAll();
      cam.centerOn(S.player.x, S.player.y);
      S.updateHUD && S.updateHUD();
      cam.fadeIn(450, 0, 0, 0);
    });
  };

  // (v2) el jefe sin nada a medio hacer y sin la furia de la segunda mitad
  const limpiarJefe = (S, j, f) => {
    S.tweens.killTweensOf(j);
    j.swingId = (j.swingId || 0) + 1;                 // cancela el golpe que tenía cargado
    j.isAttacking = false; j.attackCooldown = S.time.now + 1200;
    j._ckAnt = null; j._ckEsp = null; j._ckEspCd = {}; j._ckEspVio = null; j._ckRolHasta = 0;
    j._ckIntangible = false; j._ckVioMuertos = false; j._ckPisoAt = 0;
    if (f) {
      if (f.def) j.def = f.def;
      j._rol = f.rol;
      if (f.fases !== undefined) j._ckFases = JSON.parse(JSON.stringify(f.fases));
      j.setScale(f.sx, f.sy); j.setAngle(f.ang || 0); j.setFlipX(!!f.flip);
    }
    j.setAlpha(1); j.clearTint();
    if (S.anims.exists(j.type + '_idle')) j.play(j.type + '_idle', true);
    S.time.delayedCall(1000, () => { if (j.active && !j.isDead && j.state === 'idle') j.state = 'chase'; });
  };
  const limpiarHeroe = (S, f) => {
    S.stamina = S.maxStamina || S.stamina;
    S._ckAnimFija = 0; S._ckAtrapado = 0; S._ckLentoHasta = 0; S._ckVeneno = null; S._ckVenenoJ = 0;
    S.isCastingThunder = false;
    const inv = S.story && S.story.inv, ant = f && f.inv;
    if (inv && ant) { inv.potion = Math.max(inv.potion || 0, ant.potion); inv.elixir = Math.max(inv.elixir || 0, ant.elixir); }
    if (S.player.anims && S.player.anims.isPaused) S.player.anims.resume();
  };

  const d0 = P.campaignDefeat;
  P.campaignDefeat = function () {
    const S = this, c = S._ckControl, F = S._ckrZona;
    const hayJefe = !!(c && c.jefe && c.jefe.active && !c.jefe.isDead && c.zona === zona(S));
    const hayZona = !!(F && F.z === zona(S) && (F.cine || F.batalla) && F.story);       // (v3)
    if (!hayJefe && !hayZona) return d0.apply(this, arguments);
    const el = armar();
    let nom = '';
    if (hayJefe) { const d = c.jefe.def || {}; nom = nombreJefe() || (c.jefe.type === 'werebear_jefe' ? 'Garra Negra' : (d.name || d.nombre || '').split(',')[0]); }
    el.querySelector('.ante').innerHTML = nom ? `ante <b>${nom.replace(/[<&]/g, '')}</b>` : 'en la pelea';
    // (v3) con escena o batalla: Reintentar repite desde la entrada; con jefe, además, seguir desde el punto de control
    const pc = el.querySelector('.pc'), nota = el.querySelector('.nota');
    pc.style.display = hayZona && hayJefe ? '' : 'none';
    nota.textContent = hayZona ? 'Reintentar: todo vuelve a como estaba al entrar, con su escena' : '';
    nota.style.display = hayZona ? '' : 'none';
    S.physics.world.pause();
    el.classList.add('on'); document.body.classList.add('ckr-on');
    const si = () => { if (!abierto) return; cerrar(); if (hayZona) repetir(S, F); else reintentar(S, c); };
    const punto = () => { if (!abierto) return; cerrar(); reintentar(S, c); };
    const no = () => { if (!abierto) return; cerrar(); S._ckControl = null; if (S.physics.world.isPaused) S.physics.world.resume(); d0.apply(S); };
    abierto = { si, no };
    el.querySelector('.si').onclick = si;
    pc.onclick = punto;
    el.querySelector('.sale').onclick = no;
    document.addEventListener('keydown', tecla, true);
    setTimeout(() => { try { el.querySelector('.si').focus(); } catch (e) {} }, 50);
  };
  // salir al menú con el cartel abierto
  ['returnToStartMenu', 'startCampaign'].forEach(k => {
    const f0 = P[k];
    if (typeof f0 === 'function') P[k] = function () { cerrar(); this._ckControl = null; return f0.apply(this, arguments); };
  });
  window.CK_REINTENTAR = { punto: S => S._ckControl, zona: S => S._ckrZona, repetir, volverAEntrar };
})();
