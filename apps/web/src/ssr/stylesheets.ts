import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Parse stylesheet hrefs already present in an HTML template. */
export function parseStylesheetHrefs(html: string): Set<string> {
  const hrefs = new Set<string>();
  const tagRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  for (const tag of html.matchAll(tagRe)) {
    const href = tag[0].match(/href=["']([^"']+)["']/)?.[1];
    if (href) hrefs.add(href);
  }
  return hrefs;
}

/** Insert stylesheet links before `</head>` for any hrefs not already in the template. */
export function injectStylesheetHrefs(
  html: string,
  hrefs: Iterable<string>,
): string {
  const existing = parseStylesheetHrefs(html);
  const tags: string[] = [];

  for (const href of hrefs) {
    if (!href || existing.has(href)) continue;
    existing.add(href);
    tags.push(`<link rel="stylesheet" crossorigin href="${href}" />`);
  }

  if (tags.length === 0) return html;
  return html.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
}

/** All hashed CSS assets emitted by the client build (includes code-split chunks). */
export function productionStylesheetHrefs(assetsDir: string): string[] {
  try {
    return readdirSync(assetsDir)
      .filter((file) => file.endsWith(".css"))
      .sort()
      .map((file) => `/assets/${file}`);
  } catch {
    return [];
  }
}

export function enrichTemplateWithProductionStyles(
  template: string,
  assetsDir: string,
): string {
  return injectStylesheetHrefs(template, productionStylesheetHrefs(assetsDir));
}

export function defaultProductionAssetsDir(cwd = process.cwd()): string {
  return join(cwd, "dist", "assets");
}
