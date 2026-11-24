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
// 5. The CTA string is verbatim, everywhere: CTA.submit (registration closed
//    Nov 9, so the site's one call to action is now Submit here).
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
import { SPONSORS } from "@/config/sponsors";
import {
  GALLERY_OPEN,
  GALLERY_PATH,
  RECAP,
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
  REGISTRATION_CLOSES_LABEL,
  RESOURCE_GUIDES,
  RESOURCES_PATH,
  RUNNER_UP_PRIZE,
  SITE_HOST,
  SUBMIT_DEADLINE_SHORT,
  SUBMIT_URL_SHORT,
  TEAM_MAX,
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
  WLMAC_TEACHER,
} from "@/config/site";

/** "9:00 AM" -> "9 AM" (on-the-hour times in tight spots). */
const HOUR = (t: string) => t.replace(":00 ", " ");

/** The only wording any Submit or Register button or link uses. */
export const CTA = {
  /** The day's one call to action: to /submit. */
  submit: "Submit here",
  /** The same button once submissions close: the gallery (GALLERY_OPEN), else /submit's room and time board. */
  slots: GALLERY_OPEN ? "See the submissions" : "Time slots here",
  /** Plain links to /register (registration closed Nov 9; the page stays). */
  registration: "Registration",
  enter: "Enter the hall",
  /** What the hero's lit door says on its face (its accessible name is `enter`). */
  door: "Enter",
  partner: "Partner with us",
  ask: "Ask us",
  map: "Map",
} as const;

/**
 * Submitting on the day (organizers, 2026-11-14): at /submit, closing at
 * TIMES.submit, no late entries. The tiny note beside every Submit here
 * button; `sr` is the button's screen-reader description.
 */
export const SUBMIT = {
  note: `Closes ${TIMES.submit} · No late entries`,
  /** Beside the button once submissions close. */
  closedNote: GALLERY_OPEN ? "Every 2026 design and the winners" : "Submissions closed · Find your room and time",
  /** The screen-reader description once submissions close. */
  closedSr: GALLERY_OPEN ? "Every design from the Mackenzie Design Cup 2026, and the winners." : "Submissions are closed. Find your room and time.",
  sr: `Submit your design at ${SUBMIT_URL_SHORT}. Submissions close ${SUBMIT_DEADLINE_SHORT}. No late entries.`,
  /** The line under the QR code. */
  scan: "Scan to submit",
  qrAlt: `QR code for ${SUBMIT_URL_SHORT}`,
  url: SUBMIT_URL_SHORT,
} as const;

// ── Hero (the 3D hall) ────────────────────────
export const HERO = {
  eyebrow: `${EVENT_DATE_SHORT} · ${VENUE_BUILDING}, ${VENUE_CITY}`,
  h1: ["Mackenzie", "Design Cup"],
  /** One line: the pool (set in ember), then the rest. */
  prize: { pool: PRIZE_POOL, rest: `in prizes · ${RECAP.students} students · ${RECAP.designs} designs` },
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
  /** Accessible name of the two-route nav (not shown). */
  label: "See the designs or partner",
  routes: {
    submit: {
      label: "Competitors",
      line: `Submit your design by ${TIMES.submit} on the day. No late entries.`,
      cta: CTA.submit,
    },
    partners: { label: "Partners", line: "Back the next one", cta: CTA.partner },
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
// Short and factual: a heading names the section, the line under it says the fact.
export const SECTIONS = {
  glance: {
    lines: ["How it went"],
    body: `On ${EVENT_WEEKDAY}, ${EVENT_MONTH_DAY}, ${RECAP.students} TDSB students modelled ${RECAP.designs} designs in a single day, to a theme they first heard that morning, backed by ${SPONSORS.length} sponsors and partners. Photos and video from the day are coming soon.`,
    // The four-cell spec strip: values only (Where keeps its map link).
    spec: {
      when: { label: "When", value: `${EVENT_WEEKDAY.slice(0, 3)}, ${EVENT_MONTH_DAY.replace("November", "Nov")}, 2026` },
      where: { label: "Where", value: VENUE_BUILDING },
      who: { label: "Students", value: `${RECAP.students} · grades ${GRADES}` },
      cost: { label: "Designs", value: `${RECAP.designs}, made in one day` },
    },
    // Accessible name for the Where cell's map link (visible text is CTA.map).
    mapLabel: `${CTA.map}: ${VENUE_BUILDING}, ${VENUE_STREET} (opens in a new tab)`,
    // The clock counts down to the submission deadline (SUBMIT_DEADLINE).
    countdown: {
      aria: "Countdown to the submission deadline",
      units: { days: "Days", hours: "Hrs", mins: "Min", secs: "Sec" },
      until: "Submissions close in",
      when: SUBMIT_DEADLINE_SHORT,
      done: GALLERY_OPEN ? "The designs are in." : "Submissions are closed.",
      doneWhen: GALLERY_OPEN ? "Every design is up, winners first." : `Closed ${SUBMIT_DEADLINE_SHORT}`,
    },
  },
  prizes: {
    lines: [PRIZE_POOL, "in prizes"],
    firstPlace: {
      label: "1st place",
      value: GRAND_PRIZE_VALUE,
      item: GRAND_PRIZE_ITEM,
      detail: "Plus 6 spools of filament",
    },
    runnersUp: { label: "2nd and 3rd place", item: RUNNER_UP_PRIZE },
    figureAlt: "Line drawing of a desktop 3D printer laying down its first layer",
    groups: {
      extras: "Also on the prize table",
      everyBuilder: "Every builder got",
      floor: "On the floor",
    },
  },
  sponsors: {
    lines: ["Sponsors"],
    slot: { kicker: "Your logo here next time", cta: CTA.partner },
  },
  day: {
    lines: ["The day"],
    bring: {
      title: "Everyone brought",
      items: ["Their own laptop", "A charger", "Their 3D software"],
      /** Under the list. */
      note: "No Chromebooks: everyone modelled and presented on their own laptop, plugged in over HDMI or USB-C.",
      guides: "Study guides",
    },
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
      { time: TIMES.start, title: "Check-in and opening", note: `Theme revealed at the ${TIMES.opening} opening` },
      { time: TIMES.design, title: "Design sprint", note: "Lunch at noon" },
      { time: TIMES.submit, title: "Submissions, then judging", note: `Teams presented to their judges from ${TIMES.judging}` },
      { time: TIMES.closing, title: "Closing and awards", note: "Top five announced" },
    ] as readonly DayStep[],
  },
  // From the organizers' notes (2026-10-22: teams of 1 to 4, solo recommended,
  // AI allowed but kept to a minimum, worded vaguely on purpose). Approved by
  // the club 2026-10-25.
  rules: {
    lines: ["Rules"],
    body: "What every team built to on the day.",
    items: [
      {
        title: `Teams of 1 to ${TEAM_MAX}`,
        body: "Teams were optional, and we recommended going solo: one 3D model is hard to split between people. Every team member registered on their own.",
      },
      {
        title: "Bring a teacher",
        body: "Every student came with a teacher from their own school.",
      },
      {
        title: "Build it on the day",
        body: "Everything submitted was modelled at the event, after the theme reveal at the opening ceremony. No models made before the day.",
      },
      {
        title: "Any 3D software",
        body: "Blender, Fusion 360, Onshape, Tinkercad, Maya: whatever each student built fastest in.",
      },
      {
        title: "Assistive tooling",
        body: "Permitted at each student's discretion, with minimal reliance encouraged and original authorship expected.",
      },
      {
        title: "Submit before judging",
        body: "Every design was submitted online before judging began. No late submissions.",
      },
    ],
  },
  faq: {
    lines: ["FAQ"],
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
  // The closer (#register). Registration closed Nov 9, so it now points at
  // the day's one action: submitting.
  register: {
    lines: ["See the designs"],
    /** The line under the heading. */
    status: `All ${RECAP.designs} designs are up, winners first. We'd love to run it again; nothing is confirmed for next year yet, so email us to hear first.`,
    /** The mono line under the button, joined with " · ". */
    meta: [EVENT_DATE_SHORT, `${VENUE_BUILDING}, ${VENUE_CITY}`, CONTACT_EMAIL],
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
    a: `The Mackenzie Design Cup is a one-day 3D design competition for TDSB high school students in grades ${GRADES}. This year's ran on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_NAME}, in ${VENUE_CITY}. We're the ${CLUB} at ${CLUB_SCHOOL}, and we run it.`,
  },
  {
    for: "everyone",
    q: "How did it go?",
    a: `${RECAP.students} students modelled ${RECAP.designs} designs in a single day, to a theme revealed at the opening ceremony that morning. Each team presented to a pair of judges, and the top five were announced at the closing ceremony.`,
  },
  {
    for: "everyone",
    q: "Who won?",
    a: `First place went to Prosthetic Eye, second to I.M. Maddy (Intuitive Medicine), third to Automatic Food Maker, fourth to Trialcore (survival kit) and fifth to Skintifity. Every design, winners first, is at ${SITE_HOST}${GALLERY_PATH}.`,
  },
  {
    for: "everyone",
    q: "Where can I see the designs?",
    a: `All ${RECAP.designs} designs are at ${SITE_HOST}${GALLERY_PATH}. Open one to see the team's pictures and turn their 3D model around.`,
  },
  {
    for: "students",
    q: "I placed. When do I get my prize?",
    a: `Prizes are on their way, and we'll be in touch with winners by email. If you placed and haven't heard from us in 1 to 2 weeks, email ${CONTACT_EMAIL}.`,
  },
  {
    for: "everyone",
    q: "When will photos and video be posted?",
    a: "Soon. Our photographers are sorting through them so that only people who gave media consent appear.",
  },
  {
    for: "everyone",
    q: "Will there be another Mackenzie Design Cup?",
    a: `We'd love to run it again. Nothing is confirmed for next year yet. Email ${CONTACT_EMAIL} to hear first, or to back the next one as a sponsor, judge or mentor.`,
  },
  {
    for: "students",
    q: "What software did students use?",
    a: "Onshape was the most common, then Tinkercad, Blender and Fusion 360. Any 3D software was allowed.",
  },
  {
    for: "teachers",
    q: "Who could enter?",
    a: `Any TDSB high school student in grades ${GRADES}, with a teacher from their own school there on the day. Entry was free, and students competed solo or in teams of up to ${TEAM_MAX}.`,
  },
  {
    for: "students",
    q: "How can I prepare for next time?",
    a: `Our free study guides are at ${SITE_HOST}${RESOURCES_PATH}: one each for ${list(RESOURCE_GUIDES.map((g) => g.software))}, written by the ${CLUB}.`,
  },
  {
    for: "everyone",
    q: "How do I contact the organizers?",
    a: `Email the ${CLUB} at ${CONTACT_EMAIL}. We're the student club at ${CLUB_SCHOOL} that runs the Mackenzie Design Cup, and we read everything.`,
  },
];

// ── /register ────────────────────────────────
export const REGISTER_PAGE = {
  h1: ["Register"],
  /** What, when and where, for a forwarded link and for search. */
  intro: `Register for the ${EVENT_FULL} on ${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}, at ${VENUE_NAME}.`,
  /** The deadline line, under the intro. */
  closes: `Registration closes ${REGISTRATION_CLOSES_LABEL}.`,
  /** What the student form's teacher field means. */
  teacher: `Students: the teacher on the form comes with you on the day. WLMAC students, put ${WLMAC_TEACHER}. Other schools, put a teacher you think would come; if you're not sure, we can contact them after you sign up.`,
  faqLead: "Questions first?",
  faqLink: "Read the FAQ",
  rulesLink: "Rules",
  /** The one line over the form. */
  oneForm: "Students and teachers use the same form.",
  fallbackLead: "Form not loading?",
  fallbackLink: "Open it in a new tab",
  back: "Back to the hall",
  /** The form's heading (screen readers; the page heading says it). */
  plate: "Registration form",
  loading: "Loading the form",
  /** The iframe's accessible name. */
  formTitle: "Mackenzie Design Cup registration form",
} as const;

// ── Site chrome ──────────────────────────────
export const NAV = {
  partner: "Partner",
  resources: "Resources",
  menu: "Menu",
  close: "Close",
  /** The short wordmark beside the lion. */
  mark: "MDC",
  skip: "Skip to content",
  /** Accessible name of the nav landmark. */
  label: "Main",
  /** Screen-reader note on links that open a new tab. */
  newTab: "(opens in a new tab)",
  /** Landmark name of the phone sticky Submit bar. */
  submitBar: "Submit",
} as const;

export const FOOTER = {
  descriptor: `Run by the ${CLUB} at William Lyon Mackenzie CI.`,
  labels: { where: "Where", when: "When", contact: "Contact", sections: "On this site" },
  addressLines: [VENUE_BUILDING, VENUE_INSTITUTION, VENUE_STREET, `${VENUE_CITY}, ${VENUE_REGION} ${VENUE_POSTAL}`],
  when: `${EVENT_WEEKDAY}, ${EVENT_DATE_LABEL}`,
  backToTop: "Back to top",
  copyright: "© 2026 Mac Design Cup",
} as const;

export const NOT_FOUND = {
  title: "Page not found",
  line: "This page doesn't exist. Try one of these instead.",
  /** Accessible name of the list of pages that do exist. */
  index: "Pages",
  links: { home: "Home", register: "Registration", resources: "Resources", faq: "FAQ", partner: "Partner with us" },
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
  resources: "Resources",
} as const;

// ── /resources ───────────────────────────────
export const RESOURCES_PAGE = {
  h1: ["Resources"],
  intro: "Free study guides from our club. Pick the program you'll build in.",
  pages: "pages",
  open: "Open guide",
  folder: "All guides",
  other: "Using something else? Any 3D software is allowed.",
  rulesLink: "Read the rules",
} as const;
