'use strict';
/* El reino se corrompe (13/11, prueba pedida por el dueño: "que las cosas se tornen rojas y que empiecen a salir los
   demonios y persigan a los aldeanos y ataquen todo… que haya fuego, humo… y que de vez en cuando caigan como meteoritos,
   así como cuando llueve caen rayos").
   Se suma al reino en llamas de ck_capitulo3.js (story.flags.infierno):
   - LA CORRUPCIÓN (CK_INFIERNO_VIVO.corromper(escena)): la tierra tiembla, el rojo entra de a golpes, se abren grietas
     que brillan y de cada una trepa un demonio; los techos se prenden de a uno; la gente grita y sale corriendo.
   - LA GENTE HUYE: vecinos que corren hacia las puertas (taberna, casas) escapando del demonio más cercano. Los demonios
     los persiguen y les pegan (npcTakeHit del juego); el que cae queda tirado pidiendo ayuda hasta que el héroe lo levanta
     con T. Si el héroe se acerca, el demonio lo deja y va por él.
   - LOS DEMONIOS ROMPEN TODO: los que no tienen a quién perseguir revientan vasijas, cajones y barricadas cercanas.
   - HUMO: columnas oscuras que salen de cada techo que arde y de los cráteres; el viento del clima las lleva.
   - METEORITOS: como los rayos cuando llueve, cada tanto cae uno del cielo: primero una marca roja en el piso, después
     la piedra encendida con su estela, el impacto (destello, temblor, onda, esquirlas, polvo), un cráter que humea y
     queda ardiendo un rato. Lastima a quien esté abajo (héroe, demonios, vecinos) y rompe lo que haya.
   Todo hecho por código (sin arte nuevo) y con los sonidos que ya están. Va después de ck_capitulo3.js.
   Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = a => a[Math.floor(Math.random() * a.length)];
  const zonaDe = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => (S.currentInterior ? S.currentInterior.area : { x: 0, y: 0, w: 640, h: 640 });
  const sonar = (k, v, o) => { try { if (typeof sfx !== 'undefined') sfx.fx(k, v, o); } catch (e) {} };
  const infierno = s => !!(s && s.flags && s.flags.infierno && !s.flags.cap3_fin);
  const afuera = S => !S.currentInterior || !!(window.CK_AFUERA && window.CK_AFUERA(S));
  const esDemonio = e => e && e.active && !e.isDead && /^demonio_/.test(e.type || '');
  const LLAMA = () => (window.CK_FUEGOS_VIVOS && window.CK_FUEGOS_VIVOS.LLAMA) || 'ckfv_llama_fuego';
  const PISO = 1.5;   // por encima del suelo y por debajo de todo lo que está parado

  // ------------------------------------------------------------------ texturas por código
  const texturas = S => {
    const hacer = (k, w, h, fn) => { if (S.textures.exists(k)) return; const t = S.textures.createCanvas(k, w, h); fn(t.getContext(), w, h); t.refresh(); };
    hacer('ckiv_humo', 32, 32, (g) => {
      for (let i = 0; i < 7; i++) {
        const x = 16 + R(-6, 6), y = 16 + R(-6, 6), r = R(7, 11), gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      }
    });
    hacer('ckiv_chispa', 2, 2, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });
    hacer('ckiv_meteoro', 14, 14, g => {
      const P2 = (c, pts) => { g.fillStyle = c; pts.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h)); };
      P2('#ffb347', [[3, 1, 8, 12], [1, 3, 12, 8], [2, 2, 10, 10]]);
      P2('#ff6a1a', [[4, 2, 6, 10], [2, 4, 10, 6], [3, 3, 8, 8]]);
      P2('#4a2a1e', [[5, 4, 5, 6], [4, 5, 7, 4]]);
      P2('#2a1712', [[6, 6, 3, 3]]);
      P2('#fff3c4', [[3, 3, 2, 2], [9, 2, 1, 1]]);
    });
    hacer('ckiv_destello', 64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,230,1)'); r.addColorStop(0.35, 'rgba(255,190,90,0.7)'); r.addColorStop(1, 'rgba(255,90,30,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
    hacer('ckiv_anillo', 64, 64, (g) => { g.strokeStyle = 'rgba(255,200,140,1)'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'rgba(255,120,60,0.6)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.stroke(); });
    hacer('ckiv_marca', 40, 20, (g) => { g.save(); g.scale(1, 0.5); g.strokeStyle = 'rgba(255,60,40,1)'; g.lineWidth = 3; g.beginPath(); g.arc(20, 20, 17, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(255,40,20,0.35)'; g.beginPath(); g.arc(20, 20, 15, 0, Math.PI * 2); g.fill(); g.restore(); });
    hacer('ckiv_crater', 44, 22, (g) => {
      g.save(); g.scale(1, 0.5);
      let r = g.createRadialGradient(22, 22, 0, 22, 22, 22); r.addColorStop(0, 'rgba(14,8,6,0.95)'); r.addColorStop(0.6, 'rgba(36,20,14,0.85)'); r.addColorStop(1, 'rgba(36,20,14,0)'); g.fillStyle = r; g.fillRect(0, 0, 44, 44);
      g.restore();
      g.fillStyle = 'rgba(255,120,40,0.9)';
      for (let i = 0; i < 16; i++) { const a = R(0, Math.PI * 2), d = R(6, 14); g.fillRect(Math.round(22 + Math.cos(a) * d), Math.round(11 + Math.sin(a) * d * 0.5), 1, 1); }
    });
    hacer('ckiv_brillo', 44, 22, (g) => { g.save(); g.scale(1, 0.5); const r = g.createRadialGradient(22, 22, 0, 22, 22, 20); r.addColorStop(0, 'rgba(255,150,60,0.9)'); r.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = r; g.fillRect(0, 0, 44, 44); g.restore(); });
    for (let v = 0; v < 3; v++) hacer('ckiv_grieta' + v, 56, 24, (g) => {
      // un tajo que se abre en zigzag, con ramitas; borde oscuro y adentro brasa
      const pts = []; let x = 4, y = 12 + R(-3, 3);
      while (x < 52) { pts.push([x, y]); x += R(4, 7); y = Math.max(4, Math.min(20, y + R(-4, 4))); }
      const linea = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
      linea(5, 'rgba(20,6,4,0.95)'); linea(3, 'rgba(200,40,16,1)'); linea(1, 'rgba(255,214,120,1)');
      for (let k = 0; k < 4; k++) { const [a, b] = UNO(pts); g.strokeStyle = 'rgba(160,30,12,0.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a, b); g.lineTo(a + R(-6, 6), b + R(-6, 6)); g.stroke(); }
    });
  };

  // ------------------------------------------------------------------ estado por zona
  const est = S => {
    if (S._ckiv && S._ckiv.z === zonaDe(S) && S._ckiv.inter === S.currentInterior) return S._ckiv;
    limpiar(S);
    return (S._ckiv = { z: zonaDe(S), inter: S.currentInterior, objs: [], parts: [], humos: [], llamas: [], grietas: [], gente: [], luces: [],
      proxMeteoro: (S.time ? S.time.now : 0) + R(4000, 8000), proxRompe: 0, proxGrieta: 0, corrupcion: null });
  };
  const limpiar = S => {
    const V = S._ckiv; if (!V) return;
    V.objs.forEach(o => { try { if (o && o.active) o.destroy(); } catch (e) {} });
    V.parts.forEach(p => { try { if (p.s && p.s.active) p.s.destroy(); } catch (e) {} });
    V.gente.forEach(v => { try { if (v.sprite && v.sprite.active) v.sprite.destroy(); } catch (e) {} });
    (S.campaignNPCs || []).forEach(n => { if (n._ckivOculto && n.sprite && n.sprite.active) { n.sprite.setVisible(true); n._ckivOculto = false; } });
    S._ckiv = null; S._c3CapaFija = undefined;
  };
  const parte = (V, s, o) => V.parts.push(Object.assign({ s, t: 0, vx: 0, vy: 0 }, o));

  // ------------------------------------------------------------------ humo
  const viento = () => { try { const C = window.CK_CLIMA, v = C && C.C && C.C[C.actual()] ? C.C[C.actual()].viento : 10; return Math.max(-50, Math.min(50, v * 0.3 + 12)); } catch (e) { return 14; } };
  const bocanada = (S, V, x, y, k, oscuro) => {
    if (V.parts.length > 260) return;
    const s = S.add.image(x + R(-3, 3), y, 'ckiv_humo').setDepth(27390).setAlpha(0).setScale(0.35 * k).setRotation(R(0, 6.28));
    // nace pardo rojizo (lo alumbra el fuego de abajo) y se va poniendo gris oscuro al subir
    const c0 = oscuro ? [128, 70, 52] : [140, 110, 96], c1 = oscuro ? UNO([[30, 25, 24], [38, 32, 30], [24, 20, 19]]) : [80, 74, 70];
    s.setTint(Phaser.Display.Color.GetColor(c0[0], c0[1], c0[2]));
    parte(V, s, { vx: viento() * R(0.6, 1.1), vy: R(-32, -22) * Math.sqrt(k), vida: R(4200, 6000), a0: R(0.55, 0.72), e0: 0.35 * k, e1: R(2.2, 3.2) * k, giro: R(-0.4, 0.4), c0, c1 });
  };

  // ------------------------------------------------------------------ meteoritos
  const meteoro = (S, tx, ty) => {
    const V = est(S); texturas(S);
    const marca = S.add.image(tx, ty, 'ckiv_marca').setDepth(PISO + 0.2).setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setAlpha(0);
    V.objs.push(marca);
    S.tweens.add({ targets: marca, alpha: 0.95, scale: 1.25, duration: 1150, ease: 'Sine.easeIn' });
    S.tweens.add({ targets: marca, angle: 0, alpha: { from: 0.95, to: 0.45 }, yoyo: true, repeat: 3, duration: 140, delay: 300 });
    // entra por arriba de lo que se ve (no desde muy lejos, así se la ve caer)
    const cv = S.cameras.main.worldView, dir = Math.random() < 0.5 ? -1 : 1, y0 = Math.max(ty - 300, cv.y - 30), x0 = tx - dir * (ty - y0) * R(0.35, 0.5);
    S.time.delayedCall(520, () => {
      if (!S._ckiv || S._ckiv !== V) return;
      sonar('fire_cast', 0.45, { rate: 0.55 });
      const roca = S.add.image(x0, y0, 'ckiv_meteoro').setDepth(27532).setScale(1.8);
      const aura = S.add.image(x0, y0, 'ckiv_destello').setDepth(27531).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setTint(0xff8a3a);
      const sombra = S.add.image(tx, ty, 'ckiv_crater').setDepth(PISO + 0.15).setTint(0x000000).setAlpha(0.15).setScale(0.3);
      V.objs.push(roca, aura, sombra);
      V.luces.push({ o: roca, c: [255, 140, 60], r: 90, f: 1, hasta: S.time.now + 800, desde: S.time.now, sigue: true });
      const m = { t: 0 };
      S.tweens.add({ targets: m, t: 1, duration: 760, ease: 'Sine.easeIn',
        onUpdate: () => {
          const x = x0 + (tx - x0) * m.t, y = y0 + (ty - 6 - y0) * m.t;
          roca.setPosition(x, y).setRotation(m.t * 9); aura.setPosition(x, y).setScale(0.75 + 0.12 * Math.sin(m.t * 40));
          sombra.setScale(0.3 + 1.1 * m.t).setAlpha(0.15 + 0.4 * m.t);
          // la estela: brasas que quedan atrás y se apagan
          for (let i = 0; i < 4; i++) {
            const k = R(0, 1), c = S.add.image(x - (tx - x0) * 0.04 * k + R(-3, 3), y - (ty - y0) * 0.04 * k + R(-3, 3), 'ckiv_chispa').setDepth(27528)
              .setBlendMode(Phaser.BlendModes.ADD).setTint(UNO([0xfff0b0, 0xffd27a, 0xff8a3a, 0xff5a1a])).setScale(R(2, 4.5));
            parte(V, c, { vx: R(-15, 15), vy: R(-15, 15), vida: R(280, 560), a0: 1, encoge: true });
          }
          bocanada(S, V, x, y, 0.6, true);
        },
        onComplete: () => { roca.destroy(); aura.destroy(); marca.destroy(); impacto(S, tx, ty); } });
    });
  };
  const impacto = (S, x, y) => {
    const V = est(S);
    sonar('ck_explosion', 0.6, { rate: R(0.9, 1.1) });
    if (window.CK_LUZ && window.CK_LUZ.destello) window.CK_LUZ.destello([255, 150, 70], 0.7, 320);
    const p = S.player, d = p ? Math.hypot(p.x - x, p.y - y) : 999;
    S.cameras.main.shake(320, d < 200 ? 0.012 : 0.006);
    const fl = S.add.image(x, y - 6, 'ckiv_destello').setDepth(27540).setBlendMode(Phaser.BlendModes.ADD).setScale(0.6);
    V.objs.push(fl); S.tweens.add({ targets: fl, scale: 3.2, alpha: 0, duration: 300, onComplete: () => fl.destroy() });
    const an = S.add.image(x, y, 'ckiv_anillo').setDepth(27520).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2, 0.1);
    V.objs.push(an); S.tweens.add({ targets: an, scaleX: 2.6, scaleY: 1.3, alpha: 0, duration: 460, ease: 'Cubic.easeOut', onComplete: () => an.destroy() });
    for (let i = 0; i < 18; i++) {
      const roca = i < 7, s = S.add.image(x, y - 4, 'ckiv_chispa').setDepth(roca ? y + 1 : 27527).setScale(roca ? R(1.5, 2.5) : R(1, 2))
        .setTint(roca ? UNO([0x3b2a22, 0x52382a, 0x2a1d17]) : UNO([0xffd27a, 0xff8a3a, 0xffffff]));
      if (!roca) s.setBlendMode(Phaser.BlendModes.ADD);
      parte(V, s, { vx: R(-130, 130), vy: R(-170, -60), g: 380, vida: R(550, 900), a0: 1, suelo: y + R(-6, 10) });
    }
    for (let i = 0; i < 6; i++) bocanada(S, V, x + R(-14, 14), y - 4, R(0.7, 1.1), i % 2 === 0);
    // el cráter: humea y queda ardiendo un rato
    const cr = S.add.image(x, y, 'ckiv_crater').setDepth(PISO).setScale(1.3);
    const br = S.add.image(x, y, 'ckiv_brillo').setDepth(PISO + 0.1).setBlendMode(Phaser.BlendModes.ADD).setScale(1.3);
    V.objs.push(cr, br);
    S.tweens.add({ targets: br, alpha: 0, duration: 16000, ease: 'Sine.easeIn' });
    S.tweens.add({ targets: cr, alpha: 0, delay: 14000, duration: 8000 });
    if (S.textures.exists(LLAMA())) {
      const ll = S.add.sprite(x + R(-3, 3), y + 2, LLAMA()).setOrigin(0.5, 1).setScale(R(0.6, 0.85)).setDepth(y + 2);
      ll.play({ key: LLAMA(), startFrame: Math.floor(R(0, 7)) }); V.objs.push(ll);
      const L = { s: ll, x, y, hasta: S.time.now + R(9000, 14000), humoT: 0 };
      V.llamas.push(L);
    }
    V.luces.push({ x, y: y - 4, c: [255, 120, 50], r: 70, f: 1, hasta: S.time.now + 16000, desde: S.time.now });
    // lastima a quien esté abajo y rompe lo que haya
    if (p && d < 32 && S.damagePlayer && !S._ckEscena) S.damagePlayer(2);
    if (S.enemies) S.enemies.getChildren().forEach(e => { if (e.active && !e.isDead && Math.hypot(e.x - x, e.y - y) < 44) S.damageEnemy(e, 3, x, y); });
    V.gente.forEach(v => { if (!v.down && v.sprite.active && Math.hypot(v.sprite.x - x, v.sprite.y - y) < 36 && S.npcTakeHit) S.npcTakeHit(v, 2, { x, y }); });
    romperCerca(S, x, y, 40);
  };
  const romperCerca = (S, x, y, r) => {
    try {
      const RO = window.CK_ROMPIBLES;
      if (RO && RO.romper) (S._ckRomp || []).slice().forEach(o => { if (o && o.sp && o.sp.active && !o.roto && Math.hypot(o.sp.x - x, o.sp.y - y) < r) RO.romper(S, o); });
      const TR = window.CK_TERRENO_ROMPIBLE;
      if (TR && TR.romper) TR.lista(S).slice().forEach(t => { const sp = t && (t.sp || t.sprite); if (sp && sp.active && !t.roto && Math.hypot(sp.x - x, sp.y - y) < r) TR.romper(S, t); });
    } catch (e) {}
  };

  // ------------------------------------------------------------------ grietas y demonios que trepan
  const grieta = (S, x, y, tipo, cuando, cb) => {
    const V = est(S); texturas(S);
    const g = S.add.image(x, y, 'ckiv_grieta' + Math.floor(R(0, 3))).setDepth(PISO + 0.3).setScale(0, 1.2).setAngle(R(-40, 40));
    const gl = S.add.image(x, y, 'ckiv_brillo').setDepth(PISO + 0.35).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2, 0.6).setTint(0xff5030);
    V.objs.push(g, gl);
    sonar('ck_portal_abre', 0.25, { rate: R(1.3, 1.6) });
    S.tweens.add({ targets: g, scaleX: 1.3, duration: 420, ease: 'Cubic.easeOut' });
    S.tweens.add({ targets: gl, scaleX: 1.6, scaleY: 1.1, duration: 500 });
    S.tweens.add({ targets: gl, alpha: { from: 1, to: 0.55 }, yoyo: true, repeat: -1, duration: R(500, 800), delay: 500 });
    V.grietas.push({ x, y, g, gl });
    V.luces.push({ x, y, c: [255, 60, 30], r: 46, f: 0.9, fija: true });
    const z0 = zonaDe(S), i0 = S.currentInterior;
    S.time.delayedCall(cuando || 650, () => {
      const e = zonaDe(S) === z0 && S.currentInterior === i0 ? trepar(S, x, y, tipo) : null;   // (si ya se fue de la zona, no)
      if (cb) try { cb(e); } catch (er) {}
    });
  };
  const trepar = (S, x, y, tipo) => {
    const V = S._ckiv; if (!V || !S.spawnEnemy) return;
    const e = S.spawnEnemy(x, y - 2, tipo || (Math.random() < 0.18 ? 'demonio_bruto' : 'demonio_menor'));
    if (!e) return;
    e.zone = zonaDe(S); e._ckiv = true;
    const sx = e.scaleX, sy = e.scaleY;
    e.setAlpha(0).setScale(sx * 0.4, sy * 0.2);
    S.tweens.add({ targets: e, alpha: 1, scaleX: sx, scaleY: sy, duration: 380, ease: 'Back.easeOut' });
    for (let i = 0; i < 10; i++) {
      const c = S.add.image(x + R(-8, 8), y - 4, 'ckiv_chispa').setDepth(27527).setBlendMode(Phaser.BlendModes.ADD).setTint(UNO([0xff5a1a, 0xffb347])).setScale(R(1, 2));
      parte(V, c, { vx: R(-40, 40), vy: R(-110, -50), g: 200, vida: R(400, 700), a0: 1 });
    }
    sonar(e.type === 'demonio_bruto' ? 'ck_demonio_rugido' : 'ck_demonio_chillido', 0.7);
    S.time.delayedCall(420, () => apuntar(S, e));
    return e;
  };
  /** A quién va: el vecino más cercano que siga en pie (si el héroe está lejos), si no el héroe. */
  const apuntar = (S, e) => {
    const V = S._ckiv; if (!V || !esDemonio(e) || e._c3guarda) return;
    const libres = V.gente.filter(v => !v.down && !v.salvo && v.sprite.active);
    let m = null, md = 280;
    libres.forEach(v => { const d = Math.hypot(v.sprite.x - e.x, v.sprite.y - e.y); if (d < md) { md = d; m = v; } });
    // nadie a quien perseguir: va a golpear la puerta de un refugio (donde se metió la gente)
    if (!m) { const ps = puertas(S).filter(q => Math.hypot(q.sprite.x - e.x, q.sprite.y - e.y) < 280); if (ps.length) m = UNO(ps); }
    if (!m) return;
    e._target = m;
    if (S.alertEnemy) S.alertEnemy(e);
  };
  const puertas = S => {
    const V = S._ckiv; if (!V) return [];
    if (!V.puertas) {
      const a = area(S), refs = REFUGIOS[!S.currentInterior ? 'village' : V.z] || [];
      V.puertas = refs.map(([x, y]) => { const sp = S.add.image(a.x + x, a.y + y + 4, 'ckiv_chispa').setVisible(false); V.objs.push(sp); return { sprite: sp, down: false, hp: 1e9, _ckivPuerta: true, idle: '' }; });
    }
    return V.puertas;
  };

  // ------------------------------------------------------------------ la gente que huye
  const GENTE = ['npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc10', 'npc12', 'npc13', 'npc14', 'npc1a', 'npc2b', 'npc3a', 'npc4a', 'npc5a', 'npc6a', 'npc7a', 'npc10b'];
  const REFUGIOS = { village: [[400, 152], [160, 334], [480, 434], [588, 202]], 'ed_san_roque.main': [[585, 270], [705, 680], [490, 682]],
    'ed_campos_del_roble.main': [[606, 418]], 'ed_norte_del_roble.main': [[462, 622], [940, 640]] };
  const vecino = (S, x, y, base) => {
    const V = est(S), ids = GENTE.filter(id => S.textures.exists(id + '_villager'));
    const id = base || UNO(ids.length ? ids : ['npc1']);
    const tex = S.textures.exists(id + '_villager') ? id + '_villager' : id + '_idle';
    const sp = S.add.sprite(x, y, tex).setOrigin(0.5, 1).setScale(1.3).setDepth(y);
    if (S.anims.exists(id + '_idle')) sp.play(id + '_idle');
    const v = { _ckivVecino: true, sprite: sp, idle: id + '_idle', walk: id + '_walk', hp: 3, maxHp: 3, down: false, salvo: false, vel: R(40, 52), quieto: R(0, 2000), destino: null };
    V.gente.push(v); return v;
  };
  const libre = (S, x, y) => { try { return S.navIsFree ? S.navIsFree(x, y) : true; } catch (e) { return true; } };
  const moverVecino = (S, V, v, dt) => {
    const sp = v.sprite; if (!sp.active || v.salvo) return;
    if (v.down) {
      if (!v._tirado) { v._tirado = true; sp.setAngle(sp.flipX ? -84 : 84).setOrigin(0.5, 0.8); sp.anims.stop(); }
      v.pide = (v.pide || 0) - dt;
      if (v.pide <= 0 && window.CK_ESCENA) { v.pide = R(3500, 6000); window.CK_ESCENA.globo(S, sp, UNO(['¡Ayuda!', '¡Auxilio!', 'Mi pierna…']), 1400); }
      return;
    }
    const pnico = infierno(S.story) && !S._ckivCalma;
    if (pnico && v.susto > 0) { v.susto -= dt; if (!v.sustado) { v.sustado = true; sp.setFlipX(!sp.flipX); S.tweens.add({ targets: sp, y: sp.y - 5, duration: 110, yoyo: true }); } return; }
    // del demonio más cercano, se aleja; si no hay, va al refugio
    let dem = null, dd = pnico ? 190 : 0;
    if (pnico && S.enemies) S.enemies.getChildren().forEach(e => { if (esDemonio(e)) { const d = Math.hypot(e.x - sp.x, e.y - sp.y); if (d < dd) { dd = d; dem = e; } } });
    const a = area(S), refs = REFUGIOS[V.z === 'village' || !S.currentInterior ? 'village' : V.z] || [];
    let tx, ty;
    if (pnico) {
      // un refugio que no esté pegado (corren un trecho, y no todos al mismo)
      if (!v.refugio && refs.length) { const lejos = refs.filter(q => Math.hypot(a.x + q[0] - sp.x, a.y + q[1] - sp.y) > 120), r = UNO(lejos.length ? lejos : refs); v.refugio = [a.x + r[0], a.y + r[1]]; }
      if (!v.refugio) return;
      // con un demonio encima: un tirón para el otro lado (si se puede) antes de seguir al refugio
      if (dem && dd < 70 && !v.tiron) {
        const ax = sp.x - dem.x, ay = sp.y - dem.y, n = Math.hypot(ax, ay) || 1, px = sp.x + ax / n * 50, py = sp.y + ay / n * 50;
        if (libre(S, px, py)) v.tiron = [px, py];
      }
      const meta = v.tiron || v.refugio, st = v.nav || (v.nav = {}), vel0 = v.vel * (dem && dd < 110 ? 1.25 : 1);
      const x0 = sp.x, r = S.navFollow ? S.navFollow(st, sp, meta[0], meta[1], vel0, dt) : 'stuck';
      if (r === 'arrived' && v.tiron) { v.tiron = null; v.nav = {}; }
      else if (r === 'arrived') {
        v.salvo = true;
        S.tweens.add({ targets: sp, alpha: 0, duration: 350, onComplete: () => sp.destroy() });   // destruido: los demonios lo sueltan
        return;
      } else if (r === 'stuck') { v.tiron = null; v.refugio = null; v.nav = {}; }
      sp.setDepth(sp.y);
      if (Math.abs(sp.x - x0) > 0.05) sp.setFlipX(sp.x < x0);
      if (S.anims.exists(v.walk) && (!sp.anims.currentAnim || sp.anims.currentAnim.key !== v.walk)) sp.play(v.walk);
      sp.anims.timeScale = 1.6;
      if (!v.grito) { v.grito = true; if (window.CK_ESCENA && Math.random() < 0.6) window.CK_ESCENA.globo(S, sp, UNO(['¡Demonios!', '¡Corran!', '¡Socorro!', '¡¿Qué es eso?!']), 1300); }
      return;
    } else {
      // de paseo, antes de la corrupción
      v.quieto -= dt; if (v.quieto > 0) { if (sp.anims.currentAnim && sp.anims.currentAnim.key !== v.idle && S.anims.exists(v.idle)) sp.play(v.idle); return; }
      if (!v.destino || Math.hypot(v.destino[0] - sp.x, v.destino[1] - sp.y) < 4) { v.destino = [sp.x + R(-40, 40), sp.y + R(-24, 24)]; if (Math.random() < 0.5) v.quieto = R(800, 2500); }
      tx = v.destino[0]; ty = v.destino[1];
    }
    const dx = tx - sp.x, dy = ty - sp.y, n = Math.hypot(dx, dy);
    if (n < 1) return;
    const vel = (pnico ? v.vel : 22) * dt / 1000;
    let ux = dx / n, uy = dy / n, ok = false;
    for (const giro of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
      const c = Math.cos(giro), s = Math.sin(giro), rx = ux * c - uy * s, ry = ux * s + uy * c;
      if (libre(S, sp.x + rx * (vel + 6), sp.y + ry * (vel + 6))) { ux = rx; uy = ry; ok = true; break; }
    }
    if (!ok) { if (!pnico) v.destino = null; return; }
    sp.x += ux * vel; sp.y += uy * vel; sp.setDepth(sp.y); sp.setFlipX(ux < 0);
    if (S.anims.exists(v.walk) && (!sp.anims.currentAnim || sp.anims.currentAnim.key !== v.walk)) sp.play(v.walk);
    sp.anims.timeScale = pnico ? 1.6 : 1;
    if (pnico && !v.grito) { v.grito = true; if (window.CK_ESCENA && Math.random() < 0.6) window.CK_ESCENA.globo(S, sp, UNO(['¡Demonios!', '¡Corran!', '¡Socorro!', '¡¿Qué es eso?!']), 1300); }
  };

  // ------------------------------------------------------------------ la corrupción
  /** La tierra tiembla, el rojo entra de a golpes, se abren grietas y salen demonios, los techos se prenden. */
  const corromper = (S, o) => {
    o = o || {};
    texturas(S);
    const V = est(S), a = area(S), f = S.story.flags = S.story.flags || {};
    f.infierno = true;
    V.corrupcion = { t: 0, dur: o.dur || 7000 };
    S._c3CapaFija = 0;
    S.cameras.main.shake(1200, 0.006);
    sonar('thunder_epic', 0.55, { rate: 0.6 });
    // los techos: los arma ck_capitulo3.js; acá se esconden y se prenden de a uno
    if (!o.sinArmar && window.CK_CAPITULO3 && window.CK_CAPITULO3.armarInf) window.CK_CAPITULO3.armarInf(S);
    S.time.delayedCall(250, () => {
      const I = S._c3Inf;
      if (I) I.fuegos.forEach((s, i) => {
        const k = s.scaleX; s.setScale(0).setVisible(true);
        S.time.delayedCall(1800 + i * R(350, 650), () => {
          if (!s.active) return;
          S.tweens.add({ targets: s, scale: k, duration: 500, ease: 'Back.easeOut' });
          sonar('fire_hit', 0.35, { rate: R(0.7, 0.9) });
        });
      });
    });
    // las grietas, alrededor de la cámara
    const cam = S.cameras.main.worldView, n = o.sinGrietas ? 0 : (o.grietas || 6);
    for (let i = 0; i < n; i++) {
      let gx = 0, gy = 0, ok = false;
      for (let k = 0; k < 20 && !ok; k++) { gx = cam.x + R(60, cam.width - 60); gy = cam.y + R(70, cam.height - 50); ok = libre(S, gx, gy) && Math.hypot(gx - S.player.x, gy - S.player.y) > 70; }
      if (ok) S.time.delayedCall(1300 + i * R(450, 800), () => grieta(S, gx, gy, i === n - 1 ? 'demonio_bruto' : null));
    }
    V.proxMeteoro = S.time.now + 3200;
    // la gente del lugar deja lo que hacía y huye (los vecinos de la aldea, con su misma cara)
    // (en los mapas del Taller, los vecinos que andan por el mapa; en la aldea, los de siempre)
    const pc = !afuera(S) ? [] : !S.currentInterior ? (S.campaignNPCs || [])
      : ((S.currentInterior.area || {}).actors || []).filter(q => q && q.sprite && (!q.role || q.role === 'civil'));
    pc.forEach(n => {
      const sp = n.sprite; if (!sp || !sp.active || !sp.visible) return;
      const base = String(sp.texture.key).replace(/_(villager|idle|walk)$/, '');
      if (!S.textures.exists(base + '_villager') && !S.anims.exists(base + '_walk')) return;
      sp.setVisible(false); n._ckivOculto = true; n._c3Oculto = true;
      const v = vecino(S, sp.x, sp.y, base); v.quieto = R(200, 900); v.susto = R(300, 1200);
    });
  };

  /** El lugar quedó limpio: las grietas se enfrían, los cráteres dejan de brillar y la gente se calma. */
  const calmar = S => {
    const V = S._ckiv; if (!V) return;
    V.grietas.forEach(q => {
      if (q.gl && q.gl.active) { S.tweens.killTweensOf(q.gl); S.tweens.add({ targets: q.gl, alpha: 0, duration: 2500 }); }
      if (q.g && q.g.active) S.tweens.add({ targets: q.g, alpha: 0.35, duration: 2500, onUpdate: () => q.g.setTint(0x6a5a52) });
    });
    V.luces = V.luces.filter(l => !l.fija);
    V.llamas.forEach(L => { L.hasta = Math.min(L.hasta, S.time.now + 1500); });
  };

  // ------------------------------------------------------------------ cada cuadro
  const vivir = (S, dt) => {
    const V = est(S), now = S.time.now, inf = infierno(S.story);
    // la corrupción: el rojo entra de a golpes (cada golpe con un temblor)
    if (V.corrupcion) {
      const c = V.corrupcion; c.t += dt;
      const e = Math.min(1, c.t / c.dur), golpes = Math.floor(e * 5), pulso = Math.max(0, Math.sin(c.t / 180)) * 0.12;
      S._c3CapaFija = Math.min(1, Math.max(golpes / 5, e * e) + pulso);
      if (golpes !== c.g) { c.g = golpes; if (golpes > 0 && golpes < 5) { S.cameras.main.shake(300, 0.004); if (window.CK_LUZ && window.CK_LUZ.destello) window.CK_LUZ.destello([255, 40, 20], 0.35, 220); } }
      if (e >= 1) { V.corrupcion = null; S._c3CapaFija = undefined; if (S._c3Capa) S._c3Capa.k = 1; }
    }
    // el ambiente de la aldea en llamas desde el primer momento (ck_capitulo3.js lo pone recién en el rescate)
    const C3 = window.CK_CAPITULO3, caos = inf && (C3 && C3.enCaos ? (C3.enCaos(S) || !!V.corrupcion) : true);
    if (!C3 && inf && !S.currentInterior && typeof ambience !== 'undefined' && S._c3AmbAldea !== 'inf') { S._c3AmbAldea = 'inf'; ambience.set([['amb_aldea_noche', 0.3], ['amb_infierno', 0.14], ['amb_fire', 0.3]]); }
    if (caos && afuera(S)) {
      // meteoritos, como rayos
      if (now > V.proxMeteoro && !S.dialogOpen) {
        V.proxMeteoro = now + (V.corrupcion ? R(2200, 3600) : R(5500, 12000));
        const cam = S.cameras.main.worldView, p = S.player;
        let x, y, ok = false;
        for (let k = 0; k < 15 && !ok; k++) {
          if (Math.random() < 0.25) { x = p.x + R(-50, 50); y = p.y + R(-30, 40); } else { x = cam.x + R(50, cam.width - 50); y = cam.y + R(60, cam.height - 40); }
          ok = libre(S, x, y);
        }
        if (ok) meteoro(S, x, y);
      }
      // humo de cada techo que arde y de los cráteres
      const I = S._c3Inf;
      if (I) I.fuegos.forEach(s => { if (!s.active || !s.visible || s.scaleX < 0.2) return; s._humoT = (s._humoT || R(0, 300)) - dt; if (s._humoT <= 0) { s._humoT = R(240, 420); bocanada(S, V, s.x, s.y - s.displayHeight * 0.8, s.scaleX, true); } });
      // el fuego se propaga por cada techo (hasta 4 llamas por techo), cada vez más grande
      if (I && now > (V.proxProp || 0) && S.textures.exists(LLAMA())) {
        V.proxProp = now + R(700, 1300);
        const vivas = I.fuegos.filter(s => s.active && s.visible && s.scaleX > 0.3);
        const f = vivas.length && UNO(vivas);
        if (f && (f._hijas || 0) < 3 && I.fuegos.length < 60) {
          const nx = f.x + R(-22, 22), ny = f.y + R(-6, 6), base = f._base || f;
          const s = S.add.sprite(nx, ny, LLAMA()).setOrigin(0.5, 1).setScale(0).setDepth(f.depth + 0.001);
          s.play({ key: LLAMA(), startFrame: Math.floor(R(0, 7)) }); s.anims.timeScale = R(0.8, 1.15);
          s._base = base; base._hijas = (base._hijas || 0) + 1; f._hijas = (f._hijas || 0) + (f === base ? 0 : 1);
          S.tweens.add({ targets: s, scale: base.scaleX * R(0.7, 1.05), duration: 700, ease: 'Back.easeOut' });
          I.fuegos.push(s); I.objs.push(s);
          if (base.scaleX < 1.6) S.tweens.add({ targets: base, scale: base.scaleX * 1.12, duration: 900 });
          sonar('fire_hit', 0.18, { rate: R(0.6, 0.8), minGap: 400 });
        }
      }
      V.llamas = V.llamas.filter(L => {
        if (!L.s.active) return false;
        if (now > L.hasta) { S.tweens.add({ targets: L.s, scale: 0, alpha: 0, duration: 900, onComplete: () => L.s.destroy() }); return false; }
        L.humoT -= dt; if (L.humoT <= 0) { L.humoT = R(320, 520); bocanada(S, V, L.x, L.y - 14, 0.7, true); }
        return true;
      });
      // los demonios sin presa rompen lo que tengan cerca o van por la gente
      if (now > V.proxRompe && S.enemies) {
        V.proxRompe = now + R(350, 600);
        S.enemies.getChildren().forEach(e => {
          if (!esDemonio(e) || e.isAttacking) return;
          const p = S.player, dh = Math.hypot(p.x - e.x, p.y - e.y);
          if (e._c3guarda) return;   // (los que arrinconan un grupo de vecinos se quedan ahí)
          if (!e._target && dh > 200) apuntar(S, e);
          if (e._target || dh < 150) return;
          const cerca = (S._ckRomp || []).find(o => o && o.sp && o.sp.active && !o.roto && Math.hypot(o.sp.x - e.x, o.sp.y - e.y) < 46);
          if (cerca && window.CK_ROMPIBLES) {
            e.setFlipX(cerca.sp.x < e.x);
            if (S.anims.exists(e.type + '_attack1')) e.play(e.type + '_attack1', true);
            S.time.delayedCall(e.def ? e.def.hitAt : 250, () => { try { if (cerca.sp && cerca.sp.active) window.CK_ROMPIBLES.romper(S, cerca); } catch (er) {} });
          }
        });
      }
    }
    // la gente
    V.gente.forEach(v => moverVecino(S, V, v, dt));
    // partículas
    for (let i = V.parts.length - 1; i >= 0; i--) {
      const p = V.parts[i], s = p.s; p.t += dt;
      if (!s.active || p.t >= p.vida) { if (s.active) s.destroy(); V.parts.splice(i, 1); continue; }
      const e = p.t / p.vida;
      if (p.g) p.vy += p.g * dt / 1000;
      s.x += p.vx * dt / 1000; s.y += p.vy * dt / 1000;
      if (p.suelo !== undefined && s.y > p.suelo) { s.y = p.suelo; p.vy *= -0.3; p.vx *= 0.6; }
      if (p.e0 !== undefined) s.setScale(p.e0 + (p.e1 - p.e0) * Math.sqrt(e));
      if (p.giro) s.rotation += p.giro * dt / 1000;
      if (p.encoge) s.setScale(Math.max(0.2, s.scaleX * (1 - dt / 600)));
      if (p.c0) { const q = Math.min(1, e * 2.2); s.setTint(Phaser.Display.Color.GetColor(p.c0[0] + (p.c1[0] - p.c0[0]) * q | 0, p.c0[1] + (p.c1[1] - p.c0[1]) * q | 0, p.c0[2] + (p.c1[2] - p.c0[2]) * q | 0)); }
      s.setAlpha(p.a0 * (e < 0.1 ? e / 0.1 : 1 - (e - 0.1) / 0.9));
    }
  };

  // luces de los cráteres y las grietas
  if (window.CK_LUZ && window.CK_LUZ.fuente) window.CK_LUZ.fuente((S, out) => {
    const V = S._ckiv; if (!V || V.z !== zonaDe(S)) return;
    const now = S.time.now;
    V.luces = V.luces.filter(l => l.fija || now < l.hasta);
    V.luces.forEach(l => {
      if (l.sigue) { if (!l.o || !l.o.active) return; out.push({ x: l.o.x, y: l.o.y, c: l.c, r: l.r, f: l.f }); return; }
      const k = l.fija ? 0.85 + 0.15 * Math.sin(now / 240 + l.x) : Math.max(0, 1 - (now - l.desde) / (l.hasta - l.desde));
      out.push({ x: l.x, y: l.y, c: l.c, r: l.r, f: l.f * k });
    });
    V.llamas.forEach(L => { if (L.s.active) out.push({ x: L.s.x, y: L.s.y - 10, c: [255, 130, 50], r: 54, f: 0.9 }); });
  });

  // ------------------------------------------------------------------ enganches
  const nh0 = P.npcTakeHit;
  if (nh0) P.npcTakeHit = function (a, dmg, enemy) {
    if (a && a._ckivPuerta) {
      const V = this._ckiv, x = a.sprite.x, y = a.sprite.y - 8;
      sonar('ck_barricada_golpe', 0.4, { rate: R(0.9, 1.15), minGap: 150 });
      if (V) for (let i = 0; i < 6; i++) {
        const c = this.add.image(x + R(-6, 6), y + R(-6, 4), 'ckiv_chispa').setDepth(y + 20).setTint(UNO([0x6b4a2e, 0x8a6240, 0x4a321f])).setScale(R(1, 2));
        parte(V, c, { vx: R(-60, 60), vy: R(-90, -30), g: 260, vida: R(400, 700), a0: 1, suelo: y + 10 });
      }
      this.cameras.main.shake(80, 0.002);
      return;
    }
    if (a && a._ckivVecino) {
      if (a.down || !a.sprite.active) return;
      const sp = a.sprite;
      a.hp -= dmg; sp.setTint(0xff6a6a);
      this.time.delayedCall(140, () => { if (sp.active) sp.clearTint(); });
      sonar('sword_hit', 0.3, { minGap: 120, rate: 1.2 });
      const an = Math.atan2(sp.y - enemy.y, sp.x - enemy.x), bx = sp.x + Math.cos(an) * 10, by = sp.y + Math.sin(an) * 10;
      if (libre(this, bx, by)) sp.setPosition(bx, by);
      if (a.hp <= 0) { a.down = true; if (window.CK_ESCENA) window.CK_ESCENA.globo(this, sp, UNO(['¡Aaah!', '¡No!', '¡Ayuda!']), 1200); }
      return;
    }
    return nh0.apply(this, arguments);
  };
  const it0 = P.interact;
  P.interact = function () {
    try {
      const V = this._ckiv;
      if (V && !this.dialogOpen && !this._ckEscena) {
        const p = this.player, v = V.gente.find(q => q.down && q.sprite.active && Math.hypot(q.sprite.x - p.x, q.sprite.y - p.y) < 34);
        if (v) {
          v.down = false; v._tirado = false; v.hp = 2; v.refugio = null;
          v.sprite.setAngle(0).setOrigin(0.5, 1).clearTint();
          this.createFloatingText(v.sprite.x, v.sprite.y - 40, '¡Gracias!', 0x86efac);
          sonar('heal', 0.4, { rate: 1.3 });
          return;
        }
      }
    } catch (e) {}
    return it0.apply(this, arguments);
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode === 'campaign' && this.player && (infierno(this.story) || this._ckiv)) vivir(this, Math.min(100, delta || 16));
    } catch (e) { if (!P._ckivAv) { P._ckivAv = 1; console.warn('[infierno vivo]', e); } }
    return r;
  };
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    if (f0) P[k] = function () { const r = f0.apply(this, arguments); try { limpiar(this); } catch (e) {} return r; };
  });

  window.CK_INFIERNO_VIVO = { corromper, meteoro, grieta, vecino, texturas, est, calmar };
})();
