'use strict';
/* Foley de las cinemáticas (11/11, pedido del dueño: "añadile el foley a las cinemáticas, que los NPC tengan también
   sonidos de pasos, y cosas así que requiera la escena").
   - PASOS: todo el que camina en una escena (CK_ESCENA.caminar: Pipo, Doña Rosa, Aby, el héroe llevado por la escena…)
     hace sus pasos según el piso que pisa (pasto, tierra, madera, piedra: la misma regla que los pasos del héroe), al
     ritmo de su velocidad, más bajos cuanto más lejos del centro de la pantalla. Los de armadura (los héroes, los
     guardias, el Rey, los orcos) suman un roce de metal y cuero (ck_paso_armadura, ElevenLabs); los chicos pisan más
     agudo y liviano.
   - GLOBOS: en una escena, cada globo de diálogo aparece con un "pop" suave (ck_globo_pop, ElevenLabs). Fuera de las
     escenas (las charlas sueltas de los vecinos) no suena, para no cansar.
   - ROPA: CK_FOLEY.ropa() (ck_ropa, ElevenLabs) para gestos de tela; lo usa el Rey cuando se limpia la mano en la capa.
   Los mp3 están en assets/audio/sfx/. Borrar la línea de index.html saca todo (las escenas quedan mudas como antes). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA) return;
  const E = window.CK_ESCENA;
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const PASOS = { grass: ['step_grass1', 'step_grass2'], wood: ['step_wood1', 'step_wood2'], stone: ['step_stone1', 'step_stone1'], dirt: ['step_dirt1', 'step_dirt1'] };
  // el piso bajo los pies (igual que los pasos del héroe, player.js)
  const piso = (S, x, y) => {
    if (S.currentInterior) {
      const k = S.currentInterior.building.kind;
      return S.currentInterior.area.surface || (k === 'tienda' ? 'stone' : k === 'granero' ? 'dirt' : 'wood');
    }
    try { if (S._gameMode === 'campaign' && S.layerRoad && S.layerRoad.getTileAtWorldXY && S.layerRoad.getTileAtWorldXY(x, y - 2)) return 'dirt'; } catch (e) {}
    return 'grass';
  };
  const ARMADURA = /^(soldier|swordsman|g_|king|ck_rey|ckc_rey|orc|skeleton_armored|templar)/, CHICO = /^(npc13|npc8)_/;
  const cerca = (S, sp) => {
    const v = S.cameras.main.worldView, d = Math.hypot(sp.x - v.centerX, sp.y - v.centerY);
    return Math.max(0.12, Math.min(1, 1 - d / 420));
  };
  const paso = (S, sp, flip) => {
    if (!sp || !sp.active || !sp.visible) return;
    const tex = (sp.texture && sp.texture.key) || '', sup = piso(S, sp.x, sp.y), n = PASOS[sup], k = cerca(S, sp);
    const chico = CHICO.test(tex), arm = ARMADURA.test(tex);
    son(n[flip ? 0 : 1], (sup === 'grass' ? 0.4 : 0.5) * k * (chico ? 0.8 : 1), { rate: (chico ? 1.22 : arm ? 0.9 : 1) * (0.94 + Math.random() * 0.12) });
    if (arm) son('ck_paso_armadura', 0.32 * k, { rate: 0.92 + Math.random() * 0.16 });
  };
  const cam0 = E.caminar;
  E.caminar = function (S, sp, x, y, vel) {
    const p = cam0.apply(this, arguments);
    try {
      if (S && sp && sp.active && S.time) {
        const cada = Math.max(230, Math.min(460, 17000 / Math.max(20, vel || 70)));
        let flip = false;
        const ev = S.time.addEvent({ delay: cada, loop: true, startAt: cada - 110, callback: () => { flip = !flip; paso(S, sp, flip); } });
        const fin = () => { try { ev.remove(); } catch (e) {} };
        if (p && p.then) p.then(fin, fin); else S.time.delayedCall(4000, fin);
        S.time.delayedCall(20000, fin);   // seguro
      }
    } catch (e) {}
    return p;
  };
  // los globos avisan cuando aparecen (ck_globos.js v3)
  const alAparecer = (S, sp) => { if (S && S._ckEscena) son('ck_globo_pop', 0.32 * (sp ? cerca(S, sp) : 1), { rate: 0.95 + Math.random() * 0.2, minGap: 90 }); };
  const engancharGlobos = () => { if (window.CK_GLOBOS) window.CK_GLOBOS.alAparecer = alAparecer; };
  engancharGlobos(); addEventListener('load', engancharGlobos);
  window.CK_FOLEY = { paso, piso, ropa: (v, o) => son('ck_ropa', v === undefined ? 0.55 : v, o), pop: alAparecer };
})();
