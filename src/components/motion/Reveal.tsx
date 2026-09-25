import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { DURATION, EASE, VIEWPORT_ONCE } from "./tokens";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  aside: motion.aside,
  header: motion.header,
  footer: motion.footer,
  figure: motion.figure,
  p: motion.p,
  span: motion.span,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  dl: motion.dl,
} as const;

export type RevealTag = keyof typeof TAGS;

export interface RevealProps {
  children?: ReactNode;
  /** Element to render. Default `"div"`. */
  as?: RevealTag;
  /** Seconds to wait after the element comes into view. Default `0`. */
  delay?: number;
  /** Pixels the element rises while it fades in. Default `18`. */
  y?: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

/**
 * Fades and lifts its content in the first time it scrolls into view, then
 * stays put. Server HTML carries the hidden start state plus `data-reveal`,
 * which the `<noscript>` rule in index.html forces visible. Reduced motion:
 * shown immediately after mount, no movement.
 *
 * @example
 * <Reveal as="p" delay={0.1} className="max-w-xl text-concrete">{SECTIONS.glance.body}</Reveal>
 */
export default function Reveal({
  as = "div",
  delay = 0,
  y = 18,
  className,
  id,
  style,
  children,
}: RevealProps) {
  const reduced = useReducedMotionSafe();
  // One motion component type for every tag keeps the props typing simple;
  // the runtime element is still the requested tag.
  const Tag = TAGS[as] as typeof motion.div;

  return (
    <Tag
      data-reveal=""
      id={id}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={reduced ? { opacity: 1, y: 0 } : undefined}
      viewport={VIEWPORT_ONCE}
      transition={reduced ? { duration: 0 } : { duration: DURATION.reveal, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}
