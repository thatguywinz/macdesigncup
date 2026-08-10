import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const BENEFITS = [
  {
    title: "Meet future designers",
    description: "Show students where design and engineering can lead.",
  },
  {
    title: "Put tools in the room",
    description: "Demo software or hardware, exhibit, or lend equipment.",
  },
  {
    title: "Support STEM",
    description: "Recognition on event signage, slides, certificates, and social media.",
  },
  {
    title: "Join your way",
    description: "Give time, funding, software, hardware, swag, or prizes.",
  },
] as const;

const FACTS = [
  ["80", "TDSB students"],
  ["9–12", "Grades represented"],
  ["1 day", "At George Brown College"],
  ["Student-led", "By WLMAC 3D Design Club"],
] as const;

export default function WhyPartnerSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ y: 16 } as const),
    whileInView: { y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="why" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">Why it matters</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <motion.h2 {...reveal()} className="display-scene text-balance">
              <span className="block">Make it</span>
              <span className="wire-text block">real.</span>
            </motion.h2>
            <motion.p {...reveal(0.08)} className="mt-8 max-w-lg font-body text-base font-light leading-relaxed text-concrete md:text-lg">
              Partners connect classroom CAD with real tools, people, and careers.
            </motion.p>
          </div>

          <motion.div {...reveal(0.14)} className="border-t border-line">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
                <h3 className="font-display text-xl uppercase tracking-[0.01em] text-foreground">
                  {benefit.title}
                </h3>
                <p className="max-w-xl text-sm leading-relaxed text-concrete md:text-base">
                  {benefit.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.dl {...reveal(0.22)} className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 md:grid-cols-4">
          {FACTS.map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-3xl uppercase text-ember md:text-4xl">{value}</dt>
              <dd className="mt-2 max-w-[18ch] font-mono text-[10px] uppercase tracking-[0.18em] text-concrete">
                {label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
