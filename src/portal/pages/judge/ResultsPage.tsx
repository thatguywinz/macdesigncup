// Organizers: entries ranked by average total across judges, the per-
// criterion averages, each judge's total and their notes. CSV for the
// awards table (it includes contact emails, so it stays organizer-only).
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Download } from "lucide-react";
import { ApiError, api } from "../../api";
import type { Criterion } from "../../shared/judging";
import type { MemberInput } from "../../shared/schema";
import { JudgeShell, useMe } from "./context";

interface Row {
  id: string;
  title: string;
  teamName: string;
  creditLine: string;
  members: MemberInput[];
  late: boolean;
  award: string;
  average: number | null;
  perCriterion: Record<string, number | null>;
  byJudge: Record<string, number | null>;
  notes: { judge: string; notes: string }[];
  judgeCount: number;
  openReviews: number;
  rank: number | null;
  tied: boolean;
  complete: boolean;
}

interface Results {
  criteria: Criterion[];
  maxTotal: number;
  judges: { key: string; name: string }[];
  unlisted: { key: string; name: string; marked: number }[];
  rows: Row[];
  marksNeeded: number;
}

export default function ResultsPage() {
  const { signOut } = useMe();
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      api<Results>("/judge/results")
        .then(setData)
        .catch((e: ApiError) => (e.status === 401 ? signOut() : setError(e.message)));
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [signOut]);

  const f1 = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toFixed(1));

  return (
    <JudgeShell section="Leaderboard">
      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Leaderboard</h1>
          <p className="mt-3 max-w-[40rem] font-body text-[15px] text-foreground/75">
            Every team, ranked by the average of its two judges' marks (out of {data?.maxTotal ?? 100}). A team is ranked once both judges in its room have marked it; teams with the same average share a place. Updates every 20 seconds.
          </p>
        </div>
        <a href="/api/portal/judge/export.csv" className="btn-ghost p-btn self-start focus-ember" download>
          <Download size={15} strokeWidth={1.5} /> Download spreadsheet
        </a>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}
      {data && <TopFive data={data} />}
      {data && data.unlisted.length > 0 && (
        <p className="p-notice mt-6 font-body text-sm">
          Not counted (not on the judges list): {data.unlisted.map((u) => `${u.name} (${u.marked} marked)`).join(", ")}. Add them in Settings if they're real judges.
        </p>
      )}
      {!data ? (
        <p className="mt-12 font-body text-concrete" role="status">
          {error ? "" : "Loading…"}
        </p>
      ) : data.rows.length === 0 ? (
        <p className="mt-12 font-body text-foreground/75">No submitted entries yet.</p>
      ) : (
        <div className="relative mt-8 overflow-x-auto">
          <table className="j-table md:min-w-[760px]">
            <thead>
              <tr>
                <th scope="col" className="num w-10">
                  #
                </th>
                <th scope="col">Entry</th>
                <th scope="col" className="num">
                  Average
                </th>
                {data.criteria.map((c) => (
                  <th key={c.id} scope="col" className="num hidden md:table-cell">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="num">
                  Marks
                </th>
                <th scope="col">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <Fragment key={r.id}>
                  {!r.complete && (i === 0 || data.rows[i - 1].complete) && (
                    <tr>
                      <th scope="rowgroup" colSpan={data.criteria.length + 5} className="!pt-6 text-left font-body text-[13px] font-medium text-concrete">
                        Still being judged: ranked once both judges have marked. Averages here are partial.
                      </th>
                    </tr>
                  )}
                  <tr className={r.complete ? "" : "opacity-80"}>
                    <td className="num text-concrete">
                      {r.rank ?? <span aria-label="Not ranked yet">—</span>}
                      {r.tied ? "=" : ""}
                    </td>
                    <td>
                      <Link to={`/judge/entry/${r.id}`} className="font-medium text-foreground hover:text-ember focus-ember">
                        {r.teamName || r.title}
                      </Link>
                      {r.teamName && <div className="text-[13px] text-foreground/75">{r.title}</div>}
                      <div className="mt-0.5 text-[13px] text-concrete">
                        {r.members.map((m) => m.name).join(", ")}
                        {r.late && <span className="p-tag p-tag--bad ml-2">Late</span>}
                        {!r.complete && <span className="p-tag p-tag--bad ml-2">Not finished</span>}
                      </div>
                    </td>
                    <td className="num text-foreground">
                      {f1(r.average)}
                      <span className="text-concrete">/{data.maxTotal}</span>
                      {!r.complete && r.average !== null && <span className="block text-[11px] text-concrete">partial</span>}
                    </td>
                    {data.criteria.map((c) => (
                      <td key={c.id} className="num hidden text-foreground/80 md:table-cell">
                        {f1(r.perCriterion[c.id])}
                      </td>
                    ))}
                    <td className={`num ${r.complete ? "" : "text-ember"}`}>
                      {r.judgeCount}/{data.marksNeeded}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost p-btn p-btn-sm border-transparent"
                        aria-expanded={open === r.id}
                        aria-label={`Marks and notes for ${r.teamName || r.title}`}
                        onClick={() => setOpen(open === r.id ? null : r.id)}
                      >
                        <ChevronDown size={15} strokeWidth={1.5} className={open === r.id ? "rotate-180" : ""} />
                      </button>
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr>
                      <td />
                      <td colSpan={data.criteria.length + 4}>
                        <div className="grid gap-6 py-2 md:grid-cols-2">
                          <div>
                            <p className="text-[13px] font-medium text-concrete">Each judge's total</p>
                            <ul className="mt-1.5 flex flex-col gap-1">
                              {data.judges.map((j) => (
                                <li key={j.key} className="flex justify-between gap-6 text-sm">
                                  <span className="text-foreground/85">{j.name}</span>
                                  <span className="p-mono text-foreground/80">{r.byJudge[j.key] ?? "—"}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-concrete">Notes</p>
                            {r.notes.length === 0 ? (
                              <p className="mt-1.5 text-sm text-concrete">None.</p>
                            ) : (
                              <ul className="mt-1.5 flex flex-col gap-3">
                                {r.notes.map((n, k) => (
                                  <li key={k} className="text-sm">
                                    <span className="text-concrete">{n.judge}: </span>
                                    <span className="whitespace-pre-line text-foreground/85">{n.notes}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </JudgeShell>
  );
}

/**
 * The top 5 for the final meeting: every fully judged team ranked 1st to 5th,
 * so a tie at 5th shows every tied team (judges decide tiebreakers). Each
 * name opens the entry, to look at the design again while deliberating.
 */
function TopFive({ data }: { data: Results }) {
  const top = data.rows.filter((r) => r.complete && r.rank !== null && r.rank <= 5);
  const waiting = data.rows.filter((r) => !r.complete).length;
  if (!data.rows.length) return null;
  const ties = new Set(top.filter((r) => r.tied).map((r) => r.rank));
  return (
    <section className="mt-8 border border-[hsl(var(--ember)/0.5)] bg-[hsl(var(--ember)/0.05)] p-4 md:p-6" aria-labelledby="top5-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="top5-title" className="font-display text-[1.6rem] uppercase leading-none text-bone md:text-[2rem]">
          Top 5{waiting > 0 ? <span className="ml-3 align-middle font-body text-sm normal-case text-ember">provisional: {waiting} still being judged</span> : null}
        </h2>
        <p className="font-body text-sm text-concrete">
          {ties.size > 0 ? `Tied at ${[...ties].map((n) => ordinal(n!)).join(" and ")}: all tied teams are shown, judges decide the tiebreak.` : "Click a team to open its entry."}
        </p>
      </div>
      {top.length === 0 ? (
        <p className="mt-3 font-body text-foreground/75">No team has both judges' marks yet.</p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {top.map((r) => (
            <li key={r.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3 border-t border-bone/10 pt-2">
              <span className={`p-mono text-lg ${r.tied ? "text-ember" : "text-foreground"}`}>
                {ordinal(r.rank!)}
                {r.tied ? "=" : ""}
              </span>
              <span className="min-w-0">
                <Link to={`/judge/entry/${r.id}`} className="font-body text-[17px] font-semibold text-foreground hover:text-ember focus-ember">
                  {r.teamName || r.title}
                </Link>
                <span className="ml-2 font-body text-sm text-foreground/70">{r.title}</span>
              </span>
              <span className="p-mono text-lg text-foreground">
                {r.average?.toFixed(1)}
                <span className="text-sm text-concrete">/{data.maxTotal}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;
