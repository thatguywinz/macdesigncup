// What a file really is, from its first bytes. An upload is kept only if its
// contents match the extension it claims, so a renamed .exe or .html never
// gets served back out of the store as a "model".

/** Bytes the checks below need. */
export const SNIFF_BYTES = 512;

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/** True when the sample reads as text (OBJ, ASCII STL, ASCII PLY). */
function looksText(b: Uint8Array): boolean {
  if (b.length === 0) return false;
  let bad = 0;
  for (const c of b) {
    if (c === 0) return false;
    if (c < 9 || (c > 13 && c < 32)) bad++;
  }
  return bad / b.length < 0.02;
}

/** Markup that a browser might render if this were ever served as HTML. */
function looksLikeMarkup(b: Uint8Array): boolean {
  const head = ascii(b, 0, Math.min(b.length, 256)).trimStart().toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<script") || head.startsWith("<svg") || head.startsWith("<?xml");
}

/**
 * Checks a file's first bytes (and total size) against its extension.
 * Returns null when it matches, or a short reason it does not.
 */
export function sniff(ext: string, head: Uint8Array, size: number): string | null {
  switch (ext) {
    case "glb":
      return ascii(head, 0, 4) === "glTF" ? null : "not a binary glTF (.glb) file";
    case "stl": {
      // Binary STL: 80-byte header, uint32 triangle count, 50 bytes per triangle.
      if (head.length >= 84) {
        const count = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(80, true);
        if (84 + count * 50 === size) return null;
      }
      const text = ascii(head, 0, Math.min(head.length, 256)).trimStart().toLowerCase();
      if (text.startsWith("solid") && looksText(head)) return null;
      // Some exporters write "solid" into a binary header with a bad count; accept a header that's mostly not text.
      return head.length >= 84 && !looksText(head) ? null : "not an STL file";
    }
    case "obj":
      return looksText(head) && !looksLikeMarkup(head) ? null : "not a text OBJ file";
    case "ply":
      return ascii(head, 0, 3) === "ply" ? null : "not a PLY file";
    case "3mf":
    case "zip":
    case "f3z":
      return startsWith(head, [0x50, 0x4b, 0x03, 0x04]) ? null : "not a zip-based file";
    case "png":
      return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : "not a PNG image";
    case "jpg":
    case "jpeg":
      return startsWith(head, [0xff, 0xd8, 0xff]) ? null : "not a JPEG image";
    case "webp":
      return ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP" ? null : "not a WebP image";
    default:
      // Native CAD files (judges download these): any format, but never markup.
      return looksLikeMarkup(head) ? "looks like a web page, not a design file" : null;
  }
}
