// Organizers: the day's switches. The entry code (to put on the slide after
// the theme reveal), the deadline (move or extend it), and a close switch.
import { useEffect, useState } from "react";
import { ApiError, api, when } from "../../api";
import { JudgeShell, useMe } from "./context";
import { RevealInput, SpecSection } from "./specSettings";
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
  open: boolean;
  graceSeconds: number;
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

  return (
    <JudgeShell section="Settings">
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
              <p className="p-hint mt-1">Teams type this to submit. Put it on the slide after the theme reveal. It's set in the deployment's environment (PORTAL_ENTRY_CODE).</p>
              <p className="mt-4 font-display text-[clamp(2.5rem,2rem+3vw,4.5rem)] uppercase leading-none tracking-[0.04em] text-bone">{s.entryCode}</p>
            </section>

            <section className="border-t border-bone/10 py-7">
              <h2 className="p-block-title">Submissions</h2>
              <p className="mt-2 font-body text-[15px] text-foreground/85">
                {s.open ? "Open" : "Closed"} · close {when(s.deadline)}
                {s.deadlineOverride ? " (moved from the default)" : ""}
              </p>
              <p className="p-hint mt-1">
                A team mid-upload at the deadline gets {Math.round(s.graceSeconds / 60)} more minutes to finish; those entries are flagged late.
              </p>
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
              {saved && (
                <p className="mt-4 font-body text-sm text-ember" role="status">
                  {saved}
                </p>
              )}
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
