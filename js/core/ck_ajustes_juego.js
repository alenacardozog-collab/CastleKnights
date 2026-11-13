'use strict';
/* Ajustes de juego (12/11, pedidos del dueño, de a uno):
   1. "Ajustá la velocidad del personaje, siento que recorremos el mapa muy rápido": caminar 105 → 90, correr 160 → 138
      ("Pies ligeros" de Aby sigue sumando encima).
   2. "Que correr tenga un límite y luego se recargue": un ALIENTO propio para correr (no gasta el aguante ni el maná): dura
      unos 4 s seguidos; vacío, no se puede correr hasta que se recarga a un tercio; se recarga solo en ~5 s. Se ve como una
      barrita fina debajo del héroe sólo cuando no está lleno.
   3. "Que los proyectiles no sean infinitos: 10 flechas para Lancent, que se vayan regenerando de a 1 con una espera": carcaj
      de 10 flechas, vuelve 1 cada 3,5 s. Sin flechas, el disparo no sale y avisa. Se ven arriba del medallón (➶ 7/10).
      "Para Horos, que gaste maná, pero no tanto como las otras habilidades": la bola de fuego cuesta 10 de maná (las
      habilidades cuestan 25 a 50). Sin maná suficiente no sale y avisa.
   4. "Regulá la dificultad: subís de nivel muy rápido y tenés habilidades rápido": la experiencia para subir crece más
      (nivel 2: 60, 3: 150, 4: 265, 5: 410, 6: 585, 7: 785; antes 40, 85, 130, 175, 220, 265). Llegar al 7 cuesta unas 2,5 veces
      más. Las ranuras se siguen abriendo en los niveles de siempre (Q 4, E 5, R 6, F 7), así que llegan más tarde.
   5. "En el entrenamiento con Bruno quitá al soldado atravesado en el campo": mientras dura el entrenamiento, los guardias que
      patrullan el Patio de Armas se quedan quietos fuera del campo de práctica (y vuelven a su ronda al terminar).
   6. "Que los soldados del Rey no ataquen a los NPC enemigos, ni adentro ni afuera del castillo, al menos por ahora":
      los guardias y arqueros de los mapas ya no salen a pelear con las bestias (siguen su ronda).
   7. "Que le podamos pagar al tabernero por una cama para dormir": al terminar de hablar con el tabernero, ofrece la cama
      (el mismo reloj de sol de ck_camas.js, 8 monedas: elegís la hora o cancelás con Esc).
   Borrar su línea de index.html vuelve todo como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const nota = t => { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(t); } catch (e) {} };
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const campana = S => S._gameMode === 'campaign';

  // ================================================================== 1. velocidad
  const VEL = { caminar: 90, correr: 138, antes: [[105, 160], [115, 180]] };
  const velocidad = S => {
    const b = S._ckBase;
    if (b && !b._ckVel2) {
      b._ckVel2 = true;
      if (VEL.antes.some(a => a[0] === b.walk)) b.walk = VEL.caminar;
      if (VEL.antes.some(a => a[1] === b.run)) b.run = VEL.correr;
    }
    if (!S._ckVel2) {
      S._ckVel2 = true;
      if (VEL.antes.some(a => a[0] === S.playerSpeed)) S.playerSpeed = VEL.caminar;
      if (VEL.antes.some(a => a[1] === S.playerRunSpeed)) S.playerRunSpeed = VEL.correr;
    }
  };

  // ================================================================== 2. aliento para correr
  const ALI = { max: 100, gasto: 25, recarga: 20, vuelve: 34 };     // por segundo; "vuelve": desde cuánto se puede volver a correr
  const mov0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    const kr = this.keyRun;
    if (kr && kr.isDown && this._ckSinAliento) {
      const d = kr.isDown; kr.isDown = false;
      try { return mov0.apply(this, arguments); } finally { kr.isDown = d; }
    }
    return mov0.apply(this, arguments);
  };
  const aliento = (S, dt) => {
    if (S._ckAliento === undefined) S._ckAliento = ALI.max;
    const moviendo = S.player.body && S.player.body.speed > 20;
    if (S.isRunning && moviendo && !S._ckSinAliento && !S.dialogOpen && !S._overlay) {
      S._ckAliento = Math.max(0, S._ckAliento - ALI.gasto * dt);
      if (S._ckAliento <= 0) { S._ckSinAliento = true; son('breath', 0.35) || son('ck_ropa', 0.25, { rate: 0.8 }); }
    } else {
      S._ckAliento = Math.min(ALI.max, S._ckAliento + ALI.recarga * dt * (moviendo ? 0.7 : 1));
      if (S._ckSinAliento && S._ckAliento >= ALI.vuelve) S._ckSinAliento = false;
    }
    // la barrita: sólo cuando no está llena
    let g = S._ckAliG;
    if (!g || !g.active) g = S._ckAliG = S.add.graphics().setDepth(29500);
    g.clear();
    if (S._ckAliento < ALI.max - 0.5 && S.player.visible && !S._ckEscena) {
      const b = S.player.body, w = 22, x = Math.round(b.center.x - w / 2), y = Math.round(b.bottom + 4), f = S._ckAliento / ALI.max;
      g.fillStyle(0x000000, 0.55).fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle(S._ckSinAliento ? 0xb8321c : 0xe8e0c8, 0.95).fillRect(x, y, Math.max(1, Math.round(w * f)), 2);
    }
  };

  // ================================================================== 3. flechas de Lancent y maná de Horos
  const CARCAJ = { max: 10, cada: 3500 }, BOLA = 10;
  const carcaj = S => { if (S._ckFlechas === undefined) { S._ckFlechas = CARCAJ.max; S._ckFlechaT = 0; } return S._ckFlechas; };
  const sp0 = P.performSpecialAttack;
  P.performSpecialAttack = function () {
    if (this.combatLocked && this.combatLocked() || this.isAttacking || this.isDead) return sp0.apply(this, arguments);
    if (this.playerHero === 'soldier') {
      if (carcaj(this) <= 0) { if (!this._ckAvisoFl || this.time.now - this._ckAvisoFl > 1500) { this._ckAvisoFl = this.time.now; nota('Sin flechas: vuelven solas de a una'); son('door_locked', 0.35, { rate: 1.5 }); } return; }
      const antes = this.isAttacking, r = sp0.apply(this, arguments);
      if (!antes && this.isAttacking) { this._ckFlechas--; if (this._ckFlechaT < this.time.now) this._ckFlechaT = this.time.now + CARCAJ.cada; }
      return r;
    }
    if (this.playerHero === 'wizard') {
      if ((this.stamina || 0) < BOLA) { if (!this._ckAvisoMa || this.time.now - this._ckAvisoMa > 1500) { this._ckAvisoMa = this.time.now; nota('Sin maná para la bola de fuego'); son('door_locked', 0.35, { rate: 1.6 }); } return; }
      const antes = this.isAttacking, r = sp0.apply(this, arguments);
      if (!antes && this.isAttacking) { this.stamina = Math.max(0, this.stamina - BOLA); this.updateStaminaBar && this.updateStaminaBar(); }
      return r;
    }
    return sp0.apply(this, arguments);
  };
  const flechas = S => {
    if (S.playerHero !== 'soldier') return;
    carcaj(S);
    if (S._ckFlechas < CARCAJ.max && S.time.now >= S._ckFlechaT) {
      if (!S._ckFlechaT) S._ckFlechaT = S.time.now + CARCAJ.cada;
      else { S._ckFlechas++; S._ckFlechaT = S._ckFlechas < CARCAJ.max ? S.time.now + CARCAJ.cada : 0; }
    }
    // en el HUD, arriba del medallón (sólo Lancent)
    const caja = document.querySelector('#ckh .ckM-centro') || document.querySelector('#ckh');
    if (!caja) return;
    let el = document.getElementById('ck-carcaj');
    if (!el) {
      el = document.createElement('div'); el.id = 'ck-carcaj';
      const st = document.createElement('style');
      st.textContent = `#ck-carcaj { position: absolute; left: 50%; top: -24px; transform: translateX(-50%); z-index: 3; white-space: nowrap; pointer-events: none;
        padding: 0 8px 1px; font: 700 15px var(--ck2-f, 'CK Grenze', serif); color: #f3ead9; text-shadow: 0 2px 0 #000; background: rgba(16,11,12,.82); border: 2px solid #0b0607; box-shadow: inset 0 0 0 1px var(--ckM-aro, #7a5a2c); }
        #ck-carcaj i { font-style: normal; color: #e8b84a; margin-right: 4px; } #ck-carcaj.vacio { color: #ff8a78; } #ck-carcaj.vacio i { color: #ff8a78; }
        body.ck-movil #ck-carcaj { top: -20px; font-size: 13px; }`;
      document.head.append(st);
    }
    const host = document.querySelector('#ckh .ckM-centro');
    if (host && el.parentElement !== host) { host.style.position = 'relative'; host.appendChild(el); }
    const t = '<i>➶</i>' + S._ckFlechas + '/' + CARCAJ.max;
    if (el._t !== t) { el._t = t; el.innerHTML = t; }
    el.classList.toggle('vacio', S._ckFlechas <= 0);
    el.style.display = S.playerHero === 'soldier' && campana(S) ? '' : 'none';
  };

  // ================================================================== 4. la experiencia para subir de nivel
  const xp0 = P.xpForLevel;
  P.xpForLevel = function (level) {
    if (!campana(this)) return xp0 ? xp0.apply(this, arguments) : 40;
    const n = Math.max(0, (level || 1) - 1);
    return Math.round(60 + 75 * n + 14 * n * n);
  };

  // ================================================================== 5 y 6. los guardias
  const CAMPO = { x0: 470, x1: 780, y0: 240, y1: 470 };   // el campo de práctica del Patio de Armas (coordenadas del mapa)
  const da0 = P.updateActorDanger;
  if (da0) P.updateActorDanger = function (a) {
    // 6. guardias y arqueros no salen a pelear: para ellos no hay bestias a la vista (los vecinos siguen asustándose)
    if (campana(this) && (a.role === 'guard' || a.role === 'archer') && this.enemies) {
      const E = this.enemies, g0 = E.getChildren;
      E.getChildren = () => [];
      try { a.fight = null; return da0.apply(this, arguments); } finally { E.getChildren = g0; }
    }
    return da0.apply(this, arguments);
  };
  const entreno = S => {
    const z = S.currentZoneKey && S.currentZoneKey(), a = S.currentInterior && S.currentInterior.area;
    if (!a || !/training/.test(z || '')) return;
    const activo = !!S._ckEntreno;
    (a.actors || []).forEach(v => {
      const sp = v.sprite; if (!sp || !sp.active || !(v.role === 'guard' || /templar|knight|soldier|lancer|archer/.test(sp.texture.key))) return;
      if (activo) {
        if (!v._ckFuera) {
          const lx = sp.x - a.x, ly = sp.y - a.y;
          if (lx > CAMPO.x0 - 20 && lx < CAMPO.x1 + 20 && ly > CAMPO.y0 - 20 && ly < CAMPO.y1 + 20 || v.pts && v.pts.some(p => p[0] - a.x > CAMPO.x0 && p[0] - a.x < CAMPO.x1 && p[1] - a.y > CAMPO.y0 && p[1] - a.y < CAMPO.y1)) {
            v._ckFuera = { x: sp.x, y: sp.y, vis: sp.visible };
            sp.setVisible(false); if (sp.body) sp.body.enable = false;
          }
        }
        if (v._ckFuera) v.busyUntil = S.time.now + 500;     // quieto mientras dura
      } else if (v._ckFuera) {
        sp.setPosition(v._ckFuera.x, v._ckFuera.y); sp.setVisible(v._ckFuera.vis); if (sp.body) sp.body.enable = true;
        v._ckFuera = null; v.busyUntil = 0;
      }
    });
  };

  // ================================================================== 7. la cama del tabernero
  const ot0 = P.onTalked;
  const PRUEBAS = /[?&]pruebas=1/.test(location.search);
  const foto = S => { try { const s = S.story || {}; return JSON.stringify([s.step, s.count, s.flags]); } catch (e) { return ''; } };
  P.onTalked = function (id) {
    const antes = id === 'tabernero' ? foto(this) : '';
    const r = ot0 ? ot0.apply(this, arguments) : undefined;
    try {
      // la cama se ofrece cuando la charla no movió la historia (si te dio una pista, primero andá a seguirla)
      if (id === 'tabernero' && campana(this) && window.CK_CAMAS && !PRUEBAS && foto(this) === antes) {
        const C = window.CK_CAMAS.CAMAS['ed_taberna_2.main'];
        if (C) {
          // la charla todavía se está cerrando: se espera a que termine (y que no haya otra cosa abierta)
          const S = this, t0 = Date.now();
          const ver = () => { if (Date.now() - t0 > 4000) return; if (S.dialogOpen || S._overlay || S._doorTransition) { setTimeout(ver, 150); return; } window.CK_CAMAS.abrir(S, C); };
          setTimeout(ver, 200);
        }
      }
    } catch (e) {}
    return r;
  };
  try {
    const n = typeof STORY_NPCS !== 'undefined' && STORY_NPCS.find(x => x.id === 'tabernero');
    if (n && !n._ckCama) {
      n._ckCama = true;
      const l0 = n.lines;
      n.lines = function () { const L = (l0.apply(this, arguments) || []).slice(); L.push('Y cuando quieras pasar la noche, tengo cama: son 8 monedas.'); return L; };
    }
  } catch (e) {}

  // ================================================================== el cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this.gameStarted && this.player && this.player.body) {
        const dt = Math.min(0.1, (delta || 16) / 1000);
        velocidad(this);
        if (!this.isGamePaused) { aliento(this, dt); flechas(this); }
        entreno(this);
      }
    } catch (e) { if (!P._ckAjAv) { P._ckAjAv = true; console.warn('[ajustes]', e); } }
    return r;
  };
  window.CK_AJUSTES = { VEL, ALI, CARCAJ, BOLA };
})();
