import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function LogisticsComplianceSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const points = [
    {
      title: "TDSB & Venue Clearance",
      description:
        "Visitor details for all attending representatives must be provided prior to the event for TDSB and venue approval.",
    },
    {
      title: "Student Privacy Policy",
      description:
        "Because participants are high school minors, direct recruitment or resume collection is strictly prohibited.",
    },
    {
      title: "Fall Briefing",
      description:
        "Full arrival, parking, and AV setup instructions will be sent to registered contacts in early fall.",
    },
  ];

  return (
    <section id="logistics" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Logistics &</span>
          <span className="wire-text block">Compliance</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Important information for all participating partners.
        </motion.p>

        {/* points list */}
        <motion.div {...reveal(0.18)} className="mt-12 space-y-8">
          {points.map((point, index) => (
            <div key={point.title} className="flex flex-col gap-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                    <span className="text-ember text-sm font-mono">•</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">
                    {point.title}
                  </h3>
                  <p className="text-concrete">{point.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}