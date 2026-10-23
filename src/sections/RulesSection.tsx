import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { SECTIONS } from "@/content/copy";

const s = SECTIONS.rules;

/**
 * Rules (#rules). The heading and one line on the left; the rules as a
 * numbered spec list on the right, each under a hairline with its number set
 * large in ember (the section's visual anchor). Phones: one column under the
 * heading; tablets: two; from lg, beside the (sticky) heading.
 */
export default function RulesSection() {
  return (
    <Sheet id="rules" aria-labelledby="rules-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16 xl:gap-20">
        {/* From lg the heading holds still while the list scrolls past it. */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
          <DisplayHeading id="rules-title" lines={s.lines} />
          <Reveal as="p" delay={0.1} className="mt-4 max-w-[30ch] font-body text-lg leading-relaxed text-foreground/75 md:mt-5 md:text-xl">
            {s.body}
          </Reveal>
        </div>

        <ol className="grid gap-x-10 gap-y-8 md:grid-cols-2 md:gap-y-10">
          {s.items.map((rule, i) => (
            <Reveal
              as="li"
              key={rule.title}
              y={12}
              delay={0.05 * (i % 2)}
              className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-t border-bone/10 pt-5 md:grid-cols-[3.5rem_minmax(0,1fr)]"
            >
              <span aria-hidden="true" className="font-display text-[2.5rem] leading-none text-ember md:text-[3rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-body text-xl font-semibold leading-tight tracking-[-0.015em] text-foreground md:text-[1.375rem]">
                  {rule.title}
                </h3>
                <p className="mt-2 font-body text-[15px] leading-relaxed text-foreground/75 md:text-base">{rule.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Sheet>
  );
}
