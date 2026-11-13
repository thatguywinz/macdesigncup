// A countdown to the submission deadline that stays under the header while a
// team scrolls the form. The deadline comes from the server (so an organizer
// extending it moves this too) and `now` is corrected to the server's clock,
// so a laptop with the wrong time still sees the real countdown.
import { clock, when } from "../api";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function DeadlineBar({ deadline, now }: { deadline: string; now: number }) {
  const at = Date.parse(deadline);
  const left = at - now;
  const closed = left <= 0;
  const state = closed || left < 5 * 60e3 ? "urgent" : left < 30 * 60e3 ? "soon" : undefined;
  const { d, h, m, s } = parts(left);
  const sameDay = left < 24 * 3600e3;

  const units: [string, string][] = [
    ...(d ? ([[String(d), d === 1 ? "day" : "days"]] as [string, string][]) : []),
    [pad(h), "hrs"],
    [pad(m), "min"],
    [pad(s), "sec"],
  ];

  return (
    <div className="p-deadline -mx-4 px-4 md:-mx-8 md:px-8" data-state={state}>
      <div className="flex items-center justify-between gap-4 py-2.5">
        <div className="min-w-0">
          <p className="font-body text-[13px] font-medium text-foreground/90 sm:text-sm">{closed ? "Submissions are closed" : "Submissions close in"}</p>
          <p className="truncate font-body text-[12px] text-concrete sm:text-[13px]">
            {closed ? `They closed at ${clock(deadline)}.` : sameDay ? `Today at ${clock(deadline)}` : when(deadline)}
            {!closed && left < 30 * 60e3 && <span className="text-ember"> · finish and press Submit entry</span>}
          </p>
        </div>
        {!closed && (
          <div className="flex shrink-0 items-end gap-2 sm:gap-3" role="timer" aria-live="off" aria-label={`Submissions close at ${clock(deadline)}`}>
            {units.map(([v, u], i) => (
              <div key={u} className="flex items-end gap-2 sm:gap-3">
                {i > (d ? 1 : 0) && (
                  <span className="p-deadline-time pb-[0.9rem] text-concrete" aria-hidden="true">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className="p-deadline-time">{v}</span>
                  <span className="p-deadline-unit">{u}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
