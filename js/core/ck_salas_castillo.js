'use strict';
/* Aposentos del Rey y Biblioteca nuevos (mapas del Taller hechos desde imágenes de Google Flow):
   - los arcos del Gran Salón (Salón del Trono 3) llevan a estos mapas en vez de a las salas viejas del castillo;
   - su salida de abajo vuelve al Gran Salón, frente al arco por el que se entró;
   - el Maestre Eloy pasa a la biblioteca nueva, al lado de su escritorio;
   - luz de sala, eco de madera y sonido de ambiente como las salas viejas.
   Va fuera del bloque del Taller en index.html. Si un mapa no está, todo queda como antes. Borrar su línea en index.html lo apaga. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen);
  const TRONO = 'salon_del_trono_3';
  // sala vieja -> mapa nuevo, y dónde aparece uno en el Gran Salón al volver (frente a su arco)
  const SALAS = {
    kingroom: { id: 'aposentos_del_rey', vuelta: { x: 64, y: 86 }, sala: [196, 184, 170], sonido: [['amb_fire', 0.5]] },
    library: { id: 'biblioteca', vuelta: { x: 416, y: 86 }, sala: [192, 182, 170], sonido: [['amb_hall', 0.35]] }
  };
  const activas = Object.keys(SALAS).filter(k => hay(SALAS[k].id));
  if (!activas.length || !hay(TRONO)) return;
  const kind = k => 'ed_' + SALAS[k].id;
  const deKind = kd => activas.find(k => kind(k) === kd);
  window.CK_SALAS_CASTILLO = { SALAS, activas };

  // sonido de ambiente, eco y luz de sala (los mapas del Taller vienen todos marcados "afuera")
  activas.forEach(k => {
    const s = SALAS[k], m = D.mapas[s.id], zona = kind(k) + '.main';
    if (!(m.sonido && m.sonido.length)) m.sonido = s.sonido;
    window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { [kind(k)]: 'madera' });
    const L = window.CK_LUZ;
    if (L && L.INTERIORES) L.INTERIORES.add(zona);
    if (L && L.AMB_SALA) L.AMB_SALA[zona] = s.sala;
  });

  // minimapa: las dos zonas nuevas (sin dibujo propio: se ve el retrato del mapa o el fondo) y los arcos del salón hacia ellas
  const MM = window.CK_MINIMAPA;
  if (MM && MM.Z && MM.L) {
    const SALON = 'ed_' + TRONO + '.main';
    const DATOS = {
      kingroom: { n: 'Aposentos del Rey', lugares: [{ n: 'Hogar', x: 352, y: 250, ic: 'fuego' }, { n: 'Volver al salón', x: 201, y: 368, ic: 'flecha', d: 's', va: SALON }] },
      library: { n: 'Biblioteca', lugares: [{ n: 'Maestre Eloy', x: 262, y: 150, ic: 'libro' }, { n: 'Volver al salón', x: 200, y: 396, ic: 'flecha', d: 's', va: SALON }] }
    };
    activas.forEach(k => {
      const zona = kind(k) + '.main', m = D.mapas[SALAS[k].id];
      if (!MM.Z[zona]) MM.Z[zona] = { img: SALAS[k].id, esc: 2, w: m.w, h: m.h, n: DATOS[k].n, g: 'Castillo' };
      if (!MM.L[zona]) MM.L[zona] = DATOS[k].lugares;
      (MM.L[SALON] || []).forEach(l => {
        if (l.va === 'castle.' + k) l.va = zona;
      });
    });
  }

  // del Gran Salón a la sala nueva
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    const c = this.currentInterior;
    if (c && !this._doorTransition && this._gameMode === 'campaign' && c.building.kind === 'ed_' + TRONO && activas.includes(nombre))
      if (this.ckEntrar(SALAS[nombre].id, 'Entrada')) return;
    return cambiar0.apply(this, arguments);
  };
  // de la sala nueva al Gran Salón (la puerta de abajo)
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior, k = c && deKind(c.building.kind);
    if (k && !this._doorTransition && this.ckEntrar(TRONO, SALAS[k].vuelta)) return;
    return salir0.apply(this, arguments);
  };

  // el Maestre Eloy, en la biblioteca nueva (a la derecha del escritorio, sobre la tarima)
  if (activas.includes('library') && typeof STORY_NPCS !== 'undefined') {
    const eloy = STORY_NPCS.find(n => n.id === 'eloy');
    if (eloy) Object.assign(eloy, { zone: kind('library') + '.main', x: 262, y: 150, marca: 14 });
    const L = typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS[kind('library')];
    if (L)
      INTERIOR_LAYOUTS[kind('library')] = function (kit) {
        const r = L.apply(this, arguments),
          a = kit.areas && kit.areas.main;
        if (a) {
          // mirando hacia el escritorio, a la escala de la gente de los mapas del Taller
          a.items.push({ key: 'npc6_villager', anim: 'npc6_idle', x: 262, baseY: 150, scale: 1.3, oy: 1, ox: 0.5, flipX: true });
          a.colliders.push({ x: 255, y: 143, w: 14, h: 7 });
        }
        return r;
      };
  }
})();
