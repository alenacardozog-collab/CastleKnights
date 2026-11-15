'use strict';
/* Arreglos de las notas de prueba (14/11, pedido del dueño: "te deje todas las notas de los arreglos del juego, terminalas").
   El dueño recorrió los mapas con la herramienta de notas (ck_notas_prueba.js) y marcó con un trazo cada lugar donde el héroe
   pasaba por encima de algo, quedaba tapado sin razón o chocaba con un choque invisible. Este archivo arregla esos lugares,
   mapa por mapa, sin tocar los datos del Taller ni sus PNG (todo se aplica al armar cada mapa):
   - piso:     piezas que en realidad son suelo (bordes del sendero, manchas de tierra, raíces, parches): se dibujan debajo de
               todo y no llevan choque. En estos mapas el suelo trae dibujado todo; la pieza sólo sirve para tapar al héroe.
   - base:     dónde apoya de verdad la pieza (y del mapa): por ahí se ordena delante/detrás. Sirve cuando la pieza trae algo
               pegado más abajo (un pedazo de sendero, una sombra) y tapaba al héroe parado delante.
   - corrimiento: lo mismo pero relativo (sube o baja la línea de orden de todas las franjas de la pieza).
   - recorte:  de la pieza queda sólo lo que cae adentro de esos rectángulos (coordenadas del mapa); el resto lo dibuja el suelo.
   - partes:   la pieza se parte en pedazos y cada uno se ordena por su propia base (una copa y unas rocas que venían juntas).
               Cada parte: { r: [[x0, y0, x1, y1], …], base: y, gris: true|false } (gris: sólo los píxeles grises: piedra).
   - tapa:     pedazos del SUELO que pasan a tapar al héroe cuando está detrás (un techo, un tronco, una copa dibujados en el
               suelo): { r: [[x0, y0, x1, y1], …], base: y, sin: 'verde'|… (colores que no se copian) }.
   - ponerSuave: choques que pasan por la guardia de ck_pies_piezas (si cierran un paso, se abre el ancho del héroe).
   - poner / quitar: choques firmes que se agregan ([x, y, w, h]) o se sacan de la máscara del Taller ([x0, y0, x1, y1]);
               los que se agregan no pasan por la guardia de ck_pies_piezas (se revisó a mano que no cierren pasos).
   - translucido: piezas grandes que se aclaran cuando el héroe pasa por detrás (las aspas del molino de Brumavieja).
   Va después de ck_pies_piezas.js en index.html. Borrar su línea deja todo como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = {};
  const def = (zona, o) => { Z[zona] = Object.assign(Z[zona] || {}, o); };

  // ================================================================== DATOS POR MAPA (se completan abajo, mapa por mapa)
  window.CK_NOTAS_ARREGLOS_DEF = def;

  // ================================================================== mecanismo
  const esDe = (k, base) => k === base || new RegExp('^' + base + '(_esp)?(_rc\\d+)?(_p\\d+)?(_na\\d+)?$').test(k);
  const ed = k => (/^ed_/.test(k) ? k : 'ed_' + k);
  const zonaDe = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';

  // piezas que no se parten en franjas (las que se recortan o se parten acá)
  const enteras = new Set();
  const PE0 = window.CK_PROF_ENTEROS;
  window.CK_PROF_ENTEROS = { test: k => enteras.has(k) || !!(PE0 && PE0.test(k)), source: PE0 ? PE0.source : '' };

  // píxeles de una textura (cuadro entero)
  const leer = (s, key) => {
    const fr = s.textures.getFrame(key); if (!fr) return null;
    const w = fr.cutWidth, h = fr.cutHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
    return { w, h, c, g, img: g.getImageData(0, 0, w, h) };
  };
  // ubicación de un item en el mapa: píxel (tx, ty) de su textura → (x, y) del mapa
  const ubicar = (it, w, h) => {
    const sc = it.scale || 1, ox = it.ox === undefined ? 0.5 : it.ox, oy = it.oy === undefined ? 1 : it.oy;
    const left = it.x - w * sc * ox, top = it.baseY - (it.lift || 0) - h * sc * oy;
    return (tx, ty) => [left + (it.flipX ? w - 1 - tx : tx) * sc, top + ty * sc];
  };
  const dentro = (rs, x, y) => rs.some(r => x >= r[0] && x < r[2] && y >= r[1] && y < r[3]);
  const gris = (d, i) => { const r = d[i], g = d[i + 1], b = d[i + 2], M = Math.max(r, g, b), m = Math.min(r, g, b); return M - m <= Math.max(14, M * 0.16); };
  let nTex = 0;
  // textura nueva con los píxeles de `src` que cumplen `quedan(x, y del mapa, datos, índice)`
  const filtrar = (s, src, at, quedan, nombre) => {
    const out = document.createElement('canvas'); out.width = src.w; out.height = src.h;
    const og = out.getContext('2d'), od = og.createImageData(src.w, src.h), d = src.img.data, o = od.data;
    let n = 0;
    for (let ty = 0; ty < src.h; ty++) for (let tx = 0; tx < src.w; tx++) {
      const i = (ty * src.w + tx) * 4; if (d[i + 3] < 8) continue;
      const [mx, my] = at(tx, ty);
      if (!quedan(mx + 0.5, my + 0.5, d, i)) continue;
      o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3]; n++;
    }
    og.putImageData(od, 0, 0);
    const k = nombre + '_na' + (nTex++);
    s.textures.addCanvas(k, out);
    return n ? k : null;
  };

  const preparar = (zona, z) => {
    if (z._listo) return; z._listo = true;
    ['recorte', 'borrar', 'partes'].forEach(t => Object.keys(z[t] || {}).forEach(k => enteras.add(ed(k))));
    const PP = window.CK_PIES_PIEZAS;
    if (PP) {
      if (z.ponerSuave) PP.PONER[zona] = (PP.PONER[zona] || []).concat(z.ponerSuave);   // estos sí pasan por la guardia
      (z.piso || []).concat(z.sinPie || [], z.pieFino || []).forEach(k => PP.SIN.push(new RegExp('^' + ed(k) + '(_esp)?(_rc\\d+)?(_na\\d+)?$')));
    }
  };
  // claves pre-armado (antes de que el Taller arme el mapa): las piezas "enteras" y los choques
  const pre = () => Object.keys(Z).forEach(zona => preparar(zona, Z[zona]));

  // el suelo del mapa (una vez por clave): retoques del dibujo (copiar un pedazo sobre otro) antes de usarlo
  const suelos = {};
  let zonaDeKind = '';
  const suelo = (s, a, z) => {
    let fk = a.groundKey;
    if (!fk) { const m = /^ed_(\w+)\.main$/.exec(zonaDeKind || ''), D = window.EDITOR_DATA; fk = m && D && D.mapas && D.mapas[m[1]] ? D.mapas[m[1]].suelo : null; }
    if (!fk || !s.textures.exists(fk)) return null;
    if (suelos[fk]) return suelos[fk];
    const src = leer(s, fk); if (!src) return null;
    if (z && z.sueloCopia && z.sueloCopia.length) {
      // [dx, dy, sx, sy, w, h]: copia el pedazo (sx, sy, w, h) del suelo a (dx, dy) — p. ej. borrar unas tablas de un cerco.
      // Si el suelo ya es un lienzo (San Roque: ck_san_roque.js le pinta encima el parche de las gallinas) se pinta en ese
      // mismo lienzo, así lo que otro archivo le pinte después no se pierde
      const t = s.textures.get(fk), g0 = t && t.getContext && t.getContext();
      if (g0) {
        z.sueloCopia.forEach(([dx, dy, sx, sy, w, h]) => { const d = g0.getImageData(sx, sy, w, h); g0.putImageData(d, dx, dy); });
        if (t.refresh) t.refresh();
      } else {
        const g = src.g; g.putImageData(src.img, 0, 0);
        z.sueloCopia.forEach(([dx, dy, sx, sy, w, h]) => g.drawImage(src.c, sx, sy, w, h, dx, dy, w, h));
        src.img = g.getImageData(0, 0, src.w, src.h);
        s.textures.remove(fk);
        s.textures.addCanvas(fk, src.c);
      }
    }
    return (suelos[fk] = src);
  };
  // agujeros de una pieza (lo transparente que no toca el borde): se rellenan con el suelo de ese lugar
  const rellenar = (s, src, at, fl) => {
    const W = src.w, H = src.h, d = src.img.data, afuera = new Uint8Array(W * H), pila = [];
    const vacio = i => d[i * 4 + 3] < 40;
    for (let x = 0; x < W; x++) { [x, (H - 1) * W + x].forEach(i => { if (vacio(i) && !afuera[i]) { afuera[i] = 1; pila.push(i); } }); }
    for (let y = 0; y < H; y++) { [y * W, y * W + W - 1].forEach(i => { if (vacio(i) && !afuera[i]) { afuera[i] = 1; pila.push(i); } }); }
    while (pila.length) {
      const i = pila.pop(), x = i % W;
      [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W].forEach(j => { if (j >= 0 && j < W * H && !afuera[j] && vacio(j)) { afuera[j] = 1; pila.push(j); } });
    }
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const og = out.getContext('2d'), od = og.createImageData(W, H), o = od.data, f = fl.img.data;
    for (let i = 0; i < W * H; i++) {
      const k = i * 4;
      if (!vacio(i)) { o[k] = d[k]; o[k + 1] = d[k + 1]; o[k + 2] = d[k + 2]; o[k + 3] = d[k + 3]; continue; }
      if (afuera[i]) continue;
      const [mx, my] = at(i % W, (i / W) | 0), sx = Math.floor(mx + 0.5), sy = Math.floor(my + 0.5);
      if (sx < 0 || sy < 0 || sx >= fl.w || sy >= fl.h) continue;
      const q = (sy * fl.w + sx) * 4; o[k] = f[q]; o[k + 1] = f[q + 1]; o[k + 2] = f[q + 2]; o[k + 3] = 255;
    }
    og.putImageData(od, 0, 0);
    return out;
  };

  const restar = (c, b) => {                      // el choque c sin la caja b (hasta 4 pedazos)
    const out = [], cx1 = c.x + c.w, cy1 = c.y + c.h;
    if (c.x >= b[2] || cx1 <= b[0] || c.y >= b[3] || cy1 <= b[1]) return [c];
    if (c.y < b[1]) out.push({ x: c.x, y: c.y, w: c.w, h: b[1] - c.y });
    if (cy1 > b[3]) out.push({ x: c.x, y: b[3], w: c.w, h: cy1 - b[3] });
    const y0 = Math.max(c.y, b[1]), y1 = Math.min(cy1, b[3]);
    if (c.x < b[0]) out.push({ x: c.x, y: y0, w: b[0] - c.x, h: y1 - y0 });
    if (cx1 > b[2]) out.push({ x: b[2], y: y0, w: cx1 - b[2], h: y1 - y0 });
    return out.filter(q => q.w > 0 && q.h > 0);
  };
  const aplicar = (s, zona, a) => {
    const z = Z[zona]; if (!z) return;
    zonaDeKind = zona;
    if (z.quitar && a.colliders) a.colliders = a.colliders.reduce((acc, c) => acc.concat(z.quitar.reduce((cs, b) => cs.reduce((o, cc) => o.concat(restar(cc, b)), []), [c])), []);
    if (!a.items) return;
    // achicar: { f, re, maxAlto }: las piezas del medio del mapa (no las del borde ni las muy altas) se achican desde su pie, y
    // los choques de la máscara que caen en cada una se achican igual hacia el mismo pie
    if (z.achicar) {
      // las piezas que se tocan (una piedra cortada en dos, un estandarte y su palo) se achican juntas, hacia el pie del grupo
      const A = z.achicar, piezas = [];
      a.items.forEach(it => {
        if (!it.key || !A.re.test(it.key) || it.floor) return;
        if (A.solo && !A.solo.includes(it.key.replace(/^ed_/, '').replace(/(_esp)?(_rc\d+)?(_p\d+)?$/, ''))) return;
        const fr = s.textures.getFrame(it.key); if (!fr) return;
        const sc = it.scale || 1, w = fr.cutWidth * sc, h = fr.cutHeight * sc, x0 = it.x - w / 2, y0 = it.baseY - h;
        if (x0 <= 2 || y0 <= 2 || x0 + w >= a.w - 2 || it.baseY >= a.h - 2 || h > A.maxAlto) return;
        piezas.push({ it, sc, x0, y0, x1: x0 + w, y1: it.baseY, g: piezas.length });
      });
      const raiz = i => (piezas[i].g === i ? i : (piezas[i].g = raiz(piezas[i].g)));
      for (let i = 0; i < piezas.length; i++) for (let j = i + 1; j < piezas.length; j++) {
        const p = piezas[i], q = piezas[j];
        const ox = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), mw = Math.min(p.x1 - p.x0, q.x1 - q.x0);
        // una encima de la otra (partes de una misma cosa)
        if (ox >= mw * 0.5 && p.y0 < q.y1 + 2 && q.y0 < p.y1 + 2) { const ri = raiz(i), rj = raiz(j); if (ri !== rj) piezas[rj].g = ri; }
      }
      const grupos = {};
      piezas.forEach((p, i) => { const r = raiz(i), G = grupos[r] = grupos[r] || { x0: 1e9, x1: -1e9, y1: -1e9, y0: 1e9 }; G.x0 = Math.min(G.x0, p.x0); G.x1 = Math.max(G.x1, p.x1); G.y1 = Math.max(G.y1, p.y1); G.y0 = Math.min(G.y0, p.y0); p.G = G; });
      piezas.forEach(p => {
        const ax = (p.G.x0 + p.G.x1) / 2, ay = p.G.y1;
        p.it.scale = p.sc * A.f; p.it.x = ax + (p.it.x - ax) * A.f; p.it.baseY = ay + (p.it.baseY - ay) * A.f;
      });
      const cajas = Object.values(grupos);
      if (a.colliders) a.colliders = a.colliders.map(c => {
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        const G = cajas.find(q => cx >= q.x0 && cx <= q.x1 && cy >= q.y0 && cy <= q.y1); if (!G) return c;
        const ax = (G.x0 + G.x1) / 2, ay = G.y1;
        return { x: ax + (c.x - ax) * A.f, y: ay + (c.y - ay) * A.f, w: c.w * A.f, h: c.h * A.f };
      });
    }
    // el suelo (con sus retoques) y los agujeros de las copas rellenos con el suelo de ese lugar
    const fl = suelo(s, a, z);
    if (z.rellenar && fl) a.items.forEach(it => {
      const k = it.key || '', b = z.rellenar.map(ed).find(q => esDe(k, q)); if (!b) return;
      const src = leer(s, k); if (!src) return;
      const nk = k + '_na' + (nTex++);
      s.textures.addCanvas(nk, rellenar(s, src, ubicar(it, src.w, src.h), fl));
      it.key = nk;
    });
    const items = [];
    const piso = (z.piso || []).map(ed), base = z.base || {}, corr = z.corrimiento || {};
    a.items.forEach(it => {
      const k = it.key || '';
      if (!/^ed_/.test(k)) { items.push(it); return; }
      if (piso.some(b => esDe(k, b))) { it.floor = true; items.push(it); return; }
      const nb = Object.keys(base).find(b => esDe(k, ed(b)));
      if (nb !== undefined) { const y = base[nb]; it.lift = (it.lift || 0) + (y - it.baseY); it.baseY = y; }
      const nc = Object.keys(corr).find(b => esDe(k, ed(b)));
      if (nc !== undefined) { const d = corr[nc]; it.lift = (it.lift || 0) + d; it.baseY += d; }
      const kr = Object.keys(z.recorte || {}).find(b => esDe(k, ed(b)));
      const kb = Object.keys(z.borrar || {}).find(b => esDe(k, ed(b)));
      const kp = Object.keys(z.partes || {}).find(b => esDe(k, ed(b)));
      if (kr === undefined && kb === undefined && kp === undefined) { items.push(it); return; }
      const src = leer(s, k); if (!src) { items.push(it); return; }
      const at = ubicar(it, src.w, src.h);
      if (kp !== undefined) {
        const partes = z.partes[kp];
        const color = (p, d, i) => p.gris === undefined || (p.gris ? gris(d, i) : !gris(d, i));
        const usados = (x, y, d, i, hasta) => partes.slice(0, hasta).some(p => dentro(p.r, x, y) && color(p, d, i));
        partes.forEach((p, j) => {
          if (p.fuera) return;                                     // pedazo que se borra de la pieza
          const nk = filtrar(s, src, at, (x, y, d, i) => dentro(p.r, x, y) && color(p, d, i) && !usados(x, y, d, i, j), ed(kp));
          if (!nk) return;
          if (p.piso) { items.push(Object.assign({}, it, { key: nk, floor: true, shadow: 0 })); return; }
          const y = p.base;
          items.push(Object.assign({}, it, { key: nk, baseY: y, lift: (it.lift || 0) + (y - it.baseY), shadow: 0 }));
        });
        // lo que no cayó en ninguna parte se queda con la base de la pieza
        const resto = filtrar(s, src, at, (x, y, d, i) => !usados(x, y, d, i, partes.length), ed(kp));
        if (resto) items.push(Object.assign({}, it, { key: resto, shadow: 0 }));
        return;
      }
      const rs = kr !== undefined ? z.recorte[kr] : null, bs = kb !== undefined ? z.borrar[kb] : null;
      const nk = filtrar(s, src, at, (x, y) => (!rs || dentro(rs, x, y)) && (!bs || !dentro(bs, x, y)), ed(kr !== undefined ? kr : kb));
      if (nk) items.push(Object.assign({}, it, { key: nk }));
    });
    // pedazos del suelo que tapan al héroe
    (z.tapa || []).forEach((t, j) => {
      const src = fl; if (!src) return;
      const sc = 1;
      const x0 = Math.min(...t.r.map(r => r[0])), y0 = Math.min(...t.r.map(r => r[1])), x1 = Math.max(...t.r.map(r => r[2])), y1 = Math.max(...t.r.map(r => r[3]));
      const W = Math.ceil(x1 - x0), H = Math.ceil(y1 - y0);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'), od = g.createImageData(W, H), o = od.data, d = src.img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const mx = x0 + x + 0.5, my = y0 + y + 0.5; if (!dentro(t.r, mx, my)) continue;
        const sx = Math.floor(mx / sc), sy = Math.floor(my / sc); if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
        const i = (sy * src.w + sx) * 4;
        if (t.sin && t.sin(d[i], d[i + 1], d[i + 2])) continue;
        const k2 = (y * W + x) * 4; o[k2] = d[i]; o[k2 + 1] = d[i + 1]; o[k2 + 2] = d[i + 2]; o[k2 + 3] = 255;
      }
      g.putImageData(od, 0, 0);
      const k = 'ed_tapa_' + zona.replace(/\W/g, '_') + '_' + j + '_' + (nTex++);
      s.textures.addCanvas(k, c);
      items.push({ key: k, x: x0 + W / 2, baseY: t.base, lift: t.base - y1, scale: 1, shadow: 0 });
    });
    a.items = items;
  };

  // envolver el armado de cada mapa del Taller (por fuera de todos los demás: corre después de ellos)
  const envolver = kind => {
    const L0 = INTERIOR_LAYOUTS[kind];
    if (typeof L0 !== 'function' || L0._ckNA) return;
    const L = function (kit) {
      pre();
      const r = L0.apply(this, arguments);
      try {
        const s = window.activeGameScene || (window.game && game.scene.scenes.find(x => x.startCampaign));
        Object.keys(kit.areas || {}).forEach(nombre => { const a = kit.areas[nombre]; if (a && s) aplicar(s, kind + '.' + nombre, a); });
      } catch (e) { console.warn('[notas: arreglos]', kind, e); }
      return r;
    };
    L._ckNA = true;
    INTERIOR_LAYOUTS[kind] = L;
  };
  const envolverTodo = () => Object.keys(INTERIOR_LAYOUTS).forEach(envolver);
  envolverTodo();

  // ------------------------------------------------------------------ choques firmes (no pasan por la guardia de ck_pies_piezas)
  // choques: [[x, y, w, h], …];  macizo: { clave: [[x0, y0, x1, y1], …] } → choque con la forma de los píxeles de la pieza
  // dentro de esos rectángulos (cuadritos de 2 px), para muebles y objetos que no se tienen que pisar.
  const zonaChoque = (S, a, x, y, w, h) => {
    const zn = S.add.zone(a.x + x + w / 2, a.y + y + h / 2, w, h);
    S.physics.add.existing(zn, true);
    zn._ckNA = true;
    S.interiorObstacles.add(zn);
    (a.objs = a.objs || []).push(zn);
    return zn;
  };
  const celdasARect = (cel, gw, gh) => {          // cuadritos → rectángulos (corridas por fila, pegadas hacia abajo)
    const rects = []; let prev = null;
    for (let gy = 0; gy < gh; gy++) {
      const cur = new Map(); let gx = 0;
      while (gx < gw) {
        if (!cel[gy * gw + gx]) { gx++; continue; }
        let x1 = gx; while (x1 + 1 < gw && cel[gy * gw + x1 + 1]) x1++;
        const k = gx + '_' + x1, r = prev && prev.get(k);
        if (r && r.y1 === gy - 1) { r.y1 = gy; cur.set(k, r); } else { const nr = { x0: gx, x1, y0: gy, y1: gy }; rects.push(nr); cur.set(k, nr); }
        gx = x1 + 1;
      }
      prev = cur;
    }
    return rects;
  };
  const armarChoques = S => {
    const c = S.currentInterior, a = c && c.area, z = Z[zonaDe(S)];
    if (!a || !z || a._ckNAchoques || !S.interiorObstacles) return;
    a._ckNAchoques = true;
    // sinPiesEn: rectángulos donde se sacan los pies que puso ck_pies_piezas (ahí los choques van a mano)
    if (z.sinPiesEn) (a._ckPies || []).slice().forEach(p => {
      const b = p.body; if (!b) return;
      const x0 = b.x - a.x, y0 = b.y - a.y, x1 = x0 + b.width, y1 = y0 + b.height;
      if (!z.sinPiesEn.some(r => x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1])) return;
      try { S.interiorObstacles.remove(p); p.destroy(); } catch (e) {}
      a._ckPies.splice(a._ckPies.indexOf(p), 1);
    });
    (z.choques || []).concat(z.poner || []).forEach(([x, y, w, h]) => zonaChoque(S, a, x, y, w, h));
    // pieFino: árboles y postes: choque sólo en los últimos px de abajo del dibujo (el tronco), con su forma
    (z.pieFino || []).forEach(k => {
      const b = ed(k), Q = 2, ALTO = 10;
      (a.objs || []).forEach(o => {
        if (!o || !o.texture || !o.frame || o.type === 'Zone' || !esDe(o.texture.key, b)) return;
        const fr = o.frame, w = fr.cutWidth, h = fr.cutHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const g = cv.getContext('2d', { willReadFrequently: true });
        g.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h).data; let yb = -1;
        for (let ty = h - 1; ty >= 0 && yb < 0; ty--) for (let tx = 0; tx < w; tx++) if (d[(ty * w + tx) * 4 + 3] > 60) { yb = ty; break; }
        if (yb < 0) return;
        const sx = Math.abs(o.scaleX), sy = Math.abs(o.scaleY), left = o.x - o.displayWidth * o.originX - a.x, top = o.y - o.displayHeight * o.originY - a.y;
        const x0 = Math.floor(left), y0 = Math.floor(top + (yb - ALTO) * sy), gw = Math.ceil(w * sx / Q) + 1, gh = Math.ceil((ALTO + 1) * sy / Q) + 1, cel = new Uint8Array(gw * gh);
        for (let ty = Math.max(0, yb - ALTO); ty <= yb; ty++) for (let tx = 0; tx < w; tx++) {
          if (d[(ty * w + tx) * 4 + 3] < 60) continue;
          const mx = left + (o.flipX ? w - 1 - tx : tx) * sx, my = top + ty * sy, gx = Math.floor((mx - x0) / Q), gy = Math.floor((my - y0) / Q);
          if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) cel[gy * gw + gx] = 1;
        }
        celdasARect(cel, gw, gh).forEach(r => zonaChoque(S, a, x0 + r.x0 * Q, y0 + r.y0 * Q, (r.x1 - r.x0 + 1) * Q, (r.y1 - r.y0 + 1) * Q));
      });
    });
    Object.keys(z.macizo || {}).forEach(k => {
      const rs = z.macizo[k], b = ed(k), Q = 2;
      const x0 = Math.min(...rs.map(r => r[0])), y0 = Math.min(...rs.map(r => r[1]));
      const gw = Math.ceil((Math.max(...rs.map(r => r[2])) - x0) / Q), gh = Math.ceil((Math.max(...rs.map(r => r[3])) - y0) / Q);
      const cel = new Uint8Array(gw * gh);
      (a.objs || []).forEach(o => {
        if (!o || !o.texture || !o.frame || o.type === 'Zone' || !esDe(o.texture.key, b)) return;
        const fr = o.frame, w = fr.cutWidth, h = fr.cutHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const g = cv.getContext('2d', { willReadFrequently: true });
        g.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h).data, sx = Math.abs(o.scaleX), sy = Math.abs(o.scaleY);
        const left = o.x - o.displayWidth * o.originX - a.x, top = o.y - o.displayHeight * o.originY - a.y;
        for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
          if (d[(ty * w + tx) * 4 + 3] < 60) continue;
          const mx = left + (o.flipX ? w - 1 - tx : tx) * sx, my = top + ty * sy;
          if (!dentro(rs, mx + 0.5, my + 0.5)) continue;
          const gx = Math.floor((mx - x0) / Q), gy = Math.floor((my - y0) / Q);
          if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) cel[gy * gw + gx] = 1;
        }
      });
      celdasARect(cel, gw, gh).forEach(r => zonaChoque(S, a, x0 + r.x0 * Q, y0 + r.y0 * Q, (r.x1 - r.x0 + 1) * Q, (r.y1 - r.y0 + 1) * Q));
    });
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { armarChoques(this); } catch (e) { console.warn('[notas: choques]', e); }
    return r;
  };

  // ------------------------------------------------------------------ pies de los personajes de 100×100
  // Los soldados, orcos y héroes dibujados como NPC con el origen abajo de todo (0.5, 1) tienen los pies al 60 % del cuadro:
  // se ordenaban 48-56 px más abajo de donde se los ve parados (el arquero del campamento tapaba la carpa de atrás y Gorak,
  // en la puerta de la choza, tapaba al héroe parado delante). Se ordenan por sus pies y su cuerpo (el choque de 14×8 que
  // les ponen) sube a los pies. Los villanos del juego (enemigos) y el héroe no se tocan.
  const PIE = 0.4;                                     // lo que sobra debajo de los pies en esos cuadros (40 de 100 px)
  const corregirPies = S => {
    const pl = S.player, en = S.enemies;
    S.children.list.forEach(o => {
      if (o._ckPieNA === undefined) {
        o._ckPieNA = false;
        if (o === pl || o.type !== 'Sprite' || !o.frame || o.originY !== 1) return;
        if (o.frame.cutWidth !== 100 || o.frame.cutHeight !== 100) return;
        if (en && en.contains && en.contains(o)) return;
        o._ckPieNA = true;
        // su choque de 14×8 debajo de donde estaba el pie
        const off = o.displayHeight * PIE;
        if (S.interiorObstacles) S.interiorObstacles.getChildren().forEach(zn => {
          const b = zn.body; if (!b || zn._ckNAsubido) return;
          if (Math.abs(b.x - (o.x - 7)) < 2 && Math.abs(b.y - (o.y - 8)) < 2 && Math.abs(b.width - 14) < 2) {
            zn._ckNAsubido = true; zn.y -= off; b.updateFromGameObject();
          }
        });
      }
      if (o._ckPieNA && o.active) o.setDepth(o.y - o.displayHeight * PIE);
    });
  };

  // ------------------------------------------------------------------ translúcidos (por zona: claves)
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0 ? u0.apply(this, arguments) : undefined;
    try { corregirPies(this); } catch (e) {}
    try {                                               // prof: { 'textura': y del mapa } → orden fijo (cosas que arma otro archivo)
      const z = Z[zonaDe(this)];
      if (z && z.prof && this.currentInterior && (this._ckNAprof = (this._ckNAprof || 0) + 1) % 20 === 0) {
        const a = this.currentInterior.area;
        this.children.list.forEach(o => { if (o.texture && z.prof[o.texture.key] !== undefined) o.setDepth(a.y + z.prof[o.texture.key]); });
      }
    } catch (e) {}
    try {
      const z = Z[zonaDe(this)], pl = this.player;
      if (z && z.translucido && pl && this.currentInterior) {
        const a = this.currentInterior.area;
        if (!a._ckTransl) {
          const ks = z.translucido.map(ed);
          a._ckTransl = (a.objs || []).filter(o => o && o.texture && ks.some(b => esDe(o.texture.key, b)));
        }
        const hb = pl.getBounds();
        a._ckTransl.forEach(o => {
          if (!o.active) return;
          const b = o.getBounds();
          const tapa = o.depth > pl.depth && b.right > hb.x && b.x < hb.right && b.bottom > hb.y && b.y < hb.bottom;
          const meta = tapa ? 0.45 : 1;
          o.alpha += (meta - o.alpha) * Math.min(1, delta / 120);
        });
      }
    } catch (e) {}
    return r;
  };
  // ================================================================== LOS MAPAS (número de nota del dueño entre paréntesis)
  // Campos del Roble: el tronco que baja del borde de arriba, junto al estanque (1)
  def('ed_campos_del_roble.main', { poner: [[230, 0, 36, 56]] });
  // Norte del Roble: la carreta de heno (3), la copa y las rocas del árbol del oeste (4), el pasto alto del cerco (5),
  // la puerta de la casa de abajo (7)
  def('ed_norte_del_roble.main', {
    poner: [[272, 664, 100, 32]],
    partes: {
      an_cosa: [{ r: [[45, 250, 180, 320]], gris: true, base: 306 }, { r: [[20, 200, 92, 320]], base: 300 }, { r: [[0, 200, 230, 272]], base: 262 }],
      an_arbol: [{ r: [[90, 300, 172, 456]], base: 455 }]
    },
    sinPie: ['an_cosa', 'an_arbol'],
    corrimiento: { an_casa_2: -14 }
  });
  // Casa quemada: las vigas caídas (6)
  def('ed_casa_quemada_norte.main', { poner: [[122, 135, 40, 98], [150, 170, 18, 16]] });
  // Bosque Embrujado: la rama de la orilla (8), la ceniza alrededor del fogón es piso (10), el tronco caído (11),
  // el hueco entre el tocón y el árbol (15)
  def('ed_bosque_embrujado.main', {
    borrar: { be_arbol_seco_15: [[1000, 440, 1290, 566]] },
    piso: ['be_piedra_4'],
    quitar: [[900, 395, 1060, 450], [870, 300, 1010, 350]],
    poner: [[880, 316, 20, 16], [900, 308, 20, 18], [920, 300, 20, 18], [940, 292, 20, 18], [960, 284, 20, 18], [980, 276, 20, 18], [520, 180, 24, 34]]
  });
  // Brumavieja: las aspas del molino se aclaran con el héroe detrás (17)
  def('ruins.village', { translucido: ['br_molino'] });
  // Cementerio Real: bordes del sendero y montículos son piso (18, 21, 23); el sarcófago de la izquierda tenía el choque
  // corrido (18, 19); la tumba abierta (24); el pasillo detrás de los huesos del osario (25); la lápida con losa (26)
  def('ed_cementerio_real.main', {
    piso: ['cm_tumba_14', 'cm_tumba_16', 'cm_tumba_29', 'cm_lapida_16'],
    borrar: { cm_mausoleo_real: [[576, 528, 676, 584], [784, 528, 862, 584]] },   // el empedrado de arriba del mausoleo (22)
    quitar: [[512, 488, 548, 514]],
    poner: [[536, 462, 34, 48], [888, 462, 34, 48], [1066, 342, 48, 40], [1110, 355, 50, 30], [800, 176, 110, 16], [204, 200, 38, 46]]
  });
  // Camino al Castillo: la baranda del puente (27), la roca junto al muelle (28), los barriles del muelle (29), el choque
  // que cortaba el paso del sendero a la escalera (30)
  def('ed_camino_al_castillo.main', {
    poner: [[360, 463, 134, 16], [612, 600, 54, 40], [600, 640, 60, 40], [520, 580, 46, 12]],
    quitar: [[788, 428, 802, 470]]
  });
  // Patio del castillo: los choques de la parte de arriba del arco del portón (el héroe pasa por detrás del arco; el pie de
  // los pilares sigue chocando) (32, 33)
  def('ed_patio_del_castillo.main', { quitar: [[412, 452, 456, 492], [500, 444, 552, 500]] });
  // Jardín Real: los frutales tenían agujeros en la copa y el choque en media copa (37-40)
  def('ed_jardin_real.main', {
    rellenar: ['jr2_naranjo', 'jr2_naranjo_2', 'jr2_manzano', 'jr2_manzano_2'],
    pieFino: ['jr2_naranjo', 'jr2_naranjo_2', 'jr2_manzano', 'jr2_manzano_2']
  });
  // Patio de armas: no subirse a las carpas ni al techo de la caseta (42-44)
  def('castle.training', { poner: [[287, 360, 125, 60], [100, 170, 76, 92], [277, 62, 130, 64]] });
  // Biblioteca: el pie de la escalera de caracol (46), la mesa redonda y su banquito de atrás (47)
  def('ed_biblioteca.main', { poner: [[300, 200, 52, 30], [262, 276, 76, 28]] });
  // Capilla de San Roque: entre la pila y el atril (51)
  def('ed_capilla_san_roque.main', { poner: [[404, 114, 34, 26]] });
  // San Roque: los cercos del sembrado se cruzaban (54), una entrada en el cerco de abajo (58), las parvas (55)
  // (el cerco del sembrado es una sola pieza, sr_cosa_4, ordenada por su punta de abajo: se parte en el tramo de arriba,
  // el costado en pedacitos y el de abajo, con la entrada abierta en la pieza y en el suelo)
  def('ed_san_roque.main', {
    sueloCopia: [[760, 688, 760, 664, 44, 14], [760, 702, 760, 718, 44, 14]],
    quitar: [[756, 674, 808, 716], [828, 558, 1046, 580]],   // (el choque del tramo de arriba estaba en la punta de los postes: va al pie)
    partes: {
      sr_cosa_4: [{ r: [[758, 676, 806, 718]], fuera: true }, { r: [[820, 556, 1060, 594]], base: 592 },
        { r: [[820, 594, 852, 614]], base: 614 }, { r: [[820, 614, 852, 634]], base: 634 }, { r: [[820, 634, 852, 654]], base: 654 },
        { r: [[820, 654, 852, 674]], base: 674 }, { r: [[820, 674, 852, 694]], base: 694 }, { r: [[680, 674, 852, 718]], base: 709 }]
    },
    sinPie: ['sr_cosa_4'],
    poner: [[834, 584, 212, 8], [826, 590, 14, 116], [700, 700, 56, 10], [808, 700, 30, 10],
      [867, 602, 36, 28], [992, 619, 36, 29], [869, 724, 39, 29], [977, 719, 36, 31], [667, 732, 36, 28], [777, 739, 36, 29]]
  });
  // Molino de San Roque: pasar por detrás de la pared de la ventana y bajo el dintel de la puerta (60, 61); las bolsas (63)
  def('ed_molino_san_roque.main', {
    quitar: [[40, 172, 236, 224]],
    tapa: [{ r: [[40, 166, 216, 234], [216, 166, 262, 182]], base: 234 }],
    poner: [[402, 196, 18, 34]]
  });
  // Casita del cerco: la mesita (64), la alfombra es piso (65)
  def('ed_casita_cerco_san_roque.main', { poner: [[168, 128, 40, 24]], piso: ['scc_alfombra'] });
  // Casa del pastor: los cueros de oveja son piso (56, 57)
  def('ed_casa_pastor_san_roque.main', { piso: ['spa_cuero_de_oveja', 'spa_cuero_de_oveja_2'] });
  // Bosque de la Frontera: entre los dos pinos (67), la torre: el héroe en la puerta va delante (68)
  def('ed_bosque_de_la_frontera.main', { poner: [[548, 262, 72, 40]], partes: { fg_piedra: [{ r: [[630, 100, 706, 214]], base: 212 }] } });
  // Claro de las Bestias: el poste con la calavera (73); las cosas del medio del mapa un 30 % más chicas, el terreno igual (94).
  // Sólo las cosas sueltas (`solo`): los árboles y matas que el suelo vacío del dibujo ya trae no se tocan, ni el árbol caído
  // de la guarida (de ahí salen las bestias, nota 72). El dibujo grande de
  // cada cosa que se achica se borra del suelo (ck_notas_suelos_arte.js) para que no queden la grande y la chica.
  def('ed_claro_de_las_bestias.main', { poner: [[274, 280, 20, 12]], achicar: { f: 0.7, re: /^ed_cb_/, maxAlto: 180, solo: ["cb_objeto_108", "cb_piedra_10", "cb_objeto_22", "cb_piedra_4", "cb_objeto_41", "cb_piedra_11", "cb_objeto_21", "cb_piedra_7", "cb_piedra_6", "cb_piedra_5", "cb_objeto_68", "cb_piedra_14", "cb_piedra_12", "cb_objeto_93", "cb_objeto_83", "cb_piedra_9", "cb_objeto_94", "cb_piedra_19", "cb_objeto_71", "cb_piedra_8", "cb_objeto_95", "cb_objeto_24", "cb_objeto_72", "cb_piedra_20", "cb_objeto_110", "cb_objeto_70", "cb_objeto_73", "cb_objeto_74", "cb_objeto_129", "cb_objeto_113", "cb_objeto_19", "cb_piedra_21", "cb_objeto_20", "cb_objeto_69", "cb_objeto_123", "cb_objeto_75", "cb_objeto_30", "cb_objeto_128", "cb_objeto_96", "cb_objeto_111", "cb_objeto_102", "cb_objeto_29", "cb_objeto_116", "cb_objeto_112", "cb_objeto_26", "cb_objeto_86", "cb_objeto_109", "cb_piedra_15", "cb_objeto_90", "cb_objeto_122", "cb_piedra_16", "cb_objeto_104", "cb_objeto_119", "cb_objeto_103", "cb_objeto_25", "cb_objeto_121", "cb_objeto_126", "cb_objeto_89", "cb_objeto_77", "cb_objeto_64", "cb_objeto_91", "cb_objeto_115", "cb_objeto_85", "cb_objeto_23", "cb_objeto_117", "cb_objeto_62", "cb_objeto_125", "cb_objeto_124", "cb_objeto_31", "cb_objeto_40", "cb_objeto_127", "cb_objeto_33", "cb_objeto_78", "cb_objeto_101", "cb_objeto_32", "cb_objeto_118", "cb_objeto_120", "cb_objeto_67", "cb_objeto_27", "cb_objeto_65", "cb_objeto_114", "cb_objeto_63", "cb_objeto_66", "cb_objeto_28", "cb_objeto_76", "cb_objeto_79"] } });
  // Galerías: la barricada del botín se ordena por su pie de adelante (76); las monedas del botín son piso y los sacos se
  // ordenan por su pie (77)
  def('ed_cueva_galerias.main', { prof: { cktsu_barricada: 412 }, base: { gl_botin: 226 }, partes: { gl_botin: [{ r: [[940, 226, 1110, 280]], piso: true }] } });
  // Grutas: la estalagmita dibujada en el suelo (79), el pozo (81)
  def('ed_cueva_grutas.main', { poner: [[186, 338, 68, 44], [1074, 440, 42, 14]], tapa: [{ r: [[1086, 386, 1098, 400], [1080, 400, 1104, 420], [1074, 420, 1110, 440], [1070, 440, 1114, 452], [1116, 430, 1130, 452]], base: 452 }] });
  // La Fosa: el montón de restos (84), la carreta rota (85, firme: la guardia le abría un paso), las camas de paja (87, 88)
  def('ed_cueva_fosa.main', {
    poner: [[528, 714, 44, 24]],
    choques: [[722, 698, 108, 50]],
    piso: ['fos_cama_de_paja', 'fos_cama_de_paja_2', 'fos_cama_de_paja_3', 'fos_cama_de_paja_4', 'fos_cama_de_paja_5']
  });
  // Sendero Orco: la soga de adelante del puente tapa al héroe que cruza (96); la puerta de la choza de huesos (97)
  def('ed_sendero_orco.main', {
    tapa: [{ r: [[430, 270, 442, 278], [442, 273, 454, 281], [454, 276, 466, 284], [466, 279, 478, 287], [478, 281, 490, 289],
      [490, 283, 514, 291], [514, 282, 526, 290], [526, 280, 540, 288]], base: 302 }],
    corrimiento: { so_objeto: -8 }
  });
  // Afueras: la punta de la pila de troncos (100)
  def('ed_afueras_orcas.main', { poner: [[700, 132, 38, 32]] });
  // Pueblo Orco: el colmillo de la choza del chamán (102), el corral de los chanchos (104), el techo de la casa del jefe (105)
  def('ed_pueblo_orco.main', {
    poner: [[740, 372, 40, 30]],
    ponerSuave: [[186, 240, 18, 24]],
    partes: { op3_cerco_del_corral: [{ r: [[100, 380, 345, 446]], base: 446 }, { r: [[280, 446, 350, 476]], base: 476 }, { r: [[280, 476, 350, 506]], base: 506 }] }
  });
  // Casa del jefe orco: los cueros son piso (106-108), los cofres junto al trono (109)
  def('ed_casa_jefe_orco.main', { piso: ['cjo_cuero', 'cjo_cuero_2', 'cjo_cuero_3', 'cjo_cuero_4'], poner: [[356, 100, 46, 12]] });
  // Patio de la Fortaleza Orca, el oeste (111-113, 116): las tres empalizadas y los dos troncos de los portones están dibujados
  // en el suelo y la máscara los tenía corridos (se pasaba por encima de las estacas y se chocaba debajo del tronco). Ahora
  // chocan sólo al pie de las estacas, se pasa por debajo de los troncos (por los dos huecos del medio) y las estacas y los
  // troncos tapan al héroe que pasa por detrás.
  const sinSuelo = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b > 75;   // el piso gris del patio no se copia en las tapas
  def('ed_patio_fortaleza_orca.main', {
    quitar: [[0, 150, 172, 300], [40, 300, 172, 340], [403, 104, 430, 127], [552, 291, 572, 305]],
    sinPiesEn: [[0, 150, 176, 340]],
    poner: [[0, 214, 60, 20], [48, 232, 14, 14], [100, 268, 44, 24], [144, 274, 40, 22], [108, 314, 56, 22], [62, 322, 12, 14],
      [560, 308, 6, 6]],
    // (118) el cofre de al lado del portón del norte choca sólo con su pie (se pasa por detrás, hacia el portón que se rompe);
    // la lanza parada de la punta de la empalizada del medio choca sólo al pie (se pasa por delante de la empalizada)
    tapa: [
      { r: [[0, 150, 64, 234]], base: 232, sin: sinSuelo },
      { r: [[46, 158, 124, 214]], base: 246, sin: sinSuelo },
      { r: [[98, 205, 184, 294]], base: 290, sin: sinSuelo },
      { r: [[60, 276, 170, 338]], base: 336, sin: sinSuelo }
    ]
  });
  // Fortaleza Orca: la entrada del oeste (119-121): el muro del arco se ordenaba por su punta de abajo (342) y tapaba todo; abajo
  // de su pie asomaba el muro viejo del suelo y se caminaba por encima; bajo el arco no se podía pasar; el tronco del portón y la
  // empalizada de abajo (dibujados en el suelo) quedaban debajo del héroe. El armero (124), los cofres (125), el estrado del
  // trono (128): choque con la forma del dibujo.
  def('ed_fortaleza_orca.main', {
    quitar: [[262, 186, 304, 282]],
    poner: [[40, 278, 206, 24], [242, 252, 20, 30], [298, 248, 20, 32], [198, 326, 70, 12]],
    partes: { of_c2_muro_del_arco: [{ r: [[39, 170, 246, 342]], base: 302 }, { r: [[246, 170, 318, 342]], base: 282 }] },
    tapa: [
      { r: [[102, 320, 122, 348], [122, 330, 142, 358], [142, 340, 162, 368], [162, 350, 182, 378], [182, 360, 202, 388], [202, 370, 222, 398], [222, 380, 256, 420]], base: 470 },
      { r: [[196, 410, 372, 534]], base: 534, sin: (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b > 110 }
    ],
    macizo: { of_c2_armero_4: [[680, 300, 770, 384]], of_c2_cofre_3: [[878, 396, 940, 458]], of_c2_trono_de_huesos: [[700, 96, 960, 240]] }
  });
  // Mazmorra del Sello (sin pies: choques firmes): la costilla (133), la tabla de las tres piedras (138)
  def('ed_mazmorra_sello.main', { choques: [[822, 470, 30, 42], [206, 226, 150, 96]] });

  // San Roque: el vecino que reza en el cementerio caminaba por encima de las lápidas (50): camina al pie de ellas
  try {
    const G = window.CK_GENTE_NUEVA, w = G && G.LUGARES && (G.LUGARES.san_roque || []).find(v => v.id === 'npc6a');
    if (w) w.pts = [[318, 494, 3600], [372, 494, 3000]];
  } catch (e) {}

  window.CK_NOTAS_ARREGLOS = { Z, enteras, aplicar, envolverTodo };
})();
