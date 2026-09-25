// ─────────────────────────────────────────────
// Mac Design Cup 2026: single source of truth for site-wide FACTS.
// Every visible string, meta tag and JSON-LD node that states one of these
// facts imports it from here. Never retype an address, date or prize.
// Strings (headings, CTAs, FAQ answers) live in src/content/copy.ts.
// ─────────────────────────────────────────────

/** Canonical origin. The apex (macdesigncup.ca) 308s to www at the host. */
export const SITE_URL = "https://www.macdesigncup.ca";
export const SITE_HOST = "www.macdesigncup.ca";

export const EVENT_NAME = "Mac Design Cup 2026";
export const EVENT_FULL = "Mackenzie Design Cup";
export const EVENT_FULL_YEAR = "Mackenzie Design Cup 2026";
export const EVENT_SHORT = "MDC 2026";
export const CLUB = "WLMAC 3D Design Club";
// The club's home school. Source: the sponsor wall's WLMAC entry (wlmac.ca).
export const CLUB_SCHOOL = "William Lyon Mackenzie Collegiate Institute";
export const CLUB_SCHOOL_URL = "https://wlmac.ca/";
export const MODEL_NO = "MDC_2026";
export const TAGLINE = "BUILD THE IMPOSSIBLE";
export const KICKER = "A one-day 3D design competition";

// ─────────────────────────────────────────────
// Venue. Source: organizer (2026-09-23) + George Brown's own campus page,
// https://www.georgebrown.ca/about/campuses-locations (Limberlost Place,
// 185 Queens Quay East, Toronto ON M5A 1B6, Waterfront Campus).
// The school renamed itself George Brown Polytechnic: never "College".
// ─────────────────────────────────────────────
export const VENUE_INSTITUTION = "George Brown Polytechnic";
export const VENUE_INSTITUTION_URL = "https://www.georgebrown.ca/";
export const VENUE_BUILDING = "Limberlost Place";
export const VENUE_CAMPUS = "Waterfront Campus";
export const VENUE_STREET = "185 Queens Quay East";
export const VENUE_CITY = "Toronto";
export const VENUE_REGION = "ON";
export const VENUE_POSTAL = "M5A 1B6";
export const VENUE_COUNTRY = "CA";
/** "Limberlost Place, George Brown Polytechnic" */
export const VENUE_NAME = `${VENUE_BUILDING}, ${VENUE_INSTITUTION}`;
/** Short form for tight spots: "George Brown Polytechnic, Toronto" */
export const VENUE = `${VENUE_INSTITUTION}, ${VENUE_CITY}`;
/** "185 Queens Quay East, Toronto, ON M5A 1B6" */
export const VENUE_ADDRESS = `${VENUE_STREET}, ${VENUE_CITY}, ${VENUE_REGION} ${VENUE_POSTAL}`;
export const VENUE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${VENUE_BUILDING}, ${VENUE_ADDRESS}`,
)}`;

// ─────────────────────────────────────────────
// Date. Monday, November 16, 2026 (checked: Nov 1 2026 is a Sunday).
// Starts at 9:00 AM Eastern (the organizers' marketing and the partner
// schedule: partner check-in 8 to 9, opening at 9:00). No doors time is
// published, so the site says "starts", never "doors". DST has ended by
// then, so the offset is -05:00.
// While EVENT_DATE is null, the countdown renders its "date announced soon" state.
// ─────────────────────────────────────────────
export const EVENT_DATE: string | null = "2026-11-16T09:00:00-05:00";
export const EVENT_WEEKDAY = "Monday";
export const EVENT_DATE_LABEL = "November 16, 2026";
export const EVENT_DATE_SHORT = "Nov 16, 2026";
export const EVENT_MONTH_DAY = "November 16";
export const START_TIME = "9:00 AM";

// The day's times (organizer, 2026-09-25): building access starts at 8:00 AM
// (no earlier, for anyone), we start at 9:00 AM, and everything ends before
// 5:00 PM, when access ends. Judging and the closing ceremony are not set yet:
// show them as TBA, never a guessed time.
export const TIMES = {
  /** Building access (partners, setup): never earlier. */
  access: "8:00 AM",
  /** The start: opening and theme reveal, 9:00 AM. */
  start: START_TIME,
  /** Everything wraps up before this (access ends). */
  end: "5:00 PM",
  tba: "Time TBA",
} as const;

// ─────────────────────────────────────────────
// Who. TDSB high school students only (organizer, July 2026: not "GTA").
// Grades 9 to 12 per the registration form's grade options.
// Every student needs a supporting teacher from their own school who comes
// with them on the day (organizer, 2026-09-23).
// ─────────────────────────────────────────────
export const AUDIENCE = "TDSB high school students";
export const GRADES = "9 to 12";
// The expected head count, shown only on /partner (to sponsors). Source: the
// organizers' own /partner page on `main` ("Join 80 TDSB students", "80 TDSB
// students, Grades 9–12"). It is a plan, not a cap or a registration count.
// TODO(owner): confirm 80 is still the expected head count before launch.
export const EXPECTED_STUDENTS = 80;

// ─────────────────────────────────────────────
// Registration. One live Tally form with a Student / Teacher branch:
// teachers give school, number of students, names, grades (+ optional
// emails); students give student number, school, grade, 3D experience and
// their teacher's name and email. Every Register CTA goes to /register,
// which explains who registers and embeds the form.
// ─────────────────────────────────────────────
export const REGISTER_PATH = "/register";
export const REGISTRATION_URL = "https://tally.so/r/VLAX8y";
export const REGISTRATION_EMBED_URL =
  "https://tally.so/embed/VLAX8y?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

// Partner interest stays on its own form.
export const PARTNER_REGISTRATION_URL = "https://tally.so/r/EkGReL";

// ─────────────────────────────────────────────
// Prizes. The pool is the confirmed sponsor commitments ($10,754 on the
// commitments sheet), rounded down and kept as "$10,000+" rather than an
// exact figure. Siemens and TriMech are deliberately outside that total:
// they asked us not to publish a value for the software they're giving.
// ─────────────────────────────────────────────
export const PRIZE_POOL = "$10,000+";
export const PRIZE_POOL_NUMBER = 10000;
export const GRAND_PRIZE_ITEM = "Snapmaker J1S 3D printer";
export const GRAND_PRIZE_VALUE = "$1,500";
export const GRAND_PRIZE_FROM = "Shop3D.ca";
export const GRAND_PRIZE_EXTRA = "six spools of filament";
export const GRAND_PRIZE_SHORT = `a ${GRAND_PRIZE_ITEM}`;
export const GRAND_PRIZE = `A ${GRAND_PRIZE_ITEM} valued at ${GRAND_PRIZE_VALUE}, plus ${GRAND_PRIZE_EXTRA}.`;

// The rest of the table, straight from the sponsor commitments sheet. How the
// extras are split between builders isn't set yet, so nothing here names a rank.
// `count` + `unit` are the prize tile's big figure and its words; a line
// with no count shows its words as the figure (no number is ever made up).
export const PRIZE_EXTRAS = [
  { item: "10 Scrimba subscriptions", from: "Scrimba", count: 10, unit: "Subscriptions" },
  { item: "10 Aseprite software licences", from: "Aseprite", count: 10, unit: "Licences" },
  // Organizer's sponsor sheet, 2026-09-24: 50 seats on the machines, not one per builder.
  { item: "50 Ansys Discovery / Mechanical seats on the machines", from: "Ansys", count: 50, unit: "Seats" },
  { item: "3D printing materials", from: "Stratasys", count: null, unit: "3D printing materials" },
] as const;

// `short` is the ledger spelling of the same line; both must never drift apart.
export const EVERY_BUILDER = [
  // Siemens and TriMech asked us not to publish what their software is worth,
  // so this line names what you get and stops there.
  { item: "Solid Edge and Altair software", short: "Solid Edge + Altair", from: "Siemens & TriMech" },
  { item: "Swag to take home", short: "Swag", from: "Shop3D.ca" },
  { item: "Food all day at the venue", short: "Food all day", from: "George Brown Polytechnic" },
  { item: "Your own name tag", short: "Name tag", from: "Applied Precision 3D" },
] as const;

export const ON_THE_FLOOR = [
  // `short`: the chip on the prize sheet.
  { item: "Reps judging your work and mentoring you through it", short: "Judges and mentors", from: "Shop3D.ca" },
  { item: "A live product demo", short: "Live demo", from: "Shop3D.ca" },
  // TODO(owner): Ken's surname and role, once the club confirms how he wants it printed.
  { item: "A talk from Ken", short: "Talk from Ken", from: "Shop3D.ca" },
  { item: "Chatforce's CEO, in the room", short: "Chatforce's CEO", from: "Chatforce" },
  // Organizer, 2026-09-24 (marketing repo, sponsors/12-metavrse).
  { item: "A featured talk from Julie Smithson, CEO", short: "Talk from Julie Smithson", from: "METAVRSE" },
] as const;

export const CONTACT_EMAIL = "wlmac.3ddesignclub@gmail.com";

// The nav's section anchors, in page order: short, unnumbered. Old anchors
// (#why, #timeline, #teachers) are aliased in the page so links shared
// before the redesign still land somewhere real.
export const NAV_LINKS = [
  { label: "Prizes", href: "#prizes" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "The day", href: "#day" },
  { label: "FAQ", href: "#faq" },
] as const;

// TODO: add Instagram/LinkedIn here once the club accounts have real URLs.
export const SOCIALS = [
  { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
] as const;
