'use strict';
/* Tabla de conexiones (07/11, pedido del dueño: "agregá todo eso"; idea anotada en CAMBIOS_PENDIENTES). Para los mapas
   nuevos (el Claro de las Bestias, la región final) las salidas se cargan en UN solo lugar, en las dos direcciones:
     CK_CONEXIONES.unir('tierras_orcas', 'norte', 'claro_de_las_bestias', { centro: 480, ancho: 80 });
   arma la salida en el borde norte de Tierras Orcas, la de vuelta en el borde sur del Claro, y cada una te deja del lado
   por el que venís, a la misma altura del borde (la regla de CAMBIOS: "se aparece del lado por el que se viene").
   Opciones: centro (px a lo largo del borde, por omisión el medio), ancho (64), centroB (en el otro mapa, si no coincide),
   hint (el cartel). Los mapas son los ids del Taller (sin "ed_"). Las conexiones viejas siguen donde estaban; la prueba
   qa/probar_conexiones.py las recorre todas (viejas y nuevas) y avisa las que no cumplen la regla.
   Borrar la línea de index.html saca sólo las conexiones cargadas acá (hoy, ninguna). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA || {};
  const OPUESTO = { norte: 'sur', sur: 'norte', este: 'oeste', oeste: 'este' };
  const LISTA = [];      // { de, borde, a, centro, ancho, hint, nombre }
  const DESTINO = {};    // nombre de la salida → [mapa, llegada]
  const GROSOR = 18, ADENTRO = 34;
  const tam = id => { const m = D.mapas && D.mapas[id]; return m ? { w: m.w, h: m.h } : null; };
  const rect = (t, borde, centro, ancho) => {
    if (borde === 'norte') return { x: centro - ancho / 2, y: 0, w: ancho, h: GROSOR };
    if (borde === 'sur') return { x: centro - ancho / 2, y: t.h - GROSOR, w: ancho, h: GROSOR };
    if (borde === 'oeste') return { x: 0, y: centro - ancho / 2, w: GROSOR, h: ancho };
    return { x: t.w - GROSOR, y: centro - ancho / 2, w: GROSOR, h: ancho };
  };
  const llegada = (t, borde, centro) => {
    if (borde === 'norte') return { x: centro, y: ADENTRO + 10 };
    if (borde === 'sur') return { x: centro, y: t.h - ADENTRO };
    if (borde === 'oeste') return { x: ADENTRO, y: centro };
    return { x: t.w - ADENTRO, y: centro };
  };
  const flecha = { norte: '▲', sur: '▼', este: '▶', oeste: '◀' };
  const nombreDe = id => (D.mapas && D.mapas[id] && (D.mapas[id].titulo || D.mapas[id].nombre)) || id;
  const envueltos = {};
  const envolver = id => {
    if (envueltos[id]) return; const k = 'ed_' + id, L = INTERIOR_LAYOUTS[k]; if (!L) return; envueltos[id] = true;
    INTERIOR_LAYOUTS[k] = function (kit) {
      const r = L.apply(this, arguments);
      try {
        const a = kit.areas && kit.areas.main; if (!a) return r;
        a.exits = a.exits || [];
        LISTA.filter(c => c.de === id).forEach(c => { const q = rect(tam(id), c.borde, c.centro, c.ancho); a.exits.push(Object.assign(q, { key: 'walk', to: c.nombre, hint: c.hint })); });
      } catch (e) { console.warn('[conexiones]', e); }
      return r;
    };
  };
  const agregar = (de, borde, a, centro, ancho, centroB, hint) => {
    const tA = tam(de), tB = tam(a); if (!tA || !tB) { console.warn('[conexiones] no existe', de, a); return; }
    const lado = borde === 'norte' || borde === 'sur' ? tA.w : tA.h;
    centro = centro === undefined ? lado / 2 : centro;
    const nombre = 'ck_cx_' + LISTA.length, op = OPUESTO[borde];
    LISTA.push({ de, borde, a, centro, ancho, hint: hint || `${flecha[borde]} ${nombreDe(a)}`, nombre });
    DESTINO[nombre] = [a, llegada(tB, op, centroB)];
    envolver(de);
  };
  const unir = (de, borde, a, o) => {
    o = o || {};
    const tA = tam(de), tB = tam(a); if (!tA || !tB) { console.warn('[conexiones] no existe', de, a); return; }
    const ladoA = borde === 'norte' || borde === 'sur' ? tA.w : tA.h, ladoB = borde === 'norte' || borde === 'sur' ? tB.w : tB.h;
    const cA = o.centro === undefined ? ladoA / 2 : o.centro, cB = o.centroB === undefined ? Math.round(cA * ladoB / ladoA) : o.centroB, an = o.ancho || 64;
    agregar(de, borde, a, cA, an, cB, o.hint);
    agregar(a, OPUESTO[borde], de, cB, an, cA, o.hintVuelta);
  };
  const s0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    const d = typeof nombre === 'string' && DESTINO[nombre];
    if (d) { if (!this._doorTransition && this.ckEntrar) this.ckEntrar(d[0], d[1]); return; }
    return s0.apply(this, arguments);
  };
  window.CK_CONEXIONES = { unir, LISTA, DESTINO, OPUESTO };
})();
