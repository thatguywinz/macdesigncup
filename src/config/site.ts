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
export const EVENT_DATE: string | null = "2026-11-16T08:30:00-05:00";
export const EVENT_WEEKDAY = "Monday";
export const EVENT_DATE_LABEL = "November 16, 2026";
export const EVENT_DATE_SHORT = "Nov 16, 2026";
export const EVENT_MONTH_DAY = "November 16";
export const START_TIME = "8:30 AM";

// The day's times. Building access starts at 8:00 AM, no earlier, for anyone
// (organizer, 2026-09-25). The rest is the organizers' run sheet (2026-10-25):
// check-in and sponsor demos 8:30 to 9:00, opening ceremony 9:10 (the theme
// is revealed at its end), design session 1 9:55 to 12:00, lunch 12:00 to
// 12:30, design session 2 12:35 to 2:00 with early judging from 1:30,
// submissions by 2:00, judging 2:05 to 3:15, closing ceremony and awards
// 3:20 to 3:50, everyone out by 4:00. Rooms and names stay off the site.
export const TIMES = {
  /** Building access (partners, setup): never earlier. */
  access: "8:00 AM",
  /** Check-in opens, with sponsor demos in the hall. The day's start. */
  start: START_TIME,
  opening: "9:10 AM",
  design: "9:55 AM",
  lunch: "12:00 PM",
  earlyJudging: "1:30 PM",
  submit: "2:00 PM",
  judging: "2:05 PM",
  closing: "3:20 PM",
  /** Everyone is out by this (access ends). */
  end: "4:00 PM",
} as const;

// ─────────────────────────────────────────────
// Who. TDSB high school students only (organizer, July 2026: not "GTA").
// Grades 9 to 12 per the registration form's grade options.
// Every student needs a supporting teacher from their own school who comes
// with them on the day (organizer, 2026-09-23). WLMAC students put Mr. Archer
// down as theirs; anyone else names a teacher they think would come, and we
// can reach out to that teacher after they sign up (organizer, 2026-10-22).
// ─────────────────────────────────────────────
export const AUDIENCE = "TDSB high school students";
export const GRADES = "9 to 12";
// The expected head count, shown only on /partner (to sponsors). Source: the
// organizers' own /partner page on `main` ("Join 80 TDSB students", "80 TDSB
// students, Grades 9–12"). It is a plan, not a cap or a registration count.
// Confirmed by the organizers 2026-10-25.
export const EXPECTED_STUDENTS = 80;
/** The WLMAC teacher who comes with every WLMAC student. */
export const WLMAC_TEACHER = "Mr. Archer";
/** Teams of 1 to 4 (organizer, 2026-10-22). Solo is recommended. */
export const TEAM_MAX = 4;

// ─────────────────────────────────────────────
// Registration. One live Tally form with a Student / Teacher branch:
// teachers give school, number of students, names, grades (+ optional
// emails); students give student number, school, grade, 3D experience and
// their teacher's name and email. Every Register CTA goes to /register,
// which explains who registers and embeds the form.
// ─────────────────────────────────────────────
export const REGISTER_PATH = "/register";
// Registration closes one week before the event (organizer, 2026-10-22):
// Monday, November 9, 2026 at 11:59 PM Eastern (still -05:00, DST is over).
export const REGISTRATION_CLOSES = "2026-11-09T23:59:00-05:00";
export const REGISTRATION_CLOSES_LABEL = "Monday, November 9, 2026, at 11:59 PM";
export const REGISTRATION_CLOSES_SHORT = "Nov 9, 11:59 PM";
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

// 2nd and 3rd place (organizer, 2026-10-22): 3D printing supplies.
export const RUNNER_UP_PRIZE = "3D printing supplies";

// The rest of the table, straight from the sponsor commitments sheet. Who gets
// which extra isn't set yet (organizer, 2026-10-22), so nothing here names a rank.
// `count` + `unit` are the prize tile's big figure and its words; a line
// with no count shows its words as the figure (no number is ever made up).
export const PRIZE_EXTRAS = [
  { item: "10 Scrimba subscriptions", from: "Scrimba", count: 10, unit: "Subscriptions" },
  { item: "10 Aseprite software licences", from: "Aseprite", count: 10, unit: "Licences" },
  // Organizer's sponsor sheet, 2026-09-24: 50 seats on the machines, not one per builder.
  { item: "50 Ansys Discovery / Mechanical seats on the machines", from: "Ansys", count: 50, unit: "Seats" },
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
  { item: "A talk from Ken", short: "Talk from Ken", from: "Shop3D.ca" },
  { item: "Chatforce's CEO, in the room", short: "Chatforce's CEO", from: "Chatforce" },
  // Organizer, 2026-09-24 (marketing repo, sponsors/12-metavrse).
  { item: "A featured talk from Julie Smithson, CEO", short: "Talk from Julie Smithson", from: "METAVRSE" },
] as const;

export const CONTACT_EMAIL = "wlmac.3ddesignclub@gmail.com";

// ─────────────────────────────────────────────
// Competition resources (organizer, 2026-10-24): the club's study guides, one
// per program, from the "Website Resources" Drive folder. Topics are each
// guide's own table of contents. Drive sharing is "TDSB: anyone with the link
// can view", so a visitor must be signed in to a TDSB Google account to open
// them; the page says so.
// ─────────────────────────────────────────────
export const RESOURCES_PATH = "/resources";
export const RESOURCES_FOLDER_URL = "https://drive.google.com/drive/folders/1uauJ-REj1qS55ohOVQhfKQLFpiBj_uR2";
export interface ResourceGuide {
  software: string;
  pages: number;
  /** The PDF's Drive viewer link. */
  pdf: string;
  /** The guide's table of contents. */
  topics: readonly string[];
}
export const RESOURCE_GUIDES: readonly ResourceGuide[] = [
  {
    software: "Blender",
    pages: 14,
    pdf: "https://drive.google.com/file/d/1AAN4_qH_WQdlXvO0ImO2KtvLnGPI93N9/view",
    topics: [
      "Basic Blender interface",
      "Hard surface modelling",
      "Parametric modifiers",
      "Assembly mating",
      "Materials, lighting and rendering",
      "Animations",
      "Common shortcut reference sheet",
    ],
  },
  {
    software: "Fusion 360",
    pages: 15,
    pdf: "https://drive.google.com/file/d/1HmRYjV29zk1ycOgz0S6c60qBHKwyvuur/view",
    topics: [
      "2D modelling tools",
      "3D modelling tools",
      "Multipart designing",
      "Assembly and motion mates",
      "Render workspace",
    ],
  },
  {
    software: "Onshape",
    pages: 18,
    pdf: "https://drive.google.com/file/d/1brNPrtP6waEc5TfH01e4s2HRWy6rHS_L/view",
    topics: [
      "2D modelling tools",
      "3D modelling tools",
      "Multipart designing",
      "Assembly and motion mates",
      "FeatureScript programming",
      "Surface modelling",
    ],
  },
];

// The nav's section anchors, in page order: short, unnumbered. Old anchors
// (#why, #timeline, #teachers) are aliased in the page so links shared
// before the redesign still land somewhere real.
export const NAV_LINKS = [
  { label: "Prizes", href: "#prizes" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "The day", href: "#day" },
  { label: "Rules", href: "#rules" },
  { label: "FAQ", href: "#faq" },
] as const;

// TODO: add Instagram/LinkedIn here once the club accounts have real URLs.
export const SOCIALS = [
  { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
] as const;
