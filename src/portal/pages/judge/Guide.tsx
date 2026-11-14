// What judging looks like, in plain steps. Organizers get the whole picture
// (what judges see, what the tabs are for, what to press on the day);
// judges get a pointer to the practice entry until they've marked something.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { clock } from "../../api";

const SEEN = "mdc-guide-closed";

function readClosed() {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
}

function PracticeLink({ children = "Try the judge screen" }: { children?: string }) {
  return (
    <Link to="/judge/practice" className="btn-ghost p-btn p-btn-sm focus-ember shrink-0">
      {children} <ArrowRight size={15} strokeWidth={1.6} />
    </Link>
  );
}

export function OrganizerGuide({ marksCount, deadline }: { marksCount: boolean | undefined; deadline: string }) {
  const [open, setOpen] = useState(() => !readClosed());
  const toggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open;
    setOpen(isOpen);
    try {
      localStorage.setItem(SEEN, isOpen ? "0" : "1");
    } catch {
      /* fine */
    }
  };
  return (
    <details className="group mt-6 border border-bone/10 bg-[hsl(220_7%_5.5%)]" open={open} onToggle={toggle}>
      <summary className="focus-ember flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-body text-[15px] font-medium text-foreground marker:hidden">
        <span>
          <span className="text-ember">Organizer guide:</span> how judging works
        </span>
        <ChevronDown size={16} strokeWidth={1.5} className="text-concrete transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid gap-6 border-t border-bone/10 px-4 py-5 md:grid-cols-2">
        <div>
          <h2 className="font-body text-[15px] font-semibold text-bone">What a judge does</h2>
          <ol className="mt-3 flex flex-col gap-2.5 font-body text-[14px] leading-relaxed text-foreground/80">
            <li>
              <span className="p-mono mr-2 text-ember">1</span>Signs in here with their name and the judge passcode. They land on this page, with their
              pair's room in time order and a big <span className="text-foreground">Judge it</span> button. Search finds any team by name.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">2</span>On the entry: sees the team's pictures and model, reads their few words, and listens to the
              1-minute pitch. There's no timer on their screen; the room schedule (minutes per team, set in Settings) keeps time.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">3</span>For each of the 4 categories, taps the description that fits, then the points. Then{" "}
              <span className="text-foreground">Save and judge next</span>, which opens the next team in their room. An entry is done once both judges in the pair have marked it.
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PracticeLink>Try it as a judge</PracticeLink>
            <span className="font-body text-[13px] text-concrete">A made-up entry. Nothing is saved.</span>
          </div>
        </div>
        <div>
          <h2 className="font-body text-[15px] font-semibold text-bone">What you do on the day</h2>
          <ol className="mt-3 flex flex-col gap-2.5 font-body text-[14px] leading-relaxed text-foreground/80">
            <li>
              <span className="p-mono mr-2 text-ember">1</span>Before {clock(deadline)}: in <Link to="/judge/settings" className="p-link focus-ember">Settings</Link>,
              check the judges list and each pair's room, and paste the Google Sheet formula into a new sheet.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">2</span>At {clock(deadline)} the form locks (no late entries) and the schedule makes itself: every
              team sees its room and time.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">3</span>During judging: <Link to="/judge/live" className="p-link focus-ember">Live</Link> shows which
              entries still need marks. Each entry needs 2, one from each judge in its pair; then it's done.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">4</span>The final meeting: <Link to="/judge/top" className="p-link focus-ember">Top 5</Link> ranks by
              pair average. Set 1st to 3rd, write why each won, then copy or print it.
            </li>
          </ol>
          <p className="mt-4 font-body text-[13px] leading-relaxed text-concrete">
            You can open and mark any entry too.{" "}
            {marksCount === false
              ? "Your marks don't count in Results: only judges on the judges list do."
              : "Your marks count in Results, as one more judge."}
          </p>
        </div>
      </div>
    </details>
  );
}

/** For judges who haven't marked anything yet. */
export function JudgeTip() {
  return (
    <div className="mt-6 flex flex-col gap-3 border border-bone/10 bg-[hsl(220_7%_5.5%)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-body text-[14px] leading-relaxed text-foreground/80">
        <span className="text-foreground">How it works:</span> open a team, listen to their 1-minute pitch, tap a description and points for each of the 4
        categories, then save. First time? Try the practice entry.
      </p>
      <PracticeLink>Practice entry</PracticeLink>
    </div>
  );
}
