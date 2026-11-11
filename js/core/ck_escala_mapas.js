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
   (10/11, v2, pedido: "quedaron grandes en todo el mapa, sólo quería en el castillo; también los NPC dentro del castillo,
   en un tamaño acorde; ponelo como estaba antes, en el castillo sí que todos se vean un poco más grandes, pero sólo allí
   por ahora y en los interiores"):
   - Sólo en el CASTILLO (patio, patio de armas, muralla, jardín, salón del trono, aposentos, biblioteca, herrería,
     cocina) y en los INTERIORES del Taller (taberna, casas, granero, tienda). Afuera (camino, aldea en ruinas, bosques,
     tierras orcas…) todo vuelve al tamaño de antes.
   - Los aldeanos de hoja chica (32 px: los de la taberna, el salón, la cocina…) se veían a la mitad del héroe: ahora se
     agrandan hasta un alto parecido al suyo (ALDEANO px de alto visible, nunca más del doble). Los soldados y el héroe, ×1,35.
   (10/11, v3, pedido: "ahora están súper gigantes, dejá los tamaños como estaban antes de cambiarlos"): APAGADO.
   Todos los personajes vuelven al tamaño que tenían antes del 10/11, en todos los mapas (AGRANDAR = false). Lo único que
   queda es el Rey un 20 % más chico (pedido aparte). Para volver a probar el agrandado: AGRANDAR = true.
   CK_ESCALA_MAPAS.MAPA[id] cambia la escala de un mapa (1 = como antes). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCALA = 1.35;
  const MAPA = {};                                   // por mapa, si alguno necesita otra: MAPA.taberna_2 = 1.25
  const CASTILLO = /^(patio_del_castillo|patio_de_armas|patio_armas_nuevo|muralla|jardin_real|salon_del_trono_3|salon_del_trono_nuevo|aposentos_del_rey|biblioteca|herreria|cocina_real)$/;
  const INTERIOR = /^(taberna_2|taberna_nueva|casa_grande|granero|tienda_de_viveres|casa_de_arriba)$/;
  const ALDEANO = 28;                                // alto visible (px del mundo) de un aldeano adulto con ESCALA 1,35
  const PERSONA = /(_villager$|^ck_(par_|tabernero|rosa|pipo|posadera|vecin|dama|noble|cocin|criad|paje))/;
  const NO = /^(ck_antorcha|fx_|ed_|cs_|door|int_cow|ui_|hud_)/;
  const CUADRO = { 96: 1, 100: 1, 128: 1 };
  // mapas del Taller: los ed_<id> y las salas del castillo que se arman con un mapa del Taller (Patio, Patio de Armas…)
  const delTaller = a => {
    if (!a) return false;
    if (a._ckTaller === undefined) a._ckTaller = (a.objs || []).some(o => o && o.texture && /^ed_suelo_/.test(o.texture.key));
    return a._ckTaller;
  };
  const AGRANDAR = false;                            // (v3) apagado: tamaños de antes en todos lados
  const factor = S => {
    if (!AGRANDAR) return 1;
    const c = S && S.currentInterior, k = c && c.building && c.building.kind;
    if (!k || !(k.indexOf('ed_') === 0 || delTaller(c.area))) return 1;
    const id = k.indexOf('ed_') === 0 ? k.slice(3) : k + '.' + c.areaName;
    // sólo el castillo (sus mapas del Taller y sus salas armadas con uno) y los interiores
    const vale = k.indexOf('ed_') === 0 ? CASTILLO.test(id) || INTERIOR.test(id) : (k === 'castle' || /^(bar|tienda|casa|granero)$/.test(k));
    if (!vale) return 1;
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
  // alto visible de la hoja (en px del dibujo), medido una vez por textura
  const ALTOS = {}, cv = document.createElement('canvas'), g2 = cv.getContext('2d', { willReadFrequently: true });
  const altoDe = (S, o) => {
    const k = o.texture.key;
    if (ALTOS[k] !== undefined) return ALTOS[k];
    try {
      const f = o.texture.get(0) || o.frame, im = f.source.image;
      cv.width = f.cutWidth; cv.height = f.cutHeight; g2.clearRect(0, 0, cv.width, cv.height);
      g2.drawImage(im, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
      const d = g2.getImageData(0, 0, cv.width, cv.height).data; let y0 = 1e9, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 40) { if (y < y0) y0 = y; y1 = y; }
      ALTOS[k] = y1 < 0 ? 0 : y1 - y0 + 1;
    } catch (e) { ALTOS[k] = 0; }
    return ALTOS[k];
  };
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
      // aldeanos de hoja chica: hasta un alto parecido al del héroe
      if (k && !o.def && PERSONA.test(k) && o.frame.cutWidth <= 64) {
        if (o._ckAld === f && Math.abs(o.scaleX - o._ckEscVal) < 0.001) continue;
        const base = o._ckAld && Math.abs(o.scaleX - o._ckEscVal) < 0.001 ? o._ckBase : o.scaleX;
        const h = altoDe(S, o); if (!h) continue;
        const m = Math.max(1, Math.min(2, ALDEANO * f / ESCALA / (h * base)));
        o.setScale(base * m, (o.scaleY / (o.scaleX || 1)) * base * m);
        o._ckBase = base; o._ckAld = f; o._ckEscVal = o.scaleX;
        continue;
      }
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
  window.CK_ESCALA_MAPAS = { ESCALA, MAPA, factor, CASTILLO, INTERIOR, ALDEANO, AGRANDAR };
})();
