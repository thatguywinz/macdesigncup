/**
 * Shared motion tokens, so every reveal on the site moves with one hand.
 * EASE is a soft expo-out: quick to start, long settle, no bounce.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Seconds. `reveal` for fades/rises, `draw` for lines, `count` for CountUp. */
export const DURATION = {
  reveal: 0.8,
  draw: 1.4,
  count: 1.6,
} as const;

/**
 * framer `viewport` for one-shot "on view" triggers: fires once, when the
 * element is ~12% of the viewport height past the bottom edge.
 */
export const VIEWPORT_ONCE = { once: true, margin: "0px 0px -12% 0px" } as const;
