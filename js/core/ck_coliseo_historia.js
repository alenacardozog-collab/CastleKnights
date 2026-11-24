'use strict';
/* La Fortaleza y el Coliseo en la historia (10/11, pedido del dueño: "luego del pueblo veamos un patio de fortaleza orca, y
   luego en la fortaleza no pelearemos sino que será una zona para hablar con el jefe final, pero este nos captura con una
   legión de orcos y nos lleva a un coliseo"). Usa los mapas del Taller patio_fortaleza_orca y coliseo_orco y los jefes de
   ck_coliseo.js.
   - Pueblo Orco, portón del norte (abierto por Gorak, paso 6) → PATIO DE LA FORTALEZA (entra por la izquierda). La puerta
     grande del patio (arriba a la izquierda) → la FORTALEZA. Salir de la fortaleza vuelve al patio; salir del patio por la
     izquierda, al pueblo.
   - En la fortaleza (paso 6) Grushak ya no pelea: está sentado en su trono. Al acercarte habla; al terminar, una legión de
     orcos te rodea, la pantalla se apaga y despertás en el COLISEO.
   - En el coliseo: Grushak mira desde la tribuna con la princesa Elia (hija del Rey) encadenada a su lado. Tres rondas: Gorvak,
     Kragmor y Ulrak (entre ronda y ronda recuperás 2 corazones). Si caés, al volver seguís desde la ronda en que estabas.
     Después de la tercera, Grushak baja a la arena ("¡Lo haré yo mismo!") y es la pelea final (el mismo jefe de antes, con sus
     fases). Al vencerlo: paso 7, la princesa queda libre (T para hablarle) y se abre la reja de abajo, que vuelve a la fortaleza.
   - Guardado: story.flags.col = { capturado, ronda (0-3), libre }.
   (14/11, notas del dueño 127 y 130: "el orden de los jefes es, primero el orco del escudo, luego el lobo huargo y de ultimo
   el gorila, pero cada vez q vencemos uno vemos a el caudillo decir algo al respecto y presentar al siguiente, al final cuando
   derrotamos al tercero el se enfurece, en una cinematica y salta al campo para pelear, cuando muere nos tira algo q no
   entendemos, pero no tan explicito sobre la historia pero si sobre la princesa"; "aca es la princesa q esta aqui"):
   - Rondas: Gorvak (el del escudo, un 25 % más chico), Ulrak y Colmillo (el huargo) y Kragmor (el gorila).
   - Entre ronda y ronda, una escena: la cámara va a la tribuna y Grushak comenta la caída y presenta al que sigue.
   - Después de la tercera se enfurece: se para, ruge, salta de la tribuna a la arena (sombra que crece, golpe, temblor,
     polvo) y pelea. Al caer, malherido, unas últimas palabras sobre la princesa (las dice ck_capitulo3.js con el cristal rojo:
     su sangre "abre lo que está cerrado"); después ella queda libre.
   - En la Fortaleza, la chica de al lado del trono (el dibujo de la princesa del castillo) es la princesa Elia hasta que
     Grushak se la lleva al coliseo; después de la arena, en ese lugar está Mira (con otros colores, para no confundirlas).
   (15/11, notas del dueño 45-47):
   - FORTALEZA: los orcos de la guardia se quedan (antes se borraban); al limpiarlos, escena: Grushak desde el trono muestra
     a la princesa y llegan los orcos que te rodean y te capturan.
   - COLISEO: al llegar, escena: Grushak "ahora te tengo donde quería… quiero ver de qué estás hecho" y presenta a su primer
     guerrero, que sale por la reja de la IZQUIERDA con la cámara encima. Cada vez que cae uno, Grushak comenta y presenta al
     siguiente (también por la izquierda), cada vez con más énfasis. El Caudillo, un 20 % más grande.
   - AL FINAL: Grushak, malherido: "te vas a arrepentir de tu decisión… pero ganaste: por ley, te la podés llevar". Se abre
     la reja de abajo y se sale AFUERA DEL PUEBLO ORCO con la princesa, que te sigue hasta el castillo (ck_escolta_princesa.js).
   (23/11, v6, nota 25 del dueño: "Grushak parado, no sentado"): en la Fortaleza espera DE PIE delante del trono, con la
   animación quieta del jefe (la misma que en la arena), mirando hacia la entrada.
   (23/11, v7, nota: "Grushak aparece aquí"): parado en (770, 184), sobre la alfombra delante del trono.
   Borrar su línea de index.html deja la pelea con Grushak en el trono, como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !window.CK_COLISEO) return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA;
  const PATIO = 'patio_fortaleza_orca', COL = 'coliseo_orco', FORT = 'fortaleza_orca', PUEBLO = 'pueblo_orco';
  if (!D || !D.mapas || !D.mapas[PATIO] || !D.mapas[COL] || !INTERIOR_LAYOUTS['ed_' + PATIO] || !INTERIOR_LAYOUTS['ed_' + COL]) return;
  const Z = { patio: 'ed_' + PATIO + '.main', col: 'ed_' + COL + '.main', fort: 'ed_' + FORT + '.main', pueblo: 'ed_' + PUEBLO + '.main' };
  const RONDAS = ['orc_campeon', 'cazador_ulrak', 'bestia_kragmor'];   // (14/11, nota 130) el del escudo, el huargo, el gorila
  const PUERTAS = [[356, 382], [1086, 374], [718, 322]];          // dónde aparece cada campeón (sin ck_coliseo_gradas.js)
  const REJAS = ['izq', 'der', 'arr'];                              // por qué reja entra cada uno (con ck_coliseo_gradas.js)
  const TRIBUNA = { x: 718, y: 128 }, TRONO_FORT = { x: 835, y: 178 }, GRUSHAK_PARADO = { x: 770, y: 184 };
  const LLEGA = { patio: { x: 40, y: 258 }, patioPuerta: { x: 214, y: 112 }, fort: { x: 140, y: 500 }, fortTrono: { x: 760, y: 250 }, pueblo: { x: 778, y: 50 }, col: { x: 718, y: 596 } };
  const fl = s => (s.flags = s.flags || {});
  const paso = s => (s && s.flags && s.flags.c2) || 0;
  const col = s => (fl(s).col = fl(s).col || { capturado: false, ronda: 0, libre: false });
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const vivo = e => e && e.active && !e.isDead;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };

  // ------------------------------------------------------------------ conexiones
  const envolver = (id, extra) => {
    const L = INTERIOR_LAYOUTS['ed_' + id];
    INTERIOR_LAYOUTS['ed_' + id] = function (kit) {
      const r = L.apply(this, arguments), a = kit.areas && kit.areas.main;
      if (a) { ['exits', 'talkers', 'actors', 'items', 'fx', 'colliders'].forEach(k => (a[k] = a[k] || [])); try { extra(a); } catch (e) { console.warn('[coliseo]', e); } }
      return r;
    };
  };
  envolver(PATIO, a => {
    a.exits.push({ x: 0, y: 200, w: 14, h: 110, key: 'walk', to: 'col_pueblo', hint: '◀ Pueblo Orco' });
    a.exits.push({ x: 186, y: 86, w: 56, h: 14, key: 'walk', to: 'col_fortaleza', hint: '▲ Fortaleza de Grushak' });
    a.talkers.push({ x: 214, y: 110, r: 34, lines: ['La puerta de la fortaleza. Adentro, en el trono, espera Grushak'] });
    a.fx.push({ type: 'ash', x: -40, y: -40, w: 1000, h: 560 });
  });
  envolver(COL, a => { a.fx.push({ type: 'dust', x: 220, y: 300, w: 1000, h: 380 }); });
  const cambiar0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (typeof nombre === 'string' && !this._doorTransition) {
      if (nombre === 'c2_fortaleza' && (paso(this.story) >= 6 || (window.CK_LIBRE && CK_LIBRE()))) { this.ckEntrar(PATIO, LLEGA.patio); return; }
      if (nombre === 'col_pueblo') { this.ckEntrar(PUEBLO, LLEGA.pueblo); return; }
      if (nombre === 'col_fortaleza') { this.ckEntrar(FORT, LLEGA.fort); return; }
      if (nombre === 'col_salida') {
        // (15/11, nota 47) se sale afuera del Pueblo Orco con la princesa, que te sigue hasta el castillo
        const s = this.story, f = s && fl(s);
        if (f && col(s).libre && !f.escoltada && window.CK_ESCOLTA) {
          f.escolta = true; if (paso(s) === 7) f.c2 = 8; this.saveStory && this.saveStory();
          this.ckEntrar('tierras_orcas', { x: 900, y: 140 });
          return;
        }
        this.ckEntrar(FORT, LLEGA.fortTrono); return;
      }
    }
    return cambiar0.apply(this, arguments);
  };
  const salir0 = P.exitInterior;
  P.exitInterior = function () {
    const z = zona(this);
    if (!this._doorTransition && z === Z.fort && this.ckEntrar(PATIO, LLEGA.patioPuerta)) return;
    if (!this._doorTransition && z === Z.col) return;         // del coliseo se sale por la reja, cuando se abre
    return salir0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ la fortaleza: Grushak en el trono
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try {
      const s = this.story; if (this._gameMode !== 'campaign' || !s) return r;
      const z = zona(this), c = col(s);
      this._colRey = null;
      if (z === Z.fort && paso(s) === 6 && !fl(s).grushak) {
        this._c2Jefe = true;                                   // ck_capitulo2.js ya no lo hace pelear acá
        const a = this.currentInterior.area;
        // (v6, nota 25) parado delante del trono (antes, sentado: 'ckc_rey_idle'); los pies de sus cuadros están en y = 92 de 100
        const ER = (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.orc_warlord) || {}, parado = this.textures.exists('orc_warlord_idle');
        // (v7, nota del dueño del 23/11: "Grushak aparece aquí") parado en la alfombra, delante del trono, a la izquierda
        const ry = parado ? GRUSHAK_PARADO.y : TRONO_FORT.y, rx = parado ? GRUSHAK_PARADO.x : TRONO_FORT.x;
        const rey = parado
          ? this.add.sprite(a.x + rx, a.y + ry, 'orc_warlord_idle').setOrigin(0.5, 0.92).setScale(ER.scale || 1.2).setDepth(a.y + ry).setFlipX(true)
          : this.add.sprite(a.x + TRONO_FORT.x, a.y + ry, 'ckc_rey_idle').setOrigin(0.5, 0.9).setScale(0.9).setDepth(a.y + ry);   // (15/11) +20 %
        if (parado && this.anims.exists('orc_warlord_idle')) rey.play('orc_warlord_idle');
        else this.tweens.add({ targets: rey, scaleY: 0.918, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        (a.objs || (a.objs = [])).push(rey);
        this._colRey = rey; this._colHablo = false; this._colEntro = this.time.now;
        // (15/11, nota 45) la guardia de la fortaleza se queda: hay que limpiarla antes de que Grushak hable
      }
      if (z === Z.col) armarColiseo(this);
      if (z === Z.fort) chicaDelTrono(this);
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };
  const hist0 = P.updateStory;
  P.updateStory = function () {
    const r = hist0.apply(this, arguments);
    try {
      const s = this.story, rey = this._colRey;
      if (this._gameMode !== 'campaign' || !s || !rey || !rey.active || this._colHablo || this.dialogOpen || this._ckEscena || zona(this) !== Z.fort) return r;
      // (15/11, nota 45) cuando no queda ningún orco de la guardia: Grushak muestra a la princesa y llegan los suyos
      const quedan = guardiaFort(this);
      if (!quedan && this.time.now - (this._colEntro || 0) > 2500) { this._colHablo = true; revelar(this); }
    } catch (e) {}
    return r;
  };
  const guardiaFort = S => (S.enemies ? S.enemies.getChildren().filter(e => vivo(e) && !e._c2Jefe && e.zone === Z.fort).length : 0);
  // (15/11, nota 45) la escena: la cámara al trono, Grushak habla, la cámara a la princesa encadenada, y la captura
  const revelar = S => {
    const E = window.CK_ESCENA, a = S.currentInterior.area, rey = S._colRey;
    const sigue = () => captura(S);
    if (!E || !E.correr) { S.openDialog('Grushak, el Caudillo', ['¿Buscabas a la hija de tu Rey? La tengo yo.'], sigue, 'orc_warlord_idle'); return; }
    E.correr(S, async () => {
      S.player.setVelocity && S.player.setVelocity(0, 0);
      await E.camara(S, TRONO_FORT.x - 40, TRONO_FORT.y + 10, 1000);
      if (rey && rey.active) S.tweens.add({ targets: rey, y: rey.y - 3, duration: 110, yoyo: true, repeat: 3 });
      son('orc_attack', 0.9, { rate: 0.6 });
      await E.dialogo(S, 'Grushak, el Caudillo', [
        'Bien, bien… Rompiste a toda mi guardia. Hacía años que nadie llegaba hasta mi trono.',
        'Ya sé a qué venís. Las caravanas, los quemados… y la hija de tu Rey.'
      ], 'orc_warlord_idle');
      await E.camara(S, SITIO.x, SITIO.y + 10, 900);
      const chica = (a.objs || []).find(o => o && o.active && o.texture && /^(npc8|ck_mira)_villager$/.test(o.texture.key) && Math.abs(o.x - a.x - SITIO.x) < 8);
      if (chica && E.globo) E.globo(S, chica, '¡Ayuda! ¡Es una trampa!', 2200);
      await E.dialogo(S, 'Grushak, el Caudillo', [
        'Mirala bien. La princesa Elia, encadenada a mis pies. Mi trofeo.',
        '¿Creíste que un gusano del castillo iba a llevársela así nomás? ¡JA!',
        '¡CLAN! ¡A ÉL! ¡Lo quiero vivo!'
      ], 'orc_warlord_idle');
      E.seguir(S);
    }).then(sigue).catch(sigue);
  };
  // la legión: orcos que entran por los bordes y cierran el círculo
  const captura = S => {
    const s = S.story, c = col(s), p = S.player;
    S._ckEscena = true; S.player.setVelocity(0, 0); if (p.body) p.body.enable = false;
    S.cameras.main.shake(900, 0.006); son('orc_attack', 1, { rate: 0.6 });
    const orcos = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, x0 = p.x + Math.cos(a) * 420, y0 = p.y + Math.sin(a) * 260, x1 = p.x + Math.cos(a) * 54, y1 = p.y + Math.sin(a) * 34;
      const tipo = ['orc', 'orc_armored', 'orc_elite'][i % 3];
      const o = S.add.sprite(x0, y0, tipo + '_idle').setScale(1.45).setDepth(y1 + 30).setFlipX(x1 < x0);
      if (S.anims.exists(tipo + '_walk')) o.play(tipo + '_walk');
      S.tweens.add({ targets: o, x: x1, y: y1, duration: 1500 + (i % 4) * 150, ease: 'Sine.easeOut', onUpdate: () => o.setDepth(o.y + 30), onComplete: () => S.anims.exists(tipo + '_idle') && o.play(tipo + '_idle') });
      orcos.push(o);
    }
    S.time.delayedCall(1200, () => S.createFloatingText(p.x, p.y - 50, '¡ESTÁS RODEADO!', 0xff6b6b));
    S.time.delayedCall(2600, () => {
      if (p.body) p.body.enable = true; S._ckEscena = false;
      c.capturado = true; c.ronda = c.ronda || 0; S.saveStory && S.saveStory();
      S.ckEntrar(COL, LLEGA.col);                              // el fundido y la pantalla de carga los pone ckEntrar
      S.time.delayedCall(300, () => orcos.forEach(o => o.destroy()));
    });
  };

  // ------------------------------------------------------------------ la chica de al lado del trono (nota 127)
  // (14/11) "aca es la princesa q esta aqui": la chica de la fortaleza (el dibujo de la princesa del castillo, npc8) es la
  // princesa Elia hasta que Grushak se la lleva al coliseo. Después de la arena, en ese lugar está Mira, la chica del bosque
  // de la que habla Elia, con otros colores (pelo castaño y vestido verde) para no confundirlas.
  const SITIO = { x: 640, y: 132 };
  const esElia = s => !!s && !col(s).capturado && !fl(s).grushak && paso(s) <= 6;
  const MIRA_COL = { f0e830: [178, 98, 50], b8b028: [122, 64, 36], '6098e8': [104, 166, 86], '4058c0': [56, 104, 64], '98d8f8': [178, 222, 142] };
  const texMira = S => {
    try {
      if (S.textures.exists('ck_mira_villager')) return true;
      if (!S.textures.exists('npc8_villager')) return false;
      const t0 = S.textures.get('npc8_villager'), im = t0.getSourceImage(), f0 = t0.get(0);
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        if (!px[i + 3]) continue;
        const c = MIRA_COL[((px[i] << 16) | (px[i + 1] << 8) | px[i + 2]).toString(16).padStart(6, '0')];
        if (c) { px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; }
      }
      g.putImageData(d, 0, 0);
      S.textures.addSpriteSheet('ck_mira_villager', cv, { frameWidth: f0.width, frameHeight: f0.height });
      const an = S.anims.get('npc8_idle');
      if (an && !S.anims.exists('ck_mira_idle'))
        S.anims.create({ key: 'ck_mira_idle', frames: an.frames.map(f => ({ key: 'ck_mira_villager', frame: f.textureFrame })), frameRate: an.frameRate, repeat: -1 });
      return S.textures.exists('ck_mira_villager');
    } catch (e) { console.warn('[coliseo] mira', e); return false; }
  };
  // su foto de presentación (ck_presentaciones) con los mismos colores: pelo rubio → castaño rojizo, vestido azul → verde
  // (la piel y el farol no se tocan). El arte de las presentaciones se carga después de este archivo: se hace al terminar
  // de cargar la página y, por las dudas, al entrar a la fortaleza.
  const retratoMira = () => { try {
    const A = window.CK_PRES_ARTE;
    if (A && A.retratos && A.retratos.mira && !A._ckMiraColor) {
      A._ckMiraColor = true;
      const im = new Image();
      im.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
          const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
          const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data;
          for (let i = 0; i < px.length; i += 4) {
            if (!px[i + 3]) continue;
            const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dd = mx - mn;
            let h = 0, s = mx ? dd / mx : 0, v = mx;
            if (dd) h = 60 * (mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4);
            if (h < 0) h += 360;
            if (h >= 38 && h <= 64 && s > 0.45) { h = 16 + (h - 38) * 0.35; v *= 0.8; }
            else if (h >= 180 && h <= 240 && s > 0.1 && v > 0.32) { h -= 100; s *= 0.72; v *= 0.88; }
            else continue;
            const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c, k = Math.floor(h / 60) % 6;
            const rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
            px[i] = Math.round((rgb[0] + m) * 255); px[i + 1] = Math.round((rgb[1] + m) * 255); px[i + 2] = Math.round((rgb[2] + m) * 255);
          }
          g.putImageData(d, 0, 0);
          A.retratos.mira = cv.toDataURL();
        } catch (e) { console.warn('[coliseo] retrato mira', e); }
      };
      im.src = A.retratos.mira;
    }
  } catch (e) {} };
  window.addEventListener('load', retratoMira);
  let escena = null;
  const chicaDelTrono = S => {
    escena = S; retratoMira();
    const s = S.story, a = S.currentInterior && S.currentInterior.area; if (!s || !a) return;
    const sp = (a.objs || []).find(o => o && o.active && o.texture && /^(npc8|ck_mira)_villager$/.test(o.texture.key) && Math.abs(o.x - a.x - SITIO.x) < 6 && Math.abs(o.y - a.y - SITIO.y) < 10);
    if (!sp) return;
    if (esElia(s)) return;
    if (texMira(S)) { sp.setTexture('ck_mira_villager'); if (S.anims.exists('ck_mira_idle')) sp.play('ck_mira_idle'); }
  };
  try {
    const M = typeof STORY_NPCS !== 'undefined' && STORY_NPCS.find(n => n.id === 'mira');
    if (M) {
      const l0 = M.lines;
      Object.defineProperty(M, 'name', { configurable: true, get: () => (escena && esElia(escena.story) ? 'Princesa Elia' : 'Mira') });
      Object.defineProperty(M, 'face', { configurable: true, get: () => (escena && !esElia(escena.story) && escena.textures.exists('ck_mira_villager') ? 'ck_mira_villager' : 'npc8_villager') });
      M.lines = (s, hero) => esElia(s) ? [
        '¡No! ¡No te acerques al trono!',
        'Soy Elia… la hija del Rey Aldric. Grushak me tiene acá encadenada desde hace semanas.',
        'Te está esperando. Dice que quiere ver de qué está hecho un héroe del castillo… ¡Es una trampa!'
      ] : l0(s, hero);
    }
  } catch (e) { console.warn('[coliseo] mira', e); }

  // ------------------------------------------------------------------ el coliseo
  const armarColiseo = S => {
    const s = S.story, c = col(s), a = S.currentInterior.area;
    if (S.enemies) S.enemies.getChildren().forEach(e => { if (vivo(e) && e.zone === Z.col) e.destroy(); });
    const t = CK_COLISEO.tribuna(S, TRIBUNA.x, TRIBUNA.y);
    if (fl(s).grushak) {                                       // ya terminó: la tribuna vacía y la princesa libre abajo
      t.rey.destroy(); t.princesa.destroy();
      liberar(S, false);
      return;
    }
    if (c.ronda >= 3) { S.time.delayedCall(1500, () => final(S)); return; }   // (14/11) sigue en el trono hasta que salta
    // (15/11, nota 46) la primera vez, la bienvenida de Grushak antes de presentar al primero
    if (!c.intro) { S.time.delayedCall(1400, () => bienvenida(S)); return; }
    S.time.delayedCall(1800, () => ronda(S));
  };
  const bienvenida = S => {
    const s = S.story, c = col(s), E = window.CK_ESCENA;
    if (zona(S) !== Z.col) return;
    const sigue = () => { c.intro = true; S.saveStory && S.saveStory(); ronda(S); };
    if (!E || !E.correr) { sigue(); return; }
    E.correr(S, async () => {
      await E.camara(S, TRIBUNA.x, TRIBUNA.y + 30, 1100);
      try { window.CK_COLISEO_GRADAS && CK_COLISEO_GRADAS.alboroto && CK_COLISEO_GRADAS.alboroto(S, 2, 3000); } catch (e) {}
      son('ck_cuerno_orco', 0.8) || son('orc_attack', 0.9, { rate: 0.6 });
      await E.dialogo(S, 'Grushak, el Caudillo', [
        '¡Despertó el gusano! Bienvenido a MI arena.',
        'Ahora te tengo donde quería. Mi clan quiere ver de qué está hecho un héroe del castillo… y yo también.',
        'Si sobrevivís a mis campeones, quizás hablemos de la chica. ¡Si no, serás comida para las bestias!',
        '¡Que salga mi primer guerrero!'
      ], 'orc_warlord_idle');
    }).then(sigue).catch(sigue);
  };
  // (15/11, nota 46) cómo presenta Grushak a cada uno, cada vez con más ganas (sale por su reja, la cámara lo sigue)
  const PRESENTA = [
    ['¡GORVAK, CAMPEÓN DE LA ARENA! Cien peleas… ¡y ni una derrota!', '¡Que su escudo te parta los dientes!'],
    ['¡ULRAK EL CAZADOR Y COLMILLO, SU HUARGO!', '¡NADIE se escapó NUNCA de esos colmillos! ¡CORRÉ, gusano, CORRÉ!'],
    ['¡¡KRAGMOR!! ¡¡LA BESTIA DE LAS FOSAS!!', '¡TRES DÍAS SIN COMER! ¡¡DESPEDAZALO, KRAGMOR!! ¡¡QUE NO QUEDE NADA!!']
  ];
  const ronda = S => {
    const s = S.story, c = col(s), a = S.currentInterior && S.currentInterior.area;
    if (!a || zona(S) !== Z.col || c.ronda >= 3) return;
    const tipo = RONDAS[c.ronda], [x, y] = PUERTAS[c.ronda], J = CK_COLISEO.JEFES[tipo];
    S.showZoneTitle && S.showZoneTitle('Ronda ' + (c.ronda + 1) + ' de 3', J.nombre);
    S.cameras.main.shake(500, 0.006); son('orc_attack', 0.9, { rate: 0.7 });
    const n = c.ronda;
    S.time.delayedCall(1600, () => {
      if (zona(S) !== Z.col) return;
      const GR = window.CK_COLISEO_GRADAS, E = window.CK_ESCENA;
      // (23/11, notas 22 a 24 del dueño: "de este lado sale grovak" / "de este lado sale el gorila" / "de este lado sale el
      // huargo"): cada uno por su reja, con la cámara encima: Gorvak por la izquierda, Ulrak y su huargo por la derecha y
      // Kragmor por la de arriba (antes salían los tres por la izquierda)
      const lado = REJAS[n] || 'izq';
      if (GR && E && E.correr && GR.PUERTA && GR.PUERTA[lado]) {   // (15/11) con la cámara encima y su presentación
        const pu = GR.PUERTA[lado];
        let e = null;
        const pelea = () => {
          if (!e && zona(S) === Z.col) { e = GR.entrar(S, lado, tipo, q => S.time.delayedCall(300, () => vivo(q) && S.alertEnemy(q))); if (e) e._colRonda = n; return; }
          if (vivo(e)) S.time.delayedCall(200, () => vivo(e) && S.alertEnemy(e));
        };
        E.correr(S, async () => {
          await E.camara(S, pu.a[0] + (lado === 'izq' ? 40 : lado === 'der' ? -40 : 0), pu.a[1] - (lado === 'arr' ? -10 : 20), 900);
          e = GR.entrar(S, lado, tipo, () => {});
          if (e) e._colRonda = n;
          await new Promise(r => setTimeout(r, 1700));
          if (vivo(e)) { if (lado !== 'arr') e.setFlipX(lado === 'der'); S.cameras.main.shake(300, 0.004 + n * 0.003); }
          try { GR.alboroto && GR.alboroto(S, 1.5 + n * 0.5, 2600); } catch (er) {}
          await E.dialogo(S, 'Grushak, el Caudillo', PRESENTA[n], 'orc_warlord_idle');
        }).then(pelea).catch(pelea);
        return;
      }
      if (GR) {                                                    // la reja se levanta y sale caminando de lo oscuro
        const e = GR.entrar(S, REJAS[n], tipo, e => S.time.delayedCall(300, () => vivo(e) && S.alertEnemy(e)));
        if (e) e._colRonda = n;
        return;
      }
      const e = S.spawnEnemy(a.x + x, a.y + y, tipo);
      if (!e) return;
      e.zone = Z.col; e._colRonda = n;
      if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'tierra', e.x, e.y + 30, 40, 500);
      S.time.delayedCall(700, () => vivo(e) && S.alertEnemy(e));
    });
  };
  // (14/11) entre ronda y ronda: Grushak comenta desde la tribuna y presenta al que sigue
  const DICHOS = {
    1: ['¿Gorvak…? ¿Mi campeón, tirado en la arena como un trapo viejo?', 'Muy bien, gusano. Eso fue sólo para abrir el apetito.', '¡Ahora vas a ver lo que es correr!'],
    2: ['¡GRRRAAAH! ¡¿Ni el huargo pudo con vos?!', '¡Se terminaron los juegos! ¡ABRAN LA FOSA!']
  };
  const entreRondas = (S, n) => {
    if (zona(S) !== Z.col) return;
    const E = window.CK_ESCENA, sigue = () => (col(S.story).ronda < 3 ? ronda(S) : final(S));
    const lineas = DICHOS[n];
    if (!lineas || !E || !E.correr) { S.time.delayedCall(1600, sigue); return; }
    E.correr(S, async () => {
      await E.camara(S, TRIBUNA.x, TRIBUNA.y + 30, 900);
      const rey = S._ckcRey;
      if (rey && rey.active) S.tweens.add({ targets: rey, y: rey.y - 3, duration: 120, yoyo: true, repeat: 2 });
      son('orc_attack', 0.7, { rate: 0.7 });
      try { window.CK_COLISEO_GRADAS && CK_COLISEO_GRADAS.alboroto && CK_COLISEO_GRADAS.alboroto(S); } catch (e) {}
      await E.dialogo(S, 'Grushak, el Caudillo', lineas, 'orc_warlord_idle');
    }).then(() => S.time.delayedCall(300, sigue)).catch(() => sigue());
  };
  // al vencer al tercero: se enfurece y salta de la tribuna a la arena
  const final = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a || zona(S) !== Z.col) return;
    const rey = S._ckcRey, E = window.CK_ESCENA, FX = window.CK_JEFES_FX;
    const tipo = ENEMY_TYPES.orc_warlord ? 'orc_warlord' : 'orc_elite';
    const LANDA = { x: TRIBUNA.x, y: 430 };
    const pelear = () => {
      if (zona(S) !== Z.col || S.enemies.getChildren().some(e => vivo(e) && e._c2Jefe)) return;
      const ya = S._ckPermitirBestias; S._ckPermitirBestias = true;
      let e = null; try { e = S.spawnEnemy(a.x + LANDA.x, a.y + LANDA.y - 26, tipo); } finally { S._ckPermitirBestias = ya; }
      if (e) { e._c2Jefe = true; e.zone = Z.col; S.time.delayedCall(500, () => vivo(e) && S.alertEnemy(e)); }
    };
    const salto = () => new Promise(r => {
      const x0 = rey && rey.active ? rey.x : a.x + TRIBUNA.x, y0 = rey && rey.active ? rey.y - 30 : a.y + TRIBUNA.y, x1 = a.x + LANDA.x, y1 = a.y + LANDA.y;
      if (rey && rey.active) S.tweens.add({ targets: rey, alpha: 0, duration: 250, onComplete: () => rey.setVisible(false) });
      const k = S.textures.exists(tipo + '_idle') ? tipo + '_idle' : null;
      const g = k ? S.add.sprite(x0, y0, k).setScale((ENEMY_TYPES[tipo] && ENEMY_TYPES[tipo].scale) || 1).setDepth(30000) : null;
      if (g && S.anims.exists(tipo + '_attack1')) g.play(tipo + '_attack1');
      const sombra = S.add.ellipse(x1, y1, 10, 4, 0x000000, 0.45).setDepth(y1 - 1);
      S.tweens.add({ targets: sombra, width: 60, height: 18, duration: 900, ease: 'Quad.easeIn' });
      try { FX && FX.sombraCaida && FX.sombraCaida(S, x1, y1, 46, 900); } catch (e) {}
      son('ck_silbido', 0.7, { rate: 0.8 });
      S.tweens.addCounter({ from: 0, to: 1, duration: 900, ease: 'Linear', onUpdate: tw => {
        const t = tw.getValue(); if (!g) return;
        g.x = x0 + (x1 - x0) * t; g.y = y0 + (y1 - 26 - y0) * t - Math.sin(t * Math.PI) * 120; g.angle = t * 20;
      }, onComplete: () => {
        if (g) g.destroy(); sombra.destroy();
        S.cameras.main.shake(700, 0.014); S.cameras.main.flash(250, 160, 60, 20);
        son('ck_pisoton_jefe', 1) || son('ck_derrumbe', 0.8);
        try { if (FX) { FX.grieta && FX.grieta(S, x1, y1, 60); FX.escombros && FX.escombros(S, x1, y1, 50, 14); } } catch (e) {}
        try { window.CK_COLISEO_GRADAS && CK_COLISEO_GRADAS.alboroto && CK_COLISEO_GRADAS.alboroto(S); } catch (e) {}
        r();
      } });
    });
    const escena = async () => {
      await E.camara(S, TRIBUNA.x, TRIBUNA.y + 30, 900);
      if (rey && rey.active) { rey.setTint(0xff7060); S.tweens.add({ targets: rey, x: rey.x + 2, duration: 50, yoyo: true, repeat: 8 }); }
      S.cameras.main.shake(500, 0.004); son('ck_cuerno_orco', 0.8) || son('orc_attack', 1, { rate: 0.6 });
      await E.dialogo(S, 'Grushak, el Caudillo', ['¡BASTA!', '¿Un gusano del castillo humillándome en MI arena, delante de MI clan?', '¡Lo haré yo mismo!'], 'orc_warlord_idle');
      son('orc_attack', 1, { rate: 0.5 });
      await salto();
      E.seguir(S);
    };
    if (E && E.correr) E.correr(S, escena).then(() => pelear()).catch(() => pelear());
    else salto().then(pelear);
  };
  // al caer, Grushak malherido suelta el cristal rojo y dice sus últimas palabras sobre la chica (ck_capitulo3.js);
  // cuando termina esa escena, la princesa queda libre (sin ck_capitulo3.js, a los 9 s)
  const trasCristal = (S, n = 0) => {
    if (zona(S) !== Z.col) return;
    const cr = fl(S.story).cristales || {};
    if ((!cr.rojo && n < 30) || S.dialogOpen || S._ckEscena) { S.time.delayedCall(300, () => trasCristal(S, n + 1)); return; }
    // (15/11, nota 47) Grushak, vencido, cumple la ley de la arena
    const E = window.CK_ESCENA, sigue = () => liberar(S, true);
    const L = ['Grrr… Te vas a arrepentir de tu decisión, humano.', 'Pero ganaste. Y en mi arena manda la ley: la chica es tuya, te la podés llevar.', '¡Abran la reja de abajo! ¡Que se vayan antes de que me arrepienta yo!'];
    if (E && E.correr) E.correr(S, async () => { await E.dialogo(S, 'Grushak, malherido', L, 'orc_warlord_idle'); }).then(sigue).catch(sigue);
    else S.openDialog('Grushak, malherido', L, sigue, 'orc_warlord_idle');
  };
  const liberar = (S, nueva) => {
    const a = S.currentInterior.area, s = S.story, c = col(s);
    c.libre = true;
    // la princesa baja a la arena; la reja de abajo se abre
    const x = a.x + 780, y = a.y + 596;
    if (!S._colPrin || !S._colPrin.active) {
      // (14/11, nota 129) la princesa del castillo del Rey (npc8), no el dibujo chico de antes
      const pr = S.textures.exists('npc8_villager') ? S.add.sprite(x, y, 'npc8_villager').setOrigin(0.5, 1).setScale(1.55).setDepth(y)
        : S.add.image(x, y, 'ckc_princesa').setOrigin(0.5, 1).setScale(0.95).setDepth(y);
      if (pr.play && S.anims.exists('npc8_idle')) pr.play('npc8_idle');
      (a.objs || (a.objs = [])).push(pr); S._colPrin = pr;
    }
    a.talkers = (a.talkers || []).filter(t => !t.colPrin);
    a.talkers.push({ x: 780, y: 590, r: 40, colPrin: true, lines: ['Princesa Elia: ¡Gracias! Pensé que nadie iba a venir a buscarme.',
      'Princesa Elia: Gorak sacó a Mira por las cocinas: ya va camino al bosque, con su padre.',
      'Princesa Elia: Sacame de acá, por favor. Te sigo hasta el castillo.'] });
    const salida = () => { if (!a.exits.some(e => e.to === 'col_salida')) a.exits.push({ x: 660, y: 616, w: 116, h: 26, key: 'walk', to: 'col_salida', hint: '▼ Salir del coliseo' }); };
    const GR = window.CK_COLISEO_GRADAS;
    if (GR && nueva) S.time.delayedCall(2400, () => zona(S) === Z.col && GR.abrir(S, 'aba', salida));
    else if (GR) { GR.abrir(S, 'aba'); salida(); }
    else salida();
    if (nueva) {
      S.time.delayedCall(1200, () => S.createFloatingText(x, y - 50, '¡Gracias, gracias!', 0xbfdbfe));
      S.time.delayedCall(2600, () => S.createFloatingText(a.x + 718, a.y + 660, 'La reja se abre', 0xfde68a));
    }
    S.saveStory && S.saveStory();
  };
  const ven0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = ven0.apply(this, arguments);
    try {
      const s = this.story; if (!s || !enemy || enemy.zone !== Z.col) return r;
      const c = col(s);
      if (enemy._colRonda !== undefined && enemy._colRonda === c.ronda) {
        c.ronda++; this.saveStory && this.saveStory(); this.updateObjective && this.updateObjective();
        this.health = Math.min(this.maxHealth, this.health + 2); this.updateHUD && this.updateHUD();
        this.time.delayedCall(800, () => this.player && this.createFloatingText(this.player.x, this.player.y - 46, '+2 ♥  ¡El público ruge!', 0x86efac));
        this.time.delayedCall(2200, () => entreRondas(this, c.ronda));
      }
      if (enemy._c2Jefe) this.time.delayedCall(2500, () => trasCristal(this));
    } catch (e) { console.warn('[coliseo]', e); }
    return r;
  };

  // ------------------------------------------------------------------ objetivo
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = this.story, box = document.getElementById('ck-objective'), el = box && box.querySelector('.ck-obj-text');
      if (!s || !el || paso(s) !== 6 || fl(s).grushak) return r;
      const c = col(s);
      const g = zona(this) === Z.fort ? guardiaFort(this) : 0;
      el.textContent = !c.capturado ? (zona(this) === Z.fort && g ? `Fortaleza Orca: limpiá la guardia de Grushak (quedan ${g})` : 'Fortaleza Orca: cruzá el patio y enfrentá a Grushak en su trono')
        : c.ronda < 3 ? `Coliseo Orco: sobreviví a los campeones de Grushak (${c.ronda}/3)` : 'Coliseo Orco: vencé a Grushak';
    } catch (e) {}
    return r;
  };

  // minimapa: las dos zonas nuevas con su dibujo real (lo arma ck_minimapa al pasar)
  try {
    const MM = window.CK_MINIMAPA;
    if (MM && MM.Z) {
      const G = 'Camino al Castillo';
      if (!MM.Z[Z.patio]) MM.Z[Z.patio] = { img: PATIO, esc: 4, w: 958, h: 534, ext: 1, n: 'Patio de la Fortaleza', g: G };
      if (!MM.Z[Z.col]) MM.Z[Z.col] = { img: COL, esc: 4, w: 1436, h: 758, ext: 1, n: 'Coliseo Orco', g: G };
    }
  } catch (e) {}
  window.CK_COLISEO_HISTORIA = { Z, RONDAS, ronda, final, liberar, captura };
})();
