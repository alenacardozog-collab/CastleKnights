'use strict';
/* Cinemáticas de la batalla del Capítulo 2 (23/11, notas del dueño de `notas_para_corregir (2).json`):
   - Nota 31, SENDERO ORCO, la primera vez que llega la línea: "el ejército camina hasta el centro, Bruno da un discurso con la
     cámara encima, la cámara va a los orcos que se agrupan, vuelve a Bruno que grita «¡por Valcairn y por el Rey!», los npc
     corren y ponen las escaleras y empieza la batalla". El ejército de Bruno entra marchando desde el oeste hasta su lugar;
     la arenga; la cámara cruza la grieta y la horda se junta del otro lado; el grito; las escaleras (la escena de
     ck_batalla_sendero.js). Los orcos de la horda son los primeros de la pelea.
   - Nota 28, AFUERAS ORCAS, la primera vez: Bruno al frente, "¡ALTO!"; la cámara va a la horda, que se abre en dos para dejar
     pasar a Gorvak; Gorvak dice que ya se cansó y que de éstos se encarga él; salta sobre la línea de Bruno, cae en el medio
     y voltea a todos (onda, polvo, temblor); su presentación; y se pelea contra él y su horda, con los soldados.
     Mientras dura la batalla en las Afueras, las CATAPULTAS orcas (del este, fuera de la vista) tiran piedras: una sombra que
     crece marca dónde caen y el golpe lastima a todos los que estén cerca (héroe, soldados y orcos).
   Gorvak se retira como siempre (ck_batalla_orca.js: "te espero en la arena"). Banderas en story.flags.batalla_orca: cin_s y
   cin_a (la escena ya se vio). Va después de ck_batalla_sendero.js. Borrar su línea de index.html deja las batallas como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_BATALLA_ORCA || !window.CK_BATALLA_SENDERO) return;
  const P = MainGameScene.prototype, BO = window.CK_BATALLA_ORCA, BS = window.CK_BATALLA_SENDERO;
  const SEND = 'sendero_orco', AF = 'afueras_orcas', ZS = 'ed_' + SEND + '.main', ZA = 'ed_' + AF + '.main';
  const E = () => window.CK_ESCENA;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const area = S => S.currentInterior && S.currentInterior.area;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const frente = id => (BO.FRENTES || []).find(f => f.id === id);
  const esLinea = t => t && t.sprite && t.sprite.active && (t.role === 'guard' || t.role === 'archer');
  const linea = S => ((area(S) || {}).actors || []).filter(esLinea);
  const brunoDe = S => linea(S).find(t => t.sprite.texture && t.sprite.texture.key === 'g_knight_idle');
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const escala = t => (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[t] && ENEMY_TYPES[t].scale) || 1.2;

  // ------------------------------------------------------------------ la línea entra marchando desde el oeste
  // Cada soldado queda "ocupado" (el sistema de los guardias no lo mueve) y camina hasta su puesto; al final se suelta.
  const marcha = async (S, desde, vel) => {
    const e = E(), a = area(S), ls = linea(S), now = S.time.now;
    ls.forEach((t, i) => {
      const sp = t.sprite;
      t.post = [sp.x, sp.y]; t._ccPuesto = [sp.x - a.x, sp.y - a.y]; t.busyUntil = now + 1e9; t.fight = null;
      sp._ckAnim = (t.idle || sp.texture.key).replace(/_idle$/, '');
      sp.setPosition(a.x + desde.x - (i % 4) * 26 - Math.floor(i / 4) * 12, a.y + desde.y + ((i % 5) - 2) * 15).setFlipX(false);
    });
    const br = brunoDe(S);
    // Bruno va adelante
    const orden = br ? [br].concat(ls.filter(t => t !== br)) : ls;
    const pasos = orden.map((t, i) => espera(i * 170).then(() => e.caminar(S, t.sprite, t._ccPuesto[0], t._ccPuesto[1], vel || 95)));
    return Promise.all(pasos);
  };
  const soltar = S => { linea(S).forEach(t => { t.busyUntil = 0; t.sprite.setFlipX(false); }); };

  // ------------------------------------------------------------------ la horda (dibujos; al pelear pasan a ser orcos de verdad)
  const MEZCLA = ['orc', 'orc', 'orc_armored', 'orc', 'orc_elite', 'orc_armored', 'orc', 'orc_elite'];
  const horda = (S, pts, desdeX) => {
    const a = area(S), out = [];
    pts.forEach(([x, y], i) => {
      const t = MEZCLA[i % MEZCLA.length];
      if (!S.textures.exists(t + '_idle')) return;
      const sp = S.add.sprite(a.x + (desdeX || x), a.y + y - 26, t + '_idle').setScale(escala(t)).setFlipX(true).setDepth(a.y + y);
      sp._ckAnim = t; sp._ccTipo = t; sp._ccMeta = [x, y];
      if (S.anims.exists(t + '_idle')) sp.play(t + '_idle');
      out.push(sp);
    });
    return out;
  };
  const acercar = (S, orcos, vel) => Promise.all(orcos.map((o, i) => espera(i * 90).then(() => E().caminar(S, o, o._ccMeta[0], o._ccMeta[1] - 26, vel || 110))));
  // los dibujos de la horda pasan a ser orcos de la batalla, en el mismo lugar (como los trae ck_batalla_orca.js)
  const despertar = (S, orcos) => {
    const a = area(S);
    orcos.forEach(o => {
      if (!o || !o.active) return;
      const x = o.x, y = o.y, t = o._ccTipo; o.destroy();
      if (!a) return;
      const en = S.spawnEnemy(x, y, t); if (!en) return;
      if (S.placeEnemyClear && !S.placeEnemyClear(en)) { en.destroy(); return; }      // (si quedó dentro de una roca, al lado)
      en.zone = a.key; en._ckBatalla = true; en._ckAullo = true; en._ckRefuerzo = true; en.home = { x: en.x, y: en.y + 26 };
      en.setFlipX(true);
      S.time.delayedCall(R(80, 400), () => { if (vivo(en) && S.alertEnemy) S.alertEnemy(en); });
    });
  };

  // las patrullas de siempre que hayan quedado en el mapa (un huargo del Sendero, por ejemplo) no son de la batalla: se van
  const sinPatrullas = S => {
    const z = zona(S);
    (S.enemies ? S.enemies.getChildren() : []).forEach(en => { if (vivo(en) && en.zone === z && !en._ckBatalla) { try { if (en.hpBar) en.hpBar.destroy(); en.destroy(); } catch (er) {} } });
  };

  // ------------------------------------------------------------------ nota 31: el Sendero
  const HORDA_S = [[690, 200], [720, 250], [700, 300], [740, 350], [770, 190], [800, 240], [790, 300], [820, 350], [850, 210], [860, 280], [660, 260], [880, 330]];
  const introSendero = (S, b) => {
    const e = E(); if (!e || !e.correr) return false;
    b.cin_s = 1; if (S.saveStory) S.saveStory();
    let orcos = [];
    sinPatrullas(S);
    e.correr(S, async () => {
      // el ejército entra
      await e.camara(S, 170, 262, 10);
      const va = marcha(S, { x: -20, y: 262 }, 100);
      await e.camara(S, 330, 272, 3200);
      await va;
      const br = brunoDe(S);
      if (br) {
        br.sprite.setFlipX(false);
        await e.camara(S, br.sprite.x - area(S).x + 40, br.sprite.y - area(S).y - 20, 700);
        son('ck_paso_armadura', 0.5);
        await e.dialogo(S, 'Capitán Bruno', [
          '¡Soldados del Roble! Del otro lado de esa grieta están los que quemaron nuestras caravanas y se llevaron a nuestra gente.',
          'Nos dijeron que el Sendero no se cruza. Que los orcos son demasiados. Que volvamos a casa.',
          'Miren a su costado. Ése es su hermano. Hoy nadie retrocede un paso: ¡hoy cruzamos!'
        ], 'g_knight_idle');
      }
      // la horda se junta del otro lado
      orcos = horda(S, HORDA_S, 990);
      const llegan = acercar(S, orcos, 120);
      son('ck_f_orco_grito', 0.8) || son('orc_attack', 0.8, { rate: 0.7 });
      await e.camara(S, 770, 270, 1300);
      await llegan;
      orcos.forEach((o, i) => S.time.delayedCall(i * 60, () => { if (o.active && S.anims.exists(o._ccTipo + '_attack1')) { o.play(o._ccTipo + '_attack1'); o.once('animationcomplete', () => o.active && o.play(o._ccTipo + '_idle')); } }));
      son('orc_attack', 0.9, { rate: 0.6 }); S.cameras.main.shake(500, 0.004);
      if (orcos[1]) await e.globo(S, orcos[1], '¡Carne del castillo! ¡GRAAAH!', 1800, 56);
      if (orcos[6]) e.globo(S, orcos[6], '¡Que vengan!', 1300, 56);
      await e.esperar(500);
      // el grito
      if (br) {
        await e.camara(S, br.sprite.x - area(S).x + 30, br.sprite.y - area(S).y - 20, 900);
        if (S.anims.exists('g_knight_attack1')) { br.sprite.play('g_knight_attack1'); br.sprite.once('animationcomplete', () => br.sprite.active && br.sprite.play('g_knight_idle')); }
        son('ck_cuerno_orco', 0.6, { rate: 1.3 }) || son('grito_guerra', 0.9);
        S.cameras.main.shake(400, 0.005);
        S.createFloatingText(br.sprite.x, br.sprite.y - 70, '¡POR VALCAIRN Y POR EL REY!', 0xfde68a);
        await e.globo(S, br.sprite, '¡POR VALCAIRN Y POR EL REY!', 1900);
        linea(S).filter(t => t !== br).forEach((t, i) => i % 3 === 0 && S.time.delayedCall(i * 90, () => e.globo(S, t.sprite, UNO(['¡HURRA!', '¡Por el Rey!', '¡Por Valcairn!']), 1200)));
        await e.esperar(1300);
      }
      soltar(S);
    }).then(() => {
      soltar(S);
      // las escaleras (la escena de ck_batalla_sendero.js) y, al terminar, la horda pelea
      const sigue = () => despertar(S, orcos);
      if (!(b.escaleras) && BS.tenderEscaleras && zona(S) === ZS) {
        BS.tenderEscaleras(S);
        const t0 = S.time.now, mira = S.time.addEvent({ delay: 200, loop: true, callback: () => {
          if (!S._ckEscena || S.time.now - t0 > 30000 || zona(S) !== ZS) { mira.remove(); sigue(); }
        } });
      } else sigue();
    }).catch(() => { soltar(S); orcos.forEach(o => o && o.active && o.destroy()); });
    return true;
  };

  // ------------------------------------------------------------------ nota 28: las Afueras y Gorvak
  const HORDA_A = [[640, 190], [670, 230], [650, 280], [680, 320], [720, 180], [740, 215], [725, 290], [750, 330], [790, 200], [800, 300], [610, 240], [610, 300]];
  const GORVAK = 'orc_campeon', GORVAK_DE = { x: 930, y: 160 }, GORVAK_FRENTE = { x: 700, y: 256 };
  const introAfueras = (S, b) => {
    const e = E(); if (!e || !e.correr) return false;
    b.cin_a = 1; b.g = 1;                                   // Gorvak lo trae esta escena (no el contador de la batalla)
    if (S.saveStory) S.saveStory();
    const v = (S.story.flags.presentados = S.story.flags.presentados || {}), yaVisto = !!v.gorvak; v.gorvak = 1;   // que la tarjeta no salga a mitad del salto
    let orcos = [], gv = null, cae = null;
    sinPatrullas(S);
    e.correr(S, async () => {
      const a = area(S);
      await e.camara(S, 170, 240, 10);
      const va = marcha(S, { x: -20, y: 236 }, 100);
      await e.camara(S, 270, 262, 3000);
      await va;
      const br = brunoDe(S);
      // "¡ALTO!"
      if (br) {
        br.sprite.setFlipX(false);
        son('shield_block', 0.7);
        S.cameras.main.shake(250, 0.004);
        await e.globo(S, br.sprite, '¡ALTO! ¡Escudos al frente!', 1500);
      }
      // la horda, junta, y se abre en dos
      orcos = horda(S, HORDA_A);
      orcos.forEach(o => o.setAlpha(0));
      orcos.forEach((o, i) => S.tweens.add({ targets: o, alpha: 1, duration: 300, delay: i * 40 }));
      await e.camara(S, 720, 255, 1300);
      son('orc_attack', 0.8, { rate: 0.65 }); son('ck_cuerno_orco', 0.9);
      await e.esperar(500);
      orcos.forEach(o => {
        const arriba = o._ccMeta[1] < GORVAK_FRENTE.y, dy = arriba ? -52 : 52;
        if (S.anims.exists(o._ccTipo + '_walk')) o.play(o._ccTipo + '_walk', true);
        S.tweens.add({ targets: o, y: o.y + dy, duration: 700, ease: 'Sine.easeOut', onUpdate: () => o.setDepth(o.y + 26),
          onComplete: () => { o._ccMeta[1] += dy; if (o.active && S.anims.exists(o._ccTipo + '_idle')) o.play(o._ccTipo + '_idle', true); } });
      });
      await e.esperar(600);
      // Gorvak baja por el medio
      if (S.textures.exists(GORVAK + '_idle')) {
        gv = S.add.sprite(a.x + GORVAK_DE.x, a.y + GORVAK_DE.y - 26, GORVAK + '_idle').setScale(escala(GORVAK)).setFlipX(true).setDepth(a.y + GORVAK_DE.y);
        gv._ckAnim = GORVAK;
        if (S.anims.exists(GORVAK + '_idle')) gv.play(GORVAK + '_idle');
        son('ck_f_paso_jefe', 0.7);
        await e.caminar(S, gv, GORVAK_FRENTE.x, GORVAK_FRENTE.y - 26, 70);
        gv.setFlipX(true);
        S.cameras.main.shake(300, 0.004);
        await e.dialogo(S, 'Gorvak, el del escudo', [
          '¿Otra vez ustedes? Los gusanos del castillo, con sus palitos y sus banderitas.',
          'Ya me cansé de verlos correr por mis tierras. ¡Hagan lugar, inútiles! De éstos me encargo yo.'
        ], GORVAK + '_idle');
        // el salto sobre la línea de Bruno
        const destino = br ? { x: br.sprite.x - a.x + 46, y: br.sprite.y - a.y - 4 } : { x: 300, y: 270 };
        const x0 = gv.x, y0 = gv.y, x1 = a.x + destino.x, y1 = a.y + destino.y - 26;
        const sombra = S.add.ellipse(x1, y1 + 30, 70, 22, 0x000000, 0.45).setDepth(y1 + 2).setScale(0.2);
        if (S.anims.exists(GORVAK + '_salto')) gv.play(GORVAK + '_salto');
        son('salto_golpe', 0.8) || son('dash', 0.8, { rate: 0.6 });
        S.cameras.main.pan(x1, y1 - 20, 900, 'Sine.easeInOut', true);
        S.tweens.add({ targets: sombra, scale: 1, duration: 900, ease: 'Quad.easeIn' });
        const k = { t: 0 };
        await new Promise(r => S.tweens.add({ targets: k, t: 1, duration: 900, ease: 'Sine.easeIn',
          onUpdate: () => { gv.setPosition(x0 + (x1 - x0) * k.t, y0 + (y1 - y0) * k.t - Math.sin(k.t * Math.PI) * 150).setDepth(gv.y + 200); }, onComplete: r }));
        sombra.destroy();
        cae = { x: x1, y: y1 };
        gv.setDepth(y1 + 26);
        // el golpe: onda, polvo y todos al piso
        son('ck_aterriza', 1) || son('ck_pisoton_jefe', 1); son('ck_derrumbe', 0.6);
        S.cameras.main.shake(700, 0.016); S.cameras.main.flash(140, 255, 240, 200);
        const anillo = S.add.ellipse(x1, y1 + 30, 30, 12).setStrokeStyle(4, 0xf5deb3, 0.9).setDepth(y1 + 3);
        S.tweens.add({ targets: anillo, scaleX: 7, scaleY: 7, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => anillo.destroy() });
        for (let i = 0; i < 18; i++) {
          const ang = i / 18 * Math.PI * 2, p = S.add.circle(x1 + Math.cos(ang) * 14, y1 + 30 + Math.sin(ang) * 6, R(5, 10), 0xb8a07a, 0.8).setDepth(y1 + 40);
          S.tweens.add({ targets: p, x: p.x + Math.cos(ang) * R(50, 90), y: p.y + Math.sin(ang) * R(18, 34) - 10, alpha: 0, scale: 2, duration: R(500, 800), onComplete: () => p.destroy() });
        }
        linea(S).forEach(t => {
          const sp = t.sprite, dx = sp.x - x1, dy = sp.y - (y1 + 26), d = Math.hypot(dx, dy) || 1;
          if (d > 170) return;
          const f = (170 - d) / 170, base = (t.idle || '').replace(/_idle$/, '');
          S.tweens.add({ targets: sp, x: sp.x + dx / d * (30 + 50 * f), y: sp.y + dy / d * (10 + 22 * f), duration: 380, ease: 'Quad.easeOut' });
          if (d < 120) {
            sp.setFlipX(dx < 0);
            S.tweens.add({ targets: sp, angle: dx < 0 ? -80 : 80, duration: 240, delay: 120, yoyo: true, hold: 900 });
            sp.setTint(0xffb0a0); S.time.delayedCall(1400, () => sp.active && sp.clearTint());
          } else if (S.anims.exists(base + '_hurt')) sp.play(base + '_hurt', true);
        });
        if (S.anims.exists(GORVAK + '_idle')) gv.play(GORVAK + '_idle', true);
        await e.esperar(1500);
        if (br) e.globo(S, br.sprite, '¡Arriba! ¡De pie, soldados!', 1600);
        // su presentación
        const PR = window.CK_PRESENTACIONES;
        if (PR && PR.mostrar && !yaVisto) {
          PR.mostrar(S, 'gorvak');
          await e.esperar(300);
          const t0 = Date.now();
          while (PR.activa && PR.activa() && Date.now() - t0 < 6000) await e.esperar(150);
        }
        gv.setFlipX(br ? br.sprite.x < gv.x : true);
        await e.globo(S, gv, '¡A ver qué tienen!', 1300, 70);
      }
    }).then(() => pelea()).catch(() => pelea());
    const pelea = () => {
      soltar(S);
      if (zona(S) !== ZA) { orcos.forEach(o => o && o.active && o.destroy()); if (gv && gv.active) gv.destroy(); b.g = 0; b.cin_a = 0; return; }
      despertar(S, orcos);
      const p = cae || (gv ? { x: gv.x, y: gv.y } : null);
      if (gv && gv.active) gv.destroy();
      if (!p) { b.g = 0; return; }
      const en = S.spawnEnemy(p.x, p.y, typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[GORVAK] ? GORVAK : 'orc_elite');
      if (!en) { b.g = 0; return; }
      const a = area(S);
      en.zone = a.key; en._ckBatalla = true; en._ckAullo = true; en._ckRefuerzo = true; en.home = { x: p.x, y: p.y + 26 };
      en._target = null; en._ckGorvak = S.time.now;            // ck_batalla_orca.js lo retira (la mitad de la vida o un minuto)
      if (en.type !== GORVAK) { en.hp = en.maxHp = 30; en.setScale(en.scaleX * 1.5).setTint(0x9aa4b2); }
      else en.hp = en.maxHp = Math.round(en.maxHp * 1.5);      // en la batalla aguanta más (con diez soldados alrededor se iba enseguida)
      en._ccEscudo = true;
      S.time.delayedCall(120, () => { if (vivo(en) && S.alertEnemy) S.alertEnemy(en); });
      if (S.saveStory) S.saveStory();
    };
    return true;
  };

  // ------------------------------------------------------------------ los frentes: la escena va la primera vez
  const fs = frente(SEND), fa = frente(AF);
  if (fs) {
    const al0 = fs.alEntrar;
    fs.alEntrar = (S, primera, b) => {
      if (!b.cin_s && !b.escaleras && introSendero(S, b)) return;
      if (al0) al0(S, primera, b);
    };
  }
  if (fa) {
    const al0 = fa.alEntrar;
    fa.alEntrar = (S, primera, b) => {
      if (!b.cin_a && !b.g && introAfueras(S, b)) return;
      if (al0) al0(S, primera, b);
    };
  }

  // ------------------------------------------------------------------ las catapultas de las Afueras
  const CADA = [4200, 7200], RADIO = 48;
  const piedra = S => {
    const a = area(S), p = S.player; if (!a || !p) return;
    // a quién apuntan: al héroe, a un soldado o al montón de la pelea
    const ls = linea(S).filter(t => !t.down), orcos = S.enemies ? S.enemies.getChildren().filter(e => vivo(e) && e._ckBatalla && e._ckGorvak === undefined) : [];
    const r = Math.random();
    const blanco = r < 0.42 ? { x: p.x, y: p.y + 8 } : r < 0.75 && ls.length ? (s => ({ x: s.x, y: s.y }))(UNO(ls).sprite) : orcos.length ? (o => ({ x: o.x, y: o.y + 26 }))(UNO(orcos)) : { x: p.x, y: p.y + 8 };
    const x1 = blanco.x + R(-36, 36), y1 = blanco.y + R(-20, 20);
    const x0 = a.x + (a.w || 958) + 60, y0 = y1 - R(40, 120), dura = R(1300, 1600);
    son('ck_silbido', 0.45, { rate: 0.7, minGap: 400 });
    const sombra = S.add.ellipse(x1, y1, 46, 16, 0x000000, 0.4).setDepth(y1 - 2).setScale(0.15);
    const aviso = S.add.ellipse(x1, y1, RADIO * 2, RADIO * 0.75).setStrokeStyle(2, 0xff5a3c, 0.55).setDepth(y1 - 1).setAlpha(0);
    S.tweens.add({ targets: sombra, scale: 1, duration: dura, ease: 'Quad.easeIn' });
    S.tweens.add({ targets: aviso, alpha: 1, duration: dura * 0.6, delay: dura * 0.4 });
    const roca = S.add.circle(x0, y0, 7, 0x5b5348).setStrokeStyle(2, 0x2a241d).setDepth(30000);
    const veta = S.add.rectangle(x0, y0, 8, 2, 0x3a332b).setDepth(30001);
    const k = { t: 0 };
    S.tweens.add({ targets: k, t: 1, duration: dura, ease: 'Linear',
      onUpdate: () => {
        const x = x0 + (x1 - x0) * k.t, y = y0 + (y1 - y0) * k.t - Math.sin(k.t * Math.PI) * 220;
        roca.setPosition(x, y).setScale(1 + Math.sin(k.t * Math.PI) * 0.5); veta.setPosition(x, y).setAngle(k.t * 900);
      },
      onComplete: () => {
        roca.destroy(); veta.destroy(); sombra.destroy(); aviso.destroy();
        if (!S.currentInterior || zona(S) !== ZA) return;
        son('ck_piedra', 0.8, { minGap: 120 }) || son('ck_derrumbe', 0.6, { minGap: 120 });
        const cam = S.cameras.main, cerca = Math.hypot(p.x - x1, p.y - y1) < 320;
        if (cerca) cam.shake(220, 0.006);
        // polvo y cascotes
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2, c = S.add.circle(x1, y1, R(3, 7), i % 3 ? 0x8a7a60 : 0x4a4238, 0.9).setDepth(y1 + 20);
          S.tweens.add({ targets: c, x: x1 + Math.cos(ang) * R(20, 60), y: y1 + Math.sin(ang) * R(8, 24) - R(10, 30), alpha: 0, duration: R(400, 700), onComplete: () => c.destroy() });
        }
        const hoyo = S.add.ellipse(x1, y1, 34, 12, 0x2a241d, 0.55).setDepth(y1 - 3);
        S.tweens.add({ targets: hoyo, alpha: 0, delay: 2500, duration: 1500, onComplete: () => hoyo.destroy() });
        // a todos los que estén cerca
        const b = p.body, px = b ? b.center.x : p.x, py = b ? b.bottom : p.y;
        if (!S.isDead && Math.hypot(px - x1, (py - y1) * 1.6) < RADIO && S.damagePlayer && !S.isInvulnerable) S.damagePlayer(1);
        (S.enemies ? S.enemies.getChildren() : []).forEach(en => {
          if (!vivo(en) || en._ckGorvak !== undefined) return;
          if (Math.hypot(en.x - x1, (en.y + 26 - y1) * 1.6) < RADIO) S.damageEnemy(en, 2, x1, y1);
        });
        linea(S).forEach(t => { if (!t.down && Math.hypot(t.sprite.x - x1, (t.sprite.y - y1) * 1.6) < RADIO && S.npcTakeHit) S.npcTakeHit(t, 2, { x: x1, y: y1 }); });
      } });
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this, B2 = S._ckBat;
      if (S._gameMode !== 'campaign' || !B2 || !B2.frente || B2.frente.id !== AF || zona(S) !== ZA) return r;
      if (B2.final || B2.avance || S._ckEscena || S.dialogOpen || S.isDead || !BO.activa(S)) return r;
      const now = S.time.now;
      if (!S._ccCat || S._ccCat.area !== B2.area) S._ccCat = { area: B2.area, prox: now + 6000 };
      if (now > S._ccCat.prox) { S._ccCat.prox = now + R(CADA[0], CADA[1]); piedra(S); }
    } catch (e) { if (!P._ccCatErr) { P._ccCatErr = 1; console.warn('[cinemáticas c2]', e); } }
    return r;
  };

  // Gorvak, rodeado de soldados, se cubre con el escudo: de los golpes de los aliados le entra uno de cada cinco
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    try {
      const N = window.CK_NOTAS_2311;
      if (enemy && enemy._ccEscudo && vivo(enemy) && N && N.aliadoDe && N.aliadoDe(this, sx, sy) && Math.random() < 0.8) {
        if (!enemy._ccBloq || this.time.now - enemy._ccBloq > 900) {
          enemy._ccBloq = this.time.now;
          this.createFloatingText(enemy.x, enemy.y - 46, '¡BLOQUEO!', 0xcbd5e1);
          son('shield_block', 0.45, { minGap: 200 });
        }
        return;
      }
    } catch (e) {}
    return de0.apply(this, arguments);
  };

  window.CK_CINEMATICAS_C2 = { introSendero, introAfueras, piedra, HORDA_S, HORDA_A };
})();
