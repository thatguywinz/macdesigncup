import { Link } from "react-router-dom";
import { EVENT_NAME, MODEL_NO, TAGLINE } from "@/config/site";

/**
 * Placeholder registration destination so every CTA resolves to a real page.
 * Swap REGISTRATION_URL in config/site.ts for an external form when ready.
 */
export default function Register() {
  return (
    <main className="relative min-h-screen bg-background px-5 py-16 text-foreground md:px-10">
      <div className="paper-grid pointer-events-none fixed inset-0 opacity-60" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-xl">
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </Link>

        <div className="mt-10 flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-sketch shadow-[0_0_10px_hsl(212_100%_65%)]" />
          <span className="mono-label !text-foreground/70">Registration</span>
        </div>

        <h1 className="display-scene mt-5 text-foreground">Register your team</h1>
        <p className="mt-4 font-body text-base font-light leading-relaxed text-muted-foreground">
          Reserve your spot for {EVENT_NAME}. This is a placeholder form — connect it to your live
          registration system before launch.
        </p>

        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {[
            { id: "name", label: "Full name", type: "text", ph: "Ada Lovelace" },
            { id: "email", label: "Email", type: "email", ph: "you@school.edu" },
            { id: "school", label: "School", type: "text", ph: "William Lyon Mackenzie CI" },
          ].map((f) => (
            <div key={f.id} className="flex flex-col gap-2">
              <label htmlFor={f.id} className="mono-label !text-foreground/70">
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                placeholder={f.ph}
                className="rounded-sm border border-border bg-panel px-4 py-3 font-body text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-marker focus:ring-1 focus:ring-marker"
              />
            </div>
          ))}

          <button type="submit" className="btn-register w-full py-4 text-sm">
            Submit registration
          </button>
        </form>

        <div className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {MODEL_NO} · {TAGLINE}
        </div>
      </div>
    </main>
  );
}
