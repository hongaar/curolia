import { HomeRedirectPage } from "@/pages/home-redirect-page";
import { useAuth } from "@/providers/auth-provider";
import { JournalProvider } from "@/providers/journal-provider";
import { LandingPage } from "@curolia/ui/landing-page";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";

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

  return <LandingPage />;
}
