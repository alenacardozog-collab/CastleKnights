'use strict';
/* Lugares que se cierran al terminar su capítulo (13/11, pedido del dueño: "la tierra de los orcos y el bosque embrujado
   después de pasar los capítulos no se puede acceder más").
   - EL BOSQUE EMBRUJADO, con el Capítulo 1 terminado (story.flags.c2 ≥ 1, cuando el Maestre Eloy cierra el capítulo): la
     niebla se traga el portón de arriba del Norte del Roble y el paso del este de Brumavieja. Un banco de niebla espesa
     tapa la salida y no se pasa. Brumavieja y el Cementerio se siguen alcanzando por la salida de Brumavieja a la aldea.
   - LAS TIERRAS ORCAS (y con ellas el Claro de las Bestias, la Cueva de Garra Negra, el Pueblo, la Fortaleza, el Sendero,
     las Afueras y el Coliseo), con el Capítulo 2 terminado (echado del castillo: story.flags.expulsado o c2 ≥ 9): los
     clanes trancaron la frontera. En el Bosque de la Frontera, la salida del este queda cerrada con la barricada.
   Va después de ck_zona_brumavieja.js, ck_capitulo2.js y ck_frontera_cerrada.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s && s.flags) || {};
  const cap1 = s => (fl(s).c2 || 0) >= 1;
  const cap2 = s => !!fl(s).expulsado || (fl(s).c2 || 0) >= 9;
  const zonaDe = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const R = (a, b) => a + Math.random() * (b - a);
  // salida → [cuándo se cierra, qué dice, para dónde se empuja al héroe]
  const CIERRES = {
    zb_bosque: [cap1, 'La niebla se tragó el Bosque Embrujado. Ya no hay camino.', [0, 14]],
    zb_bosque_arriba: [cap1, 'La niebla se tragó el Bosque Embrujado. Ya no hay camino.', [-14, 0]],
    c2_tierras: [cap2, 'Los clanes trancaron la frontera. A las Tierras Orcas ya no se pasa.', [-18, 0]]
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    try {
      const c = CIERRES[nombre], s = st(this);
      if (c && s && c[0](s) && !this._doorTransition && !(window.CK_LIBRE && CK_LIBRE())) {   // (en la prueba con todo abierto, no)
        if (!this._ckZcAviso || this.time.now - this._ckZcAviso > 2500) {
          this._ckZcAviso = this.time.now;
          this.createFloatingText(this.player.x, this.player.y - 46, c[1], 0xfca5a5);
        }
        try { if (this.player && this.player.body) this.player.body.reset(this.player.x + c[2][0], this.player.y + c[2][1]); } catch (e) {}
        return;
      }
    } catch (e) {}
    return cambiar0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ lo que se ve en cada salida cerrada
  const NIEBLA = 'ckzc_niebla';
  const textura = S => {
    if (S.textures.exists(NIEBLA)) return;
    const t = S.textures.createCanvas(NIEBLA, 128, 64), g = t.getContext();
    g.save(); g.scale(1, 0.5);
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(0.55, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); g.restore(); t.refresh();
  };
  const cuerpo = (S, x, y, w, h) => {
    const z = S.add.zone(x + w / 2, y + h / 2, w, h);
    S.physics.add.existing(z, true);
    if (S.interiorObstacles) S.interiorObstacles.add(z);
    return z;
  };
  const quitar = S => { (S._ckZc || []).forEach(o => { try { if (o && o.active) o.destroy(); } catch (e) {} }); S._ckZc = []; };
  // un banco de niebla que respira sobre una franja [x, y, w, h] del mapa
  const banco = (S, a, x, y, w, h, n) => {
    textura(S);
    for (let i = 0; i < n; i++) {
      const s = S.add.image(a.x + x + R(0, w), a.y + y + R(0, h), NIEBLA).setTint(0xc9d2cc).setAlpha(R(0.55, 0.8))
        .setScale(R(1.3, 2.1), R(0.9, 1.4)).setDepth(a.y + y + h + 200);
      S.tweens.add({ targets: s, x: s.x + R(-14, 14), alpha: { from: s.alpha, to: s.alpha * 0.7 }, duration: R(2600, 4200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      S._ckZc.push(s);
    }
  };
  const armar = S => {
    quitar(S);
    const s = st(S); if (!s || !S.currentInterior || (window.CK_LIBRE && CK_LIBRE())) return;
    const z = zonaDe(S), a = S.currentInterior.area;
    if (z === 'ed_norte_del_roble.main' && cap1(s)) {
      banco(S, a, 650, 50, 150, 70, 14);
      S._ckZc.push(cuerpo(S, a.x + 664, a.y + 70, 116, 40));
    }
    if (z === 'ruins.village' && cap1(s)) {
      const sal = (a.exits || []).find(e => e.to === 'zb_bosque_arriba');
      if (sal) { banco(S, { x: 0, y: 0 }, sal.x - 70, sal.y - 10, 90, sal.h + 20, 12); S._ckZc.push(cuerpo(S, sal.x - 22, sal.y, 22, sal.h)); }
    }
    if (z === 'ed_bosque_de_la_frontera.main' && cap2(s)) {
      const B = 'ck_barricada_paso';
      if (S.textures.exists(B)) S._ckZc.push(S.add.image(a.x + 1422, a.y + 462, B, '__BASE').setOrigin(0.5, 1).setDepth(a.y + 380));
      else if (S.textures.exists('ed_ot_estacas_1')) S._ckZc.push(S.add.image(a.x + 1424, a.y + 456, 'ed_ot_estacas_1').setOrigin(0.5, 1).setScale(0.82).setFlipX(true).setDepth(a.y + 380));
      S._ckZc.push(cuerpo(S, a.x + 1406, a.y + 380, 30, 96));
    }
  };
  const al0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = al0 ? al0.apply(this, arguments) : undefined;
    try { const S = this; quitar(S); S.time.delayedCall(300, () => { try { armar(S); } catch (e) {} }); } catch (e) {}
    return r;
  };
  window.CK_ZONAS_CERRADAS = { CIERRES, cap1, cap2, armar };
})();
