'use strict';
/* Campaign systems: the quest chain of chapter 1, dialogue box, interaction key, experience / levels /
   coins, zone titles, defeat and the save file. (methods of MainGameScene)
   The whole story is data: edit QUESTS and STORY_NPCS below to change texts or add steps. */

const SAVE_KEY = 'castleknight_save_v1';

/** Chapter 1, in order. `goal` is what the tracker shows; each step ends through advanceQuest(id). */
const QUESTS = [
  { id: 'meet_king',    goal: 'Presentate ante el Rey en el Gran Salón del castillo (camino del sur)' },
  { id: 'meet_captain', goal: 'Buscá al Capitán Bruno en el Patio de Armas (puerta oeste del patio)' },
  { id: 'clear_road',   goal: 'Limpiá de bestias el camino del castillo', count: 3 },
  { id: 'report',       goal: 'Volvé con el Capitán Bruno' },
  { id: 'find_hermit',  goal: 'Encontrá al último aldeano en la Aldea en Ruinas (sendero noroeste de la aldea)' },
  { id: 'get_key',      goal: 'Vencé al Gran Esqueleto del cementerio y quitale la llave' },
  { id: 'boss',         goal: 'Abrí la capilla de las ruinas y derrotá al Nigromante' },
  { id: 'return_king',  goal: 'Llevale la noticia al Rey' },
  { id: 'done',         goal: 'Capítulo 1 completo. La niebla retrocede… por ahora.' }
];

/** People with something to say. zone = "<map>.<area>" ("village" for the village); x / y in area pixels. */
const STORY_NPCS = [
  { id: 'king', zone: 'castle.throne', x: 240, y: 142, r: 74, name: 'Rey Aldric', face: 'king_idle',
    lines: (s, hero) => s.step === 0 ? [
      `Así que vos sos ${hero}. Llegás en buena hora.`,
      'Una niebla baja del norte. Donde toca, las tumbas se abren y las bestias pierden el miedo.',
      'Brumavieja, la aldea vecina, cayó en una sola noche.',
      'Hablá con el Capitán Bruno en el Patio de Armas. Él te dirá por dónde empezar.'
    ] : s.step === 7 ? [
      '¿El Nigromante… vencido? Entonces la niebla tenía dueño.',
      'El reino te debe más de lo que puede pagar. Tomá esto, y descansá.',
      'Pero no guardes la espada: lo que lo despertó sigue más al norte.'
    ] : s.step >= 8 ? ['El reino recuerda tu nombre. Descansá, que pronto habrá más trabajo.'] :
      ['El Capitán Bruno te espera. Que la corona te proteja.'] },
  { id: 'captain', zone: 'castle.training', x: 452, y: 168, r: 54, name: 'Capitán Bruno', face: 'g_knight_idle',
    lines: (s) => s.step === 1 ? [
      'El Rey me avisó que vendrías. Antes de mandarte al norte quiero verte pelear.',
      'Las bestias del bosque se animaron a salir al camino del castillo.',
      'Limpiá el camino: tres de ellas alcanzan para que los mercaderes vuelvan a pasar.'
    ] : s.step === 2 ? ['Todavía se oyen aullidos en el camino. Terminá el trabajo.'] : s.step === 3 ? [
      'Bien hecho. Peleás mejor que la mitad de mis reclutas.',
      'Tomá: una ración de la guardia. Te va a mantener en pie un golpe más.',
      'Ahora sí: andá a Brumavieja, las ruinas del norte. Dicen que un aldeano no quiso irse. Encontralo.'
    ] : s.step < 1 ? ['Primero presentate ante el Rey, forastero.'] :
      ['Postura firme y ojos abiertos. La niebla no perdona.'] },
  { id: 'hermit', zone: 'ruins.village', x: 440, y: 388, r: 50, name: 'Tobías, el último aldeano', face: 'npc2_villager',
    lines: (s) => s.step === 4 ? [
      '¿Una persona viva? Creí que ya no quedaba nadie…',
      'Un encapuchado se encerró en la capilla la noche de la niebla. Desde entonces los muertos caminan.',
      'La llave de la capilla la tenía el sepulturero. Ahora la lleva lo que quedó de él: un esqueleto enorme, en el cementerio del noreste.',
      'Quitásela, abrí la capilla y terminá con esto.'
    ] : s.step === 5 ? ['El cementerio está arriba, al noreste de la plaza. Cuidado con su espada.'] :
      s.step === 6 ? ['¡Tenés la llave! La capilla está en lo alto de la escalinata. Que tengas suerte.'] :
      s.step >= 7 ? ['La niebla afloja… Gracias. Tal vez algún día Brumavieja vuelva a tener gente.'] :
      ['No queda nadie más… Si te manda el Rey, volvé cuando sepas a qué venís.'] }
];

Object.assign(MainGameScene.prototype, {
  // ---------------------------------------------------------------- save file
  loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (e) { return {}; }
  },
  saveStory() {
    if (this._gameMode !== 'campaign' || !this.story) return;
    try {
      const all = this.loadSave();
      all[this.playerHero] = Object.assign({}, this.story, { savedAt: Date.now() });
      localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    } catch (e) { /* private window or storage blocked: the game simply does not remember */ }
  },
  deleteSave(hero) {
    try {
      const all = this.loadSave();
      delete all[hero];
      localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    } catch (e) { }
  },

  /** Called when a campaign starts: restores this hero's progress or begins chapter 1. */
  initStory() {
    const saved = this.loadSave()[this.playerHero];
    this.story = Object.assign({ step: 0, count: 0, xp: 0, level: 1, coins: 0, maxHealth: 3, flags: {} }, saved || {});
    this.story.flags = this.story.flags || {};
    this.maxHealth = this.story.maxHealth;
    this.health = this.maxHealth;
    this.dialogOpen = false;
    this.ensureStoryUI();
    this.initExtras();
    this.updateObjective();
    this.updateHUD();
    this.showZoneTitle('Aldea del Roble', saved ? 'Partida recuperada' : 'Capítulo 1 · La niebla del norte');
    this.studioOn = false;
    this.time.delayedCall(50, () => this.studioOnZoneShown());
  },

  endStory() {
    if (this.studioOn) this.toggleStudio();
    (this.devNpcs || []).forEach(n => { n.sprite.destroy(); if (n.tag) n.tag.destroy(); });
    this.devNpcs = [];
    if (this._overlay) this.closeOverlay();
    this.endExtras();
    this.story = null;
    this.dialogOpen = false;
    this.maxHealth = 3;
    ['ck-objective', 'ck-dialog', 'ck-zone', 'ck-prompt'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('on'); });
    if (this._questMark) this._questMark.setVisible(false);
  },

  // ---------------------------------------------------------------- DOM pieces
  ensureStoryUI() {
    const host = document.getElementById('game-wrapper') || document.body;
    const mk = (id, html) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement('div'); el.id = id; el.innerHTML = html; host.appendChild(el); }
      return el;
    };
    mk('ck-objective', '<div class="ck-obj-head"><img src="assets/UI/pix/flag.png" class="px-ico" alt=""> OBJETIVO</div><div class="ck-obj-text"></div><div class="ck-obj-purse"></div>');
    mk('ck-zone', '<div class="ck-zone-name"></div><div class="ck-zone-sub"></div>');
    mk('ck-prompt', '');
    const dlg = mk('ck-dialog', '<div class="ck-dlg-face"><img class="ck-dlg-portrait" alt=""></div><div class="ck-dlg-body"><div class="ck-dlg-name"></div><div class="ck-dlg-text"></div></div><div class="ck-dlg-next">T / ENTER / clic ▸</div>');
    if (!dlg._bound) { dlg._bound = true; dlg.addEventListener('click', () => this.advanceDialog()); }
  },

  updateObjective() {
    const box = document.getElementById('ck-objective');
    if (!box || !this.story) return;
    const q = QUESTS[Math.min(this.story.step, QUESTS.length - 1)];
    box.classList.add('on');
    box.querySelector('.ck-obj-text').textContent = q.goal + (q.count ? ` (${Math.min(this.story.count, q.count)}/${q.count})` : '');
    const need = this.xpForLevel(this.story.level);
    box.querySelector('.ck-obj-purse').innerHTML =
      `<span><img src="assets/UI/pix/coin.png" class="px-ico" alt=""> ${this.story.coins}</span>` +
      `<span>EXP ${this.story.xp}/${need}</span>` +
      `<span>${this.isNight() ? '☾ Noche' : '☀ Día'}</span>` +
      (this.story.flags.key && this.story.step < 7 ? '<span><img src="assets/UI/pix/unlock.png" class="px-ico" alt=""> Llave</span>' : '');
    const lvl = document.querySelector('.hud-hero-level');
    if (lvl) lvl.textContent = 'NIV. ' + this.story.level;
  },

  /** Big title that fades in and out when the hero arrives somewhere. */
  showZoneTitle(name, sub) {
    this.ensureStoryUI();
    const el = document.getElementById('ck-zone');
    if (!el || !name) return;
    el.querySelector('.ck-zone-name').textContent = name;
    el.querySelector('.ck-zone-sub').textContent = sub || '';
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(this._zoneTimer);
    this._zoneTimer = setTimeout(() => el.classList.remove('on'), 3400);
  },

  // ---------------------------------------------------------------- dialogue
  /**
   * Face of a character for the dialogue box. Heroes use their painted portrait; everybody else gets
   * a close-up cut from their own sprite (so any new NPC has a portrait without drawing one).
   */
  portraitFor(texKey) {
    this._faces = this._faces || {};
    if (this._faces[texKey] !== undefined) return this._faces[texKey];
    let url = null;
    try {
      const tex = this.textures.get(texKey), fr = tex.get(0), src = tex.getSourceImage();
      const w = fr.cutWidth, h = fr.cutHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const px = x.getImageData(0, 0, w, h).data;
      let top = h, bot = 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (px[(j * w + i) * 4 + 3] > 200) { if (j < top) top = j; if (j > bot) bot = j; }
      const size = Math.max(10, Math.round((bot - top + 1) * 0.66));
      let sum = 0, n = 0;                                   // centre on the head, not on the weapon
      for (let j = top; j < top + size * 0.6; j++) for (let i = 0; i < w; i++) if (px[(j * w + i) * 4 + 3] > 200) { sum += i; n++; }
      const cx = n ? sum / n : w / 2;
      const out = document.createElement('canvas'); out.width = out.height = 96;
      const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
      o.drawImage(c, Math.round(cx - size / 2), top - 1, size, size, 0, 0, 96, 96);
      url = out.toDataURL();
    } catch (e) { url = null; }
    this._faces[texKey] = url;
    return url;
  },

  openDialog(name, lines, onEnd, face) {
    this.ensureStoryUI();
    this.dialogOpen = true;
    const faceBox = document.querySelector('#ck-dialog .ck-dlg-face');
    if (faceBox) {
      const url = face ? (/\.png$|^data:/.test(face) ? face : this.portraitFor(face)) : null;
      faceBox.style.display = url ? '' : 'none';
      faceBox.classList.toggle('painted', !!face && /\.png$/.test(face));
      if (url) faceBox.querySelector('img').src = url;
    }
    this._dlg = { name, lines: lines.slice(), i: 0, onEnd, shown: 0, at: performance.now() };
    if (this.player && this.player.body) this.player.setVelocity(0, 0);
    document.getElementById('ck-dialog').classList.add('on');
    document.getElementById('ck-prompt').classList.remove('on');
    this.renderDialog();
    sfx.fx('page_flip', 0.5, { rate: 1.3 });
  },
  renderDialog() {
    const d = this._dlg, box = document.getElementById('ck-dialog');
    if (!d || !box) return;
    box.querySelector('.ck-dlg-name').textContent = d.name;
    box.querySelector('.ck-dlg-text').textContent = d.lines[d.i].slice(0, d.shown);
  },
  /** Next line (or finish the current one if it is still being typed). */
  advanceDialog() {
    const d = this._dlg;
    if (!d || performance.now() - d.at < 180) return;
    d.at = performance.now();
    if (d.shown < d.lines[d.i].length) { d.shown = d.lines[d.i].length; this.renderDialog(); return; }
    d.i++; d.shown = 0;
    if (d.i >= d.lines.length) {
      document.getElementById('ck-dialog').classList.remove('on');
      this._dlg = null;
      // keep the hero frozen for a blink so the closing key press does not swing the sword
      setTimeout(() => { this.dialogOpen = false; }, 120);
      if (d.onEnd) d.onEnd();
      return;
    }
    sfx.fx('ui_click', 0.4);
    this.renderDialog();
  },

  // ---------------------------------------------------------------- interaction
  currentZoneKey() {
    const c = this.currentInterior;
    return c ? c.building.kind + '.' + c.areaName : 'village';
  },
  /** Story character within reach of the hero, with its world position. */
  nearbyStoryNPC() {
    if (!this.story || !this.player || !this.player.body) return null;
    const zone = this.currentZoneKey(), c = this.currentInterior;
    const ox = c ? c.area.x : 0, oy = c ? c.area.y : 0;
    const fx = this.player.body.center.x, fy = this.player.body.center.y;
    for (let i = 0; i < STORY_NPCS.length; i++) {
      const n = STORY_NPCS[i];
      if (n.zone !== zone) continue;
      if (Phaser.Math.Distance.Between(fx, fy, ox + n.x, oy + n.y) <= n.r) return { npc: n, x: ox + n.x, y: oy + n.y };
    }
    return null;
  },
  /** The T / ENTER key: talk to whoever is in front of the hero. */
  interact() {
    if (this._overlay) { this.closeOverlay(); return; }
    if (this._gameMode !== 'campaign' || this.isDead || this._doorTransition) return;
    if (this.dialogOpen) { this.advanceDialog(); return; }
    const hit = this.nearbyStoryNPC();
    // somebody with a name standing closer than the story character speaks first (the queen next to the king)
    let closer = false;
    if (hit && this.currentInterior) {
      const b = this.player.body, dh = Phaser.Math.Distance.Between(b.center.x, b.center.y, hit.x, hit.y);
      closer = (this.currentInterior.area.talkers || []).some(t => /^[^:]{2,24}: /.test(t.lines[0]) && Phaser.Math.Distance.Between(b.center.x, b.center.y, t.x, t.y) < Math.min(t.r, dh));
    }
    if (hit && !closer) {
      const n = hit.npc, hero = (HEROES[this.playerHero] || HEROES.soldier).name.charAt(0) + (HEROES[this.playerHero] || HEROES.soldier).name.slice(1).toLowerCase();
      this.openDialog(n.name, n.lines(this.story, hero), () => this.onTalked(n.id), n.face);
      return;
    }
    // NPCs placed in the dev Studio
    const dn = this.nearbyStudioNPC && this.nearbyStudioNPC();
    if (dn) {
      const ls = dn.data.lines && dn.data.lines.length ? dn.data.lines : ['…'];
      this.openDialog(dn.data.name || dn.look.label, ls, null, dn.look.tex);
      return;
    }
    // people of the castle and the other maps (walkers, the smith, standing characters with something to say)
    if (this.currentInterior) {
      const a = this.currentInterior.area, b = this.player.body, fx = b.center.x, fy = b.center.y;
      const clean = t => t.replace(/[^\wáéíóúñüÁÉÍÓÚÑ¡!¿?,.:;…«»'\- ]/g, '').trim();
      const act = (a.actors || []).find(v => v.lines && v.sprite && v.sprite.active && Phaser.Math.Distance.Between(fx, fy, v.sprite.x, v.sprite.y) < 48);
      if (act) { this.openDialog(this.nameForTexture(act.sprite.texture.key), act.lines.map(clean), null, act.sprite.texture.key); return; }
      const tk = (a.talkers || []).find(t => Phaser.Math.Distance.Between(fx, fy, t.x, t.y) < t.r);
      if (tk) {
        // whoever is drawn at that spot lends the face; "Name: text" lines carry the name
        const who = (a.objs || []).find(o => o && o.active && o.texture && /^(npc\d+_villager|g_\w+_idle|king_idle)$/.test(o.texture.key) && Phaser.Math.Distance.Between(o.x, o.y, tk.x, tk.y) < 26);
        const m = /^([^:]{2,24}): /.exec(tk.lines[0]);
        const name = m ? m[1] : who ? this.nameForTexture(who.texture.key) : '';
        this.openDialog(name || '· · ·', tk.lines.map(l => clean(l.replace(/^[^:]{2,24}: /, ''))), null, who ? who.texture.key : null);
        return;
      }
    }
    if (this.currentZoneKey().indexOf('tienda.') === 0) { this.openShop(); return; }
    // villagers of the village: a proper line in the dialogue box instead of the floating greeting
    if (!this.currentInterior && this.campaignNPCs) {
      const p = this.player;
      const dOf = n => Phaser.Math.Distance.Between(n.sprite.x, n.sprite.y, p.x, p.y + 20);
      const v = this.campaignNPCs.filter(n => n.sprite && n.sprite.active && dOf(n) < 48).sort((a, b) => dOf(a) - dOf(b))[0];
      if (v && v.id === 'npc2') { this.openShop(); return; }
      if (v) {
        const hint = this.story.step === 0 ? 'Dicen que el Rey busca gente de armas. El castillo queda por el camino del sur.' :
          this.story.step < 4 ? 'De noche se ve una luz fría hacia el norte. Nadie quiere ir a mirar.' :
          this.story.step < 7 ? 'Brumavieja era una aldea como esta… Tené cuidado allá arriba.' : '¡La niebla se fue del camino! Gracias a vos dormimos tranquilos.';
        this.openDialog(v.name, [Phaser.Utils.Array.GetRandom(v.greetings).replace(/[^\wáéíóúñÁÉÍÓÚÑ¡!¿?,.… ]/g, '').trim(), hint], null, v.textureKey);
      }
    }
  },

  /** Generic name for a character known only by its sheet. */
  nameForTexture(key) {
    const m = /^g_(\w+)_idle$/.exec(key);
    if (m) return { knight: 'Caballero de la guardia', templar: 'Templario', lancer: 'Lancero', axeman: 'Recluta', archer: 'Arquero', priest: 'Hermano Anselmo' }[m[1]] || 'Guardia';
    return { npc1_villager: 'Aldeano', npc2_villager: 'Campesino', npc3_villager: 'Cocinero', npc4_villager: 'Paje', npc5_villager: 'Dama', npc6_villager: 'Anciano', npc7_villager: 'Anciana',
      npc8_villager: 'Princesa Lía', npc9_villager: 'Reina Elara', npc10_villager: 'Albañil', king_idle: 'Rey Aldric' }[key] || 'Habitante';
  },

  onTalked(id) {
    const s = this.story;
    if (id === 'king' && s.step === 0) this.advanceQuest();
    else if (id === 'captain' && s.step === 1) this.advanceQuest();
    else if (id === 'captain' && s.step === 3) {
      this.maxHealth = s.maxHealth = Math.max(s.maxHealth, 4);
      this.health = this.maxHealth;
      this.createFloatingText(this.player.x, this.player.y - 46, '+1 CORAZÓN MÁXIMO', 0xf87171);
      this.advanceQuest();
    } else if (id === 'hermit' && s.step === 4) {
      this.advanceQuest();
      if (s.flags.key) this.advanceQuest();          // the big skeleton was already beaten on the way in
    } else if (id === 'king' && s.step === 7) {
      s.coins += 100;
      this.gainXP(120);
      this.advanceQuest();
      this.showZoneTitle('Capítulo 1 completo', 'La niebla del norte');
      if (!this.heroUnlocked()) this.time.delayedCall(3800, () => this.unlockHero());
    }
  },

  advanceQuest() {
    const s = this.story;
    if (!s || s.step >= QUESTS.length - 1) return;
    s.step++; s.count = 0;
    sfx.fx('quest_done', 0.7) || sfx.fx('book_clasp', 0.7);
    this.createFloatingText(this.player.x, this.player.y - 60, '✦ NUEVO OBJETIVO ✦', 0xfde68a);
    this.updateObjective();
    this.updateHUD();
    this.saveStory();
  },

  // ---------------------------------------------------------------- rewards
  xpForLevel(level) { return 40 + (level - 1) * 45; },
  gainXP(amount) {
    const s = this.story;
    if (!s) return;
    s.xp += amount;
    while (s.xp >= this.xpForLevel(s.level)) {
      s.xp -= this.xpForLevel(s.level);
      s.level++;
      if (s.level % 2 === 1 && s.maxHealth < 6) { s.maxHealth++; this.maxHealth = s.maxHealth; }
      this.health = this.maxHealth;
      this.maxStamina = 100 + (s.level - 1) * 5;
      this.createFloatingText(this.player.x, this.player.y - 70, `¡NIVEL ${s.level}!`, 0x86efac);
      sfx.fx('level_up', 0.8) || sfx.fx('book_open', 0.7, { rate: 1.4 });
      this.cameras.main.flash(260, 250, 240, 170);
    }
    this.updateObjective();
  },

  /** Every enemy that falls (called from damageEnemy). */
  onEnemyDefeated(enemy, def) {
    const s = this.story;
    if (this._gameMode !== 'campaign' || !s) return;
    s.coins += def.coins;
    this.createFloatingText(enemy.x, enemy.y - 34, `+${def.xp} exp`, 0x86efac);
    this.gainXP(def.xp);
    if (s.step === 2 && enemy.zone === 'castle.road') {
      s.count++;
      if (s.count >= QUESTS[2].count) this.advanceQuest();
    }
    if (enemy.type === 'skeleton_great' && !s.flags.key) {
      s.flags.key = true;
      this.createFloatingText(enemy.x, enemy.y - 52, '🗝 LLAVE DE LA CAPILLA', 0xfde68a);
      if (s.step === 5) this.advanceQuest();
    }
    if (def.boss) {
      s.flags['boss_' + enemy.type] = true;
      this.cameras.main.flash(600, 220, 200, 255);
      this.cameras.main.shake(500, 0.01);
      this.enemies.getChildren().forEach(e => { if (e !== enemy && e.active && !e.isDead) this.damageEnemy(e, 99, enemy.x, enemy.y); });
      if (s.step === 6) this.advanceQuest();
      this.showZoneTitle('El Nigromante ha caído', 'La niebla empieza a levantarse');
    }
    this.updateObjective();
    this.saveStory();
  },

  /** Campaign defeat: no game over screen, the hero wakes up where they entered the zone. */
  campaignDefeat() {
    const cam = this.cameras.main;
    cam.fadeOut(500, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const c = this.currentInterior;
      this.health = this.maxHealth;
      this.isDead = false; this.isAttacking = false; this.isInvulnerable = false; this.isDashing = false; this.isSpinning = false;
      this.player.setAlpha(1).clearTint();
      this.player.play(`${this.playerHero}_idle`);
      if (c) { this.placePlayerFeetAt(c.area.spawn.x, c.area.spawn.y); this.onAreaShown(c.area, c.area.spawn); }
      else this.player.setPosition(250, 340);
      cam.centerOn(this.player.x, this.player.y);
      this.updateHUD();
      cam.fadeIn(500, 0, 0, 0);
      this.showZoneTitle('Caíste en combate', 'Despertás donde empezaste la zona');
    });
  },

  // ---------------------------------------------------------------- zone hooks (called by the areas engine)
  onAreaShown(area, at) {
    if (this._gameMode !== 'campaign') return;
    this._bossSpawned = false;
    if (this._dlg) { this._dlg = null; this.dialogOpen = false; const d = document.getElementById('ck-dialog'); if (d) d.classList.remove('on'); }
    if (this.spawnZoneEnemies) {
      const saveSpawn = area.spawn;
      area.spawn = at || area.spawn;            // keep enemies away from where the hero actually arrives
      this.spawnZoneEnemies(area);
      area.spawn = saveSpawn;
    }
    const danger = !!ZONE_ENEMIES[area.key];
    if (area.title) this.showZoneTitle(area.title, danger ? '⚔ Zona peligrosa' : '');
    if (this.studioOnZoneShown) this.studioOnZoneShown();
  },
  onVillageShown() {
    if (this._gameMode !== 'campaign') return;
    if (this.clearZoneEnemies) this.clearZoneEnemies();
    this.showZoneTitle('Aldea del Roble', 'Zona segura');
    if (this.studioOnZoneShown) this.studioOnZoneShown();
  },

  /** Per-frame: typewriter, "talk" prompt, quest marker, chapel door. */
  updateStory(dt) {
    if (this._gameMode !== 'campaign' || !this.story) return;
    this.updateExtras(dt);
    const d = this._dlg;
    if (d && d.shown < d.lines[d.i].length) {
      d.acc = (d.acc || 0) + dt;
      if (d.acc > 22) { d.shown += Math.floor(d.acc / 22); d.acc = 0; this.renderDialog(); }
    }
    const prompt = document.getElementById('ck-prompt');
    const hit = !this.dialogOpen && this.nearbyStoryNPC();
    if (prompt) {
      if (hit) { prompt.textContent = 'T · Hablar con ' + hit.npc.name; prompt.classList.add('on'); }
      else prompt.classList.remove('on');
    }
    // golden mark over whoever moves the story forward, when they are in this zone
    const s = this.story, zone = this.currentZoneKey();
    const targetId = { 0: 'king', 1: 'captain', 3: 'captain', 4: 'hermit', 7: 'king' }[s.step];
    const t = STORY_NPCS.find(n => n.id === targetId && n.zone === zone);
    if (!this._questMark || !this._questMark.active) {
      this._questMark = this.add.text(0, 0, '!', { fontFamily: 'MedievalSharp, monospace', fontSize: '22px', fontStyle: 'bold', fill: '#fde047', stroke: '#3b2a05', strokeThickness: 5 })
        .setOrigin(0.5, 1).setDepth(29500).setVisible(false);
    }
    if (t && this.currentInterior) {
      const a = this.currentInterior.area;
      const up = a.outdoor ? 54 : 78;
      this._questMark.setVisible(true).setPosition(a.x + t.x, a.y + t.y - up + Math.sin(this.time.now / 220) * 3);
    } else this._questMark.setVisible(false);

    // the chapel: with the key in hand the door gives way and its tenant comes out
    if (s.step === 6 && zone === 'ruins.village' && !this._bossSpawned && !s.flags.boss_necromancer) {
      const a = this.currentInterior.area, cx = a.x + 560, cy = a.y + 300;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, cx, cy) < 120) {
        this._bossSpawned = true;
        this.cameras.main.shake(700, 0.008);
        this.cameras.main.flash(400, 120, 80, 200);
        sfx.fx('door_gate', 0.9, { rate: 0.7 });
        sfx.fx('necro_cast', 0.9, { rate: 0.6 });
        this.showZoneTitle('El Nigromante', 'Señor de la niebla');
        const boss = this.spawnEnemy(cx, cy - 40, 'necromancer');
        if (boss) { boss.zone = zone; this.time.delayedCall(900, () => boss.active && this.alertEnemy(boss)); }
      }
    }
  }
});
