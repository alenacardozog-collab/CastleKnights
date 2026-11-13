'use strict';
/* La gente vive en sus casas, de día y de noche (12/11, pedido del dueño: "hacé que los NPC habiten las viviendas en las
   rutinas diarias, día y noche, en las que estén así").
   - ALDEA DEL ROBLE: los aldeanos que se meten en su casa (ck_vida.js: de noche casi todos, de día cada tanto) ahora SE VEN
     ADENTRO. Los de la casa grande, en la casa grande; los del granero, en el granero. De día, parados junto al hogar o la
     mesa; de noche, acostados en las camas (o en el pasto del granero) con las "z" del sueño; si no hay cama, cabeceando
     junto al fuego. Cuando salen, desaparecen de adentro.
   - SAN ROQUE: de noche la gente de la calle se va a dormir (el de la plaza, la vecina del molino y el del puesto de
     verduras): si están cerca saludan ("¡Buenas noches!") y se van; a la mañana vuelven. Y adentro de las casas la gente
     se acuesta: la muchacha de la casita, los granjeros, el pastor y su hijo, el molinero sobre las bolsas, y los de la
     calle en su casa o en los cuartos de la posada. Acercarse a uno dormido: "Zzz…".
   - Nada de esto cambia el diálogo de día: de día todo queda como estaba.
   Va después de ck_casas_sr.js y ck_vida.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const Z = id => 'ed_' + id + '.main';
  const azar = (a, b) => a + Math.random() * (b - a);
  const uno = l => l[Math.floor(Math.random() * l.length)];
  const noche = S => { try { return !!(S.isNight && S.isNight()); } catch (e) { return false; } };
  const zona = S => (S.currentZoneKey && S.currentZoneKey()) || '';

  // ------------------------------------------------------------------ las casas: camas, lugares de día y quién vive
  // vive: la gente que ck_casas_sr.js ya pone parada adentro (textura y lugar: se la busca y de noche se acuesta)
  // aldea: el tipo de puerta de la aldea del Roble (ck_vida.js) cuyos vecinos se ven acá
  const CASAS = {
    [Z('casita_cerco_san_roque')]: { camas: [[338, 156]], vive: [['npc5_villager', 234, 152]] },
    [Z('casa_granjeros_san_roque')]: { camas: [[318, 138], [342, 138], [398, 130]], vive: [['npc2_villager', 118, 200], ['npc4_villager', 330, 218]] },
    [Z('casa_pastor_san_roque')]: { camas: [[126, 136], [174, 164]], vive: [['npc6_villager', 214, 172]] },
    [Z('molino_san_roque')]: { camas: [[330, 128]], vive: [['npc1_villager', 246, 150]] },
    [Z('posada_san_roque_arriba')]: { camas: [[68, 80], [252, 80], [66, 180], [410, 180]], vive: [] },
    [Z('casa_grande')]: { camas: [[94, 156], [72, 181]], fuego: [[322, 166], [300, 172], [344, 170]], dia: [[232, 100], [262, 208], [336, 206], [160, 212]], aldea: 'casa' },
    [Z('granero')]: { camas: [[335, 46], [220, 214], [80, 218]], fuego: [[300, 206], [400, 190]], dia: [[300, 206], [120, 196], [400, 186], [250, 120]], aldea: 'granero' }
  };
  // San Roque: los de la calle y dónde duermen
  const SR = Z('san_roque');
  const CALLE = [
    { key: 'npc10_villager', casa: Z('casa_pastor_san_roque') },
    { key: 'npc4_villager', casa: Z('posada_san_roque_arriba') },
    { key: 'npc3_villager', casa: Z('casa_granjeros_san_roque') }
  ];
  const CHAU = ['¡Buenas noches!', 'Me voy a dormir', 'Se hizo tarde…', 'Hasta mañana'];
  const HOLA = ['¡Buen día!', 'Arriba, que el sol ya salió', 'Linda mañana'];

  // ------------------------------------------------------------------ alguien durmiendo (acostado, con las "z")
  const dormir = (S, key, x, y, escala, acostado, anim) => {
    const sp = S.add.sprite(x, y, key, 0).setOrigin(0.5, acostado ? 0.72 : 1).setScale(escala).setDepth(y + (acostado ? 24 : 0));   // acostado: por encima de la cama (su base está más abajo)
    if (acostado) sp.setAngle(-90);
    else if (anim && S.anims.exists(anim)) { sp.play(anim); sp.anims.timeScale = 0.4; }
    const zs = [];
    const ev = S.time.addEvent({ delay: 1300, loop: true, callback: () => {
      if (!sp.active) { ev.remove(); return; }
      const t = S.add.text(sp.x + (acostado ? -10 : 4), sp.y - (acostado ? 10 : 30), 'z', { fontFamily: "'CK Grenze', Georgia, serif", fontSize: '11px', fontStyle: 'bold', color: '#e8eefc', stroke: '#141826', strokeThickness: 3 })
        .setOrigin(0.5).setDepth(30000).setAlpha(0);
      zs.push(t);
      S.tweens.add({ targets: t, alpha: 0.95, x: t.x - 6, y: t.y - 16, scale: 1.4, duration: 1500, ease: 'Sine.easeOut', onComplete: () => { S.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }); } });
    } });
    sp.on('destroy', () => { ev.remove(); zs.forEach(t => { try { t.destroy(); } catch (e) {} }); });
    return sp;
  };
  const parado = (S, key, x, y, escala, anim) => {
    const sp = S.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setScale(escala).setDepth(y).setFlipX(Math.random() < 0.5);
    if (anim && S.anims.exists(anim)) sp.play(anim);
    return sp;
  };

  // ------------------------------------------------------------------ adentro: aplicar el estado (día / noche)
  const limpiar = S => {
    const R = S._ckRut; if (!R) return;
    (R.hechos || []).forEach(o => { try { o.destroy(); } catch (e) {} });
    (R.ocultos || []).forEach(o => { try { if (o.sp.active) o.sp.setVisible(true); if (o.cuerpo && o.cuerpo.body) o.cuerpo.body.enable = true; } catch (e) {} });
    if (R.area && R.talkers) R.area.talkers = R.talkers;
    S._ckRut = null;
  };
  // el sprite de alguien que ck_casas_sr.js puso parado adentro (y su choque de 14×8)
  const buscarParado = (S, a, key, x, y) => {
    const sp = S.children.list.find(o => o.active && o.texture && o.texture.key === key && Math.abs(o.x - (a.x + x)) < 3 && Math.abs(o.y - (a.y + y)) < 3);
    const cuerpo = (S.interiorObstacles ? S.interiorObstacles.getChildren() : []).find(z => z.active && Math.abs(z.x - (a.x + x)) < 2 && Math.abs(z.y - (a.y + y - 4)) < 3);
    return sp ? { sp, cuerpo } : null;
  };
  // vecinos de la aldea del Roble que están adentro de su casa (ck_vida.js)
  const vecinosAdentro = (S, tipo) => {
    const V = window.CK_VIDA, C = (V && V.CASA) || {};
    return (S.campaignNPCs || []).filter(n => n.vida && n.vida.modo === 'adentro' && n.vida.lugar === 'casa' && C[n.id] === tipo && n.textureKey);
  };
  const aplicar = (S, z, C) => {
    limpiar(S);
    const a = S.currentInterior.area, N = noche(S);
    const R = S._ckRut = { z, noche: N, area: a, hechos: [], ocultos: [], talkers: null, vecinos: '' };
    const camas = C.camas.slice(), fuego = (C.fuego || []).slice(), dia = (C.dia || []).slice();
    const dormidos = [];
    const acostar = (key, escala, anim) => {
      const c = camas.shift(), f = !c && fuego.shift();
      const p = c || f; if (!p) return null;
      const sp = dormir(S, key, a.x + p[0], a.y + p[1], escala, !!c, anim);
      R.hechos.push(sp); dormidos.push(p); return sp;
    };
    if (N) {
      // los que viven acá se acuestan
      (C.vive || []).forEach(([key, x, y]) => {
        const q = buscarParado(S, a, key, x, y); if (!q) return;
        q.sp.setVisible(false); if (q.cuerpo && q.cuerpo.body) q.cuerpo.body.enable = false;
        R.ocultos.push(q);
        acostar(key, q.sp.scaleX || 1.3, key.replace('_villager', '_idle'));
      });
      // y los de la calle de San Roque que duermen acá
      CALLE.filter(c => c.casa === z).forEach(c => acostar(c.key, 1.3, c.key.replace('_villager', '_idle')));
      // los carteles de la gente parada se callan; cerca de cada cama, "Zzz…"
      if (R.ocultos.length) {
        R.talkers = a.talkers || [];
        a.talkers = R.talkers.filter(t => !R.ocultos.some(o => Math.hypot(t.x - (o.sp.x - a.x), t.y - (o.sp.y - a.y)) < 12));
      }
      if (dormidos.length) {
        if (!R.talkers) R.talkers = a.talkers || [];
        a.talkers = (a.talkers || []).concat(dormidos.map(([x, y]) => ({ x, y: y + 10, r: 22, talkAt: 0, lines: ['Zzz…', 'Zzz… (duerme)', '…mmm… cinco minutos más…', 'Zzz… zzz…'] })));
      }
    }
    // vecinos de la aldea del Roble
    if (C.aldea) {
      const vs = vecinosAdentro(S, C.aldea);
      R.vecinos = vs.map(n => n.id).sort().join(',');
      vs.forEach(n => {
        const esc = (n.sprite && n.sprite.scaleX) || 1.3;
        if (N) acostar(n.textureKey, esc, n.id + '_idle');
        else {
          const p = dia.shift(); if (!p) return;
          R.hechos.push(parado(S, n.textureKey, a.x + p[0], a.y + p[1], esc, S.anims.exists(n.id + '_idle') ? n.id + '_idle' : 'npc1_idle'));
        }
      });
    }
  };

  // ------------------------------------------------------------------ San Roque: los de la calle se van a dormir
  const calleSR = S => {
    const a = S.currentInterior && S.currentInterior.area; if (!a) return;
    const N = noche(S), cam = S.cameras.main.worldView, p = S.player;
    S._ckRutCalle = S._ckRutCalle || {};
    CALLE.forEach(c => {
      let act = (a.actors || []).find(t => t.sprite && t.sprite.texture && t.sprite.texture.key === c.key);
      const guardado = S._ckRutCalle[c.key];
      if (!act && guardado && guardado.area === a) act = guardado.act;
      const sp = act ? act.sprite : S.children.list.find(o => o.active && o.texture && o.texture.key === c.key && o.x > a.x && o.x < a.x + a.w && o.y > a.y && o.y < a.y + a.h);
      if (!sp || !sp.active) return;
      const visto = sp.visible && sp.alpha > 0.5;
      const lejos = !Phaser.Geom.Rectangle.Contains(cam, sp.x, sp.y) || !p || Phaser.Math.Distance.Between(p.x, p.y, sp.x, sp.y) > 150;
      if (N && visto && !sp._ckRutYendo) {
        sp._ckRutYendo = true;
        const irse = () => {
          S.tweens.add({ targets: sp, alpha: 0, duration: 700, onComplete: () => { sp.setVisible(false); sp._ckRutYendo = false; } });
          if (act) { a.actors = (a.actors || []).filter(t => t !== act); S._ckRutCalle[c.key] = { act, area: a }; }
        };
        if (lejos) irse();
        else { S.createFloatingText(sp.x, sp.y - 34, uno(CHAU), 0xc7d2fe); S.time.delayedCall(1500, irse); }
      } else if (!N && !sp.visible && !sp._ckRutYendo) {
        sp.setVisible(true).setAlpha(0);
        S.tweens.add({ targets: sp, alpha: 1, duration: 700 });
        if (act && !(a.actors || []).includes(act)) a.actors.push(act);
        if (!lejos) S.createFloatingText(sp.x, sp.y - 34, uno(HOLA), 0xfde68a);
      }
    });
  };

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.gameStarted || !this.currentInterior || !this.currentInterior.area) return r;
      const z = zona(this), C = CASAS[z];
      if (z === SR) { calleSR(this); return r; }
      if (!C) { if (this._ckRut) limpiar(this); return r; }
      const R = this._ckRut, N = noche(this);
      let cambio = !R || R.z !== z || R.area !== this.currentInterior.area || R.noche !== N;
      if (!cambio && C.aldea && this.time.now > (this._ckRutMira || 0)) {           // ¿entró o salió algún vecino?
        this._ckRutMira = this.time.now + 700;
        cambio = vecinosAdentro(this, C.aldea).map(n => n.id).sort().join(',') !== R.vecinos;
      }
      if (cambio) aplicar(this, z, C);
    } catch (e) { if (!P._ckRutAv) { P._ckRutAv = 1; console.warn('[rutinas]', e); } }
    return r;
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    try { if (this._ckRut) limpiar(this); this._ckRutCalle = {}; } catch (e) {}
    return ms0 ? ms0.apply(this, arguments) : undefined;
  };
  window.CK_RUTINAS = { CASAS, CALLE };
})();
