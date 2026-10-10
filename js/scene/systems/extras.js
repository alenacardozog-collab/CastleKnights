'use strict';
/* Campaign extras: shop + inventory + quick bar, journal with map (TAB), parry (C), day / night,
   music per zone and the hero unlocked by finishing chapter 1. (methods of MainGameScene)
   Prices and effects are data: SHOP_ITEMS below. */

const SHOP_ITEMS = [
  { id: 'potion',  name: 'Poción roja',        price: 15,  desc: 'Recupera 1 corazón. Tecla Z.',            stock: true },
  { id: 'elixir',  name: 'Elixir dorado',      price: 40,  desc: 'Recupera toda la vida. Tecla X.',         stock: true },
  { id: 'whet',    name: 'Piedra de afilar',   price: 120, desc: '+1 de daño permanente (máx. 2).',         max: 2, stat: 'atk' },
  { id: 'tonic',   name: 'Tónico de aguante',  price: 80,  desc: '+20 de aguante máximo (máx. 3).',         max: 3, stat: 'sta' },
  { id: 'heart',   name: 'Amuleto de vida',    price: 150, desc: '+1 corazón máximo (máx. 1).',             max: 1, stat: 'hp' }
];

/** The journal's map: boxes in a 0-100 grid, and which zone keys belong to each. */
const WORLD_MAP = [
  { id: 'ruins',    name: 'Aldea en Ruinas', x: 8,  y: 6,  w: 34, h: 22, zones: ['ruins.village'], danger: true },
  { id: 'village',  name: 'Aldea del Roble', x: 30, y: 36, w: 34, h: 22, zones: ['village', 'bar.', 'tienda.', 'granero.', 'casa.'] },
  { id: 'road',     name: 'Camino del castillo', x: 34, y: 66, w: 26, h: 14, zones: ['castle.road'], danger: true },
  { id: 'castle',   name: 'Castillo', x: 64, y: 60, w: 30, h: 30, zones: ['castle.'] }
];
/** Where each step of the story happens (id of WORLD_MAP). */
const QUEST_PLACE = ['castle', 'castle', 'road', 'castle', 'ruins', 'ruins', 'ruins', 'castle', 'village'];

Object.assign(MainGameScene.prototype, {
  // ---------------------------------------------------------------- set-up (called from initStory)
  initExtras() {
    const s = this.story;
    s.inv = s.inv || { potion: 1, elixir: 0 };
    s.up = s.up || { atk: 0, sta: 0, hp: 0 };
    this.maxStamina = 100 + (s.level - 1) * 5 + s.up.sta * 20;
    this.stamina = this.maxStamina;
    this.dayClock = this.dayClock || 0;
    this.parryUntil = 0; this.parryReadyAt = 0;
    this._wasNight = this.isNight();          // no "Amanece" banner over the arrival title
    this.firedTriggers = {};
    this.ensureExtrasUI();
    this.updateQuickBar();
    if (!this._extrasKeys) {
      this._extrasKeys = true;
      const K = Phaser.Input.Keyboard.KeyCodes, kb = this.input.keyboard;
      kb.addKey(K.Z).on('down', () => this.useItem('potion'));
      kb.addKey(K.X).on('down', () => this.useItem('elixir'));
      kb.addKey(K.C).on('down', () => this.performParry());
      kb.addKey(K.TAB).on('down', () => this.toggleJournal());
    }
  },
  endExtras() {
    ['ck-quick', 'ck-shop', 'ck-journal'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('on'); });
    if (this.nightShade) this.nightShade.setVisible(false);
    zoneSynth.stop(); this._zoneMusic = null;
    this.maxStamina = 100;
    this._overlay = null;
  },
  ensureExtrasUI() {
    const host = document.getElementById('game-wrapper') || document.body;
    const mk = (id, html) => { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; el.innerHTML = html; host.appendChild(el); } return el; };
    mk('ck-quick', '');
    const shop = mk('ck-shop', '<div class="ck-win"><h3>Tienda de la aldea</h3><div class="ck-shop-purse"></div><div class="ck-shop-list"></div><button class="ck-close">Cerrar (T / Esc)</button></div>');
    const jr = mk('ck-journal', '<div class="ck-win ck-win-wide"><h3>Diario</h3><div class="ck-jr-cols"><div class="ck-jr-map"></div><div class="ck-jr-side"></div></div><button class="ck-close">Cerrar (Tab / Esc)</button></div>');
    if (!shop._b) { shop._b = true; shop.querySelector('.ck-close').onclick = () => this.closeOverlay(); }
    if (!jr._b) { jr._b = true; jr.querySelector('.ck-close').onclick = () => this.closeOverlay(); }
    if (!this._extrasEsc) {
      this._extrasEsc = true;
      window.addEventListener('keydown', e => { if (e.key === 'Escape' && this._overlay) { e.stopImmediatePropagation(); this.closeOverlay(); } }, true);
    }
    document.getElementById('ck-quick').classList.add('on');
  },

  // ---------------------------------------------------------------- overlays pause the world
  openOverlay(id) {
    if (this._overlay || this.isDead || this.dialogOpen || this.studioOn || this._gameMode !== 'campaign' || this.isGamePaused) return false;
    this._overlay = id;
    this.isGamePaused = true;
    this.physics.world.pause();
    this.player.setVelocity(0, 0);
    document.getElementById(id).classList.add('on');
    return true;
  },
  closeOverlay() {
    if (!this._overlay) return;
    document.getElementById(this._overlay).classList.remove('on');
    this._overlay = null;
    this.isGamePaused = false;
    this.physics.world.resume();
    this.updateQuickBar();
  },

  // ---------------------------------------------------------------- shop and items
  openShop() {
    if (!this.openOverlay('ck-shop')) return;
    this.renderShop();
  },
  renderShop() {
    const s = this.story, el = document.getElementById('ck-shop');
    el.querySelector('.ck-shop-purse').innerHTML = `<img src="assets/UI/pix/coin.png" class="px-ico" alt=""> ${s.coins} monedas`;
    el.querySelector('.ck-shop-list').innerHTML = SHOP_ITEMS.map(it => {
      const have = it.stock ? s.inv[it.id] : s.up[it.stat];
      const full = it.max !== undefined && have >= it.max;
      return `<div class="ck-item${full ? ' full' : ''}"><div><b>${it.name}</b><span>${it.desc}</span></div><em>${it.stock ? 'Tenés ' + have : have + '/' + it.max}</em>` +
        `<button data-id="${it.id}" ${full || s.coins < it.price ? 'disabled' : ''}>${full ? 'Completo' : it.price + ' ◉'}</button></div>`;
    }).join('');
    el.querySelectorAll('button[data-id]').forEach(b => { b.onclick = () => this.buyItem(b.dataset.id); });
  },
  buyItem(id) {
    const s = this.story, it = SHOP_ITEMS.find(v => v.id === id);
    if (!it || s.coins < it.price) return;
    if (it.stock) s.inv[id]++;
    else {
      if (s.up[it.stat] >= it.max) return;
      s.up[it.stat]++;
      if (it.stat === 'sta') this.maxStamina += 20;
      if (it.stat === 'hp') { s.maxHealth = Math.min(8, s.maxHealth + 1); this.maxHealth = s.maxHealth; this.health = this.maxHealth; }
    }
    s.coins -= it.price;
    sfx.fx('quest_done', 0.5, { rate: 1.5 });
    this.renderShop(); this.updateObjective(); this.updateHUD(); this.saveStory();
  },
  useItem(id) {
    const s = this.story;
    if (this._gameMode !== 'campaign' || !s || this.isDead || this.isGamePaused || this.dialogOpen || this.studioOn) return;
    if (!s.inv[id]) { this.createFloatingText(this.player.x, this.player.y - 40, 'No te quedan', 0xcbd5e1); return; }
    if (this.health >= this.maxHealth) { this.createFloatingText(this.player.x, this.player.y - 40, 'Vida completa', 0xcbd5e1); return; }
    s.inv[id]--;
    this.health = id === 'elixir' ? this.maxHealth : Math.min(this.maxHealth, this.health + 1);
    sfx.playHeartPickup();
    this.createFloatingText(this.player.x, this.player.y - 40, id === 'elixir' ? '¡VIDA COMPLETA!' : '+1 VIDA', 0x22c55e);
    this.updateHUD(); this.updateQuickBar(); this.saveStory();
  },
  updateQuickBar() {
    const el = document.getElementById('ck-quick'), s = this.story;
    if (!el || !s) return;
    const ready = this.time.now >= (this.parryReadyAt || 0);
    el.innerHTML = `<div class="ck-slot" title="Poción roja"><i style="background:#dc2626"></i><b>Z</b><span>${s.inv.potion}</span></div>` +
      `<div class="ck-slot" title="Elixir dorado"><i style="background:#eab308"></i><b>X</b><span>${s.inv.elixir}</span></div>` +
      `<div class="ck-slot${ready ? '' : ' wait'}" title="Parada: bloquea el golpe que llega justo después"><i class="shield"></i><b>C</b><span>⛨</span></div>`;
  },

  // ---------------------------------------------------------------- parry
  /** C: for a third of a second every blow is turned aside and the attacker staggers. */
  performParry() {
    if (this._gameMode !== 'campaign' || this.isDead || this.isGamePaused || this.dialogOpen || this.studioOn || this.isAttacking || this.isDashing) return;
    const now = this.time.now;
    if (now < this.parryReadyAt) return;
    if (this.stamina < 15) { this.showLowStaminaWarning('Parada'); return; }
    this.stamina -= 15; this.updateStaminaBar();
    this.parryUntil = now + 340; this.parryReadyAt = now + 900;
    const p = this.player;
    const ring = this.add.ellipse(p.x, p.y + 4, 30, 36).setStrokeStyle(2, 0xbfdbfe, 1).setDepth(p.depth + 2);
    this.tweens.add({ targets: ring, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: 340, onComplete: () => ring.destroy() });
    sfx.fx('sword_swing2', 0.4, { rate: 1.6 });
    this.updateQuickBar();
    this.time.delayedCall(910, () => this.updateQuickBar());
  },
  /** Called first thing in damagePlayer: true when the blow was parried. */
  tryParry() {
    if (this.time.now > (this.parryUntil || 0)) return false;
    this.parryUntil = 0;
    const p = this.player;
    this.createFloatingText(p.x, p.y - 44, '¡PARADA!', 0xbfdbfe);
    sfx.fx('sword_hit', 0.9, { rate: 1.5 });
    this.cameras.main.shake(100, 0.006);
    this.stamina = Math.min(this.maxStamina, this.stamina + 25); this.updateStaminaBar();
    let best = null, bd = 90;
    this.enemies.getChildren().forEach(e => { if (!e.active || e.isDead) return; const d = Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; best = e; } });
    if (best) { best.attackCooldown = this.time.now + 1600; this.damageEnemy(best, 1, p.x, p.y); }
    this.isInvulnerable = true;
    this.time.delayedCall(350, () => { this.isInvulnerable = false; });
    return true;
  },

  // ---------------------------------------------------------------- journal
  toggleJournal() {
    if (this._overlay === 'ck-journal') { this.closeOverlay(); return; }
    if (!this.story || !this.openOverlay('ck-journal')) return;
    const s = this.story, zone = this.currentZoneKey();
    const here = WORLD_MAP.find(m => m.zones.some(z => zone === z || (z.endsWith('.') && zone.startsWith(z)) )) || WORLD_MAP[1];
    // "castle.road" belongs to the road box, not to the castle one
    const hereId = zone === 'castle.road' ? 'road' : here.id;
    const goal = QUEST_PLACE[Math.min(s.step, QUEST_PLACE.length - 1)];
    const el = document.getElementById('ck-journal');
    el.querySelector('.ck-jr-map').innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M25 28 L42 36 M47 58 L47 66 M60 73 L64 74" stroke="#8a6a30" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/></svg>' +
      WORLD_MAP.map(m => `<div class="ck-place${m.id === hereId ? ' here' : ''}${m.danger ? ' danger' : ''}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%">` +
        `<b>${m.name}</b>${m.id === hereId ? '<span>◉ Estás acá</span>' : ''}${m.id === goal && s.step < 8 ? '<em>! Objetivo</em>' : ''}</div>`).join('');
    const up = s.up;
    el.querySelector('.ck-jr-side').innerHTML =
      '<h4>Misiones · Capítulo 1</h4>' + QUESTS.slice(0, 8).map((q, i) => `<p class="${i < s.step ? 'done' : i === s.step ? 'now' : 'todo'}">${i < s.step ? '✔' : i === s.step ? '▸' : '·'} ${i <= s.step ? q.goal : '???'}</p>`).join('') +
      `<h4>${HEROES[this.playerHero].name} · Nivel ${s.level}</h4><p>Vida ${this.health}/${this.maxHealth} · Daño +${up.atk} · Aguante ${Math.round(this.maxStamina)}</p>` +
      `<p>Monedas ${s.coins} · Pociones ${s.inv.potion} · Elixires ${s.inv.elixir}${s.flags.key && s.step < 7 ? ' · Llave de la capilla' : ''}</p>` +
      `<p>${this.isNight() ? '☾ Es de noche: salen más bestias' : '☀ Es de día'}</p>` +
      '<h4>Controles</h4><p>J atacar · K especial · E habilidad · Espacio dash · C parada · Z / X pociones · T hablar · Tab diario</p>';
  },

  // ---------------------------------------------------------------- day and night
  /** 0..1 through the day; night is the stretch 0.62 - 0.92 (a full day lasts 5 minutes). */
  dayPhase() { return ((this.dayClock || 0) % 300000) / 300000; },
  isNight() { const p = this.dayPhase(); return p > 0.62 && p < 0.92; },
  updateDayNight(dt) {
    this.dayClock = (this.dayClock || 0) + dt;
    if (!this.nightShade) this.nightShade = this.add.rectangle(480, 300, 4000, 4000, 0x0a1238, 1).setScrollFactor(0).setDepth(27500).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const p = this.dayPhase(), c = this.currentInterior;
    const outdoors = !c || c.area.outdoor;
    // 0 by day, ramps up at dusk, full at night, ramps down at dawn
    let k = p < 0.52 ? 0 : p < 0.62 ? (p - 0.52) / 0.10 : p < 0.92 ? 1 : (1 - p) / 0.08;
    k = Phaser.Math.Clamp(k, 0, 1);
    this.nightShade.setVisible(outdoors && k > 0.01 && !this.studioOn);
    // multiply with a colour between white (no change) and deep blue
    const col = Phaser.Display.Color.Interpolate.RGBWithRGB(255, 255, 255, 120, 136, 205, 100, Math.round(k * 100));
    this.nightShade.setFillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    const night = this.isNight();
    if (night !== this._wasNight) {
      this._wasNight = night;
      if (this.story) this.showZoneTitle(night ? 'Cae la noche' : 'Amanece', night ? 'Las bestias salen de sus guaridas' : '');
      this.updateObjective();
    }
  },

  // ---------------------------------------------------------------- music per zone
  /**
   * Music of a zone. A recorded file wins (assets/Music/castle.mp3, ruins.mp3, boss.mp3); when there
   * is none, the tune is synthesised (js/core/zone_music.js). The village keeps its own song.
   */
  playZoneMusic(name) {
    if (!music.audioElements) return;
    zoneSynth.setLevel(music.volume * 0.5, music.enabled);
    if (name === 'village' || name === 'intro') { zoneSynth.stop(); music.play(name); return; }
    if (music.audioElements[name] === undefined) {
      const a = new Audio('assets/Music/' + name + '.mp3');
      a.loop = true; a.preload = 'auto'; a.volume = music.enabled ? music.volume : 0;
      a.addEventListener('error', () => { music.audioElements[name] = null; if (this._zoneMusic === name) this.playZoneMusic(name); });
      a.addEventListener('canplaythrough', () => { if (this._zoneMusic === name && zoneSynth.name === name) { zoneSynth.stop(); music.play(name); } }, { once: true });
      music.audioElements[name] = a;
    }
    const el = music.audioElements[name];
    if (el && el.readyState >= 3) { zoneSynth.stop(); music.play(name); return; }
    // no file (or not loaded yet): silence the recorded tracks and play the synthesised tune
    music.stopAll();
    zoneSynth.play(name);
  },
  musicForZone(key) {
    if (this.enemies && this.enemies.getChildren().some(e => e.active && !e.isDead && e.def && e.def.boss)) return 'boss';
    if (key.indexOf('ruins.') === 0) return 'ruins';
    if (key.indexOf('castle.') === 0 && key !== 'castle.road') return 'castle';
    return 'village';
  },

  // ---------------------------------------------------------------- unlocked hero
  heroUnlocked() { return !!this.loadSave()._unlocked; },
  unlockHero() {
    try { const all = this.loadSave(); all._unlocked = true; localStorage.setItem(SAVE_KEY, JSON.stringify(all)); } catch (e) { }
    this.showZoneTitle('¡Héroe desbloqueado!', 'Gork, el orco renegado, te espera en el Libro de Héroes');
  },

  // ---------------------------------------------------------------- triggers drawn in the Studio
  updateTriggers() {
    const c = this.currentInterior, zone = this.currentZoneKey();
    const z = this._studio && this._studio.zones[zone];
    if (!z || !z.triggers || !z.triggers.length || this.studioOn || this.dialogOpen) return;
    const ox = c ? c.area.x : 0, oy = c ? c.area.y : 0, b = this.player.body;
    const fx = b.center.x - ox, fy = b.bottom - oy;
    z.triggers.forEach((t, i) => {
      const inside = fx >= t.x && fx <= t.x + t.w && fy >= t.y && fy <= t.y + t.h;
      const id = zone + '#' + i;
      if (!inside) { if (!t.once) this.firedTriggers[id] = false; return; }
      if (this.firedTriggers[id]) return;
      this.firedTriggers[id] = true;
      if (t.kind === 'dialog') this.openDialog(t.name || '· · ·', (t.text || '…').split('\n').filter(Boolean));
      else if (t.kind === 'title') this.showZoneTitle(t.name || 'Lugar', t.text || '');
      else if (t.kind === 'enemies' && c) {
        for (let n = 0; n < (t.count || 2); n++) {
          const e = this.spawnEnemy(ox + t.x + Math.random() * t.w, oy + t.y + Math.random() * t.h - 26, t.enemy || 'skeleton');
          if (e) { e.zone = c.area.key; this.alertEnemy(e); }
        }
        this.cameras.main.shake(200, 0.005);
      } else if (t.kind === 'heal') { this.health = this.maxHealth; this.updateHUD(); this.createFloatingText(this.player.x, this.player.y - 40, 'Te sentís renovado', 0x22c55e); }
    });
  },

  /** Per-frame work of everything in this file (called from updateStory). */
  updateExtras(dt) {
    this.updateDayNight(dt);
    this.updateTriggers();
    const want = this.musicForZone(this.currentZoneKey());
    if (want !== this._zoneMusic) { this._zoneMusic = want; this.playZoneMusic(want); }
    if (zoneSynth.name) zoneSynth.setLevel(music.volume * 0.5, music.enabled && !this.isGamePaused);
  }
});
