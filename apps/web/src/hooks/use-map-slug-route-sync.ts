import {
  mapViewHref,
  mapViewSegmentFromPathname,
  pinDetailHref,
} from "@/lib/app-paths";
import { parsePinRoutePathname } from "@/lib/map-route";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import { useMap } from "@/providers/map-provider";
import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Canonicalizes redirect slugs in the URL for map / pin routes.
 * Active map selection is owned by `MapProvider` (from `location.pathname`).
 */
export function useMapSlugRouteSync(
  profileSlug: string | undefined,
  mapSlug: string | undefined,
) {
  const { maps } = useMap();
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    if (!profileSlug?.trim() || !mapSlug?.trim()) return;

    let cancelled = false;
    void (async () => {
      const profile = await resolveProfileBySlug(profileSlug);
      if (!profile || cancelled) return;

      const map = await resolveMapByOwnerSlug(profile.profileId, mapSlug);
      if (!map || cancelled) return;

      const memberMap = maps.find((m) => m.id === map.mapId);
      const canonicalProfile =
        memberMap?.owner_profile_slug ?? profile.canonicalSlug;
      const canonicalMap = memberMap?.slug ?? map.canonicalSlug;

      if (
        canonicalProfile.trim().toLowerCase() ===
          profileSlug.trim().toLowerCase() &&
        canonicalMap.trim().toLowerCase() === mapSlug.trim().toLowerCase()
      ) {
        return;
      }

      const route = {
        profileSlug: canonicalProfile,
        mapSlug: canonicalMap,
      };
      const pinRoute = parsePinRoutePathname(location.pathname);
      if (pinRoute) {
        navigate(pinDetailHref(route, pinRoute.pinSlug), { replace: true });
        return;
      }
      const view = mapViewSegmentFromPathname(location.pathname);
      navigate(mapViewHref(view, route), { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [profileSlug, mapSlug, maps, navigate, location.pathname]);
}
