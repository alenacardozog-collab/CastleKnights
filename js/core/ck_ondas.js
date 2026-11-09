'use strict';
/* Ondas expansivas con partículas del elemento (03/11, pedido del dueño: "no me gustan las ondas expansivas que son un
   círculo que se expande; que sea acorde a la habilidad: si es terremoto, partículas de tierra; si es fuego, de fuego;
   y así con las demás").
   - Todos los anillos que se agrandaban (grito, nova, remolino, salto, golpe de escudo, prisión, pirueta, misiles,
     explosiones, rugido...) ya no se dibujan: en su lugar sale un estallido de partículas del mismo tamaño y duración,
     según el color que tenía el anillo:
       tierra  (marrón/arena): terrones que saltan y rebotan, piedritas y polvo que se abre;
       fuego   (naranja/rojo): brasas que salen y suben, lenguas de fuego cortas, humo;
       hielo   (celeste):      esquirlas que giran y caen, copos que flotan;
       arcano  (violeta):      chispas que salen en espiral y destellos en cruz;
       luz     (dorado):       destellos dorados en cruz y motas que suben;
       filo    (rosa):         pétalos y chispas rosadas (Aby);
       acero   (blanco/azul):  chispas rápidas de metal;
       trueno  (amarillo/azul eléctrico): chispas en zigzag.
   - ck_vfx.js también lo usa (CK_ONDAS.estallido) para el rugido, la avalancha, el trueno y las ultis.
   Las partículas se dibujan a píxel en una sola capa por escena. Borrar la línea de index.html vuelve a los anillos. */
(function () {
  if (typeof Phaser === 'undefined') return;
  const R = (a, b) => a + Math.random() * (b - a);
  const RI = (a, b) => Math.floor(R(a, b + 1));
  const uno = a => a[Math.floor(Math.random() * a.length)];
  const SQ = 0.62;                     // el piso visto en perspectiva: lo vertical se achica

  const PAL = {
    tierra: ['#2a1c10', '#4a3420', '#6b4c2e', '#8a6a44', '#b89a6a'],
    polvo: ['#8a7a64', '#a8977c', '#c8b898'],
    fuego: ['#fff3b0', '#ffd25a', '#ffa04a', '#e8501c', '#8a1a06'],
    humo: ['#3a3236', '#5a5054', '#7a7074'],
    hielo: ['#ffffff', '#e0f6ff', '#9fe0ff', '#5aa8e0', '#2a5a9a'],
    arcano: ['#ffffff', '#f0dcff', '#c89cff', '#8a4ae0', '#4a1a8a'],
    luz: ['#ffffff', '#fff6c0', '#ffe08a', '#ffc040', '#c08a20'],
    filo: ['#ffffff', '#ffd0dc', '#ff9ab8', '#e0305a', '#8a1030'],
    acero: ['#ffffff', '#e8f0ff', '#bfdbfe', '#7a9ac0'],
    trueno: ['#ffffff', '#fff6b0', '#9fd8ff', '#4a8aff']
  };
  // color del anillo viejo → elemento
  const elemento = col => {
    if (col === undefined || col === null) return 'acero';
    const c = Phaser.Display.Color.IntegerToColor(col), h = c.h * 360, s = c.s, v = c.v;
    if (s < 0.18) return v > 0.7 ? 'acero' : 'tierra';
    if (h >= 18 && h < 48 && s < 0.55 && v < 0.92) return 'tierra';   // arena / marrón (salto, pisotón)
    if (h < 18 || h >= 345) return s > 0.5 ? 'fuego' : 'filo';
    if (h < 40) return 'fuego';
    if (h < 65) return 'luz';
    if (h < 170) return 'luz';
    if (h < 205) return 'hielo';
    if (h < 235) return s < 0.35 ? 'acero' : 'hielo';
    if (h < 300) return 'arcano';
    return 'filo';
  };

  // ------------------------------------------------------------------ partículas
  const capas = new WeakMap();
  const capa = S => {
    let C = capas.get(S);
    if (!C || !C.g.scene) {
      C = { g: S.add.graphics().setDepth(29990), a: S.add.graphics().setDepth(29991).setBlendMode(Phaser.BlendModes.ADD), p: [] };
      capas.set(S, C);
      S.events.on('postupdate', () => cuadro(S, C));
      S.events.once('shutdown', () => capas.delete(S));
    }
    return C;
  };
  const hex = h => parseInt(h.slice(1), 16);
  const cuadro = (S, C) => {
    const dt = Math.min(50, S.game.loop.delta || 16) / 1000, P = C.p;
    C.g.clear(); C.a.clear();
    for (let i = P.length - 1; i >= 0; i--) {
      const o = P[i]; o.t += dt * 1000;
      if (o.t >= o.vida) { P.splice(i, 1); continue; }
      const k = o.t / o.vida;
      o.vx *= o.roce; o.vy *= o.roce; o.vz += o.g * dt;
      o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
      if (o.z > 0 && o.rebota) { o.z = 0; o.vz *= -0.35; o.vx *= 0.6; o.vy *= 0.6; if (Math.abs(o.vz) < 20) o.rebota = false; }
      if (o.z > 0 && !o.rebota && o.g > 0) { o.z = 0; o.vz = 0; o.vx *= 0.8; o.vy *= 0.8; }
      const x = Math.round(o.x), y = Math.round(o.y + o.z);
      const col = o.cols[Math.min(o.cols.length - 1, Math.floor(k * o.cols.length))];
      const al = o.fade ? (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3) : 1;
      const G = o.luz ? C.a : C.g, s = Math.max(1, Math.round(o.s * (o.encoge ? 1 - k * 0.7 : o.crece ? 1 + k * 1.6 : 1)));
      G.fillStyle(hex(col), al * (o.alfa || 1));
      if (o.forma === 'cruz') { G.fillRect(x - s, y, s * 2 + 1, 1); G.fillRect(x, y - s, 1, s * 2 + 1); }
      else if (o.forma === 'nube') { G.fillCircle(x, y, s); }
      else if (o.forma === 'lengua') { G.fillRect(x - 1, y - s * 2, 2, s * 2); G.fillRect(x, y - s * 3, 1, s); }
      else if (o.forma === 'esquirla') { const a = o.giro += o.vg * dt; const dx = Math.round(Math.cos(a) * s), dy = Math.round(Math.sin(a) * s); G.fillRect(x - dx, y - dy, 2, 2); G.fillRect(x, y, 2, 2); G.fillRect(x + dx, y + dy, 1, 1); }
      else if (o.forma === 'raya') { const n = Math.max(2, s * 2), vx = o.vx, vy = o.vy + o.vz, m = Math.hypot(vx, vy) || 1; for (let j = 0; j < n; j++) G.fillRect(Math.round(x - vx / m * j), Math.round(y - vy / m * j), 1, 1); }
      else if (o.forma === 'petalo') { const a = o.giro += o.vg * dt; G.fillRect(x, y, 2, 1); G.fillRect(x + (Math.cos(a) > 0 ? 1 : -1), y + 1, 2, 1); }
      else G.fillRect(x - (s >> 1), y - (s >> 1), s, s);
    }
    if (P.length > 900) P.splice(0, P.length - 900);
  };
  const part = (S, o) => capa(S).p.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, roce: 0.96, t: 0, vida: 600, s: 2, cols: ['#fff'], fade: true, giro: R(0, 6.3), vg: R(-8, 8) }, o));

  // ------------------------------------------------------------------ estallidos por elemento
  const radial = (n, rad, ms, f) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R(-0.25, 0.25), sp = rad / (ms / 1000) * R(0.55, 1.05); f(Math.cos(a), Math.sin(a) * SQ, sp, a); } };
  const TIPO = {
    tierra(S, x, y, rad, ms) {
      radial(Math.round(16 + rad * 0.22), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp * 0.8, vy: cy * sp * 0.8, vz: -R(60, 160), g: 520, rebota: true, roce: 0.97, vida: R(500, 850), s: RI(2, 4), cols: PAL.tierra.slice(0, 4).reverse(), fade: true }));
      radial(10, rad, ms, (cx, cy, sp) => part(S, { x: x + cx * 4, y: y + cy * 4, vx: cx * sp * 0.65, vy: cy * sp * 0.65, roce: 0.92, vida: R(500, 800), s: RI(4, 6), forma: 'nube', crece: true, cols: PAL.polvo, alfa: 0.55 }));
      for (let i = 0; i < 10; i++) part(S, { x: x + R(-rad, rad) * 0.6, y: y + R(-rad, rad) * 0.35, vz: -R(90, 200), g: 600, rebota: true, vida: R(400, 700), s: 1, cols: ['#2a1c10', '#4a3420'] });
    },
    fuego(S, x, y, rad, ms) {
      radial(Math.round(18 + rad * 0.25), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp, vy: cy * sp, vz: -R(10, 50), g: -R(40, 90), roce: 0.93, vida: R(450, 800), s: RI(1, 3), cols: PAL.fuego, luz: true, encoge: true }));
      radial(12, rad * 0.8, ms, (cx, cy, sp) => part(S, { x: x + cx * rad * 0.3, y: y + cy * rad * 0.3, vx: cx * sp * 0.6, vy: cy * sp * 0.6, roce: 0.9, vida: R(250, 450), s: RI(2, 4), forma: 'lengua', cols: PAL.fuego, luz: true }));
      for (let i = 0; i < 6; i++) part(S, { x: x + R(-rad, rad) * 0.4, y: y + R(-rad, rad) * 0.2, vz: -R(20, 40), g: -30, vida: R(700, 1100), s: RI(3, 5), forma: 'nube', crece: true, cols: PAL.humo, alfa: 0.35 });
    },
    hielo(S, x, y, rad, ms) {
      radial(Math.round(14 + rad * 0.2), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp, vy: cy * sp, vz: -R(40, 120), g: 380, rebota: true, roce: 0.95, vida: R(550, 900), s: RI(2, 4), forma: 'esquirla', cols: PAL.hielo.slice(0, 4), vg: R(-14, 14) }));
      for (let i = 0; i < 16; i++) { const a = R(0, 6.3), d = R(0.2, 1) * rad; part(S, { x: x + Math.cos(a) * d * 0.4, y: y + Math.sin(a) * d * 0.25, vx: Math.cos(a) * d * 0.9, vy: Math.sin(a) * d * SQ * 0.9, vz: -R(10, 30), g: 10, roce: 0.97, vida: R(800, 1300), s: 1, forma: 'cruz', cols: ['#ffffff', '#e0f6ff', '#9fe0ff'], luz: true }); }
    },
    arcano(S, x, y, rad, ms) {
      radial(Math.round(20 + rad * 0.25), rad, ms, (cx, cy, sp, a) => { const t = a + Math.PI / 2; part(S, { x, y, vx: (cx + Math.cos(t) * 0.5) * sp, vy: (cy + Math.sin(t) * SQ * 0.5) * sp, vz: -R(0, 30), roce: 0.94, vida: R(450, 750), s: RI(1, 2), cols: PAL.arcano, luz: true, encoge: true }); });
      for (let i = 0; i < 9; i++) { const a = R(0, 6.3), d = R(0.3, 1) * rad; part(S, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * SQ, vz: -R(10, 40), vida: R(350, 650), s: RI(2, 3), forma: 'cruz', cols: PAL.arcano.slice(0, 3), luz: true }); }
    },
    luz(S, x, y, rad, ms) {
      radial(Math.round(16 + rad * 0.2), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp, vy: cy * sp, vz: -R(30, 90), g: -40, roce: 0.93, vida: R(500, 900), s: RI(1, 2), forma: Math.random() < 0.4 ? 'cruz' : null, cols: PAL.luz, luz: true }));
      for (let i = 0; i < 10; i++) part(S, { x: x + R(-rad, rad) * 0.5, y: y + R(-rad, rad) * 0.3, vz: -R(40, 90), g: -20, vida: R(700, 1100), s: 1, cols: PAL.luz.slice(0, 3), luz: true });
    },
    filo(S, x, y, rad, ms) {
      radial(Math.round(16 + rad * 0.22), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp, vy: cy * sp, vz: -R(20, 60), g: 60, roce: 0.95, vida: R(600, 1000), s: 2, forma: 'petalo', cols: PAL.filo.slice(1, 5), vg: R(-10, 10) }));
      radial(10, rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp * 1.3, vy: cy * sp * 1.3, roce: 0.9, vida: R(200, 350), s: 3, forma: 'raya', cols: ['#ffffff', '#ffd0dc'], luz: true }));
    },
    acero(S, x, y, rad, ms) {
      radial(Math.round(14 + rad * 0.2), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp * 1.3, vy: cy * sp * 1.3, vz: -R(20, 80), g: 300, roce: 0.92, vida: R(250, 450), s: 3, forma: 'raya', cols: PAL.acero, luz: true }));
      for (let i = 0; i < 6; i++) part(S, { x: x + R(-rad, rad) * 0.4, y: y + R(-rad, rad) * 0.25, vida: R(500, 800), s: RI(3, 5), forma: 'nube', crece: true, cols: PAL.polvo, alfa: 0.35 });
    },
    trueno(S, x, y, rad, ms) {
      radial(Math.round(16 + rad * 0.22), rad, ms, (cx, cy, sp) => part(S, { x, y, vx: cx * sp * 1.4, vy: cy * sp * 1.4, vz: -R(10, 60), g: 120, roce: 0.88, vida: R(200, 420), s: 3, forma: 'raya', cols: PAL.trueno, luz: true }));
      for (let i = 0; i < 8; i++) { const a = R(0, 6.3), d = R(0.3, 1) * rad; part(S, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * SQ, vida: R(120, 260), s: 2, forma: 'cruz', cols: ['#ffffff', '#fff6b0'], luz: true }); }
    }
  };
  /** Estallido de partículas en el piso (x, y). tipo: tierra | fuego | hielo | arcano | luz | filo | acero | trueno */
  const estallido = (S, tipo, x, y, rad, ms) => { try { (TIPO[tipo] || TIPO.acero)(S, x, y, Math.max(16, rad || 60), Math.max(180, ms || 400)); } catch (e) {} };

  // ------------------------------------------------------------------ los anillos viejos se cambian por partículas
  const Arc = Phaser.GameObjects.Arc;
  const add0 = Phaser.Tweens.TweenManager.prototype.add;
  Phaser.Tweens.TweenManager.prototype.add = function (cfg) {
    try {
      const S = this.scene, t = cfg && cfg.targets;
      const c = Array.isArray(t) ? (t.length === 1 ? t[0] : null) : t;
      if (c instanceof Arc && S && S.startCampaign && cfg.radius !== undefined && typeof cfg.radius === 'number' && cfg.radius > c.radius && !c._ckSinOnda) {
        const col = c.isStroked ? c.strokeColor : c.fillColor;
        const tipo = window.CK_ONDAS.tipoForzado || elemento(col);
        estallido(S, tipo, c.x, c.y, cfg.radius, cfg.duration || 400);
        c.setVisible(false);
      }
    } catch (e) {}
    return add0.apply(this, arguments);
  };

  window.CK_ONDAS = { estallido, elemento, TIPO, PAL, tipoForzado: null };
})();
