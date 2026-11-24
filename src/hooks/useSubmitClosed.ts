import { useEffect, useState } from "react";
import { GALLERY_OPEN, SUBMIT_DEADLINE } from "@/config/site";

/** setTimeout's ceiling (~24.8 days); anything longer is re-armed. */
const MAX_DELAY = 2_147_483_647;
/** How often the page asks the portal whether organizers closed early. */
const POLL_MS = 60_000;

// What the portal last said: its deadline (organizers can move it) and
// whether it was closed early. Shared by every button on the page.
interface PortalView {
  deadline: number;
  closedEarly: boolean;
}
let portal: PortalView = { deadline: new Date(SUBMIT_DEADLINE).getTime(), closedEarly: false };
const listeners = new Set<(v: PortalView) => void>();
let polling: ReturnType<typeof setInterval> | null = null;

async function ask() {
  try {
    const r = await fetch("/api/portal/status", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) return;
    const s = (await r.json()) as { open?: boolean; deadline?: string; now?: string };
    const deadline = Date.parse(s.deadline ?? "");
    if (typeof s.open !== "boolean" || Number.isNaN(deadline)) return;
    const now = Date.parse(s.now ?? "") || Date.now();
    portal = { deadline, closedEarly: !s.open && now < deadline };
    listeners.forEach((f) => f(portal));
  } catch {
    /* offline or no portal (local preview): keep the last answer and the clock */
  }
}

function subscribe(f: (v: PortalView) => void) {
  listeners.add(f);
  if (!polling) {
    void ask();
    polling = setInterval(ask, POLL_MS);
  }
  return () => {
    listeners.delete(f);
    if (!listeners.size && polling) {
      clearInterval(polling);
      polling = null;
    }
  };
}

/**
 * `true` once submissions are closed: the deadline has passed (the portal's,
 * which organizers can move; SUBMIT_DEADLINE until it answers), or organizers
 * closed early. `false` on the server and the first client render (so
 * hydration always matches), then flips by itself, even if the portal stops
 * answering. With GALLERY_OPEN (after the event) it is `true` everywhere,
 * server render included, and never asks the portal.
 *
 * @example
 * const closed = useSubmitClosed();
 */
export function useSubmitClosed(): boolean {
  const [view, setView] = useState<PortalView | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (GALLERY_OPEN) return;
    setView(portal);
    setNow(Date.now());
    return subscribe(setView);
  }, []);
  // One timer to the deadline: no per-second re-render.
  useEffect(() => {
    if (!view) return;
    const left = view.deadline - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), Math.min(left + 50, MAX_DELAY));
    return () => clearTimeout(id);
  }, [view, now]);
  if (GALLERY_OPEN) return true;
  if (!view) return false;
  return view.closedEarly || Math.max(now, Date.now()) >= view.deadline;
}

export default useSubmitClosed;
