import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import SectionLink from "./SectionLink";

export type MobileNavLink =
  | { label: string; href: `#${string}` }
  | { label: string; to: string };

interface MobileNavMenuProps {
  links: readonly MobileNavLink[];
  /** One line under the list — usually where to find the CTA. */
  note?: ReactNode;
}

/**
 * The phone's way around a page. Both navs keep an inline link row from `md`
 * up; below that the row has nowhere to go, so the sections live behind this
 * button instead of being unreachable.
 *
 * The panel drops from under the header rather than covering the screen: the
 * visitor keeps sight of where they already are, and the sticky bar at the
 * bottom of the viewport stays the one CTA in the layout.
 */
export default function MobileNavMenu({ links, note }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);

  // A menu that survives a resize into the desktop layout leaves an open panel
  // floating under a nav that already shows every link.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    mq.addEventListener("change", close);
    window.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "block py-4 font-display text-xl uppercase tracking-[0.02em] text-foreground transition-colors hover:text-ember";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="flex items-center gap-2.5 border border-line bg-background/60 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-ember hover:text-ember focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span className="flex w-3.5 flex-col gap-[3px]" aria-hidden="true">
          <span
            className="h-px w-full bg-current transition-transform duration-300"
            style={open ? { transform: "translateY(4px) rotate(45deg)" } : undefined}
          />
          <span
            className="h-px w-full bg-current transition-opacity duration-300"
            style={open ? { opacity: 0 } : undefined}
          />
          <span
            className="h-px w-full bg-current transition-transform duration-300"
            style={open ? { transform: "translateY(-4px) rotate(-45deg)" } : undefined}
          />
        </span>
        {open ? "Close" : "Menu"}
      </button>

      {/* Anchored to the header, which is the positioned ancestor. */}
      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-background/95 backdrop-blur-md"
      >
        <ul className="px-5 py-2">
          {links.map((link) => (
            <li key={link.label} className="border-b border-line last:border-b-0">
              {"to" in link ? (
                <Link to={link.to} onClick={() => setOpen(false)} className={itemClass}>
                  {link.label}
                </Link>
              ) : (
                <SectionLink href={link.href} onClick={() => setOpen(false)} className={itemClass}>
                  {link.label}
                </SectionLink>
              )}
            </li>
          ))}
        </ul>
        {note && (
          <p className="px-5 pb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-concrete">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
