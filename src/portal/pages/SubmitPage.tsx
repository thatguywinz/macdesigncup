// /submit and /submit/edit/:id. One form for both: a new entry needs the
// day's entry code; an existing one is opened with its private edit link
// (the key rides in the URL fragment, which browsers never send to servers).
//
// The form is three steps: 1 Team, 2 Design, 3 Check & submit. A new entry
// moves forward only when the step's required fields pass (the same
// parseEntry rules the server runs); an existing entry opens on the review
// and can jump to any step.
//
// Submitting runs in order: save the details (creating the entry if new),
// upload each new file with its own progress bar, capture a still of the
// model as the card thumbnail, then mark the entry submitted. If a step
// fails, the entry is already saved and the page is on its edit link, so
// pressing the button again picks up where it stopped.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, FileBox, ImagePlus, PenTool, Plus, Trash2, Upload, Video, X } from "lucide-react";
import VideoPlayer, { captureVideoFrame } from "../components/VideoPlayer";
import { VideoChoice, VideoGuide } from "../components/VideoStep";
import { JudgingBriefing, SlotNotice } from "../components/Briefing";
import DeadlineBar from "../components/DeadlineBar";
import { parseVideoLink } from "../shared/video";
import Shell from "../components/Shell";
import { Field, Progress } from "../components/fields";
import { ApiError, api, clock, when } from "../api";
import { countdown, forgetEntry, rememberEntry, savedEntries, useMediaQuery, useNow, usePortalStatus } from "../hooks";
import { SLOTS, checkFile, extOf, formatBytes, isViewable, type FileSlot } from "../shared/formats";
import {
  GRADES,
  LIMITS,
  SOFTWARE,
  TEAM_MAX,
  WORDS,
  emptyEntry,
  wordCount,
  parseEntry,
  publicCredit,
  type EntryInput,
  type FieldErrors,
  type FileView,
  type OwnEntry,
} from "../shared/schema";
import { uploadFile } from "../upload";
import { CAD_LINK_HINT, UNITS, formatMeasure, hasSpec, specCheck, type Measure, type Spec, type Units } from "../shared/checks";
import ModelViewer, { type CaptureFn, type ModelSource } from "../viewer/ModelViewer";

type Item = { kind: "existing"; view: FileView } | { kind: "new"; key: string; file: File; progress: number; error?: string };

type Files = Record<Exclude<FileSlot, "thumb">, Item[]>;

const noFiles = (): Files => ({ video: [], model: [], image: [], progress: [], source: [] });

function filesFrom(entry: OwnEntry): Files {
  const f = noFiles();
  for (const v of entry.files) if (v.slot !== "thumb") f[v.slot].push({ kind: "existing", view: v });
  return f;
}

const newKey = () => Math.random().toString(36).slice(2);

// ── Steps ─────────────────────────────────────

type Step = 0 | 1 | 2;
const STEP_NAMES = ["Team", "Design", "Check & submit"] as const;
const LAST: Step = 2;

/** Which step shows a field (and so which step an error sends the team back to). */
function stepOf(field: string): Step {
  if (field === "code" || field === "teamName" || field === "contactEmail" || field.startsWith("members")) return 0;
  if (field === "aiNote" || field === "original" || field === "filesNote" || field === "credit" || field === "shareable") return 2;
  return 1;
}

const CODE_NEEDED = "Enter the code from the screen at the front of the room.";
const VISUAL_NEEDED = "Add at least one picture (a render or screenshot), or a video or your 3D model.";

// What a team has typed into a new entry, kept on this device until the entry
// is first saved, so a refresh or a closed tab doesn't lose it. Files can't be
// kept this way; they're picked again.
const TYPED_KEY = "mdc-portal-typed";
interface Typed {
  form: EntryInput;
  code: string;
  videoMode: "link" | "upload";
  step?: number;
}
function readTyped(): Typed | null {
  try {
    const v = JSON.parse(localStorage.getItem(TYPED_KEY) ?? "null");
    return v && typeof v === "object" && v.form && typeof v.form === "object" ? v : null;
  } catch {
    return null;
  }
}
function writeTyped(t: Typed | null) {
  try {
    if (t) localStorage.setItem(TYPED_KEY, JSON.stringify(t));
    else localStorage.removeItem(TYPED_KEY);
  } catch {
    /* private mode: nothing kept */
  }
}
const typedIsEmpty = (f: EntryInput) =>
  !f.title && !f.teamName && !f.summary && !f.videoLink && !f.contactEmail && f.members.every((m) => !m.name && !m.school);

/** What was typed here before, if anything worth restoring. */
function restorable(): Typed | null {
  const t = readTyped();
  return t && !typedIsEmpty({ ...emptyEntry(), ...t.form }) ? t : null;
}

/** Reads the edit key from the URL fragment (#k=...), else from this device. */
function editKeyFor(id: string | undefined, hash: string): string {
  if (!id) return "";
  const m = /[#&]k=([A-Za-z0-9_-]{20,100})/.exec(hash);
  if (m) return m[1];
  return savedEntries().find((s) => s.id === id)?.key ?? "";
}

const asStep = (n: unknown): Step => (n === 1 || n === 2 ? n : 0);

export default function SubmitPage() {
  const { id: routeId } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { status, serverOffset } = usePortalStatus();
  const now = useNow(1000, serverOffset);

  // A new entry picks up what was typed here before (until it's first saved).
  const [initial] = useState(() => (routeId ? null : restorable()));
  const [entryId, setEntryId] = useState<string | undefined>(routeId);
  const [editKey, setEditKey] = useState(() => editKeyFor(routeId, hash));
  const [form, setForm] = useState<EntryInput>(() => (initial ? { ...emptyEntry(), ...initial.form } : emptyEntry()));
  const [code, setCode] = useState(initial?.code ?? "");
  const [files, setFiles] = useState<Files>(noFiles);
  const [removed, setRemoved] = useState<string[]>([]);
  const [saved, setSaved] = useState<OwnEntry | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(!!routeId);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [done, setDone] = useState(false);
  const [draftSaved, setDraftSaved] = useState("");
  const [measure, setMeasure] = useState<Measure | null>(null);
  const [videoMode, setVideoMode] = useState<"link" | "upload">(initial?.videoMode === "upload" ? "upload" : "link");
  const [restored, setRestored] = useState(!!initial);
  // An existing entry opens on the review, where everything is at a glance.
  const [step, setStep] = useState<Step>(() => (routeId ? LAST : asStep(initial?.step)));
  const [reached, setReached] = useState<Step>(step);
  const captureRef = useRef<CaptureFn | null>(null);
  const savedAxis = useRef<"y" | "z">("y");
  const stepsRef = useRef<HTMLElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  /** The next step change should scroll to the first error, not the top. */
  const errorScroll = useRef(false);

  const isEdit = !!entryId;
  const wide = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (entryId) return;
    const t = window.setTimeout(() => writeTyped(typedIsEmpty(form) && !code ? null : { form, code, videoMode, step }), 400);
    return () => window.clearTimeout(t);
  }, [form, code, videoMode, step, entryId]);
  const startOver = () => {
    writeTyped(null);
    setForm(emptyEntry());
    setCode("");
    setFiles(noFiles());
    setErrors({});
    setRestored(false);
    setStep(0);
    setReached(0);
  };

  // Open an existing entry. Skipped when this page just created it: the URL
  // moves to the edit link mid-submit, and reloading then would swap the
  // picked files for server copies while they are still uploading.
  const createdHere = useRef<string | null>(null);
  useEffect(() => {
    if (!routeId || createdHere.current === routeId) return;
    const key = editKeyFor(routeId, hash);
    setEditKey(key);
    setEntryId(routeId);
    if (!key) {
      setLoadError("This edit link is missing its key. Open the full link you saved when you submitted.");
      setLoading(false);
      return;
    }
    setLoading(true);
    api<{ entry: OwnEntry }>(`/entries/${routeId}`, { editKey: key })
      .then(({ entry }) => {
        const { id, status: _s, submittedAt: _a, late: _l, files: _f, locked: _k, notices: _n, ...input } = entry;
        setForm(input);
        setFiles(filesFrom(entry));
        if (entry.files.some((f) => f.slot === "video") && !entry.videoLink) setVideoMode("upload");
        setSaved(entry);
        savedAxis.current = entry.upAxis;
        rememberEntry({ id, key, title: entry.title, at: new Date().toISOString() });
        setLoadError("");
      })
      .catch((e: ApiError) => setLoadError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per entry
  }, [routeId]);

  const set = useCallback(<K extends keyof EntryInput>(k: K, v: EntryInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as string] || (k === "videoLink" && e.visuals) ? { ...e, [k]: undefined, ...(k === "videoLink" ? { visuals: undefined } : {}) } : e));
  }, []);

  const setMember = (i: number, patch: Partial<EntryInput["members"][number]>) => {
    setForm((f) => ({ ...f, members: f.members.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[`members.${i}.${k}`];
      return next;
    });
  };

  // ── Files ─────────────────────────────────
  const addFiles = (slot: keyof Files, list: FileList | File[]) => {
    const picked = Array.from(list);
    const problems: string[] = [];
    setFiles((cur) => {
      const next = { ...cur };
      for (const file of picked) {
        const problem = checkFile(slot, file.name, file.size);
        if (problem) {
          problems.push(problem);
          continue;
        }
        const item: Item = { kind: "new", key: newKey(), file, progress: 0 };
        if (SLOTS[slot].maxCount === 1) {
          for (const old of next[slot]) if (old.kind === "existing") setRemoved((r) => [...r, old.view.id]);
          next[slot] = [item];
        } else if (next[slot].length < SLOTS[slot].maxCount) {
          next[slot] = [...next[slot], item];
        } else {
          problems.push(`Up to ${SLOTS[slot].maxCount} images.`);
        }
      }
      return next;
    });
    setErrors((e) => ({ ...e, [slot]: problems[0], visuals: undefined }));
  };

  const removeItem = (slot: keyof Files, item: Item) => {
    if (item.kind === "existing") setRemoved((r) => [...r, item.view.id]);
    setFiles((cur) => ({ ...cur, [slot]: cur[slot].filter((x) => x !== item) }));
  };

  const modelItem = files.model[0];
  const videoItem = files.video[0];
  const [videoLocalUrl, setVideoLocalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (videoMode !== "upload" || !videoItem) return setVideoLocalUrl(null);
    if (videoItem.kind === "existing") return setVideoLocalUrl(videoItem.view.url);
    const url = URL.createObjectURL(videoItem.file);
    setVideoLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoItem, videoMode]);
  const linkedPreview = useMemo(() => {
    if (videoMode !== "link") return null;
    const v = parseVideoLink(form.videoLink);
    return v ? { url: v.url, host: v.host, embed: v.embed } : null;
  }, [form.videoLink, videoMode]);
  const modelSource: ModelSource | null = useMemo(() => {
    if (!modelItem) return null;
    if (modelItem.kind === "new") {
      const ext = extOf(modelItem.file.name);
      return isViewable(ext) ? { kind: "file", file: modelItem.file, ext } : null;
    }
    return isViewable(modelItem.view.ext) ? { kind: "url", url: modelItem.view.url, ext: modelItem.view.ext } : null;
  }, [modelItem]);

  // ── Validation per step ───────────────────
  const deadline = status ? Date.parse(status.deadline) : null;
  const closedForNew = status ? !status.open : false;
  const codeRequired = status?.codeRequired ?? true;
  const locked = saved?.locked ?? false;
  const submitted = saved?.status === "submitted";

  const hasVideoNow = videoMode === "link" ? !!parseVideoLink(form.videoLink) : files.video.length > 0;
  const hasVisual = files.image.length > 0 || hasVideoNow || files.model.length > 0;
  /** Everything still in the way of submitting, from the same rules the server applies. */
  const needed = useMemo(() => {
    const p = parseEntry(form);
    const e: FieldErrors = "errors" in p ? { ...p.errors } : {};
    if (!isEdit && codeRequired && !code.trim()) e.code = CODE_NEEDED;
    if (!hasVisual) e.visuals = VISUAL_NEEDED;
    return e;
  }, [form, isEdit, codeRequired, code, hasVisual]);
  const neededIn = (s: Step) => Object.fromEntries(Object.entries(needed).filter(([k, v]) => v && stepOf(k) === s)) as FieldErrors;
  const stepOk = (s: Step) => Object.keys(neededIn(s)).length === 0;

  // The extras open by themselves once they hold something.
  const hasExtras =
    files.video.length + files.model.length + files.progress.length + files.source.length > 0 ||
    !!form.videoLink ||
    !!form.cadLink ||
    !!form.process ||
    !!(errors.video || errors.videoLink || errors.model || errors.cadLink || errors.progress || errors.source || errors.process);
  // The first picture: the entry's cover.
  const firstImage = files.image[0];
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!firstImage) return setCoverUrl(null);
    if (firstImage.kind === "existing") return setCoverUrl(firstImage.view.url);
    const url = URL.createObjectURL(firstImage.file);
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [firstImage]);

  /** Scrolls the first field with an error into view (after the step renders). */
  const revealError = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>("[data-field-error]");
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select")?.focus({ preventScroll: true });
      }),
    );

  /** Shows a step's errors and opens that step. */
  function showErrors(errs: FieldErrors) {
    setErrors(errs);
    const first = Math.min(...Object.keys(errs).map(stepOf)) as Step;
    if (first !== step) {
      errorScroll.current = true;
      setStep(first);
    } else revealError();
  }

  /**
   * Moves to a step. Back is always open, and an existing entry can jump
   * anywhere; a new entry goes forward only past steps that are complete.
   */
  function goTo(target: Step) {
    if (target === step) return;
    setFormError("");
    if (!isEdit && target > step) {
      for (let s = 0 as Step; s < target; s = (s + 1) as Step) {
        const errs = neededIn(s);
        if (Object.keys(errs).length) {
          setErrors((e) => ({ ...e, ...errs }));
          if (s !== step) {
            errorScroll.current = true;
            setStep(s);
          } else revealError();
          return;
        }
      }
    }
    setStep(target);
    setReached((r) => (target > r ? target : r));
  }

  // A new step: focus its heading and bring the stepper into view.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    stepHeadingRef.current?.focus({ preventScroll: true });
    if (errorScroll.current) {
      errorScroll.current = false;
      revealError();
    } else {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      stepsRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [step]);

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    // Enter (or the main button) on steps 1 and 2 of a new entry means Next.
    if (step < LAST && !submitted) goTo((step + 1) as Step);
    else void save("submit");
  }

  /**
   * "submit": everything checked, then the entry is submitted.
   * "draft": only the title is needed; files upload and the entry stays a
   * draft, so a team can check in sketches and progress shots during the day.
   */
  async function save(mode: "submit" | "draft") {
    if (busy) return;
    const draft = mode === "draft";
    setFormError("");
    setDraftSaved("");
    const parsed = parseEntry(form, { draft });
    const errs: FieldErrors = "errors" in parsed ? { ...parsed.errors } : {};
    if (!isEdit && codeRequired && !code.trim()) errs.code = CODE_NEEDED;
    if (!hasVisual && !draft) errs.visuals = VISUAL_NEEDED;
    if (Object.keys(errs).length || !("value" in parsed)) {
      setFormError("Some fields need another look.");
      showErrors(errs);
      return;
    }

    // Only the chosen kind of video goes: a link replaces an upload and vice versa.
    if (videoMode === "upload") parsed.value.videoLink = "";
    const dropVideoFile = videoMode === "link" ? files.video.filter((x) => x.kind === "existing").map((x) => (x as Extract<Item, { kind: "existing" }>).view.id) : [];

    let id = entryId;
    let key = editKey;
    try {
      // 1. Details.
      setBusy("Saving your details…");
      if (!id) {
        const created = await api<{ id: string; editKey: string; entry: OwnEntry }>("/entries", { body: { code, entry: parsed.value, draft, measure } });
        writeTyped(null);
        id = created.id;
        key = created.editKey;
        createdHere.current = id;
        setEntryId(id);
        setEditKey(key);
        rememberEntry({ id, key, title: parsed.value.title, at: new Date().toISOString() });
        // From here on the page is the entry's edit link: a retry resumes, never duplicates.
        navigate(`/submit/edit/${id}#k=${key}`, { replace: true });
        setSaved(created.entry);
      } else {
        const res = await api<{ entry: OwnEntry }>(`/entries/${id}`, { method: "PUT", body: { entry: parsed.value, draft, measure }, editKey: key });
        setSaved(res.entry);
        rememberEntry({ id, key, title: parsed.value.title, at: new Date().toISOString() });
      }

      // 2. Removed files.
      for (const fileId of [...removed, ...dropVideoFile]) {
        if (files.model.some((x) => x.kind === "existing" && x.view.id === fileId)) continue;
        await api(`/entries/${id}/files/${fileId}`, { method: "DELETE", editKey: key }).catch((e: ApiError) => {
          if (e.status !== 404 && e.status !== 409) throw e;
        });
      }
      setRemoved([]);

      // 3. New files, model first.
      const queue: [keyof Files, Extract<Item, { kind: "new" }>][] = [];
      for (const slot of ["video", "model", "progress", "image", "source"] as const) {
        if (slot === "video" && videoMode !== "upload") continue;
        for (const item of files[slot]) if (item.kind === "new") queue.push([slot, item]);
      }
      const modelIsNew = files.model.some((x) => x.kind === "new");
      let latest: OwnEntry | null = null;
      for (const [slot, item] of queue) {
        setBusy(`Uploading ${item.file.name}…`);
        try {
          latest = await uploadFile({
            entryId: id,
            editKey: key,
            slot,
            file: item.file,
            name: item.file.name,
            onProgress: (p) =>
              setFiles((cur) => ({ ...cur, [slot]: cur[slot].map((x) => (x.kind === "new" && x.key === item.key ? { ...x, progress: p } : x)) })),
          });
          const view = latest.files.filter((f) => f.slot === slot).at(-1);
          setFiles((cur) => ({
            ...cur,
            [slot]: cur[slot].map((x) => (x.kind === "new" && x.key === item.key && view ? { kind: "existing", view } : x)),
          }));
        } catch (e) {
          const msg = (e as Error).message || "Upload failed.";
          setFiles((cur) => ({ ...cur, [slot]: cur[slot].map((x) => (x.kind === "new" && x.key === item.key ? { ...x, error: msg, progress: 0 } : x)) }));
          throw new Error(`${item.file.name}: ${msg}`);
        }
      }

      // 4. The card thumbnail: what the preview shows right now.
      const hasThumb = (latest ?? saved)?.files.some((f) => f.slot === "thumb");
      const newVideo = files.video.find((x) => x.kind === "new") as Extract<Item, { kind: "new" }> | undefined;
      // A team's own picture is the cover; a still of the model or video only stands in when there's none.
      const noPicture = files.image.length === 0;
      const fromModel = noPicture && captureRef.current && modelItem && (modelIsNew || !hasThumb || savedAxis.current !== parsed.value.upAxis);
      const fromVideo = noPicture && !modelItem && videoMode === "upload" && newVideo;
      if (fromModel || fromVideo) {
        setBusy("Saving a preview image…");
        const blob = fromModel ? await captureRef.current!().catch(() => null) : await captureVideoFrame(newVideo!.file);
        if (blob && blob.size < SLOTS.thumb.maxBytes) {
          await uploadFile({ entryId: id, editKey: key, slot: "thumb", file: blob, name: "preview.png" }).catch((e) => console.warn("thumbnail", e));
        }
      }
      savedAxis.current = parsed.value.upAxis;

      // 5a. A draft stops here: saved, not submitted.
      if (draft) {
        const fresh = await api<{ entry: OwnEntry }>(`/entries/${id}`, { editKey: key });
        setSaved(fresh.entry);
        setFiles(filesFrom(fresh.entry));
        setDraftSaved(`Draft saved at ${clock(new Date().toISOString())}. Keep your edit link to come back.`);
        return;
      }

      // 5. Submit.
      setBusy("Submitting…");
      const final = await api<{ entry: OwnEntry }>(`/entries/${id}/submit`, { body: {}, editKey: key });
      setSaved(final.entry);
      setFiles(filesFrom(final.entry));
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      const err = e as ApiError;
      const fromServer: FieldErrors = { ...(err.body?.errors ?? {}), ...(err.body?.field ? { [err.body.field]: err.message } : {}) };
      if (Object.keys(fromServer).length) showErrors(fromServer);
      setFormError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy("");
    }
  }

  // ── Render ────────────────────────────────
  if (loading) {
    return (
      <Shell section="Edit your entry">
        <p className="py-24 font-body text-concrete" role="status">
          Opening your entry…
        </p>
      </Shell>
    );
  }
  if (loadError) {
    return (
      <Shell section="Edit your entry">
        <div className="max-w-[40rem] py-20">
          <h1 className="display-scene">Can't open this entry</h1>
          <p className="mt-4 font-body text-lg text-foreground/75">{loadError}</p>
          <p className="mt-8">
            <Link to="/submit" className="p-link focus-ember font-body">
              Back to the form
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  if (done && saved && entryId) return <Done entry={saved} editKey={editKey} onEdit={() => setDone(false)} deadline={status?.deadline ?? null} now={now} />;

  // A new entry waits for the status: whether there's a code step, or the form isn't open yet.
  if (!isEdit && !status) {
    return (
      <Shell section="Submit your design">
        <p className="py-24 font-body text-concrete" role="status">
          Opening the form…
        </p>
      </Shell>
    );
  }

  if (!isEdit && status?.opensAt && Date.parse(status.opensAt) > now) {
    return (
      <Shell section="Submit your design">
        <div className="max-w-[40rem] py-20">
          <h1 className="display-scene">Opens at the theme reveal</h1>
          <p className="mt-4 font-body text-lg text-foreground/75">
            The form opens {Date.parse(status.opensAt) - now < 12 * 3600e3 ? `at ${clock(status.opensAt)}` : when(status.opensAt)}, once the theme is out. Keep this page open; it
            unlocks by itself.
          </p>
          {Date.parse(status.opensAt) - now < 12 * 3600e3 && (
            <p className="p-mono mt-6 text-2xl text-ember" aria-live="off">
              {countdown(Date.parse(status.opensAt), now)}
            </p>
          )}
          <SavedList />
        </div>
      </Shell>
    );
  }

  if (!isEdit && closedForNew && status) {
    return (
      <Shell section="Submit your design">
        <div className="max-w-[40rem] py-20">
          <h1 className="display-scene">Submissions are closed</h1>
          <p className="mt-4 font-body text-lg text-foreground/75">They closed at {clock(status.deadline)}. If you've already submitted, open your edit link to see your entry.</p>
          <SavedList />
        </div>
      </Shell>
    );
  }

  const until = deadline ? clock(status?.deadline) : "";
  const lastName = submitted ? "Check & save" : STEP_NAMES[LAST];
  const stepName = (s: Step) => (s === LAST ? lastName : STEP_NAMES[s]);
  const shownStepErrors = Object.entries(errors).some(([k, v]) => v && stepOf(k) === step);
  const uploading = (Object.keys(files) as (keyof Files)[])
    .filter((slot) => slot !== "video" || videoMode === "upload")
    .flatMap((slot) => files[slot].filter((x): x is Extract<Item, { kind: "new" }> => x.kind === "new"));

  // The model viewer: beside the form on wide screens; in the design step (and
  // on the review when there's no picture) on phones. Only one is ever mounted,
  // so the thumbnail capture has one canvas.
  const viewer = modelItem ? (
    <ModelViewer
      source={modelSource}
      upAxis={form.upAxis}
      onUpAxisChange={(a) => set("upAxis", a)}
      onMeasure={setMeasure}
      units={form.units}
      spec={status?.spec ?? null}
      captureRef={captureRef}
      label="Preview of your model"
      className="aspect-[4/3] w-full"
      empty={<PreviewEmpty />}
    />
  ) : null;

  const missing = <span className="text-[hsl(6_90%_66%)]">Missing</span>;

  return (
    <Shell section={isEdit ? "Edit your entry" : "Submit your design"}>
      {status && (
        <DeadlineBar
          deadline={status.deadline}
          now={now}
          closed={isEdit ? (saved ? locked : undefined) : !status.open}
          reopened={isEdit && !locked && submitted}
        />
      )}
      {status?.devDefaults && (
        <p className="p-notice p-notice--calm mt-6 font-body text-sm">
          Local preview.{codeRequired ? <> Entry code <span className="p-mono text-ember">MDC-DEMO</span>.</> : " No entry code needed."} Files are saved on this computer only.
        </p>
      )}

      <div className="grid gap-x-12 pt-8 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="min-w-0">
          <h1 className="display-scene">{isEdit ? form.title || "Your entry" : "Submit your design"}</h1>
          <p className="mt-3 max-w-[36rem] font-body text-[17px] leading-relaxed text-foreground/75">
            {isEdit
              ? submitted
                ? `Submitted at ${clock(saved?.submittedAt)}. You can change it until ${until || "submissions close"}.`
                : "Not submitted yet. Finish the steps and press Submit entry."
              : `Three short steps. Keep it brief: judges hear the rest when you present.${until ? ` Closes at ${until}.` : ""}`}
          </p>
          {saved?.slot && <SlotNotice slot={saved.slot} />}
          {restored && !isEdit && (
            <p className="p-notice p-notice--calm mt-5 max-w-[36rem] font-body text-sm">
              We kept what you typed on this device. Pick your files again if you'd added any.{" "}
              <button type="button" className="p-link focus-ember" onClick={startOver}>
                Start a fresh entry
              </button>
            </p>
          )}
          {!isEdit && step === 0 && <SavedList />}
          {locked && <p className="p-notice mt-5 font-body">Submissions are closed, so this entry can't be changed. Judges can see it as it is.</p>}

          <nav ref={stepsRef} aria-label="Steps" className="mt-8 scroll-mt-36">
            <ol className="p-steps">
              {([0, 1, 2] as Step[]).map((s) => {
                const state = s === step ? "current" : stepOk(s) && (isEdit || s < reached) ? "done" : "todo";
                return (
                  <li key={s} data-state={state}>
                    <button type="button" className="p-step focus-ember" data-state={state} aria-current={s === step ? "step" : undefined} onClick={() => goTo(s)}>
                      <span className="p-step-num" aria-hidden="true">
                        {state === "done" ? <Check size={14} strokeWidth={2.5} /> : s + 1}
                      </span>
                      <span className="p-step-name">
                        <span className="sr-only">Step {s + 1}: </span>
                        {stepName(s)}
                        {state === "done" && <span className="sr-only"> (complete)</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <form onSubmit={onSubmit} noValidate className="mt-2">
            <fieldset disabled={locked || !!busy} className="min-w-0">
              <section aria-labelledby="step-h" className="flex flex-col gap-6 pt-6">
                <div>
                  <h2 id="step-h" ref={stepHeadingRef} tabIndex={-1} className="p-step-title focus:outline-none">
                    {step === 0 ? "Your team" : step === 1 ? "Your design" : submitted ? "Check and save" : "Check and submit"}
                  </h2>
                  <p className="p-hint mt-1">
                    {step === 0
                      ? `1 to ${TEAM_MAX} people, as registered.`
                      : step === 1
                        ? "What judges look at before you present."
                        : submitted
                          ? "A last look, then save your changes."
                          : "A last look, two questions, then send it in."}
                  </p>
                </div>

                {/* ── Step 1: Team ── */}
                {step === 0 && (
                  <>
                    {!isEdit && codeRequired && (
                      <Field label="Entry code" hint="On the screen at the front of the room." error={errors.code}>
                        {(p) => (
                          <input
                            {...p}
                            className="p-input p-mono max-w-[16rem] uppercase tracking-[0.08em]"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            value={code}
                            onChange={(e) => {
                              setCode(e.target.value);
                              setErrors((x) => ({ ...x, code: undefined }));
                            }}
                          />
                        )}
                      </Field>
                    )}
                    <Field label="Team name" error={errors.teamName} counter={{ value: form.teamName.length, max: LIMITS.teamName }}>
                      {(p) => <input {...p} className="p-input" autoComplete="off" value={form.teamName} maxLength={LIMITS.teamName + 10} onChange={(e) => set("teamName", e.target.value)} />}
                    </Field>
                    {form.members.map((m, i) => (
                      <fieldset key={i} className="relative border-l border-bone/10 pl-4">
                        <legend className="p-label float-left mb-3 w-full leading-9">Member {i + 1}</legend>
                        {form.members.length > 1 && (
                          <button
                            type="button"
                            className="btn-ghost p-btn p-btn-sm absolute right-0 top-0 border-transparent text-concrete hover:text-foreground"
                            aria-label={`Remove ${m.name || `member ${i + 1}`}`}
                            onClick={() => set("members", form.members.filter((_, j) => j !== i))}
                          >
                            <X size={15} strokeWidth={1.5} /> Remove
                          </button>
                        )}
                        <div className="clear-left grid grid-cols-[minmax(0,1fr)_5.5rem] gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_6rem] sm:items-start">
                          <div className="col-span-2 sm:col-span-1">
                            <Field label="Full name" error={errors[`members.${i}.name`]}>
                              {(p) => <input {...p} className="p-input" autoComplete={i === 0 ? "name" : "off"} value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} />}
                            </Field>
                          </div>
                          <Field label="School" error={errors[`members.${i}.school`]}>
                            {(p) => <input {...p} className="p-input" value={m.school} onChange={(e) => setMember(i, { school: e.target.value })} />}
                          </Field>
                          <Field label="Grade" error={errors[`members.${i}.grade`]}>
                            {(p) => (
                              <select {...p} className="p-select" value={m.grade} onChange={(e) => setMember(i, { grade: e.target.value as (typeof GRADES)[number] })}>
                                {GRADES.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            )}
                          </Field>
                        </div>
                      </fieldset>
                    ))}
                    {errors.members && (
                      <p className="p-error" data-field-error="true">
                        {errors.members}
                      </p>
                    )}
                    {form.members.length < TEAM_MAX && (
                      <button
                        type="button"
                        className="btn-ghost p-btn p-btn-sm self-start"
                        onClick={() => set("members", [...form.members, { name: "", school: form.members[0]?.school ?? "", grade: form.members[0]?.grade ?? "10" }])}
                      >
                        <Plus size={15} strokeWidth={1.5} /> Add a team member
                      </button>
                    )}
                    <Field label="Contact email" hint="For prizes. Never shown publicly." error={errors.contactEmail}>
                      {(p) => <input {...p} type="email" className="p-input" autoComplete="email" inputMode="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />}
                    </Field>
                  </>
                )}

                {/* ── Step 2: Design ── */}
                {step === 1 && (
                  <>
                    <Field label="Title" error={errors.title} counter={{ value: form.title.length, max: LIMITS.title }}>
                      {(p) => <input {...p} className="p-input" value={form.title} maxLength={LIMITS.title + 20} onChange={(e) => set("title", e.target.value)} />}
                    </Field>
                    <Field
                      label="What you made and how it fits the theme"
                      hint="Two or three sentences."
                      error={errors.summary}
                      counter={{ value: wordCount(form.summary), max: WORDS.summary, unit: "words" }}
                    >
                      {(p) => <textarea {...p} className="p-textarea min-h-[6rem]" value={form.summary} onChange={(e) => set("summary", e.target.value)} />}
                    </Field>
                    <fieldset data-field-error={errors.software ? "true" : undefined}>
                      <legend className="p-label">Software you used</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SOFTWARE.map((s) => (
                          <label key={s} className="p-chip">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={form.software.includes(s)}
                              onChange={(e) => set("software", e.target.checked ? [...form.software, s] : form.software.filter((x) => x !== s))}
                            />
                            {form.software.includes(s) && <Check size={14} strokeWidth={2} aria-hidden="true" />}
                            {s}
                          </label>
                        ))}
                      </div>
                      {errors.software && <p className="p-error">{errors.software}</p>}
                    </fieldset>
                    {form.software.includes("Other") && (
                      <Field label="Other software" error={errors.softwareOther}>
                        {(p) => <input {...p} className="p-input max-w-[22rem]" value={form.softwareOther} onChange={(e) => set("softwareOther", e.target.value)} />}
                      </Field>
                    )}
                    <FilePicker
                      slot="image"
                      label="Pictures of your design"
                      hint="Up to 4 renders or screenshots (PNG, JPG, WebP). The first is your cover. No picture? Add a video or 3D model below."
                      items={files.image}
                      error={errors.image ?? errors.visuals}
                      onAdd={(l) => addFiles("image", l)}
                      onRemove={(it) => removeItem("image", it)}
                      icon={<ImagePlus size={20} strokeWidth={1.4} />}
                      multiple
                    />

                    <details className="group" open={hasExtras || undefined}>
                      <summary className="focus-ember flex cursor-pointer list-none items-center gap-2 font-body text-[15px] text-foreground/90 marker:hidden">
                        <Plus size={15} strokeWidth={1.6} className="shrink-0 text-ember transition-transform group-open:rotate-45" aria-hidden="true" />
                        <span>
                          Add more: video, 3D model, CAD link, project file <span className="text-concrete">optional</span>
                        </span>
                      </summary>
                      <div className="mt-6 flex flex-col gap-7 border-l border-bone/10 pl-4">
                        <div className="flex flex-col gap-4">
                          <p className="p-label">
                            Video <span className="ml-1.5 font-normal text-concrete">optional</span>
                          </p>
                          <p className="p-hint -mt-3">A short screen recording or turntable. Shown on your entry's page.</p>
                          <VideoChoice
                            mode={videoMode}
                            onMode={(m) => {
                              setVideoMode(m);
                              setErrors((x) => ({ ...x, video: undefined, videoLink: undefined }));
                            }}
                            link={form.videoLink}
                            onLink={(v) => set("videoLink", v)}
                            error={errors.video ?? errors.videoLink}
                            savedCheck={saved && saved.videoLink === form.videoLink ? saved.videoCheck : null}
                            upload={
                              <FilePicker
                                slot="video"
                                label="Video file"
                                hint="MP4, MOV or WebM, up to 150 MB. Bigger? Use a YouTube (Unlisted) or Drive link."
                                items={files.video}
                                error={errors.video}
                                onAdd={(l) => addFiles("video", l)}
                                onRemove={(it) => removeItem("video", it)}
                                icon={<Video size={20} strokeWidth={1.4} />}
                              />
                            }
                          />
                          <VideoGuide />
                          {!wide && (videoLocalUrl || linkedPreview) && <VideoPlayer title={form.title || "Your video"} link={linkedPreview} localUrl={videoLocalUrl} />}
                        </div>

                        {!wide && viewer}
                        <FilePicker
                          slot="model"
                          label="3D model"
                          optional
                          hint="GLB, STL, OBJ, 3MF or PLY, up to 250 MB. GLB keeps colours and materials."
                          items={files.model}
                          error={errors.model}
                          onAdd={(l) => addFiles("model", l)}
                          onRemove={(it) => removeItem("model", it)}
                          icon={<FileBox size={20} strokeWidth={1.4} />}
                        />
                        {modelItem && <ModelChecks units={form.units} onUnits={(u) => set("units", u)} measure={measure} spec={status?.spec ?? null} hasModel={!!modelItem} />}
                        <Field label="Link to your CAD document" optional hint={`View-only share link (${CAD_LINK_HINT}).`} error={errors.cadLink}>
                          {(p) => <input {...p} type="url" inputMode="url" className="p-input" placeholder="https://cad.onshape.com/documents/…" value={form.cadLink} onChange={(e) => set("cadLink", e.target.value)} />}
                        </Field>
                        <FilePicker
                          slot="progress"
                          label="Sketches and progress shots"
                          optional
                          hint="Each is timestamped when it uploads, so press Save draft as you go."
                          items={files.progress}
                          error={errors.progress}
                          onAdd={(l) => addFiles("progress", l)}
                          onRemove={(it) => removeItem("progress", it)}
                          icon={<PenTool size={20} strokeWidth={1.4} />}
                          multiple
                        />
                        <FilePicker
                          slot="source"
                          label="Project file"
                          optional
                          hint="The file you modelled in (.f3d, .blend, .step…), up to 250 MB. Only judges can download it."
                          items={files.source}
                          error={errors.source}
                          onAdd={(l) => addFiles("source", l)}
                          onRemove={(it) => removeItem("source", it)}
                          icon={<Upload size={20} strokeWidth={1.4} />}
                        />
                        <Field
                          label="Anything else for the judges"
                          optional
                          hint="A detail you're proud of, or how it would be made."
                          error={errors.process}
                          counter={{ value: wordCount(form.process), max: WORDS.process, unit: "words" }}
                        >
                          {(p) => <textarea {...p} className="p-textarea min-h-[5rem]" value={form.process} onChange={(e) => set("process", e.target.value)} />}
                        </Field>
                      </div>
                    </details>
                  </>
                )}

                {/* ── Step 3: Check & submit ── */}
                {step === LAST && (
                  <>
                    <div className="p-review">
                      <ReviewGroup title="Team" ok={stepOk(0)} onEdit={() => goTo(0)} locked={locked}>
                        <ReviewRow label="Team name">{form.teamName || missing}</ReviewRow>
                        <ReviewRow label={form.members.length > 1 ? "Members" : "Member"}>
                          {form.members.some((m) => m.name)
                            ? form.members.map((m, i) => (
                                <span key={i} className="block">
                                  {m.name || missing}
                                  <span className="text-concrete">
                                    {" "}
                                    · Gr {m.grade}
                                    {m.school ? ` · ${m.school}` : ""}
                                  </span>
                                </span>
                              ))
                            : missing}
                        </ReviewRow>
                        <ReviewRow label="Email">{form.contactEmail ? <span className="break-all">{form.contactEmail}</span> : missing}</ReviewRow>
                        {!isEdit && codeRequired && <ReviewRow label="Entry code">{code.trim() ? <span className="p-mono uppercase">{code.trim()}</span> : missing}</ReviewRow>}
                      </ReviewGroup>
                      <ReviewGroup title="Design" ok={stepOk(1)} onEdit={() => goTo(1)} locked={locked}>
                        <ReviewRow label="Title">{form.title || missing}</ReviewRow>
                        <ReviewRow label="About">{needed.summary ? missing : <span className="line-clamp-3">{form.summary}</span>}</ReviewRow>
                        <ReviewRow label="Software">
                          {form.software.length ? form.software.map((s) => (s === "Other" && form.softwareOther ? form.softwareOther : s)).join(", ") : missing}
                        </ReviewRow>
                        <ReviewRow label="Files">
                          {hasVisual || files.progress.length || files.source.length ? (
                            [
                              files.image.length && `${files.image.length} ${files.image.length === 1 ? "picture" : "pictures"}`,
                              modelItem && "3D model",
                              hasVideoNow && (videoMode === "link" ? "video link" : "video"),
                              files.progress.length && `${files.progress.length} progress ${files.progress.length === 1 ? "shot" : "shots"}`,
                              files.source.length && "project file",
                              form.cadLink && "CAD link",
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          ) : (
                            missing
                          )}
                        </ReviewRow>
                      </ReviewGroup>
                      {!wide && (coverUrl ? <img src={coverUrl} alt="Your cover picture" className="aspect-video w-full rounded-[2px] border border-bone/10 bg-[#0d0e10] object-contain" /> : viewer)}
                    </div>

                    <fieldset>
                      <legend className="p-label">AI tools</legend>
                      <p className="p-hint mt-1">Fine as a helper. Pure prompt-to-3D isn't allowed.</p>
                      <div className="p-seg mt-2" role="radiogroup">
                        <label>
                          <input type="radio" name="ai" className="sr-only" checked={form.aiUse === "none"} onChange={() => set("aiUse", "none")} />
                          Didn't use any
                        </label>
                        <label>
                          <input type="radio" name="ai" className="sr-only" checked={form.aiUse === "some"} onChange={() => set("aiUse", "some")} />
                          Used some
                        </label>
                      </div>
                    </fieldset>
                    {form.aiUse === "some" && (
                      <Field label="What did AI help with?" error={errors.aiNote} counter={{ value: wordCount(form.aiNote), max: WORDS.aiNote, unit: "words" }}>
                        {(p) => <textarea {...p} className="p-textarea min-h-[4.5rem]" value={form.aiNote} onChange={(e) => set("aiNote", e.target.value)} />}
                      </Field>
                    )}

                    <fieldset>
                      <legend className="p-label">On your entry's public page, credit</legend>
                      <div className="p-seg mt-2" role="radiogroup">
                        <label>
                          <input type="radio" name="credit" className="sr-only" checked={form.credit === "team"} onChange={() => set("credit", "team")} />
                          Team name
                        </label>
                        <label>
                          <input type="radio" name="credit" className="sr-only" checked={form.credit === "names"} onChange={() => set("credit", "names")} />
                          First names
                        </label>
                      </div>
                      <p className="p-hint mt-2">
                        Shown as <span className="text-foreground">{publicCredit(form) || "your first names"}</span>. Never surnames, schools or emails.
                      </p>
                    </fieldset>
                    <label className="flex cursor-pointer items-start gap-3 font-body text-[15px] text-foreground/85">
                      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[hsl(24_100%_54%)]" checked={form.shareable} onChange={(e) => set("shareable", e.target.checked)} />
                      <span>
                        Anyone with the link can see our entry
                        <span className="p-hint block">Untick to keep it to your team and the judges. Scores are always private.</span>
                      </span>
                    </label>

                    {saved && saved.notices.length > 0 && (
                      <div className="p-notice font-body text-[15px]" role="status">
                        <p className="font-medium text-foreground">Our file check noticed something judges will ask about:</p>
                        <ul className="mt-2 list-disc pl-5 text-foreground/85">
                          {saved.notices.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm text-foreground/70">That's not a judgement: files can carry odd metadata. If there's an explanation, add it below.</p>
                      </div>
                    )}
                    {saved?.notices.length || form.filesNote ? (
                      <Field
                        label="Anything judges should know about your files?"
                        optional
                        hint="For example: you converted the file or used a part from a library."
                        error={errors.filesNote}
                        counter={{ value: wordCount(form.filesNote), max: WORDS.filesNote, unit: "words" }}
                      >
                        {(p) => <textarea {...p} className="p-textarea min-h-[4.5rem]" value={form.filesNote} onChange={(e) => set("filesNote", e.target.value)} />}
                      </Field>
                    ) : null}

                    <div data-field-error={errors.original ? "true" : undefined}>
                      <label className="flex cursor-pointer items-start gap-3 border border-bone/15 bg-[hsl(220_7%_5.5%)] p-4 font-body text-[15px] text-foreground/90">
                        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[hsl(24_100%_54%)]" checked={form.original} onChange={(e) => set("original", e.target.checked)} />
                        <span>We modelled this today, after the theme reveal, and it's our own work.</span>
                      </label>
                      {errors.original && <p className="p-error">{errors.original}</p>}
                    </div>
                  </>
                )}
              </section>
            </fieldset>

            {/* Uploads run while the team is on the review: show them here too. */}
            {step === LAST && uploading.some((u) => u.progress > 0 || u.error) && (
              <ul className="mt-6 flex flex-col gap-2" aria-label="Uploads">
                {uploading.map((u) => (
                  <li key={u.key}>
                    <p className="flex justify-between gap-3 font-body text-sm">
                      <span className="truncate">{u.file.name}</span>
                      <span className="p-mono shrink-0 text-concrete">{u.error ? "failed" : `${Math.round(u.progress * 100)}%`}</span>
                    </p>
                    <Progress value={u.progress} />
                    {u.error && <p className="p-error">{u.error}</p>}
                  </li>
                ))}
              </ul>
            )}

            <div className="p-stepnav">
              {(draftSaved || formError || busy || (shownStepErrors && !formError)) && (
                <div className="mb-3 flex flex-col gap-2">
                  {busy && (
                    <p className="font-body text-sm text-foreground/85" role="status">
                      {busy}
                    </p>
                  )}
                  {draftSaved && !busy && (
                    <p className="p-notice p-notice--calm font-body text-sm" role="status">
                      {draftSaved}
                    </p>
                  )}
                  {formError && !busy && (
                    <p className="p-notice p-notice--bad font-body text-sm" role="alert">
                      {formError}
                    </p>
                  )}
                  {shownStepErrors && !formError && !busy && (
                    <p className="font-body text-sm text-[hsl(6_90%_66%)]" role="alert">
                      Fill in the fields marked in red to continue.
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                {step > 0 && (
                  <button type="button" className="btn-ghost p-btn px-3 sm:px-4" onClick={() => goTo((step - 1) as Step)}>
                    <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" /> Back
                  </button>
                )}
                <span className="p-mono hidden text-concrete sm:inline">
                  {step + 1} / {LAST + 1}
                </span>
                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                  {!submitted && step > 0 && (
                    <button type="button" className="btn-ghost p-btn px-3 sm:px-4" disabled={!!busy || locked} onClick={() => void save("draft")}>
                      Save draft
                    </button>
                  )}
                  {submitted && step < LAST && (
                    <button type="button" className="btn-ghost p-btn px-3 sm:px-4" onClick={() => goTo((step + 1) as Step)}>
                      Next <ArrowRight size={16} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  )}
                  {step < LAST && !submitted ? (
                    <button type="submit" className="btn-portal p-btn px-4 sm:px-5">
                      <span>
                        Next<span className="hidden sm:inline">: {STEP_NAMES[step + 1]}</span>
                      </span>
                      <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="submit" className="btn-portal p-btn min-w-[8.5rem] px-4 sm:min-w-[10rem] sm:px-5" disabled={!!busy || locked}>
                      {busy ? "Working…" : submitted ? "Save changes" : "Submit entry"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          {!wide && step === LAST && <JudgingBriefing className="mt-10" deadline={status?.deadline} />}
        </div>

        {wide && (
          <aside aria-label="Preview">
            <div className="sticky top-36 flex flex-col gap-4">
              {coverUrl ? (
                <img src={coverUrl} alt="Your cover picture" className="aspect-video w-full rounded-[2px] border border-bone/10 bg-[#0d0e10] object-contain" />
              ) : (
                !(videoLocalUrl || linkedPreview) &&
                !modelItem &&
                step > 0 && (
                  <div className="grid aspect-video place-items-center border border-bone/10 bg-[#0d0e10] p-6 text-center font-body text-sm text-concrete">
                    Your pictures show up here.
                  </div>
                )
              )}
              {(videoLocalUrl || linkedPreview) && <VideoPlayer title={form.title || "Your video"} link={linkedPreview} localUrl={videoLocalUrl} />}
              {viewer}
              <JudgingBriefing deadline={status?.deadline} />
            </div>
          </aside>
        )}
      </div>
    </Shell>
  );
}

/** One part of the review: what the team entered, and a way back to change it. */
function ReviewGroup({ title, ok, onEdit, locked, children }: { title: string; ok: boolean; onEdit: () => void; locked: boolean; children: ReactNode }) {
  return (
    <div className="p-review-group" data-ok={ok}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-body text-[15px] font-semibold text-bone">
          {title}
          {!ok && <span className="ml-2 font-normal text-[hsl(6_90%_66%)]">needs a look</span>}
        </h3>
        {!locked && (
          <button type="button" className="p-link focus-ember font-body text-sm" onClick={onEdit}>
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </button>
        )}
      </div>
      <dl className="mt-3 flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 font-body text-sm">
      <dt className="text-concrete">{label}</dt>
      <dd className="min-w-0 text-foreground/90">{children}</dd>
    </div>
  );
}

/**
 * Under the model picker: the units the file is in (STL and OBJ don't say),
 * what the model measures, and the organizers' size spec if there is one, so
 * a team knows before submitting whether it fits.
 */
function ModelChecks({
  units,
  onUnits,
  measure,
  spec,
  hasModel,
}: {
  units: Units;
  onUnits: (u: Units) => void;
  measure: Measure | null;
  spec: Spec | null;
  hasModel: boolean;
}) {
  const lines = measure && hasSpec(spec) ? specCheck(measure, spec) : [];
  const largest = measure ? Math.max(measure.w, measure.d, measure.h) : 0;
  // A Blender GLB is in metres; read as millimetres it comes out a few mm across.
  const suggest: Units | null = measure && units === "mm" && largest < 5 ? "m" : measure && units === "m" && largest > 20_000 ? "mm" : null;
  return (
    <div className="flex flex-col gap-3 border-l border-bone/10 pl-4">
      <label className="flex flex-wrap items-center gap-3">
        <span className="p-label">Units in the file</span>
        <select className="p-select w-auto min-w-[6rem]" value={units} onChange={(e) => onUnits(e.target.value as Units)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      {measure && (
        <p className="font-body text-sm text-foreground/85">
          Measures <span className="p-mono">{formatMeasure(measure)}</span>
          {measure.volume !== null ? (
            <span className="text-concrete"> · {(measure.volume / 1000).toFixed(1)} cm³ solid</span>
          ) : (
            <span className="text-concrete"> · open mesh (no volume)</span>
          )}
        </p>
      )}
      {suggest && (
        <p className="p-hint">
          That's {suggest === "m" ? "very small" : "very large"}. Was the file exported in {suggest === "m" ? "metres" : "millimetres"}?{" "}
          <button type="button" className="p-link focus-ember" onClick={() => onUnits(suggest)}>
            Use {suggest}
          </button>
        </p>
      )}
      {hasSpec(spec) && (
        <div>
          <p className="p-label">Size spec{spec.note ? `: ${spec.note}` : ""}</p>
          {!hasModel || !measure ? (
            <p className="p-hint mt-1">Add your model to check it against the spec.</p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1 font-body text-sm">
              {lines.map((l) => (
                <li key={l.label} className={l.ok === false ? "text-[#ff7a6b]" : l.ok ? "text-[#9fd59a]" : "text-concrete"}>
                  {l.ok === false ? "✕" : l.ok ? "✓" : "–"} {l.label}: {l.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


function PreviewEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <FileBox size={28} strokeWidth={1.2} className="text-bone/40" aria-hidden="true" />
      <p className="max-w-[24ch] font-body text-sm text-concrete">Add your model and it shows up here, in 3D, before you submit.</p>
    </div>
  );
}

function SavedList() {
  const [list, setList] = useState(savedEntries);
  if (!list.length) return null;
  return (
    <div className="mt-6 max-w-[38rem]">
      <p className="p-hint">Started on this laptop:</p>
      <ul className="mt-2 flex flex-col gap-1">
        {list.map((s) => (
          <li key={s.id} className="flex items-center gap-3 font-body text-[15px]">
            <Link to={`/submit/edit/${s.id}#k=${s.key}`} className="p-link focus-ember">
              {s.title || "Untitled entry"}
            </Link>
            <button
              type="button"
              className="text-concrete hover:text-foreground"
              aria-label={`Forget ${s.title || "this entry"} on this laptop`}
              onClick={() => {
                forgetEntry(s.id);
                setList(savedEntries());
              }}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilePicker({
  slot,
  label,
  hint,
  optional,
  items,
  error,
  onAdd,
  onRemove,
  icon,
  multiple,
}: {
  slot: keyof Files;
  label: string;
  hint: string;
  optional?: boolean;
  items: Item[];
  error?: string;
  onAdd: (files: FileList) => void;
  onRemove: (item: Item) => void;
  icon: React.ReactNode;
  multiple?: boolean;
}) {
  const [over, setOver] = useState(false);
  const full = items.length >= SLOTS[slot].maxCount;
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="p-label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-concrete">optional</span>}
      </p>
      <p className="p-hint mt-1">{hint}</p>
      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((it) => (
            <FileRow key={it.kind === "new" ? it.key : it.view.id} item={it} onRemove={() => onRemove(it)} />
          ))}
        </ul>
      )}
      {(!full || SLOTS[slot].maxCount === 1) && (
        <label
          className="p-drop mt-3"
          data-over={over}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept={SLOTS[slot].accept}
            multiple={multiple}
            aria-label={`${items.length && SLOTS[slot].maxCount === 1 ? "Replace" : "Choose"} ${label.toLowerCase()}`}
            onChange={(e) => {
              if (e.target.files?.length) onAdd(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="flex items-center gap-2 font-body text-[15px] text-foreground/90">
            <span className="text-ember">{icon}</span>
            {items.length && SLOTS[slot].maxCount === 1 ? "Replace the file" : "Drop a file here, or choose one"}
          </span>
        </label>
      )}
      {error && <p className="p-error">{error}</p>}
    </div>
  );
}

function FileRow({ item, onRemove }: { item: Item; onRemove: () => void }) {
  const name = item.kind === "new" ? item.file.name : item.view.name;
  const size = item.kind === "new" ? item.file.size : item.view.size;
  const ext = extOf(name);
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext);
  const [thumb] = useState(() => (isImage && item.kind === "new" ? URL.createObjectURL(item.file) : isImage && item.kind === "existing" ? item.view.url : ""));
  useEffect(() => () => void (thumb.startsWith("blob:") && URL.revokeObjectURL(thumb)), [thumb]);
  return (
    <li>
      <div className="p-file">
        {thumb ? (
          <img src={thumb} alt="" className="h-10 w-10 rounded-[2px] object-cover" />
        ) : (
          <span className="p-mono grid h-10 w-10 place-items-center rounded-[2px] border border-bone/10 text-[10px] uppercase text-concrete">{ext}</span>
        )}
        <div className="min-w-0">
          <p className="truncate font-body text-sm text-foreground">{name}</p>
          <p className="p-mono text-[11px] text-concrete">
            {formatBytes(size)}
            {item.kind === "existing" && " · saved"}
            {item.kind === "new" && !item.error && item.progress === 0 && " · ready to upload"}
          </p>
        </div>
        <button type="button" className="btn-ghost p-btn p-btn-sm border-transparent" aria-label={`Remove ${name}`} onClick={onRemove}>
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </div>
      {item.kind === "new" && item.progress > 0 && <Progress value={item.progress} />}
      {item.kind === "new" && item.error && <p className="p-error">{item.error}</p>}
    </li>
  );
}

// ── Done ──────────────────────────────────────

function Done({ entry, editKey, onEdit, deadline, now }: { entry: OwnEntry; editKey: string; onEdit: () => void; deadline: string | null; now: number }) {
  const origin = window.location.origin;
  const share = `${origin}/entry/${entry.id}`;
  const edit = `${origin}/submit/edit/${entry.id}#k=${editKey}`;
  const mail = `mailto:${encodeURIComponent(entry.contactEmail)}?subject=${encodeURIComponent(`Mackenzie Design Cup entry: ${entry.title}`)}&body=${encodeURIComponent(
    `Share link (your entry's page):\n${share}\n\nPrivate edit link (don't share):\n${edit}\n`,
  )}`;
  return (
    <Shell section="Submitted">
      {deadline && <DeadlineBar deadline={deadline} now={now} closed={entry.locked} reopened={!entry.locked && entry.status === "submitted"} />}
      <div className="grid gap-12 pt-12 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <p className="flex items-center gap-2 font-body text-[15px] text-ember">
            <Check size={18} strokeWidth={2} aria-hidden="true" /> Submitted at {clock(entry.submittedAt)}
            {entry.late && <span className="p-tag p-tag--bad ml-2">After the deadline</span>}
          </p>
          <h1 className="display-scene mt-3">{entry.title}</h1>
          <p className="mt-4 max-w-[36rem] font-body text-lg leading-relaxed text-foreground/75">
            The judges have it. Keep both links: the first shows your design to anyone, the second lets your team edit until submissions close.
          </p>
          {entry.slot && <SlotNotice slot={entry.slot} />}
          <JudgingBriefing className="mt-8" open deadline={deadline} />

          <div className="mt-10 flex flex-col gap-8">
            <LinkBox
              label={entry.shareable ? "Share link" : "Share link (team and judges only)"}
              hint={entry.shareable ? "Your video and design. Send it to anyone." : "You turned off public viewing. Only judges can open it."}
              url={share}
              open
            />
            <LinkBox label="Edit link" hint="Private. Anyone with it can change your entry." url={edit} />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href={mail} className="btn-ghost p-btn focus-ember">
              Email both links to {entry.contactEmail}
            </a>
            <button type="button" className="btn-ghost p-btn" onClick={onEdit}>
              Keep editing
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {entry.files.find((f) => f.slot === "image") && (
            <img src={entry.files.find((f) => f.slot === "image")!.url} alt={`${entry.title}, cover`} className="aspect-video w-full rounded-[2px] border border-bone/10 object-contain" />
          )}
          <VideoPlayer
            title={entry.title}
            file={entry.files.find((f) => f.slot === "video") ?? null}
            link={(() => {
              const v = entry.videoLink ? parseVideoLink(entry.videoLink) : null;
              return v ? { url: v.url, host: v.host, embed: v.embed } : null;
            })()}
          />
          {entry.files.some((f) => f.slot === "model") && (
            <ModelViewer
              source={(() => {
                const m = entry.files.find((f) => f.slot === "model");
                return m && isViewable(m.ext) ? { kind: "url", url: m.url, ext: m.ext } : null;
              })()}
              upAxis={entry.upAxis}
              units={entry.units}
              label={`${entry.title}, 3D model`}
              className="aspect-[4/3] w-full"
            />
          )}
        </div>
      </div>
    </Shell>
  );
}

function LinkBox({ label, hint, url, open }: { label: string; hint: string; url: string; open?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="p-label">{label}</p>
      <p className="p-hint mt-0.5">{hint}</p>
      <div className="mt-2 flex items-stretch gap-2">
        <input readOnly value={url} className="p-input p-mono min-w-0 flex-1 text-[12px]" onFocus={(e) => e.currentTarget.select()} aria-label={label} />
        <button
          type="button"
          className="btn-ghost p-btn shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked: the field is selectable */
            }
          }}
        >
          {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.5} />}
          {copied ? "Copied" : "Copy"}
        </button>
        {open && (
          <a href={url} target="_blank" rel="noopener" className="btn-ghost p-btn shrink-0" aria-label="Open the share page in a new tab">
            <ExternalLink size={15} strokeWidth={1.5} />
          </a>
        )}
      </div>
    </div>
  );
}
