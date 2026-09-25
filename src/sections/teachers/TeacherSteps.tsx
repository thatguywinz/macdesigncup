import { useRef } from "react";
import DrawPath from "@/components/motion/DrawPath";
import { useSectionProgress, type ScrollOffset } from "@/components/motion/useSectionProgress";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";
import { keepTimes } from "../day/nbsp";

/** The line starts drawing as the list's top clears the bottom tenth of the
 *  viewport and finishes as its bottom reaches 60% down. */
const OFFSET: ScrollOffset = ["start 0.9", "end 0.6"];
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The three things a teacher does, strung on one construction line that draws
 * with scroll: horizontal from `md`, vertical on phones. Compact: the wire
 * numeral sits on the title's baseline instead of above it. The waypoint for
 * the day itself (the last step) is set in ember.
 */
export default function TeacherSteps({ className }: { className?: string }) {
  const steps = SECTIONS.teachers.steps;
  const ref = useRef<HTMLOListElement>(null);
  const p = useSectionProgress(ref, OFFSET);

  return (
    <ol ref={ref} className={cn("relative grid gap-4 md:grid-cols-3 md:gap-8", className)}>
      {/* The construction line: horizontal (md+). 1 unit = 1px across the stroke. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[5px] hidden h-3 w-full overflow-visible md:block"
        viewBox="0 0 1000 12"
        preserveAspectRatio="none"
      >
        <DrawPath d="M0 6 H1000" progress={p} range={[0, 0.85]} className="stroke-bone/45" />
      </svg>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const span = 0.9 / (steps.length - 1);
        return (
          <li key={step.title} className="relative pl-8 md:pl-0 md:pt-9">
            {/* …and vertical on phones: one segment from this waypoint to the next
                (across the list gap, gap-4 = 1rem). An absolute SVG keeps its
                intrinsic height, so the wrapper carries the size. */}
            {!last && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[0.5px] top-[18px] h-[calc(100%+1rem-18px)] w-3 md:hidden"
              >
                <svg className="block h-full w-full overflow-visible" viewBox="0 0 12 1000" preserveAspectRatio="none">
                  <DrawPath d="M6 0 V1000" progress={p} range={[i * span, (i + 1) * span]} className="stroke-bone/45" />
                </svg>
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-[5px] block h-[13px] w-[13px] rotate-45 border bg-background",
                last ? "border-ember bg-ember" : "border-bone/70",
              )}
            />
            <div className="flex items-baseline gap-3">
              <p
                aria-hidden="true"
                className={cn(
                  "shrink-0 font-display text-[1.6rem] leading-none md:text-[2.4rem]",
                  last ? "wire-text-ember" : "wire-text",
                )}
              >
                {pad2(i + 1)}
              </p>
              <h3 className="min-w-0 font-display text-xl uppercase leading-[1.05] text-foreground md:min-h-[2.1em] md:text-[1.35rem] xl:text-[1.45rem]">
                {step.title}
              </h3>
            </div>
            <p className="mt-1.5 hidden max-w-sm text-pretty font-body text-sm font-light leading-normal text-concrete md:mt-3 md:block md:text-[15px] md:leading-relaxed">
              {keepTimes(step.desc)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
