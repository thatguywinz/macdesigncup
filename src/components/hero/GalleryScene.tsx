import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  Sparkles,
  SpotLight,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

export type GatePhase = "locked" | "entering";

interface GalleryCanvasProps {
  phase: GatePhase;
  reduced: boolean;
  lite: boolean;
  nudge: number;
  onEnter: () => void;
}

/* Door center in world space — camera, portal and CTA all agree on this. */
const DOOR = new THREE.Vector3(0, 1.9, -6);

/* Window-level cursor, in the same -1..1 space as r3f's state.pointer.
   r3f only updates its pointer from events on the canvas, so the DOM overlays
   (the CTA glued to the door) would freeze the parallax while hovered — the
   camera "locks" onto the door. Reading the window keeps everything moving. */
const PTR = { x: 0, y: 0 };
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

/* ── Camera ──────────────────────────────────────────────────────────
   Locked: breathes on an idle sine drift and leans with the cursor so the
   whole hall wiggles like a handheld dolly shot. Entering: flies at the door. */
function CameraRig({ phase, reduced, lite }: { phase: GatePhase; reduced: boolean; lite: boolean }) {
  const pos = useMemo(() => new THREE.Vector3(0, 2.05, 8.6), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  // Portrait viewports sit further back and aim higher so the hall, not the floor, fills the frame.
  const baseZ = lite ? 10.4 : 8.6;
  const lookY = lite ? 2.5 : 1.8;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const px = reduced ? 0 : PTR.x;
    const py = reduced ? 0 : PTR.y;

    if (phase === "entering") {
      pos.set(0, 1.9, -4.4);
      look.copy(DOOR);
      const k = 1 - Math.exp(-1.35 * dt);
      state.camera.position.lerp(pos, k);
    } else {
      pos.set(
        px * 1.15 + (reduced ? 0 : Math.sin(t * 0.26) * 0.22),
        2.05 + py * 0.55 + (reduced ? 0 : Math.sin(t * 0.18) * 0.12),
        baseZ,
      );
      look.set(px * 0.7, lookY + py * 0.3, DOOR.z);
      const k = 1 - Math.exp(-2.4 * dt);
      state.camera.position.lerp(pos, k);
    }
    state.camera.lookAt(look);
  });
  return null;
}

/* ── Sculptures ────────────────────────────────────────────────────── */
type KnotVariant = "wire" | "clay" | "glass" | "chrome" | "porcelain";

function KnotMaterial({ variant, hovered }: { variant: KnotVariant; hovered: boolean }) {
  switch (variant) {
    case "wire":
      return <meshBasicMaterial wireframe color={hovered ? "#ffc98c" : "#d9d0b0"} />;
    case "clay":
      return (
        <meshStandardMaterial
          color="#8f7a63"
          roughness={0.95}
          flatShading
          emissive="#ff6a14"
          emissiveIntensity={hovered ? 0.22 : 0}
        />
      );
    case "glass":
      return (
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.7}
          roughness={0.07}
          ior={1.45}
          color="#dceaff"
          attenuationColor="#bcd8ff"
          attenuationDistance={2.5}
        />
      );
    case "chrome":
      return (
        <meshStandardMaterial
          color="#ffffff"
          metalness={1}
          roughness={0.05}
          envMapIntensity={1.25}
          emissive="#ff6a14"
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      );
    case "porcelain":
      return (
        <meshPhysicalMaterial
          color="#f4efe6"
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.15}
          emissive="#ff6a14"
          emissiveIntensity={hovered ? 0.18 : 0}
        />
      );
  }
}

interface KnotProps {
  variant: KnotVariant;
  scale?: number;
  p?: number;
  q?: number;
  tube?: number;
  seed?: number;
  detail?: number;
  reduced?: boolean;
}

/** A floating torus-knot exhibit. Hovering it wakes it up: it spins faster and swells. */
function Knot({ variant, scale = 1, p = 2, q = 3, tube = 0.16, seed = 0, detail = 170, reduced = false }: KnotProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state, dt) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    m.rotation.y += dt * (hovered ? 1.6 : 0.3);
    m.rotation.x = Math.sin(t * 0.4 + seed) * 0.16;
    m.position.y = Math.sin(t * 0.9 + seed) * 0.06;
    const target = scale * (hovered ? 1.14 : 1);
    const s = THREE.MathUtils.damp(m.scale.x, target, 7, dt);
    m.scale.setScalar(s);
  });

  // Wireframe pieces need sparse geometry to read as line drawings, not mush.
  const seg = variant === "clay" ? 90 : variant === "wire" ? 72 : detail;
  const radial = variant === "clay" ? 14 : variant === "wire" ? 8 : 28;
  return (
    <mesh
      ref={mesh}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <torusKnotGeometry args={[0.42, tube, seg, radial, p, q]} />
      <KnotMaterial variant={variant} hovered={hovered} />
    </mesh>
  );
}

function Pedestal({
  x,
  z,
  h,
  children,
}: {
  x: number;
  z: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[0.78, h, 0.78]} />
        <meshStandardMaterial color="#141518" roughness={0.92} />
      </mesh>
      <mesh position={[0, h + 0.025, 0]}>
        <boxGeometry args={[0.86, 0.05, 0.86]} />
        <meshStandardMaterial color="#1c1d21" roughness={0.8} metalness={0.15} />
      </mesh>
      <group position={[0, h + 0.62, 0]}>{children}</group>
    </group>
  );
}

function Sculptures({ reduced }: { reduced: boolean }) {
  return (
    <group>
      <Pedestal x={-4.15} z={1.5} h={0.8}>
        <Knot variant="wire" p={2} q={3} seed={1} scale={0.52} reduced={reduced} />
      </Pedestal>
      <Pedestal x={-2.2} z={-0.15} h={1.3}>
        <Knot variant="clay" p={3} q={4} tube={0.18} seed={2} reduced={reduced} />
      </Pedestal>
      <Pedestal x={-1.8} z={-2.6} h={1.55}>
        <Knot variant="glass" p={2} q={5} seed={3} reduced={reduced} />
      </Pedestal>
      <Pedestal x={1.8} z={-2.6} h={1.55}>
        <Knot variant="chrome" p={2} q={3} seed={4} reduced={reduced} />
      </Pedestal>
      <Pedestal x={2.2} z={-0.15} h={1.3}>
        <Knot variant="porcelain" p={5} q={2} tube={0.14} seed={5} reduced={reduced} />
      </Pedestal>

      {/* leaning obsidian monolith — the odd one out */}
      <group position={[3.35, 0, 2.1]}>
        <mesh position={[0, 1.25, 0]} rotation={[0.02, 0.4, 0.14]}>
          <boxGeometry args={[0.55, 2.5, 0.4]} />
          <meshStandardMaterial color="#101115" roughness={0.35} metalness={0.4} />
        </mesh>
      </group>

      {/* sketch plaques leaning on the side walls, like framed blueprints */}
      <group position={[-5.7, 0, -0.6]} rotation={[0, 0.55, 0]}>
        <mesh position={[0, 1.05, 0]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[0.09, 2.1, 1.7]} />
          <meshStandardMaterial color="#131418" roughness={0.9} />
        </mesh>
        <group position={[0.32, 1.15, 0]} rotation={[0, -0.2, 0]}>
          <Knot variant="wire" scale={0.55} p={3} q={5} seed={6} reduced={reduced} />
        </group>
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

/* ── Giant porcelain knot punching in from the upper right ─────────── */
function Shard({
  offset,
  size,
  seed,
  reduced,
}: {
  offset: [number, number, number];
  size: number;
  seed: number;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state, dt) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x += dt * (0.15 + (seed % 3) * 0.08);
    ref.current.rotation.z += dt * 0.1;
    ref.current.position.y = offset[1] + Math.sin(t * 0.55 + seed) * 0.12;
  });
  return (
    <mesh ref={ref} position={offset}>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#191a1f" roughness={0.85} flatShading />
    </mesh>
  );
}

function GiantKnot({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const knot = useRef<THREE.Mesh>(null!);

  const shards = useMemo(() => {
    const rng = (i: number, f: number) => Math.sin(i * 127.1 + f * 311.7) * 0.5 + 0.5;
    return Array.from({ length: 13 }, (_, i) => ({
      offset: [
        -2.6 + rng(i, 1) * 4.6,
        -2.2 + rng(i, 2) * 4.4,
        -1.4 + rng(i, 3) * 2.8,
      ] as [number, number, number],
      size: 0.09 + rng(i, 4) * 0.22,
      seed: i,
    }));
  }, []);

  useFrame((state, dt) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    knot.current.rotation.x += dt * 0.07;
    knot.current.rotation.y += dt * 0.05;
    const g = group.current;
    const px = PTR.x;
    const py = PTR.y;
    // Moves *with* the cursor more than the room does — reads as closer to camera.
    g.position.x = THREE.MathUtils.damp(g.position.x, 5.35 + px * 0.6, 2.2, dt);
    g.position.y = THREE.MathUtils.damp(
      g.position.y,
      3.9 + py * 0.4 + Math.sin(t * 0.35) * 0.12,
      2.2,
      dt,
    );
  });

  return (
    <group ref={group} position={[5.35, 3.9, -1.9]}>
      <mesh ref={knot} scale={1.9} rotation={[0.6, 0.4, 0.2]}>
        <torusKnotGeometry args={[1, 0.42, 260, 40, 2, 3]} />
        <meshPhysicalMaterial color="#f1ece2" roughness={0.27} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      {shards.map((s) => (
        <Shard key={s.seed} {...s} reduced={reduced} />
      ))}
    </group>
  );
}

/* ── Portal — the molten door at the end of the hall ───────────────── */
function Portal({ lite, reduced }: { lite: boolean; reduced: boolean }) {
  const rim = useRef<THREE.MeshBasicMaterial>(null!);
  const core = useRef<THREE.MeshBasicMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // molten flicker — never perfectly steady (steady when motion is reduced)
    const f = reduced ? 1 : 1 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 13.7 + 2) * 0.035;
    rim.current.color.setRGB(4.6 * f, 1.15 * f, 0.16);
    core.current.color.setRGB(1.35 * f, 0.36 * f, 0.07);
    light.current.intensity = (lite ? 22 : 30) * f;
  });

  return (
    <group position={[DOOR.x, 0, DOOR.z]}>
      {/* blazing rim (blooms hard) */}
      <mesh position={[0, 1.92, 0.02]}>
        <planeGeometry args={[2.5, 3.6]} />
        <meshBasicMaterial ref={rim} toneMapped={false} />
      </mesh>
      {/* cooler core so the CTA stays legible */}
      <mesh position={[0, 1.92, 0.05]}>
        <planeGeometry args={[2.14, 3.26]} />
        <meshBasicMaterial ref={core} toneMapped={false} />
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

/* The gate CTA, glued to the door in screen space. */
function EnterDoor({
  onEnter,
  phase,
  nudge,
}: {
  onEnter: () => void;
  phase: GatePhase;
  nudge: number;
}) {
  // A scroll attempt flashes the guidance for a moment, then settles back.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (nudge === 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1700);
    return () => clearTimeout(t);
  }, [nudge]);

  return (
    <Html position={[DOOR.x, DOOR.y + 0.1, DOOR.z + 0.2]} center zIndexRange={[30, 10]}>
      <div
        className="hero-cta"
        data-entering={phase === "entering" || undefined}
        style={flash ? { animation: "gate-shake 0.5s ease" } : undefined}
      >
        <span className="hero-cta-ring" />
        <span className="hero-cta-ring hero-cta-ring--late" />
        <button type="button" onClick={onEnter} aria-label="Enter the challenge and open the site">
          <span>Enter</span>
          <span>the</span>
          <span>Challenge</span>
        </button>
        <p className="hero-cta-hint" data-nudged={flash || undefined}>
          {flash ? "the way in is forward · scroll down or click" : "click or scroll to enter"}
        </p>
      </div>
    </Html>
  );
}

/* ── Architecture — floor, walls, pylons, runway ────────────────────── */
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
    </group>
  );
}

function Floor({ lite }: { lite: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1]}>
      <planeGeometry args={[60, 44]} />
      <MeshReflectorMaterial
        blur={[280, 90]}
        resolution={lite ? 512 : 1024}
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

/* ── Scene root ─────────────────────────────────────────────────────── */
export default function GalleryCanvas({ phase, reduced, lite, nudge, onEnter }: GalleryCanvasProps) {
  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 2.05, 8.6], fov: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#07080a"]} />
      <fog attach="fog" args={["#07080a", 10, 30]} />

      <CameraRig phase={phase} reduced={reduced} lite={lite} />

      <ambientLight intensity={0.18} />
      {/* volumetric gallery downlights over the aisle */}
      <SpotLight
        position={[-2.6, 7.4, -0.8]}
        angle={0.42}
        penumbra={0.9}
        intensity={1.5}
        distance={14}
        attenuation={5.5}
        anglePower={4}
        color="#dfe6f2"
      />
      {!lite && (
        <SpotLight
          position={[2.6, 7.4, -0.8]}
          angle={0.42}
          penumbra={0.9}
          intensity={1.5}
          distance={14}
          attenuation={5.5}
          anglePower={4}
          color="#dfe6f2"
        />
      )}
      {/* faint cold rim from the neon floor lines */}
      <pointLight position={[-3.4, 0.4, 0.5]} color="#3d7bff" intensity={4} distance={7} decay={2} />
      <pointLight position={[3.4, 0.4, 0.5]} color="#3d7bff" intensity={4} distance={7} decay={2} />

      <Architecture />
      <Floor lite={lite} />
      <NeonPath />
      <NeonPath mirror />
      <Sculptures reduced={reduced} />
      <GiantKnot reduced={reduced} />
      <Portal lite={lite} reduced={reduced} />
      <EnterDoor onEnter={onEnter} phase={phase} nudge={nudge} />

      {/* drifting dust — cool ambient + warm near the door */}
      <Sparkles count={lite ? 60 : 140} scale={[16, 7, 14]} position={[0, 3, -1]} size={1.6} speed={reduced ? 0 : 0.25} opacity={0.35} color="#9fb8ff" />
      <Sparkles count={lite ? 30 : 70} scale={[4, 5, 3]} position={[0, 2, -4.6]} size={2.2} speed={reduced ? 0 : 0.45} opacity={0.5} color="#ffb37a" />

      {/* local, network-free studio lighting for the chrome/porcelain/glass */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} color="#e8ecf5" />
        <Lightformer intensity={1.3} position={[-8, 3, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#bcd0ff" />
        <Lightformer intensity={0.9} position={[0, 2.5, -8]} scale={[4, 5, 1]} color="#ff7a1a" />
        <Lightformer intensity={0.7} position={[8, 4, 0]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#fff1dd" />
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={1} luminanceSmoothing={0.2} />
        <Vignette eskil={false} offset={0.18} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
