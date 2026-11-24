'use strict';
/* Brumavieja y el Cementerio Real, rehechos (23/11, notas del dueño de `notas_para_corregir (2).json`, recorriendo la historia
   hacia atrás):
   - Nota 35, BRUMAVIEJA: "esqueletos → la capilla → el libro viejo → al salir, el Gran Esqueleto (minijefe, más fuerte) → ir al
     cementerio".
   - Nota 34, CEMENTERIO REAL: "al llegar no hay enemigos; una voz; una marca verde en el piso que titila; el puzzle de las
     estatuas; la voz otra vez; un rayo verde; cuadro de impacto y aparece el Nigromante en el centro; esqueletos; ataca".
   - Nota 33: "suelta el cristal verde y hay que juntarlo".
   El Capítulo 1 queda así (los números de paso no cambian; banderas en story.flags.bv):
   - Paso 5 (después de Tobías): al acercarse a la capilla los muertos se levantan a cuidarla (cinco esqueletos). Vencidos, la
     puerta cede y se entra con T. Adentro, en un rincón, brilla el DIARIO DE VARÉK (el lector de libros): cuenta que se fue al
     Cementerio Real a esconderse "del otro lado" del círculo de los cuatro reyes de piedra, y en qué orden se inclinan.
     Al salir de la capilla, el GRAN ESQUELETO (el sepulturero) sube de la tierra frente a la escalinata, con el doble de vida;
     lleva la LLAVE DEL CEMENTERIO REAL (paso 6). Mientras tanto, el portón del Cementerio Real está con candado.
   - Paso 6, en el Cementerio Real: sin bestias. La voz de Varek; en el centro del círculo una marca verde que titila. Con T en
     cada estatua (el nombre sale en el cartel) se la hace "inclinar"; en orden (Aldemar el Fundador, Berengar el Sabio,
     Dagoberto el Cruel, Casimiro el Rey Niño) se encienden una por una; si se erra, se apagan todas y se oye su risa. En el borde
     del círculo hay un grabado con la pista (para quien no leyó el diario). Con las cuatro: la voz grita, tres rayos verdes,
     un cuadro de impacto y el Nigromante aparece en el centro; seis esqueletos suben alrededor y pelea (se sella con el Libro
     del Sello, como antes). Si se sale a mitad de la pelea, al volver aparece enseguida.
   - Al sellarlo, el CRISTAL VERDE queda en el piso brillando: se junta pasando por encima o con T (si uno se va sin juntarlo,
     se lo lleva igual). Ya no sale de la capilla de Brumavieja (ni habla su voz ahí).
   Usa ck_zona_brumavieja.js (mapas), ck_lecturas.js v2 (sumar el diario), ck_libro_sello.js v2 (el cristal), ck_escenas.js.
   Va después de ck_libro_sello.js y ck_brumavieja.js. Borrar su línea de index.html deja el capítulo como antes.
   (23/11, v2, notas del dueño: "el esqueleto nace acá"): el Gran Esqueleto sube abajo de la fuente de la plaza (561, 440),
   con la cámara encima.
   (23/11, v3, nota 5 del dueño: "acá usá la forma de la imagen y dale iluminación; el puzzle sería buscar en las tumbas dónde
   están las cosas, las tumbas se pueden romper, a veces saldrán venenos u otros enemigos hasta completar las 4 partes y se
   invoca el Nigromante; quitá este círculo genérico, usá el de la imagen y ajustalo bien"). El Cementerio Real, paso 6:
   - EL CÍRCULO: ya no se dibuja la marca de antes (elipse y runas): se ilumina el círculo grabado del piso del mapa, con su
     misma forma (ck_cementerio_arte.js), titilando; con cada reliquia hallada brilla más.
   - LAS CUATRO RELIQUIAS de los reyes de piedra (la corona de Aldemar, el anillo de Berengar, la espada de Dagoberto y el
     sonajero de Casimiro): Varek se las sacó al círculo para cruzar y las enterró entre las tumbas del cementerio. Las
     lápidas, tumbas y sarcófagos se rompen a golpes (ck_terreno_rompible.js: rajaduras y pedazos; lo roto queda roto). En
     cuatro de ellas, una por cada lado del cementerio y elegidas al azar en cada partida, está una reliquia; esas tumbas
     largan cada tanto un aliento verde (la pista, la dice también el diario). Las otras a veces largan una nube de veneno,
     a veces muertos (esqueletos o murciélagos), a veces unas monedas o nada.
   - Cada reliquia salta al piso y se junta pasando por encima o con T; la estatua de su rey se enciende. Con las cuatro,
     al pisar el círculo se ponen en sus cuatro puntas, el círculo se prende entero y el Nigromante es arrancado del otro
     lado (los rayos, el cuadro de impacto y la pelea de antes). Ya no hay que tocar las estatuas en orden.
   - El diario de Varek, su voz al llegar, el grabado del borde y el objetivo lo cuentan así. Banderas: bv.rel (qué tumba
     tiene cada reliquia), bv.halladas, bv.suelo (las que quedaron en el piso), bv.puzzle (puestas en el círculo). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined' || typeof QUESTS === 'undefined' || !window.CK_ZONA_BRUMA) return;
  const P = MainGameScene.prototype, ZB = window.CK_ZONA_BRUMA;
  const ZR = 'ruins.village', ZCM = 'ed_' + ZB.CEMENTERIO + '.main', ZCP = 'ed_' + ZB.CAPILLA + '.main';
  const E = () => window.CK_ESCENA;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const bv = s => (fl(s).bv = fl(s).bv || {});
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => S.currentInterior && S.currentInterior.area;
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const CAP = () => window.CK_CAPILLA || { x: 522, y: 220 };
  const LIBRE = () => !!(window.CK_LIBRE && CK_LIBRE());
  const paso = s => (s && s.step) || 0;
  const objs = S => (S._bvObjs = S._bvObjs || []);
  const limpiarObjs = S => { (S._bvObjs || []).forEach(o => { try { if (o && o.destroy) o.destroy(); else if (o && o.remove) o.remove(); } catch (e) {} }); S._bvObjs = []; };
  // el cartel de abajo ("T · …") mientras se está cerca de algo de este archivo
  const cartel = (S, txt) => {
    const pr = document.getElementById('ck-prompt'); if (!pr) return;
    if (txt) { pr.textContent = txt; pr.classList.add('on'); S._bvCartel = txt; }
    else if (S._bvCartel) { if (pr.textContent === S._bvCartel) pr.classList.remove('on'); S._bvCartel = null; }
  };

  // ================================================================== textos: objetivos, Tobías, el mapa
  QUESTS[5].goal = 'Brumavieja: llegá a la capilla, buscá adónde fue el encapuchado y quitale la llave al Gran Esqueleto';
  QUESTS[6].goal = 'Bajá al Cementerio Real (el camino del este de Brumavieja) y enfrentá al Nigromante';
  const TOB = STORY_NPCS.find(n => n.id === 'hermit');
  if (TOB) {
    const CAMBIA = [
      [/^Un encapuchado se encerró en la capilla/, 'Un encapuchado vivía en la capilla desde la noche de la niebla. Desde entonces los muertos caminan.'],
      [/^La llave de la capilla la tenía el sepulturero/, 'Los muertos rondan la capilla como perros guardianes. Si pasás entre ellos, adentro vas a encontrar sus cosas: ahí dormía.'],
      [/^Quitásela, abrí la capilla/, 'Buscá algo que diga adónde se fue. Y cuidate del sepulturero: lo que quedó de él todavía anda por acá.'],
      [/^El cementerio está arriba, al noreste/, null],
      [/^¡Tenés la llave! La capilla está/, '¡La llave del portón! El Cementerio Real está bajando por el camino del este, al lado de la capilla. Que los reyes te cuiden.']
    ];
    const l0 = TOB.lines;
    TOB.lines = function (s) {
      const L = (l0.apply(this, arguments) || []).slice();
      const b = bv(s), out = [];
      L.forEach(t => {
        const c = CAMBIA.find(([re]) => re.test(t));
        if (!c) { out.push(t); return; }
        if (c[1]) { out.push(c[1]); return; }
        // paso 5: según por dónde vaya
        out.push(!b.capilla ? 'La capilla está en lo alto de la escalinata. Los muertos no te van a dejar pasar así nomás.'
          : !b.libro ? 'La puerta cedió, ¿no? Entrá. Algo tiene que haber dejado.'
            : '¿Un diario? ¿El Cementerio Real? Ahí descansan los reyes del Roble… El portón tiene candado, y la llave la lleva el sepulturero. O lo que quedó de él.');
      });
      return out;
    };
  }
  try {
    const MM = window.CK_MINIMAPA;
    if (MM && MM.META_PASO) { const c = CAP(); MM.META_PASO[5] = [ZR, c.x, c.y]; MM.META_PASO[6] = [ZCM, 718, 452]; }
  } catch (e) {}
  // el Gran Esqueleto ya no espera en su cementerio: sale al volver de la capilla
  if (typeof ZONE_ENEMIES !== 'undefined' && ZONE_ENEMIES[ZR]) ZONE_ENEMIES[ZR] = ZONE_ENEMIES[ZR].filter(q => q[0] !== 'skeleton_great');

  // ================================================================== el diario de Varek (en la capilla)
  const DIARIO = 'lb_diario_varek';
  const ORDEN_TXT = 'primero Aldemar el Fundador, después Berengar el Sabio, después Dagoberto el Cruel, y por último Casimiro, el Rey Niño';
  if (window.CK_LECTURAS && CK_LECTURAS.sumar) CK_LECTURAS.sumar({ id: DIARIO, zona: ZCP, t: 'Diario de Varek', autor: 'Varek, aprendiz de la biblioteca', color: '#2f4a2a', p: [
    '«Día 1. El Maestre Eloy me echó de la biblioteca. Dice que el Códice no es para aprendices. El Códice dice otra cosa: me dice mi nombre de noche.»',
    '«Día 9. La niebla me obedece. Los muertos de Brumavieja también. Tobías me vio salir del cementerio con una pala; lo dejé vivir. Alguien tiene que contar lo que pasó.»',
    '«Día 20. El Códice habla de una puerta en el CEMENTERIO REAL, en el círculo de los cuatro reyes de piedra. Del otro lado no hay miedo, ni hambre, ni muerte. Ni maestres.»',
    '«Los reyes la tienen cerrada con lo que se llevaron a la tumba: la corona de Aldemar, el anillo de Berengar, la espada de Dagoberto y el sonajero de Casimiro, el que no llegó a crecer. Sin las cuatro, el círculo no cierra.»',
    '«Se las saqué y las enterré entre las tumbas del cementerio, donde nadie las busque. Donde hay una, la tierra respira verde. Si alguien las devuelve al círculo, la puerta se cierra… y me escupe de este lado.»',
    '«Día 31. Me voy al Cementerio. El sepulturero se queda cuidando la capilla, con la llave del portón colgada del cuello. Ya no le late el corazón, pero obedece.»',
    '«Si alguien lee esto: no me sigas. Del otro lado del círculo me hago eterno. Y si me sacás de ahí… vas a desear no haberlo hecho.»'
  ] });
  const leyoDiario = s => !!(fl(s).lecturas && fl(s).lecturas[DIARIO]);

  // ================================================================== Brumavieja, paso 5
  // los muertos que cuidan la capilla: [dx, dy desde la puerta, tipo]
  const GRAN_NACE = { x: 561, y: 440 };                  // (v2) donde sube el Gran Esqueleto: abajo de la fuente de la plaza
  const GUARDIA = [[-70, 62, 'skeleton'], [70, 62, 'skeleton'], [-36, 108, 'skeleton_armored'], [36, 108, 'skeleton_armored'], [0, 150, 'skeleton_archer']];
  const levantar = (S, x, y, t, marca) => {
    if (typeof ENEMY_TYPES === 'undefined' || !ENEMY_TYPES[t]) return null;
    const en = S.spawnEnemy(x, y - 26, t); if (!en) return null;
    if (S.placeEnemyClear && !S.placeEnemyClear(en)) { en.destroy(); return null; }
    en.zone = zona(S); if (marca) marca(en);
    if (S.enemyMakeDormant && S.anims.exists(t + '_summon')) { S.enemyMakeDormant(en); S.time.delayedCall(R(100, 700), () => vivo(en) && S.enemyRise && S.enemyRise(en, true)); }
    else S.time.delayedCall(300, () => vivo(en) && S.alertEnemy && S.alertEnemy(en));
    return en;
  };
  const guardia = S => {
    const a = area(S), c = CAP(); if (!a || S._bvGuardia) return;
    S._bvGuardia = { t0: S.time.now };
    son('bone_hit', 0.7, { rate: 0.5 }); son('ck_fantasma_susurro', 0.6);
    S.cameras.main.shake(500, 0.005);
    S.createFloatingText(S.player.x, S.player.y - 58, '¡Los muertos cuidan la capilla!', 0xd9f99d);
    GUARDIA.forEach(([dx, dy, t], i) => S.time.delayedCall(i * 220, () => {
      if (zona(S) !== ZR) return;
      levantar(S, a.x + c.x + dx, a.y + c.y + dy, t, en => { en._bvGuardia = true; });
    }));
  };
  const puertaCede = S => {
    const s = st(S); if (!s) return;
    bv(s).capilla = true; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
    son('door_gate', 0.8, { rate: 0.8 }); S.cameras.main.shake(300, 0.004);
    S.showZoneTitle('La capilla', 'La puerta cedió');
  };
  // el Gran Esqueleto, al salir de la capilla con el diario leído
  const gran = S => {
    const e = E(), a = area(S), c = CAP(), s = st(S); if (!a || !s || S._bvGran) return;
    if (S.enemies && S.enemies.getChildren().some(x => vivo(x) && x.type === 'skeleton_great')) return;
    S._bvGran = true;
    let p = { x: GRAN_NACE.x, y: GRAN_NACE.y };            // (v2, nota del dueño: "el esqueleto nace acá")
    if (S.navIsFree && !S.navIsFree(a.x + p.x, a.y + p.y)) {
      for (const [dx, dy] of [[0, 30], [40, 20], [-40, 20], [0, 60], [60, 40], [-60, 40]]) if (S.navIsFree(a.x + p.x + dx, a.y + p.y + dy)) { p = { x: p.x + dx, y: p.y + dy }; break; }
    }
    let en = null;
    const pelea = () => { if (vivo(en)) { en.state === 'dormant' && S.enemyRise ? S.enemyRise(en, true) : S.alertEnemy && S.alertEnemy(en); } };
    const sube = () => {
      en = S.spawnEnemy(a.x + p.x, a.y + p.y - 26, 'skeleton_great');
      if (!en) return;
      if (S.placeEnemyClear) S.placeEnemyClear(en);
      en.zone = ZR; en._bvGran = true;
      en.hp = en.maxHp = Math.max(24, Math.round(en.maxHp * 2));          // el minijefe, más fuerte
      en.setScale(en.scaleX * 1.15);
      if (S.enemyMakeDormant && S.anims.exists('skeleton_great_summon')) { S.enemyMakeDormant(en); S.time.delayedCall(200, () => vivo(en) && S.enemyRise(en, false)); }
    };
    if (!e || !e.correr) { sube(); pelea(); return; }
    e.correr(S, async () => {
      await e.camara(S, p.x, p.y - 30, 800);
      son('ck_derrumbe', 0.7); S.cameras.main.shake(1100, 0.009);
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2, x = a.x + p.x, y = a.y + p.y, d = S.add.circle(x, y, R(4, 9), 0x6b5f4a, 0.85).setDepth(y + 30);
        S.tweens.add({ targets: d, x: x + Math.cos(ang) * R(20, 70), y: y + Math.sin(ang) * R(8, 26) - R(6, 20), alpha: 0, scale: 1.8, duration: R(500, 900), onComplete: () => d.destroy() });
      }
      await e.esperar(500);
      sube();
      son('ck_f_esqueleto_golpe', 0.8) || son('bone_hit', 0.9, { rate: 0.5 });
      await e.esperar(1700);
      if (vivo(en)) await e.globo(S, en, '…la… llave… del… portón… es… mía…', 2200, 74);
    }).then(pelea).catch(pelea);
  };

  // ================================================================== Cementerio Real, paso 6
  const CENTRO = { x: 718, y: 452 };
  // las cuatro estatuas (el pie de cada una, en el mapa) y su lugar en el orden
  const REYES = [
    { x: 852, y: 378, n: 'Aldemar el Fundador', i: 0 },
    { x: 588, y: 543, n: 'Berengar el Sabio', i: 1 },
    { x: 584, y: 376, n: 'Dagoberto el Cruel', i: 2 },
    { x: 847, y: 543, n: 'Casimiro, el Rey Niño', i: 3 }
  ];
  const VOZ = 'Una voz entre las tumbas';
  // (v3) el círculo grabado del piso, iluminado con su misma forma (ck_cementerio_arte.js); sin el arte, la marca de antes
  const IMGS = {};
  const texDe = (S, k, src) => {
    const key = 'ckcm_' + k; if (S.textures.exists(key)) return key;
    if (!src) return null;
    let im = IMGS[k]; if (!im) { im = IMGS[k] = new Image(); im.src = src; }
    if (!im.complete || !im.naturalWidth) return null;
    S.textures.addImage(key, im); return key;
  };
  const precargar = (k, src) => { if (src && !IMGS[k]) { const im = IMGS[k] = new Image(); im.src = src; } };
  try { const A = window.CK_CEMENTERIO_ARTE; if (A) { precargar('circulo', A.circulo.img); Object.keys(A.reliquias).forEach(k => precargar(k, A.reliquias[k])); } } catch (e) {}
  const marca = S => {
    const a = area(S); if (!a || S._bvMarca) return;
    const A = window.CK_CEMENTERIO_ARTE, c = A && A.circulo, k = c && texDe(S, 'circulo', c.img);
    if (k) {
      const img = S.add.image(a.x + c.x, a.y + c.y, k).setOrigin(0, 0).setDepth(8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      const m = S._bvMarca = { img, n: 0, lleno: 0, dib: n => { m.n = n; } };
      objs(S).push(img);
      return;
    }
    const x = a.x + CENTRO.x, y = a.y + CENTRO.y;
    const g = S.add.graphics().setDepth(y - 30).setBlendMode(Phaser.BlendModes.ADD);
    const dib = n => {
      g.clear();
      g.lineStyle(3, 0x5dff8a, 0.9); g.strokeEllipse(x, y, 150, 54);
      g.lineStyle(1, 0x5dff8a, 0.7); g.strokeEllipse(x, y, 118, 40);
      g.fillStyle(0x2bff6a, 0.12 + n * 0.06); g.fillEllipse(x, y, 116, 38);
      for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; g.fillStyle(0x9dffb6, 0.8); g.fillRect(x + Math.cos(t) * 66 - 2, y + Math.sin(t) * 23 - 2, 4, 4); }
    };
    dib(0);
    const runas = S.add.text(x, y - 2, 'ᚱ ᚦ ᛟ ᛉ ᚨ ᛊ', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#9dffb6', stroke: '#06351a', strokeThickness: 3 }).setOrigin(0.5).setDepth(y - 29).setAlpha(0.8);
    const tw = S.tweens.add({ targets: [g, runas], alpha: { from: 0.25, to: 1 }, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    S._bvMarca = { g, runas, tw, dib };
    objs(S).push(g, runas);
  };
  const quitarMarca = S => {
    const m = S._bvMarca; if (!m) return; S._bvMarca = null;
    try {
      if (m.img) { S.tweens.add({ targets: m.img, alpha: 0, duration: 900, onComplete: () => m.img.destroy() }); return; }
      m.tw.remove(); m.g.destroy(); m.runas.destroy();
    } catch (e) {}
  };
  // (v3) titila; con cada reliquia brilla más; con las cuatro puestas, entero
  const brillo = S => {
    const m = S._bvMarca; if (!m || !m.img || !m.img.active || m.apagando) return;
    const t = S.time.now / 1000, n = m.n || 0;
    let al;
    if (m.lleno) al = 0.8 + 0.2 * Math.sin(t * 7);
    else {
      const lo = 0.1 + n * 0.1, hi = 0.38 + n * 0.13;
      al = lo + (hi - lo) * (0.5 + 0.5 * Math.sin(t * 2.4));
      if (S.time.now < (m.parpa || 0)) al *= 0.35;
      else if (Math.random() < 0.006) m.parpa = S.time.now + 90;      // de vez en cuando parpadea
    }
    m.img.setAlpha(al);
  };
  // la luz verde al pie de una estatua (queda prendida mientras el orden va bien)
  const luces = S => (S._bvLuces = S._bvLuces || {});
  const prender = (S, r) => {
    const a = area(S), L = luces(S); if (!a || L[r.i]) return;
    const x = a.x + r.x, y = a.y + r.y + 6;
    const piso = S.add.ellipse(x, y, 74, 24, 0x3dff7a, 0.35).setDepth(y - 20).setBlendMode(Phaser.BlendModes.ADD);
    const col = S.add.rectangle(x, y - 60, 30, 120, 0x7dffa0, 0.35).setDepth(y + 40).setBlendMode(Phaser.BlendModes.ADD);
    S.tweens.add({ targets: col, alpha: 0, scaleX: 0.2, duration: 900, onComplete: () => col.destroy() });
    S.tweens.add({ targets: piso, alpha: { from: 0.2, to: 0.5 }, duration: 700, yoyo: true, repeat: -1 });
    L[r.i] = piso; objs(S).push(piso);
    for (let k = 0; k < 10; k++) {
      const c = S.add.circle(x + R(-26, 26), y + R(-6, 6), R(1.5, 3), 0xb6ffc8, 0.9).setDepth(y + 41).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: c, y: c.y - R(40, 90), alpha: 0, duration: R(700, 1300), onComplete: () => c.destroy() });
    }
  };
  const apagar = S => { const L = luces(S); Object.keys(L).forEach(k => { const o = L[k]; if (o && o.active) S.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() }); }); S._bvLuces = {}; };
  const reyCerca = S => {
    const a = area(S); if (!a || !S.player) return null;
    const p = pies(S); let m = null, md = 64;
    REYES.forEach(r => { const d = Math.hypot(p.x - (a.x + r.x), (p.y - (a.y + r.y + 14)) * 1.3); if (d < md) { md = d; m = r; } });
    return m;
  };
  const tocar = (S, r) => {
    const s = st(S), b = bv(s), C = S._bvCem || (S._bvCem = { n: 0 });
    if (b.puzzle || S._ckEscena) return;
    if (r.i === C.n) {
      C.n++; prender(S, r);
      son('runas', 0.7) || son('magic_cast', 0.6, { rate: 1.2 });
      S.createFloatingText(S.player.x, S.player.y - 58, r.n.toUpperCase() + ' SE INCLINA', 0x86efac);
      if (S._bvMarca) S._bvMarca.dib(C.n);
      if (C.n >= REYES.length) { b.puzzle = true; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective(); S.time.delayedCall(700, () => despierta(S)); }
    } else {
      C.n = 0; apagar(S); if (S._bvMarca) S._bvMarca.dib(0);
      son('ck_fantasma_susurro', 0.7) || son('necro_cast', 0.5, { rate: 1.4 });
      S.cameras.main.shake(200, 0.003);
      const a = area(S);
      S.createFloatingText(a.x + CENTRO.x, a.y + CENTRO.y - 50, UNO(['Ja… ése no.', '¿Ni el orden sabés?', 'Los reyes no se inclinan ante cualquiera…']), 0xa7f3d0);
    }
  };
  // ================================================================== (v3) las cuatro reliquias y las tumbas que se rompen
  // cada reliquia es de un rey (REYES[rey]) y está en una tumba de su lado del cementerio; punta: dónde va en el círculo
  const CIRC = { x: 719, y: 433, rx: 95, ry: 68 };
  const RELIQ = [
    { id: 'corona', n: 'la Corona de Aldemar', rey: 0, punta: [719, 371] },
    { id: 'anillo', n: 'el Anillo de Berengar', rey: 1, punta: [628, 433] },
    { id: 'espada', n: 'la Espada de Dagoberto', rey: 2, punta: [719, 495] },
    { id: 'sonajero', n: 'el Sonajero de Casimiro', rey: 3, punta: [810, 433] }
  ];
  const T_ = l => l.map(n => 'ed_cm2_' + n);
  // tumbas adonde se llega caminando, por lado (las de afuera de las rejas y los bancos de piedra de la plaza no cuentan)
  const LADOS = {
    corona: T_(['tumba_7', 'lapida_23', 'lapida_22', 'lapida_26', 'lapida_27', 'tumba_8']),                                    // noreste (Aldemar)
    anillo: T_(['lapida_38', 'lapida_37', 'tumba_9', 'lapida_42', 'lapida_41', 'lapida_40', 'lapida_43', 'tumba_10', 'tumba_11', 'lapida_44']), // suroeste (Berengar)
    espada: T_(['lapida_18', 'lapida_17', 'lapida_15', 'lapida_21', 'lapida_19', 'lapida_25', 'sarcofago', 'sarcofago_2']),     // noroeste (Dagoberto)
    sonajero: T_(['lapida_24', 'lapida_28', 'lapida_32', 'lapida_30', 'lapida_34', 'lapida_33', 'lapida_39'])                  // este (Casimiro)
  };
  const TUMBA = /^ed_cm2_(lapida|tumba|sarcofago)(_\d+)?$/;
  const BANCOS = /^ed_cm2_lapida_(29|31|35|36)$/;                     // los cuatro bancos de piedra alrededor del círculo
  const baseDe = k => (k || '').replace(/(_esp)?(_rc\d+)?(_p\d+)?(_na\d+)?$/, '');
  const halladas = s => Object.keys(bv(s).halladas || {}).length;
  const rotoYa = (s, base) => { const l = (fl(s).terrenoRoto || {})[ZB.CEMENTERIO] || []; return l.some(u => u.indexOf(base + '@') === 0); };
  // las tumbas se rompen (ck_terreno_rompible.js; se registra antes de que arme el mapa)
  const registrarTumbas = () => {
    const TR = window.CK_TERRENO_ROMPIBLE; if (!TR || !TR.MAPAS || TR.MAPAS[ZB.CEMENTERIO]) return;
    TR.MAPAS[ZB.CEMENTERIO] = { sueltos: TUMBA, nunca: BANCOS };
  };
  // qué tumba tiene cada reliquia: se elige una vez por partida, entre las que siguen enteras
  const asignar = S => {
    const s = st(S); if (!s) return;
    const b = bv(s); b.rel = b.rel || {}; b.halladas = b.halladas || {}; b.suelo = b.suelo || {};
    let cambio = false;
    RELIQ.forEach(R0 => {
      if (b.halladas[R0.id] || b.suelo[R0.id]) return;
      if (b.rel[R0.id] && !rotoYa(s, b.rel[R0.id])) return;
      const usadas = Object.keys(b.rel).filter(k => k !== R0.id).map(k => b.rel[k]);
      let l = LADOS[R0.id].filter(t => !rotoYa(s, t) && usadas.indexOf(t) < 0);
      if (!l.length) l = Object.keys(LADOS).reduce((x, k) => x.concat(LADOS[k]), []).filter(t => !rotoYa(s, t) && usadas.indexOf(t) < 0);
      if (l.length) b.rel[R0.id] = UNO(l);
      else { delete b.rel[R0.id]; const r = REYES[R0.rey]; b.suelo[R0.id] = { x: r.x + (r.x < CIRC.x ? -40 : 40), y: r.y + 30 }; }   // ya no queda tumba entera: al pie de su rey
      cambio = true;
    });
    if (cambio) S.saveStory && S.saveStory();
  };
  // las tumbas del mapa que armó ck_terreno_rompible.js: aguantan más que un hueso suelto
  const marcarTumbas = S => {
    const TR = window.CK_TERRENO_ROMPIBLE; if (!TR || zona(S) !== ZCM) return;
    S._bvTumbas = TR.lista(S).filter(r => {
      const base = baseDe(r.key); if (!TUMBA.test(base) || BANCOS.test(base)) return false;
      r._bvTumba = base; r.vida = r.max = /sarcofago|tumba/.test(base) ? 4 : 3; r.peso = 'pesado';
      return true;
    });
  };
  const relDeTumba = (s, base) => { const b = bv(s); return RELIQ.find(q => b.rel && b.rel[q.id] === base && !(b.halladas && b.halladas[q.id]) && !(b.suelo && b.suelo[q.id])); };
  // una tumba rota: la reliquia, o veneno, o muertos, o unas monedas, o nada
  const rompioTumba = (S, r) => {
    const s = st(S), a = area(S); if (!s || !a) return;
    const b = bv(s), x = (r.caja.x0 + r.caja.x1) / 2, y = r.caja.y1;
    const enPuzzle = paso(s) === 6 && !b.puzzle && !fl(s).boss_necromancer;
    const R0 = enPuzzle ? relDeTumba(s, r._bvTumba) : null;
    if (R0) { saltaReliquia(S, R0, x, y); return; }
    const q = Math.random();
    if (q < 0.3) {
      const T = window.CK_TRAMPAS;
      if (T && T.disparar) T.disparar(S, { x, y: y + 4, trampa: 'veneno' });
      S.createFloatingText(x, y - 46, UNO(['¡Veneno de tumba!', '¡Puaj! ¡Veneno!', '¡Aire podrido!']), 0x86efac);
    } else if (q < 0.6 && enPuzzle) {
      son('bone_hit', 0.7, { rate: 0.6 }); son('ck_fantasma_susurro', 0.5);
      S.createFloatingText(x, y - 46, UNO(['¡Los muertos!', '¡Algo se mueve ahí abajo!', '¡No estaba vacía!']), 0xd9f99d);
      if (Math.random() < 0.65) {
        const n = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < n; i++) S.time.delayedCall(i * 260, () => { if (zona(S) === ZCM) levantar(S, x + R(-22, 22), y + R(12, 28), UNO(['skeleton', 'skeleton', 'skeleton_armored', 'skeleton_archer']), en => { en._bvCem = true; }); });
      } else if (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.bat) {
        const n = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < n; i++) S.time.delayedCall(i * 160, () => {
          if (zona(S) !== ZCM) return;
          const ya = S._ckPermitirBestias; S._ckPermitirBestias = true;
          let en = null; try { en = S.spawnEnemy(x + R(-14, 14), y - 30, 'bat'); } finally { S._ckPermitirBestias = ya; }
          if (en) { en.zone = ZCM; en._bvCem = true; S.time.delayedCall(200, () => vivo(en) && S.alertEnemy && S.alertEnemy(en)); }
        });
      }
    } else if (q < 0.8) {
      const n = 1 + ((Math.random() * 3) | 0); s.coins = (s.coins || 0) + n;
      S.createFloatingText(x, y - 40, '+' + n + ' monedas', 0xfcd34d); son('coin', 0.45); S.saveStory && S.saveStory();
    } else S.createFloatingText(x, y - 40, UNO(['Sólo huesos…', 'Nada. Polvo y huesos.', 'Vacía.']), 0xcbd5e1);
  };
  // la reliquia salta de los escombros y queda en el piso
  const saltaReliquia = (S, R0, x, y) => {
    const s = st(S), a = area(S), b = bv(s); b.suelo = b.suelo || {};
    const lx = x + R(-14, 14), ly = y + 14;
    b.suelo[R0.id] = { x: Math.round(lx - a.x), y: Math.round(ly - a.y) };
    S.saveStory && S.saveStory();
    son('chest_open', 0.6) || son('quest_done', 0.5);
    S.createFloatingText(x, y - 50, '¡Algo brilla entre los escombros!', 0x86efac);
    const o = ponerSuelo(S, R0, x, y - 26);
    if (o) {
      S.tweens.add({ targets: o.sp, x: lx, duration: 520, ease: 'Linear' });
      S.tweens.add({ targets: o.sp, y: ly - 40, duration: 240, ease: 'Quad.easeOut', onComplete: () => S.tweens.add({ targets: o.sp, y: ly - 8, duration: 300, ease: 'Bounce.easeOut', onComplete: () => flotar(S, o) }) });
      o.halo.setPosition(lx, ly);
    }
  };
  const iconoRel = (S, R0, x, y) => {
    const A = window.CK_CEMENTERIO_ARTE, k = A && texDe(S, R0.id, A.reliquias[R0.id]);
    if (k) return S.add.image(x, y, k).setScale(2).setOrigin(0.5, 1);
    return S.add.star(x, y - 10, 5, 4, 9, 0xfde047).setStrokeStyle(2, 0x713f12);
  };
  const flotar = (S, o) => { if (o.sp && o.sp.active) S.tweens.add({ targets: o.sp, y: o.y - 12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); };
  // una reliquia en el piso (para juntar)
  const ponerSuelo = (S, R0, x0, y0) => {
    const s = st(S), a = area(S), b = bv(s), q = b.suelo && b.suelo[R0.id]; if (!q || !a) return null;
    const L = (S._bvSuelo = S._bvSuelo || {}); if (L[R0.id]) return L[R0.id];
    const x = a.x + q.x, y = a.y + q.y;
    const halo = S.add.ellipse(x, y, 30, 10, 0x3dff7a, 0.4).setDepth(y - 2).setBlendMode(Phaser.BlendModes.ADD);
    const sp = iconoRel(S, R0, x0 !== undefined ? x0 : x, y0 !== undefined ? y0 : y - 8).setDepth(y + 1);
    S.tweens.add({ targets: halo, alpha: { from: 0.15, to: 0.55 }, duration: 700, yoyo: true, repeat: -1 });
    const o = L[R0.id] = { R0, x, y, sp, halo };
    objs(S).push(sp, halo);
    if (x0 === undefined) flotar(S, o);
    return o;
  };
  const sueloCerca = (S, d0) => {
    const L = S._bvSuelo; if (!L || !S.player) return null;
    const p = pies(S); let m = null, md = d0;
    Object.keys(L).forEach(k => { const o = L[k]; const d = Math.hypot(p.x - o.x, (p.y - o.y) * 1.4); if (d < md) { md = d; m = o; } });
    return m;
  };
  const juntarReliquia = (S, o) => {
    const s = st(S), b = bv(s); if (!s || !o) return;
    const R0 = o.R0; if (b.halladas && b.halladas[R0.id]) return;
    (b.halladas = b.halladas || {})[R0.id] = true;
    if (b.suelo) delete b.suelo[R0.id];
    delete S._bvSuelo[R0.id];
    S.tweens.killTweensOf(o.sp); S.tweens.killTweensOf(o.halo); o.halo.destroy();
    S.tweens.add({ targets: o.sp, x: S.player.x, y: S.player.y - 30, scale: 0.6, alpha: 0, duration: 380, onComplete: () => o.sp.destroy() });
    const n = halladas(s);
    S.createFloatingText(S.player.x, S.player.y - 60, '◆ ' + R0.n.toUpperCase() + ' ◆  (' + n + ' de 4)', 0x86efac);
    son('quest_done', 0.7) || son('chest_open', 0.7);
    prender(S, REYES[R0.rey]);
    if (S._bvMarca) S._bvMarca.dib(n);
    if (n >= 4) S.time.delayedCall(1300, () => S.player && S.createFloatingText(S.player.x, S.player.y - 60, 'Las cuatro. Llevalas al círculo del centro', 0xd9f99d));
    S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
  };
  // el aliento verde de las tumbas que tienen una reliquia (la pista)
  const aliento = S => {
    const s = st(S); if (!s || !S._bvTumbas || !S.player) return;
    if (S.time.now < (S._bvAliento || 0)) return; S._bvAliento = S.time.now + 1300;
    const p = pies(S);
    S._bvTumbas.forEach(r => {
      if (r.roto || !relDeTumba(s, r._bvTumba)) { if (r._bvBase) { r._bvBase.destroy(); r._bvBase = null; } return; }
      const x = (r.caja.x0 + r.caja.x1) / 2, y = r.caja.y1 - 4;
      // al pie, un resplandor verde que respira (siempre) y, de cerca, el aliento que sube
      if (!r._bvBase) {
        r._bvBase = S.add.ellipse(x, y + 1, Math.max(30, (r.caja.x1 - r.caja.x0) * 1.1), 14, 0x3dff7a, 0.3).setDepth((r.sp && r.sp.depth ? r.sp.depth : r.caja.y1) - 0.5).setBlendMode(Phaser.BlendModes.ADD);
        S.tweens.add({ targets: r._bvBase, alpha: { from: 0.12, to: 0.5 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        objs(S).push(r._bvBase);
      }
      if (Math.hypot(p.x - x, p.y - y) > 360) return;
      for (let i = 0; i < 5; i++) {
        const c = S.add.circle(x + R(-10, 10), y - R(0, 10), R(3, 5), 0x6dff9a, 0).setDepth(r.caja.y1 + 4).setBlendMode(Phaser.BlendModes.ADD);
        S.tweens.add({ targets: c, alpha: { from: 0.75, to: 0 }, y: c.y - R(30, 60), x: c.x + R(-10, 10), scale: 2, delay: i * 160, duration: R(1000, 1500), onComplete: () => c.destroy() });
      }
    });
  };
  // con las cuatro, pisar el círculo: van a sus puntas y el círculo se prende entero
  const enCirculo = S => { const a = area(S), p = pies(S), dx = (p.x - (a.x + CIRC.x)) / CIRC.rx, dy = (p.y - (a.y + CIRC.y)) / CIRC.ry; return dx * dx + dy * dy < 0.6; };
  const enPunta = (S, R0, desde) => {
    const a = area(S), x = a.x + R0.punta[0], y = a.y + R0.punta[1];
    const sp = iconoRel(S, R0, desde ? desde.x : x, desde ? desde.y : y + 6).setDepth(y + 8);
    objs(S).push(sp);
    const llega = () => {
      const f = S.add.ellipse(x, y, 40, 14, 0x9dffb6, 0.8).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: f, scale: 2.2, alpha: 0, duration: 520, onComplete: () => f.destroy() });
      S.tweens.add({ targets: sp, y: y + 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    };
    if (desde) S.tweens.add({ targets: sp, x, y: y + 6, duration: 520, ease: 'Quad.easeInOut', onComplete: () => { son('runas', 0.7) || son('magic_cast', 0.6, { rate: 1.2 }); S.cameras.main.shake(140, 0.004); llega(); } });
    else llega();
    return sp;
  };
  const colocar = S => {
    const e = E(), s = st(S); if (!s || S._bvColocando || S._ckEscena) return;
    S._bvColocando = true;
    const fin = () => {
      S._bvColocando = false;
      const b = bv(s); if (b.puzzle) return;
      b.puzzle = true; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
      S.time.delayedCall(60, () => despierta(S));
    };
    if (!e || !e.correr) { RELIQ.forEach(R0 => enPunta(S, R0)); fin(); return; }
    e.correr(S, async () => {
      await e.camara(S, CIRC.x, CIRC.y - 10, 900);
      for (const R0 of RELIQ) { enPunta(S, R0, { x: S.player.x, y: S.player.y - 40 }); await e.esperar(620); if (S._bvMarca) S._bvMarca.dib((S._bvMarca.n || 0) + 1); }
      await e.esperar(400);
      if (S._bvMarca) S._bvMarca.lleno = 1;
      son('ck_rayo', 0.5) || son('thunder_strike', 0.4); S.cameras.main.shake(900, 0.008); S.cameras.main.flash(220, 140, 255, 170);
      // el círculo lo empuja afuera (abajo), así el Nigromante sale en el medio y no encima suyo
      const a = area(S), p0 = pies(S), dest = { x: a.x + CIRC.x, y: a.y + CIRC.y + 100 }, q = { t: 0 };
      if (S.player.body && S.placePlayerFeetAt) S.tweens.add({ targets: q, t: 1, duration: 420, ease: 'Quad.easeOut', onUpdate: () => S.placePlayerFeetAt(p0.x + (dest.x - p0.x) * q.t, p0.y + (dest.y - p0.y) * q.t) });
      await e.esperar(1100);
    }).then(fin).catch(fin);
  };

  // el rayo verde: una línea quebrada desde arriba hasta el centro
  const rayo = (S, x, y) => {
    const cam = S.cameras.main.worldView, g = S.add.graphics().setDepth(30500).setBlendMode(Phaser.BlendModes.ADD);
    let px = x + R(-30, 30), py = cam.y - 10; const pts = [[px, py]];
    while (py < y - 12) { py += R(22, 44); px += R(-22, 22); pts.push([px, Math.min(py, y)]); }
    pts.push([x, y]);
    [[9, 0x2bff6a, 0.35], [4, 0x8dffb0, 0.9], [2, 0xffffff, 1]].forEach(([w, c, al]) => { g.lineStyle(w, c, al); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => g.lineTo(q[0], q[1])); g.strokePath(); });
    const f = S.add.ellipse(x, y, 90, 30, 0x7dffa0, 0.7).setDepth(y + 5).setBlendMode(Phaser.BlendModes.ADD);
    S.tweens.add({ targets: [g, f], alpha: 0, duration: 320, onComplete: () => { g.destroy(); f.destroy(); } });
    son('ck_rayo', 0.8, { minGap: 60 }) || son('thunder_strike', 0.7, { minGap: 60 });
    S.cameras.main.shake(260, 0.01); S.cameras.main.flash(120, 120, 255, 160);
  };
  // el cuadro de impacto: blanco con su silueta negra, después negro con la silueta blanca, y todo quieto un instante
  const impacto = async (S, en) => {
    const cam = S.cameras.main, w = cam.width, h = cam.height;
    const fondo = S.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0xffffff).setScrollFactor(0).setDepth(40000);
    const sil = en && en.active ? S.add.sprite(en.x, en.y, en.texture.key, en.frame.name).setOrigin(en.originX, en.originY).setScale(en.scaleX * 1.25, en.scaleY * 1.25).setFlipX(en.flipX).setTintFill(0x000000).setDepth(40001) : null;
    son('ck_f_impacto', 1) || son('ck_explosion', 0.8);
    S.tweens.timeScale = 0.05; S.anims.globalTimeScale = 0.05;
    await E().esperar(130);
    fondo.setFillStyle(0x000000); if (sil) sil.setTintFill(0xffffff);
    await E().esperar(110);
    fondo.destroy(); if (sil) sil.destroy();
    S.tweens.timeScale = 1; S.anims.globalTimeScale = 1;
    cam.shake(600, 0.014);
  };
  const ANILLO = [[-150, -20, 'skeleton'], [150, -20, 'skeleton'], [-110, 60, 'skeleton_armored'], [110, 60, 'skeleton_armored'], [-60, -70, 'skeleton_archer'], [60, -70, 'skeleton_archer']];
  const esqueletos = S => {
    const a = area(S); if (!a) return;
    ANILLO.forEach(([dx, dy, t], i) => S.time.delayedCall(i * 180, () => { if (zona(S) === ZCM) levantar(S, a.x + CENTRO.x + dx, a.y + CENTRO.y + dy, t, en => { en._bvCem = true; }); }));
  };
  const nigromante = S => {
    const a = area(S); if (!a) return null;
    const en = S.spawnEnemy(a.x + CENTRO.x, a.y + CENTRO.y - 40, 'necromancer');
    if (en) { en.zone = ZCM; en._bvCem = true; }
    return en;
  };
  // la voz al llegar (una vez)
  const llegada = S => {
    const e = E(), s = st(S), b = bv(s); if (!e || b.voz1) return;
    b.voz1 = true; S.saveStory && S.saveStory();
    e.correr(S, async () => {
      await e.camara(S, CENTRO.x, CENTRO.y - 40, 1200);
      son('ck_fantasma_susurro', 0.8);
      await e.dialogo(S, VOZ, [
        'Llegaste hasta acá… El sepulturero no te alcanzó, ¿no? Siempre fue lento. Incluso vivo.',
        leyoDiario(s) ? 'Y leíste mi diario. Qué maleducado. Entonces ya sabés que no podés tocarme: estoy del otro lado del círculo.'
          : 'No podés tocarme. Estoy del otro lado del círculo, donde los vivos no llegan.',
        '¿Buscás las reliquias de los reyes? Están bajo tierra, con la chusma. Rompé tumbas si querés… los de abajo no duermen tranquilos.',
        'Andate a tu casa, soldadito.'
      ], null);
    });
  };
  // las cuatro inclinadas: el Nigromante sale del círculo
  const despierta = S => {
    const e = E(), a = area(S); if (!e || !a || S._bvDespierta) return;
    S._bvDespierta = true;
    let boss = null;
    e.correr(S, async () => {
      await e.camara(S, CENTRO.x, CENTRO.y - 40, 900);
      await e.dialogo(S, VOZ, ['¡No… NO! ¿Qué hiciste? ¡Los reyes me están empujando de vuelta!', '¡Me arrancás del otro lado! ¡Me vas a pagar cada año que me costó cruzar!'], null);
      quitarMarca(S); apagar(S);
      for (let i = 0; i < 3; i++) { rayo(S, a.x + CENTRO.x + R(-20, 20), a.y + CENTRO.y); await e.esperar(i < 2 ? 380 : 200); }
      boss = nigromante(S);
      if (boss) { boss.setVelocity && boss.setVelocity(0, 0); boss.state = 'rising'; }       // ('rising': la IA lo deja quieto mientras habla)
      await impacto(S, boss);
      son('necro_cast', 0.9, { rate: 0.6 });
      await e.esperar(700);
      await e.dialogo(S, 'Varek, el Nigromante', ['¿Sabés cuánto me costó cruzar? Años de niebla. Un pueblo entero.',
        'Si no puedo quedarme del otro lado… ¡que el otro lado venga acá! ¡LEVÁNTENSE, MAJESTADES!'], 'necromancer_idle');
      esqueletos(S);
      S.cameras.main.shake(700, 0.007);
      await e.esperar(900);
    }).then(() => { S._bvDespierta = false; if (vivo(boss)) { boss.state = 'idle'; S.alertEnemy && S.alertEnemy(boss); } })
      .catch(() => { S._bvDespierta = false; });
  };
  // si se fue a mitad de la pelea: al volver, el Nigromante ya está afuera
  const revancha = S => {
    const a = area(S); if (!a || S._bvDespierta) return;
    if (S.enemies && S.enemies.getChildren().some(x => vivo(x) && x.type === 'necromancer')) return;
    rayo(S, a.x + CENTRO.x, a.y + CENTRO.y);
    const boss = nigromante(S);
    S.time.delayedCall(500, () => { if (vivo(boss) && S.alertEnemy) S.alertEnemy(boss); });
    S.time.delayedCall(300, () => esqueletos(S));
    S.createFloatingText(a.x + CENTRO.x, a.y + CENTRO.y - 70, '¡Volviste! Mejor: así termino lo que empezaste.', 0xa7f3d0);
  };
  const sinBestias = S => {
    (S.enemies ? S.enemies.getChildren() : []).forEach(en => { if (vivo(en) && !en._bvCem && en.type !== 'necromancer') { try { if (en.hpBar) en.hpBar.destroy(); en.destroy(); } catch (er) {} } });
  };

  // ================================================================== el cristal verde (nota 33)
  const cristalSprites = S => {
    const s = st(S), c = s && bv(s).cristal, a = area(S); if (!c || !a || zona(S) !== c.z || S._bvCristal) return;
    const x = a.x + c.x, y = a.y + c.y;
    const halo = S.add.ellipse(x, y + 2, 34, 12, 0x3dff7a, 0.45).setDepth(y - 2).setBlendMode(Phaser.BlendModes.ADD);
    const cr = S.add.star(x, y - 12, 4, 4, 10, 0x4ade80).setStrokeStyle(2, 0x14532d).setDepth(y + 1);
    const luz = S.add.circle(x, y - 12, 16, 0x86efac, 0.25).setDepth(y).setBlendMode(Phaser.BlendModes.ADD);
    S.tweens.add({ targets: [cr, luz], y: y - 18, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    S.tweens.add({ targets: cr, angle: 360, duration: 2600, repeat: -1 });
    S.tweens.add({ targets: [halo, luz], alpha: { from: 0.2, to: 0.6 }, duration: 700, yoyo: true, repeat: -1 });
    const ev = S.time.addEvent({ delay: 500, loop: true, callback: () => {
      if (!cr.active) return;
      const d = S.add.star(x + R(-12, 12), y - 12 + R(-10, 6), 4, 1, 3, 0xd9ffe4).setDepth(y + 2).setBlendMode(Phaser.BlendModes.ADD);
      S.tweens.add({ targets: d, y: d.y - 16, alpha: 0, angle: 90, duration: 700, onComplete: () => d.destroy() });
    } });
    S._bvCristal = { x, y, cr, halo, luz, ev };
  };
  const quitarCristal = S => { const k = S._bvCristal; if (!k) return; try { k.ev.remove(); [k.cr, k.halo, k.luz].forEach(o => o.destroy()); } catch (e) {} S._bvCristal = null; };
  const juntar = (S, lejos) => {
    const s = st(S); if (!s) return;
    const b = bv(s); if (!b.cristal) return;
    const k = S._bvCristal;
    delete b.cristal;
    const c = fl(s).cristales || (fl(s).cristales = {}); c.verde = true;
    if (k && k.cr && k.cr.active && S.player) {
      const cr = k.cr; S.tweens.killTweensOf(cr);
      try { k.ev.remove(); k.halo.destroy(); k.luz.destroy(); } catch (e) {}
      S.tweens.add({ targets: cr, x: S.player.x, y: S.player.y - 20, scale: 0.4, alpha: 0, duration: 420, onComplete: () => cr.destroy() });
      S._bvCristal = null;
    } else quitarCristal(S);
    if (S.player) S.createFloatingText(S.player.x, S.player.y - 60, lejos ? '◆ CRISTAL VERDE ◆ (lo juntaste al irte)' : '◆ CRISTAL VERDE ◆', 0x4ade80);
    son('quest_done', 0.7) || son('chest_open', 0.7);
    S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
  };
  window.CK_CRISTAL_VERDE = {
    /** Lo llama ck_libro_sello.js al sellar al Nigromante: el cristal queda en (x, y) del mundo. */
    soltar: (S, x, y) => {
      const s = st(S), a = area(S); if (!s || !a) return false;
      bv(s).cristal = { z: zona(S), x: Math.round(x - a.x), y: Math.round(y - a.y) };
      S.saveStory && S.saveStory();
      S.time.delayedCall(900, () => {
        cristalSprites(S);
        const k = S._bvCristal; if (!k) return;
        k.cr.y -= 60; S.tweens.add({ targets: k.cr, y: k.y - 12, duration: 500, ease: 'Bounce.easeOut' });
        S.createFloatingText(k.x, k.y - 44, 'El cristal verde cayó al piso', 0x86efac);
      });
      return true;
    },
    juntar: S => juntar(S)
  };

  // ================================================================== enganches
  const ar0 = P.onAreaShown;
  P.onAreaShown = function () {
    // el diario va delante del altar (ck_lecturas.js busca un rincón con ck_notas.js, que en la capilla no tiene lugares)
    try {
      const s0 = st(this);
      if (s0 && zona(this) === ZCP) { const f = fl(s0), pos = (f.libros_pos = f.libros_pos || {}); if (!pos[DIARIO]) pos[DIARIO] = { x: 240, y: 168 }; }
    } catch (e) {}
    const r = ar0 ? ar0.apply(this, arguments) : undefined;
    try {
      const S = this; limpiarObjs(S); S._bvMarca = null; S._bvLuces = {}; S._bvCem = null; S._bvCristal = null;
      S._bvGuardia = null; S._bvGran = false; S._bvDespierta = false; cartel(S, null);
      S._bvTumbas = null; S._bvSuelo = {}; S._bvColocando = false;                        // (v3)
      const s = st(S); if (!s) return r;
      const z = zona(S), b = bv(s);
      if (z === ZCM) { registrarTumbas(); S.time.delayedCall(500, () => { if (zona(S) === ZCM) marcarTumbas(S); }); }   // (v3)
      if ((z === ZR || z === ZCM || z === ZCP) && (paso(s) === 5 || paso(s) === 6 || b.cristal)) S.time.delayedCall(250, () => S.updateObjective && S.updateObjective());
      // el cristal que quedó en otro lugar: se lo llevó al irse
      if (b.cristal && b.cristal.z !== z) S.time.delayedCall(900, () => juntar(S, true));
      if (b.cristal && b.cristal.z === z) S.time.delayedCall(300, () => cristalSprites(S));
      if (z === ZR && paso(s) === 5 && b.libro && !fl(s).key) S.time.delayedCall(800, () => { if (zona(S) === ZR && !S._ckEscena) gran(S); });
      if (z === ZCM && paso(s) === 6 && !fl(s).boss_necromancer) {
        [100, 600, 1500].forEach(t => S.time.delayedCall(t, () => { if (zona(S) === ZCM && !bv(s).puzzle) sinBestias(S); }));
        if (!b.puzzle) S.time.delayedCall(400, () => {
          if (zona(S) !== ZCM) return; marca(S);
          // (v3) las reliquias: qué tumba tiene cada una, las que quedaron en el piso y las estatuas de las ya halladas
          asignar(S);
          RELIQ.forEach(R0 => { if (b.suelo && b.suelo[R0.id]) ponerSuelo(S, R0); if (b.halladas && b.halladas[R0.id]) prender(S, REYES[R0.rey]); });
          if (S._bvMarca) S._bvMarca.dib(halladas(s));
          if (!b.voz1) S.time.delayedCall(700, () => zona(S) === ZCM && llegada(S));
        });
        else S.time.delayedCall(900, () => { if (zona(S) !== ZCM) return; RELIQ.forEach(R0 => enPunta(S, R0)); revancha(S); });
      }
    } catch (e) { console.warn('[brumavieja historia]', e); }
    return r;
  };
  // las viejas: la capilla de Brumavieja ya no larga al Nigromante (ni habla su voz) en este paso
  const us0 = P.updateStory;
  P.updateStory = function () {
    try {
      const s = st(this);
      if (s && paso(s) === 6 && zona(this) === ZR && !fl(s).boss_necromancer) { this._bossSpawned = true; this._ckVarek = true; }
    } catch (e) {}
    return us0.apply(this, arguments);
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      const S = this, s = st(S); if (!s || !S.player || !S.currentInterior) return r;
      if (S._bvMarca) brillo(S);                                                          // (v3) el círculo titila
      const now = S.time.now; if (now - (S._bvT || 0) < 90) return r; S._bvT = now;
      const z = zona(S), b = bv(s), libre = !S.dialogOpen && !S._overlay && !S._ckEscena && !S.isDead;
      let txt = null;
      // Brumavieja, paso 5
      if (z === ZR && paso(s) === 5) {
        const a = area(S), c = CAP(), p = pies(S), d = Math.hypot(p.x - (a.x + c.x), p.y - (a.y + c.y));
        if (!b.capilla && !S._bvGuardia && libre && d < 150) guardia(S);
        if (!b.capilla && S._bvGuardia && now - S._bvGuardia.t0 > 1500 && !S.enemies.getChildren().some(e => vivo(e) && e._bvGuardia)) { S._bvGuardia.listo = true; puertaCede(S); }
        if (b.capilla && libre && d < 40) txt = 'T · Entrar a la capilla';
      }
      // la capilla: el diario leído
      if (z === ZCP && paso(s) === 5 && !b.libro && leyoDiario(s)) {
        b.libro = true; S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
        S.time.delayedCall(600, () => S.player && S.createFloatingText(S.player.x, S.player.y - 56, 'Varek se fue al CEMENTERIO REAL', 0xd9f99d));
      }
      // el Cementerio Real, paso 6 ((v3) las tumbas y las reliquias; las estatuas ya no se tocan)
      if (z === ZCM) {
        (S._bvTumbas || []).forEach(t => { if (t.roto && !t._bvHecha) { t._bvHecha = true; try { rompioTumba(S, t); } catch (er) { console.warn('[brumavieja historia] tumba', er); } } });
        if (paso(s) === 6 && !b.puzzle) {
          aliento(S);
          const o = libre && sueloCerca(S, 44);
          if (o) { if (Math.hypot(pies(S).x - o.x, (pies(S).y - o.y) * 1.4) < 18) juntarReliquia(S, o); else txt = 'T · Juntar ' + o.R0.n; }
          if (libre && halladas(s) >= 4 && enCirculo(S)) colocar(S);
        }
      }
      // el cristal en el piso
      const k = S._bvCristal;
      if (k && b.cristal && libre) {
        const p = pies(S), d = Math.hypot(p.x - k.x, (p.y - k.y) * 1.4);
        if (d < 18) juntar(S); else if (d < 44) txt = 'T · Juntar el cristal verde';
      }
      cartel(S, txt);
    } catch (e) { if (!P._bvErr) { P._bvErr = 1; console.warn('[brumavieja historia]', e); } }
    return r;
  };
  const in0 = P.interact;
  P.interact = function () {
    try {
      const S = this, s = st(S);
      if (s && !S.dialogOpen && !S._overlay && !S._ckEscena && S.currentInterior) {
        const z = zona(S), b = bv(s);
        if (S._bvCristal && b.cristal) { const p = pies(S), k = S._bvCristal; if (Math.hypot(p.x - k.x, (p.y - k.y) * 1.4) < 44) { juntar(S); return; } }
        if (z === ZR && paso(s) === 5 && b.capilla) {
          const a = area(S), c = CAP(), p = pies(S);
          if (Math.hypot(p.x - (a.x + c.x), p.y - (a.y + c.y)) < 40 && S.ckEntrar) { cartel(S, null); S.ckEntrar(ZB.CAPILLA, ZB.LLEGA.capilla); return; }
        }
        if (z === ZCM && paso(s) === 6 && !b.puzzle) { const o = sueloCerca(S, 44); if (o) { juntarReliquia(S, o); return; } }   // (v3)
      }
    } catch (e) { console.warn('[brumavieja historia]', e); }
    return in0.apply(this, arguments);
  };
  // el portón del Cementerio Real, con candado hasta tener la llave del sepulturero (paso 5)
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    try {
      const s = st(this);
      if (nombre === 'zb_cementerio' && s && paso(s) === 5 && !fl(s).key && !LIBRE() && !this._doorTransition) {
        if (!this._bvTranca || this.time.now - this._bvTranca > 2200) {
          this._bvTranca = this.time.now;
          this.createFloatingText(this.player.x, this.player.y - 50, 'El portón del Cementerio Real tiene candado. La llave la lleva el sepulturero', 0xfca5a5);
          son('door_locked', 0.6);
        }
        if (this.player.body) this.player.body.reset(this.player.x - 16, this.player.y);
        return;
      }
    } catch (e) {}
    return sw0.apply(this, arguments);
  };
  // la llave que suelta el Gran Esqueleto es la del portón del Cementerio Real
  const tx0 = P.createFloatingText;
  P.createFloatingText = function (x, y, txt) {
    if (txt === '🗝 LLAVE DE LA CAPILLA' && this.story) arguments[2] = '🗝 LLAVE DEL CEMENTERIO REAL';
    return tx0.apply(this, arguments);
  };
  // el objetivo, según por dónde vaya
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0.apply(this, arguments);
    try {
      const s = st(this), t = document.querySelector('#ck-objective .ck-obj-text'); if (!s || !t) return r;
      const b = bv(s), z = zona(this);
      let o = null;
      if (paso(s) === 5) o = !b.capilla ? 'Brumavieja: abrite paso entre los muertos hasta la capilla (arriba, al centro)'
        : !b.libro ? 'Entrá a la capilla y buscá adónde se fue el encapuchado'
          : 'El sepulturero tiene la llave del Cementerio Real: vencé al Gran Esqueleto (frente a la capilla)';
      else if (paso(s) === 6 && !fl(s).boss_necromancer) o = z !== ZCM ? QUESTS[6].goal
        : !b.puzzle ? (halladas(s) < 4 ? 'Cementerio Real: rompé las tumbas y encontrá las cuatro reliquias de los reyes (' + halladas(s) + ' de 4). Donde hay una, la tierra respira verde'
          : 'Llevá las cuatro reliquias al círculo grabado del centro')
          : 'Derrotá al Nigromante y sellalo con el Libro del Sello';
      else if (b.cristal) o = 'Juntá el cristal verde que soltó el Nigromante';
      if (o) t.textContent = o;
    } catch (e) {}
    return r;
  };
  // la pista grabada en el borde del círculo (para quien no leyó el diario) y el nombre de cada rey
  const LC = INTERIOR_LAYOUTS['ed_' + ZB.CEMENTERIO];
  if (LC) INTERIOR_LAYOUTS['ed_' + ZB.CEMENTERIO] = function (kit) {
    const r = LC.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.main;
      if (a) {
        a.talkers = a.talkers || [];
        a.talkers.push({ x: CENTRO.x, y: CENTRO.y + 44, r: 30, talkAt: 0, lines: ['Grabado en el borde del círculo: «Corona, anillo, espada y sonajero: lo que los reyes se llevaron a la tierra, el círculo lo reclama»'] });
      }
    } catch (e) { console.warn('[brumavieja historia]', e); }
    return r;
  };

  window.CK_BRUMAVIEJA_HIST = { DIARIO, REYES, CENTRO, GUARDIA, guardia, gran, despierta, revancha, juntar: S => juntar(S), tocar,
    RELIQ, LADOS, CIRC, asignar, colocar, rompioTumba, marcarTumbas,
    /** Para las pruebas: salta partes del camino. */
    saltar: (S, que) => {
      const s = st(S); if (!s) return;
      const b = bv(s);
      if (que === 'capilla') b.capilla = true;
      if (que === 'libro') { b.capilla = true; b.libro = true; (fl(s).lecturas = fl(s).lecturas || {})[DIARIO] = Date.now(); }
      if (que === 'puzzle') { b.voz1 = true; b.puzzle = true; }
      if (que === 'reliquias') { b.voz1 = true; b.halladas = { corona: 1, anillo: 1, espada: 1, sonajero: 1 }; b.suelo = {}; }   // (v3) las cuatro en la mano
      S.saveStory && S.saveStory();
    } };
})();
