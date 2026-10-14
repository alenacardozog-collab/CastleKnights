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
    enemy.home = { x, y };                 // where it wanders around and goes back to when it loses the hero
    enemy._nav = {};                       // path being followed (see moveEnemyTo)

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
      if (!e) return;
      e.zone = area.key;
      // area.solids does not know the walls of the editor maps: check the real bodies and nudge (or drop) the enemy
      if (!this.placeEnemyClear(e)) { e.destroy(); return; }
      // half of the undead that can rise from the ground wait buried until the hero comes close
      if (/^skeleton/.test(type) && this.anims.exists(type + '_summon') && Math.random() < 0.5) this.enemyMakeDormant(e);
    });
  },

  /** Flying enemies (bats) pass over walls, water and props; everything else is stopped by them. */
  enemyHitsTerrain(enemy) {
    return !(enemy && enemy.def && enemy.def.flying);
  },

  /** Moves a freshly spawned enemy to the nearest spot where its feet touch no terrain. False if there is none. */
  placeEnemyClear(e) {
    if (!this.enemyHitsTerrain(e) || !e.body) return true;
    const terrain = [];
    [this.obstacles, this.waterObstacles, this.lowObstacles, this.interiorObstacles].forEach(g => g && g.getChildren().forEach(z => {
      if (z.body && z.body.enable) terrain.push(z.body);
    }));
    const b = e.body, w = b.sourceWidth * e.scaleX, h = b.sourceHeight * e.scaleY;
    const feetFree = (x, y) => {
      const bx = x + e.scaleX * (b.offset.x - e.displayOriginX), by = y + e.scaleY * (b.offset.y - e.displayOriginY);
      return !terrain.some(r => bx < r.right && bx + w > r.x && by < r.bottom && by + h > r.y);
    };
    const x0 = e.x, y0 = e.y;
    for (let ring = 0; ring <= 6; ring++) {
      for (let k = 0; k < (ring ? 12 : 1); k++) {
        const a = (k / 12) * Math.PI * 2, x = x0 + Math.cos(a) * ring * 10, y = y0 + Math.sin(a) * ring * 10;
        if (feetFree(x, y)) { e.setPosition(x, y); e.home = { x, y }; return true; }
      }
    }
    return false;
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
      if (this.interiorObstacles) this.physics.add.collider(this.enemyShots, this.interiorObstacles, s => { if (s && s.active) s.destroy(); });
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
    if (!enemy.active || enemy.isDead || enemy.state === 'chase' || enemy.state === 'alerting' || enemy.state === 'rising') return;
    // a buried one does not jump up: it rises first
    if (enemy.state === 'dormant') { this.enemyRise(enemy, true); return; }

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
      if (def.summon && enemy.state === 'chase' && now > enemy.nextSummon && !enemy.isAttacking) {
        enemy.nextSummon = now + def.summon.every;
        const minions = this.enemies.getChildren().filter(e => e.active && !e.isDead && e.type === def.summon.type).length;
        if (minions < def.summon.max) {
          const cast = this.anims.exists(`${enemy.type}_summon`) ? `${enemy.type}_summon` : `${enemy.type}_attack2`;
          if (this.anims.exists(cast)) { enemy.isAttacking = true; enemy.setVelocity(0, 0); enemy.play(cast);
            enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { enemy.isAttacking = false; }); }
          sfx.fx('necro_cast', 0.7, { rate: 0.7 });
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const m = this.spawnEnemy(enemy.x + Math.cos(a) * 46, enemy.y + Math.sin(a) * 34, def.summon.type);
            if (m && !this.placeEnemyClear(m)) { m.destroy(); continue; }
            if (m) {
              m.zone = enemy.zone;
              if (this.anims.exists('necro_summon_fx')) { const fx = this.add.sprite(m.x, m.y + 4, 'necro_summon_fx').setDepth(m.y + 40); fx.play('necro_summon_fx'); fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy()); }
              this.enemyRise(m, true);
            }
          }
        }
      }

      // -------------------------------------------------------------
      // STATE: IDLE / PATROL / RETURN (Un-alerted)
      // -------------------------------------------------------------
      if (enemy.state === 'dormant') {
        enemy.setVelocity(0, 0);
        if (dist < 140 || enemy._wake) this.enemyRise(enemy, true);
        return;
      }
      if (enemy.state === 'rising') { enemy.setVelocity(0, 0); return; }
      if (enemy.state === 'idle' || enemy.state === 'patrol' || enemy.state === 'return') {
        // Perception: close enough to hear the hero, or in front of it with nothing in between
        const inProximity = dist <= 150;
        let inVisionCone = false;
        if (dist <= 270 && Math.abs(this.player.y - enemy.y) <= 150) {
          const ahead = enemy.facing === 'left' ? this.player.x < enemy.x : this.player.x > enemy.x;
          inVisionCone = ahead && (def.flying || this.enemySees(enemy, this.player.body.center.x, this.player.body.bottom));
        }
        if (inProximity || inVisionCone) {
          this.alertEnemy(enemy);
          return;
        }
        // a guard fighting nearby draws its attention too
        const npc = this.enemyNpcTarget(enemy, 130);
        if (npc) { enemy._target = npc; this.alertEnemy(enemy); return; }

        // walking back home after losing the hero
        if (enemy.state === 'return') {
          const r = this.moveEnemyTo(enemy, enemy.home.x, enemy.home.y + 26, Math.max(30, def.speed * 0.6));
          if (r !== 'walking') {
            enemy.state = 'idle';
            enemy.setVelocity(0, 0);
            enemy.patrolTimer = now + Phaser.Math.Between(1200, 2600);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) enemy.play(`${enemy.type}_idle`);
          }
          return;
        }
        // patrol routes drawn in the editor are walked by editor_loader.js
        if (enemy._ruta) return;

        // Peaceful wander: short walks to free spots around home (never into a wall)
        if (now > enemy.patrolTimer) {
          enemy.patrolTimer = now + Phaser.Math.Between(1800, 3600);
          const spot = Math.random() < 0.4 ? null : this.enemyWanderSpot(enemy);
          if (!spot) {
            enemy.state = 'idle';
            enemy._wander = null;
            enemy.setVelocity(0, 0);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) enemy.play(`${enemy.type}_idle`);
          } else {
            enemy.state = 'patrol';
            enemy._wander = spot;
            enemy._wanderSpeed = Phaser.Math.Between(35, 52);
          }
        }
        if (enemy.state === 'patrol' && enemy._wander) {
          const r = this.moveEnemyTo(enemy, enemy._wander[0], enemy._wander[1], enemy._wanderSpeed || 40, true);
          if (r !== 'walking') {
            enemy.state = 'idle';
            enemy._wander = null;
            enemy.setVelocity(0, 0);
            enemy.patrolTimer = now + Phaser.Math.Between(900, 2200);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) enemy.play(`${enemy.type}_idle`);
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
      // STATE: CHASE (Alerted and pursuing the hero, or a guard that is fighting it)
      // -------------------------------------------------------------
      if (enemy.state === 'chase') {
        const tgt = this.enemyTarget(enemy);
        const tdist = Phaser.Math.Distance.Between(enemy.x, enemy.y, tgt.x, tgt.y);
        const faceLeft = tgt.x < enemy.x;
        enemy.facing = faceLeft ? 'left' : 'right';
        enemy.setFlipX(faceLeft);

        // Attack: melee when close enough, or a spell / arrow from a distance for archers and casters
        const rng = def.ranged;
        // never through a wall: with one in between it keeps walking around it
        const melee = tdist <= def.reach && (!rng || def.meleeToo) && (tdist < 26 || this.enemySees(enemy, tgt.fx, tgt.fy));
        const ranged = !melee && rng && tdist <= rng.range && (tgt.npc || rng.mode === 'drop' || this.enemySees(enemy, tgt.fx, tgt.fy));
        if (melee || ranged) {
          enemy.setVelocity(0, 0);
          if (!enemy.isAttacking && enemy.anims.currentAnim?.key === `${enemy.type}_walk`) enemy.play(`${enemy.type}_idle`);
          if (now > enemy.attackCooldown && !enemy.isAttacking) {
            enemy.isAttacking = true;
            enemy.attackCooldown = now + def.cd;
            // each swing has a number; a hit that staggers the enemy bumps it and cancels the pending blow
            const swing = enemy.swingId = (enemy.swingId || 0) + 1;
            let anim = ranged && def.rangedAnim && this.anims.exists(`${enemy.type}_${def.rangedAnim}`) ? `${enemy.type}_${def.rangedAnim}` : `${enemy.type}_attack1`;
            let hitAt = ranged && def.rangedHitAt ? def.rangedHitAt : def.hitAt, big = false;
            if (melee) { const m = this.enemyMeleeAttack(enemy, def); anim = m.key; hitAt = m.hitAt; big = m.n === 3; }

            // heavy hitters announce the blow: a red flash and a ring that closes in, then the swing
            const heavy = melee && (def.dmg > 1 || big), warn = heavy ? 380 : 0;
            if (heavy) {
              enemy.setTint(0xff7070);
              const ring = this.add.circle(enemy.x, enemy.y + 8, def.reach + 14).setStrokeStyle(2, 0xff4040, 0.9).setDepth(enemy.depth - 1);
              this.tweens.add({ targets: ring, radius: 10, alpha: 0.2, duration: warn + hitAt, onComplete: () => ring.destroy() });
              sfx.playAlert();
              this.time.delayedCall(warn, () => { if (enemy.active && !enemy.isDead && enemy.swingId === swing) { enemy.clearTint(); enemy.play(anim); } });
            } else enemy.play(anim);
            sfx.fx(def.sfx[0], 0.55, { minGap: 150, rate: def.sfx[3] * (0.92 + Math.random() * 0.18) });

            // a spell that falls from the sky marks its spot on the ground as soon as the cast starts
            if (ranged && rng.mode === 'drop') this.enemyDropSpell(enemy, tgt, swing);

            this.time.delayedCall(hitAt + warn, () => {
              if (!enemy.active || enemy.isDead || this.isDead || enemy.swingId !== swing) return;
              if (ranged) {
                if (rng.mode === 'drop') return;
                this.enemyShoot(enemy);
                if (enemy.phase2) { this.enemyShoot(enemy, -0.45); this.enemyShoot(enemy, 0.45); }
                return;
              }
              const t = this.enemyTarget(enemy), td = Phaser.Math.Distance.Between(enemy.x, enemy.y, t.x, t.y);
              if (td > def.reach + 8 || (td >= 26 && !this.enemySees(enemy, t.fx, t.fy))) return;
              if (t.npc) this.npcTakeHit(t.npc, def.dmg, enemy);
              else this.damagePlayer(def.dmg);
            });

            enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              enemy.isAttacking = false;
              if (enemy.active && !enemy.isDead) {
                enemy.play(`${enemy.type}_idle`);
              }
            });
          }
        } else if (tgt.npc ? tdist <= 300 : dist <= 480) {
          if (!enemy.isAttacking) {
            // Rush towards the target: straight when the way is clear, around the walls when it is not
            const speed = def.speed + (this._gameMode === 'campaign' ? 0 : this.wave * 4);
            this.moveEnemyTo(enemy, tgt.fx, tgt.fy, speed);
            // give up a chase that drags it too far from home (the hero escaped through the woods)
            if (!tgt.npc && Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.home.x, enemy.home.y) > 560 && dist > 220) this.enemyLoseTrack(enemy);
          }
        } else if (!enemy.isAttacking) {
          if (tgt.npc) { enemy._target = null; return; }
          this.enemyLoseTrack(enemy);
        }
      }
    });
  },

  /** A skeleton that waits underground (first frame of its rising animation) until the hero comes close. */
  enemyMakeDormant(e) {
    const key = e.type + '_summon';
    if (!this.anims.exists(key)) return;
    e.state = 'dormant';
    e.setVelocity(0, 0);
    e.anims.stop();
    e.setTexture(key, 0);
  },

  /** Rises from the ground (summon animation) and then, if asked, goes for the hero. */
  enemyRise(e, alert) {
    const key = e.type + '_summon';
    if (!e.active || e.isDead) return;
    if (!this.anims.exists(key)) { e.state = 'idle'; if (alert) this.alertEnemy(e); return; }
    e.state = 'rising';
    e.isAttacking = true;
    e.setVelocity(0, 0);
    e.play(key);
    sfx.fx('bone_hit', 0.45, { minGap: 120, rate: 0.6 });
    e.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!e.active || e.isDead) return;
      e.isAttacking = false;
      e.state = 'idle';
      e.play(e.type + '_idle');
      if (alert) this.alertEnemy(e);
    });
  },

  /**
   * Which blow: the attacks of the sheet in turn (the first one more often, the third, the strongest, less),
   * with the moment the blow lands scaled to the length of that animation. The caster's spell is not one of them.
   */
  enemyMeleeAttack(enemy, def) {
    const t = enemy.type, opts = [];
    [[1, 5], [2, 3], [3, 2]].forEach(([n, w]) => {
      if (def.rangedAnim === 'attack' + n || !this.anims.exists(`${t}_attack${n}`)) return;
      for (let i = 0; i < w; i++) opts.push(n);
    });
    const n = opts.length ? opts[Math.floor(Math.random() * opts.length)] : 1;
    const a1 = this.anims.get(`${t}_attack1`), an = this.anims.get(`${t}_attack${n}`);
    const f1 = a1 ? a1.frames.length : 1, fn = an ? an.frames.length : f1, dur = an ? an.duration : 1e9;
    return { n, key: `${t}_attack${n}`, hitAt: Math.min(Math.round(def.hitAt * fn / f1), Math.max(120, dur - 80)) };
  },

  /**
   * Raises the shield (or the weapon) against a blow that comes from the front: no damage. Only the ones whose
   * sheet has a block and a chance in ENEMY_TYPES (block), while they are aware of the hero and not swinging.
   */
  enemyTryBlock(enemy, sx, sy, amount) {
    const def = enemy.def || {}, key = enemy.type + '_block', now = this.time.now;
    // the sweeping blows of the game itself (the boss falls and takes its dead with it) cannot be blocked
    if (amount >= 10) return false;
    if (!def.block || !this.anims.exists(key) || enemy.isAttacking || now < (enemy._blockCd || 0)) return false;
    if (enemy.state !== 'chase' && enemy.state !== 'alerting') return false;
    if ((sx < enemy.x) !== enemy.flipX || Math.random() >= def.block) return false;   // only what it is facing
    enemy._blockCd = now + 1300;
    enemy.isAttacking = true;
    enemy.setVelocity(0, 0);
    enemy.play(key);
    enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { enemy.isAttacking = false; if (enemy.active && !enemy.isDead) enemy.play(enemy.type + '_idle'); });
    this.createFloatingText(enemy.x, enemy.y - 24, '¡BLOQUEO!', 0xcbd5e1);
    sfx.fx('shield_block', 0.6, { minGap: 100 }) || sfx.fx('sword_hit', 0.6, { minGap: 100, rate: 1.6 });
    const ang = Phaser.Math.Angle.Between(sx, sy, enemy.x, enemy.y);
    enemy.body.setVelocity(Math.cos(ang) * 50, Math.sin(ang) * 50);
    return true;
  },

  /** The hero got away: a '?' and the walk back home. */
  enemyLoseTrack(enemy) {
    enemy.state = enemy._ruta ? 'idle' : 'return';
    enemy._target = null;
    enemy._nav = {};
    enemy.setVelocity(0, 0);
    enemy.patrolTimer = this.time.now + 2000;
    if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) enemy.play(`${enemy.type}_idle`);
    const lostText = this.add.text(enemy.x, enemy.y - 42, '?', {
      fontFamily: 'MedievalSharp, monospace', fontSize: '18px', fontStyle: 'bold', fill: '#81c784', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(25000);
    this.tweens.add({ targets: lostText, y: enemy.y - 58, alpha: { from: 1, to: 0 }, duration: 650, onComplete: () => lostText.destroy() });
  },

  /** Can the enemy see that point (feet), with no wall in between? Flying enemies see over everything. */
  enemySees(enemy, x, y) {
    if (enemy.def && enemy.def.flying) return true;
    const b = enemy.body;
    return this.navSightFree ? this.navSightFree(b.center.x, b.bottom - 2, x, y - 2) : true;
  },

  /** Free spot to stroll to, close to home and reachable in a straight line. */
  enemyWanderSpot(enemy) {
    const b = enemy.body, fx = b.center.x, fy = b.bottom - 2;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(30, 90);
      const x = enemy.home.x + Math.cos(a) * d, y = enemy.home.y + 26 + Math.sin(a) * d * 0.7;
      if (enemy.def.flying || !this.navLineFree || this.navLineFree(fx, fy, x, y, true)) return [x, y];
    }
    return null;
  },

  /**
   * Steer an enemy (physics body) towards a point given in feet coordinates. Straight line when nothing is in
   * between, otherwise along an A* path that is refreshed every half second. Stuck for a while: new path and a
   * small sidestep. Allies too close push each other apart so they do not pile up in one spot.
   * Returns 'arrived', 'walking' or 'blocked' (no way there).
   */
  moveEnemyTo(enemy, gx, gy, speed, stopShort) {
    const b = enemy.body, now = this.time.now, fx = b.center.x, fy = b.bottom - 2, nav = enemy._nav || (enemy._nav = {});
    if (Math.hypot(gx - fx, gy - fy) < (stopShort ? 6 : 3)) { enemy.setVelocity(0, 0); nav.path = null; return 'arrived'; }
    let tx = gx, ty = gy;
    const flying = enemy.def && enemy.def.flying;
    if (!flying && this.navPath && !this.navLineFree(fx, fy, gx, gy, true)) {
      if (!nav.path || now - nav.at > 500 || Math.hypot(nav.goal[0] - gx, nav.goal[1] - gy) > 24) {
        nav.path = this.navPath(fx, fy, gx, gy, 6000, true);
        nav.goal = [gx, gy]; nav.at = now; nav.i = 0;
      }
      if (nav.path) {
        let p = nav.path[nav.i];
        while (p && Math.hypot(p[0] - fx, p[1] - fy) < 6 && nav.i < nav.path.length - 1) p = nav.path[++nav.i];
        if (p) { tx = p[0]; ty = p[1]; }
      } else if (stopShort) { enemy.setVelocity(0, 0); return 'blocked'; }
    } else nav.path = null;

    const dx = tx - fx, dy = ty - fy, d = Math.hypot(dx, dy) || 1;
    let vx = dx / d * speed, vy = dy / d * speed;
    // keep a little room between allies
    this.enemies.getChildren().forEach(o => {
      if (o === enemy || !o.active || o.isDead) return;
      const ox = enemy.x - o.x, oy = enemy.y - o.y, od = Math.hypot(ox, oy);
      if (od > 0 && od < 20) { vx += ox / od * speed * 0.35; vy += oy / od * speed * 0.35; }
    });
    // stuck against something for a while: find the way again and take a step to the side
    const st = nav.stuck || (nav.stuck = { x: fx, y: fy, t: now });
    if (Math.hypot(fx - st.x, fy - st.y) > 4) { st.x = fx; st.y = fy; st.t = now; }
    else if (now - st.t > 650) {
      st.t = now; nav.at = 0;
      nav.side = { until: now + 260, vx: -dy / d * speed, vy: dx / d * speed * (Math.random() < 0.5 ? 1 : -1) };
      if (stopShort) { enemy.setVelocity(0, 0); return 'blocked'; }
    }
    if (nav.side && now < nav.side.until) { vx = nav.side.vx; vy = nav.side.vy; }
    enemy.setVelocity(vx, vy);
    if (Math.abs(vx) > 5) { enemy.facing = vx < 0 ? 'left' : 'right'; enemy.setFlipX(vx < 0); }
    const walkAnim = `${enemy.type}_walk`;
    if (enemy.anims.currentAnim?.key !== walkAnim) enemy.play(walkAnim);
    return 'walking';
  },

  /**
   * What the enemy is after: the hero, or a castle guard that is fighting it (only while that guard is closer
   * than the hero, or the hero is far away). {x, y} = sprite position, {fx, fy} = feet, npc = the guard.
   */
  enemyTarget(enemy) {
    const pb = this.player.body;
    const hero = { x: this.player.x, y: this.player.y, fx: pb.center.x, fy: pb.bottom - 2, npc: null };
    const g = enemy._target;
    if (!g || !g.sprite || !g.sprite.active || g.down) { enemy._target = null; return hero; }
    const dg = Phaser.Math.Distance.Between(enemy.x, enemy.y, g.sprite.x, g.sprite.y);
    const dh = Phaser.Math.Distance.Between(enemy.x, enemy.y, hero.x, hero.y);
    if (dh < 120 && dh < dg) { enemy._target = null; return hero; }
    return { x: g.sprite.x, y: g.sprite.y - 26, fx: g.sprite.x, fy: g.sprite.y, npc: g };
  },

  /** A guard of the zone that is fighting close to this enemy, if any. */
  enemyNpcTarget(enemy, r) {
    const actors = this.currentInterior && this.currentInterior.area.actors;
    if (!actors) return null;
    return actors.find(a => a.role && a.role !== 'civil' && a.fight && !a.down && a.sprite && a.sprite.active &&
      Phaser.Math.Distance.Between(enemy.x, enemy.y + 26, a.sprite.x, a.sprite.y) < r) || null;
  },

  /**
   * The Necromancer's spell: a green mark appears where the hero (or the guard) stands, a drop of necromancy
   * falls on it and bursts. Whoever is still inside the mark when it bursts gets hurt; walking or dashing out
   * of it is the way to dodge. In the second phase it rains three at once.
   */
  enemyDropSpell(enemy, tgt, swing) {
    const rng = enemy.def.ranged, R = rng.radius || 26, delay = (enemy.def.rangedHitAt || enemy.def.hitAt) + (rng.fall || 520);
    const spots = [[tgt.fx, tgt.fy]];
    if (enemy.phase2) {
      // the other two land where the hero is heading, and to one side
      const v = this.player.body.velocity, lead = 0.55;
      spots.push([tgt.fx + v.x * lead, tgt.fy + v.y * lead]);
      const a = Math.random() * Math.PI * 2;
      spots.push([tgt.fx + Math.cos(a) * 46, tgt.fy + Math.sin(a) * 30]);
    }
    spots.forEach(([x, y], k) => {
      const mark = this.add.ellipse(x, y, R * 2, R * 0.9, 0x22c55e, 0.12).setStrokeStyle(2, 0x86efac, 0.9).setDepth(y - 2);
      const core = this.add.ellipse(x, y, 6, 3, 0x86efac, 0.35).setDepth(y - 1);
      this.tweens.add({ targets: core, scaleX: R * 2 / 6, scaleY: R * 0.9 / 3, duration: delay, ease: 'Quad.easeIn' });
      this.tweens.add({ targets: mark, alpha: { from: 0.55, to: 1 }, duration: 160, yoyo: true, repeat: -1 });
      // the ruins are dark: the mark gives off its own green light so the warning is always readable
      if (window.CK_LUZ && window.CK_LUZ.agregar) window.CK_LUZ.agregar({ x, y: y - 4, c: [120, 240, 150], r: R * 2.4, f: 1, ms: delay, curva: 'crece' });
      const clear = () => { mark.destroy(); core.destroy(); };
      // the drop falls during the last part of the wait
      const fallMs = 300;
      this.time.delayedCall(delay - fallMs + k * 90, () => {
        if (!enemy.active || enemy.isDead || enemy.swingId !== swing) { clear(); return; }
        const drop = this.add.sprite(x, y - 90, 'necro_bolt', 0).setOrigin(0.5, 0.62).setScale(1.25).setDepth(y + 40);
        if (this.anims.exists('necro_bolt_fall')) drop.play('necro_bolt_fall');
        this.tweens.add({
          targets: drop, y: y, duration: fallMs, ease: 'Quad.easeIn',
          onComplete: () => {
            clear();
            if (!drop.active) return;
            drop.setDepth(y + 2);
            if (this.anims.exists('necro_bolt_boom')) drop.play('necro_bolt_boom');
            drop.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => drop.destroy());
            this.time.delayedCall(700, () => drop.active && drop.destroy());
            sfx.fx('necro_cast', 0.55, { minGap: 80, rate: 1.35 });
            this.cameras.main.shake(90, 0.003);
            if (this.isDead) return;
            const pb = this.player.body;
            if (Math.hypot((pb.center.x - x) / R, (pb.bottom - 2 - y) / (R * 0.6)) <= 1) this.damagePlayer(enemy.def.dmg);
            if (tgt.npc && tgt.npc.sprite && tgt.npc.sprite.active && Math.hypot(tgt.npc.sprite.x - x, (tgt.npc.sprite.y - y) * 1.6) <= R) this.npcTakeHit(tgt.npc, 1, enemy);
          }
        });
      });
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
