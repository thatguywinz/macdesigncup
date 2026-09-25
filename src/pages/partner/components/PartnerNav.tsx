import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_FULL, PARTNER_REGISTRATION_URL } from "@/config/site";
import { NAV } from "@/content/copy";
import LionMark from "@/components/LionMark";
import SectionLink from "@/components/SectionLink";
import MobileNavMenu, { type MobileNavLink } from "@/components/MobileNavMenu";

const PARTNER_PATH = "/partner";

// Sections of /partner (ids in the partner sections). Not the home page's
// anchors: those live on "/" and the main site nav owns them.
const PARTNER_NAV_LINKS = [
  { label: "Why Partner", href: "#why" },
  { label: "Involvement", href: "#involvement" },
  { label: "Schedule", href: "#schedule" },
  { label: "Contact", href: "#register" },
] as const;

const MAIN_SITE = "Main site";

/**
 * The partner pages' nav. Same lockup and bar as the main site nav, with the
 * partner sections instead of the home sections. Route-aware: on /partner the
 * links scroll in place; on /partner/register they are router links to
 * /partner#id (App's hash effect scrolls once the page renders). Nothing
 * reads the window during render, so the prerendered markup matches.
 */
export default function PartnerNav() {
  const [scrolled, setScrolled] = useState(false);
  const onPartner = useLocation().pathname === PARTNER_PATH;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "focus-ember flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-ember";

  const menuLinks: MobileNavLink[] = [
    { label: MAIN_SITE, to: "/" },
    ...PARTNER_NAV_LINKS.map((l) =>
      onPartner ? { label: l.label, href: l.href } : { label: l.label, to: `${PARTNER_PATH}${l.href}` },
    ),
  ];

  return (
    <>
      <SectionLink
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ember focus:px-4 focus:py-3 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-background"
      >
        {NAV.skip}
      </SectionLink>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] border-b transition-colors duration-500 motion-reduce:transition-none",
          scrolled ? "border-line bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Partner"
          className="relative mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8"
        >
          {/* wordmark leads back to the main site */}
          <Link to="/" className="focus-ember group flex min-h-[44px] shrink-0 items-center gap-3">
            <LionMark className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
            <span className="flex flex-col justify-center">
              <span className="font-display text-xl uppercase leading-none tracking-[0.02em] text-foreground transition-colors group-hover:text-ember">
                {NAV.mark}
              </span>
              <span className="sr-only lg:not-sr-only lg:mt-1.5 lg:font-mono lg:text-[9px] lg:uppercase lg:leading-none lg:tracking-[0.22em] lg:text-foreground/60">
                {EVENT_FULL}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-4 md:gap-7 xl:gap-9">
            <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
              <li>
                <Link to="/" className={cn(linkClass, "gap-2")}>
                  <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.5} />
                  {MAIN_SITE}
                </Link>
              </li>
              {PARTNER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  {onPartner ? (
                    <SectionLink href={link.href} className={linkClass}>
                      {link.label}
                    </SectionLink>
                  ) : (
                    <Link to={`${PARTNER_PATH}${link.href}`} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {/* Same rule as the main site: phones get exactly one sticky CTA,
                and it's the bar at the bottom of the viewport. */}
            <a
              href={PARTNER_REGISTRATION_URL}
              className="btn-portal focus-ember hidden min-h-[40px] px-5 py-2.5 text-[11px] md:inline-flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              Partner with MDC
              <span className="sr-only"> {NAV.newTab}</span>
            </a>
            <MobileNavMenu links={menuLinks} hideFrom="lg" />
          </div>
        </nav>
      </header>
    </>
  );
}
