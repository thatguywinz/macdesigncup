// What happens after a team submits: the live presentation at judging, and
// the rubric judges score with. Shown on the form and on the "Submitted" page.
import { CalendarClock, Laptop, MessageSquare } from "lucide-react";
import { CRITERIA, MARK_MAX, MAX_TOTAL } from "../shared/judging";
import type { Slot } from "../shared/schema";
import { clock } from "../api";

export function JudgingBriefing({
  className = "",
  open = false,
  deadline,
  judging,
}: {
  className?: string;
  open?: boolean;
  /** The submission deadline from /api/portal/status, so the time here always matches the server's. */
  deadline?: string | null;
  /** When and where judging runs, from /api/portal/status. */
  judging?: { start: string; end: string; rooms: string[] } | null;
}) {
  const rooms = judging?.rooms.length ? judging.rooms : ["WFL632", "WFL634", "WFL637"];
  const roomList = rooms.length > 1 ? `${rooms.slice(0, -1).join(", ")} and ${rooms.at(-1)}` : rooms[0];
  return (
    <section aria-labelledby="brief-h" className={`max-w-[40rem] border border-bone/10 bg-[hsl(220_7%_5.5%)] p-5 ${className}`}>
      <h2 id="brief-h" className="font-body text-[17px] font-semibold tracking-[-0.01em] text-bone">
        Then you present: be ready
      </h2>
      <ul className="mt-4 flex flex-col gap-3 font-body text-[15px] leading-relaxed text-foreground/85">
        <li className="flex gap-3">
          <CalendarClock size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ember" aria-hidden="true" />
          <span>
            Judging runs{" "}
            <span className="text-foreground">{judging ? `${clock(judging.start).replace(/ PM$/, "")} to ${clock(judging.end)}` : "2:00 to 3:20 PM"}</span> in {roomList}. You get your room and time after
            submissions close{deadline ? ` at ${clock(deadline)}` : ""}. It shows on your entry's edit page too.
          </span>
        </li>
        <li className="flex gap-3">
          <Laptop size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ember" aria-hidden="true" />
          <span>
            You present from <span className="text-foreground">your own laptop</span>: have your model or render open and charged, with an HDMI or USB-C
            connection ready (no adapters are provided).
          </span>
        </li>
        <li className="flex gap-3">
          <MessageSquare size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ember" aria-hidden="true" />
          <span>
            A <span className="text-foreground">1-minute pitch</span>: what you made, how it fits the theme, and the detail you're proudest of. The judges
            then take a minute or two to score you while the next team sets up. Be at your room on time.
          </span>
        </li>
      </ul>
      <details className="group mt-4 border-t border-bone/10 pt-4" open={open || undefined}>
        <summary className="focus-ember cursor-pointer list-none font-body text-[15px] font-medium text-foreground marker:hidden">
          <span className="text-ember">How you're judged</span>
          <span className="ml-2 text-concrete">
            {CRITERIA.length} categories, {MARK_MAX} points each, out of {MAX_TOTAL}
          </span>
        </summary>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {CRITERIA.map((c) => (
            <li key={c.id}>
              <p className="flex items-baseline justify-between gap-2 font-body text-[15px] font-medium text-foreground">
                {c.label}
                <span className="p-mono text-[11px] text-concrete">/{MARK_MAX}</span>
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-foreground/70">
                <span className="text-foreground/90">Top marks:</span> {c.levels[3].text}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

/** "Your judging: WFL634 at 2:26 PM". */
export function SlotNotice({ slot }: { slot: Slot }) {
  return (
    <p className="mt-6 max-w-[40rem] border border-ember/60 bg-ember/10 px-4 py-3 font-body text-[15px] text-foreground" role="status">
      <span className="font-semibold">Your judging:</span> room <span className="p-mono text-ember">{slot.room}</span> at{" "}
      <span className="p-mono text-ember">{clock(slot.at)}</span>. Be there a few minutes early with your laptop ready.
    </p>
  );
}
