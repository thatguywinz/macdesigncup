import { motion, useReducedMotion } from "framer-motion";
import { NavLink } from "react-router-dom";

const EASE = [0.22, 1, 0.36, 1];
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
});

export default function RegistrationCTASection() {
  const reduce = useReducedMotion();

  return (
    <section id="register" className="relative z-10 overflow-hidden border-t border-line px-5 py-28 md:py-40">
      {/* molten glow rising from the floor */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_50%_78%,hsl(24_100%_54%/0.9),hsl(24_100%_54%/0.5))]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1200px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="display-scene mb-14 md:mb-16"
        >
          <span className="block">Ready to Partner with MDC 2026?</span>
          <span className="wire-text block">Join the movement.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Click below to complete our partner registration form. Let us know how your organization would like to participate and what logistical requirements you need.
        </motion.p>

        <motion.div
          {...reveal(0.2)}
          className="mt-16 flex items-center gap-4"
        >
          <NavLink to="/partner/register" className="btn-portal px-8 py-4">
            Open Partner Registration Form
          </NavLink>
          <button className="btn-ghost px-8 py-4" disabled>
            Download Partner Package (PDF)
          </button>
        </motion.div>
      </div>
    </section>
  );
}