interface DimensionLineProps {
  orientation: "v" | "h";
  length: number; // px
  value: string;
  className?: string;
  accent?: boolean;
}

/**
 * An engineering dimension line: main line + extension ticks + arrowheads + value.
 * Rendered as a self-sized SVG so it stays crisp at any DPR.
 */
export default function DimensionLine({
  orientation,
  length,
  value,
  accent = false,
}: DimensionLineProps) {
  const stroke = accent ? "hsl(212 100% 65%)" : "rgba(226,229,234,0.55)";
  const textColor = accent ? "hsl(212 100% 72%)" : "rgba(226,229,234,0.85)";
  const pad = 16;

  if (orientation === "v") {
    const w = 64;
    const h = length + pad * 2;
    const x = 40;
    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        {/* main line */}
        <line x1={x} y1={pad} x2={x} y2={pad + length} stroke={stroke} strokeWidth={1} />
        {/* end ticks */}
        <line x1={x - 5} y1={pad} x2={x + 5} y2={pad} stroke={stroke} strokeWidth={1} />
        <line x1={x - 5} y1={pad + length} x2={x + 5} y2={pad + length} stroke={stroke} strokeWidth={1} />
        {/* arrowheads */}
        <path d={`M${x},${pad} l-3,7 l6,0 z`} fill={stroke} />
        <path d={`M${x},${pad + length} l-3,-7 l6,0 z`} fill={stroke} />
        {/* value */}
        <text
          x={x - 10}
          y={pad + length / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontFamily='"Space Mono", monospace'
          fontSize={11}
          letterSpacing={1}
          fill={textColor}
        >
          {value}
        </text>
      </svg>
    );
  }

  const w = length + pad * 2;
  const h = 48;
  const y = 12;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <line x1={pad} y1={y} x2={pad + length} y2={y} stroke={stroke} strokeWidth={1} />
      <line x1={pad} y1={y - 5} x2={pad} y2={y + 5} stroke={stroke} strokeWidth={1} />
      <line x1={pad + length} y1={y - 5} x2={pad + length} y2={y + 5} stroke={stroke} strokeWidth={1} />
      <path d={`M${pad},${y} l7,-3 l0,6 z`} fill={stroke} />
      <path d={`M${pad + length},${y} l-7,-3 l0,6 z`} fill={stroke} />
      <text
        x={pad + length / 2}
        y={y + 20}
        textAnchor="middle"
        fontFamily='"Space Mono", monospace'
        fontSize={11}
        letterSpacing={1}
        fill={textColor}
      >
        {value}
      </text>
    </svg>
  );
}
