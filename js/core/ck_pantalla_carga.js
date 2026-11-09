'use strict';
/* Pantallas de carga breves (08/11, pedido del dueño: "añade pantallas de carga para las zonas necesarias que sean breves").
   Sólo al pasar a un mapa grande de afuera (los del Taller de 958x534 o más: camino y patios del castillo, jardín,
   muralla, Brumavieja, la Frontera orca), al volver de ellos a la aldea y al entrar al castillo o a las ruinas de antes.
   Las puertas de casas y salas siguen con el fundido de siempre.
   Dura un poco más de un segundo: tapa el momento en que se arma el mapa, muestra el nombre del lugar, la región y un
   consejo (se alternan uno de cómo jugar y uno del mundo). Mientras está, el héroe no se mueve.
   Con imagen (08/11, segunda tanda): si está cargado ck_pantalla_carga_arte.js (CK_CARGA_ARTE), el fondo es un concepto del lugar a pantalla
   completa y los textos van abajo sobre una franja oscura.
   Con videos (09/11, ck_carga_videos.js): el fondo puede ser un video de Flow pasado a píxel.
   Reglas del dueño (09/11):
   - dura 6 s (con o sin imagen), para que se arme todo el mapa grande detrás.
   - sin pantalla al salir de una sala o interior a su mapa (del Salón del Trono al patio, de la cocina…): sólo entre
     zonas grandes.
   - la primera vez que llegás a una zona sale la suya; ya conocida, sale una al azar de las zonas que descubriste
     (story.flags.carga_vistos). Las de noche, nieve y tormenta salen sólo con ese tiempo.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA || {};
  // ms en pantalla (con imagen, un poco más: que se alcance a ver); un mapa es "grande" desde 300.000 px² (los de 958x534)
  const DURA = 6000, DURA_ARTE = 6000, GRANDE = 300000, MIN_DESPUES = 900;   // 6 s (09/11, pedido del dueño)
  const REGION = [
    [/^(camino_al_castillo|jardin_real|patio_de_armas|patio_del_castillo|muralla|patio_armas_nuevo)$/, 'El Castillo'],
    [/^aldea_en_ruinas$/, 'Brumavieja'],
    [/^(bosque_de_la_frontera|tierras_orcas|pueblo_orco|fortaleza_orca)$/, 'La Frontera Orca']
  ];
  // dos clases de consejo: COMO (cómo se juega) y TIPS (cosas del mundo que conviene saber). Se alternan.
  const COMO = [
    'J ataca y K hace el ataque especial. Mantené Shift para correr.',
    'Espacio es el dash: esquiva cualquier golpe, pero gasta la mitad del aguante.',
    'C es la parada: si la clavás justo cuando te pegan, la bestia queda abierta.',
    'Q, E, R y F son tus habilidades. Con H abrís el árbol para aprender más.',
    'Z toma una poción y X un elixir. No esperes al último corazón.',
    'T habla, compra, abre cofres y mira las cosas raras del camino.',
    'M abre el mapa: el camino a la misión se marca en dorado.',
    'TAB abre el diario: la misión, tus mejoras y los cofres que encontraste.',
    'L prende la antorcha. Encendida dura 5 minutos; apagada no se gasta.',
    'La partida se guarda sola. Desde el menú, CONTINUAR te deja donde estabas.'
  ];
  const TIPS = [
    'De noche salen más bestias. Una antorcha te deja ver más lejos.',
    'Con luna llena, los lobos andan más rápidos y más bravos.',
    'Con nieve todos andan más lento… menos lobos y osos.',
    'Con lluvia, los limos se ponen contentos: más rápidos y más duros.',
    'Con tormenta se despiertan los muertos: los esqueletos atacan más seguido.',
    'Los acorazados paran lo que les llega de frente: rompeles la guardia con un golpe pesado o una parada.',
    'El jabalí avisa antes de embestir: correte de la línea y que se dé contra algo.',
    'El arquero esqueleto retrocede si te le acercás: cerrale el paso contra una pared.',
    'Hay 16 cofres escondidos en rincones lejos de las entradas. El diario lleva la cuenta.',
    'Las vasijas y los cajones se rompen: a veces guardan monedas o una poción.',
    'La herrería y la piedra de afilar hacen más filosa tu espada.',
    'La cama del Rey te deja dormir hasta el amanecer y te cura entero.',
    'Con lluvia, la abuela Mirta convida tortas fritas: curan un corazón.',
    'Si los aldeanos corren a sus casas, mirá alrededor: hay una bestia cerca.',
    'Un cajón que suelta chispas, una vasija que burbujea o un cofre que tiembla solo: es una trampa. Rompelo de lejos, o abrilo y alejate rápido (Espacio).',
    'El veneno se cura con una poción (Z) o un elixir (X), aunque tengas la vida llena.',
    'Una trampa que explota también lastima a las bestias: atraelas cerca y rompela de lejos.'
  ];
  const CONSEJOS = COMO.concat(TIPS);
  const tamDe = id => { const m = D.mapas && D.mapas[id]; return m && m.w ? m.w * m.h : 0; };
  const regionDe = id => { const r = REGION.find(([re]) => re.test(id)); return r ? r[1] : ''; };
  // ¿está en una sala o interior (no en una zona grande de afuera)? Las zonas: mapas del Taller grandes, las ruinas y las
  // partes de afuera del castillo viejo.
  const enSala = S => {
    const c = S.currentInterior; if (!c) return false;
    const k = c.building && c.building.kind || '';
    if (/^ed_/.test(k)) return tamDe(k.slice(3)) < GRANDE;
    if (k === 'ruins') return false;
    if (k === 'castle') return !/^(road|garden|walls|training|courtyard)$/.test(c.areaName || '');
    return true;
  };

  // ------------------------------------------------------------------ la pantalla
  const css = document.createElement('style');
  css.textContent = `
#ck-carga { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, #1a1520 0%, #0b0a10 70%); color: #e8dcc0; opacity: 0; pointer-events: none;
  transition: opacity .18s linear; font-family: var(--ck2-f, 'CK Grenze', 'Pixuf', serif); image-rendering: pixelated; }
#ck-carga.on { opacity: 1; pointer-events: all; }
#ck-carga .ck-c-emb { width: 48px; height: 48px; margin-bottom: 14px; opacity: .9; image-rendering: pixelated; }
#ck-carga .ck-c-reg { font-size: 15px; letter-spacing: 3px; color: #b49a6a; text-transform: uppercase; }
#ck-carga .ck-c-tit { font-size: 30px; color: #fcd34d; margin: 10px 0 18px; text-shadow: 2px 2px 0 #3b2410; text-align: center; padding: 0 16px; }
#ck-carga .ck-c-barra { width: 220px; height: 8px; border: 2px solid #5a3a24; background: #1d1612; }
#ck-carga .ck-c-barra i { display: block; height: 100%; width: 0; background: linear-gradient(#fcd34d, #d08a2a); }
#ck-carga .ck-c-tip { margin-top: 18px; font-size: 16px; max-width: 520px; text-align: center; color: #cbbd9c; padding: 0 16px; }
#ck-carga .ck-c-tip b { color: #fcd34d; font-weight: normal; }
#ck-carga .ck-c-arte { position: absolute; inset: 0; background: center / cover no-repeat; image-rendering: pixelated; display: none; overflow: hidden; }
#ck-carga .ck-c-arte canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; transform-origin: 60% 45%; transform: scale(1); }
#ck-carga .ck-c-video { position: absolute; inset: 0; background: #000; }
#ck-carga .ck-c-video video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; image-rendering: auto; }
#ck-carga.con-arte { justify-content: flex-end; padding-bottom: 5vh; }
#ck-carga.con-arte .ck-c-arte { display: block; }
#ck-carga.con-arte::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 48%; background: linear-gradient(transparent, rgba(11,10,16,.92) 55%); }
#ck-carga.con-arte .ck-c-emb { display: none; }
#ck-carga > :not(.ck-c-arte) { position: relative; z-index: 1; }
`;
  document.head.appendChild(css);
  let el = null, tipN = Math.floor(Math.random() * CONSEJOS.length);
  const armar = () => {
    if (el) return el;
    el = document.createElement('div'); el.id = 'ck-carga';
    el.innerHTML = '<div class="ck-c-arte"></div><img class="ck-c-emb" src="assets/UI/book/emblem.png" alt="" onerror="this.style.display=\'none\'"><div class="ck-c-reg"></div><div class="ck-c-tit"></div><div class="ck-c-barra"><i></i></div><div class="ck-c-tip"></div>';
    document.body.appendChild(el);
    return el;
  };
  // las imágenes (conceptos hechos en Flow y pasados a píxel): ck_pantalla_carga_arte.js las deja en CK_CARGA_ARTE,
  // { lugar: [dataURI, …] } con lugar = aldea, castillo, brumavieja, el id de un mapa del Taller, general, o el tiempo que
  // hace: noche, invierno (nieve), tormenta.
  // Sin ese archivo, la pantalla es la de fondo oscuro.
  const LUGAR = [[/^(camino_al_castillo|jardin_real|patio_de_armas|patio_del_castillo|muralla|patio_armas_nuevo|castle)$/, 'castillo'], [/^(aldea_en_ruinas|ruins)$/, 'brumavieja'], [/^aldea$/, 'aldea'], [/^salon_del_trono/, 'salon_del_trono']];
  const TIEMPOS = ['noche', 'invierno', 'tormenta'];
  // la clave de un lugar: el id del mapa si tiene arte propio, si no la de su zona (castillo, brumavieja…)
  const claveDe = id => { const A = window.CK_CARGA_ARTE || {}; if (id && A[id]) return id; const l = LUGAR.find(([re]) => re.test(id || '')); return l ? l[1] : (id || ''); };
  // las que valen ahora (el monolito verde sólo mientras duerme, el corrupto sólo despierto)
  const valen = k => ((window.CK_CARGA_ARTE || {})[k] || []).filter(a => a && !(typeof a === 'object' && a.soloSi && !a.soloSi()));
  // las zonas que ya conociste (se guarda con la partida)
  let vistosSueltos = {};
  const vistos = () => {
    const S = window.activeGameScene;
    if (!S || !S.story) return vistosSueltos;
    S.story.flags = S.story.flags || {};
    return (S.story.flags.carga_vistos = S.story.flags.carga_vistos || {});
  };
  const conocer = id => { const k = claveDe(id); if (k) vistos()[k] = 1; };
  const visto = a => { if (a && a.video) vistos()['@' + a.video] = 1; };
  const azar = l => l.length ? l[Math.floor(Math.random() * l.length)] : null;
  const arteDe = id => {
    if (!window.CK_CARGA_ARTE) return null;
    const S = window.activeGameScene, noche = S && S.isNight && S.isNight();
    const k = claveDe(id), propias = valen(k), V = vistos();
    // la primera vez, la de la zona (si no tiene, la pantalla oscura); y si la zona estrena una (el monolito corrupto
    // cuando despierta), esa
    if (!V[k]) return azar(propias);
    const nuevas = propias.filter(a => a.video && !V['@' + a.video]);
    if (nuevas.length) return azar(nuevas);
    let clima = ''; try { clima = window.CK_CLIMA ? CK_CLIMA.actual() : ''; } catch (e) {}
    const tiempo = clima === 'nieve' ? 'invierno' : clima === 'tormenta' ? 'tormenta' : noche ? 'noche' : null;
    if (tiempo && valen(tiempo).length && Math.random() < 0.3) return azar(valen(tiempo));
    // ya conocida: una al azar de todas las zonas descubiertas (la de este lugar incluida) y las generales
    const ronda = Object.keys(V).filter(z => z[0] !== '@' && !TIEMPOS.includes(z)).reduce((l, z) => l.concat(valen(z)), valen('general'));
    return azar(ronda.length ? ronda : propias);
  };
  // un fondo puede ser una imagen (texto dataURI) o { img, vivo: {…} }: con "vivo" se anima por código (ck_fondo_vivo.js:
  // nubes, agua, banderas, fuego, rayos de sol) y la cámara se acerca despacito
  const vivos = new Map(), imagenes = new Map();
  const imagenDe = src => { let im = imagenes.get(src); if (!im) { im = new Image(); im.src = src; imagenes.set(src, im); } return im; };
  let anima = 0, vidAhora = null;
  // cada pantalla usa un reproductor nuevo y al cerrar se suelta (reusar uno pausado dejaba la pantalla en negro)
  const soltar = v => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (er) {} };
  // un video (ck_carga_videos.js): el <video> mismo, tal cual vino de Flow (1280x720), entero y sin movimiento de cámara
  // (09/11, pedido del dueño: "colocalos tal cual te los mandé y con la calidad que te mandé, no le hagas movimientos de cámara")
  const ponerVideo = (e, cont, id) => {
    const marco = document.createElement('div'); marco.className = 'ck-c-video'; cont.appendChild(marco);
    CK_CARGA_VIDEOS.video(id, v => {
      if (!v) return;
      if (!marco.isConnected || !e.classList.contains('on')) { soltar(v); return; }
      vidAhora = v; marco.appendChild(v);
      const p = v.play(); if (p && p.catch) p.catch(() => {});
      const mirar = () => {
        if (!marco.isConnected || !e.classList.contains('on')) { soltar(v); if (vidAhora === v) vidAhora = null; return; }
        anima = requestAnimationFrame(mirar);
      };
      mirar();
    });
  };
  const ponerArte = (e, a) => {
    const cont = e.querySelector('.ck-c-arte');
    cancelAnimationFrame(anima); cont.innerHTML = '';
    if (vidAhora) { soltar(vidAhora); vidAhora = null; }
    if (a && a.video && window.CK_CARGA_VIDEOS) { e.classList.add('con-arte'); cont.style.backgroundImage = 'none'; ponerVideo(e, cont, a.video); return; }
    const src = a && (typeof a === 'string' ? a : a.img);
    e.classList.toggle('con-arte', !!src);
    cont.style.backgroundImage = src ? 'url(' + src + ')' : 'none';
    if (!src || typeof a === 'string' || !a.vivo || !window.CK_FONDO_VIVO) return;
    const im = imagenDe(src); if (!im.complete || !im.naturalWidth) return;
    let F = vivos.get(src); if (!F) { try { F = CK_FONDO_VIVO.crear(im, a.vivo); vivos.set(src, F); } catch (er) { return; } }
    const cv = document.createElement('canvas'); cv.width = F.W; cv.height = F.H; cont.appendChild(cv);
    const g = cv.getContext('2d'), t0 = performance.now();
    const paso = () => { if (!e.classList.contains('on') && performance.now() - t0 > 400) return; F.cuadro(performance.now() - t0); g.drawImage(F.canvas, 0, 0); anima = requestAnimationFrame(paso); };
    paso();
  };
  // las imágenes se cargan antes, para que estén listas la primera vez
  const precargar = () => { const A = window.CK_CARGA_ARTE; if (A) Object.keys(A).forEach(k => (A[k] || []).forEach(a => { const s = typeof a === 'string' ? a : a && a.img; if (s) imagenDe(s); })); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', precargar); else precargar();
  let tipK = 0, duraAhora = DURA;
  const mostrar = (titulo, region, lugar) => {
    const e = armar();
    const img = arteDe(lugar);
    conocer(lugar); visto(img);
    ponerArte(e, img);
    duraAhora = img ? DURA_ARTE : DURA;
    // adentro del juego: en pantalla completa sólo se ve lo que está dentro del elemento que la ocupa
    const host = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    if (e.parentNode !== host) host.appendChild(e);
    e.querySelector('.ck-c-reg').textContent = region || '';
    e.querySelector('.ck-c-tit').textContent = titulo || '';
    // uno de cómo jugar, uno del mundo, y así (sin repetir el último de cada lista)
    tipK++;
    const lista = tipK % 2 ? COMO : TIPS;
    tipN = (tipN + 1 + Math.floor(Math.random() * 3)) % lista.length;
    e.querySelector('.ck-c-tip').innerHTML = (lista === COMO ? '<b>Cómo jugar:</b> ' : '<b>Consejo:</b> ') + lista[tipN];
    const b = e.querySelector('.ck-c-barra i');
    b.style.transition = 'none'; b.style.width = '0';
    e.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = `width ${duraAhora - 200}ms steps(12)`; b.style.width = '100%'; }));
  };
  const ocultar = () => { if (el) el.classList.remove('on'); };

  // ------------------------------------------------------------------ cuándo
  const fade0 = P.fadeTransition;
  P.fadeTransition = function (action) {
    const c = this._ckCargaPend; this._ckCargaPend = null;
    if (!c || this._gameMode !== 'campaign') return fade0.apply(this, arguments);
    const t0 = Date.now(), S = this;
    this._ckCargando = true;
    mostrar(c.titulo, c.region, c.lugar);
    return fade0.call(this, function () {
      action.apply(this, arguments);
      // el nombre de verdad: a dónde se llegó (una salida puede llevar a otro lado que el que se pensó)
      try {
        const ci = S.currentInterior, k = ci && ci.building && ci.building.kind || '';
        const id = /^ed_/.test(k) ? k.slice(3) : null, m = id && D.mapas && D.mapas[id];
        const tit = m ? (m.titulo || m.nombre) : ci ? (ci.area && ci.area.title) || (ci.building && ci.building.title) : 'Aldea del Roble';
        const reg = id ? regionDe(id) : ci ? ({ castle: 'Tierras del Rey', ruins: 'Las ruinas' }[k] || '') : 'La aldea';
        if (el && tit) { el.querySelector('.ck-c-tit').textContent = tit; el.querySelector('.ck-c-reg').textContent = reg || ''; }
        const lug = id || (ci ? k : 'aldea');
        if (el && claveDe(lug) !== claveDe(c.lugar) && window.CK_CARGA_ARTE) { const a = arteDe(lug); conocer(lug); visto(a); ponerArte(el, a); }
      } catch (e) {}
      // un rato después de armar el mapa (si armarlo tardó, igual se alcanza a leer y termina de cargar lo de atrás)
      setTimeout(() => { ocultar(); setTimeout(() => { S._ckCargando = false; }, 120); }, Math.max(MIN_DESPUES, duraAhora - (Date.now() - t0)));
    });
  };
  const e0 = P.ckEntrar;
  if (e0) P.ckEntrar = function (id) {
    const ok0 = !this._doorTransition && this._gameMode === 'campaign' && tamDe(id) >= GRANDE;
    const ant = this.currentInterior && /^ed_/.test(this.currentInterior.building.kind || '') ? this.currentInterior.building.kind.slice(3) : null;
    // de un mapa a otro de la misma región también: el mapa nuevo hay que armarlo igual. Pero no al salir de una sala
    // a su mapa (09/11: "para interiores dentro de un mismo mapa no coloques pantalla de carga")
    if (ok0 && ant !== id && !enSala(this)) { const m = D.mapas[id]; this._ckCargaPend = { titulo: m.titulo || m.nombre || id, region: regionDe(id), lugar: id }; }
    const r = e0.apply(this, arguments);
    this._ckCargaPend = null;   // la transición ya lo tomó (o no hubo)
    if (r !== false) conocer(id);   // las salas (el Salón del Trono) también cuentan como descubiertas
    return r;
  };
  const x0 = P.exitInterior;
  if (x0) P.exitInterior = function () {
    const c = this.currentInterior, k = c && c.building && c.building.kind || '';
    if (!this._doorTransition && c && !enSala(this) && (/^ed_/.test(k) || k === 'castle' || k === 'ruins')) this._ckCargaPend = { titulo: 'Aldea del Roble', region: 'La aldea', lugar: 'aldea' };
    const r = x0.apply(this, arguments);
    this._ckCargaPend = null;
    return r;
  };
  ['enterCastle', 'enterRuins'].forEach(n => {
    const f0 = P[n]; if (!f0) return;
    P[n] = function () {
      if (!this._doorTransition) this._ckCargaPend = n === 'enterCastle' ? { titulo: 'El Castillo', region: 'Tierras del Rey', lugar: 'castle' } : { titulo: 'Brumavieja', region: 'Las ruinas', lugar: 'ruins' };
      const r = f0.apply(this, arguments);
      this._ckCargaPend = null;
      return r;
    };
  });
  // quieto mientras se ve la pantalla
  const mv0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    if (this._ckCargando && this.player) { this.player.setVelocity(0, 0); return; }
    return mv0.apply(this, arguments);
  };
  window.CK_PANTALLA_CARGA = { CONSEJOS, REGION, DURA, mostrar, ocultar };
})();
