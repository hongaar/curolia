import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assetStylesheetHrefs,
  loadProductionSsr,
} from "./lib/ssr-production.mjs";

const ORIGIN = "http://127.0.0.1:4173";

/** Static SSR routes — no Supabase needed. */
const STATIC_ROUTES = [
  { path: "/", titleIncludes: "Curolia", bodyIncludes: "map" },
  { path: "/privacy", titleIncludes: "Privacy", bodyIncludes: "Privacy" },
  { path: "/for/travel", titleIncludes: "travel", bodyIncludes: "map" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rootHtml(html) {
  const open = '<div id="root">';
  const start = html.indexOf(open);
  if (start === -1) return "";

  const contentStart = start + open.length;
  const bodyEnd = html.indexOf("</body>", contentStart);
  if (bodyEnd === -1) return "";

  const inner = html.slice(contentStart, bodyEnd);
  const rootClose = inner.lastIndexOf("</div>");
  if (rootClose === -1) return "";

  return inner.slice(0, rootClose).trim();
}

function assertAssetStylesheets(html, assetsDir) {
  const hrefs = assetStylesheetHrefs(html);
  assert(
    hrefs.length >= 2,
    "expected index + code-split CSS bundles in stylesheet links",
  );

  for (const href of hrefs) {
    const file = join(assetsDir, href.replace(/^\/assets\//, ""));
    assert(
      readFileSync(file, "utf8").length > 0,
      `stylesheet asset missing or empty: ${href}`,
    );
  }
}

function assertCssModuleClassResolved(html, assetsDir) {
  const className = html.match(/class="([^"]+)"/)?.[1]?.split(/\s+/)[0];
  if (!className) return;

  const cssBundles = assetStylesheetHrefs(html).map((href) =>
    readFileSync(join(assetsDir, href.replace(/^\/assets\//, "")), "utf8"),
  );
  assert(
    cssBundles.some((css) => css.includes(`.${className}`)),
    `rendered class "${className}" not found in linked CSS bundles`,
  );
}

async function smokeRoute(
  render,
  paths,
  { path, titleIncludes, bodyIncludes },
) {
  const result = await render(path, ORIGIN);
  assert(result, `${path} should be an SSR route`);
  assert(
    result.status === 200,
    `${path} expected status 200, got ${result.status}`,
  );

  const html = result.html;
  assert(html.includes(`<title>`), `${path} missing <title>`);
  assert(
    html.toLowerCase().includes(titleIncludes.toLowerCase()),
    `${path} title should mention "${titleIncludes}"`,
  );
  assert(
    html.includes('name="description"'),
    `${path} missing meta description`,
  );

  const body = rootHtml(html);
  assert(body.length > 0, `${path} #root should contain SSR HTML`);
  assert(
    body.toLowerCase().includes(bodyIncludes.toLowerCase()),
    `${path} body should mention "${bodyIncludes}"`,
  );

  assertAssetStylesheets(html, paths.assetsDir);
  assertCssModuleClassResolved(html, paths.assetsDir);
}

async function main() {
  const { render, paths } = await loadProductionSsr();

  for (const route of STATIC_ROUTES) {
    await smokeRoute(render, paths, route);
    console.log(`ok ${route.path}`);
  }

  const spa = await render("/login", ORIGIN);
  assert(spa === null, "/login should fall through to the SPA (not SSR)");

  console.log("ssr smoke passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
