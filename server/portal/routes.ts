// Submission portal API. Mounted at /api/portal (the Vercel function, the
// Vite dev middleware and the local preview server all call handlePortal).
//
// Who can do what:
//   anyone          status · a shared entry (only if submitted, shareable,
//                   not hidden) · the gallery (entries organizers picked)
//   a team          create an entry with the day's entry code; then, holding
//                   the entry's edit key (X-Edit-Key header), read it, edit
//                   it, upload and remove files, submit. Until the deadline.
//   judges          every submitted entry with full details and files; their
//                   own marks
//   organizers      everything judges can, plus results, CSV, hide / gallery
//                   / award / reopen / delete, deadline and close switch
import type { FileSlot } from "../../src/portal/shared/formats.js";
import { SLOTS, checkFile, contentTypeFor, extOf } from "../../src/portal/shared/formats.js";
import { AWARDS, CRITERIA, MAX_TOTAL, cleanMarks, totalOf } from "../../src/portal/shared/judging.js";
import { hasSpec, specCheck, type Measure, type Spec } from "../../src/portal/shared/checks.js";
import { parseVideoLink } from "../../src/portal/shared/video.js";
import { checkVideoLink } from "./videocheck.js";
import { DEFAULT_REVEAL, originalityChecks } from "./originality.js";
import { inspectModel, sha256Of } from "./inspect.js";
import type {
  CheckView,
  EntryRecord,
  FileRef,
  FileView,
  JudgeCard,
  JudgeEntry,
  OwnEntry,
  PortalStatus,
  PublicEntry,
  Score,
  Slot,
} from "../../src/portal/shared/schema.js";
import { LIMITS, parseEntry, publicCredit } from "../../src/portal/shared/schema.js";
import {
  clearSessionCookie,
  judgeKey,
  makeSessionCookie,
  readSession,
  requireAdmin,
  requireJudge,
  roleForPasscode,
  type Session,
} from "./auth.js";
import { GRACE_SECONDS, type PortalConfig } from "./config.js";
import { normalizeCode, randomId, randomSecret, safeEqual, sha256 } from "./crypto.js";
import { DEFAULT_ROOMS, Db, filePath, type JudgeSheet, type RoomsSetup, type ScoresDoc, type SettingsDoc } from "./db.js";
import { BASE_HEADERS, HttpError, assertSameOrigin, clientIp, fail, rateLimit, readJson, sendJson, type Req, type Res } from "./http.js";
import { SNIFF_BYTES, sniff } from "./sniff.js";
import { BlobStorage } from "./storage/blob.js";
import { LocalStorage } from "./storage/local.js";
import { readTicket, signTicket } from "./tickets.js";

export interface PortalContext {
  cfg: PortalConfig;
  db: Db;
  /** Clock, overridable in tests. */
  now?: () => number;
}

const DOWNLOAD_TTL = 30 * 60; // seconds a file URL stays valid
const UPLOAD_TTL = 20 * 60; // seconds a team has to finish one upload
/** Model files up to this size are read whole for the fingerprint and metadata checks. */
const INSPECT_MAX_BYTES = 100 * 1024 * 1024;
const PENDING_MAX_AGE = 45 * 60 * 1000; // a signed-but-unfinished upload is forgotten after this

// ── Clock and deadline ────────────────────────

interface Window {
  deadline: number;
  now: number;
  /** New entries and normal edits are allowed. */
  open: boolean;
  inGrace: boolean;
  settings: SettingsDoc;
  /** Teams need the entry code. */
  codeOn: boolean;
  /** No entry code, and the reveal hasn't happened: when the form opens. */
  notYet: number | null;
}

async function windowOf(ctx: PortalContext): Promise<Window> {
  const settings = await ctx.db.read("settings");
  const now = ctx.now?.() ?? Date.now();
  const deadline = Date.parse(settings.deadlineOverride ?? ctx.cfg.deadline);
  const open = !settings.closed && now < deadline;
  const opensAt = settings.entryCodeOn === false ? Date.parse(settings.revealAt ?? DEFAULT_REVEAL) : null;
  const inGrace = !settings.closed && now >= deadline && now < deadline + GRACE_SECONDS * 1000;
  return { deadline, now, open, inGrace, settings, codeOn: settings.entryCodeOn !== false, notYet: opensAt !== null && now < opensAt ? opensAt : null };
}

/** May the team still change this entry? */
function canChange(w: Window, e: EntryRecord): boolean {
  if (e.unlocked) return true;
  if (w.open) return true;
  // Grace: a draft started before the deadline may finish uploading and submit.
  return w.inGrace && e.status === "draft" && Date.parse(e.createdAt) < w.deadline;
}

const iso = (ms: number) => new Date(ms).toISOString();

// ── Views ─────────────────────────────────────

async function fileView(ctx: PortalContext, f: FileRef, opts: { publicName?: string } = {}): Promise<FileView> {
  // Public views get a neutral name: a student's file name can hold their surname.
  const name = opts.publicName ? `${opts.publicName}.${f.ext}` : f.name;
  return {
    id: f.id,
    slot: f.slot,
    name,
    ext: f.ext,
    size: f.size,
    url: await ctx.db.storage.signedGetUrl(f.path, DOWNLOAD_TTL),
    ...(opts.publicName ? {} : { uploadedAt: f.uploadedAt }),
  };
}

/** The checks for an entry, each with the organizers' review if there is one. */
function checksFor(e: EntryRecord, all: EntryRecord[], settings: SettingsDoc): CheckView[] {
  return originalityChecks(e, all, settings.revealAt ?? DEFAULT_REVEAL).map((c) => ({ ...c, review: e.reviews?.[c.id] ?? null }));
}

/** Review-level checks no organizer has decided on yet. */
const openReviews = (checks: CheckView[]) => checks.filter((c) => c.level === "review" && !c.review).length;

/** Validates a measurement the browser sent. Anything odd becomes null (judges re-measure anyway). */
function cleanMeasure(raw: unknown): Measure | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null);
  const w = num(r.w, 1e7), d = num(r.d, 1e7), h = num(r.h, 1e7), area = num(r.area, 1e14), triangles = num(r.triangles, 5e7);
  if (w === null || d === null || h === null || area === null || triangles === null) return null;
  return { w, d, h, area, triangles: Math.round(triangles), volume: num(r.volume, 1e21), closed: r.closed === true };
}

const firstOf = (e: EntryRecord, slot: FileSlot) => e.files.find((f) => f.slot === slot) ?? null;

/** A video link as pages show it: the link, its host, and an embeddable player URL. */
function linkView(url: string | undefined) {
  const v = url ? parseVideoLink(url) : null;
  return v ? { url: v.url, host: v.host, embed: v.embed } : null;
}

async function publicView(ctx: PortalContext, e: EntryRecord): Promise<PublicEntry> {
  const model = firstOf(e, "model");
  // The team's own first picture is the cover; the captured still stands in without one.
  const thumb = firstOf(e, "image") ?? firstOf(e, "thumb");
  return {
    id: e.id,
    title: e.title,
    credit: publicCredit(e),
    software: e.software.map((s) => (s === "Other" && e.softwareOther ? e.softwareOther : s)),
    summary: e.summary,
    process: e.process,
    upAxis: e.upAxis,
    award: e.award,
    submittedAt: e.submittedAt,
    model: model ? await fileView(ctx, model, { publicName: "model" }) : null,
    images: await Promise.all(e.files.filter((f) => f.slot === "image").map((f, i) => fileView(ctx, f, { publicName: `render-${i + 1}` }))),
    thumb: thumb ? await fileView(ctx, thumb, { publicName: "preview" }) : null,
    video: firstOf(e, "video") ? await fileView(ctx, firstOf(e, "video")!, { publicName: "video" }) : null,
    videoLink: linkView(e.videoLink),
    hasModel: !!model,
  };
}

async function ownView(ctx: PortalContext, w: Window, e: EntryRecord): Promise<OwnEntry> {
  const { id, status, submittedAt, late } = e;
  const all = Object.values((await ctx.db.read("entries")).entries);
  // The team sees the neutral wording of open review-level checks, never another team's name.
  const notices = checksFor(e, all, w.settings)
    .filter((c) => c.level === "review" && c.teamNote && c.review?.status !== "cleared")
    .map((c) => c.teamNote);
  return {
    ...inputOf(e),
    id,
    status,
    submittedAt,
    late,
    files: await Promise.all(e.files.map((f) => fileView(ctx, f))),
    locked: !canChange(w, e),
    notices,
    videoCheck: e.videoCheck ?? null,
    slot: slotOf(w.settings, e.id),
  };
}

const slotOf = (settings: SettingsDoc, id: string): Slot | null => (settings.schedule && Object.hasOwn(settings.schedule, id) ? settings.schedule[id] : null);
const roomsOf = (settings: SettingsDoc): RoomsSetup => ({ ...DEFAULT_ROOMS, ...(settings.rooms ?? {}) });
/** The room a judge sits in, if organizers set one. */
const roomOfJudge = (settings: SettingsDoc, key: string): string | null => {
  const r = roomsOf(settings);
  const room = r.judgeRooms[key];
  return room && r.names.includes(room) ? room : null;
};

function inputOf(e: EntryRecord) {
  const { title, teamName, members, contactEmail, software, softwareOther, summary, process, aiUse, aiNote, credit, shareable, original, upAxis } = e;
  return {
    title,
    teamName,
    members,
    contactEmail,
    software,
    softwareOther,
    summary,
    process,
    aiUse,
    aiNote,
    credit,
    shareable,
    original,
    upAxis,
    // Fields added after the first entries existed: default them.
    units: e.units ?? "mm",
    cadLink: e.cadLink ?? "",
    filesNote: e.filesNote ?? "",
    videoLink: e.videoLink ?? "",
    presentation: e.presentation ?? "",
  };
}

async function judgeView(ctx: PortalContext, e: EntryRecord, s: Session): Promise<JudgeEntry> {
  const [scores, settings, doc] = await Promise.all([ctx.db.read("scores"), ctx.db.read("settings"), ctx.db.read("entries")]);
  const mine = scores.judges[s.key]?.scores[e.id] ?? null;
  const scoreCount = countedSheets(scores, settings).filter(([, j]) => totalOf(j.scores[e.id]?.marks) !== null).length;
  return {
    ...inputOf(e),
    id: e.id,
    status: e.status,
    createdAt: e.createdAt,
    submittedAt: e.submittedAt,
    late: e.late,
    creditLine: publicCredit(e),
    hidden: e.hidden,
    gallery: e.gallery,
    award: e.award,
    unlocked: e.unlocked,
    files: await Promise.all(e.files.map((f) => fileView(ctx, f))),
    myScore: mine,
    scoreCount,
    measure: e.measure ?? null,
    checks: checksFor(e, Object.values(doc.entries), settings),
    modelMeta: firstOf(e, "model")?.meta ?? null,
    videoCheck: e.videoCheck ?? null,
    slot: slotOf(settings, e.id),
  };
}

// ── Entry helpers ─────────────────────────────

function editKeyOf(req: Req): string {
  const k = req.headers["x-edit-key"];
  return typeof k === "string" ? k : "";
}

async function loadOwned(ctx: PortalContext, req: Req, id: string): Promise<EntryRecord> {
  const doc = await ctx.db.read("entries", { fresh: true });
  const e = doc.entries[id];
  const key = editKeyOf(req);
  // Same answer for "no such entry" and "wrong key": ids are not confirmable by guessing keys.
  if (!e || !key || !safeEqual(sha256(key), e.editKeyHash)) fail(404, "Entry not found, or this edit link is wrong.");
  return e;
}

/** Re-checks ownership inside a mutation (the document may have changed since). */
function ownedIn(entries: Record<string, EntryRecord>, id: string, req: Req): EntryRecord {
  const e = entries[id];
  const key = editKeyOf(req);
  if (!e || !key || !safeEqual(sha256(key), e.editKeyHash)) fail(404, "Entry not found, or this edit link is wrong.");
  return e;
}

/** Forgets uploads signed long ago and never finished; returns their storage keys to delete. */
function prunePending(e: EntryRecord, now: number): string[] {
  const stale: string[] = [];
  for (const [id, p] of Object.entries(e.pending)) {
    if (now - Date.parse(p.signedAt) > PENDING_MAX_AGE) {
      stale.push(p.path);
      delete e.pending[id];
    }
  }
  return stale;
}

/** Step timings for slow-request debugging (PORTAL_DEBUG_TIMING=1); a no-op otherwise. */
function stopwatch(label: string) {
  const on = !!process.env.PORTAL_DEBUG_TIMING;
  let last = Date.now();
  return (step: string) => {
    if (!on) return;
    const now = Date.now();
    console.log(`[portal:timing] ${label} ${step} ${now - last} ms`);
    last = now;
  };
}

const SLOT_NAMES: readonly FileSlot[] = ["video", "model", "image", "progress", "source", "thumb"];

/** Bytes the portal may keep in the store (default 900 MB of the free plan's 1 GB). */
const storageBudget = () => Math.max(50, Number(process.env.PORTAL_STORAGE_BUDGET_MB) || 900) * 1024 * 1024;

/** Keys of the organizers' judges list, or null when there is no list. */
function rosterKeys(settings: SettingsDoc): Set<string> | null {
  const names = settings.judges ?? [];
  return names.length ? new Set(names.map(judgeKey)) : null;
}

/** Whether a signed-in person's marks go into Results. */
const marksCount = (settings: SettingsDoc, key: string) => {
  const roster = rosterKeys(settings);
  return !roster || roster.has(key);
};

/** The score sheets that count: everyone's, or only listed judges' once a list exists. */
function countedSheets(scores: ScoresDoc, settings: SettingsDoc): [string, JudgeSheet][] {
  const roster = rosterKeys(settings);
  return Object.entries(scores.judges).filter(([key]) => !roster || roster.has(key));
}

// ── Router ────────────────────────────────────

type Handler = (ctx: PortalContext, req: Req, res: Res, params: Record<string, string>, url: URL) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  /** State-changing: needs the same-origin guard. */
  mutates: boolean;
}

const routes: Route[] = [];

function on(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    `^${path.replace(/:([a-zA-Z]+)/g, (_, k) => {
      keys.push(k);
      return "([A-Za-z0-9]{1,64})"; // ids are alphanumeric: no __proto__ and friends
    })}$`,
  );
  routes.push({ method, pattern, keys, handler, mutates: method !== "GET" && method !== "HEAD" });
}

// ── Public ────────────────────────────────────

on("GET", "/status", async (ctx, _req, res) => {
  const w = await windowOf(ctx);
  const body: PortalStatus & { devDefaults: boolean; storage: string } = {
    deadline: iso(w.deadline),
    open: w.open,
    graceSeconds: GRACE_SECONDS,
    now: iso(w.now),
    devDefaults: ctx.cfg.devDefaults,
    storage: ctx.cfg.storage,
    spec: hasSpec(w.settings.spec) ? w.settings.spec : null,
    codeRequired: w.codeOn,
    opensAt: w.notYet ? iso(w.notYet) : null,
  };
  sendJson(res, 200, body);
});

// "Check link" on the form: is the video viewable without signing in?
on("POST", "/video-check", async (ctx, req, res) => {
  rateLimit(`vcheck:${clientIp(req)}`, 60, 10 * 60 * 1000);
  const body = await readJson(req);
  const url = String(body.url ?? "").slice(0, 500);
  if (!parseVideoLink(url)) fail(422, "Use a share link from YouTube, Google Drive, Vimeo, Loom, OneDrive or Dropbox.", { field: "videoLink" });
  sendJson(res, 200, await checkVideoLink(url));
});

// The public submissions page, when organizers switch it on in Settings.
on("GET", "/submissions", async (ctx, _req, res) => {
  const [doc, settings] = await Promise.all([ctx.db.read("entries"), ctx.db.read("settings")]);
  const mode = settings.publicListing ?? "off";
  if (mode === "off") return sendJson(res, 200, { mode, entries: [] });
  const list = Object.values(doc.entries)
    .filter((e) => e.status === "submitted" && e.shareable && !e.hidden && (mode === "all" || e.gallery))
    .sort((a, b) => awardRank(a.award) - awardRank(b.award) || String(a.submittedAt).localeCompare(String(b.submittedAt)));
  const entries = await Promise.all(
    list.map(async (e) => {
      const v = await publicView(ctx, e);
      // Cards: a YouTube poster when there's no captured thumbnail.
      if (!v.thumb && v.videoLink?.host === "youtube") {
        const thumb = parseVideoLink(v.videoLink.url)?.thumb;
        if (thumb) v.thumb = { id: "yt", slot: "thumb", name: "preview.jpg", ext: "jpg", size: 0, url: thumb };
      }
      return v;
    }),
  );
  sendJson(res, 200, { mode, entries });
});

on("GET", "/entry/:id", async (ctx, req, res, { id }) => {
  const doc = await ctx.db.read("entries");
  const e = doc.entries[id];
  // A judge may preview a share page before it is public.
  const judge = readSession(ctx.cfg, req);
  const visible = e && e.status === "submitted" && ((e.shareable && !e.hidden) || judge);
  if (!visible) fail(404, "This entry isn't available.");
  sendJson(res, 200, await publicView(ctx, e));
});

on("GET", "/gallery", async (ctx, _req, res) => {
  const doc = await ctx.db.read("entries");
  const list = Object.values(doc.entries)
    .filter((e) => e.status === "submitted" && e.gallery && e.shareable && !e.hidden)
    .sort((a, b) => awardRank(a.award) - awardRank(b.award) || String(a.submittedAt).localeCompare(String(b.submittedAt)));
  sendJson(res, 200, { entries: await Promise.all(list.map((e) => publicView(ctx, e))) });
});

const awardRank = (a: string) => {
  const i = AWARDS.indexOf(a as (typeof AWARDS)[number]);
  return a && i > 0 ? i : 99;
};

// ── Teams ─────────────────────────────────────

on("POST", "/entries", async (ctx, req, res) => {
  const ip = clientIp(req);
  rateLimit(`create:${ip}`, 150, 10 * 60 * 1000);
  const body = await readJson(req);
  const w = await windowOf(ctx);
  if (w.codeOn) {
    const code = normalizeCode(String(body.code ?? ""));
    // The right code always works; only wrong ones are counted, so a burst of
    // typos (or a script) from the shared venue IP never locks out real teams.
    if (!code || !safeEqual(code, normalizeCode(ctx.cfg.entryCode))) {
      rateLimit(`code:${ip}`, 60, 10 * 60 * 1000);
      fail(403, "That entry code isn't right. It's on the screen at the front of the room.", { field: "code" });
    }
  } else if (w.notYet) {
    // No code: nobody starts an entry before the theme is out.
    fail(409, `Submissions open at the theme reveal, ${torontoTime(w.notYet)}.`, { opensAt: iso(w.notYet) });
  }
  if (!w.open) fail(409, "Submissions are closed.");
  // A draft (Save draft) needs only a title; submitting checks everything.
  const parsed = parseEntry(body.entry, { draft: body.draft === true });
  if (!parsed.ok) fail(422, "Some fields need another look.", { errors: parsed.errors });
  const value = parsed.value;
  const measure = cleanMeasure(body.measure);
  const videoCheck = value.videoLink ? await checkVideoLink(value.videoLink) : null;
  const editKey = randomSecret();
  const now = iso(w.now);
  const record = await ctx.db.mutate("entries", (doc) => {
    if (Object.keys(doc.entries).length >= 1000) fail(507, "The portal is full. Find an organizer.");
    let id = randomId();
    while (doc.entries[id]) id = randomId();
    const e: EntryRecord = {
      ...value,
      id,
      editKeyHash: sha256(editKey),
      status: "draft",
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      late: false,
      files: [],
      pending: {},
      hidden: false,
      gallery: false,
      award: "",
      unlocked: false,
      measure,
      reviews: {},
      videoCheck,
    };
    doc.entries[id] = e;
    return e;
  });
  sendJson(res, 201, { id: record.id, editKey, entry: await ownView(ctx, w, record) });
});

on("GET", "/entries/:id", async (ctx, req, res, { id }) => {
  const e = await loadOwned(ctx, req, id);
  sendJson(res, 200, { entry: await ownView(ctx, await windowOf(ctx), e) });
});

on("PUT", "/entries/:id", async (ctx, req, res, { id }) => {
  const current = await loadOwned(ctx, req, id);
  const body = await readJson(req);
  // Drafts save with just a title; a submitted entry must stay complete.
  const parsed = parseEntry(body.entry, { draft: body.draft === true && current.status === "draft" });
  if (!parsed.ok) fail(422, "Some fields need another look.", { errors: parsed.errors });
  const value = parsed.value;
  const measure = "measure" in body ? cleanMeasure(body.measure) : undefined;
  // A new or changed video link is opened once, like a judge would.
  const videoCheck = value.videoLink && value.videoLink !== current.videoLink ? await checkVideoLink(value.videoLink) : undefined;
  const w = await windowOf(ctx);
  const e = await ctx.db.mutate("entries", (doc) => {
    const e = ownedIn(doc.entries, id, req);
    if (!canChange(w, e)) fail(409, "Submissions are closed. This entry can't be changed now.");
    Object.assign(e, value, { updatedAt: iso(w.now) });
    if (measure !== undefined) e.measure = measure;
    if (!value.videoLink) e.videoCheck = null;
    else if (videoCheck) e.videoCheck = videoCheck;
    return e;
  });
  sendJson(res, 200, { entry: await ownView(ctx, w, e) });
});

on("POST", "/entries/:id/files", async (ctx, req, res, { id }) => {
  rateLimit(`sign:${id}`, 40, 10 * 60 * 1000);
  await loadOwned(ctx, req, id);
  const body = await readJson(req);
  const slot = String(body.slot) as FileSlot;
  if (!SLOT_NAMES.includes(slot)) fail(400, "Unknown file slot.");
  const name = String(body.name ?? "").slice(0, 200);
  const size = Number(body.size);
  const problem = checkFile(slot, name, Number.isFinite(size) ? size : 0);
  if (problem) fail(422, problem);
  const rule = SLOTS[slot];
  const w = await windowOf(ctx);
  const fileId = randomId(10);
  const ext = extOf(name);
  const path = filePath(id, fileId, ext);
  let stale: string[] = [];
  await ctx.db.mutate("entries", (doc) => {
    const e = ownedIn(doc.entries, id, req);
    if (!canChange(w, e)) fail(409, "Submissions are closed.");
    stale = prunePending(e, w.now);
    // Single-file slots replace on completion; multi-file slots have a cap.
    if (rule.maxCount > 1) {
      const used = e.files.filter((f) => f.slot === slot).length + Object.values(e.pending).filter((p) => p.slot === slot).length;
      if (used >= rule.maxCount) fail(409, `Up to ${rule.maxCount} files here. Remove one first.`);
    }
    if (Object.keys(e.pending).length >= 8) fail(429, "Too many uploads in progress. Wait for them to finish.");
    // The free Blob store is small: refuse an upload that would overfill it,
    // and point video uploads at a link instead.
    const used = Object.values(doc.entries).reduce(
      (sum, x) => sum + x.files.reduce((a, f) => a + f.size, 0) + Object.values(x.pending).reduce((a, f) => a + f.size, 0),
      0,
    );
    if (used + size > storageBudget()) {
      fail(507, slot === "video" ? "Upload space is full. Put your video on YouTube (Unlisted) or Google Drive and paste the link instead." : "Upload space is full. Find an organizer.", { field: slot });
    }
    e.pending[fileId] = { id: fileId, slot, name, ext, size, path, uploadedAt: "", signedAt: iso(w.now) };
  });
  if (stale.length) await ctx.db.storage.delete(stale).catch(() => {});
  const contentType = contentTypeFor(ext);
  const grant = { kind: "put" as const, p: path, max: rule.maxBytes, ct: contentType, exp: w.now + UPLOAD_TTL * 1000 };
  const ticket = await ctx.db.storage.uploadTicket(path, {
    maxBytes: rule.maxBytes,
    contentType,
    ttlSeconds: UPLOAD_TTL,
    clientPayload: signTicket(ctx.cfg.sessionSecret, grant),
  });
  sendJson(res, 200, { fileId, contentType, ticket });
});

on("POST", "/entries/:id/files/:fileId/complete", async (ctx, req, res, { id, fileId }) => {
  const lap = stopwatch("complete");
  const e0 = await loadOwned(ctx, req, id);
  lap("loadOwned");
  const pending = e0.pending[fileId];
  if (!pending) fail(404, "That upload has expired. Pick the file again.");
  const storage = ctx.db.storage;
  const info = await storage.head(pending.path);
  lap("head");
  if (!info) fail(409, "The file didn't arrive. Try the upload again.");
  const rule = SLOTS[pending.slot];
  const reject = async (msg: string) => {
    await storage.delete([pending.path]).catch(() => {});
    await ctx.db.mutate("entries", (doc) => {
      delete doc.entries[id]?.pending[fileId];
    });
    fail(422, `${pending.name}: ${msg}.`);
  };
  if (info.size > rule.maxBytes || info.size === 0) await reject("wrong size");
  // Blob reports the stored type; it must be the one this upload was signed for.
  if (info.contentType && info.contentType.split(";")[0].trim() !== contentTypeFor(pending.ext)) await reject("unexpected file type");
  const head = (await storage.readHead(pending.path, SNIFF_BYTES)) ?? new Uint8Array();
  lap("readHead");
  const why = sniff(pending.ext, head, info.size);
  if (why) await reject(why);

  // Model files: a fingerprint (identical files across entries) and the file's own metadata.
  let fingerprint: Pick<FileRef, "sha256" | "meta"> = {};
  // Very large files skip it: reading them whole could outlast the function's time limit.
  if (pending.slot === "model" && info.size <= INSPECT_MAX_BYTES) {
    const bytes = await storage.readAll(pending.path, INSPECT_MAX_BYTES);
    if (bytes) fingerprint = { sha256: sha256Of(bytes), meta: inspectModel(pending.ext, bytes) };
    lap("readAll+inspect");
  }

  const w = await windowOf(ctx);
  const removed: string[] = [];
  const e = await ctx.db.mutate("entries", (doc) => {
    removed.length = 0;
    const e = ownedIn(doc.entries, id, req);
    const p = e.pending[fileId];
    if (!p) fail(404, "That upload has expired. Pick the file again.");
    // An upload signed in time may land a little after the deadline (grace).
    const signedInTime = Date.parse(p.signedAt) < w.deadline || e.unlocked;
    if (!canChange(w, e) && !(signedInTime && w.now < w.deadline + GRACE_SECONDS * 1000)) fail(409, "Submissions are closed.");
    delete e.pending[fileId];
    if (rule.maxCount === 1) {
      for (const old of e.files.filter((f) => f.slot === p.slot)) removed.push(old.path);
      e.files = e.files.filter((f) => f.slot !== p.slot);
    }
    e.files.push({ ...p, size: info.size, uploadedAt: iso(w.now), ...fingerprint });
    e.updatedAt = iso(w.now);
    // Swapping the model after submitting keeps the entry submitted; late if after the deadline.
    if (e.status === "submitted" && w.now >= w.deadline && !e.unlocked) e.late = true;
    return e;
  });
  lap("mutate");
  if (removed.length) await storage.delete(removed).catch(() => {});
  const view = await ownView(ctx, w, e);
  lap("ownView");
  sendJson(res, 200, { entry: view });
});

on("DELETE", "/entries/:id/files/:fileId", async (ctx, req, res, { id, fileId }) => {
  await loadOwned(ctx, req, id);
  const w = await windowOf(ctx);
  let path = "";
  const e = await ctx.db.mutate("entries", (doc) => {
    const e = ownedIn(doc.entries, id, req);
    if (!canChange(w, e)) fail(409, "Submissions are closed.");
    const f = e.files.find((x) => x.id === fileId);
    if (!f) fail(404, "No such file.");
    if (e.status === "submitted" && !hasVisual({ ...e, files: e.files.filter((x) => x.id !== fileId) })) fail(409, VISUAL_NEEDED);
    path = f.path;
    e.files = e.files.filter((x) => x.id !== fileId);
    e.updatedAt = iso(w.now);
    return e;
  });
  await ctx.db.storage.delete([path]).catch(() => {});
  sendJson(res, 200, { entry: await ownView(ctx, w, e) });
});

/** Something judges and the public page can look at: an image, a video or a 3D model. */
const hasVisual = (e: Pick<EntryRecord, "files" | "videoLink">) => !!e.videoLink || e.files.some((f) => f.slot === "image" || f.slot === "video" || f.slot === "model");
const VISUAL_NEEDED = "Add at least one picture of your design: a render or screenshot, a video, or your 3D model.";

on("POST", "/entries/:id/submit", async (ctx, req, res, { id }) => {
  const before = await loadOwned(ctx, req, id);
  const recheck = before.videoLink && before.videoCheck?.status !== "public" ? await checkVideoLink(before.videoLink) : null;
  const w = await windowOf(ctx);
  const e = await ctx.db.mutate("entries", (doc) => {
    const e = ownedIn(doc.entries, id, req);
    if (recheck && e.videoLink === before.videoLink) e.videoCheck = recheck;
    if (!canChange(w, e)) fail(409, "Submissions are closed.");
    const parsed = parseEntry(e);
    if (!parsed.ok) fail(422, "Some fields need another look.", { errors: parsed.errors });
    if (!hasVisual(e)) fail(422, VISUAL_NEEDED, { field: "visuals" });
    if (e.status !== "submitted") {
      e.status = "submitted";
      e.submittedAt = iso(w.now);
      e.late = w.now >= w.deadline && !e.unlocked;
    }
    e.updatedAt = iso(w.now);
    return e;
  });
  sendJson(res, 200, { entry: await ownView(ctx, w, e) });
});

// The Vercel Blob client SDK's presigned-upload handshake (blob storage only).
on("POST", "/blob-upload", async (ctx, req, res) => {
  const storage = ctx.db.storage;
  if (!(storage instanceof BlobStorage)) fail(404, "Not found.");
  const body = await readJson(req);
  if (body.type !== "blob.generate-presigned-url") fail(400, "Unsupported upload event.");
  const payload = (body.payload ?? {}) as { pathname?: unknown; clientPayload?: unknown };
  const grant = readTicket(ctx.cfg.sessionSecret, String(payload.clientPayload ?? ""), "put");
  if (!grant || grant.p !== payload.pathname) fail(403, "This upload link has expired. Pick the file again.");
  const ttl = Math.max(60, Math.floor((grant.exp - Date.now()) / 1000));
  const presignedUrlPayload = await (storage as BlobStorage).presignPutPayload(grant.p, grant.max, ttl, grant.ct);
  sendJson(res, 200, { type: "blob.generate-presigned-url", presignedUrlPayload });
});

// Local storage only: the browser PUTs a file here with its signed ticket.
on("PUT", "/local-upload", async (ctx, req, res, _p, url) => {
  const storage = ctx.db.storage;
  if (!(storage instanceof LocalStorage)) fail(404, "Not found.");
  const grant = readTicket(ctx.cfg.sessionSecret, url.searchParams.get("t") ?? "", "put");
  if (!grant) fail(403, "This upload link has expired.");
  const declared = Number(req.headers["content-length"]);
  if (Number.isFinite(declared) && declared > grant.max) fail(413, "File too large.");
  try {
    const size = await (storage as LocalStorage).writeObject(grant.p, req as AsyncIterable<Buffer>, grant.max);
    sendJson(res, 200, { pathname: grant.p, size });
  } catch (e) {
    if (e instanceof RangeError) fail(413, "File too large.");
    throw e;
  }
});

// Local storage only: a signed download.
on("GET", "/local-file", async (ctx, req, res, _p, url) => {
  const storage = ctx.db.storage;
  if (!(storage instanceof LocalStorage)) fail(404, "Not found.");
  const grant = readTicket(ctx.cfg.sessionSecret, url.searchParams.get("t") ?? "", "get");
  if (!grant) fail(403, "This link has expired.");
  const fs = await import("node:fs");
  const file = (storage as LocalStorage).resolve(grant.p);
  if (!fs.existsSync(file)) fail(404, "Not found.");
  const ext = extOf(grant.p);
  res.writeHead(200, {
    ...BASE_HEADERS,
    "Cache-Control": "private, max-age=600",
    "Content-Type": contentTypeFor(ext),
    "Content-Length": String(fs.statSync(file).size),
    "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  if (req.method === "HEAD") return void res.end();
  await new Promise<void>((resolve, reject) => fs.createReadStream(file).on("error", reject).on("end", resolve).pipe(res));
});

// ── Judges ────────────────────────────────────

on("POST", "/judge/login", async (ctx, req, res) => {
  const ip = clientIp(req);
  const body = await readJson(req);
  const name = String(body.name ?? "").replace(/\s+/g, " ").trim().slice(0, LIMITS.name);
  if (name.length < 2) fail(422, "Your name, please (it goes on your marks).", { field: "name" });
  const role = roleForPasscode(ctx.cfg, String(body.passcode ?? ""));
  // With a judges list, only listed judges get in (organizers always do). The
  // passcode alone then can't add phantom judges to swing the averages.
  if (role === "judge") {
    const roster = rosterKeys(await ctx.db.read("settings"));
    if (roster && !roster.has(judgeKey(name))) fail(403, "Your name isn't on the judges list. Use the name the organizers have, or ask them to add you.", { field: "name" });
  }
  if (!role) {
    // The right passcode always works; wrong ones are limited per IP and name.
    rateLimit(`login:${ip}:${judgeKey(name)}`, 10, 5 * 60 * 1000);
    rateLimit(`login:${ip}`, 60, 5 * 60 * 1000);
    fail(401, "That passcode isn't right.", { field: "passcode" });
  }
  const { cookie, session } = makeSessionCookie(ctx.cfg, role, name);
  if (!session.key) fail(422, "Use letters or numbers in your name.", { field: "name" });
  sendJson(res, 200, { role: session.role, name: session.name }, { "Set-Cookie": cookie });
});

on("POST", "/judge/logout", async (ctx, _req, res) => {
  sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie(ctx.cfg) });
});

on("GET", "/judge/me", async (ctx, req, res) => {
  const s = readSession(ctx.cfg, req);
  // Signed out: the organizers' judges list, so the sign-in page can offer the
  // names to pick from (no typos that would lock a judge out). Names only.
  const roster = s ? [] : ((await ctx.db.read("settings")).judges ?? []);
  sendJson(res, 200, s ? { role: s.role, name: s.name } : { role: null, roster });
});

on("GET", "/judge/entries", async (ctx, req, res) => {
  const s = requireJudge(ctx.cfg, req);
  const [doc, scores, w] = await Promise.all([ctx.db.read("entries"), ctx.db.read("scores"), windowOf(ctx)]);
  const all = Object.values(doc.entries);
  const submitted = all.filter((e) => e.status === "submitted");
  const mine = scores.judges[s.key]?.scores ?? {};
  const counted = countedSheets(scores, w.settings);
  const spec = hasSpec(w.settings.spec) ? w.settings.spec : null;
  const cards: JudgeCard[] = await Promise.all(
    submitted
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
      .map(async (e) => {
        const thumb = firstOf(e, "image") ?? firstOf(e, "thumb");
        return {
          id: e.id,
          title: e.title,
          creditLine: publicCredit(e),
          memberCount: e.members.length,
          schools: [...new Set(e.members.map((m) => m.school))],
          software: e.software.map((x) => (x === "Other" && e.softwareOther ? e.softwareOther : x)),
          submittedAt: e.submittedAt,
          late: e.late,
          hidden: e.hidden,
          award: e.award,
          modelExt: firstOf(e, "model")?.ext ?? null,
          thumb: thumb ? await ctx.db.storage.signedGetUrl(thumb.path, DOWNLOAD_TTL) : (e.videoLink ? parseVideoLink(e.videoLink)?.thumb ?? null : null),
          myTotal: totalOf(mine[e.id]?.marks),
          scoreCount: counted.filter(([, j]) => totalOf(j.scores[e.id]?.marks) !== null).length,
          openReviews: openReviews(checksFor(e, all, w.settings)),
          specFails: spec && e.measure ? specCheck(e.measure, spec).filter((l) => l.ok === false).length : null,
          slot: slotOf(w.settings, e.id),
        };
      }),
  );
  sendJson(res, 200, {
    me: { role: s.role, name: s.name },
    cards,
    nextToMark: nextToMark(all, scores, w.settings, s.key),
    myRoom: roomOfJudge(w.settings, s.key),
    drafts: s.role === "admin" ? all.length - submitted.length : undefined,
    // Whether this person's marks go into Results (with a judges list, only listed judges' do).
    marksCount: marksCount(w.settings, s.key),
    deadline: iso(w.deadline),
    open: w.open,
  });
});

on("GET", "/judge/entries/:id", async (ctx, req, res, { id }) => {
  const s = requireJudge(ctx.cfg, req);
  const doc = await ctx.db.read("entries");
  const e = doc.entries[id];
  if (!e || (e.status !== "submitted" && s.role !== "admin")) fail(404, "No such entry.");
  const order = Object.values(doc.entries)
    .filter((x) => x.status === "submitted")
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
    .map((x) => x.id);
  const i = order.indexOf(id);
  const [scores, settings] = await Promise.all([ctx.db.read("scores"), ctx.db.read("settings")]);
  const mine = scores.judges[s.key]?.scores ?? {};
  sendJson(res, 200, {
    entry: await judgeView(ctx, e, s),
    spec: hasSpec(settings.spec) ? settings.spec : null,
    prev: i > 0 ? order[i - 1] : null,
    next: i >= 0 && i < order.length - 1 ? order[i + 1] : null,
    nextToMark: nextToMark(Object.values(doc.entries), scores, settings, s.key, id),
    toMark: order.filter((x) => totalOf(mine[x]?.marks) === null).length,
    total: order.length,
    marksCount: marksCount(settings, s.key),
  });
});

on("PUT", "/judge/entries/:id/score", async (ctx, req, res, { id }) => {
  const s = requireJudge(ctx.cfg, req);
  const body = await readJson(req);
  const doc = await ctx.db.read("entries");
  if (doc.entries[id]?.status !== "submitted") fail(404, "No such entry.");
  const score: Score = {
    marks: cleanMarks(body.marks),
    notes: String(body.notes ?? "").slice(0, 2000),
    updatedAt: new Date().toISOString(),
  };
  await ctx.db.mutate("scores", (sc) => {
    const sheet = (sc.judges[s.key] ??= { name: s.name, role: s.role, scores: {} });
    sheet.name = s.name;
    sheet.scores[id] = score;
  });
  sendJson(res, 200, { score, total: totalOf(score.marks) });
});

/**
 * The entry this judge should mark next: one they haven't marked, with the
 * fewest marks so far (so every entry gets judged before any gets a third
 * look), oldest submission first.
 */
function nextToMark(all: EntryRecord[], scores: ScoresDoc, settings: SettingsDoc, judge: string, except?: string): string | null {
  const counted = countedSheets(scores, settings);
  const mine = scores.judges[judge]?.scores ?? {};
  // A judge with a room follows that room's schedule, in time order.
  const room = roomOfJudge(settings, judge);
  if (room && settings.schedule) {
    const queue = all
      .filter((e) => e.status === "submitted" && e.id !== except && totalOf(mine[e.id]?.marks) === null && slotOf(settings, e.id)?.room === room)
      .sort((a, b) => slotOf(settings, a.id)!.at.localeCompare(slotOf(settings, b.id)!.at));
    if (queue.length) return queue[0].id;
  }
  const pick = all
    .filter((e) => e.status === "submitted" && e.id !== except && totalOf(mine[e.id]?.marks) === null)
    .map((e) => ({ e, n: counted.filter(([, j]) => totalOf(j.scores[e.id]?.marks) !== null).length }))
    .sort((a, b) => a.n - b.n || String(a.e.submittedAt).localeCompare(String(b.e.submittedAt)))[0];
  return pick?.e.id ?? null;
}

const torontoTime = (ms: number) => new Date(ms).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

// ── Organizers ────────────────────────────────

on("GET", "/judge/results", async (ctx, req, res) => {
  requireAdmin(ctx.cfg, req);
  sendJson(res, 200, await results(ctx));
});

async function results(ctx: PortalContext) {
  const [doc, scores, settings] = await Promise.all([ctx.db.read("entries"), ctx.db.read("scores"), ctx.db.read("settings")]);
  const counted = countedSheets(scores, settings);
  const countedKeys = new Set(counted.map(([key]) => key));
  const judges = counted.map(([key, j]) => ({ key, name: j.name }));
  // Marks from people not on the list: shown so organizers notice, never averaged.
  const unlisted = Object.entries(scores.judges)
    .filter(([key]) => !countedKeys.has(key))
    .map(([key, j]) => ({ key, name: j.name, marked: Object.values(j.scores).filter((x) => totalOf(x.marks) !== null).length }));
  const rows = Object.values(doc.entries)
    .filter((e) => e.status === "submitted")
    .map((e) => {
      const marked = counted
        .map(([key, j]) => ({ key, score: j.scores[e.id] }))
        .filter((x) => totalOf(x.score?.marks) !== null);
      const totals = marked.map((x) => totalOf(x.score.marks) as number);
      const average = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null;
      const perCriterion: Record<string, number | null> = {};
      for (const c of CRITERIA) {
        const vals = marked.map((x) => x.score.marks[c.id]);
        perCriterion[c.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      }
      return {
        id: e.id,
        title: e.title,
        creditLine: publicCredit(e),
        members: e.members,
        contactEmail: e.contactEmail,
        late: e.late,
        award: e.award,
        submittedAt: e.submittedAt,
        average,
        perCriterion,
        byJudge: Object.fromEntries(marked.map((x) => [x.key, totalOf(x.score.marks)])),
        notes: marked.filter((x) => x.score.notes).map((x) => ({ judge: scores.judges[x.key].name, notes: x.score.notes })),
        judgeCount: marked.length,
        openReviews: openReviews(checksFor(e, Object.values(doc.entries), settings)),
      };
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  // For the live board: every judge on the list (marked anything yet or not),
  // how many entries each has marked and when they last saved.
  const sheetFor = new Map(counted);
  const keys = settings.judges?.length ? settings.judges.map((n) => [judgeKey(n), n] as const) : counted.map(([k, j]) => [k, j.name] as const);
  const activity = keys.map(([key, name]) => {
    const done = Object.entries(sheetFor.get(key)?.scores ?? {}).filter(([eid, x]) => totalOf(x.marks) !== null && doc.entries[eid]?.status === "submitted");
    const lastAt = done.map(([, x]) => x.updatedAt).sort().at(-1) ?? null;
    return { key, name, marked: done.length, lastAt };
  });
  const drafts = Object.values(doc.entries).filter((e) => e.status !== "submitted").length;
  const rooms = roomsOf(settings);
  return {
    criteria: CRITERIA,
    maxTotal: MAX_TOTAL,
    judges,
    unlisted,
    rows: rows.map((r) => ({ ...r, slot: slotOf(settings, r.id) })),
    activity: activity.map((a) => ({ ...a, room: roomOfJudge(settings, a.key) })),
    drafts,
    rooms: rooms.names,
  };
}

const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Spreadsheet formula injection: a cell starting with = + - @ is text, not a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

on("GET", "/judge/export.csv", async (ctx, req, res) => {
  requireAdmin(ctx.cfg, req);
  const r = await results(ctx);
  const head = ["Rank", "Title", "Credit", "Members", "Schools", "Grades", "Contact email", "Average", ...r.criteria.map((c) => c.label), "Judges", ...r.judges.map((j) => j.name), "Late", "Award", "Submitted", "Entry id"];
  const lines = [head.map(csvCell).join(",")];
  r.rows.forEach((row, i) => {
    lines.push(
      [
        i + 1,
        row.title,
        row.creditLine,
        row.members.map((m) => m.name).join("; "),
        [...new Set(row.members.map((m) => m.school))].join("; "),
        row.members.map((m) => m.grade).join("; "),
        row.contactEmail,
        row.average?.toFixed(2) ?? "",
        ...r.criteria.map((c) => row.perCriterion[c.id]?.toFixed(2) ?? ""),
        row.judgeCount,
        ...r.judges.map((j) => row.byJudge[j.key] ?? ""),
        row.late ? "yes" : "",
        row.award,
        row.submittedAt ?? "",
        row.id,
      ]
        .map(csvCell)
        .join(","),
    );
  });
  res.writeHead(200, {
    ...BASE_HEADERS,
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="mdc-2026-results.csv"`,
  });
  res.end("﻿" + lines.join("\r\n"));
});

on("PATCH", "/judge/entries/:id", async (ctx, req, res, { id }) => {
  const s = requireAdmin(ctx.cfg, req);
  const body = await readJson(req);
  await ctx.db.mutate("entries", (doc) => {
    const e = doc.entries[id];
    if (!e) fail(404, "No such entry.");
    if (typeof body.hidden === "boolean") e.hidden = body.hidden;
    if (typeof body.gallery === "boolean") e.gallery = body.gallery;
    if (typeof body.unlocked === "boolean") e.unlocked = body.unlocked;
    if (typeof body.award === "string") {
      if (!(AWARDS as readonly string[]).includes(body.award)) fail(422, "Unknown award.");
      e.award = body.award;
    }
    if (typeof body.late === "boolean") e.late = body.late;
  });
  const doc = await ctx.db.read("entries", { fresh: true });
  sendJson(res, 200, { entry: await judgeView(ctx, doc.entries[id], s) });
});

on("DELETE", "/judge/entries/:id", async (ctx, req, res, { id }) => {
  requireAdmin(ctx.cfg, req);
  let paths: string[] = [];
  await ctx.db.mutate("entries", (doc) => {
    const e = doc.entries[id];
    if (!e) fail(404, "No such entry.");
    paths = [...e.files.map((f) => f.path), ...Object.values(e.pending).map((p) => p.path)];
    delete doc.entries[id];
  });
  await ctx.db.mutate("scores", (sc) => {
    for (const j of Object.values(sc.judges)) delete j.scores[id];
  });
  // And its judging slot, so a deleted test entry leaves nothing behind.
  await ctx.db.mutate("settings", (st) => {
    if (st.schedule && Object.hasOwn(st.schedule, id)) delete st.schedule[id];
  });
  await ctx.db.storage.delete(paths).catch(() => {});
  sendJson(res, 200, { ok: true });
});

on("GET", "/judge/settings", async (ctx, req, res) => {
  requireAdmin(ctx.cfg, req);
  const w = await windowOf(ctx);
  sendJson(res, 200, settingsView(ctx, w));
});

function settingsView(ctx: PortalContext, w: Window) {
  return {
    entryCode: ctx.cfg.entryCode,
    configuredDeadline: new Date(Date.parse(ctx.cfg.deadline)).toISOString(),
    deadlineOverride: w.settings.deadlineOverride,
    deadline: iso(w.deadline),
    closed: w.settings.closed,
    judges: w.settings.judges ?? [],
    revealAt: w.settings.revealAt ?? new Date(Date.parse(DEFAULT_REVEAL)).toISOString(),
    spec: w.settings.spec ?? null,
    publicListing: w.settings.publicListing ?? "off",
    entryCodeOn: w.codeOn,
    opensAt: w.notYet ? iso(w.notYet) : null,
    rooms: (() => {
      const r = roomsOf(w.settings);
      return { ...r, start: new Date(Date.parse(r.start)).toISOString(), end: new Date(Date.parse(r.end)).toISOString() };
    })(),
    scheduled: Object.keys(w.settings.schedule ?? {}).length,
    // When the last team's slot ends: organizers see if the schedule runs past the end time.
    scheduleEnds: (() => {
      const ats = Object.values(w.settings.schedule ?? {}).map((s) => Date.parse(s.at));
      return ats.length ? iso(Math.max(...ats) + roomsOf(w.settings).slotMinutes * 60_000) : null;
    })(),
    open: w.open,
    graceSeconds: GRACE_SECONDS,
    storage: ctx.cfg.storage,
    devDefaults: ctx.cfg.devDefaults,
  };
}

on("PUT", "/judge/settings", async (ctx, req, res) => {
  requireAdmin(ctx.cfg, req);
  const body = await readJson(req);
  await ctx.db.mutate("settings", (st) => {
    if ("deadlineOverride" in body) {
      const v = body.deadlineOverride;
      if (v === null || v === "") st.deadlineOverride = null;
      else if (typeof v === "string" && !Number.isNaN(Date.parse(v))) st.deadlineOverride = new Date(Date.parse(v)).toISOString();
      else fail(422, "That deadline isn't a valid date.");
    }
    if (typeof body.closed === "boolean") st.closed = body.closed;
    if (Array.isArray(body.judges)) {
      const seen = new Set<string>();
      st.judges = body.judges
        .map((n) => String(n).replace(/\s+/g, " ").trim().slice(0, LIMITS.name))
        .filter((n) => n.length >= 2 && judgeKey(n) && !seen.has(judgeKey(n)) && seen.add(judgeKey(n)))
        .slice(0, 40);
    }
    if ("revealAt" in body) {
      const v = body.revealAt;
      if (v === null || v === "") delete st.revealAt;
      else if (typeof v === "string" && !Number.isNaN(Date.parse(v))) st.revealAt = new Date(Date.parse(v)).toISOString();
      else fail(422, "That reveal time isn't a valid date.");
    }
    if ("spec" in body) st.spec = cleanSpec(body.spec);
    if (typeof body.entryCodeOn === "boolean") st.entryCodeOn = body.entryCodeOn;
    if (body.rooms && typeof body.rooms === "object") st.rooms = cleanRooms(body.rooms as Record<string, unknown>, roomsOf(st));
    if (body.publicListing === "off" || body.publicListing === "all" || body.publicListing === "selected") st.publicListing = body.publicListing;
  });
  sendJson(res, 200, settingsView(ctx, await windowOf(ctx)));
});

/** Validates the rooms setup; anything missing keeps its current value. */
function cleanRooms(raw: Record<string, unknown>, cur: RoomsSetup): RoomsSetup {
  const names = Array.isArray(raw.names)
    ? [...new Set(raw.names.map((n) => String(n).replace(/\s+/g, " ").trim().slice(0, 40)).filter(Boolean))].slice(0, 12)
    : cur.names;
  if (!names.length) fail(422, "Add at least one room.");
  let start = cur.start;
  if (raw.start !== undefined) {
    if (typeof raw.start !== "string" || Number.isNaN(Date.parse(raw.start))) fail(422, "That start time isn't a valid date.");
    start = new Date(Date.parse(raw.start)).toISOString();
  }
  let end = cur.end;
  if (raw.end !== undefined) {
    if (typeof raw.end !== "string" || Number.isNaN(Date.parse(raw.end))) fail(422, "That end time isn't a valid date.");
    end = new Date(Date.parse(raw.end)).toISOString();
  }
  const slotMinutes = raw.slotMinutes === undefined ? cur.slotMinutes : Math.round(Number(raw.slotMinutes));
  if (!Number.isFinite(slotMinutes) || slotMinutes < 1 || slotMinutes > 30) fail(422, "Minutes per team must be 1 to 30.");
  const judgeRooms: Record<string, string> = {};
  const src = raw.judgeRooms && typeof raw.judgeRooms === "object" ? (raw.judgeRooms as Record<string, unknown>) : cur.judgeRooms;
  for (const [name, room] of Object.entries(src)) {
    const key = judgeKey(name) || name;
    if (typeof room === "string" && names.includes(room)) judgeRooms[key] = room;
  }
  return { names, start, end, slotMinutes, judgeRooms };
}

// The judging schedule. "make" gives every submitted entry without a slot the
// next free time in the least-busy room (entries already scheduled keep
// theirs, so late changes never move a team that was told its time).
// "clear" removes it.
on("POST", "/judge/schedule", async (ctx, req, res) => {
  requireAdmin(ctx.cfg, req);
  const body = await readJson(req);
  const doc = await ctx.db.read("entries", { fresh: true });
  await ctx.db.mutate("settings", (st) => {
    if (body.action === "clear") {
      delete st.schedule;
      return;
    }
    if (body.action !== "make") fail(422, "Action must be make or clear.");
    const r = roomsOf(st);
    const schedule: Record<string, { room: string; at: string }> = {};
    // Keep slots for entries that still exist, are submitted and whose room is still a room.
    for (const [id, s] of Object.entries(st.schedule ?? {})) {
      const e = Object.hasOwn(doc.entries, id) ? doc.entries[id] : null;
      if (e && e.status === "submitted" && r.names.includes(s.room)) schedule[id] = s;
    }
    const step = r.slotMinutes * 60_000;
    const next = new Map(r.names.map((n) => [n, Date.parse(r.start)]));
    for (const s of Object.values(schedule)) next.set(s.room, Math.max(next.get(s.room)!, Date.parse(s.at) + step));
    const count = new Map(r.names.map((n) => [n, Object.values(schedule).filter((s) => s.room === n).length]));
    const waiting = Object.values(doc.entries)
      .filter((e) => e.status === "submitted" && !e.hidden && !schedule[e.id])
      .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
    for (const e of waiting) {
      const room = r.names.reduce((best, n) => (count.get(n)! < count.get(best)! || (count.get(n) === count.get(best) && next.get(n)! < next.get(best)!) ? n : best));
      schedule[e.id] = { room, at: iso(next.get(room)!) };
      next.set(room, next.get(room)! + step);
      count.set(room, count.get(room)! + 1);
    }
    st.schedule = schedule;
  });
  sendJson(res, 200, settingsView(ctx, await windowOf(ctx)));
});

/** Validates an organizer's size spec. Empty or all-blank clears it. */
function cleanSpec(raw: unknown): Spec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pos = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0 || n > 1e6) fail(422, "Spec sizes must be positive numbers.");
    return n;
  };
  const vol = (r.volume ?? null) as Record<string, unknown> | null;
  const target = vol ? pos(vol.target) : null;
  const tol = vol && target !== null ? Number(vol.tolerancePct ?? 2) : 0;
  if (target !== null && (!Number.isFinite(tol) || tol < 0 || tol > 100)) fail(422, "Tolerance must be 0 to 100%.");
  const spec: Spec = {
    maxW: pos(r.maxW),
    maxD: pos(r.maxD),
    maxH: pos(r.maxH),
    volume: target !== null ? { target, tolerancePct: tol } : null,
    note: String(r.note ?? "").slice(0, 200),
  };
  return hasSpec(spec) ? spec : null;
}

// An organizer's decision on one originality check: cleared (fine), confirmed
// (a real problem), or null to reopen it.
on("PUT", "/judge/entries/:id/checks/:checkId", async (ctx, req, res, { id, checkId }) => {
  const s = requireAdmin(ctx.cfg, req);
  const body = await readJson(req);
  const status = body.status;
  if (status !== "cleared" && status !== "confirmed" && status !== null) fail(422, "Status must be cleared, confirmed or null.");
  await ctx.db.mutate("entries", (doc) => {
    const e = Object.hasOwn(doc.entries, id) ? doc.entries[id] : null;
    if (!e) fail(404, "No such entry.");
    e.reviews ??= {};
    if (status === null) delete e.reviews[checkId];
    else e.reviews[checkId] = { status, by: s.name, at: new Date().toISOString(), note: String(body.note ?? "").slice(0, 500) };
  });
  const doc = await ctx.db.read("entries", { fresh: true });
  sendJson(res, 200, { entry: await judgeView(ctx, doc.entries[id], s) });
});

// ── Dispatch ──────────────────────────────────

/** The API path below /api/portal, from a Vercel rewrite's ?path= or the raw URL. */
export function apiPath(url: URL): string {
  const fromQuery = url.searchParams.get("__path");
  if (fromQuery !== null) return `/${fromQuery.replace(/^\/+/, "")}`;
  const p = url.pathname.replace(/^\/api\/portal(?=\/|$)/, "");
  return p || "/";
}

export async function dispatch(ctx: PortalContext, req: Req, res: Res): Promise<void> {
  const url = new URL(req.url ?? "/", "http://portal.local");
  const path = apiPath(url).replace(/\/+$/, "") || "/";
  const method = (req.method ?? "GET").toUpperCase();
  try {
    let allowed: string[] = [];
    for (const r of routes) {
      const m = r.pattern.exec(path);
      if (!m) continue;
      if (r.method !== method && !(method === "HEAD" && r.method === "GET")) {
        allowed.push(r.method);
        continue;
      }
      if (r.mutates) assertSameOrigin(req);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      await r.handler(ctx, req, res, params, url);
      return;
    }
    allowed = [...new Set(allowed)];
    if (allowed.length) fail(405, "Method not allowed.", { allow: allowed });
    fail(404, "Not found.");
  } catch (e) {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (e instanceof HttpError) {
      const headers: Record<string, string> = {};
      if (e.extra?.retryAfter) headers["Retry-After"] = String(e.extra.retryAfter);
      sendJson(res, e.status, { error: e.message, ...(e.extra ?? {}) }, headers);
      return;
    }
    console.error("[portal]", method, path, e);
    sendJson(res, 500, { error: "Something went wrong on our side. Try again in a moment." });
  }
}
