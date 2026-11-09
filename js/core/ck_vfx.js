'use strict';
/* Efectos de las habilidades y ultis (03/11, pedido del dueño: "que sea más visual todo: con PixelLab diseñá las
   habilidades, partículas, rayos, proyectiles, poderes; que las ultis sean más impactantes, con partículas y la cámara
   temblando si hace falta").
   - 32 efectos animados hechos en el taller de efectos de PixelLab (ck_vfx_arte.js): bola de fuego, lanza de hielo,
     misil arcano, explosión, rayo, chispa eléctrica, hielo que se rompe, garras de hielo, giro de espada, golpe al
     suelo, tajo cruzado, tajo veloz, onda de corte, crítico, golpe, sangre, humo, curar, haz de luz, carga de poder,
     círculo rúnico, pinchos de hielo y los estados (quemado, congelado, aturdido, sangrando, lento, marcado, escudo,
     aura de furia, mejora, aura del bosque).
   - Los proyectiles viejos (bola de fuego, lanza, esquirlas, onda, dagas, misiles, roca del meteoro) llevan el efecto
     animado encima y al pegar sueltan su impacto.
   - Cada golpe suelta su efecto según de dónde viene (fuego, hielo, trueno, arcano, garra, filo...); los golpes de
     3 o más son críticos: destello, frenada de 60 ms y temblor.
   - ULTIS (Lluvia de flechas, Danza de filos, Trueno cargado al máximo, Rugido, Meteoro, Tormenta y Avalancha):
     frenada del tiempo, acercamiento de cámara, destello del color del héroe, oscurecido de la pantalla, temblor
     fuerte y el retrato de la barra brilla (evento 'ck-ulti'). Valores de "game feel": frenada 0,05–0,15 s,
     temblor 8–10 px para los golpes fuertes, destello 50–100 ms.
   Borrar las 2 líneas de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_VFX_ARTE) return;
  const P = MainGameScene.prototype;
  const A = window.CK_VFX_ARTE.hojas;
  const R = (a, b) => a + Math.random() * (b - a);
  const HB = () => window.CK_HABILIDADES || {};
  const EQ = () => window.CK_EQUIPO || {};

  // ------------------------------------------------------------------ hojas → texturas y animaciones de Phaser
  const IMG = {};
  Object.keys(A).forEach(k => { const im = new Image(); im.src = A[k].src; IMG[k] = im; });
  const listo = (S, k) => {
    const key = 'ckfx_' + k, H = A[k];
    if (!H) return null;
    if (!S.textures.exists(key)) {
      const im = IMG[k]; if (!im || !im.complete || !im.naturalWidth) return null;
      S.textures.addSpriteSheet(key, im, { frameWidth: H.fw, frameHeight: H.fh, endFrame: H.n - 1 });
    }
    if (!S.anims.exists(key)) S.anims.create({ key, frames: S.anims.generateFrameNumbers(key, { start: 0, end: H.n - 1 }), frameRate: H.fps, repeat: H.loop ? -1 : 0 });
    return key;
  };

  /** Un efecto en (x, y). o: {escala, tinte, prof (profundidad), suma (luz), flip, giro, alfa, vel, sigue, dx, dy, fin} */
  const fx = (S, k, x, y, o) => {
    o = o || {};
    try {
      const key = listo(S, k); if (!key) return null;
      const H = A[k], s = S.add.sprite(x, y, key, 0);
      s.setOrigin(H.ax / H.fw, H.ay / H.fh).setScale((o.escala || 1) * (o.flip ? -1 : 1), o.escala || 1);
      s.setDepth(o.prof !== undefined ? o.prof : Math.round(y) + 30);
      if (o.tinte) s.setTint(o.tinte);
      if (o.suma) s.setBlendMode(Phaser.BlendModes.ADD);
      if (o.giro) s.setRotation(o.giro);
      if (o.alfa !== undefined) s.setAlpha(o.alfa);
      s.play({ key, frameRate: H.fps * (o.vel || 1), repeat: H.loop && !o.unaVez ? -1 : 0 });
      if (!H.loop || o.unaVez) s.on('animationcomplete', () => { if (o.fin) o.fin(); s.destroy(); });
      if (o.sigue) {
        const t = o.sigue, dx = o.dx || 0, dy = o.dy || 0;
        const upd = () => { if (!s.active) return S.events.off('postupdate', upd); if (!t.active) { s.destroy(); return S.events.off('postupdate', upd); } s.setPosition(t.x + dx, t.y + dy); if (o.prof === undefined) s.setDepth((t.depth || t.y) + (o.detras ? -1 : 2)); };
        S.events.on('postupdate', upd);
      }
      if (o.dura) S.time.delayedCall(o.dura, () => { if (!s.active) return; S.tweens.add({ targets: s, alpha: 0, duration: 200, onComplete: () => s.destroy() }); });
      return s;
    } catch (e) { return null; }
  };
  const luz = (x, y, c, r, ms) => { try { window.CK_LUZ && window.CK_LUZ.agregar({ x, y, c, r, f: 1, ms, curva: 'cae' }); } catch (e) {} };
  const pie = o => (o && o.body ? { x: o.body.center.x, y: o.body.bottom } : { x: o.x, y: o.y + 12 });
  const cabeza = o => ({ x: o.x, y: o.y - (o.displayHeight || 60) * 0.24 });
  const pecho = o => ({ x: o.x, y: o.y - (o.displayHeight || 60) * 0.06 });
  const dirDe = S => (HB().dirV ? HB().dirV(S) : [S.facingDirection === 'left' ? -1 : 1, 0]);

  // ------------------------------------------------------------------ frenada, temblor, destello, ulti
  let frenando = false;
  const frenar = (S, ms, k) => {
    if (frenando || !S.time) return; frenando = true;
    const t0 = S.time.timeScale, tw = S.tweens.timeScale, an = S.anims.globalTimeScale, w = S.physics && S.physics.world ? S.physics.world.timeScale : 1;
    const f = k || 0.15;
    S.time.timeScale = f; S.tweens.timeScale = f; S.anims.globalTimeScale = f; if (S.physics && S.physics.world) S.physics.world.timeScale = 1 / f;
    setTimeout(() => { try { S.time.timeScale = t0 || 1; S.tweens.timeScale = tw || 1; S.anims.globalTimeScale = an || 1; if (S.physics && S.physics.world) S.physics.world.timeScale = w || 1; } catch (e) {} frenando = false; }, ms);
  };
  const COLOR = { soldier: [255, 210, 90], swordsman: [255, 74, 122], wizard: [176, 108, 255], bear: [159, 224, 255] };
  const ulti = (S, h, x, y, fuerza) => {
    try {
      const c = COLOR[h || S.playerHero] || COLOR.soldier, cam = S.cameras.main, z0 = cam.zoom;
      fuerza = fuerza || 1;
      frenar(S, 150, 0.12);
      cam.flash(110, c[0], c[1], c[2], true);
      cam.shake(380 * fuerza, 0.011 * fuerza);
      if (!S._ckZoomUlti) {
        S._ckZoomUlti = true;
        S.tweens.add({ targets: cam, zoom: z0 * 1.07, duration: 140, ease: 'Quad.easeOut', yoyo: true, hold: 160, onComplete: () => { cam.setZoom(z0); S._ckZoomUlti = false; } });
      }
      // la pantalla se oscurece un instante alrededor del héroe
      const v = S.add.rectangle(cam.worldView.centerX, cam.worldView.centerY, cam.width * 2, cam.height * 2, 0x000000, 0.42).setScrollFactor(0).setDepth(24000);
      S.tweens.add({ targets: v, alpha: 0, duration: 520, delay: 120, onComplete: () => v.destroy() });
      if (x !== undefined) { fx(S, 'carga', x, y - 18, { escala: 1.6, tinte: Phaser.Display.Color.GetColor(c[0], c[1], c[2]), suma: true, vel: 1.6 }); luz(x, y, c, 260, 600); }
      window.dispatchEvent(new CustomEvent('ck-ulti', { detail: { h: h || S.playerHero } }));
      VFX.ultimaUlti = { h: h || S.playerHero, t: S.time.now };
    } catch (e) {}
  };

  // ------------------------------------------------------------------ impactos según el golpe
  const TIN = { soldier: 0xe8f0ff, swordsman: 0xff7aa0, wizard: 0xc89cff, bear: 0xbfe6ff };
  const IMPACTO = {
    fuego: (S, x, y, e) => { fx(S, 'fuego_explosion', x, y, { escala: 0.42, suma: false }); luz(x, y, [255, 150, 60], 90, 220); },
    hielo: (S, x, y) => fx(S, 'hielo_roto', x, y, { escala: 0.6 }),
    trueno: (S, x, y, e) => { const f = pie(e); fx(S, 'rayo', f.x, f.y, { escala: 0.55 }); fx(S, 'chispa_rayo', x, y, { escala: 0.8, suma: true }); },
    rayo: (S, x, y) => fx(S, 'chispa_rayo', x, y, { escala: 0.8, suma: true }),
    nova: (S, x, y) => fx(S, 'golpe', x, y, { escala: 1.1, tinte: 0xc89cff, suma: true }),
    flecha: (S, x, y) => fx(S, 'golpe', x, y, { escala: 0.9, tinte: 0xffe08a }),
    daga: (S, x, y) => { fx(S, 'golpe', x, y, { escala: 0.8, tinte: 0xff9ab8 }); fx(S, 'sangre', x, y, { escala: 0.6 }); },
    onda: (S, x, y) => fx(S, 'tajo_x', x, y, { escala: 0.7, tinte: 0xdde8ff }),
    paso: (S, x, y) => { fx(S, 'tajo_x', x, y, { escala: 0.9 }); fx(S, 'sangre', x, y, { escala: 0.8 }); },
    embestida: (S, x, y) => fx(S, 'critico', x, y, { escala: 0.9, tinte: 0xdde8ff }),
    garra: (S, x, y, e, h) => { fx(S, 'garras', x, y, { escala: 0.9, flip: Math.random() < 0.5 }); fx(S, 'sangre', x, y, { escala: 0.7 }); },
    filo: (S, x, y, e, h) => { fx(S, 'golpe', x, y, { escala: 0.9, tinte: TIN[h] || 0xffffff }); if (h === 'swordsman') fx(S, 'sangre', x, y, { escala: 0.6 }); }
  };
  const fuenteDe = (S, f) => {
    if (f === 'fuego' || f === 'hielo' || f === 'trueno' || f === 'nova' || f === 'flecha' || f === 'daga' || f === 'onda' || f === 'paso' || f === 'embestida') return f;
    if (f === 'rayo') return 'rayo';
    if (S.playerHero === 'bear') return 'garra';
    if (S.playerHero === 'wizard' && !f) return 'nova';
    return 'filo';
  };
  const ultGolpe = new WeakMap();
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, x, y) {
    const vivo = enemy && enemy.active && !enemy.isDead;
    const r = de0.apply(this, arguments);
    try {
      if (vivo && amount > 0 && this.player) {
        const now = this.time.now;
        if (now - (ultGolpe.get(enemy) || 0) > 70) {
          ultGolpe.set(enemy, now);
          const c = pecho(enemy), f = fuenteDe(this, this._ckFuente);
          (IMPACTO[f] || IMPACTO.filo)(this, c.x + R(-4, 4), c.y + R(-4, 4), enemy, this.playerHero);
          if (amount >= 3) { fx(this, 'critico', c.x, c.y, { escala: 1.3, suma: true }); frenar(this, 60, 0.2); this.cameras.main.shake(120, 0.007); }
        }
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ proyectiles con su efecto animado encima
  // textura vieja → [efecto, escala, impacto al morir]
  const PROY = {
    wizard_fireball: ['fuego_bola', 0.55, 'fuego'], ck_lanza_hielo: ['hielo_lanza', 0.6, 'hielo'], ck_esquirla: ['hielo_lanza', 0.32, 'hielo'],
    ck_misil: ['arcano_misil', 0.55, 'nova'], ck_roca: ['fuego_bola', 1.1, null], ck_onda: ['onda', 0.5, null]
  };
  const vestir = (S, o, key) => {
    const D = PROY[key]; if (!D || !o || o._ckFx) return;
    o._ckFx = true;
    if (key === 'ck_onda') {                    // la onda de corte: el efecto viaja solo, la textura vieja se apaga
      o.setAlpha(0.15);
      const v = o.body ? o.body.velocity : { x: 1, y: 0 };
      fx(S, 'onda', o.x, o.y, { escala: 0.55, giro: Math.atan2(v.y, v.x), sigue: o, prof: 30001 });
      return;
    }
    o.setAlpha(0.01);
    const s = fx(S, D[0], o.x, o.y, { escala: D[1], prof: 30001 });
    if (!s) { o.setAlpha(1); return; }
    const upd = () => {
      if (!s.active) return S.events.off('postupdate', upd);
      if (!o.active) {
        S.events.off('postupdate', upd); s.destroy();
        if (D[2] && IMPACTO[D[2]]) IMPACTO[D[2]](S, o.x, o.y, o, S.playerHero);
        return;
      }
      const v = o.body ? o.body.velocity : null;
      s.setPosition(o.x, o.y);
      if (v && (v.x || v.y)) s.setRotation(Math.atan2(v.y, v.x)); else s.setRotation(o.rotation || 0);
    };
    S.events.on('postupdate', upd);
  };
  const engancharGrupo = S => {
    if (!S.projectiles || S.projectiles._ckFx) return;
    S.projectiles._ckFx = true;
    const c0 = S.projectiles.create.bind(S.projectiles);
    S.projectiles.create = function (x, y, key) { const o = c0.apply(null, arguments); try { vestir(S, o, key); } catch (e) {} return o; };
  };
  // misiles arcanos y la roca del meteoro son imágenes sueltas
  const img0 = Phaser.GameObjects.GameObjectFactory.prototype.image;
  Phaser.GameObjects.GameObjectFactory.prototype.image = function (x, y, key) {
    const o = img0.apply(this, arguments);
    try { if ((key === 'ck_misil' || key === 'ck_roca') && this.scene && this.scene.startCampaign) { const S = this.scene; S.time.delayedCall(0, () => vestir(S, o, key)); } } catch (e) {}
    return o;
  };

  // ------------------------------------------------------------------ habilidades: el efecto de cada una
  const ANTES = {}, DESPUES = {};
  const p0 = S => S.player;
  Object.assign(DESPUES, {
    // ---- Lancent
    b_torbellino: S => { const f = pie(p0(S)); fx(S, 'giro', f.x, f.y - 14, { escala: 1.15 }); fx(S, 'giro', f.x, f.y - 14, { escala: 1.3, alfa: 0.6, vel: 0.8 }); },
    onda: S => {},
    grito: S => { const f = pie(p0(S)); fx(S, 'haz', f.x, f.y, { escala: 0.9, alfa: 0.85 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'luz', f.x, f.y, 95, 420); },
    cargado: S => { const p = p0(S), [dx] = dirDe(S); fx(S, 'carga', p.x + dx * 16, p.y - 4, { escala: 0.8, tinte: 0xffd25a, suma: true, vel: 1.4 }); },
    salto: S => S.time.delayedCall(390, () => { const f = pie(p0(S)); fx(S, 'suelo', f.x, f.y, { escala: 0.75, prof: Math.round(f.y) - 6 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'tierra', f.x, f.y, 90, 360); }),
    golpe_escudo: S => S.time.delayedCall(140, () => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'critico', p.x + dx * 30, p.y + 6 + dy * 24, { escala: 1.1, tinte: 0xbfdbfe, suma: true }); }),
    explosiva: S => {},
    // ---- Aby
    b_pirueta: S => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'humo', p.x, p.y + 6, { escala: 0.6, tinte: 0xffc0d0 }); fx(S, 'tajo_veloz', p.x + dx * 40, p.y + dy * 32, { escala: 0.7, tinte: 0xff9ab8, giro: Math.atan2(dy, dx) }); },
    remolino: S => { for (let i = 0; i < 5; i++) S.time.delayedCall(i * 300, () => { const f = pie(p0(S)); fx(S, 'giro', f.x, f.y - 12, { escala: 0.95, tinte: 0xff9ab8 }); }); },
    paso: S => { const p = p0(S); fx(S, 'humo', p.x, p.y + 4, { escala: 0.75 }); },
    tajo: S => S.time.delayedCall(90, () => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'tajo_x', p.x + dx * 30, p.y + 4 + dy * 24, { escala: 1.1 }); }),
    relampago: S => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'tajo_veloz', p.x + dx * 65, p.y + dy * 52, { escala: 1, tinte: 0x9fd8ff, giro: Math.atan2(dy, dx), suma: true }); S.time.delayedCall(150, () => { const f = pie(p0(S)); fx(S, 'chispa_rayo', f.x, f.y - 10, { escala: 1.2, suma: true }); }); },
    marca: S => {},
    // ---- Horos
    anillo: S => { const p = p0(S); fx(S, 'runas', 0, 0, { escala: 0.95, tinte: 0xff9a4a, alfa: 0.55, suma: true, sigue: p, dy: 10, dura: 2900, detras: true }); },
    ventisca: S => { const p = p0(S); fx(S, 'runas', 0, 0, { escala: 1.4, tinte: 0x9fd8ff, alfa: 0.4, suma: true, sigue: p, dy: 10, dura: 3900, detras: true }); for (let i = 0; i < 8; i++) S.time.delayedCall(i * 450, () => { const q = p0(S); fx(S, 'hielo_roto', q.x + R(-90, 90), q.y + R(-50, 60), { escala: 0.5, alfa: 0.8 }); }); },
    prision: S => { const p = p0(S), f = pie(p); fx(S, 'hielo_roto', p.x, p.y, { escala: 1.6 }); S.time.delayedCall(200, () => S.enemies.getChildren().forEach(e => { if (!e.active || e.isDead || Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) > 125) return; const g = pie(e); fx(S, 'pinchos', g.x, g.y + 2, { escala: 0.8 }); })); },
    nova: S => { const p = p0(S); fx(S, 'hielo_roto', p.x, p.y, { escala: 1.5, tinte: 0xd8ccff, suma: true }); fx(S, 'runas', p.x, pie(p).y, { escala: 1.1, alfa: 0.6, suma: true, unaVez: true, vel: 2 }); },
    lanza: S => { const p = p0(S); fx(S, 'carga', p.x, p.y - 6, { escala: 0.6, tinte: 0x9fd8ff, suma: true, vel: 2 }); },
    triple_fuego: S => { const p = p0(S); fx(S, 'carga', p.x, p.y - 6, { escala: 0.7, tinte: 0xffa04a, suma: true, vel: 2 }); },
    misiles: S => { const p = p0(S); fx(S, 'runas', p.x, pie(p).y, { escala: 0.7, alfa: 0.6, suma: true, unaVez: true, vel: 2 }); },
    escudo_arcano: S => { const p = p0(S); fx(S, 'carga', p.x, p.y - 4, { escala: 0.9, tinte: 0xd8a0ff, suma: true, vel: 2 }); },
    drenaje: S => S.time.delayedCall(450, () => { const p = p0(S); fx(S, 'curar', p.x, p.y + 10, { escala: 1.1 }); }),
    b_escarcha: S => {},
    meteoro: S => { const p = p0(S), [dx, dy] = dirDe(S), tx = p.x + dx * 110, ty = p.y + 12 + dy * 90; fx(S, 'runas', tx, ty, { escala: 0.8, tinte: 0xff6a2a, alfa: 0.7, suma: true, dura: 600, prof: Math.round(ty) - 8 }); S.time.delayedCall(650, () => { fx(S, 'fuego_explosion', tx, ty - 10, { escala: 1.2 }); fx(S, 'suelo', tx, ty, { escala: 0.9, prof: Math.round(ty) - 6 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'fuego', tx, ty, 90, 450); window.CK_ONDAS && CK_ONDAS.estallido(S, 'tierra', tx, ty, 70, 400); ulti(S, 'wizard', tx, ty, 0.8); }); },
    tormenta: S => { const p = p0(S); ulti(S, 'wizard', p.x, pie(p).y, 0.8); fx(S, 'runas', 0, 0, { escala: 1.6, tinte: 0x9fd8ff, alfa: 0.35, suma: true, sigue: p, dy: 10, dura: 3000, detras: true }); },
    // ---- Urso
    b_rugido: S => { const p = p0(S), f = pie(p); ulti(S, 'bear', p.x, f.y, 1); window.CK_ONDAS && CK_ONDAS.estallido(S, 'hielo', f.x, f.y, 120, 450); window.CK_ONDAS && CK_ONDAS.estallido(S, 'acero', f.x, f.y, 90, 350); fx(S, 'hielo_roto', p.x, p.y - 8, { escala: 1.8, alfa: 0.8 }); },
    b_remolino: S => { for (let i = 0; i < 3; i++) S.time.delayedCall(i * 260, () => { const f = pie(p0(S)); fx(S, 'giro', f.x, f.y - 14, { escala: 1.1, tinte: 0xcfeeff }); fx(S, 'garras', f.x + R(-20, 20), f.y - 18, { escala: 0.8, flip: i % 2 === 1 }); }); },
    frenesi: S => { const p = p0(S); fx(S, 'carga', p.x, p.y - 6, { escala: 1, tinte: 0xff6a2a, suma: true, vel: 2 }); },
    desgarro: S => S.time.delayedCall(120, () => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'garras', p.x + dx * 30, p.y + dy * 24 - 4, { escala: 1.4, flip: dx < 0 }); fx(S, 'sangre', p.x + dx * 34, p.y + dy * 24, { escala: 1 }); }),
    pisoton: S => S.time.delayedCall(260, () => { const f = pie(p0(S)); fx(S, 'suelo', f.x, f.y, { escala: 1.05, prof: Math.round(f.y) - 6 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'tierra', f.x, f.y, 100, 420); S.cameras.main.shake(200, 0.01); }),
    avalancha: S => { const p = p0(S), [dx, dy] = dirDe(S); ulti(S, 'bear', p.x, pie(p).y, 1.1); for (let i = 1; i <= 5; i++) S.time.delayedCall(120 + i * 110, () => { const q = p0(S), x = q.x + dx * i * 34, y = pie(q).y + dy * i * 28; fx(S, 'pinchos', x, y + 4, { escala: 0.9 + i * 0.08 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'hielo', x, y, 30 + i * 6, 300); if (i === 5) fx(S, 'suelo', x, y, { escala: 0.9, prof: Math.round(y) - 6 }); }); },
    mordisco: S => S.time.delayedCall(150, () => { const p = p0(S), [dx, dy] = dirDe(S); fx(S, 'critico', p.x + dx * 26, p.y + dy * 20, { escala: 1, tinte: 0xff6a6a }); fx(S, 'sangre', p.x + dx * 28, p.y + dy * 20, { escala: 1.1 }); }),
    espiritu: S => { const p = p0(S); fx(S, 'haz', pie(p).x, pie(p).y, { escala: 0.8, tinte: 0x7dff9a }); },
    hibernar: S => S.time.delayedCall(2000, () => { const p = p0(S); fx(S, 'curar', p.x, p.y + 10, { escala: 1.3 }); })
  });
  // envolver HACER (habilidades del árbol) y las bases (las que se hacen con usarRanura)
  const envolverHacer = () => {
    const H = HB().HACER, E = EQ();
    [[H, 'HACER'], [E && E.hacerBase, 'BASE']].forEach(([T]) => {
      if (!T) return;
      Object.keys(DESPUES).forEach(id => {
        const f0 = T[id]; if (!f0 || f0._ckFx) return;
        const f = function (S) { const r = f0.apply(this, arguments); try { if (r !== -1 && S && S.player) DESPUES[id](S); } catch (e) { console.warn('[vfx]', id, e); } return r; };
        Object.keys(f0).forEach(k => (f[k] = f0[k])); f._ckFx = true; T[id] = f;
      });
    });
  };
  // las bases del juego viejo: lluvia, danza, torbellino, trueno
  const envolver = (n, antes, despues) => { const f0 = P[n]; if (!f0) return; P[n] = function () { let ok; try { ok = antes ? antes.apply(this, arguments) : true; } catch (e) {} const r = f0.apply(this, arguments); try { if (despues) despues.call(this, ok, arguments); } catch (e) { console.warn('[vfx]', n, e); } return r; }; };
  envolver('performArrowRain', function () { return this.lastRainTime; }, function (antes) {
    if (this.lastRainTime === antes || this.playerHero !== 'soldier') return;
    const S = this, f = pie(S.player);
    S.time.delayedCall(450, () => { fx(S, 'haz', f.x, f.y, { escala: 0.75, tinte: 0xffe08a }); });
    S.time.delayedCall(900, () => { ulti(S, 'soldier', f.x, f.y, 1); fx(S, 'runas', f.x, f.y, { escala: 0.9, tinte: 0xffd25a, alfa: 0.55, suma: true, dura: 900, prof: Math.round(f.y) - 8 }); });
    for (let i = 0; i < 10; i++) S.time.delayedCall(1150 + i * 70, () => fx(S, 'golpe', f.x + R(-58, 58), f.y + R(-40, 40), { escala: 0.8, tinte: 0xffe08a }));
    S.time.delayedCall(1900, () => { fx(S, 'suelo', f.x, f.y, { escala: 0.9, prof: Math.round(f.y) - 6 }); window.CK_ONDAS && CK_ONDAS.estallido(S, 'tierra', f.x, f.y, 70, 380); });
  });
  envolver('performBladeDance', function () { return this.lastSpinTime; }, function (antes) {
    if (this.lastSpinTime === antes) return;
    const S = this, p = S.player;
    ulti(S, 'swordsman', p.x, pie(p).y, 0.9);
    for (let i = 0; i < 5; i++) S.time.delayedCall(i * 160, () => { const f = pie(p); fx(S, 'giro', f.x, f.y - 14, { escala: 1 + i * 0.08, tinte: 0xff7aa0, alfa: 0.9 }); const e = S.enemies.getChildren().filter(o => o.active && !o.isDead && Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < 90); if (e.length) { const o = e[Math.floor(Math.random() * e.length)]; fx(S, 'tajo_x', o.x, pecho(o).y, { escala: 1 }); } });
  });
  envolver('performSpin', function () { return this.lastSpinTime; }, function (antes) {
    if (this.lastSpinTime === antes || this.playerHero !== 'soldier') return;
    DESPUES.b_torbellino(this);
  });
  envolver('thunderStrike', null, function (ok, args) {
    const S = this, p = S.player, lv = args[0] || 1, f = pie(p), info = S.thunderLevelInfo ? S.thunderLevelInfo(lv) : { radius: 60 };
    fx(S, 'rayo', f.x, f.y, { escala: 0.7 + lv * 0.25, suma: true });
    window.CK_ONDAS && CK_ONDAS.estallido(S, 'trueno', f.x, f.y, info.radius || 60, 380);
    if (lv >= 3) { ulti(S, 'wizard', f.x, f.y, 1.2); for (let i = 0; i < 3; i++) S.time.delayedCall(90 + i * 120, () => fx(S, 'rayo', f.x + R(-info.radius, info.radius) * 0.8, f.y + R(-info.radius, info.radius) * 0.5, { escala: 0.8, suma: true })); }
  });
  // el Trueno de base va por usarRanura → performThunder: lo de arriba ya lo cubre

  // al arrancar la escena: proyectiles y envolturas
  ['startCampaign', 'startPractice'].forEach(fn => { const f0 = P[fn]; if (!f0) return; P[fn] = function () { const r = f0.apply(this, arguments); try { engancharGrupo(this); envolverHacer(); } catch (e) {} return r; }; });
  const up0 = P.update;
  P.update = function () { const r = up0.apply(this, arguments); try { if (this.projectiles && !this.projectiles._ckFx) engancharGrupo(this); if (!VFX._env) { VFX._env = 1; envolverHacer(); } } catch (e) {} return r; };

  const VFX = window.CK_VFX = { fx, ulti, frenar, listo, pie, cabeza, pecho, A, IMPACTO, DESPUES };
})();
