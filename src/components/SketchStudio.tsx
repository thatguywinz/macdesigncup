import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

/**
 * The centerpiece: a 3D wireframe object being *built*, rendered in 2D canvas
 * with hand-sketched, "boiling" ink lines. Edges draw themselves in, vertices
 * snap on, an axis gizmo and a scan sweep run — a prototype mid-construction.
 * No three.js: pure 2D projection of a rotating icosahedron.
 */

// ── Icosahedron geometry (radius 1) ──────────────────────────────
const T = (1 + Math.sqrt(5)) / 2;
const RAW_V: [number, number, number][] = [
  [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
  [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
  [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1],
];
const NORM = Math.hypot(1, T);
const VERTS = RAW_V.map(([x, y, z]) => [x / NORM, y / NORM, z / NORM] as [number, number, number]);

// Build edge list: the 30 shortest vertex pairs (icosahedron edge length).
const EDGES: [number, number][] = (() => {
  const pairs: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < VERTS.length; i++)
    for (let j = i + 1; j < VERTS.length; j++) {
      const dx = VERTS[i][0] - VERTS[j][0];
      const dy = VERTS[i][1] - VERTS[j][1];
      const dz = VERTS[i][2] - VERTS[j][2];
      pairs.push({ a: i, b: j, d: Math.hypot(dx, dy, dz) });
    }
  pairs.sort((p, q) => p.d - q.d);
  return pairs.slice(0, 30).map((p) => [p.a, p.b] as [number, number]);
})();

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Props {
  progress?: MotionValue<number>;
  reducedMotion?: boolean;
}

export default function SketchStudio({ progress, reducedMotion = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const start = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, DPR = 1;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const INK = "232,228,219";      // chalk
    const GRAPHITE = "130,130,140";
    const MARKER = "240,132,43";

    const draw = (now: number) => {
      if (!start.current) start.current = now;
      const t = (now - start.current) / 1000;
      const p = progress ? progress.get() : 0;

      const cx = W / 2;
      const cy = H * 0.47;
      const R = Math.min(W, H) * 0.34;

      // rotation: steady spin + slight scroll acceleration; gentle nod on X
      const ry = t * 0.5 + p * Math.PI * 2.2;
      const rx = -0.42 + Math.sin(t * 0.35) * 0.12;
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const CAM = 3.4;

      const proj = ([x, y, z]: [number, number, number]) => {
        // rotate Y then X
        let X = x * cosY + z * sinY;
        let Z = -x * sinY + z * cosY;
        let Y = y * cosX - Z * sinX;
        Z = y * sinX + Z * cosX;
        const f = CAM / (CAM - Z);
        return { x: cx + X * R * f, y: cy - Y * R * f, z: Z };
      };

      const pv = VERTS.map(proj);

      // build reveal (edges draw in over ~2.4s), then hold
      const BUILD = 2.4;
      const bp = reducedMotion ? 1 : Math.min(t / BUILD, 1);
      const ease = 1 - Math.pow(1 - bp, 3);
      const shown = ease * EDGES.length;

      // boiling seed bucket (hand-drawn shimmer); frozen under reduced-motion
      const bucket = reducedMotion ? 0 : Math.floor(t * 7);

      ctx.clearRect(0, 0, W, H);

      // ── ground shadow ellipse ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + R * 1.05, R * 0.78, R * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.filter = "blur(6px)";
      ctx.fill();
      ctx.restore();

      // ── construction guides (drafting density) ──
      // dashed rotation/lathe circle behind the model
      ctx.save();
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GRAPHITE},0.28)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // horizontal centerline
      ctx.beginPath();
      ctx.moveTo(W * 0.06, cy); ctx.lineTo(W * 0.94, cy);
      ctx.strokeStyle = `rgba(${GRAPHITE},0.18)`;
      ctx.stroke();
      ctx.restore();

      // ── viewport corner frame ──
      drawFrame(ctx, W, H, INK);

      // ── scan sweep ──
      if (!reducedMotion) {
        const sy = ((t * 0.22) % 1);
        const yLine = H * 0.12 + sy * H * 0.76;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, yLine); ctx.lineTo(W * 0.9, yLine);
        ctx.strokeStyle = `rgba(${MARKER},0.10)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── edges (hand-drawn, depth-sorted) ──
      const order = EDGES.map((e, i) => ({ e, i, z: (pv[e[0]].z + pv[e[1]].z) / 2 }))
        .sort((a, b) => a.z - b.z);

      const jit = R * 0.02;
      for (const { e, i } of order) {
        if (i >= shown) continue;
        const drawingEdge = i > shown - 1;
        const a = pv[e[0]], b = pv[e[1]];
        const depth = (a.z + b.z) / 2;               // -1..1
        const front = (depth + 1) / 2;               // 0 back .. 1 front
        const alpha = (0.38 + front * 0.55) * (drawingEdge ? (shown - i) : 1);
        sketchLine(ctx, a.x, a.y, b.x, b.y, i * 9.7 + bucket, jit, `${INK}`, alpha, 1.5 + front * 0.7);
      }

      // ── vertices (snap on) ──
      pv.forEach((v, i) => {
        const appear = reducedMotion ? 1 : Math.min(1, Math.max(0, (ease * EDGES.length - i * 0.7)));
        if (appear <= 0) return;
        const front = (v.z + 1) / 2;
        const isAccent = i % 4 === 0;
        ctx.beginPath();
        ctx.arc(v.x, v.y, (1.6 + front * 1.8) * appear, 0, Math.PI * 2);
        ctx.fillStyle = isAccent ? `rgba(${MARKER},${0.85 * appear})` : `rgba(${INK},${(0.4 + front * 0.5) * appear})`;
        ctx.fill();
        if (isAccent) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 5 * appear, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${MARKER},${0.5 * appear})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // ── axis gizmo (bottom-left) — rotates with the model ──
      drawGizmo(ctx, 42, H - 46, ry, rx, INK, MARKER, GRAPHITE);

      raf.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) {
      // static composed frame
      start.current = performance.now() - 3000;
      draw(performance.now());
    } else {
      raf.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [progress, reducedMotion]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────
function sketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  seed: number, amp: number, rgb: string, alpha: number, width: number,
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const segs = Math.max(2, Math.round(len / 24));
  const stroke = (off: number, a: number, w: number) => {
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const tt = i / segs;
      const edge = i === 0 || i === segs;
      const j = edge ? off * 0.4 : off + (rnd(seed + i * 1.3) * 2 - 1) * amp;
      const px = x1 + dx * tt + nx * j;
      const py = y1 + dy * tt + ny * j;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `rgba(${rgb},${a})`;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  stroke(0, alpha, width);
  // faint second pencil pass, slightly offset
  stroke((rnd(seed) * 2 - 1) * amp * 0.9, alpha * 0.35, width * 0.7);
}

function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, rgb: string) {
  const m = Math.min(W, H) * 0.07;
  const len = Math.min(W, H) * 0.05;
  ctx.strokeStyle = `rgba(${rgb},0.4)`;
  ctx.lineWidth = 1;
  const corner = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath();
    ctx.moveTo(x + sx * len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * len);
    ctx.stroke();
  };
  corner(m, m, 1, 1);
  corner(W - m, m, -1, 1);
  corner(m, H - m, 1, -1);
  corner(W - m, H - m, -1, -1);
}

function drawGizmo(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number, ry: number, rx: number,
  ink: string, marker: string, graphite: string,
) {
  const L = 20;
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const axis = (x: number, y: number, z: number) => {
    let X = x * cosY + z * sinY;
    let Z = -x * sinY + z * cosY;
    let Y = y * cosX - Z * sinX;
    return { x: ox + X * L, y: oy - Y * L };
  };
  const ax = [
    { p: axis(1, 0, 0), c: marker },   // X
    { p: axis(0, 1, 0), c: ink },      // Y
    { p: axis(0, 0, 1), c: graphite }, // Z
  ];
  ax.forEach(({ p, c }) => {
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = `rgba(${c},0.8)`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
}
