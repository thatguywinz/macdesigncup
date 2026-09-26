import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { Suspense, lazy, useEffect, useRef, type ComponentType } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Register from "./pages/Register.tsx";
import RouteHead from "./seo/RouteHead";
import { normalizePath } from "./seo/routes";

// ── Split pages ───────────────────────────────
// The two partner pages, and react-hook-form (only their form uses it), ship
// in their own chunks, so Home and /register never download them. The
// browser gets lazy components; the prerender passes the same pages imported
// statically (src/entry-server.tsx), so renderToString never suspends and the
// Suspense boundary below sits at the same place in both trees.

/** Router path -> the page's module, for the lazy components and preloads. */
const SPLIT_LOADERS = {
  "/partner": () => import("./pages/partner/index.tsx"),
  "/partner/register": () => import("./pages/partner/Register.tsx"),
} as const;

/**
 * The same modules as build-manifest keys, so the prerender can link each
 * page's chunk in its HTML (modulepreload) and hydration does not wait on a
 * request that only starts once the main bundle has run.
 */
// eslint-disable-next-line react-refresh/only-export-components -- read by the prerender; one table, next to the loaders it mirrors
export const SPLIT_PAGE_SOURCES: Record<keyof typeof SPLIT_LOADERS, string> = {
  "/partner": "src/pages/partner/index.tsx",
  "/partner/register": "src/pages/partner/Register.tsx",
};

export interface SplitPages {
  PartnerPage: ComponentType;
  PartnerRegister: ComponentType;
}

// Read at module load, never during render.
const FIRST_PATH = typeof window === "undefined" ? "" : window.location.pathname;

/**
 * A lazy page. If its chunk fails to load after a client-side navigation
 * (typically: a deploy replaced the hashed file while this tab was open), load
 * the new URL for real, which fetches the current build. On the page the tab
 * opened on, the prerendered HTML is already showing: leave it there (a
 * promise that never settles keeps the boundary on the server markup) rather
 * than blank the page or reload in a loop.
 */
function splitPage(load: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    load().catch((error: unknown) => {
      console.error(error);
      if (window.location.pathname !== FIRST_PATH) window.location.reload();
      return new Promise<never>(() => {});
    }),
  );
}

const LAZY_PAGES: SplitPages = {
  PartnerPage: splitPage(SPLIT_LOADERS["/partner"]),
  PartnerRegister: splitPage(SPLIT_LOADERS["/partner/register"]),
};

/**
 * Starts fetching the chunk of a split page, or returns null for a page that
 * is in the main bundle. main.tsx waits for it before hydrating a prerendered
 * partner page: the boundary then resolves at once, so no update can reach it
 * while it is still dehydrated (React would drop the server HTML for the empty
 * fallback until the chunk arrived).
 */
// eslint-disable-next-line react-refresh/only-export-components -- used by main.tsx; editing the root module reloads the page anyway
export function preloadPage(pathname: string): Promise<unknown> | null {
  const path = normalizePath(pathname);
  return path in SPLIT_LOADERS ? SPLIT_LOADERS[path as keyof typeof SPLIT_LOADERS]() : null;
}

// ── Arrival scrolling ─────────────────────────
// `html { scroll-behavior: smooth }` animates every programmatic scroll that
// does not choose its own behaviour. Arriving on a page (a first load, a
// shared /#faq link, a route change) must not animate: the visitor would
// watch the hero dolly and every section whip past on the way down. So from
// arrival until the visitor's first input the root scrolls instantly (App's
// jump below, and FAQSection's follow-up scroll to a question it had to
// un-hide first). The first pointer, key, wheel or touch hands the root back
// to the stylesheet before any click handler runs, so in-page links stay
// smooth. The same inline-style switch the hero's glide uses.
const INPUTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
let releaseInstantScroll: (() => void) | null = null;

function holdInstantScroll() {
  if (releaseInstantScroll) return;
  const root = document.documentElement;
  const before = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  const release = () => {
    if (releaseInstantScroll !== release) return;
    releaseInstantScroll = null;
    INPUTS.forEach((type) => window.removeEventListener(type, release, true));
    if (root.style.scrollBehavior === "auto") root.style.scrollBehavior = before;
  };
  releaseInstantScroll = release;
  INPUTS.forEach((type) => window.addEventListener(type, release, { capture: true, passive: true }));
}

interface AppProps {
  /** The split pages: lazy in the browser (the default), static in the prerender. */
  pages?: SplitPages;
}

const App = ({ pages = LAZY_PAGES }: AppProps) => {
  const { pathname, hash } = useLocation();
  const { PartnerPage, PartnerRegister } = pages;
  const arrivedAt = useRef<string | null>(null);

  // Land at the top on a real page change, but never fight an in-page anchor:
  // a "#faq" click is also a location change, and resetting scroll there is
  // what used to snap visitors back to the hero mid-jump.
  useEffect(() => {
    // A new page (first load or a route change) jumps; a hash change within
    // the page keeps the stylesheet's smooth scroll.
    if (arrivedAt.current !== pathname) holdInstantScroll();
    arrivedAt.current = pathname;
    if (hash) {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return; // a malformed %-escape: nothing on the page can match it
      }
      // Wait a frame so the target section has actually mounted and laid out.
      const raf = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        // No such section on this page (e.g. a stale deep link): go to the top
        // rather than leaving the click with no visible effect at all.
        if (target) target.scrollIntoView({ block: "start" });
        else window.scrollTo(0, 0);
      });
      return () => cancelAnimationFrame(raf);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => () => releaseInstantScroll?.(), []);

  return (
    <>
      {/* Title, description, canonical and social tags follow client-side
          navigation (the prerendered HTML already carries them on load). */}
      <RouteHead />
      {/* Every framer animation on every route honours the OS "reduce motion"
          setting: transforms and layout animations are skipped, opacity
          still fades. Scroll-scrubbed pieces add their own static fallback.
          LazyMotion: components are the slim `m.*`, given only the animation
          and gesture (whileInView) features, so the bundle leaves out drag
          and layout projection, which nothing uses. `strict` throws on a
          full `motion.*` rendered inside, which would pull them back in. */}
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          {/* Around the whole route table, not just the split pages: a client
              navigation to /partner then keeps the current page on screen
              (router updates are transitions) until the chunk is in, instead
              of flashing the empty fallback. Nothing above it updates during
              hydration, and the prerender renders it with no fallback. */}
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              {/* Partner routes */}
              <Route path="/partner" element={<PartnerPage />} />
              <Route path="/partner/register" element={<PartnerRegister />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </MotionConfig>
      </LazyMotion>
    </>
  );
};

export default App;
