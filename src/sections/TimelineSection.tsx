import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  { n: "01", title: "Brief Reveal", time: "[ 09:00 ]" },
  { n: "02", title: "Design & Build", time: "[ 09:30 ]" },
  { n: "03", title: "Submit", time: "[ 18:00 ]" },
  { n: "04", title: "Judging", time: "[ 18:30 ]" },
  { n: "05", title: "Awards", time: "[ 20:00 ]" },
];

export default function TimelineSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="timeline" ref={ref} className="relative z-10 border-t border-border bg-background/85 px-5 py-24 backdrop-blur-sm md:px-10 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 flex items-baseline gap-4">
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">[ TIMELINE ]</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h2 className="display-scene mb-16 text-gradient text-glow">How the day works</h2>

        <ol className="relative ml-1 border-l border-border">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative mb-12 pl-8 md:pl-12"
            >
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-sketch bg-background">
                <span className="absolute inset-[3px] rounded-full bg-sketch shadow-[0_0_10px_hsl(212_100%_65%)]" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">{s.n}</span>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{s.title}</h3>
                <span className="font-mono text-[11px] tracking-[0.15em] text-sketch">{s.time}</span>
              </div>
            </motion.li>
          ))}
        </ol>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Times are placeholder — final schedule announced closer to the event.
        </p>
      </div>
    </section>
  );
}
