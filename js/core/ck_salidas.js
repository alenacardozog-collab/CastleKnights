'use strict';
/* Salidas a la aldea en su lugar (11/11, pedido del dueño: "cuando sale de la taberna aparece en el medio del mapa;
   corregí que las salidas, entradas y pasos por los lugares sean como correspondan y salgan donde deben salir").
   El juego guardaba UN solo "por dónde entré" (la última puerta usada). Si al lugar se llegó de otra forma (el prólogo
   te despierta en la taberna, una partida que continúa adentro, un viaje de mapa en mapa, una escena) ese dato no
   estaba o era de otra puerta, y al salir el héroe caía en el medio de la aldea o frente a otra casa.
   Ahora, al volver a la aldea, se mira DE DÓNDE se sale y se aparece en la puerta o el camino de ese lugar:
   - la taberna, la casa grande (y sus cuartos de arriba), el granero y la tienda → frente a su puerta;
   - el castillo y todo lo suyo (camino, patios, jardín, muralla, salones) → el camino del sur;
   - los Campos, Brumavieja y la Frontera → el sendero del oeste.
   Si el "por dónde entré" ya era ese mismo lugar (a menos de 60 px) se respeta tal cual (la altura exacta del camino).
   Los pasos entre mapas (cada salida deja del lado por el que se viene) siguen en ck_conexiones.js y en cada mapa; los
   revisa la prueba "Conexiones entre mapas". Borrar la línea de index.html vuelve a lo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PUERTAS = [[/^(bar$|ed_taberna)/, 'bar'], [/^(casa$|ed_casa_)/, 'casa'], [/^(granero$|ed_granero)/, 'granero'], [/^(tienda$|ed_tienda)/, 'tienda']];
  const CASTILLO = /^(castle$|ed_(camino_al_castillo|patio_|jardin_real|muralla|salon_del_trono|aposentos|biblioteca|herreria|cocina_real))/;
  const libre = (S, x, y) => { try { return !S.navIsFree || S.navIsFree(x, y); } catch (e) { return true; } };
  /** Dónde se aparece en la aldea al salir de un lugar (kind del edificio o del mapa). */
  const destino = (S, kind) => {
    const p = PUERTAS.find(([re]) => re.test(kind));
    if (p) {
      const d = (S.doorSprites || []).find(o => o._interiorKind === p[1]);
      return d ? { x: d.x, y: d.y + 10, tipo: 'puerta' } : null;
    }
    if (CASTILLO.test(kind)) return { x: 540, y: (S.mapHeight || 640) - 30, tipo: 'sur' };
    const R = typeof RUINS_ROAD_EXIT !== 'undefined' ? RUINS_ROAD_EXIT : null;
    if (R && /^(ruins$|ed_)/.test(kind)) return { x: R.retX, y: R.retY || (R.y0 + R.y1) / 2, tipo: 'oeste' };
    return null;
  };
  const sal0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior;
    if (c && c.building && !this._doorTransition) this._ckSaleDe = { kind: c.building.kind || '', t: Date.now() };
    return sal0.apply(this, arguments);
  };
  const acomodar = S => {
    const q = S._ckSaleDe; S._ckSaleDe = null;
    if (!q || Date.now() - q.t > 4000 || S.currentInterior || !S.player) return;
    const d = destino(S, q.kind); if (!d) return;
    const r = S._interiorReturn;
    // el camino del sur y el sendero del oeste: se respeta por dónde se entró si fue por ahí mismo (a lo largo del borde)
    const cerca = r && (d.tipo === 'sur' ? Math.abs(r.y - d.y) < 30 && Math.abs(r.x - d.x) < 120 : d.tipo === 'oeste' ? Math.abs(r.x - d.x) < 30 && Math.abs(r.y - d.y) < 60 : Math.hypot(r.x - d.x, r.y - d.y) < 60);
    if (cerca) return;
    let { x, y } = d;
    if (!libre(S, x, y)) { for (const [dx, dy] of [[0, 8], [0, 16], [-10, 12], [10, 12], [0, -8]]) if (libre(S, x + dx, y + dy)) { x += dx; y += dy; break; } }
    S.placePlayerFeetAt(x, y);
    S._interiorReturn = { x, y, zoom: (r && r.zoom) || 1.5 };
    const cam = S.cameras.main; cam.centerOn(S.player.x, S.player.y);
  };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () {
    try { acomodar(this); } catch (e) { console.warn('[salidas]', e); }
    return ald0 ? ald0.apply(this, arguments) : undefined;
  };
  window.CK_SALIDAS = { destino };
})();
