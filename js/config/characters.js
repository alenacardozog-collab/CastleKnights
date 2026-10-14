'use strict';
/* Cast of the game as plain data: playable heroes, enemies (with the zone each one lives in),
   castle guards and villagers. To add a character: drop its sheets in assets/, run
   `npm run build:chars`, and add one entry here. Sheets are 100x100 frames unless noted. */

/** Playable heroes. `id` is also the prefix of its sheets/animations (soldier_idle, wizard_walk, …). */
const HEROES = {
  soldier:   { name: 'LANCENT', short: 'SOLDADO',  portrait: 'assets/UI/portraits/knight.png',    frame: 'assets/UI/icons/card_frame_soldier.png', color: 0xfbbf24, hurt: 'knight_hurt', death: 'knight_death' },
  wizard:    { name: 'HOROS',   short: 'MAGO',     portrait: 'assets/UI/portraits/wizard.png',    frame: 'assets/UI/icons/card_frame_wizard.png',  color: 0xc084fc, hurt: 'wizard_hurt', death: 'wizard_death' },
  orc:       { name: 'GORK',    short: 'ORCO',     portrait: 'assets/UI/portraits/orc.png',       frame: 'assets/UI/icons/card_frame_soldier.png', color: 0x86efac, hurt: 'orc_hurt',    death: 'orc_death' },
  swordsman: { name: 'ABY',     short: 'ESPADA',   portrait: 'assets/UI/portraits/swordsman.png', frame: 'assets/UI/icons/card_frame_soldier.png', color: 0xfb7185, hurt: 'aby_hurt',    death: 'aby_death',
               frames: { idle: 6, walk: 8, attack1: 7, attack2: 15, attack3: 12, hurt: 5, death: 4 } }
};

/**
 * Enemies. frames = number of frames of each sheet (assets/enemies/<id>/<anim>.png).
 * hp / dmg in hearts, speed in px/s, reach = melee distance, cd = ms between attacks,
 * hitAt = ms after the swing starts when the blow lands, xp / coins = reward.
 * ranged: { key, frames, speed, range } shoots a projectile instead of hitting.
 * block = chance (0..1) of raising the shield against a blow it sees coming (only the ones whose sheet has a block).
 * Extra attacks (attack2, attack3), blocks and summons come from js/chars_extra_assets.js and are used when the sheet exists.
 */
const ENEMY_TYPES = {
  orc:              { name: 'Orco',               frames: { idle: 6, walk: 8, attack1: 6, hurt: 4, death: 4 }, hp: 2, speed: 95,  dmg: 1, reach: 50, cd: 1400, hitAt: 220, xp: 10, coins: 2, sfx: ['orc_attack', 'orc_hurt', 'orc_death', 1] },
  orc_armored:      { name: 'Orco Acorazado',     frames: { idle: 6, walk: 8, attack1: 7, hurt: 4, death: 4 }, hp: 4, speed: 82,  dmg: 1, reach: 52, cd: 1500, hitAt: 260, xp: 18, coins: 4, block: 0.3, sfx: ['orc_attack', 'orc_hurt', 'orc_death', 0.85] },
  orc_elite:        { name: 'Orco de Élite',      frames: { idle: 6, walk: 8, attack1: 7, hurt: 4, death: 4 }, hp: 6, speed: 100, dmg: 2, reach: 56, cd: 1600, hitAt: 280, xp: 30, coins: 7, scale: 1.35, sfx: ['orc_attack', 'orc_hurt', 'orc_death', 0.72] },
  orc_rider:        { name: 'Orco Jinete',        frames: { idle: 6, walk: 8, attack1: 8, hurt: 4, death: 4 }, hp: 6, speed: 118, dmg: 1, reach: 58, cd: 1350, hitAt: 330, xp: 28, coins: 6, scale: 1.25, block: 0.25, sfx: ['orc_attack', 'orc_hurt', 'orc_death', 0.8] },
  slime:            { name: 'Limo',               frames: { idle: 6, walk: 6, attack1: 6, hurt: 4, death: 4 }, hp: 1, speed: 60,  dmg: 1, reach: 40, cd: 1700, hitAt: 240, xp: 5,  coins: 1, sfx: ['slime_hit', 'slime_hit', 'slime_death', 1] },
  bat:              { name: 'Murciélago',         frames: { idle: 6, walk: 6, attack1: 6, hurt: 4, death: 4 }, hp: 1, speed: 135, dmg: 1, reach: 40, cd: 1300, hitAt: 180, xp: 6,  coins: 1, flying: true, sfx: ['bat_screech', 'bat_screech', 'bat_screech', 1] },
  werewolf:         { name: 'Hombre Lobo',        frames: { idle: 6, walk: 8, attack1: 9, hurt: 4, death: 4 }, hp: 4, speed: 128, dmg: 1, reach: 52, cd: 1200, hitAt: 300, xp: 22, coins: 5, sfx: ['beast_growl', 'beast_hurt', 'beast_death', 1.1] },
  werebear:         { name: 'Hombre Oso',         frames: { idle: 6, walk: 8, attack1: 9, hurt: 4, death: 4 }, hp: 7, speed: 78,  dmg: 2, reach: 54, cd: 1800, hitAt: 340, xp: 32, coins: 8, scale: 1.35, sfx: ['beast_growl', 'beast_hurt', 'beast_death', 0.75] },
  skeleton:         { name: 'Esqueleto',          frames: { idle: 6, walk: 8, attack1: 6, hurt: 4, death: 4 }, hp: 2, speed: 80,  dmg: 1, reach: 50, cd: 1400, hitAt: 230, xp: 10, coins: 2, block: 0.2, sfx: ['sword_swing1', 'bone_hit', 'bone_death', 1] },
  skeleton_armored: { name: 'Esqueleto Acorazado',frames: { idle: 6, walk: 8, attack1: 8, hurt: 4, death: 4 }, hp: 4, speed: 72,  dmg: 1, reach: 54, cd: 1500, hitAt: 280, xp: 18, coins: 4, sfx: ['sword_swing2', 'bone_hit', 'bone_death', 0.85] },
  skeleton_great:   { name: 'Gran Esqueleto',     frames: { idle: 6, walk: 9, attack1: 9, hurt: 4, death: 4 }, hp: 7, speed: 68,  dmg: 2, reach: 62, cd: 1900, hitAt: 360, xp: 34, coins: 8, scale: 1.35, sfx: ['sword_swing2', 'bone_hit', 'bone_death', 0.7] },
  skeleton_archer:  { name: 'Esqueleto Arquero',  frames: { idle: 6, walk: 8, attack1: 9, hurt: 4, death: 4 }, hp: 2, speed: 70,  dmg: 1, reach: 50, cd: 2200, hitAt: 420, xp: 14, coins: 3, sfx: ['bow_shot', 'bone_hit', 'bone_death', 1],
                      ranged: { key: 'bone_arrow', frames: 1, speed: 230, range: 210 } },
  necromancer:      { name: 'El Nigromante',      frames: { idle: 6, walk: 6, attack1: 9, attack2: 10, hurt: 4, death: 9 }, hp: 24, speed: 55, dmg: 1, reach: 50, cd: 2100, hitAt: 400, xp: 150, coins: 40, scale: 1.5, boss: true,
                      // up close he swings the scythe (attack1); from afar he casts (attack2) a drop of necromancy that falls on a
                      // marked spot and bursts (necro_bolt: frames 0-2 falling, 3-5 burst). meleeToo: both kinds of attack
                      meleeToo: true, rangedAnim: 'attack2', rangedHitAt: 420,
                      sfx: ['necro_cast', 'wizard_hurt', 'necro_death', 0.8], ranged: { key: 'necro_bolt', frames: 6, mode: 'drop', range: 300, radius: 26, fall: 520 },
                      summon: { type: 'skeleton', every: 9000, max: 4 } }
};

/** Practice arena: which enemies may appear from which wave on. */
const PRACTICE_WAVES = [
  { from: 1, types: ['orc'] },
  { from: 2, types: ['orc', 'orc', 'slime', 'orc_armored'] },
  { from: 3, types: ['orc', 'orc_armored', 'skeleton', 'bat'] },
  { from: 4, types: ['orc_armored', 'orc_elite', 'skeleton_armored', 'skeleton_archer', 'werewolf'] },
  { from: 5, types: ['orc_armored', 'orc_elite', 'orc_rider', 'skeleton_armored', 'skeleton_archer', 'werewolf'] },
  { from: 6, types: ['orc_elite', 'orc_rider', 'skeleton_great', 'werewolf', 'werebear', 'skeleton_archer'] }
];

/**
 * Enemies of each campaign zone ("<building>.<area>"). Each entry: [type, x, y, radius]
 * (area-local pixels; the enemy appears on a free spot inside that circle).
 * A fifth value 'night' makes that enemy appear only at night.
 * They come back when the hero leaves the zone and returns, except bosses already beaten.
 */
const ZONE_ENEMIES = {
  // forest road to the castle: beasts in the woods, never on the stretch next to the gate
  'castle.road': [
    ['slime', 180, 560, 50], ['slime', 250, 600, 50], ['slime', 760, 620, 60],
    ['bat', 120, 420, 60], ['bat', 880, 520, 60],
    ['werewolf', 820, 640, 50], ['werebear', 880, 250, 60],
    ['werewolf', 300, 480, 60, 'night'], ['bat', 500, 560, 80, 'night'], ['bat', 700, 480, 80, 'night']
  ],
  // the ruined village: the dead walk here
  'ruins.village': [
    ['skeleton', 470, 700, 50], ['skeleton', 640, 690, 50], ['skeleton', 560, 520, 60],
    ['skeleton_archer', 360, 520, 40], ['skeleton_archer', 760, 400, 40],
    ['skeleton_armored', 230, 470, 50], ['skeleton_armored', 690, 300, 40],
    ['bat', 170, 300, 60], ['bat', 900, 300, 60], ['bat', 420, 180, 50],
    ['slime', 860, 600, 60], ['slime', 930, 520, 50], ['slime', 800, 700, 40],
    ['skeleton_great', 760, 230, 40],
    ['skeleton_armored', 520, 620, 60, 'night'], ['skeleton_archer', 620, 560, 50, 'night'], ['bat', 560, 700, 80, 'night']
    // (the Necromancer comes out of the chapel during the quest: see js/scene/systems/story.js)
  ]
};

/** Castle staff: sheets assets/characters/guards/<id>/{idle,walk}.png (6 and 8 frames). */
const GUARD_TYPES = ['knight', 'templar', 'lancer', 'axeman', 'archer', 'priest'];

/** Villager sheets (32x32 frames, 6 columns): idle 0-3, walk 6-11, jump 12-14. */
const VILLAGER_SHEETS = {
  npc5: 'npc5_villager',   // noble woman
  npc6: 'npc6_villager',   // old man
  npc7: 'npc7_villager',   // old woman
  npc8: 'npc8_villager',   // princess
  npc9: 'npc9_villager',   // queen
  npc10: 'npc10_villager', // worker
  // from js/chars_extra_assets.js
  npc11: 'npc11_villager', // noble man
  npc12: 'npc12_villager', // peasant (pitchfork)
  npc13: 'npc13_villager', // villager man
  npc14: 'npc14_villager'  // villager woman
};
