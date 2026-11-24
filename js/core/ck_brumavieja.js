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
   Banderas: bruma_vecinos (habló de día), bruma_noche (emboscada ganada). Borrar la línea de index.html lo saca.
   v2 (23/11, nota 10 del dueño, en el Norte del Roble: "la emboscada de Brumavieja es en esta parte; algunos aldeanos nos darán
   info y cuando investiguemos y volvamos al centro se nos acercarán aldeanos y se transformarán y atacarán"):
   - La emboscada pasa al NORTE DEL ROBLE, en el cruce del centro (653-900, 401-565). Ya no depende de la noche.
   - Desde que el Rey da el permiso del portón del norte (ck_norte_roble.js) hasta la emboscada, Marta, Ciro y Doña Inés están
     en el cruce: dicen que escaparon de Brumavieja, hablan raro y mandan a mirar las casas (la quemada del este, la
     abandonada del oeste).
   - "Investigar": después de hablar con alguno, entrar a una de esas dos casas (story.flags.norte_inv).
   - Al volver al cruce, los tres se acercan ("¿Encontró algo, forastero?"…), Doña Inés: "Viniste. Sabíamos que ibas a
     volver…", y los tres se TRANSFORMAN en esqueletos; de la tierra suben seis más. La gente que haya corre a esconderse.
   - Al limpiarla: bruma_noche (como antes: Aby interrumpe al volver a la aldea), monedas y experiencia. Tobías, en
     Brumavieja, habla de "los del Norte del Roble". */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = 'ed_norte_del_roble.main', ZONAS = [Z];                                    // (v2) el Norte del Roble
  const CASAS = ['ed_casa_quemada_norte.main', 'ed_casa_peste.main'];                     // (v2) las dos casas del cruce
  const CRUCE = { x0: 653, y0: 401, x1: 900, y1: 565 };                                    // (v2) donde los vecinos se acercan
  const enZona = S => ZONAS.indexOf(S.currentZoneKey && S.currentZoneKey()) >= 0;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const E = () => window.CK_ESCENA;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const noche = S => S.isNight && S.isNight();
  // (v2) en el cruce del Norte del Roble
  const VECINOS = [
    { id: 'bv_marta', tex: 'npc4_villager', x: 700, y: 478, nombre: 'Marta, la de las ovejas', dia: [
      'Buen día, buen día. Venimos de Brumavieja, ¿sabe? Nos fuimos cuando bajó la niebla. ¿O fue antes? No me acuerdo.',
      '¿Usted vio mis ovejas? En la casa quemada, la del este, dormimos la primera noche. Quedaron cosas de los que se fueron. Vaya a ver, vaya.'] },
    { id: 'bv_ciro', tex: 'npc9_villager', x: 840, y: 490, nombre: 'Ciro, el herrero', dia: [
      '¿Herrero? No, yo nunca fui herrero. Bueno… sí. A veces. Cuando hacía falta.',
      'El encapuchado de la capilla es buena gente. Nos cuida. Los que faltan dejaron todo en la casa vieja del oeste: fíjese ahí, que nosotros no entramos.'] },
    { id: 'bv_ines', tex: 'npc5_villager', x: 772, y: 538, nombre: 'Doña Inés', dia: [
      'Los que faltan se fueron al norte. Se fueron contentos. Volvieron distintos, pero contentos.',
      'Entre a las casas, m\'hijo. Mire bien. Después venga, que lo esperamos acá, en el medio. Todos.'] }
  ];
  const NOCHE = { x: 772, y: 480 };   // (v1: junto al pozo de Brumavieja; v2: el medio del cruce)
  const abierto = s => (window.CK_NORTE_ROBLE ? CK_NORTE_ROBLE.abierto(s) : s.step >= 4);
  const diaActivo = s => !!(s && abierto(s) && s.step >= 3 && s.step <= 7 && !fl(s).bruma_noche && !fl(s).c2);
  const hablo = s => Object.keys(fl(s).bruma_vecinos || {}).length > 0;
  const lista = s => diaActivo(s) && hablo(s) && !!fl(s).norte_inv;

  // ------------------------------------------------------------------ quién se puede hablar
  ZONAS.forEach(Zn => VECINOS.forEach((v, i) => STORY_NPCS.push({
    id: v.id, zone: Zn, x: v.x, y: v.y - 10, r: 40, name: v.nombre, face: v.tex,
    _ckActivo: S => { const s = st(S); return !!(s && diaActivo(s) && !S._ckBruma); },
    lines: () => v.dia
  })));
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
      if (s.step === 4 && !fl(s).bruma_noche) return ['¿Te cruzaste con Marta, Ciro e Inés en el Norte del Roble? No les creas nada.', 'A los tres los enterré yo, con estas manos, el invierno pasado.'].concat(L);
      if (s.step >= 5 && !fl(s).bruma_noche) return L.concat(['Y si volvés al Norte del Roble… no te les acerques. Por lo que más quieras.']);
      if (s.step === 4 && fl(s).bruma_noche) return ['¿Marta, Ciro, Inés? ¿En el Norte del Roble? A los tres los enterré yo el invierno pasado. El encapuchado los hace caminar.'].concat(L);
      if (fl(s).bruma_noche && s.step < 7) return ['Eran ellos… Siempre fueron ellos. Andá con cuidado: el encapuchado ya sabe que estás acá.'].concat(L.slice(-1));
      return L;
    };
  }

  // ------------------------------------------------------------------ dibujarlos
  const quitar = S => { (S._ckBV || []).forEach(o => { try { o.destroy(); } catch (e) {} }); S._ckBV = []; };
  const dibujar = S => {
    quitar(S);
    const s = st(S); if (!s || !E() || !enZona(S)) return;
    S._ckBVvec = [];
    if (diaActivo(s) && !S._ckBruma) {                // (v2) de día o de noche, hasta la emboscada
      VECINOS.forEach((v, i) => {
        if (!S.textures.exists(v.tex)) return;
        const sp = E().actor(S, v.tex, v.x, v.y, { flip: i === 1 });
        sp.setTint(0xe6e0d6);                          // un poco pálidos, nada más
        S._ckBV.push(sp); S._ckBVvec.push(sp);
        // de vez en cuando se quedan mirando al héroe, quietos
        sp._ckVaiven = S.tweens.add({ targets: sp, angle: i % 2 ? 2 : -2, duration: 2200 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    }
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0.apply(this, arguments);
    try {
      this._ckBVfase = null; this._ckBruma = null; dibujar(this);
      // (v2) investigar: entrar a una de las casas del cruce después de hablar con los vecinos
      const s = st(this), z = this.currentZoneKey && this.currentZoneKey();
      if (s && CASAS.indexOf(z) >= 0 && diaActivo(s) && hablo(s) && !fl(s).norte_inv) { fl(s).norte_inv = true; this.saveStory && this.saveStory(); }
    } catch (e) { console.warn('[brumavieja]', e); }
    return r;
  };
  // si cambia de día a noche estando ahí, se vuelve a armar
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      const s = st(this);
      if (s && enZona(this)) {
        if (this._ckBruma) vigilar(this);
        // (v2) de vuelta en el cruce, después de investigar: se acercan
        else if (lista(s) && !this._ckEscena && !this.dialogOpen && this.player && this.currentInterior) {
          const a = this.currentInterior.area, b = this.player.body, px = (b ? b.center.x : this.player.x) - a.x, py = (b ? b.bottom : this.player.y) - a.y;
          if (px > CRUCE.x0 && px < CRUCE.x1 && py > CRUCE.y0 && py < CRUCE.y1) emboscada(this);
        }
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
  // (v2) se acercan los tres, hablan y se transforman
  const emboscada = S => {
    const e = E(), s = st(S); if (!e || !s || S._ckBruma || S._ckBVacerca) return;
    const vec = (S._ckBVvec || []).filter(o => o && o.active); if (vec.length < 3) { dibujar(S); return; }
    S._ckBVacerca = true;
    vec.forEach(o => { if (o._ckVaiven) o._ckVaiven.remove(); o.setAngle(0); });
    const p = S.player, lados = [[-46, -8], [46, -6], [0, 34]];
    e.correr(S, async () => {
      await e.camara(S, p.x - S.currentInterior.area.x, p.y - S.currentInterior.area.y - 10, 700, { mundo: false });
      const va = vec.map((o, i) => e.caminar(S, o, p.x + lados[i][0], p.y + lados[i][1], 34, { mundo: true }));
      await e.globo(S, vec[0], '¿Encontró algo, forastero?', 1700);
      await e.globo(S, vec[1], 'No tendría que haber entrado ahí…', 1700);
      await Promise.all(va);
      vec.forEach(o => o.setFlipX(o.x > p.x));
      son('ck_fantasma_susurro', 0.7);
      await e.dialogo(S, 'Doña Inés', ['Viniste. Sabíamos que ibas a volver…', 'Quedate con nosotros. Acá ya no se muere nadie.', 'Ya no.'], 'npc5_villager');
    }).then(() => { S._ckBVacerca = false; transformar(S); }).catch(() => { S._ckBVacerca = false; transformar(S); });
  };
  const transformar = S => {
    const s = st(S); if (!s || S._ckBruma) return;
    const vec = (S._ckBVvec || []).filter(o => o && o.active);
    const sp = S._ckBVnoche && S._ckBVnoche.active ? S._ckBVnoche : vec[vec.length - 1]; if (!sp) return;
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
    // (v2) los otros dos, ahí mismo: humo verde y huesos
    const otros = vec.filter(o => o !== sp).map(o => ({ x: o.x, y: o.y }));
    otros.forEach(q => { for (let i = 0; i < 8; i++) { const c = S.add.circle(q.x + R(-10, 10), q.y - R(0, 30), R(3, 6), 0x7cf0a0, 0.6).setDepth(q.y + 1).setBlendMode(1); S.tweens.add({ targets: c, y: c.y - R(20, 50), alpha: 0, scale: 2, duration: R(500, 900), onComplete: () => c.destroy() }); } });
    vec.forEach(o => { if (o !== sp) S.tweens.add({ targets: o, alpha: 0, duration: 380 }); });
    S.tweens.add({ targets: sp, alpha: 0, duration: 380, onComplete: () => quitar(S) });
    S.time.delayedCall(350, () => {
      const L = S._ckBruma.vivos;
      const e = traer(S, 'skeleton', x, y, false); if (e) L.push(e);
      S.showZoneTitle('¡Emboscada!', 'Los vecinos eran huesos');
      otros.forEach((q, i) => S.time.delayedCall(150 + i * 200, () => { const k = traer(S, i ? 'skeleton_armored' : 'skeleton', q.x, q.y, false); if (k) L.push(k); }));
      // y de la tierra suben seis más alrededor
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
    S.showZoneTitle('Norte del Roble', 'Los vecinos eran huesos');
    try { S.saveStory && S.saveStory(); } catch (e) {}
    // (v2) en el Norte del Roble no está Tobías: lo que quedó en el piso lo dice
    S.time.delayedCall(2200, () => {
      if (S.player) S.createFloatingText(S.player.x, S.player.y - 56, 'Entre los huesos, tierra de tumba… y un rastro verde hacia el norte, a Brumavieja', 0xd9f99d);
      S._ckBruma = null; S.updateObjective && S.updateObjective();
    });
  };
  const tk0 = P.onTalked;
  P.onTalked = function (id) {
    const r = tk0.apply(this, arguments);
    try {
      if (/^bv_(marta|ciro|ines)$/.test(id)) { const s = st(this); if (s) { const h = fl(s).bruma_vecinos || (fl(s).bruma_vecinos = {}); h[id] = true; } }
    } catch (e) { console.warn('[brumavieja]', e); }
    return r;
  };
  window.CK_BRUMAVIEJA = { VECINOS, NOCHE, CRUCE, CASAS, transformar, emboscada, diaActivo, lista };
})();
