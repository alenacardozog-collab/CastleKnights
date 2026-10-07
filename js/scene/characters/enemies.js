'use strict';
/* Enemies: waves, spawning, AI and heart pickups. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Spawns generic enemies in waves.
   * Orcs are exclusively enemies; Soldier and Wizard are the playable heroes.
   */
  spawnEnemyWave() {
    if (this._gameMode === 'campaign' || !this.readyForCombat || this.isDead || (this.devModeEnabled && this.devAiPaused)) return;
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
        this.spawnEnemy(ex, ey, 'orc');
      } else {
        const defaultPoints = [
          { x: 520, y: 320 },
          { x: 120, y: 440 },
          { x: 440, y: 520 },
          { x: 160, y: 120 }
        ];
        const pt = Phaser.Utils.Array.GetRandom(defaultPoints);
        this.spawnEnemy(pt.x, pt.y);
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
    if (this._gameMode === 'campaign') return null; // Peaceful lobby
    // Orc is strictly the enemy; Soldier and Wizard are the only playable characters
    const enemyType = 'orc';

    const enemy = this.enemies.create(x, y, `${enemyType}_idle`);
    enemy.type = enemyType;
    enemy.hp = 2;
    enemy.maxHp = 2;
    enemy.isDead = false;
    enemy.isAttacking = false;
    enemy.attackCooldown = 0;
    enemy.setDepth(8);
    enemy.setScale(1.20);

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

    // Gentle fade-in spawn effect
    enemy.setAlpha(0);
    this.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 350
    });
    return enemy;
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
    if (this._gameMode === 'campaign') return;
    const now = this.time.now;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;

      // Dynamic 2.5D depth sorting based on Y position (character feet)
      enemy.setDepth(Math.max(10, Math.round(enemy.body ? enemy.body.bottom : enemy.y + 24)));

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

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

        // Attack if within melee reach (50px)
        if (dist <= 50) {
          enemy.setVelocity(0, 0);
          if (now > enemy.attackCooldown && !enemy.isAttacking) {
            enemy.isAttacking = true;
            enemy.attackCooldown = now + 1400; // Attack every 1.4s

            enemy.play(`${enemy.type}_attack1`);
            sfx.fx(enemy.type === 'orc' ? 'orc_attack' : 'sword_swing1', 0.55, { minGap: 150, rate: 0.92 + Math.random() * 0.18 });

            this.time.delayedCall(220, () => {
              if (enemy.active && !enemy.isDead && !this.isDead) {
                const currentDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (currentDist <= 58) {
                  this.damagePlayer(1);
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
          const speed = 95 + (this.wave * 4);
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
