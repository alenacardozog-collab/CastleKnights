'use strict';
/* El Rey y el portón del norte (23/11, tanda 9c, nota 9 del dueño, en el Norte del Roble: "este lugar permanecerá cerrado
   hasta que le informemos al Rey de lo que está pasando y nos otorgue la llave y el permiso de investigar"; y su respuesta
   a la pregunta de cuándo: "el Rey, después de los desaparecidos").
   Sólo en partidas nuevas (story.flags.v2). El Capítulo 1 queda así (los números de paso no cambian):
   - Paso 2: los tres desaparecidos de los Campos (ck_desaparecidos.js), como siempre.
   - Paso 3, primero: CONTARLE AL REY. Bruno manda al Gran Salón ("esto tiene que saberlo el Rey"); el Rey escucha lo de la
     luz que llamaba al norte, da la LLAVE DEL PORTÓN DEL NORTE y el permiso para investigar (story.flags.rey_norte). El
     objetivo, la marca dorada sobre el Rey y el mapa lo indican.
   - Después sigue lo de siempre: Bruno, el Maestre Eloy, la taberna, Ruy, Brumavieja…
   - EL PORTÓN DEL NORTE (la salida del Norte del Roble al Bosque Embrujado): con cadena y candado. Sin el permiso del Rey no
     se pasa ("El portón del norte está cerrado con llave…"). Con la llave, al acercarse la cadena se abre (una vez,
     story.flags.norte_abierto) y el paso queda libre. Las partidas que ya estaban más adelante (Bruno ya habló, o paso 4 en
     adelante) lo tienen abierto.
   La emboscada de los vecinos, ahora en el Norte del Roble, está en ck_brumavieja.js v2.
   Va después de ck_desaparecidos.js, ck_historia.js y ck_zona_brumavieja.js. Borrar su línea de index.html deja el paso 3
   como antes y el portón abierto. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZN = 'ed_norte_del_roble.main', SALON = 'ed_salon_del_trono_3.main';
  const PORTON = { x: 743, y: 88, salida: 'zb_bosque' };          // el portón (arriba del puente) y su salida
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const LIBRE = () => !!(window.CK_LIBRE && CK_LIBRE());
  const nueva = s => !!(s && s.flags && s.flags.v2);
  /** Falta contarle al Rey (paso 3, antes de Bruno). */
  const reyPendiente = s => nueva(s) && s.step === 3 && !fl(s).h && !fl(s).rey_norte;
  /** El portón del norte se puede pasar. */
  const abierto = s => !s || !nueva(s) || !!fl(s).rey_norte || !!fl(s).h || s.step >= 4 || !!(s.flags && s.flags.c2) || LIBRE();

  // ------------------------------------------------------------------ lo que dicen
  const REY = STORY_NPCS.find(n => n.id === 'king'), CAP = STORY_NPCS.find(n => n.id === 'captain');
  const LINEAS_REY = [
    '¿Los tres vecinos del campo, vivos? Bruno me lo mandó a decir. Bien hecho.',
    '¿Y hablan de una luz verde que los llamaba por el nombre, hacia el norte? ¿Hacia Brumavieja?',
    'Brumavieja calla desde el invierno. Los que fueron a ver no volvieron a contarlo.',
    'Desde que bajó la niebla, el portón del norte está cerrado por orden mía. Tomá la llave.',
    'Tenés mi permiso para investigar. Pero no vayas a ciegas: el Capitán Bruno sabe más de lo que dice. Hablá con él antes de subir.'
  ];
  const LINEAS_BRUNO = [
    '¿Los tres? ¿Vivos? Bien hecho, recluta. Muy bien hecho.',
    'Lo que cuentan me hiela la sangre: una luz que llama por el nombre, y todos caminando hacia el norte.',
    'Esto tiene que saberlo el Rey. Andá al Gran Salón y contale. Sin su permiso, el portón del norte no se abre.'
  ];
  const LINEAS_BRUNO2 = [
    '¿El Rey te dio la llave del portón? Entonces va en serio.',
    'Lo que cuentan los tres me hiela la sangre: una luz que llama por el nombre, y todos caminando hacia Brumavieja.',
    'Tomá: una ración de la guardia. Te va a mantener en pie un golpe más.',
    'Antes de subir, sabé contra qué peleás. El Maestre Eloy estudió esa niebla: lo encontrás en la biblioteca, por el arco derecho del Gran Salón.'
  ];
  if (REY) {
    const l0 = REY.lines;
    REY.lines = function (s) { if (reyPendiente(s)) return LINEAS_REY.slice(); return l0.apply(this, arguments); };
  }
  if (CAP) {
    const l0 = CAP.lines;
    CAP.lines = function (s) {
      if (reyPendiente(s)) return LINEAS_BRUNO.slice();
      if (nueva(s) && s.step === 3 && !fl(s).h && fl(s).rey_norte) return LINEAS_BRUNO2.slice();   // con la llave del Rey
      return l0.apply(this, arguments);
    };
  }
  const tk0 = P.onTalked;
  P.onTalked = function (id) {
    const s = st(this);
    try {
      if (s && reyPendiente(s)) {
        if (id === 'captain') { this.updateObjective && this.updateObjective(); return; }   // todavía no: primero el Rey
        if (id === 'king') {
          fl(s).rey_norte = true;
          son('quest_done', 0.7) || son('book_clasp', 0.7);
          this.createFloatingText(this.player.x, this.player.y - 60, '🗝 LLAVE DEL PORTÓN DEL NORTE', 0xfde68a);
          this.time.delayedCall(1100, () => this.player && this.createFloatingText(this.player.x, this.player.y - 60, '✦ NUEVO OBJETIVO ✦', 0xfde68a));
          this.saveStory && this.saveStory(); this.updateObjective && this.updateObjective(); this.updateHUD && this.updateHUD();
          return;
        }
      }
    } catch (e) { console.warn('[norte del roble]', e); }
    return tk0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ el objetivo, la marca dorada y el mapa
  // (el camino a Brumavieja ahora es por los Campos, el Norte del Roble y su portón, y el Bosque Embrujado)
  try { if (typeof QUESTS !== 'undefined' && QUESTS[4]) QUESTS[4].goal = 'Subí a Brumavieja (Campos del Roble, el portón del Norte del Roble y el Bosque Embrujado) y encontrá al último aldeano'; } catch (e) {}
  const OBJ_REY = 'Contale al Rey lo de los desaparecidos (Gran Salón del castillo)';
  const OBJ_BRUNO = 'El Rey te dio la llave del portón del norte: hablá con el Capitán Bruno en el Patio de Armas';
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0.apply(this, arguments);
    try {
      const s = st(this), t = document.querySelector('#ck-objective .ck-obj-text');
      if (s && t && reyPendiente(s)) t.textContent = OBJ_REY;
      else if (s && t && nueva(s) && s.step === 3 && !fl(s).h && fl(s).rey_norte) t.textContent = OBJ_BRUNO;
    } catch (e) {}
    return r;
  };
  try {
    const H = window.CK_HISTORIA;
    if (H && H.parte && !H._ckRey) {
      const p0 = H.parte;
      H.parte = s => (reyPendiente(s) ? 'rey' : p0(s));
      H.OBJ.rey = OBJ_REY; H._ckRey = true;
    }
    const MM = window.CK_MINIMAPA;
    if (MM && MM.META_PARTE) MM.META_PARTE.rey = [SALON, 240, 142];
  } catch (e) {}
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const s = st(this), m = this._questMark;
      if (s && m && m.active && reyPendiente(s)) {
        const z = zona(this), k = STORY_NPCS.find(n => n.id === 'king' && n.zone === z && n.x > -9000), c = this.currentInterior;
        if (k && c) { const a = c.area; m.setVisible(true).setPosition(a.x + k.x, a.y + k.y - (a.outdoor ? 54 : 78) + Math.sin(this.time.now / 220) * 3); }
        else m.setVisible(false);                                           // (no sobre Bruno)
      }
      if (s && zona(this) === ZN) porton(this, s);
    } catch (e) { if (!P._ckNrErr) { P._ckNrErr = 1; console.warn('[norte del roble]', e); } }
    return r;
  };

  // ------------------------------------------------------------------ el portón: cadena y candado
  const dibujarCadena = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a || S._ckNrCad) return;
    const x = a.x + PORTON.x, y = a.y + PORTON.y, g = S.add.graphics().setDepth(y + 40);
    // dos vueltas de cadena cruzando las hojas y el candado en el medio
    const eslabones = (x0, y0, x1, y1) => {
      const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 7);
      for (let i = 0; i <= n; i++) {
        const t = i / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 6;
        g.fillStyle(0x1b1b1f, 1); g.fillEllipse(cx, cy, i % 2 ? 7 : 5, i % 2 ? 4 : 6);
        g.fillStyle(0x8d8f98, 1); g.fillEllipse(cx, cy - 0.5, i % 2 ? 5 : 3, i % 2 ? 2 : 4);
      }
    };
    eslabones(x - 44, y - 22, x + 44, y - 18);
    eslabones(x - 44, y - 8, x + 44, y - 12);
    const c = S.add.container(x, y - 6).setDepth(y + 41);
    const arco = S.add.graphics(); arco.lineStyle(3, 0x1b1b1f, 1); arco.strokeCircle(0, -7, 5); arco.lineStyle(1.5, 0xb8bcc8, 1); arco.strokeCircle(0, -7, 5);
    const cuerpo = S.add.rectangle(0, 0, 14, 12, 0xc9a227).setStrokeStyle(2, 0x3b2a05);
    const ojo = S.add.rectangle(0, 1, 2, 4, 0x3b2a05);
    c.add([arco, cuerpo, ojo]);
    S._ckNrCad = { g, c };
    (S.currentInterior.objects = S.currentInterior.objects || []).push(g, c);
  };
  const quitarCadena = (S, anim) => {
    const k = S._ckNrCad; if (!k) return; S._ckNrCad = null;
    if (!anim) { try { k.g.destroy(); k.c.destroy(); } catch (e) {} return; }
    son('door_gate', 0.8, { rate: 0.9 }) || son('chest_open', 0.7);
    S.tweens.add({ targets: k.c, y: k.c.y + 26, angle: 70, duration: 420, ease: 'Quad.easeIn', onComplete: () => S.tweens.add({ targets: k.c, alpha: 0, delay: 500, duration: 500, onComplete: () => k.c.destroy() }) });
    S.tweens.add({ targets: k.g, alpha: 0, duration: 600, onComplete: () => k.g.destroy() });
    S.cameras.main.shake(160, 0.003);
  };
  const porton = (S, s) => {
    if (!S.player || !S.currentInterior) return;
    if (fl(s).norte_abierto) { if (S._ckNrCad) quitarCadena(S, false); return; }
    if (!S._ckNrCad) dibujarCadena(S);
    if (!abierto(s) || S._ckEscena || S.dialogOpen) return;
    const a = S.currentInterior.area, b = S.player.body, px = b ? b.center.x : S.player.x, py = b ? b.bottom : S.player.y;
    if (Math.hypot(px - (a.x + PORTON.x), py - (a.y + PORTON.y + 20)) < 70) {
      fl(s).norte_abierto = true; S.saveStory && S.saveStory();
      quitarCadena(S, true);
      S.createFloatingText(S.player.x, S.player.y - 56, 'La llave del Rey abre el candado', 0xfde68a);
    }
  };
  const ar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ar0 ? ar0.apply(this, arguments) : undefined;
    try { this._ckNrCad = null; const s = st(this); if (s && zona(this) === ZN && !fl(s).norte_abierto) dibujarCadena(this); } catch (e) {}
    return r;
  };
  // sin el permiso del Rey, el portón no se pasa
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    try {
      const s = st(this);
      if (nombre === PORTON.salida && s && !abierto(s) && !this._doorTransition && zona(this) === ZN) {
        if (!this._ckNrAviso || this.time.now - this._ckNrAviso > 2200) {
          this._ckNrAviso = this.time.now;
          this.createFloatingText(this.player.x, this.player.y - 50, 'El portón del norte está cerrado con llave. Sin el permiso del Rey, nadie pasa', 0xfca5a5);
          son('door_locked', 0.6);
        }
        if (this.player.body) this.player.body.reset(this.player.x, this.player.y + 18);
        return;
      }
    } catch (e) {}
    return sw0.apply(this, arguments);
  };

  window.CK_NORTE_ROBLE = { PORTON, reyPendiente, abierto, LINEAS_REY };
})();
