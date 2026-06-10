import { parseMapViewPathname, parsePinRoutePathname } from "@/lib/map-route";

import { SSR_STATIC_PATHS, type StaticSsrRouteId } from "@/ssr/ssr-route-paths";

export {
  buildSsrNavigateFallbackDenylist,
  isDeniedByNavigateFallback,
  pathnameToNavigateDenylistRegex,
  SSR_DYNAMIC_NAVIGATE_DENYLIST,
  SSR_STATIC_PATHNAMES,
  SSR_STATIC_PATHS,
} from "@/ssr/ssr-route-paths";
export type { StaticSsrRouteId };

export type SsrRouteMatch =
  | { kind: "static"; id: StaticSsrRouteId; campaignId?: string }
  | {
      kind: "blog";
      profileSlug: string;
      mapSlug: string;
    }
  | {
      kind: "pin";
      profileSlug: string;
      mapSlug: string;
      pinSlug: string;
    };

const CAMPAIGN_PATH_RE = /^\/for\/([^/]+)\/?$/;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function matchSsrRoute(pathname: string): SsrRouteMatch | null {
  const path = normalizePathname(pathname);

  const staticId = SSR_STATIC_PATHS[path];
  if (staticId) {
    return { kind: "static", id: staticId };
  }

  const campaignMatch = CAMPAIGN_PATH_RE.exec(path);
  if (campaignMatch?.[1]) {
    return {
      kind: "static",
      id: "campaign",
      campaignId: decodeURIComponent(campaignMatch[1]).trim(),
    };
  }

  const mapView = parseMapViewPathname(path);
  if (mapView?.view === "blog") {
    return {
      kind: "blog",
      profileSlug: mapView.profileSlug,
      mapSlug: mapView.mapSlug,
    };
  }

  const pinRoute = parsePinRoutePathname(path);
  if (pinRoute) {
    return {
      kind: "pin",
      profileSlug: pinRoute.profileSlug,
      mapSlug: pinRoute.mapSlug,
      pinSlug: pinRoute.pinSlug,
    };
  }

  return null;
}

export function isSsrPathname(pathname: string): boolean {
  return matchSsrRoute(pathname) !== null;
}
