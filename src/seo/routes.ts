// ─────────────────────────────────────────────
// The head table: one row per prerendered route. The prerender
// (scripts/prerender.mjs, via src/entry-server.tsx) writes these into each
// route's static HTML, and <RouteHead/> applies the same row on client-side
// navigation, so the served head and the live head can never disagree.
//
// Titles are phrases a person would say (~50 to 64 chars). Descriptions are
// the club talking (we / you), ~150 to 160 chars, one fact each. Every fact is
// interpolated from src/config/site.ts, never retyped. The keyword map behind
// these rows: one primary query per route, none used twice.
//   /                 Mackenzie Design Cup + 3D design competition for high school students in Toronto
//   /register         Mackenzie Design Cup registration
//   /partner          sponsor a student design competition Toronto
//   /partner/register (noindex: an unlinked form page; partners reach the
//                     Tally form from /partner, so it targets no query)
// ─────────────────────────────────────────────
import {
  EVENT_DATE_LABEL,
  EVENT_DATE_SHORT,
  EVENT_FULL,
  EVENT_NAME,
  EVENT_WEEKDAY,
  PRIZE_POOL,
  SITE_URL,
  VENUE_CITY,
  VENUE_INSTITUTION,
  VENUE_NAME,
} from "@/config/site";
import { BREADCRUMBS, NOT_FOUND } from "@/content/copy";

/**
 * Per-route "last meaningful content change". Feeds the sitemap's <lastmod>
 * and WebPage.dateModified. Bump a route's date only when its words change;
 * never a build-time `new Date()` (Google drops a lastmod it can see is false).
 */
export const CONTENT_DATES = {
  home: "2026-09-24",
  register: "2026-09-24",
  partner: "2026-09-24",
  partnerRegister: "2026-09-24",
} as const;

/**
 * Breadcrumb names for the BreadcrumbList schema. They are the visible
 * trail's own strings (BREADCRUMBS in copy.ts, which the pages' <Breadcrumbs>
 * render), so the two can never drift apart.
 */
export const CRUMB_LABELS = {
  home: BREADCRUMBS.home,
  register: BREADCRUMBS.register,
  partner: BREADCRUMBS.partner,
  // Sits under "Partner" in the trail (Home › Partner › Registration).
  partnerRegister: BREADCRUMBS.partnerRegister,
} as const;

export interface Crumb {
  name: string;
  /** Router path, e.g. "/partner". */
  path: string;
}

export interface RouteDef {
  /** Router path with no trailing slash ("/" for home). */
  path: string;
  /** Output file inside dist/. */
  file: string;
  title: string;
  description: string;
  /**
   * Kept out of search results: robots "noindex, follow", no canonical, and
   * no entry in sitemap.xml or llms.txt. The page still renders normally,
   * keeps its social tags (people reach it from a shared link) and its
   * JSON-LD, so a visible breadcrumb trail keeps its BreadcrumbList.
   */
  noindex?: boolean;
  /**
   * The not-found page: noindex, and also no social tags and no JSON-LD.
   * routeFor() falls back to it for every path not in the table.
   */
  notFound?: boolean;
  /** Listed in public/sitemap.xml (indexable routes only). */
  sitemap: boolean;
  dateModified?: string;
  /** Trail from Home to this page (inclusive). Absent on Home and the 404. */
  breadcrumb?: readonly Crumb[];
}

const HOME_CRUMB: Crumb = { name: CRUMB_LABELS.home, path: "/" };
const PARTNER_CRUMB: Crumb = { name: CRUMB_LABELS.partner, path: "/partner" };

export const HOME_ROUTE: RouteDef = {
  path: "/",
  file: "index.html",
  title: `${EVENT_FULL} · Toronto High School 3D Design Competition`,
  // The prize leads: a phone SERP cuts the snippet near 120 characters.
  description: `${PRIZE_POOL} in prizes: our one-day 3D design competition for TDSB high school students and their teachers is ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_INSTITUTION}.`,
  sitemap: true,
  dateModified: CONTENT_DATES.home,
};

export const REGISTER_ROUTE: RouteDef = {
  path: "/register",
  file: "register/index.html",
  title: `${EVENT_FULL} Registration for Students and Teachers`,
  description: `Teachers, register your whole group on one form. Students, sign yourself up, then bring a teacher from your school with you on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}.`,
  sitemap: true,
  dateModified: CONTENT_DATES.register,
  breadcrumb: [HOME_CRUMB, { name: CRUMB_LABELS.register, path: "/register" }],
};

export const PARTNER_ROUTE: RouteDef = {
  path: "/partner",
  file: "partner/index.html",
  title: "Sponsor a Student 3D Design Competition in Toronto",
  description: `Put your company in front of TDSB students who design in 3D. We need sponsors, mentors, judges and speakers for ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, in ${VENUE_CITY}.`,
  sitemap: true,
  dateModified: CONTENT_DATES.partner,
  breadcrumb: [HOME_CRUMB, PARTNER_CRUMB],
};

/**
 * noindex: nothing on the site links here (partners use the Tally form from
 * /partner), and its form posts to api/partner-register.ts, a Vercel function
 * that needs Google Sheets credentials nobody has verified on this deploy, so
 * a searcher landing here might not get through. Still prerendered, still
 * reachable by URL, still carries its breadcrumb schema. Flip it back to
 * indexable (noindex off, sitemap on) once the endpoint is proven end to end.
 */
export const PARTNER_REGISTER_ROUTE: RouteDef = {
  path: "/partner/register",
  file: "partner/register/index.html",
  title: `Partner Registration Form for the ${EVENT_NAME}`,
  description: `Tell us how your organization wants to back the Mac Design Cup on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}: as a sponsor, mentor, judge, speaker or exhibitor. One form covers it.`,
  noindex: true,
  sitemap: false,
  dateModified: CONTENT_DATES.partnerRegister,
  breadcrumb: [HOME_CRUMB, PARTNER_CRUMB, { name: CRUMB_LABELS.partnerRegister, path: "/partner/register" }],
};

/**
 * Served by the host for every unknown URL (dist/404.html, HTTP 404).
 * Rendered at "/404", which falls through to the router's "*" route.
 */
export const NOT_FOUND_ROUTE: RouteDef = {
  path: "/404",
  file: "404.html",
  title: `Sheet not found · ${EVENT_FULL}`,
  description: NOT_FOUND.line,
  noindex: true,
  notFound: true,
  sitemap: false,
};

/** Every file the prerender writes, in build order. */
export const ROUTES: readonly RouteDef[] = [
  HOME_ROUTE,
  REGISTER_ROUTE,
  PARTNER_ROUTE,
  PARTNER_REGISTER_ROUTE,
  NOT_FOUND_ROUTE,
];

/** The routes a crawler should index (and the sitemap and llms.txt list). */
export const INDEXABLE_ROUTES = ROUTES.filter((r) => !r.noindex);

/** Every real page (all but the 404): each one carries a JSON-LD graph. */
export const PAGE_ROUTES = ROUTES.filter((r) => !r.notFound);

/** Absolute canonical URL for a router path: "/" -> ".../", "/partner" -> ".../partner". */
export const absoluteUrl = (path: string): string => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

/** Strip a trailing slash (the host 308s them away) so "/partner/" matches "/partner". */
export const normalizePath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

/** The head row for a live pathname; anything not in the table is the 404. */
export const routeFor = (pathname: string): RouteDef => {
  const path = normalizePath(pathname);
  return PAGE_ROUTES.find((r) => r.path === path) ?? NOT_FOUND_ROUTE;
};

// ── Social card ───────────────────────────────
// public/og-image.png, rendered by scripts/og/render.mjs from scripts/og/og.html.
export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `The ${EVENT_FULL} card: a lion mark on a drafting grid, ${EVENT_WEEKDAY}, ${EVENT_DATE_SHORT}, at ${VENUE_NAME}, and ${PRIZE_POOL} in prizes.`,
} as const;

/** Indexable pages also allow large image previews (Discover, AI answers). */
export const ROBOTS_INDEX = "index, follow, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, follow";

export const SITE_NAME = EVENT_FULL;
export const OG_LOCALE = "en_CA";
export const LANG = "en-CA";
export const THEME_COLOR = "#090a0c";
