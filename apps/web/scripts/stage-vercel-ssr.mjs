import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
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

const supabaseUrl =
  process.env.VITE_SUPABASE_URL?.trim() ?? process.env.SUPABASE_URL?.trim();
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.SUPABASE_ANON_KEY?.trim();

if (supabaseUrl && supabaseKey) {
  writeFileSync(
    join(stageDir, "env.json"),
    JSON.stringify({ supabaseUrl, supabaseKey }),
  );
  console.log("staged SSR Supabase env at api/_ssr/env.json");
} else {
  console.warn(
    "warning: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — blog/pin SSR will fail on Vercel",
  );
}

// Vercel serves dist/index.html for `/` before rewrites run. Remove it only on
// Vercel builds so Capacitor sync (../web/dist) still gets index.html locally/CI.
if (process.env.VERCEL === "1") {
  unlinkSync(indexHtml);
  console.log("removed dist/index.html so `/` is rendered by api/ssr");
}

console.log("staged SSR bundle for Vercel at api/_ssr/");
