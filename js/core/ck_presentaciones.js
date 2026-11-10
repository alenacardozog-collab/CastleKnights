'use strict';
/* Presentaciones de personajes (10/11, pedido del dueño: "que las presentaciones de los personajes, cuando aparezcan por
   primera vez, sean esos motion donde sale una foto del personaje con una tipografía acorde a su personalidad, con un
   sonido acorde… por encima del juego y que no tape todo: un rayo con degradés para el rey, una letra brusca para el
   orco…"; "solo los principales de la historia, enemigos y aliados").
   La primera vez que habla (o que aparece, si es un jefe) uno de los 12 principales, entra una franja diagonal sobre el
   juego —tipo las presentaciones de Borderlands o Sekiro— con su retrato en pose (ck_presentaciones_arte.js), el nombre
   letra por letra en su tipografía pixel (Real, Orco, Hueso o Guardia), su título y su sonido (ElevenLabs,
   assets/audio/sfx/ck_pres_<id>.mp3). Cada uno tiene su efecto:
   - Rey Aldric: rayos con degradé dorado-celeste y fogonazo.        - Bruno: sello de acero con chispas.
   - Eloy: runas arcanas que suben.  - Elia: destellos.  - Mira: luciérnagas del farol.
   - Orcos (Gorak, Grushak, Gorvak, Kragmor, Ulrak): letras que caen de golpe, franja rota, temblor y polvo.
   - No muertos (Nigromante, Gran Esqueleto): niebla verde y violeta, letras que chorrean.
   Dura ~3 s, el juego queda en pausa mientras tanto y se saltea con T, Enter, Espacio, Esc o un clic. Los aliados
   entran por la izquierda; los enemigos por la derecha, mirando al héroe. Se guarda en story.flags.presentados.
   Borrar su línea de index.html (y la de _arte) saca las presentaciones; el juego queda como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype, A = window.CK_PRES_ARTE;
  if (!A) return;

  // ------------------------------------------------------------------ elenco
  // colores del nombre: [arriba, medio, abajo]; banda: [oscuro, claro]
  const ELENCO = [
    { id: 'rey', nombre: 'ALDRIC', etiqueta: 'Su Majestad', titulo: 'Rey del Roble', lado: 'aliado', fuente: 'real', tema: 'rayo',
      dialogo: /^Rey Aldric|^El Rey\b/, colores: ['#fffbd6', '#ffd23f', '#3d8bff'], contorno: '#140c33', banda: ['#0e0b2e', '#2c2370'], acento: '#ffd23f', resp: 'thunder_epic' },
    { id: 'bruno', nombre: 'BRUNO', etiqueta: 'Aliado', titulo: 'Capitán de la Guardia', lado: 'aliado', fuente: 'guardia', tema: 'acero',
      dialogo: /Bruno/, colores: ['#ffffff', '#c9d4e3', '#5d7391'], contorno: '#0b111c', banda: ['#0f1624', '#2b3b58'], acento: '#e0413a', resp: 'sword_hit' },
    { id: 'eloy', nombre: 'ELOY', etiqueta: 'Aliado', titulo: 'Maestre de la Biblioteca', lado: 'aliado', fuente: 'real', tema: 'arcano',
      dialogo: /Eloy/, colores: ['#f6efff', '#b78cff', '#4660ff'], contorno: '#140a2a', banda: ['#120b2a', '#30205e'], acento: '#a98bff', resp: 'level_up' },
    { id: 'elia', nombre: 'ELIA', etiqueta: 'Aliada', titulo: 'Princesa del Roble', lado: 'aliado', fuente: 'real', tema: 'brillo',
      dialogo: /^Princesa Elia|^Elia\b/, colores: ['#fff2f8', '#ff9cc8', '#d9962e'], contorno: '#2a0b1e', banda: ['#2a0d24', '#6b2453'], acento: '#ffc0dc', resp: 'quest_done' },
    { id: 'mira', nombre: 'MIRA', etiqueta: 'Aliada', titulo: 'Hija del mercader', lado: 'aliado', fuente: 'real', tema: 'farol',
      dialogo: /^Mira\b/, colores: ['#fffbe8', '#ffd27a', '#35b3a5'], contorno: '#0c1f24', banda: ['#0c2229', '#1f5059'], acento: '#ffd27a', resp: 'quest_done' },
    { id: 'gorak', nombre: 'GORAK', etiqueta: 'Aliado inesperado', titulo: 'El Desterrado', lado: 'aliado', fuente: 'orco', tema: 'golpe',
      dialogo: /^Gorak/, colores: ['#eaffd2', '#94d64f', '#3a7426'], contorno: '#0f1a08', banda: ['#16200d', '#3c4f1e'], acento: '#b5e86a', resp: 'orc_attack' },
    { id: 'grushak', nombre: 'GRUSHAK', etiqueta: 'Jefe', titulo: 'Caudillo de los clanes', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
      dialogo: /^Grushak/, tipos: ['orc_warlord'], colores: ['#ffe58f', '#ff5a1f', '#8c0d0d'], contorno: '#1a0503', banda: ['#1f0606', '#5e1010'], acento: '#ff5a1f', resp: 'orc_attack' },
    { id: 'gorvak', nombre: 'GORVAK', etiqueta: 'Jefe', titulo: 'Campeón del Coliseo', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
      tipos: ['orc_campeon'], colores: ['#fff2c4', '#f2a92e', '#a3360f'], contorno: '#1c0b03', banda: ['#221005', '#5e2c0c'], acento: '#f2a92e', resp: 'orc_attack' },
    { id: 'kragmor', nombre: 'KRAGMOR', etiqueta: 'Jefe', titulo: 'La Bestia de las Fosas', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
      tipos: ['bestia_kragmor'], colores: ['#ffdcb4', '#cc6a2f', '#4d1d0b'], contorno: '#140602', banda: ['#1a0905', '#4c1d0f'], acento: '#e0763a', resp: 'beast_growl' },
    { id: 'ulrak', nombre: 'ULRAK', etiqueta: 'Jefe', titulo: 'y Colmillo, cazadores de huargos', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
      tipos: ['cazador_ulrak'], colores: ['#eef8ff', '#96bfd0', '#3a5566'], contorno: '#081016', banda: ['#0b141b', '#25404f'], acento: '#9fd3e6', resp: 'beast_growl' },
    { id: 'nigro', nombre: 'EL NIGROMANTE', etiqueta: 'Jefe', titulo: 'Señor de la Niebla', lado: 'enemigo', fuente: 'hueso', tema: 'niebla',
      tipos: ['necromancer'], colores: ['#ecffd8', '#7dff6a', '#7b2cc2'], contorno: '#0c0414', banda: ['#0a0612', '#2a1442'], acento: '#7dff6a', resp: 'necro_cast' },
    { id: 'esqueleto', nombre: 'GRAN ESQUELETO', etiqueta: 'Jefe', titulo: 'Guardián del Cementerio', lado: 'enemigo', fuente: 'hueso', tema: 'niebla',
      tipos: ['skeleton_great'], colores: ['#ffffff', '#ddd5b8', '#4fc463'], contorno: '#0a0d07', banda: ['#0a0d0a', '#1f3322'], acento: '#b8ffb0', resp: 'bone_hit' }
  ];
  const POR_ID = {}, POR_TIPO = {};
  ELENCO.forEach(c => { POR_ID[c.id] = c; (c.tipos || []).forEach(t => { POR_TIPO[t] = c; }); });
  const LETRA = { rayo: "'CK Grenze', 'Pirata One', MedievalSharp, serif", acero: "AntiquityPrint, MedievalSharp, serif", arcano: "'CK Grenze', MedievalSharp, serif",
    brillo: "'CK Grenze', MedievalSharp, serif", farol: "'CK Grenze', MedievalSharp, serif", golpe: "'Pirata One', MedievalSharp, serif", niebla: "'Pirata One', MedievalSharp, serif" };
  const DURA = { niebla: 3500, golpe: 3100 }, DURA_BASE = 3200, SALIDA = 380;
  // en las pruebas (pruebas.html) no salen solas: las pruebas apuran los diálogos y la tarjeta los frenaría
  const PRUEBAS = /[?&]pruebas=1/.test(location.search);

  // ------------------------------------------------------------------ fuentes bitmap
  const fuentes = {};
  const fuente = k => {
    if (fuentes[k]) return fuentes[k];
    const im = new Image(); im.src = A.fuentes[k].img;
    return (fuentes[k] = { im, anchos: A.fuentes[k].anchos });
  };
  Object.keys(A.fuentes).forEach(fuente);
  /** Un glifo coloreado (degradé de 3 tonos, contorno y sombra) en un canvas de 1:1. */
  const glifo = (k, ch, cols, contorno) => {
    const F = fuente(k), i = A.orden.indexOf(ch);
    if (i < 0 || !F.im.complete) return null;
    const [x0, x1] = F.anchos[i], gw = x1 - x0, C = A.celda, cw = gw + 4, chh = C + 4;
    const m = document.createElement('canvas'); m.width = cw; m.height = chh;
    const mc = m.getContext('2d');
    mc.drawImage(F.im, (i % A.cols) * C + x0, Math.floor(i / A.cols) * C, gw, C, 2, 1, gw, C);
    // relleno con degradé
    const rel = document.createElement('canvas'); rel.width = cw; rel.height = chh;
    const rc = rel.getContext('2d'); rc.drawImage(m, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    const g = rc.createLinearGradient(0, 4, 0, 30);
    g.addColorStop(0, cols[0]); g.addColorStop(0.45, cols[1]); g.addColorStop(1, cols[2]);
    rc.fillStyle = g; rc.fillRect(0, 0, cw, chh);
    // brillo de una fila arriba de cada trazo
    rc.globalCompositeOperation = 'source-atop'; rc.globalAlpha = 0.35; rc.fillStyle = '#ffffff'; rc.fillRect(0, 0, cw, 9); rc.globalAlpha = 1;
    // contorno + sombra
    const sil = document.createElement('canvas'); sil.width = cw; sil.height = chh;
    const sc = sil.getContext('2d'); sc.drawImage(m, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = contorno; sc.fillRect(0, 0, cw, chh);
    const out = document.createElement('canvas'); out.width = cw; out.height = chh;
    const oc = out.getContext('2d');
    oc.globalAlpha = 0.55; oc.drawImage(sil, 2, 2); oc.globalAlpha = 1;
    [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => oc.drawImage(sil, dx, dy));
    oc.drawImage(rel, 0, 0);
    return out;
  };
  /** El nombre como fila de letras (cada una su canvas, para animarlas por separado). */
  const nombreEn = (cont, k, txt, cols, contorno, esc) => {
    const letras = [];
    for (const ch of txt) {
      if (ch === ' ') { const s = document.createElement('span'); s.style.width = (9 * esc) + 'px'; s.style.display = 'inline-block'; cont.appendChild(s); continue; }
      const c = glifo(k, ch, cols, contorno); if (!c) continue;
      c.className = 'ckp-l'; c.style.width = (c.width * esc) + 'px'; c.style.height = (c.height * esc) + 'px'; c.style.marginRight = (-3 * esc + esc) + 'px';
      cont.appendChild(c); letras.push(c);
    }
    return letras;
  };
  const anchoNombre = (k, txt) => {
    const F = fuente(k); let w = 0;
    for (const ch of txt) { if (ch === ' ') { w += 9; continue; } const i = A.orden.indexOf(ch); if (i >= 0) w += F.anchos[i][1] - F.anchos[i][0] + 2; }
    return w + 4;
  };
  /** Para otros módulos (las barras de jefe): el nombre en su tipografía, en un contenedor. */
  const pintarNombre = (cont, id, txt, esc) => {
    const c = POR_ID[id] || null, k = c ? c.fuente : 'orco';
    return nombreEn(cont, k, (txt || (c && c.nombre) || '').toUpperCase().replace(/[ÁÀ]/g, 'A').replace(/[ÉÈ]/g, 'E').replace(/[ÍÌ]/g, 'I').replace(/[ÓÒ]/g, 'O').replace(/[ÚÙÜ]/g, 'U').replace(/Ñ/g, 'N').replace(/[^A-Z ]/g, ''),
      c ? c.colores : ['#ffe2c4', '#e0483a', '#5a0c0c'], c ? c.contorno : '#120404', esc || 2);
  };

  // ------------------------------------------------------------------ estilos
  let cssOk = false;
  const css = () => {
    if (cssOk) return; cssOk = true;
    const st = document.createElement('style'); st.id = 'ckp-css';
    st.textContent = `
#ckp { position: fixed; z-index: 8600; pointer-events: none; overflow: hidden; }
#ckp * { box-sizing: border-box; }
#ckp .ckp-flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
#ckp .ckp-velo { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,.55) 100%); opacity: 0; transition: opacity .25s; }
#ckp.on .ckp-velo { opacity: 1; }
#ckp .ckp-banda { position: absolute; left: -4%; width: 108%; transform: translateX(var(--entra)); transition: transform .32s cubic-bezier(.2,.9,.25,1); overflow: hidden; }
#ckp.on .ckp-banda { transform: translateX(0); }
#ckp.sale .ckp-banda { transform: translateX(var(--sale)); transition: transform .36s cubic-bezier(.6,0,.9,.4); }
#ckp .ckp-banda::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(105deg, transparent 0 46px, rgba(255,255,255,.05) 46px 52px, transparent 52px 120px); background-size: 400px 100%; animation: ckpVeloc 0.9s linear infinite; }
#ckp .ckp-banda::after { content: ''; position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: linear-gradient(180deg, rgba(255,255,255,.10), transparent 22%, transparent 78%, rgba(0,0,0,.35)); }
#ckp.izq .ckp-banda::before { animation-direction: reverse; }
@keyframes ckpVeloc { from { background-position: 0 0; } to { background-position: 400px 0; } }
#ckp .ckp-tira { position: absolute; left: -4%; width: 108%; height: 4px; transform: translateX(var(--entra)); transition: transform .4s .05s cubic-bezier(.2,.9,.25,1); }
#ckp.on .ckp-tira { transform: translateX(0); }
#ckp.sale .ckp-tira { transform: translateX(var(--sale)); transition: transform .3s cubic-bezier(.6,0,.9,.4); }
#ckp .ckp-sombra, #ckp .ckp-retrato { position: absolute; image-rendering: pixelated; opacity: 0; }
#ckp .ckp-retrato { filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
#ckp.on .ckp-retrato { animation: ckpRetrato .5s .1s cubic-bezier(.2,1.5,.4,1) forwards, ckpRespira 2.4s .6s ease-in-out infinite; }
#ckp.on .ckp-sombra { animation: ckpSombra .55s .04s ease-out forwards; }
#ckp.sale .ckp-retrato { animation: ckpRetratoSale .3s ease-in forwards; }
#ckp.sale .ckp-sombra { opacity: 0; animation: none; }
@keyframes ckpRetrato { 0% { opacity: 0; transform: translateX(var(--desde)) scaleX(var(--mira)); } 60% { opacity: 1; } 100% { opacity: 1; transform: translateX(0) scaleX(var(--mira)); } }
@keyframes ckpRespira { 0%, 100% { transform: translateY(0) scaleX(var(--mira)); } 50% { transform: translateY(-2%) scaleX(var(--mira)); } }
@keyframes ckpSombra { 0% { opacity: 0; transform: translateX(var(--desde)) scaleX(var(--mira)); } 30% { opacity: .9; } 100% { opacity: 0; transform: translateX(calc(var(--desde) * -0.35)) scaleX(var(--mira)); } }
@keyframes ckpRetratoSale { from { opacity: 1; transform: translateX(0) scaleX(var(--mira)); } to { opacity: 0; transform: translateX(var(--sale)) scaleX(var(--mira)); } }
#ckp .ckp-texto { position: absolute; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
#ckp.der .ckp-texto { align-items: flex-end; text-align: right; }
#ckp .ckp-etq { font: 600 var(--etq) MedievalSharp, serif; letter-spacing: .32em; text-transform: uppercase; color: var(--acento); opacity: 0; display: flex; align-items: center; gap: .6em; text-shadow: 0 2px 0 #000; }
#ckp .ckp-etq::before, #ckp .ckp-etq::after { content: ''; width: 2.2em; height: 2px; background: var(--acento); box-shadow: 0 2px 0 #000; }
#ckp.on .ckp-etq { animation: ckpAparece .3s .25s ease-out forwards; }
#ckp .ckp-nombre { display: flex; align-items: flex-end; flex-wrap: nowrap; }
#ckp .ckp-l { image-rendering: pixelated; opacity: 0; display: block; }
#ckp .ckp-tit { font: var(--tit) var(--letra); color: #fff; opacity: 0; text-shadow: 0 2px 0 #000, 0 0 10px var(--acento); letter-spacing: .03em; }
#ckp.on .ckp-tit { animation: ckpTitulo .45s var(--tdel) ease-out forwards; }
#ckp.sale .ckp-texto { opacity: 0; transform: translateX(var(--sale)); transition: opacity .25s, transform .35s cubic-bezier(.6,0,.9,.4); }
@keyframes ckpAparece { from { opacity: 0; } to { opacity: 1; } }
@keyframes ckpTitulo { from { opacity: 0; transform: translateY(40%); } to { opacity: 1; transform: none; } }
#ckp canvas.ckp-fx { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#ckp .ckp-saltar { position: absolute; font: 11px Pixuf, MedievalSharp, monospace; color: rgba(255,255,255,.55); letter-spacing: .1em; opacity: 0; transition: opacity .3s .8s; text-shadow: 0 1px 0 #000; }
#ckp.on .ckp-saltar { opacity: 1; }
/* letras por tema */
#ckp.t-rayo.on .ckp-l { animation: ckpRayoL .42s cubic-bezier(.2,1.3,.4,1) forwards; }
@keyframes ckpRayoL { 0% { opacity: 0; transform: translateY(-70%) scaleY(1.6); filter: brightness(4); } 55% { opacity: 1; filter: brightness(2.2) drop-shadow(0 0 6px #9fd0ff); } 100% { opacity: 1; transform: none; filter: drop-shadow(0 0 4px rgba(255,210,63,.65)); } }
#ckp.t-golpe.on .ckp-l { animation: ckpGolpeL .26s cubic-bezier(.5,0,.75,0) forwards; }
@keyframes ckpGolpeL { 0% { opacity: 0; transform: scale(3.2) rotate(var(--rot0)); } 80% { opacity: 1; transform: scale(.92) rotate(var(--rot)); } 100% { opacity: 1; transform: scale(1) rotate(var(--rot)); } }
#ckp.t-niebla.on .ckp-l { animation: ckpNieblaL .9s ease-out forwards; }
@keyframes ckpNieblaL { 0% { opacity: 0; transform: translateY(-30%); filter: blur(6px) brightness(.4); } 60% { opacity: .8; filter: blur(1px) drop-shadow(0 0 8px #7dff6a); } 100% { opacity: 1; transform: none; filter: drop-shadow(0 0 6px rgba(125,255,106,.55)); } }
#ckp.t-acero.on .ckp-l { animation: ckpAceroL .22s cubic-bezier(.6,0,.8,.3) forwards; }
@keyframes ckpAceroL { 0% { opacity: 0; transform: scale(1.9); filter: brightness(3); } 100% { opacity: 1; transform: none; filter: drop-shadow(0 0 3px rgba(224,65,58,.6)); } }
#ckp.t-arcano.on .ckp-l { animation: ckpArcanoL .6s ease-out forwards; }
@keyframes ckpArcanoL { 0% { opacity: 0; transform: translateY(45%); filter: hue-rotate(90deg) brightness(2.5); } 100% { opacity: 1; transform: none; filter: drop-shadow(0 0 6px rgba(169,139,255,.8)); } }
#ckp.t-brillo.on .ckp-l, #ckp.t-farol.on .ckp-l { animation: ckpBrilloL .5s cubic-bezier(.2,1.6,.4,1) forwards; }
@keyframes ckpBrilloL { 0% { opacity: 0; transform: scale(.3); filter: brightness(3); } 100% { opacity: 1; transform: none; filter: drop-shadow(0 0 5px var(--acento)); } }
#ckp.tiembla .ckp-banda, #ckp.tiembla .ckp-texto { animation: ckpTiembla .18s linear; }
@keyframes ckpTiembla { 0%,100% { translate: 0 0; } 25% { translate: -5px 3px; } 50% { translate: 4px -3px; } 75% { translate: -3px -2px; } }
body.ckp-on #ck-dialog, body.ckp-on #ck-prompt { opacity: 0 !important; transition: none !important; }
`;
    document.head.appendChild(st);
  };

  // ------------------------------------------------------------------ efectos (canvas a 1/3 de resolución: partículas pixeladas)
  const azar = (a, b) => a + Math.random() * (b - a);
  const rayoPuntos = (x0, y0, x1, y1, desv) => {
    let pts = [[x0, y0], [x1, y1]];
    for (let n = 0; n < 5; n++) {
      const nv = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        nv.push([(ax + bx) / 2 + azar(-desv, desv), (ay + by) / 2 + azar(-desv * 0.3, desv * 0.3)], [bx, by]);
      }
      pts = nv; desv *= 0.55;
    }
    return pts;
  };
  const trazo = (cx, pts) => { cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) cx.lineTo(pts[i][0], pts[i][1]); cx.stroke(); };

  let act = null, cola = [];
  /** Algo tapa la pantalla (la pantalla de carga): la presentación espera a que se vaya. */
  const tapado = () => !!document.querySelector('#ck-carga.on');
  const ahora = () => performance.now();

  const animar = () => {
    if (!act) return;
    const a = act, t = ahora() - a.t0, cx = a.cx, W = a.fx.width, H = a.fx.height, c = a.c;
    cx.clearRect(0, 0, W, H);
    // nuevas partículas según el tema
    const b = a.bandaR; // banda en coordenadas del fx
    if (c.tema === 'niebla' && Math.random() < 0.7) a.parts.push({ x: azar(-10, W), y: azar(b.y, b.y + b.h), vx: azar(0.1, 0.5) * (a.der ? -1 : 1), vy: azar(-0.15, 0.05), r: azar(6, 16), vida: 0, max: azar(70, 130), col: Math.random() < 0.6 ? '125,255,106' : '150,70,220', tipo: 'niebla' });
    if (c.tema === 'arcano' && Math.random() < 0.35) a.parts.push({ x: azar(0, W), y: b.y + b.h, vx: 0, vy: azar(-0.6, -0.3), r: 1, vida: 0, max: azar(60, 110), col: Math.random() < 0.5 ? '#b78cff' : '#7fa2ff', tipo: 'runa', f: Math.floor(azar(0, 4)) });
    if (c.tema === 'brillo' && Math.random() < 0.3) a.parts.push({ x: azar(0, W), y: azar(b.y, b.y + b.h), vx: 0, vy: azar(-0.2, 0), r: 1, vida: 0, max: azar(30, 60), col: Math.random() < 0.5 ? '#ffffff' : '#ffc0dc', tipo: 'estrella' });
    if (c.tema === 'farol' && Math.random() < 0.25) a.parts.push({ x: azar(0, W), y: azar(b.y, b.y + b.h), vx: azar(-0.3, 0.3), vy: azar(-0.3, 0.1), r: 1, vida: 0, max: azar(60, 120), col: '#ffd27a', tipo: 'luz' });
    if (c.tema === 'golpe' && Math.random() < 0.25) a.parts.push({ x: azar(0, W), y: b.y + b.h - azar(0, 6), vx: azar(-0.4, 0.4), vy: azar(-0.5, -0.1), r: 1, vida: 0, max: azar(40, 80), col: '#8a6a4a', tipo: 'polvo' });
    // rayos del rey
    if (c.tema === 'rayo') {
      a.rayos.forEach(r => {
        const e = t - r.t; if (e < 0 || e > 330) return;
        if (!r.pts) { r.pts = rayoPuntos(r.x0, r.y0, r.x1, r.y1, 18); r.rama = rayoPuntos(r.pts[12][0], r.pts[12][1], r.pts[12][0] + azar(-40, 40), r.y1 - azar(0, 20), 10); a.flash(); }
        const al = e < 60 ? 1 : 1 - (e - 60) / 270, g = cx.createLinearGradient(r.x0, r.y0, r.x1, r.y1);
        g.addColorStop(0, 'rgba(255,210,63,' + al + ')'); g.addColorStop(0.5, 'rgba(255,255,255,' + al + ')'); g.addColorStop(1, 'rgba(61,139,255,' + al + ')');
        cx.lineCap = 'square';
        cx.strokeStyle = 'rgba(80,140,255,' + al * 0.22 + ')'; cx.lineWidth = r.g * 4; trazo(cx, r.pts);
        cx.strokeStyle = 'rgba(255,210,63,' + al * 0.35 + ')'; cx.lineWidth = r.g * 2; trazo(cx, r.pts);
        cx.strokeStyle = g; cx.lineWidth = r.g; trazo(cx, r.pts); cx.lineWidth = Math.max(1, r.g - 1); trazo(cx, r.rama);
        cx.strokeStyle = 'rgba(255,255,255,' + al + ')'; cx.lineWidth = Math.max(1, r.g / 2 | 0); trazo(cx, r.pts);
      });
    }
    // garras del orco: tres zarpazos al entrar
    if (c.tema === 'golpe' && t < 520) {
      const e = Math.min(1, t / 140), al = t < 260 ? 1 : 1 - (t - 260) / 260;
      cx.strokeStyle = 'rgba(255,60,30,' + al + ')'; cx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x0 = b.x + b.w * (0.32 + i * 0.07), y0 = b.y - 4, x1 = x0 + b.w * 0.16, y1 = b.y + b.h + 4;
        cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); cx.stroke();
      }
    }
    // partículas
    a.parts = a.parts.filter(p => {
      p.vida++; p.x += p.vx; p.y += p.vy; if (p.tipo === 'chispa') p.vy += 0.12;
      const k = p.vida / p.max; if (k >= 1) return false;
      if (p.tipo === 'niebla') {
        const al = Math.sin(k * Math.PI) * 0.22, g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(' + p.col + ',' + al + ')'); g.addColorStop(1, 'rgba(' + p.col + ',0)');
        cx.fillStyle = g; cx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      } else if (p.tipo === 'estrella') {
        const al = Math.sin(k * Math.PI), s = al > 0.6 ? 2 : 1;
        cx.globalAlpha = al; cx.fillStyle = p.col; cx.fillRect(p.x | 0, (p.y | 0) - s, 1, s * 2 + 1); cx.fillRect((p.x | 0) - s, p.y | 0, s * 2 + 1, 1); cx.globalAlpha = 1;
      } else if (p.tipo === 'runa') {
        const al = Math.sin(k * Math.PI); cx.globalAlpha = al; cx.fillStyle = p.col;
        const x = p.x | 0, y = p.y | 0;
        if (p.f === 0) { cx.fillRect(x, y, 1, 4); cx.fillRect(x - 1, y + 1, 3, 1); }
        else if (p.f === 1) { cx.fillRect(x, y, 3, 1); cx.fillRect(x + 1, y, 1, 4); cx.fillRect(x, y + 3, 3, 1); }
        else if (p.f === 2) { cx.fillRect(x, y, 1, 3); cx.fillRect(x + 2, y, 1, 3); cx.fillRect(x, y + 3, 3, 1); }
        else { cx.fillRect(x + 1, y, 1, 1); cx.fillRect(x, y + 1, 3, 1); cx.fillRect(x + 1, y + 2, 1, 2); }
        cx.globalAlpha = 1;
      } else if (p.tipo === 'luz') {
        const al = 0.5 + 0.5 * Math.sin(p.vida * 0.3); cx.globalAlpha = al * Math.sin(k * Math.PI);
        cx.fillStyle = 'rgba(255,210,122,.35)'; cx.fillRect((p.x | 0) - 1, (p.y | 0) - 1, 3, 3); cx.fillStyle = p.col; cx.fillRect(p.x | 0, p.y | 0, 1, 1); cx.globalAlpha = 1;
      } else {
        cx.globalAlpha = 1 - k; cx.fillStyle = p.col; cx.fillRect(p.x | 0, p.y | 0, p.r, p.r); cx.globalAlpha = 1;
      }
      return true;
    });
    a.raf = requestAnimationFrame(animar);
  };

  const chispas = (a, x, y, n, cols) => {
    for (let i = 0; i < n; i++) a.parts.push({ x, y, vx: azar(-1.6, 1.6), vy: azar(-2.2, -0.4), r: Math.random() < 0.3 ? 2 : 1, vida: 0, max: azar(18, 34), col: cols[i % cols.length], tipo: 'chispa' });
  };

  // ------------------------------------------------------------------ la presentación
  const caja = S => {
    try {
      const cv = (S.game && S.game.canvas) || document.querySelector('#game-canvas-container canvas');
      const r = cv.getBoundingClientRect();
      if (r.width > 50 && r.height > 50) return { x: r.left, y: r.top, w: r.width, h: r.height };
    } catch (e) {}
    return { x: 0, y: 0, w: innerWidth, h: innerHeight };
  };
  const sonar = (c) => {
    try {
      if (typeof sfx === 'undefined') return;
      sfx.init && sfx.init();
      const ok = sfx.fx('ck_pres_' + c.id, 0.9);
      if (!ok && c.resp) sfx.fx(c.resp, 0.8);
      if (c.tema === 'rayo') setTimeout(() => { try { sfx.fx('thunder_strike', 0.35); } catch (e) {} }, 260);
    } catch (e) {}
  };

  function mostrar(S, id, listo, espera) {
    const c = POR_ID[id];
    if (!c) { if (listo) listo(); return false; }
    if (act) { cola.push([S, id, listo]); return true; }
    if (tapado() && (espera || 0) < 60) { setTimeout(() => mostrar(S, id, listo, (espera || 0) + 1), 200); return true; }
    css();
    const R = caja(S), der = c.lado === 'enemigo';
    const el = document.createElement('div'); el.id = 'ckp';
    el.className = 't-' + c.tema + (der ? ' der' : ' izq');
    Object.assign(el.style, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px' });
    // medidas
    const H = Math.round(Math.max(120, Math.min(R.h * 0.3, 300))), top = Math.round(R.h * 0.15);
    const k = Math.max(1, Math.round(H * 1.3 / 160)), PW = 160 * k;
    const margen = Math.round(R.w * 0.03), textoX = margen + Math.round(PW * (der ? 0.95 : 0.86)), anchoTxt = Math.max(160, R.w - textoX - margen * 2);
    let esc = Math.max(2, Math.min(4, Math.round(H * 0.3 / 24)));
    while (esc > 1 && anchoNombre(c.fuente, c.nombre) * esc > anchoTxt) esc--;
    el.style.setProperty('--entra', der ? '110%' : '-110%');
    el.style.setProperty('--sale', der ? '-60%' : '60%');
    el.style.setProperty('--desde', der ? '45%' : '-45%');
    el.style.setProperty('--mira', der ? '-1' : '1');
    el.style.setProperty('--acento', c.acento);
    el.style.setProperty('--letra', LETRA[c.tema]);
    el.style.setProperty('--etq', Math.max(10, Math.round(H * 0.075)) + 'px');
    el.style.setProperty('--tit', Math.max(14, Math.round(H * 0.13)) + 'px');
    el.style.setProperty('--tdel', (0.35 + c.nombre.length * (c.tema === 'niebla' ? 0.09 : 0.065)).toFixed(2) + 's');
    // banda
    const banda = document.createElement('div'); banda.className = 'ckp-banda';
    Object.assign(banda.style, { top: top + 'px', height: H + 'px', background: `linear-gradient(${der ? 260 : 100}deg, ${c.banda[1]} 0%, ${c.banda[0]} 55%, ${c.banda[0]}ee 100%)` });
    if (c.tema === 'golpe') {   // bordes rotos
      const pts = []; let x = 0;
      while (x < 100) { pts.push(x.toFixed(1) + '% ' + azar(0, 9).toFixed(1) + '%'); x += azar(1.5, 4); }
      pts.push('100% 4%'); x = 100; const abajo = [];
      while (x > 0) { abajo.push(x.toFixed(1) + '% ' + (100 - azar(0, 9)).toFixed(1) + '%'); x -= azar(1.5, 4); }
      abajo.push('0% 96%');
      banda.style.clipPath = 'polygon(' + pts.concat(abajo).join(',') + ')';
    } else banda.style.clipPath = der ? 'polygon(0 0, 100% 10%, 100% 100%, 0 90%)' : 'polygon(0 10%, 100% 0, 100% 90%, 0 100%)';
    const tira1 = document.createElement('div'), tira2 = document.createElement('div');
    tira1.className = tira2.className = 'ckp-tira';
    tira1.style.top = (top - 7) + 'px'; tira2.style.top = (top + H + 3) + 'px';
    tira1.style.background = tira2.style.background = `linear-gradient(90deg, transparent, ${c.acento} 20%, ${c.acento} 80%, transparent)`;
    if (c.tema === 'golpe') tira1.style.display = tira2.style.display = 'none';
    // retrato (y su estela)
    const img = new Image(); img.src = A.retratos[c.id]; img.className = 'ckp-retrato';
    const somb = new Image(); somb.src = A.retratos[c.id]; somb.className = 'ckp-sombra';
    const py = top + H - PW + Math.round(H * 0.06);
    [img, somb].forEach(m => { Object.assign(m.style, { width: PW + 'px', height: PW + 'px', top: py + 'px' }); m.style[der ? 'right' : 'left'] = margen + 'px'; });
    somb.style.filter = `brightness(0) drop-shadow(0 0 0 ${c.acento}) opacity(.7)`;
    somb.style.background = 'none';
    img.style.filter = `drop-shadow(0 0 ${k * 2}px ${c.acento}88) drop-shadow(0 ${k * 3}px 0 rgba(0,0,0,.45))`;
    // texto
    const txt = document.createElement('div'); txt.className = 'ckp-texto';
    Object.assign(txt.style, { top: top + 'px', height: H + 'px', width: anchoTxt + 'px' });
    txt.style[der ? 'right' : 'left'] = textoX + 'px';
    const etq = document.createElement('div'); etq.className = 'ckp-etq'; etq.textContent = c.etiqueta;
    const nom = document.createElement('div'); nom.className = 'ckp-nombre';
    const letras = nombreEn(nom, c.fuente, c.nombre, c.colores, c.contorno, esc);
    const tit = document.createElement('div'); tit.className = 'ckp-tit'; tit.textContent = c.titulo;
    txt.append(etq, nom, tit);
    const paso = c.tema === 'niebla' ? 90 : c.tema === 'golpe' ? 95 : 65;
    letras.forEach((l, i) => {
      l.style.animationDelay = (0.32 + i * paso / 1000).toFixed(3) + 's';
      if (c.tema === 'golpe') { l.style.setProperty('--rot0', azar(-25, 25).toFixed(0) + 'deg'); l.style.setProperty('--rot', azar(-5, 5).toFixed(1) + 'deg'); }
    });
    const salt = document.createElement('div'); salt.className = 'ckp-saltar'; salt.textContent = 'T · saltar';
    Object.assign(salt.style, { top: (top + H + 10) + 'px' }); salt.style[der ? 'left' : 'right'] = (margen + 6) + 'px';
    // fx
    const fx = document.createElement('canvas'); fx.className = 'ckp-fx';
    const FX = 3; fx.width = Math.ceil(R.w / FX); fx.height = Math.ceil(R.h / FX);
    const velo = document.createElement('div'); velo.className = 'ckp-velo';
    const flash = document.createElement('div'); flash.className = 'ckp-flash';
    el.append(velo, banda, tira1, tira2, somb, fx, img, txt, salt, flash);
    (document.getElementById('game-wrapper') || document.body).appendChild(el);
    document.body.classList.add('ckp-on');

    // pausa del mundo
    const congela = !S.isGamePaused && typeof S.freezeWorld === 'function';
    if (congela) { S.isGamePaused = true; try { if (S.player && S.player.body) S.player.setVelocity(0, 0); S.freezeWorld(true); } catch (e) {} }

    const a = act = {
      S, c, el, fx, cx: fx.getContext('2d'), t0: ahora(), der, parts: [], rayos: [], listo, congela, timers: [],
      bandaR: { x: 0, y: top / FX, w: fx.width, h: H / FX },
      flash: () => { flash.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' }); }
    };
    a.cx.imageSmoothingEnabled = false;
    if (c.tema === 'rayo') {
      const bx = a.bandaR, W = fx.width;
      const centro = (textoX + anchoNombre(c.fuente, c.nombre) * esc / 2) / R.w;   // el rayo grande cae detrás del nombre
      [[140, 0.8, 3], [560, centro, 5], [1150, 0.55, 3], [1750, 0.93, 4], [2350, 0.7, 3]].forEach(([tt, fxx, gr]) => {
        const x = W * (der ? 1 - fxx : fxx);
        a.rayos.push({ t: tt, g: gr, x0: x + azar(-25, 25), y0: 0, x1: x + azar(-35, 35), y1: bx.y + bx.h * (gr > 4 ? 1 : azar(0.6, 1)) });
      });
    }
    const tm = (ms, f) => a.timers.push(setTimeout(() => { if (act === a) f(); }, ms));
    // golpes de cada letra
    letras.forEach((l, i) => {
      const ms = 320 + i * paso + (c.tema === 'golpe' ? 210 : c.tema === 'acero' ? 190 : 0);
      if (c.tema === 'golpe') tm(ms, () => {
        el.classList.remove('tiembla'); void el.offsetWidth; el.classList.add('tiembla');
        const r = l.getBoundingClientRect(); chispas(a, (r.left + r.width / 2 - R.x) / FX, (r.bottom - R.y) / FX, 4, ['#8a6a4a', '#5a4030', c.acento]);
      });
      if (c.tema === 'acero') tm(ms, () => { const r = l.getBoundingClientRect(); chispas(a, (r.left + r.width / 2 - R.x) / FX, (r.top + r.height / 2 - R.y) / FX, 6, ['#fff3b0', '#ffb347', '#ff6a2a']); });
    });
    if (c.tema === 'golpe') tm(160, () => { el.classList.add('tiembla'); });
    sonar(c);
    requestAnimationFrame(() => { el.classList.add('on'); a.raf = requestAnimationFrame(animar); });
    tm(DURA[c.tema] || DURA_BASE, () => cerrar());
    return true;
  }

  function cerrar(inmediato) {
    const a = act; if (!a) return;
    act = null;
    a.timers.forEach(clearTimeout);
    a.el.classList.add('sale');
    const fin = () => {
      cancelAnimationFrame(a.raf);
      a.el.remove();
      if (a.congela) { const S = a.S; try { S.isGamePaused = false; S.freezeWorld(false); } catch (e) {} }
      // el diálogo que esperaba arranca de cero
      try { const d = a.S._dlg; if (d) { d.shown = 0; d.at = performance.now(); a.S.renderDialog && a.S.renderDialog(); } } catch (e) {}
      if (!act && !cola.length) document.body.classList.remove('ckp-on');
      if (a.listo) try { a.listo(); } catch (e) { console.warn('[presentaciones]', e); }
      const sig = cola.shift(); if (sig) mostrar.apply(null, sig);
      else document.body.classList.remove('ckp-on');
    };
    if (inmediato) fin(); else setTimeout(fin, SALIDA);
  }

  // saltear: T / Enter / Espacio / Esc / clic. Mientras está, el teclado no le llega al juego.
  addEventListener('keydown', e => {
    if (!act) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (ahora() - act.t0 > 450 && /^(t|T|Enter|Escape| |e|E)$/.test(e.key)) cerrar();
  }, true);
  addEventListener('pointerdown', e => {
    if (!act) return;
    e.stopImmediatePropagation();
    if (ahora() - act.t0 > 450) cerrar();
  }, true);

  // ------------------------------------------------------------------ quién ya se presentó
  const vistos = S => {
    const st = S.story;
    if (st) { st.flags = st.flags || {}; return (st.flags.presentados = st.flags.presentados || {}); }
    return (S._ckpVistos = S._ckpVistos || {});
  };
  const enCampania = S => S._gameMode === 'campaign' && !PRUEBAS;

  // primera vez que habla
  const od0 = P.openDialog;
  P.openDialog = function (name) {
    const r = od0.apply(this, arguments);
    try {
      if (enCampania(this) && typeof name === 'string') {
        const c = ELENCO.find(e => e.dialogo && e.dialogo.test(name.trim()));
        const v = c && vistos(this);
        if (c && !v[c.id]) { v[c.id] = 1; mostrar(this, c.id); }
      }
    } catch (e) { console.warn('[presentaciones]', e); }
    return r;
  };

  // primera vez que un jefe entra en pelea (en pantalla, visible y cerca o persiguiendo)
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      const now = this.time.now;
      if (act || tapado() || this._overlay || !enCampania(this) || (this._ckpMira || 0) > now || this.dialogOpen || this._doorTransition || this._cutscene || this.isGamePaused || !this.enemies || !this.player) return r;
      this._ckpMira = now + 150;
      const v = vistos(this), vista = this.cameras.main.worldView;
      const e = this.enemies.getChildren().find(e => {
        const c = e.active && !e.isDead && POR_TIPO[e.type];
        if (!c || v[c.id] || !e.visible || e.alpha < 0.6) return false;
        if (!Phaser.Geom.Rectangle.Contains(vista, e.x, e.y)) return false;
        return e.state === 'chase' || Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 240;
      });
      if (e) { const c = POR_TIPO[e.type]; v[c.id] = 1; mostrar(this, c.id); }
    } catch (er) { console.warn('[presentaciones]', er); }
    return r;
  };

  window.CK_PRESENTACIONES = {
    ELENCO, POR_ID, POR_TIPO, mostrar, tapado, cerrar: () => cerrar(true), pintarNombre, anchoNombre, activa: () => !!act,
    olvidar: S => { const v = vistos(S); Object.keys(v).forEach(k => delete v[k]); }
  };
})();
