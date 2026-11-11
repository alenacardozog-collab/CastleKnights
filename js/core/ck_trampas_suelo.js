'use strict';
/* Trampas del suelo (10/11, pedido del dueño: "las partes donde hay trampas quiero que sean animadas"). Para las cuevas
   (y cualquier mapa): cada nivel llama CK_TRAMPAS_SUELO.zona('ed_<mapa>.main', [ …trampas… ]) con coordenadas del mapa.
   - CEPO { tipo: 'cepo', x, y } (x, y: el pie del dibujo). Armado se ve abierto en el piso. Si el héroe lo pisa, se cierra
     de golpe (3 cuadros): saca 1 corazón y lo deja agarrado 1,2 s. Las bestias también caen (2 de daño y quedan quietas
     2 s): se las puede llevar hasta un cepo. Con T al lado (sin pisarlo) se desarma; un golpe también lo cierra sin daño.
     Cerrado queda cerrado hasta que se vuelve a entrar a la zona.
   - FOSA { tipo: 'fosa', x, y }: ramas y hojas tapando un pozo con estacas. Al pisarla se hunde: 1 corazón y el héroe
     vuelve al último lugar seguro. Abierta queda a la vista y ya no se pisa (empuja para afuera). Una bestia que la pisa
     también cae (3 de daño).
   - DERRUMBE { tipo: 'derrumbe', cajas: [[x0, y0, x1, y1], …] }: el techo agrietado. Adentro, cada 1,6-2,6 s caen 2 o 3
     piedras: primero la sombra (que crece), después la piedra, polvo y temblor. Si cae encima: 1 corazón. Las grietas
     del suelo avisan; corriendo (o con dash) se pasa.
   - BARRICADA { tipo: 'barricada', id, x, y, golpes, choque: [x, y, w, h], rotaEn: [x, y] }: troncos y estacas de los
     orcos que cierran el paso. Se rompe a golpes (J, K, giro, magia, flechas); rota queda rota en la partida.
   Animaciones de PixelLab: el cepo que se cierra (7 cuadros), la fosa que se hunde (7) y la nube de polvo de cada
   golpe contra el piso (piedras, fosa, barricada). El arte está en ck_trampas_suelo_arte.js. Borrar las dos líneas de index.html saca las trampas (los mapas quedan igual,
   sin trampas ni barricada). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_TRAMPAS_SUELO_ARTE) return;
  const P = MainGameScene.prototype, ARTE = window.CK_TRAMPAS_SUELO_ARTE, ZONAS = {};
  const CEPO = { radio: [17, 10], agarra: 1200, bestia: 2, bestiaQuieta: 2000, desarmar: 36 };
  const FOSA = { mitad: [21, 17] };
  const ROCA = { cada: [1600, 2600], sombra: 750, cae: 260, radio: 17 };
  const azar = (a, b) => a + Math.random() * (b - a);
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const facil = () => { try { return window.CK_DIFICULTAD && CK_DIFICULTAD.actual() === 'facil'; } catch (e) { return false; } };
  const IMG = {}; Object.keys(ARTE).forEach(k => { const im = new Image(); im.src = ARTE[k].img; IMG[k] = im; });
  const tex = (S, k) => {
    const key = 'cktsu_' + k;
    if (S.textures.exists(key)) return key;
    const im = IMG[k]; if (!im || !im.complete || !im.naturalWidth) return null;
    if (ARTE[k].n) S.textures.addSpriteSheet(key, im, { frameWidth: ARTE[k].fw, frameHeight: ARTE[k].fh }); else S.textures.addImage(key, im);
    return key;
  };
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const piesDe = e => ({ x: e.body ? e.body.center.x : e.x, y: e.body ? e.body.bottom : e.y });
  const vivo = e => e && e.active && !e.isDead;
  const zonaDe = S => { const z = S.currentZoneKey ? S.currentZoneKey() : ''; return ZONAS[z] ? z : null; };
  const herir = (S, n, txt) => {
    if (S.isDead) return;
    S._ckTSuUlt = txt;
    try { S.damagePlayer(facil() ? Math.max(1, n - 1) : n); } catch (e) {}
    if (txt) S.createFloatingText(S.player.x, S.player.y - 50, txt, 0xfca5a5);
  };
  const polvo = (S, x, y, n, col) => {
    for (let i = 0; i < n; i++) {
      const c = S.add.circle(x + azar(-8, 8), y + azar(-3, 2), azar(2, 4), col || 0x8b7b66, 0.75).setDepth(y + 2);
      S.tweens.add({ targets: c, x: c.x + azar(-22, 22), y: c.y - azar(4, 14), alpha: 0, scale: 2, duration: azar(380, 650), ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
  };

  // cuadros de una hoja, uno tras otro (se queda en el último)
  const cuadros = (S, sp, de, a, ms) => { for (let f = de; f <= a; f++) S.time.delayedCall((f - de) * ms, () => { if (sp.active) sp.setFrame(f); }); };
  // la nube de polvo animada (PixelLab) donde algo golpea el piso
  const nube = (S, x, y, esc) => {
    const k = tex(S, 'polvo'); if (!k) return;
    const sp = S.add.sprite(x, y, k, 0).setOrigin(0.5, ARTE.polvo.pie / ARTE.polvo.fh).setScale(esc || 1).setDepth(y + 3);
    cuadros(S, sp, 0, ARTE.polvo.n - 1, 60);
    S.time.delayedCall(ARTE.polvo.n * 60 + 20, () => { try { sp.destroy(); } catch (e) {} });
  };

  // ------------------------------------------------------------------ poner y sacar
  const limpiar = S => { (S._ckTSu || []).forEach(t => { try { t.sp && t.sp.destroy(); t.zona && t.zona.destroy(); (t.restos || []).forEach(r => r.destroy()); } catch (e) {} }); S._ckTSu = []; };
  const poner = S => {
    limpiar(S);
    const z = zonaDe(S); if (!z || !S.currentInterior) return;
    const a = S.currentInterior.area, st = S.story || {}; st.flags = st.flags || {};
    const rotas = (st.flags.barricadas = st.flags.barricadas || {});
    ZONAS[z].forEach((d, i) => {
      const t = Object.assign({ i }, d);
      if (d.tipo === 'cepo') {
        const k = tex(S, 'cepo'); if (!k) return;
        t.X = a.x + d.x; t.Y = a.y + d.y; t.cx = t.X; t.cy = t.Y - 17;
        t.sp = S.add.sprite(t.X, t.Y, k, 0).setOrigin(0.5, ARTE.cepo.pie / ARTE.cepo.fh).setDepth(8); t.armado = true;
      } else if (d.tipo === 'fosa') {
        const k = tex(S, 'fosa'); if (!k) return;
        t.X = a.x + d.x; t.Y = a.y + d.y; t.cx = t.X; t.cy = t.Y - 21;
        t.sp = S.add.sprite(t.X, t.Y, k, 0).setOrigin(0.5, ARTE.fosa.pie / ARTE.fosa.fh).setDepth(8); t.tapada = true;
      } else if (d.tipo === 'derrumbe') {
        t.cajas = d.cajas.map(([x0, y0, x1, y1]) => [a.x + x0, a.y + y0, a.x + x1, a.y + y1]); t.prox = 0; t.restos = [];
      } else if (d.tipo === 'barricada') {
        t.id = z + '#' + (d.id || i); t.X = a.x + d.x; t.Y = a.y + d.y;
        t.rota = false;
        if (rotas[t.id]) { ponerRota(S, t, a); t.rota = true; }
        else {
          const k = tex(S, 'barricada'); if (!k) return;
          t.sp = S.add.image(t.X, t.Y, k).setOrigin(0.5, 1).setDepth(t.Y);
          const [cx, cy, cw, ch] = d.choque;
          t.zona = S.add.zone(a.x + cx + cw / 2, a.y + cy + ch / 2, cw, ch);
          S.physics.add.existing(t.zona, true);
          if (S.interiorObstacles && S.interiorObstacles.add) S.interiorObstacles.add(t.zona);
          else { S.physics.add.collider(S.player, t.zona); if (S.enemies) S.physics.add.collider(S.enemies, t.zona); }
          t.vida = d.golpes || 4; t.caja = { x0: a.x + cx - 6, x1: a.x + cx + cw + 6, y0: a.y + cy - 10, y1: a.y + cy + ch + 6 };
        }
      } else return;
      S._ckTSu.push(t);
    });
  };
  const ponerRota = (S, t, a) => {
    const k = tex(S, 'barricada_rota'), [rx, ry] = t.rotaEn || [t.X - a.x, t.Y - a.y];
    if (k) t.sp = S.add.image(a.x + rx, a.y + ry, k).setOrigin(0.5, 1).setDepth(8);
  };

  // ------------------------------------------------------------------ cepo
  const cerrar = (S, t, quien) => {
    if (!t.armado) return; t.armado = false;
    const k = tex(S, 'cepo');
    if (k) cuadros(S, t.sp, 1, ARTE.cepo.n - 1, 38);
    S.tweens.add({ targets: t.sp, y: t.Y - 2, duration: 70, delay: 120, yoyo: true });
    son('ck_cepo', 0.8) || son('door_locked', 0.8, { rate: 1.6 }) || son('sword_hit', 0.7, { rate: 1.3 });
    polvo(S, t.cx, t.Y - 4, 5); nube(S, t.cx, t.Y + 2, 0.55);
    if (quien === 'heroe') {
      S.cameras.main.shake(140, 0.006);
      herir(S, 1, '¡UN CEPO!');
      S._ckCepo = { hasta: S.time.now + CEPO.agarra, x: t.cx, y: t.cy };
    } else if (quien && quien !== 'golpe' && quien !== 'mano') {
      try { S.damageEnemy(quien, CEPO.bestia, t.cx, t.cy); } catch (e) {}
      quien._ckCepoHasta = S.time.now + CEPO.bestiaQuieta;
      S.createFloatingText(t.cx, t.cy - 30, '¡CLAC!', 0xfcd34d);
    } else if (quien === 'mano') S.createFloatingText(t.cx, t.cy - 30, 'Desarmás el cepo', 0xcbd5e1);
  };
  // ------------------------------------------------------------------ fosa
  const hundir = (S, t, quien) => {
    if (!t.tapada) return; t.tapada = false;
    cuadros(S, t.sp, 1, ARTE.fosa.n - 1, 70);
    son('ck_fosa', 0.8) || son('sword_hit', 0.7, { rate: 0.6 });
    polvo(S, t.cx, t.cy + 6, 9, 0x6b5a45); S.time.delayedCall(140, () => nube(S, t.cx, t.Y + 2, 0.9));
    if (quien === 'heroe') { S.cameras.main.shake(180, 0.008); herir(S, 1, '¡UNA FOSA!'); volver(S); }
    else if (quien) { try { S.damageEnemy(quien, 3, t.cx, t.cy); } catch (e) {} }
  };
  const dentro = (t, p, m) => Math.abs(p.x - t.cx) < m[0] && Math.abs(p.y - t.cy) < m[1];
  const volver = S => {
    const s = S._ckSeguro; if (!s || !S.player.body) return;
    S.player.setPosition(s.x, s.y); S.player.body.setVelocity(0, 0);
  };
  // ------------------------------------------------------------------ derrumbe
  const piedra = (S, t, x, y) => {
    const sombra = S.add.ellipse(x, y, 6, 3, 0x000000, 0.35).setDepth(8);
    S.tweens.add({ targets: sombra, scaleX: 4, scaleY: 4, fillAlpha: 0.55, duration: ROCA.sombra, ease: 'Quad.easeIn' });
    S.time.delayedCall(ROCA.sombra - ROCA.cae, () => {
      const k = tex(S, Math.random() < 0.5 ? 'roca_1' : 'roca_2');
      const r = k ? S.add.image(x, y - 190, k).setOrigin(0.5, 1).setDepth(y + 1) : S.add.circle(x, y - 190, 8, 0x8a8a8a).setDepth(y + 1);
      r.setAngle(azar(-30, 30));
      S.tweens.add({ targets: r, y, angle: 0, duration: ROCA.cae, ease: 'Quad.easeIn', onComplete: () => {
        try { sombra.destroy(); } catch (e) {}
        son('ck_piedra', 0.6) || son('bone_hit', 0.5, { rate: 0.5 });
        polvo(S, x, y - 2, 4); nube(S, x, y + 4, 0.8);
        S.cameras.main.shake(90, 0.004);
        if (S.player && !S.isDead) { const p = pies(S); if (Math.hypot(p.x - x, (p.y - y) * 1.4) < ROCA.radio) herir(S, 1, '¡PIEDRAS!'); }
        S.enemies && S.enemies.getChildren().forEach(e => { if (!vivo(e)) return; const q = piesDe(e); if (Math.hypot(q.x - x, q.y - y) < ROCA.radio + 4) { try { S.damageEnemy(e, 2, x, y); } catch (er) {} } });
        t.restos.push(r);
        S.tweens.add({ targets: r, alpha: 0, delay: 2600, duration: 600, onComplete: () => { try { r.destroy(); } catch (e) {} t.restos = t.restos.filter(q => q !== r); } });
      } });
    });
  };
  const enCaja = (t, p) => t.cajas.some(([x0, y0, x1, y1]) => p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1);

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const L = this._ckTSu; if (!L || !L.length || !this.player || !this.player.body || !this.gameStarted) return r;
      const now = this.time.now, p = pies(this);
      // agarrado por un cepo
      const c = this._ckCepo;
      if (c && c.hasta > now) { this.player.body.setVelocity(0, 0); this.player.x += (c.x - this.player.x) * 0.3; }
      else if (c) this._ckCepo = null;
      let seguro = true;
      L.forEach(t => {
        if (t.tipo === 'cepo' && t.armado) {
          if (dentro(t, p, CEPO.radio)) { cerrar(this, t, 'heroe'); seguro = false; }
          else this.enemies && this.enemies.getChildren().forEach(e => { if (t.armado && vivo(e) && dentro(t, piesDe(e), CEPO.radio)) cerrar(this, t, e); });
        } else if (t.tipo === 'fosa') {
          if (dentro(t, p, FOSA.mitad)) { seguro = false; if (t.tapada) hundir(this, t, 'heroe'); else { const now2 = this.time.now; if (!t._emp || now2 - t._emp > 600) { t._emp = now2; volver(this); } } }
          else if (t.tapada) this.enemies && this.enemies.getChildren().forEach(e => { if (t.tapada && vivo(e) && dentro(t, piesDe(e), FOSA.mitad)) hundir(this, t, e); });
          if (Math.abs(p.x - t.cx) < FOSA.mitad[0] + 10 && Math.abs(p.y - t.cy) < FOSA.mitad[1] + 10) seguro = false;
        } else if (t.tipo === 'derrumbe') {
          if (enCaja(t, p)) {
            if (!t.aviso) { t.aviso = true; this.createFloatingText(this.player.x, this.player.y - 50, '¡El techo se viene abajo!', 0xfde68a); son('ck_derrumbe', 0.6) || son('bridge_move', 0.5, { rate: 0.6 }); }
            if (now > t.prox) {
              t.prox = now + azar(ROCA.cada[0], ROCA.cada[1]);
              const v = this.player.body.velocity, n = Phaser.Math.Between(2, 3);
              piedra(this, t, p.x + v.x * 0.5, p.y + v.y * 0.5);                // una adonde va el héroe
              for (let i = 1; i < n; i++) { const an = azar(0, Math.PI * 2), d = azar(30, 60); piedra(this, t, p.x + Math.cos(an) * d, p.y + Math.sin(an) * d * 0.45); }
            }
          } else if (t.prox < now) t.prox = now + 500;
        }
      });
      if (seguro && !(c && c.hasta > now)) this._ckSeguro = { x: this.player.x, y: this.player.y };
      // las bestias agarradas por un cepo se quedan quietas
      this.enemies && this.enemies.getChildren().forEach(e => { if (e._ckCepoHasta && e._ckCepoHasta > now && e.body) e.body.setVelocity(0, 0); });
      // cartel de T al lado de un cepo armado
      const pr = document.getElementById('ck-prompt'), cerca = cepoCerca(this);
      if (pr && cerca && !pr.classList.contains('on') && !this.dialogOpen) { pr.textContent = 'T · Desarmar el cepo'; pr.classList.add('on'); this._ckCepoCartel = true; }
      else if (pr && !cerca && this._ckCepoCartel) { this._ckCepoCartel = false; if (pr.textContent === 'T · Desarmar el cepo') pr.classList.remove('on'); }
    } catch (e) { if (!P._ckTSuAv) { P._ckTSuAv = 1; console.warn('[trampas del suelo]', e); } }
    return r;
  };
  const cepoCerca = S => {
    if (!S._ckTSu || !S.player || !S.player.body) return null;
    const p = pies(S);
    return S._ckTSu.find(t => t.tipo === 'cepo' && t.armado && !dentro(t, p, CEPO.radio) && Math.hypot(t.cx - p.x, t.cy - p.y) < CEPO.desarmar) || null;
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const t = !this._overlay && !this.dialogOpen && cepoCerca(this);
      if (t) { cerrar(this, t, 'mano'); return; }
    } catch (e) {}
    return i0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ golpes: cierran cepos, rompen la barricada
  const tocan = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const golpe = (S, rect) => (S._ckTSu || []).slice().forEach(t => {
    if (t.tipo === 'cepo' && t.armado && tocan(rect, { x0: t.cx - 20, x1: t.cx + 20, y0: t.cy - 14, y1: t.cy + 14 })) cerrar(S, t, 'golpe');
    if (t.tipo === 'barricada' && !t.rota && t.caja && tocan(rect, t.caja)) pegarBarricada(S, t);
  });
  const pegarBarricada = (S, t) => {
    const now = S.time.now; if (t._ult && now - t._ult < 220) return; t._ult = now;
    t.vida--;
    son('ck_barricada_golpe', 0.8) || son('sword_hit', 0.75, { rate: 0.7 });
    S.tweens.add({ targets: t.sp, x: t.X + 3, duration: 40, yoyo: true, repeat: 2, onComplete: () => { if (t.sp.active) t.sp.x = t.X; } });
    const cx = (t.caja.x0 + t.caja.x1) / 2, cy = t.caja.y1 - 10;
    for (let i = 0; i < 6; i++) {
      const g = S.add.rectangle(cx + azar(-20, 20), cy - azar(10, 40), Phaser.Math.Between(2, 5), 2, 0x7a5230).setDepth(t.Y + 1);
      S.tweens.add({ targets: g, x: g.x + azar(-26, 26), y: cy + azar(-4, 6), angle: azar(-180, 180), duration: azar(260, 420), ease: 'Quad.easeOut' });
      S.tweens.add({ targets: g, alpha: 0, delay: 900, duration: 400, onComplete: () => g.destroy() });
    }
    if (t.vida > 0) { S.createFloatingText(cx, cy - 50, '¡CRAC!', 0xd6b98c); return; }
    // rota
    t.rota = true;
    try { t.zona.destroy(); } catch (e) {}
    try { t.sp.destroy(); } catch (e) {}
    const a = S.currentInterior.area; ponerRota(S, t, a);
    polvo(S, cx, cy, 8); nube(S, cx - 24, cy + 8, 1.1); nube(S, cx + 20, cy + 4, 1); S.cameras.main.shake(200, 0.008);
    son('ck_barricada', 0.8) || son('door_gate', 0.7, { rate: 0.8 });
    S.createFloatingText(cx, cy - 50, '¡La barricada se vino abajo!', 0xfde68a);
    const st = S.story; if (st) { st.flags.barricadas = st.flags.barricadas || {}; st.flags.barricadas[t.id] = true; S.saveStory && S.saveStory(); }
  };
  const rectoHeroe = (S, extra) => {
    const H = window.CK_HITBOXES;
    if (H && H.rectoGolpe) { try { return H.rectoGolpe(S, extra || 0); } catch (e) {} }
    const p = S.player, izq = S.facingDirection === 'left';
    return izq ? { x0: p.x - 46, x1: p.x + 6, y0: p.y - 22, y1: p.y + 20 } : { x0: p.x - 6, x1: p.x + 46, y0: p.y - 22, y1: p.y + 20 };
  };
  ['checkMeleeHits', 'checkThrustHits', 'checkWizardMagicHits'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () { const r = f0.apply(this, arguments); try { if (this._ckTSu && this._ckTSu.length) golpe(this, rectoHeroe(this, fn === 'checkThrustHits' ? 30 : 0)); } catch (e) {} return r; };
  });
  const sp0 = P.checkSpinHits;
  if (sp0) P.checkSpinHits = function () { const r = sp0.apply(this, arguments); try { const p = this.player; if (this._ckTSu && this._ckTSu.length) golpe(this, { x0: p.x - 60, x1: p.x + 60, y0: p.y - 40, y1: p.y + 50 }); } catch (e) {} return r; };

  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    limpiar(this); this._ckCepo = null; this._ckSeguro = null;
    this.time.delayedCall(300, () => { try { poner(this); } catch (e) { console.warn('[trampas del suelo]', e); } });
    return r;
  };
  window.CK_TRAMPAS_SUELO = { ZONAS, zona: (z, lista) => { ZONAS[z] = lista; }, poner, limpiar, golpe };
})();
