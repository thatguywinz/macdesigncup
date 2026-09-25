import { FAQS, type Faq } from "@/content/copy";

// ─────────────────────────────────────────────
// FAQ list logic, kept pure so the server render and the first client
// render agree, and so it can be tested without a DOM.
// ─────────────────────────────────────────────

export type Filter = "all" | "students" | "teachers";
export const FILTERS: readonly Filter[] = ["all", "students", "teachers"];

/** Questions shown before "Show all": about one screen of rows on a laptop. */
export const FAQ_LIMIT = 8;

/**
 * Strings for the "show all" control.
 * TODO(copy): move into `SECTIONS.faq` in src/content/copy.ts (it was owned
 * by another agent when this landed). Same rules: no em dashes, en-CA.
 */
export const FAQ_MORE = {
  /** `{n}` is the number of questions under the current filter. */
  showAll: "Show all {n} questions",
  showFewer: "Show fewer",
} as const;

/** Items for everyone show under both audiences. */
export const shows = (faq: Faq, filter: Filter) =>
  filter === "all" || faq.for === "everyone" || faq.for === filter;

export const COUNTS: Record<Filter, number> = {
  all: FAQS.length,
  students: FAQS.filter((q) => shows(q, "students")).length,
  teachers: FAQS.filter((q) => shows(q, "teachers")).length,
};

/**
 * A stable anchor for a question, from its wording:
 * "What does it cost?" -> "faq-what-does-it-cost". Deep links and the
 * FAQPage JSON-LD can point at it.
 */
export const faqId = (q: string) =>
  `faq-${q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

/** 1-based position of a question under a filter, or 0 if filtered out. */
export function positionOf(faq: Faq, filter: Filter): number {
  if (!shows(faq, filter)) return 0;
  let n = 0;
  for (const item of FAQS) {
    if (shows(item, filter)) n += 1;
    if (item === faq) return n;
  }
  return 0;
}

/**
 * What to change so a question is on screen: keep the filter if the
 * question belongs to it (else fall back to All), and expand the list if it
 * sits past the limit there.
 */
export function revealState(faq: Faq, filter: Filter): { filter: Filter; expand: boolean } {
  const next: Filter = shows(faq, filter) ? filter : "all";
  return { filter: next, expand: positionOf(faq, next) > FAQ_LIMIT };
}
