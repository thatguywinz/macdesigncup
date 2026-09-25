import type { CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/** Ruler ticks rising from a 1px baseline: 64px major, 32px mid, 8px minor. */
function ticks(ink: string, major: number, mid: number, minor: number): CSSProperties {
  return {
    backgroundImage: [
      `linear-gradient(to right, ${ink.replace("A", String(major))} 1px, transparent 1px)`,
      `linear-gradient(to right, ${ink.replace("A", String(mid))} 1px, transparent 1px)`,
      `linear-gradient(to right, ${ink.replace("A", String(minor))} 1px, transparent 1px)`,
      `linear-gradient(${ink.replace("A", String(major))}, ${ink.replace("A", String(major))})`,
    ].join(","),
    backgroundSize: "64px 7px, 32px 4px, 8px 2px, 100% 1px",
    backgroundPosition: "left bottom, left bottom, left bottom, left bottom",
    backgroundRepeat: "repeat-x, repeat-x, repeat-x, no-repeat",
  };
}

const BONE = ticks("hsl(var(--bone) / A)", 0.3, 0.2, 0.12);
const EMBER = ticks("hsl(var(--ember) / A)", 1, 0.85, 0.7);

/**
 * The nav's bottom edge: a drafting ruler that reads how far down the page
 * you are. Bone ticks along the whole width; the part you have scrolled past
 * is re-inked in ember, with a reading head at the leading edge.
 *
 * Transforms only: an overflow-clipped sleeve slides in from the left by
 * page progress while its content counter-slides, so the ember ticks stay
 * registered on the bone ones instead of being squashed by a scaleX.
 * Scroll-linked (it is feedback, not decoration), so it follows the scroll
 * for reduced-motion visitors too. SSR: progress 0. Position it from the
 * parent through `className` (e.g. `absolute inset-x-0 bottom-0`).
 */
export default function NavRuler({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const sleeve = useTransform(scrollYProgress, (v) => `${(Math.min(Math.max(v, 0), 1) - 1) * 100}%`);
  const counter = useTransform(scrollYProgress, (v) => `${(1 - Math.min(Math.max(v, 0), 1)) * 100}%`);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative h-[9px] overflow-hidden", className)}>
      <div className="absolute inset-0" style={BONE} />
      <motion.div className="absolute inset-0 overflow-hidden" style={{ x: sleeve }}>
        <motion.div className="absolute inset-0" style={{ ...EMBER, x: counter }} />
        {/* reading head */}
        <span className="absolute inset-y-0 right-0 w-px bg-ember" />
      </motion.div>
    </div>
  );
}
