import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { mapViewHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { useMap } from "@/providers/map-provider";
import { Navigate } from "react-router-dom";

/** `/` — redirect to the user's map URL for the active map. */
export function HomeRedirectPage() {
  const { maps, activeMap, loading } = useMap();
  const map = activeMap ?? maps[0];

  if (loading) {
    return <MapViewInitialLoader />;
  }
  if (!map?.slug || !map.owner_profile_slug) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  return <Navigate to={mapViewHref("map", mapRouteForMap(map))} replace />;
}

/** Legacy `/blog` — redirect using the active map slug. */
export function BlogHomeRedirectPage() {
  const { maps, activeMap, loading } = useMap();
  const map = activeMap ?? maps[0];

  if (loading) {
    return <MapViewInitialLoader />;
  }
  if (!map?.slug || !map.owner_profile_slug) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  return <Navigate to={mapViewHref("blog", mapRouteForMap(map))} replace />;
}
