/* The hall's camera framing in plain arithmetic: no three.js, no side effects.
   The lazy scene chunk (hall.ts, GalleryScene, LogoPlaques, WirePrinter)
   frames its camera with it, and the page shell uses the same numbers to put
   the poster's door and Enter slab where the scene will draw them, so the
   hand-over from poster to scene is a crossfade, not a jump.

   World units. At rest the camera sits on the hall's centre line and only
   pitches to look at the door, so a point's height on screen depends on its
   height and depth alone. */

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v: number) => clamp(v, 0, 1);

/** Door centre in world space. */
export const DOOR = { x: 0, y: 1.9, z: -6 } as const;

/** The portal's lit opening (the rim plane): its size and where it stands. */
export const PORTAL_H = 3.6;
export const PORTAL_W = 2.5;
/** Rim plane centre height (GalleryScene's Portal), and its top and bottom. */
export const PORTAL_Y = 1.92;
export const RIM_TOP = PORTAL_Y + PORTAL_H / 2;
export const RIM_BOTTOM = PORTAL_Y - PORTAL_H / 2;
/** Where the Enter slab is pinned to the door (GalleryScene's EnterDoor). */
export const CTA_AT = { y: DOOR.y + 0.1, z: DOOR.z + 0.2 } as const;

/* ── Plaques ─────────────────────────────────────────────────────────── */
/** Every plaque is the same slab; `s` scales it. */
export const SLAB_W = 1.9;
export const SLAB_H = 0.86;
/** Air between the plinth top and the floating slab. */
export const LIFT = 0.1;

export interface Slot {
  x: number;
  z: number;
  /** plinth height */
  h: number;
  /** plaque scale */
  s: number;
}

/** The back row of plaques in landscape: its depth, each mirrored pair's
 *  centre x (inner pair first), a slab's half-width at the row's scale, and
 *  its plinth. These are what flank the door where the dolly stops. */
export const BACK_ROW = { z: -1.3, xs: [2.12, 4.4], halfW: 0.76, h: 0.36, s: 0.8 };
const FRONT_ROW = { z: 2.3, h: 0.18, s: 0.54 };

/* Landscape: two plinth rows per side, all below the poster type on the
   left and under the printer on the right, spaced so no plaque hides another
   at any landscape aspect from 5:4 to 21:9. Listed in hall order:
   the first pair flanks the door, then the front pair, then the outer ones.
   The front plinths are nearer and lower, so every logo lands at about the
   same size on screen and even a thin wordmark reads. */
const [INNER, OUTER] = BACK_ROW.xs;
const BACK = { z: BACK_ROW.z, h: BACK_ROW.h, s: BACK_ROW.s };
export const LANDSCAPE_SLOTS: Slot[] = [
  { x: -INNER, ...BACK },
  { x: INNER, ...BACK },
  { x: -1.72, ...FRONT_ROW },
  { x: 1.72, ...FRONT_ROW },
  { x: -OUTER, ...BACK },
  { x: OUTER, ...BACK },
  { x: -3.25, ...FRONT_ROW },
  { x: 3.25, ...FRONT_ROW },
];

/* Portrait (tablets held upright): the plaques line both sides of the aisle
   like a gallery corridor, four a side, each pair a step nearer and lower,
   with air between them on screen at every tablet shape from 0.62 to 0.8.
   The door, its Enter slab and the runway in front of it stay clear: the
   far pair stands well wide of the slab (60px or more), the rest flank the
   runway. None of them is in the frame where the dolly stops. */
export const PORTRAIT_SLOTS: Slot[] = [
  { x: -2.2, z: 1.0, h: 0.24, s: 0.6 },
  { x: 2.2, z: 1.0, h: 0.24, s: 0.6 },
  { x: -1.75, z: 4.3, h: 0.06, s: 0.46 },
  { x: 1.75, z: 4.3, h: 0.06, s: 0.46 },
  { x: -3.2, z: -4.2, h: 1.75, s: 0.9 },
  { x: 3.2, z: -4.2, h: 1.75, s: 0.9 },
  { x: -2.75, z: -2.1, h: 0.72, s: 0.76 },
  { x: 2.75, z: -2.1, h: 0.72, s: 0.76 },
];

export const slotsFor = (aspect: number) => (aspect < 1 ? PORTRAIT_SLOTS : LANDSCAPE_SLOTS);

/** Height of a slot's slab top and bottom (a hair over, for its bob). */
const slabTop = (s: Pick<Slot, "h" | "s">) => s.h + LIFT + SLAB_H * s.s + 0.03;
const slabBottom = (s: Pick<Slot, "h">) => s.h + LIFT - 0.03;

/* ── Framing ─────────────────────────────────────────────────────────
   The hall is composed horizontally: portal dead centre, plaque rows
   flanking it. A perspective camera's `fov` is *vertical*, so the window's
   aspect ratio silently decides how much of that row you see. Pin the
   horizontal field of view instead and let the vertical one follow,
   dollying back only once the fov would have to open wider than is
   comfortable. Every landscape window then gets the same shot. */
export const DESIGN_FOV = 40;
const DESIGN_ASPECT = 16 / 9;
/** tan of the half-horizontal-fov held at every landscape aspect */
const TAN_H = Math.tan(rad(DESIGN_FOV / 2)) * DESIGN_ASPECT;
const SUBJECT_Z = 1.4; // depth of the front plaque row
const HALF_W = 4.66; // half-extent held across that row (the 16:9 shot)
/** Widest the landscape shot opens to fit the rows under tall type. */
const MAX_FOV = 50;

/** Where the scroll-driven dolly stops: the portal's opening at about this
 *  share of the frame height (the walk ends on the lit door, never inside
 *  it), still framed by its dark jambs, the floor and the wall. */
const END_FILL = 0.5;
/** Air kept between a flanking plaque's outer edge and the frame. */
const FLANK_MARGIN = 0.2;

/* The poster type is sized by the window's width, so on short windows (a
   1366x657 Chromebook browser, a 1536x730 laptop) it reaches far down the
   frame. The shot then opens a little wider, so both plaque rows fit in the
   room left under the type, and the camera looks a little higher, which
   lowers the hall in the frame, until the highest thing under the type sits
   clear of its last line. `floor` is the type block's bottom as a share of
   the frame height (0 when unknown: the shot is then the plain one). */

/** Screen air kept under the type, px: landscape rows, portrait door. */
const CLEAR_PX = 18;
const CLEAR_PORTRAIT_PX = 22;
/** Air kept between the front row's slabs and the frame's bottom, px. */
const BOTTOM_PX = 10;

export interface Framing {
  fov: number;
  z: number;
  y: number;
  lookY: number;
  /** Camera z where the scroll-driven dolly stops. */
  endZ: number;
}

/** Camera distance from the door that puts its opening at END_FILL of the
 *  frame height. */
const fillDistance = (tanV: number) => PORTAL_H / (2 * tanV * END_FILL);

/** NDC height (-1 bottom .. 1 top) of a point at (y, z) for a camera at
 *  (camY, camZ) looking at (lookY, DOOR.z). */
function ndcY(camY: number, camZ: number, lookY: number, tanV: number, y: number, z: number) {
  const theta = Math.atan2(lookY - camY, camZ - DOOR.z);
  return Math.tan(Math.atan2(y - camY, camZ - z) - theta) / tanV;
}

/** The lowest look height that puts a point at (y, z) at or below `ndc`. */
function lookYFor(camY: number, camZ: number, tanV: number, y: number, z: number, ndc: number) {
  const theta = Math.atan2(y - camY, camZ - z) - Math.atan(ndc * tanV);
  return camY + Math.tan(theta) * (camZ - DOOR.z);
}

/** Points (height, depth) that must stay under the type. Landscape: the
 *  back row's slab tops, which stand under the type on the left. Portrait:
 *  the door's lit rim (the type spans the door there) and the plaques
 *  beside it. */
function guards(aspect: number): Array<[number, number]> {
  if (aspect >= 1) return [[slabTop(BACK_ROW), BACK_ROW.z]];
  const [, , , , far, , mid] = PORTRAIT_SLOTS;
  return [
    [RIM_TOP + 0.06, DOOR.z],
    [slabTop(far), far.z],
    [slabTop(mid), mid.z],
  ];
}

/** The type's clearance line as NDC height. */
const clearLine = (aspect: number, floor: number, heightPx: number) =>
  1 - 2 * Math.min(0.92, floor + (aspect < 1 ? CLEAR_PORTRAIT_PX : CLEAR_PX) / heightPx);

export function framing(aspect: number, floor = 0, heightPx = 0): Framing {
  // Portrait frames the portal, not the rows: the hall reads as a corridor.
  // Stood back and looking up, so the door sits under the poster type and
  // the plinths line the floor in front of it.
  if (aspect < 1) {
    // Tablets held upright (the scene runs from 768px wide). Any closer and
    // the door swamps the narrow frame; narrower than 0.72 (a 10" Android
    // tablet) the camera steps back to hold the aisle's width.
    const tanV = Math.tan(rad(DESIGN_FOV / 2));
    const z = DOOR.z + 19.5 * Math.max(1, 0.72 / aspect);
    return { fov: DESIGN_FOV, z, y: 2.05, lookY: 3.15, endZ: DOOR.z + fillDistance(tanV) };
  }
  const raw = deg(2 * Math.atan(TAN_H / aspect));
  // Narrow windows (4:3, 5:4) cap the fov and dolly back to hold the row.
  // Ultra-wide ones (21:9) would squeeze the plinths off the bottom, so they
  // keep a taller view instead and simply see more of the side walls.
  let fov = clamp(raw, 35, 44);
  const tanH = Math.tan(rad(Math.min(raw, 44) / 2)) * aspect;
  const wide = clamp01((aspect - 1.9) / 0.6);
  // Squarer windows (4:3, 5:4) have floor to spare under the plinths but the
  // poster type runs deeper: look a little higher, so the hall sinks under it.
  const narrow = clamp01((1.55 - aspect) / 0.3);
  const z = clamp(SUBJECT_Z + HALF_W / tanH, 7.6, 10.6);
  const y = 2.05 + 0.2 * wide;
  const lookY = 1.8 - 0.45 * wide + 0.8 * narrow;

  // Tall type on a short window: open the shot until the rows, from the back
  // row's tops to the front row's slab bottoms, fit the room under the type.
  // Their span on screen scales with 1 / tan(fov / 2) for a fixed camera.
  if (floor > 0 && heightPx > 0) {
    const tanV0 = Math.tan(rad(fov / 2));
    const top = ndcY(y, z, lookY, tanV0, slabTop(BACK_ROW), BACK_ROW.z);
    const bottom = ndcY(y, z, lookY, tanV0, slabBottom(FRONT_ROW), FRONT_ROW.z);
    const room = clearLine(aspect, floor, heightPx) - (-1 + (2 * BOTTOM_PX) / heightPx);
    if (room > 0 && top - bottom > room) {
      fov = Math.min(MAX_FOV, deg(2 * Math.atan((tanV0 * (top - bottom)) / room)));
    }
  }

  // The stop: the door at END_FILL of the frame height, but no back-row
  // plaque left half cut by the frame's side. A pair that would be is
  // either kept whole (the camera stops a little further back, the door a
  // little smaller) or, if the stop is already past it, left out entirely.
  const tanV = Math.tan(rad(fov / 2));
  const perUnit = tanV * aspect; // half the frame's width per unit of distance
  const toRow = BACK_ROW.z - DOOR.z;
  let d = fillDistance(tanV);
  for (const x of BACK_ROW.xs) {
    const whole = toRow + (x + BACK_ROW.halfW + FLANK_MARGIN) / perUnit;
    const gone = toRow + Math.max(0, x - BACK_ROW.halfW - 0.1) / perUnit;
    if (d > gone && d < whole) d = whole;
  }
  return { fov, z, y, lookY, endZ: Math.min(z - 1, DOOR.z + d) };
}

/** How far to raise the look target (world units, >= 0) so the guards sit
 *  clear of the type, for a camera at (camY, camZ) looking at lookY. */
export function copyLift(
  f: Framing,
  aspect: number,
  camY: number,
  camZ: number,
  lookY: number,
  floor: number,
  heightPx: number,
) {
  if (!(floor > 0) || !(heightPx > 0)) return 0;
  const tanV = Math.tan(rad(f.fov / 2));
  const line = clearLine(aspect, floor, heightPx);
  let need = lookY;
  for (const [y, z] of guards(aspect)) need = Math.max(need, lookYFor(camY, camZ, tanV, y, z, line));
  return need - lookY;
}

/** The rest shot's look height, the type's clearance included (the cursor
 *  and the idle drift at rest). */
export function restLookY(f: Framing, aspect: number, floor: number, heightPx: number) {
  return f.lookY + copyLift(f, aspect, f.y, f.z, f.lookY, floor, heightPx);
}

/** Where the door's rim and the Enter slab land in the rest shot, each as a
 *  share of the frame height from the top. */
export function restShot(aspect: number, floor: number, heightPx: number) {
  const f = framing(aspect, floor, heightPx);
  const lookY = restLookY(f, aspect, floor, heightPx);
  const tanV = Math.tan(rad(f.fov / 2));
  const at = (y: number, z: number) => (1 - ndcY(f.y, f.z, lookY, tanV, y, z)) / 2;
  return { rimTop: at(RIM_TOP, DOOR.z), rimBottom: at(RIM_BOTTOM, DOOR.z), cta: at(CTA_AT.y, CTA_AT.z) };
}

/** Whether a plaque's slab would be left part in, part out of the frame
 *  where the dolly stops (the camera level with the door, square on it).
 *  Those fade out on the way in, so the stop frame holds only whole ones. */
export function cutAtStop(slot: Slot, f: Framing, aspect: number) {
  const d = f.endZ - slot.z;
  if (d < 0.3) return false; // behind or beside the camera: never in the stop frame
  const tanV = Math.tan(rad(f.fov / 2));
  const halfW = d * tanV * aspect;
  const halfH = d * tanV;
  const x0 = (Math.abs(slot.x) - (SLAB_W / 2) * slot.s) / halfW;
  const x1 = (Math.abs(slot.x) + (SLAB_W / 2) * slot.s) / halfW;
  const y0 = (slot.h + LIFT - DOOR.y) / halfH;
  const y1 = (slot.h + LIFT + SLAB_H * slot.s - DOOR.y) / halfH;
  const inside = x0 < 1 && y1 > -1 && y0 < 1; // some of it is in frame
  const whole = x1 <= 0.98 && y0 >= -0.98 && y1 <= 0.98;
  return inside && !whole;
}
