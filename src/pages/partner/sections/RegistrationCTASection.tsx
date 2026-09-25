import { PARTNER_REGISTRATION_URL } from "@/config/site";
import { NAV } from "@/content/copy";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";

export default function RegistrationCTASection() {
  return (
    <section
      id="register"
      aria-labelledby="partner-cta-heading"
      className="relative z-10 px-5 py-16 md:px-10 md:py-24 lg:px-16 xl:py-28"
    >
      <div className="relative mx-auto grid max-w-[1300px] gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        <div>
          <DisplayHeading id="partner-cta-heading" lines={["Get involved"]} />
        </div>

        <Reveal delay={0.1} className="lg:max-w-[22rem] lg:pb-3">
          <p className="font-body text-lg leading-relaxed text-foreground/75">
            Join one session or the full day. We work around your team.
          </p>
          <a
            href={PARTNER_REGISTRATION_URL}
            className="btn-portal focus-ember mt-6 min-h-[52px] px-8 py-3.5 text-[15px] max-md:hidden"
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
