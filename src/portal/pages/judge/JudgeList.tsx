// The judges' dashboard: every submitted entry as a card, newest first,
// with what this judge has marked. Refreshes every 20 seconds while the tab
// is visible, so entries appear as teams submit.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { ApiError, api, clock, closesLabel } from "../../api";
import { countdown, useNow } from "../../hooks";
import { MARKS_NEEDED, MAX_TOTAL } from "../../shared/judging";
import type { JudgeCard } from "../../shared/schema";
import { JudgeShell, useMe } from "./context";
import { JudgeTip, OrganizerGuide } from "./Guide";

interface ListResponse {
  cards: JudgeCard[];
  /** The unmarked entry with the fewest marks: where this judge goes next. */
  nextToMark?: string | null;
  /** The room this judge sits in, if organizers set one. */
  myRoom?: string | null;
  drafts?: number;
  /** Whether this person's marks go into Results. */
  marksCount?: boolean;
  deadline: string;
  open: boolean;
}

type Filter = "room" | "all" | "todo" | "done" | "review";

export default function JudgeList() {
  const { me, signOut } = useMe();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter | null>(null);
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

  const myRoom = data?.myRoom ?? null;
  const roomCount = myRoom ? (data?.cards.filter((c) => c.slot?.room === myRoom).length ?? 0) : 0;
  // A judge with a scheduled room starts on that room's list, in time order.
  const active: Filter = filter ?? (roomCount ? "room" : "all");
  const cards = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = data.cards.filter((c) => {
      if (active === "room" && c.slot?.room !== myRoom) return false;
      // To mark: still needs marks (an entry is done once its pair's MARKS_NEEDED are in) and not marked by you.
      if (active === "todo" && (c.myTotal !== null || c.scoreCount >= MARKS_NEEDED)) return false;
      if (active === "done" && c.scoreCount < MARKS_NEEDED) return false;
      if (active === "review" && !c.openReviews) return false;
      if (!q) return true;
      return [c.teamName, c.title, c.creditLine, ...c.members, ...c.schools, ...c.software].some((s) => s && s.toLowerCase().includes(q));
    });
    return active === "room" ? list.sort((a, b) => String(a.slot?.at).localeCompare(String(b.slot?.at))) : list;
  }, [data, active, query, myRoom]);

  const marked = data?.cards.filter((c) => c.myTotal !== null).length ?? 0;
  const done = data?.cards.filter((c) => c.scoreCount >= MARKS_NEEDED).length ?? 0;
  const upNext = data?.nextToMark ? data.cards.find((c) => c.id === data.nextToMark) : undefined;
  const total = data?.cards.length ?? 0;
  const deadline = data ? Date.parse(data.deadline) : 0;
  const left = deadline ? countdown(deadline, now) : "";

  return (
    <JudgeShell>
      <div className="flex flex-col gap-6 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Entries</h1>
          <p className="mt-3 font-body text-[15px] text-foreground/75">
            {total} submitted · {done} done ({MARKS_NEEDED} marks each) · you've marked {marked}
            {me.role === "admin" && data?.drafts ? ` · ${data.drafts} still drafting` : ""}
          </p>
        </div>
        {data && (
          <p className={`p-mono ${left && deadline - now < 30 * 60 * 1000 ? "text-ember" : "text-concrete"}`}>
            Submissions {closesLabel(data.deadline, now, left).replace(/^Closes/, "close").replace(/^Closed/, "closed")}
          </p>
        )}
      </div>

      {data && (me.role === "admin" ? <OrganizerGuide marksCount={data.marksCount} deadline={data.deadline} /> : marked === 0 && <JudgeTip />)}

      {total > 0 && (
        <div className="mt-6 h-[3px] w-full bg-bone/10" role="progressbar" aria-label="Entries done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}

      {upNext ? (
        <div className="mt-6 flex flex-col gap-4 border border-bone/10 bg-[hsl(220_7%_5.5%)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {upNext.thumb && <img src={upNext.thumb} alt="" className="hidden h-14 w-24 shrink-0 rounded-[2px] object-cover sm:block" />}
            <div className="min-w-0">
              <p className="font-body text-[13px] text-ember">Up next for you</p>
              <p className="truncate font-body text-[17px] font-semibold text-bone">{upNext.teamName || upNext.title}</p>
              {upNext.teamName && <p className="truncate font-body text-sm text-foreground/75">{upNext.title}</p>}
              <p className="font-body text-[13px] text-concrete">
                {upNext.creditLine} ·{" "}
                {upNext.slot
                  ? `presents in ${upNext.slot.room} at ${clock(upNext.slot.at)}`
                  : upNext.scoreCount === 0
                    ? "nobody has marked it yet"
                    : `${upNext.scoreCount} of ${MARKS_NEEDED} marks so far`}
              </p>
            </div>
          </div>
          <Link to={`/judge/entry/${upNext.id}`} className="btn-portal p-btn focus-ember shrink-0 self-start sm:self-auto">
            Judge it <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
        </div>
      ) : (
        total > 0 &&
        done + marked >= total && (
          <p className="p-notice p-notice--calm mt-6 font-body text-[15px]">Nothing left for you to mark. New ones show up here as teams submit.</p>
        )
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {(
            [
              ...(roomCount ? ([["room", `My room · ${myRoom}`]] as [Filter, string][]) : []),
              ["all", "All"],
              ["todo", "To mark"],
              ["done", "Done"],
              ["review", "Needs review"],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button key={f} type="button" className="p-chip" aria-pressed={active === f} onClick={() => setFilter(f)}>
              {label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search by team name, title, student or school</span>
          <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-concrete" aria-hidden="true" />
          <input className="p-input pl-9" placeholder="Team name, title, student, school" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body text-sm">{error}</p>}

      {!data ? (
        <p className="mt-12 font-body text-concrete" role="status">
          Loading entries…
        </p>
      ) : cards.length === 0 ? (
        <p className="mt-12 max-w-[34rem] font-body text-foreground/75">
          {total === 0 ? (
            <>
              No entries yet. They show up here the moment a team submits (submissions close at {data ? clock(data.deadline) : "2:00 PM"}).{" "}
              <Link to="/judge/practice" className="p-link focus-ember">
                Try the practice entry
              </Link>{" "}
              to see how marking works.
            </>
          ) : (
            "No entries match."
          )}
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
                        You: {c.myTotal}/{MAX_TOTAL}
                      </span>
                    ) : c.scoreCount >= MARKS_NEEDED ? (
                      <span className="p-tag border-transparent bg-background/80">Done</span>
                    ) : (
                      <span className="p-tag p-tag--ember bg-background/80">To mark</span>
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  {c.teamName && <span className="font-body text-[13px] text-ember">{c.teamName}</span>}
                  <span className="font-body text-[17px] font-semibold leading-snug tracking-[-0.01em] text-bone">{c.title}</span>
                  <span className="font-body text-sm text-foreground/75">
                    {c.members.join(", ") || c.creditLine}
                    {c.memberCount > 1 ? ` · team of ${c.memberCount}` : ""}
                  </span>
                  <span className="truncate font-body text-[13px] text-concrete">{c.schools.join(", ")}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    {c.slot && (
                      <span className="p-tag p-mono">
                        {c.slot.room} · {clock(c.slot.at)}
                      </span>
                    )}
                    {c.late && <span className="p-tag p-tag--bad">Late</span>}
                    {c.openReviews > 0 && <span className="p-tag p-tag--ember">Needs review</span>}
                    {!!c.specFails && <span className="p-tag p-tag--bad">Outside spec</span>}
                    {c.award && <span className="p-tag p-tag--solid">{c.award}</span>}
                    {c.hidden && <span className="p-tag">Hidden</span>}
                    <span className="p-mono ml-auto text-[11px] text-concrete">
                      {clock(c.submittedAt)} · {Math.min(c.scoreCount, 99)}/{MARKS_NEEDED} marks
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
