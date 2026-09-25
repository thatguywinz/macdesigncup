import { useEffect, useRef } from "react";
import { animate, inView } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION } from "./tokens";

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-CA");

export interface CountUpProps {
  /** The final figure. This is what the server renders. */
  to: number;
  /** Where the count starts. Default `0`. */
  from?: number;
  /** Seconds. Default `1.6`. */
  duration?: number;
  /** Number to text. Default: rounded, en-CA grouping (`10,000`). */
  format?: (n: number) => string;
  /** Text before / after the number, e.g. `"$"` and `"+"`. */
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * A figure that counts up once, the first time it scrolls into view. The
 * server (and no-JS, and crawlers, and screen readers before and after the
 * count) get the final value, e.g. `$10,000+`: it only rewinds to `from` just
 * before it scrolls on screen. If the figure is already on screen when the
 * page mounts, or the visitor prefers reduced motion, it never moves. Counts
 * by writing `textContent` through a ref, never React state; the box keeps the
 * final width so nothing around it shifts.
 *
 * @example
 * <CountUp to={PRIZE_POOL_NUMBER} prefix="$" suffix="+" />
 */
export default function CountUp({
  to,
  from = 0,
  duration = DURATION.count,
  format = defaultFormat,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const finalText = `${prefix}${format(to)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Already visible at mount: rewinding it would flash. Leave it final.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    const write = (n: number) => {
      el.textContent = `${prefix}${format(n)}${suffix}`;
    };
    // Hold the final width while the digits run (inline-block so it applies).
    el.style.display = "inline-block";
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;

    // The figure stays final until it is about to be seen, so a heading that
    // is off screen (a deep link past it, a fast scroll, a screen reader's
    // heading list, an agent reading the DOM) never reads "$0+". It rewinds
    // to `from` just before it enters, and goes back to final if it leaves
    // again before the count starts.
    let started = false;
    const stopRewind = inView(
      el,
      () => {
        if (!started) write(from);
        return () => {
          if (!started) el.textContent = finalText;
        };
      },
      { margin: "15% 0px 15% 0px" },
    );

    let controls: ReturnType<typeof animate> | undefined;
    const stop = inView(
      el,
      () => {
        started = true;
        stopRewind();
        controls = animate(from, to, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: write,
          onComplete: () => {
            el.textContent = finalText;
          },
        });
      },
      { amount: 0.6 },
    );

    return () => {
      stopRewind();
      stop();
      controls?.stop();
      el.textContent = finalText;
      el.style.minWidth = "";
      el.style.display = "";
    };
  }, [to, from, duration, format, prefix, suffix, finalText]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {finalText}
    </span>
  );
}
