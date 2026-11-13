'use strict';
/* Punto de control antes de cada jefe y "Reintentar" (12/11, de la lista "haz todo eso").
   - Cuando empieza la pelea con un jefe (aparece su barra grande, ck_barras.js) se guarda el punto de control: dónde
     estaba el héroe unos segundos antes, lejos del jefe, y dónde estaba el jefe.
   - Si el héroe cae en esa pelea, en vez de despertar al principio de la zona sale un cartel:
       · REINTENTAR: vuelve al punto de control con la vida llena; el jefe vuelve a su lugar con la vida llena.
       · Volver al inicio de la zona: lo de siempre (con la pérdida de monedas de siempre).
   - Reintentar no cobra monedas: la pelea se repite tal cual.
   Necesita ck_barras.js. Borrar su línea de index.html deja la caída de siempre. */
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
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign') return r;
      rastro(this);
      const j = jefeActivo();
      if (j && (!this._ckControl || this._ckControl.jefe !== j)) {
        this._ckControl = { jefe: j, zona: zona(this), heroe: elegirPunto(this, j), jx: j.x, jy: j.y };
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
      caja = document.createElement('div'); caja.id = 'ck-reintentar';
      caja.innerHTML = '<div class="caja"><h2>CAÍSTE</h2><div class="ante"></div><button class="si">Reintentar</button><button class="otro">Volver al inicio de la zona</button><div class="tecla">Enter: reintentar</div></div>';
    }
    if (caja.parentElement !== host()) host().appendChild(caja);
    return caja;
  };
  const nombreJefe = () => { const n = document.querySelector('#ckb-jefe .ckb-nom'); return (n && (n.getAttribute('aria-label') || n.textContent || '').trim()) || ''; };

  let abierto = null;
  const cerrar = () => { if (caja) caja.classList.remove('on'); document.body.classList.remove('ckr-on'); document.removeEventListener('keydown', tecla, true); abierto = null; };
  const tecla = e => { if (!abierto) return; if (e.code === 'Enter' || e.code === 'KeyR') { e.preventDefault(); e.stopPropagation(); abierto.si(); } };

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
      }
      // fuera los proyectiles enemigos que quedaron volando
      try { (S.enemyProjectiles && S.enemyProjectiles.getChildren ? S.enemyProjectiles.getChildren() : []).slice().forEach(p => p.destroy()); } catch (e) {}
      S.isInvulnerable = true; S.time.delayedCall(1500, () => { S.isInvulnerable = false; });
      if (S.physics.world.isPaused) S.physics.world.resume();
      if (S.anims.paused) S.anims.resumeAll();
      cam.centerOn(S.player.x, S.player.y);
      S.updateHUD && S.updateHUD();
      cam.fadeIn(450, 0, 0, 0);
    });
  };

  const d0 = P.campaignDefeat;
  P.campaignDefeat = function () {
    const S = this, c = S._ckControl;
    if (!c || !c.jefe || !c.jefe.active || c.jefe.isDead || c.zona !== zona(S)) return d0.apply(this, arguments);
    const el = armar();
    const d = c.jefe.def || {}, nom = nombreJefe() || (c.jefe.type === 'werebear_jefe' ? 'Garra Negra' : (d.name || d.nombre || '').split(',')[0]);
    el.querySelector('.ante').innerHTML = nom ? `ante <b>${nom.replace(/[<&]/g, '')}</b>` : 'en la pelea';
    S.physics.world.pause();
    el.classList.add('on'); document.body.classList.add('ckr-on');
    const si = () => { if (!abierto) return; cerrar(); reintentar(S, c); };
    const no = () => { if (!abierto) return; cerrar(); S._ckControl = null; if (S.physics.world.isPaused) S.physics.world.resume(); d0.apply(S); };
    abierto = { si, no };
    el.querySelector('.si').onclick = si;
    el.querySelector('.otro').onclick = no;
    document.addEventListener('keydown', tecla, true);
    setTimeout(() => { try { el.querySelector('.si').focus(); } catch (e) {} }, 50);
  };
  // salir al menú con el cartel abierto
  ['returnToStartMenu', 'startCampaign'].forEach(k => {
    const f0 = P[k];
    if (typeof f0 === 'function') P[k] = function () { cerrar(); this._ckControl = null; return f0.apply(this, arguments); };
  });
  window.CK_REINTENTAR = { punto: S => S._ckControl };
})();
