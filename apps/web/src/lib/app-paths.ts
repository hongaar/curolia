import {
  applyAddPinToSearchParams,
  applySelectedPinToSearchParams,
  MAP_VIEW_PARAM,
  stripMapCameraFromSearchParams,
} from "@/lib/map-view-params";
import type { CuroliaMap } from "@/types/database";

export type MapViewSegment = "map" | "blog";

export function mapViewHref(view: MapViewSegment, mapSlug: string): string {
  return `/${view}/${mapSlug}`;
}

/** Map uses the fullscreen / overlay sidebar chrome. */
export function isMapFullscreenPathname(pathname: string): boolean {
  return pathname === "/" || /^\/map\/[^/]+\/?$/.test(pathname);
}

export function mapViewSegmentFromPathname(pathname: string): MapViewSegment {
  return pathname.startsWith("/blog/") ? "blog" : "map";
}

/** Switch between map and blog for the same map, keeping tag filters. */
export function mapViewSwitchHref(
  view: MapViewSegment,
  mapSlug: string,
  currentSearch: string = "",
): string {
  let p = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  p = stripMapCameraFromSearchParams(p);
  p.delete(MAP_VIEW_PARAM.pin);
  p.delete(MAP_VIEW_PARAM.add);
  const q = p.toString();
  const base = mapViewHref(view, mapSlug.trim());
  return q ? `${base}?${q}` : base;
}

export function mapSwitchHref(
  nextMap: CuroliaMap,
  currentPathname: string,
  currentSearch: string,
): string {
  const segment = mapViewSegmentFromPathname(currentPathname);
  const slug = nextMap.slug.trim();
  let p = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  p = stripMapCameraFromSearchParams(p);
  p.delete("filter");
  p.delete("tags");
  p.delete(MAP_VIEW_PARAM.pin);
  p.delete(MAP_VIEW_PARAM.add);
  const q = p.toString();
  const base = mapViewHref(segment, slug);
  return q ? `${base}?${q}` : base;
}

/** Stable pin detail URL: `/pins/:mapSlug/:pinSlug`. */
export function pinDetailHref(mapSlug: string, pinSlug: string): string {
  return `/pins/${mapSlug.trim()}/${pinSlug.trim()}`;
}

export function mapHrefWithSearch(
  mapSlug: string,
  searchParamsStr: string,
): string {
  const p = new URLSearchParams(
    searchParamsStr.startsWith("?")
      ? searchParamsStr.slice(1)
      : searchParamsStr,
  );
  const q = p.toString();
  const base = mapViewHref("map", mapSlug);
  return q ? `${base}?${q}` : base;
}

/** Map with add-pin placement mode enabled (preserves unrelated search params). */
export function mapAddPinHref(
  mapSlug: string,
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
  const base = mapViewHref("map", mapSlug);
  return q ? `${base}?${q}` : base;
}
