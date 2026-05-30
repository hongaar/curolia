import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";
import { JournalProvider } from "@/providers/journal-provider";
import { CuroliaLoadingSplash } from "@curolia/ui/curolia/loading-splash";

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading" />;
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return (
    <JournalProvider>
      <Outlet />
    </JournalProvider>
  );
}
