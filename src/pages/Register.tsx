import { Link } from "react-router-dom";
import { EVENT_NAME, MODEL_NO, REGISTRATION_EMBED_URL, REGISTRATION_URL, TAGLINE } from "@/config/site";

/**
 * Registration page — embeds the live Tally form, with a direct link as the
 * fallback for anyone whose browser blocks the embed.
 */
export default function Register() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-16 text-foreground md:px-10 md:py-20">
      {/* faint portal light from above */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_0%,hsl(24_100%_54%/0.08),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
        >
          ← Back to the gallery
        </Link>

        <div className="mt-12 flex items-center gap-3">
          <span className="h-1.5 w-1.5 bg-ember shadow-[0_0_10px_hsl(24_100%_54%/0.8)]" aria-hidden="true" />
          <span className="mono-label !text-foreground/70">Registration · {MODEL_NO}</span>
        </div>

        <h1 className="display-scene mt-6">
          <span className="block">Claim</span>
          <span className="block">
            your <span className="wire-text">spot.</span>
          </span>
        </h1>

        <p className="mt-6 font-body text-base font-light leading-relaxed text-concrete">
          Tell us you're in for {EVENT_NAME}. Spots are limited; registered builders get
          every update first, from the exact address to the team rules.
        </p>

        <div className="concrete-panel mt-10 p-2 md:p-3">
          <iframe
            src={REGISTRATION_EMBED_URL}
            title="Mac Design Cup registration form"
            className="h-[760px] w-full border-0"
            loading="lazy"
          />
        </div>

        <p className="mt-5 font-body text-sm font-light text-concrete">
          Form not loading?{" "}
          <a
            href={REGISTRATION_URL}
            target="_blank"
            rel="noreferrer"
            className="text-ember underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Open it in a new tab ↗
          </a>
        </p>

        <div className="mt-14 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-concrete">
          {MODEL_NO} · {TAGLINE}
        </div>
      </div>
    </main>
  );
}
