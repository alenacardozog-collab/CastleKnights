'use strict';
/* Borra las notas del editor de habilidades que ya se hicieron (21/11, pedido del dueño: "si ya hiciste todas podés borrarlas
   así si toca apretar nuevas queda todo clean"). Son las 71 notas del archivo ajustes_habilidades.json del 21/11 (tandas 1 a 4,
   ver D:\Editor\PEDIDOS_HABILIDADES.md), la nota general (las sombras dobles…) y la nota escrita de Grushak (el hacha).
   Se borran por su número (id): las notas nuevas que se hagan después no se tocan. Los ajustes (capas, tamaños, números) quedan.
   Corre una sola vez, antes de que el editor (ck_editor_habilidades.js) lea lo guardado. Borrar su línea de index.html lo saca
   (las notas borradas no vuelven: están en el archivo exportado del 21/11).
   v2 (22/11, "cuando acabes todo reseteas las notas ya completadas así puedo hacer nuevas si hace falta"): también las 10 notas
   del archivo ajustes_habilidades (2).json del 22/11 (tanda 6), la habilidad nueva de Aby (Slice combo, ya hecha: id
   nmwsc9o5g) y la misma nota escrita en la Danza de filos. Otra vez una sola vez (su propia marca). */
(function () {
  const CLAVE = 'ck_ajustes_habilidades_v1', HECHO = 'ck_notas_editor_limpias_2111';
  const HECHAS = [
    1795277197398, 1795278971628, 1795284431020, 1795284538668, 1795284584099, 1795284651279,
    1795284697845, 1795284749877, 1795284776342, 1795284798777, 1795284901110, 1795284945904,
    1795284989385, 1795285038284, 1795285067470, 1795285088749, 1795285122397, 1795285167379,
    1795285200711, 1795285241843, 1795285288626, 1795285330609, 1795285364391, 1795285415982,
    1795285445421, 1795285516599, 1795285566717, 1795285606583, 1795285650215, 1795285705799,
    1795285742442, 1795285811571, 1795285857289, 1795285933141, 1795285986221, 1795286026434,
    1795286046450, 1795286069649, 1795286136480, 1795286194315, 1795286223781, 1795286284780,
    1795286332330, 1795286455372, 1795286492703, 1795286510886, 1795286558941, 1795286617736,
    1795286733866, 1795286782682, 1795286809232, 1795286864296, 1795286902341, 1795286939877,
    1795286967010, 1795286981759, 1795287045357, 1795287060025, 1795287086490, 1795287108255,
    1795287148154, 1795287225537, 1795287243654, 1795287299916, 1795287356048, 1795287416779,
    1795287485678, 1795287531726, 1795287602640, 1795287670538, 1795287692456
  ];
  // (v2: ya no corta acá con "return": si la primera ya se había hecho, la segunda igual tiene que correr)
  const ya1 = (() => { try { return localStorage.getItem(HECHO); } catch (e) { return '1'; } })();
  if (!ya1) try {
    const t = localStorage.getItem(CLAVE);
    if (t) {
      const o = JSON.parse(t), ya = new Set(HECHAS.map(String));
      let n = 0;
      if (o && Array.isArray(o.marcas)) { const antes = o.marcas.length; o.marcas = o.marcas.filter(m => !ya.has(String(m.id))); n = antes - o.marcas.length; }
      if (o && typeof o.notas === 'string' && /^arreglar las sombras de los personajes/.test(o.notas.trim())) o.notas = '';
      const g = o && o.otras && o.otras['orc_warlord:pisoton'];
      if (g && /arroje el hacha/.test(g.notas || '')) { delete g.notas; if (!Object.keys(g).filter(k => k !== 'nombre').length) delete o.otras['orc_warlord:pisoton']; }
      localStorage.setItem(CLAVE, JSON.stringify(o));
      console.info('[notas del editor] borradas las ' + n + ' notas ya hechas');
    }
    localStorage.setItem(HECHO, String(Date.now()));
  } catch (e) { console.warn('[notas del editor] limpieza', e); }
  // (v2) las del 22/11
  const HECHO2 = 'ck_notas_editor_limpias_2211';
  const HECHAS2 = [1795301096824, 1795301325380, 1795381788915, 1795381837530, 1795381909381, 1795381938748, 1795381987577, 1795382033841, 1795382059578, 1795382084187];
  const NUEVAS2 = ['nmwsc9o5g'];
  try {
    if (localStorage.getItem(HECHO2)) return;
    const t = localStorage.getItem(CLAVE);
    if (t) {
      const o = JSON.parse(t), ya = new Set(HECHAS2.map(String));
      let n = 0;
      if (o && Array.isArray(o.marcas)) { const antes = o.marcas.length; o.marcas = o.marcas.filter(m => !ya.has(String(m.id))); n = antes - o.marcas.length; }
      if (o && Array.isArray(o.nuevas)) { const antes = o.nuevas.length; o.nuevas = o.nuevas.filter(x => NUEVAS2.indexOf(x.id) < 0); n += antes - o.nuevas.length; }
      const dz = o && o.heroes && o.heroes.b_danza;
      if (dz && /^haz que tenga una habilidad que sea contra un solo oponente/.test((dz.notas || '').trim())) {
        delete dz.notas; n++;
        if (!Object.keys(dz).filter(k => k !== 'nombre' && k !== 'heroe').length) delete o.heroes.b_danza;
      }
      localStorage.setItem(CLAVE, JSON.stringify(o));
      console.info('[notas del editor] borradas las ' + n + ' notas ya hechas (22/11)');
    }
    localStorage.setItem(HECHO2, String(Date.now()));
  } catch (e) { console.warn('[notas del editor] limpieza 22/11', e); }
})();
