"""Lion logo pipeline: white-key via border flood fill, de-fringe, crop, ping-pong webp."""
import numpy as np
from PIL import Image
from scipy import ndimage
import os

SCRATCH = os.path.dirname(os.path.abspath(__file__))
INTERP = os.path.join(SCRATCH, "interp")
OUT = os.path.join(SCRATCH, "out")
os.makedirs(OUT, exist_ok=True)

N_FWD = 24          # i_000..i_023
WHITE_T = 250       # min-channel threshold for background white
ANIM_SIZE = 320     # working resolution; final encodes downsample from this
POSTER_SIZE = 192   # static fallback ships at 192 (nav shows 36px, loader 96px)
FRONT_IDX = 12      # straight-on front pose within forward sequence
BRIGHTNESS = 1.18   # lift the porcelain toward the wordmark's register on dark bg

def key_frame(path):
    """Return (premult_rgb float, alpha float 0..1) at source resolution."""
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float64)
    white = rgb.min(axis=2) >= WHITE_T
    labels, n = ndimage.label(white, structure=np.ones((3, 3), dtype=int))
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border = border[border != 0]
    bg = np.isin(labels, border)
    fg = ~bg
    fg = ndimage.binary_erosion(fg, iterations=1)
    alpha = ndimage.gaussian_filter(fg.astype(np.float64), sigma=1.5)
    alpha = np.clip(alpha, 0.0, 1.0)
    # unmix white matte: c = fg*a + 255*(1-a)  =>  fg = (c - 255*(1-a)) / a
    a3 = alpha[..., None]
    unmixed = np.where(a3 > 0.02, (rgb - 255.0 * (1.0 - a3)) / np.maximum(a3, 1e-6), 0.0)
    unmixed = np.clip(unmixed * BRIGHTNESS, 0.0, 255.0)
    return unmixed * a3, alpha

def to_rgba_image(premult, alpha, box, size):
    """Crop premultiplied frame to box, Lanczos-resize, unpremultiply -> RGBA PIL image."""
    x0, y0, x1, y1 = box
    pm = premult[y0:y1, x0:x1]
    al = alpha[y0:y1, x0:x1]
    stacked = np.dstack([pm, al * 255.0]).astype(np.float32)
    im = Image.fromarray(stacked.astype(np.uint8), "RGBA").resize((size, size), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float64)
    a = arr[..., 3:4] / 255.0
    rgb = np.where(a > 0.004, arr[..., :3] / np.maximum(a, 1e-6), 0.0)
    out = np.dstack([np.clip(rgb, 0, 255), arr[..., 3]]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

frames = []
for i in range(N_FWD):
    frames.append(key_frame(os.path.join(INTERP, f"i_{i:03d}.png")))
    print(f"keyed i_{i:03d}", flush=True)

# union bbox across the frames the nod actually uses (tight crop — the mark
# should fill its box; extra air makes it read undersized in the lockups)
NOD_FRAMES = list(range(4, 21))
mask = np.zeros(frames[0][1].shape, dtype=bool)
for i in NOD_FRAMES:
    mask |= frames[i][1] > 0.03
ys, xs = np.where(mask)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
w, h = x1 - x0, y1 - y0
side = int(max(w, h) * 1.03)
H, W = mask.shape
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
bx0 = max(0, min(W - side, cx - side // 2))
by0 = max(0, min(H - side, cy - side // 2))
box = (bx0, by0, bx0 + side, by0 + side)
print("union bbox", (x0, y0, x1, y1), "-> square", box)

anim = [to_rgba_image(pm, al, box, ANIM_SIZE) for pm, al in frames]
os.makedirs(os.path.join(OUT, "anim"), exist_ok=True)
for i, im in enumerate(anim):
    im.save(os.path.join(OUT, "anim", f"a_{i:02d}.png"))

# Shipped encode (see also regen notes in README): narrowed tilt arc, brightness
# lift, tight crop, 192px canvas, and a SINGLE-PLAY nod (loop=1) that starts and
# ends on the front pose — keeps the mark inside WCAG 2.2.2 without a pause
# control and guarantees the resting frame is the legible face-on pose.
KEEP = NOD_FRAMES
BASE_MS = 66
fi = KEEP.index(FRONT_IDX)
order = KEEP[fi:] + KEEP[len(KEEP) - 2::-1] + KEEP[1:fi + 1]
assert order[0] == FRONT_IDX and order[-1] == FRONT_IDX
seq = {i: anim[i].resize((192, 192), Image.LANCZOS) for i in KEEP}
cycle = [seq[i] for i in order]
durs = []
for idx in order:
    d = min(KEEP.index(idx), len(KEEP) - 1 - KEEP.index(idx))  # distance to a reversal
    durs.append(BASE_MS + {0: 200, 1: 90, 2: 45, 3: 20}.get(d, 0))
cycle[0].save(
    os.path.join(OUT, "lion-mark.webp"),
    save_all=True, append_images=cycle[1:], duration=durs, loop=1,
    quality=70, alpha_quality=80, method=6,
)

# static poster (front pose) + favicon sizes
poster = to_rgba_image(*frames[FRONT_IDX], box, POSTER_SIZE)
poster.save(os.path.join(OUT, "lion-mark.png"))

# favicon: tight square crop of the front pose alone
al_f = frames[FRONT_IDX][1]
ysf, xsf = np.where(al_f > 0.03)
fx0, fx1, fy0, fy1 = xsf.min(), xsf.max() + 1, ysf.min(), ysf.max() + 1
fside = int(max(fx1 - fx0, fy1 - fy0) * 1.02)
fcx, fcy = (fx0 + fx1) // 2, (fy0 + fy1) // 2
fbx0 = max(0, min(W - fside, fcx - fside // 2))
fby0 = max(0, min(H - fside, fcy - fside // 2))
fbox = (fbx0, fby0, fbx0 + fside, fby0 + fside)
to_rgba_image(*frames[FRONT_IDX], fbox, 64).save(os.path.join(OUT, "favicon.png"))

# apple-touch-icon: dark plate, lion at ~78%
plate = Image.new("RGBA", (180, 180), (9, 10, 12, 255))
lion140 = to_rgba_image(*frames[FRONT_IDX], fbox, 140)
plate.alpha_composite(lion140, (20, 20))
plate.convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))

# preview strip on site-dark background for QA
def on_dark(im, pad=8):
    bg = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (11, 12, 15, 255))
    bg.alpha_composite(im, (pad, pad))
    return bg

samples = [anim[i].resize((160, 160), Image.LANCZOS) for i in (0, 4, 8, 12, 16, 20, 23)]
strip = Image.new("RGBA", (sum(s.width + 16 for s in samples), 176), (11, 12, 15, 255))
xoff = 0
for s in samples:
    strip.alpha_composite(on_dark(s), (xoff, 0))
    xoff += s.width + 16
strip.convert("RGB").save(os.path.join(OUT, "preview_strip.png"))
on_dark(poster.resize((320, 320), Image.LANCZOS), 24).convert("RGB").save(os.path.join(OUT, "preview_poster.png"))

for f in sorted(os.listdir(OUT)):
    print(f, f"{os.path.getsize(os.path.join(OUT, f)) / 1024:.0f} KB")
