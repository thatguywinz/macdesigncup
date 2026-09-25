import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import type { LineSegments2 } from "three-stdlib";
import { BONE, DOOR, clamp01, restLookY, smoothstep, type Framing } from "./hall";
import { PRINTER_OUT } from "./timeline";

/* ── The centrepiece: 1st place as a blueprint hologram ─────────────────
   A stylised desktop 3D printer (box frame, bed, gantry, toolhead, spool)
   drawn only in lines: edges pulled from box/cylinder geometry with
   EdgesGeometry, rendered as screen-space fat lines so the drawing stays
   confident on high-density screens. Bone frame, ember toolhead, a glowing
   nozzle, and a small vase printing itself layer by layer on the bed. It
   turns slowly. Never a product render: no surfaces, no brand marks.
   On the desktop dolly it fades out as the camera pushes past it. */

type Tuple = [number, number, number];

/** Edge segments of a geometry, offset by `at` (then the geometry is freed). */
function edgesOf(geo: THREE.BufferGeometry, at: Tuple = [0, 0, 0], threshold = 1): Tuple[] {
  const e = new THREE.EdgesGeometry(geo, threshold);
  const a = e.attributes.position.array as ArrayLike<number>;
  const out: Tuple[] = [];
  for (let i = 0; i < a.length; i += 3) out.push([a[i] + at[0], a[i + 1] + at[1], a[i + 2] + at[2]]);
  e.dispose();
  geo.dispose();
  return out;
}

const box = (w: number, h: number, d: number, at: Tuple) => edgesOf(new THREE.BoxGeometry(w, h, d), at);

// ── Dimensions (local units: the frame is 1 wide) ─────────────────────
const RAIL_Y = 0.98;
const HEAD_H = 0.15;
const NOZZLE_TIP = RAIL_Y - 0.02 - HEAD_H - 0.05;
const VASE_H = 0.3;
const VASE_RINGS = 15;
const VASE_SEGS = 28;
const vaseR = (u: number) => 0.075 + 0.05 * Math.sin(u * Math.PI * 1.15) + 0.02 * u;

/** Frame, rails, spool: everything that never moves. */
function buildFrame(): Tuple[] {
  const pts: Tuple[] = [];
  pts.push(...box(1.08, 0.08, 0.98, [0, 0.04, 0])); // base
  pts.push(...box(1, 0.95, 0.9, [0, 0.555, 0])); // frame
  pts.push(...box(1.06, 0.05, 0.96, [0, 1.055, 0])); // top cap
  pts.push(...box(0.035, 0.035, 0.86, [-0.46, RAIL_Y, 0])); // Y rails
  pts.push(...box(0.035, 0.035, 0.86, [0.46, RAIL_Y, 0]));
  // bed lead screws
  pts.push([-0.34, 0.08, -0.38], [-0.34, 1.03, -0.38], [0.34, 0.08, -0.38], [0.34, 1.03, -0.38]);
  // spool on its arm, hanging off the right side
  const spoolAt: Tuple = [0.64, 0.7, -0.18];
  const spool = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 40);
  spool.rotateZ(Math.PI / 2);
  pts.push(...edgesOf(spool, spoolAt, 20));
  const core = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 28);
  core.rotateZ(Math.PI / 2);
  pts.push(...edgesOf(core, spoolAt, 20));
  pts.push([0.5, 0.7, -0.18], [0.7, 0.7, -0.18]); // axle
  // hologram footprint under the base
  const ring = 44;
  for (let i = 0; i < ring; i++) {
    const a0 = (i / ring) * Math.PI * 2;
    const a1 = ((i + 1) / ring) * Math.PI * 2;
    pts.push([Math.cos(a0) * 0.78, -0.06, Math.sin(a0) * 0.78], [Math.cos(a1) * 0.78, -0.06, Math.sin(a1) * 0.78]);
  }
  return pts;
}

/** The vase's segments, sorted bottom-up so a draw count grows it. */
function buildVase(): { pts: Tuple[]; tops: number[] } {
  const segs: { a: Tuple; b: Tuple; top: number }[] = [];
  for (let r = 0; r < VASE_RINGS; r++) {
    const u = r / (VASE_RINGS - 1);
    const y = u * VASE_H;
    const rad = vaseR(u);
    for (let i = 0; i < VASE_SEGS; i++) {
      const a0 = (i / VASE_SEGS) * Math.PI * 2;
      const a1 = ((i + 1) / VASE_SEGS) * Math.PI * 2;
      segs.push({
        a: [Math.cos(a0) * rad, y, Math.sin(a0) * rad],
        b: [Math.cos(a1) * rad, y, Math.sin(a1) * rad],
        top: y,
      });
    }
  }
  const meridians = 8;
  for (let m = 0; m < meridians; m++) {
    const a = (m / meridians) * Math.PI * 2;
    for (let r = 0; r < VASE_RINGS - 1; r++) {
      const u0 = r / (VASE_RINGS - 1);
      const u1 = (r + 1) / (VASE_RINGS - 1);
      segs.push({
        a: [Math.cos(a) * vaseR(u0), u0 * VASE_H, Math.sin(a) * vaseR(u0)],
        b: [Math.cos(a) * vaseR(u1), u1 * VASE_H, Math.sin(a) * vaseR(u1)],
        top: u1 * VASE_H,
      });
    }
  }
  segs.sort((p, q) => p.top - q.top);
  const pts: Tuple[] = [];
  const tops: number[] = [];
  for (const s of segs) {
    pts.push(s.a, s.b);
    tops.push(s.top);
  }
  return { pts, tops };
}

const EMBER_LINE = new THREE.Color(3.1, 0.78, 0.1);
const NOZZLE_GLOW = new THREE.Color(7, 1.9, 0.25);

/** Print cycle, seconds: grow, hold, then fade and start over. */
const GROW = 11;
const HOLD = 2.4;
const FADE = 0.8;
const CYCLE = GROW + HOLD + FADE;

/** Where the printer's centre hangs, as a fraction of the half-frame (NDC). */
const LANDSCAPE_NDC: [number, number] = [0.6, 0.4];
const PORTRAIT_NDC: [number, number] = [0.5, 0.5];
/** Local height of the drawing's visual centre above its base. */
const MID_Y = 0.52;
const PRINTER_Z = -2.6;
/** Three-quarter view it rests at (and holds under reduced motion). */
const REST_YAW = -0.7;

interface WirePrinterProps {
  reduced: boolean;
  /** Hero scroll progress (held at 0 for reduced motion). */
  progress: MotionValue<number>;
  /** The scene's current framing (GalleryScene's useFraming), and the
   *  poster type's floor it was made for. */
  frame: Framing;
  floor: number;
}

export default function WirePrinter({ reduced, progress, frame, floor }: WirePrinterProps) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1;

  const frameLines = useMemo(buildFrame, []);
  const vase = useMemo(buildVase, []);
  const railPts = useMemo(() => box(0.94, 0.04, 0.045, [0, 0, 0]), []);
  const bedPts = useMemo(() => box(0.74, 0.025, 0.7, [0, -0.0125, 0]), []);
  const headPts = useMemo(() => {
    const pts = box(0.13, HEAD_H, 0.11, [0, -0.02 - HEAD_H / 2, 0]);
    const cone = new THREE.ConeGeometry(0.032, 0.05, 6);
    cone.rotateX(Math.PI);
    pts.push(...edgesOf(cone, [0, -0.02 - HEAD_H - 0.025, 0], 20));
    return pts;
  }, []);

  // Rest position from the framing (the type's clearance included), so the
  // printer keeps the same spot in the frame at every aspect ratio (it is a
  // world object, so the dolly still flies under it).
  const place = useMemo(() => {
    const f = frame;
    const lookY = restLookY(f, aspect, floor, size.height);
    const d = f.z - PRINTER_Z;
    const tanV = Math.tan(THREE.MathUtils.degToRad(f.fov / 2));
    const [nx, ny] = portrait ? PORTRAIT_NDC : LANDSCAPE_NDC;
    const rayY = f.y + (lookY - f.y) * (d / (f.z - DOOR.z));
    const scale = portrait ? 1.55 : 1.6;
    return {
      pos: new THREE.Vector3(nx * d * tanV * aspect, rayY + ny * d * tanV - MID_Y * scale, PRINTER_Z),
      scale,
    };
  }, [frame, aspect, portrait, floor, size.height]);

  const group = useRef<THREE.Group>(null!);
  const bed = useRef<THREE.Group>(null!);
  const gantry = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const vaseLine = useRef<LineSegments2>(null!);
  const filament = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    return new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.35, toneMapped: false, fog: false }),
    );
  }, []);
  useEffect(
    () => () => {
      filament.geometry.dispose();
      (filament.material as THREE.Material).dispose();
    },
    [filament],
  );
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()),
    [],
  );
  // Every material but the vase's (which fades on its own print cycle), with
  // its resting opacity, gathered on the first frame for the dolly fade-out.
  const mats = useRef<{ m: THREE.Material; base: number }[] | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const keep = 1 - smoothstep(PRINTER_OUT[0], PRINTER_OUT[1], clamp01(progress.get()));
    g.visible = keep > 0.005;
    if (!g.visible) return;
    if (!mats.current) {
      const found: { m: THREE.Material; base: number }[] = [];
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (!m || Array.isArray(m) || o === vaseLine.current) return;
        found.push({ m, base: m.opacity });
        if (!m.transparent) {
          m.transparent = true;
          m.needsUpdate = true;
        }
      });
      mats.current = found;
    }
    for (const { m, base } of mats.current) m.opacity = base * keep;
    g.position.copy(place.pos);
    if (!reduced) g.position.y += Math.sin(t * 0.5) * 0.05;
    g.rotation.y = reduced ? REST_YAW : REST_YAW + t * 0.11;

    // print cycle
    const c = reduced ? GROW : t % CYCLE;
    const grow = Math.min(1, c / GROW);
    const fade = c > GROW + HOLD ? 1 - (c - GROW - HOLD) / FADE : 1;
    const h = grow * VASE_H;
    // The bed drops as the print grows, so the nozzle always sits on the top layer.
    const bedY = NOZZLE_TIP - h;
    bed.current.position.y = bedY;
    const line = vaseLine.current;
    if (line) {
      let n = 0;
      while (n < vase.tops.length && vase.tops[n] <= h + 1e-4) n++;
      line.geometry.instanceCount = n;
      (line.material as THREE.Material).opacity = 0.75 * fade * keep;
    }
    // toolhead traces the current layer
    const theta = reduced ? 0.8 : t * 3.2;
    const r = vaseR(grow);
    const hx = Math.cos(theta) * r;
    const hz = Math.sin(theta) * r;
    gantry.current.position.set(0, RAIL_Y, hz);
    head.current.position.set(hx, 0, 0);

    // filament: spool top to the toolhead, sagging a little
    const from = curve.v0.set(0.64, 0.9, -0.18);
    const to = curve.v2.set(hx, RAIL_Y + 0.02, hz);
    curve.v1.set((from.x + to.x) / 2 + 0.08, 1.22, (from.z + to.z) / 2);
    const arr = (filament.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < 16; i++) {
      const p = curve.getPoint(i / 15);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    filament.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={group} position={place.pos} scale={place.scale} rotation={[0.2, REST_YAW, 0]}>
      <Line points={frameLines} segments color={BONE} lineWidth={1.35} transparent opacity={0.6} toneMapped={false} />

      <group ref={bed}>
        <Line points={bedPts} segments color={BONE} lineWidth={1.35} transparent opacity={0.6} toneMapped={false} />
        <Line
          ref={vaseLine}
          points={vase.pts}
          segments
          color={EMBER_LINE}
          lineWidth={1.2}
          transparent
          opacity={0.75}
          toneMapped={false}
        />
      </group>

      <group ref={gantry} position={[0, RAIL_Y, 0]}>
        <Line points={railPts} segments color={BONE} lineWidth={1.35} transparent opacity={0.6} toneMapped={false} />
        <group ref={head}>
          <Line points={headPts} segments color={EMBER_LINE} lineWidth={1.5} toneMapped={false} />
          <mesh position={[0, -0.02 - HEAD_H - 0.05, 0]}>
            <sphereGeometry args={[0.014, 10, 10]} />
            <meshBasicMaterial color={NOZZLE_GLOW} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <primitive object={filament} />
    </group>
  );
}
