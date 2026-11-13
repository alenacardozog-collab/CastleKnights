'use strict';
/* Pies de las piezas: el choque de cada objeto sale de su dibujo (13/11, pedido del dueño: "generá un sistema de hitboxes que
   respete milimétricamente la composición de una imagen y ponlas de manera que el mapa se pueda usar a la perfección, que no
   atraviese ni pase por encima de terrenos que no debería"; "en los interiores también camino por donde no debería").
   Los mapas del Taller traen su máscara de lo caminable, medida a mano. Donde la máscara se olvidó de un objeto (un tendedero,
   un árbol, una cama) el héroe lo pisaba. Al mostrar cada zona, este archivo mira cada pieza dibujada (también las que otros
   archivos agregan por código) y, si su PIE no está cubierto por los choques que ya hay, le pone el suyo, medido del dibujo:
   - el pie es la franja de abajo de los píxeles opacos: FINA para lo que tiene tronco o poste (árboles, faroles, carteles,
     estandartes: se pasa por detrás de la copa), MEDIA para los objetos sueltos (barriles, cajas, carretas) y ALTA (poco más de
     la mitad del dibujo) para lo que es construcción o mueble macizo (casas, muros, rocas, camas, mesas, nidos);
   - lo que es suelo o se cruza por encima no choca (alfombras, charcos, huesitos, tablones, el tronco caído del arroyo, los
     portones y arcos que son una salida), y lo marcado como piso en el Taller tampoco;
   - los choques se arman en cuadritos de 2 px sobre los píxeles opacos de la franja, así siguen la forma (una carreta en
     diagonal, una roca redonda) y no el cuadro entero;
   - si la máscara ya tapa la mayor parte del pie, se la deja como está (la medida a mano manda).
   Además, por zona, se pueden QUITAR choques de la máscara que estorban (rectángulos del mapa) y PONER otros a mano.
   API: CK_PIES_PIEZAS.QUITAR['ed_<mapa>.main'] = [[x0, y0, x1, y1], …];  .PONER[zona] = [[x, y, w, h], …];
        .SIN.push(/clave/) para que una pieza no choque;  .FINO / .MACIZO: qué piezas llevan franja fina o alta;
        .revisar(escena) → las piezas de la zona actual que recibieron pie (clave, lugar y cuánto tapaba la máscara).
   Va al final de index.html, después de todos los mapas (así ve sus piezas), antes de game.js. Borrar su línea lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype;
  const Q = 2;                                  // cuadrícula de los choques (px)
  const CUBIERTO = 0.6;                         // con esta parte del pie ya tapada por la máscara, la pieza se deja como está
  const MINIMO = 10;                            // dibujos más bajos que esto (px) no chocan: piedritas, huesitos, flores
  const FINO = /arbol|pino|roble|sauce|palmera|seco|arbusto|mata|helecho|hongo|seta|poste|farol|antorcha|estandarte|bandera|cartel|cruz(?!_)|estatua|columna|pilar|totem|cactus|espantapajaros|palo|brasero|candelabro|tendedero|molino|torre|campana|horca|percha|letrero|angel|rey_\d|lampara|velon|cirio/;
  const MACIZO = /casa|choza|caba|posada|taberna|herreri|capilla|muro|muralla|pared|cerco|valla|empalizada|carpa|tienda|establo|granero|cobertizo|puesto|mausoleo|osario|cripta|santuario|altar|ruina|iglesia|castillo|fortaleza|barricada|estaca|roca|penasco|acantilado|pozo|fuente|carreta|carro|jaula|nido|cama|mesa|mostrador|barra|estante|biblioteca|armario|cofre|baul|barril|tonel|cajon|caja|yunque|fragua|horno|chimenea|hogar|fogon|fogata|tumba|sarcofago|obelisco|bloque|pila|banco|silla|trono|cuna|tina|cuba|parva|fardo|saco|piedra|costillar|calaveras|derrumbe|lapida|mesada|cocina|tocon|monolito|templo|portico|carpa|tienda|yunque|pesebre|abrevadero|cerca|reja_|portal_piedra/;
  const SIN = [
    /^ed_suelo_/,
    /foso|agua|\brio\b|_rio_|lago|laguna|estanque|charca|puente|canal|cascada|arroyo|pantano|orilla/,   // el agua y los puentes los dibuja la máscara (el foso del castillo tapaba el camino del este)
    /alfombra|tapete|charco|mancha|sombra|sangre|hoja|huella|baldosa|losa|camino|sendero|grieta|musgo|telarana|pasto|hierba|flor|rama|guijarro|polvo|ceniza|agua|nieve|hielo|runa|circulo|marca|rastro|escalon|escalera|peldano|tabla|tablon|puente|rejilla|desague|trampa|placa|luz|rayo|humo|niebla|ventana|tapiz|cortina|porton|arco|entrada|tunel|boca|portal|paso|tronco_caido|hueso|cadena|soga|cuerda|vela|papel|pergamino|plato|vaso|jarra|fruta|pan\b|queso|moneda|llave|cristal_suelo|pluma|libro_suelo|nota|carta|trapo|ropa|bota|barro|lodo|lava|brasa|chispa|resplandor|brillo|halo|magma|raices|raiz|charquito|hoyo|sumidero|boca_de|salida|puerta_abierta|umbral|rastrillo_suelo|paja_suelta|heno_suelto|pisada|reguero|surco/
  ];
  const QUITAR = {                              // zona → [[x0, y0, x1, y1], …] (coordenadas del mapa) que se sacan de la máscara
    // (13/11) Camino al Castillo: dos pedacitos de la máscara en la franja del este (x 1416-1432, y 408-432) angostaban el paso
    // hacia el Bosque de la Frontera a menos de lo que mide el héroe: con la barricada abierta no se llegaba a la salida
    'ed_camino_al_castillo.main': [[1412, 404, 1436, 436]]
  };
  const PONER = {};                             // zona → [[x, y, w, h], …] que se agregan
  const informe = {};                           // zona → piezas que recibieron pie

  // ------------------------------------------------------------------ píxeles opacos de un cuadro (una vez por textura)
  const cache = new Map();
  const pixeles = (S, o) => {
    const fr = o.frame, k = o.texture.key + '|' + fr.name;
    if (cache.has(k)) return cache.get(k);
    let r = null;
    try {
      const src = fr.source.image || fr.source.canvas, w = fr.cutWidth, h = fr.cutHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, A = new Uint8Array(w * h);
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { A[y * w + x] = 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (y1 >= 0) r = { w, h, A, x0, y0, x1, y1, vw: x1 - x0 + 1, vh: y1 - y0 + 1 };
    } catch (e) { r = null; }
    cache.set(k, r);
    return r;
  };
  // cuántos píxeles de abajo del dibujo son "el pie", según qué es la pieza
  const franja = (key, vw, vh) => {
    if (FINO.test(key)) return Math.max(3, Math.min(14, Math.round(vh * 0.12)));
    if (MACIZO.test(key) || (vw >= 48 && vh >= 40)) return Math.round(vh * 0.55);
    return Math.max(4, Math.min(26, Math.round(vh * 0.35)));
  };
  const zonaDe = S => (S.currentZoneKey && S.currentZoneKey()) || '';

  // ------------------------------------------------------------------ armar los pies de la zona (una vez por área)
  const armar = S => {
    const c = S.currentInterior, a = c && c.area;
    if (!a || a._ckPies || !S.interiorObstacles) return;
    a._ckPies = [];
    const zona = zonaDe(S), ax = a.x, ay = a.y, W = a.w, H = a.h;
    const gw = Math.ceil(W / Q), gh = Math.ceil(H / Q);
    const tapado = new Uint8Array(gw * gh), nuevo = new Uint8Array(gw * gh);
    const pintar = (m, x, y, w, h) => {
      const gx0 = Math.max(0, Math.floor(x / Q)), gx1 = Math.min(gw - 1, Math.ceil((x + w) / Q) - 1);
      const gy0 = Math.max(0, Math.floor(y / Q)), gy1 = Math.min(gh - 1, Math.ceil((y + h) / Q) - 1);
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) m[gy * gw + gx] = 1;
    };
    [S.interiorObstacles, S.obstacles, S.waterObstacles, S.lowObstacles].filter(Boolean).forEach(g => g.getChildren().forEach(z => {
      const b = z.body; if (!b || !b.enable || z._ckPie) return;
      if (b.right < ax || b.x > ax + W || b.bottom < ay || b.y > ay + H) return;
      pintar(tapado, b.x - ax, b.y - ay, b.width, b.height);
    }));
    const lista = [];
    (a.objs || []).forEach(o => {
      if (!o || !o.active || !o.texture || !o.frame || o.type === 'Zone' || o.body) return;
      const key = o.texture.key, tira = /_p\d+$/.test(key);
      // las franjas de ck_profundidad (muebles de los interiores viejos partidos en columnas): sólo adentro, con un pie corto
      // medido en cada franja (afuera, la franja del borde de una copa pondría un pie debajo de la copa)
      if (!/^ed_/.test(key) || (tira && a.outdoor) || SIN.some(r => r.test(key.replace(/(_esp)?_p\d+$/, '')))) return;
      const px = pixeles(S, o); if (!px || px.vh < MINIMO) return;
      const sx = o.scaleX, sy = o.scaleY;
      const banda = Math.min(px.vh, tira ? Math.max(3, Math.min(12, Math.round(px.vh * 0.2))) : Math.round(franja(key, px.vw * sx, px.vh * sy)));
      const left = o.x - o.displayWidth * o.originX, top = o.y - o.displayHeight * o.originY;
      let tot = 0, cub = 0; const celdas = [];
      for (let y = px.y1 - banda + 1; y <= px.y1; y++) for (let x = px.x0; x <= px.x1; x++) {
        if (!px.A[y * px.w + x]) continue;
        const tx = o.flipX ? px.w - 1 - x : x;
        const gx = Math.floor((left + tx * sx - ax) / Q), gy = Math.floor((top + y * sy - ay) / Q);
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
        tot++;
        if (tapado[gy * gw + gx]) cub++; else celdas.push(gy * gw + gx);
      }
      if (!tot || cub / tot >= CUBIERTO) return;
      celdas.forEach(i => { nuevo[i] = 1; });
      lista.push({ clave: key, x: Math.round(o.x - ax), y: Math.round(o.y - ay), tapaba: +(cub / tot).toFixed(2), alto: Math.round(px.vh * sy) });
    });
    (PONER[zona] || []).forEach(([x, y, w, h]) => pintar(nuevo, x, y, w, h));
    // rectángulos: corridas por fila, pegadas hacia abajo cuando coinciden
    const rects = []; let prev = null;
    for (let gy = 0; gy < gh; gy++) {
      const cur = new Map(); let gx = 0;
      while (gx < gw) {
        if (!nuevo[gy * gw + gx]) { gx++; continue; }
        let x1 = gx; while (x1 + 1 < gw && nuevo[gy * gw + x1 + 1]) x1++;
        const k = gx + '_' + x1, r = prev && prev.get(k);
        if (r && r.y1 === gy - 1) { r.y1 = gy; cur.set(k, r); }
        else { const nr = { x0: gx, x1, y0: gy, y1: gy }; rects.push(nr); cur.set(k, nr); }
        gx = x1 + 1;
      }
      prev = cur;
    }
    rects.forEach(r => {
      const w = (r.x1 - r.x0 + 1) * Q, h = (r.y1 - r.y0 + 1) * Q;
      const z = S.add.zone(ax + r.x0 * Q + w / 2, ay + r.y0 * Q + h / 2, w, h);
      S.physics.add.existing(z, true);
      z._ckPie = true;
      S.interiorObstacles.add(z);
      a.objs.push(z);
      a._ckPies.push(z);
    });
    informe[zona] = lista;
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { armar(this); } catch (e) { console.warn('[pies de las piezas]', e); }
    return r;
  };

  // ------------------------------------------------------------------ QUITAR / PONER sobre la máscara del Taller (al armar el mapa)
  const restar = (c, b) => {                    // el choque c sin la caja b (hasta 4 pedazos)
    const out = [], cx1 = c.x + c.w, cy1 = c.y + c.h;
    if (c.x >= b[2] || cx1 <= b[0] || c.y >= b[3] || cy1 <= b[1]) return [c];
    if (c.y < b[1]) out.push({ x: c.x, y: c.y, w: c.w, h: b[1] - c.y });
    if (cy1 > b[3]) out.push({ x: c.x, y: b[3], w: c.w, h: cy1 - b[3] });
    const y0 = Math.max(c.y, b[1]), y1 = Math.min(cy1, b[3]);
    if (c.x < b[0]) out.push({ x: c.x, y: y0, w: b[0] - c.x, h: y1 - y0 });
    if (cx1 > b[2]) out.push({ x: b[2], y: y0, w: cx1 - b[2], h: y1 - y0 });
    return out.filter(q => q.w > 0 && q.h > 0);
  };
  Object.keys(INTERIOR_LAYOUTS).forEach(kind => {
    const L0 = INTERIOR_LAYOUTS[kind];
    if (typeof L0 !== 'function') return;
    INTERIOR_LAYOUTS[kind] = function (kit) {
      const r = L0.apply(this, arguments);
      try {
        Object.keys(kit.areas || {}).forEach(nombre => {
          const a = kit.areas[nombre], zona = kind + '.' + nombre;
          if (!a) return;
          const q = QUITAR[zona];
          if (q && q.length && a.colliders) a.colliders = a.colliders.reduce((acc, c) => acc.concat(q.reduce((cs, b) => cs.reduce((o, cc) => o.concat(restar(cc, b)), []), [c])), []);
        });
      } catch (e) { console.warn('[pies de las piezas] quitar', kind, e); }
      return r;
    };
  });

  window.CK_PIES_PIEZAS = { QUITAR, PONER, SIN, FINO, MACIZO, Q, CUBIERTO, informe, revisar: S => informe[zonaDe(S || window.activeGameScene)] || [] };
})();
