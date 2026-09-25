import { useEffect, useId, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import DrawPath from "@/components/motion/DrawPath";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";
import {
  AXIS,
  cupTransform,
  DIM_DIA,
  DIM_H,
  FOOT_FRONT,
  GUIDES,
  HATCH,
  MERIDIANS_BACK,
  MERIDIANS_FRONT,
  PLINTH,
  PRESENT,
  RIM,
  RINGS_BACK,
  RINGS_FRONT,
  SCREEN,
  SHEET,
  SILHOUETTE_LEFT,
  SILHOUETTE_RIGHT,
  SKETCH,
  SPOT,
  svgId,
  TAG,
  TAG_LEADER,
  VIEW_H,
  VIEW_W,
  VIEWPORT,
} from "./cupGeometry";
import { CupDefs, CupRender, CupShadow, PlinthFill, SpotCone, SpotPool } from "./CupRender";

// Step boundaries in scroll progress: step k is active over [k/5, (k+1)/5].
// Each drawing stage builds just before its step arrives and settles just after.

/** 0..1 blend of the cup onto the plinth, eased. */
const toPlinth = (p: number) => {
  const t = Math.min(1, Math.max(0, (p - 0.76) / 0.12));
  return t * t * (3 - 2 * t);
};

const INK = {
  sheet: "stroke-bone/45",
  furniture: "stroke-bone/35",
  sketch: "stroke-bone/75",
  hatch: "stroke-bone/40",
  construct: "stroke-bone/30",
  dim: "stroke-bone/55",
  wire: "stroke-bone/55",
  edge: "stroke-bone/85",
  ember: "stroke-ember/85",
  frame: "stroke-bone/80",
  frameThin: "stroke-bone/30",
};

export interface CupFigureProps {
  /** 0..1 through the five steps (the scrollytelling list). */
  progress: MotionValue<number>;
  /** 0..1 as the sheet scrolls into view (draws the blank sheet). */
  enter: MotionValue<number>;
  className?: string;
}

/**
 * The Day section's one design object: a cup drawn on a drafting sheet that
 * evolves with the five steps. Blank file (an empty viewport: a ground grid
 * round the origin and a view cube, drawn as the sheet scrolls in, so it
 * never reads as a missing image), loose sketch with the theme tag,
 * construction lines and wireframe, a lit render in a presentation frame, and
 * finally the render on a plinth under a spotlight on the big screen. Every
 * change is scrubbed by scroll through motion values (no React state per
 * frame); reduced motion holds both progress values at 1, the final state.
 * Decorative: the steps beside it carry the information.
 */
export default function CupFigure({ progress: p, enter: e, className }: CupFigureProps) {
  const fig = SECTIONS.day.figure;
  const id = svgId(useId());
  const cupRef = useRef<SVGGElement>(null);

  // Sheet
  const gridO = useTransform(e, [0.25, 0.9], [0, 1]);
  const crossO = useTransform(p, [0.1, 0.18], [1, 0]);
  // Stage 2: sketch + theme tag
  const sketchO = useTransform(p, [0.42, 0.5, 0.56, 0.62], [1, 0.3, 0.3, 0]);
  const tagO = useTransform(p, [0.15, 0.22, 0.56, 0.62], [0, 1, 1, 0]);
  const tagY = useTransform(p, [0.15, 0.22], [-10, 0]);
  // Stage 3: construction + wireframe
  const consO = useTransform(p, [0.58, 0.64, 0.72, 0.78], [1, 0.3, 0.3, 0]);
  const dimTextO = useTransform(p, [0.37, 0.43], [0, 1]);
  const backO = useTransform(p, [0.44, 0.5, 0.56, 0.62], [0, 1, 1, 0]);
  const wireO = useTransform(p, [0.58, 0.66, 0.74, 0.8], [1, 0.2, 0.2, 0]);
  // Stage 4: render + presentation frame
  const renderO = useTransform(p, [0.56, 0.66], [0, 1]);
  const shadowO = useTransform(p, [0.56, 0.66, 0.76, 0.8], [0, 1, 1, 0]);
  const presentO = useTransform(p, [0.76, 0.82], [1, 0]);
  const dotsO = useTransform(p, [0.66, 0.72], [0, 1]);
  // Stage 5: plinth, spotlight, big screen
  const plinthO = useTransform(p, [0.8, 0.87], [0, 1]);
  const spotO = useTransform(p, [0.84, 0.92], [0, 1]);
  const poolO = useTransform(p, [0.86, 0.94], [0, 1]);

  // The cup's move onto the plinth: an SVG transform written through a ref.
  useEffect(() => {
    const g = cupRef.current;
    if (!g) return;
    let last = -1;
    const apply = (v: number) => {
      const t = Math.round(toPlinth(v) * 1000) / 1000;
      if (t === last) return;
      last = t;
      g.setAttribute("transform", cupTransform(t));
    };
    apply(p.get());
    return p.on("change", apply);
  }, [p]);

  // A path per entry, drawn in sequence across [a, b].
  const seq = (paths: readonly string[], a: number, b: number, span: number, cls: string, w = 1) =>
    paths.map((d, i) => {
      const step = paths.length > 1 ? (b - a - span) / (paths.length - 1) : 0;
      const s = a + i * step;
      return <DrawPath key={i} d={d} progress={p} range={[s, s + span]} className={cls} strokeWidth={w} />;
    });

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn("block h-auto w-full overflow-visible", className)}
      aria-hidden="true"
      focusable="false"
    >
      <CupDefs id={id} />
      <defs>
        <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 H0 V20" fill="none" className="stroke-bone/[0.08]" strokeWidth="1" />
        </pattern>
        <pattern id={`${id}-grid-major`} width="100" height="100" patternUnits="userSpaceOnUse" x="10" y="10">
          <path d="M100 0 H0 V100" fill="none" className="stroke-bone/[0.14]" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── The blank sheet (draws in as it scrolls into view) ── */}
      <rect x="10" y="10" width="500" height="580" className="fill-background/75" />
      <motion.g data-cup="end" style={{ opacity: gridO }}>
        <rect x="10" y="10" width="500" height="580" fill={`url(#${id}-grid)`} />
        <rect x="10" y="10" width="500" height="580" fill={`url(#${id}-grid-major)`} />
      </motion.g>
      <DrawPath d={SHEET.border} progress={e} range={[0, 0.7]} className={INK.sheet} strokeWidth={1.25} />
      <DrawPath d={SHEET.titleBlock} progress={e} range={[0.35, 0.9]} className={INK.furniture} />
      <DrawPath d={SHEET.gizmoY} progress={e} range={[0.6, 0.85]} className="stroke-bone/40" strokeWidth={1.25} />
      <DrawPath d={SHEET.gizmoZ} progress={e} range={[0.65, 0.9]} className="stroke-bone/40" strokeWidth={1.25} />
      <DrawPath d={SHEET.gizmoX} progress={e} range={[0.7, 0.95]} className="stroke-ember/70" strokeWidth={1.25} />

      {/* ── Stage 5 backdrop: the big screen, the spotlight and the plinth ── */}
      <DrawPath d={SCREEN.cables} progress={p} range={[0.8, 0.88]} className="stroke-bone/35" />
      <DrawPath d={SCREEN.outer} progress={p} range={[0.76, 0.87]} className={INK.frame} strokeWidth={1.5} />
      <DrawPath d={SCREEN.inner} progress={p} range={[0.78, 0.89]} className="stroke-bone/25" />
      <motion.g data-cup="end" style={{ opacity: spotO }}>
        <SpotCone id={id} />
        <path d={SPOT.edges} fill="none" className="stroke-ember/35" strokeWidth={1} />
      </motion.g>
      <DrawPath d={SPOT.lamp} progress={p} range={[0.82, 0.88]} className="stroke-bone/70" strokeWidth={1.25} />
      <motion.g data-cup="end" style={{ opacity: plinthO }}>
        <PlinthFill id={id} />
      </motion.g>
      <DrawPath d={PLINTH.edges} progress={p} range={[0.8, 0.88]} className="stroke-bone/60" strokeWidth={1.25} />
      <DrawPath d={PLINTH.topEllipse} progress={p} range={[0.8, 0.88]} className="stroke-bone/60" strokeWidth={1.25} />
      <motion.g data-cup="end" style={{ opacity: poolO }}>
        <SpotPool id={id} />
      </motion.g>

      {/* ── Stage 4: the presentation frame ── */}
      <motion.g data-cup="mid" style={{ opacity: presentO }}>
        <DrawPath d={PRESENT.frame} progress={p} range={[0.62, 0.72]} className={INK.frameThin} />
        {seq(PRESENT.brackets, 0.6, 0.7, 0.06, INK.frame, 1.5)}
        <motion.g style={{ opacity: dotsO }}>
          {PRESENT.dots.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={2.6} className={i === 1 ? "fill-ember" : "fill-bone/40"} />
          ))}
        </motion.g>
      </motion.g>

      {/* ── Stage 1: the blank file's viewport, ground grid, view cube and crosshair ── */}
      <motion.g data-cup="mid" style={{ opacity: crossO }}>
        <g mask={`url(#${id}-vp-fade)`}>
          <DrawPath d={VIEWPORT.cols} progress={e} range={[0.3, 0.75]} className="stroke-bone/35" />
          <DrawPath d={VIEWPORT.rows} progress={e} range={[0.4, 0.85]} className="stroke-bone/35" />
          <DrawPath d={VIEWPORT.axisZ} progress={e} range={[0.5, 0.85]} className="stroke-bone/50" />
          <DrawPath d={VIEWPORT.axisX} progress={e} range={[0.5, 0.85]} className="stroke-ember/60" />
        </g>
        <DrawPath d={VIEWPORT.cube.ring} progress={e} range={[0.55, 0.9]} className="stroke-bone/30" />
        <motion.g style={{ opacity: gridO }}>
          <path d={VIEWPORT.cube.faces} className="fill-background" />
          <path d={VIEWPORT.cube.top} className="fill-ember/15" />
        </motion.g>
        <DrawPath d={VIEWPORT.cube.edges} progress={e} range={[0.6, 0.95]} className="stroke-bone/60" strokeWidth={1.1} />
        <DrawPath d={SHEET.crosshair} progress={e} range={[0.55, 0.95]} className={INK.ember} strokeWidth={1.25} />
        <DrawPath d={SHEET.crosshairRing} progress={e} range={[0.7, 1]} className={INK.ember} strokeWidth={1.25} />
      </motion.g>

      {/* ── The cup (moves onto the plinth in stage 5) ── */}
      <g ref={cupRef} data-cup="move">
        <motion.g data-cup="mid" style={{ opacity: shadowO }}>
          <CupShadow id={id} />
        </motion.g>

        {/* Stage 2: loose sketch */}
        <motion.g data-cup="mid" style={{ opacity: sketchO }}>
          {seq(SKETCH, 0.13, 0.33, 0.07, INK.sketch, 1.3)}
          {seq(HATCH, 0.27, 0.36, 0.04, INK.hatch, 1)}
        </motion.g>

        {/* Stage 3: construction lines and dimensions */}
        <motion.g data-cup="mid" style={{ opacity: consO }}>
          <motion.path
            d={AXIS}
            fill="none"
            className={INK.construct}
            strokeWidth={1}
            strokeDasharray="18 5 3 5"
            style={{ opacity: dimTextO }}
          />
          {seq(GUIDES, 0.31, 0.41, 0.07, INK.construct)}
          <DrawPath d={DIM_DIA.ext} progress={p} range={[0.33, 0.4]} className={INK.dim} />
          <DrawPath d={DIM_DIA.line} progress={p} range={[0.35, 0.42]} className={INK.dim} />
          <DrawPath d={DIM_DIA.ticks} progress={p} range={[0.38, 0.43]} className={INK.dim} strokeWidth={1.25} />
          <DrawPath d={DIM_H.line} progress={p} range={[0.35, 0.42]} className={INK.dim} />
          <DrawPath d={DIM_H.ticks} progress={p} range={[0.38, 0.43]} className={INK.dim} strokeWidth={1.25} />
        </motion.g>

        {/* Stage 3: wireframe (hidden lines dashed) */}
        <motion.g data-cup="mid" style={{ opacity: backO }}>
          <path d={`${RINGS_BACK} ${MERIDIANS_BACK}`} fill="none" className="stroke-bone/25" strokeDasharray="3 5" />
        </motion.g>

        {/* Stage 4: the render */}
        <motion.g data-cup="end" style={{ opacity: renderO }}>
          <CupRender id={id} />
        </motion.g>

        <motion.g data-cup="mid" style={{ opacity: wireO }}>
          {seq(RINGS_FRONT, 0.36, 0.52, 0.06, INK.wire)}
          {seq(MERIDIANS_FRONT, 0.42, 0.54, 0.07, INK.wire)}
          <DrawPath d={SILHOUETTE_LEFT} progress={p} range={[0.35, 0.45]} className={INK.edge} strokeWidth={1.4} />
          <DrawPath d={SILHOUETTE_RIGHT} progress={p} range={[0.35, 0.45]} className={INK.edge} strokeWidth={1.4} />
          <DrawPath d={RIM} progress={p} range={[0.36, 0.46]} className={INK.edge} strokeWidth={1.4} />
          <DrawPath d={FOOT_FRONT} progress={p} range={[0.4, 0.47]} className={INK.edge} strokeWidth={1.4} />
        </motion.g>
      </g>

      {/* ── Stage 2: the theme tag, pinned to the sketch ── */}
      <motion.g data-cup="mid" style={{ opacity: tagO }}>
        <path d={TAG_LEADER} fill="none" className="stroke-ember/60" strokeWidth={1} strokeDasharray="2 3" />
        <g transform="translate(34 70) rotate(-5)">
          <motion.g style={{ y: tagY }}>
            <path d={TAG.outline} className="fill-background stroke-ember/90" strokeWidth={1.25} />
            <path d={TAG.hole} fill="none" className="stroke-ember/90" strokeWidth={1} />
            <text x={22} y={16.5} className="fill-ember font-mono uppercase" fontSize={11} fontWeight={700} letterSpacing={2.4}>
              {fig.theme}
            </text>
          </motion.g>
        </g>
      </motion.g>

    </svg>
  );
}
