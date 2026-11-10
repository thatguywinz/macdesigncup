import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ── Submission portal (dev only) ──────────────
// The portal is its own page (portal.html) with its own router, kept apart
// from the prerendered marketing site. In `vite dev` this plugin serves its
// routes from portal.html and runs the API (server/portal) in-process, loaded
// through Vite so edits to the server reload without a restart. Production
// uses vercel.json rewrites and the api/portal.ts function instead.
const PORTAL_PAGES = /^\/(submit|judge|entry|gallery)(\/|$|\?)/;

function portalDev(): Plugin {
  return {
    name: "mdc-portal-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "/";
        if (url === "/api/portal" || url.startsWith("/api/portal/") || url.startsWith("/api/portal?")) {
          try {
            const mod = await server.ssrLoadModule("/server/portal/handler.ts");
            await mod.handlePortal(req, res);
          } catch (e) {
            server.ssrFixStacktrace(e as Error);
            next(e);
          }
          return;
        }
        if (PORTAL_PAGES.test(url)) req.url = "/portal.html";
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
//
// One config serves both builds of `npm run build`:
//   1. the client build (`vite build`)             -> dist/
//   2. the SSR build (`vite build --ssr src/entry-server.tsx --outDir dist-ssr`)
// then scripts/prerender.mjs renders every route into dist/. Sharing the config
// keeps hashed asset URLs identical in both builds, so the prerendered
// <img src="/assets/..."> always points at a file the client build emitted.
export default defineConfig(({ mode, isSsrBuild, command }) => {
  // Portal secrets from .env.local reach the in-process dev API (Vite only
  // exposes VITE_* to the browser, and these must never go there).
  if (command === "serve") {
    for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ["PORTAL_", "BLOB_"]))) process.env[k] ??= v;
  }
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // The portal viewer imports its file loaders on demand: pre-bundle them so
  // the first model opened in `vite dev` doesn't trigger a dependency
  // re-optimization (a full page reload mid-upload).
  optimizeDeps: {
    include: [
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/loaders/DRACOLoader.js",
      "three/examples/jsm/loaders/STLLoader.js",
      "three/examples/jsm/loaders/OBJLoader.js",
      "three/examples/jsm/loaders/3MFLoader.js",
      "three/examples/jsm/loaders/PLYLoader.js",
      "three/examples/jsm/environments/RoomEnvironment.js",
      "@vercel/blob/client",
    ],
  },
  plugins: [react(), portalDev(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    // The SSR bundle only needs JS; public/ belongs to the client output.
    copyPublicDir: !isSsrBuild,
    // The client manifest tells the prerender the hashed name of the Anton
    // font file to preload (the prerender deletes dist/.vite afterwards).
    manifest: !isSsrBuild,
    // manualChunks must stay client-only: in the SSR build react is external,
    // and Rollup refuses to put an external module into a manual chunk.
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks: {
              vendor: ["react", "react-dom", "react-router-dom", "framer-motion"],
            },
          },
        },
  },
  };
});
