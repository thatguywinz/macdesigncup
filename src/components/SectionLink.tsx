import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { focusTarget } from "@/lib/focusTarget";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: `#${string}`;
};

/**
 * Reliable same-page navigation, including repeat clicks on the current hash.
 * The native href remains in place for accessibility and no-JavaScript fallback.
 * Only for anchors on the current page; for a section of the home page seen
 * from another route, use `NavAnchor` (src/components/nav/NavAnchor.tsx).
 */
const SectionLink = forwardRef<HTMLAnchorElement, SectionLinkProps>(function SectionLink(
  { href, onClick, ...props },
  ref,
) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Leave ctrl/cmd/shift/middle clicks to the browser (new tab, new window).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;

    event.preventDefault();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    focusTarget(target);

    navigate(
      { pathname: location.pathname, search: location.search, hash: href },
      { replace: location.hash === href },
    );
  };

  return <a ref={ref} href={href} onClick={handleClick} {...props} />;
});

export default SectionLink;
