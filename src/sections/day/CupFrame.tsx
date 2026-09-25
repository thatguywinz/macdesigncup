import { useId } from "react";
import DrawPath from "@/components/motion/DrawPath";
import { cn } from "@/lib/utils";
import {
  AXIS,
  cupTransform,
  DIM_DIA,
  DIM_H,
  FOOT_FRONT,
  MERIDIANS_FRONT,
  PLINTH,
  PRESENT,
  RIM,
  RINGS_FRONT,
  SCREEN,
  SHEET,
  SILHOUETTE_LEFT,
  SILHOUETTE_RIGHT,
  SKETCH,
  SPOT,
  svgId,
  TAG_LEADER,
  VIEW_H,
  VIEW_W,
  VIEWPORT,
} from "./cupGeometry";
import { CupDefs, CupRender, CupShadow, PlinthFill, SpotCone, SpotPool } from "./CupRender";

export interface CupFrameProps {
  /** 0 blank file, 1 sketch, 2 wireframe, 3 render, 4 big screen. */
  stage: 0 | 1 | 2 | 3 | 4;
  /** Smallest rendered width in px, so strokes stay about 1px there (the
   *  width itself comes from `className`). Default 80. */
  width?: number;
  className?: string;
}

/**
 * One frame of the cup's story at thumbnail size, for the compact timeline on
 * phones and tablets (no sticky scrollytelling there). Lines draw once on
 * view; reduced motion shows them drawn. Decorative.
 */
export default function CupFrame({ stage, width = 80, className }: CupFrameProps) {
  const id = svgId(useId());
  const u = VIEW_W / width; // viewBox units per screen px
  const draw = (d: string, cls: string, delay = 0, w = 1) => (
    <DrawPath d={d} className={cls} strokeWidth={w * u} delay={delay} duration={1.1} />
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn("block h-auto", className)}
      aria-hidden="true"
      focusable="false"
    >
      <CupDefs id={id} />
      <rect x="10" y="10" width="500" height="580" className="fill-background" />
      <path d={SHEET.border} fill="none" className="stroke-bone/40" strokeWidth={u} />
      <path d="M300 590 V540 H510" fill="none" className="stroke-bone/25" strokeWidth={u} />

      {stage === 0 && (
        <g>
          {/* An empty viewport: the ground grid (every other line at this size)
              around the origin, not an empty box. */}
          <g mask={`url(#${id}-vp-fade)`}>
            {draw(VIEWPORT.colsCoarse, "stroke-bone/40", 0)}
            {draw(VIEWPORT.rowsCoarse, "stroke-bone/40", 0.15)}
            {draw(VIEWPORT.axisZ, "stroke-bone/55", 0.2)}
            {draw(VIEWPORT.axisX, "stroke-ember/70", 0.2)}
          </g>
          {draw(SHEET.crosshair, "stroke-ember/90", 0.1, 1.2)}
          {draw(SHEET.crosshairRing, "stroke-ember/90", 0.3, 1.2)}
          {draw(SHEET.gizmoX, "stroke-ember/60", 0.4)}
          {draw(SHEET.gizmoY, "stroke-bone/40", 0.45)}
          {draw(SHEET.gizmoZ, "stroke-bone/40", 0.5)}
        </g>
      )}

      {stage === 1 && (
        <g>
          {SKETCH.slice(0, 6).map((d, i) => (
            <g key={i}>{draw(d, "stroke-bone/80", 0.08 * i)}</g>
          ))}
          <path d={TAG_LEADER} fill="none" className="stroke-ember/60" strokeWidth={u} />
          <rect
            x="34"
            y="70"
            width="78"
            height="24"
            transform="rotate(-5 34 70)"
            className="fill-ember/20 stroke-ember"
            strokeWidth={u}
          />
        </g>
      )}

      {stage === 2 && (
        <g>
          <path d={AXIS} fill="none" className="stroke-bone/30" strokeWidth={u} strokeDasharray={`${6 * u} ${2 * u}`} />
          <path d={`${DIM_DIA.line} ${DIM_H.line}`} fill="none" className="stroke-bone/40" strokeWidth={u} />
          {RINGS_FRONT.filter((_, i) => i % 2 === 0).map((d, i) => (
            <g key={`r${i}`}>{draw(d, "stroke-bone/55", 0.06 * i)}</g>
          ))}
          {MERIDIANS_FRONT.map((d, i) => (
            <g key={`m${i}`}>{draw(d, "stroke-bone/55", 0.2 + 0.06 * i)}</g>
          ))}
          {draw(SILHOUETTE_LEFT, "stroke-bone/90", 0, 1.2)}
          {draw(SILHOUETTE_RIGHT, "stroke-bone/90", 0, 1.2)}
          {draw(RIM, "stroke-bone/90", 0.1, 1.2)}
          {draw(FOOT_FRONT, "stroke-bone/90", 0.2, 1.2)}
        </g>
      )}

      {stage === 3 && (
        <g>
          <CupShadow id={id} />
          <CupRender id={id} unit={u * 0.8} />
          {PRESENT.brackets.map((d, i) => (
            <g key={i}>{draw(d, "stroke-bone/85", 0.08 * i, 1.2)}</g>
          ))}
        </g>
      )}

      {stage === 4 && (
        <g>
          <path d={SCREEN.cables} fill="none" className="stroke-bone/35" strokeWidth={u} />
          {draw(SCREEN.outer, "stroke-bone/85", 0, 1.2)}
          <SpotCone id={id} />
          <PlinthFill id={id} />
          <SpotPool id={id} />
          <path d={`${PLINTH.edges} ${PLINTH.topEllipse}`} fill="none" className="stroke-bone/60" strokeWidth={u} />
          <path d={SPOT.lamp} fill="none" className="stroke-bone/70" strokeWidth={u} />
          <g transform={cupTransform(1)}>
            <CupRender id={id} unit={u * 0.8 / 0.56} />
          </g>
        </g>
      )}
    </svg>
  );
}
