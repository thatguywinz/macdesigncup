// Marks a judge changed but hasn't saved yet. Kept per judge and per entry on
// this device (sessionStorage), so moving between entries or a refresh doesn't
// lose them, and the next judge on a shared laptop never inherits them. Every
// way off an entry page with unsaved marks asks first, and the list flags
// entries that have unsaved marks.

export interface Draft {
  marks: Record<string, number>;
  notes: string;
}

const PREFIX = "mdc-marks-";
const keyOf = (judge: string, id: string) => `${PREFIX}${judge.trim().toLowerCase()}::${id}`;

export function readDraft(judge: string, id: string): Draft | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(keyOf(judge, id)) ?? "null");
    return v && typeof v === "object" && v.marks ? v : null;
  } catch {
    return null;
  }
}

export function writeDraft(judge: string, id: string, v: Draft | null) {
  try {
    if (v) sessionStorage.setItem(keyOf(judge, id), JSON.stringify(v));
    else sessionStorage.removeItem(keyOf(judge, id));
  } catch {
    /* storage blocked: marks still save normally */
  }
}

export function hasDraft(judge: string, id: string): boolean {
  return readDraft(judge, id) !== null;
}

// Whether the entry page on screen has marks not saved yet.
let unsavedNow = false;
export function setUnsavedNow(v: boolean) {
  unsavedNow = v;
}

const LEAVE_MSG = "Your marks for this team aren't saved yet. Leave without saving? (They stay on this device until you save.)";

/** For anything that leaves the entry page: false (and the event cancelled) if the judge chooses to stay. */
export function guardLeave(e?: { preventDefault: () => void }): boolean {
  if (!unsavedNow || window.confirm(LEAVE_MSG)) return true;
  e?.preventDefault();
  return false;
}
