import { fetchPublicMapByRoute } from "@/lib/fetch-public-map";
import { parseMapRoutePathname } from "@/lib/map-route";
import {
  BLOCK_PUBLIC_CRAWLERS_ROBOTS,
  mapBlocksPublicCrawlers,
} from "@/lib/public-map-crawler-block";
import { maybeBlockCrawlerRequest } from "@/ssr/crawler-block";
import type { SpaPageMeta } from "@/ssr/seo";
import { DEFAULT_TITLE } from "@/ssr/seo";
import { createServerSupabase } from "@/ssr/server-supabase";

function joinOriginPath(origin: string, pathname: string): string {
  return `${origin.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export async function spaPublicMapGuard(
  pathname: string,
  origin: string,
  template: string,
  userAgent: string | null | undefined,
): Promise<{
  blocked?: { status: number; html: string; headers: Record<string, string> };
  spaMeta?: SpaPageMeta;
} | null> {
  const route = parseMapRoutePathname(pathname);
  if (!route) return null;

  const map = await fetchPublicMapByRoute(
    route.profileSlug,
    route.mapSlug,
    createServerSupabase(),
  );
  if (!map || !mapBlocksPublicCrawlers(map)) return null;

  const canonicalUrl = joinOriginPath(origin, pathname);
  const blocked = maybeBlockCrawlerRequest(
    map,
    userAgent,
    template,
    canonicalUrl,
  );
  if (blocked) {
    return {
      blocked: {
        status: blocked.status,
        html: blocked.html,
        headers: blocked.headers ?? {},
      },
    };
  }

  return {
    spaMeta: {
      title: DEFAULT_TITLE,
      robots: BLOCK_PUBLIC_CRAWLERS_ROBOTS,
    },
  };
}
