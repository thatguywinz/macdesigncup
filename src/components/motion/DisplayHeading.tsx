import { Fragment, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { DURATION, EASE, VIEWPORT_ONCE } from "./tokens";

const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3 } as const;

export interface DisplayHeadingProps {
  /** Heading level. Default `"h2"`. The home page's only `h1` is the hero's. */
  as?: "h1" | "h2" | "h3";
  /** One entry per line. Any node (e.g. `<CountUp />`) renders as-is. */
  lines: readonly ReactNode[];
  /** `"scene"` (section headings, default) or `"hero"` (Anton poster size). */
  size?: "scene" | "hero";
  /** Seconds before the first line moves. Default `0`. */
  delay?: number;
  /** Seconds between lines. Default `0.09`. */
  stagger?: number;
  /** `false` renders the heading static (no mask, no motion), e.g. for an
   *  above-the-fold LCP heading. Default `true`. */
  reveal?: boolean;
  id?: string;
  className?: string;
  /** Extra classes on every line's `<span>`. */
  lineClassName?: string;
}

/**
 * A section heading. Each line sits in its own clipped band and
 * slides up into it the first time the heading scrolls into view, lines
 * staggered. Server HTML is complete (lines are plain text, separated by a
 * space for crawlers and screen readers); `data-reveal` lets the noscript
 * rule show it without JS. Reduced motion: static after mount.
 *
 * @example
 * <DisplayHeading lines={SECTIONS.glance.lines} />
 */
export default function DisplayHeading({
  as = "h2",
  lines,
  size = "scene",
  delay = 0,
  stagger = 0.09,
  reveal = true,
  id,
  className,
  lineClassName,
}: DisplayHeadingProps) {
  const reduced = useReducedMotionSafe();
  const sizeClass = size === "hero" ? "display-hero" : "display-scene";

  if (!reveal) {
    const Static = as;
    return (
      <Static id={id} className={cn(sizeClass, className)}>
        {lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className={cn("block", lineClassName)}>{line}</span>
          </Fragment>
        ))}
      </Static>
    );
  }

  const Tag = TAGS[as];
  const lineVariants: Variants = {
    hidden: { y: "135%" },
    shown: (i: number) => ({
      y: "0%",
      transition: reduced
        ? { duration: 0 }
        : { duration: DURATION.reveal + 0.1, ease: EASE, delay: delay + i * stagger },
    }),
  };

  return (
    <Tag
      id={id}
      className={cn(sizeClass, className)}
      initial="hidden"
      whileInView="shown"
      animate={reduced ? "shown" : undefined}
      viewport={VIEWPORT_ONCE}
    >
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {/* The band clips the line as it rises. clip-path, not overflow, so
              descenders never get shaved at rest. */}
          <span className="display-line block">
            <motion.span
              data-reveal=""
              custom={i}
              variants={lineVariants}
              className={cn("block", lineClassName)}
            >
              {line}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
