import { motion, useTransform, type MotionValue } from "framer-motion";
import DimensionLine from "./DimensionLine";

interface CADOverlayProps {
  progress: MotionValue<number>;
}

const S = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => i / 7);

// Object anchor in the viewport (matches HeroScene object offset / vignette center).
const ANCHOR = { left: "63%", top: "46%" };

/** Screen-space CAD annotations that track the object as scroll morphs it. */
export default function CADOverlay({ progress }: CADOverlayProps) {
  const oOrigin = useSceneOpacity(progress, S[0], 0.045, 0.055);
  const oSketch = useSceneOpacity(progress, S[1], 0.04, 0.05);
  const oForm = useSceneOpacity(progress, S[2], 0.045, 0.055);
  const oProto = useSceneOpacity(progress, S[4], 0.045, 0.055);
  const oTurn = useSceneOpacity(progress, S[6], 0.045, 0.055);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 hidden md:block" aria-hidden="true">
      <Glow opacity={oOrigin} />
      <Glow opacity={oTurn} />

      {/* Anchor point (zero-size); children position relative to it. */}
      <div className="absolute" style={{ left: ANCHOR.left, top: ANCHOR.top }}>
        {/* ── Scene 01: origin crosshair + coordinate readout ── */}
        <Centered opacity={oOrigin}>
          <Crosshair />
        </Centered>
        <motion.div style={{ opacity: oOrigin }} className="absolute left-[24px] top-[30px] whitespace-nowrap">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-foreground/85">
            <PlusMark />
            <span>(0.000, 0.000, 0.000)</span>
          </div>
          <div className="mt-1 pl-6 font-mono text-[10px] uppercase tracking-[0.28em] text-sketch">
            Origin Point
          </div>
        </motion.div>

        {/* ── Scene 02: sketch circle + drawing arc ── */}
        <Centered opacity={oSketch}>
          <SketchMark progress={progress} />
        </Centered>

        {/* ── Scene 03 (FORM): dims 72.18 / 98.32 ── */}
        <motion.div style={{ opacity: oForm }}>
          <div className="absolute" style={{ left: "-215px", top: "-105px" }}>
            <DimensionLine orientation="v" length={210} value="72.18" />
          </div>
          <div className="absolute" style={{ left: "-120px", top: "155px" }}>
            <DimensionLine orientation="h" length={240} value="98.32" />
          </div>
        </motion.div>

        {/* ── Scene 05 (PROTOTYPE): dims 120.00 / 85.00 ── */}
        <motion.div style={{ opacity: oProto }}>
          <div className="absolute" style={{ left: "-205px", top: "-120px" }}>
            <DimensionLine orientation="v" length={230} value="120.00" />
          </div>
          <div className="absolute" style={{ left: "80px", top: "150px" }}>
            <DimensionLine orientation="h" length={150} value="85.00" />
          </div>
        </motion.div>

        {/* ── Scene 07 (YOUR TURN): viewport corner ticks ── */}
        <Centered opacity={oTurn}>
          <ViewportCorners size={360} />
        </Centered>
      </div>
    </div>
  );
}

function useSceneOpacity(progress: MotionValue<number>, center: number, hold: number, fade: number) {
  return useTransform(
    progress,
    [center - hold - fade, center - hold, center + hold, center + hold + fade],
    [0, 1, 1, 0],
  );
}

/** Centers its child on the anchor point (single translate, no internal offset). */
function Centered({ opacity, children }: { opacity: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div style={{ opacity }} className="absolute -translate-x-1/2 -translate-y-1/2">
      {children}
    </motion.div>
  );
}

function Glow({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div
      style={{
        opacity,
        left: ANCHOR.left,
        top: ANCHOR.top,
        background: "radial-gradient(circle, rgba(90,169,255,0.5) 0%, rgba(90,169,255,0.1) 34%, transparent 68%)",
      }}
      className="absolute h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 blur-[2px]"
    />
  );
}

function Crosshair() {
  const c = "rgba(125,192,255,0.45)";
  return (
    <svg width={300} height={300} viewBox="0 0 300 300" style={{ overflow: "visible" }}>
      <line x1={0} y1={150} x2={300} y2={150} stroke={c} strokeWidth={0.75} strokeDasharray="2 5" />
      <line x1={150} y1={0} x2={150} y2={300} stroke={c} strokeWidth={0.75} strokeDasharray="2 5" />
    </svg>
  );
}

function SketchMark({ progress }: { progress: MotionValue<number> }) {
  const r = 250;
  const size = r * 2 + 40;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = useTransform(progress, [S[1] - 0.075, S[1] - 0.01], [circ, circ * 0.7]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(226,229,234,0.16)" strokeWidth={1} strokeDasharray="3 6" />
      <motion.circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="hsl(212 100% 65%)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={circ}
        style={{
          strokeDashoffset: dashOffset,
          filter: "drop-shadow(0 0 6px hsl(212 100% 65%))",
          transform: "rotate(-90deg)",
          transformOrigin: "center",
        }}
      />
      <circle cx={cx} cy={cx} r={3} fill="hsl(212 100% 65%)" />
    </svg>
  );
}

function PlusMark() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14">
      <circle cx={7} cy={7} r={6} fill="none" stroke="hsl(212 100% 65%)" strokeWidth={1} />
      <line x1={7} y1={2} x2={7} y2={12} stroke="hsl(212 100% 65%)" strokeWidth={1} />
      <line x1={2} y1={7} x2={12} y2={7} stroke="hsl(212 100% 65%)" strokeWidth={1} />
    </svg>
  );
}

function ViewportCorners({ size }: { size: number }) {
  const len = 26;
  const c = "rgba(226,229,234,0.5)";
  const corner = (x: number, y: number, dx: number, dy: number) => (
    <g>
      <line x1={x} y1={y} x2={x + dx * len} y2={y} stroke={c} strokeWidth={1} />
      <line x1={x} y1={y} x2={x} y2={y + dy * len} stroke={c} strokeWidth={1} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {corner(0, 0, 1, 1)}
      {corner(size, 0, -1, 1)}
      {corner(0, size, 1, -1)}
      {corner(size, size, -1, -1)}
    </svg>
  );
}
