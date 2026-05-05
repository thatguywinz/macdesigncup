import SectionWrapper from "./SectionWrapper";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";

const CTASection = () => {
  return (
    <SectionWrapper>
      <GlassPanel className="space-y-6 p-10 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
          [ Final call ]
        </p>
        <h2 className="section-heading text-3xl sm:text-4xl md:text-5xl">Join MDC 2026</h2>
        <p className="section-text text-base">
          Register your team and turn ideas into high-impact 3D design stories.
        </p>
        <GlassButton size="lg" className="mt-4 px-10 py-6 text-sm uppercase tracking-[0.3em]">
          Register Now
        </GlassButton>
      </GlassPanel>
    </SectionWrapper>
  );
};

export default CTASection;
