import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { SUBMIT_DEADLINE } from "@/config/site";
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
const TARGET = new Date(SUBMIT_DEADLINE).getTime();

/**
 * The submission clock: "Submissions close in" and the deadline ("Mon, Nov
 * 16, 1:30 PM") over four plain figures, counting down to SUBMIT_DEADLINE.
 * Once the deadline has passed it says submissions are closed instead of
 * showing zeros.
 *
 * SSR-safe: the server and the first client render show `--` in every cell;
 * the clock reads `Date.now()` only after mount. Reduced motion drops the
 * seconds cell from the first paint (CSS `motion-reduce:`) and ticks every
 * 30s instead of every second.
 */
export default function Countdown({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  const reduced = useReducedMotionSafe();
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => {
      const r = remaining(TARGET);
      setLeft(r);
      return r.done;
    };
    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, reduced ? 30_000 : 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const live = hydrated && left;

  if (live && left.done) {
    return (
      <aside className={cn("relative", className)} aria-label={C.aria}>
        <p className="font-body text-2xl font-semibold tracking-[-0.01em] text-foreground md:text-[2rem]">{C.done}</p>
        <p className="mt-2 font-body text-sm text-concrete">{C.doneWhen}</p>
      </aside>
    );
  }

  const cells = [
    { key: "days", value: live ? pad(left.days) : "--", label: C.units.days },
    { key: "hours", value: live ? pad(left.hours) : "--", label: C.units.hours },
    { key: "mins", value: live ? pad(left.mins) : "--", label: C.units.mins },
    { key: "secs", value: live ? pad(left.secs) : "--", label: C.units.secs },
  ];

  return (
    <aside className={cn("relative", className)} aria-label={C.aria}>
      <p className="font-body text-sm text-concrete">{C.until}</p>
      <p className="mt-1 font-body text-lg font-medium text-foreground">{C.when}</p>
      <div role="timer" className="mt-3 flex gap-7 md:gap-9">
        {cells.map((c) => (
          <div
            key={c.key}
            // No display class here: motion-reduce:hidden must win.
            className={cn("min-w-[2.75rem] md:min-w-[3.5rem]", c.key === "secs" && "motion-reduce:hidden")}
          >
            <span className="block font-body text-[2.25rem] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground md:text-[3rem]">
              {c.value}
            </span>
            <span className="mt-2 block font-body text-xs text-concrete">{c.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
