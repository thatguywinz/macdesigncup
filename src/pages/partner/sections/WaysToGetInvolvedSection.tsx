import { Gavel, HandCoins, MessagesSquare, Mic, Package, Presentation } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";

const OPTIONS = [
  { title: "Speak", line: "An opening or closing talk", Icon: Mic },
  { title: "Mentor", line: "Feedback on the design floor", Icon: MessagesSquare },
  { title: "Judge", line: "The final presentations", Icon: Gavel },
  { title: "Exhibit", line: "A product or live demo", Icon: Presentation },
  { title: "Contribute", line: "Tools, software, swag or prizes", Icon: Package },
  { title: "Sponsor", line: "Food, venue and event costs", Icon: HandCoins },
] as const;

/**
 * Ways to take part (two across on phones, three from md): an icon, a
 * one-word role, one short line. Join one session or the whole day.
 */
export default function WaysToGetInvolvedSection() {
  return (
    <Sheet id="involvement">
      <DisplayHeading lines={["Ways to take part"]} />

      <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-9 md:mt-12 md:grid-cols-3 md:gap-x-12 md:gap-y-12">
        {OPTIONS.map(({ title, line, Icon }, i) => (
          <Reveal
            as="li"
            key={title}
            delay={0.05 * i}
            y={12}
            className="group relative flex flex-col gap-3"
          >
            <Icon aria-hidden="true" strokeWidth={1.5} className="size-6 text-ember" />
            <div className="min-w-0">
              <h3 className="font-body text-lg font-semibold leading-tight text-foreground md:text-xl">{title}</h3>
              <p className="mt-1 text-pretty font-body text-[15px] leading-snug text-concrete">
                {line}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Sheet>
  );
}
