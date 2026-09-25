import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { DURATION, EASE, VIEWPORT_ONCE } from "@/components/motion/tokens";
import CropMarks from "./CropMarks";

/** Numbered sheets on the home page (01 At a glance … 06 FAQ). */
export const SHEET_COUNT = 6;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "02 · Prizes" -> { no: 2, name: "Prizes" }; anything else -> { name }. */
function parseEyebrow(eyebrow?: string): { no?: number; name?: string } {
  if (!eyebrow) return {};
  const m = /^\s*(\d{1,2})\s*·\s*(.+)$/.exec(eyebrow);
  return m ? { no: Number(m[1]), name: m[2].trim() } : { name: eyebrow };
}

export interface SheetEyebrowProps {
  /** e.g. `SECTIONS.prizes.eyebrow` ("02 · Prizes"). The number, if any, is set in ember. */
  children: string;
  className?: string;
}

/**
 * A section eyebrow: sheet number in ember, the name in bone, and a short
 * ember rule that draws in once on view. `<Sheet eyebrow>` renders this;
 * export it for pages that need the same mark outside a Sheet.
 *
 * @example
 * <SheetEyebrow>{SECTIONS.register.pill}</SheetEyebrow>
 */
export function SheetEyebrow({ children, className }: SheetEyebrowProps) {
  const reduced = useReducedMotionSafe();
  const { no, name } = parseEyebrow(children);
  return (
    <div className={cn("mb-7 flex items-center gap-4 md:mb-9", className)}>
      <p className="font-mono text-[11px] uppercase leading-none tracking-[0.26em] text-foreground/70">
        {no !== undefined && (
          <>
            <span className="text-ember">{pad2(no)}</span>
            <span className="mx-2.5 text-concrete/50" aria-hidden="true">
              ·
            </span>
          </>
        )}
        {name}
      </p>
      <motion.span
        aria-hidden="true"
        data-reveal=""
        className="block h-px w-12 origin-left bg-ember/60 md:w-20"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        animate={reduced ? { scaleX: 1 } : undefined}
        viewport={VIEWPORT_ONCE}
        transition={reduced ? { duration: 0 } : { duration: DURATION.draw * 0.8, ease: EASE, delay: 0.2 }}
      />
    </div>
  );
}

export interface SheetProps extends Omit<ComponentPropsWithoutRef<"section">, "id" | "title" | "children"> {
  /** Section anchor (`glance`, `prizes`, `sponsors`, `day`, `teachers`, `faq`, `register`). */
  id: string;
  /** Section eyebrow from copy.ts, e.g. `SECTIONS.prizes.eyebrow` ("02 · Prizes").
   *  Omit to render no eyebrow. */
  eyebrow?: string;
  /** Desktop (`lg`+) left ruler. Default `true`. */
  ruler?: boolean;
  /** Corner crop marks. Default `true`. */
  marks?: boolean;
  /** Classes for the inner max-width container (default `max-w-[1300px]`). */
  containerClassName?: string;
  children?: ReactNode;
}

/**
 * The section shell: one drawing sheet. Renders `<section id>` with the
 * site's section padding (`py-12 md:py-16 xl:py-20`, `px-5 md:px-10 lg:px-16`), crop
 * marks at its four corners, a desktop-only left ruler, then a centred
 * `max-w-[1300px]` container holding the eyebrow and your children.
 * Extra props (`aria-labelledby`, `data-*`, `style`) go on the `<section>`.
 *
 * @example
 * <Sheet id="prizes" eyebrow={SECTIONS.prizes.eyebrow}>
 *   <DisplayHeading lines={SECTIONS.prizes.lines} outline={SECTIONS.prizes.outline} />
 * </Sheet>
 */
export default function Sheet({
  id,
  eyebrow,
  ruler = true,
  marks = true,
  className,
  containerClassName,
  children,
  ...rest
}: SheetProps) {

  return (
    <section
      id={id}
      // overflow-x: clip keeps crop marks on full-width plates (they sit ~20px
      // outside their corner) from widening the page on phones. `clip` is not
      // a scroll container, so sticky children (The day, FAQ) keep sticking.
      className={cn("relative overflow-x-clip px-5 py-12 md:px-10 md:py-16 lg:px-16 xl:py-20", className)}
      {...rest}
    >
      {marks && <CropMarks />}

      {ruler && (
        <span
          aria-hidden="true"
          className="draft-ruler-y pointer-events-none absolute bottom-24 left-7 top-24 hidden lg:block"
          style={{
            WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)",
            maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)",
          }}
        />
      )}


      <div className={cn("relative mx-auto w-full max-w-[1300px]", containerClassName)}>
        {eyebrow && <SheetEyebrow>{eyebrow}</SheetEyebrow>}
        {children}
      </div>
    </section>
  );
}
