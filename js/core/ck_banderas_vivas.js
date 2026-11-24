'use strict';
/* Banderas que flamean (19/11, pedido del dueño: "animaciones que faltan al juego, tipo banderas que se mueven, más que nada en
   zona orca"; "con código se mueve no sólo la tela sino toda la imagen y queda raro"; "hacé las que faltan de las Tierras").
   Tierras Orcas: los cuatro estandartes negros (ed_to_estandarte_1, _3, _4, _6) y la tela colgada de los dos tótems
   (ed_to_totem_1, _2) se animan con PixelLab moviendo SÓLO la tela; lo demás de la pieza queda quieto. Los tres estandartes
   que ya se movían (ed_ot_*, ck_frontera_viva.js) siguen igual.
   - Al cargar se registran como piezas animadas del Taller (mismo método que ck_frontera_viva.js): ida y vuelta, 6 cuadros/s.
   - Al entrar a un mapa, cada bandera arranca en un cuadro distinto y con un viento un poco distinto, para que no flameen todas
     a la vez.
   Arte en ck_banderas_vivas_arte.js. Borrar sus dos líneas de index.html deja las banderas quietas como antes. */
(function () {
  const A = window.EDITOR_ASSETS || {}, D = window.EDITOR_DATA || {};
  const ARTE = window.CK_BANDERAS_ARTE || {};
  const CLAVES = new Set();
  try {
    Object.keys(ARTE).forEach(key => {
      const h = ARTE[key];
      if (!A[key] || !D.assets || !D.assets[key]) return;
      A[key] = h.img;
      D.assets[key] = Object.assign({}, D.assets[key], { w: h.fw * h.n, h: h.fh,
        cuadros: { fw: h.fw, fh: h.fh, fps: h.fps || 6, bucle: true, vaiven: !!h.vaiven, orden: null, dur: null, ev: null } });
      Object.keys(D.mapas || {}).forEach(m => (D.mapas[m].items || []).forEach(it => { if (it[0] === key && !it[4]) it[4] = key; }));
      CLAVES.add(key);
    });
  } catch (e) { console.warn('[banderas vivas] arte', e); }

  if (typeof MainGameScene === 'undefined' || !CLAVES.size) return;
  const P = MainGameScene.prototype;
  const desfasar = S => {
    try {
      S.children.list.forEach(o => {
        if (!o.anims || !o.texture || !CLAVES.has(o.texture.key) || o._ckBanderaDesfasada) return;
        o._ckBanderaDesfasada = true;
        if (!o.anims.isPlaying && S.anims.exists(o.texture.key)) o.play(o.texture.key);
        if (o.anims.isPlaying) {
          o.anims.timeScale = 0.85 + Math.random() * 0.3;
          try { o.anims.setProgress(Math.random()); } catch (e) {}
        }
      });
    } catch (e) {}
  };
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0 ? a0.apply(this, arguments) : undefined;
    try { const S = this; S.time.delayedCall(120, () => desfasar(S)); S.time.delayedCall(900, () => desfasar(S)); } catch (e) {}
    return r;
  };
  window.CK_BANDERAS_VIVAS = { claves: CLAVES, desfasar };
})();
