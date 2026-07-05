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

export default function FAQSection() {
  return (
    <section id="faq" className="relative z-10 border-t border-border px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-8 flex items-baseline gap-4">
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">[ FAQ ]</span>
          </div>
          <h2 className="display-scene text-foreground">Questions,<br /><span className="wire-text">answered.</span></h2>
          <p className="mt-6 max-w-xs font-body text-sm font-light leading-relaxed text-muted-foreground">
            Everything a first-timer needs to know. <span className="hand ml-1">no dumb questions here</span>
          </p>
          <div className="mt-8">
            <RegisterButton className="px-7 py-3.5 text-xs">Register</RegisterButton>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-display text-base font-medium tracking-tight text-foreground hover:no-underline md:text-lg">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="font-body text-sm font-light leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
