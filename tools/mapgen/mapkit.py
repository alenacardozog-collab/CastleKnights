# Shared painter for the SpriteLab maps: corner-tile atlases rebuilt from the previews, terrain layers,
# baked cast shadows, reachability check.
import json, math, random, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
T = 16
RU = os.path.dirname(os.path.abspath(__file__)) + '/ruins/'
def noise(w, h, s, seed):
    r = np.random.RandomState(seed); g = r.rand(h // s + 3, w // s + 3)
    im = Image.fromarray((g * 255).astype('uint8')).resize(((w // s + 3) * s, (h // s + 3) * s), Image.BICUBIC)
    return np.array(im)[:h, :w] / 255.0
def _idx():
    im = np.array(Image.open(RU + 'raw/ts_grass.png').convert('RGB')).astype(int)
    bset = set(map(tuple, im[0:16, 0:16].reshape(-1, 3))); out = {}
    for cy in range(7):
        for cx in range(9):
            t = np.array([[tuple(im[cy * 16 + y, cx * 16 + x]) not in bset for x in range(16)] for y in range(16)])
            c = [t[0:4, 0:4].mean() > .5, t[0:4, 12:16].mean() > .5, t[12:16, 0:4].mean() > .5, t[12:16, 12:16].mean() > .5]
            out[(cx, cy)] = (0 if c[0] else 1) | (0 if c[1] else 2) | (0 if c[2] else 4) | (0 if c[3] else 8)
    return out
IDX = _idx()
class Tileset:
    """16 corner tiles (index bits: 1 TL, 2 TR, 4 BL, 8 BR missing) + variants of the full and base tiles."""
    def __init__(self, preview, recolor=None):
        im = Image.open(preview).convert('RGB')
        if recolor: im = recolor(im)
        a = np.array(im).astype(int); t = {}
        for (cx, cy), i in IDX.items(): t.setdefault(i, []).append(a[cy * 16:cy * 16 + 16, cx * 16:cx * 16 + 16])
        for i in (6, 9):
            tile = np.zeros((16, 16, 3), int)
            for ys, xs, bit in [(slice(0, 8), slice(0, 8), 1), (slice(0, 8), slice(8, 16), 2), (slice(8, 16), slice(0, 8), 4), (slice(8, 16), slice(8, 16), 8)]:
                tile[ys, xs] = t[(15 & ~bit) if not (i & bit) else 15][0][ys, xs]
            t[i] = [tile]
        bset = set(map(tuple, a[0:16, 0:16].reshape(-1, 3)))
        self.base = [Image.fromarray(v.astype('uint8')).convert('RGBA') for v in t[15][:8]]
        self.full = [Image.fromarray(v.astype('uint8')).convert('RGBA') for v in t[0]]
        self.edge = {}
        for i in range(1, 15):
            im2 = Image.fromarray(t[i][0].astype('uint8')).convert('RGBA'); px = im2.load()
            for y in range(16):
                for x in range(16):
                    if px[x, y][:3] in bset: px[x, y] = (0, 0, 0, 0)
            self.edge[i] = im2
    def atlas(self):
        at = Image.new('RGBA', (64, 64))
        for i in range(16):
            tl = self.full[0] if i == 0 else self.base[0] if i == 15 else Image.alpha_composite(self.base[0], self.edge[i])
            at.paste(tl, ((i % 4) * 16, (i // 4) * 16))
        return at
class Map:
    def __init__(s, w, h, seed=1):
        s.W, s.H = w, h; s.GW, s.GH = w // T + 1, h // T + 1
        s.ground = Image.new('RGBA', (w, h)); s.items = []; s.cols = []; s.rr = random.Random(seed); s.sprites = {}; s.flat = []
        random.seed(seed)
    def mask(s): return np.zeros((s.GH, s.GW), bool)
    def path(s, m, pts, wd=1):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = int(max(abs(x1 - x0), abs(y1 - y0)) / 4) + 1
            for i in range(n + 1):
                cx, cy = round((x0 + (x1 - x0) * i / n) / T), round((y0 + (y1 - y0) * i / n) / T)
                m[max(0, cy - wd):cy + wd + 1, max(0, cx - wd):cx + wd + 1] = True
    def rect(s, m, x0, y0, x1, y1, v=True): m[round(y0 / T):round(y1 / T) + 1, round(x0 / T):round(x1 / T) + 1] = v
    def ell(s, m, cx, cy, rx, ry, jit=None):
        for gy in range(s.GH):
            for gx in range(s.GW):
                d = ((gx * T - cx) / rx) ** 2 + ((gy * T - cy) / ry) ** 2
                if d < 1 + (0 if jit is None else (jit[gy, gx] - .5) * .5): m[gy, gx] = True
    def fill(s, ts, full=False):
        for ty in range(s.H // T + 1):
            for tx in range(s.W // T + 1): s.ground.paste(random.choice(ts.full if full else ts.base), (tx * T, ty * T))
    def layer(s, m, ts, flip=True):
        for ty in range(-1, s.H // T + 1):
            for tx in range(-1, s.W // T + 1):
                c = lambda dx, dy: bool(m[min(s.GH - 1, max(0, ty + dy + 1)), min(s.GW - 1, max(0, tx + dx + 1))])
                i = (0 if c(0, 0) else 1) | (0 if c(1, 0) else 2) | (0 if c(0, 1) else 4) | (0 if c(1, 1) else 8)
                if i == 15: continue
                t = random.choice(ts.full) if i == 0 else ts.edge[i]
                if i == 0 and flip and random.random() < .5: t = t.transpose(Image.FLIP_LEFT_RIGHT)
                x, y = tx * T + 8, ty * T + 8
                s.ground.paste(t, (x, y), t)
    def tone(s, amp=18, seed=21, region=None):
        ton = (noise(s.W, s.H, 90, seed) - .5) * amp + (noise(s.W, s.H, 34, seed + 1) - .5) * amp * .5
        a = np.array(s.ground.convert('RGB')).astype(float)
        if region is None: a += ton[:, :, None]
        else: a[region] += ton[:, :, None][region]
        s.ground = Image.fromarray(np.clip(a, 0, 255).astype('uint8')).convert('RGBA')
    def shade(s, x0, y0, x1, y1, k0, k1=1.0, p=1.5):
        """darken rows y0..y1 from factor k0 to k1"""
        a = np.array(s.ground).astype(float)
        for y in range(max(0, y0), min(s.H, y1)):
            f = (y - y0) / max(1, y1 - y0); a[y, x0:x1, :3] *= k0 + (k1 - k0) * (1 - (1 - f) ** p)
        s.ground = Image.fromarray(a.astype('uint8'))
    def draw(s): return ImageDraw.Draw(s.ground)
    def stamp(s, im, x, base, flip=False):
        """paint a sprite into the ground (things the hero never walks behind)"""
        if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        s.ground.alpha_composite(im, (int(x - im.width / 2), base - im.height)) if x - im.width / 2 >= 0 and base - im.height >= 0 else s.ground.paste(im, (int(x - im.width / 2), base - im.height), im)
        s.flat.append((im, x, base))
    def put(s, key, im, x, y, flip=False, foot=None, extra=None):
        s.sprites[key] = im; it = {'k': key, 'x': x, 'y': y, 'f': int(flip)}
        if extra: it.update(extra)
        s.items.append(it)
        if foot:
            w = round(im.width * foot[0]) if foot[0] <= 1 else foot[0]; s.cols.append([round(x - w / 2), y - foot[1], w, foot[1]])
    def watercols(s, m, skip=()):
        for cy in range(s.H // T):
            run = None
            for cx in range(s.W // T + 1):
                w_ = cx < s.W // T and m[cy:cy + 2, cx:cx + 2].all() and not any(a <= cx * T + 8 < b and c <= cy * T + 8 < d for a, c, b, d in skip)
                if w_ and run is None: run = cx
                if not w_ and run is not None: s.cols.append([run * T + 3, cy * T + 4, (cx - run) * T - 6, T]); run = None
    def shadows(s, k=.42, sx=.8, alpha=.30, extra=(), blur=1.2):
        sh = Image.new('L', (s.W, s.H), 0)
        for im, x, y in [(s.sprites[i['k']].transpose(Image.FLIP_LEFT_RIGHT) if i['f'] else s.sprites[i['k']], i['x'], i['y']) for i in s.items if not i.get('noshadow')] + list(extra):
            a = im.split()[3]; w, h = a.size; hs = max(2, int(h * k))
            out = a.transform((w + int(hs * sx) + 2, hs), Image.AFFINE, (1, sx, -hs * sx, 0, 1 / k, 0), Image.BILINEAR)
            tmp = Image.new('L', (s.W, s.H), 0); tmp.paste(out, (int(x - w / 2), y - hs)); sh = ImageChops.lighter(sh, tmp)
        sh = sh.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * alpha))
        s.ground = Image.composite(Image.new('RGBA', (s.W, s.H), (18, 12, 26, 255)), s.ground, sh)
    def preview(s, path, debug=None):
        pv = s.ground.copy()
        for it in sorted(s.items, key=lambda i: i['y']):
            im = s.sprites[it['k']]; im = im.transpose(Image.FLIP_LEFT_RIGHT) if it['f'] else im
            x, y = int(it['x'] - im.width / 2), it['y'] - im.height
            pv.paste(im, (x, y), im)
        pv.convert('RGB').save(path)
        if debug:
            dd = ImageDraw.Draw(pv, 'RGBA')
            for c in s.cols: dd.rectangle([c[0], c[1], c[0] + c[2], c[1] + c[3]], outline=(255, 0, 0, 255))
            pv.convert('RGB').save(debug)
    def reach(s, start, targets, extra_block=()):
        G = 4; bw, bh = s.W // G, s.H // G; blk = np.zeros((bh, bw), bool)
        for c in list(s.cols) + list(extra_block):
            blk[max(0, (c[1] - 4) // G):(c[1] + c[3] + 3) // G + 1, max(0, (c[0] - 7) // G):(c[0] + c[2] + 7) // G + 1] = True
        seen = np.zeros_like(blk); st = [(start[0] // G, start[1] // G)]; seen[st[0][1], st[0][0]] = True
        while st:
            x, y = st.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < bw and 0 <= ny < bh and not blk[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; st.append((nx, ny))
        bad = [n for n, (x, y) in targets.items() if not seen[y // G, x // G]]
        print('unreachable:', bad, 'reach %.0f%%' % (100 * seen.sum() / max(1, (~blk).sum())))
        return seen
def load(p, scale=1.0):
    im = Image.open(p).convert('RGBA'); im = im.crop(im.getbbox())
    if scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BOX)
        im.putalpha(im.split()[3].point(lambda v: 255 if v > 110 else 0))
    return im
def cliff(m, y, x0, x1, face, gaps=(), rock=((150, 132, 104), (128, 110, 86), (168, 150, 120)), lip=((110, 190, 96), (84, 170, 84)), seed=4):
    """horizontal cliff: stone face below a grassy lip; gaps = stairways [(x0,x1)]"""
    d = m.draw(); rr = random.Random(seed); x = x0
    while x < x1:
        bw = rr.randint(10, 22)
        for row in range(face // 10):
            y0 = y + row * 10 + rr.randint(-1, 1); c = rock[rr.randrange(len(rock))]; c = tuple(int(v * (1 - row * .12)) for v in c)
            xa = x + (row % 2) * 5; xb = min(x1, xa + bw - 1)
            d.rectangle([xa, y0, xb, y + row * 10 + 10], fill=c + (255,)); d.line([xa, y0, xb, y0], fill=tuple(min(255, v + 22) for v in c) + (255,))
            d.line([xb, y0, xb, y + row * 10 + 10], fill=(58, 44, 36, 255))
        x += bw
    d.rectangle([x0, y + face, x1, y + face + 1], fill=(58, 44, 36, 255))
    for xx in range(x0, x1, 2):
        hgt = 3 + int(2.5 * math.sin(xx * .21) + 2 * math.sin(xx * .057 + 1))
        d.rectangle([xx, y - 3, xx + 1, y + hgt], fill=lip[0] + (255,) if (xx // 2) % 5 else lip[1] + (255,))
    for a, b in gaps:
        n = max(3, (face + 8) // 6); sh = (face + 8) / n
        d.rectangle([a - 4, y - 6, b + 3, y + face + 3], fill=(58, 44, 36, 255))
        for i in range(n):
            y0 = y - 5 + i * sh; v = 190 - i * 9
            d.rectangle([a, y0, b - 1, y0 + sh - 1], fill=(v, v - 8, v - 26, 255)); d.line([a, y0, b - 1, y0], fill=(min(255, v + 34), v + 26, v + 8, 255))
            d.line([a, y0 + sh - 1, b - 1, y0 + sh - 1], fill=(v - 60, v - 66, v - 76, 255))
        for sx in (a - 4, b): d.rectangle([sx, y - 8, sx + 3, y + face + 3], fill=(150, 140, 120, 255))
    m.shade(x0, y + face + 2, x1, y + face + 16, .55)
    xs = [x0] + [v for g in gaps for v in (g[0] - 2, g[1] + 2)] + [x1]
    for a, b in zip(xs[0::2], xs[1::2]):
        if b > a: m.cols.append([a, y - 6, b - a, face + 4])

def write_map(name, d):
    """layout data as readable JS: one prop per line, so it can be edited by hand"""
    L = ["window.%s = {" % name]
    for k, v in d.items():
        if k == 'items':
            L.append("  // props: [sprite, x, baseY (where its feet stand), flip 0/1, animation?] — drawn in front of or behind the hero by baseY")
            L.append("  items: [\n" + ",\n".join("    " + json.dumps(i, separators=(',', ':'), ensure_ascii=False) for i in v) + "\n  ],")
        elif k == 'cols':
            L.append("  // solid rectangles the hero cannot cross: [x, y, w, h]")
            rows = [", ".join(json.dumps(c, separators=(',', ':')) for c in v[i:i + 8]) for i in range(0, len(v), 8)]
            L.append("  cols: [\n" + ",\n".join("    " + r for r in rows) + "\n  ],")
        else: L.append("  %s: %s," % (k, json.dumps(v, separators=(',', ':'))))
    L[-1] = L[-1].rstrip(','); L.append("};")
    return "\n".join(L)
