import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

// Porcelain lion head from the club's 3D render: the site-wide brand mark.
// First paint is a 7.5 KB still (192px, the front pose). The one ~3.2s "nod"
// (33 frames, 128px, ~110 KB, plays once and settles on the same front pose,
// which keeps it inside WCAG 2.2.2 without a pause control) is fetched only
// after the page has loaded and gone idle. The 192px PNG
// (/lion/lion-mark.png) stays for the JSON-LD logo, the web manifest and the
// OG card; nothing here uses it. Encoded from the old 192px nod (kept out of
// the deploy as lion3d/lion-mark-source.webp) with Pillow: still q80, nod
// q60 / alpha q40, loop 1.
const STILL_SRC = "/lion/lion-still.webp";
const NOD_SRC = "/lion/lion-nod.webp";

interface LionMarkProps {
  className?: string;
  /** Decorative by default: set alt text only when the mark stands alone. */
  alt?: string;
  /** `false` always shows the still frame, even for motion-tolerant visitors
   *  (e.g. below the fold, where the nod would play unseen). */
  animated?: boolean;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * The lion mark. The server and the first client render are identical (the
 * still), so hydration is safe. After mount, for visitors who allow motion,
 * the nod is fetched when the browser is idle (Safari has no
 * requestIdleCallback: a timeout stands in) and swapped in once it has
 * loaded, so the still never blinks out. The nod starts on the pose the still
 * shows, so the swap does not jump.
 */
export default function LionMark({ className, alt = "", animated = true }: LionMarkProps) {
  const [src, setSrc] = useState(STILL_SRC);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (!animated || reduced) return;
    const w = window as IdleWindow;
    let done = false;
    let preload: HTMLImageElement | null = null;
    const start = () => {
      // Re-check: the reduced-motion answer arrives one render after mount.
      if (done || w.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      preload = new Image();
      preload.onload = () => {
        if (!done) setSrc(NOD_SRC);
      };
      preload.src = NOD_SRC;
    };
    let cancel: () => void;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 3000 });
      cancel = () => w.cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(start, 1500);
      cancel = () => window.clearTimeout(id);
    }
    return () => {
      done = true;
      cancel();
      if (preload) preload.onload = null;
    };
  }, [animated, reduced]);

  return (
    <img
      src={src}
      alt={alt}
      width={192}
      height={192}
      draggable={false}
      decoding="async"
      className={cn("select-none", className)}
    />
  );
}
