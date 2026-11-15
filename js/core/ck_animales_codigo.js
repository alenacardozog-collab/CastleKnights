'use strict';
/* Animales de granja dibujados por código (15/11, pedido del dueño: "los animales del juego como los que ya están, cerdos y
   cosas domésticas hacelas con código como están hechos la mayoría, así quedan uniformes").
   Las gallinas, el gato, los pájaros y los perros ya estaban dibujados por código (colores planos, sin contorno, píxel
   grande). Los chanchos (dibujo de PixelLab) y las vacas (las del paquete del granero) tenían contorno y sombreado y se
   veían de otro juego. Acá se dibujan en el mismo estilo y reemplazan a los de antes con el mismo nombre, así todo lo que
   ya los usaba (San Roque, el Pueblo Orco, la Frontera, el granero) sigue andando igual:
   - chancho: rosado, mira a la derecha. Quieto: respira, mueve la oreja, hoza el piso. Camina: 9 cuadros.
   - vaca: blanca con manchas negras, mira a la izquierda (como la de antes). Quieta: rumia, baja a pastar, mueve la cola.
   (15/11, nota 30) Los animales no hablan: sólo dicen lo suyo (oinc, muuu, guau, coc…), nada de frases.
   (15/11, nota 21) Las vacas de San Roque caminaban para atrás: la hoja de la vaca mira a la izquierda y el que las hace
   caminar da vuelta el dibujo como si mirara a la derecha; acá se corrige.
   Borrar la línea de index.html vuelve a los de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  // ------------------------------------------------------------------ dibujos
  // px(f, color, [[x, y, w, h]…]) pinta en el cuadro f
  const hoja = (fw, fh, n, dibujar) => {
    const cv = document.createElement('canvas'); cv.width = fw * n; cv.height = fh;
    const g = cv.getContext('2d');
    const px = (f, col, pts) => { g.fillStyle = col; pts.forEach(([x, y, a, b]) => g.fillRect(f * fw + x, y, a || 1, b || 1)); };
    for (let f = 0; f < n; f++) dibujar(px, f);
    return cv;
  };
  // chancho (mira a la derecha), cuadro 20×13, pies en la fila 12
  const CH = { c: '#eca3ab', s: '#cf7f88', o: '#d98d96', h: '#f6c3c8', n: '#8a4650', e: '#2a1618' };
  const chancho = (px, f, o) => {
    // o: { dy (cuerpo), cab (cabeza abajo: hoza), oreja, patas: [[x, alto]…], cola }
    const dy = o.dy || 0, cb = o.cab || 0;
    px(f, CH.c, [[4, 4 + dy, 11, 6], [3, 5 + dy, 1, 4], [15, 5 + dy, 1, 4]]);                 // el cuerpo
    px(f, CH.s, [[4, 9 + dy, 11, 1], [5, 4 + dy, 6, 1]]);                                       // la panza y el lomo en sombra
    px(f, CH.c, [[15, 3 + dy + cb, 4, 5]]);                                                     // la cabeza
    px(f, CH.h, [[18, 5 + dy + cb, 2, 3]]);                                                     // el hocico
    px(f, CH.n, [[19, 6 + dy + cb], [19, 7 + dy + cb]]);
    px(f, CH.e, [[17, 4 + dy + cb]]);                                                            // el ojo
    px(f, CH.o, o.oreja ? [[15, 2 + dy + cb, 2, 1], [14, 1 + dy + cb]] : [[15, 2 + dy + cb, 2, 2]]);   // la oreja
    px(f, CH.s, o.cola ? [[2, 4 + dy], [1, 3 + dy], [2, 2 + dy]] : [[2, 5 + dy], [1, 4 + dy], [2, 3 + dy]]);   // la colita enrulada
    (o.patas || [[5, 2], [7, 2], [12, 2], [14, 2]]).forEach(([x, h]) => px(f, CH.s, [[x, 10 + dy, 1, h]]));
  };
  const hojaChanchoQuieto = () => hoja(20, 13, 5, (px, f) => chancho(px, f, [{}, { oreja: 1 }, { cab: 1 }, { cab: 2, cola: 1 }, { cab: 1, oreja: 1 }][f]));
  const hojaChanchoCamina = () => hoja(20, 13, 9, (px, f) => {
    const t = f / 9 * Math.PI * 2, a = Math.round(Math.sin(t) * 1), dy = (f % 4 === 1 || f % 4 === 3) ? -1 : 0;
    chancho(px, f, { dy, patas: [[5 + a, 2 - dy], [7 - a, 2 - dy], [12 + a, 2 - dy], [14 - a, 2 - dy]], cola: f % 3 === 0, oreja: f % 4 === 2 });
  });
  // vaca (mira a la izquierda), cuadro 24×17, pies en la fila 16
  const VA = { c: '#f2efe6', s: '#cfc9bb', m: '#2a2622', h: '#e9a9ab', n: '#7a4a4a', e: '#151210', cu: '#e3d6b2', pe: '#2a2622' };
  const vaca = (px, f, o) => {
    const dy = o.dy || 0, cb = o.cab || 0, rumia = o.rumia || 0;
    px(f, VA.c, [[6, 5 + dy, 14, 7], [5, 6 + dy, 1, 5], [20, 6 + dy, 1, 5]]);                 // el cuerpo
    px(f, VA.m, [[9, 5 + dy, 3, 3], [15, 7 + dy, 3, 2], [12, 9 + dy, 2, 2], [18, 5 + dy, 2, 2]]);   // las manchas
    px(f, VA.s, [[6, 11 + dy, 14, 1]]);
    px(f, VA.h, [[15, 12 + dy, 2, 1]]);                                                          // la ubre
    px(f, VA.c, [[1, 3 + dy + cb, 5, 5]]);                                                      // la cabeza
    px(f, VA.m, [[3, 3 + dy + cb, 2, 2]]);
    px(f, VA.h, [[0, 6 + dy + cb + rumia, 3, 3 - rumia]]);                                       // el hocico
    px(f, VA.n, [[0, 7 + dy + cb + rumia]]);
    px(f, VA.e, [[2, 5 + dy + cb]]);
    px(f, VA.cu, [[1, 2 + dy + cb], [5, 2 + dy + cb]]);                                         // los cuernitos
    px(f, VA.c, [[6, 4 + dy + cb]]);                                                             // la oreja
    px(f, VA.s, o.cola ? [[21, 5 + dy, 1, 4], [22, 9 + dy]] : [[21, 6 + dy, 1, 4], [21, 10 + dy]]);   // la cola
    px(f, VA.m, o.cola ? [[22, 9 + dy, 1, 2]] : [[21, 10 + dy, 1, 2]]);
    (o.patas || [[7, 4], [9, 4], [16, 4], [18, 4]]).forEach(([x, h]) => { px(f, VA.c, [[x, 12 + dy, 1, h - 1]]); px(f, VA.pe, [[x, 11 + dy + h]]); });
  };
  const hojaVacaQuieta = () => hoja(24, 17, 6, (px, f) => vaca(px, f, [{}, { rumia: 1 }, { cola: 1 }, { cab: 2 }, { cab: 3, rumia: 1 }, { cab: 2, cola: 1 }][f]));
  const hojaVacaCamina = () => hoja(24, 17, 9, (px, f) => {
    const t = f / 9 * Math.PI * 2, a = Math.round(Math.sin(t)), dy = (f % 4 === 1 || f % 4 === 3) ? -1 : 0;
    vaca(px, f, { dy, cola: f % 4 < 2, patas: [[7 - a, 4 - dy], [9 + a, 4 - dy], [16 - a, 4 - dy], [18 + a, 4 - dy]] });
  });

  // qué se reemplaza: textura → hoja nueva, sus animaciones, la escala de los que andan sueltos (null: la que traen)
  const NUEVOS = {
    ck_cerdo_idle: { fw: 20, fh: 13, hoja: hojaChanchoQuieto, anims: [['ck_cerdo_idle', 5]], escala: 1.3, oy: 12 / 13 },
    ck_cerdo_walk: { fw: 20, fh: 13, hoja: hojaChanchoCamina, anims: [['ck_cerdo_walk', 9]], escala: 1.3, oy: 12 / 13 },
    int_cow_idle: { fw: 24, fh: 17, hoja: hojaVacaQuieta, anims: [['cow_idle', 4]], escala: null, oy: 16 / 17 },
    int_cow_walk: { fw: 24, fh: 17, hoja: hojaVacaCamina, anims: [['cow_walk', 8]], escala: null, oy: 16 / 17 }
  };
  const IZQUIERDA = /^int_cow_/;                       // hojas que miran a la izquierda

  const reemplazar = (S, key) => {
    const D = NUEVOS[key], t0 = S.textures.exists(key) && S.textures.get(key);
    if (!D || !t0 || t0._ckAC) return false;
    const cv = D.hoja(), n = Math.round(cv.width / D.fw);
    const usan = S.children.list.filter(o => o.texture && o.texture.key === key);
    const playing = usan.map(o => o.anims && o.anims.isPlaying && o.anims.currentAnim ? o.anims.currentAnim.key : null);
    // las animaciones que usan esta hoja se rehacen con los cuadros nuevos (mismo nombre)
    const anims = D.anims.map(([k, rate]) => { const A = S.anims.get(k); return [k, A ? A.frameRate : rate, A ? A.repeat : -1]; });
    anims.forEach(([k]) => { if (S.anims.exists(k)) S.anims.remove(k); });
    S.textures.remove(key);
    const t = S.textures.addCanvas(key, cv);
    for (let i = 0; i < n; i++) t.add(i, 0, i * D.fw, 0, D.fw, D.fh);
    t._ckAC = true;
    anims.forEach(([k, rate, rep]) => S.anims.create({ key: k, frames: S.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat: rep }));
    usan.forEach((o, i) => { try { o.setTexture(key, 0); o._ckAC = 0; if (playing[i] && S.anims.exists(playing[i])) o.play(playing[i], true); } catch (e) {} });
    return true;
  };
  // los que ya andan sueltos: escala y pies a la medida del dibujo nuevo
  const ajustar = S => {
    S.children.list.forEach(o => {
      if (o.type !== 'Sprite' || !o.texture) return;
      const D = NUEVOS[o.texture.key]; if (!D || !S.textures.get(o.texture.key)._ckAC) return;
      if (o._ckAC === o.texture.key) return;
      o._ckAC = o.texture.key;
      if (D.escala) o.setScale(D.escala);
      o.setOrigin(0.5, D.oy);
    });
  };

  // ------------------------------------------------------------------ los animales no hablan (30)
  const VOCES = [
    [/cerdo|chancho|boar/, ['Oinc 🐷', '¡Oinc, oinc!', 'Oiiinc…']],
    [/cow|vaca/, ['Muuu 🐄', '¡Muuuu!', 'Mu…']],
    [/perro/, ['¡Guau! 🐶', '¡Guau, guau!', 'Grrr… ¡guau!']],
    [/gallin|pollo/, ['Coc, coc 🐔', '¡Cocorocó!', 'Coc…']],
    [/oveja/, ['Beee 🐑', '¡Beeee!']], [/cabra/, ['Meee 🐐']], [/gato/, ['Miau 🐱', 'Mrrr…']], [/caballo/, ['¡Hiiii! 🐴', 'Prrr…']], [/pato/, ['Cuac 🦆']]
  ];
  const sonido = key => { const v = VOCES.find(q => q[0].test(key || '')); return v ? v[1] : null; };
  const callarAnimales = a => {
    (a.actors || []).forEach(t => {
      if (t._ckACv || !t.lines) return;
      const k = t.key || (t.sprite && t.sprite.texture && t.sprite.texture.key) || '';
      if (!/cerdo|cow|vaca|perro|gallin|oveja|cabra|gato|caballo|pato|boar/.test(k)) return;
      const v = sonido(k); if (v) t.lines = v.slice();
      t._ckACv = true;
    });
  };

  // ------------------------------------------------------------------ (21) las vacas que caminan sueltas miran para donde van
  const uc0 = P.updateCastleActor;
  if (uc0) P.updateCastleActor = function (a, dt, fx, fy) {
    const r = uc0.apply(this, arguments);
    try {
      const sp = a && a.sprite;
      if (sp && sp.active && sp.texture && IZQUIERDA.test(sp.texture.key)) {
        const dx = a._ckACx === undefined ? 0 : sp.x - a._ckACx;
        a._ckACx = sp.x;
        if (Math.abs(dx) > 0.02) a._ckACfl = dx > 0;                        // la hoja mira a la izquierda: hacia la derecha, se da vuelta
        else if (Phaser.Math.Distance.Between(fx, fy, sp.x, sp.y) < 30) a._ckACfl = fx > sp.x;
        if (a._ckACfl !== undefined) sp.setFlipX(a._ckACfl);
      }
    } catch (e) {}
    return r;
  };

  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if ((this._ckACn = (this._ckACn || 0) + 1) % 20 === 0) {
        Object.keys(NUEVOS).forEach(k => reemplazar(this, k));
        ajustar(this);
        const a = this.currentInterior && this.currentInterior.area;
        if (a) callarAnimales(a);
      }
    } catch (e) { if (!P._ckACav) { P._ckACav = 1; console.warn('[animales]', e); } }
    return r;
  };
  window.CK_ANIMALES_CODIGO = { NUEVOS, reemplazar, VOCES, hojaChanchoQuieto, hojaChanchoCamina, hojaVacaQuieta, hojaVacaCamina };
})();
