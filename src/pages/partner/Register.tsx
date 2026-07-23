import PartnerForm from "@/pages/partner/components/PartnerForm";
import { EVENT_NAME } from "@/config/site";

export default function PartnerRegister() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 pt-20 pb-24 md:px-10">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_0%,hsl(24_100%_54%/0.08),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl space-y-6">
        <span className="flex items-center gap-2 rounded-md bg-ember/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.3em] text-ember">
          MDC 2026 • INDUSTRY PARTNER PORTAL
        </span>
        <h1 className="display-hero">
          <span className="block">Partner Registration</span>
          <span className="wire-text block">Form</span>
        </h1>
        <PartnerForm />
      </div>
    </main>
  );
}