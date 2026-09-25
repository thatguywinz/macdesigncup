import PartnerForm from "@/pages/partner/components/PartnerForm";
import PartnerNav from "@/pages/partner/components/PartnerNav";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";
import DisplayHeading from "@/components/motion/DisplayHeading";
import SiteFooter from "@/components/SiteFooter";
import { BREADCRUMBS } from "@/content/copy";

/**
 * /partner/register: the long-form partner onboarding form (posts to
 * /api/partner-register). Partner nav, breadcrumb trail, then the form.
 */
export default function PartnerRegister() {
  return (
    <div className="relative min-h-screen bg-background">
      <PartnerNav />
      <main
        id="main"
        className="relative z-10 px-5 pb-24 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pt-[calc(var(--nav-h)+2rem)] lg:px-16"
      >
        <div className="mx-auto w-full max-w-3xl">
          <Breadcrumbs
            items={[
              { label: BREADCRUMBS.home, to: "/" },
              { label: BREADCRUMBS.partner, to: "/partner" },
              { label: BREADCRUMBS.partnerRegister },
            ]}
            className="mb-8 md:mb-12"
          />
          <DisplayHeading as="h1" reveal={false} lines={["Partner registration"]} />

          {/* Dark native controls (radios, checkboxes, the date picker) on the dark plate. */}
          <div className="relative mt-10 border border-bone/10 px-4 py-2 [color-scheme:dark] md:mt-12 md:px-10 md:py-6">
            <PartnerForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
