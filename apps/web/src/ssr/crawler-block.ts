import type { MapWithOwnerSlug } from "@/lib/fetch-public-map";
import {
  BLOCK_PUBLIC_CRAWLERS_ROBOTS,
  crawlerBlockResponseHeaders,
  isLikelyCrawlerUserAgent,
  mapBlocksPublicCrawlers,
} from "@/lib/public-map-crawler-block";
import { assembleHtml, type PageMeta } from "@/ssr/render-document";
import { SITE_NAME } from "@/ssr/seo";

export type CrawlerBlockSsrResult = {
  status: number;
  html: string;
  headers?: Record<string, string>;
};

export function publicMapCrawlerBlockMeta(
  map: MapWithOwnerSlug,
): Pick<PageMeta, "robots"> | null {
  if (!mapBlocksPublicCrawlers(map)) return null;
  return { robots: BLOCK_PUBLIC_CRAWLERS_ROBOTS };
}

export function publicMapCrawlerBlockHeaders(
  map: MapWithOwnerSlug,
): Record<string, string> | null {
  if (!mapBlocksPublicCrawlers(map)) return null;
  return crawlerBlockResponseHeaders();
}

export function maybeBlockCrawlerRequest(
  map: MapWithOwnerSlug,
  userAgent: string | null | undefined,
  template: string,
  canonicalUrl: string,
): CrawlerBlockSsrResult | null {
  if (!mapBlocksPublicCrawlers(map)) return null;
  if (!isLikelyCrawlerUserAgent(userAgent)) return null;

  const title = `Map not available to crawlers — ${SITE_NAME}`;
  return {
    status: 403,
    headers: crawlerBlockResponseHeaders(),
    html: assembleHtml(
      template,
      {
        title,
        description:
          "The map owner asked Curolia not to serve this public map to automated crawlers.",
        robots: BLOCK_PUBLIC_CRAWLERS_ROBOTS,
        canonicalUrl,
      },
      "<main><h1>Map not available to crawlers</h1><p>This public map is not available to automated crawlers.</p></main>",
    ),
  };
}
