'use strict';
/* Solid world: colliders from the map, obstacles, hazards and the collision debug views. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
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
  },

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
          // renderTiledObjects() draws every object at its native texture size with origin (0,1),
          // so hitboxes are computed from the native size too (Tiled's resized w/h is ignored).
          const left = o.x;
          const top = o.y - meta.h;

          const scaleX = 1;
          const scaleY = 1;

          // Collect building tile bounding boxes to strictly exclude RockSlopes_Auto cliff artifacts under houses
          if (meta.cat === 'buildings') {
            const minTx = Math.floor(left / 16);
            const maxTx = Math.ceil((left + meta.w) / 16);
            const minTy = Math.floor(top / 16);
            const maxTy = Math.ceil((top + meta.h) / 16);
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
    // FIX: the previous version tested the Road layer filler gid (5397) against the stair
    // list, which marked EVERY cliff tile as "stairs" and produced zero cliff colliders.
    // Cliffs now use the collision shapes authored in the tileset itself (Tiled objectgroup):
    // rock faces are solid, stair tiles and the walkable top rim have no shape and stay open.
    const rsAuto = mapData.layers.find(l => l.name === 'RockSlopes_Auto');
    const rLayer = mapData.layers.find(l => l.name === 'Road');
    if (rsAuto && rsAuto.data) {
      const mapW = mapData.width || 40;
      const tw = mapData.tilewidth || 16;
      const th = mapData.tileheight || 16;
      const shapeBounds = (c) => {
        if (c.polygon && c.polygon.length > 0) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          c.polygon.forEach(pt => {
            minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
          });
          return { x: (c.x || 0) + minX, y: (c.y || 0) + minY, w: maxX - minX, h: maxY - minY };
        }
        return { x: c.x || 0, y: c.y || 0, w: c.width || tw, h: c.height || th };
      };

      rsAuto.data.forEach((g, idx) => {
        if (!g) return;
        const tx = idx % mapW;
        const ty = Math.floor(idx / mapW);
        const roadGid = rLayer && rLayer.data ? rLayer.data[idx] : 0;
        const isRealRoad = roadGid > 0 && roadGid !== 5397;
        const inBuilding = buildingBoxes.some(bb => tx >= bb.minTx && tx < bb.maxTx && ty >= bb.minTy && ty < bb.maxTy);
        if (isRealRoad || inBuilding) return;

        const d = getTileDef(g);
        const shapes = d && d.tile && d.tile.objectgroup ? d.tile.objectgroup.objects : null;
        if (!shapes || shapes.length === 0) return; // stairs / walkable rim

        shapes.forEach(c => {
          const sb = shapeBounds(c);
          const x0 = Math.max(0, Math.round(sb.x));
          const y0 = Math.max(0, Math.round(sb.y));
          const x1 = Math.min(tw, Math.round(sb.x + sb.w));
          const y1 = Math.min(th, Math.round(sb.y + sb.h));
          if (x1 - x0 < 2 || y1 - y0 < 2) return;
          colliders.push({
            x: tx * tw + x0,
            y: ty * th + y0,
            w: x1 - x0,
            h: y1 - y0,
            type: 'solid',
            source: 'rock_cliff'
          });
        });
      });
    }

    return colliders;
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  /**
   * Handle player stepping into mud / swamp slow zone
   */
  handlePlayerSlowTouch(player, slowZone) {
    this._inSlowZone = true;
    this._slowZoneTimer = this.time.now + 120;
  },

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
  },

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
});
