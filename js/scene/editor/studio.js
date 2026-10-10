'use strict';
/* DEV STUDIO (campaign, key F2 or the MODO DEV button): works on whatever map the hero is standing in.
   Tools: move / scale / flip / hide any prop, draw on the map, pin notes, place NPCs (look, behaviour,
   lines, request) and enemy spawns. Everything is stored per zone in localStorage and in
   js/maps/data/studio_data.js (button "Exportar"). (methods of MainGameScene) */

const STUDIO_KEY = 'castleknight_studio_v1';

/** Looks an NPC placed in the Studio can have. scale = [outdoors, indoors]. */
const STUDIO_LOOKS = {
  npc1: { label: 'Aldeano', tex: 'npc1_villager', idle: 'npc1_idle', walk: 'npc1_walk', oy: 1, scale: [1.3, 2] },
  npc2: { label: 'Campesino', tex: 'npc2_villager', idle: 'npc2_idle', walk: 'npc2_walk', oy: 1, scale: [1.3, 2] },
  npc3: { label: 'Noble (hombre)', tex: 'npc3_villager', idle: 'npc3_idle', walk: 'npc3_walk', oy: 1, scale: [1.3, 2] },
  npc4: { label: 'Aldeana', tex: 'npc4_villager', idle: 'npc4_idle', walk: 'npc4_walk', oy: 1, scale: [1.3, 2] },
  npc5: { label: 'Noble (mujer)', tex: 'npc5_villager', idle: 'npc5_idle', walk: 'npc5_walk', oy: 1, scale: [1.3, 2] },
  npc6: { label: 'Anciano', tex: 'npc6_villager', idle: 'npc6_idle', walk: 'npc6_walk', oy: 1, scale: [1.3, 2] },
  npc7: { label: 'Anciana', tex: 'npc7_villager', idle: 'npc7_idle', walk: 'npc7_walk', oy: 1, scale: [1.3, 2] },
  npc8: { label: 'Princesa', tex: 'npc8_villager', idle: 'npc8_idle', walk: 'npc8_walk', oy: 1, scale: [1.3, 2] },
  npc9: { label: 'Reina', tex: 'npc9_villager', idle: 'npc9_idle', walk: 'npc9_walk', oy: 1, scale: [1.3, 2] },
  npc10: { label: 'Trabajador', tex: 'npc10_villager', idle: 'npc10_idle', walk: 'npc10_walk', oy: 1, scale: [1.3, 2] },
  knight: { label: 'Caballero', tex: 'g_knight_idle', idle: 'g_knight_idle', walk: 'g_knight_walk', oy: 0.61, scale: [1.2, 1.75] },
  templar: { label: 'Templario', tex: 'g_templar_idle', idle: 'g_templar_idle', walk: 'g_templar_walk', oy: 0.61, scale: [1.2, 1.75] },
  lancer: { label: 'Lancero a caballo', tex: 'g_lancer_idle', idle: 'g_lancer_idle', walk: 'g_lancer_walk', oy: 0.61, scale: [1.2, 1.75] },
  axeman: { label: 'Hachero', tex: 'g_axeman_idle', idle: 'g_axeman_idle', walk: 'g_axeman_walk', oy: 0.61, scale: [1.2, 1.75] },
  archer: { label: 'Arquero', tex: 'g_archer_idle', idle: 'g_archer_idle', walk: 'g_archer_walk', oy: 0.61, scale: [1.2, 1.75] },
  priest: { label: 'Sacerdote', tex: 'g_priest_idle', idle: 'g_priest_idle', walk: 'g_priest_walk', oy: 0.61, scale: [1.2, 1.75] },
  king: { label: 'Rey', tex: 'king_idle', idle: 'kingprueba_idle', walk: 'kingprueba_walk', oy: 0.61, scale: [1.2, 1.75] }
};
const STUDIO_BEHAVIOURS = { idle: 'Quieto', wander: 'Deambula cerca', patrol: 'Patrulla por puntos', follow: 'Sigue al héroe', flee: 'Huye del héroe', look: 'Quieto y mira al héroe' };
const STUDIO_NOTE_KINDS = ['Arte', 'NPC', 'Enemigo', 'Mecánica', 'Historia', 'Otro'];
const STUDIO_COLORS = ['#ff3b3b', '#ffd23b', '#3bff7a', '#3bc8ff', '#ffffff', '#111111'];

Object.assign(MainGameScene.prototype, {
  // ------------------------------------------------------------------ data
  studioLoad() {
    if (this._studio) return this._studio;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(STUDIO_KEY) || 'null'); } catch (e) { }
    const file = (typeof window !== 'undefined' && window.STUDIO_DATA) || { savedAt: 0, zones: {} };
    this._studio = local && (local.savedAt || 0) >= (file.savedAt || 0) ? local : JSON.parse(JSON.stringify(file));
    this._studio.zones = this._studio.zones || {};
    return this._studio;
  },
  studioSave() {
    const d = this.studioLoad();
    d.savedAt = Date.now();
    try { localStorage.setItem(STUDIO_KEY, JSON.stringify(d)); } catch (e) { }
  },
  /** Data of the zone the hero is in: { moves, strokes, notes, npcs, enemies }. */
  studioZone(key) {
    const d = this.studioLoad(), k = key || this.currentZoneKey();
    const z = d.zones[k] = d.zones[k] || {};
    z.moves = z.moves || {}; z.strokes = z.strokes || []; z.notes = z.notes || []; z.npcs = z.npcs || []; z.enemies = z.enemies || [];
    z.solids = z.solids || []; z.off = z.off || []; z.added = z.added || []; z.triggers = z.triggers || [];
    return z;
  },
  studioOrigin() {
    const c = this.currentInterior;
    return c ? { x: c.area.x, y: c.area.y, indoor: !c.area.outdoor } : { x: 0, y: 0, indoor: false };
  },

  // ------------------------------------------------------------------ props of the current map
  /** Every prop that can be edited here, each with a stable id ("texture#n"). */
  studioProps() {
    const c = this.currentInterior;
    const list = c ? (c.area.objs || []) : (this.campaignObjectSprites || []);
    const count = {}, out = [];
    list.forEach(o => {
      if (!o || !o.active || !o.texture || !o.setPosition || (o.type !== 'Image' && o.type !== 'Sprite')) return;
      const k = o.texture.key;
      if (k === '__DEFAULT' || k === '__MISSING' || k === 'fx_px') return;
      count[k] = (count[k] || 0) + 1;
      if (o.displayWidth > 700 || o.displayHeight > 620) return;          // painted grounds are not props
      o._sid = k + '#' + count[k];
      if (!o._st0) o._st0 = { x: o.x, y: o.y, sx: o.scaleX, sy: o.scaleY, flip: o.flipX, depth: o.depth, alpha: o.alpha };
      out.push(o);
    });
    return out;
  },
  /** Put every prop where the Studio says (called when a map is shown). */
  studioApplyMoves() {
    const z = this.studioZone();
    this.studioProps().forEach(o => {
      const m = z.moves[o._sid], b = o._st0;
      if (!m) { o.setPosition(b.x, b.y); o.setScale(b.sx, b.sy); o.setFlipX(b.flip); o.setDepth(b.depth); o.setAlpha(b.alpha); return; }
      o.setPosition(b.x + (m.dx || 0), b.y + (m.dy || 0));
      o.setScale(b.sx * (m.s || 1), b.sy * (m.s || 1));
      o.setFlipX(m.flip ? !b.flip : b.flip);
      o.setDepth(b.depth > 50 ? b.depth + (m.dy || 0) : b.depth);
      o.setAlpha(m.hidden ? (this.studioOn ? 0.25 : 0) : b.alpha);
    });
  },

  // ------------------------------------------------------------------ collisions and props added in the Studio
  /** Solid boxes drawn in the Studio, and original ones switched off. */
  studioApplySolids() {
    (this._stSolids || []).forEach(zn => zn.destroy());
    this._stSolids = [];
    const z = this.studioZone(), o = this.studioOrigin(), c = this.currentInterior;
    const group = c ? this.interiorObstacles : this.obstacles;
    if (group) z.solids.forEach(r => {
      const zn = this.add.zone(o.x + r.x + r.w / 2, o.y + r.y + r.h / 2, r.w, r.h);
      this.physics.add.existing(zn, true); group.add(zn); this._stSolids.push(zn);
    });
    if (c) (c.area.objs || []).forEach(ob => {
      if (!ob || ob.type !== 'Zone' || !ob.body) return;
      const off = z.off.indexOf(this.studioSolidKey(ob, o)) >= 0;
      if (off) { ob.body.enable = false; ob._stOff = true; }
      else if (ob._stOff) { ob.body.enable = true; ob._stOff = false; }
    });
  },
  studioSolidKey(ob, o) { return Math.round(ob.x - ob.width / 2 - o.x) + ',' + Math.round(ob.y - ob.height / 2 - o.y) + ',' + Math.round(ob.width) + ',' + Math.round(ob.height); },
  studioApplyAdded() {
    (this._stAdded || []).forEach(im => im.destroy());
    this._stAdded = [];
    const z = this.studioZone(), o = this.studioOrigin();
    z.added.forEach(a => {
      if (!this.textures.exists(a.key)) return;
      const im = this.add.image(o.x + a.x, o.y + a.y, a.key).setOrigin(0.5, 1).setScale(a.s || 1).setFlipX(!!a.flip).setDepth(o.y + a.y);
      im._added = a; this._stAdded.push(im);
    });
  },
  /** Textures that can be placed with the "Agregar" tool: scenery of every map already loaded. */
  studioPalette() {
    const keys = {};
    this.studioProps().forEach(o => { keys[o.texture.key] = 1; });
    this.textures.getTextureKeys().forEach(k => { if (/^(cs_|ru_|int_)/.test(k)) { const f = this.textures.get(k).get(); if (f.width <= 400 && f.height <= 400 && this.textures.get(k).frameTotal <= 2) keys[k] = 1; } });
    return Object.keys(keys).sort();
  },
  studioSnap() {
    this._stUndo = this._stUndo || [];
    this._stUndo.push({ zone: this.currentZoneKey(), json: JSON.stringify(this.studioZone()) });
    if (this._stUndo.length > 40) this._stUndo.shift();
  },
  studioUndo() {
    const u = (this._stUndo || []).pop();
    if (!u || u.zone !== this.currentZoneKey()) return;
    this.studioLoad().zones[u.zone] = JSON.parse(u.json);
    this.studioSel = null;
    this.studioApplyMoves(); this.studioApplySolids(); this.studioApplyAdded(); this.studioSpawnNPCs();
    this.studioSave(); this.studioPanel(); this.studioRedraw();
  },

  // ------------------------------------------------------------------ NPCs placed in the Studio (they live in the game too)
  studioSpawnNPCs() {
    (this.devNpcs || []).forEach(n => { n.sprite.destroy(); if (n.tag) n.tag.destroy(); });
    this.devNpcs = [];
    if (this._gameMode !== 'campaign') return;
    const z = this.studioZone(), o = this.studioOrigin();
    z.npcs.forEach(data => {
      const look = STUDIO_LOOKS[data.look] || STUDIO_LOOKS.npc1;
      if (!this.textures.exists(look.tex)) return;
      const sp = this.add.sprite(o.x + data.x, o.y + data.y, look.tex).setOrigin(0.5, look.oy).setScale(look.scale[o.indoor ? 1 : 0] * (data.size || 1)).setDepth(o.y + data.y);
      if (this.anims.exists(look.idle)) sp.play(look.idle);
      sp.setFlipX(!!data.flip);
      const tag = data.name ? this.add.text(sp.x, sp.y, data.name, { fontFamily: 'Pixuf, MedievalSharp, monospace', fontSize: '9px', fill: '#fde68a', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(29000) : null;
      this.devNpcs.push({ data, look, sprite: sp, tag, hx: o.x + data.x, hy: o.y + data.y, i: 0, wait: 600, tx: null, ty: null, moving: false });
    });
  },
  updateStudioNPCs(dt) {
    if (!this.devNpcs || !this.devNpcs.length || !this.player || !this.player.body) return;
    const px = this.player.body.center.x, py = this.player.body.bottom, o = this.studioOrigin();
    this.devNpcs.forEach(n => {
      const sp = n.sprite, d = n.data, beh = d.behaviour || 'idle', speed = d.speed || 26, R = d.radius || 60;
      const dist = Phaser.Math.Distance.Between(sp.x, sp.y, px, py);
      let tx = null, ty = null;
      if (this.studioOn || this.dialogOpen) { /* frozen while editing or talking */ }
      else if (beh === 'follow') { if (dist > 34 && dist < 320) { tx = px; ty = py; } }
      else if (beh === 'flee') {
        if (dist < R) { const a = Math.atan2(sp.y - py, sp.x - px); tx = sp.x + Math.cos(a) * 30; ty = sp.y + Math.sin(a) * 30; }
        else if (dist > R * 1.6 && Phaser.Math.Distance.Between(sp.x, sp.y, n.hx, n.hy) > 4) { tx = n.hx; ty = n.hy; }
      } else if (beh === 'wander' || beh === 'patrol') {
        if (dist < 30) { /* stops when the hero is next to them */ }
        else if (n.tx === null) {
          n.wait -= dt;
          if (n.wait <= 0) {
            if (beh === 'patrol' && d.points && d.points.length) { n.i = (n.i + 1) % (d.points.length + 1); const p = n.i === 0 ? [d.x, d.y] : d.points[n.i - 1]; n.tx = o.x + p[0]; n.ty = o.y + p[1]; }
            else { const a = Math.random() * Math.PI * 2, r = Math.random() * R; n.tx = n.hx + Math.cos(a) * r; n.ty = n.hy + Math.sin(a) * r * 0.7; }
          }
        } else { tx = n.tx; ty = n.ty; }
      }
      if (tx !== null) {
        const dx = tx - sp.x, dy = ty - sp.y, dd = Math.hypot(dx, dy), step = speed * dt / 1000;
        if (dd <= step + 0.5) { sp.setPosition(tx, ty); n.tx = n.ty = null; n.wait = 900 + Math.random() * 2200; tx = null; }
        else { sp.x += dx / dd * step; sp.y += dy / dd * step; if (Math.abs(dx) > 0.5) sp.setFlipX(dx < 0); }
      }
      const moving = tx !== null;
      if (moving !== n.moving) { n.moving = moving; const k = moving ? n.look.walk : n.look.idle; if (this.anims.exists(k)) sp.play(k, true); }
      if (!moving && dist < 60 && (beh === 'look' || dist < 34) && !this.studioOn) sp.setFlipX(px < sp.x);
      sp.setDepth(sp.y);
      if (n.tag) n.tag.setPosition(Math.round(sp.x), Math.round(sp.y - sp.displayHeight * (n.look.oy === 1 ? 1 : 0.42) - 2));
    });
  },
  /** Studio NPC in reach of the hero (used by the T key). */
  nearbyStudioNPC() {
    if (!this.devNpcs || !this.player || !this.player.body) return null;
    const px = this.player.body.center.x, py = this.player.body.bottom;
    return this.devNpcs.find(n => Phaser.Math.Distance.Between(n.sprite.x, n.sprite.y, px, py) < 46) || null;
  },

  /** Called by the areas engine / story hooks every time a map is shown. */
  studioOnZoneShown() {
    this.studioApplyMoves();
    this.studioApplySolids();
    this.studioApplyAdded();
    this.studioSpawnNPCs();
    // enemy spawns added in the Studio
    const c = this.currentInterior;
    if (c && this._gameMode === 'campaign' && !this.studioOn) {
      this.studioZone().enemies.forEach(e => { const en = this.spawnEnemy(c.area.x + e.x, c.area.y + e.y - 26, e.type); if (en) en.zone = c.area.key; });
    }
    if (this.studioOn) { this.studioSel = null; this.studioRedraw(); this.studioPanel(); }
  },

  // ------------------------------------------------------------------ switching the Studio on and off
  toggleStudio() {
    if (this._gameMode !== 'campaign' || !this.gameStarted) return;
    this.studioOn = !this.studioOn;
    this.studioBuildUI();
    document.getElementById('ck-studio').classList.toggle('on', this.studioOn);
    const objBox = document.getElementById('ck-objective');
    if (objBox) objBox.style.display = this.studioOn ? 'none' : '';
    const cam = this.cameras.main;
    if (this.studioOn) {
      this.studioTool = this.studioTool || 'move';
      this.studioSel = null;
      this._studioCam = { zoom: cam.zoom };
      cam.stopFollow();
      this.enemies.getChildren().forEach(e => e.body && e.setVelocity(0, 0));
      if (!this._studioInput) this.studioBindInput();
      this.studioSetTool(this.studioTool);
    } else {
      cam.setZoom(this._studioCam ? this._studioCam.zoom : cam.zoom);
      cam.startFollow(this.player, true, 0.09, 0.09);
      if (this.studioGfx) this.studioGfx.clear();
      (this.studioLabels || []).forEach(t => t.destroy()); this.studioLabels = [];
      this.input.keyboard.enabled = true;
      this.studioSave();
      this.studioSpawnNPCs();
    }
    this.studioApplyMoves();
    this.studioRedraw();
  },

  studioBuildUI() {
    if (document.getElementById('ck-studio')) return;
    const host = document.getElementById('game-wrapper') || document.body;
    const el = document.createElement('div');
    el.id = 'ck-studio';
    const tools = [['move', '✥', 'Mover / editar objetos'], ['draw', '✎', 'Dibujar sobre el mapa'], ['note', '✉', 'Nota con ubicación'], ['npc', '☺', 'NPC: colocar / editar'], ['enemy', '☠', 'Enemigo: punto de aparición'], ['add', '✚', 'Agregar objetos nuevos'], ['wall', '▦', 'Colisión: dibujar o apagar'], ['trigger', '⚑', 'Evento al pisar una zona'], ['erase', '⌫', 'Borrar dibujos, notas, NPC o enemigos']];
    el.innerHTML =
      '<div class="st-bar">' +
        '<div class="st-title">ESTUDIO <span id="st-zone"></span></div>' +
        tools.map(t => `<button class="st-tool" data-tool="${t[0]}" title="${t[2]}"><b>${t[1]}</b><span>${t[2].split(/[ :]/)[0]}</span></button>`).join('') +
        '<div class="st-sep"></div>' +
        '<button class="st-act" id="st-center" title="Centrar la cámara en el héroe">◎ Héroe</button>' +
        '<button class="st-act" id="st-undo" title="Deshacer el último cambio hecho con el ratón (Ctrl+Z)">↶ Deshacer</button>' +
        '<button class="st-act" id="st-shot" title="Descargar una imagen de lo que se ve, con dibujos y notas">▣ Captura</button>' +
        '<button class="st-act st-main" id="st-export" title="Descargar studio_data.js con todo lo marcado">⇩ Exportar</button>' +
        '<button class="st-act" id="st-close" title="Salir del Estudio (F2)">✕ Salir</button>' +
      '</div>' +
      '<div class="st-panel" id="st-panel"></div>' +
      '<div class="st-help" id="st-help"></div>';
    host.appendChild(el);
    el.querySelectorAll('.st-tool').forEach(b => { b.onclick = () => this.studioSetTool(b.dataset.tool); });
    el.querySelector('#st-center').onclick = () => this.cameras.main.centerOn(this.player.x, this.player.y);
    el.querySelector('#st-undo').onclick = () => this.studioUndo();
    el.querySelector('#st-shot').onclick = () => this.studioScreenshot();
    el.querySelector('#st-export').onclick = () => this.studioExport();
    el.querySelector('#st-close').onclick = () => this.toggleStudio();
    // typing in the panel must not move the hero nor be swallowed by the game's key capture
    el.addEventListener('focusin', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { this.input.keyboard.enabled = false; this.input.keyboard.disableGlobalCapture(); } });
    el.addEventListener('focusout', () => { this.input.keyboard.enabled = true; this.input.keyboard.enableGlobalCapture(); });
    ['keydown', 'keyup', 'keypress'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
  },

  studioSetTool(tool) {
    this.studioTool = tool;
    this.studioSel = null; this._patrolFor = null;
    document.querySelectorAll('#ck-studio .st-tool').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    const help = {
      move: 'Clic en un objeto para elegirlo y arrastralo. Rueda: zoom · Clic derecho: mover la cámara.',
      draw: 'Arrastrá para dibujar sobre el mapa. Elegí color y grosor en el panel.',
      note: 'Clic donde quieras dejar una nota; escribí qué querés ver ahí.',
      npc: 'Clic en el mapa para poner un NPC, o en uno ya puesto para editarlo / arrastrarlo.',
      enemy: 'Clic en el mapa para marcar dónde aparece un enemigo (elegí el tipo en el panel).',
      add: 'Elegí un objeto en el panel y hacé clic para ponerlo. Clic en uno ya puesto para moverlo.',
      wall: 'Arrastrá para dibujar una pared invisible (verde). Clic en una colisión original (naranja) para apagarla o prenderla.',
      trigger: 'Arrastrá un rectángulo: cuando el héroe lo pise pasa lo que elijas en el panel.',
      erase: 'Clic sobre un trazo, nota, NPC, enemigo, objeto agregado, pared o evento para borrarlo.'
    }[tool];
    document.getElementById('st-help').textContent = help;
    document.getElementById('st-zone').textContent = '· ' + this.currentZoneKey();
    this.studioPanel();
    this.studioRedraw();
  },

  // ------------------------------------------------------------------ pointer
  studioBindInput() {
    this._studioInput = true;
    this.input.on('pointerdown', p => { if (this.studioOn) this.studioDown(p); });
    this.input.on('pointermove', p => { if (this.studioOn) this.studioMove(p); });
    this.input.on('pointerup', p => { if (this.studioOn) this.studioUp(p); });
    this.input.on('wheel', (p, objs, dx, dy) => {
      if (!this.studioOn) return;
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.4, 4));
    });
    window.addEventListener('keydown', e => { if (this.studioOn && e.ctrlKey && (e.key === 'z' || e.key === 'Z') && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); this.studioUndo(); } });
  },
  studioLocal(p) { const o = this.studioOrigin(); return { x: Math.round(p.worldX - o.x), y: Math.round(p.worldY - o.y) }; },
  studioDown(p) {
    const cam = this.cameras.main;
    if (p.rightButtonDown() || p.middleButtonDown()) { cam.removeBounds(); this._stPan = { x: p.x, y: p.y, sx: cam.scrollX, sy: cam.scrollY }; return; }
    // the panel may have been rebuilt while one of its fields had the focus: give the keyboard back to the game
    if (document.activeElement && document.activeElement.blur && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) document.activeElement.blur();
    this.input.keyboard.enabled = true; this.input.keyboard.enableGlobalCapture();
    this.studioSnap();
    const z = this.studioZone(), l = this.studioLocal(p), tool = this.studioTool;
    const inRect = r => l.x >= r.x && l.x <= r.x + r.w && l.y >= r.y && l.y <= r.y + r.h;
    const near = (a, r) => Phaser.Math.Distance.Between(a.x, a.y, l.x, l.y) <= r;
    if (tool === 'draw') {
      this._stroke = { c: this.studioColor || STUDIO_COLORS[0], w: this.studioWidth || 3, pts: [l.x, l.y] };
      z.strokes.push(this._stroke);
    } else if (tool === 'note') {
      const hit = z.notes.find(n => near(n, 14));
      if (hit) { this.studioSel = { type: 'note', ref: hit }; this._stDrag = { ref: hit, ox: l.x - hit.x, oy: l.y - hit.y }; }
      else { const n = { x: l.x, y: l.y, kind: this.studioNoteKind || 'Arte', text: '' }; z.notes.push(n); this.studioSel = { type: 'note', ref: n }; }
      this.studioPanel(true);
    } else if (tool === 'npc') {
      if (this._patrolFor) { (this._patrolFor.points = this._patrolFor.points || []).push([l.x, l.y]); this.studioSave(); this.studioPanel(); this.studioRedraw(); return; }
      const hit = z.npcs.find(n => near({ x: n.x, y: n.y - 12 }, 20));
      if (hit) { this.studioSel = { type: 'npc', ref: hit }; this._stDrag = { ref: hit, ox: l.x - hit.x, oy: l.y - hit.y, npc: true }; }
      else {
        const n = { x: l.x, y: l.y, look: this.studioLook || 'npc1', name: '', behaviour: 'idle', radius: 60, speed: 26, lines: [], request: '' };
        z.npcs.push(n); this.studioSel = { type: 'npc', ref: n }; this.studioSpawnNPCs();
      }
      this.studioPanel(true);
    } else if (tool === 'enemy') {
      const hit = z.enemies.find(n => near(n, 14));
      if (hit) { this.studioSel = { type: 'enemy', ref: hit }; this._stDrag = { ref: hit, ox: l.x - hit.x, oy: l.y - hit.y }; }
      else { const n = { x: l.x, y: l.y, type: this.studioEnemy || 'skeleton', note: '' }; z.enemies.push(n); this.studioSel = { type: 'enemy', ref: n }; }
      this.studioPanel();
    } else if (tool === 'add') {
      const hit = (this._stAdded || []).filter(im => im.getBounds().contains(p.worldX, p.worldY)).pop();
      if (hit) { this.studioSel = { type: 'added', ref: hit._added }; this._stDrag = { ref: hit._added, ox: l.x - hit._added.x, oy: l.y - hit._added.y, added: true }; }
      else if (this.studioAddKey) { const a = { key: this.studioAddKey, x: l.x, y: l.y, s: 1 }; z.added.push(a); this.studioSel = { type: 'added', ref: a }; this.studioApplyAdded(); }
      this.studioPanel();
    } else if (tool === 'wall') {
      const own = z.solids.find(inRect);
      const c = this.currentInterior, o = this.studioOrigin();
      const orig = !own && c ? (c.area.objs || []).find(ob => ob && ob.type === 'Zone' && ob.body && ob.getBounds().contains(p.worldX, p.worldY)) : null;
      if (own) this.studioSel = { type: 'solid', ref: own };
      else if (orig) { const k = this.studioSolidKey(orig, o), i = z.off.indexOf(k); if (i >= 0) z.off.splice(i, 1); else z.off.push(k); this.studioApplySolids(); }
      else this._stRect = { list: z.solids, r: { x: l.x, y: l.y, w: 0, h: 0 }, x0: l.x, y0: l.y, type: 'solid' };
      this.studioPanel();
    } else if (tool === 'trigger') {
      const hit = z.triggers.find(inRect);
      if (hit) this.studioSel = { type: 'trigger', ref: hit };
      else this._stRect = { list: z.triggers, r: { x: l.x, y: l.y, w: 0, h: 0, kind: 'dialog', name: '', text: '', once: true }, x0: l.x, y0: l.y, type: 'trigger' };
      this.studioPanel();
    } else if (tool === 'erase') {
      const kill = (arr, r, f) => { const i = arr.findIndex(n => near(f ? f(n) : n, r)); if (i >= 0) { arr.splice(i, 1); return true; } return false; };
      let done = kill(z.notes, 14) || kill(z.enemies, 14);
      const killRect = arr => { const i = arr.findIndex(inRect); if (i >= 0) { arr.splice(i, 1); return true; } return false; };
      if (!done) { const im = (this._stAdded || []).filter(v => v.getBounds().contains(p.worldX, p.worldY)).pop(); if (im) { z.added.splice(z.added.indexOf(im._added), 1); this.studioApplyAdded(); done = true; } }
      if (!done && (killRect(z.triggers) || killRect(z.solids))) { done = true; this.studioApplySolids(); }
      if (!done && kill(z.npcs, 20, n => ({ x: n.x, y: n.y - 12 }))) { done = true; this.studioSpawnNPCs(); }
      if (!done) {
        const i = z.strokes.findIndex(s => { for (let k = 0; k < s.pts.length; k += 2) if (Math.hypot(s.pts[k] - l.x, s.pts[k + 1] - l.y) < 8) return true; return false; });
        if (i >= 0) z.strokes.splice(i, 1);
      }
    } else {                                                  // move
      const props = this.studioProps().filter(o => o.getBounds().contains(p.worldX, p.worldY));
      // the smallest thing under the cursor wins (a barrel in front of a wall), then the one drawn on top
      props.sort((a, b) => (a.displayWidth * a.displayHeight) - (b.displayWidth * b.displayHeight) || b.depth - a.depth);
      const o = props[0];
      this.studioSel = o ? { type: 'prop', ref: o } : null;
      if (o) { const m = z.moves[o._sid] = z.moves[o._sid] || {}; this._stDrag = { prop: o, m, px: p.worldX, py: p.worldY, dx: m.dx || 0, dy: m.dy || 0 }; }
      this.studioPanel();
    }
    this.studioSave();
    this.studioRedraw();
  },
  studioMove(p) {
    const cam = this.cameras.main;
    if (this._stPan) { cam.setScroll(this._stPan.sx - (p.x - this._stPan.x) / cam.zoom, this._stPan.sy - (p.y - this._stPan.y) / cam.zoom); return; }
    const l = this.studioLocal(p);
    if (this._stRect) {
      const q = this._stRect, r = q.r;
      r.x = Math.min(q.x0, l.x); r.y = Math.min(q.y0, l.y); r.w = Math.abs(l.x - q.x0); r.h = Math.abs(l.y - q.y0);
      this.studioRedraw(q);
      return;
    }
    if (this._stroke) {
      const s = this._stroke.pts, n = s.length;
      if (Math.hypot(s[n - 2] - l.x, s[n - 1] - l.y) >= 2) { s.push(l.x, l.y); this.studioRedraw(); }
    } else if (this._stDrag) {
      const d = this._stDrag;
      if (d.prop) { d.m.dx = Math.round(d.dx + p.worldX - d.px); d.m.dy = Math.round(d.dy + p.worldY - d.py); this.studioApplyMoves(); }
      else { d.ref.x = l.x - d.ox; d.ref.y = l.y - d.oy; if (d.added) this.studioApplyAdded(); if (d.npc) { const n = (this.devNpcs || []).find(v => v.data === d.ref); const o = this.studioOrigin(); if (n) { n.sprite.setPosition(o.x + d.ref.x, o.y + d.ref.y); n.hx = n.sprite.x; n.hy = n.sprite.y; } } }
      this.studioRedraw();
    }
  },
  studioUp() {
    if (this._stroke && this._stroke.pts.length < 4) this._stroke.pts.push(this._stroke.pts[0] + 1, this._stroke.pts[1] + 1);
    if (this._stRect) {
      const q = this._stRect; this._stRect = null;
      if (q.r.w >= 4 && q.r.h >= 4) { q.list.push(q.r); this.studioSel = { type: q.type, ref: q.r }; if (q.type === 'solid') this.studioApplySolids(); }
      this.studioSave(); this.studioPanel(); this.studioRedraw();
      return;
    }
    const moved = this._stDrag && this._stDrag.prop;
    this._stPan = null; this._stroke = null; this._stDrag = null;
    this.studioSave();
    if (moved) this.studioPanel();
  },

  // ------------------------------------------------------------------ drawing the overlay (strokes, pins, selection)
  studioRedraw(pending) {
    if (!this.studioGfx) this.studioGfx = this.add.graphics().setDepth(28500);
    const g = this.studioGfx; g.clear();
    (this.studioLabels || []).forEach(t => t.destroy()); this.studioLabels = [];
    if (!this.studioOn) return;
    const z = this.studioZone(), o = this.studioOrigin();
    const label = (x, y, txt, color) => this.studioLabels.push(this.add.text(o.x + x, o.y + y, txt, { fontFamily: 'monospace', fontSize: '9px', fill: color || '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 0.5).setDepth(28600));
    z.strokes.forEach(s => {
      g.lineStyle(s.w, parseInt(s.c.slice(1), 16), 0.95);
      g.beginPath(); g.moveTo(o.x + s.pts[0], o.y + s.pts[1]);
      for (let i = 2; i < s.pts.length; i += 2) g.lineTo(o.x + s.pts[i], o.y + s.pts[i + 1]);
      g.strokePath();
    });
    z.notes.forEach((n, i) => {
      g.fillStyle(0x000000, 0.8); g.fillCircle(o.x + n.x, o.y + n.y, 9);
      g.fillStyle(0xffd23b, 1); g.fillCircle(o.x + n.x, o.y + n.y, 7);
      label(n.x, n.y, String(i + 1), '#3a2208');
      if (n.text) label(n.x, n.y - 16, (n.kind + ': ' + n.text).slice(0, 46) + (n.text.length > 40 ? '…' : ''), '#ffe9a8');
    });
    z.enemies.forEach(e => {
      g.lineStyle(2, 0xff4040, 1); g.strokeCircle(o.x + e.x, o.y + e.y, 9);
      g.lineBetween(o.x + e.x - 6, o.y + e.y - 6, o.x + e.x + 6, o.y + e.y + 6); g.lineBetween(o.x + e.x + 6, o.y + e.y - 6, o.x + e.x - 6, o.y + e.y + 6);
      label(e.x, e.y - 16, (ENEMY_TYPES[e.type] || {}).name || e.type, '#ffb0b0');
    });
    z.npcs.forEach(n => {
      g.lineStyle(1, 0x3bc8ff, 0.9); g.strokeEllipse(o.x + n.x, o.y + n.y, 22, 10);
      if (n.behaviour === 'wander' || n.behaviour === 'flee') { g.lineStyle(1, 0x3bc8ff, 0.35); g.strokeCircle(o.x + n.x, o.y + n.y, n.radius || 60); }
      if (n.behaviour === 'patrol' && n.points && n.points.length) {
        g.lineStyle(1, 0x3bc8ff, 0.8); g.beginPath(); g.moveTo(o.x + n.x, o.y + n.y);
        n.points.forEach(pt => g.lineTo(o.x + pt[0], o.y + pt[1])); g.closePath(); g.strokePath();
        n.points.forEach((pt, i) => { g.fillStyle(0x3bc8ff, 1); g.fillCircle(o.x + pt[0], o.y + pt[1], 3); label(pt[0], pt[1] - 8, String(i + 1), '#bfeaff'); });
      }
      if (n.request) label(n.x, n.y + 12, '✉ pedido', '#ffe9a8');
    });
    // collisions: own boxes green, original ones orange (red and crossed when switched off)
    if (this.studioTool === 'wall' || this.studioTool === 'erase') {
      const c = this.currentInterior;
      if (c && this.studioTool === 'wall') (c.area.objs || []).forEach(ob => {
        if (!ob || ob.type !== 'Zone' || !ob.body) return;
        const b = ob.getBounds(), off = ob._stOff;
        g.lineStyle(1, off ? 0xff3030 : 0xffa030, 0.9); g.strokeRect(b.x, b.y, b.width, b.height);
        if (off) { g.lineBetween(b.x, b.y, b.right, b.bottom); g.lineBetween(b.right, b.y, b.x, b.bottom); }
      });
      z.solids.forEach(r => { g.fillStyle(0x30e060, 0.3); g.fillRect(o.x + r.x, o.y + r.y, r.w, r.h); g.lineStyle(1, 0x30e060, 1); g.strokeRect(o.x + r.x, o.y + r.y, r.w, r.h); });
    }
    z.triggers.forEach((t, i) => {
      g.fillStyle(0xb060ff, 0.18); g.fillRect(o.x + t.x, o.y + t.y, t.w, t.h); g.lineStyle(1, 0xb060ff, 1); g.strokeRect(o.x + t.x, o.y + t.y, t.w, t.h);
      label(t.x + t.w / 2, t.y + t.h / 2, '⚑ ' + ({ dialog: 'diálogo', title: 'cartel', enemies: 'enemigos', heal: 'curación', request: 'pedido' }[t.kind] || t.kind), '#e0c8ff');
    });
    if (pending) { const r = pending.r; g.lineStyle(1, 0xffffff, 1); g.strokeRect(o.x + r.x, o.y + r.y, r.w, r.h); }
    const s = this.studioSel;
    if (s && (s.type === 'solid' || s.type === 'trigger')) { g.lineStyle(2, 0xffffff, 1); g.strokeRect(o.x + s.ref.x - 1, o.y + s.ref.y - 1, s.ref.w + 2, s.ref.h + 2); }
    else if (s && s.type === 'added') { const im = (this._stAdded || []).find(v => v._added === s.ref); if (im) { const b = im.getBounds(); g.lineStyle(1, 0xffffff, 1); g.strokeRect(b.x, b.y, b.width, b.height); } }
    else if (s && s.type === 'prop' && s.ref.active) { const b = s.ref.getBounds(); g.lineStyle(1, 0xffffff, 1); g.strokeRect(b.x, b.y, b.width, b.height); g.lineStyle(1, 0x000000, 0.8); g.strokeRect(b.x - 1, b.y - 1, b.width + 2, b.height + 2); }
    else if (s && s.ref && (s.type === 'note' || s.type === 'npc' || s.type === 'enemy')) { g.lineStyle(2, 0xffffff, 1); g.strokeCircle(o.x + s.ref.x, o.y + s.ref.y - (s.type === 'npc' ? 12 : 0), s.type === 'npc' ? 20 : 12); }
  },

  // ------------------------------------------------------------------ right-hand panel
  studioPanel(focus) {
    const el = document.getElementById('st-panel');
    if (!el) return;
    const z = this.studioZone(), s = this.studioSel, tool = this.studioTool;
    const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const opt = (obj, cur) => Object.keys(obj).map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(obj[k].label || obj[k].name || obj[k])}</option>`).join('');
    let h = '';
    if (tool === 'draw') {
      h = '<h4>Dibujo</h4><div class="st-row">' + STUDIO_COLORS.map(c => `<button class="st-color${c === (this.studioColor || STUDIO_COLORS[0]) ? ' active' : ''}" data-c="${c}" style="background:${c}"></button>`).join('') + '</div>' +
        `<label>Grosor <input type="range" id="st-w" min="1" max="12" value="${this.studioWidth || 3}"></label>` +
        `<p>${z.strokes.length} trazo(s) en esta zona.</p><button id="st-clear">Borrar todos los trazos</button>`;
    } else if (tool === 'move') {
      if (s && s.type === 'prop') {
        const o = s.ref, m = z.moves[o._sid] || {}, org = this.studioOrigin();
        h = `<h4>${esc(o._sid)}</h4><p>x ${Math.round(o.x - org.x)} · y ${Math.round(o.y - org.y)}</p>` +
          `<label>Tamaño <input type="range" id="st-s" min="40" max="250" value="${Math.round((m.s || 1) * 100)}"> <span id="st-sv">${Math.round((m.s || 1) * 100)}%</span></label>` +
          `<div class="st-row"><button id="st-flip">Espejar</button><button id="st-hide">${m.hidden ? 'Mostrar' : 'Ocultar'}</button><button id="st-reset">Restaurar</button></div>` +
          `<label>Nota para Claude sobre este objeto<textarea id="st-note" rows="4" placeholder="Ej: cambiá este barril por una carreta rota">${esc(m.note)}</textarea></label>` +
          '<p class="st-dim">Las flechas del teclado lo mueven de a 1 px. La colisión no se mueve sola: queda anotada para que Claude la ajuste.</p>';
      } else h = '<h4>Objetos</h4><p>Elegí un objeto del mapa.</p><p class="st-dim">' + Object.keys(z.moves).length + ' objeto(s) modificados en esta zona.</p>';
    } else if (tool === 'note') {
      if (s && s.type === 'note') {
        const n = s.ref;
        h = `<h4>Nota ${z.notes.indexOf(n) + 1} <small>(x ${n.x}, y ${n.y})</small></h4>` +
          `<label>Tipo <select id="st-kind">${STUDIO_NOTE_KINDS.map(k => `<option${k === n.kind ? ' selected' : ''}>${k}</option>`).join('')}</select></label>` +
          `<label>¿Qué querés acá?<textarea id="st-text" rows="7" placeholder="Ej: acá quiero un puesto de frutas con toldo rojo y un gato durmiendo">${esc(n.text)}</textarea></label>` +
          '<button id="st-del">Borrar nota</button>';
      } else h = '<h4>Notas</h4><p>Clic en el mapa para dejar una.</p>' + z.notes.map((n, i) => `<p class="st-dim">${i + 1}. [${n.kind}] ${esc(n.text || '(vacía)')}</p>`).join('');
    } else if (tool === 'npc') {
      if (s && s.type === 'npc') {
        const n = s.ref;
        h = `<h4>NPC <small>(x ${n.x}, y ${n.y})</small></h4>` +
          `<label>Aspecto <select id="st-look">${opt(STUDIO_LOOKS, n.look)}</select></label>` +
          `<label>Nombre <input id="st-name" value="${esc(n.name)}" placeholder="Ej: Marta la panadera"></label>` +
          `<label>Comportamiento <select id="st-beh">${opt(STUDIO_BEHAVIOURS, n.behaviour)}</select></label>` +
          `<div class="st-row"><label>Radio <input type="number" id="st-rad" value="${n.radius || 60}" min="10" max="400"></label><label>Velocidad <input type="number" id="st-spd" value="${n.speed || 26}" min="5" max="140"></label></div>` +
          `<label>Tamaño <input type="range" id="st-size" min="60" max="200" value="${Math.round((n.size || 1) * 100)}"></label>` +
          (n.behaviour === 'patrol' ? `<div class="st-row"><button id="st-pts">${this._patrolFor === n ? '✔ Terminar ruta' : '＋ Marcar puntos de ruta'}</button><button id="st-ptsx">Borrar ruta (${(n.points || []).length})</button></div>` : '') +
          `<label>Lo que dice (una frase por renglón)<textarea id="st-lines" rows="4" placeholder="¡Pan caliente!&#10;Hoy no hay harina…">${esc((n.lines || []).join('\n'))}</textarea></label>` +
          `<label>Pedido para Claude: qué hace o cómo reacciona<textarea id="st-req" rows="4" placeholder="Ej: que venda pociones; que se asuste si saco la espada; que de noche se vaya a su casa">${esc(n.request)}</textarea></label>` +
          '<div class="st-row"><button id="st-nflip">Espejar</button><button id="st-del">Borrar NPC</button></div>';
      } else h = '<h4>NPC</h4>' + `<label>Aspecto del próximo <select id="st-look0">${opt(STUDIO_LOOKS, this.studioLook || 'npc1')}</select></label><p>Clic en el mapa para colocarlo.</p><p class="st-dim">${z.npcs.length} NPC en esta zona.</p>`;
    } else if (tool === 'enemy') {
      h = '<h4>Enemigos</h4>' + `<label>Tipo <select id="st-etype">${opt(ENEMY_TYPES, (s && s.type === 'enemy' ? s.ref.type : this.studioEnemy) || 'skeleton')}</select></label>` +
        (s && s.type === 'enemy' ? `<label>Nota<textarea id="st-enote" rows="3" placeholder="Ej: que aparezca solo de noche">${esc(s.ref.note)}</textarea></label><button id="st-del">Borrar punto</button>` : '<p>Clic en el mapa para marcar dónde aparece.</p>') +
        `<p class="st-dim">${z.enemies.length} punto(s). Aparecen al volver a entrar a la zona (no en la aldea).</p>`;
    } else if (tool === 'add') {
      const pal = this.studioPalette();
      if (!this.studioAddKey || pal.indexOf(this.studioAddKey) < 0) this.studioAddKey = pal[0];
      h = '<h4>Agregar objeto</h4>' + `<label>Objeto <select id="st-akey" size="9">${pal.map(k => `<option value="${esc(k)}"${k === this.studioAddKey ? ' selected' : ''}>${esc(k.replace(/^assets\/.*\//, '').replace(/\.png$/, ''))}</option>`).join('')}</select></label>` +
        (s && s.type === 'added' ? `<label>Tamaño <input type="range" id="st-as" min="40" max="250" value="${Math.round((s.ref.s || 1) * 100)}"></label><div class="st-row"><button id="st-aflip">Espejar</button><button id="st-del">Quitar</button></div>` : '') +
        `<p class="st-dim">${z.added.length} objeto(s) agregados. No traen colisión: dibujala con ▦ si hace falta.</p>`;
    } else if (tool === 'wall') {
      h = '<h4>Colisiones</h4><p><b style="color:#30e060">Verde</b>: paredes tuyas (' + z.solids.length + '). <b style="color:#ffa030">Naranja</b>: originales. <b style="color:#ff3030">Rojo</b>: originales apagadas (' + z.off.length + ').</p>' +
        (s && s.type === 'solid' ? '<button id="st-del">Borrar esta pared</button>' : '') +
        '<p class="st-dim">Si moviste un objeto: apagá su colisión original con un clic y dibujá una nueva donde quedó. En la aldea solo se pueden agregar paredes.</p>';
    } else if (tool === 'trigger') {
      if (s && s.type === 'trigger') {
        const t = s.ref, kinds = { dialog: 'Mostrar un diálogo', title: 'Mostrar un cartel de zona', enemies: 'Hacer aparecer enemigos', heal: 'Curar al héroe', request: 'Otra cosa (pedido para Claude)' };
        h = `<h4>Evento <small>(${t.x}, ${t.y}) ${t.w}×${t.h}</small></h4><label>Al pisar <select id="st-tkind">${opt(kinds, t.kind)}</select></label>` +
          (t.kind === 'enemies' ? `<label>Tipo <select id="st-tenemy">${opt(ENEMY_TYPES, t.enemy || 'skeleton')}</select></label><label>Cantidad <input type="number" id="st-tcount" min="1" max="8" value="${t.count || 2}"></label>` : '') +
          (t.kind === 'dialog' || t.kind === 'title' ? `<label>${t.kind === 'dialog' ? 'Quién habla' : 'Título'} <input id="st-tname" value="${esc(t.name)}"></label>` : '') +
          (t.kind !== 'heal' && t.kind !== 'enemies' ? `<label>${t.kind === 'request' ? 'Qué querés que pase' : 'Texto (un renglón por frase)'}<textarea id="st-ttext" rows="5">${esc(t.text)}</textarea></label>` : '') +
          `<label><input type="checkbox" id="st-tonce" ${t.once ? 'checked' : ''}> Solo la primera vez (por partida)</label><button id="st-del">Borrar evento</button>`;
      } else h = '<h4>Eventos</h4><p>Arrastrá un rectángulo sobre el mapa.</p><p class="st-dim">' + z.triggers.length + ' evento(s) en esta zona.</p>';
    } else h = '<h4>Borrar</h4><p>Clic sobre lo que quieras quitar.</p>';
    el.innerHTML = h;
    const on = (id, ev, fn) => { const e = el.querySelector('#' + id); if (e) e.addEventListener(ev, () => { fn(e); this.studioSave(); this.studioRedraw(); }); };
    el.querySelectorAll('.st-color').forEach(b => { b.onclick = () => { this.studioColor = b.dataset.c; this.studioPanel(); }; });
    on('st-w', 'input', e => { this.studioWidth = +e.value; });
    on('st-clear', 'click', () => { z.strokes.length = 0; this.studioPanel(); });
    if (s && s.type === 'prop') {
      const m = z.moves[s.ref._sid] = z.moves[s.ref._sid] || {};
      on('st-s', 'input', e => { m.s = e.value / 100; el.querySelector('#st-sv').textContent = e.value + '%'; this.studioApplyMoves(); });
      on('st-flip', 'click', () => { m.flip = !m.flip; this.studioApplyMoves(); });
      on('st-hide', 'click', () => { m.hidden = !m.hidden; this.studioApplyMoves(); this.studioPanel(); });
      on('st-reset', 'click', () => { delete z.moves[s.ref._sid]; this.studioApplyMoves(); this.studioPanel(); });
      on('st-note', 'input', e => { m.note = e.value; });
    }
    if (s && s.type === 'note') {
      on('st-kind', 'change', e => { s.ref.kind = this.studioNoteKind = e.value; });
      on('st-text', 'input', e => { s.ref.text = e.value; });
      on('st-del', 'click', () => { z.notes.splice(z.notes.indexOf(s.ref), 1); this.studioSel = null; this.studioPanel(); });
      if (focus) { const t = el.querySelector('#st-text'); if (t) setTimeout(() => t.focus(), 160); }
    }
    if (s && s.type === 'npc') {
      const n = s.ref, respawn = () => { this.studioSpawnNPCs(); };
      on('st-look', 'change', e => { n.look = this.studioLook = e.value; respawn(); });
      on('st-name', 'input', e => { n.name = e.value; });
      on('st-name', 'change', respawn);
      on('st-beh', 'change', e => { n.behaviour = e.value; this._patrolFor = null; this.studioPanel(); });
      on('st-rad', 'input', e => { n.radius = +e.value || 60; });
      on('st-spd', 'input', e => { n.speed = +e.value || 26; });
      on('st-size', 'input', e => { n.size = e.value / 100; respawn(); });
      on('st-pts', 'click', () => { this._patrolFor = this._patrolFor === n ? null : n; this.studioPanel(); });
      on('st-ptsx', 'click', () => { n.points = []; this.studioPanel(); });
      on('st-lines', 'input', e => { n.lines = e.value.split('\n').map(v => v.trim()).filter(Boolean); });
      on('st-req', 'input', e => { n.request = e.value; });
      on('st-nflip', 'click', () => { n.flip = !n.flip; respawn(); });
      on('st-del', 'click', () => { z.npcs.splice(z.npcs.indexOf(n), 1); this.studioSel = null; respawn(); this.studioPanel(); });
    }
    on('st-look0', 'change', e => { this.studioLook = e.value; });
    on('st-akey', 'change', e => { this.studioAddKey = e.value; });
    if (s && s.type === 'added') {
      on('st-as', 'input', e => { s.ref.s = e.value / 100; this.studioApplyAdded(); });
      on('st-aflip', 'click', () => { s.ref.flip = !s.ref.flip; this.studioApplyAdded(); });
      on('st-del', 'click', () => { z.added.splice(z.added.indexOf(s.ref), 1); this.studioSel = null; this.studioApplyAdded(); this.studioPanel(); });
    }
    if (s && s.type === 'solid') on('st-del', 'click', () => { z.solids.splice(z.solids.indexOf(s.ref), 1); this.studioSel = null; this.studioApplySolids(); this.studioPanel(); });
    if (s && s.type === 'trigger') {
      const t = s.ref;
      on('st-tkind', 'change', e => { t.kind = e.value; this.studioPanel(); });
      on('st-tenemy', 'change', e => { t.enemy = e.value; });
      on('st-tcount', 'input', e => { t.count = +e.value || 2; });
      on('st-tname', 'input', e => { t.name = e.value; });
      on('st-ttext', 'input', e => { t.text = e.value; });
      on('st-tonce', 'change', e => { t.once = e.checked; });
      on('st-del', 'click', () => { z.triggers.splice(z.triggers.indexOf(t), 1); this.studioSel = null; this.studioPanel(); });
    }
    on('st-etype', 'change', e => { this.studioEnemy = e.value; if (s && s.type === 'enemy') s.ref.type = e.value; });
    if (s && s.type === 'enemy') {
      on('st-enote', 'input', e => { s.ref.note = e.value; });
      on('st-del', 'click', () => { z.enemies.splice(z.enemies.indexOf(s.ref), 1); this.studioSel = null; this.studioPanel(); });
    }
  },

  /** Arrow keys nudge the selected prop; called every frame while the Studio is open. */
  updateStudio() {
    const s = this.studioSel, c = this.cursors;
    if (!s || s.type !== 'prop' || !c || !this.input.keyboard.enabled) return;
    const J = Phaser.Input.Keyboard.JustDown;
    const dx = (J(c.right) ? 1 : 0) - (J(c.left) ? 1 : 0), dy = (J(c.down) ? 1 : 0) - (J(c.up) ? 1 : 0);
    if (!dx && !dy) return;
    const z = this.studioZone(), m = z.moves[s.ref._sid] = z.moves[s.ref._sid] || {};
    m.dx = (m.dx || 0) + dx; m.dy = (m.dy || 0) + dy;
    this.studioApplyMoves(); this.studioSave(); this.studioRedraw();
  },

  // ------------------------------------------------------------------ getting the work out
  studioDownload(name, href) {
    const a = document.createElement('a');
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  },
  studioScreenshot() {
    this.game.renderer.snapshot(img => this.studioDownload('estudio_' + this.currentZoneKey().replace('.', '_') + '_' + Date.now() + '.png', img.src));
  },
  /** Downloads studio_data.js: the same data the game loads, plus a readable summary on top for Claude. */
  studioExport() {
    this.studioSave();
    const d = this.studioLoad(), lines = [];
    Object.keys(d.zones).forEach(k => {
      const z = d.zones[k];
      const moves = Object.keys(z.moves || {}).filter(id => { const m = z.moves[id]; return m.dx || m.dy || m.hidden || m.flip || m.note || (m.s && m.s !== 1); });
      if (!moves.length && !['notes', 'npcs', 'enemies', 'strokes', 'added', 'solids', 'off', 'triggers'].some(k => (z[k] || []).length)) return;
      lines.push('ZONA ' + k);
      moves.forEach(id => { const m = z.moves[id]; lines.push(`  objeto ${id}: mover (${m.dx || 0}, ${m.dy || 0})` + (m.s && m.s !== 1 ? ` tamaño ${Math.round(m.s * 100)}%` : '') + (m.flip ? ' espejado' : '') + (m.hidden ? ' OCULTO' : '') + (m.note ? ` — NOTA: ${m.note}` : '')); });
      (z.notes || []).forEach((n, i) => lines.push(`  nota ${i + 1} [${n.kind}] en (${n.x}, ${n.y}): ${n.text}`));
      (z.npcs || []).forEach(n => lines.push(`  npc "${n.name || 'sin nombre'}" (${n.look}) en (${n.x}, ${n.y}), ${STUDIO_BEHAVIOURS[n.behaviour] || n.behaviour}` + (n.lines && n.lines.length ? `, dice: ${n.lines.join(' / ')}` : '') + (n.request ? ` — PEDIDO: ${n.request}` : '')));
      (z.enemies || []).forEach(e => lines.push(`  enemigo ${e.type} en (${e.x}, ${e.y})` + (e.note ? ` — NOTA: ${e.note}` : '')));
      (z.added || []).forEach(a => lines.push(`  objeto agregado ${a.key} en (${a.x}, ${a.y})` + (a.s && a.s !== 1 ? ` tamaño ${Math.round(a.s * 100)}%` : '')));
      (z.solids || []).forEach(r => lines.push(`  pared nueva (${r.x}, ${r.y}) ${r.w}x${r.h}`));
      (z.off || []).forEach(k => lines.push(`  colisión original apagada: ${k}`));
      (z.triggers || []).forEach(t => lines.push(`  evento ${t.kind} en (${t.x}, ${t.y}) ${t.w}x${t.h}` + (t.kind === 'enemies' ? `: ${t.count || 2} x ${t.enemy || 'skeleton'}` : '') + (t.name ? ` [${t.name}]` : '') + (t.text ? `: ${String(t.text).replace(/\n/g, ' / ')}` : '')));
      if ((z.strokes || []).length) lines.push(`  ${z.strokes.length} trazo(s) dibujados (ver captura o los puntos en los datos)`);
    });
    const js = '/* Exported from the dev Studio on ' + new Date().toISOString() + '. Put this file in js/maps/data/ (replace the old one).\n\nRESUMEN\n' +
      lines.join('\n').replace(/\*\//g, '* /') + '\n*/\nwindow.STUDIO_DATA = ' + JSON.stringify(d) + ';\n';
    this.studioDownload('studio_data.js', 'data:text/javascript;charset=utf-8,' + encodeURIComponent(js));
    const help = document.getElementById('st-help');
    if (help) help.textContent = 'Descargado studio_data.js: copialo a D:\\prueba\\js\\maps\\data\\ (reemplazando el que hay) y avisale a Claude.';
  }
});

// F2 / MODO DEV: in the campaign it opens the Studio; in practice it keeps opening the old arena editor.
(function () {
  const oldToggle = MainGameScene.prototype.toggleDevMode;
  MainGameScene.prototype.toggleDevMode = function () {
    if (this._gameMode === 'campaign' && this.gameStarted) { this.toggleStudio(); return; }
    return oldToggle.apply(this, arguments);
  };
})();
