import { mapViewHref, mapViewSegmentFromPathname } from "@/lib/app-paths";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import { useMap } from "@/providers/map-provider";
import { useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Keeps `activeMap` aligned with route profile/map slugs when they resolve.
 * Canonicalizes redirect slugs in the URL.
 */
export function useMapSlugRouteSync(
  profileSlug: string | undefined,
  mapSlug: string | undefined,
) {
  const { maps, loading, activeMapId, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedMap = useMemo(() => {
    if (!profileSlug?.trim() || !mapSlug?.trim()) return null;
    const profileNeedle = profileSlug.trim().toLowerCase();
    const mapNeedle = mapSlug.trim().toLowerCase();
    return (
      maps.find(
        (m) =>
          m.owner_profile_slug.trim().toLowerCase() === profileNeedle &&
          m.slug.trim().toLowerCase() === mapNeedle,
      ) ?? null
    );
  }, [maps, profileSlug, mapSlug]);

  useLayoutEffect(() => {
    if (loading) return;
    if (!profileSlug?.trim() || !mapSlug?.trim()) return;
    if (resolvedMap && resolvedMap.id !== activeMapId) {
      setActiveMapId(resolvedMap.id);
    }
  }, [loading, profileSlug, mapSlug, resolvedMap, activeMapId, setActiveMapId]);

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

      const view = mapViewSegmentFromPathname(location.pathname);
      navigate(
        mapViewHref(view, {
          profileSlug: canonicalProfile,
          mapSlug: canonicalMap,
        }),
        { replace: true },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [profileSlug, mapSlug, maps, navigate, location.pathname]);
}
