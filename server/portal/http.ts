// Small HTTP helpers shared by the Vercel function, the Vite dev middleware
// and the local preview server. Node's IncomingMessage / ServerResponse only.
import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): never {
  throw new HttpError(status, message, extra);
}

export type Req = IncomingMessage & { body?: unknown };
export type Res = ServerResponse;

export const BASE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

export function sendJson(res: Res, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, { ...BASE_HEADERS, "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(json);
}

const MAX_JSON = 64 * 1024;

/** The request's JSON body (Vercel may have parsed it already). */
export async function readJson(req: Req): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  let raw: string;
  if (typeof req.body === "string") raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString("utf8");
  else {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_JSON) fail(413, "Request too large.");
      chunks.push(chunk as Buffer);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  if (raw.length > MAX_JSON) fail(413, "Request too large.");
  if (!raw.trim()) return {};
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return fail(400, "Malformed JSON.");
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(400, "Expected a JSON object.");
  return v as Record<string, unknown>;
}

export function parseCookies(req: Req): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function clientIp(req: Req): string {
  const fwd = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  return fwd || String(req.headers["x-real-ip"] ?? "") || req.socket?.remoteAddress || "unknown";
}

/**
 * Cross-site request guard for every state-changing call: the browser must
 * send our custom header (a cross-origin page cannot add one without a CORS
 * preflight, which we never approve), and any Origin it sends must be ours.
 */
export function assertSameOrigin(req: Req) {
  if (req.headers["x-portal"] !== "1") fail(403, "Missing request header.");
  const origin = req.headers.origin;
  if (!origin) return;
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "");
  let originHost = "";
  try {
    originHost = new URL(String(origin)).host;
  } catch {
    /* fall through to the refusal */
  }
  if (!host || originHost !== host) fail(403, "Cross-origin request refused.");
}

// ── Rate limiting ─────────────────────────────
// In memory, per server instance: a speed bump against guessing passcodes
// or entry codes, not a wall (serverless instances do not share memory).
// On event day the whole venue is likely one public IP behind the Wi-Fi, so
// per-IP limits only count failures (wrong codes, wrong passcodes) or sit
// far above what 80 students do; upload signing is limited per entry.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > max) fail(429, "Too many attempts. Wait a minute and try again.", { retryAfter: Math.ceil((b.reset - now) / 1000) });
}

/** Throws 429 if `key` is already over `max`, without counting this request. */
export function rateCheck(key: string, max: number) {
  const b = buckets.get(key);
  const now = Date.now();
  if (b && b.reset > now && b.count >= max) fail(429, "Too many attempts. Wait a minute and try again.", { retryAfter: Math.ceil((b.reset - now) / 1000) });
}

export function resetRateLimits() {
  buckets.clear();
}
