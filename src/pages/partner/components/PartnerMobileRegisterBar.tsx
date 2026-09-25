import { PARTNER_REGISTRATION_URL } from "@/config/site";
import { NAV } from "@/content/copy";

/** Sticky bottom CTA — mobile only. */
export default function PartnerMobileRegisterBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/80 px-4 pt-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {/* "← Main site" moved into the menu; this bar holds the one CTA. */}
      <a
        href={PARTNER_REGISTRATION_URL}
        className="btn-portal focus-ember w-full whitespace-nowrap px-4 py-3.5 text-xs"
        target="_blank"
        rel="noopener noreferrer"
      >
        Partner with MDC ↗
        <span className="sr-only"> {NAV.newTab}</span>
      </a>
    </div>
  );
}
