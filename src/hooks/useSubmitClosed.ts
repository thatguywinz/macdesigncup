import { useEffect, useState } from "react";
import { SUBMIT_DEADLINE } from "@/config/site";

const DEADLINE = new Date(SUBMIT_DEADLINE).getTime();
/** setTimeout's ceiling (~24.8 days); anything longer is re-armed. */
const MAX_DELAY = 2_147_483_647;

/**
 * `true` once SUBMIT_DEADLINE has passed. `false` on the server and the
 * first client render (so hydration always matches), then flips by itself
 * at the deadline with one timer: no per-second re-render.
 *
 * @example
 * const closed = useSubmitClosed();
 */
export function useSubmitClosed(): boolean {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      const left = DEADLINE - Date.now();
      if (left <= 0) {
        setClosed(true);
        return;
      }
      id = setTimeout(arm, Math.min(left, MAX_DELAY));
    };
    arm();
    return () => clearTimeout(id);
  }, []);
  return closed;
}

export default useSubmitClosed;
