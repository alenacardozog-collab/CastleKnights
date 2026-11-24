'use strict';
/* Arreglos de las notas del 23/11, tanda 11a (notas_para_corregir (6).json, 12 notas del dueño, casi todas del Capítulo 3).
   Este archivo junta los chicos; los demás van en su propio archivo (ver TRASPASO 6.168).
   - Nota 1 ("esto colocalo antes de entrar al portal en la biblioteca, el guardado"): el cartel de guardado de la Mazmorra del
     Sello pasa a la Biblioteca, contra la pared, para guardar antes del ritual de Eloy y el portal (ck_totems.js).
   - Nota 4 ("en esta instancia no podemos entrar al castillo hasta que limpiemos todo el reino"): en el Camino, mientras el
     castillo está cerrado (Capítulo 3, desde la expulsión hasta que el reino queda limpio) el puente levadizo queda ALZADO
     tapando el portón: ya no baja cuando uno se acerca. El cartel de "atrancado" sigue (ck_capitulo3.js).
   - Nota 5 ("el boss spawnea acá, el perro"): Fauces, el Sabueso Mayor, aparece en el Camino abajo, en el cruce (553, 440).
   - Nota 9 ("en esta instancia estos NPC no están"): en el Bosque de la Frontera, durante el Capítulo 3, no están el recluta
     del fogón de abajo (ck_cuarentena.js) ni Tomás, el mercader, al lado (ck_capitulo2.js): en ese capítulo no vende ahí.
   Va después de ck_notas_arreglos_4.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => S.currentInterior && S.currentInterior.area;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const c3 = s => (s && s.flags && s.flags.c3) || 0;
  const LIBRE = () => !!(window.CK_LIBRE && CK_LIBRE());
  const ZCAM = 'ed_camino_al_castillo.main', ZBOS = 'ed_bosque_de_la_frontera.main';

  // ------------------------------------------------------------------ notas 1 y 5: datos de otros archivos
  // (ck_totems.js y ck_reino_criaturas.js se cargan después que este archivo: los cambios se aplican al terminar de cargar
  // la página, y otra vez al entrar a cada mapa por las dudas)
  const datos = () => {
    // nota 1: el cartel de guardado, de la mazmorra a la biblioteca
    try {
      const T = window.CK_TOTEMS;
      if (T && T.CARTELES && !T.CARTELES['ed_biblioteca.main']) {
        delete T.CARTELES['ed_mazmorra_sello.main'];
        T.CARTELES['ed_biblioteca.main'] = { x: 250, y: 338, e: 'sello' };   // a la derecha de la entrada, contra la mesa redonda (el ritual va en el medio)
      }
    } catch (e) {}
    // nota 5: Fauces, en el cruce de abajo del Camino
    try {
      const RC = window.CK_REINO_CRIATURAS;
      if (RC && RC.LUGAR && RC.LUGAR[ZCAM]) RC.LUGAR[ZCAM].punto = [553, 440];
    } catch (e) {}
  };
  datos();
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('load', datos);

  // ------------------------------------------------------------------ nota 4: el puente alzado mientras el castillo está cerrado
  const cerrado = s => c3(s) >= 1 && !(c3(s) >= 4 && window.CK_CAPITULO3_CASTILLO) && !LIBRE();
  const puente = S => {
    if (zona(S) !== ZCAM) return;
    const s = st(S); if (!s) return;
    if (cerrado(s)) {
      // ck_camino.js baja el puente cuando uno se acerca (actualizarPuente mira S._ckPuente): se lo guarda aparte y queda alzado
      const br = S._ckPuente;
      if (br) {
        S._ck5Puente = br; S._ckPuente = null;
        br.t = 0; br.moving = false;
        if (br.img) { br.img.setScale(1, -0.9); br.img.setTint(0x8f7f72); }
        if (br.blocker && br.blocker.body) br.blocker.body.enable = true;
        try { br.chains.clear(); br.chains.lineStyle(1, 0x30303a, 0.95); const tip = br.y0 + br.len * -0.9; br.chains.lineBetween(br.x - br.w / 2 + 3, br.cad, br.x - br.w / 2 + 3, tip); br.chains.lineBetween(br.x + br.w / 2 - 3, br.cad, br.x + br.w / 2 - 3, tip); } catch (e) {}
      }
    } else if (S._ck5Puente && !S._ckPuente) { S._ckPuente = S._ck5Puente; S._ck5Puente = null; }
  };

  // ------------------------------------------------------------------ nota 9: sin la gente del fogón de abajo en el Capítulo 3
  const SIN_GENTE = { x0: 420, y0: 515, x1: 575, y1: 605 };
  const sinGente = S => {
    const s = st(S), a = area(S); if (!s || !a || zona(S) !== ZBOS || c3(s) < 1) return;
    (S.children ? S.children.list.slice() : []).forEach(o => {
      if (!o || !o.active || !o.visible || (o.type !== 'Sprite' && o.type !== 'Image') || o === S.player) return;
      const k = (o.texture && o.texture.key) || '';
      if (!/(_villager|^npc\d+|^g_(templar|archer|lancer|axeman))/.test(k) || /^g_knight/.test(k) || o._c3 || o._ckAnim === 'g_knight') return;
      if (S.enemies && S.enemies.contains(o)) return;
      const x = o.x - a.x, y = o.y - a.y;
      if (x > SIN_GENTE.x0 && x < SIN_GENTE.x1 && y > SIN_GENTE.y0 && y < SIN_GENTE.y1) o.setVisible(false).setActive(false);
    });
    // y no se les habla
    if (a.actors) a.actors.forEach(t => { const sp = t && t.sprite; if (sp && !sp.visible) { t.lines = null; t.talkAt = 0; } });
  };
  const ocultos = new Set(['soldado_campo_1', 'mercader']);   // el recluta del fogón y Tomás, el mercader (el aldeano de delantal azul)
  if (typeof STORY_NPCS !== 'undefined') STORY_NPCS.forEach(n => {
    if (!ocultos.has(n.id)) return;
    const d = Object.getOwnPropertyDescriptor(n, 'zone');
    const z0 = d && d.get ? d.get : () => d && d.value;
    Object.defineProperty(n, 'zone', { configurable: true, get() { const S = window.activeGameScene, s = st(S); return s && c3(s) >= 1 ? '-' : z0.call(n); } });
  });

  // ------------------------------------------------------------------ enganches
  const ar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ar0 ? ar0.apply(this, arguments) : undefined;
    try { datos(); const S = this; S._ck5Puente = null; puente(S); [80, 700, 1600].forEach(t => S.time.delayedCall(t, () => { try { sinGente(S); } catch (e) {} })); } catch (e) {}
    return r;
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try { puente(this); } catch (e) { if (!P._ck5Err) { P._ck5Err = 1; console.warn('[arreglos 5]', e); } }
    return r;
  };
  window.CK_NOTAS_2311C = { cerrado, sinGente, SIN_GENTE };
})();
