// @vitest-environment node
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BREADCRUMBS, FAQS, SUMMARY } from "@/content/copy";
import { SPONSORS } from "@/config/sponsors";
import {
  CLUB_SCHOOL,
  CLUB_SCHOOL_URL,
  EVENT_DATE,
  SITE_URL,
  TIMES,
  VENUE_INSTITUTION,
  VENUE_INSTITUTION_URL,
  VENUE_NAME,
  VENUE_STREET,
} from "@/config/site";
import { headFor, jsonLdFor } from "@/seo/head";
import { CROSS_PAGE_REFS, EVENT_END, IDS, graphFor, serializeJsonLd } from "@/seo/jsonld";
import { llmsTxt, sitemapXml } from "@/seo/files";
import {
  HOME_ROUTE,
  INDEXABLE_ROUTES,
  NOT_FOUND_ROUTE,
  PAGE_ROUTES,
  PARTNER_REGISTER_ROUTE,
  PARTNER_ROUTE,
  REGISTER_ROUTE,
  ROUTES,
  absoluteUrl,
  routeFor,
} from "@/seo/routes";

type Json = Record<string, unknown>;
const readPublic = (name: string) =>
  fs.readFileSync(new URL(`../../public/${name}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/** Parse the graph exactly as a crawler would read it out of the HTML. */
const parsedGraph = (route = HOME_ROUTE) => {
  const graph = graphFor(route);
  if (!graph) throw new Error(`no graph for ${route.path}`);
  return JSON.parse(serializeJsonLd(graph)) as { "@context": string; "@graph": Json[] };
};
const nodeOfType = (graph: Json[], type: string) => graph.find((n) => n["@type"] === type) as Json | undefined;

/** Walk a graph: node definitions (an @id with other keys) vs bare {"@id"} references. */
function idsIn(value: unknown) {
  const defined = new Set<string>();
  const referenced = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const o = v as Json;
    const keys = Object.keys(o);
    if (typeof o["@id"] === "string") (keys.length === 1 ? referenced : defined).add(o["@id"] as string);
    keys.forEach((k) => walk(o[k]));
  };
  walk(value);
  return { defined, referenced };
}

describe("head table", () => {
  it("gives every route a unique title and description", () => {
    const titles = ROUTES.map((r) => r.title);
    const descriptions = ROUTES.map((r) => r.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("keeps indexable titles and descriptions inside the display budget", () => {
    for (const r of INDEXABLE_ROUTES) {
      expect(r.title.length, r.title).toBeGreaterThanOrEqual(40);
      expect(r.title.length, r.title).toBeLessThanOrEqual(65);
      expect(r.description.length, r.description).toBeGreaterThanOrEqual(140);
      expect(r.description.length, r.description).toBeLessThanOrEqual(165);
    }
  });

  it("never ships an em dash or the old institution name", () => {
    for (const r of ROUTES) {
      for (const s of [r.title, r.description]) {
        expect(s).not.toMatch(/—/);
        expect(s).not.toMatch(/George Brown College/);
      }
    }
    const everything = JSON.stringify(ROUTES.map((r) => graphFor(r)));
    expect(everything).not.toMatch(/—|George Brown College/);
  });

  it("maps live pathnames to rows, trailing slash or not; anything else is the 404", () => {
    expect(routeFor("/")).toBe(HOME_ROUTE);
    expect(routeFor("/partner/")).toBe(PARTNER_ROUTE);
    expect(routeFor("/partner/register")).toBe(PARTNER_REGISTER_ROUTE);
    expect(routeFor("/register")).toBe(REGISTER_ROUTE);
    expect(routeFor("/nope")).toBe(NOT_FOUND_ROUTE);
    expect(routeFor("/404")).toBe(NOT_FOUND_ROUTE);
  });

  it("writes one title, a description, an absolute canonical and full social tags per indexable route", () => {
    for (const r of INDEXABLE_ROUTES) {
      const head = headFor(r);
      expect(head.match(/<title>/g)).toHaveLength(1);
      expect(head).toContain(`<link rel="canonical" href="${absoluteUrl(r.path)}" />`);
      expect(head).toContain('<meta name="robots" content="index, follow, max-image-preview:large" />');
      expect(head).toContain(`<meta property="og:url" content="${absoluteUrl(r.path)}" />`);
      expect(head).toContain(`<meta property="og:image" content="${SITE_URL}/og-image.png" />`);
      expect(head).toContain('<meta property="og:locale" content="en_CA" />');
      expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
      expect(head).not.toMatch(/noindex/);
    }
  });

  it("marks the 404 noindex, with no canonical, social tags or JSON-LD", () => {
    const head = headFor(NOT_FOUND_ROUTE);
    expect(head).toContain('<meta name="robots" content="noindex, follow" />');
    expect(head).not.toMatch(/canonical|og:|twitter:/);
    expect(jsonLdFor(NOT_FOUND_ROUTE)).toBe("");
    expect(graphFor(NOT_FOUND_ROUTE)).toBeNull();
  });

  it("keeps the unlinked /partner/register out of the index but keeps its card and breadcrumb", () => {
    expect(PARTNER_REGISTER_ROUTE.noindex).toBe(true);
    expect(INDEXABLE_ROUTES).not.toContain(PARTNER_REGISTER_ROUTE);
    expect(PAGE_ROUTES).toContain(PARTNER_REGISTER_ROUTE);
    const head = headFor(PARTNER_REGISTER_ROUTE);
    expect(head).toContain('<meta name="robots" content="noindex, follow" />');
    expect(head).not.toMatch(/canonical/);
    expect(head).toContain(`<meta property="og:url" content="${absoluteUrl("/partner/register")}" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    const g = parsedGraph(PARTNER_REGISTER_ROUTE)["@graph"];
    const crumbs = (nodeOfType(g, "BreadcrumbList") as { itemListElement: { name: string }[] }).itemListElement;
    expect(crumbs.map((c) => c.name)).toEqual([BREADCRUMBS.home, BREADCRUMBS.partner, BREADCRUMBS.partnerRegister]);
    expect(jsonLdFor(PARTNER_REGISTER_ROUTE)).toContain('"@type":"BreadcrumbList"');
  });

  it("only the 404 is the not-found fallback", () => {
    expect(ROUTES.filter((r) => r.notFound)).toEqual([NOT_FOUND_ROUTE]);
    for (const r of PAGE_ROUTES) expect(routeFor(r.path)).toBe(r);
  });
});

describe("JSON-LD", () => {
  it("parses, and every referenced @id is defined in the same page graph (or is the Event, defined on Home)", () => {
    const homeDefined = idsIn(parsedGraph(HOME_ROUTE)).defined;
    for (const id of CROSS_PAGE_REFS) expect(homeDefined, id).toContain(id);
    for (const r of PAGE_ROUTES) {
      const graph = parsedGraph(r);
      expect(graph["@context"]).toBe("https://schema.org");
      const { defined, referenced } = idsIn(graph);
      for (const id of referenced) {
        if (!defined.has(id)) expect(CROSS_PAGE_REFS, `${r.path} -> ${id}`).toContain(id);
      }
      for (const id of defined) expect(id).toMatch(/^https:\/\/www\.macdesigncup\.ca\//);
    }
  });

  it("defines each institution once, under one name, whatever roles it plays", () => {
    const g = parsedGraph()["@graph"];
    const all = JSON.stringify(g);
    // One definition each (a node with more than an @id), and nothing else carries their URLs.
    expect(g.filter((n) => n["@id"] === IDS.georgeBrown)).toEqual([
      { "@type": "CollegeOrUniversity", "@id": IDS.georgeBrown, name: VENUE_INSTITUTION, url: VENUE_INSTITUTION_URL },
    ]);
    expect(g.filter((n) => n["@id"] === IDS.wlmac)).toEqual([
      { "@type": "HighSchool", "@id": IDS.wlmac, name: CLUB_SCHOOL, url: CLUB_SCHOOL_URL },
    ]);
    expect(all.split(`"url":"${VENUE_INSTITUTION_URL}"`)).toHaveLength(2);
    expect(all.split(`"url":"${CLUB_SCHOOL_URL}"`)).toHaveLength(2);
    // Every role points at that node.
    const event = nodeOfType(g, "Event") as Json;
    expect((event.location as Json).containedInPlace).toEqual({ "@id": IDS.georgeBrown });
    expect(event.sponsor).toContainEqual({ "@id": IDS.georgeBrown });
    expect(event.sponsor).toContainEqual({ "@id": IDS.wlmac });
    expect(nodeOfType(g, "Organization")?.parentOrganization).toEqual({ "@id": IDS.wlmac });
    // The club's school comes with the club on every page that has a graph.
    for (const r of PAGE_ROUTES) {
      expect(parsedGraph(r)["@graph"].filter((n) => n["@id"] === IDS.wlmac), r.path).toHaveLength(1);
    }
  });

  it("points /register and /partner at the Home Event instead of repeating it", () => {
    for (const r of [REGISTER_ROUTE, PARTNER_ROUTE]) {
      const g = parsedGraph(r)["@graph"];
      expect(nodeOfType(g, "WebPage")?.about, r.path).toEqual({ "@id": IDS.event });
      expect(nodeOfType(g, "Event"), r.path).toBeUndefined();
    }
    expect(IDS.event).toMatch(/^https:\/\//);
  });

  it("repeats Organization, WebSite and a WebPage on every indexable page", () => {
    for (const r of INDEXABLE_ROUTES) {
      const g = parsedGraph(r)["@graph"];
      expect(nodeOfType(g, "Organization")?.["@id"]).toBe(IDS.organization);
      expect(nodeOfType(g, "WebSite")?.["@id"]).toBe(IDS.website);
      const page = nodeOfType(g, "WebPage");
      expect(page?.url).toBe(absoluteUrl(r.path));
      expect(page?.inLanguage).toBe("en-CA");
      expect(page?.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("uses absolute https URLs everywhere", () => {
    for (const r of PAGE_ROUTES) {
      const json = serializeJsonLd(graphFor(r));
      for (const [, value] of json.matchAll(/"(?:url|item|contentUrl|hasMap)":"([^"]+)"/g)) {
        expect(value).toMatch(/^https:\/\//);
      }
    }
  });

  it("puts FAQ answers in the FAQPage character for character, in page order", () => {
    const faq = nodeOfType(parsedGraph()["@graph"], "FAQPage");
    const entities = faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities).toHaveLength(FAQS.length);
    entities.forEach((q, i) => {
      expect(q.name).toBe(FAQS[i].q);
      expect(q.acceptedAnswer.text).toBe(FAQS[i].a);
    });
    // Home only.
    for (const r of [REGISTER_ROUTE, PARTNER_ROUTE, PARTNER_REGISTER_ROUTE]) {
      expect(nodeOfType(parsedGraph(r)["@graph"], "FAQPage")).toBeUndefined();
    }
  });

  it("ends the event at the published finish, in the start's format and offset", () => {
    const iso = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):00([+-]\d{2}:\d{2})$/;
    const start = iso.exec(EVENT_DATE ?? "");
    const end = iso.exec(EVENT_END ?? "");
    expect(start, "startDate shape").not.toBeNull();
    expect(end, "endDate shape").not.toBeNull();
    if (!start || !end) return;
    expect(end[1]).toBe(start[1]); // same day: a one-day event
    expect(end[4]).toBe(start[4]); // same UTC offset (EST, -05:00)
    expect(`${end[2]}:${end[3]}` > `${start[2]}:${start[3]}`).toBe(true);
    // The clock time is TIMES.end, the finish the page publishes ("4:00 PM").
    const h = Number(end[2]);
    expect(`${h % 12 || 12}:${end[3]} ${h >= 12 ? "PM" : "AM"}`).toBe(TIMES.end);
    expect(EVENT_END).toBe("2026-11-16T16:00:00-05:00");
  });

  it("describes the event with the site facts, the published finish, and nothing unannounced", () => {
    const g = parsedGraph()["@graph"];
    const event = nodeOfType(g, "Event") as Json;
    expect(event["@id"]).toBe(IDS.event);
    expect(event.startDate).toBe(EVENT_DATE);
    expect(event.endDate).toBe(EVENT_END);
    expect(event).not.toHaveProperty("offers");
    expect(event.isAccessibleForFree).toBe(true);
    const location = event.location as Json;
    expect(location.name).toBe(VENUE_NAME);
    expect((location.address as Json).streetAddress).toBe(VENUE_STREET);
    expect((event.sponsor as unknown[]).length).toBe(SPONSORS.length);
    const roles = (event.audience as Json[]).map((a) => a.educationalRole);
    expect(roles).toEqual(["student", "teacher"]);
    expect(nodeOfType(g, "WebPage")?.about).toEqual({ "@id": IDS.event });
  });

  it("gives /register and both /partner pages a breadcrumb, and Home none", () => {
    expect(nodeOfType(parsedGraph()["@graph"], "BreadcrumbList")).toBeUndefined();
    for (const r of [REGISTER_ROUTE, PARTNER_ROUTE, PARTNER_REGISTER_ROUTE]) {
      const g = parsedGraph(r)["@graph"];
      const list = nodeOfType(g, "BreadcrumbList") as { itemListElement: { position: number; item: string }[] };
      const items = list.itemListElement;
      expect(items[0].item).toBe(`${SITE_URL}/`);
      expect(items[items.length - 1].item).toBe(absoluteUrl(r.path));
      items.forEach((it, i) => expect(it.position).toBe(i + 1));
      expect(nodeOfType(g, "WebPage")?.breadcrumb).toEqual({ "@id": `${absoluteUrl(r.path)}#breadcrumb` });
    }
  });

  it("cannot be closed early by a string in the graph", () => {
    expect(serializeJsonLd({ a: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});

describe("public files", () => {
  it("robots.txt is one permissive group plus the sitemap", () => {
    const robots = readPublic("robots.txt");
    expect(robots.match(/^User-agent:/gm)).toHaveLength(1);
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/$/m);
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).not.toMatch(/Disallow/);
  });

  it("sitemap.xml and llms.txt match what the build generates", () => {
    expect(readPublic("sitemap.xml")).toBe(sitemapXml());
    expect(readPublic("llms.txt")).toBe(llmsTxt());
  });

  it("sitemap lists every indexable route and nothing else, with no priority or changefreq", () => {
    const xml = sitemapXml();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(INDEXABLE_ROUTES.map((r) => absoluteUrl(r.path)));
    expect(xml).not.toMatch(/priority|changefreq|404/);
  });

  it("sitemap and llms.txt list exactly Home, Registration and Partner", () => {
    const expected = [HOME_ROUTE, REGISTER_ROUTE, PARTNER_ROUTE].map((r) => absoluteUrl(r.path));
    const locs = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(expected);
    const links = [...llmsTxt().matchAll(/\]\((https:[^)]+)\)/g)].map((m) => m[1]);
    expect(links).toEqual(expected);
    for (const file of [sitemapXml(), llmsTxt(), readPublic("sitemap.xml"), readPublic("llms.txt")]) {
      expect(file).not.toContain("/partner/register");
    }
  });

  it("llms.txt quotes every FAQ answer verbatim", () => {
    const txt = llmsTxt();
    for (const f of FAQS) expect(txt).toContain(f.a);
  });

  it("ships exactly one IndexNow key file, named for the key it holds (LAUNCH.md)", () => {
    const keys = fs
      .readdirSync(new URL("../../public/", import.meta.url))
      .filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));
    expect(keys).toHaveLength(1);
    // Exactly the key: no newline, no BOM (api.indexnow.org compares it byte for byte).
    expect(readPublic(keys[0])).toBe(keys[0].replace(/\.txt$/, ""));
  });

  it("site.webmanifest carries the brand name, colours and the copy-deck summary", () => {
    const manifest = JSON.parse(readPublic("site.webmanifest"));
    expect(manifest.short_name).toBe("MDC 2026");
    expect(manifest.theme_color).toBe("#090a0c");
    expect(manifest.background_color).toBe("#090a0c");
    expect(manifest.description).toBe(SUMMARY.deck);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
