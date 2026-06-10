import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  enrichTemplateWithProductionStyles,
  render,
  setSsrTemplate,
} from "../dist-ssr/entry-server.js";

let templateLoaded = false;
let enrichedTemplate: string | null = null;

function ensureTemplate(): void {
  if (templateLoaded) return;
  const template = readFileSync(join(process.cwd(), "dist/index.html"), "utf8");
  enrichedTemplate = enrichTemplateWithProductionStyles(
    template,
    join(process.cwd(), "dist", "assets"),
  );
  setSsrTemplate(enrichedTemplate);
  templateLoaded = true;
}

function spaTemplate(): string {
  ensureTemplate();
  return (
    enrichedTemplate ??
    readFileSync(join(process.cwd(), "dist/index.html"), "utf8")
  );
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

  const result = await render(url.pathname, origin);

  if (!result) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.end(spaTemplate());
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
