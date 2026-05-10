import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isRailwayBuild =
  process.env.RAILWAY_DEPLOYMENT === "1" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

export default defineConfig({
  cloudflare: isRailwayBuild ? false : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
});
