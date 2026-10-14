'use strict';
/* Life in the areas: flames, embers, weather and ambient effects (addAreaEffects: one "type" per effect), castle actors, generated FX textures and map animations. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /** Animated flame sitting exactly on the fire a sprite already has painted (positions come with the art, CASTLE_FIRE). */
  addFlame(objects, ox, oy, item, depth) {
    const F = window.CASTLE_FIRE, f = F && F.fire && F.fire[item.flame];
    if (!f || !this.textures.exists('cs_flame')) return;
    const sc = item.scale || 1, dir = item.flipX ? -1 : 1;
    const x = ox + item.x + (f.cx - f.W / 2) * sc * dir;
    const y = oy + item.baseY - (item.lift || 0) - (f.H - f.bottom) * sc + 1;
    const fl = this.add.sprite(x, y, 'cs_flame').setOrigin(0.5, 1).setDepth(depth + 0.4)
      .setScale((Math.min(f.w, f.h * 1.15) * sc * 1.3) / F.flame[0], (f.h * sc * 1.12) / F.flame[1]);
    if (this.anims.exists('cs_flame_burn')) fl.play({ key: 'cs_flame_burn', startFrame: Phaser.Math.Between(0, 7) });
    objects.push(fl);
    this.addEmbers(objects, x, y - f.h * sc * 0.6, depth + 0.5);
  },

  /** A few sparks drifting up from a fire. */
  addEmbers(objects, x, y, depth) {
    objects.push(this.add.particles(x, y, 'fx_px', {
      speedY: { min: -26, max: -10 }, speedX: { min: -7, max: 7 }, lifespan: { min: 500, max: 1200 },
      alpha: { start: 0.9, end: 0 }, scale: { start: 1, end: 0.5 }, tint: [0xffe08a, 0xffa64d, 0xff7a3a],
      frequency: 340, quantity: 1, blendMode: 'ADD'
    }).setDepth(depth));
  },

  /** Ambient motion of an area: falling leaves, dust in the light, the fountain, steam, glints on water. */
  addAreaEffects(objects, la, ox, oy) {
    const top = oy + la.h + 30;
    (la.fx || []).forEach(f => {
      const zone = (f.w && f.h) ? { type: 'random', source: new Phaser.Geom.Rectangle(ox + f.x, oy + f.y, f.w, f.h) } : null;
      if (f.type === 'leaves') {
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: zone, speedX: { min: 6, max: 22 }, speedY: { min: 8, max: 20 }, lifespan: { min: 5000, max: 9000 },
          alpha: { start: 0.95, end: 0 }, scale: { min: 1, max: 1.5 }, rotate: { min: 0, max: 360 },
          tint: [0x6fbf5a, 0x9bd46a, 0xd8c24a, 0xc98a3a], frequency: 380, quantity: 1
        }).setDepth(top));
      } else if (f.type === 'dust') {
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: zone, speedX: { min: -2, max: 2 }, speedY: { min: -5, max: -1 }, lifespan: { min: 2600, max: 4200 },
          alpha: { start: 0.6, end: 0 }, scale: 0.5, tint: 0xfff2c8, frequency: 420, quantity: 1, blendMode: 'ADD'
        }).setDepth(top));
      } else if (f.type === 'fountain') {
        objects.push(this.add.particles(ox + f.x, oy + f.y, 'fx_px', {
          speedX: { min: -22, max: 22 }, speedY: { min: -36, max: -14 }, gravityY: 110, lifespan: { min: 480, max: 700 },
          alpha: { start: 0.9, end: 0.2 }, scale: 0.5, tint: [0xe6f7ff, 0x9fd8f2], frequency: 60, quantity: 1
        }).setDepth(oy + f.y + 68));
      } else if (f.type === 'steam') {
        objects.push(this.add.particles(ox + f.x, oy + f.y, 'fx_px', {
          speedX: { min: -4, max: 4 }, speedY: { min: -15, max: -6 }, lifespan: { min: 1200, max: 1900 },
          alpha: { start: 0.32, end: 0 }, scale: { start: 1.4, end: 3.6 }, tint: 0xffffff, frequency: 360, quantity: 1
        }).setDepth(oy + f.y + 60));
      } else if (f.type === 'petals') {
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: zone, speedX: { min: 4, max: 16 }, speedY: { min: 6, max: 16 }, lifespan: { min: 5000, max: 9000 },
          alpha: { start: 0.95, end: 0 }, scale: { min: 0.8, max: 1.3 }, rotate: { min: 0, max: 360 },
          tint: [0xf6c1d2, 0xe88aa8, 0xffe3ec, 0xffffff], frequency: 300, quantity: 1
        }).setDepth(top));
      } else if (f.type === 'bubbles') {
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: zone, speedY: { min: -5, max: -2 }, lifespan: { min: 900, max: 1500 }, alpha: { start: 0.7, end: 0 },
          scale: { start: 0.4, end: 1.5 }, tint: [0x9fb9a8, 0xc8d8cc], frequency: f.slow ? 1400 : 480, quantity: 1
        }).setDepth(7.5));
      } else if (f.type === 'waterfall') {
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(ox + f.x, oy + f.y, f.w, 4) }, speedY: { min: 70, max: 110 }, lifespan: f.h * 11,
          alpha: { start: 0.9, end: 0.5 }, scaleX: 0.5, scaleY: { min: 1.5, max: 3 }, tint: [0xffffff, 0xd6eefc, 0xa8d8f6], frequency: 40, quantity: 1
        }).setDepth(7.5));
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(ox + f.x - 4, oy + f.y + f.h - 4, f.w + 8, 6) }, speedX: { min: -14, max: 14 }, speedY: { min: -22, max: -6 },
          lifespan: { min: 500, max: 900 }, alpha: { start: 0.7, end: 0 }, scale: { start: 1, end: 2.4 }, tint: 0xffffff, frequency: 70, quantity: 1
        }).setDepth(oy + f.y + f.h + 20));
      } else if (f.type === 'butterflies') {
        for (let i = 0; i < (f.n || 5); i++) {
          const b = this.add.image(ox + f.x + Math.random() * f.w, oy + f.y + Math.random() * f.h, 'fx_px')
            .setTint([0xffffff, 0xf6d24a, 0xe88aa8, 0x9fd8f2][i % 4]).setDisplaySize(3, 2).setDepth(top - 2);
          objects.push(b);
          const hop = () => {
            if (!b.active) return;
            this.tweens.add({ targets: b, x: Phaser.Math.Clamp(b.x + Phaser.Math.Between(-46, 46), ox + f.x, ox + f.x + f.w), y: Phaser.Math.Clamp(b.y + Phaser.Math.Between(-30, 30), oy + f.y, oy + f.y + f.h),
              duration: Phaser.Math.Between(900, 1900), ease: 'Sine.easeInOut', onComplete: hop });
          };
          hop();
          this.tweens.add({ targets: b, scaleX: 0.4, duration: 110, yoyo: true, repeat: -1 });
        }
      } else if (f.type === 'crows') {
        // perched crows; they take off when the hero walks up and come back after a while
        const crows = f.pts.map(([x, y]) => {
          const c = this.add.sprite(ox + x, oy + y, 'fx_crow', 0).setOrigin(0.5, 1).setDepth(oy + y).setFlipX(Math.random() < 0.5);
          objects.push(c);
          return { c, hx: ox + x, hy: oy + y, away: false };
        });
        this.time.addEvent({ delay: 220, loop: true, callback: () => {
          if (!this.player || !this.player.body) return;
          const px = this.player.body.center.x, py = this.player.body.center.y;
          crows.forEach(k => {
            if (!k.c.active || !k.c.visible || k.away) return;
            if (Math.random() < 0.02) k.c.setFlipX(!k.c.flipX);            // looks around
            if (Phaser.Math.Distance.Between(px, py, k.hx, k.hy) > 54) return;
            k.away = true;
            const dir = px > k.hx ? -1 : 1;
            k.c.setFlipX(dir < 0).setDepth(top).play('fx_crow_fly');
            sfx.fx('step_grass1', 0.25, { rate: 1.8, minGap: 200 });
            this.tweens.add({ targets: k.c, x: k.hx + dir * Phaser.Math.Between(170, 260), y: k.hy - Phaser.Math.Between(150, 210), alpha: 0, duration: 1900, ease: 'Sine.easeIn',
              onComplete: () => this.time.delayedCall(Phaser.Math.Between(14000, 24000), () => {
                if (!k.c.active) return;
                k.c.stop().setFrame(0).setPosition(k.hx, k.hy).setDepth(k.hy);
                this.tweens.add({ targets: k.c, alpha: 1, duration: 600, onComplete: () => { k.away = false; } });
              }) });
          });
        } });
      } else if (f.type === 'ash') {
        // wind from the left carrying ash and dry leaves
        objects.push(this.add.particles(0, 0, 'fx_px', {
          emitZone: zone, speedX: { min: 70, max: 150 }, speedY: { min: 14, max: 44 }, lifespan: { min: 3200, max: 5600 },
          alpha: { start: 0.8, end: 0 }, scale: { min: 0.5, max: 1.2 }, tint: [0xd9d4c8, 0xb8b0a0, 0x8f8676, 0x6e5a44], frequency: 46, quantity: 1
        }).setDepth(top));
      } else if (f.type === 'fog') {
        for (let i = 0; i < (f.n || 10); i++) {
          const fx0 = ox + f.x + Math.random() * f.w, fy0 = oy + f.y + Math.random() * f.h;
          const g = this.add.image(fx0, fy0, 'fx_glow').setTint(0xcfd8e6).setAlpha(0)
            .setDisplaySize(Phaser.Math.Between(260, 420), Phaser.Math.Between(90, 150)).setDepth(top - 1);
          this.tweens.add({ targets: g, x: fx0 + Phaser.Math.Between(140, 260), duration: Phaser.Math.Between(14000, 24000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 4000) });
          this.tweens.add({ targets: g, alpha: Phaser.Math.FloatBetween(0.16, 0.3), duration: Phaser.Math.Between(5000, 9000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 3000) });
          objects.push(g);
        }
      } else if (f.type === 'storm') {
        // sheet lightning far away: the whole place flashes pale blue twice, every now and then
        const fl = this.add.rectangle(ox + f.x, oy + f.y, f.w, f.h, 0xdfe8ff).setOrigin(0, 0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(top + 2);
        objects.push(fl);
        const strike = () => {
          if (!fl.active) return;
          if (fl.visible) this.tweens.add({ targets: fl, alpha: { from: 0.26, to: 0 }, duration: 130, repeat: 1, repeatDelay: 90 });
          this.time.delayedCall(Phaser.Math.Between(9000, 21000), strike);
        };
        this.time.delayedCall(Phaser.Math.Between(5000, 9000), strike);
      } else if (f.type === 'glints') {
        for (let i = 0; i < (f.n || 6); i++) {
          const g = this.add.image(ox + f.x + Math.random() * f.w, oy + f.y + Math.random() * f.h, 'fx_px')
            .setDisplaySize(Phaser.Math.Between(3, 6), 1).setTint(0xe8f7ff).setAlpha(0).setDepth(7.5);
          this.tweens.add({ targets: g, alpha: 0.85, duration: Phaser.Math.Between(450, 900), yoyo: true, repeat: -1,
            repeatDelay: Phaser.Math.Between(700, 2800), delay: Phaser.Math.Between(0, 2500), ease: 'Sine.easeInOut' });
          objects.push(g);
        }
      }
    });
  },

  /**
   * People of the castle: walkers follow their round (around walls and furniture, see navigation.js), the smith
   * hammers; all of them speak when the hero is near. When a beast comes close, guards go and fight it and
   * everybody else runs away from it (updateActorDanger).
   */
  updateCastleActor(a, dt, fx, fy) {
    const sp = a.sprite;
    if (!sp || !sp.active) return;
    if (a.solid && a.solid.body && (a.solid.x !== sp.x || a.solid.y !== sp.y - 4)) { a.solid.setPosition(sp.x, sp.y - 4); a.solid.body.updateFromGameObject(); }
    if (a.type !== 'smith') {
      const busy = this.updateActorDanger(a, dt);
      if (busy) { if (!a.post) a.post = [sp.x, sp.y]; sp.setDepth(sp.y); return; }
      // the danger is over: first back to where they were, then the round goes on
      if (a.post) {
        const r = this.navFollow(a.nav || (a.nav = {}), sp, a.post[0], a.post[1], a.speed * 1.4, dt);
        if (r === 'walking') { if (!a.moving) { a.moving = true; if (this.anims.exists(a.walk)) sp.play(a.walk, true); } sp.setDepth(sp.y); return; }
        a.post = null; a.nav = {};
        if (a.moving) { a.moving = false; if (this.anims.exists(a.idle)) sp.play(a.idle, true); }
      }
    }
    const dist = Phaser.Math.Distance.Between(fx, fy, sp.x, sp.y);
    if (a.lines && dist < 42 && this.time.now - a.talkAt > 7000) {
      a.talkAt = this.time.now;
      this.createFloatingText(sp.x, sp.y - 50, a.lines[Math.floor(Math.random() * a.lines.length)], 0xffffff);
    }
    if (a.type === 'smith') {
      a.timer -= dt;
      if (a.timer <= 0) {
        a.timer = 1500 + Math.random() * 500;
        if (a.act && this.anims.exists(a.act)) {
          sp.play(a.act);
          sp.once('animationcomplete', () => { if (sp.active && this.anims.exists(a.idle)) sp.play(a.idle); });
        } else {
          // no hammering frames in the sheet: wind up and strike with the whole body
          this.tweens.add({ targets: sp, y: a.y - 4, angle: -6, duration: 300, ease: 'Sine.easeOut', yoyo: true, hold: 60,
            onComplete: () => { if (sp.active) { sp.y = a.y; sp.angle = 0; } } });
        }
        this.time.delayedCall(430, () => {
          if (!sp.active || !this.currentInterior) return;
          a.sparks.explode(7);
          const b = this.player.body, d = Phaser.Math.Distance.Between(b.center.x, b.center.y, a.x, a.y);
          if (d < 260) sfx.fx('anvil_hit', 0.5 * (1 - d / 330), { minGap: 300 });
        });
      }
      return;
    }
    const stopToTalk = dist < 30;
    if (a.wait > 0 || stopToTalk) {
      if (!stopToTalk) a.wait -= dt;
      if (a.moving) { a.moving = false; if (this.anims.exists(a.idle)) sp.play(a.idle, true); }
      if (stopToTalk) sp.setFlipX(fx < sp.x);
      // waiting at a point of the round: those whose sheet has a job to do (the worker hammers) do it now and then
      else if (this.time.now > (a.workAt || 0)) {
        const base = this.actorBase(a), job = [base + '_work', base + '_action'].find(k => this.anims.exists(k));
        a.workAt = this.time.now + 2600 + Math.random() * 2400;
        if (job && a.wait > 900) this.actorPlayOnce(a, job, this.anims.get(job).duration + 50);
      }
      return;
    }
    // the round: from point to point along a path that goes around what is in the way
    const t = a.pts[a.i], r = this.navFollow(a.nav || (a.nav = {}), sp, t[0], t[1], a.speed, dt);
    if (r === 'walking') {
      if (!a.moving) { a.moving = true; if (this.anims.exists(a.walk)) sp.play(a.walk, true); }
    } else {
      // arrived (or that point cannot be reached from here: skip it instead of freezing)
      a.wait = r === 'arrived' ? t[2] : 600;
      a.i = (a.i + 1) % a.pts.length;
      if (a.moving) { a.moving = false; if (this.anims.exists(a.idle)) sp.play(a.idle, true); }
    }
    sp.setDepth(sp.y);
  },

  /** Guard, archer or civilian, from the sheet of a castle person. */
  actorRole(key) {
    if (!/^g_/.test(key || '')) return 'civil';
    if (/^g_archer/.test(key)) return 'archer';
    if (/^g_priest/.test(key)) return 'priest';           // runs from beasts like a civilian, heals when it is safe
    return 'guard';
  },

  /**
   * Beasts in the zone. Guards: shout, run to the closest beast and fight it (archers shoot from a distance),
   * then go back to their round. Civilians: scream and run away from it, wait somewhere safe and come back
   * when it is gone. A guard that takes too many blows is knocked out for a while.
   * Returns true while this takes over the person (the round is paused).
   */
  updateActorDanger(a, dt) {
    if (!a.role || !this.enemies) return false;
    const sp = a.sprite, now = this.time.now, base = this.actorBase(a);
    if (a.down) {
      if (now < a.downUntil) return true;
      // back on their feet: the fall played backwards
      a.down = false; a.hp = a.maxHp || 5;
      sp.clearTint(); sp.setAlpha(1);
      this.createFloatingText(sp.x, sp.y - 46, '¡Todavía puedo pelear!', 0xfde68a);
      a.busyUntil = now + 600;
      this.actorPlayOnce(a, base + '_rise', 600);
      return true;
    }
    if (now < (a.busyUntil || 0)) return true;            // in the middle of a blow, a fright, a blessing…
    const fighter = a.role === 'guard' || a.role === 'archer';
    const sees = (e, r) => {
      if (!e.active || e.isDead || !e.body || e.state === 'dormant') return false;
      const d = Phaser.Math.Distance.Between(sp.x, sp.y, e.body.center.x, e.body.bottom);
      return d < r && (d < 60 || (e.def && e.def.flying) || this.navSightFree(sp.x, sp.y - 2, e.body.center.x, e.body.bottom - 2));
    };
    let threat = null, best = 1e9;
    this.enemies.getChildren().forEach(e => {
      if (!sees(e, fighter ? 170 : 130)) return;
      const d = Phaser.Math.Distance.Between(sp.x, sp.y, e.body.center.x, e.body.bottom);
      if (d < best) { best = d; threat = e; }
    });
    const walkAnim = run => {
      // guards charging use their second walk (lance down) when the sheet has it
      const k = run && this.anims.exists(base + '_walk2') ? base + '_walk2' : a.walk;
      if (!a.moving || a.moveKey !== k) { a.moving = true; a.moveKey = k; if (this.anims.exists(k)) sp.play(k, true); }
    };
    const idleAnim = () => { if (a.moving) { a.moving = false; a.moveKey = null; if (this.anims.exists(a.idle)) sp.play(a.idle, true); } };
    a.nav = a.nav || {};

    if (fighter) {
      if (threat && (!a.fight || !a.fight.enemy.active || a.fight.enemy.isDead)) {
        if (!a.fight) {
          this.createFloatingText(sp.x, sp.y - 46, Phaser.Utils.Array.GetRandom(['¡Alto ahí, bestia!', '¡A las armas!', '¡Por el rey!', '¡Guardia, conmigo!']), 0xfca5a5);
          a.hitAt = now + 350;
        }
        a.fight = { enemy: threat };
      }
      if (!a.fight) return false;
      const e = a.fight.enemy;
      if (!e.active || e.isDead || Phaser.Math.Distance.Between(sp.x, sp.y, e.body.center.x, e.body.bottom) > (a.fight.called ? 420 : 260)) {
        a.fight = null; a.nav = {};
        idleAnim();
        return false;                            // back to the round
      }
      // the beast fights back against whoever is hurting it, unless the hero is right there
      if (!e._target && Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) > 130) e._target = a;
      const ex = e.body.center.x, ey = e.body.bottom, d = Phaser.Math.Distance.Between(sp.x, sp.y, ex, ey);
      sp.setFlipX(ex < sp.x);
      if (a.role === 'archer') {
        if (d > 150 || !this.navSightFree(sp.x, sp.y - 2, ex, ey - 2)) { this.navFollow(a.nav, sp, ex, ey, a.speed * 2, dt); walkAnim(true); return true; }
        idleAnim();
        if (now > (a.hitAt || 0)) { a.hitAt = now + 1700; this.actorShoot(a, e); }
        return true;
      }
      if (d > 24) { this.navFollow(a.nav, sp, ex, ey, a.speed * 2.3, dt); walkAnim(true); return true; }
      idleAnim();
      if (now > (a.hitAt || 0)) { a.hitAt = now + 1100; this.actorStrike(a, e); }
      return true;
    }

    // civilians (and the priest) run away
    if (threat) {
      if (!a.flee) {
        this.createFloatingText(sp.x, sp.y - 46, Phaser.Utils.Array.GetRandom(['¡Auxilio!', '¡Una bestia!', '¡Guardias!', '¡Socorro!']), 0xfca5a5);
        // a start of fright before running (villager sheets have it)
        if (this.anims.exists(base + '_hurt')) { a.busyUntil = now + 380; a.moving = false; this.actorPlayOnce(a, base + '_hurt', 380); }
        // the scream brings the guards of the zone that are close enough, even if they cannot see the beast
        const actors = this.currentInterior && this.currentInterior.area.actors;
        (actors || []).forEach(g => {
          if ((g.role !== 'guard' && g.role !== 'archer') || g.down || g.fight || !g.sprite || !g.sprite.active) return;
          if (Phaser.Math.Distance.Between(g.sprite.x, g.sprite.y, sp.x, sp.y) > 320) return;
          g.fight = { enemy: threat, called: true };
          g.hitAt = this.time.now + 350;
          this.createFloatingText(g.sprite.x, g.sprite.y - 46, Phaser.Utils.Array.GetRandom(['¡Voy!', '¡Ya llego!', '¡Aguantá!']), 0xfde68a);
        });
      }
      a.flee = Object.assign(a.flee || {}, { enemy: threat, until: now + 2500 });
      if (now < (a.busyUntil || 0)) return true;
    }
    if (!a.flee) return a.role === 'priest' ? this.updatePriest(a, dt) : false;
    if (now > a.flee.until) {
      a.flee = null; a.nav = {};
      this.createFloatingText(sp.x, sp.y - 46, Phaser.Utils.Array.GetRandom(['Uf, ya pasó…', '¿Se fue?', 'Qué susto…', '¡Gracias, guardias!']), 0xfde68a);
      // relief: a little jump of joy (villager sheets)
      if (this.anims.exists(base + '_jump')) { a.busyUntil = now + 500; a.moving = false; this.actorPlayOnce(a, base + '_jump', 500); return true; }
      idleAnim();
      return false;
    }
    const e = a.flee.enemy;
    if (e.active && !e.isDead && (!a.flee.goal || now > (a.flee.next || 0))) {
      a.flee.next = now + 800;
      // somewhere free, away from the beast
      const away = Math.atan2(sp.y - e.body.bottom, sp.x - e.body.center.x);
      a.flee.goal = null;
      for (const off of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
        const gx = sp.x + Math.cos(away + off) * 110, gy = sp.y + Math.sin(away + off) * 110;
        if (this.navIsFree(gx, gy) && this.navPath(sp.x, sp.y, gx, gy, 3000)) { a.flee.goal = [gx, gy]; break; }
      }
    }
    if (a.flee.goal && this.navFollow(a.nav, sp, a.flee.goal[0], a.flee.goal[1], a.speed * 2.4, dt) === 'walking') walkAnim(false);
    else { idleAnim(); if (e.active) sp.setFlipX(e.x < sp.x); }
    return true;
  },

  /** Sheet prefix of a castle person ('g_templar', 'npc10'...), from its idle animation. */
  actorBase(a) {
    return a._base || (a._base = String(a.idle || '').replace(/_idle$/, ''));
  },

  /** Play a one-shot animation and go back to idle afterwards (if nothing else took over meanwhile). */
  actorPlayOnce(a, key, maxMs) {
    const sp = a.sprite;
    if (!this.anims.exists(key)) return false;
    sp.play(key, true);
    const token = a._once = (a._once || 0) + 1;
    this.time.delayedCall(maxMs || 800, () => {
      if (a._once !== token || !sp.active || a.down || a.moving) return;
      if (this.anims.exists(a.idle)) sp.play(a.idle, true);
    });
    return true;
  },

  /**
   * Brother Anselmo: goes to a hurt or fallen guard of the zone and heals him; blesses the hero who comes to him
   * hurt (+1 heart, once in a while) when no beast is chasing anybody. Returns true while busy.
   */
  updatePriest(a, dt) {
    const sp = a.sprite, now = this.time.now, base = this.actorBase(a);
    const actors = (this.currentInterior && this.currentInterior.area.actors) || [];
    const patient = actors.filter(g => g !== a && (g.role === 'guard' || g.role === 'archer') && g.sprite && g.sprite.active && (g.down || (g.hp !== undefined && g.hp < (g.maxHp || 5))) && !g.fight)
      .sort((p, q) => Phaser.Math.Distance.Between(sp.x, sp.y, p.sprite.x, p.sprite.y) - Phaser.Math.Distance.Between(sp.x, sp.y, q.sprite.x, q.sprite.y))[0];
    if (patient && Phaser.Math.Distance.Between(sp.x, sp.y, patient.sprite.x, patient.sprite.y) < 320) {
      const d = Phaser.Math.Distance.Between(sp.x, sp.y, patient.sprite.x, patient.sprite.y);
      if (d > 26) {
        this.navFollow(a.nav || (a.nav = {}), sp, patient.sprite.x + (sp.x < patient.sprite.x ? -20 : 20), patient.sprite.y, a.speed * 2, dt);
        if (!a.moving) { a.moving = true; if (this.anims.exists(a.walk)) sp.play(a.walk, true); }
        return true;
      }
      a.moving = false;
      sp.setFlipX(patient.sprite.x < sp.x);
      this.actorHeal(a, patient.sprite.x, patient.sprite.y, () => {
        patient.hp = patient.maxHp || 5;
        if (patient.down) patient.downUntil = 0;              // gets up right away
        else this.createFloatingText(patient.sprite.x, patient.sprite.y - 46, 'Gracias, hermano', 0xfde68a);
      });
      return true;
    }
    // the hero, hurt, next to him, with no beast after anybody
    const pb = this.player.body, dh = Phaser.Math.Distance.Between(sp.x, sp.y, pb.center.x, pb.bottom);
    const calm = !this.enemies.getChildren().some(e => e.active && !e.isDead && e.state === 'chase');
    if (this.health < this.maxHealth && dh < 70 && calm && now > (a.healHeroAt || 0) && !this.dialogOpen) {
      a.healHeroAt = now + 40000;
      sp.setFlipX(pb.center.x < sp.x);
      this.actorHeal(a, pb.center.x, pb.bottom, () => {
        this.health = Math.min(this.maxHealth, this.health + 1);
        this.updateHUD();
        this.createFloatingText(this.player.x, this.player.y - 40, '+1 VIDA', 0x22c55e);
        this.createFloatingText(sp.x, sp.y - 50, 'Que la luz te guarde', 0xfde68a);
      });
      return true;
    }
    // back to his spot after a healing walk
    const home = a.pts[0];
    if (Math.hypot(sp.x - home[0], sp.y - home[1]) > 4) {
      if (this.navFollow(a.nav || (a.nav = {}), sp, home[0], home[1], a.speed, dt) === 'walking') {
        if (!a.moving) { a.moving = true; if (this.anims.exists(a.walk)) sp.play(a.walk, true); }
        return true;
      }
      if (a.moving) { a.moving = false; if (this.anims.exists(a.idle)) sp.play(a.idle, true); }
    }
    return false;
  },

  /** The priest raises his staff: healing light on the patient, and then the effect (done) happens. */
  actorHeal(a, x, y, done) {
    const sp = a.sprite, base = this.actorBase(a);
    a.busyUntil = this.time.now + 900;
    if (!this.actorPlayOnce(a, base + '_heal', 900)) this.tweens.add({ targets: sp, y: sp.y - 3, duration: 200, yoyo: true });
    sfx.fx('heal', 0.5, { minGap: 300 }) || sfx.fx('ice_cast', 0.45, { rate: 1.4 });
    this.time.delayedCall(350, () => {
      if (this.anims.exists('priest_heal_fx')) {
        const fx = this.add.sprite(x, y - 14, 'priest_heal_fx').setDepth(y + 60).setBlendMode(Phaser.BlendModes.ADD);
        fx.play('priest_heal_fx');
        fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
      }
      if (window.CK_LUZ && window.CK_LUZ.agregar) window.CK_LUZ.agregar({ x, y: y - 10, c: [255, 240, 170], r: 60, f: 0.8, ms: 600 });
      done();
    });
  },

  /** A guard's blow: one of the attacks of its sheet (a lunge and a slash if it has none) and 1 damage to the beast. */
  actorStrike(a, e) {
    const sp = a.sprite, dir = e.x < sp.x ? -1 : 1, base = this.actorBase(a);
    const opts = [1, 2, 3].filter(n => this.anims.exists(`${base}_attack${n}`));
    let hitMs = 110;
    if (opts.length) {
      const key = `${base}_attack${Phaser.Utils.Array.GetRandom(opts)}`, an = this.anims.get(key);
      hitMs = Math.round(an.duration * 0.55);
      a.busyUntil = this.time.now + an.duration;
      a.moving = false;
      this.actorPlayOnce(a, key, an.duration);
    } else {
      const x0 = sp.x;
      this.tweens.add({ targets: sp, x: x0 + dir * 5, duration: 90, yoyo: true, onComplete: () => { if (sp.active) sp.x = x0; } });
      const arc = this.add.graphics().setDepth(sp.y + 5);
      arc.lineStyle(3, 0xf8fafc, 0.9);
      arc.beginPath(); arc.arc(sp.x + dir * 12, sp.y - 16, 14, dir > 0 ? -1.2 : Math.PI - 0.6, dir > 0 ? 0.6 : Math.PI + 1.2); arc.strokePath();
      this.tweens.add({ targets: arc, alpha: 0, duration: 180, onComplete: () => arc.destroy() });
    }
    sfx.fx('sword_swing1', 0.4, { minGap: 120, rate: 1.1 });
    this.time.delayedCall(hitMs, () => { if (e.active && !e.isDead && sp.active && !a.down) this.damageEnemy(e, 1, sp.x, sp.y); });
  },

  /** An archer draws (attack animation) and lets the arrow go: it flies to the beast and does 1 damage if it is still there. */
  actorShoot(a, e) {
    const sp = a.sprite, base = this.actorBase(a), key = base + '_attack1';
    let releaseMs = 0;
    if (this.anims.exists(key)) {
      const an = this.anims.get(key);
      releaseMs = Math.round(an.duration * 0.7);
      a.busyUntil = this.time.now + an.duration;
      a.moving = false;
      this.actorPlayOnce(a, key, an.duration);
    }
    this.time.delayedCall(releaseMs, () => {
      if (!sp.active || a.down || !e.active || e.isDead) return;
      const x0 = sp.x + (e.x < sp.x ? -10 : 10), y0 = sp.y - 22, x1 = e.x, y1 = e.y + 4, ang = Math.atan2(y1 - y0, x1 - x0);
      const arrow = this.textures.exists('g_arrow')
        ? this.add.image(x0, y0, 'g_arrow').setScale(0.9).setRotation(ang).setDepth(y0 + 40)
        : this.add.rectangle(x0, y0, 10, 2, 0xe7d3a8).setDepth(y0 + 40).setRotation(ang);
      sfx.fx('bow_shot', 0.35, { minGap: 150 }) || sfx.fx('sword_swing2', 0.3, { rate: 1.6 });
      this.tweens.add({
        targets: arrow, x: x1, y: y1, duration: Math.max(120, Phaser.Math.Distance.Between(x0, y0, x1, y1) / 0.32),
        onComplete: () => { arrow.destroy(); if (e.active && !e.isDead) this.damageEnemy(e, 1, x0, y0); }
      });
    });
  },

  /**
   * A beast hits a guard: knights and templars may block it with the shield; otherwise flash, the hurt animation and
   * a step back. With no strength left the guard falls (death animation) and is out of the fight for a while.
   */
  npcTakeHit(a, dmg, enemy) {
    if (!a || a.down || !a.sprite || !a.sprite.active) return;
    const sp = a.sprite, base = this.actorBase(a), now = this.time.now;
    sp.setFlipX(enemy.x < sp.x);
    if (this.anims.exists(base + '_block') && Math.random() < 0.35) {
      a.busyUntil = now + 320;
      a.moving = false;
      this.actorPlayOnce(a, base + '_block', 320);
      this.createFloatingText(sp.x, sp.y - 40, '¡BLOQUEO!', 0xcbd5e1);
      sfx.fx('shield_block', 0.5, { minGap: 100 }) || sfx.fx('sword_hit', 0.5, { minGap: 100, rate: 1.6 });
      return;
    }
    a.hp = (a.hp === undefined ? (a.maxHp || 5) : a.hp) - dmg;
    sp.setTint(0xff5555);
    this.time.delayedCall(140, () => { if (sp.active && !a.down) sp.clearTint(); });
    this.createFloatingText(sp.x, sp.y - 40, '-' + dmg, 0xfca5a5);
    sfx.fx('sword_hit', 0.45, { minGap: 80 });
    const ang = Math.atan2(sp.y - enemy.y, sp.x - enemy.x), bx = sp.x + Math.cos(ang) * 8, by = sp.y + Math.sin(ang) * 8;
    if (this.navIsFree(bx, by)) sp.setPosition(bx, by);
    if (a.hp <= 0) {
      a.down = true; a.downUntil = now + 12000; a.fight = null; a.moving = false;
      sp.setTint(0xb8bcc6);
      if (this.anims.exists(base + '_death')) { a._once = (a._once || 0) + 1; sp.play(base + '_death', true); }   // stays on the floor
      else { sp.setTint(0x6b7280).setAlpha(0.85); if (this.anims.exists(a.idle)) sp.play(a.idle, true); }
      this.createFloatingText(sp.x, sp.y - 46, '¡Estoy herido!', 0xfca5a5);
    } else if (this.anims.exists(base + '_hurt')) {
      a.busyUntil = now + 300;
      a.moving = false;
      this.actorPlayOnce(a, base + '_hurt', 300);
    }
  },

  /** Small generated textures for lighting: a banded (pixel-art) glow and a room vignette. */
  ensureFxTextures() {
    if (!this.textures.exists('fx_glow')) {
      const t = this.textures.createCanvas('fx_glow', 64, 64), c = t.getContext();
      [[32, 0.10], [27, 0.14], [21, 0.20], [15, 0.28], [9, 0.40], [4, 0.55]].forEach(([r, a]) => {
        c.fillStyle = 'rgba(255,255,255,' + a + ')';
        c.beginPath(); c.arc(32, 32, r, 0, Math.PI * 2); c.fill();
      });
      t.refresh();
    }
    if (!this.textures.exists('fx_crow')) {
      // 3 frames of 12x10: perched, wings up, wings down
      const t = this.textures.createCanvas('fx_crow', 36, 10), c = t.getContext();
      const P = (f, pts, col) => { c.fillStyle = col; pts.forEach(([x, y, w, h]) => c.fillRect(f * 12 + x, y, w || 1, h || 1)); };
      P(0, [[4, 4, 5, 4], [3, 5, 1, 2], [8, 3, 2, 2], [2, 7, 2, 1], [5, 8, 1, 2], [7, 8, 1, 2]], '#17141c'); P(0, [[10, 4]], '#c9a03a'); P(0, [[9, 3]], '#e8e8f0');
      P(1, [[4, 5, 5, 2], [9, 5, 2, 1], [2, 1, 2, 2], [3, 3, 2, 2], [7, 1, 2, 2], [6, 3, 2, 2], [2, 6, 2, 1]], '#17141c'); P(1, [[11, 5]], '#c9a03a');
      P(2, [[4, 4, 5, 2], [9, 4, 2, 1], [3, 6, 2, 2], [2, 8, 2, 1], [6, 6, 2, 2], [7, 8, 2, 1], [2, 5, 2, 1]], '#17141c'); P(2, [[11, 4]], '#c9a03a');
      t.refresh();
      [0, 1, 2].forEach(i => t.add(i, 0, i * 12, 0, 12, 10));
      this.anims.create({ key: 'fx_crow_fly', frames: [{ key: 'fx_crow', frame: 1 }, { key: 'fx_crow', frame: 2 }], frameRate: 9, repeat: -1 });
    }
    Object.entries(MAP_SHEETS).forEach(([k, sh]) => {
      if (!this.textures.exists(k)) return;
      Object.entries(sh.anims).forEach(([name, an]) => {
        if (!this.anims.exists(name)) this.anims.create({ key: name, frames: an.frames.map(fr => ({ key: k, frame: fr })), frameRate: an.fps, repeat: -1, yoyo: !!an.yoyo });
      });
    });
    if (!this.textures.exists('fx_px')) {
      const t = this.textures.createCanvas('fx_px', 2, 2), c = t.getContext();
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 2, 2); t.refresh();
    }
    const loop = (key, sheet, n, rate) => {
      if (!this.anims.exists(key) && this.textures.exists(sheet)) {
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: n - 1 }), frameRate: rate, repeat: -1 });
      }
    };
    loop('cs_flame_burn', 'cs_flame', 8, 10);
    loop('cs_fl_red_sway', 'cs_fl_red', 8, 6);
    loop('cs_fl_white_sway', 'cs_fl_white', 8, 7);
    ['cs_door', 'cs_gate'].forEach(sheet => {
      if (!this.textures.exists(sheet)) return;
      const fr = this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 });
      if (!this.anims.exists(sheet + '_open')) this.anims.create({ key: sheet + '_open', frames: fr, frameRate: 10, repeat: 0 });
      if (!this.anims.exists(sheet + '_close')) this.anims.create({ key: sheet + '_close', frames: fr.slice().reverse(), frameRate: 10, repeat: 0 });
    });
    if (!this.textures.exists('fx_vignette')) {
      const t = this.textures.createCanvas('fx_vignette', 160, 120), c = t.getContext();
      const g = c.createRadialGradient(80, 60, 34, 80, 60, 104);
      g.addColorStop(0, 'rgba(14,10,24,0)'); g.addColorStop(0.6, 'rgba(14,10,24,0.14)'); g.addColorStop(1, 'rgba(14,10,24,0.50)');
      c.fillStyle = g; c.fillRect(0, 0, 160, 120);
      t.refresh();
    }
  }
});
