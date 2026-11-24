'use strict';
/* Diálogo en franja de cine (23/11, pedido del dueño: de 10 recuadros de diálogo eligió el 7, "Franja de cine": "el recuadro
   de dialogo me gusta el numero 7, aplicalo bien para cada personaje en cuestion").
   El diálogo con retrato (#ck-dialog: cuando se habla con alguien) deja de ser el cuadro de columnas góticas y pergamino:
   - una FRANJA oscura que sube desde abajo, a todo lo ancho, sin caja, con una línea fina dorada arriba del texto;
   - el PERSONAJE RECORTADO a la izquierda, grande, parado sobre el borde de abajo: los principales (los de las
     presentaciones: el Rey, Bruno, Eloy, Elia, Mira, Gorak, Grushak, Sir Gaspar, Malakar, Azrath…) con su retrato pintado
     de cuerpo entero (CK_PRES_ARTE.retratos), aunque el diálogo no traiga cara; los demás, con su propio sprite ENTERO
     (el primer cuadro, recortado y agrandado de a píxeles enteros, hasta ×6, para que no se deforme; antes era la cara
     agrandada);
     sin cara, el texto arranca desde el borde;
   - la franja va de borde a borde del juego (no de la ventana: sin las bandas negras de los costados);
   - el NOMBRE en mayúsculas chicas espaciadas, del color de ese personaje (su acento de la presentación; si no tiene,
     dorado), y el TEXTO grande y claro en Grenze.
   Las burbujas que salen solas (ck_globos.js) no cambian. Va al final de index.html. Borrar su línea vuelve al cuadro de
   antes.
   (23/11, v2, nota del dueño: "si son NPC aparecerá su modelo, pero un poco más grande que el recuadro y no diminutos"): el
   sprite entero de los que no tienen retrato se agranda hasta casi el alto del retrato (de a píxeles enteros, hasta ×12). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof document === 'undefined') return;
  const P = MainGameScene.prototype;
  const ORO = '#e2b04a';
  const css = `
html body.ck-dcine #ck-dialog { left: var(--dc-l, 0px) !important; right: var(--dc-r, 0px) !important; bottom: 0 !important; top: auto !important; width: auto !important; height: auto !important;
  min-height: 0 !important; display: block !important; box-sizing: border-box; padding: 44px 64px 26px var(--dc-izq, 64px) !important; border: 0 !important; border-image: none !important;
  border-radius: 0 !important; box-shadow: none !important; filter: none !important; color: #f6f0e4; cursor: pointer; transform: translateY(18px) !important;
  background: linear-gradient(180deg, rgba(8, 6, 5, 0) 0%, rgba(8, 6, 5, .80) 34%, rgba(8, 6, 5, .94) 100%) !important; transition: opacity .22s ease, transform .28s cubic-bezier(.2, .9, .3, 1) !important; }
html body.ck-dcine #ck-dialog.on { transform: none !important; }
html body.ck-dcine #ck-dialog::before { content: '' !important; display: block !important; position: absolute; left: var(--dc-izq, 64px); right: 64px; top: 34px; height: 1px;
  background: linear-gradient(90deg, var(--dc-acento, ${ORO}), rgba(201, 165, 90, 0)) !important; }
html body.ck-dcine #ck-dialog::after { content: none !important; display: none !important; }
html body.ck-dcine #ck-dialog .ck-dlg-face, html body.ck-dcine #ck-dialog .ck-dlg-face.painted { position: absolute !important; left: 26px; bottom: 0; width: var(--dc-ret, 200px) !important;
  height: var(--dc-ret, 200px) !important; flex: none !important; border: 0 !important; box-shadow: none !important; background: none !important; overflow: visible !important; pointer-events: none; }
html body.ck-dcine #ck-dialog .ck-dlg-face::before, html body.ck-dcine #ck-dialog .ck-dlg-face::after { content: none !important; display: none !important; }
html body.ck-dcine #ck-dialog .ck-dlg-portrait { position: static !important; display: block; width: 100% !important; height: 100% !important; object-fit: contain; object-position: 50% 100%;
  image-rendering: pixelated; filter: drop-shadow(0 0 6px rgba(0, 0, 0, .7)); }
html body.ck-dcine #ck-dialog.dc-entero .ck-dlg-portrait { object-fit: none; object-position: 0 100%; }
html body.ck-dcine #ck-dialog.dc-sprite .ck-dlg-portrait { width: 86% !important; height: 86% !important; margin: 14% 0 0 7%; }
html body.ck-dcine #ck-dialog .ck-dlg-body { position: relative; max-width: 900px; height: auto !important; padding: 0 !important; margin: 0; border: 0 !important; background: none !important; }
html body.ck-dcine #ck-dialog .ck-dlg-name { display: block !important; margin: 0 0 7px !important; padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important;
  font-family: var(--ck2-f, 'CK Grenze'), Grenze, Georgia, serif !important; font-weight: 700; font-size: 14px !important; line-height: 1 !important; letter-spacing: .22em !important;
  text-transform: uppercase; color: var(--dc-acento, ${ORO}) !important; text-shadow: 0 2px 0 rgba(0, 0, 0, .6); }
html body.ck-dcine #ck-dialog .ck-dlg-name:empty { display: none !important; }
html body.ck-dcine #ck-dialog .ck-dlg-text { min-height: 2.6em !important; font-family: var(--ck2-f, 'CK Grenze'), Grenze, Georgia, serif !important; font-weight: 600; font-size: 23px !important;
  line-height: 1.3 !important; color: #f6f0e4 !important; text-shadow: 0 2px 0 rgba(0, 0, 0, .55); }
html body.ck-dcine #ck-dialog .ck-dlg-next { position: absolute !important; left: auto !important; top: auto !important; right: 64px !important; bottom: 10px !important;
  font-family: var(--ck2-f, 'CK Grenze'), Grenze, Georgia, serif !important; font-weight: 700; font-size: 12px !important; letter-spacing: .12em; color: rgba(246, 240, 228, .55) !important; }
html body.ck-dcine.ck-movil #ck-dialog { padding: 34px 18px 18px var(--dc-izq, 18px) !important; }
html body.ck-dcine.ck-movil #ck-dialog .ck-dlg-text { font-size: 17px !important; }
html body.ck-dcine.ck-movil #ck-dialog .ck-dlg-next { right: 18px !important; }
`;
  const estilo = () => {
    if (!document.getElementById('ck-dialogo-cine-css')) { const s = document.createElement('style'); s.id = 'ck-dialogo-cine-css'; s.textContent = css; document.head.appendChild(s); }
    document.body.classList.add('ck-dcine');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', estilo); else estilo();

  // ¿quién habla? uno de los principales (por el nombre, o por el sprite de la cara)
  const elenco = (name, face) => {
    const PR = window.CK_PRESENTACIONES; if (!PR || !PR.ELENCO) return null;
    const n = String(name || '').trim();
    let c = n ? PR.ELENCO.find(e => e.dialogo && e.dialogo.test(n)) : null;
    if (!c && typeof face === 'string' && PR.POR_TIPO) c = PR.POR_TIPO[face.replace(/_(idle|walk|run|attack\w*)$/, '')] || null;
    return c;
  };
  // el sprite entero (primer cuadro, sin lo transparente), agrandado de a píxeles enteros hasta el alto pedido
  const cuerpos = {};
  const cuerpo = (S, key, alto) => {
    const k = key + '@' + alto;
    if (cuerpos[k] !== undefined) return cuerpos[k];
    let url = null;
    try {
      const tex = S.textures.get(key), fr = tex.get(0), src = tex.getSourceImage();
      const w = fr.cutWidth, h = fr.cutHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      if (x1 >= x0 && y1 >= y0) {
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1, e = Math.max(1, Math.min(12, Math.floor(alto / Math.max(cw, ch))));   // (v2: hasta ×12; antes ×6 y los chicos quedaban diminutos)
        const o = document.createElement('canvas'); o.width = cw * e; o.height = ch * e;
        const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, x0, y0, cw, ch, 0, 0, cw * e, ch * e);
        url = { src: o.toDataURL(), w: o.width, h: o.height };
      }
    } catch (e) { url = null; }
    return (cuerpos[k] = url);
  };
  // medidas según el alto del juego; la franja de borde a borde del juego
  const medir = (el, S) => {
    const host = el.offsetParent || el.parentElement || document.body;
    try {
      const hr = host.getBoundingClientRect(), cr = S && S.game && S.game.canvas && S.game.canvas.getBoundingClientRect();
      if (cr && cr.width > 50) {
        el.style.setProperty('--dc-l', Math.max(0, Math.round(cr.left - hr.left)) + 'px');
        el.style.setProperty('--dc-r', Math.max(0, Math.round(hr.right - cr.right)) + 'px');
      }
    } catch (e) {}
    const h = (host && host.clientHeight) || innerHeight;
    const movil = document.body.classList.contains('ck-movil');
    const ret = Math.round(Math.max(110, Math.min(movil ? 170 : 260, h * (movil ? 0.3 : 0.34))));
    el.style.setProperty('--dc-ret', ret + 'px');
    return ret;
  };

  const od0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    const r = od0.apply(this, arguments);
    try {
      estilo();
      const el = document.getElementById('ck-dialog'); if (!el) return r;
      const box = el.querySelector('.ck-dlg-face'), img = box && box.querySelector('img');
      const c = elenco(name, face), A = window.CK_PRES_ARTE, pintado = c && A && A.retratos && A.retratos[c.id];
      const ret = medir(el, this), movil = document.body.classList.contains('ck-movil');
      let entero = null;
      if (box && img && pintado) { img.src = pintado; box.style.display = ''; }
      else if (box && img && typeof face === 'string' && face && !/\.png$|^data:/.test(face) && this.textures && this.textures.exists(face)) {
        entero = cuerpo(this, face, Math.round(ret * 0.96));
        if (entero) { img.src = entero.src; box.style.display = ''; }
      }
      const conCara = !!(box && box.style.display !== 'none' && img && img.getAttribute('src'));
      el.classList.toggle('dc-sprite', conCara && !pintado && !entero && !(box && box.classList.contains('painted')));
      el.classList.toggle('dc-entero', conCara && !!entero);
      el.style.setProperty('--dc-acento', (c && c.acento) || ORO);
      const ancho = entero ? Math.max(96, entero.w) : ret * 0.9;   // (el sprite entero, a su tamaño: el texto empieza al lado)
      el.style.setProperty('--dc-izq', conCara ? Math.round(26 + ancho + 18) + 'px' : (movil ? '18px' : '64px'));
    } catch (e) { console.warn('[diálogo de cine]', e); }
    return r;
  };

  window.CK_DIALOGO_CINE = { elenco };
})();
