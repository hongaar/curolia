import { mapViewHref, type MapWithOwnerSlug } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { normalizeMapViewSettings } from "@/lib/map-view-settings";

/** Home map view for the signed-in user (stored preference, else first owned map). */
export function resolveMemberMapHomeHref(
  memberMaps: MapWithOwnerSlug[],
  preferredMapId?: string | null,
): string {
  const fromPreferred = preferredMapId
    ? memberMaps.find((m) => m.id === preferredMapId)
    : null;
  const target = fromPreferred ?? memberMaps[0] ?? null;
  if (target?.owner_profile_slug && target.slug.trim()) {
    const { defaultView } = normalizeMapViewSettings(target);
    return mapViewHref(defaultView, mapRouteForMap(target));
  }
  return "/";
}
