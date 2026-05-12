import SectionWrapper from "./SectionWrapper";
import { GlassPanel } from "@/components/ui/glass-panel";

const highlights = [
  {
    title: "Learn",
    description: "Expand your CAD skills with mentors and workshops.",
  },
  {
    title: "Compete",
    description: "Stand out with a judged prototype and narrative.",
  },
  {
    title: "Build Portfolio",
    description: "Leave with a refined project for applications.",
  },
];

const WhyJoinSection = () => {
  return (
    <SectionWrapper contentClassName="max-w-3xl">
      <div className="space-y-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            [ Why join ]
          </p>
          <h2 className="section-subheading text-3xl sm:text-4xl">Why Join</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <GlassPanel
              key={item.title}
              className="space-y-3 p-6 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_18px_50px_-35px_rgba(59,130,246,0.7)]"
            >
              <p className="text-lg font-display text-foreground">{item.title}</p>
              <p className="section-text text-sm">{item.description}</p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default WhyJoinSection;
