import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(webRoot, "dist-ssr/entry-server.js");
const bundle = readFileSync(bundlePath, "utf8");

for (const line of bundle.split("\n")) {
  const match = line.match(/^import\s+.+\s+from\s+["']([^"']+)["']/);
  if (!match) continue;
  const specifier = match[1];
  if (specifier.startsWith(".") || specifier.startsWith("node:")) continue;
  throw new Error(
    `dist-ssr/entry-server.js has external import "${specifier}" — ` +
      "ssr.noExternal must bundle all npm dependencies for Vercel.",
  );
}

console.log("SSR bundle verified (no external npm imports)");
