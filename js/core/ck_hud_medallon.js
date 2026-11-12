'use strict';
/* HUD "Medallón de rol" (11/11, pedido del dueño después de ver las 10 muestras: "me gusta el UI 10 con el mapa del 04
   pero en la posición del 10, también que el UI tenga detalles no muy cargados del personaje que estemos usando").
   Reacomoda lo que ya había (ck_hud_heroe.js + ck_hud_tema.js + ck_hud_simple.js, ck_minimapa.js, ck_reloj.js): no dibuja
   nada nuevo ni cambia datos, sólo mueve las piezas y les cambia el estilo.
   - ABAJO AL CENTRO: el medallón del héroe (su marco de siempre, con el retrato vivo) y, pegadas a los lados, la VIDA
     (izquierda) y el recurso (derecha) como dos barras paradas, con el número arriba y el ícono abajo. Debajo, el nombre
     y el nivel. A la izquierda del medallón las habilidades Q y E; a la derecha, R y F.
   - ABAJO A LA DERECHA: los objetos (C Z X L) y arriba de ellos las monedas.
   - ARRIBA A LA IZQUIERDA: el mapa REDONDO (el "astrolabio" de la muestra 04): el héroe queda siempre en el centro, un aro
     con marcas, y debajo el nombre del lugar con la tecla M. Los botones + − ◎ van en las esquinas.
   - ARRIBA AL CENTRO: la hora (el reloj de sol, cuando se tiene). ARRIBA A LA DERECHA: el objetivo, con letra más grande.
   - Detalles del héroe, livianos: el color de cada uno (Lancent dorado, Aby rosa, Horos violeta, el oso celeste) va en el aro
     del mapa, el borde de las barras, el brillo de las habilidades y el nivel; el recurso se llena con su color y su ícono.
   - En el celular queda sólo el medallón con las barras, chico, abajo al centro (los botones los pone ck_movil.js), y la
     hora va debajo del mapa porque arriba al centro están los botones del celular.
   Borrar su línea de index.html vuelve a la barra de abajo al centro de antes. */
(function () {
  if (typeof document === 'undefined') return;
  const HUD = window.CK_HUD_HEROE;
  if (!HUD || !HUD.caja || !window.CK_HUD_SIMPLE) return;
  const caja = HUD.caja;
  const med = caja.querySelector('.med'), der = caja.querySelector('.der'), placa = caja.querySelector('.placa'),
    abajo = caja.querySelector('.ckS-abajo'), mon = caja.querySelector('.ckS-mon'), habs = [...caja.querySelectorAll('.ran.hab')];
  if (!med || !der || !placa || !abajo || habs.length < 4) return;
  const tbV = placa.querySelector('.tb.vida'), tbR = placa.querySelector('.tb.rec');
  if (!tbV || !tbR) return;

  // ------------------------------------------------------------------ las piezas, en su lugar nuevo
  const D = (c, h) => { const e = document.createElement('div'); e.className = c; if (h) e.innerHTML = h; return e; };
  const grupo = D('ckM-grupo'), izq = D('ckM-izq'), dch = D('ckM-der'), centro = D('ckM-centro'), cuerpo = D('ckM-cuerpo'),
    caj = D('ckM-med'), chapa = D('ckM-chapa', '<span class="nom"></span><i></i><span class="niv"></span>');
  izq.append(habs[0], habs[1]);
  dch.append(habs[2], habs[3]);
  caj.append(med);
  cuerpo.append(caj, placa);                 // la placa (con sus dos barras) queda como capa sobre el medallón
  centro.append(cuerpo, chapa);
  grupo.append(izq, centro, dch);
  caja.insertBefore(grupo, caja.firstChild);
  caja.append(abajo);                        // objetos y monedas: sueltos, abajo a la derecha
  if (mon) abajo.insertBefore(mon, abajo.firstChild);
  const nV = D('ckM-n'), nR = D('ckM-n');    // el número arriba de cada barra
  tbV.append(nV); tbR.append(nR);
  caja.classList.add('medallon');
  document.body.classList.add('ck-medallon');

  const css = `
/* ---- la caja ocupa todo el ancho de abajo; cada pieza se acomoda sola ---- */
#ckh.simple.medallon { left: 0 !important; right: 0; bottom: 8px; transform: none; gap: 0; justify-content: center; }
#ckh.simple.medallon > .der { display: none !important; }
#ckh.medallon .ckM-grupo { display: flex; align-items: flex-end; gap: 16px; }
#ckh.medallon .ckM-izq, #ckh.medallon .ckM-der { display: flex; align-items: flex-end; gap: 9px; padding-bottom: 34px; }
#ckh.medallon .ckM-centro { display: flex; flex-direction: column; align-items: center; gap: 5px; }
#ckh.medallon .ckM-cuerpo { position: relative; width: 190px; height: 124px; }
/* el medallón: el mismo marco del héroe, más chico (con "scale" aparte, así los golpes y el latido lo siguen moviendo) */
#ckh.medallon .ckM-med { position: absolute; left: 33px; top: 0; width: 124px; height: 124px; }
#ckh.simple.medallon .med { position: absolute; left: 0; top: 0; margin: 0; transform: none; transform-origin: 0 0; scale: .646; z-index: 2; }
#ckh.simple.medallon .med .niv { display: none; }
#ckh.medallon .ckM-med::before { content: ''; position: absolute; inset: 14px; border-radius: 50%; box-shadow: 0 0 22px 6px var(--ckS-glow, #ffd25a); opacity: .28; }
/* la placa ya no se ve: sólo sostiene las dos barras, ahora paradas */
#ckh.simple.medallon .placa { position: absolute; inset: 0; order: 0; display: block !important; width: auto; height: auto; background: none !important; filter: none; pointer-events: none; }
#ckh.simple.medallon .placa .tb { top: 22px !important; bottom: 4px; left: auto !important; width: 20px !important; height: auto; box-sizing: border-box;
  background: #140c10; border: 3px solid #0b0607; border-radius: 10px 10px 3px 3px; box-shadow: 0 0 0 2px var(--ckM-aro, #7a5a2c), 0 3px 4px rgba(0,0,0,.55); }
#ckh.simple.medallon .placa .tb.vida { left: 4px !important; }
#ckh.simple.medallon .placa .tb.rec { left: auto !important; right: 4px; top: 22px !important; height: auto; }
#ckh.simple.medallon .placa .tb .ll { left: 0; right: 0; top: 0; bottom: 0; border-radius: 7px 7px 1px 1px; clip-path: inset(var(--vacio, 0%) 0 0 0);
  background: linear-gradient(180deg, #ff8a78 0%, #e0382c 38%, #8f1a16 100%) !important; }
#ckh.simple.medallon .placa .tb .ll::after { content: ''; position: absolute; left: 2px; top: 3px; bottom: 3px; width: 3px; background: rgba(255,255,255,.28); border-radius: 2px; }
#ckh.simple.medallon .placa .tb .ll.at { background: #f3ead9 !important; }
#ckh.simple.medallon .placa .tb .ll.at::after { display: none; }
#ckh.simple.medallon .placa .tb.rec .ll { background: linear-gradient(180deg, var(--ckM-r1, #fff0a8) 0%, var(--ckM-r2, #e0a020) 42%, var(--ckM-r3, #8a5a10) 100%) !important; }
#ckh.simple.medallon .placa .tb .tx { display: none; }
#ckh.medallon .ckM-n { position: absolute; left: 50%; bottom: calc(100% + 4px); transform: translateX(-50%); white-space: nowrap; font-weight: 700; font-size: 16px; line-height: 1;
  color: #fff; text-shadow: 0 2px 0 #000, 0 0 4px #000, 0 0 2px #000; letter-spacing: .5px; }
#ckh.simple.medallon .placa .tb .ic { left: 50%; top: calc(100% + 6px); width: 20px; height: 20px; transform: translateX(-50%); background-position: 50% 50%; filter: drop-shadow(0 2px 0 #000); }
/* nombre · nivel, debajo del medallón */
#ckh.medallon .ckM-chapa { display: flex; align-items: baseline; gap: 6px; padding: 1px 12px 2px; background: rgba(16,11,12,.88); border: 2px solid #0b0607;
  box-shadow: inset 0 0 0 1px var(--ckM-aro, #7a5a2c), 0 3px 4px rgba(0,0,0,.5); white-space: nowrap; }
#ckh.medallon .ckM-chapa .nom { font-weight: 700; font-size: 18px; color: #f3ead9; letter-spacing: .5px; text-shadow: 0 2px 0 #000; }
#ckh.medallon .ckM-chapa i { width: 5px; height: 5px; background: var(--ckS-glow, #ffd25a); transform: rotate(45deg) translateY(-3px); }
#ckh.medallon .ckM-chapa .niv { font-weight: 700; font-size: 16px; color: var(--ckS-glow, #ffd25a); text-shadow: 0 1px 0 #000; }
/* habilidades: las de siempre, con la tecla más grande y un brillo del color del héroe cuando están listas */
#ckh.simple.medallon .ran.hab b { bottom: -15px; width: 34px; height: 24px; line-height: 23px; font-size: 17px; }
#ckh.simple.medallon .ran.hab:not(.vacia):not(.ck-bloq):not(.sin)::before { content: ''; position: absolute; inset: 7px; box-shadow: 0 0 12px 2px var(--ckS-glow, #ffd25a); opacity: .45; pointer-events: none; }
#ckh.simple.medallon .ran.hab .seg { font-size: 24px; }
/* objetos y monedas, abajo a la derecha */
#ckh.simple.medallon .ckS-abajo { position: absolute; right: 12px; bottom: 2px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; padding: 0; }
#ckh.simple.medallon .items { gap: 7px; }
#ckh.simple.medallon .ran.it { width: 48px; height: 48px; }
#ckh.simple.medallon .ran.it img, #ckh.simple.medallon .ran.it .cd { left: 4px; top: 4px; width: 36px; height: 36px; }
#ckh.simple.medallon .ran.it b { min-width: 18px; height: 18px; line-height: 17px; font-size: 14px; top: -9px; right: -6px; color: #ffe9a8; }
#ckh.simple.medallon .ran.it span.n { right: 3px; bottom: 0; font-size: 16px; }
#ckh.simple.medallon .ckS-mon { margin: 0; padding: 1px 10px 2px 8px; font-size: 18px; background: rgba(16,11,12,.88); border: 2px solid #0b0607; box-shadow: inset 0 0 0 1px #7a5a2c; }
#ckh.simple.medallon .estados { left: 50%; transform: translateX(-50%); bottom: calc(100% + 10px); }
/* los carteles de abajo suben o bajan a la altura nueva */
body.ck-medallon:not(.ck-movil) #ck-prompt { bottom: 178px !important; }
body.ck-medallon:not(.ck-movil) #ck-nota { bottom: 216px !important; }
body.ck-medallon:not(.ck-movil) #ck-ayuda { bottom: 252px !important; }

/* ---- el mapa redondo, arriba a la izquierda ---- */
body.ck-medallon #ck-minimapa.redondo { left: 12px !important; top: 12px !important; width: 156px !important; padding: 0 !important; border: 0 !important; border-image: none !important;
  background: none !important; box-shadow: none !important; display: flex; flex-direction: column-reverse; align-items: center; gap: 7px; }
#ck-minimapa.redondo .ckm-vista { width: 148px; height: 148px; border: 0; box-shadow: none; background: radial-gradient(circle, #0b0a0e 0 73px, transparent 74px) !important; }
#ck-minimapa.redondo canvas { width: 148px; height: 148px; clip-path: circle(72px at 50% 50%); }
#ck-minimapa.redondo .ckm-vista::after { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; border: 3px solid #0b0607;
  box-shadow: 0 0 0 3px #2c2018, 0 0 0 5px var(--ckM-glow, #ffd25a), 0 5px 10px 4px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,236,200,.18), inset 0 0 18px 4px rgba(0,0,0,.6); }
#ck-minimapa.redondo .ckm-vista::before { content: ''; position: absolute; inset: 3px; z-index: 1; border-radius: 50%; pointer-events: none; opacity: .7;
  background: repeating-conic-gradient(from -1.5deg, rgba(255,236,200,.9) 0 3deg, transparent 3deg 30deg);
  -webkit-mask: radial-gradient(circle, transparent 0 64px, #000 64px 70px, transparent 70px); mask: radial-gradient(circle, transparent 0 64px, #000 64px 70px, transparent 70px); }
body.ck-medallon #ck-minimapa.redondo .ckm-cab { margin: 0; gap: 8px; padding: 1px 4px 2px 10px; max-width: 190px; font-size: 16px !important; letter-spacing: .5px;
  background: rgba(16,11,12,.88) !important; border: 2px solid #0b0607; box-shadow: inset 0 0 0 1px var(--ckM-aro, #7a5a2c), 0 3px 4px rgba(0,0,0,.5); }
body.ck-medallon #ck-minimapa.redondo .ckm-cab b { font-weight: 700; font-size: 14px; padding: 0 6px; cursor: pointer; }
#ck-minimapa.redondo .ckm-bot { position: static; display: block; }
body.ck-medallon #ck-minimapa.redondo .ckm-bot button { position: absolute; z-index: 2; width: 22px; height: 22px; box-sizing: border-box; font-size: 15px !important; font-weight: 700; padding: 0 !important; line-height: 16px;
  color: #ffe9a8 !important; background: #1a1214 !important; border: 2px solid #0b0607 !important; border-image: none !important; box-shadow: inset 0 0 0 1px var(--ckM-aro, #7a5a2c), 0 2px 3px rgba(0,0,0,.5) !important; }
#ck-minimapa.redondo .ckm-bot button[data-z="1"] { right: -3px; top: -3px; }
#ck-minimapa.redondo .ckm-bot button[data-z="-1"] { right: -3px; bottom: -3px; }
#ck-minimapa.redondo .ckm-bot button[data-z="0"] { left: -3px; bottom: -3px; }

/* ---- la hora, arriba al centro ---- */
body.ck-medallon #ck-reloj { left: 50% !important; top: 10px !important; transform: translateX(-50%); max-width: 300px; padding: 4px 14px 5px 8px; gap: 9px; }
body.ck-medallon #ck-reloj b { font-size: 21px; white-space: nowrap; }
body.ck-medallon #ck-reloj b small { font-size: 16px; }
body.ck-medallon #ck-reloj span { font-size: 14px; white-space: nowrap; }
body.ck-cine #ck-reloj, body.ck-escena #ck-reloj { opacity: 0 !important; transition: opacity .3s !important; }

/* ---- el objetivo, arriba a la derecha: letra más grande ---- */
body.ck-medallon.ck-medallon #ck-objective .ck-obj-head { font-size: 15px !important; }
body.ck-medallon.ck-medallon #ck-objective .ck-obj-text { font-size: 16px !important; line-height: 1.2 !important; }
body.ck-medallon.ck-medallon #ck-objective .ck-obj-purse { font-size: 13px !important; }

/* ---- pantallas angostas: todo el grupo de abajo se achica un poco ---- */
@media (max-width: 1100px) {
  #ckh.medallon .ckM-grupo { scale: .88; transform-origin: 50% 100%; }
  #ckh.simple.medallon .ckS-abajo { scale: .88; transform-origin: 100% 100%; }
  body.ck-medallon:not(.ck-movil) #ck-prompt { bottom: 160px !important; }
  body.ck-medallon:not(.ck-movil) #ck-nota { bottom: 198px !important; }
  body.ck-medallon:not(.ck-movil) #ck-ayuda { bottom: 234px !important; }
}
@media (max-width: 880px) {
  #ckh.medallon .ckM-grupo { scale: .76; }
  #ckh.simple.medallon .ckS-abajo { scale: .76; }
}
/* ---- celular: sólo el medallón con sus barras, abajo a la izquierda ---- */
body.ck-movil #ckh.simple.medallon { left: 0 !important; right: 0; bottom: 2px !important; transform: none !important; justify-content: center; }
body.ck-movil #ckh.medallon .ckM-izq, body.ck-movil #ckh.medallon .ckM-der, body.ck-movil #ckh.simple.medallon .ckS-abajo { display: none !important; }
body.ck-movil #ckh.medallon .ckM-grupo { scale: .6; transform-origin: 50% 100%; }
/* en el celular arriba al centro están los botones (libro, mapa, pausa): la hora va debajo del mapa */
body.ck-movil.ck-medallon #ck-reloj { left: 8px !important; top: 154px !important; transform: none; scale: .7; transform-origin: 0 0; }
`;
  const st = document.createElement('style'); st.id = 'ckM-css'; st.textContent = css; document.head.append(st);

  // ------------------------------------------------------------------ los detalles de cada héroe (color y recurso)
  const TONO = {
    soldier: { glow: '#ffd25a', aro: '#8a6a2c', r: ['#fff0a8', '#e8ac28', '#8a5a10'] },     // Lancent: aguante dorado
    swordsman: { glow: '#ff7a9a', aro: '#8a3048', r: ['#c8ffd8', '#3ad07a', '#126a3a'] },   // Aby: filo verde, borde rosa
    wizard: { glow: '#c49bff', aro: '#5a4a9a', r: ['#e0f4ff', '#5a9cff', '#3a2a9a'] },      // Horos: maná azul violáceo
    bear: { glow: '#9fe0ff', aro: '#4a7a92', r: ['#ffe0b0', '#ff8a2a', '#8a3a0a'] }         // el oso: furia naranja, borde de hielo
  };
  const ESCENA = () => window.activeGameScene || (window.game && window.game.scene && window.game.scene.scenes.find(s => s.startCampaign));
  const nom = chapa.querySelector('.nom'), niv = chapa.querySelector('.niv');
  let ult = '', ultV = '', ultR = '', mapaListo = false;

  // el mapa redondo: la clase la lee ck_minimapa.js (deja al héroe siempre en el centro) y el lienzo pasa a ser cuadrado
  const mapa = () => {
    const m = document.getElementById('ck-minimapa'); if (!m) return;
    if (!m.classList.contains('redondo')) m.classList.add('redondo');
    const cv = m.querySelector('canvas');
    if (cv && (cv.width !== 148 || cv.height !== 148)) { cv.width = 148; cv.height = 148; }
    mapaListo = true;
  };

  const cuadro = () => {
    try {
      const S = ESCENA();
      if (!mapaListo || !document.querySelector('#ck-minimapa.redondo')) mapa();
      if (S && S.player && caja.classList.contains('on')) {
        const h = S.playerHero || 'soldier', a = TONO[h] ? h : 'soldier', T = TONO[a], s = S.story || {};
        const clave = [h, s.level, S._gameMode].join('|');
        if (clave !== ult) {
          ult = clave;
          const Dh = (typeof HEROES !== 'undefined' && HEROES[h]) || {};
          nom.textContent = Dh.name ? Dh.name.charAt(0) + Dh.name.slice(1).toLowerCase() : '';
          niv.textContent = S._gameMode === 'campaign' ? 'Niv. ' + (s.level || 1) : 'Práctica';
          caja.style.setProperty('--ckM-aro', T.aro);
          caja.style.setProperty('--ckM-r1', T.r[0]); caja.style.setProperty('--ckM-r2', T.r[1]); caja.style.setProperty('--ckM-r3', T.r[2]);
          document.body.style.setProperty('--ckM-glow', T.glow);
          document.body.style.setProperty('--ckM-aro', T.aro);
          caja.dataset.heroe = a;
        }
        // los números de las barras: la vida entera ("3/3"), del recurso sólo lo que queda
        const v = (tbV.querySelector('.tx').textContent || '').replace(/\s+/g, ''), r = (tbR.querySelector('.tx').textContent || '').split('/')[0].trim();
        if (v !== ultV) { ultV = v; nV.textContent = v; }
        if (r !== ultR) { ultR = r; nR.textContent = r; }
      }
    } catch (e) {}
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_HUD_MEDALLON = { caja, TONO };
})();
