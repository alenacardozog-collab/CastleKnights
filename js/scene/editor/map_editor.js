'use strict';
/* Map editor (practice map): asset palette, hitbox fitting, random map. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Open the Map Editor directly from Start Menu
   */
  openMapEditor() {
    if (this.destroyInteriors) this.destroyInteriors();
    music.stopAll();
    this.enterFullscreen();
    this.gameStarted = false;
    this.isGamePaused = false;
    this.readyForCombat = false;
    this.hideReadyPrompt();
    this._gameMode = 'practice';
    this.mapWidth = 1400;
    this.mapHeight = 1400;

    // Close open modals
    ['options-modal', 'pause-modal', 'exit-modal', 'farewell-modal', 'game-over-modal', 'practica-modal'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });

    // Hide Start Menu & in-game HUD
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
    if (hud) hud.classList.add('hidden');

    // 1. Clean up campaign elements if active
    if (this.campaignObjectSprites) {
      this.campaignObjectSprites.forEach(s => s && s.destroy && s.destroy());
      this.campaignObjectSprites = [];
    }
    if (this.campaignShadowSprites) {
      this.campaignShadowSprites.forEach(s => s && s.destroy && s.destroy());
      this.campaignShadowSprites = [];
    }
    if (this.tiledMap) {
      try { this.tiledMap.destroy(); } catch (e) { }
      this.tiledMap = null;
    }
    ['layerGround', 'layerRoad', 'layerWater', 'layerRockSlopes', 'layerFlowers', 'layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch (e) { } this[k] = null; }
    });

    // 2. Clean up existing practice objects and obstacles so editor starts with clean terrain
    if (this.objectSpritesMap) {
      this.objectSpritesMap.forEach(entry => {
        if (entry.sprite?.destroy) entry.sprite.destroy();
        if (entry.glow?.destroy) entry.glow.destroy();
        if (entry.label?.destroy) entry.label.destroy();
      });
      this.objectSpritesMap.clear();
    }
    if (this.devSceneryObjects) {
      this.devSceneryObjects.forEach(s => s && s.destroy && s.destroy());
      this.devSceneryObjects = [];
    }
    if (this.devObjectSprites) {
      this.devObjectSprites.forEach(s => s && s.destroy && s.destroy());
      this.devObjectSprites = [];
    }
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    if (this.projectiles) {
      this.projectiles.clear(true, true);
    }
    if (this.heartPickups) {
      this.heartPickups.clear(true, true);
    }
    if (this.obstaclesGroup) {
      this.obstaclesGroup.clear(true, true);
    }

    // Empty object & obstacle state for clean custom creation
    this.mapObjects = [];
    this.mapObstacles = [];
    this.selectedObjectId = null;
    this.selectedHitboxIndex = -1;

    // 3. Show procedural meadow background (clean terrain without objects)
    if (this.meadowTileSprite) this.meadowTileSprite.setVisible(true);
    if (this.groundGfx) this.groundGfx.setVisible(true);

    // 4. Player position at meadow center
    if (this.player) {
      this.player.setPosition(700, 700);
      this.player.setVelocity(0, 0);
      this.player.setDepth(700);
      this.player.setAlpha(1);
      this.player.play(`${this.playerHero}_idle`);
    }

    // 5. World & Camera bounds centered on clean terrain
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.stopFollow();
    this.cameras.main.centerOn(700, 700);
    this.cameras.main.setZoom(1.15);

    // 6. Activate Dev Mode Toolbar & Inspector if not already active
    if (!this.devModeEnabled) {
      this.toggleDevMode();
    }

    // Switch to Objects/Props tab
    this.setDevModeSub('objects');

    // Open asset palette drawer
    this.openAssetPalette();

    // Update counts
    if (typeof this.updateObjectCountDOM === 'function') this.updateObjectCountDOM();
    if (typeof this.updateHitboxCountDOM === 'function') this.updateHitboxCountDOM();
    if (this.devOverlayGfx) this.devOverlayGfx.clear();

    this.showDevToast('🗺️ Terreno limpio preparado. Selecciona props de la paleta y colócalos con clic.', '🎨');
  },

  /**
   * Asset Palette drawer methods
   */
  openAssetPalette() {
    const palette = document.getElementById('editor-asset-palette');
    if (palette) {
      palette.classList.remove('hidden');
      palette.classList.add('open');
    }
    this.renderPaletteItems(this.currentPaletteCategory || 'all');
  },

  closeAssetPalette() {
    const palette = document.getElementById('editor-asset-palette');
    if (palette) {
      palette.classList.add('hidden');
      palette.classList.remove('open');
    }
    this.clearPaletteSelection();
  },

  toggleAssetPalette() {
    const palette = document.getElementById('editor-asset-palette');
    if (palette) {
      if (palette.classList.contains('hidden')) {
        this.openAssetPalette();
      } else {
        this.closeAssetPalette();
      }
    }
  },

  renderPaletteItems(category = 'all') {
    this.currentPaletteCategory = category;
    const grid = document.getElementById('editor-palette-grid') || document.getElementById('palette-items-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const hasBase64 = typeof window !== 'undefined' && Boolean(window.GAME_ASSETS_BASE64);
    const hasMapBase64 = typeof window !== 'undefined' && Boolean(window.MAP_ASSETS_BASE64);
    const getAssetSrc = (key, defaultPath) => {
      if (hasMapBase64 && window.MAP_ASSETS_BASE64[key]) return window.MAP_ASSETS_BASE64[key];
      if (hasMapBase64 && defaultPath && window.MAP_ASSETS_BASE64[defaultPath]) return window.MAP_ASSETS_BASE64[defaultPath];
      if (hasBase64 && window.GAME_ASSETS_BASE64[key]) return window.GAME_ASSETS_BASE64[key];
      return defaultPath || key;
    };

    const items = MAP_ASSETS_CATALOG.filter(it => {
      if (category === 'all') return true;
      if (it.category === category || it.cat === category) return true;
      if (category === 'fire' && (it.cat === 'lights' || it.cat === 'fire')) return true;
      return false;
    });

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `palette-item ${this.selectedPaletteAsset && this.selectedPaletteAsset.key === item.key ? 'active' : ''}`;
      el.setAttribute('data-key', item.key);
      el.title = `${item.name} (${item.w}x${item.h}px)`;

      const filePath = item.path || ('assets/map/' + item.file);
      const img = document.createElement('img');
      img.src = getAssetSrc(item.key, filePath);
      img.alt = item.name;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'palette-item-name';
      nameSpan.textContent = item.name;

      const dimSpan = document.createElement('span');
      dimSpan.className = 'palette-item-dim';
      dimSpan.textContent = `${item.w}x${item.h}`;

      el.appendChild(img);
      el.appendChild(nameSpan);
      el.appendChild(dimSpan);

      el.onclick = (e) => {
        e.stopPropagation();
        this.selectPaletteAsset(item);
      };

      grid.appendChild(el);
    });
  },

  selectPaletteAsset(asset) {
    if (this.selectedPaletteAsset && this.selectedPaletteAsset.key === asset.key) {
      this.clearPaletteSelection();
      return;
    }

    this.selectedPaletteAsset = asset;
    this.clearDevSelection();

    // Ensure we are in objects submode
    if (this.devModeSub !== 'objects') {
      this.setDevModeSub('objects');
    }

    // Update active highlight in DOM
    document.querySelectorAll('.palette-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-key') === asset.key);
    });

    this.showDevToast(`Seleccionado: ${asset.name}. Clic en el mapa para colocarlo. (Clic der. cancela)`, '🖌️');
  },

  clearPaletteSelection() {
    this.selectedPaletteAsset = null;
    document.querySelectorAll('.palette-item').forEach(el => el.classList.remove('active'));
    if (this.devOverlayGfx) this.devOverlayGfx.clear();
  },

  /**
   * Calculate pixel-perfect fitted hitbox for any prop so it never spills over.
   * Hitboxes tightly match the grounded footprint / base of each PNG.
   */
  calculateFitHitbox(prop) {
    return calculateFitHitboxStatic(prop);
  },

  /**
   * Fit the currently selected object's or hitbox's collision box to exact pixels
   */
  fitSelectedHitboxToPixels() {
    // 1. If an object is selected
    if (this.devModeSub === 'objects' && this.selectedObjectId) {
      const prop = this.mapObjects.find(o => o.id === this.selectedObjectId);
      if (!prop) return;

      const fit = this.calculateFitHitbox(prop);
      if (!fit) return;

      let existing = this.mapObstacles.find(o => o.propId === prop.id);
      if (existing) {
        existing.x = fit.x;
        existing.y = fit.y;
        existing.w = fit.w;
        existing.h = fit.h;
        existing.type = 'solid';
      } else {
        this.mapObstacles.push(fit);
      }

      this.rebuildObstacleColliders();
      this.renderDevHitboxes();
      this.updateHitboxCountDOM();
      this.saveMapToStorage(true);
      this.showDevToast(`✓ Colisión ajustada a los píxeles de: ${prop.name}`, '📐');
      return;
    }

    // 2. If a hitbox is selected
    if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0 && this.selectedHitboxIndex < this.mapObstacles.length) {
      const obs = this.mapObstacles[this.selectedHitboxIndex];
      // Find associated prop either by propId or nearest prop footprint
      let prop = obs.propId ? this.mapObjects.find(o => o.id === obs.propId) : null;
      if (!prop) {
        let minDist = Infinity;
        this.mapObjects.forEach(o => {
          if (o.type === 'player_spawn' || o.type === 'enemy_spawn') return;
          const dist = Math.hypot(o.x - (obs.x + obs.w / 2), o.y - (obs.y + obs.h / 2));
          if (dist < minDist) {
            minDist = dist;
            prop = o;
          }
        });
      }

      if (prop) {
        const fit = this.calculateFitHitbox(prop);
        if (fit) {
          obs.x = fit.x;
          obs.y = fit.y;
          obs.w = fit.w;
          obs.h = fit.h;
          obs.propId = prop.id;
          this.rebuildObstacleColliders();
          this.renderDevHitboxes();
          this.updateDevInspectorDOM();
          this.saveMapToStorage(true);
          this.showDevToast(`✓ Hitbox ajustada a los píxeles de ${prop.name}`, '📐');
        }
      }
    }
  },

  /**
   * Fit all hitboxes across the entire map to their exact PNG pixels without overflowing
   */
  fitAllHitboxesToPixels() {
    let count = 0;
    this.mapObjects.forEach(prop => {
      if (prop.type === 'player_spawn' || prop.type === 'enemy_spawn') return;
      const fit = this.calculateFitHitbox(prop);
      if (!fit) return;

      let existing = this.mapObstacles.find(o => o.propId === prop.id);
      if (existing) {
        existing.x = fit.x;
        existing.y = fit.y;
        existing.w = fit.w;
        existing.h = fit.h;
      } else {
        this.mapObstacles.push(fit);
      }
      count++;
    });

    this.rebuildObstacleColliders();
    this.renderDevHitboxes();
    this.updateHitboxCountDOM();
    this.saveMapToStorage(true);
    this.showDevToast(`✓ ${count} colisiones ajustadas a la perfección sin sobresalir`, '📐');
  },

  /**
   * Generates a completely new randomized village on the meadow grass with pixel hitboxes
   */
  generateRandomMap() {
    const data = generateRandomMeadowLayout(1400, 1400);
    this.mapObjects = data.objects;
    this.mapObstacles = data.obstacles;
    this.enemySpawns = data.enemySpawns;

    this.rebuildObstacleColliders();
    this.createMapObjects();
    this.renderDevHitboxes();
    this.renderDevObjectsOverlay();
    this.renderDevSpawns();
    this.updateHitboxCountDOM();
    this.updateObjectCountDOM();
    this.updateSpawnCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(false);

    // Reposition player
    const pSpawn = this.mapObjects.find(o => o.type === 'player_spawn');
    if (this.player && pSpawn) {
      this.player.setPosition(pSpawn.x, pSpawn.y);
      this.player.setDepth(pSpawn.y);
    }

    this.showDevToast('🎲 ¡Mapa aleatorio generado con fondo verde y cajas de colisión ajustadas!', '🎲');
  },

  /**
   * Immediately play the current map in-game
   */
  playCurrentMap() {
    this.closeAssetPalette();
    if (this.devModeEnabled) {
      this.toggleDevMode();
    }
    this.startGame();
    this.showDevToast('⚔️ ¡Partida iniciada!', '⚔️');
  }
});
