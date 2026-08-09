import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import HeroGate from "@/components/hero/HeroGate";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileRegisterBar from "@/components/MobileRegisterBar";
import IntroSection from "@/sections/IntroSection";
import ExhibitsSection from "@/sections/ExhibitsSection";
import TimelineSection from "@/sections/TimelineSection";
import SponsorsSection from "@/sections/SponsorsSection";
import FAQSection from "@/sections/FAQSection";
import CTASection from "@/sections/CTASection";

/** White-hot afterglow that fades as you land inside the gallery. */
function ArrivalFlash() {
  const reduced = !!useReducedMotion();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGone(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] bg-[#fff7ea]"
      aria-hidden="true"
      style={{
        opacity: gone ? 0 : 1,
        transition: reduced ? "opacity 0.2s ease" : "opacity 1.1s ease-out 0.1s",
      }}
    />
  );
}

const Index = () => {
  const [entered, setEntered] = useState(false);

  // The gate owns the viewport: no scrolling until the visitor steps through.
  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
    if (!entered) {
      return () => {
        document.body.style.overflow = "";
      };
    }

    // Honor shared deep links like /#faq once the hall is open. The sections
    // mount in this same commit, so wait a frame for layout — and jump
    // instantly, since a smooth scroll here gets cut short by the reveal
    // animations firing underneath it.
    const raf = requestAnimationFrame(() => {
      const id = window.location.hash.slice(1);
      const target = id ? document.getElementById(decodeURIComponent(id)) : null;
      if (target) target.scrollIntoView({ block: "start", behavior: "auto" });
      else window.scrollTo(0, 0);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, [entered]);

  if (!entered) {
    return <HeroGate onEntered={() => setEntered(true)} />;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <ArrivalFlash />
      <div className="grain-overlay" aria-hidden="true" />
      <SiteNav />
      <main id="main" className="relative z-10">
        <IntroSection />
        <ExhibitsSection />
        <TimelineSection />
        <SponsorsSection />
        <FAQSection />
        <CTASection />
      </main>
      <SiteFooter />
      <MobileRegisterBar />
    </div>
  );
};

export default Index;
