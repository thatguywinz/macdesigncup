import { motion, useReducedMotion } from "framer-motion";
import Countdown from "@/components/Countdown";
import RegisterButton from "@/components/RegisterButton";
import { EVENT_NAME, GRAND_PRIZE, KICKER, MODEL_NO, PRIZE_POOL, VENUE } from "@/config/site";

// Post-portal landing — the first room of the gallery after the gate.
// Prizes are not in this row: the top prize is confirmed now, and it earns the
// plinth below rather than a one-line placard.
const FACTS = [
  { k: "Who", v: "TDSB high school students" },
  { k: "Where", v: VENUE },
  { k: "Cost", v: "TBA" },
];

const EASE = [0.22, 1, 0.36, 1];

export default function IntroSection() {
  const reduce = useReducedMotion();

  const reveal = (delay: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section
      id="top"
      className="relative z-10 flex min-h-[92svh] items-center border-b border-line px-5 pb-20 pt-32 md:px-10"
    >
      {/* corner metadata */}
      <span
        className="pointer-events-none absolute right-5 top-24 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-concrete md:right-10 md:block"
        aria-hidden="true"
      >
        Hall 01 / {MODEL_NO}
      </span>

      <div className="mx-auto w-full max-w-[1300px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-16">
          <div>
            <motion.div {...reveal(0)} className="flex items-center gap-4">
              <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.8)]" aria-hidden="true" />
              <span className="mono-label !text-foreground/70">
                {EVENT_NAME} · {KICKER}
              </span>
            </motion.div>

            <motion.h1 {...reveal(0.08)} className="display-hero mt-8">
              <span className="block">The floor</span>
              <span className="wire-text block">is yours.</span>
            </motion.h1>

            <motion.p
              {...reveal(0.16)}
              className="mt-8 max-w-xl font-body text-base font-light leading-relaxed text-concrete md:text-lg"
            >
              One day. One theme, revealed at the doors. You build a 3D response to it,
              first idea to final render, in whatever software you build fastest in.
              The clock does the rest.
            </motion.p>

            <motion.div {...reveal(0.24)} className="mt-10 flex flex-wrap items-center gap-4">
              <RegisterButton className="px-8 py-4">Register now ↗</RegisterButton>
              <a href="#timeline" className="btn-ghost px-8 py-4">
                See the day ↓
              </a>
            </motion.div>
          </div>

          {/* launch clock fills the right wing of the hall */}
          <motion.div {...reveal(0.2)}>
            <Countdown />
          </motion.div>
        </div>

        {/* The prize plinth: lit from above like everything else on display here. */}
        <motion.div {...reveal(0.3)} className="concrete-panel relative mt-14 overflow-hidden">
          <span className="ember-rule absolute inset-x-0 top-0 opacity-80" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(48%_130%_at_16%_50%,hsl(24_100%_54%/0.14),transparent_72%)]"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 p-7 sm:grid-cols-[auto_1fr] sm:gap-12 sm:p-10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">On the table</p>
              {/* .ember-text paints through background-clip, so the paint area is this
                  box: a line-height under ~1.2 shears the comma's tail off and the
                  figure reads as "$1.500+". The leading is the gap above and below. */}
              <p className="display-giant ember-text text-[clamp(3.1rem,8vw,5.5rem)] leading-[1.25]">
                {PRIZE_POOL}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/75">
                In prizes
              </p>
            </div>

            <dl className="grid content-center gap-6 border-t border-line pt-7 sm:border-l sm:border-t-0 sm:pl-12 sm:pt-0 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">1st place</dt>
                <dd className="mt-2 max-w-md font-body text-base font-light leading-relaxed text-foreground/90 lg:max-w-none lg:text-lg">
                  {GRAND_PRIZE}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Every builder</dt>
                <dd className="mt-2 max-w-md font-body text-base font-light leading-relaxed text-concrete">
                  Swag and food, all day.
                </dd>
              </div>
            </dl>
          </div>
        </motion.div>

        {/* placard facts row */}
        <motion.dl
          {...reveal(0.38)}
          className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 md:grid-cols-3 md:gap-x-10"
        >
          {FACTS.map((f, i) => (
            <div key={f.k} className={i > 0 ? "md:border-l md:border-line md:pl-8" : ""}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">{f.k}</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-foreground/80">
                {f.v}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
