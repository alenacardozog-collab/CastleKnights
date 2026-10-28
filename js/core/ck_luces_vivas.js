'use strict';
/* Luces que se portan según lo que son (23/10, pedido del dueño: "titilan mucho y distraen").
   Antes todas las llamas titilaban igual y rápido (cambios de tamaño y brillo cada 1/10 de segundo).
   Ahora cada luz se mira qué tiene al lado y se comporta así:
     - fuego grande (hogar, fogata, fogón, fragua): vaivén lento e irregular, un poco más vivo que el resto;
     - antorcha y brasero: igual pero más chico;
     - vela y candelabro: casi quieta, apenas respira;
     - farol, lámpara, linterna (fuego detrás del vidrio): quieta.
   Vale para las luces del Taller (mapas nuevos) y para los charcos de luz de los interiores viejos (castillo, casas).
   Borrar la línea de index.html deja el titileo de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const TIPOS = [
    [/hogar|fogata|fogon|fragua|chimenea|hoguera|fireplace|hearth|campfire|forge|oven|horno/i, 'fuego'],
    [/brasero|antorcha|llama|torch|brazier|cauldron/i, 'antorcha'],
    [/candel|vela|cirio|candle/i, 'vela'],
    [/farol|lampara|linterna|lamp|lantern/i, 'farol']
  ];
  // t = cuánto cambia el brillo, s = cuánto cambia el tamaño, v = velocidad (1 = vaivén de ~1 a 3 segundos)
  const MODO = { fuego: { t: 0.1, s: 0.035, v: 1 }, antorcha: { t: 0.08, s: 0.025, v: 1.15 }, vela: { t: 0.045, s: 0.012, v: 0.8 }, farol: { t: 0, s: 0, v: 0 } };
  const ruido = (t, s, v) => 0.5 * Math.sin(t * 0.0021 * v + s) + 0.3 * Math.sin(t * 0.0047 * v + s * 1.7) + 0.2 * Math.sin(t * 0.0089 * v + s * 2.3);
  const tipoDe = k => { const m = TIPOS.find(p => p[0].test(k || '')); return m ? m[1] : null; };

  // ---------------------------------------------------------------- luces del Taller
  const D = window.EDITOR_DATA;
  const ED = () => window.CK_EDITOR;
  const tipoLuz = (area, l) => {
    const id = String(area.key || '').replace(/^ed_/, '').replace(/\.\w+$/, ''), m = D && D.mapas && D.mapas[id];
    let mejor = null, d0 = 44;
    ((m && m.items) || []).forEach(it => {
      const t = tipoDe(it[0]);
      if (!t) return;
      const d = Math.min(Math.hypot(it[1] - l.x, it[2] - l.y), Math.hypot(it[1] - l.x, it[2] - 20 - l.y), Math.hypot(it[1] - l.x, it[2] - 45 - l.y));
      if (d < d0) { d0 = d; mejor = t; }
    });
    return mejor || ((l.parpadeo || 0) > 0 ? 'vela' : null);
  };
  const c0 = P.ckLuces;
  if (c0)
    P.ckLuces = function (area) {
      const r = c0.apply(this, arguments);
      try {
        (ED().lucesVivas || []).forEach((v, i) => {
          const tipo = tipoLuz(area, v.l);
          if (!tipo) return;
          v._ck = { tipo, f: v.l.fuerza === undefined ? 0.55 : v.l.fuerza, e: v.e, s: (v.l.x || 0) * 0.37 + (v.l.y || 0) * 0.11 + i };
          v.l = Object.assign({}, v.l, { parpadeo: 0, pulso: 0 }); // el cuadro del Taller ya no la mueve: la mueve esto
        });
      } catch (e) { console.warn('[luces vivas]', e); }
      return r;
    };

  // ---------------------------------------------------------------- charcos de luz de los interiores viejos
  const vivos = [];
  const s0 = P.showInteriorArea;
  if (s0)
    P.showInteriorArea = function () {
      const r = s0.apply(this, arguments);
      try {
        const cosas = this.children.list.filter(o => o.texture && o.texture.key !== 'fx_glow' && o.visible && tipoDe(o.texture.key));
        this.children.list.forEach(o => {
          if (!o.texture || o.texture.key !== 'fx_glow' || o.blendMode !== Phaser.BlendModes.ADD || o._ckViva) return;
          this.tweens.killTweensOf(o);
          let tipo = null, d0 = 50;
          cosas.forEach(c => { const d = Math.hypot(c.x - o.x, c.y - o.y); if (d < d0) { d0 = d; tipo = tipoDe(c.texture.key); } });
          o._ckViva = { tipo: tipo || 'antorcha', a: o.alpha, w: o.displayWidth, h: o.displayHeight, s: o.x * 0.37 + o.y * 0.11 };
          vivos.push(o);
        });
      } catch (e) { console.warn('[luces vivas]', e); }
      return r;
    };

  // ---------------------------------------------------------------- cada cuadro
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const t = this.time.now;
      const E = ED();
      (E && E.lucesVivas || []).forEach(v => {
        const k = v._ck;
        if (!k || !v.im.active) return;
        const M = MODO[k.tipo], n = M.v ? ruido(t, k.s, M.v) : 0;
        v.im.setAlpha(Math.min(1, k.f * (1 - M.t * 0.5 + M.t * 0.5 * n)));
        if (M.s) v.im.setDisplaySize(k.e * 2 * (1 + M.s * n), k.e * 2 * (1 + M.s * n));
      });
      for (let i = vivos.length - 1; i >= 0; i--) {
        const o = vivos[i];
        if (!o.active) { vivos.splice(i, 1); continue; }
        const k = o._ckViva, M = MODO[k.tipo], n = M.v ? ruido(t, k.s, M.v) : 0;
        o.setAlpha(k.a * (1 - M.t * 0.6 + M.t * 0.6 * n));
        if (M.s) o.setDisplaySize(k.w * (1 + M.s * n), k.h * (1 + M.s * n));
      }
    } catch (e) {}
    return r;
  };
  window.CK_LUCES_VIVAS = { tipoDe, MODO };
})();
