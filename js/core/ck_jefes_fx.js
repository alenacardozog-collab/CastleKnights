'use strict';
/* Efectos de las habilidades de los jefes (10/11, pendiente de "habilidades de jefes con partículas de código y
   proyectiles orientados"). Todo dibujado por código, a píxel, sin imágenes nuevas. Lo usan ck_coliseo.js (Gorvak,
   Kragmor, Ulrak y Colmillo) y ck_jefes_fases.js (Grushak y Garra Negra) cuando está; si se borra la línea de
   index.html los ataques siguen iguales, con los dibujos de antes.
   - carga(S, e, color): antes del ataque, chispas del color del aviso que se juntan hacia el jefe.
   - flecha(S, x, y, ang): flecha a píxel (punta, vara, plumas) que apunta hacia donde vuela, con estela.
   - roca(S, x, y): piedra a píxel; sombraCaida(S, x, y, r, ms): la sombra en el piso que crece hasta que cae.
   - escombros(S, x, y, r, n): piedritas y terrones que saltan y caen rebotando; grieta(S, x, y, r): grietas en el piso
     que se borran de a poco.
   - rastro(S, e, ms): polvo y líneas de velocidad detrás de un jefe que embiste.
   - estela(S, obj): copias que se apagan detrás de algo que gira (la cuchilla).
   - chispas(S, x, y, n, color): chispas de metal (el escudo que bloquea).
   - ondaVoz(S, x, y): arcos de sonido que salen de la boca (el aullido, el rugido). */
(function () {
  const R = (a, b) => a + Math.random() * (b - a);
  const TOP = 26000;
  const tex = (S, k, w, h, pinta) => {
    if (S.textures.exists(k)) return k;
    const t = S.textures.createCanvas(k, w, h), g = t.getContext();
    g.imageSmoothingEnabled = false; pinta((c, x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww || 1, hh || 1); });
    t.refresh(); return k;
  };
  const texFlecha = S => tex(S, 'ckj_flecha', 22, 7, p => {
    // apunta a la derecha: plumas (izq), vara, punta (der)
    p('#1b0f0a', 0, 1, 5, 5); p('#e9e2d0', 1, 2, 3, 1); p('#b83a2a', 1, 4, 3, 1); p('#e9e2d0', 0, 3, 4, 1);
    p('#3a2414', 4, 3, 13, 1); p('#8b5e34', 4, 2, 12, 1);
    p('#1b0f0a', 16, 1, 5, 5); p('#9aa0a8', 17, 2, 3, 3); p('#d8dde2', 18, 3, 3, 1); p('#1b0f0a', 21, 3, 1, 1);
  });
  const texRoca = (S, n) => tex(S, 'ckj_roca' + n, 14, 12, p => {
    const f = n % 2;
    p('#1b0f0a', 2, 1 + f, 10, 10 - f); p('#1b0f0a', 1, 3, 12, 6);
    p('#6b5a4a', 3, 2 + f, 8, 8 - f); p('#6b5a4a', 2, 4, 10, 4);
    p('#8a7663', 4, 3 + f, 4, 2); p('#4a3c30', 7, 7, 4, 2); p('#a8927a', 4, 3 + f, 1, 1);
  });
  const texChispa = S => tex(S, 'ckj_chispa', 3, 3, p => { p('#fff6c8', 1, 0, 1, 3); p('#fff6c8', 0, 1, 3, 1); p('#ffffff', 1, 1, 1, 1); });
  const texPunto = S => tex(S, 'ckj_punto', 2, 2, p => p('#ffffff', 0, 0, 2, 2));

  // ------------------------------------------------------------------ antes del golpe: energía que se junta
  const carga = (S, e, col, ms) => {
    const k = texPunto(S), n = 14, dur = ms || 500;
    for (let i = 0; i < n; i++) {
      const a = R(0, Math.PI * 2), d = R(40, 70), q = S.add.image(e.x + Math.cos(a) * d, e.y - 10 + Math.sin(a) * d * 0.7, k).setTint(col).setDepth(TOP).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      S.tweens.add({ targets: q, alpha: 1, duration: 80, delay: i * (dur / n) * 0.6 });
      S.tweens.add({ targets: q, x: () => e.x, y: () => e.y - 10, scale: 0.4, duration: dur * 0.55, delay: i * (dur / n) * 0.6, ease: 'Quad.easeIn', onComplete: () => q.destroy() });
    }
  };
  // ------------------------------------------------------------------ proyectiles
  const flecha = (S, x, y, ang) => {
    const f = S.add.image(x, y, texFlecha(S)).setRotation(ang).setDepth(TOP);
    f._ckRastro = S.time.addEvent({ delay: 40, loop: true, callback: () => {
      if (!f.active) return;
      const t = S.add.image(f.x - Math.cos(ang) * 9, f.y - Math.sin(ang) * 9, texPunto(S)).setTint(0xe8d8b0).setAlpha(0.6).setDepth(TOP - 1);
      S.tweens.add({ targets: t, alpha: 0, scale: 0.3, duration: 220, onComplete: () => t.destroy() });
    } });
    f.once('destroy', () => f._ckRastro && f._ckRastro.remove());
    return f;
  };
  const roca = (S, x, y) => S.add.image(x, y, texRoca(S, Math.floor(R(0, 3)))).setDepth(TOP).setScale(1.4);
  const sombraCaida = (S, x, y, r, ms) => {
    const s = S.add.ellipse(x, y, r * 0.3, r * 0.18, 0x000000, 0.15).setDepth(9);
    S.tweens.add({ targets: s, width: r * 1.3, height: r * 0.7, alpha: 0.42, duration: ms, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
    return s;
  };
  // ------------------------------------------------------------------ golpes contra el piso
  const escombros = (S, x, y, r, n) => {
    for (let i = 0; i < (n || 10); i++) {
      const a = R(0, Math.PI * 2), d = R(r * 0.3, r * 1.1), big = Math.random() < 0.35;
      const q = big ? S.add.image(x, y, texRoca(S, Math.floor(R(0, 3)))).setScale(R(0.4, 0.7)) : S.add.rectangle(x, y, Math.round(R(2, 4)), Math.round(R(2, 3)), Math.random() < 0.5 ? 0x6b5a4a : 0x8a7663);
      q.setDepth(y + 2);
      const tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d * 0.55, alto = R(14, 40), dur = R(380, 620);
      const k = { t: 0 };
      S.tweens.add({ targets: k, t: 1, duration: dur, ease: 'Linear', onUpdate: () => {
        const tt = k.t, rebote = tt < 0.75 ? Math.sin(tt / 0.75 * Math.PI) * alto : Math.sin((tt - 0.75) / 0.25 * Math.PI) * alto * 0.2;
        q.setPosition(x + (tx - x) * tt, y + (ty - y) * tt - rebote); q.angle += 9;
      }, onComplete: () => S.tweens.add({ targets: q, alpha: 0, delay: R(600, 1400), duration: 500, onComplete: () => q.destroy() }) });
    }
  };
  const grieta = (S, x, y, r) => {
    const g = S.add.graphics().setDepth(8);
    const ramas = 6 + Math.floor(r / 20);
    for (let i = 0; i < ramas; i++) {
      let a = (i / ramas) * Math.PI * 2 + R(-0.3, 0.3), px = x, py = y;
      const largo = R(r * 0.45, r * 1.05), pasos = 5;
      g.lineStyle(2, 0x1b0f0a, 0.75).beginPath().moveTo(px, py);
      for (let k = 0; k < pasos; k++) { a += R(-0.5, 0.5); px += Math.cos(a) * largo / pasos; py += Math.sin(a) * largo / pasos * 0.55; g.lineTo(Math.round(px), Math.round(py)); }
      g.strokePath();
      g.lineStyle(1, 0xc8b49a, 0.35).beginPath().moveTo(x + 1, y + 1).lineTo(Math.round(px) + 1, Math.round(py) + 1).strokePath();
    }
    g.fillStyle(0x1b0f0a, 0.35).fillEllipse(x, y, r * 0.5, r * 0.28);
    S.tweens.add({ targets: g, alpha: 0, delay: 2600, duration: 1600, onComplete: () => g.destroy() });
  };
  // ------------------------------------------------------------------ embestidas y giros
  const rastro = (S, e, ms) => {
    const fin = S.time.now + ms;
    const ev = S.time.addEvent({ delay: 55, loop: true, callback: () => {
      if (!e.active || e.isDead || S.time.now > fin || !e.body) { ev.remove(); return; }
      const v = e.body.velocity, sp = Math.hypot(v.x, v.y); if (sp < 60) return;
      const ux = -v.x / sp, uy = -v.y / sp, bx = e.body.center.x, by = e.body.bottom - 2;
      const c = S.add.circle(bx + ux * 10 + R(-6, 6), by + R(-3, 3), R(4, 8), 0xb8a58a, 0.5).setDepth(by - 1);
      S.tweens.add({ targets: c, x: c.x + ux * R(10, 24), y: c.y - R(4, 12), scale: 2, alpha: 0, duration: R(380, 600), onComplete: () => c.destroy() });
      if (Math.random() < 0.7) {
        const l = S.add.rectangle(bx + ux * 26 + R(-4, 4), by - R(8, 40), R(12, 22), 1, 0xffffff, 0.55).setRotation(Math.atan2(v.y, v.x)).setDepth(TOP - 2);
        S.tweens.add({ targets: l, x: l.x + ux * 22, y: l.y + uy * 22, alpha: 0, duration: 200, onComplete: () => l.destroy() });
      }
    } });
    return ev;
  };
  const estela = (S, obj, ms) => {
    const ev = S.time.addEvent({ delay: 45, loop: true, callback: () => {
      if (!obj.active) { ev.remove(); return; }
      const c = S.add.image(obj.x, obj.y, obj.texture.key).setScale(obj.scaleX).setRotation(obj.rotation).setAlpha(0.45).setTint(0xffe8a0).setDepth(obj.depth - 1);
      S.tweens.add({ targets: c, alpha: 0, duration: ms || 180, onComplete: () => c.destroy() });
    } });
    return ev;
  };
  const chispas = (S, x, y, n, col) => {
    const k = texChispa(S);
    for (let i = 0; i < (n || 8); i++) {
      const a = R(-Math.PI, 0), v = R(40, 110), q = S.add.image(x, y, k).setTint(col || 0xfff2b0).setDepth(TOP).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: q, x: x + Math.cos(a) * v, y: y + Math.sin(a) * v * 0.7 + 14, alpha: 0, scale: 0.4, duration: R(220, 420), ease: 'Quad.easeOut', onComplete: () => q.destroy() });
    }
  };
  const ondaVoz = (S, x, y, izq) => {
    for (let i = 0; i < 4; i++) {
      const g = S.add.graphics().setDepth(TOP).setPosition(x, y), k = { r: 8 };
      S.tweens.add({ targets: k, r: 70, duration: 520, delay: i * 120, ease: 'Quad.easeOut',
        onUpdate: () => { g.clear(); const a = izq ? Math.PI : 0; g.lineStyle(2, 0xe5e7eb, 1 - k.r / 80).beginPath().arc(0, 0, k.r, a - 0.6, a + 0.6).strokePath(); },
        onComplete: () => g.destroy() });
    }
  };
  // ------------------------------------------------------------------ (11/11) aviso en el piso, onda expansiva, anticipación y tajo
  // "las ondas expansivas rojas, mejoralas, hacelas más profesionales, que no sean un círculo y ya"
  const SQ = 0.62;
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  // aro de aviso a píxel: borde doble con muescas, marcas cada 30°, flechitas hacia adentro (una textura por color)
  const texAro = (S, col) => tex(S, 'ckj_aro_' + col.toString(16), 128, 128, p => {
    const c = hex(col), cx = 64, cy = 64;
    for (let a = 0; a < 360; a += 1.2) {
      const t = a * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
      const muesca = Math.floor(a / 15) % 2 === 0;
      for (let rr = 59; rr <= 62; rr++) if (muesca || rr >= 61) p(c, Math.round(cx + cs * rr), Math.round(cy + sn * rr));
      if (Math.floor(a / 7.5) % 2 === 0) p(c, Math.round(cx + cs * 55), Math.round(cy + sn * 55));
    }
    for (let a = 0; a < 360; a += 30) {
      const t = a * Math.PI / 180;
      for (let rr = 46; rr <= 52; rr++) { p(c, Math.round(cx + Math.cos(t) * rr), Math.round(cy + Math.sin(t) * rr)); p('#ffffff', Math.round(cx + Math.cos(t) * rr), Math.round(cy + Math.sin(t) * rr) + 0); }
      // flechita hacia adentro
      const bx = cx + Math.cos(t + 0.26) * 40, by = cy + Math.sin(t + 0.26) * 40;
      for (let k = 0; k < 4; k++) { p(c, Math.round(bx - Math.cos(t + 0.26) * k + Math.cos(t + 1.83) * k), Math.round(by - Math.sin(t + 0.26) * k + Math.sin(t + 1.83) * k)); p(c, Math.round(bx - Math.cos(t + 0.26) * k - Math.cos(t + 1.83) * k), Math.round(by - Math.sin(t + 0.26) * k - Math.sin(t + 1.83) * k)); }
    }
  });
  const texDisco = (S, col) => tex(S, 'ckj_disco_' + col.toString(16), 64, 64, p => {
    // disco con borde más fuerte y textura de rayas finas (no un relleno plano)
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x - 31.5, y - 31.5); if (d > 31) continue;
      if (d > 28 || (x + y) % 6 === 0) p(hex(col), x, y);
    }
  });
  /** Aviso en el piso (reemplaza al círculo rojo): aro que gira, relleno que crece hasta el borde (= cuánto falta),
   *  flechitas que se cierran y un destello al final. */
  const zona = (S, x, y, r, col, ms) => {
    const cont = S.add.container(x, y).setDepth(9).setScale(1, SQ);
    const base = S.add.circle(0, 0, r, col, 0.08);
    const disco = S.add.image(0, 0, texDisco(S, col)).setScale(0.02).setAlpha(0.5);
    const aro = S.add.image(0, 0, texAro(S, col)).setScale(r / 62);
    const aro2 = S.add.image(0, 0, texAro(S, col)).setScale(r / 62 * 1.25).setAlpha(0);
    cont.add([base, disco, aro, aro2]);
    S.tweens.add({ targets: aro, angle: 90, duration: ms + 200 });
    S.tweens.add({ targets: disco, scale: r / 31, duration: ms, ease: 'Sine.easeIn' });
    S.tweens.add({ targets: disco, alpha: { from: 0.25, to: 0.55 }, duration: ms });
    // un aro de afuera que se cierra hacia el borde, una vez por medio segundo
    S.tweens.add({ targets: aro2, scale: r / 62, alpha: { from: 0, to: 0.8 }, duration: 480, repeat: Math.max(0, Math.floor(ms / 480) - 1), ease: 'Quad.easeIn' });
    S.time.delayedCall(ms, () => {
      aro2.destroy();
      const fl = S.add.circle(0, 0, r, 0xffffff, 0.55).setBlendMode(Phaser.BlendModes.ADD); cont.add(fl);
      S.tweens.add({ targets: cont, alpha: 0, duration: 260, onComplete: () => cont.destroy() });
    });
    return cont;
  };
  /** Franja de aviso (embestidas): rectángulo con flechas que avanzan hacia donde va el golpe. */
  const franjaViva = (S, x0, y0, x1, y1, ancho, col, ms) => {
    const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    const cont = S.add.container(x0, y0).setDepth(9).setRotation(a);
    const fondo = S.add.rectangle(L / 2, 0, L, ancho, col, 0.12);
    const lleno = S.add.rectangle(0, 0, L, ancho, col, 0.3).setOrigin(0, 0.5).setScale(0, 1);
    const bordes = S.add.graphics();
    bordes.fillStyle(col, 0.95);
    for (let k = 0; k < L; k += 8) { bordes.fillRect(k, -ancho / 2, 5, 2); bordes.fillRect(k, ancho / 2 - 2, 5, 2); }
    cont.add([fondo, lleno, bordes]);
    const fl = [];
    for (let k = 0; k < Math.floor(L / 34); k++) {
      const g = S.add.graphics(); g.lineStyle(2, 0xffffff, 0.9).beginPath().moveTo(-5, -6).lineTo(2, 0).lineTo(-5, 6).strokePath();
      g.x = 14 + k * 34; g.alpha = 0; cont.add(g); fl.push(g);
      S.tweens.add({ targets: g, alpha: { from: 0, to: 0.9 }, x: g.x + 12, duration: 420, delay: k * 60, repeat: -1, yoyo: false });
    }
    S.tweens.add({ targets: lleno, scaleX: 1, duration: ms, ease: 'Sine.easeIn' });
    S.time.delayedCall(ms, () => S.tweens.add({ targets: cont, alpha: 0, duration: 200, onComplete: () => cont.destroy() }));
    return cont;
  };
  /** Onda expansiva viva: borde quebrado (no un círculo perfecto), un frente claro, una estela roja que se desvanece,
   *  polvo y piedritas que salen del borde. Devuelve { poner(r, a), fin() } para seguir el radio del que la usa. */
  const ondaViva = (S, x, y, col) => {
    const g = S.add.graphics().setDepth(9.5).setPosition(x, y);
    const N = 48, ruido = Array.from({ length: N }, () => R(-0.06, 0.06));
    const poligono = (rr, desv) => { const pts = []; for (let i = 0; i <= N; i++) { const t = i / N * Math.PI * 2, k = 1 + ruido[i % N] * desv; pts.push(Math.cos(t) * rr * k, Math.sin(t) * rr * k * SQ); } return pts; };
    const trazo = (pts, ancho, c, al) => { g.lineStyle(ancho, c, al).beginPath().moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.strokePath(); };
    let ult = 0;
    return {
      poner(rr, al) {
        g.clear();
        const a = Math.max(0, Math.min(1, al));
        [[rr * 0.72, 10, 0.12], [rr * 0.84, 7, 0.22], [rr * 0.93, 5, 0.4]].forEach(([q, w, k]) => trazo(poligono(q, 1.4), w, col, k * a));
        trazo(poligono(rr, 1), 4, col, 0.9 * a);
        trazo(poligono(rr + 2, 0.6), 2, 0xfff1e0, 0.85 * a);
        if (rr - ult > 14) {
          ult = rr;
          for (let i = 0; i < 5; i++) {
            const t = R(0, Math.PI * 2), px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr * SQ;
            const c = S.add.circle(px, py, R(3, 6), 0xb8a58a, 0.5).setDepth(py);
            S.tweens.add({ targets: c, y: py - R(6, 16), scale: 1.8, alpha: 0, duration: R(400, 650), onComplete: () => c.destroy() });
            if (Math.random() < 0.5) { const q = S.add.rectangle(px, py, 2, 2, 0x6b5a4a).setDepth(py + 1); S.tweens.add({ targets: q, x: px + Math.cos(t) * R(8, 18), y: py - R(4, 12), alpha: 0, duration: 420, onComplete: () => q.destroy() }); }
          }
        }
      },
      fin() { g.destroy(); }
    };
  };
  /** Onda completa que se maneja sola (para quien no lleva su propio radio). */
  const onda = (S, x, y, rmax, col, ms) => {
    const o = ondaViva(S, x, y, col), k = { r: 6 };
    S.tweens.add({ targets: k, r: rmax, duration: ms || 700, ease: 'Sine.easeOut', onUpdate: () => o.poner(k.r, 1 - k.r / (rmax * 1.15)), onComplete: () => o.fin() });
  };
  /** Anticipación: se agacha y se echa para atrás (aplastado), tiembla, y al soltar se estira hacia adelante. */
  const anticipar = (S, e, ms) => {
    if (!e || !e.active || e._ckAnt) return;
    const sx = e.scaleX, sy = e.scaleY; e._ckAnt = { sx, sy };
    const atras = e.flipX ? 3 : -3;
    S.tweens.add({ targets: e, scaleY: sy * 0.86, scaleX: sx * 1.1, angle: atras, duration: Math.max(80, ms * 0.7), ease: 'Quad.easeOut' });
    const t = S.time.addEvent({ delay: 50, repeat: Math.floor(ms * 0.7 / 50), callback: () => { if (e.active) e.setAngle(atras + R(-1.2, 1.2)); } });
    const b = e.body, px = b ? b.center.x : e.x, py = b ? b.bottom : e.y;
    for (let i = 0; i < 4; i++) { const c = S.add.circle(px + R(-12, 12), py, R(3, 5), 0xb8a58a, 0.45).setDepth(py); S.tweens.add({ targets: c, x: c.x + (c.x < px ? -10 : 10), y: py - 4, alpha: 0, duration: 500, onComplete: () => c.destroy() }); }
    S.time.delayedCall(ms, () => { t.remove(); soltar(S, e); });
  };
  const soltar = (S, e) => {
    const q = e && e._ckAnt; if (!q || !e.active) { if (e) e._ckAnt = null; return; }
    e._ckAnt = null;
    S.tweens.killTweensOf(e);
    e.setAngle(e.flipX ? -5 : 5);
    e.setScale(q.sx * 0.9, q.sy * 1.14);
    S.tweens.add({ targets: e, scaleX: q.sx, scaleY: q.sy, angle: 0, duration: 260, ease: 'Back.easeOut' });
  };
  /** Tajo: un arco de luz en la dirección del golpe. */
  const tajo = (S, e, alcance, col) => {
    if (!e || !e.active) return;
    const b = e.body, x = b ? b.center.x : e.x, y = b ? b.center.y - 6 : e.y, izq = e.flipX;
    const g = S.add.graphics().setDepth(y + 40).setPosition(x, y);
    const R0 = Math.max(18, alcance * 0.8), k = { t: 0 };
    S.tweens.add({ targets: k, t: 1, duration: 200, ease: 'Quad.easeOut', onUpdate: () => {
      g.clear();
      const a0 = izq ? Math.PI * 1.15 : -Math.PI * 0.15, a1 = izq ? Math.PI * 0.65 : Math.PI * 0.35, a = a0 + (a1 - a0) * k.t;
      for (let i = 0; i < 4; i++) {
        g.lineStyle(6 - i * 1.4, i === 0 ? 0xffffff : (col || 0xffd6a0), (1 - k.t) * (0.9 - i * 0.18));
        g.beginPath(); g.arc(0, 0, R0 - i * 3, Math.min(a0, a) , Math.max(a0, a), false); g.strokePath();
      }
    }, onComplete: () => g.destroy() });
  };
  // ------------------------------------------------------------------ (11/11) anticipación de los golpes
  // Pedido: "añade más animaciones a sus ataques, anticipaciones… a todos los jefes". El motor (enemies.js) llama a esto
  // antes de cada golpe cuerpo a cuerpo y espera lo que devuelve (ms) para soltar el golpe:
  // - los jefes: su animación de carga (windup, PixelLab) en bucle o, si no tienen, se agachan y se tensan; al pegar, un tajo;
  // - los golpes pesados de cualquiera: el aviso a píxel en el piso (aro que gira y se llena) en lugar del círculo rojo liso.
  const JEFES = { orc_campeon: 1, bestia_kragmor: 1, cazador_ulrak: 1, orc_warlord: 1, werebear_jefe: 1 };
  if (typeof MainGameScene !== 'undefined') MainGameScene.prototype.ckAvisoGolpe = function (enemy, def, heavy, hitAt, anim, swing) {
    const S = this, jefe = !!(def.boss || JEFES[enemy.type]);
    if (!jefe && !heavy) { enemy.play(anim); return 0; }
    const wu = enemy.type + '_windup', tiene = jefe && S.anims.exists(wu);
    const warn = jefe ? (tiene ? Math.max(380, Math.min(620, S.anims.get(wu).duration)) : (heavy ? 420 : 280)) : 380;
    const b = enemy.body, fx = b ? b.center.x : enemy.x, fy = b ? b.bottom : enemy.y + 8;
    if (heavy) {
      // del lado al que mira y del tamaño del brazo (no un círculo enorme alrededor)
      const re = def.reach || 40, lado = enemy.flipX ? -1 : 1;
      zona(S, fx + lado * re * 0.45, fy - 2, re * 0.7 + 8, 0xff3b2f, warn + hitAt);
      try { sfx.playAlert(); } catch (e) {}
    }
    if (tiene) enemy.play({ key: wu, repeat: -1 }, true);
    else { if (heavy) enemy.setTint(0xff7070); anticipar(S, enemy, warn); }
    if (jefe) carga(S, enemy, heavy ? 0xff5a40 : 0xffd27a, warn);
    S.time.delayedCall(warn, () => {
      if (!enemy.active || enemy.isDead || enemy.swingId !== swing) return;
      enemy.clearTint(); enemy.play(anim);
    });
    if (jefe) S.time.delayedCall(warn + Math.max(0, hitAt - 70), () => {
      if (!enemy.active || enemy.isDead || enemy.swingId !== swing) return;
      tajo(S, enemy, def.reach || 40, heavy ? 0xff9a7a : null);
      if (heavy) { const bb = enemy.body; onda(S, bb ? bb.center.x + (enemy.flipX ? -14 : 14) : enemy.x, bb ? bb.bottom - 2 : enemy.y, (def.reach || 40) * 0.9, 0xff3b2f, 380); }
    });
    return warn;
  };
  window.CK_JEFES_FX = { carga, flecha, roca, sombraCaida, escombros, grieta, rastro, estela, chispas, ondaVoz, zona, franjaViva, ondaViva, onda, anticipar, soltar, tajo };
})();
