'use strict';
/* Detalles del héroe, por código:
   - Aliento visible con frío (nieve, nevado o de noche afuera): una nubecita cada par de segundos, más seguido al correr
     o cansado; el viento la lleva.
   - Mojado: bajo la lluvia se va oscureciendo y le caen gotitas; se seca de a poco (adentro más rápido).
     Nevado: con nieve se le juntan copitos en la cabeza y los hombros; el dash se los sacude.
   - Polvo al correr y al hacer dash según el piso: tierra, pasto, nieve, barro o agua.
   Sacar la línea de index.html lo quita. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const sat = x => Math.max(0, Math.min(1, x));
  const ter = (zona, x, y) => (window.CK_MINIMAPA && window.CK_MINIMAPA.terreno ? window.CK_MINIMAPA.terreno(zona, x, y) : null);
  const clima = () => (window.CK_CLIMA && window.CK_CLIMA.estado ? window.CK_CLIMA.estado.act : { lluvia: 0, nieve: 0, viento: 0 });
  const mezcla = (a, b, k) => { const c = i => Math.round(((a >> i) & 255) + ((((b >> i) & 255) - ((a >> i) & 255)) * k)); return (c(16) << 16) | (c(8) << 8) | c(0); };

  const H = { mojado: 0, nevado: 0, aliento: 1500, gotas: 0, polvo: 0, dash: false, tinte: null, copos: null };

  const piezas = S => {
    if (S._ckHfx && S._ckHfx.humo.active) return S._ckHfx;
    const T = S.textures;
    if (!T.exists('ckh_humo')) { const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d'), gr = g.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 16, 16); T.addCanvas('ckh_humo', cv); }
    if (!T.exists('ckh_punto')) { const cv = document.createElement('canvas'); cv.width = cv.height = 2; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); T.addCanvas('ckh_punto', cv); }
    const humo = S.add.particles(0, 0, 'ckh_humo', {
      speedX: { onEmit: () => (S.facingDirection === 'left' ? -1 : 1) * R(8, 16) + clima().viento * 0.12 }, speedY: { min: -10, max: -3 },
      lifespan: { min: 700, max: 1100 }, scale: { start: 0.18, end: 0.7 }, alpha: { start: 0.55, end: 0 }, tint: 0xf2f6fc, emitting: false
    });
    const polvo = S.add.particles(0, 0, 'ckh_humo', {
      speedX: { min: -18, max: 18 }, speedY: { min: -14, max: -2 }, lifespan: { min: 380, max: 700 },
      scale: { start: 0.25, end: 1 }, alpha: { start: 0.4, end: 0 }, emitting: false
    });
    const bits = S.add.particles(0, 0, 'ckh_punto', {
      speedX: { min: -45, max: 45 }, speedY: { min: -60, max: -20 }, gravityY: 240, lifespan: { min: 250, max: 450 },
      scale: { min: 0.5, max: 1 }, alpha: { start: 0.9, end: 0 }, emitting: false
    });
    const gotas = S.add.particles(0, 0, 'ckh_punto', {
      speedX: { min: -4, max: 4 }, speedY: { min: 10, max: 30 }, gravityY: 300, lifespan: { min: 220, max: 360 },
      scale: 0.5, alpha: { start: 0.8, end: 0 }, tint: 0xbcd4f0, emitting: false
    });
    return (S._ckHfx = { humo, polvo, bits, gotas });
  };

  // copitos sobre el héroe: posiciones relativas (mirando a la derecha) en cabeza y hombros
  const COPOS = [[-3, -24], [1, -26], [4, -24], [-6, -16], [6, -16], [-1, -25], [3, -17], [-4, -18]];

  const paso = (S, dt) => {
    const p = S.player, b = p && p.body;
    if (!p || !b || !p.visible) return;
    const D = piezas(S), cl = clima(), c = S.currentInterior, afuera = window.CK_AFUERA ? window.CK_AFUERA(S) : !c || c.area.outdoor;
    const zona = S.currentZoneKey ? S.currentZoneKey() : 'village', ax = c ? c.area.x : 0, ay = c ? c.area.y : 0;
    const fase = S.dayPhase ? S.dayPhase() : 0.2, noche = fase > 0.6 && fase < 0.94;
    const dir = S.facingDirection === 'left' ? -1 : 1;
    const moviendo = Math.abs(b.velocity.x) + Math.abs(b.velocity.y) > 15;
    const nieveSuelo = window.CK_NIEVE && window.CK_NIEVE.cuanta() > 0.25 && afuera && window.CK_NIEVE.zonas().some(z => z[0] === zona && z[1]);

    // --- aliento
    const frio = afuera && (cl.nieve > 0.3 || nieveSuelo || noche);
    H.aliento -= dt;
    if (frio && H.aliento <= 0) {
      const cansado = S.maxStamina ? S.stamina / S.maxStamina < 0.35 : false;
      H.aliento = S.isRunning || cansado ? R(800, 1200) : R(1800, 2700);
      D.humo.setDepth(p.depth + 1);
      D.humo.emitParticleAt(b.center.x + dir * 7, b.center.y - 20, noche && cl.nieve < 0.3 && !nieveSuelo ? 1 : 2);
    }

    // --- mojado y nevado
    if (afuera && cl.lluvia > 0.3) H.mojado = sat(H.mojado + dt / 9000 * cl.lluvia);
    else H.mojado = sat(H.mojado - dt / (afuera ? 30000 : 15000));
    if (afuera && cl.nieve > 0.5) H.nevado = sat(H.nevado + dt / 16000);
    else H.nevado = sat(H.nevado - dt / (afuera ? 40000 : 12000));
    // tinte (sin pisar los destellos de daño u otros tintes que ponga el juego)
    const quiero = H.mojado > 0.02 ? mezcla(0xffffff, 0xa8b8d0, H.mojado * 0.7) : 0xffffff;
    const actual = p.isTinted ? p.tintTopLeft : 0xffffff;
    if (actual === 0xffffff || actual === H.tinte) {
      if (quiero === 0xffffff) { if (p.isTinted && actual === H.tinte) p.clearTint(); }
      else p.setTint(quiero);
      H.tinte = quiero;
    }
    H.gotas -= dt;
    if (H.mojado > 0.3 && H.gotas <= 0) { H.gotas = R(180, 420) / H.mojado; D.gotas.setDepth(p.depth + 1); D.gotas.emitParticleAt(b.center.x + R(-6, 6), b.center.y - R(4, 18), 1); }
    // copitos
    if (!H.copos || !H.copos[0].active) H.copos = COPOS.map(() => S.add.image(0, 0, 'ckh_punto').setTint(0xf6f9ff).setScale(R(0.6, 1)));
    const nCop = Math.round(H.nevado * COPOS.length);
    H.copos.forEach((s, i) => {
      const ver = i < nCop && p.visible;
      s.setVisible(ver);
      if (ver) s.setPosition(Math.round(b.center.x + COPOS[i][0] * dir), Math.round(b.bottom + COPOS[i][1])).setDepth(p.depth + 0.5);
    });

    // --- polvo al correr y al hacer dash
    const t = afuera ? ter(zona, b.center.x - ax, b.bottom - ay) : 'piso';
    const nuevoDash = S.isDashing && !H.dash;
    H.dash = !!S.isDashing;
    if (nuevoDash && H.nevado > 0.1) { D.bits.setParticleTint(0xf6f9ff); D.bits.setDepth(p.depth + 1); D.bits.emitParticleAt(b.center.x, b.center.y - 18, Math.round(H.nevado * 8)); H.nevado = 0; }
    H.polvo -= dt;
    if ((nuevoDash || (S.isRunning && moviendo && H.polvo <= 0)) && afuera) {
      H.polvo = R(110, 170);
      const n = nuevoDash ? 6 : 1, x = b.center.x - dir * 4, y = b.bottom - 1;
      const charcos = window.CK_DETALLES && window.CK_DETALLES.mojado > 0.4;
      D.polvo.setDepth(p.depth - 1); D.bits.setDepth(p.depth - 1);
      if (nieveSuelo) { D.polvo.setParticleTint(0xf4f8ff); D.polvo.emitParticleAt(x, y, n); D.bits.setParticleTint(0xffffff); D.bits.emitParticleAt(x, y, n); }
      else if (charcos && (t === 'camino' || t === 'pasto' || t === 'bosque')) { D.bits.setParticleTint(t === 'camino' ? 0x5a4026 : 0x4a5a2a); D.bits.emitParticleAt(x, y, n + 1); }
      else if (t === 'camino' || t === 'piedra') { D.polvo.setParticleTint(t === 'camino' ? 0xcab48a : 0xb8b4ac); D.polvo.emitParticleAt(x, y, n); }
      else if (t === 'pasto' || t === 'bosque') { D.bits.setParticleTint(0x7aa848); D.bits.emitParticleAt(x, y, nuevoDash ? 4 : 1); }
      else if (t === 'agua') { D.bits.setParticleTint(0xcfe0f4); D.bits.emitParticleAt(x, y, n + 2); }
      else if (nuevoDash) { D.polvo.setParticleTint(0xb8b4ac); D.polvo.emitParticleAt(x, y, 4); }
    }
  };

  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    try { if (this._gameMode === 'campaign' && !this.isGamePaused) paso(this, Math.min(100, dt || 16)); }
    catch (e) { if (!this._ckHfxError) { this._ckHfxError = true; console.warn('[heroe_fx]', e); } }
    return dn0.apply(this, arguments);
  };
  const fin0 = P.endStory;
  if (fin0) P.endStory = function () {
    if (H.copos) H.copos.forEach(s => s.active && s.setVisible(false));
    if (this.player && H.tinte !== null && this.player.isTinted && this.player.tintTopLeft === H.tinte) this.player.clearTint();
    H.mojado = H.nevado = 0; H.tinte = null;
    return fin0.apply(this, arguments);
  };
  window.CK_HEROE_FX = { estado: H };
})();
