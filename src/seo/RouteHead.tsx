import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ROBOTS_INDEX, ROBOTS_NOINDEX, absoluteUrl, routeFor } from "@/seo/routes";

/**
 * Keeps the live <head> in step with the route on client-side navigation,
 * from the same table the prerender wrote into the static HTML (so on a fresh
 * load every write here is a no-op). It updates existing tags and creates
 * one only if it is missing (vite dev serves the bare template), so it never
 * duplicates a tag. JSON-LD is not swapped: crawlers load each URL fresh.
 *
 * Renders nothing, and only touches the document inside an effect.
 */
export default function RouteHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = routeFor(pathname);
    const head = document.head;

    const upsertMeta = (attr: "name" | "property", key: string, value: string) => {
      let el = head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        head.appendChild(el);
      }
      if (el.content !== value) el.content = value;
    };

    if (document.title !== route.title) document.title = route.title;
    upsertMeta("name", "description", route.description);
    upsertMeta("name", "robots", route.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX);

    const url = absoluteUrl(route.path);
    let canonical = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (route.noindex) {
      // A noindex page (and the not-found view) claims no canonical.
      canonical?.remove();
    } else {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        head.appendChild(canonical);
      }
      if (canonical.href !== url) canonical.href = url;
    }

    // The 404 carries no social tags; every real page does (see headFor).
    if (route.notFound) return;
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", route.title);
    upsertMeta("property", "og:description", route.description);
    upsertMeta("name", "twitter:title", route.title);
    upsertMeta("name", "twitter:description", route.description);
  }, [pathname]);

  return null;
}
