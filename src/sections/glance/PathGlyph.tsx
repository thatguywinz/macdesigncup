import DrawPath from "@/components/motion/DrawPath";
import { cn } from "@/lib/utils";

export type PathKind = "together" | "teachers" | "partners";

interface Stroke {
  d: string;
  tone?: "ink" | "faint" | "ember";
}

const TONE = { ink: "stroke-bone/75", faint: "stroke-bone/35", ember: "stroke-ember" } as const;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Each drawing's viewBox width (all are 80 tall). */
const WIDTH: Record<PathKind, number> = { together: 200, teachers: 120, partners: 120 };

// One list per drawing; each draws in order, ember lands last.
const GLYPHS: Record<PathKind, Stroke[]> = {
  // A teacher and two students around one laptop with a wire cube on its
  // screen, on one ground line: the shared registration route.
  together: [
    { d: `${circle(30, 16, 6.5)} M17 72 V44 a13 13 0 0 1 26 0 V72` },
    { d: "M43 50 L66 58", tone: "faint" },
    { d: "M80 18 H128 V58 H80 Z M76 58 H132 L142 72 H66 Z" },
    { d: "M96 66 H112", tone: "faint" },
    // the cube: back face faint, then front face and the joining edges
    { d: "M103 30 H115 V42 H103 Z", tone: "faint" },
    { d: "M96 36 H108 V48 H96 Z M96 36 L103 30 M108 48 L115 42 M96 48 L103 42" },
    { d: `${circle(160, 38, 4.8)} M151 72 V60 a9 9 0 0 1 18 0 V72` },
    { d: `${circle(183, 36, 4.8)} M174 72 V58 a9 9 0 0 1 18 0 V72` },
    { d: "M2 72 H198", tone: "faint" },
    { d: "M108 36 L115 30", tone: "ember" },
  ],
  // A teacher standing behind three students, on one ground line.
  teachers: [
    { d: `${circle(26, 16, 6.5)} M13 72 V44 a13 13 0 0 1 26 0 V72` },
    { d: `${circle(56, 36, 4.8)} M47 72 V58 a9 9 0 0 1 18 0 V72` },
    { d: `${circle(79, 34, 4.8)} M70 72 V56 a9 9 0 0 1 18 0 V72` },
    { d: `${circle(102, 36, 4.8)} M93 72 V58 a9 9 0 0 1 18 0 V72` },
    { d: "M50 6 H112 V22 H50 Z M58 14 H80", tone: "faint" },
    { d: "M2 72 H118", tone: "ember" },
  ],
  // A logo plate screwed to a plinth: your name on the wall.
  partners: [
    { d: "M26 6 H94 V46 H26 Z" },
    { d: `${circle(32, 12, 1.6)} ${circle(88, 12, 1.6)} ${circle(32, 40, 1.6)} ${circle(88, 40, 1.6)}`, tone: "faint" },
    { d: `${circle(47, 26, 7)} M60 22 H80 M60 30 H74`, tone: "faint" },
    { d: "M42 46 V54 H78 V46 M30 54 H90 V72 H30 Z" },
    { d: "M2 72 H118", tone: "faint" },
    { d: "M40 34 H80", tone: "ember" },
  ],
};

export interface PathGlyphProps {
  kind: PathKind;
  delay?: number;
  className?: string;
}

/**
 * The line drawing for one route of the "Pick your path" band: a teacher
 * and two students around a laptop with a wire cube (together, 200 wide),
 * a teacher with a group (teachers, also on /partner), a logo plate on a
 * plinth (partners). Draws in once on view; fully drawn for
 * reduced motion and without JS. Decorative.
 */
export default function PathGlyph({ kind, delay = 0, className }: PathGlyphProps) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH[kind]} 80`}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 overflow-visible", className)}
    >
      {GLYPHS[kind].map((s, i) => (
        <DrawPath
          key={i}
          d={s.d}
          strokeWidth={1.25}
          strokeLinejoin="round"
          className={TONE[s.tone ?? "ink"]}
          delay={delay + i * 0.12}
          duration={0.9}
        />
      ))}
    </svg>
  );
}
