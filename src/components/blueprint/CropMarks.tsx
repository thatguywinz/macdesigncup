import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface CropMarksProps {
  /** Distance of the trim corners from the parent's edges. A number is px
   *  (marks keep their desktop size). Default: 14px on phones, 28px from `md`,
   *  with smaller marks on phones. The parent must be positioned. */
  inset?: number;
  className?: string;
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/**
 * Printer's crop marks at the four corners of the positioned parent: two
 * short hairlines just outside each trim corner (global `.crop-mark` class).
 * `<Sheet>` renders these itself; use this for any other drawing plate.
 *
 * @example
 * <figure className="draft-panel relative p-10"><CropMarks inset={12} />…</figure>
 */
export default function CropMarks({ inset, className }: CropMarksProps) {
  const fixed = typeof inset === "number";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        !fixed && "[--crop-inset:14px] md:[--crop-inset:28px]",
        className,
      )}
      style={fixed ? ({ "--crop-inset": `${inset}px` } as CSSProperties) : undefined}
    >
      {CORNERS.map((c) => (
        <span
          key={c}
          className={cn(
            "crop-mark",
            `crop-mark--${c}`,
            !fixed && "[--crop-len:8px] [--crop-gap:4px] md:[--crop-len:14px] md:[--crop-gap:6px]",
          )}
          style={{
            [c[0] === "t" ? "top" : "bottom"]: "var(--crop-inset)",
            [c[1] === "l" ? "left" : "right"]: "var(--crop-inset)",
          }}
        />
      ))}
    </span>
  );
}
