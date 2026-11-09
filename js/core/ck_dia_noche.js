'use strict';
/* Día y noche más largos, luna llena y clima más variado (08/11, pedido del dueño: "que día noche cambie cada 10 minutos",
   "que las estaciones invierno, lluvia y tormenta sean al azar", "que la luna llena potencie a los lobos").
   - El día dura 10 minutos y la noche otros 10 (contando el atardecer y el amanecer, 1 minuto cada uno). Antes, el día
     entero eran 5 minutos y la noche apenas 1 y medio. Por dentro el reloj sigue igual (dayPhase de 0 a 1, la noche entre
     0,62 y 0,92), así todo lo que mira la hora (luces, fauna, siesta, dormir en la cama) sigue andando sin tocarlo:
     lo que cambia es lo rápido que corre cada tramo.
   - Luna llena: una noche de cada tres (la segunda, la quinta…). Se avisa al caer la noche y se ve en el recuadro del
     objetivo; los lobos se ponen bravos (ck_clima_efectos.js).
   - Clima: sigue al azar, pero cada uno dura más (de 2 y medio a 5 y medio minutos) y nieve (invierno), lluvia y tormenta
     salen más seguido que antes.
   Probar: ?ck_hora=noche | dia | atardecer (empieza a esa hora), ?ck_luna=llena (luna llena en cualquier noche).
   Borrar la línea de index.html lo deja como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const DIA = 300000;  // un día del reloj de adentro (lo que usa dayPhase)
  // tramos del reloj de adentro y cuánto duran de verdad (ms)
  const TRAMOS = [
    { hasta: 0.52, real: 540000 },  // día pleno: 9 min
    { hasta: 0.62, real: 60000 },   // atardecer: 1 min
    { hasta: 0.92, real: 540000 },  // noche cerrada: 9 min
    { hasta: 1.0, real: 60000 }     // amanecer: 1 min
  ];
  const ritmo = p => {
    let desde = 0;
    for (const t of TRAMOS) { if (p < t.hasta) return ((t.hasta - desde) * DIA) / t.real; desde = t.hasta; }
    return 1;
  };
  const CADA_LUNA = 3, LUNA_EN = 1;   // luna llena: la noche 1, 4, 7… (la segunda noche de la partida)
  const forzarLuna = /[?&]ck_luna=llena/.test(location.search);
  const hora = (/[?&]ck_hora=(\w+)/.exec(location.search) || [])[1];

  // ------------------------------------------------------------------ el reloj
  const dn0 = P.updateDayNight;
  P.updateDayNight = function (dt) {
    if (hora && !this._ckHoraPuesta && this._gameMode === 'campaign') {
      this._ckHoraPuesta = true;
      const p = { noche: 0.66, dia: 0.1, atardecer: 0.53, amanecer: 0.93 }[hora];
      if (p !== undefined) this.dayClock = Math.floor((this.dayClock || 0) / DIA) * DIA + p * DIA;
    }
    const antes = this.dayClock || 0, r = dn0.apply(this, arguments);
    // la base sumó dt entero: se descuenta lo que sobra según el tramo
    const sumo = (this.dayClock || 0) - antes;
    if (sumo > 0 && sumo < 1000) this.dayClock = antes + sumo * ritmo(this.dayPhase());
    return r;
  };

  // ------------------------------------------------------------------ la luna
  const noche = S => Math.floor((S.dayClock || 0) / DIA);
  const lunaLlena = S => !!(S && S.isNight && S.isNight() && (forzarLuna || noche(S) % CADA_LUNA === LUNA_EN));
  P.ckLunaLlena = function () { return lunaLlena(this); };

  // el título de la noche avisa la luna
  const tz0 = P.showZoneTitle;
  if (tz0) P.showZoneTitle = function (t, sub) {
    if (t === 'Cae la noche' && lunaLlena(this)) {
      sub = 'Luna llena: los lobos andan bravos';
      try { if (window.CK_SONIDOS) this.time.delayedCall(1400, () => CK_SONIDOS.son('ev_aullido', 0.5, { gap: 4000 })); } catch (e) {}
    }
    return tz0.call(this, t, sub);
  };
  // y el recuadro del objetivo
  const obj0 = P.updateObjective;
  if (obj0) P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const b = document.querySelector('#ck-objective .ck-obj-purse');
      if (b && this.story) {
        let el = b.querySelector('.ck-luna');
        if (!el) { el = document.createElement('span'); el.className = 'ck-luna'; el.style.marginLeft = '6px'; b.appendChild(el); }
        el.textContent = lunaLlena(this) ? '◯ Luna llena' : '';
        el.style.display = lunaLlena(this) ? '' : 'none';
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ clima más largo y más variado
  const ajustarClima = () => {
    const K = window.CK_CLIMA; if (!K || !K.PESOS || ajustarClima.ok) return; ajustarClima.ok = true;
    K.DURA[0] = 150000; K.DURA[1] = 330000;
    Object.assign(K.PESOS.normal, { despejado: 34, nublado: 16, lluvia: 18, tormenta: 11, nieve: 13, niebla: 8 });
  };
  ajustarClima();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ajustarClima);

  window.CK_DIA_NOCHE = {
    TRAMOS, DIA, CADA_LUNA,
    lunaLlena: () => lunaLlena(window.activeGameScene || (window.game && game.scene.scenes.find(s => s.startCampaign))),
    ritmo
  };
})();
