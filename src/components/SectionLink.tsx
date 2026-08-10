import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: `#${string}`;
};

/**
 * Reliable same-page navigation, including repeat clicks on the current hash.
 * The native href remains in place for accessibility and no-JavaScript fallback.
 */
export default function SectionLink({ href, onClick, ...props }: SectionLinkProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;

    event.preventDefault();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    navigate(
      { pathname: location.pathname, search: location.search, hash: href },
      { replace: location.hash === href },
    );
  };

  return <a href={href} onClick={handleClick} {...props} />;
}
