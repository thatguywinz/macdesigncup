import { PARTNER_REGISTRATION_URL } from "@/config/site";
import { NAV } from "@/content/copy";
import { SheetEyebrow } from "@/components/blueprint/Sheet";
import CropMarks from "@/components/blueprint/CropMarks";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";

export default function RegistrationCTASection() {
  return (
    <section
      id="register"
      aria-labelledby="partner-cta-heading"
      className="relative z-10 overflow-hidden border-t border-line px-5 py-14 md:px-10 md:py-24 lg:px-16"
    >
      {/* molten glow rising from the floor */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_78%,hsl(24_100%_40%/0.85),hsl(14_92%_26%/0.45)_45%,transparent_78%)]"
        aria-hidden="true"
      />
      <CropMarks />
      <div className="relative mx-auto grid max-w-[1300px] gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div>
          <SheetEyebrow>Ready to partner</SheetEyebrow>
          <DisplayHeading id="partner-cta-heading" lines={["Build the day", "with us."]} outline="with us." />
        </div>

        <Reveal delay={0.1} className="lg:max-w-[22rem] lg:pb-3">
          <p className="font-body text-base font-light leading-relaxed text-foreground/80 md:text-lg">
            Join one session or the full day. We work around your team.
          </p>
          <a
            href={PARTNER_REGISTRATION_URL}
            className="btn-portal focus-ember mt-6 px-8 py-4 max-md:hidden"
            target="_blank"
            rel="noopener noreferrer"
          >
            Partner with MDC
            <span className="sr-only"> {NAV.newTab}</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
