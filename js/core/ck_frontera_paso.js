'use strict';
/* El Bosque de la Frontera antes de la batalla (14/11, nota 71 del dueño: "esta puerta es corrediza y la abren los humanos, no
   hay enemigos en esta zona, por lo menos no antes de la batalla del capitan bruno pero desde aca al otro lado si vemos el
   terreno y los soldados y orcos caidos eso solamente").
   - Hasta que termina la batalla del Capitán Bruno (Capítulo 2, paso 5) no aparece ninguna bestia en este mapa (ni orcos, ni
     huargos, ni jabalíes, ni murciélagos). En la práctica, las que se piden con el panel de pruebas sí salen.
   - Del otro lado del portón, junto a los soldados caídos (ck_frontera_cerrada.js), también hay orcos caídos.
   - El portón (ck_cuarentena.js) lo corren los soldados cuando el héroe se acerca.
   Borrar su línea de index.html vuelve a como estaba. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ZB = 'ed_bosque_de_la_frontera.main';
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const vivo = e => e && e.active && !e.isDead;
  /** Antes de la batalla de Bruno (y en la práctica): el bosque está en calma. */
  const enCalma = S => {
    if (!S || S._gameMode !== 'campaign' || !S.story) return false;
    const f = S.story.flags || {};
    return !((f.c2 || 0) >= 5 || (f.batalla_orca && f.batalla_orca.fin) || f.grushak);
  };
  const delPanel = () => { try { return /ck_panel_pruebas/.test(new Error().stack || ''); } catch (e) { return false; } };

  const sp0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    try {
      if (zona(this) === ZB && enCalma(this) && !this._ckPermitirBestias && !delPanel()) return null;
    } catch (e) {}
    return sp0.apply(this, arguments);
  };

  // los orcos caídos, del otro lado del portón: [hoja, x, y, mirando a la izquierda]
  const ORCOS = [['orc', 1240, 420, true], ['orc_armored', 1330, 380, false], ['orc', 1260, 560, false], ['orc_elite', 1390, 420, true],
    ['orc', 1200, 250, false], ['orc_armored', 1380, 520, true]];
  const ultimo = (S, k) => { const t = S.textures.get(k); return Math.max(0, (t.frameTotal || 2) - 2); };
  const caidos = S => {
    (S._ckFrPaso || []).forEach(o => { try { o.destroy(); } catch (e) {} });
    S._ckFrPaso = [];
    const a = S.currentInterior && S.currentInterior.area; if (!a) return;
    ORCOS.forEach(([t, x, y, flip]) => {
      const k = t + '_death'; if (!S.textures.exists(k)) return;
      const sangre = S.add.ellipse(a.x + x + (flip ? -5 : 5), a.y + y - 2, 30, 9, 0x2f3a12, 0.5).setDepth(a.y + y - 6);
      const sp = S.add.sprite(a.x + x, a.y + y, k, ultimo(S, k)).setOrigin(0.5, 1).setScale(1.45).setDepth(a.y + y - 4).setTint(0xb8b0a4);
      if (flip) sp.setFlipX(true);
      S._ckFrPaso.push(sangre, sp);
      (a.objs = a.objs || []).push(sangre, sp);
    });
  };
  const area0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = area0 ? area0.apply(this, arguments) : undefined;
    try {
      if (zona(this) !== ZB) { this._ckFrPaso = []; return r; }
      caidos(this);
      if (enCalma(this) && this.enemies) {
        const limpiar = () => zona(this) === ZB && this.enemies.getChildren().forEach(e => {
          if (vivo(e) && !e._ckPanel && e.zone === ZB && !e._ckDelPanel) { try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} }
        });
        limpiar(); this.time.delayedCall(300, limpiar);
      }
    } catch (e) { console.warn('[frontera paso]', e); }
    return r;
  };
  window.CK_FRONTERA_PASO = { enCalma, ORCOS };
})();
