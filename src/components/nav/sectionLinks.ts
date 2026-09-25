import { NAV_LINKS } from "@/config/site";

export interface SectionLinkDef {
  label: string;
  href: `#${string}`;
}

/** The home page sections the nav, the menu and the footer link to. */
export const SECTION_LINKS: readonly SectionLinkDef[] = NAV_LINKS;

/** The ids the scrollspy watches, in page order. */
export const SECTION_IDS: readonly string[] = SECTION_LINKS.map((l) => l.href.slice(1));
