#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const entryServer = join(webRoot, "dist-ssr/entry-server.js");

const { renderSitemapXml } = await import(entryServer);
const xml = renderSitemapXml();

for (const dir of [join(webRoot, "public"), join(webRoot, "dist")]) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "sitemap.xml"), `${xml}\n`);
}

console.log("generated sitemap.xml");
