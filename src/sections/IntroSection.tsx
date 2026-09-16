import { motion, useReducedMotion } from "framer-motion";
import Countdown from "@/components/Countdown";
import RegisterButton from "@/components/RegisterButton";
import {
  EVENT_DATE_LABEL,
  EVENT_NAME,
  EVERY_BUILDER,
  GRAND_PRIZE,
  KICKER,
  MODEL_NO,
  ON_THE_FLOOR,
  PRIZE_EXTRAS,
  PRIZE_POOL,
  VENUE,
} from "@/config/site";

// Post-portal landing — the first room of the gallery after the gate.
// Prizes are not in this row: the top prize is confirmed now, and it earns the
// plinth below rather than a one-line placard.
const FACTS = [
  { k: "When", v: `Mon, ${EVENT_DATE_LABEL}` },
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
      className="relative z-10 flex min-h-[92svh] items-center border-b border-line px-5 pb-16 pt-28 md:px-10 md:pb-20 md:pt-32"
    >
      {/* corner metadata */}
      <span
        className="pointer-events-none absolute right-5 top-24 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-concrete md:right-10 md:block"
        aria-hidden="true"
      >
        Hall 01 / {MODEL_NO}
      </span>

      <div className="mx-auto w-full max-w-[1300px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-16">
          <div>
            <motion.div {...reveal(0)} className="flex items-center gap-4">
              <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.8)]" aria-hidden="true" />
              {/* Both halves together wrap onto a second line on a phone, and the
                  nav is already carrying the name two inches above this. */}
              <span className="mono-label !text-foreground/70">
                <span className="hidden sm:inline">{EVENT_NAME} · </span>
                {KICKER}
              </span>
            </motion.div>

            <motion.h1 {...reveal(0.08)} className="display-hero mt-6 md:mt-8">
              <span className="block">The floor</span>
              <span className="wire-text block">is yours.</span>
            </motion.h1>

            <motion.p
              {...reveal(0.16)}
              className="mt-6 max-w-xl font-body text-base font-light leading-relaxed text-concrete md:mt-8 md:text-lg"
            >
              One day. One theme, revealed at the doors. You build a 3D response to it,
              first idea to final render, in whatever software you build fastest in.
              The clock does the rest.
            </motion.p>

            {/* On a phone the sticky bar is already holding Register two inches
                below this, so only the secondary route shows here. */}
            <motion.div {...reveal(0.24)} className="mt-8 flex flex-wrap items-center gap-4 md:mt-10">
              <RegisterButton className="hidden px-8 py-4 md:inline-flex">Register now ↗</RegisterButton>
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
        <motion.div {...reveal(0.3)} className="concrete-panel relative mt-10 overflow-hidden md:mt-14">
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

            <div className="self-center border-t border-line pt-7 sm:border-l sm:border-t-0 sm:pl-12 sm:pt-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">1st place</p>
              <p className="mt-2 max-w-2xl font-display text-2xl uppercase leading-[1.05] text-foreground md:text-3xl">
                {GRAND_PRIZE}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-concrete">From Shop3D.ca</p>
            </div>
          </div>

          {/* Phones get the figure and the way to the rest of it, not the rest of it. */}
          <a
            href="#sponsors"
            className="relative flex items-center justify-between gap-4 border-t border-line px-7 py-5 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:text-ember md:hidden"
          >
            The full prize table
            <span aria-hidden="true" className="text-ember">↓</span>
          </a>

          {/* The rest of the table: what else is up for grabs, what everyone leaves
              with, and who is on the floor. Each line credits the sponsor behind it.
              Three stacked columns of it is a wall of text on a phone, so below
              `md` the plinth stops at the figure and the sponsor ledger carries
              the detail instead of the landing screen saying it all twice. */}
          <div className="relative hidden gap-8 border-t border-line p-7 sm:p-10 md:grid md:grid-cols-3 md:gap-10">
            {(
              [
                ["Also up for grabs", PRIZE_EXTRAS],
                ["Every builder gets", EVERY_BUILDER],
                ["On the floor", ON_THE_FLOOR],
              ] as const
            ).map(([title, items], i) => (
              <div key={title} className={i > 0 ? "md:border-l md:border-line md:pl-10" : ""}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">{title}</h3>
                <ul className="mt-4 space-y-4">
                  {items.map(({ item, from }) => (
                    <li key={item}>
                      <p className="font-body text-base font-light leading-snug text-foreground/90">{item}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-concrete">{from}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* placard facts row */}
        <motion.dl
          {...reveal(0.38)}
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8 md:mt-12 md:grid-cols-4 md:gap-x-10 md:gap-y-8"
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
