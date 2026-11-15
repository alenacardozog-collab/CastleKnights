'use strict';
/* La batalla del Capítulo 2 en el Sendero y las Afueras (14/11, notas del dueño):
   - 95, Sendero Orco: "aca es donde se producira la batalla, de este lado el ejercito de bruno y del otro lado los orcos, el
     ejercito de bruno trae escaleras y las ponen para poder cruzar mas… añade eso y q tengan la fisica de que sean escaleras de
     guerra y encajen bien".
   - 98, Afueras Orcas: "despues aca en el avanze de la batalla es donde llegamos y enfretamos al orco del escudo y a sus legiones".
   La batalla (ck_batalla_orca.js) deja las Tierras Orcas y pasa por dos frentes:
   1) SENDERO: Bruno y su línea del lado de acá de la grieta (oeste); los orcos llegan del otro lado (este). La primera vez,
      los soldados tienden dos escaleras de guerra sobre la grieta: se paran en el borde, caen con su peso, rebotan y quedan
      apoyadas en las dos orillas (se puede cruzar por ellas, igual que los orcos). Quedan puestas para siempre.
      Hasta 300 orcos caídos; ahí se repliegan a las Afueras y la línea avanza. Antes no se puede pasar a las Afueras.
   2) AFUERAS: la línea entra por el oeste y por el portón del pueblo baja Gorvak, el del escudo, con sus legiones
      (acorazados y de élite). Gorvak se retira como antes ("te espero en la arena") y, casi a los 500, Bruno cae herido:
      retirada (paso 5). Mientras dura, el portón del Pueblo está cerrado.
   En los dos mapas, mientras dura la batalla, no salen las patrullas de siempre (ck_sendero_orco.js, ck_afueras_orcas.js).
   Va después de ck_afueras_orcas.js. Borrar su línea de index.html vuelve la batalla a las Tierras Orcas. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !window.CK_BATALLA_ORCA || !CK_BATALLA_ORCA.frentes) return;
  const P = MainGameScene.prototype, BO = window.CK_BATALLA_ORCA;
  const SEND = 'sendero_orco', AF = 'afueras_orcas';
  if (!INTERIOR_LAYOUTS['ed_' + SEND] || !INTERIOR_LAYOUTS['ed_' + AF]) return;
  const ZS = 'ed_' + SEND + '.main', ZA = 'ed_' + AF + '.main';
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const fl = S => { const s = S.story; if (!s) return null; s.flags = s.flags || {}; return s.flags; };
  const B = S => BO.B(S);
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const azar = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------------ las escaleras de guerra (sobre la grieta del Sendero)
  // x0 / x1: punta de acá y punta de allá (apoyadas en cada orilla); y: el medio. Medidas sobre los choques de la grieta.
  const ESCALERAS = [{ x0: 420, x1: 498, y: 165 }, { x0: 458, x1: 538, y: 390 }];
  const ANCHO = 22;
  /** Dibuja una escalera de guerra vista desde arriba (dos largueros, peldaños cada 8 px, sogas en las uniones). */
  const texEscalera = (S, L) => {
    const k = 'ck_escalera_guerra_' + L; if (S.textures.exists(k)) return k;
    const H = ANCHO, t = S.textures.createCanvas(k, L, H), g = t.getContext();
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const OUT = '#181412', D = '#56402a', M = '#806240', LZ = '#a8885e', SO = '#b09c70', SD = '#78644a';
    for (let x = 6; x < L - 6; x += 8) { r(x, 4, 5, 14, OUT); r(x + 1, 5, 3, 12, M); r(x + 1, 5, 1, 12, LZ); r(x + 3, 5, 1, 12, D); }
    [1, 15].forEach(y => {
      r(0, y, L, 6, OUT); r(1, y + 1, L - 2, 4, D); r(1, y + 1, L - 2, 1, LZ); r(1, y + 2, L - 2, 1, M); r(2, y + 3, L - 4, 1, M);
      for (let x = 6; x < L - 4; x += 11) r(x, y + 3, 3, 1, D);
      r(0, y, 2, 6, OUT); r(L - 2, y, 2, 6, OUT);
    });
    for (let x = 6; x < L - 6; x += 8) { r(x + 1, 2, 3, 1, SO); r(x + 1, 6, 3, 1, SD); r(x + 1, 16, 3, 1, SO); r(x + 1, 20, 3, 1, SD); }
    t.refresh();
    return k;
  };
  /** Abre el paso: corta los choques de la grieta en la franja de la escalera (como las puertas que se rompen). */
  const cortar = (S, a, q) => {
    const Q = { x0: a.x + q[0], y0: a.y + q[1], x1: a.x + q[2], y1: a.y + q[3] };
    const zonas = [S.interiorObstacles, S.obstacles].filter(Boolean).reduce((l, g) => l.concat(g.getChildren()), []);
    zonas.forEach(z => {
      const b = z.body; if (!b || z.type !== 'Zone' || !z.active || !b.enable) return;
      if (b.right <= Q.x0 || b.x >= Q.x1 || b.bottom <= Q.y0 || b.y >= Q.y1) return;
      const partes = [];
      if (b.x < Q.x0) partes.push([b.x, b.y, Q.x0, b.bottom]);
      if (b.right > Q.x1) partes.push([Q.x1, b.y, b.right, b.bottom]);
      const mx0 = Math.max(b.x, Q.x0), mx1 = Math.min(b.right, Q.x1);
      if (b.y < Q.y0) partes.push([mx0, b.y, mx1, Q.y0]);
      if (b.bottom > Q.y1) partes.push([mx0, Q.y1, mx1, b.bottom]);
      partes.forEach(([x0, y0, x1, y1]) => {
        if (x1 - x0 < 1 || y1 - y0 < 1) return;
        const zn = S.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);
        S.physics.add.existing(zn, true); zn._ckNA = z._ckNA; zn._ckCorte = true;
        S.interiorObstacles.add(zn); (a.objs = a.objs || []).push(zn);
      });
      try { b.enable = false; S.interiorObstacles && S.interiorObstacles.remove(z); S.obstacles && S.obstacles.remove(z); z.destroy(); } catch (e) {}
    });
    S._navGrid = null;                                          // los orcos (y quien sea) también cruzan por ahí
  };
  const ponerEscalera = (S, e, cayendo) => new Promise(listo => {
    const a = S.currentInterior.area, L = e.x1 - e.x0, k = texEscalera(S, L);
    const x = a.x + e.x0, y = a.y + e.y;
    const sombra = S.add.rectangle(x + 2, y + 4, L - 4, ANCHO - 6, 0x000000, 0.32).setOrigin(0, 0.5).setDepth(7.4);
    const sp = S.add.image(x, y, k).setOrigin(0, 0.5);
    (a.objs = a.objs || []).push(sp, sombra);
    const echada = () => {
      sp.setAngle(0).setDepth(7.6);                             // sobre el suelo: todos pasan por arriba
      cortar(S, a, [e.x0 + 3, e.y - 8, e.x1 - 3, e.y + 8]);
      listo(sp);
    };
    if (!cayendo) { echada(); return; }
    // de pie en el borde: cae con su peso, golpea la otra orilla, rebota un poco y se asienta
    sombra.setScale(0.1, 1).setAlpha(0);
    sp.setAngle(-90).setDepth(y + 2);
    S.tweens.add({ targets: sp, angle: -84, duration: 260, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => {
      son('step_wood1', 0.5, { rate: 0.7 });
      S.tweens.add({ targets: sombra, scaleX: 1, alpha: 1, duration: 620, ease: 'Quad.easeIn' });
      S.tweens.add({ targets: sp, angle: 0, duration: 620, ease: 'Quad.easeIn', onComplete: () => {
        son('ck_barricada_golpe', 0.9, { rate: 0.85 }) || son('ck_puerta_rota', 0.6);
        S.cameras.main.shake(260, 0.006);
        for (let i = 0; i < 10; i++) {                          // polvo en las dos puntas
          const px = i < 6 ? x + L - 4 + azar(-4, 8) : x + azar(-6, 6), py = y + azar(-ANCHO / 2, ANCHO / 2);
          const d = S.add.circle(px, py, azar(2, 4), 0xcbb894, 0.75).setDepth(y + 40);
          S.tweens.add({ targets: d, x: px + azar(-14, 14), y: py - azar(4, 14), alpha: 0, scale: 2, duration: azar(380, 640), onComplete: () => d.destroy() });
        }
        S.tweens.add({ targets: sp, angle: -6, duration: 110, yoyo: true, ease: 'Quad.easeOut', onComplete: () => {
          S.tweens.add({ targets: sp, angle: -2, duration: 70, yoyo: true, onComplete: echada });
        } });
      } });
    } });
  });
  const ESC_KEY = 'escaleras';
  const conEscaleras = S => !!(fl(S) && fl(S).batalla_orca && fl(S).batalla_orca[ESC_KEY]);
  // la escena de la primera vez: dos soldados por escalera, la paran en el borde y la tiran sobre la grieta
  const tenderEscaleras = S => {
    const E = window.CK_ESCENA, a = S.currentInterior.area, b = B(S);
    const ayudantes = [];
    const soldado = (g, x, y) => {
      const k = 'g_' + g + '_idle'; if (!S.textures.exists(k)) return null;
      const sp = S.add.sprite(a.x + x, a.y + y, k).setOrigin(0.5, 1).setScale(1.2).setDepth(a.y + y);
      if (S.anims.exists(k)) sp.play(k);
      sp._ckAnim = 'g_' + g; ayudantes.push(sp); return sp;
    };
    const una = async (e, i) => {
      const s1 = soldado(i ? 'axeman' : 'lancer', e.x0 - 50, e.y - 2), s2 = soldado(i ? 'lancer' : 'axeman', e.x0 - 56, e.y + 14);
      if (E && E.caminar) await Promise.all([E.caminar(S, s1, e.x0 - 12, e.y - 4, 60), E.caminar(S, s2, e.x0 - 14, e.y + 12, 60)]);
      [s1, s2].forEach(s => s && s.setFlipX(false));
      if (E && E.globo && s1) E.globo(S, s1, i ? '¡La otra! ¡Ya!' : '¡Escalera! ¡A la una…!', 1500);
      await ponerEscalera(S, e, true);
    };
    a._ckEscaleras = [];
    const fin = () => {
      a._ckEscaleras = S.children.list.filter(o => o.texture && /^ck_escalera_guerra_/.test(o.texture.key) && o.active);
      ayudantes.forEach(s => S.tweens.add({ targets: s, alpha: 0, delay: 600, duration: 500, onComplete: () => s.destroy() }));
      b[ESC_KEY] = 1; S.saveStory && S.saveStory();
    };
    if (!E || !E.correr) { ESCALERAS.forEach(e => ponerEscalera(S, e, false)); fin(); return; }
    E.correr(S, async () => {
      await E.camara(S, 470, 210, 900);
      const br = (a.actors || []).find(t => t.sprite && t.sprite.active && t.sprite.texture && t.sprite.texture.key === 'g_knight_idle');
      if (br) await E.globo(S, br.sprite, '¡Están del otro lado! ¡Las escaleras! ¡Tiéndanlas sobre la grieta!', 2600);
      await una(ESCALERAS[0], 0);
      await E.camara(S, 490, 330, 700);
      await una(ESCALERAS[1], 1);
      await E.esperar(500);
      if (br) await E.globo(S, br.sprite, '¡Ahora podemos cruzar por tres lados! ¡Formen la línea!', 2400);
      E.seguir(S);
    }).then(fin).catch(fin);
  };

  // ------------------------------------------------------------------ los dos frentes
  const SEND_SOLD = [['templar', 395, 130], ['lancer', 400, 215], ['axeman', 410, 290], ['templar', 420, 350], ['lancer', 430, 440],
    ['axeman', 380, 180], ['templar', 400, 400], ['lancer', 360, 250], ['archer', 300, 200], ['archer', 330, 400]];
  const AF_SOLD = [['templar', 180, 230], ['lancer', 200, 260], ['axeman', 220, 200], ['templar', 240, 290], ['lancer', 160, 270],
    ['axeman', 260, 240], ['archer', 120, 240], ['archer', 150, 200]];
  BO.frentes([
    { id: SEND, soldados: SEND_SOLD, bruno: { x: 340, y: 270 },
      entran: [[930, 150], [925, 330], [700, 90], [620, 470], [940, 240], [760, 240], [650, 330]],
      sur: [40, 262], llegada: { x: 40, y: 262 }, hasta: BO.GORVAK_EN, huyen: [940, 240], marcha: [420, 272],
      objetivo: 'Sendero Orco: rompé la línea orca junto al Capitán Bruno', nombre: 'Afueras Orcas: seguí a la línea',
      cae: '¡LA LÍNEA ORCA SE ROMPE!', avanza: '¡Se repliegan a las Afueras! ¡Adelante, tras ellos!',
      llega: (b, primera) => primera ? '¡Ahí están, del otro lado de la grieta! ¡Formen la línea, por el Rey!' : '¡Volviste! ¡Siguen cruzando, a la línea!',
      alEntrar: (S, primera, b) => { if (!b[ESC_KEY]) tenderEscaleras(S); } },
    { id: AF, soldados: AF_SOLD, bruno: { x: 280, y: 300 },
      entran: [[900, 150], [880, 250], [700, 250], [640, 250], [560, 220], [500, 330]],
      sur: [30, 228], llegada: { x: 40, y: 228 }, gorvak: [700, 250], salida: [930, 150], legion: 6, hasta: BO.FIN_EN,
      objetivo: 'Afueras Orcas: frená a Gorvak y a sus legiones junto a Bruno', retirada: 'hasta el borde de las Afueras',
      llega: (b, primera) => primera ? '¡Del portón! ¡El del escudo y sus legiones! ¡Escudos arriba!' : '¡A la línea! ¡De acá no pasan!' }
  ]);

  // ------------------------------------------------------------------ las escaleras quedan; sin patrullas mientras dura
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      const z = zona(this);
      if (z !== ZS && z !== ZA) return r;
      const a = this.currentInterior && this.currentInterior.area;
      if (z === ZS && conEscaleras(this) && a && !(a._ckEscaleras && a._ckEscaleras.every(o => o.active))) {
        a._ckEscaleras = [];
        ESCALERAS.forEach(e => ponerEscalera(this, e, false).then(sp => a._ckEscaleras.push(sp)));
      }
      if (this._gameMode === 'campaign' && BO.activa(this) && this.enemies) {
        const limpiar = () => zona(this) === z && this.enemies.getChildren().forEach(e => { if (vivo(e) && e.zone === z && !e._ckBatalla) { try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} } });
        limpiar(); this.time.delayedCall(400, limpiar);
      }
    } catch (e) { console.warn('[batalla sendero]', e); }
    return r;
  };
  // no se adelanta: al Pueblo (por las Afueras) recién cuando cae cada frente
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    try {
      if (typeof nombre === 'string' && !this._doorTransition && this._gameMode === 'campaign' && BO.activa(this)) {
        const n = B(this).n, tope = (txt) => {
          const t = this.time.now; if (t - (this._ckBsAviso || 0) < 1500) return; this._ckBsAviso = t;
          this.createFloatingText(this.player.x, this.player.y - 50, txt, 0xfca5a5);
          const a = this.currentInterior && this.currentInterior.area, cx = a ? a.x + 479 : this.player.x - 1;
          if (this.player.body) this.player.body.reset(this.player.x + (cx > this.player.x ? 18 : -18), this.player.y);
        };
        if (nombre === 'so_pueblo' && n < BO.GORVAK_EN) { tope('¡Primero hay que romper su línea! (' + n + '/' + BO.GORVAK_EN + ')'); return; }
        if (nombre === 'af_pueblo') { tope('¡Las legiones cierran el portón!'); return; }
      }
    } catch (e) {}
    return cambiar0.apply(this, arguments);
  };
  window.CK_BATALLA_SENDERO = { ESCALERAS, ponerEscalera, tenderEscaleras };
})();
