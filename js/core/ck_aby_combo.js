'use strict';
/* Slice combo, la habilidad nueva de Aby (22/11, pedido del dueño desde el editor: "una habilidad que sea contra un solo
   oponente, que se lance rápido y haga animaciones de muchos cortes, con efectos de cortes, y cuando termine la animación
   el enemigo atacado reciba todo el daño y quede aturdido; 2,5 segundos de combo". Animación: "combo de cortes súper
   rápidos como tajos y ella deja un eco en el movimiento cada vez, empieza un poco lento y aumenta en rapidez". Efectos:
   blancos).
   - Se aprende en el árbol de Aby (H), rama Filo, y se pone en Q, E, R o F como las otras. 40 de aguante, 12 s.
   - Busca la bestia más cercana (hasta 190 px; si no hay, avisa y no gasta nada), se lanza sobre ella y la corta 14 veces
     en 2,5 s, saltando de un lado al otro: los primeros cortes van despacio y cada vez más rápido. En cada salto deja un eco
     blanco de su figura; cada corte es un tajo blanco de pixelfx (pfx_corte_blanco) y una raya blanca que cruza a la bestia.
   - La bestia queda atrapada mientras dura (no se mueve ni pega); Aby no recibe daño. El último es un corte en cruz
     (pfx_corte_x) y recién ahí entra todo el daño junto (5) con un estallido blanco, y la bestia queda aturdida 2 s.
     A los jefes no se los frena ni se los aturde (como con las otras habilidades): reciben los cortes y el daño.
   - Si la bestia muere o desaparece en el medio, el combo se corta ahí.
   Ícono de PixelLab. Lo que dibuja lo lee el editor de habilidades (S._ckPedCrea). Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined' || !window.CK_HABILIDADES) return;
  const HB = window.CK_HABILIDADES, ARBOL = HB.ARBOL, ACT = HB.ACTIVAS, HACER = HB.HACER;
  if (!ARBOL || !ACT || !HACER) return;
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const VX = () => window.CK_VFX, EP = () => window.CK_EPICO || {};
  const sfxSon = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const habSon = (k, v, o) => { try { window.CK_SONIDOS && CK_SONIDOS.son && CK_SONIDOS.son(k, v, o); } catch (e) {} };
  const crea = (S, fn) => { S._ckPedCrea = (S._ckPedCrea || 0) + 1; try { return fn(); } finally { S._ckPedCrea--; } };
  const fx = (S, k, x, y, o) => { try { const V = VX(); return V && V.fx ? crea(S, () => V.fx(S, k, x, y, o)) : null; } catch (e) { return null; } };

  const COMBO = { alcance: 190, lanza: 150, dura: 2500, golpes: 14, dano: 5, aturde: 2000, cd: 12000, costo: 40,
    lento: 270, rapido: 62, radio: 24, final: 300 };

  // ------------------------------------------------------------------ árbol, ícono y costo
  const ICONO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC0klEQVR4nNVXzWsTQRR/GRIQqejf0MISN1uVWE9FhdKDHkTowbMi9qIoehB79OLBgxI0HkohNwURISBqIYgS8TNKY2KsAQVvHiuCZJOYkd/Qt0w3u9nZNCI+CDM77/s3773dEP3P5NgZuVkbgjd22pLZ3XtiG4Re3KB1HaEz31YqyqBpZr1eJ7bjarUaLmRNjMvfna58+mhlQ5RBxHzomDiHTdj2Jyf0h2QqqVa33aJarWFkvPnla2IQYpw1bBqhZqctFely8ZVaw4LQnYahxbY4e5OECELFO+UNQQRlGBUAXyfbWji1ZBYAG2TnYUHoTv0BoJt0XQRh7NyfgZ5FmFN9z3rs3K8Xi+z1OwwKQjfK6HDmLBt2fbHImhj3iogN48wfAAer109s2MMIDvT7DLoOnTfUnZsigd/ZYznlgFsMe5x9/7bmPZMhCVNBDJwLl47Tj7WfoTKvX9Ro/syckqW/RdY6Enpt8H6YahfDBHG/8EytPF4xwnEmRIpGTo5v4qHAcNf6nMAeZ/7iM0FExAnk1vW7tGVrimYPT3svrtLDitofmMnS9h3b6Ma122oeKOObRcSxMypDGEQbIkOcYa4jO+4KRgY8rDhj3SgUxCCm/9W5cPkkHZk+T8tvbvbJMg9rHEqaCOFLaWfaok+rTZqctGl212kqfch7/G6nS4f2nqNi+ar6joAMVhMSA5kiRQ/uvVR73fnzz4U+WQQE3r6pKc95uVSPrINEGAN3B4M6PX6XUysGDfPnThz0hg93ANDQ6Ul9keqNjwnjK7A151DmegiacOh/7gjmj40VZMv9pbJHXcw489Tr5WVjtZmIDMCxMxIKnPEwY/V9dcXTabtXJBBBQkIsSj8SQn8AhOwcdzrIuWmPwwbXDGz72zIZpATnQXDphEzabk4C/ihZINJy8/Lo/ouqYwZSNua/ozjyo/gr1+d86O+9UZAz6oz+Bf0BC9B+KQo/2XAAAAAASUVORK5CYII=';
  const ponerIcono = () => { try { window.CK_ICONOS_HEROE = window.CK_ICONOS_HEROE || {}; if (!window.CK_ICONOS_HEROE.slice) window.CK_ICONOS_HEROE.slice = ICONO; } catch (e) {} };
  ponerIcono();
  const seg = ms => String(ms / 1000).replace('.', ',');
  const NODO = { id: 'slice', n: 'Slice combo', ic: 'slice', max: 1, req: 6, tipo: 'a',
    d: () => `Nueva: se lanza sobre la bestia más cercana y la corta sin parar ${seg(COMBO.dura)} s, cada vez más rápido; al terminar recibe todo el daño junto (${COMBO.dano}) y queda aturdida ${seg(COMBO.aturde)} s. ${COMBO.costo} de aguante, ${seg(COMBO.cd)} s.` };
  try {
    const rama = ARBOL.swordsman && ARBOL.swordsman.ramas.find(r => r.id === 'filo');
    if (rama && !rama.nodos.find(n => n.id === NODO.id)) rama.nodos.push(NODO);
  } catch (e) {}
  ACT.slice = { cd: COMBO.cd, cost: COMBO.costo };

  // ------------------------------------------------------------------ animaciones (de sus hojas de ataque)
  // [textura, cuadros]: los cortes van alternando entre estas; la del final es la estocada con el corte en cruz
  const ANIMS = {
    swordsman_attack_slice_prep: ['swordsman_attack1', [0, 1, 2]],
    swordsman_attack_slice_a: ['swordsman_attack1', [2, 3, 4]],
    swordsman_attack_slice_b: ['swordsman_attack2', [2, 3, 4]],
    swordsman_attack_slice_c: ['swordsman_attack2', [5, 6, 7]],
    swordsman_attack_slice_fin: ['swordsman_attack2', [11, 12, 13, 14, 14, 14]]
  };
  const CORTES = ['swordsman_attack_slice_a', 'swordsman_attack_slice_b', 'swordsman_attack_slice_c'];
  const anims = S => {
    Object.keys(ANIMS).forEach(k => {
      if (S.anims.exists(k)) return; const [tx, fr] = ANIMS[k]; if (!S.textures.exists(tx)) return;
      const tot = S.textures.get(tx).frameTotal - 1;
      S.anims.create({ key: k, frames: fr.filter(i => i < tot).map(i => ({ key: tx, frame: i })), frameRate: 16, repeat: 0 });
    });
  };
  // que nada le cambie la animación mientras corta (el mismo candado que usa ck_heroes_pedidos.js, si está)
  const tocar = (S, key, fps, hasta) => {
    const p = S.player; if (!p || !S.anims.exists(key)) return;
    const HP = window.CK_HEROES_PEDIDOS;
    if (HP && HP.fijar && !p._ckPedPlay) HP.fijar(S, key, 1);
    S._ckAnimKey = key; S._ckAnimFija = hasta;
    p.play({ key, frameRate: fps }, false);
  };
  const soltar = S => { S._ckAnimFija = 0; };

  // ------------------------------------------------------------------ efectos
  // el eco: su figura de ese momento, aclarada y transparente, que se apaga (y un borde blanco que se va antes)
  const eco = (S, x, y, a) => {
    const p = S.player; if (!p || !p.frame) return;
    crea(S, () => {
      const g = S.add.image(x, y, p.texture.key, p.frame.name).setOrigin(p.originX, p.originY).setFlipX(p.flipX)
        .setScale(p.scaleX, p.scaleY).setDepth(p.depth - 1).setTint(0xdfe7ff).setAlpha(a || 0.5);
      const b = S.add.image(x, y, p.texture.key, p.frame.name).setOrigin(p.originX, p.originY).setFlipX(p.flipX)
        .setScale(p.scaleX, p.scaleY).setDepth(p.depth - 1).setTintFill(0xffffff).setAlpha((a || 0.5) * 0.45).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: g, alpha: 0, duration: 280, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
      S.tweens.add({ targets: b, alpha: 0, duration: 140, onComplete: () => b.destroy() });
    });
  };
  // la raya del corte: cruza a la bestia en la dirección del tajo
  const raya = (S, x, y, ang, largo, prof) => crea(S, () => {
    const g = S.add.graphics().setDepth(prof), c = Math.cos(ang) * largo / 2, s = Math.sin(ang) * largo / 2;
    g.lineStyle(3, 0xdfe6f2, 0.85).lineBetween(x - c, y - s, x + c, y + s);
    g.lineStyle(1, 0xffffff, 1).lineBetween(x - c * 1.08, y - s * 1.08, x + c * 1.08, y + s * 1.08);
    S.tweens.add({ targets: g, alpha: 0, duration: 150, onComplete: () => g.destroy() });
  });
  const destello = (S, e, ms) => {
    if (!vivo(e) || !e.setTintFill) return;
    e.setTintFill(0xffffff); e._ckSliceFl = (e._ckSliceFl || 0) + 1; const n = e._ckSliceFl;
    S.time.delayedCall(ms || 45, () => { if (e.active && e._ckSliceFl === n && e.clearTint) e.clearTint(); });
  };
  const centro = e => (e.body ? { x: e.body.center.x, y: e.body.center.y } : { x: e.x, y: e.y });
  const esJefe = e => !!(e && (e.isBoss || e._ckJefe || (e.def && e.def.boss) || (window.CK_COLISEO && CK_COLISEO.JEFES && CK_COLISEO.JEFES[e.type])));

  // ------------------------------------------------------------------ el combo
  const blanco = S => {
    const p = S.player; let m = null, d0 = COMBO.alcance;
    S.enemies.getChildren().forEach(e => { if (!vivo(e)) return; const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y); if (d < d0) { d0 = d; m = e; } });
    return m;
  };
  // los momentos de cada corte: el primero tarda "lento" y el último "rápido", y todos entran en los 2,5 s
  const tiempos = () => {
    const n = COMBO.golpes, iv = [];
    for (let k = 0; k < n - 1; k++) iv.push(COMBO.lento + (COMBO.rapido - COMBO.lento) * k / (n - 2));
    const k = (COMBO.dura - COMBO.final) / iv.reduce((a, b) => a + b, 0), t = [0];
    iv.forEach(v => t.push(t[t.length - 1] + v * k));
    return { t, iv: iv.map(v => v * k) };
  };
  HACER.slice = function (S) {
    const p = S.player, e = blanco(S);
    if (!e) { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota('No hay ninguna bestia cerca para el combo'); S.createFloatingText && S.createFloatingText(p.x, p.y - 40, 'nadie cerca', 0xe5e7eb); } catch (er) {} return -1; }
    anims(S);
    const jefe = esJefe(e), T = tiempos(), t0 = S.time.now, fin = t0 + COMBO.lanza + COMBO.dura + 200;
    const st = { vivo: true, golpes: 0 };
    S.isInvulnerable = true; p.setVelocity(0, 0);
    // la bestia: corta lo que estaba por hacer y queda atrapada mientras dura (los jefes no)
    let ex = e.x, ey = e.y;
    const atrapar = () => {
      if (!st.vivo || !vivo(e) || jefe) return;
      if (e.body) { e.body.setVelocity(0, 0); if (Math.abs(e.x - ex) + Math.abs(e.y - ey) > 0.5) e.body.reset(ex, ey); }
      e.attackCooldown = Math.max(e.attackCooldown || 0, S.time.now + 500);
    };
    if (!jefe) { e.swingId = (e.swingId || 0) + 1; e.isAttacking = false; if (e.body) e.body.setVelocity(0, 0); S.events.on('postupdate', atrapar); }
    else e.attackCooldown = Math.max(e.attackCooldown || 0, fin);
    const terminar = () => {
      if (!st.vivo) return; st.vivo = false;
      S.events.off('postupdate', atrapar);
      S.isInvulnerable = false; soltar(S);
      try { if (S.unstickPlayer) S.unstickPlayer(); } catch (er) {}
    };
    // mirar a la bestia y ponerse a su lado (su cuerpo, no el centro del dibujo)
    const off = () => (p.body ? { x: p.body.center.x - p.x, y: p.body.center.y - p.y } : { x: 0, y: 0 });
    const mirar = x => { S.facingDirection = x > centro(e).x ? 'left' : 'right'; S.facingV = null; p.setFlipX(S.facingDirection === 'left'); };
    const mover = (bx, by, ms, ecos) => {
      const o = off(), x1 = bx - o.x, y1 = by - o.y, x0 = p.x, y0 = p.y;
      eco(S, x0, y0, 0.6);
      if (ecos > 1) S.time.delayedCall(ms * 0.5, () => st.vivo && eco(S, (x0 + x1) / 2, (y0 + y1) / 2, 0.4));
      S.tweens.add({ targets: p, x: x1, y: y1, duration: ms, ease: 'Quad.easeOut' });
      mirar(bx);
      return Math.atan2(y1 - y0, x1 - x0);
    };

    // 1) se lanza: se agacha un instante y cruza hasta la bestia
    sfxSon('dash', 0.7, { rate: 1.35 });
    tocar(S, 'swordsman_attack_slice_prep', 24, fin);
    const c0 = centro(e), lado0 = p.x <= c0.x ? -1 : 1;
    S.time.delayedCall(40, () => { if (!st.vivo) return; mover(c0.x + lado0 * COMBO.radio, c0.y + R(-4, 4), COMBO.lanza - 40, 2); });

    // 2) los cortes
    T.t.forEach((tt, k) => S.time.delayedCall(COMBO.lanza + tt, () => {
      if (!st.vivo) return;
      if (!vivo(e) || !p.active || S.isDead) { terminar(); return; }
      const c = centro(e), iv = T.iv[Math.min(k, T.iv.length - 1)];
      // salta al otro lado (de costado y un poco arriba o abajo): deja el eco donde estaba
      const lado = (k % 2 ? 1 : -1) * lado0, ang = (lado > 0 ? 0 : Math.PI) + R(-0.75, 0.75);
      const ms = Math.max(30, Math.min(90, iv * 0.35));
      const dir = k ? mover(c.x + Math.cos(ang) * COMBO.radio, c.y + Math.sin(ang) * COMBO.radio * 0.6, ms, iv > 150 ? 2 : 1) : Math.atan2(0, -lado0);
      const key = CORTES[k % CORTES.length], fps = Math.max(12, Math.min(48, 3 / Math.max(0.04, iv * 0.85 / 1000)));
      tocar(S, key, fps, fin);
      // el tajo blanco sobre la bestia (siguiendo el salto) y la raya que la cruza
      S.time.delayedCall(Math.min(ms, 45), () => {
        if (!st.vivo || !vivo(e)) return;
        const c2 = centro(e), prof = Math.max(e.depth, p.depth) + 6, g = dir + R(-0.45, 0.45);
        fx(S, 'pfx_corte_blanco', c2.x + R(-3, 3), c2.y - 3 + R(-3, 3), { escala: R(0.62, 0.82) * (1 + k * 0.015), giro: g, flip: Math.cos(dir) < 0, prof });
        raya(S, c2.x, c2.y - 3, g + Math.PI / 2 * (k % 3 === 2 ? 1 : 0) + R(-0.3, 0.3), R(28, 42), prof + 1);
        if (k % 2 === 0) destello(S, e, 35);          // (uno sí y uno no: si no, queda toda blanca)
        st.golpes++;
        sfxSon(k % 2 ? 'sword_swing2' : 'sword_swing1', 0.42, { rate: 1.05 + k * 0.035, minGap: 25 });
        if (k % 2 === 0) sfxSon('sword_hit', 0.22, { rate: 1.3 + k * 0.02, minGap: 40 });
        if (k > COMBO.golpes * 0.6) S.cameras.main.shake(50, 0.0016);
      });
    }));

    // 3) el final: cruza a la bestia, corte en cruz y ahí entra todo el daño
    S.time.delayedCall(COMBO.lanza + COMBO.dura - COMBO.final + 40, () => {
      if (!st.vivo) return;
      if (!vivo(e)) { terminar(); return; }
      const c = centro(e), lado = p.x + off().x < c.x ? 1 : -1;
      mover(c.x + lado * (COMBO.radio + 12), c.y + R(-3, 3), 70, 2);
      tocar(S, 'swordsman_attack_slice_fin', 22, fin);
      habSon('tajo_cruzado', 0.9, { rate: 1.1 });
      S.time.delayedCall(60, () => {
        if (!vivo(e)) return;
        const c2 = centro(e), prof = Math.max(e.depth, p.depth) + 6;
        fx(S, 'pfx_corte_x', c2.x, c2.y - 3, { escala: 1.15, prof, flip: lado < 0 });
        destello(S, e, 120);
      });
    });
    S.time.delayedCall(COMBO.lanza + COMBO.dura, () => {
      if (!st.vivo) return;
      if (vivo(e)) {
        const c = centro(e), prof = Math.max(e.depth, p.depth) + 8;
        fx(S, 'pfx_critico_blanco', c.x, c.y - 4, { escala: 1, prof });
        habSon('critico', 0.85); habSon('ulti_impacto', 0.45, { rate: 1.2 });
        S.cameras.main.shake(160, 0.006);
        try { window.CK_LUZ && CK_LUZ.agregar({ x: c.x, y: c.y, c: [235, 240, 255], r: 90, f: 1, ms: 260, curva: 'cae' }); } catch (er) {}
        try { S.createFloatingText && S.createFloatingText(c.x + 14, c.y - 44, '×' + st.golpes, 0xf8fafc); } catch (er) {}
        // todo el daño junto. El estallido naranja de los golpes fuertes (ck_vfx.js, "critico") se saca sólo acá: el de este
        // combo es el blanco de arriba
        const fa = S._ckFuente, n0 = S.children.list.length; S._ckFuente = 'slice';
        try { S.damageEnemy(e, COMBO.dano, p.x, p.y); } finally { S._ckFuente = fa; }
        try { S.children.list.slice(n0).forEach(o => { if (o && o.texture && o.texture.key === 'ckfx_critico') o.destroy(); }); } catch (er) {}
        if (vivo(e) && !jefe && EP().aturdir) EP().aturdir(S, e, COMBO.aturde);
      }
      terminar();
    });
    return COMBO.lanza + COMBO.dura + 180;
  };

  window.CK_ABY_COMBO = { COMBO, NODO, ANIMS, tiempos };
})();
