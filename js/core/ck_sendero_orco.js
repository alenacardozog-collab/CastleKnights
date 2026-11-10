'use strict';
/* El Sendero Orco (10/11, pedido del dueño: "que la parte de los orcos sea más extensa, tipo el camino"): un mapa nuevo del
   Taller (sendero_orco, de las capas de Flow que mandó el dueño, con la paleta de las Tierras) entre las Tierras Orcas y el
   Pueblo Orco: el camino de tierra cruza la grieta por el puente de sogas, con una choza, estandartes y un fogón orco.
   - Tierras Orcas, salida del este → Sendero (entra por la izquierda). Sendero, derecha → Pueblo Orco; izquierda → Tierras.
   - Salir del Pueblo por el oeste vuelve al Sendero (ya no directo a las Tierras).
   - Desde el paso 4 (los vigías) hay una patrulla orca en el sendero.
   Borrar su línea de index.html: Tierras y Pueblo vuelven a estar pegados, como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA;
  const ID = 'sendero_orco', TIERRAS = 'tierras_orcas', PUEBLO = 'pueblo_orco';
  if (!D || !D.mapas || !D.mapas[ID] || !INTERIOR_LAYOUTS['ed_' + ID]) return;
  const Z = 'ed_' + ID + '.main', ZP = 'ed_' + PUEBLO + '.main';
  const LLEGA = { izq: { x: 26, y: 262 }, der: { x: 930, y: 234 }, tierras: { x: 916, y: 134 }, pueblo: { x: 64, y: 136 } };
  const PATRULLA = [['orc', 250, 380], ['orc', 700, 160], ['orc_armored', 760, 380], ['warg', 330, 150]];
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');

  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      a.exits = a.exits || []; a.fx = a.fx || []; a.talkers = a.talkers || [];
      a.exits.push({ x: 0, y: 214, w: 12, h: 90, key: 'walk', to: 'so_tierras', hint: '◀ Tierras Orcas' });
      a.exits.push({ x: 946, y: 190, w: 12, h: 90, key: 'walk', to: 'so_pueblo', hint: '▶ Pueblo Orco' });
      a.fx.push({ type: 'dust', x: 0, y: 100, w: 958, h: 420 });
      a.talkers.push({ x: 490, y: 280, r: 46, lines: ['Un puente de sogas sobre la grieta. Cruje, pero aguanta'] });
      a.talkers.push({ x: 800, y: 130, r: 50, lines: ['Una choza de vigía orca. Huele a humo y a cuero viejo'] });
    }
    return r;
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (typeof nombre === 'string' && !this._doorTransition && this._gameMode === 'campaign') {
      if (nombre === 'c2_pueblo') { this.ckEntrar(ID, LLEGA.izq); return; }        // de las Tierras al Sendero
      if (nombre === 'so_tierras') { this.ckEntrar(TIERRAS, LLEGA.tierras); return; }
      if (nombre === 'so_pueblo') { this.ckEntrar(PUEBLO, LLEGA.pueblo); return; }
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const z = zona(this);
    if (!this._doorTransition && this._gameMode === 'campaign') {
      if (z === ZP && this.ckEntrar(ID, LLEGA.der)) return;                         // del Pueblo, por el oeste, al Sendero
      if (z === Z && this.ckEntrar(TIERRAS, LLEGA.tierras)) return;
    }
    return salir0.apply(this, arguments);
  };

  // la patrulla
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      if (this._gameMode !== 'campaign' || zona(this) !== Z || paso(this.story) < 4 || !this.currentInterior) return r;
      const a = this.currentInterior.area;
      if (this.enemies && this.enemies.getChildren().some(e => e.active && !e.isDead && e.zone === Z)) return r;
      PATRULLA.forEach(([t, x, y]) => {
        const e = this.spawnEnemy(a.x + x, a.y + y, ENEMY_TYPES[t] ? t : 'orc');
        if (e) e.zone = Z;
      });
    } catch (e) { console.warn('[sendero]', e); }
    return r;
  };

  // pantalla de carga y minimapa
  try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.push([/^(sendero_orco|patio_fortaleza_orca|coliseo_orco)$/, 'La Frontera Orca']); } catch (e) {}
  try {
    const MM = window.CK_MINIMAPA;
    if (MM && MM.Z) {
      if (!MM.Z[Z]) MM.Z[Z] = { img: ID, esc: 4, w: 958, h: 534, ext: 1, n: 'Sendero Orco', g: 'Camino al Castillo' };
      if (MM.L) {
        MM.L[Z] = [{ n: 'Puente de sogas', x: 490, y: 280, ic: 'estrella' }, { n: 'Tierras Orcas', x: 6, y: 258, ic: 'flecha', d: 'o', va: 'ed_' + TIERRAS + '.main' },
          { n: 'Pueblo Orco', x: 952, y: 234, ic: 'flecha', d: 'e', va: ZP }];
        const T = MM.L['ed_' + TIERRAS + '.main'], Pu = MM.L[ZP];
        (T || []).forEach(l => { if (l.va === ZP) { l.n = 'Sendero Orco'; l.va = Z; } });
        (Pu || []).forEach(l => { if (/Tierras/.test(l.n)) { l.n = 'Volver al Sendero Orco'; l.va = Z; } });
      }
    }
  } catch (e) {}
  window.CK_SENDERO_ORCO = { ID, Z, LLEGA };
})();
