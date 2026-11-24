'use strict';
/* Las criaturas del reino corrompido (15/11, pedido del dueño: "distribuye las criaturas cuando el mundo se corrompa siendo la
   mazmorra final el enfrentamiento final contra el warlock y el rey demonio final, 1 jefe por mapa en el reino corrompido").
   - Las criaturas son del pack del dueño "Tiny RPG Character Asset Pack 02" (hojas de 100 px con sombra, en
     ck_reino_criaturas_arte.js). El Warlock, el Demon_E y el Flame Golem quedan para la Mazmorra del Sello.
   - Cada uno de los seis lugares del Capítulo 3 (ck_capitulo3.js, "el reino en llamas") tiene su mezcla de criaturas, de
     menos a más: el Claro del Monolito (lo que sale del portal), el Camino al Castillo (la jauría), la Aldea, los Campos,
     San Roque y el Norte del Roble (los caballeros negros que marchan al castillo).
   - Y un JEFE por lugar: cuando no queda ninguna otra criatura, la tierra tiembla y el jefe sale de una grieta cerca del
     héroe, con su presentación y su música. Hasta vencerlo, el lugar no queda limpio. Cada jefe tiene su golpe especial:
       ORBATH, el Ojo del Portal (Claro) ......... rayos y una corona de rayos alrededor
       FAUCES, el Sabueso Mayor (Camino) ......... la embestida
       SERAVEL, la Segadora (Aldea) .............. se esfuma y aparece a tus espaldas
       TAURAX, el Minotauro de Brasa (Campos) .... la embestida, más pesada
       GROMM, el Martillo del Abismo (San Roque) . el martillazo que levanta una onda de fuego
       MORVANE, el Caballero Negro (Norte) ....... clava la espada y abre pilares de fuego hasta vos
   (23/11, v2, notas del dueño: "sale el segundo boss" en el Camino, "sale el tercer boss acá" en la Aldea y "sale el último
   boss" en los Campos, con el lugar marcado): en esos tres el jefe sale en ese lugar (con la cámara mostrándolo), no al
   lado del héroe. El orden del reino ahora es San Roque, Camino, Aldea y Campos (ck_capitulo3.js v8); Orbath y Morvane ya
   no son jefes de un lugar del reino (Morvane, el del caballo, espera en el Salón del Trono: ck_capitulo3_castillo.js).
   Cómo se engancha: ck_capitulo3.js pregunta window.CK_C3_CASILLAS (qué criatura va en cada casilla, y la del jefe) y
   window.CK_C3_HUD_DEM (el cartel de arriba). Borrar las dos líneas de index.html vuelve a los diablillos de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof ENEMY_TYPES === 'undefined') return;
  const P = MainGameScene.prototype;
  const ART = window.CK_REINO_ARTE || {};
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = a => a[Math.floor(Math.random() * a.length)];
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const ADD = () => Phaser.BlendModes.ADD;
  const pies = S => { const b = S.player && S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y }; };
  const piesDe = e => (e.body ? { x: e.body.center.x, y: e.body.bottom } : { x: e.x, y: e.y });
  const C3 = () => window.CK_CAPITULO3;

  // ================================================================== 1. LAS CRIATURAS
  // a: hoja del arte; los números de cuadros salen del arte (cada hoja es una tira de cuadros de 100 px)
  const BICHOS = {
    demonio_lava:       { a: 'lava', name: 'Babosa de lava', hp: 3, speed: 60, dmg: 1, reach: 48, cd: 1600, hitAt: 250, xp: 14, coins: 3, scale: 1.2, sfx: ['slime_hit', 'slime_hit', 'slime_death', 0.8] },
    demonio_murcielago: { a: 'murcielago', name: 'Murciélago infernal', hp: 2, speed: 135, dmg: 1, reach: 40, cd: 1200, hitAt: 230, xp: 12, coins: 2, scale: 1.15, sfx: ['bat_screech', 'bat_screech', 'bat_screech', 0.75] },
    demonio_sabueso:    { a: 'sabueso', name: 'Sabueso infernal', hp: 3, speed: 140, dmg: 1, reach: 46, cd: 1300, hitAt: 300, xp: 18, coins: 3, scale: 1.2, sfx: ['ck_f_mordisco', 'beast_hurt', 'beast_death', 1.2] },
    demonio_garra:      { a: 'garra', name: 'Demonio de garra', hp: 3, speed: 105, dmg: 1, reach: 46, cd: 1300, hitAt: 280, xp: 16, coins: 3, scale: 1.2, sfx: ['ck_demonio_chillido', 'beast_hurt', 'ck_demonio_muere', 1.2] },
    demonio_arquero:    { a: 'arquero', name: 'Demonio arquero', hp: 3, speed: 85, dmg: 1, reach: 44, cd: 2200, hitAt: 375, xp: 18, coins: 4, scale: 1.2, sfx: ['bow_shot', 'beast_hurt', 'ck_demonio_muere', 1.15],
                          meleeToo: true, rangedAnim: 'attack1', rangedHitAt: 430, ranged: { key: 'ckrc_flecha', frames: 1, speed: 230, range: 220 } },
    demonio_tridente:   { a: 'tridente', name: 'Demonio del tridente', hp: 4, speed: 95, dmg: 1, reach: 56, cd: 1500, hitAt: 250, xp: 20, coins: 4, scale: 1.2, sfx: ['sword_swing2', 'beast_hurt', 'ck_demonio_muere', 1.05] },
    demonio_sangre:     { a: 'sangre', name: 'Engendro de sangre', hp: 5, speed: 80, dmg: 2, reach: 50, cd: 1800, hitAt: 320, xp: 26, coins: 5, scale: 1.25, sfx: ['beast_growl', 'slime_hit', 'slime_death', 0.7] },
    demonio_coagulo:    { a: 'coagulo', name: 'Coágulo volador', hp: 2, speed: 120, dmg: 1, reach: 42, cd: 1300, hitAt: 320, xp: 14, coins: 2, scale: 1.2, sfx: ['bat_screech', 'slime_hit', 'slime_death', 0.6] },
    demonio_fuego:      { a: 'fuego', name: 'Fuego fatuo', hp: 3, speed: 90, dmg: 1, reach: 44, cd: 2000, hitAt: 230, xp: 20, coins: 4, scale: 1.2, sfx: ['fire_cast', 'fire_hit', 'necro_death', 1.3],
                          meleeToo: true, rangedAnim: 'attack2', rangedHitAt: 330, ranged: { key: 'ckrc_rayo', frames: 1, speed: 190, range: 200 } },
    demonio_ojo:        { a: 'ojo', name: 'Ojo vigía', hp: 3, speed: 70, dmg: 1, reach: 42, cd: 2100, hitAt: 400, xp: 20, coins: 4, scale: 1.25, sfx: ['necro_cast', 'slime_hit', 'slime_death', 1.4],
                          meleeToo: true, rangedAnim: 'attack3', rangedHitAt: 200, ranged: { key: 'ckrc_rayo', frames: 1, speed: 170, range: 210 } },
    demonio_bruja:      { a: 'bruja', name: 'Demonia', hp: 4, speed: 100, dmg: 1, reach: 50, cd: 1400, hitAt: 320, xp: 22, coins: 5, scale: 1.2, sfx: ['sword_swing1', 'wizard_hurt', 'wizard_death', 1.15] },
    demonio_lancero:    { a: 'lancero', name: 'Caballero negro', hp: 6, speed: 75, dmg: 2, reach: 60, cd: 2300, hitAt: 650, xp: 32, coins: 7, scale: 1.2, sfx: ['ck_lanzas', 'knight_hurt', 'knight_death', 0.85] },
    demonio_escudo:     { a: 'escudo', name: 'Caballero del escudo', hp: 6, speed: 70, dmg: 1, reach: 48, cd: 2000, hitAt: 320, xp: 30, coins: 7, scale: 1.2, block: 0.35, sfx: ['ck_hachazo', 'knight_hurt', 'knight_death', 0.8],
                          meleeToo: true, rangedAnim: 'attack3', rangedHitAt: 380, ranged: { key: 'ckrc_bala', frames: 1, speed: 210, range: 200 } }
  };
  // los jefes: uno por lugar (esp: su golpe especial; ver 4)
  const JEFES = {
    demonio_j_ojo:       { a: 'ojo', name: 'Orbath, el Ojo del Portal', hp: 26, speed: 55, dmg: 1, reach: 60, cd: 1700, hitAt: 400, xp: 160, coins: 50, scale: 2.6, boss: true, esp: 'corona',
                           meleeToo: true, rangedAnim: 'attack3', rangedHitAt: 200, ranged: { key: 'ckrc_rayo', frames: 1, speed: 200, range: 300 },
                           summon: { type: 'demonio_murcielago', every: 10000, max: 3 }, sfx: ['necro_cast', 'slime_hit', 'ck_demonio_muere', 0.7] },
    demonio_j_sabueso:   { a: 'sabueso', name: 'Fauces, el Sabueso Mayor', hp: 28, speed: 120, dmg: 2, reach: 64, cd: 1500, hitAt: 300, xp: 180, coins: 55, scale: 2.1, boss: true, esp: 'embestida',
                           summon: { type: 'demonio_sabueso', every: 12000, max: 2 }, sfx: ['ck_f_mordisco', 'beast_hurt', 'beast_death', 0.7] },
    demonio_j_segadora:  { a: 'segadora', name: 'Seravel, la Segadora', hp: 30, speed: 95, dmg: 2, reach: 70, cd: 1700, hitAt: 400, xp: 200, coins: 60, scale: 1.75, boss: true, esp: 'parpadeo',
                           summon: { type: 'demonio_bruja', every: 13000, max: 2 }, sfx: ['sword_swing2', 'wizard_hurt', 'ck_demonio_muere', 0.9] },
    demonio_j_minotauro: { a: 'minotauro', name: 'Taurax, el Minotauro de Brasa', hp: 36, speed: 80, dmg: 2, reach: 70, cd: 1900, hitAt: 350, xp: 220, coins: 65, scale: 1.85, boss: true, esp: 'embestida',
                           summon: { type: 'demonio_lava', every: 13000, max: 2 }, sfx: ['ck_hachazo', 'beast_hurt', 'beast_death', 0.6] },
    demonio_j_martillo:  { a: 'martillo', name: 'Gromm, el Martillo del Abismo', hp: 40, speed: 70, dmg: 2, reach: 72, cd: 2100, hitAt: 500, xp: 240, coins: 70, scale: 1.85, boss: true, esp: 'onda',
                           summon: { type: 'demonio_fuego', every: 13000, max: 2 }, sfx: ['ck_demonio_rugido', 'beast_hurt', 'ck_demonio_muere', 0.75] },
    demonio_j_caballero: { a: 'caballero', name: 'Morvane, el Caballero Negro', hp: 46, speed: 70, dmg: 2, reach: 74, cd: 2000, hitAt: 400, xp: 280, coins: 80, scale: 1.55, boss: true, esp: 'pilares',
                           summon: { type: 'demonio_lancero', every: 14000, max: 2 }, sfx: ['sword_swing2', 'knight_hurt', 'knight_death', 0.7] }
  };
  const ANIMS = ['idle', 'walk', 'attack1', 'attack2', 'attack3', 'hurt', 'death'];
  const cuadros = a => { const fr = {}; ANIMS.forEach(an => { if (ART._cuadros && ART._cuadros[a] && ART._cuadros[a][an]) fr[an] = ART._cuadros[a][an]; }); return fr; };
  window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
  const registrar = (id, d) => {
    if (ENEMY_TYPES[id]) return;
    const fr = cuadros(d.a); if (!fr.idle || !fr.walk || !fr.attack1 || !fr.death) return;
    Object.keys(fr).forEach(an => { window.GAME_ASSETS_BASE64[id + '_' + an] = ART[d.a + '_' + an]; });
    const t = Object.assign({}, d, { frames: fr }); delete t.a; delete t.esp;
    ENEMY_TYPES[id] = t;
  };
  Object.keys(BICHOS).forEach(id => registrar(id, BICHOS[id]));
  Object.keys(JEFES).forEach(id => registrar(id, JEFES[id]));
  const hay = t => !!ENEMY_TYPES[t];

  // ================================================================== 2. QUÉ VA EN CADA LUGAR
  // m / b: las sueltas chicas y grandes del lugar (las 'm' y 'b' de ck_capitulo3.js); g: las que arrinconan a los vecinos;
  // jefe y dónde sale si no encuentra lugar cerca del héroe (punto, en píxeles del área)
  const LUGAR = {
    'ed_bosque_de_la_frontera.main': { jefe: 'demonio_j_ojo', punto: [300, 300], de: 'del Claro del Monolito',
      m: ['demonio_lava', 'demonio_murcielago', 'demonio_menor', 'demonio_lava', 'demonio_murcielago'], b: ['demonio_bruto'], g: [] },
    'ed_camino_al_castillo.main': { jefe: 'demonio_j_sabueso', punto: [1275, 196], fijo: true, de: 'del Camino al Castillo',
      m: ['demonio_sabueso', 'demonio_garra', 'demonio_sabueso', 'demonio_murcielago', 'demonio_garra', 'demonio_sabueso'], b: ['demonio_bruto'], g: [] },
    village: { jefe: 'demonio_j_segadora', punto: [292, 326], fijo: true, de: 'de la Aldea',
      m: ['demonio_arquero', 'demonio_menor'], b: ['demonio_sangre', 'demonio_bruto'],
      g: ['demonio_garra', 'demonio_menor', 'demonio_arquero', 'demonio_bruja', 'demonio_garra', 'demonio_menor', 'demonio_bruja', 'demonio_arquero', 'demonio_garra', 'demonio_bruja'] },
    'ed_campos_del_roble.main': { jefe: 'demonio_j_minotauro', punto: [610, 150], fijo: true, de: 'de los Campos',
      m: ['demonio_coagulo', 'demonio_lava'], b: ['demonio_sangre'],
      g: ['demonio_lava', 'demonio_tridente', 'demonio_coagulo', 'demonio_sangre', 'demonio_tridente', 'demonio_lava', 'demonio_coagulo', 'demonio_tridente', 'demonio_sangre', 'demonio_lava'] },
    'ed_san_roque.main': { jefe: 'demonio_j_martillo', punto: [760, 450], de: 'de San Roque',
      m: ['demonio_fuego', 'demonio_ojo'], b: ['demonio_bruto', 'demonio_sangre'],
      g: ['demonio_fuego', 'demonio_tridente', 'demonio_ojo', 'demonio_bruja', 'demonio_fuego', 'demonio_tridente', 'demonio_ojo', 'demonio_fuego', 'demonio_bruja', 'demonio_tridente'] },
    'ed_norte_del_roble.main': { jefe: 'demonio_j_caballero', punto: [800, 560], de: 'del Norte del Roble',
      m: ['demonio_lancero', 'demonio_sabueso'], b: ['demonio_escudo', 'demonio_bruto'],
      g: ['demonio_lancero', 'demonio_escudo', 'demonio_sabueso', 'demonio_lancero', 'demonio_garra', 'demonio_escudo', 'demonio_sabueso', 'demonio_lancero', 'demonio_escudo', 'demonio_garra'] }
  };
  const cache = {};
  window.CK_C3_CASILLAS = (z, out, L) => {
    const Q = LUGAR[z]; if (!Q) return out;
    if (cache[z] && cache[z].n === out.length) return cache[z].lista.map(c => Object.assign({}, c));
    let im = 0, ib = 0;
    const lista = out.map(c => {
      let t = c.t;
      const g = /^g(\d+)([ab])$/.exec(c.k), s = /^s(\d+)$/.exec(c.k);
      if (g && Q.g.length) t = Q.g[(+g[1] * 2 + (g[2] === 'b' ? 1 : 0)) % Q.g.length];
      else if (s) { const q = (L.sueltos || [])[+s[1]]; t = q && q[2] === 'b' ? Q.b[ib++ % Q.b.length] : Q.m[im++ % Q.m.length]; }
      return Object.assign({}, c, { t: hay(t) ? t : c.t });
    });
    if (hay(Q.jefe)) lista.push({ k: 'j0', x: Q.punto[0], y: Q.punto[1], t: Q.jefe, jefe: true });
    cache[z] = { n: out.length, lista };
    return lista.map(c => Object.assign({}, c));
  };
  const nombreCorto = t => (ENEMY_TYPES[t] ? ENEMY_TYPES[t].name.split(',')[0] : 'el jefe').toUpperCase();
  window.CK_C3_HUD_DEM = (S, z, E3, dem) => {
    const Q = LUGAR[z]; if (!Q || !hay(Q.jefe) || E3.m.indexOf('j0') >= 0) return null;
    const otros = dem - 1;
    return otros > 0 ? 'DEMONIOS ' + otros + ' · Y SU JEFE' : '¡JEFE: ' + nombreCorto(Q.jefe) + '!';
  };

  // ================================================================== 3. TEXTURAS QUE SE ARMAN EN EL JUEGO
  // los proyectiles (la flecha y la bala del pack, el rayo dibujado), los pilares de fuego de Morvane y el escudo del caballero
  const IMG = {};
  ['p_flecha', 'p_bala', 'p_pilar', 'escudo_block'].forEach(k => { if (ART[k]) { const im = new Image(); im.src = ART[k]; IMG[k] = im; } });
  const lista = im => im && im.complete && im.naturalWidth > 0;
  const texturas = S => {
    if (S._rcTex) return;
    const tx = S.textures;
    const recorte = (key, im, sx, sy, w, h) => { if (tx.exists(key) || !lista(im)) return false; const t = tx.createCanvas(key, w, h); t.context.drawImage(im, sx, sy, w, h, 0, 0, w, h); t.refresh(); return true; };
    recorte('ckrc_flecha', IMG.p_flecha, 38, 44, 28, 14);
    recorte('ckrc_bala', IMG.p_bala, 44, 44, 16, 14);
    if (!tx.exists('ckrc_rayo')) {
      const t = tx.createCanvas('ckrc_rayo', 26, 10), g = t.context;
      const lg = g.createLinearGradient(0, 0, 26, 0);
      lg.addColorStop(0, 'rgba(255,40,30,0)'); lg.addColorStop(0.5, 'rgba(255,70,40,0.75)'); lg.addColorStop(1, 'rgba(255,230,200,1)');
      g.fillStyle = lg; g.fillRect(0, 3, 26, 4);
      g.fillStyle = 'rgba(255,90,50,0.55)'; g.fillRect(8, 2, 16, 6);
      g.fillStyle = '#fff4e0'; g.fillRect(20, 4, 5, 2);
      t.refresh();
    }
    if (!tx.exists('ckrc_pilar') && lista(IMG.p_pilar)) tx.addSpriteSheet('ckrc_pilar', IMG.p_pilar, { frameWidth: 100, frameHeight: 100 });
    if (tx.exists('ckrc_pilar') && !S.anims.exists('ckrc_pilar')) S.anims.create({ key: 'ckrc_pilar', frames: S.anims.generateFrameNumbers('ckrc_pilar', { start: 0, end: 6 }), frameRate: 12, repeat: 0 });
    if (!tx.exists('demonio_escudo_block') && lista(IMG.escudo_block)) tx.addSpriteSheet('demonio_escudo_block', IMG.escudo_block, { frameWidth: 100, frameHeight: 100 });
    if (tx.exists('demonio_escudo_block') && !S.anims.exists('demonio_escudo_block')) S.anims.create({ key: 'demonio_escudo_block', frames: S.anims.generateFrameNumbers('demonio_escudo_block', { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
    S._rcTex = tx.exists('ckrc_flecha') && tx.exists('ckrc_bala') && tx.exists('ckrc_pilar');
  };

  // ================================================================== 4. LOS GOLPES ESPECIALES DE LOS JEFES
  const chispas = (S, x, y, n, col, alto) => {
    for (let i = 0; i < n; i++) {
      const c = S.add.rectangle(x + R(-10, 10), y + R(-6, 4), R(1, 3), R(1, 3), col || 0xff6020, 1).setDepth(30000).setBlendMode(ADD());
      S.tweens.add({ targets: c, x: c.x + R(-40, 40), y: c.y - R(10, alto || 50), alpha: 0, duration: R(400, 800), onComplete: () => c.destroy() });
    }
  };
  const polvo = (S, x, y, n, col) => {
    for (let i = 0; i < n; i++) {
      const c = S.add.circle(x + R(-14, 14), y + R(-4, 4), R(3, 7), col || 0x5a4a3a, 0.55).setDepth(y + 2);
      S.tweens.add({ targets: c, x: c.x + R(-26, 26), y: c.y - R(4, 18), scale: R(1.6, 2.6), alpha: 0, duration: R(500, 900), onComplete: () => c.destroy() });
    }
  };
  const marca = (S, x, y, r, ms) => {
    const g = S.add.ellipse(x, y, r * 2, r * 1.24).setStrokeStyle(2, 0xff4020, 0.95).setFillStyle(0xff3010, 0.18).setDepth(y - 1);
    S.tweens.add({ targets: g, scaleX: 0.85, scaleY: 0.85, alpha: { from: 0.5, to: 1 }, duration: ms, onComplete: () => g.destroy() });
    return g;
  };
  const libre = (S, e, ms) => S.time.delayedCall(ms, () => { if (!vivo(e)) return; e.isAttacking = false; if (e.state === 'ckrc') e.state = 'chase'; if (S.anims.exists(e.type + '_idle')) e.play(e.type + '_idle', true); });
  const tocar = (S, x, y, rx, ry, dmg) => {
    if (S.isDead || S.isDashing) return false;
    const p = pies(S); if (Math.hypot((p.x - x) / rx, (p.y - y) / ry) > 1) return false;
    S.damagePlayer(dmg || 1); return true;
  };

  /** Orbath: se cierra y suelta una corona de rayos para todos lados. */
  const corona = (S, e) => {
    e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
    if (S.anims.exists(e.type + '_attack3')) e.play(e.type + '_attack3', true);
    e.setTint(0xff6060); son('necro_cast', 0.7, { rate: 0.6 });
    const o = piesDe(e), aro = S.add.ellipse(o.x, o.y - 30, 30, 30).setStrokeStyle(3, 0xff4040, 0.9).setDepth(30000).setBlendMode(ADD());
    S.tweens.add({ targets: aro, scale: 2.6, alpha: 0, duration: 600, onComplete: () => aro.destroy() });
    S.time.delayedCall(600, () => {
      if (!vivo(e)) return; e.clearTint();
      const n = e.phase2 ? 12 : 8;
      for (let k = 0; k < n; k++) S.enemyShoot(e, (k / n) * Math.PI * 2);
      son('fire_cast', 0.6, { rate: 0.7 });
    });
    libre(S, e, 1100);
  };
  /** Fauces y Taurax: rasca el piso y se tira a la carrera adonde estabas. */
  const embestida = (S, e) => {
    const p = pies(S), o = piesDe(e), d = Math.hypot(p.x - o.x, p.y - o.y);
    if (d < 70 || d > 300) return false;
    e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
    e.setFlipX(p.x < o.x); e.setTint(0xff7050);
    son(e.type === 'demonio_j_minotauro' ? 'ck_demonio_rugido' : 'warg_howl', 0.6, { rate: e.type === 'demonio_j_minotauro' ? 0.7 : 1.1 });
    const ang = Math.atan2(p.y - o.y, p.x - o.x), largo = Math.min(d + 70, 340);
    // la línea de la carrera, en el piso
    const linea = S.add.graphics().setDepth(o.y - 2);
    linea.lineStyle(10, 0xff3010, 0.22).lineBetween(o.x, o.y, o.x + Math.cos(ang) * largo, o.y + Math.sin(ang) * largo);
    linea.lineStyle(2, 0xff5030, 0.8).lineBetween(o.x, o.y, o.x + Math.cos(ang) * largo, o.y + Math.sin(ang) * largo);
    const raspa = S.time.addEvent({ delay: 120, repeat: 4, callback: () => vivo(e) && polvo(S, piesDe(e).x - Math.cos(ang) * 12, piesDe(e).y, 2) });
    const espera = e.phase2 ? 380 : 560;
    S.time.delayedCall(espera, () => {
      linea.destroy(); raspa.remove();
      if (!vivo(e)) return;
      e.clearTint();
      if (S.anims.exists(e.type + '_walk')) { e.play(e.type + '_walk', true); e.anims.timeScale = 2.4; }
      son('ck_embestida', 0.8) || son('dash', 0.7, { rate: 0.7 });
      const v = e.type === 'demonio_j_minotauro' ? 430 : 470, ms = largo / v * 1000;
      e.setVelocity(Math.cos(ang) * v, Math.sin(ang) * v);
      e._rcCarga = { hasta: S.time.now + ms, pego: false, ang };
      S.time.delayedCall(ms, () => {
        if (!vivo(e)) return;
        e._rcCarga = null; e.setVelocity(0, 0); e.anims.timeScale = 1;
        polvo(S, piesDe(e).x, piesDe(e).y, 6); S.cameras.main.shake(160, 0.004);
        libre(S, e, 450);
      });
    });
    return true;
  };
  /** Seravel: se esfuma en humo rojo y aparece a tus espaldas con la guadaña en alto. */
  const parpadeo = (S, e) => {
    const p = pies(S), lado = S.player.flipX ? 1 : -1;      // a la espalda del héroe
    let x = p.x + lado * 56, y = p.y;
    if (S.navIsFree && !S.navIsFree(x, y)) { x = p.x - lado * 56; if (!S.navIsFree(x, y)) return false; }
    e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
    const humo = (hx, hy) => { for (let i = 0; i < 14; i++) { const c = S.add.circle(hx + R(-14, 14), hy + R(-40, 0), R(4, 9), UNO([0x5a0f2a, 0x2a1446, 0x8a1030]), 0.7).setDepth(hy + 30);
      S.tweens.add({ targets: c, y: c.y - R(10, 30), scale: 2, alpha: 0, duration: R(500, 800), onComplete: () => c.destroy() }); } };
    const o = piesDe(e); humo(o.x, o.y); son('teleport', 0.6, { rate: 0.8 }) || son('necro_cast', 0.5, { rate: 1.3 });
    S.tweens.add({ targets: e, alpha: 0, duration: 200 });
    S.time.delayedCall(420, () => {
      if (!vivo(e)) return;
      const dy = (e.body ? e.body.bottom - e.y : 10 * e.scaleY);
      try { e.body.reset(x, y - dy); } catch (er) { e.setPosition(x, y - dy); }
      humo(x, y); son('ck_fantasma_aparece', 0.5) || son('teleport', 0.5);
      e.setFlipX(S.player.x < x);
      S.tweens.add({ targets: e, alpha: 1, duration: 160 });
      e.isAttacking = false; e.state = 'chase'; e.attackCooldown = 0;   // y golpea enseguida
    });
    return true;
  };
  /** Gromm: levanta el martillo, golpea el piso y sale una onda de fuego (hay que saltarla con el dash o alejarse). */
  const onda = (S, e) => {
    e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
    const an = S.anims.exists(e.type + '_attack2') ? e.type + '_attack2' : e.type + '_attack1';
    e.play(an, true);
    const o = piesDe(e), ms = e.phase2 ? 750 : 950;
    marca(S, o.x, o.y, 56, ms); son('ck_demonio_rugido', 0.7, { rate: 0.6 });
    S.time.delayedCall(ms, () => {
      if (!vivo(e)) return;
      S.cameras.main.shake(400, 0.009); son('ck_pisoton_jefe', 0.9) || son('ck_derrumbe', 0.8);
      polvo(S, o.x, o.y, 12, 0x4a3426); chispas(S, o.x, o.y, 16, 0xff6020, 40);
      const anillos = e.phase2 ? 2 : 1;
      for (let k = 0; k < anillos; k++) S.time.delayedCall(k * 420, () => {
        const ring = S.add.ellipse(o.x, o.y, 20, 12).setStrokeStyle(6, 0xff6020, 0.95).setDepth(9).setBlendMode(ADD()), q = { r: 10 };
        let pego = false;
        S.tweens.add({ targets: q, r: 230, duration: 1100, ease: 'Sine.easeOut', onUpdate: () => {
          ring.setDisplaySize(q.r * 2, q.r * 1.24); ring.setAlpha(1 - q.r / 260);
          const p = pies(S), d = Math.hypot(p.x - o.x, (p.y - o.y) / 0.62);
          if (!pego && !S.isDashing && !S.isDead && Math.abs(d - q.r) < 10) { pego = true; S.damagePlayer(1); }
        }, onComplete: () => ring.destroy() });
      });
    });
    libre(S, e, ms + 700);
  };
  /** Morvane: clava la espada y se abren pilares de fuego, uno detrás del otro, hasta donde estás. */
  const pilares = (S, e) => {
    e.isAttacking = true; e.setVelocity(0, 0); e.state = 'ckrc';
    const an = S.anims.exists(e.type + '_attack3') ? e.type + '_attack3' : e.type + '_attack1';
    const p = pies(S), o = piesDe(e);
    e.setFlipX(p.x < o.x); e.play(an, true);
    son('sword_swing2', 0.7, { rate: 0.6 });
    const ang = Math.atan2(p.y - o.y, p.x - o.x), d = Math.min(Math.hypot(p.x - o.x, p.y - o.y) + 40, 320);
    const n = Math.max(3, Math.round(d / 52)), pts = [];
    for (let i = 1; i <= n; i++) pts.push([o.x + Math.cos(ang) * (d * i / n), o.y + Math.sin(ang) * (d * i / n)]);
    if (e.phase2) pts.push([p.x + R(-50, 50), p.y + R(-30, 30)], [p.x + R(-50, 50), p.y + R(-30, 30)]);
    pts.forEach(([x, y], i) => {
      const t0 = 380 + i * 150;
      S.time.delayedCall(t0 - 380, () => marca(S, x, y, 20, 420));
      S.time.delayedCall(t0, () => {
        if (!vivo(e)) return;
        if (S.anims.exists('ckrc_pilar')) {
          const pl = S.add.sprite(x, y + 4, 'ckrc_pilar', 0).setOrigin(0.5, 0.6).setScale(1.1).setDepth(y + 3);
          pl.play('ckrc_pilar'); pl.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pl.destroy());
          S.time.delayedCall(900, () => pl.active && pl.destroy());
        } else chispas(S, x, y, 14, 0xff4020, 70);
        son('fire_hit', 0.45, { rate: R(0.7, 0.9), minGap: 60 }) || son('fire_cast', 0.4);
        if (window.CK_LUZ && window.CK_LUZ.agregar) try { window.CK_LUZ.agregar({ x, y: y - 10, c: [255, 90, 40], r: 60, f: 1, ms: 600, curva: 'apaga' }); } catch (er) {}
        tocar(S, x, y, 22, 14, 1);
      });
    });
    libre(S, e, 380 + pts.length * 150 + 400);
  };
  const ESP = { corona, embestida, parpadeo, onda, pilares };
  const cadaCuanto = e => (e.phase2 ? R(4500, 6000) : R(6500, 8500));

  // ================================================================== 5. EL JEFE SALE DE SU GRIETA
  const enC3 = S => {
    const C = C3(); if (!C || S._gameMode !== 'campaign' || !S.story) return null;
    const f = S.story.flags || {}; if (!f.infierno || f.cap3_fin || (f.c3 | 0) !== 3) return null;
    const I = S._c3Inf; if (!I || !C.ZONAS[I.z] || !LUGAR[I.z]) return null;
    return I;
  };
  const jefeVivo = S => S.enemies && S.enemies.getChildren().find(e => vivo(e) && e._rcJefe);
  const area = S => (S.currentInterior ? S.currentInterior.area : { x: 0, y: 0, w: 1e5, h: 1e5 });
  /** Un lugar libre cerca del héroe (ni encima ni lejos), al que se pueda llegar caminando. */
  const lugarCerca = (S, Q) => {
    const p = pies(S), a = area(S);
    for (const r of [150, 120, 190, 95]) {
      const a0 = R(0, Math.PI * 2);
      for (let k = 0; k < 12; k++) {
        const an = a0 + (k / 12) * Math.PI * 2, x = p.x + Math.cos(an) * r, y = p.y + Math.sin(an) * r * 0.7;
        if (a.w < 1e5 && (x < a.x + 30 || x > a.x + a.w - 30 || y < a.y + 40 || y > a.y + a.h - 20)) continue;
        // (la grilla "grande" es la de los bichos grandes: deja más lugar a los costados)
        if (S.navIsFree && (!S.navIsFree(x, y, true) || !S.navIsFree(x - 16, y, true) || !S.navIsFree(x + 16, y, true))) continue;
        if (S.cameras && !Phaser.Geom.Rectangle.Contains(S.cameras.main.worldView, x, y - 30)) continue;
        // que se pueda llegar caminando (no arriba de un barranco ni del otro lado de una pared)
        if (S.navPath) {
          const ruta = S.navPath(p.x, p.y, x, y, 4000, true); if (!ruta) continue;
          let largo = 0, px = p.x, py = p.y; ruta.forEach(([rx, ry]) => { largo += Math.hypot(rx - px, ry - py); px = rx; py = ry; });
          if (largo > r * 1.8) continue;
        }
        return { x, y };
      }
    }
    return { x: a.x + Q.punto[0], y: a.y + Q.punto[1] };
  };
  const aparecer = (S, I, Q) => {
    S._rcSale = true;
    const def = ENEMY_TYPES[Q.jefe], sc = def.scale || 1;
    son('ck_derrumbe', 0.7); S.cameras.main.shake(900, 0.006);
    S.createFloatingText(S.player.x, S.player.y - 56, '¡La tierra tiembla…!', 0xfca5a5);
    S.time.delayedCall(900, () => {
      if (S._c3Inf !== I) { S._rcSale = false; return; }
      // (v2) en el Camino, la Aldea y los Campos sale donde lo marcó el dueño, y la cámara lo va a buscar
      const q = Q.fijo ? { x: area(S).x + Q.punto[0], y: area(S).y + Q.punto[1] } : lugarCerca(S, Q), y0 = q.y - 10 * sc;
      if (Q.fijo && window.CK_ESCENA && !Phaser.Geom.Rectangle.Contains(S.cameras.main.worldView, q.x, q.y - 30)) {
        const E = window.CK_ESCENA;
        E.correr(S, async () => { await E.camara(S, Q.punto[0], Q.punto[1] - 30, 900); await E.esperar(2600); });
      }
      const listo = e => {
        S._rcSale = false;
        if (!e) return;
        // los pies, justo en la grieta (la escala del mapa puede agrandarlo un poco)
        // (trepar lo achica para que crezca saliendo de la grieta: se calcula con la escala final; los pies quedan 10 px
        // de hoja por debajo del centro)
        const sy = e.scaleY < sc * 0.6 ? e.scaleY / 0.2 : e.scaleY, dy = q.y - (e.y + 10 * sy);
        if (Math.abs(dy) > 2) { try { if (e.body) e.body.reset(q.x, e.y + dy); else e.setPosition(q.x, e.y + dy); } catch (er) {} }
        e.home = { x: e.x, y: e.y };
        S._rcQ = q;
        e.zone = (S.currentZoneKey && S.currentZoneKey()) || e.zone;
        e._c3slot = 'j0'; e._c3z = I.z; e._c3guarda = true; e._rcJefe = true; e._target = null;
        e._rcEsp = S.time.now + R(5000, 7000);
        if (S.placeEnemyClear) S.placeEnemyClear(e);
        S.cameras.main.flash(260, 255, 60, 30); S.cameras.main.shake(500, 0.01);
        son('ck_demonio_rugido', 1, { rate: 0.55 });
        chispas(S, q.x, q.y, 26, 0xff5020, 80); polvo(S, q.x, q.y, 10, 0x3a2420);
        S.time.delayedCall(500, () => vivo(e) && S.alertEnemy && S.alertEnemy(e));
      };
      const IV = window.CK_INFIERNO_VIVO;
      if (IV && IV.grieta && S._ckiv) {
        IV.grieta(S, q.x, q.y, Q.jefe, 1300, listo);
        // la grieta del jefe, más grande
        try { const V = S._ckiv, gr = V && V.grietas[V.grietas.length - 1]; if (gr) { S.tweens.add({ targets: gr.g, scaleX: 2.6, scaleY: 2.2, duration: 700, delay: 420 }); S.tweens.add({ targets: gr.gl, scaleX: 3, scaleY: 2, duration: 700, delay: 420 }); } } catch (er) {}
      } else S.time.delayedCall(1300, () => listo(S._c3Inf === I ? S.spawnEnemy(q.x, y0, Q.jefe) : null));
    });
  };

  // ================================================================== 6. CADA CUADRO
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      const I = enC3(S); if (!I || !S.player) { S._rcListo = 0; return r; }
      texturas(S);
      const now = S.time.now, Q = LUGAR[I.z], C = C3();
      // la embestida en curso: si te alcanza, te pega una vez
      const j = jefeVivo(S);
      if (j && j._rcCarga && !j._rcCarga.pego) {
        const p = pies(S), o = piesDe(j);
        if (Math.hypot(p.x - o.x, (p.y - o.y) * 1.4) < 16 + 12 * j.scaleX) {
          j._rcCarga.pego = true;
          if (!S.isDashing && !S.isDead) { S.damagePlayer(j.def.dmg); try { S.player.body.velocity.x += Math.cos(j._rcCarga.ang) * 260; S.player.body.velocity.y += Math.sin(j._rcCarga.ang) * 260; } catch (er) {} }
        }
      }
      if (S.dialogOpen || S._ckEscena || S.isDead || S._doorTransition || S._overlay) return r;
      // los golpes especiales
      if (j && j.state === 'chase' && !j.isAttacking && now > (j._rcEsp || 0)) {
        const d = JEFES[j.type], fn = d && ESP[d.esp];
        j._rcEsp = now + (fn && fn(S, j) !== false ? cadaCuanto(j) : 900);
      }
      // ¿ya no queda nadie más? sale el jefe
      if ((S._rcMira || 0) > now) return r;
      S._rcMira = now + 400;
      if (j || S._rcSale || !hay(Q.jefe)) return r;
      const E3 = C.est(S.story, I.z); if (E3.ok || E3.m.indexOf('j0') >= 0) return r;
      const cs = C.casillas(I.z);
      if (!cs.some(c => c.jefe) || cs.some(c => !c.jefe && E3.m.indexOf(c.k) < 0)) { S._rcListo = 0; return r; }
      if (!S._rcListo) { S._rcListo = now + 1800; return r; }
      if (now < S._rcListo) return r;
      S._rcListo = 0;
      aparecer(S, I, Q);
    } catch (e) { if (!P._rcErr) { P._rcErr = 1; console.warn('[reino criaturas]', e); } }
    return r;
  };

  // al caer el jefe: su cartel (el juego, para todo jefe, decía "El Nigromante ha caído")
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    this._rcJefeCae = enemy && enemy._rcJefe ? enemy : null;
    try { return ve0 ? ve0.apply(this, arguments) : undefined; } finally { this._rcJefeCae = null; }
  };
  const zt0 = P.showZoneTitle;
  P.showZoneTitle = function (t, sub) {
    const e = this._rcJefeCae;
    if (e && t === 'El Nigromante ha caído') {
      const Q = LUGAR[e._c3z];
      return zt0.call(this, (e.def.name || '').split(',')[0] + ' ha caído', Q ? 'El fuego ' + Q.de + ' empieza a apagarse' : 'Vuelve al abismo');
    }
    return zt0.apply(this, arguments);
  };
  const ft0 = P.createFloatingText;
  P.createFloatingText = function (x, y, txt) {
    if (txt === '¡LA NIEBLA SE CIERRA!') {
      const j = jefeVivo(this);
      if (j && j.phase2 && Math.abs(j.x - x) < 4) arguments[2] = '¡' + nombreCorto(j.type) + ' SE ENFURECE!';
    }
    return ft0.apply(this, arguments);
  };

  // ================================================================== 7. LAS PRESENTACIONES DE LOS JEFES
  const CARTAS = [
    { id: 'rc_ojo', tipo: 'demonio_j_ojo', nombre: 'ORBATH', titulo: 'El Ojo del Portal', fuente: 'hueso', tema: 'niebla',
      colores: ['#ffe9e9', '#ff4d5e', '#5a0f2a'], contorno: '#14030a', banda: ['#16060e', '#4a0d24'], acento: '#ff3b4f', resp: 'necro_cast' },
    { id: 'rc_sabueso', tipo: 'demonio_j_sabueso', nombre: 'FAUCES', titulo: 'El Sabueso Mayor', fuente: 'orco', tema: 'golpe',
      colores: ['#fff1c2', '#ff8a2a', '#7a1408'], contorno: '#140402', banda: ['#1a0805', '#5a1a08'], acento: '#ff7a1f', resp: 'warg_howl' },
    { id: 'rc_segadora', tipo: 'demonio_j_segadora', nombre: 'SERAVEL', titulo: 'La Segadora', fuente: 'real', tema: 'arcano',
      colores: ['#e6f4ff', '#6fb6ff', '#8a1030'], contorno: '#0a0614', banda: ['#0b0a1c', '#2a1446'], acento: '#ff3b6b', resp: 'ck_fantasma_susurro' },
    { id: 'rc_minotauro', tipo: 'demonio_j_minotauro', nombre: 'TAURAX', titulo: 'El Minotauro de Brasa', fuente: 'orco', tema: 'golpe',
      colores: ['#ffe7c2', '#d9822b', '#5a2a10'], contorno: '#140802', banda: ['#1a0d05', '#4f240c'], acento: '#ff6a1f', resp: 'ck_demonio_rugido' },
    { id: 'rc_martillo', tipo: 'demonio_j_martillo', nombre: 'GROMM', titulo: 'El Martillo del Abismo', fuente: 'orco', tema: 'golpe',
      colores: ['#fff0d0', '#ff5a3a', '#7a0d0d'], contorno: '#180202', banda: ['#1c0404', '#600d0d'], acento: '#ff4a1f', resp: 'ck_pisoton_jefe' },
    { id: 'rc_caballero', tipo: 'demonio_j_caballero', nombre: 'MORVANE', titulo: 'El Caballero Negro', fuente: 'guardia', tema: 'acero',
      colores: ['#f2f2f2', '#b3b3c2', '#7a1010'], contorno: '#050508', banda: ['#0a0a10', '#2a2a36'], acento: '#e0303a', resp: 'ck_paso_armadura' }
  ];
  const presentar = () => {
    try {
      const PR = window.CK_PRESENTACIONES, A = window.CK_PRES_ARTE;
      if (!PR || !PR.ELENCO || !A || !A.retratos || PR.POR_ID.rc_ojo) return;
      CARTAS.forEach(k => {
        if (!hay(k.tipo)) return;
        const c = Object.assign({ etiqueta: 'Jefe', lado: 'enemigo', dialogo: null, tipos: [k.tipo] }, k);
        delete c.tipo;
        PR.ELENCO.push(c); PR.POR_ID[c.id] = c; PR.POR_TIPO[k.tipo] = c;
        const ret = ART['ret_' + k.id.slice(3)]; if (ret) A.retratos[c.id] = ret;
      });
    } catch (e) { console.warn('[reino criaturas]', e); }
  };
  presentar(); window.addEventListener('load', presentar);

  window.CK_REINO_CRIATURAS = { BICHOS, JEFES, LUGAR, ESP, aparecer: S => { const I = enC3(S); if (I) aparecer(S, I, LUGAR[I.z]); }, jefeVivo };
})();
