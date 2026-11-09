'use strict';
/* Dificultad elegible (07/11, pedido del dueño: "agregá todo eso"). En Opciones aparece "✦ DIFICULTAD ✦" con tres botones;
   se guarda en el navegador (no en la partida: se puede cambiar cuando quieras) y vale para las bestias que aparecen después.
   - FÁCIL: las bestias tienen 30 % menos de vida, atacan un 25 % más despacio y los golpes de 2 corazones sacan 1.
   - NORMAL: como siempre.
   - DIFÍCIL: 40 % más de vida, atacan un 15 % más seguido, un 8 % más rápidas, y caen la mitad de corazones.
   Va después de ck_vida_fina.js (que recalcula la vida de las bestias al aparecer). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const CLAVE = 'ck_dificultad';
  const NIVELES = {
    facil: { nombre: 'FÁCIL', vida: 0.7, cd: 1.25, vel: 1, dano: -1, corazones: 1, txt: 'Bestias más débiles y lentas' },
    normal: { nombre: 'NORMAL', vida: 1, cd: 1, vel: 1, dano: 0, corazones: 1, txt: 'Como fue pensado' },
    dificil: { nombre: 'DIFÍCIL', vida: 1.4, cd: 0.85, vel: 1.08, dano: 0, corazones: 0.5, txt: 'Más vida, más ataques, menos corazones' }
  };
  const leer = () => { try { const v = localStorage.getItem(CLAVE); return NIVELES[v] ? v : 'normal'; } catch (e) { return 'normal'; } };
  let actual = leer();
  const D = () => NIVELES[actual];

  const se0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = se0.apply(this, arguments);
    try {
      const d = D();
      if (e && e.def && actual !== 'normal' && !e._ckDif) {
        e._ckDif = actual;
        e.hp = e.maxHp = Math.max(0.5, Math.round(e.maxHp * d.vida * 4) / 4);
        e.def = Object.assign({}, e.def, { cd: Math.round(e.def.cd * d.cd), speed: e.def.speed * d.vel, dmg: Math.max(1, e.def.dmg + (e.def.dmg > 1 ? d.dano : 0)) });
        if (e.maxHp > 2 && !e.hpBar) { e.hpBar = this.add.graphics().setDepth(26000); e.once('destroy', () => { if (e.hpBar) e.hpBar.destroy(); }); }
      }
    } catch (er) {}
    return e;
  };
  const hp0 = P.spawnHeartPickup;
  if (hp0) P.spawnHeartPickup = function () { if (Math.random() > D().corazones) return; return hp0.apply(this, arguments); };

  // ------------------------------------------------------------------ en Opciones
  const css = document.createElement('style');
  css.textContent = `
.ck-dif { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 6px 0 4px; }
.ck-dif button { min-width: 120px; }
.ck-dif button.on { outline: 3px solid #fcd34d; outline-offset: 2px; filter: brightness(1.15); }
.ck-dif-txt { text-align: center; margin: 2px 0 8px; opacity: .85; font-size: 14px; }
`;
  document.head.appendChild(css);
  const pintar = () => {
    document.querySelectorAll('.ck-dif button').forEach(b => b.classList.toggle('on', b.dataset.dif === actual));
    const t = document.querySelector('.ck-dif-txt'); if (t) t.textContent = D().txt + (actual === 'normal' ? '' : ' (vale para las bestias que aparezcan desde ahora)');
  };
  const armar = () => {
    if (document.querySelector('.ck-dif')) return;
    const vol = [...document.querySelectorAll('.options-section-divider')].find(d => /VOLUMEN/.test(d.textContent));
    if (!vol) return;
    const sep = document.createElement('div'); sep.className = 'options-section-divider'; sep.innerHTML = '<span>✦ DIFICULTAD ✦</span>';
    const fila = document.createElement('div'); fila.className = 'ck-dif';
    fila.innerHTML = Object.keys(NIVELES).map(k => `<button class="dev-btn" data-dif="${k}">${NIVELES[k].nombre}</button>`).join('');
    const txt = document.createElement('p'); txt.className = 'ck-dif-txt';
    vol.parentNode.insertBefore(sep, vol); vol.parentNode.insertBefore(fila, vol); vol.parentNode.insertBefore(txt, vol);
    fila.querySelectorAll('button').forEach(b => { b.onclick = () => { actual = b.dataset.dif; try { localStorage.setItem(CLAVE, actual); } catch (e) {} pintar(); }; });
    pintar();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
  window.CK_DIFICULTAD = { NIVELES, actual: () => actual, poner: k => { if (NIVELES[k]) { actual = k; try { localStorage.setItem(CLAVE, k); } catch (e) {} pintar(); } } };
})();
