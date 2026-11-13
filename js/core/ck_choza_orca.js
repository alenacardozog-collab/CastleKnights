'use strict';
/* Las chozas orcas por dentro (12/11, pedido del dueño: "algún prompt para interiores de chozas de orcos"; mandó las tres capas).
   Mapa nuevo del Taller choza_orca (480×268, el tamaño de los interiores; piezas ed_cho_*): el fogón con la carne, camas de
   pieles, la mesa con el hacha, el armero, el tambor, cajones y barriles, el poste con el cráneo.
   - En el Pueblo Orco, T en la puerta de las chozas (cinco con el dibujo viejo, seis con el nuevo) lleva adentro; al salir (abajo, al centro) se vuelve a esa puerta.
   - Luz del fuego que titila; un cofre del juego; en dos de las cinco chozas hay un orco adentro.
   Borrar su línea de index.html deja las chozas cerradas como antes. */
window.CK_CHOZA_MINI = 'data:image/png;base64,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';
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const D = window.EDITOR_DATA || {}, ID = 'choza_orca', PUEBLO = 'pueblo_orco';
  if (!D.mapas || !D.mapas[ID] || !D.mapas[PUEBLO] || !INTERIOR_LAYOUTS['ed_' + ID]) return;
  const Z = 'ed_' + ID + '.main', ZP = 'ed_' + PUEBLO + '.main';
  const P = MainGameScene.prototype;
  // las puertas de las chozas del Pueblo Orco (punto delante de la puerta) y si adentro duerme un orco
  // (v2, 12/11) las puertas del Pueblo Orco nuevo (ck_pueblo_orco3.js): las seis chozas con puerta a la vista
  const NUEVO = /_v3$/.test((D.mapas[PUEBLO] && D.mapas[PUEBLO].suelo) || '');
  const PUERTAS = NUEVO
    ? [{ x: 180, y: 122, orco: false }, { x: 393, y: 124, orco: true }, { x: 612, y: 124, orco: false },
      { x: 125, y: 298, orco: true }, { x: 815, y: 274, orco: false }, { x: 205, y: 456, orco: false }]
    : [{ x: 178, y: 106, orco: false }, { x: 396, y: 114, orco: true }, { x: 606, y: 114, orco: false },
      { x: 128, y: 264, orco: true }, { x: 186, y: 442, orco: false }];
  const LLEGA = { x: 240, y: 246 };
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const cerca = S => {
    if (zona(S) !== ZP || !S.currentInterior || !S.currentInterior.area || !S.player) return null;
    const a = S.currentInterior.area, p = pies(S);
    return PUERTAS.find(d => Math.hypot(p.x - (a.x + d.x), p.y - (a.y + d.y)) < 30) || null;
  };
  const cofre = S => {
    const s = S && S.story; if (!s) return;
    s.flags = s.flags || {}; const pos = (s.flags.cofres_pos3 = s.flags.cofres_pos3 || {});
    if (!pos[Z]) pos[Z] = [[438, 232]];
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const d = !this._overlay && !this.dialogOpen && this._gameMode === 'campaign' && cerca(this);
      if (d) { this._ckChozaDe = d; cofre(this); if (!this._doorTransition && this.ckEntrar) this.ckEntrar(ID, LLEGA); return; }
    } catch (e) { console.warn('[choza]', e); }
    return i0.apply(this, arguments);
  };
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'cho_salir' && this._gameMode === 'campaign') {
      const d = this._ckChozaDe || PUERTAS[0];
      if (!this._doorTransition && this.ckEntrar) this.ckEntrar(PUEBLO, { x: d.x, y: d.y + 8 });
      return;
    }
    return sw0.apply(this, arguments);
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (zona(this) !== ZP) return r;
      const pr = document.getElementById('ck-prompt'), si = !this.dialogOpen && cerca(this);
      if (pr && si && (!pr.classList.contains('on') || this._ckChoCartel)) { pr.textContent = 'T · Entrar a la choza'; pr.classList.add('on'); this._ckChoCartel = true; }
      else if (pr && !si && this._ckChoCartel) { this._ckChoCartel = false; if (pr.textContent === 'T · Entrar a la choza') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };
  // un orco adentro, en dos de las chozas
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try {
      if (zona(this) === Z && this._ckChozaDe && this._ckChozaDe.orco && this.spawnEnemy && this.currentInterior) {
        const a = this.currentInterior.area, t = typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.orc_brute ? 'orc_brute' : 'orc';
        if (typeof ENEMY_TYPES === 'undefined' || ENEMY_TYPES[t]) { const e = this.spawnEnemy(a.x + 330, a.y + 205, t); if (e) e._ckDormido = true; }
      }
    } catch (e) { console.warn('[choza]', e); }
    return r;
  };
  // el mapa
  const L0 = INTERIOR_LAYOUTS['ed_' + ID];
  INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = L0.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      ['talkers', 'exits', 'items', 'fx'].forEach(k => (a[k] = a[k] || []));
      a.ambient = [['amb_fire', 0.45]];
      a.exits.push({ x: 200, y: 268 - 8, w: 80, h: 8, key: 'walk', to: 'cho_salir', hint: '▼ Salir' });
      const habla = (x, y, lines, rr) => a.talkers.push({ x, y, r: rr || 20, lines });
      habla(240, 175, ['Carne de jabalí al fuego. Huele bien… para ser orco'], 22);
      habla(105, 205, ['Un hacha de dos manos sobre la mesa, con la hoja mellada'], 22);
      habla(80, 120, ['Lanzas y cuchillas apoyadas en el armero'], 20);
      habla(398, 170, ['Un tambor de guerra de cuero tensado. Mejor no tocarlo'], 20);
      habla(408, 100, ['Un cráneo con cuernos y una marca roja: el símbolo de la tribu'], 20);
    }
    return r;
  };
  // luz del fuego, música, minimapa, carga
  const instalar = () => {
    if (instalar.ok) return; instalar.ok = true;
    if (window.CK_LUZ && CK_LUZ.fuente) CK_LUZ.fuente((S, out) => {
      if (zona(S) !== Z || !S.currentInterior || !S.currentInterior.area) return;
      const a = S.currentInterior.area, t = (S.time && S.time.now) || 0;
      out.push({ x: a.x + 240, y: a.y + 140, c: [255, 160, 80], r: 120, f: 0.9 * (0.85 + 0.08 * Math.sin(t / 90) + 0.07 * Math.sin(t / 37)) });
    });
    try { window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + ID]: 'casa' }); } catch (e) {}
    try { if (window.CK_PROF_ENTEROS) window.CK_PROF_ENTEROS = new RegExp(CK_PROF_ENTEROS.source.replace(')_', '|cho)_')); } catch (e) {}
    try { if (window.CK_ROMPIBLES && CK_ROMPIBLES.COFRES && !CK_ROMPIBLES.COFRES[Z]) CK_ROMPIBLES.COFRES[Z] = 1; } catch (e) {}
    try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.unshift([/^choza_orca$/, 'El Pueblo Orco']); } catch (e) {}
    try {
      const MM = window.CK_MINIMAPA;
      if (MM && MM.Z) { MM.Z[Z] = { img: ID, esc: 4, w: 480, h: 268, ext: 0, n: 'Choza orca', g: 'Pueblo Orco' }; if (MM.dibujo) MM.dibujo(ID, window.CK_CHOZA_MINI); }
    } catch (e) {}
  };
  document.addEventListener('DOMContentLoaded', instalar);
})();
