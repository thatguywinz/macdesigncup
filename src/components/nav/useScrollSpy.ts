import { useEffect, useState } from "react";

/**
 * Which of the given sections is "where you are": the one crossing a thin
 * reading line 40% down the viewport (just under the fixed nav once a
 * section link has scrolled its heading into place). `null` while the line
 * sits on a section that isn't listed (the hero, the final CTA).
 *
 * One IntersectionObserver, no scroll listener; state changes only when the
 * answer changes. Server and first client render: `null`. Pass
 * `enabled = false` on routes that don't have these sections.
 *
 * @example
 * const active = useScrollSpy(["glance", "prizes", "sponsors", "faq"], isHome);
 */
export function useScrollSpy(ids: readonly string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(" ");

  useEffect(() => {
    const list = key.split(" ");
    if (!enabled || typeof IntersectionObserver === "undefined") {
      setActive(null);
      return;
    }
    const els = list
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const crossing = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        setActive(list.find((id) => crossing.has(id)) ?? null);
      },
      // A 1%-tall band at 40% of the viewport height.
      { rootMargin: "-40% 0px -59% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key, enabled]);

  return active;
}

export default useScrollSpy;
