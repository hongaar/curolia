import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { resolveAppVersion } from "../../scripts/resolve-app-version.mjs";
import { buildSsrNavigateFallbackDenylist } from "./src/ssr/ssr-route-paths";

const SSR_NAVIGATE_FALLBACK_DENYLIST = buildSsrNavigateFallbackDenylist();

const repoRoot = path.resolve(__dirname, "../..");
const appVersion = resolveAppVersion();
const appAssetsConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(repoRoot, "packages", "brand", "app-assets.config.json"),
    "utf8",
  ),
);

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icon.png"],
      manifest: {
        name: appAssetsConfig.web.name,
        short_name: appAssetsConfig.web.shortName,
        description: appAssetsConfig.web.description,
        theme_color: appAssetsConfig.web.themeColor,
        background_color: appAssetsConfig.web.backgroundColor,
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon.png",
            sizes: "714x714",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon.png",
            sizes: "714x714",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Main chunk exceeds the 2 MiB default after map + editor lazy splits.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        sourcemap: true,
        navigateFallbackDenylist: SSR_NAVIGATE_FALLBACK_DENYLIST,
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "image" ||
              request.destination === "font",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 128,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
        ],
      },
    }),
  ],
  // Bundle all dependencies into dist-ssr so Vercel Functions do not rely on
  // hoisted node_modules paths (e.g. react-router-dom/dist/index.js).
  ssr: {
    noExternal: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // npm hoists workspace packages to the repo root; Vite’s root is apps/web only.
      "@curolia/plugin-contract": path.resolve(
        repoRoot,
        "packages/plugin-contract/src/index.ts",
      ),
      "@curolia/services": path.resolve(repoRoot, "packages/services/src"),
      "@curolia/plugin-google-photos": path.resolve(
        repoRoot,
        "packages/plugins/google-photos/src/index.ts",
      ),
      "@curolia/plugin-ical": path.resolve(
        repoRoot,
        "packages/plugins/ical/src/index.ts",
      ),
      "@curolia/plugin-oauth": path.resolve(
        repoRoot,
        "packages/plugins/oauth/src/index.ts",
      ),
      "@curolia/plugin-wikidata": path.resolve(
        repoRoot,
        "packages/plugins/wikidata/src/index.ts",
      ),
    },
  },
  server: {
    host: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
