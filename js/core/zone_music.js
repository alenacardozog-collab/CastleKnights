'use strict';
/* Synthesised background music for the zones that have no recorded track (castle, ruins, boss).
   Each tune is a short score played in a loop with WebAudio: a melody voice, a bass and, for the
   boss, a drum. If a real file exists (assets/Music/<zone>.mp3) the game plays that instead.
   Notes are semitones from A3 (0 = A3, 12 = A4); null = rest. One entry = one step. */
const ZONE_TUNES = {
  // courtly dance in D major: plucked melody over a walking bass
  castle: { bpm: 96, wave: 'triangle', pluck: true, vol: 0.5,
    melody: [5, null, 9, 12, 14, null, 12, 9, 10, null, 14, 17, 14, null, 12, null, 5, null, 9, 12, 14, 17, 14, 12, 10, 9, 7, 9, 5, null, null, null],
    bass:   [-7, null, null, null, -7, null, null, null, -2, null, null, null, -5, null, null, null, -7, null, null, null, -3, null, null, null, -2, null, -5, null, -7, null, null, null] },
  // slow lament in A minor: long cold notes, a lot of air
  ruins: { bpm: 54, wave: 'sine', pluck: false, vol: 0.45, drone: -12,
    melody: [12, null, null, 15, null, 14, null, null, 12, null, 10, null, 7, null, null, null, 8, null, null, 12, null, 10, null, 7, 8, null, 7, null, 3, null, null, null],
    bass:   [0, null, null, null, null, null, null, null, -4, null, null, null, null, null, null, null, -7, null, null, null, null, null, null, null, -5, null, null, null, null, null, null, null] },
  // driving ostinato in D minor with a drum
  boss: { bpm: 152, wave: 'sawtooth', pluck: true, vol: 0.34, drum: true,
    melody: [5, 5, 17, 5, 8, 5, 17, 5, 5, 5, 15, 5, 13, 5, 12, 5, 3, 3, 15, 3, 7, 3, 15, 3, 1, 1, 13, 1, 12, 13, 15, 16],
    bass:   [-19, null, -19, null, -19, null, -19, -19, -19, null, -19, null, -19, null, -19, -19, -21, null, -21, null, -21, null, -21, -21, -23, null, -23, null, -23, null, -20, -20] }
};

class ZoneSynth {
  constructor() { this.ctx = null; this.name = null; this.timer = null; this.gain = null; this.level = 0.4; this.enabled = true; }
  setLevel(v, enabled) {
    this.level = v; this.enabled = enabled;
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(enabled ? v : 0, this.ctx.currentTime, 0.1);
  }
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.gain && this.ctx) { const g = this.gain; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 1200); }
    this.gain = null; this.name = null;
  }
  play(name) {
    const tune = ZONE_TUNES[name];
    if (!tune) { this.stop(); return false; }
    if (this.name === name) return true;
    this.stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { this.ctx = this.ctx || new AC(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { return false; }
    const ctx = this.ctx;
    this.name = name;
    const out = this.gain = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(this.enabled ? this.level : 0, ctx.currentTime, 0.6);
    // a touch of echo so the bare oscillators sit in a room
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.28;
    const fb = ctx.createGain(); fb.gain.value = name === 'ruins' ? 0.45 : 0.22;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = name === 'boss' ? 2600 : 1800;
    out.connect(lp); lp.connect(ctx.destination);
    lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(ctx.destination);
    const freq = n => 220 * Math.pow(2, n / 12);
    const note = (n, t, len, wave, vol, pluck) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave; o.frequency.value = freq(n);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (pluck ? 0.012 : len * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (pluck ? Math.min(len * 1.6, 0.9) : len * 2.4));
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + len * 2.6 + 0.1);
    };
    const drum = (t, hard) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(hard ? 150 : 110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
      g.gain.setValueAtTime(hard ? 0.9 : 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2);
    };
    const step = 60 / tune.bpm / 2;
    let i = 0, next = ctx.currentTime + 0.15;
    if (tune.drone !== undefined) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq(tune.drone); g.gain.value = 0.22;
      o.connect(g); g.connect(out); o.start();
      const myGain = out; const iv = setInterval(() => { if (this.gain !== myGain) { try { o.stop(); } catch (e) { } clearInterval(iv); } }, 500);
    }
    // schedule a little ahead of the clock so the rhythm never depends on timer jitter
    this.timer = setInterval(() => {
      while (next < ctx.currentTime + 0.3) {
        const k = i % tune.melody.length, m = tune.melody[k], b = tune.bass[k];
        if (m !== null) note(m, next, step, tune.wave, tune.vol, tune.pluck);
        if (b !== null) note(b, next, step * 2, 'triangle', tune.vol * 0.9, tune.pluck);
        if (tune.drum && k % 2 === 0) drum(next, k % 8 === 0);
        i++; next += step;
      }
    }, 80);
    return true;
  }
}
const zoneSynth = new ZoneSynth();
