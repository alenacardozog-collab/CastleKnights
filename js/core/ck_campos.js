'use strict';
/* Campos del Roble (09/11, pedido del dueño). Mapa de Flow hecho con su método de capas: referencia + suelo limpio + objetos
   sobre croma (cada objeto recortado entero, sin pedazos de pasto). Paleta unida con el resto del juego.
   - Está en el camino a Brumavieja (el bosque maldito): el sendero del OESTE de la aldea ya no va directo a las ruinas, va a
     los Campos (mapa dado vuelta: se entra por la DERECHA, por el murito con los estandartes). El camino del NORTE de los
     Campos sigue a Brumavieja (llega a su sendero del sur) y el sur de Brumavieja vuelve a los Campos.
   - Bestias de práctica: sólo limos (de día) y murciélagos (de noche).
   - Vida: árboles, estandartes y espantapájaros que se mecen; viento en el trigo; brillos y ondas en el estanque y el
     arroyo; hojas, mariposas, abejas, aves, ranas, peces, luciérnagas; hongos que brillan de noche junto al tocón.
   - Pistas con T y algo escondido en el tocón hueco.
   El mapa está en editor_data.js / editor_assets.js (Taller: campos_del_roble).
   Borrar la línea de index.html vuelve el sendero del oeste directo a las ruinas (el mapa queda en el Taller). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA || {};
  const CAMPOS = 'campos_del_roble';
  if (!D.mapas || !D.mapas[CAMPOS]) return;
  const ZC = 'ed_' + CAMPOS;
  // las piezas de los Campos vienen enteras (árbol con su tronco, casa con su base): se ordenan enteras, sin partirlas en
  // franjas (ck_profundidad.js); partidas, la copa de un árbol se veía cortada en vertical
  window.CK_PROF_ENTEROS = /^ed_cr_/;
  const W = 958, X = x => W - x;               // el mapa está dado vuelta: las medidas se escriben como en la imagen de Flow
  const LLEGA = { x: 924, y: 278 };             // Campos: al lado del murito (derecha), sobre el camino
  const NORTE = { x: X(479), y: 46 };           // Campos: arriba, viniendo de Brumavieja
  const VERDE = 0x9fe08a;

  const envolver = (k, fn) => {
    const L0 = INTERIOR_LAYOUTS[k]; if (!L0) return;
    INTERIOR_LAYOUTS[k] = function (kit) {
      const r = L0.apply(this, arguments);
      try { const a = kit.areas && kit.areas.main; if (a) fn(a, kit); } catch (e) { console.warn('[campos]', k, e); }
      return r;
    };
  };
  // ------------------------------------------------------------------ el camino: aldea (oeste) → Campos → (norte) → Brumavieja
  // el sendero del oeste de la aldea: si el héroe está en el borde, va a los Campos (si no, por ejemplo al continuar una
  // partida guardada en las ruinas, se entra a las ruinas como antes)
  const r0 = P.enterRuins;
  if (r0) P.enterRuins = function () {
    const b = this.player && this.player.body, R = typeof RUINS_ROAD_EXIT !== 'undefined' ? RUINS_ROAD_EXIT : null;
    if (b && R && !this.currentInterior && !this._doorTransition && this._gameMode === 'campaign' && b.left <= 12) {
      const ry = Math.max(R.y0 + 10, Math.min(R.y1 - 10, b.center.y));
      if (this.ckEntrar(CAMPOS, LLEGA)) { this._interiorReturn = { x: R.retX, y: ry, zoom: this.cameras.main.zoom }; return; }
    }
    return r0.apply(this, arguments);
  };
  // el norte de los Campos → Brumavieja
  const aRuinas = S => {
    if (S._doorTransition) return;
    S._ckCargaPend = { titulo: 'Brumavieja', region: 'Las ruinas', lugar: 'ruins' };
    S.fadeTransition(() => {
      S.setInteriorVisible(null);
      const building = S.buildInterior({ _houseName: 'Ruins', _interiorIndex: 7, _interiorKind: 'ruins' });
      const area = building.areas[building.start];
      S.currentInterior = { building, areaName: building.start, area };
      S._areaSwitchHold = true;
      S.showInteriorArea(area, area.spawn);
      S.createFloatingText(area.spawn.x, area.spawn.y - 40, area.title || building.title, 0xcfd8e6);
    });
    S._ckCargaPend = null;
  };
  envolver(ZC, a => a.exits.push({ x: X(507), y: 0, w: 57, h: 16, key: 'walk', to: 'ck_a_ruinas', hint: '▲ Brumavieja' }));
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'ck_a_ruinas') { aRuinas(this); return; }
    return sw0.apply(this, arguments);
  };
  // el sendero del sur de Brumavieja vuelve a los Campos
  const x0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior;
    if (c && c.building && c.building.kind === 'ruins' && !this._doorTransition && this._gameMode === 'campaign' && this.ckEntrar(CAMPOS, NORTE)) return;
    return x0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ bestias de práctica (sólo limos y murciélagos)
  if (typeof ZONE_ENEMIES !== 'undefined')
    ZONE_ENEMIES[ZC + '.main'] = [['slime', X(300), 190, 50], ['slime', X(560), 300, 50], ['slime', X(700), 430, 40], ['slime', X(220), 350, 30],
      ['bat', X(300), 120, 60, 'night'], ['bat', X(640), 380, 60, 'night']];

  // ------------------------------------------------------------------ vida
  const fx = (a, f) => (a.fx = a.fx || []).push(f);
  const caja = (x, y, w, h) => ({ x: W - x - w, y, w, h });   // un rectángulo de la imagen, dado vuelta
  envolver(ZC, (a, kit) => {
    fx(a, Object.assign({ type: 'glints', n: 8 }, caja(560, 30, 130, 100)));                               // el estanque
    [[600, 140, 40, 90], [570, 230, 50, 90], [520, 300, 60, 80], [470, 380, 60, 80], [440, 450, 50, 70]]
      .forEach(([x, y, w, h]) => fx(a, Object.assign({ type: 'glints', n: 3 }, caja(x, y, w, h))));                    // el arroyo
    fx(a, Object.assign({ type: 'leaves' }, caja(680, -10, 278, 300)));
    fx(a, Object.assign({ type: 'leaves' }, caja(0, 300, 340, 234)));
    fx(a, Object.assign({ type: 'butterflies', n: 3 }, caja(520, 0, 160, 60)));                           // flores del estanque
    fx(a, Object.assign({ type: 'butterflies', n: 3 }, caja(410, 330, 70, 60)));                          // abejas en las colmenas
    fx(a, Object.assign({ type: 'butterflies', n: 3 }, caja(200, 160, 200, 120)));
    if (kit.light) kit.light(a, X(845), 455, 24, VERDE, 0.16, { halo: true });                      // hongos del tocón
  });
  const F = window.CK_FAUNA && window.CK_FAUNA.FAUNA;
  if (F) F[ZC + '.main'] = Object.assign({ aves: 3, mariposas: 6, luciernagas: 12, peces: 2, ranas: 3, cuervos: 1 }, F[ZC + '.main'] || {});

  // al entrar: lo que se mece, el viento en el trigo y las ondas del estanque
  const MECE = [[/^ed_cr_arbol_/, 0.5, 2300], [/^ed_cr_estandarte/, 1.6, 1500], [/^ed_cr_espantapajaros/, 1.8, 1900]];
  const TRIGO = [[208, 14, 168, 58], [208, 72, 112, 76]].map(([x, y, w, h]) => [W - x - w, y, w, h]);
  const ESTANQUE = { x: X(625), y: 66, rx: 52, ry: 26 };
  const zona = s => (s.currentZoneKey ? s.currentZoneKey() : '');
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      if (this._ckTrigo) { this._ckTrigo.forEach(o => o.destroy()); this._ckTrigo = null; }
      this._ckEstanque = null;
      if (area && zona(this) === ZC + '.main') {
        this.children.list.forEach(o => {
          if (o._ckMece || !o.texture || !o.visible) return;
          const m = MECE.find(([re]) => re.test(o.texture.key)); if (!m) return;
          o._ckMece = true;
          this.tweens.add({ targets: o, angle: { from: -m[1] * 0.8, to: m[1] }, duration: m[2] + (o.x * 7) % 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (o.y * 13) % 700 });
        });
        const msk = this.make.graphics({ add: false }); msk.fillStyle(0xffffff);
        TRIGO.forEach(([x, y, w, h]) => msk.fillRect(area.x + x, area.y + y, w, h));
        const g = this.add.graphics().setDepth(7.35).setBlendMode(Phaser.BlendModes.ADD);
        g.setMask(msk.createGeometryMask());
        g._ckT0 = this.time.now; g._ckArea = area;
        this._ckTrigo = [g, msk];
        this._ckEstanque = { x: area.x + ESTANQUE.x, y: area.y + ESTANQUE.y, prox: 0 };
      }
    } catch (e) { console.warn('[campos] vida', e); }
    return r;
  };
  const update0 = P.update;
  P.update = function (time, delta) {
    const r = update0.apply(this, arguments);
    try {
      const T = this._ckTrigo;
      if (T && T[0].active) {
        const g = T[0], ar = g._ckArea, t = (this.time.now - g._ckT0) / 1000;
        g.clear();
        for (let i = 0; i < 4; i++) {
          const k = ((t * 0.16 + i / 4) % 1), x = ar.x + W - 170 - k * 230, y = ar.y + 10 + i * 36;   // el viento va hacia el oeste
          g.fillStyle(0xfff0b0, 0.07 + 0.03 * Math.sin(t * 1.3 + i));
          g.fillEllipse(x - 40, y + 20, 100, 20);
        }
      }
      const L = this._ckEstanque;
      if (L) {
        L.prox -= delta || 16;
        if (L.prox <= 0) {
          L.prox = 1600 + Math.random() * 2600;
          const ang = Math.random() * Math.PI * 2, kk = Math.sqrt(Math.random()) * 0.8;
          const x = L.x + Math.cos(ang) * ESTANQUE.rx * kk, y = L.y + Math.sin(ang) * ESTANQUE.ry * kk;
          const g = this.add.graphics().setDepth(7.4), o = { k: 0 };
          this.tweens.add({ targets: o, k: 1, duration: 1600, ease: 'Sine.easeOut',
            onUpdate: () => { g.clear(); g.lineStyle(1, 0xd8f0ff, 0.55 * (1 - o.k)); g.strokeEllipse(x, y, 4 + o.k * 16, 2 + o.k * 7); },
            onComplete: () => g.destroy() });
        }
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ pistas con T y lo escondido en el tocón
  const PISTAS = [
    { x: 277, y: 98, t: ['El espantapájaros tiene puesto un casco viejo de soldado. Le queda grande.'] },
    { x: 393, y: 104, t: ['El molino está quieto. Esta semana nadie vino a moler.', 'La puerta del molino está trabada desde adentro.'] },
    { x: 362, y: 108, r: 18, t: ['«Molino de la aldea. Se muele los martes.» Hoy es martes.'] },
    { x: 438, y: 376, t: ['Las abejas zumban tranquilas.'] },
    { x: 455, y: 418, t: ['El agua del pozo está limpia y fría.'] },
    { x: 690, y: 420, r: 60, t: ['Piedras viejas con marcas que nadie sabe leer.', 'Una de las piedras tiene una marca nueva, como de garra.'] },
    { x: 760, y: 140, r: 40, t: ['Manzanas tiradas al pie de los árboles. Nadie vino a juntarlas.'] },
    { x: 479, y: 40, r: 30, t: ['Huellas de barro hacia el norte, hacia la niebla de Brumavieja. Ninguna vuelve.'] },
    { x: 858, y: 470, r: 36, cofre: 'cr_tocon', t: ['Algo brilla adentro del tocón hueco.'] }
  ].map(q => Object.assign(q, { x: X(q.x) }));
  const pistaCerca = S => {
    if (zona(S) !== ZC + '.main') return null;
    const p = S.player, ar = S.currentInterior && S.currentInterior.area;
    if (!p || !p.body || !ar) return null;
    let mejor = null, dm = 1e9;
    PISTAS.forEach(q => { const d = Math.hypot(ar.x + q.x - p.body.center.x, ar.y + q.y - p.body.bottom); if (d < (q.r || 26) && d < dm) { dm = d; mejor = q; } });
    return mejor;
  };
  const decir = (S, t) => {
    if (window.CK_ESCENA && CK_ESCENA.globo) CK_ESCENA.globo(S, S.player, t, 3800, 50);
    else S.createFloatingText(S.player.x, S.player.y - 50, t, 0xe2e8f0);
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const q = !this.dialogOpen && !this._overlay && pistaCerca(this);
      if (q) {
        const st = this.story; st.flags = st.flags || {};
        if (q.cofre) {
          if (st.flags[q.cofre]) { decir(this, 'El tocón ya está vacío.'); return; }
          st.flags[q.cofre] = true;
          const n = 25; st.coins = (st.coins || 0) + n; st.inv = st.inv || {}; st.inv.potion = (st.inv.potion || 0) + 1;
          try { sfx.fx('book_clasp', 0.7); } catch (e) {}
          decir(this, q.t[0] + ' Una bolsita con ' + n + ' monedas y una poción.');
          this.updateObjective && this.updateObjective(); this.updateQuickBar && this.updateQuickBar(); this.saveStory && this.saveStory();
          return;
        }
        q.n = (q.n || 0) + 1;
        decir(this, q.t[(q.n - 1) % q.t.length]);
        st.flags.pistas = st.flags.pistas || {}; st.flags.pistas[ZC + ':' + q.x + ',' + q.y] = 1;
        return;
      }
    } catch (e) { console.warn('[campos] pista', e); }
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt'), q = !this.dialogOpen && pistaCerca(this);
      const txt = q ? (q.cofre ? 'T · Revisar' : 'T · Mirar') : '';
      if (pr && q && (!pr.classList.contains('on') || this._ckPistaCartel)) { if (pr.textContent !== txt) pr.textContent = txt; pr.classList.add('on'); this._ckPistaCartel = true; }
      else if (pr && !q && this._ckPistaCartel) { this._ckPistaCartel = false; if (/^T · (Mirar|Revisar)$/.test(pr.textContent)) pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };

  // la región en la pantalla de carga
  if (window.CK_PANTALLA_CARGA && CK_PANTALLA_CARGA.REGION) CK_PANTALLA_CARGA.REGION.push([/^campos_del_roble$/, 'Alrededores de la aldea']);
  window.CK_CAMPOS = { CAMPOS, LLEGA, NORTE, PISTAS, aRuinas };
})();
