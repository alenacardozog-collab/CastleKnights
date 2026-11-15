'use strict';
/* Terreno que se rompe peleando (10/11, pedido del dueño: "que algunas cosas del mapa se puedan romper para mejorar la
   movilidad: barricadas de madera y cosas así, no cajas, cosas del terreno que cuando se pelee se desgasten y se rompan").
   Las piezas de madera de los mapas del Taller (estacas, cercas, cercos, barandas, corrales, carretas, carretillas, tablas,
   lanzas clavadas, barricadas, empalizadas cortas, barriles, cajones y fardos de los dibujos) tienen vida:
   - cada golpe del héroe (espada, estocada, giro, magia) o de una bestia que pega al lado las sacude y saca astillas;
   - se van gastando a la vista: primero rajaduras, después rajaduras grandes y más oscuras;
   - al romperse vuelan los pedazos (del mismo dibujo), queda la base astillada en el piso y el paso se abre (choque
     afuera y el camino de las bestias se recalcula solo).
   En los lugares de peligro (tierras orcas, bosques, ruinas, cueva…) lo roto queda roto en la partida; en el castillo,
   la aldea y los lugares de gente, al volver a entrar ya lo arreglaron. Los muñecos y blancos de práctica no se rompen,
   ni lo que es parte de una pared o casa, ni las piezas más anchas que 230 px (la empalizada entera de un pueblo).
   (14/11, v2, notas del dueño 62, 80, 82, 83, 114, 115, 117, 122, 123, 132: "las cosas q se rompen deberia quedar el espacio
   por debajo vacio, tenlo en cuenta para todo lo demas q se rompe"; "q las cosas sueltas como huesos y rocas se rompan, asi el
   jugador y los npc tienen mas espacio"; "al romper las hitboxes tambien desaparecen"):
   - al romperse no queda la base astillada: los pedazos quedan un rato en el piso y se van; y si el suelo del mapa traía
     dibujada la misma cosa (los mapas de Flow la traen), ese dibujo se borra rellenándolo con el piso de alrededor;
   - se sacan todos los choques que caen debajo de la pieza (no sólo los que se le asignaron);
   - SUELTOS (por mapa): huesos, cráneos y piedras sueltas de las cuevas y de la Mazmorra (menos los fogones y braseros) se
     rompen aunque no choquen; en la Fosa a veces sale una tanda de arañitas, a veces monedas o un corazón;
   - CAJAS (por mapa): cualquier pieza con el pie adentro de esos rectángulos (las cosas del patio de la Fortaleza, la puerta
     del depósito, los cercos de la arena) se rompe; `abre` saca además los choques de ese rectángulo (la puerta).
   (14/11, v3, notas 115 y 117: "aca deberia poder romper esta puerta y pasar", "aca no puedo pasar deja q pueda romper"):
   - PUERTAS (por mapa): portones que vienen dibujados en el suelo (no son una pieza aparte). Al entrar, el dibujo del portón
     se saca del suelo y de las piezas de encima y pasa a ser una pieza propia (se ve igual) con su choque; a los golpes se
     raja y se rompe como las demás, y al romperse se cortan los choques del hueco y queda el paso abierto. Un portón roto
     queda roto en la partida (aunque sea un lugar de gente).
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  // qué se rompe y cuánto aguanta
  const TIPOS = [
    [/barricada|empalizada/, 7, 'pesado'],
    [/carreta|carretilla|carro\b|rueda_y/, 6, 'pesado'],
    [/estacas|lanzas_clavadas|cerca|cerco|baranda|corral|tabla_apoyada|tranquera|valla/, 4, 'madera'],
    [/barril|cajon|cajas|fardo|pila_de_paja|bolsas|lena\b|_lena|tronco_de_picar/, 3, 'liviano']
  ];
  const NUNCA = /cementerio|reja|hierro|muneco|diana|blanco|poste_golpes|poste_brazos|poste_anillas|muro|torre|casa|choza|capilla|molino|porton|arco|fuente|pozo|establo|cobertizo|caseta|carpa|totem|trono|jaula|balista|catapulta|fragua|altillo|mostrador|barra\b|ropero|cama|mesa|estante|armero|estandarte|bandera/;
  const MAX_ANCHO = 230;
  // (v2) por mapa: sueltos (regex de claves que se rompen aunque no choquen), cajas [[x0, y0, x1, y1, vida, abre?]]
  const MAPAS = {
    cueva_grutas: { sueltos: /hueso|huesos|craneo|calavera|piedra|roca|esqueleto|costillar/ },
    cueva_fosa: { sueltos: /hueso|huesos|craneo|calavera|piedra|roca|costillar|esqueleto/, premio: true, desarmar: /^ed_fos_calaveras$/ },
    cueva_galerias: { sueltos: /hueso|huesos|craneo|calavera|esqueleto/ },
    mazmorra_sello: { sueltos: /hueso|huesos|craneo|calavera|costillar|esqueleto|resto|pila_de/, nunca: /brasero|fogon|fogata|pilar|obelisco|sello|cristal|espejo|estatua|rey/,
      cajas: [[574, 425, 870, 513, 3]] },
    patio_fortaleza_orca: { cajas: [[300, 140, 370, 190, 3]],
      // borrar: lo que se saca del dibujo (rectángulos del mapa); choque: el choque mientras está cerrado; corta: los choques
      // que se cortan al romperse (el hueco); rellena: 'h' con el piso de los costados, 'v' con el de arriba y abajo
      puertas: [
        { borrar: [[452, 74, 466, 145]], choque: [[449, 102, 469, 147]], corta: [446, 100, 472, 150], rellena: 'h', vida: 6 },
        { borrar: [[494, 344, 542, 361], [494, 381, 542, 398]], choque: [[490, 348, 546, 394]], corta: [493, 336, 543, 402], rellena: 'v', vida: 6 }
      ] },
    fortaleza_orca: { cajas: [[400, 300, 665, 485, 4]] }
  };
  const GENTE = /castillo|patio|jardin|muralla|granero|^aldea$|camino_al_castillo|taberna|casa|cocina|cuarto|salon|biblioteca|herreria|tienda|aposento|capilla_real|campos/;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const azar = (a, b) => a + Math.random() * (b - a);

  const tipoDe = key => {
    if (!/^ed_/.test(key) || NUNCA.test(key)) return null;
    for (const t of TIPOS) if (t[0].test(key)) return t;
    return null;
  };
  const mapaDe = S => {
    const a = S.currentInterior && S.currentInterior.area, k = a && a.key || '';
    const m = /^ed_([a-z0-9_]+)\./.exec(k);
    return m ? m[1] : '';
  };
  const guardados = (S, id) => {
    const st = S.story; if (!st || !st.flags) return null;
    const f = st.flags.terrenoRoto || (st.flags.terrenoRoto = {});
    return f[id] || (f[id] = []);
  };

  // ------------------------------------------------------------------ dibujos gastados: rajaduras sobre la madera
  const fuente = (S, key) => {
    const T = S.textures.get(key), fr = T && T.get();
    if (!fr || !fr.source || !fr.source.image) return null;
    return { img: fr.source.image, x: fr.cutX, y: fr.cutY, w: fr.cutWidth, h: fr.cutHeight };
  };
  const semilla = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); };
  const gastada = (S, key, nivel) => {
    const nk = `ckt_${key}_g${nivel}`;
    if (S.textures.exists(nk)) return nk;
    const f = fuente(S, key); if (!f) return null;
    const cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h;
    const g = cv.getContext('2d');
    g.drawImage(f.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    g.globalCompositeOperation = 'source-atop';
    // oscurece un poco (golpeada, polvo)
    g.fillStyle = nivel > 1 ? 'rgba(30,18,8,0.22)' : 'rgba(30,18,8,0.1)';
    g.fillRect(0, 0, f.w, f.h);
    const r = semilla(key + nivel), n = nivel > 1 ? 9 : 4;
    for (let i = 0; i < n; i++) {
      let x = Math.floor(r() * f.w), y = Math.floor(f.h * (0.25 + r() * 0.65));
      const largo = 4 + Math.floor(r() * (nivel > 1 ? 14 : 8));
      g.fillStyle = 'rgba(28,16,6,0.85)';
      for (let k = 0; k < largo; k++) {
        g.fillRect(x, y, 1, 1);
        if (r() < 0.5) { g.fillStyle = 'rgba(222,190,140,0.5)'; g.fillRect(x + 1, y, 1, 1); g.fillStyle = 'rgba(28,16,6,0.85)'; }
        y += r() < 0.75 ? -1 : 0; x += r() < 0.5 ? -1 : 1;
      }
    }
    S.textures.addCanvas(nk, cv);
    return nk;
  };
  // pedazos del mismo dibujo y la base astillada que queda en el piso
  const pedazos = (S, key) => {
    const nk = `ckt_${key}_p`;
    if (S.textures.exists(nk + '0')) return S._ckTerrPed[key];
    const f = fuente(S, key); if (!f) return null;
    const cols = Math.max(2, Math.min(4, Math.round(f.w / 22))), filas = Math.max(2, Math.min(3, Math.round(f.h / 26)));
    const out = { lista: [], base: null, color: 0x7a5230 };
    const pw = Math.ceil(f.w / cols), ph = Math.ceil(f.h * 0.8 / filas);
    let i = 0, rr = 0, gg = 0, bb = 0, nn = 0;
    for (let fy = 0; fy < filas; fy++) for (let fx = 0; fx < cols; fx++) {
      const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(f.img, f.x + fx * pw, f.y + fy * ph, pw, ph, 0, 0, pw, ph);
      // borde quebrado: se comen esquinas al azar
      g.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < 5; k++) { const cx = Math.random() < 0.5 ? 0 : pw, cy = Math.random() < 0.5 ? 0 : ph; g.beginPath(); g.arc(cx, cy, 2 + Math.random() * pw * 0.35, 0, 7); g.fill(); }
      const d = g.getImageData(0, 0, pw, ph).data; let vis = 0;
      for (let p = 0; p < d.length; p += 16) if (d[p + 3] > 128) { vis++; rr += d[p]; gg += d[p + 1]; bb += d[p + 2]; nn++; }
      if (vis < 6) continue;
      S.textures.addCanvas(nk + i, cv); out.lista.push({ k: nk + i, ox: fx * pw + pw / 2, oy: fy * ph + ph / 2 }); i++;
    }
    if (nn) out.color = (Math.round(rr / nn) << 16) | (Math.round(gg / nn) << 8) | Math.round(bb / nn);
    // base: el 22 % de abajo, con el borde de arriba mordido
    const bh = Math.max(6, Math.round(f.h * 0.22)), cv = document.createElement('canvas'); cv.width = f.w; cv.height = bh;
    const g = cv.getContext('2d'); g.drawImage(f.img, f.x, f.y + f.h - bh, f.w, bh, 0, 0, f.w, bh);
    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < f.w; x += 3) { const h = Math.random() * bh * 0.7; g.fillRect(x, 0, 3, h); }
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,18,8,0.25)'; g.fillRect(0, 0, f.w, bh);
    S.textures.addCanvas(nk + 'b', cv); out.base = { k: nk + 'b', h: bh, w: f.w };
    (S._ckTerrPed || (S._ckTerrPed = {}))[key] = out;
    return out;
  };

  // (v3) una pieza con muchas cosas sueltas → una pieza por cosa (manchas de píxeles que no se tocan)
  const desarmar = (S, a, o) => {
    const f = o.frame, src = f.source.image || f.source.canvas; if (!src) return;
    const w = f.cutWidth, h = f.cutHeight, sx = o.displayWidth / w, sy = o.displayHeight / h;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(src, f.cutX, f.cutY, w, h, 0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data, lab = new Int32Array(w * h).fill(-1);
    const comps = [];
    for (let i = 0; i < w * h; i++) {
      if (lab[i] >= 0 || d[i * 4 + 3] < 24) continue;
      const id = comps.length, pila = [i], c = { x0: w, y0: h, x1: 0, y1: 0, n: 0, px: [] }; lab[i] = id;
      while (pila.length) {
        const j = pila.pop(), x = j % w, y = (j / w) | 0; c.px.push(j); c.n++;
        if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const k = Y * w + X; if (lab[k] < 0 && d[k * 4 + 3] >= 24) { lab[k] = id; pila.push(k); }
        }
      }
      comps.push(c);
    }
    const grandes = comps.filter(c => c.n >= 30);
    if (grandes.length < 2) return;
    const x0 = o.x - o.displayWidth * o.originX, y0 = o.y - o.displayHeight * o.originY;
    grandes.forEach((c, n) => {
      const cw = c.x1 - c.x0 + 1, ch = c.y1 - c.y0 + 1, pc = document.createElement('canvas'); pc.width = cw; pc.height = ch;
      const pg = pc.getContext('2d'), pim = pg.createImageData(cw, ch);
      c.px.forEach(j => { const x = j % w, y = (j / w) | 0, q = ((y - c.y0) * cw + (x - c.x0)) * 4; for (let k = 0; k < 4; k++) pim.data[q + k] = d[j * 4 + k]; });
      pg.putImageData(pim, 0, 0);
      const nk = o.texture.key + '_na9d' + n;
      if (!S.textures.exists(nk)) S.textures.addCanvas(nk, pc);      // (al volver a entrar, la misma: puede estar en uso)
      const px = o.flipX ? x0 + (w - 1 - c.x1) * sx : x0 + c.x0 * sx, py = y0 + c.y0 * sy;
      const sp = S.add.image(px, py, nk).setOrigin(0, 0).setScale(sx, sy).setFlipX(o.flipX).setDepth(py + ch * sy);
      sp._ckDesarmado = true; a.objs.push(sp);
    });
    o.setVisible(false); o._ckDesarmadoDe = true;
  };
  // ------------------------------------------------------------------ armar la lista al entrar a una zona
  const limpiar = S => { S._ckTerr = []; };
  const armar = S => {
    limpiar(S);
    const a = S.currentInterior && S.currentInterior.area; if (!a || !a.objs) return;
    const id = mapaDe(S); if (!id) return;
    const persiste = !GENTE.test(id), rotos = persiste ? guardados(S, id) : null;
    const zonas = a.objs.filter(o => o.type === 'Zone' && o.body);
    const usadas = new Set();
    const MP = MAPAS[id] || {};
    // (v3) las pilas que vienen en una sola pieza (el montón de calaveras de la Fosa) se separan en una pieza por hueso
    if (MP.desarmar) a.objs.slice().forEach(o => { try { if ((o.type === 'Image' || o.type === 'Sprite') && o.visible && o.texture && MP.desarmar.test(o.texture.key)) desarmar(S, a, o); } catch (e) { console.warn('[terreno rompible] desarmar', e); } });
    a.objs.forEach(o => {
      if (o.type !== 'Image' && o.type !== 'Sprite') return;
      const key = o.texture && o.texture.key; if (!key) return;
      if (!/^ed_/.test(key) || /^ed_suelo/.test(key)) return;
      const bx0 = o.x - o.displayWidth * o.originX, bx1 = bx0 + o.displayWidth, by1 = o.y + o.displayHeight * (1 - o.originY), by0 = by1 - o.displayHeight;
      // (v2) qué es: los tipos de siempre, o algo suelto de este mapa, o algo con el pie en una caja de este mapa
      const base = key.replace(/(_esp)?(_rc\d+)?(_p\d+)?(_na\d+)?$/, '');
      if (MP.nunca && MP.nunca.test(base)) return;
      const fx = (bx0 + bx1) / 2 - a.x, fy = by1 - a.y;
      const caja = (MP.cajas || []).find(c => fx >= c[0] && fx <= c[2] && fy >= c[1] && fy <= c[3]);
      const suelto = !!(MP.sueltos && MP.sueltos.test(base));
      let t = tipoDe(key);
      if (!t && suelto) t = [null, 2, 'liviano'];
      if (!t && caja) t = [null, caja[4] || 3, 'madera'];
      if (!t) return;
      if (o.displayWidth > MAX_ANCHO || o.displayWidth < 8) return;
      if ((suelto || caja) && o.displayHeight > 140) return;
      // sus choques: los de abajo del dibujo, que no se salgan mucho de él
      const mias = zonas.filter(z => {
        if (usadas.has(z)) return false;
        const b = z.body, cx = b.center.x, cy = b.center.y;
        if (cx < bx0 - 4 || cx > bx1 + 4 || cy < by0 + o.displayHeight * 0.35 || cy > by1 + 10) return false;
        return b.x > bx0 - 16 && b.right < bx1 + 16 && b.width < o.displayWidth + 30;
      });
      if (!mias.length && !suelto && !caja) return; // no estorba: no hace falta romperlo
      const uid = key + '@' + Math.round(o.x - a.x) + ',' + Math.round(o.y - a.y);
      mias.forEach(z => usadas.add(z));
      const r = { uid, key, sp: o, zonas: mias, vida: t[1], max: t[1], peso: t[2], caja: { x0: bx0, x1: bx1, y0: by0, y1: by1 }, X: o.x,
        abre: caja && caja[5] ? caja : null, premio: !!MP.premio && suelto, forzar: !!o._ckDesarmado };
      if (rotos && rotos.indexOf(uid) >= 0) { romper(S, r, true); return; }
      S._ckTerr.push(r);
    });
    (MP.puertas || []).forEach((d, i) => { try { armarPuerta(S, a, id, d, i); } catch (e) { console.warn('[terreno rompible] puerta', e); } });
  };

  // ------------------------------------------------------------------ (v3) portones dibujados en el suelo
  const dentro = (x, y, rs) => rs.some(q => x >= q[0] && x < q[2] && y >= q[1] && y < q[3]);
  const piezasEn = (S, a, rs) => S.children.list.filter(o => (o.type === 'Image' || o.type === 'Sprite') && o.visible && o.depth > 7 && !o.body &&
    o.texture && o.frame && o.frame.source && (/^ed_/.test(o.texture.key) || o._ckNA) && rs.some(q => {
      const x0 = o.x - o.displayWidth * o.originX - a.x, y0 = o.y - o.displayHeight * o.originY - a.y;
      return x0 < q[2] && x0 + o.displayWidth > q[0] && y0 < q[3] && y0 + o.displayHeight > q[1];
    }));
  const dibujar = (g, o, a, X0, Y0) => {
    const f = o.frame, src = f.source.image || f.source.canvas; if (!src) return;
    const x0 = o.x - o.displayWidth * o.originX - a.x - X0, y0 = o.y - o.displayHeight * o.originY - a.y - Y0;
    g.save();
    if (o.flipX) { g.translate(x0 + o.displayWidth, y0); g.scale(-1, 1); g.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, o.displayWidth, o.displayHeight); }
    else g.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, x0, y0, o.displayWidth, o.displayHeight);
    g.restore();
  };
  // el dibujo del portón (suelo + piezas de encima, sólo adentro de los rectángulos) como textura propia
  const fotoPuerta = (S, a, rs, key) => {
    const X0 = Math.min(...rs.map(q => q[0])), Y0 = Math.min(...rs.map(q => q[1])), X1 = Math.max(...rs.map(q => q[2])), Y1 = Math.max(...rs.map(q => q[3]));
    const cv = document.createElement('canvas'); cv.width = X1 - X0; cv.height = Y1 - Y0;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
    const L = sueloCanvas(S); if (L) g.drawImage(L.t.getSourceImage(), X0, Y0, X1 - X0, Y1 - Y0, 0, 0, X1 - X0, Y1 - Y0);
    piezasEn(S, a, rs).sort((p, q) => p.depth - q.depth).forEach(o => dibujar(g, o, a, X0, Y0));
    const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (!dentro(X0 + x, Y0 + y, rs)) d[(y * cv.width + x) * 4 + 3] = 0;
    g.putImageData(im, 0, 0);
    S.textures.addCanvas(key, cv);
    return { X0, Y0, X1, Y1 };
  };
  // se saca del suelo: se rellena de afuera hacia adentro sólo con el piso de los costados ('h') o de arriba y abajo ('v')
  const borrarRectSuelo = (S, rs, dir) => {
    const L = sueloCanvas(S); if (!L) return;
    const X0 = Math.max(0, Math.min(...rs.map(q => q[0])) - 2), Y0 = Math.max(0, Math.min(...rs.map(q => q[1])) - 2);
    const X1 = Math.min(L.t.width, Math.max(...rs.map(q => q[2])) + 2), Y1 = Math.min(L.t.height, Math.max(...rs.map(q => q[3])) + 2);
    const W = X1 - X0, H = Y1 - Y0; if (W < 2 || H < 2) return;
    const im = L.g.getImageData(X0, Y0, W, H), d = im.data, m = new Uint8Array(W * H);
    let quedan = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (dentro(X0 + x, Y0 + y, rs)) { m[y * W + x] = 1; quedan++; }
    const V = dir === 'v' ? [[0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] : [[1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    for (let paso = 0; paso < 400 && quedan; paso++) {
      const llenar = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!m[y * W + x]) continue;
        const vec = V.filter(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < W && Y < H && !m[Y * W + X]; });
        if (vec.length) { const [dx, dy] = vec[(Math.random() * vec.length) | 0]; llenar.push([x, y, ((y + dy) * W + x + dx) * 4]); }
      }
      if (!llenar.length) break;
      llenar.forEach(([x, y, j]) => { const i = (y * W + x) * 4; d[i] = d[j]; d[i + 1] = d[j + 1]; d[i + 2] = d[j + 2]; d[i + 3] = 255; });
      llenar.forEach(([x, y]) => { m[y * W + x] = 0; quedan--; });
    }
    L.g.putImageData(im, X0, Y0); L.t.refresh();
  };
  // y de las piezas que lo tapan (copia de la textura con ese pedazo transparente)
  const borrarRectPiezas = (S, a, rs) => {
    piezasEn(S, a, rs).forEach(o => {
      const f = o.frame, src = f.source.image || f.source.canvas; if (!src) return;
      const w = f.cutWidth, h = f.cutHeight, sx = o.displayWidth / w, sy = o.displayHeight / h;
      const x0 = o.x - o.displayWidth * o.originX - a.x, y0 = o.y - o.displayHeight * o.originY - a.y;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d'); g.drawImage(src, f.cutX, f.cutY, w, h, 0, 0, w, h);
      rs.forEach(q => {
        let tx0 = (q[0] - x0) / sx, tx1 = (q[2] - x0) / sx;
        if (o.flipX) { const t = tx0; tx0 = w - tx1; tx1 = w - t; }
        const ty0 = (q[1] - y0) / sy, ty1 = (q[3] - y0) / sy;
        g.clearRect(Math.floor(tx0), Math.floor(ty0), Math.ceil(tx1 - tx0) + 1, Math.ceil(ty1 - ty0) + 1);
      });
      const nk = o.texture.key.replace(/(_na\d+)?$/, '') + '_na9' + (S._ckTerrPz = (S._ckTerrPz || 0) + 1);
      S.textures.addCanvas(nk, cv);
      o.setTexture(nk);
    });
  };
  // los choques que caen en el hueco se cortan (queda lo de los costados)
  const cortarChoques = (S, a, q) => {
    const Q = { x0: a.x + q[0], y0: a.y + q[1], x1: a.x + q[2], y1: a.y + q[3] };
    const zonas = [S.interiorObstacles, S.obstacles].filter(Boolean).reduce((l, g) => l.concat(g.getChildren()), []);
    zonas.forEach(z => {
      const b = z.body; if (!b || z.type !== 'Zone' || !z.active) return;
      if (b.right <= Q.x0 || b.x >= Q.x1 || b.bottom <= Q.y0 || b.y >= Q.y1) return;
      const partes = [];
      if (b.x < Q.x0) partes.push([b.x, b.y, Q.x0, b.bottom]);
      if (b.right > Q.x1) partes.push([Q.x1, b.y, b.right, b.bottom]);
      const mx0 = Math.max(b.x, Q.x0), mx1 = Math.min(b.right, Q.x1);
      if (b.y < Q.y0) partes.push([mx0, b.y, mx1, Q.y0]);
      if (b.bottom > Q.y1) partes.push([mx0, Q.y1, mx1, b.bottom]);
      partes.forEach(([x0, y0, x1, y1]) => {
        if (x1 - x0 < 1 || y1 - y0 < 1) return;
        const zn = S.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);
        S.physics.add.existing(zn, true); zn._ckNA = z._ckNA; zn._ckCorte = true;
        S.interiorObstacles.add(zn); (a.objs = a.objs || []).push(zn);
      });
      try { b.enable = false; S.interiorObstacles && S.interiorObstacles.remove(z); S.obstacles && S.obstacles.remove(z); z.destroy(); } catch (e) {}
    });
  };
  const armarPuerta = (S, a, id, d, i) => {
    const uid = 'puerta:' + id + ':' + i, l = guardados(S, id), rota = l && l.indexOf(uid) >= 0;
    const key = 'ckt_puerta_' + id + '_' + i + '_' + (S._ckTerrPu = (S._ckTerrPu || 0) + 1);   // nombre nuevo cada vez: la de antes puede seguir en uso
    const box = rota ? null : fotoPuerta(S, a, d.borrar, key);
    borrarRectSuelo(S, d.borrar, d.rellena);
    borrarRectPiezas(S, a, d.borrar);
    if (rota) { cortarChoques(S, a, d.corta); return; }
    const sp = S.add.image(a.x + box.X0, a.y + box.Y0, key).setOrigin(0, 0).setDepth(a.y + box.Y1);
    (a.objs = a.objs || []).push(sp);
    const zonas = d.choque.map(q => {
      const zn = S.add.zone(a.x + (q[0] + q[2]) / 2, a.y + (q[1] + q[3]) / 2, q[2] - q[0], q[3] - q[1]);
      S.physics.add.existing(zn, true); zn._ckPuerta = true; S.interiorObstacles.add(zn); a.objs.push(zn);
      return zn;
    });
    S._ckTerr.push({ uid, key, sp, zonas, vida: d.vida || 6, max: d.vida || 6, peso: 'pesado', X: sp.x, puerta: d,
      caja: { x0: a.x + box.X0, x1: a.x + box.X1, y0: a.y + box.Y0, y1: a.y + box.Y1 }, abre: null, premio: false });
  };

  // ------------------------------------------------------------------ golpes
  const tocan = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const astillas = (S, r, n, x, y) => {
    for (let i = 0; i < n; i++) {
      const g = S.add.rectangle(x + azar(-8, 8), y + azar(-10, 6), Math.round(azar(2, 5)), 2, r.color || 0x7a5230).setDepth(r.caja.y1 + 2);
      S.tweens.add({ targets: g, x: g.x + azar(-30, 30), y: r.caja.y1 + azar(-4, 8), angle: azar(-200, 200), duration: azar(260, 460), ease: 'Quad.easeOut' });
      S.tweens.add({ targets: g, alpha: 0, delay: 1400, duration: 500, onComplete: () => g.destroy() });
    }
  };
  const pegar = (S, r, fuerza, desdeX) => {
    const now = S.time.now; if (r.roto || (r._ult && now - r._ult < 240)) return; r._ult = now;
    r.vida -= fuerza || 1;
    const ped = pedazos(S, r.key); if (ped) r.color = ped.color;
    const cx = Math.max(r.caja.x0 + 6, Math.min(r.caja.x1 - 6, desdeX !== undefined ? desdeX : (r.caja.x0 + r.caja.x1) / 2));
    const cy = r.caja.y1 - Math.min(30, (r.caja.y1 - r.caja.y0) * 0.4);
    astillas(S, r, r.peso === 'liviano' ? 4 : 6, cx, cy);
    if (r.vida <= 0) { romper(S, r, false); return; }
    son('ck_barricada_golpe', r.peso === 'pesado' ? 0.75 : 0.6, { minGap: 90, rate: r.peso === 'liviano' ? 1.25 : r.peso === 'pesado' ? 0.85 : 1 }) || son('sword_hit', 0.6, { rate: 0.7 });
    if (r.sp.active) {
      S.tweens.killTweensOf(r.sp);
      r.sp.x = r.X;
      S.tweens.add({ targets: r.sp, x: r.X + (desdeX !== undefined && desdeX > r.X ? -2 : 2), duration: 45, yoyo: true, repeat: 2, onComplete: () => { if (r.sp.active) r.sp.x = r.X; } });
      const nivel = r.vida <= r.max * 0.4 ? 2 : r.vida < r.max ? 1 : 0;
      if (nivel && nivel !== r.nivel) { const k = gastada(S, r.key, nivel); if (k) { r.sp.setTexture(k); r.nivel = nivel; } }
    }
  };
  const sacarChoques = (S, r) => {
    r.zonas.forEach(z => { try { S.interiorObstacles && S.interiorObstacles.remove(z); z.destroy(); } catch (e) {} });
    if (r.puerta) { const a = S.currentInterior && S.currentInterior.area; if (a) cortarChoques(S, a, r.puerta.corta); return; }
    // (v2) también los demás choques que caen debajo del dibujo (la mitad de abajo) y, si abre un paso, los de su caja
    const a = S.currentInterior && S.currentInterior.area, c = r.caja, alto = c.y1 - c.y0;
    const zonas = [S.interiorObstacles, S.obstacles].filter(Boolean).reduce((l, g) => l.concat(g.getChildren()), []);
    zonas.forEach(z => {
      const b = z.body; if (!b || z.type !== 'Zone' || z._ckNA) return;
      const cx = b.center.x, cy = b.center.y;
      let sale = cx > c.x0 + 2 && cx < c.x1 - 2 && cy > c.y0 + alto * 0.45 && cy < c.y1 + 4 && b.width < (c.x1 - c.x0) + 24;
      if (!sale && r.abre && a) { const q = r.abre; sale = cx > a.x + q[0] && cx < a.x + q[2] && cy > a.y + q[1] && cy < a.y + q[3]; }
      if (sale) { try { z.body.enable = false; S.interiorObstacles && S.interiorObstacles.remove(z); z.destroy(); } catch (e) {} }
    });
  };
  // (v2) el dibujo de la misma cosa en el suelo del mapa se borra: se rellena de afuera hacia adentro con píxeles del piso
  // de al lado (un vecino al azar, así queda la textura del piso y no un manchón liso)
  const sueloCanvas = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a) return null;
    const fl = S.children.list.find(o => o.texture && o.depth === 7 && o.visible && Math.abs(o.x - a.x) < 2 && Math.abs(o.y - a.y) < 2);
    if (!fl) return null;
    if (fl._ckTerrLienzo) return fl._ckTerrLienzo;
    const img = fl.texture.getSourceImage(); if (!img || !img.width) return null;
    const k = 'ckt_suelo_' + fl.texture.key + '_' + (S._ckTerrN = (S._ckTerrN || 0) + 1);
    const t = S.textures.createCanvas(k, img.width, img.height); t.getContext().drawImage(img, 0, 0); t.refresh();
    fl.setTexture(k);
    return (fl._ckTerrLienzo = { t, g: t.getContext(), a, sx: fl.scaleX || 1 });
  };
  const borrarDelSuelo = (S, r) => {
    try {
      const sp = r.sp, fr = sp.frame; if (!fr || !fr.source) return;
      const L = sueloCanvas(S); if (!L) return;
      const a = L.a, w = fr.cutWidth, h = fr.cutHeight, sx = Math.abs(sp.scaleX), sy = Math.abs(sp.scaleY);
      const left = sp.x - sp.displayWidth * sp.originX - a.x, top = sp.y - sp.displayHeight * sp.originY - a.y;
      const pc = document.createElement('canvas'); pc.width = w; pc.height = h;
      const pg = pc.getContext('2d', { willReadFrequently: true }); pg.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const pd = pg.getImageData(0, 0, w, h).data;
      const X0 = Math.max(0, Math.floor(left) - 4), Y0 = Math.max(0, Math.floor(top) - 4);
      const W = Math.min(L.t.width - X0, Math.ceil(w * sx) + 8), H = Math.min(L.t.height - Y0, Math.ceil(h * sy) + 8);
      if (W < 2 || H < 2) return;
      const im = L.g.getImageData(X0, Y0, W, H), d = im.data, m = new Uint8Array(W * H);
      let n = 0, igual = 0;
      for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
        const i = (ty * w + tx) * 4; if (pd[i + 3] < 80) continue;
        const mx = Math.floor(left + (sp.flipX ? w - 1 - tx : tx) * sx) - X0, my = Math.floor(top + ty * sy) - Y0;
        if (mx < 0 || my < 0 || mx >= W || my >= H) continue;
        const j = (my * W + mx) * 4; n++;
        if (Math.abs(d[j] - pd[i]) + Math.abs(d[j + 1] - pd[i + 1]) + Math.abs(d[j + 2] - pd[i + 2]) < 24) igual++;
        m[my * W + mx] = 1;
      }
      if (!n || (!r.forzar && igual / n < 0.35)) return;   // el suelo no tiene esta cosa dibujada (las desarmadas sí, aclaradas)
      // un píxel de margen (el borde oscuro del dibujo)
      const m2 = m.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) m2[Y * W + X] = 1; }
      // se llena por capas desde el borde
      let quedan = 0; for (let i = 0; i < m2.length; i++) if (m2[i]) quedan++;
      for (let paso = 0; paso < 200 && quedan; paso++) {
        const llenar = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!m2[y * W + x]) continue;
          const vec = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].filter(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < W && Y < H && !m2[Y * W + X]; });
          if (vec.length) { const [dx, dy] = vec[(Math.random() * vec.length) | 0]; llenar.push([x, y, ((y + dy) * W + x + dx) * 4]); }
        }
        if (!llenar.length) break;
        llenar.forEach(([x, y, j]) => { const i = (y * W + x) * 4; d[i] = d[j]; d[i + 1] = d[j + 1]; d[i + 2] = d[j + 2]; d[i + 3] = 255; });
        llenar.forEach(([x, y]) => { m2[y * W + x] = 0; quedan--; });
      }
      L.g.putImageData(im, X0, Y0); L.t.refresh();
    } catch (e) { console.warn('[terreno rompible] suelo', e); }
  };
  // (v2) premios de lo que se rompe en la Fosa: arañitas, monedas, un corazón o nada
  const premio = (S, r) => {
    const x = (r.caja.x0 + r.caja.x1) / 2, y = r.caja.y1 - 4, q = Math.random(), st = S.story;
    if (q < 0.3 && typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.aranita && S.spawnEnemy) {
      son('ck_aranas', 0.7) || son('slime_hit', 0.5, { rate: 1.6 });
      S.createFloatingText(x, y - 30, '¡Arañas!', 0xfca5a5);
      const n = 2 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) S.time.delayedCall(i * 140, () => { try { const ya = S._ckPermitirBestias; S._ckPermitirBestias = true; let e = null; try { e = S.spawnEnemy(x + azar(-10, 10), y - 26 + azar(-4, 4), 'aranita'); } finally { S._ckPermitirBestias = ya; } if (e) { e.state = 'chase'; e.zone = S.currentInterior && S.currentInterior.area.key; } } catch (er) {} });
    } else if (q < 0.6 && st) {
      const n = 2 + ((Math.random() * 5) | 0); st.coins += n;
      S.createFloatingText(x, y - 20, `+${n} monedas`, 0xfcd34d); son('coin', 0.45); S.updateObjective && S.updateObjective();
    } else if (q < 0.72 && S.spawnHeartPickup && S.health < S.maxHealth) S.spawnHeartPickup(x, y);
  };
  const romper = (S, r, yaEstaba) => {
    r.roto = true;
    sacarChoques(S, r);
    if (!r.puerta) borrarDelSuelo(S, r);
    const ped = pedazos(S, r.key), sp = r.sp, esc = sp.scaleX || 1, fl = sp.flipX, ancho = sp.displayWidth || 40;
    // (v2) ya no queda la base astillada: el lugar queda libre
    if (!yaEstaba && ped) {
      ped.lista.forEach(p => {
        const lx = fl ? r.caja.x1 - p.ox * esc : r.caja.x0 + p.ox * esc, ly = r.caja.y0 + p.oy * esc;
        const q = S.add.image(lx, ly, p.k).setScale(esc).setFlipX(fl).setDepth(r.caja.y1 + 1);
        const dx = (lx - sp.x) * 0.6 + azar(-24, 24), suelo = r.caja.y1 + azar(-14, 10);
        S.tweens.add({ targets: q, x: lx + dx, duration: azar(380, 560), ease: 'Quad.easeOut' });
        S.tweens.add({ targets: q, y: { from: ly, to: ly - azar(10, 26) }, duration: 160, ease: 'Quad.easeOut', yoyo: false,
          onComplete: () => S.tweens.add({ targets: q, y: suelo, duration: azar(240, 360), ease: 'Bounce.easeOut' }) });
        S.tweens.add({ targets: q, angle: azar(-110, 110), scaleY: esc * 0.6, duration: 560, ease: 'Quad.easeOut', onComplete: () => q.setDepth(suelo - 20) });
        S.tweens.add({ targets: q, alpha: 0, delay: 7000 + Math.random() * 3000, duration: 1500, onComplete: () => q.destroy() });
      });
    }
    try { sp.destroy(); } catch (e) {}
    if (yaEstaba) return;
    const cx = (r.caja.x0 + r.caja.x1) / 2, cy = r.caja.y1 - 6;
    astillas(S, r, 10, cx, cy - 10);
    for (let i = 0; i < 7; i++) {
      const c = S.add.circle(cx + azar(-ancho / 2, ancho / 2), cy + azar(-6, 4), azar(5, 10), 0xb8a58a, 0.45).setDepth(r.caja.y1 + 3);
      S.tweens.add({ targets: c, y: c.y - azar(8, 22), scale: 2, alpha: 0, duration: azar(600, 1000), ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
    S.cameras.main.shake(r.peso === 'pesado' ? 220 : 120, r.peso === 'pesado' ? 0.007 : 0.004);
    son('ck_barricada', r.peso === 'liviano' ? 0.55 : 0.8, { rate: r.peso === 'liviano' ? 1.3 : 1 }) || son('door_gate', 0.7, { rate: 0.8 });
    S._ckTerr = (S._ckTerr || []).filter(x => x !== r);
    if (r.premio) premio(S, r);
    if (r.abre || r.puerta) son('ck_puerta_rota', 0.8);
    const id = mapaDe(S);
    if (id && (!GENTE.test(id) || r.puerta)) { const l = guardados(S, id); if (l && l.indexOf(r.uid) < 0) { l.push(r.uid); S.saveStory && S.saveStory(); } }
  };
  const golpe = (S, rect, fuerza, desdeX) => (S._ckTerr || []).slice().forEach(r => { if (!r.roto && tocan(rect, r.caja)) pegar(S, r, fuerza, desdeX); });

  // el héroe
  const rectoHeroe = (S, extra) => {
    const H = window.CK_HITBOXES;
    if (H && H.rectoGolpe) { try { return H.rectoGolpe(S, extra || 0); } catch (e) {} }
    const p = S.player, izq = S.facingDirection === 'left';
    return izq ? { x0: p.x - 46, x1: p.x + 6, y0: p.y - 22, y1: p.y + 20 } : { x0: p.x - 6, x1: p.x + 46, y0: p.y - 22, y1: p.y + 20 };
  };
  ['checkMeleeHits', 'checkThrustHits', 'checkWizardMagicHits'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () {
      const r = f0.apply(this, arguments);
      try { if (this._ckTerr && this._ckTerr.length) golpe(this, rectoHeroe(this, fn === 'checkThrustHits' ? 30 : 0), 1, this.player.x); } catch (e) {}
      return r;
    };
  });
  const sp0 = P.checkSpinHits;
  if (sp0) P.checkSpinHits = function () {
    const r = sp0.apply(this, arguments);
    try { const p = this.player; if (this._ckTerr && this._ckTerr.length) golpe(this, { x0: p.x - 60, x1: p.x + 60, y0: p.y - 40, y1: p.y + 50 }, 1, p.x); } catch (e) {}
    return r;
  };
  // las bestias que pegan al lado de algo también lo gastan (las grandes y los jefes, el doble)
  const em0 = P.enemyMeleeAttack;
  if (em0) P.enemyMeleeAttack = function (enemy, def) {
    const m = em0.apply(this, arguments);
    try {
      if (this._ckTerr && this._ckTerr.length) this.time.delayedCall(m.hitAt + 10, () => {
        if (!enemy.active || enemy.isDead || !enemy.body) return;
        const b = enemy.body, izq = enemy.flipX, R = (def.reach || 30) + 6;
        const rect = izq ? { x0: b.center.x - R, x1: b.center.x, y0: b.bottom - 34, y1: b.bottom + 8 } : { x0: b.center.x, x1: b.center.x + R, y0: b.bottom - 34, y1: b.bottom + 8 };
        golpe(this, rect, def.boss || (enemy.scale || 1) > 1.3 ? 2 : 1, b.center.x);
      });
    } catch (e) {}
    return m;
  };

  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    limpiar(this);
    this.time.delayedCall(250, () => { try { armar(this); } catch (e) { console.warn('[terreno rompible]', e); } });
    return r;
  };
  window.CK_TERRENO_ROMPIBLE = { TIPOS, MAPAS, lista: S => S._ckTerr || [], pegar, romper, armar, borrarDelSuelo, premio };
})();
