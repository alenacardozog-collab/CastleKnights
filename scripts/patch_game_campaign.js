const fs = require('fs');
const path = require('path');

// 1. Read fresh backup
const gameJsPath = path.join(__dirname, '../js/game.js');
const orig = fs.readFileSync(path.join(__dirname, '../js/game.js.bak'), 'utf8');
let gameJs = orig;

const artPaths = JSON.parse(fs.readFileSync(path.join(__dirname, 'map2_art_paths.json'), 'utf8'));

// 2. Preload Map JSON definitions (Practice + Campaign)
const oldPreloadTiled = `    if (window.TILED_MAP_DATA) {
      this.cache.tilemap.add('tiled_map', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: window.TILED_MAP_DATA
      });
    } else {
      this.load.tilemapTiledJSON('tiled_map', 'assets/map/mapa1.json');
    }`;

const newPreloadTiled = `    // Practice Map
    if (window.TILED_MAP_DATA) {
      this.cache.tilemap.add('tiled_map', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: window.TILED_MAP_DATA
      });
    } else {
      this.load.tilemapTiledJSON('tiled_map', 'assets/map/mapa1.json');
    }

    // Campaign Map (assets/map2/map1.json & window.CAMPAIGN_MAP_DATA)
    if (window.CAMPAIGN_MAP_DATA) {
      this.cache.tilemap.add('campaign_tiled_map', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: window.CAMPAIGN_MAP_DATA
      });
    } else {
      this.load.tilemapTiledJSON('campaign_tiled_map', 'assets/map2/map1.json');
    }`;

if (!gameJs.includes(oldPreloadTiled)) {
  console.error('Could not find oldPreloadTiled in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldPreloadTiled, newPreloadTiled);

// 3. Replace ALL_MAP_ART_PATHS array
const p1 = gameJs.indexOf('const ALL_MAP_ART_PATHS = [');
const p2 = gameJs.indexOf('];\n\n    ALL_MAP_ART_PATHS.forEach', p1);

if (p1 === -1 || p2 === -1) {
  console.error('Could not find ALL_MAP_ART_PATHS boundaries!');
  process.exit(1);
}

const newArrayStr = 'const ALL_MAP_ART_PATHS = [\n' +
  artPaths.map(p => '  "' + p + '"').join(',\n') +
  '\n];';

gameJs = gameJs.substring(0, p1) + newArrayStr + gameJs.substring(p2 + 2);

// 4. Replace forEach registration in preload to also register under legacy, relative, and normalized keys
const oldForEach = `    ALL_MAP_ART_PATHS.forEach(p => {
      const src = getAsset(p, p);
      this.load.image(p, src);
      const fileName = p.split('/').pop().replace(/\\.[^/.]+$/, '');
      this.load.image(fileName, getAsset(fileName, p));
      const norm = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      this.load.image('obj_' + norm, src);
      this.load.image('shd_' + norm, src);
    });`;

const newForEach = `    ALL_MAP_ART_PATHS.forEach(p => {
      const src = getAsset(p, p);
      this.load.image(p, src);
      const legacyPath = p.replace('assets/map2/Art/', 'assets/map/Art/');
      this.load.image(legacyPath, src);
      const relPath = p.replace('assets/map2/', '');
      this.load.image(relPath, src);
      const fileName = p.split('/').pop().replace(/\\.[^/.]+$/, '');
      this.load.image(fileName, getAsset(fileName, p));
      const norm = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      this.load.image('obj_' + norm, src);
      this.load.image('shd_' + norm, src);
      this.load.image(norm, src);
    });`;

if (!gameJs.includes(oldForEach)) {
  console.error('Could not find oldForEach in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldForEach, newForEach);

// 5. Replace terrain tilesets and atlas loading paths
const oldTerrainTilesets = `    // -- Terrain tile-layer tilesets (used directly by tile layers) --
    this.load.image('Tileset_Ground',          getAsset('Tileset_Ground', 'assets/map/Art/Ground Tileset/Tileset_Ground.png'));
    this.load.image('Road',                    getAsset('Road', 'assets/map/Art/Ground Tileset/Tileset_Road.png'));
    this.load.image('Tileset_Water',           getAsset('Tileset_Water', 'assets/map/Art/Water and Sand/Tileset_Water.png'));
    this.load.image('Tileset_RockSlope',       getAsset('Tileset_RockSlope', 'assets/map/Art/Rock Slopes/Tileset_RockSlope.png'));
    this.load.image('Tileset_RockSlope_Simple',getAsset('Tileset_RockSlope_Simple', 'assets/map/Art/Rock Slopes/Tileset_RockSlope_Simple.png'));
    this.load.image('Animation_Flowers_Red',   getAsset('Animation_Flowers_Red', 'assets/map/Art/Props/Animation/Flowers_Red.png'));
    this.load.image('Animation_Flowers_White', getAsset('Animation_Flowers_White', 'assets/map/Art/Props/Animation/Flowers_White.png'));
    this.load.image('Tileset_Shadow',          getAsset('Tileset_Shadow', 'assets/map/Art/Shadows/Atlas/Tileset_Shadow.png'));

    // -- Atlas tilesets referenced by the JSON (needed to avoid tileset linking errors) --
    this.load.image('Atlas_Buildings',   getAsset('Atlas_Buildings', 'assets/map/Art/Buildings/Atlas/Buildings.png'));
    this.load.image('Atlas_Props',       getAsset('Atlas_Props', 'assets/map/Art/Props/Atlas/Props.png'));
    this.load.image('Atlas_Rocks',       getAsset('Atlas_Rocks', 'assets/map/Art/Rocks/Atlas/Rocks.png'));
    this.load.image('Atlas_Trees_Bushes',getAsset('Atlas_Trees_Bushes', 'assets/map/Art/Trees and Bushes/Atlas/Trees_Bushes.png'));
    this.load.image('Campfire',          getAsset('Campfire', 'assets/map/Art/Props/Animation/Animation_Campfire.png'));
    this.load.image('fireplace',         getAsset('fireplace', 'assets/map/Art/Props/Fireplace_1.png'));
    this.load.image('Fireplace_1',       getAsset('Fireplace_1', 'assets/map/Art/Props/Fireplace_1.png'));

    // 1.1 Animated Environment Spritesheets (Campfire & Doors)
    this.load.spritesheet('campfire_anim', getAsset('campfire_anim', 'assets/map/Art/Props/Animation/Animation_Campfire.png'), {
      frameWidth: 32, frameHeight: 32
    });
    this.load.spritesheet('door_normal_anim', getAsset('door_normal_anim', 'assets/map/Art/Buildings/Animations/Door_Normal_Wood.png'), {
      frameWidth: 16, frameHeight: 26
    });
    this.load.spritesheet('door_small_anim', getAsset('door_small_anim', 'assets/map/Art/Buildings/Animations/Door_Small_Wood.png'), {
      frameWidth: 16, frameHeight: 20
    });`;

const newTerrainTilesets = `    // -- Terrain tile-layer tilesets (used directly by tile layers) --
    this.load.image('Tileset_Ground',          getAsset('Tileset_Ground', 'assets/map2/Art/Ground Tileset/Tileset_Ground.png'));
    this.load.image('Road',                    getAsset('Road', 'assets/map2/Art/Ground Tileset/Tileset_Road.png'));
    this.load.image('Tileset_Water',           getAsset('Tileset_Water', 'assets/map2/Art/Water and Sand/Tileset_Water.png'));
    this.load.image('Tileset_RockSlope',       getAsset('Tileset_RockSlope', 'assets/map2/Art/Rock Slopes/Tileset_RockSlope.png'));
    this.load.image('Tileset_RockSlope_Simple',getAsset('Tileset_RockSlope_Simple', 'assets/map2/Art/Rock Slopes/Tileset_RockSlope_Simple.png'));
    this.load.image('Animation_Flowers_Red',   getAsset('Animation_Flowers_Red', 'assets/map2/Art/Props/Animation/Flowers_Red.png'));
    this.load.image('Animation_Flowers_White', getAsset('Animation_Flowers_White', 'assets/map2/Art/Props/Animation/Flowers_White.png'));
    this.load.image('Tileset_Shadow',          getAsset('Tileset_Shadow', 'assets/map2/Art/Shadows/Atlas/Tileset_Shadow.png'));

    // -- Atlas tilesets referenced by the JSON (needed to avoid tileset linking errors) --
    this.load.image('Atlas_Buildings',   getAsset('Atlas_Buildings', 'assets/map2/Art/Buildings/Atlas/Buildings.png'));
    this.load.image('Atlas_Props',       getAsset('Atlas_Props', 'assets/map2/Art/Props/Atlas/Props.png'));
    this.load.image('Atlas_Rocks',       getAsset('Atlas_Rocks', 'assets/map2/Art/Rocks/Atlas/Rocks.png'));
    this.load.image('Atlas_Trees_Bushes',getAsset('Atlas_Trees_Bushes', 'assets/map2/Art/Trees and Bushes/Atlas/Trees_Bushes.png'));
    this.load.image('Campfire',          getAsset('Campfire', 'assets/map2/Art/Props/Animation/Animation_Campfire.png'));
    this.load.image('fireplace',         getAsset('fireplace', 'assets/map2/Art/Props/Fireplace_1.png'));
    this.load.image('Fireplace_1',       getAsset('Fireplace_1', 'assets/map2/Art/Props/Fireplace_1.png'));

    // 1.1 Animated Environment Spritesheets (Campfire & Doors)
    this.load.spritesheet('campfire_anim', getAsset('campfire_anim', 'assets/map2/Art/Props/Animation/Animation_Campfire.png'), {
      frameWidth: 32, frameHeight: 32
    });
    this.load.spritesheet('door_normal_anim', getAsset('door_normal_anim', 'assets/map2/Art/Buildings/Animations/Door_Normal_Wood.png'), {
      frameWidth: 16, frameHeight: 26
    });
    this.load.spritesheet('door_small_anim', getAsset('door_small_anim', 'assets/map2/Art/Buildings/Animations/Door_Small_Wood.png'), {
      frameWidth: 16, frameHeight: 20
    });`;

if (!gameJs.includes(oldTerrainTilesets)) {
  console.error('Could not find oldTerrainTilesets in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldTerrainTilesets, newTerrainTilesets);

// 6. Update startPractice and startCampaign
const oldStartPracticeCampaign = `  /**
   * Start the generic Practice map (embedded mapa1_data.js)
   */
  startPractice() {
    this._gameMode = 'practice';
    // The embedded window.TILED_MAP_DATA is already in cache from preload; just start.
    this.startGame('practice');
  }

  /**
   * Start the Campaign map (assets/map2/mapa1.json).
   * We hot-swap the tiled_map cache entry and re-call createTiledMap.
   */
  startCampaign() {
    this._gameMode = 'campaign';
    this.startGame('campaign');

    // ── 1. Show loading feedback ─────────────────────────────────────────────
    if (this.progressText) { try { this.progressText.destroy(); } catch(e){} }
    this.progressText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Cargando Campaña…',
      { fontFamily: 'MedievalSharp, monospace', fontSize: '20px', fill: '#fcd567' }
    ).setOrigin(0.5).setDepth(9999);

    // ── 2. Destroy existing map and layers ───────────────────────────────────
    if (this.tiledMap) { try { this.tiledMap.destroy(); } catch(e){} this.tiledMap = null; }
    ['layerGround','layerRoad','layerWater','layerRockSlopes','layerFlowers','layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch(e){} this[k] = null; }
    });

    // ── 3. Remove old tiled_map from cache (fresh load) ─────────────────────
    if (this.cache.tilemap.has('tiled_map')) this.cache.tilemap.remove('tiled_map');

    // ── 4. Preload ALL map2 Art images under their full path as key ──────────
    //   Phaser's addTilesetImage(name, key) will look for each tileset image
    //   by the key registered here. We register BOTH the full path AND the
    //   tileset name so createTiledMap()'s dynamic linker can find them.
    const MAP2_ART = [
      // ── Ground / Road / Water / Slopes ──
      { key: 'Tileset_Ground',          path: 'assets/map2/Art/Ground Tileset/Tileset_Ground.png' },
      { key: 'Road',                    path: 'assets/map2/Art/Ground Tileset/Tileset_Road.png' },
      { key: 'Tileset_Water',           path: 'assets/map2/Art/Water and Sand/Tileset_Water.png' },
      { key: 'Tileset_RockSlope',       path: 'assets/map2/Art/Rock Slopes/Tileset_RockSlope.png' },
      { key: 'Tileset_RockSlope_Simple',path: 'assets/map2/Art/Rock Slopes/Tileset_RockSlope_Simple.png' },
      // ── Atlases ──
      { key: 'Atlas_Buildings',         path: 'assets/map2/Art/Buildings/Atlas/Buildings.png' },
      { key: 'Atlas_Props',             path: 'assets/map2/Art/Props/Atlas/Props.png' },
      { key: 'Atlas_Rocks',             path: 'assets/map2/Art/Rocks/Atlas/Rocks.png' },
      { key: 'Atlas_Trees_Bushes',      path: 'assets/map2/Art/Trees and Bushes/Atlas/Trees_Bushes.png' },
      { key: 'Tileset_Shadow',          path: 'assets/map2/Art/Shadows/Atlas/Tileset_Shadow.png' },
      // ── Animations / Flowers ──
      { key: 'Animation_Flowers_Red',   path: 'assets/map2/Art/Props/Animation/Flowers_Red.png' },
      { key: 'Animation_Flowers_White', path: 'assets/map2/Art/Props/Animation/Flowers_White.png' },
      { key: 'Campfire',                path: 'assets/map2/Art/Props/Animation/Animation_Campfire.png' },
      // ── Buildings (object tileset images) ──
      { key: 'House_Hay_1',             path: 'assets/map2/Art/Buildings/House_Hay_1.png' },
      { key: 'House_Hay_2',             path: 'assets/map2/Art/Buildings/House_Hay_2.png' },
      { key: 'House_Hay_3',             path: 'assets/map2/Art/Buildings/House_Hay_3.png' },
      { key: 'House_Hay_4_Purple',      path: 'assets/map2/Art/Buildings/House_Hay_4_Purple.png' },
      { key: 'CityWall_Gate_1',         path: 'assets/map2/Art/Buildings/CityWall_Gate_1.png' },
      { key: 'Well_Hay_1',              path: 'assets/map2/Art/Buildings/Well_Hay_1.png' },
      // ── Props (object tileset images) ──
      { key: 'Bench_1',                 path: 'assets/map2/Art/Props/Bench_1.png' },
      { key: 'Bench_3',                 path: 'assets/map2/Art/Props/Bench_3.png' },
      { key: 'BulletinBoard_1',         path: 'assets/map2/Art/Props/BulletinBoard_1.png' },
      { key: 'Chopped_Tree_1',          path: 'assets/map2/Art/Props/Chopped_Tree_1.png' },
      { key: 'Crate_Large_Empty',       path: 'assets/map2/Art/Props/Crate_Large_Empty.png' },
      { key: 'Crate_Medium_Closed',     path: 'assets/map2/Art/Props/Crate_Medium_Closed.png' },
      { key: 'Crate_Water_1',           path: 'assets/map2/Art/Props/Crate_Water_1.png' },
      { key: 'LampPost_3',              path: 'assets/map2/Art/Props/LampPost_3.png' },
      { key: 'Plant_2',                 path: 'assets/map2/Art/Props/Plant_2.png' },
      { key: 'Sack_3',                  path: 'assets/map2/Art/Props/Sack_3.png' },
      { key: 'Sign_1',                  path: 'assets/map2/Art/Props/Sign_1.png' },
      { key: 'Sign_2',                  path: 'assets/map2/Art/Props/Sign_2.png' },
      { key: 'Banner_Stick_1_Purple',   path: 'assets/map2/Art/Props/Banner_Stick_1_Purple.png' },
      { key: 'Fireplace_1',             path: 'assets/map2/Art/Props/Fireplace_1.png' },
      { key: 'HayStack_2',              path: 'assets/map2/Art/Props/HayStack_2.png' },
      { key: 'Barrel_Small_Empty',      path: 'assets/map2/Art/Props/Barrel_Small_Empty.png' },
      { key: 'Basket_Empty',            path: 'assets/map2/Art/Props/Basket_Empty.png' },
      { key: 'Table_Medium_1',          path: 'assets/map2/Art/Props/Table_Medium_1.png' },
      // ── Rocks ──
      { key: 'Rock_Brown_1',            path: 'assets/map2/Art/Rocks/Rock_Brown_1.png' },
      { key: 'Rock_Brown_2',            path: 'assets/map2/Art/Rocks/Rock_Brown_2.png' },
      { key: 'Rock_Brown_4',            path: 'assets/map2/Art/Rocks/Rock_Brown_4.png' },
      { key: 'Rock_Brown_6',            path: 'assets/map2/Art/Rocks/Rock_Brown_6.png' },
      { key: 'Rock_Brown_9',            path: 'assets/map2/Art/Rocks/Rock_Brown_9.png' },
      // ── Trees / Bushes ──
      { key: 'Bush_Emerald_1',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_1.png' },
      { key: 'Bush_Emerald_2',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_2.png' },
      { key: 'Bush_Emerald_3',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_3.png' },
      { key: 'Bush_Emerald_4',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_4.png' },
      { key: 'Bush_Emerald_5',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_5.png' },
      { key: 'Bush_Emerald_6',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_6.png' },
      { key: 'Bush_Emerald_7',          path: 'assets/map2/Art/Trees and Bushes/Bush_Emerald_7.png' },
      { key: 'Tree_Emerald_1',          path: 'assets/map2/Art/Trees and Bushes/Tree_Emerald_1.png' },
      { key: 'Tree_Emerald_2',          path: 'assets/map2/Art/Trees and Bushes/Tree_Emerald_2.png' },
      { key: 'Tree_Emerald_3',          path: 'assets/map2/Art/Trees and Bushes/Tree_Emerald_3.png' },
      { key: 'Tree_Emerald_4',          path: 'assets/map2/Art/Trees and Bushes/Tree_Emerald_4.png' },
    ];

    // Register each image under key (tileset name) AND full path
    MAP2_ART.forEach(({ key, path }) => {
      if (!this.textures.exists(key))   this.load.image(key, path);
      if (!this.textures.exists(path))  this.load.image(path, path);
    });

    // Campfire spritesheet for animation
    if (!this.textures.exists('campfire_anim_c2')) {
      this.load.spritesheet('campfire_anim_c2',
        'assets/map2/Art/Props/Animation/Animation_Campfire.png',
        { frameWidth: 32, frameHeight: 32 });
    }

    // ── 5. Load the procedurally generated campaign map JSON ────────────────
    this.load.tilemapTiledJSON('tiled_map', 'assets/map2/campaign_map.json');

    // ── 6. On complete: build the map ────────────────────────────────────────
    this.load.once('complete', () => {
      this.destroyLoadingText();
      console.log('[CastleKnight] Campaign assets loaded — building map.');
      this.createTiledMap();
    });

    this.load.on('progress', (val) => {
      if (this.progressText && this.progressText.active) {
        this.progressText.setText(\`Cargando Campaña: \${Math.round(val * 100)}%\`);
      }
    });

    this.load.start();
  }`;

const newStartPracticeCampaign = `  /**
   * Start the generic Practice map (embedded meadow / mapa1_data.js)
   */
  startPractice() {
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
      try { this.tiledMap.destroy(); } catch(e){}
      this.tiledMap = null;
    }
    ['layerGround','layerRoad','layerWater','layerRockSlopes','layerFlowers','layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch(e){} this[k] = null; }
    });

    // 2. Restore procedural meadow background
    this.mapWidth = 1400;
    this.mapHeight = 1400;
    if (this.meadowTileSprite) this.meadowTileSprite.setVisible(true);
    if (this.groundGfx) this.groundGfx.setVisible(true);

    // 3. Rebuild practice obstacles and props
    this.mapObstacles = null;
    this.createSolidObstacles();
    this.createMapObjects();

    // 4. Set player position and bounds
    if (this.player) {
      this.player.setPosition(700, 710);
      this.player.setVelocity(0, 0);
      this.player.setDepth(710);
    }
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1.45);

    this.startGame('practice');
  }

  /**
   * Start the Campaign map (assets/map2/map1.json using assets/map2/Art/).
   */
  startCampaign() {
    this._gameMode = 'campaign';
    this._currentMapKey = 'campaign_tiled_map';

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

    if (this.devSceneryObjects) {
      this.devSceneryObjects.forEach(s => s && s.destroy && s.destroy());
    }
    this.devSceneryObjects = [];

    if (this.devObjectSprites) {
      this.devObjectSprites.forEach(s => s && s.destroy && s.destroy());
    }
    this.devObjectSprites = [];

    if (this.tiledMap) {
      try { this.tiledMap.destroy(); } catch(e){}
      this.tiledMap = null;
    }
    ['layerGround','layerRoad','layerWater','layerRockSlopes','layerFlowers','layerShadows'].forEach(k => {
      if (this[k]) { try { this[k].destroy(); } catch(e){} this[k] = null; }
    });

    // 3. Clear existing map obstacles so campaign map builds fresh native colliders
    this.mapObstacles = null;

    // 4. Build campaign map
    const buildCampaign = () => {
      this.createTiledMap('campaign_tiled_map');
      this.createSolidObstacles();

      // Position player at village center road (250, 340)
      if (this.player) {
        this.player.setPosition(250, 340);
        this.player.setVelocity(0, 0);
        this.player.setDepth(340);
      }

      // Camera settings for 640x640 campaign map
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
      this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
      this.cameras.main.setZoom(1.5);

      this.startGame('campaign');

      // Clear previous enemies and spawn initial campaign enemies
      if (this.enemies) {
        this.enemies.clear(true, true);
        this.time.delayedCall(300, () => {
          if (this.gameStarted && !this.isDead) {
            this.spawnEnemy(180, 260);
            this.spawnEnemy(380, 280);
          }
        });
      }
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
  }`;

if (!gameJs.includes(oldStartPracticeCampaign)) {
  console.error('Could not find oldStartPracticeCampaign in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldStartPracticeCampaign, newStartPracticeCampaign);

// 7. Update getMapData
const oldGetMapData = `  getMapData() {
    return this.cache.tilemap.get('tiled_map')?.data || this.cache.json.get('tiled_map') || null;
  }`;

const newGetMapData = `  getMapData() {
    if (this._gameMode === 'campaign') {
      return this.cache.tilemap.get('campaign_tiled_map')?.data ||
             window.CAMPAIGN_MAP_DATA ||
             this.cache.tilemap.get('tiled_map')?.data || null;
    }
    return this.cache.tilemap.get('tiled_map')?.data ||
           window.TILED_MAP_DATA ||
           this.cache.tilemap.get('campaign_tiled_map')?.data || null;
  }`;

if (!gameJs.includes(oldGetMapData)) {
  console.error('Could not find oldGetMapData in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldGetMapData, newGetMapData);

// 8. Update createTiledMap
const oldCreateTiledMap = `  createTiledMap() {
    this.destroyLoadingText();

    // 1. Create Tilemap from preloaded JSON
    this.tiledMap = this.make.tilemap({ key: 'tiled_map' });
    const map = this.tiledMap;

    if (!map) {
      console.error('[CastleKnight] createTiledMap: make.tilemap returned null — "tiled_map" not in cache.');
      return;
    }

    console.log('Tilesets requeridos por el JSON:', map.tilesets.map(t => t.name));

    // 2. Read the raw JSON to check all tileset definitions
    const rawMap = this.cache.tilemap.get('tiled_map')?.data || window.TILED_MAP_DATA;
    const rawTilesets = rawMap?.tilesets || [];

    // 3. Link each required tileset strictly: map.addTilesetImage(nombreEnTiled, keyDeImagen)
    const allLinked = [];
    const seenTilesets = new Set();
    map.tilesets.forEach(ts => {
      if (seenTilesets.has(ts.name)) return;
      seenTilesets.add(ts.name);

      if (this.textures.exists(ts.name)) {
        const linked = map.addTilesetImage(ts.name, ts.name);
        if (linked && !allLinked.includes(linked)) {
          allLinked.push(linked);
          console.log('[CastleKnight] ✓ Linked:', ts.name);
        }
      }
    });

    // Also ensure raw image-based tilesets are linked if not covered
    rawTilesets.filter(ts => ts.image).forEach(ts => {
      if (this.textures.exists(ts.name) && !allLinked.some(l => l.name === ts.name)) {
        const linked = map.addTilesetImage(ts.name, ts.name);
        if (linked) {
          allLinked.push(linked);
          console.log('[CastleKnight] ✓ Linked (raw):', ts.name);
        }
      }
    });

    console.log('[CastleKnight] Linked', allLinked.length, 'tilesets in total.');

    // 4. Iterate map.layers dynamically using all linked tilesets
    // FILTER: skip AutoMap/logic layers (Rules, RockSlopes_Auto, and any layer
    // whose name starts with 'rule_' or '_') — these contain tile letters like
    // 'E' and 'UP' from Tiled's AutoMap system and must never be rendered.
    const LOGIC_LAYER_NAMES = new Set([
      'Rules', 'RockSlopes_Auto', 'Object Shadows'
    ]);
    const isLogicLayer = (name) => {
      if (LOGIC_LAYER_NAMES.has(name)) return true;
      if (name.startsWith('rule_') || name.startsWith('_')) return true;
      return false;
    };

    let layerDepth = 0;
    this.layerGround = this.layerRoad = this.layerWater = null;
    this.layerRockSlopes = this.layerFlowers = this.layerShadows = null;

    map.layers.forEach(layerData => {
      const layerName = layerData.name;

      // Skip pure-logic / AutoMap layers — they must NOT be rendered
      if (isLogicLayer(layerName)) {
        console.log('[CastleKnight] Skipping logic layer (not rendered):', layerName);
        return;
      }

      const layer = map.createLayer(layerName, allLinked, 0, 0);
      if (!layer) {
        console.warn('[CastleKnight] createLayer returned null for:', layerName);
        return;
      }

      layer.setDepth(layerDepth);
      if (layerData.visible !== undefined) {
        layer.setVisible(layerData.visible);
      }
      if (layerName === 'Shadows') layer.setAlpha(0.25);

      console.log('[CastleKnight] Layer:', layerName, 'depth:', layerDepth);

      switch (layerName) {
        case 'Ground':         this.layerGround = layer;     break;
        case 'Road':           this.layerRoad = layer;       break;
        case 'Water':          this.layerWater = layer;      break;
        case 'RockSlopes':     this.layerRockSlopes = layer; break;
        case 'Flowers':        this.layerFlowers = layer;    break;
        case 'Shadows':        this.layerShadows = layer;    break;
      }
      layerDepth++;
    });

    // 6. Set camera and physics world bounds from actual tile map pixel dimensions
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    this.mapWidth = mapW;
    this.mapHeight = mapH;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    console.log('[CastleKnight] Map ready:', mapW, 'x', mapH, '| layers created:', layerDepth);

    // 7. Object Shadows (cast by houses & trees)
    this.renderObjectShadows();

    // 8. Tile Animations (water, flowers)
    this.setupTileAnimations();

    // 9. Object Layer: 2.5D sprites, campfire, doors
    this.renderTiledObjects();

    // 10. Dev Mode map markers
    this.createMapObjects();

    this.destroyLoadingText();
  }`;

const newCreateTiledMap = `  createTiledMap(mapKey) {
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
    map.tilesets.forEach(ts => {
      if (seenTilesets.has(ts.name)) return;
      seenTilesets.add(ts.name);

      let texKey = null;
      if (this.textures.exists(ts.name)) texKey = ts.name;
      else if (ts.image && this.textures.exists(ts.image)) texKey = ts.image;
      else if (ts.image) {
        const fn = ts.image.split('/').pop().replace(/\\.[^/.]+$/, '');
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
          const fn = ts.image.split('/').pop().replace(/\\.[^/.]+$/, '');
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
    // FILTER: skip AutoMap/logic layers (Rules, RockSlopes, Object Shadows, etc.)
    // RockSlopes (visible: false) has letters 'E'/'UP' from Tiled AutoMap and must NOT be rendered.
    // RockSlopes_Auto (visible: true) contains the actual rock slope textures and MUST be rendered!
    const LOGIC_LAYER_NAMES = new Set([
      'Rules', 'RockSlopes', 'Object Shadows', 'Collision', 'Collisions'
    ]);
    const isLogicLayer = (name, layerData) => {
      if (layerData && layerData.visible === false) return true;
      if (LOGIC_LAYER_NAMES.has(name)) return true;
      if (name.startsWith('rule_') || name.startsWith('_')) return true;
      return false;
    };

    let layerDepth = 0;
    this.layerGround = this.layerRoad = this.layerWater = null;
    this.layerRockSlopes = this.layerFlowers = this.layerShadows = null;

    map.layers.forEach(layerData => {
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

      // Explicit visual depth order:
      // Ground (0) -> Water (1) -> RockSlopes_Auto (2) -> Road (3) -> Flowers (4) -> Shadows (5)
      let depth = layerDepth;
      if (layerName === 'Ground') depth = 0;
      else if (layerName === 'Water') depth = 1;
      else if (layerName === 'RockSlopes_Auto') depth = 2;
      else if (layerName === 'Road') depth = 3;
      else if (layerName === 'Flowers') depth = 4;
      else if (layerName === 'Shadows') depth = 5;

      layer.setDepth(depth);
      if (layerData.visible !== undefined) {
        layer.setVisible(layerData.visible);
      }
      if (layerName === 'Shadows') layer.setAlpha(0.25);

      console.log('[CastleKnight] Layer:', layerName, 'depth:', depth);

      switch (layerName) {
        case 'Ground':          this.layerGround = layer;     break;
        case 'Water':           this.layerWater = layer;      break;
        case 'RockSlopes_Auto': this.layerRockSlopes = layer; break;
        case 'Road':            this.layerRoad = layer;       break;
        case 'Flowers':         this.layerFlowers = layer;    break;
        case 'Shadows':         this.layerShadows = layer;    break;
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
  }`;

if (!gameJs.includes(oldCreateTiledMap)) {
  console.error('Could not find oldCreateTiledMap in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldCreateTiledMap, newCreateTiledMap);

// 9. Update renderObjectShadows to track sprites
const oldRenderObjectShadows = `  renderObjectShadows() {
    const mapData = this.getMapData();
    if (!mapData || !mapData.layers) return;
    const shdLayer = mapData.layers.find(l => l.name === 'Object Shadows');
    if (!shdLayer || !shdLayer.objects) return;

    shdLayer.objects.forEach(obj => {
      const key = this.getTextureKeyForGid(obj.gid, mapData);
      if (key && this.textures.exists(key)) {
        this.add.sprite(obj.x, obj.y, key)
          .setOrigin(0, 1)
          .setDepth(6)
          .setAlpha(0.28);
      }
    });
  }`;

const newRenderObjectShadows = `  renderObjectShadows() {
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
  }`;

if (!gameJs.includes(oldRenderObjectShadows)) {
  console.error('Could not find oldRenderObjectShadows in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldRenderObjectShadows, newRenderObjectShadows);

// 10. Update renderTiledObjects and renderAnimatedDoors to track sprites
const oldRenderTiledObjects = `    // 1. Render Animated Campfire at (256, 496)
    if (this.textures.exists('campfire_anim')) {
      const campfire = this.add.sprite(256, 496, 'campfire_anim')
        .setOrigin(0, 1)
        .setDepth(496);
      if (this.anims.exists('campfire_burn')) {
        campfire.play('campfire_burn');
      }
      const glow = this.add.circle(272, 480, 28, 0xff7700, 0.2).setDepth(495);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.12, to: 0.28 },
        scale: { from: 0.9, to: 1.15 },
        duration: 650 + Math.random() * 300,
        yoyo: true,
        repeat: -1
      });
    }

    // 2. Render all other objects (Houses, Trees, Rocks, Props)
    objLayer.objects.forEach(obj => {
      // Campfire tiles handled above
      if (obj.gid >= 5770 && obj.gid <= 5801) return;

      const key = this.getTextureKeyForGid(obj.gid, mapData);
      if (key && this.textures.exists(key)) {
        this.add.sprite(obj.x, obj.y, key)
          .setOrigin(0, 1)
          .setDepth(obj.y);
      }
    });`;

const newRenderTiledObjects = `    this.campaignObjectSprites = this.campaignObjectSprites || [];

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
        const spr = this.add.sprite(obj.x, obj.y, key)
          .setOrigin(0, 1)
          .setDepth(obj.y);
        this.campaignObjectSprites.push(spr);
      }
    });`;

if (!gameJs.includes(oldRenderTiledObjects)) {
  console.error('Could not find oldRenderTiledObjects in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldRenderTiledObjects, newRenderTiledObjects);

const oldDoors = `    doors.forEach(d => {
      if (this.textures.exists(d.sheet)) {
        const doorSprite = this.add.sprite(d.x, d.y, d.sheet)
          .setOrigin(0.5, 1)
          .setDepth(d.depth);
        if (this.anims.exists(d.anim)) {
          doorSprite.play(d.anim);
        }
      }
    });`;

const newDoors = `    doors.forEach(d => {
      if (this.textures.exists(d.sheet)) {
        const doorSprite = this.add.sprite(d.x, d.y, d.sheet)
          .setOrigin(0.5, 1)
          .setDepth(d.depth);
        if (this.anims.exists(d.anim)) {
          doorSprite.play(d.anim);
        }
        if (this.campaignObjectSprites) this.campaignObjectSprites.push(doorSprite);
      }
    });`;

if (!gameJs.includes(oldDoors)) {
  console.error('Could not find oldDoors in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldDoors, newDoors);

// 11. Update getTextureKeyForGid
const oldGetTextureKeyForGid = `  getTextureKeyForGid(gid, mapData) {
    if (!gid || !mapData || !mapData.tilesets) return null;
    for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
      const ts = mapData.tilesets[i];
      if (gid >= ts.firstgid) {
        const tileId = gid - ts.firstgid;
        const td = ts.tiles ? ts.tiles.find(t => t.id === tileId) : null;
        if (td && td.image) {
          const raw = td.image.replace(/\\\\/g, '/');
          if (this.textures.exists(raw)) return raw;
          const fileName = raw.split('/').pop().replace(/\\.[^/.]+$/, '');
          if (this.textures.exists(fileName)) return fileName;
          const baseName = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (ts.name && ts.name.toLowerCase().includes('shadow')) {
            if (this.textures.exists('shd_' + baseName)) return 'shd_' + baseName;
          }
          if (this.textures.exists('obj_' + baseName)) return 'obj_' + baseName;
          if (this.textures.exists(baseName)) return baseName;
          return null;
        }
        return null;
      }
    }
    return null;
  }`;

const newGetTextureKeyForGid = `  getTextureKeyForGid(gid, mapData) {
    if (!gid || !mapData || !mapData.tilesets) return null;
    for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
      const ts = mapData.tilesets[i];
      if (gid >= ts.firstgid) {
        const tileId = gid - ts.firstgid;
        const td = ts.tiles ? ts.tiles.find(t => t.id === tileId) : null;
        if (td && td.image) {
          const raw = td.image.replace(/\\\\/g, '/');
          if (this.textures.exists(raw)) return raw;
          const fileName = raw.split('/').pop().replace(/\\.[^/.]+$/, '');
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
  }`;

if (!gameJs.includes(oldGetTextureKeyForGid)) {
  console.error('Could not find oldGetTextureKeyForGid in game.js!');
  process.exit(1);
}
gameJs = gameJs.replace(oldGetTextureKeyForGid, newGetTextureKeyForGid);

// Write to game.js
fs.writeFileSync(gameJsPath, gameJs, 'utf8');
console.log('Successfully patched js/game.js with clean boundaries!');
