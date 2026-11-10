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
  creditLine: string;
  members: MemberInput[];
  late: boolean;
  award: string;
  average: number | null;
  perCriterion: Record<string, number | null>;
  byJudge: Record<string, number | null>;
  notes: { judge: string; notes: string }[];
  judgeCount: number;
}

interface Results {
  criteria: Criterion[];
  maxTotal: number;
  judges: { key: string; name: string }[];
  unlisted: { key: string; name: string; marked: number }[];
  rows: Row[];
}

export default function ResultsPage() {
  const { signOut } = useMe();
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api<Results>("/judge/results")
      .then(setData)
      .catch((e: ApiError) => (e.status === 401 ? signOut() : setError(e.message)));
  }, [signOut]);

  const f1 = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toFixed(1));

  return (
    <JudgeShell section="Results">
      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Results</h1>
          <p className="mt-3 max-w-[40rem] font-body text-[15px] text-foreground/75">
            Ranked by each entry's average total across the judges who marked it.
            {data ? ` ${data.judges.length} ${data.judges.length === 1 ? "judge" : "judges"} so far.` : ""}
          </p>
        </div>
        <a href="/api/portal/judge/export.csv" className="btn-ghost p-btn self-start focus-ember" download>
          <Download size={15} strokeWidth={1.5} /> Download CSV
        </a>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}
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
          <table className="j-table min-w-[760px]">
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
                  <th key={c.id} scope="col" className="num">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="num">
                  Judges
                </th>
                <th scope="col">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="num text-concrete">{r.average === null ? "" : i + 1}</td>
                    <td>
                      <Link to={`/judge/entry/${r.id}`} className="font-medium text-foreground hover:text-ember focus-ember">
                        {r.title}
                      </Link>
                      <div className="mt-0.5 text-[13px] text-concrete">
                        {r.members.map((m) => m.name).join(", ")}
                        {r.late && <span className="p-tag p-tag--bad ml-2">Late</span>}
                        {r.award && <span className="p-tag p-tag--solid ml-2">{r.award}</span>}
                      </div>
                    </td>
                    <td className="num text-foreground">
                      {f1(r.average)}
                      <span className="text-concrete">/{data.maxTotal}</span>
                    </td>
                    {data.criteria.map((c) => (
                      <td key={c.id} className="num text-foreground/80">
                        {f1(r.perCriterion[c.id])}
                      </td>
                    ))}
                    <td className="num">{r.judgeCount}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost p-btn p-btn-sm border-transparent"
                        aria-expanded={open === r.id}
                        aria-label={`Marks and notes for ${r.title}`}
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
