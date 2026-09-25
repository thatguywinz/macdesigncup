// ─────────────────────────────────────────────
// The 1st-place drawing: a generic, stylised desktop 3D printer (enclosed
// frame, bed, gantry with two toolheads, a filament spool, a first layer
// going down), as an isometric line drawing. Pure and deterministic: every
// path string is computed once at module load, so the server and the client
// render identical markup.
//
// Model space: x runs right-back, z runs left-front, y is up (units ~ mm/1.2).
// Isometric: u = (x - z)·cos30, v = (x + z)·sin30 - y, then shifted into the
// viewBox. Seen from the front-right-top, so the corner (0, 0, 0) is the one
// hidden vertex of every box.
// ─────────────────────────────────────────────

export type P3 = readonly [number, number, number];
type P2 = readonly [number, number];

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;

// Overall dimensions.
export const W = 330; // width (x)
export const D = 290; // depth (z)
const BASE = 40; // plinth height
const TOP = 372; // enclosure top
const BED_Y = 168; // bed top
const BEAM_Y = 286; // X-beam underside
const HEAD_Z0 = 150; // toolheads hang in front of the beam
const HEAD_Z1 = 196;

// ViewBox framing (units). ORIGIN shifts projected model coords inside it.
export const VIEW_W = 740;
export const VIEW_H = 800;
const ORIGIN: P2 = [340, 454];

const r1 = (n: number) => Math.round(n * 10) / 10;

export function project([x, y, z]: P3): P2 {
  return [r1((x - z) * C30 + ORIGIN[0]), r1((x + z) * S30 - y + ORIGIN[1])];
}

/** Open polyline through 3D points. */
function line(points: readonly P3[]): string {
  return points
    .map((p, i) => {
      const [u, v] = project(p);
      return `${i ? "L" : "M"}${u} ${v}`;
    })
    .join(" ");
}

const loop = (points: readonly P3[]) => `${line(points)} Z`;
const join = (...parts: string[]) => parts.filter(Boolean).join(" ");

/**
 * A box's twelve edges, split into visible and hidden (the three edges that
 * meet at its min corner face away from this view).
 */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const visible = join(
    loop([
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    line([
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ]),
    line([
      [x1, y0, z0],
      [x1, y1, z0],
    ]),
    line([
      [x1, y0, z1],
      [x1, y1, z1],
    ]),
    line([
      [x0, y0, z1],
      [x0, y1, z1],
    ]),
  );
  const hidden = join(
    line([
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y0, z1],
    ]),
    line([
      [x0, y0, z0],
      [x0, y1, z0],
    ]),
  );
  return { visible, hidden };
}

type Plane = "xy" | "yz" | "xz";

/** Points round a circle in a model plane (closed: first point repeated). */
function circlePts(c: P3, r: number, plane: Plane, n = 56, from = 0, to = Math.PI * 2): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const a = Math.cos(t) * r;
    const b = Math.sin(t) * r;
    out.push(
      plane === "xy" ? [c[0] + a, c[1] + b, c[2]] : plane === "yz" ? [c[0], c[1] + a, c[2] + b] : [c[0] + a, c[1], c[2] + b],
    );
  }
  return out;
}

const circle = (c: P3, r: number, plane: Plane, n?: number) => line(circlePts(c, r, plane, n));

/** A rectangle inset on one face of a box (a door, a window, a screen). */
function faceRect(face: "front" | "right" | "top", a0: number, a1: number, b0: number, b1: number, at: number) {
  if (face === "front")
    return loop([
      [a0, b0, at],
      [a1, b0, at],
      [a1, b1, at],
      [a0, b1, at],
    ]);
  if (face === "right")
    return loop([
      [at, b0, a0],
      [at, b0, a1],
      [at, b1, a1],
      [at, b1, a0],
    ]);
  return loop([
    [a0, at, b0],
    [a1, at, b0],
    [a1, at, b1],
    [a0, at, b1],
  ]);
}

function cubic(p0: P3, p1: P3, p2: P3, p3: P3, n = 40): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    const k = [m * m * m, 3 * m * m * t, 3 * m * t * t, t * t * t];
    out.push([
      k[0] * p0[0] + k[1] * p1[0] + k[2] * p2[0] + k[3] * p3[0],
      k[0] * p0[1] + k[1] * p1[1] + k[2] * p2[1] + k[3] * p3[1],
      k[0] * p0[2] + k[1] * p1[2] + k[2] * p2[2] + k[3] * p3[2],
    ]);
  }
  return out;
}

// ── Parts ────────────────────────────────────

const base = box(0, W, 0, BASE, 0, D);
const frame = box(0, W, BASE, TOP, 0, D);

// Glass door on the front face, a side window, a lid, and the door handle.
const panels = join(
  faceRect("front", 16, W - 16, BASE + 16, TOP - 16, D),
  faceRect("right", 16, D - 16, BASE + 16, TOP - 16, W),
  faceRect("top", 16, W - 16, 16, D - 16, TOP),
);
const handle = line([
  [W - 34, BASE + 150, D],
  [W - 34, BASE + 210, D],
]);

// Touchscreen and power button on the plinth front.
const screen = join(faceRect("front", 24, 104, 10, 30, D), circle([W - 32, 20, D], 6, "xy", 28));

// Z axis: two guide rods and a lead screw at the back, standing on the plinth.
const zRods = join(
  line([
    [36, BASE, 22],
    [36, TOP, 22],
  ]),
  line([
    [W - 36, BASE, 22],
    [W - 36, TOP, 22],
  ]),
  line([
    [W / 2, BASE, 16],
    [W / 2, BED_Y - 8, 16],
  ]),
);

// The bed: a plate on the Z carriage, with a light grid on its surface.
const bed = box(22, W - 22, BED_Y - 8, BED_Y, 22, D - 22);
const bedGrid = join(
  ...[1, 2, 3].map((i) => {
    const x = 22 + ((W - 44) * i) / 4;
    return line([
      [x, BED_Y, 22],
      [x, BED_Y, D - 22],
    ]);
  }),
  ...[1, 2, 3].map((i) => {
    const z = 22 + ((D - 44) * i) / 4;
    return line([
      [22, BED_Y, z],
      [W - 22, BED_Y, z],
    ]);
  }),
);

// Gantry: two Y rails along the sides, one X beam across.
const yRails = join(
  box(10, 24, BEAM_Y + 16, BEAM_Y + 26, 12, D - 12).visible,
  box(W - 24, W - 10, BEAM_Y + 16, BEAM_Y + 26, 12, D - 12).visible,
);
const beam = box(12, W - 12, BEAM_Y, BEAM_Y + 16, 128, HEAD_Z0);

// Two independent toolheads: the left one printing, the right one parked.
const HEAD_A_X = 104;
const HEAD_B_X = 262;
const HEAD_W = 50;
const HEAD_Y0 = BED_Y + 40;
const HEAD_Y1 = BEAM_Y + 12;
function toolhead(x0: number) {
  const b = box(x0, x0 + HEAD_W, HEAD_Y0, HEAD_Y1, HEAD_Z0, HEAD_Z1);
  const cx = x0 + HEAD_W / 2;
  const cz = (HEAD_Z0 + HEAD_Z1) / 2;
  const fan = circle([cx, (HEAD_Y0 + HEAD_Y1) / 2 + 6, HEAD_Z1], 16, "xy", 40);
  const hub = circle([cx, (HEAD_Y0 + HEAD_Y1) / 2 + 6, HEAD_Z1], 4, "xy", 16);
  return { box: b, fan: join(fan, hub), cx, cz };
}
const headA = toolhead(HEAD_A_X);
const headB = toolhead(HEAD_B_X);

// Nozzles: a heater block and a cone. A prints at the bed; B is lifted.
function nozzle(cx: number, cz: number, tipY: number) {
  const block = box(cx - 11, cx + 11, tipY + 18, HEAD_Y0, cz - 9, cz + 9).visible;
  const cone = join(
    line([
      [cx - 7, tipY + 18, cz + 9],
      [cx, tipY, cz],
      [cx + 7, tipY + 18, cz + 9],
    ]),
    line([
      [cx + 11, tipY + 18, cz - 4],
      [cx, tipY, cz],
    ]),
  );
  return join(block, cone);
}
const TIP_A_Y = BED_Y + 3;
const nozzles = join(nozzle(headA.cx, headA.cz, TIP_A_Y), nozzle(headB.cx, headB.cz, TIP_A_Y + 12));

// Filament spool on an arm off the right side (its axis runs along x).
const SPOOL_C: P3 = [W + 62, 262, D / 2];
const SPOOL_R = 74;
const SPOOL_HALF = 24;
const spoolArm = line([
  [W, 262, D / 2],
  [W + 62 + SPOOL_HALF + 14, 262, D / 2],
]);
const near: P3 = [SPOOL_C[0] + SPOOL_HALF, SPOOL_C[1], SPOOL_C[2]];
const far: P3 = [SPOOL_C[0] - SPOOL_HALF, SPOOL_C[1], SPOOL_C[2]];
const nearRim = circlePts(near, SPOOL_R, "yz", 72);
const farRim = circlePts(far, SPOOL_R, "yz", 72);
// Silhouette: the rim points furthest across the projected axis direction.
function silhouette() {
  const axis = [C30, S30]; // projected +x
  const perp = [-axis[1], axis[0]];
  let lo = 0;
  let hi = 0;
  let loV = Infinity;
  let hiV = -Infinity;
  nearRim.forEach((p, i) => {
    const [u, v] = project(p);
    const d = u * perp[0] + v * perp[1];
    if (d < loV) {
      loV = d;
      lo = i;
    }
    if (d > hiV) {
      hiV = d;
      hi = i;
    }
  });
  return join(line([nearRim[lo], farRim[lo]]), line([nearRim[hi], farRim[hi]]));
}
const spool = join(line(nearRim), line(farRim), silhouette(), circle(near, 20, "yz", 32), circle(near, 8, "yz", 20));
// Filament wound on the drum, seen on the near flange.
const winding = join(circle(near, SPOOL_R - 12, "yz", 64), circle(near, SPOOL_R - 22, "yz", 60));

// Feed tubes over the lid: spool to each head.
const tubeA = line(
  cubic(
    [SPOOL_C[0], SPOOL_C[1] + SPOOL_R - 4, D / 2 + 6],
    [SPOOL_C[0] - 10, TOP + 120, D / 2 + 10],
    [headA.cx, TOP + 110, headA.cz],
    [headA.cx, HEAD_Y1, headA.cz],
  ),
);
const tubeB = line(
  cubic(
    [SPOOL_C[0] - 6, SPOOL_C[1] + SPOOL_R - 6, D / 2 - 6],
    [SPOOL_C[0] - 24, TOP + 70, D / 2],
    [headB.cx, TOP + 64, headB.cz],
    [headB.cx, HEAD_Y1, headB.cz],
  ),
);

// The first layer: two perimeters, then infill rows running toward the
// nozzle, the last row stopping right under it.
const LAYER_Y = BED_Y + 0.5;
const PX0 = 58;
const PX1 = 236;
const PZ0 = 74;
const PZ1 = 242;
const perimeter = (k: number) =>
  loop([
    [PX0 + k, LAYER_Y, PZ0 + k],
    [PX1 - k, LAYER_Y, PZ0 + k],
    [PX1 - k, LAYER_Y, PZ1 - k],
    [PX0 + k, LAYER_Y, PZ1 - k],
  ]);
function infill() {
  const pts: P3[] = [];
  const x0 = PX0 + 14;
  const x1 = PX1 - 14;
  const step = 9;
  const rows: number[] = [];
  for (let z = PZ0 + 14; z < headA.cz; z += step) rows.push(z);
  rows.push(headA.cz);
  rows.forEach((z, i) => {
    const last = i === rows.length - 1;
    const ltr = i % 2 === 0;
    const a = ltr ? x0 : x1;
    const b = last ? headA.cx : ltr ? x1 : x0;
    pts.push([a, LAYER_Y, z], [b, LAYER_Y, z]);
  });
  return line(pts);
}
const layer = join(perimeter(0), perimeter(5));
const layerInfill = infill();
// The hot tip: a small ring where the nozzle meets the layer.
const tipGlow = circle([headA.cx, LAYER_Y, headA.cz], 7, "xz", 24);

// Construction lines on the floor: the plinth's edges run on past its corners.
const ground = join(
  line([
    [W, 0, D],
    [W + 60, 0, D],
  ]),
  line([
    [W, 0, D],
    [W, 0, D + 60],
  ]),
  line([
    [0, 0, D],
    [0, 0, D + 60],
  ]),
  line([
    [W, 0, 0],
    [W + 60, 0, 0],
  ]),
);

// ── Layers, in drawing order ─────────────────
export type Ink = "strong" | "mid" | "faint" | "ember" | "emberSoft";

export interface Layer {
  id: string;
  d: string;
  ink: Ink;
  /** Slice of the scroll progress this layer draws over. */
  range: readonly [number, number];
  width?: 1 | 1.1 | 1.2 | 1.3 | 1.4 | 1.5 | 1.7 | 2;
}

export const LAYERS: Layer[] = [
  { id: "ground", d: ground, ink: "faint", range: [0, 0.14] },
  { id: "base", d: base.visible, ink: "strong", range: [0.02, 0.18], width: 1.4 },
  { id: "frame", d: frame.visible, ink: "strong", range: [0.1, 0.32], width: 1.4 },
  { id: "screen", d: screen, ink: "mid", range: [0.2, 0.32] },
  { id: "panels", d: panels, ink: "faint", range: [0.24, 0.4] },
  { id: "handle", d: handle, ink: "mid", range: [0.34, 0.4], width: 2 },
  { id: "zrods", d: zRods, ink: "mid", range: [0.28, 0.44] },
  { id: "bed", d: bed.visible, ink: "strong", range: [0.36, 0.5], width: 1.3 },
  { id: "bedgrid", d: bedGrid, ink: "faint", range: [0.44, 0.56] },
  { id: "rails", d: yRails, ink: "mid", range: [0.42, 0.56] },
  { id: "beam", d: beam.visible, ink: "strong", range: [0.46, 0.6], width: 1.3 },
  { id: "headA", d: headA.box.visible, ink: "strong", range: [0.52, 0.66], width: 1.3 },
  { id: "headB", d: headB.box.visible, ink: "strong", range: [0.55, 0.68], width: 1.3 },
  { id: "fans", d: join(headA.fan, headB.fan), ink: "mid", range: [0.6, 0.72] },
  { id: "nozzles", d: nozzles, ink: "mid", range: [0.62, 0.74] },
  { id: "arm", d: spoolArm, ink: "mid", range: [0.58, 0.64] },
  { id: "spool", d: spool, ink: "strong", range: [0.6, 0.78], width: 1.3 },
  { id: "winding", d: winding, ink: "emberSoft", range: [0.7, 0.84] },
  { id: "tubeB", d: tubeB, ink: "faint", range: [0.72, 0.84] },
  { id: "tubeA", d: tubeA, ink: "emberSoft", range: [0.72, 0.86] },
  { id: "layer", d: layer, ink: "ember", range: [0.8, 0.9], width: 1.5 },
  { id: "infill", d: layerInfill, ink: "ember", range: [0.86, 1], width: 1.5 },
  { id: "tip", d: tipGlow, ink: "ember", range: [0.95, 1], width: 1.5 },
];

/** Back edges, dashed; they fade in (a dash pattern can't also draw). */
export const HIDDEN = join(base.hidden, frame.hidden, bed.hidden);

// ── The one callout ──────────────────────────
// An overall dimension across the enclosure's full width, labelled "1st
// place" (rendered in HTML over the SVG). The drawing carries no other text:
// the machine's name, value and spools live in the legend beside it, which is
// the crawlable, accessible copy (the figure is decorative). Units are
// viewBox units; the component turns them into percentages.
const frameLeft = project([0, TOP, D]);
const frameRight = project([W, TOP, 0]);
const frameTop = project([0, TOP, 0]);

export interface Dim {
  /** Left and right ends, and the height of the line. */
  x0: number;
  x1: number;
  y: number;
  /** Where on the scroll progress it appears. */
  at: number;
}

export const FIRST_PLACE_DIM: Dim = { x0: frameLeft[0], x1: frameRight[0], y: frameTop[1] - 50, at: 0.34 };
