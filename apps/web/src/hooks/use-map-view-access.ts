import { mapViewHref, mapViewSegmentFromPathname } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
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
