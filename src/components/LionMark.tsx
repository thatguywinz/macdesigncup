import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Porcelain lion head from the club's 3D render — the site-wide brand mark.
// The webp plays one ~3.2s "nod" on load and settles on the front pose
// (single-play keeps it inside WCAG 2.2.2 without a pause control);
// reduced motion gets the still pose outright.
const ANIMATED_SRC = "/lion/lion-mark.webp";
const STATIC_SRC = "/lion/lion-mark.png";

interface LionMarkProps {
  className?: string;
  /** Decorative by default — set alt text only when the mark stands alone. */
  alt?: string;
  /** Force the still frame even for motion-tolerant visitors. */
  animated?: boolean;
}

export default function LionMark({ className, alt = "", animated = true }: LionMarkProps) {
  const reduced = !!useReducedMotion();
  const img = (
    <img
      src={STATIC_SRC}
      alt={alt}
      width={192}
      height={192}
      draggable={false}
      decoding="async"
      className={cn("select-none", className)}
    />
  );
  if (!animated || reduced) return img;
  // <picture> lets browsers without webp decode fall back to the png; contents
  // keeps the img itself as the flex item so lockup alignment is unchanged.
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={ANIMATED_SRC} />
      {img}
    </picture>
  );
}
