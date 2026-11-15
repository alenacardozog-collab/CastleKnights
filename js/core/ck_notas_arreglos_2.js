'use strict';
/* Arreglos de la segunda tanda de notas de prueba (15/11, pedido del dueño: "acá están los nuevos cambios, aplicalos").
   Usa el mecanismo de ck_notas_arreglos.js (piso, base, partes, tapa, quitar/poner, macizo, pieFino…) y le SUMA lo de cada
   mapa (no pisa lo de la primera tanda: las listas se juntan y las piezas se agregan). Suma dos cosas nuevas:
   - pieForma: { clave: alto } → el choque de la pieza es su pie con la forma del dibujo: en cada columna, los últimos `alto`
               px de abajo (armeros, lanzas, barriles: chocan donde apoyan, y se pasa por delante y por detrás).
   - trozos:   { clave: [[x0, y0, x1, y1], …] } → la pieza se corta en pedazos sueltos (cada uno con su propia imagen, del
               tamaño del pedazo, ordenado por su punta de abajo). Así un cerco grande se puede romper de a tramos.
   - reemplazar: { campo: valor } → para cambiar del todo un dato de la primera tanda (no sumarle).
   El número de la nota del dueño va entre paréntesis. Va después de ck_notas_arreglos.js. Borrar la línea lo saca. */
(function () {
  const NA = window.CK_NOTAS_ARREGLOS;
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !NA || !NA.Z) return;
  const P = MainGameScene.prototype, Z = NA.Z;
  const ed = k => (/^ed_/.test(k) ? k : 'ed_' + k);
  const esDe = (k, base) => k === base || new RegExp('^' + base + '(_esp)?(_rc\\d+)?(_p\\d+)?(_na\\d+)?$').test(k);

  // sumar a lo que ya hay: listas se juntan, objetos se completan; `reemplazar` cambia del todo
  const mas = (zona, o) => {
    const z = Z[zona] = Z[zona] || {};
    Object.keys(o).forEach(k => {
      const v = o[k];
      if (k === 'reemplazar') { Object.assign(z, v); return; }
      if (Array.isArray(v)) z[k] = (Array.isArray(z[k]) ? z[k] : []).concat(v);
      else if (v && typeof v === 'object' && !(v instanceof RegExp)) z[k] = Object.assign({}, z[k] || {}, v);
      else z[k] = v;
    });
  };
  const verde = (r, g, b) => g > r + 6 && g >= b - 4;
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;

  // ================================================================== LOS MAPAS
  // Campos del Roble: el muro de piedra de la derecha recortaba los árboles (1); el borde de la loma del círculo de piedras
  // no se sube: un choque a lo largo del barranco, desde el círculo hasta las rocas de abajo (2)
  mas('ed_campos_del_roble.main', {
    partes: { cr_muro_3: [{ r: [[801, 290, 960, 350]], base: 340 }] },
    poner: [[218, 333, 18, 11], [228, 336, 22, 11], [242, 339, 22, 12], [256, 344, 21, 14], [269, 350, 19, 16], [280, 358, 18, 18],
      [290, 368, 19, 17], [301, 377, 19, 17], [312, 386, 18, 18], [322, 396, 16, 19], [330, 407, 17, 18], [339, 417, 18, 18],
      [349, 427, 15, 20], [356, 439, 19, 17], [366, 448, 19, 17], [377, 457, 18, 18], [387, 467, 14, 20], [393, 479, 11, 21],
      [396, 492, 13, 21], [401, 505, 12, 14]]
  });
  // Norte del Roble: la carreta de abajo (3), la casa (4), el árbol del este se atravesaba (5)
  mas('ed_norte_del_roble.main', {
    partes: { an_cosa_19: [{ r: [[510, 710, 640, 742]], base: 738 }] },
    base: { an_casa: 646 },
    poner: [[1132, 626, 26, 12]]                 // el tronco del árbol de la izquierda (el dibujo trae flores abajo)
  });
  // Casa quemada: la pared del costado (6)
  mas('ed_casa_quemada_norte.main', { poner: [[160, 100, 28, 72]] });
  // Casa de la peste: el dintel de la puerta tapa al héroe que pasa por debajo (7); la mesa choca con su forma (8)
  mas('ed_casa_peste.main', {
    partes: { cpe_marco_de_la_puerta: [{ r: [[204, 184, 278, 205]], base: 262 }] },
    macizo: { cpe_mesa: [[87, 170, 143, 205]] }
  });
  // Bosque Embrujado: la loma de arriba a la derecha (9), el árbol seco (10), el anillo de hongos se ordena por bandas (11)
  mas('ed_bosque_embrujado.main', {
    poner: [[1256, 70, 32, 60]],
    macizo: { be_arbol_seco_3: [[345, 115, 450, 168]] },
    partes: { be_anillo_de_hongos: [{ r: [[265, 215, 410, 252]], base: 252 }, { r: [[265, 252, 410, 282]], base: 282 }] }
  });
  // Cementerio Real: las estatuas, los bancos, el sarcófago y la tumba del medio chocan con su forma (12, 13); la lápida grande
  // de la derecha (14); la pared de arriba de la capilla (15); se pasa por detrás del mausoleo (16)
  mas('ed_cementerio_real.main', {
    macizo: {
      cm_estatua_del_rey: [[555, 325, 620, 366]], cm_estatua_del_rey_2: [[820, 325, 885, 366]],
      cm_estatua_del_rey_3: [[555, 500, 620, 542]], cm_estatua_del_rey_4: [[820, 500, 885, 542]],
      cm_banco: [[622, 296, 676, 326]], cm_banco_2: [[768, 292, 818, 322]], cm_banco_3: [[518, 366, 556, 420]],
      cm_banco_4: [[516, 456, 553, 514]], cm_banco_5: [[880, 356, 922, 410]], cm_banco_6: [[886, 456, 924, 514]],
      cm_sarcofago_2: [[395, 330, 468, 365]], cm_tumba_15: [[436, 500, 487, 532]]
    },
    poner: [[1020, 300, 36, 84], [1035, 460, 255, 66], [600, 640, 240, 52]],
    quitar: [[600, 560, 840, 640]]
  });
  // San Roque: el corral de los chanchos venía pegado al pinar (una pieza con la punta abajo de todo, que tapaba al héroe
  // parado delante del cerco): los tramos del cerco se ordenan por su propio pie (20)
  const bandas = [];
  for (let y = 592; y < 688; y += 16) bandas.push({ r: [[248, y, 264, y + 16]], base: y + 16 });
  mas('ed_san_roque.main', {
    partes: { sr_pinar: [{ r: [[248, 686, 400, 716]], base: 711 }, { r: [[248, 568, 400, 598]], base: 596 }, { r: [[318, 598, 362, 626]], base: 622 }].concat(bandas) }
  });
  // La Fosa: el nido de Garra Negra choca con su forma (28)
  mas('ed_cueva_fosa.main', { macizo: { fos_nido_de_garra_negra: [[325, 290, 490, 372]] } });
  // Choza orca: las camas de pieles son piso (31); los cajones chocan con su forma (32)
  mas('ed_choza_orca.main', {
    piso: ['cho_cama_de_pieles', 'cho_cama_de_pieles_2', 'cho_cama_de_pieles_3', 'cho_cama_de_pieles_4'],
    macizo: { cho_cajones_2: [[420, 150, 466, 185]] }
  });
  // Patio de la Fortaleza Orca: el rincón de los armeros detrás de la entrada del oeste: se camina por el piso gris y los
  // armeros, barriles y lanzas chocan con su pie (33); la choza del norte (35); las casas del norte (36); se pasa por debajo
  // del alero del este (37); el paso del sur (38); las casas de las entradas del sur (39)
  mas('ed_patio_fortaleza_orca.main', {
    quitar: [[22, 95, 125, 185], [742, 170, 778, 250], [630, 276, 760, 304]],
    sinPiesEn: [[22, 95, 125, 185], [742, 170, 778, 250]],
    pieForma: { pfo_objeto_11: 8, pfo_objeto_64: 8, pfo_objeto_65: 8, pfo_objeto_17: 7, pfo_objeto_15: 9, pfo_objeto_59: 7 },
    poner: [[470, 62, 132, 48], [712, 56, 84, 44], [838, 56, 100, 40], [190, 332, 116, 38], [326, 336, 116, 50]],
    base: { pfo_objeto_18: 245 }
  });
  // Fortaleza Orca, la entrada del oeste otra vez (41, 42): el bloque del muro choca entero hasta su pie, el poste de la escalera
  // sólo con su pie, las estacas del arco con su forma; bajo el arco se pasa y se baja la escalera. El estrado del trono: los
  // escalones son piso (se sube por delante) y choca sólo el trono (44). Los palos del ruedo se rompen de a tramos (43).
  mas('ed_fortaleza_orca.main', {
    reemplazar: {
      poner: [[40, 250, 220, 52], [242, 252, 20, 30], [298, 248, 20, 32], [106, 444, 20, 12]],
      tapa: [
        { r: [[102, 320, 122, 348], [122, 330, 142, 358], [142, 340, 162, 368], [162, 350, 182, 378], [182, 360, 202, 388], [202, 370, 222, 398], [222, 380, 256, 420]], base: 470, sin: (r, g, b) => lum(r, g, b) > 115 },
        { r: [[196, 410, 372, 534]], base: 534, sin: (r, g, b) => lum(r, g, b) > 110 }
      ],
      macizo: { of_c2_armero_4: [[680, 300, 770, 384]], of_c2_cofre_3: [[878, 396, 940, 458]], of_c2_trono_de_huesos: [[820, 96, 960, 240]], of_c2_estacas_arco: [[195, 285, 272, 334]] }
    },
    // (el dintel del portón venía con "pies" de ck_pies_piezas: es un tronco en alto, se pasa por debajo; chocan los postes)
    quitar: [[150, 330, 260, 420]],
    sinPiesEn: [[150, 330, 260, 420]],
    partes: { of_c2_trono_de_huesos: [{ r: [[722, 156, 830, 212]], piso: true }, { r: [[722, 0, 850, 156]], base: 156 }] },
    poner: [[752, 140, 76, 14]],                 // el pie del trono (se para en los escalones, delante)
    trozos: {
      of_c2_arena: [[464, 300, 534, 362], [534, 300, 602, 362], [602, 326, 662, 390], [602, 390, 662, 440], [579, 440, 662, 490], [519, 430, 579, 490], [464, 430, 519, 490]],
      of_c2_estacas_arena_oeste: [[430, 305, 484, 359], [388, 345, 450, 404], [388, 404, 450, 464], [450, 404, 484, 464]]
    }
  });
  // Mazmorra del Sello: la tabla de las tres piedras choca sólo en su cuadrante (48)
  mas('ed_mazmorra_sello.main', { reemplazar: { choques: [[822, 470, 30, 42], [192, 222, 112, 48], [222, 268, 58, 60]] } });

  // ------------------------------------------------------------------ cosas que se rompen (34, 43)
  try {
    const TR = window.CK_TERRENO_ROMPIBLE;
    if (TR && TR.MAPAS && TR.TIPOS) {
      // (34) "dejame romper las cosas sencillas de los mapas": cofres, ollas, vasijas, jarrones, canastos y tambores también
      const L = TR.TIPOS.find(t => t[2] === 'liviano');
      if (L && !/cofre/.test(L[0].source)) L[0] = new RegExp(L[0].source + '|cofre|olla|vasija|jarron|canasto|tambor');
      const PF = TR.MAPAS.patio_fortaleza_orca;
      if (PF) {
        // (34) el portón del norte: al romperlo se abre todo el hueco (quedaba un choque al costado); el cofre de al lado se rompe
        if (PF.puertas && PF.puertas[0]) PF.puertas[0].corta = [428, 96, 474, 152];
        PF.cajas = (PF.cajas || []).concat([[398, 120, 432, 142, 3]]);
      }
      const FO = TR.MAPAS.fortaleza_orca;
      if (FO) FO.cajas = [[380, 300, 670, 495, 4]];
    }
  } catch (e) { console.warn('[notas 2: rompibles]', e); }

  // ================================================================== mecanismo nuevo
  const pixeles = (s, key) => {
    const fr = s.textures.getFrame(key); if (!fr) return null;
    const w = fr.cutWidth, h = fr.cutHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
    return { w, h, c, d: g.getImageData(0, 0, w, h).data };
  };
  // trozos: al armar el mapa, la pieza se reemplaza por sus pedazos
  const trocear = (s, zona, a) => {
    const z = Z[zona]; if (!z || !z.trozos || !a.items) return;
    const out = [];
    a.items.forEach(it => {
      const k = it.key || '', kb = Object.keys(z.trozos).find(b => esDe(k, ed(b)));
      if (kb === undefined) { out.push(it); return; }
      const src = pixeles(s, k); if (!src) { out.push(it); return; }
      const rs = z.trozos[kb], sc = it.scale || 1, ox = it.ox === undefined ? 0.5 : it.ox, oy = it.oy === undefined ? 1 : it.oy;
      const left = it.x - src.w * sc * ox, top = it.baseY - (it.lift || 0) - src.h * sc * oy;
      // cada píxel va al pedazo que lo contiene (o al más cercano, así no se pierde nada)
      const cajas = rs.map(() => ({ x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, px: [] }));
      for (let ty = 0; ty < src.h; ty++) for (let tx = 0; tx < src.w; tx++) {
        const i = (ty * src.w + tx) * 4; if (src.d[i + 3] < 8) continue;
        const mx = left + (it.flipX ? src.w - 1 - tx : tx) * sc + 0.5, my = top + ty * sc + 0.5;
        let j = rs.findIndex(r => mx >= r[0] && mx < r[2] && my >= r[1] && my < r[3]);
        if (j < 0) {
          let mejor = 1e9;
          rs.forEach((r, q) => { const dx = Math.max(r[0] - mx, 0, mx - r[2]), dy = Math.max(r[1] - my, 0, my - r[3]), dd = dx * dx + dy * dy; if (dd < mejor) { mejor = dd; j = q; } });
        }
        const C = cajas[j]; C.px.push(tx, ty);
        C.x0 = Math.min(C.x0, tx); C.x1 = Math.max(C.x1, tx); C.y0 = Math.min(C.y0, ty); C.y1 = Math.max(C.y1, ty);
      }
      cajas.forEach((C, j) => {
        if (!C.px.length) return;
        const W = C.x1 - C.x0 + 1, H = C.y1 - C.y0 + 1, nk = k.replace(/(_na\d+)$/, '') + '_tz' + j;
        if (!s.textures.exists(nk)) {
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const g = cv.getContext('2d'), od = g.createImageData(W, H), o = od.data;
          for (let q = 0; q < C.px.length; q += 2) {
            const tx = C.px[q], ty = C.px[q + 1], i = (ty * src.w + tx) * 4, k2 = ((ty - C.y0) * W + (tx - C.x0)) * 4;
            o[k2] = src.d[i]; o[k2 + 1] = src.d[i + 1]; o[k2 + 2] = src.d[i + 2]; o[k2 + 3] = src.d[i + 3];
          }
          g.putImageData(od, 0, 0);
          s.textures.addCanvas(nk, cv);
        }
        if (NA.enteras) NA.enteras.add(nk);
        // dónde cae en el mapa (con la pieza dada vuelta, las columnas se cuentan desde la derecha)
        const mx0 = it.flipX ? left + (src.w - 1 - C.x1) * sc : left + C.x0 * sc, my1 = top + (C.y1 + 1) * sc;
        out.push({ key: nk, x: mx0 + W * sc / 2, baseY: my1, lift: 0, scale: sc, flipX: !!it.flipX, shadow: 0 });
      });
    });
    a.items = out;
  };
  const envolver = kind => {
    const L0 = INTERIOR_LAYOUTS[kind];
    if (typeof L0 !== 'function' || L0._ckNA2) return;
    const L = function (kit) {
      const r = L0.apply(this, arguments);
      try {
        const s = window.activeGameScene || (window.game && game.scene.scenes.find(x => x.startCampaign));
        Object.keys(kit.areas || {}).forEach(nombre => { const a = kit.areas[nombre]; if (a && s) trocear(s, kind + '.' + nombre, a); });
      } catch (e) { console.warn('[notas 2: trozos]', kind, e); }
      return r;
    };
    L._ckNA2 = true; L._ckNA = L0._ckNA;
    INTERIOR_LAYOUTS[kind] = L;
  };
  Object.keys(Z).filter(zn => Z[zn].trozos).forEach(zn => envolver(zn.split('.')[0]));

  // pieForma: el pie de la pieza con su forma (los últimos `alto` px de cada columna)
  const zonaChoque = (S, a, x, y, w, h) => {
    const zn = S.add.zone(a.x + x + w / 2, a.y + y + h / 2, w, h);
    S.physics.add.existing(zn, true);
    zn._ckNA = true;
    S.interiorObstacles.add(zn);
    (a.objs = a.objs || []).push(zn);
  };
  const pies = S => {
    const c = S.currentInterior, a = c && c.area, zona = S.currentZoneKey && S.currentZoneKey(), z = Z[zona];
    if (!a || !z || !z.pieForma || a._ckNA2pies || !S.interiorObstacles) return;
    a._ckNA2pies = true;
    Object.keys(z.pieForma).forEach(k => {
      const b = ed(k), ALTO = z.pieForma[k], Q = 2;
      (a.objs || []).forEach(o => {
        if (!o || !o.texture || !o.frame || o.type === 'Zone' || !esDe(o.texture.key, b)) return;
        const fr = o.frame, w = fr.cutWidth, h = fr.cutHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const g = cv.getContext('2d', { willReadFrequently: true });
        g.drawImage(fr.source.image || fr.source.canvas, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h).data, sx = Math.abs(o.scaleX), sy = Math.abs(o.scaleY);
        const left = o.x - o.displayWidth * o.originX - a.x, top = o.y - o.displayHeight * o.originY - a.y;
        const x0 = Math.floor(left), y0 = Math.floor(top), gw = Math.ceil(w * sx / Q) + 1, gh = Math.ceil(h * sy / Q) + 1, cel = new Uint8Array(gw * gh);
        for (let tx = 0; tx < w; tx++) {
          let yb = -1;
          for (let ty = h - 1; ty >= 0; ty--) if (d[(ty * w + tx) * 4 + 3] > 60) { yb = ty; break; }
          if (yb < 0) continue;
          for (let ty = Math.max(0, yb - ALTO); ty <= yb; ty++) {
            if (d[(ty * w + tx) * 4 + 3] < 60) continue;
            const mx = left + (o.flipX ? w - 1 - tx : tx) * sx, my = top + ty * sy, gx = Math.floor((mx - x0) / Q), gy = Math.floor((my - y0) / Q);
            if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) cel[gy * gw + gx] = 1;
          }
        }
        // corridas por fila → rectángulos
        for (let gy = 0; gy < gh; gy++) {
          let gx = 0;
          while (gx < gw) {
            if (!cel[gy * gw + gx]) { gx++; continue; }
            let g1 = gx; while (g1 + 1 < gw && cel[gy * gw + g1 + 1]) g1++;
            zonaChoque(S, a, x0 + gx * Q, y0 + gy * Q, (g1 - gx + 1) * Q, Q);
            gx = g1 + 1;
          }
        }
      });
    });
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { pies(this); } catch (e) { console.warn('[notas 2: pies]', e); }
    return r;
  };
  window.CK_NOTAS_ARREGLOS_2 = { mas, trocear };
})();
