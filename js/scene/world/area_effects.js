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

  /** People of the castle: walkers follow their round, the smith hammers; all of them speak when the hero is near. */
  updateCastleActor(a, dt, fx, fy) {
    const sp = a.sprite;
    if (!sp || !sp.active) return;
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
      return;
    }
    const t = a.pts[a.i], dx = t[0] - sp.x, dy = t[1] - sp.y, d = Math.hypot(dx, dy), step = a.speed * dt / 1000;
    if (d <= step) {
      sp.setPosition(t[0], t[1]);
      a.wait = t[2];
      a.i = (a.i + 1) % a.pts.length;
    } else {
      sp.x += dx / d * step; sp.y += dy / d * step;
      if (Math.abs(dx) > 0.5) sp.setFlipX(dx < 0);
      if (!a.moving) { a.moving = true; if (this.anims.exists(a.walk)) sp.play(a.walk, true); }
    }
    sp.setDepth(sp.y);
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
