'use strict';
/* Habilidades épicas (24/10): los efectos crecen con el árbol de habilidades (H).
   - Cada punto puesto en una rama suma partículas a sus golpes, estelas a sus proyectiles y brillo a sus habilidades.
   - Estados nuevos sobre las bestias:
       QUEMADURA  (fuego del mago con Llama viva, flecha explosiva): arde y pierde 1 de vida por segundo.
       CONGELADA  (hielo con Toque helado, Lanza de hielo): queda quieta dentro de un bloque de hielo; el siguiente golpe
                  rompe el hielo y hace +1. Después de descongelarse no se la puede volver a congelar por 2,5 s.
       ATURDIDA   (trueno con Carga rápida, Nova, Grito de guerra, Paso de sombra, Embestida): estrellitas y quieta un momento.
       SANGRADO   (críticos de Aby): gotas rojas mientras le hace efecto la Herida abierta.
     El jefe no se congela ni se aturde (sólo se frena) y la quemadura le dura menos.
   - Las descripciones del árbol dicen qué estado causa cada nodo.
   Todo dibujado por código, en píxeles, con dos capas (una que suma luz y otra normal). Sacar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_HABILIDADES) return;
  const P = MainGameScene.prototype;
  const HB = window.CK_HABILIDADES;
  const R = (a, b) => a + Math.random() * (b - a);
  const RI = (a, b) => Math.floor(R(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const enCampana = S => (HB.activo ? HB.activo(S) : S._gameMode === 'campaign') && !!HB.ARBOL[S.playerHero];   // campaña o práctica
  const rg = (S, id) => (enCampana(S) ? HB.rg(S, id) : 0);
  // puntos puestos en una rama del héroe actual: la "potencia" visual de esa rama
  const pts = (S, rama) => { try { return enCampana(S) && rama ? HB.gastados(S, S.playerHero, rama) : 0; } catch (e) { return 0; } };
  const kRama = (S, rama) => 1 + 0.25 * pts(S, rama);

  // ================================================================== partículas (una capa que suma luz y una normal)
  const PART = [];
  const MAX = 460;
  let capaA = null, capaN = null;
  const capas = S => {
    if (!capaA || !capaA.scene || capaA.scene !== S || !capaA.active) {
      capaN = S.add.graphics().setDepth(24990);
      capaA = S.add.graphics().setDepth(24991).setBlendMode(Phaser.BlendModes.ADD);
    }
  };
  const part = o => {
    if (PART.length >= MAX) PART.splice(0, PART.length - MAX + 1);
    PART.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, fr: 0, t: 0, vida: 500, c: 0xffffff, c2: null, s: 2, a: 1, add: true, enc: 0 }, o));
  };
  const mezcla = (c1, c2, e) => {
    const r = (c1 >> 16) & 255, g = (c1 >> 8) & 255, b = c1 & 255;
    return (Math.round(r + (((c2 >> 16) & 255) - r) * e) << 16) | (Math.round(g + (((c2 >> 8) & 255) - g) * e) << 8) | Math.round(b + ((c2 & 255) - b) * e);
  };
  const moverParticulas = dt => {
    const k = dt / 1000;
    for (let i = PART.length - 1; i >= 0; i--) {
      const p = PART[i];
      p.t += dt;
      if (p.t >= p.vida) { PART.splice(i, 1); continue; }
      if (p.fr) { const f = Math.pow(1 - p.fr, dt / 16); p.vx *= f; p.vy *= f; }
      p.vy += p.g * k;
      p.x += p.vx * k; p.y += p.vy * k;
    }
  };
  const dibujarParticulas = () => {
    capaA.clear(); capaN.clear();
    for (let i = 0; i < PART.length; i++) {
      const p = PART[i], e = p.t / p.vida;
      const s = Math.max(1, Math.round(p.s * (1 - p.enc * e)));
      const g = p.add ? capaA : capaN;
      g.fillStyle(p.c2 !== null ? mezcla(p.c, p.c2, e) : p.c, p.a * (1 - e * e));
      g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
  };
  // ráfaga de chispas: n partículas que salen de (x, y)
  const chispas = (x, y, n, cols, o = {}) => {
    const ang = o.ang, ab = o.abre === undefined ? Math.PI * 2 : o.abre;
    for (let i = 0; i < n; i++) {
      const a = ang === undefined ? Math.random() * Math.PI * 2 : ang + R(-ab / 2, ab / 2);
      const v = R(o.v0 || 50, o.v1 || 150);
      part({ x: x + R(-(o.dx || 0), o.dx || 0), y: y + R(-(o.dy || 0), o.dy || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.sube || 0),
        g: o.g || 0, fr: o.fr === undefined ? 0.06 : o.fr, vida: R(o.t0 || 220, o.t1 || 480), c: pick(cols), c2: o.c2 === undefined ? null : o.c2,
        s: o.s ? pick([].concat(o.s)) : RI(1, 2), add: o.add !== false, enc: o.enc || 0, a: o.a || 1 });
    }
  };
  // aro de partículas que se abre
  const aro = (x, y, r, n, cols, v, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R(-0.05, 0.05);
      part({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * (o.plano || 0.6), vx: Math.cos(a) * v, vy: Math.sin(a) * v * (o.plano || 0.6),
        fr: o.fr === undefined ? 0.05 : o.fr, vida: R(o.t0 || 280, o.t1 || 460), c: pick(cols), s: o.s || 2, add: o.add !== false, g: o.g || 0 });
    }
  };
  const luz = (x, y, c, r, f, ms) => { try { window.CK_LUZ && window.CK_LUZ.agregar({ x, y, c, r, f, ms, curva: 'cae' }); } catch (e) {} };
  const sonar = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  const COL = {
    fuego: [0xffe08a, 0xffb03d, 0xff6a1a, 0xff3d10], hielo: [0xffffff, 0xdff4ff, 0xa8dcff, 0x6fc3ff], trueno: [0xffffff, 0xe0f2fe, 0xbfe0ff, 0x9ecbff],
    nova: [0xffffff, 0xe9ddff, 0xc4b5fd, 0x9b7bff], flecha: [0xffffff, 0xe5e7eb, 0xfde68a], oro: [0xfff4c2, 0xffd27a, 0xffb84d],
    rosa: [0xffffff, 0xffd5dc, 0xfda4af, 0xfb7185], plata: [0xffffff, 0xe5e7eb, 0xcbd5e1], sombra: [0xc4b5fd, 0x8b6fd6, 0x4c3a8a],
    acero: [0xffffff, 0xfff1c1, 0xdde3ea], sangre: [0xe11d48, 0xb3122f, 0x8a0f24], humo: [0x5b5560, 0x6e6870, 0x4a454f], tierra: [0x8a6a44, 0x6e5434, 0xa88a5e]
  };
  const RAMA = {
    soldier: { flecha: 'arco', golpe: 'espada', pesado: 'espada', giro: 'espada', onda: 'espada', embestida: 'espada', parada: 'guardia' },
    swordsman: { danza: 'danza', estocada: 'danza', remolino: 'danza', golpe: 'danza', pesado: 'danza', daga: 'filo', herida: 'filo', paso: 'sombra', parada: 'sombra', embestida: 'sombra' },
    wizard: { fuego: 'fuego', hielo: 'hielo', trueno: 'tormenta', nova: 'tormenta' }
  };
  const colGolpe = f => /fuego|quema/.test(f) ? COL.fuego : f === 'hielo' ? COL.hielo : f === 'trueno' ? COL.trueno : f === 'nova' ? COL.nova
    : f === 'flecha' ? COL.flecha : /danza|estocada|remolino/.test(f) ? COL.rosa : /daga|herida/.test(f) ? COL.plata : f === 'paso' ? COL.sombra : COL.acero;

  // ================================================================== estados
  const ahora = S => S.time.now;
  const esJefe = e => !!(e.def && e.def.boss);
  const pie = e => { const b = e.body; return b ? [b.center.x, b.bottom] : [e.x, e.y + 12]; };
  const alto = e => 30 * ((e.scaleY || 1.2) / 1.2);

  const quemar = (S, e, ms) => {
    if (!e || !e.active || e.isDead) return;
    const now = ahora(S);
    if (esJefe(e)) ms *= 0.6;
    if ((e._ckHielo || 0) > now) { descongelar(S, e, false); vapor(S, e); }
    const nuevo = !e._ckFuego || e._ckFuego.hasta < now;
    e._ckFuego = { hasta: Math.max(now + ms, e._ckFuego && e._ckFuego.hasta || 0), prox: nuevo ? now + 1000 : e._ckFuego.prox };
    if (nuevo) {
      const [x, y] = pie(e);
      chispas(x, y - 12, 10, COL.fuego, { v0: 30, v1: 90, sube: 40, t0: 250, t1: 500, s: [2, 3] });
      sonar('fire_hit', 0.4, { rate: 1.35, minGap: 200 });
    }
  };
  const vapor = (S, e) => { const [x, y] = pie(e); chispas(x, y - 14, 12, [0xe5eef5, 0xc9d6e0, 0xffffff], { v0: 10, v1: 40, sube: 30, t0: 400, t1: 800, s: [2, 3], add: false, a: 0.6 }); sonar('fire_hit', 0.3, { rate: 0.6, minGap: 200 }); };

  const congelar = (S, e, ms) => {
    if (!e || !e.active || e.isDead) return;
    const now = ahora(S);
    if (esJefe(e) || now < (e._ckInmuneHielo || 0)) { e._ckLento = Math.max(e._ckLento || 0, now + 2000); e._ckLentoK = Math.min(e._ckLentoK || 1, 0.55); return; }
    if (e._ckFuego && e._ckFuego.hasta > now) { e._ckFuego = null; vapor(S, e); }
    const ya = (e._ckHielo || 0) > now;
    e._ckHielo = Math.max(e._ckHielo || 0, now + ms);
    e._ckInmuneHielo = e._ckHielo + 2500;
    detener(e);
    if (e.anims && e.anims.isPlaying) e.anims.pause();
    if (!ya) {
      const [x, y] = pie(e);
      chispas(x, y - alto(e) / 2, 16, COL.hielo, { v0: 40, v1: 120, t0: 250, t1: 450, dx: 8, dy: 10, s: [1, 2, 3] });
      luz(x, y - 14, [150, 210, 255], 70, 0.8, 300);
      sonar('ice_cast', 0.5, { rate: 1.45, minGap: 150 });
      try { S.createFloatingText(e.x, e.y - 40, '¡CONGELADO!', 0x9fe6ff); } catch (er) {}
    }
  };
  const descongelar = (S, e, rompe) => {
    e._ckHielo = 0;
    if (e.anims && e.anims.isPaused) e.anims.resume();
    if (e.active && !e.isDead) {
      if ((e._ckLento || 0) > ahora(S)) e.setTint(0xa8dcff); else e.clearTint();
      e.attackCooldown = Math.max(e.attackCooldown || 0, ahora(S) + 450);
    }
    const [x, y] = pie(e), h = alto(e);
    if (rompe) {
      chispas(x, y - h / 2, 22, COL.hielo, { v0: 70, v1: 190, g: 260, fr: 0.03, t0: 350, t1: 650, dx: 10, dy: 12, s: [2, 3], add: false });
      chispas(x, y - h / 2, 10, [0xffffff], { v0: 40, v1: 100, t0: 160, t1: 260 });
      luz(x, y - 14, [190, 230, 255], 90, 1, 220);
      sonar('ice_cast', 0.6, { rate: 1.9, minGap: 120 });
    } else chispas(x, y - h / 2, 8, COL.hielo, { v0: 20, v1: 60, g: 120, t0: 300, t1: 500, add: false });
  };
  const aturdir = (S, e, ms) => {
    if (!e || !e.active || e.isDead || esJefe(e)) return;
    const now = ahora(S);
    const ya = (e._ckAturdido || 0) > now;
    e._ckAturdido = Math.max(e._ckAturdido || 0, now + ms);
    detener(e);
    if (!ya) {
      const k = `${e.type}_idle`;
      if (S.anims.exists(k) && (e._ckHielo || 0) <= now) e.play(k, true);
      const [x, y] = pie(e);
      chispas(x, y - alto(e) - 4, 8, COL.oro, { v0: 30, v1: 80, t0: 200, t1: 380 });
    }
  };
  // corta el golpe que estaba por dar y la frena en seco
  const detener = e => {
    e.swingId = (e.swingId || 0) + 1;
    e.isAttacking = false;
    if (e.body) e.body.setVelocity(0, 0);
    if (e.tintTopLeft === 0xff7070) e.clearTint();   // el aviso rojo del golpe fuerte
  };
  const sangrar = (S, e, ms) => { if (e && e.active && !e.isDead) e._ckSangre = Math.max(e._ckSangre || 0, ahora(S) + ms); };

  // la bestia congelada o aturdida no piensa: durante su turno se hace "la muerta" (y su barra de vida se sigue dibujando)
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    if (!this.enemies) return ue0.apply(this, arguments);
    const now = ahora(this), quietas = [];
    this.enemies.getChildren().forEach(e => {
      if (e.active && !e.isDead && ((e._ckHielo || 0) > now || (e._ckAturdido || 0) > now)) { quietas.push(e); e.isDead = true; }
    });
    try { return ue0.apply(this, arguments); }
    finally {
      quietas.forEach(e => {
        e.isDead = false;
        if (e.hpBar) {
          const def = e.def || {}, g = e.hpBar; g.clear();
          if (e.hp < e.maxHp || def.boss) {
            const w = def.boss ? 44 : 24, bx = e.x - w / 2, by = e.y - (def.boss ? 52 : 34);
            g.fillStyle(0x000000, 0.75); g.fillRect(bx - 1, by - 1, w + 2, 5);
            g.fillStyle(def.boss ? 0xa855f7 : 0xdc2626, 1); g.fillRect(bx, by, w * Math.max(0, e.hp / e.maxHp), 3);
          }
        }
      });
    }
  };
  // la quemadura no la para un escudo
  const tb0 = P.enemyTryBlock;
  if (tb0) P.enemyTryBlock = function () { if (this._ckDot) return false; return tb0.apply(this, arguments); };

  // ================================================================== golpes: chispas según la rama y los estados que causan
  let golpeando = null, critico = false;
  const d1 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    if (!enemy || enemy.isDead || !enCampana(this)) return d1.apply(this, arguments);
    const now = ahora(this), f = this._ckFuente || '', dot = !!this._ckDot;
    let roto = false;
    if (!dot && (enemy._ckHielo || 0) > now) { roto = true; amount = (amount || 0) + 1; descongelar(this, enemy, true); }
    const hp0 = enemy.hp, antes = golpeando, critAntes = critico;
    golpeando = enemy; critico = false;
    let r;
    try { r = d1.call(this, enemy, amount, sx, sy); }
    finally { var fueCrit = critico; golpeando = antes; critico = critAntes; }
    if (dot || !(enemy.hp < hp0)) return r;
    try {
      if (roto) this.createFloatingText(enemy.x, enemy.y - 46, '¡HIELO ROTO!', 0x9fe6ff);
      efectosGolpe(this, enemy, f, sx, sy, fueCrit);
    } catch (e) { if (!this._ckEpErr) { this._ckEpErr = true; console.warn('[habilidades épicas]', e); } }
    return r;
  };

  const efectosGolpe = (S, e, f, sx, sy, crit) => {
    const h = S.playerHero, rama = (RAMA[h] || {})[f], p = pts(S, rama), now = ahora(S);
    const [x, y] = pie(e), cy = y - alto(e) / 2;
    const proy = S._ckProy, ck = proy && proy._ck;
    // chispas del golpe: más cuanto más puntos tenga la rama
    if (f && f !== 'quema') {
      const ang = Math.atan2(e.y - (sy === undefined ? e.y : sy), e.x - (sx === undefined ? e.x - 1 : sx));
      chispas(x, cy, Math.round(3 + 2.2 * p), colGolpe(f), { ang, abre: 1.6, v0: 60, v1: 140 + 12 * p, t0: 160, t1: 320 + 15 * p });
      if (p >= 4) chispas(x, cy, Math.round(p), colGolpe(f), { v0: 20, v1: 60, sube: 40, t0: 300, t1: 600, s: [1, 2] });
    }
    if (crit) {
      const n = 14 + Math.round(2 * p);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; for (let j = 1; j <= 4; j++) part({ x: x + Math.cos(a) * j * 4, y: cy + Math.sin(a) * j * 4, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, fr: 0.12, vida: 200 + j * 25, c: j < 3 ? 0xffffff : 0xffd27a, s: 2 }); }
      chispas(x, cy, n, COL.oro, { v0: 80, v1: 200, t0: 200, t1: 420 });
      luz(x, cy, [255, 220, 150], 80, 1, 200);
      if (h === 'swordsman') sangrar(S, e, 1300);
      S.cameras.main.shake(90, 0.004);
    }
    if (!e.active || e.isDead) return;
    // estados
    if (h === 'wizard') {
      if (f === 'fuego' && rg(S, 'llama')) quemar(S, e, 1400 + 500 * rg(S, 'llama'));
      if (f === 'hielo') {
        if (ck && ck.frena) congelar(S, e, 1400);
        else if (rg(S, 'helado') && Math.random() < 0.12 * rg(S, 'helado')) congelar(S, e, 900 + 200 * rg(S, 'helado'));
        else chispas(x, cy, 4 + rg(S, 'helado') * 2, COL.hielo, { v0: 10, v1: 40, g: 60, t0: 400, t1: 700, add: false });
      }
      if (f === 'trueno' && rg(S, 'carga')) aturdir(S, e, 400 + 100 * rg(S, 'carga'));
      if (f === 'nova') S.time.delayedCall(280, () => aturdir(S, e, 650));
    }
    if (h === 'soldier') {
      if (ck && ck.explota) quemar(S, e, 2200);
      if (f === 'embestida') aturdir(S, e, 380);
    }
    if (h === 'swordsman') {
      if (f === 'paso') aturdir(S, e, 750);
      if (f === 'embestida') aturdir(S, e, 380);
    }
  };

  // proyectiles: cuál está pegando (para saber si es la lanza o la flecha explosiva) y el estallido grande
  const hp1 = P.handleProjectileHitEnemy;
  P.handleProjectileHitEnemy = function (pr, enemy) {
    if (!pr || !pr.active || !enemy || !enemy.active || enemy.isDead) return hp1.apply(this, arguments);
    const antes = this._ckProy; this._ckProy = pr;
    const x = pr.x, y = pr.y, ck = pr._ck, ya = ck && pr._ckGolpeados && pr._ckGolpeados.has(enemy);
    try { return hp1.apply(this, arguments); }
    finally {
      this._ckProy = antes;
      try {
        if (enCampana(this) && ck && ck.explota && !ya) estallido(this, x, y, ck.explota, pts(this, 'arco'));
        else if (enCampana(this) && pr.isFireball && this.playerHero === 'wizard') {
          const p = pts(this, 'fuego');
          chispas(x, y, 8 + 3 * p, COL.fuego, { v0: 50, v1: 140 + 10 * p, sube: 20, t0: 220, t1: 420 + 20 * p, s: [1, 2, 3] });
          if (p >= 3) chispas(x, y, 4 + p, COL.humo, { v0: 10, v1: 30, sube: 25, t0: 500, t1: 900, s: [3, 4], add: false, a: 0.5 });
        }
      } catch (e) {}
    }
  };
  const estallido = (S, x, y, rad, p) => {
    aro(x, y, 6, 28 + 3 * p, COL.fuego, rad * 3.2, { plano: 0.7, t0: 220, t1: 360, s: 3 });
    chispas(x, y, 26 + 4 * p, COL.fuego, { v0: 60, v1: 230, g: 220, fr: 0.03, sube: 80, t0: 350, t1: 750, s: [1, 2, 3] });
    chispas(x, y - 6, 12, COL.humo, { v0: 10, v1: 45, sube: 30, t0: 700, t1: 1300, s: [3, 4, 5], add: false, a: 0.55, dx: 10, dy: 6 });
    chispas(x, y, 8, [0xffffff, 0xfff4c2], { v0: 20, v1: 60, t0: 120, t1: 200, s: [3, 4] });
    // quemado en el suelo
    const m = S.add.ellipse(x, y + 6, rad * 1.3, rad * 0.55, 0x1a1008, 0.45).setDepth(Math.round(y) - 3);
    S.tweens.add({ targets: m, alpha: 0, delay: 1200, duration: 2200, onComplete: () => m.destroy() });
  };

  // críticos: ck_habilidades escribe "¡CRÍTICO!" en medio del golpe; así nos enteramos de cuál fue
  const instalarTexto = () => {
    const t0 = P.createFloatingText;
    if (!t0 || t0._ckEpico) return;
    P.createFloatingText = function (x, y, txt) {
      if (golpeando && txt === '¡CRÍTICO!') critico = true;
      return t0.apply(this, arguments);
    };
    P.createFloatingText._ckEpico = true;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarTexto); else instalarTexto();

  // ================================================================== habilidades de R: más grandes cuanto más puntos tiene su rama
  const RAMA_ACTIVA = { explosiva: 'arco', onda: 'espada', grito: 'guardia', remolino: 'danza', dagas: 'filo', paso: 'sombra', triple_fuego: 'fuego', lanza: 'hielo', nova: 'tormenta' };
  const mano = S => { const p = S.player, d = S.facingV === 'front' ? [0, 1] : S.facingV === 'back' ? [0, -1] : [S.facingDirection === 'left' ? -1 : 1, 0]; return [p.x + d[0] * 18, p.y + 6 + d[1] * 14, d]; };
  const ACTIVAR = {
    explosiva(S, k) {
      const [x, y] = mano(S);
      for (let i = 0; i < 16 * k; i++) { const a = Math.random() * Math.PI * 2, r = R(18, 30); part({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, vida: 240, c: pick(COL.fuego), s: 2 }); }
      luz(x, y, [255, 150, 60], 70, 0.9, 400);
    },
    onda(S, k) {
      const [x, y, d] = mano(S);
      chispas(x, y, Math.round(14 * k), COL.hielo.concat(COL.acero), { ang: Math.atan2(d[1], d[0]), abre: 1.2, v0: 120, v1: 260, t0: 180, t1: 360 });
      luz(x, y, [180, 220, 255], 80, 0.9, 250);
    },
    grito(S, k) {
      const p = S.player, [x, y] = pie(p);
      aro(x, y, 8, Math.round(30 * k), COL.tierra, 220, { plano: 0.45, add: false, s: 3, t0: 350, t1: 550 });
      aro(x, y - 14, 10, Math.round(24 * k), COL.oro, 260, { plano: 0.7, t0: 300, t1: 500 });
      chispas(x, y - 16, Math.round(14 * k), COL.oro, { v0: 40, v1: 120, sube: 60, t0: 400, t1: 800 });
      luz(x, y - 10, [255, 210, 130], 160, 1, 450);
      // las asusta: después del empujón quedan quietas un momento
      S.time.delayedCall(260, () => S.enemies && S.enemies.getChildren().forEach(e => { if (e.active && !e.isDead && Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 150) aturdir(S, e, 700 + 100 * pts(S, 'guardia')); }));
    },
    remolino(S, k) { const [x, y] = pie(S.player); aro(x, y - 8, 12, Math.round(20 * k), COL.rosa, 200, { t0: 250, t1: 420 }); },
    dagas(S, k) { const [x, y, d] = mano(S); chispas(x, y, Math.round(10 * k), COL.plata, { ang: Math.atan2(d[1], d[0]), abre: 1, v0: 100, v1: 220, t0: 140, t1: 260 }); },
    paso(S, k, antes) {
      const p = S.player;
      const humo = (x, y) => { chispas(x, y + 6, Math.round(18 * k), COL.sombra, { v0: 20, v1: 80, sube: 20, t0: 350, t1: 700, s: [2, 3, 4], add: false, a: 0.8, dx: 6, dy: 8 }); chispas(x, y, Math.round(8 * k), [0xc4b5fd, 0xffffff], { v0: 40, v1: 120, t0: 160, t1: 300 }); };
      humo(antes[0], antes[1]); humo(p.x, p.y);
      try {
        const fan = S.add.image(antes[0], antes[1], p.texture.key, p.frame.name).setFlipX(p.flipX).setScale(p.scaleX, p.scaleY).setOrigin(p.originX, p.originY)
          .setTint(0x5b3fa8).setAlpha(0.55).setDepth(p.depth - 1);
        S.tweens.add({ targets: fan, alpha: 0, duration: 420, onComplete: () => fan.destroy() });
      } catch (e) {}
    },
    triple_fuego(S, k) {
      const [x, y] = mano(S);
      aro(x, y, 4, Math.round(22 * k), COL.fuego, 160, { plano: 0.8, t0: 220, t1: 380 });
      chispas(x, y, Math.round(10 * k), COL.fuego, { v0: 30, v1: 90, sube: 50, t0: 300, t1: 600, s: [2, 3] });
      luz(x, y, [255, 140, 50], 110, 1, 450);
    },
    lanza(S, k) {
      const [x, y, d] = mano(S);
      chispas(x, y, Math.round(16 * k), COL.hielo, { ang: Math.atan2(d[1], d[0]), abre: 1.4, v0: 60, v1: 180, t0: 220, t1: 420, s: [1, 2, 3] });
      luz(x, y, [150, 210, 255], 90, 0.9, 350);
    },
    nova(S, k) {
      const [x, y] = pie(S.player);
      aro(x, y - 10, 8, Math.round(40 * k), COL.nova, 300, { plano: 0.7, t0: 280, t1: 420, s: 2 });
      aro(x, y - 10, 4, Math.round(20 * k), [0xffffff], 180, { plano: 0.7, t0: 180, t1: 260, s: 3 });
      chispas(x, y - 12, Math.round(16 * k), COL.nova, { v0: 20, v1: 80, sube: 40, t0: 400, t1: 800 });
    }
  };
  const hr0 = P.ckHabilidadR;
  if (hr0)
    P.ckHabilidadR = function () {
      const H = this.story && this.story.hab, id = H && H.activa && H.activa[this.playerHero];
      const cd0 = this._ckCd && this._ckCd[id], antes = this.player ? [this.player.x, this.player.y] : [0, 0];
      const r = hr0.apply(this, arguments);
      try { if (id && this._ckCd && this._ckCd[id] !== cd0 && ACTIVAR[id]) { capas(this); ACTIVAR[id](this, kRama(this, RAMA_ACTIVA[id]), antes); } } catch (e) {}
      return r;
    };

  // el trueno: chispas y destello que crecen con la rama Tormenta
  const ts1 = P.thunderStrike;
  if (ts1)
    P.thunderStrike = function (level) {
      const r = ts1.apply(this, arguments);
      try {
        if (enCampana(this) && this.player) {
          capas(this);
          const k = kRama(this, 'tormenta'), [x, y] = pie(this.player);
          aro(x, y, 10, Math.round((14 + 6 * (level || 1)) * k), COL.trueno, 240, { plano: 0.5, t0: 220, t1: 380 });
          chispas(x, y - 20, Math.round(10 * k), COL.trueno, { v0: 60, v1: 200, t0: 120, t1: 260 });
        }
      } catch (e) {}
      return r;
    };

  // ================================================================== cada cuadro
  const ESTELA = 1000 / 60;
  const u1 = P.update;
  P.update = function (time, delta) {
    const r = u1.apply(this, arguments);
    try {
      if (!this.player || !this.enemies) return r;
      capas(this);
      const pausa = this.isGamePaused || (this.time && this.time.paused) || this._overlay;
      const dt = Math.min(50, delta || 16);
      if (!pausa) { if (enCampana(this)) cadaCuadro(this, dt); moverParticulas(dt); }
      dibujarParticulas();
      dibujarEstados(this);
    } catch (e) { if (!this._ckEpErr2) { this._ckEpErr2 = true; console.warn('[habilidades épicas]', e); } }
    return r;
  };
  // n por segundo → cuántas toca este cuadro
  const cuantas = (porSeg, dt) => { const n = porSeg * dt / 1000; return Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); };

  const cadaCuadro = (S, dt) => {
    const now = ahora(S), h = S.playerHero;
    // estados de las bestias
    S.enemies.getChildren().forEach(e => {
      if (!e.active) return;
      if (e.isDead) { if (e._ckHielo) { e._ckHielo = 0; if (e.anims && e.anims.isPaused) e.anims.resume(); } e._ckFuego = null; e._ckAturdido = 0; return; }
      const [x, y] = pie(e), al = alto(e);
      // congelada
      if (e._ckHielo) {
        if (e._ckHielo > now) {
          if (e.body) e.body.setVelocity(0, 0);
          if (e.anims && e.anims.isPlaying && !e.anims.isPaused) e.anims.pause();
          e.setTint(0x9fe6ff);
          if (Math.random() < dt / 260) part({ x: x + R(-10, 10), y: y - R(2, al), vy: -6, vida: R(300, 500), c: 0xffffff, s: 1 });
        } else descongelar(S, e, false);
      }
      // aturdida
      if (e._ckAturdido && e._ckAturdido > now && e.body) e.body.setVelocity(0, 0);
      // quemándose
      const fu = e._ckFuego;
      if (fu) {
        if (fu.hasta <= now) e._ckFuego = null;
        else {
          for (let i = cuantas(48, dt); i > 0; i--) part({ x: x + R(-8, 8), y: y - R(2, al * 0.8), vx: R(-6, 6), vy: -R(28, 60), vida: R(300, 560), c: pick([0xfff0a8, 0xffc14d, 0xff9a3d]), c2: 0xff3010, s: RI(2, 4), enc: 0.7 });
          for (let i = cuantas(14, dt); i > 0; i--) part({ x: x + R(-6, 6), y: y - R(2, al * 0.6), vx: R(-4, 4), vy: -R(20, 40), vida: R(250, 420), c: 0xff7a1a, c2: 0x7a1a08, s: 2, add: false, enc: 0.5 });
          if (Math.random() < dt / 140) part({ x: x + R(-5, 5), y: y - al, vx: R(-5, 5), vy: -R(15, 25), vida: R(600, 900), c: 0x5b5560, s: 3, add: false, a: 0.4 });
          if (now >= fu.prox) {
            fu.prox = now + 1000;
            const v = e.body ? [e.body.velocity.x, e.body.velocity.y] : null;
            const atk = (S.story && S.story.up && S.story.up.atk) || 0, fa = S._ckFuente;
            S._ckDot = true; S._ckFuente = 'quema';
            try { S.damageEnemy(e, Math.max(0, 1 - atk), x, y - 10); } finally { S._ckDot = false; S._ckFuente = fa; }
            if (v && e.active && !e.isDead && e.body) e.body.setVelocity(v[0], v[1]);
            chispas(x, y - al / 2, 6, COL.fuego, { v0: 30, v1: 80, sube: 40, t0: 200, t1: 380 });
          }
        }
      }
      // sangrando
      if (e._ckSangre && e._ckSangre > now && Math.random() < dt / 70) part({ x: x + R(-6, 6), y: y - R(al * 0.4, al * 0.8), vx: R(-20, 20), vy: -R(10, 40), g: 320, vida: R(380, 560), c: pick(COL.sangre), s: 2, add: false });
    });

    // estelas de los proyectiles
    if (S.projectiles) S.projectiles.getChildren().forEach(o => {
      if (!o.active) return;
      const v = o.body ? o.body.velocity : { x: 0, y: 0 }, sp = Math.hypot(v.x, v.y) || 1, bx = -v.x / sp, by = -v.y / sp;
      const ck = o._ck;
      if (o.isFireball) {
        const p = pts(S, 'fuego');
        for (let i = cuantas(22 + 9 * p, dt); i > 0; i--) part({ x: o.x + bx * R(2, 8) + R(-3, 3), y: o.y + by * R(2, 8) + R(-3, 3), vx: bx * 20 + R(-12, 12), vy: by * 20 - R(10, 30), vida: R(220, 360 + 30 * p), c: pick(COL.fuego), c2: 0xff2a00, s: RI(2, p >= 3 ? 4 : 3), enc: 0.7 });
        if (p >= 4 && Math.random() < dt / 90) part({ x: o.x, y: o.y, vx: R(-30, 30), vy: R(-50, -10), g: 200, vida: 500, c: 0xffd27a, s: 1 });
      } else if (ck) {
        if (ck.explota) for (let i = cuantas(45, dt); i > 0; i--) part({ x: o.x + bx * 6, y: o.y + by * 6, vx: R(-20, 20), vy: R(-30, 5), vida: R(160, 300), c: pick(COL.fuego), c2: 0xff3010, s: 2 });
        else if (ck.fuente === 'onda') for (let i = cuantas(40 * kRama(S, 'espada'), dt); i > 0; i--) part({ x: o.x + R(-4, 4), y: o.y + R(-10, 10), vx: bx * 40, vy: by * 40, vida: R(150, 280), c: pick(COL.hielo), s: RI(1, 2) });
        else if (ck.fuente === 'hielo') for (let i = cuantas(40 * kRama(S, 'hielo'), dt); i > 0; i--) part({ x: o.x + bx * R(0, 10), y: o.y + by * R(0, 10) + R(-3, 3), vx: R(-10, 10), vy: R(-10, 10), fr: 0.05, vida: R(250, 450), c: pick(COL.hielo), s: RI(1, 2) });
        else if (ck.fuente === 'daga' && pts(S, 'filo')) for (let i = cuantas(18 + 6 * pts(S, 'filo'), dt); i > 0; i--) part({ x: o.x + bx * 4, y: o.y + by * 4, vida: R(120, 200), c: pick(COL.plata), s: 1 });
      } else if (S.playerHero === 'soldier') {
        const p = pts(S, 'arco');
        if (p) for (let i = cuantas(16 + 7 * p, dt); i > 0; i--) part({ x: o.x + bx * R(4, 10), y: o.y + by * R(4, 10), vida: R(120, 200 + 15 * p), c: p >= 4 ? pick(COL.oro) : pick(COL.flecha), s: 1 });
      }
    });

    // el héroe mientras usa habilidades largas
    const pl = S.player, [px, py] = pie(pl);
    if (S._ckRemolino) {
      const k = kRama(S, 'danza');
      for (let i = cuantas(70 * k, dt); i > 0; i--) { const a = Math.random() * Math.PI * 2, rr = R(20, 62); part({ x: px + Math.cos(a) * rr, y: py - 8 + Math.sin(a) * rr * 0.55, vx: -Math.sin(a) * 140, vy: Math.cos(a) * 140 * 0.55, fr: 0.04, vida: R(180, 320), c: pick(COL.rosa.concat(COL.plata)), s: RI(1, 2) }); }
    } else if (S._bladeDance && h === 'swordsman') {
      const k = kRama(S, 'danza');
      for (let i = cuantas(30 * k, dt); i > 0; i--) part({ x: px + R(-26, 26), y: py - R(4, 30), vx: R(-30, 30), vy: R(-20, 10), g: 30, vida: R(300, 520), c: pick(COL.rosa), s: RI(1, 2) });
    }
    if (S.isSpinning && h === 'soldier') {
      const k = kRama(S, 'espada');
      for (let i = cuantas(40 * k, dt); i > 0; i--) { const a = Math.random() * Math.PI * 2, rr = R(28, 46); part({ x: px + Math.cos(a) * rr, y: py - 10 + Math.sin(a) * rr * 0.55, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 66, vida: R(140, 260), c: pick(COL.acero), s: 1 }); }
    }
    if ((S._ckGrito || 0) > now) for (let i = cuantas(10 * kRama(S, 'guardia'), dt); i > 0; i--) part({ x: px + R(-10, 10), y: py - R(0, 26), vy: -R(20, 45), vx: R(-6, 6), vida: R(400, 700), c: pick(COL.oro), s: 1 });
    if (S.thunderCharge && h === 'wizard') {
      const k = kRama(S, 'tormenta'), lv = S.thunderCharge.level || 1;
      for (let i = cuantas((10 + 10 * lv) * k, dt); i > 0; i--) { const a = Math.random() * Math.PI * 2, rr = R(14, 30 + 8 * lv); part({ x: px + Math.cos(a) * rr, y: py - 14 + Math.sin(a) * rr * 0.7, vx: -Math.cos(a) * rr * 3, vy: -Math.sin(a) * rr * 2, vida: 300, c: pick(COL.trueno), s: 1 }); }
    }
  };

  // bloque de hielo y estrellitas: se dibujan cada cuadro en la capa normal / la que suma luz
  const dibujarEstados = S => {
    const now = ahora(S), g = capaN, ga = capaA;
    S.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const [x, y] = pie(e), al = alto(e);
      if ((e._ckHielo || 0) > now) {
        const w = Math.round(26 * (e.scaleX || 1.2) / 1.2), h = Math.round(al + 6), l = Math.round(x - w / 2), t = Math.round(y - h);
        const queda = (e._ckHielo - now) / 400;   // titila cuando está por romperse
        const a = queda < 1 && Math.floor(now / 80) % 2 ? 0.16 : 0.3;
        g.fillStyle(0xbfe9ff, a);
        g.fillPoints([{ x: l + 3, y: t }, { x: l + w - 4, y: t + 2 }, { x: l + w, y: t + 7 }, { x: l + w - 1, y: t + h }, { x: l + 1, y: t + h }, { x: l, y: t + 5 }], true);
        g.lineStyle(1, 0xe8f8ff, 0.75);
        g.strokePoints([{ x: l + 3, y: t }, { x: l + w - 4, y: t + 2 }, { x: l + w, y: t + 7 }, { x: l + w - 1, y: t + h }, { x: l + 1, y: t + h }, { x: l, y: t + 5 }], true);
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(l + 3, t + 3, 1, Math.round(h * 0.45)); g.fillRect(l + 5, t + 4, 1, Math.round(h * 0.25)); g.fillRect(l + w - 5, t + Math.round(h * 0.55), 1, Math.round(h * 0.3));
        if (Math.floor(now / 160 + x) % 6 === 0) { ga.fillStyle(0xffffff, 0.9); ga.fillRect(l + w - 6, t + 4, 1, 3); ga.fillRect(l + w - 7, t + 5, 3, 1); }
      }
      if ((e._ckAturdido || 0) > now) {
        const t = now / 180;
        for (let i = 0; i < 3; i++) {
          const a = t + i * 2.094, sx = Math.round(x + Math.cos(a) * 9), sy = Math.round(y - al - 6 + Math.sin(a) * 3);
          ga.fillStyle(0xffe066, 1); ga.fillRect(sx, sy - 1, 1, 3); ga.fillRect(sx - 1, sy, 3, 1);
        }
      }
    });
  };

  // luz de las bestias que arden y del hielo
  if (window.CK_LUZ && window.CK_LUZ.fuente)
    window.CK_LUZ.fuente((S, out) => {
      if (!S.enemies || !enCampana(S)) return;
      const now = ahora(S);
      S.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead) return;
        if (e._ckFuego && e._ckFuego.hasta > now) out.push({ x: e.x, y: e.y, r: 48 + Math.random() * 6, c: [255, 140, 50], f: 0.75 });
        else if ((e._ckHielo || 0) > now) out.push({ x: e.x, y: e.y, r: 34, c: [150, 210, 255], f: 0.45 });
      });
    });

  // ================================================================== el árbol cuenta qué estado causa cada nodo
  const EXTRA = {
    llama: r => ` Y la prende fuego: arde ${r > 1 ? 2 : 1} s (1 de daño por segundo).`,
    helado: r => ` ${r * 12}% de chance de congelarla ${(0.9 + 0.2 * r).toFixed(1).replace('.', ',')} s; romper el hielo hace +1.`,
    lanza: () => ' Congela 1,4 s.',
    carga: r => ` El trueno aturde ${(0.4 + 0.1 * r).toFixed(1).replace('.', ',')} s.`,
    nova: () => ' Las deja aturdidas.',
    explosiva: () => ' Las deja ardiendo.',
    grito: () => ' Quedan asustadas, quietas un momento.',
    paso: () => ' La deja aturdida.',
    embestida: () => ' Y las aturde un instante.',
    herida: () => ' Se ve correr la sangre.'
  };
  Object.keys(HB.ARBOL).forEach(h => HB.ARBOL[h].ramas.forEach(rm => rm.nodos.forEach(n => {
    const ex = EXTRA[n.id];
    if (!ex || n._ckEpico) return;
    const d0 = n.d; n._ckEpico = true;
    n.d = r => d0(r) + ex(Math.max(1, r || 0));
  })));

  window.CK_EPICO = { quemar, congelar, aturdir, sangrar, chispas, PART };
})();
