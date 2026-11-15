'use strict';
/* La noche se nota en la gente y en las bestias (08/11, pedido del dueño: "cuando sea de noche que los slime brillen y los
   lobos tengan ojos rojos igual que los orcos, que los soldados del rey lleven antorcha de noche").
   Sólo afuera, desde que oscurece hasta que amanece (y en las zonas oscuras de ck_oscuridad.js).
   - LIMOS: brillan con su propio color (una luz chica que late) y se los ve venir en la oscuridad.
   - LOBOS (hombre lobo, huargo) y ORCOS (todos, también Grushak): dos puntitos rojos en los ojos que se ven aunque estén
     en la sombra. El ojo se ubica sobre el dibujo de cada cuadro (la parte de arriba del cuerpo, hacia donde mira).
   - SOLDADOS DEL REY (caballero, templario, lancero, hachero, arquero): llevan una antorcha en la mano, con fuego que
     titila y luz cálida alrededor. El cura y la gente del pueblo no.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const OJOS = /^(werewolf|warg|orc|orc_armored|orc_elite|orc_rider|orc_warlord|orc_corneta)$/;   // (v3) + el del cuerno
  // (13/11, v3) los orcos ya traen los ojos pintados (píxeles rojos en la cara verde): se buscan en cada cuadro y la luz se
  // pone justo ahí. Así no importa el hacha levantada, la lanza o el casco (los ojos de armored y elite caían sobre el arma).
  // El caudillo no: su capa roja toca la piel y confunde la búsqueda; sigue con la cabeza medida como antes.
  const PINTADOS = /^orc(_armored|_elite|_rider|_corneta)?$/;
  const CUATRO_PATAS = /^warg$/;  // la cabeza va adelante, no arriba
  const CABEZA = { orc_rider: [0.46, 0.22] };  // dónde está la cabeza en la caja del dibujo, cuando lo de arriba no la encuentra
  const OJO_ALTO = { orc_corneta: 0.33, orc_warlord: 0.3 };   // (13/11) qué tan abajo de la cabeza van los ojos (cabezas grandes)
  const SOLDADO = /^g_(knight|templar|lancer|axeman|archer)_/;
  const afuera = S => (window.CK_AFUERA ? window.CK_AFUERA(S) : !S.currentInterior || S.currentInterior.area.outdoor);
  const oscuro = S => {
    if (window.CK_OSCURIDAD && S.currentZoneKey && CK_OSCURIDAD.ZONAS[S.currentZoneKey()]) return 1;
    if (!afuera(S) || !S.dayPhase) return 0;
    const p = S.dayPhase();
    return Phaser.Math.Clamp(p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.1 : p < 0.92 ? 1 : (1 - p) / 0.08, 0, 1);
  };

  // ------------------------------------------------------------------ dónde está el cuerpo en cada cuadro
  const cajas = {};
  const caja = (S, sp) => {
    const f = sp.frame, k = sp.texture.key + '|' + f.name;
    if (cajas[k] !== undefined) return cajas[k];
    let r = null;
    try {
      const src = f.source.image, w = f.cutWidth, h = f.cutHeight;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(src, f.cutX, f.cutY, w, h, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1, R = 0, G = 0, B = 0, n = 0;
      const col = new Array(w).fill(0);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (d[o + 3] < 60) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        R += d[o]; G += d[o + 1]; B += d[o + 2]; n++; col[x]++;
      }
      if (x1 >= 0) {
        // el CUERPO: las columnas más llenas (así un hacha levantada o una lanza no cuentan como cabeza)
        const mx = Math.max(...col);
        let c0 = x1, c1 = x0;
        col.forEach((v, x) => { if (v >= mx * 0.55) { if (x < c0) c0 = x; if (x > c1) c1 = x; } });
        let cy = y1;
        for (let y = 0; y < h && cy === y1; y++) for (let x = c0; x <= c1; x++) if (d[(y * w + x) * 4 + 3] >= 60) { cy = y; break; }
        // (13/11) la CABEZA: las columnas llenas de la franja de arriba del cuerpo (el 38 % de arriba), sin el arma ni el escudo
        const ch = y1 - cy + 1, hb = Math.max(2, Math.round(ch * 0.38)), hcol = new Array(w).fill(0);
        for (let y = cy; y < cy + hb; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] >= 60) hcol[x]++;
        const hm = Math.max(...hcol); let h0 = x1, h1 = x0;
        hcol.forEach((v, x) => { if (v >= hm * 0.5) { if (x < h0) h0 = x; if (x > h1) h1 = x; } });
        // (v3) los ojos pintados: píxeles rojos pegados a piel verde, en la fila más alta donde aparecen (y la de abajo)
        const verde = o => d[o + 3] >= 60 && d[o + 1] > d[o] + 15 && d[o + 1] > d[o + 2] + 15;
        const rojo = o => d[o + 3] >= 60 && d[o] > 120 && d[o] > d[o + 1] * 2 && d[o] > d[o + 2] * 1.6;
        const ojos = []; let ey = -1;
        for (let y = y0; y <= y1 && (ey < 0 || y <= ey + 1); y++) for (let x = x0; x <= x1; x++) {
          if (!rojo((y * w + x) * 4)) continue;
          let v = 0;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, 2]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && verde((yy * w + xx) * 4)) v++; }
          if (v) { if (ey < 0) ey = y; ojos.push([x, y]); }
        }
        const ojosOk = ojos.length && ey <= y0 + (y1 - y0) * 0.5 && Math.max(...ojos.map(q => q[0])) - Math.min(...ojos.map(q => q[0])) <= 8;
        // (15/11, v5) los lobos también traen los ojos pintados (rojos sobre el pelaje gris): todos los píxeles rojos del cuadro
        const rojos = [];
        for (let y = y0; y <= y1 && rojos.length < 12; y++) for (let x = x0; x <= x1; x++) if (rojo((y * w + x) * 4)) rojos.push([x, y]);
        // (15/11) dónde hay dibujo, a 2 px (para saber si en este cuadro la cabeza sigue donde estaba)
        const lw = Math.ceil(w / 2), lleno = new Uint8Array(lw * Math.ceil(h / 2));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] >= 60) lleno[(y >> 1) * lw + (x >> 1)] = 1;
        r = { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, fw: w, fh: h, c: [R / n, G / n, B / n],
          cx0: c0, cx1: c1, cw: c1 - c0 + 1, cy0: cy, ch, hx0: h0, hx1: h1, hw: h1 - h0 + 1, ojos: ojosOk ? ojos : null, rojos, lleno, lw };
      }
    } catch (e) { r = null; }
    return (cajas[k] = r);
  };
  // (15/11, pedido del dueño: "en las animaciones de los personajes q tienen ojos rojos cuando atacan se descuadran")
  // Al atacar, el arma levantada, el salto o el giro confundían la búsqueda de la cabeza y los ojos saltaban al hacha o al
  // brazo. Ahora cada bicho tiene sus ojos de referencia, medidos en el primer cuadro de cuando está quieto (todas sus hojas
  // son de 100 px con los pies en el mismo lugar): en cada cuadro se usan los ojos pintados si se encuentran cerca de esa
  // referencia (así siguen al orco cuando salta) y, si no, la referencia; y si en ese cuadro no hay dibujo ahí (el lobo que
  // se lanza y deja la estela), ese cuadro va sin ojos.
  const refs = {};
  const centro = pts => [pts.reduce((t, q) => t + q[0], 0) / pts.length, pts.reduce((t, q) => t + q[1], 0) / pts.length];
  const pintadosDe = b => {
    const xs = b.ojos.map(q => q[0]), izq = b.ojos[xs.indexOf(Math.min(...xs))], der = b.ojos[xs.indexOf(Math.max(...xs))];
    return izq === der ? [izq] : [izq, der];
  };
  const puntoCabeza = (t, b) => {
    const fija = CABEZA[t];
    if (fija) return [b.x0 + b.w * fija[0], b.y0 + b.h * fija[1]];
    if (CUATRO_PATAS.test(t)) return [b.x0 + b.w * 0.86, b.y0 + b.h * 0.36];
    return [b.hx0 + b.hw * 0.72, b.cy0 + b.ch * (OJO_ALTO[t] || 0.27)];
  };
  const refOjos = (S, t) => {
    if (refs[t] !== undefined) return refs[t];
    let r = null;
    try {
      const tx = S.textures.exists(t + '_idle') && S.textures.get(t + '_idle'), f = tx && (tx.get(0) || tx.get());
      const b = f && caja(S, { frame: f, texture: tx });
      if (b) r = b.ojos && PINTADOS.test(t) ? { pts: pintadosDe(b).map(q => [q[0] + 0.5, q[1] + 0.5]), pintados: true } : { pts: [puntoCabeza(t, b)], pintados: false };
      if (r) r.c = centro(r.pts);
    } catch (e) { r = null; }
    return (refs[t] = r);
  };
  // (15/11, v5, pedido del dueño: "los orcos están bien pero los lobos siguen raros, revisalo minuciosamente"): los lobos
  // usaban un punto fijo medido quieto, pero sus ojos pintados se mueven en cada cuadro (al morder se van 2 px adelante y 3
  // abajo; al caminar suben y bajan) y la luz quedaba al lado del ojo de verdad. Ahora se buscan en cada cuadro: el hombre
  // lobo tiene dos píxeles rojos a 3 px en la misma fila; el huargo, uno (o dos pegados). Si en un cuadro no están (de
  // espaldas, golpeado y manchado de rojo), ese cuadro va sin ojos.
  const LOBO = /^(werewolf|warg)$/;
  const ojosLobo = (t, b) => {
    const R = b.rojos || []; if (!R.length || R.length > 4) return null;
    const alto = b.y0 + b.h * 0.65;
    if (t === 'werewolf') {
      for (const p of R) {
        if (p[1] > alto) continue;
        const q = R.find(o => o !== p && o[1] === p[1] && o[0] - p[0] >= 2 && o[0] - p[0] <= 4);
        if (q) return [[p[0] + 0.5, p[1] + 0.5], [q[0] + 0.5, q[1] + 0.5]];
      }
      return null;
    }
    const arriba = R.filter(p => p[1] <= alto); if (!arriba.length || arriba.length > 2) return null;
    if (arriba.length === 2 && (Math.abs(arriba[0][0] - arriba[1][0]) > 1 || Math.abs(arriba[0][1] - arriba[1][1]) > 1)) return null;
    const c = centro(arriba);
    return [[c[0] + 0.5, c[1] + 0.5]];
  };
  const hayDibujo = (b, x, y) => {
    if (!b || !b.lleno) return true;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const cx = (Math.round(x) >> 1) + dx, cy = (Math.round(y) >> 1) + dy;
      if (cx >= 0 && cy >= 0 && cx < b.lw && b.lleno[cy * b.lw + cx]) return true;
    }
    return false;
  };
  /** un punto del cuadro (en píxeles del cuadro, sin espejar) llevado al mundo */
  const alMundo = (sp, fx, fy) => {
    const f = sp.frame, sx = sp.scaleX, sy = sp.scaleY;
    const lx = sp.flipX ? f.cutWidth - fx : fx;
    return { x: sp.x + (lx - sp.originX * f.cutWidth) * sx, y: sp.y + (fy - sp.originY * f.cutHeight) * sy };
  };

  // ------------------------------------------------------------------ la antorcha de los soldados (dibujada por código)
  const texAntorcha = S => {
    if (S.textures.exists('ck_antorcha_mano')) return;
    const W = 7, H = 14, cv = document.createElement('canvas'); cv.width = W * 4; cv.height = H;
    const g = cv.getContext('2d');
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const LLAMA = [
      ['..y....', '..yo...', '.yYo...', '.oYYo..', '.oYYo..', '..oo...'],
      ['...y...', '..oy...', '.oYY...', '.oYYo..', '.oYYo..', '..oo...'],
      ['...o...', '..yo...', '..YYo..', '.oYYo..', '.oYYo..', '..oo...'],
      ['..o....', '..y....', '.oYy...', '.oYYo..', '..YYo..', '..oo...']
    ];
    const COL = { Y: '#fff1a8', y: '#ffd166', o: '#f97316' };
    LLAMA.forEach((fr, i) => {
      const ox = i * W;
      fr.forEach((fila, y) => fila.split('').forEach((ch, x) => { if (COL[ch]) px(ox + x, y, COL[ch]); }));
      // el palo con la estopa
      px(ox + 2, 6, '#5b3a1e'); px(ox + 3, 6, '#7a5230'); px(ox + 4, 6, '#5b3a1e');
      for (let y = 7; y < H; y++) { px(ox + 3, y, y < 9 ? '#6b4423' : '#8a5a33'); }
      px(ox + 2, H - 1, '#3d2614');
    });
    const t = S.textures.addCanvas('ck_antorcha_mano', cv);
    [0, 1, 2, 3].forEach(i => t.add('f' + i, 0, i * W, 0, W, H));
    if (!S.anims.exists('ck_antorcha_mano')) S.anims.create({ key: 'ck_antorcha_mano', frames: [0, 1, 2, 3].map(i => ({ key: 'ck_antorcha_mano', frame: 'f' + i })), frameRate: 9, repeat: -1 });
  };
  const soldados = S => S.children.list.filter(o => o.type === 'Sprite' && o.active && o.visible && SOLDADO.test(o.texture.key));
  const ponerAntorcha = (S, sp) => {
    if (sp._ckAntorcha && sp._ckAntorcha.active) return sp._ckAntorcha;
    texAntorcha(S);
    const t = S.add.sprite(sp.x, sp.y, 'ck_antorcha_mano', 'f0').setOrigin(0.5, 1).setScale(sp.scaleX);
    t.play({ key: 'ck_antorcha_mano', startFrame: Math.floor(Math.random() * 4) });
    sp._ckAntorcha = t;
    sp.once('destroy', () => t.destroy());
    return t;
  };
  const manoDe = sp => {
    const b = sp.frame && sp.scene && caja(sp.scene, sp);
    if (!b) return { x: sp.x, y: sp.y };
    // la mano libre: la de atrás (el arma va adelante), pegada al cuerpo, a media altura
    return alMundo(sp, b.cx0 - 2, b.cy0 + b.ch * 0.66);
  };

  // ------------------------------------------------------------------ luces (motor de ck_luz.js)
  const instalarLuz = () => {
    const L = window.CK_LUZ; if (!L || instalarLuz.ok) return; instalarLuz.ok = true;
    L.fuente((S, out) => {
      const k = S._ckNvK || 0; if (k < 0.05) return;
      (S._ckNvAntorchas || []).forEach(t => { if (t.active && t.visible) out.push({ x: t.x, y: t.y - 10 * t.scaleY, c: [255, 160, 80], r: 86, f: 0.9 * k, titila: 1 }); });
      (S._ckNvLimos || []).forEach(e => {
        if (!e.active || e.isDead) return;
        const b = caja(S, e), c = b ? b.c.map(v => Math.min(255, v * 1.35 + 40)) : [140, 255, 170];
        const late = 0.75 + 0.25 * Math.sin(S.time.now / 380 + e.x * 0.05);
        out.push({ x: e.x, y: e.y + (e.displayHeight || 40) * 0.12, c, r: 46, f: 0.85 * k * late });
      });
    });
  };

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.player) return r;
      instalarLuz();
      const k = oscuro(this);
      this._ckNvK = k;
      // antorchas
      const sold = k > 0.15 ? soldados(this) : [];
      (this._ckNvAntorchas || []).forEach(t => { if (t.active && !sold.some(s => s._ckAntorcha === t)) t.setVisible(false); });
      this._ckNvAntorchas = sold.map(s => {
        const t = ponerAntorcha(this, s), m = manoDe(s);
        t.setVisible(true).setPosition(m.x, m.y + 4 * s.scaleY).setScale(s.scaleX).setDepth(s.depth + 0.5).setAlpha(Math.min(1, k * 1.5));
        return t;
      });
      // limos y ojos
      const limos = [], ojos = [];
      if (k > 0.05 && this.enemies) this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || !e.visible) return;
        if (e.type === 'slime') limos.push(e);
        else if (OJOS.test(e.type)) ojos.push(e);
      });
      this._ckNvLimos = limos;
      let g = this._ckNvOjos;
      if (!g || !g.active) g = this._ckNvOjos = this.add.graphics().setDepth(27600);
      g.clear();
      ojos.forEach(e => {
        const b = caja(this, e); if (!b) return;
        const ref = refOjos(this, e.type);
        const a = k * (Math.floor(this.time.now / 1900 + e.x * 0.01) % 9 === 0 ? 0.15 : 1) * Math.max(0.35, e.alpha);
        // los pintados de este cuadro, si están cerca de la referencia; si no, los de la referencia
        let pts = null;
        if (LOBO.test(e.type)) {
          pts = ojosLobo(e.type, b);
          if (!pts) return;                                    // en este cuadro no se le ven los ojos
        } else if (b.ojos && PINTADOS.test(e.type)) {
          const p = pintadosDe(b).map(q => [q[0] + 0.5, q[1] + 0.5]), c = centro(p);
          if (!ref || Math.hypot(c[0] - ref.c[0], c[1] - ref.c[1]) < 12) pts = p;
        }
        if (!pts && ref) { if (!hayDibujo(b, ref.c[0], ref.c[1])) return; if (ref.pintados) pts = ref.pts; }
        if (pts) {
          const s = Math.max(1, Math.abs(e.scaleX)), w0 = pts.map(q => alMundo(e, q[0], q[1]));
          const cxm = w0.reduce((t, q) => t + q.x, 0) / w0.length, cym = w0.reduce((t, q) => t + q.y, 0) / w0.length;
          g.fillStyle(0xff2a1a, a * 0.22); g.fillCircle(cxm, cym, 1.9 * Math.max(1, Math.round(s)));
          g.fillStyle(0xff3b2f, a); w0.forEach(q => g.fillRect(q.x - s / 2, q.y - s / 2, s, s));
          return;
        }
        // los que no traen los ojos pintados (lobos, huargo, caudillo): la cabeza medida quieto
        const q = ref ? ref.pts[0] : puntoCabeza(e.type, b), o = alMundo(e, q[0], q[1]);
        const s = Math.max(1, Math.round(e.scaleX)), dx = e.flipX ? -1 : 1;
        g.fillStyle(0xff2a1a, a * 0.22); g.fillCircle(o.x, o.y, 1.9 * s);
        g.fillStyle(0xff3b2f, a); g.fillRect(o.x - 1.5 * s * dx - s / 2, o.y - s / 2, s, s); g.fillRect(o.x + 1.2 * s * dx - s / 2, o.y - s / 2, s, s);
      });
    } catch (e) { if (!P._ckNvAv) { P._ckNvAv = 1; console.warn('[noche_viva]', e); } }
    return r;
  };
  window.CK_NOCHE_VIVA = { caja, alMundo, oscuro, refOjos, ojosLobo };
})();
