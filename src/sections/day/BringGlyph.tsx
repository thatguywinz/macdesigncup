import DrawPath from "@/components/motion/DrawPath";
import { cn } from "@/lib/utils";

// Line glyphs for the three things to bring, in a 48 × 48 box. Bone lines,
// one ember detail each, drawn once on view. Decorative.
const GLYPHS: readonly { bone: readonly string[]; ember: string }[] = [
  // A laptop, a small wire cube on its screen
  {
    bone: ["M11 9 H37 V29 H11 Z", "M5 32 H43 L40 37 H8 Z"],
    ember: "M20 17 L24 14 L28 17 L24 20 Z M20 17 V22 L24 25 V20 M28 17 V22 L24 25",
  },
  // Its charger: brick, prongs, cable
  {
    bone: ["M16 17 H32 V31 H16 Z", "M24 31 V35 C24 42 36 39 36 45"],
    ember: "M21 17 V10 M27 17 V10",
  },
  // 3D software: a wire cube
  {
    bone: ["M11 19 H29 V37 H11 Z", "M11 19 L18 12 H36 V30 L29 37", "M29 19 L36 12"],
    ember: "M18 12 H36 L29 19 H11 Z",
  },
];

export default function BringGlyph({ index, delay = 0, className }: { index: number; delay?: number; className?: string }) {
  const g = GLYPHS[index % GLYPHS.length];
  return (
    <svg viewBox="0 0 48 48" className={cn("h-12 w-12", className)} aria-hidden="true" focusable="false">
      {g.bone.map((d, i) => (
        <DrawPath
          key={i}
          d={d}
          className="stroke-bone/75"
          strokeWidth={1.4}
          strokeLinejoin="round"
          delay={delay + i * 0.15}
          duration={1}
        />
      ))}
      <DrawPath
        d={g.ember}
        className="stroke-ember"
        strokeWidth={1.4}
        strokeLinejoin="round"
        delay={delay + 0.4}
        duration={0.9}
      />
    </svg>
  );
}
