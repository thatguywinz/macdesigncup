// ─────────────────────────────────────────────
// Submission portal · the entry form's fields, their limits and the one
// validator both sides run. The browser runs it for inline errors; the API
// runs it again and trusts nothing else.
// ─────────────────────────────────────────────
import type { FileSlot } from "./formats";

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
  summary: 700,
  process: 1500,
  aiNote: 500,
  softwareOther: 60,
} as const;

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
  };
}

/** Validates and normalizes untrusted input. Never throws. */
export function parseEntry(raw: unknown): Parsed {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};
  const tooLong = (field: string, value: string, max: number, label: string) => {
    if (value.length > max) errors[field] = `${label} can be at most ${max} characters.`;
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
    if (!name) errors[`members.${i}.name`] = "Full name, please.";
    tooLong(`members.${i}.name`, name, LIMITS.name, "A name");
    if (!school) errors[`members.${i}.school`] = "Which school?";
    tooLong(`members.${i}.school`, school, LIMITS.school, "A school name");
    if (!grade) errors[`members.${i}.grade`] = "Pick a grade.";
    return { name, school, grade: grade ?? "9" };
  });
  if (members.length === 0) errors.members = "Add at least one team member.";

  const contactEmail = str(r.contactEmail, LIMITS.email).toLowerCase();
  if (!EMAIL.test(contactEmail)) errors.contactEmail = "An email we can reach your team at.";
  tooLong("contactEmail", contactEmail, LIMITS.email, "The email");

  const software = Array.isArray(r.software)
    ? [...new Set(r.software.map(String).filter((s) => (SOFTWARE as readonly string[]).includes(s)))]
    : [];
  if (software.length === 0) errors.software = "Pick the software you used.";
  const softwareOther = software.includes("Other") ? str(r.softwareOther, LIMITS.softwareOther) : "";
  if (software.includes("Other") && !softwareOther) errors.softwareOther = "Which other software?";

  const summary = str(r.summary, LIMITS.summary);
  if (summary.length < 20) errors.summary = "A sentence or two on how your design answers the theme.";
  tooLong("summary", summary, LIMITS.summary, "This");

  const process = str(r.process, LIMITS.process);
  tooLong("process", process, LIMITS.process, "This");

  const aiUse = r.aiUse === "some" ? "some" : "none";
  const aiNote = aiUse === "some" ? str(r.aiNote, LIMITS.aiNote) : "";
  if (aiUse === "some" && !aiNote) errors.aiNote = "Say briefly what you used it for.";
  tooLong("aiNote", aiNote, LIMITS.aiNote, "This");

  const credit = r.credit === "team" ? "team" : "names";
  if (credit === "team" && !teamName) errors.teamName = "Add a team name, or credit your names instead.";

  const shareable = r.shareable !== false;
  const original = r.original === true;
  if (!original) errors.original = "Confirm the design was made at the event.";

  const upAxis = r.upAxis === "z" ? "z" : "y";

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
  uploadedAt: string;
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
}

/** A file as the browser sees it: a short-lived URL, no storage key. */
export interface FileView {
  id: string;
  slot: FileSlot;
  name: string;
  ext: string;
  size: number;
  url: string;
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
}

/** The team's own view while editing. */
export interface OwnEntry extends EntryInput {
  id: string;
  status: EntryStatus;
  submittedAt: string | null;
  late: boolean;
  files: FileView[];
  locked: boolean;
}

export interface Score {
  /** criterion id -> 1..10 */
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
}

/** A dashboard card. */
export interface JudgeCard {
  id: string;
  title: string;
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
}

export interface PortalStatus {
  deadline: string;
  open: boolean;
  /** Seconds the server allows a started upload to finish after the deadline. */
  graceSeconds: number;
  now: string;
}
