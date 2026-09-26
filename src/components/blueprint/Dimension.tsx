import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { DURATION, EASE, VIEWPORT_ONCE } from "@/components/motion/tokens";

export interface DimensionProps {
  /** The label in the break of the line, e.g. `"Ø 64"`, `"1:1"`, `"420"`, `"1st place"`. */
  label: string;
  /** Default `"horizontal"`. A vertical label reads bottom to top. */
  orientation?: "horizontal" | "vertical";
  /** Span of the dimension: a number is px, a string any CSS length. Default `"100%"`. */
  length?: number | string;
  /** Bone hairline (default) or the ember accent. */
  tone?: "bone" | "ember";
  /** Draw the two half-lines out from the label once in view. Default `true`. */
  draw?: boolean;
  className?: string;
}

/**
 * A CAD dimension: end ticks with architectural 45deg slashes, a hairline,
 * and a mono label sitting in a break at the centre. Decorative
 * (`aria-hidden`): never put information only here. Styles are the global
 * `.dim*` classes in index.css.
 *
 * @example
 * <Dimension label="Ø 64" length={240} />
 * <Dimension orientation="vertical" label="420" length="100%" className="absolute -left-8 inset-y-0" />
 */
export default function Dimension({
  label,
  orientation = "horizontal",
  length = "100%",
  tone = "bone",
  draw = true,
  className,
}: DimensionProps) {
  const reduced = useReducedMotionSafe();
  const vertical = orientation === "vertical";
  const len = typeof length === "number" ? `${length}px` : length;
  const axis = vertical ? "scaleY" : "scaleX";

  const half = (side: "a" | "b") => {
    // Each half grows away from the label toward its end tick.
    const origin = vertical
      ? { originY: side === "a" ? 1 : 0 }
      : { originX: side === "a" ? 1 : 0 };
    if (!draw) return <span className="dim-line" />;
    return (
      <m.span
        className="dim-line"
        data-reveal=""
        style={origin}
        initial={{ [axis]: 0 }}
        whileInView={{ [axis]: 1 }}
        animate={reduced ? { [axis]: 1 } : undefined}
        viewport={VIEWPORT_ONCE}
        transition={reduced ? { duration: 0 } : { duration: DURATION.draw * 0.7, ease: EASE, delay: 0.15 }}
      />
    );
  };

  return (
    <div
      aria-hidden="true"
      className={cn("dim", vertical && "dim--v", tone === "ember" && "dim--ember", className)}
      style={vertical ? { height: len } : { width: len }}
    >
      <span className="dim-end dim-end--a" />
      {half("a")}
      <span className="dim-label">{label}</span>
      {half("b")}
      <span className="dim-end dim-end--b" />
    </div>
  );
}
