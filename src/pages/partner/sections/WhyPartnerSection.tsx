import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function WhyPartnerSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const benefits = [
    {
      title: "Direct Youth Impact",
      description:
        "Connect high school students with industry-standard 3D design practices and STEM career paths.",
    },
    {
      title: "Brand & Industry Visibility",
      description:
        "Feature your company logo on event materials, presentation slides, and our official Instagram (@wlmac.3ddesign).",
    },
    {
      title: "Showcase Technology",
      description:
        "Set up an exhibit table or demo hardware (3D scanners, CAD software, printers) directly to students.",
    },
    {
      title: "Student-Led Innovation",
      description:
        "Support an initiative organized entirely by high school student leaders from the William Lyon Mackenzie C.I. 3D Design Club.",
    },
  ];

  return (
    <section id="why" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Why partner</span>
          <span className="wire-text block">with MDC?</span>
        </motion.h2>

        {/* benefits grid */}
        <motion.div {...reveal(0.1)} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
              <div className="text-center space-y-2">
                {/* We don't have icons, so we'll use a simple dot or just the title */}
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">{benefit.title}</h3>
                <p className="text-concrete text-center">{benefit.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}