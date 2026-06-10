import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const stageDir = join(webRoot, "api/_ssr");

const indexHtml = join(webRoot, "dist/index.html");
const assetsDir = join(webRoot, "dist/assets");
const entryServer = join(webRoot, "dist-ssr/entry-server.js");

for (const [label, path] of [
  ["dist/index.html", indexHtml],
  ["dist/assets", assetsDir],
  ["dist-ssr/entry-server.js", entryServer],
]) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}. Run the web build before staging SSR.`);
  }
}

mkdirSync(stageDir, { recursive: true });
cpSync(entryServer, join(stageDir, "entry-server.js"));

const { enrichTemplateWithProductionStyles } = await import(entryServer);
const template = readFileSync(indexHtml, "utf8");
const enriched = enrichTemplateWithProductionStyles(template, assetsDir);
writeFileSync(join(stageDir, "template.html"), enriched);

console.log("staged SSR bundle for Vercel at api/_ssr/");
