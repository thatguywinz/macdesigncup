import { useEffect, useRef, useState } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import { SCENES } from "@/config/scenes";
import HeroScene from "@/components/HeroScene";
import CADOverlay from "@/components/cad/CADOverlay";
import ProgressRail from "@/components/cad/ProgressRail";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SceneStack from "@/components/SceneStack";
import MobileRegisterBar from "@/components/MobileRegisterBar";
import TimelineSection from "@/sections/TimelineSection";
import FAQSection from "@/sections/FAQSection";

const Index = () => {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });
  const reduced = !!useReducedMotion();

  // Fade the scene chrome (rail, overlay) + dim the 3D scene once past the scrub.
  const [inScrub, setInScrub] = useState(true);
  useEffect(() => {
    const onScroll = () => {
      const el = stackRef.current;
      if (!el) return;
      const bottom = el.offsetTop + el.offsetHeight - window.innerHeight * 0.6;
      setInScrub(window.scrollY < bottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative bg-background">
      <div className="grain-overlay" aria-hidden="true" />

      <SiteNav />

      {/* Fixed cinematic layers — fade out past the scrub */}
      <div
        className="transition-opacity duration-700"
        style={{ opacity: inScrub ? 1 : 0.12, pointerEvents: "none" }}
      >
        <HeroScene progress={scrollYProgress} reducedMotion={reduced} />
      </div>
      <div
        className="transition-opacity duration-500"
        style={{ opacity: inScrub ? 1 : 0 }}
      >
        <CADOverlay progress={scrollYProgress} />
        <ProgressRail progress={scrollYProgress} />
      </div>

      <main id="main">
        {/* Cinematic scrub track — 8 scenes pinned while the object morphs */}
        <div ref={stackRef} className="relative" style={{ height: `${SCENES.length * 100}vh` }}>
          <SceneStack progress={scrollYProgress} />
        </div>

        <TimelineSection />
        <FAQSection />
      </main>

      <SiteFooter />
      <MobileRegisterBar />
    </div>
  );
};

export default Index;
