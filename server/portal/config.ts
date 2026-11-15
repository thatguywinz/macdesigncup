// ─────────────────────────────────────────────
// Submission portal · server configuration. Everything secret comes from the
// environment. Production fails closed: with a secret missing, the API
// answers 503 rather than run with a guessable default.
//
//   PORTAL_ENTRY_CODE        the code teams type to submit (shown on the day,
//                            with the theme reveal)
//   PORTAL_JUDGE_PASSCODE    judges sign in with it
//   PORTAL_ADMIN_PASSCODE    organizers sign in with it (results, settings)
//   PORTAL_SESSION_SECRET    signs session cookies and local upload links;
//                            32+ random characters
//   PORTAL_DEADLINE          ISO time submissions close (default: the run
//                            sheet's 1:30 PM on Nov 16, 2026)
//   PORTAL_STORAGE           "r2" (Cloudflare R2, private bucket), "blob"
//                            (Vercel Blob, private store) or "local" (files
//                            under .data/portal, dev only). Deployed, it
//                            picks R2 when the R2_* variables are set.
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//                            the R2 bucket and an API token for it
//   BLOB_READ_WRITE_TOKEN    set by Vercel when a private Blob store is
//                            connected to the project
// ─────────────────────────────────────────────

/** Submissions close at 1:30 PM on event day (organizers, 2026-11-14; src/config/site.ts TIMES.submit). */
export const DEFAULT_DEADLINE = "2026-11-16T13:30:00-05:00";

/**
 * No late submissions (organizers, 2026-11-14): the form locks at the
 * deadline exactly. Kept as a constant so the grace logic stays in one place.
 */
export const GRACE_SECONDS = 0;

export const SESSION_HOURS = 14;

const env = (k: string) => {
  const v = process.env[k];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};

/** Running on Vercel at all (preview or production): no dev defaults, ever. */
export const onVercel = () => !!env("VERCEL");

export type StorageKind = "r2" | "blob" | "local";

export interface PortalConfig {
  entryCode: string;
  judgePasscode: string;
  adminPasscode: string;
  sessionSecret: string;
  deadline: string;
  storage: StorageKind;
  /** Local dev defaults are in use (shown in the UI so nobody ships them). */
  devDefaults: boolean;
  /** Cookies get `Secure`. */
  secureCookies: boolean;
}

export class ConfigError extends Error {}

const DEV = {
  entryCode: "MDC-DEMO",
  judgePasscode: "judge-demo",
  adminPasscode: "admin-demo",
  sessionSecret: "dev-only-session-secret-not-for-production-use",
};

/** Reads the config. Throws ConfigError when a deployed portal is missing a secret. */
export function loadConfig(): PortalConfig {
  const deployed = onVercel();
  const r2Set = !!(env("R2_ACCOUNT_ID") && env("R2_ACCESS_KEY_ID") && env("R2_SECRET_ACCESS_KEY") && env("R2_BUCKET"));
  const asked = env("PORTAL_STORAGE");
  const storage: StorageKind =
    asked === "local" ? "local" : asked === "r2" ? "r2" : asked === "blob" ? "blob" : deployed ? (r2Set ? "r2" : "blob") : "local";

  if (deployed && storage === "local") throw new ConfigError("Local storage cannot run on Vercel.");

  const missing: string[] = [];
  const pick = (key: string, dev: string, minLength = 6) => {
    const v = env(key);
    if (v && v.length >= minLength) return v;
    if (deployed) missing.push(key);
    return dev;
  };
  const entryCode = pick("PORTAL_ENTRY_CODE", DEV.entryCode, 4);
  const judgePasscode = pick("PORTAL_JUDGE_PASSCODE", DEV.judgePasscode, 8);
  const adminPasscode = pick("PORTAL_ADMIN_PASSCODE", DEV.adminPasscode, 10);
  const sessionSecret = pick("PORTAL_SESSION_SECRET", DEV.sessionSecret, 32);
  if (deployed && storage === "blob" && !env("BLOB_READ_WRITE_TOKEN")) missing.push("BLOB_READ_WRITE_TOKEN");
  if (storage === "r2" && !r2Set) missing.push("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET");
  if (missing.length) throw new ConfigError(`Portal is not configured: set ${missing.join(", ")}.`);
  if (deployed && judgePasscode === adminPasscode) throw new ConfigError("Judge and admin passcodes must differ.");

  const deadline = env("PORTAL_DEADLINE") ?? DEFAULT_DEADLINE;
  if (Number.isNaN(Date.parse(deadline))) throw new ConfigError("PORTAL_DEADLINE is not a valid date.");

  return {
    entryCode,
    judgePasscode,
    adminPasscode,
    sessionSecret,
    deadline,
    storage,
    devDefaults: !deployed && entryCode === DEV.entryCode,
    secureCookies: deployed,
  };
}
