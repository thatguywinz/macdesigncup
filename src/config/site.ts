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

// Event day (ISO string). While null, the countdown renders its "date announced soon" state.
export const EVENT_DATE: string | null = "2026-11-16T08:00:00-05:00";
export const EVENT_DATE_LABEL = "November 16, 2026";

// Live student registration form (Tally).
export const REGISTRATION_URL = "https://tally.so/r/VLAX8y";
export const REGISTRATION_EMBED_URL =
  "https://tally.so/embed/VLAX8y?alignLeft=1&hideTitle=1&transparentBackground=1";

// Partner interest stays on its own form.
export const PARTNER_REGISTRATION_URL = "https://tally.so/r/EkGReL";

// ─────────────────────────────────────────────
// Prizes. The pool is the confirmed sponsor commitments (~$6,950), rounded
// up and kept as "$7,000+" rather than an exact figure.
// ─────────────────────────────────────────────
export const PRIZE_POOL = "$7,000+";
export const GRAND_PRIZE_VALUE = "$1,500";
export const GRAND_PRIZE_SHORT = `A 3D printer valued at ${GRAND_PRIZE_VALUE}`;
export const GRAND_PRIZE = `A 3D printer valued at ${GRAND_PRIZE_VALUE}, plus six spools of filament.`;

export const CONTACT_EMAIL = "wlmac.3ddesignclub@gmail.com";

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
