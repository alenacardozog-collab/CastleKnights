'use strict';
/* Loads and animates the cast declared in js/config/characters.js: Aby, enemies, guards, villagers. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /** Queue every sheet of the roster. getAsset(key, path) returns the embedded copy when there is one. */
  preloadRoster(getAsset) {
    const sheet = (key, path, size) => this.load.spritesheet(key, getAsset(key, path), { frameWidth: size, frameHeight: size });
    Object.keys(HEROES.swordsman.frames).forEach(a => sheet(`swordsman_${a}`, `assets/characters/swordsman/${a}.png`, 100));
    Object.keys(ENEMY_TYPES).forEach(id => {
      if (id === 'orc') return;                                   // the orc sheets are loaded with the first heroes
      Object.keys(ENEMY_TYPES[id].frames).forEach(a => sheet(`${id}_${a}`, `assets/enemies/${id}/${a === 'attack1' ? 'attack' : a}.png`, 100));
    });
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
    make('necro_bolt', 6, 12, -1);
    if (this.anims.exists('necro_bolt') && !this.anims.exists('necro_bolt_fly')) {
      this.anims.create({ key: 'necro_bolt_fly', frames: this.anims.generateFrameNumbers('necro_bolt', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
    }
    GUARD_TYPES.forEach(id => { make(`g_${id}_idle`, 6, 7, -1); make(`g_${id}_walk`, 8, 10, -1); });
  }
});
