// ─────────────────────────────────────────────
// Submission portal · file slots and formats. Shared by the browser (the
// form's pickers and preview) and the API (signing uploads, checking what
// actually arrived). One table, so the two can never disagree on a limit.
// ─────────────────────────────────────────────

export type FileSlot = "video" | "model" | "image" | "progress" | "source" | "thumb";

/** Formats the in-browser viewer can open. */
export const VIEWABLE_EXTS = ["glb", "stl", "obj", "3mf", "ply"] as const;
export type ViewableExt = (typeof VIEWABLE_EXTS)[number];

export interface SlotRule {
  /** Lowercase extensions, no dot. */
  exts: readonly string[];
  maxBytes: number;
  /** How many files of this slot one entry may hold. */
  maxCount: number;
  /** The `accept` attribute for the file picker. */
  accept: string;
}

const MB = 1024 * 1024;

export const SLOTS: Record<FileSlot, SlotRule> = {
  // The presentation video, when a team uploads it instead of linking it.
  // Small on purpose: the free Blob store holds about 1 GB in total, so a
  // YouTube or Drive link is the main path for longer or bigger videos.
  video: {
    exts: ["mp4", "mov", "m4v", "webm"],
    maxBytes: 150 * MB,
    maxCount: 1,
    accept: "video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm",
  },
  // The one file judges and the share page open in the 3D viewer.
  // 250 MB each; the whole store's budget (routes.ts) is the real limit.
  model: {
    exts: VIEWABLE_EXTS,
    maxBytes: 250 * MB,
    maxCount: 1,
    accept: ".glb,.stl,.obj,.3mf,.ply",
  },
  // Renders or screenshots.
  image: {
    exts: ["png", "jpg", "jpeg", "webp"],
    maxBytes: 12 * MB,
    maxCount: 4,
    accept: "image/png,image/jpeg,image/webp",
  },
  // Sketches, feature tree / timeline screenshots, work in progress. Uploaded
  // as the team goes (Save draft); the server time on each forms a timeline.
  progress: {
    exts: ["png", "jpg", "jpeg", "webp"],
    maxBytes: 12 * MB,
    maxCount: 8,
    accept: "image/png,image/jpeg,image/webp",
  },
  // The native project file, for judges only. Never opened by the site.
  source: {
    exts: ["step", "stp", "f3d", "f3z", "blend", "iges", "igs", "sldprt", "sldasm", "3dm", "skp", "fbx", "zip", "ipt", "par", "asm", "max", "ma", "mb"],
    maxBytes: 250 * MB,
    maxCount: 1,
    accept:
      ".step,.stp,.f3d,.f3z,.blend,.iges,.igs,.sldprt,.sldasm,.3dm,.skp,.fbx,.zip,.ipt,.par,.asm,.max,.ma,.mb",
  },
  // A still of the model, captured by the form's viewer. Cards use it.
  thumb: {
    exts: ["png", "webp", "jpg", "jpeg"],
    maxBytes: 2 * MB,
    maxCount: 1,
    accept: "image/png",
  },
};

export const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
  glb: "model/gltf-binary",
  stl: "model/stl",
  obj: "model/obj",
  "3mf": "model/3mf",
  ply: "application/octet-stream",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  zip: "application/zip",
};

export const contentTypeFor = (ext: string) => CONTENT_TYPES[ext] ?? "application/octet-stream";

/** "Bracket v2.STL" -> "stl". Empty string when there is no extension. */
export function extOf(name: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : "";
}

export function isViewable(ext: string): ext is ViewableExt {
  return (VIEWABLE_EXTS as readonly string[]).includes(ext);
}

/** Human size: 1536 -> "1.5 KB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / MB).toFixed(n < 10 * MB ? 1 : 0)} MB`;
}

/**
 * A storage-safe version of a file name: ASCII letters, digits, dot, dash,
 * underscore; at most 60 characters; the extension kept.
 */
export function safeFileName(name: string): string {
  const ext = extOf(name);
  const base = (ext ? name.trim().slice(0, -(ext.length + 1)) : name)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 50);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

/** Checks a picked file against its slot. Returns an error message or null. */
export function checkFile(slot: FileSlot, name: string, size: number): string | null {
  const rule = SLOTS[slot];
  const ext = extOf(name);
  if (!rule.exts.includes(ext)) {
    return `${name}: that file type isn't accepted here. Use ${rule.exts.map((e) => `.${e}`).join(", ")}.`;
  }
  if (size <= 0) return `${name} is empty.`;
  if (size > rule.maxBytes) return `${name} is ${formatBytes(size)}. The limit is ${formatBytes(rule.maxBytes)}.`;
  return null;
}
