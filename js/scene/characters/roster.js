'use strict';
/* Loads and animates the cast declared in js/config/characters.js: Aby, enemies, guards, villagers. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /** Queue every sheet of the roster. getAsset(key, path) returns the embedded copy when there is one. */
  preloadRoster(getAsset) {
    const EXTRA = window.CK_ANIMS_EXTRA || {};
    const sheet = (key, path, size) => { if (!EXTRA[key]) this.load.spritesheet(key, getAsset(key, path), { frameWidth: size, frameHeight: size }); };
    // the rest of the pack (js/chars_extra_assets.js): guards' attacks, enemies' extra attacks, blocks, summons, orc rider, villagers
    Object.keys(EXTRA).forEach(key => this.load.spritesheet(key, getAsset(key, 'assets/extra/' + key + '.png'), { frameWidth: /_villager$/.test(key) ? 32 : 100, frameHeight: /_villager$/.test(key) ? 32 : 100 }));
    Object.keys(HEROES.swordsman.frames).forEach(a => sheet(`swordsman_${a}`, `assets/characters/swordsman/${a}.png`, 100));
    Object.keys(ENEMY_TYPES).forEach(id => {
      if (id === 'orc') return;                                   // the orc sheets are loaded with the first heroes
      Object.keys(ENEMY_TYPES[id].frames).forEach(a => sheet(`${id}_${a}`, `assets/enemies/${id}/${a === 'attack1' ? 'attack' : a}.png`, 100));
    });
    // Lancent and Aby seen from the front and from behind (js/hero_dir2_assets.js)
    ['soldier', 'swordsman'].forEach(h => ['idle', 'walk', 'attack1'].forEach(a => ['front', 'back'].forEach(v => {
      const key = `${h}_${a}_${v}`;
      if (window.GAME_ASSETS_BASE64 && window.GAME_ASSETS_BASE64[key]) sheet(key, key, 100);
    })));
    sheet('bone_arrow', 'assets/enemies/bone_arrow.png', 100);
    sheet('necro_bolt', 'assets/enemies/necro_bolt.png', 100);
    GUARD_TYPES.forEach(id => ['idle', 'walk'].forEach(a => sheet(`g_${id}_${a}`, `assets/characters/guards/${id}/${a}.png`, 100)));
    const files = { npc5: 'MiniNobleWoman', npc6: 'MiniOldMan', npc7: 'MiniOldWoman', npc8: 'MiniPrincess', npc9: 'MiniQueen', npc10: 'MiniWorker' };
    Object.keys(VILLAGER_SHEETS).forEach(id => sheet(VILLAGER_SHEETS[id], `assets/npc/${files[id]}.png`, 32));
  },

  createRosterAnimations() {
    const make = (key, n, rate, repeat) => {
      if (this.anims.exists(key) || !this.textures.exists(key)) return;
      const total = this.textures.get(key).frameTotal - 1;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: Math.max(0, Math.min(n, total) - 1) }), frameRate: rate, repeat });
    };
    const RATE = { idle: [7, -1], walk: [11, -1], attack1: [14, 0], attack2: [16, 0], attack3: [16, 0], hurt: [12, 0], death: [8, 0] };
    const f = HEROES.swordsman.frames;
    Object.keys(f).forEach(a => make(`swordsman_${a}`, f[a], a === 'attack1' ? 18 : RATE[a][0], RATE[a][1]));
    Object.keys(ENEMY_TYPES).forEach(id => {
      if (id === 'orc') return;
      const fr = ENEMY_TYPES[id].frames;
      Object.keys(fr).forEach(a => make(`${id}_${a}`, fr[a], a === 'attack2' ? 12 : RATE[a][0], RATE[a][1]));
    });
    ['soldier', 'swordsman'].forEach(h => ['front', 'back'].forEach(v => { make(`${h}_idle_${v}`, 6, 7, -1); make(`${h}_walk_${v}`, 4, 7, -1); make(`${h}_attack1_${v}`, 5, 14, 0); }));
    // Lancent's second swing reuses the same front / back sheet
    ['front', 'back'].forEach(v => { const k = `soldier_attack1_${v}`; if (this.textures.exists(k) && !this.anims.exists(`soldier_attack2_${v}`)) this.anims.create({ key: `soldier_attack2_${v}`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: 4 }), frameRate: 14, repeat: 0 }); });
    make('necro_bolt', 6, 12, -1);
    if (this.anims.exists('necro_bolt') && !this.anims.exists('necro_bolt_fly')) {
      this.anims.create({ key: 'necro_bolt_fly', frames: this.anims.generateFrameNumbers('necro_bolt', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
    }
    // the sheet is a spell that falls and bursts on the ground: frames 0-2 the drop, 3-5 the burst
    if (this.textures.exists('necro_bolt') && !this.anims.exists('necro_bolt_fall')) {
      this.anims.create({ key: 'necro_bolt_fall', frames: this.anims.generateFrameNumbers('necro_bolt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
      this.anims.create({ key: 'necro_bolt_boom', frames: this.anims.generateFrameNumbers('necro_bolt', { start: 3, end: 5 }), frameRate: 9, repeat: 0 });
    }
    GUARD_TYPES.forEach(id => { make(`g_${id}_idle`, 6, 7, -1); make(`g_${id}_walk`, 8, 10, -1); });
    // the rest of the pack, with the frames counted by tools/pack/pack_extra.js
    const EXTRA = window.CK_ANIMS_EXTRA || {};
    const XRATE = { attack1: [14, 0], attack2: [14, 0], attack3: [14, 0], block: [12, 0], hurt: [12, 0], death: [8, 0], summon: [9, 0], heal: [10, 0], walk2: [12, -1], idle: [7, -1], walk: [11, -1] };
    Object.keys(EXTRA).forEach(key => {
      if (/_villager$/.test(key) || key === 'g_arrow') return;              // villagers: registerNPCAnimations; the arrow is a still image
      const anim = key.slice(key.lastIndexOf('_') + 1), r = XRATE[anim] || [12, 0];
      make(key, EXTRA[key], r[0], r[1]);
      // a guard that was knocked out gets back up: the fall played backwards
      if (anim === 'death' && /^g_/.test(key) && this.textures.exists(key) && !this.anims.exists(key.replace(/_death$/, '_rise')))
        this.anims.create({ key: key.replace(/_death$/, '_rise'), frames: this.anims.generateFrameNumbers(key, { start: 0, end: EXTRA[key] - 1 }).reverse(), frameRate: 8, repeat: 0 });
    });
  }
});
