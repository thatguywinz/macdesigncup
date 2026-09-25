import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import RegisterBlock from "@/components/RegisterBlock";
import { SECTIONS } from "@/content/copy";

const s = SECTIONS.register;

/**
 * The closer (#register): the heading, one status line and the date and
 * venue, with the Register block beside them from lg (under them below).
 * No other buttons. The phone's sticky bar steps aside here, so the block
 * keeps its own button on phones.
 */
export default function CTASection() {
  return (
    <Sheet id="register">
      {/* The old For teachers sheet (#teachers) folded into registration: its links land here. */}
      <span id="teachers" className="anchor-alias absolute left-0 top-0" aria-hidden="true" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div>
          <DisplayHeading lines={s.lines} />
          <Reveal as="p" delay={0.1} className="mt-4 max-w-[40ch] font-body text-lg leading-relaxed text-foreground/75 md:mt-5 md:text-xl">
            {s.status}
          </Reveal>
          <Reveal as="p" delay={0.15} className="mt-3 font-body text-[15px] leading-relaxed text-concrete">
            {/* Breaks only between the parts, never inside the date or the street. */}
            {s.meta.map((part, i) => (
              <span key={part}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{part}</span>
              </span>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <RegisterBlock buttonClassName="min-h-[52px] px-9 py-4 text-[15px]" className="gap-4" />
        </Reveal>
      </div>
    </Sheet>
  );
}
