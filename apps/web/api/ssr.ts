import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { VercelRequest, VercelResponse } from "@vercel/node";

type SsrModule = {
  enrichTemplateWithProductionStyles: (
    template: string,
    assetsDir: string,
  ) => string;
  render: (
    pathname: string,
    origin: string,
    template?: string,
  ) => Promise<{
    status: number;
    html: string;
    headers?: Record<string, string>;
  } | null>;
  setSsrTemplate: (template: string) => void;
};

let ssrModule: SsrModule | null = null;
let templateLoaded = false;
let enrichedTemplate: string | null = null;

async function loadSsrModule(): Promise<SsrModule> {
  if (ssrModule) return ssrModule;

  const entryPath = join(process.cwd(), "dist-ssr/entry-server.js");
  ssrModule = (await import(pathToFileURL(entryPath).href)) as SsrModule;
  return ssrModule;
}

async function ensureTemplate(ssr: SsrModule): Promise<void> {
  if (templateLoaded) return;
  const template = readFileSync(join(process.cwd(), "dist/index.html"), "utf8");
  enrichedTemplate = ssr.enrichTemplateWithProductionStyles(
    template,
    join(process.cwd(), "dist", "assets"),
  );
  ssr.setSsrTemplate(enrichedTemplate);
  templateLoaded = true;
}

async function spaTemplate(ssr: SsrModule): Promise<string> {
  await ensureTemplate(ssr);
  return (
    enrichedTemplate ??
    readFileSync(join(process.cwd(), "dist/index.html"), "utf8")
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ssr = await loadSsrModule();
  await ensureTemplate(ssr);

  const host = req.headers.host ?? "localhost";
  const requestUrl = req.url ?? "/";
  const url = new URL(requestUrl, `https://${host}`);
  const origin = `${url.protocol}//${url.host}`;

  const result = await ssr.render(url.pathname, origin);

  if (!result) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.end(await spaTemplate(ssr));
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
