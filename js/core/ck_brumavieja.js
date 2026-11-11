'use strict';
/* Brumavieja de día y de noche (11/11, historia nueva, Capítulo 1; pedido del dueño: "vamos a investigar, hablamos con
   los aldeanos del norte y nos dan algo de información, pero descubrimos que son esqueletos infiltrados: cuando volvamos
   de noche y no estén, y cuando hablemos con uno se transforme en esqueleto y nos embosquen; ahí pueden aparecer varios,
   de los simples"; "quiero que los NPC reaccionen a los enemigos, que huyan y se oculten").
   - DE DÍA (mientras se investiga Brumavieja, pasos 4 a 6): tres vecinos en la plaza — Marta, Ciro y Doña Inés —
     que hablan raro y se contradicen. Tobías avisa: "No les creas nada. A los tres los enterré yo el invierno pasado."
   - DE NOCHE (después de hablar con Tobías): la plaza está vacía salvo uno de ellos, quieto junto al pozo, pálido. Si le
     hablás (T): "Viniste. Sabíamos que ibas a venir…" y se TRANSFORMA en esqueleto; los otros dos salen de las sombras
     también hechos huesos y del cementerio suben seis más: EMBOSCADA. Mientras dura, Tobías se esconde en su casa
     (y lo que quede de gente en el mapa corre a esconderse).
   - Al limpiar la emboscada: Tobías asoma ("¡Te lo dije!"), experiencia y monedas, y el Rey ya sabe la verdad
     (story.flags.bruma_noche). Lo demás del capítulo sigue igual (la llave del Gran Esqueleto y la capilla).
   Banderas: bruma_vecinos (habló de día), bruma_noche (emboscada ganada). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = 'ruins.village', ZONAS = ['ruins.village', 'ed_aldea_en_ruinas.main'];   // la de la historia y el mapa del Taller suelto
  const enZona = S => ZONAS.indexOf(S.currentZoneKey && S.currentZoneKey()) >= 0;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const E = () => window.CK_ESCENA;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const noche = S => S.isNight && S.isNight();
  const VECINOS = [
    { id: 'bv_marta', tex: 'npc4_villager', x: 384, y: 330, nombre: 'Marta, la de las ovejas', dia: [
      'Buen día, buen día. ¿Usted vio mis ovejas? Hace mucho que no las veo… o no tengo ovejas. No me acuerdo.',
      'Acá nunca pasó nada, forastero. Nunca. La niebla es linda de noche, ¿sabe? Abriga.'] },
    { id: 'bv_ciro', tex: 'npc9_villager', x: 516, y: 318, nombre: 'Ciro, el herrero', dia: [
      '¿Herrero? No, yo nunca fui herrero. Bueno… sí. A veces. Cuando hacía falta.',
      'El encapuchado de la capilla es buena gente. Nos cuida. De noche, sobre todo, nos cuida.'] },
    { id: 'bv_ines', tex: 'npc5_villager', x: 548, y: 418, nombre: 'Doña Inés', dia: [
      'Los que faltan se fueron al norte. Se fueron contentos. Volvieron distintos, pero contentos.',
      'Vuelva de noche, m\'hijo, que hay fiesta en la plaza. Vamos a estar todos. Todos.'] }
  ];
  const NOCHE = { x: 452, y: 352 };   // junto al pozo
  const diaActivo = s => s && s.step >= 4 && s.step <= 6 && !fl(s).bruma_noche;
  const nocheActiva = s => s && s.step >= 5 && !fl(s).bruma_noche;

  // ------------------------------------------------------------------ quién se puede hablar
  ZONAS.forEach(Zn => VECINOS.forEach((v, i) => STORY_NPCS.push({
    id: v.id, zone: Zn, x: v.x, y: v.y - 10, r: 40, name: v.nombre, face: v.tex,
    _ckActivo: S => { const s = st(S); return !!(s && diaActivo(s) && !noche(S)); },
    lines: () => v.dia
  })));
  ZONAS.forEach(Zn => STORY_NPCS.push({
    id: 'bv_noche', zone: Zn, x: NOCHE.x, y: NOCHE.y - 10, r: 44, name: 'Doña Inés', face: 'npc5_villager',
    _ckActivo: S => { const s = st(S); return !!(s && nocheActiva(s) && noche(S) && !S._ckBruma); },
    lines: () => ['Viniste. Sabíamos que ibas a venir…', 'Quedate con nosotros. Acá ya no se muere nadie.', 'Ya no.']
  }));
  const nb0 = P.nearbyStoryNPC;
  P.nearbyStoryNPC = function () {
    let r = nb0.apply(this, arguments), guard = 0;
    while (r && r.npc._ckActivo && !r.npc._ckActivo(this) && guard++ < 8) {
      const n = r.npc, z = n.zone; n.zone = '__no__';
      try { r = nb0.apply(this, arguments); } finally { n.zone = z; }
      if (r && r.npc === n) r = null;
    }
    // si quedó un apagado al final de la cadena, nadie
    if (r && r.npc._ckActivo && !r.npc._ckActivo(this)) r = null;
    return r;
  };
  // Tobías avisa
  const TOB = STORY_NPCS.find(n => n.id === 'hermit');
  if (TOB) {
    const l0 = TOB.lines;
    TOB.lines = function (s) {
      const L = l0.apply(this, arguments) || [];
      if (s.step === 4 && !fl(s).bruma_noche) return ['¿Hablaste con los de la plaza? No les creas nada.', 'A Marta, a Ciro y a Inés los enterré yo, con estas manos, el invierno pasado.'].concat(L);
      if (s.step >= 5 && !fl(s).bruma_noche) return L.concat(['Y si volvés de noche… no les hables. Por lo que más quieras, no les hables.']);
      if (fl(s).bruma_noche && s.step < 7) return ['Eran ellos… Siempre fueron ellos. Andá con cuidado: el encapuchado ya sabe que estás acá.'].concat(L.slice(-1));
      return L;
    };
  }

  // ------------------------------------------------------------------ dibujarlos
  const quitar = S => { (S._ckBV || []).forEach(o => { try { o.destroy(); } catch (e) {} }); S._ckBV = []; };
  const dibujar = S => {
    quitar(S);
    const s = st(S); if (!s || !E() || !enZona(S)) return;
    if (diaActivo(s) && !noche(S)) {
      VECINOS.forEach((v, i) => {
        if (!S.textures.exists(v.tex)) return;
        const sp = E().actor(S, v.tex, v.x, v.y, { flip: i === 1 });
        sp.setTint(0xe6e0d6);                          // un poco pálidos, nada más
        S._ckBV.push(sp);
        // de vez en cuando se quedan mirando al héroe, quietos
        S.tweens.add({ targets: sp, angle: i % 2 ? 2 : -2, duration: 2200 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    } else if (nocheActiva(s) && noche(S) && !S._ckBruma) {
      const v = VECINOS[2];
      if (!S.textures.exists(v.tex)) return;
      const sp = E().actor(S, v.tex, NOCHE.x, NOCHE.y);
      sp.setTint(0xb9d8c8); sp.setAlpha(0.92);
      const halo = S.add.ellipse(sp.x, sp.y - 2, 30, 10, 0x7cf0a0, 0.25).setDepth(sp.depth - 1).setBlendMode(1);
      S.tweens.add({ targets: halo, alpha: 0.06, scaleX: 1.4, duration: 1100, yoyo: true, repeat: -1 });
      S._ckBV.push(sp, halo); S._ckBVnoche = sp;
    }
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0.apply(this, arguments);
    try { this._ckBVfase = null; this._ckBruma = null; dibujar(this); } catch (e) { console.warn('[brumavieja]', e); }
    return r;
  };
  // si cambia de día a noche estando ahí, se vuelve a armar
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      const s = st(this);
      if (s && enZona(this)) {
        const fase = noche(this) ? 'n' : 'd';
        if (this._ckBVfase !== fase && !this._ckBruma) { this._ckBVfase = fase; dibujar(this); }
        if (this._ckBruma) vigilar(this);
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ la emboscada
  const traer = (S, tipo, x, y, sube) => {
    S._ckPermitirBestias = true;
    try {
      const e = S.spawnEnemy(x, y - 20, tipo); if (!e) return null;
      e.zone = S.currentZoneKey(); e._ckBruma = true;
      if (sube) { e.setAlpha(0); e.y += 10; S.tweens.add({ targets: e, alpha: 1, y: e.y - 10, duration: 700 }); }
      S.time.delayedCall(sube ? 700 : 200, () => e.active && !e.isDead && S.alertEnemy(e));
      return e;
    } finally { S._ckPermitirBestias = false; }
  };
  const libreCerca = (S, x, y, rmin, rmax) => {
    for (let i = 0; i < 30; i++) {
      const a = R(0, Math.PI * 2), d = R(rmin, rmax), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7;
      if (!S.navIsFree || S.navIsFree(px, py, true)) return [px, py];
    }
    return [x + rmin, y];
  };
  const transformar = S => {
    const s = st(S); if (!s || S._ckBruma) return;
    const sp = S._ckBVnoche; if (!sp || !sp.active) return;
    S._ckBruma = { vivos: [], fin: false };
    S.cameras.main.shake(400, 0.008); S.cameras.main.flash(250, 140, 255, 170);
    son('necro_cast', 0.8) || son('bone_hit', 0.8, { rate: 0.6 });
    S.createFloatingText(sp.x, sp.y - 50, '¡No era ella!', 0xa7f3d0);
    // se deshace: sube un humo verde y queda el esqueleto
    for (let i = 0; i < 12; i++) {
      const c = S.add.circle(sp.x + R(-10, 10), sp.y - R(0, 30), R(3, 6), 0x7cf0a0, 0.6).setDepth(sp.depth + 1).setBlendMode(1);
      S.tweens.add({ targets: c, y: c.y - R(20, 50), alpha: 0, scale: 2, duration: R(500, 900), onComplete: () => c.destroy() });
    }
    const x = sp.x, y = sp.y;
    S.tweens.add({ targets: sp, alpha: 0, duration: 380, onComplete: () => quitar(S) });
    S.time.delayedCall(350, () => {
      const L = S._ckBruma.vivos;
      const e = traer(S, 'skeleton', x, y, false); if (e) L.push(e);
      S.showZoneTitle('¡Emboscada!', 'Los vecinos de Brumavieja eran huesos');
      // los otros dos, de las sombras de la plaza
      [VECINOS[0], VECINOS[1]].forEach((v, i) => S.time.delayedCall(500 + i * 400, () => { const a = S.currentInterior.area; const q = traer(S, 'skeleton', a.x + v.x, a.y + v.y, true); if (q) L.push(q); }));
      // y del cementerio suben seis más alrededor
      for (let i = 0; i < 6; i++) S.time.delayedCall(1300 + i * 380, () => {
        if (!S._ckBruma) return;
        const p = S.player, [px, py] = libreCerca(S, p.x, p.y + 16, 120, 230);
        const tierra = S.add.ellipse(px, py, 26, 9, 0x2a1d14, 0.8).setDepth(py - 2);
        S.tweens.add({ targets: tierra, alpha: 0, delay: 1400, duration: 800, onComplete: () => tierra.destroy() });
        const q = traer(S, i % 3 === 2 ? 'skeleton_archer' : 'skeleton', px, py, true); if (q) L.push(q);
      });
      // la gente que quede en el mapa corre a esconderse
      esconderGente(S);
    });
  };
  const esconderGente = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a || !S.children) return;
    S.children.list.filter(o => o.type === 'Sprite' && o.active && o.visible && !o.def && o !== S.player && /_villager$/.test(o.texture && o.texture.key || '') && !(S._ckBV || []).includes(o))
      .forEach(o => {
        S.createFloatingText(o.x, o.y - 40, '¡Huesos!', 0xfde68a);
        const dx = o.x < a.x + a.w / 2 ? -1 : 1;
        if (o.anims && S.anims.exists((o._ckAnim || o.texture.key.replace(/_villager$/, '')) + '_walk')) o.play((o._ckAnim || o.texture.key.replace(/_villager$/, '')) + '_walk', true);
        o.setFlipX(dx < 0);
        S.tweens.add({ targets: o, x: o.x + dx * 140, duration: 1400, onComplete: () => S.tweens.add({ targets: o, alpha: 0, duration: 400, onComplete: () => o.setVisible(false) }) });
      });
  };
  const vigilar = S => {
    const B = S._ckBruma; if (!B || B.fin) return;
    if (S.time.now < (B.desde || (B.desde = S.time.now + 4500))) return;    // esperar a que suban todos
    B.vivos = B.vivos.filter(e => e.active && !e.isDead);
    if (B.vivos.length) return;
    B.fin = true;
    const s = st(S); if (!s) return;
    fl(s).bruma_noche = true;
    s.coins = (s.coins || 0) + 40; S.gainXP && S.gainXP(120);
    S.showZoneTitle('Brumavieja', 'Ya sabés la verdad');
    try { S.saveStory && S.saveStory(); } catch (e) {}
    S.time.delayedCall(2200, () => {
      S.openDialog('Tobías, el último aldeano', [
        '¡Te lo dije! Eran ellos… siempre fueron ellos. Los vi salir de las tumbas la primera noche de niebla.',
        'El encapuchado de la capilla los hace caminar y les presta la cara que tenían.',
        'Contale al Rey. Y cuidate: ahora el encapuchado ya sabe que estás acá.'
      ], () => { S._ckBruma = null; S.updateObjective && S.updateObjective(); }, 'npc2_villager');
    });
  };
  const tk0 = P.onTalked;
  P.onTalked = function (id) {
    const r = tk0.apply(this, arguments);
    try {
      if (id === 'bv_noche') transformar(this);
      if (/^bv_(marta|ciro|ines)$/.test(id)) { const s = st(this); if (s) { const h = fl(s).bruma_vecinos || (fl(s).bruma_vecinos = {}); h[id] = true; } }
    } catch (e) { console.warn('[brumavieja]', e); }
    return r;
  };
  window.CK_BRUMAVIEJA = { VECINOS, NOCHE, transformar };
})();
