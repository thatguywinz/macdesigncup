import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import { DURATION, EASE, VIEWPORT_ONCE } from "@/components/motion/tokens";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

// Working times; `min` is each block's length, which sizes it on the day bar.
const SCHEDULE = [
  { time: "8:00 AM", title: "Partner check-in and setup", min: 60 },
  { time: "9:00 AM", title: "Opening ceremony", min: 30 },
  { time: "9:30 AM", title: "Design session I", min: 150, design: true },
  { time: "12:00 PM", title: "Lunch for speakers, mentors, judges", min: 60 },
  { time: "1:00 PM", title: "Design session II", min: 90, design: true },
  { time: "2:30 PM", title: "Judging and presentations", min: 60 },
  { time: "3:30 PM", title: "Closing and awards", min: 30 },
] as const;
const END = "4:00 PM";

/**
 * The day as one drafted strip, 8:00 AM to 4:00 PM. From md each block is
 * sized by its length (design sessions in ember, the rest hatched) with its
 * start time and title under it; phones read the same list down a rail.
 * The list itself is the schedule (no table repeating it).
 */
export default function EventScheduleSection() {
  const reduced = useReducedMotionSafe();
  return (
    <Sheet id="schedule" eyebrow="The day">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <DisplayHeading lines={["Event schedule."]} outline="schedule." />
        <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-concrete">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45 border border-ember" />
          Working times · Nov 16
        </p>
      </div>

      <div className="relative mt-8 md:mt-14">
      <motion.ol
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
              key={row.time}
              style={{ flexGrow: row.min, flexBasis: 0 }}
              className="relative grid min-w-0 grid-cols-[4.75rem_12px_minmax(0,1fr)] gap-x-4 md:block"
            >
              <p className="py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ember md:hidden">{row.time}</p>
              {/* The block: a rail segment on phones, the bar from md. */}
              <motion.span
                aria-hidden="true"
                data-reveal=""
                className={cn(
                  "block origin-top border-foreground/25 max-md:border-x md:h-11 md:origin-left md:border-y md:border-l",
                  i === SCHEDULE.length - 1 && "md:border-r",
                  i === SCHEDULE.length - 1 && "max-md:border-b",
                  "max-md:border-t",
                  design ? "bg-ember/75" : "draft-hatch",
                )}
                initial={{ scale: 0.001 }}
                whileInView={{ scale: 1 }}
                animate={reduced ? { scale: 1 } : undefined}
                viewport={VIEWPORT_ONCE}
                transition={reduced ? { duration: 0 } : { duration: DURATION.draw * 0.5, ease: EASE, delay: 0.1 + i * 0.1 }}
              />
              <div className="py-2.5 md:py-0 md:pr-3 md:pt-3">
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-ember md:block">{row.time}</p>
                <p
                  className={cn(
                    "font-display text-[1.05rem] uppercase leading-[1.05] md:mt-1.5 md:text-[0.95rem] lg:text-[1.1rem] xl:text-[1.25rem]",
                    design ? "text-foreground" : "text-foreground/85",
                  )}
                >
                  {row.title}
                </p>
              </div>
            </li>
          );
        })}
      </motion.ol>
      {/* The day's end: over the bar's right end from md, under the rail on phones. */}
      <p className="mt-2 grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-4 font-mono text-[11px] uppercase tracking-[0.12em] text-concrete md:absolute md:right-0 md:top-0 md:mt-0 md:block md:-translate-y-[calc(100%+0.5rem)] md:text-[10px]">
        {END}
        <span className="md:hidden">End of day</span>
      </p>
      </div>
    </Sheet>
  );
}
