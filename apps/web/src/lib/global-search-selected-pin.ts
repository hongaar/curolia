import type { MapWithOwnerSlug } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import {
  mapRouteForMap,
  parseMapViewPathname,
  parsePinRoutePathname,
} from "@/lib/map-route";
import {
  PIN_ID_PARAM_RE,
  parseSelectedPinTokenFromSearchParams,
} from "@/lib/map-view-params";
import { resolvePinByMapSlug } from "@/lib/resolve-pin-slug";
import { supabase } from "@/lib/supabase";

export type GlobalSearchSelectedPin = {
  mapId: string;
  mapRoute: MapRoute;
  pinSlug: string;
  pinTitle: string | null;
};

export type SelectedPinLookup = {
  mapId: string;
  mapRoute: MapRoute;
  pinToken: string;
};

export function parseSelectedPinLookup(
  pathname: string,
  search: string,
  maps: MapWithOwnerSlug[],
  activeMap: MapWithOwnerSlug | null,
): SelectedPinLookup | null {
  const pinPath = parsePinRoutePathname(pathname);
  if (pinPath) {
    const map = maps.find(
      (entry) =>
        entry.owner_profile_slug?.trim() === pinPath.profileSlug &&
        entry.slug.trim() === pinPath.mapSlug,
    );
    if (!map) return null;
    return {
      mapId: map.id,
      mapRoute: {
        profileSlug: pinPath.profileSlug,
        mapSlug: pinPath.mapSlug,
      },
      pinToken: pinPath.pinSlug,
    };
  }

  const mapView = parseMapViewPathname(pathname);
  const onHomeMap = pathname === "/";
  if (!onHomeMap && mapView?.view !== "map") return null;

  const pinToken = parseSelectedPinTokenFromSearchParams(
    new URLSearchParams(search),
  );
  if (
    !pinToken ||
    !activeMap?.owner_profile_slug?.trim() ||
    !activeMap.slug?.trim()
  ) {
    return null;
  }

  return {
    mapId: activeMap.id,
    mapRoute: mapRouteForMap(activeMap),
    pinToken,
  };
}

export async function fetchGlobalSearchSelectedPin(
  lookup: SelectedPinLookup,
): Promise<GlobalSearchSelectedPin | null> {
  const token = lookup.pinToken.trim();
  if (!token) return null;

  if (PIN_ID_PARAM_RE.test(token)) {
    const { data, error } = await supabase
      .from("pins")
      .select("id, slug, title, map_id")
      .eq("map_id", lookup.mapId)
      .eq("id", token)
      .maybeSingle();
    if (error) throw error;
    if (!data?.slug?.trim()) return null;
    return {
      mapId: lookup.mapId,
      mapRoute: lookup.mapRoute,
      pinSlug: data.slug,
      pinTitle: data.title,
    };
  }

  const resolved = await resolvePinByMapSlug(lookup.mapId, token);
  if (!resolved) return null;

  const { data, error } = await supabase
    .from("pins")
    .select("title")
    .eq("id", resolved.pinId)
    .maybeSingle();
  if (error) throw error;

  return {
    mapId: lookup.mapId,
    mapRoute: lookup.mapRoute,
    pinSlug: resolved.canonicalSlug,
    pinTitle: data?.title ?? null,
  };
}
