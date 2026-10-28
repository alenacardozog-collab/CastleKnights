'use strict';
/* UI nueva "piedra, madera y pergamino" (diseño del dueño, 14/10): reviste TODA la interfaz con piezas recortadas de sus 5
   imágenes de referencia (js/maps/data/ui_castillo_assets.js) y la letra Grenze.
   - Intro: el mismo video y los mismos tiempos de siempre, con marco de piedra y madera, adornos góticos en las esquinas, el
     logo dorado que se forja y un brillo que lo cruza, y botones de piedra con puntas.
   - Ventanas (pausa, opciones, partidas, salir, mapa, tienda, diario): marco de piedra y madera con pergamino adentro.
   - En el juego: orbe rojo de vida y orbe azul de aguante/maná, placa de monedas, barra rápida de piedra, minimapa con marco,
     la misión en un pergamino, diálogo con columnas góticas y retrato, cartel "T · ..." de piedra.
   - El libro de elección de héroe queda igual (solo cambian los botones).
   Todo vive en este archivo y en su CSS: borrar sus dos líneas en index.html vuelve a la UI anterior. */
(function () {
  const A = window.CK_UI2_ARTE;
  if (!A || typeof document === 'undefined') return;
  const u = n => 'url("' + A[n] + '")';
  const K = 2; // píxeles de pantalla por píxel del arte (en el juego)
  const P = n => 'calc(var(--ck2-n, 2.7) * ' + n + 'px)'; // n píxeles del diseño de la portada (480×268)
  const X = ':is(.start-menu-btn,#ck2-x)'; // sube la prioridad sobre las reglas con id de ui-theme.css

  // ------------------------------------------------------------------ estilos
  const css = `
@font-face { font-family: 'CK Grenze'; src: url("${A.f500}") format('woff'); font-weight: 100 600; font-display: block; }
@font-face { font-family: 'CK Grenze'; src: url("${A.f700}") format('woff'); font-weight: 700 900; font-display: block; }
body.ck-ui2 {
  --ck2-f: 'CK Grenze', 'Pixuf', serif;
  --ui-font: var(--ck2-f); --ui-title: var(--ck2-f); --font-main: var(--ck2-f); --font-title: var(--ck2-f); --font-pixuf: var(--ck2-f);
  --ck2-tinta: #2e1d14; --ck2-crema: #f3ead9; --ck2-oro: #e9c27a; --ck2-perg: #e2c596;
}
body.ck-ui2 .ck2-px, body.ck-ui2 [class^="ck2-"] img { image-rendering: pixelated; }

/* ===== botón de piedra con puntas (menús, opciones, elecciones) ===== */
body.ck-ui2 .ck2-piedra, body.ck-ui2 #start-menu-overlay .start-menu-btn, body.ck-ui2 .modal-overlay .wooden-sign-btn,
body.ck-ui2 .modal-overlay .dev-btn, body.ck-ui2 .ck-close, body.ck-ui2 .ckr-btn, body.ck-ui2 #btn-hero-confirm${X},
body.ck-ui2 #btn-hero-cancel${X}, body.ck-ui2 #btn-hero-newgame, body.ck-ui2 #ck-chat .p button, body.ck-ui2 .ck-item button, body.ck-ui2 #btn-reset-keybinds {
  border-style: solid !important; border-color: transparent !important; border-width: ${6 * K}px ${20 * K}px !important;
  border-image: ${u('boton_piedra')} 6 22 fill / ${6 * K}px ${20 * K}px stretch !important;
  background: none !important; box-shadow: none !important; clip-path: none !important; border-radius: 0 !important;
  font-family: var(--ck2-f) !important; font-weight: 700 !important; letter-spacing: 0.5px !important; text-transform: none !important;
  color: var(--ck2-crema) !important; -webkit-text-fill-color: var(--ck2-crema); text-shadow: 0 2px 0 #1b1517, 0 0 2px #1b1517 !important;
  image-rendering: pixelated; filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.45)); transition: filter 0.12s, transform 0.12s;
}
body.ck-ui2 .ck2-piedra:hover, body.ck-ui2 .modal-overlay .wooden-sign-btn:hover, body.ck-ui2 .modal-overlay .dev-btn:hover, body.ck-ui2 .ck-close:hover,
body.ck-ui2 .ckr-btn:hover, body.ck-ui2 #btn-hero-confirm:not(.is-disabled):hover, body.ck-ui2 #ck-chat .p button:hover, body.ck-ui2 .ck-item button:not(:disabled):hover {
  filter: brightness(1.18) drop-shadow(0 3px 0 rgba(0, 0, 0, 0.45)) drop-shadow(0 0 8px rgba(255, 214, 130, 0.55)) !important;
  color: #ffe6a6 !important; -webkit-text-fill-color: #ffe6a6; transform: none !important;
}
body.ck-ui2 .modal-overlay .btn-nail, body.ck-ui2 .modal-overlay .btn-menu-icon, body.ck-ui2 .modal-overlay .hud-btn-icon { display: none !important; }
body.ck-ui2 .ck-item button:disabled, body.ck-ui2 #btn-hero-confirm.is-disabled { filter: grayscale(0.8) brightness(0.7) !important; opacity: 0.8; }

/* ===== tabla de madera (botones chicos y secundarios) ===== */
body.ck-ui2 .ck2-tabla, body.ck-ui2 .btn-hud-menu, body.ck-ui2 .header-actions .btn, body.ck-ui2 .keybind-btn,
body.ck-ui2 .ckm-bot button, body.ck-ui2 .ckm-zonas button, body.ck-ui2 .opt-card-btn, body.ck-ui2 .ckr-btn.rojo {
  border-style: solid !important; border-color: transparent !important; border-width: ${5 * K}px !important;
  border-image: ${u('tabla_lisa')} 5 fill / ${5 * K}px stretch !important; background: none !important; box-shadow: none !important; border-radius: 0 !important;
  font-family: var(--ck2-f) !important; font-weight: 700 !important; color: var(--ck2-crema) !important; -webkit-text-fill-color: var(--ck2-crema);
  text-shadow: 0 2px 0 #1b0f0a !important; image-rendering: pixelated; clip-path: none !important;
}
body.ck-ui2 .btn-hud-menu:hover, body.ck-ui2 .header-actions .btn:hover, body.ck-ui2 .keybind-btn:hover,
body.ck-ui2 .ckm-bot button:hover, body.ck-ui2 .ckm-zonas button:hover, body.ck-ui2 .opt-card-btn:hover { filter: brightness(1.2); transform: none !important; }

/* ===== ventanas: marco de piedra y madera con pergamino ===== */
body.ck-ui2 .modal-overlay .modal-card, body.ck-ui2 .ck-win {
  border-style: solid !important; border-color: transparent !important; border-width: ${13 * K}px !important; border-radius: 0 !important;
  border-image: ${u('marco')} 13 / ${13 * K}px round !important;
  background: radial-gradient(ellipse at 50% 30%, #ecd3a6 0%, #e2c596 55%, #cfab74 100%) !important;
  box-shadow: inset 0 0 0 2px #2b1a10, inset 0 0 26px rgba(110, 70, 30, 0.45), 0 14px 40px rgba(0, 0, 0, 0.65) !important;
  color: var(--ck2-tinta) !important; font-family: var(--ck2-f) !important; image-rendering: pixelated; clip-path: none !important;
}
body.ck-ui2 .modal-overlay .modal-card::before, body.ck-ui2 .modal-overlay .modal-card::after { display: none !important; }
/* 19/10: aire adentro del marco para que nada toque el borde (las puntas de los botones de piedra llegaban al marco) */
body.ck-ui2 .modal-overlay .modal-card { padding-left: 30px !important; padding-right: 30px !important; box-sizing: border-box !important; }
body.ck-ui2 .modal-overlay .pause-actions, body.ck-ui2 .modal-overlay .exit-actions, body.ck-ui2 .modal-overlay .options-actions {
  padding: 0 6px !important; box-sizing: border-box !important; gap: 10px 18px !important; width: 100% !important; max-width: none !important; }
body.ck-ui2 .modal-overlay .exit-actions > *, body.ck-ui2 .modal-overlay .options-actions > * { min-width: 0 !important; }
/* la lista de teclas: la barra de desplazamiento ocupa lugar a los dos lados, así las filas quedan alineadas con lo de arriba */
body.ck-ui2 #options-modal .options-container { scrollbar-gutter: stable; padding-left: 0 !important; padding-right: 0 !important;
  margin-left: 0 !important; margin-right: -12px !important; width: auto !important; }
body.ck-ui2 #options-modal .options-container::-webkit-scrollbar { width: 12px; }
body.ck-ui2 #options-modal .options-container::-webkit-scrollbar-track { background: transparent; }
body.ck-ui2 #options-modal .options-container::-webkit-scrollbar-thumb { background: #8a5a2c; border: 3px solid #e2c596; border-radius: 0; }
body.ck-ui2 #options-modal .keybinds-grid { width: 100% !important; margin: 0 !important; box-sizing: border-box !important; }
body.ck-ui2 #exit-modal .modal-card { width: min(700px, 94vw) !important; max-width: none !important; }
body.ck-ui2 #exit-modal .exit-actions > * { flex: 1 1 0 !important; width: auto !important; font-size: 17px !important; padding: 0 4px 2px !important; }
body.ck-ui2 .modal-overlay { background: rgba(8, 6, 10, 0.72) !important; }
body.ck-ui2 .modal-overlay .modal-title, body.ck-ui2 .ck-win h3 {
  font-family: var(--ck2-f) !important; font-weight: 700 !important; font-size: 34px !important; letter-spacing: 0.5px !important; text-transform: none !important;
  color: var(--ck2-tinta) !important; -webkit-text-fill-color: var(--ck2-tinta); background: none !important; text-shadow: 0 1px 0 rgba(255, 240, 210, 0.6) !important;
  border: 0 !important; margin: 4px 0 6px !important;
}
body.ck-ui2 .modal-overlay .modal-title::after, body.ck-ui2 .ck-win h3::after {
  content: ''; display: block; width: 70%; height: 2px; margin: 6px auto 0; background: linear-gradient(90deg, transparent, #8a5a2c 20%, #8a5a2c 80%, transparent);
}
body.ck-ui2 .modal-overlay .epitaph-header {
  display: inline-block !important; font-family: var(--ck2-f) !important; font-weight: 700 !important; font-size: 13px !important; letter-spacing: 2px !important;
  color: var(--ck2-tinta) !important; background: none !important; padding: ${4 * K}px ${22 * K}px ${4 * K}px ${8 * K}px !important;
  border-style: solid !important; border-color: transparent !important; border-width: ${4 * K}px ${20 * K}px ${4 * K}px ${8 * K}px !important;
  border-image: ${u('cinta')} 4 20 4 8 fill / ${4 * K}px ${20 * K}px ${4 * K}px ${8 * K}px stretch !important; box-shadow: none !important; padding: 0 6px !important;
}
body.ck-ui2 .modal-overlay .modal-subtitle, body.ck-ui2 .ck-win p { font-family: var(--ck2-f) !important; font-size: 18px !important; color: #4a3020 !important; }
body.ck-ui2 .modal-overlay .modal-stats { background: rgba(120, 80, 40, 0.14) !important; border: 2px solid rgba(90, 58, 30, 0.5) !important; box-shadow: none !important; }
body.ck-ui2 .modal-overlay .modal-stats .val { font-family: var(--ck2-f) !important; font-weight: 700; color: #7a2418 !important; }
body.ck-ui2 .modal-overlay .modal-stats .lbl { font-family: var(--ck2-f) !important; color: #4a3020 !important; }
body.ck-ui2 .ck-win h4 { font-family: var(--ck2-f) !important; font-weight: 700; font-size: 18px !important; color: #6b2414 !important; }

/* ===== intro / pantalla de inicio ===== */
body.ck-ui2 #start-menu-overlay::after {
  content: ''; position: absolute; inset: 0; z-index: 6; pointer-events: none; image-rendering: pixelated;
  border: ${P(13)} solid transparent; border-image: ${u('marco')} 13 / ${P(13)} round;
  animation: ck2Marco 1.6s cubic-bezier(0.2, 0.8, 0.25, 1) 0.1s both;
}
body.ck-ui2 .ck2-esq { position: absolute; z-index: 6; width: ${P(34)}; height: ${P(34)}; background-size: 100% 100%; image-rendering: pixelated; pointer-events: none; animation: ck2Esq 1.4s ease-out 0.9s both; }
body.ck-ui2 .ck2-esq.si { left: ${P(13)}; top: ${P(13)}; background-image: ${u('esq_si')}; }
body.ck-ui2 .ck2-esq.sd { right: ${P(13)}; top: ${P(13)}; background-image: ${u('esq_sd')}; }
body.ck-ui2 .ck2-esq.ii { left: ${P(13)}; bottom: ${P(13)}; background-image: ${u('esq_ii')}; }
body.ck-ui2 .ck2-esq.id { right: ${P(13)}; bottom: ${P(13)}; background-image: ${u('esq_id')}; }
@keyframes ck2Marco { 0% { opacity: 0; transform: scale(1.06); } 100% { opacity: 1; transform: none; } }
@keyframes ck2Esq { 0% { opacity: 0; } 100% { opacity: 1; } }
/* todo se mide en píxeles del diseño (--ck2-n = pantalla / 268 de alto), así queda igual de proporcionado en ventana y en pantalla completa */
body.ck-ui2 #start-menu-overlay .start-menu-content { position: absolute !important; inset: 0 !important; width: auto !important; zoom: 1 !important;
  display: flex !important; flex-direction: column !important; justify-content: flex-start !important; align-items: center !important; padding: ${P(21)} 0 0 !important; margin: 0 !important; }
body.ck-ui2 #start-menu-overlay .sm-logo-emblem, body.ck-ui2 #start-menu-overlay .start-menu-title, body.ck-ui2 #start-menu-overlay .sm-pennant { display: none !important; }
body.ck-ui2 .ck2-logo { position: relative; z-index: 1; width: ${P(291)}; aspect-ratio: 291 / 69; image-rendering: pixelated;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.6)) drop-shadow(0 0 22px rgba(255, 200, 110, 0.28)); }
body.ck-ui2 .ck2-logo img { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
body.ck-ui2 .ck2-logo::after {        /* el brillo que cruza las letras, recortado con la forma del logo */
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, rgba(255, 255, 255, 0) 40%, rgba(255, 250, 225, 0.95) 50%, rgba(255, 255, 255, 0) 60%) no-repeat;
  background-size: 250% 100%; background-position: 180% 0;
  -webkit-mask: ${u('logo')} center / 100% 100% no-repeat; mask: ${u('logo')} center / 100% 100% no-repeat;
  mix-blend-mode: screen; animation: ck2Brillo 7s ease-in-out 3.4s infinite;
}
/* chispas de la forja: salen del logo cuando cae el golpe de luz */
body.ck-ui2 .ck2-chispas { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 3; pointer-events: none; transform: scale(calc(var(--ck2-n, 2.7) / 2.7)); }
body.ck-ui2 .ck2-chispas i { position: absolute; left: 0; top: 0; width: var(--t); height: var(--t); background: var(--c); box-shadow: 0 0 10px 3px rgba(255, 170, 60, 0.9);
  opacity: 0; animation: ck2ChispaMov var(--dur) cubic-bezier(0.15, 0.7, 0.3, 1) var(--d) both, ck2ChispaLuz var(--dur) linear var(--d) both; }
@keyframes ck2ChispaMov { 0% { transform: translate(var(--x0), 0); } 100% { transform: translate(var(--x), calc(var(--y) + 40px)); } }
@keyframes ck2ChispaLuz { 0% { opacity: 0; } 5% { opacity: 1; } 55% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { body.ck-ui2 .ck2-chispas, body.ck-ui2 .ck2-logo::after { display: none; } body.ck-ui2 #start-menu-overlay::after, body.ck-ui2 .ck2-esq { animation: none; } }
@keyframes ck2Brillo { 0%, 76% { background-position: 180% 0; } 92%, 100% { background-position: -80% 0; } }
body.ck-ui2 #start-menu-overlay .sm-logo-flash { top: 52%; }
body.ck-ui2 #start-menu-overlay .sm-press {
  font-family: var(--ck2-f) !important; font-weight: 600; font-size: ${P(9)} !important; letter-spacing: 0.5px !important; text-transform: none !important; position: absolute !important; left: 0; right: 0; bottom: ${P(22)}; margin: 0 !important; text-align: center;
  color: #ecc98e !important; text-shadow: 0 2px 0 #120a06, 0 0 14px rgba(255, 190, 90, 0.45) !important;
}
body.ck-ui2 #start-menu-overlay .start-menu-nav { gap: ${P(6)} !important; margin-top: ${P(30)} !important; width: auto !important; }
body.ck-ui2 #start-menu-overlay .start-menu-btn${X} {
  width: ${P(100)} !important; min-height: 0 !important; height: ${P(22)} !important; padding: 0 0 ${P(1)} !important; font-size: ${P(8.5)} !important; line-height: 1 !important; box-sizing: border-box !important; letter-spacing: 0.3px !important;
  border-width: ${P(6)} ${P(20)} !important; border-image: ${u('boton_piedra')} 6 22 fill / ${P(6)} ${P(20)} stretch !important;
}
body.ck-ui2 #start-menu-overlay .start-menu-btn.sm-small${X} { width: ${P(100)} !important; font-size: ${P(8.5)} !important; }
body.ck-ui2 #start-menu-overlay .sm-minor { gap: ${P(6)} !important; margin-top: 0 !important; }
body.ck-ui2 #start-menu-overlay .sm-ico, body.ck-ui2 #start-menu-overlay #sm-cursor { display: none !important; }
body.ck-ui2 #start-menu-overlay .start-menu-btn.is-selected${X} {
  transform: scale(1.06) !important; color: #ffe6a6 !important; -webkit-text-fill-color: #ffe6a6;
  filter: brightness(1.2) drop-shadow(0 3px 0 rgba(0, 0, 0, 0.5)) drop-shadow(0 0 12px rgba(255, 210, 120, 0.75)) !important;
}
body.ck-ui2 #start-menu-overlay .start-menu-btn:active${X} { transform: scale(0.98) !important; }
body.ck-ui2 #start-menu-overlay .sm-bottom { font-family: var(--ck2-f) !important; font-size: max(11px, ${P(4.6)}) !important; bottom: ${P(17)} !important; padding: 0 ${P(50)} !important; color: rgba(236, 201, 142, 0.75) !important; }
body.ck-ui2 #start-menu-overlay .sm-hint b { font-family: var(--ck2-f); font-weight: 700; }

/* ===== barra de arriba de la página ===== */
body.ck-ui2 .header-bar .game-title { font-family: var(--ck2-f) !important; font-weight: 700 !important; letter-spacing: 1px !important; font-size: 30px !important; text-transform: none !important;
  background: linear-gradient(180deg, #fff1c4 0%, #f2c873 45%, #b8782c 100%) !important; -webkit-background-clip: text !important; background-clip: text !important;
  color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; filter: drop-shadow(0 2px 0 #1b0f0a); }
body.ck-ui2 .header-bar .title-badge { font-family: var(--ck2-f) !important; }
body.ck-ui2 .header-actions .btn { padding: 2px 10px !important; font-size: 15px !important; }
body.ck-ui2 .header-actions .btn .px-ico { display: none !important; }

/* ===== libro de héroes: solo botones y título ===== */
body.ck-ui2 .hero-modal-title { font-family: var(--ck2-f) !important; font-weight: 700 !important; letter-spacing: 0.5px !important;
  background: linear-gradient(180deg, #fff1c4 0%, #f2c873 45%, #b8782c 100%) !important; -webkit-background-clip: text !important; background-clip: text !important;
  -webkit-text-fill-color: transparent !important; filter: drop-shadow(0 3px 0 #1b0f0a); }
body.ck-ui2 #hero-modal-subtitle, body.ck-ui2 .hero-modal-badge { font-family: var(--ck2-f) !important; }
body.ck-ui2 .hero-modal-actions { justify-content: center !important; gap: 18px !important; margin-top: 10px !important; }
body.ck-ui2 .hero-modal-actions > * { flex: 0 0 auto !important; }
body.ck-ui2 #btn-hero-confirm${X}, body.ck-ui2 #btn-hero-cancel${X} { min-width: 0 !important; width: auto !important; min-height: 0 !important; height: auto !important; padding: 0 10px 2px !important; font-size: 21px !important; }
body.ck-ui2 #btn-hero-cancel${X} { font-size: 18px !important; }
/* con el libro abierto el marco de la portada se corre para no taparle los botones */
body.ck-ui2:has(#hero-selection-modal.active) #start-menu-overlay::after, body.ck-ui2:has(#hero-selection-modal.active) .ck2-esq { opacity: 0 !important; transition: opacity 0.4s; }

/* ===== partidas guardadas ===== */
body.ck-ui2 #ck-ranuras .ckr-slot { background: rgba(120, 80, 40, 0.12) !important; border: 2px solid rgba(90, 58, 30, 0.55) !important; box-shadow: inset 0 0 0 2px rgba(255, 240, 210, 0.35) !important; }
body.ck-ui2 #ck-ranuras .ckr-nombre { font-family: var(--ck2-f) !important; font-weight: 700; font-size: 20px !important; color: var(--ck2-tinta) !important; }
body.ck-ui2 #ck-ranuras .ckr-det { font-family: var(--ck2-f) !important; font-size: 15px !important; color: #5a3a24 !important; }
body.ck-ui2 #ck-ranuras .ckr-cara { border: 3px solid #3a2414 !important; background: #2a1c24 !important; }
body.ck-ui2 #ck-ranuras .ckr-btn { font-size: 15px !important; padding: 0 4px 2px !important; }
/* 19/10: las puntas de los botones no tocan el borde de la ranura */
body.ck-ui2 #ck-ranuras .ckr-slot { padding: 12px 24px 12px 14px !important; box-sizing: border-box !important; gap: 14px !important; }
body.ck-ui2 #ck-ranuras .ckr-slot button + button { margin-left: 10px !important; }
body.ck-ui2 #ck-ranuras .ckr-input { font-family: var(--ck2-f) !important; font-size: 18px !important; background: #f6e6c4 !important; border: 2px solid #5a3a24 !important; color: var(--ck2-tinta) !important; }

/* ===== opciones ===== */
body.ck-ui2 #options-modal .opt-card-btn { color: var(--ck2-crema) !important; }
body.ck-ui2 #options-modal .opt-card-btn * { color: inherit !important; font-family: var(--ck2-f) !important; }
body.ck-ui2 #options-modal .vol-name, body.ck-ui2 #options-modal .keybind-label { font-family: var(--ck2-f) !important; font-weight: 700; color: var(--ck2-tinta) !important; font-size: 16px !important; }
body.ck-ui2 #options-modal small, body.ck-ui2 #options-modal .keybind-desc { font-family: var(--ck2-f) !important; color: #5a3a24 !important; font-size: 13px !important; }
body.ck-ui2 #options-modal .vol-val { font-family: var(--ck2-f) !important; color: #7a2418 !important; font-weight: 700; }
body.ck-ui2 #options-modal .keybind-row { background: rgba(120, 80, 40, 0.1) !important; border: 1px solid rgba(90, 58, 30, 0.35) !important; }
body.ck-ui2 #options-modal .keybind-btn { min-width: 70px; font-size: 15px !important; padding: 0 6px !important; }
body.ck-ui2 #options-modal .options-section-divider { font-family: var(--ck2-f) !important; font-weight: 700; font-size: 16px !important; letter-spacing: 2px; color: #7a2418 !important; border-color: rgba(90, 58, 30, 0.55) !important; }
body.ck-ui2 #options-modal .options-container, body.ck-ui2 #options-modal .keybinds-grid > * { color: var(--ck2-tinta) !important; font-family: var(--ck2-f) !important; }
body.ck-ui2 #options-modal .keybinds-grid > * { background: rgba(120, 80, 40, 0.12) !important; border: 2px solid rgba(90, 58, 30, 0.5) !important; }
body.ck-ui2 .modal-overlay .exit-actions button, body.ck-ui2 .modal-overlay .options-actions button { white-space: nowrap !important; font-size: 18px !important; }

/* ===== pausa: retrato en arco de piedra + atributos ===== */
body.ck-ui2 #pause-modal .modal-card { width: min(780px, 94vw) !important; max-width: none !important; }
body.ck-ui2 .ck2-pausa { display: flex; gap: 22px; align-items: stretch; width: 100%; margin: 4px 0 40px; }
body.ck-ui2 .ck2-arco { position: relative; flex: 0 0 auto; width: ${78 * K}px; height: ${114 * K}px; }
body.ck-ui2 .ck2-arco .marco { position: absolute; inset: 0; background: ${u('marco_arco')} center / 100% 100% no-repeat; image-rendering: pixelated; z-index: 2; }
body.ck-ui2 .ck2-arco .fondo { position: absolute; left: 18%; right: 18%; top: 13%; bottom: 10%; background: radial-gradient(circle at 50% 40%, #4a3446 0%, #1d1420 75%); z-index: 0; border-radius: 40% 40% 0 0 / 22% 22% 0 0; }
body.ck-ui2 .ck2-arco img.cara { position: absolute; left: 18%; width: 64%; bottom: 13%; z-index: 1; image-rendering: pixelated; }
body.ck-ui2 .ck2-arco .nombre { position: absolute; left: 0; right: 0; bottom: -30px; text-align: center; font-family: var(--ck2-f); font-weight: 700; font-size: 20px; color: var(--ck2-tinta); }
body.ck-ui2 .ck2-atrs { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; align-content: center; }
body.ck-ui2 .ck2-atr { display: flex; align-items: center; gap: 10px; }
body.ck-ui2 .ck2-atr i { flex: 0 0 auto; width: ${30 * K}px; height: ${30 * K}px; background-size: 100% 100%; image-rendering: pixelated; }
body.ck-ui2 .ck2-atr .t { display: flex; flex-direction: column; align-items: flex-start; }
body.ck-ui2 .ck2-atr .t b { display: inline-block; font-family: var(--ck2-f); font-weight: 700; font-size: 13px; letter-spacing: 1.5px; color: var(--ck2-tinta);
  border-style: solid; border-color: transparent; border-width: ${4 * K}px ${20 * K}px ${4 * K}px ${8 * K}px; border-image: ${u('cinta')} 4 20 4 8 fill / ${4 * K}px ${20 * K}px ${4 * K}px ${8 * K}px stretch;
  padding: 0 4px; line-height: 1; image-rendering: pixelated; }
body.ck-ui2 .ck2-atr .t span { font-family: var(--ck2-f); font-weight: 700; font-size: 26px; color: var(--ck2-tinta); padding-left: 14px; line-height: 1.1; }
body.ck-ui2 #pause-modal .pause-actions { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px 14px !important; width: 100% !important; max-width: none !important; }
body.ck-ui2 #pause-modal .pause-actions button { width: 100% !important; white-space: nowrap !important; font-size: 19px !important; padding: 0 4px 2px !important; min-height: 0 !important; height: auto !important; }

/* ===== HUD: orbes, monedas, barra rápida ===== */
body.ck-ui2 .ck2-hud { position: absolute; inset: 0; z-index: 41; pointer-events: none; display: none; font-family: var(--ck2-f); }
body.ck-ui2 .ck2-hud.on { display: block; }
body.ck-ui2 .ck2-orbe { position: absolute; bottom: 6px; width: ${70 * K}px; height: ${70 * K}px; }
body.ck-ui2 .ck2-orbe.vida { left: 6px; } body.ck-ui2 .ck2-orbe.mana { right: 6px; }
body.ck-ui2 .ck2-orbe > * { position: absolute; inset: 0; background-size: 100% 100%; image-rendering: pixelated; }
body.ck-ui2 .ck2-orbe .vacio { background-image: ${u('orbe_vacio')}; }
body.ck-ui2 .ck2-orbe.vida .lleno { background-image: ${u('orbe_vida')}; }
body.ck-ui2 .ck2-orbe.mana .lleno { background-image: ${u('orbe_mana')}; }
body.ck-ui2 .ck2-orbe .lleno { clip-path: inset(var(--vacio, 0%) 0 0 0); transition: clip-path 0.25s ease-out; }
body.ck-ui2 .ck2-orbe .marco { background-image: ${u('orbe_marco')}; }
body.ck-ui2 .ck2-orbe .num { inset: auto 0 ${30 * K}px 0; text-align: center; font-weight: 700; font-size: 20px; color: #fff; text-shadow: 0 2px 0 #1b0f0a, 0 0 4px #1b0f0a; }
body.ck-ui2 .ck2-orbe.bajo .lleno { animation: ck2Late 0.9s ease-in-out infinite; }
@keyframes ck2Late { 50% { filter: brightness(1.5); } }
body.ck-ui2 .ck2-nombre { position: absolute; left: ${64 * K}px; bottom: ${30 * K}px; font-weight: 700; font-size: 18px; color: var(--ck2-crema); text-shadow: 0 2px 0 #000, 0 0 6px #000; white-space: nowrap; }
body.ck-ui2 .ck2-nombre small { font-size: 14px; color: var(--ck2-oro); margin-left: 6px; }
body.ck-ui2 .ck2-monedas { position: absolute; left: ${63 * K}px; bottom: ${8 * K}px; width: ${70 * K}px; height: ${23 * K}px; background: ${u('placa_monedas')} 0 0 / 100% 100%; image-rendering: pixelated; }
body.ck-ui2 .ck2-monedas span { position: absolute; left: ${16 * K}px; right: ${6 * K}px; top: 0; bottom: 0; display: flex; align-items: center; font-weight: 700; font-size: 19px; color: var(--ck2-crema); text-shadow: 0 2px 0 #1b0f0a; }
body.ck-ui2 .ck2-hud.dialogo .ck2-monedas, body.ck-ui2 .ck2-hud.dialogo .ck2-nombre { opacity: 0; }
body.ck-ui2 .in-game-hud .hud-player-card { display: none !important; }
body.ck-ui2 .in-game-hud .btn-hud-menu { font-size: 15px !important; padding: 0 10px !important; min-height: 0 !important; }
body.ck-ui2 .in-game-hud .btn-hud-menu .hud-btn-icon { display: none !important; }
/* barra rápida (Z poción, X elixir, C parada) dentro del marco de piedra */
body.ck-ui2 #ck-quick { left: 50% !important; bottom: 30px !important; transform: translateX(-50%); width: ${118 * K}px; height: ${47 * K}px; gap: 0 !important; padding: ${10 * K}px 0 0 ${12 * K}px; box-sizing: border-box;
  background: ${u('barra_rapida3')} 0 0 / 100% 100% no-repeat; image-rendering: pixelated; transition: opacity 0.2s; }
body.ck-ui2.ck2-dlg #ck-quick { opacity: 0; }
body.ck-ui2 #ck-quick .ck-slot { width: ${27 * K}px; height: ${26 * K}px; margin-right: ${8 * K}px; background: none !important; border: 0 !important; box-shadow: none !important; }
body.ck-ui2 #ck-quick .ck-slot i { left: ${1 * K}px !important; top: ${1 * K}px !important; width: ${25 * K}px !important; height: ${24 * K}px !important; border-radius: 0 !important; box-shadow: none !important;
  background: ${u('ic_pocion')} 0 0 / 100% 100% no-repeat !important; image-rendering: pixelated; }
body.ck-ui2 #ck-quick .ck-slot:nth-child(2) i { filter: hue-rotate(48deg) saturate(1.4) brightness(1.15); }
body.ck-ui2 #ck-quick .ck-slot i.shield { background-image: ${u('ic_escudo')} !important; }
body.ck-ui2 #ck-quick .ck-slot b { left: 50% !important; top: auto !important; bottom: -${18 * K}px !important; transform: translateX(-50%); width: ${17 * K}px; height: ${10 * K}px; line-height: ${10 * K}px; text-align: center;
  background: ${u('etiqueta_tecla')} 0 0 / 100% 100%; image-rendering: pixelated; font-family: var(--ck2-f); font-weight: 700; font-size: 14px !important; color: var(--ck2-crema) !important; }
body.ck-ui2 #ck-quick .ck-slot span { right: 2px !important; bottom: -2px !important; font-family: var(--ck2-f); font-weight: 700; font-size: 17px !important; text-shadow: 0 2px 0 #000, 0 0 3px #000 !important; }

/* minimapa arriba a la izquierda, con marco de piedra */
body.ck-ui2 #ck-minimapa { left: 10px !important; top: 10px !important; right: auto !important; bottom: auto !important;
  border-style: solid !important; border-color: transparent !important; border-width: ${6 * K}px !important; border-image: ${u('marco_minimapa')} 6 / ${6 * K}px stretch !important;
  background: #0b0a0e !important; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5) !important; border-radius: 0 !important; image-rendering: pixelated; padding: 0 !important; }
body.ck-ui2 #ck-minimapa .ckm-cab { font-family: var(--ck2-f) !important; font-weight: 700; font-size: 14px !important; color: var(--ck2-crema) !important; background: rgba(20, 14, 12, 0.85) !important; }
body.ck-ui2 #ck-minimapa .ckm-bot button { font-size: 13px !important; padding: 0 4px !important; min-width: 0; }

/* la misión, en un pergamino arriba a la derecha */
body.ck-ui2 #ck-objective { top: 64px !important; right: 10px !important; width: 250px !important; box-sizing: border-box; color: var(--ck2-tinta) !important; text-align: center;
  border-style: solid !important; border-color: transparent !important; border-width: ${14 * K}px ${10 * K}px ${13 * K}px !important;
  border-image: ${u('pergamino_mision')} 14 10 13 fill / ${14 * K}px ${10 * K}px ${13 * K}px stretch !important;
  background: none !important; box-shadow: none !important; padding: 0 6px !important; image-rendering: pixelated; filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.45)); }
body.ck-ui2 #ck-objective .ck-obj-head { font-family: var(--ck2-f); font-weight: 700; font-size: 17px !important; letter-spacing: 1px; color: #6b2414 !important; justify-content: center; }
body.ck-ui2 #ck-objective .ck-obj-head img { display: none; }
body.ck-ui2 #ck-objective .ck-obj-text { font-family: var(--ck2-f); font-weight: 600; font-size: 16px !important; line-height: 1.2 !important; color: var(--ck2-tinta) !important; }
body.ck-ui2 #ck-objective .ck-obj-text::before { content: ''; display: block; width: 70%; height: 2px; margin: 4px auto 6px; background: linear-gradient(90deg, transparent, #8a5a2c, transparent); }
body.ck-ui2 #ck-objective .ck-obj-purse { justify-content: center; border-top: 1px solid rgba(90, 58, 30, 0.4) !important; color: #5a3a24 !important; font-family: var(--ck2-f); font-size: 13px !important; }
body.ck-ui2 #ck-objective .ck-obj-purse span:first-child { display: none; }
body.ck-ui2 #ck-objective #ck-mision { color: #5a3a24 !important; font-family: var(--ck2-f); }

/* cartel "T · ..." y título de zona */
body.ck-ui2 #ck-prompt { bottom: 128px !important; padding: 0 6px 2px !important; font-size: 17px !important;
  border-style: solid !important; border-color: transparent !important; border-width: ${5 * K}px ${16 * K}px !important;
  border-image: ${u('boton_piedra')} 6 22 fill / ${5 * K}px ${16 * K}px stretch !important; background: none !important; box-shadow: none !important;
  font-family: var(--ck2-f) !important; font-weight: 700; color: var(--ck2-crema) !important; text-shadow: 0 2px 0 #1b1517 !important; image-rendering: pixelated; }
body.ck-ui2 .ck-zone-name { font-family: var(--ck2-f) !important; font-weight: 700 !important; letter-spacing: 1px !important;
  background: linear-gradient(180deg, #fff3cc 0%, #f4cb7c 40%, #c98a3a 75%, #8a5420 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  text-shadow: none !important; filter: drop-shadow(0 3px 0 #1b0f0a) drop-shadow(0 0 3px #1b0f0a) drop-shadow(0 0 18px rgba(0, 0, 0, 0.85)); }
body.ck-ui2 .ck-zone-sub { font-family: var(--ck2-f) !important; font-weight: 600; letter-spacing: 2px !important; }

/* ===== diálogo: columna gótica con retrato + pergamino con marco de madera + columna ===== */
body.ck-ui2 #ck-dialog { width: min(${(121 + 296 + 56) * K}px, 96%) !important; min-height: 0 !important; height: ${95 * K}px; padding: 0 !important; gap: 0 !important; bottom: 10px !important;
  background: none !important; border: 0 !important; box-shadow: none !important; filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5)); }
body.ck-ui2 #ck-dialog .ck-dlg-face, body.ck-ui2 #ck-dialog .ck-dlg-face.painted {
  flex: 0 0 ${121 * K}px !important; height: ${95 * K}px !important; display: block !important; align-self: stretch; position: relative;
  border: 0 !important; box-shadow: none !important; background: none !important; overflow: visible !important; }
body.ck-ui2 #ck-dialog .ck-dlg-face::before { content: ''; position: absolute; left: ${57 * K}px; top: ${19 * K}px; width: ${56 * K}px; height: ${59 * K}px; background: radial-gradient(circle at 50% 35%, #574048 0%, #22171c 80%); }
body.ck-ui2 #ck-dialog .ck-dlg-face::after { content: ''; position: absolute; inset: 0; background: ${u('dlg_izq')} 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
body.ck-ui2 #ck-dialog .ck-dlg-portrait { position: absolute; left: ${57 * K}px; top: ${19 * K}px; width: ${56 * K}px !important; height: ${59 * K}px !important; object-fit: cover; }
body.ck-ui2 #ck-dialog .ck-dlg-body { flex: 1 1 auto; position: relative; box-sizing: border-box; height: ${95 * K}px; padding: ${18 * K}px ${14 * K}px 0 ${9 * K}px;
  border-style: solid; border-color: transparent; border-width: 0; background: ${u('dlg_centro')} 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
body.ck-ui2 #ck-dialog::after { content: ''; flex: 0 0 ${56 * K}px; height: ${95 * K}px; background: ${u('dlg_der')} 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
body.ck-ui2 #ck-dialog .ck-dlg-name { display: block !important; margin: 0 0 2px !important; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important;
  font-family: var(--ck2-f) !important; font-weight: 700; font-size: 20px !important; letter-spacing: 0.5px; color: #7a2418 !important; }
body.ck-ui2 #ck-dialog .ck-dlg-text { font-family: var(--ck2-f) !important; font-weight: 600; font-size: 22px !important; line-height: 1.25 !important; color: var(--ck2-tinta) !important; min-height: 0 !important; }
body.ck-ui2 #ck-dialog .ck-dlg-next { right: ${78 * K}px !important; bottom: ${16 * K}px !important; font-family: var(--ck2-f) !important; font-weight: 700; font-size: 14px !important; color: #6b4a2c !important; }

/* ===== charla libre con aldeanos: el mismo cuadro del diálogo, y sus sugerencias son elecciones de piedra arriba ===== */
body.ck-ui2 #ck-chat { width: min(${(121 + 296 + 56) * K}px, 96%) !important; min-height: ${95 * K}px; box-sizing: border-box; bottom: 10px !important;
  padding: ${18 * K}px ${70 * K}px ${12 * K}px ${130 * K}px !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
  background:
    ${u('dlg_izq')} 0 0 / ${121 * K}px 100% no-repeat,
    ${u('dlg_der')} 100% 0 / ${56 * K}px 100% no-repeat,
    ${u('dlg_centro')} ${121 * K}px 0 / calc(100% - ${(121 + 56) * K}px) 100% no-repeat,
    radial-gradient(circle at 50% 35%, #574048 0%, #22171c 80%) ${57 * K}px ${19 * K}px / ${56 * K}px ${59 * K}px no-repeat !important;
  image-rendering: pixelated; filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5)); font-family: var(--ck2-f) !important; color: var(--ck2-tinta) !important; }
body.ck-ui2 #ck-chat .n { font-family: var(--ck2-f) !important; font-weight: 700; color: #7a2418 !important; font-size: 20px !important; margin: 0 0 2px !important; }
body.ck-ui2 #ck-chat .t { font-family: var(--ck2-f) !important; font-weight: 600; color: var(--ck2-tinta) !important; font-size: 20px !important; line-height: 1.25 !important; min-height: 50px !important; }
body.ck-ui2 #ck-chat .p { position: absolute; left: 0; right: 0; bottom: 100%; margin: 0 0 10px !important; justify-content: center; gap: 14px !important; }
body.ck-ui2 #ck-chat .p button { font-size: 18px !important; padding: 0 4px 2px !important; }
body.ck-ui2 #ck-chat input { font-family: var(--ck2-f) !important; font-size: 17px !important; padding: 3px 8px !important; margin-top: 4px; background: rgba(255, 244, 220, 0.55) !important; color: var(--ck2-tinta) !important; border: 2px solid #8a5a2c !important; border-radius: 0 !important; }
body.ck-ui2 #ck-chat .a { position: absolute; right: ${70 * K}px; top: ${18 * K}px; margin: 0 !important; font-family: var(--ck2-f) !important; font-size: 13px !important; color: #6b4a2c !important; }
`;
  const st = document.createElement('style');
  st.id = 'ck-ui2-css';
  st.textContent = css;
  document.head.appendChild(st);
  document.body.classList.add('ck-ui2');

  // ------------------------------------------------------------------ pantalla de inicio: logo y esquinas
  const ov = document.getElementById('start-menu-overlay');
  if (ov) {
    const logo = ov.querySelector('.sm-logo');
    if (logo && !logo.querySelector('.ck2-logo')) {
      const l = document.createElement('div');
      l.className = 'ck2-logo';
      l.innerHTML = '<img alt="CastleKnight" src="' + A.logo + '">';
      logo.insertBefore(l, logo.querySelector('.sm-logo-flash'));
      const ch = document.createElement('span');
      ch.className = 'ck2-chispas';
      let h = '';
      for (let i = 0; i < 40; i++) {
        const x0 = (Math.random() - 0.5) * 640, ang = Math.random() * Math.PI * 2, r = 90 + Math.random() * 200;
        h += '<i style="--x0:' + x0.toFixed(0) + 'px;--x:' + (x0 + Math.cos(ang) * r).toFixed(0) + 'px;--y:' + (Math.sin(ang) * r * 0.7 - 30).toFixed(0) + 'px;--t:' +
          (Math.random() < 0.35 ? 9 : 6) + 'px;--c:' + (Math.random() < 0.5 ? '#ffe7a3' : '#ffb347') + ';--dur:' + (1.2 + Math.random() * 1.0).toFixed(2) + 's;--d:' + (1.75 + Math.random() * 0.25).toFixed(2) + 's"></i>';
      }
      ch.innerHTML = h;
      logo.appendChild(ch);
    }
    ['si', 'sd', 'ii', 'id'].forEach(k => {
      const e = document.createElement('i');
      e.className = 'ck2-esq ' + k;
      ov.appendChild(e);
    });
    const medir = () => { const w = ov.clientWidth || 1280, h = ov.clientHeight || 720; ov.style.setProperty('--ck2-n', Math.min(h / 268, w / 480).toFixed(3)); };
    medir();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(medir).observe(ov);
    else window.addEventListener('resize', medir);
    const pr = document.getElementById('sm-press');
    if (pr) pr.textContent = 'Presioná cualquier tecla';
  }

  // ------------------------------------------------------------------ pausa: retrato en arco + atributos
  const pausa = document.getElementById('pause-modal');
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  if (pausa) {
    const card = pausa.querySelector('.modal-card');
    const acc = pausa.querySelector('.pause-actions');
    const sub = pausa.querySelector('.modal-subtitle');
    const tit = pausa.querySelector('.modal-title');
    if (tit) tit.textContent = 'Pausa';
    if (sub) sub.textContent = 'El reino espera tu próxima orden…';
    const caja = document.createElement('div');
    caja.className = 'ck2-pausa';
    caja.innerHTML =
      '<div class="ck2-arco"><span class="fondo"></span><img class="cara" alt=""><span class="marco"></span><span class="nombre"></span></div>' +
      '<div class="ck2-atrs">' +
      [['vitalidad', 'VIDA', 'vida'], ['fuerza', 'NIVEL', 'nivel'], ['agilidad', 'EXPERIENCIA', 'exp'], ['inteligencia', 'MONEDAS', 'monedas']]
        .map(([ic, t, k]) => '<div class="ck2-atr"><i style="background-image:' + u('atr_' + ic).replace(/"/g, "'") + '"></i><div class="t"><b>' + t + '</b><span data-k="' + k + '">–</span></div></div>')
        .join('') +
      '</div>';
    if (card && acc) card.insertBefore(caja, acc);
    const pintarPausa = () => {
      const S = escena();
      if (!S) return;
      const st = S.story || {};
      const img = document.getElementById('hud-portrait-img');
      caja.querySelector('img.cara').src = img ? img.src : '';
      const nom = document.getElementById('hud-hero-name');
      caja.querySelector('.nombre').textContent = nom ? nom.textContent.charAt(0) + nom.textContent.slice(1).toLowerCase() : '';
      const nv = document.querySelector('.hud-hero-level');
      const val = {
        vida: (S.health ?? '–') + ' / ' + (S.maxHealth ?? '–'),
        nivel: nv ? nv.textContent.replace(/[^0-9]/g, '') || '1' : '1',
        exp: st.xp !== undefined ? String(st.xp) : (document.querySelector('.ck-obj-purse') || { textContent: '' }).textContent.match(/EXP\s*([0-9/]+)/)?.[1] || '–',
        monedas: String(st.coins ?? 0)
      };
      caja.querySelectorAll('[data-k]').forEach(s => (s.textContent = val[s.dataset.k]));
    };
    new MutationObserver(() => { if (pausa.classList.contains('active')) pintarPausa(); }).observe(pausa, { attributes: true, attributeFilter: ['class'] });
  }

  // ------------------------------------------------------------------ HUD: orbes, nombre y monedas
  const wrap = document.getElementById('game-wrapper') || document.body;
  const hud = document.createElement('div');
  hud.className = 'ck2-hud';
  hud.innerHTML =
    '<div class="ck2-orbe vida"><span class="vacio"></span><span class="lleno"></span><span class="marco"></span><span class="num"></span></div>' +
    '<div class="ck2-nombre"></div>' +
    '<div class="ck2-monedas"><span>0</span></div>' +
    '<div class="ck2-orbe mana"><span class="vacio"></span><span class="lleno"></span><span class="marco"></span><span class="num"></span></div>';
  wrap.appendChild(hud);
  const oV = hud.querySelector('.vida'), oM = hud.querySelector('.mana');
  const ancho = id => { const e = document.getElementById(id); const w = e && parseFloat(e.style.width); return isFinite(w) ? Math.max(0, Math.min(100, w)) : 100; };
  let ult = '';
  const cuadro = () => {
    const S = escena();
    const igh = document.querySelector('.in-game-hud');
    const jugando = !!(S && igh && !igh.classList.contains('hidden') && S.gameStarted !== false && S.player);
    hud.classList.toggle('on', jugando);
    const dlg = document.getElementById('ck-dialog');
    const chat = document.getElementById('ck-chat');
    const enDialogo = !!((dlg && dlg.classList.contains('on')) || (chat && chat.classList.contains('on')));
    document.body.classList.toggle('ck2-dlg', enDialogo);
    hud.classList.toggle('dialogo', enDialogo);
    if (jugando) {
      const pct = (a, b, id) => (isFinite(a) && b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : ancho(id));
      const v = pct(S.health, S.maxHealth, 'hud-hp-fill'), m = pct(S.stamina, S.maxStamina, 'hud-mana-fill');
      const nom = document.getElementById('hud-hero-name'), nv = document.querySelector('.hud-hero-level');
      const clave = [v, m, S.health, S.maxHealth, S.story && S.story.coins, nom && nom.textContent, nv && nv.textContent].join('|');
      if (clave !== ult) {
        ult = clave;
        oV.style.setProperty('--vacio', 100 - v + '%');
        oM.style.setProperty('--vacio', 100 - m + '%');
        oV.querySelector('.num').textContent = S.health !== undefined ? S.health + '/' + S.maxHealth : '';
        oM.querySelector('.num').textContent = Math.round(m) + '%';
        oV.classList.toggle('bajo', v <= 34);
        hud.querySelector('.ck2-monedas span').textContent = (S.story && S.story.coins) || 0;
        const n = nom ? nom.textContent : '';
        hud.querySelector('.ck2-nombre').innerHTML = n.charAt(0) + n.slice(1).toLowerCase() + (nv ? '<small>' + nv.textContent + '</small>' : '');
      }
    }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);

  // ------------------------------------------------------------------ textos flotantes con la letra nueva
  if (typeof MainGameScene !== 'undefined') {
    const P = MainGameScene.prototype;
    P.createFloatingText = function (x, y, message, color = 0xffffff) {
      const txt = this.add.text(x, y, message, {
        fontFamily: "'CK Grenze', Pixuf, MedievalSharp, serif", fontSize: '24px', fontStyle: 'bold',
        fill: '#' + color.toString(16).padStart(6, '0'), stroke: '#1b0f0a', strokeThickness: 5
      }).setOrigin(0.5).setDepth(30000);
      this.tweens.add({ targets: txt, y: y - 32, alpha: 0, duration: 650, ease: 'Power1', onComplete: () => txt.destroy() });
    };
  }
  window.CK_UI2 = { hud, escena };
})();
