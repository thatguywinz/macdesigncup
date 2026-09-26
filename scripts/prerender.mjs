// Build-time prerender: writes every route of the SPA as static HTML.
//
//   npm run build  =  vite build                                   (client -> dist/)
//                  && vite build --ssr src/entry-server.tsx --outDir dist-ssr
//                  && node scripts/prerender.mjs                   (this file)
//
// For each route in src/seo/routes.ts it renders the React tree to a string,
// injects the route's <head> (title, description, robots, canonical, Open
// Graph, Twitter, JSON-LD), the Anton and Archivo preloads and, on the partner
// pages, their split chunks' modulepreloads into the client build's
// index.html (whose stylesheet link it swaps for the sheet inlined), and writes dist/<route>/index.html (dist/404.html for the
// not-found page). It also writes dist/sitemap.xml and dist/llms.txt.
//
// It exits non-zero on anything a crawler would be hurt by, so a broken
// prerender never deploys: a Suspense boundary that suspended on the server,
// a missing /assets file, an <h1> count other than one, head tags outside
// <head>, invalid JSON-LD or a dangling @id, a missing FAQ answer or address.
//
// Flags:  --write-public   also refresh public/sitemap.xml and public/llms.txt
//         --strict         treat content warnings (banned strings) as failures
//         --dist <dir>     prerender into that client build instead of dist/
//         --ssr <dir>      read the server bundle from there instead of dist-ssr/
//                          (a private build pair leaves the shared dist/ and
//                          dist-ssr/ alone while others work in the repo)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Before React loads: the production server build (no dev-only attributes).
process.env.NODE_ENV = "production";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// `--dist <dir>` prerenders into another client build (e.g. a debug build
// made with NODE_ENV=development to read full hydration messages).
const distFlag = process.argv.indexOf("--dist");
const dist = distFlag > 0 ? path.resolve(root, process.argv[distFlag + 1]) : path.join(root, "dist");
const ssrFlag = process.argv.indexOf("--ssr");
const ssrDir = ssrFlag > 0 ? path.resolve(root, process.argv[ssrFlag + 1]) : path.join(root, "dist-ssr");
const args = new Set(process.argv.slice(2));

const HEAD_MARK = "<!--app-head-->";
const ROOT_MARK = '<div id="root"><!--app-html--></div>';

const failures = [];
const warnings = [];
const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);

// ── Template ──────────────────────────────────
// dist/index.html is the client build's template until this script overwrites
// it with the prerendered home page, so keep a pristine copy in the npm cache
// folder (the SSR build empties dist-ssr): re-running the prerender or the SSR
// build alone, without a new client build, still works.
const cacheDir = path.join(root, "node_modules", ".cache", "prerender");
const savedTemplate = path.join(cacheDir, `index.template.${path.basename(dist)}.html`);
let template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (template.includes(HEAD_MARK) && template.includes(ROOT_MARK)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(savedTemplate, template);
} else if (fs.existsSync(savedTemplate)) {
  template = fs.readFileSync(savedTemplate, "utf8");
} else {
  console.error(`prerender: dist/index.html has no ${HEAD_MARK} / ${ROOT_MARK} marks. Run the client build first.`);
  process.exit(1);
}
for (const mark of [HEAD_MARK, ROOT_MARK]) {
  if (!template.includes(mark)) {
    console.error(`prerender: template is missing ${mark}`);
    process.exit(1);
  }
}
if (!/<html lang="en-CA">/.test(template)) fail('template: <html lang="en-CA"> missing');

// ── Client build manifest ─────────────────────
// Hashed file names for the font preloads and the split pages' chunks. The
// manifest is deleted at the end (it must not deploy), so keep a copy next to
// the saved template: a re-run of the prerender alone still has it.
function loadManifest() {
  const manifestPath = path.join(dist, ".vite", "manifest.json");
  const savedManifest = path.join(cacheDir, `manifest.${path.basename(dist)}.json`);
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, "utf8");
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(savedManifest, raw);
    return JSON.parse(raw);
  }
  return fs.existsSync(savedManifest) ? JSON.parse(fs.readFileSync(savedManifest, "utf8")) : null;
}
const manifest = loadManifest();

// ── Font preloads ─────────────────────────────
// The first screen's two faces: Anton 400 (the hero h1) and Archivo's latin
// variable file (the body copy). Read the hashed file names from the client
// manifest; fall back to a scan of dist/assets when there is no manifest.
function findFont(pattern) {
  if (manifest) {
    for (const entry of Object.values(manifest)) {
      for (const file of [entry.file, ...(entry.assets ?? [])]) {
        if (file && pattern.test(file)) return `/${file}`;
      }
    }
  }
  const assets = path.join(dist, "assets");
  const hit = fs.existsSync(assets) ? fs.readdirSync(assets).find((f) => pattern.test(f)) : undefined;
  return hit ? `/assets/${hit}` : null;
}
const PRELOAD_FONTS = [
  ["Anton latin", /anton-latin-400-normal-[\w-]+\.woff2$/],
  ["Archivo latin", /archivo-latin-wght-normal-[\w-]+\.woff2$/],
];
let fontPreload = "";
for (const [name, pattern] of PRELOAD_FONTS) {
  const href = findFont(pattern);
  if (!href) fail(`could not find the ${name} woff2 in the client build (preload skipped)`);
  else fontPreload += `\n    <link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`;
}

// ── Inline stylesheet ─────────────────────────
// The client build's one stylesheet (Tailwind, ~62 KB, ~11 KB brotli) goes
// into every page as a <style> in place of its <link>, so the first paint
// waits on no request after the HTML. The whole sheet, not a "critical"
// cut: one sheet serves every route, client-side navigation never fetches
// another page's HTML, and a sheet loaded later would need an inline onload
// handler (blocked by the CSP's script-src) or flash its late rules. Its
// url()s are root-absolute (/assets/...), so they resolve from any page.
{
  const links = [...template.matchAll(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g)];
  if (links.length !== 1) fail(`template: expected one stylesheet link, found ${links.length}`);
  for (const [tag, href] of links) {
    const css = fs.readFileSync(path.join(dist, href), "utf8").trim();
    if (/<\/style/i.test(css)) fail(`${href}: contains </style, cannot be inlined`);
    else if (/url\((?!["']?(?:\/|data:|#))/.test(css)) fail(`${href}: has a relative url(), cannot be inlined`);
    else template = template.replace(tag, () => `<style>${css}</style>`);
  }
}

// No image preloads: the lion mark (a 36 to 64 px brand icon, never the LCP
// element) sits in the prerendered nav at the top of <body>, where the
// preload scanner finds it at once. Preloading it only moved its bytes ahead
// of the render-blocking CSS and delayed the LCP heading.

// ── Split page chunks ─────────────────────────
// The partner pages are lazy in the browser (src/App.tsx, SPLIT_PAGE_SOURCES).
// Their prerendered HTML links the page's chunk and the shared chunks it
// needs as modulepreloads, after the main bundle's tags, so the browser
// fetches them alongside it instead of once it has run; main.tsx then
// hydrates with the page in hand. A split chunk's own CSS (none today) is
// linked as a stylesheet, or the prerendered page would paint unstyled.
function splitPageTags(routePath, splitSources) {
  const source = splitSources[routePath];
  if (!source) return "";
  if (!manifest) {
    warn(`${routePath}: no client manifest, so its split chunk is not preloaded`);
    return "";
  }
  const scripts = [];
  const styles = [];
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    const entry = manifest[key];
    if (!entry) return fail(`${routePath}: the client manifest has no ${key}`);
    if (entry.isEntry) return; // the main bundle: already in the template
    scripts.push(`/${entry.file}`);
    styles.push(...(entry.css ?? []).map((f) => `/${f}`));
    for (const dep of entry.imports ?? []) visit(dep);
  };
  visit(source);
  const tags = [];
  for (const href of styles) if (!template.includes(`"${href}"`)) tags.push(`<link rel="stylesheet" crossorigin href="${href}">`);
  for (const href of scripts) if (!template.includes(`"${href}"`)) tags.push(`<link rel="modulepreload" crossorigin href="${href}">`);
  for (const href of [...styles, ...scripts]) {
    if (!fs.existsSync(path.join(dist, href))) fail(`${routePath}: split chunk ${href} is not in the client build`);
  }
  return tags.map((t) => `  ${t}\n  `).join("");
}

// ── Server bundle ─────────────────────────────
const entry = path.join(ssrDir, "entry-server.js");
if (!fs.existsSync(entry)) {
  console.error("prerender: dist-ssr/entry-server.js not found. Run: vite build --ssr src/entry-server.tsx --outDir dist-ssr");
  process.exit(1);
}
const { render, ROUTES, CONTENT_CHECKS, CROSS_PAGE_REFS, SPLIT_PAGE_SOURCES, sitemapXml, llmsTxt } = await import(
  pathToFileURL(entry).href
);

// ── Helpers ───────────────────────────────────
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
/** Roughly what a non-rendering crawler extracts as page text. */
const textOf = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
const squash = (s) => s.replace(/\s+/g, " ").trim();

/** @id -> first route whose graph defines it (for the cross-page check at the end). */
const definedOnSite = new Map();
/** [route, @id] references to a node another page defines (CROSS_PAGE_REFS). */
const crossPageRefs = [];

/**
 * Every @id referenced ({"@id"} alone) must be defined by a node in the same
 * graph, except the few in CROSS_PAGE_REFS (e.g. /register's `about` -> the
 * Home Event), which must be defined on some other page of the site.
 */
function checkGraph(label, json) {
  const defined = new Set();
  const referenced = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const keys = Object.keys(v);
    if (typeof v["@id"] === "string") (keys.length === 1 ? referenced : defined).add(v["@id"]);
    for (const k of keys) walk(v[k]);
  };
  walk(json);
  for (const id of defined) if (!definedOnSite.has(id)) definedOnSite.set(id, label);
  for (const id of referenced) {
    if (defined.has(id)) continue;
    if (CROSS_PAGE_REFS.includes(id)) crossPageRefs.push([label, id]);
    else fail(`${label}: JSON-LD references undefined @id ${id}`);
  }
  const urls = JSON.stringify(json).match(/"(?:url|item|@id|contentUrl|logo)":"([^"]+)"/g) ?? [];
  for (const u of urls) {
    const value = u.split('":"')[1].slice(0, -1);
    if (!/^https:\/\//.test(value)) fail(`${label}: JSON-LD value is not an absolute https URL: ${u}`);
  }
}

// ── Render every route ────────────────────────
for (const route of ROUTES) {
  const label = route.path;
  let html;
  let head;
  let jsonLd;
  try {
    ({ html, head, jsonLd } = render(route));
  } catch (err) {
    fail(`${label}: render threw: ${err?.stack ?? err}`);
    continue;
  }

  if (html.includes("<!--$!-->"))
    fail(`${label}: a Suspense boundary suspended on the server (gate lazy components behind useHydrated())`);
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(`${label}: expected exactly one <h1>, found ${h1s}`);
  for (const [, url] of html.matchAll(/(?:src|href|srcSet|srcset|poster)="(\/assets\/[^"?#\s]+)/g)) {
    if (!fs.existsSync(path.join(dist, url))) fail(`${label}: missing asset ${url}`);
  }

  // Function replacers: a string replacement would interpret $&, $' and $` in page text.
  const page = template
    .replace(HEAD_MARK, () => head + fontPreload)
    .replace(
      "</head>",
      () => splitPageTags(route.path, SPLIT_PAGE_SOURCES) + (jsonLd ? `  ${jsonLd}\n  </head>` : "</head>"),
    )
    .replace("<!--app-html-->", () => html);

  // Head tags must sit in <head>: a canonical in <body> is ignored.
  const [headPart] = page.split("<body");
  const mustHave = [/<title>[^<]+<\/title>/, /<meta name="description" content="[^"]+"/, /<meta name="robots" content="[^"]+"/];
  if (!route.noindex) mustHave.push(/<link rel="canonical" href="https:\/\/[^"]+"/);
  // Every real page carries its graph, noindex or not (a BreadcrumbList must
  // match the visible trail); only the 404 has none.
  if (!route.notFound) mustHave.push(/<script type="application\/ld\+json">/, /<meta property="og:url" content="https:\/\/[^"]+"/);
  for (const re of mustHave) if (!re.test(headPart)) fail(`${label}: ${re} not found in <head>`);
  if (route.noindex && !/content="noindex/.test(headPart)) fail(`${label}: noindex route without a noindex robots meta`);
  if (route.noindex && /rel="canonical"/.test(page)) fail(`${label}: noindex route carries a canonical`);
  if (!route.noindex && /content="noindex/.test(page)) fail(`${label}: indexable route carries noindex`);
  if ((page.match(/<title>/g) ?? []).length !== 1) fail(`${label}: expected exactly one <title>`);
  if ((page.match(/rel="canonical"/g) ?? []).length > 1) fail(`${label}: more than one canonical`);

  for (const [, raw] of page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      checkGraph(label, JSON.parse(raw));
    } catch (err) {
      fail(`${label}: JSON-LD does not parse: ${err.message}`);
    }
  }

  // What a crawler that runs no JavaScript reads.
  const text = textOf(html);
  if (route.path === "/") {
    CONTENT_CHECKS.faqAnswers.forEach((a, i) => {
      if (!text.includes(squash(a))) fail(`/: FAQ answer ${i + 1} is not in the raw HTML ("${a.slice(0, 48)}...")`);
    });
    if (!text.includes(CONTENT_CHECKS.street)) fail(`/: the street address is not in the raw HTML`);
    if (!text.includes(CONTENT_CHECKS.email)) warn(`/: the contact email is not in the raw HTML`);
  }
  for (const banned of CONTENT_CHECKS.banned) {
    if (page.includes(banned)) warn(`${label}: contains "${banned}"`);
  }
  // The BreadcrumbList must describe a trail the page actually shows.
  if (route.breadcrumb) {
    const trailHtml = html.match(/<nav[^>]*aria-label="[^"]*[Bb]readcrumb[^"]*"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    if (!trailHtml) warn(`${label}: BreadcrumbList in the JSON-LD but no visible <nav aria-label="Breadcrumb"> trail`);
    else {
      const trail = textOf(trailHtml);
      let at = 0;
      for (const crumb of route.breadcrumb) {
        const i = trail.indexOf(crumb.name, at);
        if (i < 0) {
          warn(`${label}: visible trail "${trail}" does not show "${crumb.name}" in order`);
          break;
        }
        at = i + crumb.name.length;
      }
    }
  }

  const out = path.join(dist, route.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  console.log(`prerendered ${route.path.padEnd(18)} -> ${path.relative(root, out)}  (${(page.length / 1024).toFixed(1)} KB)`);
}

// A cross-page reference must still land on a node some page defines.
for (const [label, id] of crossPageRefs) {
  if (!definedOnSite.has(id)) fail(`${label}: JSON-LD references ${id}, which no page defines`);
}

// ── Generated text files ──────────────────────
const generated = { "sitemap.xml": sitemapXml(), "llms.txt": llmsTxt() };
// A noindex page listed in either file sends crawlers mixed signals.
for (const route of ROUTES.filter((r) => r.noindex)) {
  if (generated["sitemap.xml"].includes(`${route.path}</loc>`)) fail(`sitemap.xml lists noindex route ${route.path}`);
  if (generated["llms.txt"].includes(`${route.path})`)) fail(`llms.txt links noindex route ${route.path}`);
}
for (const [name, body] of Object.entries(generated)) {
  fs.writeFileSync(path.join(dist, name), body);
  const pub = path.join(root, "public", name);
  if (args.has("--write-public")) {
    fs.writeFileSync(pub, body);
    console.log(`wrote public/${name}`);
  } else if (!fs.existsSync(pub) || fs.readFileSync(pub, "utf8").replace(/\r\n/g, "\n") !== body) {
    warn(`public/${name} is stale; refresh it with: node scripts/prerender.mjs --write-public`);
  }
}

// The manifest was only for the font lookup; do not deploy it.
fs.rmSync(path.join(dist, ".vite"), { recursive: true, force: true });

if (warnings.length) console.warn(`\nprerender warnings:\n  ${warnings.join("\n  ")}`);
if (args.has("--strict") && warnings.length) failures.push(...warnings.map((w) => `(strict) ${w}`));
if (failures.length) {
  console.error(`\nprerender FAILED:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`\nprerender ok: ${ROUTES.length} routes`);
