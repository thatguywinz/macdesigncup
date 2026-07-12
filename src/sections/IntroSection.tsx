import { motion, useReducedMotion } from "framer-motion";
import RegisterButton from "@/components/RegisterButton";
import { EVENT_NAME, KICKER, MODEL_NO } from "@/config/site";

// Post-portal landing — the first room of the gallery after the gate.
const FACTS = [
  { k: "Who", v: "TDSB high schoolers · GTA" },
  { k: "Where", v: "George Brown College, Toronto" },
  { k: "Cost", v: "$0.00" },
  { k: "Prizes", v: "Cash + swag" },
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
        <motion.div {...reveal(0)} className="flex items-center gap-4">
          <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.8)]" aria-hidden="true" />
          <span className="mono-label !text-foreground/70">
            {EVENT_NAME} — {KICKER}
          </span>
        </motion.div>

        <motion.h1 {...reveal(0.08)} className="display-hero mt-8">
          <span className="block">You&rsquo;re</span>
          <span className="wire-text block">Inside.</span>
        </motion.h1>

        <motion.p
          {...reveal(0.16)}
          className="mt-8 max-w-xl font-body text-base font-light leading-relaxed text-concrete md:text-lg"
        >
          One day. One theme, revealed at the doors. You build a 3D response to it —
          start to finish, first idea to final render. No experience needed;
          half the field is opening the software for the first time.
        </motion.p>

        <motion.div {...reveal(0.24)} className="mt-10 flex flex-wrap items-center gap-4">
          <RegisterButton className="px-8 py-4">Enter the challenge</RegisterButton>
          <a href="#timeline" className="btn-ghost px-8 py-4">
            See the day ↓
          </a>
        </motion.div>

        {/* placard facts row */}
        <motion.dl
          {...reveal(0.34)}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 md:grid-cols-4 md:gap-x-10"
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
