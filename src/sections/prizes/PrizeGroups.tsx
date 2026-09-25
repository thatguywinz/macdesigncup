import { useId } from "react";
import Reveal from "@/components/motion/Reveal";
import { EVERY_BUILDER, ON_THE_FLOOR, PRIZE_EXTRAS } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

const g = SECTIONS.prizes.groups;

function GroupTitle({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="font-body text-sm font-medium text-concrete">
      {children}
    </h3>
  );
}

/** Four figures: a big number (a real count, or the prize's own words) and its sponsor. */
function Extras() {
  const id = useId();
  return (
    <Reveal as="section" y={12} className="min-w-0">
      <GroupTitle id={id}>{g.extras}</GroupTitle>
      <ul aria-labelledby={id} className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {PRIZE_EXTRAS.map((p) => (
          <li key={p.item} className="flex min-w-0 flex-col gap-1">
            {p.count !== null ? (
              <span aria-hidden="true" className="font-body text-[2rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {p.count}
              </span>
            ) : (
              <span aria-hidden="true" className="font-body text-base font-semibold leading-tight text-foreground">
                {p.unit}
              </span>
            )}
            <span aria-hidden="true" className="font-body text-[14px] leading-snug text-foreground/70 sm:text-[15px]">
              {p.count !== null ? `${p.from} ${p.unit.toLowerCase()}` : p.from}
            </span>
            {/* The full line, for readers and crawlers (the figure shows it in parts). */}
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

/** A group as one line of short items, set apart by space alone. */
function Items({ title, items, delay }: { title: string; items: readonly string[]; delay: number }) {
  const id = useId();
  return (
    <Reveal as="section" y={12} delay={delay} className="min-w-0">
      <GroupTitle id={id}>{title}</GroupTitle>
      <ul aria-labelledby={id} className="mt-3 grid max-w-md grid-cols-2 gap-x-6 gap-y-2">
        {items.map((t) => (
          <li key={t} className="font-body text-[15px] leading-snug text-foreground/90 sm:text-base">
            {t}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/**
 * The rest of the prize table, calm: the extras as four figures, then what
 * every builder gets and what's on the floor as short lines. Only real
 * counts are printed; nothing carries a value the sponsor didn't give.
 */
export default function PrizeGroups({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-9 md:gap-10", className)}>
      <Extras />
      <Items title={g.everyBuilder} items={EVERY_BUILDER.map((p) => p.short)} delay={0.06} />
      <Items title={g.floor} items={ON_THE_FLOOR.map((p) => p.short)} delay={0.12} />
    </div>
  );
}
