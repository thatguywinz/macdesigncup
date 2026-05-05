import SectionWrapper from "./SectionWrapper";
import { GlassPanel } from "@/components/ui/glass-panel";

const EventDetailsSection = () => {
  return (
    <SectionWrapper>
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            [ Event details ]
          </p>
          <h2 className="section-subheading text-3xl sm:text-4xl">Event Details</h2>
        </div>
        <GlassPanel className="space-y-6 p-8 md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Date</p>
            <p className="text-2xl font-display text-foreground">May 31, 2026</p>
          </div>
          <div className="h-px w-16 bg-white/30" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Location</p>
            <p className="text-2xl font-display text-foreground">William Lyon Mackenzie CI</p>
          </div>
          <div className="h-px w-16 bg-white/30" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Format</p>
            <p className="text-2xl font-display text-foreground">12-Hour In-Person Designathon</p>
          </div>
        </GlassPanel>
      </div>
    </SectionWrapper>
  );
};

export default EventDetailsSection;
