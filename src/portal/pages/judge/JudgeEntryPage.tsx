// One entry, for judging: the model large on the left (doubles as the
// presentation screen: full screen, turntable), everything the team wrote
// and every file on the right, then this judge's marks. Organizers also get
// the entry's switches: award, gallery, hide, reopen, delete.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, ExternalLink } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import { formatBytes, isViewable, type ViewableExt } from "../../shared/formats";
import { AWARDS, CRITERIA, MARK_MAX, MAX_TOTAL, totalOf } from "../../shared/judging";
import type { JudgeEntry, Score } from "../../shared/schema";
import type { Measure, Spec } from "../../shared/checks";
import { ChecksPanel, MeasurePanel, ProcessPanel } from "./panels";
import ModelViewer from "../../viewer/ModelViewer";
import VideoPlayer from "../../components/VideoPlayer";
import { parseVideoLink } from "../../shared/video";
import { JudgeShell, useMe } from "./context";
import PresentTimer from "./PresentTimer";

interface EntryResponse {
  entry: JudgeEntry;
  prev: string | null;
  next: string | null;
  /** This judge's next unmarked entry (fewest marks first). */
  nextToMark: string | null;
  toMark: number;
  total: number;
  spec: Spec | null;
}

export default function JudgeEntryPage() {
  const { id = "" } = useParams();
  const { me, signOut } = useMe();
  const navigate = useNavigate();
  const [data, setData] = useState<EntryResponse | null>(null);
  const [error, setError] = useState("");
  // Measured live from the actual file in this browser (not what the team's browser reported).
  const [liveMeasure, setLiveMeasure] = useState<Measure | null>(null);

  useEffect(() => {
    setData(null);
    setError("");
    api<EntryResponse>(`/judge/entries/${id}`)
      .then(setData)
      .catch((e: ApiError) => (e.status === 401 ? signOut() : setError(e.message)));
  }, [id, signOut]);

  // ←/→ move between entries when focus isn't in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [role=radiogroup], canvas") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && data?.prev) navigate(`/judge/entry/${data.prev}`);
      if (e.key === "ArrowRight" && data?.next) navigate(`/judge/entry/${data.next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, navigate]);

  const e = data?.entry;
  const model = e?.files.find((f) => f.slot === "model");
  const source = e?.files.find((f) => f.slot === "source");
  const images = e?.files.filter((f) => f.slot === "image") ?? [];
  const videoFile = e?.files.find((f) => f.slot === "video") ?? null;
  const videoLink = (() => {
    const v = e?.videoLink ? parseVideoLink(e.videoLink) : null;
    return v ? { url: v.url, host: v.host, embed: v.embed } : null;
  })();

  return (
    <JudgeShell section="Judging">
      <div className="flex items-center justify-between gap-3 pt-4">
        <Link to="/judge" className="focus-ember inline-flex min-h-10 items-center gap-1.5 font-body text-sm text-concrete hover:text-foreground">
          <ArrowLeft size={15} strokeWidth={1.5} /> All entries
        </Link>
        <div className="flex items-center gap-2">
          {data && (
            <span className="p-mono mr-1 hidden text-[12px] text-concrete sm:inline">
              {data.total - data.toMark}/{data.total} marked
            </span>
          )}
          <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!data?.prev} onClick={() => data?.prev && navigate(`/judge/entry/${data.prev}`)}>
            <ArrowLeft size={15} strokeWidth={1.5} /> Newer
          </button>
          <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={!data?.next} onClick={() => data?.next && navigate(`/judge/entry/${data.next}`)}>
            Older <ArrowRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {error && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] xl:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {/* The team's video first (what they present), then their 3D model if they added one. */}
          {e && (videoFile || videoLink) && (
            <>
              <VideoPlayer title={e.title} file={videoFile} link={videoLink} poster={e.files.find((f) => f.slot === "thumb")?.url} />
              {videoLink && e.videoCheck && e.videoCheck.status !== "public" && (
                <p className="p-notice p-notice--calm font-body text-sm">Link check: {e.videoCheck.note}</p>
              )}
            </>
          )}
          {e && !videoFile && !videoLink && <p className="p-notice font-body text-sm">This entry has no video.</p>}
          {(!e || model) && (
            <ModelViewer
              source={model && isViewable(model.ext) ? { kind: "url", url: model.url, ext: model.ext as ViewableExt } : null}
              upAxis={e?.upAxis ?? "y"}
              units={e?.units ?? "mm"}
              spec={data?.spec ?? null}
              onMeasure={setLiveMeasure}
              label={e ? `${e.title}, 3D model` : "3D model"}
              className={videoFile || videoLink ? "aspect-[16/10] w-full" : "h-[56vh] min-h-[320px] w-full lg:h-[calc(100dvh-7.5rem)]"}
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
            <PresentTimer />
            <div className="mt-5 flex flex-wrap gap-1.5">
              {e.late && <span className="p-tag p-tag--bad">Submitted after the deadline</span>}
              {e.award && <span className="p-tag p-tag--solid">{e.award}</span>}
              {e.status !== "submitted" && <span className="p-tag">Draft</span>}
              {e.hidden && <span className="p-tag">Hidden from public</span>}
              {!e.shareable && <span className="p-tag">Team kept it private</span>}
            </div>
            <h1 className="mt-3 font-body text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-bone">{e.title}</h1>
            <p className="mt-2 font-body text-[15px] text-concrete">
              Submitted {clock(e.submittedAt)}
              {e.teamName ? ` · ${e.teamName}` : ""}
            </p>

            <table className="j-table mt-6">
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">School</th>
                  <th scope="col" className="num">
                    Gr.
                  </th>
                </tr>
              </thead>
              <tbody>
                {e.members.map((m, i) => (
                  <tr key={i}>
                    <td className="text-foreground">{m.name}</td>
                    <td className="text-foreground/75">{m.school}</td>
                    <td className="num">{m.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {me.role === "admin" && <p className="p-hint mt-2">Contact: {e.contactEmail}</p>}

            <dl className="mt-7 flex flex-col gap-6 font-body">
              <div>
                <dt className="text-sm font-medium text-concrete">Software</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.software.map((s) => (
                    <span key={s} className="p-tag">
                      {s === "Other" && e.softwareOther ? e.softwareOther : s}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-concrete">How it answers the theme</dt>
                <dd className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{e.summary}</dd>
              </div>
              {e.presentation && (
                <div>
                  <dt className="text-sm font-medium text-concrete">Their presentation</dt>
                  <dd className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{e.presentation}</dd>
                </div>
              )}
              {e.process && (
                <div>
                  <dt className="text-sm font-medium text-concrete">What to look for</dt>
                  <dd className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{e.process}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-concrete">AI tools</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">{e.aiUse === "some" ? e.aiNote : "None used."}</dd>
              </div>
            </dl>

            <ScoreForm key={e.id} entryId={e.id} initial={e.myScore} scoreCount={e.scoreCount} next={data?.nextToMark ?? null} />

            <h2 className="mt-12 border-t border-bone/10 pt-6 font-body text-lg font-semibold tracking-[-0.01em] text-bone">Files and checks</h2>
            {images.length > 0 && (
              <ul className="mt-6 grid grid-cols-2 gap-2" aria-label="Renders">
                {images.map((img, i) => (
                  <li key={img.id}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="focus-ember block overflow-hidden rounded-[2px] border border-bone/10">
                      <img src={img.url} alt={`Render ${i + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-6 flex flex-col gap-1.5">
              {[model, source].filter(Boolean).map((f) => (
                <li key={f!.id}>
                  <a href={f!.url} download={f!.name} className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                    <Download size={15} strokeWidth={1.5} className="text-ember" />
                    <span className="truncate">{f!.name}</span>
                    <span className="p-mono text-[11px] text-concrete">{formatBytes(f!.size)}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`/entry/${e.id}`} target="_blank" rel="noopener" className="focus-ember flex items-center gap-2 font-body text-sm text-foreground/85 hover:text-foreground">
                  <ExternalLink size={15} strokeWidth={1.5} className="text-ember" /> Share page
                </a>
              </li>
            </ul>

            <MeasurePanel measure={liveMeasure} spec={data?.spec ?? null} reported={e.measure} />
            <ProcessPanel entry={e} />
            <ChecksPanel entry={e} admin={me.role === "admin"} onChange={(entry) => setData((d) => (d ? { ...d, entry } : d))} />


            {me.role === "admin" && <AdminPanel entry={e} onChange={(entry) => setData((d) => (d ? { ...d, entry } : d))} />}
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

function ScoreForm({ entryId, initial, scoreCount, next }: { entryId: string; initial: Score | null; scoreCount: number; next: string | null }) {
  const navigate = useNavigate();
  const [unsaved] = useState(() => readUnsaved(entryId));
  const [marks, setMarks] = useState<Record<string, number>>(unsaved?.marks ?? initial?.marks ?? {});
  const [notes, setNotes] = useState(unsaved?.notes ?? initial?.notes ?? "");
  const [savedAt, setSavedAt] = useState(initial?.updatedAt ?? "");
  const [dirty, setDirty] = useState(!!unsaved);
  useEffect(() => {
    if (dirty) writeUnsaved(entryId, { marks, notes });
  }, [dirty, entryId, marks, notes]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = useMemo(() => totalOf(marks), [marks]);

  async function save(goNext: boolean) {
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

  // Unsaved marks: warn before leaving the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <section aria-labelledby="marks-h" className="mt-10 border-t border-bone/10 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="marks-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
          Your marks
        </h2>
        <span className="p-mono text-sm text-foreground/85" aria-live="polite">
          {total !== null ? `${total}/${MAX_TOTAL}` : `—/${MAX_TOTAL}`}
        </span>
      </div>
      <p className="p-hint mt-1">
        1 to {MARK_MAX} each. {scoreCount} {scoreCount === 1 ? "judge has" : "judges have"} marked this entry. Others' marks stay hidden.
      </p>
      <div className="mt-5 flex flex-col gap-5">
        {CRITERIA.map((c) => (
          <div key={c.id}>
            <p id={`c-${c.id}`} className="font-body text-[15px] font-medium text-foreground">
              {c.label}
              <span className="ml-2 font-normal text-concrete">{marks[c.id] ? `${marks[c.id]}/${MARK_MAX}` : ""}</span>
            </p>
            <p className="p-hint">{c.hint}</p>
            <div className="j-marks mt-2" role="radiogroup" aria-labelledby={`c-${c.id}`}>
              {Array.from({ length: MARK_MAX }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={marks[c.id] === v}
                  aria-label={`${v} out of ${MARK_MAX}`}
                  tabIndex={marks[c.id] ? (marks[c.id] === v ? 0 : -1) : v === 1 ? 0 : -1}
                  data-on={marks[c.id] ? v <= marks[c.id] : false}
                  className="j-mark focus-ember"
                  onClick={() => {
                    setMarks((m) => ({ ...m, [c.id]: v }));
                    setDirty(true);
                  }}
                  onKeyDown={(e) => {
                    const cur = marks[c.id] ?? 0;
                    let nextV = 0;
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") nextV = Math.min(MARK_MAX, cur + 1);
                    if (e.key === "ArrowLeft" || e.key === "ArrowDown") nextV = Math.max(1, cur - 1 || 1);
                    if (nextV) {
                      e.preventDefault();
                      setMarks((m) => ({ ...m, [c.id]: nextV }));
                      setDirty(true);
                      const group = e.currentTarget.parentElement;
                      requestAnimationFrame(() => (group?.children[nextV - 1] as HTMLElement | undefined)?.focus());
                    }
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <label className="block">
          <span className="p-label">Notes</span>
          <span className="p-hint block">For you and the organizers. Teams never see these.</span>
          <textarea
            className="p-textarea mt-2 min-h-[5.5rem]"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        {error && <p className="p-notice p-notice--bad font-body text-sm">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-portal p-btn" disabled={busy || total === null} onClick={() => save(true)}>
            {next ? "Save and judge next" : "Save marks"}
          </button>
          {next && (
            <button type="button" className="btn-ghost p-btn" disabled={busy || total === null} onClick={() => save(false)}>
              Save
            </button>
          )}
          <span className="font-body text-sm text-concrete" role="status">
            {busy ? "Saving…" : dirty ? (unsaved ? "Not saved yet (kept from before)" : "Not saved yet") : savedAt ? `Saved ${clock(savedAt)}` : total === null ? "Mark every criterion to save" : ""}
          </span>
        </div>
      </div>
    </section>
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
