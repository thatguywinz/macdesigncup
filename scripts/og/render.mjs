// Renders scripts/og/og.html to public/og-image.png (1200x630) with Playwright.
// Run locally and commit the PNG; never in the Vercel build (no browser there).
//
//   npm run build:ssr && npm run og:render
//
// The card's words come from the SSR bundle's OG_CARD export (built from
// src/config/site.ts + src/content/copy.ts), so the image never states a fact
// the site does not. Fonts (@fontsource) and the lion mark are inlined as
// data URIs, so the page is self-contained.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const out = path.join(root, "public", "og-image.png");

const entry = path.join(root, "dist-ssr", "entry-server.js");
if (!fs.existsSync(entry)) {
  console.error("og: dist-ssr/entry-server.js not found. Run `npm run build:ssr` first.");
  process.exit(1);
}
process.env.NODE_ENV = "production";
const { OG_CARD } = await import(pathToFileURL(entry).href);

const dataUri = (file, type) => `data:${type};base64,${fs.readFileSync(path.join(root, file)).toString("base64")}`;
const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fill = {
  fontAnton: dataUri("node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2", "font/woff2"),
  fontMono: dataUri("node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2", "font/woff2"),
  fontMonoBold: dataUri("node_modules/@fontsource/space-mono/files/space-mono-latin-700-normal.woff2", "font/woff2"),
  fontArchivo: dataUri("node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2", "font/woff2"),
  lion: dataUri("public/lion/lion-mark.png", "image/png"),
};
const text = {
  model: OG_CARD.model,
  kicker: OG_CARD.kicker,
  h1a: OG_CARD.h1[0],
  h1b: OG_CARD.h1[1],
  date: OG_CARD.date,
  venue: OG_CARD.venue,
  prize: OG_CARD.prize,
  audience: OG_CARD.audience,
  dim: "Ø 300",
};

let html = fs.readFileSync(path.join(here, "og.html"), "utf8");
html = html.replace(/\{\{(\w+)\}\}/g, (m, key) => {
  if (key in fill) return fill[key];
  if (key in text) return escape(text[key]);
  throw new Error(`og.html: no value for ${m}`);
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    ["Anton", "Space Mono", "Archivo"].filter((f) => !document.fonts.check(`16px "${f}"`)),
  );
  if (missing.length) throw new Error(`og: fonts failed to load: ${missing.join(", ")}`);
  await page.screenshot({ path: out, type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(`og: wrote ${path.relative(root, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
} finally {
  await browser.close();
}
