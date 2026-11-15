'use strict';
/* La cuarentena de la Frontera (10/11, pedido del dueño: "que el cambio hacia la zona orca no sea tan brusco… más parte de
   zona humana y la zona orca como en cuarentena, cercada por soldados y barricadas hasta que el Rey nos mande a explorar").
   - Bosque de la Frontera (el mapa grande): la empalizada de estacas corta el mapa de arriba a abajo; el único paso es el
     puesto de control del camino, con su portón de hierro (las dos hojas, ck_cuarentena_arte.js) y dos soldados.
   - Cerrado hasta que el Rey da la orden (Capítulo 2, paso 3: después de hablar con el Rey y con Bruno). El cabo lo explica
     con T; si te acercás, te frena. Con la orden, la primera vez el portón se abre deslizándose (cadenas, polvo) y los
     soldados se hacen a un lado; después queda abierto.
   - El campamento del Rey: dos soldados más junto a los fogones, que cuentan cosas.
   (14/11, nota 71 del dueño) El portón se corre cuando el héroe se acerca (antes, al entrar al mapa, sin que se viera) y,
   en la práctica con todo abierto, también lo abren los soldados.
   Borrar su línea de index.html deja el paso abierto siempre (las hojas quedan fuera del dibujo). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined' || !window.CK_CUARENTENA_ARTE) return;
  const P = MainGameScene.prototype, A = window.CK_CUARENTENA_ARTE, E = window.CK_ESCENA;
  const ZB = 'ed_bosque_de_la_frontera.main';
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  // (14/11, nota 71 del dueño: "esta puerta es corrediza y la abren los humanos") en la práctica con todo abierto, también se abre
  const abierto = s => !!s && (paso(s) >= 3 || !!(s.flags && s.flags.grushak) || !!(window.CK_LIBRE && CK_LIBRE()));
  const S0 = () => window.activeGameScene || null;
  const HUECO = { x: 1048, y: 400, w: 36, h: 54 };            // el camino entre las dos hojas
  const GUARDIAS = [['g_templar', 1028, 412, true], ['g_archer', 1030, 466, true]];   // (10/11) soldados leales
  const A_UN_LADO = [[1026, 388], [1030, 492]];
  const CAMPO = [['g_archer', 878, 296, false, 'Arquero del Rey', ['Del otro lado de las estacas no queda nada vivo. Ni pájaros.', 'De noche se ven fuegos verdes entre los árboles secos.']],
    ['g_templar', 530, 588, true, 'Recluta', ['Me mandaron a cuidar el bosque y terminé cuidando una olla.', 'Dicen que la piedra vieja del claro zumba cuando hay luna llena. Yo no me acerco.']]];
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  STORY_NPCS.push({
    id: 'cabo_cuarentena', x: 1028, y: 412, r: 56, name: 'Cabo de la cuarentena', face: 'g_templar_idle',
    get zone() { return st(S0()) ? ZB : '-'; },
    lines: s => abierto(s)
      ? ['El Rey dio la orden: el portón queda abierto para vos.', 'Más allá de las estacas, todo lo que se mueva es enemigo. Volvé entero.']
      : ['¡Alto! Esto es la cuarentena del Rey. Del otro lado empieza la tierra de los orcos.',
        'Nadie cruza sin una orden de Su Majestad. Ni siquiera vos.', 'Si querés pasar, hablá con el Rey en el castillo.']
  });
  CAMPO.forEach(([g, x, y, , nombre, l], i) => STORY_NPCS.push({ id: 'soldado_campo_' + i, x, y, r: 40, name: nombre, face: g + '_idle', get zone() { return st(S0()) ? ZB : '-'; }, lines: () => l }));

  const cuerpoFijo = (S, x, y, w, h) => {
    const z = S.add.zone(x + w / 2, y + h / 2, w, h); S.physics.add.existing(z, true);
    if (S.interiorObstacles) S.interiorObstacles.add(z);
    return z;
  };
  const sprite = (S, tex, x, y, flip) => {
    if (!S.textures.exists(tex)) return null;
    // (15/11, notas 23-25) las hojas de 100 px tienen los pies al 60 % del cuadro: con el origen abajo de todo los soldados se
    // veían 67 px más arriba de su lugar (uno adentro del árbol, otro encima de la carpa) y al cabo no se le podía hablar
    const sp = S.add.sprite(x, y, tex).setOrigin(0.5, 0.6).setScale(1.4).setDepth(y);
    if (S.anims.exists(tex)) sp.play(tex);
    if (flip) sp.setFlipX(true);
    return sp;
  };
  const texturas = S => { ['arriba', 'abajo'].forEach(k => { const key = 'ck_cuar_' + k; if (!S.textures.exists(key) && !texturas[key]) { texturas[key] = 1; S.textures.addBase64(key, A[k]); } }); };
  const quitar = S => { (S._ckCuar || []).forEach(o => { try { o && o.active && o.destroy(); } catch (e) {} }); S._ckCuar = []; S._ckCuarTapa = null; };

  const armar = S => {
    quitar(S);
    const s = st(S); if (!s || !S.currentInterior || S.currentZoneKey() !== ZB) return;
    texturas(S);
    if (!S.textures.exists('ck_cuar_arriba') || !S.textures.exists('ck_cuar_abajo')) { S.time.delayedCall(120, () => armar(S)); return; }
    const a = S.currentInterior.area, L = S._ckCuar, lib = abierto(s);
    const yaVisto = !!(s.flags && s.flags.cuarentena_vista);
    const abre = lib && !yaVisto;                               // la primera vez con la orden: se abre delante tuyo
    const dy = lib && !abre ? 1 : 0;
    const arr = S.add.image(a.x + A.x, a.y + A.y, 'ck_cuar_arriba').setOrigin(0, 0).setDepth(a.y + A.corte - 2);
    const abj = S.add.image(a.x + A.x, a.y + A.corte, 'ck_cuar_abajo').setOrigin(0, 0).setDepth(a.y + A.y + 160);
    const H1 = arr.height, H2 = abj.height;
    const correr = k => { arr.setCrop(0, 0, arr.width, Math.max(1, H1 - Math.round(k * 64))); abj.y = a.y + A.corte + Math.round(k * 52); abj.setCrop(0, 0, abj.width, Math.max(1, H2 - Math.round(k * 52))); };
    correr(dy);
    L.push(arr, abj);
    if (!lib || abre) { S._ckCuarTapa = cuerpoFijo(S, a.x + HUECO.x, a.y + HUECO.y, HUECO.w, HUECO.h); L.push(S._ckCuarTapa); }   // (14/11) cerrado hasta que lo corren
    const gs = GUARDIAS.map(([g, x, y, f], i) => {
      const [px, py] = lib && !abre ? A_UN_LADO[i] : [x, y];
      const sp = sprite(S, g + '_idle', a.x + px, a.y + py, f);
      if (sp) { L.push(sp); const [bx, by] = lib ? A_UN_LADO[i] : [x, y]; L.push(cuerpoFijo(S, a.x + bx - 7, a.y + by - 8, 14, 8)); }   // con la orden, el cuerpo ya queda a un lado
      return sp;
    });
    CAMPO.forEach(([g, x, y, f]) => { const sp = sprite(S, g + '_idle', a.x + x, a.y + y, f); if (sp) { L.push(sp); L.push(cuerpoFijo(S, sp.x - 7, sp.y - 8, 14, 8)); } });
    if (abre) {                                                  // la orden del Rey: se abre cuando llegás (los soldados la corren)
      // (14/11) antes se abría a los 0,9 s de entrar al mapa, cuando el héroe todavía estaba lejos y no lo veía: ahora espera
      // a que el héroe se acerque al portón (unos 230 px)
      const cerca = () => S.player && Phaser.Math.Distance.Between(S.player.x, S.player.y, a.x + HUECO.x + HUECO.w / 2, a.y + HUECO.y + HUECO.h / 2) < 230;
      const espera = S.time.addEvent({ delay: 200, loop: true, callback: () => {
        if (!arr.active) { espera.remove(); return; }
        if (!cerca() || S.dialogOpen) return;
        espera.remove();
        S.cameras.main.shake(400, 0.003); son('bridge_move', 0.8, { rate: 0.8 });
        if (gs[0]) S.createFloatingText(gs[0].x, gs[0].y - 54, '¡Abran el portón! Orden del Rey', 0xbfdbfe);
        const o = { k: 0 };
        S.tweens.add({ targets: o, k: 1, duration: 1600, ease: 'Sine.easeInOut', onUpdate: () => correr(o.k), onComplete: () => {
          son('door_gate', 0.7, { rate: 0.8 });
          const t = S._ckCuarTapa; S._ckCuarTapa = null;
          try { if (t) { t.body.enable = false; S.interiorObstacles && S.interiorObstacles.remove(t); t.destroy(); } } catch (e) {}
          S._navGrid = null;
        } });
        gs.forEach((g, i) => g && S.tweens.add({ targets: g, x: a.x + A_UN_LADO[i][0], y: a.y + A_UN_LADO[i][1], duration: 1200, delay: 300, onUpdate: () => g.setDepth(g.y) }));
        s.flags = s.flags || {}; s.flags.cuarentena_vista = true; S.saveStory && S.saveStory();
      } });
      L.push({ active: true, destroy: () => espera.remove() });
    }
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0 ? area0.apply(this, arguments) : undefined;
    try { armar(this); } catch (e) { console.warn('[cuarentena]', e); }
    return r;
  };
  // sin la orden: al acercarse al portón, el cabo frena
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const s = st(this);
      if (s && this._ckCuarTapa && !abierto(s) && this.currentZoneKey() === ZB && this.player && this.player.body && !this.dialogOpen) {
        const a = this.currentInterior.area, b = this.player.body;
        if (b.right > a.x + HUECO.x - 10 && b.center.y > a.y + HUECO.y - 6 && b.center.y < a.y + HUECO.y + HUECO.h + 6 &&
            (!this._ckCuarAviso || this.time.now - this._ckCuarAviso > 3000)) {
          this._ckCuarAviso = this.time.now;
          const cabo = (this._ckCuar || []).find(o => o && o.texture && o.texture.key === 'g_templar_idle');
          const t = '¡Alto! Sin orden del Rey nadie cruza la cuarentena.';
          if (cabo && E && E.globo) E.globo(this, cabo, t, 2400); else this.createFloatingText(this.player.x, this.player.y - 46, t, 0xfca5a5);
        }
      }
    } catch (e) {}
    return r;
  };
  window.CK_CUARENTENA = { abierto, armar, HUECO };
})();
