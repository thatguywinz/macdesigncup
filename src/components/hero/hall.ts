import { DOLLY_END } from "./timeline";

/* Shared helpers of the 3D hall: the camera, the door, the plaques and the
   printer all agree on these. Imported only by the lazily loaded scene chunk.
   The geometry and the camera framing live in frame.ts (no three.js there),
   so the page shell can place the poster's door with the same numbers. */
export {
  BACK_ROW,
  CTA_AT,
  DESIGN_FOV,
  DOOR,
  PORTAL_H,
  PORTAL_Y,
  copyLift,
  cutAtStop,
  framing,
  restLookY,
  slotsFor,
  type Framing,
  type Slot,
} from "./frame";

export const BONE = "#eae2cc";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* Window-level cursor, in the same -1..1 space as r3f's state.pointer.
   r3f only updates its pointer from events on the canvas, so the DOM overlays
   (the CTA glued to the door) would freeze the parallax while hovered and the
   camera would "lock" onto the door. Reading the window keeps everything
   moving. Guarded so the module is safe to import without a window. */
export const PTR = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      PTR.x = (e.clientX / window.innerWidth) * 2 - 1;
      PTR.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Hermite smoothstep between two edges. */
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** How far the dolly has come (eased 0..1) for a hero scroll progress. */
export const dollyAmount = (progress: number) => easeInOutCubic(clamp01(progress / DOLLY_END));
