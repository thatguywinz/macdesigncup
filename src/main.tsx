import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Self-hosted faces (no third-party font request, no layout-shifting swap from
// a CDN). Latin only: Anton 400 for display, Space Mono 400/700 for labels,
// Archivo (variable weight axis) for body copy. Archivo's package ships every
// subset in one file, but each @font-face carries a unicode-range, so the
// browser only downloads the latin file for this site's English copy.
import "@fontsource/anton/latin-400.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "@fontsource-variable/archivo/wght.css";
import App, { preloadPage } from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

// Must match src/entry-server.tsx exactly, apart from the router and the
// split pages (lazy here, static there, under the same Suspense boundary).
const app = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
);

// Built pages arrive prerendered (scripts/prerender.mjs), so React adopts the
// existing DOM. `vite dev` serves the bare template, whose #root holds only the
// <!--app-html--> comment: test for an element child, not any child node.
const start = () => {
  if (container.firstElementChild) hydrateRoot(container, app);
  else createRoot(container).render(app);
};

// A partner page lives in its own chunk (the prerender already linked it as a
// modulepreload): have it in hand before hydrating, so the page's boundary
// resolves at once instead of waiting dehydrated. If it fails, hydrate anyway;
// the page keeps its server HTML (see splitPage in App.tsx).
const pending = preloadPage(window.location.pathname);
if (pending) pending.then(start, start);
else start();
