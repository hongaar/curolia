import {
  AppShellFrame,
  SignedInAppProviders,
} from "@/components/layout/app-shell";
import { RootMapRedirect } from "@/components/root/root-map-redirect";
import { useAuth } from "@/providers/auth-provider";
import { ExploreProvider } from "@/providers/explore-provider";
import { GlobalSearchPlaceProvider } from "@/providers/global-search-place-provider";
import { MapProvider } from "@/providers/map-provider";
import { Capacitor } from "@capacitor/core";
import { LandingPage, NativeAppLandingPage } from "@curolia/site/pages";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";

/** `/` — marketing landing for guests; active map redirect for signed-in users. */
export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (user) {
    return (
      <MapProvider>
        <ExploreProvider>
          <GlobalSearchPlaceProvider>
            <SignedInAppProviders>
              <AppShellFrame>
                <RootMapRedirect />
              </AppShellFrame>
            </SignedInAppProviders>
          </GlobalSearchPlaceProvider>
        </ExploreProvider>
      </MapProvider>
    );
  }

  if (Capacitor.isNativePlatform()) {
    return <NativeAppLandingPage />;
  }

  return <LandingPage />;
}
