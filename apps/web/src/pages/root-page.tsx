import { HomeRedirectPage } from "@/pages/home-redirect-page";
import { useAuth } from "@/providers/auth-provider";
import { JournalProvider } from "@/providers/journal-provider";
import { Capacitor } from "@capacitor/core";
import { LandingPage } from "@curolia/ui/landing-page";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";
import { Navigate } from "react-router-dom";

/** `/` — marketing landing for guests; journal redirect for signed-in users. */
export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (user) {
    return (
      <JournalProvider>
        <HomeRedirectPage />
      </JournalProvider>
    );
  }

  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}
