# Castle grounds: road with moat and drawbridge, wall walk, royal garden (+ the garden gate of the courtyard).
# Art: SpriteLab tiles/buildings/props (raw/), village trees, PixelLab frames (anim/).
# -> assets/castle/*.png, js/castle_assets.js (embedded art) and js/maps/data/castle_maps.js (layout data).
# Run: python3 tools/mapgen/castle/build.py     (needs Pillow + numpy)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(HERE + '/../../..') + '/'     # repo root
WORK = HERE + '/work'; os.makedirs(WORK, exist_ok=True); os.chdir(WORK)                                # intermediate files and previews
sys.path.insert(0, HERE + '/..')
from mapkit import write_map
import json, math, random, shutil, base64
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
from mapkit import *
V = ROOT + 'assets/map2/Art/'; CS = ROOT + 'assets/castle/'
RAMP = [(31, 110, 60), (42, 148, 77), (52, 172, 92), (85, 199, 104), (128, 214, 128)]
def village_green(im):
    """bring SpriteLab greens onto the village grass ramp"""
    a = np.array(im.convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (g > r * 1.08) & (g > b * 1.15); lum = (g - 70) / 120.0; lum = np.clip(lum, 0, 1) * (len(RAMP) - 1)
    lo = np.floor(lum).astype(int).clip(0, len(RAMP) - 2); f = (lum - lo)[..., None]
    R = np.array(RAMP, float); col = R[lo] * (1 - f) + R[lo + 1] * f
    a[m] = col[m]; return Image.fromarray(a.astype('uint8'))
GRASS = Tileset('../raw/ts_grass.png', village_green); MOAT = Tileset('../raw/ts_moat.png', village_green); FLAG = Tileset('../raw/ts_flag.png', village_green)
vil = lambda n: Image.open(glob_v[n]).convert('RGBA')
import glob
glob_v = {os.path.basename(f)[:-4]: f for f in glob.glob(V + '*/*.png')}
S = {n: load('../raw/%s.png' % n) for n in 'gatehouse tower wall keep gfountain gazebo rosearch queen'.split()}
PK = {'gbench': 'gpack_5smmmt', 'hedge': 'gpack_c682ae', 'rose_pink': 'gpack_f9g891', 'rose_white': 'gpack_gdiqha', 'urn': 'gpack_jnlezz', 'topiary_ball': 'gpack_o6bv18',
      'topiary_cone': 'gpack_ppcmvu', 'sundial': 'gpack_5slo5o', 'telescope': 'wpack_7a9rzo', 'arrowbarrel': 'wpack_8trh36', 'brazier2': 'wpack_hoew9j',
      'arrowcrates': 'wpack_otapyx', 'spears': 'wpack_q0wm12', 'ballista': 'wpack_skxjy7', 'cannonballs': 'wpack_smfdkb', 'stool': 'wpack_kjc422'}
for n, f in PK.items(): S[n] = load('../raw/%s.png' % f, .5)
S['cherry'] = load('../raw/gpack_v2q5ug.png', .8)
OUT = {}                                     # sprites to ship: name -> image
def export(m, name, extra=None):
    m.ground.convert('RGB').save('ground_%s.png' % name)
    d = {'w': m.W, 'h': m.H, 'items': [[i['k'], i['x'], i['y'], i['f']] + ([i['a']] if i.get('a') else []) for i in m.items], 'cols': m.cols}
    if extra: d.update(extra)
    return d
def sput(m, n, x, y, flip=False, foot=None, **kw):
    OUT[n] = S[n]; m.put('cs_' + n, S[n], x, y, flip, foot, kw or None)
def vput(m, n, x, y, foot=None, **kw): m.put(n, vil(n), x, y, False, foot, kw or None)
rr = random.Random(7)

# ================================================================= ROAD (960x720)
m = Map(960, 720, 3); m.fill(GRASS)
grass = ~m.mask(); wat = m.mask(); H0 = noise(m.GW, m.GH, 3, 5)
STREAM = [(368, 264), (376, 340), (392, 420), (408, 480), (420, 600), (404, 720)]
m.rect(wat, 368, 216, 960, 256); m.rect(wat, 344, 0, 376, 256)
m.path(wat, STREAM, 0); m.path(wat, [(x + 16, y) for x, y in STREAM], 0)
m.ell(wat, 104, 640, 56, 34, H0)
ROADS = [[(120, 0), (120, 120), (150, 240), (150, 420), (190, 540), (330, 604), (560, 604), (652, 560), (652, 440), (660, 300), (660, 268)],
         [(150, 240), (280, 300), (384, 340), (470, 340), (560, 330), (660, 300)],
         [(660, 420), (800, 410), (880, 350)], [(330, 604), (270, 660)]]
road = m.mask()
for r in ROADS: m.path(road, r, 0)
for r in ROADS: m.path(road, [(x + 16, y) for x, y in r], 0); m.path(road, [(x, y + 16) for x, y in r], 0)
road2 = road.copy()
grass &= ~road2
gp = noise(m.GW, m.GH, 4, 8)                                     # worn clearings
m.ell(road2, 270, 668, 44, 26); m.ell(road2, 880, 340, 40, 24); grass &= ~road2
m.layer(grass, GRASS); m.layer(wat, MOAT)
m.tone(14)
a = np.array(m.ground).astype(float); a[:470, 300:] *= 1.03; a[500:] *= .97; m.ground = Image.fromarray(np.clip(a, 0, 255).astype('uint8'))
cliff(m, 470, 300, 960, 30, gaps=[(628, 676)])
d = m.draw()
# waterfall where the stream drops off the ledge
wx = 400
d.rectangle([wx - 2, 466, wx + 30, 506], fill=(86, 170, 226, 255))
for i in range(0, 30, 3): d.line([wx + i, 466, wx + i, 506], fill=(150, 210, 245, 255) if i % 2 else (210, 238, 252, 255))
d.ellipse([wx - 8, 500, wx + 36, 514], fill=(226, 244, 254, 255))
# bridges over the stream
def bridge(x0, y0, x1, y1, stone=False):
    d.rectangle([x0, y0 + 3, x1, y1 + 5], fill=(40, 30, 30, 120))
    base = (168, 158, 140) if stone else (158, 118, 76)
    d.rectangle([x0, y0, x1, y1], fill=base + (255,)); d.rectangle([x0, y0, x1, y1], outline=(58, 44, 36, 255))
    for x in range(x0 + 6, x1, 7): d.line([x, y0 + 1, x, y1 - 1], fill=tuple(v - 34 for v in base) + (255,))
    d.rectangle([x0, y0 - 5, x1, y0 - 1], fill=tuple(v - 20 for v in base) + (255,)); d.rectangle([x0, y0 - 5, x1, y0 - 1], outline=(58, 44, 36, 255))
    d.rectangle([x0, y1 - 4, x1, y1], fill=tuple(min(255, v + 18) for v in base) + (255,)); d.rectangle([x0, y1 - 4, x1, y1], outline=(58, 44, 36, 255))
    m.cols.append([x0, y0 - 6, x1 - x0, 6]); m.cols.append([x0, y1 - 2, x1 - x0, 6])
bridge(352, 326, 420, 356); bridge(392, 588, 462, 620, True)
BR = [(352, 322, 420, 360), (392, 584, 462, 624)]
# ---- the castle: keep behind, curtain wall, towers and gatehouse in front (painted: the hero never goes behind)
WT, WB = 100, 198
d.rectangle([392, 0, 960, WB], fill=(46, 120, 74, 255))
for i in range(60):
    t = vil('Tree_Emerald_%d' % rr.randint(1, 4)); t = ImageEnhance.Brightness(t).enhance(.8)
    m.ground.paste(t, (392 + rr.randint(-10, 560), rr.randint(-30, 70)), t)
keep = S['keep']; m.ground.paste(keep, (800 - keep.width // 2, 196 - keep.height), keep)
wall = S['wall']; x = 392
while x < 960: m.ground.paste(wall, (x, WB - wall.height), wall); x += wall.width - 2
m.shade(392, WB - 96, 960, WB - 60, 1.0, 1.0)
for tx in (414, 934): t = S['tower']; m.ground.paste(t, (tx - t.width // 2, 208 - t.height), t)
g = S['gatehouse']; GX = 660; m.ground.paste(g, (GX - g.width // 2, 206 - g.height), g)
m.shade(392, WB, 960, WB + 12, .62)                                  # the wall's shadow on the bank
m.flat = [(S['tower'], 414, 208), (S['tower'], 934, 208), (g, GX, 206)]
m.cols += [[376, 0, 584, 200], [GX - 72, 196, 52, 14], [GX + 20, 196, 52, 14]]
# ---- props
vput(m, 'Sign_1', 156, 60, (10, 6)); vput(m, 'LampPost_3', 84, 236, (8, 6)); vput(m, 'LampPost_3', 232, 560, (8, 6)); vput(m, 'LampPost_3', 610, 420, (8, 6))
vput(m, 'LampPost_3', 716, 600, (8, 6)); vput(m, 'Bench_1', 904, 330, (12, 18)); vput(m, 'Bench_1', 500, 318, (12, 18))
vput(m, 'Crate_Medium_Closed', 300, 640, (14, 9)); vput(m, 'Sack_3', 244, 644, (12, 6)); vput(m, 'Chopped_Tree_1', 520, 660, (20, 10)); vput(m, 'HayStack_2', 770, 560, (24, 12))
occupied = lambda x, y, r=22: any(abs(x - c[0] - c[2] / 2) < c[2] / 2 + r and abs(y - c[1] - c[3] / 2) < c[3] / 2 + r * .6 for c in m.cols)
on = lambda mk, x, y: mk[min(m.GH - 1, max(0, round(y / T))), min(m.GW - 1, max(0, round(x / T)))]
clear = [(270, 664, 60), (880, 340, 60), (660, 250, 90), (120, 40, 50)]
def free(x, y, r=20):
    if any(on(road2, x + dx, y + dy) or on(wat, x + dx, y + dy) for dx in (-r, 0, r) for dy in (-10, 0, 8)): return False
    if any(math.hypot(x - cx, y - cy) < cr for cx, cy, cr in clear): return False
    if 452 < y < 520 and x > 290: return False
    if x > 366 and y < 290: return False
    return not occupied(x, y)
n = 0; tries = 0
while n < 120 and tries < 9000:
    tries += 1
    edge = rr.random() < .45
    x, y = (rr.choice([rr.randint(8, 70), rr.randint(890, 952)]), rr.randint(40, 716)) if edge else (rr.randint(20, 940), rr.randint(60, 716))
    if rr.random() < .3: y = rr.randint(650, 716)
    k = 'Tree_Emerald_%d' % rr.randint(1, 4)
    if not free(x, y, 18): continue
    if any(i['k'].startswith('Tree') and abs(i['x'] - x) < 26 and abs(i['y'] - y) < 16 for i in m.items): continue
    vput(m, k, x, y, (14, 9)); n += 1
for _ in range(46):
    x, y = rr.randint(20, 940), rr.randint(60, 700); k = rr.choice(['Bush_Emerald_1', 'Bush_Emerald_3', 'Bush_Emerald_5', 'Bush_Emerald_6', 'Bush_Emerald_7', 'Rock_Brown_4', 'Rock_Brown_6', 'Rock_Brown_9', 'Rock_Brown_1'])
    if free(x, y, 14): vput(m, k, x, y, {'Bush_Emerald_1': (26, 10), 'Bush_Emerald_3': (18, 10), 'Rock_Brown_4': (20, 10), 'Rock_Brown_1': (22, 7)}.get(k))
for x, y in [(308, 470), (322, 492), (296, 486)]: vput(m, 'Rock_Brown_4', x, y, (20, 10))
m.watercols(wat, BR)
m.cols += [[0, 0, 92, 8], [148, 0, 240, 8], [0, 0, 6, 720], [954, 200, 6, 520], [0, 714, 960, 6], [GX - 24, 206, 48, 4]]
m.cols = [c for c in m.cols if not (c[1] >= 204 and c[1] < 270 and c[0] < GX + 24 and c[0] + c[2] > GX - 24 and c[3] == T)] + \
         [[c[0], c[1], GX - 26 - c[0], c[3]] for c in m.cols if c[3] == T and 204 <= c[1] < 270 and c[0] < GX - 26 < c[0] + c[2]] + \
         [[GX + 26, c[1], c[0] + c[2] - GX - 26, c[3]] for c in m.cols if c[3] == T and 204 <= c[1] < 270 and c[0] < GX + 26 < c[0] + c[2]]
m.shadows(extra=m.flat)
m.preview('pv_road.png', 'dbg_road.png')
m.reach((120, 30), {'gate': (GX, 280), 'camp': (290, 690), 'lookout': (880, 360), 'upper bridge': (386, 342), 'lower bridge': (426, 604), 'steps': (652, 500)}, extra_block=[[GX - 24, 262, 48, 8]])
m.reach((120, 30), {'gate': (GX, 214)})
DATA = {'road': export(m, 'road', {'bridge': {'x': GX, 'y0': 206, 'y1': 274, 'w': 44}, 'fall': [wx, 466, 30, 44], 'water': [[376, 216, 584, 44], [352, 264, 60, 200], [56, 612, 96, 54]]})}

# drawbridge deck (planks with iron bands), lowered length 68
dk = Image.new('RGBA', (44, 68)); dd = ImageDraw.Draw(dk)
dd.rectangle([0, 0, 43, 67], fill=(150, 108, 66, 255))
for x in range(0, 44, 8): dd.line([x, 0, x, 67], fill=(108, 74, 44, 255)); dd.line([x + 1, 0, x + 1, 67], fill=(176, 132, 84, 255))
for y in (6, 34, 60): dd.rectangle([0, y, 43, y + 3], fill=(86, 88, 96, 255)); dd.line([0, y, 43, y], fill=(140, 144, 152, 255))
dd.rectangle([0, 0, 43, 67], outline=(58, 44, 36, 255)); dd.rectangle([1, 64, 42, 66], fill=(96, 66, 40, 255))
OUT['drawdeck'] = dk

# ================================================================= ROYAL GARDEN (800x640)
m = Map(800, 640, 9); m.fill(GRASS, True)
fl = m.mask(); wat = m.mask()
m.path(fl, [(0, 336), (720, 336)], 1); m.path(fl, [(400, 110), (400, 580)], 1)
for a_ in range(0, 360, 5): m.path(fl, [(400 + 86 * math.cos(math.radians(a_)), 344 + 62 * math.sin(math.radians(a_)))] * 2, 1)
m.path(fl, [(180, 336), (180, 180), (300, 180)], 0); m.path(fl, [(400, 500), (620, 500)], 0); m.path(fl, [(600, 336), (600, 240)], 0); m.path(fl, [(180, 336), (180, 520)], 0)
m.rect(fl, 580, 186, 640, 240)
m.ell(wat, 620, 520, 96, 54)
fl &= ~wat
m.layer(fl, FLAG, flip=False); m.layer(wat, MOAT); m.tone(10)
wall = S['wall']; x = -8
while x < 800: m.ground.paste(wall, (x, 100 - wall.height), wall); x += wall.width - 2
m.shade(0, 100, 800, 116, .6); m.cols.append([0, 0, 800, 104])
HF = (.96, 10)
for x in range(20, 800, 39):
    if not 380 < x < 440: sput(m, 'hedge', x, 634, foot=HF)
for y in range(140, 640, 22):
    if not 316 < y < 372: sput(m, 'hedge', 20, y, foot=HF)
    sput(m, 'hedge', 780, y, foot=HF)
# rose garden (north-west room)
for x in range(96, 300, 39): sput(m, 'hedge', x, 140, foot=HF)
for y in (164, 188, 212, 236, 260): sput(m, 'hedge', 96, y, foot=HF); 
for x in (96, 135, 213, 252): sput(m, 'hedge', x, 290, foot=HF)
for i, (x, y) in enumerate([(140, 190), (222, 196), (140, 250), (224, 256), (262, 180), (262, 240)]): sput(m, 'rose_pink' if i % 2 else 'rose_white', x, y, foot=(.7, 8))
sput(m, 'urn', 182, 224, foot=(.6, 8))
# axis: queen's statue, rose arches, topiary
sput(m, 'queen', 400, 132, foot=(.8, 12)); sput(m, 'urn', 356, 136, foot=(.6, 8)); sput(m, 'urn', 444, 136, foot=(.6, 8))
for y in (236, 470): sput(m, 'rosearch', 400, y); m.cols += [[370, y - 8, 10, 8], [420, y - 8, 10, 8]]
sput(m, 'rosearch', 56, 352); m.cols += [[26, 344, 10, 8], [76, 344, 10, 8]]
for x, y in [(356, 200), (444, 200), (356, 430), (444, 430), (300, 300), (500, 300), (300, 400), (500, 400)]: sput(m, 'topiary_cone' if y in (200, 430) else 'topiary_ball', x, y, foot=(.6, 8))
OUT['gfountain_anim'] = Image.open('../anim/gfountain_frames.png').convert('RGBA')
m.put('cs_gfountain_anim', Image.open('../anim/gfountain_in.png').convert('RGBA'), 400, 374, False, (80, 34), {'a': 'cs_gfountain_flow'})
for x, y, f in [(310, 352, 0), (490, 352, 1)]: sput(m, 'gbench', x, y, bool(f), foot=(.9, 10))
# gazebo by the pond, cherry orchard, sundial lawn
sput(m, 'gazebo', 610, 236); m.cols += [[578, 222, 10, 12], [632, 222, 10, 12], [584, 196, 52, 8]]
for x, y in [(520, 170), (690, 160), (730, 250), (500, 250), (720, 420), (560, 600), (700, 596)]: sput(m, 'cherry', x, y, foot=(.22, 8))
sput(m, 'sundial', 180, 548, foot=(.7, 10)); sput(m, 'gbench', 120, 470, foot=(.9, 10)); sput(m, 'gbench', 250, 470, True, foot=(.9, 10))
for x, y in [(110, 580), (250, 580), (110, 420), (250, 420)]: sput(m, 'topiary_ball', x, y, foot=(.6, 8))
for x, y in [(330, 560), (470, 560), (330, 150), (470, 150), (740, 330)]: sput(m, 'rose_pink', x, y, foot=(.7, 8))
sput(m, 'urn', 740, 480, foot=(.6, 8)); sput(m, 'urn', 500, 520, foot=(.6, 8))
m.watercols(wat); m.cols += [[0, 100, 8, 216], [0, 372, 8, 268]]
m.shadows(alpha=.26)
m.preview('pv_garden.png', 'dbg_garden.png')
m.reach((30, 340), {'statue': (400, 150), 'gazebo': (610, 232), 'rose room': (180, 230), 'pond': (560, 470), 'sundial': (180, 566), 'south': (400, 600), 'east': (740, 350)})
DATA['garden'] = export(m, 'garden', {'water': [[540, 476, 160, 84]]})

# ================================================================= WALL WALK (960x420)
W, H = 960, 420; g = Image.new('RGBA', (W, H), (0, 0, 0, 255)); d = ImageDraw.Draw(g)
# north side: the courtyard and the keep seen from the wall
pav = Image.open(CS + 'ground_courtyard.png').convert('RGBA').crop((20, 170, 620, 300)).resize((960, 130), Image.BILINEAR)
g.paste(pav, (0, 0)); k2 = S['keep']; g.paste(k2, (480 - k2.width // 2, 150 - k2.height), k2)
for x in (700, 760, 830, 900): c = S['cherry']; g.paste(c, (x, 40 + (x * 7) % 30), c)
for x in (60, 130, 220): t = vil('Tree_Emerald_2'); g.paste(t, (x, 30 + (x * 5) % 34), t)
hz = Image.new('RGBA', (W, 130), (150, 170, 210, 70)); g.alpha_composite(hz, (0, 0))
# south side: outer wall face, moat, road and forest far below
wl = S['wall']; x = 0
while x < W: g.paste(wl.crop((0, 14, wl.width, 60)), (x, 296)); x += wl.width - 2
for ty in range(342, 376, 16):
    for tx in range(0, W, 16): g.paste(random.choice(MOAT.full), (tx, ty))
for ty in range(374, 420, 16):
    for tx in range(0, W, 16): g.paste(random.choice(GRASS.full), (tx, ty))
d.rectangle([458, 342, 502, 380], fill=(150, 108, 66, 255)); d.rectangle([458, 342, 502, 380], outline=(58, 44, 36, 255))
d.rectangle([462, 380, 498, 420], fill=(217, 160, 102, 255))
for x in range(10, W, 44):
    if abs(x - 480) > 60: t = vil('Tree_Emerald_%d' % (1 + x % 4)).resize((32, 40), Image.NEAREST); g.paste(t, (x, 384), t)
hz = Image.new('RGBA', (W, 124), (150, 170, 210, 80)); g.alpha_composite(hz, (0, 296))
a = np.array(g).astype(float)
for y in range(296, 344): a[y, :, :3] *= .9 - .3 * (y - 296) / 48
g = Image.fromarray(np.clip(a, 0, 255).astype('uint8')); d = ImageDraw.Draw(g)
# walkway
fs = Image.open(CS + 'floor_stone.png').convert('RGBA')
def floor(x0, y0, x1, y1):
    for ty in range(y0, y1, fs.height):
        for tx in range(x0, x1, fs.width): g.paste(fs.crop((0, 0, min(fs.width, x1 - tx), min(fs.height, y1 - ty))), (tx, ty))
ST = (176, 170, 150); STD = (128, 122, 106); STL = (212, 208, 190); OL = (58, 44, 36)
def merlons(x0, x1, y, hgt=14, face=8):
    """parapet seen from above: a row of blocks with a lit top and a front face"""
    d.rectangle([x0, y + hgt - 4, x1, y + hgt + face], fill=STD + (255,)); d.line([x0, y + hgt + face, x1, y + hgt + face], fill=OL + (255,))
    x = x0
    while x < x1:
        d.rectangle([x, y, min(x1, x + 13), y + hgt], fill=STL + (255,)); d.rectangle([x, y + hgt - 4, min(x1, x + 13), y + hgt + 4], fill=ST + (255,))
        d.rectangle([x, y, min(x1, x + 13), y + hgt + 4], outline=OL + (255,)); x += 22
floor(0, 128, W, 252); floor(392, 104, 568, 290)
def tower_top(cx, cy, r):
    d.ellipse([cx - r - 6, cy - r * .8 - 6, cx + r + 6, cy + r * .8 + 10], fill=OL + (255,))
    d.ellipse([cx - r - 4, cy - r * .8 - 4, cx + r + 4, cy + r * .8 + 8], fill=STD + (255,))
    msk = Image.new('L', (W, H), 0); ImageDraw.Draw(msk).ellipse([cx - r + 6, cy - r * .8 + 6, cx + r - 6, cy + r * .8 - 6], fill=255)
    fl2 = Image.new('RGBA', (W, H));
    for ty in range(0, H, fs.height):
        for tx in range(0, W, fs.width): fl2.paste(fs, (tx, ty))
    g.paste(fl2, (0, 0), msk)
    for i in range(18):
        an = i / 18 * 2 * math.pi; mx, my = cx + (r - 1) * math.cos(an), cy + (r * .8 - 1) * math.sin(an)
        d.rectangle([mx - 6, my - 7, mx + 6, my + 5], fill=STL + (255,)); d.rectangle([mx - 6, my + 1, mx + 6, my + 7], fill=ST + (255,)); d.rectangle([mx - 6, my - 7, mx + 6, my + 7], outline=OL + (255,))
    # trapdoor with a ladder
    d.rectangle([cx - 15, cy - 44, cx + 15, cy - 20], fill=(34, 26, 30, 255)); d.rectangle([cx - 15, cy - 44, cx + 15, cy - 20], outline=(120, 84, 50, 255))
    for yy in range(int(cy) - 40, int(cy) - 20, 5): d.line([cx - 8, yy, cx + 8, yy], fill=(150, 108, 66, 255))
    d.line([cx - 8, cy - 43, cx - 8, cy - 21], fill=(150, 108, 66, 255)); d.line([cx + 8, cy - 43, cx + 8, cy - 21], fill=(150, 108, 66, 255))
PLAT = [(22, 170), (392, 568), (790, 938)]
for x0, x1 in PLAT: floor(x0, 104, x1, 290)
xs = [0, 22, 170, 392, 568, 790, 938, W]
for x0, x1 in ((170, 392), (568, 790)): merlons(x0, x1, 110); merlons(x0, x1, 250); d.rectangle([x0, 272, x1, 296], fill=STD + (255,))
for x0, x1 in PLAT:
    merlons(x0, x1, 88); merlons(x0, x1, 288)
    for x in (x0 - 4, x1 - 2): d.rectangle([x, 96, x + 6, 124], fill=ST + (255,)); d.rectangle([x, 262, x + 6, 310], fill=ST + (255,)); d.rectangle([x, 96, x + 6, 124], outline=OL + (255,)); d.rectangle([x, 262, x + 6, 310], outline=OL + (255,))
def hatch(cx, cy):
    d.rectangle([cx - 15, cy - 12, cx + 15, cy + 12], fill=(34, 26, 30, 255)); d.rectangle([cx - 15, cy - 12, cx + 15, cy + 12], outline=(120, 84, 50, 255))
    for yy in range(cy - 8, cy + 12, 5): d.line([cx - 8, yy, cx + 8, yy], fill=(150, 108, 66, 255))
    d.line([cx - 8, cy - 11, cx - 8, cy + 11], fill=(150, 108, 66, 255)); d.line([cx + 8, cy - 11, cx + 8, cy + 11], fill=(150, 108, 66, 255))
hatch(96, 136); hatch(864, 136)
d.rectangle([0, 96, 17, 310], fill=STD + (255,)); d.rectangle([942, 96, 960, 310], fill=STD + (255,))
wm = Map(W, H, 5); wm.ground = g
wm.cols += [[170, 0, 222, 132], [568, 0, 222, 132], [170, 248, 222, 172], [568, 248, 222, 172], [0, 0, W, 110], [0, 286, W, 134], [0, 0, 24, H], [W - 24, 0, 24, H]]
wm.cols += [[81, 124, 30, 24], [849, 124, 30, 24]]
def wput(n, x, y, flip=False, foot=None, **kw): OUT[n] = S[n]; wm.put('cs_' + n, S[n], x, y, flip, foot, kw or None)
wput('ballista', 480, 276, foot=(.8, 10)); wput('cannonballs', 426, 276, foot=(.8, 8)); wput('arrowcrates', 536, 274, foot=(.8, 10))
wput('telescope', 906, 232, foot=(.4, 6)); wput('stool', 60, 236, foot=(.5, 6)); wput('spears', 300, 150, foot=(.8, 6)); wput('arrowbarrel', 334, 152, foot=(.7, 8))
wput('spears', 660, 150, True, foot=(.8, 6)); wput('arrowbarrel', 626, 152, foot=(.7, 8)); wput('arrowcrates', 232, 244, foot=(.8, 10)); wput('cannonballs', 720, 244, foot=(.8, 8))
wm.shadows(alpha=.26); wm.preview('pv_walls.png', 'dbg_walls.png')
wm.reach((96, 190), {'east tower': (864, 190), 'gatehouse': (480, 200), 'telescope': (890, 250)})
DATA['walls'] = export(wm, 'walls', {'hatch': [[96, 156], [864, 156]]})

# courtyard: open a garden gate in the east wall
cy_ = Image.open(CS + 'ground_courtyard.png').convert('RGBA'); dc = ImageDraw.Draw(cy_)
dc.rectangle([612, 200, 640, 246], fill=(190, 182, 160, 255))
for x in range(612, 640, 14): dc.line([x, 200, x, 246], fill=(160, 152, 132, 255))
dc.rectangle([612, 192, 640, 200], fill=(120, 112, 100, 255)); dc.rectangle([612, 246, 640, 252], fill=(120, 112, 100, 255))
dc.rectangle([612, 192, 640, 200], outline=OL + (255,)); dc.rectangle([612, 246, 640, 252], outline=OL + (255,))
cy_.convert('RGB').save('ground_courtyard.png')
for n in ('tower', 'banner_anim'): pass
OUT['tower'] = S['tower']
bn = Image.open('../anim/banner_frames.png').convert('RGBA'); OUT['banner_anim'] = bn.resize((bn.width // 2, bn.height // 2), Image.BOX)
al = OUT['banner_anim'].split()[3].point(lambda v: 255 if v > 110 else 0); OUT['banner_anim'].putalpha(al)
for n, im in OUT.items(): im.save('o_%s.png' % n)
json.dump({'maps': DATA, 'sizes': {n: [im.width, im.height] for n, im in OUT.items()}}, open('castle_maps.json', 'w'), separators=(',', ':'))
for n in ('grass', 'moat', 'flag'): {'grass': GRASS, 'moat': MOAT, 'flag': FLAG}[n].atlas().save('tileset_%s.png' % n)
print(sorted(OUT))

# ---------------------------------------------------------------- pack
import glob
D = json.load(open('castle_maps.json'))
R = ROOT; OUT = R + 'assets/castle/'
for n in D['sizes']: shutil.copy('o_%s.png' % n, OUT + n + '.png')
for n in ('road', 'garden', 'walls', 'courtyard'): shutil.copy('ground_%s.png' % n, OUT + 'ground_%s.png' % n)
for n in ('grass', 'moat', 'flag'): shutil.copy('tileset_%s.png' % n, OUT + 'tileset_%s.png' % n)
out = ["// Castle map art (generated), embedded so the game also runs from file://", "window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};", "window.CASTLE_ASSET_SIZES = {};"]
for f in sorted(glob.glob(OUT + '*.png')):
    n = os.path.basename(f)[:-4]; im = Image.open(f)
    if n.startswith('tileset_'): continue
    out.append("window.GAME_ASSETS_BASE64['cs_%s'] = 'data:image/png;base64,%s';" % (n, base64.b64encode(open(f, 'rb').read()).decode()))
    out.append("window.CASTLE_ASSET_SIZES['%s'] = { w: %d, h: %d };" % (n, im.width, im.height))
fi = json.load(open('../raw/fire.json'))
out.append("window.CASTLE_FIRE = " + json.dumps(fi, separators=(',', ':')) + ";")
open(R + 'js/castle_assets.js', 'w').write('\n'.join(out) + '\n')
L = ['/* Castle grounds: layout data of the road, the wall walk and the royal garden (generated by tools/mapgen/castle; safe to edit by hand). */', 'window.CASTLE_MAPS = { maps: {} };']
for name, d in D['maps'].items(): L.append(write_map('CASTLE_MAPS.maps.' + name, d))
open(R + 'js/maps/data/castle_maps.js', 'w').write('\n'.join(L) + '\n')
print('castle packed: assets/castle, js/castle_assets.js, js/maps/data/castle_maps.js')
