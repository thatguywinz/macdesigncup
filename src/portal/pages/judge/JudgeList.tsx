// The judges' dashboard: every submitted entry as a card, newest first,
// with what this judge has marked. Refreshes every 20 seconds while the tab
// is visible, so entries appear as teams submit.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { ApiError, api, clock, closesLabel } from "../../api";
import { countdown, useNow } from "../../hooks";
import { MAX_TOTAL } from "../../shared/judging";
import type { JudgeCard } from "../../shared/schema";
import { JudgeShell, useMe } from "./context";

interface ListResponse {
  cards: JudgeCard[];
  drafts?: number;
  deadline: string;
  open: boolean;
}

type Filter = "all" | "todo" | "done" | "late" | "review";

export default function JudgeList() {
  const { me, signOut } = useMe();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const now = useNow(1000);

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      api<ListResponse>("/judge/entries")
        .then((d) => {
          if (!alive) return;
          setData(d);
          setError("");
        })
        .catch((e: ApiError) => {
          if (e.status === 401) signOut();
          else if (alive) setError(e.message);
        });
    };
    load();
    const t = window.setInterval(load, 20_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [signOut]);

  const cards = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.cards.filter((c) => {
      if (filter === "todo" && c.myTotal !== null) return false;
      if (filter === "done" && c.myTotal === null) return false;
      if (filter === "late" && !c.late) return false;
      if (filter === "review" && !c.openReviews) return false;
      if (!q) return true;
      return [c.title, c.creditLine, ...c.schools, ...c.software].some((s) => s.toLowerCase().includes(q));
    });
  }, [data, filter, query]);

  const marked = data?.cards.filter((c) => c.myTotal !== null).length ?? 0;
  const total = data?.cards.length ?? 0;
  const deadline = data ? Date.parse(data.deadline) : 0;
  const left = deadline ? countdown(deadline, now) : "";

  return (
    <JudgeShell>
      <div className="flex flex-col gap-6 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Entries</h1>
          <p className="mt-3 font-body text-[15px] text-foreground/75">
            {total} submitted · you've marked {marked}
            {me.role === "admin" && data?.drafts ? ` · ${data.drafts} still drafting` : ""}
          </p>
        </div>
        {data && (
          <p className={`p-mono ${left && deadline - now < 30 * 60 * 1000 ? "text-ember" : "text-concrete"}`}>
            Submissions {closesLabel(data.deadline, now, left).replace(/^Closes/, "close").replace(/^Closed/, "closed")}
          </p>
        )}
      </div>

      {total > 0 && (
        <div className="mt-6 h-[3px] w-full bg-bone/10" role="progressbar" aria-label="Entries you've marked" aria-valuemin={0} aria-valuemax={total} aria-valuenow={marked}>
          <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${(marked / total) * 100}%` }} />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {(
            [
              ["all", "All"],
              ["todo", "To mark"],
              ["done", "Marked"],
              ["late", "Late"],
              ["review", "Needs review"],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button key={f} type="button" className="p-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search entries</span>
          <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-concrete" aria-hidden="true" />
          <input className="p-input pl-9" placeholder="Title, name, school, software" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body text-sm">{error}</p>}

      {!data ? (
        <p className="mt-12 font-body text-concrete" role="status">
          Loading entries…
        </p>
      ) : cards.length === 0 ? (
        <p className="mt-12 max-w-[34rem] font-body text-foreground/75">
          {total === 0 ? "No entries yet. They show up here the moment a team submits." : "No entries match."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {cards.map((c) => (
            <li key={c.id}>
              <Link to={`/judge/entry/${c.id}`} className="j-card focus-ember h-full">
                <div className="j-thumb relative">
                  {c.thumb ? (
                    <img src={c.thumb} alt="" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center p-mono text-[11px] uppercase text-concrete">{c.modelExt ?? "video"}</div>
                  )}
                  <span className="absolute right-2 top-2">
                    {c.myTotal !== null ? (
                      <span className="p-tag border-transparent bg-background/80 p-mono">
                        {c.myTotal}/{MAX_TOTAL}
                      </span>
                    ) : (
                      <span className="p-tag p-tag--ember bg-background/80">To mark</span>
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <span className="font-body text-[17px] font-semibold leading-snug tracking-[-0.01em] text-bone">{c.title}</span>
                  <span className="font-body text-sm text-foreground/75">
                    {c.creditLine}
                    {c.memberCount > 1 ? ` · team of ${c.memberCount}` : ""}
                  </span>
                  <span className="truncate font-body text-[13px] text-concrete">{c.schools.join(", ")}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    {c.late && <span className="p-tag p-tag--bad">Late</span>}
                    {c.openReviews > 0 && <span className="p-tag p-tag--ember">Needs review</span>}
                    {!!c.specFails && <span className="p-tag p-tag--bad">Outside spec</span>}
                    {c.award && <span className="p-tag p-tag--solid">{c.award}</span>}
                    {c.hidden && <span className="p-tag">Hidden</span>}
                    <span className="p-mono ml-auto text-[11px] text-concrete">
                      {clock(c.submittedAt)} · {c.scoreCount} {c.scoreCount === 1 ? "mark" : "marks"}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </JudgeShell>
  );
}
