'use strict';
/* Economía del Capítulo 2 (06/11, pedido del dueño: "acomoda la economía"). Las cuentas, jugando de corrido:
   - Capítulo 1: se juntan unas 380 monedas por el camino principal (20 de arranque, bestias del camino y las ruinas,
     +40 del Capitán, +25 del ermitaño, 60 del Nigromante, +100 del Rey) y hasta ~700 haciendo también los encargos de
     los otros héroes, las salas del castillo y la historia de la sal. La tienda tiene 550 en mejoras (2 piedras, 3 tónicos,
     1 amuleto) más pociones: bien balanceado, se compra de a poco y sobra poco.
   - Capítulo 2: entran otras ~400 (bestias de los cuatro mapas ~120 por pasada, 60 de Grushak y 175 de la historia)…
     y NO HAY DÓNDE GASTARLAS: no hay tienda en la Frontera Orca y, para quien hizo todo en el 1, en la aldea ya dice
     "Completo" en todo. Las monedas dejaban de importar justo cuando más se juntan.
   Lo que cambia acá:
   - Tomás, el mercader del Bosque de la Frontera, VENDE desde que le pedís ayuda (paso 4 del capítulo 2): al terminar de
     hablar con él se abre su carreta, con pociones, elixires, antorchas, tónicos, piedras y amuletos ("todo lo mío es
     tuyo", decía él). Así no hay que volver a la aldea desde la frontera para curarse.
   - Sólo en su carreta hay una tercera piedra de afilar (180 monedas, +1 de daño: 4 en total) y un segundo amuleto de vida
     (220, +1 corazón). Son el gasto grande del capítulo 2; en la aldea siguen los topes de antes (2 y 1).
   Los precios y premios del capítulo 1 (ck_economia.js) no cambian. Borrar la línea de index.html lo deshace. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const CARRETA = { id: 'tomas', nombre: 'Carreta de Tomás', vende: ['potion', 'elixir', 'torch', 'tonic', 'whet', 'heart'] };
  const EXTRA = { whet: { max: 3, precio: 180, desc: '+1 de daño permanente (máx. 3). La tercera la trae Tomás.' }, heart: { max: 2, precio: 220, desc: '+1 corazón máximo (máx. 2). El segundo lo trae Tomás.' } };
  const BASE = {};
  const paso = s => (s && s.flags && s.flags.c2) || 0;

  // en la carreta de Tomás, la piedra y el amuleto tienen un nivel más; en las otras tiendas, los topes de siempre
  const ajustar = S => {
    if (typeof SHOP_ITEMS === 'undefined') return;
    const t = S._ckTienda, enCarreta = !!(t && t.id === CARRETA.id), s = S.story;
    SHOP_ITEMS.forEach(it => {
      const e = EXTRA[it.id]; if (!e) return;
      if (!BASE[it.id]) BASE[it.id] = { max: it.max, price: it.price, desc: it.desc };
      const b = BASE[it.id], tiene = (s && s.up && s.up[it.stat]) || 0;
      if (enCarreta) { it.max = e.max; it.price = tiene >= b.max ? e.precio : b.price; it.desc = e.desc; }
      else { it.max = b.max; it.price = b.price; it.desc = b.desc; }
    });
  };
  const r0 = P.renderShop;
  P.renderShop = function () { try { ajustar(this); } catch (e) {} return r0.apply(this, arguments); };
  const b0 = P.buyItem;
  P.buyItem = function () { try { ajustar(this); } catch (e) {} return b0.apply(this, arguments); };

  // al terminar de hablar con Tomás (ya pedida la ayuda), se abre la carreta
  const t0 = P.onTalked;
  P.onTalked = function (id) {
    const r = t0.apply(this, arguments);
    try {
      if (id === 'mercader' && this._gameMode === 'campaign' && paso(this.story) >= 4) {
        this.time.delayedCall(400, () => {
          if (this.dialogOpen || this._overlay || this.isDead) return;
          this._ckTienda = CARRETA; this._ckTiendaForzada = true;
          this.openShop();
        });
      }
    } catch (e) {}
    return r;
  };
  // el cartel de la carreta junto al mercader cuando ya vende
  const u0 = P.updateStory;
  P.updateStory = function () {
    const r = u0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt');
      if (pr && pr.classList.contains('on') && paso(this.story) >= 4 && this.nearbyStoryNPC) {
        const n = this.nearbyStoryNPC();
        if (n && n.npc && n.npc.id === 'mercader' && !/carreta/.test(pr.textContent)) pr.textContent += '  ·  y comprar en su carreta';
      }
    } catch (e) {}
    return r;
  };
  window.CK_ECONOMIA_FRONTERA = { CARRETA, EXTRA };
})();
