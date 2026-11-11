'use strict';
/* Cargas medidas por mapa (11/11, pedido del dueño: "usá las pantallas de carga para que se carguen las cosas antes de
   pasar a algún mapa y no se vea el flick de lo que aparece y no; determiná el tiempo necesario por mapa así calculás
   cuánto debe durar la pantalla de carga").
   - Al entrar a un mapa se mira cómo se arma: cuántas cosas hay en la escena y cuántas texturas. Mientras siguen
     apareciendo cosas de golpe (4 o más de una vez, o texturas nuevas) el mapa "todavía se está armando".
   - TIEMPO[mapa]: lo que tardó cada mapa en terminar de armarse, medido en la nube (11/11) desde que se arma el mapa
     hasta el último golpe de cosas nuevas (gente que aparece, decorados que se suman tarde). Nunca se destapa antes de
     ese tiempo; y si en la PC tarda más, se espera a que de verdad deje de cambiar (hasta un tope).
   - Pantalla de carga (ck_pantalla_carga.js, mapas grandes): dura lo que haga falta (mínimo 1,4 s para que se lea el
     nombre del lugar; tope 6 s), en lugar de 6 s fijos.
   - Puertas de casas y salas (sin pantalla de carga): el negro del fundido se queda hasta que la sala está armada
     (tope 1,5 s), así no se ven cosas apareciendo.
   CK_CARGA_MEDIDA.ultimas guarda las últimas mediciones (mapa, ms, cambios). Borrar la línea de index.html lo saca
   (la pantalla de carga vuelve a sus 6 s). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  // ms desde que se arma el mapa hasta el último golpe de cosas nuevas (medido 11/11, t_carga_med.py; 0 = listo enseguida)
  // (mapas que no figuran: listos apenas se arman; las salas chicas, todas)
  const TIEMPO = {camino_al_castillo: 1350, jardin_real: 1150, granero: 700, patio_de_armas: 800, bosque_de_la_frontera: 850, tierras_orcas: 850, pueblo_orco: 750, fortaleza_orca: 600, patio_del_castillo: 550, muralla: 650, campos_del_roble: 900, claro_de_las_bestias: 850, cueva_galerias: 600};
  const QUIETO = 450, SALTO = 4;
  const ultimas = [];
  const idDe = S => {
    const ci = S.currentInterior, k = ci && ci.building && ci.building.kind || '';
    if (/^ed_/.test(k)) return k.slice(3);
    try { return S.currentZoneKey ? S.currentZoneKey() : (k || 'village'); } catch (e) { return k || 'village'; }
  };
  // (los globos de charla y los efectos de los jefes hacen texturas al vuelo: no cuentan como "el mapa se está armando")
  // ni los textos (cada texto de Phaser hace su propia textura: números de daño, "!", carteles), que son del juego y no
  // del mapa
  const AL_VUELO = /^(ckglobo_|ckj_|__|[0-9a-f]{8}-[0-9a-f]{4}-)/;
  const firma = S => {
    let t = 0, n = 0;
    if (S.textures) for (const k in S.textures.list) if (!AL_VUELO.test(k)) t++;
    if (S.children) for (const o of S.children.list) if (o.type !== 'Text') n++;
    return { n, t };
  };
  /** Espera a que el mapa termine de armarse y llama listo(ms). o = { min, max }. */
  const esperar = (S, listo, o) => {
    o = o || {};
    const prueba = window.CK_CARGA_MEDIDA_PRUEBA;   // para medir la tabla: espera mucho más, para ver lo que llega tarde
    const id = idDe(S), t0 = performance.now(), piso = Math.max(o.min || 0, (TIEMPO[id] || 0) + 120), max = prueba ? 9000 : o.max || 6000;
    const quieto = prueba ? 3000 : QUIETO;
    let ult = firma(S), ultCambio = t0, hecho = false;
    const cambios = [];
    const iv = setInterval(() => {
      if (hecho) return;
      const f = firma(S), now = performance.now();
      if (Math.abs(f.n - ult.n) >= SALTO || f.t - ult.t >= 2) { ultCambio = now; cambios.push([Math.round(now - t0), f.n - ult.n, f.t - ult.t]); }
      ult = f;
      const t = now - t0;
      if (t >= max || (t >= piso && now - ultCambio >= quieto)) {
        hecho = true; clearInterval(iv);
        const m = { id, ms: Math.round(t), ultimo: Math.round(ultCambio - t0), cambios };
        ultimas.unshift(m); ultimas.length = Math.min(ultimas.length, 30);
        try { listo(t); } catch (e) { console.warn('[carga medida]', e); }
      }
    }, 50);
  };

  // puertas sin pantalla de carga: el fundido negro espera a que la sala esté armada
  const FX_OUT = () => Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE;
  const fade0 = P.fadeTransition;
  P.fadeTransition = function (action) {
    const S = this, cam = S.cameras.main;
    // ¿se pidió otra puerta mientras ésta seguía en negro? La pantalla ya está negra: no se vuelve a oscurecer (se vería
    // un destello) y la espera anterior se cancela; la nueva se encarga de destapar
    if (S._ckEsperaTok && cam.fadeEffect && cam.fadeEffect.alpha > 0.95 && !cam.fadeEffect.isRunning) {
      S._ckEsperaTok = 0; S._ckCargando = false;
      const fo = cam.fadeOut;
      cam.fadeOut = function () { cam.fadeOut = fo; setTimeout(() => cam.emit(FX_OUT(), cam, cam.fadeEffect), 0); return cam; };
    }
    return fade0.call(this, function () {
      const r = action.apply(this, arguments);
      try {
        if (S._ckCargando || S._gameMode !== 'campaign') return r;   // ya la tapa la pantalla de carga
        const fi = cam.fadeIn, tok = S._ckEsperaTok = (S._ckEsperaTok || 0) + 1;
        S._ckCargando = true;   // quieto mientras está en negro
        // la puerta queda libre: si algo pide otra (una escena, otra salida), arranca desde el negro sin destello
        S._doorTransition = false;
        cam.fadeIn = function () {
          const args = arguments; cam.fadeIn = fi;
          esperar(S, () => {
            if (S._ckEsperaTok !== tok) return;            // ya empezó otra puerta: ésa se encarga
            S._ckEsperaTok = 0; S._ckCargando = false;
            fi.apply(cam, args);
          }, { min: 0, max: 1500 });
          return cam;
        };
        // si el motor no llamó al fundido de vuelta (no debería), se devuelve igual
        setTimeout(() => { if (cam.fadeIn !== fi) { cam.fadeIn = fi; S._ckEsperaTok = 0; S._ckCargando = false; } }, 50);
      } catch (e) { S._ckEsperaTok = 0; S._ckCargando = false; }
      return r;
    });
  };
  window.CK_CARGA_MEDIDA = { TIEMPO, esperar, ultimas, idDe };
})();
