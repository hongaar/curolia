import { isDiscoverPathname } from "@/lib/discover-routes";
import { isPublicProfileViewPathname } from "@/lib/profile-route";
import { isPublicMapViewPathname } from "@/lib/public-map-routes";
import {
  consumeSkipLoginNextRedirect,
  useAuth,
} from "@/providers/auth-provider";
import { GlobalSearchPlaceProvider } from "@/providers/global-search-place-provider";
import { MapProvider } from "@/providers/map-provider";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const discoverView = isDiscoverPathname(location.pathname);
  const publicMapView = !user && isPublicMapViewPathname(location.pathname);
  const publicProfileView =
    !user && isPublicProfileViewPathname(location.pathname);
  const publicView = publicMapView || publicProfileView || discoverView;

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (!user && !publicView) {
    if (consumeSkipLoginNextRedirect()) {
      return <Navigate to="/login" replace />;
    }
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return (
    <MapProvider publicView={publicMapView}>
      <GlobalSearchPlaceProvider>
        <Outlet />
      </GlobalSearchPlaceProvider>
    </MapProvider>
  );
}
