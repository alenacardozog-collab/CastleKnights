'use strict';
/* El Pueblo Orco con el dibujo nuevo (12/11, pedido del dueño: "cambiá el mapa del pueblo orco por este"): tres terrazas
   separadas por paredes de roca, unidas por rampas de tablones; el fogón hundido en el medio. Mismo mapa del Taller
   (pueblo_orco, 958×534) con suelo, piezas (ed_op3_*) y choques nuevos; la paleta llevada a la del dibujo anterior.
   Este archivo acomoda lo que dependía del dibujo viejo:
   - la salida a la Fortaleza (arriba) queda sobre el camino nuevo, y se llega desde la Fortaleza al pie del camino; la del
     oeste (a las Tierras / Afueras) baja un poco, al hueco entre el cerco y la pared de roca;
   - Gorak, el desterrado, se muda al lado del corral; los cerdos que hozaban junto a su choza, al corral;
   - los carteles de la casa del jefe y del portón del norte, a la puerta de la casa grande (abajo a la derecha) y al camino nuevo;
   - las piezas nuevas se ordenan enteras (ck_profundidad.js).
   Va DESPUÉS de ck_capitulo2.js, ck_frontera_animada.js y ck_coliseo_historia.js. Borrar su línea deja la salida, Gorak y los
   cerdos donde estaban con el dibujo viejo (el dibujo nuevo sigue, porque está en editor_data.js). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const D = window.EDITOR_DATA || {}, ID = 'pueblo_orco', Z = 'ed_' + ID + '.main';
  if (!D.mapas || !D.mapas[ID] || !/_v3$/.test(D.mapas[ID].suelo || '')) return;
  const P = MainGameScene.prototype;
  const SALIDA_FORT = { x: 776, y: 0, w: 72, h: 16 }, LLEGA_FORT = { x: 808, y: 46 };
  const GORAK = { x: 262, y: 372 };
  try { if (window.CK_PROF_ENTEROS && !CK_PROF_ENTEROS.test('ed_op3_x')) window.CK_PROF_ENTEROS = new RegExp(CK_PROF_ENTEROS.source.replace(')_', '|op3)_')); } catch (e) {}
  // Gorak
  try {
    const g = (typeof STORY_NPCS !== 'undefined') && STORY_NPCS.find(n => n.id === 'gorak');
    if (g) { g.x = GORAK.x; g.y = GORAK.y; }
    const MM = window.CK_MINIMAPA;
    const mover = () => { try { (MM && MM.L && MM.L[Z] || []).forEach(l => { if (l.n === 'Gorak') { l.x = GORAK.x; l.y = GORAK.y; } if (l.va && /fortaleza/.test(l.va)) { l.x = 812; l.y = 4; } }); } catch (e) {} };
    document.addEventListener('DOMContentLoaded', mover); mover();
  } catch (e) {}
  // la salida a la Fortaleza y los cerdos
  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  if (L0) INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    try {
      if (a) {
        (a.exits || []).forEach(e => { if (e.to === 'c2_fortaleza') Object.assign(e, SALIDA_FORT); if (e.to === 'outside' && e.x < 40) Object.assign(e, { x: 0, y: 128, w: 26, h: 64 }); });
        (a.talkers || []).forEach(t => {                                   // los carteles de la casa del jefe y del portón
          const l = (t.lines && t.lines[0]) || '';
          if (/^La casa del jefe/.test(l)) { t.x = 785; t.y = 470; }
          else if (/portón del norte/.test(l)) { t.x = 808; t.y = 52; }
        });
        let k = 0;
        (a.actors || []).forEach(ac => {
          if (ac.key !== 'ck_cerdo_idle' || !ac.pts || !ac.pts.length || ac.pts[0][1] > 400) return;
          const dx = 150 + (k++ % 2) * 70, dy = 460 - ac.pts[0][1];       // de al lado de la choza vieja al corral
          ac.pts = ac.pts.map(([x, y, t]) => [x + dx - 60, y + dy + 10, t]);
        });
      }
    } catch (e) { console.warn('[pueblo orco 3]', e); }
    return r;
  };
  // llegar desde la Fortaleza: al pie del camino nuevo
  const ent0 = P.ckEntrar;
  if (ent0) P.ckEntrar = function (id, p) {
    if (id === ID && p && p.x === 778 && p.y === 50) p = LLEGA_FORT;
    return ent0.call(this, id, p);
  };
})();
