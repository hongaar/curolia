import { mapViewHref, mapViewSegmentFromPathname } from "@/lib/app-paths";
import { useMap } from "@/providers/map-provider";
import { useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Locks `activeMap` to `mapSlug` from the route. Invalid slugs normalize
 * onto the user's current map slug for the active view (map vs blog).
 */
export function useMapSlugRouteSync(mapSlug: string | undefined) {
  const { maps, loading, activeMapId, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedMap = useMemo(() => {
    if (!mapSlug) return null;
    const needle = mapSlug.trim().toLowerCase();
    return maps.find((j) => j.slug.toLowerCase() === needle) ?? null;
  }, [maps, mapSlug]);

  useLayoutEffect(() => {
    if (loading) return;
    if (maps.length === 0) return;
    if (!mapSlug) return;

    if (resolvedMap) {
      if (resolvedMap.id !== activeMapId) {
        setActiveMapId(resolvedMap.id);
      }
      return;
    }

    const fallback = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
    if (!fallback?.slug) return;

    const segment = mapViewSegmentFromPathname(location.pathname);
    navigate(`${mapViewHref(segment, fallback.slug)}${location.search}`, {
      replace: true,
    });
  }, [
    loading,
    maps,
    mapSlug,
    resolvedMap,
    activeMapId,
    setActiveMapId,
    navigate,
    location.pathname,
    location.search,
  ]);
}
