'use strict';
/* Arranque limpio de la partida (11/11, pedido del dueño: "cuando empecemos la partida no veamos al personaje parado en
   medio de la aldea, hay unos frames que se ve así" y "que el UI no cargue hasta que entremos a jugar, a veces carga
   antes en una pantalla negra").
   Al empezar o continuar una partida baja un telón negro ANTES de que se arme la aldea y se queda hasta que el juego está
   donde tiene que estar:
   - partida nueva: hasta que terminan los pergaminos de la introducción y el héroe ya está en la taberna (antes se veía
     la aldea con el héroe en el medio al empezar y otra vez al cerrar los pergaminos);
   - partida que continúa: hasta que el héroe llegó al lugar donde había quedado (antes se veía medio segundo la aldea).
   Mientras el telón está puesto la interfaz no se ve (ck_cine_ui.js la esconde con cualquier pantalla negra).
   Seguro: nunca dura más de 8 s sin pergaminos a la vista. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof document === 'undefined') return;
  const P = MainGameScene.prototype;
  const st = document.createElement('style'); st.id = 'ck-telon-css';
  st.textContent = '#ck-telon { position: fixed; inset: 0; background: #000; z-index: 99980; opacity: 1; pointer-events: all; transition: opacity .45s ease; }\n#ck-telon.fuera { opacity: 0; pointer-events: none; }';
  document.head.append(st);
  let el = null, vigia = 0;
  const host = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const poner = () => {
    if (!el) { el = document.createElement('div'); el.id = 'ck-telon'; }
    const h = host(); if (el.parentNode !== h) h.appendChild(el);
    el.style.transition = 'none'; el.classList.remove('fuera'); void el.offsetWidth; el.style.transition = '';
    document.body.classList.add('ck-telon-on');
  };
  const sacar = () => {
    clearInterval(vigia); vigia = 0;
    document.body.classList.remove('ck-telon-on');
    if (el) el.classList.add('fuera');
  };
  const ini0 = P.startCampaign;
  P.startCampaign = function () {
    const S = this, lugar = S._ckIrA, destino = lugar && lugar.zona && lugar.zona !== 'village' ? lugar.zona : null;
    try { poner(); } catch (e) {}
    const r = ini0.apply(this, arguments);
    const t0 = performance.now(); let sinIntro = 0, quieto = 0;
    clearInterval(vigia);
    vigia = setInterval(() => {
      try {
        const now = performance.now(), intro = document.getElementById('ck-intro');
        if (intro) { sinIntro = 0; quieto = 0; return; }          // los pergaminos tapan todo: el telón espera detrás
        if (!sinIntro) sinIntro = now;
        const s = S.story, nueva = !!(s && s.step === 0 && !(s.flags && s.flags.intro) && window.CK_INTRO && !(s.xp > 0) && !destino);
        const zona = S.currentZoneKey ? S.currentZoneKey() : '';
        let listo = now - t0 > 500 && !S._doorTransition && !S._ckCargando;
        if (listo && nueva) listo = !!S.currentInterior;            // ya está en la taberna (el festejo o el despertar)
        if (listo && destino) listo = zona === destino || !!S.currentInterior;
        quieto = listo ? quieto + 1 : 0;
        if (quieto >= 3 || now - sinIntro > 8000) sacar();
      } catch (e) { sacar(); }
    }, 80);
    return r;
  };
  window.CK_ARRANQUE = { poner, sacar };
})();
