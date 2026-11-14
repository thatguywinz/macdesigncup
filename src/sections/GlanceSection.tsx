import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import Countdown from "@/components/Countdown";
import SubmitButton from "@/components/SubmitButton";
import SubmitQr from "@/components/SubmitQr";
import { SubmitNote } from "@/components/nav/SubmitNote";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { VENUE_MAP_URL } from "@/config/site";
import { useSubmitClosed } from "@/hooks/useSubmitClosed";
import { CTA, SECTIONS } from "@/content/copy";
import PathBand from "./glance/PathBand";

const CELLS = ["when", "where", "who", "cost"] as const;

/**
 * At a glance. The heading and the theme line beside the submission clock
 * (with Submit here and the /submit QR code), the four facts (When / Where /
 * Who / Cost) in one quiet row, then the two routes: competitors submit,
 * partners go to /partner.
 */
export default function GlanceSection() {
  const s = SECTIONS.glance;
  const noteId = useId();
  const closed = useSubmitClosed();
  return (
    <Sheet id="glance">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div>
          <DisplayHeading lines={s.lines} />
          <Reveal as="p" delay={0.1} className="mt-4 max-w-[38ch] font-body text-lg leading-relaxed text-foreground/75 md:mt-5 md:text-xl">
            {s.body}
          </Reveal>
        </div>
        {/* The day's one action: the clock to the submission deadline, Submit
            here, and (md+) the QR code for anyone reading this off a screen. */}
        <Reveal delay={0.15} className="flex items-end gap-8 xl:gap-10">
          <div className="min-w-0">
            <Countdown />
            {/* Phones get the button and this note from the sticky bar just
                below: one Submit at a time. After the deadline the button
                steps down to the ghost style (organizers can reopen an
                entry, and the portal tells those teams what to do), and the
                note and QR go. */}
            <div className="mt-7 hidden flex-wrap items-center gap-x-6 gap-y-3 md:flex">
              <SubmitButton
                variant={closed ? "ghost" : "solid"}
                aria-describedby={closed ? undefined : noteId}
                className="min-h-[48px] px-7 py-3 text-[15px]"
              />
              {!closed && <SubmitNote id={noteId} url />}
            </div>
          </div>
          {!closed && <SubmitQr className="hidden md:block" />}
        </Reveal>
      </div>

      {/* The facts: one <dl>, a label over each value. */}
      <Reveal
        as="dl"
        y={10}
        className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-bone/10 pt-7 md:mt-16 md:pt-8 lg:grid-cols-4"
      >
        {CELLS.map((key) => {
          const cell = s.spec[key];
          return (
            <div key={key} className="min-w-0">
              <dt className="font-body text-sm text-concrete">{cell.label}</dt>
              <dd className="mt-1.5 text-balance font-body text-[1.0625rem] font-medium leading-snug text-foreground md:text-xl">
                {/* Breaks after a middot, never inside a part. */}
                {cell.value.split(" · ").map((part, i) => (
                  <span key={part}>
                    {i > 0 && " · "}
                    <span className="whitespace-nowrap">{part}</span>
                  </span>
                ))}
              </dd>
              {key === "where" && (
                <dd>
                  <a
                    href={VENUE_MAP_URL}
                    target="_blank"
                    rel="noopener"
                    aria-label={s.mapLabel}
                    className="focus-ember -mb-2.5 inline-flex min-h-[44px] items-center gap-1 font-body text-sm text-ember underline decoration-ember/40 underline-offset-4 transition-colors hover:decoration-ember"
                  >
                    {CTA.map}
                    <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  </a>
                </dd>
              )}
            </div>
          );
        })}
      </Reveal>

      <PathBand className="mt-12 md:mt-16" />
    </Sheet>
  );
}
