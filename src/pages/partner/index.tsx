import PartnerNav from "@/pages/partner/components/PartnerNav";
import PartnerMobileRegisterBar from "@/pages/partner/components/PartnerMobileRegisterBar";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import BlueprintBackdrop from "@/components/blueprint/BlueprintBackdrop";
import DisplayHeading from "@/components/motion/DisplayHeading";

// Sections
import WhyPartnerSection from "@/pages/partner/sections/WhyPartnerSection";
import WaysToGetInvolvedSection from "@/pages/partner/sections/WaysToGetInvolvedSection";
import EventScheduleSection from "@/pages/partner/sections/EventScheduleSection";
import LogisticsComplianceSection from "@/pages/partner/sections/LogisticsComplianceSection";
import RegistrationCTASection from "@/pages/partner/sections/RegistrationCTASection";
import LogoWall from "@/pages/partner/components/LogoWall";
import {
  EVENT_DATE_SHORT,
  EVENT_FULL,
  GRADES,
  KICKER,
  PARTNER_REGISTRATION_URL,
  VENUE_CITY,
  VENUE_INSTITUTION,
} from "@/config/site";
import { BREADCRUMBS, NAV } from "@/content/copy";

// The partner page speaks to companies, not students, so its copy stays its
// own; the facts (date, venue, audience, format) still come from site.ts.
/** "Mackenzie Design Cup · a one-day 3D design competition" (names the event
 *  and the format in body text, for search and for a forwarded link). */
const KICKER_LINE = `${EVENT_FULL} · ${KICKER.replace(/^A /, "a ")}`;
/** The one line: who a partner reaches. */
const REACH = `Reach TDSB high school students, grades ${GRADES}, and the teachers who bring them.`;
const META = [EVENT_DATE_SHORT, `${VENUE_INSTITUTION}, ${VENUE_CITY}`] as const;

export default function PartnerPage() {
  return (
    // The sticky mobile CTA floats over the page; the footer needs room to clear it.
    <div className="relative min-h-screen bg-background pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <BlueprintBackdrop />
      <PartnerNav />
      <main id="main" className="relative z-10">
        {/* Hero: who you reach, one call to action, and who's already in. */}
        <section
          id="top"
          aria-labelledby="partner-h1"
          className="relative flex flex-col overflow-hidden border-b border-line px-5 pb-12 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pb-16 md:pt-[calc(var(--nav-h)+2rem)] lg:min-h-[88svh] lg:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_78%_52%,hsl(24_100%_54%/0.12),transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-[1300px]">
            <Breadcrumbs items={[{ label: BREADCRUMBS.home, to: "/" }, { label: BREADCRUMBS.partner }]} />
          </div>

          <div className="relative mx-auto flex w-full max-w-[1300px] flex-1 items-center pt-8 md:pt-12">
            <div className="grid w-full gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:items-center lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)] xl:gap-20">
              <div>
                {/* The first screen is plain markup (it is the page's LCP), never <Reveal>. */}
                <p className="mb-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.24em] text-ember md:mb-6 md:text-[11px]">
                  {KICKER_LINE}
                </p>
                <DisplayHeading
                  as="h1"
                  id="partner-h1"
                  reveal={false}
                  lines={["Back the", "next build."]}
                  outline="next build."
                />
                <p className="mt-5 max-w-[34rem] text-balance font-body text-lg font-light leading-snug text-foreground/85 md:mt-7 md:text-[1.35rem]">
                  {REACH}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-concrete md:text-[11px] md:tracking-[0.24em]">
                  {META.map((part, i) => (
                    <span key={part}>
                      {i > 0 && " · "}
                      <span className="whitespace-nowrap">{part}</span>
                    </span>
                  ))}
                </p>
                <div className="mt-9 hidden md:block">
                  <a
                    href={PARTNER_REGISTRATION_URL}
                    className="btn-portal focus-ember px-8 py-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Partner with MDC
                    <span className="sr-only"> {NAV.newTab}</span>
                  </a>
                </div>
              </div>

              <LogoWall label="Already on the wall" className="delay-200" />
            </div>
          </div>
        </section>

        <WhyPartnerSection />
        <WaysToGetInvolvedSection />
        <EventScheduleSection />
        <LogisticsComplianceSection />
        <RegistrationCTASection />
      </main>
      <SiteFooter />
      <PartnerMobileRegisterBar />
    </div>
  );
}
