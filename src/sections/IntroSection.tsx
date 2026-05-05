import SectionWrapper from "./SectionWrapper";

const IntroSection = () => {
  return (
    <SectionWrapper>
      <div className="space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
          [ Design the Future ]
        </p>
        <h2 className="section-heading text-3xl sm:text-4xl md:text-5xl">
          Design the Future Through 3D
        </h2>
        <p className="section-text text-base">
          A high school designathon where students prototype ambitious ideas across mobility,
          infrastructure, medical design, and robotics in a single day.
        </p>
      </div>
    </SectionWrapper>
  );
};

export default IntroSection;
