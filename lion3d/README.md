# Lion3D — brand mark source

`lion head 3d model.avi` is the raw 3D turntable render (1920×1080, 48 frames, white
background). The site's logo assets in `public/lion/` + `public/favicon.png` +
`public/apple-touch-icon.png` are derived from it.

## How the assets were made

The raw video is a camera orbit in which the lion leaves the frame for ~16 frames, so
only the continuous front-facing arc is used (source frames 45–47 wrapping to 0–4).

1. Extract frames: `ffmpeg -i "lion head 3d model.avi" full/f_%02d.png`
   (frame N of the video = `f_{N+1}.png`).
2. Stage the arc `f_46 f_47 f_48 f_01 … f_06` as `seg/s_00…s_08.png`, then motion-
   interpolate 4×:
   `ffmpeg -framerate 24 -i seg/s_%02d.png -vf "minterpolate=fps=96:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -start_number 0 interp/i_%03d.png`
3. Run `process_lion.py` (numpy + scipy + Pillow) next to the `interp/` folder. It
   removes the white background per frame (flood fill from the border, protecting the
   lion's own white highlights), un-mixes the white edge fringe, crops to the union
   square, and writes the animated ping-pong WebP plus the static PNG and favicons.

The shipped `lion-mark.webp` (192px, ~234KB, quality 70 / alpha_quality 80) is a
**single-play** nod: interpolated frames 4–20 ordered front → up → down → front,
eased at the reversals, with webp loop count = 1 so it plays one ~3.2s gesture on
load and settles on the face-on pose. Single-play keeps the mark inside
WCAG 2.2.2 (moving content must stop within 5s or offer a pause control), and the
narrowed tilt arc + tight crop + 1.18× brightness lift keep it legible at the
32–36px lockup size against the near-black background. To retune, adjust the
constants at the top/bottom of the script and re-encode from `out/anim/a_*.png`.
