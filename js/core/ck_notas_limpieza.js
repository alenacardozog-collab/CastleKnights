'use strict';
/* Borra las notas de prueba ya hechas, con sus trazos (pedidos del dueño: "al terminar, las notas q puse borralas, así meto y
   si hay nuevas por hacer pinto los detalles" (15/11) y "quitá las notas y los trazos que ya fueron corregidos" (16/11)).
   Las notas se guardan en el navegador (IndexedDB "ck_notas_prueba", ck_notas_prueba.js) y cada una lleva sus trazos adentro:
   al borrar la nota se van también sus trazos del mapa.
   - TANDA 1: las 142 notas del 14/11 (notas_para_corregir.json, creadas hasta las 19:30 de Argentina).
   - TANDA 2: las 48 notas del 15/11 (notas_para_corregir_1.json), por su número de nota exacto.
   - TANDA 3 (23/11, v3, pedido: "poné de 0 las notas y eliminá las que ya fueron hechas"): las 35 notas de
     notas_para_corregir (2).json, hechas en las tandas 8a a 8d: todas las creadas hasta que llegó ese archivo (23/11, 16:29 de
     Argentina). La lista queda en cero; las que se hagan después no se tocan.
   - TANDA 4 (23/11, v4): las 14 notas de notas_para_corregir (5).json, hechas en las tandas 9a a 9c, por su número de nota
     exacto (las que se hagan después no se tocan).
   - TANDA 5 (23/11, v5): las 12 notas de notas_para_corregir (6).json, hechas en las tandas 11a a 11c, por su número de nota
     exacto (las que se hagan después no se tocan).
   Cada tanda se borra UNA sola vez: queda anotado en el navegador (localStorage) y no vuelve a borrar nada. Las notas nuevas
   (las que se hagan después) no se tocan. Se puede sacar su línea de index.html cuando quieras. */
(function () {
  const TANDAS = [
    { marca: 'ck_notas_limpias_20261115', hasta: 1794695445617 },
    { marca: 'ck_notas_limpias_20261116', hasta: 1794762932957, ids: [
    'mwi1kxa9wzj8', 'mwi1mdy3t5ff', 'mwi1ntfnfzd8', 'mwi1o1gyn5uo', 'mwi1oh6mso3x', 'mwi1p4jzyb3u', 'mwi1pv838mbq', 'mwi1q6u2ul8q',
    'mwi1s13xi3ar', 'mwi1t219rpqd', 'mwi1tetffjmq', 'mwi1w3i8vabd', 'mwi1wy0414vz', 'mwi1x9z30cfk', 'mwi1xyfwnwbo', 'mwi1ygl80c02',
    'mwi1zzno7j6w', 'mwi22xv7iwh0', 'mwi2449hkauj', 'mwi26etxx2qc', 'mwi27l71f2pf', 'mwi2ash3kmvc', 'mwi2b6ce5pi6', 'mwi2bi809sl4',
    'mwi2bw3e8a30', 'mwi2dquf4nen', 'mwi2e48ndyww', 'mwi2itiq8u6o', 'mwi2lavs9xdk', 'mwi2milyddnk', 'mwi2nkjchu6y', 'mwi2ny3t42qp',
    'mwi2pkv4kzk7', 'mwi2qdnnqc1q', 'mwi2qpcolsqj', 'mwi2r6e4rr42', 'mwi2rlhrd70d', 'mwi2s28vyhn4', 'mwi2szrt2syy', 'mwi2v4ehxe9a',
    'mwi2w3kl9tkn', 'mwi2wtfo5png', 'mwi2x9vy89oc', 'mwi2y1rww82k', 'mwi2ysr6yxlr', 'mwi37jjao7mt', 'mwi3f9ig429t', 'mwi3ie3h9f8s'
    ] },
    { marca: 'ck_notas_limpias_20261123', hasta: 1795462140000 },
    { marca: 'ck_notas_limpias_20261123_9', hasta: 1795471118850, ids: [
    'mwtt59tu6v3y', 'mwtt3pn7lmf1', 'mwtt0dwb7jvh', 'mwtsychc2h7e', 'mwtsw620ky1t', 'mwtstn7fi1uy', 'mwtssx7djj0k', 'mwtsra3g83iz',
    'mwtspdamci94', 'mwtsobl3zvye', 'mwtsm0w9ws1l', 'mwtsl3c3xrag', 'mwtsjopz3x1v', 'mwtsiinnifcb'
    ] },
    { marca: 'ck_notas_limpias_20261123_11', hasta: 1795479931786, ids: [
    'mwtye5xmabud', 'mwtyalb2zp4r', 'mwtya9hr8owv', 'mwty8abmwhyk', 'mwty7nke4cqm', 'mwty7183dzjn', 'mwty56rj9ucl', 'mwty4bsrif75',
    'mwty2acl5o88', 'mwty1yeu63u3', 'mwtxz22mz40y', 'mwtxwb0ivea4'
    ] }
  ];
  const pendientes = TANDAS.filter(t => { try { return !localStorage.getItem(t.marca); } catch (e) { return false; } });
  if (!pendientes.length) return;
  const borrar = n => pendientes.some(t => {
    if (!n || (n.creado || 0) > t.hasta) return false;
    return !t.ids || t.ids.indexOf(n.id) >= 0;
  });
  try {
    const r = indexedDB.open('ck_notas_prueba', 1);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('notas')) d.createObjectStore('notas', { keyPath: 'id' }); if (!d.objectStoreNames.contains('ajustes')) d.createObjectStore('ajustes'); };
    r.onsuccess = () => {
      const d = r.result;
      try {
        const t = d.transaction('notas', 'readwrite'), s = t.objectStore('notas');
        let n = 0;
        const c = s.openCursor();
        c.onsuccess = () => {
          const k = c.result; if (!k) return;
          if (borrar(k.value)) { k.delete(); n++; }
          k.continue();
        };
        t.oncomplete = () => {
          try { pendientes.forEach(p => localStorage.setItem(p.marca, String(n))); } catch (e) {}
          console.info('[notas] se borraron ' + n + ' notas ya arregladas (con sus trazos)');
          d.close();
        };
        t.onerror = () => d.close();
      } catch (e) { d.close(); }
    };
  } catch (e) {}
})();
