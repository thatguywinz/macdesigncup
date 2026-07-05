import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EVENT_NAME, NAV_LINKS } from "@/config/site";
import RegisterButton from "./RegisterButton";

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#scene-01"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-sketch focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-black"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          scrolled ? "bg-background/70 backdrop-blur-md" : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-8">
          {/* wordmark */}
          <a href="#scene-01" className="group flex items-baseline gap-3">
            <span className="font-display text-lg font-bold tracking-tight text-foreground">MDC</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:inline">
              {EVENT_NAME}
            </span>
          </a>

          {/* links */}
          <div className="flex items-center gap-6 md:gap-9">
            <ul className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <RegisterButton className="px-5 py-2.5 text-[11px]">Register</RegisterButton>
          </div>
        </nav>
      </header>
    </>
  );
}
