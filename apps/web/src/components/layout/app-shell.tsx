import { MainToolbar } from "@/components/layout/main-toolbar";
import { NotificationsRealtimeSync } from "@/components/layout/notifications-realtime-sync";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { useNativeBackButton } from "@/hooks/use-native-back-button";
import { useStackTransitions } from "@/hooks/use-stack-transitions";
import { reportAppError } from "@/lib/bugsink";
import { syncMapRouteDocumentClass } from "@/lib/map-chrome";
import {
  installStackChromeLayoutSync,
  syncStackChromeDocumentClass,
} from "@/lib/stack-chrome";
import { isStackRoute } from "@/lib/stack-routes";
import { useAuth } from "@/providers/auth-provider";
import { NavigationShellProvider } from "@/providers/navigation-shell-provider";
import { OnboardingPlacementProvider } from "@/providers/onboarding-placement-provider";
import { AppShellLayout } from "@curolia/ui/app-shell";
import { ErrorBoundary } from "@curolia/ui/error-boundary";
import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

function AppShellInner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const stackTransitions = useStackTransitions();
  const showMainToolbar = !stackTransitions || !isStackRoute(pathname);

  useLayoutEffect(() => {
    syncMapRouteDocumentClass(pathname);
    syncStackChromeDocumentClass(pathname);
  }, [pathname]);

  useEffect(() => {
    return installStackChromeLayoutSync(() => pathname);
  }, [pathname]);

  useNativeBackButton();

  return (
    <AppShellLayout
      notifications={
        user ? <NotificationsRealtimeSync userId={user.id} /> : null
      }
      header={showMainToolbar ? <MainToolbar /> : undefined}
    >
      <ErrorBoundary
        fallbackLayout="page"
        resetKeys={[pathname]}
        showErrorDetails={import.meta.env.DEV}
        onError={(error, errorInfo) => {
          reportAppError(error, errorInfo, "Route error");
        }}
      >
        <Outlet />
      </ErrorBoundary>
      {user ? <OnboardingTour key={user.id} /> : null}
    </AppShellLayout>
  );
}

export function AppShell() {
  return (
    <NavigationShellProvider>
      <OnboardingPlacementProvider>
        <AppShellInner />
      </OnboardingPlacementProvider>
    </NavigationShellProvider>
  );
}
