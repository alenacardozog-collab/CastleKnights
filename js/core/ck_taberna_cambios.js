'use strict';
/* Taberna del Roble, cambios de muebles (11/11, pedido del dueño: "en la taberna hay una habitación con una mesa adentro,
   quitá la mesa y las sillas; de la taberna también quitá la fogata del medio, pero la iluminación queda igual").
   - Cuarto de abajo a la izquierda: se van la mesa y sus bancos (queda el cuarto libre para caminar).
   - Salón: se va el fogón del medio (el aro de piedra y el fuego animado). La luz cálida del salón NO cambia: las luces
     siguen donde estaban (se esconden los dibujos y su choque; no se toca la lista de cosas del mapa, de donde salen las
     luces y el brillo).
   Borrar la línea de index.html devuelve la mesa y el fogón. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype, ZONA = 'ed_taberna_2.main';
  // qué se quita: los dibujos (por el nombre de su imagen) y el choque que cae dentro de su rectángulo (x0, y0, x1, y1 del mapa)
  const QUITAR = [
    { tex: /^ed_t2_mesa_y_bancos_cuarto_izq/, rect: [22, 178, 68, 220] },
    { tex: /^(ed_t2_fogon|ck_tab_fogon)/, rect: [236, 132, 268, 164] }
  ];
  const aplicar = S => {
    const c = S.currentInterior; if (!c || !c.area) return;
    let z = ''; try { z = S.currentZoneKey(); } catch (e) {}
    if (z !== ZONA) return;
    const a = c.area;
    S.children.list.forEach(o => {
      if (!o || !o.active) return;
      const x = o.x - a.x, y = o.y - a.y;
      if (x < -20 || x > a.w + 20 || y < -20 || y > a.h + 20) return;
      if (o.texture && QUITAR.some(q => q.tex.test(o.texture.key))) { if (o.visible) o.setVisible(false); return; }
      if (o.type === 'Zone' && o.body && o.body.enable && QUITAR.some(q => x > q.rect[0] && x < q.rect[2] && y > q.rect[1] && y < q.rect[3] && o.width <= (q.rect[2] - q.rect[0]) && o.height <= (q.rect[3] - q.rect[1]))) o.body.enable = false;
    });
  };
  const m0 = P.onAreaShown;
  P.onAreaShown = function () { const r = m0 ? m0.apply(this, arguments) : undefined; try { aplicar(this); this.time.delayedCall(60, () => aplicar(this)); } catch (e) {} return r; };
  let acum = 0;
  const u0 = P.update;
  P.update = function (t, dt) { const r = u0.apply(this, arguments); if ((acum += dt || 16) > 500) { acum = 0; try { aplicar(this); } catch (e) {} } return r; };
  window.CK_TABERNA_CAMBIOS = { QUITAR };
})();
