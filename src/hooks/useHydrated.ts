import { useEffect, useState } from "react";

/**
 * `false` on the server and on the first client render, `true` once the
 * component has mounted. Gate anything that must differ between the
 * prerendered HTML and the live page (media queries, dates, storage) behind
 * it, so the first client render always matches the server render.
 *
 * @example
 * const hydrated = useHydrated();
 * return <span>{hydrated ? formatLocalTime(now) : "--:--"}</span>;
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export default useHydrated;
