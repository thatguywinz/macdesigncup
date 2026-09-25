// ─────────────────────────────────────────────
// The cup on "The day" sheet: pure, deterministic path data.
//
// One design object (the competition's namesake, drawn as a surface of
// revolution) in a 520 × 600 drawing sheet. Everything here is computed once
// at module load with plain arithmetic: no Math.sin/cos (engines may differ in
// the last bit), no Math.random (a seeded PRNG instead), so the server's `d`
// strings and the browser's are identical and hydration never mismatches.
// ─────────────────────────────────────────────

export const VIEW_W = 520;
export const VIEW_H = 600;
/** Axis of the cup. */
export const CX = 260;
/** Ellipse squash of every ring: the cup is seen from slightly above. */
export const TILT = 0.22;

type Pt = readonly [number, number];

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const line = (pts: readonly Pt[]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ");

// ── The profile: [y, radius] from the rim down to the foot ─────────────────
const PROFILE: readonly Pt[] = [
  [150, 110],
  [172, 109],
  [214, 103],
  [256, 90],
  [292, 69],
  [318, 46],
  [334, 28],
  [346, 16],
  [360, 12],
  [374, 12.5],
  [386, 20],
  [398, 12.5],
  [414, 12],
  [430, 21],
  [446, 45],
  [458, 63],
  [466, 70],
];

export const RIM_Y = 150;
export const RIM_R = 110;
export const FOOT_Y = 466;
export const FOOT_R = 70;
/** Lowest point of the drawn cup (front of the foot ellipse). */
export const CUP_BOTTOM = FOOT_Y + FOOT_R * TILT;

function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

/** Dense, smooth [y, r] samples of the profile (Catmull-Rom through the control points). */
const SAMPLES: readonly Pt[] = (() => {
  const out: Pt[] = [];
  const n = PROFILE.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = PROFILE[Math.max(0, i - 1)];
    const p1 = PROFILE[i];
    const p2 = PROFILE[i + 1];
    const p3 = PROFILE[Math.min(n - 1, i + 2)];
    for (let s = 0; s < 8; s++) {
      const t = s / 8;
      out.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  out.push(PROFILE[n - 1]);
  return out;
})();

/** Radius of the cup at height y (linear between samples). */
export function radiusAt(y: number): number {
  if (y <= SAMPLES[0][0]) return SAMPLES[0][1];
  for (let i = 1; i < SAMPLES.length; i++) {
    const [y1, r1] = SAMPLES[i];
    if (y <= y1) {
      const [y0, r0] = SAMPLES[i - 1];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
    }
  }
  return SAMPLES[SAMPLES.length - 1][1];
}

// ── Unit circle every 7.5 degrees, by rotation recurrence (only + and ×) ────
const STEP_C = 0.9914448613738104; // cos 7.5°
const STEP_S = 0.13052619222005157; // sin 7.5°
const CIRCLE_STEPS = 48;
const CIRCLE: readonly Pt[] = (() => {
  const out: Pt[] = [];
  let c = 1;
  let s = 0;
  for (let i = 0; i < CIRCLE_STEPS; i++) {
    out.push([c, s]);
    const nc = c * STEP_C - s * STEP_S;
    s = s * STEP_C + c * STEP_S;
    c = nc;
  }
  return out;
})();

/** Points on an ellipse, from step `start` for `count` steps of 7.5° (y down: 90° is the front). */
function ellipsePts(cx: number, cy: number, rx: number, ry: number, start: number, count: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const [c, s] = CIRCLE[(((start + i) % CIRCLE_STEPS) + CIRCLE_STEPS) % CIRCLE_STEPS];
    out.push([cx + rx * c, cy + ry * s]);
  }
  return out;
}

// ── Seeded noise for the sketch ─────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SketchOpts {
  seed: number;
  /** Max sideways wander, px. */
  amp: number;
  /** Overshoot past each end along the tangent, px (sketch lines run long). */
  over?: number;
  /** Slice of the base line to use, 0..1. */
  from?: number;
  to?: number;
  /** Offset of the whole stroke. */
  dx?: number;
  dy?: number;
}

/** A loose, hand-drawn version of a polyline: smooth wander + a little tremor + overshoot. */
function sketch(base: readonly Pt[], { seed, amp, over = 0, from = 0, to = 1, dx = 0, dy = 0 }: SketchOpts): string {
  const rand = mulberry32(seed);
  // cumulative length
  const cum = [0];
  for (let i = 1; i < base.length; i++) {
    const [x0, y0] = base[i - 1];
    const [x1, y1] = base[i];
    cum.push(cum[i - 1] + Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)));
  }
  const total = cum[cum.length - 1];
  const at = (d: number): { p: Pt; t: Pt } => {
    const dd = Math.min(Math.max(d, 0), total);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < dd) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const k = (dd - cum[i - 1]) / seg;
    const [x0, y0] = base[i - 1];
    const [x1, y1] = base[i];
    const len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) || 1;
    return { p: [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k], t: [(x1 - x0) / len, (y1 - y0) / len] };
  };

  const start = total * from;
  const end = total * to;
  // value-noise knots every ~46px for the slow wander
  const knotGap = 46;
  const knots: number[] = [];
  for (let i = 0; i <= Math.ceil((end - start + 2 * over) / knotGap) + 1; i++) knots.push(rand() * 2 - 1);
  const wander = (s: number) => {
    const x = s / knotGap;
    const i = Math.floor(x);
    const k = x - i;
    const e = k * k * (3 - 2 * k);
    return knots[i] + (knots[Math.min(i + 1, knots.length - 1)] - knots[i]) * e;
  };

  const pts: Pt[] = [];
  const step = 6;
  for (let s = -over; s <= end - start + over + 0.001; s += step) {
    const d = start + s;
    let p: Pt;
    let t: Pt;
    if (d < 0 || d > total) {
      // extend straight along the end tangent
      const edge = at(d < 0 ? 0 : total);
      const ext = d < 0 ? d : d - total;
      p = [edge.p[0] + edge.t[0] * ext, edge.p[1] + edge.t[1] * ext];
      t = edge.t;
    } else {
      ({ p, t } = at(d));
    }
    const n = amp * (0.85 * wander(s + over) + 0.15 * (rand() * 2 - 1));
    pts.push([p[0] - t[1] * n + dx, p[1] + t[0] * n + dy]);
  }
  return line(pts);
}

// ── Solid outlines ──────────────────────────────────────────────────────────
const LEFT: readonly Pt[] = SAMPLES.map(([y, r]) => [CX - r, y]);
const RIGHT: readonly Pt[] = SAMPLES.map(([y, r]) => [CX + r, y]);
const RIM_RY = RIM_R * TILT;
const FOOT_RY = FOOT_R * TILT;

export const SILHOUETTE_LEFT = line(LEFT);
export const SILHOUETTE_RIGHT = line(RIGHT);

/** Full rim ellipse. */
export const RIM = `M${CX - RIM_R} ${RIM_Y} A${RIM_R} ${f(RIM_RY)} 0 1 0 ${CX + RIM_R} ${RIM_Y} A${RIM_R} ${f(RIM_RY)} 0 1 0 ${CX - RIM_R} ${RIM_Y}`;
/** Front (near) half of the rim: the lip you see. */
export const RIM_FRONT = `M${CX - RIM_R} ${RIM_Y} A${RIM_R} ${f(RIM_RY)} 0 0 0 ${CX + RIM_R} ${RIM_Y}`;
/** Front half of the foot's bottom edge. */
export const FOOT_FRONT = `M${CX - FOOT_R} ${FOOT_Y} A${FOOT_R} ${f(FOOT_RY)} 0 0 0 ${CX + FOOT_R} ${FOOT_Y}`;

/** Closed outline of the whole solid, for the render's fill. */
export const BODY = [
  `M${CX - RIM_R} ${RIM_Y}`,
  `A${RIM_R} ${f(RIM_RY)} 0 0 1 ${CX + RIM_R} ${RIM_Y}`,
  line(RIGHT).replace(/^M/, "L"),
  `A${FOOT_R} ${f(FOOT_RY)} 0 0 1 ${CX - FOOT_R} ${FOOT_Y}`,
  line([...LEFT].reverse()).replace(/^M/, "L"),
  "Z",
].join(" ");

/** Specular streak down the lit (left-front) side of the bowl, at about -35°. */
const HL_S = -0.573576436351046; // sin -35°
const HL_C = 0.8191520442889918; // cos -35°
export const HIGHLIGHT = line(
  SAMPLES.filter(([y]) => y >= 170 && y <= 304).map(([y, r]) => [CX + r * HL_S, y + r * TILT * HL_C] as Pt),
);
/** A second, thinner glint lower on the foot. */
export const HIGHLIGHT_FOOT = line(
  SAMPLES.filter(([y]) => y >= 440 && y <= 462).map(([y, r]) => [CX + r * HL_S, y + r * TILT * HL_C] as Pt),
);

// ── Wireframe ──────────────────────────────────────────────────────────────
const RING_YS = [172, 206, 240, 272, 300, 324, 342, 386, 430, 450] as const;
const ring = (y: number, sweep: 0 | 1) => {
  const r = radiusAt(y);
  return `M${f(CX - r)} ${f(y)} A${f(r)} ${f(r * TILT)} 0 0 ${sweep} ${f(CX + r)} ${f(y)}`;
};
/** Near halves of the latitude rings, one path each (drawn in sequence). */
export const RINGS_FRONT = RING_YS.map((y) => ring(y, 0));
/** Far halves of the rings in one path (hidden lines). */
export const RINGS_BACK = RING_YS.filter((y) => y < 340).map((y) => ring(y, 1)).join(" ");

// [sin, cos] of the meridian angles (30° apart), as literals.
const S3 = 0.8660254037844386;
const FRONT_ANGLES: readonly Pt[] = [
  [-S3, 0.5],
  [-0.5, S3],
  [0, 1],
  [0.5, S3],
  [S3, 0.5],
];
const BACK_ANGLES: readonly Pt[] = [
  [-S3, -0.5],
  [-0.5, -S3],
  [0, -1],
  [0.5, -S3],
  [S3, -0.5],
];
const meridian = ([s, c]: Pt, maxY = FOOT_Y) =>
  line(SAMPLES.filter(([y]) => y <= maxY).map(([y, r]) => [CX + r * s, y + r * TILT * c] as Pt));
/** Near meridians, one path each. */
export const MERIDIANS_FRONT = FRONT_ANGLES.map((a) => meridian(a));
/** Far meridians through the bowl (hidden lines), one path. */
export const MERIDIANS_BACK = BACK_ANGLES.map((a) => meridian(a, 336)).join(" ");

// ── Construction and dimensions ────────────────────────────────────────────
export const AXIS = `M${CX} 92 V508`;
export const GUIDES = [`M112 ${RIM_Y} H446`, `M112 ${FOOT_Y} H446`, `M186 340 H334`];
export const DIM_DIA = {
  /** Extension lines up from the rim. */
  ext: `M${CX - RIM_R} 100 V${RIM_Y - 6} M${CX + RIM_R} 100 V${RIM_Y - 6}`,
  /** Dimension line, split around the label. */
  line: `M${CX - RIM_R} 108 H${CX - 30} M${CX + 30} 108 H${CX + RIM_R}`,
  ticks: `M${CX - RIM_R - 5} 113 L${CX - RIM_R + 5} 103 M${CX + RIM_R - 5} 113 L${CX + RIM_R + 5} 103`,
  label: { x: CX, y: 112 },
};
export const DIM_H = {
  line: `M432 ${RIM_Y} V${(RIM_Y + FOOT_Y) / 2 - 24} M432 ${(RIM_Y + FOOT_Y) / 2 + 24} V${FOOT_Y}`,
  ticks: `M427 ${RIM_Y + 5} L437 ${RIM_Y - 5} M427 ${FOOT_Y + 5} L437 ${FOOT_Y - 5}`,
  label: { x: 432, y: (RIM_Y + FOOT_Y) / 2 },
};

// ── The loose sketch (stage 2) ─────────────────────────────────────────────
const rimLoose = ellipsePts(CX + 2, RIM_Y + 1, RIM_R + 3, RIM_RY + 2, 26, 54);
const rimLoose2 = ellipsePts(CX - 3, RIM_Y - 1, RIM_R - 4, RIM_RY - 2, 30, 30);
const footLoose = ellipsePts(CX, FOOT_Y + 1, FOOT_R + 4, FOOT_RY + 2, -2, 28);
const knop = ellipsePts(CX, 386, 22, 5, -2, 28);

export const SKETCH: readonly string[] = [
  sketch(LEFT, { seed: 11, amp: 2.6, over: 10, dx: -1 }),
  sketch(RIGHT, { seed: 23, amp: 2.6, over: 10, dx: 1 }),
  sketch(rimLoose, { seed: 5, amp: 2.2, over: 6 }),
  sketch(LEFT, { seed: 37, amp: 3.4, over: 4, from: 0.06, to: 0.62, dx: -3, dy: 2 }),
  sketch(RIGHT, { seed: 41, amp: 3.4, over: 4, from: 0.04, to: 0.58, dx: 3, dy: 1 }),
  sketch(footLoose, { seed: 7, amp: 1.8, over: 12 }),
  sketch(rimLoose2, { seed: 13, amp: 2, over: 4 }),
  sketch(knop, { seed: 17, amp: 1.2, over: 4 }),
  // ground gesture under the foot
  sketch(
    [
      [150, 492],
      [372, 490],
    ],
    { seed: 29, amp: 1.6, over: 0 },
  ),
];

/** Shading hatch on the shadow (right) side of the bowl. */
export const HATCH: readonly string[] = [206, 226, 246, 266, 286].map((y, i) => {
  const xr = CX + radiusAt(y) - 5 - i * 2;
  return sketch(
    [
      [xr - 30 + i * 3, y + 16],
      [xr - 3, y - 10],
    ],
    { seed: 101 + i, amp: 0.8 },
  );
});

/** Leader from the THEME tag to the rim. */
export const TAG_LEADER = sketch(
  [
    [110, 96],
    [150, 118],
    [172, 136],
  ],
  { seed: 61, amp: 1.2 },
);

// ── Sheet furniture ────────────────────────────────────────────────────────
export const SHEET = {
  border: `M10 10 H510 V590 H10 Z`,
  /** Title block, bottom right: outline + dividers. */
  titleBlock: `M300 590 V540 H510 M300 565 H510 M420 540 V565`,
  crosshair: `M${CX - 26} 300 H${CX - 8} M${CX + 8} 300 H${CX + 26} M${CX} 274 V292 M${CX} 308 V326`,
  crosshairRing: `M${CX - 6} 300 A6 6 0 1 0 ${CX + 6} 300 A6 6 0 1 0 ${CX - 6} 300`,
  /** Viewport axis gizmo, bottom left. */
  gizmoY: `M48 548 V514`,
  gizmoZ: `M48 548 L30 562`,
  gizmoX: `M48 548 H82`,
};

// ── The blank file's viewport (stage 1) ────────────────────────────────────
// What a 3D modelling app shows on a new file: a ground grid in perspective
// around the origin (the crosshair), fading into the distance, and a view cube
// in the top corner, so the empty sheet reads as an empty viewport.
const EL_S = 0.4067366430758002; // sin 24°: the camera looks down a little
const EL_C = 0.9135454576426009; // cos 24°
const CAM_D = 900;
const GRID_HALF = 192;
const GRID_STEP = 32;
const ORIGIN_Y = 300;
/** A point on the ground plane (x right, z toward the viewer) on the sheet. */
const ground = (x: number, z: number): Pt => {
  const k = CAM_D / (CAM_D - z * EL_C);
  return [CX + x * k, ORIGIN_Y + z * EL_S * k];
};
const seg = (a: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
/** Grid coordinates from -GRID_HALF to GRID_HALF, every `every` cells, without 0 (the axes). */
const gridTicks = (every: number) => {
  const out: number[] = [];
  const n = GRID_HALF / GRID_STEP;
  for (let i = -n; i <= n; i += every) if (i !== 0) out.push(i * GRID_STEP);
  return out;
};
const groundRows = (every: number) =>
  gridTicks(every).map((z) => seg(ground(-GRID_HALF, z), ground(GRID_HALF, z))).join(" ");
const groundCols = (every: number) =>
  gridTicks(every).map((x) => seg(ground(x, -GRID_HALF), ground(x, GRID_HALF))).join(" ");
const GROUND_FAR = ground(0, -GRID_HALF)[1];
const GROUND_NEAR = ground(0, GRID_HALF)[1];
const GROUND_W = ground(GRID_HALF, GRID_HALF)[0] - CX;

export const VIEWPORT = {
  /** Lines of constant depth, and lines running into the distance. */
  rows: groundRows(1),
  cols: groundCols(1),
  /** Every other line, for the phone thumbnails. */
  rowsCoarse: groundRows(2),
  colsCoarse: groundCols(2),
  /** The ground's two axes through the origin. */
  axisX: seg(ground(-GRID_HALF, 0), ground(GRID_HALF, 0)),
  axisZ: seg(ground(0, -GRID_HALF), ground(0, GRID_HALF)),
  /** Box the fade-out ellipse is fitted to. */
  fade: {
    x: CX - GROUND_W,
    y: GROUND_FAR - 6,
    width: 2 * GROUND_W,
    height: GROUND_NEAR - GROUND_FAR + 12,
  },
  /** View cube, top right: an isometric cube (edge 28) inside a compass ring. */
  cube: {
    ring: `M420 76 A38 22 0 1 0 496 76 A38 22 0 1 0 420 76`,
    faces: `M458 90 L482.2 76 V48 L458 34 L433.8 48 V76 Z`,
    top: `M458 62 L482.2 48 L458 34 L433.8 48 Z`,
    edges: `M458 90 L482.2 76 V48 L458 34 L433.8 48 V76 Z M458 90 V62 L482.2 48 M458 62 L433.8 48`,
  },
};

/** THEME tag outline (drawn around its own origin; placed with a transform). */
export const TAG = {
  outline: `M0 0 H78 V24 H0 Z`,
  hole: `M9 12 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0`,
};

// ── Presentation (stage 4) and big screen (stage 5) ────────────────────────
const bracket = (x: number, y: number, sx: 1 | -1, sy: 1 | -1, len = 26) =>
  `M${x + sx * len} ${y} H${x} V${y + sy * len}`;
export const PRESENT = {
  frame: `M96 84 H424 V514 H96 Z`,
  brackets: [
    bracket(96, 84, 1, 1),
    bracket(424, 84, -1, 1),
    bracket(424, 514, -1, -1),
    bracket(96, 514, 1, -1),
  ],
  dots: [
    { cx: 248, cy: 500 },
    { cx: 260, cy: 500 },
    { cx: 272, cy: 500 },
  ],
};

export const SCREEN = {
  outer: `M36 52 H484 V436 H36 Z`,
  inner: `M46 62 H474 V426 H46 Z`,
  cables: `M118 10 V52 M402 10 V52`,
};

export const PLINTH = {
  top: { cx: CX, cy: 354, rx: 84, ry: 17 },
  /** Front face (between the top and bottom front arcs). */
  front: `M176 354 V404 A84 17 0 0 0 344 404 V354 A84 17 0 0 1 176 354 Z`,
  edges: `M176 354 V404 A84 17 0 0 0 344 404 V354`,
  topEllipse: `M176 354 A84 17 0 1 0 344 354 A84 17 0 1 0 176 354`,
};

export const SPOT = {
  lamp: `M250 66 H270 L275 78 H245 Z`,
  cone: `M247 78 H273 L368 356 H152 Z`,
  edges: `M247 78 L152 356 M273 78 L368 356`,
};

/** Where the cup sits on the plinth in the final state. */
export const FINAL_SCALE = 0.56;
export const FINAL_LIFT = PLINTH.top.cy + 2 - CUP_BOTTOM;
/** SVG transform for the cup group at a 0..1 blend toward the plinth. */
export function cupTransform(t: number): string {
  const s = 1 + (FINAL_SCALE - 1) * t;
  const ty = FINAL_LIFT * t;
  // scale about the cup's bottom centre, then lift
  return `matrix(${s.toFixed(4)} 0 0 ${s.toFixed(4)} ${(CX * (1 - s)).toFixed(2)} ${(CUP_BOTTOM * (1 - s) + ty).toFixed(2)})`;
}

/** SVG ids from React's `useId` (":r1:") without the colons, safe inside `url(#…)`. */
export const svgId = (id: string) => `cup${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

/**
 * Without JavaScript nothing scrubs, and the global noscript rule draws every
 * stroke at once. This stylesheet (DaySection renders it inside <noscript>)
 * shows the figure's final state instead: the in-between stages hidden
 * (`data-cup="mid"`), the finished layers shown (`"end"`), and the cup already
 * on its plinth (`"move"`).
 */
export const CUP_NOSCRIPT_CSS = [
  `[data-cup="mid"]{display:none!important}`,
  `[data-cup="end"]{opacity:1!important}`,
  `[data-cup="move"]{transform:${cupTransform(1).replace(/ /g, ",")}!important}`,
].join("");
