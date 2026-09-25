import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { HERO_SPONSORS, type Sponsor } from "@/config/sponsors";
import { LIFT, SLAB_H, SLAB_W } from "./frame";
import {
  BONE,
  WALL_Z,
  clamp01,
  cutAtStop,
  slotsFor,
  smoothstep,
  wallCutAtStop,
  wallFor,
  type Framing,
  type Slot,
  type WallPlate,
} from "./hall";
import { PLAQUE_OUT } from "./timeline";

/* ── The sponsor hall ──────────────────────────────────────────────────
   The first sponsors in HERO_SPONSORS stand on plinths as thin dark plaques
   with their logos knocked out in bone, the same one-colour treatment the
   flat sponsor wall gets from its CSS filter. Plaques face the camera's rest
   pose enough to read, bob and sway a touch, and brighten under the cursor.
   The rest hang on the back wall as lit plates beside and over the door
   (frame.ts, wallFor). */

// ── Knockout ─────────────────────────────────────────────────────────
/** Logo height in the texture, px (wide wordmarks are capped by width).
 *  Enough for the door-flanking pair where the dolly stops, the largest
 *  any logo gets on screen (about 380 css px wide at 1920). */
const TEX_H = 256;
const TEX_MAX_W = 1024;
/** Transparent margin so mipmaps never bleed the edge. */
const TEX_PAD = 8;

interface Knockout {
  canvas: HTMLCanvasElement;
  /** Logo aspect (width / height), without the padding. */
  aspect: number;
  /** Canvas size over logo size, per axis (the padding). */
  padX: number;
  padY: number;
}

const knockouts = new Map<string, Promise<Knockout | null>>();

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
};

/** Run `job` when the main thread is free (Safari has no requestIdleCallback). */
function whenIdle(job: () => void) {
  const w = window as IdleWindow;
  if (w.requestIdleCallback) w.requestIdleCallback(job, { timeout: 1500 });
  else window.setTimeout(job, 32);
}

/* Rasterising an SVG and repainting it is a long task, so the logos are
   knocked out one per idle slot, never all in one go. */
let queue: Promise<void> = Promise.resolve();
const enqueue = (job: () => void) => {
  queue = queue.then(
    () =>
      new Promise<void>((done) =>
        whenIdle(() => {
          job();
          done();
        }),
      ),
  );
};

/** Caption type under a symbol-only mark, as a share of the logo height. */
const CAPTION_K = 0.2;

/** Repaint every opaque pixel of a loaded logo bone, keeping its alpha. A
 *  symbol-only mark gets its caption (sponsors.ts) set in mono under it. */
function paint(img: HTMLImageElement, caption?: string): Knockout | null {
  // sponsors.ts requires SVGs to carry an explicit width/height, so every
  // file here has an intrinsic size.
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (!nw || !nh) return null;
  const s = Math.min(TEX_H / nh, TEX_MAX_W / nw);
  const w = Math.max(1, Math.round(nw * s));
  const h = Math.max(1, Math.round(nh * s));
  const font = Math.round(h * CAPTION_K);
  const capH = caption ? Math.round(font * 1.9) : 0;
  const face = `700 ${font}px "Space Mono", ui-monospace, monospace`;
  // letter-spaced by hand (hair spaces): canvas letterSpacing is not everywhere yet
  const text = caption ? caption.toUpperCase().split("").join("\u200A") : "";
  let capW = 0;
  const measure = caption ? document.createElement("canvas").getContext("2d") : null;
  if (measure) {
    measure.font = face;
    capW = Math.ceil(measure.measureText(text).width * 1.06);
  }
  const bw = Math.max(w, capW);
  const bh = h + capH;
  const canvas = document.createElement("canvas");
  canvas.width = bw + TEX_PAD * 2;
  canvas.height = bh + TEX_PAD * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, TEX_PAD + (bw - w) / 2, TEX_PAD, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = BONE;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (caption) {
    ctx.globalCompositeOperation = "source-over";
    ctx.font = face;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 0.82;
    ctx.fillText(text, canvas.width / 2, TEX_PAD + h + capH * 0.82);
    ctx.globalAlpha = 1;
  }
  // Every logo is a Vite import (same origin or a data: URI), so the canvas
  // is never tainted and can go straight to WebGL.
  return { canvas, aspect: bw / bh, padX: canvas.width / bw, padY: canvas.height / bh };
}

function knockout(url: string, caption?: string): Promise<Knockout | null> {
  const key = caption ? `${url}#${caption}` : url;
  let job = knockouts.get(key);
  if (!job) {
    job = new Promise<Knockout | null>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      img.decode().then(
        () => enqueue(() => resolve(paint(img, caption))),
        () => resolve(null),
      );
    });
    knockouts.set(key, job);
  }
  return job;
}

function useLogoTexture(url: string, caption?: string) {
  const gl = useThree((s) => s.gl);
  const [logo, setLogo] = useState<{ texture: THREE.CanvasTexture; k: Knockout } | null>(null);
  useEffect(() => {
    let alive = true;
    let texture: THREE.CanvasTexture | null = null;
    knockout(url, caption).then((k) => {
      if (!alive || !k) return;
      texture = new THREE.CanvasTexture(k.canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      setLogo({ texture, k });
    });
    return () => {
      alive = false;
      texture?.dispose();
    };
  }, [url, caption, gl]);
  return logo;
}

// ── Layout ───────────────────────────────────────────────────────────
/** World units per px of the flat wall's optical caps (sponsors.ts maxW/maxH). */
const PX = 1 / 128;
const SLAB_D = 0.05;

/** Camera the plaques turn toward (its rest pose, roughly). */
const FACE_Z = 9.2;
const FACE_Y = 2.05;
/** How much of the turn toward the camera each plaque takes. */
const FACE = 0.78;

// ── One plaque ───────────────────────────────────────────────────────
interface PlaqueProps {
  sponsor: Sponsor;
  slot: Slot;
  seed: number;
  reduced: boolean;
  progress: MotionValue<number>;
  /** The stop frame would cut this one at its edge: fade it out on the way in. */
  fades: boolean;
}

const slabGeo = new THREE.BoxGeometry(SLAB_W, SLAB_H, SLAB_D);
const slabEdges = new THREE.EdgesGeometry(slabGeo);
const planeGeo = new THREE.PlaneGeometry(1, 1);

function Plaque({ sponsor, slot, seed, reduced, progress, fades }: PlaqueProps) {
  const logo = useLogoTexture(sponsor.logo, sponsor.caption);
  const root = useRef<THREE.Group>(null!);
  const float = useRef<THREE.Group>(null!);
  const logoMat = useRef<THREE.MeshBasicMaterial>(null!);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null!);
  const hovered = useRef(false);
  const glow = useRef(0);
  const shown = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);

  const { s } = slot;
  const yaw = Math.atan2(-slot.x, FACE_Z - slot.z) * FACE;
  const baseY = slot.h + LIFT + (SLAB_H * s) / 2;
  // Lean back like a lectern, so the face meets the camera's downward look.
  const tilt = Math.atan2(FACE_Y - baseY, Math.hypot(slot.x, FACE_Z - slot.z)) * 0.85;

  // Fit the logo inside its optical caps, then inside the slab's margins.
  const size = useMemo(() => {
    if (!logo) return null;
    const maxW = Math.min(sponsor.maxW * PX, SLAB_W - 0.26);
    const maxH = Math.min(sponsor.maxH * PX, SLAB_H - 0.24);
    let w = maxW;
    let h = w / logo.k.aspect;
    if (h > maxH) {
      h = maxH;
      w = h * logo.k.aspect;
    }
    return [w * logo.k.padX, h * logo.k.padY] as const;
  }, [logo, sponsor.maxW, sponsor.maxH]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = state.clock.elapsedTime;
    const g = float.current;
    // Reduced motion: still, in the resting pose.
    g.position.y = reduced ? baseY : baseY + Math.sin(t * 0.6 + seed * 1.7) * 0.014;
    g.rotation.y = reduced ? yaw : yaw + Math.sin(t * 0.27 + seed * 2.3) * 0.028;
    const target = hovered.current ? 1 : 0;
    glow.current = THREE.MathUtils.damp(glow.current, target, 8, dt);
    // Under reduced motion the canvas only draws on demand: keep asking for
    // frames until the hover glow has settled.
    if (Math.abs(glow.current - target) > 0.004) state.invalidate();
    const k = glow.current;

    const keep = fades ? 1 - smoothstep(PLAQUE_OUT[0], PLAQUE_OUT[1], clamp01(progress.get())) : 1;
    const o = Math.round(keep * 100) / 100;
    if (o !== shown.current) {
      shown.current = o;
      root.current.visible = o > 0.01;
      if (fades) {
        root.current.traverse((obj) => {
          const m = (obj as THREE.Mesh).material as THREE.Material | undefined;
          if (m && !Array.isArray(m) && m !== logoMat.current && m !== edgeMat.current) m.opacity = o;
        });
      }
    }
    if (logoMat.current) {
      logoMat.current.color.setScalar(0.94 + k * 0.36);
      logoMat.current.opacity = o;
    }
    if (edgeMat.current) edgeMat.current.opacity = (0.2 + k * 0.35) * o;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    invalidate();
  };
  const out = () => {
    hovered.current = false;
    invalidate();
  };

  const plinthW = SLAB_W * s * 0.62;
  return (
    <group ref={root} position={[slot.x, 0, slot.z]}>
      {/* plinth + its cap, turned with the plaque so the pair reads as one */}
      <group rotation={[0, yaw, 0]}>
        <mesh position={[0, slot.h / 2, 0]}>
          <boxGeometry args={[plinthW, slot.h, 0.56 * s]} />
          <meshStandardMaterial color="#141518" roughness={0.92} transparent={fades} />
        </mesh>
        <mesh position={[0, slot.h + 0.018, 0]}>
          <boxGeometry args={[plinthW + 0.06, 0.036, 0.56 * s + 0.06]} />
          <meshStandardMaterial color="#1c1d21" roughness={0.8} metalness={0.15} transparent={fades} />
        </mesh>
        {/* ember seam where the plaque's light falls on the cap */}
        <mesh position={[0, slot.h + 0.028, 0.28 * s + 0.032]}>
          <boxGeometry args={[plinthW + 0.06, 0.018, 0.004]} />
          <meshBasicMaterial color={[1.3, 0.34, 0.05]} toneMapped={false} transparent={fades} />
        </mesh>
      </group>

      <group ref={float} position={[0, baseY, 0]} rotation={[0, yaw, 0]} scale={s}>
        <group rotation={[-tilt, 0, 0]}>
          <mesh geometry={slabGeo} onPointerOver={over} onPointerOut={out}>
            {/* pushed back a hair so the coplanar edge lines never z-fight into dashes */}
            <meshStandardMaterial
              color="#0d0e11"
              roughness={0.42}
              metalness={0.35}
              envMapIntensity={0.6}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
              transparent={fades}
            />
          </mesh>
          <lineSegments geometry={slabEdges}>
            <lineBasicMaterial ref={edgeMat} color={BONE} transparent opacity={0.2} toneMapped={false} fog={false} />
          </lineSegments>
          {logo && size && (
            <mesh geometry={planeGeo} position={[0, 0, SLAB_D / 2 + 0.004]} scale={[size[0], size[1], 1]}>
              <meshBasicMaterial
                ref={logoMat}
                map={logo.texture}
                transparent
                depthWrite={false}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

// ── One lit plate on the back wall ───────────────────────────────────
interface WallLogoProps {
  sponsor: Sponsor;
  plate: WallPlate;
  progress: MotionValue<number>;
  fades: boolean;
}

const PLATE_D = 0.04;

/** A dark plate flat on the back wall, its logo in bone, a lamp strip over
 *  it. Still: the wall doesn't sway. */
function WallLogo({ sponsor, plate, progress, fades }: WallLogoProps) {
  const logo = useLogoTexture(sponsor.logo, sponsor.caption);
  const root = useRef<THREE.Group>(null!);
  const logoMat = useRef<THREE.MeshBasicMaterial>(null!);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null!);
  const hovered = useRef(false);
  const glow = useRef(0);
  const shown = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  const { w, h } = plate;
  const box = useMemo(() => new THREE.BoxGeometry(w, h, PLATE_D), [w, h]);
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box]);
  useEffect(
    () => () => {
      box.dispose();
      edges.dispose();
    },
    [box, edges],
  );

  const size = useMemo(() => {
    if (!logo) return null;
    // Wall plates are read from further off: the caps count a little more.
    const k = 1.4;
    const maxW = Math.min(sponsor.maxW * PX * k, w - 0.28);
    const maxH = Math.min(sponsor.maxH * PX * k * (sponsor.caption ? 1.25 : 1), h - 0.2);
    let lw = maxW;
    let lh = lw / logo.k.aspect;
    if (lh > maxH) {
      lh = maxH;
      lw = lh * logo.k.aspect;
    }
    return [lw * logo.k.padX, lh * logo.k.padY] as const;
  }, [logo, sponsor.maxW, sponsor.maxH, sponsor.caption, w, h]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const target = hovered.current ? 1 : 0;
    glow.current = THREE.MathUtils.damp(glow.current, target, 8, dt);
    if (Math.abs(glow.current - target) > 0.004) state.invalidate();
    const k = glow.current;
    const keep = fades ? 1 - smoothstep(PLAQUE_OUT[0], PLAQUE_OUT[1], clamp01(progress.get())) : 1;
    const o = Math.round(keep * 100) / 100;
    if (o !== shown.current) {
      shown.current = o;
      root.current.visible = o > 0.01;
      if (fades) {
        root.current.traverse((obj) => {
          const m = (obj as THREE.Mesh).material as THREE.Material | undefined;
          if (m && !Array.isArray(m) && m !== logoMat.current && m !== edgeMat.current) m.opacity = o;
        });
      }
    }
    if (logoMat.current) {
      logoMat.current.color.setScalar(0.96 + k * 0.34);
      logoMat.current.opacity = o;
    }
    if (edgeMat.current) edgeMat.current.opacity = (0.22 + k * 0.35) * o;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    invalidate();
  };
  const out = () => {
    hovered.current = false;
    invalidate();
  };

  return (
    <group ref={root} position={[plate.x, plate.y, WALL_Z + PLATE_D / 2]}>
      <mesh geometry={box} onPointerOver={over} onPointerOut={out}>
        <meshStandardMaterial
          color="#101114"
          roughness={0.5}
          metalness={0.3}
          envMapIntensity={0.5}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          transparent={fades}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgeMat} color={BONE} transparent opacity={0.22} toneMapped={false} fog={false} />
      </lineSegments>
      {/* the lamp strip over the plate: the ember seam the plinths carry */}
      <mesh position={[0, h / 2 + 0.05, 0.03]}>
        <boxGeometry args={[w * 0.56, 0.018, 0.02]} />
        <meshBasicMaterial color={[1.3, 0.34, 0.05]} toneMapped={false} transparent={fades} />
      </mesh>
      {logo && size && (
        <mesh geometry={planeGeo} position={[0, 0, PLATE_D / 2 + 0.004]} scale={[size[0], size[1], 1]}>
          <meshBasicMaterial ref={logoMat} map={logo.texture} transparent depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
      )}
    </group>
  );
}

// ── The hall ─────────────────────────────────────────────────────────
interface LogoPlaquesProps {
  reduced: boolean;
  progress: MotionValue<number>;
  /** The scene's current framing (GalleryScene's useFraming). */
  frame: Framing;
  aspect: number;
}

export default function LogoPlaques({ reduced, progress, frame, aspect }: LogoPlaquesProps) {
  const portrait = aspect < 1;
  const slots = slotsFor(aspect);
  const wall = wallFor(aspect);
  const onWall = HERO_SPONSORS.slice(slots.length, slots.length + wall.length);
  return (
    <group>
      {onWall.map((sponsor, i) => {
        const fades = wallCutAtStop(wall[i], frame, aspect);
        return (
          <WallLogo
            key={`w${portrait ? "p" : "l"}${fades ? "f" : ""}-${sponsor.name}`}
            sponsor={sponsor}
            plate={wall[i]}
            progress={progress}
            fades={fades}
          />
        );
      })}
      {HERO_SPONSORS.slice(0, slots.length).map((sponsor, i) => {
        const fades = cutAtStop(slots[i], frame, aspect);
        return (
          <Plaque
            // a new layout or a change of fade remounts, with fresh materials
            key={`${portrait ? "p" : "l"}${fades ? "f" : ""}-${sponsor.name}`}
            sponsor={sponsor}
            slot={slots[i]}
            seed={i}
            reduced={reduced}
            progress={progress}
            fades={fades}
          />
        );
      })}
    </group>
  );
}
