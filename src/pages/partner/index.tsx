import { motion, useReducedMotion } from "framer-motion";
import PartnerNav from "@/pages/partner/components/PartnerNav";
import PartnerMobileRegisterBar from "@/pages/partner/components/PartnerMobileRegisterBar";
import SiteFooter from "@/components/SiteFooter";

// Sections
import WhyPartnerSection from "@/pages/partner/sections/WhyPartnerSection";
import WaysToGetInvolvedSection from "@/pages/partner/sections/WaysToGetInvolvedSection";
import EventScheduleSection from "@/pages/partner/sections/EventScheduleSection";
import LogisticsComplianceSection from "@/pages/partner/sections/LogisticsComplianceSection";
import RegistrationCTASection from "@/pages/partner/sections/RegistrationCTASection";
import Countdown from "@/components/Countdown";
import { PARTNER_REGISTRATION_URL } from "@/config/site";

export default function PartnerPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background">
      <PartnerNav />
      <main id="main" className="relative z-10">
        {/* Hero Section */}
        <section
          id="top"
          className="relative z-10 flex min-h-[92svh] items-center overflow-hidden border-b border-line px-5 pb-20 pt-32 md:px-10"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_82%_48%,hsl(24_100%_54%/0.12),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="mx-auto w-full max-w-[1300px]">
            <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-16">
              <div className="space-y-6">
                                <motion.h1
                  initial={reduce ? false : { y: 16 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="display-scene mb-8 md:mb-10"
                >
                  <span className="block">Back the</span>
                  <span className="wire-text block">next build.</span>
                </motion.h1>
                <motion.p
                  initial={reduce ? false : { y: 16 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                  className="mt-6 max-w-xl font-body text-base font-light leading-relaxed text-concrete md:text-lg"
                >
                  Join 80 TDSB students at George Brown College as a speaker, mentor, judge, exhibitor, or sponsor.
                </motion.p>
<motion.div
                  initial={reduce ? false : { y: 16 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
                  className="mt-10 flex flex-wrap items-center gap-4"
                >
                  <a href={PARTNER_REGISTRATION_URL} className="btn-portal px-8 py-4" target="_blank" rel="noopener noreferrer">
                    Partner with MDC
                  </a>
                </motion.div>

                {/* Event Highlights Bar */}
                <motion.div
                  initial={reduce ? false : { y: 16 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
                  className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 text-[11px] font-mono uppercase tracking-[0.28em] text-concrete md:grid-cols-4"
                >
                  <div className="flex flex-col gap-1">
                    <span>Date:</span>
                    <span className="text-foreground">November 16, 2026</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Location:</span>
                    <span className="text-foreground">51 Dockside Drive, Toronto</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Audience:</span>
                    <span className="text-foreground">80 TDSB students, Grades 9–12</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Format:</span>
                    <span className="text-foreground">One-day CAD design sprint</span>
                  </div>
                </motion.div>
              </div>

              {/* launch clock fills the right wing of the hall */}
              <motion.div
                initial={reduce ? false : { y: 16 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              >
                <Countdown />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Partner */}
        <WhyPartnerSection />

        {/* Ways to Get Involved */}
        <WaysToGetInvolvedSection />

        {/* Event Schedule */}
        <EventScheduleSection />

        {/* Logistics & Compliance */}
        <LogisticsComplianceSection />

        {/* Registration CTA */}
        <RegistrationCTASection />
      </main>
      <SiteFooter />
      <PartnerMobileRegisterBar />
    </div>
  );
}
