'use strict';
/* Comercios con horario (10/11, pedido del dueño: "a los trabajadores de tiendas dales unas rutinas y horarios donde estén
   en sus tiendas y luego a cierta hora se vayan, para darle más vida").
   - Abren al amanecer y cierran al caer la tarde (con el reloj del juego: de día abierto, de noche cerrado).
   - Tienda de Víveres (el tendero detrás del mostrador), Herrería (el herrero en la fragua) y el puesto del mercado del
     Patio del Castillo (una vendedora nueva detrás del puesto): al cerrar, el que atiende avisa, camina hasta la puerta y
     se va; a la mañana entra y vuelve a su lugar. Cerrado no se puede comprar: "Cerrado · abre al amanecer".
   - El Posadero Mercader de la aldea: de día en su puesto; al cerrar se va a la taberna (se lo ve adentro) y a la mañana
     vuelve.
   - De paso: la Tienda de Víveres nueva (la del Taller) no abría la ventana de compras con T (buscaba la zona vieja).
   Borrar su línea de index.html: todo abierto siempre, como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ABRE = 0.94, CIERRA = 0.56;            // dayPhase: amanecer y atardecer (ck_dia_noche.js)
  const fase = S => (S.dayPhase ? S.dayPhase() : 0.2);
  const abierto = S => { const p = fase(S); return p >= ABRE || p < CIERRA; };

  // los lugares: zona, quién atiende y dónde está su puesto
  const COMERCIOS = [
    { id: 'tienda', zona: /^ed_tienda_de_viveres\./, nombre: 'Tienda de Víveres', quien: o => o.texture && o.texture.key === 'npc3_villager',
      chau: ['¡Cerramos por hoy! Vuelvo al amanecer', 'Se hizo tarde: mañana temprano abro'], hola: ['¡Buen día! Ya abrimos', 'Pan fresco y pociones, ¡pasen!'] },
    { id: 'herreria', zona: /^ed_herreria\./, nombre: 'Herrería', actor: 'smith',
      chau: ['La fragua descansa. Mañana sigo', 'Basta de martillo por hoy'], hola: ['¡A trabajar! La fragua ya calienta', 'Buen día. ¿Algo para afilar?'] },
    { id: 'mercado', zona: /^ed_patio_del_castillo\./, nombre: 'Puesto del mercado', nuevo: { key: 'npc10_villager', idle: 'npc10_idle', walk: 'npc10_walk', x: 300, y: 296, escala: 1.85 },
      chau: ['¡Se levanta el puesto! Hasta mañana', 'Ya guardo todo: mañana temprano vuelvo'], hola: ['¡Buen día! Pan, pociones y tónicos', 'Recién llegado del horno 🍞'] }
  ];
  // el puesto del patio y la tienda nueva, en la lista de tiendas (ck_tiendas.js)
  try {
    const T = window.CK_TIENDAS && window.CK_TIENDAS.TIENDAS;
    if (T) {
      if (!T.some(t => t.zona.test('ed_tienda_de_viveres.main'))) T.unshift({ zona: /^ed_tienda_de_viveres\./, nombre: 'Tienda de Víveres', vende: ['potion', 'elixir', 'whet', 'tonic', 'heart'], x: 236, y: 160, r: 90 });
      if (!T.some(t => t.zona.test('ed_patio_del_castillo.main'))) T.push({ zona: /^ed_patio_del_castillo\./, nombre: 'Puesto del mercado', vende: ['potion', 'elixir', 'tonic'], x: 259, y: 300, r: 46 });
    }
  } catch (e) {}

  const comercioDe = S => { const z = S.currentZoneKey ? S.currentZoneKey() : ''; return COMERCIOS.find(c => c.zona.test(z)) || null; };
  const uno = l => l[Math.floor(Math.random() * l.length)];
  const nota = t => { try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(t); } catch (e) {} };

  /** El que atiende en la zona actual: { sp, actor, puesto:[x,y] } o null. */
  const atiende = (S, c) => {
    const a = S.currentInterior && S.currentInterior.area; if (!a) return null;
    if (c.actor) {
      const ac = (a.actors || []).find(x => x.type === c.actor && x.sprite);
      return ac ? { sp: ac.sprite, actor: ac } : null;
    }
    if (c.nuevo) {
      if (!a._ckVende || !a._ckVende.active) {
        const n = c.nuevo; if (!S.textures.exists(n.key)) return null;
        const sp = S.add.sprite(a.x + n.x, a.y + n.y, n.key).setOrigin(0.5, 1).setScale(n.escala).setDepth(a.y + n.y);
        if (S.anims.exists(n.idle)) sp.play(n.idle);
        (a.objs || (a.objs = [])).push(sp);
        a._ckVende = sp;
      }
      return { sp: a._ckVende };
    }
    const sp = (a.objs || []).find(o => o && o.active && c.quien(o));
    return sp ? { sp } : null;
  };
  /** Camina por la grilla (rodea mostradores y puestos); al llegar, fin(). */
  const caminar = (S, sp, x1, y1, fin) => {
    let ruta = null;
    try { ruta = S.navPath ? S.navPath(sp.x, sp.y, x1, y1) : null; } catch (e) {}
    ruta = (ruta && ruta.length ? ruta : [[x1, y1]]).slice();
    if (Math.hypot(ruta[ruta.length - 1][0] - x1, ruta[ruta.length - 1][1] - y1) > 2) ruta.push([x1, y1]);
    const paso = () => {
      const p = ruta.shift(); if (!p || !sp.active) { fin && fin(); return; }
      sp.setFlipX(p[0] < sp.x);
      const d = Math.hypot(p[0] - sp.x, p[1] - sp.y);
      S.tweens.add({ targets: sp, x: p[0], y: p[1], duration: Math.max(80, d / 46 * 1000), onUpdate: () => sp.setDepth(sp.y), onComplete: paso });
    };
    paso();
  };
  const puertaDe = S => {
    const a = S.currentInterior.area, e = (a.exits || [])[0];
    return e ? [e.x + e.w / 2, e.y + e.h / 2 - 6] : [a.x + a.w / 2, a.y + a.h - 10];
  };

  // ------------------------------------------------------------------ irse y volver
  const irse = (S, c, q, animar) => {
    const sp = q.sp; if (q.yendo) return;
    if (!sp._ckPuesto) sp._ckPuesto = [sp.x, sp.y];
    S.tweens.killTweensOf(sp);
    if (!animar || !sp.visible) { sp.setVisible(false).setAlpha(0); return; }
    q.yendo = true;
    S.createFloatingText && S.createFloatingText(sp.x, sp.y - 58, uno(c.chau), 0xfde68a);
    const [px, py] = puertaDe(S), w = c.nuevo ? c.nuevo.walk : (sp.texture.key.replace('_villager', '') + '_walk');
    S.time.delayedCall(1400, () => {
      if (!sp.active) return;
      if (S.anims.exists(w)) sp.play(w, true);
      caminar(S, sp, px, py, () => S.tweens.add({ targets: sp, alpha: 0, duration: 300, onComplete: () => { sp.setVisible(false); q.yendo = false; } }));
    });
  };
  const volver = (S, c, q, animar) => {
    const sp = q.sp, [x0, y0] = sp._ckPuesto || [sp.x, sp.y];
    S.tweens.killTweensOf(sp);
    const idle = c.nuevo ? c.nuevo.idle : (sp.texture.key.replace('_villager', '') + '_idle');
    if (!animar) { sp.setPosition(x0, y0).setDepth(y0).setVisible(true).setAlpha(1); if (S.anims.exists(idle)) sp.play(idle, true); return; }
    const [px, py] = puertaDe(S), w = c.nuevo ? c.nuevo.walk : (sp.texture.key.replace('_villager', '') + '_walk');
    sp.setPosition(px, py).setVisible(true).setAlpha(0).setFlipX(x0 < px);
    if (S.anims.exists(w)) sp.play(w, true);
    S.tweens.add({ targets: sp, alpha: 1, duration: 300 });
    S.time.delayedCall(200, () => caminar(S, sp, x0, y0, () => { sp.setFlipX(false).setDepth(y0); if (S.anims.exists(idle)) sp.play(idle, true); S.createFloatingText && S.createFloatingText(x0, y0 - 58, uno(c.hola), 0xbbf7d0); }));
  };

  // ------------------------------------------------------------------ cada cuadro (cada medio segundo alcanza)
  const repasar = (S, primera) => {
    const c = comercioDe(S); if (!c) return;
    const q = atiende(S, c); if (!q) return;
    const ab = abierto(S), a = S.currentInterior.area;
    const k = '_ckAbierto_' + c.id;
    if (primera || a[k] === undefined) { a[k] = ab; if (ab) volver(S, c, q, false); else irse(S, c, q, false); return; }
    if (a[k] === ab) { if (!ab && q.sp.visible && !q.yendo && q.actor) q.sp.setVisible(false); return; }
    a[k] = ab;
    if (ab) volver(S, c, q, true); else irse(S, c, q, true);
  };
  const mostrar0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = mostrar0 ? mostrar0.apply(this, arguments) : undefined;
    try { if (this._gameMode === 'campaign') this.time.delayedCall(120, () => { try { repasar(this, true); } catch (e) {} }); } catch (e) {}
    return r;
  };
  let ultimo = 0;
  const upd0 = P.update;
  P.update = function (time) {
    const r = upd0.apply(this, arguments);
    if (time - ultimo > 500 && this._gameMode === 'campaign') {
      ultimo = time;
      try { if (this.currentInterior) repasar(this, false); else posadero(this); } catch (e) {}
    }
    return r;
  };

  // ------------------------------------------------------------------ el posadero de la aldea: de noche, a la taberna
  const posadero = S => {
    const V = window.CK_VIDA, n = (S.campaignNPCs || []).find(v => v.id === 'npc2');
    if (!V || !n || !n.vida || !n.sprite) return;
    const v = n.vida, ab = abierto(S);
    if (!ab && v.modo === 'ruta' && !S.dialogOpen) {
      const d = V.puertaDe && V.puertaDe(S, 'bar');
      if (d && V.irA(S, n, d, 'taberna')) { v._ckCerro = true; S.createFloatingText && S.createFloatingText(n.sprite.x, n.sprite.y - 40, '¡Cierro el puesto! Los espero en la taberna', 0xfde68a); }
    } else if (v._ckCerro && v.modo === 'adentro') {
      if (!ab) v.hasta = S.time.now + 1e9;           // toda la noche en la taberna
      else if (v.hasta > S.time.now + 5000) { v.hasta = S.time.now + 1500 + Math.random() * 4000; v._ckCerro = false; v.lugar = 'taberna'; }
    }
  };

  // ------------------------------------------------------------------ cerrado no se compra
  const cerradoAqui = S => {
    const z = S.currentZoneKey ? S.currentZoneKey() : '';
    if (S.currentInterior) { const c = comercioDe(S); return c && !abierto(S) ? c : null; }
    return null;
  };
  const shop0 = P.openShop;
  P.openShop = function () {
    const c = cerradoAqui(this);
    if (c) { nota(`${c.nombre}: cerrado · abre al amanecer`); return; }
    return shop0.apply(this, arguments);
  };
  // el cartel "T · Comprar en ...": cerrado lo dice
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const c = cerradoAqui(this), el = document.getElementById('ck-prompt');
      if (c && el && /Comprar/.test(el.textContent)) el.textContent = `${c.nombre} · cerrado, abre al amanecer`;
    } catch (e) {}
    return r;
  };

  window.CK_HORARIOS = { abierto, COMERCIOS, ABRE, CIERRA };
})();
