import { useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import CropMarks from "@/components/blueprint/CropMarks";
import Dimension from "@/components/blueprint/Dimension";
import DrawPath from "@/components/motion/DrawPath";
import useSectionProgress, { type ScrollOffset } from "@/components/motion/useSectionProgress";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";
import { FIRST_PLACE_DIM, HIDDEN, LAYERS, VIEW_H, VIEW_W, type Ink } from "./printerGeometry";

// Stroke ink per layer. `--sw` scales every width up where the viewBox is
// drawn small (phones, and md to lg beside the legend), so lines render at
// about the same weight everywhere (DrawPath can't use non-scaling-stroke).
const INK: Record<Ink, string> = {
  strong: "stroke-bone/80",
  mid: "stroke-bone/55",
  faint: "stroke-bone/25",
  ember: "stroke-ember",
  emberSoft: "stroke-ember/60",
};
// Widths as classes (DrawPath owns `style`); a CSS stroke-width beats the attribute.
const SW = {
  1: "[stroke-width:calc(var(--sw)*1px)]",
  1.1: "[stroke-width:calc(var(--sw)*1.1px)]",
  1.2: "[stroke-width:calc(var(--sw)*1.2px)]",
  1.3: "[stroke-width:calc(var(--sw)*1.3px)]",
  1.4: "[stroke-width:calc(var(--sw)*1.4px)]",
  1.5: "[stroke-width:calc(var(--sw)*1.5px)]",
  1.7: "[stroke-width:calc(var(--sw)*1.7px)]",
  2: "[stroke-width:calc(var(--sw)*2px)]",
} as const;
type Width = keyof typeof SW;
const WIDTH: Record<Ink, Width> = { strong: 1.4, mid: 1.1, faint: 1, ember: 1.7, emberSoft: 1.2 };

// Finish drawing as the plate's centre reaches 68% down the viewport: by the
// time a nav click lands on the sheet, the last ember line is down.
const OFFSET: ScrollOffset = ["start end", "center 0.68"];

const pct = (n: number, of: number) => `${(n / of) * 100}%`;


/**
 * The drawing's one label: an ember overall dimension across the enclosure,
 * "1st place". Only from `xl`, where the legend sits in its own column and
 * drops its "1st place" eyebrow to screen readers; below `xl` the legend's
 * eyebrow sits right by the machine's name and this stays off, so each width
 * shows the mark once.
 */
function FirstPlaceDim({ progress }: { progress: MotionValue<number> }) {
  const { x0, x1, y, at } = FIRST_PLACE_DIM;
  const opacity = useTransform(progress, [at, at + 0.08], [0, 1]);
  return (
    <motion.div
      data-reveal=""
      aria-hidden="true"
      className="absolute -translate-y-1/2 max-xl:hidden"
      style={{ opacity, top: pct(y, VIEW_H), left: pct(x0, VIEW_W), width: pct(x1 - x0, VIEW_W) }}
    >
      <Dimension
        label={SECTIONS.prizes.callouts[0]}
        tone="ember"
        draw={false}
        className="gap-2.5 [&_.dim-label]:text-[11px] [&_.dim-label]:tracking-[0.14em] [&_.dim-label]:text-ember [&_.dim-line]:min-w-[12px]"
      />
    </motion.div>
  );
}

/**
 * The Prizes sheet's visual anchor: an isometric line drawing of a generic
 * desktop 3D printer (the 1st-place prize, stylised) that builds itself as
 * you scroll: plinth and frame, bed, gantry, two toolheads, the spool, then a
 * first layer laid down in ember, under one ember "1st place" dimension.
 * Decorative: the facts live in the legend beside it, not on the drawing.
 * Reduced motion and no-JS: fully drawn.
 */
export default function PrinterDrawing({ className }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const progress = useSectionProgress(ref, OFFSET);
  const hiddenOpacity = useTransform(progress, [0.12, 0.3], [0, 1]);

  return (
    <figure
      ref={ref}
      role="img"
      aria-label={SECTIONS.prizes.figureAlt}
      // A flex column, so a plate stretched to a taller grid row keeps the
      // drawing centred on it.
      className={cn("draft-panel relative flex flex-col p-2 sm:p-5", className)}
    >
      <CropMarks inset={-10} />
      {/* Below xl the dimension is off, which leaves the viewBox's top band
          (above the enclosure, about 11% of the width) empty: pull the
          drawing up into the plate's padding so the plate isn't top-heavy. */}
      <div className="relative my-auto w-full max-xl:-mt-[7%]" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        {/* A soft ember floor light under the machine, so it reads as the lit prize. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_30%_at_48%_66%,hsl(var(--ember)/0.1),transparent_100%)]"
        />
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 h-full w-full overflow-visible [--sw:2.6] sm:[--sw:1.9] md:[--sw:1.9] lg:[--sw:1.5] xl:[--sw:1.1]"
        >
          <motion.path
            data-reveal=""
            d={HIDDEN}
            fill="none"
            className={cn("stroke-bone/25", SW[1])}
            strokeDasharray="4 5"
            style={{ opacity: hiddenOpacity }}
          />
          {LAYERS.map((l) => (
            <DrawPath
              key={l.id}
              d={l.d}
              progress={progress}
              range={l.range}
              className={cn(INK[l.ink], SW[l.width ?? WIDTH[l.ink]])}
            />
          ))}
        </svg>

        <FirstPlaceDim progress={progress} />
      </div>
    </figure>
  );
}
