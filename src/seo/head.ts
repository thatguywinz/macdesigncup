// Builds the per-route <head> tags the prerender writes into each static HTML
// file (at the template's <!--app-head--> mark, plus the JSON-LD just before
// </head>). Pure string building:
// runs in Node at build time and in tests, never in the browser.
import { graphFor, serializeJsonLd } from "@/seo/jsonld";
import { OG_IMAGE, OG_LOCALE, ROBOTS_INDEX, ROBOTS_NOINDEX, SITE_NAME, absoluteUrl, type RouteDef } from "@/seo/routes";

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function headFor(route: RouteDef): string {
  const meta = (attr: "name" | "property", key: string, value: string | number) =>
    `<meta ${attr}="${key}" content="${escapeAttr(String(value))}" />`;

  const tags: string[] = [
    `<title>${escapeText(route.title)}</title>`,
    meta("name", "description", route.description),
    meta("name", "robots", route.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX),
  ];

  const url = absoluteUrl(route.path);
  // A canonical says "index this URL"; a noindex page must not claim that.
  if (!route.noindex) tags.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);

  // Social tags on every real page, noindex or not: a partner who is sent a
  // link to /partner/register still gets a proper card. The 404 gets none.
  if (!route.notFound) {
    tags.push(
      meta("property", "og:type", "website"),
      meta("property", "og:site_name", SITE_NAME),
      meta("property", "og:locale", OG_LOCALE),
      meta("property", "og:url", url),
      meta("property", "og:title", route.title),
      meta("property", "og:description", route.description),
      meta("property", "og:image", OG_IMAGE.url),
      meta("property", "og:image:type", OG_IMAGE.type),
      meta("property", "og:image:width", OG_IMAGE.width),
      meta("property", "og:image:height", OG_IMAGE.height),
      meta("property", "og:image:alt", OG_IMAGE.alt),
      meta("name", "twitter:card", "summary_large_image"),
      meta("name", "twitter:title", route.title),
      meta("name", "twitter:description", route.description),
      meta("name", "twitter:image", OG_IMAGE.url),
      meta("name", "twitter:image:alt", OG_IMAGE.alt),
    );
  }

  return tags.join("\n    ");
}

/**
 * The route's JSON-LD block (empty for the 404). The prerender puts it
 * at the end of <head>, after the stylesheet, so the tags a crawler needs
 * come first and the critical CSS is not queued behind ~10 KB of data.
 */
export function jsonLdFor(route: RouteDef): string {
  const graph = graphFor(route);
  return graph ? `<script type="application/ld+json">${serializeJsonLd(graph)}</script>` : "";
}
