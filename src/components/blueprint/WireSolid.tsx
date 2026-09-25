import { useEffect, useMemo, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useSectionProgress } from "@/components/motion/useSectionProgress";
import Dimension from "./Dimension";
import { getSolid, projectSolid, VIEW_EXTENT, type WireShape } from "./wireGeometry";

export type { WireShape } from "./wireGeometry";

export interface WireSolidProps {
  shape: WireShape;
  /** Box edge: a number is px, a string is any CSS length (`"100%"`,
   *  `"clamp(120px, 16vw, 240px)"`). Default `160`. */
  size?: number | string;
  /** What turns it: scroll progress, a slow idle drift, or both (default). */
  spin?: "scroll" | "time" | "both";
  /** External 0..1 progress. Default: the solid's own pass through the viewport. */
  progress?: MotionValue<number>;
  /** Turns of yaw over progress 0 to 1. Default `0.5`. */
  turns?: number;
  /** Resting orientation in radians, `[yaw, pitch]`. Default `[0.62, 0.5]`
   *  (a three-quarter view from slightly above). */
  pose?: readonly [number, number];
  /** Draw the shape's accent edge (or rim) in ember. Default `false`. */
  accent?: boolean;
  /** Edges behind the solid: dashed like a technical drawing (default),
   *  solid like a plain wireframe, or left out. */
  hidden?: "dashed" | "solid" | "none";
  /** Show below `md` too. Default `false` (it is desktop decoration). */
  mobile?: boolean;
  /** Optional dimension line under the solid, e.g. `"Ø 240"`, `"1:1"`, so it
   *  reads as a drafted figure rather than a floating ornament. */
  label?: string;
  /** Line ink: set `--wire-a` (default 0.16) or `color` via classes. */
  className?: string;
}

/** Radians per second of idle yaw: one lazy turn every ~2 minutes. */
const IDLE_SPEED = 0.05;

/**
 * A line-drawn 3D solid, rotated and perspective-projected in JS and written
 * to SVG path `d` attributes through refs (no React state per frame). Visible
 * edges in 1px bone at low opacity, hidden edges dashed and fainter, an
 * optional ember accent edge. Yaw follows scroll progress plus a slow idle
 * drift that only runs while it is on screen. Reduced motion: a still drawing
 * in its resting pose. Decorative: `aria-hidden`, no pointer events, hidden
 * below `md` unless `mobile`.
 *
 * @example
 * <WireSolid shape="icosahedron" size={220} accent className="absolute right-10 top-24" />
 */
export default function WireSolid({
  shape,
  size = 160,
  spin = "both",
  progress,
  turns = 0.5,
  pose = [0.62, 0.5],
  accent = false,
  hidden = "dashed",
  mobile = false,
  label,
  className,
}: WireSolidProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<SVGPathElement>(null);
  const hiddenRef = useRef<SVGPathElement>(null);
  const accentRef = useRef<SVGPathElement>(null);

  const reduced = useReducedMotionSafe();
  const own = useSectionProgress(boxRef, undefined, { reducedMotion: "start" });
  const source = progress ?? own;

  const solid = getSolid(shape);
  const [baseYaw, basePitch] = pose;
  const scrollOn = spin !== "time" && !reduced;
  const idleOn = spin !== "scroll" && !reduced;

  // The resting drawing, computed during render: identical on server and client.
  const rest = useMemo(() => projectSolid(solid, baseYaw, basePitch), [solid, baseYaw, basePitch]);

  // Live pose, kept outside React.
  const live = useRef({ p: 0, t: 0 });

  const draw = useRef<() => void>(() => {});
  draw.current = () => {
    const { p, t } = live.current;
    const yaw = baseYaw + (scrollOn ? p * turns * Math.PI * 2 : 0) + (idleOn ? t * IDLE_SPEED : 0);
    const pitch = basePitch + (scrollOn ? (p - 0.5) * 0.3 : 0);
    const paths = projectSolid(solid, yaw, pitch);
    visibleRef.current?.setAttribute("d", paths.visible);
    hiddenRef.current?.setAttribute("d", paths.hidden);
    accentRef.current?.setAttribute("d", paths.accent);
  };

  useMotionValueEvent(source, "change", (v) => {
    live.current.p = v;
    if (scrollOn) draw.current();
  });

  // Re-sync when the mode changes (e.g. reduced motion arrives after mount).
  useEffect(() => {
    live.current.p = source.get();
    draw.current();
  }, [source, scrollOn, idleOn, solid, baseYaw, basePitch, turns]);

  // Idle drift: a rAF loop that only runs while the solid is on screen.
  useEffect(() => {
    if (!idleOn) return;
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (last) live.current.t += Math.min(now - last, 64) / 1000;
      last = now;
      draw.current();
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(tick);
        }
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [idleOn]);

  const box = typeof size === "number" ? `${size}px` : size;
  const vb = `${-VIEW_EXTENT} ${-VIEW_EXTENT} ${VIEW_EXTENT * 2} ${VIEW_EXTENT * 2}`;

  return (
    <div
      aria-hidden="true"
      className={cn("wire-solid pointer-events-none select-none", !mobile && "hidden md:block", className)}
      style={{ width: box }}
    >
      <div ref={boxRef} style={{ width: box, height: box }}>
        <svg viewBox={vb} width="100%" height="100%" overflow="visible" focusable="false">
          {hidden !== "none" && (
            <path
              ref={hiddenRef}
              d={rest.hidden}
              className={cn("wire-solid-hidden", hidden === "dashed" && "wire-solid-dashed")}
              vectorEffect="non-scaling-stroke"
            />
          )}
          <path ref={visibleRef} d={rest.visible} className="wire-solid-edge" vectorEffect="non-scaling-stroke" />
          <path
            ref={accentRef}
            d={rest.accent}
            className={accent ? "wire-solid-accent" : "wire-solid-edge"}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {label && <Dimension label={label} length="72%" className="mx-auto mt-2" />}
    </div>
  );
}
