'use strict';
/* El héroe nunca queda escondido detrás del HUD (27/10). En los mapas que entran justo en la pantalla (la taberna, las salas)
   la cámara no puede bajar más y, al entrar por la puerta de abajo o caminar por el borde, el héroe quedaba debajo de la
   barra rápida, los orbes o el minimapa. Ahora la pieza que lo tapa se vuelve casi transparente mientras está detrás.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PIEZAS = '#ck-quick, #ck-antorcha, #ck-hab-r, .ck2-orbe, .ck2-monedas, .ck2-nombre, #ck-minimapa, #ck-objective';
  const MARGEN = 6;   // píxeles de pantalla alrededor del héroe

  const css = () => {
    if (document.getElementById('ck-hud-detras-css')) return;
    const st = document.createElement('style'); st.id = 'ck-hud-detras-css';
    st.textContent = '.ck-tras{opacity:.3 !important;transition:opacity .2s}';
    document.head.append(st);
  };

  let piezas = [], hasta = 0;
  const u0 = P.update;
  P.update = function (time) {
    const r = u0.apply(this, arguments);
    try {
      const p = this.player, b = p && p.body;
      // en diálogos, ventanas y fuera de la campaña cada pieza vuelve a lo suyo (el diálogo esconde la barra rápida)
      const activo = b && p.visible && this._gameMode === 'campaign' && !this.dialogOpen && !this._overlay && !document.body.classList.contains('ck2-dlg');
      if (time > hasta) { hasta = time + 1000; piezas = [...document.querySelectorAll(PIEZAS)]; css(); }
      if (!activo) { piezas.forEach(e => e.classList.remove('ck-tras')); return r; }
      // dónde está el héroe en la pantalla: de los pies hasta la cabeza (unos 36 px del mundo)
      const cam = this.cameras.main, v = cam.worldView, c = this.game.canvas.getBoundingClientRect();
      const kx = c.width / v.width, ky = c.height / v.height;
      const x0 = c.left + (b.center.x - 13 - v.x) * kx - MARGEN, x1 = c.left + (b.center.x + 13 - v.x) * kx + MARGEN;
      const y0 = c.top + (b.bottom - 36 - v.y) * ky - MARGEN, y1 = c.top + (b.bottom - v.y) * ky + MARGEN;
      piezas.forEach(e => {
        const q = e.getBoundingClientRect();
        const tapa = q.width > 0 && q.left < x1 && q.right > x0 && q.top < y1 && q.bottom > y0;
        if (tapa !== e.classList.contains('ck-tras')) e.classList.toggle('ck-tras', tapa);
      });
    } catch (e) {}
    return r;
  };
})();
