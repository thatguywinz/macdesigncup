import { ChevronDown, Clock, PlugZap, ShieldCheck } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import Reveal from "@/components/motion/Reveal";
import { CONTACT_EMAIL } from "@/config/site";

const KEY_POINTS = [
  { Icon: Clock, text: "Access from 7:00 AM" },
  { Icon: PlugZap, text: "Table, power and AV on request" },
  { Icon: ShieldCheck, text: "Students are minors: no recruiting" },
] as const;

const FINE_PRINT = [
  { title: "Visitor clearance", description: "Send each representative's name, role, email, and phone number." },
  { title: "Space and equipment", description: "Request a table, power, AV, early setup, or equipment space." },
  {
    title: "Student privacy",
    description: "Most students are minors. Direct recruitment and resume collection are not permitted.",
  },
  {
    title: "Arrival and hospitality",
    description: "Access starts at 7:00 AM. Speakers, mentors, and judges receive lunch and refreshments.",
  },
  {
    title: "Before the day",
    description: "Confirmed partners receive parking, Wi-Fi, AV, arrival, and drop-off details.",
  },
] as const;

/**
 * Practical details, folded: three key points in a row, and the rest behind
 * a "Fine print" disclosure (in the HTML either way).
 */
export default function LogisticsComplianceSection() {
  return (
    <Sheet id="logistics" eyebrow="Practical details">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-16">
        <h2 className="font-display text-[clamp(2rem,1rem+2.4vw,3rem)] uppercase leading-[0.95] text-foreground">
          Before you <span className="wire-text">arrive.</span>
        </h2>

        <div>
          <Reveal as="ul" className="grid border-t border-bone/15 sm:grid-cols-3">
            {KEY_POINTS.map(({ Icon, text }, i) => (
              <li
                key={text}
                className={`flex items-center gap-3 border-b border-bone/15 py-4 sm:flex-col sm:items-start sm:gap-3 sm:px-5 sm:py-5 ${i === 0 ? "sm:pl-0" : "sm:border-l"}`}
              >
                <Icon aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-ember md:size-6" />
                <span className="font-display text-[1.05rem] uppercase leading-[1.1] text-foreground md:text-[1.2rem]">
                  {text}
                </span>
              </li>
            ))}
          </Reveal>

          <details className="group mt-2 border-b border-bone/15">
            <summary className="focus-ember flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/85 transition-colors hover:text-ember [&::-webkit-details-marker]:hidden">
              Fine print
              <ChevronDown
                aria-hidden="true"
                size={16}
                strokeWidth={1.5}
                className="shrink-0 text-ember transition-transform duration-300 group-open:rotate-180"
              />
            </summary>
            <dl className="pb-5">
              {FINE_PRINT.map((d) => (
                <div key={d.title} className="grid gap-1 border-t border-bone/10 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80">{d.title}</dt>
                  <dd className="text-sm leading-relaxed text-concrete">{d.description}</dd>
                </div>
              ))}
              <div className="border-t border-bone/10 pt-3">
                <dt className="sr-only">Questions</dt>
                <dd className="text-sm text-concrete">
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=MDC%202026%20partner%20question`}
                    className="focus-ember inline-flex min-h-11 items-center text-ember underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Email the MDC team
                  </a>
                </dd>
              </div>
            </dl>
          </details>
        </div>
      </div>
    </Sheet>
  );
}
