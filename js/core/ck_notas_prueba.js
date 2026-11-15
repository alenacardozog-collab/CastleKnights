'use strict';
/* Notas para corregir (13/11, pedido del dueño: "¿habría manera de testear los mapas e indicarte con un trazo, y que ese trazo
   me deje dar la nota a corregir, así sabés qué es lo que quiero que se corrija? y hacerlo bien").
   - N (o el botón ✎ NOTA, que se ve en el modo práctica, debajo de PRUEBAS): el juego se congela y aparece una hoja
     transparente encima del mapa. Se marca con el mouse (o el dedo) lo que hay que corregir: trazos libres en rojo, amarillo o
     celeste; "Deshacer" saca el último trazo. Abajo se elige qué es (Choque, Delante/detrás, Tamaño, Dibujo, Lugar, Otro) y se
     escribe la nota. Esc o "Cancelar" vuelve al juego sin guardar.
   - Guardar: se guarda el mapa, los trazos EN COORDENADAS DEL MAPA (los mismos números del Taller y del código), dónde estaba
     el héroe y su escala, el héroe elegido, el capítulo, la hora del juego, el texto y dos fotos: el recorte marcado (con los
     trazos) y la pantalla entera chica.
   - Las notas quedan guardadas en el navegador (IndexedDB). Con "Carpeta…" se elige una carpeta (recomendada
     D:\Editor\trabajo\_notas_prueba): desde ahí cada nota nueva se escribe también como nota_<mapa>_<fecha>.json + .jpg, y el
     asistente las lee directo. "Exportar todo" baja notas_para_corregir.json con todas.
   - NOTAS (lista): por mapa, con la foto; "Ir" lleva a ese lugar (en el modo práctica) y "Borrar" la saca. En el mapa se ven
     los trazos de las notas de ese mapa, numerados ("Ocultar trazos" los apaga).
   - SIEMPRE = true: la N también anda en la campaña (para marcar lo que se ve jugando). Antes de la entrega final, ponerlo en
     false o borrar la línea de index.html (las notas guardadas quedan en el navegador y en la carpeta).
   API: CK_NOTAS.abrir(), .lista(), .todas() → promesa con las notas, .exportar(). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const SIEMPRE = true;
  const TIPOS = [['choque', 'Choque', 'atraviesa algo o no deja pasar'], ['profundidad', 'Delante/detrás', 'se dibuja encima o se corta'],
    ['tamano', 'Tamaño', 'grande o chico de más'], ['dibujo', 'Dibujo', 'algo se ve mal'], ['lugar', 'Lugar', 'algo está mal puesto'], ['otro', 'Otro', '']];
  const COLORES = [['#ff3b30', 'rojo'], ['#ffd60a', 'amarillo'], ['#5ac8fa', 'celeste']];
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const enPractica = S => !!(S && S.gameStarted && (S._gameMode !== 'campaign' || (window.CK_PANEL_PRUEBAS && CK_PANEL_PRUEBAS.st && CK_PANEL_PRUEBAS.st.prueba)));
  const zonaDe = S => (S && S.currentZoneKey && S.currentZoneKey()) || 'village';
  const mapaDe = z => { const m = /^ed_([a-z0-9_]+)\./.exec(z); return m ? m[1] : z; };
  const idPractica = z => { const m = /^ed_([a-z0-9_]+)\./.exec(z); if (m) return m[1]; if (z === 'ruins.village') return '@ruins'; if (/^castle\./.test(z)) return '@castle:' + z.split('.')[1]; if (z === 'village') return '_aldea'; return null; };
  const nombreMapa = z => {
    try { const D = window.EDITOR_DATA, m = mapaDe(z); if (D && D.mapas && D.mapas[m]) return D.mapas[m].titulo || D.mapas[m].nombre || m; } catch (e) {}
    return mapaDe(z).replace(/_/g, ' ');
  };
  const origen = S => { const c = S && S.currentInterior; return c && c.area ? { x: c.area.x, y: c.area.y } : { x: 0, y: 0 }; };
  const dos = n => String(n).padStart(2, '0');
  const sello = d => `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}${dos(d.getSeconds())}`;

  // ------------------------------------------------------------------ guardar (IndexedDB; si falla, en memoria)
  let bd = null; const memoria = { notas: [], ajustes: {} };
  const abrirBD = () => bd || (bd = new Promise(ok => {
    try {
      const r = indexedDB.open('ck_notas_prueba', 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('notas')) d.createObjectStore('notas', { keyPath: 'id' }); if (!d.objectStoreNames.contains('ajustes')) d.createObjectStore('ajustes'); };
      r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
    } catch (e) { ok(null); }
  }));
  const pedir = (st, modo, f) => abrirBD().then(d => new Promise(ok => {
    if (!d) { ok(f(null)); return; }
    try { const t = d.transaction(st, modo), q = f(t.objectStore(st)); t.oncomplete = () => ok(q && q.result); t.onerror = () => ok(null); } catch (e) { ok(null); }
  }));
  const todas = () => pedir('notas', 'readonly', s => s ? s.getAll() : { result: memoria.notas.slice() }).then(v => (v || []).sort((a, b) => b.creado - a.creado));
  const poner = n => pedir('notas', 'readwrite', s => { if (s) return s.put(n); memoria.notas = memoria.notas.filter(o => o.id !== n.id).concat([n]); return null; });
  const sacar = id => pedir('notas', 'readwrite', s => { if (s) return s.delete(id); memoria.notas = memoria.notas.filter(o => o.id !== id); return null; });
  const ajuste = (k, v) => pedir('ajustes', v === undefined ? 'readonly' : 'readwrite', s => { if (!s) { if (v !== undefined) memoria.ajustes[k] = v; return { result: memoria.ajustes[k] }; } return v === undefined ? s.get(k) : s.put(v, k); });
  let cache = [];
  const refrescar = () => todas().then(v => { cache = v; pintarTrazos(true); pintarBotones(); return v; });

  // ------------------------------------------------------------------ la carpeta (File System Access, Chrome/Edge)
  const hayCarpetas = () => typeof window.showDirectoryPicker === 'function';
  const carpeta = async (preguntar) => {
    let h = await ajuste('carpeta');
    if (!h) return null;
    try {
      let p = await h.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted' && preguntar) p = await h.requestPermission({ mode: 'readwrite' });
      return p === 'granted' ? h : null;
    } catch (e) { return null; }
  };
  const elegirCarpeta = async () => {
    if (!hayCarpetas()) { aviso('Este navegador no deja elegir carpetas: usá "Exportar todo"'); return; }
    try {
      const h = await window.showDirectoryPicker({ id: 'ck_notas_prueba', mode: 'readwrite' });
      await ajuste('carpeta', h);
      aviso('Las notas nuevas se guardan también en la carpeta ' + h.name);
      pintarLista();
    } catch (e) { /* cancelado */ }
  };
  const escribirArchivo = async (h, nombre, contenido) => {
    const f = await h.getFileHandle(nombre, { create: true }), w = await f.createWritable();
    await w.write(contenido); await w.close();
  };
  const aBlob = durl => { const [cab, b64] = durl.split(','), bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: /:(.*?);/.exec(cab)[1] }); };
  const enCarpeta = async n => {
    const h = await carpeta(true); if (!h) return false;
    try {
      const base = `nota_${n.mapa}_${n.sello}`;
      await escribirArchivo(h, base + '.json', JSON.stringify(n, null, 1));
      if (n.foto) await escribirArchivo(h, base + '.jpg', aBlob(n.foto));
      return true;
    } catch (e) { console.warn('[notas] carpeta', e); return false; }
  };
  const bajar = (nombre, texto) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' })); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  };
  const exportar = async () => {
    const v = await todas();
    if (!v.length) { aviso('Todavía no hay notas'); return; }
    const texto = JSON.stringify({ juego: 'Castle Knight', que: 'notas para corregir', exportado: new Date().toISOString(), cuantas: v.length, notas: v }, null, 1);
    const h = await carpeta(true);
    if (h) { try { await escribirArchivo(h, 'notas_para_corregir.json', texto); aviso(`Exportadas ${v.length} notas a la carpeta ${h.name}`); return; } catch (e) {} }
    bajar('notas_para_corregir.json', texto); aviso(`Exportadas ${v.length} notas (archivo notas_para_corregir.json)`);
  };

  // ------------------------------------------------------------------ estilos
  const css = `
#cknp-bot{position:absolute;left:14px;top:258px;z-index:60;display:none;gap:6px}
#cknp-bot.on{display:flex} #cknp-bot div{padding:5px 10px;font:12px MedievalSharp,serif;color:#fde68a;background:#2a1d14ee;border:2px solid #8a6a3a;border-radius:4px;cursor:pointer;letter-spacing:.5px}
#cknp-bot div:hover{background:#3a2a1c}
#cknp{position:fixed;z-index:9000;display:none;touch-action:none}
#cknp.on{display:block} #cknp canvas{position:absolute;left:0;top:0;cursor:crosshair}
#cknp .barra,#cknp .hoja{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;
  font:12px MedievalSharp,serif;color:#f3e6c8;background:#1c140ef2;border:2px solid #8a6a3a;border-radius:6px;box-shadow:0 4px 18px #000a;padding:6px 10px}
#cknp .barra{top:8px;max-width:calc(100% - 24px)} #cknp .hoja{bottom:8px;width:min(560px,calc(100% - 24px));flex-direction:column;align-items:stretch}
#cknp .hoja.arriba{bottom:auto;top:54px} #cknp .hoja.oculta{display:none}
body.cknp-marcando #game-wrapper > *:not(#game-canvas-container):not(#cknp):not(#cknp-aviso):not(#cknp-grande){visibility:hidden!important}
#cknp .tit{color:#fbbf24;letter-spacing:1px} #cknp button{font:12px MedievalSharp,serif;padding:3px 9px;color:#1c140e;background:#e8c47a;border:1px solid #8a6a3a;border-radius:3px;cursor:pointer}
#cknp button.sec{background:#5a442a;color:#f3e6c8} #cknp button:disabled{opacity:.45;cursor:default}
#cknp .col{width:20px;height:20px;border-radius:50%;border:2px solid #1c140e;cursor:pointer;padding:0} #cknp .col.sel{outline:2px solid #fde68a;outline-offset:1px}
#cknp .tipos{display:flex;gap:5px;flex-wrap:wrap} #cknp .tipo{padding:3px 8px;border:1px solid #6b5232;border-radius:12px;cursor:pointer;background:#2d2016}
#cknp .tipo.sel{background:#e8c47a;color:#1c140e;border-color:#e8c47a}
#cknp textarea{font:13px Georgia,serif;width:100%;box-sizing:border-box;min-height:54px;resize:vertical;background:#2d2016;color:#f3e6c8;border:1px solid #6b5232;border-radius:4px;padding:5px}
#cknp .pie{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap} #cknp .ayuda{color:#b9a27c;font-size:11px}
#cknp-lista{position:absolute;right:12px;top:150px;z-index:62;width:300px;max-height:calc(100% - 230px);overflow:auto;display:none;padding:10px 12px;
  font:12px MedievalSharp,serif;color:#f3e6c8;background:#1c140ef2;border:2px solid #8a6a3a;border-radius:6px;box-shadow:0 4px 18px #000a}
#cknp-lista.on{display:block} #cknp-lista h3{margin:10px 0 5px;font-size:12px;color:#fbbf24;letter-spacing:1px;border-bottom:1px solid #5a442a;padding-bottom:2px}
#cknp-lista .n{display:grid;grid-template-columns:72px 1fr;gap:6px;margin:6px 0;padding-bottom:6px;border-bottom:1px dashed #4a3826}
#cknp-lista img{width:72px;height:auto;border:1px solid #5a442a;border-radius:3px;cursor:zoom-in} #cknp-lista .t{color:#fde68a}
#cknp-lista .tx{font:12px Georgia,serif;color:#f3e6c8;white-space:pre-wrap;overflow-wrap:anywhere} #cknp-lista .f{color:#b9a27c;font-size:10px}
#cknp-lista button{font:11px MedievalSharp,serif;margin:3px 3px 0 0;padding:2px 7px;color:#1c140e;background:#e8c47a;border:1px solid #8a6a3a;border-radius:3px;cursor:pointer}
#cknp-lista button.sec{background:#5a442a;color:#f3e6c8} #cknp-lista .x{position:absolute;right:8px;top:4px;cursor:pointer;color:#b9a27c}
#cknp-lista .vacio{color:#b9a27c;margin:8px 0}
#cknp-aviso{position:absolute;left:50%;top:70px;transform:translateX(-50%);z-index:9001;display:none;padding:6px 12px;font:13px MedievalSharp,serif;color:#1c140e;background:#e8c47a;border:2px solid #8a6a3a;border-radius:5px;box-shadow:0 3px 12px #0008}
#cknp-grande{position:fixed;inset:0;z-index:9002;display:none;align-items:center;justify-content:center;background:#000c;cursor:zoom-out}
#cknp-grande.on{display:flex} #cknp-grande img{max-width:92vw;max-height:88vh;image-rendering:pixelated;border:2px solid #8a6a3a}`;

  // ------------------------------------------------------------------ armar lo de la pantalla
  let ui = null;
  const armar = () => {
    if (ui) return ui;
    const w = document.getElementById('game-wrapper') || document.body;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const bot = document.createElement('div'); bot.id = 'cknp-bot';
    bot.innerHTML = '<div data-a="nota" title="Marcar algo para corregir (N)">✎ NOTA · N</div><div data-a="lista" title="Ver las notas">NOTAS</div>';
    w.appendChild(bot);
    const ov = document.createElement('div'); ov.id = 'cknp';
    ov.innerHTML = `<canvas></canvas>
<div class="barra"><span class="tit">MARCÁ LO QUE HAY QUE CORREGIR</span>${COLORES.map(([c, n], i) => `<button class="col${i ? '' : ' sel'}" data-c="${c}" title="${n}" style="background:${c}"></button>`).join('')}
<button class="sec" data-a="deshacer">Deshacer</button><button class="sec" data-a="limpiar">Borrar trazos</button><button data-a="escribir">Escribir la nota ▸</button><button class="sec" data-a="cancelar">Cancelar · Esc</button></div>
<div class="hoja oculta"><div class="tipos">${TIPOS.map(([k, t, d], i) => `<span class="tipo${i ? '' : ' sel'}" data-t="${k}" title="${d}">${t}</span>`).join('')}</div>
<textarea id="cknp-texto" placeholder="¿Qué hay que corregir? Ej.: acá el héroe atraviesa la cerca / este barril tapa la puerta / el árbol se dibuja encima del héroe"></textarea>
<div class="pie"><span class="ayuda" id="cknp-ayuda">Dibujá con el mouse (o el dedo) sobre lo que está mal. Podés hacer varios trazos.</span><span><button class="sec" data-a="mover" title="Pasar la nota arriba o abajo">⇅</button> <button data-a="guardar" id="cknp-guardar">Guardar nota</button></span></div></div>`;
    w.appendChild(ov);                          // adentro del juego: en pantalla completa sólo se ve lo que está ahí
    const lista = document.createElement('div'); lista.id = 'cknp-lista'; w.appendChild(lista);
    const av = document.createElement('div'); av.id = 'cknp-aviso'; w.appendChild(av);
    const gr = document.createElement('div'); gr.id = 'cknp-grande'; gr.innerHTML = '<img alt="">'; w.appendChild(gr);
    gr.addEventListener('click', () => gr.classList.remove('on'));
    lista.addEventListener('click', e => clicLista(e));
    bot.addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'nota') abrir(); else if (a === 'lista') alternarLista(); });
    ov.addEventListener('click', e => {
      const b = e.target.closest('button,.tipo'); if (!b) return;
      if (b.dataset.c) { ov.querySelectorAll('.col').forEach(x => x.classList.toggle('sel', x === b)); M.color = b.dataset.c; return; }
      if (b.dataset.t) { ov.querySelectorAll('.tipo').forEach(x => x.classList.toggle('sel', x === b)); M.tipo = b.dataset.t; return; }
      const a = b.dataset.a;
      if (a === 'deshacer') { M.trazos.pop(); dibujar(); }
      else if (a === 'limpiar') { M.trazos = []; dibujar(); }
      else if (a === 'cancelar') cerrar();
      else if (a === 'guardar') guardar();
      else if (a === 'escribir') mostrarHoja(true);
      else if (a === 'mover') { const h = ov.querySelector('.hoja'); h.classList.toggle('arriba'); M.hojaMovida = true; ubicarHoja(); }
    });
    ov.querySelector('textarea').addEventListener('input', () => dibujar());
    const cv = ov.querySelector('canvas');
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); M.actual = { color: M.color, pts: [[e.clientX, e.clientY]] }; M.trazos.push(M.actual); dibujar(); });
    cv.addEventListener('pointermove', e => {
      if (!M.actual) return;
      const u = M.actual.pts[M.actual.pts.length - 1];
      if (Math.hypot(e.clientX - u[0], e.clientY - u[1]) >= 2) { M.actual.pts.push([e.clientX, e.clientY]); dibujar(); }
    });
    const fin = () => { const habia = !!M.actual; M.actual = null; dibujar(); if (habia) mostrarHoja(false); };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    ui = { bot, ov, cv, lista, av, gr };
    return ui;
  };
  let avT = 0;
  const aviso = t => { const u = armar(); u.av.textContent = t; u.av.style.display = 'block'; clearTimeout(avT); avT = setTimeout(() => { u.av.style.display = 'none'; }, 2600); };

  // ------------------------------------------------------------------ marcar
  const M = { abierto: false, trazos: [], actual: null, color: COLORES[0][0], tipo: TIPOS[0][0], S: null, pausada: false, rect: null };
  const dibujar = () => {
    const u = ui, r = M.rect; if (!u || !r) return;
    const k = window.devicePixelRatio || 1, g = u.cv.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, r.width, r.height);
    g.lineCap = 'round'; g.lineJoin = 'round';
    M.trazos.forEach(t => {
      g.strokeStyle = '#000a'; g.lineWidth = 6; g.beginPath(); t.pts.forEach(([x, y], i) => (i ? g.lineTo(x - r.left, y - r.top) : g.moveTo(x - r.left, y - r.top))); if (t.pts.length === 1) g.lineTo(t.pts[0][0] - r.left + 0.1, t.pts[0][1] - r.top); g.stroke();
      g.strokeStyle = t.color; g.lineWidth = 3.5; g.stroke();
    });
    const b = document.getElementById('cknp-guardar'); if (b) b.disabled = !M.trazos.length && !(document.getElementById('cknp-texto').value || '').trim();
  };
  // la hoja de la nota aparece después del primer trazo (o con "Escribir la nota"), del lado contrario a lo marcado
  const mostrarHoja = foco => {
    const u = ui, r = M.rect; if (!u || !r) return;
    const h = u.ov.querySelector('.hoja'), nueva = h.classList.contains('oculta');
    h.classList.remove('oculta');
    if (!M.hojaMovida && M.trazos.length) {
      let s = 0, n = 0; M.trazos.forEach(t => t.pts.forEach(([, y]) => { s += y - r.top; n++; }));
      h.classList.toggle('arriba', n && s / n > r.height * 0.5);
    }
    ubicarHoja();
    if (foco || nueva) setTimeout(() => { try { document.getElementById('cknp-texto').focus({ preventScroll: true }); } catch (e) {} }, 30);
  };
  const ubicarHoja = () => {
    const u = ui; if (!u) return;
    const h = u.ov.querySelector('.hoja'), b = u.ov.querySelector('.barra');
    h.style.top = h.classList.contains('arriba') ? (b.offsetTop + b.offsetHeight + 6) + 'px' : '';
  };
  const abrir = () => {
    const S = escena();
    if (!S || !S.gameStarted || M.abierto || !S.player) return;
    if (!SIEMPRE && !enPractica(S)) return;
    const u = armar();
    M.S = S; M.trazos = []; M.actual = null; M.abierto = true;
    const r = M.rect = S.game.canvas.getBoundingClientRect();
    Object.assign(u.ov.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const k = window.devicePixelRatio || 1;
    u.cv.width = Math.round(r.width * k); u.cv.height = Math.round(r.height * k); u.cv.style.width = r.width + 'px'; u.cv.style.height = r.height + 'px';
    document.getElementById('cknp-texto').value = '';
    M.hojaMovida = false; const hj = u.ov.querySelector('.hoja'); hj.classList.add('oculta'); hj.classList.remove('arriba');
    document.getElementById('cknp-ayuda').textContent = `${nombreMapa(zonaDe(S))}: dibujá con el mouse (o el dedo) sobre lo que está mal. Podés hacer varios trazos.`;
    u.ov.classList.add('on'); u.lista.classList.remove('on');
    document.body.classList.add('cknp-marcando');   // la interfaz se esconde mientras se marca: se ve el mapa entero
    // el juego se congela (se sigue dibujando, así la foto sale como se ve)
    try { if (!S.scene.isPaused()) { S.scene.pause(); M.pausada = true; } else M.pausada = false; } catch (e) { M.pausada = false; }
    dibujar();
  };
  const cerrar = () => {
    if (!M.abierto) return;
    M.abierto = false; M.trazos = []; M.actual = null;
    if (ui) ui.ov.classList.remove('on');
    document.body.classList.remove('cknp-marcando');
    try { if (M.pausada && M.S) M.S.scene.resume(); } catch (e) {}
    M.pausada = false;
  };
  // de la pantalla (px de la página) al mapa (px del mapa, como en el Taller)
  const alMapa = (S, r, cx, cy) => {
    const c = S.cameras.main, k = S.game.scale.width / r.width, o = origen(S);
    return [Math.round((c.worldView.x + (cx - r.left) * k / c.zoom - o.x) * 10) / 10, Math.round((c.worldView.y + (cy - r.top) * k / c.zoom - o.y) * 10) / 10];
  };
  const foto = S => new Promise(ok => {
    let listo = false; const t = setTimeout(() => { if (!listo) { listo = true; ok(null); } }, 1500);
    try { S.game.renderer.snapshot(img => { if (listo) return; listo = true; clearTimeout(t); ok(img); }, 'image/png'); } catch (e) { clearTimeout(t); ok(null); }
  });
  const recortes = (img, r, trazos) => {
    if (!img || !img.width) return { foto: null, vista: null };
    const kx = img.width / r.width, ky = img.height / r.height;
    const pinta = (g, ox, oy, esc) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      trazos.forEach(t => {
        g.beginPath(); t.pts.forEach(([x, y], i) => { const px = ((x - r.left) * kx - ox) * esc, py = ((y - r.top) * ky - oy) * esc; i ? g.lineTo(px, py) : g.moveTo(px, py); });
        if (t.pts.length === 1) g.lineTo(((t.pts[0][0] - r.left) * kx - ox) * esc + 0.1, ((t.pts[0][1] - r.top) * ky - oy) * esc);
        g.strokeStyle = '#000b'; g.lineWidth = 5; g.stroke(); g.strokeStyle = t.color; g.lineWidth = 3; g.stroke();
      });
    };
    // la vista entera, chica
    const vw = Math.min(480, img.width), ve = vw / img.width, cvv = document.createElement('canvas');
    cvv.width = vw; cvv.height = Math.round(img.height * ve);
    const gv = cvv.getContext('2d'); gv.imageSmoothingEnabled = false; gv.drawImage(img, 0, 0, cvv.width, cvv.height); pinta(gv, 0, 0, ve);
    const vista = cvv.toDataURL('image/jpeg', 0.82);
    if (!trazos.length) return { foto: vista, vista };
    // el recorte de lo marcado, con aire alrededor
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    trazos.forEach(t => t.pts.forEach(([x, y]) => { const px = (x - r.left) * kx, py = (y - r.top) * ky; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }));
    const aire = 70 * kx; x0 -= aire; y0 -= aire; x1 += aire; y1 += aire;
    const minW = 260 * kx, minH = 180 * ky;
    if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
    if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(img.width, Math.ceil(x1)); y1 = Math.min(img.height, Math.ceil(y1));
    const w = x1 - x0, h = y1 - y0, e = Math.min(2, 720 / w), cf = document.createElement('canvas');
    cf.width = Math.round(w * e); cf.height = Math.round(h * e);
    const gf = cf.getContext('2d'); gf.imageSmoothingEnabled = false; gf.drawImage(img, x0, y0, w, h, 0, 0, cf.width, cf.height); pinta(gf, x0, y0, e);
    return { foto: cf.toDataURL('image/jpeg', 0.88), vista };
  };
  const guardar = async () => {
    const S = M.S, r = M.rect; if (!S || !r) return;
    const texto = (document.getElementById('cknp-texto').value || '').trim();
    if (!M.trazos.length && !texto) { aviso('Marcá algo o escribí la nota'); return; }
    const b = document.getElementById('cknp-guardar'); b.disabled = true; b.textContent = 'Guardando…';
    const zona = zonaDe(S), o = origen(S), d = new Date(), trazosPant = M.trazos.map(t => ({ color: t.color, pts: t.pts.slice() }));
    const trazos = trazosPant.map(t => ({ color: t.color, puntos: t.pts.map(([x, y]) => alMapa(S, r, x, y)) }));
    const todos = [].concat(...trazos.map(t => t.puntos));
    const caja = todos.length ? [Math.min(...todos.map(p => p[0])), Math.min(...todos.map(p => p[1])), Math.max(...todos.map(p => p[0])), Math.max(...todos.map(p => p[1]))].map(Math.round) : null;
    const pl = S.player, pb = pl.body;
    let fase = null; try { fase = S.dayPhase ? Math.round(S.dayPhase() * 100) / 100 : null; } catch (e) {}
    const st = S.story || {};
    const img = await foto(S), fotos = recortes(img, r, trazosPant);
    const n = {
      id: d.getTime().toString(36) + Math.random().toString(36).slice(2, 6), creado: d.getTime(), fecha: d.toLocaleString('es-AR'), sello: sello(d),
      mapa: mapaDe(zona), zona, nombre: nombreMapa(zona), tipo: M.tipo, tipoNombre: (TIPOS.find(t => t[0] === M.tipo) || [])[1], texto,
      trazos, caja, coords: 'píxeles del mapa (origen arriba a la izquierda, como en el Taller)',
      heroe: { x: Math.round((pb ? pb.center.x : pl.x) - o.x), y: Math.round((pb ? pb.bottom : pl.y) - o.y), escala: Math.round(pl.scaleX * 100) / 100, cual: S.playerHero || null },
      camara: { zoom: Math.round(S.cameras.main.zoom * 100) / 100, x: Math.round(S.cameras.main.worldView.x - o.x), y: Math.round(S.cameras.main.worldView.y - o.y), w: Math.round(S.cameras.main.worldView.width), h: Math.round(S.cameras.main.worldView.height) },
      practica: enPractica(S), capitulo: st.chapter !== undefined ? st.chapter : null, paso: st.step !== undefined ? st.step : null, horaDelJuego: fase,
      pantalla: [Math.round(r.width), Math.round(r.height)], version: 1, foto: fotos.foto, vista: fotos.vista
    };
    await poner(n);
    const enC = await enCarpeta(n);
    b.textContent = 'Guardar nota';
    cerrar();
    await refrescar();
    const aca = cache.filter(x => x.zona === zona).length;
    aviso(`Nota guardada (${aca} en ${n.nombre})${enC ? ' · también en la carpeta' : ''}`);
  };

  // ------------------------------------------------------------------ los trazos de las notas, sobre el mapa
  let verTrazos = true, gTrazos = null, zonaTrazos = null, numTrazos = [];
  const pintarTrazos = (forzar) => {
    const S = escena(); if (!S || !S.add || !S.gameStarted) return;
    const zona = zonaDe(S);
    if (!forzar && zona === zonaTrazos && gTrazos && gTrazos.active) return;
    zonaTrazos = zona;
    if (!gTrazos || !gTrazos.active || gTrazos.scene !== S) { try { if (gTrazos) gTrazos.destroy(); } catch (e) {} gTrazos = S.add.graphics().setDepth(29000); }
    numTrazos.forEach(t => { try { t.destroy(); } catch (e) {} }); numTrazos = [];
    gTrazos.clear();
    if (!verTrazos) return;
    const o = origen(S), aca = cache.filter(n => n.zona === zona).slice().reverse();
    aca.forEach((n, i) => {
      (n.trazos || []).forEach(t => {
        const c = Phaser.Display.Color.HexStringToColor(t.color || '#ff3b30').color;
        gTrazos.lineStyle(3, 0x000000, 0.45); gTrazos.beginPath(); t.puntos.forEach(([x, y], j) => (j ? gTrazos.lineTo(o.x + x, o.y + y) : gTrazos.moveTo(o.x + x, o.y + y))); gTrazos.strokePath();
        gTrazos.lineStyle(1.6, c, 0.85); gTrazos.beginPath(); t.puntos.forEach(([x, y], j) => (j ? gTrazos.lineTo(o.x + x, o.y + y) : gTrazos.moveTo(o.x + x, o.y + y))); gTrazos.strokePath();
      });
      if (n.caja) {
        try {
          const tx = S.add.text(o.x + n.caja[0], o.y + n.caja[1] - 4, String(i + 1), { fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'bold', color: '#fde68a', stroke: '#1c140e', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(29001);
          numTrazos.push(tx);
        } catch (e) {}
      }
    });
  };

  // ------------------------------------------------------------------ la lista
  const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let confirmarTodas = 0;
  const pintarLista = async () => {
    const u = armar(); if (!u.lista.classList.contains('on')) return;
    const v = cache, h = await ajuste('carpeta');
    const grupos = {};
    v.forEach(n => { (grupos[n.zona] = grupos[n.zona] || []).push(n); });
    let html = `<span class="x" data-a="cerrar">✕</span><h3>NOTAS PARA CORREGIR · ${v.length}</h3>`;
    if (!v.length) html += '<div class="vacio">Todavía no hay notas. Apretá N (o ✎ NOTA) y marcá lo que esté mal.</div>';
    Object.keys(grupos).forEach(z => {
      const L = grupos[z];
      html += `<h3>${esc(L[0].nombre)} · ${L.length}</h3>`;
      L.slice().reverse().forEach((n, i) => {
        html += `<div class="n"><img src="${n.foto || n.vista || ''}" alt="" data-g="${n.id}"><div><div class="t">${i + 1}. ${esc(n.tipoNombre || n.tipo)}</div>
<div class="tx">${esc(n.texto) || '<i>(sin texto)</i>'}</div><div class="f">${esc(n.fecha)}</div>
<button data-ir="${n.id}">Ir</button><button class="sec" data-borrar="${n.id}">Borrar</button></div></div>`;
      });
    });
    html += `<h3>GUARDAR</h3><div class="f">${h ? 'Carpeta: ' + esc(h.name) + ' (cada nota nueva se escribe ahí)' : hayCarpetas() ? 'Elegí una carpeta (por ejemplo D:\\Editor\\trabajo\\_notas_prueba) y cada nota nueva se escribe ahí.' : 'Este navegador no deja elegir carpetas: usá Exportar todo.'}</div>
<button data-a="carpeta">${h ? 'Cambiar carpeta' : 'Carpeta…'}</button><button data-a="exportar">Exportar todo</button>
<button class="sec" data-a="ocultar">${verTrazos ? 'Ocultar trazos' : 'Mostrar trazos'}</button>${v.length ? `<button class="sec" data-a="borrarTodas">${confirmarTodas ? '¿Seguro? Tocá de nuevo' : 'Borrar todas'}</button>` : ''}`;
    u.lista.innerHTML = html;
  };
  const alternarLista = () => {
    const u = armar(); u.lista.classList.toggle('on'); confirmarTodas = 0;
    if (u.lista.classList.contains('on')) refrescar().then(pintarLista);
  };
  const irA = n => {
    const S = escena(); if (!S) return;
    const id = idPractica(n.zona);
    const ubicar = () => { try { const o = origen(S); if (S.player && S.player.body) S.player.body.reset(o.x + n.heroe.x, o.y + n.heroe.y - S.player.body.height); } catch (e) {} };
    if (zonaDe(S) === n.zona) { ubicar(); return; }
    if (!window.CK_PANEL_PRUEBAS || !id || !enPractica(S)) { aviso('Para ir a otro mapa abrí el modo práctica'); return; }
    CK_PANEL_PRUEBAS.irMapa(S, id);
    const t0 = Date.now(), espera = () => {
      if (zonaDe(S) === n.zona && !S._doorTransition) { setTimeout(ubicar, 400); return; }
      if (Date.now() - t0 < 15000) setTimeout(espera, 250);
    };
    espera();
  };
  const clicLista = async e => {
    const el = e.target; const u = armar();
    if (el.dataset.g) { const n = cache.find(x => x.id === el.dataset.g); if (n) { u.gr.querySelector('img').src = n.foto || n.vista; u.gr.classList.add('on'); } return; }
    if (el.dataset.ir) { const n = cache.find(x => x.id === el.dataset.ir); if (n) irA(n); return; }
    if (el.dataset.borrar) { await sacar(el.dataset.borrar); await refrescar(); pintarLista(); return; }
    const a = el.dataset.a;
    if (a === 'cerrar') u.lista.classList.remove('on');
    else if (a === 'carpeta') elegirCarpeta();
    else if (a === 'exportar') exportar();
    else if (a === 'ocultar') { verTrazos = !verTrazos; pintarTrazos(true); pintarLista(); }
    else if (a === 'borrarTodas') {
      if (!confirmarTodas) { confirmarTodas = 1; pintarLista(); setTimeout(() => { confirmarTodas = 0; pintarLista(); }, 4000); return; }
      confirmarTodas = 0; for (const n of cache) await sacar(n.id); await refrescar(); pintarLista(); aviso('Se borraron todas las notas del navegador');
    }
  };

  // ------------------------------------------------------------------ botones, tecla y cada cuadro
  const pintarBotones = () => {
    const S = escena(); if (!ui) return;
    ui.bot.classList.toggle('on', !!(S && S.gameStarted && enPractica(S)));
    const l = ui.bot.querySelector('[data-a="lista"]'); if (l) l.textContent = 'NOTAS · ' + cache.length;
  };
  window.addEventListener('keydown', e => {
    if (e.repeat || M.abierto) return;
    const t = e.target, escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (escribiendo || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'n' || e.key === 'N') { const S = escena(); if (S && S.gameStarted && !S.isGamePaused && (SIEMPRE || enPractica(S))) { e.preventDefault(); abrir(); } }
  });
  // mientras se marca, las teclas no le llegan al juego (lo que se escribe en la nota: W, A, S, D, J, K, M, T, Esc…);
  // se cortan antes que nadie (fase de captura) y Esc cancela. Las teclas que se sueltan sí pasan (así no queda una trabada)
  window.addEventListener('keydown', e => {
    if (!M.abierto) return;
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    e.stopPropagation();
  }, true);
  window.addEventListener('resize', () => { if (M.abierto) cerrar(); });
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      this._ckNpT = (this._ckNpT || 0) + 1;
      if (this._ckNpT % 20 === 0) {
        if (!ui && this.gameStarted) { armar(); refrescar(); }
        pintarBotones();
        if (cache.length || gTrazos) pintarTrazos(false);
      }
    } catch (e) {}
    return r;
  };
  window.CK_NOTAS = { abrir, cerrar, lista: alternarLista, todas, exportar, elegirCarpeta, TIPOS, SIEMPRE };
})();
