import {
  BODY,
  CUP_BOTTOM,
  CX,
  HIGHLIGHT,
  HIGHLIGHT_FOOT,
  PLINTH,
  RIM,
  RIM_FRONT,
  RIM_R,
  RIM_Y,
  SILHOUETTE_LEFT,
  SILHOUETTE_RIGHT,
  SPOT,
  TILT,
  VIEWPORT,
} from "./cupGeometry";

/**
 * Gradients for the lit render, the plinth and the spotlight. Render once per
 * `<svg>`; every id is prefixed with `id`.
 */
export function CupDefs({ id }: { id: string }) {
  return (
    <defs>
      {/* Body: lit from the front left by the portal's ember light, falling to shadow on the right. */}
      <linearGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" x1={CX - RIM_R} y1="0" x2={CX + RIM_R} y2="0">
        <stop offset="0" stopColor="hsl(14, 90%, 16%)" />
        <stop offset="0.16" stopColor="hsl(18, 94%, 34%)" />
        <stop offset="0.3" stopColor="hsl(24, 100%, 52%)" />
        <stop offset="0.38" stopColor="hsl(34, 100%, 72%)" />
        <stop offset="0.47" stopColor="hsl(26, 100%, 55%)" />
        <stop offset="0.72" stopColor="hsl(16, 90%, 28%)" />
        <stop offset="1" stopColor="hsl(220, 8%, 6%)" />
      </linearGradient>
      {/* Top-lit: the stem and foot sit a little deeper in shadow. */}
      <linearGradient id={`${id}-shade`} gradientUnits="userSpaceOnUse" x1="0" y1={RIM_Y} x2="0" y2={CUP_BOTTOM}>
        <stop offset="0" stopColor="hsl(220, 8%, 4%)" stopOpacity="0" />
        <stop offset="0.55" stopColor="hsl(220, 8%, 4%)" stopOpacity="0.1" />
        <stop offset="1" stopColor="hsl(220, 8%, 4%)" stopOpacity="0.5" />
      </linearGradient>
      {/* Inside of the bowl: the far wall catches the light. */}
      <linearGradient
        id={`${id}-inner`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1={RIM_Y - RIM_R * TILT}
        x2="0"
        y2={RIM_Y + RIM_R * TILT}
      >
        <stop offset="0" stopColor="hsl(28, 100%, 58%)" />
        <stop offset="0.5" stopColor="hsl(14, 92%, 24%)" />
        <stop offset="1" stopColor="hsl(220, 8%, 5%)" />
      </linearGradient>
      <radialGradient id={`${id}-shadow`}>
        <stop offset="0" stopColor="hsl(220, 8%, 2%)" stopOpacity="0.85" />
        <stop offset="1" stopColor="hsl(220, 8%, 2%)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-plinth`} gradientUnits="userSpaceOnUse" x1="176" y1="0" x2="344" y2="0">
        <stop offset="0" stopColor="hsl(220, 7%, 17%)" />
        <stop offset="0.45" stopColor="hsl(220, 7%, 11%)" />
        <stop offset="1" stopColor="hsl(220, 8%, 5%)" />
      </linearGradient>
      <linearGradient id={`${id}-spot`} gradientUnits="userSpaceOnUse" x1="0" y1="78" x2="0" y2="356">
        <stop offset="0" stopColor="hsl(32, 100%, 70%)" stopOpacity="0.42" />
        <stop offset="1" stopColor="hsl(24, 100%, 54%)" stopOpacity="0.06" />
      </linearGradient>
      <radialGradient id={`${id}-pool`}>
        <stop offset="0" stopColor="hsl(30, 100%, 62%)" stopOpacity="0.55" />
        <stop offset="1" stopColor="hsl(24, 100%, 54%)" stopOpacity="0" />
      </radialGradient>
      {/* The blank file's ground grid fades out toward its edges, as a
          viewport's does: apply with mask="url(#<id>-vp-fade)". */}
      <radialGradient id={`${id}-vp-glow`}>
        <stop offset="0" stopColor="#fff" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.8" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id={`${id}-vp-fade`} maskUnits="userSpaceOnUse" x="10" y="10" width="500" height="580">
        <rect {...VIEWPORT.fade} fill={`url(#${id}-vp-glow)`} />
      </mask>
    </defs>
  );
}

/** Soft floor shadow under the cup (in cup space). */
export function CupShadow({ id }: { id: string }) {
  return <ellipse cx={CX} cy={CUP_BOTTOM + 4} rx={124} ry={18} fill={`url(#${id}-shadow)`} />;
}

/**
 * The solid, ember-lit render of the cup: gradient body, lit bowl interior,
 * rim lip and a specular streak. `unit` scales stroke widths for small copies.
 */
export function CupRender({ id, unit = 1 }: { id: string; unit?: number }) {
  return (
    <g>
      <path d={BODY} fill={`url(#${id}-body)`} />
      <path d={BODY} fill={`url(#${id}-shade)`} />
      <path d={RIM} fill={`url(#${id}-inner)`} />
      <path d={RIM} fill="none" stroke="hsl(30, 100%, 72%)" strokeOpacity={0.55} strokeWidth={unit} />
      <path d={RIM_FRONT} fill="none" stroke="hsl(38, 100%, 86%)" strokeOpacity={0.9} strokeWidth={1.6 * unit} />
      <path
        d={HIGHLIGHT}
        fill="none"
        stroke="hsl(40, 100%, 92%)"
        strokeOpacity={0.22}
        strokeWidth={10 * Math.min(unit, 1.4)}
        strokeLinecap="round"
      />
      <path
        d={HIGHLIGHT}
        fill="none"
        stroke="hsl(40, 100%, 96%)"
        strokeOpacity={0.75}
        strokeWidth={2.2 * unit}
        strokeLinecap="round"
      />
      <path
        d={HIGHLIGHT_FOOT}
        fill="none"
        stroke="hsl(40, 100%, 92%)"
        strokeOpacity={0.6}
        strokeWidth={1.8 * unit}
        strokeLinecap="round"
      />
      <path
        d={`${SILHOUETTE_LEFT} ${SILHOUETTE_RIGHT}`}
        fill="none"
        stroke="hsl(14, 92%, 30%)"
        strokeOpacity={0.9}
        strokeWidth={unit}
      />
    </g>
  );
}

/** The plinth's filled faces (strokes are drawn separately so they can draw in). */
export function PlinthFill({ id }: { id: string }) {
  const { cx, cy, rx, ry } = PLINTH.top;
  return (
    <g>
      <path d={PLINTH.front} fill={`url(#${id}-plinth)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="hsl(220, 7%, 13%)" />
    </g>
  );
}

/** The light pool on the plinth top. */
export function SpotPool({ id }: { id: string }) {
  const { cx, cy, rx, ry } = PLINTH.top;
  return <ellipse cx={cx} cy={cy} rx={rx - 6} ry={ry - 3} fill={`url(#${id}-pool)`} />;
}

/** The spotlight cone fill. */
export function SpotCone({ id }: { id: string }) {
  return <path d={SPOT.cone} fill={`url(#${id}-spot)`} />;
}
