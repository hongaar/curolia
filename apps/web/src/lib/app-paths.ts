import type { MapRoute } from "@/lib/map-route";
import {
  applyAddPinToSearchParams,
  applySelectedPinToSearchParams,
  MAP_VIEW_PARAM,
  stripMapCameraFromSearchParams,
} from "@/lib/map-view-params";
import type { CuroliaMap } from "@/types/database";

export type MapViewSegment = "map" | "blog";

export type MapWithOwnerSlug = CuroliaMap & { owner_profile_slug: string };

export function mapViewHref(view: MapViewSegment, route: MapRoute): string {
  return `/${route.profileSlug.trim()}/${route.mapSlug.trim()}/${view}`;
}

/** Map settings stack route: `/:profileSlug/:mapSlug/settings`. */
export function mapSettingsHref(route: MapRoute): string {
  return `/${route.profileSlug.trim()}/${route.mapSlug.trim()}/settings`;
}

/** Resolve a map from settings route params (slug, or legacy UUID). */
export function resolveMapFromSettingsParam(
  maps: Array<CuroliaMap & { owner_profile_slug?: string }>,
  profileSlug: string | undefined,
  mapSlug: string | undefined,
): (CuroliaMap & { owner_profile_slug?: string }) | null {
  if (!mapSlug?.trim()) return null;
  const mapNeedle = mapSlug.trim().toLowerCase();
  const profileNeedle = profileSlug?.trim().toLowerCase();

  const bySlugs = maps.find((m) => {
    if (m.slug.trim().toLowerCase() !== mapNeedle) return false;
    if (!profileNeedle) return true;
    return (m.owner_profile_slug ?? "").trim().toLowerCase() === profileNeedle;
  });
  if (bySlugs) return bySlugs;

  return maps.find((m) => m.id === mapSlug) ?? null;
}

/** Map uses fullscreen chrome (floating toolbar, no page chrome). */
export function isMapFullscreenPathname(pathname: string): boolean {
  return pathname === "/" || /^\/[^/]+\/[^/]+\/map\/?$/.test(pathname);
}

export function mapViewSegmentFromPathname(pathname: string): MapViewSegment {
  return pathname.includes("/blog") ? "blog" : "map";
}

/** Switch between map and blog for the same map, keeping tag filters. */
export function mapViewSwitchHref(
  view: MapViewSegment,
  route: MapRoute,
  currentSearch: string = "",
): string {
  let p = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  p = stripMapCameraFromSearchParams(p);
  p.delete(MAP_VIEW_PARAM.pin);
  p.delete(MAP_VIEW_PARAM.add);
  const q = p.toString();
  const base = mapViewHref(view, route);
  return q ? `${base}?${q}` : base;
}

export function mapSwitchHref(
  nextMap: MapWithOwnerSlug,
  currentPathname: string,
  currentSearch: string,
): string {
  const segment = mapViewSegmentFromPathname(currentPathname);
  const route = {
    profileSlug: nextMap.owner_profile_slug,
    mapSlug: nextMap.slug,
  };
  let p = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  p = stripMapCameraFromSearchParams(p);
  p.delete("filter");
  p.delete("tags");
  p.delete(MAP_VIEW_PARAM.pin);
  p.delete(MAP_VIEW_PARAM.add);
  const q = p.toString();
  const base = mapViewHref(segment, route);
  return q ? `${base}?${q}` : base;
}

/** Stable pin detail URL: `/:profileSlug/:mapSlug/pin/:pinSlug`. */
export function pinDetailHref(route: MapRoute, pinSlug: string): string {
  return `/${route.profileSlug.trim()}/${route.mapSlug.trim()}/pin/${pinSlug.trim()}`;
}

/** Pin editor stack route: `/:profileSlug/:mapSlug/pin/:pinSlug/edit`. */
export function pinEditHref(route: MapRoute, pinSlug: string): string {
  return `${pinDetailHref(route, pinSlug)}/edit`;
}

export function mapHrefWithSearch(
  route: MapRoute,
  searchParamsStr: string,
): string {
  const p = new URLSearchParams(
    searchParamsStr.startsWith("?")
      ? searchParamsStr.slice(1)
      : searchParamsStr,
  );
  const q = p.toString();
  const base = mapViewHref("map", route);
  return q ? `${base}?${q}` : base;
}

/** Map with add-pin dialog open (preserves unrelated search params). */
export function mapAddPinHref(
  route: MapRoute,
  searchParams: URLSearchParams | string = "",
): string {
  const p =
    typeof searchParams === "string"
      ? new URLSearchParams(
          searchParams.startsWith("?") ? searchParams.slice(1) : searchParams,
        )
      : new URLSearchParams(searchParams);
  const next = applyAddPinToSearchParams(
    applySelectedPinToSearchParams(p, null),
    true,
  );
  const q = next.toString();
  const base = mapViewHref("map", route);
  return q ? `${base}?${q}` : base;
}
