// ─────────────────────────────────────────────
// JSON-LD: one @graph per page, generated from site.ts / copy.ts / sponsors.ts
// so the markup and the visible page read the same constants.
//
// Entity nodes (Organization, WebSite, the club's school) repeat on every
// indexable page under stable @ids, because crawlers never join graphs across
// pages. Each real-world institution is one node with one name, however many
// roles it plays (George Brown Polytechnic is both a sponsor and the place
// that contains the venue). The Event and the FAQPage live on Home, the page
// that shows them; /register and /partner point at the Event by its absolute
// @id (`about`) rather than repeating a partial copy of it.
//
// Honest status (Google, September 2026): the FAQ rich result was retired on
// May 7, 2026, and the Event rich result excludes events that are not open to
// the general public or whose participants are minors on school premises, so
// neither is expected to earn a rich result. Both stay because they are true
// and help search engines and AI answer engines understand the event.
// ─────────────────────────────────────────────
import {
  AUDIENCE,
  CLUB,
  CLUB_SCHOOL,
  CLUB_SCHOOL_URL,
  CONTACT_EMAIL,
  EVENT_DATE,
  EVENT_DATE_LABEL,
  EVENT_FULL,
  EVENT_FULL_YEAR,
  EVENT_NAME,
  EVENT_WEEKDAY,
  GRADES,
  SITE_URL,
  TIMES,
  VENUE_CITY,
  VENUE_COUNTRY,
  VENUE_INSTITUTION,
  VENUE_INSTITUTION_URL,
  VENUE_MAP_URL,
  VENUE_NAME,
  VENUE_POSTAL,
  VENUE_REGION,
  VENUE_STREET,
} from "@/config/site";
import { FAQS, SECTIONS, SUMMARY } from "@/content/copy";
import { SPONSORS } from "@/config/sponsors";
import {
  HOME_ROUTE,
  LANG,
  OG_IMAGE,
  PARTNER_ROUTE,
  REGISTER_ROUTE,
  absoluteUrl,
  type RouteDef,
} from "@/seo/routes";

type Node = Record<string, unknown>;

export const IDS = {
  organization: `${SITE_URL}/#organization`,
  logo: `${SITE_URL}/#logo`,
  website: `${SITE_URL}/#website`,
  event: `${SITE_URL}/#event`,
  venue: `${SITE_URL}/#venue`,
  faq: `${SITE_URL}/#faq`,
  /** The venue's institution, also a sponsor. */
  georgeBrown: `${SITE_URL}/#george-brown`,
  /** The club's school, also a sponsor. */
  wlmac: `${SITE_URL}/#wlmac`,
} as const;

const ref = (id: string) => ({ "@id": id });
const webPageId = (route: RouteDef) => `${absoluteUrl(route.path)}#webpage`;
const breadcrumbId = (route: RouteDef) => `${absoluteUrl(route.path)}#breadcrumb`;

/** The club that runs the event. */
const organization = (): Node => ({
  "@type": "Organization",
  "@id": IDS.organization,
  name: CLUB,
  url: `${SITE_URL}/`,
  email: CONTACT_EMAIL,
  logo: {
    "@type": "ImageObject",
    "@id": IDS.logo,
    url: `${SITE_URL}/lion/lion-mark.png`,
    contentUrl: `${SITE_URL}/lion/lion-mark.png`,
    width: 192,
    height: 192,
    caption: EVENT_FULL,
  },
  parentOrganization: ref(IDS.wlmac),
});

/** The club's school: parent of the club and a sponsor, one node. */
const wlmac = (): Node => ({
  "@type": "HighSchool",
  "@id": IDS.wlmac,
  name: CLUB_SCHOOL,
  url: CLUB_SCHOOL_URL,
});

/**
 * The venue's institution: it contains the venue (CollegeOrUniversity is a
 * Place as well as an Organization) and it is a sponsor, one node.
 */
const georgeBrown = (): Node => ({
  "@type": "CollegeOrUniversity",
  "@id": IDS.georgeBrown,
  name: VENUE_INSTITUTION,
  url: VENUE_INSTITUTION_URL,
});

/** Comparable form of a site URL: lowercase, no trailing slash. */
const siteKey = (url: string) => url.toLowerCase().replace(/\/+$/, "");

/**
 * Sponsors that are already entities in the graph become references to that
 * one node, matched by site URL (sponsors.ts spells WLMAC "William Lyon
 * Mackenzie CI", the school's full name lives in site.ts). The rest are plain
 * Organizations.
 */
const sponsorNode = (s: { name: string; href: string }): Node => {
  if (siteKey(s.href) === siteKey(VENUE_INSTITUTION_URL)) return ref(IDS.georgeBrown);
  if (siteKey(s.href) === siteKey(CLUB_SCHOOL_URL)) return ref(IDS.wlmac);
  return { "@type": "Organization", name: s.name, url: s.href };
};

const website = (): Node => ({
  "@type": "WebSite",
  "@id": IDS.website,
  url: `${SITE_URL}/`,
  name: EVENT_FULL,
  alternateName: [EVENT_NAME, "Mac Design Cup"],
  inLanguage: LANG,
  publisher: ref(IDS.organization),
});

/** "4:00 PM" -> "16:00"; null if the clock string is not in that shape. */
const clock24 = (clock: string): string | null => {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(clock);
  if (!m) return null;
  const h = (Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

/**
 * The published finish, TIMES.end ("4:00 PM"; the page says "Nine to four"
 * and "Done by 4:00 PM"), on the event's date in the same ISO 8601 shape
 * and UTC offset as EVENT_DATE, as Google asks: "2026-11-16T16:00:00-05:00".
 * Derived rather than retyped, so the markup can never disagree with the
 * page. Like every time after the start it is a working time (registered
 * schools get the final schedule).
 */
export const EVENT_END: string | null = (() => {
  const start = EVENT_DATE ? /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})$/.exec(EVENT_DATE) : null;
  const end = clock24(TIMES.end);
  return start && end ? `${start[1]}T${end}:00${start[2]}` : null;
})();

/** Schema description: third person is correct here (it is not shown as prose). */
export const EVENT_DESCRIPTION = `${SUMMARY.deck} It starts at ${TIMES.start} on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_NAME}. ${SUMMARY.prize}`;

const event = (): Node => ({
  "@type": "Event",
  "@id": IDS.event,
  name: EVENT_FULL_YEAR,
  alternateName: "Mac Design Cup",
  description: EVENT_DESCRIPTION,
  url: `${SITE_URL}/`,
  image: [OG_IMAGE.url],
  inLanguage: LANG,
  // The 9:00 AM start to the published 4:00 PM finish, both date-times with the Eastern
  // offset (a date-only end beside a date-time start would break Google's
  // "same format as startDate" rule).
  startDate: EVENT_DATE,
  ...(EVENT_END ? { endDate: EVENT_END } : {}),
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    "@id": IDS.venue,
    name: VENUE_NAME,
    address: {
      "@type": "PostalAddress",
      streetAddress: VENUE_STREET,
      addressLocality: VENUE_CITY,
      addressRegion: VENUE_REGION,
      postalCode: VENUE_POSTAL,
      addressCountry: VENUE_COUNTRY,
    },
    hasMap: VENUE_MAP_URL,
    containedInPlace: ref(IDS.georgeBrown),
  },
  organizer: ref(IDS.organization),
  sponsor: SPONSORS.map(sponsorNode),
  audience: [
    {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `${AUDIENCE}, grades ${GRADES}`,
    },
    {
      "@type": "EducationalAudience",
      educationalRole: "teacher",
    },
  ],
  // Free to enter (organizer, 2026-09-25).
  isAccessibleForFree: true,
});

const faqPage = (): Node => ({
  "@type": "FAQPage",
  "@id": IDS.faq,
  url: absoluteUrl(HOME_ROUTE.path),
  name: SECTIONS.faq.lines.join(" "),
  isPartOf: ref(IDS.website),
  inLanguage: LANG,
  // acceptedAnswer.text is the exact string the FAQ section renders.
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

const breadcrumbList = (route: RouteDef): Node => ({
  "@type": "BreadcrumbList",
  "@id": breadcrumbId(route),
  itemListElement: (route.breadcrumb ?? []).map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

/**
 * Pages whose subject is the event without being the event's page. Their
 * WebPage says so with the Event's absolute @id: the Event is defined once,
 * on Home, and a partial copy here would read as a second, incomplete Event.
 */
const ABOUT_EVENT: ReadonlySet<string> = new Set([REGISTER_ROUTE.path, PARTNER_ROUTE.path]);

const webPage = (route: RouteDef, isHome: boolean): Node => ({
  "@type": "WebPage",
  "@id": webPageId(route),
  url: absoluteUrl(route.path),
  name: route.title,
  description: route.description,
  isPartOf: ref(IDS.website),
  inLanguage: LANG,
  ...(route.dateModified ? { dateModified: route.dateModified } : {}),
  primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height },
  ...(isHome ? { about: ref(IDS.event), mainEntity: ref(IDS.event) } : {}),
  ...(ABOUT_EVENT.has(route.path) ? { about: ref(IDS.event) } : {}),
  ...(route.breadcrumb ? { breadcrumb: ref(breadcrumbId(route)) } : {}),
});

/**
 * The page's JSON-LD graph, or null for the 404. A noindex page (e.g.
 * /partner/register) keeps its graph so its visible trail keeps a matching
 * BreadcrumbList; search engines simply do not index it.
 *
 * Every {"@id"} reference resolves inside the same graph, with one deliberate
 * exception: `about` on /register and /partner names the Event that Home
 * defines (CROSS_PAGE_REFS; the prerender and the tests allow exactly that).
 */
export function graphFor(route: RouteDef): { "@context": "https://schema.org"; "@graph": Node[] } | null {
  if (route.notFound) return null;
  const isHome = route.path === HOME_ROUTE.path;
  const graph: Node[] = [organization(), wlmac(), website(), webPage(route, isHome)];
  if (route.breadcrumb) graph.push(breadcrumbList(route));
  if (isHome) graph.push(event(), georgeBrown(), faqPage());
  return { "@context": "https://schema.org", "@graph": graph };
}

/** @ids a page may reference while another page's graph defines them. */
export const CROSS_PAGE_REFS: readonly string[] = [IDS.event];

/**
 * Serialize for a <script type="application/ld+json"> block. Escaping "<"
 * means no string in the graph can ever close the script tag early.
 */
export const serializeJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");
