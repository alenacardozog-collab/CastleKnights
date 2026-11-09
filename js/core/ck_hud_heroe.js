'use strict';
/* Barra del héroe (03/11, pedido del dueño: "los íconos de las cosas que usa el jugador están raros, los cuadros de
   selección parecen un png mal recortado, la vida y el maná están alejados; quiero que la UI venga con diseño y referente
   al personaje que estamos jugando").
   - Abajo a la izquierda, todo junto: el retrato del héroe en un medallón de piedra con el metal y las gemas de su color,
     su nombre y nivel, la vida y el recurso (aguante de Lancent y Aby, maná de Horos, furia del Oso) en dos barras
     pegadas, las monedas, y debajo la fila de ranuras: Q E R F (habilidades equipadas, ck_habilidades_equipo.js) y
     C (bloquear), Z (poción), X (elixir), L (antorcha).
   - Cada héroe tiene su juego de marcos: Lancent acero azul con oro, Aby rosa con rubíes, Horos violeta con zafiros,
     el Oso madera y ámbar. Íconos de PixelLab (ck_hud_heroe_arte.js), todos del mismo estilo.
   - Las ranuras muestran la espera (se oscurecen de abajo para arriba) y se apagan si no alcanza el aguante/maná.
   Reemplaza los orbes, la barra rápida, la ranura R y la antorcha sueltas (siguen funcionando por debajo, sólo no se ven).
   Borrar las 2 líneas de index.html vuelve a la UI anterior. */
(function () {
  if (typeof document === 'undefined') return;
  const AR = window.CK_HUD_HEROE_ARTE, IC = window.CK_ICONOS_HEROE;
  if (!AR || !IC) return;
  const K = 2;
  const u = n => (AR[n] ? 'url("' + AR[n] + '")' : 'none');
  const HEROE = h => (h === 'swordsman' || h === 'wizard' || h === 'bear' ? h : 'soldier');
  const RECURSO = { soldier: 'Aguante', swordsman: 'Aguante', wizard: 'Maná', bear: 'Furia' };
  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));

  const css = `
body.ckh-on .ck2-orbe, body.ckh-on .ck2-nombre, body.ckh-on .ck2-monedas, body.ckh-on #ck-quick, body.ckh-on #ck-antorcha, body.ckh-on #ck-hab-r { display: none !important; }
#ckh { position: absolute; left: 10px; bottom: 10px; z-index: 41; pointer-events: none; display: none; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); image-rendering: pixelated; transition: opacity .2s; }
#ckh.on { display: flex; align-items: flex-end; gap: 8px; }
body.ck2-dlg #ckh { opacity: 0; }
#ckh .med { position: relative; width: ${78 * K}px; height: ${78 * K}px; flex: 0 0 auto; filter: drop-shadow(0 4px 4px rgba(0,0,0,.5)); }
#ckh .med .fondo { position: absolute; left: ${7 * K}px; top: ${7 * K}px; width: ${64 * K}px; height: ${64 * K}px; background: radial-gradient(circle at 50% 38%, var(--ckh-c2) 0%, var(--ckh-c1) 75%); }
#ckh .med img.cara { position: absolute; left: ${7 * K}px; top: ${7 * K}px; width: ${64 * K}px; height: ${64 * K}px; object-fit: cover; image-rendering: pixelated; }
#ckh .med .marco { position: absolute; inset: 0; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
#ckh .med .niv { position: absolute; left: 50%; bottom: -${4 * K}px; transform: translateX(-50%); min-width: ${30 * K}px; height: ${11 * K}px; line-height: ${11 * K}px; padding: 0 6px; box-sizing: border-box;
  background: 0 0 / 100% 100%; image-rendering: pixelated; text-align: center; font-weight: 700; font-size: 15px; color: #f3ead9; text-shadow: 0 2px 0 #000; white-space: nowrap; }
#ckh .der { display: flex; flex-direction: column; gap: 4px; padding-bottom: 2px; }
#ckh .cab { display: flex; align-items: baseline; gap: 10px; height: 22px; }
#ckh .cab .nom { font-weight: 700; font-size: 21px; color: #f3ead9; text-shadow: 0 2px 0 #000, 0 0 6px #000; letter-spacing: .5px; }
#ckh .cab .mon { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 18px; color: #ffe08a; text-shadow: 0 2px 0 #000, 0 0 4px #000; }
#ckh .cab .mon i { width: 18px; height: 18px; background: radial-gradient(circle at 40% 35%, #fff3b0 0 20%, #f0c040 22% 60%, #9a6a10 62% 100%); border: 2px solid #1b0f0a; border-radius: 50%; box-sizing: border-box; }
#ckh .barra { position: relative; width: ${142 * K}px; height: ${18 * K}px; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; }
#ckh .barra .llen { position: absolute; left: ${19 * K}px; top: ${6 * K}px; width: ${116 * K}px; height: ${6 * K}px; background: 0 0 / ${116 * K}px 100% no-repeat; image-rendering: pixelated; clip-path: inset(0 var(--vacio, 0%) 0 0); transition: clip-path .25s ease-out; }
#ckh .barra .llen.atras { background: #f3ead9; opacity: .55; transition: clip-path .6s ease-in .25s; }
#ckh .barra .txt { position: absolute; left: ${19 * K}px; width: ${116 * K}px; top: 0; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000, 0 0 2px #000; letter-spacing: .5px; }
#ckh .barra.baja .llen:not(.atras) { animation: ckhLate .8s ease-in-out infinite; }
@keyframes ckhLate { 50% { filter: brightness(1.6); } }
#ckh .fila { display: flex; gap: 6px; align-items: flex-start; margin-top: 4px; padding-bottom: 12px; }
#ckh .fila .sep { width: 10px; }
#ckh .ran { position: relative; width: ${38 * K}px; height: ${38 * K}px; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; filter: drop-shadow(0 3px 2px rgba(0,0,0,.5)); }
#ckh .ran img { position: absolute; left: ${3 * K}px; top: ${3 * K}px; width: ${32 * K}px; height: ${32 * K}px; image-rendering: pixelated; }
#ckh .ran .cd { position: absolute; left: ${3 * K}px; top: ${3 * K}px; width: ${32 * K}px; height: ${32 * K}px; background: rgba(8, 5, 10, .72); transform-origin: bottom; transform: scaleY(var(--cd, 0)); }
#ckh .ran .seg { position: absolute; left: 0; right: 0; top: 24px; text-align: center; font-weight: 700; font-size: 20px; color: #fff; text-shadow: 0 2px 0 #000, 0 0 4px #000; }
#ckh .ran b { position: absolute; left: 50%; bottom: -${7 * K}px; transform: translateX(-50%); width: ${16 * K}px; height: ${11 * K}px; line-height: ${11 * K}px; text-align: center; background: 0 0 / 100% 100%; image-rendering: pixelated; font-weight: 700; font-size: 15px; color: #f3ead9; text-shadow: 0 1px 0 #000; }
#ckh .ran span.n { position: absolute; right: 5px; bottom: 3px; font-weight: 700; font-size: 18px; color: #fff; text-shadow: 0 2px 0 #000, 0 0 3px #000; }
#ckh .ran.vacia img { display: none; }
#ckh .ran.vacia::after { content: ''; position: absolute; left: ${3 * K}px; top: ${3 * K}px; width: ${32 * K}px; height: ${32 * K}px; background: repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 6px, transparent 6px 12px); }
#ckh .ran.sin img { filter: grayscale(.7) brightness(.55); }
#ckh .ran.cero img { filter: grayscale(1) brightness(.45); opacity: .7; }
#ckh .ran.prendida::before { content: ''; position: absolute; inset: -4px; border-radius: 6px; box-shadow: 0 0 14px 3px rgba(255, 170, 60, .75); }
#ckh .ran.lista img { animation: ckhLista .35s ease-out; }
@keyframes ckhLista { 0% { filter: brightness(2.2); transform: scale(1.12); } 100% { filter: none; transform: none; } }
#ckh .ran .tor { position: absolute; left: ${5 * K}px; right: ${5 * K}px; top: ${4 * K}px; height: 4px; background: rgba(0,0,0,.6); }
#ckh .ran .tor::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: var(--q, 0%); background: linear-gradient(90deg, #c2410c, #fbbf24); }
#ckh .items { display: flex; gap: 6px; }
#ckh.practica .items, #ckh.practica .fila .sep { display: none; }
`;
  const st = document.createElement('style'); st.id = 'ckh-css'; st.textContent = css; document.head.append(st);

  const host = () => document.getElementById('game-wrapper') || document.body;
  const caja = document.createElement('div');
  caja.id = 'ckh';
  caja.innerHTML =
    '<div class="med"><div class="fondo"></div><img class="cara" alt=""><div class="marco"></div><div class="niv"></div></div>' +
    '<div class="der">' +
      '<div class="cab"><span class="nom"></span><span class="mon"><i></i><span></span></span></div>' +
      '<div class="barra vida"><div class="llen atras"></div><div class="llen"></div><div class="txt"></div></div>' +
      '<div class="barra rec"><div class="llen"></div><div class="txt"></div></div>' +
      '<div class="fila">' +
        ['Q', 'E', 'R', 'F'].map((t, i) => `<div class="ran hab" data-i="${i}"><img alt=""><div class="cd"></div><div class="seg"></div><b>${t}</b></div>`).join('') +
        '<div class="sep"></div><div class="items">' +
        '<div class="ran it" data-k="parada"><img alt=""><div class="cd"></div><b>C</b></div>' +
        '<div class="ran it" data-k="potion"><img alt=""><span class="n"></span><b>Z</b></div>' +
        '<div class="ran it" data-k="elixir"><img alt=""><span class="n"></span><b>X</b></div>' +
        '<div class="ran it" data-k="torch"><img alt=""><div class="tor"></div><span class="n"></span><b>L</b></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  const q = s => caja.querySelector(s);
  const ranH = [...caja.querySelectorAll('.ran.hab')], ranI = {}; caja.querySelectorAll('.ran.it').forEach(e => (ranI[e.dataset.k] = e));
  ranI.parada.querySelector('img').src = IC.bloquear || '';
  ranI.potion.querySelector('img').src = IC.pocion || '';
  ranI.elixir.querySelector('img').src = IC.elixir || '';
  ranI.torch.querySelector('img').src = IC.antorcha || '';
  const COL = { soldier: ['#141a2a', '#3a4a6a'], swordsman: ['#24101a', '#5a2a3c'], wizard: ['#140f2a', '#3c2e6a'], bear: ['#0a1626', '#2a4a6a'] };

  let heroeVisto = null, ult = {}, ultCd = [];
  const pintarHeroe = (S, h) => {
    const a = HEROE(h);
    q('.med .marco').style.backgroundImage = u('medallon_' + a);
    q('.med .niv').style.backgroundImage = u('tecla_' + a);
    caja.style.setProperty('--ckh-c1', COL[a][0]); caja.style.setProperty('--ckh-c2', COL[a][1]);
    q('.barra.vida').style.backgroundImage = u('barra_vida_' + a);
    q('.barra.vida .llen:not(.atras)').style.backgroundImage = u('relleno_vida');
    q('.barra.rec').style.backgroundImage = u('barra_rec_' + a);
    q('.barra.rec .llen').style.backgroundImage = u('relleno_rec_' + a);
    caja.querySelectorAll('.ran').forEach(r => { r.style.backgroundImage = u('ranura_' + a); r.querySelector('b').style.backgroundImage = u('tecla_' + a); });
    const D = (typeof HEROES !== 'undefined' && HEROES[h]) || {};
    const img = document.getElementById('hud-portrait-img');
    q('.med img.cara').src = D.portrait || (img && img.src) || '';
    q('.cab .nom').textContent = D.name ? D.name.charAt(0) + D.name.slice(1).toLowerCase() : '';
    q('.barra.rec').title = RECURSO[a];
  };

  const cuadro = () => {
    try {
      const S = ESCENA();
      const igh = document.querySelector('.in-game-hud');
      const jugando = !!(S && S.player && igh && !igh.classList.contains('hidden') && S.gameStarted !== false && (S._gameMode === 'campaign' || S._gameMode === 'practice'));
      if (caja.parentElement !== host()) host().appendChild(caja);
      caja.classList.toggle('on', jugando);
      document.body.classList.toggle('ckh-on', jugando);
      if (jugando) {
        const h = S.playerHero;
        if (h !== heroeVisto) { heroeVisto = h; pintarHeroe(S, h); ult = {}; }
        caja.classList.toggle('practica', S._gameMode === 'practice');
        const s = S.story || {}, inv = s.inv || {};
        const v = S.maxHealth > 0 ? Math.max(0, Math.min(1, S.health / S.maxHealth)) : 1;
        const m = S.maxStamina > 0 ? Math.max(0, Math.min(1, S.stamina / S.maxStamina)) : 1;
        const clave = [S.health, S.maxHealth, Math.round(S.stamina), S.maxStamina, s.coins, s.level].join('|');
        if (clave !== ult.clave) {
          ult.clave = clave;
          caja.querySelectorAll('.barra.vida .llen').forEach(e => e.style.setProperty('--vacio', (100 - v * 100) + '%'));
          q('.barra.rec .llen').style.setProperty('--vacio', (100 - m * 100) + '%');
          q('.barra.vida .txt').textContent = (S.health ?? '') + ' / ' + (S.maxHealth ?? '');
          q('.barra.rec .txt').textContent = Math.round(S.stamina || 0) + ' / ' + Math.round(S.maxStamina || 100);
          q('.barra.vida').classList.toggle('baja', v <= 0.34);
          q('.cab .mon span').textContent = s.coins || 0;
          q('.cab .mon').style.display = S._gameMode === 'campaign' ? '' : 'none';
          q('.med .niv').textContent = S._gameMode === 'campaign' ? 'Niv. ' + (s.level || 1) : 'Práctica';
        }
        // ranuras de habilidades
        const EQ = window.CK_EQUIPO;
        const r = EQ ? EQ.ranuras(S) : [null, null, null, null];
        ranH.forEach((el, i) => {
          const id = r[i];
          if (el._id !== id) { el._id = id; el.classList.toggle('vacia', !id); el.querySelector('img').src = id && EQ ? EQ.icono(h, id) : ''; const d = id && EQ && EQ.def(h, id); el.title = d ? d.n : 'Vacía'; }
          const cd = id && EQ ? EQ.espera(S, id) : 0;
          el.querySelector('.cd').style.setProperty('--cd', cd.toFixed(3));
          const resto = cd > 0 && EQ ? Math.ceil(cd * ((EQ.BASE[id] && (EQ.BASE[id].cdMs || 0)) || ((window.CK_HABILIDADES.ACTIVAS[id] || {}).cd || 0)) / 1000) : 0;
          el.querySelector('.seg').textContent = resto > 1 ? resto : '';
          el.classList.toggle('sin', !!id && cd <= 0 && EQ && S.stamina < EQ.costo(id));
          if (ultCd[i] > 0 && cd <= 0) { el.classList.remove('lista'); void el.offsetWidth; el.classList.add('lista'); }
          ultCd[i] = cd;
        });
        // objetos
        if (S._gameMode === 'campaign') {
          const listo = S.time.now >= (S.parryReadyAt || 0);
          ranI.parada.querySelector('.cd').style.setProperty('--cd', listo ? 0 : Math.min(1, ((S.parryReadyAt || 0) - S.time.now) / 900).toFixed(3));
          ranI.parada.classList.toggle('sin', listo && S.stamina < 15);
          [['potion', inv.potion], ['elixir', inv.elixir], ['torch', inv.torch]].forEach(([k, n]) => { ranI[k].querySelector('.n').textContent = n || 0; ranI[k].classList.toggle('cero', !n && !(k === 'torch' && s.torch && s.torch.on)); });
          ranI.torch.classList.toggle('prendida', !!(s.torch && s.torch.on));
          const em = document.querySelector('#ck-antorcha em');
          const tor = ranI.torch.querySelector('.tor');
          tor.style.visibility = em && em.style.visibility !== 'hidden' ? 'visible' : 'hidden';
          if (em) tor.style.setProperty('--q', em.style.getPropertyValue('--q') || '0%');
        }
      }
    } catch (e) { if (!cuadro._av) { cuadro._av = 1; console.warn('[hud héroe]', e); } }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_HUD_HEROE = { caja, pintarHeroe };
})();
