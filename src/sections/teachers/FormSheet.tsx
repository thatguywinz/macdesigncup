import { useEffect, useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import DrawPath from "@/components/motion/DrawPath";
import { useSectionProgress, type ScrollOffset } from "@/components/motion/useSectionProgress";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

/** Draws from when the sheet's top enters the viewport until its centre reaches the middle. */
const OFFSET: ScrollOffset = ["start end", "center 0.5"];

const W = 440;
const L = 28; // field column left
const R = 412; // field column right
const SPLIT_L = 214; // Number of students | Grades
const SPLIT_R = 234;
const rect = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1} H${x2} V${y2} H${x1} Z`;

/** The pencil's trace inside the School field. */
const TRACE_FROM = 42;
const TRACE_TO = 236;

interface Field {
  /** Index into SECTIONS.teachers.sheet.fields: School, Number of students, Names, Grades, Student emails (optional). */
  f: number;
  x1: number;
  x2: number;
  y: number;
  h: number;
  optional?: true;
}

interface Layout {
  /** viewBox height */
  H: number;
  /** y of the rule under the title block */
  titleRule: number;
  titleY: number;
  titleSize: number;
  labelSize: number;
  /** label baseline sits this far above its box */
  labelGap: number;
  /** Fields, in reading order. */
  fields: readonly Field[];
  /** Ruled lines inside Names */
  namesRules: string;
  traceY: number;
  /** Pencil pose: rotation (deg) and scale, so it clears the title block. */
  pencilRot: number;
  pencilScale: number;
}

/** Tablets and desktop: the roomy sheet. The border sits 24 units under the
 *  last field, a touch more than the 20 at the sides. */
const TALL: Layout = {
  H: 476,
  titleRule: 64,
  titleY: 42,
  titleSize: 14.5,
  labelSize: 10,
  labelGap: 10,
  fields: [
    { f: 0, x1: L, x2: R, y: 108, h: 36 },
    { f: 1, x1: L, x2: SPLIT_L, y: 188, h: 36 },
    { f: 3, x1: SPLIT_R, x2: R, y: 188, h: 36 },
    { f: 2, x1: L, x2: R, y: 268, h: 96 },
    { f: 4, x1: L, x2: R, y: 408, h: 36, optional: true },
  ],
  namesRules: "M42 300 H398 M42 332 H398",
  traceY: 133,
  pencilRot: -38,
  pencilScale: 1,
};

/** Phones: a short card, wider than tall, so the drawing stays a visual anchor
 *  without costing a screen. The four fields the form asks for (the optional
 *  emails box is left to the tall sheet; step 01 says it is optional), packed
 *  tight with larger labels so they read at 320 to 350px wide. */
const COMPACT: Layout = {
  H: 256,
  titleRule: 52,
  titleY: 36,
  titleSize: 16,
  labelSize: 12,
  labelGap: 8,
  fields: [
    { f: 0, x1: L, x2: R, y: 82, h: 30 },
    { f: 1, x1: L, x2: SPLIT_L, y: 138, h: 30 },
    { f: 3, x1: SPLIT_R, x2: R, y: 138, h: 30 },
    { f: 2, x1: L, x2: R, y: 194, h: 36 },
  ],
  namesRules: "M42 212 H398",
  traceY: 103,
  pencilRot: -24,
  pencilScale: 0.88,
};

const pencilAt = (lay: Layout, x: number) =>
  `translate(${x.toFixed(1)} ${lay.traceY}) rotate(${lay.pencilRot}) scale(${lay.pencilScale})`;

interface Fades {
  titleO: MotionValue<number>;
  labelO: readonly MotionValue<number>[];
  dashedO: MotionValue<number>;
  pencilO: MotionValue<number>;
}

/** One drawing of the sheet in the given layout, scrubbed by `p`. */
function SheetDrawing({
  lay,
  p,
  fades,
  pencilRef,
  className,
}: {
  lay: Layout;
  p: MotionValue<number>;
  fades: Fades;
  pencilRef: RefObject<SVGGElement>;
  className?: string;
}) {
  const t = SECTIONS.teachers.sheet;
  const { H } = lay;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} aria-hidden="true" focusable="false">
      <rect x="8" y="8" width={W - 16} height={H - 16} className="fill-background/80" />

      {/* Sheet and title block */}
      <DrawPath d={rect(8, 8, W - 8, H - 8)} progress={p} range={[0, 0.28]} className="stroke-bone/50" strokeWidth={1.25} />
      <DrawPath
        d={`M8 ${lay.titleRule} H${W - 8}`}
        progress={p}
        range={[0.1, 0.3]}
        className="stroke-bone/45"
      />
      <motion.g data-reveal="" style={{ opacity: fades.titleO }} className="font-mono uppercase">
        <text x="26" y={lay.titleY} className="fill-bone/90" fontSize={lay.titleSize} fontWeight="700" letterSpacing="2">
          {t.title}
        </text>
      </motion.g>

      {/* Fields: label above an empty box */}
      {lay.fields.map((fd, i) => {
        const d = rect(fd.x1, fd.y, fd.x2, fd.y + fd.h);
        return (
          <g key={fd.f}>
            <motion.text
              data-reveal=""
              x={fd.x1}
              y={fd.y - lay.labelGap}
              className="fill-bone/70 font-mono uppercase"
              fontSize={lay.labelSize}
              letterSpacing="1.5"
              style={{ opacity: fades.labelO[i] }}
            >
              {t.fields[fd.f]}
            </motion.text>
            {fd.optional ? (
              <motion.path
                d={d}
                fill="none"
                className="stroke-bone/45"
                strokeWidth={1}
                strokeDasharray="5 4"
                data-reveal=""
                style={{ opacity: fades.dashedO }}
              />
            ) : (
              <DrawPath
                d={d}
                progress={p}
                range={[0.28 + i * 0.07, 0.4 + i * 0.07]}
                className="stroke-bone/60"
                strokeWidth={1.1}
              />
            )}
          </g>
        );
      })}

      {/* Ruled lines inside Names */}
      <DrawPath d={lay.namesRules} progress={p} range={[0.58, 0.68]} className="stroke-bone/15" />

      {/* The pencil tracing into the first field */}
      <DrawPath
        d={`M${TRACE_FROM} ${lay.traceY} H${TRACE_TO}`}
        progress={p}
        range={[0.72, 1]}
        className="stroke-ember"
        strokeWidth={1.5}
      />
      <motion.g style={{ opacity: fades.pencilO }}>
        <g ref={pencilRef} transform={pencilAt(lay, TRACE_FROM)}>
          {/* body along +x from the tip at the origin */}
          <path d="M0 0 L16 -5.5 L16 5.5 Z" className="fill-background stroke-bone/85" strokeWidth={1.1} strokeLinejoin="round" />
          <path d="M0 0 L5.2 -1.8 L5.2 1.8 Z" className="fill-ember" />
          <path d="M16 -5.5 H92 V5.5 H16" className="fill-background stroke-bone/85" strokeWidth={1.1} />
          <path d="M16 0 H92" fill="none" className="stroke-bone/30" strokeWidth={1} />
          <path d="M92 -5.5 H101 V5.5 H92 Z M95 -5.5 V5.5 M98 -5.5 V5.5" className="fill-background stroke-bone/60" strokeWidth={1} />
          <path
            d="M101 -5.5 H109 Q113 -5.5 113 -1.5 V1.5 Q113 5.5 109 5.5 H101"
            className="fill-background stroke-ember/80"
            strokeWidth={1.1}
          />
        </g>
      </motion.g>
    </svg>
  );
}

/**
 * The teacher registration form, drawn as a drafting sheet: a title block
 * reading "Registration · Teacher", the form's fields as empty blueprint boxes
 * (no sample data) and a drafting pencil that traces an ember line into the
 * first field. No caption: step 01 already says it is one form, and the Teachers
 * section says each rule once. Scrubbed by scroll;
 * reduced motion shows it finished. Decorative: the steps say the same in text.
 * Phones get a short, compact layout of the same sheet (CSS switch at `md`, so
 * the server and client render the same markup); both share one scroll progress.
 */
export default function FormSheet({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tallPencil = useRef<SVGGElement>(null);
  const compactPencil = useRef<SVGGElement>(null);
  const p = useSectionProgress(ref, OFFSET);

  const titleO = useTransform(p, [0.18, 0.32], [0, 1]);
  const l0 = useTransform(p, [0.26, 0.34], [0, 1]);
  const l1 = useTransform(p, [0.33, 0.41], [0, 1]);
  const l2 = useTransform(p, [0.4, 0.48], [0, 1]);
  const l3 = useTransform(p, [0.47, 0.55], [0, 1]);
  const l4 = useTransform(p, [0.54, 0.62], [0, 1]);
  const dashedO = useTransform(p, [0.58, 0.68], [0, 1]);
  const pencilO = useTransform(p, [0.66, 0.72], [0, 1]);
  const fades: Fades = { titleO, labelO: [l0, l1, l2, l3, l4], dashedO, pencilO };

  // The pencil rides the trace: its transform is written through a ref.
  useEffect(() => {
    const pairs = [
      [tallPencil.current, TALL],
      [compactPencil.current, COMPACT],
    ] as const;
    const apply = (v: number) => {
      const k = Math.min(1, Math.max(0, (v - 0.72) / 0.28));
      const x = TRACE_FROM + (TRACE_TO - TRACE_FROM) * k;
      for (const [g, lay] of pairs) g?.setAttribute("transform", pencilAt(lay, x));
    };
    apply(p.get());
    return p.on("change", apply);
  }, [p]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <SheetDrawing lay={COMPACT} p={p} fades={fades} pencilRef={compactPencil} className="block md:hidden" />
      <SheetDrawing lay={TALL} p={p} fades={fades} pencilRef={tallPencil} className="hidden md:block" />
    </div>
  );
}
