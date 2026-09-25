import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
//
// One config serves both builds of `npm run build`:
//   1. the client build (`vite build`)             -> dist/
//   2. the SSR build (`vite build --ssr src/entry-server.tsx --outDir dist-ssr`)
// then scripts/prerender.mjs renders every route into dist/. Sharing the config
// keeps hashed asset URLs identical in both builds, so the prerendered
// <img src="/assets/..."> always points at a file the client build emitted.
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
}));
