import { motion, useReducedMotion } from "framer-motion";
import RegisterButton from "@/components/RegisterButton";
import { MODEL_NO } from "@/config/site";

const EASE = [0.22, 1, 0.36, 1];

// The last room — the portal again, seen from the inside.
export default function CTASection() {
  const reduce = useReducedMotion();

  return (
    <section id="register" className="relative z-10 overflow-hidden border-t border-line px-5 py-28 md:py-40">
      {/* molten glow rising from the floor */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_50%_78%,hsl(24_100%_54%/0.14),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="ember-rule pointer-events-none absolute inset-x-[15%] bottom-0 opacity-60"
        aria-hidden="true"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mx-auto flex max-w-[1000px] flex-col items-center text-center"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.9)] animate-[blink_1.8s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span className="mono-label !text-foreground/70">Registration open</span>
        </div>

        <h2 className="display-hero mt-8">
          <span className="block">Build the</span>
          <span className="ember-text block">Impossible.</span>
        </h2>

        <div className="mt-12">
          <RegisterButton className="px-10 py-5 text-sm">Enter the challenge ↗</RegisterButton>
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-concrete">
          Free entry · Limited spots · {MODEL_NO}
        </p>
      </motion.div>
    </section>
  );
}
