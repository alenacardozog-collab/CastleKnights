'use strict';
/* Nieve que se acumula: cuando nieva un rato, el mapa se va cubriendo (piso, techos, copas de los árboles, cercas,
   piedras) y al parar se derrite despacio. Todo por código a partir del dibujo de cada mapa:
   - piso: se lee el dibujo del suelo (aldea: su fondo; mapas del editor: `ed_suelo_*`) y cada píxel recibe nieve según
     lo que es (pasto y techos primero, caminos y bordes oscuros después, el agua nunca), con manchas de ruido para que
     queden pedazos sin cubrir; la nieve conserva las sombras y contornos del dibujo de abajo.
   - objetos: cada pieza con profundidad (casas, árboles, cercas...) recibe una "tapa" de nieve en sus bordes de arriba y
     en los techos de paja, dibujada encima con la misma profundidad.
   - 3 etapas (poquita, media, todo nevado) que se funden entre sí según cuánto nevó; con bastante nieve los ríos y el foso
     se congelan (hielo celeste con vetas, grietas y nieve en la orilla) y los peces y las ranas desaparecen.
   Se arma en segundo plano unos milisegundos por cuadro. Las imágenes cargadas de archivo (file://) que no dejan leer
   sus píxeles se saltean. Probar: ?ck_clima=nieve y CK_NIEVE.poner(1). Sacar la línea de index.html lo quita. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  const ETAPAS = [0.25, 0.45, 0.62]; // hasta dónde cubre cada etapa (más alto = más nieve)
  const JUNTA = 45000; // ms nevando para quedar todo blanco
  const DERRITE = 100000; // ms sin nevar para que se vaya
  const PRESUPUESTO = 6; // ms por cuadro para armar dibujos
  const NO_TAPA = /villager|npc|hero|king|_idle|_walk|_run|ck_luz|ckluz|glow|brillo|resplandor|ck_tapa|ck_nieve|ck_apagado|fogata|campfire|flame|foso|agua|water|shadow|sombra|ck_gota|ck_copo|ck_salpica|ck_onda|ck_humo|ck_niebla|fx_|ventanas|ed_suelo|_fondo$/;

  // ------------------------------------------------------------------ ruido
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lisa = t => t * t * (3 - 2 * t);
  const valor = (x, y, e) => {
    const fx = x / e, fy = y / e, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = lisa(fx - x0), ty = lisa(fy - y0);
    const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
  const ruido = (x, y) => valor(x, y, 46) * 0.55 + valor(x + 91, y + 37, 15) * 0.32 + valor(x + 17, y + 71, 5) * 0.13;

  // ------------------------------------------------------------------ color de la nieve sobre un píxel
  const BLANCO = [241, 245, 252], SOMBRA = [168, 183, 214];
  const colorNieve = (r, g, b, x, y, out) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    let t = Math.max(0, Math.min(0.88, (1 - lum / 255) * 0.95 - 0.12));
    if (lum < 60) t = Math.max(t, 0.78);
    const n = (hash(x * 7, y * 3) - 0.5) * 6;
    for (let i = 0; i < 3; i++) out[i] = Math.round(BLANCO[i] + (SOMBRA[i] - BLANCO[i]) * t + n);
    if (hash(x, y * 5) < 0.003) { out[0] = out[1] = out[2] = 255; }
    return out;
  };
  /** Qué tan pronto se cubre un píxel del piso (0 = enseguida); 9 = nunca (agua). */
  const umbralPiso = (r, g, b, x, y) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let c;
    if (b > r + 22 && b >= g - 6) return 9; // agua
    if (g > r + 4 && g > b + 6) c = 0.95; // pasto
    else if (r > 145 && g > 95 && b < 95 && r - b > 70) c = 0.9; // paja de techo
    else if (mx - mn < 22) c = lum > 90 ? 0.8 : 0.5; // piedra
    else if (lum < 55) c = 0.3; // bordes oscuros
    else if (r >= g && g >= b && lum > 100) c = 0.42; // tierra y caminos
    else c = 0.6;
    return ruido(x, y) + (1 - c) * 0.7 - 0.2;
  };

  /** Hielo sobre un píxel de agua: celeste pálido con vetas claras, alguna grieta y nieve en la orilla. */
  const pintarHielo = (d, o, x, y, w, h, q, agua) => {
    let borde = false;
    for (let k = 1; k <= 2 && !borde; k++)
      if ((x - k >= 0 && !agua(d, o - 4 * k)) || (x + k < w && !agua(d, o + 4 * k)) || (y - k >= 0 && !agua(d, o - 4 * w * k)) || (y + k < h && !agua(d, o + 4 * w * k))) borde = true;
    let c;
    if (borde) c = [238, 244, 252];
    else {
      const m = valor(x + y * 0.6, y * 2, 18), a = [188, 214, 234], b = [214, 232, 246];
      c = a.map((v, i) => v + (b[i] - v) * m);
      if (valor(x + y * 1.7, y * 0.3, 7) > 0.8) c = [236, 246, 252];
      if (Math.abs(valor(x + 300, y + 300, 11) - 0.5) < 0.016) c = [140, 172, 204];
      c = c.map((v, i) => v * 0.86 + d[o + i] * 0.14);
    }
    q[o] = c[0]; q[o + 1] = c[1]; q[o + 2] = c[2]; q[o + 3] = 245;
  };

  // ------------------------------------------------------------------ trabajos en segundo plano
  const cola = [];
  const leer = (fr, ox, oy, w, h) => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.drawImage(fr.source.image, fr.cutX + ox, fr.cutY + oy, w, h, 0, 0, w, h);
    return g.getImageData(0, 0, w, h); // tira error si la imagen es de archivo (file://): se saltea
  };

  /** Piso: tres dibujos (etapas) del tamaño del suelo, que se arman de a franjas. */
  const trabajoPiso = (S, z, suelo) => {
    const fr = suelo.frame, w = fr.cutWidth, h = fr.cutHeight;
    const base = 'ck_nieve_' + suelo.texture.key;
    if (S.textures.exists(base + '_hielo')) return { fin: () => ponerPiso(S, z, suelo, base) };
    let fuente, etapas, hielo, y = 0;
    const agua = (d, o) => d[o + 3] > 10 && d[o + 2] > d[o] + 22 && d[o + 2] >= d[o + 1] - 6;
    const col = [0, 0, 0];
    return {
      paso: () => {
        if (!fuente) {
          fuente = leer(fr, 0, 0, w, h);
          etapas = ETAPAS.map(() => new ImageData(w, h));
          hielo = new ImageData(w, h);
        }
        const d = fuente.data, y1 = Math.min(h, y + 24);
        for (; y < y1; y++)
          for (let x = 0; x < w; x++) {
            const o = (y * w + x) * 4;
            if (d[o + 3] < 10) continue;
            const u = umbralPiso(d[o], d[o + 1], d[o + 2], x, y);
            if (u >= 2) { if (agua(d, o)) pintarHielo(d, o, x, y, w, h, hielo.data, agua); continue; }
            colorNieve(d[o], d[o + 1], d[o + 2], x, y, col);
            ETAPAS.forEach((L, i) => {
              if (u >= L || (L - u < 0.03 && ((x + y) & 1))) return;
              const e = etapas[i].data;
              e[o] = col[0]; e[o + 1] = col[1]; e[o + 2] = col[2]; e[o + 3] = 255;
            });
          }
        return y >= h;
      },
      fin: () => {
        if (hielo) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(hielo, 0, 0); if (!S.textures.exists(base + '_hielo')) S.textures.addCanvas(base + '_hielo', cv); }
        if (etapas) etapas.forEach((e, i) => {
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').putImageData(e, 0, 0);
          if (!S.textures.exists(base + '_' + i)) S.textures.addCanvas(base + '_' + i, cv);
        });
        ponerPiso(S, z, suelo, base);
      }
    };
  };
  const ponerPiso = (S, z, suelo, base) => {
    if (!S.textures.exists(base + '_2')) return;
    z.piso = [0, 1, 2].map(i => S.add.image(suelo.x, suelo.y, base + '_' + i)
      .setOrigin(suelo.originX, suelo.originY).setScale(suelo.scaleX, suelo.scaleY)
      .setDepth(suelo.depth + (suelo.depth >= 5 ? 0.28 : 0.05)).setAlpha(0).setVisible(false)); // encima de los brillos del piso del editor (7.26), debajo del agua (7.3)
  // ríos congelados: encima del agua animada (aldea 0.6, foso del editor 7.3)
    if (S.textures.exists(base + '_hielo'))
      z.hielo = S.add.image(suelo.x, suelo.y, base + '_hielo').setOrigin(suelo.originX, suelo.originY).setScale(suelo.scaleX, suelo.scaleY)
        .setDepth(suelo.depth + (suelo.depth >= 5 ? 0.31 : 0.11)).setAlpha(0).setVisible(false);
  };

  /** Tapa de nieve para una pieza (casa, árbol, cerca...): bordes de arriba y techos de paja. */
  /** Qué píxeles de un dibujo llevan nieve (máscara 0/1). En los árboles la nieve se posa arriba de cada mata de hojas
      (donde el dibujo tiene sus luces y en los bordes de arriba) en manchones cortados; en techos de paja casi todo;
      en lo demás, una capa fina en los bordes de arriba. ox / oy: dónde está el dibujo, para que el ruido no se repita. */
  const mascaraNieve = (d, w, h, ox, oy) => {
    const m = new Uint8Array(w * h);
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 100;
    const lum = i => 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];
    // ¿la fila de arriba es "pared" (baldosa llena)? entonces el borde de la imagen no cuenta como borde de arriba
    let llenos = 0;
    for (let x = 0; x < w; x++) if (op(x, 0)) llenos++;
    const filaCero = llenos < w * 0.9;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!op(x, y)) continue;
        const i = y * w + x, o4 = i * 4, r = d[o4], g = d[o4 + 1], b = d[o4 + 2];
        const paja = r > 145 && g > 95 && b < 100 && r - b > 65;
        const hoja = g > r + 4 && g > b + 6 || (g >= r && g > b + 10 && lum(i) < 110);
        const n = ruido(x + ox * 3, y + oy * 3), z = hash(x + ox, y + oy);
        // distancia al aire de arriba (0 = es el borde de arriba)
        let arriba = 99;
        for (let k = 0; k < 4; k++) { if (y - k - 1 < 0 ? filaCero : !op(x, y - k - 1)) { arriba = k; break; } }
        if (hoja) {
          // matas: la nieve se posa en el borde de arriba de cada mata (donde arriba hay sombra más oscura que ella),
          // en manchones (ruido de 9 px) para que no quede en líneas
          const mancha = valor(x + ox, y + oy, 9) < 0.6;
          const tope = y > 0 && op(x, y - 1) && lum(i - w) + 16 < lum(i);
          const grosor = n < 0.45 ? 1 : 2;
          if (mancha && ((arriba < grosor && z < 0.9) || (tope && z < 0.85))) m[i] = 1;
        } else if (paja) {
          if (arriba < 4 || n < 0.78) m[i] = 1;
        } else {
          const grosor = 2 + (hash(x + ox, 7) > 0.5 ? 1 : 0);
          if (arriba < grosor) m[i] = 1;
          else if (n < 0.1 && arriba < 6) m[i] = 1;
        }
      }
    // los manchones de las hojas se engordan un píxel hacia abajo (copos que se juntan, no rayitas)
    for (let y = h - 2; y >= 0; y--)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (m[i] !== 1 || m[i + w] || !op(x, y + 1)) continue;
        const o4 = (i + w) * 4, hoja = d[o4 + 1] > d[o4] + 4 && d[o4 + 1] > d[o4 + 2] + 6;
        if (hoja && hash(x + ox * 7, y + oy * 7) < 0.55) m[i + w] = 2;
      }
    return m;
  };
  // los bosques del camino están partidos en franjas (ck_camino_prof.js): su nieve se calcula sobre el dibujo entero,
  // así el corte de cada franja no aparece como borde de arriba (las líneas rectas)
  const enteras = {};
  const parteDe = key => {
    const P = window.CK_PARTES;
    if (!P || !/_p\d+$/.test(key)) return null;
    const orig = key.replace(/_p\d+$/, ''), c = P[orig];
    if (!c) return null;
    const p = c.partes.find(q => q.key === key);
    return p ? { orig, p } : null;
  };
  const mascaraEntera = (S, orig) => {
    if (enteras[orig]) return enteras[orig];
    const img = S.textures.get(orig).getSourceImage(), w = img.width, h = img.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h).data;
    return (enteras[orig] = { w, h, d, m: mascaraNieve(d, w, h, 0, 0) });
  };

  /** Tapa de nieve para una pieza (casa, árbol, cerca...), con su color sacado del dibujo de abajo. */
  const tapa = (S, o) => {
    const fr = o.frame, key = 'ck_tapa_' + o.texture.key + '_' + fr.name;
    if (S.textures.exists(key)) return S.textures.get(key)._ckVacia ? null : key;
    const w = fr.cutWidth, h = fr.cutHeight;
    let im;
    try { im = leer(fr, 0, 0, w, h); } catch (e) { return null; }
    const d = im.data, out = new ImageData(w, h), q = out.data, col = [0, 0, 0];
    let m;
    const pt = parteDe(o.texture.key);
    if (pt) {
      try {
        const E = mascaraEntera(S, pt.orig);
        m = new Uint8Array(w * h);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++)
            if (d[(y * w + x) * 4 + 3] > 100) m[y * w + x] = E.m[(y + pt.p.y0) * E.w + (x + pt.p.x0)];
      } catch (e) { m = null; }
    }
    if (!m) m = mascaraNieve(d, w, h, fr.cutX, fr.cutY);
    let puestos = 0;
    for (let i = 0; i < w * h; i++) {
      if (!m[i]) continue;
      const o4 = i * 4, x = i % w, y = (i / w) | 0;
      colorNieve(d[o4], d[o4 + 1], d[o4 + 2], x + fr.cutX, y + fr.cutY, col);
      q[o4] = col[0]; q[o4 + 1] = col[1]; q[o4 + 2] = col[2]; q[o4 + 3] = 255; puestos++;
    }
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    if (puestos) cv.getContext('2d').putImageData(out, 0, 0);
    S.textures.addCanvas(key, cv);
    if (!puestos) { S.textures.get(key)._ckVacia = true; return null; }
    return key;
  };

  // ------------------------------------------------------------------ armar cada zona
  const zonas = {};
  const piezasDe = S => {
    const c = S.currentInterior;
    if (!c) {
      const al = S._ckAldea;
      if (!al) return null;
      const suelo = al.objs.find(o => o && o.texture && /_fondo$/.test(o.texture.key));
      return { suelo, objs: al.objs };
    }
    const objs = c.area.objs || [];
    const suelo = objs.find(o => o && o.texture && /^ed_suelo_/.test(o.texture.key));
    return { suelo, objs };
  };
  const preparar = (S, zona) => {
    if (zonas[zona]) return zonas[zona];
    const pz = piezasDe(S);
    if (!pz) return null;
    const z = (zonas[zona] = { piso: null, tapas: [], listo: false });
    if (pz.suelo) cola.push(trabajoPiso(S, z, pz.suelo));
    const lista = pz.objs.filter(o => {
      if (!o || !o.active || o === pz.suelo || !o.texture || !o.frame || o.blendMode !== 0 || o.alpha < 0.5) return false;
      if (o.type !== 'Image' && !(o.type === 'Sprite' && !(o.anims && o.anims.isPlaying))) return false;
      if (NO_TAPA.test(o.texture.key) || o.frame.cutWidth < 8 || o.frame.cutHeight < 8) return false;
      return o.displayWidth * o.displayHeight < 250000;
    });
    let i = 0;
    cola.push({
      paso: () => {
        const t0 = performance.now();
        while (i < lista.length && performance.now() - t0 < PRESUPUESTO) {
          const o = lista[i++];
          const k = tapa(S, o);
          if (k) z.tapas.push({ o, im: S.add.image(o.x, o.y, k).setOrigin(o.originX, o.originY).setScale(o.scaleX, o.scaleY).setFlip(o.flipX, o.flipY).setRotation(o.rotation).setDepth(o.depth + 0.001).setAlpha(0).setVisible(false) });
        }
        return i >= lista.length;
      },
      fin: () => { z.listo = true; }
    });
    return z;
  };
  const trabajar = () => {
    const t0 = performance.now();
    while (cola.length && performance.now() - t0 < PRESUPUESTO) {
      const j = cola[0];
      let hecho = true;
      try { hecho = !j.paso || j.paso(); } catch (e) { hecho = true; j.fin = null; }
      if (hecho) { cola.shift(); try { if (j.fin) j.fin(); } catch (e) {} }
    }
  };

  // ------------------------------------------------------------------ cada cuadro
  let A = 0; // cuánta nieve hay (0..1)
  const sat = x => Math.max(0, Math.min(1, x));
  const paso = (S, dt) => {
    const CL = window.CK_CLIMA, act = CL && CL.estado ? CL.estado.act : null;
    const nevando = act && act.nieve > 0.5 && CL.actual() === 'nieve';
    A = sat(A + (nevando ? dt / JUNTA : -dt / DERRITE));
    const zona = S.currentZoneKey ? S.currentZoneKey() : 'village';
    const c = S.currentInterior, afuera = window.CK_AFUERA ? window.CK_AFUERA(S) : !c || c.area.outdoor;
    if (A > 0 && afuera) preparar(S, zona);
    trabajar();
    const e = [sat(A / 0.3), sat((A - 0.3) / 0.3), sat((A - 0.6) / 0.35)], et = sat((A - 0.12) / 0.5);
    const hielo = sat((A - 0.35) / 0.35); // los ríos se congelan cuando ya nevó bastante
    Object.keys(zonas).forEach(k => {
      const z = zonas[k], aca = k === zona && afuera && A > 0;
      if (z.piso) z.piso.forEach((im, i) => { if (!im.active) return; im.setVisible(aca && e[i] > 0); im.setAlpha(e[i]); });
      if (z.hielo && z.hielo.active) { z.hielo.setVisible(aca && hielo > 0); z.hielo.setAlpha(hielo); }
      z.tapas.forEach(t => {
        if (!t.im.active) return;
        const ver = aca && t.o.active && t.o.visible && et > 0;
        t.im.setVisible(ver);
        if (ver) t.im.setAlpha(et);
      });
    });
  };

  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    try { if (this._gameMode === 'campaign' && !this.isGamePaused) paso(this, Math.min(100, dt || 16)); }
    catch (e) { if (!this._ckNieveError) { this._ckNieveError = true; console.warn('[nieve]', e); } }
    return dn0.apply(this, arguments);
  };
  // si la aldea se vuelve a armar (sus piezas son otras), se arma de nuevo su nieve
  const vs0 = P.onVillageShown;
  P.onVillageShown = function () {
    const z = zonas.village;
    if (z && z.tapas.length && z.tapas.some(t => !t.o.active)) { z.tapas.forEach(t => t.im.destroy()); if (z.piso) z.piso.forEach(i => i.destroy()); if (z.hielo) z.hielo.destroy(); delete zonas.village; }
    return vs0 ? vs0.apply(this, arguments) : undefined;
  };

  window.CK_NIEVE = {
    /** Cuánto están congelados los ríos (0..1). */
    hielo: () => sat((A - 0.35) / 0.35),
    poner: x => { A = sat(x); },
    cuanta: () => A,
    zonas: () => Object.keys(zonas).map(k => [k, !!zonas[k].piso, zonas[k].tapas.length, zonas[k].listo]),
    pendientes: () => cola.length
  };
})();
