import { renderSsrRoute } from "@/ssr/render";
import { matchSsrRoute } from "@/ssr/routes";
import { getSsrSmokeRoutes } from "@/ssr/smoke-routes";
import { enrichTemplateWithProductionStyles } from "@/ssr/stylesheets";

export { resolvePublicMapShortcutRedirect } from "@/lib/app-paths";
export { assembleHtml } from "@/ssr/render-document";
export { matchSpaPageMeta, renderSitemapXml } from "@/ssr/seo";
export { spaPublicMapGuard } from "@/ssr/spa-public-map-guard";
export { getSsrSmokeRoutes };

import "@curolia/ui/styles";

export { enrichTemplateWithProductionStyles };

export type RenderResult = {
  status: number;
  html: string;
  headers?: Record<string, string>;
};

let cachedTemplate: string | null = null;

export function setSsrTemplate(template: string): void {
  cachedTemplate = template;
}

export function getSsrTemplate(): string {
  if (!cachedTemplate) {
    throw new Error("SSR template has not been set");
  }
  return cachedTemplate;
}

export type RenderOptions = {
  template?: string;
  userAgent?: string | null;
};

export async function render(
  pathname: string,
  origin: string,
  options: RenderOptions = {},
): Promise<RenderResult | null> {
  const template = options.template ?? getSsrTemplate();
  const match = matchSsrRoute(pathname);
  if (!match) return null;

  const result = await renderSsrRoute(
    match,
    pathname,
    origin,
    template,
    options.userAgent,
  );
  if (!result) return null;

  if (result.status >= 300 && result.status < 400 && result.headers?.Location) {
    return result;
  }

  return result;
}
