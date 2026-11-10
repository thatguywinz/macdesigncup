// Signed, expiring tickets: a small JSON payload plus an HMAC. Upload and
// download permissions travel as tickets, so a URL grants exactly one object
// for a few minutes and nothing else.
import { hmac, safeEqual } from "./crypto.js";

export interface UploadGrant {
  kind: "put";
  /** Storage key. */
  p: string;
  /** Max bytes. */
  max: number;
  /** Content type to store. */
  ct: string;
  /** Expiry, ms since epoch. */
  exp: number;
}

export interface DownloadGrant {
  kind: "get";
  p: string;
  exp: number;
}

export type Grant = UploadGrant | DownloadGrant;

export function signTicket(secret: string, grant: Grant): string {
  const body = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${body}.${hmac(secret, `ticket:${body}`)}`;
}

/** The grant, or null when the ticket is forged, malformed or expired. */
export function readTicket<K extends Grant["kind"]>(secret: string, ticket: string, kind: K): Extract<Grant, { kind: K }> | null {
  if (typeof ticket !== "string" || ticket.length > 4096) return null;
  const dot = ticket.indexOf(".");
  if (dot < 1) return null;
  const body = ticket.slice(0, dot);
  const sig = ticket.slice(dot + 1);
  if (!safeEqual(sig, hmac(secret, `ticket:${body}`))) return null;
  try {
    const grant = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Grant;
    if (grant.kind !== kind || typeof grant.p !== "string" || !(grant.exp > Date.now())) return null;
    return grant as Extract<Grant, { kind: K }>;
  } catch {
    return null;
  }
}
