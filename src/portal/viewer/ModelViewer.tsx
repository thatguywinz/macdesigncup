// The 3D viewer: a drafting table for one model. A faint bone grid floor
// scaled to the model, a soft contact shadow, and ember dimension lines that
// measure the model in its own units, the same CAD vocabulary as the site's
// blueprint drawings. Orbit to look around; the toolbar resets the view,
// spins it, shows the wireframe, hides the dimensions, goes full screen.
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, Html, Line, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Box, Expand, Focus, Package, Rotate3d, Ruler, Shrink } from "lucide-react";
import type { ViewableExt } from "../shared/formats";
import { MM_PER, formatMeasure, hasSpec, specCheck, type Measure, type Spec, type Units } from "../shared/checks";
import { disposeObject, fetchBytes, measureGeometry, parseModel, prepareModel, type LoadedModel } from "./loadModel";

export type ModelSource = { kind: "url"; url: string; ext: ViewableExt } | { kind: "file"; file: File; ext: ViewableExt };

/** Call to get a PNG of what the viewer shows right now (max 960 px wide). */
export type CaptureFn = () => Promise<Blob | null>;

interface ModelViewerProps {
  source: ModelSource | null;
  upAxis: "y" | "z";
  /** Shows the "stand it up" switch (the form uses it; viewers just look). */
  onUpAxisChange?: (axis: "y" | "z") => void;
  /** Receives the measurement (mm) whenever the model, its up axis or units change. */
  onMeasure?: (m: Measure | null) => void;
  /** The units the file was exported in. Default mm. */
  units?: Units;
  /** Organizers' size spec: drawn as a box, checked in the readout. */
  spec?: Spec | null;
  /** Receives a capture function once a model is on screen. */
  captureRef?: React.MutableRefObject<CaptureFn | null>;
  className?: string;
  /** Accessible description of what is being shown. */
  label: string;
  /** What to show before any model is chosen. */
  empty?: ReactNode;
}

/** 1, 2, 5, 10, 20, 50 ... the grid step closest to `x`. */
function niceStep(x: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

const fmt = (n: number, max: number) => {
  const digits = max >= 100 ? 0 : max >= 10 ? 1 : 2;
  return Number(n.toFixed(digits)).toString();
};

// ── Scene pieces ──────────────────────────────

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Ember CAD dimensions along the model's width, depth and height. */
function Dimensions({ size, mmPer }: { size: THREE.Vector3; mmPer: number }) {
  const max = Math.max(size.x, size.y, size.z);
  const mmMax = max * mmPer;
  const gap = max * 0.08; // how far the lines stand off the model
  const tick = max * 0.025;
  const hx = size.x / 2;
  const hz = size.z / 2;
  const color = "#ff6a14";
  const y0 = 0.0005 * max;

  const width: [number, number, number][] = [
    [-hx, y0, hz + gap],
    [hx, y0, hz + gap],
  ];
  const depth: [number, number, number][] = [
    [hx + gap, y0, -hz],
    [hx + gap, y0, hz],
  ];
  const height: [number, number, number][] = [
    [-hx - gap, 0, hz + gap],
    [-hx - gap, size.y, hz + gap],
  ];
  const ticks: [number, number, number][][] = [
    [[-hx, y0, hz + gap - tick], [-hx, y0, hz + gap + tick]],
    [[hx, y0, hz + gap - tick], [hx, y0, hz + gap + tick]],
    [[hx + gap - tick, y0, -hz], [hx + gap + tick, y0, -hz]],
    [[hx + gap - tick, y0, hz], [hx + gap + tick, y0, hz]],
    [[-hx - gap - tick, 0, hz + gap], [-hx - gap + tick, 0, hz + gap]],
    [[-hx - gap - tick, size.y, hz + gap], [-hx - gap + tick, size.y, hz + gap]],
  ];
  const label = (text: string, position: [number, number, number]) => (
    // Html passes unknown props to its three.js group, so aria-hidden goes on the inner span.
    <Html position={position} center zIndexRange={[1, 0]}>
      <span className="viewer-dim" aria-hidden="true">
        {text}
      </span>
    </Html>
  );
  return (
    <group>
      {[width, depth, height].map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1.25} transparent opacity={0.9} />
      ))}
      {ticks.map((pts, i) => (
        <Line key={`t${i}`} points={pts} color={color} lineWidth={1.25} transparent opacity={0.9} />
      ))}
      {label(`${fmt(size.x * mmPer, mmMax)} mm`, [0, y0, hz + gap])}
      {label(`${fmt(size.z * mmPer, mmMax)} mm`, [hx + gap, y0, 0])}
      {label(`${fmt(size.y * mmPer, mmMax)} mm`, [-hx - gap, size.y / 2, hz + gap])}
    </group>
  );
}

/**
 * The organizers' size limit as a dashed box around the model (model units).
 * Bone when the model fits, red when it doesn't. Unset sides follow the model.
 */
function SpecBox({ size, mmPer, spec, fits }: { size: THREE.Vector3; mmPer: number; spec: Spec; fits: boolean }) {
  const w = (spec.maxW ?? size.x * mmPer) / mmPer;
  const d = (spec.maxD ?? size.z * mmPer) / mmPer;
  const h = (spec.maxH ?? size.y * mmPer) / mmPer;
  // Footprint limits apply either way round: line the box up with the model's longer side.
  const [bx, bz] = spec.maxW !== null && spec.maxD !== null && size.x >= size.z !== w >= d ? [d, w] : [w, d];
  const x = bx / 2, z = bz / 2;
  const c: [number, number, number][] = [
    [-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z],
    [-x, h, -z], [x, h, -z], [x, h, z], [-x, h, z],
  ];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const color = fits ? "#eae2cc" : "#ef4b3c";
  return (
    <group>
      {edges.map(([p, q], i) => (
        <Line key={i} points={[c[p], c[q]]} color={color} lineWidth={1} dashed dashSize={Math.max(bx, h) / 60} gapSize={Math.max(bx, h) / 90} transparent opacity={0.55} />
      ))}
    </group>
  );
}

function Rig({
  model,
  controlsRef,
  autoRotate,
}: {
  model: LoadedModel;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  autoRotate: boolean;
}) {
  const { camera, size } = useThree();
  const max = Math.max(model.size.x, model.size.y, model.size.z);
  const aspect = size.width / Math.max(1, size.height);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = max / 200;
    cam.far = max * 60;
    // Frame the bounding sphere plus the dimension lines' margin, whichever
    // of the vertical or horizontal field of view is tighter.
    const radius = 0.5 * Math.hypot(model.size.x, model.size.y, model.size.z) * 1.22;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const d = radius / Math.sin(Math.min(vFov, hFov) / 2);
    const dir = new THREE.Vector3(0.62, 0.42, 0.78).normalize();
    const target = new THREE.Vector3(0, model.size.y * 0.42, 0);
    cam.position.copy(target).addScaledVector(dir, d);
    cam.updateProjectionMatrix();
    const c = controlsRef.current;
    if (c) {
      c.target.copy(target);
      c.update();
      c.saveState();
    }
    // Reframe on a new model or a new up axis, not on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, model, max, controlsRef]);
  return (
    <OrbitControls
      ref={controlsRef as never}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      autoRotate={autoRotate}
      autoRotateSpeed={1.2}
      minDistance={max * 0.25}
      maxDistance={max * 10}
      maxPolarAngle={Math.PI * 0.95}
    />
  );
}

/** Redraws once when something changes that React doesn't see (material flags). */
function Redraw({ deps }: { deps: unknown[] }) {
  const invalidate = useThree((s) => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw whenever any dep changes
  useEffect(() => invalidate(), deps);
  return null;
}

function Capture({ captureRef }: { captureRef?: React.MutableRefObject<CaptureFn | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!captureRef) return;
    captureRef.current = async () => {
      gl.render(scene, camera);
      const src = gl.domElement;
      const scale = Math.min(1, 960 / src.width);
      const out = document.createElement("canvas");
      out.width = Math.round(src.width * scale);
      out.height = Math.round(src.height * scale);
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#0d0e10";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(src, 0, 0, out.width, out.height);
      return new Promise<Blob | null>((resolve) => out.toBlob((b) => resolve(b), "image/png"));
    };
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera]);
  return null;
}

// ── Error boundary (no WebGL, lost context) ───

class ViewerBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[viewer]", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// ── The viewer ────────────────────────────────

export default function ModelViewer({
  source,
  upAxis,
  onUpAxisChange,
  onMeasure,
  units = "mm",
  spec = null,
  captureRef,
  className,
  label,
  empty,
}: ModelViewerProps) {
  const [raw, setRaw] = useState<{ object: THREE.Object3D; hasMaterials: boolean } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [autoRotate, setAutoRotate] = useState(false);
  const [wire, setWire] = useState(false);
  const [dims, setDims] = useState(true);
  const [full, setFull] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [gl] = useState(() => (typeof document === "undefined" ? true : webglAvailable()));

  // Load whenever the source changes.
  const key = source ? (source.kind === "url" ? source.url.split("?")[0] : `${source.file.name}:${source.file.size}:${source.file.lastModified}`) : "";
  useEffect(() => {
    if (!source) {
      setRaw(null);
      setStatus("idle");
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setStatus("loading");
    setProgress(0);
    setError("");
    (async () => {
      const bytes = source.kind === "file" ? await source.file.arrayBuffer() : await fetchBytes(source.url, setProgress, ac.signal);
      if (cancelled) return;
      const parsed = await parseModel(source.ext, bytes);
      if (cancelled) return disposeObject(parsed.object);
      setRaw(parsed);
      setStatus("ready");
    })().catch((e: unknown) => {
      if (cancelled || (e as Error)?.name === "AbortError") return;
      console.error("[viewer]", e);
      setError((e as Error)?.message && !/^\w+Error$/.test((e as Error).message) ? (e as Error).message : "This file couldn't be opened.");
      setStatus("error");
    });
    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies the source
  }, [key]);

  // Stand it up (re-centres when the up axis changes).
  const model = useMemo(() => {
    if (!raw) return null;
    try {
      return prepareModel(raw.object, raw.hasMaterials, upAxis);
    } catch (e) {
      console.error("[viewer]", e);
      return null;
    }
  }, [raw, upAxis]);

  useEffect(() => () => void (raw && disposeObject(raw.object)), [raw]);

  // What the model measures, in millimetres (volume only for closed solids).
  const mmPer = MM_PER[units];
  const geometry = useMemo(() => (model ? measureGeometry(model.object) : null), [model]);
  const measure: Measure | null = useMemo(() => {
    if (!model || !geometry) return null;
    return {
      w: model.size.x * mmPer,
      d: model.size.z * mmPer,
      h: model.size.y * mmPer,
      volume: geometry.closed ? geometry.volume * mmPer ** 3 : null,
      area: geometry.area * mmPer ** 2,
      triangles: model.triangles,
      closed: geometry.closed,
    };
  }, [model, geometry, mmPer]);
  const specLines = useMemo(() => (measure && hasSpec(spec) ? specCheck(measure, spec) : []), [measure, spec]);
  const fits = specLines.every((l) => l.ok !== false);
  const [showSpec, setShowSpec] = useState(true);

  useEffect(() => {
    onMeasure?.(measure);
  }, [measure, onMeasure]);

  // Wireframe toggle.
  useEffect(() => {
    if (!model) return;
    model.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = wire;
      }
    });
  }, [model, wire]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  }, []);

  const reset = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  const max = model ? Math.max(model.size.x, model.size.y, model.size.z) : 1;
  const step = niceStep(max / 8);

  return (
    <div ref={wrapRef} className={`viewer ${full ? "viewer--full" : ""} ${className ?? ""}`} role="group" aria-label={label}>
      {status === "idle" && <div className="viewer-empty">{empty}</div>}

      {status === "loading" && (
        <div className="viewer-empty" role="status">
          <span className="viewer-load">
            <span className="viewer-load-bar" style={{ transform: `scaleX(${source?.kind === "file" ? 0.6 : Math.max(0.04, progress)})` }} />
          </span>
          <span className="mt-3 font-body text-sm text-concrete">Opening the model…</span>
        </div>
      )}

      {status === "error" && (
        <div className="viewer-empty" role="alert">
          <p className="max-w-[28ch] text-center font-body text-[15px] text-foreground/80">{error}</p>
        </div>
      )}

      {status === "ready" && model && !gl && (
        <div className="viewer-empty">
          <p className="max-w-[30ch] text-center font-body text-[15px] text-foreground/80">This browser can't show 3D (WebGL is off). The file itself is fine.</p>
        </div>
      )}

      {status === "ready" && model && gl && (
        <ViewerBoundary
          fallback={
            <div className="viewer-empty">
              <p className="max-w-[30ch] text-center font-body text-[15px] text-foreground/80">The 3D view stopped working. Reload the page to try again.</p>
            </div>
          }
        >
          <Canvas
            className="viewer-canvas"
            shadows
            dpr={[1, 2]}
            frameloop={autoRotate ? "always" : "demand"}
            camera={{ fov: 35, position: [3, 2, 3] }}
            gl={{ antialias: true, preserveDrawingBuffer: !!captureRef, toneMapping: THREE.ACESFilmicToneMapping }}
            onCreated={({ gl: r }) => {
              r.setClearColor("#0d0e10");
            }}
          >
            <Suspense fallback={null}>
              <Environment />
              <hemisphereLight args={["#f3ead6", "#1a1c20", 0.55]} />
              <directionalLight position={[max * 1.2, max * 2, max * 1.4]} intensity={1.6} />
              <directionalLight position={[-max * 1.5, max * 0.8, -max]} intensity={0.45} color="#9db4ff" />
              <primitive object={model.object} />
              <ContactShadows position={[0, max * 0.0004, 0]} scale={max * 3.2} far={max * 1.2} blur={2.4} opacity={0.55} resolution={512} />
              <Grid
                position={[0, -max * 0.0004, 0]}
                infiniteGrid
                cellSize={step}
                sectionSize={step * 5}
                cellThickness={0.6}
                sectionThickness={1}
                cellColor="#2b2a27"
                sectionColor="#4a463d"
                fadeDistance={max * 9}
                fadeStrength={1.6}
              />
              {dims && <Dimensions size={model.size} mmPer={mmPer} />}
              {showSpec && hasSpec(spec) && <SpecBox size={model.size} mmPer={mmPer} spec={spec} fits={fits} />}
              <Rig model={model} controlsRef={controlsRef} autoRotate={autoRotate} />
              <Capture captureRef={captureRef} />
              <Redraw deps={[wire, dims, model, showSpec, spec, units]} />
            </Suspense>
          </Canvas>

          <div className="viewer-readout" aria-live="polite">
            {measure && (
              <>
                <span>{formatMeasure(measure)}</span>
                <span className="text-concrete">
                  {measure.volume !== null ? `${(measure.volume / 1000).toFixed(measure.volume < 10_000 ? 2 : 1)} cm³ · ` : "open mesh · "}
                  {(measure.area / 100).toFixed(1)} cm² · {model.triangles.toLocaleString("en-CA")} tris
                </span>
                {specLines.length > 0 && (
                  <span className={fits ? "text-[#9fd59a]" : "text-[#ff7a6b]"}>{fits ? "Fits the spec" : "Outside the spec"}</span>
                )}
              </>
            )}
          </div>

          <div className="viewer-tools" role="toolbar" aria-label="View controls">
            <ToolButton label="Reset view" onClick={reset}>
              <Focus size={17} strokeWidth={1.5} />
            </ToolButton>
            <ToolButton label="Turntable" pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
              <Rotate3d size={17} strokeWidth={1.5} />
            </ToolButton>
            <ToolButton label="Wireframe" pressed={wire} onClick={() => setWire((v) => !v)}>
              <Box size={17} strokeWidth={1.5} />
            </ToolButton>
            <ToolButton label="Dimensions" pressed={dims} onClick={() => setDims((v) => !v)}>
              <Ruler size={17} strokeWidth={1.5} />
            </ToolButton>
            {hasSpec(spec) && (
              <ToolButton label="Size limit box" pressed={showSpec} onClick={() => setShowSpec((v) => !v)}>
                <Package size={17} strokeWidth={1.5} />
              </ToolButton>
            )}
            <ToolButton label={full ? "Exit full screen" : "Full screen"} onClick={toggleFull}>
              {full ? <Shrink size={17} strokeWidth={1.5} /> : <Expand size={17} strokeWidth={1.5} />}
            </ToolButton>
          </div>

          {onUpAxisChange && (
            <button
              type="button"
              className="viewer-upright focus-ember"
              onClick={() => onUpAxisChange(upAxis === "y" ? "z" : "y")}
              aria-label={`Model lying down? Switch to ${upAxis === "y" ? "Z" : "Y"} up`}
            >
              Lying down? Stand it up ({upAxis === "y" ? "Y" : "Z"} up)
            </button>
          )}
        </ViewerBoundary>
      )}
    </div>
  );
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className="viewer-tool focus-ember"
      aria-label={label}
      title={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
