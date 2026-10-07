/* buildInteriorLayout(kind): the helper kit every building/map layout is written with. Layouts register themselves in INTERIOR_LAYOUTS. */

/** Layout builders by kind: INTERIOR_LAYOUTS.<kind> = function (kit) { ...; return { title, start }; } (see js/maps/). */
const INTERIOR_LAYOUTS = {};

/**
 * Pure data description of a building interior, in area-local pixels.
 * MainGameScene.buildInterior() turns it into game objects.
 *
 * Returns { kind, title, start, areas: { name: area } } where each area has:
 *   w, h, wallH       size of the room and height of its back wall
 *   floorTex, wallTex tiled materials ('int_floor_*', 'int_wall_*')
 *   rects             flat rectangles drawn over the materials (frames, stairwell...)
 *   items             things placed in the room, depth-sorted by baseY:
 *                       { key, x, baseY, scale, flipX }     texture, origin bottom-center
 *                       { ..., floor: true }                lies flat on the floor (rugs), drawn under everything
 *                       { rects: [...], baseY }             piece drawn from rectangles
 *   colliders         solid footprints (walls + furniture)
 *   doors             pushable doors { x, y, w, top }  (x center, y bottom, top of its solid part)
 *   exits             trigger zones { x, y, w, h, key: 'up'|'down', to: 'outside'|areaName, arrive: {x, y}, hint }
 *   actors            moving things { type: 'cow', x0, x1, y }
 *   spawn             where the player's feet appear when coming in from the village
 */
function buildInteriorLayout(kind) {
  const WALL = 56;   // height of a back wall
  const SIDE = 10;   // side / front wall thickness
  const DOORWAY = 28;
  const R = (x, y, w, h, color, alpha) => (alpha === undefined ? { x, y, w, h, color } : { x, y, w, h, color, alpha });
  const SIZES = (typeof window !== 'undefined' && window.INTERIOR_ASSET_SIZES) || {};

  const THEMES = {
    // village houses share the castle's quiet floors (same planks and flagstones), each keeps its own walls
    bar: { floorTex: 'cs_floor_dark', wallTex: 'int_wall_wood', trim: 0x2f1d10, wall: 0x8a6a4a, wallDark: 0x4a3018 },
    casa: { floorTex: 'cs_floor_plank', wallTex: 'int_wall_plaster', trim: 0x4a3018, wall: 0xe9dfc4, wallDark: 0x6b4a26 },
    tienda: { floorTex: 'cs_floor_stone', wallTex: 'int_wall_plaster', trim: 0x5a4a30, wall: 0xf1ead2, wallDark: 0x9a8a62 },
    granero: { floorTex: 'int_floor_dirt', wallTex: 'int_wall_barn', trim: 0x2a1410, wall: 0xa83c30, wallDark: 0x5a1c16 },
    // castle rooms
    // (quiet, low-contrast floors and darker walls, so characters and furniture are what you see first)
    hall: { floorTex: 'cs_floor_stone', wallTex: 'cs_wall_stone', trim: 0x2f2a36, trimHi: 0x5d5566, mat: 0x7d2a30, vignette: true, sideFace: 16 },
    royal: { floorTex: 'cs_floor_plank', wallTex: 'cs_wall_panel', trim: 0x2f2a36, trimHi: 0x5d5566, mat: 0x7d2a30, vignette: true, sideFace: 16 },
    study: { floorTex: 'cs_floor_dark', wallTex: 'cs_wall_panel', trim: 0x2f2a36, trimHi: 0x5d5566, mat: 0x7d2a30, vignette: true, sideFace: 16 }
  };

  // ---- room shell: materials, frame, walls, optional front door at the bottom ----
  const makeArea = (w, h, t, opts = {}) => {
    const a = {
      w, h, wallH: WALL, side: SIDE, floorTex: t.floorTex, wallTex: t.wallTex, trim: t.trim,
      rects: [], items: [], colliders: [], doors: [], exits: [], actors: [], portals: [], lights: [], polys: [], fx: [], talkers: [],
      trimHi: t.trimHi, mat: t.mat, vignette: !!t.vignette, sideFace: t.sideFace || 0,
      spawn: { x: w / 2, y: h - SIDE - 18 }
    };
    const SW = SIDE + (t.sideFace || 0);          // side walls: the cap plus the face you see from above
    // contact shadow where the wall meets the floor
    a.rects.push(R(SIDE, WALL, w - SIDE * 2, 4, 0x000000, 0.28));
    a.rects.push(R(SIDE, WALL + 4, w - SIDE * 2, 3, 0x000000, 0.12));

    a.colliders.push({ x: 0, y: 0, w, h: WALL + 2 });
    a.colliders.push({ x: 0, y: 0, w: SW, h });
    a.colliders.push({ x: w - SW, y: 0, w: SW, h });

    if (opts.frontDoorX !== undefined) {
      const dx = opts.frontDoorX, dw = DOORWAY;
      a.frontDoor = { x: dx, w: dw };
      a.colliders.push({ x: 0, y: h - SIDE, w: dx, h: SIDE });
      a.colliders.push({ x: dx + dw, y: h - SIDE, w: w - dx - dw, h: SIDE });
      a.spawn = { x: dx + dw / 2, y: h - SIDE - 18 };
      a.exits.push({ x: dx, y: h - SIDE - 10, w: dw, h: 20, key: 'down', to: opts.exitTo || 'outside', arrive: opts.exitArrive, hint: '▼ Salir' });
    } else {
      a.colliders.push({ x: 0, y: h - SIDE, w, h: SIDE });
    }
    return a;
  };

  // Generated piece ('int_<name>'). Footprint collider = lower part of the (scaled) sprite.
  // foot: fraction of the height that is solid (default 0.45). solid:false = decoration only.
  const put = (a, name, x, baseY, o = {}) => {
    const sc = o.scale || INTERIOR_SCALE[name] || 1;
    const raw = SIZES[name] || { w: 32, h: 32 };
    const w = Math.round(raw.w * sc), h = Math.round(raw.h * sc);
    const shadow = (o.shadow === undefined ? (o.solid !== false && !o.floor) : o.shadow) ? Math.round(w * 0.92) : 0;
    a.items.push({ key: 'int_' + name, x, baseY, scale: sc, flipX: !!o.flipX, floor: !!o.floor, shadow, flame: o.flame ? 'int_' + name : null, fallback: { w, h, color: 0x7a5a3a } });
    if (o.solid !== false && !o.floor) {
      const fh = Math.max(6, Math.round(h * (o.foot === undefined ? 0.45 : o.foot)));
      a.colliders.push({ x: Math.round(x - w / 2) + 2, y: baseY - fh, w: w - 4, h: fh });
    }
    return { w, h };
  };
  // Rug centred on (cx, cy), flat on the floor
  const rug = (a, name, cx, cy, o = {}) => {
    const sc = o.scale || INTERIOR_SCALE[name] || 1;
    const raw = SIZES[name] || { w: 64, h: 44 };
    put(a, name, cx, Math.round(cy + (raw.h * sc) / 2), { floor: true, scale: sc });
  };
  // Props that already ship with the game (texture key = file name), drawn 1.25x
  const prop = (a, key, x, baseY, w, h, solid = true) => {
    const sc = 1.25;
    const sw = Math.round(w * sc), sh = Math.round(h * sc);
    a.items.push({ key, x, baseY, scale: sc, shadow: solid ? Math.round(sw * 0.92) : 0, fallback: { w: sw, h: sh, color: 0x7a5a3a } });
    if (solid) {
      const fh = Math.max(6, Math.round(sh * 0.45));
      a.colliders.push({ x: Math.round(x - sw / 2) + 2, y: baseY - fh, w: sw - 4, h: fh });
    }
  };
  const windowAt = (a, x) => put(a, 'window', x, WALL - 12, { solid: false });
  // Castle art ('cs_<name>'); same rules as put()
  const CS = (typeof window !== 'undefined' && window.CASTLE_ASSET_SIZES) || {};
  const putc = (a, name, x, baseY, o = {}) => {
    const sc = o.scale || 1;
    const raw = CS[name] || { w: 32, h: 32 };
    const w = Math.round(raw.w * sc), h = Math.round(raw.h * sc);
    const shadow = (o.shadow === undefined ? (o.solid !== false && !o.floor) : o.shadow) ? Math.round(w * 0.92) : 0;
    a.items.push({ key: 'cs_' + name, x, baseY, scale: sc, flipX: !!o.flipX, floor: !!o.floor, shadow, lift: o.lift || 0, flame: o.flame ? name : null, sway: !!o.sway, fallback: { w, h, color: 0x7a5a3a } });
    if (o.solid !== false && !o.floor) {
      const fh = Math.max(6, Math.round(h * (o.foot === undefined ? 0.4 : o.foot)));
      const cw = Math.round(w * (o.footW === undefined ? 1 : o.footW));
      a.colliders.push({ x: Math.round(x - cw / 2) + 1, y: baseY - fh, w: cw - 2, h: fh });
    }
    return { w, h };
  };
  // Village art at its natural size, for outdoor areas. tw/th: solid footprint (centred on the base)
  const place = (a, key, x, baseY, tw, th, o = {}) => {
    a.items.push({ key, x, baseY, scale: 1, shadow: -0.74, sway: !!o.sway, fallback: { w: 16, h: 16, color: 0x3f7a3a } });   // negative = fraction of the texture width
    if (tw) a.colliders.push({ x: Math.round(x - tw / 2), y: baseY - th, w: tw, h: th });
  };
  // Characters that stand in a room. Hero-style sheets are 100x100 with the feet at 61% of the frame.
  const person = (a, key, anim, x, baseY, o = {}) => {
    a.items.push({ key, anim, x, baseY, scale: o.scale || 1.75, oy: o.oy === undefined ? 0.61 : o.oy, ox: o.ox || 0.5, flipX: !!o.flipX, label: o.label });
    a.colliders.push({ x: x - 8, y: baseY - 8, w: 16, h: 8 });
  };
  // Door on the back wall that leads to another area (opens when you get close, UP to go through)
  const portal = (a, x, to, o = {}) => {
    a.portals.push({ x, y: o.y === undefined ? WALL + 2 : o.y, to, arrive: o.arrive, scale: o.scale || 1.75, hint: o.hint, sprite: o.sprite !== false, tint: o.tint, door: o.door });
  };

  // Pool of light (flickers). halo: a small round glow drawn over the flame instead of on the floor.
  const light = (a, x, y, r, color, alpha, o = {}) => {
    (a.lights = a.lights || []).push({ x, y, r, color, alpha, halo: !!o.halo });
  };

  // Map composed offline (ground painting + props + solid footprints shipped as data): [key, x, baseY, flip, anim?]
  const fromData = (a, M, windy) => {
    (M.items || []).forEach(([k, x, y, f, anim]) => {
      const it = { key: k, x, baseY: y, scale: 1, flipX: !!f, shadow: 0, fallback: { w: 16, h: 16, color: 0x6b6258 } };
      if (anim) it.anim = anim;
      if (windy && windy.test(k) && (x + y) % 3 !== 0) it.windy = true;
      a.items.push(it);
    });
    (M.cols || []).forEach(([x, y, w, h]) => a.colliders.push({ x, y, w, h }));
  };

  const areas = {};

  // every layout gets the same kit; unknown kinds fall back to the family house
  const kit = { WALL, SIDE, DOORWAY, R, SIZES, THEMES, makeArea, put, rug, prop, windowAt, CS, putc, place, person, portal, light, fromData, areas };
  if (!INTERIOR_LAYOUTS[kind]) kind = 'casa';
  const res = INTERIOR_LAYOUTS[kind](kit) || {};
  return { kind, title: res.title || 'Casa', start: res.start || 'main', areas };
}
