import { useEffect, useRef, type CSSProperties, type FocusEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { SPONSORS, type Sponsor } from "@/config/sponsors";
import { NAV, SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

/** Idle drift, px per second. Scrolling multiplies it (up to 1 + MAX_BOOST). */
const IDLE_SPEED = 26;
const MAX_BOOST = 7;
/** How far inside the fade a focused logo is brought, px. */
const FOCUS_MARGIN = 56;

// Two rows: the first half of the wall, then the rest closing on the open
// partner slot (13 sponsors: 7 and 6 + slot).
const SPLIT = Math.ceil(SPONSORS.length / 2);
const ROWS: { items: Sponsor[]; dir: 1 | -1; slot: boolean }[] = [
  { items: SPONSORS.slice(0, SPLIT), dir: -1, slot: false },
  { items: SPONSORS.slice(SPLIT), dir: 1, slot: true },
];

const CELL =
  "relative h-[4.75rem] w-[8.75rem] shrink-0 border-r border-bone/12 sm:h-24 sm:w-44 lg:h-28 lg:w-52 xl:h-[7.5rem] xl:w-56 motion-reduce:!w-auto motion-reduce:border-b";
/** The seam's registration tick, at each cell's top-left corner. */
const TICK =
  "pointer-events-none absolute -left-[4px] -top-[4px] h-[9px] w-[9px] [background:linear-gradient(hsl(var(--bone)/0.4),hsl(var(--bone)/0.4))_center/100%_1px_no-repeat,linear-gradient(hsl(var(--bone)/0.4),hsl(var(--bone)/0.4))_center/1px_100%_no-repeat]";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

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

/** The open slot at the end of the second row: opens /partner. */
function SlotCell({ dup }: { dup?: boolean }) {
  const slot = SECTIONS.sponsors.slot;
  return (
    <li className={cn(CELL, "w-[10.5rem] p-2 sm:w-52 sm:p-2.5 lg:w-60 xl:w-64")}>
      <span aria-hidden="true" className={TICK} />
      <Link
        to="/partner"
        tabIndex={dup ? -1 : undefined}
        className="focus-ember draft-hatch group flex h-full flex-col items-center justify-center gap-2 border border-dashed border-ember/60 px-2 text-center transition-colors duration-300 hover:border-ember hover:bg-ember/[0.04] sm:gap-2.5"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/75">{slot.kicker}</span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[15px] uppercase leading-none text-foreground transition-colors group-hover:text-ember sm:text-lg">
          {slot.cta}
          <ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-ember" />
        </span>
      </Link>
    </li>
  );
}

interface RowProps {
  items: Sponsor[];
  dir: 1 | -1;
  slot: boolean;
  /** Signed scroll-velocity factor shared by both rows. */
  boost: MotionValue<number>;
  reduced: boolean;
}

/**
 * One drifting row. The track holds four copies of the set (one before the
 * real list, two after), shifted left by one set width, so the real list's
 * offset `x` can wrap through [-setWidth, 0) with no seam in view. Only the
 * real list is a list of links for keyboards and screen readers.
 */
function Row({ items, dir, slot, boost, reduced }: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLUListElement>(null);
  const setW = useRef(0);
  const paused = useRef(false);
  const heading = useRef<1 | -1>(1);
  const x = useMotionValue(0);
  const inView = useInView(rowRef, { margin: "160px 0px" });

  useEffect(() => {
    const el = setRef.current;
    if (!el) return;
    const measure = () => {
      setW.current = el.offsetWidth;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) x.set(0);
  }, [reduced, x]);

  useAnimationFrame((_, delta) => {
    const w = setW.current;
    if (reduced || !inView || paused.current || !w) return;
    const b = boost.get();
    // Scrolling up turns the rows around; scrolling down turns them back.
    if (b < -0.08) heading.current = -1;
    else if (b > 0.08) heading.current = 1;
    const speed = IDLE_SPEED * (1 + Math.min(Math.abs(b), MAX_BOOST));
    // Cap a long frame (a background tab coming back) to one frame's worth.
    const step = (speed * Math.min(delta, 50)) / 1000;
    x.set(wrap(-w, 0, x.get() + dir * heading.current * step));
  });

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") paused.current = true;
  };
  const onPointerLeave = () => {
    if (!rowRef.current?.contains(document.activeElement)) paused.current = false;
  };
  // A keyboard user tabbing along the wall: hold still and slide the focused
  // logo inside the fade.
  const onFocus = (e: FocusEvent) => {
    paused.current = true;
    const row = rowRef.current;
    if (!row || reduced) return;
    const vp = row.getBoundingClientRect();
    const r = (e.target as HTMLElement).getBoundingClientRect();
    const m = Math.min(FOCUS_MARGIN, vp.width / 8);
    if (r.left < vp.left + m) x.set(x.get() + (vp.left + m - r.left));
    else if (r.right > vp.right - m) x.set(x.get() - (r.right - (vp.right - m)));
  };
  const onBlur = (e: FocusEvent) => {
    if (!rowRef.current?.contains(e.relatedTarget as Node | null)) paused.current = false;
  };

  const cells = (dup: boolean) => (
    <>
      {items.map((s) => (
        <SponsorCell key={s.name} s={s} dup={dup} />
      ))}
      {slot && <SlotCell dup={dup} />}
    </>
  );
  const copy = <ul aria-hidden="true" className="flex motion-reduce:hidden">{cells(true)}</ul>;

  return (
    <div
      ref={rowRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      // overflow-x: clip (not hidden): no scroll container, so focusing a
      // logo never scrolls the row behind the animation's back.
      className="relative overflow-x-clip border-t border-bone/15 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] motion-reduce:contents"
    >
      <div className="w-max -translate-x-1/4 motion-reduce:contents">
        <motion.div style={{ x }} className="flex w-max motion-reduce:contents">
          {copy}
          {/* role="list": Safari drops list semantics under display: contents. */}
          <ul ref={setRef} role="list" className="flex motion-reduce:contents">
            {cells(false)}
          </ul>
          {copy}
          {copy}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * The sponsor wall, in motion: two rows of drafting cells drifting in
 * opposite directions at an idle pace, sped up (and turned around) by the
 * page's scroll velocity. Hovering a row or tabbing into it holds it still.
 * Every logo is a `rel="sponsored"` link to its sponsor in a new tab; the
 * marquee's copies are aria-hidden and out of the tab order, so each sponsor
 * is announced once. Reduced motion: one still grid of every cell, with the
 * copies hidden (CSS, so it holds from the first paint).
 */
export default function SponsorMarquee({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [-1000, 0, 1000], [-5, 0, 5], { clamp: false });

  return (
    <div
      className={cn(
        "relative border-b border-bone/15 [--logo-k:0.5] sm:[--logo-k:0.66] lg:[--logo-k:0.74] xl:[--logo-k:0.8]",
        // Reduced motion: the rows dissolve (display: contents) into one
        // still grid of all the cells, two across, seven from lg.
        "motion-reduce:grid motion-reduce:grid-cols-2 motion-reduce:border-l motion-reduce:border-t lg:motion-reduce:grid-cols-7",
        className,
      )}
    >
      {ROWS.map((r, i) => (
        <Row key={i} {...r} boost={boost} reduced={reduced} />
      ))}
    </div>
  );
}
