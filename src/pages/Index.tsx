import Hero from "@/components/hero/Hero";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileRegisterBar from "@/components/MobileRegisterBar";
import GlanceSection from "@/sections/GlanceSection";
import PrizesSection from "@/sections/PrizesSection";
import SponsorsSection from "@/sections/SponsorsSection";
import DaySection from "@/sections/DaySection";
import FAQSection from "@/sections/FAQSection";
import CTASection from "@/sections/CTASection";

/**
 * The home page: one normally scrolling document. Every section is in the
 * DOM from the first render (SEO, no-JS, deep links). Order and ids per the
 * spec, section 5; sections alternate their layout so no two neighbours
 * share one (text | panel, drawing | text, full grid, drawing | steps, …).
 */
const Index = () => {
  return (
    // No bottom padding for the phone's sticky Register bar: it steps aside
    // while the final CTA or the footer is on screen, so it never covers them.
    <div className="relative min-h-screen bg-background">
      <SiteNav />
      <main id="main" className="relative z-10">
        <Hero />
        <GlanceSection />
        <PrizesSection />
        <SponsorsSection />
        <DaySection />
        <FAQSection />
        <CTASection />
      </main>
      <SiteFooter />
      <MobileRegisterBar />
    </div>
  );
};

export default Index;
