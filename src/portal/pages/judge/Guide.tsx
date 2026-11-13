// What judging looks like, in plain steps. Organizers get the whole picture
// (what judges see, what the tabs are for, what to press on the day);
// judges get a pointer to the practice entry until they've marked something.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

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

export function OrganizerGuide({ marksCount }: { marksCount: boolean | undefined }) {
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
              room's teams in time order and a big <span className="text-foreground">Judge it</span> button.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">2</span>On the entry: sees the team's pictures and model, reads their few words, and listens to the
              1-minute pitch. There's no timer on their screen; the room schedule (3 minutes a team) keeps time.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">3</span>For each of the 4 categories, taps the description that fits, then the points. Then{" "}
              <span className="text-foreground">Save and judge next</span>, which opens the next team in their room.
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
              <span className="p-mono mr-2 text-ember">1</span>Before 2:00 PM: in <Link to="/judge/settings" className="p-link focus-ember">Settings</Link>,
              check the judges list and who sits in which room.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">2</span>After submissions close at 2:00: in Settings, press{" "}
              <span className="text-foreground">Make the schedule</span>. Every team then sees its room and time.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">3</span>During judging: <Link to="/judge/live" className="p-link focus-ember">Live</Link> shows who
              has marked what and which entries nobody has reached.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">4</span>After: <Link to="/judge/results" className="p-link focus-ember">Results</Link> has the
              ranking (average of the judges' totals) and the CSV.
            </li>
          </ol>
          <p className="mt-4 font-body text-[13px] leading-relaxed text-concrete">
            You can open and mark any entry too.{" "}
            {marksCount === false
              ? "Your marks don't count in Results: only judges on the judges list do."
              : "With no judges list set, your marks count as one more judge."}
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
