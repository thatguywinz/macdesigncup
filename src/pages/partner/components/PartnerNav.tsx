import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EVENT_NAME, EVENT_FULL } from "@/config/site";
import RegisterButton from "@/components/RegisterButton";

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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ember focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-background"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500",
          scrolled ? "border-line bg-background/70 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-8">
          {/* wordmark - links to main site */}
          <a href="https://macdesigncup.vercel.app/" className="group flex items-baseline gap-3">
            <span className="font-display text-lg uppercase tracking-[0.01em] text-foreground transition-colors group-hover:text-ember">
              MDC
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-concrete sm:inline">
              {EVENT_NAME}
            </span>
          </a>

          {/* links */}
          <div className="flex items-center gap-6 md:gap-9">
            <ul className="hidden items-center gap-7 md:flex">
              <li>
                <a
                  href="#why"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                >
                  Why Partner
                </a>
              </li>
              <li>
                <a
                  href="#involvement"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                >
                  Involvement
                </a>
              </li>
              <li>
                <a
                  href="#schedule"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                >
                  Schedule
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-concrete transition-colors hover:text-ember"
                >
                  Contact
                </a>
              </li>
            </ul>
            <RegisterButton className="px-5 py-2.5 text-[11px]">Register as Partner</RegisterButton>
          </div>
        </nav>
      </header>
    </>
  );
}