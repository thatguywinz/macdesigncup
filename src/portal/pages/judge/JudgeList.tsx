// The judges' dashboard: Up next and a team search at the top, then every
// submitted entry as a compact row (newest first) with what this judge has
// marked. Refreshes every 20 seconds while the tab is visible, so entries
// appear as teams submit.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { ApiError, api, clock, closesLabel } from "../../api";
import { countdown, useNow } from "../../hooks";
import { MARKS_NEEDED } from "../../shared/judging";
import type { JudgeCard } from "../../shared/schema";
import { JudgeShell, useMe } from "./context";
import { JudgeTip, OrganizerGuide } from "./Guide";
import "../../judge.css";

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
  // With the schedule made, a judge with a room marks their room's teams (and any without a slot), not other rooms'.
  const scheduled = !!data?.cards.some((c) => c.slot);
  const mine = useCallback((c: JudgeCard) => !myRoom || !scheduled || !c.slot || c.slot.room === myRoom, [myRoom, scheduled]);
  const roomCount = myRoom ? (data?.cards.filter((c) => c.slot?.room === myRoom).length ?? 0) : 0;
  // A judge with a scheduled room starts on that room's list, in time order.
  const active: Filter = filter ?? (roomCount ? "room" : "all");
  const q = fold(query);
  // A search looks through every entry, whatever the filter: a judge typing a
  // team's name wants that team, even if it presents in another room.
  const cards = useMemo(() => {
    if (!data) return [];
    if (q) {
      return data.cards
        .map((c, i) => ({ c, i, rank: matchRank(c, q) }))
        .filter((x) => x.rank !== null)
        .sort((a, b) => a.rank! - b.rank! || a.i - b.i)
        .map((x) => x.c);
    }
    const list = data.cards.filter((c) => {
      if (active === "room" && c.slot?.room !== myRoom) return false;
      // To mark: still needs marks (an entry is done once its pair's MARKS_NEEDED are in) and not marked by you.
      if (active === "todo" && (c.myTotal !== null || c.scoreCount >= MARKS_NEEDED || !mine(c))) return false;
      if (active === "done" && c.scoreCount < MARKS_NEEDED) return false;
      if (active === "review" && !c.openReviews) return false;
      return true;
    });
    // Every view runs in schedule order (earliest slot first), then entries without a time.
    {
      return list
        .map((c, i) => ({ c, i }))
        .sort((a, b) => (a.c.slot ? 0 : 1) - (b.c.slot ? 0 : 1) || String(a.c.slot?.at ?? "").localeCompare(String(b.c.slot?.at ?? "")) || a.i - b.i)
        .map((x) => x.c);
    }
    return list;
  }, [data, active, q, myRoom, mine]);

  const marked = data?.cards.filter((c) => c.myTotal !== null).length ?? 0;
  const done = data?.cards.filter((c) => c.scoreCount >= MARKS_NEEDED).length ?? 0;
  const upNext = data?.nextToMark ? data.cards.find((c) => c.id === data.nextToMark) : undefined;
  const total = data?.cards.length ?? 0;
  const deadline = data ? Date.parse(data.deadline) : 0;
  const left = deadline ? countdown(deadline, now) : "";

  const filters: [Filter, string][] = [
    ...(roomCount ? ([["room", `My room · ${myRoom}`]] as [Filter, string][]) : []),
    ["all", "All rooms"],
  ];

  return (
    <JudgeShell>
      <div className="flex flex-col gap-2 pt-6 md:flex-row md:items-end md:justify-between md:pt-8">
        <div>
          <h1 className="font-body text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] font-semibold leading-none tracking-[-0.03em] text-bone">Entries</h1>
          <p className="mt-2 font-body text-[14px] text-foreground/75">
            {total} teams submitted · {done} fully judged ({MARKS_NEEDED} marks each) · you've marked {marked}
            {me.role === "admin" && data?.drafts ? ` · ${data.drafts} still drafting` : ""}
          </p>
        </div>
        {data && (
          <p className={`p-mono text-[12px] ${left && deadline - now < 30 * 60 * 1000 ? "text-ember" : "text-concrete"}`}>
            Submissions {closesLabel(data.deadline, now, left).replace(/^Closes/, "close").replace(/^Closed/, "closed")}
          </p>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4 h-[3px] w-full bg-bone/10" role="progressbar" aria-label="Entries done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}

      {data && (me.role === "admin" ? <OrganizerGuide marksCount={data.marksCount} deadline={data.deadline} /> : marked === 0 && <JudgeTip />)}

      <div className="jl-top">
        {upNext ? (
          <div className="jl-next">
            <div className="flex min-w-0 items-center gap-3">
              {upNext.thumb && <img src={upNext.thumb} alt="" className="hidden h-12 w-[4.5rem] shrink-0 rounded-[2px] object-cover sm:block" />}
              <div className="min-w-0">
                <p className="font-body text-[12px] font-medium uppercase tracking-[0.06em] text-ember">Up next for you</p>
                <p className="truncate font-body text-[17px] font-semibold leading-tight text-bone">{upNext.teamName || upNext.title}</p>
                <p className="truncate font-body text-[13px] text-concrete">
                  {upNext.teamName && <span className="text-foreground/80">{upNext.title} · </span>}
                  {upNext.slot
                    ? `${upNext.slot.room} · ${clock(upNext.slot.at)}`
                    : upNext.scoreCount === 0
                      ? "nobody has marked it yet"
                      : `${upNext.scoreCount} of ${MARKS_NEEDED} marks so far`}
                </p>
              </div>
            </div>
            <Link to={`/judge/entry/${upNext.id}`} className="btn-portal p-btn focus-ember shrink-0">
              Judge it <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
          </div>
        ) : total > 0 && !data?.cards.some((c) => c.myTotal === null && c.scoreCount < MARKS_NEEDED && mine(c)) ? (
          <p className="p-notice p-notice--calm self-center font-body text-[15px]">{data?.open ? "Nothing left for you to mark. New ones show up here as teams submit." : "Nothing left for you to mark. Every team in your room has your marks."}</p>
        ) : (
          <span className="hidden md:block" />
        )}
        {/* On a phone the search sits right under Up next: judges find teams by name. */}
        <div className="jl-search">
          <label className="relative block">
            <span className="sr-only">Find a team by name (also searches titles, students and schools)</span>
            <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-concrete" aria-hidden="true" />
            <input className="p-input pl-9" type="search" placeholder="Find a team by name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {q && data && (
            <p className="font-body text-[13px] text-concrete" role="status">
              {cards.length ? `${cards.length} ${cards.length === 1 ? "match" : "matches"} from all rooms, closest first.` : ""}{" "}
              <button type="button" className="p-link focus-ember" onClick={() => setQuery("")}>
                Clear search
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="jl-chips mt-5" role="group" aria-label="Show">
        {filters.map(([f, label]) => (
          <button
            key={f}
            type="button"
            className="p-chip"
            aria-pressed={!q && active === f}
            onClick={() => {
              setFilter(f);
              setQuery("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body text-sm">{error}</p>}

      {!data ? (
        <p className="mt-10 font-body text-concrete" role="status">
          Loading entries…
        </p>
      ) : cards.length === 0 ? (
        <p className="mt-10 max-w-[34rem] font-body text-foreground/75">
          {total === 0 ? (
            <>
              No entries yet. They show up here the moment a team submits (submissions close at {data ? clock(data.deadline) : "2:00 PM"}).{" "}
              <Link to="/judge/practice" className="p-link focus-ember">
                Try the practice entry
              </Link>{" "}
              to see how marking works.
            </>
          ) : q ? (
            `No team, title, student or school matches "${query.trim()}". Check the spelling, or try part of the team name.`
          ) : (
            "No entries here."
          )}
        </p>
      ) : (
        <ul className="jl-rows">
          {cards.map((c) => (
            <li key={c.id}>
              <Link to={`/judge/entry/${c.id}`} className="jl-row">
                <span className="jl-thumb">
                  {c.thumb ? <img src={c.thumb} alt="" loading="lazy" /> : <span className="p-mono text-[10px] uppercase text-concrete">{c.modelExt ?? "video"}</span>}
                </span>
                <span className="min-w-0">
                  <span className="jl-name block">{c.teamName || c.title}</span>
                  <span className="jl-meta">
                    {c.teamName && <span className="jl-title">{c.title}</span>}
                    {c.slot && (
                      <span className="p-mono text-[12px]">
                        Judging {c.slot.room} · {clock(c.slot.at)}
                      </span>
                    )}
                    {c.late && <span className="p-tag p-tag--bad">Late</span>}
                    {c.award && <span className="p-tag p-tag--solid">{c.award}</span>}
                  </span>
                </span>
                <span className="jl-status">
                  {c.myTotal !== null ? (
                    <span className="p-tag p-mono">You: {c.myTotal}</span>
                  ) : c.scoreCount >= MARKS_NEEDED ? (
                    <span className="p-tag jl-chip-done">Done</span>
                  ) : mine(c) ? (
                    <span className="p-tag p-tag--ember">To mark</span>
                  ) : null}
                  <span className="p-mono text-[11px] text-concrete">
                    {Math.min(c.scoreCount, 99)} of {MARKS_NEEDED} marks
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </JudgeShell>
  );
}

/** Lower case, accents off ("José" -> "jose"), spaces collapsed: how names are compared in search. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Edit distance (a swapped pair of letters counts as one), stopping early once it passes `max`. */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    before = prev;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** A query word matches a word: its start, or (4+ letters) one typo off the word or its start. */
function wordHit(token: string, word: string): boolean {
  if (word.startsWith(token)) return true;
  if (token.length < 4) return false;
  return within(token, word, 1) || within(token, word.slice(0, token.length), 1);
}

/**
 * How well a card matches a folded query, best first (null: no match).
 * 0 team name exactly, 1 team name starts with it, 2 team name contains it,
 * 3 another field starts with it, 4 another field contains it,
 * 5 every word of the query starts a word somewhere (or is one typo off).
 */
function matchRank(c: JudgeCard, q: string): number | null {
  const team = fold(c.teamName ?? "");
  if (team && team === q) return 0;
  if (team.startsWith(q)) return 1;
  if (team.includes(q)) return 2;
  const others = [c.title, c.creditLine, ...c.members, ...c.schools, c.slot?.room ?? ""].filter(Boolean).map((s) => fold(s));
  if (others.some((s) => s.startsWith(q) || s.split(" ").some((w) => w.startsWith(q)))) return 3;
  if (others.some((s) => s.includes(q))) return 4;
  const words = [team, ...others].join(" ").split(/[^a-z0-9]+/).filter(Boolean);
  const tokens = q.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length && tokens.every((t) => words.some((w) => wordHit(t, w)))) return 5;
  return null;
}
