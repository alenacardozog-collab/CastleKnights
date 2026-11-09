'use strict';
/* La gente y el tiempo (08/11, pedido del dueño: "que en las estaciones los npc reaccionen a la lluvia y tiren comentarios
   o busquen resguardarse dentro de casas").
   - En la aldea, cuando se larga a llover la mayoría se mete en su casa (Mirta no: se queda a convidar tortas fritas) (con tormenta, casi todos) y lo dice en un globito;
     los que se quedan afuera comentan. Mientras llueve no salen; cuando para, van saliendo de a uno y alguno lo festeja.
   - Con lluvia, tormenta o nieve, la gente que anda cerca del héroe (aldeanos, guardias del castillo, el cura, la gente de
     los mapas del Taller) tira un comentario cada tanto. Los soldados se quejan a su manera.
   Usa ck_vida.js (rutinas: irA, puertaDe) y ck_escenas.js (globitos). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA) return;
  const P = MainGameScene.prototype;
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const azar = (a, b) => a + Math.random() * (b - a);
  const FIJOS = ['npc2'];  // el posadero no deja el puesto
  const QUEDAN = { npc7: ['¡Llueve! Día de tortas fritas', 'Con lluvia, torta frita: vení, {h}'] };  // Mirta se queda afuera: convida tortas fritas (ck_gente.js)
  const DICHOS = {
    seVa: ['¡Se largó! Me voy adentro', '¡A guarecerse, que llueve!', 'Esta agua no me agarra afuera', '¡Uy, la ropa tendida!', '¡Corran, que se viene el chaparrón!'],
    seVaTormenta: ['¡Adentro, que se viene feo!', '¡Qué trueno! Me voy a casa', 'Santa Bárbara bendita… ¡adentro!', 'Con rayos no se juega'],
    queda: ['Lluvia buena pa\'l sembrado', 'Mojado hasta los huesos…', 'Que llueva, que llueva…', 'Con este tiempo ni las bestias salen… ojalá', 'Se me embarraron las botas'],
    tormenta: ['¡Qué trueno! Se me paró el corazón', 'Este cielo no me gusta nada', 'Dicen que los rayos despiertan a los muertos…'],
    nieve: ['¡Qué helada!', 'Se me congelan las orejas', 'Nieve en el Roble… quién lo diría', 'Abrigate, {h}, que hiela', 'Ni el mate calienta con este frío'],
    paro: ['Paró de llover', 'Qué olor a tierra mojada', 'Bueno, a secar la ropa', 'Salió el sol… más o menos'],
    soldLluvia: ['Esta lluvia me oxida la armadura', 'Guardia bajo la lluvia… lo peor del oficio', 'El capitán no nos deja ni guarecernos', 'Tengo agua hasta en las botas'],
    soldTormenta: ['Con tormenta, la lanza atrae los rayos…', 'Que el Rey nos perdone si nos metemos bajo techo', '¡Firmes, aunque truene!'],
    soldNieve: ['Con este frío no siento los dedos', 'Ni la cota me abriga', 'La guardia de invierno es la peor']
  };
  const clima = () => { try { return window.CK_CLIMA ? CK_CLIMA.actual() : 'despejado'; } catch (e) { return 'despejado'; } };
  const txt = (S, t) => (window.CK_GENTE && CK_GENTE.txt ? CK_GENTE.txt(S, t) : String(t).replace(/\{h\}/g, 'héroe'));
  const globo = (S, sp, t) => { try { CK_ESCENA.globo(S, sp, txt(S, t), 2600, 46); } catch (e) {} };
  const congelado = id => !!(window.CK_GENTE && CK_GENTE.congelados && CK_GENTE.congelados.has && CK_GENTE.congelados.has(id));
  const afuera = S => (window.CK_AFUERA ? window.CK_AFUERA(S) : !S.currentInterior || S.currentInterior.area.outdoor);

  // ------------------------------------------------------------------ la aldea: a guarecerse
  const aldea = (S, c, antes) => {
    const V = window.CK_VIDA, now = S.time.now;
    if (!V || !V.irA || !S.campaignNPCs) return;
    const llueve = c === 'lluvia' || c === 'tormenta', llovia = antes === 'lluvia' || antes === 'tormenta';
    const enAldea = !S.currentInterior;
    S.campaignNPCs.forEach(n => {
      const v = n.vida, sp = n.sprite;
      if (!v || !sp || !sp.active || FIJOS.includes(n.id)) return;
      // empieza a llover: casi todos adentro
      if (llueve && !llovia && v.modo === 'ruta' && QUEDAN[n.id]) { if (enAldea) S.time.delayedCall(azar(300, 1500), () => sp.visible && globo(S, sp, UNO(QUEDAN[n.id]))); return; }
      if (llueve && !llovia && v.modo === 'ruta' && !congelado(n.id)) {
        if (Math.random() < (c === 'tormenta' ? 0.9 : 0.65)) {
          const d = V.puertaDe(S, (V.CASA && V.CASA[n.id]) || 'casa') || V.puertaDe(S, 'casa');
          if (d && V.irA(S, n, d, 'casa', c === 'tormenta')) {
            v._ckLluvia = true;
            if (enAldea && Math.random() < 0.6) S.time.delayedCall(azar(0, 1500), () => sp.visible && globo(S, sp, UNO(c === 'tormenta' ? DICHOS.seVaTormenta : DICHOS.seVa)));
            return;
          }
        }
        if (enAldea && Math.random() < 0.5) S.time.delayedCall(azar(300, 2500), () => sp.visible && globo(S, sp, UNO(c === 'tormenta' ? DICHOS.tormenta : DICHOS.queda)));
      }
      // mientras llueve, los que se guardaron no salen
      if (llueve && v.modo === 'adentro' && v._ckLluvia && v.hasta < 1e11) v.hasta = Math.max(v.hasta, now + 3000);
      // paró: van saliendo de a uno
      if (!llueve && v._ckLluvia) {
        v._ckLluvia = false;
        if (v.modo === 'adentro' && v.hasta < 1e11) { v.hasta = now + azar(1500, 12000); v._ckParo = true; }
      }
      if (v._ckParo && v.modo !== 'adentro' && sp.visible) {
        v._ckParo = false;
        if (enAldea && Math.random() < 0.5) S.time.delayedCall(900, () => sp.visible && globo(S, sp, UNO(DICHOS.paro)));
      }
    });
  };

  // ------------------------------------------------------------------ comentarios al pasar (en cualquier mapa de afuera)
  const SOLDADO = /^g_(knight|templar|lancer|axeman|archer)_/, GENTE = /^(g_priest_|npc\d+_villager)/;
  const comentar = (S, c) => {
    if (!afuera(S) || !S.player || S.dialogOpen) return;
    const p = S.player, cerca = S.children.list.filter(o => o.type === 'Sprite' && o.active && o.visible && o.alpha > 0.5 &&
      (SOLDADO.test(o.texture.key) || GENTE.test(o.texture.key)) && Phaser.Math.Distance.Between(o.x, o.y, p.x, p.y) < 240);
    if (!cerca.length) return;
    const sp = UNO(cerca), sold = SOLDADO.test(sp.texture.key);
    const l = c === 'nieve' ? (sold ? DICHOS.soldNieve : DICHOS.nieve) : c === 'tormenta' ? (sold ? DICHOS.soldTormenta : DICHOS.tormenta) : sold ? DICHOS.soldLluvia : DICHOS.queda;
    globo(S, sp, UNO(l));
  };

  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.story || this.isGamePaused) return r;
      this._ckLgT = (this._ckLgT || 0) + (delta || 16);
      if (this._ckLgT < 1000) return r;
      this._ckLgT = 0;
      const c = clima(), antes = this._ckLgC;
      aldea(this, c, antes === undefined ? c : antes);
      this._ckLgC = c;
      if (/lluvia|tormenta|nieve/.test(c)) {
        if (!this._ckLgProx || this.time.now > this._ckLgProx) {
          if (this._ckLgProx) comentar(this, c);
          this._ckLgProx = this.time.now + azar(14000, 26000);
        }
      } else this._ckLgProx = 0;
    } catch (e) { if (!P._ckLgAv) { P._ckLgAv = 1; console.warn('[lluvia_gente]', e); } }
    return r;
  };
  window.CK_LLUVIA_GENTE = { DICHOS };
})();
