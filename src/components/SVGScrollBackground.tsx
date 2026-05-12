import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";

// Toronto blueprint/ocean map layers ordered from highest to lowest altitude
const LAYERS = [
  "/toronto_ocean_20260512_110217.svg",
  "/toronto_ocean_20260512_110305.svg",
  "/toronto_ocean_20260512_110344.svg",
  "/toronto_ocean_20260512_110606.svg",
  "/toronto_ocean_20260512_110656.svg",
] as const;

// Per-layer scroll windows: [fadeInStart, peakStart, peakEnd, fadeOutEnd]
// Overlapping ranges ensure continuous visibility and smooth crossfades.
const LAYER_WINDOWS: [number, number, number, number][] = [
  [0,    0,    0.12, 0.28], // layer 0: full from start, fades out 0.12–0.28
  [0.12, 0.28, 0.37, 0.53], // layer 1
  [0.37, 0.53, 0.62, 0.78], // layer 2
  [0.62, 0.78, 0.87, 0.97], // layer 3
  [0.87, 0.97, 1.0,  1.0 ], // layer 4: fades in, stays at full
];

// Subtle zoom applied per-layer across its visible range (1.0 → 1.08)
const ZOOM_AMOUNT = 0.08;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function computeOpacity(i: number, p: number): number {
  const [fi, fe, fo, foe] = LAYER_WINDOWS[i];
  if (p < fi) return 0;
  if (p > foe) return i === LAYERS.length - 1 ? 1 : 0;
  if (p < fe) {
    const span = fe - fi;
    return easeInOut(span > 0 ? (p - fi) / span : 1);
  }
  if (p <= fo) return 1;
  const span = foe - fo;
  return easeInOut(span > 0 ? 1 - (p - fo) / span : 0);
}

function computeScale(i: number, p: number): number {
  const [fi, , , foe] = LAYER_WINDOWS[i];
  const end = i === LAYERS.length - 1 ? 1.0 : foe;
  if (p <= fi) return 1.0;
  const span = end - fi;
  const t = span > 0 ? Math.min((p - fi) / span, 1) : 1;
  return 1.0 + ZOOM_AMOUNT * easeInOut(t);
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
    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = String(computeOpacity(i, latest));
      el.style.transform = `scale(${computeScale(i, latest)})`;
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
