import { HomeRedirectPage } from "@/pages/home-redirect-page";
import { useAuth } from "@/providers/auth-provider";
import { MapProvider } from "@/providers/map-provider";
import { Capacitor } from "@capacitor/core";
import { LandingPage } from "@curolia/site/pages";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";
import { Navigate } from "react-router-dom";

/** `/` — marketing landing for guests; map redirect for signed-in users. */
export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (user) {
    return (
      <MapProvider>
        <HomeRedirectPage />
      </MapProvider>
    );
  }

  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}
