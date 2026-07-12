import { motion, useReducedMotion } from "framer-motion";

// The whole day, compressed to four moves.
const STEPS = [
  { n: "01", title: "Idea", desc: "A theme drops. You riff." },
  { n: "02", title: "Sketch", desc: "Block it out, rough and fast." },
  { n: "03", title: "Model", desc: "Build it in 3D — any tool." },
  { n: "04", title: "Ship", desc: "Render, present, win." },
];

const EASE = [0.22, 1, 0.36, 1];

export default function ProcessSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative z-10 border-y border-line">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
            className="border-line px-6 py-10 even:border-l max-lg:[&:nth-child(n+3)]:border-t lg:border-l lg:px-10 lg:py-14 lg:first:border-l-0"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs tracking-[0.3em] text-ember">{s.n}</span>
              {i < STEPS.length - 1 && (
                <span className="font-mono text-xs text-concrete/60" aria-hidden="true">
                  →
                </span>
              )}
            </div>
            <h3 className="mt-4 font-display text-3xl uppercase leading-none tracking-[0.01em] text-foreground md:text-4xl">
              {s.title}
            </h3>
            <p className="mt-3 font-body text-sm font-light leading-relaxed text-concrete">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* electric floor line along the strip's bottom edge */}
      <div className="neon-rule absolute inset-x-0 bottom-0 opacity-50" aria-hidden="true" />
    </section>
  );
}
