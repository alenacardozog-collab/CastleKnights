'use strict';
/* Barra del héroe más simple, estilo Dota 2 llevado al nuestro (11/11, pedido del dueño: "me gusta la UI de los personajes
   pero simplificalas un poco más manteniendo la esencia que les diste; que se vean bien las habilidades, que muestre más
   que nada los poderes, y abajo las pociones y eso en otro estilo de UI más simple, como los de Dota 2 pero llevado al
   estilo que tenemos").
   Va encima de ck_hud_heroe.js + ck_hud_tema.js (usa su misma caja #ckh, sus marcos, el retrato vivo y los datos):
   - Abajo al CENTRO, como en Dota: a la izquierda el retrato con el marco de cada héroe (más chico, sigue vivo: golpes,
     grietas, sangre, brillo de las ultis); a la derecha, arriba, las 4 HABILIDADES grandes (Q E R F) con el marco del
     héroe, la espera que baja y la tecla; debajo, la VIDA y el recurso en dos barras finas con el ícono del héroe;
     y abajo de todo los OBJETOS (bloqueo C, poción Z, elixir X, antorcha L) en cuadritos oscuros simples, más chicos.
   - El nombre y el nivel van chiquitos sobre las habilidades; las monedas a la derecha de los objetos.
   - En el celular (ck_movil.js) se achica todo (clase body.ck-movil).
   Borrar la línea de index.html vuelve a la barra anterior. */
(function () {
  if (typeof document === 'undefined') return;
  const HUD = window.CK_HUD_HEROE;
  if (!HUD || !HUD.caja) return;
  const caja = HUD.caja;
  const der = caja.querySelector('.der'), fila = caja.querySelector('.fila'), items = caja.querySelector('.items'),
    placa = caja.querySelector('.placa'), med = caja.querySelector('.med');
  if (!der || !fila || !items || !placa || !med) return;

  // cabecera chiquita (nombre · nivel) arriba de las habilidades, y las monedas al lado de los objetos
  const cab = document.createElement('div'); cab.className = 'ckS-cab';
  cab.innerHTML = '<span class="nom"></span><span class="niv"></span>';
  const abajo = document.createElement('div'); abajo.className = 'ckS-abajo';
  const mon = document.createElement('div'); mon.className = 'ckS-mon'; mon.innerHTML = '<i></i><span></span>';
  der.insertBefore(cab, der.firstChild);
  items.parentNode.removeChild(items);
  abajo.append(items, mon);
  der.appendChild(abajo);
  caja.classList.add('simple');

  const css = `
#ckh.simple { left: 50% !important; transform: translateX(-50%); bottom: 8px; gap: 2px; }
#ckh.simple.on { align-items: flex-end; }
/* el retrato: el mismo medallón del héroe, más chico */
#ckh.simple .med { transform: scale(.62); transform-origin: 0 100%; margin: -73px -73px 0 0; z-index: 2; }
#ckh.simple .med .niv { display: none; }
#ckh.simple .der { gap: 3px; padding: 6px 10px 6px 12px; background: linear-gradient(180deg, rgba(14,10,12,.0) 0%, rgba(14,10,12,.72) 22%, rgba(10,7,9,.86) 100%);
  border-radius: 10px 10px 4px 4px; box-shadow: inset 0 1px 0 rgba(255,236,200,.08); }
#ckh.simple .ckS-cab { display: flex; align-items: baseline; gap: 8px; height: 20px; padding-left: 2px; }
#ckh.simple .ckS-cab .nom { font-weight: 700; font-size: 18px; color: #f3ead9; text-shadow: 0 2px 0 #000; letter-spacing: .5px; }
#ckh.simple .ckS-cab .niv { font-weight: 700; font-size: 14px; color: var(--ckS-glow, #ffd25a); text-shadow: 0 1px 0 #000; }
/* habilidades: grandes, con el marco del héroe */
#ckh.simple .fila { order: 1; margin: 0; padding-bottom: 10px; gap: 6px; }
#ckh.simple .fila .sep { display: none; }
#ckh.simple .ran.hab { width: 74px; height: 74px; }
#ckh.simple .ran.hab img, #ckh.simple .ran.hab .cd, #ckh.simple .ran.hab.vacia::after { left: 7px; top: 7px; width: 60px; height: 60px; }
#ckh.simple .ran.hab .seg { top: 22px; font-size: 22px; }
#ckh.simple .ran.hab b { bottom: -10px; }
/* vida y recurso: dos barras finas, sin la placa grande */
#ckh.simple .placa { order: 2; display: block !important; width: 314px; height: 34px; background: none !important; filter: none; }
#ckh.simple .placa .nom, #ckh.simple .placa .mon { display: none !important; }
#ckh.simple .placa .tb { left: 22px !important; width: 292px !important; height: 14px; }
#ckh.simple .placa .tb.vida { top: 1px !important; }
#ckh.simple .placa .tb.rec { top: 19px !important; height: 11px; }
#ckh.simple .placa .tb .ic { width: 16px; height: 16px; }
#ckh.simple .placa .tb .tx { font-size: 12px; }
#ckh.simple .placa .tb.rec .tx { font-size: 10px; }
/* objetos: otro estilo, simple y chico */
#ckh.simple .ckS-abajo { order: 3; display: flex; align-items: center; gap: 10px; padding-top: 2px; }
#ckh.simple .items { gap: 5px; }
#ckh.simple .ran.it { width: 40px; height: 40px; background: linear-gradient(180deg, #2a2226, #151013) !important; border: 2px solid #4a3b33; border-radius: 6px;
  box-sizing: border-box; filter: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.6), 0 2px 3px rgba(0,0,0,.5); }
#ckh.simple .ran.it img, #ckh.simple .ran.it .cd { left: 2px; top: 2px; width: 32px; height: 32px; }
#ckh.simple .ran.it b { left: auto; right: -5px; bottom: auto; top: -7px; transform: none; width: auto; min-width: 14px; height: 14px; line-height: 14px; padding: 0 3px;
  background: #0e0a0b !important; border: 1px solid #5a4a40; border-radius: 3px; font-size: 11px; }
#ckh.simple .ran.it span.n { right: 2px; bottom: 0; font-size: 13px; }
#ckh.simple .ran.it .tor { left: 3px; right: 3px; top: 2px; height: 3px; }
#ckh.simple .ran.it.prendida::before { inset: -3px; }
#ckh.simple .ckS-mon { display: flex; align-items: center; gap: 4px; margin-left: auto; font-weight: 700; font-size: 16px; color: #ffe08a; text-shadow: 0 2px 0 #000; }
#ckh.simple .ckS-mon i { width: 14px; height: 14px; background: radial-gradient(circle at 40% 35%, #fff3b0 0 20%, #f0c040 22% 60%, #9a6a10 62% 100%); border: 2px solid #1b0f0a; border-radius: 50%; box-sizing: border-box; }
#ckh.simple.practica .ckS-abajo { display: none; }
#ckh.simple .estados { left: 50%; transform: translateX(-50%); }
/* teclas del mando (ck_gamepad.js): la letra cambia por el botón */
#ckh.simple .ran b.pad { color: #fff; }
/* celular: más chico */
/* (el celular lo acomoda ck_movil.js) */
`;
  const st = document.createElement('style'); st.id = 'ckS-css'; st.textContent = css; document.head.append(st);

  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const GLOW = { soldier: '#ffd25a', swordsman: '#ff7a9a', wizard: '#c49bff', bear: '#9fe0ff' };
  let ult = '';
  const cuadro = () => {
    try {
      const S = ESCENA();
      if (S && S.player && caja.classList.contains('on')) {
        const s = S.story || {}, h = S.playerHero || 'soldier', a = GLOW[h] ? h : 'soldier';
        const D = (typeof HEROES !== 'undefined' && HEROES[h]) || {};
        const nom = D.name ? D.name.charAt(0) + D.name.slice(1).toLowerCase() : '';
        const clave = [nom, s.level, s.coins, S._gameMode, a].join('|');
        if (clave !== ult) {
          ult = clave;
          cab.querySelector('.nom').textContent = nom;
          cab.querySelector('.niv').textContent = S._gameMode === 'campaign' ? 'Niv. ' + (s.level || 1) : 'Práctica';
          mon.querySelector('span').textContent = s.coins || 0;
          mon.style.display = S._gameMode === 'campaign' ? '' : 'none';
          caja.style.setProperty('--ckS-glow', GLOW[a]);
          caja.querySelectorAll('.ran.it').forEach(r => { r.style.borderColor = ''; });
        }
      }
    } catch (e) {}
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_HUD_SIMPLE = { caja };
})();
