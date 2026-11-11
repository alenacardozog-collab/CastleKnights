'use strict';
/* Modo celular, siempre horizontal (11/11, pedido del dueño: "añadile al juego un modo para móviles; la versión de
   celulares tiene que ser con el celu horizontal").
   Se prende solo en pantallas táctiles (o con ?movil=1 en la dirección, para probar en la PC; ?movil=0 lo apaga):
   - HORIZONTAL: con el celular parado aparece "Girá el celular"; al primer toque pide pantalla completa y traba la
     pantalla acostada (donde el navegador lo deja).
   - PALANCA a la izquierda: se apoya el dedo en cualquier lugar de la mitad izquierda y aparece ahí; empujada a fondo
     corre.
   - BOTONES a la derecha, como en los juegos de celular: ATACAR grande (J), y alrededor ESPECIAL (K), DASH (Espacio) y
     HABLAR (T); arriba las 4 habilidades Q E R F con el ícono que tenga el héroe; a un costado BLOQUEAR (C) y POCIÓN (Z).
     Arriba: pausa (Esc), mapa (M) y diario (Tab).
   - En diálogos, ventanas y menús los botones se esconden; tocar la pantalla pasa el diálogo (como el clic).
   - La barra del héroe se achica (ck_hud_simple.js) y no se ven las teclas.
   Cada botón "aprieta" la tecla que corresponde (respeta las teclas cambiadas en Opciones). Borrar la línea de
   index.html lo saca. */
(function () {
  if (typeof document === 'undefined') return;
  const qs = new URLSearchParams(location.search);
  const tactil = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const ON = qs.get('movil') === '1' || (qs.get('movil') !== '0' && tactil);
  window.CK_MOVIL = { activo: ON };
  if (!ON) return;
  document.body.classList.add('ck-movil');

  // ------------------------------------------------------------------ teclas
  const KB = () => (typeof KeybindsManager !== 'undefined' ? KeybindsManager : null);
  const tecla = id => { const k = KB(); return k ? k.get(id) : null; };
  const KEY = { 32: ' ', 27: 'Escape', 9: 'Tab', 16: 'Shift', 13: 'Enter' };
  const codigo = n => {
    if (typeof n === 'number') return n;
    if (!n) return 0;
    const u = String(n).toUpperCase();
    if (u === 'ESC') return 27; if (u === 'TAB') return 9; if (u === 'SPACE') return 32; if (u === 'SHIFT') return 16; if (u === 'ENTER') return 13;
    if (typeof resolvePhaserKeyCode === 'function' && typeof Phaser !== 'undefined') return resolvePhaserKeyCode(n);
    return u.charCodeAt(0);
  };
  const enviar = (tipo, kc) => {
    const key = KEY[kc] || String.fromCharCode(kc).toLowerCase();
    const ev = new KeyboardEvent(tipo, { key, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => kc }); Object.defineProperty(ev, 'which', { get: () => kc });
    document.dispatchEvent(ev);
  };
  const ap = {};
  const poner = (n, on) => { const kc = codigo(n); if (!kc || !!ap[kc] === !!on) return; ap[kc] = !!on; enviar(on ? 'keydown' : 'keyup', kc); };
  const soltarTodo = () => Object.keys(ap).forEach(k => { if (ap[k]) poner(+k, false); });
  // al pasar a pantalla completa o girar, el navegador "suelta" las teclas: se vuelven a apretar las que siguen apretadas
  const reafirmar = () => setTimeout(() => Object.keys(ap).forEach(k => { if (ap[k]) enviar('keydown', +k); }), 120);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, reafirmar));
  addEventListener('resize', reafirmar); addEventListener('focus', reafirmar);

  // ------------------------------------------------------------------ pantalla
  const css = `
body.ck-movil .header-bar, body.ck-movil .controls-bar, body.ck-movil #dev-toolbar { display: none !important; }
body.ck-movil { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; }
body.ck-movil .game-viewport-wrapper { position: fixed !important; inset: 0 !important; max-width: none !important; width: 100vw !important; height: 100vh !important; height: 100dvh !important;
  border: none !important; box-shadow: none !important; margin: 0 !important; }
body.ck-movil #game-canvas-container { width: 100vw !important; height: 100vh !important; height: 100dvh !important; }
body.ck-movil #game-canvas-container canvas { width: min(100vw, calc(100dvh * 1.6)) !important; height: min(100dvh, calc(100vw / 1.6)) !important; }
body.ck-movil { touch-action: none; -webkit-user-select: none; user-select: none; overscroll-behavior: none; }
body.ck-movil #ckh .ran b, body.ck-movil .ck-teclas-ayuda { display: none !important; }
/* en el celular la barra del héroe sólo muestra retrato, nombre y barras (las habilidades y pociones están en los botones) */
body.ck-movil #ckh.simple .fila, body.ck-movil #ckh.simple .ckS-abajo { display: none !important; }
body.ck-movil #ckh.simple { left: 12px !important; transform: scale(.72) !important; transform-origin: 0 100% !important; bottom: 4px !important; }
body.ck-movil #ck-objective { transform: scale(.72); transform-origin: 100% 0; }
body.ck-movil #ck-minimapa { transform: scale(.72); transform-origin: 0 0; }
#ckm { position: fixed; inset: 0; z-index: 44; pointer-events: none; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); }
#ckm.oculto .ckb, #ckm.oculto .pal, #ckm.oculto .zona { display: none; }
#ckm .zona { position: absolute; left: 0; top: 18%; width: 45%; bottom: 0; pointer-events: auto; }
#ckm .pal { position: absolute; width: 132px; height: 132px; margin: -66px 0 0 -66px; border-radius: 50% !important; display: none;
  background: radial-gradient(circle, rgba(20,14,16,.25) 0 55%, rgba(20,14,16,.45) 56% 100%); border: 3px solid rgba(243,234,217,.35); pointer-events: none; }
#ckm .pal i { position: absolute; left: 50%; top: 50%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50% !important;
  background: radial-gradient(circle at 40% 35%, #6a5648, #2a1f1c); border: 3px solid #f3ead9; box-shadow: 0 3px 6px rgba(0,0,0,.6); }
#ckm .pal.reposo { display: block; opacity: .55; }
#ckm .ckb { position: absolute; pointer-events: auto; border-radius: 50% !important; display: flex; align-items: center; justify-content: center;
  color: #f3ead9; font-weight: 700; text-shadow: 0 2px 0 #000; background: radial-gradient(circle at 45% 35%, rgba(70,56,50,.85), rgba(22,16,18,.85));
  border: 3px solid rgba(243,234,217,.55); box-shadow: 0 3px 6px rgba(0,0,0,.5); box-sizing: border-box; touch-action: none; }
#ckm .ckb.on { transform: scale(.92); filter: brightness(1.5); }
#ckm .ckb img { width: 70%; height: 70%; image-rendering: pixelated; pointer-events: none; }
#ckm .ckb span { position: absolute; bottom: -2px; font-size: 12px; pointer-events: none; }
#ckm .atk { width: 92px; height: 92px; right: 34px; bottom: 34px; font-size: 18px; border-color: #ffd25a; background: radial-gradient(circle at 45% 35%, rgba(150,60,40,.9), rgba(60,16,14,.9)); }
#ckm .esp { width: 62px; height: 62px; right: 138px; bottom: 26px; font-size: 13px; }
#ckm .dash { width: 62px; height: 62px; right: 116px; bottom: 104px; font-size: 13px; }
#ckm .hab { width: 52px; height: 52px; font-size: 15px; border-color: var(--ckm-glow, #ffd25a); }
#ckm .hab.vacia { opacity: .35; }
#ckm .hablar { width: 54px; height: 54px; right: 52px; bottom: 140px; font-size: 12px; border-color: #9fe0ff; }
#ckm .chico { width: 46px; height: 46px; font-size: 11px; }
#ckm .arriba { top: 6px; margin-right: -22px; width: 44px; height: 44px; font-size: 18px; border-radius: 10px !important; }
#ckm-girar { position: fixed; inset: 0; z-index: 99999; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
  background: #0e0a0b; color: #f3ead9; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); font-size: 26px; text-align: center; }
#ckm-girar i { width: 64px; height: 108px; border: 5px solid #f3ead9; border-radius: 12px; animation: ckmGira 1.8s ease-in-out infinite; }
@keyframes ckmGira { 0%, 25% { transform: rotate(0); } 60%, 100% { transform: rotate(-90deg); } }
@media (orientation: portrait) { body.ck-movil #ckm-girar { display: flex; } }
`;
  const st = document.createElement('style'); st.id = 'ckm-css'; st.textContent = css; document.head.append(st);
  const girar = document.createElement('div'); girar.id = 'ckm-girar';
  girar.innerHTML = '<i></i><div>Girá el celular</div><small style="font-size:16px;opacity:.7">Castle Knight se juega acostado</small>';
  document.body.append(girar);
  let completa = false;
  const pantallaCompleta = () => {
    if (completa) return; completa = true;
    try {
      const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
      const p = rq && rq.call(el, { navigationUI: 'hide' });
      const trabar = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
      if (p && p.then) p.then(trabar).catch(trabar); else trabar();
    } catch (e) {}
  };
  document.addEventListener('touchstart', pantallaCompleta, { once: true, passive: true });

  // el juego ocupa toda la pantalla del celular (como en pantalla completa)
  const ajustar = () => { try { window.game && game.scale && game.scale.refresh(); } catch (e) {} };
  addEventListener('load', () => setTimeout(ajustar, 300)); addEventListener('resize', () => setTimeout(ajustar, 150));
  addEventListener('orientationchange', () => setTimeout(ajustar, 300));

  // ------------------------------------------------------------------ controles
  const raiz = document.createElement('div'); raiz.id = 'ckm';
  const B = (cls, txt, tec, pos) => {
    const b = document.createElement('div'); b.className = 'ckb ' + cls; b.innerHTML = txt;
    if (pos) Object.assign(b.style, pos);
    b.dataset.t = tec; raiz.appendChild(b); return b;
  };
  const zona = document.createElement('div'); zona.className = 'zona'; raiz.appendChild(zona);
  const pal = document.createElement('div'); pal.className = 'pal'; pal.innerHTML = '<i></i>'; raiz.appendChild(pal);
  const nudo = pal.querySelector('i');
  B('atk', '⚔<span>Atacar</span>', 'attack');
  B('esp', '✦<span>Especial</span>', 'special');
  B('dash', '»<span>Dash</span>', 'dash');
  B('hablar', '💬<span>Hablar</span>', 'T');
  const HAB = ['Q', 'E', 'R', 'F'].map((t, i) => B('hab', '<img alt=""><span>' + t + '</span>', t, { right: (24 + i * 58) + 'px', bottom: (196 + (i === 0 ? 0 : 0)) + 'px' }));
  // las habilidades en arco arriba del botón de atacar
  [[190, 130], [168, 196], [110, 236], [40, 236]].forEach(([r, bt], i) => { HAB[i].style.right = r + 'px'; HAB[i].style.bottom = bt + 'px'; });
  B('chico', '🛡<span>C</span>', 'C', { right: '214px', bottom: '62px' });
  B('chico', '🧪<span>Z</span>', 'Z', { right: '262px', bottom: '18px' });
  // arriba al centro (a la derecha están Menú y Salir del juego, y el objetivo)
  B('arriba', 'II', 'ESC', { right: 'calc(50% - 75px)' });
  B('arriba', '🗺', 'M', { right: '50%' });
  B('arriba', '📖', 'TAB', { right: 'calc(50% + 75px)' });
  const host = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const ubicar = () => { const h = host(); if (h && raiz.parentElement !== h) h.appendChild(raiz); if (h && girar.parentElement !== h) h.appendChild(girar); };
  ubicar(); document.addEventListener('fullscreenchange', ubicar);

  const tec = t => (/^(attack|special|dash|run|moveUp|moveDown|moveLeft|moveRight)$/.test(t) ? tecla(t) : t);
  const dedos = {};   // id del toque -> botón
  raiz.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      const b = t.target.closest && t.target.closest('.ckb');
      if (b) { dedos[t.identifier] = b; b.classList.add('on'); poner(tec(b.dataset.t), true); if (navigator.vibrate) navigator.vibrate(8); }
      else if (t.target === zona) empezar(t);
    }
    e.preventDefault();
  }, { passive: false });
  const fin = e => {
    for (const t of e.changedTouches) {
      const b = dedos[t.identifier];
      if (b) { delete dedos[t.identifier]; b.classList.remove('on'); poner(tec(b.dataset.t), false); }
      if (palanca && palanca.id === t.identifier) soltar();
    }
    e.preventDefault();
  };
  raiz.addEventListener('touchend', fin, { passive: false });
  raiz.addEventListener('touchcancel', fin, { passive: false });
  raiz.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (palanca && palanca.id === t.identifier) mover(t); e.preventDefault(); }, { passive: false });

  // ------------------------------------------------------------------ la palanca
  const R = 54, MUERTA = 0.3, FONDO = 0.92;
  let palanca = null;
  const empezar = t => {
    palanca = { id: t.identifier, x: t.clientX, y: t.clientY };
    pal.classList.remove('reposo'); pal.style.display = 'block';
    pal.style.left = t.clientX + 'px'; pal.style.top = t.clientY + 'px';
    nudo.style.transform = 'translate(0,0)';
  };
  const mover = t => {
    let dx = t.clientX - palanca.x, dy = t.clientY - palanca.y; const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / R);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    nudo.style.transform = `translate(${dx}px,${dy}px)`;
    const ax = dx / R, ay = dy / R;
    poner(tecla('moveLeft'), ax < -MUERTA); poner(tecla('moveRight'), ax > MUERTA);
    poner(tecla('moveUp'), ay < -MUERTA); poner(tecla('moveDown'), ay > MUERTA);
    poner(tecla('run'), k > FONDO);
  };
  const soltar = () => {
    palanca = null; ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'run'].forEach(n => poner(tecla(n), false));
    pal.style.display = ''; pal.classList.add('reposo'); reposo();
  };
  const reposo = () => { pal.style.left = '120px'; pal.style.top = (innerHeight - 120) + 'px'; nudo.style.transform = 'translate(0,0)'; };
  reposo(); pal.classList.add('reposo');
  addEventListener('resize', () => { if (!palanca) reposo(); });

  // ------------------------------------------------------------------ cuándo se ven, y los íconos de las habilidades
  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const GLOW = { soldier: '#ffd25a', swordsman: '#ff7a9a', wizard: '#c49bff', bear: '#9fe0ff' };
  const cuadro = () => {
    try {
      ubicar();
      const S = ESCENA(), igh = document.querySelector('.in-game-hud');
      const jugando = !!(S && S.player && igh && !igh.classList.contains('hidden') && S.gameStarted !== false && !S.isGamePaused);
      const libre = jugando && !S.dialogOpen && !S._overlay && !document.body.classList.contains('ck2-dlg') && !S._ckEscena;
      if (raiz.classList.contains('oculto') === libre) { raiz.classList.toggle('oculto', !libre); if (!libre) { soltarTodo(); if (palanca) soltar(); } }
      if (libre) {
        const src = [...document.querySelectorAll('#ckh .ran.hab')];
        HAB.forEach((b, i) => {
          const r = src[i], im = r && r.querySelector('img'), s2 = im && !r.classList.contains('vacia') ? im.src : '';
          if (b._src !== s2) { b._src = s2; b.querySelector('img').src = s2; b.querySelector('img').style.visibility = s2 ? '' : 'hidden'; b.classList.toggle('vacia', !s2); }
        });
        raiz.style.setProperty('--ckm-glow', GLOW[S.playerHero] || GLOW.soldier);
      }
    } catch (e) {}
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_MOVIL = { activo: true, poner, raiz };
})();
