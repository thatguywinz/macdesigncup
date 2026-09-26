import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import { DURATION, EASE, VIEWPORT_ONCE } from "@/components/motion/tokens";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { TIMES } from "@/config/site";

// Only the set times are printed (organizer, 2026-09-25): access from 8:00 AM,
// the start at 9:00 AM, done before 5:00 PM. The rest is TBA. `min` only sizes
// each block on the bar (equal-ish, since the real lengths aren't set).
const SCHEDULE = [
  { time: TIMES.access, title: "Partner access and setup", min: 60 },
  { time: TIMES.start, title: "Opening and theme", min: 60 },
  { time: "Morning", title: "Design sprint", min: 150, design: true },
  { time: TIMES.tba, title: "Lunch for speakers, mentors, judges", min: 60 },
  { time: TIMES.tba, title: "Judging and presentations", min: 70 },
  { time: TIMES.tba, title: "Closing and awards", min: 50 },
] as const;
const END = `Done before ${TIMES.end}`;

/**
 * The day as one drafted strip, 8:00 AM access to a finish before 5:00 PM. From md each block is
 * sized by its length (design sessions in ember, the rest in bone) with its
 * start time and title under it; phones read the same list down a rail.
 * The list itself is the schedule (no table repeating it).
 */
export default function EventScheduleSection() {
  const reduced = useReducedMotionSafe();
  return (
    <Sheet id="schedule">
      <DisplayHeading lines={["Schedule"]} />

      <div className="relative mt-8 md:mt-16">
      <m.ol
        data-reveal=""
        className="md:flex"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={reduced ? { opacity: 1 } : undefined}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: DURATION.reveal, ease: EASE }}
      >
        {SCHEDULE.map((row, i) => {
          const design = "design" in row;
          return (
            <li
              key={row.title}
              style={{ flexGrow: row.min, flexBasis: 0 }}
              className="relative grid min-w-0 grid-cols-[4.75rem_12px_minmax(0,1fr)] gap-x-4 md:block"
            >
              <p className="py-2.5 font-mono text-xs uppercase tracking-[0.06em] text-ember md:hidden">{row.time}</p>
              {/* The block: a rail segment on phones, the bar from md. */}
              <m.span
                aria-hidden="true"
                data-reveal=""
                className={cn(
                  "block origin-top max-md:w-[3px] md:h-2 md:origin-left md:border-r-2 md:border-background",
                  design ? "bg-ember" : "bg-bone/20",
                )}
                initial={{ scale: 0.001 }}
                whileInView={{ scale: 1 }}
                animate={reduced ? { scale: 1 } : undefined}
                viewport={VIEWPORT_ONCE}
                transition={reduced ? { duration: 0 } : { duration: DURATION.draw * 0.5, ease: EASE, delay: 0.1 + i * 0.1 }}
              />
              <div className="py-2.5 md:py-0 md:pr-3 md:pt-3">
                <p className="hidden font-mono text-xs uppercase tracking-[0.06em] text-ember md:block">{row.time}</p>
                <p
                  className={cn(
                    "font-body text-base font-medium leading-snug md:mt-1.5 md:text-[15px] xl:text-base",
                    design ? "text-foreground" : "text-foreground/85",
                  )}
                >
                  {row.title}
                </p>
              </div>
            </li>
          );
        })}
      </m.ol>
      {/* The day's end: over the bar's right end from md, under the rail on phones. */}
      <p className="mt-2 grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-4 font-mono text-xs uppercase tracking-[0.06em] text-concrete md:absolute md:right-0 md:top-0 md:mt-0 md:block md:-translate-y-[calc(100%+0.5rem)]">
        {END}
      </p>
      </div>
    </Sheet>
  );
}
