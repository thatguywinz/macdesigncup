import { motion, useReducedMotion } from "framer-motion";
import { CONTACT_EMAIL } from "@/config/site";

const EASE = [0.22, 1, 0.36, 1];

const DETAILS = [
  {
    title: "Visitor clearance",
    description: "Send each representative's name, role, email, and phone number.",
  },
  {
    title: "Space and equipment",
    description: "Request a table, power, AV, early setup, or equipment space.",
  },
  {
    title: "Student privacy",
    description: "Students are minors. Direct recruitment and resume collection are not permitted.",
  },
  {
    title: "Arrival and hospitality",
    description: "Access starts at 7:00 AM. Speakers, mentors, and judges receive lunch and refreshments.",
  },
] as const;

export default function LogisticsComplianceSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ y: 16 } as const),
    whileInView: { y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="logistics" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">Practical details</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <motion.h2 {...reveal()} className="display-scene text-balance">
              <span className="block">Before you</span>
              <span className="wire-text block">arrive.</span>
            </motion.h2>
            <motion.p {...reveal(0.08)} className="mt-8 max-w-md font-body text-base font-light leading-relaxed text-concrete">
              Confirmed partners receive parking, Wi-Fi, AV, arrival, and drop-off details.
            </motion.p>
          </div>

          <motion.dl {...reveal(0.14)} className="border-t border-line">
            {DETAILS.map((detail) => (
              <div key={detail.title} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
                <dt className="font-display text-xl uppercase tracking-[0.01em] text-foreground">{detail.title}</dt>
                <dd className="max-w-xl text-sm leading-relaxed text-concrete md:text-base">{detail.description}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.p {...reveal(0.22)} className="mt-10 text-sm text-concrete">
          Have a specific setup question?{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=MDC%202026%20partner%20question`}
            className="text-ember underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Email the MDC team
          </a>
          .
        </motion.p>
      </div>
    </section>
  );
}
