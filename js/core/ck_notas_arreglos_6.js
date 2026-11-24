'use strict';
/* Arreglos de las notas del 23/11, tanda 11c (notas_para_corregir (6).json): el Camino y el patio del castillo en el Capítulo 3.
   - Nota 6 ("acá todos los NPC se enfrentan contra los demonios y algunos contra los caballeros negros"): en el Camino al
     Castillo, mientras le toca el caos, los soldados de Bruno ya no esperan a que un demonio les pase cerca: cada uno sale a
     pelear con el demonio más cercano (dos soldados como mucho por demonio; el que pelea con el héroe sigue con el héroe) y
     el demonio les pelea de vuelta. Además, frente al portón hay tres caballeros negros de Gaspar peleando con los soldados
     de ese lado; cuando el Camino queda libre, los que quedan se vuelven al castillo.
   - Nota 3 ("estos NPC aliados ayudan en esta instancia"): en el patio del castillo infestado (Capítulo 3, pasos 4 y 5) los dos
     lanceros de la escalinata del Gran Salón bajan a pelear con los demonios (caen y se levantan como los guardias) y después
     vuelven a su lugar.
   - Nota 2 ("los NPC no combatientes andan corriendo para refugiarse"): la primera vez que se entra al patio infestado, la
     gente que no pelea (la vendedora del puesto, el albañil y otros tres) sale corriendo a esconderse en la cocina y en la
     herrería, que después quedan trancadas (ck_capitulo3_castillo.js); la vendedora ya no se queda en el puesto y el puesto y
     los lanceros no dicen sus frases de siempre mientras dura esto.
   Va después de ck_capitulo3_castillo.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_CAPITULO3) return;
  const P = MainGameScene.prototype, C3 = window.CK_CAPITULO3;
  const zona = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => (S.currentInterior ? S.currentInterior.area : null);
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const c3 = s => (s && s.flags && s.flags.c3) || 0;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = a => a[Math.floor(Math.random() * a.length)];
  const E = () => window.CK_ESCENA;
  const sonar = (k, v, o) => { try { if (typeof sfx !== 'undefined') sfx.fx(k, v, o); } catch (e) {} };
  const vivo = e => e && e.active && !e.isDead;
  const esDemonio = e => vivo(e) && /^demonio_/.test(e.type || '');
  const ZCAM = 'ed_camino_al_castillo.main', PATIO = 'castle.courtyard';

  // ------------------------------------------------------------------ nota 6: el Camino, todos peleando
  const enCaminoCaos = S => { const s = st(S); return !!s && zona(S) === ZCAM && c3(s) === 3 && !!S.currentInterior && C3.estado && C3.estado(S) === 'caos'; };
  const MERCS = [[1300, 470], [1250, 500], [1360, 445]];          // frente al portón (de este lado los soldados [1090, 470] y [1210, 500])
  const caballeros = S => {
    if (S._ck6Mercs) return;
    S._ck6Mercs = [];
    const a = area(S), z = zona(S);
    MERCS.forEach(([x, y], i) => S.time.delayedCall(700 + i * 450, () => {
      if (zona(S) !== z || !enCaminoCaos(S) || !S._ck6Mercs) return;
      let m = null;
      S._ckPermitirBestias = true;                                 // (en el caos sólo salen demonios: estos sí)
      try { m = S.spawnEnemy(a.x + x, a.y + y, typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES.mercenario ? 'mercenario' : 'orc'); } finally { S._ckPermitirBestias = false; }
      if (!m) return;
      m.zone = ZCAM; m._ck6Merc = true; m._ckSinSusto = true; m._ckAullo = true; m._ckLlamadas = true;
      S._ck6Mercs.push(m);
    }));
  };
  const repliegue = S => {
    (S._ck6Mercs || []).forEach(m => {
      if (!vivo(m)) return;
      m._ckIntangible = true; m.state = 'idle'; try { m.setVelocity(0, 0); } catch (e) {}
      if (E()) E().globo(S, m, UNO(['¡Al castillo!', '¡Atrás, atrás!', '¡Replegarse!']), 1400);
      S.tweens.add({ targets: m, alpha: 0, delay: 900, duration: 700, onComplete: () => { try { if (m.hpBar) m.hpBar.destroy(); m.destroy(); } catch (e) {} } });
    });
    S._ck6Mercs = [];
  };
  /** Cada soldado sin pelea sale a buscar al demonio (o caballero negro) más cercano. */
  const parejas = S => {
    const A = area(S); if (!A || !A.actors || !S.enemies || !S.player) return;
    const now = S.time.now, p = S.player;
    const sold = A.actors.filter(t => t && t._c3Sold && t.sprite && t.sprite.active && !t.down);
    const ens = S.enemies.getChildren().filter(e => (esDemonio(e) || (vivo(e) && e._ck6Merc)) && !e._ckIntangible && e.state !== 'dormant');
    if (!sold.length || !ens.length) return;
    const cuenta = new Map();
    sold.forEach(t => { const e = t.fight && t.fight.enemy; if (vivo(e)) cuenta.set(e, (cuenta.get(e) || 0) + 1); });
    sold.forEach(t => {
      if (t.fight && vivo(t.fight.enemy)) return;
      let mejor = null, d0 = 1e9;
      ens.forEach(e => {
        if ((cuenta.get(e) || 0) >= 2 || e._rcJefe) return;                       // (el jefe es del héroe)
        if (Math.hypot(e.x - p.x, e.y - p.y) < 140) return;                       // el que pelea con el héroe, sigue con él
        const d = Math.hypot(e.x - t.sprite.x, e.y - t.sprite.y);
        if (d < 420 && d < d0) { d0 = d; mejor = e; }
      });
      if (!mejor) return;
      cuenta.set(mejor, (cuenta.get(mejor) || 0) + 1);
      t.fight = { enemy: mejor, called: true }; t.hitAt = now + 350; t.nav = {};
      const g = mejor._target;
      if (!g || !g.sprite || !g.sprite.active || g.down) mejor._target = t;      // y le pelea de vuelta
      if (mejor.state !== 'chase' && S.alertEnemy) S.alertEnemy(mejor);
    });
  };

  // ------------------------------------------------------------------ notas 3 y 2: el patio del castillo infestado
  const enCastillo = s => { const n = c3(s); return n >= 4 && n <= 5 && !fl(s).cap3_fin; };
  const patioSucio = s => { const c = fl(s).castillo; return !(c && c.patio && c.patio.ok); };
  const ESCALINATA = [[446, 202], [514, 202]];                     // los dos lanceros (ck_patio_muro.js)
  const VENDEDORA = [332, 266], PUESTO = [312, 272], FRASE_ESC = [480, 198];
  const guardias = S => {
    const A = area(S); if (!A) return;
    A.actors = (A.actors || []).filter(t => !t._ck6Guardia || (t.sprite && t.sprite.active));
    S.children.list.filter(o => o && o.active && o.type === 'Sprite' && o.texture && o.texture.key === 'g_templar_idle' &&
      ESCALINATA.some(([x, y]) => Math.abs(o.x - A.x - x) < 8 && Math.abs(o.y - A.y - y) < 8)).forEach(sp => {
      if (A.actors.some(t => t.sprite === sp)) return;
      A.actors.push({ type: 'walker', sprite: sp, pts: [[sp.x, sp.y, 600000]], i: 0, wait: 600000, speed: 28, idle: 'g_templar_idle', walk: 'g_templar_walk',
        lines: null, talkAt: 0, moving: false, role: 'guard', hp: 5, maxHp: 5, _ckAliado: true, _ck6Guardia: true });
    });
  };
  // el puesto y la escalinata, callados; la vendedora del puesto, afuera (está escondida)
  const silencio = S => {
    const A = area(S); if (!A) return;
    (A.talkers || []).forEach(t => {
      if ([PUESTO, FRASE_ESC].some(([x, y]) => Math.hypot(t.x - A.x - x, t.y - A.y - y) < 40)) t.talkAt = 9e15;
    });
    S.children.list.forEach(o => {
      if (o && o.active && o.visible && o.type === 'Sprite' && o.texture && o.texture.key === 'npc3_villager' && Math.hypot(o.x - A.x - VENDEDORA[0], o.y - A.y - VENDEDORA[1]) < 10) { o.setVisible(false); o._ck6Oculta = true; }
    });
  };
  // los que corren a esconderse: [hoja, x, y, refugio]
  const REFUGIO = { cocina: [232, 164], herreria: [727, 164] };   // las puertas (ck_patio_muro.js: de ahí sale el héroe al volver)
  const CORREN = [['npc3', 332, 266, 'cocina'], ['npc10', 640, 188, 'herreria'], ['npc7', 600, 330, 'herreria'], ['npc5', 380, 420, 'cocina'], ['npc12', 540, 300, 'herreria']];
  const corren = S => {
    const A = area(S); if (!A) return;
    const s = st(S); fl(s).c3_refugio = true; S.saveStory && S.saveStory();
    S._ck6Corren = [];
    CORREN.forEach(([k, x, y, ref], i) => {
      const key = k + '_villager'; if (!S.textures.exists(key)) return;
      const sp = S.add.sprite(A.x + x, A.y + y, key).setOrigin(0.5, 1).setScale(1.3).setDepth(A.y + y);
      if (S.anims.exists(k + '_walk')) sp.play(k + '_walk'); if (sp.anims) sp.anims.timeScale = 1.6;
      if (Array.isArray(S.currentInterior.objects)) S.currentInterior.objects.push(sp);
      const q = { sp, st: {}, g: [A.x + REFUGIO[ref][0], A.y + REFUGIO[ref][1]], t0: S.time.now + i * 260, hasta: S.time.now + 9000 + i * 260 };
      S._ck6Corren.push(q);
      if (i < 3 && E()) S.time.delayedCall(200 + i * 500, () => sp.active && E().globo(S, sp, UNO(['¡Al refugio!', '¡Corran, corran!', '¡Demonios! ¡Adentro!', '¡Cierren la puerta!']), 1300));
    });
    sonar('ck_grito', 0.35, { rate: 1.2 });
  };
  const correr = (S, dt) => {
    const L = S._ck6Corren; if (!L || !L.length) return;
    const now = S.time.now;
    S._ck6Corren = L.filter(q => {
      const sp = q.sp; if (!sp.active) return false;
      if (now < q.t0) return true;
      const r = now > q.hasta ? 'arrived' : S.navFollow(q.st, sp, q.g[0], q.g[1], 105, dt);
      sp.setDepth(sp.y);
      if (r === 'walking') return true;
      // llegó (o no hay camino): entra y se tranca
      sonar('door_open', 0.25, { minGap: 300 });
      S.tweens.add({ targets: sp, alpha: 0, duration: 260, onComplete: () => sp.destroy() });
      return false;
    });
  };

  // ------------------------------------------------------------------ enganches
  const ar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ar0 ? ar0.apply(this, arguments) : undefined;
    try {
      const S = this, s = st(S), z = zona(S);
      S._ck6Mercs = null; S._ck6Corren = null; S._ck6T = 0;
      if (!s) return r;
      // el Camino: después de que ck_capitulo3.js arma el caos (a los 650 ms)
      if (z === ZCAM) S.time.delayedCall(1500, () => { if (zona(S) === z && enCaminoCaos(S)) caballeros(S); });
      if (z === PATIO && enCastillo(s)) S.time.delayedCall(800, () => {
        if (zona(S) !== z) return;
        silencio(S);
        if (patioSucio(s)) guardias(S);
        // la primera vez: la gente corre a esconderse (cuando no hay una escena andando)
        if (patioSucio(s) && !fl(s).c3_refugio) {
          const ya = () => { if (zona(S) !== z) return; if (S._ckEscena || S.dialogOpen) { S.time.delayedCall(400, ya); return; } corren(S); };
          ya();
        }
      });
    } catch (e) { console.warn('[arreglos 6]', e); }
    return r;
  };
  const up0 = P.update;
  P.update = function (time, delta) {
    const r = up0.apply(this, arguments);
    try {
      const S = this, s = st(S); if (!s || !S.currentInterior) return r;
      const dt = Math.min(100, delta || 16), z = zona(S);
      if (z === ZCAM) {
        if (enCaminoCaos(S) && !S._ckEscena && (!S._ck6T || time - S._ck6T > 1200)) { S._ck6T = time; parejas(S); }
        if (S._ck6Mercs && S._ck6Mercs.length && C3.limpia && C3.limpia(s, ZCAM)) repliegue(S);
      }
      if (z === PATIO) correr(S, dt);
    } catch (e) { if (!P._ck6Err) { P._ck6Err = 1; console.warn('[arreglos 6]', e); } }
    return r;
  };
  window.CK_NOTAS_2311D = { parejas, caballeros, guardias, corren, MERCS, CORREN };
})();
