'use strict';
/* Pausa más pareja (02/11): el retrato del arco usa el retrato pintado del libro de héroes (el mismo tamaño para los tres,
   llenando el arco), EXPERIENCIA lleva el libro y MONEDAS un ícono de monedas en el mismo marco, y el quinto botón
   (Salir) queda centrado y del mismo ancho que los demás. Va después de ck_ui_castillo.js. Borrar su línea lo deshace. */
(function () {
  const pausa = document.getElementById('pause-modal');
  if (!pausa || !window.CK_UI2_ARTE) return;
  const RETRATO = { soldier: 'assets/UI/portraits/knight.png', wizard: 'assets/UI/portraits/wizard.png', swordsman: 'assets/UI/portraits/swordsman.png' };
  const MONEDAS = 'data:image/png;base64,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';
  const st = document.createElement('style');
  st.id = 'ck-pausa2-css';
  st.textContent = `
body.ck-ui2 .ck2-arco img.cara { left: 18% !important; width: 64% !important; top: 13%; bottom: auto !important; height: 77%; object-fit: cover; object-position: 50% 22%;
  border-radius: 40% 40% 0 0 / 22% 22% 0 0; image-rendering: pixelated; }
body.ck-ui2 .ck2-arco img.cara.chica { object-fit: contain; object-position: 50% 100%; }
body.ck-ui2 #pause-modal .pause-actions button { height: 50px !important; display: flex !important; align-items: center; justify-content: center; }
body.ck-ui2 #pause-modal .pause-actions button:last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc(50% - 7px) !important; }`;
  document.head.appendChild(st);
  const caja = pausa.querySelector('.ck2-pausa');
  if (caja) {
    const ic = k => caja.querySelector('[data-k="' + k + '"]')?.closest('.ck2-atr')?.querySelector('i');
    const iExp = ic('exp'), iMon = ic('monedas');
    if (iExp) iExp.style.backgroundImage = 'url("' + window.CK_UI2_ARTE.atr_inteligencia + '")';
    if (iMon) iMon.style.backgroundImage = 'url("' + MONEDAS + '")';
  }
  const poner = () => {
    const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
    const img = pausa.querySelector('.ck2-arco img.cara');
    if (!S || !img) return;
    const src = RETRATO[S.playerHero];
    if (src) { img.src = src; img.classList.remove('chica'); } else img.classList.add('chica');
  };
  // después de que ck_ui_castillo pinta la pausa (el mismo observador, un instante más tarde)
  new MutationObserver(() => { if (pausa.classList.contains('active')) setTimeout(poner, 0); }).observe(pausa, { attributes: true, attributeFilter: ['class'] });
})();
