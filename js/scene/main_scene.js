/* MainGameScene: the single Phaser scene. Only the life cycle is here (constructor, create, start modes, pause, update); the rest of its methods are added by the files in js/scene/**. */

// ==========================================
// 2. MAIN PHASER GAME SCENE
// ==========================================
class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGameScene' });

    // Menu and session state
    this.gameStarted = false;
    this.isGamePaused = false;

    // Game state
    this.playerHero = 'soldier'; // 'soldier' or 'wizard'
    this.selectedHero = 'soldier';
    this.heroSelectionTargetMode = 'practice';
    this.maxHealth = 3;
    this.health = 3;
    this.isInvulnerable = false;
    this.isAttacking = false;
    this.isDead = false;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    this.gameStartTime = 0;

    // Movement & Dash
    this.playerSpeed = 115;   // walking
    this.playerRunSpeed = 180; // holding the Run key
    this.facingDirection = 'right'; // 'left' or 'right'
    this.lastAttackCombo = 1;
    this.isDashing = false;
    this.lastDashTime = 0;
    this.dashCooldown = 600;
    this.isSpinning = false;
    this.lastSpinTime = 0;
    this.spinCooldown = 1200;

    // Stamina / Energy System
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaRegenRate = 18; // Points per second (~5.5s from 0 to 100%)
    this.dashStaminaCost = 50;  // Dash consumes half the stamina bar (50%)
    this.spinStaminaCost = 35;  // Spin consumes 35% stamina
    this.lastLowStaminaWarning = 0;

    // Groups
    this.enemies = null;
    this.projectiles = null;
    this.heartPickups = null;

    // Developer Mode State
    this.devModeEnabled = false;
    this.devActiveTab = 'hitbox'; // 'hitbox', 'objects', 'spawns'
    this.devAiPaused = false;
    this.devGridSnap = 32;
    this.devShowGrid = true;
    this.selectedItem = null;
    this.selectedType = null; // 'obstacle', 'object', 'spawn'
    this.isDraggingItem = false;
    this.isResizingHitbox = false;
    this.resizeCorner = null; // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
    this.dragStartData = null;
    this.isDrawingHitbox = false;
    this.drawStartPoint = null;
    this.devCameraPanning = false;
    this.devPanStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };
    this.mapObstacles = [];
    this.mapObjects = [];
    this.enemySpawns = [];
    this.objectSpritesMap = new Map();
    this.devGridGfx = null;
    this.devHitboxGfx = null;
    this.devOverlayGfx = null;
    this.devSpawnsGfx = null;

    // Hazard & slow zone state
    this._lastHazardHit = 0;
    this._inSlowZone = false;
    this._slowZoneTimer = 0;
  }

  create() {
    this.destroyLoadingText();
    window.activeGameScene = this;
    this.gameStarted = false;
    this.isGamePaused = false;
    this.gameStartTime = Date.now();
    this.isDead = false;
    this.health = 3;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    this.updateHUD();

    // Hide in-game HUD initially while in Start Menu
    const hud = document.querySelector('.in-game-hud');
    if (hud) hud.classList.add('hidden');

    // Initialize Keybinds Manager & keyboard listener
    KeybindsManager.init();

    // Map dimensions: 1400x1400 lush medieval meadow
    this.mapWidth = 1400;
    this.mapHeight = 1400;

    // Practice map defaults to pure terrain without obstacle hitboxes
    const storedData = loadStoredMapData();
    this.mapObstacles = [];
    this.mapObjects = [];
    this.enemySpawns = storedData.enemySpawns;

    // Graphics layers for Dev Mode
    this.devGridGfx = this.add.graphics().setDepth(998);
    this.devHitboxGfx = this.add.graphics().setDepth(999);
    this.devOverlayGfx = this.add.graphics().setDepth(1000);
    this.devSpawnsGfx = this.add.graphics().setDepth(1001);

    // Initial physics world bounds
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // 1. Build Background Meadow Map with grass & pathways
    this.createMeadowMap();

    // 2. Setup Animations for Characters & Props
    this.createCharacterAnimations();

    // 3. Create Solid Scenery Obstacles with pixel-fitted hitboxes
    this.createSolidObstacles();

    // 4. Create Map Objects & Decorative Props
    this.createMapObjects();

    // 5. Create Player in Open Central Courtyard
    this.createPlayer();

    // 6. Center Camera on Player & Bind Camera to Map Bounds
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1.45);

    // Populate Asset Palette drawer
    this.renderPaletteItems();

    // 7. Setup Physics Groups (Enemies, Projectiles, Pickups)
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.heartPickups = this.physics.add.group();

    // 7. Setup Controls (WASD, Arrows, Attack keys, P for debug)
    this.setupControls();

    // 8. Collisions and Physics Interactions
    // Solid obstacles block Player, Enemies, and Projectiles
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.projectiles, this.obstacles, (arrow) => {
      if (arrow && arrow.active) arrow.destroy();
    });

    // Water obstacles block Player and Enemies, but projectiles fly through freely!
    if (this.waterObstacles) {
      this.physics.add.collider(this.player, this.waterObstacles);
      this.physics.add.collider(this.enemies, this.waterObstacles);
    }

    // Low obstacles block Player and Enemies, but projectiles fly through freely!
    this.physics.add.collider(this.player, this.lowObstacles);
    this.physics.add.collider(this.enemies, this.lowObstacles);

    // Hazard zones damage Player and Enemies
    this.physics.add.overlap(this.player, this.hazardZones, this.handlePlayerHazardTouch, null, this);
    this.physics.add.overlap(this.enemies, this.hazardZones, this.handleEnemyHazardTouch, null, this);

    // Slow zones reduce Player movement speed
    this.physics.add.overlap(this.player, this.slowZones, this.handlePlayerSlowTouch, null, this);

    this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.heartPickups, this.handlePickupHeart, null, this);

    // 9. Enemy Spawner Loop (Runs only when actively playing and combat is ready)
    this.time.addEvent({
      delay: 3200,
      callback: () => {
        if (this.gameStarted && this.readyForCombat && !this.isDead && !this.isGamePaused && !this.devAiPaused) {
          this.spawnEnemyWave();
        }
      },
      callbackScope: this,
      loop: true
    });

    // Bind DOM events
    this.bindDOMElements();
    VolumeSettings.bindUI();

    // Initialize looping muted background intro video
    this.initIntroVideo();

    // If player clicked before assets finished loading, start immediately
    if (window._pendingAutoStart === 'campaign') {
      window._pendingAutoStart = false;
      this.startCampaign();
    } else if (window._pendingAutoStart === 'editor') {
      window._pendingAutoStart = false;
      this.openMapEditor();
    } else if (window._pendingHeroMode) {
      const mode = window._pendingHeroMode;
      window._pendingHeroMode = null;
      this.openHeroSelectionModal(mode);
    } else if (window._pendingAutoStart) {
      window._pendingAutoStart = false;
      this.startGame();
    }
  }

  /**
   * Start the generic Practice map (embedded meadow / mapa1_data.js)
   */
  startPractice() {
    if (this.destroyInteriors) this.destroyInteriors();
    this._gameMode = 'practice';
    this._currentMapKey = 'tiled_map';

    // 1. Clean up campaign objects & shadows
    if (this.campaignObjectSprites) {
      this.campaignObjectSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.campaignObjectSprites = [];

    if (this.campaignShadowSprites) {
      this.campaignShadowSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.campaignShadowSprites = [];

    if (this.tiledMap) {
      try { this.tiledMap.destroy(); } catch (e) { }
      this.tiledMap = null;
    }
    ['layerGround', 'layerRoad', 'layerWater', 'layerRockSlopes', 'layerFlowers', 'layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch (e) { } this[k] = null; }
    });

    // 2. Restore procedural meadow background
    this.mapWidth = 1400;
    this.mapHeight = 1400;
    if (this.meadowTileSprite) this.meadowTileSprite.setVisible(true);
    if (this.groundGfx) this.groundGfx.setVisible(true);

    // 3. Clear hitboxes and props - Pon solo el terreno sin hitboxes
    this.mapObstacles = [];
    this.mapObjects = [];
    MAP_OBSTACLES = [];
    this.rebuildObstacleColliders();
    this.createMapObjects();
    if (this.obstacleDebugGfx) this.obstacleDebugGfx.clear();
    if (this.devHitboxGfx) this.devHitboxGfx.clear();
    if (this.updateHitboxCountDOM) this.updateHitboxCountDOM();
    if (this.updateObjectCountDOM) this.updateObjectCountDOM();

    // 4. Set player position and bounds
    if (this.player) {
      this.player.setTexture(`${this.playerHero}_idle`);
      this.player.play(`${this.playerHero}_idle`);
      this.player.setPosition(700, 710);
      this.player.setVelocity(0, 0);
      this.player.setDepth(710);
    }
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    // Stop intro music in practice combat mode
    music.stopAll();

    this.startGame('practice');
  }

  /**
   * Start the Campaign map (assets/map2/map1.json using assets/map2/Art/).
   */
  startCampaign() {
    this.destroyInteriors();
    this._gameMode = 'campaign';
    this._currentMapKey = 'campaign_tiled_map';

    // Start village background music for Campaign Map 2
    music.play('village');

    // 1. Hide procedural meadow background
    if (this.meadowTileSprite) this.meadowTileSprite.setVisible(false);
    if (this.groundGfx) this.groundGfx.setVisible(false);

    // 2. Clean up previous objects, colliders & sprites
    if (this.campaignObjectSprites) {
      this.campaignObjectSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.campaignObjectSprites = [];

    if (this.campaignShadowSprites) {
      this.campaignShadowSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.campaignShadowSprites = [];

    if (this.campaignNPCs) {
      this.campaignNPCs.forEach(n => n.sprite && n.sprite.destroy());
    }
    this.campaignNPCs = [];

    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    if (this.projectiles) {
      this.projectiles.clear(true, true);
    }
    if (this.heartPickups) {
      this.heartPickups.clear(true, true);
    }
    this.readyForCombat = false;
    this.hideReadyPrompt();

    if (this.devSceneryObjects) {
      this.devSceneryObjects.forEach(s => s && s.destroy && s.destroy());
    }
    this.devSceneryObjects = [];

    if (this.devObjectSprites) {
      this.devObjectSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.devObjectSprites = [];

    if (this.tiledMap) {
      try { this.tiledMap.destroy(); } catch (e) { }
      this.tiledMap = null;
    }
    ['layerGround', 'layerRoad', 'layerWater', 'layerRockSlopes', 'layerFlowers', 'layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch (e) { } this[k] = null; }
    });

    // 3. Clear existing map obstacles so campaign map builds fresh native colliders
    this.mapObstacles = null;

    // 4. Build campaign map
    const buildCampaign = () => {
      this.createTiledMap('campaign_tiled_map');
      this.createSolidObstacles();

      // Position player at village center road (250, 340)
      if (this.player) {
        this.player.setTexture(`${this.playerHero}_idle`);
        this.player.play(`${this.playerHero}_idle`);
        this.player.setPosition(250, 340);
        this.player.setVelocity(0, 0);
        this.player.setDepth(340);
      }

      // Camera settings for 640x640 campaign map
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
      this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
      this.cameras.main.setZoom(1.5);

      this.startGame('campaign');

      // Ensure NPCs are spawned in peaceful village lobby
      this.spawnCampaignNPCs();
    };

    if (this.cache.tilemap.has('campaign_tiled_map')) {
      buildCampaign();
    } else if (window.CAMPAIGN_MAP_DATA) {
      this.cache.tilemap.add('campaign_tiled_map', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: window.CAMPAIGN_MAP_DATA
      });
      buildCampaign();
    } else {
      this.load.tilemapTiledJSON('campaign_tiled_map', 'assets/map2/map1.json');
      this.load.once('complete', () => {
        buildCampaign();
      });
      this.load.start();
    }
  }

  /**
   * Request fullscreen on game container
   */
  enterFullscreen() {
    const wrapper = document.getElementById('game-wrapper') || document.documentElement;
    if (!document.fullscreenElement && wrapper) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => { });
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
    }
  }

  /**
   * Start gameplay from the Start Menu in Fullscreen
   * @param {string} [mode='practice'] - 'practice' uses the embedded generic map;
   *                                      'campaign' loads assets/map2/mapa1.json
   */
  startGame(mode) {
    this._gameMode = mode || 'practice';
    this.enterFullscreen();
    this.gameStarted = true;
    this.isGamePaused = false;
    this.gameStartTime = Date.now();
    this.isDead = false;
    this.isInvulnerable = false;
    this.health = 3;
    this.kills = 0;
    this.score = 0;
    this.wave = 1;
    this.readyForCombat = false; // Player must click "¡ESTOY LISTO!" to trigger combat
    if (this.player) {
      this.player.setTexture(`${this.playerHero}_idle`);
      this.player.play(`${this.playerHero}_idle`);
      this.player.setAlpha(1);
      this.player.clearTint();
      this.player.setVelocity(0, 0);
    }
    this.updateHUD();

    // Close any other modal that might be open
    ['options-modal', 'pause-modal', 'exit-modal', 'farewell-modal', 'game-over-modal', 'practica-modal', 'hero-selection-modal'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });

    const startMenu = document.getElementById('start-menu-overlay');
    if (startMenu) {
      startMenu.classList.add('hidden');
      startMenu.style.display = 'none';
    }
    const introVideo = document.getElementById('intro-video');
    if (introVideo) {
      try { introVideo.pause(); } catch (e) { }
    }

    const hud = document.querySelector('.in-game-hud');
    if (hud) hud.classList.remove('hidden');
    // Campaign locks the chosen hero: no in-game switch buttons
    const heroSwitch = document.querySelector('.hero-selector');
    if (heroSwitch) heroSwitch.style.display = this._gameMode === 'campaign' ? 'none' : '';

    sfx.init();
    sfx.playSwing();

    // Clear any previous enemies from the scene
    if (this.enemies) {
      this.enemies.clear(true, true);
    }

    // Show the "¡ESTOY LISTO!" button on the map (only in practice mode)
    if (this._gameMode === 'campaign') {
      this.readyForCombat = false;
      this.hideReadyPrompt();
    } else {
      this.showReadyPrompt();
    }
  }

  /**
   * Display the floating "¡ESTOY LISTO!" button on the map
   */
  showReadyPrompt() {
    if (this._gameMode === 'campaign') {
      this.hideReadyPrompt();
      return;
    }
    this.readyForCombat = false;
    const readyPrompt = document.getElementById('ready-prompt-container');
    if (readyPrompt) {
      readyPrompt.classList.remove('hidden');
    }
  }

  /**
   * Hide the "¡ESTOY LISTO!" button
   */
  hideReadyPrompt() {
    const readyPrompt = document.getElementById('ready-prompt-container');
    if (readyPrompt) {
      readyPrompt.classList.add('hidden');
    }
  }

  /**
   * Initializes background intro video (looping, muted, autoplay, zero audio)
   */
  initIntroVideo() {
    music.play('intro');
    const vid = document.getElementById('intro-video');
    if (vid) {
      vid.muted = true;
      vid.volume = 0;
      vid.loop = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('muted', '');
      vid.play().catch(() => { });

      const unlockAutoplay = () => {
        if (vid && vid.paused && !document.getElementById('start-menu-overlay')?.classList.contains('hidden')) {
          vid.muted = true;
          vid.volume = 0;
          vid.play().catch(() => { });
        }
        window.removeEventListener('pointerdown', unlockAutoplay);
        window.removeEventListener('keydown', unlockAutoplay);
      };
      window.addEventListener('pointerdown', unlockAutoplay, { once: true });
      window.addEventListener('keydown', unlockAutoplay, { once: true });
    }
  }

  /**
   * Trigger combat when the player clicks "¡ESTOY LISTO!" or presses ENTER:
   * Starts wave timer, spawns initial enemy squad, and unleashes combat.
   */
  triggerStartCombat() {
    if (this._gameMode === 'campaign') return; // Safe zone: campaign lobby
    if (this.readyForCombat || !this.gameStarted || this.isDead) return;
    this.readyForCombat = true;
    this.gameStartTime = Date.now();
    this.wave = 1;
    const waveEl = document.getElementById('stat-wave');
    if (waveEl) waveEl.textContent = '1';

    this.hideReadyPrompt();

    sfx.init();
    sfx.playAlert();
    this.time.delayedCall(160, () => sfx.playSwing());

    if (this.player) {
      this.createFloatingText(this.player.x, this.player.y - 44, '⚔️ ¡A LA BATALLA! ⚔️', 0xf59e0b);
      this.cameras.main.shake(140, 0.003);
    }

    // Spawn initial wave (practice mode only)
    this.time.delayedCall(250, () => {
      if (!this.gameStarted || this.isDead || this._gameMode === 'campaign') return;
      this.spawnEnemy(520, 320);
      this.spawnEnemy(120, 440);
    });
  }

  /**
   * Pause gameplay and display pause menu
   */
  pauseGame() {
    if (!this.gameStarted || this.isDead) return;
    this.isGamePaused = true;
    this.player.setVelocity(0, 0);
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.add('active');
  }

  /**
   * Resume gameplay from pause
   */
  resumeGame() {
    this.isGamePaused = false;
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.remove('active');
  }

  /**
   * Return to Start Menu from Pause, Game Over, or Exit
   */
  returnToStartMenu() {
    if (this.destroyInteriors) this.destroyInteriors();
    this.gameStarted = false;
    this.isGamePaused = false;
    this.readyForCombat = false;
    this.hideReadyPrompt();

    // Close all open modals
    ['pause-modal', 'game-over-modal', 'options-modal', 'exit-modal', 'farewell-modal'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });

    // Show Start Menu overlay & hide in-game HUD
    const startMenu = document.getElementById('start-menu-overlay');
    if (startMenu) {
      startMenu.classList.remove('hidden');
      startMenu.style.display = '';
    }
    music.play('intro');
    const introVideo = document.getElementById('intro-video');
    if (introVideo) {
      introVideo.muted = true;
      introVideo.volume = 0;
      introVideo.play().catch(() => { });
    }

    const hud = document.querySelector('.in-game-hud');
    if (hud) hud.classList.add('hidden');

    // Clean up enemies, pickups, and campaign NPCs
    if (this.enemies) this.enemies.clear(true, true);
    if (this.projectiles) this.projectiles.clear(true, true);
    if (this.heartPickups) this.heartPickups.clear(true, true);
    if (this.campaignNPCs) {
      this.campaignNPCs.forEach(n => n.sprite && n.sprite.destroy());
      this.campaignNPCs = [];
    }

    // Reset player state
    this.health = 3;
    this.isDead = false;
    this.isAttacking = false;
    this.isDashing = false;
    this.isSpinning = false;
    this.stamina = this.maxStamina;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    if (this.player) {
      const pSpawn = this.mapObjects?.find ? this.mapObjects.find(o => o.type === 'player_spawn') : null;
      const startX = pSpawn ? pSpawn.x : 700;
      const startY = pSpawn ? pSpawn.y : 740;
      this.player.setPosition(startX, startY);
      this.player.setVelocity(0, 0);
      this.player.play(`${this.playerHero}_idle`);
    }
    this.updateHUD();
  }

  /**
   * Main game loop
   */
  update(time, delta) {
    if (this.isDead || !this.gameStarted || this.isGamePaused) return;

    // Stamina / Energy gradual regeneration over time
    const dt = delta || this.game.loop.delta || 16.66;
    if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + (this.staminaRegenRate * (dt / 1000)));
      this.updateStaminaBar();
    }

    // Developer Mode real-time rendering & controls
    if (this.devModeEnabled) {
      this.updateDevMode();
      if (this.devAiPaused) {
        this.enemies.getChildren().forEach(e => {
          if (e.active && e.body) e.setVelocity(0, 0);
        });
      }
    }

    // Dynamic 2.5D depth sorting based on Y position (character feet)
    // Ensures player and mobile entities are always intermediate
    // (greater than terrain depth 1..6, but correctly sorted with houses, trees, and props)
    const playerFootY = this.player.body ? Math.round(this.player.body.bottom) : Math.round(this.player.y + 24);
    this.player.setDepth(Math.max(10, playerFootY));

    if (this.enemies) {
      this.enemies.getChildren().forEach(enemy => {
        if (enemy.active) {
          const enemyFootY = enemy.body ? Math.round(enemy.body.bottom) : Math.round(enemy.y + 24);
          enemy.setDepth(Math.max(10, enemyFootY));
        }
      });
    }

    // Environment Tile Animations (River flowing & Flowers swaying in infinite loop)
    if (this.tileAnimations && this.tileAnimations.length > 0) {
      const curTime = this.time.now;
      for (let i = 0; i < this.tileAnimations.length; i++) {
        const a = this.tileAnimations[i];
        const frameIndex = Math.floor((curTime % a.totalDuration) / a.duration);
        a.tile.index = a.frames[frameIndex];
      }
    }

    // Update real-time feet hitbox debug rendering if active
    if (this.showCollisionDebug) {
      this.drawCharacterHitboxesDebug();
    }

    // Do not process hero attack shortcuts when dev mode is active
    if (this.devModeEnabled) {
      if (!this.isDraggingItem && !this.isResizingHitbox) {
        this.handlePlayerMovement();
      } else {
        this.player.setVelocity(0, 0);
      }
      return;
    }

    // Hotkey switching
    if (Phaser.Input.Keyboard.JustDown(this.keyHeroSoldier)) {
      this.switchHero('soldier');
    } else if (this.keyHeroWizard && Phaser.Input.Keyboard.JustDown(this.keyHeroWizard)) {
      this.switchHero('wizard');
    }

    // Hotkey attacks
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      sfx.init();
      this.performAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keySpecial)) {
      sfx.init();
      this.performSpecialAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyDash)) {
      sfx.init();
      this.performDash();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keySpin)) {
      sfx.init();
      this.performSpin();
    }
    if (this.keyUltimate && Phaser.Input.Keyboard.JustDown(this.keyUltimate)) {
      sfx.init();
      if (this.playerHero === 'wizard') this.performThunder(); else this.performArrowRain();
    }

    // Handle Player Movement
    this.handlePlayerMovement();
    this.updateFootsteps();
    this.updateThunderCharge();

    // Update Enemy AI & Chasing
    this.updateEnemies();

    // Animate doors based on player proximity
    this.checkDoorProximity();

    // Update wandering NPCs
    this.updateNPCs();
  }
}
