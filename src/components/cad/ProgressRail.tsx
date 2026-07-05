import { motion, useTransform, type MotionValue } from "framer-motion";
import { RAIL_COUNT } from "@/config/scenes";

interface ProgressRailProps {
  progress: MotionValue<number>;
}

// Scenes map across scroll as index/(SCENES-1) = index/7. The rail shows
// scenes 01–07 (index 0–6); scene 08 is the outro and has no dot.
const SCENE_DENOM = 7;

/** Right-edge scene indicator (01–07) from the reference. */
export default function ProgressRail({ progress }: ProgressRailProps) {
  return (
    <div className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
      {Array.from({ length: RAIL_COUNT }).map((_, i) => (
        <RailDot key={i} index={i} progress={progress} />
      ))}
    </div>
  );
}

function RailDot({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const center = index / SCENE_DENOM;
  const active = useTransform(progress, (p) => (Math.abs(p - center) < 0.5 / SCENE_DENOM ? 1 : 0));
  const labelOpacity = useTransform(active, [0, 1], [0.35, 1]);
  const dotOpacity = useTransform(active, [0, 1], [0, 1]);

  return (
    <div className="flex items-center gap-2">
      <motion.span
        style={{ opacity: labelOpacity }}
        className="font-mono text-[10px] tracking-[0.2em] text-foreground"
      >
        {String(index + 1).padStart(2, "0")}
      </motion.span>
      <span className="relative flex h-[7px] w-[7px] items-center justify-center rounded-full border border-foreground/40">
        <motion.span
          style={{ opacity: dotOpacity }}
          className="h-[3px] w-[3px] rounded-full bg-sketch shadow-[0_0_8px_hsl(212_100%_65%)]"
        />
      </span>
    </div>
  );
}
