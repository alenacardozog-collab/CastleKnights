'use strict';
/* Developer mode: selection, add/duplicate/delete, save/export/import and the inspector panel. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Select a hitbox by index and display inspector
   */
  selectHitbox(index) {
    this.selectedHitboxIndex = index;
    this.selectedObjectId = null;
    this.selectedSpawnId = null;
    this.updateDevInspectorDOM();
  },

  /**
   * Select a map object by ID and display inspector
   */
  selectObject(id) {
    this.selectedObjectId = id;
    this.selectedHitboxIndex = -1;
    this.selectedSpawnId = null;
    this.updateDevInspectorDOM();
  },

  /**
   * Select an enemy spawn by ID and display inspector
   */
  selectSpawn(id) {
    this.selectedSpawnId = id;
    this.selectedHitboxIndex = -1;
    this.selectedObjectId = null;
    this.updateDevInspectorDOM();
  },

  /**
   * Clear current selection and hide inspector
   */
  clearDevSelection() {
    this.selectedHitboxIndex = -1;
    this.selectedObjectId = null;
    this.selectedSpawnId = null;
    const inspector = document.getElementById('dev-inspector');
    if (inspector) inspector.classList.add('hidden');
  },

  /**
   * Add a new hitbox at camera center
   */
  addNewHitbox(x, y, w, h, type = 'solid') {
    const cx = x !== undefined ? x : this.snapCoord(this.cameras.main.midPoint.x - 32, this.devGridSnap);
    const cy = y !== undefined ? y : this.snapCoord(this.cameras.main.midPoint.y - 32, this.devGridSnap);
    const width = w || 64;
    const height = h || 64;

    this.mapObstacles.push({ x: cx, y: cy, w: width, h: height, type });
    this.selectHitbox(this.mapObstacles.length - 1);
    this.rebuildObstacleColliders();
    this.updateHitboxCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast('Nueva hitbox añadida', '🧱');
  },

  /**
   * Duplicate currently selected hitbox
   */
  duplicateSelectedHitbox() {
    if (this.selectedHitboxIndex < 0 || this.selectedHitboxIndex >= this.mapObstacles.length) return;
    const src = this.mapObstacles[this.selectedHitboxIndex];
    const offset = this.devGridSnap > 0 ? this.devGridSnap : 32;
    const copy = {
      x: Phaser.Math.Clamp(src.x + offset, 0, this.mapWidth - src.w),
      y: Phaser.Math.Clamp(src.y + offset, 0, this.mapHeight - src.h),
      w: src.w,
      h: src.h,
      type: src.type || 'solid',
      locked: false
    };
    this.mapObstacles.push(copy);
    this.selectHitbox(this.mapObstacles.length - 1);
    this.rebuildObstacleColliders();
    this.updateHitboxCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast('Hitbox duplicada', '📄');
  },

  /**
   * Delete currently selected hitbox
   */
  deleteSelectedHitbox() {
    if (this.selectedHitboxIndex < 0 || this.selectedHitboxIndex >= this.mapObstacles.length) return;
    this.mapObstacles.splice(this.selectedHitboxIndex, 1);
    this.clearDevSelection();
    this.rebuildObstacleColliders();
    this.updateHitboxCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast('Hitbox eliminada', '🗑️');
  },

  /**
   * Add a new enemy spawn point at given position or camera center
   */
  addNewSpawn(x, y) {
    const cx = x !== undefined ? x : this.snapCoord(this.cameras.main.midPoint.x, this.devGridSnap);
    const cy = y !== undefined ? y : this.snapCoord(this.cameras.main.midPoint.y, this.devGridSnap);
    const id = `spawn_${Date.now()}`;
    const newSpawn = {
      id,
      name: `Spawn #${this.enemySpawns.length + 1}`,
      x: cx,
      y: cy,
      enemyType: 'clash',
      minWave: 1,
      radius: 48,
      active: true
    };
    this.enemySpawns.push(newSpawn);
    this.selectSpawn(id);
    this.updateSpawnCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast(`Nuevo punto de spawn creado`, '🚩');
  },

  /**
   * Duplicate currently selected spawn point
   */
  duplicateSelectedSpawn() {
    if (!this.selectedSpawnId) return;
    const src = this.enemySpawns.find(s => s.id === this.selectedSpawnId);
    if (!src) return;
    const offset = this.devGridSnap > 0 ? this.devGridSnap : 32;
    const copy = {
      ...src,
      id: `spawn_${Date.now()}`,
      name: `${src.name} (Copia)`,
      x: Phaser.Math.Clamp(src.x + offset, 32, this.mapWidth - 32),
      y: Phaser.Math.Clamp(src.y + offset, 32, this.mapHeight - 32)
    };
    this.enemySpawns.push(copy);
    this.selectSpawn(copy.id);
    this.updateSpawnCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast('Punto de spawn duplicado', '📄');
  },

  /**
   * Delete currently selected spawn point
   */
  deleteSelectedSpawn() {
    if (!this.selectedSpawnId) return;
    const idx = this.enemySpawns.findIndex(s => s.id === this.selectedSpawnId);
    if (idx < 0) return;
    const removed = this.enemySpawns.splice(idx, 1)[0];
    this.clearDevSelection();
    this.updateSpawnCountDOM();
    this.populateQuickJumpDropdown();
    this.saveMapToStorage(true);
    this.showDevToast(`Spawn "${removed.name}" eliminado`, '🗑️');
  },

  /**
   * Test instant enemy summon at a spawn point
   */
  testSpawnEnemyAt(spawnPoint) {
    if (!spawnPoint) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (spawnPoint.radius || 0);
    const ex = Phaser.Math.Clamp(spawnPoint.x + Math.cos(angle) * dist, 32, this.mapWidth - 32);
    const ey = Phaser.Math.Clamp(spawnPoint.y + Math.sin(angle) * dist, 32, this.mapHeight - 32);

    this.spawnEnemy(ex, ey, spawnPoint.enemyType);
    this.createFloatingText(ex, ey - 35, `¡INVOCADO: ${spawnPoint.name}!`, 0xf59e0b);
    if (this.soundManager) this.soundManager.playAlertChime();

    const ring = this.add.circle(ex, ey, 24, 0xef4444, 0.6).setDepth(25);
    this.tweens.add({
      targets: ring,
      scale: 2.5,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy()
    });
    this.showDevToast(`Enemigo invocado en "${spawnPoint.name}"`, '⚔️');
  },

  /**
   * Add a new map object from catalog
   */
  addNewObject(type, name, w, h) {
    const id = `${type}_${Date.now()}`;
    const cx = this.snapCoord(this.cameras.main.midPoint.x, this.devGridSnap);
    const cy = this.snapCoord(this.cameras.main.midPoint.y, this.devGridSnap);

    const newObj = {
      id,
      type,
      name: name || type,
      x: cx,
      y: cy,
      w: w || 32,
      h: h || 32
    };

    this.mapObjects.push(newObj);
    this.createMapObjects();
    this.selectObject(id);
    this.saveMapToStorage(true);
    this.showDevToast(`Objeto "${newObj.name}" añadido`, '📦');
  },

  /**
   * Duplicate currently selected object
   */
  duplicateSelectedObject() {
    if (!this.selectedObjectId) return;
    const src = this.mapObjects.find(o => o.id === this.selectedObjectId);
    if (!src) return;

    const offset = this.devGridSnap > 0 ? this.devGridSnap : 32;
    const copy = {
      ...src,
      id: `${src.type}_${Date.now()}`,
      name: `${src.name} (Copia)`,
      x: Phaser.Math.Clamp(src.x + offset, 16, this.mapWidth - 16),
      y: Phaser.Math.Clamp(src.y + offset, 16, this.mapHeight - 16)
    };

    this.mapObjects.push(copy);
    this.createMapObjects();
    this.selectObject(copy.id);
    this.saveMapToStorage(true);
    this.showDevToast('Objeto duplicado', '📄');
  },

  /**
   * Delete currently selected object
   */
  deleteSelectedObject() {
    if (!this.selectedObjectId) return;
    const idx = this.mapObjects.findIndex(o => o.id === this.selectedObjectId);
    if (idx < 0) return;

    const removed = this.mapObjects.splice(idx, 1)[0];
    const entry = this.objectSpritesMap.get(this.selectedObjectId);
    if (entry) {
      if (entry.sprite) entry.sprite.destroy();
      if (entry.glow) entry.glow.destroy();
      this.objectSpritesMap.delete(this.selectedObjectId);
    }

    this.clearDevSelection();
    this.updateObjectCountDOM();
    this.saveMapToStorage(true);
    this.showDevToast(`Objeto "${removed.name}" eliminado`, '🗑️');
  },

  /**
   * Delete either selected hitbox or selected object
   */
  /**
   * Delete either selected hitbox, spawn, or selected object
   */
  deleteSelectedItem() {
    if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
      this.deleteSelectedHitbox();
    } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
      this.deleteSelectedSpawn();
    } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
      this.deleteSelectedObject();
    }
  },

  /**
   * Nudge selected element with keyboard arrows
   */
  nudgeSelectedItem(direction) {
    const step = this.devGridSnap > 0 ? this.devGridSnap : 8;
    let dx = 0;
    let dy = 0;
    if (direction === 'LEFT') dx = -step;
    if (direction === 'RIGHT') dx = step;
    if (direction === 'UP') dy = -step;
    if (direction === 'DOWN') dy = step;

    if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
      const obs = this.mapObstacles[this.selectedHitboxIndex];
      if (!obs.locked) {
        obs.x = Phaser.Math.Clamp(obs.x + dx, 0, this.mapWidth - obs.w);
        obs.y = Phaser.Math.Clamp(obs.y + dy, 0, this.mapHeight - obs.h);
        this.updateDevInspectorDOM();
        this.rebuildObstacleColliders();
        this.saveMapToStorage(true);
      }
    } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
      const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
      if (s) {
        s.x = Phaser.Math.Clamp(s.x + dx, 32, this.mapWidth - 32);
        s.y = Phaser.Math.Clamp(s.y + dy, 32, this.mapHeight - 32);
        this.updateDevInspectorDOM();
        this.saveMapToStorage(true);
      }
    } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
      const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
      if (obj) {
        obj.x = Phaser.Math.Clamp(obj.x + dx, 16, this.mapWidth - 16);
        obj.y = Phaser.Math.Clamp(obj.y + dy, 16, this.mapHeight - 16);
        const entry = this.objectSpritesMap.get(obj.id);
        if (entry) {
          if (entry.sprite) entry.sprite.setPosition(obj.x, obj.y);
          if (entry.glow) entry.glow.setPosition(obj.x, obj.type === 'fireplace' ? obj.y + 10 : obj.y);
        }
        this.updateDevInspectorDOM();
        this.saveMapToStorage(true);
      }
    }
  },

  updateSpawnCountDOM() {
    const el = document.getElementById('dev-spawn-count');
    if (el) el.textContent = (this.enemySpawns || []).length;
  },

  /**
   * Populate Quick Jump navigation select dropdown with grouped elements
   */
  populateQuickJumpDropdown() {
    const select = document.getElementById('dev-quick-jump');
    if (!select) return;

    const curVal = select.value;
    select.innerHTML = '<option value="">Ir a elemento...</option>';

    // Group 1: Hitboxes
    if (this.mapObstacles && this.mapObstacles.length > 0) {
      const grpHitbox = document.createElement('optgroup');
      grpHitbox.label = `🧱 Hitboxes (${this.mapObstacles.length})`;
      this.mapObstacles.forEach((obs, idx) => {
        const opt = document.createElement('option');
        opt.value = `hitbox_${idx}`;
        const typeStr = (obs.type || 'solid').toUpperCase();
        opt.textContent = `#${idx + 1} [${typeStr}] ${obs.w}x${obs.h} en (${obs.x},${obs.y})`;
        grpHitbox.appendChild(opt);
      });
      select.appendChild(grpHitbox);
    }

    // Group 2: Map Objects
    if (this.mapObjects && this.mapObjects.length > 0) {
      const grpObj = document.createElement('optgroup');
      grpObj.label = `📦 Objetos (${this.mapObjects.length})`;
      this.mapObjects.forEach(obj => {
        const opt = document.createElement('option');
        opt.value = `obj_${obj.id}`;
        opt.textContent = `${obj.name || obj.type} en (${obj.x},${obj.y})`;
        grpObj.appendChild(opt);
      });
      select.appendChild(grpObj);
    }

    // Group 3: Enemy Spawns
    if (this.enemySpawns && this.enemySpawns.length > 0) {
      const grpSpawns = document.createElement('optgroup');
      grpSpawns.label = `🚩 Spawns Enemigos (${this.enemySpawns.length})`;
      this.enemySpawns.forEach(s => {
        const opt = document.createElement('option');
        opt.value = `spawn_${s.id}`;
        const status = s.active !== false ? 'Activo' : 'Inactivo';
        opt.textContent = `${s.name} [Ola ${s.minWave || 1}+, ${status}]`;
        grpSpawns.appendChild(opt);
      });
      select.appendChild(grpSpawns);
    }

    select.value = curVal || '';
  },

  /**
   * Persist current obstacles, objects, and spawns to browser LocalStorage
   */
  saveMapToStorage(silent = false) {
    try {
      const data = {
        version: 2,
        savedAt: new Date().toISOString(),
        obstacles: this.mapObstacles,
        objects: this.mapObjects,
        enemySpawns: this.enemySpawns
      };
      localStorage.setItem(MAP_CONFIG_STORAGE_KEY, JSON.stringify(data));
      if (!silent) {
        this.showDevToast('¡Mapa guardado en LocalStorage!', '💾');
      }
    } catch (e) {
      console.error('Error saving map to localStorage:', e);
      if (!silent) {
        this.showDevToast('Error al guardar en almacenamiento local', '⚠️');
      }
    }
  },

  /**
   * Reset obstacles, objects, and spawns to default factory map
   */
  resetMapToDefaults() {
    if (!confirm('¿Estás seguro de restablecer todas las hitboxes, objetos y spawns a los valores originales por defecto?')) {
      return;
    }
    localStorage.removeItem(MAP_CONFIG_STORAGE_KEY);
    this.mapObstacles = JSON.parse(JSON.stringify(DEFAULT_MAP_OBSTACLES));
    this.mapObjects = JSON.parse(JSON.stringify(DEFAULT_MAP_OBJECTS));
    this.enemySpawns = JSON.parse(JSON.stringify(DEFAULT_ENEMY_SPAWNS));
    MAP_OBSTACLES = this.mapObstacles;

    this.createMapObjects();
    this.rebuildObstacleColliders();
    this.clearDevSelection();
    this.updateHitboxCountDOM();
    this.updateObjectCountDOM();
    this.updateSpawnCountDOM();
    this.populateQuickJumpDropdown();
    this.showDevToast('Mapa restablecido a solo terreno sin hitboxes', '🌱');
  },

  /**
   * Open the Export/Import modal and generate clean JS/JSON code
   */
  openDevExportModal() {
    const modal = document.getElementById('dev-export-modal');
    const textarea = document.getElementById('dev-export-textarea');
    if (!modal || !textarea) return;

    modal.classList.add('active');
    this.updateExportTextareaContent();
  },

  /**
   * Populate export modal textarea based on selected format
   */
  updateExportTextareaContent() {
    const textarea = document.getElementById('dev-export-textarea');
    const tabJs = document.getElementById('dev-tab-exp-js');
    if (!textarea) return;

    const isJs = tabJs ? tabJs.classList.contains('active') : true;

    if (isJs) {
      const jsCode = `// ==========================================
// TAVERN SIEGE - MAP CONFIGURATION EXPORT
// Copia y pega en js/config/map_catalog.js para hacer fijos tus cambios
// ==========================================
const MAP_OBSTACLES = ${JSON.stringify(this.mapObstacles, null, 2)};

const MAP_OBJECTS = ${JSON.stringify(this.mapObjects, null, 2)};

const DEFAULT_ENEMY_SPAWNS = ${JSON.stringify(this.enemySpawns, null, 2)};
`;
      textarea.value = jsCode;
    } else {
      const data = {
        obstacles: this.mapObstacles,
        objects: this.mapObjects,
        enemySpawns: this.enemySpawns
      };
      textarea.value = JSON.stringify(data, null, 2);
    }
  },

  /**
   * Parse and apply JSON text config to current map
   */
  applyImportedConfig(rawText) {
    try {
      let parsed = null;
      // If user pasted JS with const MAP_OBSTACLES = ..., extract JSON blocks
      if (rawText.includes('MAP_OBSTACLES')) {
        const obsMatch = rawText.match(/MAP_OBSTACLES\s*=\s*(\[[\s\S]*?\]);/);
        const objMatch = rawText.match(/MAP_OBJECTS\s*=\s*(\[[\s\S]*?\]);/);
        const spawnMatch = rawText.match(/DEFAULT_ENEMY_SPAWNS\s*=\s*(\[[\s\S]*?\]);/);
        parsed = {
          obstacles: obsMatch ? JSON.parse(obsMatch[1]) : this.mapObstacles,
          objects: objMatch ? JSON.parse(objMatch[1]) : this.mapObjects,
          enemySpawns: spawnMatch ? JSON.parse(spawnMatch[1]) : this.enemySpawns
        };
      } else {
        parsed = JSON.parse(rawText);
      }

      if (parsed && Array.isArray(parsed.obstacles)) {
        this.mapObstacles = parsed.obstacles;
        if (Array.isArray(parsed.objects)) {
          this.mapObjects = parsed.objects;
        }
        if (Array.isArray(parsed.enemySpawns)) {
          this.enemySpawns = parsed.enemySpawns;
        }
        MAP_OBSTACLES = this.mapObstacles;

        this.createMapObjects();
        this.rebuildObstacleColliders();
        this.saveMapToStorage(true);
        this.clearDevSelection();
        this.updateHitboxCountDOM();
        this.updateObjectCountDOM();
        this.updateSpawnCountDOM();
        this.populateQuickJumpDropdown();

        const modal = document.getElementById('dev-export-modal');
        if (modal) modal.classList.remove('active');

        this.showDevToast('¡Configuración importada y aplicada exitosamente!', '✅');
      } else {
        alert('Formato JSON inválido: debe contener un array "obstacles".');
      }
    } catch (err) {
      alert('Error al analizar la configuración importada: ' + err.message);
    }
  },

  /**
   * Trigger download of map_config.json file
   */
  downloadJsonFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showDevToast('Descarga iniciada: ' + filename, '📥');
  },

  /**
   * Show rustic floating toast notification
   */
  showDevToast(message, icon = '💡') {
    const toast = document.getElementById('dev-toast');
    const msgEl = document.getElementById('dev-toast-msg');
    const iconEl = document.getElementById('dev-toast-icon');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    if (iconEl) {
      // Toasts are called with an emoji; show the matching pixel icon instead
      const map = { '💾': 'save', '📤': 'upload', '📥': 'download', '📋': 'copy', '🗑️': 'trash', '🔄': 'retry', '🎲': 'dice', '🎯': 'target', '📦': 'box', '🧱': 'bricks', '🚩': 'flag', '🔒': 'lock', '🔓': 'unlock', '⚠️': 'bolt', '✅': 'check', '❌': 'close', '📄': 'copy', '📐': 'ruler' };
      iconEl.innerHTML = '<img src="assets/UI/pix/' + (map[icon] || 'check') + '.png" class="px-ico" alt="">';
    }
    toast.classList.remove('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  },

  /**
   * Synchronize DOM Inspector card with selected element
   */
  updateDevInspectorDOM() {
    const inspector = document.getElementById('dev-inspector');
    if (!inspector) return;

    const rowW = document.getElementById('dev-row-w');
    const rowH = document.getElementById('dev-row-h');
    const rowName = document.getElementById('dev-row-name');
    const hitboxOptions = document.getElementById('dev-hitbox-options');
    const spawnFields = document.getElementById('dev-spawn-fields');

    if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0 && this.selectedHitboxIndex < this.mapObstacles.length) {
      const obs = this.mapObstacles[this.selectedHitboxIndex];
      inspector.classList.remove('hidden');

      const typeStr = (obs.type || 'solid').toUpperCase();
      document.getElementById('dev-inspector-title').textContent = `HITBOX #${this.selectedHitboxIndex + 1} [${typeStr}]`;
      document.getElementById('inp-dev-x').value = obs.x;
      document.getElementById('inp-dev-y').value = obs.y;
      document.getElementById('inp-dev-w').value = obs.w;
      document.getElementById('inp-dev-h').value = obs.h;

      if (rowW) rowW.classList.remove('hidden');
      if (rowH) rowH.classList.remove('hidden');
      if (rowName) rowName.classList.add('hidden');
      if (hitboxOptions) hitboxOptions.classList.remove('hidden');
      if (spawnFields) spawnFields.classList.add('hidden');

      const inpHitboxType = document.getElementById('inp-dev-hitbox-type');
      if (inpHitboxType) inpHitboxType.value = obs.type || 'solid';

      const lockIcon = document.getElementById('dev-lock-icon');
      if (lockIcon) lockIcon.innerHTML = obs.locked ? '<img src="assets/UI/pix/lock.png" class="px-ico" alt="">' : '<img src="assets/UI/pix/unlock.png" class="px-ico" alt="">';
      const btnLock = document.getElementById('dev-btn-lock');
      if (btnLock) btnLock.classList.toggle('active', !!obs.locked);

    } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
      const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
      if (!obj) {
        inspector.classList.add('hidden');
        return;
      }

      inspector.classList.remove('hidden');
      document.getElementById('dev-inspector-title').textContent = `OBJETO: ${obj.name}`;
      document.getElementById('inp-dev-x').value = obj.x;
      document.getElementById('inp-dev-y').value = obj.y;
      document.getElementById('inp-dev-name').value = obj.name;

      if (obj.w !== undefined) {
        document.getElementById('inp-dev-w').value = obj.w;
        if (rowW) rowW.classList.remove('hidden');
      } else {
        if (rowW) rowW.classList.add('hidden');
      }

      if (obj.h !== undefined) {
        document.getElementById('inp-dev-h').value = obj.h;
        if (rowH) rowH.classList.remove('hidden');
      } else {
        if (rowH) rowH.classList.add('hidden');
      }

      if (rowName) rowName.classList.remove('hidden');
      if (hitboxOptions) hitboxOptions.classList.add('hidden');
      if (spawnFields) spawnFields.classList.add('hidden');

    } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
      const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
      if (!s) {
        inspector.classList.add('hidden');
        return;
      }

      inspector.classList.remove('hidden');
      document.getElementById('dev-inspector-title').textContent = `SPAWN: ${s.name}`;
      document.getElementById('inp-dev-x').value = s.x;
      document.getElementById('inp-dev-y').value = s.y;
      document.getElementById('inp-dev-name').value = s.name;

      if (rowW) rowW.classList.add('hidden');
      if (rowH) rowH.classList.add('hidden');
      if (rowName) rowName.classList.remove('hidden');
      if (hitboxOptions) hitboxOptions.classList.add('hidden');
      if (spawnFields) spawnFields.classList.remove('hidden');

      const inpEnemy = document.getElementById('inp-dev-spawn-enemy');
      if (inpEnemy) inpEnemy.value = s.enemyType || 'clash';

      const inpWave = document.getElementById('inp-dev-spawn-wave');
      if (inpWave) inpWave.value = String(s.minWave || 1);

      const inpRadius = document.getElementById('inp-dev-spawn-radius');
      if (inpRadius) inpRadius.value = String(s.radius !== undefined ? s.radius : 48);

      const btnActive = document.getElementById('dev-btn-spawn-active');
      if (btnActive) {
        const isActive = s.active !== false;
        btnActive.innerHTML = isActive ? '<span>🟢</span> ACTIVO (GENERANDO)' : '<span>🔴</span> INACTIVO (PAUSADO)';
        btnActive.className = isActive ? 'dev-btn dev-btn-save dev-btn-full' : 'dev-btn dev-btn-danger dev-btn-full';
      }

    } else {
      inspector.classList.add('hidden');
    }
  },

  updateHitboxCountDOM() {
    const el = document.getElementById('dev-hitbox-count');
    if (el) el.textContent = this.mapObstacles.length;
  },

  updateObjectCountDOM() {
    const el = document.getElementById('dev-object-count');
    if (el) el.textContent = this.mapObjects.length;
  },

  /**
   * Wire DOM buttons and inputs for Developer Mode
   */
  bindDevModeDOMElements() {
    // 1. Dev Mode Toggle Buttons
    const btnDevToggle = document.getElementById('btn-dev-toggle');
    const btnDevClose = document.getElementById('dev-btn-close');
    if (btnDevToggle) btnDevToggle.onclick = () => this.toggleDevMode();
    if (btnDevClose) btnDevClose.onclick = () => this.toggleDevMode();

    // 2. Sub-mode Tabs
    const tabHitbox = document.getElementById('dev-tab-hitbox');
    const tabObjects = document.getElementById('dev-tab-objects');
    const tabSpawns = document.getElementById('dev-tab-spawns');
    if (tabHitbox) tabHitbox.onclick = () => this.setDevModeSub('hitbox');
    if (tabObjects) tabObjects.onclick = () => this.setDevModeSub('objects');
    if (tabSpawns) tabSpawns.onclick = () => this.setDevModeSub('spawns');

    // Quick Jump dropdown selector
    const quickJump = document.getElementById('dev-quick-jump');
    if (quickJump) {
      quickJump.onchange = (e) => {
        const val = e.target.value;
        if (!val) return;
        if (val.startsWith('hitbox_')) {
          const idx = parseInt(val.replace('hitbox_', ''), 10);
          if (idx >= 0 && idx < this.mapObstacles.length) {
            this.setDevModeSub('hitbox');
            this.selectHitbox(idx);
            const obs = this.mapObstacles[idx];
            this.cameras.main.pan(obs.x + obs.w / 2, obs.y + obs.h / 2, 350, 'Power2');
          }
        } else if (val.startsWith('obj_')) {
          const id = val.replace('obj_', '');
          const obj = this.mapObjects.find(o => o.id === id);
          if (obj) {
            this.setDevModeSub('objects');
            this.selectObject(id);
            this.cameras.main.pan(obj.x, obj.y, 350, 'Power2');
          }
        } else if (val.startsWith('spawn_')) {
          const id = val.replace('spawn_', '');
          const s = this.enemySpawns.find(sp => sp.id === id);
          if (s) {
            this.setDevModeSub('spawns');
            this.selectSpawn(id);
            this.cameras.main.pan(s.x, s.y, 350, 'Power2');
          }
        }
      };
    }

    // 3. Grid Snap Selector
    const selectSnap = document.getElementById('dev-grid-snap');
    if (selectSnap) {
      selectSnap.onchange = (e) => {
        this.devGridSnap = parseInt(e.target.value, 10);
      };
    }

    // 4. Toggle Grid & Pause
    const btnToggleGrid = document.getElementById('dev-btn-toggle-grid');
    const btnTogglePause = document.getElementById('dev-btn-toggle-pause');
    if (btnToggleGrid) btnToggleGrid.onclick = () => this.toggleDevGrid();
    if (btnTogglePause) btnTogglePause.onclick = () => this.toggleDevAiPause();

    // 5. Add Button
    const btnAdd = document.getElementById('dev-btn-add');
    if (btnAdd) {
      btnAdd.onclick = () => {
        if (this.devModeSub === 'hitbox') {
          this.addNewHitbox();
        } else if (this.devModeSub === 'spawns') {
          this.addNewSpawn();
        } else {
          const catModal = document.getElementById('dev-catalog-modal');
          if (catModal) catModal.classList.add('active');
        }
      };
    }

    // Catalog Modal close & items
    const catClose = document.getElementById('dev-catalog-close');
    if (catClose) {
      catClose.onclick = () => {
        document.getElementById('dev-catalog-modal').classList.remove('active');
      };
    }

    document.querySelectorAll('.catalog-item').forEach(item => {
      item.onclick = () => {
        const type = item.getAttribute('data-type');
        const name = item.getAttribute('data-name');
        const w = parseInt(item.getAttribute('data-w') || '32', 10);
        const h = parseInt(item.getAttribute('data-h') || '32', 10);
        this.addNewObject(type, name, w, h);
        document.getElementById('dev-catalog-modal').classList.remove('active');
      };
    });

    // 6. Save, Export, Reset Buttons
    const btnSave = document.getElementById('dev-btn-save');
    const btnExport = document.getElementById('dev-btn-export');
    const btnReset = document.getElementById('dev-btn-reset');
    if (btnSave) btnSave.onclick = () => this.saveMapToStorage();
    if (btnExport) btnExport.onclick = () => this.openDevExportModal();
    if (btnReset) btnReset.onclick = () => this.resetMapToDefaults();

    // Export Modal Controls
    const expClose = document.getElementById('dev-export-close');
    const tabExpJs = document.getElementById('dev-tab-exp-js');
    const tabExpJson = document.getElementById('dev-tab-exp-json');
    const btnCopyCode = document.getElementById('dev-btn-copy-code');
    const btnDownloadJson = document.getElementById('dev-btn-download-json');
    const btnApplyImport = document.getElementById('dev-btn-apply-import');

    if (expClose) {
      expClose.onclick = () => {
        document.getElementById('dev-export-modal').classList.remove('active');
      };
    }
    if (tabExpJs) {
      tabExpJs.onclick = () => {
        tabExpJs.classList.add('active');
        if (tabExpJson) tabExpJson.classList.remove('active');
        this.updateExportTextareaContent();
      };
    }
    if (tabExpJson) {
      tabExpJson.onclick = () => {
        tabExpJson.classList.add('active');
        if (tabExpJs) tabExpJs.classList.remove('active');
        this.updateExportTextareaContent();
      };
    }
    if (btnCopyCode) {
      btnCopyCode.onclick = () => {
        const textarea = document.getElementById('dev-export-textarea');
        if (textarea) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            this.showDevToast('¡Copiado al portapapeles!', '📋');
          }).catch(() => {
            textarea.select();
            document.execCommand('copy');
            this.showDevToast('¡Copiado al portapapeles!', '📋');
          });
        }
      };
    }
    if (btnDownloadJson) {
      btnDownloadJson.onclick = () => {
        const data = {
          obstacles: this.mapObstacles,
          objects: this.mapObjects,
          enemySpawns: this.enemySpawns
        };
        this.downloadJsonFile('tavern_map_config.json', JSON.stringify(data, null, 2));
      };
    }
    if (btnApplyImport) {
      btnApplyImport.onclick = () => {
        const textarea = document.getElementById('dev-export-textarea');
        if (textarea && textarea.value.trim()) {
          this.applyImportedConfig(textarea.value);
        }
      };
    }

    // 7. Inspector Panel Controls
    const inspectorClose = document.getElementById('dev-inspector-close');
    const btnDuplicate = document.getElementById('dev-btn-duplicate');
    const btnDelete = document.getElementById('dev-btn-delete');

    if (inspectorClose) inspectorClose.onclick = () => this.clearDevSelection();
    if (btnDuplicate) {
      btnDuplicate.onclick = () => {
        if (this.devModeSub === 'hitbox') this.duplicateSelectedHitbox();
        else if (this.devModeSub === 'spawns') this.duplicateSelectedSpawn();
        else this.duplicateSelectedObject();
      };
    }
    if (btnDelete) {
      btnDelete.onclick = () => this.deleteSelectedItem();
    }

    // Hitbox Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          const w = parseInt(btn.getAttribute('data-w'), 10);
          const h = parseInt(btn.getAttribute('data-h'), 10);
          obs.w = w;
          obs.h = h;
          obs.x = Phaser.Math.Clamp(obs.x, 0, this.mapWidth - obs.w);
          obs.y = Phaser.Math.Clamp(obs.y, 0, this.mapHeight - obs.h);
          this.updateDevInspectorDOM();
          this.rebuildObstacleColliders();
          this.populateQuickJumpDropdown();
          this.saveMapToStorage(true);
          this.showDevToast(`Dimensiones fijadas a ${w}x${h}`, '📐');
        }
      };
    });

    // Flip W/H button
    const btnFlip = document.getElementById('dev-btn-flip-wh');
    if (btnFlip) {
      btnFlip.onclick = () => {
        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          const tmp = obs.w;
          obs.w = obs.h;
          obs.h = tmp;
          obs.x = Phaser.Math.Clamp(obs.x, 0, this.mapWidth - obs.w);
          obs.y = Phaser.Math.Clamp(obs.y, 0, this.mapHeight - obs.h);
          this.updateDevInspectorDOM();
          this.rebuildObstacleColliders();
          this.populateQuickJumpDropdown();
          this.saveMapToStorage(true);
          this.showDevToast(`Hitbox invertida: ${obs.w}x${obs.h}`, '🔄');
        }
      };
    }

    // Align 32 button
    const btnAlign = document.getElementById('dev-btn-align-tile');
    if (btnAlign) {
      btnAlign.onclick = () => {
        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          obs.x = Math.round(obs.x / 32) * 32;
          obs.y = Math.round(obs.y / 32) * 32;
          obs.w = Math.max(32, Math.round(obs.w / 32) * 32);
          obs.h = Math.max(32, Math.round(obs.h / 32) * 32);
          obs.x = Phaser.Math.Clamp(obs.x, 0, this.mapWidth - obs.w);
          obs.y = Phaser.Math.Clamp(obs.y, 0, this.mapHeight - obs.h);
          this.updateDevInspectorDOM();
          this.rebuildObstacleColliders();
          this.populateQuickJumpDropdown();
          this.saveMapToStorage(true);
          this.showDevToast('Hitbox alineada a cuadrícula 32px', '📐');
        }
      };
    }

    // Lock button
    const btnLock = document.getElementById('dev-btn-lock');
    if (btnLock) {
      btnLock.onclick = () => {
        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          obs.locked = !obs.locked;
          this.updateDevInspectorDOM();
          this.saveMapToStorage(true);
          this.showDevToast(obs.locked ? 'Hitbox bloqueada contra movimientos' : 'Hitbox desbloqueada', obs.locked ? '🔒' : '🔓');
        }
      };
    }

    // Hitbox Behavior Type dropdown
    const inpHitboxType = document.getElementById('inp-dev-hitbox-type');
    if (inpHitboxType) {
      inpHitboxType.onchange = (e) => {
        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          obs.type = e.target.value;
          this.rebuildObstacleColliders();
          this.populateQuickJumpDropdown();
          this.updateDevInspectorDOM();
          this.saveMapToStorage(true);
          this.showDevToast(`Tipo cambiado a: ${obs.type.toUpperCase()}`, '🧱');
        }
      };
    }

    // Enemy Spawn field bindings
    const inpSpawnEnemy = document.getElementById('inp-dev-spawn-enemy');
    if (inpSpawnEnemy) {
      inpSpawnEnemy.onchange = (e) => {
        if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            s.enemyType = e.target.value;
            this.saveMapToStorage(true);
            this.showDevToast(`Preferencia enemiga: ${s.enemyType}`, '🚩');
          }
        }
      };
    }

    const inpSpawnWave = document.getElementById('inp-dev-spawn-wave');
    if (inpSpawnWave) {
      inpSpawnWave.onchange = (e) => {
        if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            s.minWave = parseInt(e.target.value, 10);
            this.populateQuickJumpDropdown();
            this.saveMapToStorage(true);
            this.showDevToast(`Oleada mínima: ${s.minWave}`, '🚩');
          }
        }
      };
    }

    const inpSpawnRadius = document.getElementById('inp-dev-spawn-radius');
    if (inpSpawnRadius) {
      inpSpawnRadius.onchange = (e) => {
        if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            s.radius = parseInt(e.target.value, 10);
            this.saveMapToStorage(true);
            this.showDevToast(`Radio de dispersión: ${s.radius}px`, '🚩');
          }
        }
      };
    }

    const btnSpawnActive = document.getElementById('dev-btn-spawn-active');
    if (btnSpawnActive) {
      btnSpawnActive.onclick = () => {
        if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            s.active = s.active === false ? true : false;
            this.updateDevInspectorDOM();
            this.populateQuickJumpDropdown();
            this.saveMapToStorage(true);
            this.showDevToast(s.active ? `Spawn "${s.name}" activado` : `Spawn "${s.name}" pausado`, s.active ? '🟢' : '🔴');
          }
        }
      };
    }

    const btnSpawnTest = document.getElementById('dev-btn-spawn-test');
    if (btnSpawnTest) {
      btnSpawnTest.onclick = () => {
        if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) this.testSpawnEnemyAt(s);
        }
      };
    }

    // Stepper buttons in Inspector
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.onclick = () => {
        const field = btn.getAttribute('data-field');
        const delta = parseInt(btn.getAttribute('data-delta'), 10);

        if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
          const obs = this.mapObstacles[this.selectedHitboxIndex];
          if (!obs.locked) {
            if (field === 'x') obs.x = Math.max(0, obs.x + delta);
            if (field === 'y') obs.y = Math.max(0, obs.y + delta);
            if (field === 'w') obs.w = Math.max(8, obs.w + delta);
            if (field === 'h') obs.h = Math.max(8, obs.h + delta);
            this.rebuildObstacleColliders();
            this.updateDevInspectorDOM();
            this.saveMapToStorage(true);
          }

        } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            if (field === 'x') s.x = Math.max(32, s.x + delta);
            if (field === 'y') s.y = Math.max(32, s.y + delta);
            this.updateDevInspectorDOM();
            this.saveMapToStorage(true);
          }

        } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
          const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
          if (obj) {
            if (field === 'x') obj.x = Math.max(16, obj.x + delta);
            if (field === 'y') obj.y = Math.max(16, obj.y + delta);
            if (field === 'w' && obj.w !== undefined) obj.w = Math.max(8, obj.w + delta);
            if (field === 'h' && obj.h !== undefined) obj.h = Math.max(8, obj.h + delta);

            const entry = this.objectSpritesMap.get(obj.id);
            if (entry) {
              if (entry.sprite) entry.sprite.setPosition(obj.x, obj.y);
              if (entry.glow) entry.glow.setPosition(obj.x, obj.type === 'fireplace' ? obj.y + 10 : obj.y);
            }
            this.updateDevInspectorDOM();
            this.saveMapToStorage(true);
          }
        }
      };
    });

    // Manual input typing in Inspector
    ['x', 'y', 'w', 'h'].forEach(field => {
      const inp = document.getElementById(`inp-dev-${field}`);
      if (inp) {
        inp.onchange = (e) => {
          const val = parseInt(e.target.value, 10);
          if (isNaN(val)) return;

          if (this.devModeSub === 'hitbox' && this.selectedHitboxIndex >= 0) {
            const obs = this.mapObstacles[this.selectedHitboxIndex];
            if (!obs.locked) {
              if (field === 'x') obs.x = Math.max(0, val);
              if (field === 'y') obs.y = Math.max(0, val);
              if (field === 'w') obs.w = Math.max(8, val);
              if (field === 'h') obs.h = Math.max(8, val);
              this.rebuildObstacleColliders();
              this.saveMapToStorage(true);
            }

          } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
            const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
            if (s) {
              if (field === 'x') s.x = val;
              if (field === 'y') s.y = val;
              this.saveMapToStorage(true);
            }

          } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
            const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
            if (obj) {
              if (field === 'x') obj.x = val;
              if (field === 'y') obj.y = val;
              if (field === 'w') obj.w = val;
              if (field === 'h') obj.h = val;
              const entry = this.objectSpritesMap.get(obj.id);
              if (entry && entry.sprite) entry.sprite.setPosition(obj.x, obj.y);
              this.saveMapToStorage(true);
            }
          }
        };
      }
    });

    // Object and Spawn Name editing
    const inpName = document.getElementById('inp-dev-name');
    if (inpName) {
      inpName.onchange = (e) => {
        const val = e.target.value.trim();
        if (!val) return;
        if (this.devModeSub === 'objects' && this.selectedObjectId) {
          const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
          if (obj) {
            obj.name = val;
            this.updateDevInspectorDOM();
            this.populateQuickJumpDropdown();
            this.saveMapToStorage(true);
          }
        } else if (this.devModeSub === 'spawns' && this.selectedSpawnId) {
          const s = this.enemySpawns.find(sp => sp.id === this.selectedSpawnId);
          if (s) {
            s.name = val;
            this.updateDevInspectorDOM();
            this.populateQuickJumpDropdown();
            this.saveMapToStorage(true);
          }
        }
      };
    }

    // 8. Map Editor & Palette Controls
    const btnPaletteToggle = document.getElementById('dev-btn-palette-toggle');
    if (btnPaletteToggle) {
      btnPaletteToggle.onclick = () => this.toggleAssetPalette();
    }

    const btnPaletteClose = document.getElementById('palette-close');
    if (btnPaletteClose) {
      btnPaletteClose.onclick = () => this.closeAssetPalette();
    }

    document.querySelectorAll('.palette-filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.palette-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-cat') || 'all';
        this.renderPaletteItems(cat);
      };
    });

    const btnFitPixels = document.getElementById('dev-btn-fit-pixels');
    if (btnFitPixels) {
      btnFitPixels.onclick = () => this.fitSelectedHitboxToPixels();
    }

    const btnFitAll = document.getElementById('dev-btn-fit-all');
    if (btnFitAll) {
      btnFitAll.onclick = () => this.fitAllHitboxesToPixels();
    }

    const btnRandomMap = document.getElementById('dev-btn-random-map');
    if (btnRandomMap) {
      btnRandomMap.onclick = () => this.generateRandomMap();
    }

    const btnPlayMap = document.getElementById('dev-btn-play-map');
    if (btnPlayMap) {
      btnPlayMap.onclick = () => this.playCurrentMap();
    }
  }
});
