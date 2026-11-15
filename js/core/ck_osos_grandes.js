'use strict';
/* Osos más grandes (15/11, pedido del dueño: "Urso y los osos parecidos son un 20 % más grandes de lo que están ahora").
   Urso (el héroe y el de la jaula) ya se agrandó en ck_heroe_oso.js. Acá, las bestias oso: el Hombre Oso y Garra Negra
   (y los hombres oso de la manada), un 20 % más grandes en todos los mapas. Va después de ck_escala_mapas.js (le avisa a
   ese archivo la escala nueva, así no la vuelve a agrandar). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const MAS = 1.2, OSOS = /^werebear/;
  const agrandar = e => {
    if (!e || !e.active || e._ckOsoG || !OSOS.test(e.type || '')) return;
    e._ckOsoG = true;
    e.setScale(e.scaleX * MAS, e.scaleY * MAS);
    if (e._ckEscVal !== undefined) e._ckEscVal = e.scaleX;              // (ck_escala_mapas: esta es la escala buena)
  };
  const s0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = s0.apply(this, arguments);
    try { agrandar(e); } catch (er) {}
    return e;
  };
  // los que aparecen de otra forma (escenas que los arman a mano)
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try { const f = window.CK_ESCALA_MAPAS ? CK_ESCALA_MAPAS.factor(this) : 1; if ((this._ckOsoN = (this._ckOsoN || 0) + 1) % 30 === 0 && this.enemies) this.enemies.getChildren().forEach(e => { if (!e.isDead && !e._ckOsoG && OSOS.test(e.type || '') && (f === 1 || e._ckEscVal !== undefined)) agrandar(e); }); } catch (er) {}
    return r;
  };
  window.CK_OSOS_GRANDES = { MAS };
})();
