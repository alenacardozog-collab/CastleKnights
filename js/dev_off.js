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
  // Las 4 casas de la aldea y sus puertas no aceptan ajustes viejos del Estudio (guardados en el navegador):
  // si una casa quedaba agrandada o corrida, la puerta real seguía en su lugar original y no se podía entrar.
  const aplicar0 = P.studioApplyMoves;
  if (aplicar0) P.studioApplyMoves = function () {
    aplicar0.apply(this, arguments);
    try {
      if (this.currentInterior) return;
      (this.campaignObjectSprites || []).forEach(o => {
        const k = (o && o.texture && o.texture.key) || '', b = o && o._st0;
        if (!b || !(/House_Hay_/.test(k) || o._doorName)) return;
        o.setPosition(b.x, b.y); o.setScale(b.sx, b.sy); o.setFlipX(b.flip); o.setDepth(b.depth); o.setAlpha(b.alpha);
      });
    } catch (e) { }
  };
  if (window._pendingAutoStart === 'editor') window._pendingAutoStart = false;
  ['btn-dev-toggle', 'btn-menu-editor'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  // fuera de la lista de teclas configurables
  try { const i = KEYBIND_DEFINITIONS.findIndex(d => d.id === 'devMode'); if (i >= 0) KEYBIND_DEFINITIONS.splice(i, 1); } catch (e) { }
  // fuera de la tira de controles del pie
  const limpiar = () => document.querySelectorAll('.control-pill').forEach(p => { if (/MODO DEV/i.test(p.textContent)) p.remove(); });
  limpiar(); new MutationObserver(limpiar).observe(document.body, { childList: true, subtree: true });
})();
