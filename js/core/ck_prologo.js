'use strict';
/* Prólogo nuevo (10/11, pedido del dueño):
   "llega luego de la presentación de la historia, se encuentra en la taberna donde empieza esto como animación, todos
   están celebrando porque al fin llegan héroes para librarlos de su pesar, hacen brindis y pasa la noche; el personaje se
   levanta luego y se acerca un NPC a despertarlo, le dice que tiene que ir donde el rey y se ofrece a acompañarlo; luego
   lo guía por el pueblo y después lo acompaña hasta el castillo (aún no aparecen enemigos); en el castillo conoce al rey
   y luego la secuencia de entrenamiento (cómo jugar, cómo mejorar habilidades, dónde comprar mejoras) y de ahí te dan
   el dash".
   Sólo en partidas NUEVAS (story.flags.v2, ver ck_progreso.js). Lo que pasa:
   1. Después de los pergaminos (ck_intro.js), de noche en la Taberna del Roble: la gente festeja alrededor del fogón,
      el tabernero levanta la jarra por el héroe, todos brindan, Anselmo arranca una payada. Fundido: "pasa la noche".
   2. A la mañana, en el cuarto: Pipo, el paje del Rey, golpea, lo despierta y se ofrece a llevarlo.
   3. Pipo camina adelante por la taberna, la aldea, el Camino al Castillo, el patio y el Gran Salón. Si el héroe se
      queda atrás, lo espera; si se va para otro lado, lo llama. En cada lugar dice algo útil. Hasta el entrenamiento no
      hay bestias (ck_progreso.js).
   4. El Rey lo manda con el Capitán Bruno al Patio de Armas. Entrenamiento: pegarle a un muñeco, el paso rápido (dash)
      y correr (los aprende ahí), dos limos de práctica en el corral y una charla de cómo se sube de nivel, el árbol (H),
      las ranuras, las pociones, las tiendas, la herrería, las monedas, el mapa y la antorcha. Al final: experiencia,
      una poción y la primera misión (los aldeanos desaparecidos, ck_desaparecidos.js).
   Necesita ck_escenas.js, ck_intro.js (un enganche de una línea) y ck_progreso.js. Borrar su línea de index.html deja
   el arranque de antes (Doña Rosa despierta al héroe y el Capitán manda a limpiar el camino). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA) return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;
  const PRG = () => window.CK_PROGRESO;
  const ZT = 'ed_taberna_2.main', MAPA_T = 'taberna_2';
  const ZC = 'ed_camino_al_castillo.main', ZP = 'castle.courtyard', ZS = 'ed_salon_del_trono_3.main', ZE = 'castle.training';
  const DIA = 300000;

  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = S => { const s = st(S); return s ? (s.flags = s.flags || {}) : {}; };
  const nueva = S => !!(st(S) && fl(S).v2);
  const nombre = S => { const h = (typeof HEROES !== 'undefined' && HEROES[S.playerHero]) || { name: 'forastero' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  const ella = S => S.playerHero === 'swordsman';
  const g = (S, m, f) => (ella(S) ? f : m);
  const esperar = E.esperar;
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const hasta = async (fn, ms = 6000) => { const t0 = performance.now(); while (!fn() && performance.now() - t0 < ms) await esperar(100); return fn(); };
  const enZona = (S, z) => S.currentZoneKey && S.currentZoneKey() === z && !S._doorTransition;
  const hora = (S, p, diaSiguiente) => { const d = S.dayClock || 0; S.dayClock = (Math.floor(d / DIA) + (diaSiguiente ? 1 : 0)) * DIA + p * DIA; };

  // ------------------------------------------------------------------ cartel negro ("pasa la noche")
  const negro = (lineas, ms = 2600) => new Promise(r => {
    let el = document.getElementById('ck-pro-negro');
    if (!el) {
      el = document.createElement('div'); el.id = 'ck-pro-negro';
      el.style.cssText = 'position:fixed;inset:0;z-index:99980;background:#050302;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .9s;pointer-events:none';
      el.innerHTML = '<div style="font-family:\'CK Grenze\',Georgia,serif;color:#e8d8b0;font-size:clamp(18px,2.6vw,30px);text-align:center;line-height:1.5;max-width:80%;text-shadow:0 2px 0 #000;transition:opacity .7s"></div>';
      document.body.appendChild(el);
    }
    const t = el.firstChild;
    el.style.opacity = '1';
    (async () => {
      await esperar(900);
      for (const l of lineas) { t.style.opacity = '0'; t.textContent = l; await esperar(60); t.style.opacity = '1'; await esperar(ms); t.style.opacity = '0'; await esperar(700); }
      r(() => { el.style.opacity = '0'; });
    })();
  });

  // durante las escenas tampoco se ve el HUD nuevo (#ckh), igual que el resto
  (() => { const c = document.createElement('style'); c.textContent = 'body.ck-escena #ckh, body.ck-escena .ckh-on #ckh { opacity: 0 !important; transition: opacity .3s; }'; document.head.appendChild(c); })();

  // ------------------------------------------------------------------ 1. el festejo
  const GENTE = [
    // [hoja, x, y, mira a la izquierda, quién]
    ['npc7_villager', 222, 178, false, 'mirta'], ['npc6_villager', 278, 150, true, 'anselmo'],
    ['npc13_villager', 198, 122, false, 'a'], ['npc14_villager', 226, 122, false, 'b'], ['npc1_villager', 256, 122, false, 'c'],
    ['npc12_villager', 284, 122, true, 'd'], ['npc11_villager', 292, 152, true, 'e'], ['npc5_villager', 322, 152, true, 'f'],
    ['npc3_villager', 176, 156, false, 'tabernero']
  ];
  const festejo = async S => {
    hora(S, 0.7, false);                                   // de noche
    S.ckEntrar(MAPA_T, { x: 252, y: 200 });
    await hasta(() => enZona(S, ZT));
    await esperar(300);
    try { window.CK_TABERNA_VIVA && CK_TABERNA_VIVA.desarmar(S); } catch (e) {}
    if (S._ckRosa && S._ckRosa.active) S._ckRosa.setVisible(false);
    const quien = {}, todos = [];
    GENTE.forEach(([tex, x, y, izq, id]) => {
      if (!S.textures.exists(tex)) return;
      const sp = E.actor(S, tex, x, y, { escala: 1.3, flip: izq });
      quien[id] = sp; todos.push(sp);
    });
    const salto = (sp, d = 0) => S.time.delayedCall(d, () => sp.active && S.tweens.add({ targets: sp, y: sp.y - 4, duration: 120, yoyo: true, ease: 'Sine.easeOut' }));
    const hero = nombre(S);
    await E.correr(S, async () => {
      if (S.player) { S.player.setFlipX(false); S.facingV = 'back'; }
      S.cameras.main.fadeIn(1200, 0, 0, 0);
      await E.camara(S, 252, 160, 600);
      son('ck_jarras', 0.5);
      await esperar(900);
      if (quien.mirta) await E.globo(S, quien.mirta, '¡Por fin llegaron héroes al Roble!', 2200);
      if (quien.anselmo) await E.globo(S, quien.anselmo, '¡Que se escuche hasta en Brumavieja!', 2200);
      if (quien.c) { E.globo(S, quien.c, '¡Una vuelta para todos!', 1800); salto(quien.c); }
      son('ck_jarras', 0.6);
      await esperar(1400);
      await E.dialogo(S, 'Tabernero', [
        '¡Levanten las jarras, que esta noche invita la casa!',
        `Por ${hero}, que vino de lejos a sacarnos la niebla de encima.`,
        'Y por los que no están: que vuelvan pronto a casa.'
      ], 'npc3_villager');
      // ¡salud!
      son('ck_jarras', 0.8);
      todos.forEach((sp, i) => { salto(sp, i * 60); S.time.delayedCall(i * 80, () => E.globo(S, sp, i % 3 === 0 ? '¡Salud!' : i % 3 === 1 ? '¡Por los héroes!' : '¡Salud, salud!', 1700)); });
      S.cameras.main.shake(260, 0.0025);
      await esperar(2300);
      if (quien.anselmo) {
        await E.globo(S, quien.anselmo, '¡Silencio, que voy a payar!', 1700);
        await E.globo(S, quien.anselmo, `Llegó ${g(S, 'un forastero', 'una forastera')} con la espada bien templada…`, 2600);
        await E.globo(S, quien.anselmo, '…¡y la niebla, de miedo, se fue sin decir nada!', 2600);
      }
      if (quien.mirta) { E.globo(S, quien.mirta, '¡No rimó del todo, Anselmo!', 1800); }
      todos.forEach((sp, i) => salto(sp, i * 90));
      await esperar(1900);
      S.cameras.main.fadeOut(1400, 0, 0, 0);
      await esperar(1500);
    });
    const soltar = await negro(['Esa noche, en la Taberna del Roble, nadie se acordó de la niebla.', 'Y a la mañana siguiente…'], 2300);
    todos.forEach(sp => sp.active && sp.destroy());
    if (S._ckRosa && S._ckRosa.active) S._ckRosa.setVisible(true);
    hora(S, 0.06, true);                                   // amanece
    fl(S).festejo = true;
    S.saveStory && S.saveStory();
    return soltar;
  };

  // ------------------------------------------------------------------ 2. Pipo despierta al héroe
  const PIPO = 'npc4_villager';
  const despertar = async (S, soltar) => {
    S.ckEntrar(MAPA_T, { x: 419, y: 150 });
    await hasta(() => enZona(S, ZT));
    await esperar(400);
    if (soltar) soltar();
    const hero = nombre(S);
    await E.correr(S, async () => {
      if (S.player) { S.player.setFlipX(true); S.facingDirection = 'left'; S.facingV = null; }
      S.cameras.main.fadeIn(900, 0, 0, 0);
      await esperar(1200);
      const p = E.actor(S, PIPO, 372, 225, { escala: 1.3 });
      S._ckPipo = p;
      [0, 190, 420].forEach(t => setTimeout(() => son('step_wood1', 0.9, { rate: 1.35 }), t));
      await E.globo(S, p, '¡Toc, toc! ¿Se puede?', 1500);
      await E.caminar(S, p, 372, 156, 46);
      await E.caminar(S, p, 394, 156, 40);
      p.setFlipX(false);
      await E.dialogo(S, 'Pipo, el paje del Rey', [
        `¡Arriba, ${g(S, 'señor', 'señora')}! Perdón… ¿${hero}? Soy Pipo, paje del Rey Aldric.`,
        'Ya sé, ya sé: anoche la taberna no durmió. Se escuchaba la payada de Anselmo desde el camino.',
        'El Rey quiere verte esta misma mañana en el Gran Salón del castillo.',
        'Si querés, te acompaño. El camino tiene sus vueltas y los guardias no dejan pasar a cualquiera.'
      ], PIPO);
      await E.globo(S, p, '¡Seguime! Te espero en la puerta.', 1800);
    });
    fl(S).intro = true;
    fl(S).guia = true;
    S.saveStory && S.saveStory();
    S.updateObjective && S.updateObjective();
    S.showZoneTitle && S.showZoneTitle('Capítulo 1', 'La niebla del norte');
    guia.empezar(S, ZT);
  };

  /** ck_intro.js llama a esto después de los pergaminos. */
  const trasIntro = (S, despertarViejo) => {
    if (!nueva(S)) return despertarViejo(S);
    festejo(S).then(soltar => despertar(S, soltar)).catch(e => { console.warn('[prólogo]', e); despertarViejo(S); });
  };

  // ------------------------------------------------------------------ 3. Pipo guía hasta el Rey
  // por lugar: los puntos por donde va (del área; en la aldea, del mundo) y lo que dice al llegar a cada uno
  const RUTA = {
    [ZT]: [[330, 236], [250, 252, 'Por la puerta de abajo. Saludá a Doña Rosa, que te cuidó el guiso.']],
    village: [[470, 470, 'La Aldea del Roble. Acá todos se conocen… y todos opinan.'], [520, 560], [540, 616, '¡Por el camino del sur! Del otro lado está el castillo.']],
    [ZC]: [[200, 446, 'Éste es el Camino al Castillo. Ojo con los pozos.'], [600, 452], [950, 452], [1150, 460], [1189, 432, 'El puente levadizo baja cuando te ven llegar. ¡Arriba, al portón!']],
    [ZP]: [[480, 330, 'El patio del castillo. A la izquierda, el Patio de Armas; a la derecha, el Jardín.'], [480, 172, 'El Gran Salón, subiendo. Pasá, que yo te anuncio.']],
    [ZS]: [[240, 420], [206, 214, null]]
  };
  const ESPERA_LEJOS = 96, SIGUE = 66, VEL = 68;
  const guia = {
    sp: null, st: null, i: 0, zona: null, llamado: 0,
    activa: S => nueva(S) && fl(S).guia && st(S).step === 0,
    quitar(S) { if (this.sp && this.sp.active) this.sp.destroy(); this.sp = null; },
    empezar(S, zona) {
      this.zona = zona; this.i = 0; this.st = {}; this.llamado = S.time.now;
      if (S._ckPipo && S._ckPipo.active && zona === ZT) { this.sp = S._ckPipo; S._ckPipo = null; return; }
      this.quitar(S);
      const r = RUTA[zona]; if (!r || !S.player) return;
      const a = zona === 'village' ? { x: 0, y: 0 } : E.area(S), b = S.player.body;
      const hx = b ? b.center.x : S.player.x, hy = b ? b.bottom : S.player.y;
      const m = r[0], dx = a.x + m[0] - hx, dy = a.y + m[1] - hy, d = Math.hypot(dx, dy) || 1;
      let x = hx + dx / d * 28, y = hy + dy / d * 28;
      if (S.navIsFree && !S.navIsFree(x, y)) { x = hx + 18; y = hy; }
      this.sp = S.add.sprite(x, y, PIPO).setOrigin(0.5, 1).setScale(S.currentInterior ? 1.3 : 1.15).setDepth(y);
      this.sp._ckAnim = 'npc4';
      if (S.anims.exists('npc4_idle')) this.sp.play('npc4_idle');
      if (zona === ZS) S.time.delayedCall(500, () => this.sp && E.globo(S, this.sp, '¡Llegamos! El Rey está al fondo, en su trono.', 2200));
    },
    cuadro(S, dt) {
      const sp = this.sp;
      if (!sp || !sp.active || !S.player || S._ckEscena) return;
      const r = RUTA[this.zona]; if (!r) return;
      const b = S.player.body, hx = b.center.x, hy = b.bottom, dH = Phaser.Math.Distance.Between(sp.x, sp.y, hx, hy);
      const anim = k => { if (S.anims.exists('npc4_' + k)) sp.play('npc4_' + k, true); };
      sp.setDepth(sp.y);
      // muy lejos: lo llama de vez en cuando
      if (dH > 260 && S.time.now - this.llamado > 7000) { this.llamado = S.time.now; E.globo(S, sp, UNO(['¡Eh, por acá!', '¡Por acá, que el Rey espera!', '¿Adónde vas? ¡El castillo es para el otro lado!']), 1800); }
      if (this.i >= r.length) { anim('idle'); sp.setFlipX(hx < sp.x); return; }
      if (this.esperando ? dH > SIGUE : dH > ESPERA_LEJOS) { this.esperando = true; anim('idle'); sp.setFlipX(hx < sp.x); return; }
      this.esperando = false;
      const a = this.zona === 'village' ? { x: 0, y: 0 } : E.area(S), m = r[this.i];
      const res = S.navFollow(this.st, sp, a.x + m[0], a.y + m[1], VEL, Math.min(50, dt || 16), 0);
      if (res === 'walking') anim('walk');
      if (res === 'arrived' || res === 'stuck') {
        if (res === 'stuck') sp.setPosition(a.x + m[0], a.y + m[1]);
        this.st = {};
        if (m[2]) E.globo(S, sp, m[2], 2600 + m[2].length * 25);
        this.i++;
        if (this.i >= r.length) anim('idle');
      }
    }
  };
  const UNO = l => l[Math.floor(Math.random() * l.length)];

  const cambio = S => {
    guia.quitar(S);
    if (!guia.activa(S)) return;
    const z = S.currentZoneKey();
    if (RUTA[z]) S.time.delayedCall(250, () => { if (guia.activa(S) && S.currentZoneKey() === z) guia.empezar(S, z); });
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () { const r = area0.apply(this, arguments); try { cambio(this); entreno.cambio(this); } catch (e) { console.warn('[prólogo]', e); } return r; };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () { const r = ald0.apply(this, arguments); try { cambio(this); entreno.cambio(this); } catch (e) { console.warn('[prólogo]', e); } return r; };
  const fin0 = P.endStory;
  P.endStory = function () { guia.quitar(this); entreno.quitar(this); return fin0.apply(this, arguments); };

  // ------------------------------------------------------------------ el Rey y el Capitán con las líneas nuevas
  const NPC = id => typeof STORY_NPCS !== 'undefined' && STORY_NPCS.find(n => n.id === id);
  const REY = NPC('king'), CAP = NPC('captain');
  if (REY) {
    const l0 = REY.lines;
    REY.lines = function (s, hero) {
      if (s && s.flags && s.flags.v2 && s.step === 0) return [
        `Así que vos sos ${hero}. Pipo me contó que anoche la taberna no durmió por tu culpa.`,
        'Me alegra. Hace mucho que en el Roble no se festeja nada.',
        'Una niebla baja del norte. Donde toca, las tumbas se abren y las bestias pierden el miedo. Brumavieja cayó en una sola noche.',
        'Y ahora la niebla se lleva gente: anoche faltaron tres vecinos del Roble. Salieron al campo y no volvieron.',
        'Pero no te voy a mandar a ciegas. El Capitán Bruno te va a enseñar a pelear como pelea la guardia.',
        'Lo encontrás en el Patio de Armas: saliendo al patio, por la puerta de la izquierda.'
      ];
      return l0.apply(this, arguments);
    };
  }
  const habla0 = P.onTalked;
  P.onTalked = function (id) {
    const s = st(this);
    if (s && nueva(this)) {
      if (id === 'king' && s.step === 0) {
        const r = habla0.apply(this, arguments);
        fl(this).guia = false;
        const p = guia.sp;
        if (p && p.active) this.time.delayedCall(500, () => p.active && E.globo(this, p, 'El Patio de Armas: bajando al patio, por la puerta de la izquierda. ¡Suerte con Bruno, que grita mucho!', 3800));
        this.saveStory && this.saveStory();
        return r;
      }
      if (id === 'captain' && s.step === 1 && !fl(this).entrenado) { entreno.hablar(this); return; }
    }
    return habla0.apply(this, arguments);
  };
  if (CAP) {
    const l0 = CAP.lines;
    CAP.lines = function (s, hero) {
      if (s && s.flags && s.flags.v2 && s.step === 1 && !s.flags.entrenado) {
        const S = window.activeGameScene;
        if (S && S._ckEntreno) return [entreno.recordatorio(S)];
        return [
          `¿Así que vos sos ${hero}? El Rey me avisó. Yo soy Bruno, capitán de la guardia.`,
          'Antes de salir a buscar a nadie, vas a aprender lo básico. Afuera no hay segundas oportunidades.',
          'Empezamos con los muñecos de allá arriba. Pegale a uno con la espada: J o clic.'
        ];
      }
      return l0.apply(this, arguments);
    };
  }

  // ------------------------------------------------------------------ 4. el entrenamiento
  const entreno = {
    quitar(S) { (S._ckEntrenoLimos || []).forEach(e => e && e.active && e.destroy()); S._ckEntrenoLimos = null; },
    cambio(S) {
      // si se va del Patio de Armas a la mitad, se retoma desde el principio la próxima vez
      if (S._ckEntreno && S.currentZoneKey() !== ZE) { S._ckEntreno = null; this.quitar(S); S.updateObjective && S.updateObjective(); }
    },
    muñecos(S) {
      const a = S.currentInterior && S.currentInterior.area; if (!a) return [];
      const g = {};
      (a.objs || []).forEach(o => {
        const m = o && o.active && o.texture && /^ed_pf_muneco_(\d+)/.exec(o.texture.key);
        if (!m) return;
        const b = o.getBounds();
        const q = g[m[1]] || (g[m[1]] = { piezas: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 });
        q.piezas.push(o); q.x0 = Math.min(q.x0, b.x); q.x1 = Math.max(q.x1, b.right); q.y0 = Math.min(q.y0, b.y); q.y1 = Math.max(q.y1, b.bottom);
      });
      return Object.values(g).map(q => Object.assign(q, { x: (q.x0 + q.x1) / 2, y: q.y1 - 6 }));
    },
    texto: {
      golpes: e => `Entrenamiento: pegale a un muñeco (J o clic) · ${e.n}/3`,
      dash: e => `Entrenamiento: hacé dos pasos rápidos (ESPACIO) · ${e.n}/2`,
      correr: () => 'Entrenamiento: corré un poco (mantené SHIFT mientras caminás)',
      limos: e => `Entrenamiento: vencé a los limos del corral · ${e.n}/2`,
      charla: () => 'Entrenamiento: hablá con el Capitán Bruno'
    },
    recordatorio(S) {
      const f = S._ckEntreno && S._ckEntreno.fase;
      return { golpes: 'Dale, pegale al muñeco. No muerde.', dash: 'El paso rápido: ESPACIO, para el lado que quieras.', correr: 'Mantené SHIFT mientras caminás. Más rápido, recluta.',
        limos: 'Los limos son lentos, pero si te tocan, duele. ¡Dale!', charla: 'Vení, que te cuento lo que falta.' }[f] || '¡Atento!';
    },
    // se llama al cerrar la charla con Bruno (lo que dijo lo puso CAP.lines)
    hablar(S) {
      if (!S._ckEntreno) { this.empezar(S); return; }
      if (S._ckEntreno.fase === 'charla') this.charla(S);
    },
    empezar(S) {
      S._ckEntreno = { fase: 'golpes', n: 0, ultimo: 0, corre: 0 };
      S.updateObjective();
    },
    avanzar(S, fase, lineas, despues) {
      const e = S._ckEntreno; if (!e) return;
      e.fase = 'pausa';
      son('quest_done', 0.6) || son('book_clasp', 0.6);
      S.time.delayedCall(450, () => S.openDialog('Capitán Bruno', lineas, () => { if (!S._ckEntreno) return; e.fase = fase; e.n = 0; e.corre = 0; if (despues) despues(); S.updateObjective(); }, 'g_knight_idle'));
    },
    golpe(S) {
      const e = S._ckEntreno; if (!e || e.fase !== 'golpes') return;
      if (S.time.now - e.ultimo < 280) return;
      const b = S.player.body; if (!b) return;
      const m = this.muñecos(S).find(q => Math.abs(q.x - b.center.x) < 30 && b.center.y - q.y < 40 && b.center.y - q.y > -26);
      if (!m) return;
      e.ultimo = S.time.now; e.n++;
      m.piezas.forEach(o => { const x0 = o.x; S.tweens.add({ targets: o, x: x0 + 1.5, duration: 45, yoyo: true, repeat: 2, onComplete: () => o.setX(x0) }); });
      son('bone_hit', 0.5, { rate: 0.6 });
      S.createFloatingText(m.x, m.y0 + 4, '¡Toc!', 0xfde68a);
      S.updateObjective();
      if (e.n >= 3) this.avanzar(S, 'dash', [
        '¡Eso! Pegás como un herrero enojado. Bien.',
        'Ahora lo importante: no quedarte quieto. Te enseño el paso rápido de la guardia.',
        'Con ESPACIO saltás un trecho para el lado que estés yendo, y mientras dura no te pegan. Cansa: gasta aguante.',
        'Hacé dos. Para donde quieras.'
      ], () => { PRG() && PRG().darDash(S); });
    },
    dash(S) {
      const e = S._ckEntreno; if (!e || e.fase !== 'dash') return;
      e.n++; S.updateObjective();
      if (e.n >= 2) this.avanzar(S, 'correr', [
        'Bien. Y para ir lejos, corré: mantené SHIFT mientras caminás.',
        'Correr no cansa, pero se escucha. Las bestias te ven venir.'
      ]);
    },
    cuadro(S, dt) {
      const e = S._ckEntreno; if (!e || S.currentZoneKey() !== ZE) return;
      if (e.fase === 'correr' && !S.dialogOpen) {
        const b = S.player.body;
        if (S.isRunning && b && b.speed > 60) e.corre += dt;
        if (e.corre > 1100) this.avanzar(S, 'limos', [
          '¡Así se corre! Ahora de verdad.',
          'En el corral tenemos dos limos del pantano. Los usamos para que practiquen los reclutas: son lentos, pero pegan.',
          '¡Larguen los limos! Y vos, al corral.'
        ], () => this.limos(S));
      }
      if (e.fase === 'limos') {
        const vivos = (S._ckEntrenoLimos || []).filter(x => x && x.active && !x.isDead);
        if (S._ckEntrenoLimos && !vivos.length && !e.cerrando) {
          e.cerrando = true;
          this.avanzar(S, 'charla', ['¡Muy bien! Vení, que te cuento lo que falta.'], () => { e.cerrando = false; });
        }
      }
    },
    limos(S) {
      const a = S.currentInterior && S.currentInterior.area; if (!a) return;
      S._ckPermitirBestias = true;
      try {
        S._ckEntrenoLimos = [[660, 290], [710, 320]].map(([x, y]) => {
          const en = S.spawnEnemy(a.x + x, a.y + y - 26, 'slime');
          if (en) { en.zone = ZE; en._ckEntreno = true; S.time.delayedCall(700, () => en.active && S.alertEnemy && S.alertEnemy(en)); }
          return en;
        }).filter(Boolean);
      } finally { S._ckPermitirBestias = false; }
      if (S.player) S.createFloatingText(a.x + 680, a.y + 270, '¡Al corral!', 0xfca5a5);
    },
    charla(S) {
      const e = S._ckEntreno; if (!e) return;
      e.fase = 'pausa';
      S.openDialog('Capitán Bruno', [
        'Cada bestia que bajás te da experiencia. Con experiencia subís de nivel, y con cada nivel te hacés más fuerte.',
        'Con cada nivel ganás un punto de habilidad. Con H abrís el árbol y elegís qué aprender.',
        'Lo que aprendas lo ponés en las ranuras de abajo: Q, E, R y F. Se van abriendo a medida que subís de nivel.',
        'Otras cosas vienen con la práctica: la parada (C) al nivel 2, y el golpe fuerte (K o clic derecho) al 3.',
        'Las heridas se curan con pociones (Z). El elixir dorado (X) te deja como nuevo.',
        'Las venden la Tienda de Víveres de la aldea, el Posadero que anda por la plaza y el puesto del mercado, acá en el patio.',
        'En la herrería del castillo hay piedras de afilar: más daño en cada golpe. Y en la tienda, tónicos y amuletos.',
        'Juntá monedas: cien de bronce hacen una de plata, y cien de plata, una de oro.',
        'Con M ves el mapa, con el camino de la misión en dorado. Y de noche prendé la antorcha con L.',
        'Ahora escuchá bien. Los tres vecinos que faltan salieron anoche al campo, al oeste de la aldea, y no volvieron.',
        'Buscalos en los Campos del Roble: salís de la aldea por el oeste. Y si ves luces raras en la niebla… no las sigas.'
      ], () => this.terminar(S), 'g_knight_idle');
    },
    terminar(S) {
      const s = st(S); if (!s) return;
      S._ckEntreno = null;
      fl(S).entrenado = true;
      s.inv = s.inv || {}; s.inv.potion = (s.inv.potion || 0) + 1;
      S.createFloatingText(S.player.x, S.player.y - 46, '+1 POCIÓN', 0xf87171);
      S.gainXP(40);
      S.updateQuickBar && S.updateQuickBar();
      S.advanceQuest();
      S.showZoneTitle('Entrenamiento completo', 'Los aldeanos desaparecidos');
    }
  };

  // ganchos del entrenamiento
  const at0 = P.performAttack;
  P.performAttack = function () {
    const r = at0.apply(this, arguments);
    try { if (this._ckEntreno && this.isAttacking) entreno.golpe(this); } catch (e) {}
    return r;
  };
  const da0 = P.performDash;
  P.performDash = function () {
    const t = this.lastDashTime;
    const r = da0.apply(this, arguments);
    try { if (this._ckEntreno && this.lastDashTime !== t && this.isDashing) entreno.dash(this); } catch (e) {}
    return r;
  };
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      if (st(this)) {
        if (guia.sp && guia.activa(this)) guia.cuadro(this, dt);
        else if (guia.sp && !guia.activa(this) && guia.zona !== ZS) guia.quitar(this);
        if (this._ckEntreno) entreno.cuadro(this, dt);
      }
    } catch (e) { if (!this._ckProErr) { this._ckProErr = true; console.warn('[prólogo]', e); } }
    return r;
  };
  // caer en el entrenamiento: los limos vuelven a empezar
  const caer0 = P.campaignDefeat;
  P.campaignDefeat = function () {
    const r = caer0.apply(this, arguments);
    try { const e = this._ckEntreno; if (e && e.fase === 'limos') { entreno.quitar(this); this.time.delayedCall(1600, () => this._ckEntreno && this._ckEntreno.fase === 'limos' && entreno.limos(this)); } } catch (er) {}
    return r;
  };

  // el objetivo mientras dura el prólogo
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = st(this), box = document.getElementById('ck-objective'), t = box && box.querySelector('.ck-obj-text');
      if (s && t && nueva(this)) {
        if (s.step === 0 && fl(this).guia) t.textContent = 'Seguí a Pipo, el paje del Rey, hasta el Gran Salón del castillo';
        else if (s.step === 1 && this._ckEntreno && entreno.texto[this._ckEntreno.fase]) t.textContent = entreno.texto[this._ckEntreno.fase](this._ckEntreno);
        else if (s.step === 1 && !fl(this).entrenado) t.textContent = 'Buscá al Capitán Bruno en el Patio de Armas (puerta izquierda del patio del castillo)';
      }
    } catch (e) {}
    return r;
  };

  window.CK_PROLOGO = { trasIntro, festejo, despertar, guia, entreno, RUTA };
})();
