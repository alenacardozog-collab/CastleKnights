'use strict';
/* Enemies: waves, spawning, AI and heart pickups. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Spawns generic enemies in waves.
   * Orcs are exclusively enemies; Soldier and Wizard are the playable heroes.
   */
  spawnEnemyWave() {
    if (this._gameMode === 'campaign' || !this.readyForCombat || this.isDead || (this.devModeEnabled && this.devAiPaused)) return;
    if (this.currentInterior) return;
    const currentEnemies = this.enemies.countActive(true);
    const maxEnemies = 7 + this.wave;

    if (currentEnemies < maxEnemies) {
      // Filter active spawns eligible for current wave
      const eligibleSpawns = (this.enemySpawns || []).filter(s => s.active !== false && (s.minWave || 1) <= this.wave);

      let spawnPoint = null;
      if (eligibleSpawns.length > 0) {
        spawnPoint = Phaser.Utils.Array.GetRandom(eligibleSpawns);
      } else if (this.enemySpawns && this.enemySpawns.length > 0) {
        const anyActive = this.enemySpawns.filter(s => s.active !== false);
        if (anyActive.length > 0) spawnPoint = Phaser.Utils.Array.GetRandom(anyActive);
      }

      if (spawnPoint) {
        const radius = spawnPoint.radius || 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const ex = Phaser.Math.Clamp(spawnPoint.x + Math.cos(angle) * dist, 32, this.mapWidth - 32);
        const ey = Phaser.Math.Clamp(spawnPoint.y + Math.sin(angle) * dist, 32, this.mapHeight - 32);
        this.spawnEnemy(ex, ey, this.pickWaveEnemyType());
      } else {
        const defaultPoints = [
          { x: 520, y: 320 },
          { x: 120, y: 440 },
          { x: 440, y: 520 },
          { x: 160, y: 120 }
        ];
        const pt = Phaser.Utils.Array.GetRandom(defaultPoints);
        this.spawnEnemy(pt.x, pt.y, this.pickWaveEnemyType());
      }
    }

    // Increment wave every 30 seconds
    const elapsedSecs = Math.floor((Date.now() - this.gameStartTime) / 1000);
    this.wave = 1 + Math.floor(elapsedSecs / 30);
    const waveEl = document.getElementById('stat-wave');
    if (waveEl) waveEl.textContent = this.wave;
  },

  /**
   * Instantiate an enemy sprite with peaceful AI state and dynamic physics body.
   * Enemies do NOT chase on spawn; they spawn peacefully and patrol or idle
   * until they spot the player or player comes close.
   */
  spawnEnemy(x, y, overrideType = null) {
    const enemyType = ENEMY_TYPES[overrideType] && this.textures.exists(`${overrideType}_idle`) ? overrideType : 'orc';
    const def = ENEMY_TYPES[enemyType];

    const enemy = this.enemies.create(x, y, `${enemyType}_idle`);
    enemy.type = enemyType;
    enemy.def = def;
    enemy.hp = def.hp;
    enemy.maxHp = def.hp;
    enemy.isDead = false;
    enemy.isAttacking = false;
    enemy.attackCooldown = 0;
    enemy.setDepth(8);
    enemy.setScale(def.scale || 1.20);

    // Dynamic Physics Body with Hitbox placed at feet:
    // Tight 16x8 box placed at feet so obstacles physically block movement
    enemy.body.setSize(16, 8);
    enemy.body.setOffset(42, 52);
    enemy.setCollideWorldBounds(true);

    // Stealth / Perception AI state:
    // Starts peacefully in 'idle' or 'patrol' (never immediately chasing)
    enemy.state = 'idle'; // 'idle' | 'patrol' | 'alerting' | 'chase'
    enemy.facing = Math.random() < 0.5 ? 'left' : 'right';
    enemy.setFlipX(enemy.facing === 'left');
    enemy.patrolTimer = this.time.now + Phaser.Math.Between(1000, 2800);
    enemy.patrolVx = 0;
    enemy.patrolVy = 0;
    enemy.reactionDelay = 0;

    enemy.play(`${enemyType}_idle`);

    // Life bar over tough enemies (drawn only after the first hit); the boss gets its name too
    if (def.hp > 2) {
      enemy.hpBar = this.add.graphics().setDepth(26000);
      enemy.once('destroy', () => { if (enemy.hpBar) enemy.hpBar.destroy(); if (enemy.nameTag) enemy.nameTag.destroy(); });
    }
    if (def.boss) {
      enemy.nameTag = this.add.text(x, y - 60, def.name, {
        fontFamily: 'Pixuf, MedievalSharp, monospace', fontSize: '11px', fill: '#e9d5ff', stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5, 1).setDepth(26001);
      enemy.nextSummon = this.time.now + 5000;
    }

    // Gentle fade-in spawn effect
    enemy.setAlpha(0);
    this.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 350
    });
    return enemy;
  },

  /** Enemy type for the practice arena at the current wave (data: PRACTICE_WAVES). */
  pickWaveEnemyType() {
    let pool = PRACTICE_WAVES[0].types;
    PRACTICE_WAVES.forEach(w => { if (this.wave >= w.from) pool = w.types; });
    return Phaser.Utils.Array.GetRandom(pool);
  },

  /**
   * Campaign: put the enemies of a zone on the map when the hero enters it (data: ZONE_ENEMIES).
   * Whatever was left from the previous zone is removed first.
   */
  spawnZoneEnemies(area) {
    this.clearZoneEnemies();
    if (this._gameMode !== 'campaign' || !area || !area.key) return;
    const list = ZONE_ENEMIES[area.key];
    if (!list) return;
    const solids = area.solids || [];
    const free = (x, y) => x > 20 && y > 30 && x < area.w - 20 && y < area.h - 16 &&
      !solids.some(c => x > c.x - 12 && x < c.x + c.w + 12 && y > c.y - 10 && y < c.y + c.h + 10);
    const sp = area.spawn;
    list.forEach(([type, x, y, r, when]) => {
      if (when === 'night' && !(this.isNight && this.isNight())) return;
      if (ENEMY_TYPES[type].boss && this.story && this.story.flags['boss_' + type]) return;
      let px = x, py = y, ok = free(x, y);
      for (let i = 0; i < 40 && !ok; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * (r + i * 3);
        px = x + Math.cos(a) * d; py = y + Math.sin(a) * d; ok = free(px, py);
      }
      if (!ok) return;
      // never on top of the place where the hero arrives
      if (Phaser.Math.Distance.Between(area.x + px, area.y + py, sp.x, sp.y) < 150) return;
      const e = this.spawnEnemy(area.x + px, area.y + py - 26, type);
      if (e) e.zone = area.key;
    });
  },

  clearZoneEnemies() {
    if (this.enemies) this.enemies.clear(true, true);
    if (this.enemyShots) this.enemyShots.clear(true, true);
    if (this.heartPickups) this.heartPickups.clear(true, true);
  },

  /** A ranged enemy lets go of its arrow / spell towards the hero. */
  enemyShoot(enemy, spread) {
    const r = enemy.def.ranged;
    if (!this.enemyShots) {
      this.enemyShots = this.physics.add.group();
      this.physics.add.overlap(this.player, this.enemyShots, (pl, shot) => {
        if (!shot.active) return;
        const dmg = shot.dmg || 1;
        shot.destroy();
        this.damagePlayer(dmg);
      });
      if (this.obstacles) this.physics.add.collider(this.enemyShots, this.obstacles, s => s.destroy());
    }
    const sx = enemy.x + (enemy.flipX ? -14 : 14), sy = enemy.y + 4;
    const shot = this.enemyShots.create(sx, sy, r.key);
    shot.dmg = enemy.def.dmg;
    shot.homing = r.homing ? 0.9 : 0;
    shot.speed = r.speed;
    shot.body.setAllowGravity(false);
    shot.body.setSize(10, 10);
    shot.setDepth(Math.max(10, Math.round(sy + 30)));
    if (r.frames > 1 && this.anims.exists(r.key + '_fly')) shot.play(r.key + '_fly');
    const ang = Phaser.Math.Angle.Between(sx, sy, this.player.x, this.player.y + 6) + (spread || 0);
    if (spread) shot.homing = 0;
    shot.setVelocity(Math.cos(ang) * r.speed, Math.sin(ang) * r.speed);
    shot.setRotation(ang);
    this.time.delayedCall(r.homing ? 3200 : 1800, () => { if (shot.active) shot.destroy(); });
  },

  /**
   * Triggers alert when enemy sees or senses the player:
   * - Shows retro animated '!' indicator over head
   * - Plays retro alert chime
   * - Turns towards player with brief reaction delay before charging
   * - Alerts nearby comrades (pack behavior)
   */
  alertEnemy(enemy) {
    if (!enemy.active || enemy.isDead || enemy.state === 'chase' || enemy.state === 'alerting') return;

    enemy.state = 'alerting';
    enemy.setVelocity(0, 0);
    enemy.reactionDelay = this.time.now + 260; // 260ms reaction hesitation

    // Sound chime
    sfx.playAlert();

    // Turn immediately to look at player
    const faceLeft = this.player.x < enemy.x;
    enemy.facing = faceLeft ? 'left' : 'right';
    enemy.setFlipX(faceLeft);

    // Floating Retro Pixel '!' indicator
    const alertText = this.add.text(enemy.x, enemy.y - 42, '!', {
      fontFamily: 'MedievalSharp, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      fill: '#fcd567',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(25000);

    this.tweens.add({
      targets: alertText,
      y: enemy.y - 58,
      scale: { from: 0.6, to: 1.3 },
      alpha: { from: 1, to: 0 },
      ease: 'Back.easeOut',
      duration: 550,
      onComplete: () => {
        alertText.destroy();
      }
    });

    // After brief reaction pause, enter chase mode
    this.time.delayedCall(260, () => {
      if (enemy.active && !enemy.isDead && enemy.state === 'alerting') {
        enemy.state = 'chase';
      }
    });

    // Alert nearby comrades within 110px radius (group aggro)
    this.enemies.getChildren().forEach(ally => {
      if (ally !== enemy && ally.active && !ally.isDead && ally.state !== 'chase' && ally.state !== 'alerting') {
        const allyDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
        if (allyDist <= 110) {
          this.time.delayedCall(140, () => {
            if (ally.active && !ally.isDead) {
              this.alertEnemy(ally);
            }
          });
        }
      }
    });
  },

  /**
   * AI behavior for all active enemies:
   * 1. Peaceful state (idle / patrol):
   *    - Wanders around smoothly or stands still looking around.
   *    - Perception checks:
   *      a) Proximity: within 150px detects footsteps/presence.
   *      b) Vision cone: within 270px in front of facing direction.
   * 2. Alerting state:
   *    - Displays '!' indicator and turns to player.
   * 3. Chase & Attack state:
   *    - Rushes toward player, sliding on obstacles.
   *    - Attacks when within 42px.
   *    - De-aggros with '?' indicator if player flees > 480px away.
   */
  updateEnemies() {
    const now = this.time.now;
    // homing spells bend towards the hero
    if (this.enemyShots) this.enemyShots.getChildren().forEach(s => {
      if (!s.active || !s.homing) return;
      const want = Phaser.Math.Angle.Between(s.x, s.y, this.player.x, this.player.y + 6);
      const cur = Phaser.Math.Angle.RotateTo(s.rotation, want, s.homing * this.game.loop.delta / 1000);
      s.setRotation(cur); s.setVelocity(Math.cos(cur) * s.speed, Math.sin(cur) * s.speed);
    });

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;

      // Dynamic 2.5D depth sorting based on Y position (character feet)
      enemy.setDepth(Math.max(10, Math.round(enemy.body ? enemy.body.bottom : enemy.y + 24)));

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      let def = enemy.def || ENEMY_TYPES.orc;
      if (enemy.hpBar) {
        const g = enemy.hpBar; g.clear();
        if (enemy.hp < enemy.maxHp || def.boss) {
          const w = def.boss ? 44 : 24, bx = enemy.x - w / 2, by = enemy.y - (def.boss ? 52 : 34);
          g.fillStyle(0x000000, 0.75); g.fillRect(bx - 1, by - 1, w + 2, 5);
          g.fillStyle(def.boss ? 0xa855f7 : 0xdc2626, 1); g.fillRect(bx, by, w * Math.max(0, enemy.hp / enemy.maxHp), 3);
        }
        if (enemy.nameTag) enemy.nameTag.setPosition(enemy.x, enemy.y - 56);
      }
      // second phase at half life: faster casting, three bolts at once, more dead at its side
      if (def.boss && !enemy.phase2 && enemy.hp <= enemy.maxHp / 2) {
        enemy.phase2 = true;
        enemy.def = def = Object.assign({}, def, { cd: Math.round(def.cd * 0.6), speed: def.speed * 1.5, summon: Object.assign({}, def.summon, { every: 6000, max: 6 }) });
        enemy.nextSummon = now + 800;
        enemy.setTint(0xd8b4fe); this.time.delayedCall(700, () => enemy.active && !enemy.isDead && enemy.clearTint());
        this.cameras.main.flash(350, 150, 90, 220); this.cameras.main.shake(400, 0.008);
        sfx.fx('necro_death', 0.7, { rate: 1.4 });
        this.createFloatingText(enemy.x, enemy.y - 70, '¡LA NIEBLA SE CIERRA!', 0xd8b4fe);
      }
      // the boss raises the dead while it fights
      if (def.summon && enemy.state === 'chase' && now > enemy.nextSummon) {
        enemy.nextSummon = now + def.summon.every;
        const minions = this.enemies.getChildren().filter(e => e.active && !e.isDead && e.type === def.summon.type).length;
        if (minions < def.summon.max) {
          if (this.anims.exists(`${enemy.type}_attack2`)) { enemy.isAttacking = true; enemy.setVelocity(0, 0); enemy.play(`${enemy.type}_attack2`);
            enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { enemy.isAttacking = false; }); }
          sfx.fx('necro_cast', 0.7, { rate: 0.7 });
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const m = this.spawnEnemy(enemy.x + Math.cos(a) * 46, enemy.y + Math.sin(a) * 34, def.summon.type);
            if (m) { m.zone = enemy.zone; m.setTint(0xc4b5fd); this.time.delayedCall(500, () => m.active && m.clearTint()); this.alertEnemy(m); }
          }
        }
      }

      // -------------------------------------------------------------
      // STATE: IDLE OR PATROL (Un-alerted / Peaceful)
      // -------------------------------------------------------------
      if (enemy.state === 'idle' || enemy.state === 'patrol') {
        // Perception Check:
        // 1. Proximity detection (heard footsteps or player too close)
        const inProximity = dist <= 150;

        // 2. Vision cone detection (player is in front of where enemy is facing)
        let inVisionCone = false;
        if (dist <= 270) {
          const dy = Math.abs(this.player.y - enemy.y);
          if (dy <= 150) {
            if (enemy.facing === 'left' && this.player.x < enemy.x) {
              inVisionCone = true;
            } else if (enemy.facing === 'right' && this.player.x > enemy.x) {
              inVisionCone = true;
            }
          }
        }

        // If detected, trigger alert and chase!
        if (inProximity || inVisionCone) {
          this.alertEnemy(enemy);
          return;
        }

        // Peaceful wander / idle AI loop
        if (now > enemy.patrolTimer) {
          enemy.patrolTimer = now + Phaser.Math.Between(1800, 3600);

          if (Math.random() < 0.4) {
            // Stay idle
            enemy.state = 'idle';
            enemy.patrolVx = 0;
            enemy.patrolVy = 0;
            enemy.setVelocity(0, 0);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) {
              enemy.play(`${enemy.type}_idle`);
            }
          } else {
            // Wander in a random direction
            enemy.state = 'patrol';
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const wanderSpeed = Phaser.Math.Between(35, 52);
            enemy.patrolVx = Math.cos(angle) * wanderSpeed;
            enemy.patrolVy = Math.sin(angle) * wanderSpeed;

            // Set facing based on wander direction
            if (enemy.patrolVx < -5) {
              enemy.facing = 'left';
              enemy.setFlipX(true);
            } else if (enemy.patrolVx > 5) {
              enemy.facing = 'right';
              enemy.setFlipX(false);
            }

            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_walk`) {
              enemy.play(`${enemy.type}_walk`);
            }
          }
        } else if (enemy.state === 'patrol') {
          // If hit obstacle while patrolling, reverse or redirect
          if (enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.patrolVx = -enemy.patrolVx;
            enemy.facing = enemy.patrolVx < 0 ? 'left' : 'right';
            enemy.setFlipX(enemy.facing === 'left');
            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
          }
          if (enemy.body.blocked.up || enemy.body.blocked.down) {
            enemy.patrolVy = -enemy.patrolVy;
            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
          }
        }
        return;
      }

      // -------------------------------------------------------------
      // STATE: ALERTING (Brief reaction hesitation)
      // -------------------------------------------------------------
      if (enemy.state === 'alerting') {
        const faceLeft = this.player.x < enemy.x;
        enemy.facing = faceLeft ? 'left' : 'right';
        enemy.setFlipX(faceLeft);
        enemy.setVelocity(0, 0);
        return;
      }

      // -------------------------------------------------------------
      // STATE: CHASE (Alerted and pursuing player)
      // -------------------------------------------------------------
      if (enemy.state === 'chase') {
        // Face player
        const faceLeft = this.player.x < enemy.x;
        enemy.facing = faceLeft ? 'left' : 'right';
        enemy.setFlipX(faceLeft);

        // Attack: melee when close enough, or a shot from a distance for archers and casters
        const rng = def.ranged;
        if (dist <= (rng ? rng.range : def.reach)) {
          enemy.setVelocity(0, 0);
          if (!enemy.isAttacking && enemy.anims.currentAnim?.key === `${enemy.type}_walk`) enemy.play(`${enemy.type}_idle`);
          if (now > enemy.attackCooldown && !enemy.isAttacking) {
            enemy.isAttacking = true;
            enemy.attackCooldown = now + def.cd;

            // heavy hitters announce the blow: a red flash and a ring that closes in, then the swing
            const heavy = def.dmg > 1 && !rng, warn = heavy ? 380 : 0;
            if (heavy) {
              enemy.setTint(0xff7070);
              const ring = this.add.circle(enemy.x, enemy.y + 8, def.reach + 14).setStrokeStyle(2, 0xff4040, 0.9).setDepth(enemy.depth - 1);
              this.tweens.add({ targets: ring, radius: 10, alpha: 0.2, duration: warn + def.hitAt, onComplete: () => ring.destroy() });
              sfx.playAlert();
              this.time.delayedCall(warn, () => { if (enemy.active && !enemy.isDead) { enemy.clearTint(); enemy.play(`${enemy.type}_attack1`); } });
            } else enemy.play(`${enemy.type}_attack1`);
            sfx.fx(def.sfx[0], 0.55, { minGap: 150, rate: def.sfx[3] * (0.92 + Math.random() * 0.18) });

            this.time.delayedCall(def.hitAt + warn, () => {
              if (enemy.active && !enemy.isDead && !this.isDead) {
                if (rng) {
                  this.enemyShoot(enemy);
                  if (enemy.phase2) { this.enemyShoot(enemy, -0.45); this.enemyShoot(enemy, 0.45); }
                  return;
                }
                const currentDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (currentDist <= def.reach + 8) {
                  this.damagePlayer(def.dmg);
                }
              }
            });

            enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              enemy.isAttacking = false;
              if (enemy.active && !enemy.isDead) {
                enemy.play(`${enemy.type}_idle`);
              }
            });
          }
        } else if (dist <= 480 && !enemy.isAttacking) {
          // Rush towards player
          const speed = def.speed + (this._gameMode === 'campaign' ? 0 : this.wave * 4);
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

          let vx = Math.cos(angle) * speed;
          let vy = Math.sin(angle) * speed;

          // Slide along obstacles if blocked
          if (enemy.body.blocked.left || enemy.body.blocked.right) {
            vy = Math.sign(this.player.y - enemy.y || 1) * speed;
          } else if (enemy.body.blocked.up || enemy.body.blocked.down) {
            vx = Math.sign(this.player.x - enemy.x || 1) * speed;
          }

          enemy.setVelocity(vx, vy);

          const walkAnim = `${enemy.type}_walk`;
          if (enemy.anims.currentAnim?.key !== walkAnim) {
            enemy.play(walkAnim);
          }
        } else if (dist > 480 && !enemy.isAttacking) {
          // Player managed to flee far away! Enemy loses sight and resets to idle
          enemy.state = 'idle';
          enemy.setVelocity(0, 0);
          enemy.patrolTimer = now + 2000;
          if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) {
            enemy.play(`${enemy.type}_idle`);
          }

          // Floating Retro Pixel '?' indicator
          const lostText = this.add.text(enemy.x, enemy.y - 42, '?', {
            fontFamily: 'MedievalSharp, monospace',
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#81c784',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5).setDepth(25000);

          this.tweens.add({
            targets: lostText,
            y: enemy.y - 58,
            alpha: { from: 1, to: 0 },
            duration: 650,
            onComplete: () => {
              lostText.destroy();
            }
          });
        }
      }
    });
  },

  /**
   * Spawn a collectible Heart drop on enemy defeat
   */
  spawnHeartPickup(x, y) {
    if (!this.textures.exists('heart_pickup_icon')) {
      const hCanvas = document.createElement('canvas');
      hCanvas.width = 16;
      hCanvas.height = 16;
      const hCtx = hCanvas.getContext('2d');
      hCtx.fillStyle = '#ef4444';
      hCtx.fillRect(3, 2, 4, 3);
      hCtx.fillRect(9, 2, 4, 3);
      hCtx.fillRect(1, 4, 14, 4);
      hCtx.fillRect(3, 8, 10, 3);
      hCtx.fillRect(5, 11, 6, 2);
      hCtx.fillRect(7, 13, 2, 2);
      this.textures.addCanvas('heart_pickup_icon', hCanvas);
    }
    const heart = this.heartPickups.create(x, y, 'heart_pickup_icon');
    heart.setScale(1.3);
    heart.body.setSize(16, 16);
    heart.setDepth(6);

    // Floating bobbing tween
    this.tweens.add({
      targets: heart,
      y: y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Despawn after 8 seconds if uncollected
    this.time.delayedCall(8000, () => {
      if (heart.active) {
        heart.destroy();
      }
    });
  },

  /**
   * Collect heart to restore health
   */
  handlePickupHeart(player, heart) {
    if (!heart.active || this.health >= this.maxHealth) return;

    this.health = Math.min(this.maxHealth, this.health + 1);
    sfx.playHeartPickup();
    this.createFloatingText(player.x, player.y - 30, '+1 VIDA', 0x22c55e);

    heart.destroy();
    this.updateHUD();
  }
});
