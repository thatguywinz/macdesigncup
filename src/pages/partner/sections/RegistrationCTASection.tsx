import { motion, useReducedMotion } from "framer-motion";
import { PARTNER_REGISTRATION_URL } from "@/config/site";

const EASE = [0.22, 1, 0.36, 1];
const reveal = (delay = 0) => ({
  initial: { y: 16 },
  whileInView: { y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
});

export default function RegistrationCTASection() {
  const reduce = useReducedMotion();

  return (
    <section id="register" className="relative z-10 overflow-hidden border-t border-line px-5 py-28 md:py-40">
      {/* molten glow rising from the floor */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_78%,hsl(24_100%_40%/0.85),hsl(14_92%_26%/0.45)_45%,transparent_78%)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1200px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">Ready to partner</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2
          initial={reduce ? false : { y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="display-scene mb-8 md:mb-10"
        >
          <span className="block">Build the day</span>
          <span className="wire-text block">with us.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Tell us how you would like to help. We will send the next steps.
        </motion.p>

        <motion.div
          {...reveal(0.2)}
          className="mt-10 flex items-center gap-4"
        >
          <a href={PARTNER_REGISTRATION_URL} className="btn-portal px-8 py-4" target="_blank" rel="noopener noreferrer">
            Partner with MDC
          </a>
        </motion.div>
      </div>
    </section>
  );
}
