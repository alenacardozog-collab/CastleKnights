'use strict';
/* Camas: pagar, dormir, guardar y esperar hasta una hora (11/11, pedido del dueño: "hacé que las camas, si uno paga, pueda
   dormir y guardar partida y también esperar hasta cierta hora… la hora está en números romanos y la representa el
   reloj solar").
   - Las camas de huéspedes de la Taberna del Roble (los tres cuartos de la derecha) se usan con T: cuestan 8 monedas.
     La cama del Rey (Aposentos) sigue gratis, con el mismo cuadro.
   - Al usarla se abre el RELOJ DE SOL: un cuadrante de piedra con las horas en números romanos. Se elige hasta qué hora
     descansar (←/→ o tocando las flechas; por omisión, hasta el amanecer, la hora VII). La sombra del reloj marca la
     hora elegida; de noche el cuadrante se oscurece y lo alumbra la luna.
   - Al confirmar (T / Enter): se paga, la pantalla se va a negro, pasa el tiempo hasta esa hora (siempre hacia adelante:
     si la hora ya pasó, es la de mañana), el héroe se despierta con la vida completa y la partida queda guardada.
   - Las horas: el día va de la VII a la XVIII, el atardecer de la XVIII a la XX, la noche de la XX a la VI y el
     amanecer de la VI a la VII (las mismas del reloj de sol que se compra, ck_reloj.js).
   Borrar la línea de index.html lo saca (la cama del Rey vuelve a su siesta de antes). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const DIA = 300000, PRECIO = 8, AMANECER = 7;
  // x, y = centro de la cama (del mapa); r = cuán cerca hay que estar
  const CAMAS = {
    'ed_taberna_2.main': { nombre: 'Cama de la taberna', precio: PRECIO, puntos: [[449, 58], [376, 58], [449, 134], [449, 216]], r: 40 }
  };
  // dayPhase ↔ hora (como ck_reloj.js)
  const TRAMOS = [[0, 0.52, 7, 18], [0.52, 0.62, 18, 20], [0.62, 0.92, 20, 30], [0.92, 1, 6, 7]];
  const horaDe = p => { for (const [a, b, h0, h1] of TRAMOS) if (p >= a && p < b) return (h0 + (p - a) / (b - a) * (h1 - h0)) % 24; return 7; };
  const faseDe = h => {
    h = ((h % 24) + 24) % 24;
    for (const [a, b, h0, h1] of TRAMOS) { const hh = h < h0 && h1 > 24 ? h + 24 : h; if (hh >= h0 && hh < h1) return a + (hh - h0) / (h1 - h0) * (b - a); }
    return 0;
  };
  const romano = n => { n = Math.round(n) || 24; let s = ''; [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } }); return s; };
  const momento = h => h >= 6 && h < 7 ? 'el amanecer' : h >= 7 && h < 11 ? 'la mañana' : h >= 11 && h < 14 ? 'el mediodía' : h >= 14 && h < 18 ? 'la tarde' : h >= 18 && h < 20 ? 'el atardecer' : 'la noche';
  const deNoche = h => h >= 20 || h < 6;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;

  // ------------------------------------------------------------------ qué cama hay cerca
  const camaCerca = S => {
    if (!st(S) || !S.currentInterior || !S.player || !S.player.body) return null;
    let zona = ''; try { zona = S.currentZoneKey(); } catch (e) {}
    const C = CAMAS[zona];
    if (C) {
      const a = S.currentInterior.area, b = S.player.body, x = b.center.x - a.x, y = b.bottom - a.y;
      if (C.puntos.some(([cx, cy]) => Math.hypot(cx - x, cy - y) < C.r)) return C;
    }
    // la cama del Rey (ck_salas_castillo.js): gratis
    try { const id = window.CK_SALAS_CASTILLO && CK_SALAS_CASTILLO.cerca && CK_SALAS_CASTILLO.cerca(); if (id === 'cama' || id === 'cama_der') return { nombre: 'La cama del Rey', precio: 0, rey: true }; } catch (e) {}
    return null;
  };

  // ------------------------------------------------------------------ el cuadro con el reloj de sol
  const css = () => {
    if (document.getElementById('ck-cama-css')) return;
    const s = document.createElement('style'); s.id = 'ck-cama-css';
    s.textContent = `
#ck-cama { position: absolute; inset: 0; z-index: 60; display: none; align-items: center; justify-content: center; background: rgba(8, 6, 10, .62); font-family: var(--ck2-f, 'CK Grenze', Georgia, serif); }
#ck-cama.on { display: flex; }
#ck-cama .caja { width: min(430px, 92%); padding: 16px 20px 14px; text-align: center; color: #3a2414; background: linear-gradient(180deg, #f1dcb0, #d9bb82);
  border: 3px solid #3a2414; box-shadow: 0 0 0 3px #7a5230 inset, 0 8px 18px rgba(0, 0, 0, .6); }
#ck-cama h3 { margin: 0; font-size: 24px; letter-spacing: 1px; color: #5a1e10; }
#ck-cama .sub { font-size: 16px; font-weight: 600; margin: 2px 0 8px; color: #6b4a2c; }
#ck-cama canvas { display: block; margin: 0 auto; width: 300px; max-width: 100%; height: auto; image-rendering: pixelated; }
#ck-cama .hora { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 6px 0 2px; }
#ck-cama .hora b { min-width: 120px; font-size: 34px; line-height: 1; color: #7a1c10; letter-spacing: 2px; }
#ck-cama .hora button { width: 44px; height: 44px; font-size: 22px; cursor: pointer; color: #f6e6c2; background: linear-gradient(180deg, #7a4a1e, #4a2810); border: 3px solid #140803; box-shadow: inset 0 0 0 1px #b07a3c; }
#ck-cama .cuando { font-size: 17px; font-weight: 600; min-height: 22px; }
#ck-cama .acc { display: flex; gap: 10px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
#ck-cama .acc button { font-family: inherit; font-size: 16px; font-weight: 700; padding: 9px 14px; cursor: pointer; color: #ffe6a8; background: linear-gradient(180deg, #7a4a1e, #4a2810); border: 3px solid #140803; box-shadow: inset 0 0 0 1px #b07a3c; text-shadow: 0 1px 0 #000; }
#ck-cama .acc button.oro { background: linear-gradient(180deg, #c48a22, #7c5210); color: #fff4cf; }
#ck-cama .acc button:disabled { filter: grayscale(1) brightness(.7); cursor: default; }
#ck-cama .pie { font-size: 14px; color: #6b4a2c; margin-top: 8px; }
#ck-cama .falta { color: #a01e12; font-weight: 700; }
body:has(#ck-cama.on) #ck-ayuda, body:has(#ck-cama.on) #ck-prompt { display: none !important; }`;
    document.head.appendChild(s);
  };
  let el = null, sel = AMANECER, cama = null, escena = null;
  const armar = S => {
    css();
    const host = document.getElementById('game-wrapper') || document.body;
    if (!el) {
      el = document.createElement('div'); el.id = 'ck-cama';
      el.innerHTML = '<div class="caja"><h3></h3><div class="sub"></div><canvas width="150" height="84"></canvas>' +
        '<div class="hora"><button data-d="-1" aria-label="Una hora antes">◂</button><b></b><button data-d="1" aria-label="Una hora después">▸</button></div>' +
        '<div class="cuando"></div><div class="acc"><button class="oro" data-acc="ok"></button><button data-acc="amanecer">HASTA EL AMANECER</button><button data-acc="no">CANCELAR</button></div>' +
        '<div class="pie"></div></div>';
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b || !escena) return;
        if (b.dataset.d) { mover(+b.dataset.d); return; }
        if (b.dataset.acc === 'no') escena.closeOverlay();
        else if (b.dataset.acc === 'amanecer') { sel = AMANECER; pintar(); confirmar(); }
        else confirmar();
      });
    }
    if (el.parentElement !== host) host.appendChild(el);
    return el;
  };
  // el cuadrante: de día, las horas VI…XX en un arco y la sombra del gnomon; de noche, XX…VI y la luna
  const dibujar = (ahora, elegida) => {
    const c = el.querySelector('canvas'), g = c.getContext('2d'), W = c.width, H = c.height, noche = deNoche(elegida) && !(elegida >= 6 && elegida < 7);
    g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H - 8, R = 66;
    // la piedra
    g.fillStyle = noche ? '#2a2d42' : '#8f887a'; g.beginPath(); g.arc(cx, cy, R + 6, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = noche ? '#3a3f5c' : '#b9b2a2'; g.beginPath(); g.arc(cx, cy, R + 2, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = noche ? '#474d70' : '#d2ccbd'; g.beginPath(); g.arc(cx, cy, R - 16, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#1b1410'; g.fillRect(cx - R - 6, cy, 2 * R + 12, 3);
    const horas = []; if (noche) for (let h = 20; h <= 30; h++) horas.push(h % 24); else for (let h = 6; h <= 20; h++) horas.push(h);
    const ang = i => Math.PI - (i / (horas.length - 1)) * Math.PI;   // de izquierda a derecha
    g.textAlign = 'center'; g.textBaseline = 'middle';
    horas.forEach((h, i) => {
      const a = ang(i), x = cx + Math.cos(a) * (R - 7), y = cy - Math.sin(a) * (R - 7);
      const es = h === elegida;
      g.fillStyle = noche ? '#1c2036' : '#5a5348'; g.fillRect(Math.round(cx + Math.cos(a) * (R - 16)), Math.round(cy - Math.sin(a) * (R - 16)), 1, 1);
      if (horas.length <= 11 || i % 2 === 0 || es) {
        g.font = (es ? 'bold 9px' : '7px') + " 'CK Grenze', Georgia, serif";
        g.fillStyle = es ? (noche ? '#ffe9a8' : '#8a1c10') : (noche ? '#aab0d6' : '#3a342c');
        g.fillText(romano(h), Math.round(x), Math.round(y));
      }
    });
    // la sombra (o el rayo de luna) hasta la hora elegida
    const i = horas.indexOf(elegida);
    if (i >= 0) {
      const a = ang(i);
      g.strokeStyle = noche ? 'rgba(210,220,255,.85)' : 'rgba(27,15,10,.9)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx, cy - 1); g.lineTo(cx + Math.cos(a) * (R - 18), cy - Math.sin(a) * (R - 18)); g.stroke();
    }
    // la hora de ahora: una marquita
    const j = horas.findIndex((h, k) => k < horas.length - 1 && ((ahora >= h && ahora < h + 1) || (h === 23 && ahora >= 23)));
    if (j >= 0) {
      const f = ahora - Math.floor(ahora), a = ang(j + f);
      g.fillStyle = noche ? '#e8ecff' : '#e0a020'; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 2), cy - Math.sin(a) * (R + 2), 3, 0, 7); g.fill();
    }
    // el gnomon
    g.fillStyle = '#2b1a0e'; g.beginPath(); g.moveTo(cx - 5, cy); g.lineTo(cx + 5, cy); g.lineTo(cx, cy - 20); g.closePath(); g.fill();
    // sol o luna
    if (noche) { g.fillStyle = '#f2f4ff'; g.beginPath(); g.arc(18, 14, 8, 0, 7); g.fill(); g.fillStyle = '#2a2d42'; g.beginPath(); g.arc(22, 11, 7, 0, 7); g.fill(); }
    else { g.fillStyle = '#f5c542'; g.beginPath(); g.arc(18, 14, 7, 0, 7); g.fill(); g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(18, 14, 4, 0, 7); g.fill(); }
  };
  const horasHasta = (ahora, h) => { let d = h - ahora; if (d <= 0.25) d += 24; return d; };
  const pintar = () => {
    const S = escena, s = st(S); if (!S || !s || !el) return;
    const ahora = horaDe(S.dayPhase()), d = horasHasta(ahora, sel), alcanza = (s.coins || 0) >= cama.precio;
    el.querySelector('h3').textContent = cama.nombre;
    el.querySelector('.sub').innerHTML = cama.precio ? (alcanza ? 'Cuesta ' + cama.precio + ' monedas · tenés ' + (s.coins || 0) : '<span class="falta">Cuesta ' + cama.precio + ' monedas y tenés ' + (s.coins || 0) + '</span>') : 'Nadie mira. Es gratis.';
    el.querySelector('.hora b').textContent = romano(sel);
    el.querySelector('.cuando').textContent = 'Descansar hasta la hora ' + romano(sel) + ', ' + momento(sel) + (sel >= 6 && sel <= ahora ? ' de mañana' : '') + ' (' + Math.round(d) + ' h). Ahora es la ' + romano(Math.floor(ahora)) + '.';
    const ok = el.querySelector('[data-acc=ok]'); ok.textContent = cama.precio ? 'DORMIR · ' + cama.precio + ' MONEDAS' : 'DORMIR'; ok.disabled = !alcanza;
    el.querySelector('[data-acc=amanecer]').disabled = !alcanza;
    el.querySelector('.pie').textContent = '←/→ elegir la hora · T o Enter dormir · Esc cancelar · Al despertar: vida completa y partida guardada';
    dibujar(ahora, sel);
  };
  const mover = d => { sel = (sel + d + 24) % 24; pintar(); try { sfx.fx('ui_hover', 0.4); } catch (e) {} };   // 0 = la hora XXIV (medianoche)
  const abrir = (S, C) => {
    armar(S); escena = S; cama = C; sel = AMANECER;
    if (!S.openOverlay('ck-cama')) return;
    pintar();
  };
  const confirmar = () => {
    const S = escena, s = st(S); if (!S || !s || !cama) return;
    if ((s.coins || 0) < cama.precio) { try { sfx.fx('door_locked', 0.6); } catch (e) {} return; }
    const destino = sel, C = cama;
    S.closeOverlay();
    s.coins = (s.coins || 0) - C.precio;
    try { if (C.precio) sfx.fx('coin', 0.6); } catch (e) {}
    const cam = S.cameras.main;
    S._doorTransition = true;                 // quieto y a salvo mientras duerme
    cam.fadeOut(700, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const p0 = S.dayPhase(), p1 = faseDe(destino);
      let salto = p1 - p0; if (salto <= 0.004) salto += 1;
      S.dayClock = (S.dayClock || 0) + salto * DIA;
      S.health = S.maxHealth; if (S.stamina !== undefined && S.maxStamina) S.stamina = S.maxStamina;
      try { S._wasNight = S.isNight(); } catch (e) {}
      try { S.updateHUD(); S.updateObjective(); S.saveStory(); } catch (e) {}
      S.time.delayedCall(900, () => {
        cam.fadeIn(900, 0, 0, 0);
        S._doorTransition = false;
        try { S.showZoneTitle('Hora ' + romano(destino), 'Descansaste hasta ' + momento(destino) + ' · vida completa · partida guardada'); } catch (e) {}
      });
    });
  };
  // teclas del cuadro
  addEventListener('keydown', e => {
    if (!escena || escena._overlay !== 'ck-cama') return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { mover(-1); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { mover(1); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (k === 'Enter' || k === 't' || k === 'T') { if (performance.now() - abiertoEn > 350) confirmar(); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  let abiertoEn = 0;

  // ------------------------------------------------------------------ T y el cartel
  const int0 = P.interact;
  P.interact = function () {
    if (!this._overlay && !this.dialogOpen && st(this) && !this.isDead && !this._doorTransition && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) {
      const C = camaCerca(this);
      if (C) { abiertoEn = performance.now(); abrir(this, C); return; }
    }
    return int0.apply(this, arguments);
  };
  const hist0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = hist0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt');
      if (pr && st(this) && !this.dialogOpen && !this._overlay) {
        const C = camaCerca(this);
        if (C && !C.rey) { const t = 'T · Usar la cama (' + C.precio + ' monedas)'; if (pr.textContent !== t) pr.textContent = t; pr.classList.add('on'); }
        else if (/^T · Usar la cama/.test(pr.textContent)) { pr.classList.remove('on'); pr.textContent = ''; }
      }
    } catch (e) {}
    return r;
  };
  window.CK_CAMAS = { CAMAS, horaDe, faseDe, romano, abrir, cerca: () => camaCerca(window.activeGameScene) };
})();
