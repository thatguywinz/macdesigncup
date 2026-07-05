import { EVENT_NAME, MODEL_NO, TAGLINE, SOCIALS, FOOTER_LINKS, CLUB } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-8">
        {/* titleblock row */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-lg font-bold tracking-tight text-foreground">MDC</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                {EVENT_NAME}
              </span>
            </div>
            <p className="mt-3 max-w-xs font-mono text-[11px] leading-relaxed tracking-wide text-muted-foreground">
              {CLUB} — a 12-hour 3D designathon. From a single point, everything is built.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-6">
            <div>
              <div className="mono-label mb-3">Connect</div>
              <ul className="space-y-2">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mono-label mb-3">Legal</div>
              <ul className="space-y-2">
                {FOOTER_LINKS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-foreground"
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
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 md:flex-row md:items-center md:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            © 2026 {EVENT_NAME}. All rights reserved.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {MODEL_NO} · {TAGLINE}
          </span>
          <a
            href="#scene-01"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:text-foreground"
          >
            ↑ Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
