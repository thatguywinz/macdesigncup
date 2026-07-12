import { EVENT_NAME, MODEL_NO, TAGLINE, SOCIALS, FOOTER_LINKS, CLUB } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 bg-background">
      {/* molten seam where the hall ends */}
      <div className="ember-rule opacity-70" aria-hidden="true" />

      <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-14">
        {/* titleblock row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-lg uppercase tracking-[0.01em] text-foreground">MDC</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-concrete">
                {EVENT_NAME}
              </span>
            </div>
            <p className="mt-4 max-w-xs font-mono text-[11px] leading-relaxed tracking-wide text-concrete">
              A one-day 3D design hackathon for TDSB high schoolers across the GTA, by the {CLUB}. Hosted at George Brown College.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8">
            <div>
              <div className="mono-label mb-4 !text-ember/80">Connect</div>
              <ul className="space-y-2.5">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-ember"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono-label mb-4 !text-ember/80">Legal</div>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-ember"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* baseline */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-concrete">
            © 2026 {EVENT_NAME}. All rights reserved.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-concrete">
            {MODEL_NO} · {TAGLINE}
          </span>
          <a
            href="#top"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:text-ember"
          >
            ↑ Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
