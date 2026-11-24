'use strict';
/* Cementerio Real y Fortaleza Orca rehechos desde 4 capas de Flow (23/11, pedido del dueño: "hay dos mapas que me están
   causando conflictos en el juego… quiero usar las que ya están pero hacerles más recortes en flow, así podemos tener más
   manejo"; "arma bien el mapa, que se pueda pasar por donde se debe y las jerarquías de las cosas estén bien").
   Los dibujos nuevos ya están en editor_data.js / editor_assets.js con el mismo id de mapa (salidas, historia, luces, gente:
   todo igual). Las piezas:
   - cm2_ / of_c4_: objetos enteros (tumbas, estatuas, árboles, trono, jaulas, armeros, estacas del ruedo…), choque al pie;
   - cm2t_ / of_t4_: muros, rejas y empalizadas en tramos: ck_profundidad.js los parte en franjas y se pasa por detrás bien;
   - cm2p_ / of_p4_: piso (caminos, tumbas abiertas, la terraza y el estrado de la fortaleza): debajo de todo, no chocan.
   En la fortaleza quedan las piezas de antes que se mueven (braseros, estandartes del trono y del patio) y tres que Flow
   borroneó (estandartes del arco y de cráneo, jaula colgada del muro).
   Este archivo sólo:
   - deja enteros los objetos nuevos (CK_PROF_ENTEROS);
   - saca los arreglos de notas de los mapas viejos (ck_notas_arreglos.js y _2.js: choques puestos y sacados a mano, piezas
     partidas, tapas del suelo, tramos del ruedo): eran para las piezas de antes y ya no calzan;
   - fortaleza: el dintel del portón se ordena por la línea de los postes (se pasa por debajo) y el estandarte de cráneo, colgado
     del muro, delante del muro;
   - las piezas nuevas no reciben "pies" de ck_pies_piezas.js: sus choques vienen medidos del dibujo (la jaula y el estandarte
     colgados del muro, ninguno).
   Va después de ck_notas_arreglos_2.js. Borrar su línea de index.html: vuelven los arreglos viejos (que no calzan con estos
   mapas) y los objetos nuevos se parten en franjas. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const NUEVAS = /^ed_(cm2|of_c4)_/;
  try {
    const PE = window.CK_PROF_ENTEROS;
    // el "source" sigue siendo un grupo ^ed_(…)_: otros archivos lo rearman con .source.replace(')_', '|xx)_')
    const src = PE && PE.source && PE.source.indexOf(')_') > 0 ? PE.source.replace(')_', '|cm2|of_c4)_') : '^ed_(cm2|of_c4)_';
    window.CK_PROF_ENTEROS = { test: k => NUEVAS.test(k) || !!(PE && PE.test(k)), source: src };
  } catch (e) { console.warn('[mapas recortes]', e); }
  try {
    const PP = window.CK_PIES_PIEZAS;
    if (PP && PP.SIN) PP.SIN.push(/^ed_(cm2|cm2t|cm2p|of_c4|of_t4|of_p4)_/, /^ed_of_c2_(jaula_colgante|estandarte_de_craneo)/);
  } catch (e) {}
  try {
    const NA = window.CK_NOTAS_ARREGLOS;
    if (NA && NA.Z) {
      NA.Z['ed_cementerio_real.main'] = {};
      NA.Z['ed_fortaleza_orca.main'] = { base: { of_c4_dintel_del_porton: 488, of_c2_estandarte_de_craneo: 318 } };
    }
  } catch (e) {}
})();
