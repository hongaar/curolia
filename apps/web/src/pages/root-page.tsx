import {
  AppShellFrame,
  SignedInAppProviders,
} from "@/components/layout/app-shell";
import { HomeFeedPage } from "@/pages/home-feed-page";
import { useAuth } from "@/providers/auth-provider";
import { GlobalSearchPlaceProvider } from "@/providers/global-search-place-provider";
import { MapProvider } from "@/providers/map-provider";
import { Capacitor } from "@capacitor/core";
import { LandingPage, NativeAppLandingPage } from "@curolia/site/pages";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";

/** `/` — marketing landing for guests; home feed for signed-in users. */
export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (user) {
    return (
      <MapProvider>
        <GlobalSearchPlaceProvider>
          <SignedInAppProviders>
            <AppShellFrame>
              <HomeFeedPage />
            </AppShellFrame>
          </SignedInAppProviders>
        </GlobalSearchPlaceProvider>
      </MapProvider>
    );
  }

  if (Capacitor.isNativePlatform()) {
    return <NativeAppLandingPage />;
  }

  return <LandingPage />;
}
