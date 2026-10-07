'use strict';
/* Villagers: animations, spawning and their daily behaviour. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Registers animations for all 4 NPC Villagers.
   * Spritesheets: 32x32 frames, 6 columns, frames run LEFT-TO-RIGHT (characters face right).
   * FIX: frames used to be listed right-to-left, which played every cycle backwards
   * (moonwalking villagers, death animation standing back up).
   * npc1, npc3, npc4 (5 rows): idle 0-3, walk 6-11, jump 12-14, hurt 18-20, death 24-27
   * npc2 (6 rows): idle 0-3, walk 6-11, jump 12-14, action 18-23, hurt 24-26, death 30-33
   */
  registerNPCAnimations() {
    const base = { idle: [0, 1, 2, 3], walk: [6, 7, 8, 9, 10, 11], jump: [12, 13, 14] };
    const fiveRows = { hurt: [18, 19, 20], damage: [24, 25, 26, 27] };
    const npcDefs = [
      { id: 'npc1', texture: 'npc1_villager', ...base, ...fiveRows },
      { id: 'npc2', texture: 'npc2_villager', ...base, action: [18, 19, 20, 21, 22, 23], hurt: [24, 25, 26], damage: [30, 31, 32, 33] },
      { id: 'npc3', texture: 'npc3_villager', ...base, ...fiveRows },
      { id: 'npc4', texture: 'npc4_villager', ...base, ...fiveRows }
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
  
    // KingPrueba uses two separate sheets (idle: 6 frames, walk: 8 frames)
    [['kingprueba_idle', 'king_idle', 6, 7], ['kingprueba_walk', 'king_walk', 8, 10],
     ['cow_idle', 'int_cow_idle', 5, 5], ['cow_walk', 'int_cow_walk', 8, 8]].forEach(([key, tex, count, rate]) => {
      if (!this.textures.exists(tex)) return;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(tex, { start: 0, end: count - 1 }),
        frameRate: rate,
        repeat: -1
      });
    });
  },

  // Backward-compatibility alias
  registerNPC1Animations() {
    this.registerNPCAnimations();
  },

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
    if (this.npcColliders) {
      this.npcColliders.forEach(c => { try { c.destroy(); } catch (e) { } });
    }
    this.npcColliders = [];

    // NPC configs: exactly 4 NPCs in the requested order & quantity
    // Patrol routes were validated against the map colliders: every leg is a straight
    // walkable line (the old routes crossed a house roof, the cliff edge and the campfire).
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
          { x: 305, y: 509 },
          { x: 356, y: 509 },
          { x: 332, y: 518 },
          { x: 305, y: 539 }
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
          { x: 528, y: 272 },
          { x: 484, y: 289 },
          { x: 411, y: 250 },
          { x: 449, y: 233 }
        ],
        scale: 1.3,
        startWaypoint: 0,
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
          { x: 70, y: 356 },
          { x: 140, y: 346 },
          { x: 215, y: 338 },
          { x: 140, y: 354 }
        ],
        scale: 1.3,
        startWaypoint: 0,
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
          { x: 425, y: 215 },
          { x: 336, y: 250 },
          { x: 293, y: 220 },
          { x: 388, y: 194 }
        ],
        scale: 1.3,
        startWaypoint: 0,
        idleChance: 0.35,
        speed: 26
      }
      // (KingPrueba no longer walks in the village: he holds court in the castle's throne room)
    ];

    this.campaignNPCs = npcConfigs.map((cfg, idx) => {
      const startPt = cfg.waypoints[cfg.startWaypoint];
      // Skip NPCs whose own art failed to load instead of showing them with the wrong sprite
      if (cfg.body && !this.textures.exists(cfg.texture)) {
        console.warn('[NPC] Falta la textura de ' + cfg.name + ' (' + cfg.texture + ')');
        return null;
      }
      const texKey = this.textures.exists(cfg.texture) ? cfg.texture : 'npc1_villager';
      const sprite = this.add.sprite(startPt.x, startPt.y, texKey)
        .setOrigin(cfg.originX === undefined ? 0.5 : cfg.originX, cfg.originY === undefined ? 1 : cfg.originY)
        .setScale(cfg.scale)
        .setDepth(startPt.y);

      // Start idle animation for this specific NPC
      const idleKey = `${cfg.id}_idle`;
      if (this.anims.exists(idleKey)) {
        sprite.play(idleKey);
      } else if (this.anims.exists('npc1_idle')) {
        sprite.play('npc1_idle');
      }

      // Solid feet hitbox so the player can no longer walk through villagers.
      // The NPC is moved by hand (not by velocity), so the body is immovable and only follows the sprite.
      this.physics.add.existing(sprite);
      if (cfg.body) {
        sprite.body.setSize(cfg.body.w, cfg.body.h);
        sprite.body.setOffset(cfg.body.offX, cfg.body.offY);
      } else {
        sprite.body.setSize(12, 6);
        sprite.body.setOffset(10, 25);
      }

      // Optional name tag that follows the NPC
      let nameTag = null;
      if (cfg.showName) {
        nameTag = this.add.text(startPt.x, startPt.y - 30, cfg.name, {
          fontFamily: 'Pixuf, MedievalSharp, monospace',
          fontSize: '10px',
          fill: '#fde68a',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5, 1).setDepth(29000);
        sprite.once('destroy', () => { if (nameTag) nameTag.destroy(); });
      }
      sprite.body.setImmovable(true);
      sprite.body.moves = false;
      if (this.player) {
        this.npcColliders.push(this.physics.add.collider(this.player, sprite));
      }

      const npc = {
        id: cfg.id,
        nameTag,
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
    }).filter(Boolean);

    console.log(`[NPC] Spawned ${this.campaignNPCs.length} unique NPCs in campaign lobby.`);
  },

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
      if (npc.nameTag) npc.nameTag.setPosition(Math.round(sprite.x), Math.round(sprite.y) - 28);

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
          // If the player is standing in the way, wait instead of pushing through them
          let blocked = false;
          if (this.player && this.player.active && this.player.body) {
            const pdx = this.player.body.center.x - sprite.x;
            const pdy = this.player.body.center.y - (sprite.y - 4);
            const pd = Math.sqrt(pdx * pdx + pdy * pdy);
            blocked = pd < 20 && (pdx * dx + pdy * dy) > 0;
          }

          const idleKey = `${npc.id}_idle`;
          const walkKey = `${npc.id}_walk`;
          if (blocked) {
            if (this.anims.exists(idleKey)) sprite.play(idleKey, true);
          } else {
            if (this.anims.exists(walkKey)) sprite.play(walkKey, true);
            const speed = npc.speed;
            const vx = (dx / dist) * speed;
            const vy = (dy / dist) * speed;
            sprite.x += vx * (dt / 1000);
            sprite.y += vy * (dt / 1000);

            // Sheets face right: flip only when walking left
            sprite.setFlipX(dx < 0);
          }
        }
      }
    });
  }
});
