// What a model file says about itself: a SHA-256 of the whole file (to spot
// identical submissions) and whatever its own metadata records: the exporter
// or generator, a creation date, an author. Read once, when the upload is
// confirmed. Missing metadata is normal and means nothing.
import { createHash } from "node:crypto";
import { unzipSync, strFromU8 } from "three/examples/jsm/libs/fflate.module.js";
import type { FileMeta } from "../../src/portal/shared/checks.js";

export const sha256Of = (buf: Uint8Array) => createHash("sha256").update(buf).digest("hex");

const printable = (s: string) => s.replace(/[^\x20-\x7e]+/g, " ").replace(/\s+/g, " ").trim();
const clip = (s: string | undefined, n = 200) => (s ? printable(s).slice(0, n) : undefined);

function isoDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const t = Date.parse(s.trim());
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

function glbMeta(buf: Uint8Array): FileMeta {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length < 20) return {};
  const jsonLen = dv.getUint32(12, true);
  const jsonType = dv.getUint32(16, true);
  if (jsonType !== 0x4e4f534a || 20 + jsonLen > buf.length || jsonLen > 8 * 1024 * 1024) return {};
  try {
    const gltf = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jsonLen)));
    const asset = gltf.asset ?? {};
    const extras = { ...(asset.extras ?? {}), ...(gltf.extras ?? {}), ...(gltf.scenes?.[0]?.extras ?? {}) };
    return {
      generator: clip(asset.generator),
      author: clip(extras.author ?? extras.artist ?? asset.copyright),
      created: isoDate(extras.created ?? extras.creationDate),
      text: clip([asset.copyright, extras.title, extras.source, extras.license].filter(Boolean).join(" · "), 300),
    };
  } catch {
    return {};
  }
}

function stlMeta(buf: Uint8Array): FileMeta {
  const head = new TextDecoder("latin1").decode(buf.subarray(0, 80));
  if (/^\s*solid/i.test(head)) {
    // ASCII STL: "solid <name>" on the first line.
    const first = new TextDecoder("latin1").decode(buf.subarray(0, 256)).split(/\r?\n/)[0];
    return { text: clip(first.replace(/^\s*solid\s*/i, "")) };
  }
  const text = clip(head);
  return text ? { generator: text, text } : {};
}

function objMeta(buf: Uint8Array): FileMeta {
  const lines = new TextDecoder("latin1").decode(buf.subarray(0, 8192)).split(/\r?\n/).slice(0, 40);
  const comments = lines.filter((l) => l.startsWith("#")).map((l) => l.replace(/^#\s*/, ""));
  if (!comments.length) return {};
  return { generator: clip(comments[0]), text: clip(comments.join(" · "), 300) };
}

function plyMeta(buf: Uint8Array): FileMeta {
  const header = new TextDecoder("latin1").decode(buf.subarray(0, 4096)).split("end_header")[0];
  const comments = header.split(/\r?\n/).filter((l) => /^(comment|obj_info)\b/.test(l)).map((l) => l.replace(/^\w+\s*/, ""));
  return comments.length ? { generator: clip(comments[0]), text: clip(comments.join(" · "), 300) } : {};
}

function threeMfMeta(buf: Uint8Array): FileMeta {
  try {
    const files = unzipSync(buf, { filter: (f) => /3dmodel\.model$|core\.xml$/i.test(f.name) && f.originalSize < 64 * 1024 * 1024 });
    const xml = Object.values(files)
      .map((u) => strFromU8(u.subarray(0, 256 * 1024)))
      .join("\n");
    const md = (name: string) => {
      const m = new RegExp(`<metadata[^>]*name="(?:[\\w]+:)?${name}"[^>]*>([^<]*)</metadata>`, "i").exec(xml);
      return m?.[1];
    };
    const core = (tag: string) => new RegExp(`<[\\w]*:?${tag}[^>]*>([^<]*)<`, "i").exec(xml)?.[1];
    return {
      generator: clip(md("Application") ?? core("Application")),
      created: isoDate(md("CreationDate") ?? core("created")),
      author: clip(md("Designer") ?? core("creator")),
      text: clip([md("Title"), md("Copyright"), md("Description")].filter(Boolean).join(" · "), 300),
    };
  } catch {
    return {};
  }
}

/** Metadata for a model file. Never throws; unknown or unreadable gives {}. */
export function inspectModel(ext: string, buf: Uint8Array): FileMeta {
  const meta =
    ext === "glb" ? glbMeta(buf) : ext === "stl" ? stlMeta(buf) : ext === "obj" ? objMeta(buf) : ext === "ply" ? plyMeta(buf) : ext === "3mf" ? threeMfMeta(buf) : {};
  // Drop empty fields so stored records stay small.
  return Object.fromEntries(Object.entries(meta).filter(([, v]) => v)) as FileMeta;
}
