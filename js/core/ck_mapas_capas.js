'use strict';
/* Tierras Orcas y Brumavieja rehechas con el método de capas (10/11, pedido del dueño: "dos zonas que ya están, sólo que
   usamos el método de ayer"; "recordá mantener la paleta de color").
   Los dibujos nuevos (suelo + objetos sobre croma) ya están en editor_data.js / editor_assets.js con el mismo id de mapa,
   así que las salidas, la historia, las bestias y todo lo demás siguen igual. Este archivo sólo:
   - deja enteras las piezas nuevas (ed_to_* de las Tierras, ed_br_* de Brumavieja), como las de los Campos (ed_cr_*):
     ck_profundidad.js no las parte en franjas y se pasa por detrás de cada objeto;
   - saca a las Tierras Orcas de la limpieza de "piso pegado" de ck_piezas_recorte.js (las piezas nuevas ya vienen limpias);
   - las animaciones quedan como estaban (pedido del dueño: "las animaciones y cosas deben quedar tal cual"): los tres
     estandartes animados de las Tierras (PixelLab, ck_frontera_viva.js) siguen siendo los de antes, en su lugar; no se
     suma ninguna animación nueva.
   La paleta ya viene puesta en los dibujos: las Tierras con el tono común de la Frontera Orca (el mismo al que
   ck_frontera_viva.js llevaba el mapa viejo) y Brumavieja con el tono que tenía en el juego.
   Borrar su línea de index.html: las piezas nuevas se parten en franjas y las Tierras pasan por la limpieza de piso pegado. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  window.CK_PROF_ENTEROS = /^ed_(cr|to|br|pc2|cc2|op_c2|of_c2|pfo|so|afo|fg|cb|gl|jr2)_/;   // (10/11) + Claro de las Bestias (cb) y la cueva, Nivel 1 (gl); (13/11) + Jardín Real (jr2)
  //   // (10/11) + Camino (cc2), Pueblo Orco (op_c2) y Fortaleza (of_c2) rehechos como el patio
  try {
    const R = window.CK_PIEZAS_RECORTE;
    if (R && R.CON_PISO) ['tierras_orcas', 'pueblo_orco', 'fortaleza_orca', 'bosque_de_la_frontera'].forEach(id => { const i = R.CON_PISO.indexOf(id); if (i >= 0) R.CON_PISO.splice(i, 1); });
  } catch (e) {}

  // (10/11) Patio del Castillo (pc2), Camino al Castillo (cc2), Pueblo Orco (op_c2) y Fortaleza Orca (of_c2) ya tienen piezas
  // propias, cortadas enteras de la capa de objetos (como el patio): las copias "<clave>_capas" del método anterior se sacaron
  // de editor_assets.js. Lo de abajo queda por si vuelve alguna (no hace nada si no hay).
  try {
    const A = window.EDITOR_ASSETS || {};
    Object.keys(A).forEach(k => { const m = /^(.+)_capas$/.exec(k); if (m && A[m[1]]) A[m[1]] = A[k]; });
    // (Pueblo Orco) la choza 7 la había "completado" ck_piezas_arregladas.js con otro tamaño y corrimiento: vuelve al suyo
    const D = window.EDITOR_DATA || {}, TAM = { ed_op_choza_7: [144, 98] };
    Object.keys(TAM).forEach(k => {
      if (!A[k + '_capas'] || !D.assets || !D.assets[k]) return;
      D.assets[k] = Object.assign({}, D.assets[k], { w: TAM[k][0], h: TAM[k][1] });
      Object.keys(D.mapas || {}).forEach(id => (D.mapas[id].items || []).forEach(it => { if (it[0] === k && it[5] && typeof it[5] === 'object') { delete it[5].ox; delete it[5].oy; } }));
    });
  } catch (e) {}

  // (10/11) Pueblo Orco con la paleta de la referencia que eligió el dueño (arena clara y piedra gris, como las Tierras de Flow):
  // ck_frontera_viva.js lleva el dibujo nuevo del pueblo (media/desvío Lab medidos) a la media/desvío de esa imagen
  try {
    const FV = window.CK_FRONTERA_VIVA;
    // el suelo ya viene con esa paleta (ed_suelo_pueblo_orco_v2, fuera de la recoloración); a las piezas sólo se les baja el rojo
    if (FV && FV.PAR) FV.PAR.op = { mu: [0, 7.6, 14.8], sd: [1, 1, 1], tmu: [0, 3.5, 13.5], tsd: [1, 1, 1] };
  } catch (e) {}

  const MECE = {};   // (sin animaciones nuevas: queda el mecanismo por si el dueño pide alguna)
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      const L = MECE[this.currentZoneKey ? this.currentZoneKey() : ''];
      if (L) this.time.delayedCall(60, () => this.children.list.forEach(o => {
        if (o._ckMece || !o.texture || !o.visible || !o.active) return;
        const m = L.find(([re]) => re.test(o.texture.key)); if (!m || !m[1]) return;
        o._ckMece = true;
        this.tweens.add({ targets: o, angle: { from: -m[1] * 0.8, to: m[1] }, duration: m[2] + (o.x * 7) % 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (o.y * 13) % 700 });
      }));
    } catch (e) { console.warn('[mapas por capas]', e); }
    return r;
  };
  window.CK_MAPAS_CAPAS = { MECE };
})();
