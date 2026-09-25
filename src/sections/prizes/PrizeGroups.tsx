import { useId } from "react";
import Reveal from "@/components/motion/Reveal";
import { EVERY_BUILDER, ON_THE_FLOOR, PRIZE_EXTRAS } from "@/config/site";
import { SECTIONS } from "@/content/copy";
import { cn } from "@/lib/utils";

interface Line {
  item: string;
  from: string;
}

const GROUPS: { key: keyof typeof SECTIONS.prizes.groups; lines: readonly Line[] }[] = [
  { key: "extras", lines: PRIZE_EXTRAS },
  { key: "everyBuilder", lines: EVERY_BUILDER },
  { key: "floor", lines: ON_THE_FLOOR },
];

function Group({ title, lines, delay }: { title: string; lines: readonly Line[]; delay: number }) {
  const id = useId();
  return (
    <Reveal as="section" delay={delay} y={12} className="min-w-0">
      <h3
        id={id}
        className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.26em] text-foreground"
      >
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rotate-45 border border-ember" />
        {title}
      </h3>
      <ul aria-labelledby={id} className="mt-1.5 border-t border-bone/25 sm:mt-2">
        {lines.map((l) => (
          <li
            key={l.item}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-bone/10 py-1 sm:py-1.5"
          >
            <span className="min-w-0 flex-1 basis-[9rem] font-body text-[14px] leading-snug text-foreground/90 sm:text-[15px]">
              {l.item}
            </span>
            {/* The credit sits at the right end of the line, or drops under
                the item in a narrow column rather than squeezing it. */}
            <span className="shrink-0 whitespace-nowrap font-mono text-[10px] uppercase leading-snug tracking-[0.12em] text-concrete sm:tracking-[0.16em]">
              {l.from}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/**
 * The rest of the prize table as three tight ledgers (Also up for grabs /
 * Every builder gets / On the floor), one line per prize with its sponsor
 * in mono. Stacked on phones and from `xl` (where they fill the column beside
 * the drawing); three across on tablets and small laptops.
 */
export default function PrizeGroups({ className, id }: { className?: string; id?: string }) {
  return (
    <div id={id} className={cn("grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-8 xl:grid-cols-1 xl:gap-5", className)}>
      {GROUPS.map((g, i) => (
        <Group key={g.key} title={SECTIONS.prizes.groups[g.key]} lines={g.lines} delay={i * 0.08} />
      ))}
    </div>
  );
}
