import { useMap } from "@/providers/map-provider";
import { useLayoutEffect, useMemo } from "react";

/**
 * Keeps `activeMap` aligned with `mapSlug` from the route when the slug resolves.
 * Unavailable slugs stay on the URL so pages can show an access message.
 */
export function useMapSlugRouteSync(mapSlug: string | undefined) {
  const { maps, loading, activeMapId, setActiveMapId } = useMap();

  const resolvedMap = useMemo(() => {
    if (!mapSlug) return null;
    const needle = mapSlug.trim().toLowerCase();
    return maps.find((j) => j.slug.toLowerCase() === needle) ?? null;
  }, [maps, mapSlug]);

  useLayoutEffect(() => {
    if (loading) return;
    if (!mapSlug || !resolvedMap) return;

    if (resolvedMap.id !== activeMapId) {
      setActiveMapId(resolvedMap.id);
    }
  }, [loading, mapSlug, resolvedMap, activeMapId, setActiveMapId]);
}
