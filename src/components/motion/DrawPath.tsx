import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
  type SVGMotionProps,
} from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { DURATION, EASE, VIEWPORT_ONCE } from "./tokens";

type PassThrough = Omit<
  SVGMotionProps<SVGPathElement>,
  | "d"
  | "style"
  | "initial"
  | "animate"
  | "whileInView"
  | "viewport"
  | "transition"
  | "pathLength"
  | "strokeWidth"
  | "className"
  // Drawing works by dashing the stroke against a normalised pathLength;
  // non-scaling-stroke moves dashes into screen space and the line comes out
  // dashed instead of drawn. Draw in a viewBox at (roughly) pixel scale.
  | "vectorEffect"
>;

export interface DrawPathProps extends PassThrough {
  /** SVG path data. Render inside your own `<svg viewBox>`. */
  d: string;
  /** Scroll-scrubbed mode: a 0..1 MotionValue (e.g. from `useSectionProgress`).
   *  The stroke draws forward and un-draws backward with it. */
  progress?: MotionValue<number>;
  /** The slice of `progress` over which this path draws. Default `[0, 1]`.
   *  Give sibling paths staggered ranges to draw them in sequence. */
  range?: readonly [number, number];
  /** Without `progress`: draw once when scrolled into view (default `true`).
   *  `false` renders the path fully drawn, static. */
  inView?: boolean;
  /** Seconds, in-view mode only. Default `0`. */
  delay?: number;
  /** Seconds, in-view mode only. Default `1.4`. */
  duration?: number;
  /** In viewBox units. Default `1`. `vectorEffect` is not accepted (it breaks
   *  the draw), so size the viewBox near the rendered pixel size, or for a
   *  stretched straight rule use `preserveAspectRatio="none"` with the
   *  cross-axis at 1 unit = 1px. */
  strokeWidth?: number;
  /** Stroke colour comes from here: `draft-stroke`, `draft-stroke-faint`,
   *  `draft-stroke-strong`, `draft-stroke-ember`, or your own. Default `draft-stroke`. */
  className?: string;
}

/**
 * An SVG stroke that draws itself, either scrubbed by scroll progress or once
 * on view. Per-frame updates go through framer motion values (no React state).
 * Reduced motion: fully drawn after mount. No JS: `data-draw` lets the
 * noscript rule in index.html show the whole line.
 *
 * @example
 * <svg viewBox="0 0 600 40" className="w-full" aria-hidden="true">
 *   <DrawPath d="M0 20 H600" progress={progress} range={[0.1, 0.6]} className="draft-stroke-ember" />
 * </svg>
 */
export default function DrawPath({
  d,
  progress,
  range = [0, 1],
  inView = true,
  delay = 0,
  duration = DURATION.draw,
  strokeWidth = 1,
  className = "draft-stroke",
  ...rest
}: DrawPathProps) {
  const reduced = useReducedMotionSafe();

  // Hooks run unconditionally; the fallback source is simply never used when
  // there is no `progress`.
  const fallback = useMotionValue(0);
  const source = progress ?? fallback;
  const scrubbed = useTransform(source, [range[0], range[1]], [0, 1], { clamp: true });
  const length = useMotionValue(0);

  useMotionValueEvent(scrubbed, "change", (v) => {
    length.set(reduced ? 1 : v);
  });
  useEffect(() => {
    length.set(reduced ? 1 : scrubbed.get());
  }, [reduced, length, scrubbed]);

  if (progress) {
    return (
      <motion.path
        {...rest}
        d={d}
        data-draw=""
        className={className}
        strokeWidth={strokeWidth}
        fill="none"
        style={{ pathLength: length }}
      />
    );
  }

  if (!inView) {
    return (
      <motion.path {...rest} d={d} className={className} strokeWidth={strokeWidth} fill="none" />
    );
  }

  return (
    <motion.path
      {...rest}
      d={d}
      data-draw=""
      className={className}
      strokeWidth={strokeWidth}
      fill="none"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      animate={reduced ? { pathLength: 1 } : undefined}
      viewport={VIEWPORT_ONCE}
      transition={reduced ? { duration: 0 } : { duration, ease: EASE, delay }}
    />
  );
}
