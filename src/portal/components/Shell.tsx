import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import LionMark from "@/components/LionMark";

/** The portal's frame: the lion, the event's name, where you are, then the page. */
export default function Shell({ section, right, children, wide }: { section: string; right?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="portal-shell">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ember focus:px-3 focus:py-2 focus:text-background">
        Skip to content
      </a>
      <header className="portal-head">
        <div className={`mx-auto flex h-16 items-center gap-4 px-4 md:px-8 ${wide ? "max-w-[1600px]" : "max-w-[1240px]"}`}>
          <a href="/" className="focus-ember flex shrink-0 items-center gap-3" aria-label="Mackenzie Design Cup home">
            <LionMark className="h-9 w-9" animated={false} />
            <span className="hidden font-display text-[1.35rem] uppercase leading-none tracking-[0.01em] text-bone sm:inline">MDC</span>
          </a>
          <span aria-hidden="true" className="h-6 w-px bg-bone/15" />
          <span className="truncate font-body text-[15px] font-medium text-foreground/90">{section}</span>
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </div>
      </header>
      <main id="main" className={`mx-auto px-4 pb-24 md:px-8 ${wide ? "max-w-[1600px]" : "max-w-[1240px]"}`}>
        {children}
      </main>
    </div>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="p-link focus-ember">
      {children}
    </Link>
  );
}
