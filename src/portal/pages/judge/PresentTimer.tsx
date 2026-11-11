// A stopwatch for a team's presentation at the judging table: pick the slot
// length, start, and it counts down, turns orange in the last 30 seconds and
// counts the overtime in red. Remembers the chosen length on this device.
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

const LENGTHS = [1, 2, 3] as const;
const KEY = "mdc-pitch-minutes";

function fmt(ms: number): string {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${neg ? "+" : ""}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PresentTimer() {
  const [minutes, setMinutes] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(KEY));
      return (LENGTHS as readonly number[]).includes(v) ? v : 1;
    } catch {
      return 1;
    }
  });
  // Elapsed time is kept as "banked" ms plus the running stretch since startedAt.
  const [banked, setBanked] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const t = window.setInterval(() => tick((n) => n + 1), 250);
    return () => window.clearInterval(t);
  }, [startedAt]);

  const elapsed = banked + (startedAt !== null ? Date.now() - startedAt : 0);
  const left = minutes * 60_000 - elapsed;
  const state = left < 0 ? "over" : left <= 30_000 && elapsed > 0 ? "low" : "ok";
  const running = startedAt !== null;

  const pick = (m: number) => {
    setMinutes(m);
    setBanked(0);
    setStartedAt(null);
    try {
      localStorage.setItem(KEY, String(m));
    } catch {
      /* fine */
    }
  };

  return (
    <div className="j-timer" data-state={state} role="timer" aria-label="Presentation timer">
      <span className="j-timer-time" aria-live="off">
        {fmt(left)}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          className={running ? "btn-ghost p-btn p-btn-sm" : "btn-portal p-btn p-btn-sm"}
          onClick={() => {
            if (running) {
              setBanked(elapsed);
              setStartedAt(null);
            } else setStartedAt(Date.now());
          }}
        >
          {running ? <Pause size={14} strokeWidth={1.8} /> : <Play size={14} strokeWidth={1.8} />}
          {running ? "Pause" : elapsed ? "Resume" : "Start"}
        </button>
        <button
          type="button"
          className="btn-ghost p-btn p-btn-sm"
          aria-label="Reset the timer"
          disabled={!elapsed && !running}
          onClick={() => {
            setBanked(0);
            setStartedAt(null);
          }}
        >
          <RotateCcw size={14} strokeWidth={1.6} />
        </button>
      </div>
      <div className="ml-auto flex items-center gap-1" role="group" aria-label="Presentation length">
        {LENGTHS.map((m) => (
          <button key={m} type="button" className="p-chip !min-h-8 !px-2.5 !text-[13px]" aria-pressed={minutes === m} onClick={() => pick(m)}>
            {m} min
          </button>
        ))}
      </div>
      {state === "over" && <span className="w-full font-body text-[13px] text-[hsl(6_90%_66%)]">Time's up.</span>}
    </div>
  );
}
