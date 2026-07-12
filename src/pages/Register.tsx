import { Link } from "react-router-dom";
import { EVENT_NAME, MODEL_NO, TAGLINE } from "@/config/site";

/**
 * Placeholder registration destination so every CTA resolves to a real page.
 * Swap REGISTRATION_URL in config/site.ts for an external form when ready.
 */
export default function Register() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-16 text-foreground md:px-10 md:py-20">
      {/* faint portal light from above */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_0%,hsl(24_100%_54%/0.08),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-xl">
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
        >
          ← Back to the gallery
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.8)]" aria-hidden="true" />
          <span className="mono-label !text-foreground/70">Registration — {MODEL_NO}</span>
        </div>

        <h1 className="display-scene mt-6">
          <span className="block">Claim</span>
          <span className="block">
            your <span className="wire-text">spot.</span>
          </span>
        </h1>

        <p className="mt-6 font-body text-base font-light leading-relaxed text-concrete">
          Reserve your spot for {EVENT_NAME}. This is a placeholder form — connect it to your live
          registration system before launch.
        </p>

        <form
          className="mt-12 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {[
            { id: "name", label: "Full name", type: "text", ph: "Ada Lovelace" },
            { id: "email", label: "Email", type: "email", ph: "you@school.edu" },
            { id: "school", label: "School", type: "text", ph: "William Lyon Mackenzie CI" },
          ].map((f) => (
            <div key={f.id} className="flex flex-col gap-2.5">
              <label htmlFor={f.id} className="mono-label !text-foreground/70">
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                placeholder={f.ph}
                className="concrete-panel px-4 py-3.5 font-body text-sm text-foreground outline-none transition-colors placeholder:text-concrete/50 focus:border-ember focus:ring-1 focus:ring-ember"
              />
            </div>
          ))}

          <button type="submit" className="btn-portal w-full py-4 text-sm">
            Submit registration
          </button>
        </form>

        <div className="mt-14 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-concrete">
          {MODEL_NO} · {TAGLINE}
        </div>
      </div>
    </main>
  );
}
