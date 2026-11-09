'use strict';
/* Mando (gamepad) (07/11, pedido del dueño: "agregá todo eso"). Cualquier mando que el navegador reconozca (Xbox, PlayStation,
   genéricos USB o Bluetooth). Cada botón "aprieta" la tecla que corresponde, así respeta las teclas cambiadas en Opciones.
     Palanca izquierda o cruceta: moverse (palanca a fondo: correr)
     A / ✕: atacar (J)      X / □: especial (K)      B / ○: dash (Espacio)      Y / △: hablar, abrir, comprar (T)
     LB / L1: parada (C)    RB / R1 sostenido + A, B, X, Y: habilidades Q, E, R, F
     LT / L2: poción (Z)    RT / R2: elixir (X)      Select / Share: diario (TAB)      Start / Options: pausa (Esc)
   Al conectar aparece un aviso. Borrar la línea de index.html lo saca. */
(function () {
  if (!navigator.getGamepads) return;
  const MUERTA = 0.35, A_FONDO = 0.92;
  const KB = () => (typeof KeybindsManager !== 'undefined' ? KeybindsManager : null);
  const tecla = id => { const k = KB(); return k ? k.get(id) : null; };
  const codigo = nombre => {
    if (!nombre) return 0;
    if (typeof resolvePhaserKeyCode === 'function' && typeof Phaser !== 'undefined') return resolvePhaserKeyCode(nombre);
    return String(nombre).toUpperCase().charCodeAt(0);
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
    const kc = typeof nombre === 'number' ? nombre : codigo(nombre);
    if (!kc || !!apretado[kc] === !!on) return;
    apretado[kc] = !!on; enviar(on ? 'keydown' : 'keyup', kc);
  };
  const avisar = txt => { try { if (window.CK_SIN_CARTELES_API) window.CK_SIN_CARTELES_API.nota(txt); } catch (e) {} };
  let conectado = false;
  window.addEventListener('gamepadconnected', e => { conectado = true; avisar('Mando conectado: A ataca, X especial, B dash, Y habla. RB + botón: habilidades.'); });
  window.addEventListener('gamepaddisconnected', () => { Object.keys(apretado).forEach(k => poner(+k, false)); avisar('Mando desconectado'); });

  const cuadro = () => {
    try {
      const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
      const g = pads[0];
      if (g) {
        const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
        const ax = g.axes[0] || 0, ay = g.axes[1] || 0, m = Math.hypot(ax, ay);
        poner(tecla('moveLeft'), ax < -MUERTA || b(14)); poner(tecla('moveRight'), ax > MUERTA || b(15));
        poner(tecla('moveUp'), ay < -MUERTA || b(12)); poner(tecla('moveDown'), ay > MUERTA || b(13));
        poner(tecla('run'), m > A_FONDO);
        const rb = b(5);
        // con RB sostenido los botones de la cara son las habilidades
        poner('Q', rb && b(0)); poner('E', rb && b(1)); poner('R', rb && b(2)); poner('F', rb && b(3));
        poner(tecla('attack'), !rb && b(0)); poner(tecla('dash'), !rb && b(1)); poner(tecla('special'), !rb && b(2)); poner('T', !rb && b(3));
        poner('C', b(4)); poner('Z', b(6)); poner('X', b(7)); poner('TAB', b(8)); poner('ESC', b(9));
      }
    } catch (e) {}
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_GAMEPAD = { apretado, poner, conectado: () => conectado };
})();
