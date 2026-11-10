import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The submission portal's own production build (portal.html -> dist/portal.html
// plus its hashed assets). Separate from the main client build on purpose: the
// prerendered site's bundle, stylesheet and chunks stay exactly as they were,
// and nothing in the portal can change what the homepage ships. Runs after
// `vite build` (it adds to dist/, never empties it). `vite dev` serves the
// portal from the main config (see portalDev in vite.config.ts).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: { portal: path.resolve(__dirname, "portal.html") },
      output: {
        manualChunks: {
          "portal-three": ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
