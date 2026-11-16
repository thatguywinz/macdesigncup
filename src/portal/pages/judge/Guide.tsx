// What judging looks like, in plain steps. Organizers get the whole picture
// (what judges see, what the tabs are for, what to press on the day);
// judges get a pointer to the practice entry until they've marked something.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { clock } from "../../api";

// Closed by default (one line); remembered open once an organizer opens it.
const OPEN = "mdc-guide-open";

function readOpen() {
  try {
    return localStorage.getItem(OPEN) === "1";
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
  const [open, setOpen] = useState(readOpen);
  const toggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open;
    setOpen(isOpen);
    try {
      localStorage.setItem(OPEN, isOpen ? "1" : "0");
    } catch {
      /* fine */
    }
  };
  return (
    <details className="group mt-4 border border-bone/10 bg-[hsl(220_7%_5.5%)]" open={open} onToggle={toggle}>
      <summary className="focus-ember flex cursor-pointer list-none items-center gap-2 px-4 py-2 font-body text-[14px] font-medium text-foreground/85 marker:hidden">
        How judging works
        <ChevronDown size={15} strokeWidth={1.5} className="-rotate-90 text-concrete transition-transform group-open:rotate-0" aria-hidden="true" />
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
              <span className="p-mono mr-2 text-ember">1</span>At {clock(deadline)} the form locks (no late entries) and every submitted team gets a
              room and time by itself.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">2</span>
              <Link to="/judge/schedule" className="p-link focus-ember">Schedule</Link>: press Big screen to put every team's room and time on the
              projector, or download it as a spreadsheet. Teams also see theirs at macdesigncup.ca/submit.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">3</span>During judging, each team needs 2 marks, one from each judge in its room.
            </li>
            <li>
              <span className="p-mono mr-2 text-ember">4</span>
              <Link to="/judge/results" className="p-link focus-ember">Leaderboard</Link>: every team ranked by its two judges' average.
            </li>
          </ol>
          <p className="mt-4 font-body text-[13px] leading-relaxed text-concrete">
            You can open and mark any entry too.{" "}
            {marksCount === false
              ? "Your marks don't count on the leaderboard: only the judges do."
              : "Your marks count on the leaderboard, as one more judge."}
          </p>
        </div>
      </div>
    </details>
  );
}

/** For judges who haven't marked anything yet. */
export function JudgeTip() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-bone/10 bg-[hsl(220_7%_5.5%)] px-4 py-2">
      <p className="font-body text-[14px] text-foreground/80">
        <span className="text-foreground">First time?</span> Open a team, listen to the pitch, mark the 4 categories, save.
      </p>
      <PracticeLink>Practice entry</PracticeLink>
    </div>
  );
}
