import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Builds the Node.js HTTP server adapter (src/node-server.ts) into
 * dist/server/node-server.js so Railway can start it with `node dist/server/node-server.js`.
 *
 * This is a separate build step from the main TanStack Start SSR build.
 * It runs after the main build so that the fetch handler (dist/server/server.js)
 * is already in place when node-server.js imports it at runtime.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    ssr: true,
    outDir: "dist/server",
    emptyOutDir: false,
    rollupOptions: {
      input: { "node-server": "src/node-server.ts" },
      output: {
        entryFileNames: "[name].js",
        format: "esm",
      },
      // Keep node built-ins external
      external: [/^node:/],
    },
  },
});
