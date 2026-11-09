'use strict';
/* Oscuridad como sistema (07/11, pedido del dueño: "agregá todo eso"). Queda lista para la región final (todavía sin
   mapas: el dueño va a contar cómo es). Una zona se vuelve oscura sumándola a ZONAS (abajo) o desde otro archivo con
   CK_OSCURIDAD.zona('ed_<mapa>.main', { braseros: [[x, y], …] }). Para verla sin tocar nada: ?ck_oscuro=<zona> en la
   dirección (por ejemplo ?ck_oscuro=ed_tierras_orcas.main).
   En una zona oscura:
   - la noche es cerrada aunque sea de día (usa el motor de luz, ck_luz.js): sin antorcha el héroe ve apenas a su
     alrededor (60 px); con la antorcha prendida (L), lo normal (118 px);
   - las BESTIAS EN LA SOMBRA no se ven: aparecen de a poco cuando entran a una luz; afuera de la luz sólo brillan sus ojos;
   - BRASEROS: apagados al principio; con la antorcha prendida, T los enciende. Encendidos dan luz para siempre (se guarda
     en la partida) y son PUNTOS SEGUROS: las bestias no entran a su luz, y parado al lado se recupera 1 corazón cada 8 s.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZONAS = {};   // 'ed_<mapa>.main': { braseros: [[x, y], …] } (coordenadas del mapa)
  const NEGRO = [26, 24, 38], PROPIA = 60, BRASERO = { radio: 110, cura: 8000, cerca: 46 };
  const m = /[?&]ck_oscuro=([^&]+)/.exec(location.search);
  if (m) ZONAS[decodeURIComponent(m[1])] = ZONAS[decodeURIComponent(m[1])] || { braseros: 'auto' };
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const conf = S => { const z = S.currentZoneKey ? S.currentZoneKey() : ''; return ZONAS[z] ? { z, c: ZONAS[z] } : null; };
  const vivo = e => e && e.active && !e.isDead;

  // ------------------------------------------------------------------ la penumbra y las luces
  const aplicarPenumbra = () => { const L = window.CK_LUZ; if (L && L.PENUMBRA) Object.keys(ZONAS).forEach(z => { L.PENUMBRA[z] = NEGRO; }); };
  aplicarPenumbra();
  const instalarLuz = () => {
    const L = window.CK_LUZ; if (!L || instalarLuz.ok) return; instalarLuz.ok = true;
    L.fuente((S, out) => {
      const k = conf(S); if (!k || !S.player) return;
      const p = S.player, antorcha = S.story && S.story.torch && S.story.torch.on;
      // la antorcha de ck_antorcha.js se achica de día; acá es noche cerrada: alumbra entera
      if (antorcha) out.push({ x: p.x, y: p.y - 6, c: [255, 158, 78], r: (window.CK_ANTORCHA_CFG && window.CK_ANTORCHA_CFG.RADIO) || 118, f: 0.95, titila: 1 });
      else out.push({ x: p.x, y: p.y - 4, c: [200, 190, 255], r: PROPIA, f: 0.75 });
      (S._ckBraseros || []).forEach(b => { if (b.on) out.push({ x: b.x, y: b.y - 14, c: [255, 150, 66], r: BRASERO.radio, f: 1, titila: 1 }); });
    });
  };
  // ¿cuánta luz hay en un punto? (las luces del último cuadro: antorcha, braseros, fuegos, hechizos…)
  const luzEn = (x, y) => {
    const L = window.CK_LUZ; if (!L) return 1;
    let best = 0;
    L.ultimas().forEach(l => { const d = Math.hypot(l.x - x, l.y - y), r = (l.r || 60) * 0.9; if (d < r) best = Math.max(best, (1 - d / r) * Math.min(1, (l.f || 1) * 1.4)); });
    return Math.min(1, best * 1.6);
  };

  // ------------------------------------------------------------------ braseros
  const limpiar = S => { (S._ckBraseros || []).forEach(b => { try { b.sp.destroy(); if (b.ojo) b.ojo.destroy(); } catch (e) {} }); S._ckBraseros = []; };
  const ponerBraseros = S => {
    limpiar(S);
    const k = conf(S); if (!k || !S.currentInterior) return;
    const a = S.currentInterior.area, st = S.story || { flags: {} }; st.flags = st.flags || {};
    const on = (st.flags.braseros = st.flags.braseros || {});
    let lista = k.c.braseros;
    if (lista === 'auto') {   // vista previa: tres braseros por el mapa
      lista = [[a.w * 0.25, a.h * 0.5], [a.w * 0.55, a.h * 0.3], [a.w * 0.8, a.h * 0.65]].map(([x, y]) => {
        const c = S.navNearestCell && S.navGrid ? S.navNearestCell(S.navGrid(true), a.x + x, a.y + y, 20) : null;
        return c ? [c[0] * 8 + 4 + (S.navGrid(true).x - a.x), c[1] * 8 + 4 + (S.navGrid(true).y - a.y)] : [x, y];
      });
    }
    const key = S.textures.exists('ed_mu_brasero_1') ? 'ed_mu_brasero_1' : null;
    (lista || []).forEach(([x, y], i) => {
      const id = k.z + '#' + i, X = a.x + x, Y = a.y + y;
      const sp = key ? S.add.sprite(X, Y, key).setOrigin(0.5, 1) : S.add.circle(X, Y - 8, 8, 0x553322);
      sp.setDepth(Y);
      const b = { id, x: X, y: Y, sp, on: !!on[id] };
      pintarBrasero(S, b);
      S._ckBraseros.push(b);
    });
  };
  const pintarBrasero = (S, b) => {
    if (b.on) { b.sp.clearTint && b.sp.clearTint(); if (b.sp.anims && S.anims.exists('ed_mu_brasero_1')) b.sp.play({ key: 'ed_mu_brasero_1', repeat: -1 }); }
    else { b.sp.setTint && b.sp.setTint(0x3a3a44); if (b.sp.anims) b.sp.anims.stop(); }
  };
  const braseroCerca = S => (S._ckBraseros || []).find(b => S.player && Math.hypot(b.x - S.player.x, b.y - (S.player.body ? S.player.body.bottom : S.player.y)) < BRASERO.cerca) || null;
  const encender = (S, b) => {
    b.on = true; pintarBrasero(S, b);
    const st = S.story; if (st) { st.flags.braseros = st.flags.braseros || {}; st.flags.braseros[b.id] = true; S.saveStory && S.saveStory(); }
    son('fire_cast', 0.7) || son('book_clasp', 0.6);
    S.createFloatingText(b.x, b.y - 40, '¡BRASERO ENCENDIDO! · lugar seguro', 0xfdba74);
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'fuego', b.x, b.y - 10, 30, 400);
  };
  const i0 = P.interact;
  P.interact = function () {
    try {
      const b = !this._overlay && !this.dialogOpen && conf(this) && braseroCerca(this);
      if (b && !b.on) {
        if (this.story && this.story.torch && this.story.torch.on) { encender(this, b); return; }
        this.createFloatingText(this.player.x, this.player.y - 44, 'Necesitás la antorcha prendida (L)', 0xcbd5e1); return;
      }
    } catch (e) {}
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt'), b = conf(this) && braseroCerca(this);
      if (pr && b && !b.on && !pr.classList.contains('on') && !this.dialogOpen) { pr.textContent = 'T · Encender el brasero'; pr.classList.add('on'); this._ckBrasCartel = true; }
      else if (pr && !b && this._ckBrasCartel) { this._ckBrasCartel = false; if (pr.textContent === 'T · Encender el brasero') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ cada cuadro: bestias en la sombra, lugares seguros
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      instalarLuz();
      const k = this.gameStarted && conf(this);
      if (!k) { if (this._ckOscAntes) { this._ckOscAntes = false; this.enemies && this.enemies.getChildren().forEach(e => { e.setAlpha(1); if (e._ckOjos) { e._ckOjos.destroy(); e._ckOjos = null; } }); } return r; }
      this._ckOscAntes = true;
      const now = this.time.now, bras = (this._ckBraseros || []).filter(b => b.on);
      this.enemies.getChildren().forEach(e => {
        if (!e.active) return;
        if (e.isDead) { if (e._ckOjos) { e._ckOjos.destroy(); e._ckOjos = null; } return; }
        const luz = luzEn(e.x, e.y), quiere = Math.min(1, luz * 1.8);
        e._ckVis = (e._ckVis === undefined ? 0 : e._ckVis) + (quiere - (e._ckVis || 0)) * 0.15;
        e.setAlpha(Math.max(0, e._ckVis));
        if (e.hpBar) e.hpBar.setAlpha(e._ckVis);
        // los ojos en la oscuridad
        if (!e._ckOjos) e._ckOjos = this.add.graphics().setDepth(27600);
        const g = e._ckOjos; g.clear();
        if (e._ckVis < 0.5) {
          const x = e.x + (e.flipX ? -3 : 3), y = e.y - (e.displayHeight || 60) * 0.16, a = (0.5 - e._ckVis) * 2 * (Math.floor(now / 1700 + e.x) % 7 === 0 ? 0.2 : 1);
          g.fillStyle(0xff3b2f, a); g.fillRect(x - 3, y, 2, 1); g.fillRect(x + 1, y, 2, 1);
        }
        // las bestias no entran a la luz de un brasero
        bras.forEach(b => {
          const d = Math.hypot(e.x - b.x, (e.body ? e.body.bottom : e.y) - b.y);
          if (d < BRASERO.radio * 0.8 && e.body && !(e.def && e.def.boss)) {
            const a = Math.atan2((e.body ? e.body.bottom : e.y) - b.y, e.x - b.x);
            e.body.setVelocity(Math.cos(a) * 90, Math.sin(a) * 90);
            if (e.state === 'chase' && d < BRASERO.radio * 0.6 && this.enemyLoseTrack) this.enemyLoseTrack(e);
          }
        });
      });
      // al lado de un brasero encendido se recupera vida
      const p = this.player, b = bras.find(q => Math.hypot(q.x - p.x, q.y - (p.body ? p.body.bottom : p.y)) < BRASERO.radio * 0.6);
      if (b && this.health < this.maxHealth && !this.isDead) {
        this._ckBrasT = (this._ckBrasT || 0) + (delta || 16);
        if (this._ckBrasT >= BRASERO.cura) { this._ckBrasT = 0; this.health++; this.updateHUD && this.updateHUD(); this.createFloatingText(p.x, p.y - 40, '+1 VIDA', 0x22c55e); }
      } else this._ckBrasT = 0;
    } catch (e) { if (!P._ckOscAv) { P._ckOscAv = 1; console.warn('[oscuridad]', e); } }
    return r;
  };
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    limpiar(this);
    this.time.delayedCall(400, () => { try { ponerBraseros(this); } catch (e) { console.warn('[oscuridad]', e); } });
    return r;
  };
  window.CK_OSCURIDAD = {
    ZONAS, luzEn, BRASERO,
    zona: (z, c) => { ZONAS[z] = Object.assign({ braseros: [] }, c || {}); aplicarPenumbra(); }
  };
})();
