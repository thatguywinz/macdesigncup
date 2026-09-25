// Tiny wireframe engine for <WireSolid>: convex solids as vertex/face lists,
// rotated and perspective-projected in plain JS, emitted as SVG path data.
// Pure functions of their inputs (no DOM, no time), so the server and the
// first client render produce byte-identical paths.

export type WireShape = "cube" | "octahedron" | "icosahedron" | "cylinder" | "cone" | "prism";

type Vec3 = readonly [number, number, number];

interface Edge {
  a: number;
  b: number;
  /** The two faces that meet here. */
  f1: number;
  f2: number;
  /** A hard edge (always drawn: solid when visible, per `hidden` when not).
   *  Soft edges (the facets of a round surface) only draw on the silhouette. */
  hard: boolean;
  /** Part of the shape's ember accent. */
  accent: boolean;
}

export interface Solid {
  vertices: Vec3[];
  faces: number[][];
  /** Outward unit normal and centroid per face (model space). */
  normals: Vec3[];
  centroids: Vec3[];
  edges: Edge[];
}

const ROUND_SEGMENTS = 36;

const sub = (p: Vec3, q: Vec3): Vec3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p: Vec3, q: Vec3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p: Vec3, q: Vec3): Vec3 => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
const norm = (p: Vec3): Vec3 => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};

/** Scale so the farthest vertex sits on the unit sphere. */
function toUnit(vertices: Vec3[]): Vec3[] {
  const r = Math.max(...vertices.map((v) => Math.hypot(v[0], v[1], v[2])));
  return vertices.map((v) => [v[0] / r, v[1] / r, v[2] / r] as Vec3);
}

/**
 * Build edges from faces. `soft(a, b)` marks facet edges of a curved surface;
 * `accent(a, b)` marks the ember edges.
 */
function assemble(
  rawVertices: Vec3[],
  faces: number[][],
  soft: (a: number, b: number) => boolean = () => false,
  accent: (a: number, b: number) => boolean = () => false,
): Solid {
  const vertices = toUnit(rawVertices);
  const centroids = faces.map((f) => {
    const c = f.reduce<[number, number, number]>(
      (acc, i) => [acc[0] + vertices[i][0], acc[1] + vertices[i][1], acc[2] + vertices[i][2]],
      [0, 0, 0],
    );
    return [c[0] / f.length, c[1] / f.length, c[2] / f.length] as Vec3;
  });
  const normals = faces.map((f, fi) => {
    const n = norm(cross(sub(vertices[f[1]], vertices[f[0]]), sub(vertices[f[2]], vertices[f[0]])));
    // Convex and centred on the origin: outward means away from the centre.
    return dot(n, centroids[fi]) < 0 ? ([-n[0], -n[1], -n[2]] as Vec3) : n;
  });

  const byKey = new Map<string, { a: number; b: number; faces: number[] }>();
  faces.forEach((f, fi) => {
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const e = byKey.get(key) ?? { a: Math.min(a, b), b: Math.max(a, b), faces: [] };
      e.faces.push(fi);
      byKey.set(key, e);
    });
  });
  const edges: Edge[] = [...byKey.values()].map(({ a, b, faces: fs }) => ({
    a,
    b,
    f1: fs[0],
    f2: fs[1] ?? fs[0],
    hard: !soft(a, b),
    accent: accent(a, b),
  }));

  return { vertices, faces, normals, centroids, edges };
}

function cube(): Solid {
  const v: Vec3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
  // index = (x>0)*4 + (y>0)*2 + (z>0)
  const faces = [
    [0, 1, 3, 2], // x-
    [4, 6, 7, 5], // x+
    [0, 4, 5, 1], // y-
    [2, 3, 7, 6], // y+
    [0, 2, 6, 4], // z-
    [1, 5, 7, 3], // z+
  ];
  // Accent: the top front edge (y+, z+).
  return assemble(v, faces, undefined, (a, b) => (a === 3 && b === 7) || (a === 7 && b === 3));
}

function octahedron(): Solid {
  const v: Vec3[] = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];
  const faces: number[][] = [];
  for (const x of [0, 1]) for (const y of [2, 3]) for (const z of [4, 5]) faces.push([x, y, z]);
  // Accent: the front upper edge.
  return assemble(v, faces, undefined, (a, b) => a + b === 6 && Math.min(a, b) === 2);
}

function icosahedron(): Solid {
  const p = (1 + Math.sqrt(5)) / 2;
  const v: Vec3[] = [
    [-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0],
    [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p],
    [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1],
  ];
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  // Accent: the top ridge.
  return assemble(v, faces, undefined, (a, b) => Math.min(a, b) === 0 && Math.max(a, b) === 1);
}

function cylinder(): Solid {
  const n = ROUND_SEGMENTS;
  const r = 1;
  const h = 0.9;
  const v: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    v.push([r * Math.cos(t), h, r * Math.sin(t)]);
  }
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    v.push([r * Math.cos(t), -h, r * Math.sin(t)]);
  }
  const faces: number[][] = [
    Array.from({ length: n }, (_, i) => i), // top
    Array.from({ length: n }, (_, i) => n + i), // bottom
  ];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, n + j, n + i]);
  }
  // Rims are hard; the verticals are facets of the round side. Accent: top rim.
  return assemble(
    v,
    faces,
    (a, b) => Math.abs(a - b) === n,
    (a, b) => a < n && b < n,
  );
}

function cone(): Solid {
  const n = ROUND_SEGMENTS;
  const r = 1;
  const h = 1.1;
  const v: Vec3[] = [[0, h, 0]];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    v.push([r * Math.cos(t), -h * 0.55, r * Math.sin(t)]);
  }
  const faces: number[][] = [Array.from({ length: n }, (_, i) => i + 1)];
  for (let i = 0; i < n; i++) {
    const a = i + 1;
    const b = ((i + 1) % n) + 1;
    faces.push([0, a, b]);
  }
  // Base rim hard; apex lines are facets. Accent: the base rim.
  return assemble(
    v,
    faces,
    (a, b) => a === 0 || b === 0,
    (a, b) => a !== 0 && b !== 0,
  );
}

function prism(): Solid {
  // A triangular prism lying on its side, long axis along x.
  const len = 1.35;
  const tri: [number, number][] = [
    [0.95, 0],
    [-0.5, 0.82],
    [-0.5, -0.82],
  ];
  const v: Vec3[] = [];
  for (const x of [-len, len]) for (const [y, z] of tri) v.push([x, y - 0.1, z]);
  const faces = [
    [0, 1, 2], // end x-
    [3, 5, 4], // end x+
    [0, 3, 4, 1],
    [1, 4, 5, 2],
    [2, 5, 3, 0],
  ];
  // Accent: the top ridge.
  return assemble(v, faces, undefined, (a, b) => Math.min(a, b) === 0 && Math.max(a, b) === 3);
}

const BUILDERS: Record<WireShape, () => Solid> = {
  cube,
  octahedron,
  icosahedron,
  cylinder,
  cone,
  prism,
};

const cache = new Map<WireShape, Solid>();

/** The unit-radius solid for a shape (built once, then cached). */
export function getSolid(shape: WireShape): Solid {
  let s = cache.get(shape);
  if (!s) {
    s = BUILDERS[shape]();
    cache.set(shape, s);
  }
  return s;
}

/** Camera distance from the origin, in solid radii. Lower = stronger perspective. */
export const CAMERA_DISTANCE = 4.5;
/** Half the SVG viewBox: the unit sphere projected at CAMERA_DISTANCE, plus a hair. */
export const VIEW_EXTENT = 1.32;

export interface ProjectedPaths {
  /** Visible edges and silhouettes. */
  visible: string;
  /** Hard edges behind the solid. */
  hidden: string;
  /** Visible accent edges. */
  accent: string;
}

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString();

/**
 * Rotate (yaw about y, then pitch about x), project with a pinhole camera on
 * +z looking at the origin, classify every edge, and emit path data in a
 * viewBox of `-VIEW_EXTENT -VIEW_EXTENT 2*VIEW_EXTENT 2*VIEW_EXTENT`.
 */
export function projectSolid(solid: Solid, yaw: number, pitch: number): ProjectedPaths {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const rot = (p: Vec3): Vec3 => {
    // yaw about y
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const y1 = p[1];
    // pitch about x (positive tips the top toward the camera)
    return [x1, y1 * cp - z1 * sp, y1 * sp + z1 * cp];
  };

  const D = CAMERA_DISTANCE;
  const pts = solid.vertices.map((v) => {
    const r = rot(v);
    const s = D / (D - r[2]);
    return [r[0] * s, -r[1] * s] as const;
  });
  const front = solid.faces.map((_, fi) => {
    const n = rot(solid.normals[fi]);
    const c = rot(solid.centroids[fi]);
    return dot(n, [-c[0], -c[1], D - c[2]]) > 0;
  });

  let visible = "";
  let hidden = "";
  let accent = "";
  for (const e of solid.edges) {
    const a = front[e.f1];
    const b = front[e.f2];
    const seg = `M${f3(pts[e.a][0])} ${f3(pts[e.a][1])}L${f3(pts[e.b][0])} ${f3(pts[e.b][1])}`;
    if (e.hard) {
      if (a || b) {
        if (e.accent) accent += seg;
        else visible += seg;
      } else {
        hidden += seg;
      }
    } else if (a !== b) {
      visible += seg; // silhouette of a curved surface
    }
  }
  return { visible, hidden, accent };
}
