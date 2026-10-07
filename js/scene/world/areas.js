'use strict';
/* Areas engine: house doors, entering/leaving buildings and maps (castle, ruins), building an area from its layout and updating it (exits, portals, drawbridge, doors, actors). (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Render animated house doors on the 4 village houses.
   * Doors start CLOSED (frame 0). checkDoorProximity() opens/closes them as the
   * player approaches and sends the player indoors when they walk into an open door.
   *
   * Positions were measured by matching the closed-door frame against each house PNG
   * (all four houses use the 16x26 "normal" door; the 16x20 sheet does not fit any of them):
   *   House_Hay_1        door at img x=35..51, bottom img y=102 -> world center x=553, bottom y=200
   *   House_Hay_2        door at img x=104..120, bottom img y=111 -> world center x=454, bottom y=425
   *   House_Hay_3        door at img x=124..140, bottom img y=127 -> world center x=377, bottom y=153
   *   House_Hay_4_Purple door at img x=88..104, bottom img y=127 -> world center x=152, bottom y=329
   * World positions are derived from the house objects in the map, so they stay correct
   * if a house is moved in Tiled.
   */
  renderAnimatedDoors() {
    // doorX / doorBottom are in native image pixels of each house texture
    const HOUSE_DOORS = {
      House_Hay_1: { doorX: 43, doorBottom: 102, depth: 169, fallback: { x: 553, y: 200 } },
      House_Hay_2: { doorX: 112, doorBottom: 111, depth: 365, fallback: { x: 454, y: 425 } },
      House_Hay_3: { doorX: 132, doorBottom: 127, depth: 76, fallback: { x: 377, y: 153 } },
      House_Hay_4_Purple: { doorX: 96, doorBottom: 127, depth: 289, fallback: { x: 152, y: 329 } }
    };

    // Locate each house object in the map (origin bottom-left, drawn at native size)
    const found = {};
    const mapData = this.getMapData();
    const objLayer = mapData && mapData.layers ? mapData.layers.find(l => l.name === 'Object Layer 1') : null;
    if (objLayer && objLayer.objects) {
      objLayer.objects.forEach(obj => {
        const key = this.getTextureKeyForGid(obj.gid, mapData);
        if (!key) return;
        const name = key.split('/').pop().replace(/\.[^/.]+$/, '');
        if (HOUSE_DOORS[name] && !found[name]) {
          const tex = this.textures.exists(key) ? this.textures.get(key).getSourceImage() : null;
          const h = tex && tex.height ? tex.height : (MAP_ASSET_METADATA[name] ? MAP_ASSET_METADATA[name].h : obj.height);
          found[name] = { left: obj.x, top: obj.y - h };
        }
      });
    }

    // Each house has its own interior (see HOUSE_INTERIORS)

    this.doorSprites = [];
    const sheet = 'door_normal_anim';
    if (!this.textures.exists(sheet)) return;

    Object.keys(HOUSE_DOORS).forEach((name, idx) => {
      const def = HOUSE_DOORS[name];
      const pos = found[name]
        ? { x: Math.round(found[name].left + def.doorX), y: Math.round(found[name].top + def.doorBottom) }
        : def.fallback;

      const doorSprite = this.add.sprite(pos.x, pos.y, sheet)
        .setOrigin(0.5, 1)
        .setDepth(def.depth);

      doorSprite.setFrame(0);
      doorSprite._doorName = 'door_normal';
      doorSprite._doorOpen = false;
      doorSprite._triggerR = 36;
      doorSprite._houseName = name;
      doorSprite._interiorKind = HOUSE_INTERIORS[name] || 'casa';
      doorSprite._interiorIndex = idx;
      doorSprite._hintAt = 0;

      this.doorSprites.push(doorSprite);
      if (this.campaignObjectSprites) this.campaignObjectSprites.push(doorSprite);
    });
  },

  /**
   * Called every frame from update().
   * - Opens a door when the player is close, closes it when they walk away
   *   (one-shot animations: no yoyo, no restart every frame).
   * - Sends the player indoors when they push UP against an open door.
   * - While indoors, watches the exit mat instead.
   */
  checkDoorProximity() {
    if (!this.player || !this.player.body) return;
    if (this._doorTransition) return;

    const up = (this.keyMoveUp && this.keyMoveUp.isDown) || (this.cursors && this.cursors.up.isDown);
    const down = (this.keyMoveDown && this.keyMoveDown.isDown) || (this.cursors && this.cursors.down.isDown);
    const body = this.player.body;

    if (this.currentInterior) {
      this.updateInterior(up, down);
      return;
    }

    if (this._gameMode === 'campaign') {
      // North-west terrace: the old path that leaves towards the ruined village
      const N = RUINS_ROAD_EXIT;
      if (body.center.x >= N.x0 && body.center.x <= N.x1 && body.bottom <= N.hintY) {
        if (up && body.bottom <= N.y) { this.enterRuins(); return; }
        if (this.time.now - (this._ruinsHintAt || 0) > 4000) {
          this._ruinsHintAt = this.time.now;
          this.createFloatingText(body.center.x, body.top - 34, '▲ Sendero a las ruinas', 0xfde68a);
        }
      }
      // South road of the village: walking off the map leads to the castle road
      const E = CASTLE_ROAD_EXIT;
      if (body.center.x >= E.x0 && body.center.x <= E.x1 && body.bottom >= this.mapHeight - E.depth) {
        if (down && body.bottom >= this.mapHeight - 3) { this.enterCastle(); return; }
        if (this.time.now - (this._castleHintAt || 0) > 4000) {
          this._castleHintAt = this.time.now;
          this.createFloatingText(body.center.x, body.top - 34, '▼ Camino al castillo', 0xfde68a);
        }
      }
    }
    if (!this.doorSprites || this._gameMode !== 'campaign') return;

    // Distance is measured from the player's FEET, not from the sprite center
    const fx = body.center.x;
    const fy = body.center.y;

    this.doorSprites.forEach(door => {
      if (!door.active) return;
      const dist = Phaser.Math.Distance.Between(fx, fy, door.x, door.y);
      const openKey = `${door._doorName}_open`;
      const closeKey = `${door._doorName}_close`;

      if (dist <= door._triggerR) {
        if (!door._doorOpen) {
          door._doorOpen = true;
          if (this.anims.exists(openKey)) door.play(openKey);
          else door.setFrame(3);
        }

        // In the doorway (feet right below the door) and pushing up -> go inside
        const inDoorway = Math.abs(fx - door.x) <= 10 && body.top >= door.y - 4 && body.top <= door.y + 12;
        if (inDoorway) {
          if (up) {
            this.enterInterior(door);
          } else if (this.time.now - door._hintAt > 4000) {
            door._hintAt = this.time.now;
            this.createFloatingText(door.x, door.y - 34, '▲ Entrar', 0xfde68a);
          }
        }
      } else if (door._doorOpen) {
        door._doorOpen = false;
        if (this.anims.exists(closeKey)) door.play(closeKey);
        else door.setFrame(0);
      }
    });
  },

  /**
   * Fade out, build (or reuse) the interior that belongs to this door, move the
   * player inside and fade back in. Interiors live far outside the village map
   * (x >= 3000) so nothing from the village has to be hidden or rebuilt.
   */
  enterInterior(door) {
    if (this._doorTransition || this.currentInterior || !door) return;
    this._interiorReturn = { x: door.x, y: door.y + 10, zoom: this.cameras.main.zoom };
    this.fadeTransition(() => {
      const building = this.buildInterior(door);
      const area = building.areas[building.start];
      this.currentInterior = { building, areaName: building.start, area };
      this.showInteriorArea(area, area.spawn);
      if (area.outdoor) this.createFloatingText(area.spawn.x, area.spawn.y - 40, area.title || building.title, 0xfde68a);
      else this.createFloatingText(area.x + area.w / 2, area.y + 30, building.title, 0xfde68a);
    });
  },

  /**
   * Leave the village by its south road and arrive on the castle road.
   * The castle is built like a house interior with several areas (some of them open-air).
   */
  enterCastle() {
    if (this._doorTransition || this.currentInterior) return;
    const body = this.player.body;
    this._interiorReturn = { x: body.center.x, y: this.mapHeight - 30, zoom: this.cameras.main.zoom };
    this.fadeTransition(() => {
      const building = this.buildInterior({ _houseName: 'Castle', _interiorIndex: 5, _interiorKind: 'castle' });
      const area = building.areas[building.start];
      this.currentInterior = { building, areaName: building.start, area };
      this.showInteriorArea(area, area.spawn);
      this.createFloatingText(area.spawn.x, area.spawn.y - 40, area.title || building.title, 0xfde68a);
    });
  },

  /** Leave the village by the old north-west path and arrive at the south gate of the ruined village. */
  enterRuins() {
    if (this._doorTransition || this.currentInterior) return;
    const body = this.player.body;
    this._interiorReturn = { x: body.center.x, y: RUINS_ROAD_EXIT.y + 12, zoom: this.cameras.main.zoom };
    this.fadeTransition(() => {
      const building = this.buildInterior({ _houseName: 'Ruins', _interiorIndex: 7, _interiorKind: 'ruins' });
      const area = building.areas[building.start];
      this.currentInterior = { building, areaName: building.start, area };
      this.showInteriorArea(area, area.spawn);
      this.createFloatingText(area.spawn.x, area.spawn.y - 40, area.title || building.title, 0xcfd8e6);
    });
  },

  /**
   * Move between two areas of the same building (stairs).
   */
  switchInteriorArea(areaName, arrive) {
    const cur = this.currentInterior;
    if (this._doorTransition || !cur || !cur.building.areas[areaName]) return;
    this.fadeTransition(() => {
      const area = cur.building.areas[areaName];
      cur.areaName = areaName;
      this._areaSwitchHold = true;
      cur.area = area;
      const at = arrive ? { x: area.x + arrive.x, y: area.y + arrive.y } : area.spawn;
      this.showInteriorArea(area, at);
      if (area.title) this.createFloatingText(at.x, at.y - 46, area.title, 0xfde68a);
    });
  },

  /**
   * Fade out, put the player back in front of the door they used and fade in.
   */
  exitInterior() {
    if (this._doorTransition || !this.currentInterior) return;
    this.fadeTransition(() => {
      const cam = this.cameras.main;
      const ret = this._interiorReturn || { x: 250, y: 340, zoom: 1.5 };
      this.setInteriorVisible(null);
      this.currentInterior = null;
      ambience.set([]);
      this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
      this.setPlayerIndoorScale(false);
      this.placePlayerFeetAt(ret.x, ret.y);
      cam.setBounds(0, 0, this.mapWidth, this.mapHeight);
      cam.setZoom(ret.zoom || 1.5);
      cam.startFollow(this.player, true, 0.09, 0.09);
      cam.centerOn(this.player.x, this.player.y);
    });
  },

  /**
   * Shared fade-out -> action -> fade-in used by every door and staircase.
   * The player is frozen (this._doorTransition) until the fade-in ends.
   */
  fadeTransition(action) {
    this._doorTransition = true;
    this.player.setVelocity(0, 0);
    const cam = this.cameras.main;
    cam.fadeOut(240, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      try {
        action();
      } catch (err) {
        console.error('[Interior] Error en la transición:', err);
      }
      cam.fadeIn(240, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this._doorTransition = false; });
      // Safety net: never leave the player frozen if the fade event is missed
      this.time.delayedCall(700, () => { this._doorTransition = false; });
    });
  },

  /**
   * Point the camera and the physics world at one interior area and drop the player in it.
   */
  showInteriorArea(area, at) {
    const cam = this.cameras.main;
    ambience.set(area.ambient || []);
    this.setInteriorVisible(area);
    this.physics.world.setBounds(area.x, area.y, area.w, area.h);
    if (area.outdoor) {
      // open-air area: the camera follows the hero inside the map, like in the village
      cam.setBounds(area.x, area.y, area.w, area.h);
      // never show the void around a map: zoom in a little if the map is smaller than the view
      const baseZoom = (this._interiorReturn && this._interiorReturn.zoom) || 1.5;
      cam.setZoom(Math.max(baseZoom, cam.width / area.w, cam.height / area.h));
      this.setPlayerIndoorScale(false);
      this.placePlayerFeetAt(at.x, at.y);
      cam.startFollow(this.player, true, 0.09, 0.09);
      cam.centerOn(this.player.x, this.player.y);
      return;
    }
    if (area.scroll) {
      // long hall: closer camera that follows the hero from the door up to the far end
      const z = 2, vw = cam.width / z, vh = cam.height / z;
      const bw = Math.max(area.w, vw), bh = Math.max(area.h, vh);
      cam.setZoom(z);
      cam.setBounds(area.x - (bw - area.w) / 2, area.y - (bh - area.h) / 2, bw, bh);
      this.setPlayerIndoorScale(true);
      this.placePlayerFeetAt(at.x, at.y);
      cam.startFollow(this.player, true, 0.1, 0.1);
      cam.centerOn(this.player.x, this.player.y);
      return;
    }
    cam.stopFollow();
    cam.removeBounds();
    // Fit the whole room on screen (bigger rooms zoom out a little)
    const zoom = Math.min(cam.width / (area.w + 56), cam.height / (area.h + 56));
    cam.setZoom(Phaser.Math.Clamp(Math.floor(zoom * 10) / 10, 1.4, 2.6));
    cam.centerOn(area.x + area.w / 2, area.y + area.h / 2);
    this.setPlayerIndoorScale(true);
    this.placePlayerFeetAt(at.x, at.y);
  },

  /**
   * Move the player so that the CENTER-TOP of the feet hitbox lands on (x, y).
   */
  /**
   * Indoors the hero is drawn bigger so it matches the furniture; the feet hitbox
   * keeps the same real size (about 19x10 px) so doorways still fit.
   */
  setPlayerIndoorScale(indoors) {
    const p = this.player;
    if (!p || !p.body) return;
    const OUT = 1.2, IN = 1.75;
    if (indoors) {
      const k = OUT / IN, w = 16 * k, h = 8 * k;
      p.setScale(IN);
      p.body.setSize(w, h);
      p.body.setOffset(50 - w / 2, 60 - h);
    } else {
      p.setScale(OUT);
      p.body.setSize(16, 8);
      p.body.setOffset(42, 52);
    }
  },

  placePlayerFeetAt(x, y) {
    const p = this.player;
    const b = p.body;
    // Offset between sprite position and the top-center of its physics body
    const dx = (b.x + b.width / 2) - p.x;
    const dy = b.y - p.y;
    p.setPosition(x - dx, y - dy);
    p.setVelocity(0, 0);
    if (b.reset) b.reset(x - dx, y - dy);
  },

  /**
   * Only the area the hero is in gets drawn: the other rooms of the building (and their lights,
   * particles and people) stay built but hidden, so a big castle costs the same as one room.
   */
  setInteriorVisible(area) {
    const cur = this.currentInterior;
    if (!cur || !cur.building) return;
    Object.keys(cur.building.areas).forEach(k => {
      const a = cur.building.areas[k], on = a === area;
      if (a._shown === on) return;
      a._shown = on;
      (a.objs || []).forEach(o => { if (o && o.setVisible) o.setVisible(on); });
    });
  },

  /**
   * Build every area of the interior behind a door the first time it is used;
   * later visits reuse it.
   */
  buildInterior(door) {
    this.interiors = this.interiors || {};
    const id = door._houseName || ('door_' + door._interiorIndex);
    if (this.interiors[id]) return this.interiors[id];

    const layout = buildInteriorLayout(door._interiorKind);
    const objects = [];
    const areas = {};

    if (!this.interiorObstacles) {
      this.interiorObstacles = this.physics.add.staticGroup();
      this._interiorCollider = this.physics.add.collider(this.player, this.interiorObstacles);
    }

    Object.keys(layout.areas).forEach((name, areaIdx) => {
      const la = layout.areas[name];
      const firstObj = objects.length;            // everything pushed from here on belongs to this area
      const ox = 3000 + (door._interiorIndex || 0) * 1400;
      const oy = 3000 + areaIdx * 900;

      // Black surround so nothing else is ever visible around the room
      objects.push(this.add.rectangle(ox + la.w / 2, oy + la.h / 2, 1300, 860, 0x0b0a10).setDepth(6.5));

      const side = la.side || 10, wallH = la.wallH || 56, trim = la.trim === undefined ? 0x3a2414 : la.trim;
      if (la.groundKey) {
        // Outdoor area: one painted ground image instead of floor / wall / frame
        if (this.textures.exists(la.groundKey)) objects.push(this.add.image(ox, oy, la.groundKey).setOrigin(0, 0).setDepth(7));
        else objects.push(this.add.rectangle(ox, oy, la.w, la.h, 0x6fae5a).setOrigin(0, 0).setDepth(7));
      } else {
        // Materials: tiled floor, tiled back wall, then a wooden frame around the room
        if (la.floorTex && this.textures.exists(la.floorTex)) {
          objects.push(this.add.tileSprite(ox, oy + wallH, la.w, la.h - wallH, la.floorTex).setOrigin(0, 0).setDepth(7));
        } else {
          objects.push(this.add.rectangle(ox, oy + wallH, la.w, la.h - wallH, 0xb8884f).setOrigin(0, 0).setDepth(7));
        }
        if (la.wallTex && this.textures.exists(la.wallTex)) {
          objects.push(this.add.tileSprite(ox, oy, la.w, wallH, la.wallTex).setOrigin(0, 0).setDepth(7.1));
        } else {
          objects.push(this.add.rectangle(ox, oy, la.w, wallH, 0xd8c8a0).setOrigin(0, 0).setDepth(7.1));
        }
        if (la.sideFace && this.textures.exists('cs_wall_side_l')) {
          // side walls drawn the way a top-down room shows them: the face leans away, courses run along the wall
          const fh = la.h - wallH - side;
          objects.push(this.add.tileSprite(ox + side, oy + wallH, la.sideFace, fh, 'cs_wall_side_l').setOrigin(0, 0).setDepth(7.12));
          objects.push(this.add.tileSprite(ox + la.w - side - la.sideFace, oy + wallH, la.sideFace, fh, 'cs_wall_side_r').setOrigin(0, 0).setDepth(7.12));
        }

        const gfx = this.add.graphics().setDepth(7.2);
        la.rects.forEach(r => {
          gfx.fillStyle(r.color, r.alpha === undefined ? 1 : r.alpha);
          gfx.fillRect(ox + r.x, oy + r.y, r.w, r.h);
        });
        gfx.fillStyle(trim, 1);
        gfx.fillRect(ox, oy, side, la.h);
        gfx.fillRect(ox + la.w - side, oy, side, la.h);
        gfx.fillRect(ox, oy, la.w, 4);
        if (la.frontDoor) {
          gfx.fillRect(ox, oy + la.h - side, la.frontDoor.x, side);
          gfx.fillRect(ox + la.frontDoor.x + la.frontDoor.w, oy + la.h - side, la.w - la.frontDoor.x - la.frontDoor.w, side);
          gfx.fillStyle(la.mat === undefined ? 0xc9a15a : la.mat, 1); // door mat
          gfx.fillRect(ox + la.frontDoor.x + 2, oy + la.h - side - 8, la.frontDoor.w - 4, 8);
        } else {
          gfx.fillRect(ox, oy + la.h - side, la.w, side);
        }
        const sf = la.sideFace || 0;
        gfx.fillStyle(0x000000, 0.25);
        gfx.fillRect(ox + side + sf, oy + wallH, 3, la.h - wallH - side);
        gfx.fillRect(ox + la.w - side - sf - 3, oy + wallH, 3, la.h - wallH - side);
        if (sf) {                                                // corner shade where the side faces meet the back wall
          gfx.fillStyle(0x000000, 0.22);
          gfx.fillRect(ox + side, oy + wallH, sf, 6);
          gfx.fillRect(ox + la.w - side - sf, oy + wallH, sf, 6);
        }
        if (la.trimHi !== undefined) {
          // stone frame: a lit inner edge so the walls read as thick masonry seen from above
          gfx.fillStyle(la.trimHi, 1);
          gfx.fillRect(ox + side - 2, oy + 4, 2, la.h - side - 2);
          gfx.fillRect(ox + la.w - side, oy + 4, 2, la.h - side - 2);
          if (la.frontDoor) {
            gfx.fillRect(ox + side - 2, oy + la.h - side, la.frontDoor.x - side + 2, 2);
            gfx.fillRect(ox + la.frontDoor.x + la.frontDoor.w, oy + la.h - side, la.w - side - la.frontDoor.x - la.frontDoor.w + 2, 2);
          }
          gfx.fillStyle(0x000000, 0.16);                       // shade along the front wall
          gfx.fillRect(ox + side, oy + la.h - side - 5, la.w - side * 2, 5);
        }
        objects.push(gfx);
      }

      // Daylight shafts from the windows, contact shadows, pools of firelight
      this.ensureFxTextures();
      if ((la.polys || []).length) {
        const pg = this.add.graphics().setDepth(7.24).setBlendMode(Phaser.BlendModes.ADD);
        la.polys.forEach(p => {
          pg.fillStyle(p.color, p.alpha);
          const pts = [];
          for (let i = 0; i < p.pts.length; i += 2) pts.push({ x: ox + p.pts[i], y: oy + p.pts[i + 1] });
          pg.fillPoints(pts, true);
        });
        objects.push(pg);
      }
      const shadowGfx = this.add.graphics().setDepth(7.28);
      shadowGfx.fillStyle(0x0c0a14, la.outdoor ? 0.26 : 0.22);
      objects.push(shadowGfx);
      (la.lights || []).forEach(l => {
        const im = this.add.image(ox + l.x, oy + l.y, 'fx_glow').setBlendMode(Phaser.BlendModes.ADD).setTint(l.color).setAlpha(l.alpha);
        im.setDisplaySize(l.r * 2, l.halo ? l.r * 2 : l.r * 1.25);
        im.setDepth(l.halo ? oy + la.h + 50 : 7.26);
        this.tweens.add({ targets: im, alpha: l.alpha * 0.66, duration: Phaser.Math.Between(170, 420), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 300) });
        objects.push(im);
      });
      if (la.vignette) {
        objects.push(this.add.image(ox + la.w / 2, oy + la.h / 2, 'fx_vignette').setDisplaySize(la.w, la.h).setDepth(oy + la.h + 40));
      }
      if (la.grade !== undefined && la.grade !== 0xffffff) {
        // colour grade of the open-air areas (firelight halos are drawn above it, so they stay bright)
        objects.push(this.add.rectangle(ox, oy, la.w, la.h, la.grade).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(oy + la.h + 35));
      }
      this.addAreaEffects(objects, la, ox, oy);

      // Furniture: depth-sorted by the y of its base, like everything else in the game.
      // Rugs (floor: true) lie flat under everything.
      la.items.forEach(item => {
        const depth = item.floor ? 7.3 : oy + item.baseY;
        if (item.wallTex) {
          // piece of inner wall (bedroom partition)
          const w = item.x1 - item.x0;
          if (this.textures.exists(item.wallTex)) {
            const ts = this.add.tileSprite(ox + item.x0, oy + item.y, w, item.h, item.wallTex).setOrigin(0, 0).setDepth(depth);
            ts.tilePositionY = Math.max(0, wallH - item.h);
            objects.push(ts);
          } else {
            objects.push(this.add.rectangle(ox + item.x0, oy + item.y, w, item.h, 0xd8c8a0).setOrigin(0, 0).setDepth(depth));
          }
          objects.push(this.add.rectangle(ox + item.x0, oy + item.y, w, 3, trim).setOrigin(0, 0).setDepth(depth));
        } else if (item.rects) {
          item.rects.forEach(r => {
            objects.push(this.add.rectangle(ox + r.x + r.w / 2, oy + r.y + r.h / 2, r.w, r.h, r.color).setDepth(depth));
          });
        } else if (item.flowers) {
          const fkey = 'cs_fl_' + item.flowers;
          if (this.textures.exists(fkey)) {
            const crop = [[0, 0, 40, 32], [44, 0, 24, 32], [80, 0, 16, 32]][item.v] || [0, 0, 40, 32];
            const fs = this.add.sprite(ox + item.x - crop[0], oy + item.y - 16, fkey).setOrigin(0, 0).setDepth(7.3);
            fs.setCrop(crop[0], crop[1], crop[2], crop[3]);
            if (this.anims.exists(fkey + '_sway')) fs.play({ key: fkey + '_sway', startFrame: Phaser.Math.Between(0, 7) });
            objects.push(fs);
          }
        } else if (item.key && this.textures.exists(item.key)) {
          const spr = item.anim
            ? this.add.sprite(ox + item.x, oy + item.baseY, item.key)
            : this.add.image(ox + item.x, oy + item.baseY, item.key);
          spr.setOrigin(item.ox === undefined ? 0.5 : item.ox, item.oy === undefined ? 1 : item.oy).setDepth(depth);
          if (item.scale) spr.setScale(item.scale);
          if (item.flipX) spr.setFlipX(true);
          if (item.lift) spr.y -= item.lift;            // hangs on something (drawn higher than its sorting line)
          if (item.anim && this.anims.exists(item.anim)) spr.play({ key: item.anim, startFrame: 0, delay: (item.x * 37 + item.baseY * 11) % 700 });
          if (item.windy) this.tweens.add({ targets: spr, angle: { from: -1.4, to: 1.6 }, duration: 1500 + (item.x * 13 + item.baseY * 7) % 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (item.x * 29) % 900 });
          objects.push(spr);
          if (item.shadow) {
            const sw = item.shadow > 0 ? item.shadow : spr.displayWidth * -item.shadow;
            shadowGfx.fillEllipse(ox + item.x, oy + item.baseY - 1, sw, Phaser.Math.Clamp(sw * 0.3, 5, 18));
          }
          if (item.sway) {
            // cloth moves in the draught
            this.tweens.add({ targets: spr, scaleX: spr.scaleX * 0.88, duration: Phaser.Math.Between(1200, 1900), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 900) });
          }
          if (item.flame) this.addFlame(objects, ox, oy, item, depth);
          if (item.embers) this.addEmbers(objects, ox + item.x + item.embers[0], oy + item.baseY + item.embers[1], depth + 1);
        } else if (item.fallback) {
          const f = item.fallback;
          objects.push(this.add.rectangle(ox + item.x, oy + item.baseY - f.h / 2, f.w, f.h, f.color).setDepth(depth));
        }
      });

      // Walls and furniture footprints
      const addSolid = (c) => {
        const zone = this.add.zone(ox + c.x + c.w / 2, oy + c.y + c.h / 2, c.w, c.h);
        this.physics.add.existing(zone, true);
        this.interiorObstacles.add(zone);
        objects.push(zone);
        return zone;
      };
      la.colliders.forEach(addSolid);

      // Interior doors: closed and solid until the player pushes against them
      const doors = [];
      la.doors.forEach(d => {
        const blocker = addSolid({ x: d.x - d.w / 2, y: d.top, w: d.w, h: d.y - d.top });
        let ds = null;
        if (this.textures.exists('door_normal_anim')) {
          ds = this.add.sprite(ox + d.x, oy + d.y, 'door_normal_anim').setOrigin(0.5, 1).setScale(INTERIOR_DOOR_SCALE).setDepth(oy + d.y + 1);
          ds.setFrame(0);
          objects.push(ds);
        }
        doors.push({
          sprite: ds, blocker, open: false,
          x: ox + d.x, left: ox + d.x - d.w / 2, right: ox + d.x + d.w / 2,
          top: oy + d.top, bottom: oy + d.y,
          closedDepth: oy + d.y + 1, openDepth: oy + d.top - 1
        });
      });

      // Doors that lead to another area: they swing open when the hero is close
      const portals = (la.portals || []).map(pt => {
        let ds = null;
        const own = pt.door && this.textures.exists('cs_' + pt.door);
        const dkey = own ? 'cs_' + pt.door : 'door_normal_anim';
        if (pt.sprite && this.textures.exists(dkey)) {
          ds = this.add.sprite(ox + pt.x, oy + pt.y, dkey).setOrigin(0.5, 1).setScale(pt.scale).setDepth(oy + pt.y + 1);
          ds.setFrame(0);
          if (pt.tint) ds.setTint(pt.tint);
          objects.push(ds);
        }
        const half = ds && own ? Math.max(9, ds.displayWidth / 2 - 5) : Math.max(9, 8 * pt.scale);
        return { sprite: ds, open: false, x: ox + pt.x, y: oy + pt.y, half, anim: own ? dkey : 'door_normal', creak: !!own, to: pt.to, arrive: pt.arrive, hint: pt.hint, hintAt: 0 };
      });

      // Drawbridge: raised (solid gap) until the hero comes near, then it lowers plank by plank
      let bridge = null;
      if (la.bridge) {
        const bz = la.bridge, len = bz.y1 - bz.y0;
        const blocker = addSolid({ x: bz.x - bz.w / 2, y: bz.y0 + 2, w: bz.w, h: len - 4 });
        let img = null;
        const dkey = this.textures.exists('cs_drawdeck') ? 'cs_drawdeck' : 'cs_bridge';
        if (this.textures.exists(dkey)) {
          // hinged at the gate: raised it stands against the archway (negative scale), lowered it spans the moat
          img = this.add.image(ox + bz.x, oy + bz.y0, dkey).setOrigin(0.5, 0).setDepth(7.6);
          img.setDisplaySize(bz.w, len);
          img._sy = img.scaleY;
          img.setScale(img.scaleX, -0.9 * img._sy).setTint(0x8f7f72);
          objects.push(img);
        }
        // chains from the gate to the tip of the bridge
        const chains = this.add.graphics().setDepth(7.7);
        objects.push(chains);
        bridge = { img, chains, blocker, t: 0, x: ox + bz.x, y0: oy + bz.y0, y1: oy + bz.y1, w: bz.w, moving: false };
      }

      // Living things (the barn cow, the king)
      const actors = [];
      la.actors.forEach(a => {
        if (a.type === 'walker' && this.textures.exists(a.key)) {
          // someone with a routine: walks from point to point, waits, repeats
          const p0 = a.pts[0];
          const sp = this.add.sprite(ox + p0[0], oy + p0[1], a.key).setOrigin(a.ox === undefined ? 0.5 : a.ox, a.oy === undefined ? 1 : a.oy)
            .setScale(a.scale || 1).setDepth(oy + p0[1]);
          if (this.anims.exists(a.idle)) sp.play(a.idle);
          actors.push({ type: 'walker', sprite: sp, pts: a.pts.map(p => [ox + p[0], oy + p[1], p[2] || 0]), i: 1 % a.pts.length, wait: p0[2] || 0,
            speed: a.speed || 24, idle: a.idle, walk: a.walk, lines: a.lines, talkAt: 0, moving: false });
          objects.push(sp);
        }
        if (a.type === 'smith' && this.textures.exists(a.key)) {
          const sp = this.add.sprite(ox + a.x, oy + a.y, a.key).setOrigin(0.5, 1).setScale(a.scale || 1).setDepth(oy + a.y);
          if (this.anims.exists(a.idle)) sp.play(a.idle);
          const sparks = this.add.particles(ox + a.hitX, oy + a.hitY, 'fx_px', {
            speed: { min: 30, max: 95 }, angle: { min: 200, max: 340 }, gravityY: 230, lifespan: { min: 240, max: 520 },
            alpha: { start: 1, end: 0 }, tint: [0xfff0a0, 0xffb040, 0xff8030], emitting: false, blendMode: 'ADD'
          }).setDepth(oy + a.y + 30);
          addSolid({ x: a.x - 8, y: a.y - 8, w: 16, h: 8 });
          actors.push({ type: 'smith', sprite: sp, sparks, x: ox + a.x, y: oy + a.y, idle: a.idle, act: a.act, timer: 900, lines: a.lines, talkAt: 0 });
          objects.push(sp, sparks);
        }
        if (a.type === 'king' && this.textures.exists('king_idle')) {
          const king = this.add.sprite(ox + a.x, oy + a.y, 'king_idle').setOrigin(0.54, 0.61).setScale(1.75).setDepth(oy + a.y);
          if (this.anims.exists('kingprueba_idle')) king.play('kingprueba_idle');
          const tag = this.add.text(ox + a.x, oy + a.y - 46, 'KingPrueba', {
            fontFamily: 'Pixuf, MedievalSharp, monospace', fontSize: '10px', fill: '#fde68a', stroke: '#000000', strokeThickness: 3
          }).setOrigin(0.5, 1).setDepth(oy + a.y + 200);
          addSolid({ x: a.x - 9, y: a.y - 8, w: 18, h: 8 });
          actors.push({ type: 'king', sprite: king, x: ox + a.x, y: oy + a.y, talkAt: 0 });
          objects.push(king, tag);
        }
        if (a.type === 'cow' && this.textures.exists('int_cow_idle')) {
          const cow = this.add.sprite(ox + a.x0, oy + a.y, 'int_cow_idle').setOrigin(0.5, 0.8).setScale(INTERIOR_COW_SCALE).setDepth(oy + a.y);
          if (this.anims.exists('cow_idle')) cow.play('cow_idle');
          actors.push({ type: 'cow', sprite: cow, x0: ox + a.x0, x1: ox + a.x1, y: oy + a.y, state: 'idle', timer: 1200, dir: 1 });
          objects.push(cow);
        }
      });

      areas[name] = {
        name,
        x: ox, y: oy, w: la.w, h: la.h,
        spawn: { x: ox + la.spawn.x, y: oy + la.spawn.y },
        exits: la.exits.map(e => ({ x: ox + e.x, y: oy + e.y, w: e.w, h: e.h, key: e.key, to: e.to, arrive: e.arrive, hint: e.hint, hintAt: 0 })),
        doors,
        actors,
        portals,
        bridge,
        outdoor: !!la.outdoor,
        scroll: !!la.scroll,
        ambient: la.ambient || [],
        objs: objects.slice(firstObj),
        talkers: (la.talkers || []).map(t => ({ x: ox + t.x, y: oy + t.y, lines: t.lines, r: t.r, talkAt: 0 })),
        surface: la.surface,
        title: la.title
      };
    });

    const building = { id, kind: layout.kind, title: layout.title, start: layout.start, areas, objects };
    this.interiors[id] = building;
    return building;
  },

  /**
   * Per-frame logic while the player is indoors: exits (front door / stairs),
   * interior doors that open when you get close, and the cow.
   */
  updateInterior(up, down) {
    const cur = this.currentInterior;
    if (!cur) return;
    const area = cur.area;
    const body = this.player.body;
    const fx = body.center.x;
    const fy = body.center.y;
    // after changing area, UP/DOWN must be released once before they can trigger another door
    // (otherwise holding the key through the fade bounces the hero straight back)
    if (this._areaSwitchHold) {
      if (!up && !down) this._areaSwitchHold = false;
      else { up = false; down = false; }
    }

    for (let i = 0; i < area.exits.length; i++) {
      const e = area.exits[i];
      const inside = fx >= e.x && fx <= e.x + e.w && fy >= e.y && fy <= e.y + e.h;
      if (!inside) continue;
      const pressed = e.key === 'walk' ? true : e.key === 'up' ? up : down;
      if (pressed) {
        if (e.to === 'outside') this.exitInterior();
        else this.switchInteriorArea(e.to, e.arrive);
        return;
      }
      if (e.hint && this.time.now - e.hintAt > 3500) {
        e.hintAt = this.time.now;
        this.createFloatingText(e.x + e.w / 2, e.y - 14, e.hint, 0xfde68a);
      }
    }

    // Doors to other areas: open while the hero is close, UP walks through
    for (let i = 0; i < (area.portals || []).length; i++) {
      const pt = area.portals[i];
      const near = Phaser.Math.Distance.Between(fx, fy, pt.x, pt.y + 8) <= 38;
      if (pt.sprite) {
        if (near && !pt.open) {
          pt.open = true;
          if (this.anims.exists(pt.anim + '_open')) pt.sprite.play(pt.anim + '_open'); else pt.sprite.setFrame(3);
          if (pt.creak) sfx.fx('door_gate', 0.45, { minGap: 500 });
        } else if (!near && pt.open) {
          pt.open = false;
          if (this.anims.exists(pt.anim + '_close')) pt.sprite.play(pt.anim + '_close'); else pt.sprite.setFrame(0);
        }
      }
      const inDoorway = Math.abs(fx - pt.x) <= pt.half && body.top >= pt.y - 6 && body.top <= pt.y + 16;
      if (inDoorway) {
        if (up) { this.switchInteriorArea(pt.to, pt.arrive); return; }
        if (pt.hint && this.time.now - pt.hintAt > 3500) {
          pt.hintAt = this.time.now;
          this.createFloatingText(pt.x, pt.y - 30, pt.hint, 0xfde68a);
        }
      }
    }

    // Drawbridge
    const br = area.bridge;
    if (br) {
      const onBridge = body.right > br.x - br.w / 2 && body.left < br.x + br.w / 2 && body.bottom > br.y0 && body.top < br.y1;
      const near = onBridge || Phaser.Math.Distance.Between(fx, fy, br.x, br.y1 + 6) <= 78 || (fy <= br.y0 + 4 && Math.abs(fx - br.x) < 60);
      const target = near ? 1 : 0;
      if (br.t !== target) {
        if (!br.moving) { br.moving = true; sfx.fx('bridge_move', 0.8, { minGap: 600 }); }
        const step = this.game.loop.delta / 1100;
        br.t = target > br.t ? Math.min(1, br.t + step) : Math.max(0, br.t - step);
        // swing: -0.9 (up against the gate) -> 1 (flat over the water); it falls faster at the end
        const k = -0.9 + 1.9 * Phaser.Math.Easing.Quadratic.In(br.t);
        if (br.img) {
          br.img.setScale(br.img.scaleX, k * br.img._sy);
          const sh = Math.round(143 + 112 * Phaser.Math.Clamp((k + 0.9) / 1.9, 0, 1));
          br.img.setTint(Phaser.Display.Color.GetColor(sh, sh, sh));
        }
        br.blocker.body.enable = br.t < 0.97;
        const len = br.y1 - br.y0, tipY = br.y0 + len * k;
        br.chains.clear();
        br.chains.lineStyle(1, 0x30303a, 0.95);
        br.chains.lineBetween(br.x - br.w / 2 + 6, br.y0 - 52, br.x - br.w / 2 + 3, tipY);
        br.chains.lineBetween(br.x + br.w / 2 - 6, br.y0 - 52, br.x + br.w / 2 - 3, tipY);
        if (br.t === target) {
          br.moving = false;
          if (target === 1) {
            this.cameras.main.shake(140, 0.004);
            sfx.fx('door_gate', 0.5, { minGap: 500 });
            // dust where the deck lands on the bank
            const dust = this.add.particles(br.x, br.y1, 'fx_px', { speedX: { min: -40, max: 40 }, speedY: { min: -18, max: 4 }, lifespan: 600,
              alpha: { start: 0.7, end: 0 }, scale: { start: 1.2, end: 3 }, tint: [0xd9c9a8, 0xb8a888], emitting: false }).setDepth(br.y1 + 4);
            dust.explode(14);
            this.time.delayedCall(900, () => dust.destroy());
          }
        }
      }
    }

    // Bedroom doors: they only open when the player actually PUSHES them
    // (standing against the door and walking into it), and close again once
    // the player has walked clear of the doorway.
    area.doors.forEach(door => {
      const overlapX = Math.min(body.right, door.right) - Math.max(body.left, door.left);
      const aligned = overlapX >= body.width * 0.5;
      if (!door.open) {
        const fromBelow = up && Math.abs(body.top - door.bottom) <= 3;
        const fromAbove = down && Math.abs(body.bottom - door.top) <= 3;
        if (aligned && (fromBelow || fromAbove)) {
          door.open = true;
          door.blocker.body.enable = false;
          if (door.sprite) {
            door.sprite.setDepth(door.openDepth);
            if (this.anims.exists('door_normal_open')) door.sprite.play('door_normal_open'); else door.sprite.setFrame(3);
          }
        }
      } else {
        const clear = body.right < door.left - 6 || body.left > door.right + 6 ||
          body.bottom < door.top - 14 || body.top > door.bottom + 14;
        if (clear) {
          door.open = false;
          door.blocker.body.enable = true;
          if (door.sprite) {
            door.sprite.setDepth(door.closedDepth);
            if (this.anims.exists('door_normal_close')) door.sprite.play('door_normal_close'); else door.sprite.setFrame(0);
          }
        }
      }
    });

    const dt = this.game.loop.delta;
    (area.talkers || []).forEach(t => {
      if (Phaser.Math.Distance.Between(fx, fy, t.x, t.y) < t.r && this.time.now - t.talkAt > 7000) {
        t.talkAt = this.time.now;
        this.createFloatingText(t.x, t.y - 46, t.lines[Math.floor(Math.random() * t.lines.length)], 0xffffff);
      }
    });
    area.actors.forEach(a => {
      if (a.type === 'walker' || a.type === 'smith') { this.updateCastleActor(a, dt, fx, fy); return; }
      if (a.type === 'king' && a.sprite.active) {
        // the king greets the hero who walks up to the throne
        if (Phaser.Math.Distance.Between(fx, fy, a.x, a.y) < 46 && this.time.now - a.talkAt > 6000) {
          a.talkAt = this.time.now;
          const lines = ['¡Salud, súbdito! 👑', 'Este reino necesita héroes ⚔️', 'Bienvenido a mi castillo 🏰', 'Que la corona te proteja ✨'];
          this.createFloatingText(a.x, a.y - 62, lines[Math.floor(Math.random() * lines.length)], 0xfde68a);
        }
        a.sprite.setFlipX(fx < a.x - 4);
        return;
      }
      if (a.type !== 'cow' || !a.sprite.active) return;
      if (a.state === 'idle') {
        a.timer -= dt;
        if (a.timer <= 0) {
          a.state = 'walk';
          a.dir = a.sprite.x < (a.x0 + a.x1) / 2 ? 1 : -1;
          a.target = a.dir > 0 ? Phaser.Math.Between((a.x0 + a.x1) / 2, a.x1) : Phaser.Math.Between(a.x0, (a.x0 + a.x1) / 2);
          a.sprite.setFlipX(a.dir > 0); // the sheet faces left
          if (this.anims.exists('cow_walk')) a.sprite.play('cow_walk', true);
        }
      } else {
        a.sprite.x += a.dir * 18 * (dt / 1000);
        if ((a.dir > 0 && a.sprite.x >= a.target) || (a.dir < 0 && a.sprite.x <= a.target)) {
          a.state = 'idle';
          a.timer = 1500 + Math.random() * 2500;
          if (this.anims.exists('cow_idle')) a.sprite.play('cow_idle', true);
        }
      }
    });
  },

  /**
   * Remove every interior and restore camera/world state.
   * Called when the campaign map is rebuilt or the player leaves campaign mode.
   */
  destroyInteriors() {
    if (this.interiors) {
      Object.keys(this.interiors).forEach(k => {
        (this.interiors[k].objects || []).forEach(o => { try { o.destroy(); } catch (e) { } });
      });
    }
    this.interiors = {};
    if (this.interiorObstacles) {
      try { this.interiorObstacles.clear(true, true); } catch (e) { }
    }
    if (this.currentInterior && this.cameras && this.cameras.main && this.mapWidth) {
      this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
      this.cameras.main.setZoom((this._interiorReturn && this._interiorReturn.zoom) || 1.5);
      if (this.player) this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    }
    if (this.currentInterior) this.setPlayerIndoorScale(false);
    this.currentInterior = null;
    this._interiorReturn = null;
    this._doorTransition = false;
  }
});
