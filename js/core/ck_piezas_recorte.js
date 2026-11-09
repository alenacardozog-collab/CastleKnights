'use strict';
/* Piso pegado fuera (06/11, pedido del dueño: "las partes cortadas mal: el personaje se mezcla con los cortes").
   Las piezas de los mapas dibujados en Flow se recortaron del dibujo entero y muchas traen, pegados alrededor del
   objeto, pedazos de la tierra o el pasto de al lado (manchones de piso con forma rara). Como el piso de la pieza es
   igual al del suelo, no se nota… hasta que el héroe pasa por detrás de la pieza (los pies más arriba que su base):
   ahí el manchón de piso se dibuja encima y le tapa las piernas, o lo parte al medio.
   Al armar cada mapa de la Frontera Orca (los de las ruinas, el castillo y el jardín sólo reciben la corrección de la
   base: ahí los objetos son del color de su piso), a cada pieza se le saca el piso pegado:
   - los colores del piso son los más frecuentes del suelo del mapa fuera de todas las piezas (ahí sólo hay piso);
   - las manchas de esos colores que entran desde el borde de la pieza se borran; lo que queda encerrado por líneas
     oscuras (el objeto) no se toca, y una mancha rodeada por partes claras del objeto (la panza de un barril entre sus
     flejes) tampoco. Si se iría más del 70 % de la pieza, no se la toca (es un objeto del color del piso);
   - después se recorta el aire que queda abajo y se corrige la base (baseY), que es por donde se ordena delante/detrás.
   Las piezas limpias quedan como texturas "<clave>_rcN"; las franjas de ck_profundidad.js se hacen después sobre la
   pieza limpia, y las "enteras" de ck_piezas_arregladas.js siguen enteras. No toca los datos del Taller ni sus PNG.
   El Camino al Castillo no se toca (ck_camino_prof.js ya lo ordena a mano). Borrar la línea de index.html lo deshace. */
(function () {
  if (typeof INTERIOR_LAYOUTS === 'undefined') return;
  const D = window.EDITOR_DATA || {};
  const CUBRE = 0.95,     // los colores del piso: los más frecuentes del suelo (fuera de las piezas) hasta cubrir esta parte
    FRANJA = 12,          // más los del suelo en esta franja (px) alrededor de la pieza
    CRECE = 18,           // la mancha de piso crece por píxeles vecinos de color parecido (suma RGB)
    OSCURO = 70,          // luminancia por debajo de la cual un píxel es contorno (frena el piso)
    POLVO = 14,           // pedacitos sueltos más chicos que esto (px) se van con el piso
    AIRE = 0.25,          // una mancha es piso si al menos esta parte de su borde da al aire o al borde de la pieza (o la
                          // mitad a contornos oscuros); la panza de un barril entre sus flejes da casi toda al objeto
    LINEAS = 0.5,         // una mancha con tantas líneas oscuras por píxel de área es objeto (tablas, flejes), no piso
    CUERPO = 40,          // un pedazo de objeto cuenta como tal si tiene al menos estos px (lo más chico es polvo del piso)
    MAX_QUITA = 0.7,      // si se iría más que esto de la pieza, se deja como está
    SALTEAR = /^ed_camino_al_castillo$/,
    // mapas donde se saca el piso pegado (revisados pieza por pieza, hojas en _scripts_ia/15_arreglos/qa/hojas). En los
    // demás sólo se corrige la base: la piedra gris de las ruinas, la paja del patio de armas o las copas verdes del
    // jardín son del color de su piso y el recorte se los comía.
    CON_PISO = ['tierras_orcas', 'pueblo_orco', 'fortaleza_orca', 'bosque_de_la_frontera'],
    NO = /^$/;            // piezas que no se tocan (clave exacta), por si hace falta
  const cache = (window.CK_PARTES = window.CK_PARTES || {});
  const hechas = {}; // clave+posición → { key, margen, quitado } | null
  const suelos = {};
  let n = 0;

  const pixeles = (s, key) => {
    if (!s.textures.exists(key)) return null;
    const img = s.textures.get(key).getSourceImage();
    if (!img || !img.width) return null;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    return { w: img.width, h: img.height, d: g.getImageData(0, 0, img.width, img.height).data };
  };
  const suelo = (s, key) => { if (suelos[key] === undefined) suelos[key] = pixeles(s, key); return suelos[key]; };

  // paleta del piso del mapa: colores del suelo FUERA de los rectángulos de todas las piezas (ahí sólo hay piso),
  // los más frecuentes hasta cubrir el 90 % de esos píxeles
  const pisoMapa = (G, m) => {
    if (G._piso) return G._piso;
    const tapado = new Uint8Array(G.w * G.h);
    (m.items || []).forEach(([key, x, y, flip, anim, o]) => {
      const a = D.assets && D.assets[key]; if (!a || !a.w) return;
      const sc = (o && o.escala) || 1, w = Math.ceil(a.w * sc) + 6, h = Math.ceil(a.h * sc) + 6;
      const x0 = Math.max(0, Math.round(x - w / 2)), y0 = Math.max(0, Math.round(y - h + 3));
      for (let yy = y0; yy < Math.min(G.h, y0 + h); yy++) for (let xx = x0; xx < Math.min(G.w, x0 + w); xx++) tapado[yy * G.w + xx] = 1;
    });
    const H = new Map(); let tot = 0;
    for (let i = 0; i < G.w * G.h; i++) {
      if (tapado[i]) continue;
      const j = i * 4; if (G.d[j + 3] < 200) continue;
      const k = Q(G.d[j], G.d[j + 1], G.d[j + 2]); H.set(k, (H.get(k) || 0) + 1); tot++;
    }
    const orden = [...H.entries()].sort((a, b) => b[1] - a[1]);
    const set = new Set(); let acum = 0;
    for (const [k, c] of orden) { set.add(k); acum += c; if (acum >= tot * CUBRE) break; }
    return (G._piso = set);
  };
  const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;
  // los colores van en cajitas de 8 niveles por canal: así los matices del mismo piso cuentan como uno
  const Q = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  const esPiso = (r, g, b, set) => set.has(Q(r, g, b));
  // el piso de al lado de la pieza: colores del suelo en la franja de alrededor que aparecen por lo menos en tres de
  // los cuatro lados (la tierra rodea a la pieza; un objeto vecino está de un solo lado y no entra)
  const pisoCerca = (G, x0, y0, w, h, global) => {
    const set = new Set(global), lados = [new Map(), new Map(), new Map(), new Map()];
    const sumar = (H, x, y) => {
      if (x < 0 || y < 0 || x >= G.w || y >= G.h) return;
      const j = (y * G.w + x) * 4; if (G.d[j + 3] < 200 || lum(G.d[j], G.d[j + 1], G.d[j + 2]) < OSCURO) return;
      const k = Q(G.d[j], G.d[j + 1], G.d[j + 2]); H.set(k, (H.get(k) || 0) + 1);
    };
    for (let x = x0 - FRANJA; x < x0 + w + FRANJA; x++) for (let f = 1; f <= FRANJA; f++) { sumar(lados[0], x, y0 - f); sumar(lados[1], x, y0 + h - 1 + f); }
    for (let y = y0; y < y0 + h; y++) for (let f = 1; f <= FRANJA; f++) { sumar(lados[2], x0 - f, y); sumar(lados[3], x0 + w - 1 + f, y); }
    const todos = new Set(); lados.forEach(H => H.forEach((c, k) => { if (c >= 3) todos.add(k); }));
    todos.forEach(k => { let n = 0; lados.forEach(H => { if ((H.get(k) || 0) >= 3) n++; }); if (n >= 3) set.add(k); });
    return set;
  };

  // componentes de píxeles (4 vecinos) y su tamaño, para tirar el polvo que queda
  const componentes = (keep, w, h) => {
    const comp = new Int32Array(w * h).fill(-1), tam = []; const cola = [];
    for (let i0 = 0; i0 < w * h; i0++) {
      if (!keep[i0] || comp[i0] >= 0) continue;
      const c = tam.length; tam.push(0); comp[i0] = c; cola.push(i0);
      while (cola.length) {
        const i = cola.pop(); tam[c]++;
        const x = i % w, y = (i - x) / w;
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([xx, yy]) => { if (xx < 0 || yy < 0 || xx >= w || yy >= h) return; const j = yy * w + xx; if (keep[j] && comp[j] < 0) { comp[j] = c; cola.push(j); } });
      }
    }
    return { comp, tam };
  };

  const recortar = (s, it, G, m) => {
    if (NO.test(it.key)) return null;
    const P = pixeles(s, it.key); if (!P || P.w < 4 || P.h < 4) return null;
    const flip = !!it.flipX, x0 = Math.round(it.x - P.w / 2), y0 = Math.round(it.baseY - P.h);
    const id = it.key + '|' + flip + '|' + x0 + '|' + y0;
    if (hechas[id] !== undefined) return hechas[id];
    const w = P.w, h = P.h, d = P.d, keep = new Uint8Array(w * h);
    let opacos = 0;
    for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 8) { keep[i] = 1; opacos++; }
    if (!opacos) return (hechas[id] = null);
    let quitado = 0;
    if (G) {
      const pal = m ? pisoCerca(G, x0, y0, w, h, pisoMapa(G, m)) : null;
      if (pal && pal.size) {
        // piso: píxeles del color del piso (y no oscuros: los contornos frenan) que se tocan con el borde o con el aire
        const piso = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) { const a = i * 4; if (keep[i] && lum(d[a], d[a + 1], d[a + 2]) >= OSCURO && esPiso(d[a], d[a + 1], d[a + 2], pal)) piso[i] = 1; }
        const fuera = new Uint8Array(w * h), cola = [];
        const meter = i => { if (piso[i] && !fuera[i]) { fuera[i] = 1; cola.push(i); } };
        for (let x = 0; x < w; x++) { meter(x); meter((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { meter(y * w); meter(y * w + w - 1); }
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x; if (keep[i]) continue;
          if (x > 0) meter(i - 1); if (x < w - 1) meter(i + 1); if (y > 0) meter(i - w); if (y < h - 1) meter(i + w);
        }
        while (cola.length) {
          const i = cola.pop(), x = i % w, y = (i - x) / w;
          if (x > 0) meter(i - 1); if (x < w - 1) meter(i + 1); if (y > 0) meter(i - w); if (y < h - 1) meter(i + w);
        }
        // la mancha crece por los matices parecidos del mismo piso (el dibujo tiene muchos tonos de la misma tierra)
        for (let paso = 0; paso < 40; paso++) {
          const nuevos = [];
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y * w + x; if (!keep[i] || fuera[i]) continue;
            const a = i * 4; if (lum(d[a], d[a + 1], d[a + 2]) < OSCURO) continue;
            const cerca = j => fuera[j] && Math.abs(d[a] - d[j * 4]) + Math.abs(d[a + 1] - d[j * 4 + 1]) + Math.abs(d[a + 2] - d[j * 4 + 2]) <= CRECE;
            if ((x > 0 && cerca(i - 1)) || (x < w - 1 && cerca(i + 1)) || (y > 0 && cerca(i - w)) || (y < h - 1 && cerca(i + w))) nuevos.push(i);
          }
          if (!nuevos.length) break;
          nuevos.forEach(i => (fuera[i] = 1));
        }
        // cada mancha que se iría tiene que estar rodeada de aire, de contornos oscuros o de polvo (así es el piso pegado
        // al lado de un objeto); si la rodea una parte grande y clara del objeto (la panza de un barril entre sus flejes),
        // es objeto y se queda
        const resto = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) resto[i] = keep[i] && !fuera[i] ? 1 : 0;
        const { comp: cr, tam: tr } = componentes(resto, w, h);
        const { comp: cf, tam: tf } = componentes(fuera, w, h);
        const aire = new Int32Array(tf.length), oscuro = new Int32Array(tf.length), claro = new Int32Array(tf.length);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x; if (!fuera[i]) continue;
          const c = cf[i];
          [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([xx, yy]) => {
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) { aire[c]++; return; }
            const j = yy * w + xx; if (fuera[j]) return;
            if (!keep[j]) { aire[c]++; return; }
            if (tr[cr[j]] < CUERPO) return;   // polvo del piso: no cuenta
            const a = j * 4; if (lum(d[a], d[a + 1], d[a + 2]) < OSCURO) oscuro[c]++; else claro[c]++;
          });
        }
        if (window.CK_PIEZAS_RECORTE && window.CK_PIEZAS_RECORTE.dbg) window.CK_PIEZAS_RECORTE.dbg[it.key] = tf.map((t, c) => [t, aire[c], oscuro[c], claro[c]]).filter(q => q[0] > 20);
        if (window.CK_PIEZAS_RECORTE && window.CK_PIEZAS_RECORTE.dbg) window.CK_PIEZAS_RECORTE.dbg[it.key + '_mapa'] = { w, h, piso: Array.from(piso), fuera: Array.from(fuera) };
        // una mancha de piso es lisa: pocas líneas oscuras por píxel (el cuerpo de un cofre tiene sus tablas marcadas)
        const esTierra = c => { const t = Math.max(1, aire[c] + oscuro[c] + claro[c]); if (oscuro[c] / tf[c] >= LINEAS) return false; return aire[c] / t >= AIRE || oscuro[c] / t >= 0.5 || (aire[c] + oscuro[c]) / t >= 0.75; };
        for (let i = 0; i < w * h; i++) { if (fuera[i] && !esTierra(cf[i])) fuera[i] = 0; }
        for (let i = 0; i < w * h; i++) if (fuera[i]) quitado++;
        if (quitado / opacos > MAX_QUITA) quitado = 0;   // objeto del color del piso: no se toca
        else if (quitado) {
          for (let i = 0; i < w * h; i++) if (fuera[i]) keep[i] = 0;
          // el polvo que queda del piso (motas y pedacitos sueltos) se va; los agujeritos adentro del objeto se tapan
          const { comp, tam } = componentes(keep, w, h);
          const mayor = Math.max(...tam);
          for (let i = 0; i < w * h; i++) if (keep[i] && tam[comp[i]] < Math.max(POLVO, mayor * 0.01)) { keep[i] = 0; quitado++; }
          const vec = (k, x, y) => { let c = 0; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { if ((xx === x && yy === y) || xx < 0 || yy < 0 || xx >= w || yy >= h) continue; if (k[yy * w + xx]) c++; } return c; };
          const k2 = keep.slice();
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!keep[i] && d[i * 4 + 3] > 8 && vec(keep, x, y) >= 7) k2[i] = 1; }
          keep.set(k2);
        }
      }
    }
    // base de verdad: la fila más baja con algo
    let bajo = -1;
    for (let y = h - 1; y >= 0 && bajo < 0; y--) for (let x = 0; x < w; x++) if (keep[y * w + x]) { bajo = y; break; }
    if (bajo < 0) return (hechas[id] = null);
    const margen = h - 1 - bajo;
    if (!quitado && margen < 2) return (hechas[id] = null);   // ya estaba bien
    const nh = bajo + 1, key = it.key + '_rc' + (n++);
    const t = s.textures.createCanvas(key, w, nh), g = t.getContext(), out = g.createImageData(w, nh), o = out.data;
    for (let y = 0; y < nh; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!keep[i]) continue;
      const a = i * 4; o[a] = d[a]; o[a + 1] = d[a + 1]; o[a + 2] = d[a + 2]; o[a + 3] = d[a + 3];
    }
    g.putImageData(out, 0, 0); t.refresh();
    if (cache[it.key] === null) { cache[key] = null; cache[key + '_esp'] = null; }   // las "enteras" siguen enteras
    return (hechas[id] = { key, margen, quitado, opacos });
  };

  const envolver = id => {
    const kind = 'ed_' + id, L = INTERIOR_LAYOUTS[kind];
    if (!L) return;
    INTERIOR_LAYOUTS[kind] = function (kit) {
      const r = L.apply(this, arguments);
      try {
        const a = kit.areas && kit.areas.main, s = window.activeGameScene, m = D.mapas[id];
        if (!a || !s || !a.items || !m) return r;
        const G = CON_PISO.indexOf(id) >= 0 ? suelo(s, m.suelo) : null;
        a.items.forEach(it => {
          const apto = it.key && /^ed_/.test(it.key) && !/^ed_suelo_|_p\d+$|_rc\d+$/.test(it.key) && !it.anim && !it.floor && !it.lift &&
            (it.scale || 1) === 1 && it.ox === undefined && it.oy === undefined && s.textures.exists(it.key);
          if (!apto) return;
          const rc = recortar(s, it, G, m);
          if (!rc) return;
          it.key = rc.key; it.baseY -= rc.margen;
        });
      } catch (e) { console.warn('[piezas recorte]', kind, e); }
      return r;
    };
  };
  Object.keys(D.mapas || {}).filter(id => !D.mapas[id].origen && D.mapas[id].items && !SALTEAR.test('ed_' + id)).forEach(envolver);
  window.CK_PIEZAS_RECORTE = { hechas, recortar, suelo, pixeles, CON_PISO, CUBRE, FRANJA, CRECE, OSCURO, POLVO, AIRE, LINEAS, CUERPO, MAX_QUITA };
})();
