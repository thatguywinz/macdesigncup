import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { m, useMotionValue, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { EVENT_FULL, REGISTER_PATH } from "@/config/site";
import { CTA, NAV } from "@/content/copy";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import LionMark from "./LionMark";
import RegisterButton from "./RegisterButton";
import SectionLink from "./SectionLink";
import MobileNavMenu, { type MobileNavLink } from "./MobileNavMenu";
import NavAnchor from "./nav/NavAnchor";
import { SECTION_IDS, SECTION_LINKS } from "./nav/sectionLinks";
import { useScrollSpy } from "./nav/useScrollSpy";
import { WhoRegistersNote, WhoRegistersSr } from "./nav/WhoRegisters";

const PARTNER_PATH = "/partner";
/** Base width of the underline; it is scaled to each link (transform only). */
const BAR_W = 100;

// useLayoutEffect warns on the server; this one only measures the DOM.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The fixed site nav, on every route and visible from the first frame.
 *
 * - Over the hero it is transparent on a soft top scrim; past ~40px of scroll
 *   it turns solid (background at 85%, blur, hairline border).
 * - Left: the lion + MDC wordmark (+ the full name from `xl`; between lg
 *   and xl the six links need that width). On `/` it scrolls back to the
 *   top; elsewhere it links home.
 * - Centre (`lg`+): four short section links (Prizes, Sponsors, The day,
 *   FAQ), with a scrollspy. The section you are in lights ember with a sliding
 *   2px underline and `aria-current`.
 * - Right: Partner and Register (`md`+). Register is described (for screen
 *   readers) as one form for students and teachers; the menu shows the tiny
 *   "Students and teachers" note under its Register row. Below `lg` the section links (plus Partner and
 *   Register) live in the menu; phones get Register from the sticky bar too.
 * - Bottom edge: a hairline once the bar turns solid.
 *
 * Route-aware: on `/` links scroll in place; on `/register` or the 404 they
 * are router links to `/#id`. Nothing here reads the window during render.
 */
export default function SiteNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const onRegister = location.pathname === REGISTER_PATH;
  const reduced = useReducedMotionSafe();

  // Solid once the page has moved. Threshold crossings only: no per-frame state.
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  useEffect(() => setScrolled(window.scrollY > 40), []);

  const active = useScrollSpy(SECTION_IDS, isHome);

  // ── Sliding underline under the active link (lg+). ──
  const listRef = useRef<HTMLUListElement>(null);
  const spring = { stiffness: 420, damping: 40, mass: 0.6 };
  const barX = useSpring(0, spring);
  const barScale = useSpring(0, spring);
  const barOpacity = useMotionValue(0);
  const shown = useRef(false);

  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const place = (animate: boolean) => {
      const ink = active ? list.querySelector<HTMLElement>(`[data-nav-ink="${active}"]`) : null;
      if (!ink || ink.offsetParent === null) {
        barOpacity.set(0);
        shown.current = false;
        return;
      }
      const x = ink.getBoundingClientRect().left - list.getBoundingClientRect().left;
      const s = ink.offsetWidth / BAR_W;
      // First appearance, a resize or reduced motion: place it; else glide.
      if (!animate || !shown.current || reduced) {
        barX.jump(x);
        barScale.jump(s);
      } else {
        barX.set(x);
        barScale.set(s);
      }
      barOpacity.set(1);
      shown.current = true;
    };
    place(true);
    const ro = new ResizeObserver(() => place(false));
    ro.observe(list);
    document.fonts?.ready.then(() => place(false));
    return () => ro.disconnect();
  }, [active, reduced, barX, barScale, barOpacity]);

  // On `/` the wordmark means "back to the top"; a plain link to "/" would do
  // nothing at all there. Elsewhere it is a normal link home.
  const toTop = (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave ctrl/cmd/middle-clicks alone so they still open a fresh tab.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!isHome) return;
    event.preventDefault();
    if (location.hash) {
      // Dropping the "#section" makes App scroll to the top itself.
      navigate({ pathname: "/", search: location.search }, { replace: true });
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  // Screen readers hear "one form for students and teachers" as the desktop
  // Register button's description.
  const noteId = useId();

  const menuLinks: MobileNavLink[] = [
    ...SECTION_LINKS.map((l) => ({ label: l.label, href: l.href, current: active === l.href.slice(1) })),
    { label: CTA.partner, to: PARTNER_PATH, arrow: true },
    {
      label: CTA.register,
      to: REGISTER_PATH,
      accent: true,
      arrow: true,
      current: onRegister,
      detail: <WhoRegistersNote />,
    },
  ];

  return (
    <>
      <SectionLink
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ember focus:px-4 focus:py-3 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-background"
      >
        {NAV.skip}
      </SectionLink>
      <header className="fixed inset-x-0 top-0 z-50 h-[var(--nav-h)]" data-scrolled={scrolled || undefined}>
        {/* Over the hero: a soft scrim so the bar reads on any frame of the hall. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[160%] bg-gradient-to-b from-background/85 via-background/40 to-transparent transition-opacity duration-500 motion-reduce:transition-none",
            scrolled && "opacity-0",
          )}
        />
        {/* Past the hero's first 40px: the solid bar. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border-b border-bone/10 bg-background/90 backdrop-blur-md transition-opacity duration-500 motion-reduce:transition-none",
            !scrolled && "opacity-0",
          )}
        />

        <nav
          aria-label={NAV.label}
          className="relative mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8"
        >
          {/* wordmark */}
          <Link
            to="/"
            onClick={toTop}
            className="focus-ember group flex min-h-[44px] shrink-0 items-center gap-3"
          >
            <LionMark className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
            <span className="flex flex-col justify-center">
              <span className="font-display text-xl uppercase leading-none tracking-[0.02em] text-foreground transition-colors group-hover:text-ember">
                {NAV.mark}
              </span>
              {/* From xl, beside the mark. */}
              <span className="sr-only xl:not-sr-only xl:mt-1 xl:font-body xl:text-[13px] xl:leading-none xl:text-foreground/65">
                {EVENT_FULL}
              </span>
            </span>
          </Link>

          {/* section links, lg+ */}
          <ul ref={listRef} className="relative hidden items-center lg:flex">
            {SECTION_LINKS.map((l) => {
              const id = l.href.slice(1);
              const isActive = active === id;
              return (
                <li key={l.href}>
                  <NavAnchor
                    href={l.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "focus-ember flex min-h-[44px] items-center whitespace-nowrap px-3 font-body text-[15px] transition-colors duration-300 xl:px-4",
                      isActive ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                    )}
                  >
                    <span data-nav-ink={id}>{l.label}</span>
                  </NavAnchor>
                </li>
              );
            })}
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[8px] left-0 h-px origin-left bg-ember"
              style={{ width: BAR_W, x: barX, scaleX: barScale, opacity: barOpacity }}
            />
          </ul>

          {/* partner + register, md+; the menu below lg */}
          <div className="flex shrink-0 items-center gap-3 md:gap-5">
            <Link
              to={PARTNER_PATH}
              className="focus-ember hidden min-h-[44px] items-center font-body text-[15px] text-foreground/65 transition-colors hover:text-foreground md:inline-flex"
            >
              {NAV.partner}
            </Link>
            {/* Phones get Register from the sticky bar (and the menu). */}
            {!onRegister && (
              <>
                <RegisterButton
                  aria-describedby={noteId}
                  className="hidden min-h-[40px] px-4 py-2 md:inline-flex xl:px-5"
                />
                <WhoRegistersSr id={noteId} />
              </>
            )}
            <MobileNavMenu links={menuLinks} hideFrom="lg" anchors="home" />
          </div>
        </nav>

      </header>
    </>
  );
}
