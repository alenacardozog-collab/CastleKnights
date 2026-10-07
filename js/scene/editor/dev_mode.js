'use strict';
/* Developer mode: overlays (hitboxes, spawns, grid) and mouse handling. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Toggle Developer Mode
   */
  toggleDevMode() {
    this.devModeEnabled = !this.devModeEnabled;
    const btn = document.getElementById('btn-dev-toggle');
    const toolbar = document.getElementById('dev-toolbar');

    if (btn) btn.classList.toggle('active', this.devModeEnabled);
    if (toolbar) toolbar.classList.toggle('hidden', !this.devModeEnabled);

    if (this.devModeEnabled) {
      // Show spawn markers
      this.objectSpritesMap.forEach(entry => {
        if (entry.obj.type === 'player_spawn' || entry.obj.type === 'enemy_spawn') {
          if (entry.sprite) entry.sprite.setVisible(true);
        }
      });

      this.showDevToast('🛠️ Modo Desarrollador Activado (F2)', '🛠️');
      this.updateHitboxCountDOM();
      this.updateObjectCountDOM();
      this.updateSpawnCountDOM();
      this.populateQuickJumpDropdown();
      this.renderDevHitboxes();
      this.renderDevObjectsOverlay();
      this.renderDevSpawns();
      this.renderDevGrid();
    } else {
      // Clear dev graphics & hide markers
      if (this.devGridGfx) this.devGridGfx.clear();
      if (this.devHitboxGfx) this.devHitboxGfx.clear();
      if (this.devOverlayGfx) this.devOverlayGfx.clear();
      if (this.devSpawnsGfx) this.devSpawnsGfx.clear();
      this.closeAssetPalette();

      this.objectSpritesMap.forEach(entry => {
        if (entry.obj.type === 'player_spawn' || entry.obj.type === 'enemy_spawn') {
          if (entry.sprite) entry.sprite.setVisible(false);
        }
      });

      // Restore camera tracking on player
      this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
      this.cameras.main.setZoom(1.45);
      this.clearDevSelection();
      this.showDevToast('Modo Desarrollador Desactivado', '🎮');
    }
  },

  /**
   * Switch Developer Sub-mode: 'hitbox', 'objects', or 'spawns'
   */
  setDevModeSub(subMode) {
    this.devModeSub = subMode;
    const tabHitbox = document.getElementById('dev-tab-hitbox');
    const tabObjects = document.getElementById('dev-tab-objects');
    const tabSpawns = document.getElementById('dev-tab-spawns');
    const addLabel = document.getElementById('dev-btn-add-label');

    if (tabHitbox) tabHitbox.classList.toggle('active', subMode === 'hitbox');
    if (tabObjects) tabObjects.classList.toggle('active', subMode === 'objects');
    if (tabSpawns) tabSpawns.classList.toggle('active', subMode === 'spawns');

    if (addLabel) {
      if (subMode === 'hitbox') addLabel.textContent = 'NUEVA HITBOX';
      else if (subMode === 'spawns') addLabel.textContent = 'NUEVO SPAWN';
      else addLabel.textContent = 'NUEVO OBJETO';
    }

    this.clearDevSelection();
    this.renderDevHitboxes();
    this.renderDevObjectsOverlay();
    this.renderDevSpawns();
  },

  /**
   * Toggle Grid 32x32 rendering
   */
  toggleDevGrid() {
    this.devShowGrid = !this.devShowGrid;
    const btn = document.getElementById('dev-btn-toggle-grid');
    if (btn) btn.classList.toggle('active', this.devShowGrid);
    this.renderDevGrid();
  },

  /**
   * Toggle Enemy AI Pause
   */
  toggleDevAiPause() {
    this.devAiPaused = !this.devAiPaused;
    const btn = document.getElementById('dev-btn-toggle-pause');
    const icon = document.getElementById('dev-pause-icon');
    if (btn) btn.classList.toggle('active', this.devAiPaused);
    if (icon) icon.textContent = this.devAiPaused ? '⏸️' : '▶️';
    this.showDevToast(this.devAiPaused ? 'IA de enemigos pausada' : 'IA de enemigos reanudada', '⚙️');
  },

  /**
   * Main per-frame update for Developer Mode visuals
   */
  updateDevMode() {
    if (!this.devModeEnabled) return;
    this.renderDevHitboxes();
    this.renderDevObjectsOverlay();
    this.renderDevSpawns();
    this.renderDevGrid();
  },

  /**
   * Render all scenery obstacle hitboxes with 8-directional handles and behavioral colors
   */
  renderDevHitboxes() {
    if (!this.devHitboxGfx) return;
    this.devHitboxGfx.clear();
    if (!this.devModeEnabled) return;

    const zoom = this.cameras.main.zoom;

    this.mapObstacles.forEach((obs, idx) => {
      const isSelected = idx === this.selectedHitboxIndex;
      const isHovered = idx === this.hoveredHitboxIndex;
      const type = obs.type || 'solid';

      // Base color tokens per behavior type:
      // solid: Emerald | low: Cyan Blue | hazard: Crimson Red | slow: Mystic Purple
      let baseFill = 0x22c55e;
      let baseFillAlpha = 0.22;
      let baseStroke = 0x16a34a;
      let strokeWidth = 1.5;

      if (type === 'low') {
        baseFill = 0x0ea5e9;
        baseFillAlpha = 0.25;
        baseStroke = 0x0284c7;
      } else if (type === 'hazard') {
        baseFill = 0xef4444;
        baseFillAlpha = 0.32;
        baseStroke = 0xdc2626;
      } else if (type === 'slow') {
        baseFill = 0xa855f7;
        baseFillAlpha = 0.28;
        baseStroke = 0x9333ea;
      }

      if (isSelected) {
        // Selected Hitbox: Warm Golden Glow with Solid Outline
        this.devHitboxGfx.fillStyle(0xf59e0b, 0.40);
        this.devHitboxGfx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.devHitboxGfx.lineStyle(3, 0xfcd34d, 1);
        this.devHitboxGfx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // If locked, draw lock indicator
        if (obs.locked) {
          this.devHitboxGfx.fillStyle(0xef4444, 0.85);
          this.devHitboxGfx.fillRect(obs.x, obs.y, 16, 16);
          this.devHitboxGfx.lineStyle(1.5, 0xffffff, 1);
          this.devHitboxGfx.strokeRect(obs.x, obs.y, 16, 16);
        } else {
          // 8 Resize Handles (4 Corners + 4 Edge Midpoints)
          const cornerSize = Math.max(9 / zoom, 7);
          const cornerHalf = cornerSize / 2;
          const edgeSize = Math.max(7 / zoom, 5);
          const edgeHalf = edgeSize / 2;

          // 1. Four Corners (white square with amber border)
          this.devHitboxGfx.fillStyle(0xffffff, 1);
          this.devHitboxGfx.lineStyle(2, 0xb45309, 1);
          const corners = [
            { x: obs.x, y: obs.y },
            { x: obs.x + obs.w, y: obs.y },
            { x: obs.x, y: obs.y + obs.h },
            { x: obs.x + obs.w, y: obs.y + obs.h }
          ];
          corners.forEach(c => {
            this.devHitboxGfx.fillRect(c.x - cornerHalf, c.y - cornerHalf, cornerSize, cornerSize);
            this.devHitboxGfx.strokeRect(c.x - cornerHalf, c.y - cornerHalf, cornerSize, cornerSize);
          });

          // 2. Four Edges (amber pill with white border)
          this.devHitboxGfx.fillStyle(0xf59e0b, 1);
          this.devHitboxGfx.lineStyle(1.5, 0xffffff, 1);
          const edges = [
            { x: obs.x + obs.w / 2, y: obs.y },             // North
            { x: obs.x + obs.w, y: obs.y + obs.h / 2 },     // East
            { x: obs.x + obs.w / 2, y: obs.y + obs.h },     // South
            { x: obs.x, y: obs.y + obs.h / 2 }              // West
          ];
          edges.forEach(e => {
            this.devHitboxGfx.fillRect(e.x - edgeHalf, e.y - edgeHalf, edgeSize, edgeSize);
            this.devHitboxGfx.strokeRect(e.x - edgeHalf, e.y - edgeHalf, edgeSize, edgeSize);
          });
        }

      } else if (isHovered && this.devModeSub === 'hitbox') {
        // Hovered Hitbox: Cyan Highlight
        this.devHitboxGfx.fillStyle(0x38bdf8, 0.40);
        this.devHitboxGfx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.devHitboxGfx.lineStyle(2, 0x0284c7, 1);
        this.devHitboxGfx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else {
        // Normal Scenery Hitbox
        this.devHitboxGfx.fillStyle(baseFill, baseFillAlpha);
        this.devHitboxGfx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.devHitboxGfx.lineStyle(strokeWidth, baseStroke, 0.9);
        this.devHitboxGfx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    // In-progress interactive hitbox drawing
    if (this.isDrawingHitbox && this.drawStartPoint) {
      const p = this.input.activePointer;
      const wx = this.snapCoord(p.worldX, this.devGridSnap);
      const wy = this.snapCoord(p.worldY, this.devGridSnap);
      const x = Math.min(this.drawStartPoint.x, wx);
      const y = Math.min(this.drawStartPoint.y, wy);
      const w = Math.max(Math.abs(wx - this.drawStartPoint.x), 8);
      const h = Math.max(Math.abs(wy - this.drawStartPoint.y), 8);

      this.devHitboxGfx.fillStyle(0xf43f5e, 0.45);
      this.devHitboxGfx.fillRect(x, y, w, h);
      this.devHitboxGfx.lineStyle(2, 0xffffff, 1);
      this.devHitboxGfx.strokeRect(x, y, w, h);
    }
  },

  /**
   * Render enemy spawn points with dispersion radius circles and skull anchors
   */
  renderDevSpawns() {
    if (!this.devSpawnsGfx) return;
    this.devSpawnsGfx.clear();
    if (!this.devModeEnabled) return;

    const zoom = this.cameras.main.zoom;

    (this.enemySpawns || []).forEach(spawn => {
      const isSelected = spawn.id === this.selectedSpawnId;
      const isHovered = spawn.id === this.hoveredSpawnId;
      const radius = spawn.radius || 48;
      const isActive = spawn.active !== false;

      // 1. Dispersion Radius Circle
      if (isSelected) {
        this.devSpawnsGfx.fillStyle(0xf59e0b, 0.22);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, radius);
        this.devSpawnsGfx.lineStyle(2.5, 0xfcd34d, 1);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, radius);
      } else if (isHovered && this.devModeSub === 'spawns') {
        this.devSpawnsGfx.fillStyle(0x38bdf8, 0.18);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, radius);
        this.devSpawnsGfx.lineStyle(2, 0x0284c7, 0.9);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, radius);
      } else if (isActive) {
        this.devSpawnsGfx.fillStyle(0xef4444, 0.08);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, radius);
        this.devSpawnsGfx.lineStyle(1.5, 0xef4444, 0.5);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, radius);
      } else {
        // Inactive spawn point
        this.devSpawnsGfx.lineStyle(1, 0x94a3b8, 0.35);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, radius);
      }

      // 2. Center Marker Circle
      const centerR = Math.max(12 / zoom, 10);
      if (isSelected) {
        this.devSpawnsGfx.fillStyle(0xf59e0b, 0.95);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, centerR);
        this.devSpawnsGfx.lineStyle(2, 0xffffff, 1);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, centerR);
      } else if (isActive) {
        this.devSpawnsGfx.fillStyle(0xdc2626, 0.9);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, centerR);
        this.devSpawnsGfx.lineStyle(1.5, 0xfca5a5, 1);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, centerR);
      } else {
        this.devSpawnsGfx.fillStyle(0x64748b, 0.8);
        this.devSpawnsGfx.fillCircle(spawn.x, spawn.y, centerR);
        this.devSpawnsGfx.lineStyle(1.5, 0x94a3b8, 1);
        this.devSpawnsGfx.strokeCircle(spawn.x, spawn.y, centerR);
      }

      // Crosshair lines inside center marker
      this.devSpawnsGfx.lineStyle(1.5, 0xffffff, 0.9);
      this.devSpawnsGfx.moveTo(spawn.x - centerR * 0.6, spawn.y);
      this.devSpawnsGfx.lineTo(spawn.x + centerR * 0.6, spawn.y);
      this.devSpawnsGfx.moveTo(spawn.x, spawn.y - centerR * 0.6);
      this.devSpawnsGfx.lineTo(spawn.x, spawn.y + centerR * 0.6);
      this.devSpawnsGfx.strokePath();
    });
  },

  /**
   * Render overlay selection rings and anchor badges for map objects
   */
  renderDevObjectsOverlay() {
    if (!this.devOverlayGfx) return;
    this.devOverlayGfx.clear();
    if (!this.devModeEnabled) return;

    this.mapObjects.forEach(obj => {
      const isSelected = obj.id === this.selectedObjectId;
      const isHovered = obj.id === this.hoveredObjectId;

      const w = obj.w || 32;
      const h = obj.h || 32;
      const x = obj.x - w / 2;
      const y = obj.y - h / 2;

      if (isSelected) {
        this.devOverlayGfx.fillStyle(0xf59e0b, 0.25);
        this.devOverlayGfx.fillRect(x, y, w, h);
        this.devOverlayGfx.lineStyle(3, 0xf59e0b, 1);
        this.devOverlayGfx.strokeRect(x, y, w, h);

        // Center crosshair anchor
        this.devOverlayGfx.lineStyle(2, 0xffffff, 1);
        this.devOverlayGfx.strokeCircle(obj.x, obj.y, 6);
      } else if (isHovered && this.devModeSub === 'objects') {
        this.devOverlayGfx.lineStyle(2, 0x38bdf8, 1);
        this.devOverlayGfx.strokeRect(x, y, w, h);
      } else if (this.devModeSub === 'objects') {
        this.devOverlayGfx.lineStyle(1.5, 0xeab308, 0.6);
        this.devOverlayGfx.strokeRect(x, y, w, h);
      }
    });
  },

  /**
   * Render subtle tile grid overlay
   */
  renderDevGrid() {
    if (!this.devGridGfx) return;
    this.devGridGfx.clear();
    if (!this.devModeEnabled || !this.devShowGrid) return;

    const step = 32;
    this.devGridGfx.lineStyle(1, 0xffffff, 0.09);

    for (let x = 0; x <= this.mapWidth; x += step) {
      this.devGridGfx.moveTo(x, 0);
      this.devGridGfx.lineTo(x, this.mapHeight);
    }
    for (let y = 0; y <= this.mapHeight; y += step) {
      this.devGridGfx.moveTo(0, y);
      this.devGridGfx.lineTo(this.mapWidth, y);
    }
    this.devGridGfx.strokePath();
  },

  /**
   * Pointer Down handler for Developer Mode
   */
  handleDevPointerDown(pointer) {
    const wx = pointer.worldX;
    const wy = pointer.worldY;

    // Right-click: if stamping a palette prop, cancel stamp; otherwise free camera pan
    if (pointer.rightButtonDown()) {
      if (this.selectedPaletteAsset) {
        this.clearPaletteSelection();
        this.showDevToast('Selección cancelada', '❌');
        return;
      }
      this.cameras.main.stopFollow();
      this.devCameraPanning = true;
      this.devPanStart = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY
      };
      return;
    }

    if (pointer.middleButtonDown()) {
      this.cameras.main.stopFollow();
      this.devCameraPanning = true;
      this.devPanStart = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY
      };
      return;
    }

    if (!pointer.leftButtonDown()) return;

    // 1. HITBOX MODE
    if (this.devModeSub === 'hitbox') {
      // Check if clicking resize handles of currently selected hitbox (if not locked)
      if (this.selectedHitboxIndex >= 0 && this.selectedHitboxIndex < this.mapObstacles.length) {
        const obs = this.mapObstacles[this.selectedHitboxIndex];
        if (!obs.locked) {
          const tol = 14 / this.cameras.main.zoom;

          // 4 Corners:
          if (Math.hypot(wx - obs.x, wy - obs.y) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'nw';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - (obs.x + obs.w), wy - obs.y) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'ne';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - obs.x, wy - (obs.y + obs.h)) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'sw';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - (obs.x + obs.w), wy - (obs.y + obs.h)) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'se';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }

          // 4 Edges:
          if (Math.hypot(wx - (obs.x + obs.w / 2), wy - obs.y) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'n';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - (obs.x + obs.w), wy - (obs.y + obs.h / 2)) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'e';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - (obs.x + obs.w / 2), wy - (obs.y + obs.h)) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 's';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
          if (Math.hypot(wx - obs.x, wy - (obs.y + obs.h / 2)) <= tol) {
            this.isResizingHitbox = true;
            this.resizeCorner = 'w';
            this.dragStartData = { wx, wy, obs: { ...obs } };
            return;
          }
        }
      }

      // Check if clicking inside any existing hitbox (search backwards)
      let foundIndex = -1;
      for (let i = this.mapObstacles.length - 1; i >= 0; i--) {
        const obs = this.mapObstacles[i];
        if (wx >= obs.x && wx <= obs.x + obs.w && wy >= obs.y && wy <= obs.y + obs.h) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex >= 0) {
        this.selectHitbox(foundIndex);
        const obs = this.mapObstacles[foundIndex];
        if (!obs.locked) {
          this.isDraggingItem = true;
          this.dragStartData = {
            offsetX: wx - obs.x,
            offsetY: wy - obs.y
          };
        }
        return;
      }

      // If clicked on empty space with Shift: draw new hitbox
      if (pointer.event.shiftKey) {
        this.isDrawingHitbox = true;
        this.drawStartPoint = {
          x: this.snapCoord(wx, this.devGridSnap),
          y: this.snapCoord(wy, this.devGridSnap)
        };
        return;
      }

      // Empty space click: deselect
      this.clearDevSelection();
    }

    // 2. OBJECTS MODE
    else if (this.devModeSub === 'objects') {
      // If stamping a selected palette asset
      if (this.selectedPaletteAsset) {
        const snap = this.devGridSnap;
        const placeX = this.snapCoord(wx, snap);
        const placeY = this.snapCoord(wy, snap);

        const newProp = {
          id: `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: this.selectedPaletteAsset.key,
          assetKey: this.selectedPaletteAsset.key,
          name: this.selectedPaletteAsset.name,
          x: placeX,
          y: placeY,
          w: this.selectedPaletteAsset.w,
          h: this.selectedPaletteAsset.h,
          originX: 0.5,
          originY: 1.0
        };

        this.mapObjects.push(newProp);

        // Auto-create pixel-fitted hitbox if option enabled
        const chkAutoHitbox = document.getElementById('chk-auto-hitbox');
        if (!chkAutoHitbox || chkAutoHitbox.checked) {
          const fitHitbox = this.calculateFitHitbox(newProp);
          if (fitHitbox) {
            this.mapObstacles.push(fitHitbox);
            this.rebuildObstacleColliders();
            this.renderDevHitboxes();
            this.updateHitboxCountDOM();
          }
        }

        this.createMapObjects();
        this.renderDevObjectsOverlay();
        this.updateObjectCountDOM();
        this.populateQuickJumpDropdown();
        this.saveMapToStorage(true);

        this.showDevToast(`✓ Colocado: ${this.selectedPaletteAsset.name}`, '📌');
        return;
      }

      let foundId = null;
      for (let i = this.mapObjects.length - 1; i >= 0; i--) {
        const obj = this.mapObjects[i];
        const w = obj.w || 32;
        const h = obj.h || 32;
        // Origin is bottom center (0.5, 1.0)
        const ox = obj.originX !== undefined ? obj.originX : 0.5;
        const oy = obj.originY !== undefined ? obj.originY : 1.0;
        const left = obj.x - ox * w;
        const right = left + w;
        const top = obj.y - oy * h;
        const bottom = top + h;

        if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
          foundId = obj.id;
          break;
        }
      }

      if (foundId) {
        this.selectObject(foundId);
        const obj = this.mapObjects.find(o => o.id === foundId);
        this.isDraggingItem = true;
        this.dragStartData = {
          offsetX: wx - obj.x,
          offsetY: wy - obj.y
        };
        return;
      }

      // Empty space click: deselect
      this.clearDevSelection();
    }

    // 3. ENEMY SPAWNS MODE
    else if (this.devModeSub === 'spawns') {
      let foundSpawn = null;
      for (let i = this.enemySpawns.length - 1; i >= 0; i--) {
        const s = this.enemySpawns[i];
        const r = Math.max(s.radius || 48, 22);
        if (Math.hypot(wx - s.x, wy - s.y) <= r) {
          foundSpawn = s;
          break;
        }
      }

      if (foundSpawn) {
        this.selectSpawn(foundSpawn.id);
        this.isDraggingItem = true;
        this.dragStartData = {
          offsetX: wx - foundSpawn.x,
          offsetY: wy - foundSpawn.y
        };
        return;
      }

      // If clicked on empty space with Shift: create new spawn at pointer
      if (pointer.event.shiftKey) {
        this.addNewSpawn(this.snapCoord(wx, this.devGridSnap), this.snapCoord(wy, this.devGridSnap));
        return;
      }

      // Empty space click: deselect
      this.clearDevSelection();
    }
  },

  /**
   * Pointer Move handler for Developer Mode
   */
  handleDevPointerMove(pointer) {
    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const canvas = this.game.canvas;

    // Handle free camera drag panning
    if (this.devCameraPanning) {
      const dx = (pointer.x - this.devPanStart.x) / this.cameras.main.zoom;
      const dy = (pointer.y - this.devPanStart.y) / this.cameras.main.zoom;
      this.cameras.main.scrollX = this.devPanStart.scrollX - dx;
      this.cameras.main.scrollY = this.devPanStart.scrollY - dy;
      return;
    }

    // 1. Resizing Hitbox with 8 handles
    if (this.isResizingHitbox && this.selectedHitboxIndex >= 0 && this.dragStartData) {
      const obs = this.mapObstacles[this.selectedHitboxIndex];
      const initial = this.dragStartData.obs;
      const snap = this.devGridSnap;

      if (this.resizeCorner === 'se') {
        obs.w = Math.max(this.snapCoord(wx - initial.x, snap), 8);
        obs.h = Math.max(this.snapCoord(wy - initial.y, snap), 8);
      } else if (this.resizeCorner === 's') {
        obs.h = Math.max(this.snapCoord(wy - initial.y, snap), 8);
      } else if (this.resizeCorner === 'e') {
        obs.w = Math.max(this.snapCoord(wx - initial.x, snap), 8);
      } else if (this.resizeCorner === 'nw') {
        const right = initial.x + initial.w;
        const bottom = initial.y + initial.h;
        const newX = Math.min(this.snapCoord(wx, snap), right - 8);
        const newY = Math.min(this.snapCoord(wy, snap), bottom - 8);
        obs.x = newX;
        obs.y = newY;
        obs.w = right - newX;
        obs.h = bottom - newY;
      } else if (this.resizeCorner === 'n') {
        const bottom = initial.y + initial.h;
        const newY = Math.min(this.snapCoord(wy, snap), bottom - 8);
        obs.y = newY;
        obs.h = bottom - newY;
      } else if (this.resizeCorner === 'w') {
        const right = initial.x + initial.w;
        const newX = Math.min(this.snapCoord(wx, snap), right - 8);
        obs.x = newX;
        obs.w = right - newX;
      } else if (this.resizeCorner === 'ne') {
        const left = initial.x;
        const bottom = initial.y + initial.h;
        obs.y = Math.min(this.snapCoord(wy, snap), bottom - 8);
        obs.w = Math.max(this.snapCoord(wx - left, snap), 8);
        obs.h = bottom - obs.y;
      } else if (this.resizeCorner === 'sw') {
        const right = initial.x + initial.w;
        const top = initial.y;
        obs.x = Math.min(this.snapCoord(wx, snap), right - 8);
        obs.w = right - obs.x;
        obs.h = Math.max(this.snapCoord(wy - top, snap), 8);
      }

      this.updateDevInspectorDOM();
      return;
    }

    // 2. Dragging Hitbox, Object, or Spawn
    if (this.isDraggingItem && this.dragStartData) {
      if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
        const obs = this.mapObstacles[this.selectedHitboxIndex];
        if (!obs.locked) {
          const rawX = wx - this.dragStartData.offsetX;
          const rawY = wy - this.dragStartData.offsetY;
          obs.x = Phaser.Math.Clamp(this.snapCoord(rawX, this.devGridSnap), 0, this.mapWidth - obs.w);
          obs.y = Phaser.Math.Clamp(this.snapCoord(rawY, this.devGridSnap), 0, this.mapHeight - obs.h);
          this.updateDevInspectorDOM();
        }
      } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
        const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
        if (obj) {
          const rawX = wx - this.dragStartData.offsetX;
          const rawY = wy - this.dragStartData.offsetY;
          obj.x = Phaser.Math.Clamp(this.snapCoord(rawX, this.devGridSnap), 16, this.mapWidth - 16);
          obj.y = Phaser.Math.Clamp(this.snapCoord(rawY, this.devGridSnap), 16, this.mapHeight - 16);

          // Update sprite & glow position in real-time
          const entry = this.objectSpritesMap.get(obj.id);
          if (entry) {
            if (entry.sprite) {
              entry.sprite.setPosition(obj.x, obj.y);
              if (obj.type !== 'player_spawn' && obj.type !== 'enemy_spawn') {
                entry.sprite.setDepth(obj.y);
              }
            }
            if (entry.glow) {
              entry.glow.setPosition(obj.x, obj.type === 'fireplace' ? obj.y + 10 : obj.y);
            }
          }
          this.updateDevInspectorDOM();
        }
      } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
        const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
        if (s) {
          const rawX = wx - this.dragStartData.offsetX;
          const rawY = wy - this.dragStartData.offsetY;
          s.x = Phaser.Math.Clamp(this.snapCoord(rawX, this.devGridSnap), 32, this.mapWidth - 32);
          s.y = Phaser.Math.Clamp(this.snapCoord(rawY, this.devGridSnap), 32, this.mapHeight - 32);
          this.updateDevInspectorDOM();
        }
      }
      return;
    }

    // 3. Hover detection for cursor cues
    if (this.devModeSub === 'hitbox') {
      // Check handles first
      if (this.selectedHitboxIndex >= 0 && this.selectedHitboxIndex < this.mapObstacles.length) {
        const obs = this.mapObstacles[this.selectedHitboxIndex];
        if (obs.locked) {
          canvas.style.cursor = 'not-allowed';
          return;
        }
        const tol = 12 / this.cameras.main.zoom;

        // Corners
        if (Math.hypot(wx - obs.x, wy - obs.y) <= tol || Math.hypot(wx - (obs.x + obs.w), wy - (obs.y + obs.h)) <= tol) {
          canvas.style.cursor = 'nwse-resize';
          return;
        }
        if (Math.hypot(wx - (obs.x + obs.w), wy - obs.y) <= tol || Math.hypot(wx - obs.x, wy - (obs.y + obs.h)) <= tol) {
          canvas.style.cursor = 'nesw-resize';
          return;
        }

        // Edges
        if (Math.hypot(wx - (obs.x + obs.w / 2), wy - obs.y) <= tol || Math.hypot(wx - (obs.x + obs.w / 2), wy - (obs.y + obs.h)) <= tol) {
          canvas.style.cursor = 'ns-resize';
          return;
        }
        if (Math.hypot(wx - (obs.x + obs.w), wy - (obs.y + obs.h / 2)) <= tol || Math.hypot(wx - obs.x, wy - (obs.y + obs.h / 2)) <= tol) {
          canvas.style.cursor = 'ew-resize';
          return;
        }
      }

      // Check hitboxes
      let hovered = -1;
      for (let i = this.mapObstacles.length - 1; i >= 0; i--) {
        const obs = this.mapObstacles[i];
        if (wx >= obs.x && wx <= obs.x + obs.w && wy >= obs.y && wy <= obs.y + obs.h) {
          hovered = i;
          break;
        }
      }
      this.hoveredHitboxIndex = hovered;
      if (hovered >= 0) {
        const obs = this.mapObstacles[hovered];
        canvas.style.cursor = obs.locked ? 'not-allowed' : 'move';
      } else {
        canvas.style.cursor = pointer.event.shiftKey ? 'crosshair' : 'default';
      }

    } else if (this.devModeSub === 'objects') {
      // Ghost preview when stamping a palette asset
      if (this.selectedPaletteAsset) {
        canvas.style.cursor = 'crosshair';
        this.devOverlayGfx.clear();
        const snap = this.devGridSnap;
        const ghostX = this.snapCoord(wx, snap);
        const ghostY = this.snapCoord(wy, snap);

        const w = this.selectedPaletteAsset.w;
        const h = this.selectedPaletteAsset.h;
        const topLeftX = ghostX - 0.5 * w;
        const topLeftY = ghostY - 1.0 * h;

        // Draw bounding outline of prop
        this.devOverlayGfx.lineStyle(2, 0x38bdf8, 0.85);
        this.devOverlayGfx.strokeRect(topLeftX, topLeftY, w, h);
        this.devOverlayGfx.fillStyle(0x38bdf8, 0.16);
        this.devOverlayGfx.fillRect(topLeftX, topLeftY, w, h);

        // Foot anchor point
        this.devOverlayGfx.fillStyle(0xf59e0b, 0.9);
        this.devOverlayGfx.fillCircle(ghostX, ghostY, 4);

        // Show fitted hitbox preview in green if auto-hitbox is enabled
        const chkAutoHitbox = document.getElementById('chk-auto-hitbox');
        if (!chkAutoHitbox || chkAutoHitbox.checked) {
          const dummyProp = {
            type: this.selectedPaletteAsset.key,
            assetKey: this.selectedPaletteAsset.key,
            x: ghostX,
            y: ghostY,
            w: w,
            h: h,
            originX: 0.5,
            originY: 1.0
          };
          const fit = this.calculateFitHitbox(dummyProp);
          if (fit) {
            this.devOverlayGfx.lineStyle(2, 0x22c55e, 0.95);
            this.devOverlayGfx.strokeRect(fit.x, fit.y, fit.w, fit.h);
            this.devOverlayGfx.fillStyle(0x22c55e, 0.28);
            this.devOverlayGfx.fillRect(fit.x, fit.y, fit.w, fit.h);
          }
        }
        return;
      }

      let hoveredId = null;
      for (let i = this.mapObjects.length - 1; i >= 0; i--) {
        const obj = this.mapObjects[i];
        const w = obj.w || 32;
        const h = obj.h || 32;
        const ox = obj.originX !== undefined ? obj.originX : 0.5;
        const oy = obj.originY !== undefined ? obj.originY : 1.0;
        const left = obj.x - ox * w;
        const right = left + w;
        const top = obj.y - oy * h;
        const bottom = top + h;

        if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
          hoveredId = obj.id;
          break;
        }
      }
      this.hoveredObjectId = hoveredId;
      canvas.style.cursor = hoveredId ? 'move' : 'default';

    } else if (this.devModeSub === 'spawns') {
      let hoveredId = null;
      for (let i = this.enemySpawns.length - 1; i >= 0; i--) {
        const s = this.enemySpawns[i];
        const r = Math.max(s.radius || 48, 22);
        if (Math.hypot(wx - s.x, wy - s.y) <= r) {
          hoveredId = s.id;
          break;
        }
      }
      this.hoveredSpawnId = hoveredId;
      canvas.style.cursor = hoveredId ? 'move' : (pointer.event.shiftKey ? 'crosshair' : 'default');
    }
  },

  /**
   * Pointer Up handler for Developer Mode
   */
  handleDevPointerUp(pointer) {
    if (this.devCameraPanning) {
      this.devCameraPanning = false;
    }

    if (this.isDrawingHitbox && this.drawStartPoint) {
      const wx = this.snapCoord(pointer.worldX, this.devGridSnap);
      const wy = this.snapCoord(pointer.worldY, this.devGridSnap);
      const x = Math.min(this.drawStartPoint.x, wx);
      const y = Math.min(this.drawStartPoint.y, wy);
      const w = Math.max(Math.abs(wx - this.drawStartPoint.x), 8);
      const h = Math.max(Math.abs(wy - this.drawStartPoint.y), 8);

      if (w >= 8 && h >= 8) {
        this.mapObstacles.push({ x, y, w, h, type: 'solid' });
        this.selectHitbox(this.mapObstacles.length - 1);
        this.rebuildObstacleColliders();
        this.updateHitboxCountDOM();
        this.populateQuickJumpDropdown();
        this.showDevToast('Hitbox creada', '🧱');
      }

      this.isDrawingHitbox = false;
      this.drawStartPoint = null;
    }

    if (this.isResizingHitbox || this.isDraggingItem) {
      this.isResizingHitbox = false;
      this.resizeCorner = null;
      this.isDraggingItem = false;
      this.dragStartData = null;

      if (this.devModeSub === 'hitbox') {
        this.rebuildObstacleColliders();
      } else if (this.devModeSub === 'spawns') {
        this.populateQuickJumpDropdown();
      }
      this.saveMapToStorage(true);
    }
  },

  /**
   * Mouse Wheel zoom in Developer Mode
   */
  handleDevWheel(pointer, deltaY) {
    const curZoom = this.cameras.main.zoom;
    const factor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Phaser.Math.Clamp(curZoom * factor, 0.6, 2.2);
    this.cameras.main.setZoom(newZoom);
  }
});
