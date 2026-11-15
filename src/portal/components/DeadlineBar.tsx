// A one-line countdown to the submission deadline, kept under the header on
// the submit form. The deadline comes from the server (so an organizer
// extending it moves this too) and `now` is corrected to the server's clock,
// so a laptop with the wrong time still sees the real countdown. It turns
// ember in the last 30 minutes and red in the last 5. Styles: submit.css.
import { clock, when } from "../api";

const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day in Toronto, where the event is: "2026-11-16". */
const torontoDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

export default function DeadlineBar({
  deadline,
  now,
  closed,
  reopened = false,
  wide = false,
}: {
  deadline: string;
  now: number;
  /** What the server says (organizers can close early). Defaults to "the deadline has passed". */
  closed?: boolean;
  /** Organizers reopened this entry after the deadline. */
  reopened?: boolean;
  /** Line up with a wide step below (the Files step with its 3D preview). */
  wide?: boolean;
}) {
  const at = Date.parse(deadline);
  const left = at - now;
  const isClosed = closed ?? left <= 0;
  // Past the deadline but still allowed to finish: the grace period for an
  // upload already running, or an entry the organizers reopened.
  const overtime = !isClosed && left <= 0;
  const state = isClosed || overtime || left < 5 * 60e3 ? "urgent" : left < 30 * 60e3 ? "soon" : undefined;

  const s = Math.max(0, Math.floor(left / 1000));
  const d = Math.floor(s / 86400);
  const time = `${d ? `${d}d ` : ""}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  const today = torontoDay(now) === torontoDay(at);

  const label = isClosed
    ? left > 0
      ? "Submissions were closed by the organizers"
      : `Submissions closed at ${clock(deadline)}`
    : overtime
      ? reopened
        ? "Reopened by the organizers: save your changes"
        : "Past the deadline: finish and press Submit now"
      : `Closes ${today ? clock(deadline) : when(deadline)}`;

  return (
    <div className="sf-clock" data-state={state}>
      <div className="sf-wrap sf-clock-in" data-wide={wide || undefined}>
        <p className="min-w-0 truncate">{label}</p>
        {!isClosed && !overtime && (
          <p className="shrink-0" role="timer" aria-live="off" aria-label={`Submissions close at ${clock(deadline)}`}>
            <span className="sf-clock-time">{time}</span> <span className="sf-clock-unit">left</span>
          </p>
        )}
      </div>
    </div>
  );
}
