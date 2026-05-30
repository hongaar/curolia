import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const brandPkgRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(brandPkgRoot, "..", "..");

const configPath = path.join(brandPkgRoot, "app-assets.config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const logoSourcePath = path.join(brandPkgRoot, "icon.png");

const webPublicDir = path.join(repoRoot, "apps", "web", "public");
await fs.mkdir(webPublicDir, { recursive: true });

const faviconOutputPath = path.join(webPublicDir, "favicon.png");
const iconsOutputPath = path.join(webPublicDir, "icon.png");

await fs.copyFile(logoSourcePath, faviconOutputPath);
await fs.copyFile(logoSourcePath, iconsOutputPath);

for (const legacyAsset of ["favicon.svg", "icons.svg"]) {
  await fs.rm(path.join(webPublicDir, legacyAsset), { force: true });
}

const manifestOutputPath = path.join(webPublicDir, "site.webmanifest");

const manifest = {
  name: config.web.name,
  short_name: config.web.shortName,
  description: config.web.description,
  theme_color: config.web.themeColor,
  background_color: config.web.backgroundColor,
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
};

await fs.writeFile(
  manifestOutputPath,
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const indexHtmlPath = path.join(repoRoot, "apps", "web", "index.html");
const indexHtml = await fs.readFile(indexHtmlPath, "utf8");
const themeMetaRegex = /<meta name="theme-color" content="[^"]*"\s*\/>/;
if (!themeMetaRegex.test(indexHtml)) {
  throw new Error(
    "Failed to update theme-color meta tag in apps/web/index.html (pattern not found).",
  );
}

const nextIndexHtml = indexHtml.replace(
  themeMetaRegex,
  `<meta name="theme-color" content="${config.web.themeColor}" />`,
);

await fs.writeFile(indexHtmlPath, nextIndexHtml);

console.log("Generated web assets (favicon/icon/manifest/theme-color).");
