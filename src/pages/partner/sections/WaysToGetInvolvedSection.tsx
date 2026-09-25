import { Gavel, HandCoins, MessagesSquare, Mic, Package, Presentation } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { title: "Speak", line: "An opening or closing talk", Icon: Mic },
  { title: "Mentor", line: "Feedback on the design floor", Icon: MessagesSquare },
  { title: "Judge", line: "The final presentations", Icon: Gavel },
  { title: "Exhibit", line: "A product or live demo", Icon: Presentation },
  { title: "Contribute", line: "Tools, software, swag or prizes", Icon: Package },
  { title: "Sponsor", line: "Food, venue and event costs", Icon: HandCoins },
] as const;

/**
 * Ways to take part as icon tiles on one ruled grid (two across on phones,
 * three from md): an icon in a drafted square, a one-word role, one short
 * line. Join one session or the whole day.
 */
export default function WaysToGetInvolvedSection() {
  return (
    <Sheet id="involvement" eyebrow="Ways to take part">
      <DisplayHeading lines={["Choose your role."]} outline="role." />

      <ul className="mt-8 grid grid-cols-2 border-l border-t border-bone/15 md:mt-12 md:grid-cols-3">
        {OPTIONS.map(({ title, line, Icon }, i) => (
          <Reveal
            as="li"
            key={title}
            delay={0.05 * i}
            y={12}
            className="group relative flex flex-col gap-3 border-b border-r border-bone/15 p-4 sm:p-6 md:flex-row md:items-center md:gap-6 md:p-8"
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative flex size-12 shrink-0 items-center justify-center border text-ember md:size-16",
                "border-bone/25 [background:linear-gradient(hsl(var(--bone)/0.12),hsl(var(--bone)/0.12))_center/100%_1px_no-repeat,linear-gradient(hsl(var(--bone)/0.12),hsl(var(--bone)/0.12))_center/1px_100%_no-repeat]",
              )}
            >
              <span className="flex size-9 items-center justify-center bg-background md:size-11">
                <Icon strokeWidth={1.5} className="size-5 md:size-7" />
              </span>
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[1.45rem] uppercase leading-none text-foreground md:text-[2rem]">{title}</h3>
              <p className="mt-1.5 text-pretty font-body text-[13px] font-light leading-snug text-concrete md:text-[15px]">
                {line}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Sheet>
  );
}
