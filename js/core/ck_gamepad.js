'use strict';
/* Mando (gamepad) (07/11; v2 11/11, pedido del dueño: "compatibilidad con mandos, con configuración de Xbox 360").
   Cualquier mando que el navegador reconozca (Xbox 360 / One / Series, PlayStation, genéricos XInput). Cada botón
   "aprieta" la tecla que corresponde, así respeta las teclas cambiadas en Opciones. Configuración Xbox 360:
     Palanca izquierda o cruceta: moverse (palanca a fondo: correr)       L3 (apretar la palanca izq.): antorcha (L)
     A: atacar (J) · en diálogos, pasar (T)    X: especial (K)    B: dash (Espacio)    Y: hablar, abrir, comprar (T)
     LB: bloquear (C)    RB sostenido + A, B, X, Y: habilidades Q, E, R, F
     LT: poción (Z)      RT: elixir (X)        R3 (apretar la palanca der.): mapa (M)
     Back: diario (TAB)  Start: pausa (Esc)    Back + Start: ver esta tabla de controles
   - Menús y ventanas (pausa, opciones, tienda, menú principal): la cruceta o la palanca recorren los botones,
     A elige y B vuelve (Esc).
   - Vibra al recibir un golpe (en los mandos que lo permiten).
   - Mientras se juega con el mando, la barra del héroe muestra los botones del mando en vez de las teclas.
   - Al conectar el mando aparece la tabla de controles unos segundos.
   Borrar la línea de index.html lo saca. */
(function () {
  if (!navigator.getGamepads) return;
  const MUERTA = 0.35, A_FONDO = 0.92;
  const KB = () => (typeof KeybindsManager !== 'undefined' ? KeybindsManager : null);
  const tecla = id => { const k = KB(); return k ? k.get(id) : null; };
  const codigo = nombre => {
    if (!nombre) return 0;
    if (typeof nombre === 'number') return nombre;
    const u = String(nombre).toUpperCase();
    if (u === 'ESC') return 27; if (u === 'TAB') return 9;
    if (typeof resolvePhaserKeyCode === 'function' && typeof Phaser !== 'undefined') return resolvePhaserKeyCode(nombre);
    return u.charCodeAt(0);
  };
  const KEY = { 32: ' ', 27: 'Escape', 9: 'Tab', 16: 'Shift', 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown' };
  const enviar = (tipo, kc) => {
    if (!kc) return;
    const key = KEY[kc] || String.fromCharCode(kc).toLowerCase();
    const ev = new KeyboardEvent(tipo, { key, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => kc }); Object.defineProperty(ev, 'which', { get: () => kc });
    (document.activeElement && document.activeElement !== document.body ? document.activeElement : document).dispatchEvent(ev);
  };
  const apretado = {};
  const poner = (nombre, on) => {
    const kc = codigo(nombre);
    if (!kc || !!apretado[kc] === !!on) return;
    apretado[kc] = !!on; enviar(on ? 'keydown' : 'keyup', kc);
  };
  const soltarTodo = () => Object.keys(apretado).forEach(k => poner(+k, false));
  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));

  // ------------------------------------------------------------------ tabla de controles (Xbox 360)
  const css = `
#ckpad { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 99990; display: none; padding: 16px 22px 14px; border-radius: 12px;
  background: rgba(14,10,12,.94); border: 3px solid #5a4a40; box-shadow: 0 10px 30px rgba(0,0,0,.7); color: #f3ead9; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); }
#ckpad.on { display: block; animation: ckpVa .25s ease-out; }
@keyframes ckpVa { from { opacity: 0; transform: translate(-50%, -46%); } }
#ckpad h3 { margin: 0 0 10px; text-align: center; font-size: 22px; color: #ffd25a; letter-spacing: 1px; }
#ckpad .g { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 6px 12px; align-items: center; font-size: 16px; }
#ckpad .k { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 30px; padding: 0 6px; border-radius: 15px; font-weight: 700;
  font-family: Arial, sans-serif; font-size: 14px; color: #fff; background: #3a3a3a; border: 2px solid #111; box-sizing: border-box; border-radius: 15px !important; }
#ckpad .k.A, .ckpb.A { background: #3fa53b; } #ckpad .k.B, .ckpb.B { background: #d0342c; } #ckpad .k.X, .ckpb.X { background: #2f6fd8; } #ckpad .k.Y, .ckpb.Y { background: #e3b51c; color: #111; }
#ckpad .k.bump { border-radius: 6px !important; } #ckpad .k.trig { border-radius: 6px 6px 12px 12px !important; }
#ckpad small { display: block; margin-top: 10px; text-align: center; opacity: .65; font-size: 13px; }
#ckh .ran b.pad { font-family: Arial, sans-serif; font-size: 11px !important; color: #fff !important; background-image: none !important; border-radius: 9px; border: 1px solid #111; }
#ckh .ran b.pad.A { background-color: #3fa53b !important; } #ckh .ran b.pad.B { background-color: #d0342c !important; }
#ckh .ran b.pad.X { background-color: #2f6fd8 !important; } #ckh .ran b.pad.Y { background-color: #e3b51c !important; color: #111 !important; }
#ckh .ran b.pad.G { background-color: #3a3a3a !important; border-radius: 4px; }
.ckp-foco { outline: 3px solid #ffd25a !important; outline-offset: 2px; box-shadow: 0 0 12px rgba(255,210,90,.7) !important; }
`;
  const st = document.createElement('style'); st.id = 'ckpad-css'; st.textContent = css; document.head.append(st);
  const tabla = document.createElement('div'); tabla.id = 'ckpad';
  const k = (c, t) => `<span class="k ${c}">${t}</span>`;
  tabla.innerHTML = '<h3>Mando · Xbox 360</h3><div class="g">' +
    k('', 'LS') + '<span>Moverse (a fondo: correr)</span>' + k('', 'L3') + '<span>Antorcha</span>' +
    k('A', 'A') + '<span>Atacar · pasar diálogo</span>' + k('X', 'X') + '<span>Especial</span>' +
    k('B', 'B') + '<span>Dash</span>' + k('Y', 'Y') + '<span>Hablar · abrir · comprar</span>' +
    k('bump', 'LB') + '<span>Bloquear</span>' + k('bump', 'RB') + '<span>+ A B X Y: habilidades Q E R F</span>' +
    k('trig', 'LT') + '<span>Poción</span>' + k('trig', 'RT') + '<span>Elixir</span>' +
    k('', 'R3') + '<span>Mapa</span>' + k('', 'Back') + '<span>Diario</span>' +
    k('', 'Start') + '<span>Pausa</span>' + k('', '+') + '<span>Back + Start: esta tabla</span>' +
    '</div><small>En los menús: la cruceta recorre, A elige, B vuelve</small>';
  // dentro del marco del juego (si el juego está en pantalla completa, lo de afuera no se ve)
  const host = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const ubicar = () => { const h = host(); if (h && tabla.parentElement !== h) h.appendChild(tabla); };
  document.addEventListener('DOMContentLoaded', ubicar); if (document.body) ubicar();
  let tablaHasta = 0;
  const mostrarTabla = ms => { ubicar(); tablaHasta = performance.now() + ms; tabla.classList.add('on'); };

  // ------------------------------------------------------------------ la barra del héroe con los botones del mando
  const PADB = { Q: ['A', 'A'], E: ['B', 'B'], R: ['X', 'X'], F: ['Y', 'Y'], C: ['G', 'LB'], Z: ['G', 'LT'], X: ['G', 'RT'], L: ['G', 'L3'] };
  let usaMando = false;
  const marcarHud = on => {
    document.querySelectorAll('#ckh .ran b').forEach(b => {
      if (b._orig === undefined) b._orig = b.textContent;
      const p = PADB[b._orig];
      b.classList.remove('pad', 'A', 'B', 'X', 'Y', 'G');
      if (on && p) { b.classList.add('pad', p[0]); b.textContent = p[1]; } else b.textContent = b._orig;
    });
  };

  // ------------------------------------------------------------------ menús: recorrer botones con la cruceta
  const visible = el => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const botones = () => [...document.querySelectorAll('button:not([disabled]), .btn:not(.disabled), [role="button"], .ck-opcion, select, input[type="range"]')]
    .filter(el => !el.closest('#ckm, #ckh, #ckpad') && visible(el) && document.elementFromPoint(...centro(el)) && (document.elementFromPoint(...centro(el)) === el || el.contains(document.elementFromPoint(...centro(el)))));
  const centro = el => { const r = el.getBoundingClientRect(); return [Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))]; };
  let foco = null;
  const enfocar = el => { if (foco) foco.classList.remove('ckp-foco'); foco = el; if (el) { el.classList.add('ckp-foco'); try { el.focus({ preventScroll: false }); el.scrollIntoView({ block: 'nearest' }); } catch (e) {} } };
  const moverFoco = (dx, dy) => {
    const L = botones(); if (!L.length) return;
    if (!foco || L.indexOf(foco) < 0) { enfocar(L[0]); return; }
    const [cx, cy] = centro(foco); let mejor = null, md = 1e9;
    L.forEach(el => {
      if (el === foco) return;
      const [x, y] = centro(el), vx = x - cx, vy = y - cy;
      if (dx && Math.sign(vx) !== dx) return; if (dy && Math.sign(vy) !== dy) return;
      const d = dx ? Math.abs(vx) + Math.abs(vy) * 2.5 : Math.abs(vy) + Math.abs(vx) * 2.5;
      if (d < md && (dx ? Math.abs(vx) > 4 : Math.abs(vy) > 4)) { md = d; mejor = el; }
    });
    if (mejor) enfocar(mejor);
  };
  const enMenu = () => {
    const S = ESCENA();
    if (!S || S.gameStarted === false || S.isGamePaused || S._overlay) return true;
    const igh = document.querySelector('.in-game-hud');
    return !!(igh && igh.classList.contains('hidden'));
  };

  const avisar = txt => { try { if (window.CK_SIN_CARTELES_API) window.CK_SIN_CARTELES_API.nota(txt); } catch (e) {} };
  let conectado = false;
  window.addEventListener('gamepadconnected', e => { conectado = true; avisar('Mando conectado (configuración Xbox 360). Back + Start: ver los controles.'); mostrarTabla(7000); });
  window.addEventListener('gamepaddisconnected', () => { soltarTodo(); avisar('Mando desconectado'); if (usaMando) { usaMando = false; marcarHud(false); } });

  // vibra al recibir un golpe
  const vibrar = (fuerte, ms) => {
    try {
      const g = [...navigator.getGamepads()].filter(Boolean)[0], v = g && g.vibrationActuator;
      if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, strongMagnitude: fuerte, weakMagnitude: fuerte * 0.7 }).catch(() => {});
    } catch (e) {}
  };
  if (typeof MainGameScene !== 'undefined' && MainGameScene.prototype.damagePlayer) {
    const dp0 = MainGameScene.prototype.damagePlayer;
    MainGameScene.prototype.damagePlayer = function (n) { const h0 = this.health; const r = dp0.apply(this, arguments); if (usaMando && this.health < h0) vibrar(Math.min(1, 0.45 + 0.2 * (h0 - this.health)), 200); return r; };
  }

  const antes = {};
  const flanco = (id, on) => { const f = on && !antes[id]; antes[id] = on; return f; };
  let repetir = 0;
  const cuadro = () => {
    try {
      const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
      const g = pads[0];
      if (g) {
        const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
        const ax = g.axes[0] || 0, ay = g.axes[1] || 0, m = Math.hypot(ax, ay);
        const algo = g.buttons.some(x => x && x.pressed) || m > MUERTA;
        if (algo && !usaMando) { usaMando = true; marcarHud(true); }
        if (tabla.classList.contains('on') && performance.now() > tablaHasta) tabla.classList.remove('on');
        if (b(8) && b(9)) { if (flanco('tabla', true)) mostrarTabla(6000); poner('TAB', false); poner('ESC', false); requestAnimationFrame(cuadro); return; }
        flanco('tabla', false);
        if (enMenu()) {
          // ------------------------------------------- en menús
          soltarTodo();
          const izq = ax < -0.5 || b(14), der = ax > 0.5 || b(15), arr = ay < -0.5 || b(12), aba = ay > 0.5 || b(13);
          const ahora = performance.now(), dir = izq || der || arr || aba;
          if (dir && (!antes.dir || ahora > repetir)) { repetir = ahora + (antes.dir ? 140 : 380); moverFoco(izq ? -1 : der ? 1 : 0, arr ? -1 : aba ? 1 : 0); }
          antes.dir = dir;
          if (flanco('A', b(0))) { if (foco && document.contains(foco) && visible(foco)) foco.click(); else moverFoco(0, 1); }
          if (flanco('B', b(1))) { enviar('keydown', 27); enviar('keyup', 27); }
          if (flanco('St', b(9))) { enviar('keydown', 27); enviar('keyup', 27); }
        } else {
          // ------------------------------------------- jugando
          if (foco) enfocar(null);
          ['A', 'B', 'St', 'dir'].forEach(x => (antes[x] = false));
          const S = ESCENA(), dlg = !!(S && S.dialogOpen);
          poner(tecla('moveLeft'), !dlg && (ax < -MUERTA || b(14))); poner(tecla('moveRight'), !dlg && (ax > MUERTA || b(15)));
          poner(tecla('moveUp'), !dlg && (ay < -MUERTA || b(12))); poner(tecla('moveDown'), !dlg && (ay > MUERTA || b(13)));
          poner(tecla('run'), m > A_FONDO);
          const rb = b(5);
          // con RB sostenido los botones de la cara son las habilidades
          poner('Q', rb && b(0)); poner('E', rb && b(1)); poner('R', rb && b(2)); poner('F', rb && b(3));
          poner(tecla('attack'), !rb && !dlg && b(0)); poner(tecla('dash'), !rb && b(1)); poner(tecla('special'), !rb && b(2));
          poner('T', !rb && (b(3) || (dlg && b(0))));
          poner('C', b(4)); poner('Z', b(6)); poner('X', b(7)); poner('TAB', b(8)); poner('ESC', b(9));
          poner('L', b(10)); poner('M', b(11));
        }
      }
    } catch (e) {}
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  // si vuelve a usar el teclado, la barra vuelve a mostrar las teclas
  document.addEventListener('keydown', e => { if (e.isTrusted && usaMando) { usaMando = false; marcarHud(false); } }, true);
  window.CK_GAMEPAD = { apretado, poner, conectado: () => conectado, mostrarTabla, marcarHud };
})();
