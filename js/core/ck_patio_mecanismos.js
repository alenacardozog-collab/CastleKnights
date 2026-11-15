'use strict';
/* El Patio de la Fortaleza Orca con secciones y mecanismos (15/11, nota 40 del dueño: "en este mapa al llegar acá habrá
   enemigos en las diferentes secciones y rompiendo cosas hay que activar cosas que abren la puerta para la guarida del
   caudillo; acá al explorar todo se abre la puerta de abajo donde hay un contingente de orcos élite, y ellos me sueltan la
   llave para entrar al cuartel del caudillo").
   Mientras se busca a Grushak (Capítulo 2, paso 6, antes de la captura):
   - ORCOS en las secciones del patio: la entrada del oeste, el rincón del noroeste, el del noreste (pasando el portón del
     norte, que se rompe) y el medio. Los de cada sección no vuelven una vez vencidos.
   - TRES MECANISMOS escondidos en cajones (uno en el noroeste, uno en el noreste y uno en el medio): se rompe el cajón y
     aparece una palanca; T la baja (se oye una cadena lejos). "Mecanismos 2/3" en el cartel de objetivo.
   - Con los tres: se abren la PUERTA DE ABAJO (la del pasillo del medio, que hasta entonces no se rompe a golpes) y la
     empalizada del sur, y sale la GUARDIA DE ÉLITE de delante del cuartel (cinco orcos). El último en caer suelta la LLAVE.
   - Con la llave: T en la puerta en arco (el cuartel del Caudillo, abajo a la derecha) entra a la fortaleza. La puerta
     grande del noroeste queda trancada desde adentro hasta tener la llave.
   Guardado en story.flags.fo = { pal: {n: true}, abierta, guardia, llave, sec: {nombre: true} }. En la práctica (todo
   abierto) y después de la captura, todo queda abierto como antes. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const MAPA = 'patio_fortaleza_orca', Z = 'ed_' + MAPA + '.main', FORT = 'fortaleza_orca';
  const R = (a, b) => a + Math.random() * (b - a);
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const vivo = e => e && e.active && !e.isDead;
  const fl = s => (s.flags = s.flags || {});
  const fo = s => (fl(s).fo = fl(s).fo || { pal: {}, sec: {} });
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const activo = S => {
    const s = S && S._gameMode === 'campaign' && S.story;
    if (!s || (window.CK_LIBRE && CK_LIBRE())) return false;
    const f = fl(s), c = f.col || {};
    return (f.c2 || 0) === 6 && !c.capturado && !f.grushak;
  };

  // ------------------------------------------------------------------ dónde
  const SECCIONES = {
    oeste: [['orc', 250, 440], ['orc', 340, 460], ['orc_armored', 300, 400]],
    noroeste: [['orc', 330, 150], ['orc_armored', 380, 160], ['orc', 300, 190]],
    noreste: [['orc', 800, 160], ['orc_elite', 860, 170], ['orc', 900, 190], ['orc_armored', 760, 200]],
    medio: [['orc', 620, 300], ['orc_armored', 680, 285]]
  };
  const CAJONES = [[1, 360, 168], [2, 870, 178], [3, 700, 296]];   // [n, x, y (pie)]
  const GUARDIA = [['orc_elite', 700, 420], ['orc_elite', 760, 440], ['orc_elite', 820, 420], ['orc_armored', 740, 470], ['orc_elite', 800, 470]];
  const ARCO = { x: 764, y: 376, r: 34 };                          // delante de la puerta en arco (el cuartel)
  // la empalizada del sur (entre el pasillo y el frente del cuartel): una puerta más del terreno rompible
  const EMPALIZADA = { borrar: [[568, 438, 622, 506]], choque: [[566, 440, 624, 504]], corta: [560, 436, 630, 508], rellena: 'h', vida: 6 };
  const PUERTAS_MEC = ['puerta:' + MAPA + ':1', 'puerta:' + MAPA + ':2'];
  try {
    const TR = window.CK_TERRENO_ROMPIBLE, M = TR && TR.MAPAS && TR.MAPAS[MAPA];
    if (M && M.puertas && M.puertas.length === 2) M.puertas.push(EMPALIZADA);
  } catch (e) {}

  // ------------------------------------------------------------------ dibujos por código
  const tex = S => {
    if (!S.textures.exists('ckpm_palanca')) {
      const W = 12, H = 16, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H;
      const g = cv.getContext('2d'), px = (f, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(f * W + x, y, w || 1, h || 1); };
      [0, 1].forEach(f => {
        px(f, '#3a2a1c', 2, 11, 8, 4); px(f, '#5b4029', 3, 11, 6, 3); px(f, '#2a1d12', 2, 15, 8, 1);        // la base de madera
        px(f, '#6b6f7a', 5, 10, 2, 2);                                                                      // el eje
        if (!f) { px(f, '#8a8f99', 4, 3, 1, 8); px(f, '#8a8f99', 5, 3, 1, 7); px(f, '#c0392b', 3, 1, 4, 3); px(f, '#e8665a', 4, 1, 1, 1); }   // arriba
        else { px(f, '#8a8f99', 6, 7, 5, 1); px(f, '#8a8f99', 7, 8, 4, 1); px(f, '#c0392b', 9, 5, 3, 4); px(f, '#e8665a', 10, 5, 1, 1); }  // bajada
      });
      const t = S.textures.addCanvas('ckpm_palanca', cv); t.add(0, 0, 0, 0, W, H); t.add(1, 0, W, 0, W, H);
    }
    if (!S.textures.exists('ckpm_llave')) {
      const cv = document.createElement('canvas'); cv.width = 14; cv.height = 8;
      const g = cv.getContext('2d'), px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
      px('#7a5a1a', 0, 1, 5, 5); px('#e0b040', 1, 2, 3, 3); px('#3a2a10', 2, 3, 1, 1);
      px('#e0b040', 5, 3, 8, 2); px('#7a5a1a', 5, 5, 8, 1); px('#e0b040', 10, 5, 1, 2); px('#e0b040', 12, 5, 1, 3); px('#fff4c0', 6, 3, 3, 1);
      S.textures.addCanvas('ckpm_llave', cv);
    }
    if (!S.textures.exists('ckpm_cajon')) {
      const cv = document.createElement('canvas'); cv.width = 20; cv.height = 18;
      const g = cv.getContext('2d'), px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
      px('#2a1d12', 0, 2, 20, 16); px('#6b4a2c', 1, 3, 18, 14); px('#4f3520', 1, 9, 18, 1); px('#8a6240', 2, 4, 16, 1);
      px('#4f3520', 3, 4, 1, 12); px('#4f3520', 16, 4, 1, 12); px('#5b4029', 4, 5, 12, 1); px('#3a2a1c', 0, 0, 20, 2); px('#6b6f7a', 9, 1, 2, 2);
      S.textures.addCanvas('ckpm_cajon', cv);
    }
  };

  // ------------------------------------------------------------------ armar el patio
  const objs = S => (S._ckPM = S._ckPM || { cosas: [], palancas: [], guardia: [] });
  const limpiar = S => { const M = S._ckPM; if (M) M.cosas.forEach(o => { try { o && o.active && o.destroy(); } catch (e) {} }); S._ckPM = null; };
  const poner = (S, o) => { objs(S).cosas.push(o); return o; };
  const bestia = (S, a, tipo, x, y) => {
    if (typeof ENEMY_TYPES === 'undefined' || !ENEMY_TYPES[tipo]) return null;
    const ya = S._ckPermitirBestias; S._ckPermitirBestias = true;
    let e = null; try { e = S.spawnEnemy(a.x + x, a.y + y, tipo); } finally { S._ckPermitirBestias = ya; }
    if (e) { e.zone = Z; if (S.placeEnemyClear && !S.placeEnemyClear(e)) { e.destroy(); return null; } }
    return e;
  };
  const armar = S => {
    limpiar(S);
    if (zona(S) !== Z || !S.currentInterior || !activo(S)) return;
    tex(S);
    const s = S.story, F = fo(s), a = S.currentInterior.area, M = objs(S);
    // orcos por sección (los de las secciones ya limpias no vuelven)
    Object.keys(SECCIONES).forEach(sec => {
      if (F.sec[sec]) return;
      SECCIONES[sec].forEach(([t, x, y]) => { const e = bestia(S, a, t, x, y); if (e) e._pmSec = sec; });
    });
    // los cajones con los mecanismos (los de las palancas ya bajadas quedan como palanca abajo)
    CAJONES.forEach(([n, x, y]) => {
      if (F.pal[n]) { palanca(S, a, n, x, y, true); return; }
      if (F['caja' + n]) { palanca(S, a, n, x, y, false); return; }
      const sp = poner(S, S.add.image(a.x + x, a.y + y, 'ckpm_cajon').setOrigin(0.5, 1).setScale(1.3).setDepth(a.y + y));
      const zn = poner(S, S.add.zone(a.x + x, a.y + y - 4, 22, 8)); S.physics.add.existing(zn, true); S.interiorObstacles && S.interiorObstacles.add(zn);
      const r = { uid: 'ckpm_cajon_' + n, key: 'ckpm_cajon', sp, zonas: [zn], vida: 2, max: 2, peso: 'liviano', X: sp.x, _pm: n,
        caja: { x0: sp.x - sp.displayWidth / 2, x1: sp.x + sp.displayWidth / 2, y0: sp.y - sp.displayHeight, y1: sp.y }, abre: null, premio: false };
      M.cajas = (M.cajas || []).concat([{ r, n, x, y }]);
    });
    S.time.delayedCall(450, () => { if (S._ckPM === M) (M.cajas || []).forEach(c => { S._ckTerr = S._ckTerr || []; if (S._ckTerr.indexOf(c.r) < 0) S._ckTerr.push(c.r); }); });
    // ya abierto: la guardia (si falta) y la llave en el piso (si no se juntó)
    if (F.abierta && !F.guardia) S.time.delayedCall(600, () => guardia(S));
    if (F.guardia && !F.llave && F.llaveAt) llaveEnPiso(S, a, F.llaveAt[0], F.llaveAt[1]);
  };
  const palanca = (S, a, n, x, y, bajada) => {
    const sp = poner(S, S.add.image(a.x + x, a.y + y, 'ckpm_palanca', bajada ? 1 : 0).setOrigin(0.5, 1).setScale(1.5).setDepth(a.y + y));
    objs(S).palancas.push({ n, sp, x, y, bajada });
    if (!bajada) S.tweens.add({ targets: sp, y: sp.y - 1, duration: 500, yoyo: true, repeat: -1 });
  };
  const contar = s => Object.keys(fo(s).pal).filter(k => fo(s).pal[k]).length;
  const bajar = (S, q) => {
    const s = S.story, F = fo(s), a = S.currentInterior.area;
    q.bajada = true; F.pal[q.n] = true; S.tweens.killTweensOf(q.sp); q.sp.setFrame(1).setY(a.y + q.y);
    son('bridge_move', 0.7, { rate: 1.2 }) || son('door_gate', 0.6); S.cameras.main.shake(300, 0.004);
    const n = contar(s);
    S.createFloatingText(q.sp.x, q.sp.y - 36, n < 3 ? `Una cadena se tensa a lo lejos… (${n}/3)` : '¡Algo pesado se abre abajo!', 0xfde68a);
    S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective();
    if (n >= 3) S.time.delayedCall(900, () => abrir(S));
  };
  const abrir = S => {
    const s = S.story, F = fo(s); if (F.abierta) return;
    F.abierta = true; S.saveStory && S.saveStory();
    const TR = window.CK_TERRENO_ROMPIBLE, E = window.CK_ESCENA;
    const romperPuertas = () => (TR ? TR.lista(S) : []).filter(r => PUERTAS_MEC.indexOf(r.uid) >= 0 && !r.roto).forEach(r => { r.vida = 0; try { TR.romper(S, r); } catch (e) {} });
    const seguir = () => { S._navGrid = null; guardia(S); S.updateObjective && S.updateObjective(); };
    if (E && E.correr && E.camara) {
      E.correr(S, async () => {
        await E.camara(S, 520, 370, 900);
        romperPuertas(); son('ck_puerta_rota', 0.9) || son('door_gate', 0.8, { rate: 0.7 }); S.cameras.main.shake(500, 0.006);
        await new Promise(r => setTimeout(r, 900));
        await E.camara(S, 760, 420, 900);
        son('ck_cuerno_orco', 0.8) || son('orc_attack', 0.9, { rate: 0.6 });
        S.createFloatingText(S.currentInterior.area.x + 764, S.currentInterior.area.y + 330, '¡La guardia del Caudillo!', 0xff6b6b);
        await new Promise(r => setTimeout(r, 1300));
      }).then(seguir).catch(seguir);
    } else { romperPuertas(); seguir(); }
  };
  const guardia = S => {
    const s = S.story, F = fo(s), a = S.currentInterior && S.currentInterior.area; if (!a || zona(S) !== Z || F.guardia) return;
    const M = objs(S); if (M.guardia.some(vivo)) return;
    M.guardia = GUARDIA.map(([t, x, y]) => { const e = bestia(S, a, t, x, y); if (e) { e._pmGuardia = true; S.time.delayedCall(400, () => vivo(e) && S.alertEnemy && S.alertEnemy(e)); } return e; }).filter(Boolean);
  };
  const llaveEnPiso = (S, a, x, y) => {
    const k = poner(S, S.add.image(a.x + x, a.y + y, 'ckpm_llave').setOrigin(0.5, 1).setScale(1.6).setDepth(a.y + y));
    S.tweens.add({ targets: k, y: k.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    objs(S).llave = { sp: k, x, y };
  };

  // ------------------------------------------------------------------ al pasar cosas
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0 ? a0.apply(this, arguments) : undefined;
    try { const S = this; S.time.delayedCall(320, () => { try { armar(S); } catch (e) { console.warn('[patio mecanismos]', e); } }); } catch (e) {}
    return r;
  };
  const od0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = od0 ? od0.apply(this, arguments) : undefined;
    try {
      const S = this, s = S.story; if (!s || !enemy || zona(S) !== Z || !activo(S)) return r;
      const F = fo(s), a = S.currentInterior.area;
      if (enemy._pmSec && !S.enemies.getChildren().some(e => vivo(e) && e._pmSec === enemy._pmSec)) { F.sec[enemy._pmSec] = true; S.saveStory && S.saveStory(); }
      if (enemy._pmGuardia && !S.enemies.getChildren().some(e => vivo(e) && e._pmGuardia)) {
        F.guardia = true; F.llaveAt = [Math.round(enemy.x - a.x), Math.round(enemy.body ? enemy.body.bottom - a.y : enemy.y - a.y)];
        S.saveStory && S.saveStory();
        S.time.delayedCall(700, () => { if (zona(S) === Z && objs(S)) { llaveEnPiso(S, a, F.llaveAt[0], F.llaveAt[1]); S.createFloatingText(enemy.x, enemy.y - 50, '¡Soltó una llave!', 0xfde68a); son('coin', 0.6, { rate: 0.7 }); } });
        S.updateObjective && S.updateObjective();
      }
    } catch (e) {}
    return r;
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      const S = this, M = S._ckPM; if (!M || zona(S) !== Z || !S.player || !S.player.body) return r;
      const s = S.story, F = fo(s), a = S.currentInterior.area, b = S.player.body, px = b.center.x - a.x, py = b.bottom - a.y;
      // los cajones rotos dejan la palanca
      (M.cajas || []).forEach(c => { if (c.r.roto && !c.listo) { c.listo = true; F['caja' + c.n] = true; palanca(S, a, c.n, c.x, c.y, false); S.createFloatingText(a.x + c.x, a.y + c.y - 30, 'Hay una palanca escondida', 0xfde68a); S.saveStory && S.saveStory(); } });
      // la puerta de abajo y la empalizada no se rompen a golpes mientras no se abren con los mecanismos
      if (!F.abierta) {
        const TR = window.CK_TERRENO_ROMPIBLE;
        (TR ? TR.lista(S) : []).forEach(q => {
          if (PUERTAS_MEC.indexOf(q.uid) < 0 || q.roto) return;
          if (q.max < 900) { q.max = 999; q.vida = 999; }
          if (q.vida < 999) { q.vida = 999; if (!S._pmAviso || S.time.now - S._pmAviso > 2500) { S._pmAviso = S.time.now; S.createFloatingText(S.player.x, S.player.y - 46, 'Está trancada con cadenas: debe haber un mecanismo', 0xfca5a5); } }
        });
      }
      // la llave en el piso
      if (M.llave && M.llave.sp.active && Math.hypot(px - M.llave.x, py - M.llave.y) < 20) {
        M.llave.sp.destroy(); M.llave = null; F.llave = true; S.saveStory && S.saveStory();
        S.createFloatingText(S.player.x, S.player.y - 50, '🗝 Llave del cuartel del Caudillo', 0xfde68a); son('quest_done', 0.7) || son('coin', 0.7);
        S.updateObjective && S.updateObjective();
      }
      // el cartel para T
      const q = M.palancas.find(p => !p.bajada && Math.hypot(px - p.x, py - p.y) < 30);
      const arco = Math.hypot(px - ARCO.x, py - ARCO.y) < ARCO.r;
      S._pmCerca = q ? { tipo: 'palanca', q } : arco ? { tipo: 'arco' } : null;
    } catch (e) {}
    return r;
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const c = this._pmCerca;
      if (c && zona(this) === Z && !this.dialogOpen && !this._overlay && !this._doorTransition) {
        if (c.tipo === 'palanca') { bajar(this, c.q); this._pmCerca = null; return; }
        if (c.tipo === 'arco') {
          const s = this.story, F = s && fo(s);
          if (activo(this) && !F.llave) { this.createFloatingText(this.player.x, this.player.y - 46, 'El cuartel del Caudillo. Cerrado con llave.', 0xfca5a5); son('door_locked', 0.6) || son('door_close', 0.4); return; }
          son('puerta_abre', 0.7) || son('door_open', 0.7);
          this.ckEntrar(FORT, { x: 140, y: 500 });
          return;
        }
      }
    } catch (e) {}
    return i0.apply(this, arguments);
  };
  // la puerta grande del noroeste: trancada desde adentro mientras se busca la llave
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    try {
      if (nombre === 'col_fortaleza' && !this._doorTransition && activo(this) && !fo(this.story).llave) {
        if (!this._pmTranca || this.time.now - this._pmTranca > 2500) {
          this._pmTranca = this.time.now;
          this.createFloatingText(this.player.x, this.player.y - 46, 'Trancada desde adentro. El cuartel tiene otra entrada…', 0xfca5a5);
        }
        if (this.player && this.player.body) this.player.body.reset(this.player.x, this.player.y + 14);
        return;
      }
    } catch (e) {}
    return sw0.apply(this, arguments);
  };
  // el cartel de objetivo
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      if (!activo(this) || zona(this) !== Z) return r;
      const el = document.querySelector('#ck-objective .ck-obj-text'); if (!el) return r;
      const F = fo(this.story), n = contar(this.story);
      el.textContent = F.llave ? 'Patio de la Fortaleza: entrá al cuartel del Caudillo (la puerta en arco de abajo, T)'
        : F.guardia ? 'Patio de la Fortaleza: juntá la llave que soltó la guardia'
          : F.abierta ? 'Patio de la Fortaleza: vencé a la guardia de élite del cuartel'
            : `Patio de la Fortaleza: rompé cosas y encontrá los mecanismos (${n}/3)`;
    } catch (e) {}
    return r;
  };
  window.CK_PATIO_MECANISMOS = { SECCIONES, CAJONES, GUARDIA, ARCO, EMPALIZADA, activo, armar, abrir };
})();
