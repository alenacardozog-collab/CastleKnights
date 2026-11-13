'use strict';
/* Guía para poner la primera habilidad (11/11, recomendación aceptada por el dueño: "que Bruno te enseñe a equipar").
   Desde 6.93 las ranuras Q E R F arrancan vacías y nada se pone solo. Sin esto, el jugador aprieta Q y no pasa nada.
   - En la charla final del entrenamiento, Bruno lo avisa: "cuando se te abra la primera ranura, te muestro".
   - Cuando una ranura ya está abierta (por nivel) y vacía, y hay una habilidad aprendida sin poner, aparece la guía:
       1) en el HUD, la ranura vacía late con una etiqueta "H" y una nota abajo: "Se abrió la ranura Q: apretá H";
       2) en el árbol, la habilidad para poner late con un cartel "1 · Elegí esta";
       3) cuando está elegida, la ranura del árbol late con "2 · Apretá Q".
     Al poner una habilidad por primera vez, Bruno (o la nota) dice "¡Así se hace!" y la guía no vuelve a salir.
   - En la práctica, si las cuatro ranuras están vacías, una nota recuerda "H: poné tus habilidades en Q E R F".
   Borrar su línea de index.html la saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_EQUIPO || !window.CK_HABILIDADES) return;
  const P = MainGameScene.prototype, EQ = window.CK_EQUIPO, HB = window.CK_HABILIDADES, TECLAS = EQ.TECLAS || ['Q', 'E', 'R', 'F'];
  const nota = t => { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(t); } catch (e) {} };
  const PRO = () => window.CK_PROGRESO;

  // ------------------------------------------------------------------ Bruno lo avisa en la charla final
  const od0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    try {
      if (/Bruno/.test(name || '') && Array.isArray(lines)) {
        const i = lines.findIndex(l => /ranuras de abajo: Q, E, R y F/.test(l));
        if (i >= 0 && !lines.some(l => /te muestro cómo/.test(l))) {
          lines = lines.slice();
          lines[i] = 'Lo que aprendas lo ponés vos en las ranuras de abajo: Q, E, R y F. Empiezan vacías y se van abriendo a medida que subís de nivel.';
          lines.splice(i + 1, 0, 'Cuando se te abra la primera, te muestro cómo: abrís el árbol con H, elegís la habilidad y apretás la tecla de la ranura.');
        }
      }
    } catch (e) {}
    return od0.call(this, name, lines, onEnd, face);
  };

  // ------------------------------------------------------------------ estilos
  const css = `
#ckh .ran.hab.ckg-guia { animation: ckgLate 0.9s ease-in-out infinite alternate; }
#ckh .ran.hab.ckg-guia::before { content: 'H'; position: absolute; left: 50%; top: -30px; transform: translateX(-50%); width: 26px; height: 24px; line-height: 22px; text-align: center;
  background: var(--ckS-glow, #ffd25a); color: #120a0a; font: 700 16px var(--ck2-f, serif); border: 2px solid #000; z-index: 5; animation: ckgSalta .7s ease-in-out infinite alternate; box-shadow: none !important; opacity: 1 !important; right: auto; bottom: auto; }
@keyframes ckgLate { from { filter: drop-shadow(0 0 0 transparent); } to { filter: drop-shadow(0 0 10px var(--ckS-glow, #ffd25a)) brightness(1.25); } }
@keyframes ckgSalta { from { translate: 0 0; } to { translate: 0 -5px; } }
#ck-habilidades .ckg-guia { z-index: 7 !important; }
#ck-habilidades .ar-nodo.ckg-guia .aro, #ck-habilidades .ar-r.ckg-guia { outline: 3px solid #fff; outline-offset: 3px; }
#ck-habilidades .ckg-tag { position: absolute; left: 50%; bottom: calc(100% + 12px); transform: translateX(-50%); z-index: 9; white-space: nowrap; pointer-events: none;
  padding: 3px 9px 4px; background: #fff3c8; color: #2a1608; font: 700 15px var(--ck2-f, serif); border: 2px solid #000; box-shadow: 0 3px 0 rgba(0,0,0,.5);
  animation: ckgSalta .7s ease-in-out infinite alternate; }
#ck-habilidades .ckg-tag::after { content: ''; position: absolute; left: 50%; top: 100%; margin-left: -6px; border: 6px solid transparent; border-top-color: #000; }
#ck-habilidades .ar-r .ckg-tag { bottom: calc(100% + 8px); }
`;
  const st = document.createElement('style'); st.id = 'ckg-css'; st.textContent = css; document.head.append(st);

  // ------------------------------------------------------------------ la guía
  const G = { activa: false, ranura: -1, id: null, vista: 0 };
  const estado = S => { const s = S.story; if (!s) return null; s.flags = s.flags || {}; return s.flags; };
  const ranuraAbierta = (S, i) => !(PRO() && PRO().bloqueado && PRO().bloqueado(S, TECLAS[i].toLowerCase()));
  const candidata = S => {
    const h = S.playerHero, r = EQ.ranuras(S, h), ok = EQ.aprendidas(S, h).filter(id => !r.includes(id));
    if (!ok.length) return null;
    const base = (EQ.BASE_DE[h] || []).filter(id => ok.includes(id));
    return base[0] || ok[0];
  };
  const revisar = S => {
    if (!S || !S.gameStarted || !S.player || S.isDead) return;
    const r = EQ.ranuras(S, S.playerHero);
    if (S._gameMode === 'practice') {
      if (!G.practica && r.every(x => !x) && !S._overlay) { G.practica = true; S.time.delayedCall(2500, () => nota('H: poné tus habilidades en Q, E, R y F')); }
      return;
    }
    const f = estado(S); if (!f || f.guia_equipar) { apagar(); return; }
    // si ya puso algo alguna vez, listo
    if (r.some(Boolean)) { f.guia_equipar = true; S.saveStory && S.saveStory(); apagar(); return; }
    const i = r.findIndex((x, k) => !x && ranuraAbierta(S, k)), id = candidata(S);
    if (i < 0 || !id) { apagar(); return; }
    G.activa = true; G.ranura = i; G.id = id;
    const now = performance.now();
    if (!S._overlay && !S.dialogOpen && now - G.vista > 9000) {
      G.vista = now;
      const d = EQ.def(S.playerHero, id);
      nota(`Se abrió la ranura ${TECLAS[i]}: apretá H y poné ${d ? d.n : 'una habilidad'}`);
    }
  };
  const apagar = () => {
    if (!G.activa) return;
    G.activa = false;
    document.querySelectorAll('.ckg-guia').forEach(e => e.classList.remove('ckg-guia'));
    document.querySelectorAll('.ckg-tag').forEach(e => e.remove());
  };
  const tag = (el, txt) => { let t = el.querySelector(':scope > .ckg-tag'); if (!t) { t = document.createElement('span'); t.className = 'ckg-tag'; el.appendChild(t); } if (t.textContent !== txt) t.textContent = txt; };
  // pintar las marcas (HUD y árbol), cada cuadro barato
  const marcar = () => {
    const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
    if (!G.activa || !S) { requestAnimationFrame(marcar); return; }
    try {
      document.querySelectorAll('#ckh .ran.hab').forEach((el, k) => el.classList.toggle('ckg-guia', k === G.ranura && !S._overlay));
      const w = document.getElementById('ck-habilidades');
      if (w && w.classList.contains('on')) {
        const d = EQ.def(S.playerHero, G.id), nom = d ? d.n : '';
        const elegido = w.querySelector('.ar-ficha h4'), listo = elegido && nom && elegido.textContent.indexOf(nom) === 0;
        w.querySelectorAll('.ar-nodo').forEach(el => {
          const es = !listo && el.title === nom;
          el.classList.toggle('ckg-guia', es);
          if (es) tag(el, '1 · Elegí esta'); else { const t = el.querySelector(':scope > .ckg-tag'); if (t) t.remove(); }
        });
        w.querySelectorAll('.ar-r').forEach(el => {
          const es = listo && +el.dataset.i === G.ranura;
          el.classList.toggle('ckg-guia', es);
          if (es) tag(el, '2 · Apretá ' + TECLAS[G.ranura]); else { const t = el.querySelector(':scope > .ckg-tag'); if (t) t.remove(); }
        });
      }
    } catch (e) {}
    requestAnimationFrame(marcar);
  };
  requestAnimationFrame(marcar);

  // al poner la primera (con el mouse o con la tecla): felicitación y fin de la guía
  const felicitar = (S, i, id) => {
    const f = estado(S); if (f) f.guia_equipar = true;
    S.saveStory && S.saveStory();
    apagar();
    const d = EQ.def(S.playerHero, id);
    nota(`¡Así se hace! ${d ? d.n : 'La habilidad'} quedó en ${TECLAS[i]}. Cerrá el árbol (H) y probala`);
    try { sfx.fx('ck_habilidad', 0.6) || sfx.fx('level_up', 0.5, { rate: 1.4 }); } catch (e) {}
  };
  const vigilar = () => {
    try {
      const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
      if (G.activa && S && S._gameMode === 'campaign') {
        const r = EQ.ranuras(S, S.playerHero), i = r.findIndex(Boolean);
        if (i >= 0) felicitar(S, i, r[i]);
      }
    } catch (e) {}
    setTimeout(vigilar, 150);
  };
  vigilar();

  let acum = 0;
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    if ((acum += delta || 16) > 700) { acum = 0; try { revisar(this); } catch (e) {} }
    return r;
  };
  window.CK_GUIA_EQUIPAR = { G, revisar, candidata };
})();
