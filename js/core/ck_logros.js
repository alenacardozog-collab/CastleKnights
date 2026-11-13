'use strict';
/* Logros (12/11, pedido del dueño: "metele logros al juego por derrotar enemigos fuertes o matar cierta cantidad de monstruos
   o encontrar cosas").
   - Jefes: Grushak, Garra Negra, Kragmor, Ulrak, el Campeón orco, el Nigromante y la Limo Madre; y "Sin un rasguño" (voltear
     a un jefe sin que te toque desde el primer golpe).
   - Cantidades: la primera bestia, 50, 200 y 500 bestias.
   - Hallazgos: cofres abiertos (5 y 15), notas y libros leídos (5 y todos), nivel 5 y nivel 8.
   - Al ganar uno: un cartel arriba al medio ("LOGRO" + nombre + qué hiciste) con su sonido.
   - Se ven en el mapa (M), en una solapa nueva "Logros" (tecla 4): los ganados en color con la fecha, los que faltan en
     gris con su progreso (12/50).
   Los logros son del jugador, no de la partida: quedan aunque se empiece otra (se guardan en el navegador; si el navegador
   no deja guardar, duran hasta cerrar el juego). Borrar su línea de index.html los saca.  */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof document === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const CLAVE = 'ck_logros_v1';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ guardado
  let datos = { hechos: {}, bestias: 0 };
  try { const d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (d && d.hechos) datos = Object.assign(datos, d); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {} };

  // ------------------------------------------------------------------ la lista
  const cofres = S => { const f = S && S.story && S.story.flags; return f && f.cofres ? Object.keys(f.cofres).length : 0; };
  const leidas = S => { try { const L = window.CK_LECTURAS; const r = L && L.leidas ? L.leidas(S) : 0; return Array.isArray(r) ? r.length : typeof r === 'object' && r ? Object.keys(r).length : +r || 0; } catch (e) { return 0; } };
  const totalLect = () => { try { return (window.CK_LECTURAS && CK_LECTURAS.total()) || 0; } catch (e) { return 0; } };
  const nivel = S => (S && S.story && S.story.level) || 1;
  // tipo: 'jefe' | 'cuenta' | 'hallazgo'; jefe: tipos de enemigo; meta y prog para los que cuentan
  const LOGROS = [
    { id: 'grushak', g: 'jefe', n: 'Caudillo caído', d: 'Derrotaste a Grushak, caudillo de los clanes.', jefe: ['orc_warlord'] },
    { id: 'garra', g: 'jefe', n: 'Garra quebrada', d: 'Derrotaste a Garra Negra, señor de los osos.', jefe: ['werebear_jefe'] },
    { id: 'kragmor', g: 'jefe', n: 'Bestia domada', d: 'Derrotaste a Kragmor.', jefe: ['bestia_kragmor'] },
    { id: 'ulrak', g: 'jefe', n: 'El cazador cazado', d: 'Derrotaste a Ulrak.', jefe: ['cazador_ulrak'] },
    { id: 'campeon', g: 'jefe', n: 'Campeón del foso', d: 'Derrotaste al Campeón orco.', jefe: ['orc_campeon'] },
    { id: 'nigro', g: 'jefe', n: 'Silencio en la cripta', d: 'Derrotaste al Nigromante.', jefe: ['necromancer'] },
    { id: 'madre', g: 'jefe', n: 'Ni una gota', d: 'Reventaste a la Limo Madre.', madre: true },
    { id: 'intacto', g: 'jefe', n: 'Sin un rasguño', d: 'Volteaste a un jefe sin que te tocara.' },
    { id: 'b1', g: 'cuenta', n: 'Primera sangre', d: 'Venciste a tu primera bestia.', meta: 1, prog: () => datos.bestias },
    { id: 'b50', g: 'cuenta', n: 'Cazador', d: 'Venciste a 50 bestias.', meta: 50, prog: () => datos.bestias },
    { id: 'b200', g: 'cuenta', n: 'Azote de bestias', d: 'Venciste a 200 bestias.', meta: 200, prog: () => datos.bestias },
    { id: 'b500', g: 'cuenta', n: 'Leyenda del Roble', d: 'Venciste a 500 bestias.', meta: 500, prog: () => datos.bestias },
    { id: 'c5', g: 'hallazgo', n: 'Buscador', d: 'Abriste 5 cofres.', meta: 5, prog: cofres },
    { id: 'c15', g: 'hallazgo', n: 'Saqueador', d: 'Abriste 15 cofres.', meta: 15, prog: cofres },
    { id: 'l5', g: 'hallazgo', n: 'Lector', d: 'Leíste 5 notas o libros.', meta: 5, prog: leidas },
    { id: 'ltodo', g: 'hallazgo', n: 'Erudito', d: 'Leíste todas las notas y libros.', meta: () => totalLect(), prog: leidas },
    { id: 'n5', g: 'hallazgo', n: 'Templado', d: 'Llegaste a nivel 5.', meta: 5, prog: nivel },
    { id: 'n8', g: 'hallazgo', n: 'Veterano', d: 'Llegaste a nivel 8.', meta: 8, prog: nivel }
  ];
  const metaDe = l => (typeof l.meta === 'function' ? l.meta() : l.meta) || 0;

  // ------------------------------------------------------------------ el cartel
  const css = `
#ck-logro { position: fixed; left: 50%; top: 14px; z-index: 99990; transform: translate(-50%, -140%); transition: transform .45s cubic-bezier(.2,1.3,.4,1), opacity .4s; opacity: 0; pointer-events: none;
  display: flex; align-items: center; gap: 12px; padding: 9px 18px 9px 12px; min-width: 280px; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif);
  background: linear-gradient(180deg, rgba(28,18,10,.95), rgba(16,10,6,.95)); box-shadow: inset 0 0 0 1px #c89a3a, 0 0 0 2px #0b0607, 0 8px 22px rgba(0,0,0,.55); }
#ck-logro.on { transform: translate(-50%, 0); opacity: 1; }
@media (max-height: 520px) { #ck-logro { top: 6px; padding: 5px 12px 5px 8px; min-width: 220px; gap: 9px; } #ck-logro b { font-size: 17px; } #ck-logro span { font-size: 12px; } #ck-logro small { font-size: 10px; } #ck-logro .ic { width: 26px; height: 26px; } }
#ck-logro .ic, .ckl-pane .ic { width: 34px; height: 34px; flex: none; image-rendering: pixelated; background-size: 100% 100%; }
#ck-logro .tx { display: flex; flex-direction: column; }
#ck-logro small { font-size: 12px; letter-spacing: 3px; color: #e2b04a; font-weight: 700; }
#ck-logro b { font-size: 21px; color: #fff3d8; line-height: 1.05; text-shadow: 0 2px 0 #000; }
#ck-logro span { font-size: 14px; color: #c8b898; }
#ck-mapa.ckd-logros .ckm-zonas, #ck-mapa.ckd-logros .ckm-cuerpo, #ck-mapa.ckd-logros .ckm-obj { display: none !important; }
#ck-mapa .ckl-pane { display: none; flex: 1 1 auto; min-height: 0; overflow: auto; font-family: var(--ck2-f, Grenze, serif); color: #3a2414; padding: 6px 4px; }
#ck-mapa.ckd-logros .ckl-pane { display: block; }
#ck-mapa.ckd-logros .ckm-pie { justify-content: flex-end; }
.ckl-pane h4 { margin: 8px 4px 6px; font-size: 15px; letter-spacing: 2px; color: #7a4a1c; border-bottom: 1px solid rgba(122,74,28,.3); }
.ckl-pane .cuenta { float: right; font-size: 15px; color: #6b4a24; }
.ckl-pane .grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px; }
.ckl-pane .lg { display: flex; align-items: center; gap: 10px; padding: 6px 8px; background: rgba(255,248,226,.55); box-shadow: inset 0 0 0 1px rgba(122,74,28,.35); }
.ckl-pane .lg b { display: block; font-size: 17px; color: #3a1408; line-height: 1.1; }
.ckl-pane .lg span { display: block; font-size: 14px; color: #5a3a1c; line-height: 1.15; }
.ckl-pane .lg em { display: block; font-style: normal; font-size: 12px; color: #8a6a3a; }
.ckl-pane .lg.no { background: rgba(60,40,20,.08); }
.ckl-pane .lg.no .ic { filter: grayscale(1) brightness(.55); opacity: .7; }
.ckl-pane .lg.no b { color: #6a5a4a; }
.ckl-pane .lg .barra { height: 4px; margin-top: 3px; background: rgba(60,40,20,.18); }
.ckl-pane .lg .barra i { display: block; height: 100%; background: #b8862b; }
`;
  const st = document.createElement('style'); st.id = 'cklg-css'; st.textContent = css; document.head.appendChild(st);

  // íconos de 16×16 en píxeles: copa (jefes), calavera (cantidades), cofre (hallazgos)
  const ICON = {
    jefe: ['................', '..############..', '.##oooooooooo##.', '##o#oooooooo#o##', '#o##oollllooo##o', '#o.#oollllooo#.o', '.#.#oooooooooo#.', '..##oooooooooo#.', '...##oooooooo##.', '....##oooooo##..', '......##oo##....', '.......#oo#.....', '......##oo##....', '.....#oooooo#...', '....##########..', '................'],
    cuenta: ['................', '....########....', '...#llllllll#...', '..#llllllllll#..', '..#llllllllll#..', '..#l###ll###l#..', '..#l###ll###l#..', '..#llllllllll#..', '...#llll#llll#..', '....#llllllll#..', '....#l#l#l#l#...', '.....########...', '................', '................', '................', '................'],
    hallazgo: ['................', '................', '...##########...', '..#oooooooooo#..', '.#oooooooooooo#.', '.##############.', '.#oo#oollo#ooo#.', '.#oo#oollo#ooo#.', '.#oo##oo##oooo#.', '.#oooooooooooo#.', '.#oooooooooooo#.', '.##############.', '................', '................', '................', '................']
  };
  const COL = { jefe: { o: '#e2b04a', l: '#fff3b0', '#': '#3a2008' }, cuenta: { o: '#d8d0c0', l: '#f2ece0', '#': '#2a2018' }, hallazgo: { o: '#b06a2a', l: '#ffd23a', '#': '#2a1406' } };
  const urls = {};
  const icono = g => {
    if (urls[g]) return urls[g];
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
    ICON[g].forEach((f, y) => [...f].forEach((ch, x) => { if (ch !== '.') { c.fillStyle = COL[g][ch]; c.fillRect(x, y, 1, 1); } }));
    return (urls[g] = cv.toDataURL());
  };

  let cola = [], mostrando = false;
  const cartel = () => {
    if (mostrando || !cola.length) return;
    mostrando = true;
    const l = cola.shift();
    let el = document.getElementById('ck-logro');
    if (!el) { el = document.createElement('div'); el.id = 'ck-logro'; }
    // dentro de la pantalla completa (si no, no se ve)
    const host = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    if (el.parentElement !== host) host.appendChild(el);
    el.innerHTML = `<div class="ic" style="background-image:url(${icono(l.g)})"></div><div class="tx"><small>LOGRO</small><b>${esc(l.n)}</b><span>${esc(l.d)}</span></div>`;
    try { (typeof sfx !== 'undefined') && (sfx.fx('level_up', 0.55) || sfx.fx('ck_habilidad', 0.5)); } catch (e) {}
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => { mostrando = false; cartel(); }, 500); }, 4200);
  };
  const ganar = (id) => {
    if (datos.hechos[id]) return false;
    const l = LOGROS.find(x => x.id === id); if (!l) return false;
    datos.hechos[id] = Date.now(); guardar();
    cola.push(l); cartel();
    return true;
  };

  // ------------------------------------------------------------------ qué se gana y cuándo
  const revisarCuentas = S => {
    LOGROS.forEach(l => { if (l.prog && !datos.hechos[l.id]) { const m = metaDe(l); if (m > 0 && l.prog(S) >= m) ganar(l.id); } });
  };
  const dp0 = P.damagePlayer;
  P.damagePlayer = function () {
    const h0 = this.health, r = dp0.apply(this, arguments);
    if (this.health < h0) this._ckLogToques = (this._ckLogToques || 0) + 1;
    return r;
  };
  const dm0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const vivo = enemy && !enemy.isDead;
    const jefe = vivo && window.CK_PESO_GOLPE ? CK_PESO_GOLPE.esJefe(enemy) : !!(enemy && enemy.def && enemy.def.boss);
    if (vivo && jefe && enemy._ckLogT === undefined) enemy._ckLogT = this._ckLogToques || 0;
    const r = dm0.apply(this, arguments);
    try {
      if (vivo && enemy.isDead && this._gameMode === 'campaign') {
        datos.bestias++; guardar();
        LOGROS.forEach(l => { if (l.jefe && l.jefe.includes(enemy.type)) ganar(l.id); });
        if (enemy._ckLimoMadre) ganar('madre');
        if (jefe && (this._ckLogToques || 0) === enemy._ckLogT) ganar('intacto');
        revisarCuentas(this);
      }
    } catch (e) {}
    return r;
  };
  // cofres, lecturas y nivel: de a ratos
  setInterval(() => { const S = ESCENA(); if (S && S._gameMode === 'campaign' && S.story) try { revisarCuentas(S); } catch (e) {} }, 2000);

  // ------------------------------------------------------------------ la solapa "Logros" en el mapa (M)
  const pintar = (pane) => {
    const S = ESCENA();
    const grupos = [['jefe', 'Jefes'], ['cuenta', 'Bestias'], ['hallazgo', 'Hallazgos']];
    const hechos = LOGROS.filter(l => datos.hechos[l.id]).length;
    const fecha = t => { const d = new Date(t); return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }); };
    pane.innerHTML = `<h4>LOGROS<span class="cuenta">${hechos} de ${LOGROS.length} · ${datos.bestias} bestias vencidas</span></h4>` + grupos.map(([g, t]) => {
      const ls = LOGROS.filter(l => l.g === g);
      return `<h4>${t.toUpperCase()}</h4><div class="grilla">` + ls.map(l => {
        const si = !!datos.hechos[l.id];
        let extra = '';
        if (si) extra = `<em>Ganado el ${fecha(datos.hechos[l.id])}</em>`;
        else if (l.prog) { const m = metaDe(l), p = Math.min(m, l.prog(S) || 0); extra = m ? `<em>${p} / ${m}</em><div class="barra"><i style="width:${Math.round(100 * p / m)}%"></i></div>` : ''; }
        return `<div class="lg${si ? '' : ' no'}"><div class="ic" style="background-image:url(${icono(l.g)})"></div><div><b>${esc(l.n)}</b><span>${esc(si || l.g !== 'jefe' ? l.d : '???')}</span>${extra}</div></div>`;
      }).join('') + '</div>';
    }).join('');
  };
  const ir = (big, on) => {
    big.classList.toggle('ckd-logros', on);
    if (on) { big.classList.remove('ckd-objetivos', 'ckd-inventario'); big.querySelectorAll('.ckd-tab').forEach(x => x.classList.toggle('sel', x.dataset.t === 'logros')); pintar(big.querySelector('.ckl-pane')); try { sfx.fx('ui_click', 0.4, { rate: 1.1 }); } catch (e) {} }
  };
  const vigilar = () => {
    const big = document.getElementById('ck-mapa'), bar = big && big.querySelector('.ckd-tabs');
    if (bar && !bar.querySelector('[data-t="logros"]')) {
      const t = document.createElement('div'); t.className = 'ckd-tab'; t.dataset.t = 'logros'; t.innerHTML = 'Logros<b>4</b>';
      t.onclick = () => ir(big, true);
      bar.appendChild(t);
      // las otras solapas sacan la de logros
      bar.addEventListener('click', e => { const x = e.target.closest('.ckd-tab'); if (x && x.dataset.t !== 'logros') big.classList.remove('ckd-logros'); }, true);
      const win = big.querySelector('.ck-win'), pane = document.createElement('div'); pane.className = 'ckl-pane';
      win.insertBefore(pane, win.querySelector('.ckm-pie'));
    }
    if (big && !big.classList.contains('on')) big.classList.remove('ckd-logros');
    setTimeout(vigilar, 400);
  };
  vigilar();
  window.addEventListener('keydown', e => {
    const big = document.getElementById('ck-mapa');
    if (!big || !big.classList.contains('on')) return;
    if (e.key === '4') { ir(big, true); }
    else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === 'Tab') big.classList.remove('ckd-logros');
  }, true);

  window.CK_LOGROS = { LOGROS, ganar, datos: () => datos, borrar: () => { datos = { hechos: {}, bestias: 0 }; guardar(); } };
})();
