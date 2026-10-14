'use strict';
/* Más historia para el Capítulo 1 (no cambia los números de paso: usa banderas dentro de la partida guardada).
   Después de limpiar el camino, antes de ir a Brumavieja, el héroe sigue la pista de la niebla:
     Capitán Bruno → Maestre Eloy (Biblioteca) → Tabernero (Taberna del Roble) → Ruy, el buhonero (fogata del camino).
   El Nigromante pasa a tener nombre y voz (Varek, el aprendiz que robó el Códice de las Brumas);
   al vencerlo se recupera el Códice, que hay que devolverle a Eloy antes de ver al Rey,
   y al final Eloy deja la pista del Capítulo 2.
   Sacar la línea de index.html lo deja como estaba (las partidas guardadas siguen sirviendo). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined' || typeof QUESTS === 'undefined') return;
  const P = MainGameScene.prototype;

  const Z_BIBLIO = 'castle.library',
    Z_TABERNA = 'ed_taberna_2.main',
    Z_CAMINO = 'ed_camino_al_castillo.main',
    Z_RUINAS = 'ruins.village';

  // ------------------------------------------------------------------ objetivos de las partes nuevas
  const OBJ = {
    eloy: 'Hablá con el Maestre Eloy en la Biblioteca (arco derecho del Gran Salón)',
    taberna: 'Preguntá en la Taberna de la aldea por Ruy, el buhonero',
    ruy: 'Encontrá a Ruy, el buhonero, junto a la fogata del camino del castillo',
    codice: 'Llevale el Códice de las Brumas al Maestre Eloy (Biblioteca del castillo)',
    epilogo: 'Capítulo 1 completo. El Maestre Eloy quiere hablarte (Biblioteca del castillo)'
  };
  const fl = s => (s.flags = s.flags || {});
  /** Qué parte nueva está activa (o null). */
  const parte = s => {
    if (!s) return null;
    const f = fl(s);
    if (s.step === 3 && f.h) return f.h;
    if (s.step === 7 && f.codice && !f.codice_ok) return 'codice';
    if (s.step >= 8 && f.codice_ok && !f.epilogo) return 'epilogo';
    return null;
  };
  const objetivoDe = { eloy: 'eloy', taberna: 'tabernero', ruy: 'ruy', codice: 'eloy', epilogo: 'eloy' };

  const premio = (sc, xp, oro, txt) => {
    const s = sc.story;
    if (oro) s.coins = (s.coins || 0) + oro;
    if (xp) sc.gainXP(xp);
    if (txt) sc.createFloatingText(sc.player.x, sc.player.y - 46, txt, 0xfde68a);
    sc.updateHUD();
  };
  const nuevoObjetivo = sc => {
    if (typeof sfx !== 'undefined') sfx.fx('quest_done', 0.7) || sfx.fx('book_clasp', 0.7);
    sc.createFloatingText(sc.player.x, sc.player.y - 60, '✦ NUEVO OBJETIVO ✦', 0xfde68a);
    sc.updateObjective();
    sc.updateHUD();
    sc.saveStory();
  };

  // ------------------------------------------------------------------ gente nueva
  STORY_NPCS.push(
    {
      id: 'eloy',
      zone: Z_BIBLIO,
      x: 236,
      y: 160,
      r: 50,
      name: 'Maestre Eloy',
      face: 'npc6_villager',
      lines: s => {
        const p = parte(s),
          f = fl(s);
        if (p === 'eloy')
          return [
            '¿Te manda Bruno? Pasá, pasá. Y no toques nada que tenga candado.',
            'Esa niebla no es del clima, muchacho: es nigromancia. Huele a cera negra y a tierra removida.',
            'Hace un mes desapareció de esta biblioteca el Códice de las Brumas. Lo escribió un loco que quería hablar con los muertos.',
            'Y el mismo día se fue Varek, mi aprendiz. Él lo leía de noche, cuando creía que yo dormía.',
            'Un libro así no se usa solo: hacen falta velas negras, sal y huesos. Alguien se las vendió.',
            'Preguntá en la taberna de la aldea por los buhoneros. Los que venden de todo siempre saben a quién.'
          ];
        if (p === 'taberna' || p === 'ruy') return ['Seguí la pista de las velas negras. Si encontrás a Varek… no lo escuches. Habla muy bien.'];
        if (p === 'codice')
          return [
            '¿Es… el Códice? Dámelo. Despacio. No lo abras.',
            'Varek… Siempre fue el mejor de mis alumnos. Por eso mismo tenía miedo de él.',
            'Lo voy a guardar bajo siete llaves. Andá con el Rey: tiene que saber que la niebla tenía nombre.'
          ];
        if (p === 'epilogo')
          return [
            'Leí las últimas páginas del Códice. Mejor que no lo hubiera hecho.',
            'Varek no creó la niebla: la siguió. Escribió que viene de las Torres de Escarcha, más allá del paso del norte.',
            'Allí algo grande está despertando, y la niebla es apenas su respiración.',
            'Descansá mientras puedas. Cuando el paso se abra, el reino te va a necesitar otra vez.'
          ];
        if (s.step >= 8) return ['Sigo leyendo el Códice, con guantes y con miedo. Cuando sepa más, te aviso.'];
        if (s.step >= 4 && s.step <= 6)
          return f.sal
            ? ['La sal de Ruy no es superstición: los muertos no la cruzan. Llevala encima en Brumavieja.']
            : ['Si encontrás un libro de tapas grises, no lo leas. Traémelo.'];
        return ['Soy Eloy, maestre de esta biblioteca. Los libros no muerden… casi ninguno.', 'Si el Rey te encarga algo, acá vas a encontrar la historia del reino.'];
      }
    },
    {
      id: 'tabernero',
      zone: Z_TABERNA,
      x: 170,
      y: 168,
      r: 62,
      name: 'Tabernero',
      face: 'npc3_villager',
      lines: s => {
        const p = parte(s);
        if (p === 'taberna')
          return [
            '¿Velas negras? Mirá que se escucha cada cosa en esta taberna…',
            'Ruy, el buhonero, se jactaba hace unas semanas: le había vendido medio carro a un encapuchado que pagó en oro viejo.',
            'Ayer siguió viaje para el castillo. Acampa siempre en la fogata de los troncos, en el camino. Llevale algo de comer y te cuenta todo.'
          ];
        if (p === 'ruy') return ['Ruy acampa en la fogata del camino del castillo. Si te pide plata, regateale.'];
        if (s.step === 0) return ['Bienvenido a la Taberna del Roble. Si buscás trabajo, dicen que el Rey recluta gente de armas.'];
        if (s.step >= 8) return ['¡El que limpió Brumavieja! La próxima ronda corre por la casa.'];
        return ['Guiso caliente y cerveza tibia, como debe ser.', 'De noche hay que cerrar temprano: con la niebla, nadie quiere estar afuera.'];
      }
    },
    {
      id: 'ruy',
      zone: Z_CAMINO,
      x: 690,
      y: 404,
      r: 46,
      name: 'Ruy, el buhonero',
      face: 'npc2_villager',
      lines: s => {
        const p = parte(s);
        if (p === 'ruy')
          return [
            '¿Te manda el tabernero? Ese bocón… Bueno, sí, se lo vendí. Velas negras, sal gruesa, un mapa de Brumavieja.',
            'Era flaco, con capucha, y llevaba un libro de tapas grises apretado contra el pecho. Me pagó con monedas de un rey que ya no existe.',
            'Dijo que se llamaba Varek. Y que en la capilla de Brumavieja "los muertos escuchan mejor".',
            'Tomá, la última bolsa de sal bendita que me queda. Hacé un círculo con ella y ningún muerto lo cruza.',
            'Y si llegás a Brumavieja, buscá a Tobías. Ese viejo terco no se fue nunca.'
          ];
        if (s.step >= 4 && s.step <= 7) return ['Que la sal te cuide allá arriba. Y si volvés con oro viejo, ya sabés dónde encontrarme.'];
        return ['Buen fuego, ¿no? Si necesitás algo, Ruy tiene. Y si Ruy no tiene, lo consigue.'];
      }
    }
  );

  // el Capitán, el Rey y Tobías: líneas nuevas para las partes nuevas
  const CAP = STORY_NPCS.find(n => n.id === 'captain'),
    REY = STORY_NPCS.find(n => n.id === 'king'),
    TOB = STORY_NPCS.find(n => n.id === 'hermit');
  if (CAP) {
    const l0 = CAP.lines;
    CAP.lines = (s, hero) => {
      if (s.step === 3 && !fl(s).h)
        return [
          'Bien hecho. Peleás mejor que la mitad de mis reclutas.',
          'Tomá: una ración de la guardia. Te va a mantener en pie un golpe más.',
          'Antes de mandarte a Brumavieja, el Rey quiere saber contra qué peleamos.',
          'El Maestre Eloy estudió esa niebla. Lo encontrás en la biblioteca, por el arco derecho del Gran Salón.'
        ];
      if (parte(s) === 'eloy') return ['El Maestre Eloy te espera en la biblioteca. No le toques los libros: se pone peor que un oso.'];
      if (parte(s) === 'taberna' || parte(s) === 'ruy') return ['¿Velas negras? Mal asunto. Seguí la pista, pero no te demores: la niebla avanza cada noche.'];
      return l0(s, hero);
    };
  }
  if (REY) {
    const l0 = REY.lines;
    REY.lines = (s, hero) => {
      if (parte(s) === 'codice') return ['Volviste… ¿Y ese libro gris que traés?', 'Antes que nada, llevale ese Códice al Maestre Eloy. Que nadie más lo abra. Después hablamos.'];
      if (s.step === 7 && fl(s).codice_ok)
        return [
          'Eloy me contó todo. Varek… un aprendiz de mi propia casa. Entonces la niebla tenía dueño.',
          'El reino te debe más de lo que puede pagar. Tomá esto, y descansá.',
          'Pero no guardes la espada: lo que lo despertó sigue más al norte.'
        ];
      return l0(s, hero);
    };
  }
  if (TOB) {
    const l0 = TOB.lines;
    TOB.lines = (s, hero) => {
      const ls = l0(s, hero).slice();
      if (s.step === 4 && fl(s).sal) ls.splice(2, 0, '¿Varek? Sí, así se hacía llamar. ¿Y traés sal bendita? Bien. Vas a necesitarla.');
      return ls;
    };
  }

  // ------------------------------------------------------------------ el Maestre en la biblioteca
  if (typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS.castle) {
    const cas0 = INTERIOR_LAYOUTS.castle;
    INTERIOR_LAYOUTS.castle = function (kit) {
      const r = cas0.apply(this, arguments);
      try {
        const lb = kit.areas && kit.areas.library;
        if (lb) {
          lb.items.push({ key: 'npc6_villager', anim: 'npc6_idle', x: 236, baseY: 158, scale: 2.0, oy: 1, ox: 0.5, flipX: true });
          lb.colliders.push({ x: 228, y: 150, w: 16, h: 8 });
        }
      } catch (e) {
        console.warn('[ck_historia]', e);
      }
      return r;
    };
  }

  // ------------------------------------------------------------------ avanzar
  const hablado0 = P.onTalked;
  P.onTalked = function (id) {
    const s = this.story;
    if (!s) return hablado0.apply(this, arguments);
    const f = fl(s),
      p = parte(s);
    if (id === 'captain' && s.step === 3 && !f.h) {
      this.maxHealth = s.maxHealth = Math.max(s.maxHealth, 4);
      this.health = this.maxHealth;
      this.createFloatingText(this.player.x, this.player.y - 46, '+1 CORAZÓN MÁXIMO', 0xf87171);
      f.h = 'eloy';
      return nuevoObjetivo(this);
    }
    if (id === 'eloy' && p === 'eloy') {
      f.h = 'taberna';
      premio(this, 25, 0, '');
      return nuevoObjetivo(this);
    }
    if (id === 'tabernero' && p === 'taberna') {
      f.h = 'ruy';
      return nuevoObjetivo(this);
    }
    if (id === 'ruy' && p === 'ruy') {
      delete f.h;
      f.sal = true;
      premio(this, 30, 20, '+ SAL BENDITA');
      return this.advanceQuest();
    }
    if (id === 'eloy' && p === 'codice') {
      f.codice_ok = true;
      premio(this, 40, 30, 'CÓDICE ENTREGADO');
      return nuevoObjetivo(this);
    }
    if (id === 'eloy' && p === 'epilogo') {
      f.epilogo = true;
      premio(this, 20, 0, '');
      this.showZoneTitle('Capítulo 2', 'Las Torres de Escarcha · próximamente');
      return nuevoObjetivo(this);
    }
    if (id === 'king' && p === 'codice') return; // primero el Códice
    if (id === 'captain' && s.step === 3 && f.h) return; // no saltear la pista
    return hablado0.apply(this, arguments);
  };

  // el Códice cae con el Nigromante
  const vencido0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = vencido0.apply(this, arguments);
    try {
      const s = this.story;
      if (s && enemy && enemy.type === 'necromancer' && !fl(s).codice) {
        fl(s).codice = true;
        this.time.delayedCall(1200, () => {
          if (!this.player) return;
          this.createFloatingText(this.player.x, this.player.y - 70, '📖 CÓDICE DE LAS BRUMAS', 0xc4b5fd);
          this.updateObjective();
          this.saveStory();
        });
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ objetivo y marca
  const objetivo0 = P.updateObjective;
  P.updateObjective = function () {
    const r = objetivo0.apply(this, arguments);
    const p = parte(this.story),
      box = document.getElementById('ck-objective');
    if (p && box) box.querySelector('.ck-obj-text').textContent = OBJ[p];
    return r;
  };

  const historia0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = historia0.apply(this, arguments);
    const s = this.story;
    if (this._gameMode !== 'campaign' || !s || !this.player) return r;
    const zone = this.currentZoneKey();
    // marca dorada sobre quien sigue la historia en las partes nuevas
    const p = parte(s);
    if (p && this._questMark && this._questMark.active) {
      const t = STORY_NPCS.find(n => n.id === objetivoDe[p] && n.zone === zone);
      if (t && this.currentInterior) {
        const a = this.currentInterior.area,
          up = t.marca || (zone === Z_BIBLIO ? 62 : 58); // t.marca: altura de la marca sobre el pie (gente más chica)
        this._questMark.setVisible(true).setPosition(a.x + t.x, a.y + t.y - up + Math.sin(this.time.now / 220) * 3);
      } else this._questMark.setVisible(false);
    }
    // la voz de Varek desde la capilla, antes de que salga
    if (s.step === 6 && zone === Z_RUINAS && !this._bossSpawned && !this._ckVarek && !fl(s).boss_necromancer && this.currentInterior && !this.dialogOpen) {
      const a = this.currentInterior.area;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x + 560, a.y + 300) < 200) {
        this._ckVarek = true;
        this.openDialog(
          'Una voz desde la capilla',
          [
            '¿Te manda el viejo Eloy? Siempre mandaba a otros a hacer lo que él no se animaba.',
            'Yo no robé nada. El Códice me eligió. Me mostró lo que hay del otro lado, y ahí no hay miedo.',
            'Los muertos de Brumavieja me escuchan. Pronto me van a escuchar los del reino entero.',
            'Pasá, si querés. La puerta está abierta… para entrar.'
          ],
          null,
          null
        );
      }
    }
    return r;
  };
  const zona0 = P.onAreaShown;
  P.onAreaShown = function () {
    this._ckVarek = false;
    return zona0.apply(this, arguments);
  };

  window.CK_HISTORIA = { parte, OBJ };
})();
