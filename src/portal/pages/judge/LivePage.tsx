// Organizers, on the day: the judging floor at a glance. Who has marked what
// (entries down the side, judges across the top), which entries nobody has
// reached yet, each judge's pace, and the running top five. Refreshes every
// 10 seconds while the tab is visible. "Hide scores" keeps the ranking off a
// projected screen.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import { useNow } from "../../hooks";
import { JudgeShell, useMe } from "./context";

interface Row {
  id: string;
  title: string;
  creditLine: string;
  late: boolean;
  award: string;
  average: number | null;
  byJudge: Record<string, number | null>;
  judgeCount: number;
  openReviews: number;
  submittedAt: string | null;
}

interface Live {
  maxTotal: number;
  rows: Row[];
  activity: { key: string; name: string; marked: number; lastAt: string | null }[];
  unlisted: { key: string; name: string; marked: number }[];
  drafts: number;
}

/** "just now", "4 min ago", "1 h 5 min ago". */
function ago(iso: string | null, now: number): string {
  if (!iso) return "not started";
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ${m % 60} min ago`;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const SCORES_KEY = "mdc-live-hide-scores";

export default function LivePage() {
  const { signOut } = useMe();
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(0);
  const [hideScores, setHideScores] = useState(() => {
    try {
      return localStorage.getItem(SCORES_KEY) === "1";
    } catch {
      return false;
    }
  });
  const now = useNow(15_000);

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      api<Live>("/judge/results")
        .then((d) => {
          if (!alive) return;
          setData(d);
          setUpdated(Date.now());
          setError("");
        })
        .catch((e: ApiError) => {
          if (e.status === 401) signOut();
          else if (alive) setError(e.message);
        });
    };
    load();
    const t = window.setInterval(load, 10_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [signOut]);

  const toggleScores = () =>
    setHideScores((v) => {
      try {
        localStorage.setItem(SCORES_KEY, v ? "0" : "1");
      } catch {
        /* fine */
      }
      return !v;
    });

  // Fewest marks first: the entries that need a judge sent to them.
  const coverage = useMemo(
    () => [...(data?.rows ?? [])].sort((a, b) => a.judgeCount - b.judgeCount || String(a.submittedAt).localeCompare(String(b.submittedAt))),
    [data],
  );
  const top = useMemo(() => (data?.rows ?? []).filter((r) => r.average !== null).slice(0, 5), [data]);

  const judges = data?.activity ?? [];
  const entries = data?.rows.length ?? 0;
  const marksIn = judges.reduce((n, j) => n + j.marked, 0);
  const unseen = data?.rows.filter((r) => r.judgeCount === 0).length ?? 0;
  const fullyCovered = data?.rows.filter((r) => judges.length > 0 && r.judgeCount >= Math.min(2, judges.length)).length ?? 0;

  return (
    <JudgeShell section="Live">
      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Judging, live</h1>
          <p className="mt-3 max-w-[42rem] font-body text-[15px] text-foreground/75">
            Who has marked what. Send free judges to the entries at the top of the list: they have the fewest marks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="p-mono text-[12px] text-concrete" aria-live="off">
            {updated ? `Updated ${clock(new Date(updated).toISOString())} · every 10 s` : ""}
          </span>
          <button type="button" className="btn-ghost p-btn p-btn-sm" onClick={toggleScores} aria-pressed={hideScores}>
            {hideScores ? <Eye size={15} strokeWidth={1.5} /> : <EyeOff size={15} strokeWidth={1.5} />}
            {hideScores ? "Show scores" : "Hide scores"}
          </button>
        </div>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}
      {!data ? (
        <p className="mt-12 font-body text-concrete" role="status">
          {error ? "" : "Loading…"}
        </p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 border-y border-bone/10 md:grid-cols-4">
            {(
              [
                ["Submitted", String(entries), data.drafts ? `${data.drafts} still drafting` : "none drafting"],
                ["Not judged yet", String(unseen), unseen ? "need a first look" : "every entry has a mark"],
                ["Judged twice or more", `${fullyCovered}/${entries}`, judges.length < 2 ? "needs 2+ judges" : "two opinions each"],
                ["Marks in", String(marksIn), `from ${judges.filter((j) => j.marked).length} of ${judges.length} judges`],
              ] as const
            ).map(([label, value, sub], i) => (
              <div key={label} className={`px-4 py-5 ${i % 2 ? "border-l border-bone/10" : ""} ${i > 1 ? "border-t border-bone/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
                <dt className="font-body text-[13px] text-concrete">{label}</dt>
                <dd className="mt-1 font-display text-[clamp(2rem,1.6rem+1.6vw,3rem)] leading-none text-bone">{value}</dd>
                <dd className="mt-1.5 font-body text-[13px] text-foreground/65">{sub}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section aria-labelledby="cov-h" className="min-w-0">
              <h2 id="cov-h" className="p-block-title">
                Who has marked what
              </h2>
              {entries === 0 ? (
                <p className="mt-4 font-body text-foreground/75">No entries yet. They show up here the moment a team submits.</p>
              ) : judges.length === 0 ? (
                <p className="mt-4 font-body text-foreground/75">No judges yet. Add them in Settings, or they appear here once they mark.</p>
              ) : (
                <div className="relative mt-4 overflow-x-auto">
                  <table className="j-table j-cover min-w-[560px]">
                    <thead>
                      <tr>
                        <th scope="col">Entry</th>
                        {judges.map((j) => (
                          <th key={j.key} scope="col" className="num" title={j.name}>
                            <abbr title={j.name} className="no-underline">
                              {initials(j.name)}
                            </abbr>
                          </th>
                        ))}
                        <th scope="col" className="num">
                          Marks
                        </th>
                        {!hideScores && (
                          <th scope="col" className="num">
                            Avg
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {coverage.map((r) => (
                        <tr key={r.id} data-unseen={r.judgeCount === 0 || undefined}>
                          <td>
                            <Link to={`/judge/entry/${r.id}`} className="focus-ember font-medium text-foreground hover:text-ember">
                              {r.title}
                            </Link>
                            <span className="ml-2 text-[13px] text-concrete">{r.creditLine}</span>
                            {r.late && <span className="p-tag p-tag--bad ml-2">Late</span>}
                            {r.openReviews > 0 && <span className="p-tag p-tag--ember ml-2">Needs review</span>}
                          </td>
                          {judges.map((j) => {
                            const v = r.byJudge[j.key];
                            const done = v !== undefined && v !== null;
                            return (
                              <td key={j.key} className="num">
                                <span className="j-dot" data-on={done || undefined} aria-label={`${j.name}: ${done ? (hideScores ? "marked" : `${v}`) : "not yet"}`}>
                                  {done && !hideScores ? v : ""}
                                </span>
                              </td>
                            );
                          })}
                          <td className={`num ${r.judgeCount === 0 ? "text-ember" : "text-foreground/85"}`}>{r.judgeCount}</td>
                          {!hideScores && <td className="num text-foreground">{r.average === null ? "—" : r.average.toFixed(1)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="flex flex-col gap-10">
              <section aria-labelledby="judges-h">
                <h2 id="judges-h" className="p-block-title">
                  Judges
                </h2>
                <ul className="mt-4 flex flex-col gap-4">
                  {judges.map((j) => {
                    const idle = j.lastAt ? now - Date.parse(j.lastAt) > 20 * 60 * 1000 : false;
                    return (
                      <li key={j.key}>
                        <div className="flex items-baseline justify-between gap-3 font-body text-[15px]">
                          <span className="truncate text-foreground">{j.name}</span>
                          <span className="p-mono shrink-0 text-[12px] text-foreground/80">
                            {j.marked}/{entries}
                          </span>
                        </div>
                        <div className="mt-1.5 h-[3px] w-full bg-bone/10" aria-hidden="true">
                          <div className="h-full bg-ember transition-[width] duration-500" style={{ width: entries ? `${(j.marked / entries) * 100}%` : 0 }} />
                        </div>
                        <p className={`mt-1 font-body text-[12px] ${idle ? "text-ember" : "text-concrete"}`}>
                          {j.lastAt ? `Last mark ${ago(j.lastAt, now)}` : "No marks yet"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                {data.unlisted.length > 0 && (
                  <p className="p-hint mt-4">Not on the judges list, not counted: {data.unlisted.map((u) => u.name).join(", ")}.</p>
                )}
              </section>

              {!hideScores && (
                <section aria-labelledby="top-h">
                  <h2 id="top-h" className="p-block-title">
                    Top five so far
                  </h2>
                  {top.length === 0 ? (
                    <p className="mt-4 font-body text-sm text-concrete">Nothing marked yet.</p>
                  ) : (
                    <ol className="mt-4 flex flex-col gap-3">
                      {top.map((r, i) => (
                        <li key={r.id} className="flex items-baseline gap-3 font-body">
                          <span className="p-mono w-5 shrink-0 text-concrete">{i + 1}</span>
                          <Link to={`/judge/entry/${r.id}`} className="focus-ember min-w-0 flex-1 truncate text-[15px] text-foreground hover:text-ember">
                            {r.title}
                          </Link>
                          <span className="p-mono shrink-0 text-sm text-foreground">
                            {r.average!.toFixed(1)}
                            <span className="text-concrete">/{data.maxTotal}</span>
                          </span>
                          <span className="p-mono shrink-0 text-[11px] text-concrete">×{r.judgeCount}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="p-hint mt-3">An average from one judge can swing; check the count beside it. Full table on Results.</p>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </JudgeShell>
  );
}
