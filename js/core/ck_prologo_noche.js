'use strict';
/* Prólogo de la historia nueva: la fiesta y la noche de los limos (10/11, documento "CastleKnight — Historia y guion",
   pedido del dueño: "el pueblo hace una bienvenida, decoran el pueblo y tiran fuegos artificiales"; "después del
   entrenamiento, el capitán nos pide limpiar las criaturas (slimes) del camino del castillo que aparecen en las noches;
   tenemos que esperar a que anochezca, mientras vamos al pueblo y reabastecemos"; Limo madre como jefa chica).
   Sólo en partidas NUEVAS (story.flags.v2).
   - LA FIESTA: mientras dure el prólogo (hasta limpiar el camino), de noche en la aldea hay fuegos artificiales sobre los
     techos y suena el tema "fiesta" (ck_musica_momentos.js). Lo de la taberna (brindis y payada) ya estaba (ck_prologo.js).
   - LA MISIÓN DE LOS LIMOS (antes de los aldeanos desaparecidos): al terminar el entrenamiento, Bruno manda limpiar de
     limos el Camino al Castillo; salen de noche. Objetivo: "Esperá la noche y limpiá el camino". Junto a la fogata del
     camino se puede esperar la noche (T). De noche, en el camino: tres oleadas de limos y al final la LIMO MADRE (grande,
     brilla, salta encima tuyo y al morir se parte en cuatro limos chicos). Cuando no queda ninguno: experiencia, monedas,
     y Pipo trae el mensaje de Bruno: tres vecinos salieron al campo y no volvieron (sigue ck_desaparecidos.js, igual que
     antes).
   Banderas: story.flags.limos = 'pendiente' | 'hecho'. Borrar la línea de index.html deja el prólogo de antes (el
   entrenamiento manda directo a buscar a los aldeanos). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZC = 'ed_camino_al_castillo.main', FOGATA = { x: 690, y: 400 };
  const OLEADAS = [5, 6, 7], MADRE = { escala: 2.6, vida: 12, saltoCada: 3600, hijos: 4 };
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const nueva = s => !!(s && s.flags && s.flags.v2);
  const pendiente = s => nueva(s) && fl(s).limos === 'pendiente';
  const enFiesta = s => nueva(s) && fl(s).limos !== 'hecho' && (s.step || 0) <= 2;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const noche = S => S.isNight && S.isNight();
  window.CK_PROLOGO_NOCHE = { pendiente: s => pendiente(s) };

  // ------------------------------------------------------------------ Bruno manda a los limos (en vez de a los aldeanos)
  const dlg0 = P.openDialog;
  P.openDialog = function (nombre, lineas, fin, cara) {
    try {
      const s = st(this);
      if (s && nueva(s) && nombre === 'Capitán Bruno' && Array.isArray(lineas) && !fl(s).limos &&
          lineas.some(l => /tres vecinos que faltan/.test(l))) {
        fl(s).limos = 'pendiente';
        arguments[1] = lineas.filter(l => !/tres vecinos que faltan|Campos del Roble/.test(l)).concat([
          'Ahora, tu primer trabajo de verdad. De noche, en el Camino al Castillo, salen los limos.',
          'Son babosos, lentos y tontos, pero de a muchos tumban un caballo. Los viajeros ya no quieren pasar.',
          'Andá cuando oscurezca y limpiá el camino. Si te sobra el día, pasá por la aldea: la tienda y la herrería te esperan.',
          'Y si te cansás de esperar, la fogata del camino es buen lugar para ver caer el sol.'
        ]);
      }
    } catch (e) {}
    return dlg0.apply(this, arguments);
  };
  const zt0 = P.showZoneTitle;
  P.showZoneTitle = function (t, sub) {
    try { const s = st(this); if (s && pendiente(s) && t === 'Entrenamiento completo') arguments[1] = 'La noche de los limos'; } catch (e) {}
    return zt0.apply(this, arguments);
  };
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = st(this), box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text');
      if (s && t && pendiente(s)) t.textContent = noche(this) ? 'Es de noche: limpiá de limos el Camino al Castillo' : 'Esperá a que anochezca y limpiá de limos el Camino al Castillo (en la fogata del camino se puede esperar)';
    } catch (e) {}
    return r;
  };
  // Bruno, si le hablás mientras tanto
  if (typeof STORY_NPCS !== 'undefined') {
    const CAP = STORY_NPCS.find(n => n.id === 'captain');
    if (CAP) {
      const l0 = CAP.lines;
      CAP.lines = function (s) {
        if (pendiente(s)) return ['Los limos salen de noche en el Camino al Castillo. Limpialo y después hablamos.', 'Babosos y lentos, sí. Pero no les des la espalda.'];
        return l0.apply(this, arguments);
      };
    }
  }

  // ------------------------------------------------------------------ esperar la noche junto a la fogata
  const enFogata = S => {
    const s = st(S); if (!s || !pendiente(s) || noche(S) || !S.currentZoneKey || S.currentZoneKey() !== ZC || !S.player) return false;
    const a = S.currentInterior && S.currentInterior.area; if (!a) return false;
    return Math.hypot(S.player.x - (a.x + FOGATA.x), S.player.y - (a.y + FOGATA.y)) < 70;
  };
  const in0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && enFogata(this)) {
        const fade = this.cameras.main;
        fade.fadeOut(700, 0, 0, 0);
        this.time.delayedCall(750, () => {
          // de la fase actual a la noche (0,64), siempre para adelante
          const p = this.dayPhase(), dest = 0.64, salto = ((dest - p + 1) % 1) * 300000;
          this.dayClock = (this.dayClock || 0) + salto;
          this.createFloatingText(this.player.x, this.player.y - 50, 'Cae la noche…', 0xc7d2fe);
          fade.fadeIn(900, 0, 0, 0);
          this.updateObjective && this.updateObjective();
        });
        return;
      }
    } catch (e) {}
    return in0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ los limos de la noche
  const libre = (S, cx, cy, rmin, rmax) => {
    for (let i = 0; i < 30; i++) {
      const a = R(0, Math.PI * 2), d = R(rmin, rmax), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7;
      if (!S.navIsFree || S.navIsFree(x, y, true)) return [x, y];
    }
    return null;
  };
  const traer = (S, tipo, n, cerca) => {
    const out = [], p = S.player;
    S._ckPermitirBestias = true;
    try {
      for (let i = 0; i < n; i++) {
        const q = cerca || libre(S, p.x, p.y + 20, 170, 300); if (!q) continue;
        const e = S.spawnEnemy(q[0], q[1] - 20, tipo); if (!e) continue;
        e.zone = ZC; e._ckLimoNoche = true; out.push(e);
        e.setAlpha(0); S.tweens.add({ targets: e, alpha: 1, duration: 500 });
        S.time.delayedCall(300 + i * 120, () => e.active && !e.isDead && S.alertEnemy(e));
      }
    } finally { S._ckPermitirBestias = false; }
    return out;
  };
  const madre = S => {
    const p = S.player, q = libre(S, p.x, p.y + 20, 180, 240) || [p.x + 180, p.y];
    const [e] = traer(S, 'slime', 1, q); if (!e) return null;
    e._ckLimoMadre = true;
    e.setScale((e.scale || 1) * MADRE.escala);
    e.maxHp = e.hp = Math.round(e.maxHp * MADRE.vida);
    e.setTint(0x9df5b5);
    if (e.body) { e.body.setSize(e.body.width * 1.6, e.body.height * 1.4); }
    e._ckSalto = S.time.now + 2500;
    S.cameras.main.shake(300, 0.006);
    S.showZoneTitle('La Limo Madre', '¡Cuidado con sus saltos!');
    son('slime_hit', 0.9, { rate: 0.5 }) || son('beast_growl', 0.6, { rate: 1.6 });
    return e;
  };
  const saltar = (S, e) => {
    if (!e.active || e.isDead || !S.player) return;
    const p = S.player.body, tx = p.center.x, ty = p.bottom - 3;
    const m = S.add.ellipse(tx, ty, 90, 50, 0x5ee08a, 0.18).setStrokeStyle(2, 0x5ee08a, 0.9).setDepth(9);
    S.tweens.add({ targets: m, alpha: { from: 0.4, to: 1 }, duration: 160, yoyo: true, repeat: 3 });
    e.isAttacking = true; e.setVelocity(0, 0);
    S.time.delayedCall(700, () => {
      if (!e.active || e.isDead) { m.destroy(); return; }
      const fx = e.x, fy = e.y, dx = tx - (e.body ? e.body.center.x : e.x), dy = ty - (e.body ? e.body.bottom : e.y), k = { t: 0 };
      if (e.body) e.body.enable = false;
      S.tweens.add({ targets: k, t: 1, duration: 560, ease: 'Sine.easeInOut',
        onUpdate: () => { e.setPosition(fx + dx * k.t, fy + dy * k.t - Math.sin(k.t * Math.PI) * 80); },
        onComplete: () => {
          m.destroy();
          if (!e.active || e.isDead) return;
          if (e.body) { e.body.enable = true; e.body.reset(e.x, e.y); }
          e.isAttacking = false;
          S.cameras.main.shake(220, 0.008);
          son('slime_hit', 0.9, { rate: 0.6 });
          if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'polvo', tx, ty, 45, 420);
          for (let i = 0; i < 10; i++) {
            const g = S.add.circle(tx, ty, R(2, 4), 0x7ff0a0, 0.9).setDepth(ty + 1);
            S.tweens.add({ targets: g, x: tx + R(-50, 50), y: ty + R(-20, 20), alpha: 0, duration: R(400, 700), onComplete: () => g.destroy() });
          }
          const pb = S.player.body;
          if (pb && Math.hypot((pb.center.x - tx) / 45, (pb.bottom - 3 - ty) / 26) < 1) S.damagePlayer(1);
        } });
    });
  };
  const limpiarNoche = S => { S._ckLimos = null; };
  const terminar = S => {
    const s = st(S); if (!s) return;
    fl(s).limos = 'hecho';
    S._ckLimos = null;
    s.coins = (s.coins || 0) + 30; S.gainXP(80);
    S.showZoneTitle('¡El camino está limpio!', 'Los viajeros van a poder pasar');
    try { S.saveStory && S.saveStory(); } catch (e) {}
    S.time.delayedCall(2600, () => {
      if (!S.player) return;
      S.openDialog('Pipo', [
        '¡Ahí estás! Te vi pelear desde el puente… ¡la madre de todos los limos! Nadie me lo va a creer.',
        'El Capitán Bruno me mandó a buscarte. Dice que muy bien hecho, pero que no hay tiempo de festejar.',
        'Tres vecinos salieron anoche al campo, al oeste de la aldea, y no volvieron.',
        'Están en los Campos del Roble, siguiendo unas luces raras. Dice Bruno que si las ves, no las sigas.'
      ], () => { S.updateObjective && S.updateObjective(); }, 'npc13_villager');
    });
  };
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      const s = st(this);
      if (!s || !pendiente(s) || !this.player || this.isDead) return r;
      const aqui = this.currentZoneKey && this.currentZoneKey() === ZC;
      if (!aqui) { if (this._ckLimos) limpiarNoche(this); return r; }
      // prompt de la fogata
      const pr = document.getElementById('ck-prompt');
      if (pr && enFogata(this) && !this.dialogOpen) { pr.textContent = 'T · Esperar la noche junto al fuego'; pr.classList.add('on'); }
      if (!noche(this) || this._ckEscena || this.dialogOpen) return r;
      const L = this._ckLimos || (this._ckLimos = { ola: -1, vivos: [], madre: null, espera: this.time.now + 1500 });
      L.vivos = L.vivos.filter(e => e.active && !e.isDead);
      if (L.madre && L.madre.active && !L.madre.isDead && this.time.now > L.madre._ckSalto) { L.madre._ckSalto = this.time.now + MADRE.saltoCada; saltar(this, L.madre); }
      if (L.vivos.length || this.time.now < L.espera) return r;
      if (L.ola === -1) { this.showZoneTitle('¡Limos en el camino!', 'Tres oleadas y algo más grande'); }
      L.ola++;
      if (L.ola < OLEADAS.length) { L.vivos = traer(this, 'slime', OLEADAS[L.ola]); L.espera = this.time.now + 1800; }
      else if (L.ola === OLEADAS.length) { const m = madre(this); L.madre = m; L.vivos = m ? [m] : []; L.espera = this.time.now + 1000; }
      else if (!L.terminado) { L.terminado = true; terminar(this); }
    } catch (e) { console.warn('[prólogo noche]', e); }
    return r;
  };
  // la madre se parte en limos chicos
  const ven0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    // en las partidas nuevas el paso 2 no se termina matando bestias en el camino (era el "limpiar el camino" viejo)
    const s0 = st(this), cuenta = s0 && nueva(s0) && s0.step === 2 ? s0.count : null;
    if (cuenta !== null) s0.count = -1e9;
    let r;
    try { r = ven0 ? ven0.apply(this, arguments) : undefined; } finally { if (cuenta !== null && s0.count < -1e8) s0.count = cuenta; }
    try {
      if (enemy && enemy._ckLimoMadre && this._ckLimos) {
        const x = enemy.body ? enemy.body.center.x : enemy.x, y = enemy.body ? enemy.body.bottom : enemy.y;
        this.cameras.main.shake(260, 0.008);
        const hijos = [];
        for (let i = 0; i < MADRE.hijos; i++) {
          const a = i / MADRE.hijos * Math.PI * 2;
          const q = [x + Math.cos(a) * 34, y + Math.sin(a) * 22];
          hijos.push(...traer(this, 'slime', 1, this.navIsFree && !this.navIsFree(q[0], q[1], true) ? null : q));
        }
        hijos.forEach(h => { h.setScale((h.scale || 1) * 0.75); h.maxHp = h.hp = Math.max(1, Math.round(h.maxHp * 0.5)); });
        this._ckLimos.vivos.push(...hijos);
        this._ckLimos.madre = null;
        this.createFloatingText(x, y - 60, '¡Se partió!', 0x86efac);
      }
    } catch (e) { console.warn('[limo madre]', e); }
    return r;
  };

  // ------------------------------------------------------------------ la fiesta: fuegos artificiales sobre la aldea
  const COLORES = [0xffd166, 0xff6b6b, 0x6bc7ff, 0xb98bff, 0x7dffa1, 0xffffff];
  const punto = S => {
    if (S.textures.exists('ckf_punto')) return 'ckf_punto';
    const t = S.textures.createCanvas('ckf_punto', 3, 3), g = t.getContext();
    g.fillStyle = '#ffffff'; g.fillRect(1, 0, 1, 3); g.fillRect(0, 1, 3, 1); t.refresh(); return 'ckf_punto';
  };
  const cohete = S => {
    const v = S.cameras.main.worldView, k = punto(S), col = COLORES[Math.floor(Math.random() * COLORES.length)];
    const x0 = v.x + R(v.width * 0.15, v.width * 0.85), y0 = v.y + v.height * 0.62, y1 = v.y + R(v.height * 0.12, v.height * 0.32);
    const c = S.add.image(x0, y0, k).setTint(0xffe7b0).setDepth(27460).setBlendMode(Phaser.BlendModes.ADD);
    son('ck_silbido', 0.18, { rate: R(1.3, 1.7), minGap: 300 });
    const estela = S.time.addEvent({ delay: 40, loop: true, callback: () => {
      if (!c.active) return;
      const t = S.add.image(c.x + R(-1, 1), c.y + 3, k).setTint(0xffb36b).setAlpha(0.7).setDepth(27459).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: t, alpha: 0, y: t.y + 6, duration: 360, onComplete: () => t.destroy() });
    } });
    S.tweens.add({ targets: c, y: y1, x: x0 + R(-20, 20), duration: R(800, 1100), ease: 'Quad.easeOut', onComplete: () => {
      estela.remove(); c.destroy();
      son('ck_explosion', 0.22, { rate: R(1.4, 1.9), minGap: 120 });
      const n = 48, r = R(60, 105), doble = Math.random() < 0.35;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + R(-0.05, 0.05), d = r * R(0.8, 1.05);
        const q = S.add.image(x0, y1, k).setTint(doble && i % 2 ? 0xffffff : col).setDepth(27460).setBlendMode(Phaser.BlendModes.ADD).setScale(R(1.2, 2));
        S.tweens.add({ targets: q, x: x0 + Math.cos(a) * d, y: y1 + Math.sin(a) * d + 14, duration: R(900, 1300), ease: 'Quad.easeOut' });
        S.tweens.add({ targets: q, alpha: 0, scale: 0.3, delay: R(500, 800), duration: R(500, 800), onComplete: () => q.destroy() });
      }
      const fl2 = S.add.circle(x0, y1, r * 0.6, col, 0.18).setDepth(27455).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: fl2, alpha: 0, scale: 1.6, duration: 600, onComplete: () => fl2.destroy() });
    } });
  };
  const ev0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = ev0.apply(this, arguments);
    try {
      const s = st(this), enAldea = this.currentZoneKey && this.currentZoneKey() === 'village';
      const fiesta = s && enFiesta(s) && enAldea && noche(this) && !this.isDead;
      if (fiesta && this.time.now > (this._ckCohete || 0)) { this._ckCohete = this.time.now + R(900, 2000); cohete(this); }
      // la música la elige musicForZone en cada cuadro: sólo hay que fijar el tema (y soltarlo después)
      const M = window.CK_MUSICA_MOMENTOS;
      if (M && fiesta && this._ckMusicaFija !== 'fiesta') { M.fijar(this, 'fiesta'); this._ckFiestaMusica = true; }
      else if (M && !fiesta && this._ckFiestaMusica) { this._ckFiestaMusica = false; M.fijar(this, null); }
    } catch (e) {}
    return r;
  };
})();
