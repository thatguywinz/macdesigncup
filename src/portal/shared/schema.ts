// ─────────────────────────────────────────────
// Submission portal · the entry form's fields, their limits and the one
// validator both sides run. The browser runs it for inline errors; the API
// runs it again and trusts nothing else.
// ─────────────────────────────────────────────
// Type-only imports between shared modules (erased at build), so the server
// can load these files without a bundler.
import type { FileSlot } from "./formats";
import type { Check, CheckReview, FileMeta, Measure, Spec, Units } from "./checks";
// Value import with .js: on Vercel the server runs these files as plain ES modules.
import { parseVideoLink, type VideoCheck } from "./video.js";

const UNIT_LIST = ["mm", "cm", "m", "in"] as const;
const CAD_HOSTS = ["onshape.com", "a360.co", "autodesk360.com", "autodesk.com", "tinkercad.com", "3dexperience.3ds.com", "solidworks.com", "drive.google.com", "docs.google.com"];

/** An https link on a CAD (or Drive) host, normalized; null if it isn't one. */
function cadLinkOf(s: string): string | null {
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !CAD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const GRADES = ["9", "10", "11", "12"] as const;
export type Grade = (typeof GRADES)[number];

/** Same order as the site's rules list ("Blender, Fusion 360, Onshape, Tinkercad, Maya"), then the sponsors' tools. */
export const SOFTWARE = [
  "Blender",
  "Fusion 360",
  "Onshape",
  "Tinkercad",
  "Maya",
  "Solid Edge",
  "SolidWorks",
  "SketchUp",
  "Other",
] as const;

export const TEAM_MAX = 4;

export const LIMITS = {
  title: 80,
  teamName: 60,
  name: 60,
  school: 90,
  email: 120,
  summary: 1000,
  process: 1500,
  aiNote: 500,
  softwareOther: 60,
  filesNote: 600,
  presentation: 1200,
  videoLink: 500,
} as const;

/**
 * Word limits on the free-text boxes (what teams see). The character limits
 * above stay as a backstop against pasted walls of text.
 */
export const WORDS = { summary: 80, process: 120, aiNote: 40, filesNote: 60 } as const;

/** Words in a piece of text, the way a person would count them. */
export const wordCount = (s: string) => (String(s ?? "").trim().match(/\S+/g) ?? []).length;

export interface MemberInput {
  name: string;
  school: string;
  grade: Grade;
}

/** What the form sends. */
export interface EntryInput {
  title: string;
  teamName: string;
  members: MemberInput[];
  contactEmail: string;
  software: string[];
  softwareOther: string;
  /** How the design answers the theme. */
  summary: string;
  /** Process, features, anything a judge should look for. Optional. */
  process: string;
  aiUse: "none" | "some";
  aiNote: string;
  /** Public credit line: the team name, or first names + last initials. */
  credit: "team" | "names";
  /** Anyone with the link can open the share page. Judges always can. */
  shareable: boolean;
  /** "Made on the day, after the theme reveal." Must be true. */
  original: boolean;
  /** How the viewer stands the model up. CAD exports are usually Z-up. */
  upAxis: "y" | "z";
  /** The units the model file was exported in (STL and OBJ don't say). */
  units: Units;
  /** Link to the CAD document, so judges can see the sketches and history. Optional. */
  cadLink: string;
  /** A link to the presentation video (YouTube, Drive, ...), when it isn't uploaded. */
  videoLink: string;
  /** What the team will present: the judges read it before the presentation. */
  presentation: string;
  /** Anything judges should know about the files (answers an originality note). Optional. */
  filesNote: string;
}

export type FieldErrors = Partial<Record<string, string>>;

export type Parsed = { ok: true; value: EntryInput } | { ok: false; errors: FieldErrors };

// Strips control characters (keeps tab, newline, carriage return).
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(CONTROL, "").trim().slice(0, max + 1) : "";

// Deliberately plain: something@something.tld, no spaces.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emptyEntry(): EntryInput {
  return {
    title: "",
    teamName: "",
    members: [{ name: "", school: "", grade: "10" }],
    contactEmail: "",
    software: [],
    softwareOther: "",
    summary: "",
    process: "",
    aiUse: "none",
    aiNote: "",
    credit: "names",
    shareable: true,
    original: false,
    upAxis: "y",
    units: "mm",
    cadLink: "",
    videoLink: "",
    presentation: "",
    filesNote: "",
  };
}

/**
 * Validates and normalizes untrusted input. Never throws. With `draft`, only
 * the title is required (a team can save early and check in progress shots);
 * length and format rules still apply, and submitting re-checks everything.
 */
export function parseEntry(raw: unknown, opts: { draft?: boolean } = {}): Parsed {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};
  const draft = !!opts.draft;
  const tooLong = (field: string, value: string, max: number, label: string) => {
    if (value.length > max) errors[field] = `${label} can be at most ${max} characters.`;
  };
  const tooManyWords = (field: keyof typeof WORDS, value: string) => {
    const n = wordCount(value);
    if (n > WORDS[field]) errors[field] = `Keep it to ${WORDS[field]} words (this is ${n}).`;
  };
  /** A required-field error: skipped for drafts. */
  const need = (field: string, message: string) => {
    if (!draft) errors[field] = message;
  };

  const title = str(r.title, LIMITS.title);
  if (!title) errors.title = "Give your design a title.";
  tooLong("title", title, LIMITS.title, "The title");

  const teamName = str(r.teamName, LIMITS.teamName);
  tooLong("teamName", teamName, LIMITS.teamName, "The team name");

  const rawMembers = Array.isArray(r.members) ? r.members.slice(0, TEAM_MAX + 1) : [];
  if (rawMembers.length > TEAM_MAX) errors.members = `Teams are 1 to ${TEAM_MAX} people.`;
  const members: MemberInput[] = rawMembers.slice(0, TEAM_MAX).map((m, i) => {
    const o = (m && typeof m === "object" ? m : {}) as Record<string, unknown>;
    const name = str(o.name, LIMITS.name);
    const school = str(o.school, LIMITS.school);
    const grade = (GRADES as readonly string[]).includes(String(o.grade)) ? (String(o.grade) as Grade) : null;
    if (!name) need(`members.${i}.name`, "Full name, please.");
    tooLong(`members.${i}.name`, name, LIMITS.name, "A name");
    if (!school) need(`members.${i}.school`, "Which school?");
    tooLong(`members.${i}.school`, school, LIMITS.school, "A school name");
    if (!grade) errors[`members.${i}.grade`] = "Pick a grade.";
    return { name, school, grade: grade ?? "9" };
  });
  if (members.length === 0) need("members", "Add at least one team member.");

  const contactEmail = str(r.contactEmail, LIMITS.email).toLowerCase();
  if (contactEmail ? !EMAIL.test(contactEmail) : !draft) errors.contactEmail = "An email we can reach your team at.";
  tooLong("contactEmail", contactEmail, LIMITS.email, "The email");

  const software = Array.isArray(r.software)
    ? [...new Set(r.software.map(String).filter((s) => (SOFTWARE as readonly string[]).includes(s)))]
    : [];
  if (software.length === 0) need("software", "Pick the software you used.");
  const softwareOther = software.includes("Other") ? str(r.softwareOther, LIMITS.softwareOther) : "";
  if (software.includes("Other") && !softwareOther) need("softwareOther", "Which other software?");

  const summary = str(r.summary, LIMITS.summary);
  if (wordCount(summary) < 5) need("summary", "A sentence or two: what you made and how it fits the theme.");
  tooLong("summary", summary, LIMITS.summary, "This");
  tooManyWords("summary", summary);

  const process = str(r.process, LIMITS.process);
  tooLong("process", process, LIMITS.process, "This");
  tooManyWords("process", process);

  const aiUse = r.aiUse === "some" ? "some" : "none";
  const aiNote = aiUse === "some" ? str(r.aiNote, LIMITS.aiNote) : "";
  if (aiUse === "some" && !aiNote) need("aiNote", "Say briefly what you used it for.");
  tooLong("aiNote", aiNote, LIMITS.aiNote, "This");
  tooManyWords("aiNote", aiNote);

  const credit = r.credit === "team" ? "team" : "names";
  if (credit === "team" && !teamName) need("teamName", "Add a team name, or credit your names instead.");

  const shareable = r.shareable !== false;
  const original = r.original === true;
  if (!original) need("original", "Confirm the design was made at the event.");

  const upAxis = r.upAxis === "z" ? "z" : "y";
  const units: Units = (UNIT_LIST as readonly string[]).includes(String(r.units)) ? (String(r.units) as Units) : "mm";

  const rawLink = str(r.cadLink, 500);
  const cadLink = rawLink ? cadLinkOf(rawLink) : "";
  if (cadLink === null) errors.cadLink = "Use a share link from Onshape, Fusion (a360.co), Tinkercad, 3DEXPERIENCE or Google Drive.";

  const rawVideo = str(r.videoLink, LIMITS.videoLink);
  const video = rawVideo ? parseVideoLink(rawVideo) : null;
  if (rawVideo && !video) errors.videoLink = "Use a share link from YouTube, Google Drive, Vimeo, Loom, OneDrive or Dropbox.";
  const videoLink = video ? video.url : "";

  const presentation = str(r.presentation, LIMITS.presentation);
  tooLong("presentation", presentation, LIMITS.presentation, "This");

  const filesNote = str(r.filesNote, LIMITS.filesNote);
  tooLong("filesNote", filesNote, LIMITS.filesNote, "This");
  tooManyWords("filesNote", filesNote);

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
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
      units,
      cadLink: cadLink ?? "",
      filesNote,
      videoLink,
      presentation,
    },
  };
}

/** "Avery Lin" -> "Avery L."; one word stays as it is. */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** The credit line the share page shows. Never surnames, schools or emails. */
export function publicCredit(e: Pick<EntryInput, "credit" | "teamName" | "members">): string {
  if (e.credit === "team" && e.teamName) return e.teamName;
  const names = e.members.map((m) => shortName(m.name)).filter(Boolean);
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// ── Records and API shapes ────────────────────

export interface FileRef {
  id: string;
  slot: FileSlot;
  /** The name the student picked (display only). */
  name: string;
  ext: string;
  size: number;
  /** Storage key. Never sent to the browser. */
  path: string;
  /** Server time the upload was confirmed (progress shots form a timeline from these). */
  uploadedAt: string;
  /** SHA-256 of the whole file (model files), for spotting identical submissions. */
  sha256?: string;
  /** What the file's own metadata says (model files). */
  meta?: FileMeta;
}

export type EntryStatus = "draft" | "submitted";

export interface EntryRecord extends EntryInput {
  id: string;
  /** SHA-256 of the edit key. The key itself is only ever in the team's link. */
  editKeyHash: string;
  status: EntryStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  /** Submitted after the deadline (inside the upload grace window). */
  late: boolean;
  files: FileRef[];
  /** Files signed for upload but not confirmed yet: id -> pending ref. */
  pending: Record<string, FileRef & { signedAt: string }>;
  // Organizer controls.
  hidden: boolean;
  gallery: boolean;
  award: string;
  /** An organizer reopened editing after the deadline. */
  unlocked: boolean;
  /** What the viewer measured when the team saved (judges' viewers re-measure live). */
  measure?: Measure | null;
  /** Organizers' decisions on originality checks: check id -> review. */
  reviews?: Record<string, CheckReview>;
  /** Last check of the video link (opened without signing in). */
  videoCheck?: VideoCheck | null;
}

/** A check with its review, as judges see it. */
export interface CheckView extends Check {
  review: CheckReview | null;
}

/** A file as the browser sees it: a short-lived URL, no storage key. */
export interface FileView {
  id: string;
  slot: FileSlot;
  name: string;
  ext: string;
  size: number;
  url: string;
  /** When the server received it. */
  uploadedAt?: string;
}

/** The share page. */
export interface PublicEntry {
  id: string;
  title: string;
  credit: string;
  software: string[];
  summary: string;
  process: string;
  upAxis: "y" | "z";
  award: string;
  submittedAt: string | null;
  model: FileView | null;
  images: FileView[];
  thumb: FileView | null;
  /** An uploaded video, or a linked one (with an embeddable player URL when the host allows). */
  video: FileView | null;
  videoLink: { url: string; host: string; embed: string | null } | null;
  /** The model's measurements, for the public page's readout. */
  hasModel: boolean;
}

/** The team's own view while editing. */
export interface OwnEntry extends EntryInput {
  id: string;
  status: EntryStatus;
  submittedAt: string | null;
  late: boolean;
  files: FileView[];
  locked: boolean;
  /** Neutral notes from the originality checks the team can answer in filesNote. */
  notices: string[];
  /** Whether the video link opened without signing in, last time we checked. */
  videoCheck: VideoCheck | null;
  /** The team's judging room and time, once organizers make the schedule. */
  slot: Slot | null;
}

/** A judging slot: which room, and when the team presents. */
export interface Slot {
  room: string;
  at: string;
}

export interface Score {
  /** criterion id -> 0..25 */
  marks: Record<string, number>;
  notes: string;
  updatedAt: string;
}

export interface JudgeEntry extends EntryInput {
  id: string;
  status: EntryStatus;
  createdAt: string;
  submittedAt: string | null;
  late: boolean;
  credit: EntryInput["credit"];
  creditLine: string;
  hidden: boolean;
  gallery: boolean;
  award: string;
  unlocked: boolean;
  files: FileView[];
  myScore: Score | null;
  scoreCount: number;
  measure: Measure | null;
  checks: CheckView[];
  /** Model file metadata (generator, created), for the process panel. */
  modelMeta: FileMeta | null;
  /** What the server found when it opened the video link without signing in. */
  videoCheck: VideoCheck | null;
  slot: Slot | null;
}

/** A dashboard card. */
export interface JudgeCard {
  id: string;
  title: string;
  teamName: string;
  /** Members' names, for search. */
  members: string[];
  creditLine: string;
  memberCount: number;
  schools: string[];
  software: string[];
  submittedAt: string | null;
  late: boolean;
  hidden: boolean;
  award: string;
  modelExt: string | null;
  thumb: string | null;
  myTotal: number | null;
  scoreCount: number;
  /** Originality checks still waiting for an organizer. */
  openReviews: number;
  /** Spec lines failed (null: no spec or not measured). */
  specFails: number | null;
  slot: Slot | null;
}

export interface PortalStatus {
  deadline: string;
  open: boolean;
  /** Seconds the server allows a started upload to finish after the deadline. */
  graceSeconds: number;
  now: string;
  /** The size spec teams design to, if organizers set one. */
  spec: Spec | null;
  /** Teams type the day's entry code to start an entry. */
  codeRequired: boolean;
  /** No entry code and the theme isn't revealed yet: when the form opens. */
  opensAt: string | null;
}
