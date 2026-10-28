'use strict';
/* Portada y libro de héroes (24/10, pedidos del dueño).
   Portada: el título ya no es la imagen recortada del logo: se escribe con letra gótica (Pirata One, la misma familia del
   resto de los títulos; licencia OFL, assets/font/PirataOne-Regular.ttf) en oro viejo con contorno oscuro, como el logo.
   - animación: cada letra cae en su lugar con un destello, golpe de forja (flash + chispas), un brillo que cruza las letras
     cada tanto, el título flota y respira; abajo aparece "Capítulo 1 · La niebla del norte";
   - "Presioná cualquier botón" más al centro de la pantalla (antes pegado abajo), grande y titilando;
   - recién con una tecla, un clic o un botón del joystick aparece el menú; joystick también en el menú (cruceta/palanca, A);
   - al abrir suena la espada (ck_inicio).
   Libro de héroes: el fondo se oscurece bastante más (y se esconde el título de la portada que quedaba detrás) y
   "Seleccioná tu héroe" va en la misma letra gótica, crema dorada con contorno, bien legible; el subtítulo sin el doble.
   Borrar la línea de index.html deja todo como antes. */
(function () {
  const ov = document.getElementById('start-menu-overlay');
  if (!ov) return;
  const N = n => `calc(var(--ck2-n, 2.7) * ${n}px)`;
  const pr = document.getElementById('sm-press');
  if (pr) pr.textContent = 'Presioná cualquier botón';
  const TITULO = 'Castleknight';
  const ORO = 'linear-gradient(180deg, #fffaf0 0%, #fbe4ae 18%, #efc073 38%, #d18f45 56%, #a7612a 74%, #6f3a16 90%, #4a2410 100%)';

  const st = document.createElement('style');
  st.textContent = `
/* ---------- título escrito ---------- */
body.ck-ui2 #start-menu-overlay .ck2-logo { display: none !important; }
body.ck-ui2 #start-menu-overlay .ck-tit { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; pointer-events: none;
  filter: drop-shadow(0 ${N(2.2)} 0 #1b0d05) drop-shadow(0 0 ${N(7)} rgba(255, 168, 70, 0.32)); }
body.ck-ui2 #start-menu-overlay .ck-tit .pal { position: relative; display: block; white-space: nowrap; line-height: 1;
  font-family: 'Pirata One', 'MedievalSharp', serif; font-weight: 400; font-size: ${N(62)}; letter-spacing: ${N(0.6)}; }
body.ck-ui2 #start-menu-overlay .ck-tit .l { display: inline-block; background: ${ORO}; -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent; -webkit-text-stroke: ${N(0.85)} #2a1406; paint-order: stroke fill;
  opacity: 0; transform-origin: 50% 80%; animation: ckTitLetra 0.62s cubic-bezier(0.2, 0.9, 0.25, 1.25) calc(0.35s + var(--i) * 0.075s) both; }
@keyframes ckTitLetra { 0% { opacity: 0; transform: translateY(-70%) scale(1.7) rotate(-6deg); filter: blur(${N(2)}) brightness(2.6); }
  55% { opacity: 1; transform: translateY(5%) scale(0.95); filter: blur(0) brightness(1.7); } 100% { opacity: 1; transform: none; filter: brightness(1); } }
/* brillo que cruza las letras (capa encima, recortada a las letras) */
body.ck-ui2 #start-menu-overlay .ck-tit .brillo { position: absolute; inset: 0; white-space: nowrap; color: transparent; -webkit-text-fill-color: transparent;
  background: linear-gradient(105deg, transparent 38%, rgba(255, 252, 235, 0.95) 48%, rgba(255, 236, 190, 0.6) 52%, transparent 62%) no-repeat;
  background-size: 260% 100%; background-position: 200% 0; -webkit-background-clip: text; background-clip: text; mix-blend-mode: screen;
  animation: ckTitBrillo 6.5s ease-in-out 2.3s infinite; }
@keyframes ckTitBrillo { 0% { background-position: 200% 0; } 22%, 100% { background-position: -100% 0; } }
/* golpe de forja: todo el título se enciende un instante */
body.ck-ui2 #start-menu-overlay .ck-tit .pal { animation: ckTitGolpe 0.9s ease-out 1.45s both; }
@keyframes ckTitGolpe { 0% { filter: brightness(1); } 12% { filter: brightness(2.1) drop-shadow(0 0 ${N(10)} #ffd27a); } 100% { filter: brightness(1); } }
body.ck-ui2 #start-menu-overlay .ck-tit .sub { margin-top: ${N(3)}; font-family: var(--ck2-f, Grenze, serif); font-weight: 600; font-size: ${N(7)}; letter-spacing: ${N(1.2)};
  color: #f1dcae; -webkit-text-fill-color: #f1dcae; text-shadow: 0 ${N(0.8)} 0 #1b0d05, 0 0 ${N(5)} rgba(0, 0, 0, 0.9); opacity: 0;
  animation: ckTitSub 1s ease-out 2.1s both; }
@keyframes ckTitSub { from { opacity: 0; transform: translateY(${N(-3)}); letter-spacing: ${N(4)}; } to { opacity: 0.95; transform: none; letter-spacing: ${N(1.2)}; } }
body.ck-ui2 #start-menu-overlay.ck-port-flota .ck-tit .pal { animation: ckTitFlota 5s ease-in-out infinite, ckTitRespira 5s ease-in-out infinite; }
@keyframes ckTitFlota { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(${N(-1.6)}); } }
@keyframes ckTitRespira { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.12); } }
body.ck-ui2 #start-menu-overlay.sm-open .ck-tit .sub { display: none; }

/* ---------- "Presioná cualquier botón": más al centro ---------- */
body.ck-ui2 #start-menu-overlay .sm-press { top: 60% !important; bottom: auto !important; font-size: ${N(15)} !important;
  letter-spacing: 1px !important; color: #ffe2a6 !important;
  text-shadow: 0 2px 0 #120a06, 0 0 6px rgba(255, 190, 90, 0.9), 0 0 22px rgba(255, 150, 60, 0.6) !important; }
body.ck-ui2 #start-menu-overlay .sm-press::before, body.ck-ui2 #start-menu-overlay .sm-press::after { content: '◆'; display: inline-block; margin: 0 0.6em;
  font-size: 0.55em; vertical-align: 0.25em; color: #d9a441; animation: ckPortRombo 2.2s ease-in-out infinite; }
@keyframes ckPortRombo { 0%, 100% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
body.ck-ui2 #start-menu-overlay.sm-open .sm-press { display: none !important; }

/* ---------- libro de héroes ---------- */
body.ck-ui2 #hero-selection-modal.modal-overlay { background: radial-gradient(ellipse at 50% 45%, rgba(10, 7, 12, 0.86) 0%, rgba(3, 2, 5, 0.96) 75%) !important;
  -webkit-backdrop-filter: blur(3px) brightness(0.6); backdrop-filter: blur(3px) brightness(0.6); }
body.ck-ui2:has(#hero-selection-modal.active) #start-menu-overlay .sm-logo, body.ck-ui2:has(#hero-selection-modal.active) #start-menu-overlay .ck-tit { opacity: 0 !important; transition: opacity 0.3s; }
body.ck-ui2 #hero-selection-modal .hero-modal-header { text-shadow: none !important; }
body.ck-ui2 #hero-selection-modal .hero-modal-title { font-family: 'Pirata One', 'MedievalSharp', serif !important; font-weight: 400 !important;
  font-size: clamp(36px, 6.4vh, 60px) !important; letter-spacing: 2px !important; text-transform: none !important; line-height: 1.05 !important;
  background: none !important; color: #fbe6b0 !important; -webkit-text-fill-color: #fbe6b0 !important; -webkit-text-stroke: 1.2px #3a1c08; paint-order: stroke fill;
  text-shadow: 0 3px 0 #2a1406, 0 0 3px #1b0d05, 0 0 22px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 170, 70, 0.25) !important; filter: none !important; }
body.ck-ui2 #hero-selection-modal #hero-modal-subtitle { color: #ead9b4 !important; -webkit-text-fill-color: #ead9b4 !important; font-size: 17px !important;
  font-weight: 600 !important; letter-spacing: 0.5px !important; text-shadow: 0 2px 0 #000, 0 0 10px rgba(0, 0, 0, 0.95) !important; background: none !important; }
/* ---------- libro de héroes: tarjetas parejas, centradas y adentro de la página ---------- */
#hero-selection-modal .hero-selection-modal-box { --hero-pic: clamp(140px, 28vh, 280px) !important; width: min(96%, max(calc(var(--hero-pic) * 2 + 190px), 664px)) !important; }
#hero-selection-modal .hero-selection-grid { padding: 22px 34px 34px !important; gap: 40px !important; align-items: stretch !important; }
#hero-selection-modal .hero-select-card { box-sizing: border-box !important; display: flex !important; flex-direction: column !important; align-items: center !important;
  justify-content: flex-start !important; padding: 14px 14px 14px !important; min-width: 268px !important; }
#hero-selection-modal .hero-selection-grid[data-page="1"] .hero-select-card.book-p2, #hero-selection-modal .hero-selection-grid[data-page="2"] .hero-select-card.book-p1 { display: none !important; }
/* elegido: brilla, pero ya no se agranda (se salía del libro y quedaba cortado) */
#hero-selection-modal .hero-select-card.active, #hero-selection-modal .hero-select-card:hover, #hero-selection-modal .hero-select-card:focus-visible { transform: none !important; }
#hero-selection-modal #hero-card-soldier.active { box-shadow: 0 0 0 2px #1b1f24, 0 0 0 4px #f4f6f8, 0 0 18px rgba(230, 60, 40, 0.6), inset 0 0 0 2px #2a3037, inset 0 0 0 4px #c3ccd4, inset 0 0 26px rgba(0, 0, 0, 0.6) !important; }
#hero-selection-modal #hero-card-wizard.active { box-shadow: 0 0 0 2px #17122f, 0 0 0 4px #ffe08a, 0 0 18px rgba(140, 120, 255, 0.7), inset 0 0 0 2px #17122f, inset 0 0 0 3px #8c6a2a, inset 0 0 28px rgba(0, 0, 0, 0.6) !important; }
#hero-selection-modal #hero-card-swordsman.active { box-shadow: 0 0 0 2px #26060f, 0 0 0 4px #ffd5da, 0 0 18px rgba(255, 70, 110, 0.7), inset 0 0 0 2px #26060f, inset 0 0 0 3px #b8616f, inset 0 0 28px rgba(0, 0, 0, 0.6) !important; }
#hero-selection-modal .hero-card-frame-wrapper { box-sizing: border-box !important; flex: 0 0 auto; margin: 0 auto 8px !important; }
#hero-selection-modal .hero-card-info { display: flex !important; flex-direction: column !important; align-items: center !important; flex: 1 1 auto; width: 100% !important; }
/* el nombre ocupa siempre el mismo alto: así las filas de abajo quedan a la misma altura en las dos páginas */
#hero-selection-modal .hero-card-name { height: clamp(46px, 8.2vh, 66px) !important; display: flex !important; align-items: center !important; justify-content: center !important;
  margin: 0 auto !important; box-sizing: border-box; white-space: nowrap; flex-direction: column; }
#hero-selection-modal #hero-card-wizard .hero-card-name { height: auto !important; min-height: clamp(42px, 7.4vh, 60px); margin: 2px auto 4px !important; padding: 0 30px 2px !important; flex-direction: row; }
#hero-selection-modal .hero-card-info > .hero-card-name::after { margin: 2px auto 0 !important; }
#hero-selection-modal .hero-card-class { width: 100%; text-align: center !important; margin: 4px 0 8px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* datos: una tabla prolija de dos columnas, pegada abajo de la tarjeta */
#hero-selection-modal .hero-card-stats { box-sizing: border-box !important; width: 100% !important; margin: auto 0 0 !important; padding: 4px 10px !important;
  display: flex !important; flex-direction: column !important; gap: 0 !important; border-width: 2px !important; border-style: solid !important; }
#hero-selection-modal .hero-stat-row { display: grid !important; grid-template-columns: auto 1fr !important; align-items: center !important; column-gap: 10px !important;
  min-height: 24px; padding: 2px 0 !important; margin: 0 !important; border-bottom: 1px solid rgba(255, 240, 210, 0.12) !important; }
#hero-selection-modal .hero-stat-row:last-child { border-bottom: 0 !important; }
#hero-selection-modal .hero-stat-row .stat-label { display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap; font-weight: 600 !important; }
#hero-selection-modal .hero-stat-row .stat-label .px-ico { width: 14px !important; height: 14px !important; margin: 0 !important; flex: 0 0 auto; }
#hero-selection-modal .hero-stat-row .stat-val { text-align: right !important; justify-self: end; line-height: 1.15 !important; white-space: nowrap; }
#hero-selection-modal .hero-stat-row, #hero-selection-modal .hero-stat-row * { font-size: 12px !important; }
/* pasar página: afuera del libro, a media altura (antes tapaba la esquina de la tarjeta y quedaba cortado) */
#hero-selection-modal .book-turn-btn { top: 50% !important; bottom: auto !important; margin-top: -23px; display: flex; align-items: center; justify-content: center; }
#hero-selection-modal .book-turn-next { right: -64px !important; }
#hero-selection-modal .book-turn-prev { left: -64px !important; }
#hero-selection-modal .hero-selection-grid[data-page="1"] .book-turn-prev, #hero-selection-modal .hero-selection-grid[data-page="2"] .book-turn-next { display: none !important; }
#hero-selection-modal .book-turn-btn:hover { transform: scale(1.08) !important; }
/* número de página: en el margen de abajo, centrado en la página derecha (antes quedaba debajo de la tarjeta) */
#hero-selection-modal .book-page-num { bottom: 9px !important; right: 25% !important; transform: translateX(50%); font-size: 20px !important; line-height: 22px; height: 22px; }
#hero-selection-modal .hero-modal-actions { margin-top: 24px !important; }
@media (max-height: 700px) { #hero-selection-modal .hero-selection-modal-box { --hero-pic: clamp(120px, 23vh, 280px) !important; }
  #hero-selection-modal .hero-modal-actions { margin-top: 12px !important; } }
@media (prefers-reduced-motion: reduce) { body.ck-ui2 #start-menu-overlay .ck-tit .l, body.ck-ui2 #start-menu-overlay .ck-tit .pal,
  body.ck-ui2 #start-menu-overlay .ck-tit .brillo { animation: none !important; opacity: 1 !important; } }`;
  document.head.append(st);

  // el título: una letra por <span> (para que caigan de a una) y la capa del brillo encima
  const logo = ov.querySelector('.sm-logo');
  if (logo && !logo.querySelector('.ck-tit')) {
    const t = document.createElement('div');
    t.className = 'ck-tit';
    t.setAttribute('aria-label', TITULO);
    t.innerHTML = '<span class="pal">' + [...TITULO].map((c, i) => `<span class="l" style="--i:${i}">${c}</span>`).join('') +
      `<span class="brillo" aria-hidden="true">${TITULO}</span></span><span class="sub">✦ Capítulo 1 — La niebla del norte ✦</span>`;
    logo.insertBefore(t, logo.querySelector('.sm-logo-flash') || logo.firstChild);
    // la letra gótica tiene que estar cargada antes de que caigan las letras (si tarda, arrancan igual)
    if (document.fonts && document.fonts.load) {
      t.style.visibility = 'hidden';
      const ya = () => { t.style.visibility = ''; };
      Promise.race([document.fonts.load('62px "Pirata One"'), new Promise(r => setTimeout(r, 900))]).then(ya, ya);
    }
  }
  // el libro pone "SELECCIONA TU HÉROE" cada vez que se abre: en letra gótica, todo en mayúsculas no se lee
  const tit = document.getElementById('hero-modal-title');
  const lindo = () => { if (tit && /^SELECCIONA TU HÉROE$/i.test(tit.textContent.trim()) && tit.textContent !== 'Seleccioná tu héroe') tit.textContent = 'Seleccioná tu héroe'; };
  if (tit) { lindo(); new MutationObserver(lindo).observe(tit, { childList: true, characterData: true, subtree: true }); }

  const abierto = () => ov.classList.contains('sm-open');
  const visible = () => !ov.classList.contains('hidden') && ov.style.display !== 'none' && !document.querySelector('.modal-overlay.active');
  setTimeout(() => { if (!abierto()) ov.classList.add('sm-wait'); }, 2500);
  setTimeout(() => ov.classList.add('ck-port-flota'), 3200);

  // sonido al abrir el menú (la primera vez)
  let sono = false;
  const golpe = () => {
    if (sono || typeof sfx === 'undefined') return;
    sono = true;
    try { sfx.fx('ck_inicio', 0.8) || sfx.fx('ui_click', 0.8); } catch (e) {}
  };
  const mira = new MutationObserver(() => { if (abierto()) golpe(); });
  mira.observe(ov, { attributes: true, attributeFilter: ['class'] });

  // joystick: lo traduce a las teclas que ya entiende el menú (game.js)
  const tecla = key => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  const prev = {};
  let espera = 0;
  const paso = t => {
    requestAnimationFrame(paso);
    if (!visible() || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const g of pads) {
      if (!g) continue;
      const p = prev[g.index] || (prev[g.index] = []);
      const btn = i => !!(g.buttons[i] && g.buttons[i].pressed);
      const nuevo = i => btn(i) && !p[i];
      if (!abierto()) {
        if (g.buttons.some((b, i) => b.pressed && !p[i])) tecla(' ');
      } else if (t > espera) {
        const y = g.axes[1] || 0;
        if (nuevo(12) || y < -0.6) { tecla('ArrowUp'); espera = t + 220; }
        else if (nuevo(13) || y > 0.6) { tecla('ArrowDown'); espera = t + 220; }
        else if (nuevo(0) || nuevo(9)) { tecla('Enter'); espera = t + 300; }
      }
      g.buttons.forEach((b, i) => (p[i] = b.pressed));
    }
  };
  requestAnimationFrame(paso);
  window.CK_PORTADA = { tecla };
})();
