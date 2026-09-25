// Server entry for the build-time prerender (never shipped to browsers).
// `vite build --ssr src/entry-server.tsx --outDir dist-ssr` bundles it;
// scripts/prerender.mjs imports the bundle and writes one static HTML file per
// route. The tree must match src/main.tsx exactly, apart from the router
// (StaticRouter here, BrowserRouter there, same future flags, no StrictMode on
// either side) and the split pages: the browser loads the partner pages lazily,
// the prerender imports them statically and hands them to <App pages>, so
// renderToString never suspends and both trees put the one Suspense boundary
// in the same place. Fonts and index.css stay client-only (imported in main.tsx).
/* eslint-disable react-refresh/only-export-components -- a Node build entry, never hot-reloaded */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App, { SPLIT_PAGE_SOURCES, type SplitPages } from "./App";
import PartnerPage from "./pages/partner/index.tsx";
import PartnerRegister from "./pages/partner/Register.tsx";
import {
  CONTACT_EMAIL,
  EVENT_DATE_SHORT,
  EVENT_FULL,
  EVENT_WEEKDAY,
  KICKER,
  MODEL_NO,
  PRIZE_POOL,
  VENUE_ADDRESS,
  VENUE_BUILDING,
  VENUE_INSTITUTION,
  VENUE_STREET,
} from "./config/site";
import { FAQS, HERO } from "./content/copy";
import { headFor, jsonLdFor } from "./seo/head";
import { CROSS_PAGE_REFS, graphFor } from "./seo/jsonld";
import { llmsTxt, sitemapXml } from "./seo/files";
import { ROUTES, type RouteDef } from "./seo/routes";

export { ROUTES, llmsTxt, sitemapXml, graphFor, CROSS_PAGE_REFS, SPLIT_PAGE_SOURCES };

/** The split pages, already loaded: the server render must never suspend. */
const STATIC_PAGES: SplitPages = { PartnerPage, PartnerRegister };

export function render(route: RouteDef): { html: string; head: string; jsonLd: string } {
  const html = renderToString(
    <StaticRouter location={route.path} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App pages={STATIC_PAGES} />
    </StaticRouter>,
  );
  return { html, head: headFor(route), jsonLd: jsonLdFor(route) };
}

/**
 * Strings the prerender asserts are present in the raw HTML (what a crawler
 * that runs no JavaScript reads).
 */
export const CONTENT_CHECKS = {
  faqAnswers: FAQS.map((f) => f.a),
  street: VENUE_STREET,
  address: VENUE_ADDRESS,
  email: CONTACT_EMAIL,
  /** Must appear nowhere in the output (the school is a Polytechnic now). */
  banned: ["George Brown College"],
};

/** Facts for the social card (scripts/og/render.mjs fills scripts/og/og.html). */
export const OG_CARD = {
  name: EVENT_FULL,
  h1: HERO.h1,
  model: MODEL_NO,
  kicker: KICKER,
  date: `${EVENT_WEEKDAY.slice(0, 3)}, ${EVENT_DATE_SHORT}`,
  venue: `${VENUE_BUILDING}, ${VENUE_INSTITUTION}`,
  prize: `${PRIZE_POOL} in prizes`,
  audience: "For TDSB students and their teachers",
};
