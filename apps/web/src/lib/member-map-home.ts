import { mapViewHref, type MapWithOwnerSlug } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";

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
    return mapViewHref("map", mapRouteForMap(target));
  }
  return "/";
}
