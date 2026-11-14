// ─────────────────────────────────────────────
// Submission portal · the judging rubric, from the organizers' "MDC Judging
// Rubric": four categories, each out of 25, total out of 100. Each category
// has four levels with a point range; a judge picks the level that fits, then
// the exact points inside it.
//
// The level descriptions are the rubric's general wording. The theme-specific
// version is revealed at the opening ceremony, so it must not be in this file:
// the site's code is public.
// ─────────────────────────────────────────────

export interface Level {
  min: number;
  max: number;
  text: string;
}

export interface Criterion {
  id: string;
  label: string;
  /** What a judge is looking for, in one line. */
  hint: string;
  levels: readonly [Level, Level, Level, Level];
}

const RANGES = [
  [0, 6],
  [7, 12],
  [13, 19],
  [20, 25],
] as const;

const levels = (texts: [string, string, string, string]) =>
  texts.map((text, i) => ({ min: RANGES[i][0], max: RANGES[i][1], text })) as unknown as Criterion["levels"];

export const CRITERIA: readonly Criterion[] = [
  {
    id: "originality",
    label: "Innovation & Originality",
    hint: "Is the idea new, or a familiar one with a twist?",
    levels: levels([
      "Direct copy or heavily derived from an existing real-world or well-known concept, with no unique twist.",
      "Overly familiar design with only cosmetic or surface-level changes.",
      "Inventive spin on an established concept, with a clever, fresh take.",
      "Genuinely original, memorable idea. Form, function and details feel like one coherent vision.",
    ]),
  },
  {
    id: "technical",
    label: "Technicality",
    hint: "Modelling craft: proportions, topology, materials, detail.",
    levels: levels([
      "Major errors in proportions, topology or texturing. The model looks broken or structurally unconvincing.",
      "Basic grasp of modelling. Messy topology, pinching or distortion, default materials, or awkward proportions.",
      "Clean geometry and topology, effective materials, the right level of detail and correct scale.",
      "Exceptional craft: clean topology, convincing materials and fine detail.",
    ]),
  },
  {
    id: "theme",
    label: "Relevance to Theme",
    hint: "How central the theme is to the design.",
    levels: levels([
      "Doesn't clearly reflect the theme, or has little to no thematic quality.",
      "Relevant to the theme, but standard or surface-level, with a few thematic touches.",
      "Clearly aligned: the theme is the central focus of the design.",
      "Form, materials and details fit seamlessly into the theme and the concept.",
    ]),
  },
  {
    id: "communication",
    label: "Communication & Presentation",
    hint: "The pitch and the submission: clear, organized, easy to follow.",
    levels: levels([
      "No description. Layout is messy or hard to follow.",
      "Short description. Visuals are disorganized or low resolution.",
      "Clear description and organized layout. Easy to understand the intent.",
      "Compelling story and a professional layout that guides the eye through the design process.",
    ]),
  },
];

export const MARK_MIN = 0;
export const MARK_MAX = 25;
export const MAX_TOTAL = CRITERIA.length * MARK_MAX;

/**
 * Marks an entry needs: its judging pair's two (organizers, 2026-11-14). Once
 * it has them it's done and nobody else is sent to it; its result is the
 * average of its marks.
 */
export const MARKS_NEEDED = 2;

/** The leaderboard the organizers' final meeting looks at. */
export const TOP_COUNT = 5;

/** The level (0 to 3) a mark falls in. */
export const levelOf = (v: number) => RANGES.findIndex(([lo, hi]) => v >= lo && v <= hi);

/** A score's total, or null when any criterion is still unmarked. */
export function totalOf(marks: Record<string, number> | undefined | null): number | null {
  if (!marks) return null;
  let sum = 0;
  for (const c of CRITERIA) {
    const v = marks[c.id];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    sum += v;
  }
  return sum;
}

/** Keeps only known criteria, each a whole number clamped to 0..25. */
export function cleanMarks(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const c of CRITERIA) {
    const r = (raw as Record<string, unknown>)[c.id];
    if (r === null || r === undefined || r === "") continue;
    const v = Number(r);
    if (Number.isFinite(v)) out[c.id] = Math.min(MARK_MAX, Math.max(MARK_MIN, Math.round(v)));
  }
  return out;
}

/** Award labels an organizer can pin to an entry. */
export const AWARDS = ["", "1st place", "2nd place", "3rd place", "Honourable mention", "Judges' pick"] as const;
