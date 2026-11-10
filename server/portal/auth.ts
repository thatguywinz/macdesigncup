// Judge and organizer sessions: a signed cookie, HttpOnly, SameSite=Strict,
// scoped to the API path. No accounts: judges share one passcode, organizers
// another. Changing either passcode (or the session secret) signs everyone out.
import type { PortalConfig } from "./config.js";
import { SESSION_HOURS } from "./config.js";
import { hmac, safeEqual, sha256 } from "./crypto.js";
import { fail, parseCookies, type Req } from "./http.js";

export const COOKIE = "mdc_portal";
const COOKIE_PATH = "/api/portal";

export type Role = "judge" | "admin";

export interface Session {
  role: Role;
  /** Display name the judge typed. */
  name: string;
  /** Their score sheet's key. */
  key: string;
  exp: number;
}

interface Payload extends Session {
  /** Passcode version: a fingerprint of the passcode the session was made with. */
  pv: string;
}

const passcodeVersion = (cfg: PortalConfig, role: Role) =>
  sha256(`${role}:${role === "admin" ? cfg.adminPasscode : cfg.judgePasscode}`).slice(0, 12);

/** "Ms. Avery Lin " -> "ms-avery-lin" */
export function judgeKey(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function makeSessionCookie(cfg: PortalConfig, role: Role, name: string): { cookie: string; session: Session } {
  const session: Session = { role, name, key: judgeKey(name), exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
  const payload: Payload = { ...session, pv: passcodeVersion(cfg, role) };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${body}.${hmac(cfg.sessionSecret, `session:${body}`)}`;
  const attrs = [
    `${COOKIE}=${value}`,
    `Path=${COOKIE_PATH}`,
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_HOURS * 3600}`,
    ...(cfg.secureCookies ? ["Secure"] : []),
  ];
  return { cookie: attrs.join("; "), session };
}

export function clearSessionCookie(cfg: PortalConfig): string {
  return [`${COOKIE}=`, `Path=${COOKIE_PATH}`, "HttpOnly", "SameSite=Strict", "Max-Age=0", ...(cfg.secureCookies ? ["Secure"] : [])].join("; ");
}

export function readSession(cfg: PortalConfig, req: Req): Session | null {
  const raw = parseCookies(req)[COOKIE];
  if (!raw || raw.length > 2048) return null;
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const body = raw.slice(0, dot);
  if (!safeEqual(raw.slice(dot + 1), hmac(cfg.sessionSecret, `session:${body}`))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (p.role !== "judge" && p.role !== "admin") return null;
    if (!(p.exp > Date.now())) return null;
    if (p.pv !== passcodeVersion(cfg, p.role)) return null;
    return { role: p.role, name: p.name, key: p.key, exp: p.exp };
  } catch {
    return null;
  }
}

export function requireJudge(cfg: PortalConfig, req: Req): Session {
  return readSession(cfg, req) ?? fail(401, "Sign in to continue.");
}

export function requireAdmin(cfg: PortalConfig, req: Req): Session {
  const s = requireJudge(cfg, req);
  if (s.role !== "admin") fail(403, "Organizers only.");
  return s;
}

/** Which role a passcode unlocks, or null. Compared in constant time. */
export function roleForPasscode(cfg: PortalConfig, passcode: string): Role | null {
  const admin = safeEqual(passcode, cfg.adminPasscode);
  const judge = safeEqual(passcode, cfg.judgePasscode);
  return admin ? "admin" : judge ? "judge" : null;
}
