import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { EVENT_NAME, PARTNER_REGISTRATION_URL } from "@/config/site";
import LionMark from "@/components/LionMark";
import SectionLink from "@/components/SectionLink";

const PARTNER_NAV_LINKS = [
  { label: "Why Partner", href: "#why" },
  { label: "Involvement", href: "#involvement" },
  { label: "Schedule", href: "#schedule" },
  { label: "Contact", href: "#register" },
] as const;

export default function PartnerNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <SectionLink
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ember focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-background"
      >
        Skip to content
      </SectionLink>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500",
          scrolled ? "border-line bg-background/70 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-8">
          {/* wordmark leads back to the main site's gallery entrance */}
          <Link to="/" className="group flex items-center gap-3">
            <LionMark className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
            <span className="flex items-baseline gap-3">
              <span className="font-display text-lg uppercase tracking-[0.01em] text-foreground transition-colors group-hover:text-ember">
                MDC
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-concrete sm:inline">
                {EVENT_NAME}
              </span>
            </span>
          </Link>

          {/* links */}
          <div className="flex items-center gap-6 md:gap-9">
            <ul className="hidden items-center gap-7 md:flex">
              <li>
                <Link
                  to="/"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                >
                  ← Main site
                </Link>
              </li>
              {PARTNER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <SectionLink
                    href={link.href}
                    className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                  >
                    {link.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
            <a
              href={PARTNER_REGISTRATION_URL}
              className="btn-portal px-5 py-2.5 text-[11px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Partner with MDC
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
