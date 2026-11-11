'use strict';
/* El Libro del Sello y el Padre Oswin (10/11, documento "CastleKnight — Historia y guion", pedido del dueño: "el rey nos
   manda con el sacerdote del reino; nos da unas pociones y un libro para quitarle la inmortalidad al nigromante: el libro
   nos deja canalizar sobre el nigromante mientras esté aturdido cuando le bajemos toda la vida; si no se lo lanzamos en
   5 segundos vuelve a recuperarse con media barra de vida"; "cuando es derrotado nos suelta el cristal").
   - PADRE OSWIN, el cura del jardín del castillo (el de sotana que pasea entre las rosas): con T se habla. Desde que el
     héroe va a Brumavieja (paso 4 en adelante) y hasta vencer al Nigromante, le cuenta del sello, le da el LIBRO DEL
     SELLO y 2 pociones (una sola vez). Después tiene frases según cómo va la historia.
   - EL NIGROMANTE YA NO MUERE A GOLPES: al bajarle toda la vida cae de rodillas, ATURDIDO 5 segundos (un aro que se
     cierra marca el tiempo). Con el libro, acercate y MANTENÉ T 1,5 s para leer el sello (páginas que giran, letras de
     luz): queda sellado y muere de verdad. Si no llegás, se levanta con media vida ("¡No se puede matar lo que ya está
     muerto!"). Sin el libro, el cartel avisa que hay que ver al Padre Oswin.
   - AL SELLARLO suelta el CRISTAL VERDE (story.flags.cristales.verde, el primero de los tres del monolito).
   Banderas: story.flags.libro_sello, story.flags.cristales. Borrar la línea de index.html: el Nigromante muere a golpes
   como antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined') return;
  const P = MainGameScene.prototype;
  const ATURDE = 5000, LEER = 1500, RADIO = 110;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------------ el Padre Oswin, en el jardín del castillo
  const OSWIN = {
    id: 'oswin', zone: 'castle.garden', x: 586, y: 262, r: 46, name: 'Padre Oswin', face: 'g_priest_idle',
    lines: (s, hero) => {
      const f = fl(s);
      if (f.boss_necromancer || f.cristales && f.cristales.verde) return [
        'El sello aguantó. Lo sentí desde acá: la capilla dejó de llorar.',
        'Guardá bien ese cristal verde. No es una joya: es un pedazo de algo mucho más viejo que este reino.',
        'Dicen los libros que hubo tres. Y que el monolito del este los recuerda a todos.'
      ];
      if (s.step >= 4 && !f.libro_sello) return [
        `Vos sos ${hero}, el que manda el Rey… Me lo imaginaba más alto. Vení, sentate un momento.`,
        'Lo que hay en Brumavieja no es un brujo cualquiera. Ya se murió una vez, y no le gustó.',
        'Con la espada lo vas a tumbar, sí. Pero no se va a quedar tumbado: lo que ya está muerto no se puede matar.',
        'Por eso existe esto: el Libro del Sello. Lo copiaron los monjes del Molle hace tres generaciones.',
        'Cuando lo tengas de rodillas, aturdido, acercate y leé el sello. Mantené T hasta terminar la oración.',
        'Tenés cinco latidos de corazón, no más. Si se te escapa, se levanta con media fuerza y hay que empezar de nuevo.',
        'Llevate también estas dos pociones. Y que la luz te guarde, que la vas a necesitar.'
      ];
      if (f.libro_sello) return ['Cinco latidos, no te olvides. De rodillas, y leé el sello sin soltar.', 'Rezo por vos y por los que quedaron en Brumavieja.'];
      return ['Que la luz te guarde, viajero.', 'Rezo por los que quedaron en Brumavieja. Algún día alguien tendrá que ir.'];
    }
  };
  STORY_NPCS.push(OSWIN, Object.assign({}, OSWIN, { zone: 'ed_jardin_real.main' }));   // el jardín del Taller (el que se usa) y el viejo
  const tk0 = P.onTalked;
  P.onTalked = function (id) {
    const r = tk0.apply(this, arguments);
    try {
      const s = st(this);
      if (id === 'oswin' && s && s.step >= 4 && !fl(s).libro_sello && !fl(s).boss_necromancer) {
        fl(s).libro_sello = true;
        s.inv = s.inv || {}; s.inv.potion = (s.inv.potion || 0) + 2;
        this.updateQuickBar && this.updateQuickBar();
        this.createFloatingText(this.player.x, this.player.y - 56, '📖 LIBRO DEL SELLO', 0xfde68a);
        this.time.delayedCall(500, () => this.createFloatingText(this.player.x, this.player.y - 40, '+2 POCIONES', 0xf87171));
        son('book_clasp', 0.7) || son('book_open', 0.7);
        this.updateObjective && this.updateObjective(); this.saveStory && this.saveStory();
      }
    } catch (e) {}
    return r;
  };
  // el objetivo avisa del libro antes de la capilla
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const s = st(this), t = document.querySelector('#ck-objective .ck-obj-text');
      if (s && t && s.step >= 4 && s.step <= 6 && !fl(s).libro_sello && !fl(s).boss_necromancer && !/Oswin/.test(t.textContent))
        t.textContent += ' · Antes, pasá por el Padre Oswin (jardín del castillo)';
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ el Nigromante no muere a golpes
  const tecla = S => {
    if (!S._ckTeclaT && S.input && S.input.keyboard) S._ckTeclaT = S.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T, false);
    return S._ckTeclaT;
  };
  const dm0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    try {
      const s = st(this);
      if (s && enemy && enemy.type === 'necromancer' && !enemy.isDead && !enemy._ckSellado) {
        if (enemy._ckSello) return;                                    // de rodillas: los golpes no le hacen nada
        const extra = s.up ? s.up.atk || 0 : 0;
        if (!enemy._ckIntangible && enemy.hp - (amount + extra) <= 0) { enemy.hp = 1; caer(this, enemy); return; }
      }
    } catch (e) { console.warn('[libro del sello]', e); }
    return dm0.apply(this, arguments);
  };
  const caer = (S, e) => {
    const s = st(S);
    e._ckSello = { hasta: S.time.now + ATURDE, leido: 0, libro: !!fl(s).libro_sello };
    e.state = 'ck_aturdido'; e._ckRolHasta = S.time.now + ATURDE + 200; e.isAttacking = false;
    e.setVelocity(0, 0); e.setTint(0x9ca3af);
    if (S.anims.exists('necromancer_hurt')) e.play('necromancer_hurt');
    e.anims.pause && S.time.delayedCall(250, () => e.active && e.anims.pause());
    S.cameras.main.shake(250, 0.008);
    son('bone_hit', 0.8, { rate: 0.6 });
    S.createFloatingText(e.x, e.y - 70, e._ckSello.libro ? '¡De rodillas! Mantené T cerca para sellarlo' : '¡De rodillas!… pero no tenés con qué sellarlo', 0xfde68a);
    if (!e._ckSello.libro) S.time.delayedCall(1400, () => S.createFloatingText(S.player.x, S.player.y - 60, 'El Padre Oswin (jardín del castillo) sabe cómo', 0xc7d2fe));
    // el aro que se cierra: el tiempo que queda
    const g = S.add.graphics().setDepth(26001); e._ckSello.aro = g;
    const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
      const q = e._ckSello; if (!q || !e.active) { ev.remove(); g.destroy(); return; }
      const fr = Math.max(0, (q.hasta - S.time.now) / ATURDE), cx = e.x, cy = e.y + 14;
      g.clear();
      g.lineStyle(3, 0x1b0f0a, 0.6).strokeEllipse(cx, cy, 70, 30);
      g.lineStyle(2, 0xfde68a, 0.95).beginPath().arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + fr * Math.PI * 2, false).strokePath();
      if (q.leido > 0) {
        g.fillStyle(0x1b0f0a, 0.8).fillRect(cx - 26, e.y - 64, 52, 6);
        g.fillStyle(0x86efac, 1).fillRect(cx - 25, e.y - 63, 50 * Math.min(1, q.leido / LEER), 4);
      }
    } });
  };
  const levantar = (S, e) => {
    const q = e._ckSello; e._ckSello = null;
    if (q && q.aro) q.aro.destroy();
    if (!e.active || e.isDead) return;
    e.hp = Math.ceil(e.maxHp / 2); e.clearTint(); e.anims.resume && e.anims.resume();
    e.state = 'chase'; e._ckRolHasta = 0;
    S.createFloatingText(e.x, e.y - 74, '¡No se puede matar lo que ya está muerto!', 0xa78bfa);
    son('necro_cast', 0.8, { rate: 0.8 });
    if (window.CK_ONDAS) CK_ONDAS.estallido(S, 'arcano', e.x, e.y + 16, 80, 500);
    S.cameras.main.shake(300, 0.01);
  };
  const sellar = (S, e) => {
    const q = e._ckSello; if (q && q.aro) q.aro.destroy();
    e._ckSello = null; e._ckSellado = true; e.anims.resume && e.anims.resume();
    // letras de luz que se cierran sobre él
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, t = S.add.text(e.x + Math.cos(a) * 70, e.y - 10 + Math.sin(a) * 40, 'ᚱᚦᛟᛉᚨᛊ'[i % 6], { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fde68a', stroke: '#3b2a0a', strokeThickness: 3 }).setOrigin(0.5).setDepth(26002);
      S.tweens.add({ targets: t, x: e.x, y: e.y - 10, alpha: 0, scale: 0.4, duration: 700, delay: i * 25, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
    }
    const luz = S.add.circle(e.x, e.y - 10, 20, 0xfff6c8, 0.9).setDepth(26001).setBlendMode(Phaser.BlendModes.ADD);
    S.tweens.add({ targets: luz, scale: 6, alpha: 0, duration: 900, delay: 600, onComplete: () => luz.destroy() });
    son('book_clasp', 0.9); S.time.delayedCall(600, () => son('ck_habilidad', 0.8) || son('heal', 0.8));
    S.cameras.main.flash(300, 255, 246, 200);
    S.time.delayedCall(700, () => {
      if (!e.active || e.isDead) return;
      S.createFloatingText(e.x, e.y - 80, '¡SELLADO!', 0xfde68a);
      dm0.call(S, e, e.hp + 999, S.player.x, S.player.y);
      const s = st(S); if (!s) return;
      const c = fl(s).cristales || (fl(s).cristales = {});
      if (!c.verde) {
        c.verde = true;
        // el cristal cae, brilla y se junta
        const cr = S.add.star(e.x, e.y - 30, 4, 4, 10, 0x4ade80).setStrokeStyle(2, 0x14532d).setDepth(26002);
        S.tweens.add({ targets: cr, y: e.y + 6, duration: 500, ease: 'Bounce.easeOut' });
        S.tweens.add({ targets: cr, angle: 360, duration: 1600, repeat: 1 });
        S.time.delayedCall(1700, () => {
          S.tweens.add({ targets: cr, x: S.player.x, y: S.player.y - 20, scale: 0.4, alpha: 0, duration: 450, onComplete: () => cr.destroy() });
          S.createFloatingText(S.player.x, S.player.y - 60, '◆ CRISTAL VERDE ◆', 0x4ade80);
          son('quest_done', 0.7) || son('chest_open', 0.7);
          S.saveStory && S.saveStory();
        });
      }
    });
  };
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      if (!this.enemies) return r;
      this.enemies.getChildren().forEach(e => {
        const q = e._ckSello; if (!q || !e.active || e.isDead) return;
        e.setVelocity(0, 0);
        if (this.time.now > q.hasta) { levantar(this, e); return; }
        const p = this.player, cerca = p && Math.hypot(p.x - e.x, p.y - e.y) < RADIO, T = tecla(this);
        const pr = document.getElementById('ck-prompt');
        if (q.libro && cerca && pr) { pr.textContent = 'Mantené T · Leer el sello'; pr.classList.add('on'); }
        if (q.libro && cerca && T && T.isDown && !this.dialogOpen) {
          q.leido += dt || 16;
          if (Math.random() < 0.35) {
            const h = this.add.rectangle(p.x + R(-8, 8), p.y - 30, 5, 6, 0xf5ecd0).setStrokeStyle(1, 0x7c5a2a).setDepth(26001);
            this.tweens.add({ targets: h, x: e.x + R(-10, 10), y: e.y - 20, angle: R(-180, 180), alpha: 0.2, duration: 450, onComplete: () => h.destroy() });
          }
          if (q.leido >= LEER) sellar(this, e);
        } else if (q.leido > 0) q.leido = Math.max(0, q.leido - (dt || 16) * 2);
      });
    } catch (e) { console.warn('[libro del sello]', e); }
    return r;
  };
  window.CK_LIBRO_SELLO = { OSWIN, ATURDE, LEER, sellar };
})();
