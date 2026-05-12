import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";

// Toronto blueprint/ocean map layers ordered from highest to lowest altitude.
// Each SVG contains 22 matched layer groups (identical IDs across all files),
// representing a progressive zoom-in sequence of Toronto's waterfront.
const LAYERS = [
  "/toronto_ocean_20260512_110217.svg",
  "/toronto_ocean_20260512_110305.svg",
  "/toronto_ocean_20260512_110344.svg",
  "/toronto_ocean_20260512_110606.svg",
  "/toronto_ocean_20260512_110656.svg",
] as const;

// Per-layer scroll windows: [fadeInStart, peakStart, peakEnd, fadeOutEnd]
// Adjacent layers share crossfade ranges to ensure continuous visibility.
// All crossfade spans are 0.16 scroll-units for consistent blend durations.
const LAYER_WINDOWS: [number, number, number, number][] = [
  [0,    0,    0.12, 0.28], // layer 0: full from start, fades out 0.12–0.28
  [0.12, 0.28, 0.37, 0.53], // layer 1: fades in 0.12–0.28, peak 0.28–0.37
  [0.37, 0.53, 0.62, 0.78], // layer 2: fades in 0.37–0.53, peak 0.53–0.62
  [0.62, 0.78, 0.84, 1.0 ], // layer 3: fades in 0.62–0.78, peak 0.78–0.84, fades 0.84–1.0
  [0.84, 1.0,  1.0,  1.0 ], // layer 4: fades in 0.84–1.0, stays at full
];

// Total zoom applied globally across the full scroll range (1.0 → 1.0 + TOTAL_ZOOM).
// A single continuous curve eliminates the scale discontinuity that would occur
// if each layer independently reset to scale 1.0 when entering the scene.
const TOTAL_ZOOM = 0.15;

// Perlin's improved smoothstep (5th-degree polynomial).
// Unlike quadratic easeInOut, this has zero velocity AND zero acceleration at
// both endpoints (C² continuous), producing noticeably smoother fade transitions.
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function computeOpacity(i: number, p: number): number {
  const [fi, fe, fo, foe] = LAYER_WINDOWS[i];
  if (p < fi) return 0;
  if (p > foe) return i === LAYERS.length - 1 ? 1 : 0;
  if (p < fe) {
    const span = fe - fi;
    return smootherstep(span > 0 ? (p - fi) / span : 1);
  }
  if (p <= fo) return 1;
  const span = foe - fo;
  return smootherstep(span > 0 ? 1 - (p - fo) / span : 0);
}

// Global continuous scale: all layers share the same zoom at any scroll position,
// so there is no visible scale jump when the active layer changes.
function computeScale(p: number): number {
  return 1.0 + TOTAL_ZOOM * smootherstep(Math.min(p, 1));
}

interface SVGScrollBackgroundProps {
  scrollProgress?: MotionValue<number>;
}

const SVGScrollBackground = ({ scrollProgress }: SVGScrollBackgroundProps) => {
  const fallbackProgress = useMotionValue(0);
  const activeProgress = scrollProgress ?? fallbackProgress;
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Non-blocking image preload to avoid stutter on first scroll
  useEffect(() => {
    LAYERS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Drive opacity and scale from scroll progress without causing React re-renders.
  // useMotionValueEvent fires at most once per animation frame (rAF-synced),
  // so no additional throttling is needed.
  useMotionValueEvent(activeProgress, "change", (latest) => {
    const scale = computeScale(latest);
    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = String(computeOpacity(i, latest));
      el.style.transform = `scale(${scale})`;
    });
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "#07111f",
      }}
    >
      {LAYERS.map((src, i) => (
        <img
          key={src}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          src={src}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: i === 0 ? 1 : 0,
            transform: "scale(1)",
            willChange: "transform, opacity",
            transformOrigin: "center center",
          }}
        />
      ))}
    </div>
  );
};

export default SVGScrollBackground;
