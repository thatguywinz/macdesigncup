import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { PARTNER_REGISTRATION_URL } from "@/config/site";
import { SPONSORS } from "@/config/sponsors";
import { NAV } from "@/content/copy";
import { cn } from "@/lib/utils";

const COLS = 4;
/** Cells left in the last row: the open slot fills them (13 logos: 3). */
const LEFT = SPONSORS.length % COLS === 0 ? 0 : COLS - (SPONSORS.length % COLS);
const SLOT_SPAN = ["", "col-span-1", "col-span-2", "col-span-3"][LEFT];

/** First-screen entrance in CSS, so the hero never waits on hydration. */
const ENTER = "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 motion-reduce:animate-none";

/**
 * Who's already in: every sponsor, four across, as the same bone knockout
 * the home wall uses, with the open slot at the end (it opens the partner
 * form). The partner hero's visual anchor.
 * Each logo links to its sponsor in a new tab (`rel="sponsored"`), as on
 * the home page wall.
 */
export default function LogoWall({ label, className }: { label: string; className?: string }) {
  return (
    <figure className={cn("relative", ENTER, className)}>
      <figcaption className="mb-4 font-body text-sm text-concrete">{label}</figcaption>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3 [--logo-k:0.5] sm:[--logo-k:0.62] lg:[--logo-k:0.56] xl:[--logo-k:0.64]">
        {SPONSORS.map((s) => (
          <li key={s.name}>
            <a
              href={s.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              aria-label={`${s.name} ${NAV.newTab}`}
              className="sponsor-logo focus-ember flex h-14 flex-col items-center justify-center gap-1 px-1.5 transition-colors duration-300 focus-visible:[outline-offset:-4px] sm:h-[4.5rem] sm:px-2.5 xl:h-20"
            >
              <span className="flex min-h-0 w-full flex-1 items-center justify-center">
                <img
                  src={s.wall.src}
                  width={s.wall.width}
                  height={s.wall.height}
                  alt=""
                  decoding="async"
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
                <span className="shrink-0 pb-1 text-center font-body text-[10px] leading-none text-foreground/65">
                  {s.caption}
                </span>
              )}
            </a>
          </li>
        ))}
        {LEFT > 0 && (
          <li className={cn(SLOT_SPAN)}>
            <a
              href={PARTNER_REGISTRATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ember group flex h-full min-h-[44px] items-center justify-center gap-1.5 border border-bone/15 px-2 font-body text-sm text-foreground/80 transition-colors hover:border-bone/40 hover:text-foreground"
            >
              Your logo here
              <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} className="shrink-0 text-ember" />
              <span className="sr-only"> {NAV.newTab}</span>
            </a>
          </li>
        )}
      </ul>
    </figure>
  );
}
