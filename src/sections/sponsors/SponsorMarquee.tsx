import { useRef, type CSSProperties, type FocusEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SPONSORS, type Sponsor } from "@/config/sponsors";
import { NAV, SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

/** Seconds for one cell to cross: the same for every row, so both move at one pace. */
const SECONDS_PER_CELL = 4.2;
/** How far inside the fade a focused logo is brought, px. */
const FOCUS_MARGIN = 56;

// Two rows: the first half of the wall, then the rest (13 sponsors: 7 and 6).
const SPLIT = Math.ceil(SPONSORS.length / 2);
const ROWS: Sponsor[][] = [SPONSORS.slice(0, SPLIT), SPONSORS.slice(SPLIT)];

const CELL =
  "relative h-[4.75rem] w-[8.75rem] shrink-0 border-r border-bone/12 sm:h-24 sm:w-44 lg:h-28 lg:w-52 xl:h-[7.5rem] xl:w-56 motion-reduce:!w-auto motion-reduce:border-b";
/** The seam's registration tick, at each cell's top-left corner. */
const TICK =
  "pointer-events-none absolute -left-[4px] -top-[4px] h-[9px] w-[9px] [background:linear-gradient(hsl(var(--bone)/0.4),hsl(var(--bone)/0.4))_center/100%_1px_no-repeat,linear-gradient(hsl(var(--bone)/0.4),hsl(var(--bone)/0.4))_center/1px_100%_no-repeat]";

/** One logo cell. `dup` = a marquee copy: seen, but not focused or announced. */
function SponsorCell({ s, dup }: { s: Sponsor; dup?: boolean }) {
  return (
    <li className={CELL}>
      <span aria-hidden="true" className={TICK} />
      <a
        href={s.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        tabIndex={dup ? -1 : undefined}
        aria-label={dup ? undefined : `${s.name} ${NAV.newTab}`}
        className="sponsor-logo focus-ember group flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 py-2 transition-colors duration-300 hover:bg-bone/[0.035] focus-visible:[outline-offset:-6px] sm:gap-2 sm:px-5"
      >
        <span className="flex min-h-0 w-full flex-1 items-center justify-center">
          <img
            src={s.logo}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-auto w-auto object-contain"
            style={
              {
                maxHeight: `min(calc(${s.maxH}px * var(--logo-k)), 100%)`,
                maxWidth: `min(calc(${s.maxW}px * var(--logo-k)), 100%)`,
              } as CSSProperties
            }
          />
        </span>
        {s.caption && (
          <span className="shrink-0 text-balance text-center font-mono text-[9px] uppercase leading-[1.2] tracking-[0.14em] text-foreground/70 transition-colors duration-300 group-hover:text-foreground sm:tracking-[0.18em]">
            {s.caption}
          </span>
        )}
      </a>
    </li>
  );
}

/**
 * The open slot: "Your logo here · Partner with us", to /partner. It stands
 * outside the moving rows, so it never scrolls away: a fixed cell at the
 * wall's right end from lg, a full-width band under the rows below that.
 */
function Slot() {
  const slot = SECTIONS.sponsors.slot;
  return (
    <div className="relative border-t border-bone/15 p-2 sm:p-2.5 lg:w-60 lg:border-l lg:border-t-0 xl:w-64 motion-reduce:lg:w-auto">
      <span aria-hidden="true" className={TICK} />
      <Link
        to="/partner"
        className="focus-ember draft-hatch group flex h-full min-h-[4.5rem] flex-row items-center justify-center gap-4 border border-dashed border-ember/60 px-4 py-3 text-center transition-colors duration-300 hover:border-ember hover:bg-ember/[0.04] lg:flex-col lg:gap-2.5"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/75">{slot.kicker}</span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-display text-lg uppercase leading-none text-foreground transition-colors group-hover:text-ember">
          {slot.cta}
          <ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-ember" />
        </span>
      </Link>
    </div>
  );
}

/**
 * One row: a track of two identical sets that slides one set width to the
 * left at a constant pace and loops (CSS, see `.marquee-track`). Only the
 * first set is a list of links for keyboards and screen readers; the copy is
 * aria-hidden and out of the tab order.
 */
function Row({ items }: { items: Sponsor[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // A keyboard user tabbing along the wall: the row holds still (CSS
  // :focus-within) and is set so the focused logo sits inside the fade.
  const onFocus = (e: FocusEvent) => {
    const row = rowRef.current;
    const track = trackRef.current;
    const anim = track?.getAnimations?.()[0];
    if (!row || !track || !anim) return;
    const target = (e.target as HTMLElement).closest("li");
    if (!target) return;
    const setW = track.scrollWidth / 2;
    const dur = Number(anim.effect?.getComputedTiming().duration) || 0;
    if (!setW || !dur) return;
    const m = Math.min(FOCUS_MARGIN, row.clientWidth / 8);
    const left = target.offsetLeft;
    const visible = row.clientWidth - m - target.offsetWidth;
    // Current shift (0..setW) and the nearest shift that shows the logo.
    const now = ((Number(anim.currentTime) || 0) % dur) / dur * setW;
    const lo = left - visible;
    const hi = left - m;
    if (now >= lo && now <= hi) return;
    const want = Math.min(Math.max(now, Math.max(0, lo)), Math.max(0, hi));
    anim.currentTime = (want / setW) * dur;
  };

  const cells = (dup: boolean) => items.map((s) => <SponsorCell key={s.name} s={s} dup={dup} />);

  return (
    <div
      ref={rowRef}
      onFocus={onFocus}
      // overflow-x: clip (not hidden): no scroll container, so focusing a
      // logo never scrolls the row behind the animation's back.
      className="marquee-row relative overflow-x-clip border-t border-bone/15 [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] first:border-t-0 motion-reduce:contents"
    >
      <div
        ref={trackRef}
        className="marquee-track flex w-max motion-reduce:contents"
        style={{ "--marquee-dur": `${items.length * SECONDS_PER_CELL}s` } as CSSProperties}
      >
        {/* role="list": Safari drops list semantics under display: contents. */}
        <ul role="list" className="flex motion-reduce:contents">
          {cells(false)}
        </ul>
        <ul aria-hidden="true" className="flex motion-reduce:hidden">{cells(true)}</ul>
      </div>
    </div>
  );
}

/**
 * The sponsor wall: two rows of drafting cells gliding left at one gentle,
 * constant pace (no scroll coupling, no reversals), with the open partner
 * slot standing still beside them. Hover or focus holds a row. Every logo is
 * a `rel="sponsored"` link to its sponsor in a new tab; the copies are
 * aria-hidden and out of the tab order, so each sponsor is announced once.
 * Reduced motion: one still grid of every cell (CSS, from the first paint).
 */
export default function SponsorMarquee({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col border-y border-bone/15 [--logo-k:0.5] sm:[--logo-k:0.66] lg:flex-row lg:[--logo-k:0.74] xl:[--logo-k:0.8]",
        className,
      )}
    >
      <div
        className={cn(
          "min-w-0 flex-1",
          // Reduced motion: the rows dissolve (display: contents) into one
          // still grid of all the cells, two across, seven from lg.
          "motion-reduce:grid motion-reduce:grid-cols-2 motion-reduce:border-l motion-reduce:border-bone/12 sm:motion-reduce:grid-cols-4 lg:motion-reduce:grid-cols-7",
        )}
      >
        {ROWS.map((items, i) => (
          <Row key={i} items={items} />
        ))}
      </div>
      <Slot />
    </div>
  );
}
