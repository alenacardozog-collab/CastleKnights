'use strict';
/* Intro en pergaminos y arranque en la posada (02/11, pedido del dueño):
   - Al empezar una partida NUEVA (elegir héroe en el libro), antes de jugar se cuenta la historia en 6 pergaminos con
     ilustración. Enter / clic / espacio: el que sigue; Esc: saltar todo. Se ve una sola vez por partida (story.flags.intro).
   - Las ilustraciones van en assets/intro/pergamino_1.png … pergamino_6.png (las del dueño, hechas en Flow). Mientras no
     estén, se ven los bocetos assets/intro/pergamino_N_boceto.jpg (capturas del juego pasadas a tinta sepia).
   - Después, el héroe despierta en un cuarto de la Posada del Roble (Taberna del Roble, piso de los cuartos a la derecha):
     Doña Rosa, la posadera, golpea, entra y le cuenta que el Rey lo espera. Ella se queda en la posada para charlar.
   Borrar su línea de index.html lo saca (la partida empieza en la aldea, como antes). Usa ck_escenas.js. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA) return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;
  const ZONA = 'ed_taberna_2.main', MAPA = 'taberna_2';
  const CUARTO = { x: 419, y: 150 }, PASILLO = [372, 225], PUERTA_CUARTO = [372, 156], ADENTRO = [394, 156], ROSA = [345, 232];
  const nombreDe = S => { const h = (typeof HEROES !== 'undefined' && HEROES[S.playerHero]) || { name: 'forastero' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  const ella = S => S.playerHero === 'swordsman';

  // ------------------------------------------------------------------ los pergaminos
  const PAGINAS = [
    { t: 'El Reino del Roble',
      p: ['Del otro lado de las sierras hay un reino chico, de caminos de tierra y pulperías, donde la gente se conoce por el nombre y el mate pasa de mano en mano.',
        'Lo gobierna el Rey Aldric desde un castillo sobre el río.'] },
    { t: 'La noche de las luces',
      p: ['Un otoño bajó del norte una niebla espesa, de esas que no levanta ni el viento.',
        'Los paisanos de Brumavieja vieron luces en el campo y dijeron que era la luz mala. A la mañana siguiente el pueblo estaba vacío.'] },
    { t: 'Lo que vino después',
      p: ['Desde entonces las tumbas no se quedan quietas. Los lobos bajan a los caminos, las carretas no llegan y en las noches de luna dicen que anda suelto un lobizón.',
        'Hasta los gallos cantan tarde.'] },
    { t: 'El llamado del Rey',
      p: ['El Rey mandó chasquis a todos los rincones con el mismo pedido: que viniera al castillo cualquiera que tuviera coraje y una espada, un arco o un poco de magia.'] },
    { t: 'Tres forasteros', heroes: true,
      p: ['Respondieron tres. Un caballero sin tierras, un mago viejo que ya había visto esa niebla una vez y una espadachina de Brumavieja que perdió su casa la noche de las luces.'] },
    { t: 'La posada del Roble',
      p: ['Llegaste a la Aldea del Roble con lo puesto, una noche de lluvia. Doña Rosa, la de la posada, te dio un cuarto y un plato de guiso.',
        'Mañana el castillo te espera.'] }
  ];
  const RETRATO = { soldier: 'knight', wizard: 'wizard', swordsman: 'swordsman' };
  const NOMBRE = { soldier: 'Lancent', wizard: 'Horos', swordsman: 'Aby' };

  const css = () => {
    if (document.getElementById('ck-intro-css')) return;
    const st = document.createElement('style');
    st.id = 'ck-intro-css';
    st.textContent = `
#ck-intro { position: fixed; inset: 0; z-index: 99990; display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: radial-gradient(ellipse at 50% 45%, #2a1d12 0%, #120c07 70%, #070503 100%); opacity: 0; transition: opacity .8s; font-family: 'CK Grenze', Georgia, serif; }
#ck-intro.on { opacity: 1; }
#ck-intro .rollo { position: relative; width: min(820px, 82%); max-height: 92%; display: flex; flex-direction: column; }
#ck-intro .vara { height: 22px; margin: 0 -26px; border-radius: 11px; position: relative; z-index: 2;
  background: linear-gradient(180deg, #8a5a2b 0%, #5a3518 45%, #3a210d 100%); box-shadow: 0 4px 10px rgba(0,0,0,.6); }
#ck-intro .vara::before, #ck-intro .vara::after { content: ''; position: absolute; top: -5px; width: 30px; height: 32px; border-radius: 6px;
  background: linear-gradient(180deg, #c99a4a, #6b4416); }
#ck-intro .vara::before { left: -10px; } #ck-intro .vara::after { right: -10px; }
#ck-intro .papel { position: relative; overflow: hidden; margin: -6px 0; padding: 26px 40px 22px; color: #3a2412;
  background: radial-gradient(ellipse at 50% 50%, #f1e2bf 0%, #e6d0a2 62%, #c9a873 100%); box-shadow: inset 0 0 40px rgba(110,70,30,.45);
  clip-path: inset(0 0 100% 0); transition: clip-path 1.1s cubic-bezier(.4,.0,.2,1); }
#ck-intro.abierto .papel { clip-path: inset(0 0 0 0); }
#ck-intro .lamina { width: 100%; aspect-ratio: 16 / 9; border: 3px solid #5a3a1c; border-radius: 3px; background: #2a1d12 center / cover no-repeat;
  box-shadow: 0 2px 0 rgba(255,255,255,.35), inset 0 0 30px rgba(40,20,5,.55); position: relative; }
#ck-intro .lamina img { width: 100%; height: 100%; object-fit: cover; display: block; }
#ck-intro .heroes { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 4%; background: #2a1d12; }
#ck-intro .heroes figure { width: 26%; margin: 0; text-align: center; color: #e9d4a6; opacity: .62; transition: opacity .4s, transform .4s; }
#ck-intro .heroes figure.vos { opacity: 1; transform: translateY(-4px) scale(1.06); }
#ck-intro .heroes img { width: 100%; aspect-ratio: 1; image-rendering: pixelated; border: 3px solid #8a6a3c; border-radius: 4px; filter: sepia(.35); }
#ck-intro .heroes figure.vos img { border-color: #e4bb6a; filter: none; box-shadow: 0 0 18px rgba(228,187,106,.55); }
#ck-intro .heroes figcaption { margin-top: 6px; font-size: 17px; font-weight: 700; }
#ck-intro .heroes figcaption small { display: block; font-weight: 400; font-size: 13px; color: #c9b083; }
#ck-intro h2 { margin: 16px 0 8px; text-align: center; font-family: 'Pirata One', 'CK Grenze', serif; font-weight: 400; font-size: 38px; color: #5b2c10; letter-spacing: .5px; }
#ck-intro .txt p { margin: 0 0 8px; font-size: 19px; line-height: 1.45; text-align: center; }
#ck-intro .txt { opacity: 0; transition: opacity .6s .35s; }
#ck-intro.abierto .txt { opacity: 1; }
#ck-intro .pie { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #7a5a36; }
#ck-intro .pie .puntos span { display: inline-block; width: 8px; height: 8px; margin: 0 3px; border-radius: 50%; background: #c9a873; }
#ck-intro .pie .puntos span.ya { background: #7a4a20; }
#ck-intro .saltar { position: absolute; right: 18px; bottom: 14px; font-size: 14px; color: #a8916a; letter-spacing: .5px; }`;
    document.head.appendChild(st);
  };

  const mostrarIntro = S => new Promise(fin => {
    css();
    const host = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    const d = document.createElement('div');
    d.id = 'ck-intro';
    d.innerHTML = '<div class="rollo"><div class="vara"></div><div class="papel"><div class="lamina"></div><h2></h2><div class="txt"></div>' +
      '<div class="pie"><span>Enter o clic: seguir</span><span class="puntos"></span><span>Esc: saltar</span></div></div><div class="vara"></div></div>';
    host.appendChild(d);
    let i = -1, cerrado = false, bloqueo = 0;
    const lam = d.querySelector('.lamina'), h2 = d.querySelector('h2'), txt = d.querySelector('.txt'), puntos = d.querySelector('.puntos');
    const pagina = n => {
      const pg = PAGINAS[n];
      d.classList.remove('abierto');
      setTimeout(() => {
        if (pg.heroes) {
          lam.innerHTML = '<div class="heroes">' + ['soldier', 'wizard', 'swordsman'].map(h =>
            `<figure class="${h === S.playerHero ? 'vos' : ''}"><img src="assets/UI/portraits/${RETRATO[h]}.png" alt=""><figcaption>${NOMBRE[h]}${h === S.playerHero ? '<small>vos</small>' : ''}</figcaption></figure>`).join('') + '</div>';
        } else {
          lam.innerHTML = `<img alt="" src="assets/intro/pergamino_${n + 1}.png" onerror="this.onerror=null;this.src='assets/intro/pergamino_${n + 1}_boceto.jpg'">`;
        }
        h2.textContent = pg.t;
        txt.innerHTML = pg.p.map(t => '<p>' + t + '</p>').join('');
        puntos.innerHTML = PAGINAS.map((_, k) => '<span class="' + (k <= n ? 'ya' : '') + '"></span>').join('');
        requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('abierto')));
        try { if (typeof sfx !== 'undefined') sfx.fx('page_flip', 0.55, { rate: 0.9 }); } catch (e) {}
      }, n === 0 ? 50 : 420);
    };
    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      document.removeEventListener('keydown', tecla, true);
      d.classList.remove('on');
      setTimeout(() => { d.remove(); document.body.classList.remove('ck-escena'); fin(); }, 800);
    };
    const seguir = () => {
      const t = performance.now();
      if (t < bloqueo) return;
      bloqueo = t + 650;
      i++;
      if (i >= PAGINAS.length) return cerrar();
      pagina(i);
    };
    const tecla = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 't' || e.key === 'T') { e.preventDefault(); e.stopPropagation(); seguir(); }
      else e.stopPropagation();
    };
    document.addEventListener('keydown', tecla, true);
    d.addEventListener('click', seguir);
    E.franjas(false);                     // (carga el CSS que esconde el HUD y las ayudas)
    document.body.classList.add('ck-escena');
    requestAnimationFrame(() => d.classList.add('on'));
    setTimeout(seguir, 350);
  });

  // ------------------------------------------------------------------ Doña Rosa, la posadera
  const texturaRosa = S => {
    E.recolor(S, 'npc5_villager', 'ck_rosa', (r, g, b) => {
      if (r > g + 45 && r > b + 35) { const l = r / 210; return [Math.round(150 * l), Math.round(104 * l), Math.round(62 * l)]; }   // el vestido rojo pasa a marrón de trabajo
      if (r > 180 && g > 150 && b < 90) { return [226, 220, 205]; }                                                               // lo dorado, a delantal claro
      return null;
    });
    E.animsDe(S, 'ck_rosa', 'npc5');
  };
  const LINEAS_ROSA = (S) => {
    const st = S.story || { step: 0, flags: {} }, f = st.flags || {}, p = st.step, c2 = f.c2 || 0;
    const quien = nombreDe(S);
    if (c2 >= 9) return ['¡Volviste de la frontera! Sentate, que hay locro del 25 aunque estemos en otro mes.', 'Mira, la hija del mercader, pasó a dejar una canasta de pastelitos para vos. Yo no toqué ninguno. Bueno, uno.'];
    if (c2 >= 6) return ['Dicen que el portón de los orcos lo abrió un orco. El mundo está del revés, ' + quien + '.', 'Cuidate de ese Grushak. Los que vuelven de la frontera dicen que pega como mula.'];
    if (c2 >= 1) return ['¿Al este, a la frontera? Llevate el poncho, que allá el viento corta.', 'El mercader Tomás paraba siempre acá. Si lo ves, decile que me debe dos noches y un guiso.'];
    if (p >= 8) return ['Desde que volviste de Brumavieja se llenó la posada. Todos quieren ver a ' + (ella(S) ? 'la' : 'el') + ' que bajó al Nigromante.', 'Anselmo ya anda cantando una payada con tu nombre. Rima «' + quien + '» con cualquier cosa, el pobre.'];
    if (p >= 7) return ['¡Volviste! Te dejé la cama hecha y el guiso calentito. El Rey te debe estar esperando, pero primero comé algo.'];
    if (p >= 4) return ['¿Vas para Brumavieja? Ay, criatura. Allá tenía una prima, la Nélida. Si ves una casa con malvones en la ventana, era la de ella.', 'Llevá sal en el bolsillo. Mi abuela decía que a los aparecidos no les gusta la sal.'];
    if (p >= 2) return ['El camino del castillo anda lleno de lobos. El Beto de los barriles dice que uno le comió la vianda. Yo creo que se la comió él.', 'Si te lastiman, volvé. Acá siempre hay una cama y un mate.'];
    return ['¿Todavía acá? El Rey no espera a nadie, ' + quien + '. El camino al castillo lo tenés marcado.', 'Y no le hagas caso al Mateo si te para en la puerta. Ése te cuenta la vida de todo el pueblo.'];
  };
  const STORY = () => (typeof STORY_NPCS !== 'undefined' ? STORY_NPCS : null);
  if (STORY() && !STORY().some(n => n.id === 'rosa'))
    STORY().push({ id: 'rosa', zone: ZONA, x: ROSA[0], y: ROSA[1] - 4, r: 30, name: 'Doña Rosa, la posadera', face: 'ck_rosa', lines: (s, hero) => LINEAS_ROSA(window.activeGameScene || {}) });

  // la posadera está siempre en la posada (salvo mientras hace la escena del despertar)
  const mostrada0 = P.onAreaShown;
  P.onAreaShown = function (area) {
    const r = mostrada0 ? mostrada0.apply(this, arguments) : undefined;
    try {
      if (this._ckRosa && this._ckRosa.active) this._ckRosa.destroy();
      this._ckRosa = null;
      if (area && area.key === ZONA && this._gameMode === 'campaign' && !this._ckDespertando) {
        texturaRosa(this);
        this._ckRosa = E.actor(this, 'ck_rosa', ROSA[0], ROSA[1], { escala: 1.3, anim: 'ck_rosa' });
      }
    } catch (e) { console.warn('[intro]', e); }
    return r;
  };

  // ------------------------------------------------------------------ el despertar en el cuarto
  const despertar = async S => {
    S._ckDespertando = true;
    S.ckEntrar(MAPA, { x: CUARTO.x, y: CUARTO.y });
    const t0 = performance.now();
    while ((S.currentZoneKey() !== ZONA || S._doorTransition) && performance.now() - t0 < 6000) await E.esperar(100);
    await E.esperar(500);
    S._ckDespertando = false;
    if (S._ckRosa && S._ckRosa.active) S._ckRosa.destroy();
    texturaRosa(S);
    await E.correr(S, async () => {
      if (S.player) { S.player.setFlipX(true); S.facingDirection = 'left'; }
      S.cameras.main.fadeIn(900, 0, 0, 0);
      await E.esperar(1300);
      const rosa = E.actor(S, 'ck_rosa', PASILLO[0], PASILLO[1], { escala: 1.3, anim: 'ck_rosa' });
      S._ckRosa = rosa;
      try { if (typeof sfx !== 'undefined') [0, 190, 420].forEach(t => setTimeout(() => sfx.fx('step_wood1', 0.9, { rate: 1.35 }), t)); } catch (e) {}   // toc, toc, toc
      await E.globo(S, rosa, '¡Toc, toc! ¿Se puede?', 1500);
      await E.caminar(S, rosa, PUERTA_CUARTO[0], PUERTA_CUARTO[1], 46);
      await E.caminar(S, rosa, ADENTRO[0], ADENTRO[1], 40);
      rosa.setFlipX(false);
      const q = nombreDe(S);
      const propio = {
        soldier: 'Señor caballero, le pasé un trapo a la armadura. Lustrarla no, que no soy su escudero.',
        wizard: 'Don Horos, le dejé un té de peperina en la mesa. Dicen que usted ya vio esta niebla una vez… después me cuenta.',
        swordsman: 'Aby, querida… sé lo de Brumavieja. Mientras quieras, esta posada es tu casa.'
      }[S.playerHero] || 'Te dejé el desayuno en la mesa.';
      await E.dialogo(S, 'Doña Rosa, la posadera', [
        '¡Arriba, ' + q + ', que el gallo ya cantó tres veces y el mate se enfría!',
        propio,
        'Esta mañana pasó un chasqui del castillo preguntando por vos. El Rey Aldric te espera en el Gran Salón.',
        'Y comé algo antes, que con la panza vacía no se pelea.'
      ], 'ck_rosa');
      await E.caminar(S, rosa, PUERTA_CUARTO[0], PUERTA_CUARTO[1], 46);
      await E.caminar(S, rosa, ROSA[0] + 27, PUERTA_CUARTO[1] + 60, 46);
      await E.caminar(S, rosa, ROSA[0], ROSA[1], 46);
    });
    S.story.flags.intro = true;
    if (S.saveStory) S.saveStory();
    if (S.updateObjective) S.updateObjective();
    if (S.showZoneTitle) S.showZoneTitle('Capítulo 1', 'La niebla del norte');
  };

  // ------------------------------------------------------------------ cuándo
  const fin0 = P.finishHeroSelection;
  P.finishHeroSelection = function () {
    this._ckIntroPendiente = this.heroSelectionTargetMode === 'campaign';
    return fin0.apply(this, arguments);
  };
  const ini0 = P.initStory;
  P.initStory = function () {
    const r = ini0.apply(this, arguments);
    const pend = this._ckIntroPendiente;
    this._ckIntroPendiente = false;
    const st = this.story;
    if (pend && st && st.step === 0 && !(st.flags && st.flags.intro) && !(st.xp > 0) && !this._ckIrA) {
      const S = this;
      S._ckEscena = true;                   // quieto mientras se leen los pergaminos
      mostrarIntro(S).then(() => { S._ckEscena = false; if (S.story) { if (window.CK_PROLOGO && CK_PROLOGO.trasIntro) CK_PROLOGO.trasIntro(S, despertar); else despertar(S); } });   // (10/11) ck_prologo.js: festejo y Pipo
    }
    return r;
  };

  window.CK_INTRO = { PAGINAS, mostrarIntro, despertar, LINEAS_ROSA };
})();
