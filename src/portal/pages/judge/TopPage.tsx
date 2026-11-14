// Organizers: the top 5 for the 15-minute final meeting. Ranked by each
// entry's pair average (MARKS_NEEDED marks each); the top 3 get a place and a
// written "why they won", saved as they type, then copied or printed as the
// meeting's record.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Copy, Printer, RefreshCw } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import { AWARDS, type Criterion } from "../../shared/judging";
import type { MemberInput, Slot } from "../../shared/schema";
import { JudgeShell, useMe } from "./context";

interface Row {
  id: string;
  title: string;
  teamName: string;
  creditLine: string;
  members: MemberInput[];
  thumb: string | null;
  award: string;
  average: number | null;
  perCriterion: Record<string, number | null>;
  marks: { judge: string; total: number }[];
  notes: { judge: string; notes: string }[];
  judgeCount: number;
  pair: string[];
  rank: number | null;
  tied: boolean;
  complete: boolean;
  openReviews: number;
  slot: Slot | null;
  why: string;
}

interface Results {
  criteria: Criterion[];
  maxTotal: number;
  rows: Row[];
  marksNeeded: number;
  topCount: number;
}

const PLACES = ["1st place", "2nd place", "3rd place"];
const f1 = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toFixed(1));
const teamOf = (r: Row) => r.teamName || r.creditLine;

export default function TopPage() {
  const { signOut } = useMe();
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [why, setWhy] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [copied, setCopied] = useState(false);
  const timers = useRef<Record<string, number>>({});

  const load = useCallback(
    () =>
      api<Results>("/judge/results")
        .then((d) => {
          setData(d);
          setError("");
          // Server notes fill in only what hasn't been typed here.
          setWhy((cur) => {
            const next = { ...cur };
            for (const r of d.rows) if (!(r.id in next)) next[r.id] = r.why;
            return next;
          });
        })
        .catch((e: ApiError) => (e.status === 401 ? signOut() : setError(e.message))),
    [signOut],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const saveWhy = (id: string, text: string) => {
    setWhy((w) => ({ ...w, [id]: text }));
    setSaved((s) => ({ ...s, [id]: "saving" }));
    window.clearTimeout(timers.current[id]);
    timers.current[id] = window.setTimeout(() => {
      api(`/judge/final/${id}`, { method: "PUT", body: { why: text } })
        .then(() => setSaved((s) => ({ ...s, [id]: "saved" })))
        .catch(() => setSaved((s) => ({ ...s, [id]: "error" })));
    }, 700);
  };

  const setAward = (id: string, award: string) =>
    api(`/judge/entries/${id}`, { method: "PATCH", body: { award } })
      .then(() => setData((d) => (d ? { ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, award } : r)) } : d)))
      .catch((e: ApiError) => setError(e.message));

  const ranked = data?.rows.filter((r) => r.rank !== null) ?? [];
  const top = ranked.filter((r) => (r.rank ?? 99) <= (data?.topCount ?? 5));
  const incomplete = data?.rows.filter((r) => !r.complete).length ?? 0;
  const total = data?.rows.length ?? 0;
  const tieAtTop = top.some((r) => r.tied && (r.rank ?? 99) <= 3);

  const summary = () => {
    if (!data) return "";
    const lines = [`Mackenzie Design Cup 2026: final results`, `Ranked by each entry's judging-pair average, out of ${data.maxTotal}.`, ""];
    top.forEach((r) => {
      lines.push(`${r.award || `#${r.rank}`}: ${teamOf(r)}, "${r.title}" (${r.members.map((m) => m.name).join(", ")}). Average ${f1(r.average)}${r.tied ? " (tied)" : ""}.`);
      const w = (why[r.id] ?? "").trim();
      if (w) lines.push(`Why: ${w}`);
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const copy = () =>
    navigator.clipboard
      .writeText(summary())
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setError("Couldn't copy. Select the text in the printout instead."));

  return (
    <JudgeShell section="Top 5">
      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Top 5</h1>
          <p className="mt-3 max-w-[42rem] font-body text-[15px] text-foreground/75">
            Ranked by each entry's judging-pair average. For the final meeting: check the order, pick 1st to 3rd, and write down why each one won.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" className="btn-ghost p-btn focus-ember" onClick={() => void load()}>
            <RefreshCw size={15} strokeWidth={1.5} /> Refresh
          </button>
          <button type="button" className="btn-ghost p-btn focus-ember" onClick={copy} disabled={!top.length}>
            <Copy size={15} strokeWidth={1.5} /> {copied ? "Copied" : "Copy summary"}
          </button>
          <button type="button" className="btn-ghost p-btn focus-ember" onClick={() => window.print()} disabled={!top.length}>
            <Printer size={15} strokeWidth={1.5} /> Print
          </button>
        </div>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}

      {data && total > 0 && (
        <p className={`p-notice mt-6 font-body text-sm ${incomplete ? "" : "p-notice--calm"}`}>
          {incomplete
            ? `Not final yet: ${incomplete} of ${total} ${total === 1 ? "entry needs" : "entries need"} ${data.marksNeeded} marks. The order can still change.`
            : `Every entry has its ${data.marksNeeded} marks. This order is final unless a mark changes.`}
          {tieAtTop && " There's a tie in the top 3: Ms. Neag breaks it. Set the places below."}
        </p>
      )}

      {!data ? (
        <p className="mt-12 font-body text-concrete" role="status">
          {error ? "" : "Loading…"}
        </p>
      ) : top.length === 0 ? (
        <p className="mt-12 max-w-[34rem] font-body text-foreground/75">
          No marked entries yet. The ranking fills in as judging pairs save their marks.
        </p>
      ) : (
        <ol className="mt-8 flex flex-col gap-4">
          {top.map((r) => {
            const podium = (r.rank ?? 99) <= 3;
            return (
              <li key={r.id} className={`j-top ${podium ? "j-top--podium" : ""}`}>
                <div className="j-top-rank" aria-label={`Rank ${r.rank}`}>
                  {r.rank}
                </div>
                <div className="j-top-body">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {r.thumb && <img src={r.thumb} alt="" className="h-24 w-full rounded-[2px] object-cover sm:h-20 sm:w-32 sm:shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-[13px] text-ember">{teamOf(r)}</p>
                      <h2 className="font-body normal-case text-[20px] font-semibold leading-snug tracking-[-0.01em] text-bone">{r.title}</h2>
                      <p className="mt-0.5 font-body text-sm text-foreground/75">
                        {r.members.map((m) => m.name).join(", ")} · {[...new Set(r.members.map((m) => m.school))].join(", ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.tied && <span className="p-tag p-tag--ember">Tied</span>}
                        {!r.complete && <span className="p-tag p-tag--bad">{r.judgeCount} of {data.marksNeeded} marks</span>}
                        {r.openReviews > 0 && <span className="p-tag p-tag--ember">Needs review</span>}
                        {r.slot && (
                          <span className="p-tag p-mono">
                            {r.slot.room} · {clock(r.slot.at)}
                          </span>
                        )}
                        {r.award && <span className="p-tag p-tag--solid">{r.award}</span>}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-display text-[40px] leading-none text-bone">{f1(r.average)}</p>
                      <p className="p-mono mt-1 text-[11px] text-concrete">pair average /{data.maxTotal}</p>
                    </div>
                  </div>

                  <dl className="j-top-grid mt-4">
                    {data.criteria.map((c) => (
                      <div key={c.id}>
                        <dt>{c.label}</dt>
                        <dd>{f1(r.perCriterion[c.id])}</dd>
                      </div>
                    ))}
                    {r.marks.map((m) => (
                      <div key={m.judge}>
                        <dt>{m.judge}</dt>
                        <dd>{m.total}</dd>
                      </div>
                    ))}
                  </dl>

                  {r.notes.length > 0 && (
                    <details className="mt-3 font-body text-sm">
                      <summary className="cursor-pointer text-concrete hover:text-foreground">Judges' notes ({r.notes.length})</summary>
                      <ul className="mt-2 flex flex-col gap-2">
                        {r.notes.map((n, k) => (
                          <li key={k}>
                            <span className="text-concrete">{n.judge}: </span>
                            <span className="whitespace-pre-line text-foreground/85">{n.notes}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {podium && (
                    <div className="mt-4 grid gap-3 border-t border-bone/10 pt-4 md:grid-cols-[12rem_1fr]">
                      <label className="flex flex-col gap-1.5">
                        <span className="font-body text-[13px] font-medium text-foreground/85">Place</span>
                        <select className="p-input" value={r.award} onChange={(e) => void setAward(r.id, e.target.value)}>
                          <option value="">Not set</option>
                          {AWARDS.filter(Boolean).map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                        {!r.award && (
                          <button
                            type="button"
                            className="p-link focus-ember self-start font-body text-[13px] print:hidden"
                            onClick={() => void setAward(r.id, PLACES[(r.rank ?? 1) - 1])}
                          >
                            Set as {PLACES[(r.rank ?? 1) - 1]}
                          </button>
                        )}
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="flex items-baseline justify-between gap-3 font-body text-[13px] font-medium text-foreground/85">
                          Why they won
                          <span className="p-mono text-[11px] font-normal text-concrete" aria-live="polite">
                            {saved[r.id] === "saving" ? "Saving…" : saved[r.id] === "saved" ? "Saved" : saved[r.id] === "error" ? "Not saved, try again" : ""}
                          </span>
                        </span>
                        <textarea
                          className="p-textarea !min-h-[5.5rem]"
                          value={why[r.id] ?? ""}
                          maxLength={2000}
                          placeholder="What set it apart: the idea, the modelling, the pitch…"
                          onChange={(e) => saveWhy(r.id, e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  <Link to={`/judge/entry/${r.id}`} className="p-link focus-ember mt-3 inline-flex items-center gap-1 font-body text-sm print:hidden">
                    Open the entry <ArrowUpRight size={14} strokeWidth={1.6} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {data && ranked.length > top.length && (
        <p className="mt-8 font-body text-sm text-concrete print:hidden">
          {ranked.length - top.length} more ranked {ranked.length - top.length === 1 ? "entry" : "entries"} in{" "}
          <Link to="/judge/results" className="p-link focus-ember">
            Results
          </Link>
          .
        </p>
      )}
    </JudgeShell>
  );
}
