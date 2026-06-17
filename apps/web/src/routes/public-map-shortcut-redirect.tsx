import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { normalizeMapViewSettings } from "@/lib/map-view-settings";
import { useMap } from "@/providers/map-provider";
import { Navigate, useLocation } from "react-router-dom";

/** `/:profileSlug/:mapSlug` → default map view (preserves query). */
export function PublicMapShortcutRedirect() {
  const { search } = useLocation();
  const { activeMap, loading } = useMap();

  if (loading) {
    return <MapViewInitialLoader />;
  }

  const view = activeMap
    ? normalizeMapViewSettings(activeMap).defaultView
    : "map";

  return <Navigate to={`${view}${search}`} replace />;
}
