'use strict';
/* Cinemáticas sin interfaz (11/11, pedido del dueño: "en las cinemáticas del juego que se esconda el UI y que solo se vean
   los diálogos de los personajes entre sí").
   Mientras dura cualquier escena (las de CK_ESCENA.correr, la intro, el coliseo, las presentaciones y todo lo que marca
   la escena con _ckEscena o _cutscene) se esconden: el retrato con las barras y las habilidades, el minimapa, el
   objetivo, las ayudas de teclas, el cartel de modo de juego y los botones de menú y salir. Quedan el cuadro de diálogo,
   los globos de los personajes y las franjas negras. Al terminar, todo vuelve con un fundido.
   v2 (11/11, "que el UI no cargue hasta que entremos a jugar, a veces carga antes en una pantalla negra"): también se
   esconde con cualquier pantalla negra: el telón del arranque (ck_arranque.js), la pantalla de carga, y mientras la
   cámara está fundida a negro (al pasar una puerta, mientras se arma el mapa).
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof document === 'undefined') return;
  const OCULTAR = ['#ckh', '#ck-objective', '#ck-minimapa', '#ck-ayuda', '#ck-prompt', '#ck-nota', '#hud-lobby-badge',
    '#btn-hud-menu-btn', '#btn-hud-exit-btn', '.ck2-hud', '.in-game-hud', '.ckpad-badge'];
  const st = document.createElement('style'); st.id = 'ck-cine-ui-css';
  st.textContent = OCULTAR.map(s => `body.ck-cine ${s}, body.ck-escena ${s}`).join(',\n') +
    ' { opacity: 0 !important; pointer-events: none !important; transition: opacity .3s !important; }';
  document.head.append(st);
  const enEscena = S => !!(S && (S._ckEscena || S._cutscene));
  const negro = S => {
    if (document.body.classList.contains('ck-telon-on') || document.querySelector('#ck-carga.on')) return true;
    if (!S || !S._gameMode) return false;
    if (S._ckCargando) return true;
    const f = S.cameras && S.cameras.main && S.cameras.main.fadeEffect;
    return !!(f && f.alpha > 0.55 && (f.isRunning || f.isComplete));
  };
  setInterval(() => {
    try {
      const S = window.game && game.scene && game.scene.getScene && game.scene.getScene('MainGameScene');
      const on = (enEscena(S) || negro(S)) && S && S.sys && S.sys.isActive();
      if (document.body) document.body.classList.toggle('ck-cine', !!on);
    } catch (e) {}
  }, 80);
  window.CK_CINE_UI = { OCULTAR };
})();
