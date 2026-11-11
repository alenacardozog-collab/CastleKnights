'use strict';
/* Primera misión: los aldeanos desaparecidos (10/11, pedido del dueño: "la primera parte será la del bosque encantado y la
   desaparición de aldeanos que tendremos que encontrar; luego hacemos toda la misión del nigromante, éste nos da la llave
   para culminar el primer capítulo").
   Sólo en partidas nuevas (story.flags.v2). Ocupa el paso 2 de la historia (antes "limpiar el camino"):
   - Después del entrenamiento, el Capitán Bruno manda a buscar a tres vecinos que salieron anoche al campo.
   - Están en los Campos del Roble (al oeste de la aldea), cada uno en un rincón: Juana en la orilla del estanque,
     Nina escondida junto al tocón hueco y Don Rufino, el pastor, en trance en el círculo de piedras. Se habla con T;
     hay una marca dorada sobre el más cercano. Cada uno cuenta algo de la luz que los llamaba hacia Brumavieja.
   - Cuando aparecen los tres, se vuelve con Bruno (paso 3) y sigue la historia de siempre (Eloy, la taberna, Ruy,
     Brumavieja, el Gran Esqueleto y el Nigromante). Los rescatados quedan en la taberna, contando lo que pasó.
   - Cuando llegue el mapa del Bosque Encantado (el del norte), se cambian de lugar en la tabla ALDEANOS.
   Para todas las partidas:
   - El Nigromante, al caer, deja la LLAVE DE LA FRONTERA (además del Códice). El Rey la recibe al final del capítulo
     y manda abrir el paso del este (ck_frontera_cerrada.js).
   Borrar su línea de index.html deja el paso 2 como antes (las bestias del camino). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;
  const ZCAMPOS = 'ed_campos_del_roble.main', ZT = 'ed_taberna_2.main';

  const S0 = () => window.activeGameScene || null;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const nueva = s => !!(s && s.flags && s.flags.v2);
  const enMision = s => nueva(s) && s.step === 2 && !(s.flags && s.flags.limos === 'pendiente');   // (10/11) antes, la noche de los limos (ck_prologo_noche.js)
  const hallados = s => fl(s).desap || (fl(s).desap = {});

  // ------------------------------------------------------------------ quiénes y dónde (medidas del mapa como se ve en el juego)
  const ALDEANOS = [
    { id: 'juana', nombre: 'Juana, la hermana de Clara', tex: 'npc14_villager', zona: ZCAMPOS, x: 392, y: 150, escala: 1.3, flip: true,
      taberna: [300, 228],
      lineas: [
        '¡Ay, gracias a Dios! Pensé que nadie iba a venir.',
        'Anoche vi una luz verde sobre el estanque. Era tan linda… La seguí sin darme cuenta.',
        'Di vueltas y vueltas en la niebla y me torcí el tobillo en el muelle. Y la luz se fue para el norte, hacia Brumavieja.',
        'Ya puedo caminar. Me vuelvo a la aldea: decile a Clara que estoy bien.'
      ],
      despues: ['Clara me retó como si yo tuviera diez años. Me lo merezco.', 'Esa luz verde… no la sigas. Te habla sin palabras.'] },
    { id: 'nico', nombre: 'Nina, la hija de Ciriaco', tex: 'npc4_villager', zona: ZCAMPOS, x: 168, y: 470, escala: 1.05, flip: false,
      taberna: [326, 228],
      lineas: [
        '¡No me lleves! Ah… sos de verdad. Perdón.',
        'Me escondí acá en el tocón cuando vi a los otros caminar como dormidos.',
        'Una voz me llamaba por mi nombre, ¡y sonaba igual que mi mamá! Pero mi mamá está en casa.',
        'Ya me voy, ya me voy. ¡Y no le digas a mi papá que lloré!'
      ],
      despues: ['Mi papá dice que soy una valiente. Yo no le conté lo del llanto.', 'Si vas al norte, llevá sal. Lo dice la abuela Mirta.'] },
    { id: 'rufino', nombre: 'Don Rufino, el pastor', tex: 'npc13_villager', zona: ZCAMPOS, x: 248, y: 404, escala: 1.3, flip: false, trance: true,
      taberna: [276, 232],
      lineas: [
        '…las piedras cantan… hay que ir al norte… el pastor de los muertos espera…',
        '¿Eh? ¿Dónde…? ¿Qué hago acá, en el medio de las piedras viejas?',
        'Me acuerdo de una voz que decía mi nombre y de mucho frío. Caminaba hacia Brumavieja y no podía parar.',
        'Gracias, de verdad. Si no me despertabas, mañana era uno más de los de allá arriba.',
        'Me vuelvo al Roble. Y vos andá a contarle al Capitán: esto no es cosa de lobos.'
      ],
      despues: ['Todavía escucho las piedras cuando cierro los ojos.', 'El que llama a los muertos está en Brumavieja. Estoy seguro.'] }
  ];
  const por = {}; ALDEANOS.forEach(a => (por[a.id] = a));
  const faltan = s => ALDEANOS.filter(a => !hallados(s)[a.id]);

  // gente de la historia: sólo "están" cuando corresponde
  ALDEANOS.forEach(a => {
    if (STORY_NPCS.some(n => n.id === 'desap_' + a.id)) return;
    STORY_NPCS.push({
      id: 'desap_' + a.id, x: a.x, y: a.y - 4, r: 34, name: a.nombre, face: a.tex,
      get zone() {
        const s = st(S0()); if (!s || !nueva(s)) return '-';
        if (enMision(s) && !hallados(s)[a.id]) return a.zona;
        if (hallados(s)[a.id] && s.step >= 3) return ZT;
        return '-';
      },
      get x() { const s = st(S0()); return s && hallados(s)[a.id] ? a.taberna[0] : a.x; },
      get y() { const s = st(S0()); return s && hallados(s)[a.id] ? a.taberna[1] - 4 : a.y - 4; },
      lines: s => (hallados(s)[a.id] ? a.despues : a.lineas)
    });
  });

  // ------------------------------------------------------------------ dibujarlos
  const quitar = S => { (S._ckDesap || []).forEach(o => o && o.active && o.destroy()); S._ckDesap = []; };
  const dibujar = S => {
    quitar(S);
    const s = st(S); if (!s || !nueva(s)) return;
    const z = S.currentZoneKey();
    ALDEANOS.forEach(a => {
      let x, y;
      if (z === a.zona && enMision(s) && !hallados(s)[a.id]) { x = a.x; y = a.y; }
      else if (z === ZT && hallados(s)[a.id] && s.step >= 3) { x = a.taberna[0]; y = a.taberna[1]; }
      else return;
      if (!S.textures.exists(a.tex)) return;
      const sp = E.actor(S, a.tex, x, y, { escala: a.escala, flip: a.flip });
      sp._ckDesap = a.id;
      S._ckDesap.push(sp);
      if (a.trance && z === a.zona) {
        // en trance: un brillo verde que late y el cuerpo que se mece
        const ar = E.area(S);
        const halo = S.add.ellipse(ar.x + x, ar.y + y - 2, 30, 10, 0x7cf0a0, 0.28).setDepth(sp.depth - 1).setBlendMode(1);
        S.tweens.add({ targets: halo, alpha: 0.08, scaleX: 1.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        S.tweens.add({ targets: sp, angle: 4, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        sp.setTint(0xcff5dc);
        S._ckDesap.push(halo);
        sp._ckHalo = halo;
      }
    });
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () { const r = area0.apply(this, arguments); try { dibujar(this); } catch (e) { console.warn('[desaparecidos]', e); } return r; };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () { const r = ald0.apply(this, arguments); try { quitar(this); } catch (e) {} return r; };

  // ------------------------------------------------------------------ hablar con ellos
  const habla0 = P.onTalked;
  P.onTalked = function (id) {
    const s = st(this);
    const m = /^desap_(\w+)$/.exec(id || '');
    if (m && s && enMision(s) && !hallados(s)[m[1]]) {
      const a = por[m[1]];
      hallados(s)[a.id] = true;
      s.count = ALDEANOS.length - faltan(s).length;
      s.coins = (s.coins || 0) + 8;
      this.gainXP(20);
      this.createFloatingText(this.player.x, this.player.y - 50, `✦ ${a.nombre.split(',')[0].toUpperCase()} ENCONTRAD${a.id === 'juana' ? 'A' : 'O'} ✦`, 0xfde68a);
      try { typeof sfx !== 'undefined' && (sfx.fx('quest_done', 0.6) || sfx.fx('book_clasp', 0.6)); } catch (e) {}
      // se vuelve a la aldea caminando por el camino del este y se va
      const sp = (this._ckDesap || []).find(o => o && o._ckDesap === a.id);
      if (sp) {
        if (sp._ckHalo) { this.tweens.killTweensOf(sp._ckHalo); sp._ckHalo.destroy(); }
        this.tweens.killTweensOf(sp); sp.setAngle(0).clearTint();
        (async () => {
          await E.globo(this, sp, a.id === 'nico' ? '¡Gracias! ¡Chau!' : 'Gracias… Me vuelvo a casa.', 1500);
          await E.caminar(this, sp, a.x + (a.x < 700 ? 60 : -60), a.y + 10, 46);
          this.tweens.add({ targets: sp, alpha: 0, duration: 700, onComplete: () => sp.destroy() });
        })();
      }
      if (!faltan(s).length) {
        this.time.delayedCall(900, () => { this.advanceQuest(); this.showZoneTitle('¡Los tres a salvo!', 'Volvé con el Capitán Bruno'); });
      } else { this.updateObjective(); this.saveStory(); }
      return;
    }
    return habla0.apply(this, arguments);
  };

  // mientras se buscan, las bestias del camino no cuentan para el paso 2 de antes
  const der0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const s = st(this);
    if (s && enMision(s) && typeof QUESTS !== 'undefined' && QUESTS[2]) {
      const c = s.count, q = QUESTS[2].count;
      QUESTS[2].count = Infinity;
      try { return der0.apply(this, arguments); } finally { QUESTS[2].count = q; s.count = c; }
    }
    const r = der0.apply(this, arguments);
    // la llave de la Frontera cae con el Nigromante (todas las partidas)
    try {
      if (s && enemy && enemy.type === 'necromancer' && !fl(s).llave_frontera) {
        fl(s).llave_frontera = true;
        this.time.delayedCall(3000, () => {
          if (!this.player) return;
          this.createFloatingText(this.player.x, this.player.y - 86, '🗝 LLAVE DE LA FRONTERA', 0xfde68a);
          this.saveStory();
        });
      }
    } catch (e) {}
    return r;
  };

  // en los Campos, las pistas con T (ck_campos.js) atajan la tecla antes: si hay un aldeano al lado, habla él
  const cercano = S => {
    const h = S.nearbyStoryNPC && S.nearbyStoryNPC();
    return h && /^desap_/.test(h.npc.id) ? h.npc : null;
  };
  const in0 = P.interact;
  P.interact = function () {
    try {
      if (!this.dialogOpen && !this._overlay && st(this)) {
        const n = cercano(this);
        if (n) { this.openDialog(n.name, n.lines(this.story), () => this.onTalked(n.id), n.face); return; }
      }
    } catch (e) { console.warn('[desaparecidos]', e); }
    return in0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ objetivo y marca dorada
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = st(this), box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text');
      if (s && t && enMision(s)) t.textContent = `Buscá a los aldeanos desaparecidos en los Campos del Roble (al oeste de la aldea) · ${ALDEANOS.length - faltan(s).length}/${ALDEANOS.length}`;
      if (s && t && nueva(s) && s.step === 3 && !fl(s).h) t.textContent = 'Volvé con el Capitán Bruno al Patio de Armas: los tres están a salvo';
    } catch (e) {}
    return r;
  };
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      const s = st(this);
      if (s && enMision(s) && this._questMark && this.currentZoneKey() === ZCAMPOS && this.currentInterior && this.player) {
        const a = this.currentInterior.area, p = this.player;
        const q = faltan(s).filter(v => v.zona === ZCAMPOS).sort((u, v) => Math.hypot(a.x + u.x - p.x, a.y + u.y - p.y) - Math.hypot(a.x + v.x - p.x, a.y + v.y - p.y))[0];
        if (q) this._questMark.setVisible(true).setPosition(a.x + q.x, a.y + q.y - 50 * (q.escala / 1.3) + Math.sin(this.time.now / 220) * 3);
      }
      const n = s && !this.dialogOpen && cercano(this), pr = document.getElementById('ck-prompt');
      if (n && pr) { pr.textContent = 'T · Hablar con ' + n.name; pr.classList.add('on'); }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ Bruno, a la vuelta; el Rey, con la llave
  const CAP = STORY_NPCS.find(n => n.id === 'captain'), REY = STORY_NPCS.find(n => n.id === 'king');
  if (CAP) {
    const l0 = CAP.lines;
    CAP.lines = function (s, hero) {
      if (nueva(s) && s.step === 2) return ['Los tres salieron anoche al campo, al oeste de la aldea. Buscalos en los Campos del Roble.', 'Y si ves luces en la niebla, no las sigas.'];
      if (nueva(s) && s.step === 3 && !fl(s).h) return [
        '¿Los tres? ¿Vivos? Bien hecho, recluta. Muy bien hecho.',
        'Pero lo que cuentan me hiela la sangre: una luz que llama por el nombre, y todos caminando hacia Brumavieja.',
        'Tomá: una ración de la guardia. Te va a mantener en pie un golpe más.',
        'Antes de mandarte allá arriba, el Rey quiere saber contra qué peleamos.',
        'El Maestre Eloy estudió esa niebla. Lo encontrás en la biblioteca, por el arco derecho del Gran Salón.'
      ];
      return l0.apply(this, arguments);
    };
  }
  if (REY) {
    const l0 = REY.lines;
    REY.lines = function (s, hero) {
      const ls = l0.apply(this, arguments);
      try {
        if (s && s.step === 7 && fl(s).codice_ok && fl(s).llave_frontera && Array.isArray(ls) && !ls.some(l => /Frontera/.test(l)))
          return ls.slice(0, -1).concat([
            '¿Y esa llave de hierro negro? Es la del portón de la Frontera. Varek la robó del castillo para abrirle paso a lo que duerme junto al monolito.',
            'Con ella en nuestras manos, el paso del este vuelve a ser del reino. Voy a mandar a los soldados que te dejen pasar.',
            ls[ls.length - 1]
          ]);
      } catch (e) {}
      return ls;
    };
  }

  window.CK_DESAPARECIDOS = { ALDEANOS, faltan, hallados, dibujar };
})();
