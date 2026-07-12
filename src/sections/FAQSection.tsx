import { motion, useReducedMotion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RegisterButton from "@/components/RegisterButton";

const FAQS = [
  { q: "Who can enter?", a: "Any TDSB high schooler across the Greater Toronto Area. Beginners are welcome — no experience needed." },
  { q: "What does it cost?", a: "Nothing. It's free to enter, and food and swag are on us." },
  { q: "Do I need to know 3D software?", a: "Nope. Use whatever you like — Blender, Fusion 360, Tinkercad, or any tool of your choice." },
  { q: "Where does it happen?", a: "At George Brown College's downtown Toronto campus, alongside our sponsors." },
  { q: "Solo or team?", a: "Either works. Team details are announced closer to the day." },
  { q: "What will I build?", a: "You get a theme on the day and design a 3D response to it, start to finish." },
];

const EASE = [0.22, 1, 0.36, 1];

export default function FAQSection() {
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-14 md:grid-cols-[0.8fr_1.2fr]">
        {/* left column */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="mb-6 flex items-baseline gap-4">
            <span className="mono-label !text-foreground/70">[ 03 — FAQ ]</span>
          </div>
          <h2 className="display-scene">
            <span className="block">Questions,</span>
            <span className="wire-text block">answered.</span>
          </h2>
          <p className="mt-6 max-w-xs font-body text-sm font-light leading-relaxed text-concrete">
            Everything a first-timer needs to know — straight answers, no fine print.
          </p>
          <div className="mt-9">
            <RegisterButton className="px-7 py-3.5">Register</RegisterButton>
          </div>
        </motion.div>

        {/* accordion */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full border-t border-line">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-line">
                <AccordionTrigger className="gap-6 py-5 text-left font-display text-base font-normal uppercase tracking-[0.01em] text-foreground transition-colors hover:text-ember hover:no-underline md:text-lg [&>svg]:text-concrete">
                  <span className="flex items-baseline gap-4 md:gap-5">
                    <span className="w-9 shrink-0 font-mono text-[11px] tracking-[0.14em] text-ember/80">
                      Q.{String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-[52px] pr-8 font-body text-sm font-light leading-relaxed text-concrete md:pl-[56px]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
