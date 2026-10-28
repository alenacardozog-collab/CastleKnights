'use strict';
/* Tiendas que sirven (19/10, pedido del dueño): al acercarse aparece "T · Comprar en ..." y con T se abre la ventana de compras
   con lo que vende ese lugar. Los precios y los efectos son los de SHOP_ITEMS (js/scene/systems/extras.js).
   - Tienda de Víveres de la aldea (por dentro): todo (pociones, elixir, piedra de afilar, tónico, amuleto).
   - El Posadero Mercader que pasea por la aldea: pociones y elixir.
   - Puesto del panadero en el patio del castillo: pociones, elixir y tónico.
   - Herrería: piedra de afilar.
   Borrar la línea de este archivo en index.html lo saca (queda la tienda de antes: T dentro de la Tienda o con el Posadero). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  // zona, nombre en la ventana, qué vende y dónde se compra (relativo al área; null = en toda el área)
  const TIENDAS = [
    { zona: /^tienda\./, nombre: 'Tienda de Víveres', vende: ['potion', 'elixir', 'whet', 'tonic', 'heart'], x: 250, y: 160, r: 90 },
    { zona: /^castle\.courtyard$/, nombre: 'Puesto del mercado', vende: ['potion', 'elixir', 'tonic'], x: 176, y: 330, r: 42 },
    { zona: /^ed_herreria\./, nombre: 'Herrería', vende: ['whet'], x: 98, y: 276, r: 46 },
    { zona: /^village$/, nombre: 'Posadero Mercader', vende: ['potion', 'elixir'], npc: 'npc2', r: 40 }
  ];

  const cerca = S => {
    if (!S.story || !S.player || !S.player.body || S._gameMode !== 'campaign') return null;
    const zona = S.currentZoneKey ? S.currentZoneKey() : '';
    const b = S.player.body, c = S.currentInterior, ox = c ? c.area.x : 0, oy = c ? c.area.y : 0;
    for (const t of TIENDAS) {
      if (!t.zona.test(zona)) continue;
      let x, y;
      if (t.npc) {
        const n = (S.campaignNPCs || []).find(v => v.id === t.npc && v.sprite && v.sprite.active);
        if (!n) continue;
        x = n.sprite.x; y = n.sprite.y;
      } else { x = ox + t.x; y = oy + t.y; }
      if (Phaser.Math.Distance.Between(b.center.x, b.center.y, x, y) <= t.r) return t;
    }
    return null;
  };

  // la ventana muestra el nombre del lugar y sólo lo que se vende ahí
  const r0 = P.renderShop;
  P.renderShop = function () {
    r0.apply(this, arguments);
    const t = this._ckTienda, el = document.getElementById('ck-shop');
    if (!el) return;
    const h = el.querySelector('h3');
    if (h) h.textContent = t ? t.nombre : 'Tienda de la aldea';
    el.querySelectorAll('.ck-item').forEach(row => {
      const bt = row.querySelector('button[data-id]');
      row.style.display = !t || !bt || t.vende.includes(bt.dataset.id) ? '' : 'none';
    });
  };
  const o0 = P.openShop;
  P.openShop = function () {
    if (!this._ckTiendaForzada) this._ckTienda = cerca(this) || TIENDAS.find(t => t.zona.test(this.currentZoneKey ? this.currentZoneKey() : '')) || null;
    this._ckTiendaForzada = false;
    return o0.apply(this, arguments);
  };

  // T: si hay una tienda al lado (y no un personaje de la historia), se compra
  const i0 = P.interact;
  P.interact = function () {
    if (!this._overlay && !this.dialogOpen && !this.isDead && !this._doorTransition && this._gameMode === 'campaign') {
      const t = cerca(this);
      if (t && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) {
        this._ckTienda = t; this._ckTiendaForzada = true;
        this.openShop();
        return;
      }
    }
    return i0.apply(this, arguments);
  };

  // el cartel "T · Comprar en ..." (después del de la historia, que lo apaga cuando no hay nadie con quien hablar)
  const u0 = P.updateStory;
  P.updateStory = function () {
    const r = u0.apply(this, arguments);
    const pr = document.getElementById('ck-prompt');
    if (pr && !this.dialogOpen && !this._overlay && !pr.classList.contains('on')) {
      const t = cerca(this);
      if (t) { pr.textContent = 'T · Comprar en ' + (t.nombre === 'Posadero Mercader' ? 'el puesto del Posadero' : t.nombre === 'Herrería' ? 'la Herrería' : t.nombre === 'Puesto del mercado' ? 'el puesto del mercado' : 'la Tienda'); pr.classList.add('on'); this._ckTiendaCartel = true; }
    } else if (pr && this._ckTiendaCartel && !cerca(this)) { this._ckTiendaCartel = false; }
    return r;
  };

  window.CK_TIENDAS = { TIENDAS, cerca };
})();
