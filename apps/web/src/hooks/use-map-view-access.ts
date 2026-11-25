import { mapViewHref, mapViewSegmentFromPathname } from "@/lib/app-paths";
import { mapRouteForMap, parseMapRoutePathname } from "@/lib/map-route";
import {
  normalizeMapViewSettings,
  resolveAccessibleMapView,
} from "@/lib/map-view-settings";
import { useMap } from "@/providers/map-provider";
import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Redirects away from disabled map views to the configured default. */
export function useMapViewAccess() {
  const { activeMap } = useMap();
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!activeMap?.owner_profile_slug || !activeMap.slug.trim()) return;

    // `activeMap` syncs from the pathname a render later; acting on a stale
    // map (e.g. right after switching maps) would bounce between both maps.
    const route = parseMapRoutePathname(location.pathname);
    if (
      !route ||
      route.profileSlug.trim().toLowerCase() !==
        activeMap.owner_profile_slug.trim().toLowerCase() ||
      route.mapSlug.trim().toLowerCase() !== activeMap.slug.trim().toLowerCase()
    ) {
      return;
    }

    const currentView = mapViewSegmentFromPathname(location.pathname);
    const settings = normalizeMapViewSettings(activeMap);
    const accessibleView = resolveAccessibleMapView(settings, currentView);
    if (accessibleView === currentView) return;

    navigate(
      `${mapViewHref(accessibleView, mapRouteForMap(activeMap))}${location.search}`,
      { replace: true },
    );
  }, [activeMap, location.pathname, location.search, navigate]);
}
