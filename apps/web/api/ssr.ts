import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  assembleHtml,
  matchSpaPageMeta,
  render,
  resolvePublicMapShortcutRedirect,
  setSsrTemplate,
  spaPublicMapGuard,
} from "./_ssr/entry-server.js";

type SsrRenderResult = {
  status: number;
  html: string;
  headers?: Record<string, string>;
};

const apiDir = dirname(fileURLToPath(import.meta.url));
const templatePath = join(apiDir, "_ssr/template.html");

let templateLoaded = false;
let enrichedTemplate: string | null = null;

function ensureTemplate(): void {
  if (templateLoaded) return;
  enrichedTemplate = readFileSync(templatePath, "utf8");
  setSsrTemplate(enrichedTemplate);
  templateLoaded = true;
}

function spaTemplate(): string {
  ensureTemplate();
  return enrichedTemplate ?? readFileSync(templatePath, "utf8");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  ensureTemplate();

  const host = req.headers.host ?? "localhost";
  const requestUrl = req.url ?? "/";
  const url = new URL(requestUrl, `https://${host}`);
  const origin = `${url.protocol}//${url.host}`;

  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"]
      : null;

  const shortcutRedirect = resolvePublicMapShortcutRedirect(url.pathname);
  if (shortcutRedirect) {
    const location = `${shortcutRedirect}${url.search}`;
    res.statusCode = 301;
    res.setHeader("Location", location);
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.end("");
    return;
  }

  const result = (await render(url.pathname, origin, {
    userAgent,
  })) as SsrRenderResult | null;

  if (!result) {
    const publicMapGuard = await spaPublicMapGuard(
      url.pathname,
      origin,
      spaTemplate(),
      userAgent,
    );
    if (publicMapGuard?.blocked) {
      for (const [key, value] of Object.entries(
        publicMapGuard.blocked.headers,
      )) {
        res.setHeader(key, value);
      }
      res.statusCode = publicMapGuard.blocked.status;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "private, no-store");
      res.end(publicMapGuard.blocked.html);
      return;
    }

    const spaMeta = publicMapGuard?.spaMeta ?? matchSpaPageMeta(url.pathname);
    const html = spaMeta
      ? assembleHtml(
          spaTemplate(),
          {
            ...spaMeta,
            canonicalUrl: `${origin}${url.pathname}`,
          },
          "",
        )
      : spaTemplate();

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.end(html);
    return;
  }

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
  }

  res.statusCode = result.status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!result.headers?.Location) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  }
  res.end(result.html);
}
