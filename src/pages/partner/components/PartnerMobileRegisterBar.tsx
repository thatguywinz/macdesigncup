import { NavLink } from "react-router-dom";

/** Sticky bottom CTA — mobile only. */
export default function PartnerMobileRegisterBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/80 px-4 pt-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <NavLink to="/partner/register" className="w-full py-3.5 text-xs btn-portal">
        Register as Partner
      </NavLink>
    </div>
  );
}