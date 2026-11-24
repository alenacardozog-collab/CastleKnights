'use strict';
/* La pelea con Azrath, en el reino de los demonios (23/11, nota 1 del dueño en la Mazmorra del Sello: "en esta instancia
   aparecemos en un mapa demonio con sólo fuego y lava alrededor, y peleamos contra el rey demonio luego de derrotar a
   Malakar").
   - Al caer Malakar, cuando Azrath empieza a salir (ck_mazmorra_final.js), la pantalla se pone blanca y el héroe aparece en
     EL ABISMO: una isla de roca negra con grietas encendidas en medio de un mar de lava que hierve, llamas alrededor,
     brasas que suben y todo teñido de rojo. No se puede salir de la isla. Azrath sube de la lava.
   - Al vencerlo, otro destello y se vuelve a la sala del Sello (el domo de Elia se rompe como antes).
   Todo por código (la lava se pinta en un lienzo chico y se agranda de a píxeles enteros), con las llamas de
   ck_fuegos_vivos.js. Va después de ck_mazmorra_final.js. Borrar su línea de index.html: Azrath se pelea en la sala. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_MAZMORRA) return;
  const P = MainGameScene.prototype, MZ = window.CK_MAZMORRA, Z = MZ.Z;
  const R = (a, b) => a + Math.random() * (b - a);
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const aqui = S => !!(S && zona(S) === Z && S.currentInterior && S.currentInterior.area);
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const ISLA = { x: 720, y: 222, rx: 200, ry: 86 };          // la isla, en píxeles del mapa (sobre la arena del Sello)
  const PX = 3, CW = 460, CH = 270;                           // el lienzo: 460×270 agrandado ×3 (1380×810 del mapa)
  const LLAMA = () => (window.CK_FUEGOS_VIVOS && window.CK_FUEGOS_VIVOS.LLAMA) || 'ckfv_llama_fuego';

  // ------------------------------------------------------------------ el mar de lava (dos cuadros que se alternan)
  const pintar = (S, k, semilla) => {
    if (S.textures.exists(k)) return;
    const t = S.textures.createCanvas(k, CW, CH), g = t.getContext();
    let sd = semilla; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const PAL = ['#2a0503', '#4a0a05', '#7a1606', '#b02a0a', '#e2520f', '#ff8a24', '#ffc457', '#fff0a8'];
    // campo de "calor" con manchas
    const C = new Float32Array(CW * CH);
    for (let i = 0; i < 70; i++) {
      const cx = rnd() * CW, cy = rnd() * CH, r = 8 + rnd() * 34, f = 0.35 + rnd() * 0.65;
      for (let y = Math.max(0, cy - r | 0); y < Math.min(CH, cy + r); y++) for (let x = Math.max(0, cx - r | 0); x < Math.min(CW, cx + r); x++) {
        const d = Math.hypot(x - cx, (y - cy) * 1.4) / r; if (d < 1) C[y * CW + x] += f * (1 - d * d);
      }
    }
    const img = g.createImageData(CW, CH), D = img.data;
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const COL = PAL.map(hex);
    const ox = CW / 2, oy = CH / 2, rx = ISLA.rx / PX, ry = ISLA.ry / PX;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = (y * CW + x) * 4, d = Math.hypot((x - ox) / rx, (y - oy) / ry);
      if (d < 1) { D[i + 3] = 0; continue; }                 // la isla: se ve el piso de abajo (oscurecido aparte)
      let v = Math.min(1, C[y * CW + x] * 0.8 + ((x * 7 + y * 13) % 5 === 0 ? 0.08 : 0));
      if (d < 1.12) { const c = hex('#1a1210'); D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; if (rnd() < 0.08) { D[i] = 255; D[i + 1] = 110; D[i + 2] = 30; } continue; }   // el borde de roca
      if (d < 1.2) v = Math.max(v, 0.85);                     // donde la lava toca la roca, brilla
      const c = COL[Math.min(COL.length - 1, Math.floor(v * (COL.length - 1) + 0.5))];
      D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // costras oscuras flotando
    g.fillStyle = 'rgba(30,8,4,0.85)';
    for (let i = 0; i < 90; i++) { const x = rnd() * CW, y = rnd() * CH; if (Math.hypot((x - ox) / rx, (y - oy) / ry) < 1.3) continue; g.fillRect(x | 0, y | 0, 2 + (rnd() * 4 | 0), 1 + (rnd() * 2 | 0)); }
    t.refresh();
    t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  };
  // la isla: grietas encendidas sobre el piso (oscurecido)
  const pintarIsla = S => {
    const k = 'ckml_isla'; if (S.textures.exists(k)) return k;
    const w = Math.ceil(ISLA.rx * 2 / PX), h = Math.ceil(ISLA.ry * 2 / PX), t = S.textures.createCanvas(k, w, h), g = t.getContext();
    g.fillStyle = 'rgba(12,6,6,0.72)';
    g.beginPath(); g.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ff6a1e'; g.lineWidth = 1;
    for (let i = 0; i < 11; i++) {
      let x = w / 2 + R(-w * 0.4, w * 0.4), y = h / 2 + R(-h * 0.35, h * 0.35);
      g.beginPath(); g.moveTo(x | 0, y | 0);
      for (let s = 0; s < 6; s++) { x += R(-6, 6); y += R(-3, 3); g.lineTo(x | 0, y | 0); }
      g.stroke();
    }
    t.refresh(); t.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return k;
  };

  // ------------------------------------------------------------------ entrar y salir del abismo
  const entrar = S => {
    if (S._ckml) return;
    const a = S.currentInterior.area, cx = a.x + ISLA.x, cy = a.y + ISLA.y;
    pintar(S, 'ckml_lava0', 1234567); pintar(S, 'ckml_lava1', 7654321);
    const L = S._ckml = { objs: [], llamas: [], muros: [], t: 0, brasaT: 0 };
    const lava = S.add.image(cx, cy, 'ckml_lava0').setScale(PX).setDepth(19990);
    const lava2 = S.add.image(cx, cy, 'ckml_lava1').setScale(PX).setDepth(19991).setAlpha(0);
    const isla = S.add.image(cx, cy, pintarIsla(S)).setScale(PX).setDepth(a.y + ISLA.y - ISLA.ry - 2);
    L.objs.push(lava, lava2, isla); L.lava2 = lava2;
    S.tweens.add({ targets: lava2, alpha: 1, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // llamas alrededor de la isla
    const prender = () => {
      if (S._ckml !== L || !S.textures.exists(LLAMA())) return;
      for (let i = 0; i < 18; i++) {
        const an = (i / 18) * Math.PI * 2 + R(-0.1, 0.1), d = R(1.18, 1.5);
        const x = cx + Math.cos(an) * ISLA.rx * d, y = cy + Math.sin(an) * ISLA.ry * d;
        const s = S.add.sprite(x, y, LLAMA()).setOrigin(0.5, 1).setScale(R(0.9, 1.6)).setDepth(19995 + (y - cy) / 1000);
        s.play({ key: LLAMA(), startFrame: i % 8 }); s.anims.timeScale = R(0.8, 1.2);
        L.objs.push(s); L.llamas.push(s);
      }
    };
    if (S.textures.exists(LLAMA())) prender(); else if (window.CK_FUEGOS_VIVOS && window.CK_FUEGOS_VIVOS.cargar) window.CK_FUEGOS_VIVOS.cargar(S).then(prender);
    // no se sale de la isla: un anillo de choques por fuera del borde
    for (let i = 0; i < 40; i++) {
      const an = (i / 40) * Math.PI * 2, x = cx + Math.cos(an) * (ISLA.rx + 10), y = cy + Math.sin(an) * (ISLA.ry + 8);
      const z = S.add.zone(x, y, 34, 22); S.physics.add.existing(z, true); S.interiorObstacles.add(z); z._ckml = true; L.muros.push(z);
    }
    S._navGrids = {};
    // el héroe, en la isla
    const p = S.player.body;
    if (p) { const fx = S.player.x - p.center.x, fy = S.player.y - p.bottom; p.reset(cx + fx, cy + 50 + fy); }
    S._c3CapaFija = 0.75;
    if (typeof ambience !== 'undefined') try { ambience.set([['amb_infierno', 0.35], ['amb_fire', 0.4]]); } catch (e) {}
    S.showZoneTitle('El Abismo', 'El reino de los demonios');
  };
  const salir = S => {
    const L = S._ckml; if (!L) return;
    L.objs.forEach(o => { try { S.tweens.killTweensOf(o); o.destroy(); } catch (e) {} });
    L.muros.forEach(z => { try { S.interiorObstacles.remove(z); z.destroy(); } catch (e) {} });
    S._ckml = null; S._c3CapaFija = undefined; S._navGrids = {};
  };
  const destello = (S, fn) => {
    S.cameras.main.flash(500, 255, 230, 200);
    son('ck_portal_abre', 0.9, { rate: 0.6 }) || son('thunder_epic', 0.6);
    S.time.delayedCall(120, fn);
  };

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      if (!aqui(S) || !S._mz) { if (S._ckml) salir(S); return r; }
      const F = MZ.fl(S), U = S._mz._fin;
      // Malakar cayó y Azrath empieza a salir: al abismo
      if (F.brujo && !F.demonio && !S._ckml && !S._ckmlVa && U && (U.escena === 'demonio' || (S.enemies && S.enemies.getChildren().some(e => e.active && !e.isDead && e.type === 'demonio_sello'))))
        { S._ckmlVa = true; destello(S, () => { S._ckmlVa = false; if (aqui(S)) entrar(S); }); }
      // vencido: de vuelta a la sala
      if (S._ckml && F.demonio && !S._ckml.sale) { S._ckml.sale = true; S.time.delayedCall(1200, () => destello(S, () => salir(S))); }
      const L = S._ckml; if (!L) return r;
      S._c3CapaFija = 0.75;
      // brasas que suben de la lava
      L.brasaT -= Math.min(100, delta || 16);
      if (L.brasaT <= 0) {
        L.brasaT = R(60, 140);
        const v = S.cameras.main.worldView, x = v.x + R(0, v.width), y = v.y + v.height + 4;
        const b = S.add.rectangle(x, y, R(1, 3), R(2, 4), Math.random() < 0.5 ? 0xff8a24 : 0xffc457, 1).setDepth(20010).setBlendMode(Phaser.BlendModes.ADD);
        S.tweens.add({ targets: b, y: y - R(160, 320), x: x + R(-30, 30), alpha: 0, duration: R(1800, 3200), onComplete: () => b.destroy() });
      }
    } catch (e) { if (!P._ckmlErr) { P._ckmlErr = 1; console.warn('[abismo]', e); } }
    return r;
  };
  ['onAreaShown'].forEach(n => { const f0 = P[n]; if (f0) P[n] = function () { try { if (this._ckml) salir(this); } catch (e) {} return f0.apply(this, arguments); }; });
  // la luz de la lava
  if (window.CK_LUZ && window.CK_LUZ.fuente) window.CK_LUZ.fuente((S, out) => {
    const L = S._ckml; if (!L) return;
    const t = S.time ? S.time.now : 0;
    L.llamas.forEach((s, i) => { if (s.active) out.push({ x: s.x, y: s.y - 14, c: [255, 110, 40], r: 70, f: 0.85 + 0.15 * Math.sin(t / 140 + i) }); });
  });
  window.CK_ABISMO = { entrar, salir, ISLA };
})();
