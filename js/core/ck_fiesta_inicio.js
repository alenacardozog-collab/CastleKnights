'use strict';
/* El arranque en la fiesta del pueblo (12/11, pedido del dueño: "el juego empieza en la fiesta del pueblo de noche con los
   fuegos artificiales, y luego van a la taberna donde hacen eso que hiciste, y luego amanece y empezamos").
   Sólo en partidas NUEVAS, después de los pergaminos (ck_intro.js) y antes del festejo de la taberna (ck_prologo.js):
   1. De noche en la Aldea del Roble: la gente festeja alrededor del fogón y en las mesas, los chicos saltan, tiran fuegos
      artificiales (los de ck_prologo_noche.js, que ya salen solos en la aldea de noche durante el prólogo, más una
      tanda grande al final).
   2. El tabernero junta a todos y los invita a la taberna; la gente camina hacia la puerta y se funde a negro.
   3. Sigue lo de siempre: el festejo adentro de la taberna, "pasa la noche", amanece y Pipo despierta al héroe.
   Necesita ck_escenas.js y ck_prologo.js. Borrar su línea de index.html deja el arranque directo en la taberna. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_ESCENA || !window.CK_PROLOGO) return;
  const E = window.CK_ESCENA, PR = window.CK_PROLOGO, esperar = E.esperar;
  const DIA = 300000;
  const FOGON = [273, 480], MESAS = [168, 384], PUERTA = [454, 424];
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const nueva = S => !!(st(S) && S.story.flags && S.story.flags.v2);
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const hasta = async (fn, ms = 6000) => { const t0 = performance.now(); while (!fn() && performance.now() - t0 < ms) await esperar(100); return fn(); };
  const nombre = S => { const h = (typeof HEROES !== 'undefined' && HEROES[S.playerHero]) || { name: 'forastero' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  // camina por donde se puede pisar (la grilla de navegación del juego), no en línea recta por encima de las casas
  const ruta = async (S, sp, x, y, vel) => {
    let pts = null;
    try { pts = S.navPath ? S.navPath(sp.x, sp.y, x, y, 9000) : null; } catch (e) {}
    if (!pts || !pts.length) pts = [[x, y]];
    for (const [px, py] of pts) { if (!sp.active) return; await E.caminar(S, sp, px, py, vel, { mundo: true }); }
  };
  // el lugar libre más cercano (por si el punto cae sobre una mesa o un cerco)
  const libre = (S, x, y) => {
    if (!S.navIsFree || S.navIsFree(x, y)) return [x, y];
    for (let r = 6; r <= 36; r += 6) for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, q = [Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r)];
      if (S.navIsFree(q[0], q[1])) return q;
    }
    return [x, y];
  };
  const hora = (S, p) => { const d = S.dayClock || 0; S.dayClock = Math.floor(d / DIA) * DIA + p * DIA; };

  // [hoja, x, y, mira a la izquierda, quién] — en ronda al fogón y en las mesas de la izquierda
  const GENTE = [
    ['npc3_villager', 300, 452, true, 'tabernero'],
    ['npc7_villager', 246, 470, false, 'mirta'], ['npc6_villager', 252, 500, false, 'anselmo'],
    ['npc1_villager', 296, 506, true, 'a'], ['npc12_villager', 316, 482, true, 'b'],
    ['npc13_villager', 230, 492, false, 'nene'], ['npc14_villager', 272, 446, false, 'c'],
    ['npc11_villager', 150, 392, false, 'd'], ['npc5_villager', 186, 394, true, 'e'], ['npc9_villager', 168, 408, false, 'f']
  ];

  const fiesta = async S => {
    hora(S, 0.7);                                            // de noche
    S.ckEntrar('village', { x: 330, y: 440 });
    await hasta(() => S.currentZoneKey && S.currentZoneKey() === 'village' && !S._doorTransition);
    await esperar(300);
    const quien = {}, todos = [];
    GENTE.forEach(([tex, x0, y0, izq, id]) => {
      if (!S.textures.exists(tex)) return;
      const [x, y] = libre(S, x0, y0);
      const sp = E.actor(S, tex, x, y, { escala: 1.3, flip: izq });
      quien[id] = sp; todos.push(sp);
    });
    const salto = (sp, d = 0, h = 4) => S.time.delayedCall(d, () => sp.active && S.tweens.add({ targets: sp, y: sp.y - h, duration: 130, yoyo: true, ease: 'Sine.easeOut' }));
    // el baile: saltitos sueltos todo el rato
    const baile = S.time.addEvent({ delay: 420, loop: true, callback: () => { const sp = todos[Math.floor(Math.random() * todos.length)]; if (sp) salto(sp, 0, 3); } });
    const tanda = (n, cada) => { for (let i = 0; i < n; i++) S.time.delayedCall(i * cada, () => { S._ckCohete = 0; }); };
    const hero = nombre(S);
    try {
      await E.correr(S, async () => {
        if (S.player) { S.player.setFlipX(true); S.facingDirection = 'left'; S.facingV = null; }
        const cam = S.cameras.main;
        cam.stopFollow(); cam.centerOn(PUERTA[0] - 60, 300);
        // (12/11 tarde) el telón negro del arranque (ck_arranque.js) esperaba a la taberna: se veía negro con la fiesta
        // sonando. Se saca acá, justo cuando la aldea está lista, y la escena arranca recién ahí.
        if (window.CK_ARRANQUE && CK_ARRANQUE.sacar) CK_ARRANQUE.sacar();
        cam.fadeIn(1600, 0, 0, 0);
        tanda(3, 700);
        await esperar(1500);
        await E.camara(S, FOGON[0] + 10, FOGON[1] - 40, 2600);
        if (quien.nene) { E.globo(S, quien.nene, '¡Otro, otro!', 1700); salto(quien.nene, 0, 6); salto(quien.nene, 300, 6); }
        await esperar(900);
        if (quien.mirta) await E.globo(S, quien.mirta, '¡Hacía años que el Roble no festejaba así!', 2300);
        if (quien.d) { E.globo(S, quien.d, '¡Ooooh!', 1500); }
        if (quien.e) { S.time.delayedCall(300, () => E.globo(S, quien.e, '¡Mirá ése, el violeta!', 1700)); }
        tanda(2, 500);
        await esperar(1900);
        if (quien.anselmo) await E.globo(S, quien.anselmo, `¡Ahí está ${hero}! ¡Que se acerque al fuego!`, 2200);
        await E.dialogo(S, 'Tabernero', [
          '¡Vecinos! Hacía mucho que no teníamos nada para festejar.',
          `Esta noche sí: ${hero} vino a darnos una mano con la niebla.`,
          '¡Todos a la taberna, que invita la casa!'
        ], 'npc3_villager');
        son('ck_jarras', 0.6);
        todos.forEach((sp, i) => { salto(sp, i * 70, 5); if (i % 3 === 0) S.time.delayedCall(i * 90, () => E.globo(S, sp, i % 2 ? '¡Vamos!' : '¡A la taberna!', 1500)); });
        tanda(4, 350);
        cam.shake(200, 0.0015);
        await esperar(1600);
        // todos para la puerta de la taberna
        const [px, py] = libre(S, PUERTA[0], PUERTA[1] + 14);
        todos.forEach((sp, i) => S.time.delayedCall(i * 140, () => ruta(S, sp, px + (i % 3 - 1) * 8, py + (i % 2) * 6, 56)));
        E.camara(S, (FOGON[0] + PUERTA[0]) / 2, PUERTA[1] - 10, 2600);
        await esperar(2200);
        cam.fadeOut(1300, 0, 0, 0);
        await esperar(1400);
      });
    } finally {
      baile.remove();
      todos.forEach(sp => { if (sp.active) { S.tweens.killTweensOf(sp); sp.destroy(); } });
    }
  };

  const tras0 = PR.trasIntro;
  PR.trasIntro = (S, despertarViejo) => {
    if (!nueva(S)) return tras0(S, despertarViejo);
    fiesta(S).catch(e => console.warn('[fiesta]', e)).then(() => tras0(S, despertarViejo));
  };
  PR.fiesta = fiesta;
})();
