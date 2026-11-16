import { useEffect, useState } from "react";
import { SUBMIT_DEADLINE } from "@/config/site";

const DEADLINE = new Date(SUBMIT_DEADLINE).getTime();
/** setTimeout's ceiling (~24.8 days); anything longer is re-armed. */
const MAX_DELAY = 2_147_483_647;
/** How often the page asks the portal whether organizers closed early. */
const POLL_MS = 60_000;

// One shared check for every button on the page: the portal's own answer
// (organizers can close submissions early, or move the deadline).
let portalClosed: boolean | null = null;
const listeners = new Set<(closed: boolean) => void>();
let polling: ReturnType<typeof setInterval> | null = null;

async function ask() {
  try {
    const r = await fetch("/api/portal/status", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) return;
    const s = (await r.json()) as { open?: boolean };
    if (typeof s.open !== "boolean") return;
    portalClosed = !s.open;
    listeners.forEach((f) => f(portalClosed as boolean));
  } catch {
    /* offline or no portal (local preview): the clock decides */
  }
}

function subscribe(f: (closed: boolean) => void) {
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
 * `true` once submissions are closed: SUBMIT_DEADLINE has passed, or the
 * portal says so (organizers closed early). `false` on the server and the
 * first client render (so hydration always matches), then flips by itself.
 *
 * @example
 * const closed = useSubmitClosed();
 */
export function useSubmitClosed(): boolean {
  const [byClock, setByClock] = useState(false);
  const [byPortal, setByPortal] = useState<boolean | null>(null);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      const left = DEADLINE - Date.now();
      if (left <= 0) {
        setByClock(true);
        return;
      }
      id = setTimeout(arm, Math.min(left, MAX_DELAY));
    };
    arm();
    if (portalClosed !== null) setByPortal(portalClosed);
    const off = subscribe(setByPortal);
    return () => {
      clearTimeout(id);
      off();
    };
  }, []);
  // The portal's answer wins once it has one (organizers may reopen too).
  return byPortal ?? byClock;
}

export default useSubmitClosed;
