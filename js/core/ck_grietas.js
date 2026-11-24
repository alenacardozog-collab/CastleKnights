'use strict';
/* Las roturas del piso, con pixelfx (22/11, pedido del dueño: "las roturas del piso también mejoralas, las de todas las
   habilidades de los personajes, cuando rompen por peso o algo que se agrieta el piso hazlo con pixelfx, más pulido y acorde
   a la habilidad y peso").
   - Un efecto nuevo de pixelfx hecho para el juego (valcairn/grieta, visto desde arriba): las grietas corren desde el golpe
     en tramos rectos y se abren en ramitas, anchas al salir y finas en la punta, con el borde de abajo iluminado (tienen
     hondura); si el golpe es pesado se hunde el medio (con el borde de abajo con luz y el de arriba en sombra), se abre un
     aro de grieta alrededor y quedan cascotes; saltan piedritas que quedan donde caen y el polvo se asienta. Cuatro pesos:
     pfx_grieta_leve, pfx_grieta_media, pfx_grieta_pesada y pfx_crater_fuego (al rojo, que se enfría: el meteoro).
   - La grieta QUEDA en el piso un rato (más cuanto más pesado) y se va apagando; va debajo de todos.
   - Sale sola donde ya había un golpe al piso, con el peso según el tamaño del golpe: el salto aplastante de Lancent
     (media), el pisotón de Urso (pesada), la avalancha (leves debajo de cada pico y una pesada al final), el meteoro de
     Horos (cráter al rojo, en vez del dibujo de antes), el golpe al piso de Gork y los golpes al piso de los jefes
     (Kragmor, Gorvak, Taurax, Grushak, el Gran Esqueleto...): sus grietas de líneas se cambian por estas.
   - Dos golpes en el mismo lugar al mismo tiempo dejan una sola grieta (la más pesada).
   API: CK_GRIETAS.romper(S, x, y, 'leve'|'media'|'pesada'|'fuego', {escala, dura}) y porRadio(S, x, y, r).
   Borrar su línea de index.html deja las grietas de antes. */
(function () {
  if (typeof Phaser === 'undefined') return;
  const VX = () => window.CK_VFX;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };
  // radio al que se hornearon (px del piso) y cuánto queda en el piso antes de apagarse
  const TIPOS = {
    leve: { k: 'pfx_grieta_leve', r: 24, dura: 1800, peso: 1 },
    media: { k: 'pfx_grieta_media', r: 40, dura: 2800, peso: 2 },
    pesada: { k: 'pfx_grieta_pesada', r: 60, dura: 4000, peso: 3 },
    fuego: { k: 'pfx_crater_fuego', r: 52, dura: 4500, peso: 4 }
  };
  const PROF = 8;               // debajo de todos (como las grietas de antes)
  const APAGA = 900;

  const recientes = S => (S._ckGrietas = (S._ckGrietas || []).filter(g => S.time.now - g.t < 160 && g.s.active));
  const romper = (S, x, y, tipo, o) => {
    o = o || {};
    try {
      const T = TIPOS[tipo] || TIPOS.media, V = VX(); if (!S || !V || !V.listo) return null;
      const key = V.listo(S, T.k), H = (V.A || V.hojas || {})[T.k]; if (!key || !H) return null;
      const esc = o.escala || 1, r = T.r * esc;
      // otro golpe en el mismo lugar recién: queda la más pesada
      const ya = recientes(S).find(g => Math.hypot(g.x - x, (g.y - y) / 0.6) < Math.max(g.r, r) * 0.7);
      if (ya) { if (ya.peso >= T.peso) return ya.s; ya.s.destroy(); }
      const s = crea(S, () => S.add.sprite(x, y, key, 0));
      s.setOrigin(H.ax / H.fw, H.ay / H.fh).setScale(esc * (o.flip || Math.random() < 0.5 ? -1 : 1), esc).setDepth(o.prof !== undefined ? o.prof : PROF);
      s.play({ key, frameRate: H.fps * (o.vel || 1), repeat: 0 });
      s.once('animationcomplete', () => {
        if (!s.active) return;
        const dura = o.dura !== undefined ? o.dura : T.dura;
        // el cráter al rojo se va enfriando mientras queda (se oscurece hacia brasa y piedra)
        if (tipo === 'fuego') { const c = { k: 0 }; S.tweens.add({ targets: c, k: 1, duration: dura, onUpdate: () => { if (s.active) { const v = Phaser.Display.Color.Interpolate.RGBWithRGB(255, 255, 255, 120, 84, 66, 1, c.k); s.setTint(Phaser.Display.Color.GetColor(v.r, v.g, v.b)); } } }); }
        S.tweens.add({ targets: s, alpha: 0, delay: dura, duration: APAGA, onComplete: () => s.destroy() });
      });
      S._ckGrietas.push({ x, y, r, t: S.time.now, peso: T.peso, s });
      return s;
    } catch (e) { return null; }
  };
  const porRadio = (S, x, y, r, o) => {
    const tipo = r < 30 ? 'leve' : r < 50 ? 'media' : 'pesada';
    return romper(S, x, y, tipo, Object.assign({ escala: clamp(r / TIPOS[tipo].r, 0.75, 1.35) }, o || {}));
  };

  // ------------------------------------------------------------------ donde ya había un golpe al piso, sale sola
  // clave del efecto → [cuánto del ancho del efecto es el radio de la grieta, sólo para tal héroe]
  const GOLPES = {
    ckfx_suelo: [0.42], ckfx_pfx_impacto: [0.4], ckfx_pfx_aterrizaje: [0.3], ckfx_pfx_pisoton: [0.3],
    ckfx_pinchos: [0, 'bear']          // (los picos de la avalancha: una leve debajo de cada uno)
  };
  const F = Phaser.GameObjects.GameObjectFactory.prototype, sp0 = F.sprite;
  F.sprite = function (x, y, key) {
    const s = sp0.apply(this, arguments);
    try {
      const G = typeof key === 'string' && GOLPES[key];
      if (G && s) {
        const S = this.scene, enEd = (S._ckPedCrea || 0) > 0;
        if (G[1] && S.playerHero !== G[1]) return s;
        // al cuadro siguiente: ya tiene su escala y su lugar
        S.time.delayedCall(0, () => {
          if (!s.active) return;
          const hacer = () => {
            if (!G[0]) return romper(S, s.x, s.y + 2, 'leve', { escala: clamp(Math.abs(s.scaleY) * 0.9, 0.7, 1.2) });
            const r = Math.abs(s.displayWidth) * G[0]; if (r < 14) return null;
            return porRadio(S, s.x, s.y, r);
          };
          if (enEd) crea(S, hacer); else hacer();
        });
      }
    } catch (e) {}
    return s;
  };

  // las grietas de líneas de los jefes (ck_jefes_fx.js) pasan a ser estas
  const cambiarJefes = () => {
    const J = window.CK_JEFES_FX; if (!J || !J.grieta || J.grieta._ckPfx) return;
    const g0 = J.grieta;
    const g = function (S, x, y, r) { if (!porRadio(S, x, y, r)) return g0.apply(this, arguments); };
    g._ckPfx = true; J.grieta = g;
  };
  cambiarJefes();

  // el golpe al piso de Gork (combat.js): sólo tenía un aro
  if (typeof MainGameScene !== 'undefined') {
    const P = MainGameScene.prototype, gs0 = P.createGroundSmash;
    if (gs0) P.createGroundSmash = function () {
      const r = gs0.apply(this, arguments);
      try { const p = this.player, f = p.body ? { x: p.body.center.x, y: p.body.bottom } : { x: p.x, y: p.y + 14 }; romper(this, f.x, f.y, 'media', { escala: 1.05 }); } catch (e) {}
      return r;
    };
  }

  window.CK_GRIETAS = { TIPOS, GOLPES, romper, porRadio };
})();
