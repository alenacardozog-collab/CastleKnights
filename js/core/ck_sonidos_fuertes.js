'use strict';
/* Sonidos propios de los enemigos fuertes (12/11, pedido del dueño: "añadir sonidos únicos a los enemigos fuertes, muchos se
   repiten, que sean referentes a su estilo: pisadas fuertes si es muy pesado, sonidos de armadura, gruñidos orcos").
   Con los sonidos que ya hay (pasos, pisotón, roce de armadura y las voces de ElevenLabs), mezclados por familia:
   - PESADOS (osos, Garra Negra, Kragmor, Grushak, el Campeón, el gran esqueleto): pasos graves y lentos; los jefes además
     retumban (pisotón bajito) cada dos pasos.
   - CON ARMADURA (orcos acorazados, de élite, jinetes, Grushak, el Campeón, el esqueleto acorazado): roce de metal y cuero
     en cada paso.
   - VOCES mientras te persiguen, cada 4 a 9 s: los orcos gruñen, los osos rugen bajo, los esqueletos castañetean los
     huesos, los lobos gruñen (y a veces aúllan), el Nigromante susurra.
   Suenan sólo los que se ven en pantalla, más bajos cuanto más lejos, y como mucho los 3 más cercanos a la vez.
   (12/11 tarde) Ya con sonidos nuevos de ElevenLabs: assets/audio/sfx/ck_f_*.mp3 (pasos pesados, pisada de jefe, armadura,
   gruñido y grito orco, gruñido de oso, huesos, lobo, susurro del Nigromante).
   Borrar su línea de index.html los saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const hab = (k, v, o) => { const H = window.CK_SONIDOS; if (!H || !H.son) return false; try { H.son(k, v, o); return true; } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const PESADO = { werebear: 1, werebear_jefe: 1, bestia_kragmor: 1, orc_warlord: 1, orc_campeon: 1, skeleton_great: 1 };
  const JEFE = { werebear_jefe: 1, bestia_kragmor: 1, orc_warlord: 1, orc_campeon: 1 };
  const ARMADURA = { orc_armored: 1, orc_elite: 1, orc_rider: 1, orc_warlord: 1, orc_campeon: 1, skeleton_armored: 1, cazador_ulrak: 1 };
  const familia = t => (/^orc/.test(t) ? 'orco' : /werebear|kragmor/.test(t) ? 'oso' : /^skeleton/.test(t) ? 'hueso' : /werewolf|warg|ulrak/.test(t) ? 'lobo' : t === 'necromancer' ? 'nigro' : null);
  const VOZ = {
    // (12/11 tarde) voces nuevas de ElevenLabs (ck_f_*.mp3); los sonidos viejos quedan de reserva si falta el archivo
    orco: (v, e) => (e && /elite|warlord|campeon/.test(e.type) && Math.random() < 0.4 ? son('ck_f_orco_grito', 0.42 * v, { rate: R(0.92, 1.05), minGap: 1500 })
      : son('ck_f_orco_grunido', 0.4 * v, { rate: R(0.88, 1.1), minGap: 900 })) || son('orc_attack', 0.34 * v, { rate: R(0.62, 0.8) }),
    oso: (v) => son('ck_f_oso_grunido', 0.46 * v, { rate: R(0.88, 1.05), minGap: 900 }) || son('beast_growl', 0.42 * v, { rate: R(0.5, 0.65) }),
    hueso: (v) => son('ck_f_huesos', 0.32 * v, { rate: R(0.9, 1.15), minGap: 600 }) || son('bone_hit', 0.22 * v, { rate: R(1.5, 1.8) }),
    lobo: (v) => (Math.random() < 0.15 ? son('warg_howl', 0.22 * v, { rate: R(0.9, 1.1), minGap: 4000 }) : son('ck_f_lobo', 0.36 * v, { rate: R(0.95, 1.12), minGap: 900 })),
    nigro: (v) => son('ck_f_nigro', 0.3 * v, { rate: R(0.9, 1.05), minGap: 2500 }) || son('necro_cast', 0.2 * v, { rate: R(0.45, 0.55) })
  };
  const PISO = { grass: 'step_grass1', wood: 'step_wood1', stone: 'step_stone1', dirt: 'step_dirt1' };
  const piso = (S, e) => (window.CK_FOLEY && CK_FOLEY.piso ? CK_FOLEY.piso(S, e.x, e.y + 20) : 'dirt');
  const PASO = (S, e, v, par) => {
    const pesado = PESADO[e.type], arm = ARMADURA[e.type];
    if (pesado) {
      son('ck_f_paso_pesado', 0.5 * v, { rate: R(0.9, 1.1) }) || son(PISO[piso(S, e)] || 'step_dirt1', 0.55 * v, { rate: R(0.55, 0.65) });
      if (JEFE[e.type] && par) son('ck_f_paso_jefe', 0.34 * v, { rate: R(0.92, 1.06), minGap: 250 });
    } else if (arm) son(PISO[piso(S, e)] || 'step_dirt1', 0.3 * v, { rate: R(0.85, 0.95) });
    if (arm) son(Math.random() < 0.6 ? 'ck_f_armadura' : 'ck_paso_armadura', 0.32 * v, { rate: R(0.88, 1.08) });
  };

  const u0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = u0.apply(this, arguments);
    try {
      if (!this.enemies || !this.player || this.isDead || this._ckEscena) return r;
      const now = this.time.now, v = this.cameras.main.worldView, cx = v.centerX, cy = v.centerY;
      const cerca = [];
      this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || !e.visible || !e.body) return;
        if (!Phaser.Geom.Rectangle.Contains(v, e.x, e.y)) return;
        const fam = familia(e.type);
        if (!fam && !PESADO[e.type] && !ARMADURA[e.type]) return;
        cerca.push({ e, d: Math.hypot(e.x - this.player.x, e.y - this.player.y), fam });
      });
      cerca.sort((a, b) => a.d - b.d).slice(0, 3).forEach(({ e, fam }) => {
        const k = Math.max(0.15, Math.min(1, 1 - Math.hypot(e.x - cx, e.y - cy) / 420));
        // pasos al ritmo de la velocidad
        const vel = Math.hypot(e.body.velocity.x, e.body.velocity.y);
        if ((PESADO[e.type] || ARMADURA[e.type]) && vel > 18) {
          const cada = Math.max(260, Math.min(620, 26000 / vel)) * (PESADO[e.type] ? 1.25 : 1);
          if (now >= (e._ckPasoT || 0)) { e._ckPasoT = now + cada; e._ckPasoPar = !e._ckPasoPar; PASO(this, e, k, e._ckPasoPar); }
        }
        // la voz, mientras persigue
        if (fam && VOZ[fam] && e.state === 'chase') {
          if (!e._ckVozT) e._ckVozT = now + R(1500, 4000);
          else if (now >= e._ckVozT) { e._ckVozT = now + R(4000, 9000); VOZ[fam](k, e); }
        }
      });
    } catch (er) {}
    return r;
  };
  window.CK_SONIDOS_FUERTES = { VOZ, PASO, PESADO, ARMADURA };
})();
