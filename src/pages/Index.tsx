import { useState, useEffect, lazy, Suspense } from 'react';
import HeroSection from '@/components/HeroSection';
import ScrollSection from '@/components/ScrollSection';
import TimelineStep from '@/components/TimelineStep';
import GlassCard from '@/components/GlassCard';

const Scene3D = lazy(() => import('@/components/Scene3D'));

const timelineSteps = [
  { step: '01', title: 'Opening Ceremony' },
  { step: '02', title: 'Design & Build' },
  { step: '03', title: 'Submit Your Work' },
  { step: '04', title: 'Judging' },
  { step: '05', title: 'Awards Ceremony' },
];

const whyJoinItems = [
  'Build something real',
  'Compete with top students',
  'Turn ideas into reality',
];

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(Math.min(progress, 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* 3D Background */}
      <Suspense fallback={null}>
        <Scene3D scrollProgress={scrollProgress} />
      </Suspense>

      {/* Content */}
      <main>
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: Intro */}
        <ScrollSection>
          <div className="text-center max-w-3xl mx-auto">
            <p className="section-heading text-3xl md:text-5xl lg:text-6xl">
              A 3D Designathon bringing together students across the GTA
            </p>
          </div>
        </ScrollSection>

        {/* Section 3: Theme */}
        <ScrollSection>
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="section-heading">Design the Future</h2>
            <p className="section-text text-lg md:text-2xl">
              Solve real problems through 3D design
            </p>
          </div>
        </ScrollSection>

        {/* Section 4: How It Works */}
        <ScrollSection>
          <div className="max-w-2xl mx-auto">
            <h2 className="section-subheading mb-12 text-center">How It Works</h2>
            <div className="space-y-2">
              {timelineSteps.map((item, i) => (
                <TimelineStep key={item.step} step={item.step} title={item.title} index={i} />
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* Section 5: Event Details */}
        <ScrollSection>
          <div className="text-center space-y-8">
            <h2 className="section-subheading mb-10">Event Details</h2>
            <div className="glass-panel inline-block px-12 py-10 space-y-6">
              <div>
                <p className="section-text text-sm uppercase tracking-[0.2em] mb-1">Date</p>
                <p className="font-display text-2xl md:text-3xl text-foreground">May 31, 2026</p>
              </div>
              <div className="w-16 h-px bg-border mx-auto" />
              <div>
                <p className="section-text text-sm uppercase tracking-[0.2em] mb-1">Location</p>
                <p className="font-display text-2xl md:text-3xl text-foreground">William Lyon Mackenzie CI</p>
              </div>
              <div className="w-16 h-px bg-border mx-auto" />
              <div>
                <p className="section-text text-sm uppercase tracking-[0.2em] mb-1">Format</p>
                <p className="font-display text-2xl md:text-3xl text-foreground">12-Hour In-Person Designathon</p>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* Section 6: Why Join */}
        <ScrollSection>
          <div>
            <h2 className="section-subheading mb-12 text-center">Why Join</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {whyJoinItems.map((item, i) => (
                <GlassCard key={i} text={item} index={i} />
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* Section 7: CTA */}
        <ScrollSection>
          <div className="text-center space-y-8">
            <h2 className="section-heading">Join MDC 2026</h2>
            <p className="section-text">Be part of something extraordinary.</p>
            <a
              href="#register"
              className="glass-button inline-block text-foreground"
            >
              Register Now
            </a>
          </div>
        </ScrollSection>

        {/* Footer spacer */}
        <div className="h-24" />
      </main>
    </div>
  );
};

export default Index;
