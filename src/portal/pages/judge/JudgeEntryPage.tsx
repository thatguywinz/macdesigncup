// One entry, for judging at the table. Built to be calm in a 3-minute slot:
// a one-line header (team, design, room and time, marks in), the team's
// picture / model / video on the left, and the four rubric categories on the
// right with a save bar that stays in reach. At 1440x900 the whole marking
// area fits without scrolling. Everything else (the team's write-up, files,
// measurements, originality checks, organizer switches) is in the left
// panel's "Team details" tab. /judge/practice shows a made-up entry with the
// same screen, so anyone can try marking before the day.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ChevronDown, Download, ExternalLink } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import { formatBytes, isViewable, type ViewableExt } from "../../shared/formats";
import { CRITERIA, MARK_MAX, MARKS_NEEDED, MAX_TOTAL, levelOf, totalOf, type Criterion } from "../../shared/judging";
import type { JudgeEntry, Score } from "../../shared/schema";
import type { Measure, Spec } from "../../shared/checks";
import { MeasurePanel } from "./panels";
import { guardLeave, readDraft, setUnsavedNow, writeDraft } from "./unsaved";
import ModelViewer from "../../viewer/ModelViewer";
import VideoPlayer from "../../components/VideoPlayer";
import { parseVideoLink } from "../../shared/video";
import { JudgeShell, useMe } from "./context";
import { PRACTICE_ID, practiceEntry } from "./practice";
import "../../judge.css";

interface EntryResponse {
  entry: JudgeEntry;
  prev: string | null;
  next: string | null;
  /** This judge's next unmarked entry (their room's order, or fewest marks first). */
  nextToMark: string | null;
  toMark: number;
  total: number;
  spec: Spec | null;
  /** Whether this person's marks go into Results. */
  marksCount?: boolean;
}

/**
 * Two-to-four-word names for each rubric level, so the level buttons read at a
 * glance. Each follows its level's wording in shared/judging.ts; the full
 * description shows under the buttons once a level is chosen.
 */
const SHORT: Record<string, [string, string, string, string]> = {
  originality: ["Copy / derivative", "Familiar", "Fresh take", "Original"],
  technical: ["Major errors", "Basic", "Clean", "Exceptional"],
  theme: ["Not reflected", "Surface-level", "Central focus", "Seamless fit"],
  communication: ["Missing / messy", "Short / disorganized", "Clear / organized", "Compelling"],
};
const shortLabel = (c: Criterion, i: number) => SHORT[c.id]?.[i] ?? c.levels[i].text.split(/[.,:]/)[0].split(" ").slice(0, 3).join(" ");

// The one-line hint over the rubric shows until this device has saved a mark.
const HINT_KEY = "mdc-judge-saved-once";
const readSavedOnce = () => {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
};
const noteSavedOnce = () => {
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {
    /* fine */
  }
};

// The signed-in judge's room (from the dashboard's answer), kept for a few
// minutes so moving between entries doesn't ask again.
let roomCache: { at: number; who: string; room: string | null } | null = null;
function useMyRoom(skip: boolean, who: string): string | null {
  const [room, setRoom] = useState<string | null>(roomCache?.who === who ? roomCache.room : null);
  useEffect(() => {
    if (skip) return;
    if (roomCache && roomCache.who === who && Date.now() - roomCache.at < 3 * 60_000) {
      setRoom(roomCache.room);
      return;
    }
    let alive = true;
    api<{ myRoom?: string | null }>("/judge/entries")
      .then((d) => {
        roomCache = { at: Date.now(), who, room: d.myRoom ?? null };
        if (alive) setRoom(roomCache.room);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [skip, who]);
  return room;
}

type Tab = "pictures" | "model" | "video" | "details";

const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

export default function JudgeEntryPage({ practice = false }: { practice?: boolean }) {
  const params = useParams();
  const id = practice ? PRACTICE_ID : (params.id ?? "");
  const { me, signOut } = useMe();
  const navigate = useNavigate();
  const [data, setData] = useState<EntryResponse | null>(null);
  const [error, setError] = useState("");
  // Measured live from the actual file in this browser (not what the team's browser reported).
  const [liveMeasure, setLiveMeasure] = useState<Measure | null>(null);
  const [shown, setShown] = useState(0);
  const [tab, setTab] = useState<Tab | null>(null);
  const myRoom = useMyRoom(practice, me.name);

  useEffect(() => {
    setData(null);
    setError("");
    setShown(0);
    setTab(null);
    setLiveMeasure(null);
    let alive = true;
    if (practice) {
      setData({ entry: practiceEntry(), prev: null, next: null, nextToMark: null, toMark: 1, total: 1, spec: null, marksCount: false });
      return;
    }
    // A slow answer for an entry the judge has already left must not replace the one on screen.
    api<EntryResponse>(`/judge/entries/${id}`)
      .then((d) => alive && setData(d))
      .catch((e: ApiError) => alive && (e.status === 401 ? signOut() : setError(e.message)));
    return () => {
      alive = false;
    };
  }, [id, signOut, practice]);

  const e = data?.entry;
  const model = e?.files.find((f) => f.slot === "model");
  const source = e?.files.find((f) => f.slot === "source");
  const images = e?.files.filter((f) => f.slot === "image") ?? [];
  const videoFile = e?.files.find((f) => f.slot === "video") ?? null;
  const videoLink = (() => {
    const v = e?.videoLink ? parseVideoLink(e.videoLink) : null;
    return v ? { url: v.url, host: v.host, embed: v.embed } : null;
  })();
  const pic = images[Math.min(shown, Math.max(0, images.length - 1))];
  const reviews = e?.checks.filter((c) => c.level === "review" && !c.review).length ?? 0;
  const admin = me.role === "admin";

  const tabs: [Tab, string][] = e
    ? [
        ...(images.length ? ([["pictures", images.length > 1 ? `Pictures (${images.length})` : "Picture"]] as [Tab, string][]) : []),
        ...(model ? ([["model", "3D model"]] as [Tab, string][]) : []),
        ...(videoFile || videoLink ? ([["video", "Video"]] as [Tab, string][]) : []),
        ["details", "Team details"],
      ]
    : [];
  const active: Tab = tab ?? tabs[0]?.[0] ?? "details";
  const nextTeam = data?.nextToMark && data.nextToMark !== id ? data.nextToMark : null;

  const marksIn = e ? Math.min(e.scoreCount, MARKS_NEEDED) : 0;
  const pairStatus = !e
    ? ""
    : e.scoreCount >= MARKS_NEEDED && !e.myScore
      ? `Done: has its ${MARKS_NEEDED} marks`
      : `${marksIn} of ${MARKS_NEEDED} marks`;

  return (
    <JudgeShell section="Judging">
      {/* Header: who this is, where and when, how many marks are in, and where to go. */}
      <div className="jd-head">
        <div className="jd-nav">
          <Link to="/judge" className="jd-navlink focus-ember" onClick={guardLeave}>
            <ArrowLeft size={15} strokeWidth={1.5} /> All entries
          </Link>
          {nextTeam && (
            <Link to={`/judge/entry/${nextTeam}`} className="jd-navlink focus-ember" onClick={guardLeave} title={`${data?.toMark ?? 0} left for you to mark`}>
              Next team{data && data.toMark > 0 ? ` (${data.toMark} left)` : ""} <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
          )}
        </div>
        {e ? (
          <div className="jd-title min-w-0">
            <h1 className="jd-team">{e.teamName || e.title}</h1>
            <p className="jd-sub">
              {e.teamName && <span className="text-foreground/85">{e.title}</span>}
              {e.slot && (
                <span className="p-mono text-foreground/80">
                  {e.slot.room} · {clock(e.slot.at)}
                </span>
              )}
              {!practice && <span className={e.scoreCount >= MARKS_NEEDED ? "text-foreground/85" : "text-concrete"}>{pairStatus}</span>}
              {practice && <span className="p-tag p-tag--ember">Practice · nothing is saved</span>}
              {!practice && admin && (
                <span className="p-tag" title="This is the judges' screen. Organizer switches are in Team details.">
                  Organizer · {data?.marksCount === false ? "your marks don't count" : "your marks count"}
                </span>
              )}
              {e.late && <span className="p-tag p-tag--bad">Submitted late</span>}
              {e.award && <span className="p-tag p-tag--solid">{e.award}</span>}
              {e.status !== "submitted" && <span className="p-tag">Draft</span>}
            </p>
          </div>
        ) : (
          <p className="font-body text-concrete" role="status">
            {error ? "" : "Loading…"}
          </p>
        )}
      </div>

      {error && <p className="p-notice p-notice--bad mt-3 font-body">{error}</p>}

      {e && myRoom && e.slot && e.slot.room !== myRoom && (
        <p className="p-notice p-notice--bad mt-3 font-body text-sm" role="note">
          <span className="font-semibold text-bone">Not your room.</span> Judged in <span className="p-mono">{e.slot.room}</span> by{" "}
          {e.pairNames?.length ? e.pairNames.join(" and ") : "that room's pair"}; your marks won't count. Yours is <span className="p-mono">{myRoom}</span>.
        </p>
      )}

      {e && (
        <div className="jd-grid">
          {/* What the team shows, switchable; the write-up is the last tab. */}
          <div className="jd-media-col">
            <div className="jd-tabs" role="tablist" aria-label="What the team made">
              {tabs.map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  id={`tab-${t}`}
                  aria-selected={active === t}
                  aria-controls="jd-panel"
                  className="jd-tab focus-ember"
                  onClick={() => setTab(t)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div id="jd-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className={`jd-panel ${active === "details" ? "jd-panel--text" : ""}`}>
              {active === "pictures" && pic && (
                <div className="jd-pic">
                  <a href={pic.url} target="_blank" rel="noopener noreferrer" className="focus-ember jd-pic-main" title="Open full size">
                    <img src={pic.url} alt={`${e.title}, picture ${shown + 1}`} />
                  </a>
                  {images.length > 1 && (
                    <div className="jd-thumbs">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          type="button"
                          className="focus-ember"
                          data-on={i === shown ? "true" : undefined}
                          onClick={() => setShown(i)}
                          aria-label={`Picture ${i + 1}`}
                          aria-pressed={i === shown}
                        >
                          <img src={img.url} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {active === "model" && (
                <ModelViewer
                  source={model && isViewable(model.ext) ? { kind: "url", url: model.url, ext: model.ext as ViewableExt } : null}
                  upAxis={e.upAxis ?? "y"}
                  units={e.units ?? "mm"}
                  spec={data?.spec ?? null}
                  onMeasure={setLiveMeasure}
                  label={`${e.title}, 3D model`}
                  className="jd-viewer"
                  empty={<span className="font-body text-sm text-concrete">This entry has no viewable model.</span>}
                />
              )}
              {active === "video" && (
                <div className="jd-video">
                  <VideoPlayer title={e.title} file={videoFile} link={videoLink} poster={e.files.find((f) => f.slot === "thumb")?.url} />
                  {videoLink && e.videoCheck && e.videoCheck.status !== "public" && <p className="p-hint mt-2">Link check: {e.videoCheck.note}</p>}
                </div>
              )}
              {active === "details" && (
                <TeamDetails
                  entry={e}
                  practice={practice}
                  admin={admin}
                  files={[model, source].filter((f): f is NonNullable<typeof f> => !!f)}
                  liveMeasure={liveMeasure}
                  hasModel={!!model}
                  spec={data?.spec ?? null}
                  prev={data?.prev ?? null}
                  next={data?.next ?? null}
                  onNavigate={(to) => guardLeave() && navigate(`/judge/entry/${to}`)}
                  onChange={(entry) => setData((d) => (d ? { ...d, entry } : d))}
                />
              )}
            </div>
            {active === "details" && (
              <button type="button" className="btn-ghost p-btn p-btn-sm mt-3 lg:hidden" onClick={() => document.getElementById("marks")?.scrollIntoView({ behavior: smooth(), block: "start" })}>
                <ArrowDown size={15} strokeWidth={1.5} /> Jump to marks
              </button>
            )}
          </div>

          <ScoreForm key={e.id} entryId={e.id} initial={e.myScore} scoreCount={e.scoreCount} next={data?.nextToMark ?? null} practice={practice} />
        </div>
      )}
    </JudgeShell>
  );
}

/** The team's write-up and the evidence: everything a judge may want, none of it in the way of marking. */
function TeamDetails({
  entry: e,
  practice,
  admin,
  files,
  liveMeasure,
  hasModel,
  spec,
  prev,
  next,
  onNavigate,
  onChange,
}: {
  entry: JudgeEntry;
  practice: boolean;
  admin: boolean;
  files: JudgeEntry["files"];
  liveMeasure: Measure | null;
  hasModel: boolean;
  spec: Spec | null;
  prev: string | null;
  next: string | null;
  onNavigate: (id: string) => void;
  onChange: (e: JudgeEntry) => void;
}) {
  const schools = [...new Set(e.members.map((m) => m.school))].join(", ");
  const grades = [...new Set(e.members.map((m) => m.grade))].join(", ");
  return (
    <div className="jd-details">
      <dl className="jd-facts">
        <div>
          <dt>Team</dt>
          <dd>
            {e.members.map((m) => m.name).join(", ")}
            <span className="block text-concrete">
              {schools} · grade {grades}
            </span>
          </dd>
        </div>
        <div>
          <dt>Software</dt>
          <dd>{e.software.map((s) => (s === "Other" && e.softwareOther ? e.softwareOther : s)).join(", ") || "Not given"}</dd>
        </div>
        <div>
          <dt>AI use</dt>
          <dd>{e.aiUse === "some" ? e.aiNote || "Some" : "None"}</dd>
        </div>
      </dl>

      <h2 className="jd-h">What they made</h2>
      <p className="whitespace-pre-line font-body text-[15px] leading-relaxed text-foreground/90">{e.summary}</p>
      {e.presentation && (
        <>
          <h2 className="jd-h">What they'll present</h2>
          <p className="whitespace-pre-line font-body text-[14px] leading-relaxed text-foreground/80">{e.presentation}</p>
        </>
      )}
      {e.process && (
        <>
          <h2 className="jd-h">Their notes</h2>
          <p className="whitespace-pre-line font-body text-[14px] leading-relaxed text-foreground/80">{e.process}</p>
        </>
      )}

      {!practice && (
        <>
          <h2 className="jd-h">Files and links</h2>
          <ul className="flex flex-col gap-1.5">
            {files.map((f) => (
              <li key={f.id}>
                <a href={f.url} download={f.name} className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                  <Download size={15} strokeWidth={1.5} className="shrink-0 text-ember" />
                  <span className="truncate">{f.name}</span>
                  <span className="p-mono text-[11px] text-concrete">{formatBytes(f.size)}</span>
                </a>
              </li>
            ))}
            {e.cadLink && (
              <li>
                <a href={e.cadLink} target="_blank" rel="noopener noreferrer" className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                  <ExternalLink size={15} strokeWidth={1.5} className="text-ember" /> CAD document
                </a>
              </li>
            )}
            <li>
              <a href={`/entry/${e.id}`} target="_blank" rel="noopener" className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                <ExternalLink size={15} strokeWidth={1.5} className="text-ember" /> Public page
              </a>
            </li>
          </ul>
          {admin && <p className="p-hint mt-3">Contact: {e.contactEmail}</p>}

          {hasModel && <MeasurePanel measure={liveMeasure} spec={spec} reported={e.measure} />}
          {hasModel && !liveMeasure && <p className="p-hint mt-1">Open the 3D model tab to measure it.</p>}

          <div className="mt-8 flex flex-wrap gap-2 border-t border-bone/10 pt-5">
            <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
              <ArrowLeft size={15} strokeWidth={1.5} /> Newer entry
            </button>
            <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!next} onClick={() => next && onNavigate(next)}>
              Older entry <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </div>

          {admin && <AdminPanel entry={e} onChange={onChange} />}
        </>
      )}
    </div>
  );
}

// Unsaved marks live in ./unsaved (per judge, per entry).

function ScoreForm({
  entryId,
  initial,
  scoreCount,
  next,
  practice,
}: {
  entryId: string;
  initial: Score | null;
  scoreCount: number;
  next: string | null;
  practice: boolean;
}) {
  const navigate = useNavigate();
  const { me } = useMe();
  const leaving = useRef(false);
  const [unsaved] = useState(() => (practice ? null : readDraft(me.name, entryId)));
  const [marks, setMarks] = useState<Record<string, number>>(unsaved?.marks ?? initial?.marks ?? {});
  const [notes, setNotes] = useState(unsaved?.notes ?? initial?.notes ?? "");
  const [savedAt, setSavedAt] = useState(initial?.updatedAt ?? "");
  const [dirty, setDirty] = useState(!!unsaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [hint] = useState(() => practice || !readSavedOnce());
  // Why the last save failed, when the judge has something to do about it.
  const [failure, setFailure] = useState<"" | "signedOut" | "removed">("");
  const total = useMemo(() => totalOf(marks), [marks]);
  const done = CRITERIA.filter((c) => typeof marks[c.id] === "number").length;
  const sum = CRITERIA.reduce((n, c) => n + (typeof marks[c.id] === "number" ? marks[c.id] : 0), 0);

  useEffect(() => {
    if (dirty && !practice) writeDraft(me.name, entryId, { marks, notes });
  }, [dirty, entryId, marks, notes, practice]);

  // Unsaved marks: warn before leaving the tab, and before any link off the page.
  useEffect(() => {
    setUnsavedNow(dirty && !practice);
    return () => setUnsavedNow(false);
  }, [dirty, practice]);
  useEffect(() => {
    if (!dirty || practice) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, practice]);

  async function save(goNext: boolean) {
    if (practice) {
      // Nothing to send: show what a judge sees after saving.
      setSavedAt(new Date().toISOString());
      setDirty(false);
      return;
    }
    setBusy(true);
    setError("");
    setFailure("");
    try {
      const r = await api<{ score: Score }>(`/judge/entries/${entryId}/score`, { method: "PUT", body: { marks, notes } });
      setSavedAt(r.score.updatedAt);
      setDirty(false);
      writeDraft(me.name, entryId, null);
      noteSavedOnce();
      if (goNext && next) navigate(`/judge/entry/${next}`);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401) {
        setFailure("signedOut");
        setError("You've been signed out, so these marks weren't saved. They're kept on this device: sign in again and they'll be here.");
      } else if (status === 404) {
        setFailure("removed");
        setDirty(false);
        writeDraft(me.name, entryId, null);
        setError("Organizers removed this team. Your marks weren't needed.");
      } else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Reload this entry's page: the sign-in screen shows first, then the entry with the kept marks.
  const signInAgain = () => {
    writeDraft(me.name, entryId, { marks, notes });
    leaving.current = true;
    window.location.assign(`${window.location.pathname}?as=${encodeURIComponent(me.name)}`);
  };

  const setMark = (id: string, v: number) => {
    setMarks((m) => ({ ...m, [id]: v }));
    setDirty(true);
  };

  const left = CRITERIA.length - done;
  const status = busy
    ? "Saving…"
    : total === null
      ? `${left} ${left === 1 ? "category" : "categories"} left`
      : dirty
        ? unsaved
          ? "Not saved yet (kept from before)"
          : "Not saved yet"
        : savedAt
          ? practice
            ? "Saved (practice: nothing sent)"
            : `Saved at ${clock(savedAt)}`
          : "Ready to save";
  const goesNext = !!next;

  return (
    <section id="marks" aria-labelledby="marks-h" className="jd-score">
      <div className="jd-score-head">
        <h2 id="marks-h" className="sr-only">
          Your marks
        </h2>
        <p className="jd-hint">{hint ? "Tap a level, then the points, for each category." : "Your marks"}</p>
        <button type="button" className="jd-toggle focus-ember" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Hide rubric descriptions" : "Show rubric descriptions"}
        </button>
      </div>
      {!practice && scoreCount >= MARKS_NEEDED && !initial && (
        <p className="jd-hint">This team already has its {MARKS_NEEDED} marks, so it doesn't need yours.</p>
      )}

      <div className="jd-crits">
        {CRITERIA.map((c) => (
          <RubricRow key={c.id} c={c} value={marks[c.id]} showAll={showAll} onChange={(v) => setMark(c.id, v)} />
        ))}
      </div>

      <details className="jd-note" open={!!notes || undefined}>
        <summary className="focus-ember">
          {notes ? "Your note" : "Add a note"} <span className="text-concrete">(optional, teams never see it)</span>
          <ChevronDown size={14} strokeWidth={1.5} className="jd-chev" aria-hidden="true" />
        </summary>
        <textarea
          className="p-textarea mt-2 min-h-[4rem]"
          aria-label="Note for you and the organizers"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setDirty(true);
          }}
        />
      </details>

      {/* Stays at the bottom of the screen while the rubric is in view, so saving is always one tap away. */}
      <div className="jd-savebar">
        {error && (
          <div className="p-notice p-notice--bad mb-3 font-body text-sm" role="alert">
            <p>{error}</p>
            {failure === "signedOut" && (
              <button type="button" className="btn-portal p-btn p-btn-sm mt-2.5" onClick={signInAgain}>
                Sign in again
              </button>
            )}
            {failure === "removed" && (
              <Link to="/judge" className="p-link focus-ember mt-2 inline-block">
                Back to entries
              </Link>
            )}
          </div>
        )}
        <div className="jd-savebar-row">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[1.75rem] leading-none text-bone">{sum}</span>
            <span className="font-body text-sm text-concrete">/{MAX_TOTAL}</span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {CRITERIA.map((c) => (
              <span key={c.id} className="j-pip" data-on={typeof marks[c.id] === "number" ? "true" : undefined} title={c.label} />
            ))}
          </div>
          <span className="jd-status" role="status">
            {status}
          </span>
          <div className="jd-actions">
            {goesNext && (
              <button type="button" className="btn-ghost p-btn" disabled={busy || total === null} onClick={() => save(false)}>
                Save
              </button>
            )}
            <button type="button" className="btn-portal p-btn" disabled={busy || total === null} onClick={() => save(true)}>
              {goesNext ? "Save and judge next" : "Save marks"}
            </button>
          </div>
        </div>
        {practice && savedAt && !dirty && (
          <p className="mt-2 font-body text-sm text-foreground/85">
            That's it. On the day, "Save and judge next" opens the next team in your room.{" "}
            <Link to="/judge" className="p-link focus-ember">
              Back to entries
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

/** One rubric category: four short levels, then (once one is chosen) its description and points. */
function RubricRow({ c, value, showAll, onChange }: { c: Criterion; value: number | undefined; showAll: boolean; onChange: (v: number) => void }) {
  const marked = typeof value === "number";
  const [level, setLevel] = useState<number | null>(marked ? levelOf(value) : null);
  const lv = level !== null ? c.levels[level] : null;
  const pickedHere = marked && level !== null && levelOf(value) === level;
  // A marked category folds to one line ("Fresh take · 16/25 · Change"), so
  // the page gets shorter as the judge works, which matters most on a phone.
  const [editing, setEditing] = useState(false);
  if (marked && !editing && !showAll) {
    return (
      <div role="group" aria-labelledby={`c-${c.id}`} className="jd-crit jd-crit--done" data-done="true">
        <p id={`c-${c.id}`} className="jd-crit-name min-w-0 truncate">
          {c.label}
        </p>
        <span className="jd-done-val">
          <span className="text-concrete">{shortLabel(c, levelOf(value))}</span>
          <span className="p-mono text-ember" aria-label={`${value} out of ${MARK_MAX}`}>
            {value}/{MARK_MAX}
          </span>
          <button type="button" className="jd-toggle focus-ember" onClick={() => setEditing(true)} aria-label={`Change ${c.label}`}>
            Change
          </button>
        </span>
      </div>
    );
  }
  return (
    <div role="group" aria-labelledby={`c-${c.id}`} className="jd-crit" data-done={marked ? "true" : undefined}>
      <div className="jd-crit-head">
        <p id={`c-${c.id}`} className="jd-crit-name">
          {c.label}
          <span className="jd-crit-q">{c.hint}</span>
        </p>
        <span className={`p-mono shrink-0 text-[14px] ${marked ? "text-ember" : "text-concrete"}`} aria-label={marked ? `${value} out of ${MARK_MAX}` : "Not marked"}>
          {marked ? value : "–"}/{MARK_MAX}
        </span>
      </div>
      <div className="jd-levels" data-all={showAll ? "true" : undefined}>
        {c.levels.map((l, i) => (
          <button
            key={i}
            type="button"
            className="jd-level focus-ember"
            aria-pressed={level === i}
            aria-label={`${l.min} to ${l.max} points: ${shortLabel(c, i)}. ${l.text}`}
            data-has={marked && levelOf(value) === i ? "true" : undefined}
            onClick={() => setLevel(i)}
          >
            <span className="jd-range">
              {l.min}–{l.max}
            </span>
            <span className="jd-short">{shortLabel(c, i)}</span>
            {showAll && <span className="jd-long">{l.text}</span>}
          </button>
        ))}
      </div>
      {lv && (
        <div className="jd-picked">
          {!showAll && <p className="jd-desc">{lv.text}</p>}
          <div className="jd-points" role="radiogroup" aria-label={`${c.label}: points from ${lv.min} to ${lv.max}`} data-wait={pickedHere ? undefined : "true"}>
            {Array.from({ length: lv.max - lv.min + 1 }, (_, i) => lv.min + i).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={value === v}
                aria-label={`${v} out of ${MARK_MAX}`}
                className="j-mark focus-ember"
                onClick={() => {
                  onChange(v);
                  setEditing(false);
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ entry, onChange }: { entry: JudgeEntry; onChange: (e: JudgeEntry) => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ entry: JudgeEntry }>(`/judge/entries/${entry.id}`, { method: "PATCH", body });
      onChange(r.entry);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/judge/entries/${entry.id}`, { method: "DELETE" });
      navigate("/judge");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const toggle = (label: string, hint: string, value: boolean, key: string) => (
    <label className="flex cursor-pointer items-start gap-3 font-body text-[15px] text-foreground/90">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(24_100%_54%)]" checked={value} disabled={busy} onChange={(e) => patch({ [key]: e.target.checked })} />
      <span>
        {label}
        <span className="p-hint block">{hint}</span>
      </span>
    </label>
  );

  return (
    <details className="jd-org group">
      <summary className="focus-ember">
        Organizer
        <span className="font-normal text-concrete">let the team edit again, delete</span>
        <ChevronDown size={16} strokeWidth={1.5} className="jd-chev" aria-hidden="true" />
      </summary>
      <div className="mt-4 flex flex-col gap-5">
        {toggle("Let the team edit again", "Reopens their edit link after the deadline.", entry.unlocked, "unlocked")}
        {error && <p className="p-notice p-notice--bad font-body text-sm">{error}</p>}
        <div className="mt-2 border border-[hsl(var(--destructive)/0.35)] p-4">
          <p className="font-body text-sm text-foreground/85">Delete this entry, its files and every judge's marks. This can't be undone.</p>
          <label className="mt-3 block">
            <span className="p-hint">Type the entry's title to confirm</span>
            <input className="p-input mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <button type="button" className="btn-ghost p-btn p-btn-sm mt-3 border-[hsl(var(--destructive)/0.6)] text-[hsl(6_90%_66%)]" disabled={busy || confirm.trim() !== entry.title} onClick={remove}>
            Delete entry
          </button>
        </div>
      </div>
    </details>
  );
}
