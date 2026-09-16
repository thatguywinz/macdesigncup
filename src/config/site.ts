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
// Prizes. The pool is the confirmed sponsor commitments ($10,754 on the
// commitments sheet), rounded down and kept as "$10,000+" rather than an
// exact figure. Siemens and TriMech are deliberately outside that total:
// they asked us not to publish a value for the software they're giving.
// ─────────────────────────────────────────────
export const PRIZE_POOL = "$10,000+";
export const GRAND_PRIZE_VALUE = "$1,500";
export const GRAND_PRIZE_SHORT = `A 3D printer valued at ${GRAND_PRIZE_VALUE}`;
export const GRAND_PRIZE = `A Snapmaker J1S 3D printer valued at ${GRAND_PRIZE_VALUE}, plus six spools of filament.`;

// The rest of the table, straight from the sponsor commitments sheet. How the
// extras are split between builders isn't set yet, so nothing here names a rank.
export const PRIZE_EXTRAS = [
  { item: "10 Scrimba subscriptions", from: "Scrimba" },
  { item: "10 Aseprite software licences", from: "Aseprite" },
  { item: "3D printing materials", from: "Stratasys" },
] as const;

// `short` is the ledger spelling of the same line — the sponsor section runs a
// compact version of this list, and both should never drift apart.
export const EVERY_BUILDER = [
  { item: "An Ansys Discovery / Mechanical licence", short: "Ansys licence", from: "Ansys" },
  // Siemens and TriMech asked us not to publish what their software is worth,
  // so this line names what you get and stops there.
  { item: "Solid Edge and Altair software", short: "Solid Edge + Altair", from: "Siemens & TriMech" },
  { item: "Swag to take home", short: "Swag", from: "Shop3D.ca" },
  { item: "Food all day, in a real college venue", short: "Food all day", from: "George Brown College" },
  { item: "Your own name tag", short: "Name tag", from: "Applied Precision" },
] as const;

export const ON_THE_FLOOR = [
  { item: "Reps judging your work and mentoring you through it", from: "Shop3D.ca" },
  { item: "A live product demo", from: "Shop3D.ca" },
  { item: "A talk from Ken", from: "Shop3D.ca" },
  { item: "The CEO, in the room", from: "Chatforce" },
] as const;

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
