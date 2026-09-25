// ─────────────────────────────────────────────
// Mac Design Cup 2026 · copy deck. Every heading, eyebrow, CTA and FAQ answer
// on the site lives here so the set can be read (and kept honest) as one list.
// Facts are imported from src/config/site.ts, never retyped.
//
// THE FIVE HARD RULES
// 1. No em dash in any visible string. Use a period, comma, colon or middot (·).
// 2. No research / brief / build-status words in rendered strings
//    (sources, verify, confirmed, placeholder, demo, TODO, this page, this website).
// 3. No unsourced claim-bearing fact. No fact, no slot.
// 4. We = the WLMAC 3D Design Club (the students running this). You = the
//    student or teacher reading. Never I/me/my.
//    Exception: FAQ questions are the reader speaking and may use I/my.
// 5. The CTA string is verbatim, everywhere: CTA.register.
//
// VOICE
// Speaker: the club, first person plural. Reader: a TDSB student or their
// teacher. Locale en-CA (colour, centre, licence, program). Short sentences,
// contractions yes, plain and practical; teachers get logistics first.
// Em dash replacement: period, or a middot in labels.
// Sounds like: "We start at 9:00 AM at Limberlost Place. Bring a laptop and
// its charger." Does not sound like: "Unlock your creative potential at an
// immersive, cutting-edge design experience."
// ─────────────────────────────────────────────
import {
  CLUB,
  CLUB_SCHOOL,
  CONTACT_EMAIL,
  EVENT_DATE_LABEL,
  EVENT_DATE_SHORT,
  EVENT_FULL,
  EVENT_MONTH_DAY,
  EVENT_WEEKDAY,
  EVERY_BUILDER,
  GRADES,
  GRAND_PRIZE_EXTRA,
  GRAND_PRIZE_FROM,
  GRAND_PRIZE_ITEM,
  GRAND_PRIZE_VALUE,
  PRIZE_EXTRAS,
  PRIZE_POOL,
  REGISTER_PATH,
  SITE_HOST,
  TIMES,
  VENUE_ADDRESS,
  VENUE_BUILDING,
  VENUE_CAMPUS,
  VENUE_CITY,
  VENUE_INSTITUTION,
  VENUE_NAME,
  VENUE_POSTAL,
  VENUE_REGION,
  VENUE_STREET,
} from "@/config/site";

/** "9:00 AM" -> "9 AM" (on-the-hour times in tight spots). */
const HOUR = (t: string) => t.replace(":00 ", " ");

/** The only wording any Register button or link uses. */
export const CTA = {
  register: "Register now",
  enter: "Enter the hall",
  partner: "Partner with us",
  ask: "Ask us",
  map: "Map",
} as const;

/**
 * Who registers: everyone, on one form (organizer, 2026-09-23; the Tally
 * form's Student / Teacher branch). The tiny note beside every Register
 * button; `sr` is the button's screen-reader description.
 */
export const WHO_REGISTERS = {
  note: "Students and teachers",
  sr: "One form for students and teachers.",
} as const;

// ── Hero (the 3D hall) ────────────────────────
export const HERO = {
  eyebrow: `${EVENT_DATE_SHORT} · ${VENUE_BUILDING}, ${VENUE_CITY}`,
  h1: ["Mackenzie", "Design Cup"],
  /** One line: the pool (set in ember), then the rest. */
  prize: { pool: PRIZE_POOL, rest: "in prizes · 1st place wins a 3D printer" },
} as const;

/**
 * The event in two sentences, for machines only (not shown on the page): the
 * Event JSON-LD description and site.webmanifest. Kept word for word from the
 * launch copy so the structured data and meta stay unchanged.
 */
export const SUMMARY = {
  deck: "A one-day 3D design competition for TDSB high school students and the teachers who bring them.",
  prize: `${PRIZE_POOL} in prizes. 1st place takes home a ${GRAND_PRIZE_ITEM}.`,
} as const;

// ── Pick your path (inside At a glance) ───────
// Two routes. Students and teachers share one: they fill in the same form,
// so the band shows it once and says the rule in a line.
export const PATHS = {
  label: "Pick your path",
  routes: {
    register: {
      label: "Students & teachers",
      line: "One form for everyone.",
      cta: CTA.register,
    },
    partners: { label: "Partners", line: "Back TDSB students in design", cta: CTA.partner },
  },
} as const;

/** One stop on The day's timeline. */
export interface DayStep {
  time: string;
  title: string;
  /** A few words under the title. */
  note?: string;
  /** Add the venue map link. */
  map?: boolean;
}

// ── Headings, in page order ───────────────────
// `outline` is the substring set in wire (outlined) type.
export const SECTIONS = {
  glance: {
    eyebrow: "01 · At a glance",
    lines: ["The theme stays secret", `until ${EVENT_MONTH_DAY}.`],
    outline: `until ${EVENT_MONTH_DAY}.`,
    body: "One theme, revealed on the day. Build it in any 3D software.",
    // The four-cell spec strip: values only (Where keeps its map link).
    spec: {
      when: { label: "When", value: `${EVENT_WEEKDAY.slice(0, 3)}, ${EVENT_MONTH_DAY.replace("November", "Nov")} · ${HOUR(TIMES.start)} start` },
      where: { label: "Where", value: VENUE_BUILDING },
      who: { label: "Who", value: `TDSB, grades ${GRADES}` },
      cost: { label: "Cost", value: "Free" },
    },
    // Accessible name for the Where cell's map link (visible text is CTA.map).
    mapLabel: `${CTA.map}: ${VENUE_BUILDING}, ${VENUE_STREET} (opens in a new tab)`,
    // The launch clock (also shown on /partner).
    countdown: {
      aria: "Countdown to event day",
      units: { days: "Days", hours: "Hrs", mins: "Min", secs: "Sec" },
      until: "Until we start",
      done: "We've started.",
      tba: ["Date drops", "soon."],
    },
  },
  prizes: {
    eyebrow: "02 · Prizes",
    lines: [PRIZE_POOL, "in prizes."],
    outline: "in prizes.",
    firstPlace: {
      label: "1st place",
      value: GRAND_PRIZE_VALUE,
      item: GRAND_PRIZE_ITEM,
      detail: "Plus 6 spools of filament",
    },
    // The one dimension on the printer drawing (from xl only).
    callouts: ["1st place"],
    figureAlt: "Line drawing of a desktop 3D printer laying down its first layer",
    groups: {
      extras: "Also up for grabs",
      everyBuilder: "Every builder gets",
      floor: "On the floor",
    },
  },
  sponsors: {
    eyebrow: "03 · Sponsors",
    lines: ["Our sponsors."],
    outline: "sponsors.",
    slot: { kicker: "Your logo here", cta: CTA.partner },
  },
  day: {
    eyebrow: "04 · The day",
    lines: ["November 16.", "One day to build."],
    outline: "One day to build.",
    bring: {
      title: "Bring",
      items: ["Laptop", "Charger", "3D software"],
    },
    /** Tag over the timeline: these are working times (registrants get the final schedule). */
    timesTag: "Working times",
    // The one label on the scroll drawing of the cup (decorative, aria-hidden).
    figure: { theme: "Theme" },
    // Five stops, one per stage of the cup drawing. A kicker and a short
    // title each; at most a few words more. No sentences.
    steps: [
      {
        time: `${EVENT_WEEKDAY.slice(0, 3)}, ${EVENT_MONTH_DAY.replace("November", "Nov")}`,
        title: VENUE_BUILDING,
        note: VENUE_INSTITUTION,
        map: true,
      },
      { time: TIMES.start, title: "Start and theme" },
      { time: `${TIMES.sprint} to ${TIMES.sprintEnd}`, title: "Design sprint" },
      { time: TIMES.judging, title: "Judging" },
      { time: TIMES.awards, title: "Awards", note: `Done by ${TIMES.end}` },
    ] as readonly DayStep[],
  },
  faq: {
    eyebrow: "05 · FAQ",
    lines: ["Questions?", "Answered."],
    outline: "Answered.",
    filters: { all: "All", students: "Students", teachers: "Teachers" },
    /** Accessible name of the filter chip group. */
    filterLabel: "Show questions for",
    more: {
      title: "More questions?",
      body: "Email us.",
      cta: CTA.ask,
      subject: "Mac Design Cup question",
    },
  },
  register: {
    pill: "Registration open · Limited spots",
    lines: ["Build the", "Impossible."],
    /** The mono line under the button, joined with " · ". */
    meta: [EVENT_DATE_SHORT, `${HOUR(TIMES.start)} start`, `${VENUE_BUILDING}, ${VENUE_CITY}`],
  },
} as const;

// ── FAQ ───────────────────────────────────────
// Answer first, then detail. Each answer must stand alone if quoted.
// The JSON-LD FAQPage reads these exact strings; never paraphrase one there.
export type FaqAudience = "students" | "teachers" | "everyone";
export interface Faq {
  q: string;
  a: string;
  for: FaqAudience;
  /** Render a map link after the answer. */
  map?: boolean;
}

const list = (items: readonly string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const FAQS: Faq[] = [
  {
    for: "everyone",
    q: "What is the Mackenzie Design Cup?",
    a: `The Mackenzie Design Cup is a one-day 3D design competition for TDSB high school students in grades ${GRADES}, on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_NAME}, in ${VENUE_CITY}. We're the ${CLUB} at ${CLUB_SCHOOL}, and we run it.`,
  },
  {
    for: "everyone",
    q: "Who can enter?",
    a: `Any Toronto District School Board (TDSB) high school student in grades ${GRADES} can enter the Mackenzie Design Cup. You don't need to be in a design club or have competed before. You do need a teacher from your school to come with you on the day.`,
  },
  {
    for: "everyone",
    q: "What does it cost?",
    a: "The Mackenzie Design Cup is free to enter for TDSB students.",
  },
  {
    for: "students",
    q: "Can I register myself?",
    a: "Yes. Pick Student on the registration form and fill in your details. It asks for the name and email of the teacher from your school who will come with you, so talk to them before you sign up.",
  },
  {
    for: "teachers",
    q: "How do I register my students?",
    a: `Pick Teacher on the registration form at ${SITE_HOST}${REGISTER_PATH}, and one form covers your whole group. It asks for your school, how many students you're bringing, and their names and grades; student emails are optional.`,
  },
  {
    for: "everyone",
    q: "Do students need a teacher with them?",
    a: "Yes. Every student at the Mackenzie Design Cup needs a teacher from their own school with them on the day.",
  },
  {
    for: "everyone",
    q: "When is it?",
    a: `The Mackenzie Design Cup is on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_BUILDING}. We start at ${TIMES.start} and the whole competition runs in one day.`,
  },
  {
    for: "everyone",
    q: "Where is it?",
    a: `The Mackenzie Design Cup is at ${VENUE_BUILDING}, ${VENUE_ADDRESS}, on ${VENUE_INSTITUTION}'s ${VENUE_CAMPUS}. Before the day, we email directions to everyone who registers.`,
    map: true,
  },
  {
    for: "teachers",
    q: "What time does the day end?",
    a: `The Mackenzie Design Cup ends at ${TIMES.end} on our working schedule, after the closing ceremony and awards from ${TIMES.awards}. Everyone who registers gets the final schedule before ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}.`,
  },
  {
    for: "students",
    q: "What can I win?",
    a: `First place at the Mackenzie Design Cup takes home a ${GRAND_PRIZE_ITEM} valued at ${GRAND_PRIZE_VALUE}, plus ${GRAND_PRIZE_EXTRA} to keep it running, from ${GRAND_PRIZE_FROM}. That tops a ${PRIZE_POOL} prize table that also has ${list(
      PRIZE_EXTRAS.filter((p) => p.from !== "Ansys").map((p) =>
        p.from === "Stratasys" ? `${p.item} from Stratasys` : p.item,
      ),
    )} up for grabs. Builders also get ${list([
      "50 seats of Ansys Discovery / Mechanical",
      ...EVERY_BUILDER.map((p) =>
        p.from === "Siemens & TriMech"
          ? `${p.item} from Siemens and TriMech`
          : p.item.replace(/^Your /, "their ").replace(/^\w/, (c) => c.toLowerCase()),
      ),
    ])}.`,
  },
  {
    for: "students",
    q: "Do I need to know 3D software?",
    a: "You should have some 3D design knowledge: enough to open a tool and model a simple object. Beyond that, you're free to use any software you want. Blender, Fusion 360, Onshape, Tinkercad, Maya: if you can build in it, you can compete in it.",
  },
  {
    for: "everyone",
    q: "Can students compete in teams?",
    a: "Solo entry is set for the Mackenzie Design Cup. We haven't decided yet whether teams also run this year, and we email the team rules to everyone who registers once we decide.",
  },
  {
    for: "students",
    q: "What will I build?",
    a: "You get the Mackenzie Design Cup's theme on the morning of the event and design a 3D response to it, start to finish: concept, blockout, model, final render. What it becomes is your call: a product, a space, a creature, a machine.",
  },
  {
    for: "everyone",
    q: "What do students need to bring?",
    a: "Every student at the Mackenzie Design Cup brings a laptop, its charger and the 3D software they build fastest in, already installed.",
  },
  {
    for: "everyone",
    q: "Is food provided for students?",
    a: `Yes. Every student competing gets food all day at ${VENUE_BUILDING}, from ${VENUE_INSTITUTION}.`,
  },
  {
    for: "everyone",
    q: "How do I contact the organizers?",
    a: `Email the ${CLUB} at ${CONTACT_EMAIL}. We're the student club at ${CLUB_SCHOOL} that runs the Mackenzie Design Cup, and we read everything.`,
  },
];

// ── /register ────────────────────────────────
export const REGISTER_PAGE = {
  eyebrow: "Registration",
  h1: ["Claim", "your spot."],
  outline: "spot.",
  /** What, when and where, for a forwarded link and for search. */
  intro: `Register for the ${EVENT_FULL} on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_NAME}.`,
  faqLead: "Questions first?",
  faqLink: "Read the FAQ",
  /** The one line over the form. */
  oneForm: "Students and teachers use the same form.",
  fallbackLead: "Form not loading?",
  fallbackLink: "Open it in a new tab",
  back: "Back to the hall",
  plate: "Registration form",
  loading: "Loading the form",
  /** The iframe's accessible name. */
  formTitle: "Mackenzie Design Cup registration form",
} as const;

// ── Site chrome ──────────────────────────────
export const NAV = {
  partner: "Partner",
  menu: "Menu",
  close: "Close",
  /** The short wordmark beside the lion. */
  mark: "MDC",
  skip: "Skip to content",
  /** Accessible name of the nav landmark. */
  label: "Main",
  /** Screen-reader note on links that open a new tab. */
  newTab: "(opens in a new tab)",
  /** Landmark name of the phone sticky Register bar. */
  registerBar: "Registration",
} as const;

export const FOOTER = {
  descriptor: `Run by the ${CLUB} at William Lyon Mackenzie CI.`,
  labels: { where: "Where", when: "When", contact: "Contact", sections: "On this site" },
  addressLines: [VENUE_BUILDING, VENUE_INSTITUTION, VENUE_STREET, `${VENUE_CITY}, ${VENUE_REGION} ${VENUE_POSTAL}`],
  when: `${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL} · Starts ${TIMES.start}`,
  backToTop: "Back to top",
  copyright: "© 2026 Mac Design Cup",
} as const;

export const NOT_FOUND = {
  eyebrow: "wrong sheet",
  line: "This sheet isn't in the drawing set.",
  /** Heading over the list of pages that do exist. */
  index: "Sheets in the set",
  links: { home: "Home", register: "Registration", faq: "FAQ", partner: "Partner with us" },
  /** Dimension label under the 404 plate; the page adds " / 05" (the sheet count). */
  sheet: "Sheet 404",
} as const;

// ── Breadcrumbs (/register, /partner, /partner/register) ──
// The BreadcrumbList JSON-LD reads these same strings (CRUMB_LABELS in src/seo/routes.ts).
export const BREADCRUMBS = {
  /** aria-label of the breadcrumb <nav>. */
  label: "Breadcrumb",
  home: "Home",
  register: "Registration",
  partner: "Partner",
  partnerRegister: "Registration",
} as const;
