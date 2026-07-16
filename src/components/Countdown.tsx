import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { EVENT_DATE, MODEL_NO } from "@/config/site";

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

/**
 * Launch-clock placard. Counts down to EVENT_DATE; until the date is locked
 * in, it runs the "date drops soon" state instead of inventing a deadline.
 */
export default function Countdown({ className = "" }: { className?: string }) {
  const reduced = !!useReducedMotion();
  const target = EVENT_DATE ? new Date(EVENT_DATE).getTime() : null;
  const [left, setLeft] = useState<Remaining | null>(target ? remaining(target) : null);

  // Reduced motion: no per-second churn — drop the seconds cell and tick slowly.
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setLeft(remaining(target)), reduced ? 30_000 : 1000);
    return () => clearInterval(id);
  }, [target, reduced]);

  return (
    <aside className={`concrete-panel relative p-6 md:p-7 ${className}`} aria-label="Countdown to event day">
      {/* ember seam along the top edge */}
      <span className="ember-rule absolute inset-x-0 top-0 opacity-60" aria-hidden="true" />

      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.9)] animate-[blink_1.8s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">T-minus</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete/70">{MODEL_NO}</span>
      </div>

      {target && left ? (
        <>
          <div className={`mt-5 grid gap-2 text-center ${reduced ? "grid-cols-3" : "grid-cols-4"}`}>
            {(
              [
                [left.days, "days"],
                [left.hours, "hrs"],
                [left.mins, "min"],
                ...(reduced ? [] : [[left.secs, "sec"] as const]),
              ] as ReadonlyArray<readonly [number, string]>
            ).map(([v, label]) => (
              <div key={label} className="border border-line bg-background/40 px-1 py-3">
                <div className="font-display text-3xl leading-none text-foreground md:text-4xl">{pad(v)}</div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-concrete">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.26em] text-concrete">
            {left.done ? "Doors are open." : "Until doors open"}
          </p>
        </>
      ) : (
        <div className="mt-5">
          <div className="font-display text-3xl uppercase leading-[0.95] text-foreground md:text-4xl">
            Date drops
            <span className="wire-text-ember block">soon.</span>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.26em] text-foreground/80">
          Registration open
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.26em] text-ember">
          Limited spots
        </p>
      </div>
    </aside>
  );
}
