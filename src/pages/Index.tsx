import MapLibreMap from "@/components/MapLibreMap";
import SceneCanvas from "@/components/3d/SceneCanvas";
import { useScrollStory } from "@/hooks/use-scroll-story";
import CTASection from "@/sections/CTASection";
import DomainSection from "@/sections/DomainSection";
import EventDetailsSection from "@/sections/EventDetailsSection";
import HeroSection from "@/sections/HeroSection";
import HowItWorksSection from "@/sections/HowItWorksSection";
import IntroSection from "@/sections/IntroSection";
import WhyJoinSection from "@/sections/WhyJoinSection";

const domainSections = [
  {
    index: "02",
    title: "Infrastructure",
    subtitle: "Bridge the future.",
    description: "Stretch the story from mobility into large-scale infrastructure with structural clarity.",
  },
  {
    index: "03",
    title: "Medical Design",
    subtitle: "Precision prosthetics.",
    description: "Reform the system into detailed medical components that emphasize accuracy and care.",
  },
  {
    index: "04",
    title: "Manufacturing",
    subtitle: "Robotic assembly.",
    description: "Scale the narrative into an industrial robotic arm with clean mechanical logic.",
  },
];

const Index = () => {
  const { scrollYProgress, cameraX, cameraY } = useScrollStory();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <MapLibreMap />
      <SceneCanvas scrollYProgress={scrollYProgress} cameraX={cameraX} cameraY={cameraY} />

      <main className="relative z-10 w-full md:w-[40%]">
        <HeroSection />
        <IntroSection />
        {domainSections.map((section) => (
          <DomainSection key={section.index} {...section} />
        ))}
        <HowItWorksSection />
        <EventDetailsSection />
        <WhyJoinSection />
        <CTASection />
        <div className="h-24" />
      </main>
    </div>
  );
};

export default Index;
