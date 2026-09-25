import { NAV_LINKS } from "@/config/site";

export interface SectionLinkDef {
  /** Sheet number, matching the section eyebrow ("01" for "01 · At a glance"). */
  n: string;
  label: string;
  href: `#${string}`;
}

/** Every numbered section of the home page, 01 to 06, for the nav, the menu and the footer. */
export const SECTION_LINKS: readonly SectionLinkDef[] = NAV_LINKS;

/** The ids the scrollspy watches, in page order. */
export const SECTION_IDS: readonly string[] = SECTION_LINKS.map((l) => l.href.slice(1));
