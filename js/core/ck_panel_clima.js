'use strict';
/* Clima, estación y hora en el panel de pruebas (15/11, pedido del dueño: "al finalizar en la práctica y prueba de mapas deja
   q pueda colocar el clima y la estación q yo quiera también").
   Suma una parte al panel PRUEBAS (F4, ck_panel_pruebas.js) mientras se prueba un mapa:
   - CLIMA: al azar, despejado, nublado, lluvia, tormenta, nieve o niebla; queda puesto hasta que se elija otro (o "al azar").
   - ESTACIÓN: primavera, verano, otoño o invierno cambian qué clima sale cuando va al azar (en invierno, sobre todo nieve; en
     verano, días despejados y alguna tormenta; en otoño, nubes, lluvia y niebla; en primavera, lluvias). "Como siempre" vuelve
     al reparto de la campaña.
   - HORA: día, atardecer, noche, noche de luna llena (los lobos bravos) o amanecer, al instante.
   En la arena de la práctica no hay clima ni hora (no corre el reloj): se usa entrando a "Probar un mapa".
   Al volver a una partida de verdad se deshace todo (el clima vuelve al azar y la estación, a la de siempre).
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const SIEMPRE = /[?&]pruebas_panel=1/.test(location.search);
  const DIA = 300000;
  const CLIMAS = [['', 'Al azar'], ['despejado', '☀ Despejado'], ['nublado', '☁ Nublado'], ['lluvia', '☂ Lluvia'], ['tormenta', '⚡ Tormenta'], ['nieve', '❄ Nieve'], ['niebla', '≋ Niebla']];
  const ESTACIONES = {
    primavera: { n: '🌱 Primavera', w: { despejado: 40, nublado: 20, lluvia: 28, tormenta: 6, nieve: 0, niebla: 6 } },
    verano: { n: '☀ Verano', w: { despejado: 70, nublado: 12, lluvia: 6, tormenta: 10, nieve: 0, niebla: 2 } },
    otono: { n: '🍂 Otoño', w: { despejado: 25, nublado: 28, lluvia: 22, tormenta: 8, nieve: 2, niebla: 15 } },
    invierno: { n: '❄ Invierno', w: { despejado: 20, nublado: 20, lluvia: 4, tormenta: 2, nieve: 44, niebla: 10 } }
  };
  // la hora, en el reloj de adentro (dayPhase: la noche va de 0,62 a 0,92)
  const HORAS = [['dia', 0.25, '☀ Día'], ['atardecer', 0.565, 'Atardecer'], ['noche', 0.75, '☾ Noche'], ['luna', 0.75, '◯ Luna llena'], ['amanecer', 0.945, 'Amanecer']];
  const st = { clima: '', estacion: '', orig: null, tocado: false };
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const enPrueba = S => !!(S && S._gameMode === 'campaign' && ((window.CK_PANEL_PRUEBAS && CK_PANEL_PRUEBAS.st.prueba) || SIEMPRE));
  const pesos = () => window.CK_CLIMA && CK_CLIMA.PESOS && CK_CLIMA.PESOS.normal;

  const ponerClima = k => {
    const C = window.CK_CLIMA; if (!C) return;
    st.clima = k || ''; st.tocado = true;
    C.poner(k || null, true);
    if (!k) C.sortear();
  };
  const ponerEstacion = k => {
    const W = pesos(); if (!W) return;
    if (!st.orig) st.orig = Object.assign({}, W);
    const usar = k && ESTACIONES[k] ? ESTACIONES[k].w : st.orig;
    Object.keys(W).forEach(t => { W[t] = usar[t] || 0; });
    st.estacion = k || ''; st.tocado = true;
    if (!st.clima && window.CK_CLIMA) CK_CLIMA.sortear();     // con el clima al azar, sale uno de la estación ya
  };
  const ponerHora = (S, k) => {
    const h = HORAS.find(q => q[0] === k); if (!h || !S) return;
    let n = Math.floor((S.dayClock || 0) / DIA);
    if (k === 'luna') while (n % 3 !== 1) n++;                  // la luna llena: la noche 1, 4, 7… (ck_dia_noche.js)
    S.dayClock = n * DIA + h[1] * DIA;
    st.tocado = true;
  };
  const deshacer = () => {
    if (!st.tocado) return;
    const W = pesos();
    if (W && st.orig) Object.keys(W).forEach(t => { W[t] = st.orig[t] || 0; });
    if (st.clima && window.CK_CLIMA) CK_CLIMA.poner(null);
    st.clima = ''; st.estacion = ''; st.tocado = false;
  };

  // ------------------------------------------------------------------ la parte del panel
  const opciones = (lista, v) => lista.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('');
  const meter = () => {
    const p = document.getElementById('ckpp'), S = escena(); if (!p || !S || p.querySelector('#ckpc')) return;
    const d = document.createElement('div'); d.id = 'ckpc';
    if (!enPrueba(S)) {
      d.innerHTML = '<h3>CLIMA, ESTACIÓN Y HORA</h3><div class="nota">En la arena no corre el reloj ni el clima: entrá a "Probar un mapa" y acá elegís el clima, la estación y la hora.</div>';
    } else {
      const ahora = window.CK_CLIMA ? CK_CLIMA.actual() : '';
      d.innerHTML = `<h3>CLIMA, ESTACIÓN Y HORA</h3>
        <div class="fila">Clima <select id="ckpc-clima" style="width:auto;flex:1">${opciones(CLIMAS, st.clima)}</select></div>
        <div class="fila">Estación <select id="ckpc-est" style="width:auto;flex:1">${opciones([['', 'Como siempre']].concat(Object.keys(ESTACIONES).map(k => [k, ESTACIONES[k].n])), st.estacion)}</select></div>
        <div class="fila">${HORAS.map(h => `<button class="sec" data-h="${h[0]}">${h[2]}</button>`).join('')}</div>
        <div class="nota" id="ckpc-nota">Ahora: ${(CLIMAS.find(c => c[0] === ahora) || ['', ahora || '—'])[1]}${st.clima ? ' (fijo)' : ' (al azar)'}. La estación cambia qué clima sale cuando va al azar.</div>`;
    }
    // va arriba, después de "Probar un mapa" (antes de las salidas o de las bestias), así se ve sin bajar
    const hs = [...p.querySelectorAll('h3')], antes = hs.find(h => /SALIDAS|BESTIAS/.test(h.textContent));
    if (antes) p.insertBefore(d, antes); else p.appendChild(d);
    const foco = () => { try { const S2 = escena(); S2 && S2.game.canvas.focus(); } catch (er) {} };
    const sc = d.querySelector('#ckpc-clima'), se = d.querySelector('#ckpc-est');
    if (sc) sc.addEventListener('change', e => { e.stopPropagation(); ponerClima(sc.value); nota(); sc.blur(); foco(); });
    if (se) se.addEventListener('change', e => { e.stopPropagation(); ponerEstacion(se.value); setTimeout(nota, 300); se.blur(); foco(); });
    d.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); const S2 = escena(); ponerHora(S2, b.dataset.h);
      if (S2 && S2.createFloatingText) S2.createFloatingText(S2.player.x, S2.player.y - 50, b.textContent, 0xfde68a);
      b.blur(); foco();
    }));
  };
  const nota = () => {
    const n = document.getElementById('ckpc-nota'); if (!n || !window.CK_CLIMA) return;
    const ahora = CK_CLIMA.actual();
    n.textContent = `Ahora: ${(CLIMAS.find(c => c[0] === ahora) || ['', ahora || '—'])[1]}${st.clima ? ' (fijo)' : ' (al azar)'}. La estación cambia qué clima sale cuando va al azar.`;
  };

  // ------------------------------------------------------------------ cada cuadro: la parte en el panel, y deshacer fuera de la prueba
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      this._ckPcT = (this._ckPcT || 0) + 1;
      if (this._ckPcT % 20) return r;
      const p = document.getElementById('ckpp');
      if (p && p.classList.contains('on')) {
        const c = p.querySelector('#ckpc');
        // (el panel se vuelve a pintar al cambiar de lugar: se rearma la parte si quedó vieja)
        if (c && !!c.querySelector('#ckpc-clima') !== enPrueba(this)) c.remove();
        meter();
        if (this._ckPcT % 60 === 0) nota();
      }
      if (this._gameMode === 'campaign' && !enPrueba(this)) deshacer();
    } catch (e) { if (!P._ckPcAv) { P._ckPcAv = 1; console.warn('[panel clima]', e); } }
    return r;
  };
  window.CK_PANEL_CLIMA = { st, ponerClima, ponerEstacion, ponerHora, deshacer, ESTACIONES };
})();
