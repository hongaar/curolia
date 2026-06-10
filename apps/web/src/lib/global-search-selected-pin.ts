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
import type { Pin } from "@/types/database";

export type GlobalSearchSelectedPin = {
  mapId: string;
  mapRoute: MapRoute;
  pin: Pin;
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

async function fetchPinRow(pinId: string): Promise<Pin | null> {
  const { data, error } = await supabase
    .from("pins")
    .select("*")
    .eq("id", pinId)
    .maybeSingle();
  if (error) throw error;
  return (data as Pin | null) ?? null;
}

export async function fetchGlobalSearchSelectedPin(
  lookup: SelectedPinLookup,
): Promise<GlobalSearchSelectedPin | null> {
  const token = lookup.pinToken.trim();
  if (!token) return null;

  let pinId: string | null = null;
  if (PIN_ID_PARAM_RE.test(token)) {
    pinId = token;
  } else {
    const resolved = await resolvePinByMapSlug(lookup.mapId, token);
    pinId = resolved?.pinId ?? null;
  }
  if (!pinId) return null;

  const pin = await fetchPinRow(pinId);
  if (!pin?.slug?.trim() || pin.map_id !== lookup.mapId) return null;

  return {
    mapId: lookup.mapId,
    mapRoute: lookup.mapRoute,
    pin,
  };
}
