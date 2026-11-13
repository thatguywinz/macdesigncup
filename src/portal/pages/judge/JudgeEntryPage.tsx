// One entry, for judging at the table. Kept simple: the team's pictures,
// video or model on the left (what they show while they present), and on the
// right what they wrote and the rubric, with a save bar that stays in reach.
// Everything else (files, measurements, originality checks, organizer
// switches) is folded away below. /judge/practice shows a made-up entry with
// the same screen, so anyone can try marking before the day.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown, Download, ExternalLink } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import { formatBytes, isViewable, type ViewableExt } from "../../shared/formats";
import { AWARDS, CRITERIA, MARK_MAX, MAX_TOTAL, levelOf, totalOf, type Criterion } from "../../shared/judging";
import type { JudgeEntry, Score } from "../../shared/schema";
import type { Measure, Spec } from "../../shared/checks";
import { ChecksPanel, MeasurePanel, ProcessPanel } from "./panels";
import ModelViewer from "../../viewer/ModelViewer";
import VideoPlayer from "../../components/VideoPlayer";
import { parseVideoLink } from "../../shared/video";
import { JudgeShell, useMe } from "./context";
import { PRACTICE_ID, practiceEntry } from "./practice";

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

  useEffect(() => {
    setData(null);
    setError("");
    setShown(0);
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

  return (
    <JudgeShell section="Judging">
      <div className="flex items-center justify-between gap-3 pt-4">
        <Link to="/judge" className="focus-ember inline-flex min-h-10 items-center gap-1.5 font-body text-sm text-concrete hover:text-foreground">
          <ArrowLeft size={15} strokeWidth={1.5} /> All entries
        </Link>
        {data && !practice && (
          <span className="p-mono text-[12px] text-concrete">
            You've marked {data.total - data.toMark} of {data.total}
          </span>
        )}
      </div>

      {practice ? (
        <p className="p-notice mt-3 font-body text-[15px]">
          <span className="font-semibold text-bone">Practice.</span> A made-up entry so you can try marking. Nothing you do here is saved or counted.
        </p>
      ) : (
        data &&
        me.role === "admin" && (
          <p className="p-notice p-notice--calm mt-3 font-body text-sm">
            You're an organizer. This is the judges' screen, plus the Organizer section at the bottom.{" "}
            {data.marksCount === false
              ? "Marks you save here don't count: only judges on the judges list count in Results."
              : "Marks you save here count in Results, as one more judge."}
          </p>
        )
      )}

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
        {/* What the team shows. */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {pic && (
            <div>
              <a href={pic.url} target="_blank" rel="noopener noreferrer" className="focus-ember block overflow-hidden rounded-[2px] border border-bone/10 bg-[#0d0e10]">
                <img src={pic.url} alt={`${e?.title}, picture ${shown + 1}`} className="max-h-[64vh] w-full object-contain" />
              </a>
              {images.length > 1 && (
                <div className="mt-2 flex gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`focus-ember overflow-hidden rounded-[2px] border ${i === shown ? "border-ember" : "border-bone/10"}`}
                      onClick={() => setShown(i)}
                      aria-label={`Picture ${i + 1}`}
                      aria-pressed={i === shown}
                    >
                      <img src={img.url} alt="" className="h-14 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {e && (videoFile || videoLink) && (
            <>
              <VideoPlayer title={e.title} file={videoFile} link={videoLink} poster={e.files.find((f) => f.slot === "thumb")?.url} />
              {videoLink && e.videoCheck && e.videoCheck.status !== "public" && <p className="p-notice p-notice--calm font-body text-sm">Link check: {e.videoCheck.note}</p>}
            </>
          )}
          {(!e || model) && (
            <ModelViewer
              source={model && isViewable(model.ext) ? { kind: "url", url: model.url, ext: model.ext as ViewableExt } : null}
              upAxis={e?.upAxis ?? "y"}
              units={e?.units ?? "mm"}
              spec={data?.spec ?? null}
              onMeasure={setLiveMeasure}
              label={e ? `${e.title}, 3D model` : "3D model"}
              className={pic || videoFile || videoLink ? "aspect-[16/10] w-full" : "h-[56vh] min-h-[320px] w-full lg:h-[calc(100dvh-7.5rem)]"}
              empty={<span className="font-body text-sm text-concrete">{e ? "This entry has no viewable model." : ""}</span>}
            />
          )}
        </div>

        {!e ? (
          <p className="font-body text-concrete" role="status">
            {error ? "" : "Loading…"}
          </p>
        ) : (
          <div className="min-w-0 pb-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {e.slot && (
                <span className="p-tag p-mono">
                  {e.slot.room} · {clock(e.slot.at)}
                </span>
              )}
              {e.late && <span className="p-tag p-tag--bad">Submitted late</span>}
              {reviews > 0 && <span className="p-tag p-tag--ember">Originality check to review</span>}
              {e.award && <span className="p-tag p-tag--solid">{e.award}</span>}
              {e.status !== "submitted" && <span className="p-tag">Draft</span>}
            </div>
            <h1 className="mt-3 font-body text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-bone">{e.title}</h1>
            <p className="mt-2 font-body text-[15px] text-foreground/80">
              {e.members.map((m) => m.name).join(", ")}
              {e.teamName ? <span className="text-concrete"> · {e.teamName}</span> : null}
            </p>
            <p className="font-body text-[13px] text-concrete">
              {[...new Set(e.members.map((m) => m.school))].join(", ")} · grade {[...new Set(e.members.map((m) => m.grade))].join(", ")}
            </p>

            <p className="mt-5 whitespace-pre-line font-body text-[15px] leading-relaxed text-foreground/90">{e.summary}</p>
            {e.process && <p className="mt-3 whitespace-pre-line font-body text-[14px] leading-relaxed text-foreground/70">{e.process}</p>}
            <p className="mt-3 font-body text-[13px] text-concrete">
              {e.software.map((s) => (s === "Other" && e.softwareOther ? e.softwareOther : s)).join(", ")} · AI: {e.aiUse === "some" ? e.aiNote : "none"}
            </p>

            <ScoreForm key={e.id} entryId={e.id} initial={e.myScore} scoreCount={e.scoreCount} next={data?.nextToMark ?? null} practice={practice} />

            {!practice && (
            <>
            <details className="group mt-10 border-t border-bone/10 pt-5">
              <summary className="focus-ember flex cursor-pointer list-none items-center justify-between gap-3 font-body text-[15px] font-medium text-foreground marker:hidden">
                Files, measurements and checks
                <ChevronDown size={16} strokeWidth={1.5} className="text-concrete transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="mt-5 flex flex-col gap-1.5">
                {[model, source].filter(Boolean).map((f) => (
                  <li key={f!.id}>
                    <a href={f!.url} download={f!.name} className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                      <Download size={15} strokeWidth={1.5} className="text-ember" />
                      <span className="truncate">{f!.name}</span>
                      <span className="p-mono text-[11px] text-concrete">{formatBytes(f!.size)}</span>
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
              {me.role === "admin" && <p className="p-hint mt-3">Contact: {e.contactEmail}</p>}
              {model && <MeasurePanel measure={liveMeasure} spec={data?.spec ?? null} reported={e.measure} />}
              <ProcessPanel entry={e} />
              <ChecksPanel entry={e} admin={me.role === "admin"} onChange={(entry) => setData((d) => (d ? { ...d, entry } : d))} />
            </details>

            <div className="mt-8 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!data?.prev} onClick={() => data?.prev && navigate(`/judge/entry/${data.prev}`)}>
                <ArrowLeft size={15} strokeWidth={1.5} /> Newer entry
              </button>
              <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!data?.next} onClick={() => data?.next && navigate(`/judge/entry/${data.next}`)}>
                Older entry <ArrowRight size={15} strokeWidth={1.5} />
              </button>
            </div>

            {me.role === "admin" && <AdminPanel entry={e} onChange={(entry) => setData((d) => (d ? { ...d, entry } : d))} />}
            </>
            )}
          </div>
        )}
      </div>
    </JudgeShell>
  );
}

// Marks not saved yet, kept on this device per entry, so moving to another
// entry (or a refresh) mid-presentation doesn't lose them.
const unsavedKey = (id: string) => `mdc-marks-${id}`;
function readUnsaved(id: string): { marks: Record<string, number>; notes: string } | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(unsavedKey(id)) ?? "null");
    return v && typeof v === "object" && v.marks ? v : null;
  } catch {
    return null;
  }
}
function writeUnsaved(id: string, v: { marks: Record<string, number>; notes: string } | null) {
  try {
    if (v) sessionStorage.setItem(unsavedKey(id), JSON.stringify(v));
    else sessionStorage.removeItem(unsavedKey(id));
  } catch {
    /* fine */
  }
}

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
  const [unsaved] = useState(() => (practice ? null : readUnsaved(entryId)));
  const [marks, setMarks] = useState<Record<string, number>>(unsaved?.marks ?? initial?.marks ?? {});
  const [notes, setNotes] = useState(unsaved?.notes ?? initial?.notes ?? "");
  const [savedAt, setSavedAt] = useState(initial?.updatedAt ?? "");
  const [dirty, setDirty] = useState(!!unsaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = useMemo(() => totalOf(marks), [marks]);
  const done = CRITERIA.filter((c) => typeof marks[c.id] === "number").length;
  const sum = CRITERIA.reduce((n, c) => n + (typeof marks[c.id] === "number" ? marks[c.id] : 0), 0);

  useEffect(() => {
    if (dirty && !practice) writeUnsaved(entryId, { marks, notes });
  }, [dirty, entryId, marks, notes, practice]);

  // Unsaved marks: warn before leaving the tab.
  useEffect(() => {
    if (!dirty || practice) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
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
    try {
      const r = await api<{ score: Score }>(`/judge/entries/${entryId}/score`, { method: "PUT", body: { marks, notes } });
      setSavedAt(r.score.updatedAt);
      setDirty(false);
      writeUnsaved(entryId, null);
      if (goNext && next) navigate(`/judge/entry/${next}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const setMark = (id: string, v: number) => {
    setMarks((m) => ({ ...m, [id]: v }));
    setDirty(true);
  };

  const left = CRITERIA.length - done;
  const status = busy
    ? "Saving…"
    : total === null
      ? `${left} ${left === 1 ? "category" : "categories"} left to mark`
      : dirty
        ? unsaved
          ? "Not saved yet (kept from before)"
          : "Not saved yet"
        : savedAt
          ? practice
            ? "Saved (practice: nothing was sent)"
            : `Saved at ${clock(savedAt)}`
          : "All marked: ready to save";
  const goesNext = !!next;

  return (
    <section aria-labelledby="marks-h" className="mt-8 border-t border-bone/10 pt-6">
      <h2 id="marks-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
        Your marks
      </h2>
      <ol className="mt-3 grid gap-2 font-body text-[14px] leading-snug text-foreground/80 sm:grid-cols-3">
        {[
          "Listen to the team's 1-minute pitch.",
          "In each category, tap the description that fits, then the points.",
          goesNext ? "Press Save and judge next." : "Press Save marks.",
        ].map((t, i) => (
          <li key={i} className="flex gap-2.5 border border-bone/10 bg-[hsl(220_7%_5.5%)] px-3 py-2.5">
            <span className="p-mono text-ember" aria-hidden="true">
              {i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      {!practice && (
        <p className="p-hint mt-3">
          {scoreCount === 0 ? "No judge has marked this entry yet." : `${scoreCount} ${scoreCount === 1 ? "judge has" : "judges have"} marked this entry.`} Other judges' marks
          stay hidden from you.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {CRITERIA.map((c, i) => (
          <RubricRow key={c.id} n={i + 1} c={c} value={marks[c.id]} onChange={(v) => setMark(c.id, v)} />
        ))}
        <label className="mt-2 block">
          <span className="p-label">Notes</span>
          <span className="p-hint block">Optional. For you and the organizers; teams never see these.</span>
          <textarea
            className="p-textarea mt-2 min-h-[4.5rem]"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
          />
        </label>
      </div>

      {/* Stays at the bottom of the screen while the rubric is in view, so saving is always one tap away. */}
      <div className="j-savebar">
        {error && <p className="p-notice p-notice--bad mb-3 font-body text-sm">{error}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[2rem] leading-none text-bone">{sum}</span>
            <span className="font-body text-base text-concrete">/{MAX_TOTAL}</span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {CRITERIA.map((c) => (
              <span key={c.id} className="j-pip" data-on={typeof marks[c.id] === "number" ? "true" : undefined} title={c.label} />
            ))}
          </div>
          <span className="min-w-[9rem] flex-1 font-body text-sm text-concrete" role="status">
            {status}
          </span>
          <div className="flex flex-wrap gap-2">
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
          <p className="mt-3 font-body text-sm text-foreground/85">
            That's all there is to it. On the day, "Save and judge next" takes you straight to the next team in your room.{" "}
            <Link to="/judge" className="p-link focus-ember">
              Back to entries
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

/** One rubric category: four levels with their description, then the points within the chosen level. */
function RubricRow({ n, c, value, onChange }: { n: number; c: Criterion; value: number | undefined; onChange: (v: number) => void }) {
  const marked = typeof value === "number";
  const [level, setLevel] = useState<number | null>(marked ? levelOf(value) : null);
  const lv = level !== null ? c.levels[level] : null;
  const pickedHere = marked && level !== null && levelOf(value) === level;
  return (
    <div role="group" aria-labelledby={`c-${c.id}`} className="j-crit" data-done={marked ? "true" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={`c-${c.id}`} className="font-body text-[16px] font-semibold text-foreground">
            <span className="p-mono mr-2 text-[12px] text-concrete" aria-hidden="true">
              {n}/{CRITERIA.length}
            </span>
            {c.label}
          </p>
          <p className="mt-0.5 font-body text-[13px] text-concrete">{c.hint}</p>
        </div>
        <span className={`p-mono shrink-0 text-base ${marked ? "text-ember" : "text-concrete"}`}>
          {marked ? value : "–"}/{MARK_MAX}
        </span>
      </div>
      <div className="j-levels mt-3">
        {c.levels.map((l, i) => (
          <button
            key={i}
            type="button"
            className="j-level focus-ember"
            aria-pressed={level === i}
            data-has={marked && levelOf(value) === i ? "true" : undefined}
            onClick={() => setLevel(i)}
          >
            <span className="p-mono text-[11px]">
              {l.min}–{l.max} pts
            </span>
            <span className="j-level-text">{l.text}</span>
          </button>
        ))}
      </div>
      {lv && (
        <div className="mt-3">
          <p className={`font-body text-[13px] ${pickedHere ? "text-concrete" : "text-ember"}`}>
            {pickedHere ? "Points (tap another to change)" : `Now tap the points, ${lv.min} to ${lv.max}`}
          </p>
          <div className="j-points mt-1.5" role="radiogroup" aria-label={`${c.label}: points from ${lv.min} to ${lv.max}`}>
            {Array.from({ length: lv.max - lv.min + 1 }, (_, i) => lv.min + i).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={value === v}
                aria-label={`${v} out of ${MARK_MAX}`}
                className="j-mark focus-ember"
                onClick={() => onChange(v)}
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
    <section aria-labelledby="admin-h" className="mt-10 border-t border-bone/10 pt-6">
      <h2 id="admin-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
        Organizer
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        <label className="block max-w-[18rem]">
          <span className="p-label">Award</span>
          <select className="p-select mt-2" value={entry.award} disabled={busy} onChange={(e) => patch({ award: e.target.value })}>
            {AWARDS.map((a) => (
              <option key={a} value={a}>
                {a || "None"}
              </option>
            ))}
          </select>
        </label>
        {toggle("Pick for the public page", "Shown on /submissions when Settings is set to \"Only the ones I pick\", if the team allowed public viewing.", entry.gallery, "gallery")}
        {toggle("Hide from the public", "The share link stops working for everyone but judges.", entry.hidden, "hidden")}
        {toggle("Let the team edit again", "Reopens their edit link after the deadline.", entry.unlocked, "unlocked")}
        {toggle("Mark as late", "Judges see the late flag on the card.", entry.late, "late")}
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
    </section>
  );
}
