'use strict';
/* Las Afueras Orcas (10/11, pedido del dueño: "la parte de afuera del mapa de los orcos… un terreno baldío con la distribución
   de un mapa RPG"): mapa nuevo del Taller (afueras_orcas, de las capas de Flow que mandó el dueño, con la paleta de las Tierras)
   entre el Sendero Orco y el Pueblo Orco: el camino cruza el baldío (costillar de una bestia gigante, círculo de piedras con
   tótem, charca seca con huesos, chabolas de carroñeros, un basural de carretas) y entra al pueblo por el portón de la
   empalizada, entre las dos torres.
   - Sendero, derecha → Afueras (entra por la izquierda). Afueras, derecha (portón) → Pueblo Orco; izquierda → Sendero.
   - Salir del Pueblo por el oeste vuelve a las Afueras.
   - Desde el paso 4 hay carroñeros orcos y un huargo.
   Va después de ck_sendero_orco.js. Borrar su línea de index.html: el Sendero vuelve a ir directo al Pueblo. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA;
  const ID = 'afueras_orcas', SENDERO = 'sendero_orco', PUEBLO = 'pueblo_orco';
  if (!D || !D.mapas || !D.mapas[ID] || !INTERIOR_LAYOUTS['ed_' + ID]) return;
  const Z = 'ed_' + ID + '.main', ZP = 'ed_' + PUEBLO + '.main', ZS = 'ed_' + SENDERO + '.main';
  const LLEGA = { izq: { x: 26, y: 228 }, der: { x: 924, y: 151 }, sendero: { x: 930, y: 234 }, pueblo: { x: 64, y: 136 } };
  const PATRULLA = [['orc', 300, 300], ['orc', 640, 260], ['orc_armored', 700, 420], ['warg', 470, 170]];
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');

  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      a.exits = a.exits || []; a.fx = a.fx || []; a.talkers = a.talkers || [];
      a.exits.push({ x: 0, y: 196, w: 12, h: 64, key: 'walk', to: 'af_sendero', hint: '◀ Sendero Orco' });
      a.exits.push({ x: 946, y: 134, w: 12, h: 34, key: 'walk', to: 'af_pueblo', hint: '▶ Pueblo Orco' });
      a.fx.push({ type: 'dust', x: 0, y: 80, w: 958, h: 400 });
      a.talkers.push({ x: 490, y: 175, r: 60, lines: ['Los huesos de una bestia enorme. Los orcos dicen que la cazó el primer caudillo'] });
      a.talkers.push({ x: 150, y: 110, r: 48, lines: ['Un círculo de piedras con un tótem de calavera. Huele a sangre vieja'] });
      a.talkers.push({ x: 360, y: 430, r: 60, lines: ['Una charca seca, llena de huesos. Acá no llueve hace mucho'] });
      a.talkers.push({ x: 860, y: 150, r: 40, lines: ['El portón del Pueblo Orco. Las torres vigilan el camino'] });
    }
    return r;
  };
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (typeof nombre === 'string' && !this._doorTransition && this._gameMode === 'campaign') {
      if (nombre === 'so_pueblo') { this.ckEntrar(ID, LLEGA.izq); return; }       // del Sendero a las Afueras
      if (nombre === 'af_sendero') { this.ckEntrar(SENDERO, LLEGA.sendero); return; }
      if (nombre === 'af_pueblo') { this.ckEntrar(PUEBLO, LLEGA.pueblo); return; }
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const z = zona(this);
    if (!this._doorTransition && this._gameMode === 'campaign') {
      if (z === ZP && this.ckEntrar(ID, LLEGA.der)) return;                        // del Pueblo, por el oeste, a las Afueras
      if (z === Z && this.ckEntrar(SENDERO, LLEGA.sendero)) return;
    }
    return salir0.apply(this, arguments);
  };

  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      if (this._gameMode !== 'campaign' || zona(this) !== Z || paso(this.story) < 4 || !this.currentInterior) return r;
      const a = this.currentInterior.area;
      if (this.enemies && this.enemies.getChildren().some(e => e.active && !e.isDead && e.zone === Z)) return r;
      PATRULLA.forEach(([t, x, y]) => { const e = this.spawnEnemy(a.x + x, a.y + y, ENEMY_TYPES[t] ? t : 'orc'); if (e) e.zone = Z; });
    } catch (e) { console.warn('[afueras]', e); }
    return r;
  };

  try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.push([/^afueras_orcas$/, 'La Frontera Orca']); } catch (e) {}
  try {
    const MM = window.CK_MINIMAPA;
    if (MM && MM.Z) {
      if (!MM.Z[Z]) MM.Z[Z] = { img: ID, esc: 4, w: 958, h: 534, ext: 1, n: 'Afueras Orcas', g: 'Camino al Castillo' };
      if (MM.L) {
        MM.L[Z] = [{ n: 'Costillar de la bestia', x: 490, y: 160, ic: 'estrella' }, { n: 'Sendero Orco', x: 6, y: 228, ic: 'flecha', d: 'o', va: ZS },
          { n: 'Pueblo Orco', x: 952, y: 151, ic: 'flecha', d: 'e', va: ZP }];
        (MM.L[ZS] || []).forEach(l => { if (l.va === ZP) { l.n = 'Afueras Orcas'; l.va = Z; } });
        (MM.L[ZP] || []).forEach(l => { if (l.va === ZS || /Tierras|Sendero/.test(l.n)) { l.n = 'Volver a las Afueras'; l.va = Z; } });
      }
    }
  } catch (e) {}
  window.CK_AFUERAS_ORCAS = { ID, Z, LLEGA };
})();
