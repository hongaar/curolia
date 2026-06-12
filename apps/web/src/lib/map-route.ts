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
const PUBLIC_MAP_SHORTCUT_PATH_RE = /^\/([^/]+)\/([^/]+)\/?$/;

/** App routes that share `/:a/:b` shape but are not public map shortcuts. */
const PUBLIC_MAP_SHORTCUT_SKIP_FIRST_SEGMENTS = new Set([
  "for",
  "profile",
  "settings",
  "plugins",
  "notifications",
  "invitations",
  "map",
  "pins",
]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

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

export function parsePublicMapShortcutPathname(
  pathname: string,
): MapRoute | null {
  const match = PUBLIC_MAP_SHORTCUT_PATH_RE.exec(normalizePathname(pathname));
  if (!match?.[1] || !match?.[2]) return null;
  const profileSlug = decodeURIComponent(match[1]).trim();
  const mapSlug = decodeURIComponent(match[2]).trim();
  if (!profileSlug || !mapSlug) return null;
  if (PUBLIC_MAP_SHORTCUT_SKIP_FIRST_SEGMENTS.has(profileSlug.toLowerCase())) {
    return null;
  }
  return { profileSlug, mapSlug };
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
  return parsePublicMapShortcutPathname(pathname);
}

export function isPublicMapViewPathname(pathname: string): boolean {
  const parsed = parseMapViewPathname(pathname);
  if (parsed && (parsed.view === "map" || parsed.view === "blog")) return true;
  if (parsePinRoutePathname(pathname)) return true;
  return parsePublicMapShortcutPathname(pathname) !== null;
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
