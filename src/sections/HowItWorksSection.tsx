import { DraftingCompass, Sparkles, Timer, Trophy } from "lucide-react";
import SectionWrapper from "./SectionWrapper";
import { GlassPanel } from "@/components/ui/glass-panel";

const steps = [
  {
    title: "Kickoff Briefing",
    description: "Teams receive the challenge and domain context.",
    Icon: DraftingCompass,
  },
  {
    title: "Build in 3D",
    description: "Model, iterate, and validate concepts with mentors.",
    Icon: Timer,
  },
  {
    title: "Showcase",
    description: "Present prototypes and storytelling pitches.",
    Icon: Sparkles,
  },
  {
    title: "Awards",
    description: "Judges recognize the strongest design narratives.",
    Icon: Trophy,
  },
];

const HowItWorksSection = () => {
  return (
    <SectionWrapper contentClassName="max-w-2xl">
      <div className="space-y-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            [ How it works ]
          </p>
          <h2 className="section-subheading text-3xl sm:text-4xl">How It Works</h2>
        </div>
        <div className="space-y-4">
          {steps.map(({ title, description, Icon }) => (
            <GlassPanel
              key={title}
              className="flex items-start gap-4 rounded-2xl p-5 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_18px_50px_-35px_rgba(59,130,246,0.7)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10">
                <Icon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg text-foreground">{title}</p>
                <p className="section-text text-sm">{description}</p>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default HowItWorksSection;
