// sitemap.xml and llms.txt, generated from the same route table and copy deck
// as the pages, so neither can drift from the site. The prerender writes both
// into dist/ on every build; `node scripts/prerender.mjs --write-public` also
// refreshes the committed copies in public/, and src/test/seo.test.ts fails
// if those copies go stale.
//
// Both list the indexable routes only: a noindex page (the 404, and the
// unlinked /partner/register form) never appears in either file.
import { CONTACT_EMAIL, EVENT_FULL_YEAR } from "@/config/site";
import { FAQS } from "@/content/copy";
import { CRUMB_LABELS, INDEXABLE_ROUTES, absoluteUrl, type RouteDef } from "@/seo/routes";

/** The routes both files list, in table order. */
const listedRoutes = (): RouteDef[] => INDEXABLE_ROUTES.filter((r) => r.sitemap);

export function sitemapXml(): string {
  const urls = listedRoutes()
    .map((r) => `  <url>\n    <loc>${absoluteUrl(r.path)}</loc>\n    <lastmod>${r.dateModified}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** A page's link text: the last crumb of its visible trail ("Home" for Home). */
const pageName = (r: RouteDef): string => (r.breadcrumb ? r.breadcrumb[r.breadcrumb.length - 1].name : CRUMB_LABELS.home);

/**
 * llms.txt (llmstxt.org): H1, a one-paragraph blockquote summary, then the
 * pages. Honestly low value (Google ignores it; few AI crawlers fetch it),
 * but it costs one file. Every sentence is a copy-deck string.
 */
export function llmsTxt(): string {
  // Shape per llmstxt.org: H1, blockquote, free text with no headings (the
  // FAQ, verbatim, as a list), then H2 sections that are link lists.
  return [
    `# ${EVENT_FULL_YEAR}`,
    "",
    `> ${FAQS[0].a}`,
    "",
    ...FAQS.slice(1).map((f) => `- **${f.q}** ${f.a}`),
    "",
    "## Pages",
    "",
    ...listedRoutes().map((r) => `- [${pageName(r)}](${absoluteUrl(r.path)}): ${r.description}`),
    "",
    "## Contact",
    "",
    `- [Email the organizers](mailto:${CONTACT_EMAIL}): ${CONTACT_EMAIL}`,
    "",
  ].join("\n");
}
