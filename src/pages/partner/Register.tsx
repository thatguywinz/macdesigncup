import PartnerForm from "@/pages/partner/components/PartnerForm";
import PartnerNav from "@/pages/partner/components/PartnerNav";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";
import BlueprintBackdrop from "@/components/blueprint/BlueprintBackdrop";
import CropMarks from "@/components/blueprint/CropMarks";
import { SheetEyebrow } from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import SiteFooter from "@/components/SiteFooter";
import { BREADCRUMBS } from "@/content/copy";

/**
 * /partner/register: the long-form partner onboarding form (posts to
 * /api/partner-register). Same hall as /partner: grid backdrop, partner nav,
 * breadcrumb trail, then the form on one drafting plate.
 */
export default function PartnerRegister() {
  return (
    <div className="relative min-h-screen bg-background">
      <BlueprintBackdrop />
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
          <SheetEyebrow>MDC 2026 · Industry partner portal</SheetEyebrow>
          <DisplayHeading as="h1" reveal={false} lines={["Partner Registration", "Form"]} outline="Form" />

          {/* Dark native controls (radios, checkboxes, the date picker) on the dark plate. */}
          <div className="relative mt-10 border border-foreground/10 bg-background/70 px-4 py-2 [color-scheme:dark] md:mt-14 md:px-10 md:py-6">
            <CropMarks inset={-9} className="hidden md:block" />
            <PartnerForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
