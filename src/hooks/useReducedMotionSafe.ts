import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Hydration-safe `prefers-reduced-motion`. framer's `useReducedMotion()` reads
 * `matchMedia` during the very first client render, so using it to change
 * markup makes the first client render differ from the server render. This
 * returns `false` on the server and the first client render, then the
 * visitor's real preference after mount, and follows the OS setting live.
 *
 * Use it to pick *behaviour* (skip an animation, stop a loop, jump to a final
 * state after mount). Markup that must look different for reduced-motion
 * visitors from the first paint belongs in CSS (`motion-reduce:` variants).
 *
 * @example
 * const reduced = useReducedMotionSafe();
 * useEffect(() => { if (!reduced) return startIdleLoop(); }, [reduced]);
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export default useReducedMotionSafe;
