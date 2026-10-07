'use strict';
/* Asset loading: every image, sheet, sound and map the game uses is queued here. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  destroyLoadingText() {
    if (this.progressText) {
      try {
        this.progressText.destroy();
      } catch (e) { }
      this.progressText = null;
    }
  },

  preload() {
    // Show simple loading feedback
    this.progressText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Cargando CastleKnight...',
      { fontFamily: 'Pixuf, MedievalSharp, monospace', fontSize: '24px', fill: '#fcd567' }
    ).setOrigin(0.5);

    this.load.on('progress', (val) => {
      if (this.progressText && this.progressText.active) {
        this.progressText.setText(`Cargando Prototipo: ${Math.round(val * 100)}%`);
      }
    });

    this.load.on('complete', () => {
      this.destroyLoadingText();
    });

    const hasBase64 = typeof window !== 'undefined' && Boolean(window.GAME_ASSETS_BASE64);
    const hasMapBase64 = typeof window !== 'undefined' && Boolean(window.MAP_ASSETS_BASE64);
    const isFileProtocol = window.location.protocol === 'file:';

    const getAsset = (key, defaultPath) => {
      // Prioritize embedded base64 assets if available (guarantees offline & file:// support)
      if (hasBase64 && window.GAME_ASSETS_BASE64[key]) {
        return window.GAME_ASSETS_BASE64[key];
      }
      if (hasMapBase64) {
        if (window.MAP_ASSETS_BASE64[key]) return window.MAP_ASSETS_BASE64[key];
        if (defaultPath && window.MAP_ASSETS_BASE64[defaultPath]) return window.MAP_ASSETS_BASE64[defaultPath];
        const fileName = (defaultPath || key).split('/').pop().replace(/\.[^/.]+$/, '');
        if (window.MAP_ASSETS_BASE64[fileName]) return window.MAP_ASSETS_BASE64[fileName];
      }
      return defaultPath || key;
    };

    this.load.on('loaderror', (fileObj) => {
      console.warn(`[Asset Loader] Warning on "${fileObj.key}". Using fallback texture.`);
      const b64 = (hasMapBase64 && (window.MAP_ASSETS_BASE64[fileObj.key] || window.MAP_ASSETS_BASE64[fileObj.url])) ||
        (hasBase64 && window.GAME_ASSETS_BASE64[fileObj.key]);
      if (b64) {
        this.textures.addBase64(fileObj.key, b64);
      }
    });

    // 1. Tiled Map & Environment Tileset Sheets
    if (window.location && window.location.protocol === 'file:') {
      this.load.crossOrigin = '';
    }

    // Practice Map
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
    }

    // -- Preload ALL 129 Map Art PNG assets from assets/map/Art/ --
    // Each asset is registered under its full path, clean filename, and normalized keys
    const ALL_MAP_ART_PATHS = [
      "assets/map2/Art/Buildings/Animations/Door_Normal_Wood.png",
      "assets/map2/Art/Buildings/Animations/Door_Small_Wood.png",
      "assets/map2/Art/Buildings/Atlas/Buildings.png",
      "assets/map2/Art/Buildings/CityWall_Gate_1.png",
      "assets/map2/Art/Buildings/House_Hay_1.png",
      "assets/map2/Art/Buildings/House_Hay_2.png",
      "assets/map2/Art/Buildings/House_Hay_3.png",
      "assets/map2/Art/Buildings/House_Hay_4_Purple.png",
      "assets/map2/Art/Buildings/Well_Hay_1.png",
      "assets/map2/Art/Ground Tileset/Tileset_Ground.png",
      "assets/map2/Art/Ground Tileset/Tileset_Road.png",
      "assets/map2/Art/Props/Animation/Animation_Campfire.png",
      "assets/map2/Art/Props/Animation/Flowers_Red.png",
      "assets/map2/Art/Props/Animation/Flowers_White.png",
      "assets/map2/Art/Props/Atlas/Props.png",
      "assets/map2/Art/Props/Banner_Stick_1_Purple.png",
      "assets/map2/Art/Props/Barrel_Small_Empty.png",
      "assets/map2/Art/Props/Basket_Empty.png",
      "assets/map2/Art/Props/Bench_1.png",
      "assets/map2/Art/Props/Bench_3.png",
      "assets/map2/Art/Props/BulletinBoard_1.png",
      "assets/map2/Art/Props/Chopped_Tree_1.png",
      "assets/map2/Art/Props/Crate_Large_Empty.png",
      "assets/map2/Art/Props/Crate_Medium_Closed.png",
      "assets/map2/Art/Props/Crate_Water_1.png",
      "assets/map2/Art/Props/Fireplace_1.png",
      "assets/map2/Art/Props/HayStack_2.png",
      "assets/map2/Art/Props/LampPost_3.png",
      "assets/map2/Art/Props/Plant_2.png",
      "assets/map2/Art/Props/Sack_3.png",
      "assets/map2/Art/Props/Sign_1.png",
      "assets/map2/Art/Props/Sign_2.png",
      "assets/map2/Art/Props/Table_Medium_1.png",
      "assets/map2/Art/Rock Slopes/Tileset_RockSlope.png",
      "assets/map2/Art/Rock Slopes/Tileset_RockSlope_Simple.png",
      "assets/map2/Art/Rocks/Atlas/Rocks.png",
      "assets/map2/Art/Rocks/Rock_Brown_1.png",
      "assets/map2/Art/Rocks/Rock_Brown_2.png",
      "assets/map2/Art/Rocks/Rock_Brown_4.png",
      "assets/map2/Art/Rocks/Rock_Brown_6.png",
      "assets/map2/Art/Rocks/Rock_Brown_9.png",
      "assets/map2/Art/Shadows/Atlas/Tileset_Shadow.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x16_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x16_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x16_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x16_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x32_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x32_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x32_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_16x32_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x24_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x24_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x24_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x24_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x48_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x48_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x48_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_24x48_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x16_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x16_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x16_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x16_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x32_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x32_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x32_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_32x32_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_40x40_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_40x40_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_40x40_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_40x40_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x24_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x24_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x24_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x24_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x48_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x48_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x48_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Round_48x48_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x16_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x16_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x16_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x16_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x32_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x32_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x32_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_16x32_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x24_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x24_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x24_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x24_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x48_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x48_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x48_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_24x48_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x16_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x16_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x16_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x16_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x32_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x32_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x32_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_32x32_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_40x40_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_40x40_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_40x40_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_40x40_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x24_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x24_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x24_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x24_Short_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x48_Flat_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x48_Long_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x48_Medium_Black.png",
      "assets/map2/Art/Shadows/Shadow_Sqare_48x48_Short_Black.png",
      "assets/map2/Art/Tileset_Layout.png",
      "assets/map2/Art/Tileset_Layout_Small.png",
      "assets/map2/Art/Trees and Bushes/Atlas/Trees_Bushes.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_1.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_2.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_3.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_4.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_5.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_6.png",
      "assets/map2/Art/Trees and Bushes/Bush_Emerald_7.png",
      "assets/map2/Art/Trees and Bushes/Tree_Emerald_1.png",
      "assets/map2/Art/Trees and Bushes/Tree_Emerald_2.png",
      "assets/map2/Art/Trees and Bushes/Tree_Emerald_3.png",
      "assets/map2/Art/Trees and Bushes/Tree_Emerald_4.png",
      "assets/map2/Art/Water and Sand/Tileset_Water.png"
    ];

    ALL_MAP_ART_PATHS.forEach(p => {
      const src = getAsset(p, p);
      this.load.image(p, src);
      const legacyPath = p.replace('assets/map2/Art/', 'assets/map/Art/');
      this.load.image(legacyPath, src);
      const relPath = p.replace('assets/map2/', '');
      this.load.image(relPath, src);
      const fileName = p.split('/').pop().replace(/\.[^/.]+$/, '');
      this.load.image(fileName, getAsset(fileName, p));
      const norm = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      this.load.image('obj_' + norm, src);
      this.load.image('shd_' + norm, src);
      this.load.image(norm, src);
    });

    // Ensure all 41 props from MAP_ASSETS_CATALOG are loaded under key, path, and normalized names
    if (typeof MAP_ASSETS_CATALOG !== 'undefined') {
      MAP_ASSETS_CATALOG.forEach(item => {
        const filePath = item.path || ('assets/map/' + item.file);
        const src = getAsset(item.key, filePath);
        if (item.key && typeof item.key === 'string') {
          this.load.image(item.key, src);
        }
        if (filePath && typeof filePath === 'string') {
          this.load.image(filePath, src);
        }
        if (item.key && typeof item.key === 'string') {
          const norm = item.key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          this.load.image('obj_' + norm, src);
        }
      });
    }

    // Procedural lush meadow grass background texture
    this.createProceduralMeadowTexture();

    // -- Terrain tile-layer tilesets (used directly by tile layers) --
    // Load under exact Tiled tileset name, file name, and full image path
    const terrainTilesets = [
      { key: 'Tileset_Ground', path: 'assets/map2/Art/Ground Tileset/Tileset_Ground.png' },
      { key: 'Road', path: 'assets/map2/Art/Ground Tileset/Tileset_Road.png' },
      { key: 'Tileset_Road', path: 'assets/map2/Art/Ground Tileset/Tileset_Road.png' },
      { key: 'Tileset_Water', path: 'assets/map2/Art/Water and Sand/Tileset_Water.png' },
      { key: 'Tileset_RockSlope', path: 'assets/map2/Art/Rock Slopes/Tileset_RockSlope.png' },
      { key: 'Tileset_RockSlope_Simple', path: 'assets/map2/Art/Rock Slopes/Tileset_RockSlope_Simple.png' },
      { key: 'Animation_Flowers_Red', path: 'assets/map2/Art/Props/Animation/Flowers_Red.png' },
      { key: 'Animation_Flowers_White', path: 'assets/map2/Art/Props/Animation/Flowers_White.png' },
      { key: 'Tileset_Shadow', path: 'assets/map2/Art/Shadows/Atlas/Tileset_Shadow.png' },
      { key: 'Atlas_Buildings', path: 'assets/map2/Art/Buildings/Atlas/Buildings.png' },
      { key: 'Atlas_Props', path: 'assets/map2/Art/Props/Atlas/Props.png' },
      { key: 'Atlas_Rocks', path: 'assets/map2/Art/Rocks/Atlas/Rocks.png' },
      { key: 'Atlas_Trees_Bushes', path: 'assets/map2/Art/Trees and Bushes/Atlas/Trees_Bushes.png' },
      { key: 'Campfire', path: 'assets/map2/Art/Props/Animation/Animation_Campfire.png' },
      { key: 'fireplace', path: 'assets/map2/Art/Props/Fireplace_1.png' },
      { key: 'Fireplace_1', path: 'assets/map2/Art/Props/Fireplace_1.png' }
    ];

    terrainTilesets.forEach(tt => {
      const src = getAsset(tt.key, tt.path);
      this.load.image(tt.key, src);
      this.load.image(tt.path, src);
      const legacyPath = tt.path.replace('assets/map2/Art/', 'assets/map/Art/');
      this.load.image(legacyPath, src);
      const fn = tt.path.split('/').pop().replace(/\.[^/.]+$/, '');
      this.load.image(fn, src);
    });

    // 1.1 Animated Environment Spritesheets (Campfire & Doors)
    this.load.spritesheet('campfire_anim', getAsset('campfire_anim', 'assets/map2/Art/Props/Animation/Animation_Campfire.png'), {
      frameWidth: 32, frameHeight: 32
    });
    this.load.spritesheet('door_normal_anim', getAsset('door_normal_anim', 'assets/map2/Art/Buildings/Animations/Door_Normal_Wood.png'), {
      frameWidth: 16, frameHeight: 26
    });
    this.load.spritesheet('door_small_anim', getAsset('door_small_anim', 'assets/map2/Art/Buildings/Animations/Door_Small_Wood.png'), {
      frameWidth: 16, frameHeight: 20
    });

    // 1.2 NPC Villager spritesheets (4 unique villagers)
    const npc1Src = getAsset('npc1_villager', 'assets/npc/npc1villager.png');
    this.load.spritesheet('npc1_villager', npc1Src, {
      frameWidth: 32, frameHeight: 32
    });

    const npc2Src = getAsset('npc2_villager', 'assets/npc/npc2villager.png');
    this.load.spritesheet('npc2_villager', npc2Src, {
      frameWidth: 32, frameHeight: 32
    });

    const npc3Src = getAsset('npc3_villager', 'assets/npc/npc3villager.png');
    this.load.spritesheet('npc3_villager', npc3Src, {
      frameWidth: 32, frameHeight: 32
    });

    const npc4Src = getAsset('npc4_villager', 'assets/npc/npc4villager.png');
    this.load.spritesheet('npc4_villager', npc4Src, {
      frameWidth: 32, frameHeight: 32
    });

    // Interior furniture (PixelLab) and the barn cow
    CASTLE_ASSET_KEYS.forEach(k => this.load.image('cs_' + k, getAsset('cs_' + k, 'assets/castle/' + k + '.png')));
    RUINS_ASSET_KEYS.forEach(k => this.load.image('ru_' + k, getAsset('ru_' + k, 'assets/ruins/' + k + '.png')));
    Object.entries(MAP_SHEETS).forEach(([k, sh]) => this.load.spritesheet(k, getAsset(k, sh.file), { frameWidth: sh.fw, frameHeight: sh.fh }));
    const flameSize = (window.CASTLE_FIRE && window.CASTLE_FIRE.flame) || [31, 24];
    Object.entries(Object.assign({ flame: flameSize }, CASTLE_SHEETS)).forEach(([k, size]) => {
      this.load.spritesheet('cs_' + k, getAsset('cs_' + k, 'assets/castle/' + k + '.png'), { frameWidth: size[0], frameHeight: size[1] });
    });
    INTERIOR_ASSET_KEYS.forEach(k => {
      this.load.image('int_' + k, getAsset('int_' + k, 'assets/interiors/' + k + '.png'));
    });
    this.load.spritesheet('int_cow_idle', getAsset('int_cow_idle', 'assets/interiors/cow_idle.png'), { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('int_cow_walk', getAsset('int_cow_walk', 'assets/interiors/cow_walk.png'), { frameWidth: 32, frameHeight: 32 });

    // KingPrueba (NPC): 100x100 frames, same layout as the hero sheets
    this.load.spritesheet('king_idle', getAsset('king_idle', 'assets/characters/king/King_Idle.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('king_walk', getAsset('king_walk', 'assets/characters/king/King_Walk.png'), {
      frameWidth: 100, frameHeight: 100
    });

    // 2. ORC SPRITESHEETS (100x100 frames)
    this.load.spritesheet('orc_idle', getAsset('orc_idle', 'assets/characters/orc/idle.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('orc_walk', getAsset('orc_walk', 'assets/characters/orc/walk.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('orc_attack1', getAsset('orc_attack1', 'assets/characters/orc/attack1.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('orc_attack2', getAsset('orc_attack2', 'assets/characters/orc/attack2.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('orc_hurt', getAsset('orc_hurt', 'assets/characters/orc/hurt.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('orc_death', getAsset('orc_death', 'assets/characters/orc/death.png'), {
      frameWidth: 100, frameHeight: 100
    });

    // 3. SOLDIER SPRITESHEETS (100x100 frames)
    this.load.spritesheet('soldier_idle', getAsset('soldier_idle', 'assets/characters/soldier/idle.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_walk', getAsset('soldier_walk', 'assets/characters/soldier/walk.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_attack1', getAsset('soldier_attack1', 'assets/characters/soldier/attack1.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_attack2', getAsset('soldier_attack2', 'assets/characters/soldier/attack2.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_attack3', getAsset('soldier_attack3', 'assets/characters/soldier/attack3.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_hurt', getAsset('soldier_hurt', 'assets/characters/soldier/hurt.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_death', getAsset('soldier_death', 'assets/characters/soldier/death.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_dash', getAsset('soldier_dash', 'assets/characters/soldier/dash.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_spin', getAsset('soldier_spin', 'assets/characters/soldier/spin.png'), {
      frameWidth: 100, frameHeight: 100
    });

    // Projectile (Soldier Bow Arrow)
    this.load.image('arrow', getAsset('arrow', 'assets/characters/soldier/arrow.png'));

    // 3.5 WIZARD SPRITESHEETS (100x100 frames)
    this.load.spritesheet('wizard_idle', getAsset('wizard_idle', 'assets/characters/Wizard/Wizard with shadows/Wizard_Idle.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_walk', getAsset('wizard_walk', 'assets/characters/Wizard/Wizard with shadows/Wizard_Walk.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_attack1', getAsset('wizard_attack1', 'assets/characters/Wizard/Wizard with shadows/Wizard_Attack01(With magic effects).png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_attack2', getAsset('wizard_attack2', 'assets/characters/Wizard/Wizard with shadows/Wizard_Attack02(With magic effects).png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_hurt', getAsset('wizard_hurt', 'assets/characters/Wizard/Wizard with shadows/Wizard_Hurt.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_death', getAsset('wizard_death', 'assets/characters/Wizard/Wizard with shadows/Wizard_Death.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_dash', getAsset('wizard_dash', 'assets/characters/Wizard/dash_anim.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('soldier_arrowrain', getAsset('soldier_arrowrain', 'assets/characters/soldier/Soldier_ArrowRain.png'), {
      frameWidth: 100, frameHeight: 100
    });
    // Horos facing the camera / away from it (js/hero_dir_assets.js)
    [['idle', 'Idle'], ['walk', 'Walk'], ['attack1', 'Attack01'], ['attack2', 'Attack02']].forEach(([a, file]) => {
      ['front', 'back'].forEach(v => {
        const key = `wizard_${a}_${v}`;
        this.load.spritesheet(key, getAsset(key, `assets/characters/Wizard/Wizard_${file}_${v === 'front' ? 'Front' : 'Back'}.png`), { frameWidth: 100, frameHeight: 100 });
      });
    });
    this.load.spritesheet('wizard_thunder', getAsset('wizard_thunder', 'assets/characters/Wizard/Wizard_Thunder.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_fireball', getAsset('wizard_fireball', 'assets/characters/Wizard/Magic(projectile)/Wizard_Attack02_Effect.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_ice_shard', getAsset('wizard_ice_shard', 'assets/characters/Wizard/Magic(projectile)/Wizard_Attack01_Effect.png'), {
      frameWidth: 100, frameHeight: 100
    });

    // 3b. Aby, enemies by zone, castle guards and the new villagers (data: js/config/characters.js)
    this.preloadRoster(getAsset);

    // 4. Props & Map Decoratives
    this.createProceduralPropTextures();
  }
});
