'use strict';
/* Árbol de habilidades con el arte de cada héroe (11/11, pedido del dueño: "en las ranuras de habilidades sólo colocá la
   tecla y adentro vacío o negro; hacé con PixelLab el árbol de habilidades de cada personaje referente a su rol y estilo, con
   iluminación y animaciones al seleccionar y mejorar alguna, y que después deje poner la habilidad en las ranuras vacías").
   Va encima de ck_habilidades.js + ck_habilidades_equipo.js (la lógica, los puntos, las ranuras y las teclas son las mismas):
   - RANURAS del HUD (Q E R F): arrancan VACÍAS y negras, sólo con la tecla. Nada se pone solo: las dos habilidades de base
     y las NUEVAS del árbol se ponen a mano desde el árbol (H). Las partidas viejas conservan lo que ya tenían puesto.
   - ÁRBOL (H): un panel de PixelLab por héroe (grimorio de piedra con velas para Horos, acero con cinta azul para Lancent,
     madera con rosas y dagas para Aby, troncos con nieve para Urso) y marcos de nodo en 4 estados (cerrado con cadenas,
     abierto, aprendido, completo). Arriba el medallón del héroe; debajo, las habilidades de base; y de ahí salen las ramas
     con sus nodos unidos por líneas que se encienden (y corren) cuando el nodo está aprendido.
   - Al ELEGIR un nodo: aro de luz que late y el panel de la derecha con la descripción, el rango y el botón. Al APRENDER:
     destello, chispas, el marco cambia de estado y la línea se enciende. Las NUEVAS aprendidas (y las de base) se ponen en
     una ranura con Q, E, R o F o tocando la ranura en el panel.
   Borrar su línea (y la de ck_arbol_arte.js) de index.html vuelve al árbol de columnas de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_HABILIDADES || !window.CK_EQUIPO || !window.CK_ARBOL_ARTE) return;
  const P = MainGameScene.prototype, HB = window.CK_HABILIDADES, EQ = window.CK_EQUIPO, ARTE = window.CK_ARBOL_ARTE;
  const ARBOL = HB.ARBOL, TECLAS = EQ.TECLAS || ['Q', 'E', 'R', 'F'];
  const ESCENA = () => window.activeGameScene || (window.game && window.game.scene && window.game.scene.scenes.find(s => s.startCampaign));
  const arte = h => (ARTE['panel_' + h] ? h : 'soldier');
  const TONO = {
    soldier: { glow: '#ffd25a', linea: '#e8b84a', tinta: '#f3ead9', papel: 'rgba(10,14,26,.78)' },
    swordsman: { glow: '#ff7a9a', linea: '#ff5a8a', tinta: '#ffe6ee', papel: 'rgba(30,6,16,.8)' },
    wizard: { glow: '#c49bff', linea: '#a06cff', tinta: '#eee6ff', papel: 'rgba(12,10,36,.8)' },
    bear: { glow: '#9fe0ff', linea: '#7fd0ff', tinta: '#eaf6ff', papel: 'rgba(8,24,18,.8)' }
  };
  // cuánto ocupa el marco de cada panel (arriba derecha abajo izquierda): el libro de Horos, la cinta de Lancent y Aby…
  // zona libre de cada panel (en píxeles del dibujo de 341×256): deja afuera el libro de Horos, las cintas, las rosas…
  const SAFE = { wizard: [40, 46, 306, 192], soldier: [56, 50, 288, 186], swordsman: [32, 46, 308, 206], bear: [38, 46, 304, 214] };
  // en px del tamaño de diseño (1000x751): un % se mediría contra la ventana ya escalada
  const PAD = {}; Object.keys(SAFE).forEach(k => { const [x0, y0, x1, y1] = SAFE[k]; const X = v => Math.round(v / 341 * 1000) + 'px', Y = v => Math.round(v / 256 * 751) + 'px'; PAD[k] = `${Y(y0)} ${X(341 - x1)} ${Y(256 - y1)} ${X(x0)}`; });

  // ------------------------------------------------------------------ ranuras vacías al empezar (nada se pone solo)
  // ck_habilidades_equipo.js arma las ranuras la primera vez que las pide (y ahí ponía las dos de base): acá se le gana de
  // mano creándolas vacías, y lo aprendido queda marcado como "visto" para que no entre solo en el primer hueco.
  let armando = false;
  const hab0 = HB.hab;
  HB.hab = function (S) {
    const X = hab0.apply(this, arguments);
    try {
      if (X && !armando && S && S.playerHero) {
        armando = true;
        const h = S.playerHero;
        X.ranuras = X.ranuras || {};
        if (!X.ranuras[h]) X.ranuras[h] = [null, null, null, null];
        X._vistas = X._vistas || {}; const v = X._vistas[h] = X._vistas[h] || {};
        EQ.aprendidas(S, h).forEach(id => { v[id] = 1; });
      }
    } catch (e) {} finally { armando = false; }
    return X;
  };

  // ------------------------------------------------------------------ estilos
  const css = `
/* ranuras del HUD: negras, sólo la tecla */
#ckh .ran.hab.vacia::after { background: #07050a !important; box-shadow: inset 0 0 0 1px #000, inset 0 0 10px #000; }
#ckh .ran.hab.vacia img { display: none; }
#ckh .ran.hab.vacia.ck-bloq::after { content: attr(data-nv) !important; font-size: 11px !important; color: #6a6050 !important; opacity: .9; text-shadow: none !important; background: #07050a !important; }
#ckh .ran.hab.vacia.ck-bloq::before { opacity: .45; }
/* la ventana */
#ck-habilidades.arbol .ck-win { width: calc(1000px * var(--ar-k, 1)) !important; height: calc(751px * var(--ar-k, 1)) !important; max-height: none !important; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; overflow: visible; }
#ck-habilidades.arbol .ck-win > h3, #ck-habilidades.arbol .hb-cab, #ck-habilidades.arbol .hb-cols, #ck-habilidades.arbol .hb-desc, #ck-habilidades.arbol .hb-equipo, #ck-habilidades.arbol .hb-ayuda { display: none !important; }
#ck-habilidades.arbol .ck-win > h3::after { display: none; }
#ck-habilidades.arbol .ck-win { display: block !important; overflow: visible !important; }
#ck-habilidades .ar { flex: none; align-self: flex-start; margin: 0; position: relative; width: 1000px; height: 751px; transform: scale(var(--ar-k, 1)); transform-origin: 0 0; box-sizing: border-box; padding: var(--ar-pad, 7% 6% 12% 10%); display: flex; gap: 2%;
  background: var(--ar-panel) 0 0 / 100% 100% no-repeat; image-rendering: pixelated; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); color: var(--ar-tinta, #f3ead9); }
#ck-habilidades .ar * { box-sizing: border-box; }

/* el árbol */
#ck-habilidades .ar-arbol { position: relative; flex: 1 1 66%; min-width: 0; overflow: hidden; }
#ck-habilidades .ar-lienzo { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
#ck-habilidades .ar-emb { position: absolute; width: 84px; height: 84px; transform: translate(-50%, -50%); z-index: 2; }
#ck-habilidades .ar-emb .f { position: absolute; left: 10px; top: 10px; width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(circle at 50% 40%, var(--ckh-c2, #3a4a6a), var(--ckh-c1, #141a2a) 75%); overflow: hidden; }
#ck-habilidades .ar-emb .f img { position: absolute; left: -8px; top: -4px; width: 80px; height: 80px; image-rendering: pixelated; object-fit: cover; }
#ck-habilidades .ar-emb .f img[src=''] { display: none; }
#ck-habilidades .ar-emb .m { position: absolute; inset: 0; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
#ck-habilidades .ar-emb::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; box-shadow: 0 0 22px 6px var(--ar-glow); opacity: .35; }
#ck-habilidades .ar-cab { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-weight: 700; font-size: 15px; text-shadow: 0 2px 0 #000; pointer-events: none; white-space: nowrap; }
#ck-habilidades .ar-cab b { color: var(--ar-glow); font-size: 18px; }
#ck-habilidades .ar-cab .pts { padding: 2px 8px; background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.12); }
#ck-habilidades .ar-cab .pts.hay { animation: arPts 1s ease-in-out infinite alternate; }
@keyframes arPts { to { box-shadow: 0 0 10px 2px var(--ar-glow); } }
#ck-habilidades .ar-titulo { position: absolute; transform: translate(-50%, -100%); font-weight: 700; font-size: 14px; letter-spacing: .5px; white-space: nowrap; text-shadow: 0 2px 0 #000, 0 0 6px #000; opacity: .9; }
#ck-habilidades .ar-titulo.fila { transform: translate(0, -50%); text-align: left; white-space: nowrap; line-height: 1.05; font-size: 15px; }
#ck-habilidades .ar-titulo.fila small { text-align: left; }
#ck-habilidades .ar-titulo small { display: block; font-weight: 600; font-size: 12px; color: var(--ar-glow); text-align: center; }
#ck-habilidades .ar-nodo { --t: 56px; position: absolute; width: var(--t); height: var(--t); transform: translate(-50%, -50%); cursor: pointer; z-index: 2; transition: transform .12s; }
#ck-habilidades .ar-nodo:hover { transform: translate(-50%, -50%) scale(1.08); }
#ck-habilidades .ar-nodo .mk { position: absolute; inset: 0; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; z-index: 1; pointer-events: none; }
#ck-habilidades .ar-nodo img { position: absolute; left: 23%; top: 23%; width: 54%; height: 54%; image-rendering: pixelated; z-index: 3; pointer-events: none; }
#ck-habilidades .ar-nodo.cerrado img { filter: grayscale(1) brightness(.4); opacity: .6; }
#ck-habilidades .ar-nodo.abierto img { filter: brightness(.8) saturate(.7); }
#ck-habilidades .ar-nodo .pips { position: absolute; left: 50%; top: calc(100% - 3px); transform: translateX(-50%); display: flex; gap: 2px; z-index: 3; }
#ck-habilidades .ar-nodo .pips i { width: 7px; height: 7px; background: #2a2020; border: 1px solid #000; transform: rotate(45deg); }
#ck-habilidades .ar-nodo .pips i.v { background: var(--ar-glow); box-shadow: 0 0 5px var(--ar-glow); }
#ck-habilidades .ar-nodo .req { position: absolute; right: -4px; top: -4px; min-width: 18px; height: 18px; line-height: 16px; padding: 0 4px; border-radius: 9px; background: #1a1210; border: 1px solid #5a4a40; color: #d8c8a8; font-size: 11px; font-weight: 700; text-align: center; z-index: 4; }
#ck-habilidades .ar-nodo .tk { position: absolute; left: -6px; top: -6px; width: 22px; height: 22px; line-height: 21px; text-align: center; background: var(--ar-glow); color: #120a0a; font-size: 13px; font-weight: 700; border: 2px solid #000; z-index: 4; }
#ck-habilidades .ar-nodo .nueva { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #fff; background: #7a2418; padding: 0 3px; border: 1px solid #000; z-index: 4; }
#ck-habilidades .ar-nodo.aprendido .aura, #ck-habilidades .ar-nodo.completo .aura { position: absolute; inset: 2px; border-radius: 50%; box-shadow: 0 0 14px 3px var(--ar-glow); opacity: .35; z-index: 0; }
#ck-habilidades .ar-nodo.completo .aura { opacity: .6; animation: arAura 2.4s ease-in-out infinite alternate; }
@keyframes arAura { from { opacity: .35; } to { opacity: .75; } }
#ck-habilidades .ar-nodo.sel .aro { position: absolute; inset: -6px; border-radius: 50%; border: 3px solid var(--ar-glow); box-shadow: 0 0 16px 4px var(--ar-glow), inset 0 0 10px var(--ar-glow); animation: arAro 1s ease-in-out infinite alternate; z-index: 3; pointer-events: none; }
@keyframes arAro { from { opacity: .55; transform: scale(.96); } to { opacity: 1; transform: scale(1.06); } }
#ck-habilidades .ar-nodo.subio .mk { animation: arSube .55s ease-out; }
@keyframes arSube { 0% { transform: scale(1); filter: brightness(1); } 25% { transform: scale(1.28); filter: brightness(2.4); } 100% { transform: scale(1); filter: brightness(1); } }
#ck-habilidades .ar-nodo .flash { position: absolute; inset: -10px; border-radius: 50%; background: radial-gradient(circle, #fff 0%, var(--ar-glow) 35%, transparent 70%); opacity: 0; pointer-events: none; z-index: 5; }
#ck-habilidades .ar-nodo.subio .flash { animation: arFlash .6s ease-out; }
@keyframes arFlash { 0% { opacity: 1; transform: scale(.5); } 100% { opacity: 0; transform: scale(1.8); } }
#ck-habilidades .ar-chispa { position: absolute; width: 5px; height: 5px; background: #fff; box-shadow: 0 0 6px var(--ar-glow); z-index: 6; pointer-events: none; animation: arChispa .7s ease-out forwards; transform: rotate(45deg); }
@keyframes arChispa { 0% { opacity: 1; translate: 0 0; } 100% { opacity: 0; translate: var(--dx) var(--dy); } }
/* el panel de la derecha */
#ck-habilidades .ar-lado { flex: 0 0 30%; overflow: hidden; display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 0 2px; font-size: 15px; }
#ck-habilidades .ar-ficha { flex: 1 1 0; min-height: 0; }
#ck-habilidades .ar-ficha { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 8px 10px; background: var(--ar-papel); border: 2px solid rgba(0,0,0,.7); box-shadow: inset 0 0 0 1px rgba(255,236,200,.14); }
#ck-habilidades .ar-ficha h4 { margin: 0 0 2px; font-size: 1.25em; color: var(--ar-glow) !important; font-family: inherit; text-shadow: 0 2px 0 #000; }
#ck-habilidades .ar-ficha .rama { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; opacity: .8; margin-bottom: 4px; }
#ck-habilidades .ar-ficha p { margin: 0 0 6px; font-size: 1em; line-height: 1.25; color: inherit !important; font-family: inherit !important; }
#ck-habilidades .ar-ficha p.sig { opacity: .85; font-style: italic; }
#ck-habilidades .ar-ficha p.cand { color: #ffb08a !important; }
#ck-habilidades .ar-bot { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
#ck-habilidades .ar-bot .hb-subir { grid-column: 1 / -1; }
#ck-habilidades .ar-bot .ck-close { position: static !important; }
#ck-habilidades .ar-bot button { margin: 0 !important; min-width: 0 !important; width: 100%; height: 36px !important; font-size: 13px !important; line-height: 1 !important; padding: 0 2px 2px !important; cursor: pointer; white-space: nowrap; border-width: 6px 12px !important; }
#ck-habilidades .ar-bot .hb-subir { height: 40px !important; font-size: 15px !important; }
#ck-habilidades .ar-bot button:disabled { filter: grayscale(.8) brightness(.7) !important; opacity: .8; cursor: default; }
#ck-habilidades .ar-ran { display: flex; flex-direction: column; align-items: stretch; gap: 2px; padding: 6px 6px 14px; background: var(--ar-papel); border: 2px solid rgba(0,0,0,.7); box-shadow: inset 0 0 0 1px rgba(255,236,200,.14); }
#ck-habilidades .ar-ran .t { width: 100%; font-size: 12px; text-align: center; opacity: .85; margin-bottom: 2px; }
#ck-habilidades .ar-ran .cuerpo { display: flex; justify-content: space-around; width: 100%; }
#ck-habilidades .ar-r { position: relative; width: 48px; height: 48px; cursor: pointer; background: var(--ar-ranura) 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
#ck-habilidades .ar-r .fo { position: absolute; inset: 5px; background: #07050a; }
#ck-habilidades .ar-r img { position: absolute; left: 6px; top: 6px; width: 36px; height: 36px; image-rendering: pixelated; }
#ck-habilidades .ar-r b { position: absolute; left: 50%; bottom: -10px; transform: translateX(-50%); min-width: 22px; height: 18px; line-height: 17px; text-align: center; padding: 0 4px; background: #f3ead9; color: #120a0a; font-size: 13px; font-weight: 700; border: 2px solid #000; }
#ck-habilidades .ar-r.lista { outline: 3px solid var(--ar-glow); outline-offset: 1px; animation: arAro 1s ease-in-out infinite alternate; }
#ck-habilidades .ar-r.puso { animation: arSube .5s ease-out; }
#ck-habilidades .ar-r.bloq::after { content: attr(data-nv); position: absolute; inset: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6a6050; background: #07050a; }
body:has(#ck-habilidades.on) #ck-ayuda, body:has(#ck-habilidades.on) #ck-nota { display: none !important; }
#ck-habilidades .ar-ayuda { font-size: 12px; opacity: .8; text-align: center; line-height: 1.2; }
`;
  const st = document.createElement('style'); st.id = 'ck-arbol-css'; st.textContent = css; document.head.append(st);

  // ------------------------------------------------------------------ armar y pintar
  let ar = null, raf = 0, ultRangos = {}, ultSel = '';
  const win = () => document.getElementById('ck-habilidades');
  const estado = (S, h, rama, n) => {
    const r = HB.rg(S, n.id, h) || 0, abierto = HB.practica(S) || HB.gastados(S, h, rama.id) >= n.req;
    return !abierto ? 'cerrado' : r >= n.max ? 'completo' : r > 0 ? 'aprendido' : 'abierto';
  };
  const MARCO = { cerrado: 'locked', abierto: 'open', aprendido: 'learned', completo: 'mastered' };
  const armar = (S) => {
    const w = win(); if (!w) return;
    const cw = w.querySelector('.ck-win');
    if (!ar) {
      ar = document.createElement('div'); ar.className = 'ar';
      ar.innerHTML = '<div class="ar-arbol"><canvas class="ar-lienzo"></canvas><div class="ar-nodos"></div></div>' +
        '<div class="ar-lado"><div class="ar-cab"><span class="nom"></span><span class="pts"></span></div><div class="ar-ficha"></div><div class="ar-bot"></div><div class="ar-ran"><div class="t"></div><div class="cuerpo"></div></div><div class="ar-ayuda"></div></div>';
      const bot = ar.querySelector('.ar-bot');
      ['.hb-subir', '.hb-bajar', '.hb-llena', '.hb-reset'].forEach(s => { const b = cw.querySelector(s); if (b) bot.appendChild(b); });
      const cl = cw.querySelector('.ck-close'); if (cl) bot.appendChild(cl);
      cw.appendChild(ar);
      w.classList.add('arbol');
    }
    return ar;
  };
  const chispas = (nodo, n) => {
    for (let i = 0; i < (n || 10); i++) {
      const c = document.createElement('i'); c.className = 'ar-chispa';
      const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 30;
      c.style.left = '50%'; c.style.top = '50%'; c.style.setProperty('--dx', Math.cos(a) * d + 'px'); c.style.setProperty('--dy', Math.sin(a) * d + 'px');
      c.style.animationDelay = (Math.random() * 90) + 'ms';
      nodo.appendChild(c); setTimeout(() => c.remove(), 900);
    }
  };
  const pintar = S => {
    const w = win(), h = S.playerHero, A = ARBOL[h]; if (!w || !A || !w.classList.contains('on')) return;
    armar(S);
    const a = arte(h), T = TONO[h] || TONO.soldier, AR = window.CK_HUD_HEROE_ARTE || {}, AT = window.CK_HUD_TEMA_ARTE || {}, pr = HB.practica(S);
    ar.style.setProperty('--ar-panel', `url("${ARTE['panel_' + a]}")`);
    ar.style.setProperty('--ar-pad', PAD[a] || PAD.soldier); ar.style.setProperty('--ar-glow', T.glow); ar.style.setProperty('--ar-tinta', T.tinta); ar.style.setProperty('--ar-papel', T.papel);
    ar.style.setProperty('--ar-ranura', AR['ranura_' + a] ? `url("${AR['ranura_' + a]}")` : 'none');
    const C = window.CK_HUD_TEMA && window.CK_HUD_TEMA.CFG && window.CK_HUD_TEMA.CFG[h];
    if (C) { ar.style.setProperty('--ckh-c1', C.c1); ar.style.setProperty('--ckh-c2', C.c2); }
    // quién está elegido (lo dice la ventana vieja, escondida)
    const selEl = w.querySelector('.hb-nodo.sel'), selR = selEl ? +selEl.dataset.r : 0, selI = selEl ? +selEl.dataset.i : 0;
    const baseEl = w.querySelector('.hb-base.sel'), baseSel = baseEl ? baseEl.dataset.id : null;
    const cab = ar.querySelector('.ar-cab');
    const pts = pr ? 0 : HB.puntos(S, h);
    cab.querySelector('.nom').innerHTML = `${A.nombre} <small style="font-weight:600;opacity:.8">${pr ? 'práctica' : 'nivel ' + (S.story.level || 1)}</small>`;
    cab.querySelector('.pts').innerHTML = pr ? 'Libre' : `Puntos <b>${pts}</b>`;
    cab.querySelector('.pts').classList.toggle('hay', pts > 0);
    // posiciones
    // la escala: que entre entero en la pantalla, sin pasarse de 1,3 (en pantallas grandes crece un poco)
    const k = Math.max(0.4, Math.min(1.3, w.clientWidth * 0.97 / 1000, w.clientHeight * 0.96 / 751));
    w.style.setProperty('--ar-k', k.toFixed(4));
    const caja = ar.querySelector('.ar-arbol'), W = caja.clientWidth, Hh = caja.clientHeight;
    const nodos = ar.querySelector('.ar-nodos'); nodos.innerHTML = '';
    const ramas = A.ramas, nr = ramas.length, bases = EQ.BASE_DE[h] || [], ranuras = EQ.ranuras(S, h);
    const maxN = Math.max(...ramas.map(r => r.nodos.length));
    // (11/11, "que todo encaje, se aprovechen los espacios y quede centrado") las ramas van en FILAS: el título a la izquierda y
    // los nodos de izquierda a derecha; arriba el medallón con las de base a los lados; un tronco baja por la izquierda
    const titW = 112, yEmb = 42, yRamas = 96;
    const rowH = (Hh - yRamas) / nr, sep = (W - titW - 8) / maxN;
    const T_ = Math.round(Math.max(40, Math.min(74, Math.min(rowH * 0.74, sep * 0.76))));
    nodos.style.setProperty('--t', T_ + 'px');
    const xDe = ni => titW + 8 + sep * (ni + 0.5), yDe = ri => Math.round(yRamas + rowH * (ri + 0.5));
    const emb = document.createElement('div'); emb.className = 'ar-emb'; emb.style.left = W / 2 + 'px'; emb.style.top = yEmb + 'px';
    const retrato = w.ownerDocument.querySelector('#ckh .vent img.c1');
    emb.innerHTML = `<div class="f">${retrato && retrato.src ? `<img src="${retrato.src}" alt="" onerror="this.remove()">` : ''}</div><div class="m" style="background-image:url('${AT['emb_' + a] || ''}')"></div>`;
    nodos.appendChild(emb);
    const lineas = [], xTronco = Math.round(titW - 14);
    bases.forEach((id, i) => {
      const d = EQ.def(h, id); if (!d) return;
      const lado = bases.length === 1 ? 0 : (i === 0 ? -1 : 1), x = Math.round(W / 2 + lado * (52 + T_ * 0.6)), y = yEmb;
      const el = document.createElement('div'); el.className = 'ar-nodo completo base' + (baseSel === id ? ' sel' : '');
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.title = d.n;
      const j = ranuras.indexOf(id);
      el.innerHTML = `<div class="aura"></div><img src="${EQ.icono(h, id)}" alt=""><div class="mk" style="background-image:url('${ARTE['nodo_' + a + '_mastered']}')"></div>${j >= 0 ? `<span class="tk">${TECLAS[j]}</span>` : ''}<div class="aro"></div><div class="flash"></div>`;
      el.onclick = () => { const b = w.querySelector(`.hb-base[data-id="${id}"]`); if (b) b.click(); else pintar(S); };
      nodos.appendChild(el);
      lineas.push({ x0: W / 2 + lado * 40, y0: y, x1: x - lado * T_ / 2, y1: y, on: true });
    });
    // el tronco: del medallón baja hasta la última rama
    lineas.push({ x0: W / 2, y0: yEmb + 42, x1: xTronco, y1: yDe(nr - 1), on: true, tronco: true });
    ramas.forEach((rama, ri) => {
      const cy = yDe(ri), g = HB.gastados(S, h, rama.id);
      const tit = document.createElement('div'); tit.className = 'ar-titulo fila'; tit.style.left = '4px'; tit.style.top = cy + 'px';
      tit.innerHTML = `${rama.nombre}<small>${g} punto${g === 1 ? '' : 's'}</small>`; nodos.appendChild(tit);
      let prevOn = true, prevX = xTronco;
      rama.nodos.forEach((n, ni) => {
        const es = estado(S, h, rama, n), r = HB.rg(S, n.id, h) || 0, cx = Math.round(xDe(ni));
        const el = document.createElement('div'); el.className = `ar-nodo ${es}${selR === ri && selI === ni && !baseSel ? ' sel' : ''}`;
        el.style.left = cx + 'px'; el.style.top = cy + 'px'; el.title = n.n;
        const ic = (window.CK_ICONOS_HEROE && window.CK_ICONOS_HEROE[n.ic]) || HB.icono(n.ic, rama.color);
        const j = n.tipo === 'a' ? ranuras.indexOf(n.id) : -1;
        el.innerHTML = `<div class="aura"></div><img src="${ic}" alt=""><div class="mk" style="background-image:url('${ARTE['nodo_' + a + '_' + MARCO[es]]}')"></div>` +
          `<div class="pips">${Array.from({ length: n.max }, (_, k) => `<i class="${k < r ? 'v' : ''}"></i>`).join('')}</div>` +
          (es === 'cerrado' ? `<span class="req">${n.req}</span>` : '') + (j >= 0 ? `<span class="tk">${TECLAS[j]}</span>` : '') +
          (n.tipo === 'a' && es !== 'cerrado' && !r ? '<span class="nueva">NUEVA</span>' : '') + '<div class="aro"></div><div class="flash"></div>';
        const hid = w.querySelector(`.hb-nodo[data-r="${ri}"][data-i="${ni}"]`);
        el.onclick = () => { const b = w.querySelector('.hb-base.sel'); if (b) b.click(); if (hid) hid.click(); };
        el.ondblclick = () => { if (hid && hid.ondblclick) hid.ondblclick(); };
        const k = h + ':' + n.id;
        if (ultRangos[k] !== undefined && r > ultRangos[k]) { el.classList.add('subio'); chispas(el, es === 'completo' ? 16 : 10); }
        ultRangos[k] = r;
        nodos.appendChild(el);
        lineas.push({ x0: ni === 0 ? xTronco : prevX + T_ / 2, y0: cy, x1: cx - T_ / 2, y1: cy, on: r > 0 && prevOn });
        prevOn = r > 0; prevX = cx;
      });
    });
    // las líneas, en el lienzo
    const cv = ar.querySelector('.ar-lienzo'); cv.width = W; cv.height = Hh; cv._lineas = lineas; cv._color = T.linea;
    dibujarLineas(cv, performance.now());
    // la ficha de la derecha
    const ficha = ar.querySelector('.ar-ficha');
    let sel = null;
    if (baseSel) { const d = EQ.def(h, baseSel); sel = { n: d.n, rama: 'De base', d: d.d, es: 'completo', equipable: true, id: baseSel }; }
    else { const rama = ramas[selR], n = rama && rama.nodos[selI]; if (n) { const r = HB.rg(S, n.id, h) || 0, es = estado(S, h, rama, n); sel = { n: n.n, rama: rama.nombre, d: n.d(Math.max(1, r)), sig: r < n.max && r > 0 ? n.d(r + 1) : '', es, r, max: n.max, req: n.req, equipable: n.tipo === 'a' && r > 0, id: n.id, nueva: n.tipo === 'a' }; } }
    if (sel) {
      ficha.innerHTML = `<h4>${sel.n}${sel.nueva ? ' <small style="font-size:10px;letter-spacing:1px;color:#fff;background:#7a2418;padding:0 3px;vertical-align:3px">NUEVA</small>' : ''}</h4><div class="rama">${sel.rama}${sel.max ? ` · rango ${sel.r}/${sel.max}` : ''}</div><p>${sel.d}</p>` +
        (sel.sig ? `<p class="sig">Siguiente rango: ${sel.sig}</p>` : '') + (sel.es === 'cerrado' ? `<p class="cand">Se abre con ${sel.req} punto${sel.req > 1 ? 's' : ''} en ${sel.rama}.</p>` : '') +
        (sel.equipable ? `<p class="sig">Apretá <b>Q, E, R o F</b> (o tocá una ranura) para ponerla ahí.</p>` : '');
    } else ficha.innerHTML = '<p>Elegí un nodo del árbol.</p>';
    // las ranuras
    const ran = ar.querySelector('.ar-ran'), PRO = window.CK_PROGRESO, lista = !!(sel && sel.equipable);
    ran.querySelector('.t').textContent = lista ? 'Poner ' + sel.n + ' en:' : 'Ranuras';
    ran.querySelector('.cuerpo').innerHTML = ranuras.map((id, i) => {
      const bl = PRO && !pr && PRO.bloqueado && PRO.bloqueado(S, TECLAS[i].toLowerCase()), nv = bl && PRO.NIVEL ? PRO.NIVEL[TECLAS[i].toLowerCase()] : '';
      return `<div class="ar-r${lista ? ' lista' : ''}${id ? '' : ' vacia'}${bl && !id ? ' bloq' : ''}" data-i="${i}" data-nv="Nv ${nv}" title="${id ? (EQ.def(h, id) || {}).n : 'Vacía'}"><div class="fo"></div>${id ? `<img src="${EQ.icono(h, id)}" alt="">` : ''}<b>${TECLAS[i]}</b></div>`;
    }).join('');
    ran.querySelectorAll('.ar-r').forEach(el => el.onclick = () => {
      if (!sel || !sel.equipable) return;
      EQ.poner(S, +el.dataset.i, sel.id); try { sfx.fx('ui_click', 0.6); } catch (e) {}
      const b = w.querySelector('.hb-base.sel'); if (b) b.click(); else HB.pintar(S);
      setTimeout(() => { const q = ar.querySelector(`.ar-r[data-i="${el.dataset.i}"]`); if (q) q.classList.add('puso'); }, 20);
    });
    // textos cortos para la grilla de botones (la ventana vieja los vuelve a poner largos en cada pintada)
    w.querySelectorAll('.ar-bot button').forEach(b => {
      const t = b.textContent;
      if (b.classList.contains('hb-reset')) b.textContent = t.replace('Devolver puntos', 'Devolver');
      else if (b.classList.contains('hb-llena')) b.textContent = 'Llenar rama';
      else if (b.classList.contains('ck-close')) b.textContent = 'Cerrar (H)';
      else if (b.classList.contains('hb-bajar')) b.textContent = 'Quitar uno';
    });
    ar.querySelector('.ar-ayuda').textContent = pr ? 'Flechas: elegir · Enter: subir · Retroceso: quitar · H o Esc: cerrar' : 'Flechas: elegir · Enter: aprender · H: cerrar';
    const claveSel = h + '|' + (baseSel || selR + ',' + selI);
    if (claveSel !== ultSel) { ultSel = claveSel; }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(animar);
  };
  const dibujarLineas = (cv, t) => {
    const g = cv.getContext('2d'), L = cv._lineas || []; g.clearRect(0, 0, cv.width, cv.height);
    L.forEach(l => {
      g.beginPath(); g.moveTo(l.x0, l.y0);
      if (l.tronco) { const ym = l.y0 + 14; g.lineTo(l.x0, ym); g.lineTo(l.x1, ym); }
      g.lineTo(l.x1, l.y1);
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.6)'; g.setLineDash([]); g.stroke();
      g.lineWidth = 2; g.strokeStyle = l.on ? cv._color : 'rgba(255,236,200,.18)'; g.stroke();
      if (l.on) { g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.85)'; g.setLineDash([3, 9]); g.lineDashOffset = -(t / 40) % 12; g.stroke(); g.setLineDash([]); }
    });
  };
  const animar = t => { const w = win(); if (!w || !w.classList.contains('on') || !ar) return; const cv = ar.querySelector('.ar-lienzo'); if (cv) dibujarLineas(cv, t); raf = requestAnimationFrame(animar); };

  // ------------------------------------------------------------------ engancharse a la ventana vieja
  const tg0 = P.toggleHabilidades;
  P.toggleHabilidades = function () {
    const r = tg0.apply(this, arguments);
    try {
      const w = win();
      if (w && !w._ckArbol) {
        w._ckArbol = true;
        const S = this;
        new MutationObserver(() => { if (w._ckArPint) return; w._ckArPint = true; try { pintar(window.activeGameScene || S); } finally { w._ckArPint = false; } })
          .observe(w.querySelector('.hb-cols'), { childList: true });
        new MutationObserver(() => { if (w._ckArPint) return; w._ckArPint = true; try { pintar(window.activeGameScene || S); } finally { w._ckArPint = false; } })
          .observe(w, { attributes: true, attributeFilter: ['class'] });
        addEventListener('resize', () => { if (w.classList.contains('on')) pintar(window.activeGameScene || S); });
      }
      if (w && w.classList.contains('on')) { ultRangos = {}; const A = ARBOL[this.playerHero]; if (A) A.ramas.forEach(rm => rm.nodos.forEach(n => { ultRangos[this.playerHero + ':' + n.id] = HB.rg(this, n.id, this.playerHero) || 0; })); pintar(this); }
    } catch (e) { console.warn('[arbol]', e); }
    return r;
  };
  window.CK_ARBOL = { pintar, estado };
})();
