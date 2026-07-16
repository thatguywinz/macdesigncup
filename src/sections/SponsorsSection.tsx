import { motion, useReducedMotion } from "framer-motion";
import { CONTACT_EMAIL } from "@/config/site";

// The gallery wall reserved for partners. No sponsor is confirmed yet, so the
// plaques stay honest: reserved slots, not invented logos.
// TODO: swap reserved slots for real sponsor logos as partners confirm.
const SLOTS = ["S.01", "S.02", "S.03"];

const EASE = [0.22, 1, 0.36, 1];

export default function SponsorsSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="sponsors" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[ 03 · Sponsors & Prizes ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">The sponsor</span>
          <span className="wire-text block">wall.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Food, swag and awards for a hall full of young designers happen because
          sponsors put their name on the wall. The wall is going up right now:
          logos land here as partners confirm.
        </motion.p>

        {/* reserved plaques */}
        <motion.div {...reveal(0.18)} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SLOTS.map((s) => (
            <div
              key={s}
              className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-concrete/70">{s}</span>
              <span className="font-display text-xl uppercase tracking-[0.02em] text-concrete">Reserved</span>
            </div>
          ))}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Sponsoring%20the%20Mac%20Design%20Cup`}
            className="group flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-ember/50 bg-background/40 p-6 transition-all duration-300 hover:border-ember hover:shadow-[0_0_36px_hsl(24_100%_54%/0.15)]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">S.04</span>
            <span className="font-display text-xl uppercase tracking-[0.02em] text-foreground transition-colors group-hover:text-ember">
              Your logo here ↗
            </span>
          </a>
        </motion.div>

        {/* prizes ledger */}
        <motion.div
          {...reveal(0.26)}
          className="mt-12 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between"
        >
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Top builds</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Awards, on stage
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Every builder</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Swag + food
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Full prize table</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Drops with the sponsor lineup
              </dd>
            </div>
          </dl>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Sponsoring%20the%20Mac%20Design%20Cup`}
            className="btn-ghost shrink-0 px-7 py-3.5"
          >
            Sponsor the cup ↗
          </a>
        </motion.div>
      </div>
    </section>
  );
}
