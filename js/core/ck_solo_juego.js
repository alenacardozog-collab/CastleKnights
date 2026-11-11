'use strict';
/* Sólo el juego en la pantalla (11/11, pedido del dueño: "en la pantalla de inicio del juego, antes de darle full screen,
   sale como opciones y eso y el cuadrado; ¿eso se puede quitar y dejar sólo el juego full screen?").
   - Ya no se ven la cabecera de la página (título, Menú, Sonido, Fullscreen, Modo Dev), la barra de teclas de abajo, el
     marco de madera ni el marco de piedra con telarañas de la portada (v2): el juego ocupa toda la ventana desde el primer
     instante (un estilo en el <head> de index.html lo esconde antes de que cargue nada), sobre fondo negro.
   - Pantalla completa de verdad: el navegador sólo la deja pedir después de que el jugador toca algo, así que se pide
     sola con el primer clic o la primera tecla (y la F la sigue prendiendo y apagando, como siempre).
   - Lo que hacían esos botones sigue estando: el menú y la salida arriba a la derecha del juego (y Esc), el sonido en
     Opciones, el modo desarrollador con F2.
   Con ?pagina=1 en la dirección se ve la página como antes (para el modo desarrollador con mouse). Borrar la línea de
   index.html vuelve a la página de antes. */
(function () {
  if (typeof document === 'undefined') return;
  if (new URLSearchParams(location.search).get('pagina') === '1') return;
  const css = `
body.ck-solo .header-bar, body.ck-solo .controls-bar { display: none !important; }
body.ck-solo { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; }
body.ck-solo .game-viewport-wrapper { position: fixed !important; inset: 0 !important; max-width: none !important; width: 100vw !important; height: 100vh !important;
  border: none !important; box-shadow: none !important; margin: 0 !important; }
body.ck-solo #game-canvas-container { width: 100vw !important; height: 100vh !important; }
body.ck-solo #start-menu-overlay::after, body.ck-solo .ck2-esq { display: none !important; }
body.ck-solo #dev-toolbar:not(.hidden) { position: fixed !important; top: 0; left: 0; right: 0; z-index: 99995; }
`;
  const st = document.createElement('style'); st.id = 'ck-solo-css'; st.textContent = css; document.head.append(st);
  const prender = () => document.body && document.body.classList.add('ck-solo');
  if (document.body) prender(); else document.addEventListener('DOMContentLoaded', prender);
  const ajustar = () => { try { window.game && game.scale && game.scale.refresh(); } catch (e) {} };
  addEventListener('load', () => setTimeout(ajustar, 300));
  addEventListener('resize', () => setTimeout(ajustar, 150));

  // pantalla completa con el primer gesto (no en el celular: ck_movil.js ya la pide con el primer toque)
  let pedida = false;
  const pedir = e => {
    if (pedida) return; pedida = true;
    if (window.CK_MOVIL && window.CK_MOVIL.activo) return;
    if (e && e.key && /^(f|F|F2|F11|Escape)$/.test(e.key)) return;   // esas teclas tienen su propio uso
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const w = document.getElementById('game-wrapper');
    try {
      const p = w && (w.requestFullscreen ? w.requestFullscreen() : w.webkitRequestFullscreen && w.webkitRequestFullscreen());
      if (p && p.catch) p.catch(() => {});
    } catch (er) {}
    setTimeout(ajustar, 200);
  };
  addEventListener('mousedown', pedir, { once: false, capture: true });
  addEventListener('keydown', e => { if (e.isTrusted) pedir(e); }, { capture: true });
  window.CK_SOLO_JUEGO = { ajustar };
})();
