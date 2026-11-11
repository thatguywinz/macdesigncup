import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"; // no l/I/O look-alikes

/** A random id from an unambiguous alphabet. 12 chars ≈ 70 bits: unguessable share links. */
export function randomId(length = 12): string {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; i < bytes.length && out.length < length; i++) {
    // Rejection sampling keeps the distribution uniform.
    const b = bytes[i];
    if (b < 256 - (256 % ALPHABET.length)) out += ALPHABET[b % ALPHABET.length];
  }
  return out.length === length ? out : randomId(length);
}

/** A secret for a link (edit keys): 32 random bytes, base64url. */
export const randomSecret = () => randomBytes(32).toString("base64url");

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("base64url");

/** Constant-time string comparison (hashes both, so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/** Case- and space-insensitive comparison for the entry code people type off a slide. */
/** "mdc 2026", "MDC-2026" and "mdc2026" are the same code. */
export const normalizeCode = (s: string) => String(s ?? "").replace(/[\s\-_.]+/g, "").toUpperCase();
