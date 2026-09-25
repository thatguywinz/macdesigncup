import { useId, useRef, type CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import DrawPath from "@/components/motion/DrawPath";
import Reveal from "@/components/motion/Reveal";
import { SECTION_OFFSETS, useSectionProgress } from "@/components/motion/useSectionProgress";
import RegisterBlock from "@/components/RegisterBlock";
import { SECTIONS } from "@/content/copy";

const s = SECTIONS.register;

// ─────────────────────────────────────────────
// The portal door from the hero's hall, drawn as an elevation: lintel and
// jambs in bone, the blazing opening in ember, the cooler core inside it,
// the reveal receding toward the centre, and the runway on the floor
// coming out toward you. Proportions follow the 3D portal (opening
// 2.5 x 3.75, jambs 0.42, lintel 0.44). Units: the door is 408 wide; the
// floor line sits at y = FLOOR, the runway runs RUNWAY below it.
// ─────────────────────────────────────────────
const FLOOR = 503;
const RUNWAY = 200;
const SIDE = 300; // floor drawn this far past each side of the frame
const VB = { x: -SIDE, y: -24, w: 408 + SIDE * 2, h: FLOOR + RUNWAY + 24 };
/** How much taller the drawing is than the door (lintel top to floor). */
const K = VB.h / (FLOOR + 24);

const OPEN = { l: 54, r: 354, t: 53 };
const CORE = { l: 72, r: 336, t: 71 };
const VP = { x: 204, y: FLOOR * 0.56 };
const toward = (x: number, y: number, t: number) =>
  `M ${x} ${y} L ${Math.round(x + (VP.x - x) * t)} ${Math.round(y + (VP.y - y) * t)}`;

const FRAME = `M 4 ${FLOOR} V 53 H 0 V 0 H 408 V 53 H 404 V ${FLOOR}`;
const LINTEL = `M 0 53 H ${OPEN.l} M ${OPEN.r} 53 H 408 M 4 ${FLOOR} H ${OPEN.l} M ${OPEN.r} ${FLOOR} H 404`;
const RIM = `M ${OPEN.l} ${FLOOR} V ${OPEN.t} H ${OPEN.r} V ${FLOOR}`;
const COREP = `M ${CORE.l} ${FLOOR} V ${CORE.t} H ${CORE.r} V ${FLOOR}`;
const REVEAL = [
  toward(OPEN.l, OPEN.t, 0.1),
  toward(OPEN.r, OPEN.t, 0.1),
  toward(OPEN.l, FLOOR, 0.1),
  toward(OPEN.r, FLOOR, 0.1),
].join(" ");
const FLOOR_LINE = `M ${-SIDE} ${FLOOR} H ${408 + SIDE}`;
const RUNWAY_EDGES = `M ${OPEN.l} ${FLOOR} L ${OPEN.l - 230} ${FLOOR + RUNWAY} M ${OPEN.r} ${FLOOR} L ${OPEN.r + 230} ${FLOOR + RUNWAY}`;
// Transverse joints, spaced wider as they come toward you.
const JOINTS = [0.12, 0.3, 0.56, 0.9]
  .map((t) => {
    const y = FLOOR + RUNWAY * t;
    const spread = 230 * t;
    return `M ${Math.round(OPEN.l - spread)} ${Math.round(y)} H ${Math.round(OPEN.r + spread)}`;
  })
  .join(" ");

const INK_FRAME = "[stroke:hsl(var(--bone)/0.6)]";
const INK_SOFT = "[stroke:hsl(var(--bone)/0.32)]";
const INK_FLOOR = "[stroke:hsl(var(--bone)/0.2)]";
const INK_RIM = "[stroke:hsl(var(--ember)/0.9)]";
const INK_CORE = "[stroke:hsl(var(--ember)/0.42)]";

function PortalDoor({ progress }: { progress: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const glow = useTransform(progress, [0.35, 0.9], [0, 1]);

  // The door's height is the heading block plus the 2.5rem it stands above
  // it; the runway hangs below the floor line. Width follows the viewBox.
  const style: CSSProperties = {
    height: `calc((100% + 2.5rem) * ${K.toFixed(4)})`,
    aspectRatio: `${VB.w} / ${VB.h}`,
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className="pointer-events-none absolute -top-10 left-1/2 w-auto max-w-none -translate-x-1/2"
      style={style}
    >
      <defs>
        <radialGradient id={`${id}-in`} cx="50%" cy="100%" r="85%">
          <stop offset="0%" stopColor="hsl(var(--ember))" stopOpacity="0.22" />
          <stop offset="55%" stopColor="hsl(var(--ember))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="hsl(var(--ember))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-floor`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--ember))" stopOpacity="0.32" />
          <stop offset="45%" stopColor="hsl(var(--ember))" stopOpacity="0.1" />
          <stop offset="100%" stopColor="hsl(var(--ember))" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-below`}>
          <rect x={VB.x} y={FLOOR} width={VB.w} height={RUNWAY} />
        </clipPath>
        {/* the runway fades out as it comes toward you */}
        <linearGradient id={`${id}-fade`} x1="0" y1={FLOOR} x2="0" y2={FLOOR + RUNWAY} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={VB.x} y={FLOOR - 2} width={VB.w} height={RUNWAY + 2}>
          <rect x={VB.x} y={FLOOR - 2} width={VB.w} height={RUNWAY + 2} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>

      {/* light: inside the opening, and spilled on the floor at the threshold */}
      <motion.g data-reveal="" style={{ opacity: glow }}>
        <rect x={OPEN.l} y={OPEN.t} width={OPEN.r - OPEN.l} height={FLOOR - OPEN.t} fill={`url(#${id}-in)`} />
        <ellipse cx="204" cy={FLOOR} rx="360" ry="130" fill={`url(#${id}-floor)`} clipPath={`url(#${id}-below)`} />
      </motion.g>

      <DrawPath d={FLOOR_LINE} progress={progress} range={[0.3, 0.75]} className={INK_FLOOR} />
      <g mask={`url(#${id}-mask)`}>
        <DrawPath d={RUNWAY_EDGES} progress={progress} range={[0.45, 0.85]} className={INK_SOFT} />
        <DrawPath d={JOINTS} progress={progress} range={[0.55, 0.95]} className={INK_FLOOR} />
      </g>

      <DrawPath d={FRAME} progress={progress} range={[0, 0.5]} strokeWidth={1.5} className={INK_FRAME} />
      <DrawPath d={LINTEL} progress={progress} range={[0.2, 0.55]} className={INK_SOFT} />
      <DrawPath d={RIM} progress={progress} range={[0.15, 0.6]} strokeWidth={1.5} className={INK_RIM} />
      <DrawPath d={COREP} progress={progress} range={[0.3, 0.7]} className={INK_CORE} />
      <DrawPath d={REVEAL} progress={progress} range={[0.5, 0.75]} className={INK_SOFT} />
    </svg>
  );
}

/**
 * The closer (#register): the live pill, "Build the / Impossible." standing
 * in the hero's portal door (drawn as an elevation that builds itself as the
 * section scrolls in, with ember light spilling on the floor), the
 * Register block (centred: this is a closer, not a hero) and the
 * date and venue in mono. No other buttons. The phone's sticky bar steps
 * aside here, so the block keeps its own button on phones.
 */
export default function CTASection() {
  const doorRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(doorRef, SECTION_OFFSETS.enter);

  return (
    <Sheet
      id="register"
      ruler={false}
      className="overflow-hidden py-10 text-center md:py-16 xl:py-16"
      containerClassName="flex flex-col items-center"
    >
      {/* the pill and heading stand in the doorway; the floor is under them */}
      <div ref={doorRef} className="relative flex w-full flex-col items-center pb-3 pt-2 md:pb-6">
        <PortalDoor progress={progress} />

        <Reveal className="relative inline-flex items-center gap-3 border border-ember/60 bg-background/85 px-4 py-2 md:gap-3.5 md:px-5 md:py-3">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="absolute -inset-1 animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full border border-ember motion-reduce:animate-none" />
            <span className="relative h-2 w-2 rounded-full bg-ember shadow-[0_0_10px_hsl(var(--ember)/0.9)]" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ember md:text-sm md:tracking-[0.26em]">
            {/* On a narrow phone it breaks at the middot, never inside a phrase. */}
            {s.pill.split(" · ").map((part, i) => (
              <span key={part}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{part}</span>
              </span>
            ))}
          </span>
        </Reveal>

        <DisplayHeading
          size="hero"
          lines={[s.lines[0], <span key="impossible" className="ember-text">{s.lines[1]}</span>]}
          className="relative mt-5 text-[clamp(3.5rem,0.25rem+13.5vw,8.5rem)] md:mt-8"
        />

      </div>

      {/* From lg each note line gets the width to stay on one line. */}
      <Reveal delay={0.2} className="relative mt-6 md:mt-7">
        <RegisterBlock
          align="center"
          buttonClassName="min-h-[52px] px-10 py-4 text-sm"
          className="gap-5 md:gap-6 lg:[&_li]:max-w-[40rem]"
        />
      </Reveal>

      <Reveal
        as="p"
        delay={0.3}
        className="relative mt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-concrete md:mt-8 md:text-[11px] md:leading-loose md:tracking-[0.24em]"
      >
        {/* Breaks only between the parts, never inside the date or the street. */}
        {s.meta.map((part, i) => (
          <span key={part}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">{part}</span>
          </span>
        ))}
      </Reveal>
    </Sheet>
  );
}
