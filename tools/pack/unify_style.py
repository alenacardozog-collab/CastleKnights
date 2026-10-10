"""One look for every map. Runs over the art of the castle and the ruins (already packed in
js/castle_assets.js and js/ruins_assets.js) and:
  1. pulls every colour towards the palette of the village art (the reference style of the game),
  2. turns soft, blurry edges of props into hard pixel edges (props that were scaled down),
  3. removes stray half-transparent fringes.
Shadows, glows and glass keep their soft alpha. Run after the map builders:
    python tools/pack/unify_style.py        (npm run build:castle / build:ruins already call it)"""
import base64, io, os, re, sys
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URI = re.compile(r"""(["'])([\w./ ()-]+)\1\]?\s*[:=]\s*(["'])data:image/png;base64,([^"']+)\3""")

def images(path):
    s = open(path).read()
    return s, [(m.group(2), m.group(4)) for m in URI.finditer(s)]

def master_palette(n=72):
    """The n most used colours of the village art."""
    _, imgs = images(os.path.join(ROOT, 'js/map_assets_base64.js'))
    px = []
    for key, b in imgs:
        if 'Shadow' in key: continue
        a = np.array(Image.open(io.BytesIO(base64.b64decode(b))).convert('RGBA')).reshape(-1, 4)
        a = a[a[:, 3] > 250][:, :3]
        if len(a): px.append(a[:: max(1, len(a) // 4000)])
    allpx = np.concatenate(px)
    q = Image.fromarray(allpx.reshape(1, -1, 3).astype('uint8')).quantize(n, method=Image.MEDIANCUT)
    return np.array(q.getpalette()[: n * 3]).reshape(-1, 3).astype(float)

def unify(im, pal, k):
    a = np.array(im.convert('RGBA')).astype(float)
    al = a[..., 3]
    solid = al > 0
    if not solid.any(): return im
    soft = ((al > 20) & (al < 235)).sum() / solid.sum()
    rgb = a[..., :3]
    flat = rgb[solid]
    # nearest palette colour, in chunks (big grounds have a million pixels)
    near = np.empty_like(flat)
    for i in range(0, len(flat), 200000):
        c = flat[i:i + 200000]
        near[i:i + 200000] = pal[((c[:, None, :] - pal[None]) ** 2).sum(-1).argmin(1)]
    rgb[solid] = flat * (1 - k) + near * k
    if soft < 0.12:                     # a prop with a thin blurry fringe: make the edge hard
        a[..., 3] = np.where(al >= 110, 255, 0)
    return Image.fromarray(a.round().clip(0, 255).astype('uint8'))

def run(js, k, skip=()):
    path = os.path.join(ROOT, js)
    s, imgs = images(path)
    pal = master_palette()
    n = 0
    for key, b in imgs:
        if any(t in key for t in skip): continue
        im = Image.open(io.BytesIO(base64.b64decode(b)))
        out = unify(im, pal, k)
        buf = io.BytesIO(); out.save(buf, 'PNG', optimize=True)
        s = s.replace(b, base64.b64encode(buf.getvalue()).decode(), 1)
        n += 1
    open(path, 'w').write(s)
    print(js, n, 'images')

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if which in ('all', 'castle'): run('js/castle_assets.js', 0.38, skip=('glow', 'light', 'glass', 'flame'))
    if which in ('all', 'ruins'): run('js/ruins_assets.js', 0.22, skip=('glow', 'light', 'fog'))
