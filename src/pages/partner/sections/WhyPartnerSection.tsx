import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function WhyPartnerSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="why" className="relative z-10 border-t border-line px-5 py-24 md:px-1. z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Why Partner with MDC 2026?</span>
          <span className="wire-text block">• Fuel the Next Generation of Innovators</span>
        </motion.h2>

        {/* Narrative Pitch Box */}
        <motion.p {...reveal(0.1)} className="max-w-xl font-body text-base font-light leading-relaxed text-concrete">
          The Mackenzie Design Cup (MDC 2026) is Toronto’s premier student-led 3D designathon. Hosted at George Brown College's Waterfront Campus, MDC brings together 80+ of the most passionate high school CAD competitors across the TDSB. As an industry partner, you aren't just placing a logo on a banner—you are directly bridging the gap between classroom CAD skills and real-world engineering careers.
        </motion.p>

        {/* Value Pillars Grid */}
        <motion.div {...reveal(0.2)} className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-4">
          {/* Direct Youth & STEM Impact */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Direct Youth & STEM Impact</h3>
              <p className="text-concrete text-center">
                Expose ambitious high schoolers (Grades 9–12) to real-world design, engineering, and product development workflows.
                Help students see 3D design as a viable post-secondary path and career choice, not just a high school elective.
              </p>
            </div>
          </div>

          {/* Technology & Hardware Showcase */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Technology & Hardware Showcase</h3>
              <p className="text-concrete text-center">
                Put your tools directly into the hands of future power-users.
                Set up dedicated exhibit tables or run live hardware demos—including 3D printers, scanners, VR gear, or CAD software—right in the main hall.
              </p>
            </div>
          </div>

          {/* Brand & Community Visibility */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Brand & Community Visibility</h3>
              <p className="text-concrete text-center">
                Position your organization as a leader in educational outreach and STEM innovation.
                Gain prominent exposure across event signage, presentation slides, student award certificates, and our official Instagram (@wlmac.3ddesign).
              </p>
            </div>
          </div>

          {/* Flexible, High-Value Involvement */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Flexible, High-Value Involvement</h3>
              <p className="text-concrete text-center">
                We respect your team's busy calendar. Attendance for the full day is never required—we tailor custom time slots for guest speaking, design feedback, or judging to fit your availability.
                Key roles include guest speaking, mentoring during design sprints, evaluating final presentations, or donating hardware/swag.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Bar */}
        <motion.div {...reveal(0.3)} className="mt-12 grid grid-cols-2 gap-x-4 gap-y-4 text-[11px] font-mono uppercase tracking-[0.28em] text-concrete md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span>80+</span>
            <span className="text-foreground">Hand-picked TDSB CAD competitors (Grades 9–12)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>1 Day</span>
            <span className="text-foreground">High-intensity CAD design sprint at George Brown College</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>100% Free</span>
            <span className="text-foreground">Zero cost barrier for participating students</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>Student-Led</span>
            <span className="text-foreground">Organized by the WLMAC 3D Design Club executive team</span>
          </div>
        </motion.div>

        {/* In-Kind & Flexible Support Callout */}
        <motion.div {...reveal(0.4)} className="mt-12 flex flex-col items-center gap-4 border border-dashed border-ember/50 bg-background/40 p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
              <span className="text-ember text-sm font-mono">💡</span>
            </div>
            <p className="text-concrete text-center">
              Flexible Ways to Support: Cash sponsorship isn't the only way to help! We strongly welcome in-kind hardware support (loaning 3D printers or scanners), software licenses/credits, company swag (stickers, lanyards, tech accessories), or prize donations for top design winners.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}