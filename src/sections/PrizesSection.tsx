import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import CountUp from "@/components/motion/CountUp";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { PRIZE_POOL_NUMBER } from "@/config/site";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/content/copy";
import PrinterDrawing from "./prizes/PrinterDrawing";
import PrizeGroups from "./prizes/PrizeGroups";

/**
 * 02 · Prizes. The pool counts up in the heading; the visual anchor is the
 * 1st-place printer, drawn isometric and built by scroll; the 1st-place
 * legend (the only place its facts are written) and the rest of the table as
 * three tight ledgers sit beside it (spec 5.2). Nothing is said twice: the
 * "1st place" mark shows once per width (the legend's eyebrow below `xl`, the
 * drawing's ember dimension from `xl`).
 *
 * Layout: phones put a smaller drawing plate beside the legend (the same
 * pairing tablets get, at pocket size), then the ledgers. Tablets and small
 * laptops put the legend beside the drawing and the ledgers three across
 * under both. From `xl` the heading runs in one line over two columns: the
 * drawing plate on the left, stretched to the height of the legend plus the
 * ledgers on the right, so neither column leaves a hole.
 */
// The figure's final text, exactly as CountUp renders it (its default format).
const POOL_TEXT = `$${Math.round(PRIZE_POOL_NUMBER).toLocaleString("en-CA")}+`;

/**
 * The counting figure, sized by its final text. CountUp holds its box at the
 * width it measures on mount, which can be before Anton has loaded (a wider
 * fallback face): harmless on its own line, but a hole in the middle of the
 * one-line heading. Here an invisible `::after` copy of the final text (not
 * part of the heading's text content) sets the width instead, so "in prizes."
 * sits a word space after the figure and never moves while it counts.
 */
function PoolFigure() {
  return (
    <span
      data-final={POOL_TEXT}
      className="inline-grid tabular-nums after:invisible after:content-[attr(data-final)] after:[grid-area:1/1] [&>*]:!min-w-0 [&>*]:[grid-area:1/1]"
    >
      <CountUp to={PRIZE_POOL_NUMBER} prefix="$" suffix="+" />
    </span>
  );
}

export default function PrizesSection() {
  const s = SECTIONS.prizes;
  return (
    <Sheet id="prizes" eyebrow={s.eyebrow}>
      <DisplayHeading
        lines={[<PoolFigure key="pool" />, s.lines[1]]}
        outline={s.outline}
        // One line from `md` (the two bands sit side by side); two on phones.
        className="text-[clamp(3.4rem,0.5rem+7.2vw,7.25rem)] leading-[0.88] md:text-[clamp(3.4rem,0.6rem+5.6vw,6.5rem)] md:[&>.display-line]:inline-block"
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-x-4 gap-y-7 sm:gap-x-6 md:mt-10 md:grid-cols-12 md:gap-x-10 md:gap-y-14 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] xl:gap-x-14 xl:gap-y-0">
        <PrinterDrawing className="w-full md:col-span-7 xl:col-span-1" />

        {/* `contents` below xl: the legend and the ledgers are grid items of
            their own there; from xl this is the right-hand column. */}
        <div className="contents xl:block">
          <Reveal delay={0.12} className="min-w-0 self-center md:col-span-5 md:max-w-md xl:max-w-none">
            <FirstPlace />
          </Reveal>
          <FoldedLedgers />
        </div>
      </div>
    </Sheet>
  );
}

/**
 * The 1st-place legend: the prize in words, next to its drawing. From `xl`
 * the drawing's ember dimension shows "1st place", so the eyebrow stays for
 * screen readers and crawlers only.
 */
function FirstPlace() {
  const f = SECTIONS.prizes.firstPlace;
  return (
    <div className="border-t border-ember/60 pt-3 sm:pt-5">
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ember sm:mb-3 sm:text-[11px] sm:tracking-[0.28em] xl:sr-only">
        {f.label}
      </p>
      <p className="text-balance font-display text-[1.45rem] uppercase leading-[1.02] text-foreground sm:text-[2rem] md:text-[2.5rem]">
        {f.item}
      </p>
      <p className="mt-2 max-w-[30rem] font-body text-[13px] font-light leading-snug text-foreground/75 sm:mt-3 sm:text-base sm:leading-relaxed">
        {f.detail}
      </p>
    </div>
  );
}

/**
 * The rest of the table. Phones see 1st place and a "Full prize table"
 * toggle; the ledgers stay in the HTML (crawlers, no-JS readers and the FAQ
 * answer's facts are unchanged) and open in place. From md they always show.
 */
function FoldedLedgers() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const t = SECTIONS.prizes.toggle;
  return (
    <div className="col-span-2 md:col-span-12 xl:mt-7">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="focus-ember flex min-h-[44px] w-full items-center justify-between gap-3 border-y border-bone/20 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/85 transition-colors hover:text-ember md:hidden"
      >
        {open ? t.hide : t.show}
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.5}
          className={cn("shrink-0 text-ember transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <PrizeGroups id={id} className={cn(open ? "mt-4" : "max-md:hidden", "md:mt-0")} />
    </div>
  );
}
