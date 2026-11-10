// ─────────────────────────────────────────────
// Submission portal · the judging rubric. Each criterion is marked 1 to 10;
// an entry's score is the sum of its criteria, averaged over the judges who
// marked it.
//
// TODO(organizers): these four criteria and their equal weights are a starting
// point, not an announced rubric. Confirm or change them before Nov 16; the
// dashboard, the results table and the CSV all read this one list.
// ─────────────────────────────────────────────

export interface Criterion {
  id: string;
  label: string;
  /** What a judge is looking for, in one line. */
  hint: string;
}

export const CRITERIA: readonly Criterion[] = [
  { id: "theme", label: "Theme", hint: "How directly and cleverly the design answers the theme." },
  { id: "creativity", label: "Creativity", hint: "Originality of the idea and of the form." },
  { id: "technical", label: "Technical skill", hint: "Modelling quality: clean geometry, detail, buildability." },
  { id: "presentation", label: "Presentation", hint: "How well the team explains and shows their design." },
];

export const MARK_MIN = 1;
export const MARK_MAX = 10;
export const MAX_TOTAL = CRITERIA.length * MARK_MAX;

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

/** Keeps only known criteria, each a whole number clamped to 1..10. */
export function cleanMarks(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const c of CRITERIA) {
    const v = Number((raw as Record<string, unknown>)[c.id]);
    if (Number.isFinite(v)) out[c.id] = Math.min(MARK_MAX, Math.max(MARK_MIN, Math.round(v)));
  }
  return out;
}

/** Award labels an organizer can pin to an entry. */
export const AWARDS = ["", "1st place", "2nd place", "3rd place", "Honourable mention", "Judges' pick"] as const;
