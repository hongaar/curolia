import { renderSsrRoute } from "@/ssr/render";
import { matchSsrRoute } from "@/ssr/routes";
import { enrichTemplateWithProductionStyles } from "@/ssr/stylesheets";

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

export async function render(
  pathname: string,
  origin: string,
  template = getSsrTemplate(),
): Promise<RenderResult | null> {
  const match = matchSsrRoute(pathname);
  if (!match) return null;

  const result = await renderSsrRoute(match, pathname, origin, template);
  if (!result) return null;

  if (result.status >= 300 && result.status < 400 && result.headers?.Location) {
    return result;
  }

  return result;
}
