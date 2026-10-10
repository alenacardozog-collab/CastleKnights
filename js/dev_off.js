'use strict';
/* MODO DEV APAGADO. Mientras este archivo esté cargado en index.html, el juego no ofrece el Modo Dev (F2 / M),
   el Estudio ni el Creador de Mapa: se quitan sus botones y sus teclas no hacen nada.
   No borra nada: los ajustes que se guardaron con esas herramientas (js/maps/data/studio_data.js) se siguen aplicando.
   Para volver a tenerlo: borrar de index.html la línea que carga js/dev_off.js. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  P.toggleDevMode = function () { };
  P.toggleStudio = function () { };
  P.openMapEditor = function () { };
  if (window._pendingAutoStart === 'editor') window._pendingAutoStart = false;
  ['btn-dev-toggle', 'btn-menu-editor'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  // fuera de la lista de teclas configurables
  try { const i = KEYBIND_DEFINITIONS.findIndex(d => d.id === 'devMode'); if (i >= 0) KEYBIND_DEFINITIONS.splice(i, 1); } catch (e) { }
  // fuera de la tira de controles del pie
  const limpiar = () => document.querySelectorAll('.control-pill').forEach(p => { if (/MODO DEV/i.test(p.textContent)) p.remove(); });
  limpiar(); new MutationObserver(limpiar).observe(document.body, { childList: true, subtree: true });
})();
