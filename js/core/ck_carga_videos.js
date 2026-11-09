'use strict';
/* Videos de Flow en las pantallas de carga (09/11, pedido del dueño: los conceptos animados con Veo, sin la música con la
   que salieron; después: "colocalos tal cual te los mandé y con la calidad que te mandé": 1280x720 como vinieron, sólo
   recortados el monolito verde —antes de que Gemini lo funda con el salón del trono— y la aldea —antes de un salto de cámara—).
   Cada video está en su archivo en js/core/carga_videos/ (pesan entre 1,5 y 4,5 MB). Para que el juego no tarde en
   arrancar, no van en index.html: este archivo los va cargando de a uno un rato después de empezar (y si hace falta
   uno antes, lo pide en el momento).
   Los suma a CK_CARGA_ARTE (el de ck_pantalla_carga_arte.js) con su lugar; ck_pantalla_carga.js los muestra.
   - el monolito verde sale mientras el monolito duerme; el corrupto, recién cuando despierta (CK_MONOLITO.despierto()).
   - los del Salón del Trono no tienen carga propia (es una sala): entran a la ronda cuando ya lo conociste.
   Borrar la línea de index.html saca todos los videos (queda la pantalla de antes). */
(function () {
  const BASE = 'js/core/carga_videos/';
  const despierto = () => { try { return !!(window.CK_MONOLITO && CK_MONOLITO.despierto()); } catch (e) { return false; } };
  // id = archivo; lugar = la clave de la pantalla de carga (aldea, castillo, el id de un mapa, noche…)
  const LISTA = [
    { id: 'aldea', lugar: 'aldea' },
    { id: 'castillo', lugar: 'castillo' },
    { id: 'noche', lugar: 'noche' },
    { id: 'monolito', lugar: 'bosque_de_la_frontera', soloSi: () => !despierto() },
    { id: 'monolito_despierto', lugar: 'bosque_de_la_frontera', soloSi: despierto },
    { id: 'salon_trono_1', lugar: 'salon_del_trono' },
    { id: 'salon_trono_2', lugar: 'salon_del_trono' },
    { id: 'tierras_orcas', lugar: 'tierras_orcas' },
    { id: 'pueblo_orco', lugar: 'pueblo_orco' },
    { id: 'fortaleza_orca', lugar: 'fortaleza_orca' }
  ];
  const DATOS = window.CK_CARGA_VIDEO_DATOS = window.CK_CARGA_VIDEO_DATOS || {};
  const urls = {}, esperan = {};
  // el texto base64 pasa a un Blob una sola vez (y se suelta el texto)
  const url = id => {
    if (urls[id]) return urls[id];
    const d = DATOS[id]; if (!d) return null;
    try {
      const bin = atob(d.slice(d.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      urls[id] = URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
    } catch (e) { return null; }
    delete DATOS[id];
    return urls[id];
  };
  const cargar = (id, cb) => {
    if (url(id)) { if (cb) cb(urls[id]); return; }
    const ya = esperan[id]; (esperan[id] = ya || []).push(cb);
    if (ya) return;
    const s = document.createElement('script');
    s.src = BASE + id + '.js?v=2';
    const fin = () => { const u = url(id), l = esperan[id] || []; delete esperan[id]; l.forEach(f => f && f(u)); };
    s.onload = fin; s.onerror = fin;
    document.head.appendChild(s);
  };
  // un <video> nuevo (mudo, en bucle) cada vez; cb lo recibe cuando ya tiene cuadro para mostrar
  const video = (id, cb) => cargar(id, u => {
    if (!u) { cb(null); return; }
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.addEventListener('loadeddata', () => cb(v), { once: true });
    v.addEventListener('error', () => cb(null), { once: true });
    v.src = u;
  });

  // a CK_CARGA_ARTE: el castillo animado por código queda reemplazado por el video
  const A = window.CK_CARGA_ARTE = window.CK_CARGA_ARTE || {};
  A.castillo = [];
  LISTA.forEach(v => (A[v.lugar] = A[v.lugar] || []).push({ video: v.id, soloSi: v.soloSi }));

  // de a uno, un rato después de arrancar (primero los de la aldea, el castillo y la noche)
  const precargar = () => {
    let n = 0;
    const sig = () => { const v = LISTA[n++]; if (!v) return; cargar(v.id, () => setTimeout(sig, 3000)); };
    setTimeout(sig, 6000);
  };
  if (document.readyState === 'complete') precargar(); else window.addEventListener('load', precargar);

  window.CK_CARGA_VIDEOS = { LISTA, cargar, video, url };
})();
