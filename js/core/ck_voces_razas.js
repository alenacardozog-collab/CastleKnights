'use strict';
/* Voces por raza (15/11, pedido del dueño: "cuando otros npc, enemigos y eso hablen que sea igual como hablan ahora pero si
   son orcos con tono de voz más grueso, y así, y los demonios también con tono de voz tenebroso").
   Es la misma voz balbuceada de los diálogos (ck_sonido.js), sólo que según quién habla (su nombre o su cara):
   - ORCOS (Grushak, Gorak, el Caudillo, los campeones del coliseo, el chamán…): la voz de soldado mucho más grave.
   - DEMONIOS (Azrath, el Rey Demonio, Malakar el Brujo del Sello, los jefes del reino corrompido): la voz oscura, muy grave
     y doblada (dos voces apenas desafinadas a la vez, suena hueca y tenebrosa).
   - BESTIAS que hablan (Urso): grave y lenta, como un gruñido.
   - FANTASMAS y espectros: la voz doblada y un poco aflautada, como un eco.
   No usa sonidos nuevos (no gasta créditos). Va después de ck_voces_nuevas.js. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const azar = (a, b) => a + Math.random() * (b - a);
  // [regla, voz, tono (velocidad), segunda voz {tono relativo, volumen} o null]
  const RAZAS = [
    [/demonio|azrath|malakar|brujo del sello|warlock|orbath|fauces|seravel|taurax|gromm|morvane|segadora|infernal/i, 'voz_varek', 0.6, { t: 0.9, v: 0.5 }],
    [/\borc|orco|caudillo|gorak|grushak|gorvak|kragmor|ulrak|chamán|chaman|uruk|ogro|trasgo/i, 'voz_soldado', 0.72, null],
    [/\burso\b|\boso\b/i, 'voz_soldado', 0.62, null],
    [/fantasma|espectro|alma en pena|aparecid/i, 'voz_mujer', 0.86, { t: 1.06, v: 0.35 }]
  ];
  const razaDe = (nombre, cara) => {
    const txt = (nombre || '') + ' ' + (cara || '');
    return RAZAS.find(r => r[0].test(txt)) || null;
  };
  const SND = () => window.CK_SONIDO;
  let capa = null, de = null;                        // la segunda voz (demonios y fantasmas) y la voz que la lleva
  const callarCapa = seg => { if (capa) { try { capa.parar(seg || 0.12); } catch (e) {} capa = null; de = null; } };

  const pintar0 = P.renderDialog;
  P.renderDialog = function () {
    const d = this._dlg, S = SND();
    try {
      if (d && S && !d._ckVoz) {
        const r = razaDe(d.name, S._ultimaCara);
        if (r && S.buf && S.buf[r[1]]) { d._ckVoz = r[1]; d._ckTono = r[2] * azar(0.97, 1.03); d._ckI = -1; d._ckVisto = 0; d._ckRaza = r; }
      }
    } catch (e) {}
    const res = pintar0.apply(this, arguments);
    try {
      const d2 = this._dlg;
      if (!S || !d2 || !d2._ckRaza || !d2._ckRaza[3]) { if (capa && (!S || S.voz !== de)) callarCapa(0.1); return res; }
      // una voz nueva arrancó (línea nueva): se le suma la segunda, apenas desafinada
      if (S.voz && S.voz !== de) {
        callarCapa(0.05);
        const r = d2._ckRaza, b = S.buf[r[1]];
        if (b && S.tocar) {
          const resto = (d2.lines[d2.i] || '').length - d2.shown, dura = Math.max(0.35, Math.min(2.6, resto * 0.024 + 0.15));
          capa = S.tocar(r[1], { vol: r[3].v, rate: d2._ckTono * r[3].t, desde: azar(0, Math.max(0, b.duration - dura)), dura: Math.min(dura, b.duration), entra: 0.03, sale: 0.2 });
          de = S.voz;
        }
      }
      if (capa && S.voz !== de) callarCapa(0.15);
    } catch (e) {}
    return res;
  };
  // si el diálogo se cierra con la voz sonando, también se calla la segunda
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try { const S = SND(); if (capa && (!this._dlg || !S || S.voz !== de)) callarCapa(0.15); } catch (e) {}
    return r;
  };
  window.CK_VOCES_RAZAS = { RAZAS, razaDe };
})();
