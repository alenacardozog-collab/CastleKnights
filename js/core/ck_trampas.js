'use strict';
/* Trampas (08/11, pedido del dueño: "que a veces alguna caja o cofre sean trampa y explote o envenene y tengas que usar
   pociones o algo"). Usa los ganchos de ck_rompibles.js (va después de él en index.html).
   - CUÁLES: en las zonas peligrosas, 1 de cada 6 vasijas o cajones más o menos (en las otras, 1 de cada 12); cambia cada vez
     que se entra. De los 16 cofres, cada uno tiene 1 en 4 de ser trampa, y eso es fijo para la partida (el mismo cofre
     siempre). Los cajones trampa EXPLOTAN (tienen pólvora); las vasijas trampa ENVENENAN; los cofres, una cosa o la otra.
   - SE NOTAN si se mira bien, a menos de 170 px: el cajón con pólvora suelta chispitas y humo, la vasija burbujea verde y el
     cofre trampa tiembla solo. Un consejo de la pantalla de carga lo cuenta.
   - EXPLOSIÓN: 46 px alrededor; al héroe le saca 2 corazones (1 en fácil) y a las bestias 3; hace saltar las otras trampas
     y rompe lo que esté cerca. Se puede romper de lejos (flechas, magia) y usar contra las bestias.
   - VENENO: una nube verde de 4,5 s; si el héroe la toca queda ENVENENADO 12 s y pierde 1 corazón cada 4 s (nunca baja de 1).
     A las bestias que están adentro les saca 1 por segundo. Se cura con una poción (Z) o un elixir (X), aunque la vida
     esté llena. En la fila de estados aparece el ícono (rojo, con los segundos).
   - COFRE TRAMPA: al abrirlo hace "¡clic!" y tiembla 0,65 s (hay tiempo de un dash con Espacio) y después explota o suelta
     la nube. El premio queda adentro igual: se abre solo después.
   Borrar la línea de index.html lo saca (los rompibles y cofres siguen igual, sin trampas). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ROMPIBLES || !window.CK_ROMPIBLES.GANCHOS) return;
  const P = MainGameScene.prototype, R = window.CK_ROMPIBLES, GA = R.GANCHOS;
  const PROB = { peligro: 0.17, otras: 0.08, cofre: 0.25 };
  const EXPLO = { radio: 46, dano: 2, bestia: 3 };
  const VENENO = { radio: 40, nube: 4500, dura: 12000, cada: 4000 };
  const AVISO = { cerca: 170, cada: [3500, 6500], clic: 650 };
  const azar = (a, b) => a + Math.random() * (b - a);
  const semilla = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; };
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const sonH = (k, v) => { try { return window.CK_SONIDOS && CK_SONIDOS.son(k, v, { gap: 150 }); } catch (e) { return false; } };
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const facil = () => { try { return window.CK_DIFICULTAD && CK_DIFICULTAD.actual() === 'facil'; } catch (e) { return false; } };

  // ------------------------------------------------------------------ cuáles son trampa
  GA.poner.push((S, o) => {
    if (o.cofre) {
      if (o.abierto) return;
      const s = (S.story.flags.trampas = S.story.flags.trampas || {});
      if (s[o.cofre] === undefined) { const r = semilla(o.cofre + '#trampa'); s[o.cofre] = r() < PROB.cofre ? (r() < 0.5 ? 'explota' : 'veneno') : 0; }
      if (s[o.cofre]) o.trampa = s[o.cofre];
    } else if (o.rompible) {
      const peligro = typeof ZONE_ENEMIES !== 'undefined' && !!ZONE_ENEMIES[S.currentZoneKey()];
      if (Math.random() < (peligro ? PROB.peligro : PROB.otras)) o.trampa = /^(vasija|anfora|urna|olla_orca)$/.test(o.k) ? 'veneno' : 'explota';
    }
    if (o.trampa) o._ckAviso = S.time.now + azar(800, 3000);
  });

  // ------------------------------------------------------------------ lo que pasa
  const estallar = (S, o, x, y) => {
    S.cameras.main.shake(260, 0.012);
    try { if (window.CK_VFX) CK_VFX.fx(S, 'fuego_explosion', x, y + 4, { escala: 0.9 }); } catch (e) {}
    try { if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'fuego', x, y, EXPLO.radio, 420); } catch (e) {}
    try { if (window.CK_LUZ) CK_LUZ.agregar({ x, y: y - 8, c: [255, 170, 80], r: 110, f: 1, ms: 500 }); } catch (e) {}
    sonH('explosion_fuego', 0.7) || son('fire_hit', 0.8, { rate: 0.7 });
    const p = pies(S);
    if (Math.hypot(p.x - x, p.y - y) < EXPLO.radio + 6) {
      S.damagePlayer(facil() ? 1 : EXPLO.dano);
      S.createFloatingText(S.player.x, S.player.y - 50, '¡TRAMPA!', 0xfb923c);
    }
    S.enemies && S.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const ey = e.body ? e.body.bottom : e.y;
      if (Math.hypot(e.x - x, ey - y) < EXPLO.radio + 8) { try { S.damageEnemy(e, EXPLO.bestia, x, y); } catch (er) {} }
    });
    // lo que esté cerca: las otras trampas saltan, lo demás se rompe
    S.time.delayedCall(140, () => (S._ckRomp || []).slice().forEach(q => {
      if (q === o || !q.rompible || q.roto || Math.hypot(q.x - x, q.y - y) > EXPLO.radio + 14) return;
      R.romper(S, q);
    }));
  };
  const nube = (S, x, y) => {
    son('necro_cast', 0.5, { rate: 1.5 });
    const N = { x, y, hasta: S.time.now + VENENO.nube, partes: [], prox: 0 };
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, d = i ? azar(10, VENENO.radio * 0.7) : 0;
      const c = S.add.ellipse(x + Math.cos(a) * d, y - 4 + Math.sin(a) * d * 0.5, azar(26, 40), azar(14, 20), i % 2 ? 0x7ddc5a : 0x4caf50, 0.0).setDepth(Math.round(y) + 20);
      S.tweens.add({ targets: c, fillAlpha: azar(0.28, 0.42), scaleX: 1.3, scaleY: 1.3, duration: 500, ease: 'Sine.easeOut' });
      S.tweens.add({ targets: c, x: c.x + azar(-8, 8), y: c.y - azar(2, 8), duration: VENENO.nube, ease: 'Sine.easeInOut' });
      S.tweens.add({ targets: c, fillAlpha: 0, delay: VENENO.nube - 700, duration: 700, onComplete: () => c.destroy() });
      N.partes.push(c);
    }
    (S._ckNubes = S._ckNubes || []).push(N);
  };
  const disparar = (S, o) => {
    const x = o.x, y = o.y - 6;
    if (o.trampa === 'explota') estallar(S, o, x, y); else nube(S, x, y);
    o.trampa = null;
  };
  const envenenar = S => {
    const now = S.time.now, v = S._ckVeneno;
    if (!v || v.hasta < now) {
      S._ckVeneno = { hasta: now + VENENO.dura, prox: now + 1200 };
      S.createFloatingText(S.player.x, S.player.y - 50, '¡ENVENENADO! · tomá una poción (Z)', 0x86efac);
      try { if (window.CK_SIN_CARTELES_API) CK_SIN_CARTELES_API.nota('Envenenado: perdés vida de a poco. Una poción (Z) o un elixir (X) lo cura.'); } catch (e) {}
    } else v.hasta = Math.max(v.hasta, now + VENENO.dura * 0.5);
  };

  GA.romper.push((S, o) => { if (!o.trampa) return false; disparar(S, o); return true; });
  GA.abrir.push((S, o) => {
    if (o._ckArmando) return true;
    if (!o.trampa) return false;
    o._ckArmando = true;
    S.createFloatingText(o.x, o.y - 34, '¡Clic!', 0xfca5a5);
    son('door_locked', 0.7, { rate: 1.4 }) || son('book_clasp', 0.7, { rate: 1.6 });
    S.tweens.add({ targets: o.sp, x: o.x + 1.5, duration: 45, yoyo: true, repeat: Math.round(AVISO.clic / 90), onComplete: () => { if (o.sp.active) o.sp.x = o.x; } });
    S.time.delayedCall(AVISO.clic, () => {
      if (!o.sp || !o.sp.active) return;
      disparar(S, o);
      o._ckArmando = false;
      R.abrir(S, o, true);
    });
    return true;
  });

  // ------------------------------------------------------------------ la poción cura el veneno (aunque la vida esté llena)
  const ui0 = P.useItem;
  if (ui0) P.useItem = function (id) {
    const v = this._ckVeneno, s = this.story;
    if (v && v.hasta > this.time.now && (id === 'potion' || id === 'elixir') && s && s.inv[id] && !this.isDead && !this.dialogOpen && !this.isGamePaused) {
      this._ckVeneno = null;
      if (this.health >= this.maxHealth) {
        s.inv[id]--;
        try { sfx.playHeartPickup(); } catch (e) {}
        this.createFloatingText(this.player.x, this.player.y - 40, '¡VENENO CURADO!', 0x22c55e);
        this.updateHUD(); this.updateQuickBar && this.updateQuickBar(); this.saveStory && this.saveStory();
        return;
      }
      const r = ui0.apply(this, arguments);
      this.createFloatingText(this.player.x, this.player.y - 56, '¡VENENO CURADO!', 0x22c55e);
      return r;
    }
    return ui0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ cada cuadro: avisos, nubes, veneno
  const chispa = (S, x, y, col, sube) => {
    const c = S.add.rectangle(x + azar(-3, 3), y, sube ? 1 : 2, sube ? 1 : 2, col, 1).setDepth(Math.round(y) + 25);
    S.tweens.add({ targets: c, y: y - azar(8, 16), x: c.x + azar(-3, 3), alpha: 0, duration: azar(500, 900), onComplete: () => c.destroy() });
  };
  const avisar = (S, o) => {
    const top = o.y - o.sp.displayHeight;
    if (o.cofre) {
      S.tweens.add({ targets: o.sp, x: o.x + 1, duration: 40, yoyo: true, repeat: 3, onComplete: () => { if (o.sp.active) o.sp.x = o.x; } });
    } else if (o.trampa === 'explota') {
      for (let i = 0; i < 3; i++) S.time.delayedCall(i * 90, () => o.sp.active && chispa(S, o.x + azar(-4, 4), top + 3, i % 2 ? 0xffd25a : 0xff7a2a, true));
      S.time.delayedCall(200, () => o.sp.active && chispa(S, o.x, top + 2, 0x6b6b6b, false));
    } else {
      for (let i = 0; i < 3; i++) S.time.delayedCall(i * 160, () => o.sp.active && chispa(S, o.x + azar(-3, 3), top + 4, 0x86efac, true));
    }
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.player) return r;
      const now = this.time.now, p = pies(this);
      // avisos de las trampas cercanas
      (this._ckRomp || []).forEach(o => {
        if (!o.trampa || o.roto || o.abierto || o._ckArmando || !o.sp || !o.sp.active || now < (o._ckAviso || 0)) return;
        o._ckAviso = now + azar(AVISO.cada[0], AVISO.cada[1]);
        if (Math.hypot(o.x - p.x, o.y - p.y) < AVISO.cerca) avisar(this, o);
      });
      // nubes de veneno
      this._ckNubes = (this._ckNubes || []).filter(N => {
        if (now > N.hasta) return false;
        if (Math.hypot(p.x - N.x, p.y - N.y) < VENENO.radio && !this.isDead) envenenar(this);
        if (now > N.prox) {
          N.prox = now + 1000;
          this.enemies && this.enemies.getChildren().forEach(e => { if (e.active && !e.isDead && Math.hypot(e.x - N.x, (e.body ? e.body.bottom : e.y) - N.y) < VENENO.radio) { try { this.damageEnemy(e, 1, N.x, N.y); } catch (er) {} } });
        }
        return true;
      });
      // el veneno en el héroe (su ícono va con borde rojo, como los males)
      const v = this._ckVeneno;
      if (v) { const ic = document.querySelector('#ckh .estados .est[title^="Envenenado"]'); if (ic && !ic.classList.contains('mal')) ic.classList.add('mal'); }
      if (v) {
        if (now > v.hasta || this.isDead) this._ckVeneno = null;
        else if (now > v.prox) {
          v.prox = now + VENENO.cada;
          if (this.health > 1 && !this.dialogOpen && !this._doorTransition) {
            this.health -= 1; this.updateHUD && this.updateHUD();
            this.createFloatingText(this.player.x, this.player.y - 40, '-1 · veneno', 0x86efac);
            this.player.setTint(0x7ddc5a); this.time.delayedCall(220, () => this.player && this.player.clearTint());
            son('heal', 0.35, { rate: 0.5 });
          }
        }
      }
    } catch (e) { if (!P._ckTrAv) { P._ckTrAv = 1; console.warn('[trampas]', e); } }
    return r;
  };
  // al salir de la zona, las nubes se van (el veneno sigue)
  const a0 = P.onAreaShown;
  P.onAreaShown = function () { this._ckNubes = []; return a0.apply(this, arguments); };

  // ------------------------------------------------------------------ el ícono de envenenado en la fila de estados
  const instalarIcono = () => {
    const E = window.CK_ESTADOS, IC = window.CK_VFX_ARTE && window.CK_VFX_ARTE.iconos;
    if (!E || !E.BUF || !IC || E.BUF.veneno || !IC.sangrando) return;
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height);
      for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2]; if (r > gg + 30) { d.data[i] = gg * 0.5; d.data[i + 1] = Math.min(255, r * 0.95 + 20); d.data[i + 2] = b * 0.5; } }
      g.putImageData(d, 0, 0);
      IC.veneno = cv.toDataURL();
      E.BUF.veneno = { fx: null, ic: 'veneno', fin: S => (S._ckVeneno ? S._ckVeneno.hasta : 0), total: VENENO.dura, nom: 'Envenenado: una poción (Z) o un elixir (X) lo cura' };
    };
    im.src = IC.sangrando;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarIcono); else instalarIcono();

  window.CK_TRAMPAS = { PROB, EXPLO, VENENO, AVISO, disparar, envenenar };
})();
