import Sheet from "@/components/blueprint/Sheet";
import CountUp from "@/components/motion/CountUp";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { PRIZE_POOL_NUMBER } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import PrinterDrawing from "./prizes/PrinterDrawing";
import PrizeGroups from "./prizes/PrizeGroups";

/**
 * 02 · Prizes. The pool counts up in the heading; the visual anchor is the
 * 1st-place printer, drawn isometric and built by scroll; the 1st-place
 * legend (its value set big) and the rest of the table as a few calm tiles
 * and chips sit beside it. Nothing is said twice: the
 * "1st place" mark shows once per width (the legend's eyebrow below `xl`, the
 * drawing's ember dimension from `xl`).
 *
 * Layout: phones put a smaller drawing plate beside the legend (the same
 * pairing tablets get, at pocket size), then the tiles and chips. Tablets and
 * small laptops put the legend beside the drawing and the rest under both.
 * From `xl` the heading runs in one line over two columns: the
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
        className="text-[clamp(2.6rem,0.4rem+6vw,5.5rem)] leading-[0.88] md:text-[clamp(2.6rem,0.45rem+4.3vw,5rem)] md:[&>.display-line]:inline-block"
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-x-4 gap-y-7 sm:gap-x-6 md:mt-10 md:grid-cols-12 md:gap-x-10 md:gap-y-14 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] xl:gap-x-14 xl:gap-y-0">
        <PrinterDrawing className="w-full md:col-span-7 xl:col-span-1" />

        {/* `contents` below xl: the legend and the ledgers are grid items of
            their own there; from xl this is the right-hand column. */}
        <div className="contents xl:block">
          <Reveal delay={0.12} className="min-w-0 self-center md:col-span-5 md:max-w-md xl:max-w-none">
            <FirstPlace />
          </Reveal>
          <PrizeGroups className="col-span-2 md:col-span-12 xl:mt-9" />
        </div>
      </div>
    </Sheet>
  );
}

/**
 * The 1st-place legend: the value set big, the prize under it, next to its
 * drawing. From `xl` the drawing's ember dimension shows "1st place", so the
 * eyebrow stays for screen readers and crawlers only.
 */
function FirstPlace() {
  const f = SECTIONS.prizes.firstPlace;
  return (
    <div className="border-t border-ember/60 pt-3 sm:pt-5">
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ember sm:mb-2 sm:text-[11px] sm:tracking-[0.28em] xl:sr-only">
        {f.label}
      </p>
      <p className="font-display text-[2.4rem] leading-[0.9] text-ember sm:text-[3.1rem] md:text-[3.6rem] xl:text-[4.25rem]">
        {f.value}
      </p>
      <p className="mt-2 text-balance font-display text-[1.1rem] uppercase leading-[1.02] text-foreground sm:mt-3 sm:text-[1.4rem] md:text-[1.6rem]">
        {f.item}
      </p>
      <p className="mt-1.5 font-body text-[14px] leading-snug text-foreground/75 sm:mt-2 sm:text-base">{f.detail}</p>
    </div>
  );
}
