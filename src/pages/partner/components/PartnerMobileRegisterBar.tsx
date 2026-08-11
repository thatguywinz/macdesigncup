import { Link } from "react-router-dom";
import { PARTNER_REGISTRATION_URL } from "@/config/site";

/** Sticky bottom CTA — mobile only. */
export default function PartnerMobileRegisterBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex gap-3 border-t border-line bg-background/80 px-4 pt-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Link to="/" className="btn-ghost shrink-0 px-3 py-4">
        ← Main site
      </Link>
      <a
        href={PARTNER_REGISTRATION_URL}
        className="btn-portal flex-1 whitespace-nowrap px-4 py-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Partner with MDC
      </a>
    </div>
  );
}
