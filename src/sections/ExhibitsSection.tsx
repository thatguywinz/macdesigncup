import { motion, useReducedMotion } from "framer-motion";
import { MODEL_NO } from "@/config/site";

// "Why enter" framed as three works on display in the hall.
const EXHIBITS = [
  {
    n: "01",
    title: "No experience? Good.",
    body:
      "Half the field has never opened Blender — you'll learn more in one day here than in a month of tutorials.",
    medium: "Medium: Courage",
  },
  {
    n: "02",
    title: "Real stakes.",
    body:
      "Cash prizes, a judging panel, your work up on the big screen — it counts.",
    medium: "Medium: Pressure",
  },
  {
    n: "03",
    title: "Free everything.",
    body:
      "Free entry, free food all day, free swag — bring a laptop and an idea.",
    medium: "Medium: Pizza",
  },
];

const EASE = [0.22, 1, 0.36, 1];

export default function ExhibitsSection() {
  const reduce = useReducedMotion();

  return (
    <section id="why" className="relative z-10 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[ 01 — The Challenge ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="display-scene mb-16 md:mb-20"
        >
          <span className="block">From blank file</span>
          <span className="block">
            to something <span className="wire-text">real.</span>
          </span>
        </motion.h2>

        {/* exhibit plaques */}
        <div className="grid gap-5 md:grid-cols-3">
          {EXHIBITS.map((e, i) => (
            <motion.article
              key={e.n}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
              className="concrete-panel group relative flex flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ember/70 hover:shadow-[0_0_36px_hsl(24_100%_54%/0.12)] md:p-8"
            >
              {/* plaque header */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span
                    className="h-1 w-1 bg-ember shadow-[0_0_8px_hsl(24_100%_54%/0.9)] transition-transform duration-300 group-hover:scale-150"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">
                    Exhibit {e.n}
                  </span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete/70">
                  {MODEL_NO}
                </span>
              </div>

              <h3 className="mt-7 font-display text-2xl uppercase leading-[0.95] tracking-[0.01em] text-foreground md:text-3xl">
                {e.title}
              </h3>

              <p className="mt-4 flex-1 font-body text-sm font-light leading-relaxed text-concrete">
                {e.body}
              </p>

              {/* museum placard footer */}
              <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete transition-colors duration-300 group-hover:text-ember/80">
                  {e.medium}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete/60">
                  Ex.{e.n}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
