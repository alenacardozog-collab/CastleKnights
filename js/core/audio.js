/* Sound: procedural SFX + sample player (sfx), music, ambience loops and the volume settings. */

// ==========================================
// 1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bus = null;   // every synthesized sound goes through this gain node
    this.level = 1;    // game volume x characters volume (0..1)
  }

  /** Volume for every character / effect sound (synth + recorded clips). */
  setLevel(level) {
    this.level = Math.max(0, Math.min(1, level));
    if (this.bus && this.ctx) this.bus.gain.setValueAtTime(this.level, this.ctx.currentTime);
    Object.values(this._clips || {}).forEach(a => { a.volume = Math.max(0, Math.min(1, (a._base || 1) * this.level)); });
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && !this.bus) {
      this.bus = this.ctx.createGain();
      this.bus.gain.value = this.level;
      this.bus.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Low-level voice: a buzzy source through two vowel formants (rough human-like tone). */
  _voice(t0, dur, f0, f1, formants, peak, type) {
    const c = this.ctx;
    const osc = c.createOscillator();
    osc.type = type || 'sawtooth';
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.03, dur * 0.3));
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    formants.forEach(([freq, q, g]) => {
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const fg = c.createGain(); fg.gain.value = g;
      osc.connect(bp); bp.connect(fg); fg.connect(out);
    });
    out.connect(this.bus);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  /** Burst of noise through a filter (breath, growl grit, fire). */
  _noise(t0, dur, type, f0, f1, q, peak) {
    const c = this.ctx;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  /**
   * Play a recorded clip (assets/audio/heroes). Returns false when it cannot be played
   * so the caller can fall back to the synthesized version.
   */
  _clip(name, volume, delayMs) {
    try {
      this._clips = this._clips || {};
      let a = this._clips[name];
      if (!a) {
        a = new Audio('assets/audio/heroes/' + name + '.mp3');
        a.preload = 'auto';
        this._clips[name] = a;
      }
      if (a.error) return false;
      const start = () => {
        if (!this.enabled) return;
        a.pause();
        a.currentTime = 0;
        a._base = volume;
        a.volume = Math.max(0, Math.min(1, volume * this.level));
        const p = a.play();
        if (p && p.catch) p.catch(() => { });
      };
      clearTimeout(a._timer);
      if (delayMs) a._timer = setTimeout(start, delayMs); else start();
      return true;
    } catch (e) { return false; }
  }

  /**
   * Foley / combat clips (assets/audio/sfx). Up to 3 overlapping copies per sound.
   * Returns false when the file is missing so callers can fall back to the synth:
   *   sfx.fx('sword_hit', 0.8) || sfx.playHit();
   */
  fx(name, volume, opts) {
    if (!this.enabled) return true;
    try {
      this._clips = this._clips || {};
      this._pools = this._pools || {};
      let pool = this._pools[name];
      if (!pool) {
        pool = this._pools[name] = { items: [], next: 0, last: 0 };
        for (let i = 0; i < 3; i++) {
          const a = new Audio('assets/audio/sfx/' + name + '.mp3');
          a.preload = 'auto';
          pool.items.push(a);
          this._clips['fx:' + name + ':' + i] = a;
        }
      }
      if (pool.items[0].error) return false;
      const now = Date.now();
      if (opts && opts.minGap && now - pool.last < opts.minGap) return true;
      pool.last = now;
      const a = pool.items[pool.next];
      pool.next = (pool.next + 1) % pool.items.length;
      a._base = volume === undefined ? 0.8 : volume;
      a.volume = Math.max(0, Math.min(1, a._base * this.level));
      a.playbackRate = opts && opts.rate ? opts.rate : 1;
      a.currentTime = 0;
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => { });
      return true;
    } catch (e) { return false; }
  }

  /** Stop every playing copy of a clip (used for the charge loop). */
  fxStop(name) {
    const pool = this._pools && this._pools[name];
    if (pool) pool.items.forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) { } });
  }

  /** True when a recorded clip is available (already requested and not broken). */
  fxOk(name) {
    const pool = this._pools && this._pools[name];
    return !!(pool && !pool.items[0].error);
  }

  /** Stop any hero voice clip that is still sounding (used when another hero is picked). */
  stopHeroClips() {
    Object.keys(this._clips || {}).forEach(key => {
      if (key.indexOf('fx:') === 0) return;
      const a = this._clips[key];
      clearTimeout(a._timer); try { a.pause(); } catch (e) { }
    });
  }

  /** Knight chosen: battle grunt (recorded clip, synthesized fallback). */
  playKnightGrunt() {
    if (!this.enabled) return;
    this.stopHeroClips();
    if (this._clip('knight_grunt', 0.9)) return;
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + 0.01;
      this._voice(t, 0.36, 150, 82, [[620, 5, 1.0], [1050, 6, 0.55], [2400, 8, 0.15]], 0.5, 'sawtooth');
      this._voice(t, 0.36, 76, 44, [[300, 3, 0.9]], 0.35, 'square');
      this._noise(t, 0.3, 'bandpass', 900, 350, 1.2, 0.16);
      this._voice(t + 0.05, 0.5, 2600, 2450, [[2600, 30, 1]], 0.05, 'triangle');
    } catch (e) { }
  }

  /** Wizard chosen: smug chuckle, then a flame catching (recorded clips, synthesized fallback). */
  playWizardLaugh() {
    if (!this.enabled) return;
    this.stopHeroClips();
    const laugh = this._clip('wizard_laugh', 0.9);
    const flame = this._clip('wizard_flame', 0.75, 650);
    if (laugh && flame) return;
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + 0.01;
      const notes = [230, 212, 196, 176, 150];
      notes.forEach((f, i) => {
        const t0 = t + i * 0.15;
        this._noise(t0, 0.05, 'highpass', 1800, 1200, 0.7, 0.04);
        this._voice(t0 + 0.02, i === notes.length - 1 ? 0.26 : 0.11, f * 1.06, f * 0.9, [[720, 6, 1.0], [1180, 7, 0.6], [2700, 9, 0.12]], 0.3, 'sawtooth');
      });
      const tf = t + 0.5;
      this._noise(tf, 0.45, 'bandpass', 300, 2600, 0.8, 0.28);
      this._noise(tf + 0.3, 0.9, 'lowpass', 900, 500, 0.5, 0.12);
      for (let i = 0; i < 7; i++) this._noise(tf + 0.35 + Math.random() * 0.7, 0.025, 'highpass', 3000, 2000, 1, 0.1);
    } catch (e) { }
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      noiseGain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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
        gain.connect(this.bus);
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
      gain.connect(this.bus);
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
      gain.connect(this.bus);
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

/**
 * Looping background sound per place (forest, courtyard, hall, fire...). Files live in assets/audio/sfx/<name>.mp3.
 * ambience.set([['amb_forest', 0.5]]) cross-fades to that mix; ambience.set([]) fades everything out.
 */
class Ambience {
  constructor() { this.tracks = {}; this.want = {}; this.master = 1; this._timer = null; }
  set(list) {
    this.want = {};
    (list || []).forEach(([name, vol]) => {
      this.want[name] = vol;
      if (!this.tracks[name]) {
        try {
          const a = new Audio('assets/audio/sfx/' + name + '.mp3');
          a.loop = true; a.preload = 'auto'; a.volume = 0;
          this.tracks[name] = a;
        } catch (e) { }
      }
    });
    this._run();
  }
  refresh(master) { this.master = Math.max(0, Math.min(1, master)); this._run(); }
  _run() { if (!this._timer && Object.keys(this.tracks).length) this._timer = setInterval(() => this._tick(), 60); }
  _tick() {
    let busy = false;
    Object.keys(this.tracks).forEach(name => {
      const a = this.tracks[name];
      const target = Math.max(0, Math.min(1, (this.want[name] || 0) * this.master));
      const d = target - a.volume;
      if (Math.abs(d) > 0.01) { a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(d) * Math.min(Math.abs(d), 0.035))); busy = true; }
      else a.volume = target;
      if (a.volume > 0.001 && a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => { }); }
      if (a.volume <= 0.001 && !a.paused) { try { a.pause(); } catch (e) { } }
    });
    if (!busy) { clearInterval(this._timer); this._timer = null; }
  }
}

const ambience = new Ambience();

// ==========================================
// VOLUME SETTINGS (Options menu sliders, saved in the browser)
// ==========================================
const VolumeSettings = {
  KEY: 'castleknight_volume_v1',
  values: { master: 1, music: 0.4, chars: 1 },
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (raw) ['master', 'music', 'chars'].forEach(k => {
        if (typeof raw[k] === 'number' && isFinite(raw[k])) this.values[k] = Math.max(0, Math.min(1, raw[k]));
      });
    } catch (e) { }
    this.apply();
  },
  set(key, value) {
    if (!(key in this.values)) return;
    this.values[key] = Math.max(0, Math.min(1, value));
    try { localStorage.setItem(this.KEY, JSON.stringify(this.values)); } catch (e) { }
    this.apply();
  },
  apply() {
    const v = this.values;
    music.setVolume(v.master * v.music);
    sfx.setLevel(v.master * v.chars);
    ambience.refresh(v.master);
  },
  /** Connect the three sliders of the Options dialog. */
  bindUI() {
    ['master', 'music', 'chars'].forEach(k => {
      const input = document.getElementById('vol-' + k);
      const label = document.getElementById('vol-' + k + '-val');
      if (!input) return;
      const paint = () => {
        const pct = Math.round(this.values[k] * 100);
        input.value = pct;
        input.style.setProperty('--fill', pct + '%');
        if (label) label.textContent = pct + '%';
      };
      paint();
      input.oninput = () => { this.set(k, Number(input.value) / 100); paint(); };
      // Small audible preview when the handle is released
      input.onchange = () => { if (k !== 'music') { sfx.init(); sfx.playSwing(); } };
    });
  }
};

VolumeSettings.load();
