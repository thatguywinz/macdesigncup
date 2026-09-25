import { motion, useTransform, type MotionValue } from "framer-motion";
import DrawPath from "@/components/motion/DrawPath";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Geometry: a geometric question mark, extruded like a CAD letterform.
// The hook is an annulus sector around C; the stem continues the hook's
// tangent to a vertical bar; the dot is a disc. The extrusion is an oblique
// offset E (back and up-right). Pure module-scope maths: identical on the
// server and the client.
// ─────────────────────────────────────────────
const C = { x: 120, y: 110 };
const R_OUT = 79;
const R_IN = 45;
const R_MID = (R_OUT + R_IN) / 2;
const A0 = 160; // hook start (degrees, screen space: y down, clockwise +)
const A1 = 410; // hook end, 250 degrees later, lower right
const STEM_L = 103;
const STEM_R = 137;
const STEM_BOTTOM = 228;
const DOT = { x: 120, y: 262, r: 17 };
const E = { x: 26, y: -18 };

type Pt = { x: number; y: number };
const rad = (deg: number) => (deg * Math.PI) / 180;
const onCircle = (r: number, deg: number, c: Pt = C): Pt => ({
  x: c.x + r * Math.cos(rad(deg)),
  y: c.y + r * Math.sin(rad(deg)),
});
const f = (n: number) => Math.round(n * 10) / 10;
const xy = (p: Pt) => `${f(p.x)} ${f(p.y)}`;
const shift = (p: Pt): Pt => ({ x: p.x + E.x, y: p.y + E.y });

// Tangent at the hook's end: the stem's first leg runs along it.
const T = { x: -Math.sin(rad(A1)), y: Math.cos(rad(A1)) };
const outerStart = onCircle(R_OUT, A0);
const outerEnd = onCircle(R_OUT, A1);
const innerEnd = onCircle(R_IN, A1);
const innerStart = onCircle(R_IN, A0);
const alongTo = (p: Pt, x: number): Pt => ({ x, y: p.y + ((x - p.x) / T.x) * T.y });
const kneeR = alongTo(outerEnd, STEM_R);
const kneeL = alongTo(innerEnd, STEM_L);
const footR = { x: STEM_R, y: STEM_BOTTOM };
const footL = { x: STEM_L, y: STEM_BOTTOM };

function glyph(o: Pt = { x: 0, y: 0 }) {
  const m = (p: Pt) => xy({ x: p.x + o.x, y: p.y + o.y });
  return (
    `M ${m(outerStart)} A ${R_OUT} ${R_OUT} 0 1 1 ${m(outerEnd)} L ${m(kneeR)} L ${m(footR)} ` +
    `L ${m(footL)} L ${m(kneeL)} L ${m(innerEnd)} A ${R_IN} ${R_IN} 0 1 0 ${m(innerStart)} Z`
  );
}
const disc = (c: Pt, r: number) =>
  `M ${xy({ x: c.x - r, y: c.y })} A ${r} ${r} 0 1 0 ${xy({ x: c.x + r, y: c.y })} A ${r} ${r} 0 1 0 ${xy({ x: c.x - r, y: c.y })}`;

// Silhouette angle: where a circle's tangent runs parallel to the extrusion.
const SIL = ((Math.atan2(E.y, E.x) * 180) / Math.PI - 90 + 360) % 360; // ~235 degrees
const SIL2 = SIL - 180;
const FRONT = glyph();
const BACK = glyph(E);
const DOT_FRONT = disc(DOT, DOT.r);
const DOT_BACK = disc(shift(DOT), DOT.r);
const CONNECT = [
  outerStart,
  innerStart,
  onCircle(R_OUT, SIL),
  kneeR,
  footR,
  footL,
  onCircle(DOT.r, SIL, DOT),
  onCircle(DOT.r, SIL2, DOT),
]
  .map((p) => `M ${xy(p)} L ${xy(shift(p))}`)
  .join(" ");
const CENTRELINE = disc(C, R_MID);
const CROSS = `M ${C.x - 12} ${C.y} H ${C.x + 12} M ${C.x} ${C.y - 12} V ${C.y + 12}`;
const LEADER_AT = 205;
const LEADER_END = onCircle(R_OUT, LEADER_AT);
const LEADER = `M ${xy(C)} L ${xy(LEADER_END)} L ${f(LEADER_END.x - 22)} ${f(LEADER_END.y)}`;
const GROUND = `M 18 ${DOT.y + DOT.r + 0.5} H 222`;

// Ink. Front edges confident, the back and construction quieter, the dot ember.
const INK_FRONT = "[stroke:hsl(var(--bone)/0.8)]";
const INK_BACK = "[stroke:hsl(var(--bone)/0.32)]";
const INK_LINK = "[stroke:hsl(var(--bone)/0.42)]";
const INK_BUILD = "[stroke:hsl(var(--bone)/0.22)]";
const INK_EMBER = "[stroke:hsl(var(--ember)/0.95)]";
const INK_EMBER_SOFT = "[stroke:hsl(var(--ember)/0.45)]";

export interface QuestionMarkDrawingProps {
  /** 0..1 scroll progress; the drawing builds itself along it. */
  progress: MotionValue<number>;
  className?: string;
}

/**
 * The FAQ's drawing: a question mark modelled like a 3D letterform, the
 * front face in firm bone line, the extruded back face and its edges
 * quieter, construction lines (centreline, centre mark, radius) over it,
 * and the dot inked ember. It draws itself with scroll: construction,
 * front face, depth edges, back face, then the dot. Front faces are filled
 * with the page colour so they hide the lines behind them, like a real
 * hidden-line render. Decorative (aria-hidden); reduced motion and no-JS
 * get it fully drawn.
 */
export default function QuestionMarkDrawing({ progress, className }: QuestionMarkDrawingProps) {
  const faceOpacity = useTransform(progress, [0.1, 0.4], [0, 0.94]);
  const buildOpacity = useTransform(progress, [0, 0.25], [0, 1]);

  return (
    <svg
      viewBox="0 0 240 300"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full overflow-visible", className)}
    >
      {/* depth: back face and the edges joining it to the front */}
      <DrawPath d={BACK} progress={progress} range={[0.5, 0.85]} className={INK_BACK} />
      <DrawPath d={DOT_BACK} progress={progress} range={[0.72, 0.92]} className={INK_EMBER_SOFT} />
      <DrawPath d={CONNECT} progress={progress} range={[0.42, 0.66]} className={INK_LINK} />

      {/* front faces, filled with the page so they occlude what's behind */}
      <motion.path data-reveal="" d={FRONT} style={{ opacity: faceOpacity }} className="fill-background stroke-none" />
      <motion.path data-reveal="" d={DOT_FRONT} style={{ opacity: faceOpacity }} className="fill-background stroke-none" />
      <DrawPath d={FRONT} progress={progress} range={[0.08, 0.55]} strokeWidth={1.5} className={INK_FRONT} />
      <DrawPath d={DOT_FRONT} progress={progress} range={[0.7, 0.95]} strokeWidth={1.5} className={INK_EMBER} />

      {/* construction, on top: the sweep's centreline, centre mark, radius */}
      <motion.g data-reveal="" style={{ opacity: buildOpacity }}>
        <path d={CENTRELINE} className={cn("fill-none", INK_BUILD)} strokeDasharray="10 4 2 4" />
        <path d={CROSS} className={cn("fill-none", INK_BUILD)} />
      </motion.g>
      <DrawPath d={LEADER} progress={progress} range={[0.2, 0.45]} className={INK_LINK} />
      <DrawPath d={GROUND} progress={progress} range={[0, 0.3]} className={INK_BUILD} />
    </svg>
  );
}
