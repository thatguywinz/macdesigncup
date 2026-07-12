import { motion, useReducedMotion } from "framer-motion";

// The shape of the day. Exact clock times are announced closer to the event,
// so we describe the phases rather than invent a schedule.
const STEPS = [
  { n: "01", title: "Doors Open", desc: "Check in, meet your team, grab food." },
  { n: "02", title: "Theme Drop", desc: "The brief is revealed. The clock starts." },
  { n: "03", title: "Design Sprint", desc: "Build your 3D response, start to finish." },
  { n: "04", title: "Submissions", desc: "Tools down. Lock in your final build." },
  { n: "05", title: "Judging & Awards", desc: "Judges review. Winners take the prizes." },
];

const EASE = [0.22, 1, 0.36, 1];

export default function TimelineSection() {
  const reduce = useReducedMotion();

  return (
    <section id="timeline" className="relative z-10 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[ 02 — The Day ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="display-scene mb-16 md:mb-20"
        >
          <span className="block">One day.</span>
          <span className="block">
            Start to <span className="wire-text">finish.</span>
          </span>
        </motion.h2>

        {/* vertical timeline */}
        <ol className="relative">
          {/* molten guide line */}
          <span
            className="absolute inset-y-1 left-[5px] w-px bg-gradient-to-b from-ember via-ember/35 to-transparent"
            aria-hidden="true"
          />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
              className="relative pb-12 pl-10 last:pb-0 md:pl-14"
            >
              {/* glowing waypoint */}
              <span
                className="absolute left-0 top-1.5 h-[11px] w-[11px] rotate-45 border border-ember bg-background shadow-[0_0_14px_hsl(24_100%_54%/0.65)]"
                aria-hidden="true"
              >
                <span className="absolute inset-[2.5px] bg-ember" />
              </span>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xs tracking-[0.3em] text-ember">{s.n}</span>
                <h3 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">
                  {s.title}
                </h3>
              </div>
              <p className="mt-2 max-w-lg font-body text-sm font-light leading-relaxed text-concrete md:text-base">
                {s.desc}
              </p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-14 flex items-center gap-3 border-t border-line pt-6">
          <span className="h-1 w-1 bg-ember shadow-[0_0_8px_hsl(24_100%_54%/0.9)]" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-concrete">
            Full run-of-day announced closer to the event.
          </span>
        </div>
      </div>
    </section>
  );
}
