'use strict';
/* Sin carteles grandes al pasar (24/10, pedido del dueño): los saludos de los aldeanos, lo que dicen la gente del castillo,
   el cura, el rey y los aldeanos que se asustan ya no aparecen en letras grandes sobre sus cabezas.
   Los avisos útiles (▲ Entrar, ◀ Sendero…, salidas, puertas cerradas, comentarios de objetos) siguen, pero chicos, en una
   línea abajo de la pantalla, encima del cartel "T · …", y se van solos.
   Siguen en grande lo que importa en el momento: daño, vida, nivel, experiencia, monedas, objetivos.
   Borrar la línea de index.html vuelve a como estaba. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  window.CK_SIN_CARTELES = true;                       // ck_vida.js lo mira para no hacer hablar a los aldeanos
  const SIEMPRE = /^[-+]\d|VIDA|BLOQUE|NIVEL|exp\b|monedas|LLAVE|CÓDICE|OBJETIVO|CORAZÓN|PARADA|CARGA/;

  // la línea chica de abajo
  let caja = null, timer = null;
  const nota = txt => {
    if (!document.getElementById('ck-nota-css')) {
      const st = document.createElement('style'); st.id = 'ck-nota-css';
      // medido desde abajo del cuadro del juego (no de la ventana): justo arriba del cartel "T · …" y de la barra rápida
      st.textContent = `#ck-nota{position:absolute;left:50%;bottom:188px;transform:translateX(-50%);z-index:9000;pointer-events:none;
        max-width:min(520px,calc(100vw - 32px));padding:3px 12px;border-radius:5px;background:rgba(24,18,14,.72);color:#f3e6c8;
        font:600 14px 'CK Grenze',Grenze,Georgia,serif;letter-spacing:.2px;text-align:center;text-shadow:0 1px 0 #000;
        opacity:0;transition:opacity .25s}#ck-nota.on{opacity:1}`;
      document.head.append(st);
    }
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-nota'; }
    const donde = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    if (caja.parentElement !== donde) donde.append(caja);
    caja.textContent = String(txt).replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, '');
    caja.classList.add('on');
    clearTimeout(timer); timer = setTimeout(() => caja.classList.remove('on'), 2600);
  };

  // se instala cuando ya cargó todo: la UI nueva (ck_ui_castillo.js, más abajo en index.html) reemplaza createFloatingText
  const instalar = () => {
  const f0 = P.createFloatingText;
  P.createFloatingText = function (x, y, msg) {
    const modo = this._ckCartel;
    if (modo && !SIEMPRE.test(String(msg))) {
      if (modo === 'nota') nota(msg);
      return null;
    }
    return f0.apply(this, arguments);
  };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar); else instalar();
  // mientras corren estas funciones, los textos que pidan van a la línea chica ('nota') o no salen ('nada')
  const envolver = (nombre, modo) => {
    const o = P[nombre];
    if (typeof o !== 'function') return;
    P[nombre] = function () {
      const antes = this._ckCartel; this._ckCartel = modo;
      try { return o.apply(this, arguments); } finally { this._ckCartel = antes; }
    };
  };
  envolver('checkDoorProximity', 'nota');
  envolver('updateInterior', 'nota');
  envolver('updateNPCs', 'nada');
  envolver('updateCastleActor', 'nada');
  envolver('updateActorDanger', 'nada');
  envolver('updatePriest', 'nada');
  envolver('npcTakeHit', 'nada');
  window.CK_SIN_CARTELES_API = { nota };
})();
