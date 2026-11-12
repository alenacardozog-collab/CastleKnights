'use strict';
/* Globos de diálogo nuevos (10/11, pedido del dueño: "las burbujas de diálogo de los NPC mientras hablan entre ellos están
   raras; colocalas con una animación de burbuja bien ajustada al personaje, donde se vea bien quién habla").
   Reemplaza CK_ESCENA.globo (ck_escenas.js), que usan las charlas de los vecinos, la intro, la lluvia, el monolito y
   los Campos. El globo ahora:
   - es una burbuja de pergamino con borde oscuro y una colita que apunta a la cabeza del que habla (y lo sigue si camina);
   - aparece con un "pop" (crece desde la colita), primero tres puntitos y después el texto letra por letra;
   - si dos globos se pisan, el más nuevo se acomoda arriba; si el mismo personaje vuelve a hablar, el globo anterior se va;
   - no se sale de la pantalla (se corre de costado y la colita sigue apuntando al personaje).
   v2 (11/11, pedido: "me gustaban más las burbujas de diálogo anteriores; dale timing a los diálogos, si hay más de un
   personaje a veces los globos salen todos al mismo tiempo; mientras se escriben algunas letras se salen del borde"):
   - el dibujo vuelve a ser el globo de pergamino de PixelLab (el del 10/11, de ck_ui_sutil.js), estirado al tamaño de la
     frase sin deformar las esquinas, con su colita;
   - el texto se corta en renglones ANTES de escribirse y se escribe dentro de una caja fija: ninguna letra se sale;
   - turnos: si otro personaje cerca (300 px) todavía está hablando, el nuevo globo espera a que el otro termine de
     escribir y se lea (el de antes queda un rato, y el nuevo aparece arriba si se pisan).
   Borrar su línea de index.html vuelve al globito de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA) return;
  const E = window.CK_ESCENA;
  const C = { papel: 0xf6ead0, sombra: 0xc9a873, borde: 0x3a2412, tinta: '#2b1a0e' };
  const ANCHO = 128, PAD_X = 5, PAD_Y = 3, COLA = 5, PROF = 29400;
  const vivos = [];   // globos en pantalla
  let orden = 0;
  // ------------------------------------------------------------------ (v2) el globo de pergamino de PixelLab
  const ARTE = { globo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEkAAAAuCAYAAABkgjQ+AAAFVklEQVR42uVbvY4cRRCu6pnzERza0EanQ3ICcnIXEPIEgIgcICQikHgAR05NQMgTABIQIJAIkRNCCAlsAgsSC8wZTpYsrXGw57vpIpjtnu7qqp7pmZ0Lblta7c5MT/98/dVPV/UiCOVwf4/OLALYFwDmClzWsmMIwnleqQ0AANx7tMSwXnRx45WXyf3+6e7nsG3lrXc+akEDgAf//IcJSIf7e3T3xy/8C1dfe3OrADr545fo+u13P/aMQscgxxwHzurZ4+4NsgBo9B7Itl/UERORomt3z9Vzv9sHRm0zeu7uoQGyBGjQf4fv8X5937wfNq/lvw8TZt0/fo61k00H0Gr5t3+RzEtdJ3alg7Suj9gNUhpoeM/9TibKwCFLAEQx8dfXZEnsw7Xp2vfNEgOUgba4dj0Ca62iwHAx850FAEnXuRKxpOe5m0wLRscUD7zB6Jvf60BI23S/OWB8XtrcvvryEzjc3yMT6qDVs8d5sRrSwYD3JZbl3pdACQGIgM52bCOmauAsrl2Hp0+O131WYGozXelJnfWxSaqfBW/mojGqggZMA5U8aKaD/HWoMxSgNJ3kwOAAuutiYA1Oey7oWQ5UAxUYss1otmgdaoOTQAgtngN2kNgoC8bF0YkoGox0XW5O4f0KGjBoKtns9uiMHGiaonRAcCuXuARTxIYBHOos/lyz2Px+La6Ssyx2FYuRAkzYaC8LcuATpX6PUhfBTgLSG4OcawMA55aDhCZhk2tkDEAlgOXMdK9vpvQZ+kv8/tBSGwDTa4LXoEmI961CqRIuGXwfQ6RFyvaRUTVmYO+9AI0Ws8KV7WtHG4eq85zvlPHv6qJBbJA5CQOkvdUEFonbFbCiSukVucgFkDaVQzxouznLNIVVQ8bR1hluTc8tMBdgpIndkKxkxaXUey96liECmooxqVB/bAqgcJM6lknxe61ohZEG790U+mNkG6hLmTSXTtqkAg/9LtHKFQIVb0tC2oWuf7hz3pR4TbBwfWPgXramyL33z+bI/aQ8k4IoHyLMClSpqGnO4Zix+TmCFXWUKRmUNLBNishw6zTBj8pEKLT7ugsgKNXQYYv2Pxu1SjgLuLl6OR11bjmTtIA82S6kMbdOyuiHOfpOEhIMg9oU+ElJ5mMGVyDnr0ztQ1ILHiABHD0KwGNGmYHNwiiys7E0TEGVFpMb7Eb9liH6Ak3LWGFVxaimxA4pI2LHq4o0VOJM/gAmzbXaozIsIxgeJR4yelBl0hBnbPQ+aYSoaWOZsogi6MoYIo97TKw5t8IlKSKXeU3EJbCss1o2BagkChC+hEgXopPmcEqnZpiTbYnons/sE5Xs2+ZIWJa2afriOxcVAehbeS1nF36mMMgDJ1jWSCdxEbsIJiFSVmn7bVHhfmu0iAmWLo4CsJBtX+ZhDiC1aIB0VsBnfDNA5bLGQ0GsSwetOXBTwcq+7w5tBcmCvjyadyADPessaHfeSTkkpoHkD29RGlOR4to8AjAGqHDSiEOcTYgmmNOZCdPR+D54WJeD9fC3nyE6MOEulid/xkiy3T/vtG8lh7gQYy2XpjvVnL8Q7pH8sUl5N4k1pUpSTw5m8m0saRi1EUyqPYZI/lu9Zwbk3MhCtbMLzdkpVDu7UEHTRriODhb07Tef+nqvvv5GWThjpt37RZe/fv+1FbGzUwAA+ODDO3Dv0bKd8YtzK1bOmsjwc4kAcqXa2U0Pu9+4uks/fPdZp7DWdNvWcvO9W/Dg5BSTfwT4v0sAwPdf39k6kG6+f9sf175//BzFv024cnSwoAoa0M5TXsZCtgE0FZBtIoAgl5o4OljQNrFIAseV/wGblXLGXjVtEAAAAABJRU5ErkJggg==', cola: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAASUlEQVR42mM0kuX5v3BeEwM2EJ1Qx8B07vEXxpikRqySl55+YWRiYGBg+PXnHwNBoC/L///y7r7/l3f3/deT5vmPVZGeNA+GJAASaxqkfGRH7gAAAABJRU5ErkJggg==' };
  const IMG = new Image(); IMG.src = ARTE.globo;
  const B = 7;   // borde del dibujo (esquinas que no se estiran)
  const texGlobo = (S, w, h) => {
    const k = 'ckglobo_' + w + 'x' + h;
    if (S.textures.exists(k)) return k;
    if (!IMG.complete || !IMG.naturalWidth) return null;
    const t = S.textures.createCanvas(k, w, h), g = t.getContext(), W = IMG.naturalWidth, H = IMG.naturalHeight;
    g.imageSmoothingEnabled = false;
    const d = (sx, sy, sw, sh, dx, dy, dw, dh) => { if (dw > 0 && dh > 0) g.drawImage(IMG, sx, sy, sw, sh, dx, dy, dw, dh); };
    const cw = W - 2 * B, ch = H - 2 * B, iw = w - 2 * B, ih = h - 2 * B;
    d(0, 0, B, B, 0, 0, B, B); d(W - B, 0, B, B, w - B, 0, B, B); d(0, H - B, B, B, 0, h - B, B, B); d(W - B, H - B, B, B, w - B, h - B, B, B);
    d(B, 0, cw, B, B, 0, iw, B); d(B, H - B, cw, B, B, h - B, iw, B); d(0, B, B, ch, 0, B, B, ih); d(W - B, B, B, ch, w - B, B, B, ih);
    d(B, B, cw, ch, B, B, iw, ih);
    t.refresh(); return k;
  };
  const texCola = S => { if (!S.textures.exists('ckglobo_cola')) { try { S.textures.addBase64('ckglobo_cola', ARTE.cola); } catch (e) {} } return S.textures.exists('ckglobo_cola') ? 'ckglobo_cola' : null; };

  const dibujar = (g, w, h, colaX, largo) => {
    // cuerpo con esquinas recortadas de a un píxel (se ve pixel art, no redondeado liso)
    g.clear();
    largo = Math.max(0, Math.round(largo || 0));
    const x = -w / 2, y = -h - COLA - largo;
    g.fillStyle(C.borde, 1);
    g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle(C.sombra, 1);
    g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
    g.fillStyle(C.papel, 1);
    g.fillRect(x + 2, y + 1, w - 4, h - 3); g.fillRect(x + 1, y + 2, w - 2, h - 5);
    const cx = Math.round(Math.max(x + 6, Math.min(x + w - 6, colaX)));
    // si el globo quedó más arriba (otro globo abajo), un palito lo une con el que habla
    const y0 = y + h - 1;
    if (largo > 0) {
      g.fillStyle(C.borde, 1); g.fillRect(cx - 2, y0, 5, largo + 1);
      g.fillStyle(C.papel, 1); g.fillRect(cx - 1, y0 - 1, 3, largo + 2);
    }
    // colita: un triángulo de píxeles hacia abajo, con su borde, que termina en la cabeza
    const yc = y0 + largo;
    for (let i = 0; i < COLA; i++) {
      const half = Math.max(0, COLA - 1 - i);
      g.fillStyle(C.borde, 1); g.fillRect(cx - half - 1, yc + i, half * 2 + 3, 1);
      if (i < COLA - 1) { g.fillStyle(C.papel, 1); g.fillRect(cx - half, yc + i, Math.max(1, half * 2 + 1), 1); }
    }
  };

  // la coronilla del personaje: la primera fila con píxeles del cuadro que está mostrando (se guarda por cuadro)
  const TOPE = {}, MIN = {};
  const filaTope = sp => {
    const fr = sp.frame, tx = sp.texture;
    if (!fr || !tx) return null;
    const k = tx.key + ':' + fr.name;
    if (k in TOPE) return TOPE[k];
    let fila = null;
    try {
      const img = tx.getSourceImage(), w = fr.cutWidth, h = fr.cutHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const px = g.getImageData(0, 0, w, h).data;
      outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 120) { fila = y; break outer; }
    } catch (e) { fila = null; }
    return (TOPE[k] = fila);
  };
  const cabeza = (sp, alto) => {
    let f = filaTope(sp);
    if (f === null || !sp.frame) return sp.y - alto;
    // la más alta de los cuadros ya vistos de esa hoja: el globo no salta con cada paso
    const k = sp.texture.key; MIN[k] = Math.min(MIN[k] === undefined ? f : MIN[k], f); f = MIN[k];
    const arriba = sp.y - sp.originY * sp.displayHeight;          // borde de arriba del cuadro, en el mundo
    return arriba + f * Math.abs(sp.scaleY) * (sp.displayHeight / (sp.frame.cutHeight * Math.abs(sp.scaleY) || 1));
  };

  const globo = (S, sp, texto, ms = 2600, alto) => new Promise(resolver => {
    if (!S || !sp || !sp.active || !texto) return resolver();
    // el mismo personaje no tiene dos globos a la vez
    vivos.filter(v => v.sp === sp).forEach(v => v.cerrar(true));

    const t = S.add.text(0, 0, '', {
      fontFamily: "'CK Grenze', Georgia, serif", fontSize: '10px', fontStyle: '600', color: C.tinta,
      wordWrap: { width: ANCHO - PAD_X * 2 }, align: 'center', lineSpacing: -1
    }).setOrigin(0.5, 1).setResolution(4);
    // medida final con el texto entero, cortado en renglones de una vez (así se escribe sin que nada salte ni se salga)
    t.setText(texto);
    const lineas = t.getWrappedText ? t.getWrappedText(texto) : [texto];
    const final = lineas.join('\n');
    t.setWordWrapWidth(null); t.setText(final);
    const tw = Math.ceil(t.width), th = Math.ceil(t.height);
    t.setFixedSize(tw, th);
    const arte = texGlobo(S, Math.max(26, tw + 14), th + 13);   // el pergamino (null: todavía no cargó, va el dibujado)
    const w = arte ? Math.max(26, tw + 14) : Math.max(22, tw + PAD_X * 2), h = arte ? th + 13 : th + PAD_Y * 2;
    t.setText('');
    const g = S.add.graphics();
    const fondo = arte ? S.add.image(0, 0, arte).setOrigin(0.5, 1) : null;
    const colaImg = arte && texCola(S) ? S.add.image(0, 0, 'ckglobo_cola').setOrigin(0.5, 0) : null;
    // el más nuevo va detrás de los que ya estaban: si sube con su palito, el palito pasa por detrás del otro globo
    if (!vivos.length) orden = 0;
    const cont = S.add.container(0, 0, [g, fondo, colaImg, t].filter(Boolean)).setDepth(PROF - (orden++) * 0.01).setScale(0.2).setAlpha(0);
    t.setPosition(0, -COLA - PAD_Y + 1);

    const altura = alto || (sp.displayHeight ? sp.displayHeight * 0.92 : 40);
    const v = { sp, cont, w, h, dy: 0, cerrado: false };
    let colaX = 0, ultimaColaX = null, ultimoLargo = null;
    const colocar = () => {
      if (!sp.active) { v.cerrar(true); return; }
      const cam = S.cameras.main, vw = cam.worldView;
      let x = Math.round(sp.x), y = Math.round(cabeza(sp, altura) - 2);
      // que no se salga de la pantalla: la burbuja se corre, la colita no
      let bx = x;
      const m = 4;
      if (vw && vw.width) {
        if (bx - w / 2 < vw.x + m) bx = vw.x + m + w / 2;
        if (bx + w / 2 > vw.right - m) bx = vw.right - m - w / 2;
      }
      // apilado: si otro globo ocupa el mismo lugar, este sube
      let dy = 0;
      for (const o of vivos) {
        if (o === v || o.cerrado || !o.cont.active) continue;
        // los dos cuerpos se pisarían: este (el más nuevo) sube lo justo para quedar arriba del otro
        if (o.nacio >= v.nacio || Math.abs(o.cont.x - bx) >= (o.w + w) / 2 + 2) continue;
        const miBottom = y - COLA, miTop = miBottom - h, suBottom = o.cont.y - Math.round(o.dy) - COLA, suTop = suBottom - o.h;
        if (miBottom < suTop - 1 || miTop > suBottom + 1) continue;
        dy = Math.max(dy, miBottom - suTop + 2);
      }
      v.dy += (dy - v.dy) * 0.35;
      const bob = Math.round(Math.sin((S.time.now - v.nacio) / 260) * 0.8);
      const largo = Math.round(v.dy);
      cont.setPosition(bx, y + bob);
      colaX = x - bx;
      if (colaX !== ultimaColaX || largo !== ultimoLargo) {
        ultimaColaX = colaX; ultimoLargo = largo;
        if (fondo) {
          // pergamino: abajo en -COLA-largo; la colita sale del borde de abajo y apunta a la cabeza
          const yb = -COLA - largo;
          fondo.setPosition(0, yb); t.setY(yb - 6);
          const cx = Math.round(Math.max(-w / 2 + 9, Math.min(w / 2 - 9, colaX)));
          g.clear();
          if (largo > 0) { g.fillStyle(C.borde, 1); g.fillRect(cx - 2, yb - 1, 5, largo + 2); g.fillStyle(0xd3bb8e, 1); g.fillRect(cx - 1, yb - 2, 3, largo + 2); }
          if (colaImg) colaImg.setPosition(cx, yb - 2 + largo);
        } else { dibujar(g, w, h, colaX, largo); t.setY(-COLA - largo - PAD_Y + 1); }
      }
    };
    v.nacio = S.time.now;
    vivos.push(v);
    colocar();
    const ev = S.time.addEvent({ delay: 16, loop: true, callback: colocar });

    // pop desde la colita (v3: avisa a quien quiera ponerle sonido, ck_foley.js)
    try { if (window.CK_GLOBOS && window.CK_GLOBOS.alAparecer) window.CK_GLOBOS.alAparecer(S, sp, texto); } catch (e) {}
    cont.setPosition(cont.x, cont.y);
    S.tweens.add({ targets: cont, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });

    // tres puntitos y después letra por letra (termina antes de la mitad del tiempo)
    const puntos = Math.min(260, ms * 0.12);
    let tipeo = null, pt = null, k = 0;
    t.setAlign('center');
    pt = S.time.addEvent({ delay: 85, repeat: Math.max(0, Math.floor(puntos / 85) - 1), callback: () => { k = (k + 1) % 4; if (!v.cerrado) t.setText('.'.repeat(k || 1)); } });
    const arrancar = S.time.delayedCall(puntos, () => {
      if (v.cerrado) return;
      if (pt) pt.remove();
      const total = texto.length, dur = Math.max(200, Math.min(ms * 0.45, total * 32));
      let n = 0;
      tipeo = S.time.addEvent({ delay: Math.max(12, dur / total), repeat: total - 1, callback: () => { n++; if (!v.cerrado) t.setText(final.slice(0, n)); } });
    });

    v.cerrar = (rapido) => {
      if (v.cerrado) return;
      v.cerrado = true;
      [pt, tipeo, arrancar, fin].forEach(x => { try { x && x.remove && x.remove(); } catch (e) {} });
      const terminar = () => { ev.remove(); try { cont.destroy(); } catch (e) {} const i = vivos.indexOf(v); if (i >= 0) vivos.splice(i, 1); resolver(); };
      if (rapido || !cont.active) { terminar(); return; }
      t.setText(final);
      S.tweens.add({ targets: cont, scale: 0.7, alpha: 0, duration: 170, ease: 'Sine.easeIn', onComplete: terminar });
    };
    const fin = S.time.delayedCall(ms, () => v.cerrar(false));
    // si la escena cambia de zona, los globos se van
    cont.once('destroy', () => { if (!v.cerrado) { v.cerrado = true; ev.remove(); const i = vivos.indexOf(v); if (i >= 0) vivos.splice(i, 1); resolver(); } });
  });

  // ------------------------------------------------------------------ (v2) turnos entre los que charlan
  // cada globo anota hasta cuándo "habla" (puntitos + escritura + un rato para leer); si otro personaje cerca todavía
  // habla, el nuevo espera su turno
  const CERCA = 300, turnos = [];
  const habla = (ms, texto) => { const p = Math.min(260, ms * 0.12), d = Math.max(200, Math.min(ms * 0.45, texto.length * 32)); return p + d + Math.min(1400, 450 + texto.length * 18); };
  const conTurno = (S, sp, texto, ms = 2600, alto) => {
    if (!S || !sp || !sp.active || !texto) return Promise.resolve();
    const now = S.time.now;
    for (let i = turnos.length - 1; i >= 0; i--) if (turnos[i].hasta <= now || !turnos[i].sp.active) turnos.splice(i, 1);
    let desde = now;
    turnos.forEach(o => { if (o.sp !== sp && Math.hypot(o.sp.x - sp.x, o.sp.y - sp.y) < CERCA) desde = Math.max(desde, o.hasta); });
    const espera = desde - now, yo = { sp, hasta: desde + habla(ms, texto) };
    turnos.push(yo);
    if (espera < 30) return globo(S, sp, texto, ms, alto);
    return new Promise(r => S.time.delayedCall(espera, () => globo(S, sp, texto, ms, alto).then(r)));
  };
  E.globo = conTurno;
  window.CK_GLOBOS = { globo: conTurno, solo: globo, vivos };
})();
