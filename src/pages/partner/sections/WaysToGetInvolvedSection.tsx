import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function WaysToGetInvolvedSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const options = [
    {
      title: "Guest Speaking",
      description: "Short presentation during Opening or Closing Ceremony.",
    },
    {
      title: "Mentoring",
      description: "Walk the floor during CAD design blocks to give feedback and guide students.",
    },
    {
      title: "Judging",
      description: "Join the judging panel during final student presentations and rubrics.",
    },
    {
      title: "Company Booth",
      description: "Set up a 6ft exhibit table in the main hall to showcase company projects.",
    },
    {
      title: "Swag & Prizes",
      description: "Donate company swag (stickers, lanyards, notebooks) or sponsor competition prizes.",
    },
    {
      title: "In-Kind & Hardware Support",
      description: "Loan equipment (3D printers, scanners) or provide software licenses/credits.",
    },
  ];

  return (
    <section id="involvement" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Ways to get</span>
          <span className="wire-text block">involved.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Choose how you'd like to participate. We'll work around your team's availability.
        </motion.p>

        {/* options grid */}
        <motion.div {...reveal(0.18)} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option, index) => (
            <div
              key={option.title}
              className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6"
            >
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">
                  {option.title}
                </h3>
                <p className="text-concrete text-center">{option.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* note card */}
        <motion.div {...reveal(0.26)} className="mt-12 flex flex-col items-center gap-4 border border-dashed border-ember/50 bg-background/40 p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
              <span className="text-ember text-sm font-mono">📝</span>
            </div>
            <p className="text-concrete">
              Representative schedules are flexible! Attendance for the entire day is not required—we will work around your team's availability.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}