import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const repoRoot = path.resolve(__dirname, "../..");
const webPackage = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
) as { version: string };
const appAssetsConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(repoRoot, "packages", "brand", "app-assets.config.json"),
    "utf8",
  ),
);

/**
 * Prism language files and @lexical/code reference bare `Prism`; Rolldown (Vite 8)
 * does not guarantee init order, so production builds throw ReferenceError.
 * @see https://github.com/mdx-editor/editor/issues/491
 */
const prismjsGlobalShim = {
  name: "prismjs-global-shim",
  transform(code: string, id: string) {
    const needsPrismImport =
      /[/\\]prismjs[/\\]components[/\\]/.test(id) ||
      (/[/\\]@lexical[/\\]code[/\\]/.test(id) && /\bPrism\b/.test(code));
    if (needsPrismImport) {
      return { code: `import Prism from "prismjs";\n${code}`, map: null };
    }
  },
};

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(webPackage.version),
  },
  plugins: [
    react(),
    prismjsGlobalShim,
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
        navigateFallbackDenylist: [/^\/api\//],
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // npm hoists workspace packages to the repo root; Vite’s root is apps/web only.
      "@curolia/plugin-contract": path.resolve(
        repoRoot,
        "packages/plugin-contract/src/index.ts",
      ),
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
    },
  },
  server: {
    host: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
