import type { CuroliaMap } from "@/types/database";

export type MapRoute = {
  profileSlug: string;
  mapSlug: string;
};

export type ParsedMapRoutePath = MapRoute & {
  view: "map" | "blog" | "settings";
};

export type ParsedPinRoutePath = MapRoute & {
  pinSlug: string;
};

const MAP_VIEW_PATH_RE = /^\/([^/]+)\/([^/]+)\/(map|blog|settings)\/?$/;
const PIN_PATH_RE = /^\/([^/]+)\/([^/]+)\/pin\/([^/]+)\/?$/;

export function parseMapViewPathname(
  pathname: string,
): ParsedMapRoutePath | null {
  const match = MAP_VIEW_PATH_RE.exec(pathname);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const view = match[3] as ParsedMapRoutePath["view"];
  return {
    profileSlug: decodeURIComponent(match[1]).trim(),
    mapSlug: decodeURIComponent(match[2]).trim(),
    view,
  };
}

export function parsePinRoutePathname(
  pathname: string,
): ParsedPinRoutePath | null {
  const match = PIN_PATH_RE.exec(pathname);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    profileSlug: decodeURIComponent(match[1]).trim(),
    mapSlug: decodeURIComponent(match[2]).trim(),
    pinSlug: decodeURIComponent(match[3]).trim(),
  };
}

export function parseMapRoutePathname(pathname: string): MapRoute | null {
  const mapView = parseMapViewPathname(pathname);
  if (mapView) {
    return {
      profileSlug: mapView.profileSlug,
      mapSlug: mapView.mapSlug,
    };
  }
  const pinRoute = parsePinRoutePathname(pathname);
  if (pinRoute) {
    return {
      profileSlug: pinRoute.profileSlug,
      mapSlug: pinRoute.mapSlug,
    };
  }
  return null;
}

export function isPublicMapViewPathname(pathname: string): boolean {
  const parsed = parseMapViewPathname(pathname);
  if (parsed && (parsed.view === "map" || parsed.view === "blog")) return true;
  return parsePinRoutePathname(pathname) !== null;
}

export function mapRouteFromParts(
  profileSlug: string,
  mapSlug: string,
): MapRoute {
  return {
    profileSlug: profileSlug.trim(),
    mapSlug: mapSlug.trim(),
  };
}

export function mapRouteForMap(
  map: CuroliaMap & { owner_profile_slug?: string },
  ownerProfileSlug?: string,
): MapRoute {
  return mapRouteFromParts(
    ownerProfileSlug ?? map.owner_profile_slug ?? "",
    map.slug,
  );
}

export async function fetchOwnerProfileSlugs(
  ownerIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ownerIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, slug")
    .in("id", unique);
  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row.slug]));
}

export function attachOwnerProfileSlugs<
  T extends CuroliaMap & { owner_profile_slug?: string },
>(
  maps: T[],
  slugByOwnerId: Map<string, string>,
): Array<T & { owner_profile_slug: string }> {
  return maps.map((map) => ({
    ...map,
    owner_profile_slug: slugByOwnerId.get(map.created_by_user_id) ?? "",
  }));
}
