import { motion, useReducedMotion } from "framer-motion";
import { NavLink } from "react-router-dom";
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
import { EVENT_NAME } from "@/config/site";

export default function PartnerPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background">
      <PartnerNav />
      <main id="main" className="relative z-10">
        {/* Hero Section */}
        <section className="relative z-10 flex min-h-[92svh] items-center border-b border-line px-5 pb-20 pt-32 md:px-10">
          <div className="mx-auto w-full max-w-[1300px]">
            <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-16">
              <div className="space-y-6">
                {/* Tagline Badge */}
                <span className="flex items-center gap-2 rounded-md bg-ember/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.3em] text-ember">
                  MDC 2026 • INDUSTRY PARTNER PORTAL
                </span>
                <motion.h1
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="display-hero mt-4"
                >
                  <span className="block">Empower the Next Generation of</span>
                  <span className="wire-text block">3D Designers & Engineers</span>
                </motion.h1>
                <motion.p
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                  className="mt-6 max-w-xl font-body text-base font-light leading-relaxed text-concrete md:text-lg"
                >
                  Join us at George Brown College on November 16, 2026, to mentor, judge, and connect with 80+ top high school CAD competitors across the TDSB.
                </motion.p>
<motion.div
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
                  className="mt-10 flex flex-wrap items-center gap-4"
                >
                  <NavLink to="/partner/register" className="btn-portal px-8 py-4">
                    Register Your Organization
                  </NavLink>
                  <button className="btn-ghost px-8 py-4" disabled>
                    Download Partner Package (PDF)
                  </button>
                </motion.div>

                {/* Event Highlights Bar */}
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
                  className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 text-[11px] font-mono uppercase tracking-[0.28em] text-concrete md:grid-cols-4"
                >
                  <div className="flex flex-col gap-1">
                    <span>Date:</span>
                    <span className="text-foreground">Monday, November 16, 2026</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Location:</span>
                    <span className="text-foreground">George Brown College, Waterfront Campus (51 Dockside Dr, Toronto, ON)</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Audience:</span>
                    <span className="text-foreground">75–80 TDSB High School Students (Grades 9–12)</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Format:</span>
                    <span className="text-foreground">1-Day In-Person CAD Design Sprint</span>
                  </div>
                </motion.div>
              </div>

              {/* launch clock fills the right wing of the hall */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
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