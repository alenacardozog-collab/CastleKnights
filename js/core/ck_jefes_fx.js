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
  window.CK_JEFES_FX = { carga, flecha, roca, sombraCaida, escombros, grieta, rastro, estela, chispas, ondaVoz };
})();
