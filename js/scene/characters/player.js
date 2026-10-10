'use strict';
/* The hero: animations of every character, creation, controls, movement, footsteps, hero switch and taking damage. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  createCharacterAnimations() {
    // Robust helper: safely extracts available frames or falls back cleanly without black boxes
    const getSafeFrames = (key, expectedCount) => {
      let targetKey = key;
      if (!this.textures.exists(targetKey)) {
        if (targetKey.startsWith('soldier_') && this.textures.exists('soldier_idle')) {
          targetKey = 'soldier_idle';
        } else if (targetKey.startsWith('orc_') && this.textures.exists('orc_idle')) {
          targetKey = 'orc_idle';
        } else if (this.textures.exists('soldier_idle')) {
          targetKey = 'soldier_idle';
        } else {
          return [{ key: targetKey, frame: 0 }];
        }
      }
      const tex = this.textures.get(targetKey);
      if (!tex) return [{ key: targetKey, frame: 0 }];

      const frameNames = tex.getFrameNames ? tex.getFrameNames() : Object.keys(tex.frames || {});
      const numericFrames = frameNames
        .filter(f => f !== '__BASE' && !isNaN(Number(f)))
        .map(Number)
        .sort((a, b) => a - b);

      if (numericFrames.length > 1) {
        const count = Math.min(expectedCount, numericFrames.length);
        return numericFrames.slice(0, count).map(f => ({ key: targetKey, frame: f }));
      }

      // Single frame texture (e.g. single 100x100 png image)
      const singleFrame = numericFrames.length === 1 ? numericFrames[0] : (frameNames.length > 0 ? frameNames[0] : 0);
      return [{ key: targetKey, frame: singleFrame }];
    };

    // Campfire burning animation (8 frames)
    if (!this.anims.exists('campfire_burn')) {
      this.anims.create({
        key: 'campfire_burn',
        frames: getSafeFrames('campfire_anim', 8),
        frameRate: 10,
        repeat: -1
      });
    }

    // House doors animations
    if (!this.anims.exists('door_normal_creak')) {
      this.anims.create({
        key: 'door_normal_creak',
        frames: getSafeFrames('door_normal_anim', 4),
        frameRate: 3,
        repeat: -1,
        yoyo: true
      });
    }
    // One-shot open / close animations (no yoyo, no loop) used by checkDoorProximity()
    [['door_normal', 'door_normal_anim'], ['door_small', 'door_small_anim']].forEach(([name, sheet]) => {
      const fr = getSafeFrames(sheet, 4);
      if (!this.anims.exists(`${name}_open`)) {
        this.anims.create({ key: `${name}_open`, frames: fr, frameRate: 12, repeat: 0 });
      }
      if (!this.anims.exists(`${name}_close`)) {
        this.anims.create({ key: `${name}_close`, frames: fr.slice().reverse(), frameRate: 12, repeat: 0 });
      }
    });
    if (!this.anims.exists('door_small_creak')) {
      this.anims.create({
        key: 'door_small_creak',
        frames: getSafeFrames('door_small_anim', 4),
        frameRate: 3,
        repeat: -1,
        yoyo: true
      });
    }

    // NPC Villager animations (npc1, npc2, npc3, npc4)
    this.registerNPCAnimations();

    // Helper to register standard animation sets
    this.createRosterAnimations();
    const heroes = ['orc', 'soldier'];
    heroes.forEach(h => {
      // Idle (6 frames)
      if (!this.anims.exists(`${h}_idle`)) {
        this.anims.create({
          key: `${h}_idle`,
          frames: getSafeFrames(`${h}_idle`, 6),
          frameRate: 7,
          repeat: -1
        });
      }

      // Walk (8 frames)
      if (!this.anims.exists(`${h}_walk`)) {
        this.anims.create({
          key: `${h}_walk`,
          frames: getSafeFrames(`${h}_walk`, 8),
          frameRate: 11,
          repeat: -1
        });
      }

      // Attack01 (6 frames)
      if (!this.anims.exists(`${h}_attack1`)) {
        this.anims.create({
          key: `${h}_attack1`,
          frames: getSafeFrames(`${h}_attack1`, 6),
          frameRate: 14,
          repeat: 0
        });
      }

      // Attack02 (6 frames)
      if (!this.anims.exists(`${h}_attack2`)) {
        this.anims.create({
          key: `${h}_attack2`,
          frames: getSafeFrames(`${h}_attack2`, 6),
          frameRate: 14,
          repeat: 0
        });
      }

      // Hurt (4 frames)
      if (!this.anims.exists(`${h}_hurt`)) {
        this.anims.create({
          key: `${h}_hurt`,
          frames: getSafeFrames(`${h}_hurt`, 4),
          frameRate: 12,
          repeat: 0
        });
      }

      // Death (4 frames)
      if (!this.anims.exists(`${h}_death`)) {
        this.anims.create({
          key: `${h}_death`,
          frames: getSafeFrames(`${h}_death`, 4),
          frameRate: 8,
          repeat: 0
        });
      }
    });

    // Soldier Bow Attack (9 frames)
    if (!this.anims.exists('soldier_attack3')) {
      this.anims.create({
        key: 'soldier_attack3',
        frames: getSafeFrames('soldier_attack3', 9),
        frameRate: 16,
        repeat: 0
      });
    }

    // Soldier Dash Special Move (7 frames)
    if (!this.anims.exists('soldier_dash')) {
      this.anims.create({
        key: 'soldier_dash',
        frames: getSafeFrames('soldier_dash', 7),
        frameRate: 16,
        repeat: 0
      });
    }

    // Soldier Spin Whirlwind Ability (6 frames, repeats twice = 2 full rotations before stopping)
    if (!this.anims.exists('soldier_spin')) {
      this.anims.create({
        key: 'soldier_spin',
        frames: getSafeFrames('soldier_spin', 6),
        frameRate: 14,
        repeat: 1
      });
    }

    // Wizard Animations
    // Horos seen from the front and from behind: same timing as his side animations
    [['idle', 6, 7, -1], ['walk', 8, 11, -1], ['attack1', 8, 15, 0], ['attack2', 8, 12, 0]].forEach(([a, n, rate, repeat]) => {
      ['front', 'back'].forEach(v => {
        const key = `wizard_${a}_${v}`;
        if (this.textures.exists(key) && !this.anims.exists(key)) {
          this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat });
        }
      });
    });
    if (!this.anims.exists('wizard_idle')) {
      this.anims.create({
        key: 'wizard_idle',
        frames: getSafeFrames('wizard_idle', 6),
        frameRate: 7,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_walk')) {
      this.anims.create({
        key: 'wizard_walk',
        frames: getSafeFrames('wizard_walk', 8),
        frameRate: 11,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_attack1')) {
      this.anims.create({
        key: 'wizard_attack1',
        frames: getSafeFrames('wizard_attack1', 15),
        frameRate: 15,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_attack2')) {
      this.anims.create({
        key: 'wizard_attack2',
        frames: getSafeFrames('wizard_attack2', 14),
        frameRate: 14,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_hurt')) {
      this.anims.create({
        key: 'wizard_hurt',
        frames: getSafeFrames('wizard_hurt', 4),
        frameRate: 12,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_death')) {
      this.anims.create({
        key: 'wizard_death',
        frames: getSafeFrames('wizard_death', 4),
        frameRate: 8,
        repeat: 0
      });
    }
    // Lancent arrow rain: aims the bow at the sky and shoots
    if (!this.anims.exists('soldier_arrowrain') && this.textures.exists('soldier_arrowrain')) {
      this.anims.create({
        key: 'soldier_arrowrain',
        frames: this.anims.generateFrameNumbers('soldier_arrowrain', { start: 0, end: 8 }),
        frameRate: 12,
        repeat: 0
      });
    }
    // Horos charged thunder: raise and hold the staff (0-4), then slam it down (7-8)
    if (this.textures.exists('wizard_thunder')) {
      if (!this.anims.exists('wizard_thunder_raise')) {
        this.anims.create({ key: 'wizard_thunder_raise', frames: this.anims.generateFrameNumbers('wizard_thunder', { start: 0, end: 4 }), frameRate: 12, repeat: 0 });
      }
      if (!this.anims.exists('wizard_thunder_slam')) {
        this.anims.create({ key: 'wizard_thunder_slam', frames: this.anims.generateFrameNumbers('wizard_thunder', { frames: [6, 7, 8, 8] }), frameRate: 14, repeat: 0 });
      }
    }
    // Horos thunder cast: staff raised (frames 2-6), slammed on the ground (7-8)
    if (!this.anims.exists('wizard_thunder') && this.textures.exists('wizard_thunder')) {
      this.anims.create({
        key: 'wizard_thunder',
        frames: this.anims.generateFrameNumbers('wizard_thunder', { start: 0, end: 8 }),
        frameRate: 12,
        repeat: 0
      });
    }
    // Wizard Dash Special Move (6 frames from user dash.png)
    if (!this.anims.exists('wizard_dash')) {
      this.anims.create({
        key: 'wizard_dash',
        frames: getSafeFrames('wizard_dash', 6),
        frameRate: 14,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_fireball_anim')) {
      this.anims.create({
        key: 'wizard_fireball_anim',
        frames: getSafeFrames('wizard_fireball', 7),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_ice_shard_anim')) {
      this.anims.create({
        key: 'wizard_ice_shard_anim',
        frames: getSafeFrames('wizard_ice_shard', 10),
        frameRate: 14,
        repeat: 0
      });
    }
  },

  /**
   * Create the Player sprite in the open central courtyard or custom player_spawn.
   */
  createPlayer() {
    // Check for custom player_spawn in mapObjects
    const pSpawn = this.mapObjects.find(o => o.type === 'player_spawn');
    const startX = pSpawn ? pSpawn.x : 230;
    const startY = pSpawn ? pSpawn.y : 220;

    this.player = this.physics.add.sprite(startX, startY, `${this.playerHero}_idle`);
    // Every animation request goes through heroAnim(), which swaps in the front / back version
    // when the hero is looking down or up and that version exists (today: Horos).
    this.facingV = null;                       // null = sideways, 'front' = towards the camera, 'back' = away
    const basePlay = this.player.play.bind(this.player);
    this.player.play = (key, ignoreIfPlaying) => basePlay(typeof key === 'string' ? this.heroAnim(key) : key, ignoreIfPlaying);
    this.player.setDepth(startY);
    this.player.setScale(1.20);

    // Dynamic Physics Body with Hitbox placed strictly at the FEET (lower half of the body):
    // Dimensions: 16x8 px, Offset: (42, 52)
    // Only the feet collides with walls and scenery, allowing the head and torso
    // to naturally overlap walls for an authentic 2.5D perspective depth effect.
    this.player.body.setSize(16, 8);
    this.player.body.setOffset(42, 52);

    // Constrain player inside map bounds
    this.player.setCollideWorldBounds(true);

    // Play default idle animation
    this.player.play(`${this.playerHero}_idle`);
  },

  /**
   * Setup keyboard & pointer controls
   */
  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.rebindControls();

    // Enter key to trigger "¡ESTOY LISTO!" when waiting (only in practice mode)
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyEnter.on('down', () => {
      if (this._gameMode !== 'campaign' && !this.readyForCombat && this.gameStarted && !this.isDead) {
        this.triggerStartCombat();
      } else if (this._gameMode === 'campaign' && this.gameStarted) {
        this.interact();
      }
    });

    // Fullscreen key (F)
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.keyF.on('down', () => this.toggleFullscreen());

    // Grid toggle hotkey (G)
    this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.keyG.on('down', () => {
      if (this.devModeEnabled) this.toggleDevGrid();
    });

    // Delete selected item hotkeys (Delete / Backspace)
    this.keyDelete = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    this.keyDelete.on('down', () => {
      if (this.devModeEnabled) this.deleteSelectedItem();
    });
    this.keyBackspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    this.keyBackspace.on('down', () => {
      if (this.devModeEnabled) this.deleteSelectedItem();
    });

    // Auto-fit selected hitbox to pixels hotkey (A) when in dev mode
    this.keyA_Fit = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyA_Fit.on('down', () => {
      if (this.devModeEnabled && !this.gameStarted) {
        this.fitSelectedHitboxToPixels();
      }
    });

    // Arrow keys for nudging selected item in dev mode
    ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => {
      const k = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[dir]);
      k.on('down', () => {
        if (this.devModeEnabled) this.nudgeSelectedItem(dir);
      });
    });

    // Pointer events for Gameplay & Dev Mode
    this.input.on('pointerdown', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerDown(pointer);
        return;
      }
      if (!this.gameStarted || this.isDead || this.isGamePaused) return;

      sfx.init();
      if (this.dialogOpen) { this.advanceDialog(); return; }
      if (pointer.leftButtonDown()) {
        this.performAttack();
      } else if (pointer.rightButtonDown()) {
        this.performSpecialAttack();
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerMove(pointer);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerUp(pointer);
      }
    });

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (this.devModeEnabled) {
        this.handleDevWheel(pointer, deltaY);
      }
    });

    // Prevent default right click menu on canvas
    this.input.mouse.disableContextMenu();
  },

  /**
   * Rebind active keys dynamically from KeybindsManager
   */
  rebindControls() {
    if (!this.input || !this.input.keyboard) return;

    if (this.keyDevToggle) this.keyDevToggle.removeAllListeners();
    if (this.keyHitboxToggle) this.keyHitboxToggle.removeAllListeners();

    this.keyMoveUp = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveUp')));
    this.keyMoveDown = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveDown')));
    this.keyMoveLeft = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveLeft')));
    this.keyMoveRight = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveRight')));

    this.keyAttack = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('attack')));
    this.keySpecial = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('special')));
    this.keyDash = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('dash')));
    this.keyRun = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('run')));
    this.keySpin = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('spin')));
    this.keyUltimate = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('ultimate')));

    this.keyHeroSoldier = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('heroSoldier')));
    this.keyHeroWizard = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('heroWizard') || '2'));

    this.keyHeroSwordsman = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.keyInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    // Auxiliary space key for fallback melee attack
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Dev mode toggle hotkey
    this.keyDevToggle = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('devMode')));
    this.keyDevToggle.on('down', () => this.toggleDevMode());

    // Hitbox visualization debug hotkey
    this.keyHitboxToggle = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('hitboxes')));
    this.keyHitboxToggle.on('down', () => this.toggleCollisionDebug());
  },

  /**
   * 4-directional movement using configured keys and Arrow Keys.
   * Includes diagonal normalization and world boundary protection.
   */
  /** Animation key for the way the hero is facing: 'wizard_walk' -> 'wizard_walk_front' when he looks at the camera. */
  heroAnim(key) {
    if (!this.facingV || !/^(wizard|soldier|swordsman)_(idle|walk|attack1|attack2)$/.test(key)) return key;
    const k = key + '_' + this.facingV;
    return this.anims.exists(k) ? k : key;
  },

  handlePlayerMovement() {
    // Frozen while fading in/out of a building
    if (this._doorTransition || this.dialogOpen) {
      this.player.setVelocity(0, 0);
      const idleKey = `${this.playerHero}_idle`;
      if (this.anims.exists(idleKey)) this.player.play(idleKey, true);
      return;
    }
    if (this.isAttacking || this.isDashing || this.isSpinning) {
      if (this.isAttacking) {
        this.player.setVelocity(0, 0);
      }
      return;
    }

    let vx = 0;
    let vy = 0;

    const left = (this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown;
    const right = (this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown;
    const up = (this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown;
    const down = (this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      // Normalize diagonal vector
      const isSlowed = this._inSlowZone && this.time.now < this._slowZoneTimer;
      const running = !!(this.keyRun && this.keyRun.isDown);
      this.isRunning = running;
      const baseSpeed = running ? (this.playerRunSpeed || 180) : this.playerSpeed;
      const speed = isSlowed ? baseSpeed * 0.5 : baseSpeed;
      const mag = Math.hypot(vx, vy);
      this.player.setVelocity((vx / mag) * speed, (vy / mag) * speed);

      // Facing direction
      if (vx < 0) {
        this.player.setFlipX(true);
        this.facingDirection = 'left';
        this.facingV = null;
      } else if (vx > 0) {
        this.player.setFlipX(false);
        this.facingDirection = 'right';
        this.facingV = null;
      } else if (this.anims.exists(`${this.playerHero}_walk_front`)) {
        // straight down / up: heroes that have those views turn to face the camera or away from it
        this.facingV = vy > 0 ? 'front' : 'back';
        this.player.setFlipX(false);
        this.facingDirection = 'right';
      }

      // Play walk animation
      // play(key, true) restarts the cycle if it had been stopped (e.g. after hurt/attack)
      // but never re-triggers it while it is already running.
      const walkAnim = `${this.playerHero}_walk`;
      if (this.anims.exists(walkAnim)) this.player.play(walkAnim, true);
      // legs move in step with the pace
      if (this.player.anims.currentAnim && this.player.anims.currentAnim.key.indexOf(walkAnim) === 0) this.player.anims.timeScale = running ? 1.35 : 0.85;
    } else {
      this.player.setVelocity(0, 0);
      // Play idle animation
      const idleAnim = `${this.playerHero}_idle`;
      if (this.anims.exists(idleAnim)) this.player.play(idleAnim, true);
    }
  },

  /**
   * Footstep foley: one step every ~0.3 s while the hero is walking, chosen by the
   * surface under his feet (grass, dirt road, wooden floor, stone floor).
   */
  updateFootsteps() {
    const p = this.player;
    // the walk-cycle speed-up/slow-down must never leak into attacks or other animations
    if (p && p.anims && p.anims.currentAnim && !/_walk$/.test(p.anims.currentAnim.key) && p.anims.timeScale !== 1) p.anims.timeScale = 1;
    if (!p || !p.body || this.isDead || this.isDashing || this.isSpinning || this._doorTransition) return;
    const speed = Math.hypot(p.body.velocity.x, p.body.velocity.y);
    if (speed < 20) { this._stepAt = 0; return; }
    const now = this.time.now;
    if (!this._stepAt) this._stepAt = now + 90;
    if (now < this._stepAt) return;
    this._stepAt = now + (speed > 150 ? 230 : 360);

    let surface = 'grass';
    if (this.currentInterior) {
      const kind = this.currentInterior.building.kind;
      surface = this.currentInterior.area.surface || (kind === 'tienda' ? 'stone' : kind === 'granero' ? 'dirt' : 'wood');
    } else if (this._gameMode === 'campaign' && this.layerRoad && this.layerRoad.getTileAtWorldXY) {
      const fx = p.body.center.x, fy = p.body.bottom - 2;
      try { if (this.layerRoad.getTileAtWorldXY(fx, fy)) surface = 'dirt'; } catch (e) { }
    }
    this._stepFlip = !this._stepFlip;
    const names = { grass: ['step_grass1', 'step_grass2'], wood: ['step_wood1', 'step_wood2'], stone: ['step_stone1', 'step_stone1'], dirt: ['step_dirt1', 'step_dirt1'] }[surface];
    sfx.fx(names[this._stepFlip ? 0 : 1], surface === 'grass' ? 0.4 : 0.5, { rate: 0.92 + Math.random() * 0.16 });
  },

  /**
   * Damage player and update 3 Hearts Bar:
   * - Depletes one heart
   * - 1.2s invulnerability frames with flashing
   * - Red screen flash vignette
   * - Game Over on 0 hearts
   */
  damagePlayer(amount) {
    if (this.isInvulnerable || this.isDead || this.dialogOpen || this._doorTransition || this.studioOn) return;

    if (this._gameMode === 'campaign' && this.tryParry && this.tryParry()) return;

    // Horos charging his thunder: an arcane guard soaks up the first hit of each charge
    const charging = this.thunderCharge;
    if (charging && !charging.guardUsed) {
      charging.guardUsed = true;
      charging.guardFlash = this.time.now;
      this.createFloatingText(this.player.x, this.player.y - 40, '¡BLOQUEADO!', 0x7dd3fc);
      sfx.fx('ice_cast', 0.6, { rate: 0.8 });
      this.cameras.main.shake(90, 0.004);
      this.isInvulnerable = true;
      this.time.delayedCall(500, () => { if (this.thunderCharge || !this.isCastingThunder) this.isInvulnerable = false; });
      return;
    }

    this.health -= amount;
    if (this.health < 0) this.health = 0;

    sfx.fx((HEROES[this.playerHero] || HEROES.soldier).hurt, 0.9) || sfx.playPlayerHurt();
    this.cameras.main.shake(200, 0.012);

    // Screen flash red
    this.cameras.main.flash(220, 180, 20, 20);

    // Update 3 Hearts HUD
    this.updateHUD();

    if (this.health <= 0) {
      // Player Died
      this.isDead = true;
      this.player.setVelocity(0, 0);
      this.player.play(`${this.playerHero}_death`);
      sfx.fx((HEROES[this.playerHero] || HEROES.soldier).death, 1);
      sfx.playGameOver();

      this.time.delayedCall(1200, () => {
        if (this._gameMode === 'campaign') this.campaignDefeat();
        else this.showGameOverModal();
      });
    } else {
      // Invulnerability period
      this.isInvulnerable = true;
      // a hit never breaks Horos' charging pose
      if (!this.thunderCharge) this.player.play(`${this.playerHero}_hurt`);

      // Flashing alpha tween
      this.tweens.add({
        targets: this.player,
        alpha: 0.35,
        duration: 120,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          this.player.setAlpha(1);
          this.isInvulnerable = false;
        }
      });
    }
  },

  /**
   * Switch playable hero (Soldier <-> Wizard)
   */
  switchHero(newHero) {
    if (this.playerHero === newHero || this.isDead) return;
    // Campaign: the hero chosen on the selection screen is locked for the whole run
    if (this._gameMode === 'campaign') return;

    this.isDashing = false;
    this.isSpinning = false;
    this.playerHero = newHero;
    const currentAnim = this.player.anims.currentAnim?.key;
    const validSuffixes = ['idle', 'walk', 'attack1', 'attack2'];
    const suffix = (currentAnim && validSuffixes.includes(currentAnim.split('_')[1])) ? currentAnim.split('_')[1] : 'idle';
    this.player.setTexture(`${this.playerHero}_${suffix}`);
    this.player.play(`${this.playerHero}_${suffix}`);

    // Re-apply character scale and feet hitbox dimensions on character change
    this.player.setScale(1.20);
    this.player.body.setSize(16, 8);
    this.player.body.setOffset(42, 52);
    if (this.currentInterior) this.setPlayerIndoorScale(true);

    // Update active hero button in DOM
    document.querySelectorAll('.hero-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hero === newHero);
    });

    // Update HUD display
    this.updateHUD();

    const heroDef = HEROES[newHero] || HEROES.soldier;
    this.createFloatingText(this.player.x, this.player.y - 44, `¡${heroDef.name} ACTIVADO!`, heroDef.color);
  }
});
