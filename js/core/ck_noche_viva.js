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
  const OJOS = /^(werewolf|warg|orc|orc_armored|orc_elite|orc_rider|orc_warlord)$/;
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
        r = { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, fw: w, fh: h, c: [R / n, G / n, B / n],
          cx0: c0, cx1: c1, cw: c1 - c0 + 1, cy0: cy, ch, hx0: h0, hx1: h1, hw: h1 - h0 + 1 };
      }
    } catch (e) { r = null; }
    return (cajas[k] = r);
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
        const patas = CUATRO_PATAS.test(e.type);
        // la cabeza: arriba del cuerpo, corrida hacia donde mira (los de cuatro patas, adelante)
        const fija = CABEZA[e.type];
        // (13/11) los ojos van a la altura de los ojos (un cuarto de la cabeza para abajo, en el frente de la cabeza), no en
        // la punta del casco: medido sobre los dibujos (orcos de 17 a 35 px de alto, el orco del cuerno con cabezota)
        const fo = OJO_ALTO[e.type] || 0.27;
        const o = fija ? alMundo(e, b.x0 + b.w * fija[0], b.y0 + b.h * fija[1]) : patas ? alMundo(e, b.x0 + b.w * 0.86, b.y0 + b.h * 0.36) : alMundo(e, b.hx0 + b.hw * 0.72, b.cy0 + b.ch * fo);
        const a = k * (Math.floor(this.time.now / 1900 + e.x * 0.01) % 9 === 0 ? 0.15 : 1) * Math.max(0.35, e.alpha);
        const s = Math.max(1, Math.round(e.scaleX)), dx = e.flipX ? -1 : 1;
        g.fillStyle(0xff2a1a, a * 0.22); g.fillCircle(o.x, o.y, 1.9 * s);
        g.fillStyle(0xff3b2f, a); g.fillRect(o.x - 1.5 * s * dx - s / 2, o.y - s / 2, s, s); g.fillRect(o.x + 1.2 * s * dx - s / 2, o.y - s / 2, s, s);
      });
    } catch (e) { if (!P._ckNvAv) { P._ckNvAv = 1; console.warn('[noche_viva]', e); } }
    return r;
  };
  window.CK_NOCHE_VIVA = { caja, alMundo, oscuro };
})();
