'use strict';
/* Cierre del Capítulo 1 (23/10): después de la última charla con el Maestre Eloy (el epílogo) aparece una pantalla con el
   resumen de la partida (tiempo jugado, bestias vencidas, monedas, nivel y experiencia), los créditos y el adelanto del
   Capítulo 2. Se ve una sola vez por partida (story.flags.fin_visto); "Seguir jugando" la cierra y el mundo sigue abierto.
   El nombre del autor para los créditos va en AUTOR (abajo). Borrar la línea de index.html la saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const AUTOR = 'CastleKnight';      // ← poné acá tu nombre (o el del equipo) para los créditos
  const CREDITOS = [
    ['Un juego de', AUTOR],
    ['Hecho con', 'el Taller de CastleKnight y Phaser 3'],
    ['Arte', 'packs de pixel art del proyecto, retocados y animados con PixelLab'],
    ['Voces y sonidos', 'ElevenLabs'],
    ['Letra', 'Grenze, de Omnibus-Type (licencia OFL)'],
    ['', 'Gracias por jugar']
  ];

  // las bestias vencidas se cuentan en la partida (las de antes de este archivo no estaban contadas)
  const vencido0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function () {
    const r = vencido0 ? vencido0.apply(this, arguments) : undefined;
    try { if (this._gameMode === 'campaign' && this.story) { const f = (this.story.flags = this.story.flags || {}); f.bestias = (f.bestias || 0) + 1; } } catch (e) {}
    return r;
  };

  const duracion = seg => {
    seg = Math.max(0, Math.round(seg || 0));
    const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
  };
  const jugado = S => {
    try {
      const PA = window.CK_PARTIDAS, i = PA && PA.activa();
      const slot = i !== null && i !== undefined ? PA.leer()[i] : null;
      return (slot && slot.tiempo || 0) + (S._ckJugado || 0);
    } catch (e) { return S._ckJugado || 0; }
  };
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  const css = () => {
    if (document.getElementById('ck-fin-css')) return;
    const st = document.createElement('style'); st.id = 'ck-fin-css';
    st.textContent = `#ck-fin{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(ellipse at center,rgba(20,14,8,.82),rgba(6,4,2,.96));opacity:0;transition:opacity .8s;padding:16px;box-sizing:border-box}
      #ck-fin.on{opacity:1}
      #ck-fin .fin-c{width:min(620px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:26px 30px 22px;
        background:linear-gradient(180deg,#3a2614,#22150a);border:3px solid #8a6a3c;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.6);
        color:#f3e6c8;font:16px Grenze,Georgia,serif;text-align:center}
      #ck-fin h2{margin:0;font-size:34px;color:#ffd77a;letter-spacing:.5px}
      #ck-fin .sub{margin:4px 0 18px;color:#d9c39a;font-style:italic}
      #ck-fin .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:10px;margin:0 0 18px}
      #ck-fin .stats div{background:rgba(0,0,0,.28);border:1px solid #6b5230;border-radius:6px;padding:8px 6px}
      #ck-fin .stats b{display:block;font-size:22px;color:#ffe9b0}
      #ck-fin .stats span{font-size:13px;color:#cdb68d}
      #ck-fin .prox{margin:0 0 16px;padding:10px 12px;border-top:1px solid #6b5230;border-bottom:1px solid #6b5230;color:#bfe3ff}
      #ck-fin .prox b{color:#e6f4ff}
      #ck-fin .cred{font-size:14px;line-height:1.55;color:#d9c39a;margin-bottom:18px}
      #ck-fin .cred i{color:#a8916a;font-style:normal}
      #ck-fin button{font:600 17px Grenze,Georgia,serif;color:#2a1a0a;background:linear-gradient(180deg,#ffd77a,#d9a441);border:2px solid #6b4a1c;
        border-radius:6px;padding:8px 22px;cursor:pointer}`;
    document.head.append(st);
  };

  const mostrar = S => {
    const st = S.story, f = st.flags;
    f.fin_visto = true;
    if (S.saveStory) S.saveStory();
    css();
    const d = document.createElement('div'); d.id = 'ck-fin';
    const stat = (v, n) => `<div><b>${esc(v)}</b><span>${esc(n)}</span></div>`;
    d.innerHTML = `<div class="fin-c">
      <h2>Capítulo 1 completo</h2>
      <div class="sub">La niebla del norte retrocede… por ahora.</div>
      <div class="stats">${stat(duracion(jugado(S)), 'jugado')}${stat(f.bestias || S.kills || 0, 'bestias vencidas')}${stat(st.coins || 0, 'monedas')}${stat(st.level || 1, 'nivel')}${stat(st.xp || 0, 'experiencia')}</div>
      <div class="prox"><b>Capítulo 2 · Las Torres de Escarcha</b><br>Más allá del paso helado, alguien volvió a encender las torres. Próximamente.</div>
      <div class="cred">${CREDITOS.map(([a, b]) => (a ? `<i>${esc(a)}:</i> ` : '') + esc(b)).join('<br>')}</div>
      <button type="button">Seguir jugando</button></div>`;
    // dentro del contenedor del juego: si está en pantalla completa, lo de afuera no se ve
    (document.fullscreenElement || document.getElementById('game-wrapper') || document.body).append(d);
    S._overlay = 'fin';
    try { S.physics.pause(); } catch (e) {}
    requestAnimationFrame(() => d.classList.add('on'));
    const cerrar = () => {
      d.classList.remove('on');
      setTimeout(() => d.remove(), 800);
      if (S._overlay === 'fin') S._overlay = null;
      try { S.physics.resume(); } catch (e) {}
      document.removeEventListener('keydown', tecla, true);
    };
    const tecla = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cerrar(); } };
    d.querySelector('button').onclick = cerrar;
    document.addEventListener('keydown', tecla, true);
  };

  // aparece unos segundos después de cerrar la charla del epílogo (deja ver el cartel "Capítulo 2")
  const u0 = P.update;
  P.update = function (time) {
    const r = u0.apply(this, arguments);
    try {
      const st = this.story, f = st && st.flags;
      if (this._gameMode !== 'campaign' || !f || !f.epilogo || f.fin_visto) return r;
      if (this.dialogOpen || this._overlay || this._doorTransition) { this._ckFinT = null; return r; }
      if (!this._ckFinT) this._ckFinT = time;
      if (time - this._ckFinT > 3200) mostrar(this);
    } catch (e) { console.warn('[fin del capítulo]', e); }
    return r;
  };
  window.CK_FIN_CAPITULO = { mostrar: () => window.activeGameScene && mostrar(window.activeGameScene), CREDITOS };
})();
