import { useEffect } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Grid drift per px scrolled. The grid reads as a far plane behind the page. */
const PARALLAX = 0.06;
/** Must equal the major grid pitch in `.draft-grid`, so the wrap is seamless. */
const MAJOR = 64;

export interface BlueprintBackdropProps {
  /** Also render the site's film-grain overlay (the one layer that sits
   *  above content, at 5% overlay blend). Default `true`. */
  grain?: boolean;
  className?: string;
}

/**
 * The drafting hall's wall: a fixed, full-viewport two-level drafting grid
 * (8px minor, 64px major, bone at 2 to 5%) faded out toward the edges, that
 * drifts up slightly slower than the page scrolls. Render it once per page,
 * first inside the page wrapper; `main` (`relative z-10`) and every section
 * paint over it. `aria-hidden`, no pointer events, transform-only motion,
 * static for reduced motion.
 *
 * @example
 * <div className="relative min-h-screen bg-background">
 *   <BlueprintBackdrop />
 *   <SiteNav />
 *   <main id="main" className="relative z-10">…</main>
 * </div>
 */
export default function BlueprintBackdrop({ grain = true, className }: BlueprintBackdropProps) {
  const reduced = useReducedMotionSafe();
  const { scrollY } = useScroll();
  const y = useMotionValue(0);

  const offset = (v: number) => (reduced ? 0 : -((v * PARALLAX) % MAJOR));
  useMotionValueEvent(scrollY, "change", (v) => y.set(offset(v)));
  useEffect(() => {
    y.set(offset(scrollY.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("draft-grid-fade pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
      >
        {/* One major pitch taller than the viewport, so the drift never shows an edge. */}
        <motion.div
          className="draft-grid absolute inset-x-0 top-0 [--draft-grid-minor:0.016] md:[--draft-grid-minor:0.022]"
          style={{ y, height: `calc(100% + ${MAJOR}px)` }}
        />
      </div>
      {grain && <div className="grain-overlay" aria-hidden="true" />}
    </>
  );
}
