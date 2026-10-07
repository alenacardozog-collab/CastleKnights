# Ruined village ("Aldea en Ruinas"): tiles from the SpriteLab previews -> ground painting + props + baked shadows
# -> assets/ruins/*.png, js/ruins_assets.js (embedded art) and js/maps/data/ruins_map.js (layout data).
# Run: python3 tools/mapgen/ruins/build.py     (needs Pillow + numpy)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(HERE + '/../../..') + '/'     # repo root
WORK = HERE + '/work'; os.makedirs(WORK, exist_ok=True); os.chdir(WORK)                                # intermediate files and previews
sys.path.insert(0, HERE + '/..')
from mapkit import write_map
from PIL import Image
import numpy as np, json, shutil, base64
IDX={}
def extract(name,ref=None):
    im=np.array(Image.open('../raw/ts_%s.png'%name).convert('RGB')).astype(int)
    base=im[0:16,0:16].reshape(-1,3)           # pure dirt
    bset=set(map(tuple,base))
    # top-ness per pixel: colour not in the dirt palette
    H,W=im.shape[:2]
    top=np.zeros((H,W),bool)
    for y in range(H):
        for x in range(W): top[y,x]=tuple(im[y,x]) not in bset
    tiles={}
    for cy in range(7):
        for cx in range(9):
            t=top[cy*16:cy*16+16,cx*16:cx*16+16]
            c=[t[0:4,0:4].mean()>.5,t[0:4,12:16].mean()>.5,t[12:16,0:4].mean()>.5,t[12:16,12:16].mean()>.5]
            idx=(0 if c[0] else 1)|(0 if c[1] else 2)|(0 if c[2] else 4)|(0 if c[3] else 8)
            if name=='grass': IDX[(cx,cy)]=idx
            else: idx=IDX[(cx,cy)]
            tiles.setdefault(idx,[]).append(im[cy*16:cy*16+16,cx*16:cx*16+16])
    return tiles
out={}
for n in('grass','cobble','water'):
    t=extract(n); print(n,sorted((k,len(v)) for k,v in t.items()))
    at=Image.new('RGB',(64,64))
    for i in range(16):
        if i in t: tile=t[i][0]
        else:
            # compose from quadrants of tiles sharing the corner state (diagonal cases)
            tile=np.zeros((16,16,3),int)
            for q,(ys,xs,bit) in enumerate([(slice(0,8),slice(0,8),1),(slice(0,8),slice(8,16),2),(slice(8,16),slice(0,8),4),(slice(8,16),slice(8,16),8)]):
                src = 15^(0 if i&bit else bit) if not i&bit else 15   # top corner alone / pure base
                src = (15 & ~bit) if not (i&bit) else 15
                tile[ys,xs]=t[src][0][ys,xs]
            print(' synth',n,i)
        at.paste(Image.fromarray(tile.astype('uint8')),((i%4)*16,(i//4)*16))
    at.save('ts_%s_atlas.png'%n)
    # extra variants of pure tiles for variety
    for k in(0,15):
        for j,v in enumerate(t[k][:6]): Image.fromarray(v.astype('uint8')).save('var_%s_%d_%d.png'%(n,k,j))

# small props come from a 3x3 SpriteLab pack drawn at about 2.5x: reduce them to game scale
for n in 'grave cross fence rubble barrel crate skull bush boulder'.split():
    im = Image.open('../raw/%s.png' % n).convert('RGBA'); w, h = im.size
    sm = im.resize((round(w * .4), round(h * .4)), Image.BOX); sm.putalpha(sm.split()[3].point(lambda v: 255 if v > 110 else 0)); sm.save('sm_%s.png' % n)

import json, math, random, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
random.seed(11); np.random.seed(11)
W, H, T = 1120, 880, 16
GW, GH = W // T + 1, H // T + 1          # corner grid
TER = 304                                  # y of the terrace edge (upper level is above)
FACE = 30                                  # height of the cliff face
STAIRS = [(528, 592), (872, 920)]          # x ranges of the two stairways

def noise(w, h, s, seed):
    r = np.random.RandomState(seed); g = r.rand(h // s + 3, w // s + 3)
    im = Image.fromarray((g * 255).astype('uint8')).resize(((w // s + 3) * s, (h // s + 3) * s), Image.BICUBIC)
    return np.array(im)[:h, :w] / 255.0

# ---------------------------------------------------------------- props
SRC = {n: '../raw/%s.png' % n for n in 'cottage burnt chapel tower gate stonewall tree1 tree2 fountain statue scarecrow cart well sign mill'.split()}
SRC.update({n: 'sm_%s.png' % n for n in 'grave cross fence rubble barrel crate skull bush boulder'.split()})
IM = {n: Image.open(p).convert('RGBA') for n, p in SRC.items()}
for n, im in IM.items():                   # crop to content
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and b > g + 30 and (b > r + 18 or r > g + 40): px[x, y] = (58, 44, 40, a)      # stray magenta/purple pixels from the generator
    IM[n] = im.crop(im.getbbox())
# solid footprint: (fraction of width, height px, x offset)
FOOT = {'cottage': (.9, 46), 'burnt': (.9, 44), 'chapel': (.86, 62), 'tower': (.82, 46), 'stonewall': (.9, 30), 'mill': (.7, 44),
        'tree1': (.26, 10), 'tree2': (.3, 8), 'fountain': (.88, 30), 'statue': (.7, 14), 'scarecrow': (.2, 6), 'cart': (.8, 16),
        'well': (.8, 20), 'sign': (.4, 6), 'grave': (.7, 8), 'cross': (.4, 6), 'fence': (.92, 8), 'rubble': (.8, 10),
        'barrel': (.7, 9), 'crate': (.75, 10), 'boulder': (.8, 10), 'bush': (.5, 6)}
items = []; cols = []
def put(n, x, y, flip=False, solid=True):
    items.append({'k': n, 'x': x, 'y': y, 'f': int(flip)})
    if solid and n in FOOT:
        fw, fh = FOOT[n]; w = round(IM[n].width * fw)
        cols.append([round(x - w / 2), y - fh, w, fh])

# ---------------------------------------------------------------- terrain masks (corner grid)
cob = np.zeros((GH, GW), bool); wat = np.zeros((GH, GW), bool)
def path(pts, wd=1):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 4) + 1
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n; y = y0 + (y1 - y0) * i / n
            cx, cy = round(x / T), round(y / T)
            for dy in range(-wd, wd + 1):
                for dx in range(-wd, wd + 1):
                    if 0 <= cy + dy < GH and 0 <= cx + dx < GW: cob[cy + dy, cx + dx] = True
PX, PY = 560, 540                          # plaza
path([(560, 880), (560, 640)], 1)                               # south road through the gate
for a in range(0, 360, 6):                                      # plaza ring
    path([(PX + 84 * math.cos(math.radians(a)), PY + 64 * math.sin(math.radians(a)))] * 2, 1)
path([(560, 470), (560, TER + FACE)], 1)                        # up to the main stairs
path([(560, TER - 8), (560, 262)], 1)                           # chapel forecourt
path([(480, 266), (640, 266)], 1)
path([(640, 266), (896, 266), (896, TER - 6)], 0)               # graveyard walk
path([(896, TER + FACE), (896, 420), (760, 470), (650, 520)], 0)  # east way back to the plaza
path([(480, 266), (150, 262)], 0)                               # to the watchtower
path([(476, 540), (330, 540), (250, 600), (170, 560), (150, 470)], 0)  # west quarter and the mill
path([(250, 600), (300, 740), (470, 760), (540, 720)], 0)       # south-west loop
hole = noise(GW, GH, 3, 5)
cob &= ~(hole > 0.76)                                           # the road is broken: stones are missing
cob[:, :2] = False; cob[:, -2:] = False
# the marsh that swallowed the east quarter
for cy in range(GH):
    for cx in range(GW):
        x, y = cx * T, cy * T
        d = min(((x - 930) / 150) ** 2 + ((y - 640) / 105) ** 2, ((x - 1010) / 90) ** 2 + ((y - 520) / 60) ** 2, ((x - 820) / 60) ** 2 + ((y - 730) / 50) ** 2)
        if d < 1 + (hole[cy, cx] - .5) * .5: wat[cy, cx] = True
        d2 = ((x - 150) / 60) ** 2 + ((y - 730) / 34) ** 2       # a stagnant pool in the west
        if d2 < 1: wat[cy, cx] = True
cob &= ~wat
g = noise(GW, GH, 5, 2) * .6 + noise(GW, GH, 2, 3) * .4
grass = g > 0.47
grass = np.array(Image.fromarray((grass * 255).astype('uint8')).filter(ImageFilter.MedianFilter(3))) > 0
near = lambda m: np.array(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))) > 0
grass &= ~near(wat)
grass &= ~near(cob) | (noise(GW, GH, 2, 9) > .62)
grass[:, :3] = True; grass[:, -3:] = True; grass[-2:, :] = True; grass[:2, :] = True
for cy in range(GH):
    y = cy * T
    if TER - 20 < y < TER + FACE + 20: grass[cy, :] = False; cob[cy, :] &= np.array([any(a - 8 <= cx * T <= b + 8 for a, b in STAIRS) for cx in range(GW)])

# ---------------------------------------------------------------- paint
dirt_v = [Image.open('var_grass_15_%d.png' % i).convert('RGB') for i in range(6)]
dset = set()
for n in ('grass', 'cobble', 'water'):
    a = np.array(Image.open('../raw/ts_%s.png' % n).convert('RGB'))[0:16, 0:16].reshape(-1, 3); dset |= {(n, tuple(c)) for c in a}
def atlas(n):
    im = Image.open('ts_%s_atlas.png' % n).convert('RGBA'); px = im.load()
    for y in range(64):
        for x in range(64):
            if (n, px[x, y][:3]) in dset and not (x < 16 and y < 16): px[x, y] = (0, 0, 0, 0)
    return [im.crop(((i % 4) * 16, (i // 4) * 16, (i % 4) * 16 + 16, (i // 4) * 16 + 16)) for i in range(16)]
AT = {n: atlas(n) for n in ('grass', 'cobble', 'water')}
full = {n: [Image.open('var_%s_0_%d.png' % (n, i)).convert('RGBA') for i in range(2)] for n in AT}
ground = Image.new('RGBA', (W, H))
for ty in range(H // T):
    for tx in range(W // T):
        ground.paste(random.choice(dirt_v), (tx * T, ty * T))
def layer(mask, n):
    for ty in range(-1, H // T):
        for tx in range(-1, W // T):
            c = lambda dx, dy: bool(mask[min(GH - 1, max(0, ty + dy + 1)), min(GW - 1, max(0, tx + dx + 1))])
            idx = (0 if c(0, 0) else 1) | (0 if c(1, 0) else 2) | (0 if c(0, 1) else 4) | (0 if c(1, 1) else 8)
            if idx == 15: continue
            t = random.choice(full[n]) if idx == 0 else AT[n][idx]
            if idx == 0 and n != 'water':
                if random.random() < .5: t = t.transpose(Image.FLIP_LEFT_RIGHT)
                if random.random() < .5: t = t.transpose(Image.FLIP_TOP_BOTTOM)
            ground.alpha_composite(t, (max(0, tx * T + 8), max(0, ty * T + 8)), (0 if tx >= 0 else 8, 0 if ty >= 0 else 8))
layer(grass, 'grass'); layer(cob, 'cobble'); layer(wat, 'water')
# tonal variation so the ground is not a flat carpet
ton = (noise(W, H, 90, 21) - .5) * 26 + (noise(W, H, 34, 22) - .5) * 14
arr = np.array(ground.convert('RGB')).astype(float)
arr += ton[:, :, None]
arr[:TER] *= 1.06                                                # the terrace catches more light
ground = Image.fromarray(np.clip(arr, 0, 255).astype('uint8')).convert('RGBA')
d = ImageDraw.Draw(ground, 'RGBA')

# ---------------------------------------------------------------- terrace: cliff face, lip, stairs
rock = [(104, 96, 88), (88, 80, 74), (120, 112, 100), (74, 66, 62)]
rr = random.Random(4)
def instair(x): return any(a <= x < b for a, b in STAIRS)
x = 0
while x < W:
    bw = rr.randint(10, 22)
    for row in range(3):
        y0 = TER + row * 10 + rr.randint(-1, 1); c = rock[rr.randrange(3)]
        c = tuple(int(v * (1 - row * .12)) for v in c)
        d.rectangle([x + (row % 2) * 5, y0, x + (row % 2) * 5 + bw - 1, TER + row * 10 + 10], fill=c + (255,))
        d.line([x + (row % 2) * 5, y0, x + (row % 2) * 5 + bw - 1, y0], fill=tuple(min(255, v + 22) for v in c) + (255,))
        d.line([x + (row % 2) * 5 + bw - 1, y0, x + (row % 2) * 5 + bw - 1, TER + row * 10 + 10], fill=(58, 44, 36, 255))
    x += bw
d.rectangle([0, TER + FACE, W, TER + FACE + 1], fill=(58, 44, 36, 255))
gpx = np.array(ground).astype(float)
for i in range(14):                                               # shadow at the foot of the cliff
    gpx[TER + FACE + 2 + i, :, :3] *= 1 - .5 * (1 - i / 14) ** 1.5
ground = Image.fromarray(gpx.astype('uint8')); d = ImageDraw.Draw(ground, 'RGBA')
# grassy lip with tufts hanging over the edge
for x in range(0, W, 2):
    hgt = 3 + int(2.5 * math.sin(x * .21) + 2 * math.sin(x * .057 + 1))
    d.rectangle([x, TER - 3, x + 1, TER + hgt], fill=(146, 130, 78, 255) if (x // 2) % 5 else (170, 150, 86, 255))
d.line([0, TER - 4, W, TER - 4], fill=(196, 176, 104, 255))
for a, b in STAIRS:
    n = 6; sh = (FACE + 8) / n
    d.rectangle([a - 4, TER - 6, b + 3, TER + FACE + 3], fill=(58, 44, 36, 255))
    for i in range(n):
        y0 = TER - 5 + i * sh; v = 150 - i * 9
        d.rectangle([a, y0, b - 1, y0 + sh - 1], fill=(v, v - 8, v - 22, 255))
        d.line([a, y0, b - 1, y0], fill=(v + 34, v + 26, v + 8, 255))
        d.line([a, y0 + sh - 1, b - 1, y0 + sh - 1], fill=(v - 50, v - 56, v - 62, 255))
        for k in range(a + rr.randint(4, 12), b - 2, rr.randint(11, 17)): d.line([k, y0 + 1, k, y0 + sh - 2], fill=(v - 30, v - 36, v - 46, 255))
    for sx in (a - 4, b):                                         # side kerbs
        d.rectangle([sx, TER - 8, sx + 3, TER + FACE + 3], fill=(112, 104, 94, 255)); d.line([sx, TER - 8, sx, TER + FACE + 3], fill=(150, 142, 128, 255))
cols += [[0, TER - 6, STAIRS[0][0] - 2, FACE + 4], [STAIRS[0][1] + 2, TER - 6, STAIRS[1][0] - STAIRS[0][1] - 4, FACE + 4], [STAIRS[1][1] + 2, TER - 6, W - STAIRS[1][1] - 2, FACE + 4]]

# ---------------------------------------------------------------- layout
put('chapel', 560, 250)
put('tower', 132, 244)
put('mill', 150, 462)
put('gate', 560, 800, solid=False); cols += [[508, 782, 34, 18], [590, 782, 24, 18]]
put('fountain', PX, PY + 22)
put('statue', 468, 436)
put('cottage', 352, 500); put('burnt', 214, 660); put('stonewall', 404, 708)
put('cottage', 770, 596, True); put('burnt', 706, 448, True); put('stonewall', 968, 470, True)
put('stonewall', 330, 240); put('well', 444, 610); put('cart', 664, 706); put('sign', 606, 846); put('scarecrow', 300, 770)
put('scarecrow', 1040, 250, True)
# graveyard on the terrace, fenced
gy = [(676, 196), (716, 190), (756, 198), (800, 192), (840, 198), (690, 242), (734, 236), (780, 244), (826, 238), (980, 214), (1016, 240), (960, 256)]
for i, (x, y) in enumerate(gy): put('grave' if i % 3 else 'cross', x, y, i % 2 == 0)
for x in range(664, 860, 33): put('fence', x, 156, x % 2 == 0)
for x in (30, 63, 96, 129): put('fence', 944 + x, 176)
# village fence along the south, both sides of the gate
for x in list(range(96, 500, 33)) + list(range(630, 1040, 33)):
    if rr.random() < .8: put('fence', x, 798, rr.random() < .5)
    else: put('rubble', x, 800)
for n, x, y in [('rubble', 300, 520), ('rubble', 822, 600), ('rubble', 620, 300 + FACE + 30), ('rubble', 258, 676), ('barrel', 410, 520), ('crate', 426, 506), ('barrel', 716, 610),
                ('crate', 252, 470), ('skull', 500, 690), ('skull', 880, 470), ('skull', 208, 380), ('boulder', 60, 600), ('boulder', 1060, 420), ('boulder', 470, 380),
                ('boulder', 760, 372), ('barrel', 184, 474), ('crate', 630, 720), ('rubble', 96, 262), ('rubble', 610, 262), ('boulder', 420, 200), ('skull', 1000, 780), ('rubble', 520, 262)]:
    put(n, x, y)
# dead trees: a ring around the map and loose ones inside
occupied = lambda x, y, r=30: any(abs(x - c[0] - c[2] / 2) < c[2] / 2 + r and abs(y - c[1] - c[3] / 2) < c[3] / 2 + r * .6 for c in cols)
def on(mask, x, y): return mask[min(GH - 1, round(y / T)), min(GW - 1, round(x / T))]
for x in range(20, W, 46):
    for y0 in (70, H - 4):
        xx = x + rr.randint(-8, 8); yy = y0 + rr.randint(-10, 0)
        if abs(xx - 560) < 70 and y0 > 400: continue
        put('tree1' if rr.random() < .6 else 'tree2', xx, yy, rr.random() < .5)
for y in range(110, H - 30, 52):
    for x0 in (22, W - 22):
        yy = y + rr.randint(-8, 8)
        if TER - 30 < yy < TER + FACE + 40: continue
        put('tree1' if rr.random() < .5 else 'tree2', x0 + rr.randint(-6, 6), yy, rr.random() < .5)
BIG = ('cottage', 'burnt', 'stonewall', 'chapel', 'tower', 'mill', 'gate', 'well', 'statue', 'fountain')
n = 0
while n < 26:
    x, y = rr.randint(60, W - 60), rr.randint(110, H - 60)
    if TER - 40 < y < TER + FACE + 60 or on(cob, x, y) or on(wat, x, y) or on(wat, x, y - 12) or occupied(x, y, 34) or any(i['k'] in BIG and abs(i['x'] - x) < 70 and -20 < y - i['y'] < 70 for i in items) or math.hypot(x - PX, y - PY) < 120: continue
    put(('tree1', 'tree2', 'bush', 'bush')[rr.randrange(4)], x, y, rr.random() < .5); n += 1
# the drowned quarter: what still sticks out of the marsh
for n, x, y, f in [('stonewall', 950, 660, False), ('tree2', 870, 600, False), ('tree2', 1010, 590, True), ('tree1', 900, 720, True), ('boulder', 980, 716, False), ('cross', 1030, 660, False), ('fence', 860, 668, False), ('rubble', 1010, 530, False)]:
    put(n, x, y, f, solid=False)
# water and the map border
for cy in range(H // T):
    run = None
    for cx in range(W // T + 1):
        w_ = cx < W // T and wat[cy:cy + 2, cx:cx + 2].all()
        if w_ and run is None: run = cx
        if not w_ and run is not None: cols.append([run * T + 3, cy * T + 4, (cx - run) * T - 6, T]); run = None
cols += [[0, 0, W, 60], [0, 0, 10, H], [W - 10, 0, 10, H], [0, H - 6, 528, 6], [592, H - 6, W - 592, 6]]

# ---------------------------------------------------------------- baked cast shadows (low sun from the left)
sh = Image.new('L', (W, H), 0)
for it in items:
    im = IM[it['k']];  im = im.transpose(Image.FLIP_LEFT_RIGHT) if it['f'] else im
    a = im.split()[3]; w, h = a.size; k = .42; hs = max(2, int(h * k)); sx = .8
    out = a.transform((w + int(hs * sx) + 2, hs), Image.AFFINE, (1, sx, -hs * sx, 0, 1 / k, 0), Image.BILINEAR)
    box = (int(it['x'] - w / 2), it['y'] - hs)
    tmp = Image.new('L', (W, H), 0); tmp.paste(out, box); sh = ImageChops.lighter(sh, tmp)
sh = sh.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: int(v * .34))
ground = Image.composite(Image.new('RGBA', (W, H), (18, 12, 26, 255)), ground, sh)
ground.convert('RGB').save('ground.png')

json.dump({'w': W, 'h': H, 'items': items, 'cols': cols, 'sizes': {n: [im.width, im.height] for n, im in IM.items()}}, open('map.json', 'w'), separators=(',', ':'))
for n, im in IM.items(): im.save('out_%s.png' % n)
# preview
pv = ground.copy()
for it in sorted(items, key=lambda i: i['y']):
    im = IM[it['k']]; im = im.transpose(Image.FLIP_LEFT_RIGHT) if it['f'] else im
    pv.alpha_composite(im, (max(0, int(it['x'] - im.width / 2)), max(0, it['y'] - im.height)))
pv.save('preview.png')
dbg = pv.copy(); dd = ImageDraw.Draw(dbg, 'RGBA')
for c in cols: dd.rectangle([c[0], c[1], c[0] + c[2], c[1] + c[3]], fill=(255, 0, 0, 90))
dbg.save('debug.png')
# reachability (8 px cells, hero feet ~12x6)
G = 4; bw, bh = W // G, H // G; blk = np.zeros((bh, bw), bool)
for c in cols:
    blk[max(0, (c[1] - 4) // G):(c[1] + c[3] + 3) // G + 1, max(0, (c[0] - 7) // G):(c[0] + c[2] + 7) // G + 1] = True
seen = np.zeros_like(blk); st = [(560 // G, 860 // G)]; seen[st[0][1], st[0][0]] = True
while st:
    x, y = st.pop()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < bw and 0 <= ny < bh and not blk[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; st.append((nx, ny))
for nm, (x, y) in {'plaza': (560, 620), 'chapel door': (560, 262), 'tower': (132, 256), 'graveyard': (760, 220), 'mill': (150, 474), 'east stairs top': (896, 290), 'well': (444, 622), 'marsh shore': (760, 640), 'sw': (300, 750), 'ne': (1040, 262), 'far east': (1080, 800)}.items():
    print(nm, bool(seen[y // G, x // G]))
print('items', len(items), 'cols', len(cols), 'reach %.0f%%' % (100 * seen.sum() / (~blk).sum()))

# ---------------------------------------------------------------- pack
m = json.load(open('map.json'))
R = ROOT; OUT = R + 'assets/ruins/'; os.makedirs(OUT, exist_ok=True)
shutil.copy('ground.png', OUT + 'ground.png')
for n in m['sizes']: shutil.copy('out_%s.png' % n, OUT + n + '.png')
for n in ('mill', 'scarecrow'): shutil.copy('../anim/%s_frames.png' % n, OUT + n + '_anim.png')
AN = {'mill': 'ru_mill_turn', 'scarecrow': 'ru_scarecrow_flap'}
for n in ('grass', 'cobble', 'water'): shutil.copy('ts_%s_atlas.png' % n, OUT + 'tileset_%s.png' % n)   # the SpriteLab tilesets, for Tiled
out = ["// Ruined village map (art generated with SpriteLab, composed by scripts)", "window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};"]
for n in ['ground', 'mill_anim', 'scarecrow_anim'] + sorted(m['sizes']):
    out.append("window.GAME_ASSETS_BASE64['ru_%s'] = 'data:image/png;base64,%s';" % (n, base64.b64encode(open(OUT + n + '.png', 'rb').read()).decode()))
open(R + 'js/ruins_assets.js', 'w').write('\n'.join(out) + '\n')
data = {'w': m['w'], 'h': m['h'], 'sizes': m['sizes'], 'items': [([i['k'] + '_anim', i['x'], i['y'] + 2, i['f'], AN[i['k']]] if i['k'] in AN else [i['k'], i['x'], i['y'], i['f']]) for i in m['items']], 'cols': m['cols']}
open(R + 'js/maps/data/ruins_map.js', 'w').write('/* Ruined village: layout data (generated by tools/mapgen/ruins; safe to edit by hand — move a prop by changing its x / baseY). */\n' + write_map('RUINS_MAP', data) + '\n')
print('ruins packed: assets/ruins, js/ruins_assets.js, js/maps/data/ruins_map.js')
