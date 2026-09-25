import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/content/copy";
import SectionLink from "./SectionLink";
import NavAnchor from "./nav/NavAnchor";

interface LinkBase {
  label: string;
  /** Sheet number shown before the label, e.g. "02". */
  n?: string;
  /** Marks the row as where you are (`aria-current`). */
  current?: boolean;
  /** A short note under the row (e.g. who registers, under Register). It
   *  also becomes the link's accessible description. */
  detail?: ReactNode;
}

export type MobileNavLink =
  | (LinkBase & { href: `#${string}` })
  | (LinkBase & {
      to: string;
      /** Ember label, for the call to action. */
      accent?: boolean;
      /** Trailing arrow: this row leaves for another page. */
      arrow?: boolean;
    });

interface MobileNavMenuProps {
  links: readonly MobileNavLink[];
  /** One line under the list. */
  note?: ReactNode;
  /** Breakpoint where the inline nav takes over and this menu hides. Default `"md"`. */
  hideFrom?: "md" | "lg";
  /** `"page"` (default): `#id` links are sections of the current page.
   *  `"home"`: they are sections of the home page, reachable from any route. */
  anchors?: "page" | "home";
}

const BREAKPOINT_PX = { md: 768, lg: 1024 } as const;

/**
 * The phone's way around the site: a disclosure button in the header that
 * drops a panel of large links from under it. Not a modal: the page stays
 * where it is and the sticky Register bar stays the one fixed CTA.
 *
 * Keyboard: opening focuses the first link; Escape (or the toggle) closes and
 * returns focus to the toggle; Tabbing out of the panel, clicking outside it,
 * following a link or any route change closes it. Every row is 44px or taller.
 */
export default function MobileNavMenu({ links, note, hideFrom = "md", anchors = "page" }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLAnchorElement>(null);
  const location = useLocation();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Any navigation closes the menu (links also close it on click, which
  // covers a click on the section you are already on).
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash, location.key]);

  // Opening moves focus into the panel.
  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    // A menu that survives a resize into the desktop layout leaves an open
    // panel floating under a nav that already shows every link.
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT_PX[hideFrom]}px)`);
    const onWide = () => {
      if (mq.matches) close(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onWide);
    };
  }, [open, close, hideFrom]);

  // "You are here" gets an ember tick at the row's left edge; the ember
  // label is kept for the call to action, so the two never read alike.
  const rowClass = (link: MobileNavLink) =>
    cn(
      "focus-ember relative flex min-h-[56px] items-center gap-4 py-2 font-body text-xl font-medium leading-none tracking-[-0.01em] transition-colors",
      "accent" in link && link.accent ? "text-ember hover:text-foreground" : "text-foreground hover:text-ember",
      link.current &&
        "before:absolute before:-left-5 before:top-1/2 before:h-7 before:w-[3px] before:-translate-y-1/2 before:bg-ember md:before:-left-8",
    );

  // Sheet numbers are visual only (the label is the link's name); rows
  // without one keep the column so every label lines up.
  const numbered = links.some((l) => l.n);
  const content = (link: MobileNavLink) => (
    <>
      {numbered && (
        <span aria-hidden="true" className="w-7 shrink-0 font-mono text-[11px] tracking-[0.14em] text-ember">
          {link.n}
        </span>
      )}
      <span className="flex-1">{link.label}</span>
      {"to" in link && link.arrow && <ArrowRight aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0" />}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={hideFrom === "lg" ? "lg:hidden" : "md:hidden"}
      onBlur={(e) => {
        // Tabbing past the last link leaves the panel: fold it away.
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) close(false);
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (open ? close(true) : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        className="focus-ember flex min-h-[44px] min-w-[44px] items-center gap-2.5 border border-bone/25 px-3.5 font-body text-sm text-foreground transition-colors hover:border-bone/60"
      >
        <span className="relative flex h-2.5 w-4 flex-col justify-between" aria-hidden="true">
          <span
            className={cn(
              "h-px w-full origin-center bg-current transition-transform duration-300 motion-reduce:transition-none",
              open && "translate-y-[4.5px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-px w-full origin-center bg-current transition-transform duration-300 motion-reduce:transition-none",
              open && "-translate-y-[4.5px] -rotate-45",
            )}
          />
        </span>
        {open ? NAV.close : NAV.menu}
      </button>

      {/* Anchored to the header, the positioned ancestor. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100svh-var(--nav-h))] overflow-y-auto border-b border-bone/15 bg-background/95 backdrop-blur-md animate-in fade-in-0 slide-in-from-top-2 duration-300 motion-reduce:animate-none"
      >
        <ul className="px-5 pb-3 pt-1 md:px-8">
          {links.map((link, i) => {
              const ref = i === 0 ? firstRef : undefined;
              const current = link.current ? ("to" in link ? "page" : "true") : undefined;
              const onClick = () => setOpen(false);
              const detailId = link.detail ? `${panelId}-detail-${i}` : undefined;
              const shared = { ref, onClick, "aria-current": current, "aria-describedby": detailId, className: rowClass(link) } as const;
              return (
                <li key={link.label} className="border-b border-line last:border-b-0">
                  {"to" in link ? (
                    <Link to={link.to} {...shared}>
                      {content(link)}
                    </Link>
                  ) : anchors === "home" ? (
                    <NavAnchor href={link.href} {...shared}>
                      {content(link)}
                    </NavAnchor>
                  ) : (
                    <SectionLink href={link.href} {...shared}>
                      {content(link)}
                    </SectionLink>
                  )}
                  {link.detail && (
                    // Lines up under the label, past the number column.
                    <div id={detailId} className={cn("-mt-1 pb-4", numbered && "pl-11")}>
                      {link.detail}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
        {note && (
          <p className="px-5 pb-5 font-body text-[13px] text-concrete md:px-8">{note}</p>
        )}
      </div>
    </div>
  );
}
