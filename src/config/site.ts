// ─────────────────────────────────────────────
// Mac Design Cup 2026 — single source of truth for site-wide constants.
// Swap REGISTRATION_URL for the real form/route when it exists.
// ─────────────────────────────────────────────

export const EVENT_NAME = "Mac Design Cup 2026";
export const EVENT_SHORT = "MDC 2026";
export const CLUB = "WLMAC 3D Design Club";
export const MODEL_NO = "MDC_2026";
export const TAGLINE = "BUILD THE IMPOSSIBLE";
export const KICKER = "A one-day 3D designathon";

// In-app placeholder route so every CTA resolves to something real.
// Replace with an external registration form URL when available.
export const REGISTRATION_URL = "/register";

export const NAV_LINKS = [
  { label: "The Challenge", href: "#why" },
  { label: "The Day", href: "#timeline" },
  { label: "FAQ", href: "#faq" },
] as const;

export const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Email", href: "mailto:hello@macdesigncup.com" },
] as const;

export const FOOTER_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
] as const;
