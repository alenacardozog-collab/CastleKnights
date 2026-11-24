'use strict';
/* Telas que se mueven (19/11, pedido del dueño: "haz las animaciones" — las sugeridas al recorrer todos los mapas).
   Igual que ck_banderas_vivas.js: sólo se mueve la tela (PixelLab, por capas: el palo, el travesaño y lo de alrededor
   quedan quietos) y los dibujos de las banderas (calaveras, el león) son los originales, corridos con la tela.
   Piezas: Fortaleza Orca (2 estandartes), Patio de la Fortaleza (3 banderines), Sendero Orco (4 estandartes y 4
   banderitas), Afueras Orcas (3 banderitas), Claro de las Bestias (2), Las Galerías (1), La Fosa (2), Bosque de la
   Frontera (3 banderas azules del campamento), Muralla (el estandarte del león) y las cortinas de la Posada de San Roque.
   El arte está en ck_telas_vivas_arte.js. Cada pieza pasa a ser una hoja de 7 cuadros que va y vuelve; cada una arranca
   en un momento distinto para que no flameen todas a la vez.
   Borrar las dos líneas de index.html las deja quietas como antes. */
(function () {
  const A = window.EDITOR_ASSETS || {}, D = window.EDITOR_DATA || {};
  const ARTE = window.CK_TELAS_ARTE || {};
  const CLAVES = new Set();
  try {
    Object.keys(ARTE).forEach(key => {
      const h = ARTE[key];
      if (!A[key] || !D.assets || !D.assets[key] || D.assets[key].cuadros) return;   // si el Taller ya la animó, se respeta
      A[key] = h.img;
      D.assets[key] = Object.assign({}, D.assets[key], { w: h.fw * h.n, h: h.fh,
        cuadros: { fw: h.fw, fh: h.fh, fps: h.fps || 6, bucle: true, vaiven: !!h.vaiven, orden: null, dur: null, ev: null } });
      Object.keys(D.mapas || {}).forEach(m => (D.mapas[m].items || []).forEach(it => { if (it[0] === key && !it[4]) it[4] = key; }));
      CLAVES.add(key);
    });
  } catch (e) { console.warn('[telas vivas] arte', e); }
  if (typeof MainGameScene === 'undefined' || !CLAVES.size) return;
  const P = MainGameScene.prototype;
  const desfasar = S => { try { S.children.list.forEach(o => {
        if (!o.anims || !o.texture || !CLAVES.has(o.texture.key) || o._ckTelaDesfasada) return;
        o._ckTelaDesfasada = true;
        if (!o.anims.isPlaying && S.anims.exists(o.texture.key)) o.play(o.texture.key);
        if (o.anims.isPlaying) { o.anims.timeScale = 0.8 + Math.random() * 0.35; try { o.anims.setProgress(Math.random()); } catch (e) {} }
      }); } catch (e) {} };
  const a0 = P.onAreaShown;
  P.onAreaShown = function () { const r = a0 ? a0.apply(this, arguments) : undefined;
    try { const S = this; S.time.delayedCall(120, () => desfasar(S)); S.time.delayedCall(900, () => desfasar(S)); } catch (e) {}
    return r; };
  window.CK_TELAS_VIVAS = { claves: CLAVES, desfasar };
})();
