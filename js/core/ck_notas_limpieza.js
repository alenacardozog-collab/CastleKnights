'use strict';
/* Borra las notas de prueba ya hechas (15/11, pedido del dueño: "al terminar, las notas q puse borralas, así meto y si hay nuevas
   por hacer pinto los detalles"). Las 142 notas del 14/11 (las de notas_para_corregir.json, creadas hasta las 19:30 de Argentina)
   ya están arregladas: se sacan UNA sola vez del navegador (IndexedDB "ck_notas_prueba", donde las guarda ck_notas_prueba.js).
   Las notas nuevas (las que se hagan después de esa hora) no se tocan. Queda anotado en el navegador que ya se hizo
   (localStorage "ck_notas_limpias_20261115"), así no vuelve a borrar nada. Se puede sacar su línea de index.html cuando quieras. */
(function () {
  const HASTA = 1794695445617;                 // la última nota del 14/11 (creado, en ms)
  const MARCA = 'ck_notas_limpias_20261115';
  try { if (localStorage.getItem(MARCA)) return; } catch (e) { return; }
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
          if ((k.value && k.value.creado || 0) <= HASTA) { k.delete(); n++; }
          k.continue();
        };
        t.oncomplete = () => { try { localStorage.setItem(MARCA, String(n)); } catch (e) {} console.info('[notas] se borraron ' + n + ' notas viejas (ya arregladas)'); d.close(); };
        t.onerror = () => d.close();
      } catch (e) { d.close(); }
    };
  } catch (e) {}
})();
