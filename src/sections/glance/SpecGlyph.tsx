import DrawPath from "@/components/motion/DrawPath";
import { cn } from "@/lib/utils";

export type SpecGlyphKind = "when" | "where" | "who" | "cost";

/** Bone line work for the glyph, ember for its one accent. */
const INK = "stroke-bone/70";
const FAINT = "stroke-bone/35";
const EMBER = "stroke-ember";

interface Stroke {
  d: string;
  tone?: "ink" | "faint" | "ember";
}

// 48x48 drawings. Each list draws in order; the ember stroke lands last.
const GLYPHS: Record<SpecGlyphKind, Stroke[]> = {
  // A calendar sheet: binding rings, header band, a day grid, one day ringed.
  when: [
    { d: "M7 11 H41 V42 H7 Z" },
    { d: "M15 6 V14 M33 6 V14" },
    { d: "M7 19 H41" },
    { d: "M7 27 H41 M7 35 H41 M15.5 19 V42 M24 19 V42 M32.5 19 V42", tone: "faint" },
    { d: "M22.6 31 a5.65 5.65 0 1 0 11.3 0 a5.65 5.65 0 1 0 -11.3 0", tone: "ember" },
  ],
  // A map pin over a crosshair, standing on its ground ellipse.
  where: [
    { d: "M24 41 C21 37.5 12.5 28.5 12.5 19.5 A11.5 11.5 0 0 1 35.5 19.5 C35.5 28.5 27 37.5 24 41 Z" },
    { d: "M4 19.5 H11 M37 19.5 H44 M24 2 V6.5", tone: "faint" },
    { d: "M15 43.5 a9 2 0 1 0 18 0 a9 2 0 1 0 -18 0", tone: "faint" },
    { d: "M19.5 19.5 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0", tone: "ember" },
  ],
  // A teacher and a (shorter) student, side by side on one ground line.
  who: [
    { d: "M12.5 11.5 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0" },
    { d: "M8 41 V29 a9 9 0 0 1 18 0 V41" },
    { d: "M28.3 20 a3.7 3.7 0 1 0 7.4 0 a3.7 3.7 0 1 0 -7.4 0" },
    { d: "M25 41 V32 a7 7 0 0 1 14 0 V41" },
    { d: "M4 41 H44", tone: "ember" },
  ],
  // A price tag on its string, the price still a question mark.
  cost: [
    { d: "M17 11 H41 V37 H17 L7 24 Z" },
    { d: "M12.6 24 a1.9 1.9 0 1 0 3.8 0 a1.9 1.9 0 1 0 -3.8 0" },
    { d: "M13 22.5 C9 17 7 11 11 5", tone: "faint" },
    { d: "M25 20.5 a4.5 4.5 0 1 1 6.2 4.2 c-1.4 0.6 -2.2 1.5 -2.2 3.1 V29.5 M29 32.8 V34.4", tone: "ember" },
  ],
};

const TONE = { ink: INK, faint: FAINT, ember: EMBER } as const;

export interface SpecGlyphProps {
  kind: SpecGlyphKind;
  /** Seconds before the first stroke starts drawing. */
  delay?: number;
  className?: string;
}

/**
 * A small line glyph for one cell of the At a glance spec strip. Its strokes
 * draw in one after another the first time the strip scrolls into view
 * (fully drawn for reduced motion and without JS). Decorative.
 */
export default function SpecGlyph({ kind, delay = 0, className }: SpecGlyphProps) {
  const strokes = GLYPHS[kind];
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={cn("h-11 w-11 shrink-0 overflow-visible", className)}
    >
      {strokes.map((s, i) => (
        <DrawPath
          key={i}
          d={s.d}
          strokeWidth={1.25}
          className={TONE[s.tone ?? "ink"]}
          delay={delay + i * 0.14}
          duration={0.9}
        />
      ))}
    </svg>
  );
}
