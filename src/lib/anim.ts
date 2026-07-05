// Small, dependency-free interpolation helpers shared by the 3D scene and overlay.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// C1 smoothstep
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// C2 smootherstep (Ken Perlin) — used for continuous, jerk-free scroll morphs.
export const smootherstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Piecewise interpolation across keyframes: pairs of [position, value] sorted by position.
// Uses smootherstep between adjacent frames for a cinematic feel.
export function keyframe(p: number, frames: [number, number][]): number {
  if (frames.length === 0) return 0;
  if (p <= frames[0][0]) return frames[0][1];
  const last = frames[frames.length - 1];
  if (p >= last[0]) return last[1];
  for (let i = 0; i < frames.length - 1; i++) {
    const [p0, v0] = frames[i];
    const [p1, v1] = frames[i + 1];
    if (p >= p0 && p <= p1) {
      return lerp(v0, v1, smootherstep(p0, p1, p));
    }
  }
  return last[1];
}

// Bell curve: 1 at `center`, 0 by `center ± width`. For per-scene visibility.
export function bell(p: number, center: number, width: number): number {
  const d = Math.abs(p - center) / width;
  if (d >= 1) return 0;
  return 1 - d * d * (3 - 2 * d); // smooth falloff
}

// Plateau visibility: fully on within ±hold of center, cross-fading over `fade`.
export function plateau(p: number, center: number, hold: number, fade: number): number {
  const d = Math.abs(p - center);
  if (d <= hold) return 1;
  if (d >= hold + fade) return 0;
  return 1 - smoothstep(hold, hold + fade, d);
}
