// ─────────────────────────────────────────────
// Mac Design Cup 2026 — single source of truth for site-wide constants.
// ─────────────────────────────────────────────

export const EVENT_NAME = "Mac Design Cup 2026";
export const EVENT_FULL = "Mackenzie Design Cup";
export const EVENT_SHORT = "MDC 2026";
export const CLUB = "WLMAC 3D Design Club";
export const MODEL_NO = "MDC_2026";
export const TAGLINE = "BUILD THE IMPOSSIBLE";
export const KICKER = "A one-day 3D designathon";
export const VENUE = "George Brown College, Toronto";

// TODO: set the real event date (ISO string, e.g. "2026-03-07T09:00:00-05:00").
// While null, the countdown renders its "date announced soon" state.
export const EVENT_DATE: string | null = null;

// Live registration form (Tally).
export const REGISTRATION_URL = "https://tally.so/r/VLAX8y";
export const REGISTRATION_EMBED_URL =
  "https://tally.so/embed/VLAX8y?alignLeft=1&hideTitle=1&transparentBackground=1";

// TODO: macdesigncup.com is not registered yet, so this mailbox does not
// receive mail. Swap in the club's real monitored address (or register the
// domain with mail routing) before promoting the contact/sponsor CTAs.
export const CONTACT_EMAIL = "hello@macdesigncup.com";

export const NAV_LINKS = [
  { label: "The Challenge", href: "#why" },
  { label: "The Day", href: "#timeline" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "FAQ", href: "#faq" },
] as const;

// TODO: add Instagram/LinkedIn here once the club accounts have real URLs.
export const SOCIALS = [
  { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
] as const;
