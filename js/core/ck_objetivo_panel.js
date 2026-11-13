'use strict';
/* Panel del objetivo, legible y ordenado (12/11, pedidos del dueño: "el panel de objetivo que sale al lado es tosco y se lee
   poco, habría que poner algo más legible y organizado" y "no sobreexpliques cosas como de dónde vinieron o dónde está una
   dirección en especial si ya está marcado en el mapa").
   No toca lo que escriben los demás módulos en #ck-objective (.ck-obj-text, .ck-obj-side, .ck-obj-purse siguen ahí y se
   leen igual): los esconde y arma al lado una VISTA limpia que se rehace cada vez que cambian.
   - Arriba: "OBJETIVO" chico y, si hay cuenta, la cuenta como una pastilla (2/3) con una barrita.
   - El objetivo en letra grande y clara, SIN las aclaraciones de lugar entre paréntesis (el camino ya está en el mapa: M).
     Si trae un "antes, …" o pasos con "·", van como lista con rombos debajo.
   - Las misiones secundarias en curso, en un bloque aparte con su título "Secundarias".
   - Abajo, en una línea fina: experiencia (con barrita), día o noche y el clima. Las monedas ya están en el HUD.
   - El panel es oscuro y semitransparente, del mismo estilo que el HUD medallón (borde fino con el color del héroe).
   - Pasados 12 s sin cambios se achica: queda sólo el objetivo (como antes).
   Borrar su línea de index.html vuelve al pergamino de antes. */
(function () {
  if (typeof document === 'undefined') return;
  const css = `
html body.ckO #ck-objective#ck-objective { top: 60px !important; right: 12px !important; border-width: 0 !important; border-style: none !important; width: 300px !important; box-sizing: border-box; padding: 9px 13px 8px !important; text-align: left !important;
  border: 0 !important; border-image: none !important; background: linear-gradient(180deg, rgba(20,14,14,.9), rgba(14,10,10,.86)) !important;
  box-shadow: inset 0 0 0 1px var(--ckM-aro, #7a5a2c), 0 0 0 2px #0b0607, 0 6px 14px rgba(0,0,0,.45) !important; filter: none !important;
  color: #f3ead9 !important; font-family: var(--ck2-f, 'CK Grenze', Grenze, serif) !important; transition: opacity .3s, padding .3s; }
html body.ckO #ck-objective#ck-objective > .ck-obj-head, html body.ckO #ck-objective#ck-objective > .ck-obj-text, html body.ckO #ck-objective#ck-objective > .ck-obj-side, html body.ckO #ck-objective#ck-objective > .ck-obj-purse { display: none !important; }
#ck-objective .ckO-cab { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
#ck-objective .ckO-cab i { width: 8px; height: 8px; background: var(--ckM-glow, #e2b04a); transform: rotate(45deg); box-shadow: 0 0 6px var(--ckM-glow, #e2b04a); flex: none; }
#ck-objective .ckO-cab b { font-size: 13px; letter-spacing: 2.5px; color: #e2c48a; font-weight: 700; }
#ck-objective .ckO-cab .cuenta { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; color: #fff3c8; }
#ck-objective .ckO-cab .cuenta em { display: block; width: 46px; height: 5px; background: rgba(255,255,255,.12); border: 1px solid #000; }
#ck-objective .ckO-cab .cuenta em span { display: block; height: 100%; background: linear-gradient(90deg, #e2b04a, #fff0a8); }
#ck-objective .ckO-tit { font-size: 18px; line-height: 1.22; font-weight: 600; color: #fbf3e2; text-shadow: 0 2px 0 rgba(0,0,0,.6); }
#ck-objective .ckO-tit .clave, #ck-objective .ckO-tit .ck-clave { color: #ff6a50; font-weight: 700; }
#ck-objective .ckO-pasos { margin: 5px 0 0; padding: 0; list-style: none; }
#ck-objective .ckO-pasos li { position: relative; padding-left: 14px; font-size: 15px; line-height: 1.22; color: #e6d8bc; margin-top: 2px; }
#ck-objective .ckO-pasos li::before { content: ''; position: absolute; left: 1px; top: 6px; width: 5px; height: 5px; background: #b8862b; transform: rotate(45deg); }
#ck-objective .ckO-sec { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(226,196,138,.22); }
#ck-objective .ckO-sec b { display: block; font-size: 12px; letter-spacing: 2px; color: #a8c4e8; margin-bottom: 2px; }
#ck-objective .ckO-sec div { position: relative; padding-left: 14px; font-size: 14px; line-height: 1.2; color: #d8e2ee; margin-top: 2px; }
#ck-objective .ckO-sec div::before { content: ''; position: absolute; left: 1px; top: 6px; width: 5px; height: 5px; background: #6a9ad8; transform: rotate(45deg); }
#ck-objective .ckO-pie { display: flex; align-items: center; gap: 10px; margin-top: 7px; padding-top: 5px; border-top: 1px solid rgba(226,196,138,.18); font-size: 13px; color: #c8b898; }
#ck-objective .ckO-pie .xp { display: flex; align-items: center; gap: 5px; }
#ck-objective .ckO-pie .xp em { display: block; width: 54px; height: 4px; background: rgba(255,255,255,.12); border: 1px solid #000; }
#ck-objective .ckO-pie .xp em span { display: block; height: 100%; background: #7fb0ff; }
#ck-objective .ckO-pie .der { margin-left: auto; display: flex; gap: 8px; }
#ck-objective.ckO-min .ckO-pasos, #ck-objective.ckO-min .ckO-sec, #ck-objective.ckO-min .ckO-pie { display: none; }
#ck-objective.ckO-min { padding-bottom: 7px !important; }
html body.ck-movil.ckO #ck-objective#ck-objective { width: 250px !important; transform: scale(.8); transform-origin: 100% 0; }
`;
  const st = document.createElement('style'); st.id = 'ckO-css'; st.textContent = css; document.head.append(st);
  document.body ? document.body.classList.add('ckO') : document.addEventListener('DOMContentLoaded', () => document.body.classList.add('ckO'));

  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // lo que se saca: aclaraciones de lugar entre paréntesis ("(camino del sur)", "(sendero noroeste de la aldea)", "(jardín del castillo)")
  const sinLugar = t => t.replace(/\s*\((?![^)]*\d+\s*\/\s*\d+)[^)]{3,80}\)/g, '').replace(/\s{2,}/g, ' ').trim();
  const armar = (box) => {
    const txtEl = box.querySelector('.ck-obj-text'); if (!txtEl) return;
    let html = txtEl.innerHTML;                                       // puede traer <b class="ck-clave"> del entrenamiento
    let plano = txtEl.textContent || '';
    // la cuenta: "(2/3)" o "· 2/3"
    let cuenta = null;
    const m = plano.match(/(?:\(|·\s*)(\d+)\s*\/\s*(\d+)\)?\s*$/);
    if (m) { cuenta = [+m[1], +m[2]]; }
    const quitarCuenta = t => t.replace(/\s*(?:\(\d+\s*\/\s*\d+\)|·\s*\d+\s*\/\s*\d+)\s*$/, '');
    // pasos: lo que viene después de " · " (o "Antes, …")
    const partes = quitarCuenta(html).split(/\s+·\s+/).map(x => sinLugar(x)).filter(Boolean);
    const tit = partes.shift() || '';
    const sec = [...box.querySelectorAll('.ck-obj-side > div')].map(d => sinLugar(d.textContent || '')).filter(Boolean);
    // el pie: experiencia, día/noche, clima (de lo que dejaron los otros módulos)
    const purse = box.querySelector('.ck-obj-purse'), pt = purse ? purse.textContent : '';
    const xp = pt.match(/EXP\s*(\d+)\s*\/\s*(\d+)/);
    const dia = /Noche/.test(pt) ? '☾ Noche' : /D[ií]a/.test(pt) ? '☀ Día' : '';
    const clima = purse && purse.querySelector('.ck-clima') ? purse.querySelector('.ck-clima').textContent : '';
    let v = box.querySelector('.ckO-vista');
    if (!v) { v = document.createElement('div'); v.className = 'ckO-vista'; box.appendChild(v); }
    const nuevo = `<div class="ckO-cab"><i></i><b>OBJETIVO</b>${cuenta ? `<span class="cuenta">${cuenta[0]}/${cuenta[1]}<em><span style="width:${Math.round(100 * Math.min(1, cuenta[0] / Math.max(1, cuenta[1])))}%"></span></em></span>` : ''}</div>` +
      `<div class="ckO-tit">${tit}</div>` +
      (partes.length ? `<ul class="ckO-pasos">${partes.map(p => `<li>${p.replace(/^Antes,\s*/i, 'Antes: ')}</li>`).join('')}</ul>` : '') +
      (sec.length ? `<div class="ckO-sec"><b>SECUNDARIAS</b>${sec.map(s => `<div>${esc(s)}</div>`).join('')}</div>` : '') +
      ((xp || dia || clima) ? `<div class="ckO-pie">${xp ? `<span class="xp">EXP<em><span style="width:${Math.round(100 * Math.min(1, +xp[1] / Math.max(1, +xp[2])))}%"></span></em>${xp[1]}/${xp[2]}</span>` : ''}<span class="der">${dia ? `<span>${dia}</span>` : ''}${clima ? `<span>${esc(clima)}</span>` : ''}</span></div>` : '');
    if (v._h !== nuevo) {
      const cambioTit = v._tit !== tit;
      v._h = nuevo; v._tit = tit; v.innerHTML = nuevo;
      if (cambioTit) { box.classList.remove('ckO-min'); box._ckOt = Date.now(); }
    }
  };
  let obs = null;
  const vigilar = () => {
    const box = document.getElementById('ck-objective');
    if (box && !box._ckO) {
      box._ckO = true;
      obs = new MutationObserver(() => { if (!box._ckOarmando) { box._ckOarmando = true; try { armar(box); } finally { box._ckOarmando = false; } } });
      obs.observe(box, { childList: true, subtree: true, characterData: true });
      armar(box);
    }
    if (box && box._ckOt && Date.now() - box._ckOt > 12000) box.classList.add('ckO-min');
    setTimeout(vigilar, 500);
  };
  vigilar();
  window.CK_OBJ_PANEL = { sinLugar };
})();
