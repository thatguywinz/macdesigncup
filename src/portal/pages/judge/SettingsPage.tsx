// Organizers: the day's switches. The entry code (to put on the slide after
// the theme reveal), the deadline (move or extend it), and a close switch.
import { useEffect, useState } from "react";
import { ApiError, api, when } from "../../api";
import { JudgeShell, useMe } from "./context";
import { RevealInput, SpecSection } from "./specSettings";
import RoomsSection, { type RoomsSettings } from "./RoomsSection";
import type { Spec } from "../../shared/checks";

interface Settings {
  entryCode: string;
  configuredDeadline: string;
  deadlineOverride: string | null;
  deadline: string;
  closed: boolean;
  judges: string[];
  revealAt: string;
  spec: Spec | null;
  publicListing: "off" | "all" | "selected";
  entryCodeOn: boolean;
  opensAt: string | null;
  rooms: RoomsSettings;
  scheduled: number;
  scheduleEnds: string | null;
  open: boolean;
  graceSeconds: number;
  autoScheduledAt: string | null;
  sheetPath: string;
  storage: string;
  devDefaults: boolean;
}

const NL = "\n";

/** ISO -> value for <input type="datetime-local"> in this browser's time zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SettingsPage() {
  const { signOut } = useMe();
  const [s, setS] = useState<Settings | null>(null);
  const [deadline, setDeadline] = useState("");
  const [judges, setJudges] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Settings>("/judge/settings")
      .then((r) => {
        setS(r);
        setDeadline(toLocalInput(r.deadline));
        setJudges(r.judges.join(NL));
      })
      .catch((e: ApiError) => (e.status === 401 ? signOut() : setError(e.message)));
  }, [signOut]);

  async function put(body: Record<string, unknown>, msg: string) {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const r = await api<Settings>("/judge/settings", { method: "PUT", body });
      setS(r);
      setDeadline(toLocalInput(r.deadline));
      setJudges(r.judges.join(NL));
      setSaved(msg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(""), 3500);
    return () => window.clearTimeout(t);
  }, [saved]);

  async function schedule(action: "make" | "clear") {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const r = await api<Settings>("/judge/schedule", { body: { action } });
      setS(r);
      setSaved(action === "make" ? `Schedule ready: ${r.scheduled} ${r.scheduled === 1 ? "entry" : "entries"}.` : "Schedule cleared.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <JudgeShell section="Settings">
      <p
        role="status"
        className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 border border-ember/60 bg-background px-4 py-2.5 font-body text-sm text-foreground shadow-lg transition-opacity ${saved ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {saved}
      </p>
      <div className="max-w-[46rem] pt-10 md:pt-12">
        <h1 className="display-scene">Settings</h1>
        {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}
        {!s ? (
          <p className="mt-10 font-body text-concrete" role="status">
            {error ? "" : "Loading…"}
          </p>
        ) : (
          <div className="mt-8 flex flex-col">
            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Entry code</h2>
              <p className="p-hint mt-1 max-w-[38rem]">
                A code on the slide after the theme reveal keeps anyone outside the room from submitting. Without it, the form opens to anyone at the theme
                reveal time (set below).
              </p>
              <div className="mt-4 flex flex-col gap-2 font-body text-[15px] text-foreground/90">
                {(
                  [
                    [true, "Teams type the entry code", "Safer: only people in the room can start an entry."],
                    [false, "No entry code", `Easier: the form opens to anyone at ${when(s.revealAt)}.`],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={label} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="entryCodeOn"
                      className="mt-1 h-4 w-4 accent-[hsl(24_100%_54%)]"
                      checked={s.entryCodeOn === value}
                      disabled={busy}
                      onChange={() => put({ entryCodeOn: value }, value ? "Teams need the entry code." : "No entry code needed.")}
                    />
                    <span>
                      {label}
                      <span className="p-hint block">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {s.entryCodeOn ? (
                <>
                  <p className="mt-5 font-display text-[clamp(2.5rem,2rem+3vw,4.5rem)] uppercase leading-none tracking-[0.04em] text-bone">{s.entryCode}</p>
                  <p className="p-hint mt-2">Set in the deployment's environment (PORTAL_ENTRY_CODE).</p>
                </>
              ) : (
                s.opensAt && <p className="p-notice p-notice--calm mt-5 font-body text-sm">The form opens {when(s.opensAt)}. Move the theme reveal time to open it sooner.</p>
              )}
            </section>

            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Submissions</h2>
              <p className="mt-2 font-body text-[15px] text-foreground/85">
                {s.open ? "Open" : "Closed"} · close {when(s.deadline)}
                {s.deadlineOverride ? " (moved from the default)" : ""}
              </p>
              <p className="p-hint mt-1">No late submissions: the form locks at the deadline exactly, even mid-upload. Teams see a countdown on the form.</p>
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="p-label">Deadline</span>
                  <input type="datetime-local" className="p-input mt-2 w-auto" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
                <button
                  type="button"
                  className="btn-ghost p-btn"
                  disabled={busy || !deadline}
                  onClick={() => put({ deadlineOverride: new Date(deadline).toISOString() }, "Deadline saved.")}
                >
                  Save deadline
                </button>
                {s.deadlineOverride && (
                  <button type="button" className="btn-ghost p-btn" disabled={busy} onClick={() => put({ deadlineOverride: null }, "Back to the default deadline.")}>
                    Use default ({when(s.configuredDeadline)})
                  </button>
                )}
              </div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 font-body text-[15px] text-foreground/90">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(24_100%_54%)]" checked={s.closed} disabled={busy} onChange={(e) => put({ closed: e.target.checked }, e.target.checked ? "Submissions closed." : "Submissions reopened.")} />
                <span>
                  Close submissions now
                  <span className="p-hint block">Stops new entries and edits right away, whatever the clock says.</span>
                </span>
              </label>
            </section>

            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Public submissions page</h2>
              <p className="p-hint mt-1 max-w-[38rem]">
                What <span className="p-mono">macdesigncup.ca/submissions</span> shows: each entry's video, 3D model and description. Scores, notes and contact details are never
                public. Entries whose team turned off public viewing, or that you hid, never appear.
              </p>
              <div className="mt-4 flex flex-col gap-2 font-body text-[15px] text-foreground/90">
                {(
                  [
                    ["off", "Off", "The page says submissions aren't public yet."],
                    ["all", "Every submitted entry", "Good once judging is done."],
                    ["selected", "Only the ones I pick", "Tick \"Pick for the public page\" on an entry to add it."],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="publicListing"
                      className="mt-1 h-4 w-4 accent-[hsl(24_100%_54%)]"
                      checked={s.publicListing === value}
                      disabled={busy}
                      onChange={() => put({ publicListing: value }, "Public page updated.")}
                    />
                    <span>
                      {label}
                      <span className="p-hint block">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              <a href="/submissions" target="_blank" rel="noopener" className="p-link focus-ember mt-4 inline-block font-body text-sm">
                Open the public page
              </a>
            </section>

            <SpecSection settings={s} busy={busy} onSave={put} />

            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Theme reveal</h2>
              <p className="p-hint mt-1 max-w-[38rem]">
                Model files that say they were created before this time are flagged for review (with two hours of slack for clocks). Default: the 9:10 AM opening.
              </p>
              <RevealInput value={s.revealAt} busy={busy} onSave={(v) => put({ revealAt: v }, "Reveal time saved.")} />
            </section>

            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Judges</h2>
              <p className="p-hint mt-1 max-w-[38rem]">
                One name per line, the way each judge will type it. Once there are names here, only these people can sign in as judges and only their marks count
                in the results. Leave it empty to let anyone with the judge passcode in.
              </p>
              <textarea
                className="p-textarea mt-4 max-w-[26rem]"
                rows={6}
                value={judges}
                onChange={(e) => setJudges(e.target.value)}
                aria-label="Judges, one per line"
              />
              <div className="mt-3">
                <button
                  type="button"
                  className="btn-ghost p-btn"
                  disabled={busy}
                  onClick={() => put({ judges: judges.split(NL).map((n) => n.trim()).filter(Boolean) }, "Judges list saved.")}
                >
                  Save judges
                </button>
              </div>
              <p className="p-hint mt-3">{s.judges.length ? `${s.judges.length} on the list.` : "No list: anyone with the judge passcode can sign in."}</p>
            </section>

            <RoomsSection rooms={s.rooms} judges={s.judges} scheduled={s.scheduled} scheduleEnds={s.scheduleEnds} open={s.open} busy={busy} onSave={put} onSchedule={schedule} />

            <SheetSection path={s.sheetPath} />


            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Storage</h2>
              <p className="mt-2 font-body text-[15px] text-foreground/85">
                {s.storage === "blob" ? "Vercel Blob (private store)" : "This computer (.data/portal). Local preview only."}
              </p>
              {s.devDefaults && <p className="p-notice mt-4 font-body text-sm">Running with the local preview passcodes. The deployed site refuses to start without real ones.</p>}
            </section>
          </div>
        )}
      </div>
    </JudgeShell>
  );
}

/** The live Google Sheet: IMPORTDATA of a secret CSV link (schedule, pairs, marks, ranking; no emails). */
function SheetSection({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;
  const formula = `=IMPORTDATA("${url}")`;
  const copy = () =>
    navigator.clipboard
      .writeText(formula)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  return (
    <section className="border-t border-bone/10 py-7">
      <h2 className="p-block-title">Google Sheet</h2>
      <p className="p-hint mt-1 max-w-[38rem]">
        A live sheet of every submission: time, room, judging pair, team, members, marks in, pair average and rank. Make a new Google Sheet, paste this
        into cell A1, and it fills itself (Google refreshes it about every hour; reopen the sheet to refresh sooner). No contact emails. Keep the link
        private: anyone with it can see team names.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input className="p-input p-mono min-w-0 flex-1 text-[13px]" readOnly value={formula} onFocus={(e) => e.currentTarget.select()} aria-label="Formula for cell A1" />
        <button type="button" className="btn-ghost p-btn shrink-0" onClick={copy}>
          {copied ? "Copied" : "Copy formula"}
        </button>
      </div>
      <a href={path} className="p-link focus-ember mt-3 inline-block font-body text-sm" download="mdc-2026-schedule.csv">
        Or download it as a CSV
      </a>
    </section>
  );
}
