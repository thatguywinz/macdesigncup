import { PARTNER_REGISTRATION_URL } from "@/config/site";
import { NAV } from "@/content/copy";

/** Sticky bottom CTA, phones only. */
export default function PartnerMobileRegisterBar() {
  return (
    <aside
      aria-label="Partner with MDC"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-bone/10 bg-background/90 px-4 pt-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {/* "← Main site" moved into the menu; this bar holds the one CTA. */}
      <a
        href={PARTNER_REGISTRATION_URL}
        className="btn-portal focus-ember min-h-[48px] w-full whitespace-nowrap px-4 py-3 text-[15px]"
        target="_blank"
        rel="noopener noreferrer"
      >
        Partner with MDC ↗
        <span className="sr-only"> {NAV.newTab}</span>
      </a>
    </aside>
  );
}
