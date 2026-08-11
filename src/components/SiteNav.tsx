import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { EVENT_NAME, NAV_LINKS } from "@/config/site";
import LionMark from "./LionMark";
import RegisterButton from "./RegisterButton";
import SectionLink from "./SectionLink";

interface SiteNavProps {
  /** Send the visitor back out to the 3D gallery entrance. */
  onReplayHero: () => void;
}

export default function SiteNav({ onReplayHero }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The wordmark is the way back to the gate, even from inside the hall — a
  // plain link to "/" would do nothing at all once you are already there.
  const replayHero = (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave ctrl/cmd/middle-clicks alone so they still open a fresh tab.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    // Drop any "#section" first, or stepping back through the door immediately
    // jumps to wherever the visitor had been reading.
    if (location.hash) {
      navigate({ pathname: "/", search: location.search }, { replace: true });
    }
    onReplayHero();
  };

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
          {/* wordmark */}
          <Link
            to="/"
            onClick={replayHero}
            title="Back to the gallery entrance"
            className="group flex items-center gap-3"
          >
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
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <SectionLink
                    href={l.href}
                    className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                  >
                    {l.label}
                  </SectionLink>
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
