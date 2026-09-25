import { useEffect, type RefObject } from "react";
import {
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  type MotionValue,
  type UseScrollOptions,
} from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** framer's scroll offset: pairs of "<target edge> <viewport edge>". */
export type ScrollOffset = NonNullable<UseScrollOptions["offset"]>;

/**
 * Ready-made offsets for `useSectionProgress`.
 * - `through`: 0 as the element's top enters the bottom of the viewport,
 *   1 as its bottom leaves the top (the whole pass). Default.
 * - `enter`: 0 at the same start, 1 once its top reaches 30% down the viewport.
 *   Good for drawings that should be finished by the time you read them.
 * - `centre`: 0 at the same start, 1 when its centre meets the viewport centre.
 * - `pinned`: 0 to 1 while a tall section scrolls past a sticky stage
 *   (top at viewport top, to bottom at viewport bottom).
 */
export const SECTION_OFFSETS = {
  through: ["start end", "end start"],
  enter: ["start end", "start 0.3"],
  centre: ["start end", "center center"],
  pinned: ["start start", "end end"],
} satisfies Record<string, ScrollOffset>;

export interface SectionProgressOptions {
  /**
   * What the value does for reduced-motion visitors (after mount):
   * `"end"` holds it at 1 (drawings fully drawn, default), `"start"` holds it
   * at 0, `"live"` keeps following the scroll.
   */
  reducedMotion?: "end" | "start" | "live";
}

/**
 * Scroll progress (0..1) of an element through the viewport, as a framer
 * `MotionValue`. Feed it to `<DrawPath progress>`, `<WireSolid progress>`,
 * `useTransform`, or a `motion.*` style; never copy it into React state.
 * SSR-safe: it reads 0 on the server and on the first client render.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const progress = useSectionProgress(ref, SECTION_OFFSETS.enter);
 * <div ref={ref}><svg viewBox="0 0 400 200"><DrawPath d="M0 100 H400" progress={progress} /></svg></div>
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  offset: ScrollOffset = SECTION_OFFSETS.through,
  { reducedMotion = "end" }: SectionProgressOptions = {},
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const reduced = useReducedMotionSafe();
  const out = useMotionValue(0);

  const hold = reduced && reducedMotion !== "live" ? (reducedMotion === "end" ? 1 : 0) : null;

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    out.set(hold ?? v);
  });

  useEffect(() => {
    out.set(hold ?? scrollYProgress.get());
  }, [hold, out, scrollYProgress]);

  return out;
}

export default useSectionProgress;
