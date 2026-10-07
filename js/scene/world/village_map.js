'use strict';
/* Village and practice maps: Tiled map, layers, object rendering, shadows, tile animations and procedural props. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Generates a procedural lush green meadow texture with multi-tone blades and flowers
   */
  createProceduralMeadowTexture() {
    if (this.textures.exists('grass_meadow')) return;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Base green
    ctx.fillStyle = '#489438';
    ctx.fillRect(0, 0, 64, 64);

    // Organic grass patches
    const grassColors = ['#418732', '#4ea13d', '#3d7e30', '#56ad44', '#38732c'];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
      const x = Math.floor(Math.random() * 63);
      const y = Math.floor(Math.random() * 63);
      const w = 1 + Math.floor(Math.random() * 3);
      const h = 1 + Math.floor(Math.random() * 2);
      ctx.fillRect(x, y, w, h);
    }

    // Micro grass blades
    ctx.fillStyle = '#62be50';
    for (let i = 0; i < 40; i++) {
      const gx = Math.floor(Math.random() * 62);
      const gy = Math.floor(Math.random() * 62);
      ctx.fillRect(gx, gy, 1, 2);
      ctx.fillRect(gx + 1, gy - 1, 1, 1);
    }

    // Wildflowers (yellow, white, lavender)
    const flowers = ['#f4e04d', '#ffffff', '#e879f9'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = flowers[Math.floor(Math.random() * flowers.length)];
      const fx = Math.floor(Math.random() * 60) + 2;
      const fy = Math.floor(Math.random() * 60) + 2;
      ctx.fillRect(fx, fy, 2, 2);
    }

    this.textures.addCanvas('grass_meadow', canvas);
  },

  /**
   * Build and render the 1400x1400 Meadow Map with lush grass and dirt paths
   */
  createMeadowMap() {
    this.createProceduralMeadowTexture();
    this.mapWidth = 1400;
    this.mapHeight = 1400;

    if (this.meadowTileSprite) {
      this.meadowTileSprite.destroy();
    }
    this.meadowTileSprite = this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'grass_meadow')
      .setOrigin(0, 0)
      .setDepth(-100);

    // Warm dirt pathways & village plaza markings
    if (this.groundGfx) {
      this.groundGfx.destroy();
    }
    this.groundGfx = this.add.graphics().setDepth(-90);

    // Central courtyard dirt plaza
    this.groundGfx.fillStyle(0x7c6947, 0.42);
    this.groundGfx.fillCircle(700, 710, 115);
    this.groundGfx.fillStyle(0x8c7752, 0.32);
    this.groundGfx.fillCircle(700, 710, 90);

    // Connecting paths (North, East, South, West)
    this.groundGfx.lineStyle(24, 0x7c6947, 0.38);
    this.groundGfx.beginPath();
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(700, 440); // North Manor
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(700, 1100); // South Gate
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(440, 520); // NW Cottage
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(440, 880); // SW Farmstead
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(960, 500); // NE Mansion
    this.groundGfx.moveTo(700, 710);
    this.groundGfx.lineTo(1080, 720); // East Path
    this.groundGfx.strokePath();

    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.destroyLoadingText();
  },

  /**
   * Helper to retrieve raw Tiled JSON map data from Phaser cache
   */
  getMapData() {
    if (this._gameMode === 'campaign') {
      return this.cache.tilemap.get('campaign_tiled_map')?.data ||
        window.CAMPAIGN_MAP_DATA ||
        this.cache.tilemap.get('tiled_map')?.data || null;
    }
    return this.cache.tilemap.get('tiled_map')?.data ||
      window.TILED_MAP_DATA ||
      this.cache.tilemap.get('campaign_tiled_map')?.data || null;
  },

  /**
   * Build and render the Tiled Map with all visual layers using a dynamic approach:
   * - Auto-reads tileset names from the JSON (no hardcoded strings)
   * - Iterates map.layers to create all tile layers automatically
   * - Sets camera bounds from map pixel dimensions
   */
  createTiledMap(mapKey) {
    this.destroyLoadingText();
    const targetKey = mapKey || (this._gameMode === 'campaign' ? 'campaign_tiled_map' : 'tiled_map');

    // 1. Create Tilemap from preloaded JSON
    this.tiledMap = this.make.tilemap({ key: targetKey });
    const map = this.tiledMap;

    if (!map) {
      console.error('[CastleKnight] createTiledMap: make.tilemap returned null — "' + targetKey + '" not in cache.');
      return;
    }

    console.log('[CastleKnight] Building Tilemap for', targetKey, '| tilesets:', map.tilesets.map(t => t.name));

    // 2. Read the raw JSON to check all tileset definitions
    const rawMap = this.cache.tilemap.get(targetKey)?.data ||
      (this._gameMode === 'campaign' ? window.CAMPAIGN_MAP_DATA : window.TILED_MAP_DATA) ||
      this.cache.tilemap.get('campaign_tiled_map')?.data ||
      this.cache.tilemap.get('tiled_map')?.data;
    const rawTilesets = rawMap?.tilesets || [];

    // 3. Link each required tileset: map.addTilesetImage(nombreEnTiled, keyDeImagen)
    const allLinked = [];
    const seenTilesets = new Set();

    // Explicit ground/terrain mappings matching Tiled JSON tileset names with 100% precision:
    const EXPLICIT_TILESETS = [
      { name: 'Tileset_Ground', key: 'Tileset_Ground' },
      { name: 'Road', key: 'Road' },
      { name: 'Tileset_Water', key: 'Tileset_Water' },
      { name: 'Tileset_RockSlope', key: 'Tileset_RockSlope' },
      { name: 'Tileset_RockSlope_Simple', key: 'Tileset_RockSlope_Simple' },
      { name: 'Animation_Flowers_Red', key: 'Animation_Flowers_Red' },
      { name: 'Animation_Flowers_White', key: 'Animation_Flowers_White' },
      { name: 'Tileset_Shadow', key: 'Tileset_Shadow' },
      { name: 'Atlas_Buildings', key: 'Atlas_Buildings' },
      { name: 'Atlas_Props', key: 'Atlas_Props' },
      { name: 'Atlas_Rocks', key: 'Atlas_Rocks' },
      { name: 'Atlas_Trees_Bushes', key: 'Atlas_Trees_Bushes' },
      { name: 'Campfire', key: 'Campfire' }
    ];
    EXPLICIT_TILESETS.forEach(item => {
      if (this.textures.exists(item.key)) {
        const linked = map.addTilesetImage(item.name, item.key);
        if (linked && !allLinked.includes(linked)) {
          allLinked.push(linked);
          seenTilesets.add(item.name);
          console.log('[CastleKnight] ✓ Linked (explicit):', item.name, '->', item.key);
        }
      }
    });

    map.tilesets.forEach(ts => {
      if (seenTilesets.has(ts.name)) return;
      seenTilesets.add(ts.name);

      let texKey = null;
      if (this.textures.exists(ts.name)) texKey = ts.name;
      else if (ts.image && this.textures.exists(ts.image)) texKey = ts.image;
      else if (ts.image) {
        const fn = ts.image.split('/').pop().replace(/\.[^/.]+$/, '');
        if (this.textures.exists(fn)) texKey = fn;
      }

      if (texKey) {
        const linked = map.addTilesetImage(ts.name, texKey);
        if (linked && !allLinked.includes(linked)) {
          allLinked.push(linked);
          console.log('[CastleKnight] ✓ Linked:', ts.name, '->', texKey);
        }
      }
    });

    // Also ensure raw image-based tilesets are linked if not covered
    rawTilesets.filter(ts => ts.image).forEach(ts => {
      if (!allLinked.some(l => l.name === ts.name)) {
        let texKey = null;
        if (this.textures.exists(ts.name)) texKey = ts.name;
        else if (this.textures.exists(ts.image)) texKey = ts.image;
        else {
          const fn = ts.image.split('/').pop().replace(/\.[^/.]+$/, '');
          if (this.textures.exists(fn)) texKey = fn;
        }
        if (texKey) {
          const linked = map.addTilesetImage(ts.name, texKey);
          if (linked && !allLinked.includes(linked)) {
            allLinked.push(linked);
            console.log('[CastleKnight] ✓ Linked (raw):', ts.name, '->', texKey);
          }
        }
      }
    });

    console.log('[CastleKnight] Linked', allLinked.length, 'tilesets in total.');

    // 4. Iterate map.layers dynamically using all linked tilesets
    // Visual layers MUST ALWAYS be rendered:
    const VISUAL_LAYER_NAMES = new Set([
      'Ground', 'Road', 'Water', 'Flowers', 'RockSlopes_Auto', 'Shadows'
    ]);
    const LOGIC_LAYER_NAMES = new Set([
      'Rules', 'RockSlopes', 'Object Shadows', 'Collision', 'Collisions'
    ]);
    const isLogicLayer = (name, layerData) => {
      if (VISUAL_LAYER_NAMES.has(name)) return false; // Never exclude visual terrain layers!
      if (layerData && layerData.visible === false) return true;
      if (LOGIC_LAYER_NAMES.has(name)) return true;
      if (name.startsWith('rule_') || name.startsWith('_')) return true;
      return false;
    };

    let layerDepth = 0;
    this.layerGround = this.layerRoad = this.layerWater = null;
    this.layerRockSlopes = this.layerFlowers = this.layerShadows = null;

    map.layers.forEach((layerData, index) => {
      const layerName = layerData.name;

      if (isLogicLayer(layerName, layerData)) {
        console.log('[CastleKnight] Skipping logic layer (not rendered):', layerName);
        return;
      }

      const layer = map.createLayer(layerName, allLinked, 0, 0);
      if (!layer) {
        console.warn('[CastleKnight] createLayer returned null for:', layerName);
        return;
      }

      // Dynamic depth assignment: layer.setDepth(depth) to ensure terrain is strictly > 0
      // avoiding being placed behind canvas color or clear background
      const depthOrder = {
        'Ground': 1,
        'Water': 2,
        'RockSlopes_Auto': 3,
        'Road': 4,
        'Flowers': 5,
        'Shadows': 6
      };
      const depth = depthOrder[layerName] !== undefined ? depthOrder[layerName] : (1 + index);

      layer.setDepth(depth);
      layer.setVisible(true);
      if (layerName === 'Shadows') layer.setAlpha(0.28);

      console.log('[CastleKnight] Layer:', layerName, 'depth:', depth);

      switch (layerName) {
        case 'Ground': this.layerGround = layer; break;
        case 'Water': this.layerWater = layer; break;
        case 'RockSlopes_Auto': this.layerRockSlopes = layer; break;
        case 'Road': this.layerRoad = layer; break;
        case 'Flowers': this.layerFlowers = layer; break;
        case 'Shadows': this.layerShadows = layer; break;
      }
      layerDepth++;
    });

    // 5. Set camera and physics world bounds from actual tile map pixel dimensions
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    this.mapWidth = mapW;
    this.mapHeight = mapH;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    console.log('[CastleKnight] Map ready:', mapW, 'x', mapH, '| layers created:', layerDepth);

    // 6. Object Shadows (cast by houses & trees at depth 6)
    this.renderObjectShadows();

    // 7. Tile Animations (water, flowers)
    this.setupTileAnimations();

    // 8. Object Layer: 2.5D sprites, campfire, doors
    this.renderTiledObjects();

    // 9. Dev Mode map markers (only in practice mode)
    if (this._gameMode !== 'campaign') {
      this.createMapObjects();
    }

    this.destroyLoadingText();
  },

  /**
   * Render ground shadows cast by houses, trees, and props at depth 6
   */

  renderObjectShadows() {
    const mapData = this.getMapData();
    if (!mapData || !mapData.layers) return;
    const shdLayer = mapData.layers.find(l => l.name === 'Object Shadows');
    if (!shdLayer || !shdLayer.objects) return;

    this.campaignShadowSprites = this.campaignShadowSprites || [];
    shdLayer.objects.forEach(obj => {
      const key = this.getTextureKeyForGid(obj.gid, mapData);
      if (key && this.textures.exists(key)) {
        const spr = this.add.sprite(obj.x, obj.y, key)
          .setOrigin(0, 1)
          .setDepth(6)
          .setAlpha(0.28);
        this.campaignShadowSprites.push(spr);
      }
    });
  },

  /**
   * Setup real-time animation trackers for river and flower tiles
   */
  setupTileAnimations() {
    this.tileAnimations = [];
    const mapData = this.getMapData();
    if (!mapData || !mapData.tilesets) return;

    const animDefs = new Map();
    mapData.tilesets.forEach(ts => {
      if (ts.tiles) {
        ts.tiles.forEach(t => {
          if (t.animation && t.animation.length > 0) {
            const baseGid = ts.firstgid + t.id;
            const frames = t.animation.map(f => ts.firstgid + f.tileid);
            const duration = t.animation[0].duration || 120;
            animDefs.set(baseGid, {
              frames,
              duration,
              totalDuration: duration * frames.length
            });
          }
        });
      }
    });

    [this.layerWater, this.layerFlowers].forEach(layer => {
      if (!layer) return;
      layer.forEachTile(tile => {
        if (tile && tile.index > 0 && animDefs.has(tile.index)) {
          const def = animDefs.get(tile.index);
          this.tileAnimations.push({
            tile,
            frames: def.frames,
            duration: def.duration,
            totalDuration: def.totalDuration
          });
        }
      });
    });
  },

  /**
   * Render all 134 objects in Object Layer 1 with 2.5D depth sorting,
   * animated campfire at (256, 496) and animated house doors.
   */
  renderTiledObjects() {
    const mapData = this.getMapData();
    if (!mapData || !mapData.layers) return;
    const objLayer = mapData.layers.find(l => l.name === 'Object Layer 1');
    if (!objLayer || !objLayer.objects) return;

    this.campaignObjectSprites = this.campaignObjectSprites || [];

    // 1. Render Animated Campfire at (256, 496)
    if (this.textures.exists('campfire_anim')) {
      const campfire = this.add.sprite(256, 496, 'campfire_anim')
        .setOrigin(0, 1)
        .setDepth(496);
      if (this.anims.exists('campfire_burn')) {
        campfire.play('campfire_burn');
      }
      this.campaignObjectSprites.push(campfire);
      const glow = this.add.circle(272, 480, 28, 0xff7700, 0.2).setDepth(495);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.12, to: 0.28 },
        scale: { from: 0.9, to: 1.15 },
        duration: 650 + Math.random() * 300,
        yoyo: true,
        repeat: -1
      });
      this.campaignObjectSprites.push(glow);
    }

    // 2. Render all other objects (Houses, Trees, Rocks, Props)
    objLayer.objects.forEach(obj => {
      // Campfire tiles handled above
      if (obj.gid >= 5770 && obj.gid <= 5801) return;

      const key = this.getTextureKeyForGid(obj.gid, mapData);
      if (key && this.textures.exists(key)) {
        let objDepth = obj.y;
        const assetName = key.split('/').pop().replace(/\.[^/.]+$/, '');
        const meta = MAP_ASSET_METADATA[assetName] || MAP_ASSET_METADATA[key];
        if (meta && meta.cat === 'buildings') {
          // Roof line: eaves level so player/enemies render on top of walls, stairs, and porches
          // while passing under the roof canopy when walking behind.
          const top = obj.y - (obj.height || meta.h);
          if (assetName === 'House_Hay_3') {
            objDepth = 75; // Terrace stairs start at y=75
          } else if (assetName === 'House_Hay_2') {
            objDepth = 364; // Eaves line
          } else if (assetName === 'House_Hay_1') {
            objDepth = 168; // Eaves line
          } else if (assetName === 'House_Hay_4_Purple') {
            objDepth = 288; // Porch awning / eaves line
          } else {
            objDepth = top + (meta.hitOffsetY || Math.round(meta.h * 0.5));
          }
        }

        const spr = this.add.sprite(obj.x, obj.y, key)
          .setOrigin(0, 1)
          .setDepth(objDepth);
        this.campaignObjectSprites.push(spr);
      }
    });

    // 3. Render animated house doors
    this.renderAnimatedDoors();

    // 4. Spawn wandering villager NPCs
    this.spawnCampaignNPCs();
  },

  /**
   * Helper to resolve texture key from Tiled GID
   */
  getTextureKeyForGid(gid, mapData) {
    if (!gid || !mapData || !mapData.tilesets) return null;
    for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
      const ts = mapData.tilesets[i];
      if (gid >= ts.firstgid) {
        const tileId = gid - ts.firstgid;
        const td = ts.tiles ? ts.tiles.find(t => t.id === tileId) : null;
        if (td && td.image) {
          const raw = td.image.replace(/\\/g, '/');
          if (this.textures.exists(raw)) return raw;
          const fileName = raw.split('/').pop().replace(/\.[^/.]+$/, '');
          if (this.textures.exists(fileName)) return fileName;
          const baseName = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (ts.name && ts.name.toLowerCase().includes('shadow')) {
            if (this.textures.exists('shd_' + baseName)) return 'shd_' + baseName;
          }
          if (this.textures.exists('obj_' + baseName)) return 'obj_' + baseName;
          if (this.textures.exists(baseName)) return baseName;
          const artIdx = raw.indexOf('Art/');
          if (artIdx !== -1) {
            const rel = raw.substring(artIdx);
            if (this.textures.exists(rel)) return rel;
            if (this.textures.exists('assets/map2/' + rel)) return 'assets/map2/' + rel;
          }
          return null;
        }
        return null;
      }
    }
    return null;
  },

  // ===================================================
  // DEVELOPER MODE ENGINE & MAP EDITOR
  // ===================================================

  /**
   * Helper to snap a coordinate to the active grid
   */
  snapCoord(val, snap) {
    if (!snap || snap <= 0) return Math.round(val);
    return Math.round(val / snap) * snap;
  },

  /**
   * Generate pixel-art canvas textures for decorative props and map markers
   */
  createProceduralPropTextures() {
    // 1. prop_barrel (32x32)
    if (!this.textures.exists('prop_barrel')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6b3f1b';
      ctx.fillRect(4, 4, 24, 24);
      ctx.fillStyle = '#8f5627';
      ctx.fillRect(6, 6, 20, 20);
      ctx.fillStyle = '#4a280f';
      ctx.fillRect(11, 4, 2, 24);
      ctx.fillRect(19, 4, 2, 24);
      ctx.fillStyle = '#2b2a29';
      ctx.fillRect(4, 7, 24, 3);
      ctx.fillRect(4, 21, 24, 3);
      ctx.fillStyle = '#595754';
      ctx.fillRect(4, 8, 24, 1);
      ctx.fillRect(4, 22, 24, 1);
      this.textures.addCanvas('prop_barrel', c);
    }

    // 2. prop_table (64x48)
    if (!this.textures.exists('prop_table')) {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 48;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#2b1608';
      ctx.fillRect(4, 16, 56, 28);
      ctx.fillStyle = '#42220d';
      ctx.fillRect(6, 20, 6, 24);
      ctx.fillRect(52, 20, 6, 24);
      ctx.fillRect(18, 24, 6, 20);
      ctx.fillRect(40, 24, 6, 20);
      ctx.fillStyle = '#6e3c1a';
      ctx.fillRect(2, 6, 60, 18);
      ctx.fillStyle = '#8c5026';
      ctx.fillRect(4, 8, 56, 13);
      ctx.fillStyle = '#4a240c';
      ctx.fillRect(2, 12, 60, 2);
      ctx.fillRect(2, 17, 60, 2);
      ctx.fillStyle = '#ad6a39';
      ctx.fillRect(4, 8, 56, 1);
      this.textures.addCanvas('prop_table', c);
    }

    // 3. prop_chair (32x32)
    if (!this.textures.exists('prop_chair')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#522b10';
      ctx.fillRect(8, 2, 16, 12);
      ctx.fillStyle = '#7a421b';
      ctx.fillRect(10, 4, 12, 8);
      ctx.fillStyle = '#945325';
      ctx.fillRect(6, 14, 20, 8);
      ctx.fillStyle = '#3d1e09';
      ctx.fillRect(8, 22, 3, 8);
      ctx.fillRect(21, 22, 3, 8);
      this.textures.addCanvas('prop_chair', c);
    }

    // 4. prop_chest (32x32)
    if (!this.textures.exists('prop_chest')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#542d10';
      ctx.fillRect(4, 8, 24, 20);
      ctx.fillStyle = '#7a451d';
      ctx.fillRect(6, 10, 20, 16);
      ctx.fillStyle = '#262422';
      ctx.fillRect(4, 8, 24, 3);
      ctx.fillRect(4, 17, 24, 2);
      ctx.fillRect(8, 8, 3, 20);
      ctx.fillRect(21, 8, 3, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 15, 4, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(15, 17, 2, 2);
      this.textures.addCanvas('prop_chest', c);
    }

    // 5. prop_bookshelf (48x64)
    if (!this.textures.exists('prop_bookshelf')) {
      const c = document.createElement('canvas');
      c.width = 48; c.height = 64;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3d1d07';
      ctx.fillRect(2, 2, 44, 60);
      ctx.fillStyle = '#5e3010';
      ctx.fillRect(4, 4, 40, 56);
      ctx.fillStyle = '#2b1303';
      ctx.fillRect(4, 22, 40, 4);
      ctx.fillRect(4, 42, 40, 4);
      const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#ca8a04', '#0d9488'];
      let bx = 6;
      while (bx < 40) {
        const col = colors[(bx * 3) % colors.length];
        const h = 10 + (bx % 4);
        ctx.fillStyle = col;
        ctx.fillRect(bx, 22 - h, 3, h);
        bx += 4;
      }
      bx = 6;
      while (bx < 40) {
        const col = colors[(bx * 5) % colors.length];
        const h = 10 + (bx % 5);
        ctx.fillStyle = col;
        ctx.fillRect(bx, 42 - h, 3, h);
        bx += 4;
      }
      this.textures.addCanvas('prop_bookshelf', c);
    }

    // 6. prop_torch (32x32)
    if (!this.textures.exists('prop_torch')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#262626';
      ctx.fillRect(14, 16, 4, 12);
      ctx.fillRect(12, 14, 8, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 10, 2, 8);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(13, 6, 6, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 4, 4, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 5, 2, 3);
      this.textures.addCanvas('prop_torch', c);
    }

    // 7. marker_player_spawn (32x32)
    if (!this.textures.exists('marker_player_spawn')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(14, 165, 233, 0.45)';
      ctx.fillRect(2, 2, 28, 28);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 28, 28);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, 8, 12, 10);
      ctx.fillRect(12, 18, 8, 4);
      ctx.fillRect(14, 22, 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('H', 12, 17);
      this.textures.addCanvas('marker_player_spawn', c);
    }

    // 8. marker_enemy_spawn (32x32)
    if (!this.textures.exists('marker_enemy_spawn')) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.fillRect(2, 2, 28, 28);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 28, 28);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(10, 8, 12, 8);
      ctx.fillRect(12, 16, 8, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 10, 2, 2);
      ctx.fillRect(18, 10, 2, 2);
      this.textures.addCanvas('marker_enemy_spawn', c);
    }
  },

  /**
   * Instantiate all map objects (fireplaces, doors, props, markers) into Phaser
   */
  createMapObjects() {
    // Clear old instances
    this.objectSpritesMap.forEach((entry) => {
      if (entry.sprite && entry.sprite.destroy) entry.sprite.destroy();
      if (entry.glow && entry.glow.destroy) entry.glow.destroy();
      if (entry.label && entry.label.destroy) entry.label.destroy();
    });
    this.objectSpritesMap.clear();

    this.mapObjects.forEach(obj => {
      let sprite = null;
      let glow = null;
      let label = null;

      // Special marker types
      if (obj.type === 'player_spawn') {
        sprite = this.add.sprite(obj.x, obj.y, 'marker_player_spawn').setDepth(1001);
        sprite.setVisible(this.devModeEnabled || false);
        this.objectSpritesMap.set(obj.id, { sprite, glow, label, obj });
        return;
      } else if (obj.type === 'enemy_spawn') {
        sprite = this.add.sprite(obj.x, obj.y, 'marker_enemy_spawn').setDepth(1001);
        sprite.setVisible(this.devModeEnabled || false);
        this.objectSpritesMap.set(obj.id, { sprite, glow, label, obj });
        return;
      }

      // Identify texture key
      const key = obj.assetKey || obj.type;
      let texKey = null;

      if (this.textures.exists(key)) {
        texKey = key;
      } else {
        const meta = MAP_ASSET_METADATA[key];
        if (meta && this.textures.exists(meta.key)) {
          texKey = meta.key;
        } else if (this.textures.exists('obj_' + String(key).toLowerCase().replace(/[^a-z0-9_]/g, '_'))) {
          texKey = 'obj_' + String(key).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        } else if (this.textures.exists(String(key).split('/').pop().replace(/\.[^/.]+$/, ''))) {
          texKey = String(key).split('/').pop().replace(/\.[^/.]+$/, '');
        }
      }

      // Semantic fallbacks
      if (!texKey) {
        if (obj.type === 'fireplace' || obj.type === 'campfire') texKey = 'Animation_Campfire';
        else if (obj.type === 'door') texKey = 'Door_Normal_Wood';
        else if (obj.type === 'barrel') texKey = 'Barrel_Small_Empty';
        else if (obj.type === 'table') texKey = 'Table_Medium_1';
        else if (obj.type === 'bench' || obj.type === 'chair') texKey = 'Bench_1';
        else if (obj.type === 'crate' || obj.type === 'chest') texKey = 'Crate_Medium_Closed';
        else if (obj.type === 'torch' || obj.type === 'lamppost') texKey = 'LampPost_3';
      }

      const meta = MAP_ASSET_METADATA[key] || MAP_ASSET_METADATA[texKey];
      const ox = obj.originX !== undefined ? obj.originX : (meta && meta.originX !== undefined ? meta.originX : 0.5);
      const oy = obj.originY !== undefined ? obj.originY : (meta && meta.originY !== undefined ? meta.originY : 1.0);
      const depth = obj.depth !== undefined ? obj.depth : Math.round(obj.y);

      if (texKey && this.textures.exists(texKey)) {
        sprite = this.add.sprite(obj.x, obj.y, texKey)
          .setOrigin(ox, oy)
          .setDepth(depth);

        // Animated Campfire
        if (texKey === 'Animation_Campfire' || key === 'Animation_Campfire' || obj.type === 'campfire' || obj.type === 'fireplace') {
          if (this.anims.exists('campfire_burn')) {
            sprite.play('campfire_burn');
          }
          glow = this.add.circle(obj.x, obj.y - 12, 38, 0xff7700, 0.22).setDepth(depth - 1);
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.14, to: 0.28 },
            scale: { from: 0.92, to: 1.12 },
            duration: 700 + Math.random() * 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        } else if (texKey === 'LampPost_3' || key === 'LampPost_3' || obj.type === 'lamppost') {
          // Warm lantern glow
          glow = this.add.circle(obj.x, obj.y - 42, 28, 0xffaa00, 0.2).setDepth(depth - 1);
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.12, to: 0.24 },
            duration: 900 + Math.random() * 400,
            yoyo: true,
            repeat: -1
          });
        }
      }

      this.objectSpritesMap.set(obj.id, { sprite, glow, label, obj });
    });

    this.updateObjectCountDOM();
  }
});
