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

const LEGACY_MAP_PATH_RE = /^\/map\/([^/]+)\/?$/;
const LEGACY_BLOG_PATH_RE = /^\/blog\/([^/]+)\/?$/;
const LEGACY_PIN_PATH_RE = /^\/pins\/([^/]+)\/([^/]+)\/?$/;
const LEGACY_SETTINGS_PATH_RE = /^\/maps\/([^/]+)\/settings\/?$/;

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

export function parseLegacyMapPathname(
  pathname: string,
): { mapSlug: string; view: "map" | "blog" } | null {
  const mapMatch = LEGACY_MAP_PATH_RE.exec(pathname);
  if (mapMatch?.[1]) {
    return { mapSlug: decodeURIComponent(mapMatch[1]).trim(), view: "map" };
  }
  const blogMatch = LEGACY_BLOG_PATH_RE.exec(pathname);
  if (blogMatch?.[1]) {
    return { mapSlug: decodeURIComponent(blogMatch[1]).trim(), view: "blog" };
  }
  return null;
}

export function parseLegacyPinPathname(
  pathname: string,
): { mapSlug: string; pinSlug: string } | null {
  const match = LEGACY_PIN_PATH_RE.exec(pathname);
  if (!match?.[1] || !match[2]) return null;
  return {
    mapSlug: decodeURIComponent(match[1]).trim(),
    pinSlug: decodeURIComponent(match[2]).trim(),
  };
}

export function parseLegacyMapSettingsPathname(
  pathname: string,
): { mapSlug: string } | null {
  const match = LEGACY_SETTINGS_PATH_RE.exec(pathname);
  if (!match?.[1]) return null;
  return { mapSlug: decodeURIComponent(match[1]).trim() };
}

export function isPublicMapViewPathname(pathname: string): boolean {
  const parsed = parseMapViewPathname(pathname);
  if (parsed && (parsed.view === "map" || parsed.view === "blog")) return true;
  return parseLegacyMapPathname(pathname) !== null;
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
