import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import SectionLink from "@/components/SectionLink";
import { useIsHome } from "./useIsHome";

export type NavAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** A section of the home page, e.g. `"#faq"`. */
  href: `#${string}`;
};

/**
 * A link to a section of the home page that works from any route. On `/` it
 * is a `SectionLink` (smooth scroll, focus moves to the section, hash kept in
 * the URL); anywhere else (`/register`, the 404) it is a router link to
 * `/#id`, and App's hash effect scrolls to the section once home renders.
 * The route is known on the server too, so the prerendered markup matches.
 */
const NavAnchor = forwardRef<HTMLAnchorElement, NavAnchorProps>(function NavAnchor({ href, ...props }, ref) {
  const isHome = useIsHome();
  if (isHome) return <SectionLink ref={ref} href={href} {...props} />;
  return <Link ref={ref} to={{ pathname: "/", hash: href }} {...props} />;
});

export default NavAnchor;
