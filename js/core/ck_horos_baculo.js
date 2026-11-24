'use strict';
/* Horos: el báculo brilla del color de cada hechizo, sin las esquirlas ni la bola de fuego dibujadas en su hoja, y los
   hechizos fuertes se cargan antes (21/11, notas del dueño en el editor de habilidades):
   - "cuando tira esta habilidad brille el báculo, que sea el contorno en azul parecido al efecto" (nova), "que el báculo
     brille en azul y no rojo" (ráfaga helada, prisión, lanza), "violeta como el efecto" (tormenta, misiles), "verde" (drenaje).
   - "quitar los frames de esas esquirlas" (lanza, drenaje) y "quitar los frames de la animación de bola de fuego que viene por
     defecto" (tres soles): las hojas wizard_attack1 y wizard_attack2 traen dibujadas las esquirlas de hielo y la bola de fuego.
   - "1 segundo de anticipación" (tres soles, tormenta) y "que los proyectiles salgan cuando el báculo está extendido".
   Cómo: al empezar, de las hojas de Horos se arman dos animaciones nuevas por color (en un lienzo, sin tocar las hojas):
   - wizard_attack1_hb_<color>: wizard_attack1 hasta que levanta el báculo encendido (cuadros 0-4) y lo sostiene; sin esquirlas.
   - wizard_attack2_hb_<color>: wizard_attack2 hasta que extiende el báculo con el chorro (0-6) y lo sostiene; sin la bola de fuego.
   El brillo (los píxeles cálidos que no están en el Horos quieto) se repinta con el color del hechizo, con su luz y sombra.
   Mientras dura un hechizo con color, si su código pide wizard_attack1/2 (de costado) se usa la versión limpia y coloreada.
   De frente y de espaldas quedan las de siempre. Borrar su línea de index.html lo saca.
   v2 (21/11, "que las habilidades se casteen bien en las direcciones que se usen"): la nova y la lanza pedían la animación de
   costado aunque Horos mirara para arriba o abajo; ahora va la de esa dirección. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  // los colores: [oscuro, medio, claro] del brillo, y el tinte de la carga
  const COLORES = {
    azul: [[30, 70, 190], [80, 160, 255], [205, 240, 255], 0x8fd0ff],
    violeta: [[90, 30, 150], [175, 95, 255], [235, 205, 255], 0xc79bff],
    verde: [[25, 120, 55], [80, 230, 120], [210, 255, 215], 0x8dffa8],
    fuego: null
  };
  const COLOR = { nova: 'azul', b_escarcha: 'azul', prision: 'azul', lanza: 'azul', tormenta: 'violeta', misiles: 'violeta', drenaje: 'verde', triple_fuego: 'fuego' };
  const ANTICIPA = { triple_fuego: 1000, tormenta: 1000 };
  const LUZ = { azul: [140, 200, 255], violeta: [190, 140, 255], verde: [130, 255, 160], fuego: [255, 170, 90] };

  // ------------------------------------------------------------------ las hojas limpias y coloreadas
  const tibio = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0, v = mx / 255;
    if (s < 0.45 || v < 0.55) return false;
    let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
    return h < 62 || h > 335;
  };
  const cuadros = (S, key) => {
    const T = S.textures.get(key); if (!T || T.key === '__MISSING') return null;
    const im = T.getSourceImage(), n = Math.floor(im.width / 100), out = [];
    for (let i = 0; i < n; i++) { const c = document.createElement('canvas'); c.width = 100; c.height = 100; c.getContext('2d', { willReadFrequently: true }).drawImage(im, i * 100, 0, 100, 100, 0, 0, 100, 100); out.push(c); }
    return out;
  };
  const armar = S => {
    if (S._ckBacOk || !S.textures.exists('wizard_attack1') || !S.textures.exists('wizard_attack2') || !S.textures.exists('wizard_idle')) return;
    S._ckBacOk = true;
    try {
      // los colores del Horos quieto no se tocan (madera del báculo, cara)
      const quieto = new Set();
      cuadros(S, 'wizard_idle').forEach(c => { const d = c.getContext('2d').getImageData(0, 0, 100, 100).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100) quieto.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); });
      const A1 = cuadros(S, 'wizard_attack1'), A2 = cuadros(S, 'wizard_attack2');
      const elegir = (L, idx) => idx.map(i => L[Math.min(i, L.length - 1)]);
      const tiras = { cast: elegir(A1, [0, 1, 2, 3, 4, 4, 4, 4]), lanza: elegir(A2, [0, 1, 2, 3, 4, 5, 6, 6, 6]) };
      Object.keys(COLORES).forEach(col => {
        const C = COLORES[col];
        Object.keys(tiras).forEach(k => {
          const L = tiras[k], hoja = document.createElement('canvas'); hoja.width = 100 * L.length; hoja.height = 100;
          const g = hoja.getContext('2d', { willReadFrequently: true });
          L.forEach((c, i) => {
            g.drawImage(c, i * 100, 0);
            if (!C) return;
            const img = g.getImageData(i * 100, 0, 100, 100), d = img.data;
            for (let j = 0; j < d.length; j += 4) {
              if (d[j + 3] < 40) continue;
              const r = d[j], gg = d[j + 1], b = d[j + 2];
              if (quieto.has((r << 16) | (gg << 8) | b) || !tibio(r, gg, b)) continue;
              const v = Math.max(r, gg, b) / 255, t = Math.min(1, Math.max(0, (v - 0.55) / 0.45)), a = t < 0.5 ? C[0] : C[1], z = t < 0.5 ? C[1] : C[2], u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
              d[j] = Math.round(a[0] + (z[0] - a[0]) * u); d[j + 1] = Math.round(a[1] + (z[1] - a[1]) * u); d[j + 2] = Math.round(a[2] + (z[2] - a[2]) * u);
            }
            g.putImageData(img, i * 100, 0);
          });
          const key = (k === 'cast' ? 'wizard_attack1_hb_' : 'wizard_attack2_hb_') + col;          // (el juego reconoce los ataques por el nombre)
          if (S.textures.exists(key)) S.textures.remove(key);
          S.textures.addSpriteSheet(key, hoja, { frameWidth: 100, frameHeight: 100 });
          if (!S.anims.exists(key)) S.anims.create({ key, frames: S.anims.generateFrameNumbers(key, { start: 0, end: L.length - 1 }), frameRate: k === 'lanza' ? 17 : 15, repeat: 0 });
          // la carga (anticipación): levanta el báculo encendido y lo sostiene 1 s
          if (k === 'cast' && !S.anims.exists(key + '_carga')) S.anims.create({ key: key + '_carga', frames: S.anims.generateFrameNumbers(key, { frames: [0, 1, 2, 3, 4].concat(Array(10).fill(4)) }), frameRate: 15, repeat: 0 });
        });
      });
    } catch (e) { console.warn('[horos báculo]', e); }
  };

  // ------------------------------------------------------------------ mientras dura un hechizo con color
  const envolverPlay = S => {
    const p = S.player; if (!p || p._ckBac) return;
    p._ckBac = true;
    const play0 = p.play;
    p.play = function (key, ignorar) {
      try {
        const k = typeof key === 'string' ? key : key && key.key, col = S._ckBaculo;
        // (v2) de frente y de espaldas: si un hechizo pide la de costado (la nova y la lanza lo hacían), va la de esa dirección
        if (S.facingV && S.playerHero === 'wizard' && (k === 'wizard_attack1' || k === 'wizard_attack2') && S.anims.exists(k + '_' + S.facingV)) return play0.call(this, typeof key === 'string' ? k + '_' + S.facingV : Object.assign({}, key, { key: k + '_' + S.facingV }), ignorar);
        if (col && S.playerHero === 'wizard' && (k === 'wizard_attack1' || k === 'wizard_attack2')) {
          const nuevo = (k === 'wizard_attack1' ? 'wizard_attack1_hb_' : 'wizard_attack2_hb_') + col;
          if (S.anims.exists(nuevo)) return play0.call(this, nuevo, ignorar);
        }
      } catch (e) {}
      return play0.apply(this, arguments);
    };
  };
  const conColor = (S, col, ms) => {
    S._ckBaculo = col; const marca = S._ckBacN = (S._ckBacN || 0) + 1;
    S.time.delayedCall(Math.max(350, ms || 0) + 120, () => { if (S._ckBacN === marca) S._ckBaculo = null; });
  };
  // la carga de la anticipación: el báculo encendido y la energía que llega hasta la punta
  const cargar = (S, col, ms) => {
    const p = S.player, V = window.CK_VFX, izq = S.facingDirection === 'left';
    if (!S.facingV && S.anims.exists('wizard_attack1_hb_' + col + '_carga')) p.play('wizard_attack1_hb_' + col + '_carga', true);          // de frente o de espaldas: la de siempre
    else { const k = S.heroAnim ? S.heroAnim('wizard_attack1') : 'wizard_attack1'; if (S.anims.exists(k)) p.play(k, true); }
    const tinte = (COLORES[col] && COLORES[col][3]) || 0xffa04a;
    try {
      if (V && V.fx) {
        V.fx(S, 'carga', 0, 0, { escala: 0.75, tinte, suma: true, sigue: p, dx: izq ? -7 : 7, dy: -15, dura: ms - 150 });
        V.fx(S, 'runas', 0, 0, { escala: 0.7, tinte, alfa: 0.45, suma: true, sigue: p, dy: 10, dura: ms - 100, detras: true });
      }
      const L = LUZ[col] || LUZ.fuego; if (window.CK_LUZ) window.CK_LUZ.agregar({ x: p.x, y: p.y - 10, c: L, r: 90, f: 1, ms, curva: 'sube' });
    } catch (e) {}
  };

  // ------------------------------------------------------------------ envolver los hechizos
  const envolver = () => {
    const HB = window.CK_HABILIDADES, EQ = window.CK_EQUIPO;
    [HB && HB.HACER, EQ && EQ.hacerBase].forEach(T => {
      if (!T) return;
      Object.keys(COLOR).forEach(id => {
        const f0 = T[id]; if (!f0 || f0._ckBac) return;
        const col = COLOR[id], ant = ANTICIPA[id] || 0;
        const f = function (S) {
          if (!S || S.playerHero !== 'wizard') return f0.apply(this, arguments);
          armar(S); envolverPlay(S);
          if (!ant) { conColor(S, col, 600); const r = f0.apply(this, arguments); if (r === -1) S._ckBaculo = null; else conColor(S, col, r); return r; }
          const yo = this, args = arguments;
          conColor(S, col, ant + 700); cargar(S, col, ant);
          S.time.delayedCall(ant, () => { if (S.isDead || !S.player || !S.player.active) return; try { conColor(S, col, 700); const r = f0.apply(yo, args); conColor(S, col, r); } catch (e) { console.warn('[horos báculo]', id, e); } });
          return ant + 520;
        };
        Object.keys(f0).forEach(k => (f[k] = f0[k])); f._ckBac = true; f._ckFx = f0._ckFx; T[id] = f;
      });
    });
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      if (this.playerHero === 'wizard') { armar(this); if (this.player) envolverPlay(this); }
      const H = window.CK_HABILIDADES && window.CK_HABILIDADES.HACER;
      if (H && H.nova && H.nova._ckFx && !H.nova._ckBac) envolver();       // después de que ck_vfx.js sume sus efectos
    } catch (e) {}
    return r;
  };
  window.CK_HOROS_BACULO = { COLORES, COLOR, ANTICIPA, armar };
})();
