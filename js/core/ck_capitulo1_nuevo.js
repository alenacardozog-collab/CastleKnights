'use strict';
/* Capítulo 1 de la historia nueva, escenas chicas (11/11; documento "CastleKnight — Historia y guion"):
   - EL GESTO DEL REY (partidas nuevas): apenas termina de presentarse, Aldric se limpia la mano en la capa y le dice
     algo por lo bajo al mercenario de la puerta ("Vigílenlo. Que no meta la nariz donde no le importa."). Sólo se ve
     si uno mira: es la primera pista de que al Rey le importa poco su gente.
   - ABY INTERRUMPE (pedido del dueño: "volvemos después de la emboscada al pueblo y ahí Aby nos interrumpe diciendo que
     llegamos primero que ella pero que no nos llevaremos toda la gloria"): la primera vez que el héroe vuelve a la
     aldea después de la emboscada de Brumavieja (story.flags.bruma_noche), Aby llega corriendo, lo frena y se va. Si el
     héroe que jugás es Aby, la escena la hace Lancent. Desde ahí los encuentros y misiones de los
     otros héroes (ck_heroes_npc.js) siguen como siempre.
   Banderas: rey_gesto, aby_interrumpe. Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});
  const E = () => window.CK_ESCENA;
  const cerca = (S, re, x, y) => {
    let m = null, md = 1e9;
    (S.children ? S.children.list : []).forEach(o => {
      if (!o.active || !o.visible || o.type !== 'Sprite' || !re.test(o.texture && o.texture.key || '')) return;
      const d = Math.hypot(o.x - x, o.y - y); if (d < md) { md = d; m = o; }
    });
    return m;
  };

  // ------------------------------------------------------------------ el gesto del Rey
  const tk0 = P.onTalked;
  P.onTalked = function (id) {
    const s = st(this), antes = s ? s.step : -1;
    const r = tk0.apply(this, arguments);
    try {
      if (id === 'king' && s && fl(s).v2 && antes === 0 && !fl(s).rey_gesto && E()) {
        fl(s).rey_gesto = true;
        const rey = cerca(this, /^(king_|ck_rey_sentado|ckc_rey)/, this.player.x, this.player.y);
        if (rey) {
          this.time.delayedCall(900, async () => {
            if (!rey.active) return;
            this.createFloatingText(rey.x, rey.y - 46, '*se limpia la mano en la capa*', 0xc7b9a6);
            await E().esperar(1500);
            const merc = cerca(this, /^g_axeman/, rey.x, rey.y);
            await E().globo(this, rey, '(por lo bajo) Vigílenlo. Que no meta la nariz donde no le importa.', 3200, 50);
            if (merc && merc.active) await E().globo(this, merc, 'Como mande, Majestad.', 1800, 46);
          });
        }
      }
    } catch (e) { console.warn('[cap. 1]', e); }
    return r;
  };

  // ------------------------------------------------------------------ Aby interrumpe
  const HEROE_TEX = { swordsman: 'swordsman', soldier: 'soldier', wizard: 'wizard' };
  const nombreDe = h => { const D = (typeof HEROES !== 'undefined' && HEROES[h]) || {}; return D.name ? D.name.charAt(0) + D.name.slice(1).toLowerCase() : (h === 'swordsman' ? 'Aby' : 'Lancent'); };
  const escenaAby = async S => {
    const s = st(S); if (!s || !E() || S._ckEscena) return;
    const quien = S.playerHero === 'swordsman' ? 'soldier' : 'swordsman', base = HEROE_TEX[quien];
    if (!S.textures.exists(base + '_idle')) return;
    fl(s).aby_interrumpe = true;
    await E().correr(S, async () => {
      const p = S.player, lado = p.x > S.cameras.main.worldView.centerX ? -1 : 1;
      const sp = S.add.sprite(p.x + lado * 260, p.y, base + '_idle').setOrigin(0.5, p.originY).setScale(p.scaleX).setDepth(p.y);
      sp._ckAnim = base;
      if (S.anims.exists(base + '_idle')) sp.play(base + '_idle');
      await E().caminar(S, sp, p.x + lado * 60, p.y, 120, { mundo: true });
      sp.setFlipX(lado > 0);
      p.setFlipX(lado < 0);
      const n = nombreDe(quien), yo = nombreDe(S.playerHero);
      await E().dialogo(S, n, quien === 'swordsman' ? [
        `¡Eh, vos! ¿Vos sos ${yo}? ¿El que se metió en Brumavieja antes que yo?`,
        'Llegaste primero, te lo concedo. Y saliste entero, que ya es bastante.',
        'Pero no te vas a llevar toda la gloria. Ese encapuchado de la capilla me debe una, y la pienso cobrar.',
        'Soy Aby. Si algún día querés pelear al lado mío, ganátelo: tengo un par de cuentas pendientes por la zona.'
      ] : [
        `¡Alto ahí! ¿Vos sos ${yo}? ¿La que se metió sola en Brumavieja?`,
        'Llegaste primero, te lo concedo. Pero no te vas a llevar toda la gloria.',
        'Soy Lancent. El Rey me mandó a mí también. Si querés que peleemos juntos, demostrá que no fue suerte.'
      ], base + '_idle');
      await E().caminar(S, sp, sp.x + lado * 300, sp.y + 20, 140, { mundo: true });
      S.tweens.add({ targets: sp, alpha: 0, duration: 400, onComplete: () => sp.destroy() });
      S.saveStory && S.saveStory();
    });
  };
  const up0 = P.updateStory;
  P.updateStory = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      const s = st(this);
      if (s && fl(s).bruma_noche && !fl(s).aby_interrumpe && this.currentZoneKey && this.currentZoneKey() === 'village' && !this.dialogOpen && !this._ckEscena && !this._doorTransition && this.player) {
        this._ckAbyT = (this._ckAbyT || 0) + (dt || 16);
        if (this._ckAbyT > 1500) { this._ckAbyT = 0; escenaAby(this); }
      } else this._ckAbyT = 0;
    } catch (e) {}
    return r;
  };
  window.CK_CAPITULO1_NUEVO = { escenaAby };
})();
