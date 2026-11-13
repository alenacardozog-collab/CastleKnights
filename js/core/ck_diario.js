'use strict';
/* Mapa con solapas: Mapa · Objetivos · Inventario (11/11, pedido del dueño: "al presionar M veamos el mapa, las leyendas de las
   cosas, y ponele solapas al lado de un inventario del jugador, y otra de los objetivos seccionados por principales y
   secundarios; que al seleccionar una misión nos dé un resumen al lado de la conversa que tuvimos con el que nos asignó y
   veamos lo que nos dijo; los objetivos ya cumplidos se tachan; la tipografía es un poco pequeña").
   Va encima de la ventana del mapa grande de ck_minimapa.js (#ck-mapa): no toca el mapa, le suma las solapas arriba.
   - OBJETIVOS: a la izquierda la lista, en dos partes: PRINCIPALES (la historia) y SECUNDARIAS (las misiones de Lancent, Aby y
     Horos). Las cumplidas quedan tachadas y con ✔; la que está en curso, con un rombo. A la derecha, la elegida: qué hay que
     hacer, el premio (si lo tiene) y "Lo que te dijo …": la charla con quien te la dio, línea por línea.
   - El diario de las principales se va anotando solo: cada vez que cambia el objetivo, el anterior queda cumplido y el nuevo se
     anota con la última charla que tuviste antes (story.flags.diario, se guarda con la partida).
   - INVENTARIO: pociones, elixires, antorchas, monedas, mejoras compradas, el reloj de sol, la llave, y las cuatro ranuras.
   - Teclas: M abre en el mapa; 1, 2, 3 o TAB cambian de solapa; ↑ ↓ eligen objetivo; M o ESC cierran.
   - Letra más grande en toda la ventana.
   Borrar su línea de index.html deja el mapa como antes (el diario se sigue guardando si se vuelve a poner). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCENA = () => window.activeGameScene || (window.game && window.game.scene && window.game.scene.scenes.find(s => s.startCampaign));
  const IC = () => window.CK_ICONOS_HEROE || {};
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // (12/11) sin las aclaraciones de lugar entre paréntesis: el camino ya está en el mapa (ck_objetivo_panel.js)
  const limpio = t => { t = String(t || '').replace(/\[\[|\]\]/g, '').replace(/\s+/g, ' ').trim(); return window.CK_OBJ_PANEL ? CK_OBJ_PANEL.sinLugar(t) : t; };
  // lo que identifica a un objetivo (sin el contador "3/5" que cambia)
  const clave = t => {
    t = limpio(t);
    if (/^Entrenamiento\b/i.test(t)) return 'Entrenamiento con el Capitán Bruno';
    return t.replace(/\s*[·(]\s*\d+\s*\/\s*\d+\s*\)?/g, '').replace(/\s*\(\d+\/\d+\)/g, '').trim();
  };
  const nombreHeroe = h => { const D = (typeof HEROES !== 'undefined' && HEROES[h]) || {}; return D.name ? D.name.charAt(0) + D.name.slice(1).toLowerCase() : h; };

  // ------------------------------------------------------------------ el diario de las principales
  const diario = S => { const s = S && S.story; if (!s) return null; s.flags = s.flags || {}; return (s.flags.diario = s.flags.diario || []); };
  let ultDialogo = null;
  const od0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    try {
      if (this._gameMode === 'campaign' && Array.isArray(lines) && lines.length)
        ultDialogo = { de: String(name || ''), lineas: lines.map(l => limpio(typeof l === 'string' ? l : (l && l.t) || '')).filter(Boolean).slice(-14), t: Date.now() };
    } catch (e) {}
    return od0.apply(this, arguments);
  };
  const anotar = S => {
    if (!S || S._gameMode !== 'campaign' || !S.story) return;
    const box = document.getElementById('ck-objective'), el = box && box.querySelector('.ck-obj-text');
    const t = el && limpio(el.textContent); if (!t) return;
    const D = diario(S), k = clave(t), ult = D[D.length - 1];
    if (ult && ult.k === k) { if (ult.t !== t) ult.t = t; return; }
    if (ult) ult.hecho = true;
    const vino = ultDialogo && Date.now() - ultDialogo.t < 5 * 60 * 1000 ? ultDialogo : null;
    D.push({ k, t, de: vino ? vino.de : '', lineas: vino ? vino.lineas : [], hecho: /Capítulo \d+ completo/i.test(t) });
    if (D.length > 60) D.splice(0, D.length - 60);
    ultDialogo = null;
  };
  const uo0 = P.updateObjective;
  P.updateObjective = function () {
    const r = uo0.apply(this, arguments);
    try { anotar(this); } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ las secundarias (ck_heroes_npc.js)
  const secundarias = S => {
    const H = window.CK_HEROES_NPC; if (!H || !H.MISIONES || !S.story) return [];
    const sq = (S.story.flags && S.story.flags.sq) || {};
    return H.MISIONES.filter(m => sq[m.id]).map(m => {
      const e = sq[m.id], est = e.e;
      let falta = '';
      try { falta = est === 'lista' ? m.listo : est === 'hecha' ? 'Cumplida.' : (typeof m.falta === 'function' ? m.falta(e) : ''); } catch (er) {}
      const pr = m.premio || {}, premio = [pr.monedas ? pr.monedas + ' monedas' : '', pr.xp ? pr.xp + ' de experiencia' : '',
        pr.inv && pr.inv.elixir ? pr.inv.elixir + ' elixir' : '', pr.inv && pr.inv.potion ? pr.inv.potion + ' pociones' : ''].filter(Boolean).join(' · ');
      return { k: 'sq:' + m.id, t: m.titulo, falta, premio, de: nombreHeroe(m.h), lineas: (m.ofrece || []).map(limpio), hecho: est === 'hecha', lista: est === 'lista' };
    });
  };

  // ------------------------------------------------------------------ estilos
  const css = `
/* letra más grande en el mapa */
#ck-mapa .ck-win { padding-top: 10px !important; }
#ck-mapa .ck-win > h3 { display: none !important; }
#ck-mapa .ckm-zonas { font-size: 15px !important; }
#ck-mapa .ckm-zonas button { font-size: 14px !important; padding: 4px 9px !important; }
#ck-mapa .ckm-ley { font-size: 15px !important; flex-basis: 270px !important; }
#ck-mapa .ckm-ley h4 { font-size: 19px !important; }
#ck-mapa .ckm-ley li em { font-size: 12px !important; }
#ck-mapa .ckm-ley .falta { font-size: 14px !important; }
#ck-mapa .ckm-ley .sim { font-size: 14px !important; }
#ck-mapa .ckm-pie { font-size: 16px !important; }
#ck-mapa .ckm-herr span { font-size: 13px !important; }
/* las solapas */
#ck-mapa .ckd-tabs { display: flex; justify-content: center; align-items: flex-end; gap: 6px; margin: 0 0 10px; border-bottom: 3px solid #6b4a1c; flex: 0 0 auto; }
#ck-mapa .ckd-tab { position: relative; font-family: var(--ck2-f, Grenze, serif); font-weight: 700; font-size: 20px; color: #6b4a24; cursor: pointer; padding: 6px 22px 5px; margin-bottom: -3px;
  background: linear-gradient(180deg, #e8d3a2, #d6bb82); border: 3px solid #6b4a1c; border-bottom-color: #6b4a1c; border-radius: 8px 8px 0 0; box-shadow: inset 0 2px 0 rgba(255,255,255,.4); }
#ck-mapa .ckd-tab b { font-size: 12px; color: #fff; background: #6b4a1c; padding: 0 5px; margin-left: 7px; vertical-align: 3px; border-radius: 2px; }
#ck-mapa .ckd-tab:hover { color: #3a2010; }
#ck-mapa .ckd-tab.sel { color: #3a1408; background: linear-gradient(180deg, #fbefcf, #f1dfb2); border-bottom-color: #f1dfb2; padding-top: 9px; z-index: 1; }
#ck-mapa .ckd-tab .pt { position: absolute; right: -6px; top: -8px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px; background: #b8321c; color: #fff; font-size: 12px; text-align: center; padding: 0 4px; }
#ck-mapa.ckd-objetivos .ckm-zonas, #ck-mapa.ckd-objetivos .ckm-cuerpo, #ck-mapa.ckd-inventario .ckm-zonas, #ck-mapa.ckd-inventario .ckm-cuerpo,
#ck-mapa.ckd-objetivos .ckm-obj, #ck-mapa.ckd-inventario .ckm-obj { display: none !important; }
#ck-mapa .ckd-pane { display: none; flex: 1 1 auto; min-height: 0; font-family: var(--ck2-f, Grenze, serif); color: #3a2414; }
#ck-mapa.ckd-objetivos .ckd-obj, #ck-mapa.ckd-inventario .ckd-inv { display: flex; }
/* objetivos */
#ck-mapa .ckd-obj { gap: 16px; }
#ck-mapa .ckd-lista { flex: 0 0 42%; overflow-y: auto; padding-right: 6px; }
#ck-mapa .ckd-lista h4 { margin: 4px 0 6px !important; font-size: 19px !important; color: #6b2414 !important; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
#ck-mapa .ckd-lista h4::after { content: ''; flex: 1; height: 2px; background: linear-gradient(90deg, #8a5a2c, transparent); }
#ck-mapa .ckd-it { display: flex; gap: 8px; align-items: flex-start; padding: 6px 8px; margin-bottom: 3px; cursor: pointer; font-size: 16px; line-height: 1.2; border: 2px solid transparent; }
#ck-mapa .ckd-it:hover { background: rgba(255,240,190,.55); }
#ck-mapa .ckd-it.sel { background: rgba(255,226,150,.65); border-color: #b8862b; box-shadow: 0 0 8px rgba(200,140,40,.35); }
#ck-mapa .ckd-it i { flex: 0 0 auto; width: 10px; height: 10px; margin-top: 5px; background: #b8321c; transform: rotate(45deg); border: 1px solid #3a1408; }
#ck-mapa .ckd-it.lista i { background: #e2b04a; }
#ck-mapa .ckd-it.hecho { color: #8a7458; }
#ck-mapa .ckd-it.hecho span { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: rgba(122,36,20,.7); }
#ck-mapa .ckd-it.hecho i { background: none; border: 0; transform: none; width: 14px; height: auto; margin-top: 0; font-style: normal; color: #3f7d3a; font-weight: 700; }
#ck-mapa .ckd-it.hecho i::before { content: '✔'; }
#ck-mapa .ckd-vacio { font-size: 15px; color: #8a7458; padding: 4px 8px 10px; }
#ck-mapa .ckd-det { flex: 1 1 auto; min-width: 0; overflow-y: auto; padding: 12px 16px; background: rgba(255,248,226,.6); border: 2px solid rgba(107,74,28,.45); box-shadow: inset 0 0 18px rgba(140,100,40,.15); }
#ck-mapa .ckd-det h3 { display: block !important; margin: 0 0 4px !important; font-size: 24px !important; color: #3a1408 !important; text-align: left !important; }
#ck-mapa .ckd-det h3::after { display: none !important; }
#ck-mapa .ckd-det .est { display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #fff; background: #b8321c; padding: 1px 8px; margin-bottom: 8px; }
#ck-mapa .ckd-det .est.hecho { background: #3f7d3a; } #ck-mapa .ckd-det .est.lista { background: #b8862b; }
#ck-mapa .ckd-det .que { font-size: 17px; line-height: 1.3; margin: 0 0 6px; }
#ck-mapa .ckd-det .premio { font-size: 15px; color: #6b4a24; margin: 0 0 10px; }
#ck-mapa .ckd-det .premio b { color: #7a2418; }
#ck-mapa .ckd-det h5 { margin: 12px 0 8px; font-size: 17px; color: #6b2414; border-top: 2px dashed rgba(107,74,28,.35); padding-top: 10px; }
#ck-mapa .ckd-charla { display: flex; flex-direction: column; gap: 7px; }
#ck-mapa .ckd-charla p { position: relative; margin: 0 0 0 14px; padding: 7px 11px; font-size: 16px; line-height: 1.28; background: #fffaf0; border: 2px solid #8a6a3c; border-radius: 3px; box-shadow: 0 2px 0 rgba(0,0,0,.12); }
#ck-mapa .ckd-charla p::before { content: ''; position: absolute; left: -10px; top: 10px; border: 6px solid transparent; border-right-color: #8a6a3c; }
#ck-mapa .ckd-charla .sin { background: none; border: 0; box-shadow: none; color: #8a7458; font-style: italic; margin-left: 0; padding-left: 0; }
#ck-mapa .ckd-charla .sin::before { display: none; }
/* inventario */
#ck-mapa .ckd-inv { flex-direction: column; gap: 12px; overflow-y: auto; }
#ck-mapa .ckd-inv h4 { margin: 2px 0 0 !important; font-size: 19px !important; color: #6b2414 !important; }
#ck-mapa .ckd-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
#ck-mapa .ckd-cosa { display: flex; gap: 10px; align-items: center; padding: 8px 10px; background: rgba(255,248,226,.65); border: 2px solid rgba(107,74,28,.45); }
#ck-mapa .ckd-cosa.cero { opacity: .5; }
#ck-mapa .ckd-cosa .ic { position: relative; flex: 0 0 48px; width: 48px; height: 48px; background: #2a1e18; border: 2px solid #1a0f08; box-shadow: inset 0 0 0 1px #8a6a3c; }
#ck-mapa .ckd-cosa .ic img { position: absolute; inset: 6px; width: 32px; height: 32px; image-rendering: pixelated; }
#ck-mapa .ckd-cosa .ic b { position: absolute; right: -6px; bottom: -6px; min-width: 22px; height: 20px; line-height: 19px; padding: 0 4px; text-align: center; background: #fff3c8; border: 2px solid #1a0f08; font-size: 14px; color: #2a1608; }
#ck-mapa .ckd-cosa .tx { min-width: 0; font-size: 15px; line-height: 1.2; }
#ck-mapa .ckd-cosa .tx strong { display: block; font-size: 17px; color: #3a1408; }
#ck-mapa .ckd-cosa .tx em { font-style: normal; color: #6b4a24; font-size: 13px; }
#ck-mapa .ckd-monedas { display: flex; gap: 14px; align-items: center; font-size: 18px; font-weight: 700; }
#ck-mapa .ckd-monedas span { display: flex; align-items: center; gap: 6px; }
#ck-mapa .ckd-monedas i { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #1b0f0a; }
#ck-mapa .ckd-ranuras { display: flex; gap: 12px; }
#ck-mapa .ckd-ran { position: relative; width: 60px; height: 60px; background: #07050a; border: 3px solid #1a0f08; box-shadow: inset 0 0 0 1px #8a6a3c; }
#ck-mapa .ckd-ran img { position: absolute; inset: 6px; width: 42px; height: 42px; image-rendering: pixelated; }
#ck-mapa .ckd-ran b { position: absolute; left: 50%; bottom: -11px; transform: translateX(-50%); min-width: 22px; height: 18px; line-height: 17px; text-align: center; background: #fff3c8; border: 2px solid #1a0f08; font-size: 13px; color: #2a1608; }
#ck-mapa .ckd-ayuda { font-size: 14px; color: #6b4a24; }
body:has(#ck-mapa.on) #ck-ayuda, body:has(#ck-mapa.on) #ck-nota { display: none !important; }
#ck-mapa.ckd-objetivos .ckm-pie, #ck-mapa.ckd-inventario .ckm-pie { justify-content: flex-end; }
@media (max-width: 760px) { #ck-mapa .ckd-obj { flex-direction: column; } #ck-mapa .ckd-lista { flex: 0 0 auto; max-height: 40%; } #ck-mapa .ckd-tab { font-size: 16px; padding: 4px 12px; } }
`;
  const st = document.createElement('style'); st.id = 'ckd-css'; st.textContent = css; document.head.append(st);

  // ------------------------------------------------------------------ la ventana
  const TABS = [['mapa', 'Mapa', 'M'], ['objetivos', 'Objetivos', '2'], ['inventario', 'Inventario', '3']];
  let tab = 'mapa', elegido = null;
  const armar = big => {
    if (big._ckd) return;
    big._ckd = true;
    const win = big.querySelector('.ck-win');
    const bar = document.createElement('div'); bar.className = 'ckd-tabs';
    bar.innerHTML = TABS.map(([id, n, k]) => `<div class="ckd-tab" data-t="${id}">${n}<b>${k}</b></div>`).join('');
    win.insertBefore(bar, win.firstChild.nextSibling);
    const obj = document.createElement('div'); obj.className = 'ckd-pane ckd-obj'; obj.innerHTML = '<div class="ckd-lista"></div><div class="ckd-det"></div>';
    const inv = document.createElement('div'); inv.className = 'ckd-pane ckd-inv';
    const pie = win.querySelector('.ckm-pie');
    win.insertBefore(obj, pie); win.insertBefore(inv, pie);
    bar.querySelectorAll('.ckd-tab').forEach(t => t.onclick = () => ir(t.dataset.t));
  };
  const ir = t => {
    tab = t;
    const big = document.getElementById('ck-mapa'); if (!big) return;
    TABS.forEach(([id]) => big.classList.toggle('ckd-' + id, id === t && id !== 'mapa'));
    big.querySelectorAll('.ckd-tab').forEach(x => x.classList.toggle('sel', x.dataset.t === t));
    const S = ESCENA();
    if (S) { if (t === 'objetivos') pintarObj(S); if (t === 'inventario') pintarInv(S); }
    try { sfx.fx('ui_click', 0.4, { rate: 1.1 }); } catch (e) {}
  };
  const listas = S => {
    const D = (diario(S) || []).slice(), sec = secundarias(S);
    // primero lo que está en curso; lo cumplido abajo
    const pri = D.slice().reverse();
    return { pri, sec: sec.filter(x => !x.hecho).concat(sec.filter(x => x.hecho)) };
  };
  const pintarObj = S => {
    const big = document.getElementById('ck-mapa'); if (!big) return;
    anotar(S);
    const { pri, sec } = listas(S), todos = pri.concat(sec);
    if (!elegido || !todos.some(x => x.k === elegido)) elegido = (pri.find(x => !x.hecho) || todos[0] || {}).k || null;
    const it = x => `<div class="ckd-it${x.hecho ? ' hecho' : ''}${x.lista ? ' lista' : ''}${x.k === elegido ? ' sel' : ''}" data-k="${esc(x.k)}"><i></i><span>${esc(x.t)}</span></div>`;
    const lista = big.querySelector('.ckd-lista');
    lista.innerHTML = '<h4>Principales</h4>' + (pri.length ? pri.map(it).join('') : '<div class="ckd-vacio">Todavía nada.</div>') +
      '<h4>Secundarias</h4>' + (sec.length ? sec.map(it).join('') : '<div class="ckd-vacio">Ninguna por ahora. Lancent, Aby y Horos andan por ahí y a veces piden ayuda.</div>');
    lista.querySelectorAll('.ckd-it').forEach(el => el.onclick = () => { elegido = el.dataset.k; pintarObj(S); try { sfx.fx('ui_hover', 0.35); } catch (e) {} });
    const x = todos.find(y => y.k === elegido), det = big.querySelector('.ckd-det');
    if (!x) { det.innerHTML = '<p class="que">Elegí un objetivo de la lista.</p>'; return; }
    const estado = x.hecho ? '<span class="est hecho">Cumplido</span>' : x.lista ? '<span class="est lista">Listo para entregar</span>' : '<span class="est">En curso</span>';
    const sec_ = x.k.indexOf('sq:') === 0;
    det.innerHTML = `<h3>${esc(sec_ ? x.t : (x.hecho ? x.t : x.t))}</h3>${estado}` +
      (sec_ && x.falta ? `<p class="que">${esc(x.falta)}</p>` : !sec_ && !x.hecho ? '<p class="que">Es tu objetivo de ahora.</p>' : '') +
      (x.premio ? `<p class="premio"><b>Premio:</b> ${esc(x.premio)}</p>` : '') +
      `<h5>${x.de ? 'Lo que te dijo ' + esc(x.de) : 'La charla'}</h5><div class="ckd-charla">` +
      (x.lineas && x.lineas.length ? x.lineas.map(l => `<p>${esc(l)}</p>`).join('') : '<p class="sin">No quedó anotada una charla para este objetivo.</p>') + '</div>';
    const sel = lista.querySelector('.ckd-it.sel'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  };
  const pintarInv = S => {
    const big = document.getElementById('ck-mapa'); if (!big) return;
    const s = S.story || {}, inv = s.inv || {}, up = s.up || {}, f = s.flags || {}, I = IC();
    const cosa = (ic, n, nom, txt, cero) => `<div class="ckd-cosa${cero ? ' cero' : ''}"><div class="ic">${ic ? `<img src="${ic}" alt="">` : ''}${n !== null && n !== undefined ? `<b>${n}</b>` : ''}</div><div class="tx"><strong>${esc(nom)}</strong>${txt}</div></div>`;
    const mon = s.coins || 0, oro = Math.floor(mon / 10000), plata = Math.floor(mon / 100) % 100, bronce = mon % 100;
    let h = '<h4>Bolsa</h4><div class="ckd-monedas">' +
      (oro ? `<span><i style="background:radial-gradient(circle at 40% 35%,#fff3b0 0 20%,#f0c040 22% 60%,#9a6a10 62%)"></i>${oro} de oro</span>` : '') +
      `<span><i style="background:radial-gradient(circle at 40% 35%,#ffffff 0 20%,#c8ccd4 22% 60%,#6a707a 62%)"></i>${plata} de plata</span>` +
      `<span><i style="background:radial-gradient(circle at 40% 35%,#ffd8a8 0 20%,#c8783a 22% 60%,#6a3a10 62%)"></i>${bronce} de bronce</span></div>`;
    h += '<h4>Para usar</h4><div class="ckd-grilla">' +
      cosa(I.pocion, inv.potion || 0, 'Poción roja', '<em>Cura 1 corazón · Z</em>', !inv.potion) +
      cosa(I.elixir, inv.elixir || 0, 'Elixir dorado', '<em>Te deja como nuevo · X</em>', !inv.elixir) +
      cosa(I.antorcha, inv.torch || 0, 'Antorcha', '<em>Para la noche · L</em>', !inv.torch) + '</div>';
    const mej = [];
    if (up.atk) mej.push(cosa(I.espada || I.sables, up.atk, 'Piedra de afilar', `<em>+${up.atk} de daño</em>`));
    if (up.sta) mej.push(cosa(I.rayo || I.vigor, up.sta, 'Tónico de aguante', `<em>+${up.sta * 20} de aguante máximo</em>`));
    if (up.hp) mej.push(cosa(I.corazon, up.hp, 'Amuleto de vida', '<em>+1 corazón máximo</em>'));
    if (up.reloj) mej.push(cosa(I.mente || I.ojo, null, 'Reloj de sol', `<em>${f.reloj_guardado ? 'Guardado' : 'Equipado'} · O</em>`));
    if (f.key && (s.step || 0) < 7) mej.push(cosa(I.cadena || I.marca, null, 'Llave de la capilla', '<em>Abre la capilla de las ruinas</em>'));
    try { (window.CK_HEROES_NPC && CK_HEROES_NPC.enCurso ? CK_HEROES_NPC.enCurso(S) : []).forEach(m => { if (m.tipo === 'llevar') mej.push(cosa(I.libro, null, 'Carta de Aby', '<em>Para la Abuela Mirta</em>')); }); } catch (e) {}
    h += '<h4>Mejoras y cosas especiales</h4>' + (mej.length ? '<div class="ckd-grilla">' + mej.join('') + '</div>' : '<div class="ckd-vacio">Nada todavía. La herrería y la tienda venden mejoras.</div>');
    try {
      const EQ = window.CK_EQUIPO, T = (EQ && EQ.TECLAS) || ['Q', 'E', 'R', 'F'];
      if (EQ) {
        const r = EQ.ranuras(S, S.playerHero);
        h += '<h4>Habilidades puestas</h4><div class="ckd-ranuras">' + r.map((id, i) => `<div class="ckd-ran" title="${id ? esc((EQ.def(S.playerHero, id) || {}).n) : 'Vacía'}">${id ? `<img src="${EQ.icono(S.playerHero, id)}" alt="">` : ''}<b>${T[i]}</b></div>`).join('') +
          '</div><div class="ckd-ayuda">Se cambian en el árbol de habilidades (H).</div>';
      }
    } catch (e) {}
    try {
      const LC = window.CK_LECTURAS;
      if (LC) {
        const L = LC.leidas(S);
        h += `<h4>Notas y libros <small style="font-size:14px;color:#8a6a4a;font-weight:600">${L.length} de ${LC.total()}</small></h4>` + (L.length ? '<div class="ckd-grilla">' + L.map(x =>
          `<div class="ckd-cosa ckd-leer" data-id="${esc(x.id)}" style="cursor:pointer"><div class="ic" style="background:${x.tipo === 'libro' ? (x.color || '#7a2418') : '#e8d6a8'}">` +
          `<b style="left:50%;right:auto;bottom:auto;top:50%;transform:translate(-50%,-50%);background:none;border:0;font-size:20px;color:${x.tipo === 'libro' ? '#f3e6c8' : '#6b2414'}">${x.tipo === 'libro' ? '❧' : '✉'}</b></div>` +
          `<div class="tx"><strong>${esc(x.t)}</strong><em>${x.tipo === 'libro' ? 'Libro' : 'Nota'}${x.de ? ' · de ' + esc(x.de) : x.autor ? ' · ' + esc(x.autor) : ''} · clic para leer</em></div></div>`).join('') + '</div>'
          : '<div class="ckd-vacio">Las notas salen de los cofres; los libros, de las casas y los salones.</div>');
      }
    } catch (e) {}
    big.querySelector('.ckd-inv').innerHTML = h;
    big.querySelectorAll('.ckd-leer').forEach(el => el.onclick = () => { const id = el.dataset.id; S.closeOverlay && S.closeOverlay(); setTimeout(() => window.CK_LECTURAS && CK_LECTURAS.abrir(S, id), 60); });
  };

  // ------------------------------------------------------------------ abrir, teclas
  let abierto = false;
  const vigilar = () => {
    const big = document.getElementById('ck-mapa'), S = ESCENA();
    const on = !!(big && big.classList.contains('on') && S && S._overlay === 'ck-mapa');
    if (on && !abierto) { armar(big); ir('mapa'); const pend = (secundarias(S).filter(x => x.lista).length); const pt = big.querySelector('.ckd-tab[data-t="objetivos"]'); if (pt) { let b = pt.querySelector('.pt'); if (pend) { if (!b) { b = document.createElement('span'); b.className = 'pt'; pt.appendChild(b); } b.textContent = pend; } else if (b) b.remove(); } }
    abierto = on;
    requestAnimationFrame(vigilar);
  };
  requestAnimationFrame(vigilar);
  window.addEventListener('keydown', e => {
    if (!abierto) return;
    const S = ESCENA(); if (!S) return;
    const k = e.key;
    if (k === '1' || k === '2' || k === '3') { ir(TABS[+k - 1][0]); }
    else if (k === 'Tab') { const i = TABS.findIndex(t => t[0] === tab); ir(TABS[(i + (e.shiftKey ? 2 : 1)) % 3][0]); }
    else if (tab === 'objetivos' && (k === 'ArrowDown' || k === 'ArrowUp' || k === 's' || k === 'w')) {
      const { pri, sec } = listas(S), todos = pri.concat(sec), i = todos.findIndex(x => x.k === elegido);
      const j = Math.max(0, Math.min(todos.length - 1, i + (k === 'ArrowDown' || k === 's' ? 1 : -1)));
      if (todos[j]) { elegido = todos[j].k; pintarObj(S); }
    }
    else if (k === 'Escape') { S.closeOverlay && S.closeOverlay(); }
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  window.CK_DIARIO = { diario, anotar, secundarias, ir };
})();
