import { useEffect, useState } from "react";
import CropMarks from "@/components/blueprint/CropMarks";
import { useHydrated } from "@/hooks/useHydrated";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { EVENT_DATE, EVENT_DATE_LABEL } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

const C = SECTIONS.glance.countdown;

interface Remaining {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  done: boolean;
}

function remaining(target: number): Remaining {
  const d = Math.max(0, target - Date.now());
  return {
    days: Math.floor(d / 86_400_000),
    hours: Math.floor(d / 3_600_000) % 24,
    mins: Math.floor(d / 60_000) % 60,
    secs: Math.floor(d / 1_000) % 60,
    done: d === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const TARGET = EVENT_DATE ? new Date(EVENT_DATE).getTime() : null;

/**
 * The launch clock, drawn as a small drafting plate: crop marks, an ember
 * seam, one mono label ("Until we start") and Anton figures. Counts down to EVENT_DATE; while the
 * date is unset it shows the "date drops soon" state instead of a deadline.
 *
 * SSR-safe: the server and the first client render show `--` in every cell;
 * the clock reads `Date.now()` only after mount. Reduced motion drops the
 * seconds cell from the first paint (CSS `motion-reduce:`) and ticks every
 * 30s instead of every second.
 *
 * Used on the home page (At a glance) and on /partner. At a glance passes
 * `showDate={false}`: its spec strip already carries the date and start time.
 *
 * Phones get one compact plate: each figure carries its unit on its own
 * baseline.
 */
export default function Countdown({
  className = "",
  showDate = true,
}: {
  className?: string;
  showDate?: boolean;
}) {
  const hydrated = useHydrated();
  const reduced = useReducedMotionSafe();
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!TARGET) return;
    setLeft(remaining(TARGET));
    const id = setInterval(
      () => setLeft(remaining(TARGET)),
      reduced ? 30_000 : 1000,
    );
    return () => clearInterval(id);
  }, [reduced]);

  const live = hydrated && left;
  const cells = [
    { key: "days", value: live ? pad(left.days) : "--", label: C.units.days },
    {
      key: "hours",
      value: live ? pad(left.hours) : "--",
      label: C.units.hours,
    },
    { key: "mins", value: live ? pad(left.mins) : "--", label: C.units.mins },
    { key: "secs", value: live ? pad(left.secs) : "--", label: C.units.secs },
  ];

  return (
    <aside
      className={cn(
        "relative border border-bone/15 bg-background/70 px-4 pb-3 pt-3.5 md:px-7 md:pb-6 md:pt-7",
        className,
      )}
      aria-label={C.aria}
    >
      <CropMarks inset={-9} />
      {/* ember seam along the top edge */}
      <span
        className="ember-rule absolute inset-x-0 top-0 opacity-70"
        aria-hidden="true"
      />

      {TARGET && (
        <p className="flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.9)] animate-[blink_1.8s_ease-in-out_infinite] motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-ember">
            {live && left.done ? C.done : C.until}
          </span>
        </p>
      )}

      {TARGET ? (
        <>
          {showDate && (
            <p className="mt-3 block font-display text-[1.35rem] uppercase leading-none text-foreground md:mt-4 md:text-[1.5rem]">
              {EVENT_DATE_LABEL}
            </p>
          )}

          {/* The figures: hairline-ruled cells with a tick at each seam. */}
          <div
            role="timer"
            className="relative mt-3 grid grid-cols-4 border-y border-bone/15 motion-reduce:grid-cols-3 md:mt-6"
          >
            {cells.map((c, i) => (
              <div
                key={c.key}
                className={cn(
                  // Phones: figure and unit on one baseline. From md: stacked. (No
                  // display class from md: motion-reduce:hidden must win.)
                  "relative flex items-baseline justify-center gap-1.5 px-1 py-2.5 text-center md:flex-col md:items-center md:gap-0 md:px-2 md:py-4",
                  i > 0 && "border-l border-bone/15",
                  c.key === "secs" && "motion-reduce:hidden",
                )}
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-px -top-[5px] h-[9px] w-px bg-ember/70"
                  />
                )}
                <span className="block font-display text-[1.75rem] leading-none tabular-nums text-foreground md:text-[2.4rem]">
                  {c.value}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-concrete md:mt-2.5 md:tracking-[0.28em]">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 font-display text-[2rem] uppercase leading-[0.95] text-foreground">
          {C.tba[0]}
          <span className="wire-text-ember block">{C.tba[1]}</span>
        </p>
      )}
    </aside>
  );
}
