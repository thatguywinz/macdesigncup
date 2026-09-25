import { useEffect, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import { useSectionProgress, type ScrollOffset } from "@/components/motion/useSectionProgress";
import { CTA, SECTIONS } from "@/content/copy";
import { VENUE_MAP_URL } from "@/config/site";
import { keepTimes } from "./day/nbsp";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import BringGlyph from "./day/BringGlyph";
import CupFigure from "./day/CupFigure";
import { CUP_NOSCRIPT_CSS } from "./day/cupGeometry";
import CupFrame from "./day/CupFrame";

/** 0 when the step list's top meets the reading line (60% down the viewport),
 *  1 when its bottom does: step k is the one crossing the line over
 *  [k/5, (k+1)/5]. The rows are equal height (auto-rows-fr), so that holds
 *  exactly. The line sits a little below centre so the last stage finishes
 *  while the drawing is still stuck in place (see the column's -mb below). */
const STEPS_OFFSET: ScrollOffset = ["start 0.6", "end 0.6"];
/** The blank sheet draws as the row scrolls in. */
const SHEET_OFFSET: ScrollOffset = ["start end", "start 0.35"];
const DESKTOP = "(min-width: 1024px)";

/** The rail between waypoint k and k+1, filling in ember as step k scrolls past (desktop). */
function RailSegment({ progress, index, count }: { progress: MotionValue<number>; index: number; count: number }) {
  const fill = useTransform(progress, [index / count, (index + 1) / count], [0, 1]);
  return (
    <span aria-hidden="true" className="relative mt-2 hidden w-px flex-1 bg-bone/15 lg:block">
      <motion.span data-reveal="" className="absolute inset-0 origin-top bg-ember/80" style={{ scaleY: fill }} />
    </span>
  );
}

/**
 * The day. Desktop (lg+, motion OK): scrollytelling. A drafting sheet
 * sticks on the left while the five steps scroll past on the right, and one
 * design object, the cup, evolves with them: blank file, sketch, wireframe,
 * render, big screen. The active step lights its waypoint and the rail fills.
 * Phones and tablets: no sticky; each step carries its own small frame of the
 * drawing in a compact storyboard timeline. Desktop with reduced motion: the
 * finished drawing stays beside the (compact) steps, with nothing scrubbed.
 * Then the Bring list. #why and #timeline alias here.
 */
export default function DaySection() {
  const s = SECTIONS.day;
  const count = s.steps.length;
  const rowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const progress = useSectionProgress(listRef, STEPS_OFFSET);
  const enter = useSectionProgress(rowRef, SHEET_OFFSET);
  const reduced = useReducedMotionSafe();

  // Mark each step past / active / future while the scrollytelling runs.
  // Written straight to the DOM when the active step changes (never per frame).
  // Without JS, on phones and for reduced motion there is no attribute and
  // every step shows at full strength.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const els = stepRefs.current;
    let current = -1;
    const clear = () => {
      els.forEach((el) => el?.removeAttribute("data-phase"));
      current = -1;
    };
    const apply = (v: number) => {
      if (!mq.matches || reduced) {
        if (current !== -1) clear();
        return;
      }
      const idx = Math.min(count - 1, Math.max(0, Math.floor(v * count)));
      if (idx === current) return;
      current = idx;
      els.forEach((el, i) =>
        el?.setAttribute("data-phase", i < idx ? "past" : i === idx ? "active" : "future"),
      );
    };
    const onMq = () => apply(progress.get());
    apply(progress.get());
    const stop = progress.on("change", apply);
    mq.addEventListener?.("change", onMq);
    return () => {
      stop();
      mq.removeEventListener?.("change", onMq);
      clear();
    };
  }, [progress, reduced, count]);

  return (
    <Sheet id="day" aria-labelledby="day-title">
      {/* Old links (#why, #timeline) land exactly where #day does: the spans
          sit at the sheet's top edge, one section padding above the container. */}
      <span id="why" className="anchor-alias absolute left-0 -top-14 md:-top-24 xl:-top-28" aria-hidden="true" />
      <span id="timeline" className="anchor-alias absolute left-0 -top-14 md:-top-24 xl:-top-28" aria-hidden="true" />
      <div
        ref={rowRef}
        className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20"
      >
        {/* The drawing: sticky beside the steps on desktop. The column runs
            down through the sheet's bottom padding (-mb matches Sheet's
            md:py-24 / xl:py-28), so the drawing holds still until the story
            ends yet can never reach the next section. A negative margin does
            not grow the grid row. */}
        <div className="hidden lg:-mb-24 lg:block xl:-mb-28">
          <div className="sticky top-[calc(var(--nav-h)+1.25rem)]">
            <div style={{ width: "min(100%, calc((100svh - var(--nav-h) - 2.75rem) * 0.8667))" }}>
              <CupFigure progress={progress} enter={enter} />
              <noscript dangerouslySetInnerHTML={{ __html: `<style>${CUP_NOSCRIPT_CSS}</style>` }} />
            </div>
          </div>
        </div>

        <div>
          {/* The heading sits beside the drawing, so the sheet is already stuck
              in place by the time the first step reaches the centre line. */}
          <DisplayHeading id="day-title" lines={s.lines} className="mb-8 md:mb-12 lg:mb-10" />
          {/* Desktop: five equal rows (the tallest step sets them), each about
              one and a half wheel notches of scroll, so every stage change
              still gets its beat. Phones: a compact storyboard, one small frame
              of the drawing per step. */}
          <ol ref={listRef} className="relative lg:grid lg:auto-rows-fr">
            {s.steps.map((step, i) => (
              <li
                key={step.title}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="group grid grid-cols-[5.25rem_minmax(0,1fr)] gap-x-5 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-8 lg:min-h-[max(12vh,7rem)] lg:grid-cols-[1.5rem_minmax(0,1fr)] lg:gap-x-6 motion-reduce:lg:min-h-0"
              >
                {/* Phones and tablets: this step's frame of the drawing, joined to the next.
                    Desktop: the waypoint diamond and the rail to the next one. */}
                <div className="flex flex-col items-center">
                  <CupFrame stage={i as 0 | 1 | 2 | 3 | 4} width={84} className="w-[5.25rem] md:w-28 lg:hidden" />
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-[0.35rem] hidden h-[9px] w-[9px] shrink-0 rounded-full border border-ember bg-ember transition-[background-color,border-color] duration-500 group-data-[phase=future]:border-bone/35 group-data-[phase=future]:bg-background motion-reduce:transition-none lg:block"
                  />
                  {i < count - 1 && (
                    <>
                      <span aria-hidden="true" className="my-1.5 w-px flex-1 bg-bone/20 md:my-2 lg:hidden" />
                      <RailSegment progress={progress} index={i} count={count} />
                    </>
                  )}
                </div>

                <div className="pb-7 pt-1 md:pb-10 md:pt-1 lg:pb-5 lg:pt-0 motion-reduce:lg:pb-8">
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-ember transition-colors duration-500 motion-reduce:transition-none lg:group-data-[phase=future]:text-concrete">
                    {keepTimes(step.time)}
                  </p>
                  <h3 className="mt-1.5 font-body text-xl font-semibold leading-tight tracking-[-0.015em] text-foreground transition-opacity duration-500 motion-reduce:transition-none md:text-2xl lg:group-data-[phase=future]:opacity-45 lg:group-data-[phase=past]:opacity-70">
                    {step.title}
                  </h3>
                  {(step.note || step.map) && (
                    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-[15px] leading-snug text-foreground/75 md:mt-2 md:text-base lg:group-data-[phase=future]:opacity-60">
                      {step.note && <span>{keepTimes(step.note)}</span>}
                      {step.map && (
                        <a
                          href={VENUE_MAP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={SECTIONS.glance.mapLabel}
                          className="focus-ember text-sm text-ember underline decoration-ember/40 underline-offset-4 hover:decoration-ember"
                        >
                          {CTA.map}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Bring */}
          <div className="mt-2 md:pl-36 lg:mt-0 lg:pl-[3rem]">
            <h3 className="font-body text-sm font-medium text-concrete">{s.bring.title}</h3>
            {/* Glyph over label; from xl, where each cell has the room, beside it. */}
            <ul className="mt-3 grid max-w-xl grid-cols-3 gap-3 sm:gap-6 xl:gap-5">
              {s.bring.items.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-2 sm:flex-col sm:items-start md:gap-2.5 xl:flex-row xl:items-center xl:gap-3"
                >
                  <BringGlyph index={i} delay={0.12 * i} className="h-7 w-7 shrink-0 sm:h-9 sm:w-9 md:h-11 md:w-11 xl:h-10 xl:w-10" />
                  <span className="font-body text-sm leading-snug text-foreground/90 md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
