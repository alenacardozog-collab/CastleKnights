'use strict';
/* Economía balanceada (24/10, pedido del dueño). Antes, jugando de corrido se juntaban ~200 monedas en todo el capítulo
   y las mejoras de la tienda sumaban 630: casi nada se podía comprar sin repetir zonas.
   Ahora (todo en las tablas de abajo):
   - las bestias dan más monedas (las chicas ~2, las grandes 10-15, el Nigromante 60);
   - la tienda sale un poco menos (poción 12, elixir 35, antorcha 15, piedra 100, tónico 70, amuleto 140);
   - misiones con premio: el Capitán al volver con las 10 bestias (+40) y el ermitaño de las ruinas (+25), además del Rey (100);
   - partida nueva: arrancás con 20 monedas (alcanza para una antorcha o una poción);
   - caer en combate cuesta el 10% de las monedas (como mucho 50);
   - subir de nivel ya no borra el aguante del tónico (arreglo en ck_habilidades.js).
   Jugando de corrido ahora se juntan ~350 monedas: pociones y antorchas sin problema y una o dos mejoras; el resto, cazando.
   Borrar la línea de index.html vuelve a los valores de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const MONEDAS = { slime: 2, bat: 2, orc: 3, skeleton: 3, skeleton_archer: 4, orc_armored: 5, skeleton_armored: 5, werewolf: 6, orc_rider: 8, orc_elite: 9, werebear: 10, skeleton_great: 15, necromancer: 60 };
  const PRECIOS = { potion: 12, elixir: 35, torch: 15, whet: 100, tonic: 70, heart: 140 };
  const PREMIOS = { captain: [3, 40], hermit: [4, 25] };   // quién: [paso de la historia, monedas]
  const INICIO = 20, CAIDA = 0.1, CAIDA_MAX = 50;

  if (typeof ENEMY_TYPES !== 'undefined') Object.keys(MONEDAS).forEach(k => { if (ENEMY_TYPES[k]) ENEMY_TYPES[k].coins = MONEDAS[k]; });
  const precios = () => { if (typeof SHOP_ITEMS !== 'undefined') SHOP_ITEMS.forEach(i => { if (PRECIOS[i.id]) i.price = PRECIOS[i.id]; }); };
  precios();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', precios); else setTimeout(precios, 0);   // la antorcha entra a la tienda después

  const monedas = (S, n, txt) => {
    S.story.coins += n;
    if (S.player) S.createFloatingText(S.player.x + 16, S.player.y - 30, `+${n} monedas`, 0xfcd34d);
    try { sfx.fx('coin', 0.5); } catch (e) {}
    S.updateObjective && S.updateObjective();
  };
  const t0 = P.onTalked;
  P.onTalked = function (id) {
    const s = this.story, paso = s && s.step, h0 = s && s.flags && s.flags.h;
    const r = t0.apply(this, arguments);
    try {
      const pr = PREMIOS[id];
      if (pr && s && paso === pr[0] && (s.step !== paso || (s.flags && s.flags.h) !== h0) && !(s.flags && s.flags['premio_' + id])) {
        s.flags = s.flags || {}; s.flags['premio_' + id] = true;
        this.time.delayedCall(600, () => monedas(this, pr[1]));
        this.saveStory && this.saveStory();
      }
    } catch (e) {}
    return r;
  };
  const i0 = P.initStory;
  P.initStory = function () {
    const r = i0 ? i0.apply(this, arguments) : undefined;
    try {
      const s = this.story;
      if (s && this._gameMode === 'campaign' && s.step === 0 && !s.xp && !(s.flags && s.flags.eco_inicio)) {
        s.flags = s.flags || {}; s.flags.eco_inicio = true;
        s.coins = Math.max(s.coins || 0, INICIO);
        this.updateObjective && this.updateObjective();
      }
    } catch (e) {}
    return r;
  };
  const d0 = P.campaignDefeat;
  P.campaignDefeat = function () {
    const s = this.story;
    const pierde = s ? Math.min(CAIDA_MAX, Math.floor((s.coins || 0) * CAIDA)) : 0;
    if (pierde > 0) s.coins -= pierde;
    const r = d0.apply(this, arguments);
    if (pierde > 0) {
      this.time.delayedCall(700, () => { if (window.CK_SIN_CARTELES_API) window.CK_SIN_CARTELES_API.nota(`Perdiste ${pierde} monedas al caer`); this.updateObjective && this.updateObjective(); });
      this.saveStory && this.saveStory();
    }
    return r;
  };
  window.CK_ECONOMIA = { MONEDAS, PRECIOS, PREMIOS, INICIO };
})();
