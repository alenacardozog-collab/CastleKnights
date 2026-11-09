'use strict';
/* Capítulo 2 · La Frontera Orca (27/10, mapas de Google Flow del dueño armados en el Taller).
   Recorrido: Camino al Castillo (camino de abajo, por la escalera del mirador, hacia el ESTE)
     → Bosque de la Frontera (se entra por el oeste, se sale por el norte)
     → Tierras Orcas (se entra por el sur, se sale por el este)
     → Pueblo Orco (se entra por el oeste; el portón del norte lo abre Gorak)
     → Fortaleza Orca (se entra por el sur; el Caudillo Grushak en su trono de huesos, arriba a la derecha).
   Cada salida vuelve al mapa de antes, del lado por el que se vino.
   Historia (banderas en la partida guardada, story.flags.c2 = paso; no toca los pasos del Capítulo 1). Empieza cuando el
   Maestre Eloy cierra el Capítulo 1:
     1 Rey: llegan noticias de la frontera → 2 Capitán Bruno: caravanas quemadas, bajá por el mirador hacia el este →
     3 Bosque: el mercader Tomás junto a su carreta (se llevaron a su hija Mira) → 4 Tierras Orcas: vencé a 5 orcos →
     5 Pueblo Orco: Gorak, el orco desterrado (junto a los cerdos), abre el portón del norte → 6 Fortaleza: el Caudillo
     Grushak → 7 liberá a Mira → 8 volvé con el Rey → 9 Capítulo 2 completo.
   El Caudillo: sprite y hachazo hechos con SpriteLab (js/core/ck_caudillo_assets.js); si no está ese archivo, sale un
   Orco de Élite grande en su lugar.
   Borrar la línea de index.html lo saca entero (las partidas siguen sirviendo). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined') return;
  const P = MainGameScene.prototype,
    D = window.EDITOR_DATA;
  if (!D || !D.mapas) return;
  const ID = { bosque: 'bosque_de_la_frontera', tierras: 'tierras_orcas', pueblo: 'pueblo_orco', fortaleza: 'fortaleza_orca', camino: 'camino_al_castillo' };
  const hay = id => !!(D.mapas[id] && !D.mapas[id].origen && INTERIOR_LAYOUTS['ed_' + id]);
  if (![ID.bosque, ID.tierras, ID.pueblo, ID.fortaleza, ID.camino].every(hay)) return;
  const Z = {};
  Object.keys(ID).forEach(k => (Z[k] = 'ed_' + ID[k] + '.main'));
  const kindDe = id => 'ed_' + id;

  // ================================================================== conexiones (salida -> mapa y lugar de llegada)
  // 'to' de las salidas nuevas: c2_<lugar>; las salidas del Taller (destino _aldea) vuelven al mapa de antes
  const VA = {
    c2_bosque: [ID.bosque, { x: 64, y: 392 }],
    c2_tierras: [ID.tierras, { x: 198, y: 496 }],
    c2_pueblo: [ID.pueblo, { x: 64, y: 136 }],
    c2_fortaleza: [ID.fortaleza, { x: 140, y: 500 }]
  };
  const VUELTA = {
    [kindDe(ID.bosque)]: [ID.camino, { x: 1392, y: 688 }],
    [kindDe(ID.tierras)]: [ID.bosque, { x: 760, y: 40 }],
    [kindDe(ID.pueblo)]: [ID.tierras, { x: 916, y: 134 }],
    [kindDe(ID.fortaleza)]: [ID.pueblo, { x: 778, y: 50 }]
  };
  const SALIDAS = {
    [ID.camino]: [{ x: 1418, y: 656, w: 18, h: 64, key: 'walk', to: 'c2_bosque', hint: '▶ Bosque de la Frontera' }],
    [ID.bosque]: [{ x: 736, y: 0, w: 60, h: 18, key: 'walk', to: 'c2_tierras', hint: '▲ Tierras Orcas' }],
    [ID.tierras]: [{ x: 938, y: 106, w: 20, h: 56, key: 'walk', to: 'c2_pueblo', hint: '▶ Pueblo Orco' }],
    [ID.pueblo]: [{ x: 752, y: 0, w: 52, h: 18, key: 'walk', to: 'c2_fortaleza', hint: '▲ Fortaleza Orca' }]
  };
  const fl = s => (s.flags = s.flags || {});
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre, llegada) {
    if (typeof nombre === 'string' && VA[nombre]) {
      if (this._doorTransition) return;
      // el portón del norte del pueblo está trancado hasta que Gorak lo abre
      if (nombre === 'c2_fortaleza' && paso(this.story) < 6) {
        if (!this._c2Tranca || this.time.now - this._c2Tranca > 3000) {
          this._c2Tranca = this.time.now;
          this.createFloatingText(this.player.x, this.player.y - 46, 'El portón está trancado desde adentro', 0xfca5a5);
        }
        return;
      }
      this.ckEntrar(VA[nombre][0], VA[nombre][1]);
      return;
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const c = this.currentInterior, v = c && VUELTA[c.building.kind];
    if (v && !this._doorTransition && this.ckEntrar(v[0], v[1])) return;
    return salir0.apply(this, arguments);
  };

  // ================================================================== el Caudillo (jefe)
  const CUADROS = window.CK_CAUDILLO_CUADROS;
  const JEFE = CUADROS && typeof ENEMY_TYPES !== 'undefined' ? 'orc_warlord' : 'orc_elite';
  if (CUADROS && typeof ENEMY_TYPES !== 'undefined' && !ENEMY_TYPES.orc_warlord)
    ENEMY_TYPES.orc_warlord = {
      name: 'Grushak, el Caudillo', frames: CUADROS, hp: 30, speed: 62, dmg: 2, reach: 64, cd: 1900, hitAt: 430, xp: 220, coins: 60,
      scale: 1.2, block: 0.15, boss: true, meleeToo: true,
      sfx: ['orc_attack', 'orc_hurt', 'orc_death', 0.6],
      summon: { type: 'orc_armored', every: 11000, max: 3 }
    };
  const crear0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, tipo) {
    const e = crear0.apply(this, arguments);
    try {
      if (e && e.type === 'orc_warlord') {
        e.body.setSize(24, 10);
        e.body.setOffset(38, 82); // los pies de sus cuadros están en y = 92
      }
    } catch (er) {}
    return e;
  };
  // la segunda fase dice otra cosa con él
  const texto0 = P.createFloatingText;
  P.createFloatingText = function (x, y, txt) {
    if (txt === '¡LA NIEBLA SE CIERRA!' && this.currentZoneKey && this.currentZoneKey() === Z.fortaleza) arguments[2] = '¡GRUSHAK SE ENFURECE!';
    return texto0.apply(this, arguments);
  };

  // ================================================================== mapas: salidas, gente, enemigos
  const npcItem = (a, key, anim, x, y, sc, flip) => {
    a.items.push({ key, anim, x, baseY: y, scale: sc, oy: 1, ox: 0.5, flipX: !!flip });
    a.colliders.push({ x: x - 7, y: y - 8, w: 14, h: 8 });
  };
  const EXTRA = {
    [ID.camino]: a => a.talkers.push({ x: 1396, y: 690, r: 30, lines: ['▶ Hacia el este: el Bosque de la Frontera'] }),
    [ID.bosque]: a => {
      npcItem(a, 'npc10_villager', 'npc10_idle', 552, 396, 1.85, true);
      a.talkers.push({ x: 722, y: 52, r: 34, lines: ['Tótems orcos: cráneos de buey y trapos rojos. De acá en adelante, la tierra es de ellos'] });
      a.fx.push({ type: 'dust', x: 600, y: 100, w: 300, h: 300 });
    },
    [ID.tierras]: a => {
      a.talkers.push({ x: 852, y: 360, r: 34, lines: ['Un tambor de guerra. Cuando suena, los orcos se juntan'] });
      a.talkers.push({ x: 616, y: 120, r: 34, lines: ['Una torre vigía. Desde arriba se ve el humo del pueblo orco, al este'] });
      a.fx.push({ type: 'ash', x: -40, y: -20, w: 1000, h: 560 });
    },
    [ID.pueblo]: a => {
      npcItem(a, 'orc_idle', 'orc_idle', 112, 352, 1.2, false);
      a.talkers.push({ x: 830, y: 330, r: 40, lines: ['La casa del jefe. Huele a humo y a carne quemada'] });
      a.talkers.push({ x: 778, y: 60, r: 30, lines: ['▲ El portón del norte: el camino a la fortaleza'] });
      a.fx.push({ type: 'dust', x: 300, y: 200, w: 400, h: 200 });
    },
    [ID.fortaleza]: a => {
      npcItem(a, 'npc8_villager', 'npc8_idle', 640, 132, 1.85, true);
      a.talkers.push({ x: 300, y: 380, r: 34, lines: ['Una arena de estacas. Acá los orcos pelean para ver quién manda'] });
    }
  };
  Object.keys(EXTRA).forEach(id => {
    const L = INTERIOR_LAYOUTS[kindDe(id)];
    INTERIOR_LAYOUTS[kindDe(id)] = function (kit) {
      const r = L.apply(this, arguments), a = kit.areas && kit.areas.main;
      if (a) {
        ['exits', 'talkers', 'actors', 'items', 'fx', 'colliders'].forEach(k => (a[k] = a[k] || []));
        (SALIDAS[id] || []).forEach(s => a.exits.push(Object.assign({}, s)));
        try { EXTRA[id](a); } catch (e) { console.warn('[capítulo 2]', e); }
      }
      return r;
    };
  });
  if (typeof ZONE_ENEMIES !== 'undefined') {
    ZONE_ENEMIES[Z.bosque] = [['orc', 700, 250, 40], ['orc', 820, 340, 40], ['orc', 640, 440, 40], ['bat', 300, 420, 50], ['werewolf', 560, 180, 50, 'night']];
    ZONE_ENEMIES[Z.tierras] = [['orc', 300, 300, 40], ['orc', 420, 170, 40], ['orc_armored', 640, 190, 40], ['orc', 760, 300, 40], ['orc_armored', 700, 450, 30],
      ['orc', 240, 420, 30], ['orc_rider', 520, 430, 40, 'night']];
    ZONE_ENEMIES[Z.pueblo] = [['orc', 300, 230, 30], ['orc', 620, 280, 30], ['orc_armored', 520, 380, 30], ['orc_armored', 700, 160, 30], ['orc_elite', 640, 340, 30],
      ['orc', 420, 460, 30]];
    ZONE_ENEMIES[Z.fortaleza] = [['orc_armored', 300, 380, 30], ['orc_elite', 560, 310, 30], ['orc_armored', 700, 420, 30], ['orc_elite', 160, 150, 30], ['orc', 830, 420, 30]];
  }
  // ambiente
  const SON = { bosque: [['amb_forest', 0.5]], tierras: [['amb_ruinas', 0.4]], pueblo: [['amb_fire', 0.3], ['amb_courtyard', 0.2]], fortaleza: [['amb_fire', 0.35], ['amb_ruinas', 0.25]] };
  Object.keys(SON).forEach(k => { const m = D.mapas[ID[k]]; if (!(m.sonido && m.sonido.length)) m.sonido = SON[k]; });

  // ================================================================== historia
  const OBJ = {
    1: 'Presentate ante el Rey: llegan malas noticias de la frontera',
    2: 'Hablá con el Capitán Bruno en el Patio de Armas',
    3: 'Bajá por la escalera del mirador del camino del castillo y seguí el camino de abajo hacia el este, al Bosque de la Frontera',
    4: 'Tierras Orcas (al norte del bosque): vencé a los orcos que vigilan el camino',
    5: 'Pueblo Orco (al este de las Tierras Orcas): buscá a Gorak, el orco desterrado',
    6: 'Fortaleza Orca (portón del norte del pueblo): derrotá al Caudillo Grushak en su trono',
    7: 'Liberá a Mira, la hija del mercader (junto a los armeros del trono)',
    8: 'Volvé al castillo y contale todo al Rey',
    9: 'Capítulo 2 completo. Las Torres de Escarcha esperan… (próximamente)'
  };
  const OBJETIVO_DE = { 1: ['king', null], 2: ['captain', null], 3: ['mercader', Z.bosque], 5: ['gorak', Z.pueblo], 7: ['mira', Z.fortaleza], 8: ['king', null] };
  const CUENTA = 4;
  const nuevo = (sc, n, xp, oro, txt) => {
    const s = sc.story, f = fl(s);
    f.c2 = n;
    if (oro) s.coins = (s.coins || 0) + oro;
    if (xp) sc.gainXP(xp);
    if (txt) sc.createFloatingText(sc.player.x, sc.player.y - 46, txt, 0xfde68a);
    if (typeof sfx !== 'undefined') sfx.fx('quest_done', 0.7) || sfx.fx('book_clasp', 0.7);
    sc.createFloatingText(sc.player.x, sc.player.y - 64, '✦ NUEVO OBJETIVO ✦', 0xfde68a);
    sc.updateObjective(); sc.updateHUD(); sc.saveStory();
  };
  if (typeof STORY_NPCS !== 'undefined') {
    STORY_NPCS.push(
      {
        id: 'mercader', zone: Z.bosque, x: 552, y: 400, r: 44, name: 'Tomás, el mercader', face: 'npc10_villager',
        lines: s => {
          const p = paso(s);
          if (p === 3)
            return [
              '¡No me lastimes! Ah… sos del castillo. Gracias al cielo.',
              'Íbamos con la caravana a la feria del este cuando salieron de entre los árboles. Orcos, decenas.',
              'Quemaron todo. Y se llevaron a mi hija, a Mira. Gritaban un nombre: Grushak, Grushak…',
              'Se fueron hacia el norte, por las tierras de ceniza. Por favor… traela de vuelta.'
            ];
          if (p >= 4 && p <= 7) return ['Mira tiene trenzas y un pañuelo azul. Si la ves, decile que su padre la espera.'];
          if (p >= 8) return ['¡Mira está a salvo! No sé cómo pagarte. Cuando vuelva a la feria, todo lo mío es tuyo.'];
          return ['El bosque ya no es lo que era. De noche se escuchan tambores al norte.'];
        }
      },
      {
        id: 'gorak', zone: Z.pueblo, x: 112, y: 356, r: 46, name: 'Gorak, el desterrado', face: 'orc_idle',
        lines: s => {
          const p = paso(s);
          if (p === 5)
            return [
              '¡Quieto, humano! …No sacás la espada. Raro. Mirá: yo no soy como ellos.',
              'Me echaron de la fortaleza porque no quise quemar aldeas. Grushak no perdona a los que piensan.',
              'Tiene a una chica humana encadenada junto a su trono. Dice que es su trofeo.',
              'El portón del norte se tranca desde adentro. Lo voy a abrir. Lo que hagas allá arriba… es cosa tuya.',
              'Si lo vencés, los orcos de la frontera van a dejar de seguirlo. Muchos lo odian tanto como yo.'
            ];
          if (p === 6 || p === 7) return ['El portón está abierto. Grushak pega fuerte, pero es lento. Esquivá y golpeá.'];
          if (p >= 8) return ['Sin Grushak, el clan va a necesitar un jefe nuevo… Tal vez uno que no queme aldeas.'];
          return ['Andate, humano. Este no es lugar para vos.'];
        }
      },
      {
        id: 'mira', zone: Z.fortaleza, x: 640, y: 138, r: 40, name: 'Mira', face: 'npc8_villager',
        lines: s => {
          const p = paso(s);
          if (p === 7)
            return [
              '¿Se… se terminó? ¿Grushak está…?',
              'Gracias. Pensé que nunca iba a volver a ver el bosque.',
              '¿Mi padre está vivo? Llevame con él, por favor. Conozco un atajo de vuelta.'
            ];
          if (p === 6) return ['¡Cuidado! ¡Grushak está ahí, en el trono!'];
          return ['Gracias por todo. Mi padre te espera en el bosque.'];
        }
      }
    );
    const REY = STORY_NPCS.find(n => n.id === 'king'), CAP = STORY_NPCS.find(n => n.id === 'captain');
    if (REY) {
      const l0 = REY.lines;
      REY.lines = (s, hero) => {
        const p = paso(s);
        if (p === 1)
          return [
            'Justo a tiempo. Mientras peleabas contra la niebla, llegaron jinetes de la frontera del este.',
            'Las caravanas que van a la feria no llegan. Los mercaderes hablan de orcos, muchos, con un solo jefe.',
            'Hacía veinte años que los clanes no se unían. Si lo hicieron, alguien los está empujando.',
            'El Capitán Bruno sabe más. Buscalo en el Patio de Armas.'
          ];
        if (p === 8)
          return [
            '¿Grushak, vencido? ¿Y la hija del mercader, a salvo?',
            'Otra vez el reino te debe todo. Tomá esto, y que se sepa en cada aldea quién cuidó la frontera.',
            'Pero Mira dijo algo que me quita el sueño: Grushak hablaba de un aliado en el norte, entre la escarcha.',
            'Descansá. Cuando el paso del norte se abra, te voy a necesitar.'
          ];
        return l0(s, hero);
      };
    }
    if (CAP) {
      const l0 = CAP.lines;
      CAP.lines = (s, hero) => {
        const p = paso(s);
        if (p === 2)
          return [
            'Te estaba esperando. Mirá este mapa: tres caravanas quemadas en una semana, todas en el Bosque de la Frontera.',
            'Para llegar, bajá por la escalera del mirador, en el camino del castillo, y seguí el camino de abajo hacia el este.',
            'Si encontrás sobrevivientes, escuchalos. Y si encontrás orcos… bueno, ya sabés qué hacer.',
            'Tomá: una poción de la guardia. Allá no hay tiendas.'
          ];
        if (p >= 3 && p <= 7) return ['La frontera está al este, bajando por el mirador del camino. Volvé entero.'];
        return l0(s, hero);
      };
    }
  }
  const hablado0 = P.onTalked;
  P.onTalked = function (id) {
    const s = this.story, p = paso(s);
    if (s && p) {
      if (id === 'king' && p === 1) return nuevo(this, 2, 20, 0, '');
      if (id === 'captain' && p === 2) {
        const st = this.story; st.inv = st.inv || { potion: 0, elixir: 0 }; st.inv.potion = (st.inv.potion || 0) + 1;
        return nuevo(this, 3, 15, 10, '+ POCIÓN DE LA GUARDIA');
      }
      if (id === 'mercader' && p === 3) return nuevo(this, 4, 30, 0, '');
      if (id === 'gorak' && p === 5) return nuevo(this, 6, 40, 0, 'EL PORTÓN DEL NORTE ESTÁ ABIERTO');
      if (id === 'mira' && p === 7) return nuevo(this, 8, 60, 25, 'MIRA, A SALVO');
      if (id === 'king' && p === 8) {
        nuevo(this, 9, 150, 120, '+120 MONEDAS');
        this.maxHealth = this.story.maxHealth = Math.max(this.story.maxHealth || 3, 5);
        this.health = this.maxHealth;
        this.time.delayedCall(1400, () => this.showZoneTitle && this.showZoneTitle('Capítulo 2 completo', 'La frontera vuelve a estar en paz… por ahora'));
        return;
      }
      if (id === 'king' && p >= 2 && p <= 7) return; // el Rey ya habló
      if (id === 'captain' && p >= 3 && p <= 7) return;
    }
    return hablado0.apply(this, arguments);
  };
  // el Capítulo 2 empieza cuando Eloy cierra el 1 (ck_historia.js: bandera "epilogo")
  const titulo0 = P.showZoneTitle;
  P.showZoneTitle = function (t, sub) {
    if (t === 'Capítulo 2' && /Torres de Escarcha/.test(sub || '')) sub = 'La Frontera Orca';
    return titulo0.call(this, t, sub);
  };
  const objetivo0 = P.updateObjective;
  P.updateObjective = function () {
    const s = this.story;
    if (s && s.step >= 8 && fl(s).epilogo && !paso(s)) fl(s).c2 = 1;
    const r = objetivo0.apply(this, arguments);
    const p = paso(s), box = document.getElementById('ck-objective');
    if (p && OBJ[p] && box) box.querySelector('.ck-obj-text').textContent = OBJ[p] + (p === 4 ? ` (${Math.min(fl(s).c2n || 0, CUENTA)}/${CUENTA})` : '');
    return r;
  };
  const vencido0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = vencido0.apply(this, arguments);
    try {
      const s = this.story, p = paso(s);
      if (s && p === 4 && enemy && enemy.zone === Z.tierras && /^orc/.test(enemy.type)) {
        const f = fl(s);
        f.c2n = (f.c2n || 0) + 1;
        if (f.c2n >= CUENTA) nuevo(this, 5, 50, 20, 'LOS VIGÍAS CAYERON');
        else { this.updateObjective(); this.saveStory(); }
      }
      if (s && enemy && enemy.type === JEFE && enemy._c2Jefe) {
        fl(s).grushak = true;
        this.time.delayedCall(1500, () => this.player && nuevo(this, 7, 0, 0, '⚔ GRUSHAK HA CAÍDO'));
      }
    } catch (e) {}
    return r;
  };
  // el jefe sale al acercarse al trono; marca dorada sobre quien sigue la historia
  const TRONO = { x: 800, y: 196 };
  const historia0 = P.updateStory;
  P.updateStory = function () {
    const r = historia0.apply(this, arguments);
    try {
      const s = this.story;
      if (this._gameMode !== 'campaign' || !s || !this.player || !this.currentInterior) return r;
      const zone = this.currentZoneKey(), p = paso(s), a = this.currentInterior.area;
      if (p === 6 && zone === Z.fortaleza && !this._c2Jefe && !fl(s).grushak) {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x + TRONO.x, a.y + TRONO.y) < 190) {
          this._c2Jefe = true;
          this.cameras.main.shake(700, 0.008);
          this.cameras.main.flash(400, 160, 40, 20);
          if (typeof sfx !== 'undefined') sfx.fx('orc_attack', 1, { rate: 0.6 });
          this.showZoneTitle('Grushak', 'Caudillo de los clanes orcos');
          const boss = this.spawnEnemy(a.x + TRONO.x - 40, a.y + TRONO.y + 30, JEFE);
          if (boss) {
            boss._c2Jefe = true;
            boss.zone = zone;
            if (JEFE !== 'orc_warlord') { boss.hp = boss.maxHp = 24; boss.setScale(1.9).setTint(0xb45309); }
            this.time.delayedCall(900, () => boss.active && this.alertEnemy(boss));
          }
        }
      }
      const obj = OBJETIVO_DE[p];
      if (obj && obj[1] === zone && this._questMark && this._questMark.active) {
        const n = STORY_NPCS.find(x => x.id === obj[0]);
        if (n) this._questMark.setVisible(true).setPosition(a.x + n.x, a.y + n.y - 62 + Math.sin(this.time.now / 220) * 3);
      }
    } catch (e) {}
    return r;
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    this._c2Jefe = false;
    return mostrar0 ? mostrar0.apply(this, arguments) : undefined;
  };

  // ================================================================== minimapa
  const MM = window.CK_MINIMAPA;
  if (MM && MM.Z && MM.L) {
    const CAMINO = Z.camino, G = 'Camino al Castillo';   // en el mapa grande, en la pestaña del camino (las pestañas son fijas)
    const zona = (k, n) => { if (!MM.Z[Z[k]]) MM.Z[Z[k]] = { img: ID[k], esc: 4, w: D.mapas[ID[k]].w, h: D.mapas[ID[k]].h, ext: 1, n, g: G }; };
    zona('bosque', 'Bosque de la Frontera'); zona('tierras', 'Tierras Orcas'); zona('pueblo', 'Pueblo Orco'); zona('fortaleza', 'Fortaleza Orca');
    MM.L[Z.bosque] = [{ n: 'Carreta quemada', x: 550, y: 300, ic: 'estrella' }, { n: 'Volver al camino', x: 8, y: 392, ic: 'flecha', d: 'o', va: CAMINO },
      { n: 'Tierras Orcas', x: 762, y: 6, ic: 'flecha', d: 'n', va: Z.tierras }];
    MM.L[Z.tierras] = [{ n: 'Torre vigía', x: 616, y: 70, ic: 'torre' }, { n: 'Volver al bosque', x: 198, y: 528, ic: 'flecha', d: 's', va: Z.bosque },
      { n: 'Pueblo Orco', x: 952, y: 134, ic: 'flecha', d: 'e', va: Z.pueblo }];
    MM.L[Z.pueblo] = [{ n: 'Gorak', x: 112, y: 356, ic: 'persona' }, { n: 'Fogón', x: 510, y: 286, ic: 'fuego' }, { n: 'Volver a las Tierras Orcas', x: 6, y: 136, ic: 'flecha', d: 'o', va: Z.tierras },
      { n: 'Fortaleza Orca', x: 778, y: 6, ic: 'flecha', d: 'n', va: Z.fortaleza }];
    MM.L[Z.fortaleza] = [{ n: 'Trono de huesos', x: 830, y: 120, ic: 'espada' }, { n: 'Arena', x: 560, y: 400, ic: 'estrella' },
      { n: 'Salir de la fortaleza', x: 140, y: 528, ic: 'flecha', d: 's', va: Z.pueblo }];
    if (MM.L[CAMINO]) MM.L[CAMINO].push({ n: 'Bosque de la Frontera', x: 1430, y: 688, ic: 'flecha', d: 'e', va: Z.bosque });
    // dibujos planos (foto del mapa -> siluetas planas, estilizar3.py)
    const MINI = {
    bosque_de_la_frontera: 'data:image/png;base64,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',
    tierras_orcas: 'data:image/png;base64,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',
    pueblo_orco: 'data:image/png;base64,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',
    fortaleza_orca: 'data:image/png;base64,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'
    };
    if (MM.dibujo) Object.keys(MINI).forEach(k => MM.dibujo(k, MINI[k]));
  }

  // la pantalla de fin del Capítulo 1 (ck_fin_capitulo.js) anunciaba "Las Torres de Escarcha": ahora anuncia este capítulo
  try {
    new MutationObserver(() => {
      const p = document.querySelector('#ck-fin .prox');
      if (p && !p.dataset.c2) {
        p.dataset.c2 = '1';
        p.innerHTML = '<b>Capítulo 2 · La Frontera Orca</b><br>Los clanes orcos bajan por el este. Presentate ante el Rey.';
      }
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
  // esa pantalla usa S._overlay = 'fin' sin un elemento con ese id: si algo llama a closeOverlay mientras está, no rompe
  const cerrar0 = P.closeOverlay;
  if (cerrar0) P.closeOverlay = function () {
    if (this._overlay && !document.getElementById(this._overlay)) {
      const b = this._overlay === 'fin' && document.querySelector('#ck-fin button');
      if (b) { b.click(); return; }
      this._overlay = null; this.isGamePaused = false;
      try { this.physics.world.resume(); } catch (e) {}
      return;
    }
    return cerrar0.apply(this, arguments);
  };

  window.CK_CAPITULO2 = { ID, Z, OBJ, VA, VUELTA, SALIDAS, JEFE, paso };
})();
