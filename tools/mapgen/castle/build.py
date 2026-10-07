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

# ================================================================= TRAINING YARD (832x464)
# Laid out after a reference picture (1024x572): positions below are in reference pixels and scaled by K.
K = 0.8125; P = lambda x, y: (round(x * K), round(y * K))
TG = Tileset('../raw/ts_tgrass.png'); TC = Tileset('../raw/ts_tcobble.png')        # kept as Tiled tilesets; the yard itself is painted below
for n in 'wall door tent dummy target swords spears armor hay3 hay crates barrel arrowpost bows quintain'.split(): S['t_' + n] = load('../raw/t_%s.png' % n)
for n in ('tower', 'ctower', 'wall2'): S['t_' + n] = load('../raw/t_%s.png' % n)
# pull the props towards the palette of the reference so wood, straw and steel sit in the same family as the ground
REFPAL = np.array([(0x59, 0x50, 0x44), (0x8b, 0x7e, 0x69), (0x3b, 0x38, 0x2d), (0xa6, 0x84, 0x57), (0x62, 0x60, 0x50), (0x22, 0x18, 0x0e), (0x54, 0x40, 0x33), (0x71, 0x6b, 0x5a), (0xa9, 0x9a, 0x79),
                   (0x7b, 0x6f, 0x5f), (0x8c, 0x6d, 0x50), (0xa1, 0x87, 0x5e), (0x97, 0x84, 0x5a), (0xc9, 0xa2, 0x4a), (0xe0, 0xc0, 0x68), (0xa8, 0x3c, 0x2e), (0xd8, 0xd2, 0xc0), (0x9a, 0x9a, 0x94), (0x6e, 0x4a, 0x30), (0xc4, 0xb4, 0x8c)], float)
def harmonize(im, k=.45):
    a = np.array(im).astype(float); rgb = a[..., :3]; dist = ((rgb[:, :, None, :] - REFPAL[None, None]) ** 2).sum(-1); near = REFPAL[dist.argmin(-1)]
    a[..., :3] = rgb * (1 - k) + near * k; return Image.fromarray(a.astype('uint8'))
for n in 'door tent dummy target swords spears armor hay3 hay crates barrel arrowpost bows quintain'.split(): S['t_' + n] = harmonize(S['t_' + n])
m = Map(832, 464, 21)
# ---- ground painted pixel by pixel in the colours of the reference (clean flats, organic edges, no square tiles)
HX = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
GR, GR_L, GR_D, GR_E = HX('#62803a'), HX('#728344'), HX('#55703a'), HX('#4c6431')
DT, DT_D, DT_L, DT_S = HX('#a68558'), HX('#97784e'), HX('#b3936a'), HX('#8c6d50')
ST = [HX('#868170'), HX('#918b7b'), HX('#7b6f5f'), HX('#a09a88')]; ST_S, ST_G = HX('#595044'), HX('#5c6a40')
Wm, Hm = m.W, m.H; YY, XX = np.mgrid[0:Hm, 0:Wm].astype(float)
def blob(lst):
    f = np.full((Hm, Wm), 9.0)
    for cx, cy, rx, ry in lst: f = np.minimum(f, ((XX - cx * K) / (rx * K)) ** 2 + ((YY - cy * K) / (ry * K)) ** 2)
    return f
wob = (noise(Wm, Hm, 44, 61) - .5) * .5 + (noise(Wm, Hm, 14, 62) - .5) * .26 + (noise(Wm, Hm, 5, 63) - .5) * .1
dirt = blob([(250, 370, 178, 150), (350, 215, 112, 42), (720, 392, 178, 122), (700, 250, 112, 46), (505, 290, 72, 40), (880, 300, 60, 122), (150, 250, 82, 52)]) + wob < 1
dirt &= ~(blob([(250, 345, 34, 26), (470, 400, 44, 60), (745, 430, 40, 30), (700, 318, 30, 18), (400, 470, 30, 30), (560, 440, 30, 46)]) + wob * .8 < 1)
rng = np.random.RandomState(7)
g = np.zeros((Hm, Wm, 3), float); g[:] = GR; g[dirt] = DT
wear = noise(Wm, Hm, 30, 81) * .6 + noise(Wm, Hm, 11, 82) * .4                       # trodden (lighter) and damp (darker) patches, as flat shapes
g[dirt & (wear > .60)] = HX('#af8e60'); g[dirt & (wear < .37)] = HX('#9d7c51')
lush = noise(Wm, Hm, 36, 83) * .6 + noise(Wm, Hm, 12, 84) * .4
g[(~dirt) & (lush > .62)] = HX('#6a8840'); g[(~dirt) & (lush < .36)] = HX('#5b7837')
r1 = rng.rand(Hm, Wm)
g[(~dirt) & (r1 < .010)] = GR_L; g[(~dirt) & (r1 > .992)] = GR_D
g[dirt & (r1 < .012)] = DT_D; g[dirt & (r1 > .993)] = DT_L
# tufts of grass (little "v") and blades creeping over the dirt along the edge
def nb(mk, dx, dy): return np.roll(np.roll(mk, dy, 0), dx, 1)
edge_g = (~dirt) & (nb(dirt, 1, 0) | nb(dirt, -1, 0) | nb(dirt, 0, 1) | nb(dirt, 0, -1))          # grass pixels touching dirt
edge_g2 = (~dirt) & ~edge_g & (nb(edge_g, 1, 0) | nb(edge_g, -1, 0) | nb(edge_g, 0, 1) | nb(edge_g, 0, -1))
g[edge_g] = GR_E; g[edge_g2 & (rng.rand(Hm, Wm) < .6)] = GR_D
g[dirt & nb(~dirt, 0, 1) & ~nb(dirt, 0, 1) == True] = g[dirt & nb(~dirt, 0, 1) & ~nb(dirt, 0, 1) == True]
under = dirt & nb(~dirt, 0, 1)                                                                     # dirt right below grass: a thin shadow gives the turf some thickness
g[under] = DT_S
ys, xs = np.nonzero(edge_g)
for i in rng.choice(len(ys), len(ys) // 5, replace=False):
    y, x = ys[i], xs[i]; dx, dy = rng.randint(-2, 3), rng.randint(-2, 3)
    for t in range(rng.randint(1, 4)):
        yy, xx = y + dy * t // 2, x + dx * t // 2
        if 0 <= yy < Hm and 0 <= xx < Wm and dirt[yy, xx]: g[yy, xx] = GR_E if t else GR
for _ in range(1500):
    x, y = rng.randint(3, Wm - 4), rng.randint(3, Hm - 4)
    if not dirt[y - 2:y + 3, x - 2:x + 3].any():
        c = HX('#7c9448') if rng.rand() < .6 else GR_E; g[y, x] = c; g[y - 1, x - 1] = c; g[y - 1, x + 1] = c
        if rng.rand() < .25: g[y - 2, x - 2] = c; g[y - 2, x + 2] = c; g[y - 2, x] = c
for _ in range(110):                                                                 # tiny wild flowers
    x, y = rng.randint(3, Wm - 4), rng.randint(130, Hm - 4)
    if not dirt[y - 3:y + 4, x - 3:x + 4].any():
        c = [(232, 226, 200), (226, 196, 92), (214, 120, 110)][rng.randint(3)]; g[y, x] = c; g[y - 1, x] = c; g[y, x + 1] = c; g[y + 1, x] = GR_E
for _ in range(260):                                                                               # pebbles and scuffs on the dirt
    x, y = rng.randint(2, Wm - 3), rng.randint(2, Hm - 3)
    if dirt[y - 1:y + 2, x - 1:x + 3].all(): g[y, x:x + 2] = DT_L if rng.rand() < .5 else DT_D; g[y + 1, x:x + 2] = DT_S if rng.rand() < .3 else g[y + 1, x:x + 2]
# cobbled path: separate stones, dense in the middle and thinning out into the grass
occ = np.zeros((Hm, Wm), bool)
def path_stones(x0, ya, yb, half=21):
    for _ in range(int((yb - ya) * 9)):
        y = rng.randint(ya, yb); t = (y - ya) / max(1, yb - ya); fade = min(1, 4 * min(t, 1 - t) + .25)
        dx = rng.normal(0, half * .5); x = int(x0 + dx + 5 * math.sin(y * .05))
        if abs(dx) > half or rng.rand() > fade * (1 - (abs(dx) / half) ** 2 * .6): continue
        w, h = rng.randint(5, 12), rng.randint(4, 8)
        if y + h + 2 >= Hm or x < 2 or x + w + 2 >= Wm or occ[y - 1:y + h + 2, x - 1:x + w + 2].any(): continue
        occ[y:y + h + 1, x:x + w + 1] = True; c = ST[rng.randint(len(ST))]
        g[y:y + h, x:x + w] = c; g[y, x] = g[y - 1, x]; g[y, x + w - 1] = g[y - 1, x + w - 1]; g[y + h - 1, x] = ST_S       # rounded corners
        if rng.rand() < .22: g[y + h - 2:y + h, x + 1:x + 3] = HX('#6f8a3e')                                           # moss
        g[y + h, x + 1:x + w] = ST_S; g[y + 1:y + h, x + w] = ST_S; g[y, x + 1:x + w - 1] = tuple(min(255, v + 14) for v in c)
        if w > 5 and rng.rand() < .4: g[y + h // 2, x + 2:x + w - 2] = tuple(v - 12 for v in c)
core = lambda x0, ya, yb: None
for x0, ya, yb in [(round(520 * K), 108, round(238 * K)), (round(522 * K), round(383 * K), Hm - 2)]:
    band = (np.abs(XX - x0 - 5 * np.sin(YY * .05)) < 13 + (noise(Wm, Hm, 9, 71) - .5) * 10) & (YY >= ya + 4) & (YY <= yb - 8)
    g[band & (rng.rand(Hm, Wm) < .8)] = ST_G; path_stones(x0, ya, yb)
m.ground = Image.fromarray(np.clip(g, 0, 255).astype('uint8')).convert('RGBA'); d = m.draw()
# ---- stone walls: brick face with battlements, wall-top walkway behind them, towers with slanted side faces
WL = S['t_wall2']; BR_ = WL.crop((2, 16, WL.width - 2, WL.height - 2)); ME = WL.crop((2, 0, WL.width - 2, 16))
def bricks(x0, y0, x1, y1, k=1.0):
    t = ImageEnhance.Brightness(BR_).enhance(k) if k != 1.0 else BR_
    for ty in range(y0, y1, t.height):
        for tx in range(x0, x1, t.width): m.ground.paste(t.crop((0, 0, min(t.width, x1 - tx), min(t.height, y1 - ty))), (tx, ty))
def merl(x0, x1, y, k=1.0):
    t = ImageEnhance.Brightness(ME).enhance(k) if k != 1.0 else ME
    for tx in range(x0, x1, t.width): c = t.crop((0, 0, min(t.width, x1 - tx), t.height)); m.ground.paste(c, (tx, y), c)
G1, G2, G3, GO = HX('#918a7f'), HX('#867e74'), HX('#5c584f'), HX('#22180e')
WY = 106                                                             # foot of the north wall
bricks(0, 0, 832, 12, 1.22); bricks(0, 24, 832, WY); merl(0, 832, 10)
d.line([0, WY, 832, WY], fill=GO + (255,))
def shade_rows(x0, x1, y0, n, k0):                                   # soft shadow below a wall (blended, never a black band)
    a = np.array(m.ground).astype(float)
    for i in range(n): a[y0 + i, x0:x1, :3] *= k0 + (1 - k0) * (i / n) ** .8
    m.ground = Image.fromarray(a.astype('uint8'))
def shade_cols(x0, y0, y1, n, k0, dirn=1):
    a = np.array(m.ground).astype(float)
    for i in range(n): a[y0:y1, x0 + dirn * i, :3] *= k0 + (1 - k0) * (i / n) ** .8
    m.ground = Image.fromarray(a.astype('uint8'))
shade_rows(0, 832, WY + 1, 10, .66); d = m.draw()
for x in range(0, 832, 3):
    if rng.rand() < .5: hgt = rng.randint(1, 5); d.line([x, WY - hgt, x, WY + 1], fill=(GR_E if rng.rand() < .5 else HX('#6a8840')) + (255,))
WB = load('../raw/t_wbanner.png'); px_ = WB.load(); WBG = WB.copy(); pg_ = WBG.load()
for yy in range(WB.height):
    for xx in range(WB.width):
        r_, g_, b_, a_ = px_[xx, yy]
        if a_ and r_ > g_ * 1.6 and r_ > b_ * 1.6: pg_[xx, yy] = (int(r_ * .45), int(r_ * .62), int(r_ * .28), a_)
for bx, im in ((192, WBG), (858, WB), (300, WB), (745, WBG)): x, y = P(bx, 96); m.ground.paste(im, (x - im.width // 2, y - im.height), im)
dr = S['t_door']; x, y = P(520, 131); m.ground.paste(dr, (x - dr.width // 2, WY + 2 - dr.height), dr)
ds = dr.resize((36, 39), Image.NEAREST); x, y = P(243, 135); m.ground.paste(ds, (x - 18, WY + 2 - 39), ds)
# side walls with relief: outer merlons, paved walkway, inner merlons and the inner FACE of the wall dropping to the yard
SWY = 120; FACE_W = 14
def sidewall(x0, x1, inner):                      # inner: +1 the yard is to the right (west wall), -1 to the left (east wall)
    d2 = m.draw()
    top0, top1 = (x0, x1 - FACE_W) if inner > 0 else (x0 + FACE_W, x1)                 # the top surface; the rest is the face
    bricks(top0, SWY, top1, 464, 1.24)
    d2 = m.draw()
    for xx in (top0, top1 - 9):                                                      # two rows of merlons along the walkway
        d2.rectangle([xx, SWY, xx + 8, 464], fill=HX('#6c675e') + (255,))
        for yy in range(SWY + 6, 464, 18):
            d2.rectangle([xx, yy, xx + 8, yy + 11], fill=G1 + (255,)); d2.rectangle([xx, yy, xx + 8, yy + 11], outline=GO + (255,))
            d2.line([xx + 1, yy + 1, xx + 7, yy + 1], fill=HX('#b4aa94') + (255,)); d2.line([xx + 1, yy + 10, xx + 7, yy + 10], fill=G3 + (255,))
            d2.rectangle([xx, yy + 12, xx + 8, yy + 14], fill=HX('#4e4b43') + (255,))                      # the merlon's own shadow: it stands up from the walkway
    sx_ = top0 + 10 if inner > 0 else top1 - 13
    d2.rectangle([sx_, SWY, sx_ + 2, 464], fill=HX('#7a766c') + (255,))                                 # shadow of the lit-side parapet across the paving
    # inner face: bricks in perspective (courses slant down towards the yard), darker on the shaded side
    fx0, fx1 = (top1, x1) if inner > 0 else (x0, top0)
    kf = .60 if inner > 0 else .86
    face = ImageEnhance.Brightness(BR_).enhance(kf); strip = Image.new('RGBA', (FACE_W, 464 - SWY + FACE_W))
    for ty in range(0, strip.height, face.height): strip.paste(face.crop((0, 0, FACE_W, face.height)), (0, ty))
    sl = .7 * inner
    strip = strip.transform(strip.size, Image.AFFINE, (1, 0, 0, sl, 1, -FACE_W if inner > 0 else 0), Image.NEAREST)
    m.ground.paste(strip.crop((0, 0, FACE_W, 464 - SWY)), (fx0, SWY))
    d2 = m.draw()
    d2.line([top1 if inner > 0 else top0, SWY, top1 if inner > 0 else top0, 464], fill=GO + (255,))      # edge between top and face
    d2.line([x1 if inner > 0 else x0, SWY, x1 if inner > 0 else x0, 464], fill=GO + (255,))                # foot of the wall
    d2.line([x0 if inner > 0 else x1, SWY, x0 if inner > 0 else x1, 464], fill=GO + (255,))
LW, RW = 52, 46
sidewall(0, LW, 1); sidewall(831 - RW, 831, -1)
shade_cols(LW + 1, SWY, 464, 12, .60, 1); shade_cols(831 - RW - 1, SWY, 464, 5, .86, -1); d = m.draw()
# towers (painted: the hero never walks behind them); their shadow falls on the yard
TW_ = S['t_tower']; CT_ = S['t_ctower']; TBASE = WY + 18; CBASE = WY + 30
m.flat = []
for cx in (round(407 * K), round(632 * K)): m.ground.paste(TW_, (cx - TW_.width // 2, TBASE - TW_.height), TW_); m.flat.append((TW_, cx, TBASE)); m.cols.append([cx - 46, 0, 92, TBASE - 4])
for cx, fl in ((59, False), (773, True)):
    t = CT_.transpose(Image.FLIP_LEFT_RIGHT) if fl else CT_; m.ground.paste(t, (cx - t.width // 2, CBASE - t.height), t); m.flat.append((t, cx, CBASE)); m.cols.append([cx - 56, 0, 112, CBASE - 4])
# low wall on both sides of the south gate, as blocks with volume: paved top, merlons, front face and a slanted end towards the gate
STUBS = [(376, 462, 1), (627, 760, -1)]
for a, b, side in STUBS:
    x0, x1 = round(a * K), round(b * K); yt = 426                                    # yt: top of the block
    d = m.draw(); d.rectangle([x0 - 1, yt - 1, x1, 464], fill=GO + (255,))
    bricks(x0, yt, x1, yt + 8, 1.24)                                                 # paved top of the block
    d = m.draw(); d.rectangle([x0, yt + 8, x1 - 1, yt + 24], fill=HX('#4e4b43') + (255,))   # the walkway in shadow seen through the crenels
    bricks(x0, yt + 22, x1, 464, .96); merl(x0, x1, yt + 7, 1.08)                    # front face under a row of merlons
    sw = 8; ex = x1 - sw if side > 0 else x0                                         # end face towards the gate, darker on the shaded side
    end = ImageEnhance.Brightness(BR_).enhance(.58 if side > 0 else .82)
    for ty in range(yt + 6, 464, end.height): m.ground.paste(end.crop((0, 0, sw, min(end.height, 464 - ty))), (ex, ty))
    d = m.draw(); d.line([ex if side > 0 else ex + sw, yt + 6, ex if side > 0 else ex + sw, 464], fill=GO + (255,)); d.rectangle([x0 - 1, yt - 1, x1, 464], outline=GO + (255,))
    m.cols.append([x0, yt + 10, x1 - x0, 464 - yt - 10])
x1s = round(STUBS[0][1] * K); shade_cols(x1s + 1, 430, 464, 10, .62, 1); d = m.draw()
# shooting line and spent arrows on the range
x, _ = P(782, 0)
for yy in range(round(296 * K), round(505 * K), 10): d.line([x, yy, x, yy + 5], fill=HX('#8c6d50') + (255,))
for ax, ay in [(818, 300), (870, 300), (818, 345), (832, 390), (860, 432), (905, 345), (880, 480), (812, 478)]:
    x, y = P(ax, ay); d.line([x, y, x + 12, y], fill=(92, 60, 34, 255)); d.point([(x + 12, y - 1), (x + 12, y + 1), (x + 13, y)], fill=(180, 180, 176, 255)); d.line([x, y - 1, x + 1, y - 1], fill=(200, 60, 50, 255))
# ---- wooden pieces drawn here: fences, logs, benches, racks
W1, W2, W3 = HX('#a88458'), HX('#8c6d50'), HX('#544033')
def canvas(w, h): im = Image.new('RGBA', (w, h)); return im, ImageDraw.Draw(im)
def piece(name, im): S[name] = im; return im
WOODPAL = np.array([HX('#a88458'), HX('#8c6d50'), HX('#6e4a30'), HX('#544033'), HX('#c4a070'), HX('#3b382d'), HX('#22180e'), HX('#b8935f'), HX('#7b5c3e')], float)
def woodify(im, k=.75):
    a = np.array(im).astype(float); rgb = a[..., :3]; dist = ((rgb[:, :, None, :] - WOODPAL[None, None]) ** 2).sum(-1); a[..., :3] = rgb * (1 - k) + WOODPAL[dist.argmin(-1)] * k
    return Image.fromarray(a.astype('uint8'))
def stretch(im, xa, xb, new_w):
    """keep both ends, repeat the columns xa..xb in the middle until the piece is new_w wide"""
    out = Image.new('RGBA', (new_w, im.height)); out.paste(im.crop((0, 0, xa, im.height)), (0, 0)); right = im.crop((xb, 0, im.width, im.height))
    x = xa; mid = im.crop((xa, 0, xb, im.height))
    while x < new_w - right.width: out.paste(mid.crop((0, 0, min(mid.width, new_w - right.width - x), im.height)), (x, 0)); x += mid.width
    out.paste(right, (new_w - right.width, 0)); return out
FN = woodify(load('../raw/t_fence.png')); col = (np.array(FN)[..., 3] > 0).sum(0); posts = col > col.max() * .8
runs = []; x0_ = None
for i, v in enumerate(list(posts) + [False]):
    if v and x0_ is None: x0_ = i
    if not v and x0_ is not None: runs.append((x0_, i)); x0_ = None
fa = FN.crop((0, 0, runs[0][1], FN.height)); rail = FN.crop((runs[0][1], 0, runs[1][0], FN.height)); fb = FN.crop((runs[-1][0], 0, FN.width, FN.height))
fh = Image.new('RGBA', (36, FN.height)); x = fa.width
while x < 36 - fb.width: fh.paste(rail, (x, 0)); x += rail.width
fh.paste(fa, (0, 0)); fh.paste(fb, (36 - fb.width, 0)); piece('t_fence_h', fh)
im, q = canvas(9, 38)
q.rectangle([3, 2, 5, 35], fill=W2 + (255,)); q.line([3, 2, 3, 35], fill=W1 + (255,)); q.line([2, 2, 2, 35], fill=GO + (255,)); q.line([6, 2, 6, 35], fill=GO + (255,))
for yy in (0, 30):
    q.rectangle([1, yy, 7, yy + 7], fill=W2 + (255,)); q.rectangle([1, yy, 7, yy + 7], outline=GO + (255,)); q.rectangle([2, yy + 1, 6, yy + 2], fill=HX('#c4a070') + (255,)); q.line([2, yy + 3, 2, yy + 6], fill=W1 + (255,)); q.line([6, yy + 3, 6, yy + 6], fill=W3 + (255,))
piece('t_fence_v', im)
LG = stretch(woodify(load('../raw/t_log.png')), 10, 18, 40); LGB = stretch(woodify(load('../raw/t_log_big.png')), 15, 28, 60)
def turned(deg):
    r = LGB.rotate(deg, Image.BICUBIC, expand=True); r = r.resize((round(r.width * .66), round(r.height * .66)), Image.BOX)
    r.putalpha(r.split()[3].point(lambda v: 255 if v > 120 else 0)); return r.crop(r.getbbox())
piece('t_log_h', LG); piece('t_log_v', turned(90)); piece('t_log_d1', turned(45)); piece('t_log_d2', turned(-45))
piece('t_bench_h', woodify(load('../raw/t_bench_h.png'), .5)); piece('t_bench_v', woodify(load('../raw/t_bench_v.png'), .7))
piece('t_tripod', woodify(load('../raw/t_tripod.png'), .45))
im, q = canvas(12, 40); q.rectangle([8, 0, 11, 39], fill=W2 + (255,)); q.rectangle([8, 0, 11, 39], outline=GO + (255,))
for yy in (2, 14, 26): q.arc([-6, yy, 8, yy + 11], 270, 90, fill=W1 + (255,), width=2); q.line([1, yy, 1, yy + 11], fill=(216, 200, 160, 255))
piece('t_bowrack', im)
def tput(n, rx, ry, flip=False, foot=None, **kw):
    x, y = P(rx, ry); OUT[n] = S[n]; m.put('cs_' + n, S[n], x, y, flip, foot, kw or None)
# ---- props, at the places of the reference
tput('t_hay3', 118, 168, foot=(.9, 16)); tput('t_hay', 92, 196, foot=(.9, 10)); tput('t_hay', 90, 392, foot=(.9, 10)); tput('t_hay', 116, 548, foot=(.9, 10))
tput('t_crates', 182, 166, foot=(.9, 10)); tput('t_barrel', 205, 166, foot=(.8, 8))
tput('t_tent', 305, 196, foot=(.86, 34)); tput('t_tent', 400, 196, True, foot=(.86, 34))
tput('t_quintain', 465, 186, foot=(.6, 8))
tput('t_armor', 582, 186, foot=(.8, 8)); tput('t_swords', 645, 190, foot=(.92, 12)); tput('t_armor', 710, 186, foot=(.8, 8)); tput('t_spears', 770, 190, foot=(.92, 12)); tput('t_armor', 832, 186, foot=(.8, 8))
tput('t_crates', 862, 176, foot=(.9, 10)); tput('t_crates', 892, 168, foot=(.9, 10))
for bx, by in [(920, 168), (946, 168), (913, 198), (948, 200), (953, 268), (955, 540), (958, 566), (932, 572)]: tput('t_barrel', bx, by, foot=(.8, 8))
tput('t_crates', 952, 238, foot=(.9, 10))
for dx, dy in [(110, 292), (165, 268), (217, 268), (135, 356), (198, 352), (130, 498), (226, 492)]: tput('t_dummy', dx, dy, foot=(.4, 6))
for bx, by in [(355, 238), (443, 238), (645, 236), (740, 236), (905, 556)]: tput('t_bench_h', bx, by, foot=(.96, 10))
for bx, by in [(603, 372), (603, 462)]: tput('t_bench_v', bx, by, foot=(.8, 56))
for cx, cy in [(360, 318), (360, 458)]:                                                    # two octagonal sparring rings of logs
    r = 60
    for i, key in enumerate(['t_log_h', 't_log_d2', 't_log_v', 't_log_d1', 't_log_h', 't_log_d2', 't_log_v', 't_log_d1']):
        an = -math.pi / 2 + i * math.pi / 4; lx, ly = cx + r * math.cos(an), cy + r * .92 * math.sin(an)
        x, y = P(lx, ly); OUT[key] = S[key]; im = S[key]; m.put('cs_' + key, im, x, y + im.height // 2, False, None)
tput('t_tripod', 463, 412, foot=(.5, 6)); tput('t_tripod', 463, 452, foot=(.5, 6))
for ax, ay in [(713, 352), (713, 412), (713, 482)]: tput('t_arrowpost', ax, ay, foot=(.5, 6))
tput('t_bows', 850, 282, foot=(.9, 10)); tput('t_bows', 820, 556, foot=(.9, 10))
TGT = S['t_target'].copy(); qd = ImageDraw.Draw(TGT)
for ax, ay in ((6, 12), (9, 17)): qd.line([ax - 6, ay, ax, ay], fill=(92, 60, 34, 255)); qd.point((ax - 6, ay - 1), fill=(200, 60, 50, 255))
S['t_target2'] = TGT
for i, ty in enumerate((316, 364, 410, 456, 502)): tput('t_target2' if i % 2 else 't_target', 932, ty, foot=(.7, 8))
for ry in (330, 390, 450): tput('t_bowrack', 962, ry, foot=(12, 30))
# the pen of the dummies (rails with posts, as in the picture)
def fence_h(rx0, rx1, ry):
    x0, _ = P(rx0, 0); x1, y = P(rx1, ry); x = x0
    while x < x1 - 8: OUT['t_fence_h'] = S['t_fence_h']; m.put('cs_t_fence_h', S['t_fence_h'], x + 18, y, False, (36, 6)); x += 36 - fb.width
def fence_v(rx, ry0, ry1):
    x, y0 = P(rx, ry0); _, y1 = P(rx, ry1); y = y0 + 38
    while y <= y1 + 6: OUT['t_fence_v'] = S['t_fence_v']; m.put('cs_t_fence_v', S['t_fence_v'], x, y, False, (7, 34)); y += 30
fence_h(76, 265, 240); fence_v(76, 222, 330); fence_v(262, 215, 290); fence_v(262, 310, 400)
fence_h(76, 150, 408); fence_h(190, 268, 408); fence_v(76, 400, 545); fence_h(90, 200, 566); fence_h(210, 290, 566); fence_h(300, 372, 566)
# bounds
m.cols += [[0, 0, 832, WY + 2], [0, 0, LW + 2, 464], [831 - RW - 2, 0, RW + 3, 464], [0, 458, round(462 * K), 6], [round(627 * K), 458, 400, 6]]
m.shadows(k=.26, sx=.55, alpha=.34, extra=m.flat, blur=.5)
m.preview('pv_training.png', 'dbg_training.png')
m.reach((440, 440), {'north door': (422, 116), 'dummies pen': (120, 300), 'lower pen': (140, 430), 'ring': (292, 258), 'range': (700, 300), 'targets': (730, 380), 'tents': (290, 170), 'racks': (560, 170)})
DATA['training'] = export(m, 'training')
TILESETS = {'tgrass': TG, 'tcobble': TC}
# red and blue versions of the waving banner (the gold lion keeps its colour)
import colorsys
def rehue(im, hue):
    px = im.load(); o = im.copy(); po = o.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and b > r * 1.05 and b > g * 1.2:
                h, l, s_ = colorsys.rgb_to_hls(r / 255, g / 255, b / 255); r2, g2, b2 = colorsys.hls_to_rgb(hue, l * .95, min(1, s_ * 1.1)); po[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return o

# courtyard: open a garden gate in the east wall
cy_ = Image.open(CS + 'ground_courtyard.png').convert('RGBA'); dc = ImageDraw.Draw(cy_)
dc.rectangle([612, 200, 640, 246], fill=(190, 182, 160, 255))
for x in range(612, 640, 14): dc.line([x, 200, x, 246], fill=(160, 152, 132, 255))
dc.rectangle([612, 192, 640, 200], fill=(120, 112, 100, 255)); dc.rectangle([612, 246, 640, 252], fill=(120, 112, 100, 255))
dc.rectangle([612, 192, 640, 200], outline=OL + (255,)); dc.rectangle([612, 246, 640, 252], outline=OL + (255,))
dc.rectangle([0, 270, 28, 316], fill=(190, 182, 160, 255))                    # west gate: the way to the training yard
for x in range(0, 28, 14): dc.line([x, 270, x, 316], fill=(160, 152, 132, 255))
dc.rectangle([0, 262, 28, 270], fill=(120, 112, 100, 255)); dc.rectangle([0, 316, 28, 322], fill=(120, 112, 100, 255))
dc.rectangle([0, 262, 28, 270], outline=OL + (255,)); dc.rectangle([0, 316, 28, 322], outline=OL + (255,))
cy_.convert('RGB').save('ground_courtyard.png')
for n in ('tower', 'banner_anim'): pass
OUT['tower'] = S['tower']
bn = Image.open('../anim/banner_frames.png').convert('RGBA'); OUT['banner_anim'] = bn.resize((bn.width // 2, bn.height // 2), Image.BOX)
al = OUT['banner_anim'].split()[3].point(lambda v: 255 if v > 110 else 0); OUT['banner_anim'].putalpha(al)
OUT['banner_red_anim'] = rehue(OUT['banner_anim'], 0.01); OUT['banner_blue_anim'] = rehue(OUT['banner_anim'], 0.6)
for n, im in OUT.items(): im.save('o_%s.png' % n)
json.dump({'maps': DATA, 'sizes': {n: [im.width, im.height] for n, im in OUT.items()}}, open('castle_maps.json', 'w'), separators=(',', ':'))
for n, ts in {'grass': GRASS, 'moat': MOAT, 'flag': FLAG, 'tgrass': TG, 'tcobble': TC}.items(): ts.atlas().save('tileset_%s.png' % n)
print(sorted(OUT))

# ---------------------------------------------------------------- pack
import glob
D = json.load(open('castle_maps.json'))
R = ROOT; OUT = R + 'assets/castle/'
for n in D['sizes']: shutil.copy('o_%s.png' % n, OUT + n + '.png')
for n in ('road', 'garden', 'walls', 'courtyard', 'training'): shutil.copy('ground_%s.png' % n, OUT + 'ground_%s.png' % n)
for n in ('grass', 'moat', 'flag', 'tgrass', 'tcobble'): shutil.copy('tileset_%s.png' % n, OUT + 'tileset_%s.png' % n)
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
