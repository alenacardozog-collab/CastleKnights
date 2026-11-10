'use strict';
/* Rompibles y cofres escondidos (07/11, pedido del dueño: "agregá todo eso"). Los mapas son grandes y se cruzaban derecho.
   - VASIJAS Y CAJONES (arte de PixelLab, ck_rompibles_arte.js): en las zonas peligrosas salen 6, en las otras de afuera 3,
     pegados a paredes, cercas y objetos, en lugares adonde se llega caminando. Se rompen de un golpe (J, K, giro, magia,
     flechas). Adentro: a veces monedas (1-3), a veces un corazón si te falta vida, rara vez una poción. Vuelven a aparecer
     cada vez que entrás a la zona (dan poco, para que no convenga farmearlos).
   - COFRES ESCONDIDOS: 16 en total (dos en cada zona peligrosa y uno en el jardín, el patio de armas, la muralla y el
     granero), en rincones lejos de la entrada. Se abren con T. Dan 15-40 monedas y a veces una poción o un elixir. Quedan
     abiertos en la partida guardada, y el diario (TAB) cuenta "Cofres: 3 de 16". La primera vez que se entra a una zona se
     eligen sus lugares y se guardan, así no se mueven.
   Se repintan con la paleta de cada mapa (ver paletaDe).
   DÓNDE (08/11, "en lugares estratégicos, coherentes y que no se pisen con otras cosas"): ver "lugares con sentido" más
   abajo. Nada tapa ni queda tapado (ni abajo de una copa), nada corta los caminos entre salidas, las puertas quedan libres;
   las vasijas y cajones van arrimados a casas, cercas, barriles, de a dos o tres; los cofres en rincones lejos de la entrada.
   Las trampas (cajones que explotan, vasijas y cofres que envenenan) están en ck_trampas.js, enganchadas con GANCHOS.
   Borrar las dos líneas de index.html lo saca (las monedas y cofres ya juntados quedan en la partida). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ROMPIBLES_ARTE) return;
  const P = MainGameScene.prototype, ARTE = window.CK_ROMPIBLES_ARTE;
  const PELIGRO = 6, OTRAS = 3, SEP = 70, LEJOS_ENTRADA = 120;
  const COFRES = {
    'ed_camino_al_castillo.main': 2, 'ruins.village': 2, 'ed_bosque_de_la_frontera.main': 2, 'ed_tierras_orcas.main': 2,
    'ed_pueblo_orco.main': 2, 'ed_fortaleza_orca.main': 2, 'ed_jardin_real.main': 1, 'ed_patio_de_armas.main': 1,
    'ed_muralla.main': 1, 'ed_granero.main': 1
  };
  const TOTAL = Object.keys(COFRES).reduce((a, k) => a + COFRES[k], 0);
  const AFUERA = /^(ed_(jardin_real|patio_de_armas|muralla|granero|patio_armas_nuevo|patio_del_castillo)\.main|castle\.(courtyard|training|garden|walls))$/;
  const IMG = {}; Object.keys(ARTE).forEach(k => { const im = new Image(); im.src = ARTE[k].img; IMG[k] = im; });
  const tex = (S, k) => { const key = 'ckr_' + k; if (!S.textures.exists(key)) { const im = IMG[k]; if (!im.complete || !im.naturalWidth) return null; S.textures.addImage(key, im); } return key; };
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  // ------------------------------------------------------------------ la paleta del mapa (pedido del dueño: "que se vea todo
  // homogéneo"): cada vasija, cajón y cofre se repinta con los colores de las piezas de ese mapa (los barriles, cajones y
  // carretas del dibujo si hay, si no todas), eligiendo para cada píxel el color del mapa más parecido cuidando la luz.
  const MAPA_DE = { 'ruins.village': 'aldea_en_ruinas', 'castle.courtyard': 'patio_del_castillo', 'castle.walls': 'muralla', 'castle.training': 'patio_de_armas', 'castle.garden': 'jardin_real' };
  const MADERA = /barril|cajon|caja|cofre|baul|tonel|carreta|madera|vasija|olla|cajones|barriles/;
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const paletas = {};
  const muestrear = (S, claves, H, cv, g, fuera) => claves.slice(0, 40).forEach(k => {
    try {
      const img = S.textures.get(k).getSourceImage(); if (!img || !img.width) return;
      const w = Math.min(img.width, 400), h = Math.min(img.height, 400);
      cv.width = w; cv.height = h; g.clearRect(0, 0, w, h); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      for (let i = 0; i < d.length; i += 8) {
        if (d[i + 3] < 200) continue;
        const q = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
        if (fuera && fuera.has(q) && lum(d[i], d[i + 1], d[i + 2]) > 60) continue;   // el piso pegado no cuenta
        const e = H.get(q) || [0, 0, 0, 0]; e[0] += d[i]; e[1] += d[i + 1]; e[2] += d[i + 2]; e[3]++; H.set(q, e);
      }
    } catch (er) {}
  });
  const idDe = zona => { const m = /^ed_(.+)\.main$/.exec(zona); return m ? m[1] : MAPA_DE[zona]; };
  const paletaDe = (S, zona) => {
    if (paletas[zona] !== undefined) return paletas[zona];
    const id = idDe(zona), D = window.EDITOR_DATA, M = id && D && D.mapas[id];
    if (!M || !M.items) return (paletas[zona] = null);
    const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
    // los colores del piso de este mapa (los más comunes del suelo): no entran en la paleta de los objetos
    const piso = new Set();
    if (M.suelo && S.textures.exists(M.suelo)) {
      const Hs = new Map(); muestrear(S, [M.suelo], Hs, cv, g, null);
      const tot = [...Hs.values()].reduce((a, e) => a + e[3], 0); let ac = 0;
      [...Hs.entries()].sort((a, b) => b[1][3] - a[1][3]).forEach(([q, e]) => { if (ac < tot * 0.7) piso.add(q); ac += e[3]; });
    }
    const claves = [...new Set(M.items.map(i => i[0]).filter(k => /^ed_/.test(k) && !/^ed_suelo_/.test(k) && S.textures.exists(k)))];
    let madera = claves.filter(k => MADERA.test(k));
    // pocos objetos de madera en el mapa: se suman los de los mapas de la misma región (mismo prefijo) o de todos
    if (madera.length < 3) {
      const pref = (claves[0] || '').slice(0, 6), todos = [];
      Object.keys(D.mapas).forEach(o => (D.mapas[o].items || []).forEach(i => { if (MADERA.test(i[0]) && S.textures.exists(i[0])) todos.push(i[0]); }));
      const mismos = todos.filter(k => k.indexOf(pref) === 0);
      madera = [...new Set(madera.concat(mismos.length >= 3 ? mismos : todos))];
    }
    const H = new Map(); muestrear(S, madera, H, cv, g, piso);
    const pal = [...H.values()].sort((a, b) => b[3] - a[3]).slice(0, 48).map(e => [e[0] / e[3], e[1] / e[3], e[2] / e[3]]);
    return (paletas[zona] = pal.length >= 8 ? pal : null);
  };
  const texPaleta = (S, k, zona) => {
    const base = tex(S, k); if (!base) return null;
    const pal = paletaDe(S, zona); if (!pal) return base;
    const key = 'ckr_' + k + '_' + zona.replace(/[^a-z0-9]/gi, '_');
    if (S.textures.exists(key)) return key;
    const img = IMG[k], w = img.naturalWidth, h = img.naturalHeight;
    const t = S.textures.createCanvas(key, w, h), g = t.getContext();
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, w, h), d = id.data;
    const L = pal.map(c => lum(c[0], c[1], c[2]));
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const r = d[i], gg = d[i + 1], b = d[i + 2], l = lum(r, gg, b);
      // el oro (cerradura, herrajes y monedas del cofre) queda dorado: con la madera del mapa se apagaba
      if (k.indexOf('cofre') === 0 && r > 150 && gg > 105 && b < 110 && r - b > 70) continue;
      let best = 0, bd = 1e12;
      for (let j = 0; j < pal.length; j++) {
        const c = pal[j], dl = l - L[j], dd = 3 * dl * dl + (r - c[0]) ** 2 + (gg - c[1]) ** 2 + (b - c[2]) ** 2;
        if (dd < bd) { bd = dd; best = j; }
      }
      const c = pal[best], m = MEZCLA[k] || 1; d[i] = r + (c[0] - r) * m; d[i + 1] = gg + (c[1] - gg) * m; d[i + 2] = b + (c[2] - b) * m;
    }
    g.putImageData(id, 0, 0); t.refresh();
    return key;
  };
  const azar = (a, b) => a + Math.random() * (b - a);
  // azar con semilla (los lugares de los cofres salen siempre iguales para la misma zona)
  const semilla = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; };

  // celdas adonde se llega caminando desde donde está el héroe, con cuántas paredes tienen alrededor
  const alcanzables = S => {
    const G = S.navGrid(true), C = 8, p = S.player.body;
    const start = S.navNearestCell ? S.navNearestCell(G, p.center.x, p.bottom - 2, 12) : null;
    if (!start) return [];
    const vis = new Uint8Array(G.gw * G.gh), cola = [start[1] * G.gw + start[0]], out = [];
    vis[cola[0]] = 1;
    let qi = 0;
    while (qi < cola.length) {
      const i = cola[qi++], cx = i % G.gw, cy = (i - cx) / G.gw;
      let paredes = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= G.gw || y >= G.gh || G.g[y * G.gw + x]) paredes++; }
      // pasillo (paredes a los dos lados, cerca): ahí no se pone nada, que no tape el paso (puentes, escaleras, portones)
      const tapa = (dx, dy) => { for (let k = 1; k <= 3; k++) { const x = cx + dx * k, y = cy + dy * k; if (x < 0 || y < 0 || x >= G.gw || y >= G.gh || G.g[y * G.gw + x]) return true; } return false; };
      const pasillo = (tapa(-1, 0) && tapa(1, 0)) || (tapa(0, -1) && tapa(0, 1));
      if (!pasillo) out.push({ x: G.x + cx * C + C / 2, y: G.y + cy * C + C / 2, paredes });
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= G.gw || y >= G.gh) return; const j = y * G.gw + x; if (!vis[j] && !G.g[j]) { vis[j] = 1; cola.push(j); } });
    }
    return out;
  };

  // ------------------------------------------------------------------ lugares con sentido (08/11, pedido del dueño: "colocalos
  // en lugares del mapa estratégicos, que sean coherentes y que no se pisen con otras cosas")
  // Se arma un mapa de lo que ya está dibujado en la zona (cada pieza, la gente, las puertas, las salidas), píxel a píxel
  // (cada 2 px), y otro sólo con lo que "guarda cosas" (barriles, cajones, carretas, casas, cercas, puestos…).
  // - Nada se pone donde se taparía o taparía algo: el dibujo del cajón o del cofre no puede tocar ningún píxel de otra
  //   pieza (tampoco quedar abajo de la copa de un árbol), ni estar a menos de 60 px de una salida, ni pegado a la gente.
  // - Vasijas y cajones van ARRIMADOS a algo (una pared, una casa, otros barriles), mejor si es de los que guardan cosas,
  //   y de a dos o tres juntos, como una pila. Nunca en medio del camino.
  // - Los cofres van en RINCONES: cerrados por dos o tres lados, en la parte de la zona más lejos de la entrada.
  const GANCHOS = { poner: [], romper: [], abrir: [] };   // los usa ck_trampas.js
  // (10/11, pedido del dueño: "que varíen según el escenario") qué se rompe en cada lugar; los de barro/loza suenan y
  // se parten como la vasija, los de madera como el cajón
  const JUEGOS = [
    [/^ed_(tierras_orcas|pueblo_orco|fortaleza_orca)\./, ['olla_orca', 'tambor', 'cajon']],
    [/^ed_bosque_de_la_frontera\./, ['tocon', 'canasto', 'vasija']],
    [/^(ed_aldea_en_ruinas\.|ruins\.)/, ['urna', 'vasija', 'cajon']],
    [/^(ed_(jardin_real|patio_de_armas|muralla|patio_del_castillo|patio_armas_nuevo)\.|castle\.)/, ['barril', 'anfora', 'cajon']],
    [/./, ['cajon', 'vasija', 'canasto']]
  ];
  // mapas con sendas marcadas (en los de tierra suelta, como las Tierras Orcas, todo es "camino" en el dibujo del minimapa)
  const SENDAS = /camino_al_castillo|bosque_de_la_frontera|campos_del_roble|jardin_real|patio_del_castillo/;
  const NO_PONER = { 'ed_camino_al_castillo.main': [[290, 380, 520, 480], [960, 540, 1060, 620]] };   // las puntas del puente y la escalera de abajo
  const juegoDe = zona => JUEGOS.find(([re]) => re.test(zona || ''))[1];
  const BARRO = /^(vasija|anfora|urna|olla_orca)$/;
  const MEZCLA = { canasto: 0.45, anfora: 0.45, urna: 0.6, tocon: 0.5, olla_orca: 0.55, tambor: 0.55 };   // cuánto toman de la paleta del mapa
  const RES = 2;
  const DEPOSITO = /barril|cajon|caja|carret|carro|casa|choza|cabana|caba[ñn]a|tienda|granero|establo|cerca|valla|muro|pared|pozo|le[ñn]a|tonel|saco|bolsa|fardo|puesto|banco|mesa|estante|herrer|yunque|tronco|toc[oó]n|baul|choza|tienda|ruina|lapida|tumba|totem|estandarte|armero|jaula|catapulta|balista|secadero|bastidor|fragua|corral|carro|arena|trono|cofre|canast|huerta|espantap|blanco/i;
  const ocupacion = S => {
    const a = S.currentInterior.area, W = Math.ceil(a.w / RES), H = Math.ceil(a.h / RES);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv.getContext('2d', { willReadFrequently: true }); };
    const g = mk(), gd = mk();
    const ene = new Set(S.enemies ? S.enemies.getChildren() : []), mios = new Set((S._ckRomp || []).map(o => o.sp));
    const dibujar = (ctx, o) => {
      const f = o.frame; if (!f || !f.source || !f.source.image) return;
      ctx.save();
      ctx.translate((o.x - a.x) / RES, (o.y - a.y) / RES);
      ctx.scale((o.scaleX * (o.flipX ? -1 : 1)) / RES, o.scaleY / RES);
      try { ctx.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, -o.originX * f.cutWidth, -o.originY * f.cutHeight, f.cutWidth, f.cutHeight); } catch (e) {}
      ctx.restore();
    };
    S.children.list.forEach(o => {
      if (!o.active || !o.visible || o === S.player || ene.has(o) || mios.has(o) || o.alpha < 0.3) return;
      if (o.depth <= 7.5 || o.depth >= 20000) return;          // el piso y las alfombras no cuentan; la luz y la interfaz tampoco
      if (o.type !== 'Image' && o.type !== 'Sprite' && o.type !== 'Rectangle') return;
      const k = (o.texture && o.texture.key) || '';
      if (/^ckf_|^ed_suelo|^ck_salpica|^ck_onda|^ck_gota|^ck_copo/.test(k)) return;   // bichitos, el suelo, la lluvia
      let b; try { b = o.getBounds(); } catch (e) { return; }
      if (b.right < a.x || b.x > a.x + a.w || b.bottom < a.y || b.y > a.y + a.h || b.width * b.height > a.w * a.h * 0.4) return;
      if (o.type === 'Rectangle') { g.fillStyle = '#000'; g.fillRect((b.x - a.x) / RES, (b.y - a.y) / RES, b.width / RES, b.height / RES); return; }
      dibujar(g, o);
      if (DEPOSITO.test(k)) dibujar(gd, o);
      // puertas: que no queden tapadas
      if (/puerta|door|porton|port[oó]n|arco/i.test(k)) { g.fillStyle = '#000'; g.fillRect((b.x - a.x - 24) / RES, (b.y - a.y) / RES, (b.width + 48) / RES, (b.height + 30) / RES); }
      // gente (aldeanos, guardias, el que atiende): se mueve, así que se deja un margen alrededor
      if (/_villager|^g_|^npc|_idle$|_walk/.test(k) && o.type === 'Sprite') { g.fillStyle = '#000'; g.fillRect((b.x - a.x - 16) / RES, (b.y - a.y - 8) / RES, (b.width + 32) / RES, (b.height + 24) / RES); }
    });
    // salidas y puertas: lejos
    g.fillStyle = '#000';
    (a.exits || []).forEach(e => { const M = 60; g.fillRect((e.x - a.x - M) / RES, (e.y - a.y - M) / RES, (e.w + 2 * M) / RES, (e.h + 2 * M) / RES); });
    const leer = ctx => { const d = ctx.getImageData(0, 0, W, H).data, o = new Uint8Array(W * H); for (let i = 0; i < o.length; i++) o[i] = d[i * 4 + 3] > 50 ? 1 : 0; return o; };
    return { a, W, H, o: leer(g), d: leer(gd) };
  };
  // ¿cuánto de un rectángulo (del mundo) está ocupado?
  const cuenta = (M, arr, x0, y0, x1, y1) => {
    let n = 0;
    const gx0 = Math.max(0, Math.floor((x0 - M.a.x) / RES)), gx1 = Math.min(M.W - 1, Math.floor((x1 - M.a.x) / RES));
    const gy0 = Math.max(0, Math.floor((y0 - M.a.y) / RES)), gy1 = Math.min(M.H - 1, Math.floor((y1 - M.a.y) / RES));
    if (x0 < M.a.x || y0 < M.a.y || x1 > M.a.x + M.a.w || y1 > M.a.y + M.a.h) n += 1000;   // fuera del mapa
    for (let y = gy0; y <= gy1; y++) for (let x = gx0; x <= gx1; x++) n += arr[y * M.W + x];
    return n;
  };
  const marcar = (M, x0, y0, x1, y1) => {
    for (let y = Math.max(0, Math.floor((y0 - M.a.y) / RES)); y <= Math.min(M.H - 1, Math.floor((y1 - M.a.y) / RES)); y++)
      for (let x = Math.max(0, Math.floor((x0 - M.a.x) / RES)); x <= Math.min(M.W - 1, Math.floor((x1 - M.a.x) / RES)); x++) M.o[y * M.W + x] = 1;
  };
  // los caminos que se usan: el recorrido más corto entre cada par de salidas (y la llegada del héroe), con 2 celdas de
  // ancho para cada lado. Ahí no se pone nada: los rompibles no cortan el camino ni quedan en el medio de la senda
  const rutas = (S, G, a, extra) => {
    const pts = (a.exits || []).map(e => [e.x + e.w / 2, e.y + e.h / 2]).concat((a.portals || []).map(e => [e.x, e.y + 16]), extra || []);   // (10/11) + portales (el puente del castillo)
    const celda = ([x, y]) => { const c = S.navNearestCell ? S.navNearestCell(G, x, y, 40) : null; return c ? c[1] * G.gw + c[0] : -1; };
    const ids = pts.map(celda).filter(i => i >= 0), marca = new Uint8Array(G.gw * G.gh);
    ids.forEach((ini, n) => {
      const padre = new Int32Array(G.gw * G.gh).fill(-1); padre[ini] = ini;
      const cola = [ini]; let qi = 0;
      while (qi < cola.length) {
        const i = cola[qi++], cx = i % G.gw, cy = (i - cx) / G.gw;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= G.gw || y >= G.gh) return; const j = y * G.gw + x; if (padre[j] < 0 && !G.g[j]) { padre[j] = i; cola.push(j); } });
      }
      ids.slice(n + 1).forEach(fin => { let i = fin, t = 0; if (padre[i] < 0) return; while (i !== ini && t++ < 20000) { marca[i] = 1; i = padre[i]; } marca[ini] = 1; });
    });
    const ancho = new Uint8Array(marca.length);
    for (let i = 0; i < marca.length; i++) if (marca[i]) { const cx = i % G.gw, cy = (i - cx) / G.gw; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < G.gw && y < G.gh) ancho[y * G.gw + x] = 1; } }
    return (px, py) => { const cx = Math.floor((px - G.x) / 8), cy = Math.floor((py - G.y) / 8); return cx >= 0 && cy >= 0 && cx < G.gw && cy < G.gh && !!ancho[cy * G.gw + cx]; };
  };
  const TAM = k => ({ w: ARTE[k].w, h: ARTE[k].h });
  /** ¿entra el objeto k con la base en (x, y)? Devuelve los lados que tiene cerrados (izquierda, derecha, atrás) o null. */
  const entra = (S, M, G, k, x, y) => {
    const { w, h } = TAM(k), x0 = x - w / 2, x1 = x + w / 2, y0 = y - h;
    if (cuenta(M, M.o, x0 - 1, y0 - 1, x1 + 1, y + 2)) return null;            // no pisa ni tapa nada
    if (M.ruta && (M.ruta(x, y - 3) || M.ruta(x0 + 2, y - 3) || M.ruta(x1 - 2, y - 3))) return null;   // ni corta un camino
    // el pie y el frente, caminables (se llega y no queda trabado)
    const libreNav = (px, py) => { const cx = Math.floor((px - G.x) / 8), cy = Math.floor((py - G.y) / 8); return cx >= 0 && cy >= 0 && cx < G.gw && cy < G.gh && !G.g[cy * G.gw + cx]; };
    if (!libreNav(x, y - 3) || !libreNav(x0 + 3, y - 3) || !libreNav(x1 - 3, y - 3) || !libreNav(x, y + 12)) return null;
    const navPared = (px, py) => !libreNav(px, py);
    // un lado está "cerrado" si toca algo dibujado; para los cofres también vale una pared del mapa (riscos, muros);
    // las vasijas y cajones no van contra el agua o un barranco pelado: tienen que estar arrimados a una cosa
    const conNav = k.indexOf('cofre') === 0;
    const lado = (bx0, by0, bx1, by1, ...nav) => cuenta(M, M.o, bx0, by0, bx1, by1) > 2 || (conNav && nav.some(([px, py]) => navPared(px, py)));
    const L = lado(x0 - 10, y - h * 0.6, x0 - 2, y, [x0 - 6, y - 4]);
    const R = lado(x1 + 2, y - h * 0.6, x1 + 10, y, [x1 + 6, y - 4]);
    const T = lado(x0 + 2, y0 - 10, x1 - 2, y0 - 1, [x, y - h - 4], [x, y - 12]) || lado(x0 + 2, y - 16, x1 - 2, y - 6);
    const dep = cuenta(M, M.d, x0 - 26, y - h - 20, x1 + 26, y + 10) > 6;
    return { L, R, T, n: (L ? 1 : 0) + (R ? 1 : 0) + (T ? 1 : 0), dep };
  };
  const poner2 = (S, M, k, x, y, extra) => { const { w, h } = TAM(k); marcar(M, x - w / 2 - 1, y - h - 1, x + w / 2 + 1, y + 2); return poner(S, k, x, y, extra); };
  // ------------------------------------------------------------------ poner y sacar
  const limpiar = S => { (S._ckRomp || []).forEach(o => { try { o.sp.destroy(); } catch (e) {} }); S._ckRomp = []; };
  const poner = (S, k, x, y, extra) => {
    let key = null;
    try { key = texPaleta(S, k, S.currentZoneKey ? S.currentZoneKey() : ''); } catch (e) { key = null; }
    key = key || tex(S, k); if (!key) return null;
    const sp = S.add.image(x, y, key).setOrigin(0.5, 1);
    sp.setDepth(Math.round(y));
    // el pie: una caja fija chiquita abajo (el héroe y las bestias no lo atraviesan)
    const w = Math.round(sp.displayWidth * 0.7), h = 7, z = S.add.zone(x, y - h / 2, w, h);
    S.physics.add.existing(z, true);
    const col = S.physics.add.collider(S.player, z), colE = S.enemies ? S.physics.add.collider(S.enemies, z, null, S.enemyHitsTerrain, S) : null;
    sp.on('destroy', () => { try { col.destroy(); if (colE) colE.destroy(); z.destroy(); } catch (e) {} });
    const o = Object.assign({ sp, k, x, y }, extra || {});
    S._ckRomp.push(o);
    GANCHOS.poner.forEach(f => { try { f(S, o); } catch (e) {} });
    return o;
  };
  const poblar = S => {
    limpiar(S);
    if (S._gameMode !== 'campaign' || !S.story || !S.currentInterior || !S.player || !S.player.body) return;
    const zona = S.currentZoneKey(), a = S.currentInterior.area, peligro = !!ZONE_ENEMIES[zona];
    const nCofres = COFRES[zona] || 0, nRomp = peligro ? PELIGRO : AFUERA.test(zona) ? OTRAS : 0;
    if (!nCofres && !nRomp) return;
    const celdas = alcanzables(S); if (celdas.length < 40) return;
    const entrada = { x: S.player.body.center.x, y: S.player.body.bottom };
    const M = ocupacion(S), G = S.navGrid(true);
    M.ruta = rutas(S, G, a, [[S.player.body.center.x, S.player.body.bottom]]);
    const s = S.story; s.flags = s.flags || {};
    // (08/11) lugares nuevos: cofres_pos2. Los cofres ya abiertos siguen abiertos (se guardan por número, no por lugar)
    const pos = (s.flags.cofres_pos3 = s.flags.cofres_pos3 || {}), abiertos = (s.flags.cofres = s.flags.cofres || {});
    const lejos = c => Math.hypot(c.x - entrada.x, c.y - entrada.y), dmax = Math.max(...celdas.map(lejos));
    const cofres = [];
    if (nCofres) {
      if (!pos[zona]) {
        // rincones: cerrados por dos o tres lados, en la mitad de la zona más lejos de la entrada
        const rnd = semilla(zona), cand = [];
        celdas.forEach(c => {
          const d = lejos(c); if (d < Math.max(LEJOS_ENTRADA, dmax * 0.45)) return;
          const e = entra(S, M, G, 'cofre', c.x, c.y + 4); if (!e || !e.n) return;
          cand.push({ x: c.x, y: c.y + 4, n: e.n, p: e.n * 4 + (e.T ? 2 : 0) + c.paredes * 0.25 + (d / dmax) * 6 + rnd() * 2 });
        });
        cand.sort((p, q) => q.p - p.p);
        const sel = [];
        [[2, 200], [1, 200], [1, 110]].forEach(([nmin, sep]) => cand.forEach(c => {
          if (sel.length >= nCofres || c.n < nmin || sel.some(o => Math.hypot(o.x - c.x, o.y - c.y) < sep)) return;
          sel.push(c);
        }));
        pos[zona] = sel.map(c => [Math.round(c.x - a.x), Math.round(c.y - a.y)]);
        S.saveStory && S.saveStory();
      }
      pos[zona].forEach(([x, y], i) => {
        const id = zona + '#' + i, abierto = !!abiertos[id];
        const o = poner2(S, M, abierto ? 'cofre_abierto' : 'cofre', a.x + x, a.y + y, { cofre: id, abierto });
        if (o) cofres.push(o);
      });
    }
    if (nRomp) {
      // arrimados a algo, mejor a lo que guarda cosas, y de a dos o tres (una pila). Siempre en los mismos lugares de
      // cada zona (lo que se rompe vuelve a aparecer al volver a entrar)
      const rnd = semilla(zona + '#rompibles'), cand = [];
      celdas.forEach(c => {
        if (lejos(c) < LEJOS_ENTRADA) return;
        // (10/11) nunca en una senda (el dibujo del mapa dice dónde hay camino) ni al pie de una escalera
        const ter = window.CK_MINIMAPA && CK_MINIMAPA.terreno ? (dx, dy) => CK_MINIMAPA.terreno(zona, c.x - a.x + dx, c.y - a.y + dy) : null;
        if (ter && SENDAS.test(zona) && [[0, 0], [-14, 0], [14, 0], [0, 10]].some(([dx, dy]) => ter(dx, dy) === 'camino')) return;
        if ((NO_PONER[zona] || []).some(([x0, y0, x1, y1]) => c.x - a.x > x0 && c.x - a.x < x1 && c.y - a.y > y0 && c.y - a.y < y1)) return;
        const e = entra(S, M, G, 'cajon', c.x, c.y + 4); if (!e || !e.n) return;
        cand.push({ x: c.x, y: c.y + 4, p: e.n * 2 + (e.dep ? 12 : 0) + c.paredes * 0.1 + rnd() * 2.5 });   // (10/11) junto a lo que guarda cosas, mucho mejor
      });
      cand.sort((p, q) => q.p - p.p);
      const puestos = [];
      for (const c of cand) {
        if (puestos.length >= nRomp) break;
        if (puestos.concat(cofres).some(o => Math.hypot(o.x - c.x, o.y - c.y) < SEP)) continue;
        if (!entra(S, M, G, 'cajon', c.x, c.y)) continue;            // lo de al lado ya lo pudo ocupar
        const J = juegoDe(zona), k1 = J[Math.floor(rnd() * J.length)], o1 = poner2(S, M, k1, c.x, c.y, { rompible: true });
        if (!o1) continue;
        puestos.push(o1);
        // la pila: uno o dos más pegados al costado
        const extra = rnd() < 0.45 ? 2 : 1;
        for (let j = 0, lado = rnd() < 0.5 ? -1 : 1; j < extra && puestos.length < nRomp; j++) {
          const otros = J.filter(k => k !== k1), k2 = rnd() < 0.6 ? otros[Math.floor(rnd() * otros.length)] : k1;
          const ult = puestos[puestos.length - 1];
          let hecho = false;
          for (const sgn of [lado, -lado]) {
            const x2 = (sgn > 0 ? Math.max(...puestos.slice(-1 - j).map(p => p.x + TAM(p.k).w / 2)) : Math.min(...puestos.slice(-1 - j).map(p => p.x - TAM(p.k).w / 2))) + sgn * (TAM(k2).w / 2 + 4);
            if (entra(S, M, G, k2, x2, ult.y)) { const o2 = poner2(S, M, k2, x2, ult.y, { rompible: true }); if (o2) { puestos.push(o2); hecho = true; } break; }
          }
          if (!hecho) break;
        }
      }
    }
  };

  // ------------------------------------------------------------------ romper
  const romper = (S, o) => {
    if (!o.rompible || o.roto) return;
    o.roto = true;
    // una trampa (ck_trampas.js) puede cambiar lo que pasa: si devuelve true, no suelta premio
    let trampa = false;
    GANCHOS.romper.forEach(f => { try { if (f(S, o)) trampa = true; } catch (e) {} });
    const x = o.x, y = o.y - 10;
    const barro = BARRO.test(o.k);
    son(barro ? 'bone_hit' : 'sword_hit', 0.7, { rate: barro ? 1.6 : 0.8 });
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, barro ? 'fuego' : 'tierra', x, o.y, 14, 320);
    // pedazos
    for (let i = 0; i < 7; i++) {
      const g = S.add.rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 3), barro ? 0xa0522d : 0x7a5230).setDepth(o.y + 1);
      const ang = azar(-Math.PI, 0), d = azar(10, 26);
      S.tweens.add({ targets: g, x: x + Math.cos(ang) * d, y: o.y - 2 + azar(-3, 3), angle: azar(-180, 180), duration: azar(260, 420), ease: 'Quad.easeOut' });
      S.tweens.add({ targets: g, alpha: 0, delay: 900, duration: 400, onComplete: () => g.destroy() });
    }
    try { o.sp.destroy(); } catch (e) {}
    if (trampa) return;
    const r = Math.random(), st = S.story;
    if (S.health < S.maxHealth && r < 0.18 && S.spawnHeartPickup) S.spawnHeartPickup(x, o.y - 4);
    else if (r < 0.62 && st) { const n = Phaser.Math.Between(1, 3); st.coins += n; S.createFloatingText(x, y - 10, `+${n} monedas`, 0xfcd34d); son('coin', 0.4); S.updateObjective && S.updateObjective(); }
    else if (r < 0.66 && st && st.inv) { st.inv.potion = (st.inv.potion || 0) + 1; S.createFloatingText(x, y - 10, '+1 POCIÓN', 0xf87171); S.updateQuickBar && S.updateQuickBar(); }
  };
  const caja = o => ({ x0: o.x - o.sp.displayWidth / 2, x1: o.x + o.sp.displayWidth / 2, y0: o.y - o.sp.displayHeight, y1: o.y });
  const tocan = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const golpe = (S, rect) => (S._ckRomp || []).slice().forEach(o => { if (o.rompible && !o.roto && tocan(rect, caja(o))) romper(S, o); });
  const rectoHeroe = (S, extra) => {
    const H = window.CK_HITBOXES;
    if (H && H.rectoGolpe) { try { return H.rectoGolpe(S, extra || 0); } catch (e) {} }
    const p = S.player, izq = S.facingDirection === 'left';
    return izq ? { x0: p.x - 46, x1: p.x + 6, y0: p.y - 22, y1: p.y + 20 } : { x0: p.x - 6, x1: p.x + 46, y0: p.y - 22, y1: p.y + 20 };
  };
  ['checkMeleeHits', 'checkThrustHits', 'checkWizardMagicHits'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () { const r = f0.apply(this, arguments); try { if (this._ckRomp && this._ckRomp.length) golpe(this, rectoHeroe(this, fn === 'checkThrustHits' ? 30 : 0)); } catch (e) {} return r; };
  });
  const sp0 = P.checkSpinHits;
  if (sp0) P.checkSpinHits = function () { const r = sp0.apply(this, arguments); try { const p = this.player; golpe(this, { x0: p.x - 60, x1: p.x + 60, y0: p.y - 40, y1: p.y + 50 }); } catch (e) {} return r; };

  // ------------------------------------------------------------------ cofres con T
  const cofreCerca = S => {
    if (!S._ckRomp || !S.player || !S.player.body) return null;
    const b = S.player.body;
    return S._ckRomp.find(o => o.cofre && !o.abierto && Math.hypot(o.x - b.center.x, o.y - b.bottom) < 34) || null;
  };
  const abrir = (S, o, sinGanchos) => {
    if (o.abierto) return;
    // un cofre trampa (ck_trampas.js) avisa antes y lo abre él después: si un gancho devuelve true, se espera
    if (!sinGanchos && GANCHOS.abrir.some(f => { try { return f(S, o); } catch (e) { return false; } })) return;
    o.abierto = true;
    const st = S.story; st.flags.cofres = st.flags.cofres || {}; st.flags.cofres[o.cofre] = true;
    let key = null; try { key = texPaleta(S, 'cofre_abierto', S.currentZoneKey()); } catch (e) {} key = key || tex(S, 'cofre_abierto');
    // se abre de verdad (08/11): se achica un poco al destrabar, la tapa salta y vuelve a su tamaño. El dibujo abierto es
    // el mismo cofre visto igual (antes era otro cofre, girado para el otro lado)
    const sp = o.sp;
    S.tweens.add({ targets: sp, scaleY: 0.86, scaleX: 1.06, duration: 90, ease: 'Quad.easeIn', onComplete: () => {
      if (key && sp.active) sp.setTexture(key);
      S.tweens.add({ targets: sp, scaleY: 1, scaleX: 1, duration: 260, ease: 'Back.easeOut' });
    } });
    son('book_clasp', 0.7) || son('quest_done', 0.5);
    const n = Phaser.Math.Between(15, 40); st.coins += n;
    const r = Math.random(), extra = r < 0.25 ? 'elixir' : r < 0.6 ? 'potion' : null;
    if (extra) st.inv[extra] = (st.inv[extra] || 0) + 1;
    const hechos = Object.keys(st.flags.cofres).length;
    S.createFloatingText(o.x, o.y - 40, `+${n} monedas${extra ? (extra === 'elixir' ? ' · +1 ELIXIR' : ' · +1 POCIÓN') : ''}`, 0xfde68a);
    S.time.delayedCall(700, () => S.createFloatingText(o.x, o.y - 54, `Cofre ${hechos} de ${TOTAL}`, 0xfcd34d));
    for (let i = 0; i < 10; i++) {
      const c = S.add.circle(o.x + azar(-6, 6), o.y - 14, 2, 0xffd34d).setDepth(o.y + 2);
      S.tweens.add({ targets: c, y: o.y - azar(30, 50), x: c.x + azar(-14, 14), alpha: 0, duration: azar(500, 800), onComplete: () => c.destroy() });
    }
    S.updateObjective && S.updateObjective(); S.updateQuickBar && S.updateQuickBar(); S.saveStory && S.saveStory();
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && !this.isDead && !this._doorTransition && this._gameMode === 'campaign' && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) {
        const o = cofreCerca(this); if (o) { abrir(this, o); return; }
      }
    } catch (e) {}
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt');
      if (pr && !this.dialogOpen && !this._overlay) {
        const o = cofreCerca(this);
        if (o && !pr.classList.contains('on')) { pr.textContent = 'T · Abrir el cofre'; pr.classList.add('on'); this._ckCofreCartel = true; }
        else if (!o && this._ckCofreCartel) { this._ckCofreCartel = false; if (pr.textContent === 'T · Abrir el cofre') pr.classList.remove('on'); }
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ flechas y proyectiles también rompen
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (this._ckRomp && this._ckRomp.length && this.projectiles) this.projectiles.getChildren().forEach(pr => {
        if (!pr.active || !pr.body) return;
        const b = pr.body, rc = { x0: b.x, x1: b.right, y0: b.y - 6, y1: b.bottom + 6 };
        const o = this._ckRomp.find(q => q.rompible && !q.roto && tocan(rc, caja(q)));
        if (o) { romper(this, o); if (!pr._ck || !pr._ck.atraviesa) pr.destroy(); }
      });
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ al entrar a una zona
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    limpiar(this);
    this.time.delayedCall(450, () => { try { poblar(this); } catch (e) { console.warn('[rompibles]', e); } });
    return r;
  };
  const v0 = P.onVillageShown;
  if (v0) P.onVillageShown = function () { limpiar(this); return v0.apply(this, arguments); };

  // ------------------------------------------------------------------ el diario cuenta los cofres
  const j0 = P.toggleJournal;
  P.toggleJournal = function () {
    const r = j0.apply(this, arguments);
    try {
      const el = document.getElementById('ck-journal');
      if (this._overlay === 'ck-journal' && el && this.story) {
        let p = el.querySelector('.ck-jr-cofres');
        if (!p) { p = document.createElement('p'); p.className = 'ck-jr-cofres'; const ref = el.querySelector('.ck-jr-map'); (ref && ref.parentNode ? ref.parentNode : el.querySelector('.ck-win') || el).appendChild(p); }
        const n = Object.keys((this.story.flags && this.story.flags.cofres) || {}).length;
        p.textContent = `Cofres escondidos: ${n} de ${TOTAL}`;
      }
    } catch (e) {}
    return r;
  };
  window.CK_ROMPIBLES = { COFRES, TOTAL, poblar, limpiar, romper, abrir, texPaleta, paletaDe, GANCHOS, ocupacion, entra, TAM };
})();
