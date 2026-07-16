import { motion, useReducedMotion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CONTACT_EMAIL } from "@/config/site";

const FAQS = [
  {
    q: "Who can enter?",
    a: "Any TDSB high school student, any grade. If you're enrolled at a TDSB school, you're eligible; you don't need to be in a design club or have competed anywhere before.",
  },
  {
    q: "What does it cost?",
    a: "We're finalizing this. Entry will either be free or a small fee that goes straight into food for the day. Everyone who registers hears the final answer first.",
  },
  {
    q: "Do I need to know 3D software?",
    a: "You should have some 3D design knowledge: enough to open a tool and model a simple object. Beyond that, you're free to use any software you want. Blender, Fusion 360, Onshape, Tinkercad, Maya: if you can build in it, you can compete in it.",
  },
  {
    q: "Where does it happen?",
    a: "At George Brown College in Toronto. The exact campus, building and directions are emailed to every registered builder before the day, so you'll know exactly where to go.",
  },
  {
    q: "Solo or team?",
    a: "Solo entry is confirmed. We're still finalizing whether teams run this year; register and you'll get the team rules by email as soon as they're locked in.",
  },
  {
    q: "What will I build?",
    a: "You get a theme on the morning of the event and design a 3D response to it, start to finish: concept, blockout, model, final render. What it becomes is entirely your call: a product, a space, a creature, a machine.",
  },
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
            <span className="mono-label !text-foreground/70">[ 04 · FAQ ]</span>
          </div>
          <h2 className="display-scene">
            <span className="block">Questions?</span>
            <span className="wire-text block">Answered.</span>
          </h2>
          <p className="mt-6 max-w-xs font-body text-sm font-light leading-relaxed text-concrete">
            Everything a first-timer needs to know. Straight answers, no fine print.
          </p>

          {/* direct line for anything the accordion doesn't cover */}
          <div className="concrete-panel mt-9 max-w-xs p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">
              More questions?
            </p>
            <p className="mt-3 font-body text-sm font-light leading-relaxed text-concrete">
              Ask us directly. We read everything and answer fast.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Mac%20Design%20Cup%20question`}
              className="btn-ghost mt-5 px-6 py-3"
            >
              Ask here ↗
            </a>
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
