import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

import { loadProductionSsr, SSR_PREVIEW_PORT } from "./lib/ssr-production.mjs";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? SSR_PREVIEW_PORT);
const ORIGIN = `http://${HOST}:${PORT}`;

const PREVIEW_MARKER = "<!-- curolia-ssr-preview -->";
const SW_UNREGISTER_SNIPPET =
  '<script>/* curolia-ssr-preview */try{if("serviceWorker"in navigator)navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})})}catch(e){}</script>';

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function sendFile(res, filePath) {
  const ext = extname(filePath);
  res.statusCode = 200;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Curolia-Ssr-Preview", "1");
  res.setHeader("Content-Type", MIME[ext] ?? "application/octet-stream");
  createReadStream(filePath).pipe(res);
}

function decoratePreviewHtml(html) {
  if (html.includes(PREVIEW_MARKER)) return html;
  if (html.includes("<head>")) {
    return html.replace(
      "<head>",
      `<head>\n    ${PREVIEW_MARKER}\n    ${SW_UNREGISTER_SNIPPET}`,
    );
  }
  return `${PREVIEW_MARKER}\n${html}`;
}

function sendHtml(res, html, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Curolia-Ssr-Preview", "1");
  res.end(decoratePreviewHtml(html));
}

function spaFallbackPage(pathname) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>SPA route — Curolia SSR preview</title>
  </head>
  <body>
    <h1>Not an SSR route</h1>
    <p><code>${pathname}</code> is handled client-side only in production. Use an SSR path such as <a href="/">/</a>, <a href="/privacy">/privacy</a>, or <a href="/for/travel">/for/travel</a>.</p>
  </body>
</html>`;
}

function isBlockedPreviewAsset(pathname) {
  return (
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    /^\/workbox-/.test(pathname)
  );
}

function isIndexHtmlPath(pathname) {
  return pathname === "/index.html";
}

function looksLikeSpaShell(html) {
  return (
    html.includes('<div id="root"></div>') &&
    html.includes("<title>Curolia</title>") &&
    !html.includes("landing-hero") &&
    !html.includes("Privacy Policy")
  );
}

async function main() {
  const { render, paths } = await loadProductionSsr();
  const distDir = join(paths.webRoot, "dist");

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", ORIGIN);
    const pathname = url.pathname;

    if (isBlockedPreviewAsset(pathname)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Curolia-Ssr-Preview", "1");
      res.end("Service worker disabled in SSR preview.");
      return;
    }

    const staticPath = join(distDir, pathname);
    if (
      pathname !== "/" &&
      !isIndexHtmlPath(pathname) &&
      existsSync(staticPath) &&
      statSync(staticPath).isFile()
    ) {
      sendFile(res, staticPath);
      return;
    }

    const assetsPath = join(distDir, pathname.replace(/^\//, ""));
    if (pathname.startsWith("/assets/") && existsSync(assetsPath)) {
      sendFile(res, assetsPath);
      return;
    }

    const ssrPath = isIndexHtmlPath(pathname) ? "/" : pathname;

    try {
      const result = await render(ssrPath, ORIGIN);

      if (!result) {
        sendHtml(res, spaFallbackPage(ssrPath));
        return;
      }

      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }

      if (looksLikeSpaShell(result.html)) {
        console.error(
          `WARNING: ${ssrPath} rendered the empty SPA shell — check dist-ssr build.`,
        );
      }

      sendHtml(res, result.html, result.status);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Curolia-Ssr-Preview", "1");
      res.end(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
    }
  });

  server.on("error", (error) => {
    if (error && "code" in error && error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} on ${HOST} is already in use. Stop the other server first.`,
      );
      console.error(
        "If you started Vite preview there, use ssr:preview instead (not npm run preview).",
      );
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  server.listen(PORT, HOST, async () => {
    const probe = await render("/", ORIGIN);
    const ok =
      probe?.status === 200 &&
      probe.html.includes("landing-hero") &&
      !looksLikeSpaShell(probe.html);

    console.log(`SSR preview at ${ORIGIN}`);
    console.log(
      ok
        ? "SSR self-check passed."
        : "WARNING: SSR self-check failed — rebuild with npm run build -w @curolia/web",
    );
    console.log(
      "Response header X-Curolia-Ssr-Preview: 1 confirms this server (not Vite preview).",
    );
    console.log(
      "Disable JavaScript, hard-refresh, or use a private window to avoid service-worker cache.",
    );
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
