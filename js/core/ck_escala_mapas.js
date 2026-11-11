'use strict';
/* Tamaño de los personajes en los mapas del Taller (10/11, pedido del dueño: "corregí el tamaño del jugador y los NPC en
   el patio del castillo y demás lugares, se ven muy pequeños en comparación de las demás cosas").
   Los mapas nuevos (Nano Banana / Flow) dibujan barriles, puertas y muebles más grandes que los mapas viejos, así que el
   héroe, los NPC y las bestias se agrandan ×ESCALA en esos mapas. El pie (la caja de choque) queda del mismo tamaño en el
   mundo, así siguen pasando por las mismas puertas y pasillos. Fuera de los mapas del Taller no cambia nada.
   - Héroe: al entrar a cada mapa (setPlayerIndoorScale) y al cambiar de héroe.
   - Bestias: al aparecer (spawnEnemy) y cada vez que otro archivo les vuelve a poner su escala.
   - NPC, guardias, aldeanos, el Rey…: cualquier personaje con hoja de cuadros de 96, 100 o 128 px que aparezca en el mapa
     (los que ya estaban grandes, de 1,5 o más, quedan como estaban).
   - El Rey: un 20 % más chico que antes en todos lados (de pie, sentado en el trono y en el palco del coliseo).
   CK_ESCALA_MAPAS.MAPA[id] cambia la escala de un mapa (1 = como antes). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCALA = 1.35;
  const MAPA = {};                                   // por mapa, si alguno necesita otra: MAPA.cueva_galerias = 1.2
  const NO = /^(ck_antorcha|fx_|ed_|cs_|door|int_cow|ui_|hud_)/;
  const CUADRO = { 96: 1, 100: 1, 128: 1 };
  // mapas del Taller: los ed_<id> y las salas del castillo que se arman con un mapa del Taller (Patio, Patio de Armas…)
  const delTaller = a => {
    if (!a) return false;
    if (a._ckTaller === undefined) a._ckTaller = (a.objs || []).some(o => o && o.texture && /^ed_suelo_/.test(o.texture.key));
    return a._ckTaller;
  };
  const factor = S => {
    const c = S && S.currentInterior, k = c && c.building && c.building.kind;
    if (!k || !(k.indexOf('ed_') === 0 || delTaller(c.area))) return 1;
    const id = k.indexOf('ed_') === 0 ? k.slice(3) : k + '.' + c.areaName;
    return MAPA[id] !== undefined ? MAPA[id] : ESCALA;
  };
  // agranda el dibujo y achica la caja en la misma proporción (el pie queda igual en el mundo)
  const agrandar = (o, f, base) => {
    const sx = base, sy = o.scaleY / (o.scaleX || 1) * base;
    o.setScale(sx * f, sy * f);
    o._ckEscVal = o.scaleX; o._ckEscF = f;
    const b = o.body;
    if (b && b.setSize && b.sourceWidth && b.sourceWidth !== o._ckEscW) {   // (si otro archivo le rehízo la caja, se vuelve a achicar)
      const w = b.sourceWidth, h = b.sourceHeight, ox = b.offset.x, oy = b.offset.y;
      b.setSize(w / f, h / f, false); b.setOffset(ox + w * (1 - 1 / f) / 2, oy + h * (1 - 1 / f));
      o._ckEscW = b.sourceWidth;
    }
  };

  // ------------------------------------------------------------------ el héroe
  const es0 = P.setPlayerIndoorScale;
  if (es0) P.setPlayerIndoorScale = function (indoors) {
    const f = factor(this);
    if (f === 1) return es0.apply(this, arguments);
    const r = es0.call(this, false);                 // en los mapas del Taller el héroe siempre va a escala de afuera
    try {
      const p = this.player;
      if (p && p.body) {
        const s = p.scaleX * f, w = 16 * 1.2 / s, h = 8 * 1.2 / s;
        p.setScale(s); p.body.setSize(w, h); p.body.setOffset(50 - w / 2, 60 - h);
        p._ckEscVal = s;
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ las bestias
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = se0.apply(this, arguments);
    try { const f = factor(this); if (e && f !== 1) agrandar(e, f, e.scaleX); } catch (er) {}
    return e;
  };

  // ------------------------------------------------------------------ NPC y todo personaje que aparezca en el mapa
  const REY = /^(king_|ck_rey_sentado|ckc_rey)/, ACHICAR_REY = 0.8;   // (10/11) "reducile un 20 % el tamaño al Rey"
  const pasada = S => {
    const f0 = factor(S);
    const L = S.children && S.children.list; if (!L) return;
    for (let i = 0; i < L.length; i++) {
      const o = L[i];
      if (!o || !o.active || o === S.player || o.type !== 'Sprite' || !o.frame) continue;
      const k = o.texture && o.texture.key;
      if (k && REY.test(k)) {                         // el Rey: un 20 % más chico (y agrandado como todos en los mapas del Taller)
        const fr = f0 * ACHICAR_REY;
        if (!(o._ckEscF === fr && Math.abs(o.scaleX - o._ckEscVal) < 0.001)) agrandar(o, fr, o.scaleX);
        continue;
      }
      const f = f0;
      if (f === 1) continue;
      if (!k || NO.test(k) || !CUADRO[o.frame.cutWidth] || o.frame.cutWidth !== o.frame.cutHeight) continue;
      if (o._ckEscF === f && (Math.abs(o.scaleX - o._ckEscVal) < 0.001 || o.isDead)) continue;
      // los NPC que ya estaban dibujados grandes (a escala de adentro, 1,75) se dejan como están; las bestias se agrandan siempre
      if (!o.def && o._ckEscF !== f && o.scaleX >= 1.5) { o._ckEscF = f; o._ckEscVal = o.scaleX; continue; }
      agrandar(o, f, o.scaleX);                       // nuevo, o alguien le volvió a poner su escala de siempre
    }
    const p = S.player;                              // si otro archivo le cambió la escala al héroe, se la vuelve a poner
    if (f0 !== 1 && p && p._ckEscVal && Math.abs(p.scaleX - p._ckEscVal) > 0.001 && !S._ckEscena) S.setPlayerIndoorScale(false);
  };
  const up0 = P.update;
  P.update = function (t, dt) {
    const r = up0.apply(this, arguments);
    try { if (!this._ckEscProx || t > this._ckEscProx) { this._ckEscProx = t + 150; pasada(this); } } catch (e) {}
    return r;
  };
  window.CK_ESCALA_MAPAS = { ESCALA, MAPA, factor };
})();
