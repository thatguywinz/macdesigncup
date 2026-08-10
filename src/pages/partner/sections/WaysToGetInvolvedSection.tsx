import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const OPTIONS = [
  ["Speak", "Share a short opening or closing talk."],
  ["Mentor", "Give practical feedback on the design floor."],
  ["Judge", "Review final student presentations."],
  ["Exhibit", "Show a product, project, or live demo."],
  ["Contribute", "Provide tools, software, materials, swag, or prizes."],
  ["Sponsor", "Help cover food, venue, and event costs."],
] as const;

export default function WaysToGetInvolvedSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ y: 16 } as const),
    whileInView: { y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="involvement" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">Ways to take part</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <motion.h2 {...reveal()} className="display-scene text-balance">
              <span className="block">Choose your</span>
              <span className="wire-text block">role.</span>
            </motion.h2>
            <motion.p {...reveal(0.08)} className="mt-8 max-w-md font-body text-base font-light leading-relaxed text-concrete">
              Join one session or the full day. We will work around your team.
            </motion.p>
          </div>

          <motion.div {...reveal(0.14)} className="grid border-t border-line sm:grid-cols-2">
            {OPTIONS.map(([title, description], index) => (
              <div
                key={title}
                className={`border-b border-line py-6 sm:px-6 ${index % 2 === 0 ? "sm:border-r" : ""}`}
              >
                <h3 className="font-display text-2xl uppercase tracking-[0.01em] text-foreground">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-concrete md:text-base">{description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
