'use strict';
/* La Fortaleza y el Coliseo en la historia (10/11, pedido del dueño: "luego del pueblo veamos un patio de fortaleza orca, y
   luego en la fortaleza no pelearemos sino que será una zona para hablar con el jefe final, pero este nos captura con una
   legión de orcos y nos lleva a un coliseo"). Usa los mapas del Taller patio_fortaleza_orca y coliseo_orco y los jefes de
   ck_coliseo.js.
   - Pueblo Orco, portón del norte (abierto por Gorak, paso 6) → PATIO DE LA FORTALEZA (entra por la izquierda). La puerta
     grande del patio (arriba a la izquierda) → la FORTALEZA. Salir de la fortaleza vuelve al patio; salir del patio por la
     izquierda, al pueblo.
   - En la fortaleza (paso 6) Grushak ya no pelea: está sentado en su trono. Al acercarte habla; al terminar, una legión de
     orcos te rodea, la pantalla se apaga y despertás en el COLISEO.
   - En el coliseo: Grushak mira desde la tribuna con la princesa Elia (hija del Rey) encadenada a su lado. Tres rondas: Gorvak,
     Kragmor y Ulrak (entre ronda y ronda recuperás 2 corazones). Si caés, al volver seguís desde la ronda en que estabas.
     Después de la tercera, Grushak baja a la arena ("¡Lo haré yo mismo!") y es la pelea final (el mismo jefe de antes, con sus
     fases). Al vencerlo: paso 7, la princesa queda libre (T para hablarle) y se abre la reja de abajo, que vuelve a la fortaleza.
   - Guardado: story.flags.col = { capturado, ronda (0-3), libre }.
   Borrar su línea de index.html deja la pelea con Grushak en el trono, como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !window.CK_COLISEO) return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA;
  const PATIO = 'patio_fortaleza_orca', COL = 'coliseo_orco', FORT = 'fortaleza_orca', PUEBLO = 'pueblo_orco';
  if (!D || !D.mapas || !D.mapas[PATIO] || !D.mapas[COL] || !INTERIOR_LAYOUTS['ed_' + PATIO] || !INTERIOR_LAYOUTS['ed_' + COL]) return;
  const Z = { patio: 'ed_' + PATIO + '.main', col: 'ed_' + COL + '.main', fort: 'ed_' + FORT + '.main', pueblo: 'ed_' + PUEBLO + '.main' };
  const RONDAS = ['orc_campeon', 'bestia_kragmor', 'cazador_ulrak'];
  const PUERTAS = [[356, 382], [1086, 374], [718, 322]];          // dónde aparece cada campeón (sin ck_coliseo_gradas.js)
  const REJAS = ['izq', 'der', 'arr'];                              // por qué reja entra cada uno (con ck_coliseo_gradas.js)
  const TRIBUNA = { x: 718, y: 128 }, TRONO_FORT = { x: 835, y: 178 };
  const LLEGA = { patio: { x: 40, y: 258 }, patioPuerta: { x: 214, y: 112 }, fort: { x: 140, y: 500 }, fortTrono: { x: 760, y: 250 }, pueblo: { x: 778, y: 50 }, col: { x: 718, y: 596 } };
  const fl = s => (s.flags = s.flags || {});
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  const col = s => (fl(s).col = fl(s).col || { capturado: false, ronda: 0, libre: false });
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  // ------------------------------------------------------------------ conexiones
  const envolver = (id, extra) => {
    const L = INTERIOR_LAYOUTS['ed_' + id];
    INTERIOR_LAYOUTS['ed_' + id] = function (kit) {
      const r = L.apply(this, arguments), a = kit.areas && kit.areas.main;
      if (a) { ['exits', 'talkers', 'actors', 'items', 'fx', 'colliders'].forEach(k => (a[k] = a[k] || [])); try { extra(a); } catch (e) { console.warn('[coliseo]', e); } }
      return r;
    };
  };
  envolver(PATIO, a => {
    a.exits.push({ x: 0, y: 200, w: 14, h: 110, key: 'walk', to: 'col_pueblo', hint: '◀ Pueblo Orco' });
    a.exits.push({ x: 186, y: 86, w: 56, h: 14, key: 'walk', to: 'col_fortaleza', hint: '▲ Fortaleza de Grushak' });
    a.talkers.push({ x: 214, y: 110, r: 34, lines: ['La puerta de la fortaleza. Adentro, en el trono, espera Grushak'] });
    a.fx.push({ type: 'ash', x: -40, y: -40, w: 1000, h: 560 });
  });
  envolver(COL, a => { a.fx.push({ type: 'dust', x: 220, y: 300, w: 1000, h: 380 }); });
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (typeof nombre === 'string' && !this._doorTransition) {
      if (nombre === 'c2_fortaleza' && paso(this.story) >= 6) { this.ckEntrar(PATIO, LLEGA.patio); return; }
      if (nombre === 'col_pueblo') { this.ckEntrar(PUEBLO, LLEGA.pueblo); return; }
      if (nombre === 'col_fortaleza') { this.ckEntrar(FORT, LLEGA.fort); return; }
      if (nombre === 'col_salida') { this.ckEntrar(FORT, LLEGA.fortTrono); return; }
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const z = zona(this);
    if (!this._doorTransition && z === Z.fort && this.ckEntrar(PATIO, LLEGA.patioPuerta)) return;
    if (!this._doorTransition && z === Z.col) return;         // del coliseo se sale por la reja, cuando se abre
    return salir0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ la fortaleza: Grushak en el trono
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      const s = this.story; if (this._gameMode !== 'campaign' || !s) return r;
      const z = zona(this), c = col(s);
      this._colRey = null;
      if (z === Z.fort && paso(s) === 6 && !fl(s).grushak) {
        this._c2Jefe = true;                                   // ck_capitulo2.js ya no lo hace pelear acá
        const a = this.currentInterior.area;
        const rey = this.add.sprite(a.x + TRONO_FORT.x, a.y + TRONO_FORT.y, 'ckc_rey_idle').setOrigin(0.5, 0.9).setScale(0.75).setDepth(a.y + TRONO_FORT.y);
        this.tweens.add({ targets: rey, scaleY: 0.765, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        (a.objs || (a.objs = [])).push(rey);
        this._colRey = rey; this._colHablo = false;
        const limpiar = () => this.enemies && zona(this) === z && this.enemies.getChildren().forEach(e => { if (vivo(e) && e.zone === z) e.destroy(); });
        limpiar(); [300, 1200].forEach(t => this.time.delayedCall(t, limpiar));   // la guardia está afuera: acá no se pelea
      }
      if (z === Z.col) armarColiseo(this);
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };
  const hist0 = P.updateStory;
  P.updateStory = function () {
    const r = hist0.apply(this, arguments);
    try {
      const s = this.story, rey = this._colRey;
      if (this._gameMode !== 'campaign' || !s || !rey || !rey.active || this._colHablo || this.dialogOpen || zona(this) !== Z.fort) return r;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, rey.x, rey.y) < 150) {
        this._colHablo = true;
        this.openDialog('Grushak, el Caudillo', [
          'Así que vos sos el gusano que mató a mis vigías y entró por el portón de Gorak.',
          '¿Venís por la chica? Ja. Tengo algo mejor que una chica… tengo a la hija de tu Rey.',
          'No te voy a matar acá, en mi casa. Eso sería aburrido.',
          '¡Guardias! Llévenlo al coliseo. Que el clan vea de qué está hecho un héroe del castillo.'
        ], () => captura(this), 'orc_warlord_idle');
      }
    } catch (e) {}
    return r;
  };
  // la legión: orcos que entran por los bordes y cierran el círculo
  const captura = S => {
    const s = S.story, c = col(s), p = S.player;
    S._ckEscena = true; S.player.setVelocity(0, 0); if (p.body) p.body.enable = false;
    S.cameras.main.shake(900, 0.006); son('orc_attack', 1, { rate: 0.6 });
    const orcos = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, x0 = p.x + Math.cos(a) * 420, y0 = p.y + Math.sin(a) * 260, x1 = p.x + Math.cos(a) * 54, y1 = p.y + Math.sin(a) * 34;
      const tipo = ['orc', 'orc_armored', 'orc_elite'][i % 3];
      const o = S.add.sprite(x0, y0, tipo + '_idle').setScale(1.45).setDepth(y1 + 30).setFlipX(x1 < x0);
      if (S.anims.exists(tipo + '_walk')) o.play(tipo + '_walk');
      S.tweens.add({ targets: o, x: x1, y: y1, duration: 1500 + (i % 4) * 150, ease: 'Sine.easeOut', onUpdate: () => o.setDepth(o.y + 30), onComplete: () => S.anims.exists(tipo + '_idle') && o.play(tipo + '_idle') });
      orcos.push(o);
    }
    S.time.delayedCall(1200, () => S.createFloatingText(p.x, p.y - 50, '¡ESTÁS RODEADO!', 0xff6b6b));
    S.time.delayedCall(2600, () => {
      if (p.body) p.body.enable = true; S._ckEscena = false;
      c.capturado = true; c.ronda = c.ronda || 0; S.saveStory && S.saveStory();
      S.ckEntrar(COL, LLEGA.col);                              // el fundido y la pantalla de carga los pone ckEntrar
      S.time.delayedCall(300, () => orcos.forEach(o => o.destroy()));
    });
  };

  // ------------------------------------------------------------------ el coliseo
  const armarColiseo = S => {
    const s = S.story, c = col(s), a = S.currentInterior.area;
    if (S.enemies) S.enemies.getChildren().forEach(e => { if (vivo(e) && e.zone === Z.col) e.destroy(); });
    const t = CK_COLISEO.tribuna(S, TRIBUNA.x, TRIBUNA.y);
    if (fl(s).grushak) {                                       // ya terminó: la tribuna vacía y la princesa libre abajo
      t.rey.destroy(); t.princesa.destroy();
      liberar(S, false);
      return;
    }
    if (c.ronda >= 3) { t.rey.setVisible(false); S.time.delayedCall(1500, () => final(S)); return; }
    S.time.delayedCall(1800, () => ronda(S));
  };
  const ronda = S => {
    const s = S.story, c = col(s), a = S.currentInterior && S.currentInterior.area;
    if (!a || zona(S) !== Z.col || c.ronda >= 3) return;
    const tipo = RONDAS[c.ronda], [x, y] = PUERTAS[c.ronda], J = CK_COLISEO.JEFES[tipo];
    S.showZoneTitle && S.showZoneTitle('Ronda ' + (c.ronda + 1) + ' de 3', J.nombre);
    S.cameras.main.shake(500, 0.006); son('orc_attack', 0.9, { rate: 0.7 });
    const n = c.ronda;
    S.time.delayedCall(1600, () => {
      if (zona(S) !== Z.col) return;
      const GR = window.CK_COLISEO_GRADAS;
      if (GR) {                                                    // la reja se levanta y sale caminando de lo oscuro
        const e = GR.entrar(S, REJAS[n], tipo, e => S.time.delayedCall(300, () => vivo(e) && S.alertEnemy(e)));
        if (e) e._colRonda = n;
        return;
      }
      const e = S.spawnEnemy(a.x + x, a.y + y, tipo);
      if (!e) return;
      e.zone = Z.col; e._colRonda = n;
      if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', e.x, e.y + 30, 40, 500);
      S.time.delayedCall(700, () => vivo(e) && S.alertEnemy(e));
    });
  };
  const final = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a || zona(S) !== Z.col) return;
    const rey = S._ckcRey;
    if (rey && rey.active && rey.visible) S.createFloatingText(rey.x, rey.y - 100, '¡BASTA! ¡Lo haré yo mismo!', 0xff6b6b);
    S.time.delayedCall(rey && rey.visible ? 1400 : 0, () => {
      if (rey && rey.active) S.tweens.add({ targets: rey, alpha: 0, duration: 400, onComplete: () => rey.setVisible(false) });
      S.cameras.main.shake(700, 0.01); S.cameras.main.flash(400, 160, 40, 20);
      S.showZoneTitle && S.showZoneTitle('Grushak', 'Caudillo de los clanes orcos');
      const tipo = ENEMY_TYPES.orc_warlord ? 'orc_warlord' : 'orc_elite';
      const GR = window.CK_COLISEO_GRADAS;
      if (GR) {                                                    // baja de la tribuna y entra por la reja de abajo del trono
        const e = GR.entrar(S, 'arr', tipo, e => S.time.delayedCall(300, () => vivo(e) && S.alertEnemy(e)));
        if (e) e._c2Jefe = true;
        return;
      }
      const e = S.spawnEnemy(a.x + PUERTAS[2][0], a.y + PUERTAS[2][1], tipo);
      if (e) { e._c2Jefe = true; e.zone = Z.col; S.time.delayedCall(900, () => vivo(e) && S.alertEnemy(e)); }
    });
  };
  const liberar = (S, nueva) => {
    const a = S.currentInterior.area, s = S.story, c = col(s);
    c.libre = true;
    // la princesa baja a la arena; la reja de abajo se abre
    const x = a.x + 780, y = a.y + 596;
    if (!S._colPrin || !S._colPrin.active) {
      const pr = S.add.image(x, y, 'ckc_princesa').setOrigin(0.5, 1).setScale(0.95).setDepth(y);
      (a.objs || (a.objs = [])).push(pr); S._colPrin = pr;
    }
    a.talkers = (a.talkers || []).filter(t => !t.colPrin);
    a.talkers.push({ x: 780, y: 590, r: 40, colPrin: true, lines: ['Princesa Elia: ¡Gracias! Pensé que nadie iba a venir a buscarme.',
      'Princesa Elia: Grushak me llevó del camino real hace semanas. Mi padre… ¿está bien?',
      'Princesa Elia: Hay otra prisionera arriba, junto al trono: una chica del bosque, Mira. ¡Sacala de ahí, por favor!',
      'Princesa Elia: Yo vuelvo al castillo con la escolta de Gorak. Nos vemos allá.'] });
    const salida = () => { if (!a.exits.some(e => e.to === 'col_salida')) a.exits.push({ x: 660, y: 616, w: 116, h: 26, key: 'walk', to: 'col_salida', hint: '▼ Volver a la fortaleza' }); };
    const GR = window.CK_COLISEO_GRADAS;
    if (GR && nueva) S.time.delayedCall(2400, () => zona(S) === Z.col && GR.abrir(S, 'aba', salida));
    else if (GR) { GR.abrir(S, 'aba'); salida(); }
    else salida();
    if (nueva) {
      S.time.delayedCall(1200, () => S.createFloatingText(x, y - 50, '¡Gracias, gracias!', 0xbfdbfe));
      S.time.delayedCall(2600, () => S.createFloatingText(a.x + 718, a.y + 660, 'La reja se abre', 0xfde68a));
    }
    S.saveStory && S.saveStory();
  };
  const ven0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = ven0.apply(this, arguments);
    try {
      const s = this.story; if (!s || !enemy || enemy.zone !== Z.col) return r;
      const c = col(s);
      if (enemy._colRonda !== undefined && enemy._colRonda === c.ronda) {
        c.ronda++; this.saveStory && this.saveStory(); this.updateObjective && this.updateObjective();
        this.health = Math.min(this.maxHealth, this.health + 2); this.updateHUD && this.updateHUD();
        this.time.delayedCall(800, () => this.player && this.createFloatingText(this.player.x, this.player.y - 46, '+2 ♥  ¡El público ruge!', 0x86efac));
        this.time.delayedCall(4200, () => (c.ronda < 3 ? ronda(this) : final(this)));
      }
      if (enemy._c2Jefe) this.time.delayedCall(2500, () => zona(this) === Z.col && liberar(this, true));
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };

  // ------------------------------------------------------------------ objetivo
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = this.story, box = document.getElementById('ck-objective'), el = box && box.querySelector('.ck-obj-text');
      if (!s || !el || paso(s) !== 6 || fl(s).grushak) return r;
      const c = col(s);
      el.textContent = !c.capturado ? 'Fortaleza Orca: cruzá el patio y enfrentá a Grushak en su trono'
        : c.ronda < 3 ? `Coliseo Orco: sobreviví a los campeones de Grushak (${c.ronda}/3)` : 'Coliseo Orco: vencé a Grushak';
    } catch (e) {}
    return r;
  };

  // minimapa: las dos zonas nuevas con su dibujo real (lo arma ck_minimapa al pasar)
  try {
    const MM = window.CK_MINIMAPA;
    if (MM && MM.Z) {
      const G = 'Camino al Castillo';
      if (!MM.Z[Z.patio]) MM.Z[Z.patio] = { img: PATIO, esc: 4, w: 958, h: 534, ext: 1, n: 'Patio de la Fortaleza', g: G };
      if (!MM.Z[Z.col]) MM.Z[Z.col] = { img: COL, esc: 4, w: 1436, h: 758, ext: 1, n: 'Coliseo Orco', g: G };
    }
  } catch (e) {}
  window.CK_COLISEO_HISTORIA = { Z, RONDAS, ronda, final, liberar, captura };
})();
