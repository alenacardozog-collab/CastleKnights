'use strict';
/* Attacks and skills of the heroes and how they hit: melee, dash, thunder, arrow rain, spin, arrows, fireball. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Primary Attack (Combo Attack01 & Attack02)
   */
  performAttack() {
    if (this._gameMode === 'campaign' || this.isAttacking || this.isDead) return;

    this.isAttacking = true;

    if (this.playerHero === 'wizard') {
      this.lastAttackCombo = this.lastAttackCombo === 1 ? 2 : 1;
      this.player.play('wizard_attack1');
      sfx.fx('ice_cast', 0.7) || sfx.playMagic();

      // Magic hit window midway through animation
      this.time.delayedCall(190, () => {
        if (this.isDead) return;
        this.checkWizardMagicHits();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) {
          this.player.play('wizard_idle');
        }
      });
      return;
    }

    this.lastAttackCombo = this.lastAttackCombo === 1 ? 2 : 1;
    const animKey = `${this.playerHero}_attack${this.lastAttackCombo}`;

    this.player.play(animKey);
    sfx.fx(this.lastAttackCombo === 1 ? 'sword_swing1' : 'sword_swing2', 0.75) || sfx.playSwing();

    // Active hit window midway through animation
    this.time.delayedCall(160, () => {
      if (this.isDead) return;
      this.checkMeleeHits();
    });

    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.player.play(`${this.playerHero}_idle`);
      }
    });
  },

  /**
   * Special Attack:
   * - Soldier: Shoots an arrow projectile
   * - Wizard: Launches an exploding fireball projectile
   * - Orc: Heavy ground smash shockwave AOE
   */
  performSpecialAttack() {
    if (this._gameMode === 'campaign' || this.isAttacking || this.isDead) return;

    this.isAttacking = true;

    if (this.playerHero === 'wizard') {
      // Wizard Fireball Cast (14 frames)
      this.player.play('wizard_attack2');
      sfx.fx('fire_cast', 0.8) || sfx.playFireball();

      this.time.delayedCall(230, () => {
        if (!this.isDead) this.castFireball();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('wizard_idle');
      });
    } else if (this.playerHero === 'soldier') {
      // Soldier Bow Shot
      this.player.play('soldier_attack3');
      sfx.fx('bow_shot', 0.8) || sfx.playShoot();

      this.time.delayedCall(220, () => {
        if (!this.isDead) this.shootArrow();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('soldier_idle');
      });
    } else {
      // Orc Ground Smash
      this.player.play('orc_attack2');
      sfx.playSwing();

      this.time.delayedCall(200, () => {
        if (!this.isDead) this.createGroundSmash();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('orc_idle');
      });
    }
  },

  /**
   * Special Dash Movement:
   * - Soldier: Physical forward dash thrust with cyan afterimages
   * - Wizard: Arcane Blink with violet/cyan astral phase and invulnerability
   */
  performDash() {
    if (this.isDead || this.isDashing) return;

    const now = this.time.now;
    if (now - this.lastDashTime < this.dashCooldown) return;

    // Check Stamina: Dash consumes half the stamina bar (50%)
    const dashCost = this.dashStaminaCost || 50;
    if (this.stamina < dashCost) {
      this.showLowStaminaWarning('Dash');
      return;
    }

    this.stamina = Math.max(0, this.stamina - dashCost);
    this.updateStaminaBar();

    this.isDashing = true;
    this.lastDashTime = now;
    this.isAttacking = false;
    this.isInvulnerable = true;

    // Determine dash direction vector (from keys or facing direction)
    let vx = 0;
    let vy = 0;
    if ((this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown) vx -= 1;
    if ((this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown) vx += 1;
    if ((this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown) vy -= 1;
    if ((this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown) vy += 1;

    if (vx === 0 && vy === 0) {
      vx = this.facingDirection === 'left' ? -1 : 1;
      vy = 0;
    } else {
      const mag = Math.hypot(vx, vy);
      vx /= mag;
      vy /= mag;
    }

    // Orient character sprite
    if (vx < 0) {
      this.player.setFlipX(true);
      this.facingDirection = 'left';
    } else if (vx > 0) {
      this.player.setFlipX(false);
      this.facingDirection = 'right';
    }

    // Set forward dash velocity
    const isWizard = this.playerHero === 'wizard';
    const dashSpeed = isWizard ? 460 : 440;
    this.player.setVelocity(vx * dashSpeed, vy * dashSpeed);

    // Play animation & sound (Wizard uses dash.png)
    if (isWizard) {
      this.player.play('wizard_dash');
      sfx.fx('teleport', 0.8) || sfx.playMagic();
    } else {
      this.player.play('soldier_dash');
      sfx.fx('dash', 0.8) || sfx.playDash();
    }

    // Afterimage / ghost trail effect
    const ghostKey = isWizard ? 'wizard_dash' : 'soldier_dash';
    const ghostTint = isWizard ? 0xc084fc : 0x38bdf8;
    const ghostTimer = this.time.addEvent({
      delay: 50,
      repeat: 4,
      callback: () => {
        if (!this.player || this.isDead) return;
        const ghost = this.add.sprite(this.player.x, this.player.y, ghostKey);
        const maxF = isWizard ? 5 : 6;
        const curFrame = this.player.anims.currentFrame ? this.player.anims.currentFrame.index - 1 : 2;
        ghost.setFrame(Math.min(Math.max(curFrame, 0), maxF));
        ghost.setFlipX(this.player.flipX);
        ghost.setScale(this.player.scaleX, this.player.scaleY);
        ghost.setAlpha(0.6);
        ghost.setTint(ghostTint);
        ghost.setDepth(this.player.depth - 1);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: this.player.scaleX * 0.9,
          scaleY: this.player.scaleY * 0.9,
          duration: 200,
          onComplete: () => ghost.destroy()
        });
      }
    });

    // Active strike window midway through dash
    this.time.delayedCall(140, () => {
      if (this.isDead || !this.isDashing) return;
      if (isWizard) {
        this.checkWizardMagicHits();
      } else {
        this.checkMeleeHits();
      }
    });

    // On animation complete or timeout, restore normal movement and idle
    this.time.delayedCall(340, () => {
      if (this.isDashing) {
        this.isDashing = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead) {
          this.player.setVelocity(0, 0);
          this.player.play(`${this.playerHero}_idle`);
        }
      }
    });
  },

  /**
   * Special Whirlwind Spin Attack (Soldier):
   * Spins 360 degrees TWO full times before stopping, dealing sweeping AOE damage
   * to all surrounding enemies in a 360-degree radius with wind ghost trails and whoosh sound.
   */
  /**
   * HOROS - THUNDER NOVA (chargeable area spell).
   * Hold the key to charge, release to strike:
   *   tap            level 1  small burst around him
   *   held 2 seconds level 2  stronger bolt, wider shockwave
   *   held 3 seconds level 3  epic strike: 5 tiles of reach, glowing bolts, big camera shake
   * His own lightning never hurts him. While charging, an arcane guard blocks the first
   * hit and later hits hurt him but never interrupt the charge.
   */
  performThunder() {
    if (this.playerHero !== 'wizard') return;
    if (this.isDead || this.thunderCharge || this.isCastingThunder || this.isDashing || this.isSpinning || this.isAttacking) return;
    if (this._doorTransition || this.isGamePaused) return;
    const now = this.time.now;
    const COOLDOWN = 2500, COST = 45;
    if (now - (this.lastThunderTime || -99999) < COOLDOWN) return;
    if (this.stamina < COST) { this.showLowStaminaWarning('Trueno'); return; }

    this.stamina = Math.max(0, this.stamina - COST);
    this.updateStaminaBar();
    this.isCastingThunder = true;
    this.isAttacking = true;          // freezes movement, like any other attack
    const p = this.player;
    p.setVelocity(0, 0);
    if (this.anims.exists('wizard_thunder_raise')) p.play('wizard_thunder_raise');
    sfx.fx('thunder_hold', 0.7);

    this.thunderCharge = {
      start: now, level: 1, health: this.health, released: false,
      glow: this.add.graphics().setDepth(p.depth + 2).setBlendMode(Phaser.BlendModes.ADD),
      ring: this.add.graphics().setDepth(Math.max(8, p.depth - 2))
    };
  },

  /** Reach / power of each charge level. */
  thunderLevelInfo(level) {
    return [
      null,
      { radius: 40, damage: 2, color: 0x7dd3fc },
      { radius: 60, damage: 3, color: 0xe0f2fe },
      { radius: 80, damage: 4, color: 0xfef08a }   // 5 tiles
    ][level];
  },

  /** Called every frame: grows the charge while the key is held and fires on release. */
  updateThunderCharge() {
    const c = this.thunderCharge;
    if (!c) return;
    const p = this.player;
    const end = () => {
      c.glow.destroy(); c.ring.destroy();
      sfx.fxStop('thunder_hold');
      this.thunderCharge = null;
    };
    // cancelled only by dying or leaving the room (getting hit does not interrupt it)
    if (this.isDead || this._doorTransition || this.playerHero !== 'wizard') {
      end();
      this.isCastingThunder = false;
      this.isAttacking = false;
      return;
    }
    const now = this.time.now;
    const held = now - c.start;
    const curAnim = p.anims.currentAnim && p.anims.currentAnim.key;
    if (curAnim !== 'wizard_thunder_raise' && this.anims.exists('wizard_thunder_raise')) { p.play('wizard_thunder_raise'); p.anims.setProgress && p.anims.setProgress(1); }
    const MIN_RAISE = 380, L2 = 2000, L3 = 3000, AUTO = 4200;
    const keyDown = (this.keySpin && this.keySpin.isDown) || (this.keyUltimate && this.keyUltimate.isDown) ||
      (this._thunderTestHold && held < this._thunderTestHold);
    const level = held >= L3 ? 3 : held >= L2 ? 2 : 1;

    if (level > c.level) {
      c.level = level;
      const info = this.thunderLevelInfo(level);
      this.createFloatingText(p.x, p.y - 46, level === 3 ? '¡CARGA MÁXIMA!' : 'CARGA 2', info.color);
      this.cameras.main.shake(90, level === 3 ? 0.004 : 0.002);
      sfx.fx('ice_cast', 0.5, { rate: level === 3 ? 1.5 : 1.2 });
      c.pulse = now;
    }

    // staff glow + reach preview on the ground
    const k = p.scaleX, dir = p.flipX ? -1 : 1;
    const info = this.thunderLevelInfo(c.level);
    const prog = Math.min(1, held / L3);
    const flick = 0.85 + Math.random() * 0.3;
    const r = (2.5 + prog * 6 + (c.level - 1) * 1.5) * k / 1.2 * flick;
    const gx = p.x + dir * 6.5 * k, gy = p.y - 18 * k;
    const g = c.glow;
    g.clear();
    g.fillStyle(0x38bdf8, 0.25); g.fillCircle(gx, gy, r * 2.6);
    g.fillStyle(info.color, 0.5); g.fillCircle(gx, gy, r * 1.5);
    g.fillStyle(0xffffff, 0.95); g.fillCircle(gx, gy, r * 0.65);
    g.lineStyle(1, 0xffffff, 0.9);
    for (let i = 0; i < 2 + c.level * 2; i++) {
      const a = Math.random() * Math.PI * 2, l = r * (1.6 + Math.random() * (1.5 + c.level));
      const mx = gx + Math.cos(a) * l * 0.5 + (Math.random() * 4 - 2), my = gy + Math.sin(a) * l * 0.5 + (Math.random() * 4 - 2);
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(mx, my); g.lineTo(gx + Math.cos(a) * l, gy + Math.sin(a) * l); g.strokePath();
    }
    // arcane guard: faint shell while it is still up, bright flash when it eats a hit
    const gf = c.guardFlash ? Math.max(0, 1 - (now - c.guardFlash) / 350) : 0;
    if (!c.guardUsed || gf > 0) {
      g.lineStyle(gf > 0 ? 3 : 1, 0xbae6fd, gf > 0 ? gf : 0.25 + 0.12 * Math.sin(now / 120));
      g.strokeEllipse(p.x, p.y + 2 * k, 26 * k + gf * 8, 30 * k + gf * 8);
    }
    if (c.level === 3) {      // aura around the whole wizard at full charge
      g.fillStyle(0xfef08a, 0.10 + 0.08 * Math.sin(now / 60)); g.fillCircle(p.x, p.y, 20 * k);
    }
    const cx = p.body ? p.body.center.x : p.x, cy = p.body ? p.body.bottom : p.y + 12;
    const pulse = c.pulse ? Math.max(0, 1 - (now - c.pulse) / 300) : 0;
    c.ring.clear();
    c.ring.lineStyle(1 + Math.round(pulse * 2), info.color, 0.35 + 0.25 * Math.sin(now / 90) + pulse * 0.4);
    c.ring.strokeEllipse(cx, cy, info.radius * 2, info.radius * 2 * 0.72);

    // release
    if ((!keyDown && held >= MIN_RAISE) || held >= AUTO) {
      const lvl = c.level;
      end();
      if (this.anims.exists('wizard_thunder_slam')) p.play('wizard_thunder_slam');
      this.isInvulnerable = true;
      this.time.delayedCall(110, () => this.thunderStrike(lvl));
      this.time.delayedCall(lvl === 3 ? 900 : 560, () => {
        this.isCastingThunder = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        if (!this.isDead && p.active && this.playerHero === 'wizard') p.play('wizard_idle', true);
      });
    }
  },

  /** The lightning itself. level 1..3 decides size, brightness, shake and damage. */
  thunderStrike(level) {
    const p = this.player;
    if (this.isDead || !p.active) return;
    const info = this.thunderLevelInfo(level);
    const RADIUS = info.radius, SQUASH = 0.72;
    const big = level === 3;
    this.lastThunderTime = this.time.now;
    const cx = p.body ? p.body.center.x : p.x;
    const cy = p.body ? p.body.bottom : p.y + 12;
    const cam = this.cameras.main;
    const fx = [];
    const mk = (o) => { fx.push(o); return o; };
    const life = big ? 1500 : 900;
    this.time.delayedCall(life, () => fx.forEach(o => { try { o.remove ? o.remove() : o.destroy(); } catch (e) { } }));

    // Jagged line helper (pixel-art lightning)
    const bolt = (g, x0, y0, x1, y1, jitter, width, color, alpha) => {
      const steps = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7));
      g.lineStyle(width, color, alpha);
      g.beginPath(); g.moveTo(x0, y0);
      const nx = -(y1 - y0), ny = (x1 - x0), nl = Math.hypot(nx, ny) || 1;
      for (let i = 1; i < steps; i++) {
        const t = i / steps, off = (Math.random() * 2 - 1) * jitter;
        g.lineTo(Math.round(x0 + (x1 - x0) * t + (nx / nl) * off), Math.round(y0 + (y1 - y0) * t + (ny / nl) * off));
      }
      g.lineTo(x1, y1); g.strokePath();
    };

    // sound
    if (big) { sfx.fx('thunder_epic', 1) || sfx.fx('thunder_strike', 1); sfx.fx('thunder_strike', 0.8, { rate: 0.8 }); }
    else sfx.fx('thunder_strike', level === 2 ? 1 : 0.8, { rate: level === 2 ? 0.92 : 1.08 }) || (sfx.playAlert && sfx.playAlert());

    // flash + shake (level 3: double flash like real lightning, long heavy shake)
    const flash = mk(this.add.rectangle(cam.worldView.centerX, cam.worldView.centerY, cam.worldView.width + 60, cam.worldView.height + 60, big ? 0xfffbeb : 0xdbeafe, [0, 0.3, 0.45, 0.8][level]).setDepth(99990));
    this.tweens.add({ targets: flash, alpha: 0, duration: big ? 160 : 200 });
    if (big) this.time.delayedCall(210, () => { if (flash.active) { flash.setAlpha(0.55); this.tweens.add({ targets: flash, alpha: 0, duration: 380 }); } });
    cam.shake([0, 200, 320, 750][level], [0, 0.005, 0.011, 0.024][level]);

    // 1) bolts from the sky onto Horos
    const sky = mk(this.add.graphics().setDepth(p.depth + 3));
    const skyGlow = mk(this.add.graphics().setDepth(p.depth + 2).setBlendMode(Phaser.BlendModes.ADD));
    const top = cam.worldView.y - 30;
    const W = [0, 1, 1.5, 2.4][level];
    const ticks = [0, 4, 6, 11][level];
    let tick = 0;
    const drawSky = () => {
      sky.clear(); skyGlow.clear();
      const fade = 1 - tick / (ticks + 1);
      const strands = big ? 3 : level;
      for (let sI = 0; sI < strands; sI++) {
        const sx = cx + (Math.random() * 2 - 1) * (26 + sI * 22);
        if (level >= 2) { skyGlow.lineStyle(Math.round(16 * W), 0x38bdf8, 0.10 * fade); skyGlow.lineBetween(sx, top, cx, cy); }
        if (big) { skyGlow.lineStyle(Math.round(9 * W), 0xfef9c3, 0.16 * fade); skyGlow.lineBetween(sx, top, cx, cy); }
        bolt(sky, sx, top, cx, cy, 9, Math.round(7 * W), 0x38bdf8, 0.35 * fade);
        bolt(sky, sx, top, cx, cy, 7, Math.round(4 * W), big ? 0xfde68a : 0x7dd3fc, 0.8 * fade);
        bolt(sky, sx, top, cx, cy, 5, Math.max(2, Math.round(2 * W)), 0xffffff, fade);
        const by = top + (cy - top) * (0.3 + Math.random() * 0.4);
        bolt(sky, cx, by, cx + (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 22 * W), by + 22 * W, 4, 1, 0xe0f2fe, 0.9 * fade);
      }
      // bright impact core
      skyGlow.fillStyle(0xffffff, 0.5 * fade); skyGlow.fillEllipse(cx, cy, 9 * W, 5 * W);
      tick++;
    };
    drawSky();
    mk(this.time.addEvent({ delay: 45, repeat: ticks, callback: drawSky }));
    this.time.delayedCall(45 * (ticks + 2), () => { sky.clear(); skyGlow.clear(); });

    // 2) shockwave: random forked lightning racing over the ground (no rings).
    //    Every cast builds a different set of crooked paths, then they grow outward,
    //    crackle for a moment and burn out.
    const ground = mk(this.add.graphics().setDepth(Math.max(8, p.depth - 2)));
    const top8 = mk(this.add.graphics().setDepth(p.depth + 1).setBlendMode(Phaser.BlendModes.ADD));
    const makePath = (angle, length, wobble) => {
      const pts = [{ x: 0, y: 0 }];
      let a = angle, d = 0;
      while (d < length) {
        const step = 4 + Math.random() * 5;
        a += (Math.random() * 2 - 1) * wobble;
        // keep heading roughly outward so it never curls back to the centre
        a = angle + Math.max(-0.9, Math.min(0.9, a - angle));
        d += step;
        const last = pts[pts.length - 1];
        pts.push({ x: last.x + Math.cos(a) * step, y: last.y + Math.sin(a) * step });
      }
      return pts;
    };
    const paths = [];
    const mainCount = [0, 7, 10, 15][level];
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < mainCount; i++) {
      const angle = offset + (i + (Math.random() * 0.7 - 0.35)) * Math.PI * 2 / mainCount;
      const length = RADIUS * (0.55 + Math.random() * 0.5);
      const main = makePath(angle, length, 0.55);
      paths.push({ pts: main, start: 0, width: 1 });
      // forks leaving the main bolt
      const forks = (level === 1 ? 1 : 2) + (Math.random() < 0.5 ? 1 : 0);
      for (let f = 0; f < forks; f++) {
        const at = 2 + Math.floor(Math.random() * Math.max(1, main.length - 3));
        const from = main[Math.min(at, main.length - 1)];
        const side = Math.random() < 0.5 ? -1 : 1;
        const fork = makePath(angle + side * (0.5 + Math.random() * 0.6), length * (0.2 + Math.random() * 0.3), 0.6)
          .map(q => ({ x: q.x + from.x, y: q.y + from.y }));
        paths.push({ pts: fork, start: at / main.length * 0.75, width: 0.6 });
      }
    }
    const spread = { t: 0 };
    const GROW = 0.55;                      // fraction of the time spent travelling outward
    const drawPath = (g, path, upto, width, color, alpha, jit) => {
      const n = Math.max(2, Math.ceil(path.pts.length * upto));
      g.lineStyle(width, color, alpha);
      g.beginPath();
      for (let i = 0; i < n && i < path.pts.length; i++) {
        const q = path.pts[i];
        const x = Math.round(cx + q.x + (i ? (Math.random() * 2 - 1) * jit : 0));
        const y = Math.round(cy + q.y * SQUASH + (i ? (Math.random() * 2 - 1) * jit : 0));
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokePath();
      const tip = path.pts[Math.min(n, path.pts.length) - 1];
      return { x: cx + tip.x, y: cy + tip.y * SQUASH };
    };
    const drawGround = () => {
      ground.clear(); top8.clear();
      const t = spread.t;
      const fade = t < GROW ? 1 : Math.max(0, 1 - (t - GROW) / (1 - GROW));
      const flicker = t < GROW ? 1 : (Math.random() < 0.82 ? 1 : 0.35);     // crackle while dying out
      // scorch glow right under the impact (soft, irregular: drawn from the bolts themselves)
      paths.forEach(path => {
        const local = Math.max(0, Math.min(1, (t / GROW - path.start) / Math.max(0.05, 1 - path.start)));
        if (local <= 0) return;
        const al = fade * flicker;
        drawPath(ground, path, local, Math.round((big ? 7 : 5) * path.width) + 1, big ? 0x854d0e : 0x0c4a6e, 0.35 * al, 0);
        if (level >= 2) drawPath(top8, path, local, Math.round(6 * W * path.width) + 2, 0x38bdf8, 0.20 * al, 1);
        drawPath(top8, path, local, Math.round(3 * W * path.width) + 1, big ? 0xfde68a : 0x38bdf8, 0.55 * al, 1);
        const tip = drawPath(top8, path, local, path.width < 1 ? 1 : 2, 0xffffff, al, 1);
        if (local < 1 || Math.random() < 0.4) {       // bright head while it travels, sparks after
          top8.fillStyle(0xffffff, al); top8.fillRect(Math.round(tip.x) - 1, Math.round(tip.y) - 1, 3, 3);
          top8.fillStyle(info.color, 0.8 * al); top8.fillRect(Math.round(tip.x) - 2 + Math.round(Math.random() * 4), Math.round(tip.y) - 3 - Math.round(Math.random() * 3), 1, 2);
        }
      });
      // hot core where the bolt landed
      top8.fillStyle(0xffffff, 0.55 * fade); top8.fillEllipse(cx, cy, 10 * W, 6 * W);
    };
    this.tweens.add({
      targets: spread, t: 1, duration: [0, 620, 800, 1150][level], ease: 'Sine.easeOut', onUpdate: drawGround,
      onComplete: () => { ground.clear(); top8.clear(); }
    });

    // level 3: leftover sparks jumping around the scorched area
    if (big) {
      const sparks = mk(this.add.graphics().setDepth(p.depth + 1).setBlendMode(Phaser.BlendModes.ADD));
      mk(this.time.addEvent({
        delay: 60, repeat: 16, callback: () => {
          sparks.clear();
          for (let i = 0; i < 5; i++) {
            const a = Math.random() * Math.PI * 2, d = Math.random() * RADIUS;
            const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * SQUASH;
            bolt(sparks, x, y, x + (Math.random() * 16 - 8), y - 6 - Math.random() * 12, 3, 1, 0xfef9c3, 0.9);
          }
        }
      }));
    }

    // 3) damage: every enemy inside the ring (never the player)
    if (this.enemies) {
      this.enemies.getChildren().slice().forEach(e => {
        if (!e.active || e.isDead) return;
        const dx = e.x - cx, dy = (e.y + 10 - cy) / SQUASH;
        if (Math.hypot(dx, dy) <= RADIUS + 10) {
          this.damageEnemy(e, info.damage, cx, cy);
          if (e.active && e.setTint) { e.setTint(0x7dd3fc); this.time.delayedCall(180, () => e.active && e.clearTint()); }
        }
      });
    }
  },

  /**
   * LANCENT - ARROW RAIN (area skill).
   * He aims the bow at the sky and shoots; a moment later a volley falls at random
   * spots around the place where he was standing and hurts every enemy under an arrow.
   */
  performArrowRain() {
    if (this.playerHero !== 'soldier') return;
    if (this.isDead || this.isCastingRain || this.isDashing || this.isSpinning || this.isAttacking) return;
    if (this._doorTransition || this.isGamePaused) return;
    const now = this.time.now;
    const COOLDOWN = 3000, COST = 45, RADIUS = 58, ARROWS = 14, SHOT_AT = 500, RAIN_AT = 950, END_AT = 800;
    const HIT_R = 15, SQUASH = 0.75, FALL_MS = 240;
    if (now - (this.lastRainTime || -99999) < COOLDOWN) return;
    if (this.stamina < COST) { this.showLowStaminaWarning('Lluvia de flechas'); return; }

    this.stamina = Math.max(0, this.stamina - COST);
    this.updateStaminaBar();
    this.lastRainTime = now;
    this.isCastingRain = true;
    this.isAttacking = true;
    this.isInvulnerable = true;       // cannot be interrupted while aiming
    const p = this.player;
    p.setVelocity(0, 0);
    if (this.anims.exists('soldier_arrowrain')) p.play('soldier_arrowrain');
    sfx._clip('bow_shot', 0.9, 250);

    const k = p.scaleX;
    const cx = p.body ? p.body.center.x : p.x;
    const cy = p.body ? p.body.bottom : p.y + 12;
    const cam = this.cameras.main;
    const hasArrow = this.textures.exists('arrow');

    // 1) the arrow that goes up
    this.time.delayedCall(SHOT_AT, () => {
      if (this.isDead) return;
      const up = hasArrow
        ? this.add.image(p.x, p.y - 16 * k, 'arrow').setRotation(-Math.PI / 2)
        : this.add.rectangle(p.x, p.y - 16 * k, 2, 12, 0xfde68a);
      up.setDepth(p.depth + 5);
      this.tweens.add({ targets: up, y: cam.worldView.y - 40, duration: 260, ease: 'Quad.easeIn', onComplete: () => up.destroy() });
    });

    // 2) the volley coming down
    this.time.delayedCall(RAIN_AT, () => {
      sfx._clip('arrow_rain', 0.9);
      for (let i = 0; i < ARROWS; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = (i === 0 ? 0.25 : Math.sqrt(Math.random())) * RADIUS;
        const tx = Math.round(cx + Math.cos(ang) * dist);
        const ty = Math.round(cy + Math.sin(ang) * dist * SQUASH);
        this.time.delayedCall(i * 55 + Math.random() * 40, () => {
          // shadow that tells where it will land
          const shadow = this.add.ellipse(tx, ty, 4, 2, 0x000000, 0.35).setDepth(Math.max(8, ty - 6));
          this.tweens.add({ targets: shadow, scaleX: 2.6, scaleY: 2.6, duration: FALL_MS });
          const sx = tx - 34, sy = ty - 230;
          const rot = Math.atan2(ty - sy, tx - sx);
          const arrow = hasArrow
            ? this.add.image(sx, sy, 'arrow').setRotation(rot)
            : this.add.rectangle(sx, sy, 12, 2, 0xfde68a).setRotation(rot);
          arrow.setDepth(ty + 40);
          this.tweens.add({
            targets: arrow, x: tx - 5, y: ty - 8, duration: FALL_MS, ease: 'Quad.easeIn',
            onComplete: () => {
              arrow.setDepth(ty);
              // impact: little dust burst + damage under the arrow
              const dust = this.add.graphics().setDepth(ty + 1);
              const d = { t: 0 };
              this.tweens.add({
                targets: d, t: 1, duration: 200,
                onUpdate: () => {
                  dust.clear();
                  dust.fillStyle(0xe7d7b0, 0.8 * (1 - d.t));
                  for (let j = 0; j < 5; j++) {
                    const a = j * 1.2566 + 0.4;
                    dust.fillRect(Math.round(tx + Math.cos(a) * (3 + 8 * d.t)), Math.round(ty + Math.sin(a) * (2 + 5 * d.t)) - Math.round(4 * d.t * (1 - d.t) * 4), 2, 2);
                  }
                },
                onComplete: () => dust.destroy()
              });
              if (this.enemies && !this.isDead) {
                this.enemies.getChildren().slice().forEach(e => {
                  if (!e.active || e.isDead) return;
                  const ex = e.body ? e.body.center.x : e.x, ey = e.body ? e.body.bottom : e.y + 12;
                  if (Math.hypot(ex - tx, (ey - ty) / SQUASH) <= HIT_R) this.damageEnemy(e, 1, tx, ty - 20);
                });
              }
              this.tweens.add({ targets: [arrow, shadow], alpha: 0, delay: 450, duration: 250, onComplete: () => { arrow.destroy(); shadow.destroy(); } });
            }
          });
        });
      }
    });

    // Lancent can move again as soon as the shot is done; the arrows fall on their own
    this.time.delayedCall(END_AT, () => {
      this.isCastingRain = false;
      this.isAttacking = false;
      this.isInvulnerable = false;
      if (!this.isDead && p.active && this.playerHero === 'soldier') p.play('soldier_idle', true);
    });
  },

  performSpin() {
    // Horos uses the same key for his area spell
    if (this.playerHero === 'wizard') { this.performThunder(); return; }
    if (this._gameMode === 'campaign' || this.isDead || this.isSpinning || this.isDashing) return;
    if (this.playerHero !== 'soldier') return;

    const now = this.time.now;
    if (now - this.lastSpinTime < this.spinCooldown) return;

    // Check Stamina: Whirlwind Spin requires stamina (35%)
    const spinCost = this.spinStaminaCost || 35;
    if (this.stamina < spinCost) {
      this.showLowStaminaWarning('Giro');
      return;
    }

    this.stamina = Math.max(0, this.stamina - spinCost);
    this.updateStaminaBar();

    this.isSpinning = true;
    this.lastSpinTime = now;
    this.isAttacking = false;
    this.isInvulnerable = true;

    // Optional controlled drift if movement keys are pressed
    let vx = 0;
    let vy = 0;
    if ((this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown) vx -= 1;
    if ((this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown) vx += 1;
    if ((this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown) vy -= 1;
    if ((this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const mag = Math.hypot(vx, vy);
      const spinSpeed = 100;
      this.player.setVelocity((vx / mag) * spinSpeed, (vy / mag) * spinSpeed);
    } else {
      this.player.setVelocity(0, 0);
    }

    // Play animation (repeat: 1 -> 2 complete spins before stopping)
    this.player.play('soldier_spin');
    sfx.fx('spin', 0.85) || sfx.playSpin();

    // Afterimage / whirlwind wind trail effect
    const ghostTimer = this.time.addEvent({
      delay: 70,
      repeat: 9,
      callback: () => {
        if (!this.player || this.isDead || !this.isSpinning) return;
        const ghost = this.add.sprite(this.player.x, this.player.y, 'soldier_spin');
        const curFrame = this.player.anims.currentFrame ? this.player.anims.currentFrame.index - 1 : 2;
        ghost.setFrame(Math.min(Math.max(curFrame, 0), 5));
        ghost.setScale(this.player.scaleX, this.player.scaleY);
        ghost.setAlpha(0.48);
        ghost.setTint(0x7dd3fc); // Cool pale whirlwind cyan
        ghost.setDepth(this.player.depth - 1);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: this.player.scaleX * 1.1,
          scaleY: this.player.scaleY * 1.1,
          duration: 180,
          onComplete: () => ghost.destroy()
        });
      }
    });

    // 1st spin hit check (midway through first rotation: ~150ms)
    this.time.delayedCall(150, () => {
      if (this.isDead || !this.isSpinning) return;
      this.checkSpinHits();
    });

    // 2nd spin hit check (midway through second rotation: ~580ms) and whoosh sound
    this.time.delayedCall(580, () => {
      if (this.isDead || !this.isSpinning) return;
      if (!sfx.fxOk('spin')) sfx.playSpin();
      this.checkSpinHits();
    });

    // On animation complete (fires after the 2nd rotation completes)
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim.key === 'soldier_spin') {
        this.isSpinning = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead) {
          this.player.setVelocity(0, 0);
          this.player.play('soldier_idle');
        }
      }
    });

    // Safety fallback timer if animation event is interrupted (approx 860ms total duration at 14fps)
    this.time.delayedCall(950, () => {
      if (this.isSpinning) {
        this.isSpinning = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead && this.player.anims.currentAnim?.key === 'soldier_spin') {
          this.player.setVelocity(0, 0);
          this.player.play('soldier_idle');
        }
      }
    });
  },

  /**
   * Whirlwind 360 AOE damage around soldier
   */
  checkSpinHits() {
    const hitRadius = 75;
    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.fx('sword_hit', 0.8, { minGap: 60 }) || sfx.playHit();
      this.cameras.main.shake(120, 0.0035);
    }
  },

  /**
   * Shoot Arrow Projectile (Soldier)
   */
  shootArrow() {
    const isLeft = this.facingDirection === 'left';
    const spawnX = isLeft ? this.player.x - 24 : this.player.x + 24;
    const spawnY = this.player.y + 6;

    const arrow = this.projectiles.create(spawnX, spawnY, 'arrow');
    arrow.isFireball = false;
    arrow.setDepth(Math.max(10, Math.round(spawnY + 16)));
    arrow.setScale(1.2);
    arrow.setFlipX(isLeft);

    const speed = 460;
    arrow.setVelocityX(isLeft ? -speed : speed);
    arrow.body.setAllowGravity(false);
    arrow.body.setSize(22, 10);

    // Auto destroy after 2 seconds
    this.time.delayedCall(2000, () => {
      if (arrow && arrow.active) arrow.destroy();
    });
  },

  /**
   * Wizard Fireball Spell:
   * Launches animated fireball projectile that damages and explodes on contact
   */
  castFireball() {
    const isLeft = this.facingDirection === 'left';
    const v = this.facingV;                    // 'front' / 'back' when Horos looks down / up
    const spawnX = v ? this.player.x : (isLeft ? this.player.x - 26 : this.player.x + 26);
    const spawnY = v ? this.player.y + (v === 'front' ? 30 : -22) : this.player.y + 4;

    const fireball = this.projectiles.create(spawnX, spawnY, 'wizard_fireball');
    fireball.isFireball = true;
    fireball.setDepth(Math.max(10, Math.round(spawnY + 16)));
    fireball.setScale(1.15);

    if (this.anims.exists('wizard_fireball_anim')) {
      fireball.play('wizard_fireball_anim');
    }

    const speed = 420;
    fireball.body.setAllowGravity(false);
    if (v) {
      // the art points right: turn it to fly down or up, with a hitbox centred on the flame
      fireball.setAngle(v === 'front' ? 90 : -90);
      fireball.setVelocityY(v === 'front' ? speed : -speed);
      fireball.body.setSize(20, 24);
      fireball.body.setOffset(40, v === 'front' ? 46 : 30);
    } else {
      fireball.setFlipX(isLeft);
      fireball.setVelocityX(isLeft ? -speed : speed);
      fireball.body.setSize(24, 20);
      fireball.body.setOffset(isLeft ? 30 : 46, 40);
    }

    // Trailing sparks timer
    const emberTimer = this.time.addEvent({
      delay: 60,
      repeat: 25,
      callback: () => {
        if (!fireball || !fireball.active) {
          emberTimer.remove();
          return;
        }
        const p = this.add.circle(fireball.x + Phaser.Math.Between(-4, 4), fireball.y + Phaser.Math.Between(-4, 4), Phaser.Math.Between(2, 4), 0xf97316, 0.8);
        p.setDepth(fireball.depth - 1);
        this.tweens.add({
          targets: p,
          alpha: 0,
          scale: 0.2,
          y: p.y - 10,
          duration: 250,
          onComplete: () => p.destroy()
        });
      }
    });

    // Auto destroy after 2.2 seconds
    this.time.delayedCall(2200, () => {
      if (fireball && fireball.active) fireball.destroy();
    });
  },

  /**
   * Wizard Primary Magic Hit Check (Ice / Arcane Shards AOE Cone)
   */
  checkWizardMagicHits() {
    const isLeft = this.facingDirection === 'left';
    let hitX = isLeft ? this.player.x - 48 : this.player.x + 48;
    let hitY = this.player.y + 4;
    if (this.facingV) { hitX = this.player.x; hitY = this.player.y + (this.facingV === 'front' ? 52 : -40); }
    const hitRadius = 70;

    // Visual magic blast effect
    const blast = this.add.circle(hitX, hitY, 15, 0x38bdf8, 0.7);
    blast.setDepth(this.player.depth + 1);
    this.tweens.add({
      targets: blast,
      radius: 50,
      alpha: 0,
      duration: 220,
      onComplete: () => blast.destroy()
    });

    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.fx('sword_hit', 0.8, { minGap: 60 }) || sfx.playHit();
      this.cameras.main.shake(120, 0.005);
    }
  },

  /**
   * Orc Ground Smash Shockwave AOE
   */
  createGroundSmash() {
    sfx.playHit();
    this.cameras.main.shake(180, 0.008);

    // Shockwave ring graphics
    const shockwave = this.add.circle(this.player.x, this.player.y + 14, 20, 0xffaa00, 0.6);
    shockwave.setDepth(4);
    this.tweens.add({
      targets: shockwave,
      radius: 80,
      alpha: 0,
      duration: 350,
      onComplete: () => shockwave.destroy()
    });

    // Damage all enemies in 85px radius
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 85) {
        this.damageEnemy(enemy, 2, this.player.x, this.player.y);
      }
    });
  },

  /**
   * Check melee hits against active enemies
   */
  checkMeleeHits() {
    const isLeft = this.facingDirection === 'left';
    const hitX = isLeft ? this.player.x - 42 : this.player.x + 42;
    const hitY = this.player.y + 6;
    const hitRadius = 50;

    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.fx('sword_hit', 0.8, { minGap: 60 }) || sfx.playHit();
      this.cameras.main.shake(120, 0.004);
    }
  },

  /**
   * Damage an Enemy and trigger reactions:
   * - Red tint flash
   * - Hurt animation
   * - Knockback impulse
   * - Floating damage number
   * - Death animation if HP <= 0
   */
  damageEnemy(enemy, amount, sourceX, sourceY) {
    if (enemy.isDead) return;

    enemy.hp -= amount;
    if (enemy.hp > 0) sfx.fx(enemy.type === 'orc' ? 'orc_hurt' : 'knight_hurt', 0.65, { minGap: 90, rate: 0.92 + Math.random() * 0.2 });

    // Floating damage text
    this.createFloatingText(enemy.x, enemy.y - 20, `-${amount}`, 0xffdd44);

    // Knockback
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    const knockbackForce = 160;
    enemy.body.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);

    // Red damage flash
    enemy.setTint(0xff3333);
    this.time.delayedCall(160, () => {
      if (enemy.active && !enemy.isDead) enemy.clearTint();
    });

    if (enemy.hp <= 0) {
      // Enemy Defeated
      enemy.isDead = true;
      enemy.body.setVelocity(0, 0);
      enemy.body.checkCollision.none = true;
      sfx.fx(enemy.type === 'orc' ? 'orc_death' : 'knight_death', 0.8, { minGap: 120, rate: 0.95 + Math.random() * 0.15 }) || sfx.playEnemyDeath();

      // Play death animation
      enemy.play(`${enemy.type}_death`);
      this.kills++;
      this.score += 100;
      this.updateHUD();

      // Chance to drop a heart (30% chance if player is missing health)
      if (this.health < this.maxHealth && Math.random() < 0.35) {
        this.spawnHeartPickup(enemy.x, enemy.y);
      }

      // Fade out after death
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        delay: 600,
        duration: 400,
        onComplete: () => {
          enemy.destroy();
        }
      });
    } else {
      // Alert enemy if hit while patrolling or idling
      if (enemy.state !== 'chase') {
        this.alertEnemy(enemy);
      }

      // Play hurt animation
      enemy.play(`${enemy.type}_hurt`);
      enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!enemy.isDead && enemy.active) {
          enemy.play(`${enemy.type}_idle`);
        }
      });
    }
  },

  /**
   * Projectile hits enemy
   */
  handleProjectileHitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active || enemy.isDead) return;
    const px = projectile.x;
    const py = projectile.y;
    const isFireball = projectile.isFireball;
    projectile.destroy();

    if (isFireball) {
      sfx.fx('fire_hit', 0.85) || sfx.playHit();
      this.cameras.main.shake(160, 0.007);
      // Fireball explosion visual
      const boom = this.add.circle(px, py, 18, 0xf97316, 0.85);
      boom.setDepth(15);
      this.tweens.add({
        targets: boom,
        radius: 55,
        alpha: 0,
        duration: 250,
        onComplete: () => boom.destroy()
      });

      // Explosion AOE damage (2 damage to primary, 1 to nearby)
      this.damageEnemy(enemy, 2, px, py);
      this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || e === enemy) return;
        const dist = Phaser.Math.Distance.Between(px, py, e.x, e.y);
        if (dist <= 65) {
          this.damageEnemy(e, 1, px, py);
        }
      });
    } else {
      this.damageEnemy(enemy, 1, px, py);
      sfx.fx('sword_hit', 0.7, { minGap: 60 }) || sfx.playHit();
    }
  }
});
