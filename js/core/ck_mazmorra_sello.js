'use strict';
/* La Mazmorra del Sello (13/11, pedidos del dueño: "la mazmorra de los demonios… un solo mapa grande"; "que hayan puzzles
   entre los niveles, no que sea solo pelear"; "usa pixellab o haz con código las cosas de los puzzles"; "añade animaciones
   a la lava, y antorchas y esas cosas, también que los sellos brillen").
   Mapa nuevo del Taller (mazmorra_sello, 1436×802, piezas ed_mz_*), de las tres capas de Google Flow del dueño
   (trabajo\nuevos_flow\mazmorra_demonios\: preparar.py y arte.py). Lo que se mueve, gira o se rompe se sacó del dibujo
   y lo pone este archivo (el arte está en ck_mazmorra_sello_arte.js).
   NIVEL 1 · la llegada (abajo; el círculo del portal de Oswin) y el SALÓN DE HUESOS:
     PUZZLE 1 · LOS BLOQUES DE CALAVERA: las salidas del oeste y del este tienen rejas. Empujando (caminar contra el bloque)
     los dos bloques hasta las placas del piso, cada placa abre su reja y el bloque queda clavado. Si un bloque se traba,
     un golpe a la pila de cráneos del medio los devuelve a su lugar.
   NIVEL 2 OESTE · el RÍO DE LAVA y el SANTUARIO DE LOS REYES:
     PUZZLE 2 · LOS PILARES DE BASALTO: del salón se llega al borde de la lava. Hay una losa firme; las piedras rúnicas de
     arriba y de abajo (NE y SE) levantan un pilar cada una por 5,5 s: de lejos (flecha, hechizo) hay que tener los dos
     arriba para cruzar a la orilla de arriba. Al cruzar quedan firmes. Las otras dos piedras (NO y SO), prendidas las dos,
     dan un premio.
     PUZZLE 3 · LAS CORONAS DE LOS REYES: cuatro estatuas con la corona apagada; un golpe prende o apaga la suya y la de
     las dos vecinas (en ronda). Con las cuatro prendidas cae el escudo del primer obelisco y se rompe a golpes. La tabla
     del centro (T) muestra el camino de las baldosas.
   NIVEL 2 ESTE · la FRAGUA (pelea grande; placas de pinchos que suben por columnas) y el CRIADERO:
     PUZZLE 4 · LA LUZ DEL CRISTAL: el cristal dorado tira un rayo; los espejos se giran con T (dos posiciones) y los
     capullos lo cortan (rotos, sale un diablillo). La luz sobre el segundo obelisco lo quema y lo rompe. Mientras el
     obelisco está en pie salen diablillos de las grietas.
   NIVEL 3 · con los dos obeliscos rotos se abre la REJA DE HUESOS del salón:
     PUZZLE 5 · LAS BALDOSAS: las falsas se rompen (un corazón y de vuelta al principio). El camino es el de la tabla.
     Arriba, la ARENA DEL SEÑOR DEL SELLO: el círculo de runas, el Sello rajado y Elia en la jaula del altar.
   Efectos: la lava late y corre (brillo, vetas que se mueven, burbujas, chispas), las grietas, las runas de los
   obeliscos, el círculo y el Sello laten en rojo; los braseros pintados son llamas vivas (ck_fuegos_vivos.js) y todo
   da luz en la penumbra (ck_oscuridad.js + ck_luz.js).
   Lo que se resuelve queda en la partida (story.flags.mz). Va después de ck_mazmorra_sello_arte.js, ck_capitulo3.js
   (los demonios) y ck_fuegos_vivos.js. Borrar sus dos líneas de index.html lo saca (el mapa queda sin puzzles). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const D = window.EDITOR_DATA, ID = 'mazmorra_sello', A = window.CK_MAZMORRA_ARTE;
  if (!D || !D.mapas || !D.mapas[ID] || !INTERIOR_LAYOUTS['ed_' + ID] || !A) return;
  const Z = 'ed_' + ID + '.main', P = MainGameScene.prototype;
  const E = A.ent;
  const LLEGADA = { x: 720, y: 742 }, PORTAL = { x: 721, y: 728 };
  const SALAS = {
    salon: [470, 425, 965, 628], santuario: [72, 150, 420, 373], lava: [72, 470, 418, 700], fragua: [1015, 475, 1368, 700],
    criadero: [1015, 150, 1368, 373], arena: [480, 110, 960, 300], baldosas: [646, 295, 792, 373], llegada: [622, 650, 820, 802]
  };
  // PUZZLE 1
  const PLACAS = { o: { x: 511, y: 528 }, e: { x: 928, y: 528 } };
  const HUELLA = { w: 50, h: 30 };
  const REJAS = { o: [462, 494, 12, 100], e: [961, 494, 12, 100] };
  const PILA = [676, 459, 763, 514];
  // PUZZLE 2
  const PILARES = [[374, 532, 46, 36], [328, 546, 46, 36], [282, 524, 46, 36]];   // P1 firme, P2 (piedra NE), P3 (piedra SE): al puente
  const ESQUINA = [398, 490, 24, 28];                                               // el pasillo no toca la orilla de arriba
  const SEGURO_LAVA = { x: 446, y: 556 };
  const DURA_PILAR = 5500;
  // PUZZLE 3 (en ronda: arriba izq, arriba der, abajo der, abajo izq)
  const RONDA = ['rey_1', 'rey_3', 'rey_4', 'rey_2'];
  const TABLA = { x: 250, y: 330 };
  // PUZZLE 4
  const CRISTAL = { x: 1062, y: 300 };
  const ESPEJOS = ['espejo_1', 'espejo_2', 'espejo_3'];
  const ESP_INI = [0, 0, 1];                    // 0 = "/", 1 = "\" (la solución: espejo_3 "/" y espejo_2 "\")
  const CAPULLOS = ['capullo_1', 'capullo_2', 'capullo_3', 'capullo_4', 'capullo_5'];
  const QUEMA = 2500;
  // PUZZLE 5
  const BAL = { x0: 648, x1: 790, y0: 297, y1: 371, seguras: [6, 1] };   // abajo: la tercera; arriba: la segunda
  const VUELTA_BAL = { x: 719, y: 430 };
  // la fragua
  const PUAS = { cols: [1040, 1084, 1128], filas: [523, 562, 601, 640, 679], w: 40, h: 34 };
  const BRASEROS = [[626, 400, 44, 72], [768, 400, 47, 72], [488, 560, 48, 66], [900, 560, 50, 66], [484, 30, 56, 60], [896, 30, 56, 60], [484, 180, 56, 60], [896, 180, 56, 60]];
  const FUEGO = [255, 150, 70], LAVA = [255, 120, 40], ROJO = [255, 50, 40], ORO = [255, 210, 120];

  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const facil = () => { try { return window.CK_DIFICULTAD && CK_DIFICULTAD.actual() === 'facil'; } catch (e) { return false; } };
  const nota = t => { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(t); } catch (e) {} };
  const aqui = S => !!(S && S.currentZoneKey && S.currentZoneKey() === Z && S.currentInterior && S.currentInterior.area);
  const MEM = {};
  const fl = S => { const s = S && S.story; if (s) { s.flags = s.flags || {}; return (s.flags.mz = s.flags.mz || {}); } return (MEM.mz = MEM.mz || {}); };
  const guardar = S => { try { S.saveStory && S.saveStory(); } catch (e) {} };
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const tocan = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const dentro = (p, r) => p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3];
  const texto = (S, x, y, t, c) => { try { S.createFloatingText(x, y, t, c || 0xfde68a); } catch (e) {} };
  const herir = (S, n, txt) => {
    if (S.isDead || (S._mzHerido && S.time.now - S._mzHerido < 800)) return;
    S._mzHerido = S.time.now;
    try { S.damagePlayer(facil() ? Math.max(1, n - 1) : n); } catch (e) {}
    if (txt) texto(S, S.player.x, S.player.y - 50, txt, 0xfca5a5);
  };
  const teleport = (S, a, q) => { try { S.player.body.reset(a.x + q.x, a.y + q.y); } catch (e) {} };
  const chispas = (S, x, y, n, col, alto) => {
    for (let i = 0; i < n; i++) {
      const c = S.add.circle(x + R(-8, 8), y + R(-4, 4), R(1, 2.4), col || 0xffb347, 1).setDepth(y + 30).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: c, x: c.x + R(-26, 26), y: c.y - R(10, alto || 40), alpha: 0, scale: 0.4, duration: R(450, 900), ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
  };
  const polvo = (S, x, y, n, col) => {
    for (let i = 0; i < n; i++) {
      const c = S.add.circle(x + R(-12, 12), y + R(-4, 4), R(2, 4), col || 0x5c4a44, 0.8).setDepth(y + 3);
      S.tweens.add({ targets: c, x: c.x + R(-30, 30), y: c.y - R(3, 12), alpha: 0, scale: 2, duration: R(380, 700), ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
  };

  // ------------------------------------------------------------------ texturas
  const cargadas = {};
  const cargar = S => {
    const T = S.textures, poner1 = (k, src) => {
      if (T.exists(k) || cargadas[k]) return; cargadas[k] = 1;
      const im = new Image(); im.onload = () => { try { if (!T.exists(k)) T.addImage(k, im); } catch (e) {} }; im.src = src;
    };
    Object.keys(E).forEach(k => poner1('ckmz_' + k, E[k].src));
    Object.keys(A.brillo).forEach(k => poner1('ckmzb_' + k, A.brillo[k].src));
    Object.keys(A.runas).forEach(k => poner1('ckmzr_' + k, A.runas[k].src));
    A.baldosas.forEach((b, i) => poner1('ckmzt_' + i, b.src));
    const lienzo = (k, w, h, fn) => { if (T.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); T.addCanvas(k, c); };
    const r = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // una reja de hierro que cierra un pasillo (se ve de costado)
    lienzo('ckmz_rejalado', 14, 112, g => {
      r(g, '#0b0a0d', 2, 6, 10, 106); r(g, '#2b2a32', 4, 8, 6, 102); r(g, '#4a4955', 5, 8, 1, 102);
      for (let y = 14; y < 108; y += 13) { r(g, '#0b0a0d', 0, y, 14, 4); r(g, '#55545f', 1, y, 12, 1); r(g, '#8a8996', 6, y + 1, 2, 2); }
      r(g, '#0b0a0d', 0, 0, 14, 8); r(g, '#3d3c46', 1, 1, 12, 5); r(g, '#ff4d30', 5, 52, 4, 6); r(g, '#ffd0a0', 6, 54, 2, 2);
    });
    // las púas de una placa de la fragua
    lienzo('ckmz_puas', 34, 18, g => {
      [3, 11, 19, 27].forEach((x0, i) => { for (let y = 0; y < 16; y++) { const a = Math.floor(y / 5); r(g, '#15141a', x0 + 2 - a, y + (i % 2) * 2, a * 2 + 1, 1); if (a) r(g, '#c9ccd6', x0 + 3 - a, y + (i % 2) * 2, Math.max(1, a * 2 - 1), 1); } r(g, '#ffffff', x0 + 2, 1 + (i % 2) * 2, 1, 3); });
    });
    // una mancha blanda (brillos y halos)
    lienzo('ckmz_halo', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    lienzo('ckmz_veta', 40, 6, g => { const gr = g.createLinearGradient(0, 0, 40, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 1, 40, 4); });
  };
  const listas = S => Object.keys(E).every(k => S.textures.exists('ckmz_' + k)) && Object.keys(A.brillo).every(k => S.textures.exists('ckmzb_' + k))
    && Object.keys(A.runas).every(k => S.textures.exists('ckmzr_' + k)) && A.baldosas.every((b, i) => S.textures.exists('ckmzt_' + i));
  const pr0 = P.preload;
  P.preload = function () { if (pr0) pr0.apply(this, arguments); try { cargar(this); } catch (e) {} };

  // ------------------------------------------------------------------ el mapa: carteles, sonido, región
  let registrado = false;
  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      if (!registrado) { registrado = true; try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.unshift([/^mazmorra_sello$/, 'El Reino del Sello']); } catch (e) {} }
      ['talkers', 'fx', 'colliders', 'exits'].forEach(k => (a[k] = a[k] || []));
      a.ambient = [['amb_infierno', 0.42], ['amb_fire', 0.22]];
      const t = (x, y, rr, lines) => a.talkers.push({ x, y, r: rr, lines });
      t(PORTAL.x, PORTAL.y + 10, 46, ['El portal del Padre Oswin: un círculo de luz dorada en medio de tanta oscuridad. Por acá se vuelve']);
      t(PLACAS.o.x, PLACAS.o.y + 4, 30, ['Una placa con una calavera, hundida en el piso. Algo pesado encima la haría bajar']);
      t(PLACAS.e.x, PLACAS.e.y + 4, 30, ['Otra placa con calavera. Del otro lado de la reja se oye el martilleo de una fragua']);
      t(720, 524, 40, ['Una pila de cráneos. Si un bloque se traba en un rincón, un golpe acá y vuelven a su lugar']);
      t(444, 520, 34, ['La lava corta el paso. Las piedras de las runas, arriba y abajo, esperan un golpe. Desde la losa firme llegás a las dos: arriba y abajo']);
      t(250, 250, 40, ['Cuatro reyes de piedra con la corona apagada. Golpeás a uno y cambian también sus vecinos']);
      t(1110, 300, 46, ['Un cristal dorado tira una luz santa. Los espejos se giran con T; los capullos la tapan']);
      t(1084, 600, 50, ['Placas de pinchos: suben por columnas, una y otra. Mejor medir el paso']);
      t(719, 420, 30, ['Baldosas con runas. No todas aguantan el peso: la tabla del santuario sabía cuáles']);
      t(719, 205, 52, ['El Sello: un portón redondo, rajado, con luz roja que se escapa por las grietas. Algo respira del otro lado']);
    }
    return r;
  };

  // ------------------------------------------------------------------ armar y desarmar
  const quitar = S => {
    const M = S._mz; if (!M) return;
    try { M.objs.forEach(o => { try { if (o && o.active !== false && o.destroy) o.destroy(); } catch (e) {} }); } catch (e) {}
    try { if (M.colLava) M.colLava.forEach(c => { try { S.physics.world.removeCollider(c); } catch (e) {} }); if (M.lava) M.lava.clear(true, true); } catch (e) {}
    try { M.eventos.forEach(ev => ev.remove()); } catch (e) {}
    S._mz = null;
  };
  const poner = S => {
    quitar(S);
    if (!aqui(S)) return;
    cargar(S);
    if (!listas(S)) { S.time.delayedCall(120, () => { if (aqui(S) && !S._mz) poner(S); }); return; }
    const a = S.currentInterior.area, F = fl(S);
    const M = S._mz = { a, objs: [], eventos: [], ents: {}, col: {}, enc: {}, t0: S.time.now };
    const W = (x, y) => ({ x: a.x + x, y: a.y + y });
    const add = o => { M.objs.push(o); return o; };
    const zona = (x, y, w, h, grupo) => {
      const z = S.add.zone(a.x + x + w / 2, a.y + y + h / 2, w, h); S.physics.add.existing(z, true);
      (grupo || S.interiorObstacles).add(z); add(z); return z;
    };
    const ent = (k, prof) => {
      const e = E[k]; const sp = add(S.add.image(a.x + e.x, a.y + e.y, 'ckmz_' + k).setOrigin(0, 0).setDepth(a.y + (prof !== undefined ? prof : e.y + e.h)));
      M.ents[k] = sp; return sp;
    };
    const brillo = (k, alfa, prof) => { const b = A.brillo[k]; return add(S.add.image(a.x + b.x, a.y + b.y, 'ckmzb_' + k).setOrigin(0, 0).setDepth(prof).setAlpha(alfa).setBlendMode(Phaser.BlendModes.ADD)); };
    const latir = (o, a0, a1, ms) => S.tweens.add({ targets: o, alpha: { from: a0, to: a1 }, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // --- brillos que laten: grietas, círculo de la arena, el Sello, la lava
    latir(brillo('grietas', 0.25, a.y + 2), 0.12, 0.5, 2600);
    latir(brillo('circulo', 0.5, a.y + 3), 0.35, 0.95, 1700);
    latir(brillo('sello', 0.5, a.y + 120), 0.35, 1, 1300);
    const lv = brillo('lava', 0.12, a.y + 4); latir(lv, 0.05, 0.28, 1900);
    const lc = brillo('lava_claro', 0.2, a.y + 5); latir(lc, 0.1, 0.55, 1300);
    M.lavaBrillo = [lv, lc];

    // --- el portal de la llegada (anillos dorados que giran)
    const pg = add(S.add.graphics().setDepth(a.y + 640).setBlendMode(Phaser.BlendModes.ADD));
    M.portal = { g: pg, x: a.x + PORTAL.x, y: a.y + PORTAL.y };

    // --- PUZZLE 1: bloques, placas y rejas de los costados
    M.bloques = ['bloque_1', 'bloque_2'].map((k, i) => {
      const e = E[k], sp = ent(k), bl = { k, sp, x: e.x + e.w / 2, yb: e.y + e.h, x0: e.x + e.w / 2, yb0: e.y + e.h, ox: e.w / 2, oy: e.h, empuje: 0, fijo: null };
      bl.zona = zona(bl.x - HUELLA.w / 2, bl.yb - HUELLA.h, HUELLA.w, HUELLA.h);
      return bl;
    });
    ['o', 'e'].forEach(lado => {
      const pl = PLACAS[lado];
      if (F['p' + lado]) {                                          // ya resuelta: un bloque queda encima
        const bl = M.bloques.find(b => !b.fijo); if (bl) { bl.fijo = lado; moverBloque(S, bl, pl.x, pl.y + HUELLA.h / 2); }
        return;
      }
      const rr = REJAS[lado];
      const sp = add(S.add.image(a.x + rr[0] - 1, a.y + rr[1] - 10, 'ckmz_rejalado').setOrigin(0, 0).setDepth(a.y + rr[1] + rr[3]));
      M.col['reja_' + lado] = { z: zona(rr[0], rr[1], rr[2], rr[3]), sp };
    });

    // --- la reja de huesos (salón → baldosas)
    if (!F.reja) {
      const sp = ent('reja', 436);
      M.col.huesos = { z: zona(670, 396, 98, 34), sp };
    }

    // --- PUZZLE 2: la lava (choque propio: no frena flechas ni hechizos; también las piezas de los puzzles), los pilares y las piedras
    M.lava = S.physics.add.staticGroup();
    const g4 = new Set(), Q = 4;
    A.lava_choques.forEach(([x, y, w, h]) => { for (let yy = y; yy < y + h; yy += Q) for (let xx = x; xx < x + w; xx += Q) g4.add(xx + ',' + yy); });
    const enPilar = (x, y) => PILARES.some(p => x + Q > p[0] - 4 && x < p[0] + p[2] + 4 && y + Q > p[1] - 4 && y < p[1] + p[3] + 4);   // con margen: sin esquinas que traben
    const filas = {};
    g4.forEach(s => { const [x, y] = s.split(',').map(Number); if (!enPilar(x, y)) (filas[y] = filas[y] || []).push(x); });
    Object.keys(filas).forEach(y => {
      const xs = filas[y].sort((p, q) => p - q); let i = 0;
      while (i < xs.length) { let j = i; while (j + 1 < xs.length && xs[j + 1] === xs[j] + Q) j++; zona(xs[i], +y, xs[j] - xs[i] + Q, Q, M.lava); i = j + 1; }
    });
    zona(ESQUINA[0], ESQUINA[1], ESQUINA[2], ESQUINA[3], M.lava);
    M.colLava = [S.physics.add.collider(S.player, M.lava)];
    if (S.enemies) M.colLava.push(S.physics.add.collider(S.enemies, M.lava));
    M.pilares = PILARES.map((p, i) => {
      const firme = i === 0 || F.lava;
      const sp = add(S.add.image(a.x + p[0], a.y + p[1] - 8, 'ckmz_pilar').setOrigin(0, 0).setDepth(a.y + p[1] + 2));
      const pl = { i, p, sp, arriba: firme, firme, hasta: 0, tapa: firme ? null : zona(p[0] - 4, p[1] - 4, p[2] + 8, p[3] + 8, M.lava) };
      if (!firme) sp.setAlpha(0).setScale(1, 0.3).setY(a.y + p[1] + 14);
      return pl;
    });
    M.piedras = {};
    ['piedra_no', 'piedra_ne', 'piedra_so', 'piedra_se'].forEach(k => {
      const sp = ent(k), e = E[k], ru = A.runas[k];
      const rs = add(S.add.image(a.x + ru.x, a.y + ru.y, 'ckmzr_' + k).setOrigin(0, 0).setDepth(a.y + e.y + e.h + 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
      const prendida = (k === 'piedra_no' && F.no) || (k === 'piedra_so' && F.so) || ((k === 'piedra_ne' || k === 'piedra_se') && F.lava);
      if (prendida) { rs.setAlpha(0.85); latir(rs, 0.55, 0.95, 1500); }
      M.piedras[k] = { k, sp, rs, caja: [e.x - 4, e.y - 20, e.x + e.w + 4, e.y + e.h + 16], ult: 0 };   // generosa: se llega desde la losa
      zona(e.x + 6, e.y + e.h - 14, e.w - 12, 12, M.lava);
    });

    // --- PUZZLE 3: estatuas, coronas y la tabla
    if (!Array.isArray(F.coronas)) F.coronas = [0, 0, 0, 0];
    M.reyes = RONDA.map((k, i) => {
      const e = E[k], sp = ent(k);
      const cx = a.x + e.x + e.w / 2, cy = a.y + e.y + 8;
      const halo = add(S.add.image(cx, cy, 'ckmz_halo').setDepth(a.y + e.y + e.h + 1).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc860).setScale(0.55).setAlpha(0));
      const sombra = add(S.add.ellipse(cx, cy + 1, 22, 13, 0x000000, 0.55).setDepth(a.y + e.y + e.h + 0.5));
      zona(e.x + 6, e.y + e.h - 22, e.w - 12, 18, M.lava);
      return { k, i, sp, halo, sombra, caja: [e.x, e.y + 20, e.x + e.w, e.y + e.h], ult: 0 };
    });
    pintarCoronas(S);
    zona(200, 302, 100, 32);                                     // la tabla (la pieza del Taller no choca)
    // --- los obeliscos (con escudo hasta resolver su puzzle)
    M.obel = {};
    ['obelisco_1', 'obelisco_2'].forEach(k => {
      if (F[k]) return;
      const e = E[k], sp = ent(k), ru = A.runas[k];
      const rs = add(S.add.image(a.x + ru.x, a.y + ru.y, 'ckmzr_' + k).setOrigin(0, 0).setDepth(a.y + e.y + e.h + 0.5).setBlendMode(Phaser.BlendModes.ADD));
      latir(rs, 0.45, 1, 1100);
      const esc = add(S.add.image(a.x + e.x + e.w / 2, a.y + e.y + e.h * 0.55, 'ckmz_halo').setDepth(a.y + e.y + e.h + 0.6).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff3020).setScale(1.7, 2.9).setAlpha(0.4));
      latir(esc, 0.25, 0.55, 900);
      const o = { k, sp, rs, esc, escudo: k === 'obelisco_1' ? !F.coronasOk : true, vida: 6, quema: 0, caja: [e.x, e.y + 30, e.x + e.w, e.y + e.h], z: zona(e.x + 6, e.y + e.h - 18, e.w - 12, 16, M.lava) };
      if (!o.escudo) esc.setAlpha(0);
      M.obel[k] = o;
    });
    // --- PUZZLE 4: espejos, capullos, el rayo
    if (!Array.isArray(F.esp)) F.esp = ESP_INI.slice();
    if (!F.cap) F.cap = {};
    M.espejos = ESPEJOS.map((k, i) => {
      const e = E[k], sp = ent(k);
      const lin = add(S.add.graphics().setDepth(a.y + e.y + e.h + 0.4).setBlendMode(Phaser.BlendModes.ADD));
      zona(e.x + 10, e.y + e.h - 14, e.w - 20, 12, M.lava);
      const m = { k, i, sp, lin, cx: e.x + e.w / 2, cy: e.y + e.h * 0.42, e };
      pintarEspejo(S, m, F.esp[i]);
      return m;
    });
    M.capullos = {};
    CAPULLOS.forEach(k => {
      if (F.cap[k]) return;
      const e = E[k], sp = ent(k);
      M.capullos[k] = { k, sp, vida: 4, caja: [e.x, e.y, e.x + e.w, e.y + e.h], z: zona(e.x + 6, e.y + e.h - 16, e.w - 12, 14, M.lava), ult: 0 };
      S.tweens.add({ targets: sp, scaleY: 1.03, y: sp.y - 1, duration: R(900, 1300), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: R(0, 800) });
    });
    M.rayo = add(S.add.graphics().setDepth(a.y + 380).setBlendMode(Phaser.BlendModes.ADD));
    M.rayoPts = [];
    // --- la fragua: púas
    M.puas = [];
    PUAS.filas.forEach(fy => PUAS.cols.forEach((fx, c) => {
      const sp = add(S.add.image(a.x + fx, a.y + fy + 6, 'ckmz_puas').setOrigin(0.5, 1).setDepth(a.y + fy + 6).setScale(1, 0.05).setAlpha(0));
      M.puas.push({ sp, c, x: fx, y: fy });
    }));
    M.puasFase = -1; M.puasProx = S.time.now + 1200;
    // --- la jaula y Elia
    ent('jaula', 159);
    if (S.textures.exists('ckc_princesa') && !F.elia) {                     // Elia adentro: la jaula, ella y las barras encima
      add(S.add.image(a.x + 720, a.y + 132, 'ckmz_halo').setDepth(a.y + 159.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd6c8).setScale(0.6, 0.85).setAlpha(0.55));
      M.elia = add(S.add.image(a.x + 720, a.y + 150, 'ckc_princesa').setOrigin(0.5, 1).setScale(1.15).setDepth(a.y + 160));
      S.tweens.add({ targets: M.elia, y: M.elia.y - 1.5, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const jb = A.runas.jaula_barras;
      if (jb) add(S.add.image(a.x + jb.x, a.y + jb.y, 'ckmzr_jaula_barras').setOrigin(0, 0).setDepth(a.y + 161));
    }
    // --- PUZZLE 5: las baldosas
    M.bal = A.baldosas.map((b, i) => {
      const rs = add(S.add.image(a.x + b.x, a.y + b.y, 'ckmzt_' + i).setOrigin(0, 0).setDepth(a.y + 6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(F.bal && BAL.seguras.indexOf(i) >= 0 ? 0.5 : 0));
      return { i, b, rs, hueco: null, hasta: 0 };
    });
    // --- la lava que corre: vetas y burbujas
    M.lavaProx = 0;
    M.estado = '';
  };
  const moverBloque = (S, bl, x, yb) => {
    const M = S._mz, a = M.a; bl.x = x; bl.yb = yb;
    bl.sp.setPosition(a.x + x - bl.ox, a.y + yb - bl.oy).setDepth(a.y + yb);
    try { bl.zona.setPosition(a.x + x, a.y + yb - HUELLA.h / 2); bl.zona.body.updateFromGameObject(); } catch (e) {}
  };

  // ------------------------------------------------------------------ PUZZLE 1: empujar
  const libre = (S, bl, x, yb) => {
    const M = S._mz, a = M.a, x0 = a.x + x - HUELLA.w / 2 + 1, y0 = a.y + yb - HUELLA.h + 1;
    let hay = false;
    try {
      const bs = S.physics.overlapRect(x0, y0, HUELLA.w - 2, HUELLA.h - 2, false, true);
      hay = bs.some(b => b !== bl.zona.body);
    } catch (e) { hay = true; }
    if (hay) return false;
    const r = SALAS.salon; return x - HUELLA.w / 2 > r[0] + 6 && x + HUELLA.w / 2 < r[2] - 6 && yb - HUELLA.h > r[1] && yb < r[3];
  };
  const empujar = (S, dt) => {
    const M = S._mz, pb = S.player.body, F = fl(S);
    const vx = pb.velocity.x, vy = pb.velocity.y;
    if (Math.abs(vx) < 15 && Math.abs(vy) < 15) { M.bloques.forEach(b => (b.empuje = 0)); return; }
    const dx = Math.abs(vx) >= Math.abs(vy) ? Math.sign(vx) : 0, dy = dx ? 0 : Math.sign(vy);
    const a = M.a, pr = { x0: pb.x - a.x, x1: pb.right - a.x, y0: pb.y - a.y, y1: pb.bottom - a.y };
    M.bloques.forEach(bl => {
      if (bl.fijo || bl.anda) return;
      const f = { x0: bl.x - HUELLA.w / 2, x1: bl.x + HUELLA.w / 2, y0: bl.yb - HUELLA.h, y1: bl.yb };
      const ex = { x0: pr.x0 + Math.min(0, dx * 5), x1: pr.x1 + Math.max(0, dx * 5), y0: pr.y0 + Math.min(0, dy * 5), y1: pr.y1 + Math.max(0, dy * 5) };
      const alineado = dx ? (Math.min(pr.y1, f.y1) - Math.max(pr.y0, f.y0)) > (pr.y1 - pr.y0) * 0.5 : (Math.min(pr.x1, f.x1) - Math.max(pr.x0, f.x0)) > (pr.x1 - pr.x0) * 0.5;
      const lado = dx > 0 ? pr.x1 <= f.x0 + 6 : dx < 0 ? pr.x0 >= f.x1 - 6 : dy > 0 ? pr.y1 <= f.y0 + 6 : pr.y0 >= f.y1 - 6;
      if (!tocan(ex, f) || !alineado || !lado) { bl.empuje = Math.max(0, bl.empuje - dt * 2); return; }
      bl.empuje += dt;
      if (bl.empuje < 160) return;
      const paso = 78 * dt / 1000, nx = bl.x + dx * paso, ny = bl.yb + dy * paso;
      if (!libre(S, bl, nx, ny)) return;
      moverBloque(S, bl, nx, ny);
      if (!bl.ruido || S.time.now - bl.ruido > 380) { bl.ruido = S.time.now; son('ck_rocas_rodar', 0.25, { rate: 1.4 }) || son('footstep_stone', 0.5, { rate: 0.6 }); polvo(S, a.x + bl.x - dx * 24, a.y + bl.yb - 4, 2); }
      ['o', 'e'].forEach(lado2 => {
        const pl = PLACAS[lado2];
        if (F['p' + lado2] || M.bloques.some(b => b.fijo === lado2)) return;
        if (Math.abs(bl.x - pl.x) < 15 && Math.abs(bl.yb - HUELLA.h / 2 - pl.y) < 15) placa(S, bl, lado2);
      });
    });
  };
  const placa = (S, bl, lado) => {
    const M = S._mz, a = M.a, F = fl(S), pl = PLACAS[lado];
    bl.fijo = lado; bl.anda = true;
    S.tweens.add({ targets: bl.sp, x: a.x + pl.x - bl.ox, y: a.y + pl.y + HUELLA.h / 2 - bl.oy, duration: 220, ease: 'Quad.easeOut', onComplete: () => { bl.anda = false; moverBloque(S, bl, pl.x, pl.y + HUELLA.h / 2); } });
    son('ck_losa', 0.9) || son('ui_click', 0.8, { rate: 0.5 });
    S.cameras.main.shake(160, 0.004);
    F['p' + lado] = 1; guardar(S);
    S.time.delayedCall(450, () => abrirReja(S, lado));
  };
  const abrirReja = (S, lado) => {
    const M = S._mz; if (!M) return;
    const r = M.col['reja_' + lado]; if (!r) return;
    son('door_gate', 0.85, { rate: 0.8 }) || son('ck_cadenas', 0.8);
    try { r.z.destroy(); } catch (e) {}
    S.tweens.add({ targets: r.sp, scaleY: 0.05, y: r.sp.y + 100, alpha: 0.3, duration: 900, ease: 'Quad.easeIn', onComplete: () => { try { r.sp.destroy(); } catch (e) {} } });
    polvo(S, r.sp.x + 6, r.sp.y + 100, 8);
    texto(S, S.player.x, S.player.y - 50, lado === 'o' ? '¡Se abrió la reja del oeste!' : '¡Se abrió la reja del este!');
    delete M.col['reja_' + lado];
    const F = fl(S); if (F.po && F.pe) nota('Las dos rejas del salón están abiertas: al oeste, la lava; al este, la fragua');
  };
  const reiniciarBloques = S => {
    const M = S._mz, a = M.a;
    let algo = false;
    M.bloques.forEach(bl => {
      if (bl.fijo || (Math.abs(bl.x - bl.x0) < 2 && Math.abs(bl.yb - bl.yb0) < 2)) return;
      algo = true; polvo(S, a.x + bl.x, a.y + bl.yb - 10, 8); moverBloque(S, bl, bl.x0, bl.yb0); polvo(S, a.x + bl.x0, a.y + bl.yb0 - 10, 8);
    });
    if (algo) { son('magic_cast', 0.5, { rate: 0.6 }) || son('ui_click', 0.6); texto(S, a.x + 720, a.y + 450, 'Los bloques volvieron a su lugar', 0xe9d5ff); }
  };

  // ------------------------------------------------------------------ golpes (espada, estocadas, magia, giro y proyectiles)
  const golpe = (S, rect, proy) => {
    const M = S._mz; if (!M) return false;
    const a = M.a, F = fl(S), now = S.time.now;
    const pad = proy ? 12 : 0;                                   // la flecha se frena en el pie de la pieza: se la mira antes
    const rr = { x0: rect.x0 - a.x - pad, x1: rect.x1 - a.x + pad, y0: rect.y0 - a.y - pad, y1: rect.y1 - a.y + pad };
    const enCaja = c => tocan(rr, { x0: c[0], y0: c[1], x1: c[2], y1: c[3] });
    let pego = false;
    if (enCaja(PILA)) { reiniciarBloques(S); pego = !!proy; }
    Object.values(M.piedras).forEach(pd => { if (enCaja(pd.caja) && now - pd.ult > 500) { pd.ult = now; piedra(S, pd); pego = true; } });
    M.reyes.forEach(rey => { if (enCaja(rey.caja) && now - rey.ult > 450) { rey.ult = now; corona(S, rey); pego = true; } });
    Object.values(M.obel).forEach(o => { if (!o.roto && enCaja(o.caja)) { golpeObelisco(S, o); pego = true; } });
    Object.values(M.capullos).forEach(c => { if (!c.roto && enCaja(c.caja) && now - c.ult > 250) { c.ult = now; golpeCapullo(S, c); pego = true; } });
    return pego;
  };
  ['checkMeleeHits', 'checkThrustHits', 'checkWizardMagicHits'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () {
      const r = f0.apply(this, arguments);
      try {
        if (this._mz && aqui(this)) {
          const H = window.CK_HITBOXES, p = this.player, izq = this.facingDirection === 'left';
          const rect = H && H.rectoGolpe ? H.rectoGolpe(this, fn === 'checkThrustHits' ? 30 : 0) : (izq ? { x0: p.x - 46, x1: p.x + 6, y0: p.y - 22, y1: p.y + 20 } : { x0: p.x - 6, x1: p.x + 46, y0: p.y - 22, y1: p.y + 20 });
          golpe(this, rect);
        }
      } catch (e) {}
      return r;
    };
  });
  const sp0 = P.checkSpinHits;
  if (sp0) P.checkSpinHits = function () { const r = sp0.apply(this, arguments); try { if (this._mz && aqui(this)) { const p = this.player; golpe(this, { x0: p.x - 60, x1: p.x + 60, y0: p.y - 40, y1: p.y + 50 }); } } catch (e) {} return r; };

  // ------------------------------------------------------------------ PUZZLE 2: piedras y pilares
  const piedra = (S, pd) => {
    const F = fl(S), M = S._mz;
    son('magic_cast', 0.6, { rate: 0.8 }) || son('sword_hit', 0.6, { rate: 0.6 });
    S.tweens.killTweensOf(pd.rs); pd.rs.setAlpha(1);
    chispas(S, pd.sp.x + pd.sp.width / 2, pd.sp.y + pd.sp.height * 0.5, 10, 0xffc070, 30);
    if (pd.k === 'piedra_ne' || pd.k === 'piedra_se') {
      if (F.lava) { S.tweens.add({ targets: pd.rs, alpha: { from: 0.55, to: 0.95 }, duration: 1500, yoyo: true, repeat: -1 }); return; }
      const pl = M.pilares[pd.k === 'piedra_ne' ? 1 : 2];
      subirPilar(S, pl);
      S.tweens.add({ targets: pd.rs, alpha: 0.15, duration: DURA_PILAR, ease: 'Quad.easeIn' });
      return;
    }
    const k = pd.k === 'piedra_no' ? 'no' : 'so';
    if (!F[k]) {
      F[k] = 1; guardar(S);
      S.tweens.add({ targets: pd.rs, alpha: { from: 0.55, to: 0.95 }, duration: 1500, yoyo: true, repeat: -1 });
      if (F.no && F.so && !F.premio) {
        F.premio = 1; guardar(S);
        son('quest_done', 0.8) || son('book_clasp', 0.7);
        const s = S.story;
        if (s) { s.inv = s.inv || { potion: 0, elixir: 0 }; s.inv.elixir = (s.inv.elixir || 0) + 1; s.coins = (s.coins || 0) + 40; try { S.updateQuickBar && S.updateQuickBar(); S.updateHUD && S.updateHUD(); } catch (e) {} }
        texto(S, S.player.x, S.player.y - 56, 'Las piedras viejas responden: +1 ELIXIR · +40 monedas', 0xfde68a);
      } else texto(S, pd.sp.x + 20, pd.sp.y - 10, 'La piedra quedó encendida…', 0xfde68a);
    } else S.tweens.add({ targets: pd.rs, alpha: { from: 0.55, to: 0.95 }, duration: 1500, yoyo: true, repeat: -1 });
  };
  const subirPilar = (S, pl) => {
    const M = S._mz, a = M.a;
    pl.hasta = S.time.now + DURA_PILAR;
    if (pl.arriba) return;
    pl.arriba = true;
    son('ck_rocas_rodar', 0.6, { rate: 1.2 }) || son('door_gate', 0.5, { rate: 1.4 });
    S.tweens.killTweensOf(pl.sp);
    S.tweens.add({ targets: pl.sp, alpha: 1, scaleY: 1, y: a.y + pl.p[1] - 8, duration: 380, ease: 'Back.easeOut' });
    chispas(S, a.x + pl.p[0] + 23, a.y + pl.p[1] + 30, 12, 0xff8a30, 26);
    try { pl.tapa.body.enable = false; } catch (e) {}
  };
  const bajarPilar = (S, pl) => {
    const M = S._mz, a = M.a;
    if (!pl.arriba || pl.firme) return;
    pl.arriba = false;
    S.tweens.add({ targets: pl.sp, alpha: 0, scaleY: 0.3, y: a.y + pl.p[1] + 14, duration: 420, ease: 'Quad.easeIn' });
    chispas(S, a.x + pl.p[0] + 23, a.y + pl.p[1] + 26, 8, 0xff6a20, 20);
    son('ck_demonio_muere', 0.12, { rate: 1.6 }) || son('amb_fire', 0.3);
    try { pl.tapa.body.enable = true; } catch (e) {}
    const p = pies(S), q = { x: p.x - a.x, y: p.y - a.y };
    if (q.x > pl.p[0] - 4 && q.x < pl.p[0] + pl.p[2] + 4 && q.y > pl.p[1] - 2 && q.y < pl.p[1] + pl.p[3] + 4) {
      herir(S, 1, '¡La lava!');
      chispas(S, S.player.x, S.player.y, 14, 0xff7a20, 40);
      teleport(S, a, SEGURO_LAVA);
    }
  };
  const pilaresFirmes = S => {
    const M = S._mz, F = fl(S);
    F.lava = 1; guardar(S);
    M.pilares.forEach(pl => { pl.firme = true; pl.hasta = 0; if (!pl.arriba) subirPilar(S, pl); try { pl.tapa.body.enable = false; } catch (e) {} });
    ['piedra_ne', 'piedra_se'].forEach(k => { const pd = M.piedras[k]; S.tweens.killTweensOf(pd.rs); S.tweens.add({ targets: pd.rs, alpha: { from: 0.55, to: 0.95 }, duration: 1500, yoyo: true, repeat: -1 }); });
    son('quest_done', 0.6) || son('magic_cast', 0.6);
    texto(S, S.player.x, S.player.y - 52, 'Los pilares quedaron firmes', 0xfde68a);
  };

  // ------------------------------------------------------------------ PUZZLE 3: coronas
  const pintarCoronas = S => {
    const M = S._mz, F = fl(S);
    M.reyes.forEach((rey, i) => {
      const on = !!F.coronas[i];
      S.tweens.killTweensOf(rey.halo);
      rey.sombra.setAlpha(on ? 0 : 0.55);
      if (on) { rey.halo.setAlpha(0.9); S.tweens.add({ targets: rey.halo, alpha: { from: 0.65, to: 1 }, scale: { from: 0.5, to: 0.62 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      else rey.halo.setAlpha(0);
    });
  };
  const corona = (S, rey) => {
    const F = fl(S), M = S._mz;
    if (F.coronasOk) { texto(S, rey.sp.x + 25, rey.sp.y, 'El rey de piedra ya tiene su corona encendida', 0xfde68a); return; }
    [rey.i - 1 + 4, rey.i, rey.i + 1].forEach(j => { F.coronas[j % 4] = F.coronas[j % 4] ? 0 : 1; });
    son('magic_cast', 0.45, { rate: 1.3 }) || son('sword_hit', 0.6);
    pintarCoronas(S);
    [rey.i - 1 + 4, rey.i, rey.i + 1].forEach(j => { const r2 = M.reyes[j % 4]; chispas(S, r2.halo.x, r2.halo.y, 6, F.coronas[j % 4] ? 0xffd27a : 0x7a6a5a, 18); });
    if (F.coronas.every(v => v)) {
      F.coronasOk = 1; guardar(S);
      S.time.delayedCall(350, () => {
        son('quest_done', 0.8) || son('book_clasp', 0.7);
        S.cameras.main.flash(260, 255, 210, 120);
        const o = M.obel.obelisco_1;
        if (o) { o.escudo = false; S.tweens.killTweensOf(o.esc); S.tweens.add({ targets: o.esc, alpha: 0, scale: 3, duration: 700 }); }
        texto(S, S.player.x, S.player.y - 56, 'Los cuatro reyes coronados: ¡el obelisco quedó sin escudo!', 0xfde68a);
      });
    }
  };
  const verTabla = S => {
    const M = S._mz, a = M.a;
    if (M.tabla && M.tabla.active) return;
    son('book_open', 0.7) || son('ui_click', 0.6);
    const x = a.x + TABLA.x, y = a.y + 200;
    const c = add2(S, S.add.container(x, y).setDepth(27620));                  // por encima de la penumbra
    const g = S.add.graphics();
    g.fillStyle(0x16100e, 0.92).fillRoundedRect(-92, -70, 184, 128, 8).lineStyle(2, 0xb08a52, 1).strokeRoundedRect(-92, -70, 184, 128, 8);
    for (let f = 0; f < 2; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k, x0 = -62 + k * 31, y0 = -30 + f * 30, ok = BAL.seguras.indexOf(i) >= 0;
      g.fillStyle(ok ? 0xffc35a : 0x3b302c, 1).fillRect(x0, y0, 27, 26).lineStyle(1, 0x0b0807, 1).strokeRect(x0, y0, 27, 26);
    }
    g.lineStyle(2, 0xffc35a, 0.9).beginPath().moveTo(-62 + 2 * 31 + 13, 34).lineTo(-62 + 2 * 31 + 13, 16).lineTo(-62 + 31 + 13, -4).lineTo(-62 + 31 + 13, -38).strokePath();
    c.add(g);
    c.add(S.add.text(0, -62, 'LA TABLA DE LAS TRES PIEDRAS', { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e9cf9a' }).setOrigin(0.5, 0));
    c.add(S.add.text(0, 40, 'Sólo las runas marcadas aguantan', { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e9cf9a' }).setOrigin(0.5, 0));
    c.setAlpha(0); S.tweens.add({ targets: c, alpha: 1, duration: 250 });
    M.tabla = c;
    fl(S).tabla = 1; guardar(S);
  };
  const add2 = (S, o) => { const M = S._mz; if (M) M.objs.push(o); return o; };

  // ------------------------------------------------------------------ obeliscos
  const golpeObelisco = (S, o) => {
    if (o.escudo) {
      if (!o.aviso || S.time.now - o.aviso > 1800) {
        o.aviso = S.time.now;
        son('sword_hit', 0.6, { rate: 0.5 });
        texto(S, o.sp.x + o.sp.width / 2, o.sp.y + 20, o.k === 'obelisco_1' ? 'Un escudo rojo lo protege… los reyes de piedra lo sostienen' : 'Un escudo rojo lo protege: sólo la luz santa lo quema', 0xfca5a5);
      }
      return;
    }
    if (o.k === 'obelisco_2') return;
    o.vida--; son('sword_hit', 0.8, { rate: 0.7 });
    chispas(S, o.sp.x + o.sp.width / 2, o.sp.y + o.sp.height * 0.6, 8, 0xff5030, 30);
    S.tweens.add({ targets: o.sp, x: o.sp.x + 2, duration: 40, yoyo: true, repeat: 2 });
    if (o.vida <= 0) romperObelisco(S, o);
  };
  const romperObelisco = (S, o) => {
    const M = S._mz, F = fl(S); if (o.roto) return;
    o.roto = true; F[o.k] = 1; guardar(S);
    son('ck_demonio_rugido', 0.5, { rate: 0.7 }) || son('ck_derrumbe', 0.8);
    S.cameras.main.shake(500, 0.009); S.cameras.main.flash(220, 255, 60, 40);
    const cx = o.sp.x + o.sp.width / 2, by = o.sp.y + o.sp.height;
    for (let i = 0; i < 18; i++) {
      const c = S.add.rectangle(cx + R(-16, 16), by - R(10, 120), R(3, 7), R(3, 7), Math.random() < 0.3 ? 0xff4020 : 0x1a1214).setDepth(by + 2);
      S.tweens.add({ targets: c, x: c.x + R(-60, 60), y: by + R(-6, 10), angle: R(-360, 360), duration: R(500, 900), ease: 'Quad.easeIn', onComplete: () => S.tweens.add({ targets: c, alpha: 0, delay: 900, duration: 400, onComplete: () => c.destroy() }) });
    }
    S.tweens.add({ targets: [o.sp, o.rs], scaleY: 0.1, y: by - 6, alpha: 0, duration: 700, ease: 'Quad.easeIn' });
    S.tweens.add({ targets: o.esc, alpha: 0, duration: 300 });
    try { o.z.destroy(); } catch (e) {}
    polvo(S, cx, by - 6, 14, 0x3a2a28);
    const n = (F.obelisco_1 ? 1 : 0) + (F.obelisco_2 ? 1 : 0);
    S.time.delayedCall(700, () => texto(S, S.player.x, S.player.y - 56, `¡Un sello menos! (${n}/2)`, 0xfde68a));
    if (n >= 2) S.time.delayedCall(1600, () => abrirHuesos(S, true));
  };
  const abrirHuesos = (S, anim) => {
    const M = S._mz, F = fl(S); if (!M) return;
    F.reja = 1; guardar(S);
    const h = M.col.huesos; if (!h) return;
    try { h.z.destroy(); } catch (e) {}
    delete M.col.huesos;
    if (!anim) { try { h.sp.destroy(); } catch (e) {} return; }
    son('ck_cadenas', 0.9) || son('door_gate', 0.8);
    S.cameras.main.shake(800, 0.005);
    S.tweens.add({ targets: h.sp, y: h.sp.y - 40, alpha: 0, duration: 1400, ease: 'Quad.easeIn', onComplete: () => { try { h.sp.destroy(); } catch (e) {} } });
    nota('Se abrió la reja de huesos del salón: arriba esperan las baldosas de runas y la arena del Sello');
  };

  // ------------------------------------------------------------------ PUZZLE 4: espejos, capullos y el rayo
  const pintarEspejo = (S, m, o) => {
    const M = S._mz, a = M.a;
    m.sp.setFlipX(!!o);
    m.lin.clear().lineStyle(2, 0xffe6a0, 0.85);
    const cx = a.x + m.cx, cy = a.y + m.cy, d = 13;
    if (!o) m.lin.lineBetween(cx - d * 0.7, cy + d, cx + d * 0.7, cy - d); else m.lin.lineBetween(cx - d * 0.7, cy - d, cx + d * 0.7, cy + d);
  };
  const girarEspejo = (S, m) => {
    const F = fl(S);
    F.esp[m.i] = F.esp[m.i] ? 0 : 1; guardar(S);
    son('door_open', 0.5, { rate: 1.6 }) || son('ui_click', 0.7);
    S.tweens.add({ targets: m.sp, scaleX: 0.05, x: m.sp.x + m.sp.width / 2, duration: 110, yoyo: true, onYoyo: () => pintarEspejo(S, m, F.esp[m.i]), onComplete: () => { m.sp.x = S._mz.a.x + m.e.x; } });
  };
  const golpeCapullo = (S, c) => {
    c.vida--; son('ck_demonio_chillido', 0.25, { rate: 1.5 }) || son('sword_hit', 0.6);
    S.tweens.add({ targets: c.sp, angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => c.sp.setAngle(0) });
    chispas(S, c.sp.x + c.sp.width / 2, c.sp.y + c.sp.height / 2, 5, 0xff3020, 16);
    if (c.vida > 0) return;
    const M = S._mz, F = fl(S), a = M.a;
    c.roto = true; F.cap[c.k] = 1; guardar(S);
    try { c.z.destroy(); } catch (e) {}
    const cx = c.sp.x + c.sp.width / 2, cy = c.sp.y + c.sp.height;
    for (let i = 0; i < 10; i++) {
      const q = S.add.rectangle(cx + R(-10, 10), cy - R(10, 40), R(4, 8), R(3, 6), Math.random() < 0.4 ? 0x5a0c10 : 0x1b1416).setDepth(cy + 1);
      S.tweens.add({ targets: q, x: q.x + R(-40, 40), y: cy + R(-4, 8), angle: R(-200, 200), duration: R(400, 700), ease: 'Quad.easeOut', onComplete: () => S.tweens.add({ targets: q, alpha: 0, delay: 1200, duration: 400, onComplete: () => q.destroy() }) });
    }
    S.tweens.add({ targets: c.sp, alpha: 0, scaleY: 0.3, y: c.sp.y + c.sp.height * 0.6, duration: 260, onComplete: () => { try { c.sp.destroy(); } catch (e) {} } });
    son('ck_demonio_chillido', 0.45);
    S.time.delayedCall(300, () => demonio(S, cx - a.x, cy - a.y + 6, 'demonio_menor', true));
  };
  // el camino del rayo: del cristal al este; rebota en los espejos; lo cortan los capullos, el obelisco y las paredes
  const rayo = S => {
    const M = S._mz, F = fl(S), a = M.a, r = SALAS.criadero;
    const pts = [[CRISTAL.x, CRISTAL.y]];
    let x = CRISTAL.x + 8, y = CRISTAL.y, dx = 1, dy = 0, fin = null, quema = null;
    for (let n = 0; n < 900; n++) {
      x += dx * 2; y += dy * 2;
      if (x < r[0] || x > r[2] || y < r[1] || y > r[3]) { fin = 'pared'; break; }
      const m = M.espejos.find(e => Math.abs(x - e.cx) < (dx ? 3 : 24) && Math.abs(y - e.cy) < (dy ? 3 : 24) && !(pts.length && pts[pts.length - 1][2] === e.k));
      if (m) {
        x = dx ? m.cx : x; y = dy ? m.cy : y;
        pts.push([x, y, m.k]);
        const o = F.esp[m.i];                                    // "/": este→norte, norte→este, oeste→sur, sur→oeste
        const ndx = o ? dy : -dy, ndy = o ? dx : -dx;            // "\": este→sur, sur→este, oeste→norte, norte→oeste
        dx = ndx; dy = ndy; continue;
      }
      const cp = Object.values(M.capullos).find(c => !c.roto && x > c.caja[0] + 4 && x < c.caja[2] - 4 && y > c.caja[1] + 4 && y < c.caja[3] - 2);
      if (cp) { fin = 'capullo'; break; }
      const ob = M.obel.obelisco_2;
      if (ob && !ob.roto && x > ob.caja[0] + 8 && x < ob.caja[2] - 8 && y > E.obelisco_2.y && y < ob.caja[3]) { fin = 'obelisco'; quema = ob; break; }
    }
    pts.push([x, y]);
    M.rayoPts = pts; M.rayoFin = fin;
    return quema;
  };
  const pintarRayo = (S, t) => {
    const M = S._mz, a = M.a, g = M.rayo, pts = M.rayoPts;
    g.clear(); if (!pts.length) return;
    const fl_ = 0.85 + 0.15 * Math.sin(t / 60);
    [[12, 0.12], [6, 0.25], [2.5, 0.95 * fl_]].forEach(([w, al], i) => {
      g.lineStyle(w, i === 2 ? 0xfff2c0 : 0xffc860, al).beginPath().moveTo(a.x + pts[0][0], a.y + pts[0][1]);
      for (let k = 1; k < pts.length; k++) g.lineTo(a.x + pts[k][0], a.y + pts[k][1]);
      g.strokePath();
    });
    const e = pts[pts.length - 1];
    g.fillStyle(0xfff2c0, 0.8).fillCircle(a.x + e[0], a.y + e[1], 4 + 2 * Math.sin(t / 50));
  };

  // ------------------------------------------------------------------ demonios
  const demonio = (S, x, y, tipo, sinGrieta) => {
    const M = S._mz; if (!M || typeof ENEMY_TYPES === 'undefined' || !ENEMY_TYPES[tipo]) return null;
    const a = M.a, X = a.x + x, Y = a.y + y;
    if (!sinGrieta) {
      const g = S.add.ellipse(X, Y, 10, 4, 0xff3020, 0.9).setDepth(Y - 1).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: g, scaleX: 5, scaleY: 4, alpha: 0, duration: 650, onComplete: () => g.destroy() });
      chispas(S, X, Y, 10, 0xff4020, 34);
      son('ck_portal_abre', 0.25, { rate: 1.6 });
    }
    let e = null;
    S.time.delayedCall(sinGrieta ? 0 : 420, () => { if (!aqui(S) || S._mz !== M) return; try { e = S.spawnEnemy(X, Y, tipo); if (e) e._mz = true; } catch (er) {} });
    return e;
  };
  const demoniosEn = (S, sala) => {
    const M = S._mz, a = M.a, r = SALAS[sala];
    return S.enemies ? S.enemies.getChildren().filter(e => vivo(e) && e._mz && dentro({ x: e.x - a.x, y: e.y - a.y }, r)).length : 0;
  };
  const ENCUENTROS = {
    salon: (S, F) => (F.po && F.pe) ? [['demonio_menor', 600, 470]] : [['demonio_menor', 560, 470], ['demonio_menor', 880, 470], ['demonio_menor', 720, 600]],
    santuario: (S, F) => F.obelisco_1 ? [] : [['demonio_menor', 160, 230], ['demonio_menor', 330, 300], ['demonio_bruto', 250, 360]],
    fragua: (S, F) => F.obelisco_2 ? [['demonio_menor', 1200, 560]] : [['demonio_bruto', 1210, 640], ['demonio_menor', 1180, 520], ['demonio_menor', 1300, 650]],
    criadero: (S, F) => []
  };

  // ------------------------------------------------------------------ T: espejos y tabla
  const cerca = S => {
    const M = S._mz; if (!M || !S.player) return null;
    const a = M.a, p = pies(S), q = { x: p.x - a.x, y: p.y - a.y };
    const m = M.espejos.find(e => Math.hypot(q.x - e.cx, (q.y - (e.e.y + e.e.h)) * 1.3) < 50);
    if (m) return { tipo: 'espejo', m, txt: 'T · Girar el espejo' };
    if (Math.abs(q.x - TABLA.x) < 70 && q.y > TABLA.y - 20 && q.y < TABLA.y + 34) return { tipo: 'tabla', txt: 'T · Leer la tabla' };
    return null;
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (this._mz && aqui(this) && !this._overlay && !this.dialogOpen && !this.isDead && !this._doorTransition) {
        const c = cerca(this);
        if (c && c.tipo === 'espejo') { girarEspejo(this, c.m); return; }
        if (c && c.tipo === 'tabla') { verTabla(this); return; }
      }
    } catch (e) {}
    return i0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const M = this._mz;
      if (!M || !aqui(this) || !this.player || !this.player.body || !this.gameStarted) return r;
      const S = this, now = S.time.now, a = M.a, F = fl(S), dt = Math.min(delta || 16, 120);
      const p = pies(S), q = { x: p.x - a.x, y: p.y - a.y };
      // el cartel de T
      const pr = document.getElementById('ck-prompt');
      if (pr && !S.dialogOpen && !S._overlay) {
        const c = cerca(S);
        if (c && pr.textContent !== c.txt) { pr.textContent = c.txt; pr.classList.add('on'); M.cartel = c.txt; }
        else if (!c && M.cartel) { if (pr.textContent === M.cartel) pr.classList.remove('on'); M.cartel = null; }
      }
      if (M.tabla && M.tabla.active && (Math.abs(q.x - TABLA.x) > 110 || Math.abs(q.y - TABLA.y) > 90)) {
        const c = M.tabla; M.tabla = null; S.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => { try { c.destroy(); } catch (e) {} } });
      }
      // el portal
      const t = now / 1000, g = M.portal.g; g.clear();
      [[34, 0.55, 1], [26, 0.35, -1.4], [18, 0.25, 2]].forEach(([rr, al, v]) => {
        g.lineStyle(2, 0xffd27a, al + 0.15 * Math.sin(t * 2 + rr));
        g.strokeEllipse(M.portal.x, M.portal.y, rr * 2, rr * 1.1);
        for (let k = 0; k < 8; k++) { const an = t * v + k * Math.PI / 4; g.fillStyle(0xffe9b0, al).fillRect(M.portal.x + Math.cos(an) * rr - 1.5, M.portal.y + Math.sin(an) * rr * 0.55 - 1.5, 3, 3); }
      });
      // la lava que corre: vetas, burbujas y chispas
      if (now > M.lavaProx) {
        M.lavaProx = now + R(90, 180);
        const enRio = Math.random() < 0.85;
        let x, y;
        if (enRio) { do { x = R(80, 412); } while (x > 200 && x < 296); y = R(522, 614); } else { x = R(1292, 1360); y = R(552, 596); }
        const tipo = Math.random();
        if (tipo < 0.55) {
          const v = S.add.image(a.x + x, a.y + y, 'ckmz_veta').setDepth(a.y + 6).setBlendMode(Phaser.BlendModes.ADD).setTint(Math.random() < 0.5 ? 0xffd070 : 0xffa040).setAlpha(0).setScale(R(0.6, 1.4), R(0.6, 1));
          S.tweens.add({ targets: v, x: v.x + (enRio ? R(22, 46) : R(-10, 10)), alpha: { from: 0, to: R(0.35, 0.7) }, duration: R(900, 1500), yoyo: true, hold: 200, ease: 'Sine.easeInOut', onComplete: () => v.destroy() });
        } else if (tipo < 0.88) {
          const b = S.add.circle(a.x + x, a.y + y, 1.5, 0xffe08a, 0.9).setDepth(a.y + 7).setBlendMode(Phaser.BlendModes.ADD);
          S.tweens.add({ targets: b, radius: R(3, 6), duration: R(500, 900), ease: 'Sine.easeOut', onComplete: () => { chispas(S, b.x, b.y, 3, 0xffa040, 12); b.destroy(); } });
        } else chispas(S, a.x + x, a.y + y, 2, 0xffb050, 34);
      }
      // PUZZLE 1
      if (dentro(q, SALAS.salon) || (q.y > 420 && q.y < 640 && q.x > 440 && q.x < 1000)) empujar(S, dt);
      // PUZZLE 2: los pilares bajan; cruzar los deja firmes
      M.pilares.forEach(pl => { if (pl.arriba && !pl.firme && pl.hasta && now > pl.hasta) bajarPilar(S, pl); });
      if (!F.lava && q.x < 290 && q.x > 200 && q.y < 600 && q.y > 470 && M.pilares[2].arriba) pilaresFirmes(S);
      // PUZZLE 4: el rayo
      if (!M.rayoProx || now > M.rayoProx) { M.rayoProx = now + 120; M.quema = rayo(S); }
      pintarRayo(S, now);
      const ob = M.obel.obelisco_2;
      if (ob && !ob.roto) {
        if (M.quema === ob) {
          ob.quema += dt;
          if (Math.random() < 0.3) chispas(S, a.x + M.rayoPts[M.rayoPts.length - 1][0], a.y + M.rayoPts[M.rayoPts.length - 1][1], 2, 0xfff0b0, 20);
          ob.sp.setTint(Phaser.Display.Color.GetColor(255, 255 - Math.min(120, ob.quema / 20), 255 - Math.min(160, ob.quema / 15)));
          if (!ob.avisoQ) { ob.avisoQ = 1; texto(S, ob.sp.x + 30, ob.sp.y + 10, '¡La luz santa quema el obelisco!', 0xfde68a); son('magic_cast', 0.7, { rate: 0.7 }); }
          if (ob.quema > QUEMA) { ob.escudo = false; romperObelisco(S, ob); }
        } else if (ob.quema > 0) { ob.quema = Math.max(0, ob.quema - dt * 0.5); if (!ob.quema) ob.sp.clearTint(); }
      }
      // los diablillos de las grietas del criadero
      if (!F.obelisco_2 && dentro(q, SALAS.criadero) && now > (M.grietaProx || 0)) {
        M.grietaProx = now + R(7000, 10000);
        if (demoniosEn(S, 'criadero') < 3) demonio(S, R(1100, 1340), R(250, 350), 'demonio_menor');
      }
      // encuentros: una vez por visita al entrar a la sala
      Object.keys(ENCUENTROS).forEach(sala => {
        if (M.enc[sala] || !dentro(q, SALAS[sala])) return;
        M.enc[sala] = 1;
        ENCUENTROS[sala](S, F).forEach(([tp, x, y], i) => S.time.delayedCall(300 + i * 350, () => demonio(S, x, y, tp)));
      });
      // la fragua: las púas suben por columnas
      if (now > M.puasProx) {
        M.puasFase = (M.puasFase + 1) % 4;
        M.puasProx = now + (M.puasFase < 3 ? 900 : 700);
        M.puas.forEach(pu => {
          const arriba = pu.c === M.puasFase;
          if (arriba === !!pu.arriba) return;
          pu.arriba = arriba;
          S.tweens.add({ targets: pu.sp, scaleY: arriba ? 1 : 0.05, alpha: arriba ? 1 : 0, duration: arriba ? 90 : 200, ease: arriba ? 'Back.easeOut' : 'Quad.easeIn' });
        });
        if (M.puasFase < 3 && dentro(q, SALAS.fragua)) son('ck_puas', 0.35) || son('sword_hit', 0.3, { rate: 1.6 });
      }
      M.puas.forEach(pu => {
        if (!pu.arriba || pu.sp.scaleY < 0.6) return;
        if (Math.abs(q.x - pu.x) < PUAS.w / 2 && Math.abs(q.y - pu.y) < PUAS.h / 2) herir(S, 1, '¡PINCHOS!');
        if (S.enemies && (!pu.ult || now - pu.ult > 700)) S.enemies.getChildren().forEach(e => { if (!vivo(e)) return; if (Math.abs(e.x - a.x - pu.x) < PUAS.w / 2 && Math.abs((e.body ? e.body.bottom : e.y) - a.y - pu.y) < PUAS.h / 2) { pu.ult = now; try { S.damageEnemy(e, 1, a.x + pu.x, a.y + pu.y); } catch (er) {} } });
      });
      // PUZZLE 5: las baldosas
      if (!F.bal && q.x > BAL.x0 && q.x < BAL.x1 && q.y > BAL.y0 && q.y < BAL.y1) {
        const col = Math.min(3, Math.floor((q.x - BAL.x0) / ((BAL.x1 - BAL.x0) / 4))), fil = Math.min(1, Math.floor((q.y - BAL.y0) / ((BAL.y1 - BAL.y0) / 2)));
        const i = fil * 4 + col, b = M.bal[i];
        if (BAL.seguras.indexOf(i) >= 0) { if (b.rs.alpha < 0.5) { b.rs.setAlpha(0.9); son('magic_cast', 0.3, { rate: 1.5 }); } }
        else if (!b.hueco) caer(S, b);
      }
      if (!F.bal && q.y < BAL.y0 - 4 && q.x > BAL.x0 - 30 && q.x < BAL.x1 + 30 && q.y > 250) {
        F.bal = 1; guardar(S);
        son('quest_done', 0.7) || son('magic_cast', 0.6);
        M.bal.forEach(b => S.tweens.add({ targets: b.rs, alpha: BAL.seguras.indexOf(b.i) >= 0 ? 0.5 : 0, duration: 400 }));
        texto(S, S.player.x, S.player.y - 56, 'Pasaste las baldosas: el camino queda firme', 0xfde68a);
        S.time.delayedCall(1500, () => { if (aqui(S) && M.elia) nota('Elia está viva, encerrada en la jaula del altar, delante del Sello'); });
      }
      M.bal.forEach(b => { if (b.hueco && now > b.hasta) { const h = b.hueco; b.hueco = null; S.tweens.add({ targets: h, alpha: 0, duration: 300, onComplete: () => h.destroy() }); } });
      // la reja de huesos: si se cargó la partida con los dos rotos
      if (F.obelisco_1 && F.obelisco_2 && M.col.huesos && !M.abriendo) { M.abriendo = 1; abrirHuesos(S, false); }
      // flechas y hechizos que pegan en las piezas
      if (S.projectiles) S.projectiles.getChildren().forEach(pr2 => {
        if (!pr2.active || !pr2.body) return;
        const b = pr2.body, rc = { x0: b.x, x1: b.right, y0: b.y - 6, y1: b.bottom + 6 };
        if (golpe(S, rc, true) && (!pr2._ck || !pr2._ck.atraviesa)) { chispas(S, b.center.x, b.center.y, 4, 0xffd080, 12); pr2.destroy(); }
      });
    } catch (e) { if (!P._mzErr) { P._mzErr = 1; console.warn('[mazmorra]', e); } }
    return r;
  };
  const caer = (S, b) => {
    const M = S._mz, a = M.a, x0 = a.x + b.b.x0, y0 = a.y + b.b.y0;
    son('ck_derrumbe', 0.6) || son('ck_losa', 0.8);
    const h = S.add.rectangle(x0 + 1, y0 + 1, b.b.w0 - 2, b.b.h0 - 2, 0x050304, 1).setOrigin(0, 0).setDepth(a.y + 8);
    M.objs.push(h); b.hueco = h; b.hasta = S.time.now + 1800;
    polvo(S, x0 + b.b.w0 / 2, y0 + b.b.h0 / 2, 10, 0x6a5a52);
    S.tweens.add({ targets: S.player, scale: S.player.scale * 0.6, alpha: 0.3, duration: 260, yoyo: true });
    herir(S, 1, '¡La baldosa se hundió!');
    S.time.delayedCall(280, () => teleport(S, a, VUELTA_BAL));
  };

  // ------------------------------------------------------------------ al entrar y salir
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { if (aqui(this)) { const S = this; S.time.delayedCall(60, () => { try { poner(S); } catch (e) { console.warn('[mazmorra]', e); } }); } else quitar(this); } catch (e) { console.warn('[mazmorra]', e); }
    return r;
  };

  // ------------------------------------------------------------------ penumbra, luces, fuegos, música, minimapa
  const LUCES = [];
  [[110, 568], [170, 560], [300, 570], [360, 566], [410, 560], [140, 600], [330, 600]].forEach(([x, y]) => LUCES.push({ x, y, c: LAVA, r: 120, f: 0.75, fuego: 1 }));
  LUCES.push({ x: 1325, y: 575, c: LAVA, r: 110, f: 0.8, fuego: 1 });                              // la fragua
  [[645, 435], [791, 435], [512, 588], [926, 588]].forEach(([x, y]) => LUCES.push({ x, y, c: FUEGO, r: 125, f: 0.9, fuego: 1 }));   // braseros del salón
  [[512, 64], [924, 66], [512, 212], [924, 212]].forEach(([x, y]) => LUCES.push({ x, y, c: FUEGO, r: 120, f: 0.85, fuego: 1 }));    // pilares de la arena
  LUCES.push({ x: 719, y: 220, c: ROJO, r: 150, f: 0.6, latido: 1 }, { x: 719, y: 60, c: ROJO, r: 110, f: 0.7, latido: 1 });       // el círculo y el Sello
  LUCES.push({ x: 1054, y: 290, c: ORO, r: 90, f: 0.8 }, { x: 721, y: 728, c: ORO, r: 95, f: 0.85 });                               // el cristal y el portal
  LUCES.push({ x: 250, y: 300, c: [200, 120, 90], r: 130, f: 0.35 }, { x: 1190, y: 600, c: [220, 110, 70], r: 150, f: 0.35 });    // un poco en el santuario y la fragua
  const instalar = () => {
    if (instalar.ok) return;
    if (window.CK_OSCURIDAD && !CK_OSCURIDAD.ZONAS[Z]) CK_OSCURIDAD.zona(Z, { braseros: [], tinte: true, sala: [46, 18, 20] });
    if (window.CK_LUZ && CK_LUZ.fuente) {
      CK_LUZ.fuente((S, out) => {
        if (!aqui(S)) return;
        const a = S.currentInterior.area, t = (S.time && S.time.now) || 0, M = S._mz, F = fl(S);
        LUCES.forEach((l, i) => {
          const f = l.fuego ? l.f * (0.86 + 0.08 * Math.sin(t / 97 + i * 2.1) + 0.06 * Math.sin(t / 41 + i)) : l.latido ? l.f * (0.75 + 0.25 * Math.sin(t / 420 + i)) : l.f;
          out.push({ x: a.x + l.x, y: a.y + l.y, c: l.c, r: l.r, f });
        });
        if (!M) return;
        if (M.elia && M.elia.active) out.push({ x: a.x + 720, y: a.y + 136, c: [255, 228, 215], r: 58, f: 1 });
        M.reyes.forEach((rey, i) => { if (F.coronas && F.coronas[i]) out.push({ x: rey.halo.x, y: rey.halo.y + 20, c: ORO, r: 60, f: 0.55 }); });
        Object.values(M.obel).forEach(o => { if (!o.roto) out.push({ x: o.sp.x + o.sp.width / 2, y: o.sp.y + o.sp.height * 0.7, c: ROJO, r: 80, f: 0.5 + 0.2 * Math.sin(t / 300) }); });
        const pts = M.rayoPts || [];
        for (let k = 1; k < pts.length; k++) {
          const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 70));
          for (let j = 0; j <= n; j++) out.push({ x: a.x + x0 + (x1 - x0) * j / n, y: a.y + y0 + (y1 - y0) * j / n, c: ORO, r: 46, f: 0.45 });
        }
        Object.values(M.piedras || {}).forEach(pd => { if (pd.rs.alpha > 0.3) out.push({ x: pd.sp.x + pd.sp.width / 2, y: pd.sp.y + pd.sp.height * 0.6, c: [255, 180, 90], r: 50, f: 0.45 * pd.rs.alpha }); });
      });
    }
    window.CK_FUEGOS_SALAS = window.CK_FUEGOS_SALAS || {};
    if (!window.CK_FUEGOS_SALAS[ID]) window.CK_FUEGOS_SALAS[ID] = { cajas: BRASEROS };
    try { if (window.CK_PROF_ENTEROS && !CK_PROF_ENTEROS.test('ed_mz_x')) window.CK_PROF_ENTEROS = new RegExp(CK_PROF_ENTEROS.source.replace(')_', '|mz)_')); } catch (e) {}
    try { if (window.CK_MUSICA_MOMENTOS && CK_MUSICA_MOMENTOS.MAPA) CK_MUSICA_MOMENTOS.MAPA[ID] = 'cueva'; window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + ID]: 'cueva' }); } catch (e) {}
    try {
      const MM = window.CK_MINIMAPA;
      if (MM && MM.Z) {
        MM.Z[Z] = { img: ID, esc: 4, w: 1436, h: 802, ext: 0, n: 'La Mazmorra del Sello', g: 'El Reino del Sello' };
        if (MM.L) MM.L[Z] = [{ n: 'El portal de Oswin', x: PORTAL.x, y: PORTAL.y, ic: 'estrella' }, { n: 'El Sello', x: 719, y: 60, ic: 'estrella' }];
        if (MM.dibujo && window.CK_MAZMORRA_MINI) MM.dibujo(ID, window.CK_MAZMORRA_MINI);
      }
    } catch (e) {}
    instalar.ok = true;
  };
  document.addEventListener('DOMContentLoaded', instalar);
  if (document.readyState !== 'loading') instalar();
  window.CK_MAZMORRA = { ID, Z, SALAS, PLACAS, PILARES, RONDA, ESPEJOS, CAPULLOS, BAL, LLEGADA, PORTAL, fl, rayo: S => { rayo(S); return S._mz && { pts: S._mz.rayoPts, fin: S._mz.rayoFin }; }, estado: S => S._mz,
    _t: { golpe, girar: (S, i) => girarEspejo(S, S._mz.espejos[i]), mover: (S, i, x, yb) => moverBloque(S, S._mz.bloques[i], x, yb), tabla: verTabla } };
})();
