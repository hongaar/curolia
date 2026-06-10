import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** Default for `ssr:preview` — intentionally not 4173 (Vite `preview`). */
export const SSR_PREVIEW_PORT = 4321;

export function webDistPaths() {
  return {
    webRoot,
    indexHtml: join(webRoot, "dist/index.html"),
    assetsDir: join(webRoot, "dist/assets"),
    entryServer: join(webRoot, "dist-ssr/entry-server.js"),
  };
}

export function assertProductionBuild() {
  const paths = webDistPaths();
  for (const [label, file] of [
    ["dist/index.html", paths.indexHtml],
    ["dist-ssr/entry-server.js", paths.entryServer],
    ["dist/assets", paths.assetsDir],
  ]) {
    if (!existsSync(file)) {
      throw new Error(
        `Missing ${label}. Run "npm run build -w @curolia/web" first.`,
      );
    }
  }
  return paths;
}

export async function loadProductionSsr() {
  const paths = assertProductionBuild();
  const { enrichTemplateWithProductionStyles, render, setSsrTemplate } =
    await import(paths.entryServer);

  const template = readFileSync(paths.indexHtml, "utf8");
  const enrichedTemplate = enrichTemplateWithProductionStyles(
    template,
    paths.assetsDir,
  );
  setSsrTemplate(enrichedTemplate);

  return {
    render,
    enrichedTemplate,
    paths,
  };
}

export function assetStylesheetHrefs(html) {
  return [
    ...html.matchAll(
      /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi,
    ),
  ]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/assets/") && href.endsWith(".css"));
}
