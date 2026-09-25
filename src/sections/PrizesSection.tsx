import Sheet from "@/components/blueprint/Sheet";
import CountUp from "@/components/motion/CountUp";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { PRIZE_POOL_NUMBER } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import PrinterDrawing from "./prizes/PrinterDrawing";
import PrizeGroups from "./prizes/PrizeGroups";

/**
 * Prizes. The pool counts up in the heading; the visual anchor is the
 * 1st-place printer, drawn isometric and built by scroll, with the 1st-place
 * legend and the rest of the table beside it.
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
 * part of the heading's text content) sets the width instead, so "in prizes"
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
    <Sheet id="prizes">
      <DisplayHeading
        lines={[<PoolFigure key="pool" />, s.lines[1]]}
        // One line: the two bands sit side by side.
        className="[&>.display-line]:inline-block"
      />

      <div className="mt-10 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-x-5 gap-y-12 sm:gap-x-8 md:mt-14 md:grid-cols-12 md:gap-x-12 md:gap-y-16 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-x-20 xl:gap-y-0">
        <PrinterDrawing className="w-full md:col-span-7 xl:col-span-1" />

        {/* `contents` below xl: the legend and the list are grid items of
            their own there; from xl this is the right-hand column. */}
        <div className="contents xl:block">
          <Reveal delay={0.12} className="min-w-0 self-center md:col-span-5 md:max-w-md xl:max-w-none">
            <FirstPlace />
          </Reveal>
          <PrizeGroups className="col-span-2 md:col-span-12 xl:mt-14" />
        </div>
      </div>
    </Sheet>
  );
}

/** The 1st-place legend: the value, the prize under it, next to its drawing. */
function FirstPlace() {
  const f = SECTIONS.prizes.firstPlace;
  return (
    <div>
      <p className="font-body text-sm text-concrete">{f.label}</p>
      <p className="mt-1 font-body text-[2.25rem] font-semibold leading-none tracking-[-0.03em] text-ember sm:text-[3rem] xl:text-[3.5rem]">
        {f.value}
      </p>
      <p className="mt-3 text-balance font-body text-lg font-medium leading-snug text-foreground sm:text-xl md:text-2xl">
        {f.item}
      </p>
      <p className="mt-1 font-body text-[15px] leading-snug text-foreground/70 sm:text-base">{f.detail}</p>
    </div>
  );
}
