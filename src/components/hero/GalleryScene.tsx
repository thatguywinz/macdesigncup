import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type MutableRefObject,
  type Ref,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, MeshReflectorMaterial, Sparkles, SpotLight } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { MotionValue } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { BloomEffect } from "postprocessing";
import * as THREE from "three";
import { CTA, HERO } from "@/content/copy";
import {
  CTA_AT,
  DESIGN_FOV,
  DOOR,
  PORTAL_Y,
  PTR,
  clamp01,
  copyLift,
  dollyAmount,
  framing,
  smoothstep,
  type Framing,
  type PhoneFrame,
} from "./hall";
import { CTA_OUT, DOLLY_END } from "./timeline";
import LogoPlaques from "./LogoPlaques";
import WirePrinter from "./WirePrinter";

export interface GallerySceneProps {
  /** Hero scroll progress 0..1 (held at 0 for reduced motion). */
  progress: MotionValue<number>;
  reduced: boolean;
  /** Render only while the hero is on screen. */
  active: boolean;
  /** Bottom of the poster type, as a share of the stage height (0 = unknown). */
  copyFloor: MotionValue<number>;
  onEnter: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Called once, after the first frames have been drawn. */
  onReady: () => void;
  /** The phone scene: a lower pixel ratio, no floor reflection pass, less
   *  dust, a lighter bloom, no printer and no wall plates; upright, the
   *  phone shot (frame.ts). The camera holds still but for a gentle drift. */
  lite?: boolean;
  /** The phone scene's frame (the Register bar's room; sideways, the hall
   *  column to centre on). */
  phoneFrame?: PhoneFrame | null;
}

/** The poster type's floor, as state: it changes on resize and font load only. */
function useFloor(copyFloor: MotionValue<number>) {
  const snap = (v: number) => Math.round(v * 500) / 500;
  const [floor, setFloor] = useState(() => snap(copyFloor.get()));
  useEffect(() => {
    setFloor(snap(copyFloor.get()));
    return copyFloor.on("change", (v) => setFloor(snap(v)));
  }, [copyFloor]);
  return floor;
}

/* ── Camera ──────────────────────────────────────────────────────────
   At rest it breathes on an idle drift and leans with the cursor like a
   handheld dolly shot, looking just high enough that the plaque rows (or,
   upright, the door) sit clear under the poster type. Scroll progress walks
   it up the runway, past the front plaques, and stops it square on the lit
   door (framing().endZ): the door large, still framed by its jambs, the
   wall and the floor. The cursor's pull fades out as it goes, so the
   arrival is steady. */
interface RigProps {
  progress: MotionValue<number>;
  reduced: boolean;
  frame: Framing;
  floor: number;
  /** No cursor to lean with (a touch screen): the idle drift only. */
  still: boolean;
  /** Screen px to move the picture right by (sideways: onto the hall column). */
  shift: number;
}

function CameraRig({ progress, reduced, frame: f, floor, still, shift }: RigProps) {
  const lean = useMemo(() => new THREE.Vector2(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const eased = useRef(0);
  // The first drawn frame's clock time: the idle drift starts from rest there
  // and eases in, so the scene's first frame matches the still it replaces
  // (on phones, public/hero/hall-*.webp) and only then begins to breathe.
  const born = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  // A new framing needs a frame even when the canvas only draws on demand.
  useEffect(() => invalidate(), [f, floor, invalidate]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.fov !== f.fov) {
      cam.fov = f.fov;
      cam.updateProjectionMatrix();
    }
    // Off centre without turning the camera: a view offset slides the whole
    // picture (the Enter slab's projection included) along the frame.
    const { width: W, height: H } = state.size;
    const v = cam.view;
    if (shift) {
      if (!v || !v.enabled || v.offsetX !== -shift || v.fullWidth !== W || v.fullHeight !== H) {
        cam.setViewOffset(W, H, -shift, 0, W, H);
      }
    } else if (v && v.enabled) {
      cam.clearViewOffset();
    }

    // Smooth the scroll so wheel steps glide instead of stepping: a
    // critically damped follow (no overshoot), then the eased dolly curve.
    const target = reduced ? 0 : clamp01(progress.get());
    eased.current = THREE.MathUtils.damp(eased.current, target, 3.8, dt);
    if (Math.abs(eased.current - target) < 0.0005) eased.current = target;
    const e = dollyAmount(eased.current);
    const free = 1 - e;

    lean.x = THREE.MathUtils.damp(lean.x, reduced || still ? 0 : PTR.x * free, 2.4, dt);
    lean.y = THREE.MathUtils.damp(lean.y, reduced || still ? 0 : PTR.y * free, 2.4, dt);
    if (born.current < 0) born.current = t;
    const idle = t - born.current;
    const calm = reduced ? 0 : smoothstep(0.6, 4.5, idle) * free;
    const driftX = Math.sin(idle * 0.22) * 0.14 * calm;
    const driftY = Math.sin(idle * 0.16) * 0.08 * calm;

    const camY = THREE.MathUtils.lerp(f.y, DOOR.y, e) + lean.y * 0.55 + driftY;
    const camZ = THREE.MathUtils.lerp(f.z, f.endZ, e);
    let lookY = THREE.MathUtils.lerp(f.lookY, DOOR.y, e) + lean.y * 0.3;
    // Checked every frame, so the cursor's lean can never lift the rows into
    // the type; it eases away over the walk, which ends square on the door.
    lookY += copyLift(f, camY, camZ, lookY, floor, state.size.height) * free;

    cam.position.set(lean.x * 1.15 + driftX, camY, camZ);
    look.set(lean.x * 0.7, lookY, DOOR.z);
    cam.lookAt(look);
  });
  return null;
}

/** The door's core as light, not a flat card: hottest low in the opening
 *  (where the threshold is), cooling toward the jambs. Multiplies the core's
 *  molten colour, so it only shapes the brightness (about 1 down to 0.55). */
function useCoreGlow() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 96;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 60, 2, 32, 60, 60);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, "#e2e2e2");
      g.addColorStop(1, "#c2c2c2");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/* ── Portal: the molten door at the end of the hall ─────────────────── */
/** Rim and core, linear RGB before the flicker. The rim's red carries the
 *  bloom (its halo reads ember), its green stays low enough that the rim
 *  itself reads molten amber, not lemon; the core stays under the clip so
 *  the glow texture's falloff shows. */
const RIM = [5.2, 0.42, 0.06] as const;
const CORE = [0.92, 0.3, 0.06] as const;

function Portal({ reduced }: { reduced: boolean }) {
  const rim = useRef<THREE.MeshBasicMaterial>(null!);
  const core = useRef<THREE.MeshBasicMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const coreGlow = useCoreGlow();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // molten flicker, never perfectly steady (steady when motion is reduced)
    const f = reduced ? 1 : 1 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 13.7 + 2) * 0.035;
    rim.current.color.setRGB(RIM[0] * f, RIM[1] * f, RIM[2]);
    core.current.color.setRGB(CORE[0] * f, CORE[1] * f, CORE[2]);
    light.current.intensity = 30 * f;
  });

  return (
    <group position={[DOOR.x, 0, DOOR.z]}>
      {/* blazing rim (blooms hard) */}
      <mesh position={[0, PORTAL_Y, 0.02]}>
        <planeGeometry args={[2.5, 3.6]} />
        {/* no fog: from the portrait framing's distance it would dull the glow under the bloom threshold */}
        <meshBasicMaterial ref={rim} toneMapped={false} fog={false} />
      </mesh>
      {/* cooler core so the CTA stays legible */}
      <mesh position={[0, PORTAL_Y, 0.05]}>
        <planeGeometry args={[2.14, 3.26]} />
        <meshBasicMaterial ref={core} map={coreGlow} toneMapped={false} fog={false} />
      </mesh>
      {/* dark jambs framing the opening */}
      <mesh position={[-1.45, 1.9, 0.09]}>
        <boxGeometry args={[0.42, 4, 0.5]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.9} />
      </mesh>
      <mesh position={[1.45, 1.9, 0.09]}>
        <boxGeometry args={[0.42, 4, 0.5]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4, 0.09]}>
        <boxGeometry args={[3.4, 0.44, 0.5]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.9} />
      </mesh>
      <pointLight ref={light} position={[0, 2, 1.7]} color="#ff7a1a" distance={11.5} decay={2} />
    </group>
  );
}

/* ── The Enter CTA, glued to the door in screen space ───────────────
   One line, one slab. It fades out as the dolly starts and stops taking
   the pointer and focus once it is gone. */
function EnterDoor({ progress, onEnter }: { progress: MotionValue<number>; onEnter: GallerySceneProps["onEnter"] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useRef(-1);

  useFrame(() => {
    const el = wrap.current;
    if (!el) return;
    const o = Math.round((1 - smoothstep(CTA_OUT[0], CTA_OUT[1], clamp01(progress.get()))) * 100) / 100;
    if (o === shown.current) return;
    shown.current = o;
    el.style.opacity = String(o);
    el.style.visibility = o <= 0.01 ? "hidden" : "visible";
    el.style.pointerEvents = o < 0.6 ? "none" : "";
  });

  return (
    <Html position={[DOOR.x, CTA_AT.y, CTA_AT.z]} center zIndexRange={[30, 10]}>
      <div ref={wrap} className="hall-cta">
        <a href="#glance" onClick={onEnter} aria-label={CTA.enter} className="hall-cta__btn">
          <span>{CTA.enter}</span>
          <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
        </a>
      </div>
    </Html>
  );
}

const BLOOM_REST = 1.15;
const BLOOM_END = 0.85;

/** Eases the bloom down as the door fills more of the frame, so its halo stays
 *  a halo around the opening and never washes the whole shot. */
function BloomRig({ progress, bloom }: { progress: MotionValue<number>; bloom: MutableRefObject<BloomEffect | null> }) {
  const shown = useRef(-1);
  useFrame(() => {
    const b = bloom.current;
    if (!b) return;
    const k = smoothstep(0.2, DOLLY_END, clamp01(progress.get()));
    const v = Math.round(THREE.MathUtils.lerp(BLOOM_REST, BLOOM_END, k) * 1000) / 1000;
    if (v === shown.current) return;
    shown.current = v;
    b.intensity = v;
  });
  return null;
}

/** Tells the page the first frames are on screen, so the poster can hand over. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) onReady();
  });
  return null;
}

/** Compiles every shader in the hall off the main thread (where the browser
 *  can: KHR_parallel_shader_compile) before the first frame is drawn, so the
 *  first frame is not one long blocking task. The hall is only ever drawn
 *  into render targets (the composer's buffer, the floor's reflection), which
 *  three compiles differently from the canvas (linear output, no tone
 *  mapping), so the warm-up compiles against one too. The composer's own
 *  passes still compile on the first frame. */
function Warmup({ onDone }: { onDone: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const done = () => {
      target.dispose();
      if (alive) onDone();
    };
    const previous = gl.getRenderTarget();
    try {
      gl.setRenderTarget(target);
      const job = gl.compileAsync(scene, camera);
      gl.setRenderTarget(previous);
      job.then(done, done);
    } catch {
      gl.setRenderTarget(previous);
      done();
    }
    return () => {
      alive = false;
    };
    // once, for the hall as first mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/* ── Studio light for the plaques' sheen ──────────────────────────────
   Four soft panels (a key from above, a cool left, the door's warm glow, a
   warm right) baked once into a prefiltered environment map. Local and
   network-free; no HDR loaders. */
const PANELS: Array<{ at: [number, number, number]; size: [number, number]; color: string; intensity: number }> = [
  { at: [0, 6, 0], size: [12, 6], color: "#e8ecf5", intensity: 2.6 },
  { at: [-8, 3, 2], size: [8, 2], color: "#bcd0ff", intensity: 1.3 },
  { at: [0, 2.5, -8], size: [4, 5], color: "#ff7a1a", intensity: 0.9 },
  { at: [8, 4, 0], size: [8, 3], color: "#fff1dd", intensity: 0.7 },
];

function StudioLight() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const studio = new THREE.Scene();
    const plane = new THREE.PlaneGeometry(1, 1);
    const mats = PANELS.map(({ at, size, color, intensity }) => {
      const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
      m.color.multiplyScalar(intensity);
      const panel = new THREE.Mesh(plane, m);
      panel.position.set(...at);
      panel.scale.set(size[0], size[1], 1);
      panel.lookAt(0, 0, 0);
      studio.add(panel);
      return m;
    });
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(studio, 0, 0.1, 1000);
    pmrem.dispose();
    plane.dispose();
    mats.forEach((m) => m.dispose());
    scene.environment = target.texture;
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ── Architecture: back wall, pylons, runway, leaning boards ────────── */
function Architecture() {
  const pylons: Array<[number, number, number]> = [
    [-6.4, 3.4, -0.25],
    [-7.4, 0.6, 0.2],
    [-6.9, -2.6, -0.1],
    [6.6, 3.2, 0.15],
    [7.5, 0.4, -0.2],
    [7, -2.8, 0.1],
  ];
  const slabs = Array.from({ length: 11 }, (_, i) => 3.4 - i * 0.84);
  return (
    <group>
      {/* back wall, split around the door */}
      <mesh position={[-9.2, 4.5, -6.42]}>
        <boxGeometry args={[15, 13, 0.5]} />
        <meshStandardMaterial color="#0c0d10" roughness={0.95} />
      </mesh>
      <mesh position={[9.2, 4.5, -6.42]}>
        <boxGeometry args={[15, 13, 0.5]} />
        <meshStandardMaterial color="#0c0d10" roughness={0.95} />
      </mesh>
      <mesh position={[0, 8.2, -6.42]}>
        <boxGeometry args={[3.5, 8, 0.5]} />
        <meshStandardMaterial color="#0c0d10" roughness={0.95} />
      </mesh>

      {/* concrete pylons lining the hall */}
      {pylons.map(([x, z, ry], i) => (
        <mesh key={i} position={[x, 3.2, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[0.6, 6.4, 0.6]} />
          <meshStandardMaterial color="#111216" roughness={0.92} />
        </mesh>
      ))}

      {/* stone runway to the portal */}
      {slabs.map((z, i) => (
        <mesh key={i} position={[0, 0.045, z]}>
          <boxGeometry args={[1.3, 0.09, 0.6]} />
          <meshStandardMaterial color="#16171b" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}

      {/* boards leaning on the side walls: depth for the floor reflection */}
      <group position={[-5.9, 0, 1.1]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 1.05, 0]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[0.09, 2.1, 1.7]} />
          <meshStandardMaterial color="#131418" roughness={0.9} />
        </mesh>
      </group>
      <group position={[5.4, 0, 1.6]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.95, 0]} rotation={[0, 0, -0.07]}>
          <boxGeometry args={[0.09, 1.9, 1.5]} />
          <meshStandardMaterial color="#131418" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/* The phone floor: no reflection pass (it draws the hall a second time every
   frame), just a dark polished floor that takes the studio light's sheen,
   and the door's light laid on it as a soft warm streak. */
function useStreak() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      const v = ctx.createLinearGradient(0, 0, 0, c.height);
      v.addColorStop(0, "rgba(255,255,255,1)");
      v.addColorStop(0.35, "rgba(255,255,255,0.45)");
      v.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, c.width, c.height);
      // soften the long edges
      ctx.globalCompositeOperation = "destination-in";
      const h = ctx.createLinearGradient(0, 0, c.width, 0);
      h.addColorStop(0, "rgba(0,0,0,0)");
      h.addColorStop(0.5, "rgba(0,0,0,1)");
      h.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function LiteFloor() {
  const streak = useStreak();
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1]}>
        <planeGeometry args={[60, 44]} />
        <meshStandardMaterial color="#0a0b0d" roughness={0.38} metalness={0.55} envMapIntensity={0.35} />
      </mesh>
      {/* the door's light on the polish, falling off toward the camera */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, DOOR.z + 3.1]}>
        <planeGeometry args={[3.4, 6.2]} />
        <meshBasicMaterial
          map={streak}
          color={[0.9, 0.3, 0.06]}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1]}>
      <planeGeometry args={[60, 44]} />
      <MeshReflectorMaterial
        blur={[280, 90]}
        resolution={1024}
        mixBlur={1}
        mixStrength={2.4}
        roughness={0.7}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0b0d"
        metalness={0.45}
        mirror={0.55}
      />
    </mesh>
  );
}

/* Electric-blue lines snaking across the floor. */
function NeonPath({ mirror = false }: { mirror?: boolean }) {
  const curve = useMemo(() => {
    const m = mirror ? -1 : 1;
    return new THREE.CatmullRomCurve3(
      [
        [-5.6 * m, 0.025, 4.2],
        [-3.6 * m, 0.025, 2.5],
        [-4.3 * m, 0.025, 0.3],
        [-2.6 * m, 0.025, -1.7],
        [-1.75 * m, 0.025, -3.5],
        [-1.25 * m, 0.025, -5.7],
      ].map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
  }, [mirror]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 200, 0.022, 10, false]} />
      <meshBasicMaterial color={[0.5, 1.3, 5]} toneMapped={false} />
    </mesh>
  );
}

/* Volumetric gallery downlights over the aisle. In a tall portrait frame the
   cones cross the whole picture, so they are dimmed there, and on a phone,
   where they would cross the poster type, all but put out. */
function Downlights({ kind }: { kind: Framing["kind"] }) {
  const lite = kind === "phone" || kind === "side";
  const opacity = kind === "landscape" ? 0.85 : 0.38;
  return (
    <>
      {[-2.6, 2.6].map((x) => (
        <SpotLight
          key={x}
          position={[x, 7.4, -0.8]}
          angle={0.42}
          penumbra={0.9}
          intensity={1.5}
          distance={14}
          attenuation={5.5}
          anglePower={4}
          opacity={opacity}
          // no light shafts on a phone: they would cross the poster type
          volumetric={!lite}
          color="#dfe6f2"
        />
      ))}
    </>
  );
}

/* ── The hall: everything that depends on the frame's shape ────────── */
function Hall({
  progress,
  reduced,
  copyFloor,
  onEnter,
  lite,
  phoneFrame,
}: Pick<GallerySceneProps, "progress" | "reduced" | "copyFloor" | "onEnter" | "phoneFrame"> & { lite: boolean }) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const floor = useFloor(copyFloor);
  const aspect = width / Math.max(1, height);
  const column = lite ? phoneFrame?.column : null;
  const fit = column ? column.width / Math.max(1, height) : aspect;
  const bottomPx = phoneFrame?.bottomPx;
  const frame = useMemo(
    () => framing(aspect, floor, height, lite ? { fit, bottomPx } : undefined),
    [aspect, floor, height, lite, fit, bottomPx],
  );
  const shift = column ? Math.round(column.left + column.width / 2 - width / 2) : 0;
  return (
    <>
      <CameraRig progress={progress} reduced={reduced} frame={frame} floor={floor} still={lite} shift={shift} />
      <Downlights kind={frame.kind} />
      <LogoPlaques reduced={reduced} progress={progress} frame={frame} aspect={aspect} lite={lite} />
      {!lite && <WirePrinter reduced={reduced} progress={progress} frame={frame} floor={floor} />}
      <EnterDoor progress={progress} onEnter={onEnter} />
    </>
  );
}

/* ── Scene root ─────────────────────────────────────────────────────── */
export default function GalleryScene({
  progress,
  reduced,
  active,
  copyFloor,
  onEnter,
  onReady,
  lite = false,
  phoneFrame = null,
}: GallerySceneProps) {
  const bloom = useRef<BloomEffect | null>(null);
  // Nothing is drawn until the shaders are compiled. Under reduced motion
  // the picture never changes, so once the first frames are up the canvas
  // only draws on demand (a resize, a logo arriving, a hover).
  const [warm, setWarm] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const onDrawn = useCallback(() => {
    setDrawn(true);
    onReady();
  }, [onReady]);
  const frameloop = !warm || !active ? "never" : reduced && drawn ? "demand" : "always";

  return (
    <Canvas
      frameloop={frameloop}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [0, 2.05, 8.6], fov: DESIGN_FOV }}
      // Everything reaches the screen through the composer (multisampling 0),
      // so canvas MSAA would only smooth a fullscreen quad.
      gl={{ antialias: false, powerPreference: lite ? "default" : "high-performance" }}
    >
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 10, 30]} />

      <StudioLight />
      <Warmup onDone={onWarm} />
      <BloomRig progress={progress} bloom={bloom} />
      <ReadySignal onReady={onDrawn} />

      <ambientLight intensity={0.18} />
      {/* faint cold rim from the neon floor lines */}
      <pointLight position={[-3.4, 0.4, 0.5]} color="#3d7bff" intensity={4} distance={7} decay={2} />
      <pointLight position={[3.4, 0.4, 0.5]} color="#3d7bff" intensity={4} distance={7} decay={2} />

      <Architecture />
      {lite ? <LiteFloor /> : <Floor />}
      <NeonPath />
      <NeonPath mirror />
      <Portal reduced={reduced} />
      <Hall
        progress={progress}
        reduced={reduced}
        copyFloor={copyFloor}
        onEnter={onEnter}
        lite={lite}
        phoneFrame={phoneFrame}
      />

      {/* drifting dust: cool ambient + warm near the door */}
      <Sparkles
        count={lite ? 44 : 140}
        scale={[16, 7, 14]}
        position={[0, 3, -1]}
        size={1.6}
        speed={reduced ? 0 : 0.25}
        opacity={0.35}
        color="#9fb8ff"
      />
      <Sparkles
        count={lite ? 26 : 70}
        scale={[4, 5, 3]}
        position={[0, 2, -4.6]}
        size={2.2}
        speed={reduced ? 0 : 0.45}
        opacity={0.5}
        color="#ffb37a"
      />

      {lite ? (
        // One cheap pass: the door's halo at half resolution. The page's own
        // CSS vignette darkens the edges.
        <EffectComposer multisampling={0}>
          <Bloom
            ref={bloom as unknown as Ref<typeof BloomEffect>}
            mipmapBlur
            levels={5}
            resolutionScale={0.5}
            intensity={BLOOM_REST}
            luminanceThreshold={1}
            luminanceSmoothing={0.2}
          />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          {/* the wrapper types its ref as the class, not the instance */}
          <Bloom
            ref={bloom as unknown as Ref<typeof BloomEffect>}
            mipmapBlur
            intensity={BLOOM_REST}
            luminanceThreshold={1}
            luminanceSmoothing={0.2}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
