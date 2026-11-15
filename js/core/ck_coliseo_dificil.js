'use strict';
/* Jefes del Coliseo más difíciles (15/11, nota 47 del dueño: "ponle más dificultad a los jefes, que tengan más habilidades
   únicas…"). Se suma a lo de ck_coliseo.js (sus ataques siguen) con turnos propios:
   - GORVAK (escudo): más vida. ABANICO DE CUCHILLAS (amarillo): tira tres cuchillas que van y vuelven. Si las PARÁS (C)
     justo cuando llegan, vuelven contra él. Las flechas y dagas le hacen la mitad (las frena el escudo).
   - ULRAK Y COLMILLO (huargo): más rápido y con más vida. CEBOS: deja carne en el piso con un cepo escondido; si lo pisás
     quedás ATRAPADO: apretá J, K o ESPACIO (o tocá la pantalla) varias veces rápido para soltarte. FLECHAS ENVENENADAS
     (verdes): si te pegan, quedás lento un rato. Esquiva a veces las flechas y dagas.
   - KRAGMOR (gorila): mucha más vida y, a medida que la pierde, más rápido. Al 60 % y al 30 %: se planta en el medio, se
     vuelve INVULNERABLE y hace brotar ESPINAS en oleadas por la arena (las marcas rojas avisan dónde). La magia le hace
     la mitad (cuero duro).
   - GRUSHAK (en la arena): REMOLINO: gira con el hacha como un trompo y rebota por la arena; cuando se detiene queda
     ATURDIDO un segundo y recibe más daño. La magia le hace menos.
   Borrar la línea de index.html deja a los jefes como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_COLISEO) return;
  const P = MainGameScene.prototype, C = window.CK_COLISEO;
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const FX = () => window.CK_JEFES_FX;
  const ROJO = 0xff3030, AMARILLO = 0xffd23a, VERDE = 0x6ee06a;
  const ZCOL = 'ed_coliseo_orco.main';
  const ARENA = { x: 718, y: 470, rx: 330, ry: 125 };                 // la arena (coordenadas del mapa)
  const MAGIA = /^(fuego|hielo|trueno|nova|rayo)$/, PROYECTIL = /^(flecha|daga)$/;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const pies = S => { const b = S.player.body; return { x: b.center.x, y: b.bottom - 3 }; };
  const golpeRojo = (S, n) => { const pu = S.parryUntil; S.parryUntil = 0; S.damagePlayer(n); S.parryUntil = pu; };

  // ------------------------------------------------------------------ más vida y más rápidos
  const MAS = { orc_campeon: { hp: 52 }, cazador_ulrak: { hp: 58, speed: 150, cd: 1100 }, bestia_kragmor: { hp: 85 } };
  const ajustar = () => {
    if (typeof ENEMY_TYPES === 'undefined') return;
    Object.keys(MAS).forEach(id => { if (ENEMY_TYPES[id] && !ENEMY_TYPES[id]._ckDif) { Object.assign(ENEMY_TYPES[id], MAS[id]); ENEMY_TYPES[id]._ckDif = true; } });
    if (C.JEFES && C.JEFES.cazador_ulrak) C.JEFES.cazador_ulrak.cada = [2600, 3800];
  };
  const pr0 = P.preloadRoster;
  P.preloadRoster = function () { const r = pr0.apply(this, arguments); try { ajustar(); } catch (e) {} return r; };

  // ------------------------------------------------------------------ turnos
  const libre = (S, e) => e._ckc && !e._ckc.ocupado && e.state === 'chase' && !e.isAttacking && !S.isDead && !S.dialogOpen && !S._ckEscena;
  const empezar = (S, e) => { e._ckc.ocupado = true; e.state = 'ck_especial'; e.isAttacking = true; e.setVelocity && e.setVelocity(0, 0); };
  const terminar = (S, e, pausa) => {
    if (!vivo(e)) return;
    e.clearTint(); e.angle = 0; e._ckc.ocupado = false; e.isAttacking = false; e.state = 'chase';
    e._ckc.prox = Math.max(e._ckc.prox || 0, S.time.now + (pausa || R(1800, 2800)));
    if (S.anims.exists(e.type + '_idle')) e.play(e.type + '_idle', true);
  };
  const aviso = (S, e, col) => {
    e.setTint(col === ROJO ? 0xff8080 : col === VERDE ? 0xa8f0a0 : 0xffe08a);
    if (FX() && FX().carga) FX().carga(S, e, col, 500);
    const t = S.add.text(e.x, e.y - 66, '!', { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: col === ROJO ? '#ff4040' : col === VERDE ? '#7cf07a' : '#ffd23a', stroke: '#1b0f0a', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(26002);
    S.tweens.add({ targets: t, y: t.y - 8, duration: 220, yoyo: true, repeat: 2, onComplete: () => t.destroy() });
    son(col === ROJO ? 'ck_aviso_carga' : 'alert', 0.6);
  };
  const marca = (S, x, y, r, col, ms) => {
    if (FX() && FX().zona) { FX().zona(S, x, y, r, col, ms); return; }
    const g = S.add.ellipse(x, y, r * 2, r * 1.24, col, 0.2).setStrokeStyle(2, col, 0.95).setDepth(9);
    S.time.delayedCall(ms, () => g.destroy());
  };

  // ---------- GORVAK: abanico de cuchillas (se pueden devolver con la parada)
  const texCuchilla = S => {
    if (S.textures.exists('ckc_cuchilla')) return 'ckc_cuchilla';
    const t = S.textures.createCanvas('ckc_cuchilla', 18, 18), g = t.getContext();
    const p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    p('#1b0f0a', 3, 6, 12, 7); p('#8a8f96', 4, 7, 10, 5); p('#c8ccd2', 5, 7, 8, 2); p('#5a3a24', 7, 12, 3, 5); p('#d01819', 13, 8, 1, 3);
    t.refresh(); return 'ckc_cuchilla';
  };
  const abanico = (S, e) => {
    empezar(S, e); const t = pies(S); e.setFlipX(t.x < e.x);
    aviso(S, e, AMARILLO);
    if (S.anims.exists('orc_campeon_attack1')) e.play('orc_campeon_attack1', true);
    S.time.delayedCall(650, () => {
      if (!vivo(e)) return;
      const ox = e.body.center.x, oy = e.body.bottom - 22, a0 = Math.atan2(t.y - oy, t.x - ox);
      son('sword_swing2', 0.75, { rate: 0.75 });
      let quedan = 3;
      [-0.38, 0, 0.38].forEach((d, i) => {
        const a = a0 + d, L = 250, c = S.add.image(ox, oy, texCuchilla(S)).setDepth(26000).setScale(1.4);
        if (FX() && FX().estela) FX().estela(S, c, 180);
        let pego = false, devuelta = false; const k = { t: 0 };
        const fin = () => { c.destroy(); if (--quedan <= 0) terminar(S, e); };
        S.tweens.add({ targets: k, t: 1, duration: 1250, delay: i * 90, ease: 'Linear',
          onUpdate: tw => {
            if (devuelta || !c.active) return;
            const s = Math.sin(k.t * Math.PI), x = ox + Math.cos(a) * L * s, y = oy + Math.sin(a) * L * s;
            c.setPosition(x, y).setRotation(k.t * 24);
            const p = pies(S);
            if (!pego && Math.hypot(p.x - x, p.y - 10 - y) < 18) {
              if (S.parryUntil && S.parryUntil > S.time.now) {          // ¡parada justa! la cuchilla vuelve contra él
                devuelta = true; tw.stop();
                S.createFloatingText(x, y - 20, '¡DEVUELTA!', 0x9be7ff); son('sword_hit', 0.8, { rate: 1.4 });
                if (FX() && FX().chispas) FX().chispas(S, x, y, 8, 0x9be7ff);
                S.tweens.add({ targets: c, x: e.x, y: e.y - 20, rotation: c.rotation + 12, duration: 260, onComplete: () => {
                  if (vivo(e)) { const fa = S._ckFuente; S._ckFuente = 'parada'; try { S.damageEnemy(e, 3, x, y); } finally { S._ckFuente = fa; } }
                  fin();
                } });
                return;
              }
              pego = true; S.damagePlayer(2);
            }
          },
          onComplete: () => { if (!devuelta) fin(); } });
      });
    });
  };

  // ---------- ULRAK: cebos con cepo y flechas envenenadas
  const texCebo = S => {
    if (S.textures.exists('ckcd_cebo')) return 'ckcd_cebo';
    const t = S.textures.createCanvas('ckcd_cebo', 16, 10), g = t.getContext();
    const p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    p('#4a4d55', 0, 7, 16, 2); p('#6b6f7a', 1, 6, 2, 2); p('#6b6f7a', 13, 6, 2, 2); [2, 5, 8, 11, 14].forEach(x => p('#9aa0aa', x, 5, 1, 2));   // el cepo
    p('#7a1f1f', 4, 2, 8, 5); p('#b03a3a', 5, 2, 6, 3); p('#e8d8c0', 11, 3, 3, 2); p('#e8d8c0', 2, 4, 2, 2);                              // la carne con su hueso
    t.refresh(); return 'ckcd_cebo';
  };
  const cebos = (S, e) => {
    empezar(S, e); aviso(S, e, ROJO);
    const p = pies(S), a = S.currentInterior.area;
    const pts = [[p.x + R(-30, 30), p.y + R(-20, 20)]];
    for (let i = 0; i < 2; i++) { const an = R(0, Math.PI * 2), d = R(60, 120); pts.push([p.x + Math.cos(an) * d, p.y + Math.sin(an) * d * 0.6]); }
    S.createFloatingText(e.x, e.y - 70, '¡Colmillo, a los cebos!', 0xfca5a5);
    pts.forEach(([x, y], i) => S.time.delayedCall(250 + i * 220, () => {
      if (!vivo(e) || zona(S) !== ZCOL) return;
      if (!S.navIsFree || !S.navIsFree(x, y)) return;
      const sp = S.add.image(x, y, texCebo(S)).setOrigin(0.5, 1).setScale(1.4).setDepth(y - 2).setAlpha(0);
      S.tweens.add({ targets: sp, alpha: 1, duration: 300 });
      (S._ckcdCebos = S._ckcdCebos || []).push({ sp, x, y, arma: S.time.now + 650, hasta: S.time.now + 11000 });
    }));
    S.time.delayedCall(1100, () => terminar(S, e, R(1800, 2600)));
  };
  const atrapar = (S, c) => {
    if (S._ckcdTrampa || S.isDead) return;
    c.sp.setTint(0xff6060); S.tweens.add({ targets: c.sp, scaleY: 0.9, duration: 80, yoyo: true });
    son('ck_cepo', 0.9) || son('sword_hit', 0.9, { rate: 0.6 }); S.cameras.main.shake(200, 0.006);
    golpeRojo(S, 1);
    const g = S.add.graphics().setDepth(30001);
    const t = S.add.text(S.player.x, S.player.y - 64, '¡ATRAPADO! J · K · ESPACIO', { fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold', color: '#ffd23a', stroke: '#1b0f0a', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(30002).setResolution(3);
    S._ckcdTrampa = { c, n: 0, max: 7, g, t, t0: S.time.now };
    if (S.player.body) { S.player.body.setVelocity(0, 0); S.player.body.moves = false; }
  };
  const soltar = S => {
    const T = S._ckcdTrampa; if (!T) return;
    S._ckcdTrampa = null;
    try { T.g.destroy(); T.t.destroy(); T.c.sp.destroy(); } catch (e) {}
    if (S.player && S.player.body) S.player.body.moves = true;
    if (S.player) S.createFloatingText(S.player.x, S.player.y - 50, '¡Libre!', 0x86efac);
    son('door_gate', 0.5, { rate: 1.5 });
  };
  const golpeTecla = () => {
    const S = window.activeGameScene; const T = S && S._ckcdTrampa; if (!T) return;
    T.n++; S.cameras.main.shake(60, 0.002); if (T.c.sp.active) T.c.sp.x += (T.n % 2 ? 1 : -1);
    if (T.n >= T.max) soltar(S);
  };
  window.addEventListener('keydown', ev => { if (!ev.repeat && /^(KeyJ|KeyK|Space|Enter|KeyX)$/.test(ev.code)) golpeTecla(); });
  window.addEventListener('pointerdown', () => golpeTecla());
  const veneno = (S, e) => {
    empezar(S, e); const t = pies(S); e.setFlipX(t.x < e.x); aviso(S, e, VERDE);
    if (S.anims.exists('cazador_ulrak_arco')) e.play('cazador_ulrak_arco', true);
    S.time.delayedCall(600, () => {
      if (!vivo(e)) return;
      son('bow_shot', 0.8, { rate: 0.8 }) || son('sword_swing2', 0.6, { rate: 1.6 });
      [0, 260].forEach((dl, i) => S.time.delayedCall(dl, () => {
        if (!vivo(e)) return;
        const q = pies(S), ox = e.body.center.x + (e.flipX ? -28 : 28), oy = e.body.bottom - 50, a = Math.atan2(q.y - 12 - oy, q.x - ox) + (i ? 0.12 : -0.12);
        const f = S.add.ellipse(ox, oy, 9, 5, 0x4fd04a, 1).setStrokeStyle(1, 0x123a10).setDepth(26000).setRotation(a);
        const v = 230, t0 = S.time.now; let fin = false;
        const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
          if (fin) return;
          const dt = (S.time.now - t0) / 1000, x = ox + Math.cos(a) * v * dt, y = oy + Math.sin(a) * v * dt;
          f.setPosition(x, y);
          if (Math.random() < 0.4) { const gp = S.add.rectangle(x, y, 2, 2, 0x7cf07a, 0.8).setDepth(25999); S.tweens.add({ targets: gp, alpha: 0, y: y + 4, duration: 400, onComplete: () => gp.destroy() }); }
          const p = pies(S);
          if (Math.hypot(p.x - x, p.y - 14 - y) < 13) {
            fin = true; ev.remove(); f.destroy(); S.damagePlayer(1);
            S._inSlowZone = true; S._slowZoneTimer = S.time.now + 3200; S._ckcdLento = S.time.now + 3200;
            S.createFloatingText(S.player.x, S.player.y - 44, 'Veneno: lento', 0x86efac);
          } else if (dt > 1.8) { fin = true; ev.remove(); f.destroy(); }
        } });
      }));
      S.time.delayedCall(800, () => terminar(S, e));
    });
  };

  // ---------- KRAGMOR: espinas en oleadas, invulnerable en el medio
  const texEspina = S => {
    if (S.textures.exists('ckcd_espina')) return 'ckcd_espina';
    const t = S.textures.createCanvas('ckcd_espina', 14, 16), g = t.getContext();
    const p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    [[2, 9, 3], [6, 2, 3], [10, 7, 3]].forEach(([x, y0, w]) => { for (let y = y0; y < 15; y++) { const ww = Math.max(1, Math.round((y - y0 + 1) * w / (15 - y0))); p('#2a1d12', x - ((ww / 2) | 0) - 1, y, ww + 2, 1); p(y < y0 + 3 ? '#efe6d2' : '#b8a888', x - ((ww / 2) | 0), y, ww, 1); } });
    p('#3a2a1c', 0, 14, 14, 2);
    t.refresh(); return 'ckcd_espina';
  };
  const espinas = (S, e) => {
    empezar(S, e); const a = S.currentInterior.area;
    e._ckcdInvul = true; e.setTint(0x8aa0c8);
    S.createFloatingText(e.x, e.y - 76, '¡KRAGMOR SE ENFURECE!', 0xff6b6b);
    son('werebear_attack', 1, { rate: 0.5 }) || son('orc_attack', 1, { rate: 0.5 });
    // al medio de la arena
    const cx = a.x + ARENA.x, cy = a.y + ARENA.y, pie = e.body ? e.body.bottom - e.y : 0;
    if (e.body) e.body.enable = false;
    if (S.anims.exists('bestia_kragmor_walk')) e.play('bestia_kragmor_walk', true);
    e.setFlipX(cx < e.x);
    S.tweens.add({ targets: e, x: cx, y: cy - pie, duration: 900, ease: 'Sine.easeInOut', onUpdate: () => e.setDepth(e.y), onComplete: () => {
      if (!vivo(e)) return;
      if (e.body) { e.body.enable = true; e.body.reset(e.x, e.y); e.body.setVelocity(0, 0); }
      if (S.anims.exists('bestia_kragmor_slam')) e.play('bestia_kragmor_slam', true);
      S.cameras.main.shake(500, 0.01);
      const OLAS = 4;
      for (let o = 0; o < OLAS; o++) S.time.delayedCall(o * 1150, () => {
        if (!vivo(e)) return;
        if (S.anims.exists('bestia_kragmor_slam')) e.play('bestia_kragmor_slam', true);
        const p = pies(S), pts = [[p.x, p.y]];
        const n = 6 + o * 2;
        for (let i = 0; i < n; i++) {
          const an = (i / n) * Math.PI * 2 + o * 0.5, rr = (0.35 + ((i + o) % 3) * 0.3);
          pts.push([cx + Math.cos(an) * ARENA.rx * rr, cy + Math.sin(an) * ARENA.ry * rr]);
        }
        pts.forEach(([x, y]) => marca(S, x, y, 22, ROJO, 800));
        S.time.delayedCall(800, () => {
          son('ck_piedra', 0.6, { rate: 1.3 }) || son('bone_hit', 0.7, { rate: 0.8 });
          let pego = false;
          pts.forEach(([x, y]) => {
            const sp = S.add.image(x, y + 2, texEspina(S)).setOrigin(0.5, 1).setScale(2, 0.1).setDepth(y + 1);
            S.tweens.add({ targets: sp, scaleY: 2, duration: 110, ease: 'Back.easeOut' });
            S.tweens.add({ targets: sp, scaleY: 0.1, alpha: 0, delay: 700, duration: 260, onComplete: () => sp.destroy() });
            if (FX() && FX().escombros) FX().escombros(S, x, y, 14, 3);
            const q = pies(S);
            if (!pego && Math.hypot((q.x - x) / 24, (q.y - y) / 15) < 1) { pego = true; golpeRojo(S, 1); }
          });
        });
      });
      S.time.delayedCall(OLAS * 1150 + 600, () => { if (!vivo(e)) return; e._ckcdInvul = false; terminar(S, e, R(1600, 2400)); });
    } });
  };

  // ---------- GRUSHAK: el remolino
  const remolino = (S, e) => {
    empezar(S, e); aviso(S, e, ROJO);
    S.createFloatingText(e.x, e.y - 84, '¡REMOLINO!', 0xff6b6b);
    const a = S.currentInterior.area;
    S.time.delayedCall(650, () => {
      if (!vivo(e)) return;
      const an = S.anims.exists('orc_warlord_attack2') ? 'orc_warlord_attack2' : null;
      if (an) e.play({ key: an, repeat: -1, frameRate: 18 }, true);
      let ang = Math.atan2(pies(S).y - e.body.bottom, pies(S).x - e.body.center.x), v = 270, golpe = 0;
      const t0 = S.time.now;
      son('ck_giro_hacha', 0.8) || son('sword_swing2', 0.8, { rate: 0.6 });
      e._ckcdGiro = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        if (!vivo(e)) { e._ckcdGiro.remove(); return; }
        const ahora = S.time.now, bx = e.body.center.x, by = e.body.bottom - 4;
        // rebota contra lo que no se pisa y contra el borde de la arena
        const nx = bx + Math.cos(ang) * 18, ny = by + Math.sin(ang) * 18;
        const fuera = Math.hypot((nx - a.x - ARENA.x) / ARENA.rx, (ny - a.y - ARENA.y) / ARENA.ry) > 1;
        if (fuera || (S.navIsFree && !S.navIsFree(nx, ny))) {
          ang = Math.atan2(a.y + ARENA.y - by, a.x + ARENA.x - bx) + R(-0.7, 0.7);
          S.cameras.main.shake(90, 0.004); son('bone_hit', 0.5, { rate: 1.2, minGap: 200 });
        }
        e.body.setVelocity(Math.cos(ang) * v, Math.sin(ang) * v);
        e.setFlipX(Math.floor(ahora / 90) % 2 === 0);
        if (Math.random() < 0.3 && window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', bx, by, 14, 260);
        const p = pies(S);
        if (ahora > golpe && Math.hypot(p.x - bx, p.y - by) < 34) { golpe = ahora + 700; golpeRojo(S, 2); }
        if (ahora - t0 > 3400) {
          e._ckcdGiro.remove(); e.body.setVelocity(0, 0);
          // mareado: un segundo largo para pegarle
          e._ckcdMareo = S.time.now + 1300; e.setTint(0xb0b0b0);
          if (S.anims.exists('orc_warlord_idle')) { e.play('orc_warlord_idle', true); e.anims.timeScale = 0.4; }
          S.createFloatingText(e.x, e.y - 84, '¡MAREADO!', 0xfde68a);
          const est = S.add.text(e.x, e.y - 90, '✦ ✦ ✦', { fontFamily: 'Georgia', fontSize: '13px', color: '#ffe08a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(26002);
          S.tweens.add({ targets: est, angle: 360, duration: 1300, onUpdate: () => est.setPosition(e.x, e.y - 90), onComplete: () => est.destroy() });
          S.time.delayedCall(1300, () => { if (vivo(e)) e.anims.timeScale = 1; terminar(S, e, R(2400, 3400)); });
        }
      } });
    });
  };

  // ------------------------------------------------------------------ quién hace qué y cuándo
  const pensar = S => {
    if (!S.enemies || zona(S) !== ZCOL) return;
    const now = S.time.now;
    S.enemies.getChildren().forEach(e => {
      if (!vivo(e)) return;
      if (e.type === 'orc_warlord' && e._c2Jefe && !e._ckc) e._ckc = { prox: now + R(4000, 6000), ocupado: false };   // Grushak, en la arena
      if (!e._ckc) return;
      const D = e._ckcd = e._ckcd || { prox: now + R(2600, 4200), base: e.def ? { speed: e.def.speed, cd: e.def.cd } : null, umbral: 0 };
      // Kragmor: más rápido a medida que pierde vida; espinas al 60 % y al 30 %
      if (e.type === 'bestia_kragmor' && D.base && e.def) {
        const falta = 1 - e.hp / e.maxHp;
        e.def = Object.assign({}, e.def, { speed: D.base.speed * (1 + 0.7 * falta), cd: Math.round(D.base.cd * (1 - 0.4 * falta)) });
        const u = e.hp <= e.maxHp * 0.3 ? 2 : e.hp <= e.maxHp * 0.6 ? 1 : 0;
        if (u > D.umbral && libre(S, e)) { D.umbral = u; espinas(S, e); return; }
      }
      if (now < D.prox || !libre(S, e) || now < (e._ckc.prox || 0) - 1200) return;
      D.prox = now + R(5200, 7600);
      if (e.type === 'orc_campeon') abanico(S, e);
      else if (e.type === 'cazador_ulrak') (Math.random() < 0.5 ? cebos : veneno)(S, e);
      else if (e.type === 'orc_warlord') { D.prox = now + R(8000, 11000); remolino(S, e); }
    });
  };
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try { pensar(this); } catch (e) { if (!P._ckcdAv) { P._ckcdAv = 1; console.warn('[coliseo difícil]', e); } }
    return r;
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      // los cebos: se arman, atrapan y se van
      if (S._ckcdCebos && S._ckcdCebos.length && S.player && S.player.body) {
        const p = pies(S), now = S.time.now;
        S._ckcdCebos = S._ckcdCebos.filter(c => {
          if (!c.sp.active) return false;
          if (now > c.hasta || zona(S) !== ZCOL) { if (!S._ckcdTrampa || S._ckcdTrampa.c !== c) { S.tweens.add({ targets: c.sp, alpha: 0, duration: 300, onComplete: () => c.sp.destroy() }); return false; } }
          if (now > c.arma && !S._ckcdTrampa && Math.hypot(p.x - c.x, (p.y - c.y) * 1.3) < 13) atrapar(S, c);
          return true;
        });
      }
      const T = S._ckcdTrampa;
      if (T) {
        if (!S.player || S.isDead || zona(S) !== ZCOL) soltar(S);
        else {
          S.player.body && S.player.body.setVelocity(0, 0);
          T.t.setPosition(S.player.x, S.player.y - 60);
          T.g.clear(); T.g.fillStyle(0x1b0f0a, 0.85).fillRect(S.player.x - 22, S.player.y - 58, 44, 6); T.g.fillStyle(0xffd23a, 1).fillRect(S.player.x - 21, S.player.y - 57, 42 * T.n / T.max, 4);
          if (S.time.now - T.t0 > 6000) soltar(S);                  // nunca queda atrapado para siempre
        }
      }
      if (S._ckcdLento) {
        if (S.time.now < S._ckcdLento) { if (S.player && !S.player.isTinted) S.player.setTint(0xa8f0a0); }
        else { S._ckcdLento = 0; if (S.player) S.player.clearTint(); }
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ resistencias, invulnerable y mareado
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    try {
      if (enemy && !enemy.isDead && zona(this) === ZCOL) {
        const f = this._ckFuente || '', magia = MAGIA.test(f) || (this.playerHero === 'wizard' && !f), proy = PROYECTIL.test(f);
        if (enemy._ckcdInvul) {
          if (!enemy._ckcdAv || this.time.now - enemy._ckcdAv > 500) { enemy._ckcdAv = this.time.now; this.createFloatingText(enemy.x, enemy.y - 56, '¡INVULNERABLE!', 0x8aa0c8); son('sword_hit', 0.5, { rate: 1.7, minGap: 150 }); }
          return;
        }
        let k = 1, txt = '';
        if (enemy.type === 'orc_campeon' && proy) { k = 0.5; txt = 'El escudo frena'; }
        else if (enemy.type === 'cazador_ulrak' && proy && Math.random() < 0.35) { this.createFloatingText(enemy.x, enemy.y - 56, '¡ESQUIVA!', 0xcbd5e1); return; }
        else if (enemy.type === 'bestia_kragmor' && magia) { k = 0.5; txt = 'Cuero duro'; }
        else if (enemy.type === 'orc_warlord' && enemy._c2Jefe && magia) k = 0.7;
        if (enemy._ckcdMareo && this.time.now < enemy._ckcdMareo) { k *= 1.5; txt = ''; }
        if (k !== 1) {
          arguments[1] = Math.max(0.5, Math.round(amount * k * 2) / 2);
          if (txt && (!enemy._ckcdTx || this.time.now - enemy._ckcdTx > 1500)) { enemy._ckcdTx = this.time.now; this.createFloatingText(enemy.x, enemy.y - 56, txt, 0xcbd5e1); }
        }
      }
    } catch (e) {}
    return de0.apply(this, arguments);
  };
  window.CK_COLISEO_DIFICIL = { MAS, abanico, cebos, veneno, espinas, remolino, ARENA };
})();
