/**
 * TAVERN SIEGE - Top-Down RPG Prototype in Phaser 3
 * Fully featured with:
 * - Furnies static background map & camera centered on player
 * - Orc and Soldier playable characters with 100x100 animation frames
 * - 4-directional WASD movement with world boundary collisions
 * - Dynamic generic enemy spawning with AI chasing and attack behaviors
 * - Melee combo attacks & Soldier bow ranged attacks
 * - 3 Hearts health system with invulnerability frames and damage reactions
 * - Fullscreen toggle, Web Audio API sound FX, particle effects
 */

// ==========================================
// 1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSwing() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) { }
  }

  playSpin() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) { }
  }

  playAlert() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) { }
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Low punch osc
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // Noise burst for crunch
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) { }
  }

  playPlayerHurt() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) { }
  }

  playEnemyDeath() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(180, now + 0.08);
      osc.frequency.setValueAtTime(90, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) { }
  }

  playShoot() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) { }
  }

  playHeartPickup() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(783.99, now + 0.09); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) { }
  }

  playDash() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) { }
  }

  playGameOver() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [220, 196, 174, 146];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.35, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + (idx + 1) * 0.15);
      });
    } catch (e) { }
  }

  playMagic() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.28);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) { }
  }

  playFireball() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) { }
  }
}

const sfx = new SoundFX();

// ==========================================
// 1.2 BACKGROUND MUSIC PLAYER (IntroSong & villageSong)
// ==========================================
class MusicPlayer {
  constructor() {
    this.currentTrack = null; // 'intro' | 'village' | null
    this.audioElements = {
      intro: null,
      village: null
    };
    this.enabled = true;
    this.volume = 0.40;
    this._userUnlocked = false;
    this._pendingTrack = null;
  }

  init() {
    if (!this.audioElements.intro) {
      const intro = new Audio('assets/Music/IntroSong.mp3');
      intro.loop = true;
      intro.preload = 'auto';
      intro.volume = this.enabled ? this.volume : 0;
      this.audioElements.intro = intro;
    }
    if (!this.audioElements.village) {
      const village = new Audio('assets/Music/villageSong.mp3');
      village.loop = true;
      village.preload = 'auto';
      village.volume = this.enabled ? this.volume : 0;
      this.audioElements.village = village;
    }

    if (!this._userUnlocked) {
      const unlockAudio = () => {
        this._userUnlocked = true;
        if (this._pendingTrack && this.enabled) {
          const trackToPlay = this._pendingTrack;
          this._pendingTrack = null;
          this.play(trackToPlay);
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('click', unlockAudio, { once: true });
    }
  }

  play(track) {
    this.init();
    this._pendingTrack = track;
    if (this.currentTrack === track && this.audioElements[track] && !this.audioElements[track].paused) {
      return;
    }

    // Pause other tracks
    Object.keys(this.audioElements).forEach(key => {
      if (key !== track && this.audioElements[key]) {
        try {
          this.audioElements[key].pause();
          this.audioElements[key].currentTime = 0;
        } catch (e) { }
      }
    });

    const audio = this.audioElements[track];
    if (audio) {
      this.currentTrack = track;
      audio.volume = this.enabled ? this.volume : 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay restricted until user interaction
        });
      }
    }
  }

  stopAll() {
    this.currentTrack = null;
    this._pendingTrack = null;
    Object.keys(this.audioElements).forEach(key => {
      if (this.audioElements[key]) {
        try {
          this.audioElements[key].pause();
          this.audioElements[key].currentTime = 0;
        } catch (e) { }
      }
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    Object.keys(this.audioElements).forEach(key => {
      const el = this.audioElements[key];
      if (el) {
        el.volume = enabled ? this.volume : 0;
      }
    });
    if (enabled && this.currentTrack) {
      const audio = this.audioElements[this.currentTrack];
      if (audio && audio.paused) {
        audio.play().catch(() => { });
      }
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.enabled) {
      Object.keys(this.audioElements).forEach(key => {
        const el = this.audioElements[key];
        if (el) el.volume = this.volume;
      });
    }
  }
}

const music = new MusicPlayer();

// ==========================================
// 1.4 MAP CONFIGURATION & 41 ASSETS CATALOG (ASSETS/MAP)
// ==========================================
const MAP_ASSETS_CATALOG = [
  // EDIFICIOS (Buildings)
  { key: 'House_Hay_1', file: 'House_Hay_1.png', w: 88, h: 103, cat: 'buildings', name: 'Casa de Paja 1' },
  { key: 'House_Hay_2', file: 'House_Hay_2.png', w: 157, h: 112, cat: 'buildings', name: 'Casa de Paja 2' },
  { key: 'House_Hay_3', file: 'House_Hay_3.png', w: 180, h: 128, cat: 'buildings', name: 'Gran Casa Hay 3' },
  { key: 'House_Hay_4_Purple', file: 'House_Hay_4_Purple.png', w: 128, h: 128, cat: 'buildings', name: 'Mansión Real Púrpura' },
  { key: 'CityWall_Gate_1', file: 'CityWall_Gate_1.png', w: 80, h: 96, cat: 'buildings', name: 'Portón de Muralla' },
  { key: 'Well_Hay_1', file: 'Well_Hay_1.png', w: 56, h: 75, cat: 'buildings', name: 'Pozo de Agua' },

  // ÁRBOLES & PLANTAS (Trees & Foliage)
  { key: 'Tree_Emerald_1', file: 'Tree_Emerald_1.png', w: 64, h: 63, cat: 'trees', name: 'Árbol Esmeralda 1' },
  { key: 'Tree_Emerald_2', file: 'Tree_Emerald_2.png', w: 46, h: 63, cat: 'trees', name: 'Árbol Esmeralda 2' },
  { key: 'Tree_Emerald_3', file: 'Tree_Emerald_3.png', w: 52, h: 92, cat: 'trees', name: 'Gran Roble 3' },
  { key: 'Tree_Emerald_4', file: 'Tree_Emerald_4.png', w: 48, h: 93, cat: 'trees', name: 'Pino Imperial 4' },
  { key: 'Bush_Emerald_1', file: 'Bush_Emerald_1.png', w: 40, h: 29, cat: 'trees', name: 'Arbusto Esmeralda 1' },
  { key: 'Bush_Emerald_2', file: 'Bush_Emerald_2.png', w: 48, h: 16, cat: 'trees', name: 'Arbusto Ancho 2' },
  { key: 'Bush_Emerald_3', file: 'Bush_Emerald_3.png', w: 28, h: 28, cat: 'trees', name: 'Arbusto Esmeralda 3' },
  { key: 'Bush_Emerald_4', file: 'Bush_Emerald_4.png', w: 16, h: 28, cat: 'trees', name: 'Arbusto Fino 4' },
  { key: 'Bush_Emerald_5', file: 'Bush_Emerald_5.png', w: 14, h: 14, cat: 'trees', name: 'Arbusto Pequeño 5' },
  { key: 'Bush_Emerald_6', file: 'Bush_Emerald_6.png', w: 15, h: 10, cat: 'trees', name: 'Arbusto Pequeño 6' },
  { key: 'Bush_Emerald_7', file: 'Bush_Emerald_7.png', w: 12, h: 9, cat: 'trees', name: 'Hierba Pequeña 7' },
  { key: 'Chopped_Tree_1', file: 'Chopped_Tree_1.png', w: 32, h: 31, cat: 'trees', name: 'Tronco Cortado' },
  { key: 'Plant_2', file: 'Plant_2.png', w: 15, h: 11, cat: 'trees', name: 'Planta Silvestre' },

  // ROCAS (Rocks)
  { key: 'Rock_Brown_1', file: 'Rock_Brown_1.png', w: 28, h: 13, cat: 'rocks', name: 'Roca Café Plana' },
  { key: 'Rock_Brown_2', file: 'Rock_Brown_2.png', w: 15, h: 29, cat: 'rocks', name: 'Roca Café Alta' },
  { key: 'Rock_Brown_4', file: 'Rock_Brown_4.png', w: 27, h: 26, cat: 'rocks', name: 'Roca Café Mediana' },
  { key: 'Rock_Brown_6', file: 'Rock_Brown_6.png', w: 14, h: 13, cat: 'rocks', name: 'Roca Café Pequeña' },
  { key: 'Rock_Brown_9', file: 'Rock_Brown_9.png', w: 9, h: 11, cat: 'rocks', name: 'Piedra Diminuta' },

  // MUEBLES & PROPS (Furniture & Scenery Props)
  { key: 'Barrel_Small_Empty', file: 'Barrel_Small_Empty.png', w: 16, h: 20, cat: 'props', name: 'Barril de Madera' },
  { key: 'Basket_Empty', file: 'Basket_Empty.png', w: 22, h: 17, cat: 'props', name: 'Cesta Vacía' },
  { key: 'Bench_1', file: 'Bench_1.png', w: 14, h: 30, cat: 'props', name: 'Banco Largo' },
  { key: 'Bench_3', file: 'Bench_3.png', w: 14, h: 14, cat: 'props', name: 'Banco Pequeño' },
  { key: 'BulletinBoard_1', file: 'BulletinBoard_1.png', w: 44, h: 42, cat: 'props', name: 'Tablón de Anuncios' },
  { key: 'Crate_Large_Empty', file: 'Crate_Large_Empty.png', w: 24, h: 29, cat: 'props', name: 'Cajón Grande' },
  { key: 'Crate_Medium_Closed', file: 'Crate_Medium_Closed.png', w: 16, h: 21, cat: 'props', name: 'Cajón Cerrado' },
  { key: 'Crate_Water_1', file: 'Crate_Water_1.png', w: 30, h: 22, cat: 'props', name: 'Caja con Agua' },
  { key: 'HayStack_2', file: 'HayStack_2.png', w: 29, h: 32, cat: 'props', name: 'Pajar de Heno' },
  { key: 'Sack_3', file: 'Sack_3.png', w: 16, h: 14, cat: 'props', name: 'Saco de Harina' },
  { key: 'Sign_1', file: 'Sign_1.png', w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 1' },
  { key: 'Sign_2', file: 'Sign_2.png', w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 2' },
  { key: 'Table_Medium_1', file: 'Table_Medium_1.png', w: 42, h: 39, cat: 'props', name: 'Mesa de Madera' },
  { key: 'Banner_Stick_1_Purple', file: 'Banner_Stick_1_Purple.png', w: 24, h: 59, cat: 'props', name: 'Estandarte Púrpura' },

  // LUCES & FUEGO (Lights & Fire)
  { key: 'Animation_Campfire', file: 'Animation_Campfire.png', w: 32, h: 32, cat: 'lights', name: 'Hoguera de Aldea' },
  { key: 'Fireplace_1', file: 'Fireplace_1.png', w: 30, h: 26, cat: 'lights', name: 'Chimenea de Piedra' },
  { key: 'LampPost_3', file: 'LampPost_3.png', w: 46, h: 62, cat: 'lights', name: 'Farol de Hierro' }
];

// Pixel-perfect collision metadata for each asset (guarantees hitboxes never spill over)
const MAP_ASSET_METADATA = {
  'House_Hay_1': {
    w: 88, h: 103, cat: 'buildings', name: 'Casa de Paja 1',
    // Dual foundations: leaves doorway/steps at offX: 30..48 completely open
    boxes: [
      { offX: 5, offY: 58, hitW: 25, hitH: 45 },
      { offX: 48, offY: 58, hitW: 35, hitH: 45 }
    ],
    hitW: 78, hitH: 45, hitOffsetY: 58, hitOffsetX: 5
  },
  'House_Hay_2': {
    w: 157, h: 112, cat: 'buildings', name: 'Casa de Paja 2',
    // L-shaped house: dual foundations (left wing wall + right wing ground floor)
    boxes: [
      { offX: 4, offY: 50, hitW: 66, hitH: 28 },
      { offX: 72, offY: 82, hitW: 80, hitH: 30 }
    ],
    hitW: 148, hitH: 30, hitOffsetY: 82, hitOffsetX: 5
  },
  'House_Hay_3': {
    w: 180, h: 128, cat: 'buildings', name: 'Gran Casa Hay 3',
    // Left stone stairs (offX: 0..46) are completely open for climbing up to the terrace
    boxes: [
      { offX: 46, offY: 76, hitW: 30, hitH: 52 },
      { offX: 88, offY: 80, hitW: 86, hitH: 48 }
    ],
    hitW: 128, hitH: 50, hitOffsetY: 78, hitOffsetX: 46
  },
  'House_Hay_4_Purple': {
    w: 128, h: 128, cat: 'buildings', name: 'Mansión Real Púrpura',
    // Porch steps leading into front door (offX: 42..70) are completely open
    boxes: [
      { offX: 8, offY: 86, hitW: 34, hitH: 42 },
      { offX: 70, offY: 92, hitW: 54, hitH: 36 }
    ],
    hitW: 116, hitH: 40, hitOffsetY: 88, hitOffsetX: 8
  },
  'CityWall_Gate_1': { w: 80, h: 96, cat: 'buildings', name: 'Portón de Muralla', hitW: 76, hitH: 44, hitOffsetY: 52, hitOffsetX: 2 },
  'Well_Hay_1': { w: 56, h: 75, cat: 'buildings', name: 'Pozo de Agua', hitW: 46, hitH: 26, hitOffsetY: 48, hitOffsetX: 5 },

  'Tree_Emerald_1': { w: 64, h: 63, cat: 'trees', name: 'Árbol Esmeralda 1', hitW: 20, hitH: 12, hitOffsetY: 51, hitOffsetX: 22 },
  'Tree_Emerald_2': { w: 46, h: 63, cat: 'trees', name: 'Árbol Esmeralda 2', hitW: 18, hitH: 12, hitOffsetY: 51, hitOffsetX: 14 },
  'Tree_Emerald_3': { w: 52, h: 92, cat: 'trees', name: 'Gran Roble 3', hitW: 20, hitH: 14, hitOffsetY: 78, hitOffsetX: 16 },
  'Tree_Emerald_4': { w: 48, h: 93, cat: 'trees', name: 'Pino Imperial 4', hitW: 18, hitH: 14, hitOffsetY: 79, hitOffsetX: 15 },
  'Bush_Emerald_1': { w: 40, h: 29, cat: 'trees', name: 'Arbusto Esmeralda 1', hitW: 34, hitH: 18, hitOffsetY: 11, hitOffsetX: 3 },
  'Bush_Emerald_2': { w: 48, h: 16, cat: 'trees', name: 'Arbusto Ancho 2', hitW: 42, hitH: 12, hitOffsetY: 4, hitOffsetX: 3 },
  'Bush_Emerald_3': { w: 28, h: 28, cat: 'trees', name: 'Arbusto Esmeralda 3', hitW: 24, hitH: 16, hitOffsetY: 12, hitOffsetX: 2 },
  'Bush_Emerald_4': { w: 16, h: 28, cat: 'trees', name: 'Arbusto Fino 4', hitW: 14, hitH: 14, hitOffsetY: 14, hitOffsetX: 1 },
  'Bush_Emerald_5': { w: 14, h: 14, cat: 'trees', name: 'Arbusto Pequeño 5', hitW: 12, hitH: 10, hitOffsetY: 4, hitOffsetX: 1 },
  'Bush_Emerald_6': { w: 15, h: 10, cat: 'trees', name: 'Arbusto Pequeño 6', hitW: 12, hitH: 8, hitOffsetY: 2, hitOffsetX: 1 },
  'Bush_Emerald_7': { w: 12, h: 9, cat: 'trees', name: 'Hierba Pequeña 7', hitW: 10, hitH: 7, hitOffsetY: 2, hitOffsetX: 1 },
  'Chopped_Tree_1': { w: 32, h: 31, cat: 'trees', name: 'Tronco Cortado', hitW: 26, hitH: 18, hitOffsetY: 13, hitOffsetX: 3 },
  'Plant_2': { w: 15, h: 11, cat: 'trees', name: 'Planta Silvestre', hitW: 12, hitH: 8, hitOffsetY: 3, hitOffsetX: 1 },

  'Rock_Brown_1': { w: 28, h: 13, cat: 'rocks', name: 'Roca Café Plana', hitW: 26, hitH: 11, hitOffsetY: 2, hitOffsetX: 1 },
  'Rock_Brown_2': { w: 15, h: 29, cat: 'rocks', name: 'Roca Café Alta', hitW: 13, hitH: 18, hitOffsetY: 11, hitOffsetX: 1 },
  'Rock_Brown_4': { w: 27, h: 26, cat: 'rocks', name: 'Roca Café Mediana', hitW: 24, hitH: 18, hitOffsetY: 8, hitOffsetX: 2 },
  'Rock_Brown_6': { w: 14, h: 13, cat: 'rocks', name: 'Roca Café Pequeña', hitW: 12, hitH: 10, hitOffsetY: 3, hitOffsetX: 1 },
  'Rock_Brown_9': { w: 9, h: 11, cat: 'rocks', name: 'Piedra Diminuta', hitW: 8, hitH: 8, hitOffsetY: 3, hitOffsetX: 1 },

  'Barrel_Small_Empty': { w: 16, h: 20, cat: 'props', name: 'Barril de Madera', hitW: 14, hitH: 14, hitOffsetY: 6, hitOffsetX: 1 },
  'Basket_Empty': { w: 22, h: 17, cat: 'props', name: 'Cesta Vacía', hitW: 18, hitH: 12, hitOffsetY: 5, hitOffsetX: 2 },
  'Bench_1': { w: 14, h: 30, cat: 'props', name: 'Banco Largo', hitW: 12, hitH: 24, hitOffsetY: 6, hitOffsetX: 1 },
  'Bench_3': { w: 14, h: 14, cat: 'props', name: 'Banco Pequeño', hitW: 12, hitH: 12, hitOffsetY: 2, hitOffsetX: 1 },
  'BulletinBoard_1': { w: 44, h: 42, cat: 'props', name: 'Tablón de Anuncios', hitW: 38, hitH: 18, hitOffsetY: 24, hitOffsetX: 3 },
  'Crate_Large_Empty': { w: 24, h: 29, cat: 'props', name: 'Cajón Grande', hitW: 22, hitH: 20, hitOffsetY: 9, hitOffsetX: 1 },
  'Crate_Medium_Closed': { w: 16, h: 21, cat: 'props', name: 'Cajón Cerrado', hitW: 14, hitH: 14, hitOffsetY: 7, hitOffsetX: 1 },
  'Crate_Water_1': { w: 30, h: 22, cat: 'props', name: 'Caja con Agua', hitW: 26, hitH: 16, hitOffsetY: 6, hitOffsetX: 2 },
  'HayStack_2': { w: 29, h: 32, cat: 'props', name: 'Pajar de Heno', hitW: 24, hitH: 20, hitOffsetY: 12, hitOffsetX: 2 },
  'Sack_3': { w: 16, h: 14, cat: 'props', name: 'Saco de Harina', hitW: 14, hitH: 12, hitOffsetY: 2, hitOffsetX: 1 },
  'Sign_1': { w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 1', hitW: 12, hitH: 12, hitOffsetY: 10, hitOffsetX: 6 },
  'Sign_2': { w: 24, h: 22, cat: 'props', name: 'Cartel de Madera 2', hitW: 12, hitH: 12, hitOffsetY: 10, hitOffsetX: 6 },
  'Table_Medium_1': { w: 42, h: 39, cat: 'props', name: 'Mesa de Madera', hitW: 38, hitH: 24, hitOffsetY: 15, hitOffsetX: 2 },
  'Banner_Stick_1_Purple': { w: 24, h: 59, cat: 'props', name: 'Estandarte Púrpura', hitW: 12, hitH: 14, hitOffsetY: 45, hitOffsetX: 6 },

  'Animation_Campfire': { w: 32, h: 32, cat: 'lights', name: 'Hoguera de Aldea', hitW: 26, hitH: 18, hitOffsetY: 14, hitOffsetX: 3 },
  'Fireplace_1': { w: 30, h: 26, cat: 'lights', name: 'Chimenea de Piedra', hitW: 28, hitH: 20, hitOffsetY: 6, hitOffsetX: 1 },
  'LampPost_3': { w: 46, h: 62, cat: 'lights', name: 'Farol de Hierro', hitW: 14, hitH: 14, hitOffsetY: 48, hitOffsetX: 16 }
};

/**
 * Calculate pixel-tight collision box for any placed prop or object
 * Guarantees hitbox matches the solid foundation without spilling over the sprite pixels
 */
function calculateFitHitboxStatic(prop) {
  if (!prop) return null;
  const key = prop.assetKey || prop.type;
  if (key === 'player_spawn' || key === 'enemy_spawn') return null;

  const meta = MAP_ASSET_METADATA[key];
  const originX = prop.originX !== undefined ? prop.originX : 0.5;
  const originY = prop.originY !== undefined ? prop.originY : 1;

  const w = prop.w || (meta ? meta.w : 32);
  const h = prop.h || (meta ? meta.h : 32);

  const left = Math.round(prop.x - originX * w);
  const top = Math.round(prop.y - originY * h);

  let hitW, hitH, hitX, hitY;

  if (meta) {
    hitW = meta.hitW;
    hitH = meta.hitH;
    hitX = left + meta.hitOffsetX;
    hitY = top + meta.hitOffsetY;
  } else {
    const nameLower = (prop.name || key).toLowerCase();
    if (nameLower.includes('tree') || nameLower.includes('roble') || nameLower.includes('pino')) {
      hitW = Math.max(16, Math.round(w * 0.42));
      hitH = Math.max(12, Math.round(h * 0.20));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    } else if (nameLower.includes('house') || nameLower.includes('casa') || nameLower.includes('wall') || nameLower.includes('gate')) {
      hitW = Math.max(24, Math.round(w * 0.88));
      hitH = Math.max(20, Math.round(h * 0.44));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    } else {
      hitW = Math.max(10, Math.round(w * 0.85));
      hitH = Math.max(10, Math.round(h * 0.60));
      hitX = Math.round(left + (w - hitW) / 2);
      hitY = Math.round(top + h - hitH);
    }
  }

  // Strict clamp ensuring zero spill over
  hitX = Math.max(left, Math.min(hitX, left + w - hitW));
  hitY = Math.max(top, Math.min(hitY, top + h - hitH));
  hitW = Math.min(hitW, w);
  hitH = Math.min(hitH, h);

  return {
    x: hitX,
    y: hitY,
    w: hitW,
    h: hitH,
    type: 'solid',
    source: prop.id
  };
}

/**
 * Pre-made default medieval village on green meadow grass
 */
function generateDefaultMeadowObjects() {
  return [
    // Player Spawn in Central Courtyard
    { id: 'player_spawn', type: 'player_spawn', name: 'Inicio Jugador', x: 700, y: 740, w: 24, h: 24 },

    // Central Plaza: Campfire, Well, Benches, Board, Lanterns
    { id: 'prop_campfire', type: 'Animation_Campfire', assetKey: 'Animation_Campfire', name: 'Hoguera Central', x: 700, y: 720, w: 32, h: 32, originX: 0.5, originY: 1 },
    { id: 'prop_well', type: 'Well_Hay_1', assetKey: 'Well_Hay_1', name: 'Pozo del Pueblo', x: 620, y: 700, w: 56, h: 75, originX: 0.5, originY: 1 },
    { id: 'prop_bench_1', type: 'Bench_1', assetKey: 'Bench_1', name: 'Banco Este', x: 760, y: 720, w: 14, h: 30, originX: 0.5, originY: 1 },
    { id: 'prop_bench_2', type: 'Bench_3', assetKey: 'Bench_3', name: 'Banco Sur', x: 670, y: 750, w: 14, h: 14, originX: 0.5, originY: 1 },
    { id: 'prop_board', type: 'BulletinBoard_1', assetKey: 'BulletinBoard_1', name: 'Tablón del Pueblo', x: 780, y: 680, w: 44, h: 42, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_1', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Plaza 1', x: 630, y: 640, w: 46, h: 62, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_2', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Plaza 2', x: 770, y: 640, w: 46, h: 62, originX: 0.5, originY: 1 },

    // North Manor & Farm
    { id: 'prop_house_north', type: 'House_Hay_3', assetKey: 'House_Hay_3', name: 'Gran Casa del Jefe', x: 700, y: 440, w: 180, h: 128, originX: 0.5, originY: 1 },
    { id: 'prop_banner_n1', type: 'Banner_Stick_1_Purple', assetKey: 'Banner_Stick_1_Purple', name: 'Estandarte Norte 1', x: 600, y: 440, w: 24, h: 59, originX: 0.5, originY: 1 },
    { id: 'prop_banner_n2', type: 'Banner_Stick_1_Purple', assetKey: 'Banner_Stick_1_Purple', name: 'Estandarte Norte 2', x: 800, y: 440, w: 24, h: 59, originX: 0.5, originY: 1 },
    { id: 'prop_crate_n1', type: 'Crate_Large_Empty', assetKey: 'Crate_Large_Empty', name: 'Cajón Granero', x: 795, y: 460, w: 24, h: 29, originX: 0.5, originY: 1 },
    { id: 'prop_barrel_n1', type: 'Barrel_Small_Empty', assetKey: 'Barrel_Small_Empty', name: 'Barril Entrada', x: 815, y: 460, w: 16, h: 20, originX: 0.5, originY: 1 },

    // Northwest Cottage
    { id: 'prop_house_nw', type: 'House_Hay_1', assetKey: 'House_Hay_1', name: 'Cabaña de Paja', x: 440, y: 480, w: 88, h: 103, originX: 0.5, originY: 1 },
    { id: 'prop_table_nw', type: 'Table_Medium_1', assetKey: 'Table_Medium_1', name: 'Mesa Rústica', x: 505, y: 530, w: 42, h: 39, originX: 0.5, originY: 1 },
    { id: 'prop_bench_nw', type: 'Bench_3', assetKey: 'Bench_3', name: 'Taburete', x: 535, y: 530, w: 14, h: 14, originX: 0.5, originY: 1 },

    // Northeast Royal Villa
    { id: 'prop_house_ne', type: 'House_Hay_4_Purple', assetKey: 'House_Hay_4_Purple', name: 'Mansión Real Púrpura', x: 960, y: 480, w: 128, h: 128, originX: 0.5, originY: 1 },
    { id: 'prop_hay_ne', type: 'HayStack_2', assetKey: 'HayStack_2', name: 'Pajar Real', x: 1040, y: 520, w: 29, h: 32, originX: 0.5, originY: 1 },

    // Southwest Farmstead
    { id: 'prop_house_sw', type: 'House_Hay_2', assetKey: 'House_Hay_2', name: 'Casona de Campo', x: 420, y: 880, w: 157, h: 112, originX: 0.5, originY: 1 },
    { id: 'prop_chopped', type: 'Chopped_Tree_1', assetKey: 'Chopped_Tree_1', name: 'Talar Leña', x: 530, y: 880, w: 32, h: 31, originX: 0.5, originY: 1 },
    { id: 'prop_fireplace', type: 'Fireplace_1', assetKey: 'Fireplace_1', name: 'Horno de Campo', x: 320, y: 890, w: 30, h: 26, originX: 0.5, originY: 1 },
    { id: 'prop_crate_sw1', type: 'Crate_Water_1', assetKey: 'Crate_Water_1', name: 'Agua para Cultivos', x: 350, y: 920, w: 30, h: 22, originX: 0.5, originY: 1 },
    { id: 'prop_sack_sw', type: 'Sack_3', assetKey: 'Sack_3', name: 'Sacos de Cereal', x: 380, y: 925, w: 16, h: 14, originX: 0.5, originY: 1 },

    // South Gate & Wall
    { id: 'prop_gate_south', type: 'CityWall_Gate_1', assetKey: 'CityWall_Gate_1', name: 'Portón Sur', x: 700, y: 1100, w: 80, h: 96, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_s1', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Portón 1', x: 650, y: 1100, w: 46, h: 62, originX: 0.5, originY: 1 },
    { id: 'prop_lamp_s2', type: 'LampPost_3', assetKey: 'LampPost_3', name: 'Farol Portón 2', x: 750, y: 1100, w: 46, h: 62, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (North)
    { id: 'tree_n1', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Norte 1', x: 360, y: 220, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_n2', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Norte 2', x: 520, y: 200, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_n3', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Norte 3', x: 700, y: 180, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_n4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Norte 4', x: 880, y: 200, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_n5', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Norte 5', x: 1040, y: 220, w: 52, h: 92, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (West)
    { id: 'tree_w1', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Oeste 1', x: 220, y: 380, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_w2', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Oeste 2', x: 180, y: 540, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_w3', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Oeste 3', x: 230, y: 700, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_w4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Oeste 4', x: 180, y: 880, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_w5', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Oeste 5', x: 220, y: 1060, w: 52, h: 92, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (East)
    { id: 'tree_e1', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Este 1', x: 1180, y: 360, w: 48, h: 93, originX: 0.5, originY: 1 },
    { id: 'tree_e2', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Este 2', x: 1220, y: 520, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_e3', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Este 3', x: 1170, y: 700, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_e4', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Este 4', x: 1220, y: 880, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_e5', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Este 5', x: 1180, y: 1060, w: 48, h: 93, originX: 0.5, originY: 1 },

    // Perimeter Emerald Forest (South)
    { id: 'tree_s1', type: 'Tree_Emerald_1', assetKey: 'Tree_Emerald_1', name: 'Árbol Sur 1', x: 380, y: 1240, w: 64, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_s2', type: 'Tree_Emerald_3', assetKey: 'Tree_Emerald_3', name: 'Roble Sur 2', x: 540, y: 1260, w: 52, h: 92, originX: 0.5, originY: 1 },
    { id: 'tree_s3', type: 'Tree_Emerald_2', assetKey: 'Tree_Emerald_2', name: 'Árbol Sur 3', x: 860, y: 1260, w: 46, h: 63, originX: 0.5, originY: 1 },
    { id: 'tree_s4', type: 'Tree_Emerald_4', assetKey: 'Tree_Emerald_4', name: 'Pino Sur 4', x: 1020, y: 1240, w: 48, h: 93, originX: 0.5, originY: 1 },

    // Bushes & Foliage
    { id: 'bush_1', type: 'Bush_Emerald_1', assetKey: 'Bush_Emerald_1', name: 'Arbusto 1', x: 310, y: 460, w: 40, h: 29, originX: 0.5, originY: 1 },
    { id: 'bush_2', type: 'Bush_Emerald_2', assetKey: 'Bush_Emerald_2', name: 'Arbusto 2', x: 840, y: 460, w: 48, h: 16, originX: 0.5, originY: 1 },
    { id: 'bush_3', type: 'Bush_Emerald_3', assetKey: 'Bush_Emerald_3', name: 'Arbusto 3', x: 480, y: 660, w: 28, h: 28, originX: 0.5, originY: 1 },
    { id: 'bush_4', type: 'Bush_Emerald_4', assetKey: 'Bush_Emerald_4', name: 'Arbusto 4', x: 920, y: 660, w: 16, h: 28, originX: 0.5, originY: 1 },
    { id: 'bush_5', type: 'Bush_Emerald_5', assetKey: 'Bush_Emerald_5', name: 'Hierba 5', x: 620, y: 820, w: 14, h: 14, originX: 0.5, originY: 1 },
    { id: 'bush_6', type: 'Bush_Emerald_6', assetKey: 'Bush_Emerald_6', name: 'Hierba 6', x: 780, y: 820, w: 15, h: 10, originX: 0.5, originY: 1 },

    // Rocks
    { id: 'rock_1', type: 'Rock_Brown_1', assetKey: 'Rock_Brown_1', name: 'Roca Café 1', x: 340, y: 620, w: 28, h: 13, originX: 0.5, originY: 1 },
    { id: 'rock_2', type: 'Rock_Brown_4', assetKey: 'Rock_Brown_4', name: 'Roca Café 2', x: 1050, y: 640, w: 27, h: 26, originX: 0.5, originY: 1 },
    { id: 'rock_3', type: 'Rock_Brown_2', assetKey: 'Rock_Brown_2', name: 'Roca Café 3', x: 580, y: 1060, w: 15, h: 29, originX: 0.5, originY: 1 },
    { id: 'rock_4', type: 'Rock_Brown_6', assetKey: 'Rock_Brown_6', name: 'Roca Café 4', x: 820, y: 1060, w: 14, h: 13, originX: 0.5, originY: 1 }
  ];
}

/**
 * Generate pixel-fitted solid collision boxes for every prop in objects
 */
function generateDefaultMeadowObstacles(objects) {
  const colliders = [];
  objects.forEach(obj => {
    if (obj.type === 'player_spawn' || obj.type === 'enemy_spawn') return;
    const hit = calculateFitHitboxStatic(obj);
    if (hit) colliders.push(hit);
  });
  return colliders;
}

const DEFAULT_MEADOW_ENEMY_SPAWNS = [
  { id: 'spawn_north_forest', name: 'Bosque Norte', x: 700, y: 300, enemyType: 'soldier', minWave: 1, radius: 48, active: true },
  { id: 'spawn_east_path', name: 'Sendero Este', x: 1080, y: 720, enemyType: 'clash', minWave: 1, radius: 48, active: true },
  { id: 'spawn_south_gate', name: 'Muralla Sur', x: 700, y: 1180, enemyType: 'orc', minWave: 2, radius: 48, active: true },
  { id: 'spawn_west_clearing', name: 'Claro Oeste', x: 320, y: 720, enemyType: 'mixed', minWave: 2, radius: 48, active: true }
];

/**
 * Generates a randomized village & nature layout on the green grass meadow
 * with auto-generated pixel hitboxes for instant quick-play
 */
function generateRandomMeadowLayout(width = 1400, height = 1400) {
  const objects = [];
  const obstacles = [];
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  // 1. Safe central player spawn & campfire
  objects.push({
    id: 'player_spawn',
    type: 'player_spawn',
    name: 'Inicio Jugador',
    x: cx,
    y: cy + 30,
    w: 24,
    h: 24
  });

  const campfire = {
    id: `campfire_${Date.now()}`,
    type: 'Animation_Campfire',
    assetKey: 'Animation_Campfire',
    name: 'Hoguera de Campamento',
    x: cx,
    y: cy,
    w: 32,
    h: 32,
    originX: 0.5,
    originY: 1
  };
  objects.push(campfire);
  const campHit = calculateFitHitboxStatic(campfire);
  if (campHit) obstacles.push(campHit);

  const isNearCenter = (x, y, radius = 90) => Math.hypot(x - cx, y - cy) < radius;

  // 2. Random Houses (3 to 5)
  const houseKeys = ['House_Hay_1', 'House_Hay_2', 'House_Hay_3', 'House_Hay_4_Purple'];
  const numHouses = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numHouses; i++) {
    const key = houseKeys[i % houseKeys.length];
    const meta = MAP_ASSET_METADATA[key];
    const angle = (i / numHouses) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const dist = 240 + Math.random() * 180;
    const hx = Math.round(Math.max(120, Math.min(width - 120, cx + Math.cos(angle) * dist)));
    const hy = Math.round(Math.max(160, Math.min(height - 160, cy + Math.sin(angle) * dist)));

    const houseObj = {
      id: `house_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: hx,
      y: hy,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(houseObj);
    const hit = calculateFitHitboxStatic(houseObj);
    if (hit) obstacles.push(hit);
  }

  // 3. Stone Well
  const wellAngle = Math.random() * Math.PI * 2;
  const wx = Math.round(cx + Math.cos(wellAngle) * 90);
  const wy = Math.round(cy + Math.sin(wellAngle) * 90);
  const wellObj = {
    id: `well_${Date.now()}`,
    type: 'Well_Hay_1',
    assetKey: 'Well_Hay_1',
    name: 'Pozo del Pueblo',
    x: wx,
    y: wy,
    w: 56,
    h: 75,
    originX: 0.5,
    originY: 1
  };
  objects.push(wellObj);
  const wellHit = calculateFitHitboxStatic(wellObj);
  if (wellHit) obstacles.push(wellHit);

  // 4. Random Trees (26 to 34)
  const treeKeys = ['Tree_Emerald_1', 'Tree_Emerald_2', 'Tree_Emerald_3', 'Tree_Emerald_4'];
  const numTrees = 26 + Math.floor(Math.random() * 9);
  for (let i = 0; i < numTrees; i++) {
    const key = treeKeys[Math.floor(Math.random() * treeKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    let tx, ty;
    for (let attempts = 0; attempts < 10; attempts++) {
      tx = Math.round(80 + Math.random() * (width - 160));
      ty = Math.round(80 + Math.random() * (height - 160));
      if (!isNearCenter(tx, ty, 140)) break;
    }
    const treeObj = {
      id: `tree_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: tx,
      y: ty,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(treeObj);
    const hit = calculateFitHitboxStatic(treeObj);
    if (hit) obstacles.push(hit);
  }

  // 5. Random Rocks (8 to 12)
  const rockKeys = ['Rock_Brown_1', 'Rock_Brown_2', 'Rock_Brown_4', 'Rock_Brown_6', 'Rock_Brown_9'];
  const numRocks = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numRocks; i++) {
    const key = rockKeys[Math.floor(Math.random() * rockKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    let rx, ry;
    for (let attempts = 0; attempts < 10; attempts++) {
      rx = Math.round(70 + Math.random() * (width - 140));
      ry = Math.round(70 + Math.random() * (height - 140));
      if (!isNearCenter(rx, ry, 110)) break;
    }
    const rockObj = {
      id: `rock_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: rx,
      y: ry,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(rockObj);
    const hit = calculateFitHitboxStatic(rockObj);
    if (hit) obstacles.push(hit);
  }

  // 6. Random Village Props (12 to 16)
  const propKeys = ['Barrel_Small_Empty', 'Bench_1', 'Bench_3', 'Crate_Large_Empty', 'Crate_Medium_Closed', 'HayStack_2', 'LampPost_3', 'Table_Medium_1', 'Banner_Stick_1_Purple'];
  const numProps = 12 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numProps; i++) {
    const key = propKeys[Math.floor(Math.random() * propKeys.length)];
    const meta = MAP_ASSET_METADATA[key];
    const px = Math.round(90 + Math.random() * (width - 180));
    const py = Math.round(90 + Math.random() * (height - 180));
    const propObj = {
      id: `prop_${i}_${Date.now()}`,
      type: key,
      assetKey: key,
      name: meta.name,
      x: px,
      y: py,
      w: meta.w,
      h: meta.h,
      originX: 0.5,
      originY: 1
    };
    objects.push(propObj);
    const hit = calculateFitHitboxStatic(propObj);
    if (hit) obstacles.push(hit);
  }

  // 7. Enemy Spawns at 4 quadrants
  const enemySpawns = [
    { id: 'spawn_n', name: 'Norte', x: cx, y: cy - 350, enemyType: 'soldier', minWave: 1, radius: 48, active: true },
    { id: 'spawn_e', name: 'Este', x: cx + 380, y: cy, enemyType: 'clash', minWave: 1, radius: 48, active: true },
    { id: 'spawn_s', name: 'Sur', x: cx, y: cy + 380, enemyType: 'orc', minWave: 2, radius: 48, active: true },
    { id: 'spawn_w', name: 'Oeste', x: cx - 380, y: cy, enemyType: 'mixed', minWave: 2, radius: 48, active: true }
  ];

  return { objects, obstacles, enemySpawns };
}

const DEFAULT_MAP_OBJECTS = [];
const DEFAULT_MAP_OBSTACLES = [];
const DEFAULT_ENEMY_SPAWNS = DEFAULT_MEADOW_ENEMY_SPAWNS;

const MAP_CONFIG_STORAGE_KEY = 'CASTLEKNIGHT_MEADOW_MAP_V2';

function loadStoredMapData() {
  try {
    const raw = localStorage.getItem(MAP_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles : [],
          objects: Array.isArray(parsed.objects) ? parsed.objects : [],
          enemySpawns: Array.isArray(parsed.enemySpawns) ? parsed.enemySpawns : JSON.parse(JSON.stringify(DEFAULT_ENEMY_SPAWNS))
        };
      }
    }
  } catch (e) {
    console.warn('Error reading map config from localStorage:', e);
  }
  return {
    obstacles: [],
    objects: [],
    enemySpawns: JSON.parse(JSON.stringify(DEFAULT_ENEMY_SPAWNS))
  };
}

let MAP_OBSTACLES = [];


// ==========================================
// 1.5 KEYBOARD KEYBINDINGS MANAGER (CASTLEKNIGHT)
// ==========================================
const KEYBINDS_STORAGE_KEY = 'CASTLEKNIGHT_KEYBINDS';

const DEFAULT_KEYBINDS = {
  moveUp: 'W',
  moveDown: 'S',
  moveLeft: 'A',
  moveRight: 'D',
  attack: 'J',
  special: 'K',
  dash: 'SHIFT',
  spin: 'E',
  heroSoldier: '1',
  heroWizard: '2',
  devMode: 'F2',
  hitboxes: 'P'
};

const KEYBIND_DEFINITIONS = [
  { id: 'moveUp', label: 'Mover Arriba', desc: 'Desplazarse al norte (W / Flecha Arriba)' },
  { id: 'moveDown', label: 'Mover Abajo', desc: 'Desplazarse al sur (S / Flecha Abajo)' },
  { id: 'moveLeft', label: 'Mover Izquierda', desc: 'Desplazarse al oeste (A / Flecha Izquierda)' },
  { id: 'moveRight', label: 'Mover Derecha', desc: 'Desplazarse al este (D / Flecha Derecha)' },
  { id: 'attack', label: 'Ataque Principal', desc: 'Combo melee de espada / Hechizo arcano (J / Espacio)' },
  { id: 'special', label: 'Ataque Especial', desc: 'Disparo con arco / Bola de Fuego (K)' },
  { id: 'dash', label: 'Dash Evasivo', desc: 'Deslizamiento rápido o Teletransporte (Shift) — Usa 50% Stamina' },
  { id: 'spin', label: 'Giro Torbellino 360', desc: 'Torbellino doble en área del Guerrero (E) — Usa 35% Stamina' },
  { id: 'heroSoldier', label: 'Seleccionar Soldado', desc: 'Cambiar de personaje al Caballero (1)' },
  { id: 'heroWizard', label: 'Seleccionar Mago', desc: 'Cambiar de personaje al Mago Arcano (2)' },
  { id: 'devMode', label: 'Modo Desarrollador', desc: 'Herramientas de hitboxes y spawns (F2)' },
  { id: 'hitboxes', label: 'Ver Hitboxes', desc: 'Alternar visualizacion de colisiones (P)' }
];

function resolvePhaserKeyCode(keyName) {
  if (!keyName) return Phaser.Input.Keyboard.KeyCodes.W;
  const upper = String(keyName).toUpperCase().trim();

  if (upper === 'SPACE' || upper === 'ESPACIO' || upper === ' ') return Phaser.Input.Keyboard.KeyCodes.SPACE;
  if (upper === 'SHIFT') return Phaser.Input.Keyboard.KeyCodes.SHIFT;
  if (upper === 'CTRL' || upper === 'CONTROL') return Phaser.Input.Keyboard.KeyCodes.CTRL;
  if (upper === 'ALT') return Phaser.Input.Keyboard.KeyCodes.ALT;
  if (upper === 'ENTER') return Phaser.Input.Keyboard.KeyCodes.ENTER;
  if (upper === 'ESC' || upper === 'ESCAPE') return Phaser.Input.Keyboard.KeyCodes.ESC;
  if (upper === 'TAB') return Phaser.Input.Keyboard.KeyCodes.TAB;
  if (upper === 'BACKSPACE') return Phaser.Input.Keyboard.KeyCodes.BACKSPACE;
  if (upper === 'DELETE' || upper === 'SUPR') return Phaser.Input.Keyboard.KeyCodes.DELETE;

  if (upper === 'ARROWUP' || upper === 'UP' || upper === 'FLECHA ARRIBA') return Phaser.Input.Keyboard.KeyCodes.UP;
  if (upper === 'ARROWDOWN' || upper === 'DOWN' || upper === 'FLECHA ABAJO') return Phaser.Input.Keyboard.KeyCodes.DOWN;
  if (upper === 'ARROWLEFT' || upper === 'LEFT' || upper === 'FLECHA IZQ' || upper === 'FLECHA IZQUIERDA') return Phaser.Input.Keyboard.KeyCodes.LEFT;
  if (upper === 'ARROWRIGHT' || upper === 'RIGHT' || upper === 'FLECHA DER' || upper === 'FLECHA DERECHA') return Phaser.Input.Keyboard.KeyCodes.RIGHT;

  const digits = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE' };
  if (digits[upper] && Phaser.Input.Keyboard.KeyCodes[digits[upper]] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[digits[upper]];
  }

  if (/^F\d+$/.test(upper) && Phaser.Input.Keyboard.KeyCodes[upper] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[upper];
  }

  if (Phaser.Input.Keyboard.KeyCodes[upper] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[upper];
  }

  return Phaser.Input.Keyboard.KeyCodes.W;
}

class KeybindsManager {
  static bindings = { ...DEFAULT_KEYBINDS };
  static activeListeningAction = null;
  static initialized = false;

  static init() {
    if (this.initialized) {
      this.renderUI();
      return;
    }
    this.initialized = true;

    try {
      const stored = localStorage.getItem(KEYBINDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.bindings = { ...DEFAULT_KEYBINDS, ...parsed };
      }
    } catch (e) {
      console.warn('Error reading keybinds from storage:', e);
      this.bindings = { ...DEFAULT_KEYBINDS };
    }

    this.renderUI();
    this.setupGlobalKeyListener();
    this.updateControlsFooter();
  }

  static get(action) {
    return this.bindings[action] || DEFAULT_KEYBINDS[action] || 'W';
  }

  static set(action, key) {
    this.bindings[action] = String(key).toUpperCase();
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) { }
    this.renderUI();
    this.updateControlsFooter();
    if (window.activeGameScene) {
      window.activeGameScene.rebindControls();
    }
  }

  static reset() {
    this.bindings = { ...DEFAULT_KEYBINDS };
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) { }
    this.renderUI();
    this.updateControlsFooter();
    if (window.activeGameScene) {
      window.activeGameScene.rebindControls();
    }
  }

  static formatKeyDisplay(keyStr) {
    if (!keyStr) return '---';
    const upper = String(keyStr).toUpperCase();
    if (upper === ' ' || upper === 'SPACE') return 'ESPACIO';
    if (upper === 'ARROWUP') return 'FLECHA ARRIBA';
    if (upper === 'ARROWDOWN') return 'FLECHA ABAJO';
    if (upper === 'ARROWLEFT') return 'FLECHA IZQ';
    if (upper === 'ARROWRIGHT') return 'FLECHA DER';
    if (upper === 'SHIFT') return 'SHIFT';
    if (upper === 'CONTROL') return 'CTRL';
    if (upper === 'ALT') return 'ALT';
    if (upper === 'ENTER') return 'ENTER';
    return upper;
  }

  static renderUI() {
    const grid = document.getElementById('keybinds-grid');
    if (!grid) return;
    grid.innerHTML = '';

    KEYBIND_DEFINITIONS.forEach(def => {
      const row = document.createElement('div');
      row.className = 'keybind-row';

      const info = document.createElement('div');
      info.className = 'keybind-info';

      const label = document.createElement('span');
      label.className = 'keybind-label';
      label.textContent = def.label;

      const desc = document.createElement('span');
      desc.className = 'keybind-desc';
      desc.textContent = def.desc;

      info.appendChild(label);
      info.appendChild(desc);

      const btn = document.createElement('button');
      btn.className = 'keybind-btn';
      btn.dataset.action = def.id;
      btn.textContent = this.formatKeyDisplay(this.get(def.id));

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startListening(def.id, btn);
      });

      row.appendChild(info);
      row.appendChild(btn);
      grid.appendChild(row);
    });
  }

  static startListening(action, btnEl) {
    document.querySelectorAll('.keybind-btn.listening').forEach(el => {
      el.classList.remove('listening');
      const act = el.dataset.action;
      el.textContent = this.formatKeyDisplay(this.get(act));
    });

    this.activeListeningAction = action;
    btnEl.classList.add('listening');
    btnEl.textContent = 'PULSA TECLA...';
  }

  static setupGlobalKeyListener() {
    window.addEventListener('keydown', (e) => {
      if (!this.activeListeningAction) return;

      if (e.key === 'Escape') {
        this.cancelListening();
        return;
      }

      if (e.key === 'F5' || e.key === 'F12' || e.key === 'F11') return;

      e.preventDefault();
      e.stopPropagation();

      let keyToSet = e.key;
      if (e.code.startsWith('Key')) keyToSet = e.code.replace('Key', '');
      else if (e.code.startsWith('Digit')) keyToSet = e.code.replace('Digit', '');
      else if (e.code === 'Space') keyToSet = 'SPACE';
      else if (e.code.startsWith('Arrow')) keyToSet = e.code;
      else if (e.code.includes('Shift')) keyToSet = 'SHIFT';
      else if (e.code.includes('Control')) keyToSet = 'CTRL';
      else if (e.code.includes('Alt')) keyToSet = 'ALT';

      this.set(this.activeListeningAction, keyToSet);
      this.activeListeningAction = null;
      sfx.playAlert();
    }, true);

    window.addEventListener('click', (e) => {
      if (this.activeListeningAction && !e.target.closest('.keybind-btn')) {
        this.cancelListening();
      }
    });
  }

  static cancelListening() {
    if (!this.activeListeningAction) return;
    this.activeListeningAction = null;
    this.renderUI();
  }

  static updateControlsFooter() {
    const footer = document.querySelector('.controls-bar');
    if (!footer) return;

    const moveW = this.formatKeyDisplay(this.get('moveUp'));
    const moveA = this.formatKeyDisplay(this.get('moveLeft'));
    const moveS = this.formatKeyDisplay(this.get('moveDown'));
    const moveD = this.formatKeyDisplay(this.get('moveRight'));
    const atk = this.formatKeyDisplay(this.get('attack'));
    const spc = this.formatKeyDisplay(this.get('special'));
    const dsh = this.formatKeyDisplay(this.get('dash'));
    const spn = this.formatKeyDisplay(this.get('spin'));
    const sld = this.formatKeyDisplay(this.get('heroSoldier'));
    const wiz = this.formatKeyDisplay(this.get('heroWizard') || '2');
    const dev = this.formatKeyDisplay(this.get('devMode'));
    const hit = this.formatKeyDisplay(this.get('hitboxes'));

    footer.innerHTML = `
      <div class="control-pill">
        <span class="key-cap">${moveW}</span>
        <span class="key-cap">${moveA}</span>
        <span class="key-cap">${moveS}</span>
        <span class="key-cap">${moveD}</span>
        <span>MOVERSE</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${atk}</span> / <span class="key-cap">CLICK IZQ</span>
        <span>ATACAR</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${spc}</span> / <span class="key-cap">CLICK DER</span>
        <span>ESPECIAL</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${dsh}</span>
        <span>DASH</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${spn}</span>
        <span>GIRO</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${sld}</span> / <span class="key-cap">${wiz}</span>
        <span>HEROE</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">F</span>
        <span>FULLSCREEN</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${dev}</span>
        <span>MODO DEV</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${hit}</span>
        <span>HITBOXES</span>
      </div>
    `;
  }
}

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
    this.playerSpeed = 185;
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

  destroyLoadingText() {
    if (this.progressText) {
      try {
        this.progressText.destroy();
      } catch (e) { }
      this.progressText = null;
    }
  }

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
    this.load.spritesheet('wizard_fireball', getAsset('wizard_fireball', 'assets/characters/Wizard/Magic(projectile)/Wizard_Attack02_Effect.png'), {
      frameWidth: 100, frameHeight: 100
    });
    this.load.spritesheet('wizard_ice_shard', getAsset('wizard_ice_shard', 'assets/characters/Wizard/Magic(projectile)/Wizard_Attack01_Effect.png'), {
      frameWidth: 100, frameHeight: 100
    });

    // 4. Props & Map Decoratives
    this.createProceduralPropTextures();
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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  /**
   * Render animated house doors on the 4 village houses.
   * Doors start CLOSED (frame 0). Proximity logic in checkDoorProximity()
   * opens/closes them as the player approaches.
   *
   * Positions are pixel-analyzed from each house PNG to align exactly
   * with the door arch in each building texture:
   *   House_Hay_1  (small):  door at img x=30..45 -> world center x=547, bottom y=197
   *   House_Hay_2  (L-type): door at img x=104..119 -> world center x=454, bottom y=424
   *   House_Hay_3  (large):  door at img x=118..144 -> world center x=372, bottom y=152
   *   House_Hay_4_Purple:    door at img x=99..114  -> world center x=162, bottom y=330
   */
  renderAnimatedDoors() {
    // Each entry: x/y = world position with setOrigin(0.5, 1), depth = eaves depth of that house
    const doorDefs = [
      // House_Hay_1 (small house, top-right): uses small door spritesheet
      { x: 547, y: 197, anim: 'door_small_creak', sheet: 'door_small_anim', depth: 169, triggerR: 38 },
      // House_Hay_2 (L-shape, bottom-center): normal door
      { x: 454, y: 424, anim: 'door_normal_creak', sheet: 'door_normal_anim', depth: 365, triggerR: 40 },
      // House_Hay_3 (large house, top-center): normal door
      { x: 372, y: 152, anim: 'door_normal_creak', sheet: 'door_normal_anim', depth: 76, triggerR: 40 },
      // House_Hay_4_Purple (purple house, left): normal door
      { x: 162, y: 330, anim: 'door_normal_creak', sheet: 'door_normal_anim', depth: 289, triggerR: 40 }
    ];

    this.doorSprites = [];

    doorDefs.forEach(d => {
      if (!this.textures.exists(d.sheet)) return;
      const doorSprite = this.add.sprite(d.x, d.y, d.sheet)
        .setOrigin(0.5, 1)
        .setDepth(d.depth);

      // Start CLOSED on frame 0, animation paused
      doorSprite.setFrame(0);
      // Store proximity metadata on the sprite object for checkDoorProximity()
      doorSprite._doorAnim = d.anim;
      doorSprite._doorOpen = false; // current logical state
      doorSprite._triggerR = d.triggerR;

      this.doorSprites.push(doorSprite);
      if (this.campaignObjectSprites) this.campaignObjectSprites.push(doorSprite);
    });
  }

  /**
   * Called every frame from update().
   * Opens doors within trigger radius, closes them when player walks away.
   * Uses play(key, true) so the animation is never re-triggered every frame.
   */
  checkDoorProximity() {
    if (!this.doorSprites || !this.player) return;
    const px = this.player.x;
    const py = this.player.y;

    this.doorSprites.forEach(door => {
      const dist = Phaser.Math.Distance.Between(px, py, door.x, door.y);
      if (dist <= door._triggerR) {
        // Player is close — open if not already open
        if (!door._doorOpen) {
          door._doorOpen = true;
          if (this.anims.exists(door._doorAnim)) {
            // play(key, ignoreIfPlaying) — true prevents restart if already playing
            door.play({ key: door._doorAnim, repeat: 0, startFrame: 0 });
            door.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              // Hold on last frame (fully open) while player is still near
              door.setFrame(door.anims.currentAnim ? door.anims.currentAnim.frames.length - 1 : 3);
            });
          }
        }
      } else {
        // Player moved away — close (reset to frame 0)
        if (door._doorOpen) {
          door._doorOpen = false;
          door.anims.stop();
          door.setFrame(0);
        }
      }
    });
  }

  /**
   * Registers animations for all 4 NPC Villagers.
   * Spritesheets: 32x32 frames, read RIGHT-TO-LEFT per user specification.
   * npc1, npc3, npc4: 6 cols x 5 rows:
   *   Row 0: Idle (4 frames) RTL -> [3,2,1,0]
   *   Row 1: Walk (6 frames) RTL -> [11,10,9,8,7,6]
   *   Row 2: Jump (3 frames) RTL -> [14,13,12]
   *   Row 3: Hurt (3 frames) RTL -> [20,19,18]
   *   Row 4: Damage (4 frames) RTL -> [27,26,25,24]
   * npc2: 6 cols x 6 rows:
   *   Row 0: Idle (4 frames) RTL -> [3,2,1,0]
   *   Row 1: Walk (6 frames) RTL -> [11,10,9,8,7,6]
   *   Row 2: Jump (3 frames) RTL -> [14,13,12]
   *   Row 3: Action (6 frames) RTL -> [23,22,21,20,19,18]
   *   Row 4: Hurt (3 frames) RTL -> [26,25,24]
   *   Row 5: Damage (4 frames) RTL -> [33,32,31,30]
   */
  registerNPCAnimations() {
    const npcDefs = [
      {
        id: 'npc1',
        texture: 'npc1_villager',
        idle: [3, 2, 1, 0],
        walk: [11, 10, 9, 8, 7, 6],
        jump: [14, 13, 12],
        hurt: [20, 19, 18],
        damage: [27, 26, 25, 24]
      },
      {
        id: 'npc2',
        texture: 'npc2_villager',
        idle: [3, 2, 1, 0],
        walk: [11, 10, 9, 8, 7, 6],
        jump: [14, 13, 12],
        action: [23, 22, 21, 20, 19, 18],
        hurt: [26, 25, 24],
        damage: [33, 32, 31, 30]
      },
      {
        id: 'npc3',
        texture: 'npc3_villager',
        idle: [3, 2, 1, 0],
        walk: [11, 10, 9, 8, 7, 6],
        jump: [14, 13, 12],
        hurt: [20, 19, 18],
        damage: [27, 26, 25, 24]
      },
      {
        id: 'npc4',
        texture: 'npc4_villager',
        idle: [3, 2, 1, 0],
        walk: [11, 10, 9, 8, 7, 6],
        jump: [14, 13, 12],
        hurt: [20, 19, 18],
        damage: [27, 26, 25, 24]
      }
    ];

    npcDefs.forEach(cfg => {
      if (!this.textures.exists(cfg.texture)) return;

      const animList = [
        { key: `${cfg.id}_idle`, frames: cfg.idle, frameRate: 6, repeat: -1 },
        { key: `${cfg.id}_walk`, frames: cfg.walk, frameRate: 8, repeat: -1 },
        { key: `${cfg.id}_jump`, frames: cfg.jump, frameRate: 6, repeat: 0 },
        { key: `${cfg.id}_hurt`, frames: cfg.hurt, frameRate: 8, repeat: 0 },
        { key: `${cfg.id}_damage`, frames: cfg.damage, frameRate: 6, repeat: 0 }
      ];
      if (cfg.action) {
        animList.push({ key: `${cfg.id}_action`, frames: cfg.action, frameRate: 6, repeat: 0 });
      }

      animList.forEach(def => {
        if (this.anims.exists(def.key)) {
          this.anims.remove(def.key);
        }
        this.anims.create({
          key: def.key,
          frames: def.frames.map(f => ({ key: cfg.texture, frame: f })),
          frameRate: def.frameRate,
          repeat: def.repeat
        });
      });
    });
  }

  // Backward-compatibility alias
  registerNPC1Animations() {
    this.registerNPCAnimations();
  }

  /**
   * Spawns wandering villager NPCs in the campaign map (peaceful lobby).
   * Spawns exactly 4 NPCs in order:
   * 1. npc1villager.png (npc1_villager)
   * 2. npc2villager.png (npc2_villager)
   * 3. npc3villager.png (npc3_villager)
   * 4. npc4villager.png (npc4_villager)
   */
  spawnCampaignNPCs() {
    if (this._gameMode !== 'campaign') return;

    this.registerNPCAnimations();

    // Destroy any previously existing NPCs (scene restart safety)
    if (this.campaignNPCs) {
      this.campaignNPCs.forEach(n => n.sprite && n.sprite.destroy());
    }

    // NPC configs: exactly 4 NPCs in the requested order & quantity
    const npcConfigs = [
      {
        // 1. NPC 1: Near campfire and small house
        id: 'npc1',
        texture: 'npc1_villager',
        name: 'Aldeano Rústico',
        greetings: [
          '¡Hola, noble viajero! 🌾',
          'Paz en la aldea 🕊️',
          'La fogata está cálida 🔥',
          'Bienvenido a nuestro hogar ✨'
        ],
        waypoints: [
          { x: 248, y: 472 },
          { x: 290, y: 500 },
          { x: 320, y: 470 },
          { x: 280, y: 445 }
        ],
        scale: 1.3,
        startWaypoint: 0,
        idleChance: 0.35,
        speed: 28
      },
      {
        // 2. NPC 2: Central path and village plaza
        id: 'npc2',
        texture: 'npc2_villager',
        name: 'Posadero Mercader',
        greetings: [
          '¡Tengo los mejores suministros! 💰',
          '¡Qué buena mercancía llegó hoy! 🎒',
          '¿Buscas provisiones para el viaje? 🍞',
          'Descansa aquí, amigo 🍺'
        ],
        waypoints: [
          { x: 340, y: 310 },
          { x: 395, y: 350 },
          { x: 420, y: 300 },
          { x: 370, y: 265 },
          { x: 310, y: 290 }
        ],
        scale: 1.3,
        startWaypoint: 1,
        idleChance: 0.30,
        speed: 32
      },
      {
        // 3. NPC 3: Near Purple House (left side)
        id: 'npc3',
        texture: 'npc3_villager',
        name: 'Boticaria Herbolaria',
        greetings: [
          'Las hierbas del bosque curan todo 🌱',
          'Cuidado en las tierras salvajes 🧪',
          '¡Un saludo, valiente aventurero! ✨',
          'Recolectando flores medicinales 🌸'
        ],
        waypoints: [
          { x: 130, y: 370 },
          { x: 175, y: 395 },
          { x: 200, y: 360 },
          { x: 155, y: 340 }
        ],
        scale: 1.3,
        startWaypoint: 2,
        idleChance: 0.40,
        speed: 30
      },
      {
        // 4. NPC 4: Near North house & well
        id: 'npc4',
        texture: 'npc4_villager',
        name: 'Granjero del Norte',
        greetings: [
          'La cosecha será próspera este año 🌽',
          'El molino funciona sin descanso 🌾',
          'Buen día para un paseo por el campo ☀️',
          'La tierra es generosa con nosotros 🌻'
        ],
        waypoints: [
          { x: 310, y: 200 },
          { x: 370, y: 205 },
          { x: 410, y: 230 },
          { x: 360, y: 245 }
        ],
        scale: 1.3,
        startWaypoint: 0,
        idleChance: 0.35,
        speed: 26
      }
    ];

    this.campaignNPCs = npcConfigs.map((cfg, idx) => {
      const startPt = cfg.waypoints[cfg.startWaypoint];
      const texKey = this.textures.exists(cfg.texture) ? cfg.texture : 'npc1_villager';
      const sprite = this.add.sprite(startPt.x, startPt.y, texKey)
        .setOrigin(0.5, 1)
        .setScale(cfg.scale)
        .setDepth(startPt.y);

      // Start idle animation for this specific NPC
      const idleKey = `${cfg.id}_idle`;
      if (this.anims.exists(idleKey)) {
        sprite.play(idleKey);
      } else if (this.anims.exists('npc1_idle')) {
        sprite.play('npc1_idle');
      }

      const npc = {
        id: cfg.id,
        textureKey: texKey,
        name: cfg.name,
        greetings: cfg.greetings,
        sprite,
        waypoints: cfg.waypoints,
        currentWaypoint: cfg.startWaypoint,
        speed: cfg.speed,
        idleChance: cfg.idleChance,
        state: 'idle',               // 'idle' | 'walking'
        idleTimer: 1000 + idx * 450, // ms before first move
        lastGreeting: 0
      };
      return npc;
    });

    console.log(`[NPC] Spawned ${this.campaignNPCs.length} unique NPCs in campaign lobby.`);
  }

  /**
   * Called every frame from update().
   * Drives each NPC along its patrol route with idle pauses,
   * playful jumps/actions, and friendly greetings when player is close.
   */
  updateNPCs() {
    if (this._gameMode !== 'campaign' || !this.campaignNPCs) return;
    const dt = this.game.loop.delta; // ms since last frame

    this.campaignNPCs.forEach(npc => {
      const { sprite, waypoints } = npc;
      if (!sprite || !sprite.active) return;

      // Dynamic depth sorting (y of feet) on every frame
      sprite.setDepth(Math.round(sprite.y));

      // Player proximity interaction: turn to face player and show friendly greeting
      if (this.player && this.player.active) {
        const distToPlayer = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        if (distToPlayer < 42) {
          sprite.setFlipX(this.player.x < sprite.x);

          if (!npc.lastGreeting || this.time.now - npc.lastGreeting > 8000) {
            npc.lastGreeting = this.time.now;
            const greetings = npc.greetings || [
              '¡Hola, noble viajero! 🌾',
              'Paz en la aldea 🕊️',
              'Lindo día para descansar',
              'Bienvenido a nuestro hogar ✨',
              'La fogata está cálida 🔥'
            ];
            const greeting = Phaser.Utils.Array.GetRandom(greetings);
            this.createFloatingText(sprite.x, sprite.y - 38, greeting, 0x6ee7b7);
          }
        }
      }

      if (npc.state === 'idle') {
        npc.idleTimer -= dt;
        if (npc.idleTimer <= 0) {
          // Pick next waypoint
          npc.currentWaypoint = (npc.currentWaypoint + 1) % waypoints.length;
          npc.state = 'walking';
          const walkKey = `${npc.id}_walk`;
          if (this.anims.exists(walkKey)) {
            sprite.play(walkKey, true);
          } else if (this.anims.exists('npc1_walk')) {
            sprite.play('npc1_walk', true);
          }
        }
      } else {
        // Walking toward current waypoint
        const target = waypoints[npc.currentWaypoint];
        const dx = target.x - sprite.x;
        const dy = target.y - sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          // Arrived — enter idle
          sprite.setPosition(target.x, target.y);
          npc.state = 'idle';
          // Random idle time between 1.5s and 3.5s, occasionally longer
          const rollLong = Math.random() < npc.idleChance;
          npc.idleTimer = rollLong
            ? 2800 + Math.random() * 2000
            : 1200 + Math.random() * 1000;

          const idleKey = `${npc.id}_idle`;
          const jumpKey = `${npc.id}_jump`;
          const actionKey = `${npc.id}_action`;
          if (this.anims.exists(idleKey)) {
            sprite.play(idleKey, true);
          } else if (this.anims.exists('npc1_idle')) {
            sprite.play('npc1_idle', true);
          }

          // Rare chance to do an animation flourish upon arrival
          if (npc.id === 'npc2' && Math.random() < 0.25 && this.anims.exists(actionKey)) {
            sprite.play(actionKey);
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              if (npc.state === 'idle') {
                if (this.anims.exists(idleKey)) sprite.play(idleKey, true);
              }
            });
          } else if (Math.random() < 0.15 && this.anims.exists(jumpKey)) {
            sprite.play(jumpKey);
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              if (npc.state === 'idle') {
                if (this.anims.exists(idleKey)) sprite.play(idleKey, true);
              }
            });
          }
        } else {
          // Move toward target
          const speed = npc.speed;
          const vx = (dx / dist) * speed;
          const vy = (dy / dist) * speed;
          sprite.x += vx * (dt / 1000);
          sprite.y += vy * (dt / 1000);

          // Flip sprite based on horizontal direction
          sprite.setFlipX(dx < 0);
        }
      }
    });
  }

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
  }


  createCharacterAnimations() {
    // Robust helper: safely extracts available frames or falls back cleanly without black boxes
    const getSafeFrames = (key, expectedCount) => {
      let targetKey = key;
      if (!this.textures.exists(targetKey)) {
        if (targetKey.startsWith('soldier_') && this.textures.exists('soldier_idle')) {
          targetKey = 'soldier_idle';
        } else if (targetKey.startsWith('orc_') && this.textures.exists('orc_idle')) {
          targetKey = 'orc_idle';
        } else if (this.textures.exists('soldier_idle')) {
          targetKey = 'soldier_idle';
        } else {
          return [{ key: targetKey, frame: 0 }];
        }
      }
      const tex = this.textures.get(targetKey);
      if (!tex) return [{ key: targetKey, frame: 0 }];

      const frameNames = tex.getFrameNames ? tex.getFrameNames() : Object.keys(tex.frames || {});
      const numericFrames = frameNames
        .filter(f => f !== '__BASE' && !isNaN(Number(f)))
        .map(Number)
        .sort((a, b) => a - b);

      if (numericFrames.length > 1) {
        const count = Math.min(expectedCount, numericFrames.length);
        return numericFrames.slice(0, count).map(f => ({ key: targetKey, frame: f }));
      }

      // Single frame texture (e.g. single 100x100 png image)
      const singleFrame = numericFrames.length === 1 ? numericFrames[0] : (frameNames.length > 0 ? frameNames[0] : 0);
      return [{ key: targetKey, frame: singleFrame }];
    };

    // Campfire burning animation (8 frames)
    if (!this.anims.exists('campfire_burn')) {
      this.anims.create({
        key: 'campfire_burn',
        frames: getSafeFrames('campfire_anim', 8),
        frameRate: 10,
        repeat: -1
      });
    }

    // House doors animations
    if (!this.anims.exists('door_normal_creak')) {
      this.anims.create({
        key: 'door_normal_creak',
        frames: getSafeFrames('door_normal_anim', 4),
        frameRate: 3,
        repeat: -1,
        yoyo: true
      });
    }
    if (!this.anims.exists('door_small_creak')) {
      this.anims.create({
        key: 'door_small_creak',
        frames: getSafeFrames('door_small_anim', 4),
        frameRate: 3,
        repeat: -1,
        yoyo: true
      });
    }

    // NPC Villager animations (npc1, npc2, npc3, npc4)
    this.registerNPCAnimations();

    // Helper to register standard animation sets
    const heroes = ['orc', 'soldier'];
    heroes.forEach(h => {
      // Idle (6 frames)
      if (!this.anims.exists(`${h}_idle`)) {
        this.anims.create({
          key: `${h}_idle`,
          frames: getSafeFrames(`${h}_idle`, 6),
          frameRate: 7,
          repeat: -1
        });
      }

      // Walk (8 frames)
      if (!this.anims.exists(`${h}_walk`)) {
        this.anims.create({
          key: `${h}_walk`,
          frames: getSafeFrames(`${h}_walk`, 8),
          frameRate: 11,
          repeat: -1
        });
      }

      // Attack01 (6 frames)
      if (!this.anims.exists(`${h}_attack1`)) {
        this.anims.create({
          key: `${h}_attack1`,
          frames: getSafeFrames(`${h}_attack1`, 6),
          frameRate: 14,
          repeat: 0
        });
      }

      // Attack02 (6 frames)
      if (!this.anims.exists(`${h}_attack2`)) {
        this.anims.create({
          key: `${h}_attack2`,
          frames: getSafeFrames(`${h}_attack2`, 6),
          frameRate: 14,
          repeat: 0
        });
      }

      // Hurt (4 frames)
      if (!this.anims.exists(`${h}_hurt`)) {
        this.anims.create({
          key: `${h}_hurt`,
          frames: getSafeFrames(`${h}_hurt`, 4),
          frameRate: 12,
          repeat: 0
        });
      }

      // Death (4 frames)
      if (!this.anims.exists(`${h}_death`)) {
        this.anims.create({
          key: `${h}_death`,
          frames: getSafeFrames(`${h}_death`, 4),
          frameRate: 8,
          repeat: 0
        });
      }
    });

    // Soldier Bow Attack (9 frames)
    if (!this.anims.exists('soldier_attack3')) {
      this.anims.create({
        key: 'soldier_attack3',
        frames: getSafeFrames('soldier_attack3', 9),
        frameRate: 16,
        repeat: 0
      });
    }

    // Soldier Dash Special Move (7 frames)
    if (!this.anims.exists('soldier_dash')) {
      this.anims.create({
        key: 'soldier_dash',
        frames: getSafeFrames('soldier_dash', 7),
        frameRate: 16,
        repeat: 0
      });
    }

    // Soldier Spin Whirlwind Ability (6 frames, repeats twice = 2 full rotations before stopping)
    if (!this.anims.exists('soldier_spin')) {
      this.anims.create({
        key: 'soldier_spin',
        frames: getSafeFrames('soldier_spin', 6),
        frameRate: 14,
        repeat: 1
      });
    }

    // Wizard Animations
    if (!this.anims.exists('wizard_idle')) {
      this.anims.create({
        key: 'wizard_idle',
        frames: getSafeFrames('wizard_idle', 6),
        frameRate: 7,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_walk')) {
      this.anims.create({
        key: 'wizard_walk',
        frames: getSafeFrames('wizard_walk', 8),
        frameRate: 11,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_attack1')) {
      this.anims.create({
        key: 'wizard_attack1',
        frames: getSafeFrames('wizard_attack1', 15),
        frameRate: 15,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_attack2')) {
      this.anims.create({
        key: 'wizard_attack2',
        frames: getSafeFrames('wizard_attack2', 14),
        frameRate: 14,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_hurt')) {
      this.anims.create({
        key: 'wizard_hurt',
        frames: getSafeFrames('wizard_hurt', 4),
        frameRate: 12,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_death')) {
      this.anims.create({
        key: 'wizard_death',
        frames: getSafeFrames('wizard_death', 4),
        frameRate: 8,
        repeat: 0
      });
    }
    // Wizard Dash Special Move (6 frames from user dash.png)
    if (!this.anims.exists('wizard_dash')) {
      this.anims.create({
        key: 'wizard_dash',
        frames: getSafeFrames('wizard_dash', 6),
        frameRate: 14,
        repeat: 0
      });
    }
    if (!this.anims.exists('wizard_fireball_anim')) {
      this.anims.create({
        key: 'wizard_fireball_anim',
        frames: getSafeFrames('wizard_fireball', 7),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!this.anims.exists('wizard_ice_shard_anim')) {
      this.anims.create({
        key: 'wizard_ice_shard_anim',
        frames: getSafeFrames('wizard_ice_shard', 10),
        frameRate: 14,
        repeat: 0
      });
    }
  }

  /**
   * Reads native collision geometries directly from Tiled Map JSON data
   */
  extractNativeColliders(mapData) {
    const colliders = [];
    if (!mapData || !mapData.tilesets) return colliders;

    const tsMap = mapData.tilesets;
    const getTileDef = (gid) => {
      if (!gid) return null;
      for (let i = tsMap.length - 1; i >= 0; i--) {
        const ts = tsMap[i];
        if (gid >= ts.firstgid) {
          const id = gid - ts.firstgid;
          const tile = ts.tiles ? ts.tiles.find(t => t.id === id) : null;
          return { ts, tile, tileId: id };
        }
      }
      return null;
    };

    const getBounds = (c) => {
      if (c.polygon && c.polygon.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        c.polygon.forEach(pt => {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        });
        return {
          offsetX: minX,
          offsetY: minY,
          width: Math.max(2, maxX - minX),
          height: Math.max(2, maxY - minY)
        };
      }
      return {
        offsetX: 0,
        offsetY: 0,
        width: c.width || 16,
        height: c.height || 16
      };
    };

    // 1. Colliders from Object Layer 1 objects
    const objLayer = mapData.layers.find(l => l.name === 'Object Layer 1');
    if (objLayer && objLayer.objects) {
      objLayer.objects.forEach(obj => {
        const def = getTileDef(obj.gid);
        if (def && def.tile && def.tile.objectgroup && def.tile.objectgroup.objects) {
          const topY = obj.y - (obj.height || 0);
          def.tile.objectgroup.objects.forEach(c => {
            const b = getBounds(c);
            colliders.push({
              x: Math.round(obj.x + (c.x || 0) + b.offsetX),
              y: Math.round(topY + (c.y || 0) + b.offsetY),
              w: Math.round(b.width),
              h: Math.round(b.height),
              type: 'solid',
              source: 'object_' + obj.id
            });
          });
        }
      });
    }

    // 2. Colliders from tile layers (Water riverbanks, RockSlopes)
    const STAIR_RAMP_GIDS = new Set([
      5351, 5352, 5357, 5374, 5381, 5397, 5400, 5406,
      1671, 1722, 1735, 1786, 1799, 2105, 2106, 2107, 2169, 2170, 2171
    ]);
    mapData.layers.forEach(layer => {
      if (layer.type === 'tilelayer' && layer.data) {
        const w = layer.width || mapData.width;
        layer.data.forEach((gid, idx) => {
          if (gid > 0) {
            const tileX = idx % w;
            const tileY = Math.floor(idx / w);
            const isStairCorridor = tileX >= 26 && tileX <= 34 && tileY >= 18 && tileY <= 26;
            if (isStairCorridor || STAIR_RAMP_GIDS.has(gid)) return;

            const def = getTileDef(gid);
            if (def && def.tile && def.tile.objectgroup && def.tile.objectgroup.objects) {
              const tx = tileX * (mapData.tilewidth || 16);
              const ty = tileY * (mapData.tileheight || 16);
              def.tile.objectgroup.objects.forEach(c => {
                const b = getBounds(c);
                colliders.push({
                  x: Math.round(tx + (c.x || 0) + b.offsetX),
                  y: Math.round(ty + (c.y || 0) + b.offsetY),
                  w: Math.round(b.width),
                  h: Math.round(b.height),
                  type: 'solid',
                  source: layer.name + '_' + idx
                });
              });
            }
          }
        });
      }
    });

    return colliders;
  }

  /**
   * Generates clean, authentic 2.5D RPG collision hitboxes for the Campaign map:
   * 1. 2.5D foundation boxes for buildings (roofs free for 2.5D depth overlap, doors clear).
   * 2. Trunk-only footprints for trees (canopy 100% walk-under).
   * 3. Footprint boxes for rocks and village props (benches, tables, crates).
   * 4. Campfire hazard zone that hurts on contact.
   * 5. Solid water bodies for ponds and rivers (merged rectangles, zero seams).
   * 6. Rock cliff ledge colliders that never block roads or stone stairs.
   */
  generateCampaignObstacles(mapData) {
    const colliders = [];
    if (!mapData || !mapData.layers) return colliders;

    const getTileDef = (gid) => {
      if (!gid || !mapData.tilesets) return null;
      for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
        const ts = mapData.tilesets[i];
        if (gid >= ts.firstgid) {
          const id = gid - ts.firstgid;
          const tile = ts.tiles ? ts.tiles.find(t => t.id === id) : null;
          return { ts: ts.name, tileId: id, tile };
        }
      }
      return null;
    };

    // 1. Props, Buildings & Trees from Object Layer 1
    const buildingBoxes = [];
    const objLayer = mapData.layers.find(l => l.name === 'Object Layer 1');
    if (objLayer && objLayer.objects) {
      objLayer.objects.forEach(o => {
        const d = getTileDef(o.gid);
        let assetKey = null;
        if (d && d.tile && d.tile.image) {
          assetKey = d.tile.image.split('/').pop().replace('.png', '');
        }

        if (assetKey && MAP_ASSET_METADATA[assetKey]) {
          const meta = MAP_ASSET_METADATA[assetKey];
          const left = o.x;
          const top = o.y - (o.height || meta.h);

          const scaleX = o.width ? (o.width / meta.w) : 1;
          const scaleY = o.height ? (o.height / meta.h) : 1;

          // Collect building tile bounding boxes to strictly exclude RockSlopes_Auto cliff artifacts under houses
          if (meta.cat === 'buildings') {
            const minTx = Math.floor(left / 16);
            const maxTx = Math.ceil((left + (o.width || meta.w)) / 16);
            const minTy = Math.floor(top / 16);
            const maxTy = Math.ceil((top + (o.height || meta.h)) / 16);
            buildingBoxes.push({ minTx, maxTx, minTy, maxTy });
          }

          // Low obstacles allow arrows to pass (props, rocks, small bushes)
          const isLow = ['props', 'rocks'].includes(meta.cat) || assetKey.startsWith('Bush_');
          const type = isLow ? 'low' : 'solid';

          if (meta.boxes && meta.boxes.length > 0) {
            meta.boxes.forEach((b, bIdx) => {
              const bHitW = Math.round(b.hitW * scaleX);
              const bHitH = Math.round(b.hitH * scaleY);
              const bHitX = Math.round(left + b.offX * scaleX);
              const bHitY = Math.round(top + b.offY * scaleY);
              colliders.push({
                x: bHitX,
                y: bHitY,
                w: bHitW,
                h: bHitH,
                type,
                source: 'prop_' + o.id + '_' + bIdx,
                name: meta.name
              });
            });
          } else {
            const hitW = Math.round(meta.hitW * scaleX);
            const hitH = Math.round(meta.hitH * scaleY);
            const hitX = Math.round(left + meta.hitOffsetX * scaleX);
            const hitY = Math.round(top + meta.hitOffsetY * scaleY);
            colliders.push({
              x: hitX,
              y: hitY,
              w: hitW,
              h: hitH,
              type,
              source: 'prop_' + o.id,
              name: meta.name
            });
          }
        }
      });
    }

    // 2. Campfire Hazard Zone at (256, 496)
    // 2. Campfire Hazard Zone at (256..288, 464..496)
    colliders.push({
      x: 258,
      y: 466,
      w: 28,
      h: 28,
      type: 'hazard',
      source: 'campaign_campfire',
      name: 'Hoguera de la Aldea'
    });

    // 3. Merged Water Bodies (Ponds and Rivers) - Type: 'water' (blocks walking, arrows fly over)
    const wLayer = mapData.layers.find(l => l.name === 'Water');
    if (wLayer && wLayer.data) {
      const mapW = mapData.width || 40;
      const mapH = mapData.height || 40;
      const grid = Array(mapH).fill(0).map(() => Array(mapW).fill(0));

      wLayer.data.forEach((g, idx) => {
        if (g > 0 && g !== 5211) { // 5211 is transparent filler
          const tx = idx % mapW;
          const ty = Math.floor(idx / mapW);
          grid[ty][tx] = 1;
        }
      });

      const visited = Array(mapH).fill(0).map(() => Array(mapW).fill(false));
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          if (grid[y][x] === 1 && !visited[y][x]) {
            let w = 0;
            while (x + w < mapW && grid[y][x + w] === 1 && !visited[y][x + w]) w++;
            let h = 1;
            let canExpand = true;
            while (y + h < mapH && canExpand) {
              for (let k = 0; k < w; k++) {
                if (grid[y + h][x + k] !== 1 || visited[y + h][x + k]) {
                  canExpand = false;
                  break;
                }
              }
              if (canExpand) h++;
            }
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) visited[y + dy][x + dx] = true;
            }
            colliders.push({
              x: x * 16,
              y: y * 16,
              w: w * 16,
              h: h * 16,
              type: 'water',
              source: 'water_pond'
            });
          }
        }
      }
    }

    // 4. Merged Rock Cliff Ledges (Perimeter & Terraces)
    // Strictly excludes:
    // - Any tiles inside building bounding boxes (avoids cliff artifacts under roofs & doors)
    // - Any tiles on roads/paths (avoids blocking roads)
    // - The stone stairs corridor (tx: 26..34, ty: 18..26)
    // - Explicit stair and ramp tile GIDs
    const rsAuto = mapData.layers.find(l => l.name === 'RockSlopes_Auto');
    const rLayer = mapData.layers.find(l => l.name === 'Road');
    if (rsAuto && rsAuto.data) {
      const mapW = mapData.width || 40;
      const mapH = mapData.height || 40;
      const isStairs = (tx, ty) => tx >= 26 && tx <= 34 && ty >= 18 && ty <= 26;
      const STAIR_RAMP_GIDS = new Set([
        5351, 5352, 5357, 5374, 5381, 5397, 5400, 5406,
        1671, 1722, 1735, 1786, 1799, 2105, 2106, 2107, 2169, 2170, 2171
      ]);
      const grid = Array(mapH).fill(0).map(() => Array(mapW).fill(0));

      rsAuto.data.forEach((g, idx) => {
        if (g > 0) {
          const tx = idx % mapW;
          const ty = Math.floor(idx / mapW);
          const roadGid = rLayer?.data ? rLayer.data[idx] : 0;
          const isRealRoad = roadGid > 0 && roadGid !== 5397;
          const inBuilding = buildingBoxes.some(b => tx >= b.minTx && tx < b.maxTx && ty >= b.minTy && ty < b.maxTy);
          const isStairTile = STAIR_RAMP_GIDS.has(g) || STAIR_RAMP_GIDS.has(roadGid);
          if (!isRealRoad && !inBuilding && !isStairs(tx, ty) && !isStairTile) {
            grid[ty][tx] = 1;
          }
        }
      });

      const visited = Array(mapH).fill(0).map(() => Array(mapW).fill(false));
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          if (grid[y][x] === 1 && !visited[y][x]) {
            let w = 0;
            while (x + w < mapW && grid[y][x + w] === 1 && !visited[y][x + w]) w++;
            let h = 1;
            let canExpand = true;
            while (y + h < mapH && canExpand) {
              for (let k = 0; k < w; k++) {
                if (grid[y + h][x + k] !== 1 || visited[y + h][x + k]) {
                  canExpand = false;
                  break;
                }
              }
              if (canExpand) h++;
            }
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) visited[y + dy][x + dx] = true;
            }
            colliders.push({
              x: x * 16,
              y: y * 16,
              w: w * 16,
              h: h * 16,
              type: 'solid',
              source: 'rock_cliff'
            });
          }
        }
      }
    }

    return colliders;
  }

  /**
   * Create static collision bodies for all solid obstacles in the scenery:
   * Buildings, rocks, props, riverbanks, and rock slopes.
   */
  createSolidObstacles() {
    if (!this.obstacles) {
      this.obstacles = this.physics.add.staticGroup();
    } else {
      this.obstacles.clear(true, true);
    }

    if (!this.waterObstacles) {
      this.waterObstacles = this.physics.add.staticGroup();
    } else {
      this.waterObstacles.clear(true, true);
    }

    if (!this.lowObstacles) {
      this.lowObstacles = this.physics.add.staticGroup();
    } else {
      this.lowObstacles.clear(true, true);
    }

    if (!this.hazardZones) {
      this.hazardZones = this.physics.add.staticGroup();
    } else {
      this.hazardZones.clear(true, true);
    }

    if (!this.slowZones) {
      this.slowZones = this.physics.add.staticGroup();
    } else {
      this.slowZones.clear(true, true);
    }

    // Visual debug graphics for collision boxes (toggle with P)
    if (!this.obstacleDebugGfx) {
      this.obstacleDebugGfx = this.add.graphics().setDepth(20000);
    } else {
      this.obstacleDebugGfx.clear();
      this.obstacleDebugGfx.setDepth(20000);
    }
    if (!this.characterDebugGfx) {
      this.characterDebugGfx = this.add.graphics().setDepth(20005);
    } else {
      this.characterDebugGfx.clear();
      this.characterDebugGfx.setDepth(20005);
    }
    this.showCollisionDebug = false;

    // Load obstacles based on active game mode
    if (this._gameMode === 'campaign') {
      const mapData = this.getMapData();
      if (mapData) {
        this.mapObstacles = this.generateCampaignObstacles(mapData);
      }
    } else {
      // Practice mode: pure terrain without obstacle hitboxes
      this.mapObstacles = this.mapObstacles || [];
    }

    this.rebuildObstacleColliders();
    this.ensurePhysicsColliders();
  }

  /**
   * Ensures that all physics colliders between characters, projectiles, and obstacles
   * are actively bound and functioning.
   */
  ensurePhysicsColliders() {
    if (!this.player || !this.obstacles) return;

    const colliders = this.physics.world.colliders.getActive();

    // 1. Player <-> Solid Obstacles (Walls, Foundations, Trunks, Cliffs)
    if (!colliders.some(c => c.object1 === this.player && c.object2 === this.obstacles)) {
      this.physics.add.collider(this.player, this.obstacles);
    }

    // 1b. Player <-> Water Obstacles (Blocks walking on water)
    if (this.waterObstacles && !colliders.some(c => c.object1 === this.player && c.object2 === this.waterObstacles)) {
      this.physics.add.collider(this.player, this.waterObstacles);
    }

    // 2. Player <-> Low Obstacles (Props, benches, fences, rocks)
    if (this.lowObstacles && !colliders.some(c => c.object1 === this.player && c.object2 === this.lowObstacles)) {
      this.physics.add.collider(this.player, this.lowObstacles);
    }

    // 3. Enemies <-> Solid Obstacles, Water Obstacles & Low Obstacles
    if (this.enemies) {
      if (!colliders.some(c => c.object1 === this.enemies && c.object2 === this.obstacles)) {
        this.physics.add.collider(this.enemies, this.obstacles);
      }
      if (this.waterObstacles && !colliders.some(c => c.object1 === this.enemies && c.object2 === this.waterObstacles)) {
        this.physics.add.collider(this.enemies, this.waterObstacles);
      }
      if (this.lowObstacles && !colliders.some(c => c.object1 === this.enemies && c.object2 === this.lowObstacles)) {
        this.physics.add.collider(this.enemies, this.lowObstacles);
      }
    }

    // 4. Projectiles <-> Solid Obstacles (Arrows shatter on solid walls, pass over water & low obstacles)
    if (this.projectiles) {
      if (!colliders.some(c => c.object1 === this.projectiles && c.object2 === this.obstacles)) {
        this.physics.add.collider(this.projectiles, this.obstacles, (arrow) => {
          if (arrow && arrow.active) arrow.destroy();
        });
      }
    }

    // 5. Hazard zones (Campfire)
    if (this.hazardZones) {
      if (!colliders.some(c => c.object1 === this.player && c.object2 === this.hazardZones)) {
        this.physics.add.overlap(this.player, this.hazardZones, this.handlePlayerHazardTouch, null, this);
      }
      if (this.enemies && !colliders.some(c => c.object1 === this.enemies && c.object2 === this.hazardZones)) {
        this.physics.add.overlap(this.enemies, this.hazardZones, this.handleEnemyHazardTouch, null, this);
      }
    }

    // 6. Slow zones (Mud/Swamp)
    if (this.slowZones && !colliders.some(c => c.object1 === this.player && c.object2 === this.slowZones)) {
      this.physics.add.overlap(this.player, this.slowZones, this.handlePlayerSlowTouch, null, this);
    }
  }

  /**
   * Dynamically build or recreate static obstacle colliders from this.mapObstacles
   */
  rebuildObstacleColliders() {
    if (!this.obstacles) return;
    this.obstacles.clear(true, true);
    if (this.waterObstacles) this.waterObstacles.clear(true, true);
    if (this.lowObstacles) this.lowObstacles.clear(true, true);
    if (this.hazardZones) this.hazardZones.clear(true, true);
    if (this.slowZones) this.slowZones.clear(true, true);

    this.mapObstacles.forEach(obs => {
      const type = obs.type || 'solid';
      const zone = this.add.zone(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w, obs.h);
      this.physics.add.existing(zone, true);

      if (type === 'water') {
        this.waterObstacles.add(zone);
      } else if (type === 'low') {
        this.lowObstacles.add(zone);
      } else if (type === 'hazard') {
        this.hazardZones.add(zone);
      } else if (type === 'slow') {
        this.slowZones.add(zone);
      } else {
        this.obstacles.add(zone);
      }
    });

    // Keep global reference updated
    MAP_OBSTACLES = this.mapObstacles;
  }

  /**
   * Handle character touching a hazard zone (fire, spikes, lava)
   */
  handlePlayerHazardTouch(player, hazardZone) {
    if (this.isDead || this.isInvulnerable) return;
    const now = this.time.now;
    if (this._lastHazardHit && now - this._lastHazardHit < 800) return;
    this._lastHazardHit = now;
    this.createFloatingText(player.x, player.y - 30, '¡FUEGO! -1', 0xef4444);
    this.damagePlayer(1);
  }

  handleEnemyHazardTouch(enemy, hazardZone) {
    if (!enemy || !enemy.active || enemy.isDead) return;
    const now = this.time.now;
    if (enemy._lastHazardHit && now - enemy._lastHazardHit < 800) return;
    enemy._lastHazardHit = now;
    enemy.hp = Math.max(0, enemy.hp - 1);
    this.createFloatingText(enemy.x, enemy.y - 25, '¡TRAMPA! -1', 0xf59e0b);
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    } else {
      enemy.setTint(0xff4444);
      this.time.delayedCall(160, () => {
        if (enemy && enemy.active && !enemy.isDead) enemy.clearTint();
      });
    }
  }

  /**
   * Handle player stepping into mud / swamp slow zone
   */
  handlePlayerSlowTouch(player, slowZone) {
    this._inSlowZone = true;
    this._slowZoneTimer = this.time.now + 120;
  }

  /**
   * Toggle visual rendering of collision hitboxes (P key)
   */
  toggleCollisionDebug() {
    this.showCollisionDebug = !this.showCollisionDebug;
    this.obstacleDebugGfx.clear();
    this.characterDebugGfx.clear();

    if (this.showCollisionDebug) {
      this.obstacleDebugGfx.setDepth(20000);
      this.characterDebugGfx.setDepth(20005);
      this.mapObstacles.forEach(obs => {
        if (obs.type === 'hazard') {
          this.obstacleDebugGfx.lineStyle(2, 0xef4444, 0.95);
          this.obstacleDebugGfx.fillStyle(0xef4444, 0.35);
        } else if (obs.type === 'water') {
          this.obstacleDebugGfx.lineStyle(2, 0x3b82f6, 0.95);
          this.obstacleDebugGfx.fillStyle(0x3b82f6, 0.35);
        } else if (obs.type === 'low') {
          this.obstacleDebugGfx.lineStyle(2, 0x06b6d4, 0.95);
          this.obstacleDebugGfx.fillStyle(0x06b6d4, 0.28);
        } else if (obs.type === 'slow') {
          this.obstacleDebugGfx.lineStyle(2, 0xeab308, 0.95);
          this.obstacleDebugGfx.fillStyle(0xeab308, 0.30);
        } else {
          this.obstacleDebugGfx.lineStyle(2, 0x22c55e, 0.95);
          this.obstacleDebugGfx.fillStyle(0x22c55e, 0.28);
        }
        this.obstacleDebugGfx.fillRect(obs.x, obs.y, obs.w, obs.h);
        this.obstacleDebugGfx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      });
      this.createFloatingText(this.player.x, this.player.y - 45, 'HITBOXES: ACTIVADAS (P)', 0x22c55e);
    } else {
      this.createFloatingText(this.player.x, this.player.y - 45, 'HITBOXES: OCULTAS (P)', 0x94a3b8);
    }
  }

  /**
   * Real-time rendering of feet hitboxes when debug mode is enabled
   */
  drawCharacterHitboxesDebug() {
    this.characterDebugGfx.clear();
    if (!this.showCollisionDebug || !this.player || !this.player.body) return;

    // Player feet hitbox (cyan)
    const pb = this.player.body;
    this.characterDebugGfx.lineStyle(2, 0x06b6d4, 1);
    this.characterDebugGfx.fillStyle(0x06b6d4, 0.45);
    this.characterDebugGfx.fillRect(pb.x, pb.y, pb.width, pb.height);
    this.characterDebugGfx.strokeRect(pb.x, pb.y, pb.width, pb.height);

    // Enemies feet hitboxes (orange)
    this.characterDebugGfx.lineStyle(2, 0xf97316, 1);
    this.characterDebugGfx.fillStyle(0xf97316, 0.45);
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active && !enemy.isDead && enemy.body) {
        const eb = enemy.body;
        this.characterDebugGfx.fillRect(eb.x, eb.y, eb.width, eb.height);
        this.characterDebugGfx.strokeRect(eb.x, eb.y, eb.width, eb.height);
      }
    });
  }

  /**
   * Create the Player sprite in the open central courtyard or custom player_spawn.
   */
  createPlayer() {
    // Check for custom player_spawn in mapObjects
    const pSpawn = this.mapObjects.find(o => o.type === 'player_spawn');
    const startX = pSpawn ? pSpawn.x : 230;
    const startY = pSpawn ? pSpawn.y : 220;

    this.player = this.physics.add.sprite(startX, startY, `${this.playerHero}_idle`);
    this.player.setDepth(startY);
    this.player.setScale(1.20);

    // Dynamic Physics Body with Hitbox placed strictly at the FEET (lower half of the body):
    // Dimensions: 16x8 px, Offset: (42, 52)
    // Only the feet collides with walls and scenery, allowing the head and torso
    // to naturally overlap walls for an authentic 2.5D perspective depth effect.
    this.player.body.setSize(16, 8);
    this.player.body.setOffset(42, 52);

    // Constrain player inside map bounds
    this.player.setCollideWorldBounds(true);

    // Play default idle animation
    this.player.play(`${this.playerHero}_idle`);
  }

  /**
   * Setup keyboard & pointer controls
   */
  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.rebindControls();

    // Enter key to trigger "¡ESTOY LISTO!" when waiting (only in practice mode)
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyEnter.on('down', () => {
      if (this._gameMode !== 'campaign' && !this.readyForCombat && this.gameStarted && !this.isDead) {
        this.triggerStartCombat();
      }
    });

    // Fullscreen key (F)
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.keyF.on('down', () => this.toggleFullscreen());

    // Grid toggle hotkey (G)
    this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.keyG.on('down', () => {
      if (this.devModeEnabled) this.toggleDevGrid();
    });

    // Delete selected item hotkeys (Delete / Backspace)
    this.keyDelete = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    this.keyDelete.on('down', () => {
      if (this.devModeEnabled) this.deleteSelectedItem();
    });
    this.keyBackspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    this.keyBackspace.on('down', () => {
      if (this.devModeEnabled) this.deleteSelectedItem();
    });

    // Auto-fit selected hitbox to pixels hotkey (A) when in dev mode
    this.keyA_Fit = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyA_Fit.on('down', () => {
      if (this.devModeEnabled && !this.gameStarted) {
        this.fitSelectedHitboxToPixels();
      }
    });

    // Arrow keys for nudging selected item in dev mode
    ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => {
      const k = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[dir]);
      k.on('down', () => {
        if (this.devModeEnabled) this.nudgeSelectedItem(dir);
      });
    });

    // Pointer events for Gameplay & Dev Mode
    this.input.on('pointerdown', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerDown(pointer);
        return;
      }
      if (!this.gameStarted || this.isDead || this.isGamePaused) return;

      sfx.init();
      if (pointer.leftButtonDown()) {
        this.performAttack();
      } else if (pointer.rightButtonDown()) {
        this.performSpecialAttack();
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerMove(pointer);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this.devModeEnabled) {
        this.handleDevPointerUp(pointer);
      }
    });

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (this.devModeEnabled) {
        this.handleDevWheel(pointer, deltaY);
      }
    });

    // Prevent default right click menu on canvas
    this.input.mouse.disableContextMenu();
  }

  /**
   * Rebind active keys dynamically from KeybindsManager
   */
  rebindControls() {
    if (!this.input || !this.input.keyboard) return;

    if (this.keyDevToggle) this.keyDevToggle.removeAllListeners();
    if (this.keyHitboxToggle) this.keyHitboxToggle.removeAllListeners();

    this.keyMoveUp = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveUp')));
    this.keyMoveDown = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveDown')));
    this.keyMoveLeft = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveLeft')));
    this.keyMoveRight = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('moveRight')));

    this.keyAttack = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('attack')));
    this.keySpecial = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('special')));
    this.keyDash = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('dash')));
    this.keySpin = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('spin')));

    this.keyHeroSoldier = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('heroSoldier')));
    this.keyHeroWizard = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('heroWizard') || '2'));

    // Auxiliary space key for fallback melee attack
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Dev mode toggle hotkey
    this.keyDevToggle = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('devMode')));
    this.keyDevToggle.on('down', () => this.toggleDevMode());

    // Hitbox visualization debug hotkey
    this.keyHitboxToggle = this.input.keyboard.addKey(resolvePhaserKeyCode(KeybindsManager.get('hitboxes')));
    this.keyHitboxToggle.on('down', () => this.toggleCollisionDebug());
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
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
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

    // Handle Player Movement
    this.handlePlayerMovement();

    // Update Enemy AI & Chasing
    this.updateEnemies();

    // Animate doors based on player proximity
    this.checkDoorProximity();

    // Update wandering NPCs
    this.updateNPCs();
  }

  /**
   * 4-directional movement using configured keys and Arrow Keys.
   * Includes diagonal normalization and world boundary protection.
   */
  handlePlayerMovement() {
    if (this.isAttacking || this.isDashing || this.isSpinning) {
      if (this.isAttacking) {
        this.player.setVelocity(0, 0);
      }
      return;
    }

    let vx = 0;
    let vy = 0;

    const left = (this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown;
    const right = (this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown;
    const up = (this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown;
    const down = (this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      // Normalize diagonal vector
      const isSlowed = this._inSlowZone && this.time.now < this._slowZoneTimer;
      const speed = isSlowed ? this.playerSpeed * 0.5 : this.playerSpeed;
      const mag = Math.hypot(vx, vy);
      this.player.setVelocity((vx / mag) * speed, (vy / mag) * speed);

      // Facing direction
      if (vx < 0) {
        this.player.setFlipX(true);
        this.facingDirection = 'left';
      } else if (vx > 0) {
        this.player.setFlipX(false);
        this.facingDirection = 'right';
      }

      // Play walk animation
      const walkAnim = `${this.playerHero}_walk`;
      if (this.player.anims.currentAnim?.key !== walkAnim) {
        this.player.play(walkAnim);
      }
    } else {
      this.player.setVelocity(0, 0);
      // Play idle animation
      const idleAnim = `${this.playerHero}_idle`;
      if (this.player.anims.currentAnim?.key !== idleAnim) {
        this.player.play(idleAnim);
      }
    }
  }

  /**
   * Primary Attack (Combo Attack01 & Attack02)
   */
  performAttack() {
    if (this._gameMode === 'campaign' || this.isAttacking || this.isDead) return;

    this.isAttacking = true;

    if (this.playerHero === 'wizard') {
      this.lastAttackCombo = this.lastAttackCombo === 1 ? 2 : 1;
      this.player.play('wizard_attack1');
      sfx.playMagic();

      // Magic hit window midway through animation
      this.time.delayedCall(190, () => {
        if (this.isDead) return;
        this.checkWizardMagicHits();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) {
          this.player.play('wizard_idle');
        }
      });
      return;
    }

    this.lastAttackCombo = this.lastAttackCombo === 1 ? 2 : 1;
    const animKey = `${this.playerHero}_attack${this.lastAttackCombo}`;

    this.player.play(animKey);
    sfx.playSwing();

    // Active hit window midway through animation
    this.time.delayedCall(160, () => {
      if (this.isDead) return;
      this.checkMeleeHits();
    });

    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.player.play(`${this.playerHero}_idle`);
      }
    });
  }

  /**
   * Special Attack:
   * - Soldier: Shoots an arrow projectile
   * - Wizard: Launches an exploding fireball projectile
   * - Orc: Heavy ground smash shockwave AOE
   */
  performSpecialAttack() {
    if (this._gameMode === 'campaign' || this.isAttacking || this.isDead) return;

    this.isAttacking = true;

    if (this.playerHero === 'wizard') {
      // Wizard Fireball Cast (14 frames)
      this.player.play('wizard_attack2');
      sfx.playFireball();

      this.time.delayedCall(230, () => {
        if (!this.isDead) this.castFireball();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('wizard_idle');
      });
    } else if (this.playerHero === 'soldier') {
      // Soldier Bow Shot
      this.player.play('soldier_attack3');
      sfx.playShoot();

      this.time.delayedCall(220, () => {
        if (!this.isDead) this.shootArrow();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('soldier_idle');
      });
    } else {
      // Orc Ground Smash
      this.player.play('orc_attack2');
      sfx.playSwing();

      this.time.delayedCall(200, () => {
        if (!this.isDead) this.createGroundSmash();
      });

      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
        if (!this.isDead) this.player.play('orc_idle');
      });
    }
  }

  /**
   * Special Dash Movement:
   * - Soldier: Physical forward dash thrust with cyan afterimages
   * - Wizard: Arcane Blink with violet/cyan astral phase and invulnerability
   */
  performDash() {
    if (this.isDead || this.isDashing) return;

    const now = this.time.now;
    if (now - this.lastDashTime < this.dashCooldown) return;

    // Check Stamina: Dash consumes half the stamina bar (50%)
    const dashCost = this.dashStaminaCost || 50;
    if (this.stamina < dashCost) {
      this.showLowStaminaWarning('Dash');
      return;
    }

    this.stamina = Math.max(0, this.stamina - dashCost);
    this.updateStaminaBar();

    this.isDashing = true;
    this.lastDashTime = now;
    this.isAttacking = false;
    this.isInvulnerable = true;

    // Determine dash direction vector (from keys or facing direction)
    let vx = 0;
    let vy = 0;
    if ((this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown) vx -= 1;
    if ((this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown) vx += 1;
    if ((this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown) vy -= 1;
    if ((this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown) vy += 1;

    if (vx === 0 && vy === 0) {
      vx = this.facingDirection === 'left' ? -1 : 1;
      vy = 0;
    } else {
      const mag = Math.hypot(vx, vy);
      vx /= mag;
      vy /= mag;
    }

    // Orient character sprite
    if (vx < 0) {
      this.player.setFlipX(true);
      this.facingDirection = 'left';
    } else if (vx > 0) {
      this.player.setFlipX(false);
      this.facingDirection = 'right';
    }

    // Set forward dash velocity
    const isWizard = this.playerHero === 'wizard';
    const dashSpeed = isWizard ? 460 : 440;
    this.player.setVelocity(vx * dashSpeed, vy * dashSpeed);

    // Play animation & sound (Wizard uses dash.png)
    if (isWizard) {
      this.player.play('wizard_dash');
      sfx.playMagic();
    } else {
      this.player.play('soldier_dash');
      sfx.playDash();
    }

    // Afterimage / ghost trail effect
    const ghostKey = isWizard ? 'wizard_dash' : 'soldier_dash';
    const ghostTint = isWizard ? 0xc084fc : 0x38bdf8;
    const ghostTimer = this.time.addEvent({
      delay: 50,
      repeat: 4,
      callback: () => {
        if (!this.player || this.isDead) return;
        const ghost = this.add.sprite(this.player.x, this.player.y, ghostKey);
        const maxF = isWizard ? 5 : 6;
        const curFrame = this.player.anims.currentFrame ? this.player.anims.currentFrame.index - 1 : 2;
        ghost.setFrame(Math.min(Math.max(curFrame, 0), maxF));
        ghost.setFlipX(this.player.flipX);
        ghost.setScale(this.player.scaleX, this.player.scaleY);
        ghost.setAlpha(0.6);
        ghost.setTint(ghostTint);
        ghost.setDepth(this.player.depth - 1);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: this.player.scaleX * 0.9,
          scaleY: this.player.scaleY * 0.9,
          duration: 200,
          onComplete: () => ghost.destroy()
        });
      }
    });

    // Active strike window midway through dash
    this.time.delayedCall(140, () => {
      if (this.isDead || !this.isDashing) return;
      if (isWizard) {
        this.checkWizardMagicHits();
      } else {
        this.checkMeleeHits();
      }
    });

    // On animation complete or timeout, restore normal movement and idle
    this.time.delayedCall(340, () => {
      if (this.isDashing) {
        this.isDashing = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead) {
          this.player.setVelocity(0, 0);
          this.player.play(`${this.playerHero}_idle`);
        }
      }
    });
  }

  /**
   * Special Whirlwind Spin Attack (Soldier):
   * Spins 360 degrees TWO full times before stopping, dealing sweeping AOE damage
   * to all surrounding enemies in a 360-degree radius with wind ghost trails and whoosh sound.
   */
  performSpin() {
    if (this._gameMode === 'campaign' || this.isDead || this.isSpinning || this.isDashing) return;
    if (this.playerHero !== 'soldier') return;

    const now = this.time.now;
    if (now - this.lastSpinTime < this.spinCooldown) return;

    // Check Stamina: Whirlwind Spin requires stamina (35%)
    const spinCost = this.spinStaminaCost || 35;
    if (this.stamina < spinCost) {
      this.showLowStaminaWarning('Giro');
      return;
    }

    this.stamina = Math.max(0, this.stamina - spinCost);
    this.updateStaminaBar();

    this.isSpinning = true;
    this.lastSpinTime = now;
    this.isAttacking = false;
    this.isInvulnerable = true;

    // Optional controlled drift if movement keys are pressed
    let vx = 0;
    let vy = 0;
    if ((this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown) vx -= 1;
    if ((this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown) vx += 1;
    if ((this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown) vy -= 1;
    if ((this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const mag = Math.hypot(vx, vy);
      const spinSpeed = 100;
      this.player.setVelocity((vx / mag) * spinSpeed, (vy / mag) * spinSpeed);
    } else {
      this.player.setVelocity(0, 0);
    }

    // Play animation (repeat: 1 -> 2 complete spins before stopping)
    this.player.play('soldier_spin');
    sfx.playSpin();

    // Afterimage / whirlwind wind trail effect
    const ghostTimer = this.time.addEvent({
      delay: 70,
      repeat: 9,
      callback: () => {
        if (!this.player || this.isDead || !this.isSpinning) return;
        const ghost = this.add.sprite(this.player.x, this.player.y, 'soldier_spin');
        const curFrame = this.player.anims.currentFrame ? this.player.anims.currentFrame.index - 1 : 2;
        ghost.setFrame(Math.min(Math.max(curFrame, 0), 5));
        ghost.setScale(this.player.scaleX, this.player.scaleY);
        ghost.setAlpha(0.48);
        ghost.setTint(0x7dd3fc); // Cool pale whirlwind cyan
        ghost.setDepth(this.player.depth - 1);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: this.player.scaleX * 1.1,
          scaleY: this.player.scaleY * 1.1,
          duration: 180,
          onComplete: () => ghost.destroy()
        });
      }
    });

    // 1st spin hit check (midway through first rotation: ~150ms)
    this.time.delayedCall(150, () => {
      if (this.isDead || !this.isSpinning) return;
      this.checkSpinHits();
    });

    // 2nd spin hit check (midway through second rotation: ~580ms) and whoosh sound
    this.time.delayedCall(580, () => {
      if (this.isDead || !this.isSpinning) return;
      sfx.playSpin();
      this.checkSpinHits();
    });

    // On animation complete (fires after the 2nd rotation completes)
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim.key === 'soldier_spin') {
        this.isSpinning = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead) {
          this.player.setVelocity(0, 0);
          this.player.play('soldier_idle');
        }
      }
    });

    // Safety fallback timer if animation event is interrupted (approx 860ms total duration at 14fps)
    this.time.delayedCall(950, () => {
      if (this.isSpinning) {
        this.isSpinning = false;
        this.isInvulnerable = false;
        ghostTimer.remove();
        if (!this.isDead && this.player.anims.currentAnim?.key === 'soldier_spin') {
          this.player.setVelocity(0, 0);
          this.player.play('soldier_idle');
        }
      }
    });
  }

  /**
   * Whirlwind 360 AOE damage around soldier
   */
  checkSpinHits() {
    const hitRadius = 75;
    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.playHit();
      this.cameras.main.shake(120, 0.0035);
    }
  }

  /**
   * Shoot Arrow Projectile (Soldier)
   */
  shootArrow() {
    const isLeft = this.facingDirection === 'left';
    const spawnX = isLeft ? this.player.x - 24 : this.player.x + 24;
    const spawnY = this.player.y + 6;

    const arrow = this.projectiles.create(spawnX, spawnY, 'arrow');
    arrow.isFireball = false;
    arrow.setDepth(Math.max(10, Math.round(spawnY + 16)));
    arrow.setScale(1.2);
    arrow.setFlipX(isLeft);

    const speed = 460;
    arrow.setVelocityX(isLeft ? -speed : speed);
    arrow.body.setAllowGravity(false);
    arrow.body.setSize(22, 10);

    // Auto destroy after 2 seconds
    this.time.delayedCall(2000, () => {
      if (arrow && arrow.active) arrow.destroy();
    });
  }

  /**
   * Wizard Fireball Spell:
   * Launches animated fireball projectile that damages and explodes on contact
   */
  castFireball() {
    const isLeft = this.facingDirection === 'left';
    const spawnX = isLeft ? this.player.x - 26 : this.player.x + 26;
    const spawnY = this.player.y + 4;

    const fireball = this.projectiles.create(spawnX, spawnY, 'wizard_fireball');
    fireball.isFireball = true;
    fireball.setDepth(Math.max(10, Math.round(spawnY + 16)));
    fireball.setScale(1.15);
    fireball.setFlipX(isLeft);

    if (this.anims.exists('wizard_fireball_anim')) {
      fireball.play('wizard_fireball_anim');
    }

    const speed = 420;
    fireball.setVelocityX(isLeft ? -speed : speed);
    fireball.body.setAllowGravity(false);
    fireball.body.setSize(24, 20);
    fireball.body.setOffset(isLeft ? 30 : 46, 40);

    // Trailing sparks timer
    const emberTimer = this.time.addEvent({
      delay: 60,
      repeat: 25,
      callback: () => {
        if (!fireball || !fireball.active) {
          emberTimer.remove();
          return;
        }
        const p = this.add.circle(fireball.x + Phaser.Math.Between(-4, 4), fireball.y + Phaser.Math.Between(-4, 4), Phaser.Math.Between(2, 4), 0xf97316, 0.8);
        p.setDepth(fireball.depth - 1);
        this.tweens.add({
          targets: p,
          alpha: 0,
          scale: 0.2,
          y: p.y - 10,
          duration: 250,
          onComplete: () => p.destroy()
        });
      }
    });

    // Auto destroy after 2.2 seconds
    this.time.delayedCall(2200, () => {
      if (fireball && fireball.active) fireball.destroy();
    });
  }

  /**
   * Wizard Primary Magic Hit Check (Ice / Arcane Shards AOE Cone)
   */
  checkWizardMagicHits() {
    const isLeft = this.facingDirection === 'left';
    const hitX = isLeft ? this.player.x - 48 : this.player.x + 48;
    const hitY = this.player.y + 4;
    const hitRadius = 70;

    // Visual magic blast effect
    const blast = this.add.circle(hitX, hitY, 15, 0x38bdf8, 0.7);
    blast.setDepth(this.player.depth + 1);
    this.tweens.add({
      targets: blast,
      radius: 50,
      alpha: 0,
      duration: 220,
      onComplete: () => blast.destroy()
    });

    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.playHit();
      this.cameras.main.shake(120, 0.005);
    }
  }

  /**
   * Orc Ground Smash Shockwave AOE
   */
  createGroundSmash() {
    sfx.playHit();
    this.cameras.main.shake(180, 0.008);

    // Shockwave ring graphics
    const shockwave = this.add.circle(this.player.x, this.player.y + 14, 20, 0xffaa00, 0.6);
    shockwave.setDepth(4);
    this.tweens.add({
      targets: shockwave,
      radius: 80,
      alpha: 0,
      duration: 350,
      onComplete: () => shockwave.destroy()
    });

    // Damage all enemies in 85px radius
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 85) {
        this.damageEnemy(enemy, 2, this.player.x, this.player.y);
      }
    });
  }

  /**
   * Check melee hits against active enemies
   */
  checkMeleeHits() {
    const isLeft = this.facingDirection === 'left';
    const hitX = isLeft ? this.player.x - 42 : this.player.x + 42;
    const hitY = this.player.y + 6;
    const hitRadius = 50;

    let hitCount = 0;
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
      if (dist <= hitRadius) {
        this.damageEnemy(enemy, 1, this.player.x, this.player.y);
        hitCount++;
      }
    });

    if (hitCount > 0) {
      sfx.playHit();
      this.cameras.main.shake(120, 0.004);
    }
  }

  /**
   * Damage an Enemy and trigger reactions:
   * - Red tint flash
   * - Hurt animation
   * - Knockback impulse
   * - Floating damage number
   * - Death animation if HP <= 0
   */
  damageEnemy(enemy, amount, sourceX, sourceY) {
    if (enemy.isDead) return;

    enemy.hp -= amount;

    // Floating damage text
    this.createFloatingText(enemy.x, enemy.y - 20, `-${amount}`, 0xffdd44);

    // Knockback
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    const knockbackForce = 160;
    enemy.body.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);

    // Red damage flash
    enemy.setTint(0xff3333);
    this.time.delayedCall(160, () => {
      if (enemy.active && !enemy.isDead) enemy.clearTint();
    });

    if (enemy.hp <= 0) {
      // Enemy Defeated
      enemy.isDead = true;
      enemy.body.setVelocity(0, 0);
      enemy.body.checkCollision.none = true;
      sfx.playEnemyDeath();

      // Play death animation
      enemy.play(`${enemy.type}_death`);
      this.kills++;
      this.score += 100;
      this.updateHUD();

      // Chance to drop a heart (30% chance if player is missing health)
      if (this.health < this.maxHealth && Math.random() < 0.35) {
        this.spawnHeartPickup(enemy.x, enemy.y);
      }

      // Fade out after death
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        delay: 600,
        duration: 400,
        onComplete: () => {
          enemy.destroy();
        }
      });
    } else {
      // Alert enemy if hit while patrolling or idling
      if (enemy.state !== 'chase') {
        this.alertEnemy(enemy);
      }

      // Play hurt animation
      enemy.play(`${enemy.type}_hurt`);
      enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!enemy.isDead && enemy.active) {
          enemy.play(`${enemy.type}_idle`);
        }
      });
    }
  }

  /**
   * Projectile hits enemy
   */
  handleProjectileHitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active || enemy.isDead) return;
    const px = projectile.x;
    const py = projectile.y;
    const isFireball = projectile.isFireball;
    projectile.destroy();

    if (isFireball) {
      sfx.playHit();
      this.cameras.main.shake(160, 0.007);
      // Fireball explosion visual
      const boom = this.add.circle(px, py, 18, 0xf97316, 0.85);
      boom.setDepth(15);
      this.tweens.add({
        targets: boom,
        radius: 55,
        alpha: 0,
        duration: 250,
        onComplete: () => boom.destroy()
      });

      // Explosion AOE damage (2 damage to primary, 1 to nearby)
      this.damageEnemy(enemy, 2, px, py);
      this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead || e === enemy) return;
        const dist = Phaser.Math.Distance.Between(px, py, e.x, e.y);
        if (dist <= 65) {
          this.damageEnemy(e, 1, px, py);
        }
      });
    } else {
      this.damageEnemy(enemy, 1, px, py);
      sfx.playHit();
    }
  }

  /**
   * Spawns generic enemies in waves.
   * Orcs are exclusively enemies; Soldier and Wizard are the playable heroes.
   */
  spawnEnemyWave() {
    if (this._gameMode === 'campaign' || !this.readyForCombat || this.isDead || (this.devModeEnabled && this.devAiPaused)) return;
    const currentEnemies = this.enemies.countActive(true);
    const maxEnemies = 7 + this.wave;

    if (currentEnemies < maxEnemies) {
      // Filter active spawns eligible for current wave
      const eligibleSpawns = (this.enemySpawns || []).filter(s => s.active !== false && (s.minWave || 1) <= this.wave);

      let spawnPoint = null;
      if (eligibleSpawns.length > 0) {
        spawnPoint = Phaser.Utils.Array.GetRandom(eligibleSpawns);
      } else if (this.enemySpawns && this.enemySpawns.length > 0) {
        const anyActive = this.enemySpawns.filter(s => s.active !== false);
        if (anyActive.length > 0) spawnPoint = Phaser.Utils.Array.GetRandom(anyActive);
      }

      if (spawnPoint) {
        const radius = spawnPoint.radius || 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const ex = Phaser.Math.Clamp(spawnPoint.x + Math.cos(angle) * dist, 32, this.mapWidth - 32);
        const ey = Phaser.Math.Clamp(spawnPoint.y + Math.sin(angle) * dist, 32, this.mapHeight - 32);
        this.spawnEnemy(ex, ey, 'orc');
      } else {
        const defaultPoints = [
          { x: 520, y: 320 },
          { x: 120, y: 440 },
          { x: 440, y: 520 },
          { x: 160, y: 120 }
        ];
        const pt = Phaser.Utils.Array.GetRandom(defaultPoints);
        this.spawnEnemy(pt.x, pt.y);
      }
    }

    // Increment wave every 30 seconds
    const elapsedSecs = Math.floor((Date.now() - this.gameStartTime) / 1000);
    this.wave = 1 + Math.floor(elapsedSecs / 30);
    const waveEl = document.getElementById('stat-wave');
    if (waveEl) waveEl.textContent = this.wave;
  }

  /**
   * Instantiate an enemy sprite with peaceful AI state and dynamic physics body.
   * Enemies do NOT chase on spawn; they spawn peacefully and patrol or idle
   * until they spot the player or player comes close.
   */
  spawnEnemy(x, y, overrideType = null) {
    if (this._gameMode === 'campaign') return null; // Peaceful lobby
    // Orc is strictly the enemy; Soldier and Wizard are the only playable characters
    const enemyType = 'orc';

    const enemy = this.enemies.create(x, y, `${enemyType}_idle`);
    enemy.type = enemyType;
    enemy.hp = 2;
    enemy.maxHp = 2;
    enemy.isDead = false;
    enemy.isAttacking = false;
    enemy.attackCooldown = 0;
    enemy.setDepth(8);
    enemy.setScale(1.20);

    // Dynamic Physics Body with Hitbox placed at feet:
    // Tight 16x8 box placed at feet so obstacles physically block movement
    enemy.body.setSize(16, 8);
    enemy.body.setOffset(42, 52);
    enemy.setCollideWorldBounds(true);

    // Stealth / Perception AI state:
    // Starts peacefully in 'idle' or 'patrol' (never immediately chasing)
    enemy.state = 'idle'; // 'idle' | 'patrol' | 'alerting' | 'chase'
    enemy.facing = Math.random() < 0.5 ? 'left' : 'right';
    enemy.setFlipX(enemy.facing === 'left');
    enemy.patrolTimer = this.time.now + Phaser.Math.Between(1000, 2800);
    enemy.patrolVx = 0;
    enemy.patrolVy = 0;
    enemy.reactionDelay = 0;

    enemy.play(`${enemyType}_idle`);

    // Gentle fade-in spawn effect
    enemy.setAlpha(0);
    this.tweens.add({
      targets: enemy,
      alpha: 1,
      duration: 350
    });
    return enemy;
  }

  /**
   * Triggers alert when enemy sees or senses the player:
   * - Shows retro animated '!' indicator over head
   * - Plays retro alert chime
   * - Turns towards player with brief reaction delay before charging
   * - Alerts nearby comrades (pack behavior)
   */
  alertEnemy(enemy) {
    if (!enemy.active || enemy.isDead || enemy.state === 'chase' || enemy.state === 'alerting') return;

    enemy.state = 'alerting';
    enemy.setVelocity(0, 0);
    enemy.reactionDelay = this.time.now + 260; // 260ms reaction hesitation

    // Sound chime
    sfx.playAlert();

    // Turn immediately to look at player
    const faceLeft = this.player.x < enemy.x;
    enemy.facing = faceLeft ? 'left' : 'right';
    enemy.setFlipX(faceLeft);

    // Floating Retro Pixel '!' indicator
    const alertText = this.add.text(enemy.x, enemy.y - 42, '!', {
      fontFamily: 'MedievalSharp, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      fill: '#fcd567',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(25000);

    this.tweens.add({
      targets: alertText,
      y: enemy.y - 58,
      scale: { from: 0.6, to: 1.3 },
      alpha: { from: 1, to: 0 },
      ease: 'Back.easeOut',
      duration: 550,
      onComplete: () => {
        alertText.destroy();
      }
    });

    // After brief reaction pause, enter chase mode
    this.time.delayedCall(260, () => {
      if (enemy.active && !enemy.isDead && enemy.state === 'alerting') {
        enemy.state = 'chase';
      }
    });

    // Alert nearby comrades within 110px radius (group aggro)
    this.enemies.getChildren().forEach(ally => {
      if (ally !== enemy && ally.active && !ally.isDead && ally.state !== 'chase' && ally.state !== 'alerting') {
        const allyDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
        if (allyDist <= 110) {
          this.time.delayedCall(140, () => {
            if (ally.active && !ally.isDead) {
              this.alertEnemy(ally);
            }
          });
        }
      }
    });
  }

  /**
   * AI behavior for all active enemies:
   * 1. Peaceful state (idle / patrol):
   *    - Wanders around smoothly or stands still looking around.
   *    - Perception checks:
   *      a) Proximity: within 150px detects footsteps/presence.
   *      b) Vision cone: within 270px in front of facing direction.
   * 2. Alerting state:
   *    - Displays '!' indicator and turns to player.
   * 3. Chase & Attack state:
   *    - Rushes toward player, sliding on obstacles.
   *    - Attacks when within 42px.
   *    - De-aggros with '?' indicator if player flees > 480px away.
   */
  updateEnemies() {
    if (this._gameMode === 'campaign') return;
    const now = this.time.now;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isDead) return;

      // Dynamic 2.5D depth sorting based on Y position (character feet)
      enemy.setDepth(Math.max(10, Math.round(enemy.body ? enemy.body.bottom : enemy.y + 24)));

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      // -------------------------------------------------------------
      // STATE: IDLE OR PATROL (Un-alerted / Peaceful)
      // -------------------------------------------------------------
      if (enemy.state === 'idle' || enemy.state === 'patrol') {
        // Perception Check:
        // 1. Proximity detection (heard footsteps or player too close)
        const inProximity = dist <= 150;

        // 2. Vision cone detection (player is in front of where enemy is facing)
        let inVisionCone = false;
        if (dist <= 270) {
          const dy = Math.abs(this.player.y - enemy.y);
          if (dy <= 150) {
            if (enemy.facing === 'left' && this.player.x < enemy.x) {
              inVisionCone = true;
            } else if (enemy.facing === 'right' && this.player.x > enemy.x) {
              inVisionCone = true;
            }
          }
        }

        // If detected, trigger alert and chase!
        if (inProximity || inVisionCone) {
          this.alertEnemy(enemy);
          return;
        }

        // Peaceful wander / idle AI loop
        if (now > enemy.patrolTimer) {
          enemy.patrolTimer = now + Phaser.Math.Between(1800, 3600);

          if (Math.random() < 0.4) {
            // Stay idle
            enemy.state = 'idle';
            enemy.patrolVx = 0;
            enemy.patrolVy = 0;
            enemy.setVelocity(0, 0);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) {
              enemy.play(`${enemy.type}_idle`);
            }
          } else {
            // Wander in a random direction
            enemy.state = 'patrol';
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const wanderSpeed = Phaser.Math.Between(35, 52);
            enemy.patrolVx = Math.cos(angle) * wanderSpeed;
            enemy.patrolVy = Math.sin(angle) * wanderSpeed;

            // Set facing based on wander direction
            if (enemy.patrolVx < -5) {
              enemy.facing = 'left';
              enemy.setFlipX(true);
            } else if (enemy.patrolVx > 5) {
              enemy.facing = 'right';
              enemy.setFlipX(false);
            }

            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
            if (enemy.anims.currentAnim?.key !== `${enemy.type}_walk`) {
              enemy.play(`${enemy.type}_walk`);
            }
          }
        } else if (enemy.state === 'patrol') {
          // If hit obstacle while patrolling, reverse or redirect
          if (enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.patrolVx = -enemy.patrolVx;
            enemy.facing = enemy.patrolVx < 0 ? 'left' : 'right';
            enemy.setFlipX(enemy.facing === 'left');
            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
          }
          if (enemy.body.blocked.up || enemy.body.blocked.down) {
            enemy.patrolVy = -enemy.patrolVy;
            enemy.setVelocity(enemy.patrolVx, enemy.patrolVy);
          }
        }
        return;
      }

      // -------------------------------------------------------------
      // STATE: ALERTING (Brief reaction hesitation)
      // -------------------------------------------------------------
      if (enemy.state === 'alerting') {
        const faceLeft = this.player.x < enemy.x;
        enemy.facing = faceLeft ? 'left' : 'right';
        enemy.setFlipX(faceLeft);
        enemy.setVelocity(0, 0);
        return;
      }

      // -------------------------------------------------------------
      // STATE: CHASE (Alerted and pursuing player)
      // -------------------------------------------------------------
      if (enemy.state === 'chase') {
        // Face player
        const faceLeft = this.player.x < enemy.x;
        enemy.facing = faceLeft ? 'left' : 'right';
        enemy.setFlipX(faceLeft);

        // Attack if within melee reach (50px)
        if (dist <= 50) {
          enemy.setVelocity(0, 0);
          if (now > enemy.attackCooldown && !enemy.isAttacking) {
            enemy.isAttacking = true;
            enemy.attackCooldown = now + 1400; // Attack every 1.4s

            enemy.play(`${enemy.type}_attack1`);

            this.time.delayedCall(220, () => {
              if (enemy.active && !enemy.isDead && !this.isDead) {
                const currentDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (currentDist <= 58) {
                  this.damagePlayer(1);
                }
              }
            });

            enemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              enemy.isAttacking = false;
              if (enemy.active && !enemy.isDead) {
                enemy.play(`${enemy.type}_idle`);
              }
            });
          }
        } else if (dist <= 480 && !enemy.isAttacking) {
          // Rush towards player
          const speed = 95 + (this.wave * 4);
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

          let vx = Math.cos(angle) * speed;
          let vy = Math.sin(angle) * speed;

          // Slide along obstacles if blocked
          if (enemy.body.blocked.left || enemy.body.blocked.right) {
            vy = Math.sign(this.player.y - enemy.y || 1) * speed;
          } else if (enemy.body.blocked.up || enemy.body.blocked.down) {
            vx = Math.sign(this.player.x - enemy.x || 1) * speed;
          }

          enemy.setVelocity(vx, vy);

          const walkAnim = `${enemy.type}_walk`;
          if (enemy.anims.currentAnim?.key !== walkAnim) {
            enemy.play(walkAnim);
          }
        } else if (dist > 480 && !enemy.isAttacking) {
          // Player managed to flee far away! Enemy loses sight and resets to idle
          enemy.state = 'idle';
          enemy.setVelocity(0, 0);
          enemy.patrolTimer = now + 2000;
          if (enemy.anims.currentAnim?.key !== `${enemy.type}_idle`) {
            enemy.play(`${enemy.type}_idle`);
          }

          // Floating Retro Pixel '?' indicator
          const lostText = this.add.text(enemy.x, enemy.y - 42, '?', {
            fontFamily: 'MedievalSharp, monospace',
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#81c784',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5).setDepth(25000);

          this.tweens.add({
            targets: lostText,
            y: enemy.y - 58,
            alpha: { from: 1, to: 0 },
            duration: 650,
            onComplete: () => {
              lostText.destroy();
            }
          });
        }
      }
    });
  }

  /**
   * Damage player and update 3 Hearts Bar:
   * - Depletes one heart
   * - 1.2s invulnerability frames with flashing
   * - Red screen flash vignette
   * - Game Over on 0 hearts
   */
  damagePlayer(amount) {
    if (this._gameMode === 'campaign' || this.isInvulnerable || this.isDead) return;

    this.health -= amount;
    if (this.health < 0) this.health = 0;

    sfx.playPlayerHurt();
    this.cameras.main.shake(200, 0.012);

    // Screen flash red
    this.cameras.main.flash(220, 180, 20, 20);

    // Update 3 Hearts HUD
    this.updateHUD();

    if (this.health <= 0) {
      // Player Died
      this.isDead = true;
      this.player.setVelocity(0, 0);
      this.player.play(`${this.playerHero}_death`);
      sfx.playGameOver();

      this.time.delayedCall(1200, () => {
        this.showGameOverModal();
      });
    } else {
      // Invulnerability period
      this.isInvulnerable = true;
      this.player.play(`${this.playerHero}_hurt`);

      // Flashing alpha tween
      this.tweens.add({
        targets: this.player,
        alpha: 0.35,
        duration: 120,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          this.player.setAlpha(1);
          this.isInvulnerable = false;
        }
      });
    }
  }

  /**
   * Spawn a collectible Heart drop on enemy defeat
   */
  spawnHeartPickup(x, y) {
    if (!this.textures.exists('heart_pickup_icon')) {
      const hCanvas = document.createElement('canvas');
      hCanvas.width = 16;
      hCanvas.height = 16;
      const hCtx = hCanvas.getContext('2d');
      hCtx.fillStyle = '#ef4444';
      hCtx.fillRect(3, 2, 4, 3);
      hCtx.fillRect(9, 2, 4, 3);
      hCtx.fillRect(1, 4, 14, 4);
      hCtx.fillRect(3, 8, 10, 3);
      hCtx.fillRect(5, 11, 6, 2);
      hCtx.fillRect(7, 13, 2, 2);
      this.textures.addCanvas('heart_pickup_icon', hCanvas);
    }
    const heart = this.heartPickups.create(x, y, 'heart_pickup_icon');
    heart.setScale(1.3);
    heart.body.setSize(16, 16);
    heart.setDepth(6);

    // Floating bobbing tween
    this.tweens.add({
      targets: heart,
      y: y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Despawn after 8 seconds if uncollected
    this.time.delayedCall(8000, () => {
      if (heart.active) {
        heart.destroy();
      }
    });
  }

  /**
   * Collect heart to restore health
   */
  handlePickupHeart(player, heart) {
    if (!heart.active || this.health >= this.maxHealth) return;

    this.health = Math.min(this.maxHealth, this.health + 1);
    sfx.playHeartPickup();
    this.createFloatingText(player.x, player.y - 30, '+1 VIDA', 0x22c55e);

    heart.destroy();
    this.updateHUD();
  }

  /**
   * Floating damage & combat popups
   */
  createFloatingText(x, y, message, color = 0xffffff) {
    const txt = this.add.text(x, y, message, {
      fontFamily: 'Pixuf, MedievalSharp, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: txt,
      y: y - 32,
      alpha: 0,
      duration: 650,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  /**
   * Switch playable hero (Soldier <-> Wizard)
   */
  switchHero(newHero) {
    if (this.playerHero === newHero || this.isDead) return;

    this.isDashing = false;
    this.isSpinning = false;
    this.playerHero = newHero;
    const currentAnim = this.player.anims.currentAnim?.key;
    const validSuffixes = ['idle', 'walk', 'attack1', 'attack2'];
    const suffix = (currentAnim && validSuffixes.includes(currentAnim.split('_')[1])) ? currentAnim.split('_')[1] : 'idle';
    this.player.setTexture(`${this.playerHero}_${suffix}`);
    this.player.play(`${this.playerHero}_${suffix}`);

    // Re-apply character scale and feet hitbox dimensions on character change
    this.player.setScale(1.20);
    this.player.body.setSize(16, 8);
    this.player.body.setOffset(42, 52);

    // Update active hero button in DOM
    document.querySelectorAll('.hero-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hero === newHero);
    });

    // Update HUD display
    this.updateHUD();

    const heroDisplayName = newHero === 'wizard' ? 'MAGO ARCANO' : 'CABALLERO';
    this.createFloatingText(this.player.x, this.player.y - 44, `¡${heroDisplayName} ACTIVADO!`, newHero === 'wizard' ? 0xc084fc : 0xfbbf24);
  }

  /**
   * Update the DOM HUD (Hero Portrait, Ornate Frame, Health Bar, Pixel Hearts, Mana, Stats)
   */
  updateHUD() {
    // 1. Update Player Card: Portrait, Frame, Name
    const portraitImg = document.getElementById('hud-portrait-img');
    const portraitFrame = document.getElementById('hud-portrait-frame');
    const heroName = document.getElementById('hud-hero-name');
    if (portraitImg) {
      portraitImg.src = this.playerHero === 'wizard' ? 'assets/UI/Wizard.portraid.png' : 'assets/UI/SoldierPortraid.png';
    }
    if (portraitFrame) {
      portraitFrame.src = this.playerHero === 'wizard' ? 'assets/UI/icons/card_frame_wizard.png' : 'assets/UI/icons/card_frame_soldier.png';
    }
    if (heroName) {
      heroName.textContent = this.playerHero === 'wizard' ? 'MAGO ARCANO' : 'CABALLERO';
    }

    // 2. Health Bar Fill & Pixel Hearts
    const hpFill = document.getElementById('hud-hp-fill');
    if (hpFill) {
      const pct = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
      hpFill.style.width = `${pct}%`;
    }

    for (let i = 1; i <= 3; i++) {
      const heartImg = document.getElementById(`hud-heart-${i}`);
      if (heartImg) {
        heartImg.src = i <= this.health ? 'assets/UI/icons/heart_full.png' : 'assets/UI/icons/heart_empty.png';
        heartImg.classList.toggle('lost', i > this.health);
      }
    }

    // 3. Stamina / Energy Bar Fill & Styling
    const manaFill = document.getElementById('hud-mana-fill');
    const manaContainer = document.getElementById('hud-mana-container');
    if (manaFill) {
      const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
      manaFill.style.width = `${staminaPct}%`;
      if (this.playerHero === 'wizard') {
        manaFill.style.background = 'linear-gradient(180deg, #c084fc 0%, #9333ea 50%, #6b21a8 100%)';
        manaFill.style.boxShadow = '0 0 6px rgba(168, 85, 247, 0.6)';
        if (manaContainer) manaContainer.title = `Energía Arcana: ${Math.round(this.stamina)}% | Dash: 50%`;
      } else {
        manaFill.style.background = 'linear-gradient(180deg, #facc15 0%, #eab308 50%, #ca8a04 100%)';
        manaFill.style.boxShadow = '0 0 6px rgba(234, 179, 8, 0.6)';
        if (manaContainer) manaContainer.title = `Stamina (Guerrero): ${Math.round(this.stamina)}% | Dash: 50%, Giro: 35%`;
      }
    }

    // 4. Update switcher active class
    document.querySelectorAll('.hero-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hero === this.playerHero);
    });

    // 5. Legacy Candle Souls State (compatibility)
    for (let i = 1; i <= 3; i++) {
      const iconEl = document.getElementById(`heart-${i}`);
      if (!iconEl) continue;
      if (i <= this.health) {
        iconEl.textContent = '🕯️';
        iconEl.classList.remove('lost');
        iconEl.classList.add('full');
      } else {
        iconEl.textContent = '💨'; // Extinguished smoke
        iconEl.classList.remove('full');
        iconEl.classList.add('lost');
      }
    }

    // Stats or peaceful lobby display
    const statsBadge = document.querySelector('.stats-badge');
    let lobbyBadge = document.getElementById('hud-lobby-badge');
    if (this._gameMode === 'campaign') {
      if (statsBadge) statsBadge.style.display = 'none';
      if (!lobbyBadge && statsBadge && statsBadge.parentNode) {
        lobbyBadge = document.createElement('div');
        lobbyBadge.id = 'hud-lobby-badge';
        lobbyBadge.className = 'stats-badge lobby-peace-badge';
        lobbyBadge.innerHTML = '<span>🕊️ ALDEA EN PAZ (LOBBY)</span>';
        statsBadge.parentNode.insertBefore(lobbyBadge, statsBadge.nextSibling);
      }
      if (lobbyBadge) lobbyBadge.style.display = 'flex';
    } else {
      if (statsBadge) statsBadge.style.display = '';
      if (lobbyBadge) lobbyBadge.style.display = 'none';
    }

    const killsEl = document.getElementById('stat-kills');
    const scoreEl = document.getElementById('stat-score');
    if (killsEl) killsEl.textContent = this.kills;
    if (scoreEl) scoreEl.textContent = this.score;
  }

  /**
   * Fast real-time update of stamina bar fill width during regen and consumption
   */
  updateStaminaBar() {
    const manaFill = document.getElementById('hud-mana-fill');
    if (manaFill) {
      const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
      manaFill.style.width = `${staminaPct}%`;
    }
  }

  /**
   * Triggers visual warning, audio alert and floating text when stamina is insufficient
   */
  showLowStaminaWarning(skillName = 'Habilidad') {
    const now = this.time.now;
    if (this.lastLowStaminaWarning && now - this.lastLowStaminaWarning < 600) return;
    this.lastLowStaminaWarning = now;

    // Floating text popup above player
    if (this.player && this.player.active) {
      const label = this.playerHero === 'wizard' ? '¡Sin Energía!' : '¡Sin Stamina!';
      this.createFloatingText(this.player.x, this.player.y - 38, label, 0xfacc15);
    }

    // Audio cue
    sfx.playAlert();

    // Visual shake on HUD stamina container
    const container = document.getElementById('hud-mana-container') || document.querySelector('.hud-mana-container');
    if (container) {
      container.classList.remove('stamina-shake');
      void container.offsetWidth; // force CSS reflow
      container.classList.add('stamina-shake');
      setTimeout(() => container.classList.remove('stamina-shake'), 400);
    }
  }

  /**
   * Show Game Over Modal
   */
  showGameOverModal() {
    const elapsedSecs = Math.floor((Date.now() - this.gameStartTime) / 1000);
    document.getElementById('final-kills').textContent = this.kills;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-time').textContent = `${elapsedSecs}s`;

    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('active');
  }

  /**
   * Fullscreen toggle support (True full screen display)
   */
  toggleFullscreen() {
    const wrapper = document.getElementById('game-wrapper');
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (wrapper && wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => { });
      } else if (wrapper && wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
    }
  }

  /**
   * Helper to sync Sound button icons and labels across UI
   */
  syncOptionsAudioUI() {
    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = sfx.enabled ? '🔊' : '🔇';

    const optIcon = document.getElementById('opt-sound-icon');
    if (optIcon) optIcon.textContent = sfx.enabled ? '🔊' : '🔇';

    const optStatus = document.getElementById('opt-sound-status');
    if (optStatus) {
      optStatus.textContent = sfx.enabled ? 'Sonido activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)';
    }

    const optBadge = document.getElementById('opt-sound-badge');
    if (optBadge) {
      optBadge.textContent = sfx.enabled ? 'ON' : 'OFF';
      optBadge.style.color = sfx.enabled ? '#ffd700' : '#e2e8f0';
    }
  }

  /**
   * Wire DOM buttons (Sound, Fullscreen, Restart, Character Switchers, Menus & Modals)
   */
  bindDOMElements() {
    // -------------------------------------------------------------
    // FULLSCREEN ON FIRST INTERACTION
    // -------------------------------------------------------------
    const autoFullscreenHandler = () => {
      this.enterFullscreen();
    };
    window.addEventListener('click', autoFullscreenHandler, { once: true });
    window.addEventListener('keydown', autoFullscreenHandler, { once: true });

    // -------------------------------------------------------------
    // START MENU BUTTONS
    // -------------------------------------------------------------
    const btnPlay = document.getElementById('btn-menu-play');
    if (btnPlay) {
      btnPlay.onclick = () => {
        sfx.init();
        sfx.playSwing();
        this.openHeroSelectionModal('practice');
      };
    }

    const btnCampaign = document.getElementById('btn-menu-campaign');
    if (btnCampaign) {
      btnCampaign.onclick = () => {
        sfx.init();
        sfx.playSwing();
        this.openHeroSelectionModal('campaign');
      };
    }

    // Connect Hero Selection Modal buttons & cards
    this.setupHeroSelectionModalListeners();

    const btnMenuEditor = document.getElementById('btn-menu-editor');
    if (btnMenuEditor) {
      btnMenuEditor.onclick = () => {
        sfx.init();
        sfx.playSwing();
        this.openMapEditor();
      };
    }

    const btnMenuOptions = document.getElementById('btn-menu-options');
    if (btnMenuOptions) {
      btnMenuOptions.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      };
    }

    const btnMenuExit = document.getElementById('btn-menu-exit');
    if (btnMenuExit) {
      btnMenuExit.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('exit-modal')?.classList.add('active');
      };
    }

    // -------------------------------------------------------------
    // UNIFIED OPTIONS (AUDIO, FULLSCREEN, KEYBINDINGS)
    // -------------------------------------------------------------
    const btnOptAudio = document.getElementById('btn-opt-audio');
    if (btnOptAudio) {
      btnOptAudio.onclick = () => {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        music.setEnabled(sfx.enabled);
        if (sfx.enabled) sfx.playSwing();
        this.syncOptionsAudioUI();
      };
    }

    const btnOptFullscreen = document.getElementById('btn-opt-fullscreen');
    if (btnOptFullscreen) {
      btnOptFullscreen.onclick = () => {
        this.toggleFullscreen();
      };
    }

    const btnCloseOptions = document.getElementById('btn-close-options');
    if (btnCloseOptions) {
      btnCloseOptions.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('options-modal')?.classList.remove('active');
      };
    }

    const btnResetKeybinds = document.getElementById('btn-reset-keybinds');
    if (btnResetKeybinds) {
      btnResetKeybinds.onclick = () => {
        sfx.init();
        sfx.playHit();
        KeybindsManager.reset();
      };
    }

    // -------------------------------------------------------------
    // EXIT CONFIRMATION & FAREWELL MODALS
    // -------------------------------------------------------------
    const btnConfirmExit = document.getElementById('btn-confirm-exit');
    if (btnConfirmExit) {
      btnConfirmExit.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('exit-modal')?.classList.remove('active');
        try { window.close(); } catch (e) { }
        this.returnToStartMenu();
      };
    }

    const btnCancelExit = document.getElementById('btn-cancel-exit');
    if (btnCancelExit) {
      btnCancelExit.onclick = () => {
        sfx.init();
        document.getElementById('exit-modal')?.classList.remove('active');
        this.returnToStartMenu();
      };
    }

    const btnFarewellReturn = document.getElementById('btn-farewell-return');
    if (btnFarewellReturn) {
      btnFarewellReturn.onclick = () => {
        document.getElementById('farewell-modal')?.classList.remove('active');
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // IN-GAME PAUSE MENU & HUD MENU BUTTONS
    // -------------------------------------------------------------
    const triggerMenuModal = () => {
      sfx.init();
      if (!this.gameStarted) {
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      } else {
        this.pauseGame();
      }
    };

    const btnHudMenu = document.getElementById('btn-hud-menu-btn');
    if (btnHudMenu) btnHudMenu.onclick = triggerMenuModal;

    const btnHudExit = document.getElementById('btn-hud-exit-btn');
    if (btnHudExit) {
      btnHudExit.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    const btnTopMenu = document.getElementById('btn-top-menu');
    if (btnTopMenu) btnTopMenu.onclick = triggerMenuModal;

    const btnPauseResume = document.getElementById('btn-pause-resume');
    if (btnPauseResume) {
      btnPauseResume.onclick = () => {
        this.resumeGame();
      };
    }

    const btnPauseOptions = document.getElementById('btn-pause-options');
    if (btnPauseOptions) {
      btnPauseOptions.onclick = () => {
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      };
    }

    const handleGameRestart = () => {
      sfx.init();
      sfx.playSwing();
      ['game-over-modal', 'pause-modal'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
      });
      if (this._gameMode === 'campaign') {
        this.startCampaign();
      } else {
        this.startPractice();
      }
    };

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.onclick = handleGameRestart;
    }

    const btnPauseMainMenu = document.getElementById('btn-pause-mainmenu');
    if (btnPauseMainMenu) {
      btnPauseMainMenu.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // GAME OVER MODAL RETURN BUTTON
    // -------------------------------------------------------------
    const btnGameOverMenu = document.getElementById('btn-gameover-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // GLOBAL ESCAPE KEY HANDLER
    // -------------------------------------------------------------
    if (!window._castleKnightEscBound) {
      window._castleKnightEscBound = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (KeybindsManager.activeListeningAction) return;

          const optionsModal = document.getElementById('options-modal');
          const exitModal = document.getElementById('exit-modal');
          const farewellModal = document.getElementById('farewell-modal');
          const pauseModal = document.getElementById('pause-modal');

          if (optionsModal?.classList.contains('active')) {
            optionsModal.classList.remove('active');
            return;
          }
          if (exitModal?.classList.contains('active')) {
            exitModal.classList.remove('active');
            return;
          }
          if (farewellModal?.classList.contains('active')) {
            farewellModal.classList.remove('active');
            window.activeGameScene?.returnToStartMenu();
            return;
          }
          if (pauseModal?.classList.contains('active')) {
            window.activeGameScene?.resumeGame();
            return;
          }

          if (window.activeGameScene && window.activeGameScene.gameStarted && !window.activeGameScene.isDead) {
            window.activeGameScene.pauseGame();
          }
        }
      });
    }

    // Sound button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.onclick = () => {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        music.setEnabled(sfx.enabled);
        const icon = document.getElementById('sound-icon');
        if (icon) icon.textContent = sfx.enabled ? '🔊' : '🔇';
        this.syncOptionsAudioUI();
      };
    }

    // Fullscreen button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.onclick = () => {
        sfx.init();
        this.toggleFullscreen();
      };
    }

    // Character switchers
    const btnSoldier = document.getElementById('btn-hero-soldier');
    const btnWizard = document.getElementById('btn-hero-wizard');
    if (btnSoldier) btnSoldier.onclick = () => this.switchHero('soldier');
    if (btnWizard) btnWizard.onclick = () => this.switchHero('wizard');

    // Ready for combat button ("¡ESTOY LISTO!")
    const btnReadyCombat = document.getElementById('btn-ready-combat');
    if (btnReadyCombat) {
      btnReadyCombat.onclick = (e) => {
        e.stopPropagation();
        this.triggerStartCombat();
      };
    }

    // Restart button
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.onclick = handleGameRestart;
    }

    // Bind Developer Mode Toolbar and Inspector
    this.bindDevModeDOMElements();
  }

  // ===================================================
  // HERO SELECTION MODAL SYSTEM (Soldier & Wizard)
  // ===================================================

  openHeroSelectionModal(mode) {
    this.heroSelectionTargetMode = mode || 'practice';
    const modal = document.getElementById('hero-selection-modal');
    if (!modal) {
      if (mode === 'campaign') this.startCampaign();
      else this.startPractice();
      return;
    }

    const titleEl = document.getElementById('hero-modal-title');
    const subEl = document.getElementById('hero-modal-subtitle');
    if (titleEl) titleEl.textContent = 'SELECCIONA TU HÉROE';
    if (subEl) {
      subEl.textContent = mode === 'campaign'
        ? 'Modo Campaña — Fortaleza de los Caballeros (Lobby de Aldea)'
        : 'Modo Práctica — Campo de Entrenamiento';
    }

    const curHero = this.selectedHero || this.playerHero || 'soldier';
    this.selectHeroInModal(curHero);

    modal.classList.add('active');
  }

  selectHeroInModal(hero) {
    this.selectedHero = hero;
    const cardSoldier = document.getElementById('hero-card-soldier');
    const cardWizard = document.getElementById('hero-card-wizard');
    if (cardSoldier) {
      const isSoldier = hero === 'soldier';
      cardSoldier.classList.toggle('active', isSoldier);
      cardSoldier.setAttribute('aria-pressed', isSoldier ? 'true' : 'false');
    }
    if (cardWizard) {
      const isWizard = hero === 'wizard';
      cardWizard.classList.toggle('active', isWizard);
      cardWizard.setAttribute('aria-pressed', isWizard ? 'true' : 'false');
    }
  }

  confirmHeroSelection() {
    const modal = document.getElementById('hero-selection-modal');
    if (modal) modal.classList.remove('active');

    const hero = this.selectedHero || 'soldier';
    this.playerHero = hero;

    if (this.heroSelectionTargetMode === 'campaign') {
      this.startCampaign();
    } else {
      this.startPractice();
    }
  }

  closeHeroSelectionModal() {
    const modal = document.getElementById('hero-selection-modal');
    if (modal) modal.classList.remove('active');
  }

  setupHeroSelectionModalListeners() {
    const cardSoldier = document.getElementById('hero-card-soldier');
    const cardWizard = document.getElementById('hero-card-wizard');
    const btnConfirm = document.getElementById('btn-hero-confirm');
    const btnCancel = document.getElementById('btn-hero-cancel');

    if (cardSoldier) {
      cardSoldier.onclick = () => {
        sfx.init();
        sfx.playSwing();
        this.selectHeroInModal('soldier');
      };
    }
    if (cardWizard) {
      cardWizard.onclick = () => {
        sfx.init();
        sfx.playMagic();
        this.selectHeroInModal('wizard');
      };
    }
    if (btnConfirm) {
      btnConfirm.onclick = () => {
        sfx.init();
        sfx.playSwing();
        this.confirmHeroSelection();
      };
    }
    if (btnCancel) {
      btnCancel.onclick = () => {
        sfx.init();
        this.closeHeroSelectionModal();
      };
    }
  }

  // ===================================================
  // DEVELOPER MODE ENGINE & MAP EDITOR
  // ===================================================

  /**
   * Helper to snap a coordinate to the active grid
   */
  snapCoord(val, snap) {
    if (!snap || snap <= 0) return Math.round(val);
    return Math.round(val / snap) * snap;
  }

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
  }

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

  /**
   * Open the Map Editor directly from Start Menu
   */
  openMapEditor() {
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
  }

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
  }

  closeAssetPalette() {
    const palette = document.getElementById('editor-asset-palette');
    if (palette) {
      palette.classList.add('hidden');
      palette.classList.remove('open');
    }
    this.clearPaletteSelection();
  }

  toggleAssetPalette() {
    const palette = document.getElementById('editor-asset-palette');
    if (palette) {
      if (palette.classList.contains('hidden')) {
        this.openAssetPalette();
      } else {
        this.closeAssetPalette();
      }
    }
  }

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
  }

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
  }

  clearPaletteSelection() {
    this.selectedPaletteAsset = null;
    document.querySelectorAll('.palette-item').forEach(el => el.classList.remove('active'));
    if (this.devOverlayGfx) this.devOverlayGfx.clear();
  }

  /**
   * Calculate pixel-perfect fitted hitbox for any prop so it never spills over.
   * Hitboxes tightly match the grounded footprint / base of each PNG.
   */
  calculateFitHitbox(prop) {
    return calculateFitHitboxStatic(prop);
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  /**
   * Toggle Grid 32x32 rendering
   */
  toggleDevGrid() {
    this.devShowGrid = !this.devShowGrid;
    const btn = document.getElementById('dev-btn-toggle-grid');
    if (btn) btn.classList.toggle('active', this.devShowGrid);
    this.renderDevGrid();
  }

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
  }

  /**
   * Main per-frame update for Developer Mode visuals
   */
  updateDevMode() {
    if (!this.devModeEnabled) return;
    this.renderDevHitboxes();
    this.renderDevObjectsOverlay();
    this.renderDevSpawns();
    this.renderDevGrid();
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  /**
   * Mouse Wheel zoom in Developer Mode
   */
  handleDevWheel(pointer, deltaY) {
    const curZoom = this.cameras.main.zoom;
    const factor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Phaser.Math.Clamp(curZoom * factor, 0.6, 2.2);
    this.cameras.main.setZoom(newZoom);
  }

  /**
   * Select a hitbox by index and display inspector
   */
  selectHitbox(index) {
    this.selectedHitboxIndex = index;
    this.selectedObjectId = null;
    this.selectedSpawnId = null;
    this.updateDevInspectorDOM();
  }

  /**
   * Select a map object by ID and display inspector
   */
  selectObject(id) {
    this.selectedObjectId = id;
    this.selectedHitboxIndex = -1;
    this.selectedSpawnId = null;
    this.updateDevInspectorDOM();
  }

  /**
   * Select an enemy spawn by ID and display inspector
   */
  selectSpawn(id) {
    this.selectedSpawnId = id;
    this.selectedHitboxIndex = -1;
    this.selectedObjectId = null;
    this.updateDevInspectorDOM();
  }

  /**
   * Clear current selection and hide inspector
   */
  clearDevSelection() {
    this.selectedHitboxIndex = -1;
    this.selectedObjectId = null;
    this.selectedSpawnId = null;
    const inspector = document.getElementById('dev-inspector');
    if (inspector) inspector.classList.add('hidden');
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  updateSpawnCountDOM() {
    const el = document.getElementById('dev-spawn-count');
    if (el) el.textContent = (this.enemySpawns || []).length;
  }

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
  }

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
  }

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
  }

  /**
   * Open the Export/Import modal and generate clean JS/JSON code
   */
  openDevExportModal() {
    const modal = document.getElementById('dev-export-modal');
    const textarea = document.getElementById('dev-export-textarea');
    if (!modal || !textarea) return;

    modal.classList.add('active');
    this.updateExportTextareaContent();
  }

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
// Copia y pega en js/game.js para hacer fijos tus cambios
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
  }

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
  }

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
  }

  /**
   * Show rustic floating toast notification
   */
  showDevToast(message, icon = '💡') {
    const toast = document.getElementById('dev-toast');
    const msgEl = document.getElementById('dev-toast-msg');
    const iconEl = document.getElementById('dev-toast-icon');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;
    toast.classList.remove('hidden');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

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
      document.getElementById('dev-inspector-title').textContent = `🧱 HITBOX #${this.selectedHitboxIndex + 1} [${typeStr}]`;
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
      if (lockIcon) lockIcon.textContent = obs.locked ? '🔒' : '🔓';
      const btnLock = document.getElementById('dev-btn-lock');
      if (btnLock) btnLock.classList.toggle('active', !!obs.locked);

    } else if (this.devModeSub === 'objects' && this.selectedObjectId) {
      const obj = this.mapObjects.find(o => o.id === this.selectedObjectId);
      if (!obj) {
        inspector.classList.add('hidden');
        return;
      }

      inspector.classList.remove('hidden');
      document.getElementById('dev-inspector-title').textContent = `📦 OBJETO: ${obj.name}`;
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
      document.getElementById('dev-inspector-title').textContent = `🚩 SPAWN: ${s.name}`;
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
  }

  updateHitboxCountDOM() {
    const el = document.getElementById('dev-hitbox-count');
    if (el) el.textContent = this.mapObstacles.length;
  }

  updateObjectCountDOM() {
    const el = document.getElementById('dev-object-count');
    if (el) el.textContent = this.mapObjects.length;
  }

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
}

// ==========================================
// 3. INITIALIZE PHASER 3 CONFIG
// ==========================================
const config = {
  type: Phaser.AUTO,
  parent: 'game-canvas-container',
  width: 960,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MainGameScene]
};

// Listen for fullscreen change to refresh scale
document.addEventListener('fullscreenchange', () => {
  if (window.game && window.game.scale) {
    setTimeout(() => {
      window.game.scale.refresh();
    }, 150);
  }
});

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});

// Early button listener for Start Menu so clicks work immediately even during preload
document.addEventListener('DOMContentLoaded', () => {
  if (typeof music !== 'undefined') {
    music.play('intro');
  }

  const btnPlay = document.getElementById('btn-menu-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openHeroSelectionModal) {
        window.activeGameScene.openHeroSelectionModal('practice');
      } else {
        window._pendingHeroMode = 'practice';
      }
    });
  }

  const btnCampaign = document.getElementById('btn-menu-campaign');
  if (btnCampaign) {
    btnCampaign.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openHeroSelectionModal) {
        window.activeGameScene.openHeroSelectionModal('campaign');
      } else {
        window._pendingHeroMode = 'campaign';
      }
    });
  }

  const btnEditor = document.getElementById('btn-menu-editor');
  if (btnEditor) {
    btnEditor.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openMapEditor) {
        window.activeGameScene.openMapEditor();
      } else {
        window._pendingAutoStart = 'editor';
      }
    });
  }

  const btnOptions = document.getElementById('btn-menu-options');
  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.playAlert();
      }
      document.getElementById('options-modal')?.classList.add('active');
      if (typeof KeybindsManager !== 'undefined') KeybindsManager.renderUI();
      if (window.activeGameScene && window.activeGameScene.syncOptionsAudioUI) {
        window.activeGameScene.syncOptionsAudioUI();
      }
    });
  }

  const btnCloseOptions = document.getElementById('btn-close-options');
  if (btnCloseOptions) {
    btnCloseOptions.addEventListener('click', () => {
      document.getElementById('options-modal')?.classList.remove('active');
    });
  }

  const btnOptAudio = document.getElementById('btn-opt-audio');
  if (btnOptAudio) {
    btnOptAudio.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        if (typeof music !== 'undefined') music.setEnabled(sfx.enabled);
        if (sfx.enabled) sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.syncOptionsAudioUI) {
        window.activeGameScene.syncOptionsAudioUI();
      }
    });
  }

  const btnOptFullscreen = document.getElementById('btn-opt-fullscreen');
  if (btnOptFullscreen) {
    btnOptFullscreen.addEventListener('click', () => {
      if (window.activeGameScene && window.activeGameScene.toggleFullscreen) {
        window.activeGameScene.toggleFullscreen();
      }
    });
  }

  const btnExit = document.getElementById('btn-menu-exit');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      document.getElementById('exit-modal')?.classList.add('active');
    });
  }

  const btnCancelExit = document.getElementById('btn-cancel-exit');
  if (btnCancelExit) {
    btnCancelExit.addEventListener('click', () => {
      document.getElementById('exit-modal')?.classList.remove('active');
    });
  }
});
