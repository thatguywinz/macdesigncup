// /submit and /submit/edit/:id. One form for both: a new entry needs the
// day's entry code; an existing one is opened with its private edit link
// (the key rides in the URL fragment, which browsers never send to servers).
//
// The form asks one thing at a time, five short steps that each fit on one
// screen: 1 Entry (code, team name), 2 Team, 3 Design, 4 Files, 5 Submit.
// Optional extras sit behind "Add more" / "Sharing options", so a step only
// grows when a team opens them. A new entry moves forward only when the
// step's required fields pass (the same parseEntry rules the server runs);
// an existing entry opens on the review and can jump to any step.
//
// Submitting runs in order: save the details (creating the entry if new),
// upload each new file with its own progress bar, capture a still of the
// model as the card thumbnail, then mark the entry submitted. If a step
// fails, the entry is already saved and the page is on its edit link, so
// pressing the button again picks up where it stopped.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, ExternalLink, FileBox, ImagePlus, Mail, PenTool, Plus, RefreshCw, Trash2, Upload, Video, X } from "lucide-react";
import VideoPlayer, { captureVideoFrame } from "../components/VideoPlayer";
import { VideoChoice, VideoGuide } from "../components/VideoStep";
import { JudgingBriefing, SlotNotice } from "../components/Briefing";
import DeadlineBar from "../components/DeadlineBar";
import { parseVideoLink } from "../shared/video";
import Shell from "../components/Shell";
import { Field, Progress } from "../components/fields";
import { ApiError, api, clock, when } from "../api";
import { countdown, forgetEntry, rememberEntry, savedEntries, useNow, usePortalStatus } from "../hooks";
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
  type PortalStatus,
} from "../shared/schema";
import { uploadFile } from "../upload";
import { CAD_LINK_HINT, UNITS, formatMeasure, hasSpec, specCheck, type Measure, type Spec, type Units } from "../shared/checks";
import ModelViewer, { type CaptureFn, type ModelSource } from "../viewer/ModelViewer";
import "../submit.css";

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

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS: Step[] = [0, 1, 2, 3, 4];
const STEP_NAMES = ["Entry", "Team", "Design", "Files", "Submit"] as const;
const LAST: Step = 4;
const REVIEW_FIELDS = ["aiUse", "aiNote", "original", "filesNote", "credit", "shareable"];

/** Which step shows a field (and so which step an error sends the team back to). */
function stepOf(field: string): Step {
  if (field === "code" || field === "teamName") return 0;
  if (field === "contactEmail" || field.startsWith("members")) return 1;
  if (field === "title" || field === "summary" || field === "software" || field === "softwareOther") return 2;
  if (REVIEW_FIELDS.includes(field)) return 4;
  return 3;
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

const asStep = (n: unknown): Step => (n === 1 || n === 2 || n === 3 || n === 4 ? n : 0);

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
  /** The preview couldn't open the chosen model (damaged or renamed file). */
  const [modelOpenError, setModelOpenError] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<"link" | "upload">(initial?.videoMode === "upload" ? "upload" : "link");
  const [restored, setRestored] = useState(!!initial);
  // An existing entry opens on the review, where everything is at a glance.
  const [step, setStep] = useState<Step>(() => (routeId ? LAST : asStep(initial?.step)));
  const [reached, setReached] = useState<Step>(step);
  const captureRef = useRef<CaptureFn | null>(null);
  const savedAxis = useRef<"y" | "z">("y");
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  /** The next step change should scroll to the first error, not the top. */
  const errorScroll = useRef(false);

  const isEdit = !!entryId;

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
        const { id, status: _s, submittedAt: _a, late: _l, files: _f, locked: _k, unlocked: _u, notices: _n, ...input } = entry;
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
  const closedForNew = status ? !status.open || (deadline !== null && now >= deadline) : false;
  const codeRequired = status?.codeRequired ?? true;
  // Locked by the server, or the clock passed the deadline while this page was open
  // (no late submissions: only an entry organizers reopened stays editable).
  const pastDeadline = deadline !== null && now >= deadline;
  // Submit pressed in time and still finishing (an upload failed or the page
  // reloaded after the deadline): it may retry its uploads and submit.
  const finishingNow = !!saved?.finishingUntil && saved.status === "draft" && now < Date.parse(saved.finishingUntil);
  const locked = !finishingNow && ((saved?.locked ?? false) || (pastDeadline && !(saved?.unlocked ?? false)));
  const submitted = saved?.status === "submitted";

  const hasVideoNow = videoMode === "link" ? !!parseVideoLink(form.videoLink) : files.video.length > 0;
  const hasVisual = files.image.length > 0 || hasVideoNow || files.model.length > 0;
  /** Everything still in the way of submitting, from the same rules the server applies. */
  const needed = useMemo(() => {
    // An uploaded video replaces the link: a stale link left in the field mustn't block the team.
    const p = parseEntry(videoMode === "upload" ? { ...form, videoLink: "" } : form);
    const e: FieldErrors = "errors" in p ? { ...p.errors } : {};
    if (!isEdit && codeRequired && !code.trim()) e.code = CODE_NEEDED;
    if (!hasVisual) e.visuals = VISUAL_NEEDED;
    return e;
  }, [videoMode, form, isEdit, codeRequired, code, hasVisual]);
  const neededIn = (s: Step) => Object.fromEntries(Object.entries(needed).filter(([k, v]) => v && stepOf(k) === s)) as FieldErrors;
  const stepOk = (s: Step) => Object.keys(neededIn(s)).length === 0;

  // "Add more" opens by itself once it holds something (or has an error).
  const hasExtras =
    files.video.length + files.progress.length + files.source.length > 0 ||
    !!form.videoLink ||
    !!form.cadLink ||
    !!form.process ||
    !!(errors.video || errors.videoLink || errors.cadLink || errors.progress || errors.source || errors.process);
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
        // An error inside a closed disclosure: open it first.
        const box = el?.closest("details");
        if (box && !box.open) box.open = true;
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
  async function goTo(target: Step) {
    if (target === step) return;
    setFormError("");
    // Leaving step 1 of a new entry: check the entry code now, not at the end.
    if (!isEdit && step === 0 && target > 0 && codeRequired && code.trim()) {
      try {
        await api("/entries/check-code", { body: { code } });
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setErrors((x) => ({ ...x, code: e.message }));
          revealError();
          return;
        }
        // Offline or busy: carry on; the code is checked again on submit.
      }
    }
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

  // A new step: focus its heading and start at the top.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    stepHeadingRef.current?.focus({ preventScroll: true });
    // The "we kept what you typed" note has done its job once the team moves on.
    setRestored(false);
    if (errorScroll.current) {
      errorScroll.current = false;
      revealError();
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [step]);

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    // Enter (or the main button) before the last step of a new entry means Next.
    if (step < LAST && !submitted) void goTo((step + 1) as Step);
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
    const parsed = parseEntry(videoMode === "upload" ? { ...form, videoLink: "" } : form, { draft });
    const errs: FieldErrors = "errors" in parsed ? { ...parsed.errors } : {};
    if (!isEdit && codeRequired && !code.trim()) errs.code = CODE_NEEDED;
    if (!hasVisual && !draft) errs.visuals = VISUAL_NEEDED;
    // A model the preview can't open would reach judges as an empty box.
    if (!draft && modelOpenError && files.model.some((x) => x.kind === "new")) errs.model = modelOpenError;
    if (Object.keys(errs).length || !("value" in parsed)) {
      setFormError("Some fields need another look.");
      showErrors(errs);
      return;
    }

    // Only the chosen kind of video goes: a link replaces an upload and vice versa.
    if (videoMode === "upload") parsed.value.videoLink = "";
    const dropVideoFile = videoMode === "link" ? files.video.filter((x) => x.kind === "existing").map((x) => (x as Extract<Item, { kind: "existing" }>).view.id) : [];
    // The preview only measures while it's on screen: when it hasn't this
    // time, keep the saved measurement (unless the model is gone).
    const measureToSend = measure ?? (modelItem ? undefined : null);

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
      } else if (finishingNow) {
        // Past the deadline, finishing an on-time Submit: details can't change, so go straight to the files.
      } else {
        const res = await api<{ entry: OwnEntry }>(`/entries/${id}`, { method: "PUT", body: { entry: parsed.value, draft, measure: measureToSend }, editKey: key });
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

      // 3. New files, small ones first: pictures land in seconds, so a team
      // pressing Submit at the last minute already has something judges can see.
      const queue: [keyof Files, Extract<Item, { kind: "new" }>][] = [];
      for (const slot of ["image", "progress", "model", "video", "source"] as const) {
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

  if (done && saved && entryId) return <Done entry={saved} editKey={editKey} onEdit={() => setDone(false)} deadline={status?.deadline ?? null} judging={status?.judging} now={now} />;

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

  // A Submit pressed in time keeps its page until it finishes (it may still be uploading).
  if (!isEdit && closedForNew && status && !busy) {
    return (
      <Shell section="Submit your design">
        <div className="max-w-[40rem] py-20">
          <h1 className="display-scene">Submissions are closed</h1>
          <p className="mt-4 font-body text-lg text-foreground/75">They closed at {clock(status.deadline)}. If you've already submitted, open your edit link to see your entry. If you were in the middle of submitting, find an organizer now.</p>
          <SavedList />
        </div>
      </Shell>
    );
  }

  const until = deadline ? clock(status?.deadline) : "";
  const shownStepErrors = Object.entries(errors).some(([k, v]) => v && stepOf(k) === step);
  const uploading = (Object.keys(files) as (keyof Files)[])
    .filter((slot) => slot !== "video" || videoMode === "upload")
    .flatMap((slot) => files[slot].filter((x): x is Extract<Item, { kind: "new" }> => x.kind === "new"));
  const showUploads = step === LAST && uploading.length > 0 && (!!busy || uploading.some((u) => u.progress > 0 || u.error));

  // The model viewer: on the Files step, and on the review when there's no
  // picture (its still becomes the cover). Only one is ever mounted, so the
  // thumbnail capture has one canvas.
  const viewer = modelItem ? (
    <ModelViewer
      source={modelSource}
      upAxis={form.upAxis}
      onUpAxisChange={(a) => set("upAxis", a)}
      onMeasure={setMeasure}
      onLoadError={setModelOpenError}
      units={form.units}
      spec={status?.spec ?? null}
      captureRef={captureRef}
      label="Preview of your model"
      className="sf-viewer w-full"
      empty={<PreviewEmpty />}
    />
  ) : null;

  const missing = <span className="sf-missing">Missing</span>;
  // Finishing an on-time Submit after the deadline: only files can still go up.
  const finishing = finishingNow && pastDeadline;
  const titles: Record<Step, string> = {
    0: isEdit ? "Your team name" : "Start your entry",
    1: "Who's on the team?",
    2: "About your design",
    3: "Add your files",
    4: submitted ? "Check and save" : "Check and submit",
  };
  const subs: Record<Step, ReactNode> = {
    0: null,
    1: `1 to ${TEAM_MAX} people, as registered.`,
    2: "What judges read before you present.",
    3: "At least one picture, or your 3D model.",
    4: isEdit ? (submitted ? `Submitted at ${clock(saved?.submittedAt)}. You can change it until ${until || "submissions close"}.` : finishing ? null : "Not submitted yet.") : null,
  };
  const softwareLine = form.software.map((s) => (s === "Other" && form.softwareOther ? form.softwareOther : s)).join(", ");
  const filesLine = [
    files.image.length && `${files.image.length} ${files.image.length === 1 ? "picture" : "pictures"}`,
    modelItem && "3D model",
    hasVideoNow && (videoMode === "link" ? "video link" : "video"),
    files.progress.length && `${files.progress.length} progress ${files.progress.length === 1 ? "shot" : "shots"}`,
    files.source.length && "project file",
    form.cadLink && "CAD link",
  ]
    .filter(Boolean)
    .join(" · ");
  const firstMember = form.members[0];
  const membersLine =
    form.members.length === 1
      ? firstMember?.name
        ? `${firstMember.name}, Gr ${firstMember.grade}${firstMember.school ? `, ${firstMember.school}` : ""}`
        : ""
      : form.members.map((m) => m.name || "?").join(", ");

  return (
    <Shell section={isEdit ? "Edit your entry" : "Submit your design"}>
      <div className="sf">
        {status && (
          <DeadlineBar
            deadline={status.deadline}
            now={now}
            closed={isEdit ? (saved ? locked : undefined) : !status.open || pastDeadline}
            reopened={isEdit && !!saved?.unlocked && !locked}
            wide={step === 3 && !!modelItem}
          />
        )}
        <form onSubmit={onSubmit} noValidate className="sf-form">
          <div className="sf-body">
            <div className="sf-wrap" data-wide={step === 3 && modelItem ? "true" : undefined}>
              <h1 className="sr-only">{isEdit ? form.title || "Your entry" : "Submit your design"}</h1>

              <nav aria-label="Steps" className="sf-steps">
                <ol>
                  {STEPS.map((s) => {
                    const state = s === step ? "current" : stepOk(s) && (isEdit || s < reached) ? "done" : s < step ? "visited" : "todo";
                    return (
                      <li key={s}>
                        <button type="button" className="sf-step focus-ember" data-state={state} aria-current={s === step ? "step" : undefined} onClick={() => void goTo(s)}>
                          <span className="sf-step-bar" aria-hidden="true" />
                          <span className="sf-step-name">
                            <span className="sr-only">Step {s + 1}: </span>
                            {s === LAST && submitted ? "Save" : STEP_NAMES[s]}
                            {state === "done" && <span className="sr-only"> (complete)</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              {status?.devDefaults && step === 0 && (
                <p className="sf-note">
                  Local preview.{codeRequired ? <> Entry code <span className="p-mono text-ember">MDC-DEMO</span>.</> : " No entry code needed."} Files stay on this computer.
                </p>
              )}
              {restored && !isEdit && (
                <p className="sf-note">
                  We kept what you typed here. Pick your files again if you'd added any.{" "}
                  <button type="button" className="p-link focus-ember" onClick={startOver}>
                    Start fresh
                  </button>
                </p>
              )}
              {finishing && (
                <p className="p-notice sf-alert font-body" role="status">
                  Not finished yet. You pressed Submit in time, so your place is kept: pick any missing files again and press Finish submitting before{" "}
                  {clock(saved?.finishingUntil)}. Your details can't change now.
                </p>
              )}
              {locked &&
                (saved?.status === "draft" ? (
                  <p className="p-notice p-notice--bad sf-alert font-body" role="alert">
                    Submissions closed before this entry was submitted, so judges won't see it. Find an organizer right away.
                  </p>
                ) : (
                  <p className="p-notice sf-alert font-body">Submissions are closed, so this entry can't be changed. Judges can see it as it is.</p>
                ))}

              <fieldset disabled={locked || !!busy} className="min-w-0">
                <section key={step} aria-labelledby="step-h" className="sf-step-body" data-step={step}>
                  <div className="sf-head">
                    <h2 id="step-h" ref={stepHeadingRef} tabIndex={-1} className="sf-title focus:outline-none">
                      {titles[step]}
                    </h2>
                    {subs[step] && <p className="sf-sub">{subs[step]}</p>}
                  </div>

                  {/* ── 1 Entry ── */}
                  {step === 0 && (
                    <>
                      {!isEdit && codeRequired && (
                        <Field label="Entry code" hint="It's on the screen at the front of the room." error={errors.code}>
                          {(p) => (
                            <input
                              {...p}
                              className="p-input sf-input-lg p-mono max-w-[16rem] uppercase tracking-[0.08em]"
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
                      <Field label="What's your team called?" hint="Judges find you by this name." error={errors.teamName} counter={{ value: form.teamName.length, max: LIMITS.teamName }}>
                        {(p) => <input {...p} className="p-input sf-input-lg" autoComplete="off" value={form.teamName} maxLength={LIMITS.teamName + 10} onChange={(e) => set("teamName", e.target.value)} />}
                      </Field>
                      {!isEdit && <SavedList compact />}
                    </>
                  )}

                  {/* ── 2 Team ── */}
                  {step === 1 && (
                    <>
                      <div className="flex flex-col gap-4">
                        {form.members.map((m, i) => (
                          <fieldset key={i} className="sf-member">
                            <legend className="sf-member-h">
                              <span>Member {i + 1}</span>
                              {form.members.length > 1 && (
                                <button
                                  type="button"
                                  className="sf-textbtn focus-ember"
                                  aria-label={`Remove ${m.name || `member ${i + 1}`}`}
                                  onClick={() => set("members", form.members.filter((_, j) => j !== i))}
                                >
                                  <X size={14} strokeWidth={1.6} aria-hidden="true" /> Remove
                                </button>
                              )}
                            </legend>
                            <div className="sf-member-grid">
                              <div className="sf-member-name">
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
                      </div>
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
                          <Plus size={15} strokeWidth={1.5} aria-hidden="true" /> Add a teammate
                        </button>
                      )}
                      <Field label="Contact email" hint="For prizes. Never shown publicly." error={errors.contactEmail}>
                        {(p) => <input {...p} type="email" className="p-input" autoComplete="email" inputMode="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />}
                      </Field>
                    </>
                  )}

                  {/* ── 3 Design ── */}
                  {step === 2 && (
                    <>
                      <Field label="Title" error={errors.title} counter={{ value: form.title.length, max: LIMITS.title }}>
                        {(p) => <input {...p} className="p-input sf-input-lg" value={form.title} maxLength={LIMITS.title + 20} onChange={(e) => set("title", e.target.value)} />}
                      </Field>
                      <Field
                        label="What did you make?"
                        hint="A sentence or two: what it is and how it fits the theme."
                        error={errors.summary}
                        counter={{ value: wordCount(form.summary), max: WORDS.summary, unit: "words" }}
                      >
                        {(p) => <textarea {...p} rows={3} className="p-textarea sf-textarea" value={form.summary} onChange={(e) => set("summary", e.target.value)} />}
                      </Field>
                      <fieldset data-field-error={errors.software ? "true" : undefined}>
                        <legend className="p-label">Software you used</legend>
                        <div className="sf-chips">
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
                    </>
                  )}

                  {/* ── 4 Files ── */}
                  {step === 3 && (
                    <div className="sf-files">
                      <div className="sf-files-pics">
                        <FilePicker
                          slot="image"
                          label="Pictures"
                          ariaName="pictures of your design"
                          hint="Renders or screenshots (PNG, JPG, WebP). The first is your cover."
                          items={files.image}
                          error={errors.image ?? errors.visuals}
                          onAdd={(l) => addFiles("image", l)}
                          onRemove={(it) => removeItem("image", it)}
                          icon={<ImagePlus size={22} strokeWidth={1.4} />}
                          cta="Add pictures"
                          tiles
                          multiple
                        />
                      </div>
                      <div className="sf-files-model">
                        <FilePicker
                          slot="model"
                          label="3D model"
                          ariaName="3D model"
                          hint="GLB, STL, OBJ, 3MF or PLY, up to 250 MB."
                          items={files.model}
                          error={errors.model}
                          onAdd={(l) => addFiles("model", l)}
                          onRemove={(it) => removeItem("model", it)}
                          icon={<FileBox size={22} strokeWidth={1.4} />}
                          cta="Add your model"
                        />
                      </div>
                      {viewer && <div className="sf-files-preview">{viewer}</div>}

                      <details className="sf-more sf-files-more" open={hasExtras || undefined}>
                        <summary className="sf-more-sum focus-ember">
                          <Plus size={16} strokeWidth={1.6} className="sf-more-icon" aria-hidden="true" />
                          <span>
                            Add more <span className="text-concrete">(optional)</span>
                            <span className="sf-more-hint">Video, CAD link, sketches, project file, notes</span>
                          </span>
                        </summary>
                        <div className="sf-more-body">
                          <div className="flex flex-col gap-3">
                            <p className="p-label">Video</p>
                            <p className="p-hint -mt-2">A short screen recording or turntable. Shown on your entry's page.</p>
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
                                  ariaName="video file"
                                  hint="MP4, MOV or WebM, up to 150 MB. Bigger? Use a YouTube (Unlisted) or Drive link."
                                  items={files.video}
                                  error={errors.video}
                                  onAdd={(l) => addFiles("video", l)}
                                  onRemove={(it) => removeItem("video", it)}
                                  icon={<Video size={20} strokeWidth={1.4} />}
                                  cta="Add a video"
                                />
                              }
                            />
                            <VideoGuide />
                            {(videoLocalUrl || linkedPreview) && <VideoPlayer title={form.title || "Your video"} link={linkedPreview} localUrl={videoLocalUrl} />}
                          </div>
                          {modelItem && <ModelChecks units={form.units} onUnits={(u) => set("units", u)} measure={measure} spec={status?.spec ?? null} hasModel={!!modelItem} />}
                          <Field label="Link to your CAD document" optional hint={`View-only share link (${CAD_LINK_HINT}).`} error={errors.cadLink}>
                            {(p) => <input {...p} type="url" inputMode="url" className="p-input" placeholder="https://cad.onshape.com/documents/…" value={form.cadLink} onChange={(e) => set("cadLink", e.target.value)} />}
                          </Field>
                          <FilePicker
                            slot="progress"
                            label="Sketches and progress shots"
                            ariaName="sketches and progress shots"
                            optional
                            hint="Each is timestamped when it uploads, so press Save draft as you go."
                            items={files.progress}
                            error={errors.progress}
                            onAdd={(l) => addFiles("progress", l)}
                            onRemove={(it) => removeItem("progress", it)}
                            icon={<PenTool size={20} strokeWidth={1.4} />}
                            cta="Add sketches"
                            multiple
                          />
                          <FilePicker
                            slot="source"
                            label="Project file"
                            ariaName="project file"
                            optional
                            hint="The file you modelled in (.f3d, .blend, .step…), up to 250 MB. Only judges can download it."
                            items={files.source}
                            error={errors.source}
                            onAdd={(l) => addFiles("source", l)}
                            onRemove={(it) => removeItem("source", it)}
                            icon={<Upload size={20} strokeWidth={1.4} />}
                            cta="Add your project file"
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
                    </div>
                  )}

                  {/* ── 5 Check & submit ── */}
                  {step === LAST && (
                    <>
                      {saved?.slot && <SlotNotice slot={saved.slot} className="" />}

                      {/* Uploads run while the team is on the review: shown first, where they can't be missed. */}
                      {showUploads && (
                        <ul className="sf-uploads" aria-label="Uploads">
                          {uploading.map((u) => (
                            <li key={u.key}>
                              <p className="flex justify-between gap-3 font-body text-sm">
                                <span className="truncate">{u.file.name}</span>
                                <span className="p-mono shrink-0 text-concrete">{u.error ? "failed" : u.progress > 0 ? `${Math.round(u.progress * 100)}%` : "waiting"}</span>
                              </p>
                              <Progress value={u.progress} />
                              {u.error && <p className="p-error">{u.error}</p>}
                            </li>
                          ))}
                        </ul>
                      )}

                      <ul className="sf-summary" aria-label="Your entry">
                        <SummaryRow name="Entry" ok={stepOk(0)} onEdit={() => void goTo(0)} locked={locked || finishing}>
                          {form.teamName || missing}
                          {!isEdit && codeRequired && (
                            <span className="text-concrete">
                              {" "}
                              · code <span className="p-mono uppercase">{code.trim() || "missing"}</span>
                            </span>
                          )}
                        </SummaryRow>
                        <SummaryRow name="Team" ok={stepOk(1)} onEdit={() => void goTo(1)} locked={locked || finishing}>
                          {membersLine || missing}
                          {form.contactEmail && <span className="text-concrete"> · {form.contactEmail}</span>}
                        </SummaryRow>
                        <SummaryRow name="Design" ok={stepOk(2)} onEdit={() => void goTo(2)} locked={locked || finishing}>
                          {form.title || missing}
                          {softwareLine && <span className="text-concrete"> · {softwareLine}</span>}
                        </SummaryRow>
                        <SummaryRow name="Files" ok={stepOk(3)} onEdit={() => void goTo(3)} locked={locked} thumb={coverUrl}>
                          {filesLine || missing}
                        </SummaryRow>
                      </ul>
                      {!coverUrl && viewer && <div className="sf-review-viewer">{viewer}</div>}

                      <fieldset>
                        <legend className="p-label">Did you use AI tools?</legend>
                        <p className="p-hint mt-0.5">Fine as a helper. Pure prompt-to-3D isn't allowed.</p>
                        <div className="p-seg mt-2" role="radiogroup" aria-label="Did you use AI tools?">
                          <label>
                            <input type="radio" name="ai" className="sr-only" checked={form.aiUse === "none"} onChange={() => set("aiUse", "none")} />
                            No
                          </label>
                          <label>
                            <input type="radio" name="ai" className="sr-only" checked={form.aiUse === "some"} onChange={() => set("aiUse", "some")} />
                            Yes, some
                          </label>
                        </div>
                      </fieldset>
                      {form.aiUse === "some" && (
                        <Field label="What did AI help with?" error={errors.aiNote} counter={{ value: wordCount(form.aiNote), max: WORDS.aiNote, unit: "words" }}>
                          {(p) => <textarea {...p} rows={2} className="p-textarea min-h-[4rem]" value={form.aiNote} onChange={(e) => set("aiNote", e.target.value)} />}
                        </Field>
                      )}

                      <div data-field-error={errors.original ? "true" : undefined}>
                        <label className="sf-confirm">
                          <input type="checkbox" checked={form.original} aria-invalid={errors.original ? true : undefined} onChange={(e) => set("original", e.target.checked)} />
                          <span>We modelled this today, after the theme reveal, and it's our own work.</span>
                        </label>
                        {errors.original && <p className="p-error">{errors.original}</p>}
                      </div>

                      <details className="sf-more" open={!!errors.filesNote || undefined}>
                        <summary className="sf-more-sum focus-ember">
                          <ChevronDown size={16} strokeWidth={1.6} className="sf-more-chev" aria-hidden="true" />
                          <span>
                            Sharing options{saved?.notices.length ? " and file notes" : ""}
                            {saved?.notices.length && !form.filesNote ? (
                              <span className="sf-more-hint text-ember">Our file check has a question for you. Open to answer it.</span>
                            ) : (
                              <span className="sf-more-hint">
                                Credited as {publicCredit(form) || "your first names"} · {form.shareable ? "anyone with the link can view" : "team and judges only"}
                              </span>
                            )}
                          </span>
                        </summary>
                        <div className="sf-more-body">
                          <fieldset>
                            <legend className="p-label">On your entry's public page, credit</legend>
                            <div className="p-seg mt-2" role="radiogroup" aria-label="Credit on the public page">
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
                          <Field
                            label="Anything judges should know about your files?"
                            optional
                            hint="For example: you converted the file or used a part from a library."
                            error={errors.filesNote}
                            counter={{ value: wordCount(form.filesNote), max: WORDS.filesNote, unit: "words" }}
                          >
                            {(p) => <textarea {...p} rows={2} className="p-textarea min-h-[4rem]" value={form.filesNote} onChange={(e) => set("filesNote", e.target.value)} />}
                          </Field>
                        </div>
                      </details>

                      {until && !submitted && !locked && !pastDeadline && (
                        <p className="sf-rule">
                          Press Submit before <span className="text-foreground">{until}</span>. Big files can finish uploading after.
                        </p>
                      )}
                    </>
                  )}
                </section>
              </fieldset>
            </div>
          </div>

          {/* Back / Next, always in reach at the bottom of the screen. */}
          <div className="sf-bar">
            <div className="sf-wrap" data-wide={step === 3 && modelItem ? "true" : undefined}>
              {(draftSaved || formError || busy || shownStepErrors) && (
                <div className="sf-bar-msg">
                  {busy && (
                    <p className="text-foreground/85" role="status">
                      {busy}
                    </p>
                  )}
                  {draftSaved && !busy && (
                    <p className="text-foreground/85" role="status">
                      {draftSaved}
                    </p>
                  )}
                  {formError && !busy && (
                    <p className="sf-bar-bad" role="alert">
                      {formError}
                    </p>
                  )}
                  {shownStepErrors && !formError && !busy && (
                    <p className="sf-bar-bad" role="alert">
                      Check the fields marked in red to continue.
                    </p>
                  )}
                </div>
              )}
              <div className="sf-bar-row" data-crowded={submitted && step < LAST ? "true" : undefined}>
                <div className="sf-bar-left">
                  {step > 0 && (
                    <button type="button" className="btn-ghost p-btn sf-back" aria-label="Back" onClick={() => void goTo((step - 1) as Step)}>
                      <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
                      <span className="sf-back-text">Back</span>
                    </button>
                  )}
                </div>
                <p className="sf-count" aria-hidden="true">
                  {step + 1} of {LAST + 1}
                </p>
                <div className="sf-bar-right">
                  {!submitted && step > 0 && !finishingNow && (
                    <button type="button" className="sf-textbtn sf-draft focus-ember" disabled={!!busy || locked} onClick={() => void save("draft")}>
                      Save draft
                    </button>
                  )}
                  {submitted && step < LAST && (
                    <button type="button" className="btn-ghost p-btn px-3 sm:px-4" onClick={() => void goTo((step + 1) as Step)}>
                      Next <ArrowRight size={16} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  )}
                  {step < LAST && !submitted ? (
                    <button type="submit" className="btn-portal p-btn sf-next">
                      Next
                      <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="submit" className="btn-portal p-btn sf-next sf-submit" disabled={!!busy || locked}>
                      {busy ? "Working…" : submitted ? "Save changes" : finishingNow && pastDeadline ? "Finish submitting" : "Submit entry"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Shell>
  );
}

/** One line of the review: a part of the entry, and a way back to change it. */
function SummaryRow({ name, ok, onEdit, locked, thumb, children }: { name: string; ok: boolean; onEdit: () => void; locked: boolean; thumb?: string | null; children: ReactNode }) {
  return (
    <li className="sf-sumrow" data-ok={ok}>
      <span className="sf-sumrow-name">
        {name}
        {!ok && <span className="sr-only"> (needs a look)</span>}
      </span>
      <span className="sf-sumrow-val">{children}</span>
      {thumb && <img src={thumb} alt="Your cover picture" className="sf-sumrow-thumb" />}
      {!locked && (
        <button type="button" className="sf-textbtn focus-ember" onClick={onEdit}>
          Edit<span className="sr-only"> {name.toLowerCase()}</span>
        </button>
      )}
    </li>
  );
}

/**
 * Under "Add more" once there's a model: the units the file is in (STL and
 * OBJ don't say), what the model measures, and the organizers' size spec if
 * there is one, so a team knows before submitting whether it fits.
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
    <div className="flex flex-col gap-3">
      <label className="flex flex-wrap items-center gap-3">
        <span className="p-label">Units in the model file</span>
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
            <p className="p-hint mt-1">Open the Files step with your model to check it against the spec.</p>
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
      <p className="max-w-[24ch] font-body text-sm text-concrete">Your model shows up here, in 3D.</p>
    </div>
  );
}

/** Entries started on this laptop, and a way for the next team to start clean. */
function SavedList({ compact = false }: { compact?: boolean }) {
  const [list, setList] = useState(savedEntries);
  if (!list.length) return null;
  return (
    <div className={compact ? "sf-saved" : "mt-6 max-w-[38rem]"}>
      <p className="p-hint">
        Started on this laptop:{" "}
        <button
          type="button"
          className="p-link focus-ember ml-1"
          onClick={() => {
            for (const s of savedEntries()) forgetEntry(s.id);
            writeTyped(null);
            setList([]);
            window.location.reload();
          }}
        >
          Not your team? Clear this laptop
        </button>
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
        {list.map((s) => (
          <li key={s.id} className="flex items-center gap-2 font-body text-[15px]">
            <Link to={`/submit/edit/${s.id}#k=${s.key}`} className="p-link focus-ember">
              {s.title || "Untitled entry"}
            </Link>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center text-concrete hover:text-foreground"
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

/** A file input dressed as a drop zone. */
function DropZone({
  slot,
  ariaLabel,
  multiple,
  onAdd,
  icon,
  title,
  sub,
  tile,
}: {
  slot: keyof Files;
  ariaLabel: string;
  multiple?: boolean;
  onAdd: (files: FileList) => void;
  icon: ReactNode;
  title: string;
  sub?: string;
  tile?: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className="sf-drop"
      data-over={over}
      data-tile={tile || undefined}
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
        aria-label={ariaLabel}
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="sf-drop-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="sf-drop-text">
        <span className="sf-drop-title">{title}</span>
        {sub && <span className="sf-drop-sub">{sub}</span>}
      </span>
    </label>
  );
}

function FilePicker({
  slot,
  label,
  ariaName,
  hint,
  optional,
  items,
  error,
  onAdd,
  onRemove,
  icon,
  cta,
  multiple,
  tiles,
}: {
  slot: keyof Files;
  label: string;
  /** How the file input is announced: "Choose <ariaName>". */
  ariaName: string;
  hint: string;
  optional?: boolean;
  items: Item[];
  error?: string;
  onAdd: (files: FileList) => void;
  onRemove: (item: Item) => void;
  icon: ReactNode;
  cta: string;
  multiple?: boolean;
  /** Pictures: thumbnails in a row instead of a list. */
  tiles?: boolean;
}) {
  const max = SLOTS[slot].maxCount;
  const full = items.length >= max;
  const single = max === 1;
  const itemErrors = items.filter((it): it is Extract<Item, { kind: "new" }> => it.kind === "new" && !!it.error);
  return (
    <div data-field-error={error ? "true" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="p-label">
          {label}
          {optional && <span className="ml-1.5 font-normal text-concrete">optional</span>}
        </p>
        {multiple && items.length > 0 && (
          <span className="p-mono text-[11px] text-concrete">
            {items.length}/{max}
          </span>
        )}
      </div>
      <p className="p-hint mt-0.5">{hint}</p>
      {tiles && items.length > 0 ? (
        <ul className="sf-tiles">
          {items.map((it, i) => (
            <PictureTile key={it.kind === "new" ? it.key : it.view.id} item={it} cover={i === 0} onRemove={() => onRemove(it)} />
          ))}
          {!full && (
            <li>
              <DropZone slot={slot} ariaLabel={`Choose ${ariaName}`} multiple={multiple} onAdd={onAdd} icon={<Plus size={20} strokeWidth={1.5} />} title="Add" tile />
            </li>
          )}
        </ul>
      ) : (
        <>
          {items.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2">
              {items.map((it) => (
                <FileRow
                  key={it.kind === "new" ? it.key : it.view.id}
                  item={it}
                  onRemove={() => onRemove(it)}
                  replace={single ? { slot, ariaLabel: `Replace ${ariaName}`, onAdd } : undefined}
                />
              ))}
            </ul>
          )}
          {!full && (
            <div className="mt-2">
              <DropZone slot={slot} ariaLabel={`Choose ${ariaName}`} multiple={multiple} onAdd={onAdd} icon={icon} title={cta} sub="or drop a file here" />
            </div>
          )}
        </>
      )}
      {tiles && itemErrors.map((it) => <p key={it.key} className="p-error">{`${it.file.name}: ${it.error}`}</p>)}
      {error && <p className="p-error">{error}</p>}
    </div>
  );
}

/** A picked file's local preview (or the saved copy's address). */
function useThumb(item: Item, isImage: boolean) {
  const [thumb] = useState(() => (isImage && item.kind === "new" ? URL.createObjectURL(item.file) : isImage && item.kind === "existing" ? item.view.url : ""));
  useEffect(() => () => void (thumb.startsWith("blob:") && URL.revokeObjectURL(thumb)), [thumb]);
  return thumb;
}

function PictureTile({ item, cover, onRemove }: { item: Item; cover: boolean; onRemove: () => void }) {
  const name = item.kind === "new" ? item.file.name : item.view.name;
  const thumb = useThumb(item, true);
  const failed = item.kind === "new" && !!item.error;
  return (
    <li className="sf-tile" data-failed={failed || undefined}>
      <img src={thumb} alt={name} />
      {cover && <span className="sf-tile-tag">Cover</span>}
      <button type="button" className="sf-tile-x focus-ember" aria-label={`Remove ${name}`} onClick={onRemove}>
        <X size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {item.kind === "new" && item.progress > 0 && (
        <span className="sf-tile-progress">
          <Progress value={item.progress} />
        </span>
      )}
    </li>
  );
}

function FileRow({
  item,
  onRemove,
  replace,
}: {
  item: Item;
  onRemove: () => void;
  replace?: { slot: keyof Files; ariaLabel: string; onAdd: (files: FileList) => void };
}) {
  const name = item.kind === "new" ? item.file.name : item.view.name;
  const size = item.kind === "new" ? item.file.size : item.view.size;
  const ext = extOf(name);
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext);
  const thumb = useThumb(item, isImage);
  return (
    <li>
      <div className="p-file sf-file">
        {thumb ? (
          <img src={thumb} alt="" className="h-9 w-9 rounded-[2px] object-cover" />
        ) : (
          <span className="p-mono grid h-9 w-9 place-items-center rounded-[2px] border border-bone/10 text-[10px] uppercase text-concrete">{ext}</span>
        )}
        <div className="min-w-0">
          <p className="truncate font-body text-sm text-foreground">{name}</p>
          <p className="p-mono text-[11px] text-concrete">
            {formatBytes(size)}
            {item.kind === "existing" && " · saved"}
            {item.kind === "new" && !item.error && item.progress === 0 && " · ready to upload"}
          </p>
        </div>
        <div className="flex items-center">
          {replace && (
            <label className="sf-replace focus-ember" title="Replace">
              <input
                type="file"
                accept={SLOTS[replace.slot].accept}
                aria-label={replace.ariaLabel}
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) replace.onAdd(e.target.files);
                  e.target.value = "";
                }}
              />
              <RefreshCw size={15} strokeWidth={1.5} aria-hidden="true" />
            </label>
          )}
          <button type="button" className="btn-ghost p-btn p-btn-sm border-transparent" aria-label={`Remove ${name}`} onClick={onRemove}>
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {item.kind === "new" && item.progress > 0 && <Progress value={item.progress} />}
      {item.kind === "new" && item.error && <p className="p-error">{item.error}</p>}
    </li>
  );
}

// ── Done ──────────────────────────────────────

function Done({
  entry,
  editKey,
  onEdit,
  deadline,
  judging,
  now,
}: {
  entry: OwnEntry;
  editKey: string;
  onEdit: () => void;
  deadline: string | null;
  judging?: PortalStatus["judging"] | null;
  now: number;
}) {
  const origin = window.location.origin;
  const share = `${origin}/entry/${entry.id}`;
  const edit = `${origin}/submit/edit/${entry.id}#k=${editKey}`;
  const mail = `mailto:${encodeURIComponent(entry.contactEmail)}?subject=${encodeURIComponent(`Mackenzie Design Cup entry: ${entry.title}`)}&body=${encodeURIComponent(
    `Share link (your entry's page):\n${share}\n\nPrivate edit link (don't share):\n${edit}\n`,
  )}`;
  return (
    <Shell section="Submitted">
      <div className="sf">
        {deadline && (
          <DeadlineBar
            deadline={deadline}
            now={now}
            closed={entry.locked || (now >= Date.parse(deadline) && !entry.unlocked)}
            reopened={entry.unlocked && !entry.locked}
          />
        )}
        <div className="sf-body">
          <div className="sf-wrap sf-done">
            <span className="sf-done-mark" aria-hidden="true">
              <Check size={30} strokeWidth={2.4} />
            </span>
            <h1 className="sf-title">You're submitted.</h1>
            <p className="sf-sub">
              <span className="text-foreground">{entry.title}</span> was submitted at {clock(entry.submittedAt)}.
              {entry.late && <span className="p-tag p-tag--bad ml-2">After the deadline</span>}
            </p>

            {entry.slot ? (
              <SlotNotice slot={entry.slot} className="" />
            ) : (
              <p className="sf-room">Your judging room and time appear on your edit link{deadline ? ` at ${clock(deadline)}` : " when submissions close"}.</p>
            )}

            <div className="sf-done-edit">
              <p className="sf-sub text-foreground">Copy your edit link, then you can close this page. It shows your judging room and time, and lets your team make changes until submissions close.</p>
              <CopyButton url={edit} label="Copy edit link" className="btn-portal p-btn sf-done-main" />
              <p className="p-hint">Keep it private: anyone with it can change your entry.</p>
              <input readOnly value={edit} className="p-input p-mono sf-done-url" onFocus={(e) => e.currentTarget.select()} aria-label="Edit link" />
            </div>

            <div className="sf-done-row">
              <CopyButton url={share} label="Copy share link" className="btn-ghost p-btn p-btn-sm" />
              <a href={share} target="_blank" rel="noopener" className="btn-ghost p-btn p-btn-sm focus-ember">
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" /> {entry.shareable ? "Open your page" : "Open (team and judges only)"}
              </a>
              <a href={mail} className="btn-ghost p-btn p-btn-sm focus-ember">
                <Mail size={14} strokeWidth={1.5} aria-hidden="true" /> Email both links
              </a>
            </div>

            <p className="sf-done-small">
              <button type="button" className="p-link focus-ember" onClick={onEdit}>
                Keep editing
              </button>
              <span>
                School laptop?{" "}
                <button
                  type="button"
                  className="p-link focus-ember"
                  onClick={() => {
                    forgetEntry(entry.id);
                    writeTyped(null);
                    window.location.assign("/submit");
                  }}
                >
                  Remove this entry from this laptop
                </button>{" "}
                (copy your edit link first)
              </span>
            </p>

            <details className="sf-more">
              <summary className="sf-more-sum focus-ember">
                <ChevronDown size={16} strokeWidth={1.6} className="sf-more-chev" aria-hidden="true" />
                <span>
                  What happens next
                  <span className="sf-more-hint">You present from your own laptop: a 1-minute pitch</span>
                </span>
              </summary>
              <div className="sf-more-body">
                <JudgingBriefing bare className="-mt-4" deadline={deadline} judging={judging} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function CopyButton({ url, label, className }: { url: string; label: string; className: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked: the link is in a selectable field */
        }
      }}
    >
      {copied ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={1.5} aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
