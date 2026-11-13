'use strict';
/* Secretos de los interiores nuevos y puertas cerradas (12/11, pedidos del dueño: "que los mapas nuevos tengan alguna función,
   los interiores: cosas que se rompen, notas, easter eggs o secretos escondidos, para que al jugador le den ganas de explorar…
   pero no dejes cosas tan obvias"; "las casas que no podemos ver por dentro: que el personaje diga que no se puede entrar o
   que no hay nada de interés").
   - SECRETOS: un punto chiquito en cada interior nuevo (el cartel "T · …" aparece sólo parado justo ahí, sin brillo ni marca).
     Dan monedas, una poción, curan, cuentan algo de la historia (el consejero que compra lanzas, el orco del escudo, las
     torres de hielo, la noche de las luces) o despiertan algo. Cada uno una sola vez (story.flags.secretos), salvo el caldero.
   - ROMPIBLES: dos o tres vasijas, cajones u ollas en cada interior (el arte y el premio de ck_rompibles.js: se rompen de un
     golpe y a veces dan monedas, un corazón o una poción). No son trampas.
   - PUERTAS CERRADAS: T delante de las casas que no tienen interior: el héroe dice por qué no se entra.
   Va después de ck_mas_interiores.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = id => 'ed_' + id + '.main';
  const azar = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------------ secretos (zona, punto, radio, cartel, qué pasa)
  const SECRETOS = [
    { id: 'herreria_carbon', z: Z('herreria_san_roque'), x: 344, y: 136, cartel: 'T · Revolver el carbón', titulo: 'Un papel entre el carbón',
      lineas: ['«Cien puntas de lanza y treinta escudos pintados de negro, para el señor consejero.»', '«Pagado por adelantado. Que no se entere el Capitán Bruno.»',
        'Debajo del papel, unas monedas tiznadas.'], oro: 12 },
    { id: 'posada_escalera', z: Z('posada_san_roque'), x: 352, y: 132, cartel: 'T · Mirar debajo de la escalera', titulo: 'Una tabla floja',
      lineas: ['Debajo de la escalera, una tabla del piso se mueve.', 'Adentro, una bolsita de cuero y un papel: «Para cuando vuelva. —R.»', 'R… ¿Ruy, el buhonero que nunca paga?'], oro: 20 },
    { id: 'posada_banio', z: Z('posada_san_roque_arriba'), x: 178, y: 104, cartel: 'T · Mirar el caño', titulo: 'En el caño de la ducha',
      lineas: ['Trabado en el caño, un anillo de plata con una inicial: una «L».', 'Lo vendés en la próxima tienda… o te lo guardás. Por ahora, vale unas monedas.'], oro: 25 },
    { id: 'capilla_reliquia', z: Z('capilla_san_roque'), x: 66, y: 196, cartel: 'T · Tocar la piedra floja', titulo: 'Una piedra floja en el ábside',
      lineas: ['Detrás de una piedra floja, un relicario de plata con un hueso diminuto.', 'Grabado en la tapa: «San Roque, que curó la peste, cuidá a los que vengan después.»',
        'Sentís un calor en el pecho. Las heridas se cierran.'], curar: true, pocion: 1 },
    { id: 'casita_espejo', z: Z('casita_cerco_san_roque'), x: 374, y: 196, cartel: 'T · Correr el paño del espejo', titulo: 'El espejo tapado',
      lineas: ['Corrés apenas el paño. Por un segundo, detrás de tu reflejo, ves torres blancas de hielo bajo un cielo verde.', 'Parpadeás. Es sólo tu cara.',
        'Volvés a tapar el espejo. Ahora entendés por qué está tapado.'] },
    { id: 'granja_plata', z: Z('casa_granjeros_san_roque'), x: 252, y: 150, cartel: 'T · Revisar las bolsas', titulo: 'Entre las bolsas de grano',
      lineas: ['Entre las bolsas, un frasco con monedas de cobre: los ahorros de la familia.', 'Lo dejás donde estaba.', '(Un héroe también se mide por lo que no se lleva.)'], honradez: true },
    { id: 'pastor_altillo', z: Z('casa_pastor_san_roque'), x: 176, y: 146, cartel: 'T · Subir dos escalones', titulo: 'En el altillo',
      lineas: ['Subís dos escalones y mirás entre los fardos.', 'Una flauta de pastor tallada en hueso. Adentro, enrolladas, unas monedas.', 'Soplás una nota: abajo, el pastor sonríe sin darse vuelta.'], oro: 15 },
    { id: 'molino_pesa', z: Z('molino_san_roque'), x: 384, y: 166, cartel: 'T · Levantar la pesa grande', titulo: 'La pesa limada',
      lineas: ['La pesa grande está limada por abajo: pesa menos de lo que dice.', 'El molinero cobra de más en cada bolsa de harina.', 'Te la guardás. Al Capitán de la guardia le va a interesar.'], marca: 'pesa_limada' },
    { id: 'chaman_caldero', z: Z('choza_chaman'), x: 240, y: 176, cartel: 'T · Probar el caldero', titulo: 'El caldero verde', siempre: true,
      lineas: ['Probás un sorbo del caldo verde. ¡Puaj!', '…pero las heridas se cierran solas.'], curar: true },
    { id: 'chaman_totem', z: Z('choza_chaman'), x: 150, y: 128, r: 16, cartel: 'T · Leer las runas', titulo: 'Las runas del tótem',
      lineas: ['Las runas brillan cuando las mirás de cerca. No sabés orco, pero una se repite: un escudo partido por un rayo.', 'Al pie del tótem alguien rayó en común: «el del escudo no cae… hasta que el escudo cae».'] },
    { id: 'jefe_mapa', z: Z('casa_jefe_orco'), x: 362, y: 184, cartel: 'T · Mirar debajo del trono', titulo: 'Debajo del trono',
      lineas: ['Un cuero con un mapa pintado: flechas rojas que bajan de la Fortaleza a la Frontera.', 'Al lado, un orco enorme dibujado con un escudo más grande que él.',
        'Y debajo del cuero, el tesoro del jefe.'], oro: 30 },
    { id: 'quemada_trampilla', z: Z('casa_quemada_norte'), x: 282, y: 108, r: 16, cartel: 'T · Asomarse a la trampilla', titulo: 'Un diario chamuscado',
      lineas: ['En el borde de la trampilla, un diario a medio quemar:', '«La noche de las luces, mi hijo bajó al sótano a esconderse. No volvió a subir. Ahora se oyen pasos abajo.»',
        'Abajo, algo se mueve.'], esqueletos: 2 }
  ];
  // ------------------------------------------------------------------ rompibles fijos por interior
  const ROMPIBLES = {
    [Z('herreria_san_roque')]: [['cajon', 46, 234], ['vasija', 284, 236]],
    [Z('posada_san_roque')]: [['cajon', 58, 232], ['vasija', 420, 236]],
    [Z('posada_san_roque_arriba')]: [['vasija', 300, 236]],
    [Z('casita_cerco_san_roque')]: [['vasija', 122, 198], ['canasto', 262, 230]],
    [Z('casa_granjeros_san_roque')]: [['canasto', 270, 156], ['vasija', 120, 232]],
    [Z('casa_pastor_san_roque')]: [['cajon', 344, 190], ['vasija', 120, 160]],
    [Z('molino_san_roque')]: [['cajon', 330, 186], ['vasija', 356, 200], ['cajon', 132, 156]],
    [Z('choza_chaman')]: [['olla_orca', 180, 194], ['olla_orca', 300, 190]],
    [Z('casa_jefe_orco')]: [['olla_orca', 120, 150], ['cajon', 182, 232], ['tambor', 330, 124]],
    [Z('casa_quemada_norte')]: [['urna', 212, 140], ['vasija', 330, 226], ['urna', 196, 60]]
  };
  // ------------------------------------------------------------------ puertas cerradas: [zona, x0, x1, y0, y1, frases]
  const RUINA = ['El techo se vino abajo. Adentro no queda nada.', 'Está todo derrumbado. Mejor no meterse.', 'Escombros y hollín. Nada que valga la pena.'];
  const CERRADAS = [
    ['ruins.village', 335, 445, 486, 524, RUINA],
    ['ruins.village', 150, 230, 456, 492, ['El molino está quemado por dentro. Las aspas crujen con el viento.']],
    [Z('campos_del_roble'), 570, 665, 424, 462, ['Nadie atiende. Por la ventana se ve una mesa servida… y nadie.', 'La puerta está trancada desde adentro.']],
    [Z('campos_del_roble'), 545, 590, 98, 132, ['El molino está cerrado con cadena. El molinero se fue a Brumavieja y no volvió.']],
    [Z('san_roque'), 270, 322, 600, 646, ['Ahí adentro sólo hay gallinas. Y no parecen contentas de verme.']],
    [Z('norte_del_roble'), 360, 545, 630, 684, RUINA], [Z('norte_del_roble'), 880, 1030, 630, 684, RUINA],
    [Z('tierras_orcas'), 570, 632, 106, 140, ['La escalera de la torre está rota. No se puede subir.']]
  ];

  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const zona = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const fl = S => { const s = S.story; if (!s) return {}; s.flags = s.flags || {}; return (s.flags.secretos = s.flags.secretos || {}); };
  const secretoCerca = S => {
    if (!S.currentInterior || !S.currentInterior.area || !S.player || !S.story) return null;
    const z = zona(S), a = S.currentInterior.area, p = pies(S), hechos = fl(S);
    return SECRETOS.find(s => s.z === z && (s.siempre ? !(S._ckSecVisto || {})[s.id] : !hechos[s.id]) && Math.hypot(p.x - (a.x + s.x), p.y - (a.y + s.y)) < (s.r || 14)) || null;
  };
  const cerradaCerca = S => {
    if (!S.currentInterior || !S.currentInterior.area || !S.player) return null;
    const z = zona(S), a = S.currentInterior.area, p = pies(S);
    return CERRADAS.find(c => c[0] === z && p.x > a.x + c[1] && p.x < a.x + c[2] && p.y > a.y + c[3] && p.y < a.y + c[4]) || null;
  };
  const son = (k, v) => { try { return sfx.fx(k, v); } catch (e) { return false; } };
  const revelar = (S, s) => {
    const a = S.currentInterior.area, st = S.story, x = a.x + s.x, y = a.y + s.y;
    if (s.siempre) (S._ckSecVisto = S._ckSecVisto || {})[s.id] = true; else fl(S)[s.id] = true;
    const total = SECRETOS.filter(q => !q.siempre).length, n = Object.keys(fl(S)).filter(k => SECRETOS.some(q => q.id === k)).length;
    const premio = () => {
      let t = [];
      if (s.oro) { st.coins += s.oro; t.push('+' + s.oro + ' monedas'); son('coin', 0.5); }
      if (s.pocion && st.inv) { st.inv.potion = (st.inv.potion || 0) + s.pocion; t.push('+' + s.pocion + ' POCIÓN'); }
      if (s.curar) { S.health = S.maxHealth; S.updateHUD && S.updateHUD(); t.push('vida llena'); son('heal', 0.6); }
      if (s.honradez) st.flags.honrado = true;
      if (s.marca) st.flags[s.marca] = true;
      if (t.length) S.createFloatingText(x, y - 40, t.join(' · '), 0xfde68a);
      if (!s.siempre) S.time.delayedCall(700, () => S.createFloatingText(x, y - 56, 'Secreto ' + n + ' de ' + total, 0xfcd34d));
      if (s.esqueletos && S.spawnEnemy && typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.skeleton) {
        S.time.delayedCall(500, () => {
          for (let i = 0; i < s.esqueletos; i++) { const e = S.spawnEnemy(x + (i ? 26 : -26), y + 26, 'skeleton'); if (e) e.zone = zona(S); }
          S.cameras.main.shake(200, 0.006);
        });
      }
      S.updateObjective && S.updateObjective(); S.updateQuickBar && S.updateQuickBar(); S.saveStory && S.saveStory();
    };
    son('book_clasp', 0.6);
    if (S.openDialog) S.openDialog(s.titulo, s.lineas, premio, null); else premio();
  };

  // ------------------------------------------------------------------ T
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && !this._doorTransition && this._gameMode === 'campaign' && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) {
        const s = secretoCerca(this); if (s) { revelar(this, s); return; }
        const c = cerradaCerca(this);
        if (c && (!this._ckCerrAt || this.time.now - this._ckCerrAt > 1500)) {
          this._ckCerrAt = this.time.now;
          const f = c[5][Math.floor(Math.random() * c[5].length)];
          this.createFloatingText(this.player.x, this.player.y - 48, f, 0xe5e7eb);
          son('door_locked', 0.4);
          return;
        }
      }
    } catch (e) { console.warn('[secretos]', e); }
    return i0.apply(this, arguments);
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt'); if (!pr || !this.currentInterior) return r;
      const s = this.dialogOpen ? null : secretoCerca(this), txt = s ? s.cartel : '';
      if (txt && (!pr.classList.contains('on') || this._ckSecPr)) { pr.textContent = txt; pr.classList.add('on'); this._ckSecPr = txt; }
      else if (!txt && this._ckSecPr) { if (pr.textContent === this._ckSecPr) pr.classList.remove('on'); this._ckSecPr = ''; }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ rompibles en los interiores (después de los de ck_rompibles)
  const ponerRompibles = S => {
    const R = window.CK_ROMPIBLES, lista = ROMPIBLES[zona(S)];
    if (!R || !lista || !S.currentInterior || !S.currentInterior.area || S._gameMode !== 'campaign') return;
    const a = S.currentInterior.area; S._ckRomp = S._ckRomp || [];
    lista.forEach(([k, x0, y0]) => {
      let key = null; try { key = R.texPaleta(S, k, zona(S)); } catch (e) {} if (!key) return;
      let x = a.x + x0, y = a.y + y0;
      if (S.navIsFree && !S.navIsFree(x, y)) {                                   // si justo ahí hay algo, el lugar libre más cerca
        let mejor = null;
        for (let d = 4; d <= 24 && !mejor; d += 4) for (let t = 0; t < 8 && !mejor; t++) { const xx = x + Math.cos(t * Math.PI / 4) * d, yy = y + Math.sin(t * Math.PI / 4) * d; if (S.navIsFree(xx, yy)) mejor = [xx, yy]; }
        if (!mejor) return; [x, y] = mejor;
      }
      const sp = S.add.image(x, y, key).setOrigin(0.5, 1).setDepth(Math.round(y));
      const w = Math.round(sp.displayWidth * 0.7), h = 7, zz = S.add.zone(x, y - h / 2, w, h);
      S.physics.add.existing(zz, true);
      const col = S.physics.add.collider(S.player, zz), colE = S.enemies ? S.physics.add.collider(S.enemies, zz, null, S.enemyHitsTerrain, S) : null;
      sp.on('destroy', () => { try { col.destroy(); if (colE) colE.destroy(); zz.destroy(); } catch (e) {} });
      S._ckRomp.push({ sp, k, x, y, rompible: true, _ckSec: true });
    });
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try {
      this._ckSecVisto = {};
      const z = zona(this);
      if (ROMPIBLES[z]) this.time.delayedCall(700, () => { try { if (zona(this) === z) ponerRompibles(this); } catch (e) { console.warn('[secretos]', e); } });
    } catch (e) {}
    return r;
  };
  window.CK_SECRETOS = { SECRETOS, ROMPIBLES, CERRADAS };
})();
