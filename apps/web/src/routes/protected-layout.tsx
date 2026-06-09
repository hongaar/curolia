import { isPublicMapViewPathname } from "@/lib/public-map-routes";
import {
  consumeSkipLoginNextRedirect,
  useAuth,
} from "@/providers/auth-provider";
import { MapProvider } from "@/providers/map-provider";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const publicMapView = !user && isPublicMapViewPathname(location.pathname);

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (!user && !publicMapView) {
    if (consumeSkipLoginNextRedirect()) {
      return <Navigate to="/login" replace />;
    }
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return (
    <MapProvider publicView={publicMapView}>
      <Outlet />
    </MapProvider>
  );
}
