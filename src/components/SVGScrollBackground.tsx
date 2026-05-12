import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";

// Toronto map zoom sequence centered on 43.644075, -79.3654923 (Toronto waterfront).
// Each SVG is a full-resolution (3543×1994) export at progressively closer zoom.
// Current sequence covers 5000 m → 1000 m; 500 m and 250 m SVGs can be appended.
const LAYERS = [
  "/toronto_ocean_20260512_110217.svg", // 5000 m view
  "/toronto_ocean_20260512_110305.svg", // 4000 m view
  "/toronto_ocean_20260512_110344.svg", // 3000 m view
  "/toronto_ocean_20260512_110606.svg", // 2000 m view
  "/toronto_ocean_20260512_110656.svg", // 1000 m view
] as const;

// Scroll progress value (0–1) at which the incoming layer finishes fading in
// and the outgoing layer disappears. One entry per transition (= LAYERS.length - 1).
// Evenly distributed so every zoom step gets equal scroll real-estate.
const TRANSITION_AT = [0.25, 0.50, 0.75, 1.00] as const;

// Duration (in scroll-progress units) of each fade-in. The fade begins at
// TRANSITION_AT[i] - FADE_DURATION and completes at TRANSITION_AT[i].
const FADE_DURATION = 0.14;

// Geographic zoom ratio between consecutive SVG exports: distance[i] / distance[i+1].
//   5000/4000 = 1.25  |  4000/3000 ≈ 1.333  |  3000/2000 = 1.5  |  2000/1000 = 2.0
//
// While layer[i] is the active layer it scales from 1.0 up to SCALE_RATIOS[i].
// At TRANSITION_AT[i] the layer has reached exactly that scale, which makes its
// visible content match layer[i+1] at scale 1.0 — so the instant swap is invisible.
const SCALE_RATIOS = [1.25, 4 / 3, 1.5, 2.0] as const;

// Perlin's smootherstep (degree-5 Hermite): C² at both endpoints.
// Zero velocity AND zero acceleration at t=0 and t=1 → imperceptibly smooth.
function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

// ─── Stacking opacity strategy ───────────────────────────────────────────────
// The INCOMING layer fades in (0 → 1) on top of the OUTGOING layer.
// The OUTGOING layer holds at opacity 1 throughout the entire fade-in.
// The moment the fade completes the outgoing layer snaps to opacity 0 —
// invisibly, because the incoming layer is now fully opaque and covers it.
//
// Consequence: at every scroll position at least one layer is at opacity 1,
// so the dark background colour (#07111f) can never bleed through.
function computeOpacity(i: number, p: number): number {
  const lastIdx = LAYERS.length - 1;

  if (i === 0) {
    // Always visible until the first incoming layer is fully opaque.
    return p < TRANSITION_AT[0] ? 1 : 0;
  }

  const entry = TRANSITION_AT[i - 1] - FADE_DURATION;

  if (i === lastIdx) {
    // Final layer: fade in once and stay permanently.
    if (p < entry) return 0;
    if (p >= TRANSITION_AT[i - 1]) return 1;
    return smootherstep((p - entry) / FADE_DURATION);
  }

  // Middle layers: fade in → hold → disappear when the next layer takes over.
  if (p < entry) return 0;
  if (p < TRANSITION_AT[i - 1]) return smootherstep((p - entry) / FADE_DURATION);
  if (p < TRANSITION_AT[i]) return 1;
  return 0;
}

// While a layer is "on stage" it scales from 1.0 → SCALE_RATIOS[i] so that
// its content matches the next layer (scale 1.0) at the handoff moment.
function computeScale(i: number, p: number): number {
  if (i >= SCALE_RATIOS.length) return 1; // last layer — no further zoom needed

  const stageStart = i === 0 ? 0 : TRANSITION_AT[i - 1];
  const stageEnd = TRANSITION_AT[i];

  if (p <= stageStart) return 1;
  if (p >= stageEnd) return SCALE_RATIOS[i]; // already transitioned away

  const t = (p - stageStart) / (stageEnd - stageStart);
  return 1 + (SCALE_RATIOS[i] - 1) * smootherstep(t);
}

interface SVGScrollBackgroundProps {
  scrollProgress?: MotionValue<number>;
}

const SVGScrollBackground = ({ scrollProgress }: SVGScrollBackgroundProps) => {
  const fallbackProgress = useMotionValue(0);
  const activeProgress = scrollProgress ?? fallbackProgress;
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Non-blocking preload — prevents the first scroll from stalling on a cold cache.
  useEffect(() => {
    LAYERS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Drive opacity and scale directly via DOM style — no React re-renders.
  // useMotionValueEvent is rAF-synced so no extra throttling is needed.
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
            // Layer 0 starts fully visible; all others start hidden.
            opacity: i === 0 ? 1 : 0,
            transform: "scale(1)",
            willChange: "transform, opacity",
            // Zoom origin pinned to the geographic center (43.644075, -79.3654923).
            // All SVG exports are centred on this coordinate, so "50% 50%" is correct.
            transformOrigin: "50% 50%",
            // Higher-indexed layers sit on top, required for the stacking strategy.
            zIndex: i,
          }}
        />
      ))}
    </div>
  );
};

export default SVGScrollBackground;
