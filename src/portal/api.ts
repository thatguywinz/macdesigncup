// Browser side of the portal API. Every state-changing call carries the
// X-Portal header (the server's cross-site guard); team calls carry the
// entry's edit key in X-Edit-Key, never in the URL.
import type { FieldErrors } from "./shared/schema";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: { errors?: FieldErrors; field?: string; [k: string]: unknown } = {},
  ) {
    super(message);
  }
}

const BASE = "/api/portal";

export async function api<T>(path: string, init: { method?: string; body?: unknown; editKey?: string; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const method = init.method ?? (init.body === undefined ? "GET" : "POST");
  if (method !== "GET") headers["X-Portal"] = "1";
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.editKey) headers["X-Edit-Key"] = init.editKey;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      signal: init.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "No connection. Check the Wi-Fi and try again.");
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON (an HTML error page) */
  }
  if (!res.ok) throw new ApiError(res.status, typeof data.error === "string" ? data.error : `Request failed (${res.status}).`, data);
  return data as T;
}

// The site writes times "2:00 PM" (src/config/site.ts TIMES); en-CA would
// give "2:00 p.m.", so format with en-US and keep Toronto time.

/** Formats an ISO time as "2:00 PM" in Toronto time. */
export function clock(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
}

/** "Mon, Nov 16, 2:00 PM" */
export function when(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
}

/** "Closes in 12:30", or the date and time when it is more than a day away. */
export function closesLabel(deadlineIso: string, now: number, left: string): string {
  const ms = Date.parse(deadlineIso) - now;
  if (!left) return `Closed ${clock(deadlineIso)}`;
  if (ms > 24 * 3600 * 1000) return `Closes ${when(deadlineIso)}`;
  return `Closes in ${left}`;
}
