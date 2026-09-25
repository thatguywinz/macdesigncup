import { useId } from "react";
import Reveal from "@/components/motion/Reveal";
import { EVERY_BUILDER, ON_THE_FLOOR, PRIZE_EXTRAS } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

const g = SECTIONS.prizes.groups;

function GroupTitle({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.26em] text-foreground">
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rotate-45 border border-ember" />
      {children}
    </h3>
  );
}

/** Four tiles: a big figure (a real count, or the prize's own words) and its sponsor. */
function Extras() {
  const id = useId();
  return (
    <Reveal as="section" y={12} className="min-w-0">
      <GroupTitle id={id}>{g.extras}</GroupTitle>
      <ul aria-labelledby={id} className="mt-3 grid grid-cols-2 border-l border-t border-bone/15 sm:grid-cols-4">
        {PRIZE_EXTRAS.map((p) => (
          <li key={p.item} className="flex min-w-0 flex-col justify-end gap-1.5 border-b border-r border-bone/15 p-3.5 sm:p-4">
            {p.count !== null ? (
              <span aria-hidden="true" className="font-display text-[2.25rem] leading-[0.9] text-foreground sm:text-[2.4rem] xl:text-[2.6rem]">
                {p.count}
              </span>
            ) : (
              <span aria-hidden="true" className="font-display text-[1.15rem] uppercase leading-[1] text-foreground sm:text-[1.2rem] xl:text-[1.25rem]">
                {p.unit}
              </span>
            )}
            <span aria-hidden="true" className="font-body text-[14px] leading-snug text-foreground/80 sm:text-[15px]">
              {p.count !== null ? `${p.from} ${p.unit.toLowerCase()}` : p.from}
            </span>
            {/* The full line, for readers and crawlers (the tile shows it in parts). */}
            <span className="sr-only">
              {p.item}
              {p.count === null ? ` from ${p.from}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/** A group as one row of short chips. */
function Chips({ title, items, delay }: { title: string; items: readonly string[]; delay: number }) {
  const id = useId();
  return (
    <Reveal as="section" y={12} delay={delay} className="min-w-0">
      <GroupTitle id={id}>{title}</GroupTitle>
      <ul aria-labelledby={id} className="mt-3 flex flex-wrap gap-2">
        {items.map((t) => (
          <li
            key={t}
            className="border border-bone/20 px-3 py-1.5 font-body text-[14px] leading-snug text-foreground/90 sm:text-[15px]"
          >
            {t}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/**
 * The rest of the prize table, calm: the extras as big-figure tiles,
 * then what every builder gets and what's on the floor as short chips. Only
 * real counts are printed; nothing carries a value the sponsor didn't give.
 */
export default function PrizeGroups({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-7 md:gap-8", className)}>
      <Extras />
      <Chips title={g.everyBuilder} items={EVERY_BUILDER.map((p) => p.short)} delay={0.06} />
      <Chips title={g.floor} items={ON_THE_FLOOR.map((p) => p.short)} delay={0.12} />
    </div>
  );
}
