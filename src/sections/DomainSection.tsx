import SectionWrapper from "./SectionWrapper";

interface DomainSectionProps {
  index: string;
  title: string;
  subtitle: string;
  description: string;
}

const DomainSection = ({ index, title, subtitle, description }: DomainSectionProps) => {
  return (
    <SectionWrapper>
      <div className="space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
          [ Domain {index} — {title} ]
        </p>
        <h2 className="section-subheading text-3xl sm:text-4xl">{subtitle}</h2>
        <p className="section-text text-base">{description}</p>
        <div className="text-5xl font-display font-semibold text-foreground/10">
          {index}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default DomainSection;
