import { motion } from "framer-motion";
import SectionWrapper from "./SectionWrapper";

const HeroSection = () => {
  return (
    <SectionWrapper className="relative">
      <div className="space-y-8">
        <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">
          Mackenzie Design Cup
        </p>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            [ Domain 01 — Mobility ]
          </p>
          <h1 className="text-6xl font-display font-semibold leading-none text-foreground sm:text-7xl lg:text-[5.5rem]">
            MDC 2026
          </h1>
          <p className="section-text text-base uppercase tracking-[0.3em] text-muted-foreground">
            1-Day 3D Designathon
          </p>
        </div>
        <div className="space-y-2 text-sm uppercase tracking-[0.35em] text-muted-foreground">
          <p>May 31, 2026</p>
          <p>William Lyon Mackenzie CI</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="absolute bottom-10 left-6 flex flex-col items-start gap-3 md:left-12"
      >
        <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-px bg-blue-500/70"
        />
      </motion.div>
    </SectionWrapper>
  );
};

export default HeroSection;
