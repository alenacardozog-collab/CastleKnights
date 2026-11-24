'use strict';
/* La relación de aspecto (23/11, tanda 11a, nota 12 del dueño: "arreglar la relación de aspecto del juego o centrar, que no se
   vea esa franja negra").
   El juego era de 960×600 (16:10) y en una pantalla 16:9 quedaban franjas negras a los costados; además quedaba corrido a la
   derecha (Phaser lo centraba con un margen y el contenedor lo volvía a centrar: 96 px a la izquierda y 32 a la derecha).
   - El alto sigue siendo 600; el ANCHO se acomoda a la ventana (entre 4:3 y 21:9): en 16:9 el juego es de 1066×600 y llena
     la pantalla, sin franjas. Se ve un poco más de mapa a los costados; nada se estira.
   - Si la ventana cambia de forma (o se pasa a pantalla completa), el ancho se vuelve a acomodar.
   - La aldea (640 de ancho) llenaba justo los 960: con más ancho, la cámara se acerca un poco para no mostrar el borde vacío.
   - Centrado de verdad: si queda franja (una ventana más angosta que 4:3 o más ancha que 21:9), es pareja de los dos lados.
   - Las reglas de pantalla completa sin estirar (index.html, ck_solo_juego.js, ck_movil.js) medían el lienzo con 16:10 fijo:
     ahora usan la proporción del juego (la variable --ck-asp).
   Va DESPUÉS de game.js (cambia el ancho antes de que arranque el juego). Borrar su línea de index.html vuelve al 960×600. */
(function () {
  if (typeof config === 'undefined' || !config.scale) return;
  const ALTO = config.height || 600, MIN = 4 / 3, MAX = 2.4;
  const anchoPara = () => {
    const w = window.innerWidth || 960, h = window.innerHeight || 600;
    const r = Math.max(MIN, Math.min(MAX, w / h));
    return Math.round(ALTO * r / 2) * 2;
  };
  const proporcion = w => { try { document.documentElement.style.setProperty('--ck-asp', (w / ALTO).toFixed(4)); } catch (e) {} };
  config.width = anchoPara();
  proporcion(config.width);
  // centrado: sólo el contenedor (flex) centra; el margen que pone Phaser se anula. Y el tamaño sin estirar, con la proporción
  // del juego (las reglas de antes decían 1,6)
  const st = document.createElement('style');
  st.textContent = '#game-canvas-container{align-items:center!important;justify-content:center!important}#game-canvas-container>canvas{margin:0!important}' +
    'html.ck-solo-pre #game-canvas-container canvas,body.ck-solo #game-canvas-container canvas{width:min(100vw,calc(100vh * var(--ck-asp,1.6)))!important;height:min(100vh,calc(100vw / var(--ck-asp,1.6)))!important}' +
    'body.ck-movil #game-canvas-container canvas{width:min(100vw,calc(100dvh * var(--ck-asp,1.6)))!important;height:min(100dvh,calc(100vw / var(--ck-asp,1.6)))!important}';
  const poner = () => { if (st.parentNode !== document.head || document.head.lastElementChild !== st) document.head.appendChild(st); };
  poner(); window.addEventListener('load', poner);
  // la ventana cambia de forma: el ancho del juego (y el de la cámara) se acomodan
  let t = null;
  const acomodar = () => {
    const g = window.game; if (!g || !g.scale) return;
    const w = anchoPara(); if (Math.abs(g.scale.width - w) < 4) return;
    proporcion(w);
    g.scale.setGameSize(w, ALTO);
    (g.scene ? g.scene.scenes : []).forEach(s => { try { if (s.cameras && s.cameras.main) s.cameras.main.setSize(w, ALTO); } catch (e) {} });
  };
  const luego = ms => { clearTimeout(t); t = setTimeout(acomodar, ms); };
  window.addEventListener('resize', () => luego(250));
  document.addEventListener('fullscreenchange', () => luego(320));
  // nunca se ve el vacío alrededor de un mapa: la aldea mide 640 de ancho y con la cámara a 1,5 llenaba justo los 960; más
  // ancho se veía una franja oscura a la derecha. Si la vista queda más grande que los límites de la cámara, la cámara se
  // acerca lo justo (en 960×600 no cambia nada). No en el modo desarrollador ni en el Estudio, que alejan a mano.
  const ajustarZoom = S => {
    const c = S && S.cameras && S.cameras.main;
    if (!c || !c.useBounds || S.devModeEnabled || S.studioOn) return;
    const b = c._bounds; if (!b || b.width < 2 || b.height < 2) return;
    const z = Math.max(c.width / b.width, c.height / b.height);
    // si otro cambió el zoom después de este ajuste, manda el de él
    if (c._ckZf != null && Math.abs(c.zoom - c._ckZf) > 0.002) { c._ckZ0 = null; c._ckZf = null; }
    if (c.zoom < z - 0.002) {
      if (c._ckZ0 == null) c._ckZ0 = c.zoom;
      c.setZoom(z); c._ckZf = z;
    } else if (c._ckZ0 != null && c.zoom > Math.max(c._ckZ0, z) + 0.002) {
      // la ventana se angostó: vuelve hacia el zoom que tenía
      const n = Math.max(c._ckZ0, z); c.setZoom(n); c._ckZf = n;
      if (n === c._ckZ0) { c._ckZ0 = null; c._ckZf = null; }
    }
  };
  // (va antes de que arranque la escena: Phaser toma el update de la escena una sola vez, al crearla)
  if (typeof MainGameScene !== 'undefined') {
    const up0 = MainGameScene.prototype.update;
    MainGameScene.prototype.update = function () {
      const r = up0 ? up0.apply(this, arguments) : undefined;
      try { ajustarZoom(this); } catch (e) {}
      return r;
    };
  }
  window.CK_ASPECTO = { anchoPara, acomodar, ajustarZoom, ALTO };
})();
