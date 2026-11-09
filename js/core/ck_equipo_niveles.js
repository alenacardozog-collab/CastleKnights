'use strict';
/* Equipo por capítulo (07/11, pedido del dueño: "agregá todo eso"). Para que las monedas siempre tengan en qué gastarse:
   tres piezas de equipo con tres niveles cada una; cada capítulo trae el nivel siguiente.
   - ESPADA: +¼ de corazón por golpe en cada nivel (+25 % del golpe básico; se suma a las piedras, ck_vida_fina.js).
   - ARMADURA: probabilidad de que un golpe no te saque vida ("¡La armadura aguanta!"): 15 %, 25 %, 35 %.
   - TALISMÁN DEL VIENTO: el aguante se recupera más rápido: +20 %, +40 %, +60 % (dash, parada, habilidades).
   Dónde: nivel 1 en la aldea (la Herrería: espada y armadura; el puesto del mercado del castillo: talismán; la Tienda de
   Víveres: todo), nivel 2 en la Carreta de Tomás (capítulo 2), nivel 3 queda para la tienda del capítulo 3 (TOPE).
   Precios en PRECIO. Se guarda en la partida (story.up.espada / armadura / talisman). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof SHOP_ITEMS === 'undefined') return;
  const P = MainGameScene.prototype;
  const PIEZAS = {
    espada: { nombres: ['Espada de acero', 'Espada orca templada', 'Hoja de los antiguos'], precio: [90, 200, 400], desc: n => `+${n * 25} % de daño en cada golpe (nivel ${n}).` },
    armadura: { nombres: ['Cota de malla', 'Armadura de placas orca', 'Armadura de los antiguos'], precio: [100, 220, 420], desc: n => `${[15, 25, 35][n - 1]} % de que un golpe no te saque vida (nivel ${n}).` },
    talisman: { nombres: ['Talismán del viento', 'Talismán de la tormenta', 'Talismán del vendaval'], precio: [70, 160, 320], desc: n => `El aguante se recupera un ${n * 20} % más rápido (nivel ${n}).` }
  };
  const ARMADURA = [0, 0.15, 0.25, 0.35], VIENTO = 0.2, ESPADA = 0.25;
  const TOPE = { tomas: 2 };   // hasta qué nivel vende cada tienda (las demás, 1); la del capítulo 3 irá con 3
  const DONDE = { 'Herrería': ['espada', 'armadura'], 'Puesto del mercado': ['talisman'], 'Tienda de Víveres': ['espada', 'armadura', 'talisman'] };
  const nivel = (S, k) => (S && S.story && S.story.up && S.story.up[k]) || 0;
  const campana = S => S._gameMode === 'campaign' && S.story;

  // en la tienda: una fila por pieza, con el nombre y el precio del nivel que sigue
  Object.keys(PIEZAS).forEach(k => {
    if (!SHOP_ITEMS.find(i => i.id === k)) SHOP_ITEMS.push({ id: k, name: PIEZAS[k].nombres[0], price: PIEZAS[k].precio[0], desc: PIEZAS[k].desc(1), max: 1, stat: k });
  });
  const ajustar = S => {
    const s = S.story; if (!s) return;
    s.up = s.up || {};
    const t = S._ckTienda, tope = (t && TOPE[t.id]) || 1;
    Object.keys(PIEZAS).forEach(k => {
      if (s.up[k] === undefined) s.up[k] = 0;
      const it = SHOP_ITEMS.find(i => i.id === k), n = Math.min(3, s.up[k] + 1), D = PIEZAS[k];
      it.max = tope; it.price = D.precio[n - 1];
      it.name = s.up[k] >= tope ? D.nombres[Math.max(0, s.up[k] - 1)] : D.nombres[n - 1];
      it.desc = s.up[k] >= tope ? D.desc(Math.max(1, s.up[k])) + (tope < 3 ? ' El próximo nivel, más adelante.' : '') : D.desc(n);
    });
  };
  // las tiendas que venden equipo
  const tiendas = () => {
    const T = window.CK_TIENDAS && window.CK_TIENDAS.TIENDAS;
    if (T) T.forEach(t => (DONDE[t.nombre] || []).forEach(k => { if (t.vende.indexOf(k) < 0) t.vende.push(k); }));
    const C = window.CK_ECONOMIA_FRONTERA && window.CK_ECONOMIA_FRONTERA.CARRETA;
    if (C) Object.keys(PIEZAS).forEach(k => { if (C.vende.indexOf(k) < 0) C.vende.push(k); });
  };
  tiendas();
  const r0 = P.renderShop;
  P.renderShop = function () { try { tiendas(); ajustar(this); } catch (e) {} return r0.apply(this, arguments); };
  const b0 = P.buyItem;
  P.buyItem = function (id) {
    try { ajustar(this); } catch (e) {}
    const antes = PIEZAS[id] ? nivel(this, id) : -1;
    const r = b0.apply(this, arguments);
    try {
      if (antes >= 0 && nivel(this, id) > antes && this.player) {
        this.createFloatingText(this.player.x, this.player.y - 50, '¡' + PIEZAS[id].nombres[nivel(this, id) - 1].toUpperCase() + '!', 0xfde68a);
        this.renderShop();
      }
    } catch (e) {}
    return r;
  };

  // armadura: a veces el golpe no entra
  const dp0 = P.damagePlayer;
  P.damagePlayer = function (amount) {
    const n = nivel(this, 'armadura');
    if (n && campana(this) && !this.isInvulnerable && !this.isDead && !this.dialogOpen && !this._doorTransition && !this.isGamePaused && Math.random() < ARMADURA[n]) {
      const p = this.player;
      this.createFloatingText(p.x, p.y - 44, '¡LA ARMADURA AGUANTA!', 0xcbd5e1);
      try { sfx.fx('sword_hit', 0.7, { rate: 0.8 }); } catch (e) {}
      this.cameras.main.shake(90, 0.004);
      this.isInvulnerable = true;
      this.time.delayedCall(450, () => { this.isInvulnerable = false; });
      return;
    }
    return dp0.apply(this, arguments);
  };
  // talismán: aguante extra por segundo
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const n = nivel(this, 'talisman');
      if (n && campana(this) && this.gameStarted && !this.isDead && !this.isGamePaused && this.stamina < this.maxStamina) {
        const dt = delta || 16.7;
        this.stamina = Math.min(this.maxStamina, this.stamina + (this.staminaRegenRate || 18) * VIENTO * n * dt / 1000);
      }
    } catch (e) {}
    return r;
  };
  window.CK_EQUIPO_NIVELES = { PIEZAS, ARMADURA, TOPE, DONDE, nivel, dano: S => (campana(S) ? ESPADA * nivel(S, 'espada') : 0) };
})();
