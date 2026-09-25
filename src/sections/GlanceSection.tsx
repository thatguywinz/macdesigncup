import { ArrowUpRight } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import Countdown from "@/components/Countdown";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { VENUE_MAP_URL } from "@/config/site";
import { CTA, SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";
import PathBand from "./glance/PathBand";
import SpecGlyph, { type SpecGlyphKind } from "./glance/SpecGlyph";

const CELLS: SpecGlyphKind[] = ["when", "where", "who", "cost"];

/**
 * 01 · At a glance. The first sheet after the hero: its top edge still holds
 * the portal's light, then the theme line beside the launch clock, the
 * "Pick your path" band (students and teachers register on one form,
 * partners go to /partner), and
 * a four-cell spec strip (When / Where / Who / Cost) whose glyphs draw in.
 */
export default function GlanceSection() {
  const s = SECTIONS.glance;
  return (
    <Sheet
      id="glance"
      eyebrow={s.eyebrow}
      // The hero hands off here. Its stage melts to `background` at the
      // bottom edge, so this sheet starts at exactly that colour and the
      // portal's ember bloom rises just below the seam, then settles into
      // the concrete: no visible edge between the two.
      className="bg-[linear-gradient(to_bottom,hsl(var(--background))_0px,hsl(var(--background)/0)_120px),radial-gradient(ellipse_80%_440px_at_50%_60px,hsl(var(--ember)/0.16),hsl(var(--ember-deep)/0.05)_50%,transparent_100%)] md:bg-[linear-gradient(to_bottom,hsl(var(--background))_0px,hsl(var(--background)/0)_140px),radial-gradient(ellipse_60%_540px_at_50%_80px,hsl(var(--ember)/0.15),hsl(var(--ember-deep)/0.05)_50%,transparent_100%)]"
    >
      {/* Phones: heading, the paths, then the clock. From md: the heading
          beside the clock, the paths band across under both. */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end md:gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-x-12 min-[1400px]:grid-cols-[minmax(0,1fr)_25rem] min-[1400px]:gap-x-16">
        <DisplayHeading lines={s.lines} outline={s.outline} />
        <Reveal delay={0.15} className="max-md:order-last">
          {/* The strip below carries the date and doors; the clock just counts. */}
          <Countdown showDate={false} />
        </Reveal>
        <PathBand className="md:col-span-2 md:mt-2" />
      </div>

      {/* The spec strip: one ruled title-block row. Each cell is its own
          small <dl> (a <dl> may only hold dt/dd, or divs of them, so the
          glyph and the Reveal wrapper stay outside it). */}
      <div className="relative mt-6 grid grid-cols-2 border-y border-bone/15 md:mt-9 lg:grid-cols-4">
        {CELLS.map((key, i) => {
          const cell = s.spec[key];
          return (
            <Reveal
              key={key}
              delay={0.08 * i}
              y={10}
              className={cn(
                "relative flex flex-col py-3 sm:flex-row sm:gap-4 sm:py-5",
                // Hairline seams: a 2x2 block below lg, one row of four from lg.
                i % 2 === 0 ? "pr-3 sm:pr-5" : "border-l border-bone/10 pl-4 sm:px-5",
                i >= 2 && "border-t border-bone/10 lg:border-t-0",
                i === 2 && "lg:border-l lg:pl-5",
                i === 0 && "lg:pl-0",
              )}
            >
              {/* Phones: a small glyph (20px) on the label's line. From sm: a
                  larger glyph beside the whole cell. */}
              <SpecGlyph
                kind={key}
                delay={0.1 + 0.12 * i}
                className={cn(
                  "max-sm:absolute max-sm:top-3 max-sm:h-5 max-sm:w-5 sm:mt-0.5 sm:h-11 sm:w-11",
                  i % 2 === 0 ? "max-sm:left-0" : "max-sm:left-4",
                )}
              />
              <dl className="min-w-0">
                <dt className="font-mono text-[10px] uppercase leading-[1.1] tracking-[0.28em] text-ember max-sm:flex max-sm:min-h-[20px] max-sm:items-center max-sm:pl-7">
                  {cell.label}
                </dt>
                <dd className="mt-1.5 text-balance font-display text-[1.05rem] uppercase leading-[1.1] text-foreground sm:mt-2 sm:text-[1.3rem]">
                  {cell.value}
                </dd>
                {key === "where" && (
                  // On the label's line at the cell's right edge, so the
                  // link costs the strip no height. 44px tall tap target.
                  <dd className="absolute -top-0.5 right-0 sm:right-4 sm:top-1">
                    <a
                      href={VENUE_MAP_URL}
                      target="_blank"
                      rel="noopener"
                      aria-label={s.mapLabel}
                      className="focus-ember inline-flex min-h-[44px] items-center gap-1 px-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ember underline decoration-ember/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/60"
                    >
                      {CTA.map}
                      <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.5} />
                    </a>
                  </dd>
                )}
              </dl>
            </Reveal>
          );
        })}
      </div>
    </Sheet>
  );
}
