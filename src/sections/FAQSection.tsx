import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RegisterButton from "@/components/RegisterButton";

const FAQS = [
  {
    q: "Who can enter?",
    a: "[Eligibility placeholder] — the Mac Design Cup is open to students. Beginners are welcome; no prior competition experience required.",
  },
  {
    q: "Do I need to know 3D software already?",
    a: "No. You can use any tool you're comfortable with — Blender, Fusion 360, Tinkercad, SketchUp, or your choice. We'll point you to beginner resources.",
  },
  {
    q: "Is it a team or solo event?",
    a: "[Team-size placeholder] — you can enter solo or as a small team. Details confirmed closer to the event.",
  },
  {
    q: "What do I actually build?",
    a: "On the day you receive a design theme. You concept, model, and prototype a 3D response — product, architectural, or industrial.",
  },
  {
    q: "How much does it cost?",
    a: "[Cost placeholder] — registration details and any fees will be shared on the registration page.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="relative z-10 border-t border-border bg-background/85 px-5 py-24 backdrop-blur-sm md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-8 flex items-baseline gap-4">
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">[ FAQ ]</span>
          </div>
          <h2 className="display-scene text-foreground">Questions,<br />answered.</h2>
          <p className="mt-6 max-w-sm font-body text-sm font-light leading-relaxed text-muted-foreground">
            Everything a first-time entrant needs to know. Still unsure? Register and we'll keep you posted.
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
