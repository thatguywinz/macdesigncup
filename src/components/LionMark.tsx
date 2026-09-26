import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

// Porcelain lion head from the club's 3D render: the site-wide brand mark.
// First paint is a still of the front pose; the one ~3.2s "nod" (33 frames,
// plays once and settles on the same front pose, which keeps it inside WCAG
// 2.2.2 without a pause control) is fetched only after the page has loaded
// and gone idle. The mark shows at 36 to 40 css px, so each comes in two
// sizes and the browser picks by pixel density: 80px (2x, still ~2 KB, nod
// ~60 KB) and 128px (3x phones, still ~4 KB, nod ~110 KB). The 192px PNG
// (/lion/lion-mark.png) stays for the JSON-LD logo, the web manifest and the
// OG card; nothing here uses it. The 128px nod was encoded from the old 192px
// nod (kept out of the deploy as lion3d/lion-mark-source.webp) with Pillow
// (q60 / alpha q40, loop 1); the 80px nod and both stills are lanczos
// resizes of it and of the 192px still (sharp: nod q60 / alpha q40, loop 1;
// stills q80 / alpha q90).
const STILL = { src: "/lion/lion-still-80.webp", srcSet: "/lion/lion-still-80.webp 80w, /lion/lion-still-128.webp 128w" };
const NOD = { src: "/lion/lion-nod-80.webp", srcSet: "/lion/lion-nod-80.webp 80w, /lion/lion-nod-128.webp 128w" };
/** Every placement is h-9 w-9 md:h-10 md:w-10 (nav, footer, partner nav). */
const SIZES = "(min-width: 768px) 40px, 36px";

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
  const [img, setImg] = useState(STILL);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (!animated || reduced) return;
    const w = window as IdleWindow;
    let done = false;
    let preload: HTMLImageElement | null = null;
    const start = () => {
      // Re-check: the reduced-motion answer arrives one render after mount.
      if (done || w.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Same candidates and sizes as the <img>, so the file fetched here is
      // the one it then shows.
      preload = new Image();
      preload.onload = () => {
        if (!done) setImg(NOD);
      };
      preload.sizes = SIZES;
      preload.srcset = NOD.srcSet;
      preload.src = NOD.src;
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
      src={img.src}
      srcSet={img.srcSet}
      sizes={SIZES}
      alt={alt}
      width={192}
      height={192}
      draggable={false}
      decoding="async"
      className={cn("select-none", className)}
    />
  );
}
